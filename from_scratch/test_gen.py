import torch
import sys
sys.path.insert(0, 'D:/BRANPY-AI/from_scratch')
from model import create_model
from tokenizer import BPETokenizer

ckpt = torch.load('D:/BRANPY-AI/from_scratch/weights/bran9bpy_final/model_final.pt', map_location='cpu', weights_only=False)
cfg = ckpt.get('config', {})
tok = BPETokenizer()
tok.load('D:/BRANPY-AI/from_scratch/weights/bran9bpy_final/tokenizer.json')
vocab_size = cfg.get('vocab_size', 1054)
size = cfg.get('model_size', 'small')
model = create_model(vocab_size=vocab_size, size=size)
model.load_state_dict(ckpt['model_state_dict'])
model.eval()

tests = ['oi', 'ola', 'bom dia', 'quem e voce', 'o que voce faz', 'obrigado', 'tudo bem', 'me conta uma piada', 'voce e um robo?', 'como voce esta']
for t in tests:
    x = tok.encode(t, add_special=True)
    inp = torch.tensor([x], dtype=torch.long)
    out = model.generate(inp, max_new_tokens=50, temperature=0.8, top_k=40)
    resp = tok.decode(out[0].tolist())
    print(f'User: {t}')
    print(f'AI: {resp}')
    print()
