#!/usr/bin/env python3
"""Gera expansao massiva de perguntas - todas as categorias."""
import json, random, os, shutil, sys
from collections import Counter
from datetime import datetime

random.seed(42)

ROOT = os.path.dirname(os.path.abspath(__file__))
SEED = os.path.join(ROOT, 'quiz_seed', 'quiz_seed.json')
BACKUP = os.path.join(ROOT, 'quiz_seed', f'backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json')

with open(SEED, 'r', encoding='utf-8') as f:
    existing = json.load(f)
existing_by_cat = {}
for q in existing:
    existing_by_cat.setdefault(q.get('category','?'), []).append(q)
print(f"Existentes: {len(existing)}")

def q(pergunta, alternativas, correta, explicacao, categoria):
    return {"question": pergunta, "alternatives": alternativas, "correct": correta, "explanation": explicacao, "category": categoria}

def pick(correct, wrongs, n=3):
    wrongs = [w for w in wrongs if w and w != correct]
    sel = random.sample(wrongs, min(n, len(wrongs)))
    opts = [correct] + sel
    random.shuffle(opts)
    return opts, opts.index(correct)

def gen_para(cat, func, alvo=2000):
    """Gera questoes para uma categoria ate atingir alvo."""
    existentes = existing_by_cat.get(cat, [])
    atualmente = len(existentes)
    if atualmente >= alvo:
        print(f"  {cat}: ja tem {atualmente} (>= {alvo}), pulando")
        return []
    novas = func(cat, atualmente, alvo)
    print(f"  {cat}: {atualmente} -> {atualmente + len(novas)} (+{len(novas)})")
    return novas

# ============= GERADORES POR CATEGORIA =============

def gen_ingles(cat, atual, alvo):
    n = []
    # 200 palavras com traducao
    palavras = [
        ("apple", "maca", "fruta"), ("book", "livro", "leitura"), ("cat", "gato", "animal"),
        ("dog", "cachorro", "animal"), ("egg", "ovo", "comida"), ("fish", "peixe", "animal"),
        ("girl", "menina", "pessoa"), ("hat", "chapeu", "roupa"), ("ice", "gelo", "agua"),
        ("juice", "suco", "bebida"), ("key", "chave", "objeto"), ("lion", "leao", "animal"),
        ("milk", "leite", "bebida"), ("nest", "ninho", "ave"), ("owl", "coruja", "ave"),
        ("pen", "caneta", "objeto"), ("queen", "rainha", "realeza"), ("ring", "anel", "joia"),
        ("sun", "sol", "astro"), ("tree", "arvore", "planta"), ("umbrella", "guarda-chuva", "objeto"),
        ("van", "van", "veiculo"), ("water", "agua", "liquido"), ("box", "caixa", "objeto"),
        ("yard", "quintal", "casa"), ("zoo", "zoologico", "lugar"), ("arm", "braco", "corpo"),
        ("bag", "bolsa", "objeto"), ("cap", "bone", "roupa"), ("desk", "escrivaninha", "movel"),
        ("ear", "orelha", "corpo"), ("fan", "ventilador", "eletronico"), ("gun", "arma", "objeto"),
        ("ham", "presunto", "comida"), ("ink", "tinta", "material"), ("jar", "pote", "objeto"),
        ("kite", "pipa", "brinquedo"), ("lamp", "lampada", "objeto"), ("map", "mapa", "papel"),
        ("nut", "noz", "comida"), ("oak", "carvalho", "arvore"), ("pig", "porco", "animal"),
        ("quiz", "teste", "avaliacao"), ("rat", "rato", "animal"), ("sock", "meia", "roupa"),
        ("top", "topo", "posicao"), ("urn", "urna", "objeto"), ("vet", "veterinario", "profissao"),
        ("wig", "peruca", "roupa"), ("yarn", "la", "material"), ("angel", "anjo", "ser espiritual"),
        ("baker", "padeiro", "profissao"), ("candy", "doce", "comida"), ("dance", "danca", "arte"),
        ("eagle", "aguia", "ave"), ("flame", "chama", "fogo"), ("grape", "uva", "fruta"),
        ("house", "casa", "construcao"), ("igloo", "iglu", "casa"), ("jewel", "joia", "adorno"),
        ("knife", "faca", "utensilio"), ("lemon", "limao", "fruta"), ("music", "musica", "arte"),
        ("noble", "nobre", "pessoa"), ("ocean", "oceano", "agua"), ("piano", "piano", "instrumento"),
        ("river", "rio", "agua"), ("stone", "pedra", "material"), ("tiger", "tigre", "animal"),
        ("urban", "urbano", "cidade"), ("voice", "voz", "som"), ("wheat", "trigo", "planta"),
        ("actor", "ator", "profissao"), ("bloom", "florescer", "planta"), ("crane", "guindaste", "maquina"),
        ("doubt", "duvida", "sentimento"), ("earth", "terra", "planeta"), ("fairy", "fada", "ser"),
        ("giant", "gigante", "pessoa"), ("honey", "mel", "comida"), ("ivory", "marfim", "material"),
        ("joker", "coringa", "pessoa"), ("koala", "coala", "animal"), ("lunar", "lunar", "lua"),
        ("magic", "magia", "poder"), ("night", "noite", "tempo"), ("opera", "opera", "arte"),
        ("pilot", "piloto", "profissao"), ("quest", "busca", "acao"), ("robot", "robo", "maquina"),
        ("snake", "cobra", "animal"), ("tower", "torre", "construcao"), ("usher", "recepcionista", "profissao"),
        ("vivid", "vivo", "cor"), ("wagon", "carroca", "veiculo"), ("yacht", "iate", "veiculo"),
        ("zeal", "zelo", "sentimento"), ("brave", "corajoso", "adjetivo"), ("clean", "limpo", "adjetivo"),
        ("dream", "sonho", "pensamento"), ("elder", "idoso", "pessoa"), ("fleet", "frota", "grupo"),
        ("green", "verde", "cor"), ("happy", "feliz", "sentimento"), ("image", "imagem", "visual"),
        ("juicy", "suculento", "adjetivo"), ("knack", "talento", "habilidade"), ("latch", "tranca", "objeto"),
        ("moist", "umido", "adjetivo"), ("never", "nunca", "advrbio"), ("offer", "oferta", "acao"),
    ]
    for ing, port, dica in palavras:
        for lado in [0, 1]:
            if lado == 0:
                pergunta = f"How do you say '{port}' in English?"
                resp = ing.capitalize()
                erros = [p.capitalize() for p,_2,_3 in random.sample([(i,p,d) for i,p,d in palavras if i!=ing], 7)]
            else:
                pergunta = f"Qual a traducao de '{ing}' para o portugues?"
                resp = port.capitalize()
                erros = [p.capitalize() for _2,p,_3 in random.sample([(i,p,d) for i,p,d in palavras if p!=port], 7)]
            alts, ci = pick(resp, erros)
            ex = f"{ing} = {port}. Ex: I see the {ing}." if lado==0 else f"{ing} = {port}. Ex: Veja o/a {port}."
            n.append(q(pergunta, alts, ci, ex, cat))
    # Verbos
    verbos = [("eat","comer"),("drink","beber"),("sleep","dormir"),("run","correr"),("walk","andar"),
              ("talk","falar"),("read","ler"),("write","escrever"),("listen","ouvir"),("sing","cantar"),
              ("dance","dancar"),("buy","comprar"),("sell","vender"),("play","jogar"),("cook","cozinhar"),
              ("study","estudar"),("teach","ensinar"),("learn","aprender"),("work","trabalhar"),("swim","nadar"),
              ("fly","voar"),("jump","pular"),("climb","subir"),("draw","desenhar"),("paint","pintar")]
    for ing, port in verbos:
        for lado in [0,1]:
            if lado==0:
                pergunta = f"Como se diz '{port}' em ingles?"
                resp = ing.capitalize()
                erros = [v.capitalize() for v,_ in random.sample(verbos, 7) if v!=ing]
            else:
                pergunta = f"What is the Portuguese word for '{ing}'?"
                resp = port.capitalize()
                erros = [p.capitalize() for _,p in random.sample(verbos, 7) if p!=port]
            alts, ci = pick(resp, erros)
            n.append(q(pergunta, alts, ci, f"{ing} = {port}. I {ing} every day.", cat))
    # Numeros
    numeros = [(1,"one"),(2,"two"),(3,"three"),(4,"four"),(5,"five"),(6,"six"),(7,"seven"),
               (8,"eight"),(9,"nine"),(10,"ten"),(11,"eleven"),(12,"twelve"),(13,"thirteen"),
               (14,"fourteen"),(15,"fifteen"),(16,"sixteen"),(17,"seventeen"),(18,"eighteen"),
               (19,"nineteen"),(20,"twenty"),(30,"thirty"),(40,"forty"),(50,"fifty"),(60,"sixty"),
               (70,"seventy"),(80,"eighty"),(90,"ninety"),(100,"one hundred"),(1000,"one thousand")]
    for num, word in numeros:
        for lado in [0,1]:
            if lado==0:
                pergunta = f"How do you say the number {num} in English?"
                resp = word.capitalize()
                erros = [w.capitalize() for _,w in random.sample(numeros, 7) if w!=word]
            else:
                pergunta = f"What number is '{word}'?"
                resp = str(num)
                erros = [str(n) for n,_ in random.sample(numeros, 7) if n!=num]
            alts, ci = pick(resp, erros)
            n.append(q(pergunta, alts, ci, f"{num} = {word}.", cat))
    # Frases uteis
    frases = [("Bom dia","Good morning"),("Boa tarde","Good afternoon"),("Boa noite","Good night"),
              ("Obrigado","Thank you"),("Por favor","Please"),("Desculpe","Sorry"),("De nada","Youre welcome"),
              ("Sim","Yes"),("Nao","No"),("Oi","Hi"),("Tchau","Bye"),("Ate logo","See you later"),
              ("Como vai?","How are you?"),("Muito prazer","Nice to meet you"),("Eu quero","I want"),
              ("Eu preciso","I need"),("Eu gosto","I like"),("Eu posso","I can"),("Vamos","Lets go"),
              ("Ajuda","Help"),("Socorro","Help me"),("Cuidado","Careful"),("Devagar","Slowly"),
              ("Rapido","Quick"),("Aqui","Here"),("Ali","There"),("Agora","Now"),("Depois","Later"),
              ("Hoje","Today"),("Amanha","Tomorrow"),("Ontem","Yesterday"),("Sempre","Always"),
              ("Nunca","Never"),("As vezes","Sometimes"),("Ate","Until")]
    for port, ing in frases:
        for lado in [0,1]:
            if lado==0:
                pergunta = f"Como se diz '{port}' em ingles?"
                resp = ing
                erros = [i for p,i in random.sample(frases, 7) if i!=ing]
            elif lado==1:
                pergunta = f"Qual o significado de '{ing}'?"
                resp = port
                erros = [p for p,i in random.sample(frases, 7) if p!=port]
            alts, ci = pick(resp, erros)
            n.append(q(pergunta, alts, ci, f"{port} = {ing}.", cat))
    # Profissoes
    profs = [("medico","doctor"),("professor","teacher"),("engenheiro","engineer"),("advogado","lawyer"),
             ("enfermeiro","nurse"),("bombeiro","firefighter"),("policial","police officer"),
             ("cozinheiro","chef"),("piloto","pilot"),("dentista","dentist"),("juiz","judge"),
             ("arquiteto","architect"),("mecanico","mechanic"),("jornalista","journalist"),
             ("farmaceutico","pharmacist"),("veterinario","veterinarian"),("psicologo","psychologist"),
             ("programador","programmer"),("designer","designer"),("escritor","writer")]
    for port, ing in profs:
        pergunta = f"Como se diz '{port}' em ingles?"
        alts, ci = pick(ing.title(), [p.title() for _2,p in random.sample(profs, 7) if p!=ing])
        n.append(q(pergunta, alts, ci, f"{port} = {ing}.", cat))
    return n[:max(0, alvo - atual)]

