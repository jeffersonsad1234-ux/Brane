import json, re
from pathlib import Path

JSON_PATH = Path(__file__).parent / "quiz_seed.json"

TARGET_CATEGORIES = {"Historia", "Tecnologia", "Geografia", "Ciencia", "Games", "Conhecimentos Gerais"}

CATEGORY_LABELS = {
    "Historia": "Na historia",
    "Tecnologia": "Na tecnologia",
    "Geografia": "Na geografia",
    "Ciencia": "Na ciencia",
    "Games": "Nos games",
    "Conhecimentos Gerais": "No conhecimento geral",
}

TOPIC_EXTRAS = {
    "Tecnologia": {
        "internet": "A internet revolucionou a comunicacao e o acesso a informacao em todo o mundo. Ela conecta bilhoes de dispositivos e pessoas, transformando a economia, a educacao e o entretenimento.",
        "smartphone": "O smartphone se tornou uma ferramenta essencial no dia a dia das pessoas. Ele combina telefone, computador, camera e acesso a internet em um unico dispositivo portatil.",
        "inteligencia artificial": "A inteligencia artificial esta transformando a forma como interagimos com a tecnologia. Ela permite que maquinas aprendam, raciocinem e tomem decisoes de forma autonoma.",
        "Bluetooth": "O Bluetooth e uma tecnologia pratica que elimina a necessidade de cabos. Ele permite a conexao sem fio entre dispositivos proximos, como fones de ouvido, teclados e caixas de som.",
        "Wi-Fi": "O Wi-Fi se tornou essencial para a conectividade sem fio em residencias e empresas. Ele permite acesso a internet sem a necessidade de cabos fisicos.",
        "criptografia": "A criptografia e essencial para a seguranca digital nos dias de hoje. Ela protege dados e comunicacoes contra acessos nao autorizados, garantindo privacidade e seguranca.",
        "5G": "O 5G representa um grande salto na tecnologia de redes moveis. Ele oferece velocidades muito maiores e menor latencia, possibilitando novas aplicacoes como carros autonomos e cirurgias remotas.",
        "realidade virtual": "A realidade virtual cria experiencias imersivas em ambientes simulados. Ela e usada em jogos, treinamentos, educacao e ate mesmo em terapias medicas.",
        "Bitcoin": "O Bitcoin e uma moeda digital descentralizada que funciona sem a necessidade de bancos. Ele foi criado em 2009 e utiliza a tecnologia blockchain para garantir seguranca e transparencia.",
        "robotica": "A robotica combina engenharia, eletronica e programacao para criar maquinas inteligentes. Os robos sao usados na industria, na medicina, na exploracao espacial e em muitas outras areas.",
    },
    "Geografia": {
        "Rio Amazonas": "O Rio Amazonas e o maior rio do mundo em volume de agua e extensao. Ele atravessa a America do Sul e e essencial para o equilibrio climatico e a biodiversidade do planeta.",
        "Cordilheira dos Andes": "A Cordilheira dos Andes e a maior cadeia montanhosa da America do Sul. Ela se estende ao longo da costa oeste do continente e influencia o clima e a geografia de varios paises.",
        "Deserto do Saara": "O Deserto do Saara e o maior deserto quente do mundo, localizado no norte da Africa. Sua paisagem e marcada por dunas enormes e um clima extremamente seco.",
        "Antartida": "A Antartida e o continente mais frio, seco e isolado do planeta. Ela desempenha um papel crucial no equilibrio climatico global e na regulacao do nivel do mar.",
        "Oceano Pacifico": "O Oceano Pacifico e o maior oceano do planeta, cobrindo cerca de um terco da superficie terrestre. Ele abriga uma imensa biodiversidade marinha e influencia o clima global.",
        "Himalaia": "O Himalaia e a maior cadeia montanhosa do mundo, abrigando o Monte Everest. Ele se formou pela colisao das placas tectonicas Indiana e Eurasiana ha milhoes de anos.",
        "Patagonia": "A Patagonia e uma regiao no extremo sul da America do Sul, conhecida por suas paisagens deslumbrantes. Ela abriga geleiras, montanhas e uma fauna unica.",
        "Mar Morto": "O Mar Morto e um lago hipersalino localizado entre Israel e Jordania. Sua alta concentracao de sal permite que as pessoas flutuem facilmente em suas aguas.",
        "Tundra": "A Tundra e um bioma frio com vegetacao rasteira e solo permanentemente congelado. Ela e encontrada principalmente nas regioes polares e em altas montanhas.",
        "Savana": "A Savana e um bioma tropical com gramineas e arvores esparsas. Ela e caracteristica da Africa e abriga uma grande variedade de animais selvagens.",
    },
    "Ciencia": {
        "fotossintese": "A fotossintese e um processo essencial para a vida na Terra. As plantas utilizam a luz solar para produzir energia e liberar oxigenio, sustentando toda a cadeia alimentar.",
        "DNA": "O DNA e a molecula que armazena toda a informacao genetica dos seres vivos. Sua estrutura de dupla helice foi descoberta por Watson e Crick em 1953, revolucionando a biologia.",
        "evolucao": "A evolucao e o processo pelo qual as especies mudam ao longo do tempo. A teoria de Charles Darwin explica como a selecao natural e as mutacoes geneticas impulsionam essa transformacao.",
        "tabela periodica": "A tabela periodica organiza todos os elementos quimicos conhecidos de forma logica. Ela foi criada por Dmitri Mendeleev em 1869 e e fundamental para o estudo da quimica.",
        "energia nuclear": "A energia nuclear e uma das fontes mais poderosas de energia disponiveis. Ela e gerada por reacoes no nucleo do atomo e tem aplicacoes tanto na geracao de eletricidade quanto na medicina.",
        "fisica quantica": "A fisica quantica estuda o comportamento da materia e da energia em escala subatomica. Ela revolucionou nossa compreensao do mundo e esta na base de tecnologias como lasers e transistores.",
        "relatividade": "A teoria da relatividade de Albert Einstein transformou nossa compreensao do espaco e do tempo. Ela explica como a gravidade curva o espaco-tempo e influencia o movimento dos corpos celestes.",
        "celulas-tronco": "As celulas-tronco sao celulas indiferenciadas com grande potencial de regeneracao. Elas podem se transformar em diferentes tipos de tecido e sao uma grande promessa para a medicina regenerativa.",
        "nanotecnologia": "A nanotecnologia trabalha com a manipulacao da materia em escala atomica e molecular. Ela tem aplicacoes revolucionarias na medicina, na eletronica, nos materiais e em muitas outras areas.",
        "astronomia": "A astronomia e uma das ciencias mais antigas da humanidade. Ela estuda os corpos celestes e os fenomenos do universo, ajudando-nos a compreender nossa origem e o cosmos.",
    },
    "Games": {
        "MMORPG": "MMORPG significa Massively Multiplayer Online Role-Playing Game. Sao jogos onde milhares de jogadores interagem simultaneamente em um mesmo mundo virtual.",
        "Minecraft": "Minecraft e um dos jogos mais populares e vendidos de todos os tempos. Ele permite que os jogadores construam e explorem mundos feitos de blocos, estimulando a criatividade.",
        "e-sports": "Os e-sports sao competicoes profissionais de videogame que atraem milhoes de espectadores. Jogadores treinam intensamente para competir em torneios com premios milionarios.",
        "speedrun": "Speedrun e a pratica de completar um jogo no menor tempo possivel. Os speedrunners estudam rotas e tecnicas para otimizar cada segundo da jogatina.",
        "FPS": "FPS significa First-Person Shooter, um genero de jogo onde a camera mostra a perspectiva do personagem. Jogos como Call of Duty e Counter-Strike sao exemplos famosos desse genero.",
        "RPG": "RPG, ou Role-Playing Game, e um genero onde os jogadores assumem o papel de personagens em mundos imaginarios. Eles evoluem suas habilidades e enfrentam desafios ao longo de uma narrativa.",
        "Battle Royale": "Battle Royale e um genero onde varios jogadores competem ate restar apenas um vencedor. Jogos como Fortnite e PUBG popularizaram esse formato em todo o mundo.",
        "plataforma": "Jogos de plataforma sao um genero classico onde o jogador precisa pular entre plataformas e superar obstaculos. Super Mario e um dos exemplos mais iconicos desse estilo.",
        "simulacao": "Jogos de simulacao buscam recriar atividades da vida real com alto realismo. Eles podem simular desde a operacao de veiculos ate a administracao de cidades inteiras.",
        "puzzle": "Jogos de puzzle desafiam a mente com problemas de logica, padroes e raciocinio. Tetris e um dos puzzles mais famosos e influentes da historia dos videogames.",
    },
    "Historia": {
        "Imperio Romano": "O Imperio Romano dominou grande parte do Mediterraneo durante muitos seculos. Sua influencia marcou a politica, o direito, a arquitetura e a cultura ocidental.",
        "Revolucao Industrial": "A Revolucao Industrial transformou profundamente a sociedade com a mecanizacao da producao. Ela iniciou na Inglaterra e se espalhou pelo mundo, mudando para sempre a economia e o trabalho.",
        "Guerra Fria": "A Guerra Fria foi um periodo de tensao geopolítica entre Estados Unidos e Uniao Sovietica. Ela durou da decada de 1940 ate o inicio dos anos 1990 e influenciou todo o cenario internacional.",
        "Segunda Guerra": "A Segunda Guerra Mundial foi o maior conflito armado da historia. Envolveu mais de 30 paises e resultou em profundas mudancas politicas e sociais no mundo todo.",
        "Revolucao Francesa": "A Revolucao Francesa foi um marco na historia da humanidade. Ela aboliu a monarquia absoluta e inspirou movimentos democraticos em todo o mundo.",
        "Independencia do Brasil": "A Independencia do Brasil foi proclamada por Dom Pedro I em 7 de setembro de 1822. Esse processo marcou o fim do periodo colonial e o inicio do Imperio do Brasil.",
        "Antigo Egito": "O Antigo Egito foi uma das civilizacoes mais fascinantes da antiguidade. Ela se desenvolveu as margens do Rio Nilo e nos deixou um grande legado cultural e arquitetonico.",
        "Grecia Antiga": "A Grecia Antiga e considerada o berco da civilizacao ocidental. Foi la que surgiram a democracia, a filosofia, o teatro e importantes avancos na ciencia e na arte.",
        "Idade Media": "A Idade Media foi um periodo de profundas transformacoes na Europa. Durante esses seculos, o feudalismo e a Igreja Catolica exerceram grande influencia sobre a sociedade.",
        "Renascimento": "O Renascimento foi um movimento cultural e cientifico que marcou a transicao para a Idade Moderna. Ele valorizou a razão, a arte e o conhecimento classico.",
        "Guerra dos Farrapos": "A Guerra dos Farrapos foi uma revolucao regional ocorrida no Rio Grande do Sul entre 1835 e 1845. Ela foi motivada por insatisfacoes com a carga tributaria e a falta de autonomia provincial.",
        "Queda de Constantinopla": "A Queda de Constantinopla em 1453 marcou o fim do Imperio Bizantino. Esse evento e considerado por muitos historiadores como o marco final da Idade Media.",
        "Descobrimento do Brasil": "O Descobrimento do Brasil ocorreu em 1500 com a chegada dos portugueses liderados por Pedro Alvares Cabral. Esse evento marcou o inicio da colonizacao portuguesa na America do Sul.",
        "Revolucao Russa": "A Revolucao Russa de 1917 derrubou o regime czarista e estabeleceu o primeiro estado socialista do mundo. Ela teve grande impacto na politica e na economia global do seculo XX.",
        "Guerra do Vietna": "A Guerra do Vietna foi um conflito prolongado entre o Vietna do Norte comunista e o Vietna do Sul capitalista. Ela envolveu diretamente os Estados Unidos e deixou marcas profundas na sociedade americana e vietnamita.",
        "Guerra dos Cem Anos": "A Guerra dos Cem Anos foi um conflito entre Franca e Inglaterra que durou de 1337 a 1453. Ela foi travada principalmente por disputas territoriais e de sucessao ao trono frances.",
        "Periodo Napoleônico": "O Periodo Napoleônico foi marcado pelo governo de Napoleão Bonaparte na Franca. Ele expandiu o imperio frances pela Europa e implementou importantes reformas juridicas e administrativas.",
        "Escravidao no Brasil": "A Escravidao no Brasil durou mais de tres seculos e foi uma das maiores do mundo. Milhoes de africanos foram trazidos a forca para trabalhar nas plantacoes e nas minas.",
        "Imperio Inca": "O Imperio Inca foi a maior civilizacao pre-colombiana da America do Sul. Ele se estendia por grande parte dos Andes e era conhecido por suas avancadas tecnicas de agricultura e arquitetura.",
        "Vinda da Familia Real": "A vinda da Familia Real Portuguesa para o Brasil em 1808 transformou a colonia em sede do imperio portugues. Esse evento impulsionou o desenvolvimento cultural, economico e politico do Brasil.",
        "Proclamacao da Republica": "A Proclamacao da Republica no Brasil ocorreu em 15 de novembro de 1889. Ela marcou o fim do Imperio e o inicio de um novo regime politico no pais.",
        "Revolta dos Bandeirantes": "Os bandeirantes foram exploradores que desbravaram o interior do Brasil durante o periodo colonial. Suas expedicoes foram fundamentais para a expansao territorial do pais.",
        "Tratado de Tordesilhas": "O Tratado de Tordesilhas foi um acordo entre Portugal e Espanha em 1494. Ele dividiu as terras descobertas e por descobrir entre os dois paises por meio de um meridiano imaginario.",
        "Golpe Militar de 1964": "O Golpe Militar de 1964 instalou uma ditadura no Brasil que durou ate 1985. Esse periodo foi marcado por repressao politica, censura e supressao de direitos democraticos.",
        "Inconfidencia Mineira": "A Inconfidencia Mineira foi um movimento de rebeliao contra o dominio portugues em Minas Gerais. Seu principal lider, Tiradentes, tornou-se um simbolo da luta pela independencia do Brasil.",
        "Reforma Protestante": "A Reforma Protestante foi um movimento religioso que dividiu a Igreja Catolica no seculo XVI. Iniciada por Martinho Lutero, ela deu origem a diversas igrejas protestantes na Europa.",
    },
    "Conhecimentos Gerais": {
        "Bonsai": "Bonsai e uma arte japonesa que cultiva arvores em miniatura em vasos. Ela requer paciencia e habilidade para moldar a planta ao longo de muitos anos.",
        "cidadania": "Cidadania e o conjunto de direitos e deveres de uma pessoa em relacao ao seu pais. Ela inclui o direito ao voto, a liberdade de expressao e o respeito as leis.",
        "direitos humanos": "Os direitos humanos sao direitos fundamentais que pertencem a todas as pessoas. Eles garantem dignidade, liberdade e igualdade, independentemente de nacionalidade, genero ou religiao.",
        "economia": "A economia e a ciencia que estuda como a sociedade produz, distribui e consome bens e servicos. Ela analisa questoes como emprego, inflacao, crescimento e distribuicao de renda.",
        "filosofia": "A filosofia e o estudo critico sobre questoes fundamentais da existencia humana. Ela busca compreender a realidade, o conhecimento, a moral e o sentido da vida.",
        "democracia": "A democracia e um sistema politico onde o poder e exercido pelo povo. Ela se baseia em eleicoes livres, participacao cidada e respeito aos direitos fundamentais.",
        "urbanizacao": "A urbanizacao e o processo de crescimento das cidades e da populacao urbana. Ela traz desafios como infraestrutura, transporte, moradia e sustentabilidade ambiental.",
        "globalizacao": "A globalização e o processo de integracao economica, cultural e politica entre os paises. Ela aproximou pessoas e mercados, mas tambem gerou debates sobre desigualdade e identidade cultural.",
    },
}

