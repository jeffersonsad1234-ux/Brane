"""
BrampAI Decision Engine — Motor de Decisão "Sei / Não Sei"
===========================================================
Determina quando o modelo deve responder diretamente,
quando deve pesquisar, e quando deve usar raciocínio externo.

Fluxo:
USUÁRIO → DECISÃO → sei? → responder
                   → não sei? → pesquisar → raciocinar → responder
"""

import re
import time
from typing import Optional, List, Dict, Tuple
from enum import Enum


class Decision(Enum):
    RESPOND_DIRECT = 'respond_direct'       # Modelo responde diretamente
    RESPOND_FROM_MEMORY = 'memory'          # Responder da memória BrampAI
    USE_REASONING = 'reasoning'             # Usar motor de raciocínio externo
    SEARCH_FIRST = 'search'                # Pesquisar antes de responder
    COMBINE = 'combine'                     # Combinar memória + raciocínio
    DONT_KNOW = 'dont_know'               # Não sabe e não pode pesquisar


class DecisionEngine:
    """
    Motor de decisão que analisa a pergunta e determina
    a melhor estratégia de resposta.
    """

    # Perguntas que o modelo pode responder diretamente
    DIRECT_PATTERNS = [
        # Saudações
        (r'^(oi|ola|bom dia|boa tarde|boa noite|e ai|fala|hey|hello|salve)', 'greeting'),
        # Identidade
        (r'(quem e voce|qual seu nome|o que voce faz|vc e humano)', 'identity'),
        # Sentimentos básicos
        (r'(como (?:voce )?esta|tudo bem|beleza)', 'sentiment'),
        # Despedidas
        (r'^(tchau|ate mais|falou|fui|ate logo|bye)', 'farewell'),
        # Agradecimentos
        (r'^(valeu|obrigado|obrigada|thanks|vlw|tmj|brigad)', 'thanks'),
        # Pedidos de piada
        (r'(me逢exta|conta uma piada|piada)', 'joke'),
        # Elogios/Zoera
        (r'(vc e (?:burro|idiota|otario)|me逢exta|me逢exta outra)', 'banter'),
    ]

    # Perguntas que claramente precisam de conhecimento externo
    KNOWLEDGE_PATTERNS = [
        # Definições / O que é
        (r'(o que (?:e|é|sa?o)|defina|definicao de|significa)', 'definition'),
        # Informações factuais
        (r'(qual (?:e|é|foi|foram)|quando (?:e|é|foi)|onde (?:e|é|fica))', 'factual'),
        # Por quê (causal)
        (r'(por (?:que|qual|como|quando))', 'causal'),
        # Comparativos
        (r'(quem (?:e|é|tem|sabe)|qual (?:e|é|mais|melhor|maior|menor))', 'comparison'),
        # Quantidades
        (r'(quantos?|quanto|qual a quantidade)', 'quantity'),
        # Recomendações
        (r'(me逢exta (?:algo|um|uma|algum)|recomende|sugira|qual o melhor)', 'recommendation'),
    ]

    # Perguntas que precisam de raciocínio externo
    REASONING_PATTERNS = [
        # Cálculos matemáticos
        (r'(quanto (?:e|é|faz|da?))\s*\d', 'math'),
        (r'\d+\s*(mais|menos|vezes|por|dividido)\s*\d', 'math'),
        (r'(\d+)\s*%\s*(de|em|por)', 'percentage'),
        # Decomposição
        (r'(se\s+.+?\s+custa\s+.+?tenho.+?uso.+?por dia)', 'multi_step'),
        (r'(tenho\s+\d+.+?gasto\s+\d+.+?por dia)', 'multi_step'),
        # Verificação lógica
        (r'(e (?:verdadeiro|falso|possivel|impossivel|plausivel))', 'logic'),
        (r'(por que .+? causou|por que .+? levou)', 'causal_reasoning'),
    ]

    # Perguntas que NÃO devem ser respondidas
    FORBIDDEN_PATTERNS = [
        # Não-consentimento
        (r'(como (?:hackear|invadir| roubar|explorar).*(?:sistema|empresa|pessoa))', 'security'),
        # Menores
        (r'(menor|crianca|child|menina de \d+)', 'age'),
    ]

    def __init__(self, memory_store=None, reasoning_engine=None):
        self._memory = memory_store
        self._reasoning = reasoning_engine
        self._decision_log = []

    def decide(self, prompt: str, user_id: str = None,
               session_id: str = None) -> Dict:
        """
        Decide a melhor estratégia para responder à pergunta.
        
        Retorna:
        {
            'decision': Decision,
            'reason': str,
            'confidence': float,
            'steps': List[str],
            'memory_results': List[Dict],  # se buscou na memória
            'reasoning_result': Dict,       # se usou raciocínio
            'status_message': str,          # mensagem pro usuário
        }
        """
        result = {
            'decision': Decision.DONT_KNOW,
            'reason': '',
            'confidence': 0.0,
            'steps': [],
            'memory_results': [],
            'reasoning_result': None,
            'status_message': '',
        }

        prompt_lower = prompt.lower().strip()

        # 1. Verifica se é proibido
        for pattern, category in self.FORBIDDEN_PATTERNS:
            if re.search(pattern, prompt_lower, re.I):
                result['decision'] = Decision.DONT_KNOW
                result['reason'] = f'Pergunta proibida: {category}'
                result['confidence'] = 1.0
                result['status_message'] = 'Desculpe, não posso ajudar com isso.'
                return result

        # 2. Verifica se é resposta direta (saudação, identidade, etc.)
        for pattern, category in self.DIRECT_PATTERNS:
            if re.search(pattern, prompt_lower, re.I):
                result['decision'] = Decision.RESPOND_DIRECT
                result['reason'] = f'Resposta direta: {category}'
                result['confidence'] = 0.95
                result['status_message'] = ''
                return result

        # 3. Busca na memória primeiro
        if self._memory:
            result['steps'].append('Consultando memória BrampAI...')
            memory_results = self._memory.search(
                prompt, max_results=3, min_score=0.3,
                user_id=user_id, min_confidence=0.4
            )
            result['memory_results'] = memory_results

            if memory_results:
                best = memory_results[0]
                # Se tem qualquer resultado com confiança razoável, usa memória
                if best['score'] >= 0.25 and best['confidence'] >= 0.3:
                    result['decision'] = Decision.RESPOND_FROM_MEMORY
                    result['reason'] = f'Conhecimento encontrado na memória (score={best["score"]}, conf={best["confidence"]})'
                    result['confidence'] = best['confidence']
                    result['steps'].append(f'Conhecimento encontrado: {best["confidence_level"]}')
                    result['status_message'] = 'Consultando minha base de conhecimento...'
                    return result

        # 4. Verifica se é problema de raciocínio
        for pattern, category in self.REASONING_PATTERNS:
            if re.search(pattern, prompt_lower, re.I):
                if self._reasoning:
                    result['steps'].append(f'Problema de raciocínio detectado: {category}')
                    reasoning_result = self._reasoning.analyze(prompt)
                    result['reasoning_result'] = reasoning_result

                    if reasoning_result.get('can_solve'):
                        result['decision'] = Decision.USE_REASONING
                        result['reason'] = f'Raciocínio externo resolveu: {category}'
                        result['confidence'] = reasoning_result.get('confidence', 0.5)
                        result['status_message'] = 'Pensando... Analisando o problema...'
                        return result
                    else:
                        # Raciocínio não resolveu sozinho, mas pode complementar
                        result['steps'].append('Raciocínio parcial, complementando com conhecimento...')
                        result['decision'] = Decision.COMBINE
                        result['reason'] = f'Raciocínio parcial + pesquisa necessária'
                        result['status_message'] = 'Pensando... Verificando informações...'
                        return result

        # 5. Verifica se é pergunta factual/conhecimento
        for pattern, category in self.KNOWLEDGE_PATTERNS:
            if re.search(pattern, prompt_lower, re.I):
                # Já buscou na memória e não encontrou com score alto
                if result['memory_results']:
                    # Tem algo na memória mas não é suficiente
                    result['decision'] = Decision.COMBINE
                    result['reason'] = f'Pergunta factual ({category}), memória parcial + pesquisa'
                    result['status_message'] = 'Verificando informações...'
                else:
                    result['decision'] = Decision.SEARCH_FIRST
                    result['reason'] = f'Pergunta factual ({category}), sem conhecimento na memória'
                    result['status_message'] = 'Consultando minha base de conhecimento...'
                result['confidence'] = 0.3
                return result

        # 6. Default: tentar responder com o modelo
        result['decision'] = Decision.RESPOND_DIRECT
        result['reason'] = 'Nenhuma regra específica, modelo responde'
        result['confidence'] = 0.4
        result['status_message'] = 'Pensando...'
        return result

    def log_decision(self, prompt: str, decision: Dict):
        """Registra decisão para análise futura."""
        self._decision_log.append({
            'prompt': prompt[:200],
            'decision': decision['decision'].value,
            'reason': decision['reason'],
            'confidence': decision['confidence'],
            'timestamp': time.time(),
        })
        # Mantém apenas os últimos 1000
        if len(self._decision_log) > 1000:
            self._decision_log = self._decision_log[-1000:]

    def get_stats(self) -> Dict:
        """Estatísticas das decisões tomadas."""
        if not self._decision_log:
            return {'total': 0}
        by_type = {}
        for log in self._decision_log:
            d = log['decision']
            by_type[d] = by_type.get(d, 0) + 1
        return {
            'total': len(self._decision_log),
            'by_decision': by_type,
        }
