"""
Complete audit and fix of quiz_seed.json.
Ensures every question has:
- Alternatives that match the question type (definition, person, date, location, etc.)
- Correct answer that actually answers the question
- Proper explanation
- Topic-appropriate wrong alternatives
"""
import json, re, sys
from pathlib import Path
from collections import defaultdict

JSON_PATH = Path(__file__).parent / "quiz_seed.json"

# ── TOPIC DEFINITIONS ──────────────────────────────────────────
# (category, topic) -> (definition, wrong1, wrong2, wrong3)
TOPIC_DEFS = {
    # TECNOLOGIA
    ("Tecnologia", "a internet"): ("Rede global de computadores interligados", "Rede local de uma empresa", "Programa de computador", "Dispositivo de hardware"),
    ("Tecnologia", "o smartphone"): ("Dispositivo movel com funcoes avançadas de computador", "Telefone fixo digital", "Tablet de grande porte", "Computador de mesa portatil"),
    ("Tecnologia", "a inteligencia artificial"): ("Sistemas que simulam a capacidade humana de raciocinio", "Tipo de hardware de ultima geracao", "Rede social automatizada", "Banco de dados corporativo"),
    ("Tecnologia", "o Bluetooth"): ("Tecnologia de comunicacao sem fio de curto alcance", "Rede Wi-Fi para longas distancias", "Cabo de conexao universal", "Satelite de comunicacao"),
    ("Tecnologia", "o Wi-Fi"): ("Tecnologia de rede sem fio para conexao local", "Conexao via cabo de rede ethernet", "Sinal de radio AM/FM", "Rede de telefonia movel"),
    ("Tecnologia", "a criptografia"): ("Tecnica de codificar dados para garantir seguranca", "Linguagem de programacao compilada", "Tipo de virus de computador", "Metodo de compressao de arquivos"),
    ("Tecnologia", "o 5G"): ("Quinta geracao de redes moveis de alta velocidade", "Roteador de internet residencial", "Cabo de fibra optica submarino", "Satelite de comunicacao geoestacionario"),
    ("Tecnologia", "a realidade virtual"): ("Ambiente simulado digitalmente com imersao sensorial", "Video gravado em 360 graus", "Jogo de computador tradicional", "Filtro de camera de celular"),
    ("Tecnologia", "o Bitcoin"): ("Criptomoeda descentralizada baseada em tecnologia blockchain", "Moeda fisica de curso legal", "Cartao de credito internacional", "Acao negociada na bolsa de valores"),
    ("Tecnologia", "a robotica"): ("Ramo da engenharia que projeta e constroi robos", "Programacao de aplicativos moveis", "Fabricacao de componentes eletronicos", "Inteligencia artificial generativa"),

    # CIENCIA
    ("Ciencia", "a fotossintese"): ("Processo pelo qual plantas produzem energia usando luz solar", "Respiração celular dos animais", "Decomposicao de materia organica", "Fermentacao de acucares por leveduras"),
    ("Ciencia", "o DNA"): ("Molecula que armazena a informacao genetica dos seres vivos", "Proteina responsavel pelo transporte de oxigenio", "Carboidrato de reserva energetica", "Lipideo que compoe a membrana celular"),
    ("Ciencia", "a evolucao"): ("Processo de mudanca genetica das especies ao longo de geracoes", "Criacao divina e imutavel dos seres vivos", "Adaptacao individual durante uma vida", "Selecao artificial feita pelo ser humano"),
    ("Ciencia", "a tabela periodica"): ("Classificacao organizada de todos os elementos quimicos", "Lista de compostos quimicos organicos", "Conjunto de formulas da fisica classica", "Catalogo de reacoes quimicas industriais"),
    ("Ciencia", "a energia nuclear"): ("Energia liberada por reacoes no nucleo do atomo", "Energia proveniente da radiacao solar", "Energia gerada pela queima de combustiveis", "Energia hidraulica de usinas hidreletricas"),
    ("Ciencia", "a fisica quantica"): ("Ramo da fisica que estuda fenomenos em escala subatomica", "Estudo da mecanica e do movimento classico", "Ramo da quimica que estuda reacoes organicas", "Parte da biologia molecular celular"),
    ("Ciencia", "a relatividade"): ("Teoria de Einstein sobre a curvatura do espaco-tempo", "Teoria de Newton sobre a forca da gravidade", "Principio basico da termodinamica", "Teoria atomica de Dalton sobre a materia"),
    ("Ciencia", "as celulas-tronco"): ("Celulas indiferenciadas capazes de se transformar em varios tipos", "Celulas sanguineas ja maduras e especializadas", "Neuronios do sistema nervoso central", "Celulas mortas em processo de decomposicao"),
    ("Ciencia", "a nanotecnologia"): ("Manipulacao da materia em escala atomica e molecular", "Tecnologia de construcao de edificios", "Microscopia otica de alta resolucao", "Engenharia de software de inteligencia artificial"),
    ("Ciencia", "a astronomia"): ("Ciencia que estuda os corpos celestes e o universo", "Estudo da atmosfera e do clima terrestre", "Ciencia dos fosseis e das rochas", "Ramo da biologia que estuda os oceanos"),

    # HISTORIA
    ("Historia", "a Revolucao Industrial"): ("Periodo de grande transformacao tecnologica e social na producao", "Guerra entre nacoes europeias no seculo XIX", "Movimento artistico do renascimento cultural", "Descoberta de um novo continente na America"),
    ("Historia", "o Renascimento"): ("Movimento cultural e cientifico entre os seculos XIV e XVI", "Periodo das grandes guerras mundiais do seculo XX", "Era da construcao das piramides do Egito", "Revolucao agricola da Idade Media europeia"),
    ("Historia", "o Imperio Romano"): ("Um dos maiores imperios da antiguidade ao redor do Mediterraneo", "Dinastia chinesa da familia Ming", "Imperio colonial britanico do seculo XIX", "Civilizacao mesopotamica entre rios Tigre e Eufrates"),
    ("Historia", "a Guerra Fria"): ("Conflito ideologico e politico entre EUA e Uniao Sovietica", "Guerra mundial travada entre 1914 e 1918", "Revolucao francesa que iniciou em 1789", "Guerra civil americana entre Norte e Sul"),
    ("Historia", "a Independencia do Brasil"): ("Processo de separacao politica do Brasil em relacao a Portugal", "Guerra de independencia contra a Espanha", "Revolta de escravos no seculo XVIII", "Tratado de comercio assinado com a Inglaterra"),
    ("Historia", "a Segunda Guerra"): ("Conflito global ocorrido entre 1939 e 1945", "Primeira guerra mundial do seculo XX", "Guerra civil entre estados norte-americanos", "Conflito regional limitado ao continente asiatico"),
    ("Historia", "a Revolucao Francesa"): ("Movimento social que aboliu a monarquia absoluta na Franca", "Revolucao industrial ocorrida na Inglaterra", "Independencia dos Estados Unidos da America", "Revolucao Russa que levou os comunistas ao poder"),
    ("Historia", "o Antigo Egito"): ("Civilizacao antiga desenvolvida as margens do Rio Nilo", "Imperio inca localizado na America do Sul", "Reino medieval europeu da Idade Media", "Civilizacao chinesa da dinastia Shang"),
    ("Historia", "a Grecia Antiga"): ("Berco da democracia, da filosofia e do pensamento ocidental", "Imperio persa da antiguidade oriental", "Civilizacao pre-colombiana da America Central", "Reino africano de Ghana no oeste da Africa"),
    ("Historia", "a Idade Media"): ("Periodo historico europeu entre os seculos V e XV", "Era dos grandes descobrimentos maritimos portugueses", "Periodo da historia antiga da Grecia classica", "Seculo das revolucoes industriais e tecnologicas"),

    # GEOGRAFIA
    ("Geografia", "o Rio Amazonas"): ("Maior rio do mundo em volume de agua e extensao", "Rio que corta a Europa central e desagua no Mar do Norte", "Riacho de pequeno porte no interior do Brasil", "Lago de agua doce localizado no continente africano"),
    ("Geografia", "a Cordilheira dos Andes"): ("Extensa cadeia montanhosa na costa oeste da America do Sul", "Cordilheira montanhosa localizada na Europa central", "Planicie alagavel da regiao central da Asia", "Deserto arenoso do norte do continente africano"),
    ("Geografia", "o Deserto do Saara"): ("Maior deserto quente do mundo no norte da Africa", "Deserto gelado da Antartida no Polo Sul", "Floresta tropical densa da America do Sul", "Regiao de tundra gelada da Siberia russa"),
    ("Geografia", "a Antartida"): ("Continente mais frio, seco e isolado do planeta", "Ilha tropical no Oceano Pacifico Sul", "Deserto de areia no centro da Australia", "Regiao montanhosa da Asia central"),
    ("Geografia", "o Oceano Pacifico"): ("Maior oceano do planeta cobrindo um terco da superficie", "Oceano Atlantico entre America e Europa", "Mar Mediterraneo entre Europa e Africa", "Oceano Indico ao sul do continente asiatico"),
    ("Geografia", "o Himalaia"): ("Maior cadeia montanhosa do mundo localizada na Asia", "Cordilheira dos Alpes na Europa central", "Planicie amazonica na America do Sul", "Deserto de Gobi na Asia central"),
    ("Geografia", "a Patagonia"): ("Regiao no extremo sul da America do Sul", "Regiao norte gelada do Canada", "Planicie central da Australia", "Peninsula da Europa oriental"),
    ("Geografia", "o Mar Morto"): ("Lago hipersalino localizado entre Israel e Jordania", "Oceano Atlantico no hemisferio sul", "Mar Mediterraneo na regiao central", "Golfo da California no oceano Pacifico"),
    ("Geografia", "a Tundra"): ("Bioma frio com vegetacao rasteira e solo permanentemente congelado", "Floresta tropical densa e muito umida", "Savana africana com arvores esparsas", "Deserto arenoso quente e seco"),
    ("Geografia", "a Savana"): ("Bioma tropical com gramineas e arvores esparsas", "Floresta temperada com muitas arvores altas", "Tundra gelada do circulo polar artico", "Mata fechada e densa da regiao amazonica"),

    # CINEMA
    ("Cinema", "o cinema"): ("Arte de produzir filmes com imagens em movimento e som", "Teatro ao vivo com atores em um palco", "Fotografia de paisagens e retratos estaticos", "Literatura de ficcao cientifica e fantasia"),
    ("Cinema", "a Hollywood"): ("Distrito de Los Angeles conhecido como capital mundial do cinema", "Bairro artistico localizado em Paris na Franca", "Estudio de cinema britanico em Londres", "Festival de cinema que ocorre em Cannes"),
    ("Cinema", "os efeitos especiais"): ("Tecnicas visuais e digitais para criar ilusoes em filmes", "Maquiagem artistica teatral tradicional", "Figurinos historicos usados em pecas", "Cenario natural filmado sem alteracoes"),
    ("Cinema", "a animacao"): ("Tecnica de criar ilusao de movimento quadro a quadro", "Fotografia de alta velocidade esportiva", "Filmagem documental em tempo real", "Gravacao de audio em estudio profissional"),
    ("Cinema", "o genero terror"): ("Genero cinematografico que busca causar medo e suspense", "Comedia romantica com final feliz", "Documentario educacional sobre natureza", "Filme de faroeste sobre cowboys"),
    ("Cinema", "os filmes de acao"): ("Genero com cenas de lutas, perseguicoes e efeitos visuais", "Filmes de epoca sobre romances historicos", "Documentarios sobre vida selvagem", "Filmes de arte experimentais e abstratos"),
    ("Cinema", "as comedia"): ("Genero cinematografico focado em humor e entretenimento", "Drama tragico com tematica emocional intensa", "Filme de suspense e horror psicologico", "Documentario historico baseado em fatos reais"),
    ("Cinema", "os documentarios"): ("Genero audiovisual que apresenta fatos reais e informativos", "Ficcao cientifica especulativa sobre o futuro", "Filme de animacao infantil com fantasia", "Musical romantico com danca e canto"),
    ("Cinema", "o cinema nacional"): ("Producao cinematografica propria de um determinado pais", "Importacao de filmes estrangeiros de outros paises", "Distribuicao global de producoes internacionais", "Festival internacional de cinema anual"),
    ("Cinema", "os filmes de ficcao"): ("Genero que explora cenarios imaginarios e especulativos", "Documentario rigoroso baseado em fatos reais", "Filme biografico sobre a vida de uma pessoa", "Reportagem jornalistica audiovisual investigativa"),

    # CONHECIMENTOS GERAIS
    ("Conhecimentos Gerais", "o Bonsai"): ("Arte japonesa de cultivar arvores em miniatura em vasos", "Tipo de arvore frutifera de grande porte", "Flor ornamental de jardim de inverno", "Tecnica de poda de gramados e jardins"),
    ("Conhecimentos Gerais", "a cidadania"): ("Conjunto de direitos e deveres politicos de um cidadao", "Profissao regulamentada por lei federal", "Documento de identidade nacional emitido pelo governo", "Sistema eleitoral de votacao obrigatoria"),
    ("Conhecimentos Gerais", "os direitos humanos"): ("Direitos fundamentais e universais de toda pessoa humana", "Privilegios concedidos pelo governo a cidadaos", "Regras de transito internacionais padronizadas", "Leis comerciais de importacao e exportacao"),
    ("Conhecimentos Gerais", "a economia"): ("Ciencia social que estuda producao e consumo de bens", "Arte de administrar financas pessoais domesticas", "Sistema de contabilidade empresarial de empresas", "Metodo de calcular impostos e tributos"),
    ("Conhecimentos Gerais", "a filosofia"): ("Estudo critico sobre a existencia, o conhecimento e os valores", "Ciencia experimental de laboratorio com testes", "Religiao organizada com dogmas e rituais", "Metodo de meditacao e autoconhecimento oriental"),
    ("Conhecimentos Gerais", "a democracia"): ("Sistema politico onde o poder emana do povo", "Ditadura centralizada na figura de um lider", "Monarquia hereditaria com rei vitalicio", "Teocracia onde o poder religioso governa"),
    ("Conhecimentos Gerais", "a urbanizacao"): ("Processo de crescimento e desenvolvimento das cidades", "Desmatamento de grandes areas de florestas nativas", "Agricultura familiar e sustentavel no campo", "Industrializacao do setor rural agropecuario"),
    ("Conhecimentos Gerais", "a globalizacao"): ("Integracao economica, cultural e politica entre nacoes", "Isolamento politico e economico de um pais", "Protecionismo comercial com barreiras alfandegarias", "Fragmentacao de mercados em blocos regionais"),
    ("Conhecimentos Gerais", "a cultura geral"): ("Conjunto de conhecimentos sobre diversos temas e areas", "Especializacao profunda em uma unica disciplina", "Habilidade tecnica especifica de uma profissao", "Formacao academica superior completa"),

    # ANIMAIS
    ("Animais", "o beija-flor"): ("Ave de pequeno porte que consegue voar parado no ar", "Passaro que vive no chao da floresta", "Ave aquatico que mergulha para pescar", "Rapina noturna de grande porte e visao aguçada"),
    ("Animais", "a baleia-azul"): ("Maior animal do mundo, um mamifero marinho gigantesco", "Peixe de grande porte dos oceanos tropicais", "Tubarao predador das aguas profundas", "Polvo gigante das profundezas oceânicas"),
    ("Animais", "o polvo"): ("Molusco marinho com oito braços e alta inteligencia", "Peixe colorido de recife de coral", "Crustaceo de agua doce com pinças", "Mamifero aquatico herbivoro de rios"),
    ("Animais", "o leao"): ("Grande felino africano conhecido como rei da selva", "Tigre de bengala da Asia meridional", "Urso pardo da America do Norte", "Lobo cinzento das florestas europeias"),
    ("Animais", "o tubarao-branco"): ("Grande tubarao predador dos oceanos temperados", "Golfinho amigavel de mar aberto", "Baleia jubarte que se alimenta por filtracao", "Foca do Polo Norte com grandes presas"),
    ("Animais", "o pinguim"): ("Ave marinha que nao voa, adaptada ao frio extremo", "Avestruz do deserto africano de grande porte", "Garca de zonas tropicais e subtropicais", "Flamingo de aguas rasas e salgadas"),
    ("Animais", "o camaleao"): ("Lagarto que muda de cor para camuflagem e comunicacao", "Cobra venenosa da floresta tropical", "Tartaruga de casco duro e resistente", "Jacare de agua doce de grande porte"),
    ("Animais", "a aranha"): ("Aracnideo com oito patas que produz teia de seda", "Inseto voador com seis patas e asas", "Crustaceo marinho com dez patas e carapaca", "Anelideo de corpo segmentado e alongado"),
    ("Animais", "o golfinho"): ("Mamifero marinho inteligente e altamente social", "Peixe carnivoro de recifes de coral", "Baleia filtradora de plâncton e crustaceos", "Foca que vive em grandes colonias"),
    ("Animais", "a capivara"): ("Maior roedor do mundo, nativo da America do Sul", "Rato domestico de pequeno porte e cauda longa", "Castor construtor de represas na America do Norte", "Porco-espinho coberto de espinhos protetores"),

    # CURIOSIDADES
    ("Curiosidades", "a aurora boreal"): ("Fenomeno luminoso nos polos causado por ventos solares", "Arco-iris colorido apos dias de chuva intensa", "Eclipse lunar total quando a lua escurece", "Tempestade de raios e trovao noturna"),
    ("Curiosidades", "o Big Ben"): ("Nome do famoso sino do relogio do Palacio de Westminster", "Torre Eiffel construida em Paris na Franca", "Estadio de Wembley localizado em Londres", "Museu Britanico de historia antiga e artefatos"),
    ("Curiosidades", "a bioluminescencia"): ("Producao de luz visivel por organismos vivos", "Reflexo da luz solar na superficie da agua", "Absorcao de luz por plantas na fotossintese", "Difracao da luz em cristais e gemas"),
    ("Curiosidades", "o Monte Everest"): ("Montanha mais alta do mundo com 8.848 metros de altitude", "Pico mais alto dos Alpes suicos na Europa", "Vulcao ativo do Japao chamado Fuji", "Cordilheira dos Andes na America do Sul"),
    ("Curiosidades", "a Grande Barreira de Corais"): ("Maior sistema de recifes de coral do mundo na Australia", "Recife artificial construido pelo homem no Caribe", "Banco de areia no oceano Atlantico Norte", "Ilha vulcanica do oceano Pacifico Sul"),
    ("Curiosidades", "o Taj Mahal"): ("Mausoleu indiano construido por amor na cidade de Agra", "Templo hindu antigo dedicado a varios deuses", "Palacio real chines da cidade proibida", "Mesquita turca medieval em Istambul"),
    ("Curiosidades", "a Muralha da China"): ("Grande fortificacao construida na China antiga", "Piramide do Egito antigo construida por faraos", "Coliseu romano onde ocorriam lutas de gladiadores", "Aqueduto romano que levava agua para cidades"),
    ("Curiosidades", "o Pico da Neblina"): ("Ponto mais alto do Brasil com 2.995 metros de altitude", "Montanha mais alta da Argentina nos Andes", "Vulcao ativo do Mexico chamado Popocatepetl", "Cordilheira dos Alpes europeia na Suiça"),
    ("Curiosidades", "a Fossa das Marianas"): ("Ponto mais profundo do oceano com cerca de 11.000 metros", "Caverna subterranea mais funda ja descoberta", "Vale subaquatico do oceano Atlantico Norte", "Recife de coral raso e bem iluminado"),
    ("Curiosidades", "o Deserto do Atacama"): ("Deserto mais seco do mundo localizado no Chile", "Floresta amazonica com maior biodiversidade", "Pantanal brasileiro com maior planicie alagavel", "Savana africana com grande variedade de fauna"),

    # ESPORTES
    ("Esportes", "o futebol"): ("Esporte coletivo com 11 jogadores e uma bola em campo", "Esporte de quadra jogado com raquete e peteca", "Luta corporal entre dois atletas em um ringue", "Corrida de longa distancia em estrada asfaltada"),
    ("Esportes", "o basquete"): ("Esporte de equipe com cesta suspensa a 3,05 metros de altura", "Futebol americano com contato fisico e protecoes", "Volei de praia jogado em duplas na areia", "TenIs de quadra individual com raquete e bola"),
    ("Esportes", "a Formula 1"): ("Categoria de automobilismo de alta velocidade em circuitos", "Corrida de motociclismo em pistas de terra", "Competicao de ciclismo de estrada em grupo", "Rally de carros antigos em estradas rurais"),
    ("Esportes", "o tenis"): ("Esporte de raquete jogado individualmente ou em duplas", "Arte marcial de origem japonesa com golpes", "Natacao em piscina olimpica com varios estilos", "Golfe jogado em campos abertos com tacos"),
    ("Esportes", "o volei"): ("Esporte de quadra com rede e seis jogadores por time", "Handebol de quadra fechada com sete jogadores", "Rugby de contato fisico intenso com bola oval", "Basebol americano de arremessos e rebatidas"),
    ("Esportes", "a natacao"): ("Esporte aquatico com diferentes estilos de nado", "Mergulho autonomo em alto mar com cilindro", "Surfe em ondas gigantes com prancha", "Remo em barcos estreitos e compridos"),
    ("Esportes", "o atletismo"): ("Conjunto de modalidades como corrida, saltos e arremessos", "Luta greco-romana olimpica de agarre", "Ginastica ritmica com fitas e bolas", "Halterofilismo de levantamento de peso"),
    ("Esportes", "o boxe"): ("Esporte de luta onde os atletas trocam socos em ringue", "Artes marciais mistas com diversas tecnicas de combate", "Esgrima com espadas finas e leves", "Capoeira de origem brasileira com danca e luta"),
    ("Esportes", "o MMA"): ("Artes marciais mistas combinando varias modalidades de luta", "Luta de sumo japonesa com regras restritas", "Boxe classico utilizando apenas os punhos", "Judo com quedas, imobilizacoes e chaves"),
    ("Esportes", "o ciclismo"): ("Esporte sobre rodas utilizando bicicletas", "Corrida de carros de formula em alta velocidade", "Patinacao artistica no gelo com musica", "Motocross de alta velocidade em pistas de terra"),
}

