import math
import torch
import torch.nn as nn
import torch.nn.functional as F


class BranPyConfig:
    """Configuracao do modelo — 100% nosso."""

    def __init__(
        self,
        vocab_size: int = 8000,
        max_seq_len: int = 512,
        n_layers: int = 6,
        d_model: int = 256,
        n_heads: int = 8,
        d_ff: int = 1024,
        dropout: float = 0.1,
        pad_id: int = 0,
    ):
        self.vocab_size = vocab_size
        self.max_seq_len = max_seq_len
        self.n_layers = n_layers
        self.d_model = d_model
        self.n_heads = n_heads
        self.d_ff = d_ff
        self.dropout = dropout
        self.pad_id = pad_id

    def count_params(self):
        return f"~{self._count/1e6:.1f}M" if hasattr(self, '_count') else "?"

    @property
    def head_dim(self):
        return self.d_model // self.n_heads


class BranPyAttention(nn.Module):
    def __init__(self, config: BranPyConfig):
        super().__init__()
        self.n_heads = config.n_heads
        self.head_dim = config.head_dim
        self.d_model = config.d_model

        self.q = nn.Linear(config.d_model, config.d_model)
        self.k = nn.Linear(config.d_model, config.d_model)
        self.v = nn.Linear(config.d_model, config.d_model)
        self.out = nn.Linear(config.d_model, config.d_model)
        self.dropout = nn.Dropout(config.dropout)

        scale = torch.ones(1) * (config.head_dim ** -0.5)
        self.register_buffer('scale', scale)

    def forward(self, x, mask=None):
        B, T, C = x.shape
        q = self.q(x).view(B, T, self.n_heads, self.head_dim).transpose(1, 2)
        k = self.k(x).view(B, T, self.n_heads, self.head_dim).transpose(1, 2)
        v = self.v(x).view(B, T, self.n_heads, self.head_dim).transpose(1, 2)

        att = (q @ k.transpose(-2, -1)) * self.scale
        if mask is not None:
            att = att.masked_fill(mask[:T, :T] == 0, float('-inf'))
        att = F.softmax(att, dim=-1)
        att = self.dropout(att)

        out = (att @ v).transpose(1, 2).contiguous().view(B, T, C)
        return self.out(out)


class BranPyFFN(nn.Module):
    def __init__(self, config: BranPyConfig):
        super().__init__()
        self.linear1 = nn.Linear(config.d_model, config.d_ff)
        self.linear2 = nn.Linear(config.d_ff, config.d_model)
        self.dropout = nn.Dropout(config.dropout)
        self.act = nn.GELU()

    def forward(self, x):
        return self.linear2(self.dropout(self.act(self.linear1(x))))


class BranPyBlock(nn.Module):
    def __init__(self, config: BranPyConfig):
        super().__init__()
        self.ln1 = nn.LayerNorm(config.d_model)
        self.attn = BranPyAttention(config)
        self.ln2 = nn.LayerNorm(config.d_model)
        self.ffn = BranPyFFN(config)

    def forward(self, x, mask=None):
        x = x + self.attn(self.ln1(x), mask)
        x = x + self.ffn(self.ln2(x))
        return x


