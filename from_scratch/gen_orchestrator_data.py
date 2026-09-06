"""
Gera dataset de treino pro Orquestrador.
O orquestrador aprende a:
1. Classificar perguntas (conversação / raciocínio / conhecimento)
2. Decidir quais cérebros consultar
3. Sintetizar respostas de múltiplos cérebros

Formato de treino:
  Input: <s> P: {pergunta} <sep> ORC:
  Output: DECISÃO: brain_1,brain_2,brain_3 | RESPOSTA: {resposta_final}
"""
import random
import os

random.seed(42)

NOMES = ["Ana", "João", "Maria", "Pedro", "Lucia", "Carlos", "Julia", "Rafael",
         "Camila", "Bruno", "Fernanda", "Thiago", "Larissa", "Marcos", "Beatriz",
         "Leonardo", "Amanda", "Gabriel", "Isabela", "Felipe", "Valéria", "Jefferson",
         "Sabrina", "Elaine", "Patricia", "Renato", "Claudia", "Eduardo", "Mariana",
         "Roberto", "Tatiana", "André", "Vanessa", "Lucas", "Priscila"]

# ═══════════════════════════════════════════════════════════
# PADRÕES DE TREINO POR CATEGORIA
# ═══════════════════════════════════════════════════════════

def gen_conversation_examples():
    """Exemplos onde SÓ o Brain 1 (conversação) deve responder."""
    templates = [
        ("bom dia", "Oi! Bom dia! Como posso te ajudar hoje?"),
        ("boa tarde", "Boa tarde! Em que posso te ajudar?"),
        ("boa noite", "Boa noite! Como posso te ajudar?"),
        ("e ai", "E aí! Tudo certo? Manda a pergunta que eu tô aqui!"),
        ("como vai", "Tô bem, e você? Conta o que precisa!"),
        ("tudo bem", "Tudo bem sim! E você, tranquilo?"),
        ("obrigado", "De nada! Sempre às ordens!"),
        ("valeu", "Tranquilo! Qualquer coisa é só chamar!"),
        ("tchau", "Falou! Cuida de você!"),
        ("me conta uma piada", "Por que o programador usa óculos? Porque não consegue C#!"),
        ("piada", "Qual a differença entre um pato? O pato tem as duas patas igual!"),
        ("o que voce faz", "Sou uma IA que conversa, responde perguntas e ajuda no que precisar!"),
        ("quem é voce", "Sou o assistente da BranPy! IA própria, sem big tech!"),
        ("voce gosta de música", "Curto sim! Depende do humor — funk, rock, sertanejo!"),
        ("como ta o dia", "Tô ótimo! Pronto pra te ajudar!"),
        ("falou", "Falou! Tamo junto!"),
        ("beleza", "Beleza! Bora lá!"),
        ("show", "Show! Manda a pergunta!"),
        ("top", "Top mesmo! Como posso ajudar?"),
        ("suave", "Suave! Conta o que precisa!"),
        ("me conta sobre voce", "Sou IA 100% própria, criada pela BranPy. Converso, resolvo e ajudo!"),
        ("voce tem sentimentos", "Não tenho sentimentos de verdade, mas finjo que tenho pra conversa ficar boa!"),
        ("voce é real", "Sou real no que importa: nas respostas e na parceria!"),
    ]
    results = []
    for q, r in templates:
        results.append({
            "question": q,
            "decision": "brain_1",
            "reason": "conversação",
            "response": r,
        })
    return results


