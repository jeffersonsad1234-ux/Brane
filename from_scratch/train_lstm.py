"""
BRANPY AI — MODELO LSTM
- Arquitetura LSTM (lê palavra por palavra)
- Mais leve que Transformer
- Melhor com poucos dados
- 100% código BranPy
"""
import os, json, time, math, re, gc
from pathlib import Path

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from tokenizers import Tokenizer, models, trainers, pre_tokenizers

BASE = Path(__file__).parent
WEIGHTS = BASE / "weights" / "branpy_lstm"
WEIGHTS.mkdir(parents=True, exist_ok=True)
DATA_DIR = BASE / "data"
TOK_PATH = BASE / "tokenizer_lstm.json"

def build_tokenizer():
    if TOK_PATH.exists():
        tok = Tokenizer.from_file(str(TOK_PATH))
        print(f"Tokenizer: {tok.get_vocab_size()} tokens")
        return tok
    print("Construindo tokenizer BPE (8K)...")
    tok = Tokenizer(models.BPE(unk_token="<unk>"))
    tok.pre_tokenizer = pre_tokenizers.Whitespace()
    trainer = trainers.BpeTrainer(
        vocab_size=8000,
        special_tokens=["<pad>", "<s>", "</s>", "<unk>", "<sep>"],
        min_frequency=2,
    )
    files = [str(f) for f in DATA_DIR.glob("*.txt")]
    tok.train(files, trainer)
    tok.save(str(TOK_PATH))
    print(f"Tokenizer: {tok.get_vocab_size()} tokens")
    return tok

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
                if not block: continue
                m_q = re.match(r'^(?:Humor|Human)\s*:\s*(.+)', block)
                if not m_q: continue
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
    def __init__(self, pairs, tokenizer, max_len=128):
        self.examples = []
        self.tok = tokenizer
        self.pad_id = tokenizer.token_to_id("<pad>") or 0
        for q, a in pairs:
            text = f"<s> P: {q} <sep> R: {a} </s>"
            enc = tokenizer.encode(text)
            ids = enc.ids[:max_len]
            if len(ids) > 5:
                self.examples.append(torch.tensor(ids, dtype=torch.long))
        print(f"Dataset: {len(self.examples)} exemplos")
    def __len__(self): return len(self.examples)
    def __getitem__(self, idx):
        ids = self.examples[idx]
        T = 127
        if len(ids) < T + 1:
            ids = torch.cat([ids, torch.full((T + 1 - len(ids),), self.pad_id, dtype=torch.long)])
        else:
            ids = ids[:T + 1]
        return ids[:-1], ids[1:]

# ─── MODELO LSTM ────────────────────────────────────────────
class BranPyLSTM(nn.Module):
    def __init__(self, vocab, embed_dim=256, hidden_dim=512, n_layers=3, dropout=0.2):
        super().__init__()
        self.hidden_dim = hidden_dim
        self.n_layers = n_layers
        
        self.embedding = nn.Embedding(vocab, embed_dim)
        self.lstm = nn.LSTM(
            embed_dim, hidden_dim, n_layers,
            batch_first=True, dropout=dropout if n_layers > 1 else 0
        )
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(hidden_dim, vocab)
        
        n = sum(p.numel() for p in self.parameters())
        print(f"Modelo LSTM: {n/1e6:.1f}M params | embed={embed_dim} hidden={hidden_dim} layers={n_layers}")
    
    def forward(self, idx, targets=None):
        x = self.embedding(idx)
        lstm_out, _ = self.lstm(x)
        logits = self.fc(self.dropout(lstm_out))
        if targets is not None:
            loss = F.cross_entropy(logits.view(-1, logits.size(-1)), targets.view(-1), ignore_index=0)
            return logits, loss
        return logits, None
    
    def init_hidden(self, batch_size, device):
        h0 = torch.zeros(self.n_layers, batch_size, self.hidden_dim).to(device)
        c0 = torch.zeros(self.n_layers, batch_size, self.hidden_dim).to(device)
        return h0, c0