class BranPyModel(nn.Module):
    """Transformer 100% proprio. Zero dependencia."""

    def __init__(self, config: BranPyConfig):
        super().__init__()
        self.config = config

        self.tok_emb = nn.Embedding(config.vocab_size, config.d_model, padding_idx=config.pad_id)
        self.pos_emb = nn.Embedding(config.max_seq_len, config.d_model)
        self.drop = nn.Dropout(config.dropout)

        self.blocks = nn.ModuleList([BranPyBlock(config) for _ in range(config.n_layers)])
        self.ln_f = nn.LayerNorm(config.d_model)
        self.head = nn.Linear(config.d_model, config.vocab_size, bias=False)

        self.tok_emb.weight = self.head.weight

        self.apply(self._init_weights)
        n_params = sum(p.numel() for p in self.parameters())
        print(f"[Model] BranPy-{n_params/1e6:.1f}M — {config.n_layers} layers, {config.d_model}d, {config.n_heads}h")

    def _init_weights(self, module):
        if isinstance(module, nn.Linear):
            nn.init.normal_(module.weight, mean=0.0, std=0.02)
            if module.bias is not None:
                nn.init.zeros_(module.bias)
        elif isinstance(module, nn.Embedding):
            nn.init.normal_(module.weight, mean=0.0, std=0.02)
            if module.padding_idx is not None:
                nn.init.zeros_(module.weight[module.padding_idx])
        elif isinstance(module, nn.LayerNorm):
            nn.init.ones_(module.weight)
            nn.init.zeros_(module.bias)

    def forward(self, idx, targets=None):
        B, T = idx.shape
        pos = torch.arange(0, T, dtype=torch.long, device=idx.device).unsqueeze(0)

        x = self.drop(self.tok_emb(idx) + self.pos_emb(pos))

        mask = torch.tril(torch.ones(T, T, device=idx.device)).unsqueeze(0).unsqueeze(0)
        for block in self.blocks:
            x = block(x, mask)
        x = self.ln_f(x)

        logits = self.head(x)
        loss = None
        if targets is not None:
            loss = F.cross_entropy(
                logits.view(-1, logits.size(-1)),
                targets.view(-1),
                ignore_index=-100,
            )
        return logits, loss

    @torch.no_grad()
    def generate(self, idx, max_new_tokens=200, temperature=0.7, top_k=40, 
                 top_p=0.9, repetition_penalty=1.1, min_tokens=5, eos_id=None):
        """Geração melhorada com:
        - Repetition penalty (evita loops)
        - Top-p (nucleus sampling)
        - Temperatura adaptativa
        - Min tokens antes de EOS
        """
        if eos_id is None:
            eos_id = self.config.pad_id  # fallback
        
        generated = []
        for step in range(max_new_tokens):
            idx_cond = idx[:, -self.config.max_seq_len:]
            logits, _ = self(idx_cond)
            logits = logits[:, -1, :]  # (B, vocab)
            
            # Repetition penalty
            if repetition_penalty != 1.0 and generated:
                for token_id in set(generated):
                    logits[:, token_id] /= repetition_penalty
            
            # Temperatura (pode ser scheduleada)
            logits = logits / max(temperature, 1e-5)
            
            # Top-k
            if top_k > 0:
                v, _ = torch.topk(logits, min(top_k, logits.size(-1)))
                logits[logits < v[:, [-1]]] = float('-inf')
            
            # Top-p (nucleus sampling)
            if top_p < 1.0:
                sorted_logits, sorted_indices = torch.sort(logits, descending=True)
                cumulative_probs = torch.cumsum(F.softmax(sorted_logits, dim=-1), dim=-1)
                # Remove tokens with cumulative prob > top_p
                sorted_indices_to_remove = cumulative_probs > top_p
                # Shift to keep at least one token
                sorted_indices_to_remove[:, 1:] = sorted_indices_to_remove[:, :-1].clone()
                sorted_indices_to_remove[:, 0] = 0
                indices_to_remove = sorted_indices_to_remove.scatter(1, sorted_indices, sorted_indices_to_remove)
                logits[indices_to_remove] = float('-inf')
            
            probs = F.softmax(logits, dim=-1)
            idx_next = torch.multinomial(probs, num_samples=1)
            
            # Verifica EOS
            token_id = idx_next.item() if idx_next.numel() == 1 else idx_next[0].item()
            generated.append(token_id)
            
            idx = torch.cat((idx, idx_next), dim=1)
            
            # Min tokens antes de permitir EOS
            if token_id == eos_id and step >= min_tokens:
                break
        
        return idx


def create_model(vocab_size: int = 8000, size: str = 'small') -> BranPyModel:
    configs = {
        'tiny':   BranPyConfig(vocab_size=vocab_size, n_layers=4,  d_model=128,  n_heads=4,  d_ff=512,   max_seq_len=512),
        'small':  BranPyConfig(vocab_size=vocab_size, n_layers=6,  d_model=256,  n_heads=8,  d_ff=1024,  max_seq_len=512),
        'medium': BranPyConfig(vocab_size=vocab_size, n_layers=8,  d_model=512,  n_heads=8,  d_ff=2048,  max_seq_len=512),
        'base':   BranPyConfig(vocab_size=vocab_size, n_layers=12, d_model=768,  n_heads=12, d_ff=3072,  max_seq_len=1024),
        '500m':   BranPyConfig(vocab_size=vocab_size, n_layers=10, d_model=768,  n_heads=12, d_ff=3072,  max_seq_len=512, dropout=0.05),
        'xlarge': BranPyConfig(vocab_size=vocab_size, n_layers=16, d_model=768,  n_heads=12, d_ff=3072,  max_seq_len=256),
        'large':  BranPyConfig(vocab_size=vocab_size, n_layers=40, d_model=1024, n_heads=16, d_ff=4096,  max_seq_len=1024, dropout=0.05),
        '5b':     BranPyConfig(vocab_size=vocab_size, n_layers=24, d_model=2048, n_heads=16, d_ff=8192,  max_seq_len=256, dropout=0.1),
        # ~50M params - practical for CPU training
        'practical': BranPyConfig(vocab_size=vocab_size, n_layers=12, d_model=512,  n_heads=8,  d_ff=2048,  max_seq_len=1024, dropout=0.1),
        # ~80M params - upper limit for CPU
        'xl':     BranPyConfig(vocab_size=vocab_size, n_layers=16, d_model=768,  n_heads=12, d_ff=3072,  max_seq_len=1024, dropout=0.05),
        # ~12M params - ULTRA FAST for CPU (2-3s/step)
        # ~12M params - ULTRA FAST for CPU (2-3s/step)
        'fast':     BranPyConfig(vocab_size=vocab_size, n_layers=6,  d_model=256,  n_heads=8,  d_ff=1024,  max_seq_len=512, dropout=0.1),
    }
    config = configs.get(size, configs['small'])
    return BranPyModel(config)
