"""Gerador v3 — combinacao dimensional, cada frase e unica."""

import os
import random

random.seed(42)

def pick(lst):
    return random.choice(lst)

def combinar(*listas):
    """Gera todas as combinacoes possiveis (ou amostra)."""
    resultado = []
    for combo in __import__('itertools').product(*listas):
        resultado.append(' '.join(str(x) for x in combo if x))
    return resultado

def gen():
    lines = []

    # ==========================================
    # DIMENSOES DE VARIAÇÃO
    # ==========================================
    sujeitos = ["eu", "voce", "a gente", "nos", "ele", "ela"]
    verbos_curtir = ["gosto", "curto", "adoro", "amo", "aprecio"]
    verbos_fazer = ["faco", "fac", "vou fazer", "to fazendo", "planejo fazer"]
    verbos_saber = ["sei", "conheco", "entendo", "comprendo", "domino"]
    verbos_ensinar = ["ensino", "explico", "mostro", "passo", "detalho"]
    verbos_aprender = ["aprendo", "estudo", "pratico", "treino", "me dedico"]
    verbos_criar = ["crio", "desenvolvo", "monto", "fac", "construo"]
    verbos_ajudar = ["ajudo", "auxilio", "socorro", "dou uma mao", "resolvo"]

    contextos_programacao = [
        "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust",
        "PHP", "Ruby", "Kotlin", "Swift", "Dart", "Scala", "Elixir", "Haskell",
        "React", "Vue", "Angular", "Svelte", "Next.js", "Nuxt", "Node.js",
        "Django", "Flask", "FastAPI", "Express", "Spring", "Rails",
        "HTML", "CSS", "Sass", "Tailwind", "Bootstrap",
        "SQL", "MongoDB", "PostgreSQL", "MySQL", "Redis",
        "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Linux",
        "Git", "GitHub", "GitLab", "Jenkins", "CI/CD",
        "REST API", "GraphQL", "WebSocket", "HTTP", "TCP/IP",
        "machine learning", "deep learning", "neural networks", "IA",
        "blockchain", "criptografia", "seguranca",
    ]

    temas_gerais = [
        "ciencia", "historia", "matematica", "fisica", "quimica", "biologia",
        "astronomia", "geografia", "filosofia", "psicologia", "sociologia",
        "economia", "politica", "educacao", "saude", "nutricao", "fitness",
        "tecnologia", "inovacao", "sustentabilidade", "meio ambiente",
        "arte", "musica", "fotografia", "cinema", "teatro", "literatura",
        "jogos", "esportes", "viagem", "culinaria", "jardinagem",
        "design", "marketing", "vendas", "empreendedorismo", "negocios",
    ]

    acoes_programacao = ["criar", "desenvolver", "fazer", "montar", "programar", "construir", "implementar"]
    coisas_programacao = [
        "um site", "um app", "uma API", "um jogo", "um bot", "um sistema",
        "uma loja online", "um blog", "um portfolio", "um dashboard",
        "um chat", "um forum", "uma plataforma", "uma ferramenta",
    ]
    niveis = ["basico", "intermediario", "avançado", "iniciante", "profissional"]
    motivos = ["por diversao", "pro portfolio", "pra ganhar dinheiro", "pro trabalho",
               "pra aprender", "pro cliente", "pra mim", "pra vender"]

    estilos_resposta = [
        " direto e simples", " detalhado com exemplos", " passo a passo",
        " com dicas praticas", " de um jeito facil", " pra iniciante",
        " como um expert", " com analogias", " na moral", " sem frescura",
    ]

    # ==========================================
    # 1. PERGUNTAS SOBRE PROGRAMACAO (cada uma unica)
    # ==========================================
    for _ in range(3000):
        lang = pick(contextos_programacao)
        acao = pick(acoes_programacao)
        coisa = pick(coisas_programacao)
        nivel = pick(niveis)

        perguntas = [
            f"Como {acao} {coisa} com {lang}?",
            f"Quero {acao} {coisa}, {lang} serve?",
            f"Me ensina a {acao} {coisa} em {lang}",
            f"Qual o melhor jeito de {acao} {coisa}?",
            f"{lang} e bom pra {acao} {coisa}?",
            f"Como aprender {lang} pra {acao} {coisa}?",
            f"Dicas de {lang} pra {acao} {coisa}",
            f"{lang} {nivel} pra {acao} {coisa}?",
            f"Me da um tutorial de {lang} pra {acao} {coisa}",
            f"Pra que {lang} serve? Quero {acao} {coisa}",
        ]

        respostas = [
            f"{lang} e otimo pra {acao} {coisa}! Comece pelo basico.",
            f"Use {lang}! Comece {nivel} e va evoluindo.",
            f"{lang} e perfeito pra {acao} {coisa}. A documentacao e boa.",
            f"Pra {acao} {coisa}, {lang} e uma otima escolha!",
            f"Comece entendendo {lang} {nivel}, depois va pra projetos reais.",
            f"{lang} e {nivel} de aprender mas vale muito a pena!",
            f"Recomendo {lang}! Muita gente usa e tem bastante material.",
            f"O melhor caminho: aprenda {lang} {nivel} e va {acao} coisas reais.",
        ]

        lines.append(pick(perguntas))
        lines.append(pick(respostas))

    # ==========================================
    # 2. CONVERSAS CASUAIS (combinacao dimensional)
    # ==========================================
    sujeitos_casal = ["eu", "voce", "a gente"]
    sentimentos = ["feliz", "animado", "tranquilo", "cansado", "empolgado",
                    "motivado", "relaxado", "estressado", "animadissimo"]
    planos = [
        "estudar", "trabalhar", "viajar", "descansar", "treinar",
        "ler", "jogar", "cozinhar", "caminhar", "correr",
        "programar", "criar algo", "aprender algo novo", "conversar",
    ]
    horas = ["amanha", "hoje", "depois", "mais tarde", "agora", "no fim de semana"]
    quantos = ["muito", "pouco", "bastante", "demais", "um pouco", "torrada"]
    razoes = [
        "porque to motivado", "porque preciso", "porque quero",
        "porque e importante", "porque gosto", "porque vou precisar",
    ]

    for _ in range(3000):
        suj = pick(sujeitos_casal)
        sent = pick(sentimentos)
        plano = pick(planos)
        hora = pick(horas)
        qtd = pick(quantos)
        razao = pick(razoes)

        perguntas = [
            f"Voce ta {sent}?",
            f"Como voce ta?",
            f"O que voce ta fazendo {hora}?",
            f"Voce planeja {plano}?",
            f"Voce ta {sent} hoje?",
            f"Como ta seu dia?",
            f"O que ta rolando?",
            f"Ta bem?",
        ]

        respostas = [
            f"To {sent}! Vou {plano} {hora}.",
            f"To {sent} {qtd}! {razao.capitalize()}.",
            f"Bem sim! Vou {plano} {hora}, to {sent}.",
            f"Na melhor! {plano.capitalize()} {hora} e to {sent}!",
            f"To {sent}! Quero {plano} {hora}.",
            f"Muito bem! Vou {plano}, to {sent}.",
            f"Otimo! {plano.capitalize()} {hora} e to {sent}!",
        ]

        lines.append(pick(perguntas))
        lines.append(pick(respostas))

    # ==========================================
    # 3. EXPLICACOES E ENSINO (combinacao dimensional)
    # ==========================================
    for _ in range(2000):
        tema = pick(temas_gerais)
        estilo = pick(estilos_resposta)

        perguntas = [
            f"Me explica sobre {tema}{estilo}",
            f"O que voce sabe sobre {tema}?",
            f"Ensine sobre {tema}{estilo}",
            f"Quero aprender sobre {tema}",
            f"Me fala de {tema}",
            f"Qual a importancia de {tema}?",
            f"Pra que {tema} serve?",
        ]

        respostas = [
            f"{tema.capitalize()} e muito interessante! Vou te explicar{estilo}.",
            f"Otimo topico! {tema.capitalize()} e fascinante! Vou detalhar{estilo}.",
            f"Vou te ensinar sobre {tema}{estilo}.",
            f"{tema.capitalize()} e importante! Deixa eu te explicar{estilo}.",
            f"Adoro {tema}! Vou te falar tudo sobre{estilo}.",
        ]

        lines.append(pick(perguntas))
        lines.append(pick(respostas))

    # ==========================================
    # 4. OPINIOES E GOSTOS (cada frase unica)
    # ==========================================
    itens = [
        "Python", "JavaScript", "React", "Node.js", "Docker", "Linux",
        "VS Code", "GitHub", "AWS", "Tailwind", "TypeScript",
        "programacao", "design", "fotografia", "musica", "jogos",
        "cafe", "pizza", "chocolate", "acai", "hamburguer",
        "academia", "corrida", "natacao", "yoga",
        "livros", "podcasts", "animes", "filmes", "series",
        "viajar", "cozinhar", "dormir", "estudar", "trabalhar",
    ]

    graus = ["muito", "bastante", "demais", "um pouco", "pouco", "torrada"]
    razoes_gosto = [
        "porque e divertido", "porque e util", "porque gosto",
        "porque aprendo muito", "porque e relaxante", "porque me faz bem",
        "porque e interessante", "porque e legal", "porque ta na moda",
    ]

    for _ in range(2000):
        item = pick(itens)
        grau = pick(graus)
        razao = pick(razoes_gosto)

        perguntas = [
            f"Voce gosta de {item}?",
            f"O que voce acha de {item}?",
            f"Voce curte {item}?",
            f"Me conta sobre {item}",
            f"{item} e bom?",
        ]

        respostas = [
            f"Gosto {grau} de {item}! {razao.capitalize()}.",
            f"Adoro {item}! {razao.capitalize()}.",
            f"{item} e incrivel! Gosto {grau}!",
            f"Curto {item} {grau}! {razao.capitalize()}.",
            f"Amo {item}! E {grau} bom!",
        ]

        lines.append(pick(perguntas))
        lines.append(pick(respostas))

    # ==========================================
    # 5. CONVERSACAO MULTI-TURNO (variacoes)
    # ==========================================
    nomes = ["amor", "gato", "parceiro", "mano", "vida", "bro",
             "meu bem", "meu querido", "cara"]

    for _ in range(1000):
        nome = pick(nomes)
        sent = pick(sentimentos)
        plano = pick(planos)
        hora = pick(horas)

        # Turno 1
        lines.append(pick(["Oi", "Ola", "Ei", "Fala", "Hey", "E ae"]) + f" {nome}")
        lines.append(pick([
            f"Oi! Como voce ta?",
            f"Fala! Tudo bem?",
            f"Oii! Que bom te ver!",
            f"E ae! Beleza?",
            f"Hey! Como vai?",
        ]))

        # Turno 2
        lines.append(pick([
            f"To {sent}!", f"Bem sim!", f"Otimo!", f"Tranquilo!",
            f"Na melhor!", f"To {sent} {qtd}!" if (qtd := pick(graus)) else f"To bem!",
        ]))
        lines.append(pick([
            "Que bom!", "Otimo!", "Fico feliz!", "Show!", "Legal!",
        ]))

        # Turno 3
        lines.append(pick([
            f"E voce? Como ta?",
            f"Voce ta bem?",
            f"Como vai voce?",
        ]))
        lines.append(pick([
            f"To bem! Vou {plano} {hora}.",
            f"Otimo! {plano.capitalize()} {hora}!",
            f"Show! To {pick(sentimentos)}!",
        ]))

    # ==========================================
    # 6. CODIGO EXEMPLOS (variacoes)
    # ==========================================
    langs = ["Python", "JavaScript", "TypeScript", "Java", "C++", "Go", "Rust"]
    operacoes = [
        ("somar dois numeros", "funcao que soma"),
        ("inverter uma string", "funcao que inverte"),
        ("verificar se e par", "funcao que checa par"),
        ("encontrar o maior numero", "funcao que acha maior"),
        ("calcular fatorial", "funcao de fatorial"),
        ("ordenar uma lista", "funcao de sort"),
        ("contar vogais", "funcao que conta"),
        ("verificar palindromo", "funcao palindromo"),
    ]

    for _ in range(1000):
        lang = pick(langs)
        op, desc = pick(operacoes)

        lines.append(f"Me mostra como {op} em {lang}")
        lines.append(f"Claro! Aqui vai uma {desc} em {lang}:")

    # ==========================================
    # 7. CODIGO REAL COM SNIPPETS
    # ==========================================
    snippets = [
        ("Python", "def soma(a, b):\n    return a + b", "funcao que soma"),
        ("Python", "for i in range(10):\n    print(i)", "loop de 0 a 9"),
        ("Python", "nums = [1,2,3,4,5]\nquad = [x**2 for x in nums]", "list comprehension"),
        ("Python", "try:\n    x = 1/0\nexcept ZeroDivisionError:\n    print('erro')", "tratamento de erro"),
        ("Python", "class Pessoa:\n    def __init__(self, nome):\n        self.nome = nome", "classe simples"),
        ("JavaScript", "function soma(a, b) {\n    return a + b;\n}", "funcao que soma"),
        ("JavaScript", "for (let i = 0; i < 10; i++) {\n    console.log(i);\n}", "loop de 0 a 9"),
        ("JavaScript", "const nums = [1,2,3,4,5];\nconst quad = nums.map(x => x**2);", "map em array"),
        ("JavaScript", "try {\n    x = 1/0;\n} catch(e) {\n    console.log('erro');\n}", "try catch"),
        ("TypeScript", "function soma(a: number, b: number): number {\n    return a + b;\n}", "funcao tipada"),
        ("TypeScript", "interface Pessoa {\n    nome: string;\n    idade: number;\n}", "interface"),
        ("Java", "public static int soma(int a, int b) {\n    return a + b;\n}", "metodo static"),
        ("C++", "int soma(int a, int b) {\n    return a + b;\n}", "funcao basica"),
        ("Go", "func soma(a, b int) int {\n    return a + b\n}", "funcao go"),
        ("Rust", "fn soma(a: i32, b: i32) -> i32 {\n    a + b\n}", "funcao rust"),
        ("Python", "import requests\nresp = requests.get('https://api.example.com')\nprint(resp.json())", "requisicao HTTP"),
        ("Python", "with open('arq.txt', 'r') as f:\n    conteudo = f.read()", "leitura de arquivo"),
        ("Python", "@app.route('/api')\ndef index():\n    return {'msg': 'ola'}", "rota FastAPI"),
        ("JavaScript", "fetch('/api').then(r => r.json()).then(d => console.log(d))", "fetch API"),
        ("Python", "import pandas as pd\ndf = pd.read_csv('dados.csv')\nprint(df.head())", "ler CSV com pandas"),
        ("Python", "from flask import Flask\napp = Flask(__name__)\n\n@app.route('/')\ndef ola():\n    return 'ola'", "app Flask basico"),
    ]

    for _ in range(1500):
        lang, codigo, desc = pick(snippets)
        perguntas = [
            f"Me mostra como fazer {desc} em {lang}",
            f"Qual o codigo de {desc} em {lang}?",
            f"Me da um exemplo de {desc} em {lang}",
            f"Como e o codigo de {desc}?",
            f"Codigo de {desc} em {lang} por favor",
        ]
        respostas = [
            f"Claro! {desc} em {lang}:\n{codigo}",
            f"Aqui vai! {codigo}",
            f"Olha so: {codigo}\nIsso e {desc} em {lang}.",
            f"O codigo de {desc} em {lang} e assim:\n{codigo}",
        ]
        lines.append(pick(perguntas))
        lines.append(pick(respostas))

    # ==========================================
    # 8. FAQ TECNICO (respostas diretas)
    # ==========================================
    faqs = [
        ("o que e Python", "Python e uma linguagem de programacao versatil, facil de aprender e muito usada em web, dados e IA."),
        ("o que e JavaScript", "JavaScript e a linguagem da web. Tudo que roda no navegador usa JS. Tambem serve pra backend com Node."),
        ("o que e TypeScript", "TypeScript e JavaScript com tipos. Mais organiza e seguro pra projetos grandes."),
        ("o que e React", "React e uma biblioteca JS da Meta pra criar interfaces com componentes. Muito usada em SPAs."),
        ("o que e Node.js", "Node.js e o JavaScript rodando fora do navegador. Serve pra criar APIs e servidores."),
        ("o que e FastAPI", "FastAPI e um framework Python moderno pra APIs. Super rapido e com docs automaticos."),
        ("o que e Docker", "Docker cria containers. Sua roda em qualquer lugar sem problemas de compatibilidade."),
        ("o que e Git", "Git e controle de versao. Salva historico de mudancas no codigo. Indispensavel pra dev."),
        ("o que e GitHub", "GitHub e onde o codigo Git fica online. Colaboracao, issues, pull requests."),
        ("o que e IA", "Inteligencia Artificial e sistemas que aprendem com dados. Como chatbots, reconhecimento de imagem, etc."),
        ("o que e machine learning", "Machine learning e IA que aprende automaticamente com dados, sem ser programada regra por regra."),
        ("o que e API", "API e uma interface pra dois sistemas conversarem. Como um garcom que leva seu pedido pra cozinha."),
        ("o que e banco de dados", "Banco de dados e onde voce guarda informacoes organizadas. Como SQL, MongoDB, etc."),
        ("o que e SQL", "SQL e a linguagem pra falar com bancos de dados relacionais. INSERT, SELECT, UPDATE, DELETE."),
        ("o que e NoSQL", "NoSQL sao bancos nao-relacionais. MongoDB, Redis, DynamoDB. Mais flexiveis que SQL."),
        ("o que e cloud", "Cloud e computacao na nuvem. AWS, Azure, GCP. Roda na internet sem servidor proprio."),
        ("o que e DevOps", "DevOps e a uniao de desenvolvimento e operacoes. CI/CD, automacao, deploy continuo."),
        ("o que e Frontend", "Frontend e a parte visual do site. O que o usuario ve e interage. HTML, CSS, JS."),
        ("o que e Backend", "Backend e a parte do servidor. Logica, banco de dados, APIs. O que roda por tras."),
        ("o que e Full Stack", "Full Stack e quem faz frontend e backend. Desenvolvedor completo."),
        ("o que e uma SPA", "SPA e Single Page Application. Site que nao recarrega a pagina inteira. Como React, Vue."),
        ("o que e WebSocket", "WebSocket e conexao em tempo real entre cliente e servidor. Como chat ao vivo."),
        ("o que e REST", "REST e padrao de API. Usa verbos HTTP (GET, POST, PUT, DELETE) pra recursos."),
        ("o que e GraphQL", "GraphQL e uma alternativa ao REST. Voce pede exatamente o que precisa."),
        ("o que e OAuth", "OAuth e autenticacao. Login com Google, GitHub, etc. Seguro e padronizado."),
    ]

    for _ in range(1500):
        pergunta, resposta = pick(faqs)
        variacoes = [
            pergunta,
            f"Me explica: {pergunta}",
            f"O que voce sabe sobre {pergunta.split('o que e ')[-1]}?",
            f"{pergunta.capitalize()}?",
        ]
        lines.append(pick(variacoes))
        lines.append(resposta)

    # ==========================================
    # 9. CONVERSAS LONGAS (multi-turno profundo)
    # ==========================================
    fluxos = [
        [
            "Quero criar um site",
            "Otimo! Que tipo de site? Pessoal, loja, blog?",
            "Uma loja online",
            "Legal! Voce ja sabe programar ou quer comecar do zero?",
            "Sei um pouco de HTML e CSS",
            "Otimo comeco! Pra loja online, recomendo usar JavaScript no frontend e Python ou Node no backend. Quer que eu te ensine?",
            "Sim, me ensina por favor",
            "Vamos comecar pelo basico. Crie um arquivo index.html com um formulario de cadastro. Depois a gente conecta no banco de dados."
        ],
        [
            "To precisando de ajuda",
            "Claro! O que ta acontecendo?",
            "Meu codigo ta dando erro",
            "Qual erro? Me mostra a mensagem",
            "TypeError: cannot read property of undefined",
            "Esse erro e porque voce ta acessando uma propriedade de algo que nao existe. Verifica se a variavel foi definida antes de usar.",
            "Como faço isso?",
            "Usa if (variavel) antes de acessar, ou optional chaining: variavel?.propriedade"
        ],
        [
            "Bom dia, como voce ta?",
            "Bom dia! To otimo e voce?",
            "Bem tambem! O que voce sabe fazer?",
            "Sei te ajudar com programacao, explicar conceitos de TI, dar dicas de carreira e até bater papo!",
            "Massa! Me ensina algo basico de Python",
            "Vamos la! Abre o terminal e digita python. Depois digita print('ola mundo'). Isso e o basico!",
            "Legal! E pra criar uma API?",
            "Usa o FastAPI. pip install fastapi uvicorn, cria um arquivo main.py e bota um @app.get('/'). Rapido e facil!"
        ],
    ]

    for _ in range(1000):
        fluxo = pick(fluxos)
        for i in range(0, len(fluxo), 2):
            if i + 1 < len(fluxo):
                lines.append(fluxo[i])
                lines.append(fluxo[i + 1])

    # ==========================================
    # 10. COMANDOS UTILS DO DIA A DIA
    # ==========================================
    comandos = [
        ("git init", "Inicializa um repositorio Git na pasta atual"),
        ("git add .", "Adiciona todos os arquivos pra commit"),
        ("git commit -m 'msg'", "Faz um commit com mensagem"),
        ("git push", "Envia commits pro repositorio remoto"),
        ("git pull", "Baixa atualizacoes do remoto"),
        ("npm install pacote", "Instala um pacote npm"),
        ("pip install pacote", "Instala um pacote Python"),
        ("docker run imagem", "Roda um container Docker"),
        ("docker build -t nome .", "Builda uma imagem Docker"),
        ("ls -la", "Lista arquivos com detalhes no Linux"),
        ("cd pasta", "Entra numa pasta"),
        ("mkdir nome", "Cria uma pasta"),
        ("rm arquivo", "Remove um arquivo"),
        ("python main.py", "Roda um script Python"),
        ("node server.js", "Roda um script Node"),
        ("npm run dev", "Roda o servidor de desenvolvimento"),
        ("curl -X GET url", "Faz requisicao HTTP GET"),
        ("chmod +x arquivo", "Torna arquivo executavel no Linux"),
        ("ssh user@host", "Conecta num servidor remoto"),
        ("scp arquivo user@host:/path", "Copia arquivo pro servidor"),
    ]

    for _ in range(500):
        cmd, desc = pick(comandos)
        perguntas = [
            f"O que faz o comando {cmd}?",
            f"Como usar {cmd}?",
            f"Me explica o comando {cmd}",
            f"{cmd} serve pra que?",
        ]
        respostas = [
            f"{cmd} serve pra {desc}.",
            f"O comando {cmd} {desc}.",
            f"Com {cmd} voce {desc}.",
        ]
        lines.append(pick(perguntas))
        lines.append(pick(respostas))

    # ==========================================
    # EMBARALHAR
    # ==========================================
    random.shuffle(lines)
    return lines


def main():
    print("GERADOR v3 — VARIEDADE DIMENSIONAL")

    lines = gen()

    out_dir = os.path.join(os.path.dirname(__file__), 'data')
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, 'corpus_br.txt')

    with open(out_path, 'w', encoding='utf-8') as f:
        for line in lines:
            f.write(line + '\n')

    unicas = set(lines)
    repetidas = len(lines) - len(unicas)

    print(f"\nTOTAL: {len(lines)} linhas")
    print(f"Unicas: {len(unicas)} ({len(unicas)/len(lines)*100:.1f}%)")
    print(f"Repetidas: {repetidas} ({repetidas/len(lines)*100:.1f}%)")
    print(f"Salvo: {out_path}")


if __name__ == '__main__':
    main()