def gen_reasoning_examples():
    """Exemplos onde SÓ o Brain 2 (raciocínio) deve responder."""
    math_pairs = []
    for _ in range(100):
        tipo = random.choice(["soma", "sub", "mul", "div", "pct", "multi_step"])

        if tipo == "soma":
            a, b = random.randint(5, 500), random.randint(5, 500)
            q = f"quanto é {a} + {b}?"
            r = f"Resultado: {a + b}."
        elif tipo == "sub":
            a = random.randint(50, 500)
            b = random.randint(10, a)
            q = f"quanto é {a} - {b}?"
            r = f"Resultado: {a - b}."
        elif tipo == "mul":
            a, b = random.randint(2, 30), random.randint(2, 30)
            q = f"quanto é {a} × {b}?"
            r = f"Resultado: {a * b}."
        elif tipo == "div":
            b = random.randint(2, 15)
            res = random.randint(2, 20)
            a = b * res
            q = f"quanto é {a} ÷ {b}?"
            r = f"Resultado: {res}."
        elif tipo == "pct":
            base = random.choice([100, 200, 500, 1000])
            pct = random.choice([10, 15, 20, 25, 30, 50])
            res = base * pct // 100
            q = f"quanto é {pct}% de {base}?"
            r = f"Resultado: {res}."
        elif tipo == "multi_step":
            nome = random.choice(NOMES)
            a = random.randint(50, 200)
            b = random.randint(10, 50)
            c = random.randint(5, 30)
            total = a - b + c
            q = f"{nome} tem {a} reais, gasta {b} e depois ganha {c}. quanto {nome} tem?"
            r = f"Resultado: {total} reais."

        math_pairs.append({
            "question": q,
            "decision": "brain_2",
            "reason": "raciocínio matemático",
            "response": r,
        })

    logic_pairs = [
        ("se todos os A são B, e C é um A, C é B?", "Sim, C é B por dedução lógica."),
        ("se chove eu levo guarda-chuva. está chovendo. levo guarda-chuva?", "Sim, porque está chovendo."),
        ("Pedro é alto e tem 1,50m. isso é consistente?", "Inconsistente. 1,50m não é alto."),
        ("se eu corro todo dia e hoje não corri, eu corri hoje?", "Não. Se não correu hoje, não correu."),
        ("qual a probabilidade de cair cara em uma moeda?", "50%, porque moeda tem 2 lados igualmente prováveis."),
    ]
    for q, r in logic_pairs:
        math_pairs.append({
            "question": q,
            "decision": "brain_2",
            "reason": "raciocínio lógico",
            "response": r,
        })

    return math_pairs


def gen_knowledge_examples():
    """Exemplos onde SÓ o Brain 3 (conhecimento) deve responder."""
    knowledge = [
        ("o que é gravidade?", "A gravidade é a força que atrai objetos entre si."),
        ("o que é DNA?", "DNA é a molécula que carrega instruções genéticas da vida."),
        ("como funciona a fotossíntese?", "Plantas convertem luz solar em energia, absorvendo CO₂ e água."),
        ("o que é internet?", "Rede mundial de computadores interconectados para troca de informações."),
        ("o que é programação?", "Criar instruções que um computador pode executar."),
        ("o que é inteligência artificial?", "Capacidade de máquinas simularem inteligência humana."),
        ("quem descobriu o Brasil?", "Pedro Álvares Cabral em 22 de abril de 1500."),
        ("qual a capital do Brasil?", "Brasília, inaugurada em 21 de abril de 1960."),
        ("o que foi a independência do Brasil?", "Proclamada em 7 de setembro de 1822 por Dom Pedro I."),
        ("quantos estados tem o Brasil?", "26 estados mais o Distrito Federal."),
        ("o que é porcentagem?", "Fração expressa como parte de 100."),
        ("o que é geometria?", "Ramo da matemática que estuda formas e propriedades do espaço."),
        ("o que é blockchain?", "Registro distribuído de transações seguro e transparente."),
        ("o que é Python?", "Linguagem de programação de alto nível, simples e versátil."),
        ("o que é Git?", "Sistema de controle de versões distribuído."),
        ("o que é Docker?", "Plataforma de virtualização de contêineres."),
        ("o que é Linux?", "Sistema operacional aberto e gratuito."),
        ("o que é criptografia?", "Prática de codificar informações para protegê-las."),
        ("o que é machine learning?", "Computadores aprendem a partir de dados sem programação explícita."),
        ("o que é rede neural?", "Modelo computacional inspirado no cérebro humano."),
        ("o que é ética?", "Ram da filosofia que estuda certo e errado."),
        ("o que é democracia?", "Sistema onde o poder emana do povo através de eleições."),
        ("o que é sistema imunológico?", "Conjunto de células que protegem o corpo contra doenças."),
        ("o que é vírus?", "Microrganismo que só se reproduz dentro de células vivas."),
        ("o que é vacina?", "Tratamento que estimula defesas contra doenças específicas."),
        ("como funciona o coração?", "Bomba de 4 câmaras que mantém a circulação sanguínea."),
        ("o que é energia?", "Capacidade de realizar trabalho. Pode ser cinética, potencial, térmica."),
        ("o que é clima?", "Padrão de temperatura e condições atmosféricas ao longo do tempo."),
        ("o que é filosofia?", "Estudo de questões fundamentais sobre existência e conhecimento."),
        ("o que é Átomo?", "Menor unidade da matéria, composto por núcleo e elétrons."),
    ]
    results = []
    for q, r in knowledge:
        results.append({
            "question": q,
            "decision": "brain_3",
            "reason": "conhecimento",
            "response": r,
        })
    return results