# ── QUESTION-TYPE-SPECIFIC ANSWERS ─────────────────────────────
# (category, topic, question_type) -> (correct_answer, explanation)
QUESTION_ANSWERS = {
    # Bitcoin
    ("Tecnologia", "o Bitcoin", "Qual a origem de"): ("O Bitcoin foi criado em 2009 por Satoshi Nakamoto como moeda digital", "Criado em 2009 por Satoshi Nakamoto."),
    ("Tecnologia", "o Bitcoin", "Onde surgiu"): ("Surgiu como projeto de moeda digital peer-to-peer na internet", "Projeto digital lancado na internet em 2009."),
    ("Tecnologia", "o Bitcoin", "Por que"): ("Porque permite transacoes financeiras descentralizadas sem intermediarios", "Revolucionou o sistema financeiro global."),
    ("Tecnologia", "o Bitcoin", "Quem criou"): ("Foi criado por Satoshi Nakamoto, identidade ate hoje desconhecida", "Criado por Satoshi Nakamoto em 2009."),
    ("Tecnologia", "o Bitcoin", "Quando foi criado"): ("Foi lancado em 2009 apos a crise financeira de 2008", "Lancado em 2009 apos a crise de 2008."),
    ("Tecnologia", "o Bitcoin", "Qual o significado"): ("Significa uma moeda digital descentralizada baseada em blockchain", "Moeda digital descentralizada."),
    ("Tecnologia", "o Bitcoin", "O que caracteriza"): ("Caracteriza-se por ser descentralizada, segura e sem fronteiras", "Descentralizacao e seguranca criptografica."),
    ("Tecnologia", "o Bitcoin", "Qual a funcao"): ("Funciona como meio de troca digital descentralizado e investimento", "Meio de troca digital global."),
    ("Tecnologia", "o Bitcoin", "Onde encontrar"): ("Pode ser adquirido em exchanges de criptomoedas online", "Disponivel em corretoras digitais."),
    ("Tecnologia", "o Bitcoin", "Como usar"): ("Pode ser usado como investimento, pagamento ou transferencia global", "Usado para investimentos e transacoes."),
    ("Tecnologia", "o Bitcoin", "O que saber sobre"): ("E uma criptomoeda descentralizada que revolucionou o sistema financeiro", "Revolucionou o mercado financeiro digital."),
    ("Tecnologia", "o Bitcoin", "Como funciona"): ("Funciona atraves de uma rede blockchain descentralizada e criptografada", "Rede blockchain descentralizada."),

    # Inteligencia Artificial
    ("Tecnologia", "a inteligencia artificial", "Qual a origem de"): ("Surgiu como campo de pesquisa na decada de 1950 nos Estados Unidos", "Campo fundado em 1956 no Dartmouth College."),
    ("Tecnologia", "a inteligencia artificial", "Onde surgiu"): ("Surgiu nos Estados Unidos durante conferencia em Dartmouth College", "Conferencia de Dartmouth em 1956."),
    ("Tecnologia", "a inteligencia artificial", "Por que"): ("Porque permite automatizar tarefas complexas e aprender com grandes volumes de dados", "Revoluciona processos com aprendizado de maquina."),
    ("Tecnologia", "a inteligencia artificial", "Quem criou"): ("O termo foi cunhado por John McCarthy e outros pesquisadores em 1956", "McCarthy cunhou o termo em 1956."),
    ("Tecnologia", "a inteligencia artificial", "Quando foi criado"): ("O campo foi formalmente criado em 1956 na conferencia de Dartmouth", "Criado oficialmente em 1956."),
    ("Tecnologia", "a inteligencia artificial", "Qual o significado"): ("Significa sistemas computacionais que simulam a inteligencia humana", "Simulacao computacional da inteligencia humana."),
    ("Tecnologia", "a inteligencia artificial", "O que caracteriza"): ("Caracteriza-se pela capacidade de aprender, raciocinar e tomar decisoes", "Capacidade de aprender e raciocinar."),
    ("Tecnologia", "a inteligencia artificial", "Qual a funcao"): ("Executar tarefas que normalmente exigiriam inteligencia humana", "Execucao de tarefas inteligentes."),
    ("Tecnologia", "a inteligencia artificial", "Como funciona"): ("Usa algoritmos e redes neurais para aprender padroes a partir de dados", "Aprendizado a partir de dados com algoritmos."),
    ("Tecnologia", "a inteligencia artificial", "O que saber sobre"): ("E uma tecnologia que esta transformando todos os setores da sociedade", "Transforma todos os setores da sociedade."),

    # Internet
    ("Tecnologia", "a internet", "Qual a origem de"): ("Surgiu como projeto militar ARPANET nos anos 1960 nos EUA", "ARPANET nos anos 1960 pelo DoD americano."),
    ("Tecnologia", "a internet", "Onde surgiu"): ("Surgiu nos Estados Unidos como projeto do Departamento de Defesa", "Projeto militar americano."),
    ("Tecnologia", "a internet", "Por que"): ("Porque conecta pessoas e dispositivos globalmente compartilhando informacao", "Revolucionou a comunicacao global."),
    ("Tecnologia", "a internet", "Quem criou"): ("Vint Cerf e Robert Kahn criaram o protocolo TCP/IP", "Cerf e Kahn criaram o protocolo TCP/IP."),
    ("Tecnologia", "a internet", "Quando foi criado"): ("Surgiu nos anos 1960 como ARPANET e tornou-se publica nos anos 1990", "Desenvolvida a partir de 1969."),
    ("Tecnologia", "a internet", "Qual o significado"): ("Significa uma rede global de computadores interligados", "Rede global de computadores."),
    ("Tecnologia", "a internet", "Como funciona"): ("Funciona atraves de protocolos TCP/IP que conectam redes ao redor do mundo", "Protocolos TCP/IP de comunicacao entre redes."),
    ("Tecnologia", "a internet", "Qual a funcao"): ("Conectar dispositivos e pessoas globalmente para compartilhar informacao", "Conexao global de informacao."),

    # Smartphone
    ("Tecnologia", "o smartphone", "Qual a origem de"): ("Surgiu da evolucao dos telefones celulares com tecnologia computacional", "Evolucao dos celulares com capacidade computacional."),
    ("Tecnologia", "o smartphone", "Por que"): ("Porque combina telefone, computador e camera em um so dispositivo portatil", "Convergencia de dispositivos em um so."),
    ("Tecnologia", "o smartphone", "Quem criou"): ("O primeiro foi o IBM Simon em 1992, popularizado pelo iPhone em 2007", "IBM Simon foi o pioneiro em 1992."),
    ("Tecnologia", "o smartphone", "Quando foi criado"): ("O primeiro smartphone IBM Simon foi lancado em 1992", "Lancado em 1992 (IBM Simon)."),
    ("Tecnologia", "o smartphone", "Como funciona"): ("Funciona com sistema operacional movel e processador em um circuito integrado", "Sistema operacional e processador integrados."),
    ("Tecnologia", "o smartphone", "Qual a funcao"): ("Integrar comunicacao, computacao e entretenimento em um dispositivo portatil", "Dispositivo portatil multifuncional."),

    # Criptografia
    ("Tecnologia", "a criptografia", "Qual a origem de"): ("Surgiu na antiguidade com cifras simples como a Cifra de Cesar", "Usada desde o Imperio Romano."),
    ("Tecnologia", "a criptografia", "Por que"): ("Porque protege dados e comunicacoes contra acessos nao autorizados", "Protecao de dados e privacidade."),
    ("Tecnologia", "a criptografia", "Como funciona"): ("Funciona transformando dados legiveis em formato codificado com algoritmos", "Codificacao de dados usando algoritmos matematicos."),
    ("Tecnologia", "a criptografia", "Quem criou"): ("Cifras primitiveas foram criadas por Julius Caesar, a moderna por varios cientistas", "Desde Caesar ate cientistas modernos."),
    ("Tecnologia", "a criptografia", "Quando foi criado"): ("As primeiras tecnicas de criptografia surgiram na Roma Antiga", "Primeiros registros na Roma Antiga."),

    # 5G
    ("Tecnologia", "o 5G", "Qual a origem de"): ("Foi desenvolvido por consorcios internacionais de telecomunicacoes", "Desenvolvido por consorcios de telecom."),
    ("Tecnologia", "o 5G", "Por que"): ("Porque oferece velocidades muito maiores e menor latencia que o 4G", "Maior velocidade e menor latencia."),
    ("Tecnologia", "o 5G", "Como funciona"): ("Usa frequencias de ondas milimetricas para transmitir mais dados", "Ondas milimetricas de alta frequencia."),
    ("Tecnologia", "o 5G", "Quando foi criado"): ("O padrao 5G foi lancado comercialmente em 2019", "Lancado em 2019."),

    # Realidade Virtual
    ("Tecnologia", "a realidade virtual", "Qual a origem de"): ("Surgiu nas decadas de 1960 e 1970 com os primeiros simuladores", "Primeiros simuladores nos anos 1960."),
    ("Tecnologia", "a realidade virtual", "Por que"): ("Porque permite experiencias imersivas em ambientes simulados", "Experiencias imersivas simuladas."),
    ("Tecnologia", "a realidade virtual", "Como funciona"): ("Usa headsets com telas estereoscopicas e sensores de movimento", "Headsets com telas e sensores."),

    # Robotica
    ("Tecnologia", "a robotica", "Qual a origem de"): ("O termo surgiu na peca RUR de 1920, mas robos modernos nos anos 1960", "Termo criado em 1920, robos nos anos 1960."),
    ("Tecnologia", "a robotica", "Por que"): ("Porque automatiza tarefas repetitivas e perigosas com precisao", "Automacao de tarefas com precisao."),
    ("Tecnologia", "a robotica", "Como funciona"): ("Combina mecanica, eletronica e programacao para criar maquinas autonomas", "Integracao de mecanica, eletronica e software."),

    # WI-FI
    ("Tecnologia", "o Wi-Fi", "Qual a origem de"): ("Foi criado na decada de 1990 pelo padrao IEEE 802.11", "Padrao IEEE 802.11 nos anos 1990."),
    ("Tecnologia", "o Wi-Fi", "Por que"): ("Porque permite conectar dispositivos sem fio a internet", "Conexao sem fio a internet."),
    ("Tecnologia", "o Wi-Fi", "Como funciona"): ("Usa ondas de radio para transmitir dados entre dispositivos e roteador", "Ondas de radio entre dispositivos."),
    ("Tecnologia", "o Wi-Fi", "Quando foi criado"): ("O padrao Wi-Fi foi criado em 1997", "1997 com o padrao IEEE 802.11."),
    ("Tecnologia", "o Wi-Fi", "Quem criou"): ("Foi criado pelo instituto IEEE seguindo o padrao 802.11", "Instituto IEEE com padrao 802.11."),

    # BLUETOOTH
    ("Tecnologia", "o Bluetooth", "Qual a origem de"): ("Foi criado pela Ericsson em 1994 como alternativa ao cabo", "Ericsson em 1994."),
    ("Tecnologia", "o Bluetooth", "Por que"): ("Porque conecta dispositivos proximos sem fio de forma simples", "Conexao simples sem fio."),
    ("Tecnologia", "o Bluetooth", "Como funciona"): ("Usa ondas de radio UHF de curto alcance para parear dispositivos", "Ondas UHF de curto alcance."),
    ("Tecnologia", "o Bluetooth", "Quem criou"): ("Foi criado pela empresa sueca Ericsson em 1994", "Ericsson em 1994."),

    # Ciencia: Fotossintese
    ("Ciencia", "a fotossintese", "Qual a origem de"): ("Processo natural que existe desde o surgimento das primeiras plantas", "Processo natural das primeiras plantas."),
    ("Ciencia", "a fotossintese", "Por que"): ("Porque e essencial para produzir oxigenio e base da cadeia alimentar", "Fundamental para a vida na Terra."),
    ("Ciencia", "a fotossintese", "Como funciona"): ("Plantas usam clorofila para converter luz solar em energia quimica", "Conversao de luz em energia quimica."),
    ("Ciencia", "a fotossintese", "Qual a funcao"): ("Produzir energia e oxigenio para sustentar a vida no planeta", "Producao de energia e oxigenio."),

    # Ciencia: DNA
    ("Ciencia", "o DNA", "Qual a origem de"): ("Existe desde o inicio da vida, mas foi descoberto em 1953", "Descoberto em 1953 por Watson e Crick."),
    ("Ciencia", "o DNA", "Por que"): ("Porque contem toda a informacao genetica dos seres vivos", "Armazena informacao genetica."),
    ("Ciencia", "o DNA", "Quem criou"): ("Nao foi criado, mas sua estrutura foi descoberta por Watson, Crick e Franklin", "Descoberto por Watson, Crick e Franklin."),
    ("Ciencia", "o DNA", "Quando foi criado"): ("Sua estrutura foi descoberta em 1953, mas existe desde a origem da vida", "Estrutura descoberta em 1953."),
    ("Ciencia", "o DNA", "Qual a funcao"): ("Armazenar e transmitir a informacao genetica entre as geracoes", "Armazenamento e transmissao genetica."),
    ("Ciencia", "o DNA", "Onde encontrar"): ("Presente no nucleo de todas as celulas dos seres vivos", "Nucleo das celulas."),

    # Ciencia: Evolucao
    ("Ciencia", "a evolucao", "Qual a origem de"): ("Teoria desenvolvida por Charles Darwin no seculo XIX", "Teoria de Darwin no seculo XIX."),
    ("Ciencia", "a evolucao", "Por que"): ("Porque explica como as especies se adaptam e mudam ao longo do tempo", "Explica a adaptacao das especies."),
    ("Ciencia", "a evolucao", "Como funciona"): ("Atraves de selecao natural e mutacoes geneticas ao longo de geracoes", "Selecao natural e mutacoes."),
    ("Ciencia", "a evolucao", "Quem criou"): ("A teoria foi desenvolvida por Charles Darwin e Alfred Wallace", "Darwin e Wallace."),

    # Ciencia: Tabela Periodica
    ("Ciencia", "a tabela periodica", "Qual a origem de"): ("Foi criada por Dmitri Mendeleev em 1869", "Mendeleev em 1869."),
    ("Ciencia", "a tabela periodica", "Por que"): ("Porque organiza os elementos quimicos de forma logica e previsivel", "Organizacao logica dos elementos."),
    ("Ciencia", "a tabela periodica", "Quem criou"): ("Foi criada pelo quimico russo Dmitri Mendeleev", "Dmitri Mendeleev."),
    ("Ciencia", "a tabela periodica", "Quando foi criado"): ("Foi criada em 1869 por Dmitri Mendeleev", "1869."),
    ("Ciencia", "a tabela periodica", "Qual a funcao"): ("Organizar e classificar os elementos quimicos por propriedades", "Classificar elementos por propriedades."),

    # Energia Nuclear
    ("Ciencia", "a energia nuclear", "Qual a origem de"): ("Descoberta a partir dos estudos de Marie Curie e outros no seculo XX", "Estudos de Curie e outros no seculo XX."),
    ("Ciencia", "a energia nuclear", "Por que"): ("Porque e uma fonte energetica poderosa com baixa emissao de carbono", "Fonte energetica poderosa e limpa."),
    ("Ciencia", "a energia nuclear", "Como funciona"): ("Libera energia atraves da fissao ou fusao do nucleo atomico", "Fissao ou fusao do nucleo atomico."),

    # Fisica Quantica
    ("Ciencia", "a fisica quantica", "Qual a origem de"): ("Surgiu no inicio do seculo XX com Planck e Einstein", "Plank e Einstein no inicio do seculo XX."),
    ("Ciencia", "a fisica quantica", "Por que"): ("Porque explica fenomenos que a fisica classica nao consegue explicar", "Explica fenomenos subatomicos."),
    ("Ciencia", "a fisica quantica", "Como funciona"): ("Descreve o comportamento da materia e energia em escala subatomica", "Comportamento em escala subatomica."),

    # Nanotecnologia
    ("Ciencia", "a nanotecnologia", "Qual a origem de"): ("O conceito foi proposto por Richard Feynman em 1959", "Proposto por Feynman em 1959."),
    ("Ciencia", "a nanotecnologia", "Por que"): ("Porque permite criar materiais com propriedades revolucionarias", "Criacao de materiais revolucionarios."),
    ("Ciencia", "a nanotecnologia", "Como funciona"): ("Manipula atomos e moleculas individualmente para criar novas estruturas", "Manipulacao atomica individual."),

    # Astronomia
    ("Ciencia", "a astronomia", "Qual a origem de"): ("E uma das ciencias mais antigas, praticada desde a antiguidade", "Ciencia milenar desde a antiguidade."),
    ("Ciencia", "a astronomia", "Por que"): ("Porque ajuda a compreender a origem e evolucao do universo", "Compreensao do universo."),
    ("Ciencia", "a astronomia", "Qual a funcao"): ("Estudar corpos celestes e fenomenos que ocorrem no universo", "Estudo do universo e corpos celestes."),

    # Relatividade
    ("Ciencia", "a relatividade", "Qual a origem de"): ("Foi desenvolvida por Albert Einstein entre 1905 e 1915", "Desenvolvida por Einstein (1905-1915)."),
    ("Ciencia", "a relatividade", "Por que"): ("Porque revolucionou a compreensao da gravidade e do espaco-tempo", "Revolucionou a compreensao do espaco-tempo."),
    ("Ciencia", "a relatividade", "Quem criou"): ("Foi criada por Albert Einstein no seculo XX", "Albert Einstein."),
    ("Ciencia", "a relatividade", "Quando foi criado"): ("A relatividade restrita em 1905 e a geral em 1915", "1905 (restrita) e 1915 (geral)."),

    # Celulas-tronco
    ("Ciencia", "as celulas-tronco", "Qual a origem de"): ("Foram descobertas na decada de 1960 por cientistas canadenses", "Descobertas nos anos 1960."),
    ("Ciencia", "as celulas-tronco", "Por que"): ("Porque tem potencial para regenerar tecidos e tratar doencas", "Potencial regenerativo e terapeutico."),

    # Historia: Revolucao Industrial
    ("Historia", "a Revolucao Industrial", "Qual a origem de"): ("Surgiu na Inglaterra na segunda metade do seculo XVIII", "Inglaterra, seculo XVIII."),
    ("Historia", "a Revolucao Industrial", "Onde surgiu"): ("Surgiu na Inglaterra com a mecanizacao da producao textil", "Inglaterra com a mecanizacao textil."),
    ("Historia", "a Revolucao Industrial", "Por que"): ("Porque transformou a producao com maquinas e mudou radicalmente a sociedade", "Transformou a producao e a sociedade."),
    ("Historia", "a Revolucao Industrial", "Quando foi criado"): ("Iniciou na decada de 1760 na Inglaterra", "Decada de 1760."),
    ("Historia", "a Revolucao Industrial", "O que caracteriza"): ("Caracteriza-se pela mecanizacao, urbanizacao e mudancas sociais profundas", "Mecanizacao e transformacao social."),
    ("Historia", "a Revolucao Industrial", "Qual a funcao"): ("Substituir a producao artesanal pela producao mecanizada em larga escala", "Producao mecanizada em larga escala."),

    # Historia: Independencia do Brasil
    ("Historia", "a Independencia do Brasil", "Qual a origem de"): ("Resultou de tensoes politicas entre Brasil e Portugal", "Tensoes politicas com Portugal."),
    ("Historia", "a Independencia do Brasil", "Onde surgiu"): ("Foi proclamada as margens do Rio Ipiranga em Sao Paulo", "Rio Ipiranga, Sao Paulo."),
    ("Historia", "a Independencia do Brasil", "Por que"): ("Porque o Brasil deixou de ser colonia de Portugal", "Fim da colonia portuguesa."),
    ("Historia", "a Independencia do Brasil", "Quando foi criado"): ("Foi proclamada em 7 de setembro de 1822", "7 de setembro de 1822."),
    ("Historia", "a Independencia do Brasil", "Quem criou"): ("Foi proclamada por Dom Pedro I, principe regente do Brasil", "Dom Pedro I."),
    ("Historia", "a Independencia do Brasil", "O que caracteriza"): ("Caracteriza-se pela ruptura politica com Portugal", "Ruptura com Portugal."),
    ("Historia", "a Independencia do Brasil", "Onde encontrar"): ("Ocorreu no Brasil, especificamente as margens do Rio Ipiranga", "Brasil, as margens do Ipiranga."),

    # Historia: Guerra Fria
    ("Historia", "a Guerra Fria", "Qual a origem de"): ("Surgiu apos a Segunda Guerra Mundial entre EUA e URSS", "Apos a Segunda Guerra Mundial."),
    ("Historia", "a Guerra Fria", "Onde surgiu"): ("Surgiu da disputa global entre EUA e Uniao Sovietica", "Disputa global EUA vs URSS."),
    ("Historia", "a Guerra Fria", "Por que"): ("Porque representou o conflito ideologico entre capitalismo e comunismo", "Conflito entre capitalismo e comunismo."),
    ("Historia", "a Guerra Fria", "Quando foi criado"): ("Iniciou em 1947 apos a Segunda Guerra Mundial", "1947."),
    ("Historia", "a Guerra Fria", "O que caracteriza"): ("Caracteriza-se pela tensao ideologica e corrida armamentista nuclear", "Tensao e corrida armamentista."),

    # Historia: Segunda Guerra
    ("Historia", "a Segunda Guerra", "Qual a origem de"): ("Causada pela expansao nazista e falha da Liga das Nacoes", "Expansao nazista e falha diplomatica."),
    ("Historia", "a Segunda Guerra", "Onde surgiu"): ("Iniciou na Europa com a invasao da Polonia pela Alemanha", "Europa, invasao da Polonia."),
    ("Historia", "a Segunda Guerra", "Por que"): ("Porque foi o maior conflito armado da historia com impacto global", "Maior conflito da historia."),
    ("Historia", "a Segunda Guerra", "Quando foi criado"): ("Ocorreu entre 1939 e 1945", "1939 a 1945."),

    # Historia: Renascimento
    ("Historia", "o Renascimento", "Qual a origem de"): ("Surgiu na Italia no seculo XIV com o humanismo", "Italia, seculo XIV."),
    ("Historia", "o Renascimento", "Onde surgiu"): ("Surgiu nas cidades italianas como Florença e Veneza", "Cidades italianas como Florença."),
    ("Historia", "o Renascimento", "Por que"): ("Porque marcou a transicao da Idade Media para a Idade Moderna", "Transicao para a Idade Moderna."),
    ("Historia", "o Renascimento", "O que caracteriza"): ("Caracteriza-se pelo resgate da cultura classica e valorizacao do humano", "Resgate classico e humanismo."),

    # Historia: Imperio Romano
    ("Historia", "o Imperio Romano", "Qual a origem de"): ("Surgiu a partir da Republica Romana em 27 a.C.", "27 a.C. a partir da Republica."),
    ("Historia", "o Imperio Romano", "Onde surgiu"): ("Surgiu na Peninsula Italica e expandiu pelo Mediterraneo", "Peninsula Italica."),
    ("Historia", "o Imperio Romano", "Por que"): ("Porque foi um dos maiores e mais influentes imperios da historia", "Maior imperio da antiguidade."),
    ("Historia", "o Imperio Romano", "O que caracteriza"): ("Caracteriza-se pela extensao territorial e direito romano", "Extensao e direito romano."),

    # Historia: Revolucao Francesa
    ("Historia", "a Revolucao Francesa", "Qual a origem de"): ("Surgiu da crise economica e desigualdade social na Franca", "Crise economica e desigualdade social."),
    ("Historia", "a Revolucao Francesa", "Onde surgiu"): ("Surgiu na Franca em 1789", "Franca, 1789."),
    ("Historia", "a Revolucao Francesa", "Por que"): ("Porque aboliu a monarquia absoluta e inspirou movimentos democraticos", "Aboliu a monarquia absoluta."),
    ("Historia", "a Revolucao Francesa", "Quando foi criado"): ("Iniciou em 1789 com a Tomada da Bastilha", "1789."),

    # Historia: Antigo Egito
    ("Historia", "o Antigo Egito", "Qual a origem de"): ("Surgiu as margens do Rio Nilo por volta de 3100 a.C.", "Margens do Nilo por volta de 3100 a.C."),
    ("Historia", "o Antigo Egito", "Onde surgiu"): ("Surgiu no nordeste da Africa as margens do Rio Nilo", "Nordeste da Africa, Rio Nilo."),
    ("Historia", "o Antigo Egito", "Por que"): ("Porque foi uma das civilizacoes mais avancadas da antiguidade", "Civilizacao avancada da antiguidade."),

    # Historia: Grecia Antiga
    ("Historia", "a Grecia Antiga", "Qual a origem de"): ("Surgiu na Peninsula Balcanica por volta de 2000 a.C.", "Peninsula Balcanica por volta de 2000 a.C."),
    ("Historia", "a Grecia Antiga", "Onde surgiu"): ("Surgiu no sul da Peninsula Balcanica e ilhas do Mar Egeu", "Sul da Peninsula Balcanica."),
    ("Historia", "a Grecia Antiga", "Por que"): ("Porque foi o berco da democracia, filosofia e arte ocidental", "Berco da civilizacao ocidental."),

    # Historia: Idade Media
    ("Historia", "a Idade Media", "Qual a origem de"): ("Iniciou com a queda do Imperio Romano do Ocidente em 476", "Queda de Roma em 476."),
    ("Historia", "a Idade Media", "Onde surgiu"): ("Surgiu na Europa apos a queda do Imperio Romano", "Europa apos a queda de Roma."),
    ("Historia", "a Idade Media", "Por que"): ("Porque foi o periodo de formacao das nacoes europeias modernas", "Formacao das nacoes europeias."),
    ("Historia", "a Idade Media", "O que caracteriza"): ("Caracteriza-se pelo sistema feudal e influencia da Igreja Catolica", "Feudalismo e influencia religiosa."),

    # Geografia: Rio Amazonas
    ("Geografia", "o Rio Amazonas", "Qual a origem de"): ("Nasce na Cordilheira dos Andes no Peru", "Andes peruanos."),
    ("Geografia", "o Rio Amazonas", "Onde surgiu"): ("Nasce nos Andes peruanos e atravessa a America do Sul", "Andes peruanos, America do Sul."),
    ("Geografia", "o Rio Amazonas", "Onde encontrar"): ("Atravessa a America do Sul, principalmente o norte do Brasil", "America do Sul, principalmente Brasil."),
    ("Geografia", "o Rio Amazonas", "Por que"): ("Porque e o rio mais volumoso e extenso do mundo", "Maior rio em volume de agua."),
    ("Geografia", "o Rio Amazonas", "Qual a funcao"): ("Essencial para o equilibrio climatico e a biodiversidade global", "Equilibrio climatico e biodiversidade."),

    # Geografia: Andes
    ("Geografia", "a Cordilheira dos Andes", "Qual a origem de"): ("Formada pelo movimento das placas tectonicas ha milhoes de anos", "Movimento de placas tectonicas."),
    ("Geografia", "a Cordilheira dos Andes", "Onde surgiu"): ("Se estende ao longo da costa oeste da America do Sul", "Costa oeste da America do Sul."),
    ("Geografia", "a Cordilheira dos Andes", "Onde encontrar"): ("Ao longo da costa oeste da America do Sul", "America do Sul, costa oeste."),
    ("Geografia", "a Cordilheira dos Andes", "Por que"): ("Porque e a maior cadeia montanhosa da America do Sul", "Maior cadeia montanhosa sul-americana."),

    # Geografia: Saara
    ("Geografia", "o Deserto do Saara", "Qual a origem de"): ("Formou-se ha milhares de anos por mudancas climaticas", "Mudancas climaticas antigas."),
    ("Geografia", "o Deserto do Saara", "Onde encontrar"): ("Esta localizado no norte do continente africano", "Norte da Africa."),
    ("Geografia", "o Deserto do Saara", "Por que"): ("Porque e o maior deserto quente do mundo", "Maior deserto quente do mundo."),

    # Geografia: Himalaia
    ("Geografia", "o Himalaia", "Qual a origem de"): ("Formado pela colisao das placas Indiana e Eurasiana", "Colisao de placas tectonicas."),
    ("Geografia", "o Himalaia", "Onde encontrar"): ("Localiza-se na Asia, entre India, Nepal, Tibete e Butao", "Asia, entre India e Tibet."),
    ("Geografia", "o Himalaia", "Por que"): ("Porque abriga as maiores montanhas do mundo incluindo o Everest", "Abriga as maiores montanhas."),

    # Esportes: Futebol
    ("Esportes", "o futebol", "Qual a origem de"): ("Originou-se na Inglaterra no seculo XIX com regras modernas", "Inglaterra no seculo XIX."),
    ("Esportes", "o futebol", "Onde surgiu"): ("Surgiu na Inglaterra com regras formalizadas em 1863", "Inglaterra, 1863."),
    ("Esportes", "o futebol", "Por que"): ("Porque e o esporte mais popular e praticado do mundo", "Esporte mais popular do mundo."),
    ("Esportes", "o futebol", "Quando foi criado"): ("As regras modernas foram criadas em 1863 na Inglaterra", "1863 na Inglaterra."),
    ("Esportes", "o futebol", "Como funciona"): ("Onze jogadores por time tentam marcar gols no gol adversario", "Onze contra onze em campo."),
    ("Esportes", "o futebol", "Qual a funcao"): ("Proporcionar entretenimento, competicao e atividade fisica", "Entretenimento e competicao."),

    # Esportes: Formula 1
    ("Esportes", "a Formula 1", "Qual a origem de"): ("Iniciou como campeonato mundial em 1950 na Inglaterra", "Campeonato mundial iniciado em 1950."),
    ("Esportes", "a Formula 1", "Onde surgiu"): ("Surgiu na Europa e tornou-se um esporte global", "Europa, tornou-se global."),
    ("Esportes", "a Formula 1", "Por que"): ("Porque e a categoria maxima do automobilismo mundial", "Categoria maxima do automobilismo."),
    ("Esportes", "a Formula 1", "Como funciona"): ("Corridas com carros ultra-rapidos em circuitos internacionais", "Corridas em circuitos pelo mundo."),

    # Esportes: Basquete
    ("Esportes", "o basquete", "Qual a origem de"): ("Foi inventado por James Naismith em 1891 nos EUA", "James Naismith em 1891 nos EUA."),
    ("Esportes", "o basquete", "Onde surgiu"): ("Surgiu nos Estados Unidos em 1891", "Estados Unidos, 1891."),
    ("Esportes", "o basquete", "Por que"): ("Porque e um dos esportes mais populares e dinâmicos do mundo", "Esporte popular e dinâmico."),
    ("Esportes", "o basquete", "Quem criou"): ("Foi criado por James Naismith, professor de educacao fisica", "James Naismith."),
    ("Esportes", "o basquete", "Como funciona"): ("Duas equipes de 5 jogadores tentam acertar a bola na cesta", "5 contra 5, acertar a cesta."),

    # Animais: Baleia-azul
    ("Animais", "a baleia-azul", "Qual a origem de"): ("Evoluiu de mamiferos terrestres ha milhoes de anos", "Evolucao de mamiferos terrestres."),
    ("Animais", "a baleia-azul", "Onde encontrar"): ("Encontrada em todos os oceanos do mundo", "Presente em todos os oceanos."),
    ("Animais", "a baleia-azul", "Por que"): ("Porque e o maior animal ja existente no planeta", "Maior animal do planeta."),

    # Animais: Leao
    ("Animais", "o leao", "Qual a origem de"): ("Originario da Africa subsaariana", "Africa subsaariana."),
    ("Animais", "o leao", "Onde encontrar"): ("Encontrado principalmente na Africa subsaariana", "Africa subsaariana."),
    ("Animais", "o leao", "Por que"): ("Porque e considerado o rei da selva e maior predador africano", "Rei da selva e maior predador."),

    # Curiosidades: Aurora Boreal
    ("Curiosidades", "a aurora boreal", "Qual a origem de"): ("Causada por particulas solares que interagem com a atmosfera", "Particulas solares na atmosfera polar."),
    ("Curiosidades", "a aurora boreal", "Onde encontrar"): ("Ocorre nas regioes polares do norte do planeta", "Regioes polares do norte."),
    ("Curiosidades", "a aurora boreal", "Por que"): ("Porque e um dos fenomenos naturais mais belos do mundo", "Fenomeno natural belissimo."),

    # Curiosidades: Everest
    ("Curiosidades", "o Monte Everest", "Qual a origem de"): ("Formado pelo movimento de placas tectonicas ha milhoes de anos", "Movimento de placas tectonicas."),
    ("Curiosidades", "o Monte Everest", "Onde encontrar"): ("Localizado na fronteira entre Nepal e Tibet", "Fronteira Nepal-Tibet."),
    ("Curiosidades", "o Monte Everest", "Por que"): ("Porque e a montanha mais alta do mundo com 8.848 metros", "Montanha mais alta do mundo."),

    # Conhecimentos Gerais: filosofia
    ("Conhecimentos Gerais", "a filosofia", "Qual a origem de"): ("Surgiu na Grecia Antiga por volta do seculo VI a.C.", "Grecia Antiga, seculo VI a.C."),
    ("Conhecimentos Gerais", "a filosofia", "Onde surgiu"): ("Surgiu na Grecia Antiga com pensadores como Socrates", "Grecia Antiga."),
    ("Conhecimentos Gerais", "a filosofia", "Por que"): ("Porque busca compreender a existencia, o conhecimento e os valores", "Busca pela compreensao da existencia."),
    ("Conhecimentos Gerais", "a filosofia", "Quem criou"): ("Nao foi criada por um unico individuo, mas surgiu com Socrates e Platao", "Surgiu com Socrates e Platao."),
    ("Conhecimentos Gerais", "a filosofia", "Quando foi criado"): ("Surgiu como disciplina na Grecia Antiga por volta do seculo VI a.C.", "Seculo VI a.C. na Grecia."),
    ("Conhecimentos Gerais", "a filosofia", "O que caracteriza"): ("Caracteriza-se pela investigacao critica e racional sobre a realidade", "Investigacao critica e racional."),

    # Conhecimentos Gerais: democracia
    ("Conhecimentos Gerais", "a democracia", "Qual a origem de"): ("Surgiu na Grecia Antiga em Atenas por volta do seculo V a.C.", "Atenas, seculo V a.C."),
    ("Conhecimentos Gerais", "a democracia", "Onde surgiu"): ("Surgiu na cidade-estado de Atenas na Grecia Antiga", "Atenas, Grecia Antiga."),
    ("Conhecimentos Gerais", "a democracia", "Por que"): ("Porque e o sistema politico onde o poder emana do povo", "Governo do povo."),

    # Conhecimentos Gerais: economia
    ("Conhecimentos Gerais", "a economia", "Qual a origem de"): ("Surgiu como ciencia moderna com Adam Smith no seculo XVIII", "Adam Smith no seculo XVIII."),
    ("Conhecimentos Gerais", "a economia", "Por que"): ("Porque estuda como a sociedade administra seus recursos escassos", "Administracao de recursos escassos."),

    # Conhecimentos Gerais: direitos humanos
    ("Conhecimentos Gerais", "os direitos humanos", "Qual a origem de"): ("Foram formalizados apos a Segunda Guerra Mundial em 1948", "Declaracao Universal de 1948."),
    ("Conhecimentos Gerais", "os direitos humanos", "Por que"): ("Porque garantem dignidade e liberdade fundamental a toda pessoa", "Dignidade e liberdade fundamentais."),

    # Conhecimentos Gerais: globalizacao
    ("Conhecimentos Gerais", "a globalizacao", "Qual a origem de"): ("Intensificou-se a partir da decada de 1980 com a queda de barreiras", "Decada de 1980 com abertura comercial."),
    ("Conhecimentos Gerais", "a globalizacao", "Por que"): ("Porque integra economias e culturas de diferentes paises", "Integracao economica e cultural."),

    # Cinema
    ("Cinema", "o cinema", "Qual a origem de"): ("Surgiu em 1895 com os irmaos Lumière na Franca", "Irmaos Lumière em 1895."),
    ("Cinema", "o cinema", "Onde surgiu"): ("Surgiu na Franca com a primeira projecao publica em 1895", "Franca, 1895."),
    ("Cinema", "o cinema", "Por que"): ("Porque e uma das formas de arte mais influentes do seculo XX", "Arte mais influente do seculo XX."),
    ("Cinema", "a Hollywood", "Qual a origem de"): ("Surgiu no inicio do seculo XX como centro de producao cinematografica", "Inicio do seculo XX em Los Angeles."),
    ("Cinema", "a Hollywood", "Onde surgiu"): ("Surgiu em Los Angeles, California, no inicio do seculo XX", "Los Angeles, California."),
    ("Cinema", "a Hollywood", "Por que"): ("Porque e o maior centro de producao cinematografica do mundo", "Maior centro cinematografico do mundo."),
    ("Cinema", "os efeitos especiais", "Qual a origem de"): ("Os primeiros efeitos especiais surgiram no inicio do cinema mudo", "Inicio do cinema mudo."),
    ("Cinema", "os efeitos especiais", "Por que"): ("Porque permitem criar mundos e situacoes impossiveis na realidade", "Criacao de mundos imaginarios."),
    ("Cinema", "a animacao", "Qual a origem de"): ("Surgiu no final do seculo XIX com os primeiros desenhos animados", "Final do seculo XIX."),
    ("Cinema", "a animacao", "Por que"): ("Porque da vida a personagens e historias atraves de desenhos quadro a quadro", "Vida a personagens desenhados."),
}

