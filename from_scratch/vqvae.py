"""BranPy VQ-VAE — Gerador de Imagens 128x128.

100% da branpy.com.br — Todos os direitos reservados.
Arquitetura propria, sem dependencias externas.
Treinamento 100% offline.

VQ-VAE = Vector Quantized Variational AutoEncoder
- Encoder: imagem -> latente discreto
- Codebook: vetores aprendidos
- Decoder: latente -> imagem reconstruida
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


class BranPyConfig:
    """Configuracao do VQ-VAE."""
    def __init__(
        self,
        img_channels: int = 3,
        img_size: int = 128,
        n_embeddings: int = 512,
        embedding_dim: int = 64,
        n_channels: list = None,
        n_residual_layers: int = 2,
        residual_channels: int = 128,
        beta: float = 0.25,
    ):
        self.img_channels = img_channels
        self.img_size = img_size
        self.n_embeddings = n_embeddings
        self.embedding_dim = embedding_dim
        self.n_channels = n_channels or [128, 256, 512]
        self.n_residual_layers = n_residual_layers
        self.residual_channels = residual_channels
        self.beta = beta


class ResidualBlock(nn.Module):
    """Bloco residual — 100% nosso."""
    def __init__(self, channels):
        super().__init__()
        self.conv1 = nn.Conv2d(channels, channels, 3, padding=1)
        self.conv2 = nn.Conv2d(channels, channels, 3, padding=1)
        self.relu = nn.ReLU()
        self.norm1 = nn.GroupNorm(8, channels)
        self.norm2 = nn.GroupNorm(8, channels)

    def forward(self, x):
        residual = x
        x = self.relu(self.norm1(self.conv1(x)))
        x = self.norm2(self.conv2(x))
        return x + residual


class Encoder(nn.Module):
    """Encoder — 100% nosso."""
    def __init__(self, config):
        super().__init__()
        channels = config.n_channels

        layers = []
        in_ch = config.img_channels

        for out_ch in channels:
            layers.extend([
                nn.Conv2d(in_ch, out_ch, 4, stride=2, padding=1),
                nn.ReLU(),
                nn.GroupNorm(8, out_ch),
            ])
            for _ in range(config.n_residual_layers):
                layers.append(ResidualBlock(out_ch))
            in_ch = out_ch

        self.network = nn.Sequential(*layers)

    def forward(self, x):
        return self.network(x)


class Decoder(nn.Module):
    """Decoder — 100% nosso."""
    def __init__(self, config):
        super().__init__()
        channels = list(reversed(config.n_channels))

        layers = []
        in_ch = channels[0]

        for i, out_ch in enumerate(channels[1:], 1):
            layers.extend([
                nn.ConvTranspose2d(in_ch, out_ch, 4, stride=2, padding=1),
                nn.ReLU(),
                nn.GroupNorm(8, out_ch),
            ])
            for _ in range(config.n_residual_layers):
                layers.append(ResidualBlock(out_ch))
            in_ch = out_ch

        layers.extend([
            nn.ConvTranspose2d(in_ch, config.img_channels, 4, stride=2, padding=1),
            nn.Tanh(),
        ])

        self.network = nn.Sequential(*layers)

    def forward(self, x):
        return self.network(x)


class Codebook(nn.Module):
    """Codebook discreto — 100% nosso."""
    def __init__(self, n_embeddings, embedding_dim):
        super().__init__()
        self.n_embeddings = n_embeddings
        self.embedding_dim = embedding_dim

        self.embeddings = nn.Embedding(n_embeddings, embedding_dim)
        self.embeddings.weight.data.uniform_(-1/n_embeddings, 1/n_embeddings)

    def forward(self, z):
        B, D, H, W = z.shape
        z_flat = z.permute(0, 2, 3, 1).reshape(-1, D)

        distances = (
            z_flat.pow(2).sum(1, keepdim=True)
            - 2 * z_flat @ self.embeddings.weight.t()
            + self.embeddings.weight.pow(2).sum(1).unsqueeze(0)
        )

        indices = distances.argmin(1)
        z_q = self.embeddings(indices).view(B, H, W, D).permute(0, 3, 1, 2)

        commitment_loss = F.mse_loss(z_q.detach(), z)
        embedding_loss = F.mse_loss(z_q, z.detach())

        return z_q, indices, commitment_loss, embedding_loss


class BranPyVQVAE(nn.Module):
    """VQ-VAE 128x128 — 100% original branpy.com.br."""
    def __init__(self, config=None):
        super().__init__()
        if config is None:
            config = BranPyConfig()

        self.config = config

        self.encoder = Encoder(config)
        self.codebook = Codebook(config.n_embeddings, config.embedding_dim)
        self.decoder = Decoder(config)

        self.pre_conv = nn.Conv2d(config.n_channels[-1], config.embedding_dim, 1)
        self.post_conv = nn.Conv2d(config.embedding_dim, config.n_channels[-1], 1)

        n_params = sum(p.numel() for p in self.parameters())
        print(f"[VQ-VAE] BranPy-{n_params/1e6:.1f}M — {config.img_size}x{config.img_size}")
        print(f"  Embeddings: {config.n_embeddings} | Dim: {config.embedding_dim}")
        print(f"  Canais: {config.n_channels}")

    def encode(self, x):
        z = self.encoder(x)
        z = self.pre_conv(z)
        return z

    def decode(self, z):
        z = self.post_conv(z)
        x = self.decoder(z)
        return x

    def forward(self, x):
        z = self.encode(x)
        z_q, indices, commitment_loss, embedding_loss = self.codebook(z)
        x_recon = self.decode(z_q)

        return x_recon, commitment_loss, embedding_loss, indices

    def generate(self, n_samples=1, device='cpu'):
        """Gera imagens aleatorias do codebook."""
        H, W = self.config.img_size // (2 ** len(self.config.n_channels)), \
               self.config.img_size // (2 ** len(self.config.n_channels))

        random_indices = torch.randint(0, self.config.n_embeddings, (n_samples, H, W), device=device)
        z_q = self.codebook.embeddings(random_indices).permute(0, 3, 1, 2)

        return self.decode(z_q)


def create_vqvae(size='small'):
    """Cria VQ-VAE com tamanho especifico."""
    configs = {
        'tiny': BranPyConfig(
            img_size=64, n_embeddings=256, embedding_dim=32,
            n_channels=[64, 128], n_residual_layers=1,
        ),
        'small': BranPyConfig(
            img_size=128, n_embeddings=512, embedding_dim=64,
            n_channels=[128, 256, 512], n_residual_layers=2,
        ),
        'medium': BranPyConfig(
            img_size=256, n_embeddings=1024, embedding_dim=128,
            n_channels=[128, 256, 512, 1024], n_residual_layers=2,
        ),
    }
    config = configs.get(size, configs['small'])
    return BranPyVQVAE(config)


if __name__ == '__main__':
    model = create_vqvae('small')

    x = torch.randn(2, 3, 128, 128)
    x_recon, commit_loss, emb_loss, indices = model(x)

    print(f"\nInput: {x.shape}")
    print(f"Output: {x_recon.shape}")
    print(f"Commitment loss: {commit_loss:.4f}")
    print(f"Embedding loss: {emb_loss:.4f}")
    print(f"Indices: {indices.shape}")

    n_params = sum(p.numel() for p in model.parameters())
    print(f"\nTotal params: {n_params:,} ({n_params/1e6:.1f}M)")
