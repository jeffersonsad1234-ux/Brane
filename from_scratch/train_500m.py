"""
BRANPY AI — TREINO 500M COMPLETO
Zero restrições — Treino do zero
"""
import os, sys, time, json, math, re
from pathlib import Path

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from torch.cuda.amp import GradScaler, autocast

BASE = Path(__file__).parent
WEIGHTS = BASE / "weights" / "branpy_500m"
WEIGHTS.mkdir(parents=True, exist_ok=True)
LOG_FILE = WEIGHTS / "log.jsonl"

# ═══════════════════════════════════════════════════════════════
# TOKENIZADOR (BPE mínimo)
# ═══════════════════════════════════════════════════════════════
class Tokenizer:
    def __init__(self):
        self.merges = {}
        self.vocab = {}
        self.inverse_vocab = {}
        self.special = {
            "<pad>": 0, "<s>": 1, "</s>": 2,
            "<unk>": 3, "<sep>": 4, "<mask>": 5,
            "\n": 6, " ": 7,
        }

    def train(self, text: str, vocab_size: int = 32000):
        self.vocab = dict(self.special)
        self.inverse_vocab = {v: k for k, v in self.vocab.items()}

        freqs = {}
        for c in text:
            freqs[c] = freqs.get(c, 0) + 1
        for c, _ in sorted(freqs.items(), key=lambda x: -x[1]):
            if c not in self.vocab:
                self.vocab[c] = len(self.vocab)
                self.inverse_vocab[self.vocab[c]] = c

        tokens = list(text)
        while len(tokens) < vocab_size and len(self.vocab) < vocab_size:
            pairs = {}
            for i in range(len(tokens) - 1):
                pair = (tokens[i], tokens[i + 1])
                pairs[pair] = pairs.get(pair, 0) + 1
            if not pairs:
                break
            best = max(pairs, key=pairs.get)
            if pairs[best] < 2:
                break
            new_token = best[0] + best[1]
            self.merges[best] = new_token
            self.vocab[new_token] = len(self.vocab)
            self.inverse_vocab[self.vocab[new_token]] = new_token
            new_tokens = []
            i = 0
            while i < len(tokens):
                if i < len(tokens) - 1 and (tokens[i], tokens[i + 1]) == best:
                    new_tokens.append(new_token)
                    i += 2
                else:
                    new_tokens.append(tokens[i])
                    i += 1
            tokens = new_tokens

    def encode(self, text: str, max_len: int = 512) -> list:
        ids = [1]  # <s>
        for c in text:
            if c in self.vocab:
                ids.append(self.vocab[c])
            else:
                ids.append(3)  # <unk>
        ids.append(2)  # </s>
        if len(ids) < max_len:
            ids += [0] * (max_len - len(ids))
        else:
            ids = ids[:max_len]
        return ids

    def decode(self, ids: list) -> str:
        text = ""
        for i in ids:
            if i in self.inverse_vocab:
                text += self.inverse_vocab[i]
        return text

    def save(self, path):
        with open(path, "w", encoding="utf-8") as f:
            json.dump({"merges": {f"{k[0]}|||{k[1]}": v for k, v in self.merges.items()}, "vocab": self.vocab}, f, ensure_ascii=False)

    def load(self, path):
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.merges = {tuple(k.split("|||")): v for k, v in data["merges"].items()}
        self.vocab = data["vocab"]
        self.inverse_vocab = {v: k for k, v in self.vocab.items()}


# ═══════════════════════════════════════════════════════════════
# MODELO 500M
# ═══════════════════════════════════════════════════════════════
class BranPyConfig:
    def __init__(self, **kwargs):
        defaults = dict(vocab_size=32000, n_layers=10, d_model=768, n_heads=12, d_ff=3072, max_seq_len=512, dropout=0.05)
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
        print(f"500M: {n_params/1e6:.1f}M parâmetros")

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
# DATASET
# ═══════════════════════════════════════════════════════════════
class ChatDataset(Dataset):
    def __init__(self, data_dir, tokenizer, max_len=512):
        self.max_len = max_len
        self.tokenizer = tokenizer
        self.examples = []
        for f in Path(data_dir).glob("*.txt"):
            if f.name.startswith("log") or f.name.startswith("checkpoint"):
                continue
            try:
                with open(f, "r", encoding="utf-8") as fp:
                    text = fp.read()
            except:
                continue
            pairs = re.split(r'\n\s*\n', text)
            for pair in pairs:
                lines = pair.strip().split("\n")
                if len(lines) >= 2:
                    q = lines[0].replace("Humor: ", "").replace("Human: ", "").strip()
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
# CHECPOINT RESUME
# ═══════════════════════════════════════════════════════════════
def find_resume_checkpoint(ckpt_dir):
    ckpts = sorted(ckpt_dir.glob("step_*"), key=lambda p: int(p.name.split("_")[1]) if p.name.split("_")[1].isdigit() else 0)
    if ckpts:
        last = ckpts[-1]
        print(f"Retomando de: {last.name}")
        return str(last)
    return None


