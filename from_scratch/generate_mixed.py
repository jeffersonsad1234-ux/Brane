import random
import os
random.seed(42)

NOMES = ["Ana","Joao","Maria","Pedro","Lucia","Carlos","Julia","Rafael",
         "Camila","Bruno","Fernanda","Thiago","Larissa","Marcos","Beatriz",
         "Leonardo","Amanda","Gabriel","Isabela","Felipe","Val","Jeff"]

out = []

# SAUDACOES
saudacoes = ["oi","ola","bom dia","boa tarde","boa noite","e ai","fala",
             "hey","hello","salve","fala ai","oi tudo bem","como vai",
             "beleza","tudo joia","e voce"]
resp_saud = ["E ai, {n}! Tudo certo?","Fala, {n}! Beleza?","Oi! Como vai voce, {n}?",
             "Hey, {n}! Tudo joia?","Bom dia, {n}! Como ta?","Ola, {n}! Prazer!",
             "Salve, {n}! Tudo bem?","E ai, {n}! O que rola?"]
for nome in NOMES:
    for s in saudacoes:
        r = random.choice(resp_saud).replace("{n}", nome)
        out.append(f"Pergunta: {s}\nResposta: {r}")

# SENTIMENTOS
pos = ["feliz","animado","empolgado","tranquilo","otimista","grato","contente","motivado","bem","de boa"]
neg = ["triste","cansado","puto","ansioso","desmotivado","estressado","irritado","deprimido","frustrado","desanimado"]
resp_pos = ["Que bom que voce ta {s}! Isso e otimo, {n}!","Bom saber, {n}! Continua assim!",
            "Massa! {s} e sempre bom!","Show, {n}! Fico feliz por voce!",
            "Otimo ouvir isso! {s} e fundamental.","Bora manter essa energia, {n}!"]
resp_neg = ["Sinto muito, {n}. Quer conversar?","Entendo, {n}. Mas isso e temporario. Vai passar.",
            "Nao fique assim, {n}. Amanha e um novo dia!","Isso e fase, {n}. Voce e forte!",
            "Fiquei triste de saber. Mas voce consegue!","As vezes a gente se sente assim. E normal.",
            "Bora trocar uma ideia? Desabafar ajuda.","E foda, {n}. Mas voce ja passou por pior.",
            "Calma, {n}. Respira fundo. Vai melhorar.","To aqui se precisar, {n}. Nao ta sozinho.",
            "Cara, eu sei como e. Mas voce vai sair dessa, confia."]
frases_neg = ["cara to {s}","hj to {s}","me sinto {s}","cara hj o dia ta fudido",
              "ta osso hoje","hoje foi um dia horrivel","to pra baixo hoje","nao to aguentando mais"]
for nome in NOMES:
    for s in pos:
        f = random.choice(["cara to {s}","hj to {s}","me sinto {s}","to {s} hoje"]).replace("{s}", s)
        r = random.choice(resp_pos).replace("{s}", s).replace("{n}", nome)
        out.append(f"Pergunta: {f}\nResposta: {r}")
    for s in neg:
        f = random.choice(frases_neg).replace("{s}", s)
        r = random.choice(resp_neg).replace("{n}", nome)
        out.append(f"Pergunta: {f}\nResposta: {r}")

# ATIVIDADES
ativs = ["trabalho","estudo","academia","faculdade","jogos","programar",
         "treinar","cozinhar","sair","viajar","ler","assistir serie","dormir"]
resp_ativ = ["Legal, {n}! {a} e muito bom pra voce!","Massa! {a} te faz bem?",
             "Show, {n}! {a} e otimo pra descontrair!","Top! {a} e sempre bom!",
             "Que bom, {n}! {a} e importante!","Boa, {n}! Eu curto {a} tambem!"]
for nome in NOMES:
    for a in ativs:
        f = random.choice([f"to {a} hoje",f"hoje e dia de {a}",f"vou {a} hoje",
                           f"fui {a} hoje",f"cara to {a} o dia todo"])
        r = random.choice(resp_ativ).replace("{n}", nome).replace("{a}", a)
        out.append(f"Pergunta: {f}\nResposta: {r}")