def extract_topic(question):
    patterns = [
        r"^(?:O que e|Qual o significado de|O que caracteriza|Como funciona|Qual a funcao de) (.+)\?$",
        r"^(?:Qual a origem de|Onde surgiu|Onde encontrar|Como usar) (.+)\?$",
        r"^(?:Por que|Quando foi criado|Quem criou) (.+)\?$",
        r"^O que saber sobre (.+)\?$",
        r"^Qual (.+) (.+)\?$",
        r"^Como (.+)\?$",
    ]
    for pat in patterns:
        m = re.match(pat, question)
        if m:
            topic = m.group(1).strip() if m.lastindex == 1 else m.group(2).strip()
            # Normalize: remove leading article
            topic = re.sub(r"^(o|a|os|as) ", "", topic, flags=re.I).strip()
            return topic
    return None

def find_topic_key(topic, category):
    if not topic:
        return None
    t_lower = topic.lower()
    for key in list(TOPIC_EXTRAS.get(category, {}).keys()):
        if key.lower() in t_lower or t_lower in key.lower():
            return key
    # Partial match on any word
    words = t_lower.split()
    for key in list(TOPIC_EXTRAS.get(category, {}).keys()):
        for w in words:
            if len(w) > 3 and w in key.lower():
                return key
    return None

