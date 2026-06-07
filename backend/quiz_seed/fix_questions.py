"""
Fix auto-generated questions that have incoherent alternatives.
Detects questions with generic/unrelated alternatives and replaces
them with topic-appropriate alternatives.
"""
import json, re, random
from pathlib import Path

OUT_DIR = Path(__file__).parent
JSON_PATH = OUT_DIR / "quiz_seed.json"

# Question type patterns used in auto-generation
# Question type templates and their short keys for matching
QTYPE_MAP = {
    "O que e {t}?": "O que e",
    "Qual a origem de {t}?": "Qual a origem de",
    "Como funciona {t}?": "Como funciona",
    "Onde surgiu {t}?": "Onde surgiu",
    "Por que {t} e importante?": "Por que",
    "Quem criou {t}?": "Quem criou",
    "Quando foi criado {t}?": "Quando foi criado",
    "Qual o significado de {t}?": "Qual o significado de",
    "O que caracteriza {t}?": "O que caracteriza",
    "Qual a funcao de {t}?": "Qual a funcao de",
    "Onde encontrar {t}?": "Onde encontrar",
    "Como usar {t}?": "Como usar",
    "O que saber sobre {t}?": "O que saber sobre",
}
QUESTION_TYPES = list(QTYPE_MAP.keys())

# Generic alt pools that are the problem
BAD_ALT_VALUES = {
    "Ciencia", "Historia", "Geografia", "Arte",
    "Natureza", "Tecnologia", "Cultura", "Sociedade",
    "Fenomeno natural", "Invencao humana", "Descoberta", "Teoria",
    "Seculo XX", "Seculo XIX", "Seculo XVIII", "Antiguidade",
    "No Brasil", "Na Europa", "Na Asia", "Na Africa",
}

# ============================================================
# TOPIC-SPECIFIC alternatives
# For each (category, topic), define (correct_answer, wrong1, wrong2, wrong3)
# for "O que e" type definition questions
# ============================================================

