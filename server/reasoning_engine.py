"""
BrampAI Reasoning Engine — Raciocínio Externo ao Modelo
=======================================================
Decomposição de problemas, cálculos matemáticos, lógica,
e verificação de resultados SEM depender do modelo de linguagem.

O modelo continua responsável por:
- Compreender a pergunta do usuário
- Comunicar a resposta final

O engine é responsável por:
- Identificar informações numéricas
- Decompor problemas multi-etapa
- Executar cálculos
- Verificar resultados
- Detectar quando NÃO é possível resolver
"""

import re
import math
import operator
from typing import Optional, List, Dict, Tuple, Any


# Operadores matemáticos
OPS = {
    '+': operator.add,
    '-': operator.sub,
    '*': operator.mul,
    '/': operator.truediv,
    '//': operator.floordiv,
    '**': operator.pow,
    '%': operator.mod,
}


class MathExtractor:
    """Extrai e resolve expressões matemáticas de texto."""

    # Padrões para detectar números e operações
    NUM_PATTERN = re.compile(
        r'(\d+(?:[.,]\d+)?)\s*'
        r'(?:\s*(mais|menos|vezes|por|dividido|elevado|potencia|soma|subtrai|multiplica|divide)\s*'
        r'(\d+(?:[.,]\d+)?))*',
        re.IGNORECASE
    )

    # Padrões mais específicos
    EXPRESSION_PATTERNS = [
        # "quanto é 3 + 5"
        re.compile(r'quanto\s+(?:e|é|faz|da?)\s*(\d+(?:[.,]\d+)?)\s*([+\-*/xX×÷])\s*(\d+(?:[.,]\d+)?)', re.I),
        # "3 mais 5"
        re.compile(r'(\d+(?:[.,]\d+)?)\s+(?:mais|soma)\s+(\d+(?:[.,]\d+)?)', re.I),
        # "3 menos 5"
        re.compile(r'(\d+(?:[.,]\d+)?)\s+(?:menos|subtrai|tira)\s+(\d+(?:[.,]\d+)?)', re.I),
        # "3 vezes 5"
        re.compile(r'(\d+(?:[.,]\d+)?)\s+(?:vezes|x|multiplica(?:r)?)\s+(\d+(?:[.,]\d+)?)', re.I),
        # "15 dividido por 3"
        re.compile(r'(\d+(?:[.,]\d+)?)\s+dividido\s+(?:por|entre)\s+(\d+(?:[.,]\d+)?)', re.I),
        # "15 por 3" (divisão)
        re.compile(r'(\d+(?:[.,]\d+)?)\s+por\s+(\d+(?:[.,]\d+)?)\s*$', re.I),
        # "10% de 200"
        re.compile(r'(\d+(?:[.,]\d+)?)\s*%\s+de\s+(\d+(?:[.,]\d+)?)', re.I),
        # "quanto é 10% de 200"
        re.compile(r'quanto\s+(?:e|é)\s+(\d+(?:[.,]\d+)?)\s*%\s+de\s+(\d+(?:[.,]\d+)?)', re.I),
    ]

    # Padrões de decomposição de problemas
    PROBLEM_PATTERNS = [
        # "se algo custa X, tenho Y e utilizo Z por dia, quanto gasto em N dias?"
        re.compile(
            r'se?\s+(.+?)\s+custa\s+(\d+(?:[.,]\d+)?)\s*,?\s*'
            r'(?:eu\s+)?(?:tenho|compro|compro|uso|utilizo)\s+(\d+(?:[.,]\d+)?)\s*,?\s*'
            r'(?:e\s+)?(?:utilizo|uso|gasto)\s+(\d+(?:[.,]\d+)?)\s+por\s+dia',
            re.I
        ),
        # "tenho X, gasto Y por dia, quanto sobra em Z dias?"
        re.compile(
            r'(?:eu\s+)?(?:tenho|possuo)\s+(\d+(?:[.,]\d+)?)\s*,?\s*'
            r'(?:gasto|uso|utilizo)\s+(\d+(?:[.,]\d+)?)\s+por\s+dia',
            re.I
        ),
    ]

    @classmethod
    def extract_numbers(cls, text: str) -> List[float]:
        """Extrai todos os números do texto."""
        numbers = []
        for match in re.finditer(r'\d+(?:[.,]\d+)?', text):
            num_str = match.group().replace(',', '.')
            try:
                numbers.append(float(num_str))
            except ValueError:
                pass
        return numbers

    @classmethod
    def try_evaluate(cls, text: str) -> Optional[Dict]:
        """
        Tenta extrair e resolver uma expressão matemática do texto.
        Retorna None se não encontrar expressão matemática.
        """
        # Tenta cada padrão de expressão
        for i, pattern in enumerate(cls.EXPRESSION_PATTERNS):
            match = pattern.search(text)
            if match:
                groups = match.groups()
                try:
                    if i == 0:  # "quanto é X op Y"
                        a, op, b = groups
                        a, b = float(a.replace(',', '.')), float(b.replace(',', '.'))
                        op_map = {'+': '+', '-': '-', '*': '*', 'x': '*', 'X': '*',
                                  '×': '*', '/': '/', '÷': '/'}
                        op = op_map.get(op, op)
                        if op in ('/', '÷') and b == 0:
                            return {
                                'found': True,
                                'expression': f"{a} / {b}",
                                'result': None,
                                'steps': [f"Divisão por zero: {a} / {b} é impossível"],
                                'type': 'math_error',
                                'confidence': 1.0,
                            }
                        result = OPS[op](a, b)
                        return {
                            'found': True,
                            'expression': f"{a} {op} {b}",
                            'result': result,
                            'steps': [f"{a} {op} {b} = {result}"],
                            'type': 'simple_math',
                            'confidence': 0.95,
                        }

                    elif i == 1:  # "X mais Y"
                        a, b = float(groups[0].replace(',', '.')), float(groups[1].replace(',', '.'))
                        result = a + b
                        return {
                            'found': True,
                            'expression': f"{a} + {b}",
                            'result': result,
                            'steps': [f"{a} + {b} = {result}"],
                            'type': 'simple_math',
                            'confidence': 0.95,
                        }

                    elif i == 2:  # "X menos Y"
                        a, b = float(groups[0].replace(',', '.')), float(groups[1].replace(',', '.'))
                        result = a - b
                        return {
                            'found': True,
                            'expression': f"{a} - {b}",
                            'result': result,
                            'steps': [f"{a} - {b} = {result}"],
                            'type': 'simple_math',
                            'confidence': 0.95,
                        }

                    elif i == 3:  # "X vezes Y"
                        a, b = float(groups[0].replace(',', '.')), float(groups[1].replace(',', '.'))
                        result = a * b
                        return {
                            'found': True,
                            'expression': f"{a} x {b}",
                            'result': result,
                            'steps': [f"{a} x {b} = {result}"],
                            'type': 'simple_math',
                            'confidence': 0.95,
                        }

                    elif i == 4:  # "X dividido por Y"
                        a, b = float(groups[0].replace(',', '.')), float(groups[1].replace(',', '.'))
                        if b == 0:
                            return {
                                'found': True,
                                'expression': f"{a} / {b}",
                                'result': None,
                                'steps': ['Divisão por zero é impossível.'],
                                'type': 'error',
                                'confidence': 1.0,
                            }
                        result = a / b
                        return {
                            'found': True,
                            'expression': f"{a} / {b}",
                            'result': result,
                            'steps': [f"{a} / {b} = {result}"],
                            'type': 'simple_math',
                            'confidence': 0.95,
                        }

                    elif i == 5:  # "X por Y" (divisão)
                        a, b = float(groups[0].replace(',', '.')), float(groups[1].replace(',', '.'))
                        if b == 0:
                            return {'found': True, 'result': None, 'steps': ['Divisão por zero.'],
                                    'type': 'error', 'confidence': 1.0}
                        result = a / b
                        return {
                            'found': True,
                            'expression': f"{a} / {b}",
                            'result': result,
                            'steps': [f"{a} / {b} = {result}"],
                            'type': 'simple_math',
                            'confidence': 0.90,
                        }

                    elif i in (6, 7):  # "X% de Y"
                        pct, total = float(groups[0].replace(',', '.')), float(groups[1].replace(',', '.'))
                        result = (pct / 100) * total
                        return {
                            'found': True,
                            'expression': f"{pct}% de {total}",
                            'result': result,
                            'steps': [f"{pct}% de {total} = ({pct}/100) x {total} = {result}"],
                            'type': 'percentage',
                            'confidence': 0.95,
                        }

                except (ValueError, ZeroDivisionError, KeyError):
                    continue

        # Tenta avaliar expressão numérica direta (ex: "2+3*4")
        expr_match = re.match(r'^[\d\s+\-*/().]+$', text.strip())
        if expr_match:
            try:
                result = eval(text.strip(), {"__builtins__": {}}, {"math": math})
                return {
                    'found': True,
                    'expression': text.strip(),
                    'result': result,
                    'steps': [f"{text.strip()} = {result}"],
                    'type': 'expression',
                    'confidence': 0.90,
                }
            except Exception:
                pass

        return None


