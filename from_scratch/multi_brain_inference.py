"""
Multi-Brain Inference — Wrapper para integração no server_v2.py
=============================================================
Fornece uma interface simples para o orquestrador multi-celebro
que pode ser chamada pelo endpoint /api/chat.
"""

import os
import sys
import time
import logging
from typing import Optional, Dict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

logger = logging.getLogger("multi_brain_inference")

# Lazy loading — só carrega quando necessário
_manager = None
_orchestrator = None


def _ensure_loaded():
    global _manager, _orchestrator
    if _manager is None:
        from brain_manager import get_brain_manager
        _manager = get_brain_manager()
    if _orchestrator is None:
        from multi_brain_orchestrator import get_multi_brain_orchestrator
        _orchestrator = get_multi_brain_orchestrator()


def multi_brain_generate(prompt: str, user_id: str = None,
                         context: str = "") -> Dict:
    """
    Gera resposta usando múltiplos cérebros.
    
    Retorna:
        {
            "response": str,
            "source": "multi_brain",
            "brains_used": list,
            "processing_time": float,
        }
    """
    _ensure_loaded()
    
    start = time.time()
    
    try:
        result = _orchestrator.process(
            prompt=prompt,
            user_id=user_id,
            context=context,
        )
        
        return {
            "response": result.response,
            "source": "multi_brain",
            "brains_used": result.brains_used,
            "processing_time": result.total_time,
            "synthesis_method": result.synthesis_method,
        }
        
    except Exception as e:
        logger.error(f"Multi-brain error: {e}")
        return {
            "response": "",
            "source": "multi_brain_error",
            "brains_used": [],
            "processing_time": time.time() - start,
            "error": str(e),
        }


def multi_brain_status() -> Dict:
    """Retorna status dos cérebros."""
    _ensure_loaded()
    
    return {
        "available": True,
        "brains": _manager.get_brain_status(),
        "total_brains": len(_manager.brains),
        "loaded_brains": sum(1 for b in _manager.brains.values() if b.loaded),
    }


def multi_brain_load_all():
    """Carrega todos os cérebros disponíveis."""
    _ensure_loaded()
    
    results = {}
    for brain_id in _manager.brains:
        success = _manager.load_brain(brain_id)
        results[brain_id] = success
    
    return results


def multi_brain_unload_all():
    """Descarrega todos os cérebros da memória."""
    _ensure_loaded()
    
    for brain_id in _manager.brains:
        _manager.unload_brain(brain_id)


# Para testes diretos
if __name__ == "__main__":
    print("Carregando cérebros...")
    status = multi_brain_load_all()
    print(f"Status: {status}")
    
    print("\nTestando geração multi-celebro...")
    result = multi_brain_generate("quanto é 15 + 27?")
    print(f"Resposta: {result['response']}")
    print(f"Cérebros: {result['brains_used']}")
    print(f"Tempo: {result['processing_time']:.2f}s")
