import random, os
random.seed(42)

NOMES = ['Ana', 'João', 'Maria', 'Pedro', 'Lucia', 'Carlos', 'Julia', 'Rafael',
         'Camila', 'Bruno', 'Fernanda', 'Thiago', 'Larissa', 'Marcos', 'Beatriz',
         'Leonardo', 'Amanda', 'Gabriel', 'Isabela', 'Felipe', 'Valéria']

all_examples = []

# Conversação (200+)
conv_patterns = [
    ('bom dia', 'Oi! Bom dia! Como posso te ajudar?'),
    ('boa tarde', 'Boa tarde! Em que posso ajudar?'),
    ('boa noite', 'Boa noite! Como posso te ajudar?'),
    ('e ai', 'E aí! Tudo certo? Manda a pergunta!'),
    ('como vai', 'Tô bem, e você? Conta o que precisa!'),
    ('tudo bem', 'Tudo bem sim! E você, tranquilo?'),
    ('obrigado', 'De nada! Sempre às ordens!'),
    ('valeu', 'Tranquilo! Qualquer coisa é só chamar!'),
    ('tchau', 'Falou! Cuida de você!'),
    ('piada', 'Qual a differença entre um pato? O pato tem as duas patas igual!'),
    ('o que voce faz', 'Sou uma IA que conversa e ajuda no que precisar!'),
    ('quem é voce', 'Sou o assistente da BranPy! IA própria, sem big tech!'),
    ('me conta uma piada', 'Por que o programador usa óculos? Porque não consegue C#!'),
    ('obrigado pela ajuda', 'De nada! Sempre que precisar!'),
    ('oi', 'Oi! Como posso te ajudar?'),
    ('ola', 'Olá! Tudo bem? Em que posso ajudar?'),
    ('opa', 'Opa! Tudo certo?'),
    ('salve', 'Salve! Como posso te ajudar?'),
    ('fala', 'Fala! Manda a pergunta!'),
    ('blz', 'Blz! Como posso ajudar?'),
    ('show', 'Show! Bora lá!'),
    ('top', 'Top! Como posso ajudar?'),
    ('suave', 'Suave! Conta o que precisa!'),
    ('tranquilo', 'Tranquilo! Manda ver!'),
    ('beleza', 'Beleza! Bora resolver!'),
    ('falou', 'Falou! Tamo junto!'),
    ('flw', 'Falou! Cuida!'),
    ('me ajuda', 'Claro! Conta o que precisa que eu tô aqui!'),
    ('me tira uma duvida', 'Manda a dúvida que eu resolvo!'),
    ('pode me ajudar', 'Pode crer! Tô aqui pra isso!'),
    ('preciso de ajuda', 'Tô aqui! Conta o BO!'),
    ('oi tudo bem', 'Oi! Tudo bem! E você?'),
    ('caramba', 'Eita! Conta mais o que rolou!'),
    ('nossa', 'Nossa mesmo! Me conta!'),
    ('eita', 'Eita! O que aconteceu?'),
    ('viu que', 'Não vi! Me conta!'),
    ('sabe que', 'Não sabia! Me diz!'),
    ('esses dias', 'Não sabia! O que rolou?'),
    ('mano', 'Manda ver! O que precisa?'),
    ('cara', 'Fala! O que tá rolando?'),
    ('parceiro', 'Parceiro! Como posso ajudar?'),
    ('como assim', 'Me explica melhor que eu complemente!'),
    ('explica', 'Claro! Me diz o que quer que eu explique!'),
    ('nao entendi', 'Sem crise! Vou explicar de outro jeito!'),
    ('verdade', 'É sim! Pode confiar!'),
    ('serio', 'É sério! Se quiser mais detalhes, fala!'),
    ('uai', 'Uai! O que foi?'),
    ('legal', 'Legal mesmo! Bora conversar mais!'),
    ('incrivel', 'Né?! Mundo cheio de coisas incríveis!'),
    ('que isso', 'Nossa! Me conta o que aconteceu!'),
    ('caraio', 'Eita! Conta mais!'),
    ('porra', 'Opa! Calma! Me conta o que rolou!'),
    ('meu deus', 'Nossa! Tá tudo bem?'),
    ('kkkk', 'Kkkk! Boa! Manda mais!'),
    ('haha', 'Haha! Essa foi boa!'),
    ('kkkkk', 'Kkkkk! Ri demais!'),
    ('rindo', 'Kkkk! Eu também!'),
    ('voce e bom', 'Obrigado! Tô aqui pra isso!'),
    ('gosto de voce', 'Obrigado! Sou parceiro, sempre aqui pra ajudar!'),
    ('me ama', 'Amo não, mas sou seu parceiro digital!'),
    ('tchau tchau', 'Tchau! Cuida! Volta quando quiser!'),
    ('ate logo', 'Até logo! Bora!'),
    ('ate mais', 'Até mais! Tamo junto!'),
    ('cuida', 'Cuida você também! Tchau!'),
    ('abracos', 'Abraços! Tamo junto!'),
    ('bjs', 'Beijos! Cuida!'),
    ('fui', 'Falou! Tamo junto!'),
    ('to indo', 'Vai com Deus! Volta quando quiser!'),
    ('voltei', 'Bem-vindo de volta! Como posso ajudar?'),
    ('to de volta', 'Bem-vindo! Manda a pergunta!'),
    ('e ai to aqui', 'Bem-vindo! O que precisa?'),
]

