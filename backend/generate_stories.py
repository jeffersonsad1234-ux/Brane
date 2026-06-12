import json, os, hashlib, random, math, re
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

BASE = Path(__file__).resolve().parent.parent
DATA_DIR = BASE / "assets" / "story-data"
IMAGES_DIR = BASE / "assets" / "story-images"

_rng = random.Random(42)
def shuffle(lst):
    l = list(lst)
    _rng.shuffle(l)
    return l

GENRE_STYLES = {
    "terror":              {"bg":(10,5,20),"fg":(180,40,40),"accent":(200,80,40),"gradient":[(5,2,15),(40,10,30)]},
    "suspense":            {"bg":(15,10,25),"fg":(60,100,180),"accent":(120,60,160),"gradient":[(10,8,30),(30,20,60)]},
    "misterio":            {"bg":(5,5,30),"fg":(100,60,180),"accent":(80,40,160),"gradient":[(8,3,25),(35,15,55)]},
    "ficcao-cientifica":   {"bg":(5,10,30),"fg":(40,180,220),"accent":(100,220,180),"gradient":[(5,10,40),(20,40,80)]},
    "educacao":            {"bg":(10,30,15),"fg":(60,180,100),"accent":(220,200,60),"gradient":[(8,25,12),(40,80,50)]},
    "fantasia":            {"bg":(25,10,40),"fg":(220,180,60),"accent":(180,60,220),"gradient":[(20,8,50),(60,30,80)]},
    "mundo-proprio":       {"bg":(20,15,10),"fg":(200,160,100),"accent":(160,100,60),"gradient":[(15,10,5),(50,35,20)]},
    "historia":            {"bg":(20,20,15),"fg":(180,160,100),"accent":(200,180,80),"gradient":[(20,18,10),(50,45,30)]},
    "ciencia":             {"bg":(5,15,25),"fg":(60,180,220),"accent":(100,220,200),"gradient":[(5,15,30),(20,40,70)]},
    "contos-infantis":     {"bg":(30,20,45),"fg":(240,200,100),"accent":(200,100,240),"gradient":[(35,15,50),(80,40,100)]},
}

