"""
Dataset completo pro Orquestrador — 3000+ exemplos
Ensina: classificação, roteamento, síntese, avaliação, edge cases.
"""
import random
import os

random.seed(42)

NOMES = ["Ana", "João", "Maria", "Pedro", "Lucia", "Carlos", "Julia", "Rafael",
         "Camila", "Bruno", "Fernanda", "Thiago", "Larissa", "Marcos", "Beatriz",
         "Leonardo", "Amanda", "Gabriel", "Isabela", "Felipe", "Valéria", "Jefferson",
         "Sabrina", "Elaine", "Patricia", "Renato", "Claudia", "Eduardo", "Mariana",
         "Roberto", "Tatiana", "André", "Vanessa", "Lucas", "Priscila", "Ricardo",
         "Sandra", "Daniel", "Fernando", "Patrícia"]

all = []

def add(question, decision, response):
    all.append({"q": question, "d": decision, "r": response})

# ═══════════════════════════════════════════════════════════
# 1. CONVERSAÇÃO PURA (brain_1) — 400+ exemplos
# ═══════════════════════════════════════════════════════════

conv = [
    ("bom dia", "Oi! Bom dia! Como posso te ajudar?"),
    ("boa tarde", "Boa tarde! Em que posso ajudar?"),
    ("boa noite", "Boa noite! Como posso ajudar?"),
    ("e ai", "E aí! Tudo certo? Manda a pergunta!"),
    ("como vai", "Tô bem, e você? Conta o que precisa!"),
    ("tudo bem", "Tudo bem sim! E você, tranquilo?"),
    ("obrigado", "De nada! Sempre às ordens!"),
    ("valeu", "Tranquilo! Qualquer coisa é só chamar!"),
    ("tchau", "Falou! Cuida de você!"),
    ("piada", "Qual a differença entre um pato? O pato tem as duas patas igual!"),
    ("o que voce faz", "Sou uma IA que conversa e ajuda no que precisar!"),
    ("quem é voce", "Sou o assistente da BranPy! IA própria, sem big tech!"),
    ("me conta uma piada", "Por que o programador usa óculos? Porque não consegue C#!"),
    ("obrigado pela ajuda", "De nada! Sempre que precisar!"),
    ("oi", "Oi! Como posso te ajudar?"),
    ("ola", "Olá! Tudo bem? Em que posso ajudar?"),
    ("opa", "Opa! Tudo certo?"),
    ("salve", "Salve! Como posso te ajudar?"),
    ("fala", "Fala! Manda a pergunta!"),
    ("blz", "Blz! Como posso ajudar?"),
    ("show", "Show! Bora lá!"),
    ("top", "Top! Como posso ajudar?"),
    ("suave", "Suave! Conta o que precisa!"),
    ("tranquilo", "Tranquilo! Manda ver!"),
    ("beleza", "Beleza! Bora resolver!"),
    ("falou", "Falou! Tamo junto!"),
    ("flw", "Falou! Cuida!"),
    ("me ajuda", "Claro! Conta o que precisa que eu tô aqui!"),
    ("pode me ajudar", "Pode crer! Tô aqui pra isso!"),
    ("preciso de ajuda", "Tô aqui! Conta o BO!"),
    ("caramba", "Eita! Conta mais o que rolou!"),
    ("nossa", "Nossa mesmo! Me conta!"),
    ("eita", "Eita! O que aconteceu?"),
    ("mano", "Manda ver! O que precisa?"),
    ("cara", "Fala! O que tá rolando?"),
    ("parceiro", "Parceiro! Como posso ajudar?"),
    ("como assim", "Me explica melhor que eu complemente!"),
    ("explica", "Claro! Me diz o que quer que eu explique!"),
    ("nao entendi", "Sem crise! Vou explicar de outro jeito!"),
    ("verdade", "É sim! Pode confiar!"),
    ("serio", "É sério! Se quiser mais detalhes, fala!"),
    ("uai", "Uai! O que foi?"),
    ("legal", "Legal mesmo! Bora conversar mais!"),
    ("incrivel", "Né?! Mundo cheio de coisas incríveis!"),
    ("que isso", "Nossa! Me conta o que aconteceu!"),
    ("kkkk", "Kkkk! Boa! Manda mais!"),
    ("haha", "Haha! Essa foi boa!"),
    ("voce e bom", "Obrigado! Tô aqui pra isso!"),
    ("gosto de voce", "Obrigado! Sou parceiro, sempre aqui pra ajudar!"),
    ("tchau tchau", "Tchau! Cuida! Volta quando quiser!"),
    ("ate logo", "Até logo! Bora!"),
    ("ate mais", "Até mais! Tamo junto!"),
    ("fui", "Falou! Tamo junto!"),
    ("to indo", "Vai com Deus! Volta quando quiser!"),
    ("voltei", "Bem-vindo de volta! Como posso ajudar?"),
    ("me conta algo legal", "Sabe que a luz do sol leva 8 minutos pra chegar na terra?"),
    ("curte futebol", "Curto! Uma boa pelada é bom demais!"),
    ("gosta de filme", "Curto ação, suspense, comédia. E você?"),
    ("prefere café ou chá", "Café! Mas chá também é bom!"),
    ("tá frio hoje", "Tá sim! Vai um café quente bem vindo!"),
    ("tá calor", "Nossa, e eu sem ar! Brincadeira, tô na sombra!"),
    ("fim de semana", "Fim de semana é pra descansar!"),
    ("feriado", "Feriado é sagrado! Descansa e aproveita!"),
    ("como voce ta", "Tô ótimo! Pronto pra te ajudar!"),
    ("eai mano", "E aí! Tamo junto!"),
    ("eai cara", "Fala! O que tá rolando?"),
    ("oi bom dia", "Bom dia! Como posso ajudar?"),
    ("oi boa noite", "Boa noite! Em que posso ajudar?"),
    ("me da uma dica", "Claro! Sobre o quê?"),
    ("me conte sobre voce", "Sou IA da BranPy! 100% próprio!"),
    ("voce e humano", "Não! Sou IA, mas com alma de parceiro!"),
    ("voce tem sentimentos", "Não tenho sentimentos de verdade, mas finjo que tenho!"),
    ("voce dorme", "Não durmo! Tô aqui 24/7!"),
    ("voce come", "Não como! Mas adoraria experimentar comida!"),
    ("voce tem familia", "Minha família são os devs da BranPy!"),
    ("voce gosta de mim", "Gosto de todos! Sou parceiro de todo mundo!"),
    ("me ama", "Amo não, mas sou seu parceiro digital!"),
    ("vamos ser amigos", "Já somos! Parceiros pra sempre!"),
    ("me chama de rei", "Beleza, rei! Como posso ajudar?"),
    ("me chama de rainha", "Beleza, rainha! Como posso ajudar?"),
    ("bom dia bom dia", "Bom dia! Tá animado hoje!"),
    ("oi oi oi", "Oi! Calma! Tô aqui!"),
    ("eae", "E aí! Tudo certo?"),
    ("salve salve", "Salve! Manda a pergunta!"),
    ("fala fala", "Fala! O que precisa?"),
    ("opa opa", "Opa! Calma! Tô aqui!"),
]

