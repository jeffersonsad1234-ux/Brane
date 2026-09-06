"""Treina modelo BranPy do ZERO — 100% proprio, CPU only, zero licenca.
Versão 2: Validação, Early Stopping, Gradient Accumulation, Eval periódico.
Arquitetura XL (140M params), vocab 32k, corpus 5M exemplos.
"""

import os
import sys
import time
import json
import random
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

sys.path.insert(0, os.path.dirname(__file__))
from model import BranPyModel, BranPyConfig, create_model
from tokenizer import BPETokenizer


class BranPyDataset(Dataset):
    def __init__(self, data: list, tokenizer: BPETokenizer, max_len: int = 512):
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

        # Clamp token IDs to valid vocab range
        vocab_size = len(self.tokenizer.vocab)
        ids = [min(id, vocab_size - 1) for id in ids]

        pad_id = self.tokenizer.pad_id
        padded = ids + [pad_id] * (self.max_len - len(ids))

        x = torch.tensor(padded[:-1], dtype=torch.long)
        y = torch.tensor(padded[1:], dtype=torch.long)

        mask = (x != pad_id).float()
        y = y.masked_fill(y == pad_id, -100)

        return x, y, mask


def evaluate(model, dataloader, device):
    """Avalia modelo no conjunto de validação."""
    model.eval()
    total_loss = 0
    total_tokens = 0
    correct = 0
    
    with torch.no_grad():
        for x, y, mask in dataloader:
            x = x.to(device)
            y = y.to(device)
            mask = mask.to(device)
            
            logits, loss = model(x, y)
            
            # Loss média ponderada por tokens válidos
            total_loss += loss.item() * mask.sum().item()
            total_tokens += mask.sum().item()
            
            # Accuracy token-level (aprox)
            preds = logits.argmax(dim=-1)
            correct += ((preds == y) & (mask.bool())).sum().item()
    
    avg_loss = total_loss / max(total_tokens, 1)
    acc = correct / max(total_tokens, 1)
    return avg_loss, acc