def expand(q):
    explanation = q.get("explanation", "")
    if len(explanation) >= 80:
        return False

    question = q["question"]
    category = q["category"]
    correct = q["correct"]
    answer = q["alternatives"][correct] if 0 <= correct < len(q["alternatives"]) else ""

    topic = extract_topic(question)
    topic_key = find_topic_key(topic, category)

    sentences = []

    # Try to use a pre-written 2-4 sentence extra
    if topic_key:
        extra = TOPIC_EXTRAS.get(category, {}).get(topic_key)
        if extra and len(extra) > 80:
            sentences.append(extra)
        else:
            if answer and answer != topic:
                sentences.append(answer + ".")
            if topic:
                label = CATEGORY_LABELS.get(category, "Na area")
                sentences.append(f"{label}, {topic} e um conceito muito importante. Ele aparece com frequencia em perguntas e vestibulares, e compreende-lo ajuda a entender melhor o mundo ao nosso redor.")
    else:
        if answer:
            sentences.append(answer + ".")
        label = CATEGORY_LABELS.get(category, "Na area")
        sentences.append(f"{label}, esse e um tema importante que merece atencao. Entender esse conceito ajuda a ampliar o conhecimento sobre o mundo e a desenvolver uma visao mais critica da realidade.")

    new_explanation = " ".join(sentences)
    if len(new_explanation) > 50:
        q["explanation"] = new_explanation
        return True
    return False

def main():
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    expanded = 0
    skipped = 0

    for q in data:
        cat = q.get("category", "")
        if cat in TARGET_CATEGORIES:
            if expand(q):
                expanded += 1
            else:
                skipped += 1

    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Explanations expanded: {expanded}")
    print(f"Skipped (already ok or too short to expand): {skipped}")
    print(f"Saved to {JSON_PATH}")
    return expanded, skipped

if __name__ == "__main__":
    main()
