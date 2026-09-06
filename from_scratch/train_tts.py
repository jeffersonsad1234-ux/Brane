"""
BranPy TTS — Text-to-Speech próprio (VITS-style).

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
WEIGHTS_DIR = BASE_DIR / "weights" / "tts_branpy"
WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# MODEL: VITS-style (simplificado para CPU)
# ============================================================

class TextEncoder(nn.Module):
    def __init__(self, vocab_size, d_model=256, n_layers=4):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, d_model)
        self.pos_enc = nn.Parameter(torch.randn(1, 512, d_model) * 0.02)
        self.blocks = nn.ModuleList([
            nn.TransformerEncoderLayer(d_model, 4, d_model*4, batch_first=True)
            for _ in range(n_layers)
        ])
        self.norm = nn.LayerNorm(d_model)
        self.proj_mu = nn.Linear(d_model, d_model)
        self.proj_logvar = nn.Linear(d_model, d_model)

    def forward(self, x):
        x = self.embedding(x) + self.pos_enc[:, :x.shape[1]]
        for block in self.blocks:
            x = block(x)
        x = self.norm(x)
        mu = self.proj_mu(x)
        logvar = self.proj_logvar(x)
        return mu, logvar


class DurationPredictor(nn.Module):
    def __init__(self, d_model=256):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(d_model, d_model),
            nn.ReLU(),
            nn.LayerNorm(d_model),
            nn.Linear(d_model, 1),
            nn.Softplus(),
        )

    def forward(self, x):
        return self.net(x).squeeze(-1)


class Flow(nn.Module):
    """Normalizing flow simplificado."""
    def __init__(self, d_model=256, n_layers=4):
        super().__init__()
        self.layers = nn.ModuleList([
            nn.Sequential(
                nn.Conv1d(d_model, d_model*2, 1),
                nn.GLU(dim=1),
                nn.Conv1d(d_model, d_model, 1),
            ) for _ in range(n_layers)
        ])

    def forward(self, x, x_mask):
        logdet = 0
        for layer in self.layers:
            x = layer(x * x_mask) * x_mask
        return x, logdet


class Decoder(nn.Module):
    """HiFi-GAN style decoder simplificado."""
    def __init__(self, d_model=256):
        super().__init__()
        self.pre = nn.Conv1d(d_model, 512, 1)
        self.blocks = nn.ModuleList([
            nn.Sequential(
                nn.ConvTranspose1d(512, 256, 8, stride=4, padding=2),
                nn.LeakyReLU(0.1),
                nn.Conv1d(256, 256, 3, padding=1),
                nn.LeakyReLU(0.1),
            ),
            nn.Sequential(
                nn.ConvTranspose1d(256, 128, 8, stride=4, padding=2),
                nn.LeakyReLU(0.1),
                nn.Conv1d(128, 128, 3, padding=1),
                nn.LeakyReLU(0.1),
            ),
            nn.Sequential(
                nn.ConvTranspose1d(128, 64, 4, stride=2, padding=1),
                nn.LeakyReLU(0.1),
                nn.Conv1d(64, 64, 3, padding=1),
                nn.LeakyReLU(0.1),
            ),
        ])
        self.post = nn.Sequential(
            nn.Conv1d(64, 1, 7, padding=3),
            nn.Tanh(),
        )

    def forward(self, x):
        x = self.pre(x)
        for block in self.blocks:
            x = block(x)
        x = self.post(x)
        return x


class BranPyTTS(nn.Module):
    def __init__(self, vocab_size, d_model=256):
        super().__init__()
        self.text_encoder = TextEncoder(vocab_size, d_model)
        self.duration_pred = DurationPredictor(d_model)
        self.flow = Flow(d_model)
        self.decoder = Decoder(d_model)

    def forward(self, text, text_lens=None):
        # Text encoding
        mu, logvar = self.text_encoder(text)
        
        # Reparameterization
        std = torch.exp(0.5 * logvar)
        eps = torch.randn_like(std)
        z = mu + eps * std
        
        # Duration prediction
        log_dur = self.duration_pred(mu.detach())
        dur = torch.exp(log_dur).round().long().clamp(min=1)
        
        # Expand z by duration
        z_expanded = self.expand_by_duration(z, dur)
        
        # Flow
        z_flow, _ = self.flow(z_expanded.transpose(1, 2), None)
        
        # Decode to audio
        audio = self.decoder(z_flow)
        
        return audio, dur, mu, logvar

    def expand_by_duration(self, z, dur):
        """Expande latentes pela duração prevista."""
        B, T, C = z.shape
        expanded = []
        for b in range(B):
            seq = []
            for t in range(T):
                seq.append(z[b, t].repeat(dur[b, t], 1))
            seq = torch.cat(seq, dim=0)
            expanded.append(seq)
        
        # Pad to same length
        max_len = max(len(s) for s in expanded)
        padded = []
        for s in expanded:
            if len(s) < max_len:
                pad = torch.zeros(max_len - len(s), C, device=s.device)
                s = torch.cat([s, pad], dim=0)
            padded.append(s[:max_len])
        return torch.stack(padded)

    def infer(self, text):
        """Inferência: texto -> áudio."""
        self.eval()
        with torch.no_grad():
            audio, _, _, _ = self.forward(text)
        return audio


# ============================================================
# DATASET
# ============================================================

class TTSDataset(Dataset):
    def __init__(self, data_dir, tokenizer, max_text_len=512):
        self.tokenizer = tokenizer
        self.max_text_len = max_text_len
        self.samples = []
        
        # Common Voice CC0
        cv = data_dir / "tts" / "common_voice"
        if cv.exists():
            for mp3 in cv.rglob("*.mp3"):
                txt_file = mp3.with_suffix(".txt")
                if txt_file.exists():
                    self.samples.append((str(mp3), txt_file.read_text().strip()))
        
        # LJSpeech
        lj = data_dir / "tts" / "ljspeech"
        if lj.exists():
            metadata = lj / "metadata.csv"
            if metadata.exists():
                for line in metadata.read_text().strip().split('\n'):
                    parts = line.split('|')
                    if len(parts) >= 3:
                        wav = lj / "wavs" / (parts[0] + ".wav")
                        if wav.exists():
                            self.samples.append((str(wav), parts[2]))
        
        print(f"TTS Dataset: {len(self.samples)} samples")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        audio_path, text = self.samples[idx]
        
        # Carrega áudio
        try:
            waveform, sr = torchaudio.load(audio_path)
            if sr != 22050:
                waveform = torchaudio.functional.resample(waveform, sr, 22050)
        except:
            waveform = torch.zeros(1, 22050)
        
        # Normaliza
        waveform = waveform / (waveform.abs().max() + 1e-8)
        
        # Tokeniza
        tokens = self.tokenizer.encode(text.lower(), add_special=True)
        tokens = tokens[:self.max_text_len]
        
        return waveform.squeeze(0), torch.tensor(tokens, dtype=torch.long), text


# ============================================================
# TREINO
# ============================================================

def train_tts():
    print("""
