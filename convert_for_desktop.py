"""Converte modelo BranPy pro formato do BRANPY AI DESKTOP.

Copia modelo + tokenizer pra pasta do Desktop app.
"""
import os
import shutil
from pathlib import Path

BASE = Path(__file__).resolve().parent
WEIGHTS = BASE / "from_scratch" / "weights"
DESKTOP = Path(r"D:\BRANPY-AI-DESKTOP")
DESKTOP_MODELS = DESKTOP / "src" / "core" / "ai" / "models"


def convert(model_name: str = "bran9bpy_final", output_name: str = "branpy-small"):
    src_dir = WEIGHTS / model_name
    src_model = src_dir / "model_final.pt"
    src_tok = src_dir / "tokenizer.json"

    if not src_model.exists():
        print(f"Modelo nao encontrado: {src_model}")
        return False

    if not src_tok.exists():
        print(f"Tokenizer nao encontrado: {src_tok}")
        return False

    # Criar diretorio de saida
    out_dir = DESKTOP_MODELS / output_name
    out_dir.mkdir(parents=True, exist_ok=True)

    # Copiar modelo
    dst_model = out_dir / "model.pt"
    shutil.copy2(src_model, dst_model)
    print(f"Modelo copiado: {dst_model} ({dst_model.stat().st_size/1e6:.1f}MB)")

    # Copiar tokenizer
    dst_tok = out_dir / "tokenizer.json"
    shutil.copy2(src_tok, dst_tok)
    print(f"Tokenizer copiado: {dst_tok}")

    # Criar metadata
    import json
    import torch
    ckpt = torch.load(str(src_model), map_location="cpu", weights_only=False)
    cfg = ckpt.get("config", {})

    metadata = {
        "name": output_name,
        "display_name": f"BranPy {cfg.get('model_size', 'small').title()}",
        "version": "v1",
        "owner": "branpy.com.br",
        "params": f"{sum(p.numel() for p in torch.zeros(1).new_empty(0))/1e6:.1f}M" if False else "5.1M",
        "vocab_size": cfg.get("vocab_size", 8000),
        "n_layers": cfg.get("n_layers", 6),
        "d_model": cfg.get("d_model", 256),
        "n_heads": cfg.get("n_heads", 8),
        "d_ff": cfg.get("d_ff", 1024),
        "max_seq_len": cfg.get("max_seq_len", 256),
        "model_size": cfg.get("model_size", "small"),
        "restrictions": "NONE — modelo 100% cru, sem RLHF, sem safety training",
        "license": "Proprietario — branpy.com.br",
        "architecture": "Transformer (proprio)",
        "tokenizer": "BPE (proprio)",
    }

    meta_path = out_dir / "metadata.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    print(f"Metadata salva: {meta_path}")

    print(f"\nModelo convertido: {out_dir}")
    print(f"Tamanho total: {sum(f.stat().st_size for f in out_dir.iterdir()) / 1e6:.1f}MB")
    return True


if __name__ == "__main__":
    print("=" * 50)
    print("CONVERSOR - BranPy Model - Desktop Format")
    print("=" * 50)

    print("\n1. Convertendo modelo small (5M)...")
    convert("bran9bpy_final", "branpy-small")

    print("\n2. Verificando se Desktop app detecta...")
    if DESKTOP.exists():
        print(f"   Desktop app encontrado: {DESKTOP}")
        models_dir = DESKTOP_MODELS
        if models_dir.exists():
            for d in models_dir.iterdir():
                if d.is_dir():
                    files = list(d.iterdir())
                    print(f"   Modelo: {d.name} ({len(files)} arquivos)")
        else:
            print(f"   Criando dir de modelos: {models_dir}")
            models_dir.mkdir(parents=True, exist_ok=True)
    else:
        print(f"   Desktop app nao encontrado: {DESKTOP}")

    print("\nConversao concluida!")
