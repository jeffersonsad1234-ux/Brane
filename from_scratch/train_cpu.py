"""
BRANPY AI -- TREINO OTIMIZADO PARA CPU
Modelo 150M (85M reais) -- treina em ~3-6 horas
"""
import os, time, json, math, re
from pathlib import Path
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader

BASE = Path(__file__).parent
WEIGHTS = BASE / "weights" / "branpy_cpu"
WEIGHTS.mkdir(parents=True, exist_ok=True)

class SimpleTokenizer:
    def __init__(self):
        self.char_to_id = {}
        self.id_to_char = {}

    def train(self, text, vocab_size=12000):
        self.char_to_id = {"<pad>": 0, "<s>": 1, "</s>": 2, "<unk>": 3, "\n": 4}
        freq = {}
        for c in text:
            freq[c] = freq.get(c, 0) + 1
        for c, _ in sorted(freq.items(), key=lambda x: -x[1]):
            if c not in self.char_to_id and len(self.char_to_id) < vocab_size:
                self.char_to_id[c] = len(self.char_to_id)
        self.id_to_char = {v: k for k, v in self.char_to_id.items()}
        print(f"Vocab: {len(self.char_to_id)} tokens")

    def encode(self, text, max_len=128):
        ids = [1] + [self.char_to_id.get(c, 3) for c in text] + [2]
        if len(ids) < max_len:
            ids += [0] * (max_len - len(ids))
        else:
            ids = ids[:max_len]
        return ids

    def decode(self, ids):
        return "".join(self.id_to_char.get(i, "") for i in ids if i > 2)

    def save(self, path):
        with open(path, "w", encoding="utf-8") as f:
            json.dump({"c2i": self.char_to_id}, f, ensure_ascii=False)

    def load(self, path):
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.char_to_id = data["c2i"]
        self.id_to_char = {int(v): k for k, v in self.char_to_id.items()}


class Block(nn.Module):
    def __init__(self, d_model, n_heads, d_ff, dropout=0.05):
        super().__init__()
        self.ln1 = nn.LayerNorm(d_model)
        self.qkv = nn.Linear(d_model, 3 * d_model)
        self.proj = nn.Linear(d_model, d_model)
        self.ln2 = nn.LayerNorm(d_model)
        self.ff = nn.Sequential(nn.Linear(d_model, d_ff), nn.GELU(), nn.Linear(d_ff, d_model))
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
    def __init__(self, vocab, d_model=512, n_layers=8, n_heads=8, d_ff=2048, max_len=128):
        super().__init__()
        self.tok = nn.Embedding(vocab, d_model)
        self.pos = nn.Embedding(max_len, d_model)
        self.blocks = nn.ModuleList([Block(d_model, n_heads, d_ff) for _ in range(n_layers)])
        self.ln = nn.LayerNorm(d_model)
        self.head = nn.Linear(d_model, vocab)
        n = sum(p.numel() for p in self.parameters())
        print(f"Modelo: {n/1e6:.1f}M parametros | {n_layers} camadas | d_model={d_model}")

    def forward(self, idx, targets=None):
        B, T = idx.shape
        mask = torch.tril(torch.ones(T, T, device=idx.device)).unsqueeze(0).unsqueeze(0)
        x = self.tok(idx) + self.pos(torch.arange(T, device=idx.device))
        for blk in self.blocks:
            x = blk(x, mask)
        logits = self.head(self.ln(x))
        if targets is not None:
            return logits, F.cross_entropy(logits.view(-1, logits.size(-1)), targets.view(-1))
        return logits, None


class ChatDataset(Dataset):
    def __init__(self, corpus_file, tokenizer, max_len=128):
        self.examples = []
        with open(corpus_file, "r", encoding="utf-8") as f:
            text = f.read()

        pairs = re.split(r'\n\s*\n', text)
        for i, pair in enumerate(pairs):
            lines = pair.strip().split("\n")
            if len(lines) >= 2:
                q = lines[0].replace("Human: ", "").replace("Humor: ", "").strip()
                a = "\n".join(l.replace("IA: ", "").replace("AI: ", "").strip() for l in lines[1:])
                full = f"{q}\n{a}</s>"
                ids = tokenizer.encode(full, max_len=max_len)
                if len(ids) > 5:
                    self.examples.append(torch.tensor(ids, dtype=torch.long))

            if (i + 1) % 500 == 0:
                print(f"  Processados: {i+1} pares...")

        print(f"Dataset pronto: {len(self.examples)} exemplos")

    def __len__(self):
        return len(self.examples)

    def __getitem__(self, idx):
        ids = self.examples[idx]
        return ids[:-1], ids[1:]


