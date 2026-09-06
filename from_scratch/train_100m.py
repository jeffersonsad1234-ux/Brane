"""
BRANPY AI -- TREINO 100M COMPLETO
25K pares, 15 epocas, 100% BranPy
"""
import os, sys, time, json, math, re
from pathlib import Path
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader

def log(msg):
    print(msg, flush=True)

BASE = Path(__file__).parent
WEIGHTS = BASE / "weights" / "branpy_100m"
WEIGHTS.mkdir(parents=True, exist_ok=True)

class SimpleTokenizer:
    def __init__(self):
        self.char_to_id = {}
        self.id_to_char = {}
    def train(self, text, vocab_size=20000):
        self.char_to_id = {"<pad>": 0, "<s>": 1, "</s>": 2, "<unk>": 3, "\n": 4}
        freq = {}
        for c in text:
            freq[c] = freq.get(c, 0) + 1
        for c, _ in sorted(freq.items(), key=lambda x: -x[1]):
            if c not in self.char_to_id and len(self.char_to_id) < vocab_size:
                self.char_to_id[c] = len(self.char_to_id)
        self.id_to_char = {v: k for k, v in self.char_to_id.items()}
    def encode(self, text, max_len=256):
        ids = [1] + [self.char_to_id.get(c, 3) for c in text] + [2]
        if len(ids) < max_len:
            ids += [0] * (max_len - len(ids))
        else:
            ids = ids[:max_len]
        return ids
    def save(self, path):
        with open(path, "w", encoding="utf-8") as f:
            json.dump({"c2i": self.char_to_id}, f, ensure_ascii=False)
    def load(self, path):
        with open(path, "r", encoding="utf-8") as f:
            self.char_to_id = json.load(f)["c2i"]
        self.id_to_char = {int(v): k for k, v in self.char_to_id.items()}