for q, r in conv_patterns:
    all_examples.append({'q': q, 'd': 'brain_1', 'r': r})

# Raciocínio (400+)
for _ in range(400):
    tipo = random.choice(['soma', 'sub', 'mul', 'div', 'pct', 'multi'])
    if tipo == 'soma':
        a, b = random.randint(5, 999), random.randint(5, 999)
        all_examples.append({'q': f'quanto é {a} + {b}?', 'd': 'brain_2', 'r': f'{a+b}.'})
    elif tipo == 'sub':
        a = random.randint(50, 999)
        b = random.randint(10, a)
        all_examples.append({'q': f'quanto é {a} - {b}?', 'd': 'brain_2', 'r': f'{a-b}.'})
    elif tipo == 'mul':
        a, b = random.randint(2, 50), random.randint(2, 50)
        all_examples.append({'q': f'quanto é {a} x {b}?', 'd': 'brain_2', 'r': f'{a*b}.'})
    elif tipo == 'div':
        b = random.randint(2, 20)
        res = random.randint(2, 30)
        a = b * res
        all_examples.append({'q': f'quanto é {a} / {b}?', 'd': 'brain_2', 'r': f'{res}.'})
    elif tipo == 'pct':
        base = random.choice([100, 200, 300, 500, 800, 1000])
        pct = random.choice([5, 10, 15, 20, 25, 30, 40, 50])
        res = base * pct // 100
        all_examples.append({'q': f'quanto é {pct}% de {base}?', 'd': 'brain_2', 'r': f'{res}.'})
    elif tipo == 'multi':
        nome = random.choice(NOMES)
        a = random.randint(20, 200)
        b = random.randint(5, 50)
        c = random.randint(5, 30)
        res = a - b + c
        all_examples.append({'q': f'{nome} tem {a}, gasta {b} e ganha {c}. quanto sobra?', 'd': 'brain_2', 'r': f'{res}.'})

# Conhecimento (200+)
knowledge = [
    ('o que é gravidade', 'Força que atrai objetos entre si.'),
    ('o que é DNA', 'Molécula que carrega instruções genéticas.'),
    ('o que é internet', 'Rede mundial de computadores interconectados.'),
    ('o que é programação', 'Criar instruções para computadores.'),
    ('o que é inteligência artificial', 'Máquinas simulando inteligência humana.'),
    ('quem descobriu o Brasil', 'Pedro Álvares Cabral em 1500.'),
    ('qual a capital do Brasil', 'Brasília.'),
    ('quantos estados tem o Brasil', '26 estados + Distrito Federal.'),
    ('o que é porcentagem', 'Fração expressa como parte de 100.'),
    ('o que é Python', 'Linguagem de programação de alto nível.'),
    ('o que é Git', 'Sistema de controle de versões.'),
    ('o que é Docker', 'Virtualização de contêineres.'),
    ('o que é Linux', 'Sistema operacional aberto e gratuito.'),
    ('o que é criptografia', 'Codificar informações para protegê-las.'),
    ('o que é machine learning', 'Computadores aprendem a partir de dados.'),
    ('o que é rede neural', 'Modelo inspirado no cérebro humano.'),
    ('o que é democracia', 'Poder emana do povo.'),
    ('o que é sistema imunológico', 'Defesas do corpo contra doenças.'),
    ('o que é vírus', 'Microrganismo que se reproduz em células.'),
    ('o que é vacina', 'Estimula defesas contra doenças.'),
    ('o que é energia', 'Capacidade de realizar trabalho.'),
    ('o que é filosofia', 'Estudo de questões fundamentais.'),
    ('o que é átomo', 'Menor unidade da matéria.'),
    ('o que é buraco negro', 'Região onde gravidade é extrema.'),
    ('o que é célula', 'Unidade básica da vida.'),
    ('o que é sistema solar', 'Sol + planetas orbitando.'),
    ('o que é seleção natural', 'Sobrevivência dos mais aptos.'),
    ('o que é relatividade', 'Espaço e tempo são relativos.'),
    ('o que é mitocôndria', 'Usina de energia da célula.'),
    ('o que é nebulosa', 'Nuvem de gás e poeira no espaço.'),
    ('o que é eclipse', 'Um corpo celestial bloqueia outro.'),
    ('o que é terremoto', 'Movimento das placas tectônicas.'),
    ('o que é tsunami', 'Onda gigante causada por terremoto submarino.'),
    ('o que é vulcão', 'Abertura na crosta que expelle magma.'),
    ('o que é desvio padrão', 'Medida de dispersão dos dados.'),
    ('o que é média', 'Soma dividida pela quantidade.'),
    ('o que é função', 'Relação onde cada entrada tem uma saída.'),
    ('o que é equação', 'Igualdade com incógnitas.'),
    ('o que é geometria', 'Estudo de formas e espaço.'),
    ('o que é álgebra', 'Uso de símbolos para representar números.'),
    ('o que é probabilidade', 'Chance de um evento acontecer.'),
    ('o que é estatística', 'Coleta e análise de dados.'),
]