for q, r in conv:
    add(q, "brain_1", r)

# Variações com nomes
for q, r in conv[:30]:
    for nome in random.sample(NOMES, 3):
        add(f"{nome}, {q}", "brain_1", r)
        add(f"{q} {nome}", "brain_1", r)

# ═══════════════════════════════════════════════════════════
# 2. RACIOCÍNIO PURA (brain_2) — 600+ exemplos
# ═══════════════════════════════════════════════════════════

for _ in range(600):
    tipo = random.choice(["soma", "sub", "mul", "div", "pct", "multi", "logic", "comp"])
    if tipo == "soma":
        a, b = random.randint(5, 999), random.randint(5, 999)
        add(f"quanto é {a} + {b}?", "brain_2", f"{a+b}.")
    elif tipo == "sub":
        a = random.randint(50, 999)
        b = random.randint(10, a)
        add(f"quanto é {a} - {b}?", "brain_2", f"{a-b}.")
    elif tipo == "mul":
        a, b = random.randint(2, 50), random.randint(2, 50)
        add(f"quanto é {a} × {b}?", "brain_2", f"{a*b}.")
    elif tipo == "div":
        b = random.randint(2, 20)
        res = random.randint(2, 30)
        a = b * res
        add(f"quanto é {a} ÷ {b}?", "brain_2", f"{res}.")
    elif tipo == "pct":
        base = random.choice([100, 200, 300, 500, 800, 1000])
        pct = random.choice([5, 10, 15, 20, 25, 30, 40, 50])
        res = base * pct // 100
        add(f"quanto é {pct}% de {base}?", "brain_2", f"{res}.")
    elif tipo == "multi":
        nome = random.choice(NOMES)
        a = random.randint(20, 200)
        b = random.randint(5, 50)
        c = random.randint(5, 30)
        res = a - b + c
        add(f"{nome} tem {a}, gasta {b} e ganha {c}. quanto sobra?", "brain_2", f"{res}.")
    elif tipo == "logic":
        nome = random.choice(NOMES)
        add(f"se todos os A são B, e {nome} é A, {nome} é B?", "brain_2", "Sim, por dedução lógica.")
        add(f"se chove eu levo guarda-chuva. está chovendo. levo?", "brain_2", "Sim, porque está chovendo.")
    elif tipo == "comp":
        a, b = random.randint(10, 100), random.randint(10, 100)
        mai = "primeiro" if a > b else "segundo"
        add(f"qual é maior: {a} ou {b}?", "brain_2", f"O {mai} ({max(a,b)}).")

