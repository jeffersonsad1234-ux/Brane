"""
BranPy STT — Speech-to-Text próprio (Whisper-style Transformer).

100% da branpy.com.br — Todos os direitos reservados.
Treinado APENAS em dados CC0 / Domínio Público.
"""

import os
import sys
import json
import time
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
import torchaudio
from pathlib import Path

sys.path.insert(0, os.path.dirname(__file__))
from tokenizer import BPETokenizer

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data_voice"
WEIGHTS_DIR = BASE_DIR / "weights" / "stt_branpy"
WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# MODEL: Conformer (Whisper-style) - Leve para CPU
# ============================================================

class ConformerBlock(nn.Module):
    def __init__(self, d_model, n_heads, d_ff, dropout=0.1):
        super().__init__()
        self.ff1 = nn.Sequential(
            nn.Linear(d_model, d_ff),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(d_ff, d_model),
            nn.Dropout(dropout),
        )
        self.attn = nn.MultiheadAttention(d_model, n_heads, dropout=dropout, batch_first=True)
        self.conv = nn.Sequential(
            nn.Conv1d(d_model, d_model, 31, padding=15, groups=d_model),
            nn.GELU(),
            nn.BatchNorm1d(d_model),
            nn.Conv1d(d_model, d_model, 1),
            nn.Dropout(dropout),
        )
        self.ff2 = nn.Sequential(
            nn.Linear(d_model, d_ff),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(d_ff, d_model),
            nn.Dropout(dropout),
        )
        self.norm1 = nn.LayerNorm(d_model)
        self.norm2 = nn.LayerNorm(d_model)
        self.norm3 = nn.LayerNorm(d_model)
        self.norm4 = nn.LayerNorm(d_model)

    def forward(self, x, mask=None):
        # FF1
        x = x + 0.5 * self.ff1(self.norm1(x))
        # Attention
        attn_out, _ = self.attn(self.norm2(x), self.norm2(x), self.norm2(x), key_padding_mask=mask)
        x = x + attn_out
        # Conv
        x_conv = x.transpose(1, 2)
        x_conv = self.conv(x_conv).transpose(1, 2)
        x = x + x_conv
        # FF2
        x = x + 0.5 * self.ff2(self.norm4(x))
        return x


class BranPySTT(nn.Module):
    def __init__(self, vocab_size, d_model=256, n_layers=6, n_heads=4, d_ff=1024, n_mels=80):
        super().__init__()
        self.n_mels = n_mels
        
        # Frontend: Audio -> Features
        self.frontend = nn.Sequential(
            nn.Conv2d(1, 32, 3, stride=2, padding=1),
            nn.GELU(),
            nn.BatchNorm2d(32),
            nn.Conv2d(32, d_model, 3, stride=2, padding=1),
            nn.GELU(),
            nn.BatchNorm2d(d_model),
        )
        
        # Positional encoding
        self.pos_enc = nn.Parameter(torch.randn(1, 1500, d_model) * 0.02)
        
        # Conformer blocks
        self.blocks = nn.ModuleList([
            ConformerBlock(d_model, n_heads, d_ff) for _ in range(n_layers)
        ])
        
        self.norm = nn.LayerNorm(d_model)
        self.output = nn.Linear(d_model, vocab_size)
        
        # CTC loss
        self.blank_id = vocab_size - 1

    def forward(self, mel, mel_lens=None):
        # mel: [B, T, n_mels] -> [B, 1, T, n_mels]
        x = mel.unsqueeze(1)
        x = self.frontend(x)  # [B, d_model, T//4, n_mels//4]
        B, C, T, F = x.shape
        x = x.flatten(2).transpose(1, 2)  # [B, T*F, d_model]
        
        # Positional encoding
        seq_len = x.shape[1]
        x = x + self.pos_enc[:, :seq_len]
        
        # Conformer blocks
        for block in self.blocks:
            x = block(x)
        
        x = self.norm(x)
        logits = self.output(x)  # [B, T, vocab_size]
        return logits

    def ctc_loss(self, logits, targets, target_lens, logit_lens):
        log_probs = F.log_softmax(logits, dim=-1).transpose(0, 1)  # [T, B, V]
        return F.ctc_loss(
            log_probs, targets, logit_lens, target_lens,
            blank=self.blank_id, zero_infinity=True
        )

    def decode(self, logits):
        """Greedy CTC decode."""
        probs = logits.softmax(-1)
        preds = probs.argmax(-1)
        # Remove blanks and duplicates
        decoded = []
        for pred in preds:
            prev = -1
            seq = []
            for p in pred:
                if p != self.blank_id and p != prev:
                    seq.append(p.item())
                prev = p.item()
            decoded.append(seq)
        return decoded


# ============================================================
# DATASET
# ============================================================

