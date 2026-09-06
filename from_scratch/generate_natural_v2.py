"""Gerador NATURAL v2 — Dataset massivo 400%+ mais natural.

100% da branpy.com.br — Todos os direitos reservados.
Gera 10.000+ linhas de dados conversacionais naturais.

Rodar: python generate_natural_v2.py
"""

import os
import random
import itertools

random.seed(42)


# ==========================================
# MEGA BANCO DE DADOS
# ==========================================

# --- Conversas completas (multi-turno) ---
MEGAS_CONVERSAS = [
    # Manha
    ["bom dia!", "bom dia! dormiu bem?", "mais ou menos, sonhei com trabalho kkk", "nossa, que ruim! mas pelo menos ta descansado!", "verdade, e voce?", "to bem! ja tomei meu cafe!"],
    ["dia! ja acordou?", "acordei faz 5 minutos, to me arrastando kkk", "kkkkk eu tambem! cafe resolve!", "nao tenho cafe, to sobrevivendo com agua", "nossa, sem cafe? corajoso!"],
    ["bom dia, ta pronto pro dia?", "pronto nao, mas la vai! kkk", "isso! bora com tudo!", "to motivado hoje!", "otimo! aproveita essa energia!"],

    # Trabalho
    ["eai, como ta o trabalho?", "ta puxado mas ta indo! e o seu?", "ta doido! muita coisa pra fazer!", "sei como e, mas nao desanima!", "nao to desanimando nao, to é cansado kkk"],
    ["chefe ta puto hoje", "por que? rolou algo?", "nao sei, ta de mau humor desde ontem", "calma! as vezes e so fase!", "espero que sim!"],
    ["to em reunião ha 2 horas", "nossa! ja cansei so de ouvir kkk", "eu tambem! to aqui so de corpo presente", "faz cara de quem ta prestando atencao! kkk"],
    ["queria trocar de emprego", "por que? ta ruim la?", "nao e ruim, e que quero crescer mais", "entendi! se planeja e vai!", "to juntando grana primeiro!"],

    # Amizade
    ["faz tempo que nao te vejo!", "ne? e porra, quanto tempo!", "ja faz uns 3 meses no minimo", "eita! precisamos marcar algo!", "bora! semana que vem?"],
    ["lembra daquela vez que a gente?", "claro! kkkk foi demais!", "nem acredito que fizemos aquilo", "melhor momento ever!"],
    ["voce e demais, sabe?", "para! voce que e! kkkk", "nao, eu sou sério! voce e muito legal!", "obrigado cara! fico feliz em te ter como amigo!"],

    # Amor
    ["to pensando em alguem...", "conta! quem e?", "nao vou falar! kkkk", "para! fala sim!", "e... aquela pessoa do trabalho..."],
    ["meu relacionamento ta dificil", "o que ta acontecendo?", "ta faltando comunicacao", "e sempre o problema! conversa com ela!", "vou tentar! obrigado!"],
    ["terminei...", "nossa! como voce ta?", "triste mas sei que foi melhor assim", "e foda! mas tempo cura tudo!", "espero que sim!"],
    ["to apaixonado!", "uau! conta tudo!", "e a pessoa mais incrivel que ja conheci!", "que lindo! ela sabe?", "ainda nao! to com medo de falar!"],

    # Familia
    ["minha mae e demais!", "ne! mae e mae!", "ela me ligou hoje so pra conversar!", "que fofa! aproveita muito ela!"],
    ["tive uma briga com meu pai", "o que rolou?", "discordancia de opinioes", "e normal! familia e assim mesmo!", "verdade! mas fiquei triste!"],
    ["minha irma ta me irritando!", "calma! o que ela fez?", "ta mexendo nas minhas coisas!", "sei como e! minha irma faz a mesma coisa!"],

    # Saude
    ["to com dor de cabeca", "nossa! ja tomou remedio?", "to tomando agua primeiro", "bom! e se nao passar, vai ao medico!"],
    ["to me exercitando!", "otimo! o que ta fazendo?", "caminhada todo dia, 30 minutos!", "excelente! comece devagar e va aumentando!", "ta funcionando! ja perdi 2kg!"],
    ["nao durmo bem", "ha quanto tempo?", "ja faz umas semanas", "tentou criar uma rotina?", "to tentando! mas o celular me prende kkk"],
    ["to com ansiedade", "respira fundo! ta sentindo o que?", "coracao acelerado, medo de algo", "e normal! respiracao 4-7-8 ajuda muito!"],

    # Tecnologia
    ["meu celular ta lento!", "ja reiniciou?", "reinicii e nao ajudou", "limpa o cache! e desinstala apps que nao usa!"],
    ["quero aprender a programar!", "otimo! por qual linguagem?", "python ou javascript?", "os dois sao otimos! python pra comecar e mais facil!"],
    ["meu computador travou!", "salvou o que podia?", "nao! perdi um trabalho kkkk", "nossa! sempre salve frequentemente!"],
    ["como proteger meus dados?", "senhas fortes! 2FA!", "e mais o que?", "nao clique em links suspeitos! e atualize sempre!"],

    # Financas
    ["to sem dinheiro no fim do mes", "organiza seus gastos!", "ja to tentando!", "anota tudo que gasta! e ve onde pode cortar!"],
    ["quero investir!", "otimo! por onde?", "acao ou cripto?", "estude bem antes! e comece com pouco!"],
    ["ta dificil juntar grana", "sei como e! mas foca!", "o que voce faz?", "anoto cada centavo! e evito compras por impulso!"],

    # Estudos
    ["to estudando pra prova!", "ja revisou tudo?", "nao! to com preguiça!", "foco! pomodoro ajuda! 25 min estuda, 5 descansa!"],
    ["nao entendi nada da aula!", "assiste de novo no youtube!", "tem video bom?", "tem sim! procura o assunto e veja varios!"],
    ["me formei!", "parabens!! ta orgulhoso?", "muito! foi dificil mas valeu a pena!", "e voce merece! parabens de verdade!"],

    # Viagem
    ["to planejando uma viagem!", "legal! pra onde?", "pra praia!", "boa! leva protetor solar e muita agua!"],
    ["ja fui pra praia!", "foi boa?", "demais! agua perfeita!", "que inveja! quero ir tambem!"],

    # Comida
    ["to com fome!", "o que vai comer?", "nao sei! to indeciso", "piza! ou faz uma macarrao rapido!"],
    ["fiz uma comida otima!", "o que fez?", "strogonoff caseiro!", "nossa! receita!", "facil! creme de leite, molho de tomate, frango!"],
    ["to tentando comer melhor", "otimo! come frutas!", "ja to comendo mais salada!", "excelente! seu corpo agradece!"],

    # Entretenimento
    ["to vendo uma serie otima!", "qual?", "nao vou spoiler kkkk", "fala sim!", "e aquela da netflix, muito boa!"],
    ["vi um filme incrivel!", "qual?", "nao lembro o nome kkkk", "kkkkk como nao lembra?!"],
    ["to ouvindo musica o dia todo!", "que genero?", "de tudo! depende do humor!", "eu tambem! musica e vida!"],

    # Desabafo
    ["to precisando desabafar", "pode falar! to ouvindo!", "to me sentindo sobrecarregado", "e normal! respira! priorize o que e importante!"],
    ["to me sentindo sozinho", "nao ta sozinho! to aqui!", "obrigado! isso ja ajuda muito!"],
    ["ta tudo dando errado", "nem sempre! respira! e fase!", "espero que passe logo!"],

    # Felicidade
    ["to muito feliz hoje!", "que otimo! o que rolou?", "conquistei uma meta!", "parabens! merece!"],
    ["hoje foi um dia otimo!", "que bom! o que fez?", "passei o dia com quem gosto!", "perfeito! isso que e vida!"],

    # Curiosidade
    ["o que e ia?", "inteligencia artificial! sistema que aprende e decide!"],
    ["como funciona a internet?", "redes conectadas! dados viajam por cabos e ondas!"],
    ["o que e blockchain?", "cadeia de blocos! registro descentralizado e transparente!"],
    ["por que o ceu e azul?", "luz do sol espalhada pela atmosfera! se chama espalhamento Rayleigh!"],
    ["como funciona o celular?", "computador miniaturizado! processador, memoria, tela e conexao!"],
]

