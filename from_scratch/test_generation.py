"""Teste de geração — BranPy AI Foundation Model v1."""
import os
import sys
import torch

sys.path.insert(0, os.path.dirname(__file__))
from model import BranPyModel, BranPyConfig, create_model
from tokenizer import BPETokenizer

save_dir = 'weights/bran9bpy_final'
ckpt_path = os.path.join(save_dir, 'model_final.pt')
tok_path = os.path.join(save_dir, 'tokenizer.json')

# Carregar modelo
ckpt = torch.load(ckpt_path, map_location='cpu', weights_only=False)
config = ckpt['config']
model = create_model(vocab_size=config['vocab_size'], size=config['model_size'])
model.load_state_dict(ckpt['model_state_dict'])
model.eval()

# Carregar tokenizer
tokenizer = BPETokenizer()
tokenizer.load(tok_path)

print("=" * 60)
print("BRANPY AI FOUNDATION MODEL v1 — TESTE DE GERACAO")
print(f"Modelo: {sum(p.numel() for p in model.parameters())/1e6:.2f}M params")
print(f"Tokens: {len(tokenizer.vocab)}")
print("=" * 60)

prompts = [
    "oi",
    "me ensina python",
    "como criar site",
    "o que e ia",
    "obrigado",
    "qual a diferenca entre python e javascript",
    "me conta uma piada",
    "como fazer um chat",
    "qual sua funcao",
    "como aprender programacao",
    "bom dia",
    "o que voce sabe fazer",
]

for prompt in prompts:
    ids = tokenizer.encode(prompt, add_special=True)
    x = torch.tensor([ids], dtype=torch.long)
    gen_ids = model.generate(x, max_new_tokens=80, temperature=0.7, top_k=40)
    response = tokenizer.decode(gen_ids[0].tolist())
    print(f"\n  Input: {prompt}")
    print(f"  Output: {response}")