TOPIC_DEFS = {
    # ---- TECNOLOGIA ----
    ("Tecnologia", "a internet"): ("Rede global de computadores interligados", "Rede local de uma empresa", "Programa de computador", "Dispositivo de hardware"),
    ("Tecnologia", "o smartphone"): ("Dispositivo movel com funcoes de computador", "Telefone fixo digital", "Tablet de grande porte", "Computador de mesa portatil"),
    ("Tecnologia", "a inteligencia artificial"): ("Sistemas que simulam capacidade humana de raciocinio", "Tipo de hardware avancado", "Rede social automatizada", "Banco de dados inteligente"),
    ("Tecnologia", "o Bluetooth"): ("Tecnologia de comunicacao sem fio de curto alcance", "Rede Wi-Fi de longa distancia", "Cabo de conexao universal", "Satelite de comunicacao"),
    ("Tecnologia", "o Wi-Fi"): ("Tecnologia de rede sem fio local", "Conexao via cabo ethernet", "Sinal de radio AM", "Rede de telefonia movel"),
    ("Tecnologia", "a criptografia"): ("Tecnica de codificar dados para seguranca", "Linguagem de programacao", "Tipo de virus de computador", "Metodo de compressao de arquivos"),
    ("Tecnologia", "o 5G"): ("Quinta geracao de redes moveis", "Roteador de ultima geracao", "Cabo de fibra optica", "Satelite de comunicacao"),
    ("Tecnologia", "a realidade virtual"): ("Ambiente simulado digitalmente com imersao", "Video em 360 graus", "Jogo de computador comum", "Filtro de camera de celular"),
    ("Tecnologia", "o Bitcoin"): ("Criptomoeda descentralizada baseada em blockchain", "Moeda fisica digital", "Cartao de credito virtual", "Acao da bolsa de valores"),
    ("Tecnologia", "a robotica"): ("Ramo que projeta e constroi robos", "Programacao de computadores", "Fabricacao de pecas eletronicas", "Inteligencia artificial basica"),

    # ---- CIENCIA ----
    ("Ciencia", "a fotossintese"): ("Processo pelo qual plantas produzem energia usando luz", "Respiração dos animais", "Decomposicao de materia organica", "Fermentacao de acucares"),
    ("Ciencia", "o DNA"): ("Molecula que contem a informacao genetica dos seres vivos", "Proteina responsavel por transporte", "Carboidrato de reserva energetica", "Lipideo da membrana celular"),
    ("Ciencia", "a evolucao"): ("Processo de mudanca genetica das especies ao longo do tempo", "Criacao divina dos seres vivos", "Adaptacao individual durante a vida", "Selecao artificial pelo homem"),
    ("Ciencia", "a tabela periodica"): ("Classificacao organizada dos elementos quimicos", "Lista de compostos quimicos", "Conjunto de formulas matematicas", "Catalogo de reacoes quimicas"),
    ("Ciencia", "a energia nuclear"): ("Energia liberada por reacoes no nucleo atomico", "Energia proveniente do sol", "Energia gerada por queima de combustivel", "Energia hidraulica de represas"),
    ("Ciencia", "a fisica quantica"): ("Ramo da fisica que estuda o mundo subatomico", "Estudo da mecanica classica", "Ramo da quimica organica", "Parte da biologia molecular"),
    ("Ciencia", "a relatividade"): ("Teoria de Einstein sobre a curvatura do espaco-tempo", "Teoria de Newton sobre a gravidade", "Principio da termodinamica", "Teoria atomica de Dalton"),
    ("Ciencia", "as celulas-tronco"): ("Celulas capazes de se diferenciar em varios tipos celulares", "Celulas sanguineas maduras", "Neuronios do sistema nervoso", "Celulas mortas do organismo"),
    ("Ciencia", "a nanotecnologia"): ("Manipulacao da materia em escala atomica e molecular", "Tecnologia de construcao civil", "Microscopia de alta resolucao", "Engenharia de software avancada"),
    ("Ciencia", "a astronomia"): ("Ciencia que estuda os corpos celestes e o universo", "Estudo da atmosfera terrestre", "Ciencia dos fossais e rochas", "Ramo da biologia marinha"),

    # ---- HISTORIA ----
    ("Historia", "a Revolucao Industrial"): ("Periodo de grande transformacao tecnologica e produtiva", "Guerra entre nacoes europeias", "Movimento artistico do seculo XIX", "Descoberta de novo continente"),
    ("Historia", "o Renascimento"): ("Movimento cultural e cientifico dos seculos XIV-XVI", "Periodo das grandes guerras mundiais", "Era da construcao das piramides", "Revolucao agricola medieval"),
    ("Historia", "o Imperio Romano"): ("Um dos maiores imperios da antiguidade no Mediterraneo", "Dinastia chinesa milenar", "Imperio colonial britanico", "Civilizacao mesopotamica antiga"),
    ("Historia", "a Guerra Fria"): ("Conflito ideologico e politico entre EUA e URSS", "Guerra mundial entre 1914 e 1918", "Revolucao francesa de 1789", "Guerra civil americana"),
    ("Historia", "a Independencia do Brasil"): ("Processo de separacao politica de Portugal em 1822", "Guerra contra a Espanha colonial", "Revolta dos escravos no seculo XVIII", "Tratado de paz com a Inglaterra"),
    ("Historia", "a Segunda Guerra"): ("Conflito global entre 1939 e 1945 envolvendo varias nacoes", "Primeira guerra mundial do seculo XX", "Guerra civil entre estados americanos", "Conflito regional na Asia"),
    ("Historia", "a Revolucao Francesa"): ("Movimento que aboliu a monarquia absoluta na Franca", "Revolucao industrial inglesa", "Independencia dos EUA", "Revolucao Russa de 1917"),
    ("Historia", "o Antigo Egito"): ("Civilizacao antiga as margens do Rio Nilo", "Imperio inca na America do Sul", "Reino medieval europeu", "Civilizacao chinesa antiga"),
    ("Historia", "a Grecia Antiga"): ("Berco da democracia e da filosofia ocidental", "Imperio persa antigo", "Civilizacao pre-colombiana", "Reino africano medieval"),
    ("Historia", "a Idade Media"): ("Periodo historico entre os seculos V e XV na Europa", "Era dos grandes descobrimentos maritimos", "Periodo da historia antiga grega", "Seculo das revolucoes industriais"),

    # ---- GEOGRAFIA ----
    ("Geografia", "o Rio Amazonas"): ("Maior rio do mundo em volume de agua", "Rio que corta a Europa central", "Riacho de pequeno porte", "Lago de agua doce na Africa"),
    ("Geografia", "a Cordilheira dos Andes"): ("Extensa cadeia montanhosa na America do Sul", "Cordilheira montanhosa na Europa", "Planicie central da Asia", "Deserto do norte africano"),
    ("Geografia", "o Deserto do Saara"): ("Maior deserto quente do mundo no norte da Africa", "Deserto gelado da Antartida", "Floresta tropical umida", "Regiao de tundra siberiana"),
    ("Geografia", "a Antartida"): ("Continente mais frio e isolado do planeta", "Ilha tropical do Pacifico", "Deserto da Australia central", "Regiao montanhosa da Asia"),
    ("Geografia", "o Oceano Pacifico"): ("Maior oceano do planeta cobrindo um tercO da superficie", "Oceano Atlantico Norte", "Mar Mediterraneo", "Oceano Indico"),
    ("Geografia", "o Himalaia"): ("Maior cadeia montanhosa do mundo na Asia", "Cordilheira dos Alpes europeus", "Planicie amazonica", "Deserto de Gobi"),
    ("Geografia", "a Patagonia"): ("Regiao no extremo sul da America do Sul", "Regiao norte do Canada", "Planicie central da Australia", "Peninsula da Europa oriental"),
    ("Geografia", "o Mar Morto"): ("Lago hipersalino entre Israel e Jordania", "Oceano Atlantico sul", "Mar mediterraneo central", "Golfo da California"),
    ("Geografia", "a Tundra"): ("Bioma frio com vegetacao rasteira e permafrost", "Floresta tropical densa", "Savana africana com arvores esparsas", "Deserto arenoso quente"),
    ("Geografia", "a Savana"): ("Bioma tropical com gramineas e arvores esparsas", "Floresta temperada densa", "Tundra gelada polar", "Mata fechada tropical"),

    # ---- CINEMA ----
    ("Cinema", "o cinema"): ("Arte de produzir filmes com imagem em movimento", "Teatro ao vivo com atores", "Fotografia de paisagens estaticas", "Literatura de ficcao cientifica"),
    ("Cinema", "a Hollywood"): ("Distrito de Los Angeles conhecido como capital do cinema", "Bairro artistico de Paris", "Estudio de cinema britanico", "Festival de cinema europeu"),
    ("Cinema", "os efeitos especiais"): ("Tecnicas visuais para criar ilusoes em filmes", "Maquiagem teatral comum", "Figurinos historicos tradicionais", "Cenario natural sem alteracoes"),
    ("Cinema", "a animacao"): ("Tecnica de criar ilusao de movimento quadro a quadro", "Fotografia em alta velocidade", "Filmagem documental em tempo real", "Gravacao de audio estetoscopico"),
    ("Cinema", "o genero terror"): ("Genero cinematografico que busca causar medo e suspense", "Comedia romantica leve", "Documentario educacional", "Filme de faroeste classico"),
    ("Cinema", "os filmes de acao"): ("Genero com cenas de lutas, perseguicoes e explosOes", "Filmes de epoca sobre romance", "Documentarios sobre natureza", "Filmes de arte experimentais"),
    ("Cinema", "as comEdias"): ("Genero cinematografico focado em humor e entretenimento", "Drama tragico intenso", "Filme de suspense psicologico", "Documentario historico"),
    ("Cinema", "os documentarios"): ("Genero que apresenta fatos reais e informativos", "Ficcao cientifica especulativa", "Filme de animacao infantil", "Musical romantico"),
    ("Cinema", "o cinema nacional"): ("Producao cinematografica de um pais especifico", "Importacao de filmes estrangeiros", "Distribuicao global de filmes", "Festival internacional de cinema"),
    ("Cinema", "os filmes de ficcao"): ("Genero que explora cenarios imaginarios e especulativos", "Documentario baseado em fatos reais", "Filme biografico historico", "Reportagem jornalistica audiovisual"),

    # ---- CONHECIMENTOS GERAIS ----
    ("Conhecimentos Gerais", "o Bonsai"): ("Arte de cultivar arvores em miniatura em vasos", "Tipo de arvore frutifera", "Flor ornamental de jardim", "Tecnica de poda de gramados"),
    ("Conhecimentos Gerais", "a cidadania"): ("Conjunto de direitos e deveres de um cidadao", "Profissao regulamentada por lei", "Documento de identidade nacional", "Sistema eleitoral brasileiro"),
    ("Conhecimentos Gerais", "os direitos humanos"): ("Direitos fundamentais e universais de toda pessoa", "Privilegios concedidos pelo governo", "Regras de transito internacionais", "Leis comerciais de importacao"),
    ("Conhecimentos Gerais", "a economia"): ("Ciencia que estuda producao e consumo de bens", "Arte de administrar financas pessoais", "Sistema de contabilidade empresarial", "Metodo de calcular impostos"),
    ("Conhecimentos Gerais", "a filosofia"): ("Busca pelo conhecimento e sentido da existencia", "Ciencia experimental de laboratorio", "Religiao organizada institucional", "Metodo de meditacao oriental"),
    ("Conhecimentos Gerais", "a democracia"): ("Sistema politico onde o poder emana do povo", "Ditadura centralizada no lider", "Monarquia hereditaria", "Teocracia religiosa"),
    ("Conhecimentos Gerais", "a urbanizacao"): ("Processo de crescimento e desenvolvimento das cidades", "Desmatamento de areas florestais", "Agricultura familiar sustentavel", "Industrializacao rural"),
    ("Conhecimentos Gerais", "a globalizacao"): ("Integracao economica e cultural entre paises", "Isolamento politico nacional", "Protecionismo comercial interno", "Fragmentacao de mercados"),
    ("Conhecimentos Gerais", "a cultura geral"): ("Conjunto de conhecimentos sobre diversos temas", "Especializacao em uma unica area", "Habilidade tecnica especifica", "Formacao profissional academica"),

    # ---- ANIMAIS ----
    ("Animais", "o beija-flor"): ("Ave de pequeno porte que voa parado no ar", "Passaro que nao sai do chao", "Ave aquatica mergulhadora", "Rapina noturna de grande porte"),
    ("Animais", "a baleia-azul"): ("Maior animal do mundo, mamifero marinho", "Peixe de grande porte dos oceanos", "Tubarao predador dos mares", "Polvo gigante das profundezas"),
    ("Animais", "o polvo"): ("Molusco marinho com oito bracos e alta inteligencia", "Peixe de recife de coral", "Crustaceo de agua doce", "Mamifero aquatico herbivoro"),
    ("Animais", "o leao"): ("Grande felino africano conhecido como rei da selva", "Tigre de bengala asiatico", "Urso pardo norte-americano", "Lobo cinzento europeu"),
    ("Animais", "o tubarao-branco"): ("Grande tubarao predador dos oceanos", "Golfinho amigavel de mar aberto", "Baleia jubarte filtradora", "Foca do Polo Norte"),
    ("Animais", "o pinguim"): ("Ave marinha que nao voa, adaptada ao frio", "Avestruz do deserto africano", "Garca de zonas tropicais", "Flamingo de aguas rasas"),
    ("Animais", "o camaleao"): ("Lagarto que muda de cor para camuflagem", "Cobra venenosa da floresta", "Tartaruga de casco duro", "Jacare de agua doce"),
    ("Animais", "a aranha"): ("Aracnideo com oito patas que produz teia", "Inseto voador de seis patas", "Crustaceo marinho de dez patas", "Anelideo de corpo segmentado"),
    ("Animais", "o golfinho"): ("Mamifero marinho inteligente e sociável", "Peixe carnivoro de recife", "Baleia filtradora de plâncton", "Foca que vive em colonias"),
    ("Animais", "a capivara"): ("Maior roedor do mundo, nativo da America do Sul", "Rato domEstico de pequeno porte", "Castor construtor de represas", "Porco-espinho coberto de espinhos"),

    # ---- CURIOSIDADES ----
    ("Curiosidades", "a aurora boreal"): ("Fenomeno luminoso nos polos causado por particulas solares", "Arco-iris apos a chuva", "Eclipse lunar total", "Tempestade de raios noturna"),
    ("Curiosidades", "o Big Ben"): ("Nome do sino do relogio do Palacio de Westminster", "Torre Eiffel de Paris", "Estadio de Wembley em Londres", "Museu Britanico de historia"),
    ("Curiosidades", "a bioluminescencia"): ("Producao de luz por organismos vivos", "Reflexo da luz solar na agua", "Absorcao de luz por plantas", "Difracao da luz em cristais"),
    ("Curiosidades", "o Monte Everest"): ("Maior montanha do mundo com 8.848 metros", "Pico mais alto dos Alpes suicos", "Vulcao ativo do Japao", "Cordilheira dos Andes chilenos"),
    ("Curiosidades", "a Grande Barreira de Corais"): ("Maior sistema de recifes de coral do mundo", "Recife artificial construido pelo homem", "Banco de areia do Caribe", "Ilha vulcanica do Pacifico"),
    ("Curiosidades", "o Taj Mahal"): ("Mausoleu indiano construido por amor", "Templo hindu antigo", "Palacio real chines", "Mesquita turca medieval"),
    ("Curiosidades", "a Muralha da China"): ("Grande fortificacao construida na China antiga", "Piramide do Egito antigo", "Coliseu romano imperial", "Aqueduto romano na Europa"),
    ("Curiosidades", "o Pico da Neblina"): ("Ponto mais alto do Brasil com 2.995 metros", "Montanha mais alta da Argentina", "Vulcao ativo do Mexico", "Cordilheira dos Alpes europeus"),
    ("Curiosidades", "a Fossa das Marianas"): ("Ponto mais profundo do oceano com 11.000 metros", "Caverna subterranea mais funda", "Vale subaquatico do Atlantico", "Recife de coral raso"),
    ("Curiosidades", "o Deserto do Atacama"): ("Deserto mais seco do mundo no Chile", "Floresta amazonica umida", "Pantanal brasileiro alagado", "Savana africana tropical"),

    # ---- ESPORTES ----
    ("Esportes", "o futebol"): ("Esporte coletivo com 11 jogadores e uma bola", "Esporte de quadra com raquete", "Luta corporal entre dois atletas", "Corrida de longa distância"),
    ("Esportes", "o basquete"): ("Esporte de equipe com cesta suspensa a 3 metros", "Futebol americano com contato fisico", "Volei de praia com duplas", "TenIs de quadra individual"),
    ("Esportes", "a Formula 1"): ("Categoria de automobilismo de alta velocidade", "Corrida de motociclismo off-road", "Competicao de ciclismo de estrada", "Rally de carros antigos"),
    ("Esportes", "o tenis"): ("Esporte de raquete individual ou em duplas", "Luta marcial de origem japonesa", "Natacao em piscina olimpica", "Golfe em campos abertos"),
    ("Esportes", "o volei"): ("Esporte de quadra com rede e seis jogadores", "Handebol de quadra fechada", "Rugby de contato fisico intenso", "Basebol americano de arremessos"),
    ("Esportes", "a natacao"): ("Esporte aquatico com diferentes estilos de nado", "Mergulho autonomo em alto mar", "Surfe em ondas gigantes", "Remo em barcos estreitos"),
    ("Esportes", "o atletismo"): ("Conjunto de modalidades como corrida e saltos", "Luta greco-romana olimpica", "Ginastica ritmica com fitas", "Halterofilismo de levantamento"),
    ("Esportes", "o boxe"): ("Esporte de luta com socos em ringue", "Artes marciais mistas no chao", "Esgrima com espadas finas", "Capoeira de origem brasileira"),
    ("Esportes", "o MMA"): ("Artes marciais mistas com diversas tecnicas", "Luta de sumo japonesa", "Boxe classico de socos", "JudO com quedas e imobilizacoes"),
    ("Esportes", "o ciclismo"): ("Esporte sobre rodas com bicicletas", "Corrida de carros de formula", "Patinacao artistica no gelo", "Motocross de alta velocidade"),
}

