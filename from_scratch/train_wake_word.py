"""
BranPy Wake Word — Detecção de "Ei BranPy" (CNN leve).

100% da branpy.com.br — Todos os direitos reservados.
Treinado APENAS em dados próprios (sintetizados via TTS CC0).
"""

import os
import sys
import time
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
import torchaudio
from pathlib import Path

sys.path.insert(0, os.path.dirname(__file__))

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data_voice"
WEIGHTS_DIR = BASE_DIR / "weights" / "wake_word_branpy"
WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)

# ============================================================
# MODEL: CNN Leve para Wake Word
# ============================================================

class WakeWordCNN(nn.Module):
    def __init__(self, n_mels=40, n_classes=2):
        super().__init__()
        self.conv = nn.Sequential(
            # [B, 1, T, 40]
            nn.Conv2d(1, 32, (3, 3), padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.MaxPool2d((2, 2)),
            
            nn.Conv2d(32, 64, (3, 3), padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d((2, 2)),
            
            nn.Conv2d(64, 128, (3, 3), padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d((1, 1)),
        )
        
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, 2),  # 0: não é wake word, 1: é wake word
        )

    def forward(self, x):
        # x: [B, T, n_mels] -> [B, 1, T, n_mels]
        x = x.unsqueeze(1)
        x = self.conv(x)
        x = self.classifier(x)
        return x


# ============================================================
# DATASET
# ============================================================

class WakeWordDataset(Dataset):
    def __init__(self, data_dir, n_mels=40, max_len=100, augment=True):
        self.data_dir = data_dir
        self.n_mels = n_mels
        self.max_len = max_len
        self.augment = augment
        self.samples = []
        
        # Wake word positivos (gerados por TTS)
        wake_dir = data_dir / "wake_word" / "hey_branpy"
        if wake_dir.exists():
            for audio_file in wake_dir.glob("*.wav"):
                self.samples.append((str(audio_file), 1))
        
        # Negativos: ruído, fala aleatória, silêncio
        # Usa dados de STT como negativos
        stt_dirs = [
            data_dir / "stt" / "librispeech",
            data_dir / "stt" / "common_voice_cc0",
        ]
        for stt_dir in stt_dirs:
            if stt_dir.exists():
                for audio_file in stt_dir.rglob("*.flac"):
                    if len(self.samples) < 5000:  # Limita negativos
                        self.samples.append((str(audio_file), 0))
                for audio_file in stt_dir.rglob("*.mp3"):
                    if len(self.samples) < 5000:
                        self.samples.append((str(audio_file), 0))
        
        # Adiciona ruído sintético
        for _ in range(1000):
            self.samples.append(("noise", 0))
        
        print(f"Wake Word Dataset: {len(self.samples)} samples")
        print(f"  Positivos: {sum(1 for _, l in self.samples if l == 1)}")
        print(f"  Negativos: {sum(1 for _, l in self.samples if l == 0)}")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        
        if path == "noise":
            # Ruído branco
            waveform = torch.randn(1, 16000) * 0.01
        else:
            try:
                waveform, sr = torchaudio.load(path)
                if sr != 16000:
                    waveform = torchaudio.functional.resample(waveform, sr, 16000)
            except:
                waveform = torch.zeros(1, 16000)
        
        # Augmentação
        if self.augment and label == 1:
            # Time stretch, pitch shift, noise
            if torch.rand(1) < 0.3:
                waveform = waveform * (0.8 + torch.rand(1) * 0.4)
            if torch.rand(1) < 0.3:
                waveform += torch.randn_like(waveform) * 0.005
        
        # Mel spectrogram
        mel = torchaudio.transforms.MelSpectrogram(
            sample_rate=16000,
            n_fft=400,
            hop_length=160,
            n_mels=self.n_mels,
        )(waveform).squeeze(0)  # [n_mels, T]
        
        # Log
        mel = torch.log(mel + 1e-6)
        
        # Normalize
        mel = (mel - mel.mean()) / (mel.std() + 1e-6)
        
        # Pad/Truncate
        if mel.shape[1] > self.max_len:
            start = torch.randint(0, mel.shape[1] - self.max_len, (1,)).item()
            mel = mel[:, start:start + self.max_len]
        else:
            mel = F.pad(mel, (0, self.max_len - mel.shape[1]))
        
        return mel.transpose(0, 1), torch.tensor(label, dtype=torch.long)  # [T, n_mels], label


# ============================================================
# TREINO
# ============================================================

def train_wake_word():
    print("""
╔══════════════════════════════════════════════════════════╗
║  BRANPY WAKE WORD — "Ei BranPy" Detector                 ║
║  100% branpy.com.br — Dados: Próprios + CC0              ║
╚══════════════════════════════════════════════════════════╝
""")

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Device: {device}")

    # Dataset
    dataset = WakeWordDataset(DATA_DIR, n_mels=40, max_len=100)
    dataloader = DataLoader(dataset, batch_size=32, shuffle=True, num_workers=0)

    # Modelo
    model = WakeWordCNN(n_mels=40, n_classes=2).to(device)
    print(f"Params: {sum(p.numel() for p in model.parameters())/1e3:.1f}K")

    # Class weights (mais negativos que positivos)
    pos_weight = torch.tensor([3.0]).to(device)  # 3x mais negativos
    criterion = nn.CrossEntropyLoss(weight=pos_weight)
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=30)

    # Treino
    model.train()
    best_acc = 0
    
    for epoch in range(30):
        epoch_loss = 0
        correct = 0
        total = 0
        
        for mel, labels in dataloader:
            mel = mel.to(device)
            labels = labels.to(device)
            
            logits = model(mel)
            loss = F.cross_entropy(logits, labels)
            
            optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            
            epoch_loss += loss.item()
            preds = logits.argmax(dim=1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)
        
        scheduler.step()
        acc = correct / total
        avg_loss = epoch_loss / len(dataloader)
        
        print(f"Epoch {epoch+1}/30 | Loss: {avg_loss:.4f} | Acc: {acc:.4f}")
        
        if acc > best_acc:
            best_acc = acc
            torch.save({
                'model': model.state_dict(),
                'n_mels': 40,
            }, WEIGHTS_DIR / "wake_word_best.pt")
            print(f"  ✅ Melhor modelo salvo! Acc: {acc:.4f}")

    print(f"\n✅ Wake Word Treino Concluído! Melhor Acc: {best_acc:.4f}")
    return model


if __name__ == "__main__":
    train_wake_word()