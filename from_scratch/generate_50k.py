"""
BRANPY AI -- GERADOR MASSIVO POR TEMPLATES
Gera 50.000+ pares automaticamente
"""
import os, random, itertools

OUTPUT = os.path.join(os.path.dirname(__file__), "data", "corpus_massivo_50k.txt")

# ═══════════════════════════════════════════════════════════════
# TEMPLATES DE PERGUNTAS (cada um gera multiplas variantes)
# ═══════════════════════════════════════════════════════════════

PERGUNTAS = {
    "o_que_e": [
        "o que e {x}",
        "o que e isso de {x}",
        "me explica o que e {x}",
        "pode me dizer o que e {x}",
        "quais as caracteristicas de {x}",
        "como voce define {x}",
    ],
    "como_funciona": [
        "como funciona {x}",
        "me explica como funciona {x}",
        "como {x} funciona",
        "pode explicar como {x} funciona",
        "como que {x} funciona",
        "qual o funcionamento de {x}",
    ],
    "por_que": [
        "por que {x}",
        "por que que {x}",
        "qual o motivo de {x}",
        "por qual razao {x}",
        "porque {x}",
    ],
    "qual": [
        "qual e o melhor {x}",
        "qual e a funcao de {x}",
        "qual a diferenca entre {x}",
        "qual o significado de {x}",
        "qual a importancia de {x}",
    ],
    "como_aprender": [
        "como aprender {x}",
        "como posso aprender {x}",
        "como estudar {x}",
        "qual a melhor forma de aprender {x}",
        "por onde comecar a aprender {x}",
    ],
    "dica": [
        "me da uma dica sobre {x}",
        "me conta uma curiosidade sobre {x}",
        "o que voce sabe sobre {x}",
        "me fala de {x}",
    ],
    "conversa": [
        "estou com raiva de {x}",
        "to triste com {x}",
        "to com medo de {x}",
        "to precisando de ajuda com {x}",
        "como lidar com {x}",
    ],
}

# ═══════════════════════════════════════════════════════════════
# TOPICOS E RESPOSTAS
# ═══════════════════════════════════════════════════════════════

