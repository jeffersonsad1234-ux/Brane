"""Teste do modelo BranPy 25M pronto"""
import sys, json, time, math, re
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import torch
import torch.nn as nn
import torch.nn.functional as F

BASE = Path(__file__).parent
WEIGHTS = BASE / "weights" / "branpy_cpu"

class SimpleTokenizer:
    def __init__(self):
        self.char_to_id = {}
        self.id_to_char = {}
    def load(self, path):
        with open(path, "r", encoding="utf-8") as f:
            self.char_to_id = json.load(f)["c2i"]
        self.id_to_char = {int(v): k for k, v in self.char_to_id.items()}
    def encode(self, text, max_len=128):
        ids = [1] + [self.char_to_id.get(c, 3) for c in text] + [2]
        if len(ids) < max_len:
            ids += [0] * (max_len - len(ids))
        else:
            ids = ids[:max_len]
        return ids
    def decode(self, ids):
        chars = []
        for i in ids:
            if i in (0, 1):
                continue
            if i == 2:
                break
            chars.append(self.id_to_char.get(i, "?"))
        return "".join(chars)

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
    def forward(self, idx, targets=None):
        B, T = idx.shape
        mask = torch.tril(torch.ones(T, T)).unsqueeze(0).unsqueeze(0)
        x = self.tok(idx) + self.pos(torch.arange(T))
        for blk in self.blocks:
            x = blk(x, mask)
        logits = self.head(self.ln(x))
        if targets is not None:
            return logits, F.cross_entropy(logits.view(-1, logits.size(-1)), targets.view(-1))
        return logits, None

def generate(model, tok, prompt, max_new=200, temperature=0.8, top_k=40):
    model.eval()
    ids = tok.encode(prompt, max_len=128)
    input_ids = torch.tensor([ids], dtype=torch.long)
    
    with torch.no_grad():
        for _ in range(max_new):
            idx_cond = input_ids[:, -128:]
            logits, _ = model(idx_cond)
            logits = logits[:, -1, :] / temperature
            
            if top_k > 0:
                v, _ = torch.topk(logits, min(top_k, logits.size(-1)))
                logits[logits < v[:, [-1]]] = float('-inf')
            
            probs = F.softmax(logits, dim=-1)
            next_id = torch.multinomial(probs, 1)
            
            if next_id.item() == 2:
                break
            
            input_ids = torch.cat([input_ids, next_id], dim=1)
    
    return tok.decode(input_ids[0].tolist())

def main():
    tok = SimpleTokenizer()
    tok.load(str(BASE / "tokenizer_cpu.json"))
    
    model = BranPy(vocab=len(tok.char_to_id), d_model=512, n_layers=8, n_heads=8, d_ff=2048, max_len=128)
    ckpt = torch.load(str(WEIGHTS / "best.pt"), weights_only=False, map_location="cpu")
    model.load_state_dict(ckpt["model"])
    model.eval()
    
    params = sum(p.numel() for p in model.parameters())
    print(f"Modelo carregado: {params/1e6:.1f}M params, Loss: {ckpt.get('loss', '?')}")
    print(f"Epoca: {ckpt.get('epoch', '?')}")
    print("=" * 60)
    
    questions = [
        "qual e o sentido da vida",
        "explique computacao quantica",
        "como funciona um processador",
        "o que e inteligencia artificial",
        "me conte uma piada",
    ]
    
    for q in questions:
        print(f"\nP: {q}")
        t0 = time.time()
        resp = generate(model, tok, q, max_new=150, temperature=0.8)
        dt = time.time() - t0
        print(f"R: {resp}")
        print(f"Tempo: {dt:.1f}s")
        print("-" * 40)

if __name__ == "__main__":
    main()