def gen_portugues(cat, atual, alvo):
    n = []
    # Ortografia - S, SS, C, SC, X
    pares = [("excecao","excecao","e uma excecao a regra"),("ascensao","ascensao","subida"),
             ("cansado","cansado","de cansar"),("possivel","possivel","que se pode"),
             ("interesse","interesse","com SS"),("passageiro","passageiro","de passar"),
             ("professor","professor","com SS"),("sucesso","sucesso","com SS"),
             ("necessario","necessario","com SC"),("crescer","crescer","com SC"),
             ("nascer","nascer","com SC"),("piscina","piscina","com SC"),
             ("descer","descer","com SC"),("disciplina","disciplina","com SC"),
             ("excelente","excelente","com X e C"),("maximo","maximo","com X"),
             ("texto","texto","com X"),("contexto","contexto","com X"),
             ("expectativa","expectativa","com X"),("experiencia","experiencia","com X"),
             ("explicar","explicar","com X"),("expressao","expressao","com X"),
             ("extensao","extensao","com X"),("exterior","exterior","com X"),
             ("extremo","extremo","com X"),("exclusivo","exclusivo","com X"),
             ("exato","exato","com X"),("exame","exame","com X"),
             ("exemplo","exemplo","com X"),("exercicio","exercicio","com X"),
             ("exaustao","exaustao","com X"),("exibicao","exibicao","com X"),
             ("exigir","exigir","com X"),("existir","existir","com X"),
             ("exito","exito","com X"),("expansao","expansao","com X"),
             ("experto","experto","com X"),("explorar","explorar","com X"),
             ("expor","expor","com X"),("ex-presidente","ex-presidente","com X e hifen"),
             ("assinar","assinar","com SS"),("assistir","assistir","com SS"),
             ("assunto","assunto","com SS"),("assustar","assustar","com SS"),
             ("acessar","acessar","com SS"),("acesso","acesso","com SS"),
             ("processo","processo","com SS"),("profissao","profissao","com SS"),
             ("impressionar","impressionar","com SS"),("possessao","possessao","com SS")]
    for palavra, correto, dica in pares:
        resposta = correto.capitalize()
        errados = [p.capitalize() for p,c,_ in random.sample(pares, 7) if p!=palavra]
        errados_variantes = [palavra.replace('ss','ç').capitalize(), palavra.replace('c','ss').capitalize(),
                            palavra.replace('x','ch').capitalize(), palavra.replace('sc','ss').capitalize()]
        errados = list(set(errados + errados_variantes))
        random.shuffle(errados)
        errados = errados[:7]
        alts, ci = pick(resposta, errados)
        pergunta = f"Qual a grafia correta de '{palavra}'?"
        n.append(q(pergunta, alts, ci, f"'{correto}': {dica}.", cat))
    # Acentuacao
    acentos = [("saude","saude","hiato, acento no u"),("heroi","heroi","oxitona terminada em oi"),
               ("jovem","jovem","paroxitona, sem acento"),("album","album","paroxitona"),
               ("torax","torax","paroxitona terminada em x"),("hifen","hifen","paroxitona"),
               ("lingua","lingua","paroxitona com ditongo"),("serie","serie","paroxitona com ditongo"),
               ("medico","medico","proparoxitona"),("estomago","estomago","proparoxitona"),
               ("lampada","lampada","proparoxitona"),("ultimo","ultimo","proparoxitona"),
               ("transito","transito","proparoxitona"),("psicologo","psicologo","proparoxitona"),
               ("rubrica","rubrica","proparoxitona"),("liquido","liquido","proparoxitona"),
               ("musica","musica","proparoxitona"),("publico","publico","proparoxitona"),
               ("plastico","plastico","proparoxitona"),("telefone","telefone","paroxitona"),
               ("cafe","cafe","oxitona"),("pajem","pajem","paroxitona"),("carater","carater","paroxitona"),
               ("cateter","cateter","paroxitona"),("condor","condor","oxitona")]
    for palavra, correto, dica in acentos:
        resposta = correto.capitalize()
        errados = random.sample([c.capitalize() for _,c,_ in acentos if c!=correto] +
                               [palavra.capitalize(), palavra.upper(), palavra.lower()], 7)
        alts, ci = pick(resposta, errados)
        pergunta = f"Qual forma esta acentuada corretamente?" if random.random()<0.5 else f"Qual a acentuacao correta de '{palavra}'?"
        n.append(q(pergunta, alts, ci, f"'{correto}': {dica}.", cat))
    return n[:max(0, alvo - atual)]