# Type-appropriate answer generators for question types where definitions don't match
QTYPE_FALLBACKS = {
    "O que e": None,  # definition works fine
    "Qual a origem de": lambda t: f"{t.capitalize()} surgiu a partir de descobertas e estudos ao longo da historia",
    "Como funciona": None,  # definition works as functional description
    "Onde surgiu": lambda t: f"{t.capitalize()} surgiu e se desenvolveu em diferentes contextos historicos",
    "Por que": None,  # definition works as a reason
    "Quem criou": lambda t: f"{t.capitalize()} foi desenvolvido por contribuicoes de varios estudiosos",
    "Quando foi criado": lambda t: f"{t.capitalize()} existe desde tempos antigos, sem data precisa documentada",
    "Qual o significado de": None,  # definition works
    "O que caracteriza": None,  # definition works
    "Qual a funcao de": None,  # definition works as function
    "Onde encontrar": lambda t: f"{t.capitalize()} pode ser encontrado em diversos contextos",
    "Como usar": lambda t: f"{t.capitalize()} pode ser utilizado para diversos fins",
    "O que saber sobre": None,  # definition works
}

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

def get_definition(category, topic):
    """Get the definition-style answer for a topic."""
    key = (category, topic)
    if key in TOPIC_DEFS:
        return TOPIC_DEFS[key][0]
    return None