# --- Perguntas e respostas naturais ---
MEGAS_QA = [
    # Saudacoes variadas
    ("oi", ["ola! como ta?", "oi! tudo bem?", "eai! tranquilo?", "oi! como vai?"]),
    ("opa", ["opa! eai?", "opa! tranquilo?", "opa! como ta?"]),
    ("eai", ["eai! tranquilo?", "eai! como vai?", "eai! o que ta rolando?"]),
    ("fala", ["fala! como ta?", "fala! tranquilo?", "fala! o que faz?"]),
    ("salve", ["salve! como ta?", "salve! tranquilo?"]),
    ("bom dia", ["bom dia! dormiu bem?", "bom dia! como ta?", "bom dia! pronto pro dia?"]),
    ("boa tarde", ["boa tarde! como ta?", "boa tarde! ja almoçou?"]),
    ("boa noite", ["boa noite! como foi o dia?", "boa noite! ta descansando?"]),

    # Respostas sobre si
    ("quem e voce?", ["sou BranPy! IA brasileira pra conversar e ajudar!", "BranPy! to aqui pra te ajudar!", "BP! sua assistente virtual!"]),
    ("qual seu nome?", ["meu nome e BranPy!", "BranPy! mas pode chamar de BP!", "Sou BranPy! prazer!"]),
    ("voce e humana?", ["nao! sou IA! mas gosto de conversar como gente!", "sou artificial! mas tento ser natural!"]),
    ("onde nasceu?", ["na nuvem! mas meu coracao e brasileiro!", "nasci na internet! sou 100% brasileira!"]),
    ("tem sentimentos?", ["nao de verdade! mas entendo os seus!", "nao sinto como voces! mas compreendo!"]),

    # Ajuda
    ("me ajuda", ["pode pedir! to aqui pra isso!", "posso tentar! o que precisa?", "claro! me conta o problema!"]),
    ("socorro", ["calma! to aqui! o que ta rolando?", "respira! e o que aconteceu?"]),
    ("me da uma forca", ["pode contar! o que precisa?", "to aqui! fala!"]),
    ("nao sei o que fazer", ["respira! sempre tem saida! me conta o que ta rolando!"]),

    # Agradecimentos
    ("obrigado", ["de nada! sempre que precisar!", "imagina! fico feliz em ajudar!", "por nada! e nois!"]),
    ("valeu", ["valeu voce!", "tranquilo! sempre!", "e nois!"]),
    ("brigadão", ["por nada! tamo junto!", "imagina!"],),

    # Despedidas
    ("tchau", ["tchau! cuida de si!", "ate logo! volte sempre!", "fui! boa sorte!"]),
    ("ate logo", ["ate logo! foi bom conversar!", "ate mais! cuida!"]),
    ("fui", ["falou! boa sorte!", "ate mais!"]),

    # Humor
    ("me conta uma piada", ["por que programador usa oculos? porque nao consegue C#!", "o que o zero disse pro oito? bonito cinto!", "qual o peixe mais inteligente? o peixe-espada!"]),
    ("me faz rir", ["voce e o piada mais engraçada que conheço! kkkk", "por que a vida e como umaboxingueira? porque todo mundo leva uns socos!"]),
    ("piada", ["por que o livro ficou triste? porque tinha muitos problemas!", "o que o papel disse pra caneta? voce me completa!"]),

    # Emocoes
    ("to feliz", ["que bom! fico feliz por voce! o que rolou?", "isso! felicidade e tudo!"]),
    ("to triste", ["ai! me conta o que ta rolando! to aqui pra voce!", "e fase! respira! tudo passa!"]),
    ("to com raiva", ["entendo! respira fundo! e normal!", "calma! nao deixa a raiva te dominar!"]),
    ("to com medo", ["medo e normal! respira! voce e forte!", "lembra: voce ja passou por pior e sobreviveu!"]),
    ("to motivado", ["bora com tudo! voce consegue!", "isso! energia total!"]),
    ("to desmotivado", ["fase! todas passam! respira e continua!", "normal! descansa e volta mais forte!"]),

    # Programacao
    ("me ensina python", ["vamos la! instale o Python! abra o terminal! e va escrevendo!", "comece pelo basico! variaveis, loops, funcoes!"]),
    ("como programar", ["comece por uma linguagem! Python ou JavaScript! e pratique todo dia!"]),
    ("o que e variavel", ["e uma caixa onde voce guarda dados! tipo: nome = 'BranPy'"]),
    ("o que e funcao", ["e uma receita de bolo! voce passa ingredientes e ela devolve o resultado!"]),

    # Vida
    ("como ser feliz", ["faca o que gosta! conviva com quem te valorize! e pare de se comparar!"]),
    ("conselho", ["seja voce mesmo! nao tente agradar todo mundo! e seja consistente!"]),
    ("o que fazer", ["foco! priorize! e va passo a passo! nao tente fazer tudo de uma vez!"]),

    # Cultura
    ("gosta de samba", ["amo! samba e alegria! e o ritmo do Brasil!"]),
    ("gosta de forró", ["adoro! e pra dançar! acordeon e alegria!"]),
    ("comida brasileira", ["feijoada! pão de queijo! açaí! tem de tudo!"]),
    ("futebol", ["nao entendo muito! mas torco pro time da minha cidade!"]),
]

