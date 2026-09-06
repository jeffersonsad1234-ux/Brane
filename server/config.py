import os
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional

BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"
WEIGHTS_DIR = BASE_DIR / "from_scratch" / "weights"
DATA_DIR = BASE_DIR / "data"
WEB_DIR = BASE_DIR / "web"

@dataclass
class ModelConfig:
    name: str
    display_name: str
    params: str
    context_length: int = 4096
    n_gpu_layers: int = 0
    n_threads: int = max(1, os.cpu_count() - 2) if os.cpu_count() else 4
    rope_freq_base: float = 10000.0
    rope_freq_scale: float = 1.0
    n_batch: int = 512
    use_mmap: bool = True
    use_mlock: bool = False
    f16_kv: bool = True
    rope_scaling: Optional[str] = None



BRAN9BPY_CONFIGS = {
    "1.5b": ModelConfig(
        name="bran9bpy-1.5b",
        display_name="Bran9BPy 1.5B",
        params="1.5B",
        context_length=4096,
        n_gpu_layers=0,
    ),
    "3b": ModelConfig(
        name="bran9bpy-3b",
        display_name="Bran9BPy 3B",
        params="3B",
        context_length=8192,
        n_gpu_layers=0,
    ),
    "7b": ModelConfig(
        name="bran9bpy-7b",
        display_name="Bran9BPy 7B",
        params="7B",
        context_length=16384,
        n_gpu_layers=0,
    ),
    "13b": ModelConfig(
        name="bran9bpy-13b",
        display_name="Bran9BPy 13B",
        params="13B",
        context_length=16384,
        n_gpu_layers=0,
    ),
    "70b": ModelConfig(
        name="bran9bpy-70b",
        display_name="Bran9BPy 70B",
        params="70B",
        context_length=32768,
        n_gpu_layers=0,
    ),
}

DEFAULT_CONFIG = BRAN9BPY_CONFIGS["1.5b"]

@dataclass
class ServerConfig:
    host: str = "127.0.0.1"
    port: int = 11435
    log_level: str = "info"
    cors_origins: list = field(default_factory=lambda: ["*"])
    max_concurrent: int = 1
    default_model: str = "bran9bpy-1.5b"
    temperature: float = 0.8
    top_p: float = 0.95
    top_k: int = 50
    repeat_penalty: float = 1.1
    max_tokens: int = 4096

SERVER_CONFIG = ServerConfig()

@dataclass
class TrainingConfig:
    model_size: str = "small"
    output_dir: str = str(BASE_DIR / "from_scratch" / "weights" / "bran9bpy_scratch")
    dataset_dir: str = str(DATA_DIR / "training")
    num_epochs: int = 10
    batch_size: int = 4
    learning_rate: float = 3e-4
    max_seq_length: int = 256
    vocab_size: int = 8000
    fp16: bool = False
    bf16: bool = False
    device: str = "cpu"

TRAINING_CONFIG = TrainingConfig()