def gen_matematica(cat, atual, alvo):
    n = []
    # Adicao
    for a in range(1, 51):
        for b in range(1, 51):
            r = a + b
            if random.random() < 0.08:
                qs = f"Quanto e {a} + {b}?"
                wr = [r + random.randint(-5,5) for _ in range(7)]
                wr = [w for w in wr if w != r and w >= 0]
                alts, ci = pick(str(r), [str(w) for w in wr[:4]])
                n.append(q(qs, alts, ci, f"{a} + {b} = {r}.", cat))
    # Subtracao
    for a in range(10, 51):
        for b in range(1, a):
            r = a - b
            if random.random() < 0.1:
                qs = f"Quanto e {a} - {b}?"
                wr = [r + random.randint(-5,5) for _ in range(7)]
                wr = [w for w in wr if w != r and w >= 0]
                alts, ci = pick(str(r), [str(w) for w in wr[:4]])
                n.append(q(qs, alts, ci, f"{a} - {b} = {r}.", cat))
    # Multiplicacao
    for a in range(1, 11):
        for b in range(1, 11):
            r = a * b
            if random.random() < 0.15:
                qs = f"Quanto e {a} x {b}?"
                wr = [r + random.randint(-5,5) for _ in range(7)]
                wr = [w for w in wr if w != r and w >= 0]
                alts, ci = pick(str(r), [str(w) for w in wr[:4]])
                n.append(q(qs, alts, ci, f"{a} x {b} = {r}. (tabuada do {a})", cat))
    # Divisao exata
    for a in range(1, 11):
        for b in range(1, 11):
            r = a * b
            if random.random() < 0.15:
                qs = f"Quanto e {r} / {a}?"
                wr = [b + random.randint(-3,3) for _ in range(7)]
                wr = [w for w in wr if w != b and w >= 1]
                alts, ci = pick(str(b), [str(w) for w in wr[:4]])
                n.append(q(qs, alts, ci, f"{r} / {a} = {b}.", cat))
    # Expressoes
    exprs = [(3,5,2,"3 + 5 x 2", 13, "Primeiro multiplica: 5x2=10, depois 3+10=13"),
             (4,6,3,"4 + 6 / 3", 6, "Primeiro divide: 6/3=2, depois 4+2=6"),
             (2,7,4,"2 x 7 - 4", 10, "2x7=14, 14-4=10"),
             (8,3,2,"8 - 3 x 2", 2, "3x2=6, 8-6=2"),
             (10,2,5,"10 / 2 + 5", 10, "10/2=5, 5+5=10"),
             (5,4,3,"5 x 4 - 3", 17, "5x4=20, 20-3=17"),
             (9,3,6,"9 / 3 + 6", 9, "9/3=3, 3+6=9"),
             (6,2,8,"6 x 2 + 8", 20, "6x2=12, 12+8=20"),
             (7,3,4,"7 + 3 x 4", 19, "3x4=12, 7+12=19"),
             (8,2,3,"8 - 2 x 3", 2, "2x3=6, 8-6=2")]
    for a,b,c,expr,res,expl in exprs:
        qs = f"Quanto e {expr}?"
        wr = [res + random.randint(-5,5) for _ in range(7)]
        wr = [w for w in wr if w != res]
        alts, ci = pick(str(res), [str(w) for w in wr[:4]])
        n.append(q(qs, alts, ci, expl, cat))
    # Porcentagem
    for pct in [10,15,20,25,30,40,50,60,70,75,80,90,100]:
        for val in [50,100,200,300,400,500]:
            res = int(val * pct / 100)
            qs = f"Quanto e {pct}% de {val}?"
            wr = [res + random.randint(-20,20) for _ in range(7)]
            wr = [w for w in wr if w != res and w >= 0]
            alts, ci = pick(str(res), [str(w) for w in wr[:4]])
            n.append(q(qs, alts, ci, f"{pct}% de {val} = {res}. ({pct}/100 x {val})", cat))
    return n[:max(0, alvo - atual)]

def gen_historia(cat, atual, alvo):
    n = []
    eventos = [
        ("Em que ano o Brasil foi descoberto?","1500","1492","1488","1502","1510","1498","1494"),
        ("Em que ano foi a independencia do Brasil?","1822","1800","1820","1830","1815","1825","1840"),
        ("Em que ano a republica foi proclamada no Brasil?","1889","1870","1890","1900","1880","1910","1860"),
        ("Em que ano a escravatura foi abolida?","1888","1850","1870","1890","1900","1880","1860"),
        ("Em que ano comecou a Segunda Guerra?","1939","1930","1940","1945","1935","1929","1950"),
        ("Em que ano terminou a Segunda Guerra?","1945","1939","1940","1950","1944","1946","1948"),
        ("Em que ano caiu o Muro de Berlim?","1989","1985","1990","1987","1991","1988","1986"),
        ("Em que ano o homem pisou na Lua?","1969","1965","1970","1972","1968","1960","1975"),
        ("Em que ano terminou a Primeira Guerra?","1918","1914","1920","1915","1917","1919","1925"),
        ("Em que ano a Bastilha foi tomada?","1789","1779","1795","1800","1775","1785","1790"),
        ("Em que ano Colombo chegou a America?","1492","1480","1500","1490","1485","1495","1505"),
        ("Em que ano foi a Revolucao Francesa?","1789","1799","1779","1800","1790","1775","1810"),
        ("Em que ano Getulio Vargas assumiu?","1930","1920","1940","1935","1925","1950","1910"),
        ("Em que ano foi a Revolucao Russa?","1917","1910","1920","1905","1925","1915","1900"),
        ("Em que ano a ONU foi fundada?","1945","1940","1950","1939","1948","1955","1935"),
        ("Em que ano a URSS foi dissolvida?","1991","1985","1995","1990","1989","2000","1993"),
        ("Em que ano foi Pearl Harbor?","1941","1940","1942","1939","1943","1945","1938"),
        ("Em que ano a Alemanha foi reunificada?","1990","1989","1991","1985","1995","1988","1992"),
        ("Em que ano foi a Guerra do Paraguai?","1864","1850","1870","1860","1880","1855","1875"),
        ("Em que ano foi a Inconfidencia Mineira?","1789","1779","1800","1790","1775","1795","1810"),
        ("Em que ano Napoleao foi derrotado?","1815","1805","1820","1810","1800","1825","1818"),
        ("Em que ano o Titanic afundou?","1912","1905","1915","1920","1910","1908","1918"),
        ("Em que ano foi a Guerra Fria?","1947-1991","1939-1945","1914-1918","1950-1980","1960-1990","1945-1990","1900-2000"),
        ("Em que ano o Brasil sediou a Copa?","2014","2010","2018","2006","2016","2012","2020"),
        ("Em que ano ocorreu o 11 de setembro?","2001","2000","2002","2003","1999","2004","1998"),
    ]
    for qs, ans, *wrs in eventos:
        alts, ci = pick(ans, random.sample(wrs, 3))
        n.append(q(qs, alts, ci, f"Resposta: {ans}.", cat))
    return n[:max(0, alvo - atual)]