class Block(nn.Module):
    def __init__(self, d_model, n_heads, d_ff, dropout=0.05):
        super().__init__()
        self.ln1 = nn.LayerNorm(d_model)
        self.ln2 = nn.LayerNorm(d_model)
        self.qkv = nn.Linear(d_model, 3 * d_model)
        self.proj = nn.Linear(d_model, d_model)
        self.ff = nn.Sequential(
            nn.Linear(d_model, d_ff), nn.GELU(), nn.Dropout(dropout),
            nn.Linear(d_ff, d_model), nn.Dropout(dropout),
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

class BranPy100M(nn.Module):
    def __init__(self, vocab, d_model=768, n_layers=12, n_heads=12, d_ff=3072, max_len=256):
        super().__init__()
        self.tok = nn.Embedding(vocab, d_model)
        self.pos = nn.Embedding(max_len, d_model)
        self.drop = nn.Dropout(0.1)
        self.blocks = nn.ModuleList([Block(d_model, n_heads, d_ff) for _ in range(n_layers)])
        self.ln = nn.LayerNorm(d_model)
        self.head = nn.Linear(d_model, vocab, bias=False)
        self.tok.weight = self.head.weight  # weight tying
        n = sum(p.numel() for p in self.parameters())
        log(f"Modelo: {n/1e6:.1f}M parametros | {n_layers} camadas | d={d_model}")
    def forward(self, idx, targets=None):
        B, T = idx.shape
        mask = torch.tril(torch.ones(T, T)).unsqueeze(0).unsqueeze(0)
        x = self.drop(self.tok(idx) + self.pos(torch.arange(T, device=idx.device)))
        for blk in self.blocks:
            x = blk(x, mask)
        logits = self.head(self.ln(x))
        if targets is not None:
            return logits, F.cross_entropy(logits.view(-1, logits.size(-1)), targets.view(-1))
        return logits, None

class ChatDataset(Dataset):
    def __init__(self, corpus_file, tokenizer, max_len=256):
        self.examples = []
        log("Carregando corpus...")
        with open(corpus_file, "r", encoding="utf-8") as f:
            text = f.read()
        pairs = re.split(r'\n\s*\n', text)
        total = len(pairs)
        for i, pair in enumerate(pairs):
            lines = pair.strip().split("\n")
            if len(lines) >= 2:
                q = lines[0].replace("Human: ", "").replace("Humor: ", "").strip()
                a = "\n".join(l.replace("IA: ", "").replace("AI: ", "").strip() for l in lines[1:])
                full = f"Human: {q}\nAI: {a}</s>"
                ids = tokenizer.encode(full, max_len=max_len)
                if len(ids) > 10:
                    self.examples.append(torch.tensor(ids, dtype=torch.long))
            if (i + 1) % 5000 == 0:
                log(f"  {i+1}/{total}...")
        log(f"Dataset: {len(self.examples)} exemplos")
    def __len__(self):
        return len(self.examples)
    def __getitem__(self, idx):
        ids = self.examples[idx]
        return ids[:-1], ids[1:]

def train():
    print("=" * 60)
    print("BRANPY AI -- TREINO 100M COMPLETO")
    print("100% BranPy, zero licencas externas")
    print("=" * 60)

    tok = SimpleTokenizer()
    tok_path = str(BASE / "tokenizer_100m.json")
    corpus = str(BASE / "data" / "corpus_final_50k.txt")

    if os.path.exists(tok_path):
        tok.load(tok_path)
    else:
        print("Treinando tokenizador...")
        with open(corpus, "r", encoding="utf-8") as f:
            tok.train(f.read(), vocab_size=20000)
        tok.save(tok_path)
    log(f"Tokenizador: {len(tok.char_to_id)} tokens")

    log("Carregando dataset...")
    ds = ChatDataset(corpus, tok, max_len=256)
    dl = DataLoader(ds, batch_size=2, shuffle=True, num_workers=0, pin_memory=False)
    log(f"Batches: {len(dl)}")

    model = BranPy100M(
        vocab=len(tok.char_to_id),
        d_model=768, n_layers=12, n_heads=12, d_ff=3072, max_len=256
    )

    start_epoch = 0
    last = WEIGHTS / "last.pt"
    if last.exists():
        ckpt = torch.load(str(last), weights_only=False)
        model.load_state_dict(ckpt["model"])
        start_epoch = ckpt.get("epoch", 0)
        log(f"Resume epoch {start_epoch}")

    opt = torch.optim.AdamW(model.parameters(), lr=3e-4, weight_decay=0.05, betas=(0.9, 0.95))
    sched = torch.optim.lr_scheduler.CosineAnnealingWarmRestarts(opt, T_0=5, T_mult=2, eta_min=1e-6)

    epochs = 15
    best_loss = float("inf")
    log_data = []

    log(f"\nTreinando {epochs} epocas, {len(dl)} batches/epoca")
    log(f"Tempo estimado: ~{len(dl)*2*epochs/3600:.1f} horas")
    log("=" * 60)

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
            if i % 100 == 0:
                dt = time.time() - t0
                eta = dt / (i + 1) * (len(dl) - i - 1) / 60 if i > 0 else 0
                log(f"[{epoch+1}/{epochs}] {i}/{len(dl)} | Loss: {loss.item():.4f} | ETA: {eta:.0f}min")

        avg = eloss / len(dl)
        elapsed = time.time() - t0
        sched.step()

        log(f"\nEpoca {epoch+1} | Loss: {avg:.4f} | {elapsed/60:.1f}min")

        ckpt = {"epoch": epoch+1, "model": model.state_dict(), "loss": avg, "vocab": tok.char_to_id}
        torch.save(ckpt, str(WEIGHTS / "last.pt"))
        torch.save(ckpt, str(WEIGHTS / f"epoch_{epoch+1}.pt"))
        log_data.append({"epoch": epoch+1, "loss": avg, "time": elapsed})

        with open(WEIGHTS / "log.jsonl", "w") as f:
            f.write("\n".join(json.dumps(x) for x in log_data))

        if avg < best_loss:
            best_loss = avg
            torch.save(ckpt, str(WEIGHTS / "best.pt"))

        log(f"Best: {best_loss:.4f}")

    log("\n" + "=" * 60)
    log(f"COMPLETO! Best: {best_loss:.4f}")
    log(f"Pesos: {WEIGHTS}")
    log("=" * 60)

if __name__ == "__main__":
    train()
