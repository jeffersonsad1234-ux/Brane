"""
BRANPY AI — TREINO FINAL V3
- Tokenizer BPE melhorado (word-level, 32K vocab)
- Modelo 50M params
- SGD + momentum (economia de RAM)
- fp16 mixed precision (economia de RAM)
- Dados todos os corpus (25K+ pares)
- Formato claro P: / R:
"""
import os, json, time, math, re, gc
from pathlib import Path

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from torch.amp import autocast
from tokenizers import Tokenizer, models, trainers, pre_tokenizers

BASE = Path(__file__).parent
WEIGHTS = BASE / "weights" / "branpy_final"
WEIGHTS.mkdir(parents=True, exist_ok=True)
DATA_DIR = BASE / "data"
TOK_PATH = BASE / "tokenizer_final.json"
LOG_OUT = BASE / "train_final_output.log"
LOG_ERR = BASE / "train_final_error.log"

# ─── TOKENIZER ───────────────────────────────────────────────
def build_tokenizer():
    if TOK_PATH.exists():
        tok = Tokenizer.from_file(str(TOK_PATH))
        print(f"Tokenizer carregado: {tok.get_vocab_size()} tokens")
        return tok
    
    print("Construindo tokenizer BPE (8K)...")
    tok = Tokenizer(models.BPE(unk_token="<unk>"))
    tok.pre_tokenizer = pre_tokenizers.Whitespace()
    trainer = trainers.BpeTrainer(
        vocab_size=8000,
        special_tokens=["<pad>", "<s>", "</s>", "<unk>", "<sep>", "<bos>", "<eos>"],
        min_frequency=3,
    )
    files = [str(f) for f in DATA_DIR.glob("*.txt")]
    tok.train(files, trainer)
    tok.save(str(TOK_PATH))
    print(f"Tokenizer: {tok.get_vocab_size()} tokens")
    return tok

# ─── DADOS ───────────────────────────────────────────────────
def load_corpus():
    all_pairs = []
    for fpath in sorted(DATA_DIR.glob("*.txt")):
        with open(fpath, "r", encoding="utf-8", errors="replace") as f:
            text = f.read()
        
        lines = text.split("\n")
        has_labels = any(re.match(r'^(Humor|Human|Pergunta|P)\s*:', l) for l in lines[:50])
        
        if has_labels:
            for block in re.split(r'(?=(?:^|\n)(?:Humor|Human)\s*:)', text):
                block = block.strip()
                if not block:
                    continue
                m_q = re.match(r'^(?:Humor|Human)\s*:\s*(.+)', block)
                if not m_q:
                    continue
                q = m_q.group(1).strip()
                rest = block[m_q.end():].strip()
                m_ia = re.search(r'^(?:IA|AI|Resposta)\s*:\s*', rest, re.MULTILINE)
                a = rest[m_ia.end():].strip() if m_ia else rest
                a = re.sub(r'\s+', ' ', a).strip()
                q = re.sub(r'\s+', ' ', q).strip()
                if len(q) > 3 and len(a) > 10:
                    all_pairs.append((q, a))
        else:
            non_empty = [l.strip() for l in lines if l.strip()]
            i = 0
            while i < len(non_empty) - 1:
                q, a = non_empty[i], non_empty[i + 1]
                if len(q) > 3 and len(a) > 10 and not q.startswith('#'):
                    all_pairs.append((q, a))
                i += 2
    
    seen = set()
    unique = []
    for q, a in all_pairs:
        key = (q.lower().strip(), a.lower().strip()[:80])
        if key not in seen:
            seen.add(key)
            unique.append((q, a))
    
    print(f"Pares Q/A: {len(unique)}")
    return unique


class ChatDataset(Dataset):
    def __init__(self, pairs, tokenizer, max_len=256):
        self.examples = []
        self.tok = tokenizer
        self.max_len = max_len
        s_id = tokenizer.token_to_id("<s>") or 0
        sep_id = tokenizer.token_to_id("<sep>") or 4
        e_id = tokenizer.token_to_id("</s>") or 2
        pad_id = tokenizer.token_to_id("<pad>") or 0
        self.pad_id = pad_id
        
        for q, a in pairs:
            text = f"<s> P: {q} <sep> R: {a} </s>"
            enc = tokenizer.encode(text)
            ids = enc.ids[:max_len]
            if len(ids) > 5:
                self.examples.append(torch.tensor(ids, dtype=torch.long))
        
        print(f"Dataset: {len(self.examples)} exemplos")
    
    def __len__(self):
        return len(self.examples)
    
    def __getitem__(self, idx):
        ids = self.examples[idx]
        T = self.max_len
        if len(ids) < T:
            ids = torch.cat([ids, torch.full((T - len(ids),), self.pad_id, dtype=torch.long)])
        else:
            ids = ids[:T]
        return ids[:-1], ids[1:]