# ============================================================
# QUESTION-TYPE-SPECIFIC correct answers
# For many question types, the correct answer differs from a simple definition.
# This maps (category, topic, question_pattern) -> (correct_answer, explanation_suffix)
# ============================================================

QUESTION_ANSWERS = {
    # ---- Bitcoin ----
    ("Tecnologia", "o Bitcoin", "Qual a origem de"): ("Criado em 2009 por Satoshi Nakamoto como moeda digital", "Foi criado em 2009 por Satoshi Nakamoto."),
    ("Tecnologia", "o Bitcoin", "Onde surgiu"): ("Surgiu como projeto de moeda digital peer-to-peer", "Surgiu como moeda digital descentralizada."),
    ("Tecnologia", "o Bitcoin", "Por que"): ("Porque permite transacoes financeiras descentralizadas sem intermediarios", "Revolucionou o sistema financeiro global."),
    ("Tecnologia", "o Bitcoin", "Quem criou"): ("Foi criado por Satoshi Nakamoto, identidade ate hoje desconhecida", "Criado por Satoshi Nakamoto em 2009."),
    ("Tecnologia", "o Bitcoin", "Quando foi criado"): ("Foi criado em 2009 apos a crise financeira de 2008", "Lancado em 2009."),
    ("Tecnologia", "o Bitcoin", "Qual o significado"): ("Significa uma moeda digital descentralizada baseada em blockchain", "Moeda digital descentralizada."),
    ("Tecnologia", "o Bitcoin", "O que caracteriza"): ("Caracteriza-se por ser descentralizada, segura e sem fronteiras", "Descentralizacao e seguranca criptografica."),
    ("Tecnologia", "o Bitcoin", "Qual a funcao"): ("Funciona como meio de troca digital descentralizado", "Meio de troca digital global."),
    ("Tecnologia", "o Bitcoin", "Onde encontrar"): ("Pode ser encontrado em exchanges de criptomoedas online", "Disponivel em corretoras digitais."),
    ("Tecnologia", "o Bitcoin", "Como usar"): ("Pode ser usado como investimento, pagamento ou transferencia", "Usado para investimentos e transacoes."),
    ("Tecnologia", "o Bitcoin", "O que saber sobre"): ("E uma criptomoeda descentralizada que revolucionou o sistema financeiro", "Revolucionou o mercado financeiro digital."),

    # ---- Inteligencia Artificial ----
    ("Tecnologia", "a inteligencia artificial", "Qual a origem de"): ("Surgiu como campo de pesquisa na decada de 1950", "Campo fundado em 1956 no Dartmouth College."),
    ("Tecnologia", "a inteligencia artificial", "Onde surgiu"): ("Surgiu nos Estados Unidos durante conferencia em Dartmouth", "Conferencia de Dartmouth em 1956."),
    ("Tecnologia", "a inteligencia artificial", "Por que"): ("Porque permite automatizar tarefas complexas e aprender com dados", "Revoluciona processos com aprendizado de maquina."),
    ("Tecnologia", "a inteligencia artificial", "Quem criou"): ("John McCarthy e outros pesquisadores na conferencia de Dartmouth", "McCarthy cunhou o termo em 1956."),
    ("Tecnologia", "a inteligencia artificial", "Quando foi criado"): ("O termo foi criado em 1956 por John McCarthy", "Criado oficialmente em 1956."),

    # ---- Internet ----
    ("Tecnologia", "a internet", "Qual a origem de"): ("Surgiu como projeto militar ARPANET nos anos 1960", "ARPANET nos anos 1960."),
    ("Tecnologia", "a internet", "Onde surgiu"): ("Surgiu nos Estados Unidos como projeto do Departamento de Defesa", "Projeto militar americano."),
    ("Tecnologia", "a internet", "Por que"): ("Porque conecta pessoas e dispositivos globalmente compartilhando informacao", "Revolucionou a comunicacao global."),
    ("Tecnologia", "a internet", "Quem criou"): ("Vint Cerf e Robert Kahn criaram o protocolo TCP/IP", "Cerf e Kahn criaram o TCP/IP."),
    ("Tecnologia", "a internet", "Quando foi criado"): ("Surgiu nos anos 1960 como ARPANET e tornou-se publica nos anos 1990", "Desenvolvida a partir de 1969."),
    ("Tecnologia", "a internet", "Como funciona"): ("Funciona atraves de protocolos TCP/IP que conectam redes globais", "Protocolos de comunicacao entre redes."),

    # ---- Smartphone ----
    ("Tecnologia", "o smartphone", "Qual a origem de"): ("Surgiu da evolucao dos telefones celulares com computacao embarcada", "Evolucao dos celulares com computacao."),
    ("Tecnologia", "o smartphone", "Por que"): ("Porque combina telefone, computador e camera em um unico dispositivo", "Convergencia de dispositivos moveis."),
    ("Tecnologia", "o smartphone", "Quem criou"): ("O primeiro foi o IBM Simon em 1992, mas o iPhone popularizou", "IBM Simon foi o pioneiro."),
    ("Tecnologia", "o smartphone", "Quando foi criado"): ("O primeiro smartphone IBM Simon foi lancado em 1992", "Lancado em 1992."),
    ("Tecnologia", "o smartphone", "Como funciona"): ("Funciona com sistema operacional movel e processador compacto", "Sistema operacional e processador integrados."),

    # ---- Criptografia ----
    ("Tecnologia", "a criptografia", "Qual a origem de"): ("Surgiu na antiguidade com cifras simples como a de Cesar", "Usada desde o Imperio Romano."),
    ("Tecnologia", "a criptografia", "Por que"): ("Porque protege dados e comunicacoes contra acessos nao autorizados", "Protecao de dados e privacidade."),
    ("Tecnologia", "a criptografia", "Como funciona"): ("Funciona transformando dados legiveis em formato codificado", "Codificacao de dados com algoritmos."),

    # ---- Ciencia: Fotossintese ----
    ("Ciencia", "a fotossintese", "Qual a origem de"): ("Processao natural que existe desde o surgimento das primeiras plantas", "Processo natural das plantas."),
    ("Ciencia", "a fotossintese", "Por que"): ("Porque e essencial para produzir oxigenio e base da cadeia alimentar", "Fundamental para a vida na Terra."),
    ("Ciencia", "a fotossintese", "Como funciona"): ("Plantas usam clorofila para converter luz em energia quimica", "Conversao de luz em energia."),

    # ---- Ciencia: DNA ----
    ("Ciencia", "o DNA", "Qual a origem de"): ("Foi descoberto em 1953 por Watson e Crick", "Descoberto em 1953."),
    ("Ciencia", "o DNA", "Por que"): ("Porque contem toda a informacao genetica dos seres vivos", "Armazena informacao genetica."),
    ("Ciencia", "o DNA", "Quem criou"): ("Nao foi criado, mas descoberto por Watson, Crick e Franklin", "Descoberto por Watson e Crick."),
    ("Ciencia", "o DNA", "Quando foi criado"): ("Nao foi criado, mas sua estrutura foi descoberta em 1953", "Estrutura descoberta em 1953."),
    ("Ciencia", "o DNA", "Qual a funcao"): ("Armazenar e transmitir a informacao genetica entre geracoes", "Transmissao genetica entre geracoes."),
    ("Ciencia", "o DNA", "Onde encontrar"): ("Encontrado no nucleo das celulas de todos os seres vivos", "Presente no nucleo celular."),

    # ---- Historia: Revolucao Industrial ----
    ("Historia", "a Revolucao Industrial", "Por que"): ("Porque transformou a producao com maquinas e mudou a sociedade", "Transformacao da producao global."),
    ("Historia", "a Revolucao Industrial", "Onde surgiu"): ("Surgiu na Inglaterra no seculo XVIII", "Inglaterra seculo XVIII."),
    ("Historia", "a Revolucao Industrial", "Quando foi criado"): ("Iniciou na decada de 1760 na Inglaterra", "Decada de 1760."),
    ("Historia", "a Revolucao Industrial", "O que caracteriza"): ("Caracteriza-se pela mecanizacao da producao e avanco tecnologico", "Mecanizacao e avanco tecnologico."),

    # ---- Historia: Independencia do Brasil ----
    ("Historia", "a Independencia do Brasil", "Por que"): ("Porque o Brasil deixou de ser colonia de Portugal", "Fim da colonia portuguesa."),
    ("Historia", "a Independencia do Brasil", "Onde surgiu"): ("Foi proclamada as margens do Rio Ipiranga em Sao Paulo", "Rio Ipiranga, Sao Paulo."),
    ("Historia", "a Independencia do Brasil", "Quando foi criado"): ("Foi proclamada em 7 de setembro de 1822", "7 de setembro de 1822."),
    ("Historia", "a Independencia do Brasil", "Quem criou"): ("Foi proclamada por Dom Pedro I, entao principe regente", "Dom Pedro I."),
    ("Historia", "a Independencia do Brasil", "O que caracteriza"): ("Caracteriza-se pela ruptura politica com Portugal", "Ruptura com Portugal."),

    # ---- Esportes: Futebol ----
    ("Esportes", "o futebol", "Qual a origem de"): ("Originou-se na Inglaterra no seculo XIX", "Inglaterra seculo XIX."),
    ("Esportes", "o futebol", "Por que"): ("Porque e o esporte mais popular e praticado do mundo", "Esporte mais popular do mundo."),
    ("Esportes", "o futebol", "Onde surgiu"): ("Surgiu na Inglaterra com regras modernas em 1863", "Inglaterra em 1863."),
    ("Esportes", "o futebol", "Quando foi criado"): ("Regras modernas foram criadas em 1863 na Inglaterra", "1863 na Inglaterra."),
    ("Esportes", "o futebol", "Como funciona"): ("Onze jogadores por time tentam marcar gols no adversario", "Onze contra onze em campo."),

    # ---- Esportes: Formula 1 ----
    ("Esportes", "a Formula 1", "Qual a origem de"): ("Iniciou como campeonato mundial em 1950", "Campeonato iniciado em 1950."),
    ("Esportes", "a Formula 1", "Por que"): ("Porque e a categoria mais alta do automobilismo mundial", "Maxima categoria do automobilismo."),
    ("Esportes", "a Formula 1", "Onde surgiu"): ("Surgiu na Europa e rapidamente tornou-se global", "Europa, tornou-se global."),
    ("Esportes", "a Formula 1", "Como funciona"): ("Corridas com carros ultra-rapidos em circuitos mundiais", "Corridas em circuitos globais."),

    # ---- Animais: Baleia-azul ----
    ("Animais", "a baleia-azul", "Onde encontrar"): ("Encontrada em todos os oceanos do mundo", "Presente em todos os oceanos."),
    ("Animais", "a baleia-azul", "Qual a origem de"): ("Existe ha milhoes de anos como mamifero marinho evoluiado", "Mamifero marinho milenar."),
    ("Animais", "a baleia-azul", "Por que"): ("Porque e o maior animal ja existente no planeta", "Maior animal do planeta."),

    # ---- Geografia: Amazonas ----
    ("Geografia", "o Rio Amazonas", "Onde encontrar"): ("Atravessa a America do Sul, principalmente o Brasil", "America do Sul, principalmente Brasil."),
    ("Geografia", "o Rio Amazonas", "Qual a origem de"): ("Nasce na Cordilheira dos Andes no Peru", "Andes peruanos."),
    ("Geografia", "o Rio Amazonas", "Por que"): ("Porque e o rio mais volumoso do mundo", "Maior volume de agua do mundo."),
    ("Geografia", "o Rio Amazonas", "Qual a funcao"): ("Essencial para o equilibrio climatico e ecossistema global", "Equilibrio climatico global."),

    # ---- Additional common combos to reduce generic fallbacks ----
    # Tecnologia
    ("Tecnologia", "o Wi-Fi", "Como funciona"): ("Usa ondas de radio para transmitir dados sem fio", "Transmissao por ondas de radio."),
    ("Tecnologia", "o Bluetooth", "Como funciona"): ("Conecta dispositivos via ondas de radio de curto alcance", "Conexao sem fio de curto alcance."),
    ("Tecnologia", "o 5G", "Como funciona"): ("Usa frequencias mais altas para maior velocidade e baixa latencia", "Maior velocidade e baixa latencia."),
    ("Tecnologia", "a robotica", "Como funciona"): ("Combina mecanica, eletronica e programacao para criar maquinas autonomas", "Integracao de mecanica e programacao."),
    ("Tecnologia", "a realidade virtual", "Como funciona"): ("Usa headsets com telas estereoscopicas para criar imersao", "Headsets com imersao visual."),
    ("Tecnologia", "a criptografia", "Qual a funcao"): ("Garantir seguranca e privacidade nas comunicacoes digitais", "Seguranca nas comunicacoes."),
    ("Tecnologia", "a internet", "Qual a funcao"): ("Conectar dispositivos globalmente para compartilhar informacao", "Conexao global de informacao."),
    ("Tecnologia", "o smartphone", "Qual a funcao"): ("Integrar comunicacao, computacao e entretenimento em um dispositivo movel", "Dispositivo movel multifuncional."),
    
    # Ciencia
    ("Ciencia", "a evolucao", "Como funciona"): ("Atraves de selecao natural e mutacoes geneticas ao longo de geracoes", "Selecao natural e mutacoes."),
    ("Ciencia", "a tabela periodica", "Qual a funcao"): ("Organizar e classificar os elementos quimicos por propriedades", "Classificar elementos quimicos."),
    ("Ciencia", "a energia nuclear", "Como funciona"): ("Libera energia atraves de fissao ou fusao do nucleo atomico", "Fissao ou fusao nuclear."),
    ("Ciencia", "a nanotecnologia", "Como funciona"): ("Manipula atomos e moleculas para criar materiais com novas propriedades", "Manipulacao em escala atomica."),
    ("Ciencia", "a astronomia", "Qual a funcao"): ("Estudar corpos celestes e compreender o universo", "Estudo do universo."),
    ("Ciencia", "a fotossintese", "Qual a funcao"): ("Produzir energia e oxigenio para sustentar a vida na Terra", "Producao de energia e oxigenio."),
    ("Ciencia", "o DNA", "Qual a origem de"): ("Existe desde o surgimento da vida, descoberto em 1953 por Watson e Crick", "Descoberto por Watson e Crick em 1953."),
    ("Ciencia", "o DNA", "Quando foi criado"): ("Sua estrutura foi descoberta em 1953, mas existe desde a origem da vida", "Estrutura descoberta em 1953."),

    # Historia
    ("Historia", "a Revolucao Industrial", "Qual a origem de"): ("Surgiu na Inglaterra no seculo XVIII com a mecanizacao", "Inglaterra seculo XVIII."),
    ("Historia", "a Revolucao Industrial", "O que caracteriza"): ("Caracteriza-se pela mecanizacao, urbanizacao e mudancas sociais", "Mecanizacao e mudancas sociais."),
    ("Historia", "a Segunda Guerra", "Por que"): ("Porque foi o maior conflito armado da historia com impacto global", "Maior conflito da historia."),
    ("Historia", "a Segunda Guerra", "Quando foi criado"): ("Ocorreu entre 1939 e 1945", "1939 a 1945."),
    ("Historia", "a Guerra Fria", "O que caracteriza"): ("Caracteriza-se pela tensao ideologica e corrida armamentista", "Tensao e corrida armamentista."),
    ("Historia", "a Grecia Antiga", "O que caracteriza"): ("Caracteriza-se por ser berco da democracia e da filosofia", "Berco da democracia e filosofia."),
    ("Historia", "o Imperio Romano", "O que caracteriza"): ("Caracteriza-se pela extensao territorial e direito romano", "Extensao e direito romano."),
    ("Historia", "a Idade Media", "O que caracteriza"): ("Caracteriza-se pelo sistema feudal e influencia da Igreja", "Feudalismo e influencia religiosa."),
}