def gen_multi_brain_examples():
    """Exemplos onde MÚLTIPLOS cérebros devem trabalhar juntos."""
    examples = [
        # Brain 2 + Brain 3
        {
            "question": "por que o céu é azul?",
            "decision": "brain_3,brain_2",
            "reason": "conhecimento + raciocínio causal",
            "response": "O céu é azul porque a luz do Sol é espalhada pelas moléculas da atmosfera (conhecimento). A luz azul tem comprimento de onda curto e é espalhada mais que as outras cores, fazendo o céu parecer azul (raciocínio).",
        },
        {
            "question": "se eu tenho 200 reais e compro 3 livros de 35 cada, quanto sobra?",
            "decision": "brain_2",
            "reason": "raciocínio matemático com contexto",
            "response": "3 livros × 35 = 105 reais. 200 - 105 = 95 reais sobrando.",
        },
        {
            "question": "me explica o que é inflação",
            "decision": "brain_3,brain_1",
            "reason": "conhecimento + explicação conversacional",
            "response": "Inflação é quando os preços sobem e o dinheiro perde valor (conhecimento). Basicamente, com menos coisa pelo mesmo preço. É como se tivesse menos grana no bolso (conversação natural).",
        },
        {
            "question": "calcula 15% de 800 e me explica o que é porcentagem",
            "decision": "brain_2,brain_3",
            "reason": "raciocínio + conhecimento",
            "response": "15% de 800 = 800 × 0,15 = 120 (raciocínio). Porcentagem é uma forma de expressar uma fração como parte de 100 (conhecimento).",
        },
        {
            "question": "qual a capital da França e quanto tempo de avião do Brasil?",
            "decision": "brain_3,brain_2",
            "reason": "conhecimento + estimativa",
            "response": "A capital da França é Paris (conhecimento). De São Paulo a Paris são aproximadamente 12-14 horas de voo direto, uns 9.000 km (estimativa de raciocínio).",
        },
        {
            "question": "o que é Python e qual a diferença pra JavaScript?",
            "decision": "brain_3",
            "reason": "conhecimento comparativo",
            "response": "Python é linguagem de alto nível para dados, IA e automação. JavaScript é a linguagem da web para sites interativos. Python é mais simples; JavaScript roda no navegador.",
        },
        {
            "question": "por que dormimos e quanto tempo devemos dormir?",
            "decision": "brain_3,brain_2",
            "reason": "conhecimento + raciocínio",
            "response": "Dormimos para o corpo reparar tecidos e o cérebro consolidar memórias (conhecimento). Adultos devem dormir 7-9 horas por noite (raciocínio baseado em evidências).",
        },
        {
            "question": "se a luz do sol leva 8 minutos pra chegar na terra, pq é instantâneo?",
            "decision": "brain_2,brain_3",
            "reason": "raciocínio + conhecimento",
            "response": "A luz NÃO é instantânea — leva 8 minutos e 20 segundos (raciocínio). Mas parece instantâneo porque a velocidade da luz é 300.000 km/s, muito rápida pra distâncias terrestres (conhecimento).",
        },
    ]

    # Gera variações
    all_multi = []
    for ex in examples:
        all_multi.append(ex)
        # Varia a pergunta levemente
        nome = random.choice(NOMES)
        varied = ex["question"].replace("eu", f"{nome}")
        all_multi.append({
            "question": varied,
            "decision": ex["decision"],
            "reason": ex["reason"],
            "response": ex["response"],
        })

    return all_multi