# ─── MODELO 50M ─────────────────────────────────────────────
class Block(nn.Module):
    def __init__(self, d_model, n_heads, d_ff, dropout=0.1):
        super().__init__()
        self.ln1 = nn.LayerNorm(d_model)
        self.qkv = nn.Linear(d_model, 3 * d_model)
        self.proj = nn.Linear(d_model, d_model)
        self.ln2 = nn.LayerNorm(d_model)
        self.ff = nn.Sequential(
            nn.Linear(d_model, d_ff), nn.GELU(),
            nn.Dropout(dropout), nn.Linear(d_ff, d_model), nn.Dropout(dropout),
        )
        self.n_heads = n_heads
        self.d_head = d_model // n_heads
        self.drop = nn.Dropout(dropout)
    
    def forward(self, x, mask):
        B, T, C = x.shape
        h = self.ln1(x)
        qkv = self.qkv(h).reshape(B, T, 3, self.n_heads, self.d_head).permute(2, 0, 3, 1, 4)
        q, k, v = qkv.unbind(0)
        att = (q @ k.transpose(-2, -1)) / math.sqrt(self.d_head)
        att = att.masked_fill(mask == 0, float('-inf'))
        att = F.softmax(att, dim=-1)
        x = x + self.drop(att @ v).transpose(1, 2).reshape(B, T, C)
        x = x + self.ff(self.ln2(x))
        return x


class BranPy(nn.Module):
    def __init__(self, vocab, d_model=768, n_layers=12, n_heads=12, d_ff=3072, max_len=256, dropout=0.1):
        super().__init__()
        self.tok_emb = nn.Embedding(vocab, d_model)
        self.pos_emb = nn.Embedding(max_len, d_model)
        self.drop = nn.Dropout(dropout)
        self.blocks = nn.ModuleList([
            Block(d_model, n_heads, d_ff, dropout) for _ in range(n_layers)
        ])
        self.ln = nn.LayerNorm(d_model)
        self.head = nn.Linear(d_model, vocab, bias=False)
        self.head.weight = self.tok_emb.weight
        n = sum(p.numel() for p in self.parameters())
        print(f"Modelo: {n/1e6:.1f}M params | d={d_model} layers={n_layers} heads={n_heads} d_ff={d_ff}")
    
    def forward(self, idx, targets=None):
        B, T = idx.shape
        mask = torch.tril(torch.ones(T, T, device=idx.device)).unsqueeze(0).unsqueeze(0)
        x = self.drop(self.tok_emb(idx) + self.pos_emb(torch.arange(T, device=idx.device)))
        for blk in self.blocks:
            x = blk(x, mask)
        logits = self.head(self.ln(x))
        if targets is not None:
            loss = F.cross_entropy(logits.view(-1, logits.size(-1)), targets.view(-1), ignore_index=0)
            return logits, loss
        return logits, None


# ─── GERAÇÃO ─────────────────────────────────────────────────
@torch.no_grad()
def generate(model, tok, prompt, max_new=200, temperature=0.8, top_k=50, top_p=0.9):
    model.eval()
    text = f"<s> P: {prompt} <sep> R:"
    enc = tok.encode(text)
    ids = list(enc.ids)
    input_ids = torch.tensor([ids], dtype=torch.long)
    
    for _ in range(max_new):
        idx_cond = input_ids[:, -128:]
        logits, _ = model(idx_cond)
        logits = logits[:, -1, :] / max(temperature, 0.01)
        
        if top_k > 0:
            v, _ = torch.topk(logits, min(top_k, logits.size(-1)))
            logits[logits < v[:, [-1]]] = float('-inf')
        
        if top_p < 1.0:
            sorted_logits, sorted_idx = torch.sort(logits, descending=True)
            cumulative = torch.cumsum(F.softmax(sorted_logits, dim=-1), dim=-1)
            mask = cumulative > top_p
            mask[:, 0] = False
            sorted_logits[mask] = float('-inf')
            logits = sorted_logits.scatter(1, sorted_idx.argsort(1), sorted_logits)
        
        probs = F.softmax(logits, dim=-1)
        next_id = torch.multinomial(probs, 1)
        
        if next_id.item() in (0, 2):  # pad or </s>
            break
        
        input_ids = torch.cat([input_ids, next_id], dim=1)
    
    result = tok.decode(input_ids[0].tolist())
    result = re.sub(r'^.*?<sep>\s*R:\s*', '', result, flags=re.DOTALL)
    result = result.replace('</s>', '').replace('<s>', '').strip()
    return result


