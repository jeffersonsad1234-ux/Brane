"""Motor de inferencia — 100% Brampy. Carrega modelos PyTorch proprios.

Sem llama-cpp-python. Sem GGUF. Sem modelos externos.
"""

import json
import time
import logging
import torch
from pathlib import Path
from typing import Optional, Generator
from dataclasses import dataclass

logger = logging.getLogger("branpy-ap")

BASE_DIR = Path(__file__).resolve().parent.parent
FROM_SCRATCH_DIR = BASE_DIR / "from_scratch"

# Adiciona path do from_scratch pra importar model.py proprio
import sys
sys.path.insert(0, str(FROM_SCRATCH_DIR))
from model import BranPyModel as BranPyTransformer, BranPyConfig
from tokenizer import BPETokenizer


@dataclass
class InferenceResult:
    content: str
    model: str
    prompt_tokens: int
    completion_tokens: int
    duration_ms: int
    tokens_per_second: float


class BranPyModel:
    def __init__(self, model_path: str, config=None):
        self.model_path = model_path
        self.config = config
        self.model = None
        self.tokenizer = None
        self.loaded = False

    def load(self):
        if self.loaded:
            return
        path = Path(self.model_path)
        if not path.exists():
            raise FileNotFoundError(f"Modelo nao encontrado: {self.model_path}")
        logger.info(f"Carregando modelo: {path.name}")
        start = time.time()
        try:
            checkpoint = torch.load(str(path), map_location="cpu", weights_only=False)
            model_config = checkpoint.get("config", {})

            config = BranPyConfig(
                vocab_size=model_config.get("vocab_size", 8000),
                n_layers=model_config.get("n_layers", 6),
                d_model=model_config.get("d_model", 256),
                n_heads=model_config.get("n_heads", 8),
                d_ff=model_config.get("d_ff", 1024),
                max_seq_len=model_config.get("max_seq_len", 256),
            )

            self.model = BranPyTransformer(config)
            self.model.load_state_dict(checkpoint["model_state_dict"])
            self.model.eval()

            # Carregar tokenizer proprio
            tok_path = path.parent / "tokenizer.json"
            if tok_path.exists():
                self.tokenizer = BPETokenizer()
                self.tokenizer.load(str(tok_path))
            else:
                raise FileNotFoundError(f"Tokenizer nao encontrado: {tok_path}")

            self.loaded = True
            elapsed = time.time() - start
            n_params = sum(p.numel() for p in self.model.parameters())
            logger.info(f"Modelo carregado em {elapsed:.1f}s ({n_params/1e6:.2f}M params)")
        except Exception as e:
            raise RuntimeError(f"Erro ao carregar modelo: {e}")

    def unload(self):
        if self.model:
            del self.model
            self.model = None
        if self.tokenizer:
            del self.tokenizer
            self.tokenizer = None
        self.loaded = False
        logger.info("Modelo descarregado")

    def generate(self, prompt: str, system_prompt: str = "", temperature: float = 0.8,
                 top_p: float = 0.95, top_k: int = 50, max_tokens: int = 4096,
                 repeat_penalty: float = 1.1, stop: list = None) -> InferenceResult:
        if not self.loaded:
            self.load()
        start = time.time()
        try:
            # Formatar input com system prompt
            full_prompt = prompt
            if system_prompt:
                full_prompt = f"{system_prompt}\n\n{prompt}"

            ids = self.tokenizer.encode(full_prompt, add_special=True)
            x = torch.tensor([ids], dtype=torch.long)

            gen_ids = self.model.generate(
                x,
                max_new_tokens=min(max_tokens, 512),
                temperature=temperature,
                top_k=top_k,
            )
            output_text = self.tokenizer.decode(gen_ids[0].tolist())

            # Remover o prompt do output
            if output_text.startswith(full_prompt):
                output_text = output_text[len(full_prompt):]

            prompt_tokens = len(ids)
            completion_tokens = len(gen_ids[0]) - prompt_tokens
        except Exception as e:
            logger.error(f"Erro na inferencia: {e}")
            raise

        elapsed_ms = int((time.time() - start) * 1000)
        tps = completion_tokens / (elapsed_ms / 1000) if elapsed_ms > 0 else 0
        return InferenceResult(
            content=output_text.strip(),
            model=self.config.name if self.config else "bran9bpy",
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            duration_ms=elapsed_ms,
            tokens_per_second=round(tps, 2),
        )

    def generate_stream(self, prompt: str, system_prompt: str = "", temperature: float = 0.8,
                        top_p: float = 0.95, top_k: int = 50, max_tokens: int = 4096,
                        repeat_penalty: float = 1.1, stop: list = None) -> Generator[str, None, None]:
        # Stream simplificado — gera tudo de uma vez e yield por partes
        result = self.generate(prompt, system_prompt, temperature, top_p, top_k, max_tokens, repeat_penalty)
        # Yield em chunks de 10 caracteres pra simular stream
        text = result.content
        for i in range(0, len(text), 10):
            yield text[i:i+10]
