"""Pipeline progressivo: 100M → 200M → 300M → 400M → 500M
Cada stage carrega os pesos do anterior e adiciona layers novas."""

import os
import sys
import time
import json
import gc
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

sys.path.insert(0, os.path.dirname(__file__))
from model import BranPyModel, BranPyConfig
from tokenizer import BPETokenizer
from generate_data import generate_corpus


class BranPyDataset(Dataset):
    def __init__(self, data, tokenizer, max_len=256):
        self.data = data
        self.tokenizer = tokenizer
        self.max_len = max_len

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        ids = self.tokenizer.encode(self.data[idx], add_special=True)
        if len(ids) > self.max_len:
            ids = ids[:self.max_len]
        pad_id = self.tokenizer.pad_id
        padded = ids + [pad_id] * (self.max_len - len(ids))
        x = torch.tensor(padded[:-1], dtype=torch.long)
        y = torch.tensor(padded[1:], dtype=torch.long)
        y = y.masked_fill(y == pad_id, -100)
        return x, y


STAGES = [
    {"name": "100M", "layers": 12, "d": 512, "heads": 8, "ff": 2048, "epochs": 15},
    {"name": "200M", "layers": 24, "d": 512, "heads": 8, "ff": 2048, "epochs": 10},
    {"name": "300M", "layers": 24, "d": 640, "heads": 10, "ff": 2560, "epochs": 8},
    {"name": "400M", "layers": 32, "d": 640, "heads": 10, "ff": 2560, "epochs": 6},
    {"name": "500M", "layers": 32, "d": 768, "heads": 12, "ff": 3072, "epochs": 5},
]

BASE_DIR = os.path.join(os.path.dirname(__file__), '..', 'weights', 'bran9bpy_progressive')


def create_model_for_stage(vocab_size, stage):
    config = BranPyConfig(
        vocab_size=vocab_size,
        max_seq_len=256,
        n_layers=stage['layers'],
        d_model=stage['d'],
        n_heads=stage['heads'],
        d_ff=stage['ff'],
        dropout=0.1,
    )
    return BranPyModel(config)


def load_previous_weights(model, prev_ckpt_path):
    """Carrega pesos do stage anterior, copiando layers que existem."""
    if not os.path.exists(prev_ckpt_path):
        print(f"  [!] Checkpoint anterior nao encontrado: {prev_ckpt_path}")
        return model

    prev = torch.load(prev_ckpt_path, map_location='cpu', weights_only=False)
    prev_state = prev['model_state_dict']
    curr_state = model.state_dict()

    loaded = 0
    skipped = 0
    for key in curr_state:
        if key in prev_state and prev_state[key].shape == curr_state[key].shape:
            curr_state[key] = prev_state[key]
            loaded += 1
        else:
            skipped += 1

    model.load_state_dict(curr_state)
    print(f"  Pesos carregados: {loaded} tensores | Novos: {skipped} tensores")
    return model