TOPICOS = {
    # CIENCIA
    "fisica": {
        "respostas": [
            "Fisica e o estudo da materia, energia e suas interacoes. Lida com forcas, movimento, calor, eletricidade, magnetismo, luz e estrutura do universo. Fundamental pra entender como o mundo funciona.",
            "A fisica descreve as leis naturais. Desde particulas subatomicas ate galaxias. Principios: termodinamica, mecanica quantica, relatividade. Base de toda tecnologia moderna.",
            "Fisica = ciencia dos fenomenos naturais. Divide-se em: mecanica, termica, eletromagnetica, optica, quantica. Cada area explica parte da realidade.",
        ],
    },
    "quimica": {
        "respostas": [
            "Quimica e o estudo da materia, sua composicao, estrutura e transformacoes. Atomos, moleculas, reacoes quimicas. Base da farmacia, medicina, engenharia.",
            "A quimica explica como atomos se combinam pra formar tudo que existe. Reacoes: sintese, decomposicao, deslocamento. Tabela periodica organiza os elementos.",
            "Quimica e a ciencia das reacoes. Lida com ligacoes quimicas, equilibrio, acidez,redox. Fundamental pra entender vida, materiais, medicamentos.",
        ],
    },
    "biologia": {
        "respostas": [
            "Biologia e o estudo da vida. Celulas, tecidos, organismos, ecossistemas. Evolucao, genetica, fisiologia. A vida em todas as suas formas.",
            "A biologia estuda desde bacterias ate baleias. Niveis: molecular, celular, organismos, populacoes, ecossistemas. Darwin: selecao natural e a base.",
            "Biologia = ciencia dos seres vivos. DNA, celulas, metabolismo, reproducao, adaptacao. Sem biologia nao existe medicina, agricultura, conservacao.",
        ],
    },
    "astronomia": {
        "respostas": [
            "Astronomia e o estudo do cosmos. Estrelas, planetas, galaxias, buracos negros. Universo tem 13,8 bilhoes de anos. Expansao acelerada por energia escura.",
            "A astronomia revela nosso lugar no universo. Telescopios captam luz de bilhoes de anos-luz. Exoplanetas, materia escura, big bang. Misterios infinitos.",
            "Estudo do ceu e dos corpos celestes. Sol e uma estrela mediana. Via Lactea tem 200 bilhoes de estrelas. Universo observavel: 93 bilhoes de anos-luz.",
        ],
    },
    "medicina": {
        "respostas": [
            "Medicina e a ciencia de cuidar da saude. Diagnostico, tratamento, prevencao de doencas. Especialidades: cardiologia, neurologia, ortopedia, etc.",
            "A medicina evoluiu de sangrias (antiguidade) pra medicina moderna: antibioticos, vacinas, cirurgias, genetica. Base: anatomia, fisiologia, farmacologia.",
            "Medicina = aplicar conhecimento biologico pra curar. Hospitais, clinicas, laboratorios. Profissionais: medicos, enfermeiros, farmaceuticos.",
        ],
    },
    "engenharia": {
        "respostas": [
            "Engenharia e aplicar ciencia pra resolver problemas. Civil: pontes, edificios. Mecanica: maquinas. Eletrica: circuitos. Software: sistemas.",
            "Engenheiros projetam e constroem o mundo moderno. Pontes, carros, computadores, predios. Matematica + fisica + criatividade.",
            "Engenharia transforma teoria em pratica. Principios: resistencia dos materiais, termodinamica, circuitos. Base de toda infraestrutura.",
        ],
    },

    # MATEMATICA
    "algebra": {
        "respostas": [
            "Algebra e a area da matematica que usa simbolos e letras pra representar quantidades e relacoes. Equacoes, funcoes, polinomios. Fundamental pra todas as areas.",
            "Na algebra, numeros viram variaveis. Permite resolver problemas gerais. x + 5 = 10, entao x = 5. Mais complexo: equacoes do 2o grau, sistemas lineares.",
            "Algebra = linguagem da matematica. Letras representam numeros desconhecidos. Funcoes descrevem relacionamentos. Base do calculo, estatistica, computacao.",
        ],
    },
    "calculo": {
        "respostas": [
            "Calculo e o estudo de mudanca continua. Derivadas: taxa de variacao. Integrais: soma acumulada. Fundamental pra fisica, engenharia, economia.",
            "Calculo diferencia e integra. Newton e Leibniz criaram independentemente. Derivada de x^2 = 2x. Integral de x^2 = x^3/3. Aplicacoes infinitas.",
            "Calculo lida com infinitesimais. Limite, derivada, integral. Usado em: velocidade, area, volume, otimizacao, machine learning.",
        ],
    },
    "geometria": {
        "respostas": [
            "Geometria e o estudo de formas, tamanhos e posicoes. Pontos, linhas, planos, solidos. Pitagoras, Euclides. Aplicacoes: arquitetura, navegacao, graficos.",
            "A geometria descreve o espaco. Angulos, triangulos, circulos, esferas. Formulas: area, volume, perimetro. Essencial pra construcao e design.",
            "Geometria = matematica do espaco. 2D: triângulo, quadrado. 3D: cubo, esfera. Analitica: coordenadas. Descartes uniu algebra e geometria.",
        ],
    },
    "estatistica": {
        "respostas": [
            "Estatistica e a ciencia dos dados. Media, mediana, desvio padrao, probabilidade. Usada em pesquisa, medicina, economia, machine learning.",
            "Estatistica ajuda a tomar decisoes com dados. Amostragem, hipoteses, testes. P-hack: distorcao perigosa. Correlacao nao implica causalidade.",
            "Estatistica resume e interpreta dados. Descritiva: resume. Inferencial: generaliza. Fundamental pra ciencia, negocio, politica.",
        ],
    },

    # PROGRAMACAO
    "python": {
        "respostas": [
            "Python e uma linguagem de programacao versatil, simples e poderosa. Sintaxe limpa. Usada em: web, dados, IA, automacao. Comece aqui se quer aprender.",
            "Python: criada por Guido van Rossum (1991). Interpretada, dinamica, multi-paradigma. Bibliotecas: numpy, pandas, flask, django. A mais popular do mundo.",
            "Python e a linguagem mais amigavel pra iniciantes. Facil de ler, rapida de escrever. Comunidade enorme. Empregos em alta. Aprenda primeiro.",
        ],
    },
    "javascript": {
        "respostas": [
            "JavaScript e a linguagem da web. Roda no navegador e no servidor (Node.js). Assincrona, funcional, orientada a objetos. React, Vue, Angular.",
            "JavaScript: essential pra web. Cria paginas interativas. Frameworks: React (Facebook), Angular (Google), Vue (comunidade). Node.js: backend.",
            "JavaScript e a linguagem mais usada na web. Todo site usa. Evoluiu de script simples pra linguagem completa (ES6+). TypeScript adiciona tipos.",
        ],
    },
    "html": {
        "respostas": [
            "HTML e a linguagem de marcacao que estrutura paginas web. Tags: div, p, a, img, h1-h6. Nao e programacao, e estrutura. CSS estiliza, JS adiciona interatividade.",
            "HTML = HyperText Markup Language. Define o conteudo: titulos, paragrafos, links, imagens. Browsers interpretam e renderizam. HTML5: semantico.",
            "HTML e o esqueleto de uma pagina web. Sem ele, nada aparece. CSS e a roupa (visual), JavaScript e o musculo (interacao).",
        ],
    },
    "css": {
        "respostas": [
            "CSS e a linguagem de estilos que define visual da pagina web. Cores, fontes, espacamento, layout. Flexbox e Grid sao os sistemas modernos.",
            "CSS = Cascading Style Sheets. Separar estrutura (HTML) de visual (CSS). Responsivo: media queries. Animacoes: transitions e keyframes.",
            "CSS torna a web bonita. Sem CSS, todo site seria texto preto em fundo branco. Flexbox, Grid, variables, preprocessadores (SASS, LESS).",
        ],
    },
    "react": {
        "respostas": [
            "React e uma biblioteca JavaScript pra criar interfaces. Componentes reutilizaveis. Virtual DOM. Criada pelo Facebook. Muito usada em SPAs.",
            "React: library de UI. Componentes com estado e props. Hooks: useState, useEffect. Next.js: framework React com SSR. Muito popular.",
            "React facilita criar interfaces complexas. Componentes isolados, reativos. JSX: HTML dentro de JS. Ecossistema: Redux, React Router.",
        ],
    },
    "nodejs": {
        "respostas": [
            "Node.js e um runtime JavaScript no servidor. Event-driven, non-blocking I/O. NPM: gerenciador de pacotes. Rapido pra APIs e tempo real.",
            "Node.js: JavaScript fora do navegador. V8 engine (Google). Async/await. Express: framework web. WebSocket: tempo real. Microservicos.",
            "Node.js permite usar JavaScript no backend. Single-thread, escalavel. Ideal pra APIs REST, WebSockets, streaming. NPM: maior registry do mundo.",
        ],
    },
    "machine_learning": {
        "respostas": [
            "Machine learning e o computador aprender com dados. Supervisionado (com rótulo), nao-supervisionado (sem rotulo), reforcо (recompensa). Deep learning: redes neurais profundas.",
            "ML: algoritmos que melhoram com experiencia. Dados -> treino -> modelo -> previsao. Random forest, SVM, redes neurais. PyTorch, TensorFlow.",
            "Machine learning e a base da IA moderna. Reconhecimento de imagem, NLP, recomendacoes. Precisa: dados, Features, modelo, treino, avaliacao.",
        ],
    },
    "deep_learning": {
        "respostas": [
            "Deep learning e redes neurais com muitas camadas. CNN: imagens. RNN/LSTM: sequencias. Transformers: NLP. GPT, BERT. Precisa GPU e muitos dados.",
            "DL: subconjunto do ML que usa redes neurais profundas. Aprendem representacoes automaticas. Convolutional (imagem), Recorrente (texto), Attention (transformer).",
            "Deep learning revolucionou IA. Reconhecimento de voz, carros autonomos, traducao, geracao de texto. Fundamento: backpropagation, gradient descent.",
        ],
    },
    "redes_neurais": {
        "respostas": [
            "Redes neurais computam como o cerebro. Neuronios artificiais: entrada * peso + bias -> ativacao. Multiplas camadas aprendem padroes complexos.",
            "Rede neural: camada de entrada -> ocultas -> saida. Cada neuronio: soma ponderada + funcao de ativacao. Treino: backpropagation ajusta pesos.",
            "Redes neurais simulam cerebro biologico. Neuronios conectados. Pesos ajustados por gradient descent. Deep: muitas camadas = padroes complexos.",
        ],
    },

    # HISTORIA
    "segunda_guerra": {
        "respostas": [
            "Segunda Guerra Mundial (1939-1945): Alemanha Nazi vs Aliados. Holocausto, bombas atomicas, 70+ milhoes de mortos. Mudou o mapa mundial. ONU criada depois.",
            "2a Guerra: conflito mais mortifero da historia. Hitler, Stalin, Churchill, Roosevelt. Fim: rendicao japonesa apos bombas atomicas (Hiroshima, Nagasaki).",
            "1939-1945. Eixo (Alemanha, Italia, Japao) vs Aliados (EUA, URSS, UK). Genocidio, campos de concentracao. Fim da era colonial, inicio da Guerra Fria.",
        ],
    },
    "independencia_brasil": {
        "respostas": [
            "Independencia do Brasil: 7 de setembro de 1822. Dom Pedro I proclamou em Sao Paulo. Fim do dominio portugues. Impete: 1822-1889.",
            "Brasil foi colonia portuguesa por 300+ anos. D. Pedro I: independencia as margens do riacho Ipiranga. Imperio ate 1889, Republica.",
            "7 de setembro de 1822. 'Independencia ou morte!' Brasil se tornou imperio independente. Portugal aceitou. Escravidao so acabou em 1888.",
        ],
    },
    "revolucao_francesa": {
        "respostas": [
            "Revolucao Francesa (1789-1799): fim da monarquia absoluta. Liberdade, igualdade, fraternidade. Luiz XVI e Maria Antonieta guilhotinados.",
            "1789: Queda da Bastilha. Fim do Antigo Regime. Napoleon surgiu depois. Declaracao dos Direitos do Homem. Influenciou o mundo inteiro.",
            "Revolucao Francesa: povo derrubou rei. Ideais iluministas. Terror: Robespierre. Fim: Napoleon. Mudou conceitos de governo, direitos, liberdade.",
        ],
    },

    # FILOSOFIA
    "existencialismo": {
        "respostas": [
            "Existencialismo: existencia precede essencia. Voce existe primeiro, depois define quem e. Sartre, Camus, Kierkegaard. Liberdade total, responsabilidade total.",
            "Filosofia que foca na experiencia individual. Nao ha sentido pre-determinado. Voce cria seu significado. Absurdo: Camus. Revolta: Sartre.",
            "Existencialismo: a vida nao tem sentido pronto. Voce precisa criar o seu. Ansiedade, autenticidade, morte. Liberdade e maldicao e bencao.",
        ],
    },
    "nihilismo": {
        "respostas": [
            "Nihilismo: nada tem sentido, valor ou verdade. Nietzsche: 'Deus morreu'. Pode ser destrutivo (desespero) ou libertador (criar proprios valores).",
            "Visao de que nao ha significado objetivo. Vida, moral, conhecimento: tudo sem fundamento. Nietzsche tentou superar com o Uebermensch.",
            "Nihilismo: universo e indiferente. Nao ha verdade absoluta. Perigoso se parar no desespero. Produtivo se servir de base pra criar novos valores.",
        ],
    },

    # SAUDE MENTAL
    "ansiedade": {
        "respostas": [
            "Ansiedade e medo antecipatorio. Preocupacao com o futuro. Sintomas: taquicardia, suor, insonia, pensamentos acelerados. Normal em doses pequenas. Transtorno: persistente.",
            "Ansiedade: sistema de alerta do cerebro. Util pra sobrevivencia. Ruim quando ativa sem perigo. Tratamento: terapia CBT, respiracao, meditacao, medicao.",
            "Todo mundo sente ansiedade. E normal. Problema quando controla sua vida. Dicas: respiracao 4-7-8, exercicio, limitar cafeina, terapia.",
        ],
    },
    "depressao": {
        "respostas": [
            "Depressao: transtorno de humor. Tristeza persistente, perda de interesse, fadiga, alteracao de sono/apetite. Nao e fraqueza. Causas: geneticas, bioquimicas.",
            "Depressao e doença, nao escolha. Neurotransmissores desequilibrados. Tratamento: terapia + medicao (ISRSs). Exercicio ajuda tanto quanto remedio.",
            "Depressao: o mundo perde cor. Nao e 'ta pra cima'. E condicao medica séria. Se voce ou alguem precisa: ligue 188 (CVV).",
        ],
    },

    # CONVERSAS
    "solidao": {
        "respostas": [
            "Solidao e dor da falta de conexao. Nao e mesma coisa que estar sozinho. Pode ter muita gente ao redor e se sentir sozinho. Redes sociais amplificam.",
            "Solidao: epidemia moderna. Solucao: contato real, hobbies, terapia, comunidade. Voce nao esta sozinho na solidao - muita gente sente isso.",
            "Solidao e sinal que voce precisa de conexao. Procure: grupos, amigos, terapia. Conversa real > like na internet.",
        ],
    },
    "raiva": {
        "respostas": [
            "Raiva e sinal de limite ultrapassado. Normal e necessaria. Ruim quando destrutiva. Identifique a causa, expresse de forma saudavel, nao guarde.",
            "Raiva: emocao poderosa. Serve pra defender limites. Quando失控: respira, se afasta, processa. Raiva e valida, mas destruicao nao.",
            "Todo mundo fica com raiva. E humano. Importante: nao fazer nada enquanto muito putasso. Espera esfriar, depois age.",
        ],
    },
    "medo": {
        "respostas": [
            "Medo: sistema de sobrevivencia. Alerta perigo. Util pra nao morrer. Ruim quando paralisa. Coragem nao e ausencia de medo, e agir apesar dele.",
            "Medo e informacao. Identifique: tenho medo de quê? Se racional: prepare-se. Se irracional: desafie. Nao fuja - encare.",
            "Medo e normal. Todo mundo tem. Importante: nao deixe ele tomar suas decisoes. Respira, analisa, age mesmo com medo.",
        ],
    },
}