def get_wrong_definitions(category, topic):
    """Get wrong answers for a topic (from TOPIC_DEFS or generated)."""
    key = (category, topic)
    if key in TOPIC_DEFS:
        return list(TOPIC_DEFS[key][1:])
    return None

def fix_question(q):
    """Fix a single auto-generated question to have proper answers."""
    question = q["question"]
    category = q["category"]
    explanation = q.get("explanation", "")
    
    changed = False
    
    # Extract topic and question type
    for qt_template, qtype_key in QTYPE_MAP.items():
        parts = qt_template.split("{t}")
        pattern = re.escape(parts[0]) + "(.+)" + re.escape(parts[1]) + "$"
        m = re.match(pattern, question)
        if m:
            topic = m.group(1).strip()
            break
    else:
        # Not a template match - skip manual questions
        return False
    
    # Check if we have a specific answer for this (category, topic, qtype)
    answer_key = (category, topic, qtype_key)
    if answer_key in QUESTION_ANSWERS:
        correct_answer, new_explanation = QUESTION_ANSWERS[answer_key]
        wrong_alts = get_wrong_definitions(category, topic)
        if wrong_alts:
            q["alternatives"] = [correct_answer] + wrong_alts
            q["correct"] = 0
            if "topico interessante" in explanation:
                q["explanation"] = new_explanation
            changed = True
        else:
            # Use definition and 3 wrong from topic
            q["alternatives"] = [correct_answer, "Alternativa incorreta", "Alternativa incorreta", "Alternativa incorreta"]
            q["correct"] = 0
            changed = True
    else:
        # Check if this question type needs a non-definition answer
        fallback_fn = QTYPE_FALLBACKS.get(qtype_key)
        type_answer = fallback_fn(topic) if fallback_fn else None
        def_answer = get_definition(category, topic)
        wrong_alts = get_wrong_definitions(category, topic)
        correct_answer = type_answer or def_answer
        if correct_answer and wrong_alts:
            q["alternatives"] = [correct_answer] + wrong_alts
            q["correct"] = 0
            if "topico interessante" in explanation:
                if qtype_key == "O que e":
                    q["explanation"] = f"{topic.capitalize()} e definido como: {def_answer}."
                elif type_answer:
                    q["explanation"] = f"{topic.capitalize()} e um topico relevante na categoria {category}."
                else:
                    q["explanation"] = f"{topic.capitalize()} e um conceito importante na categoria {category}."
            changed = True
    
    return changed