def train_stage(stage, stage_idx, tokenizer, corpus_lines, prev_ckpt=None):
    stage_dir = os.path.join(BASE_DIR, stage['name'])
    os.makedirs(stage_dir, exist_ok=True)
    log_path = os.path.join(stage_dir, 'train_log.txt')

    def log(msg):
        print(msg, flush=True)
        with open(log_path, 'a', encoding='utf-8') as f:
            f.write(msg + '\n')

    log(f"\n{'='*60}")
    log(f"STAGE {stage_idx+1}: {stage['name']}")
    log(f"Layers: {stage['layers']} | D: {stage['d']} | Heads: {stage['heads']}")
    log(f"Epochs: {stage['epochs']}")
    log(f"{'='*60}")

    actual_vocab = len(tokenizer.vocab)
    model = create_model_for_stage(actual_vocab, stage)

    if prev_ckpt:
        log(f"\nCarregando pesos do stage anterior...")
        model = load_previous_weights(model, prev_ckpt)

    n_params = sum(p.numel() for p in model.parameters())
    log(f"  Parametros: {n_params:,} ({n_params/1e6:.1f}M)")

    dataset = BranPyDataset(corpus_lines, tokenizer, max_len=256)
    dataloader = DataLoader(dataset, batch_size=1, shuffle=True, num_workers=0)
    log(f"  {len(dataset)} exemplos, {len(dataloader)} batches/epoch")

    optimizer = torch.optim.AdamW(model.parameters(), lr=2e-4, weight_decay=0.01)

    total_steps = stage['epochs'] * len(dataloader)
    step = 0
    best_loss = float('inf')
    start_time = time.time()

    for epoch in range(stage['epochs']):
        model.train()
        epoch_loss = 0
        epoch_steps = 0

        for x, y in dataloader:
            step += 1
            t0 = time.time()

            if step % 20 == 0:
                gc.collect()

            logits, loss = model(x, y)
            optimizer.zero_grad(set_to_none=True)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()

            dt = time.time() - t0
            epoch_loss += loss.item()
            epoch_steps += 1

            if step % 10 == 0 or step == 1:
                elapsed = time.time() - start_time
                pct = step / total_steps * 100
                avg_step = elapsed / step
                eta = avg_step * (total_steps - step)
                log(f"  Step {step}/{total_steps} ({pct:.1f}%) | Loss: {loss.item():.4f} | "
                    f"{dt:.1f}s/step | ETA: {eta/60:.0f}min")

            if loss.item() < best_loss:
                best_loss = loss.item()

        avg_loss = epoch_loss / max(epoch_steps, 1)
        elapsed = time.time() - start_time
        log(f"\n  Epoch {epoch+1}/{stage['epochs']} | Loss: {avg_loss:.4f} | "
            f"Melhor: {best_loss:.4f} | {elapsed/60:.1f}min")

    ckpt_path = os.path.join(stage_dir, 'model_final.pt')
    torch.save({
        'model_state_dict': model.state_dict(),
        'stage': stage['name'],
        'config': {
            'vocab_size': actual_vocab,
            'n_layers': stage['layers'],
            'd_model': stage['d'],
            'n_heads': stage['heads'],
            'd_ff': stage['ff'],
            'max_seq_len': 256,
        }
    }, ckpt_path)

    total_time = time.time() - start_time
    log(f"\n  STAGE {stage['name']} CONCLUIDO!")
    log(f"  Loss: {best_loss:.4f} | Tempo: {total_time/60:.1f}min")
    log(f"  Checkpoint: {ckpt_path}")

    log(f"\n  Teste de geracao:")
    model.eval()
    for prompt in ["oi", "eu te amo", "me ensina python", "como criar site"]:
        ids = tokenizer.encode(prompt, add_special=True)
        x = torch.tensor([ids], dtype=torch.long)
        gen = model.generate(x, max_new_tokens=80, temperature=0.8)
        resp = tokenizer.decode(gen[0].tolist())
        log(f"    {prompt} → {resp}")

    return model, ckpt_path


def main():
    os.makedirs(BASE_DIR, exist_ok=True)

    print("=" * 60)
    print("BRANPY - TREINO PROGRESSIVO 100M -> 500M")
    print("=" * 60)

    print("\nGerando corpus...")
    lines = generate_corpus()
    corpus_path = os.path.join(BASE_DIR, 'corpus_br.txt')
    with open(corpus_path, 'w', encoding='utf-8') as f:
        for l in lines:
            f.write(l + '\n')
    print(f"  {len(lines)} linhas")

    tok_path = os.path.join(BASE_DIR, 'tokenizer.json')
    print("\nTreinando tokenizer...")
    tokenizer = BPETokenizer(vocab_size=16000)
    tokenizer.train(lines)
    tokenizer.save(tok_path)
    print(f"  Vocab: {len(tokenizer.vocab)} tokens")

    prev_ckpt = None
    results = []

    for i, stage in enumerate(STAGES):
        print(f"\n{'#'*60}")
        print(f"# INICIANDO STAGE {i+1}/{len(STAGES)}: {stage['name']}")
        print(f"{'#'*60}")

        model, ckpt = train_stage(stage, i, tokenizer, lines, prev_ckpt)
        prev_ckpt = ckpt
        results.append({"stage": stage['name'], "checkpoint": ckpt})

        del model
        gc.collect()

    print("\n" + "=" * 60)
    print("TODOS OS STAGES CONCLUIDOS!")
    print("=" * 60)
    for r in results:
        print(f"  {r['stage']}: {r['checkpoint']}")

    summary_path = os.path.join(BASE_DIR, 'summary.json')
    with open(summary_path, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\n  Resumo: {summary_path}")


if __name__ == '__main__':
    main()
