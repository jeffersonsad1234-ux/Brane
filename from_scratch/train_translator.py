"""
BranPy Translator — Tradutor 20 idiomas próprio (NLLB-style Transformer).

100% da branpy.com.br — Todos os direitos reservados.
Treinado APENAS em dados Domínio Público / CC0.
"""

import os
import sys
import json
import time
import random
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from pathlib import Path

sys.path.insert(0, os.path.dirname(__file__))
from tokenizer import BPETokenizer

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data_voice"
WEIGHTS_DIR = BASE_DIR / "weights" / "translator_branpy"
WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)

# 20 idiomas alvo
TARGET_LANGS = [
    "pt", "en", "es", "fr", "de", "it", "ja", "ko", "zh", "ru",
    "ar", "hi", "tr", "pl", "nl", "sv", "he", "th", "vi", "id"
]
LANG_TO_ID = {lang: i for i, lang in enumerate(TARGET_LANGS)}


# ============================================================
# MODEL: Encoder-Decoder Transformer (NLLB-style)
# ============================================================

class MultiHeadAttention(nn.Module):
    def __init__(self, d_model, n_heads, dropout=0.1):
        super().__init__()
        self.d_model = d_model
        self.n_heads = n_heads
        self.d_k = d_model // n_heads
        
        self.w_q = nn.Linear(d_model, d_model)
        self.w_k = nn.Linear(d_model, d_model)
        self.w_v = nn.Linear(d_model, d_model)
        self.w_o = nn.Linear(d_model, d_model)
        self.dropout = nn.Dropout(dropout)

    def forward(self, q, k, v, mask=None):
        B, T, _ = q.shape
        
        Q = self.w_q(q).view(B, T, self.n_heads, self.d_k).transpose(1, 2)
        K = self.w_k(k).view(B, T, self.n_heads, self.d_k).transpose(1, 2)
        V = self.w_v(v).view(B, T, self.n_heads, self.d_k).transpose(1, 2)
        
        scores = torch.matmul(Q, K.transpose(-2, -1)) / (self.d_k ** 0.5)
        
        if mask is not None:
            scores = scores.masked_fill(mask == 0, -1e9)
        
        attn = F.softmax(scores, dim=-1)
        attn = self.dropout(attn)
        
        out = torch.matmul(attn, V)
        out = out.transpose(1, 2).contiguous().view(B, T, self.d_model)
        return self.w_o(out)


class FeedForward(nn.Module):
    def __init__(self, d_model, d_ff, dropout=0.1):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(d_model, d_ff),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(d_ff, d_model),
            nn.Dropout(dropout),
        )

    def forward(self, x):
        return self.net(x)


class EncoderLayer(nn.Module):
    def __init__(self, d_model, n_heads, d_ff, dropout=0.1):
        super().__init__()
        self.attn = MultiHeadAttention(d_model, n_heads, dropout)
        self.ff = FeedForward(d_model, d_ff, dropout)
        self.norm1 = nn.LayerNorm(d_model)
        self.norm2 = nn.LayerNorm(d_model)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x, mask=None):
        x = x + self.dropout(self.attn(self.norm1(x), self.norm1(x), self.norm1(x), mask))
        x = x + self.dropout(self.ff(self.norm2(x)))
        return x


class DecoderLayer(nn.Module):
    def __init__(self, d_model, n_heads, d_ff, dropout=0.1):
        super().__init__()
        self.self_attn = MultiHeadAttention(d_model, n_heads, dropout)
        self.cross_attn = MultiHeadAttention(d_model, n_heads, dropout)
        self.ff = FeedForward(d_model, d_ff, dropout)
        self.norm1 = nn.LayerNorm(d_model)
        self.norm2 = nn.LayerNorm(d_model)
        self.norm3 = nn.LayerNorm(d_model)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x, enc_out, tgt_mask=None, src_mask=None):
        x = x + self.dropout(self.self_attn(self.norm1(x), self.norm1(x), self.norm1(x), tgt_mask))
        x = x + self.dropout(self.cross_attn(self.norm2(x), self.norm2(enc_out), self.norm2(enc_out), src_mask))
        x = x + self.dropout(self.ff(self.norm3(x)))
        return x


