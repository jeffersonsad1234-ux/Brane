"""
BrampAI Orchestrator — Orquestrador Principal
============================================
Conecta: Modelo BrampAI + Memória + Raciocínio + Decisão
Fluxo completo conforme o documento de arquitetura.
"""

import time
import json
from typing import Optional, Dict, List, Any

from brampy_memory import MemoryStore, KnowledgeEntry, get_store
from reasoning_engine import ReasoningEngine
from decision_engine import DecisionEngine, Decision


class BrampAIOrchestrator:
    """
    Orquestrador principal que gerencia o fluxo completo:
    USUÁRIO → MEMÓRIA → DECISÃO → RACIOCÍNIO → MODELO → RESPOSTA → MEMÓRIA
    """

    def __init__(self, memory_dir: str = None):
        # Inicializa componentes
        self.memory = get_store(memory_dir)
        self.reasoning = ReasoningEngine()
        self.decision = DecisionEngine(
            memory_store=self.memory,
            reasoning_engine=self.reasoning
        )
        self._initialized = True

    def process(self, prompt: str, user_id: str = None,
                session_id: str = None, model_generate_fn=None,
                context: str = None) -> Dict:
        """
        Processa uma pergunta do usuário seguindo o fluxo completo.

        Args:
            prompt: Pergunta do usuário
            user_id: ID do usuário (para memória privada)
            session_id: ID da sessão
            model_generate_fn: Função de geração do modelo (prompt, context) -> str
            context: Contexto adicional (histórico de conversa)

        Returns:
            Dict com resposta, etapas, decisões, etc.
        """
        start_time = time.time()
        result = {
            'response': '',
            'source': 'unknown',  # model, memory, reasoning, combined, canned
            'decision': None,
            'steps': [],
            'memory_used': False,
            'reasoning_used': False,
            'knowledge_stored': False,
            'confidence': 0.0,
            'processing_time': 0,
            'status': 'processing',
        }

        # ========== FASE 1: DECISÃO ==========
        decision = self.decision.decide(prompt, user_id=user_id, session_id=session_id)
        result['decision'] = decision['decision'].value
        result['steps'].extend(decision.get('steps', []))
        result['confidence'] = decision.get('confidence', 0)
        status_msg = decision.get('status_message', '')

        # ========== FASE 2: EXECUÇÃO BASEADO NA DECISÃO ==========

        if decision['decision'] == Decision.RESPOND_DIRECT:
            # Resposta direta do modelo
            result['source'] = 'model'
            result['steps'].append('Respondendo diretamente')
            if model_generate_fn:
                result['response'] = model_generate_fn(prompt, context)

        elif decision['decision'] == Decision.RESPOND_FROM_MEMORY:
            # Responder da memória
            result['source'] = 'memory'
            result['memory_used'] = True
            best = decision['memory_results'][0]
            entry = best['entry']

            # Formata resposta da memória
            answer = entry.get('answer', '')
            content = entry.get('content', '')
            if answer:
                result['response'] = answer
            elif content:
                result['response'] = content
            else:
                result['response'] = f"Encontrei informação sobre isso: {entry.get('question', '')}"

            result['confidence'] = best.get('confidence', 0.5)
            result['steps'].append(f'Memória: score={best["score"]}, conf={best["confidence_level"]}')

            # Atualiza uso
            self.memory.update(entry['id'], usage_count=entry.get('usage_count', 0) + 1)

        elif decision['decision'] == Decision.USE_REASONING:
            # Raciocínio externo resolveu
            result['source'] = 'reasoning'
            result['reasoning_used'] = True
            rr = decision['reasoning_result']

            if rr and rr.get('result') is not None:
                # Formata resposta com etapas
                steps_text = self.reasoning.format_steps(rr.get('steps', []))
                if rr['type'] in ('simple_math', 'percentage', 'expression'):
                    result['response'] = f"Resultado: {rr['result']}"
                    if steps_text:
                        result['response'] += f"\n\nRaciocínio:\n{steps_text}"
                else:
                    result['response'] = str(rr['result'])
                    if steps_text:
                        result['response'] += f"\n\nEtapas:\n{steps_text}"

                result['confidence'] = rr.get('confidence', 0.7)
                result['steps'].append(f'Raciocínio: {rr["type"]}, resolveu={rr["can_solve"]}')

                # Armazena conhecimento resultante
                self._store_knowledge(
                    prompt=prompt,
                    answer=result['response'],
                    category='raciocinio',
                    source='reasoning',
                    confidence=rr.get('confidence', 0.7),
                    user_id=user_id,
                    session_id=session_id,
                )
                result['knowledge_stored'] = True
            else:
                # Raciocínio não resolveu, usa modelo como fallback
                result['source'] = 'model'
                result['steps'].append('Raciocínio não resolveu, usando modelo')
                if model_generate_fn:
                    result['response'] = model_generate_fn(prompt, context)

        elif decision['decision'] == Decision.SEARCH_FIRST:
            # Pesquisa necessária
            result['steps'].append('Entrando em modo de pesquisa...')
            result['source'] = 'search'

            # Tenta buscar mais na memória com critérios mais amplos
            if self.memory:
                broader_results = self.memory.search(
                    prompt, max_results=5, min_score=0.15,
                    user_id=user_id, min_confidence=0.0
                )
                if broader_results:
                    best = broader_results[0]
                    if best['score'] >= 0.3:
                        result['response'] = best['entry'].get('answer', best['entry'].get('content', ''))
                        result['memory_used'] = True
                        result['confidence'] = best['confidence']
                        result['steps'].append(f'Memória ampla: score={best["score"]}')
                    else:
                        # Não encontrou, usa modelo
                        if model_generate_fn:
                            result['response'] = model_generate_fn(prompt, context)
                            result['source'] = 'model'
                else:
                    if model_generate_fn:
                        result['response'] = model_generate_fn(prompt, context)
                        result['source'] = 'model'
            else:
                if model_generate_fn:
                    result['response'] = model_generate_fn(prompt, context)
                    result['source'] = 'model'

        elif decision['decision'] == Decision.COMBINE:
            # Combinar raciocínio + memória + modelo
            result['steps'].append('Combinando raciocínio + memória + modelo')
            result['source'] = 'combined'

            response_parts = []

            # 1. Raciocínio parcial
            if decision.get('reasoning_result'):
                rr = decision['reasoning_result']
                if rr.get('steps'):
                    response_parts.append("Raciocínio:\n" + self.reasoning.format_steps(rr['steps']))
                if rr.get('result') is not None:
                    response_parts.append(f"Resultado parcial: {rr['result']}")
                result['reasoning_used'] = True

            # 2. Conhecimento da memória
            if decision.get('memory_results'):
                best = decision['memory_results'][0]
                answer = best['entry'].get('answer', '')
                if answer:
                    response_parts.append(f"Da memória: {answer}")
                result['memory_used'] = True

            # 3. Modelo para complementar
            if model_generate_fn:
                complement = model_generate_fn(prompt, context)
                if complement:
                    response_parts.append(complement)
                result['source'] = 'combined'

            result['response'] = '\n\n'.join(response_parts) if response_parts else \
                "Não consegui resolver completamente. Posso tentar de outra forma."

        elif decision['decision'] == Decision.DONT_KNOW:
            result['response'] = decision.get('status_message',
                'Desculpe, não tenho informação suficiente sobre isso.')
            result['source'] = 'fallback'

        # ========== FASE 3: ARMAZENAMENTO ==========
        # NÃO armazenar respostas do modelo em memória (são unreliable)
        # Só armazenar quando: memória, raciocínio, ou pesquisa com alta confiança
        if (result['source'] in ('memory', 'reasoning', 'search') and
            result['response'] and
            result['confidence'] >= 0.7 and
            not result['knowledge_stored']):
            self._store_knowledge(
                prompt=prompt,
                answer=result['response'],
                category='conversa',
                source=result['source'],
                confidence=min(result['confidence'] + 0.1, 0.9),
                user_id=user_id,
                session_id=session_id,
            )
            result['knowledge_stored'] = True

        # Registra interação
        if result['response']:
            self.memory.register_interaction(
                prompt=prompt,
                answer=result['response'],
                source=result['source'],
                user_id=user_id,
                session_id=session_id,
            )

        # ========== FASE 4: LOG ==========
        self.decision.log_decision(prompt, decision)
        result['processing_time'] = time.time() - start_time
        result['status'] = 'complete'

        return result

    def _store_knowledge(self, prompt: str, answer: str, category: str,
                        source: str, confidence: float,
                        user_id: str = None, session_id: str = None,
                        context: str = None):
        """Armazena conhecimento na memória."""
        if confidence < 0.3:
            return

        # Verifica conflito com conhecimento existente
        conflict = self.memory.detect_conflict(answer, prompt)
        if conflict:
            # Marca como conflitante
            conflict.add_contradiction('new', f'Conflito com nova informação de {source}')
            return

        self.memory.add(
            content=prompt,
            answer=answer,
            question=prompt,
            context=context or '',
            category=category,
            source=source,
            confidence=confidence,
            user_id=user_id,
            session_id=session_id,
        )

    def get_memory_stats(self) -> Dict:
        return self.memory.get_stats()

    def get_decision_stats(self) -> Dict:
        return self.decision.get_stats()

    def search_memory(self, query: str, user_id: str = None) -> List[Dict]:
        return self.memory.search(query, user_id=user_id)

    def add_knowledge(self, content: str, answer: str = '', **kwargs) -> KnowledgeEntry:
        return self.memory.add(content=content, answer=answer, **kwargs)

    def update_knowledge(self, entry_id: str, **kwargs) -> Optional[KnowledgeEntry]:
        return self.memory.update(entry_id, **kwargs)

    def delete_knowledge(self, entry_id: str) -> bool:
        return self.memory.delete(entry_id)


# Instância global
_orchestrator: Optional[BrampAIOrchestrator] = None


def get_orchestrator(memory_dir: str = None) -> BrampAIOrchestrator:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = BrampAIOrchestrator(memory_dir)
    return _orchestrator