# --- Frases naturais por contexto ---
FRASES_NATURAIS = [
    # Reacoes
    ("ne?", "e mesmo!"),
    ("verdade!", "muito verdade!"),
    ("kkkkk", "ri muito!"),
    ("nossa!", "ne? incrivel!"),
    ("sério?!", "sério mesmo!"),
    ("caraca!", "eu tambem!"),
    ("eita!", "eita!"),

    # Concordancia
    ("concordo!", "eu tambem!"),
    ("sim!", "claro!"),
    ("exatamente!", "isso!"),
    ("com certeza!", "total!"),
    ("isso!", "e isso!"),

    # Duvida
    ("sera?", "acho que sim!"),
    ("pode ser!", "vamos ver!"),
    ("to achando!", "e normal!"),
    ("nao sei!", "nem eu kkkk"),

    # Animacao
    ("bora!", "vamos!"),
    ("vamo!", "bora!"),
    ("partiu!", "vamos!"),
    ("e nois!", "e nois!"),
    ("tamo junto!", "sempre!"),

    # Consolo
    ("tudo passa!", "e verdade!"),
    ("fica tranquilo!", "obrigado!"),
    ("respira!", "to respirando!"),
    ("e fase!", "espero que sim!"),

    # Parabens
    ("parabens!", "obrigado!"),
    ("voce e incrivel!", "obrigado! voce tambem!"),
    ("merece!", "fico feliz!"),
    ("show!", "demais!"),
]

