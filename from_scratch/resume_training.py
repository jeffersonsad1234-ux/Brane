"""Resume treino BranPy — epochs 9-10 a partir do checkpoint epoch8."""
import os
import sys
import time
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

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


def resume():
    save_dir = 'weights/bran9bpy_final'
    log_path = os.path.join(save_dir, 'train_log.txt')
    ckpt_path = os.path.join(save_dir, 'model_epoch8.pt')

    def log(msg):
        print(msg, flush=True)
        with open(log_path, 'a', encoding='utf-8') as f:
            f.write(msg + '\n')

    log("=" * 60)
    log("BRANPY AI FOUNDATION MODEL v1 — RESUME (epochs 9-10)")
    log("=" * 60)

    # Carregar checkpoint epoch8
    log("\n[1/5] Carregando checkpoint epoch8...")
    ckpt = torch.load(ckpt_path, map_location='cpu', weights_only=False)
    config = ckpt['config']
    log(f"  Epoch: {ckpt['epoch']}")
    log(f"  Loss media: {ckpt['loss']:.4f}")
    log(f"  Config: {config}")

    # Criar modelo e carregar pesos
    model = create_model(vocab_size=config['vocab_size'], size=config['model_size'])
    model.load_state_dict(ckpt['model_state_dict'])
    n_params = sum(p.numel() for p in model.parameters())
    log(f"  Parametros: {n_params:,} ({n_params/1e6:.2f}M)")

    # Carregar tokenizer
    tok_path = os.path.join(save_dir, 'tokenizer.json')
    tokenizer = BPETokenizer()
    tokenizer.load(tok_path)
    log(f"  Tokens: {len(tokenizer.vocab)}")

    # Gerar dataset
    log("\n[2/5] Gerando dataset...")
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

    # Dataset
    log("\n[3/5] Preparando dataset...")
    dataset = BranPyDataset(pairs, tokenizer, max_len=config['max_seq_len'])
    dataloader = DataLoader(dataset, batch_size=4, shuffle=True, num_workers=0)
    log(f"  {len(dataset)} exemplos, {len(dataloader)} batches")

    # Continuar treino (epochs 9 e 10)
    log("\n[4/5] Continuando treino (epochs 9-10)...")
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4, weight_decay=0.01)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=2 * len(dataloader))

    total_steps = 2 * len(dataloader)
    step = 0
    best_loss = 0.44  # Melhor do epoch 8
    start_time = time.time()
    global_step_offset = 8 * len(dataloader)  # steps ja feitos

    for epoch in range(2):
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
                global_step = global_step_offset + step
                total_all = 10 * len(dataloader)
                log(f"  Step {global_step}/{total_all} ({global_step/total_all*100:.1f}%) | Loss: {loss.item():.4f} | "
                    f"Tempo: {dt:.1f}s | ETA: {eta/60:.0f}min")

            if loss.item() < best_loss:
                best_loss = loss.item()

        avg_loss = epoch_loss / max(epoch_steps, 1)
        elapsed = time.time() - start_time
        epoch_num = 8 + epoch + 1
        log(f"\n  Epoch {epoch_num}/10 | Loss media: {avg_loss:.4f} | Melhor: {best_loss:.4f} | "
            f"Tempo: {elapsed/60:.1f}min")

        ckpt_save = os.path.join(save_dir, f'model_epoch{epoch_num}.pt')
        torch.save({
            'epoch': epoch_num,
            'model_state_dict': model.state_dict(),
            'optimizer_state_dict': optimizer.state_dict(),
            'loss': avg_loss,
            'config': config,
        }, ckpt_save)
        log(f"  Checkpoint salvo: {ckpt_save}")

    # Modelo final
    log("\n[5/5] Salvando modelo final...")
    final_path = os.path.join(save_dir, 'model_final.pt')
    tok_path = os.path.join(save_dir, 'tokenizer.json')
    torch.save({
        'model_state_dict': model.state_dict(),
        'tokenizer_path': tok_path,
        'config': config,
    }, final_path)

    total_time = time.time() - start_time
    log("\n" + "=" * 60)
    log("BRANPY AI FOUNDATION MODEL v1 — CONCLUIDO!")
    log(f"Tempo total resume: {total_time/60:.1f}min ({total_time/3600:.2f}h)")
    log(f"Melhor loss: {best_loss:.4f}")
    log(f"Parametros: {n_params:,} ({n_params/1e6:.2f}M)")
    log(f"Modelo: {final_path}")
    log("=" * 60)

    # Teste
    log("\n[EXTRA] Teste de geracao...")
    model.eval()
    test_prompts = [
        "oi",
        "me ensina python",
        "como criar site",
        "o que e ia",
        "obrigado",
        "qual a diferenca entre python e javascript",
        "me conta uma piada",
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
    resume()