class Decomposer:
    """Decompose problemas complexos em etapas."""

    @classmethod
    def try_decompose(cls, text: str) -> Optional[Dict]:
        """
        Tenta decompor um problema multi-etapa.
        Ex: "se custa 5, tenho 10 e uso 2 por dia, quanto gasto em 30 dias?"
        """
        # Padrão: custo_unitario, quantidade, uso_por_dia
        pattern1 = re.compile(
            r'(?:custa|preço|valor)\s+(\d+(?:[.,]\d+)?)\s*,?\s*'
            r'(?:tenho|compro|uso)\s+(\d+(?:[.,]\d+)?)\s*,?\s*'
            r'(?:uso|utilizo|gasto)\s+(\d+(?:[.,]\d+)?)\s+por\s+dia',
            re.I
        )
        match = pattern1.search(text)
        if match:
            custo, qtd, uso_dia = [float(g.replace(',', '.')) for g in match.groups()]
            total_gasto = qtd * custo
            gasto_diario = uso_dia * custo
            dias = total_gasto / gasto_diario if gasto_diario > 0 else float('inf')
            return {
                'found': True,
                'type': 'multi_step',
                'steps': [
                    f"Custo unitário: {custo}",
                    f"Quantidade: {qtd}",
                    f"Uso por dia: {uso_dia}",
                    f"Total investido: {custo} x {qtd} = {total_gasto}",
                    f"Gasto diário: {uso_dia} x {custo} = {gasto_diario}",
                    f"Duração: {total_gasto} / {gasto_diario} = {dias:.1f} dias",
                ],
                'result': f"Duração: {dias:.1f} dias",
                'confidence': 0.90,
            }

        # Padrão: total, gasto_por_dia
        pattern2 = re.compile(
            r'(?:tenho|possuo|total)\s+(\d+(?:[.,]\d+)?)\s*,?\s*'
            r'(?:gasto|uso|utilizo)\s+(\d+(?:[.,]\d+)?)\s+por\s+dia',
            re.I
        )
        match = pattern2.search(text)
        if match:
            total, gasto_dia = [float(g.replace(',', '.')) for g in match.groups()]
            dias = total / gasto_dia if gasto_dia > 0 else float('inf')
            sobra = total - (gasto_dia * int(dias))
            return {
                'found': True,
                'type': 'multi_step',
                'steps': [
                    f"Total: {total}",
                    f"Gasto por dia: {gasto_dia}",
                    f"Dias possíveis: {total} / {gasto_dia} = {dias:.1f}",
                    f"Sobra: {total} - ({gasto_dia} x {int(dias)}) = {sobra}",
                ],
                'result': f"Duração: {dias:.1f} dias, sobra: {sobra}",
                'confidence': 0.90,
            }

        # Padrão mais amplo: "X por dia" sem "tenho"
        pattern3 = re.compile(
            r'(\d+(?:[.,]\d+)?)\s+por\s+dia',
            re.I
        )
        match = pattern3.search(text)
        if match:
            uso_dia = float(match.group(1).replace(',', '.'))
            # Tenta encontrar um total no texto
            nums = MathExtractor.extract_numbers(text)
            if len(nums) >= 2:
                total = max(nums)
                if total > uso_dia:
                    dias = total / uso_dia
                    return {
                        'found': True,
                        'type': 'multi_step',
                        'steps': [
                            f"Valor por dia: {uso_dia}",
                            f"Total encontrado: {total}",
                            f"Duração estimada: {total} / {uso_dia} = {dias:.1f} dias",
                        ],
                        'result': f"Duração estimada: {dias:.1f} dias",
                        'confidence': 0.70,
                    }

        return None