# ═══════════════════════════════════════════════════════════════
# FUNÇÃO DE TREINO
# ═══════════════════════════════════════════════════════════════
def train():
    print("=" * 60)
    print("BRANPY AI — TREINO 500M COMPLETO")
    print("Zero restrições — Treino do zero")
    print("=" * 60)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Device: {device}")

    # Tokenizador
    tokenizer = Tokenizer()
    tok_path = str(BASE / "tokenizer_500m.json")
    data_dir = str(BASE / "data")

    if os.path.exists(tok_path):
        tokenizer.load(tok_path)
        print(f"Tokenizador carregado: {len(tokenizer.vocab)} tokens")
    else:
        print("Treinando tokenizador...")
        texts = []
        for f in Path(data_dir).glob("*.txt"):
            try:
                with open(f, "r", encoding="utf-8") as fp:
                    texts.append(fp.read())
            except:
                pass
        tokenizer.train("\n".join(texts), vocab_size=32000)
        tokenizer.save(tok_path)
        print(f"Tokenizador treinado: {len(tokenizer.vocab)} tokens")

    # Dataset
    print("\nCarregando dataset...")
    ds = ChatDataset(data_dir, tokenizer)
    dl = DataLoader(ds, batch_size=4, shuffle=True, num_workers=0)
    print(f"Batches: {len(dl)}")

    # Modelo
    config = BranPyConfig(vocab_size=len(tokenizer.vocab), n_layers=10, d_model=768, n_heads=12, d_ff=3072, max_seq_len=512, dropout=0.05)
    model = BranPy500M(config)
    model = model.to(device)

    # Resume
    start_step = 0
    resume = find_resume_checkpoint(WEIGHTS)
    if resume:
        ckpt = torch.load(resume, map_location=device)
        if isinstance(ckpt, dict) and "model" in ckpt:
            model.load_state_dict(ckpt["model"])
            start_step = ckpt.get("step", 0)
        else:
            model.load_state_dict(ckpt)
            start_step = int(resume.split("_")[-1]) if resume.split("_")[-1].isdigit() else 0
        print(f"Step inicial: {start_step}")

    # Otimizador
    opt = torch.optim.AdamW(model.parameters(), lr=3e-4, weight_decay=0.1)
    scaler = GradScaler(enabled=(device == "cuda"))
    scheduler = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=3e-4, epochs=20, steps_per_epoch=len(dl))

    # Treino
    epochs = 20
    log = []
    best_loss = float("inf")

    print(f"\nIniciando treino: {epochs} épocas, {len(dl)} batches")
    print("Modelo: 500M | Device:", device)
    print("=" * 60)

    for epoch in range(epochs):
        model.train()
        epoch_loss = 0
        epoch_time = time.time()
        start_e = time.time()

        for i, (x, y) in enumerate(dl):
            x, y = x.to(device), y.to(device)
            t0 = time.time()

            with autocast(enabled=(device == "cuda")):
                _, loss = model(x, y)

            opt.zero_grad()
            scaler.scale(loss).backward()
            scaler.unscale_(opt)
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            scaler.step(opt)
            scaler.update()
            scheduler.step()

            dt = time.time() - t0
            loss_val = loss.item()
            epoch_loss += loss_val

            if i % 10 == 0:
                print(f"[{epoch+1}/{epochs}] Step {i}/{len(dl)} | Loss: {loss_val:.4f} | {dt*1000:.0f}ms")

            log.append({"epoch": epoch + 1, "step": i, "loss": loss_val, "lr": scheduler.get_last_lr()[0]})

        avg_loss = epoch_loss / len(dl)
        epoch_dt = time.time() - start_e
        print(f"\nÉpoca {epoch+1}/{epochs} | Loss: {avg_loss:.4f} | Tempo: {epoch_dt:.0f}s")

        # Salvar checkpoint
        ckpt = {
            "epoch": epoch + 1,
            "step": len(dl),
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