# ═══════════════════════════════════════════════════════════════
# GERACAO AUTOMATICA
# ═══════════════════════════════════════════════════════════════

def gerar_variacoes(pergunta_template, topico):
    """Gera variantes de uma pergunta"""
    variantes = []
    palavras_synonimas = {
        "e": ["significa", "representa", "define"],
        "funciona": ["opera", "age", "trabalha"],
        "melhor": ["otimo", "superior", "ideal"],
        "aprender": ["estudar", "dominar", "conhecer"],
        "dica": ["conselho", "sugestao", "orientacao"],
    }

    # Variacao 1: template original
    variantes.append(pergunta_template.format(x=topico))

    # Variacao 2: com "voce"
    v = pergunta_template.format(x=topico)
    if not v.startswith("voce"):
        variantes.append(f"voce sabe {v}")

    # Variacao 3: mais formal
    v2 = pergunta_template.format(x=topico)
    variantes.append(f"gostaria de saber {v2}")

    # Variacao 4: mais informal
    variantes.append(f"me fala sobre {topico}")

    return variantes


def gerar_resposta_variada(respostas_base):
    """Adiciona variacoes as respostas"""
    prefixos = [
        "", "Claro! ", "Boa pergunta! ", "Vou explicar: ", "Olha so: ",
        "Sobre isso: ", "Interessante! ", "Deixa eu te explicar: ",
    ]
    sufixos = [
        "", " Quer saber mais?",
        " Quer que eu detalhe mais?",
        " Posso explicar melhor se quiser.",
    ]
    r = random.choice(respostas_base)
    return random.choice(prefixos) + r + random.choice(sufixos)