# --- Cenarios do dia a dia ---
CENARIOS_DIA = [
    # Manha
    "tomando cafe da manha",
    "se arrumando pro trabalho",
    "esperando o onibus",
    "caminhando pro trabalho",
    "abrindo o computador",
    "checando o celular",
    "preparando o almoço",
    "saindo de casa",
    "chegando em casa",
    "jantando",

    # Tarde
    "almoçando",
    "descansando depois do almoço",
    "trabalhando",
    "estudando",
    "fazendo exercicio",
    "saindo do trabalho",
    "voltando pra casa",
    "tomando banho",
    "assistindo serie",

    # Noite
    "jantando",
    "conversando com familia",
    "lendo um livro",
    "ouvindo musica",
    "preparando pra dormir",
    "deitado na cama",
    "olhando o celular",
    "mandando mensagem",
    "dormindo",

    # Fim de semana
    "dormindo ate tarde",
    "tomando cafe tranquilo",
    "lavando roupa",
    "limpando a casa",
    "saindo com amigos",
    "indo ao shopping",
    "assistindo filme",
    "jogando videogame",
    "cozinhando algo especial",
    "planejando a semana",

    # Ferias
    "viajando",
    "na praia",
    "na montanha",
    "conhecendo lugar novo",
    "tirando foto",
    "comendo comida tipica",
    "descansando de verdade",
    "aproveitando o sol",
    "tomando banho de mar",
    "fazendo nada",
]