GENRES = {
    "terror": {
        "titles": [
            "O Sussurro na Escuridao","A Casa Abandonada","O Manuscrito Amaldicoado",
            "A Noite do Espantalho","O Corredor Sem Fim","A Boneca de Porcelana",
            "O Poco dos Segredos","A Floresta dos Sussurros","O Espelho Antigo",
            "O Hospede do Sobrado","O Sino da Meia-Noite","A Colina dos Enforcados",
            "O Porao Esquecido","O Quarto 1408","O Bosque das Sombras",
            "A Musica do Alem","O Retrato na Parede","A Nevoeira Carmesim",
            "O Jardim das Estatuas","O Ultimo Andar",
        ],
        "chars":["Marcelo","Isabela","Dr. Moreira","Dona Celia","o investigador","a medica","o padre","a crianca"],
        "places":["sobre empoeirado","porao umido","corredor escuro","floresta densa","casa abandonada","hospital desativado","igreja antiga","cemiterio"],
        "objects":["espelho antigo","boneca de porcelana","manuscrito amarelado","sino de bronze","fotografia desbotada","caixa de musica","punhal antigo","chave enferrujada"],
        "scenes":[
            "A noite caia sobre {place} quando {char} sentiu um arrepio repentino. O vento uivava entre as frestas, carregando um som que parecia vir de muito longe ou de muito perto.",
            "{char} acendeu a lanterna mas a luz parecia engolida pela escuridao. {place} estava mais frio do que deveria. Pegadas na poeira indicavam que alguem tinha passado por ali recentemente.",
            "Um rangido veio do andar de cima. {char} prendeu a respiracao. {object} estava exatamente onde nao deveria estar. Como tinha chegado ate ali?",
            "O ar ficou denso pesado. {char} sentiu uma presenca observando de {place}. Nao estava sozinho. O {object} comecou a vibrar lentamente emitindo um som grave e hipnotico.",
            "As paredes pareciam se mover. {char} esfregou os olhos mas a ilusao persistia. {object} refletia uma imagem que nao correspondia ao ambiente uma figura encapuzada atras de si.",
            "O som de passos se aproximou. {char} se encolheu em {place} tentando controlar a respiracao. {object} caiu no chao ecoando como um grito na escuridao total.",
            "Uma voz sussurrou seu nome. {char} se virou bruscamente. {place} estava vazio mas {object} tinha mudado de posicao. O ar gelado tocava sua nuca.",
            "O relogio parou. {char} percebeu que o tempo nao passava em {place}. {object} mostrava uma cena que nunca tinha acontecido ou que ainda ia acontecer.",
        ],
        "outro":"Quando {char} finalmente escapou de {place} levou consigo apenas {object} e a certeza de que algumas portas nunca deveriam ser abertas.",
    },
    "suspense": {
        "titles":[
            "O Enigma do Relogio","A Carta Anonima","O Passageiro do Trem",
            "O Apartamento 7B","A Testemunha Silenciosa","O Arquivo Perdido",
            "A Ligacao Misteriosa","O Homem da Estacao","O Diario Secreto",
            "O Negocio das Sombras","A Pista Falsa","O Ultimo Telefonema",
            "O Encontro Marcado","O Codigo Desvendado","A Sombra do Passado",
            "O Valor da Traicao","A Mascara da Verdade","O Preco do Silencio",
            "A Noite da Revelacao","O Segredo do Museu",
        ],
        "chars":["o detetive","a jornalista","Carlos","Ana","o delegado","a advogada","o bancario","a professora"],
        "places":["escritorio vazio","estacao de trem","predio comercial","biblioteca publica","cafe da esquina","hotel decadente","sala de arquivos","galeria de arte"],
        "objects":["relogio de bolso","carta lacrada","fotografia antiga","chave numerada","dispositivo eletronico","pastas arquivadas","bilhete anonimo","mapa desbotado"],
        "scenes":[
            "{char} encontrou {object} em {place}. A descoberta parecia inocente mas algo naquela cena nao se encaixava. Cada detalhe fora cuidadosamente arranjado.",
            "As pecas comecaram a se conectar. {char} revisou as anotacoes mais uma vez. {place} guardava mais segredos do que aparentava. {object} era a chave.",
            "Alguem estava seguindo {char}. As sombras em {place} escondiam movimentos furtivos. {object} desapareceu misteriosamente confirmando suas suspeitas.",
            "O encontro foi marcado em {place}. {char} chegou cedo mas o desconhecido ja estava la. {object} foi entregue em silencio junto com um aviso.",
            "A verdade comecou a emergir. {char} decifrou o codigo escondido em {object}. {place} nao era o que parecia. Cada resposta levava a mais perguntas.",
            "O confronto era inevitavel. {char} enfrentou o suspeito em {place}. {object} foi usado como prova mas a situacao estava longe de ser resolvida.",
            "A reviravolta: {object} nao era o que {char} pensava. {place} continha a peca final do quebra-cabeca. O verdadeiro culpado estava mais perto do que imaginava.",
            "O desfecho se aproximava. {char} reuniu todas as evidencias em {place}. {object} selaria o destino de todos os envolvidos. A verdade finalmente viria a tona.",
        ],
        "outro":"{char} guardou {object} como lembranca do caso. {place} continuaria existindo mas seus segredos finalmente tinham sido revelados.",
    },
    "misterio": {
        "titles":[
            "O Caso das Joias Perdidas","O Enigma do Farol","A Heranca Maldita",
            "O Desaparecimento no Hotel","O Codigo da Biblioteca","O Segredo do Porao",
            "A Morte do Colecionador","O Ladrao Invisivel","O Testamento Secreto",
            "A Carta em Codigo","O Quadro Roubado","O Labirinto das Pistas",
            "O Crime Perfeito","A Testemunha Oculta","O Alibi Impossivel",
            "O Enigma das 12 Horas","O Ultimo Suspeito","O Segredo da Familia",
            "A Pista do Passado","O Mistério do Elevador",
        ],
        "chars":["o investigador","a detetive","Lucas","Maria","o comissario","a perita","o advogado","a jornalista"],
        "places":["mansion antiga","delegacia","biblioteca","sala de interrogatorio","hotel abandonado","museu","escritorio particular","casa de campo"],
        "objects":["lupa de aumento","caderno de anotacoes","chave mestra","fita de seguranca","relatorio policial","mapa da cidade","gravacao misteriosa","documento lacrado"],
        "scenes":[
            "O caso comecou quando {object} foi descoberto em {place}. {char} foi chamado para investigar. Nada era o que parecia naquele cenario aparentemente comum.",
            "{char} examinou {place} em busca de pistas. {object} forneceu a primeira pista real. Mas ela levava a mais perguntas do que respostas.",
            "O suspeito principal tinha um alibi solido. {char} verificou cada detalhe em {place}. {object} contradizia o depoimento de todos os envolvidos.",
            "Uma reviravolta inesperada: {char} descobriu que {object} tinha sido plantado. {place} nao era a cena do crime original. O verdadeiro crime acontecera em outro lugar.",
            "As pecas comecaram a se encaixar. {char} conectou {object} com um caso antigo em {place}. A solucao estava escondida em um detalhe que todos ignoraram.",
            "O confronto final: {char} reuniu todos os suspeitos em {place}. {object} foi revelado como a prova definitiva. O culpado nao tinha para onde fugir.",
            "A confissao trouxe alivio mas tambem tristeza. {char} fechou {object} sabendo que a justica tinha sido feita. {place} guardaria para sempre a memoria daquele caso.",
            "O caso foi arquivado. {char} guardou {object} como recordacao. {place} voltou a rotina mas algo tinha mudado para sempre naquela comunidade.",
        ],
        "outro":"{char} resolveu mais um caso. {object} foi devolvido ao seu lugar. {place} podia respirar aliviado. Mas o proximo misterio ja esperava.",
    },
    "ficcao-cientifica": {
        "titles":[
            "O Ultimo Sinal","Base Marte: Silencio","O Paradoxo Quantico",
            "A Nave Espacial Omega","O Codigo Alienigena","A Fronteira do Desconhecido",
            "O Acelerador de Particulas","A Colonizacao em Titan","O Experimento Cronos",
            "O Encontro no Hiperespaco","O Segredo da Materia Escura","A Estacao Orbital",
            "O Viajante Dimensional","O Sinal de Proxima Centauri","O Despertar da IA",
            "O Ultimo Protocolo","A Geracao Estelar","O Enigma dos Buracos de Minhoca",
            "O Planeta Espelho","A Consciencia Sintetica",
        ],
        "chars":["comandante","doutora","engenheiro","piloto","cientista-chefe","oficial de comunicacoes","biologa espacial","tecnico de sistemas"],
        "places":["nave interestelar","estacao espacial","base lunar","laboratorio quantico","colonia marciana","capsula de criogenia","sala de comando","modulo de pesquisa"],
        "objects":["dispositivo alienigena","cristal energetico","cubo de dados","traje avancado","scanner neural","computador quantico","sinal misterioso","amostra biologico"],
        "scenes":[
            "O alerta vermelho acendeu em {place}. {char} correu para o painel de controle. {object} emitia um pulso ritmico que nao correspondia a nenhuma frequencia conhecida.",
            "As leituras eram impossiveis. {char} verificou os sensores tres vezes. {place} estava sofrendo distorcoes espacio-temporais. {object} era a fonte.",
            "A descoberta: {object} nao era uma tecnologia convencional. {char} teorizou que {place} tinha sido construido por uma inteligencia alem da compreensao humana.",
            "{char} propos um plano arriscado. Se funcionasse {place} poderia ser salva. {object} precisava ser ativado mesmo que as consequencias fossem imprevisiveis.",
            "O experimento comecou. {char} monitorava cada parametro em {place}. {object} vibrava em uma frequencia que parecia ressoar com o proprio tecido do espaco.",
            "Uma fenda se abriu. {char} observou {place} se distorcer ao redor de {object}. Atraves da abertura vislumbrou um universo completamente diferente do seu.",
            "O contato foi estabelecido. {char} comunicou-se com a inteligencia por tras de {object}. {place} tornou-se um ponto de encontro entre civilizacoes.",
            "O legado: {char} documentou tudo sobre {object} e {place}. A humanidade nunca mais seria a mesma. Uma nova era de exploracao interestelar comecava.",
        ],
        "outro":"{char} guardou {object} como o maior tesouro da humanidade. {place} se tornou um monumento ao primeiro contato. O universo finalmente tinha voz.",
    },
    "educacao": {
        "titles":[
            "A Descoberta do Fogo","O Segredo das Piramides","A Invencao da Escrita",
            "O Genio da Lampada","A Viagem de Darwin","O Codigo da Natureza",
            "O Teorema Esquecido","A Biblioteca de Alexandria","O Mapa do Conhecimento",
            "A Maquina de Turing","O Segredo das Celulas","A Equacao Perfeita",
            "O Museu das Maravilhas","A Orbita do Conhecimento","O DNA da Vida",
            "O Experimento da Luz","A Formula da Agua","O Relogio do Universo",
            "A Ponte dos Saberes","O Legado de Newton",
        ],
        "chars":["professor","aluna","pesquisador","doutoranda","mestre","aprendiz","cientista","estudante"],
        "places":["laboratorio","biblioteca","sala de aula","museu","observatorio","universidade","centro de pesquisa","jardim botanico"],
        "objects":["livro antigo","microscopio","telescopio","quadro-negro","instrumento cientifico","amostra geologica","modelo atomico","carta astronomica"],
        "scenes":[
            "{char} chegou em {place} com uma pergunta que ninguem tinha respondido ainda. {object} estava no centro do misterio esperando por alguem com coragem de explora-lo.",
            "A primeira pista estava em {object}. {char} passou horas em {place} estudando cada detalhe. O conhecimento antigo guardava segredos que a ciencia moderna ignorava.",
            "O experimento: {char} preparou {object} cuidadosamente. {place} se encheu de equipamentos e expectativa. Se a teoria estivesse correta tudo mudaria.",
            "Os resultados eram surpreendentes. {char} mal acreditava no que {object} revelava. {place} se tornou o centro de uma descoberta que reescreveria os livros.",
            "Mas o conhecimento nunca vem facil. {char} enfrentou {place} com novas duvidas. {object} mostrava um padrao que desafiava as explicacoes tradicionais.",
            "A colaboracao: {char} convidou outros estudiosos para {place}. Juntos decifraram {object}. O saber compartilhado era mais poderoso que qualquer descoberta individual.",
            "A aplicacao pratica: o que {object} revelou poderia mudar vidas. {char} liderou o projeto em {place} para transformar teoria em beneficio real para a sociedade.",
            "O legado: {char} registrou tudo em {object} deixando {place} como um centro de aprendizado para futuras geracoes. O conhecimento nunca morre ele se transforma.",
        ],
        "outro":"{char} olhou para {object} com orgulho. {place} continuaria inspirando mentes curiosas. A maior descoberta foi que aprender e uma jornada sem fim.",
    },
    "fantasia": {
        "titles":[
            "O Reino das Sombras","A Espada do Destino","O Jardim dos Sonhos",
            "A Fonte da Juventude","O Portal Magico","A Coroa Perdida",
            "O Dragao Adormecido","O Calice de Luz","A Floresta Encantada",
            "O Amuleto do Tempo","O Ultimo Mago","Os Guardioes do Cristal",
            "A Torre do Vento","O Bosque das Fadas","A Armadura do Heroi",
            "A Profecia Esquecida","O Reino Submerso","O Olho do Universo",
            "O Templo Solar","A Cancao das Estrelas",
        ],
        "chars":["o cavaleiro","a maga","Elara","Kael","o druida","a rainha","Lyra","o guardiao"],
        "places":["castelo antigo","floresta encantada","montanha sagrada","reino submerso","biblioteca magica","torre de cristal","caverna dos ecos","planicie dos ventos"],
        "objects":["amuleto mystico","espada lendaria","cristal magico","mapa astral","calice dourado","grimorio antigo","chave prateada","coroa elfica"],
        "scenes":[
            "O destino chamou {char} para {place}. {object} pulsava com uma luz suave como se reconhecesse sua chegada. Uma jornada epica estava prestes a comecar.",
            "Os primeiros passos em {place} revelaram maravilhas e perigos. {char} segurou {object} firmemente sentindo seu poder ancestral percorrer o corpo.",
            "O guardiao de {place} surgiu das sombras. {char} precisou provar seu valor. {object} brilhou intensamente respondendo a coragem de seu portador.",
            "O enigma: {place} escondia um segredo que apenas {object} podia desvendar. {char} decifrou as runas antigas revelando um conhecimento perdido ha milenios.",
            "A batalha se aproximava. {char} treinou incansavelmente em {place} dominando {object}. As forcas das trevas se reuniam nas fronteiras do reino.",
            "O confronto final ecoou por {place}. {char} ergueu {object} contra a escuridao. A luz e a sombra colidiram em uma explosao de energia pura.",
            "Com a paz restaurada {char} contemplou {place} de um novo angulo. {object} agora repousava mas seu poder continuaria protegendo o reino.",
            "{char} se despediu de {place} com a promessa de voltar. {object} foi guardado mas sua historia seria contada por geracoes. O reino estava salvo.",
        ],
        "outro":"{char} cavalgou para o por do sol com {object} guardado no coracao. {place} seria sempre um lar. As lendas nunca morrem elas esperam.",
    },
    "mundo-proprio": {
        "titles":[
            "O Mundo de Vidro","A Cidade Flutuante","O Imperio das Nuvens",
            "A Ultima Floresta","O Mar de Estrelas","O Deserto dos Ecos",
            "A Montanha de Cristal","O Vale dos Sussurros","A Capital Subterrânea",
            "O Arquipelago Perdido","A Fortaleza do Gelo","O Abismo Luminoso",
            "As Torres de Prata","O Reino dos Ventos","O Santuario das Aguas",
            "A Arena de Luz","O Templo do Silencio","O Grande Mercado Flutuante",
            "A Biblioteca Viva","O Farol das Almas",
        ],
        "chars":["o explorador","a arquivista","Kiran","Sola","o cartografo","a navegadora","Orion","a visionaria"],
        "places":["ruinas ancestrais","cidade flutuante","mercado subterrâneo","floresta de cristais","oceano de nuvens","caverna bioluminescente","templo suspenso","jardins verticais"],
        "objects":["mapa estelar","bussola magica","chave dimensional","cristal de memoria","instrumento musical antigo","pergaminho selado","ampulheta cosmica","selo real"],
        "scenes":[
            "{char} pisou em {place} pela primeira vez. O cenario era tao surreal que parecia um sonho. {object} foi a razao da viagem mas a jornada era o verdadeiro tesouro.",
            "Os habitantes de {place} observavam {char} com curiosidade. {object} despertava um interesse que ia alem do comercial. Algo maior estava em jogo.",
            "O mapa estava incompleto. {char} precisou decifrar {object} para navegar por {place}. Cada passo revelava mais camadas de um mundo extraordinariamente complexo.",
            "A crise: {place} estava ameacado por uma forca que ninguem compreendia totalmente. {char} consultou os anciaos que apontaram para {object} como a solucao.",
            "A alianca foi formada. {char} uniu os povos de {place} em torno de {object}. A diversidade era a maior forca daquele mundo extraordinario.",
            "O segredo de {object} foi finalmente revelado. {char} descobriu que {place} era apenas uma pequena parte de algo muito maior. O universo era mais conectado do que imaginavam.",
            "A celebracao: {place} se encheu de luz e musica. {char} foi honrado como heroi. {object} se tornou um simbolo de uniao entre os povos.",
            "A despedida: {char} prometeu voltar para {place}. {object} serviria como ponte entre mundos. A aventura nunca termina ela se transforma em memoria.",
        ],
        "outro":"{char} navegou para o horizonte com {object} como guia. {place} desapareceu na distancia mas sua essencia permaneceria viva. Toda jornada e um recomeco.",
    },
    "historia": {
        "titles":[
            "O Grito do Ipiranga","A Chegada da Familia Real","A Princesa Redentora",
            "A Revolucao dos Escravos","O Ouro de Minas Gerais","A Guerra dos Farrapos",
            "A Seca no Sertao","A Construcao de Brasilia","A Batalha do Riachuelo",
            "A Rebeliao dos Males","A Marcha da Coluna","O Movimento das Diretas Ja",
            "A Imigracao Italiana","A Revolta da Armada","A Frente de Trabalhadores",
            "A Semana de Arte Moderna","A Expedicao Cientifica","O Processo de Industrializacao",
            "A Luta pelo Voto Feminino","A Bicicleta da Liberdade",
        ],
        "chars":["o viajante do tempo","a historiadora","Dom Pedro","Princesa Isabel","o abolicionista","a lider comunitaria","o imigrante","a professora"],
        "places":["praca historica","palacio imperial","porto antigo","fazenda colonial","vila operaria","sertao nordestino","cidade planejada","estacao ferroviaria"],
        "objects":["carta historica","fotografia antiga","mapa imperial","diario pessoal","bandeira da epoca","moeda antiga","instrumento colonial","documento oficial"],
        "scenes":[
            "O ano era {periodo}. {char} testemunhava um momento que mudaria o curso da historia. {object} estava prestes a desempenhar um papel crucial em {place}.",
            "A tensao crescia em {place}. {char} observava {object} com atencao sabendo que cada detalhe importava. As decisoes tomadas ali ecoariam por geracoes.",
            "O conflito de ideias era palpavel. {char} mediou as discussoes em {place}. {object} representava mais que um simples artefato era o simbolo de uma era.",
            "O marco historico: {char} participou do momento em que {object} foi utilizado em {place}. O que antes era sonho comecava a se tornar realidade.",
            "Os desafios surgiam a cada esquina. {char} lutou contra as adversidades em {place}. {object} era a lembranca de que a perseveranca sempre vence.",
            "A transformacao aconteceu. {place} nunca mais seria o mesmo depois daquele dia. {char} guardou {object} como reliquia de um tempo de mudancas.",
            "O legado comecou a ser construido. {char} ajudou a documentar o que aconteceu em {place}. {object} se tornou peca de museu testemunha silenciosa da historia.",
            "Os frutos do passado. {char} contemplou {place} transformado. {object} estava agora em exposicao contando a novas geracoes a historia de coragem e determinacao.",
        ],
        "outro":"{char} fechou {object} com cuidado. {place} continuava vivo na memoria do povo. A historia nao e o passado e a semente do futuro.",
        "vars":{"periodo":["1822","1888","1922","1930","1945","1964","1988"]},
    },
    "ciencia": {
        "titles":[
            "O Segredo das Estrelas","A Molecula da Vida","O Universo Invisivel",
            "A Forca da Gravidade","O Enigma Quantico","A Maquina do Tempo",
            "O Codigo Genetico","O Misterio do Cerebro","A Particula de Deus",
            "A Quimica das Emocoes","O Mundo Subatomico","A Teoria do Tudo",
            "O Pulo do Gato Quantico","A Energia Escura","O Fio da Vida",
            "A Fisica dos Milagres","O Planeta Azul","A Sinfonia dos Genes",
            "O Olho que Tudo Ve","O Ultimo Elemento",
        ],
        "chars":["a fisica","o biologo","Dra. Mendes","Dr. Nakamura","a quimica","o astronomo","a neurocientista","o matematico"],
        "places":["laboratorio de particulas","observatorio astronomico","centro de genomica","instituto de neurociencia","acelerador de particulas","estacao de pesquisa","laboratorio de quimica","centro de computacao"],
        "objects":["microscopio eletronico","espectrometro","sequenciador de DNA","telescopio espacial","supercomputador","acelerador linear","laser de precisao","detector de particulas"],
        "scenes":[
            "{char} ajustou {object} pela ultima vez. {place} estava silencioso cheio de expectativa. Se a teoria estivesse correta o experimento mudaria tudo que se sabia sobre o universo.",
            "Os dados comecaram a chegar. {char} analisou cada ponto em {place}. {object} registrava algo que desafiava as leis conhecidas da fisica. Uma nova fronteira se abria.",
            "O padrao era inconfundivel. {char} verificou os resultados multiplas vezes em {place}. {object} havia detectado o que cientistas procuravam ha decadas. A descoberta era monumental.",
            "A comunidade cientifica foi notificada. {char} apresentou as evidencias em {place}. {object} provava que o modelo teorico estava correto mas tambem revelava novas perguntas.",
            "A controversia: nem todos aceitavam os resultados. {char} defendeu seu trabalho em {place} usando {object} para demonstrar a reprodutibilidade do experimento.",
            "A confirmacao chegou de outros laboratorios. {char} recebeu os parabens em {place}. {object} seria reconhecido como um dos instrumentos mais importantes da decada.",
            "A aplicacao pratica: como a descoberta poderia beneficiar a sociedade? {char} liderou as discussoes em {place} explorando as possibilidades que {object} abria.",
            "O impacto: {char} escreveu o estudo final em {place}. {object} mudaria o ensino de ciencias por geracoes. A ciencia nao e respostas e melhores perguntas.",
        ],
        "outro":"{char} desligou {object} ao final do expediente. {place} continuaria sua missao de desvendar o universo. A ciencia caminha devagar mas nao para nunca.",
    },
    "contos-infantis": {
        "titles":[
            "A Estrela que Queria Brilhar","O Coelho que Perdeu a Orelha","A Fada das Cores",
            "O Dragao que Tinha Medo de Fogo","A Sementinha Viajante","O Gato que Falava com a Lua",
            "A Princesa que Nao Queria Beijar","O Pirata que Perdeu o Mapa","A Arvore Magica",
            "O Ursinho que Aprendeu a Compartilhar","A Nuvem Tristonha","O Peixe que Queria Voar",
            "O Castelo de Areia","O Passaro sem Asas","A Borboleta Colorida",
            "O Monstro que Era Gentil","A Lua e o Sol","O Treno do Papai Noel",
            "A Galinha que Queria Ser Aguia","O Brinquedo Esquecido",
        ],
        "chars":["Luna","Pipoca","o pequeno dragao","a fada","Bento","Lili","o ursinho","a estrelinha"],
        "places":["floresta encantada","castelo colorido","fundo do mar","ceu estrelado","jardim secreto","nuvem macia","montanha do arco-iris","vila dos brinquedos"],
        "objects":["varinha magica","chapeu colorido","sapatinho brilhante","caixa de musica","globo de luz","pincel magico","ampulheta de sonhos","cesta de doces"],
        "scenes":[
            "Era uma vez em {place} vivia {char}. {object} era seu bem mais precioso mas algo estava diferente hoje. Uma aventura magica estava prestes a comecar.",
            "{char} acordou com um problema: {object} nao funcionava mais. Em {place} todos se reuniram para ajudar. Cada amigo ofereceu uma solucao diferente.",
            "O caminho era cheio de surpresas. {char} encontrou {place} de um jeito que nunca tinha visto. {object} brilhava fracamente como se esperasse por algo especial.",
            "Um novo amigo apareceu. Em {place} {char} conheceu alguem que precisava de ajuda. {object} poderia ser a chave para resolver o problema do novo amigo.",
            "A licao: {char} aprendeu que {place} era mais especial por seus habitantes do que por suas belezas. {object} nao era magico a magica estava no coracao de cada um.",
            "O desafio parecia grande demais mas {char} nao desistiu. Em {place} todos trabalharam juntos. {object} finalmente comecou a funcionar iluminando o ambiente.",
            "A comemoracao foi em {place}. {char} dancou com todos os amigos. {object} agora brilhava mais forte do que nunca alimentado pela alegria da amizade.",
            "{char} se despediu de {place} com um abraco coletivo. {object} estava guardado no coracao nao nas maos. E viveram felizes para sempre.",
        ],
        "outro":"E assim {char} aprendeu em {place} que a maior magica esta dentro de nos. {object} era apenas um lembrete disso. Fim.",
    },
}