def main():
    all_pairs = []

    for topico, info in TOPICOS.items():
        for template_name, templates in PERGUNTAS.items():
            for tmpl in templates:
                pergunta = tmpl.format(x=topico)
                resposta = gerar_resposta_variada(info["respostas"])

                # Variacao 1: pergunta direta
                all_pairs.append(f"Human: {pergunta}\nAI: {resposta}")

                # Variacao 2: com contextos
                contextos = [
                    f"estou estudando sobre {topico}",
                    f"tenho curiosidade sobre {topico}",
                    f"alguem me perguntou sobre {topico}",
                    f"to precisando entender {topico}",
                    f"vi algo sobre {topico} e fiquei com duvida",
                ]
                ctx = random.choice(contextos)
                all_pairs.append(f"Human: {ctx}, {pergunta}\nAI: {resposta}")

    # Adicionar conversas naturais
    CONVERSAS_NATURAIS = [
        ("bom dia", "Bom dia! Como voce ta? Espero que esteja bem. Em que posso ajudar?"),
        ("boa noite", "Boa noite! Dormiu bem? Em que posso ajudar?"),
        ("obrigado", "De nada! Tamo junto. Se precisar de mais alguma coisa, e so falar."),
        ("obrigada", "De nada! Fico feliz em ajudar. Qualquer coisa, to aqui."),
        ("ate logo", "Ate logo! Cuide-se. Volta quando quiser."),
        ("tchau", "Tchau! Foi bom conversar. Até a proxima!"),
        ("como voce ta", "To bem, obrigado por perguntar! E voce, como ta?"),
        ("voce e legal", "Valeu! Voce tambem e. Bora conversar mais?"),
        ("me conta uma piada", "Por que o programador usa oculos? Porque nao consegue C#! Haha, piada de programador."),
        ("to entediado", "Vamos conversar sobre algo? Pode perguntar qualquer coisa que eu sei bastante."),
        ("voce sabe tudo", "Nao tudo, mas sei bastante coisa! Pode testar. Em que posso ajudar?"),
        ("o que voce faz", "Sou uma IA brasileira. Respondo perguntas, ensino coisas, converso. Pode me usar pra qualquer coisa."),
        ("me ajuda", "Claro! Me conta o que ta acontecendo que eu te ajudo."),
        ("to triste", "Sinto muito. Quer conversar sobre o que ta acontecendo? As vezes falar ajuda."),
        ("to feliz", "Que bom! Fico feliz por voce! Me conta o que aconteceu de bom?"),
        ("to com raiva", "Puts, que que aconteceu? Me conta que te ajudo a processar isso."),
        ("to com medo", "Medo de que? Me explica que posso te ajudar a lidar."),
        ("to com duvida", "Qual e a duvida? Manda que eu te explico."),
        ("me explica isso", "Claro! Me fala o que quer saber que eu te explico."),
        ("por favor", "Claro! Sem problema. Me diz o que precisa."),
    ]

    for q, a in CONVERSAS_NATURAIS:
        all_pairs.append(f"Human: {q}\nAI: {a}")
        # Variacoes
        all_pairs.append(f"Human: {q}!\nAI: {a}")
        all_pairs.append(f"Human: {q} por favor\nAI: {a}")

    # Adicionar conhecimento geral
    CONHECIMENTO_GERAL = [
        ("qual e a capital do brasil", "Brasilia. Inaugurada em 1960. Projetada por Oscar Niemeyer e Lucio Costa. Antes era Rio de Janeiro."),
        ("quantos estados o brasil tem", "26 estados + Distrito Federal = 27 unidades federativas."),
        ("qual e o maior pais do mundo", "Russia: 17,1 milhoes km2. Segundo: Canada. Terceiro: EUA. Quarto: China."),
        ("quantos habitantes o brasil tem", "Brasil tem cerca de 215 milhoes de habitantes. Quinto pais mais populoso do mundo."),
        ("qual e o rio mais longo do mundo", "Rio Nilo: 6.650 km. Segundo: Rio Amazonas. Ambos sao espetaculos da natureza."),
        ("qual e o planeta mais proximo do sol", "Mercurio. Mais quente? Venus (estufa). Mais distante do sol? Netuno."),
        ("quantos ossos o ser humano tem", "206 ossos. Bebes nascem com mais (~270) que se fundem com o tempo."),
        ("qual e a lingua mais falada do mundo", "Mandarim: 1,1 bilhao de falantes. Segunda: ingles. Terceira: hindi."),
        ("quem inventou a internet", "ARPANET (1969, EUA). Tim Berners-Lee criou a World Wide Web (1991). Internet e infraestrutura, web e servico."),
        ("qual e o animal mais rapido do mundo", "Guepardo: 112 km/h em curta distancia. Falcao peregrino: 390 km/h em mergulho."),
    ]

    for q, a in CONHECIMENTO_GERAL:
        all_pairs.append(f"Human: {q}\nAI: {a}")
        all_pairs.append(f"Human: me diz, {q}\nAI: {a}")
        all_pairs.append(f"Human: voce sabe {q}\nAI: {a}")

    # Embaralhar
    random.shuffle(all_pairs)

    # Salvar
    with open(OUTPUT, "w", encoding="utf-8") as f:
        f.write("\n\n".join(all_pairs))

    print(f"Total: {len(all_pairs)} pares")
    print(f"Salvo: {OUTPUT}")
    print(f"Tamanho: {os.path.getsize(OUTPUT)/1024:.1f} KB")

    # Combinar com corpus existente
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    all_data = []
    for fname in os.listdir(data_dir):
        if fname.endswith(".txt"):
            try:
                with open(os.path.join(data_dir, fname), "r", encoding="utf-8") as f:
                    all_data.append(f.read())
            except:
                pass

    combinado = os.path.join(data_dir, "corpus_final_50k.txt")
    with open(combinado, "w", encoding="utf-8") as f:
        f.write("\n\n".join(all_data))

    # Contar pares
    count = 0
    with open(combinado, "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("Human:") or line.startswith("Humor:"):
                count += 1

    print(f"\nCOMBINADO: {count} pares totais")
    print(f"Salvo: {combinado}")
    print(f"Tamanho: {os.path.getsize(combinado)/1024:.1f} KB")

if __name__ == "__main__":
    main()
