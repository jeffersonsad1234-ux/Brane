"""
BRANPY AI — TREINO 500M OTIMIZADO
Rapido, eficiente, sem frescura
"""
import os, sys, time, json, math, re
from pathlib import Path

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader

BASE = Path(__file__).parent
WEIGHTS = BASE / "weights" / "branpy_500m"
WEIGHTS.mkdir(parents=True, exist_ok=True)
LOG_FILE = WEIGHTS / "log.jsonl"

# ═══════════════════════════════════════════════════════════════
# TOKENIZADOR SIMPLES E RAPIDO
# ═══════════════════════════════════════════════════════════════
class SimpleTokenizer:
    def __init__(self):
        self.char_to_id = {}
        self.id_to_char = {}
        self.special = {"<pad>": 0, "<s>": 1, "</s>": 2, "<unk>": 3, "\n": 4, " ": 5}

    def train(self, text, vocab_size=16000):
        self.char_to_id = dict(self.special)
        freq = {}
        for c in text:
            freq[c] = freq.get(c, 0) + 1
        for c, _ in sorted(freq.items(), key=lambda x: -x[1]):
            if c not in self.char_to_id and len(self.char_to_id) < vocab_size:
                self.char_to_id[c] = len(self.char_to_id)
        self.id_to_char = {v: k for k, v in self.char_to_id.items()}

    def encode(self, text, max_len=256):
        ids = [1]  # <s>
        for c in text:
            ids.append(self.char_to_id.get(c, 3))
        ids.append(2)  # </s>
        if len(ids) < max_len:
            ids += [0] * (max_len - len(ids))
        else:
            ids = ids[:max_len]
        return ids

    def decode(self, ids):
        return "".join(self.id_to_char.get(i, "") for i in ids if i > 2)

    def save(self, path):
        with open(path, "w", encoding="utf-8") as f:
            json.dump({"char_to_id": self.char_to_id}, f, ensure_ascii=False)

    def load(self, path):
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.char_to_id = data["char_to_id"]
        self.id_to_char = {int(v): k for k, v in self.char_to_id.items()}


# ═══════════════════════════════════════════════════════════════
# MODELO 500M LITE (8 camadas, mais rapido)
# ═══════════════════════════════════════════════════════════════
class BranPyConfig:
    def __init__(self, **kwargs):
        defaults = dict(vocab_size=16000, n_layers=8, d_model=768, n_heads=12, d_ff=3072, max_seq_len=256, dropout=0.05)
        for k, v in defaults.items():
            setattr(self, k, kwargs.get(k, v))

class MultiHeadSelfAttention(nn.Module):
    def __init__(self, config):
        super().__init__()
        self.n_heads = config.n_heads
        self.d_head = config.d_model // config.n_heads
        self.qkv = nn.Linear(config.d_model, 3 * config.d_model)
        self.proj = nn.Linear(config.d_model, config.d_model)
        self.attn_drop = nn.Dropout(config.dropout)
        self.resid_drop = nn.Dropout(config.dropout)

    def forward(self, x, mask=None):
        B, T, C = x.shape
        qkv = self.qkv(x).reshape(B, T, 3, self.n_heads, self.d_head).permute(2, 0, 3, 1, 4)
        q, k, v = qkv[0], qkv[1], qkv[2]
        att = (q @ k.transpose(-2, -1)) / math.sqrt(self.d_head)
        if mask is not None:
            att = att.masked_fill(mask == 0, float('-inf'))
        att = F.softmax(att, dim=-1)
        att = self.attn_drop(att)
        y = att @ v
        y = y.transpose(1, 2).reshape(B, T, C)
        return self.resid_drop(self.proj(y))

class FeedForward(nn.Module):
    def __init__(self, config):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(config.d_model, config.d_ff),
            nn.GELU(),
            nn.Linear(config.d_ff, config.d_model),
            nn.Dropout(config.dropout),
        )

    def forward(self, x):
        return self.net(x)

class Block(nn.Module):
    def __init__(self, config):
        super().__init__()
        self.ln1 = nn.LayerNorm(config.d_model)
        self.attn = MultiHeadSelfAttention(config)
        self.ln2 = nn.LayerNorm(config.d_model)
        self.ff = FeedForward(config)

    def forward(self, x, mask=None):
        x = x + self.attn(self.ln1(x), mask)
        x = x + self.ff(self.ln2(x))
        return x

class BranPy500M(nn.Module):
    def __init__(self, config):
        super().__init__()
        self.config = config
        self.tok_emb = nn.Embedding(config.vocab_size, config.d_model)
        self.pos_emb = nn.Embedding(config.max_seq_len, config.d_model)
        self.drop = nn.Dropout(config.dropout)
        self.blocks = nn.ModuleList([Block(config) for _ in range(config.n_layers)])
        self.ln_f = nn.LayerNorm(config.d_model)
        self.head = nn.Linear(config.d_model, config.vocab_size, bias=False)
        n_params = sum(p.numel() for p in self.parameters())
        print(f"Modelo: {n_params/1e6:.1f}M parametros")

    def forward(self, idx, targets=None):
        B, T = idx.shape
        pos = torch.arange(0, T, device=idx.device).unsqueeze(0)
        x = self.drop(self.tok_emb(idx) + self.pos_emb(pos))
        mask = torch.tril(torch.ones(T, T, device=idx.device)).unsqueeze(0).unsqueeze(0)
        for block in self.blocks:
            x = block(x, mask)
        x = self.ln_f(x)
        logits = self.head(x)
        if targets is not None:
            loss = F.cross_entropy(logits.view(-1, logits.size(-1)), targets.view(-1))
            return logits, loss
        return logits, None


