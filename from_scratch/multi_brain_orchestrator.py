"""
Multi-Brain Orchestrator — Orquestrador de Múltiplos Cérebros
============================================================
Coordena Brain 1 (conversação), Brain 2 (raciocínio), Brain 3 (conhecimento)
para produzir uma única resposta coesa ao usuário.

Fluxo:
  Usuário → Análise → [Cérebros necessários] → Síntese → Resposta
"""

import time
import logging
from typing import Optional, Dict, List, Tuple
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger("multi_brain_orch")


class BrainRole(Enum):
    CONVERSATION = "brain_01_conversation"
    REASONING = "brain_02_reasoning"
    KNOWLEDGE = "brain_03_knowledge"


@dataclass
class BrainResponse:
    """Resposta de um cérebro individual."""
    brain_id: str
    role: str
    response: str
    confidence: float = 0.5
    processing_time: float = 0.0


@dataclass
class OrchestratorResult:
    """Resultado final do orquestrador."""
    response: str
    brains_used: List[str]
    synthesis_method: str
    total_time: float
    individual_responses: List[BrainResponse] = field(default_factory=list)


class MultiBrainOrchestrator:
    """
    Orquestrador que coordena múltiplos cérebros especializados.

    Decisões:
    - Pergunta simples → 1 cérebro
    - Pergunta moderada → 2 cérebros
    - Pergunta complexa → 3 cérebros
    """

    def __init__(self, brain_manager=None):
        if brain_manager is None:
            from brain_manager import get_brain_manager
            self.manager = get_brain_manager()
        else:
            self.manager = brain_manager

        # Padrões de classificação
        self._reasoning_patterns = [
            "quanto", "qual", "calcule", "resolva", "quanto é", "quanto e",
            "mais", "menos", "vezes", "dividido", "porcentagem", "%", "soma",
            "se tenho", "se eu", "quanto tenho", "qual resultado",
            "por que", "por que acontece", "explique o raciocínio",
            "lógica", "raciocínio", "conclusão", "premissa",
            "comparar", "comparação", "diferença", "qual é maior",
            "quantos", "qual é a probabilidade", "estimativa",
            "problema", "questão", "exercício", "cálculo",
        ]

        self._knowledge_patterns = [
            "o que é", "o que e", "o que são", "o que sao",
            "quem é", "quem e", "quem foi", "quem foi",
            "como funciona", "como funciona",
            "definição", "definicao", "conceito",
            "explique", "explique o que", "me explica",
            "qual a função", "qual a funcao", "para que serve",
            "qual a diferença", "qual a diferenca",
            "qual é a capital", "qual e a capital",
            "quantos estados", "quantos países",
            "qual é o maior", "qual e o maior",
            "história", "historia", "origem",
            "ciência", "ciencia", "tecnologia",
            "conhecimento", "informação", "informacao",
        ]

        self._conversation_patterns = [
            "oi", "ola", "eai", "e ai", "bom dia", "boa tarde", "boa noite",
            "obrigado", "valeu", "tchau", "falou",
            "como vai", "tudo bem", "tudo bom",
            "o que voce faz", "quem é voce",
            "piada", "engraçado", "me faz rir",
            "triste", "feliz", "ansioso",
            "namorada", "amigo", "parceiro",
            "caramba", "nossa", "eita",
            "viu que", "sabe que",
        ]

    def classify_question(self, prompt: str) -> Dict[str, float]:
        """
        Classifica a pergunta e retorna scores para cada tipo.
        Retorna: {'conversation': 0.3, 'reasoning': 0.7, 'knowledge': 0.5}
        """
        p = prompt.lower().strip()
        scores = {'conversation': 0.0, 'reasoning': 0.0, 'knowledge': 0.0}

        # Score de raciocínio
        for pattern in self._reasoning_patterns:
            if pattern in p:
                scores['reasoning'] += 0.3

        # Score de conhecimento
        for pattern in self._knowledge_patterns:
            if pattern in p:
                scores['knowledge'] += 0.3

        # Score de conversação
        for pattern in self._conversation_patterns:
            if pattern in p:
                scores['conversation'] += 0.3

        # Normaliza
        total = sum(scores.values())
        if total > 0:
            for k in scores:
                scores[k] = min(scores[k] / total, 1.0)
        else:
            # Default: conversação
            scores['conversation'] = 1.0

        return scores

    def select_brains(self, scores: Dict[str, float], threshold: float = 0.2) -> List[str]:
        """
        Seleciona quais cérebros devem participar baseado nos scores.
        Retorna lista de brain_ids ordenados por relevância.
        """
        selected = []
        for role, score in sorted(scores.items(), key=lambda x: -x[1]):
            if score >= threshold:
                if role == 'conversation':
                    selected.append(BrainRole.CONVERSATION.value)
                elif role == 'reasoning':
                    selected.append(BrainRole.REASONING.value)
                elif role == 'knowledge':
                    selected.append(BrainRole.KNOWLEDGE.value)

        # Sempre incluir pelo menos 1 cérebro
        if not selected:
            selected = [BrainRole.CONVERSATION.value]

        return selected

    def query_brains(self, prompt: str, brain_ids: List[str],
                     context: str = "") -> List[BrainResponse]:
        """
        Consulta os cérebros selecionados e coleta respostas.
        """
        responses = []

        for brain_id in brain_ids:
            start = time.time()
            try:
                response = self.manager.generate(
                    brain_id=brain_id,
                    prompt=prompt,
                    max_new_tokens=200,
                    temperature=0.7,
                    top_k=40,
                    top_p=0.9,
                )
                elapsed = time.time() - start

                # Estima confiança baseado no comprimento e conteúdo
                confidence = self._estimate_confidence(response, brain_id)

                responses.append(BrainResponse(
                    brain_id=brain_id,
                    role=brain_id.split("_")[-1],
                    response=response,
                    confidence=confidence,
                    processing_time=elapsed,
                ))

            except Exception as e:
                logger.error(f"Erro ao consultar {brain_id}: {e}")
                responses.append(BrainResponse(
                    brain_id=brain_id,
                    role=brain_id.split("_")[-1],
                    response="",
                    confidence=0.0,
                    processing_time=time.time() - start,
                ))

        return responses

    def _estimate_confidence(self, response: str, brain_id: str) -> float:
        """
        Estima a confiança na resposta baseado em heurísticas simples.
        """
        if not response or len(response.strip()) < 5:
            return 0.1

        # Respostas muito curtas tendem a ser piores
        length_score = min(len(response) / 100, 1.0) * 0.3

        # Respostas com "não sei", "não tenho" são menos confiáveis
        uncertainty_words = ["não sei", "nao sei", "não tenho", "nao tenho",
                           "não entendi", "nao entendi", "incapaz", "impossível"]
        uncertainty_penalty = 0.0
        for word in uncertainty_words:
            if word in response.lower():
                uncertainty_penalty += 0.2

        # Respostas com números/fatos são mais confiáveis (para raciocínio)
        fact_score = 0.0
        if brain_id == BrainRole.REASONING.value:
            import re
            numbers = re.findall(r'\d+', response)
            if numbers:
                fact_score = 0.3

        # Respostas com estrutura (listas, passos) são mais confiáveis
        structure_score = 0.0
        if any(marker in response for marker in ["1.", "Passo", "•", "-", "•"]):
            structure_score = 0.2

        confidence = 0.4 + length_score + fact_score + structure_score - uncertainty_penalty
        return max(0.1, min(confidence, 1.0))

    def synthesize(self, prompt: str, responses: List[BrainResponse],
                   scores: Dict[str, float]) -> str:
        """
        Sintetiza as respostas dos cérebros em uma única resposta coesa.
        """
        # Filtra respostas vazias
        valid = [r for r in responses if r.response and r.confidence > 0.1]

        if not valid:
            return "Desculpe, não consegui gerar uma resposta adequada."

        if len(valid) == 1:
            return valid[0].response

        # Ordena por confiança
        valid.sort(key=lambda x: x.confidence, reverse=True)

        # Se uma resposta tem confiança muito maior, usa ela
        if valid[0].confidence > 0.7 and valid[0].confidence > valid[1].confidence * 1.5:
            return valid[0].response

        # Sintetiza: pega o melhor de cada
        parts = []
        seen_content = set()

        for resp in valid:
            # Normaliza pra evitar duplicatas
            normalized = resp.response.lower().strip()[:50]
            if normalized not in seen_content:
                seen_content.add(normalized)
                # Adiciona com identificação de fonte
                if len(valid) > 1:
                    parts.append(resp.response.strip())

        if not parts:
            return valid[0].response

        # Combina as partes
        if len(parts) == 1:
            return parts[0]

        # Para 2-3 respostas, pega a melhor como base e complementa
        base = parts[0]
        
        # Se a resposta do raciocínio tem números, prioriza ela
        reasoning_resp = next((r for r in valid if r.role == "reasoning"), None)
        knowledge_resp = next((r for r in valid if r.role == "knowledge"), None)
        
        if reasoning_resp and knowledge_resp:
            # Raciocínio + conhecimento: combina
            return f"{knowledge_resp.response}\n\n{reasoning_resp.response}"
        elif reasoning_resp:
            return reasoning_resp.response
        elif knowledge_resp:
            return knowledge_resp.response
        
        return base

    def process(self, prompt: str, user_id: str = None,
                context: str = "") -> OrchestratorResult:
        """
        Processa uma pergunta usando múltiplos cérebros.
        
        Fluxo completo:
        1. Classifica a pergunta
        2. Seleciona cérebros
        3. Consulta cérebros
        4. Sintetiza resposta
        """
        start_time = time.time()

        # FASE 1: Classificação
        scores = self.classify_question(prompt)
        logger.debug(f"Scores: {scores}")

        # FASE 2: Seleção
        brain_ids = self.select_brains(scores)
        logger.debug(f"Cérebros selecionados: {brain_ids}")

        # FASE 3: Consulta
        responses = self.query_brains(prompt, brain_ids, context)

        # FASE 4: Síntese
        final_response = self.synthesize(prompt, responses, scores)

        total_time = time.time() - start_time

        return OrchestratorResult(
            response=final_response,
            brains_used=brain_ids,
            synthesis_method="confidence_weighted",
            total_time=total_time,
            individual_responses=responses,
        )


# Singleton
_orchestrator = None

def get_multi_brain_orchestrator() -> MultiBrainOrchestrator:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = MultiBrainOrchestrator()
    return _orchestrator
