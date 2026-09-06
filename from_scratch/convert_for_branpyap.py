"""Converte modelo treinado do zero pra uso no branpyAP."""

import os
import sys
import json
import torch

sys.path.insert(0, os.path.dirname(__file__))
from model import BranPyModel, BranPyConfig
from tokenizer import BPETokenizer


def convert_to_branpyap(
    model_path: str = 'weights/bran9bpy_scratch/model_final.pt',
    tokenizer_path: str = 'weights/bran9bpy_scratch/tokenizer.json',
    output_dir: str = 'weights/bran9bpy_scratch/converterd',
):
    os.makedirs(output_dir, exist_ok=True)

    print("[Convert] Carregando modelo...")
    checkpoint = torch.load(model_path, map_location='cpu', weights_only=False)
    config_dict = checkpoint['config']

    config = BranPyConfig(
        vocab_size=config_dict['vocab_size'],
        n_layers=config_dict['n_layers'],
        d_model=config_dict['d_model'],
        n_heads=config_dict['n_heads'],
        d_ff=config_dict['d_ff'],
        max_seq_len=config_dict.get('max_seq_len', 256),
    )

    model = BranPyModel(config)
    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()

    print("[Convert] Carregando tokenizer...")
    tokenizer = BPETokenizer()
    tokenizer.load(tokenizer_path)

    print("[Convert] Exportando modelo...")
    dummy = torch.zeros(1, 64, dtype=torch.long)
    traced = torch.jit.trace(model, (dummy,), strict=False)
    traced_path = os.path.join(output_dir, 'bran9bpy_scratch.pt')
    traced.save(traced_path)
    print(f"  JIT model: {traced_path}")

    state_path = os.path.join(output_dir, 'model_state.pt')
    torch.save({
        'model_state_dict': model.state_dict(),
        'config': config_dict,
        'tokenizer_path': tokenizer_path,
    }, state_path)
    print(f"  State dict: {state_path}")

    info = {
        'name': 'bran9bpy-scratch',
        'version': '1.0.0',
        'type': 'transformer-causal',
        'params_millions': round(sum(p.numel() for p in model.parameters()) / 1e6, 2),
        'vocab_size': config_dict['vocab_size'],
        'n_layers': config_dict['n_layers'],
        'd_model': config_dict['d_model'],
        'n_heads': config_dict['n_heads'],
        'max_seq_len': config_dict.get('max_seq_len', 256),
        'license': 'PROPRIETARY — branpy.com.br',
        'files': {
            'model': 'model_state.pt',
            'tokenizer': os.path.basename(tokenizer_path),
        }
    }
    info_path = os.path.join(output_dir, 'model_info.json')
    with open(info_path, 'w') as f:
        json.dump(info, f, indent=2)
    print(f"  Info: {info_path}")

    print("\n[Convert] Modelo pronto pro branpyAP!")
    print(f"  Copie os arquivos pra D:\\BRANPY-AI\\weights\\bran9bpy-scratch\\")
    return output_dir


if __name__ == '__main__':
    convert_to_branpyap()