def gen_geografia(cat, atual, alvo):
    n = []
    paises = [
        ("Brasil","Brasilia","Portugues","America do Sul","Real"),
        ("Argentina","Buenos Aires","Espanhol","America do Sul","Peso"),
        ("Franca","Paris","Frances","Europa","Euro"),
        ("Alemanha","Berlim","Alemao","Europa","Euro"),
        ("Italia","Roma","Italiano","Europa","Euro"),
        ("Espanha","Madri","Espanhol","Europa","Euro"),
        ("Portugal","Lisboa","Portugues","Europa","Euro"),
        ("EUA","Washington","Ingles","America do Norte","Dolar"),
        ("Canada","Ottawa","Ingles e Frances","America do Norte","Dolar"),
        ("Mexico","Cidade do Mexico","Espanhol","America do Norte","Peso"),
        ("China","Pequim","Mandarim","Asia","Yuan"),
        ("Japao","Toquio","Japones","Asia","Iene"),
        ("India","Nova Deli","Hindi e Ingles","Asia","Rupia"),
        ("Australia","Camberra","Ingles","Oceania","Dolar"),
        ("Russia","Moscou","Russo","Europa e Asia","Rublo"),
        ("Egito","Cairo","Arabe","Africa","Libra"),
        ("Africa do Sul","Pretoria","11 idiomas","Africa","Rand"),
        ("Chile","Santiago","Espanhol","America do Sul","Peso"),
        ("Colombia","Bogota","Espanhol","America do Sul","Peso"),
        ("Peru","Lima","Espanhol","America do Sul","Sol"),
    ]
    for pais, capital, idioma, continente, moeda in paises:
        for tipo in range(4):
            if tipo == 0:
                qs = f"Qual a capital de {pais}?"
                resp = capital
                erros = [c for _,c,_,_,_ in random.sample(paises, 7) if c!=capital]
            elif tipo == 1:
                qs = f"Qual o idioma oficial de {pais}?"
                resp = idioma
                erros = [i for _,_,i,_,_ in random.sample(paises, 7) if i!=idioma]
            elif tipo == 2:
                qs = f"Em qual continente fica {pais}?"
                resp = continente
                erros = ["Europa","Asia","Africa","America do Sul","America do Norte","Oceania","Antartida"]
                erros = [c for c in erros if c!=continente]
            else:
                qs = f"Qual e a moeda de {pais}?"
                resp = moeda
                erros = [m for _,_,_,_,m in random.sample(paises, 7) if m!=moeda]
            alts, ci = pick(resp, random.sample(erros, min(7, len(erros))))
            n.append(q(qs, alts, ci, f"{pais}: capital {capital}, idioma {idioma}, continente {continente}.", cat))
    # Geografia fisica
    geofis = [
        ("Qual o maior rio do mundo?","Rio Amazonas","Nilo","Mississipi","Yangtze","Danubio","Ganges","Mekong"),
        ("Qual a montanha mais alta?","Monte Everest","K2","Kangchenjunga","Lhotse","Makalu","Cho Oyu","Dhaulagiri"),
        ("Qual o maior deserto?","Antartida","Saara","Gobi","Kalahari","Atacama","Arabico","Mojave"),
        ("Qual a maior floresta?","Amazonia","Congo","Taiga","Mata Atlantica","Daintree","Sundarbans","Floresta Negra"),
        ("Qual o maior oceano?","Pacifico","Atlantico","Indico","Artico","Antartico","Mediterraneo","Caraibe"),
        ("Qual o maior lago da America do Sul?","Lago Titicaca","Lago Maracaibo","Lago Buenos Aires","Lago Argentino","Lago Cardiel","Lago Nahuel Huapi","Lago Musters"),
        ("Qual o pais com mais costa?","Canada","Australia","Indonesia","Russia","Filipinas","Japao","Brasil"),
        ("Qual o pais mais frio?","Russia","Canada","Groenlandia","Islandia","Finlandia","Noruega","Suecia"),
        ("Qual o pais mais quente?","Etiopia","Sudao","Libia","Argelia","Iraque","Arabia Saudita","Mali"),
        ("Qual o menor pais?","Vaticano","Monaco","San Marino","Liechtenstein","Malta","Andorra","Luxemburgo"),
    ]
    for qs, ans, *wrs in geofis:
        alts, ci = pick(ans, random.sample(wrs, 3))
        n.append(q(qs, alts, ci, f"{ans}.", cat))
    return n[:max(0, alvo - atual)]

def gen_ciencia(cat, atual, alvo):
    n = []
    ciencias = [
        ("Qual a formula da agua?","H2O","CO2","NaCl","O2","CH4","NH3","HCl"),
        ("Qual o maior planeta?","Jupiter","Saturno","Netuno","Urano","Terra","Venus","Marte"),
        ("O que e fotossintese?","Processo que plantas produzem energia","Respiracao celular","Fermentacao","Digestao","Transpiracao","Germinacao","Decomposicao"),
        ("Qual a velocidade da luz?","300.000 km/s","150.000","500.000","100.000","1.000.000","30.000","600.000"),
        ("O que sao celulas?","Unidades basicas da vida","Atomos","Moleculas","Tecidos","Orgaos","Genes","Proteinas"),
        ("Qual metal mais abundante na crosta?","Aluminio","Ferro","Cobre","Ouro","Prata","Zinco","Chumbo"),
        ("O que e a tabela periodica?","Classificacao dos elementos","Mapa astronomico","Tabela matematica","Calendario","Codigo genetico","Catalogo","Sistema de medidas"),
        ("Qual gas mais abundante na atmosfera?","Nitrogenio","Oxigenio","Gas carbonico","Hidrogenio","Helio","Argonio","Neonio"),
        ("O que sao cromossomos?","Estruturas com DNA","Proteinas","Lipidios","Carboidratos","Vitaminas","Enzimas","Hormonios"),
        ("Qual o menor osso?","Estribo","Martelo","Bigorna","Falange","Carpal","Tarsal","Patela"),
        ("O que e energia cinetica?","Energia do movimento","Energia armazenada","Energia termica","Energia quimica","Energia nuclear","Energia luminosa","Energia sonora"),
        ("O que filtra o sangue?","Rim","Figado","Coracao","Pulmao","Estomago","Pancreas","Intestino"),
        ("O que e um atomo?","Menor particula de elemento","Molecula","Proton","Eletron","Neutron","Quark","Foton"),
        ("Qual unidade de corrente eletrica?","Ampere","Volt","Ohm","Watt","Coulomb","Farad","Henry"),
        ("O que faz a hemoglobina?","Transporta oxigenio","Combate virus","Coagula sangue","Digere","Filtra","Produz hormonios","Contrai musculos"),
        ("Qual pH da agua pura?","7","1","3","5","9","11","13"),
        ("O que sao mitocondrias?","Produzem energia para a celula","Nucleo","Ribossomo","Lisossomo","Golgi","Vacuolo","Cloroplasto"),
        ("Qual o maior orgao?","Pele","Coracao","Figado","Pulmao","Cerebro","Estomago","Rim"),
        ("O que e a gravidade?","Forca que atrai corpos","Forca magnetica","Forca nuclear","Pressao","Campo eletrico","Atrito","Inercia"),
        ("O que e DNA?","Acido desoxirribonucleico","Proteina","Lipidio","Carboidrato","RNA","Enzima","Hormonio"),
        ("O que e a selecao natural?","Mecanismo da evolucao","Criacao divina","Geracao espontanea","Mutacao","Deriva","Adaptacao","Extincao"),
        ("Qual a temperatura de ebulicao da agua?","100 C","0 C","50 C","150 C","200 C","80 C","120 C"),
        ("O que e um virus?","Parasita intracelular","Celula","Bacteria","Fungo","Protozoario","Prion","Gene"),
        ("Qual o ponto de fusao do gelo?","0 C","-10 C","10 C","50 C","100 C","-5 C","-20 C"),
        ("O que e o sistema solar?","Conjunto de planetas ao redor do Sol","Galaxia","Nebulosa","Constelacao","Universo","Via Lactea","Cumulo estelar"),
        ("O que e um elemento quimico?","Substancia pura com atomos iguais","Mistura","Composto","Molecula","Ion","Isotopo","Solucao"),
    ]
    for qs, ans, *wrs in ciencias:
        alts, ci = pick(ans, random.sample(wrs, 3))
        n.append(q(qs, alts, ci, f"{ans}.", cat))
    return n[:max(0, alvo - atual)]

def gen_corpo(cat, atual, alvo):
    n = []
    dados = [
        ("Qual o maior orgao?","Pele","Coracao","Figado","Pulmao","Cerebro","Rim","Intestino"),
        ("Quantos ossos tem o adulto?","206","150","250","180","300","220","200"),
        ("O que bombeia o sangue?","Coracao","Pulmao","Figado","Rim","Cerebro","Pancreas","Baço"),
        ("Onde ocorre a digestao?","Estomago","Boca","Intestino","Figado","Pancreas","Esofago","Faringe"),
        ("Orgao responsavel pela visao?","Olho","Ouvido","Nariz","Lingua","Pele","Cerebro","Retina"),
        ("Quantos litros de sangue?","5 litros","2","3","7","10","4","6"),
        ("Onde e produzida a insulina?","Pancreas","Figado","Rim","Baço","Tireoide","Hipofise","Estomago"),
        ("Funcao dos pulmoes?","Trocas gasosas","Bombear sangue","Filtrar","Digestao","Producao hormonal","Excrecao","Circulacao"),
        ("O que sao neuronios?","Celulas nervosas","Musculares","Sanguineas","Osseas","Hepaticas","Renais","Adiposas"),
        ("Onde fica o cerebelo?","Parte posterior do cranio","Frente","Centro","Base","Topo","Lobo frontal","Lobo temporal"),
        ("Qual osso protege o cerebro?","Cranio","Femur","Umero","Costela","Pelvis","Tibia","Patela"),
        ("Onde ocorre a absorcao de agua?","Intestino grosso","Intestino delgado","Estomago","Figado","Pancreas","Rim","Colon"),
        ("O que e a medula ossea?","Produz celulas sanguineas","Armazena gordura","Protege nervos","Produz hormonios","Filtra toxinas","Digere","Respira"),
        ("Quantos dentes tem um adulto?","32","20","24","28","36","40","44"),
        ("O que sao os alviolos pulmonares?","Estruturas para trocas gasosas","Veias","Arterias","Bronquios","Traqueia","Laringe","Faringe"),
    ]
    for qs, ans, *wrs in dados:
        alts, ci = pick(ans, random.sample(wrs, min(7, len(wrs))))
        n.append(q(qs, alts, ci, f"{ans}.", cat))
    return n[:max(0, alvo - atual)]