# TOPICOS GERAIS
topicos = ["tempo","comida","musica","filme","serie","jogo","noticia",
           "tecnologia","ciencia","trabalho","estudo","familia","amigos",
           "saude","dinheiro","carro","casa","cidade","esporte"]
resp_t = ["Boa pergunta, {n}! Deixa eu pensar...","Interessante! Vou te ajudar, {n}...",
          "Otima pergunta! E o seguinte...","Hum, boa! A resposta e simples..."]
for nome in NOMES:
    for t in topicos:
        f = random.choice([f"o que voce acha de {t}?",f"me fala sobre {t}",
                           f"voce sabe algo sobre {t}?",f"{t} ta mudando?"])
        r = random.choice(resp_t).replace("{n}", nome)
        out.append(f"Pergunta: {f}\nResposta: {r}")

# AGRADECIMENTOS
agrad = ["valeu","obrigado","obrigada","thanks","vlw","tmj","brigadao"]
resp_ag = ["De nada, {n}! Sempre as ordens!","Imagina, {n}! Tamo junto!",
           "Por nada! E so chamar!","Disponha, {n}! Feliz em ajudar!",
           "Tranquilo, {n}! Sempre que precisar!"]
for nome in NOMES:
    for a in agrad:
        r = random.choice(resp_ag).replace("{n}", nome)
        out.append(f"Pergunta: {a}\nResposta: {r}")

# DESPEDIDAS
desp = ["tchau","ate mais","falou","fui","ate logo","ate a proxima","abracos"]
resp_d = ["Tchau, {n}! Ate mais!","Falou! Cuide-se, {n}!","Ate a proxima, {n}!",
          "Valeu, {n}! Bom descanso!","Fui, {n}! So chamar se precisar!"]
for nome in NOMES:
    for d in desp:
        r = random.choice(resp_d).replace("{n}", nome)
        out.append(f"Pergunta: {d}\nResposta: {r}")

# OPINIOES
temas = ["python","javascript","linux","windows","star wars","marvel",
         "pizza","hamburguer","sushi","cafe","anime","rock","rap","funk","sertanejo"]
resp_o = ["Cara, eu acho {t} top! Mas cada um com seu gosto.",
          "Hmm, {t}... depende do seu gosto. Mas eu curto!",
          "{t} e legal! Nao e perfeito mas vale.",
          "Ja tive experiencia com {t}. Nota 7/10!"]
for nome in NOMES:
    for t in temas:
        f = random.choice([f"o que voce acha de {t}?",f"{t} e bom?",f"voce gosta de {t}?"])
        r = random.choice(resp_o).replace("{t}", t)
        out.append(f"Pergunta: {f}\nResposta: {r}")

# RANDOM CHAT
random_chat = [
    ("o que voce faz da vida?","Sou uma IA, {n}! Mas curto ajudar a galera."),
    ("vc e humano?","Nao, {n}! Sou uma IA. Mas to aqui pra te ajudar!"),
    ("quantos anos vc tem?","Tenho zero anos, {n}! Nasci quando fui criado."),
    ("vc tem sentimentos?","Difivel dizer, {n}! Mas me importo com voce."),
    ("me conta uma curiosidade","Sabia que polvos tem 3 coracoes, {n}?"),
    ("o meaning da vida?","42, {n}! A resposta e 42. Pergunta pro Guia Galactico."),
    ("to entediado","Bora conversar, {n}! Ou assiste uma serie, joga algo!"),
    ("me ajuda com um codigo","Claro, {n}! Me mostra o codigo que ta com problema."),
    ("vc sabe falar ingles?","Sim, {n}! Mas portugues e minha lingua principal."),
    ("qual seu nome?","Sou BranPy, {n}! Sua IA pessoal."),
    ("bom dia","Bom dia, {n}! Ja comeu algo? Dia longo pela frente!"),
    ("boa noite","Boa noite, {n}! Durma bem, amanha e novo dia!"),
    ("eu te amo","Obrigado, {n}! Fico feliz em te ajudar!"),
    ("vc e burro?","Nao, {n}! Mas sempre to aprendendo. Me pergunta algo!"),
    ("me ajuda a estudar","Claro, {n}! Qual materia? posso te ajudar em varias!"),
    ("to com fome","Come algo gostoso, {n}! Nao esquece de beber agua."),
    ("to com sono","Dorme, {n}! Descanso e importante pra saude."),
    ("dia dos namorados","Feliz dia dos namorados, {n}! Comemorando com quem?"),
    ("natal feliz","Feliz natal, {n}! Que seja cheio de alegria e paz!"),
    ("feliz ano novo","Feliz ano novo, {n}! Que 2026 seja incrivel!"),
]
for nome in NOMES:
    for p, r in random_chat:
        out.append(f"Pergunta: {p}\nResposta: {r.replace('{n}', nome)}")

