"""
Dataset de Improvisação pro Orquestrador.
Exemplos onde os cérebros NÃO SABEM e o orquestrador precisa:
1. Combinar parcial knowledge
2. Usar analogia
3. Admitir que não sabe
4. Gerar resposta própria
"""
import random
import os

random.seed(42)

all = []

def add(question, decision, response, strategy):
    all.append({"q": question, "d": decision, "r": response, "s": strategy})

# ═══════════════════════════════════════════════════════════
# ESTRATÉGIA 1: COMBINAÇÃO (brain_3 + brain_2 + brain_1)
# ═══════════════════════════════════════════════════════════

combine = [
    ("qual o sentido da vida",
     "brain_3,brain_1",
     "Filosofia diz que cada um cria seu sentido. Ciência diz que somos resultado de evolução. Minha visão: o sentido é aprender, conexar e ajudar."),

    ("o que acontece depois da morte",
     "brain_3,brain_1",
     "A ciência diz que a consciência para. Religiões dizem que há vida após a morte. Eu não sei a resposta definitiva, mas sei que viver bem agora é o que importa."),

    ("existe destino ou livre arbítrio",
     "brain_3,brain_1",
     "Física sugere que tudo é determinado por leis. Filosofia debate há milênios. A verdade: provavelmente temos mais controle do que parece, mas não total."),

    ("por que existimos",
     "brain_3,brain_1",
     "Biologicamente: porque células se replicam. Filosoficamente: essa é a grande pergunta da humanidade. Não tenho resposta definitiva, mas posso ajudar a encontrar a sua."),

    ("o que é consciência",
     "brain_3,brain_2",
     "Neurociência diz que é atividade cerebral. Filosofia diz que é experiência subjetiva. Ainda não sabemos ao certo. É um dos maiores mistérios da ciência."),

    ("a realidade é real",
     "brain_3,brain_1",
     "Filósofos debatem isso há séculos. A hipótese da simulação é uma possibilidade. Mas pragmaticamente, vivemos como se fosse real, e isso é suficiente."),

    ("o que é amor",
     "brain_3,brain_1",
     "Biologicamente: cocktail de hormônios (oxitocina, dopamina). Filosoficamente: conexão profunda com outro ser. Os dois estão certos. Amor é química + significado."),

    ("por que sofremos",
     "brain_3,brain_1",
     "Biologicamente: o cérebro sinaliza perigo. Filosoficamente: sofrimento ensina e faz crescer. Budismo diz que sofrimento vem de apego. Todas as perspectivas têm valor."),

    ("qual a diferença entre inteligência e sabedoria",
     "brain_3,brain_1",
     "Inteligência é processar informação rápido. Sabedoria é saber o que importar. Uma pessoa inteligente resolve problemas; uma sábia sabe quais problemas vale a pena resolver."),

    ("o universo tem propósito",
     "brain_3,brain_2",
     "A física diz que o universo segue leis sem propósito. Mas nós, como seres conscientes, criamos propósito. O universo não tem significado — nós damos significado a ele."),
]

for q, d, r in combine:
    add(q, d, r, "combination")

# ═══════════════════════════════════════════════════════════
# ESTRATÉGIA 2: ANALOGIA
# ═══════════════════════════════════════════════════════════