# ─── GERAÇÃO ─────────────────────────────────────────────────
@torch.no_grad()
def generate(model, tok, prompt, max_new=150, temperature=0.8, top_k=50):
    model.eval()
    text = f"<s> P: {prompt} <sep> R:"
    enc = tok.encode(text)
    ids = list(enc.ids)
    input_ids = torch.tensor([ids], dtype=torch.long)
    
    for _ in range(max_new):
        logits, _ = model(input_ids)
        logits = logits[:, -1, :] / max(temperature, 0.01)
        
        if top_k > 0:
            v, _ = torch.topk(logits, min(top_k, logits.size(-1)))
            logits[logits < v[:, [-1]]] = float('-inf')
        
        probs = F.softmax(logits, dim=-1)
        next_id = torch.multinomial(probs, 1)
        
        if next_id.item() in (0, 2):
            break
        
        input_ids = torch.cat([input_ids, next_id], dim=1)
    
    result = tok.decode(input_ids[0].tolist())
    result = re.sub(r'^.*?<sep>\s*R:\s*', '', result, flags=re.DOTALL)
    result = result.replace('</s>', '').replace('<s>', '').strip()
    return result

# ─── TREINO ──────────────────────────────────────────────────
def train():
    print("=" * 60)
    print("BRANPY AI — TREINO LSTM (100% BranPy)")
    print("=" * 60)
    
    tok = build_tokenizer()
    vocab_size = tok.get_vocab_size()
    pairs = load_corpus()
    split = int(len(pairs) * 0.9)
    train_pairs = pairs[:split]
    print(f"Treino: {len(train_pairs)}")
    
    ds = ChatDataset(train_pairs, tok, max_len=128)
    dl = DataLoader(ds, batch_size=16, shuffle=True, num_workers=0)
    print(f"Batches: {len(dl)}")
    
    device = "cpu"
    model = BranPyLSTM(vocab=vocab_size, embed_dim=256, hidden_dim=512, n_layers=3, dropout=0.2)
    model.to(device)
    
    opt = torch.optim.AdamW(model.parameters(), lr=5e-4, weight_decay=0.01)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=50, eta_min=1e-6)
    
    epochs = 50
    best_loss = float("inf")
    log = []
    start_epoch = 0
    
    last = WEIGHTS / "last.pt"
    if last.exists():
        ckpt = torch.load(str(last), weights_only=False, map_location="cpu")
        model.load_state_dict(ckpt["model"])
        opt.load_state_dict(ckpt["optimizer"])
        start_epoch = ckpt.get("epoch", 0)
        best_loss = ckpt.get("best_loss", float("inf"))
        print(f"Resume epoch {start_epoch}")
    
    print(f"\nTreinando {epochs} epocas...")
    print("=" * 60)
    
    for epoch in range(start_epoch, epochs):
        model.train()
        eloss = 0
        t0 = time.time()
        
        for i, (x, y) in enumerate(dl):
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
        
        ckpt = {"epoch": epoch + 1, "model": model.state_dict(), "optimizer": opt.state_dict(), "loss": avg, "best_loss": best_loss}
        torch.save(ckpt, str(WEIGHTS / "last.pt"))
        torch.save(ckpt, str(WEIGHTS / f"epoch_{epoch+1}.pt"))
        log.append({"epoch": epoch + 1, "loss": avg, "time": elapsed})
        with open(WEIGHTS / "log.jsonl", "w") as f:
            f.write("\n".join(json.dumps(x) for x in log))
        if avg < best_loss:
            best_loss = avg
            torch.save(ckpt, str(WEIGHTS / "best.pt"))
        
        model.eval()
        resp = generate(model, tok, "o que voce e", max_new=80)
        safe = resp[:200].encode('cp1252', errors='replace').decode('cp1252')
        print(f"  Teste: {safe}")
        print(f"  Best: {best_loss:.4f}\n")
        gc.collect()
    
    tok.save(str(WEIGHTS / "tokenizer.json"))
    print(f"\nCOMPLETO! Best: {best_loss:.4f}")

if __name__ == "__main__":
    train()
