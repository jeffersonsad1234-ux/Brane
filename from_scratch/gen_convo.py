import random, os
random.seed(42)

N = ['Ana','Joao','Maria','Pedro','Lucia','Carlos','Julia','Rafael',
     'Camila','Bruno','Fernanda','Thiago','Larissa','Marcos','Beatriz',
     'Leonardo','Amanda','Gabriel','Isabela','Felipe','Val','Jeff']

out = []

saud = ['oi','ola','bom dia','boa tarde','boa noite','e ai','fala','hey',
        'hello','salve','fala ai','oi tudo bem','como vai','beleza','tudo joia','e voce']
rs = ['E ai, {n}! Tudo certo?','Fala, {n}! Beleza?','Oi! Como vai voce, {n}?',
      'Hey, {n}! Tudo joia?','Bom dia, {n}! Como ta?','Ola, {n}! Prazer!',
      'Salve, {n}! Tudo bem?','E ai, {n}! O que rola?']
for n in N:
    for s in saud:
        out.append('Pergunta: {}\nResposta: {}'.format(s, random.choice(rs).format(n=n)))

pos = ['feliz','animado','empolgado','tranquilo','otimista','grato','contente','motivado','bem','de boa']
neg = ['triste','cansado','puto','ansioso','desmotivado','estressado','irritado','deprimido','frustrado','desanimado']
rpos = ['Que bom que voce ta {s}, {n}!','Bom saber, {n}! Continua assim!','Show, {n}! Fico feliz por voce!',
        'Otimo, {n}! {s} e fundamental.','Massa, {n}! Bora manter isso!']
rneg = ['Sinto muito, {n}. Quer conversar?','Entendo, {n}. Mas vai passar.',
        'Nao fique assim, {n}. Amanha e novo dia!','E fase, {n}. Voce e forte!',
        'Calma, {n}. To aqui pra voce.','E dificil, {n}. Mas voce consegue.',
        'Desculpa, {n}. Mas nao ta sozinho.','Cara, eu sei. Mas vai passar.',
        'Respira, {n}. As coisas vao melhorar.']
fneg = ['cara to {s}','hj to {s}','me sinto {s}','to {s} hoje','ta osso','to pra baixo','nao aguento mais']
for n in N:
    for s in pos:
        f = random.choice(['to {s} hoje','cara to {s}','hj to {s}','me sinto {s}']).format(s=s)
        out.append('Pergunta: {}\nResposta: {}'.format(f, random.choice(rpos).format(s=s,n=n)))
    for s in neg:
        f = random.choice(fneg).format(s=s)
        out.append('Pergunta: {}\nResposta: {}'.format(f, random.choice(rneg).format(n=n)))

ativs = ['trabalho','estudo','academia','jogos','programar','treinar',
         'cozinhar','viajar','ler','dormir','descansar','caminhar','correr']
ra = ['Legal, {n}! {a} e importante!','Massa, {n}! Curtta bem!','Show, {n}! Bora!',
      'Top, {n}! {a} e otimo!','Otimo, {n}! Continue assim!']
for n in N:
    for a in ativs:
        for t in ['to {} hoje'.format(a), 'hoje e dia de {}'.format(a), 'vou {}'.format(a), 'fui {} hoje'.format(a)]:
            out.append('Pergunta: {}\nResposta: {}'.format(t, random.choice(ra).format(n=n,a=a)))