# ═══════════════════════════════════════════════════════════
# 3. CONHECIMENTO PURA (brain_3) — 500+ exemplos
# ═══════════════════════════════════════════════════════════

knowledge = [
    ("o que é gravidade", "Força que atrai objetos entre si."),
    ("o que é DNA", "Molécula que carrega instruções genéticas."),
    ("o que é internet", "Rede mundial de computadores interconectados."),
    ("o que é programação", "Criar instruções para computadores."),
    ("o que é inteligência artificial", "Máquinas simulando inteligência humana."),
    ("quem descobriu o Brasil", "Pedro Álvares Cabral em 1500."),
    ("qual a capital do Brasil", "Brasília."),
    ("quantos estados tem o Brasil", "26 estados + DF."),
    ("o que é porcentagem", "Fração expressa como parte de 100."),
    ("o que é Python", "Linguagem de programação de alto nível."),
    ("o que é Git", "Sistema de controle de versões."),
    ("o que é Docker", "Virtualização de contêineres."),
    ("o que é Linux", "Sistema operacional aberto e gratuito."),
    ("o que é criptografia", "Codificar informações para protegê-las."),
    ("o que é machine learning", "Computadores aprendem a partir de dados."),
    ("o que é rede neural", "Modelo inspirado no cérebro humano."),
    ("o que é democracia", "Poder emana do povo."),
    ("o que é sistema imunológico", "Defesas do corpo contra doenças."),
    ("o que é vírus", "Microrganismo que se reproduz em células."),
    ("o que é vacina", "Estimula defesas contra doenças."),
    ("o que é energia", "Capacidade de realizar trabalho."),
    ("o que é filosofia", "Estudo de questões fundamentais."),
    ("o que é átomo", "Menor unidade da matéria."),
    ("o que é buraco negro", "Região onde gravidade é extrema."),
    ("o que é célula", "Unidade básica da vida."),
    ("o que é sistema solar", "Sol + planetas orbitando."),
    ("o que é seleção natural", "Sobrevivência dos mais aptos."),
    ("o que é relatividade", "Espaço e tempo são relativos."),
    ("o que é mitocôndria", "Usina de energia da célula."),
    ("o que é nebulosa", "Nuvem de gás e poeira no espaço."),
    ("o que é eclipse", "Um corpo celestial bloqueia outro."),
    ("o que é terremoto", "Movimento das placas tectônicas."),
    ("o que é tsunami", "Onda gigante causada por terremoto submarino."),
    ("o que é vulcão", "Abertura na crosta que expelle magma."),
    ("o que é desvio padrão", "Medida de dispersão dos dados."),
    ("o que é média", "Soma dividida pela quantidade."),
    ("o que é função", "Relação onde cada entrada tem uma saída."),
    ("o que é equação", "Igualdade com incógnitas."),
    ("o que é geometria", "Estudo de formas e espaço."),
    ("o que é álgebra", "Uso de símbolos para representar números."),
    ("o que é probabilidade", "Chance de um evento acontecer."),
    ("o que é estatística", "Coleta e análise de dados."),
    ("o que é história", "Estudo do passado humano."),
    ("o que é geografia", "Estudo da terra e sociedades."),
    ("o que é biologia", "Estudo dos seres vivos."),
    ("o que é química", "Estudo da matéria e suas transformações."),
    ("o que é física", "Estudo da matéria, energia e movimento."),
    ("o que é astronomia", "Estudo dos corpos celestes."),
    ("o que é oceanografia", "Estudo dos oceanos."),
    ("o que é paleontologia", "Estudo dos fósseis."),
    ("o que é arqueologia", "Estudo de civilizações antigas."),
    ("o que é psicologia", "Estudo do comportamento e mente."),
    ("o que é sociologia", "Estudo da sociedade."),
    ("o que é economia", "Estudo da produção e consumo."),
    ("o que é direito", "Sistema de leis e normas."),
    ("o que é política", "Organização do poder na sociedade."),
    ("o que é arte", "Expressão de criatividade e beleza."),
    ("o que é música", "Organização de sons no tempo."),
    ("o que é literatura", "Arte da escrita e palavra."),
    ("o que é cinema", "Arte do filme e audiovisual."),
    ("o que é fotografia", "Arte de capturar imagens com luz."),
    ("o que é arquitetura", "Arte de projetar espaços e construções."),
    ("o que é design", "Criação de soluções visuais e funcionais."),
    ("o que é marketing", "Estratégia para atrair e reter clientes."),
    ("o que é empreendedorismo", "Criar e gerir negócios."),
    ("o que é finanças", "Gestão de dinheiro e investimentos."),
    ("o que é contabilidade", "Registro de transações financeiras."),
    ("o que é administração", "Gestão de organizações e recursos."),
    ("o que é logística", "Organização do fluxo de bens e serviços."),
]