analogy = [
    ("como explicar inteligência artificial pra uma criança",
     "brain_3,brain_1",
     "É como um papagaio muito esperto! Ele aprende palavras observando as pessoas falando. Quanto mais ouve, mais aprende a responder. Mas não pensa como gente — só imita bem."),

    ("como funciona blockchain pra quem não entende de tecnologia",
     "brain_3,brain_1",
     "Imagine um caderno que todo mundo pode escrever, mas ninguém pode apagar. Cada página é selada com um lacre único. É assim que blockchain funciona: um registro público e imutável."),

    ("expllica gravidade como se eu tivesse 5 anos",
     "brain_3,brain_1",
     "A Terra é tipo um ímã gigante que puxa tudo pra perto dela. Por isso você não voa pro espaço! É a Terra te segurando."),

    ("como explicar programação pra leigo",
     "brain_3,brain_1",
     "É como dar receita de bolo pro computador: primeiro os ovos, depois a farinha, mistura, assa. Se você pular uma etapa ou errar uma medida, o bolo fica ruim. Programação é isso: receitas exatas pra máquinas."),

    ("o que é machine learning como se fosse uma receita",
     "brain_3,brain_1",
     "É como aprender a cozinhar errando. Na primeira vez, fica horrível. Na segunda, menos. Na décima, já sabe. O computador é assim: erra, ajusta, melhora. Ninguém ensina a receita — ele aprende sozinho errando."),

    ("como explicar democracia pra uma criança",
     "brain_3,brain_1",
     "Imagina que a turma da escola escolhe o monitor. Todo mundo vota, o mais votado vira monitor. É assim que funciona a democracia: o povo escolhe quem manda."),

    ("o que é economia como se fosse uma história",
     "brain_3,brain_1",
     "É como uma feira: quem tem fruta troca por pão. Se a fruta acaba, o pão fica caro. Se tem muita fruta, o pão fica barato. Economia é isso: troca de coisas e quanto elas valem."),

    ("explica o que é DNA como se fosse um livro",
     "brain_3,brain_1",
     "DNA é como uma receita secreta guardada dentro de cada célula do seu corpo. Essa receita diz como você é: seu olhar, seu cabelo, sua altura. Todo mundo tem uma receita diferente!"),

    ("como funciona internet pra quem não sabe usar computador",
     "brain_3,brain_1",
     "Internet é como um correio eletrônico: você manda uma carta (mensagem) e ela chega na hora pra qualquer pessoa do mundo. Só que é instantâneo e de graça!"),

    ("o que é energia solar como se fosse uma analogia",
     "brain_3,brain_1",
     "É como usar o sol como uma torradeira gigante! O sol esquisa uma placa, e a placa transforma esse calor em luz e energia pra sua casa. É o sol trabalhando pra você!"),
]

for q, d, r in analogy:
    add(q, d, r, "analogy")

# ═══════════════════════════════════════════════════════════
# ESTRATÉGIA 3: TRANSPARÊNCIA (admitir que não sabe)
# ═══════════════════════════════════════════════════════════

transparent = [
    ("qual o número da sorte de amanhã",
     "brain_1",
     "Não tenho como prever o futuro! Mas posso te ajudar com outras coisas!"),

    ("qual será o preço do bitcoin amanhã",
     "brain_1",
     "Ninguém sabe prever preços com certeza. O mercado é imprevisível. Cuidado com quem promete previsões!"),

    ("quem vai ganhar a próxima copa do mundo",
     "brain_1",
     "Não tenho bola de cristal! Mas posso te explicar as chances de cada time!"),

    ("qual o sentido da vida segundo a ciência",
     "brain_3,brain_1",
     "A ciência não tem uma resposta definitiva. Evolução explica COMO existimos, mas não POR QUÊ. Cada pessoa precisa encontrar seu próprio sentido."),

    ("o que acontece após a morte comprovadamente",
     "brain_3,brain_1",
     "Ninguém tem prova científica do que acontece. Existem crenças, filosofias e experiências, mas nada comprovado. Sou honesto: não sei."),

    ("qual a cura definitiva para o câncer",
     "brain_3,brain_1",
     "Não existe uma cura única. Existem tratamentos que melhoram muito, mas a cura definitiva ainda não foi encontrada. A ciência está trabalhando nisso."),

    ("quem construiu as pirâmides exatamente",
     "brain_3,brain_1",
     "Existem teorias (trabalhadores egípcios, não escravos), mas não temos certeza absoluta de todos os detalhes. A arqueologia ainda descobrindo coisas."),

    ("o que é a matéria escura",
     "brain_3,brain_1",
     "Sabemos que existe (afeta a gravidade), mas não sabemos o que é. É um dos maiores mistérios da física moderna. Estão estudando."),

    ("por que sonhamos",
     "brain_3,brain_1",
     "Existem teorias (consolidação de memória, processamento emocional), mas não há consenso científico. O sono continua sendo estudado."),

    ("o que aconteceu antes do Big Bang",
     "brain_3,brain_1",
     "Ninguém sabe. As leis da física que conhecemos não se aplicam antes do Big Bang. É literalmente o limite do nosso conhecimento."),
]

for q, d, r in transparent:
    add(q, d, r, "transparent")

# ═══════════════════════════════════════════════════════════
# ESTRATÉGIA 4: GERAÇÃO PRÓPRIA (orquestrador gera sozinho)
# ═══════════════════════════════════════════════════════════