def gen_conflict_examples():
    """Exemplos onde o orquestrador precisa escolher a MELHOR resposta."""
    examples = [
        # Brain 1 responde bem mas Brain 2 é mais preciso
        {
            "question": "quanto é 7 × 8?",
            "decision": "brain_2",
            "reason": "Brain 2 é mais preciso em matemática",
            "brain_1_response": "É um número maior que 50, acho que 54!",
            "brain_2_response": "7 × 8 = 56.",
            "best_response": "56.",
            "winner": "brain_2",
        },
        # Brain 3 sabe mais que Brain 1
        {
            "question": "o que é buraco negro?",
            "decision": "brain_3",
            "reason": "Brain 3 tem conhecimento especializado",
            "brain_1_response": "É tipo um buraco no espaço que suga tudo!",
            "brain_2_response": "Buraco negro é onde gravidade é tão forte que nada escapa.",
            "brain_3_response": "Buraco negro é uma região do espaço-time onde a gravidade é tão intensa que nem a luz escapa. Forma-se quando estrelas massivas colapsam.",
            "best_response": "Buraco negro é uma região do espaço-time onde a gravidade é tão intensa que nem a luz escapa. Forma-se quando estrelas massivas colapsam.",
            "winner": "brain_3",
        },
    ]
    return examples


# ═══════════════════════════════════════════════════════════
# GERAÇÃO DO DATASET
# ═══════════════════════════════════════════════════════════

def main():
    all_examples = []

    # Adiciona cada categoria
    conv = gen_conversation_examples()
    reasoning = gen_reasoning_examples()
    knowledge = gen_knowledge_examples()
    multi = gen_multi_brain_examples()
    conflict = gen_conflict_examples()

    all_examples.extend(conv)
    all_examples.extend(reasoning)
    all_examples.extend(knowledge)
    all_examples.extend(multi)
    # Converte conflitos pro formato padrão
    for ex in conflict:
        all_examples.append({
            "question": ex["question"],
            "decision": ex["decision"],
            "reason": ex["reason"],
            "response": ex["best_response"],
        })

    # Embaralha
    random.shuffle(all_examples)

    # Formata pro treino do orquestrador
    # Input: P: {pergunta}
    # Output: DECISÃO: {cérebros} | RESPOSTA: {resposta}
    output_path = os.path.join(os.path.dirname(__file__), "data", "orchestrator_training.txt")
    with open(output_path, 'w', encoding='utf-8') as f:
        for ex in all_examples:
            question = ex["question"]
            decision = ex["decision"]
            response = ex["response"]
            # Formato de treino
            f.write(f"P: {question}\n")
            f.write(f"DECISAO: {decision}\n")
            f.write(f"RESPOSTA: {response}\n\n")

    print(f"Dataset Orquestrador gerado: {output_path}")
    print(f"Total de exemplos: {len(all_examples)}")
    print(f"  Conversação: {len(conv)}")
    print(f"  Raciocínio: {len(reasoning)}")
    print(f"  Conhecimento: {len(knowledge)}")
    print(f"  Multi-cérebro: {len(multi)}")
    print(f"  Conflito: {len(conflict)}")
    print(f"Tamanho: {os.path.getsize(output_path) / 1024:.1f} KB")


if __name__ == "__main__":
    main()