def extract_topic_and_type(question_text):
    """Given a question text, extract the topic and question type prefix."""
    for qt, qtype_key in QTYPE_MAP.items():
        parts = qt.split("{t}")
        pattern = re.escape(parts[0]) + "(.+)" + re.escape(parts[1]) + "$"
        m = re.match(pattern, question_text)
        if m:
            topic = m.group(1).strip()
            return topic, qtype_key
    return None, None


def is_auto_generated(q):
    """Check if this question has generic/unrelated alternatives
    OR was auto-generated (detected by generic explanation pattern)."""
    alts = q.get("alternatives", [])
    if any(a in BAD_ALT_VALUES for a in alts):
        return True
    # Also detect by explanation pattern (auto-generated explanations are generic)
    if "topico interessante na categoria" in q.get("explanation", ""):
        return True
    return False


def get_category_alts(category):
    """Fallback: generate category-appropriate generic alternatives."""
    fallbacks = {
        "Tecnologia": ["Inovacao tecnologica moderna", "Metodo analogico tradicional", "Ferramenta manual ultrapassada", "Processo artesanal antigo"],
        "Ciencia": ["Fenomeno natural comprovado", "Teoria ultrapassada sem base", "Crenca popular sem evidencias", "Mito antigo sem fundamento"],
        "Historia": ["Acontecimento historico importante", "Evento ficticio sem registro", "Lenda popular mitologica", "Fato historico menor"],
        "Geografia": ["Acidente geografico natural", "Construcao artificial humana", "Fenomeno climatico local", "Formacao rochosa antiga"],
        "Cinema": ["Producao cinematografica marcante", "Obra teatral classica", "Programa televisivo antigo", "Documentario educacional"],
        "Conhecimentos Gerais": ["Conceito fundamental importante", "Detalhe irrelevante qualquer", "Informacao incorreta comum", "Dado superficial desconexo"],
        "Animais": ["Especie animal fascinante", "Planta ornamental comum", "Rocha mineral qualquer", "Objeto inanimado qualquer"],
        "Curiosidades": ["Fato curioso interessante", "Crenca popular equivocada", "Informacao historica incorreta", "Dado cientifico desatualizado"],
        "Esportes": ["Modalidade esportiva popular", "Pratica fisica sedentaria", "Atividade recreativa menor", "Esporte radical desconhecido"],
        "Misterios": ["Misterio intrigante nao resolvido", "Fato comum ja explicado", "Lenda falsa inventada", "Teoria da conspiracao infundada"],
        "Games": ["Jogo eletronico popular", "Console antigo ultrapassado", "Genero de jogo desconhecido", "Acessorio de jogo obsoleto"],
    }
    return fallbacks.get(category, ["Conceito relevante", "Ideia equivocada", "Fato incorreto", "Informacao errada"])