class STTDataset(Dataset):
    def __init__(self, data_dir, tokenizer, n_mels=80, max_len=1500):
        self.tokenizer = tokenizer
        self.n_mels = n_mels
        self.max_len = max_len
        self.samples = []
        
        # Carrega LibriSpeech
        librispeech = data_dir / "stt" / "librispeech"
        if librispeech.exists():
            for chapter in librispeech.rglob("*.flac"):
                txt_file = chapter.with_suffix(".txt")
                if txt_file.exists():
                    self.samples.append((str(chapter), txt_file.read_text().strip()))
        
        # Carrega Common Voice CC0
        cv = data_dir / "stt" / "common_voice_cc0"
        if cv.exists():
            for mp3 in cv.rglob("*.mp3"):
                txt_file = mp3.with_suffix(".txt")
                if txt_file.exists():
                    self.samples.append((str(mp3), txt_file.read_text().strip()))
        
        print(f"STT Dataset: {len(self.samples)} samples")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        audio_path, text = self.samples[idx]
        
        # Carrega áudio
        try:
            waveform, sr = torchaudio.load(audio_path)
            if sr != 16000:
                waveform = torchaudio.functional.resample(waveform, sr, 16000)
        except:
            # Gera mel silencioso se falhar
            waveform = torch.zeros(1, 16000)
        
        # Mel spectrogram
        mel = torchaudio.transforms.MelSpectrogram(
            sample_rate=16000, n_fft=400, hop_length=160, n_mels=self.n_mels
        )(waveform).squeeze(0).transpose(0, 1)  # [T, n_mels]
        
        # Pad/Truncate
        if mel.shape[0] > self.max_len:
            mel = mel[:self.max_len]
        else:
            mel = F.pad(mel, (0, 0, 0, self.max_len - mel.shape[0]))
        
        # Tokeniza texto
        tokens = self.tokenizer.encode(text.lower(), add_special=False)
        tokens = tokens[:self.max_len // 4]  # CTC needs shorter targets
        
        return mel, torch.tensor(tokens, dtype=torch.long)


# ============================================================
# TREINO
# ============================================================

def train_stt():
    print("""
╔══════════════════════════════════════════════════════════╗
║  BRANPY STT — Speech-to-Text Próprio                     ║
║  100% branpy.com.br — Dados: CC0 / Domínio Público       ║
╚══════════════════════════════════════════════════════════╝
""")

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Device: {device}")

    # Tokenizer
    tok_path = BASE_DIR / "weights" / "bran9bpy_fast" / "tokenizer.json"
    if tok_path.exists():
        tokenizer = BPETokenizer.load(tok_path)
    else:
        # Fallback: cria tokenizer simples
        tokenizer = BPETokenizer(vocab_size=5000)
        # Treina nos textos do dataset
        texts = []
        for sample in DATA_DIR.glob("**/*.txt"):
            texts.append(sample.read_text())
        tokenizer.train(texts)
    
    vocab_size = len(tokenizer.vocab) + 1  # +1 para blank
    print(f"Vocab: {vocab_size}")

    # Modelo
    model = BranPySTT(vocab_size=vocab_size, d_model=256, n_layers=6, n_heads=4).to(device)
    print(f"Params: {sum(p.numel() for p in model.parameters())/1e6:.1f}M")

    # Dataset
    dataset = STTDataset(DATA_DIR, tokenizer)
    dataloader = DataLoader(dataset, batch_size=4, shuffle=True, num_workers=0)

    # Otimizador
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4, weight_decay=0.01)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=50)

    # Treino
    model.train()
    step = 0
    best_loss = float('inf')
    
    for epoch in range(50):
        epoch_loss = 0
        for mel, tokens in dataloader:
            mel = mel.to(device)
            tokens = tokens.to(device)
            
            logits = model(mel)
            
            # CTC loss
            logit_lens = torch.full((mel.shape[0],), logits.shape[1], dtype=torch.long, device=device)
            target_lens = torch.tensor([len(t) for t in tokens], dtype=torch.long, device=device)
            targets_flat = torch.cat([t for t in tokens])
            
            loss = model.ctc_loss(logits, targets_flat, target_lens, logit_lens)
            
            optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            
            epoch_loss += loss.item()
            step += 1
            
            if step % 100 == 0:
                print(f"  Step {step} | Loss: {loss.item():.4f}")

        scheduler.step()
        avg_loss = epoch_loss / len(dataloader)
        print(f"Epoch {epoch+1}/50 | Loss: {avg_loss:.4f}")
        
        if avg_loss < best_loss:
            best_loss = avg_loss
            torch.save({
                'model': model.state_dict(),
                'vocab_size': vocab_size,
                'tokenizer_path': str(tok_path),
            }, WEIGHTS_DIR / "stt_best.pt")
            print(f"  ✅ Melhor modelo salvo!")

    print("\n✅ STT Treino Concluído!")
    return model


if __name__ == "__main__":
    train_stt()