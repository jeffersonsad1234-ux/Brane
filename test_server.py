"""Testa se o server_v2 funciona."""
import sys
import os

# Prevenir circular import - importar de from_scratch direto
scratch_dir = os.path.join(os.path.dirname(__file__), 'from_scratch')
sys.path.insert(0, scratch_dir)

from model import create_model
from tokenizer import BPETokenizer
import torch
from pathlib import Path

weights = Path(os.path.join(os.path.dirname(__file__), 'from_scratch', 'weights'))

# Listar modelos
print("Modelos disponiveis:")
for d in weights.iterdir():
    if d.is_dir():
        final = d / 'model_final.pt'
        tok = d / 'tokenizer.json'
        if final.exists() and tok.exists():
            print(f"  {d.name} ({final.stat().st_size/1e6:.1f}MB)")

# Carregar small
ckpt = torch.load(str(weights / 'bran9bpy_final' / 'model_final.pt'), map_location='cpu', weights_only=False)
cfg = ckpt['config']
print(f"\nConfig: vocab={cfg['vocab_size']}, layers={cfg['n_layers']}, d={cfg['d_model']}, heads={cfg['n_heads']}")

m = create_model(vocab_size=cfg['vocab_size'], size=cfg.get('model_size', 'small'))
m.load_state_dict(ckpt['model_state_dict'])
m.eval()

tok = BPETokenizer()
tok.load(str(weights / 'bran9bpy_final' / 'tokenizer.json'))

prompts = [
    "oi",
    "me ensina python",
    "como criar site",
    "o que e ia",
    "qual a diferenca entre python e javascript",
]

print("\nTestes de geracao:")
for p in prompts:
    ids = tok.encode(p, add_special=True)
    x = torch.tensor([ids], dtype=torch.long)
    gen = m.generate(x, max_new_tokens=50, temperature=0.8)
    resp = tok.decode(gen[0].tolist())
    print(f"  Input: {p}")
    print(f"  Output: {resp}")
    print()

print("Server v2 OK!")