# ═══════════════════════════════════════════════════════════════
# DATASET OTIMIZADO
# ═══════════════════════════════════════════════════════════════
class ChatDataset(Dataset):
    def __init__(self, corpus_file, tokenizer, max_len=256):
        self.max_len = max_len
        self.tokenizer = tokenizer
        self.examples = []

        print(f"Carregando: {corpus_file}")
        with open(corpus_file, "r", encoding="utf-8") as f:
            text = f.read()

        # Dividir em pares Human:/AI:
        pairs = re.split(r'\n\s*\n', text)
        for pair in pairs:
            lines = pair.strip().split("\n")
            if len(lines) >= 2:
                q = lines[0].replace("Human: ", "").replace("Humor: ", "").strip()
                a = "\n".join(l.replace("IA: ", "").replace("AI: ", "").strip() for l in lines[1:])
                full = f"{q}\n{a}</s>"
                ids = tokenizer.encode(full, max_len=max_len)
                if len(ids) > 5:
                    self.examples.append(torch.tensor(ids, dtype=torch.long))

        print(f"Dataset: {len(self.examples)} exemplos")

    def __len__(self):
        return len(self.examples)

    def __getitem__(self, idx):
        ids = self.examples[idx]
        x = ids[:-1]
        y = ids[1:]
        return x, y


# ═══════════════════════════════════════════════════════════════
# TREINO
# ═══════════════════════════════════════════════════════════════
def train():
    print("=" * 60)
    print("BRANPY AI -- TREINO 500M")
    print("=" * 60)

    device = "cpu"
    print(f"Device: {device}")

    # Tokenizador
    tokenizer = SimpleTokenizer()
    tok_path = str(BASE / "tokenizer_500m.json")

    if os.path.exists(tok_path):
        tokenizer.load(tok_path)
        print(f"Tokenizador: {len(tokenizer.char_to_id)} tokens")
    else:
        print("Treinando tokenizador...")
        corpus = str(BASE / "data" / "corpus_treino_final.txt")
        with open(corpus, "r", encoding="utf-8") as f:
            text = f.read()
        tokenizer.train(text, vocab_size=16000)
        tokenizer.save(tok_path)
        print(f"Tokenizador: {len(tokenizer.char_to_id)} tokens")

    # Dataset
    print("\nCarregando dataset...")
    corpus_file = str(BASE / "data" / "corpus_treino_final.txt")
    ds = ChatDataset(corpus_file, tokenizer, max_len=256)
    dl = DataLoader(ds, batch_size=2, shuffle=True, num_workers=0, pin_memory=False)
    print(f"Batches: {len(dl)}")

    # Modelo
    config = BranPyConfig(vocab_size=len(tokenizer.char_to_id), n_layers=8, d_model=768, n_heads=12, d_ff=3072, max_seq_len=256, dropout=0.05)
    model = BranPy500M(config)
    model = model.to(device)

    # Resume
    start_epoch = 0
    last_path = WEIGHTS / "last.pt"
    if last_path.exists():
        ckpt = torch.load(str(last_path), map_location=device, weights_only=False)
        model.load_state_dict(ckpt["model"])
        start_epoch = ckpt.get("epoch", 0)
        print(f"Resume do epoch {start_epoch}")

    # Otimizador
    opt = torch.optim.AdamW(model.parameters(), lr=3e-4, weight_decay=0.05)
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
            loss_val = loss.item()
            epoch_loss += loss_val

            if i % 20 == 0:
                print(f"[{epoch+1}/{epochs}] Step {i}/{len(dl)} | Loss: {loss_val:.4f} | {dt*1000:.0f}ms")

            log.append({"epoch": epoch + 1, "step": i, "loss": loss_val})

        avg_loss = epoch_loss / len(dl)
        scheduler.step()

        print(f"\nEpoca {epoch+1}/{epochs} | Loss: {avg_loss:.4f}")

        # Salvar checkpoint
        ckpt = {
            "epoch": epoch + 1,
            "model": model.state_dict(),
            "optimizer": opt.state_dict(),
            "loss": avg_loss,
        }
        torch.save(ckpt, str(WEIGHTS / f"epoch_{epoch+1}.pt"))
        torch.save(ckpt, str(WEIGHTS / "last.pt"))

        # Salvar log
        with open(LOG_FILE, "w") as f:
            f.write("\n".join(json.dumps(x) for x in log))

        if avg_loss < best_loss:
            best_loss = avg_loss
            torch.save(ckpt, str(WEIGHTS / "best.pt"))

        print(f"Checkpoint salvo | Best: {best_loss:.4f}")

    print("\n" + "=" * 60)
    print(f"TREINO COMPLETO! Best loss: {best_loss:.4f}")
    print(f"Pesos: {WEIGHTS}")
    print("=" * 60)


if __name__ == "__main__":
    train()