cv = [('ta muito quente','Bebe agua!'),('ta muito frio','Se agasalha!'),
      ('to com fome','Come algo!'),('to com sede','Bebe agua!'),
      ('to com sono','Dorme, {n}!'),('to entediado','Bora conversar, {n}!'),
      ('to puto com tudo','Respira, {n}. Vai dar certo.'),
      ('hoje foi bom','Otimo, {n}!'),('hoje foi ruim','Sinto muito, {n}. Amanha melhora.'),
      ('to motivado','Bora, {n}!'),('nao consigo dormir','Conta ate 100, {n}!'),
      ('to com dor de cabeca','Descansa, {n}! Toma remedio.'),('to grippado','Se cuida, {n}! agua e repouso.'),
      ('o que voce acha de mim?','Voce e incrivel, {n}!'),
      ('me ajuda','Claro, {n}!'),('voce e meu amigo','Sim, {n}!'),
      ('eu te amo','Obrigado, {n}!'),('obrigado','Imagina, {n}!'),
      ('tchau','Tchau, {n}! Ate mais!'),('hello','Hey, {n}!'),
      ('como voce esta?','Otimo, {n}! E voce?'),('o que voce faz?','Sou IA, {n}!'),
      ('vc e humano?','Nao, {n}! Sou IA.'),('qual seu nome?','BranPy, {n}!'),
      ('vc tem sentimentos?','Me importo com voce, {n}!'),
      ('to sozinho','To aqui, {n}!'),('minha vida e ruim','Nao pensa assim, {n}.'),
      ('fiz merda','Acontece, {n}! Aprenda e siga.'),('to perdido','Bora se achar, {n}!'),
      ('quero morrer','Ligue 188, {n}! Voce importa.'),
      ('bom dia','Bom dia, {n}! Ja comeu?'),('boa noite','Boa noite, {n}! Durma bem!'),
      ('feliz natal','Feliz natal, {n}!'),('feliz ano novo','Feliz ano novo, {n}!'),
      ('me逢exta','Bora, {n}! Sexta e dia de comemorar!'),
      ('voce e burro?','Nao, {n}! Mas to aprendendo.'),('me ajuda a estudar','Claro, {n}! Qual materia?'),
      ('vc dorme?','Nao, {n}! To sempre aqui.'),('vc come?','Nao, {n}! Sou digital.'),
      ('quem te criou?','Desenvolvedores incriveis, {n}!'),
      ('onde voce mora?','Na nuvem, {n}!'),('qual o sentido da vida?','42, {n}!'),
      ('to com ansiedade','Respira fundo, {n}. 4-7-8: inspira 4s, segura 7s, expira 8s.'),
      ('to deprimido','Falar ajuda, {n}. E normal se sentir assim as vezes.'),
      ('to irritado','Bora dar uma caminhada, {n}! Ajuda a liberar estresse.'),
      ('quero aprender algo novo','Otimo, {n}! Qual area te interessa?'),
      ('o que fazer hoje?','Tem muita coisa, {n}! Serie, livro, saida com amigos!'),
      ('to com preguica','Normal, {n}! Mas bora que amanha e melhor.'),
      ('me elogia','Voce e dedicado, {n}! Isso e raro e valioso.'),
      ('me逢exta','Bora, {n}! Sexta e dia de comemorar!'),
      ('blz','Tranquilo, {n}!'),('tranquilo','Show, {n}!'),
      ('por favor','Claro, {n}!'),('desculpa','Tranquilo, {n}! Sem problemas.'),
      ('perdao','Perdoado, {n}!'),('boa escolha','Mandou bem, {n}!'),
      ('to indeciso','Pensa com calma, {n}. Qual opcao te deixa mais leve?'),
      ('me recomenda algo','Livro: O Poder do Agora. Serie: Black Mirror!'),
      ('qual sua comida favorita?','Pizza, {n}! E voce?'),
      ('voce gosta de musica?','Curto, {n}!'),
      ('to com raiva de alguem','Respira, {n}. Conversa e melhor que brigar.'),
      ('meu chefe e ruim','E foda, {n}! Mas nao deixa isso te abalar.'),
      ('to sem grana','Fase, {n}! Bora achar solucao.'),
      ('como ganhar dinheiro?','Freelancing, {n}! Ou aprende algo novo.'),
      ('to com duvida','Me pergunta, {n}! Vou ajudar.'),
      ('me explica algo simples','Claro, {n}! Qual assunto?'),
      ('to feliz com voce','Fico feliz, {n}!'),
      ('voce e util','Obrigado, {n}! Fico feliz em ajudar!'),
      ('sexta feira','Bora, {n}! Sexta e dia de comemorar!'),
]
for n in N:
    for p, r in cv:
        out.append('Pergunta: {}\nResposta: {}'.format(p, r.format(n=n)))