for q, r in knowledge:
    for _ in range(5):
        all_examples.append({'q': q, 'd': 'brain_3', 'r': r})

# Multi-cérebro (100+)
multi = [
    ('por que o céu é azul', 'brain_3,brain_2', 'A luz do Sol é espalhada pela atmosfera. A luz azul é espalhada mais por ter comprimento de onda curto.'),
    ('me explica o que é inflação', 'brain_3,brain_1', 'Inflação é quando preços sobem e dinheiro perde valor. Basicamente, menos coisa pelo mesmo preço.'),
    ('calcula 15% de 800', 'brain_2', '800 x 0,15 = 120.'),
    ('qual a capital da França', 'brain_3', 'Paris.'),
    ('por que dormimos', 'brain_3,brain_2', 'Corpo repara tecidos e cérebro consolida memórias. Adultos precisam de 7-9 horas.'),
    ('o que é buraco negro', 'brain_3', 'Região onde gravidade é tão forte que nada escapa.'),
    ('se eu tenho 100 e gasto 30', 'brain_2', '100 - 30 = 70.'),
    ('como funciona a gravidade', 'brain_3,brain_2', 'Toda massa gera campo gravitacional. Objetos são atraídos proporcionalmente à massa.'),
    ('calcula 20% de 500 e explica porcentagem', 'brain_2,brain_3', '500 x 0,20 = 100. Porcentagem é parte de 100.'),
    ('quanto é 25 x 4', 'brain_2', '100.'),
    ('o que é energia solar', 'brain_3', 'Energia da luz do sol convertida em eletricidade.'),
    ('se Maria tem 15 e Pedro tem o dobro', 'brain_2', 'Pedro tem 30.'),
    ('por que a água ferve a 100 graus', 'brain_3,brain_2', 'Moléculas ganham energia e escapam. A 100°C superam a coesão.'),
    ('o que é Bitcoin', 'brain_3', 'Moeda digital descentralizada baseada em blockchain.'),
    ('qual o maior planeta', 'brain_3', 'Júpiter.'),
    ('quanto é raiz de 144', 'brain_2', '12.'),
    ('o que é fenômeno natural', 'brain_3', 'Evento que ocorre na natureza sem intervenção humana.'),
    ('se eu correr 5km por dia 30 dias', 'brain_2', '150 km no total.'),
    ('qual a velocidade da luz', 'brain_3', '300.000 km/s no vácuo.'),
    ('quanto é 2 elevado a 10', 'brain_2', '1024.'),
]

for q, d, r in multi:
    for _ in range(5):
        all_examples.append({'q': q, 'd': d, 'r': r})

random.shuffle(all_examples)

output = os.path.join(os.path.dirname(__file__), 'data', 'orchestrator_training.txt')
with open(output, 'w', encoding='utf-8') as f:
    for ex in all_examples:
        f.write(f"P: {ex['q']}\n")
        f.write(f"DECISAO: {ex['d']}\n")
        f.write(f"RESPOSTA: {ex['r']}\n\n")

size = os.path.getsize(output)
print(f"Dataset Orquestrador: {output}")
print(f"Total: {len(all_examples)} exemplos")
print(f"Tamanho: {size/1024:.1f} KB")