def gen_espaco(cat, atual, alvo):
    n = []
    dados = [
        ("Qual o planeta mais distante?","Netuno","Saturno","Urano","Marte","Jupiter","Venus","Mercurio"),
        ("O que e uma galaxia?","Sistema de estrelas e planetas","Estrela","Planeta","Cometa","Asteroide","Buraco negro","Nebulosa"),
        ("Estrela mais proxima da Terra?","Sol","Proxima Centauri","Sirius","Alpha Centauri","Betelgeuse","Vega","Polaris"),
        ("O que sao buracos negros?","Regioes com gravidade extrema","Estrelas mortas","Planetas gasosos","Nuvens de poeira","Explosoes","Satelites","Fendas"),
        ("Quantos planetas no sistema solar?","8","5","6","7","9","10","11"),
        ("O que e a Via Lactea?","Nossa galaxia","Nebulosa","Constelacao","Planeta","Satelite","Cometa","Cumulo"),
        ("Maior satelite natural?","Ganimedes","Lua","Tita","Io","Europa","Calisto","Tritao"),
        ("O que e um cometa?","Corpo de gelo e poeira","Estrela cadente","Planeta anao","Asteroide","Meteoro","Satelite","Nebulosa"),
        ("Temperatura do Sol?","5.500 C","1.000","3.000","8.000","10.000","15.000","1 milhao"),
        ("O que e estrela cadente?","Meteoro na atmosfera","Estrela fugindo","Satelite caindo","Cometa explodindo","Planeta colidindo","Asteroide","Supernova"),
        ("O que e um ano-luz?","Distancia que a luz percorre em 1 ano","Tempo de 1 ano","Velocidade da luz","Luminosidade","Temperatura","Massa","Volume"),
        ("Qual planeta tem aneis?","Saturno","Jupiter","Urano","Netuno","Marte","Venus","Terra"),
        ("Qual planeta e o mais quente?","Venus","Mercurio","Marte","Terra","Jupiter","Saturno","Netuno"),
        ("Qual planeta e conhecido como 'Planeta Vermelho'?","Marte","Venus","Mercurio","Jupiter","Saturno","Urano","Netuno"),
    ]
    for qs, ans, *wrs in dados:
        alts, ci = pick(ans, random.sample(wrs, min(7, len(wrs))))
        n.append(q(qs, alts, ci, f"{ans}.", cat))
    return n[:max(0, alvo - atual)]

def gen_animais(cat, atual, alvo):
    n = []
    dados = [
        ("Maior animal do mundo?","Baleia-azul","Elefante","Girafa","Tubarao-baleia","Hipopotamo","Rinoceronte","Urso"),
        ("Animal mais rapido?","Falcao-peregrino","Guepardo","Leopardo","Aguia","Tubarao","Cavalo","Gazela"),
        ("Rei da selva?","Leao","Tigre","Urso","Lobo","Elefante","Gorila","Pantera"),
        ("Animal mais inteligente?","Golfinho","Macaco","Elefante","Polvo","Cachorro","Papagaio","Corvo"),
        ("Vive mais tempo?","Tartaruga-gigante","Elefante","Baleia","Arara","Tubarao","Crocodilo","Corvo"),
        ("Dorme de cabeca para baixo?","Morcego","Preguica","Coala","Lemure","Gato","Coruja","Macaco"),
        ("Maior mamifero terrestre?","Elefante-africano","Girafa","Hipopotamo","Rinoceronte","Ursod","Bisao","Alce"),
        ("Maior primata?","Gorila","Chimpanze","Orangotango","Bonobo","Macaco-prego","Babuino","Mico"),
        ("Animal mais venenoso?","Cobra-taipan","Escorpiao","Aranha","Polvo","Sapo","Medusa","Coral"),
        ("Unico mamifero que voa?","Morcego","Esquilo-voador","Passaro","Inseto","Planador","Marsupial","Libelula"),
        ("Animal que constroi diques?","Castor","Lontra","Capivara","Rato","Esquilo","Toupeira","Pato"),
        ("Que muda de cor?","Camaleao","Polvo","Lula","Peixe-palhaco","Sapo","Lagarto","Cobra"),
        ("Maior roedor?","Capivara","Castor","Rato","Porco-espinho","Ourico","Prea","Cutia"),
        ("Simbolo da paz?","Pomba","Gato","Cachorro","Golfinho","Cisne","Gaivota","Andorinha"),
        ("Tem listras?","Zebra","Tigre","Onca","Lobo-guara","Leopardo","Guepardo","Okapi"),
        ("Maior felino?","Tigre","Leao","Onca","Leopardo","Guepardo","Puma","Lince"),
        ("Maior reptil?","Crocodilo","Jacare","Cobra","Tartaruga","Lagarto","Iguana","Teiu"),
        ("Oito patas?","Aranha","Escorpiao","Lagosta","Caranguejo","Polvo","Lula","Centopeia"),
        ("Navio do deserto?","Camelo","Cavalo","Burro","Elefante","Dromedario","Lhama","Alpaca"),
        ("Maior peixe?","Tubarao-baleia","Baleia-azul","Tubarao-branco","Manta-raya","Atum","Salmão","Cavalo-marinho"),
    ]
    for qs, ans, *wrs in dados:
        alts, ci = pick(ans, random.sample(wrs, min(7, len(wrs))))
        n.append(q(qs, alts, ci, f"{ans}.", cat))
    return n[:max(0, alvo - atual)]

def gen_tecnologia(cat, atual, alvo):
    n = []
    dados = [
        ("O que significa HTML?","HyperText Markup Language","High Tech Modern","Home Tool Markup","Hyper Transfer","Home Text","High Text","Hyper Modern"),
        ("O que e um processador?","CPU - Unidade Central","GPU","RAM","HD","Placa mae","Fonte","Cooler"),
        ("O que significa Wi-Fi?","Wireless Fidelity","Wide Fidelity","Wireless Finder","Wired Fiber","Window Fidelity","Web Finder","Wired Fidelity"),
        ("O que e firewall?","Sistema de seguranca de rede","Antivirus","Roteador","Modem","Servidor","Hub","Proxy"),
        ("O que e nuvem?","Servicos pela internet","Armazenamento local","Memoria RAM","Processador","HD externo","Rede social","Navegador"),
        ("O que e banco de dados?","Colecao organizada de dados","Planilha","Arquivo de texto","Pasta","Memoria","Cache","Backup"),
        ("O que significa USB?","Universal Serial Bus","Universal System","Unified Serial","Universal Board","Universal Super","Unified System","Ultra Serial"),
        ("O que e algoritmo?","Sequencia de passos para resolver problema","Programa","Linguagem","Hardware","Rede","Sistema","App"),
        ("O que e criptografia?","Tecnica de codificar dados","Decodificacao","Compressao","Traducao","Compactacao","Backup","Formatacao"),
        ("O que e IA?","Maquinas que simulam inteligencia humana","Robos fisicos","Programas simples","Hardware","SO","Rede neural","Automacao"),
        ("O que significa RAM?","Random Access Memory","Read Access Memory","Rapid Access","Remote Access","Run And Manage","Real Application","Redundant Array"),
        ("O que significa SSD?","Solid State Drive","Super Speed Disk","System Storage","Software Disk","Serial Disk","Standard Disk","Rapid Drive"),
        ("O que e sistema operacional?","Software que gerencia hardware","Processador","Memoria","Aplicativo","Navegador","Driver","Compilador"),
        ("O que e um servidor?","Computador que fornece servicos","Cliente","Roteador","Switch","Hub","Modem","Firewall"),
        ("O que significa URL?","Uniform Resource Locator","Universal Resource","Unified Resource","Uniform Reference","Universal Reference","User Resource","Unified Reference"),
        ("O que e um pixel?","Menor unidade de imagem digital","Ponto fisico","Cor","Luz","Resolucao","Tamanho","Vetor"),
        ("O que e um bug?","Erro em software","Virus","Inseto","Peca","Driver","Update","Patch"),
        ("O que e software?","Programas de computador","Parte fisica","Hardware","Periferico","Placa","Cabo","Monitor"),
        ("O que e hardware?","Componentes fisicos","Programas","Aplicativos","Sistemas","Dados","Arquivos","Nuvem"),
        ("O que e um navegador?","Programa para acessar a web","Antivirus","Editor","Compilador","Player","Calculadora","Bloco de notas"),
    ]
    for qs, ans, *wrs in dados:
        alts, ci = pick(ans, random.sample(wrs, min(7, len(wrs))))
        n.append(q(qs, alts, ci, f"{ans}.", cat))
    return n[:max(0, alvo - atual)]