def make_story_id(title):
    sid = title.lower().replace(" ","-").replace("?","").replace("!","").replace(":","").replace(";","").replace(".","")
    sid = re.sub(r"[^a-z0-9-]","",sid)
    return sid[:50].strip("-")

def generate_stories():
    DATA_DIR.mkdir(parents=True,exist_ok=True)
    category_list = []
    for cat_id,genre in GENRES.items():
        cat_dir = DATA_DIR / cat_id
        cat_dir.mkdir(parents=True,exist_ok=True)
        titles = shuffle(genre["titles"])
        story_count = min(len(titles), 20)
        category_list.append({"id":cat_id,"name":cat_id.replace("-"," ").title(),"storyCount":story_count})
        for idx in range(story_count):
            title = titles[idx]
            sid = make_story_id(title)
            scene_texts = genre["scenes"]
            chars = shuffle(genre["chars"])
            places = shuffle(genre["places"])
            objects = shuffle(genre["objects"])
            char = chars[idx % len(chars)]
            place = places[idx % len(places)]
            obj = objects[idx % len(objects)]
            vd = {}
            if "vars" in genre:
                for vn,vv in genre["vars"].items():
                    vd[vn] = shuffle(vv)[idx % len(vv)]
            scenes = []
            for si in range(8):
                raw = scene_texts[si % len(scene_texts)].format(char=char,place=place,object=obj,**vd)
                raw = raw[0].upper()+raw[1:]
                dur = _rng.randint(25,45)
                if si==0: dur = _rng.randint(30,45)
                elif si>=6: dur = _rng.randint(20,35)
                music = {"terror":"sombrio","suspense":"tenso","misterio":"tenso","ficcao-cientifica":"espacial",
                         "educacao":"calmo","fantasia":"epico","mundo-proprio":"exploracao",
                         "historia":"classico","ciencia":"futurista","contos-infantis":"alegre"}.get(cat_id,"calmo")
                scenes.append({
                    "id":si+1,"narration":raw,"imagePrompt":f"{title}, cena {si+1}: {raw[:120]}",
                    "durationSec":dur,"musicSuggestion":music,"transition":"crossfade" if si==0 else "fade",
                })
            outro = genre["outro"].format(char=char,place=place,object=obj,**vd)
            total_dur = sum(s["durationSec"] for s in scenes)
            story_data = {
                "id":sid,"title":title,"category":cat_id,"sceneCount":len(scenes),
                "totalDurationSec":total_dur,"outro":outro,
                "promptsForImageGen":{"description":f"Cenas realistas para: {title}","style":"fotografico realista, iluminacao cinematografica"},
                "scenes":scenes,
            }
            (cat_dir / f"{sid}.json").write_text(json.dumps(story_data,ensure_ascii=False,indent=2),encoding="utf-8")
            print(f"  [{cat_id}] {title} ({len(scenes)} scenes, {total_dur}s)")
    (DATA_DIR / "categories.json").write_text(json.dumps(category_list,ensure_ascii=False,indent=2),encoding="utf-8")
    total = sum(c["storyCount"] for c in category_list)
    print(f"\nOK {total} stories in {len(category_list)} categories")
    return category_list

