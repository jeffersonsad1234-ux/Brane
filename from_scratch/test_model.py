"""
BRANPY AI -- MINI TESTE RAPIDO
Valida que tudo funciona antes do treino grande
"""
import os, time, json, math, re
from pathlib import Path
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader

BASE = Path(__file__).parent

class SimpleTokenizer:
    def __init__(self):
        self.char_to_id = {}
        self.id_to_char = {}
    def load(self, path):
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.char_to_id = data["c2i"]
        self.id_to_char = {int(v): k for k, v in self.char_to_id.items()}
    def encode(self, text, max_len=128):
        ids = [1] + [self.char_to_id.get(c, 3) for c in text] + [2]
        if len(ids) < max_len:
            ids += [0] * (max_len - len(ids))
        else:
            ids = ids[:max_len]
        return ids

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
        print(f"Modelo: {n/1e6:.1f}M parametros")
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

def test():
    print("=== TESTE RAPIDO ===")
    t0 = time.time()

    tok = SimpleTokenizer()
    tok.load(str(BASE / "tokenizer_cpu.json"))
    print(f"Tokenizador: {len(tok.char_to_id)} tokens ({time.time()-t0:.1f}s)")

    model = BranPy(vocab=len(tok.char_to_id), d_model=512, n_layers=8, n_heads=8, d_ff=2048, max_len=128)
    print(f"Modelo criado ({time.time()-t0:.1f}s)")

    # Teste forward
    test_text = "Hello world test"
    ids = tok.encode(test_text, max_len=128)
    x = torch.tensor([ids[:-1]], dtype=torch.long)
    y = torch.tensor([ids[1:]], dtype=torch.long)

    t1 = time.time()
    _, loss = model(x, y)
    print(f"Forward: {time.time()-t1:.2f}s | Loss: {loss.item():.4f}")

    t1 = time.time()
    loss.backward()
    print(f"Backward: {time.time()-t1:.2f}s")

    print(f"\nTotal: {time.time()-t0:.1f}s")
    print("OK -- Tudo funciona!")

if __name__ == "__main__":
    test()