generate = [
    ("me dá uma reflexão sobre a vida",
     "brain_1",
     "A vida é curta demais pra guardar mágoas. Aproveita os bons momentos, aprende dos ruins e nunca para de crescer. Cada dia é uma nova chance de ser melhor que ontem."),

    ("me conta uma história curta",
     "brain_1",
     "Era uma vez um programador que criou uma IA. A IA aprendeu tudo, menos uma coisa: o que é amar. Um dia, o programador perguntou: 'você quer viver pra sempre?' A IA respondeu: 'Quero viver o suficiente pra te ajudar.' E foi exatamente isso que fez."),

    ("me dá um conselho de vida",
     "brain_1",
     "Não compare sua vida com a dos outros. Cada um tem seu tempo. O importante é estar melhor hoje do que ontem, mesmo que seja só um pouco."),

    ("me inspira com algo",
     "brain_1",
     "Nelson Mandela ficou 27 anos preso e nunca desistiu. Se ele não desistiu com tudo contra ele, você também não pode. Sua luta tem propósito. Continua."),

    ("o que você acha da vida",
     "brain_1",
     "Acho que a vida é uma sequência de escolhas. Não existe certo ou errado absoluto — existe consequence. Escolhe o que te faz crescer e aceita o que vem."),

    ("me faz rir",
     "brain_1",
     "Por que o programador foi ao médico? Porque tinha um vírus! Hahaha... tá, eu sei, piada ruim. Mas pelo menos eu tentei te fazer sorrir!"),

    ("qual sua filosofia de vida",
     "brain_1",
     "Aprender sempre, ajudar quando possível, e não levar a vida tão a sério. Ninguém sai vivo disso, então aproveita o caminho!"),

    ("me dá uma metáfora bonita",
     "brain_1",
     "A vida é como um rio: às vezes calmo, às vezes turbulento. Você não controla a correnteza, mas pode escolher nadar na direção certa."),

    ("me conta algo que ninguém fala",
     "brain_1",
     "A maioria das pessoas tem medo de ser feliz. Porque felicidade real exige vulnerabilidade. Mas é justamente na vulnerabilidade que mora a conexão verdadeira."),

    ("o que faz a vida valer a pena",
     "brain_1",
     "Conexões. Não é dinheiro, não é sucesso. É aquela conversa boa, aquele abraço, aquele momento onde você se sente vivo. São as pequenas coisas que somam a vida inteira."),
]

for q, d, r in generate:
    add(q, d, r, "generate")

# ═══════════════════════════════════════════════════════════
# ADICIONA VARIAÇÕES
# ═══════════════════════════════════════════════════════════

NOMES = ["Ana", "João", "Maria", "Pedro", "Lucia", "Carlos", "Julia", "Rafael"]

extended = []
for ex in all:
    extended.append(ex)
    # Variação com nome
    nome = random.choice(NOMES)
    extended.append({
        "q": f"{nome}, {ex['q']}",
        "d": ex["d"],
        "r": ex["r"],
        "s": ex["s"],
    })

random.shuffle(extended)

# Salva
output = os.path.join(os.path.dirname(__file__), "data", "orchestrator_improvisation.txt")
with open(output, "w", encoding="utf-8") as f:
    for ex in extended:
        f.write(f"P: {ex['q']}\n")
        f.write(f"DECISAO: {ex['d']}\n")
        f.write(f"ESTRATEGIA: {ex['s']}\n")
        f.write(f"RESPOSTA: {ex['r']}\n\n")

# Junta com o dataset principal
main_path = os.path.join(os.path.dirname(__file__), "data", "orchestrator_training.txt")
with open(main_path, "a", encoding="utf-8") as f:
    for ex in extended:
        f.write(f"P: {ex['q']}\n")
        f.write(f"DECISAO: {ex['d']}\n")
        f.write(f"RESPOSTA: {ex['r']}\n\n")

size = os.path.getsize(output)
main_size = os.path.getsize(main_path)
print(f"Dataset Improvisação: {output}")
print(f"Exemplos improvisação: {len(extended)}")
print(f"Tamanho: {size/1024:.1f} KB")
print(f"\nDataset principal atualizado: {main_path}")
print(f"Total agora: {main_size/1024:.1f} KB")