# ─── TREINO ──────────────────────────────────────────────────
def train():
    print("=" * 60)
    print("BRANPY AI — TREINO FINAL V3 (50M, SGD, fp16)")
    print("=" * 60)
    
    # Tokenizer
    tok = build_tokenizer()
    vocab_size = tok.get_vocab_size()
    
    # Dados
    pairs = load_corpus()
    split = int(len(pairs) * 0.9)
    train_pairs = pairs[:split]
    val_pairs = pairs[split:]
    print(f"Treino: {len(train_pairs)} | Val: {len(val_pairs)}")
    
    ds = ChatDataset(train_pairs, tok, max_len=128)
    dl = DataLoader(ds, batch_size=8, shuffle=True, num_workers=0, pin_memory=False)
    print(f"Batches: {len(dl)}")
    
    # Modelo 50M
    device = "cpu"
    model = BranPy(
        vocab=vocab_size, d_model=512, n_layers=10, n_heads=8, d_ff=2048, max_len=128
    )
    model.to(device)
    
    # SGD com momentum (economiza RAM vs AdamW)
    opt = torch.optim.SGD(model.parameters(), lr=0.01, momentum=0.9, weight_decay=0.0001)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=30, eta_min=0.0001)
    
    # bfloat16 no CPU
    use_amp = True
    
    epochs = 30
    best_loss = float("inf")
    log = []
    start_epoch = 0
    
    # Resume
    last = WEIGHTS / "last.pt"
    if last.exists():
        ckpt = torch.load(str(last), weights_only=False, map_location="cpu")
        model.load_state_dict(ckpt["model"])
        opt.load_state_dict(ckpt["optimizer"])
        start_epoch = ckpt.get("epoch", 0)
        best_loss = ckpt.get("best_loss", float("inf"))
        print(f"Resume epoch {start_epoch}")
    
    print(f"\nTreinando {epochs} epocas (SGD + fp16)...")
    print("=" * 60)
    
    for epoch in range(start_epoch, epochs):
        model.train()
        eloss = 0
        t0 = time.time()
        
        for i, (x, y) in enumerate(dl):
            x, y = x.to(device), y.to(device)
            
            with autocast('cpu', dtype=torch.bfloat16):
                _, loss = model(x, y)
            
            opt.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            opt.step()
            
            eloss += loss.item()
            
            if i % 200 == 0:
                dt = time.time() - t0
                eta = dt / (i + 1) * (len(dl) - i - 1) if i > 0 else 0
                print(f"[{epoch+1}/{epochs}] {i}/{len(dl)} | Loss: {loss.item():.4f} | ETA: {eta/60:.0f}min")
        
        avg = eloss / len(dl)
        elapsed = time.time() - t0
        sched.step()
        
        print(f"\nEpoca {epoch+1} | Loss: {avg:.4f} | {elapsed/60:.1f}min")
        
        # Salvar
        ckpt = {
            "epoch": epoch + 1,
            "model": model.state_dict(),
            "optimizer": opt.state_dict(),
            "loss": avg,
            "best_loss": best_loss,
            "vocab_size": vocab_size,
        }
        torch.save(ckpt, str(WEIGHTS / "last.pt"))
        torch.save(ckpt, str(WEIGHTS / f"epoch_{epoch+1}.pt"))
        log.append({"epoch": epoch + 1, "loss": avg, "time": elapsed})
        
        with open(WEIGHTS / "log.jsonl", "w") as f:
            f.write("\n".join(json.dumps(x) for x in log))
        
        if avg < best_loss:
            best_loss = avg
            torch.save(ckpt, str(WEIGHTS / "best.pt"))
        
        # Teste
        model.eval()
        resp = generate(model, tok, "o que voce e", max_new=80)
        print(f"  Teste: {resp[:150]}")
        print(f"  Best: {best_loss:.4f}\n")
        
        # Forçar garbage collection
        gc.collect()
    
    # Salvar tokenizer
    tok.save(str(WEIGHTS / "tokenizer.json"))
    print("\n" + "=" * 60)
    print(f"TREINO COMPLETO! Loss: {best_loss:.4f}")
    print(f"Pesos: {WEIGHTS}")
    print("=" * 60)


if __name__ == "__main__":
    train()