class BranPyTranslator(nn.Module):
    def __init__(self, vocab_size, d_model=512, n_layers=6, n_heads=8, d_ff=2048, max_len=512):
        super().__init__()
        self.vocab_size = vocab_size
        self.d_model = d_model
        self.max_len = max_len
        
        # Embeddings compartilhados
        self.embedding = nn.Embedding(vocab_size, d_model)
        self.pos_enc = nn.Parameter(torch.randn(1, max_len, d_model) * 0.02)
        self.lang_emb = nn.Embedding(len(TARGET_LANGS), d_model)
        
        # Encoder
        self.encoder_layers = nn.ModuleList([
            EncoderLayer(d_model, n_heads, d_ff) for _ in range(n_layers)
        ])
        self.enc_norm = nn.LayerNorm(d_model)
        
        # Decoder
        self.decoder_layers = nn.ModuleList([
            DecoderLayer(d_model, n_heads, d_ff) for _ in range(n_layers)
        ])
        self.dec_norm = nn.LayerNorm(d_model)
        
        # Output
        self.output = nn.Linear(d_model, vocab_size, bias=False)
        self.output.weight = self.embedding.weight  # Weight tying
        
        self.dropout = nn.Dropout(0.1)

    def make_src_mask(self, src):
        return (src != 0).unsqueeze(1).unsqueeze(2)

    def make_tgt_mask(self, tgt):
        T = tgt.shape[1]
        mask = torch.tril(torch.ones(T, T, device=tgt.device)).bool()
        pad_mask = (tgt != 0).unsqueeze(1).unsqueeze(2)
        return mask & pad_mask

    def encode(self, src, src_lang):
        src_mask = self.make_src_mask(src)
        x = self.embedding(src) + self.pos_enc[:, :src.shape[1]]
        x = x + self.lang_emb(torch.full_like(src[:, :1], LANG_TO_ID[src_lang]))
        x = self.dropout(x)
        
        for layer in self.encoder_layers:
            x = layer(x, src_mask)
        return self.enc_norm(x)

    def decode(self, tgt, enc_out, tgt_lang, src_mask=None):
        tgt_mask = self.make_tgt_mask(tgt)
        x = self.embedding(tgt) + self.pos_enc[:, :tgt.shape[1]]
        x = x + self.lang_emb(torch.full_like(tgt[:, :1], LANG_TO_ID[tgt_lang]))
        x = self.dropout(x)
        
        for layer in self.decoder_layers:
            x = layer(x, enc_out, tgt_mask, src_mask)
        return self.dec_norm(x)

    def forward(self, src, tgt, src_lang, tgt_lang):
        enc_out = self.encode(src, src_lang)
        dec_out = self.decode(tgt, enc_out, tgt_lang, self.make_src_mask(src))
        return self.output(dec_out)

    def translate(self, src, src_lang, tgt_lang, max_len=100):
        """Gera tradução autoregressivamente."""
        self.eval()
        with torch.no_grad():
            enc_out = self.encode(src, src_lang)
            src_mask = self.make_src_mask(src)
            
            tgt = torch.full((src.shape[0], 1), 2, device=src.device)  # BOS
            
            for _ in range(max_len):
                dec_out = self.decode(tgt, enc_out, tgt_lang, src_mask)
                logits = self.output(dec_out[:, -1:])
                next_token = logits.argmax(-1)
                tgt = torch.cat([tgt, next_token], dim=1)
                
                if (next_token == 3).all():  # EOS
                    break
            
            return tgt


# ============================================================
# DATASET
# ============================================================

