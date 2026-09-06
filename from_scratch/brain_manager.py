"""
Brain Manager — Gerenciamento de Múltiplos Cérebros BrampAI
==========================================================
Gerencia carregamento, inferência e checkpoint de múltiplos
modelosTransformer independentes, cada um especializado.
"""

import os
import sys
import json
import time
import torch
import logging
from pathlib import Path
from typing import Optional, Dict, List, Tuple
from dataclasses import dataclass, field

# Adiciona path do from_scratch
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from model import BranPyModel, BranPyConfig, create_model
from tokenizer import BPETokenizer

logger = logging.getLogger("brain_manager")

WEIGHTS_DIR = Path(__file__).parent / "weights"


@dataclass
class BrainInfo:
    """Informações sobre um cérebro carregado."""
    brain_id: str
    specialty: str
    model: Optional[BranPyModel] = None
    tokenizer: Optional[BPETokenizer] = None
    config: Optional[dict] = None
    loaded: bool = False
    params: int = 0
    device: str = "cpu"


class BrainManager:
    """
    Gerencia múltiplos cérebros (modelosTransformer independentes).
    
    Cada cérebro tem:
    - Seu próprio checkpoint (weights/brain_XX_name/)
    - Seu próprio tokenizer
    - Sua especialidade
    - Carregamento/descarga independente
    """

    def __init__(self):
        self.brains: Dict[str, BrainInfo] = {}
        self._discover_brains()

    def _discover_brains(self):
        """Descobre todos os cérebros disponíveis no diretório de weights."""
        brain_prefix = "brain_"
        
        if not WEIGHTS_DIR.exists():
            logger.warning(f"Weights dir não existe: {WEIGHTS_DIR}")
            return

        for d in sorted(WEIGHTS_DIR.iterdir()):
            if d.is_dir() and d.name.startswith(brain_prefix):
                brain_id = d.name
                # Tenta ler config
                config_path = d / "config.json"
                config = {}
                if config_path.exists():
                    with open(config_path, 'r', encoding='utf-8-sig') as f:
                        config = json.load(f)

                # Detecta checkpoint
                checkpoint_path = None
                for name in ["model_best.pt", "model_final.pt", "model_epoch10.pt"]:
                    p = d / name
                    if p.exists():
                        checkpoint_path = p
                        break

                tokenizer_path = d / "tokenizer.json"
                
                if checkpoint_path and tokenizer_path.exists():
                    self.brains[brain_id] = BrainInfo(
                        brain_id=brain_id,
                        specialty=config.get("specialty", "desconhecida"),
                        config=config,
                    )
                    # Armazena caminhos para carregamento posterior
                    self.brains[brain_id]._checkpoint_path = checkpoint_path
                    self.brains[brain_id]._tokenizer_path = tokenizer_path
                    logger.info(f"Cérebro descoberto: {brain_id} ({config.get('specialty', '?')})")
                else:
                    logger.debug(f"Diretório {brain_id} ignorado (sem checkpoint/tokenizer)")

    def load_brain(self, brain_id: str) -> bool:
        """Carrega um cérebro na memória."""
        if brain_id not in self.brains:
            logger.error(f"Cérebro não encontrado: {brain_id}")
            return False

        brain = self.brains[brain_id]
        if brain.loaded:
            return True

        try:
            checkpoint_path = brain._checkpoint_path
            tokenizer_path = brain._tokenizer_path

            # Carrega checkpoint
            checkpoint = torch.load(checkpoint_path, map_location="cpu", weights_only=False)
            config_dict = checkpoint.get("config", {})

            # Cria modelo
            model_size = config_dict.get("model_size", "small")
            actual_vocab = config_dict.get("vocab_size", 8000)

            model = create_model(vocab_size=actual_vocab, size=model_size)

            # Ajusta max_seq_len se necessário
            if hasattr(model.config, 'max_seq_len'):
                model.config.max_seq_len = config_dict.get("max_seq_len", 256)

            # Carrega pesos
            state_dict = checkpoint.get("model_state_dict", checkpoint)
            model.load_state_dict(state_dict, strict=False)
            model.eval()

            # Carrega tokenizer
            tokenizer = BPETokenizer(vocab_size=actual_vocab)
            tokenizer.load(str(tokenizer_path))

            brain.model = model
            brain.tokenizer = tokenizer
            brain.loaded = True
            brain.params = sum(p.numel() for p in model.parameters())

            logger.info(f"Cérebro {brain_id} carregado: {brain.params/1e6:.2f}M params")
            return True

        except Exception as e:
            logger.error(f"Erro ao carregar {brain_id}: {e}")
            return False

    def unload_brain(self, brain_id: str):
        """Descarrega um cérebro da memória."""
        if brain_id in self.brains:
            brain = self.brains[brain_id]
            brain.model = None
            brain.tokenizer = None
            brain.loaded = False
            logger.info(f"Cérebro {brain_id} descarregado")

    def generate(self, brain_id: str, prompt: str, max_new_tokens: int = 200,
                 temperature: float = 0.7, top_k: int = 40, top_p: float = 0.9) -> str:
        """Gera texto usando um cérebro específico."""
        if brain_id not in self.brains:
            return f"[Erro: cérebro {brain_id} não encontrado]"
        
        brain = self.brains[brain_id]
        if not brain.loaded:
            if not self.load_brain(brain_id):
                return f"[Erro: não foi possível carregar {brain_id}]"

        try:
            tokenizer = brain.tokenizer
            model = brain.model

            # Formata prompt
            formatted = f"<s> P: {prompt} <sep> R:"
            ids = tokenizer.encode(formatted, add_special=False)

            if not ids:
                return "[Erro: tokenizer retornou vazio]"

            # Clamp token IDs
            vocab_size = len(tokenizer.vocab)
            ids = [min(i, vocab_size - 1) for i in ids]

            x = torch.tensor([ids], dtype=torch.long)
            prompt_len = len(ids)

            with torch.no_grad():
                output = model.generate(
                    x,
                    max_new_tokens=max_new_tokens,
                    temperature=temperature,
                    top_k=top_k,
                    top_p=top_p,
                    eos_id=2,
                )

            # Decodifica só os novos tokens
            new_tokens = output[0, prompt_len:].tolist()
            text = tokenizer.decode(new_tokens)
            return text.strip()

        except Exception as e:
            logger.error(f"Erro na geração {brain_id}: {e}")
            return f"[Erro na geração: {e}]"

    def list_brains(self) -> List[Dict]:
        """Lista todos os cérebros disponíveis."""
        result = []
        for brain_id, brain in self.brains.items():
            result.append({
                "brain_id": brain_id,
                "specialty": brain.specialty,
                "loaded": brain.loaded,
                "params": brain.params,
                "config": brain.config,
            })
        return result

    def get_brain_status(self) -> Dict:
        """Retorna status de todos os cérebros."""
        return {
            brain_id: {
                "loaded": brain.loaded,
                "specialty": brain.specialty,
                "params": brain.params,
            }
            for brain_id, brain in self.brains.items()
        }


# Singleton
_manager = None

def get_brain_manager() -> BrainManager:
    global _manager
    if _manager is None:
        _manager = BrainManager()
    return _manager