╔══════════════════════════════════════════════════════════╗
║  BRANPY TTS — Text-to-Speech Próprio                     ║
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
        tokenizer = BPETokenizer(vocab_size=5000)
    
    vocab_size = len(tokenizer.vocab) + 10
    print(f"Vocab: {vocab_size}")

    # Modelo
    model = BranPyTTS(vocab_size=vocab_size, d_model=256).to(device)
    print(f"Params: {sum(p.numel() for p in model.parameters())/1e6:.1f}M")

    # Dataset
    dataset = TTSDataset(DATA_DIR, tokenizer)
    dataloader = DataLoader(dataset, batch_size=2, shuffle=True, num_workers=0)

    # Otimizador
    optimizer = torch.optim.AdamW(model.parameters(), lr=2e-4, weight_decay=0.01)

    # Treino
    model.train()
    step = 0
    
    for epoch in range(100):
        epoch_loss = 0
        for audio, tokens, _ in dataloader:
            audio = audio.to(device)
            tokens = tokens.to(device)
            
            # Forward
            audio_pred, dur, mu, logvar = model(tokens)
            
            # Loss: Mel spectrogram L1 + Duration + KL
            # Simplificado: L1 no waveform
            if audio_pred.shape[-1] != audio.shape[-1]:
                min_len = min(audio_pred.shape[-1], audio.shape[-1])
                audio_pred = audio_pred[..., :min_len]
                audio = audio[..., :min_len]
            
            recon_loss = F.l1_loss(audio_pred, audio.unsqueeze(1))
            dur_loss = F.mse_loss(dur.float(), torch.ones_like(dur).float())
            kl_loss = -0.5 * torch.mean(1 + logvar - mu.pow(2) - logvar.exp())
            
            loss = recon_loss + 0.1 * dur_loss + 0.01 * kl_loss
            
            optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            
            epoch_loss += loss.item()
            step += 1
            
            if step % 50 == 0:
                print(f"  Step {step} | Loss: {loss.item():.4f} (R:{recon_loss:.4f} D:{dur_loss:.4f} KL:{kl_loss:.4f})")

        avg_loss = epoch_loss / len(dataloader)
        print(f"Epoch {epoch+1}/100 | Loss: {avg_loss:.4f}")
        
        if epoch % 10 == 0:
            torch.save({
                'model': model.state_dict(),
                'vocab_size': vocab_size,
            }, WEIGHTS_DIR / f"tts_epoch{epoch}.pt")

    # Final
    torch.save({
        'model': model.state_dict(),
        'vocab_size': vocab_size,
    }, WEIGHTS_DIR / "tts_final.pt")
    
    print("\n✅ TTS Treino Concluído!")
    return model


if __name__ == "__main__":
    train_tts()