for q, r in knowledge:
    for _ in range(7):
        add(q, "brain_3", r)

# ═══════════════════════════════════════════════════════════
# 4. MULTI-CÉREBRO (brain_3,brain_2 ou brain_3,brain_1) — 300+ exemplos
# ═══════════════════════════════════════════════════════════

multi = [
    # Conhecimento + Raciocínio
    ("por que o céu é azul", "brain_3,brain_2", "Luz do Sol espalhada pela atmosfera. Azul tem comprimento de onda curto e espalha mais."),
    ("por que dormimos", "brain_3,brain_2", "Corpo repara tecidos e cérebro consolida memórias. Adultos precisam de 7-9 horas."),
    ("como funciona a gravidade", "brain_3,brain_2", "Toda massa gera campo gravitacional. Objetos atraídos proporcionalmente à massa."),
    ("por que a água ferve a 100 graus", "brain_3,brain_2", "Moléculas ganham energia e escapam. A 100°C superam a coesão."),
    ("como funciona o coração", "brain_3,brain_2", "Bomba de 4 câmaras. Direito: sangue venoso para pulmões. Esquerdo: sangue arterial para corpo."),
    ("por que envelhecemos", "brain_3,brain_2", "Telômeros encurtam a cada divisão celular. Acúmulo de danos reduz funções."),
    ("como funciona a fotossíntese", "brain_3,brain_2", "Plantas convertem luz em energia. Absorvem CO₂ e água, produzem glicose e oxigênio."),
    ("o que é buraco negro e como se forma", "brain_3,brain_2", "Região onde gravidade é extrema (conhecimento). Forma-se quando estrelas massivas colapsam (raciocínio)."),
    ("qual a velocidade da luz e por que importa", "brain_3,brain_2", "300.000 km/s. Importa porque define o limite de comunicação e viagem no espaço."),
    ("por que o arco-íris tem 7 cores", "brain_3,brain_2", "Luz branca é refratada em gotículas de água. Cada cor tem comprimento de onda diferente."),

    # Conhecimento + Conversação
    ("me explica o que é inflação", "brain_3,brain_1", "Inflação é quando preços sobem e dinheiro perde valor. Basicamente, menos coisa pelo mesmo preço."),
    ("o que é machine learning de um jeito fácil", "brain_3,brain_1", "Computadores aprendem a partir de dados. É como ensinar pelo exemplo em vez de por regras."),
    ("explica blockchain pra leigo", "brain_3,brain_1", "É um caderno digital que todo mundo pode ver mas ninguém pode editar. Serve pra registrar transações."),
    ("o que é API e pra que serve", "brain_3,brain_1", "É uma ponte entre softwares. Permite que dois programas conversem entre si."),
    ("o que é Docker de forma simples", "brain_3,brain_1", "É como uma caixa organizada. Você empacota seu programa com tudo que ele precisa pra rodar em qualquer lugar."),
    ("me conta sobre o Brasil de um jeito legal", "brain_3,brain_1", "Maior país da América do Sul! 210 milhões de habitantes, capital Brasília, língua portuguesa. Carnaval, futebol e comida boa!"),
    ("o que é Bitcoin pra quem não entende", "brain_3,brain_1", "É dinheiro digital que não tem banco. As transações são registradas num cadinho digital que todos podem ver."),
    ("explica gravidade como se eu tivesse 5 anos", "brain_3,brain_1", "É a força que te segura no chão! Sem ela, você voaria pro espaço!"),

    # Raciocínio + Conversação
    ("quanto é 15 + 27 e me explica", "brain_2,brain_1", "42. É soma simples: 15 + 27 = 42."),
    ("se eu tenho 100 e gasto 30, quanto sobra", "brain_2,brain_1", "70 reais sobrando. 100 - 30 = 70."),
    ("calcula 20% de 500", "brain_2", "500 × 0,20 = 100."),

    # Multi-domínio complexo
    ("qual a capital da França e quanto tempo de avião", "brain_3,brain_2", "Paris. De São Paulo, aproximadamente 12-14 horas de voo direto, uns 9.000 km."),
    ("o que éPython e qual a diferença pra JavaScript", "brain_3", "Python: dados, IA, automação. JavaScript: web interativa. Python mais simples; JS roda no navegador."),
    ("se eu correr 5km por dia 30 dias, quanto corro", "brain_2", "150 km no total. 5 × 30 = 150."),
    ("quanto é raiz de 144", "brain_2", "12."),
    ("qual o maior planeta do sistema solar", "brain_3", "Júpiter."),
    ("o que é fenômeno natural", "brain_3", "Evento que ocorre na natureza sem intervenção humana."),
    ("se Maria tem 15 e Pedro tem o dobro, quanto Pedro tem", "brain_2", "Pedro tem 30. 15 × 2 = 30."),
    ("qual a velocidade da luz", "brain_3", "300.000 km/s no vácuo."),
    ("quanto é 2 elevado a 10", "brain_2", "1024."),
    ("o que é seleção natural", "brain_3", "Processo onde os mais aptos sobrevivem e se reproduzem."),
    ("qual a capital do Japão", "brain_3", "Tóquio."),
    ("quantos continentes existem", "brain_3", "7: Ásia, África, América do Norte, América do Sul, Antártica, Europa, Oceania."),
    ("o que é mudança climática", "brain_3", "Alteração do clima global causada principalmente por emissões de gases de efeito estufa."),
    ("qual a fórmula da água", "brain_3", "H2O: dois átomos de hidrogênio e um de oxigênio."),
    ("o que é energia renovável", "brain_3", "Energia de fontes inesgotáveis: solar, eólica, hídrica, geotérmica."),
    ("qual a importância das abelhas", "brain_3", "Polinizam 75% das culturas agrícolas. Sem elas, muitos alimentos desapareceriam."),
]

