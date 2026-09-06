"""Treina modelo BranPy MEDIUM (150M) — Otimizado para 8GB RAM + CPU.

Config:
- 16 camadas, d_model=768, 12 heads, d_ff=3072
- Gradient checkpointing
- Batch size 1 + gradient accumulation 8
- AdamW com grad clipping 0.5
- Warmup 50 steps
"""
import os
import sys
import time
import gc
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from torch.utils.checkpoint import checkpoint

sys.path.insert(0, os.path.dirname(__file__))
from model import BranPyModel, BranPyConfig, create_model
from tokenizer import BPETokenizer
from generate_smart import gen as gerar_smart
from generate_combined import gerar_templates, gerar_fatos


class BranPyDataset(Dataset):
    def __init__(self, data, tokenizer, max_len=256):
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


class BranPyModelCheckpointed(nn.Module):
    def __init__(self, model):
        super().__init__()
        self.model = model

    def forward(self, idx, targets=None):
        B, T = idx.shape
        pos = torch.arange(0, T, dtype=torch.long, device=idx.device).unsqueeze(0)
        x = self.model.drop(self.model.tok_emb(idx) + self.model.pos_emb(pos))
        mask = torch.tril(torch.ones(T, T, device=idx.device)).unsqueeze(0).unsqueeze(0)
        for block in self.model.blocks:
            x = checkpoint(block, x, mask, use_reentrant=False)
        x = self.model.ln_f(x)
        logits = self.model.head(x)
        loss = None
        if targets is not None:
            loss = F.cross_entropy(
                logits.view(-1, logits.size(-1)),
                targets.view(-1),
                ignore_index=-100,
            )
        return logits, loss


