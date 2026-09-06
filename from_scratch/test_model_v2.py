"""Teste completo do modelo BranPy V2"""
import sys, json, time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import torch
import torch.nn.functional as F
from tokenizers import Tokenizer
from train_v2 import BranPy, generate

WEIGHTS = Path(r"D:\BRANPY-AI\from_scratch\weights\branpy_v2")
TOK_PATH = Path(r"D:\BRANPY-AI\from_scratch\tokenizer_v2.json")

def load_model():
    tok = Tokenizer.from_file(str(TOK_PATH))
    
    # Verificar qual checkpoint tem a melhor loss
    best_loss = float("inf")
    best_file = None
    for f in WEIGHTS.glob("epoch_*.pt"):
        ckpt = torch.load(str(f), weights_only=False, map_location="cpu")
        if ckpt.get("loss", float("inf")) < best_loss:
            best_loss = ckpt["loss"]
            best_file = f
    
    if best_file is None:
        best_file = WEIGHTS / "best.pt"
    
    print(f"Carregando: {best_file.name} (loss: {best_loss:.4f})")
    ckpt = torch.load(str(best_file), weights_only=False, map_location="cpu")
    
    model = BranPy(
        vocab=tok.get_vocab_size(),
        d_model=384, n_layers=6, n_heads=6, d_ff=1536, max_len=256
    )
    model.load_state_dict(ckpt["model"])
    model.eval()
    
    params = sum(p.numel() for p in model.parameters())
    print(f"Modelo: {params/1e6:.1f}M params | Epoch: {ckpt.get('epoch', '?')}")
    print("=" * 60)
    return model, tok

def test(model, tok, prompt, max_new=200, temp=0.8):
    t0 = time.time()
    resp = generate(model, tok, prompt, max_new=max_new, temperature=temp)
    dt = time.time() - t0
    return resp, dt

def main():
    model, tok = load_model()
    
    prompts = [
        ("Quem e voce?", "Personalidade"),
        ("O que e inteligencia artificial?", "Conhecimento geral"),
        ("Como funciona um computador?", "Tecnologia"),
        ("Me conta uma piada", "Humor"),
        ("Como aprender programacao?", "Dicas"),
        ("O que voce sabe fazer?", "Capabilities"),
        ("Me explique quantum", "Ciencia"),
        ("Qual a capital do Brasil?", "Trivia"),
        ("Como criar um app?", "Programacao"),
        ("Voce e humana?", "Identidade"),
    ]
    
    print("TESTANDO MODELO BRANPY V2")
    print("=" * 60)
    
    total_time = 0
    for prompt, category in prompts:
        print(f"\n[{category}] P: {prompt}")
        resp, dt = test(model, tok, prompt)
        print(f"R: {resp[:300]}")
        print(f"Tempo: {dt:.1f}s | Tokens: ~{len(resp.split())}")
        total_time += dt
    
    print("\n" + "=" * 60)
    print(f"Tempo total: {total_time:.1f}s | Media: {total_time/len(prompts):.1f}s por pergunta")
    
    # Salvar respostas
    results = []
    for prompt, category in prompts:
        resp, dt = test(model, tok, prompt)
        results.append({"category": category, "prompt": prompt, "response": resp, "time": dt})
    
    with open(WEIGHTS / "test_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"Resultados salvos em: {WEIGHTS / 'test_results.json'}")

if __name__ == "__main__":
    main()
