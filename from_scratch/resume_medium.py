"""Resume treino BranPy MEDIUM (150M) — epochs 2-15 a partir do checkpoint epoch1.

Modelo: 114.6M params | 16 layers | 768d | 12 heads
Licenca: 100% branpy.com.br
"""
import os
import sys
import time
import gc
import random
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


def resume_medium():
    save_dir = 'weights/bran9bpy_medium'
    ckpt_path = os.path.join(save_dir, 'model_epoch1.pt')

    if not os.path.exists(ckpt_path):
        print(f"ERRO: Checkpoint nao encontrado: {ckpt_path}")
        sys.exit(1)

    accum_steps = 8
    batch_size = 1
    lr = 3e-4
    warmup_steps = 50
    total_epochs = 15
    start_epoch = 1
    max_len = 256

    log_path = os.path.join(save_dir, 'train_log.txt')
    def log(msg):
        print(msg, flush=True)
        with open(log_path, 'a', encoding='utf-8') as f:
            f.write(msg + '\n')

    log("\n" + "=" * 60)
    log("BRANPY AI FOUNDATION MODEL v1 — MEDIUM (150M) — RESUME")
    log("Licenca: 100% branpy.com.br — Modelo proprio")
    log("=" * 60)

    log("\n[1/5] Carregando checkpoint epoch1...")
    ckpt = torch.load(ckpt_path, map_location='cpu', weights_only=False)
    saved_epoch = ckpt.get('epoch', 1)
    saved_loss = ckpt.get('loss', 0)
    cfg = ckpt.get('config', {})

    log(f"  Epoch salvo: {saved_epoch}")
    log(f"  Loss: {saved_loss:.4f}")
    log(f"  Config: {cfg}")

    config = BranPyConfig(
        vocab_size=cfg.get('vocab_size', 8000),
        n_layers=cfg.get('n_layers', 16),
        d_model=cfg.get('d_model', 768),
        n_heads=cfg.get('n_heads', 12),
        d_ff=cfg.get('d_ff', 3072),
        max_seq_len=cfg.get('max_seq_len', 256),
    )

    base_model = create_model(vocab_size=config.vocab_size, size='xlarge')
    base_model.load_state_dict(ckpt['model_state_dict'])
    model = BranPyModelCheckpointed(base_model)

    n_params = sum(p.numel() for p in model.parameters())
    log(f"  Parametros: {n_params:,} ({n_params/1e6:.1f}M)")

    tok_path = os.path.join(save_dir, 'tokenizer.json')
    if not os.path.exists(tok_path):
        log("  Tokenizer nao encontrado, re-treinando...")
        sys.exit(1)

    tokenizer = BPETokenizer()
    tokenizer.load(tok_path)
    actual_vocab = len(tokenizer.vocab)
    log(f"  Vocab: {actual_vocab}")

    log("\n[2/5] Gerando dataset...")
    smart_lines = gerar_smart()
    combined_lines = gerar_templates() + gerar_fatos()
    all_lines = smart_lines + combined_lines

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

    log("\n[3/5] Preparando dataset...")
    dataset = BranPyDataset(pairs, tokenizer, max_len=max_len)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    log(f"  {len(dataset)} exemplos, {len(dataloader)} batches")

    log("\n[4/5] Configurando optimizador...")
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=0.01)
    total_batches = len(dataloader)
    remaining_epochs = total_epochs - start_epoch
    total_steps = remaining_epochs * (total_batches // accum_steps)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=total_steps)

    global_step = 0
    best_loss = saved_loss
    start_time = time.time()
    log(f"  Epochs restantes: {start_epoch} -> {total_epochs}")
    log(f"  Total steps: {total_steps}")
    log(f"  Effective batch: {batch_size * accum_steps}")

    log("\n[5/5] Continuando treino...")
    for epoch in range(start_epoch, total_epochs):
        model.train()
        epoch_loss = 0
        epoch_steps = 0
        optimizer.zero_grad()

        for batch_idx, (x, y, mask) in enumerate(dataloader):
            t0 = time.time()

            logits, loss = model(x, y)

            if torch.isnan(loss) or torch.isinf(loss) or loss.item() > 20.0:
                log(f"  !!! Loss instavel ({loss.item():.4f}) no step {global_step}, pulando batch")
                optimizer.zero_grad()
                del logits, loss
                gc.collect()
                continue

            loss = loss / accum_steps
            loss.backward()

            if (batch_idx + 1) % accum_steps == 0 or (batch_idx + 1) == total_batches:
                nn.utils.clip_grad_norm_(model.parameters(), 0.5)
                for group in optimizer.param_groups:
                    if global_step < warmup_steps:
                        group['lr'] = lr * (global_step + 1) / warmup_steps
                    else:
                        group['lr'] = lr
                optimizer.step()
                scheduler.step()
                optimizer.zero_grad()
                global_step += 1

                dt = time.time() - t0
                current_loss = loss.item() * accum_steps
                epoch_loss += current_loss
                epoch_steps += 1

                if global_step % 10 == 0 or global_step == 1:
                    elapsed = time.time() - start_time
                    pct = global_step / total_steps * 100
                    avg_step = elapsed / global_step
                    eta = avg_step * (total_steps - global_step)
                    log(f"  Step {global_step}/{total_steps} ({pct:.1f}%) | Loss: {current_loss:.4f} | "
                        f"Tempo: {dt:.1f}s | ETA: {eta/3600:.1f}h | LR: {group['lr']:.6f}")

                if current_loss < best_loss:
                    best_loss = current_loss

                del logits, loss
                gc.collect()

        avg_loss = epoch_loss / max(epoch_steps, 1)
        elapsed = time.time() - start_time
        log(f"\n  Epoch {epoch + 1}/{total_epochs} | Loss media: {avg_loss:.4f} | Melhor: {best_loss:.4f} | "
            f"Tempo: {elapsed/3600:.1f}h")

        ckpt_ep = os.path.join(save_dir, f'model_epoch{epoch + 1}.pt')
        torch.save({
            'epoch': epoch + 1,
            'model_state_dict': base_model.state_dict(),
            'loss': avg_loss,
            'config': cfg,
        }, ckpt_ep)
        log(f"  Checkpoint: {ckpt_ep}")

    final_path = os.path.join(save_dir, 'model_final.pt')
    torch.save({
        'model_state_dict': base_model.state_dict(),
        'tokenizer_path': tok_path,
        'config': cfg,
    }, final_path)

    total_time = time.time() - start_time
    log("\n" + "=" * 60)
    log("BRANPY AI FOUNDATION MODEL v1 — MEDIUM — CONCLUIDO!")
    log("Licenca: 100% branpy.com.br — Modelo proprio")
    log(f"Tempo total resume: {total_time/3600:.1f}h ({total_time/3600:.2f}h)")
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
    resume_medium()