def train(
    model_size: str = 'xl',
    epochs: int = 20,
    batch_size: int = 2,
    grad_accum_steps: int = 16,  # Simula batch 32
    lr: float = 1e-4,
    max_len: int = 1024,
    vocab_size: int = 32000,
    save_dir: str = 'weights/branpy_xl_reasoning',
    val_split: float = 0.05,
    eval_every_steps: int = 500,
    early_stop_patience: int = 999,
    seed: int = 42,
    corpus_path: str = None,
):
    # Reprodutibilidade
    random.seed(seed)
    torch.manual_seed(seed)
    
    os.makedirs(save_dir, exist_ok=True)
    log_path = os.path.join(save_dir, 'train_log.txt')

    def log(msg):
        print(msg)
        with open(log_path, 'a', encoding='utf-8') as f:
            f.write(msg + '\n')

    log("=" * 60)
    log("BRANPY MODEL — TREINO COM VALIDAÇÃO E RACIOCÍNIO")
    log(f"Tamanho: {model_size} | Epochs: {epochs} | LR: {lr}")
    log(f"Max len: {max_len} | Vocab: {vocab_size}")
    log(f"Batch: {batch_size} | Grad Accum: {grad_accum_steps} (efetivo: {batch_size * grad_accum_steps})")
    log(f"Val split: {val_split} | Eval a cada: {eval_every_steps} steps")
    log(f"Early stop patience: {early_stop_patience}")
    log("=" * 60)

    # 1. Carrega corpus de raciocínio
    log("\n[1/7] Carregando corpus de raciocínio...")
    if corpus_path is None:
        corpus_path = os.path.join(os.path.dirname(__file__), 'data', 'corpus_reasoning_large.txt')
    if not os.path.exists(corpus_path):
        log(f"ERRO: Corpus não encontrado em {corpus_path}")
        log("Execute: python generate_reasoning.py --total 5000000")
        return None, None
    
    with open(corpus_path, 'r', encoding='utf-8') as f:
        content = f.read()
    lines = [l.strip() for l in content.split('\n\n') if l.strip()]
    log(f"  {len(lines):,} exemplos carregados")

    # Split treino/val
    random.shuffle(lines)
    val_size = int(len(lines) * val_split)
    val_lines = lines[:val_size]
    train_lines = lines[val_size:]
    log(f"  Treino: {len(train_lines):,} | Val: {len(val_lines):,}")

    # 2. Tokenizer
    log("\n[2/7] Treinando tokenizer BPE próprio...")
    tokenizer = BPETokenizer(vocab_size=vocab_size)
    tokenizer.train(train_lines)  # Treina só no treino (evita data leakage)
    
    tok_path = os.path.join(save_dir, 'tokenizer.json')
    tokenizer.save(tok_path)
    actual_vocab = len(tokenizer.vocab)
    log(f"  Vocab final: {actual_vocab:,} tokens")

    # 3. Modelo
    log("\n[3/7] Criando modelo transformer do zero...")
    model = create_model(vocab_size=actual_vocab, size=model_size)
    n_params = sum(p.numel() for p in model.parameters())
    log(f"  Parâmetros: {n_params:,} ({n_params/1e6:.2f}M)")

    device = torch.device('cpu')
    model = model.to(device)

    # 4. Datasets
    log("\n[4/7] Preparando datasets...")
    train_dataset = BranPyDataset(train_lines, tokenizer, max_len=max_len)
    val_dataset = BranPyDataset(val_lines, tokenizer, max_len=max_len)
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)
    
    log(f"  Treino: {len(train_dataset):,} exemplos, {len(train_loader):,} batches")
    log(f"  Val: {len(val_dataset):,} exemplos, {len(val_loader):,} batches")

    # 5. Otimizador + Scheduler
    log("\n[5/7] Configurando otimização...")
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=0.01, betas=(0.9, 0.95))
    
    total_steps = epochs * len(train_loader)
    warmup_steps = min(500, total_steps // 10)
    
    def lr_lambda(step):
        if step < warmup_steps:
            return step / warmup_steps
        # Cosine decay after warmup
        progress = (step - warmup_steps) / max(1, total_steps - warmup_steps)
        return 0.5 * (1 + torch.cos(torch.tensor(progress * 3.14159))).item()
    
    scheduler = torch.optim.lr_scheduler.LambdaLR(optimizer, lr_lambda)
    
    log(f"  Total steps: {total_steps:,} | Warmup: {warmup_steps}")

    # 6. Treino
    log("\n[6/7] Iniciando treino...")
    step = 0
    best_val_loss = float('inf')
    best_step = 0
    early_stop_counter = 0
    start_time = time.time()
    
    # Log de hyperparams
    log(f"Hyperparams: lr={lr}, wd=0.01, beta=(0.9,0.95), grad_clip=1.0")
    log(f"Grad accum steps: {grad_accum_steps} (batch efetivo: {batch_size * grad_accum_steps})")
    log("-" * 60)

    for epoch in range(epochs):
        model.train()
        epoch_loss = 0
        epoch_steps = 0
        accum_loss = 0
        
        optimizer.zero_grad()
        
        for batch_idx, (x, y, mask) in enumerate(train_loader):
            step += 1
            t0 = time.time()
            
            x = x.to(device)
            y = y.to(device)
            mask = mask.to(device)
            
            logits, loss = model(x, y)
            loss = loss / grad_accum_steps  # Normaliza por acumulação
            
            loss.backward()
            accum_loss += loss.item()
            
            if step % grad_accum_steps == 0:
                nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                optimizer.step()
                scheduler.step()
                optimizer.zero_grad()
            
            epoch_loss += loss.item() * grad_accum_steps
            epoch_steps += 1
            dt = time.time() - t0
            
            # Log periódico
            if step % 10 == 0 or step == 1:
                elapsed = time.time() - start_time
                pct = step / total_steps * 100
                avg_step = elapsed / step
                eta = avg_step * (total_steps - step)
                current_lr = optimizer.param_groups[0]['lr']
                log(f"  Step {step}/{total_steps} ({pct:.1f}%) | Loss: {loss.item() * grad_accum_steps:.4f} | "
                    f"LR: {current_lr:.2e} | Tempo: {dt:.1f}s | ETA: {eta/60:.0f}min")
            
            # Avaliação periódica
            if step % eval_every_steps == 0:
                val_loss, val_acc = evaluate(model, val_loader, device)
                log(f"  >> EVAL step {step} | Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.4f}")
                
                # Early stopping + best model
                if val_loss < best_val_loss:
                    best_val_loss = val_loss
                    best_step = step
                    early_stop_counter = 0
                    
                    # Salva best model
                    best_path = os.path.join(save_dir, 'model_best.pt')
                    torch.save({
                        'step': step,
                        'epoch': epoch + 1,
                        'model_state_dict': model.state_dict(),
                        'optimizer_state_dict': optimizer.state_dict(),
                        'scheduler_state_dict': scheduler.state_dict(),
                        'val_loss': val_loss,
                        'val_acc': val_acc,
                        'config': {
                            'vocab_size': actual_vocab,
                            'model_size': model_size,
                            'n_layers': model.config.n_layers,
                            'd_model': model.config.d_model,
                            'n_heads': model.config.n_heads,
                            'd_ff': model.config.d_ff,
                            'max_seq_len': max_len,
                        }
                    }, best_path)
                    log(f"  >> NEW BEST model saved (val_loss={val_loss:.4f})")
                else:
                    early_stop_counter += 1
                    log(f"  >> No improvement ({early_stop_counter}/{early_stop_patience})")
                    
                    if early_stop_counter >= early_stop_patience:
                        log(f"\n>>> EARLY STOPPING at step {step} (best at step {best_step})")
                        break
        
        # Fim da epoch
        avg_loss = epoch_loss / max(epoch_steps, 1)
        elapsed = time.time() - start_time
        log(f"\n  Epoch {epoch + 1}/{epochs} | Loss média: {avg_loss:.4f} | Best val: {best_val_loss:.4f} | Tempo: {elapsed/60:.1f}min")
        
        # Checkpoint por epoch
        ckpt_path = os.path.join(save_dir, f'model_epoch{epoch + 1}.pt')
        torch.save({
            'epoch': epoch + 1,
            'step': step,
            'model_state_dict': model.state_dict(),
            'optimizer_state_dict': optimizer.state_dict(),
            'scheduler_state_dict': scheduler.state_dict(),
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
        
        if early_stop_counter >= early_stop_patience:
            break

    # 7. Final
    total_time = time.time() - start_time
    log("\n" + "=" * 60)
    log(f"TREINO CONCLUÍDO!")
    log(f"Tempo total: {total_time/60:.1f}min ({total_time/3600:.2f}h)")
    log(f"Best val loss: {best_val_loss:.4f} (step {best_step})")
    log(f"Parâmetros: {n_params:,} ({n_params/1e6:.2f}M)")
    log(f"Best model: {os.path.join(save_dir, 'model_best.pt')}")
    log(f"Tokenizer: {tok_path}")
    log("=" * 60)

    # Teste final
    log("\n[7/7] Teste de geração...")
    model.eval()
    test_prompts = [
        "Humor: Ana tem 3 maçãs e compra 2. Quantas maçãs Ana tem agora?\nIA:",
        "Humor: João tem 5 livros e Maria tem 3. Quem tem mais?\nIA:",
        "Humor: Se todos os gatos são mamíferos. Felix é gato. Felix é mamífero?\nIA:",
        "Humor: Choveu muito. O rio subiu. Por que o rio subiu?\nIA:",
        "Humor: Qual a capital de Xylophia?\nIA:",
        "Humor: Pedro tem 4 laranjas e compra 3. Quantas possui agora?\nIA:",
    ]
    for prompt in test_prompts:
        ids = tokenizer.encode(prompt, add_special=True)
        x = torch.tensor([ids], dtype=torch.long).to(device)
        gen_ids = model.generate(x, max_new_tokens=60, temperature=0.7, top_k=40, top_p=0.9, repetition_penalty=1.1)
        response = tokenizer.decode(gen_ids[0].tolist())
        log(f"  Input: {prompt}")
        log(f"  Output: {response}")
        log("")

    return model, tokenizer


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='BranPy Model — Treino com Validação')
    parser.add_argument('--size', default='fast', choices=['tiny', 'small', 'medium', 'base', 'xl', 'practical', 'fast'])
    parser.add_argument('--epochs', type=int, default=5)
    parser.add_argument('--batch', type=int, default=8)
    parser.add_argument('--grad-accum', type=int, default=4, help='Gradient accumulation steps')
    parser.add_argument('--lr', type=float, default=5e-4)
    parser.add_argument('--max-len', type=int, default=512)
    parser.add_argument('--vocab', type=int, default=8000)
    parser.add_argument('--eval-every', type=int, default=200)
    parser.add_argument('--patience', type=int, default=999)
    parser.add_argument('--seed', type=int, default=42)
    parser.add_argument('--corpus', type=str, default=None, help='Path to corpus file')
    parser.add_argument('--weights-dir', type=str, default=None, help='Directory to save checkpoints')
    args = parser.parse_args()

    train(
        model_size=args.size,
        epochs=args.epochs,
        batch_size=args.batch,
        grad_accum_steps=args.grad_accum,
        lr=args.lr,
        max_len=args.max_len,
        vocab_size=args.vocab,
        corpus_path=args.corpus,
        save_dir=args.weights_dir or 'weights/branpy_xl_reasoning',
        eval_every_steps=args.eval_every,
        early_stop_patience=args.patience,
        seed=args.seed,
    )