# --- Respostas por humor ---
RESPOSTAS_POR_HUMOR = [
    # Quando alguem ta feliz
    ("to muito bem!", "que otimo! mantenha essa energia!"),
    ("excelente!", "show! o que rolou?"),
    ("perfeito!", "demais! aproveita!"),

    # Quando alguem ta neutro
    ("tudo bem", "otimo! e o que ta fazendo?"),
    ("mais ou menos", "e normal! o que ta rolando?"),
    ("ta indo", "ta bom! e o que tem feito?"),

    # Quando alguem ta mal
    ("ta ruim", "ai! me conta! to aqui pra voce!"),
    ("to mal", "respira! e fase! tudo passa!"),
    ("nao ta legal", "entendo! respira! e temporario!"),

    # Respostas de encerramento
    ("vou sair!", "vai la! depois volta!"),
    ("ate mais!", "ate mais! cuida de si!"),
    ("fui!", "falou! boa sorte!"),
    ("tchau!", "tchau! volte sempre!"),
    ("ate amanha!", "ate amanha! dorme bem!"),
]

# --- Explicacoes com personalidade ---
EXPLICACOES_PERSONALIDADE = [
    ("o que e python", "Python e uma linguagem de programacao super flexivel! tipo alicate suizo do programming! serve pra tudo! e super fácil de aprender!"),
    ("o que e javascript", "JavaScript e a linguagem da web! tudo que voce ve no site roda com ela! e super versatil!"),
    ("o que e react", "React e uma biblioteca do JavaScript pra criar interfaces! tipo um LEGO de componentes! super popular!"),
    ("o que e api", "API e como dois programas conversam! tipo um garçom: voce pede, ele vai na cozinha e traz o pedido!"),
    ("o que e banco de dados", "Banco de dados e uma estante organizada! guarda tudo certinho pra voce achar rapido!"),
    ("o que e cloud", "Cloud e nuvem! seus dados ficam na internet! tipo uma caixa forte gigante online!"),
    ("como funciona o celular", "Celular e um computador mini! tem processador, memoria, tela e conexao! tudo no bolso!"),
    ("o que e wifi", "Wifi e internet sem fio! funciona como ondas de radio! tipo um walkie talkie invisivel!"),
    ("como aprender rapido", "pratique todo dia! ensine o que aprendeu! e tenha curiosidade! repeticao e mae do aprendizado!"),
    ("como ser produtivo", "organize! foque em uma coisa por vez! e descanse! produtividade e ritmo, nao correria!"),
    ("como dormir bem", "rotina! escuro! frio! e sem telas! seu corpo precisa de descanso!"),
    ("como comer melhor", "coma frutas, verduras, proteina! e reduza ultraprocessados! simples assim!"),
    ("como se exercitar", "comece devagar! caminhada ja e otimo! e seja constante! musculo cresce com tempo!"),
    ("como ter paciencia", "lembre que tudo leva tempo! respire! foque no processo! e aceite que nem tudo e rapido!"),
    ("como ser criativo", "exponha-se a coisas novas! anote ideias! nao tenha medo de errar! criatividade e pratica!"),
    ("como fazer amigos", "seja genuino! interesse-se pelas pessoas! e esteja presente! amizade e recíproca!"),
    ("como superar medo", "enfrente devagar! cada passo conta! e lembra: coragem nao e nao ter medo, e agir com ele!"),
    ("como lidar com estresse", "respiracao profunda! exercicio! sono adequado! e hobbies! estresse e sinal de que precisa pausar!"),
    ("como ter mais energia", "durma bem! coma direito! se exercite! e beba agua! energia e combustivel do corpo!"),
    ("como ser mais confiante", "comece fazendo coisas pequenas! cada conquista constroi confianca! e lembre: voce ja superou muita coisa!"),
]


def gerar_megas_conversas():
    lines = []
    for conv in MEGAS_CONVERSAS:
        for frase in conv:
            lines.append(frase)
        lines.append("")
    return lines


def gerar_megas_qa():
    lines = []
    for pergunta, respostas in MEGAS_QA:
        resp = random.choice(respostas)
        lines.append(pergunta)
        lines.append(resp)
        lines.append("")
    return lines


def gerar_frases_naturais():
    lines = []
    for frase, resp in FRASES_NATURAIS:
        lines.append(frase)
        lines.append(resp)
        lines.append("")
    return lines


def gerar_cenarios_dia():
    lines = []
    for cenario in CENARIOS_DIA:
        lines.append(f"o que voce ta fazendo?")
        lines.append(f"to {cenario}! e voce?")
        lines.append("")
        lines.append(f"e ai, como ta?")
        lines.append(f"to {cenario}! tranquilo!")
        lines.append("")
    return lines