def train():
    print("=" * 60)
    print("BRANPY AI -- TREINO CPU OTIMIZADO")
    print("=" * 60)

    device = "cpu"

    # Tokenizador
    tokenizer = SimpleTokenizer()
    tok_path = str(BASE / "tokenizer_cpu.json")
    corpus_file = str(BASE / "data" / "corpus_treino_final.txt")

    if os.path.exists(tok_path):
        tokenizer.load(tok_path)
        print(f"Tokenizador: {len(tokenizer.char_to_id)} tokens")
    else:
        print("Treinando tokenizador...")
        with open(corpus_file, "r", encoding="utf-8") as f:
            text = f.read()
        tokenizer.train(text, vocab_size=12000)
        tokenizer.save(tok_path)

    # Dataset
    print("\nCarregando dataset...")
    ds = ChatDataset(corpus_file, tokenizer, max_len=128)
    dl = DataLoader(ds, batch_size=4, shuffle=True, num_workers=0)
    print(f"Batches: {len(dl)}")

    # Modelo: 512 dimensoes, 8 camadas, ~85M params reais
    model = BranPy(
        vocab=len(tokenizer.char_to_id),
        d_model=512, n_layers=8, n_heads=8, d_ff=2048, max_len=128
    )
    model = model.to(device)

    # Resume
    start_epoch = 0
    last_path = WEIGHTS / "last.pt"
    if last_path.exists():
        ckpt = torch.load(str(last_path), map_location=device, weights_only=False)
        model.load_state_dict(ckpt["model"])
        start_epoch = ckpt.get("epoch", 0)
        print(f"Resume epoch {start_epoch}")

    # Otimizador
    opt = torch.optim.AdamW(model.parameters(), lr=5e-4, weight_decay=0.05)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=10, eta_min=1e-5)

    # Treino
    epochs = 10
    log = []
    best_loss = float("inf")

    print(f"\nTreinando: {epochs} epocas, {len(dl)} batches")
    print("=" * 60)

    for epoch in range(start_epoch, epochs):
        model.train()
        epoch_loss = 0
        start_time = time.time()

        for i, (x, y) in enumerate(dl):
            x, y = x.to(device), y.to(device)
            t0 = time.time()

            _, loss = model(x, y)
            opt.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            opt.step()

            dt = time.time() - t0
            lv = loss.item()
            epoch_loss += lv

            if i % 50 == 0:
                eta = dt * (len(dl) - i)
                print(f"[{epoch+1}/{epochs}] {i}/{len(dl)} | Loss: {lv:.4f} | {dt*1000:.0f}ms | ETA: {eta/60:.0f}min")

            log.append({"epoch": epoch+1, "step": i, "loss": lv})

        avg_loss = epoch_loss / len(dl)
        elapsed = time.time() - start_time
        scheduler.step()

        print(f"\nEpoca {epoch+1} | Loss: {avg_loss:.4f} | Tempo: {elapsed/60:.1f}min")

        ckpt = {"epoch": epoch+1, "model": model.state_dict(), "optimizer": opt.state_dict(), "loss": avg_loss}
        torch.save(ckpt, str(WEIGHTS / f"epoch_{epoch+1}.pt"))
        torch.save(ckpt, str(WEIGHTS / "last.pt"))

        with open(WEIGHTS / "log.jsonl", "w") as f:
            f.write("\n".join(json.dumps(x) for x in log))

        if avg_loss < best_loss:
            best_loss = avg_loss
            torch.save(ckpt, str(WEIGHTS / "best.pt"))

        print(f"Best: {best_loss:.4f}")

    print("\n" + "=" * 60)
    print(f"COMPLETO! Best: {best_loss:.4f}")
    print(f"Pesos: {WEIGHTS}")
    print("=" * 60)


if __name__ == "__main__":
    train()