def gen_games(cat, atual, alvo):
    n = []
    dados = [
        ("Jogo mais vendido da historia?","Minecraft","Tetris","GTA V","FIFA","Super Mario","Call of Duty","Pokemon"),
        ("Mascote da Nintendo?","Mario","Luigi","Sonic","Crash","Spyro","Donkey Kong","Link"),
        ("Empresa do PlayStation?","Sony","Nintendo","Microsoft","Sega","Atari","Capcom","Square Enix"),
        ("O que significa FPS?","First Person Shooter","Frames Per Second","Fast Play System","First Player Screen","Fight Play Style","Free Play Session","Full Power Shot"),
        ("Jogo mais baixado?","Free Fire","PUBG","Fortnite","Candy Crush","Clash Royale","Among Us","Subway Surfers"),
        ("Primeiro videogame?","Magnavox Odyssey","Atari 2600","Nintendo NES","Sega Genesis","PlayStation","Pong","Game Boy"),
        ("O que e MMORPG?","Massively Multiplayer Online RPG","Multiplayer Mobile","Massive Monsters","Multi Machine","Massively Multiplayer Offline","Mini Multiplayer","Massive Racing"),
        ("Empresa do Xbox?","Microsoft","Sony","Nintendo","Sega","Google","Amazon","Apple"),
        ("O que e DLC?","Downloadable Content","Digital License","Direct Link","Dual Layer","Dynamic Level","Download Link","Digital Level"),
        ("Jogo que popularizou battle royale?","PUBG","Fortnite","Free Fire","Call of Duty","Apex Legends","H1Z1","Minecraft"),
        ("Jogo do ano 2023?","Baldurs Gate 3","Elden Ring","God of War","Zelda","Cyberpunk","Hogwarts Legacy","Starfield"),
        ("Protagonista de Zelda?","Link","Mario","Zelda","Ganon","Navi","Epona","Midna"),
        ("Origem da Nintendo?","Japao","China","EUA","Coreia","Alemanha","Franca","Canada"),
        ("O que e RPG?","Role-Playing Game","Real Playing","Rapid Game","Role Racing","Realistic Game","Random Game","Racing Game"),
        ("Jogo mais vendido do PS4?","GTA V","Spider-Man","God of War","The Last of Us","Horizon","Uncharted","Bloodborne"),
    ]
    for qs, ans, *wrs in dados:
        alts, ci = pick(ans, random.sample(wrs, min(7, len(wrs))))
        n.append(q(qs, alts, ci, f"{ans}.", cat))
    return n[:max(0, alvo - atual)]

def gen_cinema(cat, atual, alvo):
    n = []
    dados = [
        ("Coringa 2019 interpretado por?","Joaquin Phoenix","Heath Ledger","Jared Leto","Jack Nicholson","Ryan Gosling","Christian Bale","Robert Pattinson"),
        ("Filme de maior bilheteria?","Avatar","Vingadores Ultimato","Titanic","Star Wars","Jurassic World","Frozen","Rei Leao"),
        ("Quem dirigiu Matrix?","Irmas Wachowski","Spielberg","Nolan","Cameron","Jackson","Ridley Scott","Tarantino"),
        ("Primeiro filme da historia?","Viagem a Lua","Grande Roubo do Trem","Gabinet do Dr Caligari","Metropolis","Cantor de Jazz","Intolerancia","Nosferatu"),
        ("Homem de Ferro interpretado por?","Robert Downey Jr","Chris Evans","Chris Hemsworth","Scarlett Johansson","Mark Ruffalo","Jeremy Renner","Tom Holland"),
        ("O que e um Oscar?","Premio da Academia","Premio de Musica","Premio de TV","Festival","Premio literario","Premio de teatro","Premio de fotografia"),
        ("Mestre do suspense?","Alfred Hitchcock","Spielberg","Tarantino","Kubrick","Scorsese","Fincher","Nolan"),
        ("Franquia com mais filmes?","James Bond","Star Wars","MCU","Velozes e Furiosos","Harry Potter","Star Trek","Godzilla"),
        ("Oscar 2020 melhor filme?","Parasita","1917","Coringa","Era Uma Vez em Hollywood","O Irlandes","Ford vs Ferrari","Jojo Rabbit"),
        ("O que e spin-off?","Derivado de obra principal","Continuacao","Prequela","Remake","Reboot","Adaptacao","Sequencia"),
        ("Titanic - Jack interpretado por?","Leonardo DiCaprio","Brad Pitt","Tom Cruise","Johnny Depp","Matt Damon","Ben Affleck","Keanu Reeves"),
        ("Diretor de Star Wars?","George Lucas","Spielberg","Nolan","Lucas","Abrams","Johnson","Howard"),
        ("Maior estidio de animacao?","Pixar","Disney","Dreamworks","Studio Ghibli","Illumination","Blue Sky","Sony Animation"),
        ("A vida e como uma caixa de chocolates - filme?","Forrest Gump","Clube da Luta","Matrix","Titanic","Pulp Fiction","Se7en","Janela Indiscreta"),
        ("Batman 2022 interpretado por?","Robert Pattinson","Ben Affleck","Christian Bale","Michael Keaton","George Clooney","Val Kilmer","Adam West"),
    ]
    for qs, ans, *wrs in dados:
        alts, ci = pick(ans, random.sample(wrs, min(7, len(wrs))))
        n.append(q(qs, alts, ci, f"{ans}.", cat))
    return n[:max(0, alvo - atual)]

def gen_curiosidades(cat, atual, alvo):
    n = []
    dados = [
        ("O mel nunca estraga por que?","Propriedades antibacterianas","Acucar demais","Desidratado","Conservantes","pH acido","Fermenta","Pasteurizado","Temperatura"),
        ("Girafas dormem quantos minutos por dia?","30 minutos","2 horas","4 horas","6 horas","8 horas","1 hora","10 minutos"),
        ("Coracao do camarao fica onde?","Na cabeca","No torax","No abdome","Na cauda","Nas pernas","Nas antenas","Nao tem coracao"),
        ("Flamingos sao cor-de-rosa por causa?","Alimentacao","Genetica","Ambiente","Idade","Sexo","Temperatura","Poluicao"),
        ("A banana e tecnicamente?","Uma baga","Uma fruta","Uma erva","Um legume","Um tuberculo","Uma semente","Uma flor"),
        ("O Monte Everest cresce quanto por ano?","4 mm","1 cm","2 cm","5 mm","3 cm","1 mm","1 m"),
        ("Olho do avestruz e maior que?","Seu cerebro","Seu estomago","Seu coracao","Sua cabeca","Seu bico","Sua perna","Seu ovo"),
        ("Objeto mais perfurante da natureza?","Dente de caracol","Unha de tigre","Espinho de porco-espinho","Ferro de escorpiao","Presas de cobra","Garras de aguia","Dente de tubarao"),
        ("Trovao e causado por?","Expansao do ar aquecido pelo raio","Colisao de nuvens","Queda do raio","Vento forte","Chuva intensa","Pressao atmosferica","Eletricidade estatica"),
        ("Formigas dormem?","Sim, tiram sonecas","Nao","Nao se sabe","Depende da especie","So as rainhas","So em hibernacao","So de dia"),
        ("Pais com mais ilhas?","Suecia","Indonesia","Filipinas","Noruega","Canada","Australia","Japao"),
        ("O polvo tem quantos coracoes?","3","1","2","4","5","6","7"),
        ("Nuvem pesa em media?","500 toneladas","100 kg","1 tonelada","1000 toneladas","100 toneladas","50 toneladas","10 kg"),
        ("Cangurus nao conseguem?","Andar para tras","Pular","Correr","Nadar","Voar","Subir","Descer"),
        ("O idioma com mais palavras?","Ingles","Portugues","Mandarim","Espanhol","Russo","Alemao","Frances"),
        ("O papel foi inventado onde?","China","Egito","Grecia","India","Persia","Italia","Alemanha"),
        ("O olho humano tem quantos megapixels?","576 megapixels","100","200","300","500","1000","2000"),
        ("O que pesa mais, 1kg de ferro ou 1kg de algodao?","Mesmo peso","Ferro","Algodao","Depende","Ferro pesa mais","Algodao pesa mais","Nao e possivel"),
        ("Quantos dentes tem um tubarao?","Milhares ao longo da vida","32","42","100","200","500","Nunca perde"),
        ("O porco nao consegue?","Olhar para o ceu","Correr","Nadar","Ouvir","Cheirar","Gruntir","Comer"),
    ]
    for qs, ans, *wrs in dados:
        alts, ci = pick(ans, random.sample(wrs, min(7, len(wrs))))
        n.append(q(qs, alts, ci, f"{ans}.", cat))
    return n[:max(0, alvo - atual)]