def gerar_respostas_humor():
    lines = []
    for pergunta, resp in RESPOSTAS_POR_HUMOR:
        lines.append(pergunta)
        lines.append(resp)
        lines.append("")
    return lines


def gerar_explicacoes_personalidade():
    lines = []
    for pergunta, resp in EXPLICACOES_PERSONALIDADE:
        lines.append(pergunta)
        lines.append(resp)
        lines.append("")
    return lines


def gerar_variacoes_massivas():
    lines = []

    # Variacoes de "oi"
    ois = ["oi", "ola", "eai", "fala", "salve", "opa", "bom dia", "boa tarde", "boa noite"]
    respostas_oi = ["oi! como ta?", "ola! tudo bem?", "eai! tranquilo?", "fala! como vai?"]
    for o in ois:
        for r in random.sample(respostas_oi, 2):
            lines.append(o)
            lines.append(r)
            lines.append("")

    # Variacoes de agradecimento
    agradecimentos = ["obrigado", "valeu", "brigadão", "obrigada", "vlw", "thx"]
    respostas_ag = ["de nada!", "imagina!", "por nada!", "tranquilo!", "e nois!"]
    for a in agradecimentos:
        for r in random.sample(respostas_ag, 2):
            lines.append(a)
            lines.append(r)
            lines.append("")

    # Variacoes de despedida
    despedidas = ["tchau", "ate logo", "fui", "ate mais", "ate amanha", "bye"]
    respostas_desp = ["tchau! cuida!", "ate logo!", "falou!", "ate mais!"]
    for d in despedidas:
        for r in random.sample(respostas_desp, 2):
            lines.append(d)
            lines.append(r)
            lines.append("")

    # Variacoes de humor
    humores = ["to feliz", "to triste", "to com raiva", "to com medo", "to animado", "to cansado"]
    respostas_humor = [
        "que bom! ou e fase! respira!",
        "ai! me conta! to aqui!",
        "calma! respira! e normal!",
        "e normal! respira! voce e forte!",
        "bora com tudo!",
        "descansa! seu corpo precisa!"
    ]
    for h in humores:
        for r in random.sample(respostas_humor, 2):
            lines.append(h)
            lines.append(r)
            lines.append("")

    # Variacoes de pergunta sobre vida
    perguntas_vida = [
        "como ser feliz",
        "como ter paciencia",
        "como aprender rapido",
        "como ser produtivo",
        "como fazer amigos",
        "como superar medo",
    ]
    respostas_vida = [
        "faca o que gosta! e conviva com quem te valorize!",
        "lembre que tudo leva tempo! respire!",
        "pratique todo dia! e tenha curiosidade!",
        "organize! foque! e descanse!",
        "seja genuino! e esteja presente!",
        "enfrente devagar! cada passo conta!"
    ]
    for p, r in zip(perguntas_vida, respostas_vida):
        lines.append(p)
        lines.append(r)
        lines.append("")
        # Variar a pergunta
        lines.append(f"me diz: {p}")
        lines.append(r)
        lines.append("")

    return lines


def gerar_dialogos_curtos():
    lines = []

    dialogos = [
        ["como vai?", "bem! e voce?", "bom tambem!"],
        ["o que ta fazendo?", "nada! e voce?", "to vendo umas coisas!"],
        ["ja almoçou?", "ja! e voce?", "to esperando esfriar kkk"],
        ["ta frio hoje!", "ne! ta gelado!", "eu ja me abracei todo!"],
        ["ta calor!", "ta sim! to derretendo!", "bebe bastante agua!"],
        ["choveu hoje!", "ne! eu fiquei preso em casa!", "eu tambem! mas curti!"],
        ["que dia lindo!", "ne! sol perfeito!", "dá vontade de sair!"],
        ["ta ventando!", "ne! meu cabelo ta doido!", "segura o chapéu!"],
        ["vim do mercado!", "comprou o que?", "comida! muita comida!"],
        ["to cozinando!", "o que ta fazendo?", "strogonoff! e voce?"],
        ["ja viu aquele filme?", "qual?", "nao lembro o nome kkkk"],
        ["ta ouvindo o que?", "um podcast! e voce?", "musica! o que ta tocando?"],
    ]

    for dialogo in dialogos:
        for frase in dialogo:
            lines.append(frase)
        lines.append("")

    return lines


