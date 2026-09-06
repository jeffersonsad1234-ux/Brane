"""Treina modelo BranPy — dataset GRANDE (generate_smart + generate_combined).

Pipeline 100% próprio. Sem modelos externos.
"""

import os
import sys
import time
import json
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

sys.path.insert(0, os.path.dirname(__file__))
from model import BranPyModel, BranPyConfig, create_model
from tokenizer import BPETokenizer
from generate_smart import gen as gerar_smart
from generate_combined import gerar_templates, gerar_fatos


class BranPyDataset(Dataset):
    def __init__(self, data: list, tokenizer: BPETokenizer, max_len: int = 256):
        self.data = data
        self.tokenizer = tokenizer
        self.max_len = max_len

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        text = self.data[idx]
        ids = self.tokenizer.encode(text, add_special=True)

        if len(ids) > self.max_len:
            ids = ids[:self.max_len]

        pad_id = self.tokenizer.pad_id
        padded = ids + [pad_id] * (self.max_len - len(ids))

        x = torch.tensor(padded[:-1], dtype=torch.long)
        y = torch.tensor(padded[1:], dtype=torch.long)

        mask = (x != pad_id).float()
        y = y.masked_fill(y == pad_id, -100)

        return x, y, mask


def train(
    model_size: str = 'small',
    epochs: int = 10,
    batch_size: int = 4,
    lr: float = 3e-4,
    max_len: int = 256,
    vocab_size: int = 8000,
    save_dir: str = 'weights/bran9bpy_final',
):
    os.makedirs(save_dir, exist_ok=True)
    log_path = os.path.join(save_dir, 'train_log.txt')

    def log(msg):
        print(msg)
        with open(log_path, 'a', encoding='utf-8') as f:
            f.write(msg + '\n')

    log("=" * 60)
    log("BRANPY AI FOUNDATION MODEL v1 — TREINO FINAL")
    log(f"Tamanho: {model_size} | Epochs: {epochs} | LR: {lr}")
    log(f"Max len: {max_len} | Vocab: {vocab_size}")
    log("=" * 60)

    # ==========================================
    # 1. GERAR DATASET GRANDE
    # ==========================================
    log("\n[1/6] Gerando dataset grande...")

    # Fonte 1: generate_smart.py (~25K linhas, templates combinatórios)
    log("  [1a] generate_smart.py (~25K linhas)...")
    smart_lines = gerar_smart()
    log(f"  {len(smart_lines)} linhas do generate_smart")

    # Fonte 2: generate_combined.py (templates + fatos, ~675 linhas)
    log("  [1b] generate_combined.py (templates + fatos)...")
    combined_lines = gerar_templates() + gerar_fatos()
    log(f"  {len(combined_lines)} linhas do generate_combined")

    # Combinar tudo
    all_lines = smart_lines + combined_lines

    # Embaralhar
    import random
    random.seed(42)
    random.shuffle(all_lines)

    # Salvar corpus
    corpus_dir = os.path.join(os.path.dirname(__file__), 'data')
    os.makedirs(corpus_dir, exist_ok=True)
    corpus_path = os.path.join(corpus_dir, 'corpus_final.txt')
    with open(corpus_path, 'w', encoding='utf-8') as f:
        for line in all_lines:
            f.write(line + '\n')

    log(f"\n  TOTAL: {len(all_lines)} linhas")
    log(f"  Corpus salvo: {corpus_path}")

    # Separar em pares (pergunta -> resposta)
    pairs = []
    i = 0
    while i < len(all_lines) - 1:
        if all_lines[i].strip() and all_lines[i + 1].strip():
            pairs.append(f"{all_lines[i]}\n{all_lines[i + 1]}")
            i += 2
        else:
            i += 1

    log(f"  Pares pergunta-resposta: {len(pairs)}")

    # ==========================================
    # 2. TOKENIZER PRÓPRIO
    # ==========================================
    tok_path = os.path.join(save_dir, 'tokenizer.json')
    log("\n[2/6] Treinando tokenizer BPE próprio...")
    tokenizer = BPETokenizer(vocab_size=vocab_size)
    tokenizer.train(all_lines)
    tokenizer.save(tok_path)
    actual_vocab = len(tokenizer.vocab)
    log(f"  Vocab final: {actual_vocab} tokens")

    # ==========================================
    # 3. MODELO PRÓPRIO (pesos aleatórios)
    # ==========================================
    log("\n[3/6] Criando modelo transformer do zero...")
    model = create_model(vocab_size=actual_vocab, size=model_size)
    n_params = sum(p.numel() for p in model.parameters())
    log(f"  Parametros: {n_params:,} ({n_params/1e6:.2f}M)")

    # ==========================================
    # 4. DATASET
    # ==========================================
    log("\n[4/6] Preparando dataset...")
    dataset = BranPyDataset(pairs, tokenizer, max_len=max_len)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    log(f"  {len(dataset)} exemplos, {len(dataloader)} batches")

    # ==========================================
    # 5. TREINAR
    # ==========================================
    log("\n[5/6] Treinando...")
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=0.01)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs * len(dataloader))

    total_steps = epochs * len(dataloader)
    step = 0
    best_loss = float('inf')
    start_time = time.time()

    for epoch in range(epochs):
        model.train()
        epoch_loss = 0
        epoch_steps = 0

        for batch_idx, (x, y, mask) in enumerate(dataloader):
            step += 1
            t0 = time.time()

            logits, loss = model(x, y)

            optimizer.zero_grad()
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            scheduler.step()

            dt = time.time() - t0
            epoch_loss += loss.item()
            epoch_steps += 1

            if step % 50 == 0 or step == 1:
                elapsed = time.time() - start_time
                pct = step / total_steps * 100
                avg_step = elapsed / step
                eta = avg_step * (total_steps - step)
                log(f"  Step {step}/{total_steps} ({pct:.1f}%) | Loss: {loss.item():.4f} | "
                    f"Tempo: {dt:.1f}s | ETA: {eta/60:.0f}min")

            if loss.item() < best_loss:
                best_loss = loss.item()

        avg_loss = epoch_loss / max(epoch_steps, 1)
        elapsed = time.time() - start_time
        log(f"\n  Epoch {epoch + 1}/{epochs} | Loss media: {avg_loss:.4f} | Melhor: {best_loss:.4f} | "
            f"Tempo: {elapsed/60:.1f}min")

        # Checkpoint
        ckpt_path = os.path.join(save_dir, f'model_epoch{epoch + 1}.pt')
        torch.save({
            'epoch': epoch + 1,
            'model_state_dict': model.state_dict(),
            'optimizer_state_dict': optimizer.state_dict(),
            'loss': avg_loss,
            'config': {
                'vocab_size': actual_vocab,
                'model_size': model_size,
                'n_layers': model.config.n_layers,
                'd_model': model.config.d_model,
                'n_heads': model.config.n_heads,
                'd_ff': model.config.d_ff,
                'max_seq_len': max_len,
            }
        }, ckpt_path)
        log(f"  Checkpoint salvo: {ckpt_path}")

    # ==========================================
    # 6. MODELO FINAL
    # ==========================================
    final_path = os.path.join(save_dir, 'model_final.pt')
    torch.save({
        'model_state_dict': model.state_dict(),
        'tokenizer_path': tok_path,
        'config': {
            'vocab_size': actual_vocab,
            'model_size': model_size,
            'n_layers': model.config.n_layers,
            'd_model': model.config.d_model,
            'n_heads': model.config.n_heads,
            'd_ff': model.config.d_ff,
            'max_seq_len': max_len,
        }
    }, final_path)

    total_time = time.time() - start_time
    log("\n" + "=" * 60)
    log("BRANPY AI FOUNDATION MODEL v1 — CONCLUIDO!")
    log(f"Tempo total: {total_time/60:.1f}min ({total_time/3600:.2f}h)")
    log(f"Melhor loss: {best_loss:.4f}")
    log(f"Parametros: {n_params:,} ({n_params/1e6:.2f}M)")
    log(f"Dataset: {len(pairs)} pares ({len(all_lines)} linhas)")
    log(f"Modelo: {final_path}")
    log(f"Tokenizer: {tok_path}")
    log("=" * 60)

    # Teste de geração
    log("\n[6/6] Teste de geracao...")
    model.eval()
    test_prompts = [
        "oi",
        "me ensina python",
        "como criar site",
        "o que e ia",
        "obrigado",
    ]
    for prompt in test_prompts:
        ids = tokenizer.encode(prompt, add_special=True)
        x = torch.tensor([ids], dtype=torch.long)
        gen_ids = model.generate(x, max_new_tokens=50, temperature=0.8)
        response = tokenizer.decode(gen_ids[0].tolist())
        log(f"  Input: {prompt}")
        log(f"  Output: {response}")
        log("")

    return model, tokenizer


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='BranPy AI Foundation Model v1')
    parser.add_argument('--size', default='small', choices=['tiny', 'small', 'medium', 'base'])
    parser.add_argument('--epochs', type=int, default=10)
    parser.add_argument('--batch', type=int, default=4)
    parser.add_argument('--lr', type=float, default=3e-4)
    parser.add_argument('--max-len', type=int, default=256)
    parser.add_argument('--vocab', type=int, default=8000)
    args = parser.parse_args()

    train(
        model_size=args.size,
        epochs=args.epochs,
        batch_size=args.batch,
        lr=args.lr,
        max_len=args.max_len,
        vocab_size=args.vocab,
    )