def train_medium():
    save_dir = 'weights/bran9bpy_medium'
    os.makedirs(save_dir, exist_ok=True)
    log_path = os.path.join(save_dir, 'train_log.txt')

    accum_steps = 8
    batch_size = 1
    lr = 3e-4
    warmup_steps = 50
    epochs = 15
    max_len = 256
    vocab_size = 8000

    def log(msg):
        print(msg, flush=True)
        with open(log_path, 'a', encoding='utf-8') as f:
            f.write(msg + '\n')

    log("=" * 60)
    log("BRANPY AI FOUNDATION MODEL v1 — MEDIUM (150M)")
    log(f"Epochs: {epochs} | LR: {lr} | Accum: {accum_steps}")
    log(f"Max len: {max_len} | Batch: {batch_size}")
    log("=" * 60)

    log("\n[1/5] Gerando dataset...")
    smart_lines = gerar_smart()
    combined_lines = gerar_templates() + gerar_fatos()
    all_lines = smart_lines + combined_lines

    import random
    random.seed(42)
    random.shuffle(all_lines)

    pairs = []
    i = 0
    while i < len(all_lines) - 1:
        if all_lines[i].strip() and all_lines[i + 1].strip():
            pairs.append(f"{all_lines[i]}\n{all_lines[i + 1]}")
            i += 2
        else:
            i += 1
    log(f"  {len(pairs)} pares")

    log("\n[2/5] Treinando tokenizer...")
    tokenizer = BPETokenizer(vocab_size=vocab_size)
    tokenizer.train(all_lines)
    tok_path = os.path.join(save_dir, 'tokenizer.json')
    tokenizer.save(tok_path)
    actual_vocab = len(tokenizer.vocab)
    log(f"  Vocab: {actual_vocab}")

    log("\n[3/5] Criando modelo MEDIUM (150M)...")
    base_model = create_model(vocab_size=actual_vocab, size='xlarge')
    model = BranPyModelCheckpointed(base_model)
    n_params = sum(p.numel() for p in model.parameters())
    log(f"  Parametros: {n_params:,} ({n_params/1e6:.1f}M)")

    log("\n[4/5] Preparando dataset...")
    dataset = BranPyDataset(pairs, tokenizer, max_len=max_len)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    log(f"  {len(dataset)} exemplos")

    log("\n[5/5] Treinando...")
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=0.01)
    effective_batch = batch_size * accum_steps
    total_batches = len(dataloader)
    total_steps = epochs * (total_batches // accum_steps)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=total_steps)

    step = 0
    best_loss = float('inf')
    start_time = time.time()
    log(f"  Effective batch: {effective_batch}")
    log(f"  Total steps: {total_steps}")
    log(f"  Warmup steps: {warmup_steps}")

    for epoch in range(epochs):
        model.train()
        epoch_loss = 0
        epoch_steps = 0
        optimizer.zero_grad()

        for batch_idx, (x, y, mask) in enumerate(dataloader):
            t0 = time.time()

            logits, loss = model(x, y)

            if torch.isnan(loss) or torch.isinf(loss) or loss.item() > 20.0:
                log(f"  !!! Loss instavel ({loss.item():.4f}) no step {step}, pulando batch")
                optimizer.zero_grad()
                del logits, loss
                gc.collect()
                continue

            loss = loss / accum_steps
            loss.backward()

            if (batch_idx + 1) % accum_steps == 0 or (batch_idx + 1) == total_batches:
                nn.utils.clip_grad_norm_(model.parameters(), 0.5)
                for group in optimizer.param_groups:
                    if step < warmup_steps:
                        group['lr'] = lr * (step + 1) / warmup_steps
                    else:
                        group['lr'] = lr
                optimizer.step()
                scheduler.step()
                optimizer.zero_grad()
                step += 1

                dt = time.time() - t0
                current_loss = loss.item() * accum_steps
                epoch_loss += current_loss
                epoch_steps += 1

                if step % 10 == 0 or step == 1:
                    elapsed = time.time() - start_time
                    pct = step / total_steps * 100
                    avg_step = elapsed / step
                    eta = avg_step * (total_steps - step)
                    log(f"  Step {step}/{total_steps} ({pct:.1f}%) | Loss: {current_loss:.4f} | "
                        f"Tempo: {dt:.1f}s | ETA: {eta/3600:.1f}h | LR: {group['lr']:.6f}")

                if current_loss < best_loss:
                    best_loss = current_loss

                del logits, loss
                gc.collect()

        avg_loss = epoch_loss / max(epoch_steps, 1)
        elapsed = time.time() - start_time
        log(f"\n  Epoch {epoch + 1}/{epochs} | Loss media: {avg_loss:.4f} | Melhor: {best_loss:.4f} | "
            f"Tempo: {elapsed/3600:.1f}h")

        ckpt_path = os.path.join(save_dir, f'model_epoch{epoch + 1}.pt')
        torch.save({
            'epoch': epoch + 1,
            'model_state_dict': base_model.state_dict(),
            'loss': avg_loss,
            'config': {
                'vocab_size': actual_vocab,
                'model_size': 'xlarge',
                'n_layers': base_model.config.n_layers,
                'd_model': base_model.config.d_model,
                'n_heads': base_model.config.n_heads,
                'd_ff': base_model.config.d_ff,
                'max_seq_len': max_len,
            }
        }, ckpt_path)
        log(f"  Checkpoint: {ckpt_path}")

    final_path = os.path.join(save_dir, 'model_final.pt')
    torch.save({
        'model_state_dict': base_model.state_dict(),
        'tokenizer_path': tok_path,
        'config': {
            'vocab_size': actual_vocab,
            'model_size': 'xlarge',
            'n_layers': base_model.config.n_layers,
            'd_model': base_model.config.d_model,
            'n_heads': base_model.config.n_heads,
            'd_ff': base_model.config.d_ff,
            'max_seq_len': max_len,
        }
    }, final_path)

    total_time = time.time() - start_time
    log("\n" + "=" * 60)
    log("BRANPY AI FOUNDATION MODEL v1 — MEDIUM — CONCLUIDO!")
    log(f"Tempo total: {total_time/3600:.1f}h")
    log(f"Melhor loss: {best_loss:.4f}")
    log(f"Parametros: {n_params:,} ({n_params/1e6:.1f}M)")
    log(f"Modelo: {final_path}")
    log("=" * 60)

    log("\n[EXTRA] Teste de geracao...")
    base_model.eval()
    test_prompts = [
        "oi", "me ensina python", "como criar site",
        "o que e ia", "obrigado",
        "qual a diferenca entre python e javascript",
        "me conta uma piada",
    ]
    for prompt in test_prompts:
        ids = tokenizer.encode(prompt, add_special=True)
        x = torch.tensor([ids], dtype=torch.long)
        gen_ids = base_model.generate(x, max_new_tokens=80, temperature=0.8)
        response = tokenizer.decode(gen_ids[0].tolist())
        log(f"  Input: {prompt}")
        log(f"  Output: {response}")
        log("")

    return base_model, tokenizer


if __name__ == '__main__':
    train_medium()