def gen_misterios(cat, atual, alvo):
    n = []
    dados = [
        ("O que e o Triangulo das Bermudas?","Regiao com desaparecimentos misteriosos","Ilha misteriosa","Vulcao submarino","Portal dimensional","Base alienigena","Redemoinho","Campo magnetico"),
        ("O que foi Caso Roswell?","Suposto acidente de OVNI em 1947","Queda de meteoro","Teste militar","Aterrissagem alienigena","Explosao nuclear","Aeronave experimental","Balao meteorologico"),
        ("O que foi a Aberracao de Dyatlov?","Morte de 9 estudantes na neve","Ataque de lobos","Avalanche","Experimento militar","Ataque alienigena","Intoxicacao","Fenomeno natural"),
        ("O que e o Monstro do Lago Ness?","Suposto monstro aquatico","Tubarao","Enguia gigante","Tronco flutuante","Golfinho","Foca","Lula gigante"),
        ("O que sao as Linhas de Nazca?","Geoglifos misteriosos no Peru","Pistas de pouso","Mapa astronomico","Irrigacao","Caminhos cerimoniais","Fosseis","Desenhos aleatorios"),
        ("O que e o Codigo Voynich?","Manuscrito nunca decifrado","Livro de receitas","Texto religioso","Codigo militar","Tratado medico","Diario pessoal","Manual de alquimia"),
        ("O que foi Atlantida?","Civilizacao lendaria submersa","Cidade grega","Imperio romano","Colonia egipcia","Reino perdido","Ilha vulcanica","Continente"),
        ("O que e o Yeti?","Criatura lendaria do Himalaia","Urso polar","Macaco gigante","Humano antigo","Lobo gigante","Lhama","Figura mitologica"),
        ("O que sao as Bolas de Pedra da Costa Rica?","Esferas perfeitas de origem desconhecida","Meteoritos","Esculturas","Formacoes naturais","Armas","Jogos","Simbolos religiosos"),
        ("O que e o Mausoleu de Halicarnasso?","Tumulo monumental antigo","Piramide","Templo grego","Palacio persa","Estatua gigante","Faro","Jardins suspensos"),
        ("O que e a Caveira de Cristal?","Escultura de cristal misteriosa","Artefato alienigena","Cranio humano","Mascara ritual","Pedra preciosa","Fossil","Joia"),
        ("O que foi a Biblioteca de Alexandria?","Maior biblioteca da antiguidade","Universidade","Templo","Palacio","Museu","Arquivo","Escola"),
        ("O que sao os Hieroglifos de Tassili?","Pinturas rupestres no Saara","Escrita egipcia","Mapa de tesouro","Codigo secreto","Arte abstrata","Simbolos religiosos","Calendario"),
    ]
    for qs, ans, *wrs in dados:
        alts, ci = pick(ans, random.sample(wrs, min(7, len(wrs))))
        n.append(q(qs, alts, ci, f"{ans}.", cat))
    return n[:max(0, alvo - atual)]

def gen_paises(cat, atual, alvo):
    n = []
    paises = [
        ("Brasil","Brasilia","Portugues","America do Sul","Real","Brasilia","Verde e amarelo"),
        ("Argentina","Buenos Aires","Espanhol","America do Sul","Peso","Buenos Aires","Azul e branco"),
        ("Franca","Paris","Frances","Europa","Euro","Paris","Azul, branco, vermelho"),
        ("Alemanha","Berlim","Alemao","Europa","Euro","Berlim","Preto, vermelho, dourado"),
        ("Italia","Roma","Italiano","Europa","Euro","Roma","Verde, branco, vermelho"),
        ("Espanha","Madri","Espanhol","Europa","Euro","Madri","Vermelho e amarelo"),
        ("Portugal","Lisboa","Portugues","Europa","Euro","Lisboa","Verde e vermelho"),
        ("EUA","Washington","Ingles","America do Norte","Dolar","Washington","Vermelho, branco, azul"),
        ("Canada","Ottawa","Ingles/Frances","America do Norte","Dolar","Ottawa","Vermelho e branco"),
        ("Mexico","Cidade do Mexico","Espanhol","America do Norte","Peso","Cidade do Mexico","Verde, branco, vermelho"),
        ("China","Pequim","Mandarim","Asia","Yuan","Pequim","Vermelho e amarelo"),
        ("Japao","Toquio","Japones","Asia","Iene","Toquio","Branco e vermelho"),
        ("India","Nova Deli","Hindi/Ingles","Asia","Rupia","Nova Deli","Laranja, branco, verde"),
        ("Australia","Camberra","Ingles","Oceania","Dolar","Camberra","Azul, vermelho, branco"),
        ("Russia","Moscou","Russo","Europa/Asia","Rublo","Moscou","Branco, azul, vermelho"),
        ("Egito","Cairo","Arabe","Africa","Libra","Cairo","Vermelho, branco, preto"),
        ("Chile","Santiago","Espanhol","America do Sul","Peso","Santiago","Vermelho, branco, azul"),
        ("Peru","Lima","Espanhol","America do Sul","Sol","Lima","Vermelho, branco, vermelho"),
        ("Reino Unido","Londres","Ingles","Europa","Libra","Londres","Azul, vermelho, branco"),
        ("Suecia","Estocolmo","Sueco","Europa","Coroa","Estocolmo","Azul e amarelo"),
    ]
    for pais, capital, idioma, continente, moeda, _, _ in paises:
        for tipo in range(3):
            if tipo == 0:
                qs, resp, erros_lista = f"Qual a capital de {pais}?", capital, [c for _,c,_,_,_,_,_ in paises if c!=capital]
            elif tipo == 1:
                qs, resp, erros_lista = f"Qual a moeda de {pais}?", moeda, [m for _,_,_,_,m,_,_ in paises if m!=moeda]
            else:
                qs, resp, erros_lista = f"Em qual continente fica {pais}?", continente, ["America do Sul","America do Norte","Europa","Asia","Africa","Oceania","Antartida"]
                erros_lista = [c for c in erros_lista if c!=continente]
            alts, ci = pick(resp, random.sample(erros_lista, min(7, len(erros_lista))))
            n.append(q(qs, alts, ci, f"{pais}: capital {capital}, {continente}, moeda {moeda}.", cat))
    return n[:max(0, alvo - atual)]