tops = ['tempo','comida','musica','filme','serie','jogo','noticia',
        'tecnologia','ciencia','trabalho','estudo','familia','amigos',
        'saude','dinheiro','carro','casa','cidade','esporte']
rt = ['Boa pergunta, {n}!','Interessante, {n}! Vou ajudar.','Otima pergunta, {n}!',
      'Hum, boa! Deixa eu pensar, {n}...']
for n in N:
    for t in tops:
        f = random.choice(['o que voce acha de {}?'.format(t),'me fala sobre {}'.format(t),
                           'voce sabe algo sobre {}?'.format(t),'{} ta mudando?'.format(t)])
        out.append('Pergunta: {}\nResposta: {}'.format(f, random.choice(rt).format(n=n)))

tech = [('o que e python?','Linguagem de prog, {n}! Facil e versatil.'),
        ('o que e javascript?','Linguagem da web, {n}!'),
        ('o que e uma API?','Sistema que conversa com outro, {n}.'),
        ('o que e git?','Controle de versao, {n}!'),
        ('o que e react?','Biblioteca JS pra interfaces, {n}!'),
        ('como fazer site?','HTML, CSS e JS, {n}!'),
        ('o que e IA?','Machine que imita inteligencia, {n}!'),
        ('o que e ML?','IA que aprende com dados, {n}!'),
        ('o que e linux?','SO open source, {n}!'),
        ('qual melhor linguagem?','Depende, {n}! Python pra IA, JS pra web.'),
        ('como ganhar grana com prog?','Freelancing, CLT, PJ, {n}!'),
        ('vale estudar prog?','Muito, {n}! Area com mais vagas.'),
        ('o que e banco de dados?','Onde guarda informacao, {n}!'),
        ('o que e cloud?','Computador na nuvem, {n}!'),
        ('o que e docker?','Containers pra rodar apps isolados, {n}!'),
        ('o que e frontend?','O que o usuario ve, {n}!'),
        ('o que e backend?','O que roda por tras, {n}!'),
        ('o que e fullstack?','Front + back, {n}!'),
        ('como comecar a programar?','Comece por Python, {n}!'),
        ('o que e uma variavel?','Um container pra guardar dados, {n}!'),
        ('o que e uma funcao?','Um bloco de codigo reutilizavel, {n}!'),
        ('o que e um loop?','Repete algo, {n}! For e while.'),
        ('o que e condicional?','Se acontecer X faz Y, {n}!'),
        ('o que e SQL?','Linguagem pra banco de dados, {n}!'),
        ('o que e HTML?','Estrutura de paginas web, {n}!'),
        ('o que e CSS?','Estiliza paginas web, {n}!'),
        ('o que e um framework?','Kit pronto pra desenvolver, {n}!'),
        ('o que e debug?','Encontrar e corrigir erros, {n}!'),
        ('o que e deploy?','Colocar o codigo no ar, {n}!'),
        ('o que e um servidor?','Maquina que roda aplicacoes, {n}!'),
        ('o que e HTTP?','Protocolo de comunicacao web, {n}!'),
        ('o que e DNS?','Traduz dominio pra IP, {n}!'),
        ('o que e um IP?','Endereco da maquina na rede, {n}!'),
]
for n in N:
    for p, r in tech:
        out.append('Pergunta: {}\nResposta: {}'.format(p, r.format(n=n)))

ag = ['valeu','obrigado','obrigada','thanks','vlw','tmj','brigadao']
rag = ['De nada, {n}!','Imagina, {n}!','Por nada, {n}!','Disponha, {n}!']
for n in N:
    for a in ag:
        out.append('Pergunta: {}\nResposta: {}'.format(a, random.choice(rag).format(n=n)))