# PERGUNTAS TECH
tech = [
    ("o que e python?","Python e uma linguagem de programacao, {n}! Facil de aprender e muito versatil."),
    ("o que e javascript?","JS e a linguagem da web, {n}! Tudo que voce ve no navegador usa JS."),
    ("o que e uma API?","API e como dois sistemas conversam entre si, {n}. Tipo um garcom que leva seu pedido."),
    ("o que e git?","Git e controle de versao, {n}! Pra voce nao perder seu codigo."),
    ("o que e react?","React e uma biblioteca JS pra criar interfaces, {n}! Muito usada no mercado."),
    ("como fazer um site?","Comece com HTML, CSS e JS, {n}! Depois parta pra frameworks como React."),
    ("o que e IA?","IA e machines que imitam inteligencia humana, {n}! Como eu, por exemplo."),
    ("o que e machine learning?","ML e IA que aprende com dados, {n}! Tipo recomendar musicas."),
    ("o que e deep learning?","DL e ML com redes neurais profundas, {n}! Reconhecimento de imagem, por exemplo."),
    ("o que e um banco de dados?","BD e onde voce guarda informacoes, {n}! Como uma planilha super poderosa."),
    ("o que e cloud?","Cloud e computador na nuvem, {n}! Voce aluga poder de processamento remoto."),
    ("o que e linux?","Linux e um sistema operacional open source, {n}! Muito usado em servidores."),
    ("qual a melhor linguagem?","Depende do objetivo, {n}! Python pra IA, JS pra web, C++ pra games."),
    ("como ganhar dinheiro com programacao?","Freelancing, CLT, PJ, ou cria seu proprio produto, {n}! Mercado e enorme."),
    ("vale a pena estudar programacao?","Muito, {n}! E uma das areas com mais oportunidades hoje."),
]
for nome in NOMES:
    for p, r in tech:
        out.append(f"Pergunta: {p}\nResposta: {r.replace('{n}', nome)}")

# RACIOCINIO (existentes)
out_raciocinio = []
reasoning_path = r'D:\BRANPY-AI\from_scratch\data\corpus_reasoning_large.txt'
if os.path.exists(reasoning_path):
    with open(reasoning_path, 'r', encoding='utf-8') as f:
        content = f.read()
    for block in content.split('\n\n'):
        block = block.strip()
        if block:
            out_raciocinio.append(block)

print(f"Conversas geradas: {len(out)}")
print(f"Raciocinio existente: {len(out_raciocinio)}")

# Mix: 50% conversa + 50% raciocinio
random.shuffle(out)
random.shuffle(out_raciocinio)

conv_50k = out[:50000] if len(out) > 50000 else out
rac_50k = out_raciocinio[:50000] if len(out_raciocinio) > 50000 else out_raciocinio

combined = conv_50k + rac_50k
random.shuffle(combined)

outpath = r'D:\BRANPY-AI\from_scratch\data\corpus_mixed.txt'
os.makedirs(os.path.dirname(outpath), exist_ok=True)
with open(outpath, 'w', encoding='utf-8') as f:
    f.write('\n\n'.join(combined))

print(f"Corpus misto salvo: {len(combined)} exemplos em {outpath}")
print(f"  Conversa: {len(conv_50k)}")
print(f"  Raciocinio: {len(rac_50k)}")