class LogicChecker:
    """Verificação lógica básica de afirmações."""

    @classmethod
    def check_contradiction(cls, statement1: str, statement2: str) -> Dict:
        """
        Verifica se duas afirmações se contradizem.
        Baseado em detecção simples de negação e quantidades opostas.
        """
        s1 = statement1.lower().strip()
        s2 = statement2.lower().strip()

        # Detecta negação oposta
        negations = ['não', 'nao', 'jamais', 'nunca', 'never']
        has_neg1 = any(neg in s1 for neg in negations)
        has_neg2 = any(neg in s2 for neg in negations)

        # Remove negações para comparar
        s1_clean = s1
        s2_clean = s2
        for n in negations:
            s1_clean = s1_clean.replace(n, '')
            s2_clean = s2_clean.replace(n, '')

        # Tokeniza e compara
        t1 = set(s1_clean.split())
        t2 = set(s2_clean.split())
        overlap = t1 & t2

        if overlap and has_neg1 != has_neg2:
            return {
                'contradiction': True,
                'detail': f"Afirmações têm sobreposição '{overlap}' mas uma nega e outra afirma",
                'confidence': 0.7,
            }

        return {'contradiction': False, 'confidence': 0.5}

    @classmethod
    def verify_causal(cls, cause: str, effect: str) -> Dict:
        """
        Verifica se uma relação causal é plausível.
        Baseado em heurísticas simples.
        """
        cause_l = cause.lower()
        effect_l = effect.lower()

        causal_pairs = [
            ('chuva', 'rio subiu'),
            ('sol', 'calor'),
            ('frio', 'gelo'),
            ('fogo', 'calor'),
            ('choveu', 'alagou'),
            ('choveu', 'rio subiu'),
            ('terremoto', 'destruição'),
            ('vento', 'árvore caiu'),
        ]

        for c, e in causal_pairs:
            if c in cause_l and e in effect_l:
                return {
                    'plausible': True,
                    'detail': f"'{c}' pode causar '{e}' - relação causal plausível",
                    'confidence': 0.8,
                }

        return {
            'plausible': None,
            'detail': 'Não foi possível verificar a relação causal com heurísticas disponíveis',
            'confidence': 0.3,
        }


