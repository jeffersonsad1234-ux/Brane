"""Gerenciador de modelos — 100% Brampy. Carrega modelos PyTorch proprios."""

import os
import json
import logging
from pathlib import Path
from typing import Optional
from .config import WEIGHTS_DIR, BRAN9BPY_CONFIGS, DEFAULT_CONFIG
from .model import BranPyModel

logger = logging.getLogger("branpy-ap")


class ModelManager:
    def __init__(self):
        self.models: dict[str, BranPyModel] = {}
        self.active_model: Optional[str] = None
        self._discover_models()

    def _discover_models(self):
        """Busca modelos .pt nos diretorios de weights."""
        # Busca por diretorios de modelo (bran9bpy_scratch, etc.)
        scratch_dir = WEIGHTS_DIR / "bran9bpy_scratch"
        if scratch_dir.exists():
            for f in scratch_dir.glob("model_final.pt"):
                self.models["bran9bpy-scratch"] = BranPyModel(
                    model_path=str(f),
                    config=DEFAULT_CONFIG,
                )
                logger.info(f"Modelo encontrado: bran9bpy-scratch -> {f.name}")

        # Busca por .pt no diretorio raiz de weights
        for f in WEIGHTS_DIR.glob("**/*.pt"):
            name = f.parent.name if f.parent != WEIGHTS_DIR else f.stem
            if name not in self.models and "model_final" in f.name:
                self.models[name] = BranPyModel(
                    model_path=str(f),
                    config=DEFAULT_CONFIG,
                )
                logger.info(f"Modelo extra encontrado: {name} -> {f.name}")

    def get_model(self, name: str = None) -> Optional[BranPyModel]:
        if name is None:
            name = self.active_model or (list(self.models.keys())[0] if self.models else None)
        if name is None:
            return None
        if name in self.models:
            return self.models[name]
        for key, model in self.models.items():
            if name in key or key in name:
                return model
        return None

    def set_active(self, name: str) -> bool:
        model = self.get_model(name)
        if model:
            self.active_model = model.config.name if model.config else name
            return True
        return False

    def load_model(self, name: str = None) -> bool:
        model = self.get_model(name)
        if model:
            try:
                model.load()
                if name:
                    self.active_model = model.config.name if model.config else name
                return True
            except Exception as e:
                logger.error(f"Erro ao carregar {name}: {e}")
                return False
        return False

    def unload_model(self, name: str = None):
        model = self.get_model(name)
        if model:
            model.unload()

    def list_models(self) -> list[dict]:
        result = []
        for name, model in self.models.items():
            result.append({
                "name": name,
                "display_name": model.config.display_name if model.config else name,
                "params": model.config.params if model.config else "unknown",
                "path": model.model_path,
                "loaded": model.loaded,
                "active": name == self.active_model,
            })
        return result

    def get_stats(self) -> dict:
        total = len(self.models)
        loaded = sum(1 for m in self.models.values() if m.loaded)
        return {
            "total_models": total,
            "loaded": loaded,
            "active": self.active_model,
            "models": self.list_models(),
        }


model_manager = ModelManager()