def gen_charadas(cat, atual, alvo):
    n = []
    dados = [
        ("Quanto mais se tira, maior fica?","Buraco","Sombra","Divida","Estrada","Tempo","Distancia","Pilha"),
        ("Da muitas voltas e nunca sai do lugar?","Relogio","Ventilador","Carro","Roda","Piao","Balanco","Catavento"),
        ("Todo mundo tem, mas ninguem ve?","Nome","Sombra","Alma","Pensamento","Futuro","Sonho","Memoria"),
        ("Quanto mais seca, mais molhada?","Toalha","Areia","Papel","Roupa","Esponja","Nuvem","Lagrima"),
        ("Cai em pe e corre deitado?","Chuva","Agua","Vento","Neve","Sono","Sol","Lua"),
        ("Tem dente mas nao morde?","Pente","Garfo","Serra","Engrenagem","Trator","Tesoura","Chave"),
        ("Quanto maior, menos se ve?","Escuridao","Nuvem","Fumaca","Névoa","Sombra","Universo","Mar"),
        ("Tem cabeca e cauda, mas nao e animal?","Moeda","Cobra","Fio","Boneco","Agulha","Martelo","Musica"),
        ("Nunca volta, mas sempre vai?","Tempo","Vento","Agua","Fumaca","Idade","Passado","Dinheiro"),
        ("Surdo, mudo e cego, mas conta tudo?","Livro","Revista","Jornal","Computador","Televisao","Radio","Telefone"),
        ("Anda com os pes na cabeca?","Piolho","Chapeu","Sapato","Pente","oculos","Cabelo","Bone"),
        ("Entra na agua e nao se molha?","Sombra","Reflexo","Peixe","Barco","Pedra","Pingente","Gelo"),
        ("Tem asas mas nao voa, tem bico mas nao bica?","Bule","Xicara","Panela","Chaleira","Vaso","Garrafa","Copo"),
        ("Poem na mesa, parte-se, mas nao se come?","Amizade","Silencio","Conversa","Acordo","Segredo","Palavra","Briga"),
        ("Leve como pluma, mas ninguem segura por muito tempo?","Respiracao","Sopro","Pensamento","Olhar","Sorriso","Piscada","Bocajo"),
        ("Vive sempre a cair mas nunca se machuca?","Agua da torneira","Pingente","Gota","Chuva","Orvalho","Lagrima","Cachoeira"),
        ("Dois irmaos unidos, mas nunca se veem?","Olhos","Orelhas","Maos","Pes","Bracos","Pernas","Narinas"),
        ("Quanto mais cheio, menos pesa?","Balao","Bexiga","Nuvem","Espuma","Isopor","Algodao","Pluma"),
        ("O que se quebra ao ser nomeado?","Silencio","Vidro","Gelo","Noz","Coco","Ovo","Castanha"),
        ("Tem cidades, ruas e lojas, mas nenhuma pessoa?","Mapa","Jogo","Livro","Computador","Maquete","Globo","Planta"),
        ("O que ninguem quer ter, mas ninguem quer perder?","Processo judicial","Divida","Doenca","Inimigo","Problema","Preocupacao","Rival"),
        ("Sobe e nunca desce?","Idade","Fumaca","Balao","Preco","Pressao","Febre","Nivel"),
        ("O que esta no meio do ovo?","A letra V","A gema","A clara","A casca","O sal","A agua","O calor"),
        ("Quatro pernas, mas nao anda?","Mesa","Cadeira","Banco","Sofa","Armario","Cama","Estante"),
        ("Pula e se veste?","Cama","Sofa","Rede","Colchao","Tapete","Almofada","Banco"),
        ("O que e que todos tem, mas alguns usam mais?","Paciencia","Sorte","Talento","Inteligncia","Coragem","Amor","Medo"),
        ("Faz ouro virar prata?","Eco","Magica","Alquimia","Tempo","Distancia","Som","Luz"),
        ("O que e que anda pelo mundo sem sair do canto?","Selo","Carimbo","Quadro","Estatua","Vaso","Musica","Carta"),
    ]
    for qs, ans, *wrs in dados:
        alts, ci = pick(ans, random.sample(wrs, min(7, len(wrs))))
        n.append(q(qs, alts, ci, f"{ans}.", cat))
    return n[:max(0, alvo - atual)]

def gen_mitologia(cat, atual, alvo):
    n = []
    dados = [
        ("Deus do mar na mitologia grega?","Poseidon","Zeus","Ares","Hades","Apolo","Hermes","Dionisio"),
        ("Rei dos deuses do Olimpo?","Zeus","Poseidon","Ares","Hades","Cronos","Urano","Atlas"),
        ("Deusa do amor?","Afrodite","Atena","Hera","Artemis","Demeter","Persefone","Hestia"),
        ("Deus da guerra?","Ares","Zeus","Poseidon","Hades","Apolo","Hermes","Hefesto"),
        ("Heroi mais famoso?","Hercules","Aquiles","Perseu","Teseu","Jasao","Orfenu","Belerofonte"),
        ("Deus do submundo?","Hades","Zeus","Poseidon","Cronos","Urano","Tartaro","Thanatos"),
        ("Deusa da sabedoria?","Atena","Afrodite","Hera","Artemis","Demeter","Hestia","Persefone"),
        ("Mensageiro dos deuses?","Hermes","Zeus","Apolo","Ares","Dionisio","Hefesto","Poseidon"),
        ("Deus do vinho?","Dionisio","Apolo","Hermes","Ares","Hefesto","Poseidon","Zeus"),
        ("Deusa da caca?","Artemis","Afrodite","Atena","Hera","Demeter","Hestia","Persefone"),
        ("Deus da musica?","Apolo","Hermes","Dionisio","Ares","Hefesto","Poseidon","Zeus"),
        ("Deusa do casamento?","Hera","Afrodite","Atena","Artemis","Demeter","Hestia","Persefone"),
        ("Tita que carrega o ceu?","Atlas","Prometeu","Cronos","Epimeteu","Oceano","Hiperion","Japeto"),
        ("Deus do fogo?","Hefesto","Ares","Apolo","Hermes","Dionisio","Poseidon","Zeus"),
        ("Heroi da guerra de Troia?","Aquiles","Hercules","Perseu","Teseu","Jasao","Orfenu","Ulisses"),
        ("Monstro com corpo humano e cabeca de touro?","Minotauro","Ciclope","Quimera","Cerberus","Hidra","Graias","Gorgonas"),
        ("Mulher com serpentes no cabelo?","Medusa","Afrodite","Atena","Hera","Calipso","Circe","Helena"),
        ("Ave que renasce das cinzas?","Fenix","Aguia","Corvo","Gaviao","Falcao","Pavao","Cisne"),
        ("Primeiro homem na mitologia grega?","Prometeu","Epimeteu","Pandora","Deucaliao","Pirra","Helena","Cadmo"),
        ("Deus do tempo na mitologia romana?","Saturno","Jupiter","Netuno","Plutao","Marte","Mercurio","Vulcano"),
        ("O que e Cerberus?","Caes de tres cabecas do Hadess","Monstro marinho","Gigante","Dragao","Leao de Nemeia","Hidra","Quimera"),
        ("Quantos trabalhos de Hercules?","12","10","8","6","15","20","7"),
        ("O que e o Oráculo de Delfos?","Templo de Apolo onde se consultava a profetisa","Templo de Zeus","Templo de Atena","Templo de Hera","Templo de Poseidon","Templo de Ares","Templo de Afrodite"),
        ("Quem casou com Hera?","Zeus","Poseidon","Ares","Apolo","Hermes","Hefesto","Cronos"),
    ]
    for qs, ans, *wrs in dados:
        alts, ci = pick(ans, random.sample(wrs, min(7, len(wrs))))
        n.append(q(qs, alts, ci, f"{ans}.", cat))
    return n[:max(0, alvo - atual)]

# ============= EXECUCAO =============
if __name__ == '__main__':
    ALVO = 1000  # minimo por categoria

    generators = {
        "Ingl\u00eas": gen_ingles,
        "Portugu\u00eas": gen_portugues,
        "Matem\u00e1tica": gen_matematica,
        "Hist\u00f3ria": gen_historia,
        "Geografia": gen_geografia,
        "Ci\u00eancia": gen_ciencia,
        "Corpo Humano": gen_corpo,
        "Espa\u00e7o": gen_espaco,
        "Animais": gen_animais,
        "Tecnologia": gen_tecnologia,
        "Games": gen_games,
        "Cinema": gen_cinema,
        "Curiosidades": gen_curiosidades,
        "Mist\u00e9rios": gen_misterios,
        "Pa\u00edses": gen_paises,
        "Charadas": gen_charadas,
        "Mitologia": gen_mitologia,
    }

    todas_novas = []
    for cat_nome, gen_func in generators.items():
        novas = gen_para(cat_nome, gen_func, ALVO)
        todas_novas.extend(novas)

    # Remover categorias antigas que foram substituidas
    cats_remover = ['Piadas e Charadas']
    existing_filtrado = [q for q in existing if q.get('category','') not in cats_remover]

    final = existing_filtrado + todas_novas

    print(f"\n=== RESUMO ===")
    cc = Counter(q2['category'] for q2 in final)
    for c in sorted(cc):
        antigo = len(existing_by_cat.get(c, []))
        print(f"  {c}: {cc[c]} (antes: {antigo})")
    print(f"\nTotal geral: {len(final)} (antes: {len(existing)})")

    shutil.copy2(SEED, BACKUP)
    print(f"Backup: {BACKUP}")

    with open(SEED, 'w', encoding='utf-8') as f:
        json.dump(final, f, ensure_ascii=False, indent=2)
    print(f"Salvo: {SEED}")