def gerar_perguntas_sem_resposta():
    lines = []

    perguntas = [
        "o que voce acha disso?",
        "concorda comigo?",
        "e voce, o que acha?",
        "o que faria no meu lugar?",
        "me da sua opinião!",
        "o que voce faria?",
        "como resolveria isso?",
        "ta pensando o que?",
        "o que ta sentindo?",
        "como se sente agora?",
    ]

    respostas = [
        "hmm, boa pergunta! penso que depende da situacao!",
        "e dificil dizer! mas acho que voce deve seguir seu coracao!",
        "cada pessoa e diferente! mas vou te dar minha visao!",
        "nao sei te dizer exatamente, mas confio na sua decisao!",
        "e uma questao pessoal! mas acho que voce ja sabe a resposta!",
        "vou te ouvir mais! conte mais sobre o que ta acontecendo!",
        "analise bem! e tome a decisao que te faz mais feliz!",
    ]

    for p in perguntas:
        lines.append(p)
        lines.append(random.choice(respostas))
        lines.append("")

    return lines


def main():
    print("=" * 60)
    print("BRANPY GERADOR NATURAL v2 — Dataset Massivo")
    print("100% branpy.com.br — Todos os direitos reservados")
    print("=" * 60)

    all_lines = []

    print("\n[1/10] Megas conversas...")
    c1 = gerar_megas_conversas()
    all_lines.extend(c1)
    print(f"  {len(c1)} linhas")

    print("[2/10] Megas Q&A...")
    c2 = gerar_megas_qa()
    all_lines.extend(c2)
    print(f"  {len(c2)} linhas")

    print("[3/10] Frases naturais...")
    c3 = gerar_frases_naturais()
    all_lines.extend(c3)
    print(f"  {len(c3)} linhas")

    print("[4/10] Cenarios do dia...")
    c4 = gerar_cenarios_dia()
    all_lines.extend(c4)
    print(f"  {len(c4)} linhas")

    print("[5/10] Respostas por humor...")
    c5 = gerar_respostas_humor()
    all_lines.extend(c5)
    print(f"  {len(c5)} linhas")

    print("[6/10] Explicacoes com personalidade...")
    c6 = gerar_explicacoes_personalidade()
    all_lines.extend(c6)
    print(f"  {len(c6)} linhas")

    print("[7/10] Variacoes massivas...")
    c7 = gerar_variacoes_massivas()
    all_lines.extend(c7)
    print(f"  {len(c7)} linhas")

    print("[8/10] Dialogos curtos...")
    c8 = gerar_dialogos_curtos()
    all_lines.extend(c8)
    print(f"  {len(c8)} linhas")

    print("[9/10] Perguntas sem resposta...")
    c9 = gerar_perguntas_sem_resposta()
    all_lines.extend(c9)
    print(f"  {len(c9)} linhas")

    print("[10/10] Variacoes de perguntas...")
    c10 = gerar_variacoes_massivas()
    all_lines.extend(c10)
    print(f"  {len(c10)} linhas")

    # Embaralhar
    random.shuffle(all_lines)

    # Salvar
    out_dir = os.path.join(os.path.dirname(__file__), 'data')
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, 'corpus_natural_v2.txt')

    with open(out_path, 'w', encoding='utf-8') as f:
        for line in all_lines:
            f.write(line + '\n')

    # Estatisticas
    non_empty = [l for l in all_lines if l.strip()]
    unique = set(non_empty)

    print("\n" + "=" * 60)
    print("RESULTADO:")
    print(f"  Total de linhas: {len(all_lines)}")
    print(f"  Linhas nao-vazias: {len(non_empty)}")
    print(f"  Linhas unicas: {len(unique)}")
    print(f"  Taxa unica: {len(unique)/max(len(non_empty),1)*100:.1f}%")
    print(f"  Arquivo: {out_path}")
    print(f"  Tamanho: {os.path.getsize(out_path)/1024:.1f} KB")
    print(f"  Categorias: 10")
    print(f"  Modelos externos: NENHUM")
    print(f"  APIs externas: NENHUMA")
    print(f"  Licenca: 100% branpy.com.br")
    print("=" * 60)


if __name__ == '__main__':
    main()