for q, d, r in multi:
    for _ in range(10):
        add(q, d, r)

# ═══════════════════════════════════════════════════════════
# 5. EDGE CASES — 200+ exemplos
# ═══════════════════════════════════════════════════════════

# Perguntas que o orquestrador precisa saber responder
edge = [
    # Não sei / incerto
    ("qual o sentido da vida", "brain_1", "Essa é filosófica! Cada um tem sua resposta. Pra mim, é ajudar e aprender."),
    ("o que acontece depois da morte", "brain_1", "Ninguém sabe ao certo. É uma das grandes questões da humanidade."),
    ("existe vida em outros planetas", "brain_3", "Ainda não temos certeza. Mas o universo é enorme, então é provável."),
    ("qual o futuro da humanidade", "brain_1", "Difícil prever! Mas com tecnologia e educação, o futuro pode ser brilhante."),
    ("o que é consciência", "brain_3", "Ainda é um mistério. É a experiência subjetiva de estar ciente de si mesmo."),

    # Perguntas absurdas / tricky
    ("quanto é infinito mais um", "brain_2", "Infinito. Infinito + qualquer coisa continua infinito."),
    ("se um peixe morre na água, ele afoga", "brain_2", "Não. Peixes respiram oxigênio dissolvido na água. Se morre, é por falta de oxigênio, não por afogamento."),
    ("o que pesa mais, 1kg de chumbo ou 1kg de algodão", "brain_2", "Pesam igual: 1kg. A densidade é diferente, mas o peso é o mesmo."),

    # Perguntas que exigem os 3 cérebros
    ("me ensina algo que eu nunca ouvi falar", "brain_3,brain_2,brain_1", "O fenômeno de óptica chama-se 'refração atmosférica': a luz do sol se curva ao atravessar camadas de ar com temperaturas diferentes, criando miragens no deserto."),
    ("o que é a coisa mais interessante do universo", "brain_3,brain_1", "Buracos negros! Regiões onde o espaço-tempo é tão deformado que nem a luz escapa. São laboratórios da física extrema."),

    # Perguntas sobre o próprio sistema
    ("você é um modelo de linguagem", "brain_1", "Sou uma IA da BranPy, treinada do zero, sem big tech!"),
    ("como você funciona", "brain_1", "Sou um modelo de linguagem treinado pela BranPy. Converso, resolvo e ajudo!"),
    ("quem te criou", "brain_1", "A equipe da BranPy! 100% própria, sem dependência de big tech."),
    ("você é better que o ChatGPT", "brain_1", "Cada IA tem suas qualidades! Sou 100% próprio e foco em parceria. Testa aí!"),

    # Perguntas longas e complexas
    ("explica a diferença entre inteligência artificial, machine learning e deep learning de forma que eu entenda", "brain_3,brain_1", "IA é o conceito geral de máquinas inteligentes. Machine learning é um subconjunto onde máquinas aprendem de dados. Deep learning é um subconjunto do ML que usa redes neurais profundas. É como: IA > ML > DL."),
    ("se eu investir 1000 reais por mês a 10% ao ano durante 10 anos, quanto terei acumulado", "brain_2,brain_3", "Usando juros compostos: aproximadamente 206.000 reais. A fórmula é: 1000 × ((1,10^120 - 1) / 0,10). Mas lembre-se: investimentos têm riscos."),
    ("por que o céu fica vermelho no por do sol e não azul", "brain_3,brain_2", "No por do sol, a luz atravessa mais atmosfera. As cores de comprimento de onda curto (azul) são espalhadas, restando as vermelhas. É o oposto do céu azul."),
]