class TranslationDataset(Dataset):
    def __init__(self, data_dir, tokenizer, max_len=256):
        self.tokenizer = tokenizer
        self.max_len = max_len
        self.samples = []
        
        # Europarl
        europarl = data_dir / "translation" / "europarl"
        if europarl.exists():
            for tsv in europarl.glob("*.tsv"):
                lang_pair = tsv.stem.replace("europarl-v10.", "").replace(".tsv", "")
                src_lang, tgt_lang = lang_pair.split("-")
                if src_lang in TARGET_LANGS and tgt_lang in TARGET_LANGS:
                    for line in tsv.open(encoding="utf-8"):
                        parts = line.strip().split("\t")
                        if len(parts) == 2:
                            self.samples.append((parts[0], parts[1], src_lang, tgt_lang))
        
        # UN Corpus
        un = data_dir / "translation" / "un_corpus"
        if un.exists():
            # Processa arquivos UN
            pass
        
        print(f"Translation Dataset: {len(self.samples)} pairs")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        src_text, tgt_text, src_lang, tgt_lang = self.samples[idx]
        
        src_ids = self.tokenizer.encode(src_text, add_special=True)[:self.max_len]
        tgt_ids = self.tokenizer.encode(tgt_text, add_special=True)[:self.max_len]
        
        return (
            torch.tensor(src_ids, dtype=torch.long),
            torch.tensor(tgt_ids, dtype=torch.long),
            src_lang,
            tgt_lang
        )


# ============================================================
# TREINO
# ============================================================

def train_translator():
    print("""
╔══════════════════════════════════════════════════════════╗
║  BRANPY TRANSLATOR — Tradutor 20 Idiomas Próprio         ║
║  100% branpy.com.br — Dados: Domínio Público / CC0       ║
╚══════════════════════════════════════════════════════════╝
""")

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Device: {device}")

    # Tokenizer
    tok_path = BASE_DIR / "weights" / "bran9bpy_fast" / "tokenizer.json"
    if tok_path.exists():
        tokenizer = BPETokenizer.load(tok_path)
    else:
        tokenizer = BPETokenizer(vocab_size=32000)
    
    vocab_size = len(tokenizer.vocab) + 10
    print(f"Vocab: {vocab_size}")

    # Modelo
    model = BranPyTranslator(vocab_size=vocab_size, d_model=512, n_layers=6).to(device)
    print(f"Params: {sum(p.numel() for p in model.parameters())/1e6:.1f}M")

    # Dataset
    dataset = TranslationDataset(DATA_DIR, tokenizer)
    dataloader = DataLoader(dataset, batch_size=8, shuffle=True, num_workers=0,
                           collate_fn=collate_fn)

    # Otimizador
    optimizer = torch.optim.AdamW(model.parameters(), lr=3e-4, weight_decay=0.01)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=30)

    # Treino
    model.train()
    step = 0
    pad_id = tokenizer.pad_id
    
    for epoch in range(30):
        epoch_loss = 0
        for src, tgt, src_lang, tgt_lang in dataloader:
            src = src.to(device)
            tgt = tgt.to(device)
            
            # Teacher forcing: tgt_input = tgt[:-1], tgt_target = tgt[1:]
            tgt_input = tgt[:, :-1]
            tgt_target = tgt[:, 1:]
            
            logits = model(src, tgt_input, src_lang[0], tgt_lang[0])
            
            loss = F.cross_entropy(
                logits.reshape(-1, logits.shape[-1]),
                tgt_target.reshape(-1),
                ignore_index=pad_id,
                label_smoothing=0.1
            )
            
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
        print(f"Epoch {epoch+1}/30 | Loss: {avg_loss:.4f}")
        
        if epoch % 5 == 0:
            torch.save({
                'model': model.state_dict(),
                'vocab_size': vocab_size,
                'langs': TARGET_LANGS,
            }, WEIGHTS_DIR / f"translator_epoch{epoch}.pt")

    # Final
    torch.save({
        'model': model.state_dict(),
        'vocab_size': vocab_size,
        'langs': TARGET_LANGS,
    }, WEIGHTS_DIR / "translator_final.pt")
    
    print("\n✅ Translator Treino Concluído!")
    return model


def collate_fn(batch):
    src_list, tgt_list, src_lang, tgt_lang = zip(*batch)
    
    src_padded = nn.utils.rnn.pad_sequence(src_list, batch_first=True, padding_value=0)
    tgt_padded = nn.utils.rnn.pad_sequence(tgt_list, batch_first=True, padding_value=0)
    
    return src_padded, tgt_padded, src_lang, tgt_lang


if __name__ == "__main__":
    train_translator()