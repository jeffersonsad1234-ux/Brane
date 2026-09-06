"""Training pipeline — 100% Brampy. Usa pipeline from_scratch.

Sem LoRA. Sem from_pretrained. Sem modelos externos.
"""

import os
import sys
import json
import logging
import time
from pathlib import Path
from typing import Optional

logger = logging.getLogger("branpy-ap")

BASE_DIR = Path(__file__).resolve().parent.parent
FROM_SCRATCH_DIR = BASE_DIR / "from_scratch"


class TrainingPipeline:
    def __init__(self):
        self.is_training = False
        self.progress = {}

    def train(self, model_size: str = "small", epochs: int = 10, lr: float = 3e-4):
        if self.is_training:
            raise RuntimeError("Treino ja em andamento")
        self.is_training = True
        self.progress = {"status": "starting", "epoch": 0, "step": 0, "loss": 0}
        try:
            self._run_training(model_size, epochs, lr)
        except Exception as e:
            self.progress["status"] = "error"
            self.progress["error"] = str(e)
            logger.error(f"Erro no treino: {e}")
        finally:
            self.is_training = False

    def _run_training(self, model_size: str, epochs: int, lr: float):
        import torch
        import torch.nn as nn
        from torch.utils.data import Dataset, DataLoader

        sys.path.insert(0, str(FROM_SCRATCH_DIR))
        from model import create_model
        from tokenizer import BPETokenizer
        from generate_data import generate_corpus

        self.progress["status"] = "generating_data"

        # 1. Gerar corpus proprio
        logger.info("Gerando corpus proprio...")
        lines = generate_corpus()
        logger.info(f"Corpus: {len(lines)} linhas")

        # 2. Treinar tokenizer proprio
        self.progress["status"] = "training_tokenizer"
        logger.info("Treinando tokenizer BPE proprio...")
        tokenizer = BPETokenizer(vocab_size=8000)
        tokenizer.train(lines)
        actual_vocab = len(tokenizer.vocab)
        logger.info(f"Tokenizer: {actual_vocab} tokens")

        # 3. Criar modelo proprio (pesos aleatorios)
        self.progress["status"] = "creating_model"
        logger.info(f"Criando modelo {model_size} do zero...")
        model = create_model(vocab_size=actual_vocab, size=model_size)
        n_params = sum(p.numel() for p in model.parameters())
        logger.info(f"Modelo: {n_params:,} params ({n_params/1e6:.2f}M)")

        # 4. Dataset proprio
        self.progress["status"] = "preparing_dataset"

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

        dataset = BranPyDataset(lines, tokenizer, max_len=256)
        dataloader = DataLoader(dataset, batch_size=4, shuffle=True, num_workers=0)

        # 5. Treinar
        self.progress["status"] = "training"
        optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=0.01)
        scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs * len(dataloader))

        total_steps = epochs * len(dataloader)
        step = 0
        best_loss = float('inf')
        start_time = time.time()

        output_dir = FROM_SCRATCH_DIR / "weights" / "bran9bpy_scratch"
        output_dir.mkdir(parents=True, exist_ok=True)

        for epoch in range(epochs):
            model.train()
            epoch_loss = 0
            epoch_steps = 0

            for batch_idx, (x, y, mask) in enumerate(dataloader):
                step += 1
                logits, loss = model(x, y)
                optimizer.zero_grad()
                loss.backward()
                nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                optimizer.step()
                scheduler.step()

                epoch_loss += loss.item()
                epoch_steps += 1

                if loss.item() < best_loss:
                    best_loss = loss.item()

                if step % 10 == 0:
                    self.progress = {
                        "status": "training",
                        "epoch": epoch + 1,
                        "step": step,
                        "total_steps": total_steps,
                        "loss": round(loss.item(), 4),
                        "best_loss": round(best_loss, 4),
                    }

            avg_loss = epoch_loss / max(epoch_steps, 1)
            logger.info(f"Epoch {epoch+1}/{epochs} | Loss: {avg_loss:.4f} | Best: {best_loss:.4f}")

            # Checkpoint proprio
            ckpt_path = output_dir / f"model_epoch{epoch+1}.pt"
            torch.save({
                "epoch": epoch + 1,
                "model_state_dict": model.state_dict(),
                "loss": avg_loss,
                "config": {
                    "vocab_size": actual_vocab,
                    "model_size": model_size,
                    "n_layers": model.config.n_layers,
                    "d_model": model.config.d_model,
                    "n_heads": model.config.n_heads,
                    "d_ff": model.config.d_ff,
                }
            }, str(ckpt_path))

        # 6. Salvar modelo final
        self.progress["status"] = "saving"
        final_path = output_dir / "model_final.pt"
        torch.save({
            "model_state_dict": model.state_dict(),
            "config": {
                "vocab_size": actual_vocab,
                "model_size": model_size,
                "n_layers": model.config.n_layers,
                "d_model": model.config.d_model,
                "n_heads": model.config.n_heads,
                "d_ff": model.config.d_ff,
            }
        }, str(final_path))

        tok_path = output_dir / "tokenizer.json"
        tokenizer.save(str(tok_path))

        self.progress = {
            "status": "completed",
            "model": str(final_path),
            "tokenizer": str(tok_path),
            "params": n_params,
            "best_loss": round(best_loss, 4),
        }
        logger.info(f"Treino concluido! Modelo: {final_path}")