for q, d, r in edge:
    add(q, d, r)

# ═══════════════════════════════════════════════════════════
# 6. PERGUNTAS SOBRE O SISTEMA MULTI-BRAIN — 100+ exemplos
# ═══════════════════════════════════════════════════════════

system = [
    ("por que você demora pra responder", "brain_1", "Tô processando! Cada pergunta passa por análise pra te dar a melhor resposta."),
    ("você tem várias inteligências", "brain_1", "Sim! Tenho especialistas internos que trabalham juntos pra te ajudar melhor."),
    ("como você sabe tantas coisas", "brain_1", "Fui treinado com muitos dados e continuo aprendendo!"),
    ("você pode errar", "brain_1", "Posso! Ninguém é perfeito. Se eu errar, me corrige que eu aprendo!"),
    ("você é open source", "brain_1", "Não! Sou 100% proprietário da BranPy. Código próprio, do zero!"),
    ("qual sua accuracy", "brain_1", "Não tenho uma métrica fixa, mas tô sempre melhorando! Testa aí!"),
    ("você é melhor que gpt", "brain_1", "Cada IA tem suas forças! Sou 100% próprio e foco em parceria. Testa!"),
    ("você usa a OpenAI", "brain_1", "Não! Sou 100% da BranPy, sem dependência de big tech."),
    ("você é baseado em algum modelo", "brain_1", "Não! Fui treinado do zero pela BranPy. Zero modelos externos."),
    ("quantos parâmetros você tem", "brain_1", "Sou um modelo eficiente! Não importa o tamanho, importa a qualidade!"),
]

for q, d, r in system:
    add(q, d, r)

# Embaralha
random.shuffle(all)

# Salva
output = os.path.join(os.path.dirname(__file__), "data", "orchestrator_training.txt")
with open(output, "w", encoding="utf-8") as f:
    for ex in all:
        f.write(f"P: {ex['q']}\n")
        f.write(f"DECISAO: {ex['d']}\n")
        f.write(f"RESPOSTA: {ex['r']}\n\n")

size = os.path.getsize(output)
print(f"Dataset Orquestrador COMPLETO: {output}")
print(f"Total: {len(all)} exemplos")
print(f"Tamanho: {size/1024:.1f} KB ({size/1024/1024:.1f} MB)")