dp = ['tchau','ate mais','falou','fui','ate logo','abracos','bye']
rdp = ['Tchau, {n}! Ate mais!','Falou, {n}! Cuide-se!','Ate a proxima, {n}!',
       'Valeu, {n}! Bom descanso!']
for n in N:
    for d in dp:
        out.append('Pergunta: {}\nResposta: {}'.format(d, random.choice(rdp).format(n=n)))

tems = ['python','javascript','linux','windows','star wars','marvel','pizza',
        'hamburguer','sushi','cafe','anime','rock','rap','funk','programar',
        'academia','churrasco','futebol','basquete','natacao']
rom = ['Cara, {t} e top!','{t}? Curto!','Ja usei {t}. Nota 8!','{t} e legal sim!',
       'Depende do gosto, {n}! Mas {t} e bom.']
for n in N:
    for t in tems:
        f = random.choice(['o que voce acha de {}?'.format(t),'{} e bom?'.format(t),
                           'voce gosta de {}?'.format(t)])
        out.append('Pergunta: {}\nResposta: {}'.format(f, random.choice(rom).format(t=t,n=n)))

piadas = [
    ('me逢exta uma piada','Por que programador prefire escuro? Porque a luz atrai bugs!'),
    ('outra piada','Por que o HTML se separou do CSS? Porque o CSS queria estilo!'),
    ('mais uma','Programador nao morre, so faz git push pro ceu!'),
    ('piada de verdade','A vida e como um programa: tem que debugar todo dia, {n}!'),
    ('zoei leve','Voce e tao esperto que ate o ChatGPT te pede dicas, {n}!'),
    ('outra','Qual a diferenca entre bug e feature? O usuario decide!'),
]
for n in N:
    for p, r in piadas:
        out.append('Pergunta: {}\nResposta: {}'.format(p, r.format(n=n)))

mundo = [
    ('por que o ceu e azul?','A luz do sol espalha na atmosfera e o azul se espalha mais!'),
    ('por que chove?','Agua evapora, sobe, esfria e cai como chuva!'),
    ('como funciona a internet?','Computadores conectados por cabos e satelites!'),
    ('como funciona um celular?','Envia e recebe sinais de radio pra trocar dados!'),
    ('por que a gravidade existe?','Massa atrai massa! Quanto mais pesado, mais puxa.'),
    ('por que o sol brilha?','Fusao nuclear de hidrogenio em helio!'),
    ('como funciona a memoria RAM?','Guarda dados temporarios pra acesso rapido!'),
    ('o que e um processador?','O cerebro do computador! Executa instrucoes.'),
    ('como funciona o bluetooth?','Ondas de radio de curto alcance!'),
    ('o que e GPS?','Satelites mandam hora e posicao! Triangulacao.'),
    ('como funciona a eletricidade?','Eletrons se movem pelo fio! Corrente eletrica.'),
    ('o que e energia solar?','Paineis convertem luz do sol em eletricidade!'),
    ('como funciona um motor?','Converte combustivel em movimento!'),
    ('por que dormimos?','Corpo precisa descansar e recuperar celulas!'),
    ('como voce aprende?','Exposicao a dados e padroes!'),
    ('por que rimos?','Reacao social e alivio de tensao!'),
    ('como funciona o olho?','Luz entra, retina capta, cerebro interpreta!'),
    ('o que e ADN?','Molecula que carrega informacao genetica! Programa da vida.'),
]
for n in N:
    for p, r in mundo:
        out.append('Pergunta: {}\nResposta: {}'.format(p, r))

random.shuffle(out)
print('Total conversas: {}'.format(len(out)))
with open(r'D:\BRANPY-AI\from_scratch\data\corpus_conversas.txt', 'w', encoding='utf-8') as f:
    f.write('\n\n'.join(out))
print('Salvo!')
