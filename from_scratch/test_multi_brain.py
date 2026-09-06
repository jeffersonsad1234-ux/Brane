"""
Teste Comparativo — 1 Cérebro vs 3 Cérebros
============================================
Compara Brain 1 (conversação) sozinho vs Brain 1+2+3 com orquestrador.
"""

import sys
import os
import time
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from brain_manager import get_brain_manager
from multi_brain_orchestrator import get_multi_brain_orchestrator


# ====================================================================
# PERGUNTAS DE TESTE
# ====================================================================

TEST_QUESTIONS = [
    # Conversação (Brain 1 deveria ser bom)
    ("bom dia, como vai você?", "conversacao"),
    ("me conta uma piada", "conversacao"),
    ("obrigado pela ajuda", "conversacao"),

    # Raciocínio (Brain 2 deveria ser melhor)
    ("quanto é 15 + 27?", "raciocinio"),
    ("se eu tenho 100 reais e gasto 27, depois ganho 15, quanto tenho?", "raciocinio"),
    ("qual é a raiz quadrada de 144?", "raciocinio"),
    ("Maria tem 3 vezes mais livros que Pedro. Pedro tem 5. Quantos livros Maria tem?", "raciocinio"),

    # Conhecimento (Brain 3 deveria ser melhor)
    ("o que é gravidade?", "conhecimento"),
    ("como funciona o corpo humano?", "conhecimento"),
    ("quem descobriu o Brasil?", "conhecimento"),
    ("o que é inteligência artificial?", "conhecimento"),

    # Misto (todos deveriam contribuir)
    ("por que o céu é azul? explique com raciocínio", "misto"),
    ("calcula 20% de 500 e explica o que é porcentagem", "misto"),
]


def run_comparison():
    """Executa comparação completa."""
    print("=" * 70)
    print("TESTE COMPARATIVO — 1 CÉREBRO vs 3 CÉREBROS")
    print("=" * 70)

    manager = get_brain_manager()
    orchestrator = get_multi_brain_orchestrator()

    # Lista cérebros disponíveis
    brains = manager.list_brains()
    print(f"\nCérebros disponíveis: {len(brains)}")
    for b in brains:
        status = "CARREGADO" if b['loaded'] else "DESCARREGADO"
        print(f"  - {b['brain_id']}: {b['specialty']} ({status})")

    if not brains:
        print("\nERRO: Nenhum cérebro encontrado!")
        return

    # Carrega Brain 1 (conversação)
    brain1_id = None
    for b in brains:
        if "conversation" in b['brain_id']:
            brain1_id = b['brain_id']
            break

    if not brain1_id:
        print("\nERRO: Brain 1 (conversação) não encontrado!")
        return

    print(f"\nCarregando Brain 1: {brain1_id}")
    manager.load_brain(brain1_id)
    brain1_params = manager.brains[brain1_id].params
    print(f"  Params: {brain1_params/1e6:.2f}M")

    # Carrega todos os cérebros disponíveis
    all_brain_ids = []
    for b in brains:
        manager.load_brain(b['brain_id'])
        all_brain_ids.append(b['brain_id'])
        print(f"  Carregado {b['brain_id']}: {manager.brains[b['brain_id']].params/1e6:.2f}M params")

    # Roda testes
    results = []
    for question, expected_type in TEST_QUESTIONS:
        print(f"\n{'-' * 70}")
        print(f"PERGUNTA: {question}")
        print(f"TIPO ESPERADO: {expected_type}")

        # Teste A: Brain 1 sozinho
        print(f"\n  [A] Brain 1 sozinho:")
        start = time.time()
        response_a = manager.generate(brain1_id, question, max_new_tokens=200)
        time_a = time.time() - start
        print(f"      Tempo: {time_a:.2f}s")
        print(f"      Resposta: {response_a[:150]}{'...' if len(response_a) > 150 else ''}")

        # Teste B: 3 cérebros + orquestrador
        print(f"\n  [B] 3 cérebros + orquestrador:")
        start = time.time()
        result_b = orchestrator.process(question)
        time_b = result_b.total_time
        print(f"      Tempo: {time_b:.2f}s")
        print(f"      Cérebros usados: {result_b.brains_used}")
        print(f"      Resposta: {result_b.response[:150]}{'...' if len(result_b.response) > 150 else ''}")

        # Respostas individuais
        for resp in result_b.individual_responses:
            print(f"      [{resp.brain_id}]: {resp.response[:80]}{'...' if len(resp.response) > 80 else ''}")

        results.append({
            "question": question,
            "expected_type": expected_type,
            "brain1_response": response_a,
            "brain1_time": time_a,
            "multi_response": result_b.response,
            "multi_time": time_b,
            "brains_used": result_b.brains_used,
        })

    # Salva resultados
    output_path = os.path.join(os.path.dirname(__file__), "test_results_multi_brain.json")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n{'=' * 70}")
    print(f"RESULTADOS SALVOS: {output_path}")
    print(f"{'=' * 70}")

    # Resumo
    print(f"\nRESUMO:")
    print(f"  Total de testes: {len(results)}")
    avg_time_a = sum(r['brain1_time'] for r in results) / len(results)
    avg_time_b = sum(r['multi_time'] for r in results) / len(results)
    print(f"  Tempo médio Brain 1: {avg_time_a:.2f}s")
    print(f"  Tempo médio Multi: {avg_time_b:.2f}s")

    # Descarrega cérebros
    for b in brains:
        manager.unload_brain(b['brain_id'])


if __name__ == "__main__":
    run_comparison()