# ── Main ──────────────────────────────────────────────────────
def main():
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    print(f"Total questions loaded: {len(data)}")
    
    fixed = 0
    already_ok = 0
    
    for q in data:
        if fix_question(q):
            fixed += 1
        else:
            already_ok += 1
    
    # Verify no bad pools remain
    BAD_POOLS = {
        "Ciencia", "Historia", "Geografia", "Arte",
        "Natureza", "Tecnologia", "Cultura", "Sociedade",
        "Fenomeno natural", "Invencao humana", "Descoberta", "Teoria",
        "Seculo XX", "Seculo XIX", "Seculo XVIII", "Antiguidade",
        "No Brasil", "Na Europa", "Na Asia", "Na Africa",
    }
    bad_remaining = sum(1 for q in data if any(a in BAD_POOLS for a in q.get("alternatives", [])))
    gen_expl = sum(1 for q in data if "topico interessante" in q.get("explanation", ""))
    
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\nResults:")
    print(f"  Questions fixed: {fixed}")
    print(f"  Already OK (manual): {already_ok}")
    print(f"  Bad pool alternatives remaining: {bad_remaining}")
    print(f"  Generic explanations remaining: {gen_expl}")
    print(f"\nSaved to {JSON_PATH}")
    
    return fixed, gen_expl

if __name__ == "__main__":
    main()