def fix_auto_question(q):
    """Replace generic alternatives with topic-appropriate ones."""
    question = q["question"]
    category = q["category"]
    topic, qtype = extract_topic_and_type(question)
    
    if topic:
        topic = topic.strip()
    
    # Try to find a match in TOPIC_DEFS (by category + topic)
    def_key = (category, topic)
    answer_key = (category, topic, qtype) if qtype else None
    
    # Check if we have a question-type-specific answer
    if answer_key and answer_key in QUESTION_ANSWERS:
        correct_answer, explanation_extra = QUESTION_ANSWERS[answer_key]
        # Wrong answers - use topic-relevant wrong answers from TOPIC_DEFS or generate
        if def_key in TOPIC_DEFS:
            _, w1, w2, w3 = TOPIC_DEFS[def_key]
        else:
            gen = get_category_alts(category)
            w1, w2, w3 = gen[1], gen[2], gen[3]
        
        q["alternatives"] = [correct_answer, w1, w2, w3]
        q["correct"] = 0
        if "explicacao generica" not in q.get("explanation", "").lower():
            q["explanation"] = explanation_extra
        return True
    
    # Fall back to TOPIC_DEFS
    if def_key in TOPIC_DEFS:
        correct, w1, w2, w3 = TOPIC_DEFS[def_key]
        q["alternatives"] = [correct, w1, w2, w3]
        q["correct"] = 0
        return True
    
    # For generic type questions without specific mapping, use category fallback
    # but still make them relevant to the topic
    gen = get_category_alts(category)
    q["alternatives"] = gen
    q["correct"] = 0
    return True