class ReasoningEngine:
    """
    Motor de raciocínio externo da BrampAI.
    Combina extração matemática, decomposição e verificação lógica.
    """

    def __init__(self):
        self.math = MathExtractor()
        self.decomposer = Decomposer()
        self.logic = LogicChecker()

    def analyze(self, prompt: str) -> Dict:
        """
        Analisa a pergunta e tenta resolver externamente.
        Retorna dict com:
        - can_solve: se o engine pode resolver
        - result: resultado encontrado
        - steps: etapas do raciocínio
        - type: tipo de problema (math, multi_step, logic, etc.)
        - confidence: confiança na resposta
        - needs_model: se o modelo deve complementar a resposta
        """
        result = {
            'can_solve': False,
            'result': None,
            'steps': [],
            'type': None,
            'confidence': 0.0,
            'needs_model': True,
            'status': 'analyzing',
        }

        # 1. Tenta resolver como matemática simples
        math_result = self.math.try_evaluate(prompt)
        if math_result and math_result.get('found'):
            result['can_solve'] = True
            result['result'] = math_result['result']
            result['steps'] = math_result['steps']
            result['type'] = math_result['type']
            result['confidence'] = math_result['confidence']
            result['needs_model'] = False
            result['status'] = 'solved_math'
            return result

        # 2. Tenta decompor como problema multi-etapa
        decomposed = self.decomposer.try_decompose(prompt)
        if decomposed and decomposed.get('found'):
            result['can_solve'] = True
            result['result'] = decomposed['result']
            result['steps'] = decomposed['steps']
            result['type'] = decomposed['type']
            result['confidence'] = decomposed['confidence']
            result['needs_model'] = False
            result['status'] = 'solved_decomposed'
            return result

        # 3. Detecta se é pergunta causal
        causal_match = re.search(r'por\s+que\s+(.+?)(?:\?|$)', prompt, re.I)
        if causal_match:
            result['type'] = 'causal'
            result['status'] = 'needs_knowledge'
            result['confidence'] = 0.0
            return result

        # 4. Detecta se é comparação
        comparison_match = re.search(
            r'(?:quem|qual)\s+(?:e\s+)?(?:mais|menor|maior|melhor|pior)\s+(.+?)(?:\?|$)',
            prompt, re.I
        )
        if comparison_match:
            result['type'] = 'comparison'
            result['status'] = 'needs_knowledge'
            return result

        # 5. Não conseguiu resolver externamente
        result['status'] = 'needs_model'
        return result

    def format_steps(self, steps: List[str]) -> str:
        """Formata etapas do raciocínio para exibição."""
        if not steps:
            return ''
        lines = []
        for i, step in enumerate(steps, 1):
            lines.append(f"  {i}. {step}")
        return '\n'.join(lines)