def generate_placeholders(categories):
    try:
        fl = ImageFont.truetype("arial.ttf",48)
        fm = ImageFont.truetype("arial.ttf",32)
        fs = ImageFont.truetype("arial.ttf",24)
    except:
        fl = fm = fs = ImageFont.load_default()
    total = 0
    for cat in categories:
        style = GENRE_STYLES[cat["id"]]
        cat_dir = DATA_DIR / cat["id"]
        for sf in sorted(cat_dir.glob("*.json")):
            story = json.loads(sf.read_text(encoding="utf-8"))
            img_dir = IMAGES_DIR / cat["id"] / story["id"]
            img_dir.mkdir(parents=True,exist_ok=True)
            for scene in story["scenes"]:
                sid = scene["id"]
                ip = img_dir / f"scene-{sid}.jpg"
                if ip.exists(): continue
                w,h = 1024,768
                img = Image.new("RGB",(w,h),style["bg"])
                draw = ImageDraw.Draw(img)
                for y in range(h):
                    r = int(style["gradient"][0][0]*(1-y/h)+style["gradient"][1][0]*(y/h))
                    g = int(style["gradient"][0][1]*(1-y/h)+style["gradient"][1][1]*(y/h))
                    b = int(style["gradient"][0][2]*(1-y/h)+style["gradient"][1][2]*(y/h))
                    draw.line([(0,y),(w,y)],fill=(r,g,b))
                for _ in range(3):
                    cx,cy,ra = _rng.randint(100,w-100),_rng.randint(100,h-100),_rng.randint(50,200)
                    draw.ellipse([cx-ra,cy-ra,cx+ra,cy+ra],outline=(*style["accent"],0),width=2)
                draw.text((w//2,h//2-60),story["title"],fill=(255,255,255,220),font=fl,anchor="mm",align="center")
                draw.text((w//2,h//2+50),f"Cena {sid}",fill=(*style["fg"],200),font=fm,anchor="mm",align="center")
                prompt = scene["imagePrompt"][:100]
                draw.text((w//2,h-80),prompt,fill=(200,200,200,120),font=fs,anchor="mm",align="center",stroke_width=1,stroke_fill=(0,0,0,80))
                draw.text((20,20),cat["id"].upper(),fill=(*style["accent"],150),font=fs,anchor="lt")
                img.save(str(ip),"JPEG",quality=75)
                total += 1
    print(f"OK {total} placeholder images generated")

if __name__=="__main__":
    print("Generating story data...\n")
    cats = generate_stories()
    print("\nGenerating placeholder images...")
    generate_placeholders(cats)
    print("\nDone!")