def main():
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    print(f"Total questions loaded: {len(data)}")
    
    fixed = 0
    auto_count = 0
    not_fixed = []
    
    for i, q in enumerate(data):
        if is_auto_generated(q):
            auto_count += 1
            if fix_auto_question(q):
                fixed += 1
            else:
                not_fixed.append(i)
    
    # Second pass: also search by explanation pattern (another indicator of auto-gen)
    for i, q in enumerate(data):
        if "topico interessante na categoria" in q.get("explanation", ""):
            if not is_auto_generated(q):
                # This was auto-generated but alternatives were somehow already replaced
                pass
            else:
                # Already counted in the loop above
                pass
    
    print(f"Auto-generated questions detected: {auto_count}")
    print(f"Questions fixed: {fixed}")
    print(f"Not fixed: {len(not_fixed)}")
    
    if not_fixed:
        print(f"Indices of unfixed: {not_fixed[:20]}...")
    
    # Verify no question still has bad alternatives
    remaining = 0
    for q in data:
        if any(a in BAD_ALT_VALUES for a in q.get("alternatives", [])):
            remaining += 1
    
    print(f"Questions still with bad alternatives: {remaining}")
    if remaining > 0:
        print("WARNING: Some questions still have bad alternatives!")
    
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\nSaved to {JSON_PATH}")
    return auto_count, fixed


if __name__ == "__main__":
    main()
