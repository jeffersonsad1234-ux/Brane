"""Treina VQ-VAE 128x128 — 100% branpy.com.br.

Treinamento 100% offline, CPU only.
Modelo proprio, sem licencas externas.

Rodar: python train_vqvae.py
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
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from vqvae import BranPyVQVAE, create_vqvae


def clamp(val, min_val=0, max_val=255):
    return max(min_val, min(max_val, int(val)))


def salvar_ppm(pixels, width, height, path):
    """Salva imagem PPM."""
    with open(path, 'wb') as f:
        f.write(f'P6\n{width} {height}\n255\n'.encode())
        for r, g, b in pixels:
            f.write(bytes([clamp(r), clamp(g), clamp(b)]))


class ImageDataset(Dataset):
    """Dataset de imagens PPM."""
    def __init__(self, img_dir, img_size=128):
        self.img_dir = img_dir
        self.img_size = img_size
        self.files = [f for f in os.listdir(img_dir) if f.endswith('.ppm')]

    def __len__(self):
        return len(self.files)

    def __getitem__(self, idx):
        path = os.path.join(self.img_dir, self.files[idx])
        img = Image.open(path).convert('RGB')
        img = img.resize((self.img_size, self.img_size), Image.BILINEAR)
        img = torch.tensor(list(img.getdata()), dtype=torch.float32)
        img = img.view(3, self.img_size, self.img_size) / 127.5 - 1.0
        return img


def train_vqvae():
    img_dir = os.path.join(os.path.dirname(__file__), 'data', 'images')
    save_dir = os.path.join(os.path.dirname(__file__), 'weights', 'vqvae_128')
    os.makedirs(save_dir, exist_ok=True)

    log_path = os.path.join(save_dir, 'train_log.txt')

    def log(msg):
        print(msg, flush=True)
        with open(log_path, 'a', encoding='utf-8') as f:
            f.write(msg + '\n')

    log("=" * 60)
    log("BRANPY VQ-VAE — Treinamento 128x128")
    log("100% branpy.com.br — Todos os direitos reservados")
    log("=" * 60)

    if not os.path.exists(img_dir):
        log("ERRO: Pasta de imagens nao encontrada!")
        log("Execute: python generate_image_dataset.py")
        return

    log("\n[1/4] Carregando imagens...")
    dataset = ImageDataset(img_dir)
    log(f"  {len(dataset)} imagens encontradas")

    if len(dataset) == 0:
        log("ERRO: Nenhuma imagem encontrada!")
        return

    dataloader = DataLoader(dataset, batch_size=4, shuffle=True, num_workers=0)

    log("\n[2/4] Criando modelo VQ-VAE...")
    model = create_vqvae('small')
    n_params = sum(p.numel() for p in model.parameters())
    log(f"  Parametros: {n_params:,} ({n_params/1e6:.1f}M)")

    log("\n[3/4] Configurando treinamento...")
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-4, betas=(0.9, 0.999))

    epochs = 50
    best_loss = float('inf')
    start_epoch = 0
    step = 0

    resume_path = os.path.join(save_dir, 'model_best.pt')
    if os.path.exists(resume_path):
        ckpt = torch.load(resume_path, map_location='cpu', weights_only=False)
        missing, unexpected = model.load_state_dict(ckpt['model_state_dict'], strict=False)
        log(f"  Resume keys: {len(ckpt['model_state_dict'])} loaded, {len(missing)} missing, {len(unexpected)} extra")
        if 'epoch' in ckpt:
            start_epoch = ckpt['epoch']
        if 'loss' in ckpt:
            best_loss = ckpt['loss']
        log(f"  RESUME do epoch {start_epoch}, best loss: {best_loss:.4f}")

    start_time = time.time()

    log(f"  Epochs: {start_epoch} -> {epochs}")
    log(f"  Batch size: 4")
    log(f"  Learning rate: 1e-4")

    log("\n[4/4] Treinando...")
    for epoch in range(start_epoch, epochs):
        model.train()
        epoch_loss = 0
        epoch_recon = 0
        epoch_commit = 0
        epoch_emb = 0
        n_batches = 0

        for batch_idx, images in enumerate(dataloader):
            t0 = time.time()

            x_recon, commit_loss, emb_loss, indices = model(images)

            recon_loss = F.mse_loss(x_recon, images)
            total_loss = recon_loss + model.config.beta * commit_loss + emb_loss

            optimizer.zero_grad()
            total_loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()

            dt = time.time() - t0
            epoch_loss += total_loss.item()
            epoch_recon += recon_loss.item()
            epoch_commit += commit_loss.item()
            epoch_emb += emb_loss.item()
            n_batches += 1
            step += 1

            if batch_idx % 20 == 0:
                elapsed = time.time() - start_time
                log(f"  Step {step} | Loss: {total_loss.item():.4f} | "
                    f"Recon: {recon_loss.item():.4f} | "
                    f"Commit: {commit_loss.item():.4f} | "
                    f"Emb: {emb_loss.item():.4f} | "
                    f"Tempo: {dt:.1f}s")

            del x_recon, commit_loss, emb_loss, indices, total_loss
            gc.collect()

        avg_loss = epoch_loss / max(n_batches, 1)
        avg_recon = epoch_recon / max(n_batches, 1)
        elapsed = time.time() - start_time

        log(f"\n  Epoch {epoch + 1}/{epochs} | "
            f"Loss: {avg_loss:.4f} | Recon: {avg_recon:.4f} | "
            f"Tempo: {elapsed/3600:.1f}h")

        if avg_loss < best_loss:
            best_loss = avg_loss
            best_path = os.path.join(save_dir, 'model_best.pt')
            torch.save({
                'epoch': epoch + 1,
                'model_state_dict': {k: v for k, v in model.state_dict().items()
                                     if not k.startswith('codebook.embeddings')},
                'codebook': model.codebook.embeddings.weight.data,
                'config': {
                    'img_size': model.config.img_size,
                    'n_embeddings': model.config.n_embeddings,
                    'embedding_dim': model.config.embedding_dim,
                    'n_channels': model.config.n_channels,
                },
                'loss': avg_loss,
            }, best_path)
            log(f"  Melhor modelo salvo!")

        if (epoch + 1) % 10 == 0:
            ckpt_path = os.path.join(save_dir, f'model_epoch{epoch + 1}.pt')
            torch.save({
                'epoch': epoch + 1,
                'model_state_dict': {k: v for k, v in model.state_dict().items()
                                     if not k.startswith('codebook.embeddings')},
                'codebook': model.codebook.embeddings.weight.data,
                'config': {
                    'img_size': model.config.img_size,
                    'n_embeddings': model.config.n_embeddings,
                    'embedding_dim': model.config.embedding_dim,
                    'n_channels': model.config.n_channels,
                },
                'loss': avg_loss,
            }, ckpt_path)
            log(f"  Checkpoint: {ckpt_path}")

    final_path = os.path.join(save_dir, 'model_final.pt')
    torch.save({
        'model_state_dict': {k: v for k, v in model.state_dict().items()
                             if not k.startswith('codebook.embeddings')},
        'codebook': model.codebook.embeddings.weight.data,
        'config': {
            'img_size': model.config.img_size,
            'n_embeddings': model.config.n_embeddings,
            'embedding_dim': model.config.embedding_dim,
            'n_channels': model.config.n_channels,
        },
        'loss': avg_loss,
    }, final_path)

    total_time = time.time() - start_time
    log("\n" + "=" * 60)
    log("BRANPY VQ-VAE — CONCLUIDO!")
    log("100% branpy.com.br — Todos os direitos reservados")
    log(f"Tempo total: {total_time/3600:.1f}h")
    log(f"Melhor loss: {best_loss:.4f}")
    log(f"Parametros: {n_params:,} ({n_params/1e6:.1f}M)")
    log(f"Modelo: {final_path}")
    log("=" * 60)

    log("\n[EXTRA] Teste de geracao...")
    model.eval()
    with torch.no_grad():
        gen_imgs = model.generate(n_samples=4)
        for i, img in enumerate(gen_imgs):
            img = (img.permute(1, 2, 0) + 1) / 2 * 255
            img = img.clamp(0, 255).byte()
            save_path = os.path.join(save_dir, f'generated_{i}.ppm')
            pixels = [tuple(img[y, x].tolist()) for y in range(128) for x in range(128)]
            salvar_ppm(pixels, 128, 128, save_path)
            log(f"  Imagem gerada: {save_path}")

    return model


if __name__ == '__main__':
    train_vqvae()
