import sys, time, torch
sys.path.insert(0, r"D:\BRANPY-AI\from_scratch")
from train_v4 import BranPy, generate
from tokenizers import Tokenizer

tok = Tokenizer.from_file(r"D:\BRANPY-AI\from_scratch\tokenizer_v4.json")
path = r"D:\BRANPY-AI\from_scratch\weights\branpy_v4\last.pt"
ckpt = torch.load(path, weights_only=False, map_location="cpu")
model = BranPy(vocab=tok.get_vocab_size(), d_model=384, n_layers=6, n_heads=6, d_ff=1536, max_len=128)
model.load_state_dict(ckpt["model"])
model.eval()

tests = [
    "quem e voce",
    "o que voce sabe fazer",
    "me conta uma piada",
    "como aprender programacao",
    "qual a capital do brasil",
    "o que e inteligencia artificial",
    "como fazer bolo",
    "voce e humana",
]

for q in tests:
    t0 = time.time()
    r = generate(model, tok, q, max_new=150, temperature=0.7)
    dt = time.time() - t0
    print("P:", q)
    print("R:", r[:300])
    print("Tempo:", round(dt, 1), "s")
    print("---")
