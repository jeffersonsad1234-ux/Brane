"""
BRANPY AI — Gerador de Dados de Treino 100% Próprio
Todos os direitos reservados — branpy.com.br

Estratégia: Criar dados de treino escritos por humanos (nós mesmos),
sem usar NENHUM modelo de terceiros para geração.

Isso garante que o modelo treinado seja 100% propriedade da BranPy,
sem nenhuma obrigação de licença de terceiros.
"""

import os
import json
import random

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ==========================================
# DADOS ESCRITOS 100% POR HUMANOS
# Cada par é criado por nós, não por IA
# ==========================================

CORPUS_COMPLETO = {
    # ========================================
    # CONHECIMENTO GERAL (ciência, história)
    # ========================================
    "conhecimento_geral": [
        ("O que é gravidade?", "A gravidade é a força de atração entre dois corpos com massa. Quanto maior a massa, maior a força gravitacional. Ela mantém os planetas em órbita ao redor do Sol e nos mantém firmes no chão."),
        ("Como funciona o sol?", "O Sol é uma estrela que gera energia através de fusão nuclear. No núcleo, hidrogênio se funde em hélio, liberando uma quantidade enorme de energia na forma de luz e calor."),
        ("O que é DNA?", "O DNA (ácido desoxirribonucleico) é a molécula que carrega as informações genéticas de todos os seres vivos. Ele é formado por duas fitas enroladas em hélice dupla, compostas por nucleotídeos."),
        ("Por que o céu é azul?", "O céu é azul porque a luz solar se espalha pela atmosfera terrestre. As ondas de luz azul são mais espalhadas pelas moléculas do ar do que as outras cores, fazendo com que vejamos o céu como azul."),
        ("O que é energia nuclear?", "A energia nuclear é obtida a partir de reações de fissão (divisão de átomos pesados como urânio) ou fusão (união de átomos leves como hidrogênio). A fissão é usada em usinas nucleares."),
        ("Como funciona o corpo humano?", "O corpo humano é composto por trilhões de células organizadas em tecidos, órgãos e sistemas. O sistema circulatório transporta sangue, o respiratório troca gases, o digestivo processa alimentos e o nervoso controla tudo."),
        ("O que é buraco negro?", "Um buraco negro é uma região do espaço onde a gravidade é tão forte que nada, nem mesmo a luz, pode escapar. Ele se forma quando uma estrela massiva colapsa sobre si mesma."),
        ("Como funcionam as vacinas?", "As vacinas ensinam o sistema imunológico a reconhecer e combater patógenos específicos. Elas introduzem uma versão enfraquecida ou inativa do micróbio, estimulando a produção de anticorpos sem causar a doença."),
        ("O que é mudança climática?", "A mudança climática refere-se às alterações de longo prazo nas temperaturas e nos padrões climáticos da Terra. A atividade humana, especialmente a queima de combustíveis fósseis, é a principal causa do aquecimento global atual."),
        ("Como se formam as estrelas?", "As estrelas se formam a partir de nuvens de gás e poeira chamadas nebulosas. Quando a gravidade faz o material colapsar, o núcleo aquece até que a fusão nuclear comece, criando uma estrela."),
        ("O que é matéria escura?", "A matéria escura é uma forma hipotética de matéria que não emite nem reflete luz, mas interage gravitacionalmente. Ela representa cerca de 27% do universo, embora não possa ser observada diretamente."),
        ("Como funciona ainternet?", "A internet é uma rede mundial de computadores interconectados. Ela usa protocolos TCP/IP para transmitir dados, e o sistema DNS traduz nomes de domínio em endereços IP para localizar servidores."),
        ("O que é inteligência artificial?", "A inteligência artificial é um campo da computação que cria sistemas capazes de realizar tarefas que normalmente exigiriam inteligência humana, como reconhecimento de fala, tradução e tomada de decisões."),
        ("Como funciona um computador?", "Um computador processa dados usando um processador (CPU) que executa instruções. A memória RAM armazena dados temporariamente, o disco rígido guarda dados permanentemente, e a placa-mãe conecta todos os componentes."),
        ("O que é internet das coisas?", "A internet das coisas (IoT) é a rede de objetos físicos do cotidiano que possuem sensores, software e conectividade, permitindo que troquem dados entre si e com sistemas centrais."),
        ("Como funciona a luz?", "A luz é uma forma de radiação eletromagnética que se propaga em ondas. Ela viaja em linha reta, pode ser refletida, refratada e dispersada. A velocidade da luz no vácuo é de aproximadamente 300.000 km/s."),
        ("O que é átomo?", "O átomo é a unidade básica da matéria. Ele é composto por um núcleo de prótons e nêutrons, rodeado por elétrons em órbita. Os diferentes elementos químicos diferem pelo número de prótons no núcleo."),
        ("Como funciona a água?", "A água (H2O) é formada por dois átomos de hidrogênio e um de oxigênio. Ela pode existir em três estados: sólido (gelo), líquido (água) e gasoso (vapor). A água é essencial para a vida."),
        ("O que é energia renovável?", "A energia renovável é aquela obtida a partir de fontes naturais que se renovam continuamente, como solar, eólica (vento), hidrelétrica, geotérmica e biomassa. Ela é mais sustentável que os combustíveis fósseis."),
        ("Como funciona a digestão?", "A digestão começa na boca, onde a mastigação e a saliva quebram os alimentos. O estômago secreta ácidos e enzimas, e no intestino delgado os nutrientes são absorvidos pelo sangue. O intestino grosso absorve água."),
        ("O que é planeta?", "Um planeta é um corpo celeste que orbita uma estrela, tem massa suficiente para ter forma esférica por causa da própria gravidade, e limpou a sua órbita de outros corpos. Nosso sistema solar tem 8 planetas."),
        ("Como funciona o coração?", "O coração é um músculo que bombeia sangue pelo corpo. Ele possui quatro câmaras: dois átrios que recebem sangue e dois ventrículos que o enviam. O sangue oxigenado vai para o corpo, e o desoxigenado volta para os pulmões."),
        ("O que é sistema solar?", "O sistema solar é formado pelo Sol e todos os corpos celestes que orbitam ele: 8 planetas, seus satélites, planetas anões, asteroides e cometas. Ele se formou há cerca de 4,6 bilhões de anos."),
        ("Como funciona o cérebro?", "O cérebro é o centro de controle do corpo, com cerca de 86 bilhões de neurônios. Ele processa informações, controla movimentos, armazena memórias e gerencia emoções através de conexões elétricas e químicas."),
        ("O que é oceano?", "Os oceanos cobrem cerca de 71% da superfície da Terra e contêm 97% de toda a água do planeta. Eles são fundamentais para o clima, a biodiversidade e a vida, produzindo oxigênio e absorvendo dióxido de carbono."),
        ("Como funciona o ouvido?", "O ouvido divide-se em ouvido externo (orelha), médio (tímpano e ossículos) e interno (cóclea). As ondas sonoras fazem vibrar o tímpano, que transmite a vibração até o nervo auditivo, que leva o som ao cérebro."),
        ("O que é fotossíntese?", "A fotossíntese é o processo pelo qual plantas, algas e algumas bactérias convertem luz solar em energia química. Elas usam dióxido de carbono e água para produzir glicose e oxigênio."),
        ("Como funciona a memória?", "A memória é o processo de armazenar e recuperar informações. A memória de curto prazo mantém informações por poucos segundos, enquanto a memória de longo prazo as armazena por anos, sendo reforçada pela repetição."),
        ("O que é magnetismo?", "O magnetismo é uma força física produzida pelo movimento de cargas elétricas. Imanentos têm campos magnéticos que podem atrair ou repelir materiais ferromagnéticos como ferro e aço."),
        ("Como funciona a respiração?", "Na respiração, o oxigênio do ar entra pelos pulmões e passa para o sangue, que o transporta para as células. As células usam oxigênio para quebrar nutrientes e produzir energia, liberando dióxido de carbono como resíduo."),
        ("O que é vulcão?", "Um vulcão é uma abertura na crosta terrestre por onde material derretido (magma) e gases são expulsos. Os vulcões podem ser ativos, dormientes ou extintos, e sua atividade depende do movimento das placas tectônicas."),
        ("Como funciona a visão?", "A visão começa quando a luz entra pelo olho e atinge a retina, que contém células chamadas bastonetes e cones. A retina converte a luz em sinais elétricos que são enviados pelo nervo óptico ao cérebro, que interpreta as imagens."),
        ("O que é ácido?", "Um ácido é uma substância química que libera íons de hidrogênio (H+) quando dissolvida em água. Ácidos têm pH menor que 7, são corrosivos e podem causar queimaduras. Exemplos: ácido clorídrico (estômago), ácido cítrico (limão)."),
        ("Como funciona o clima?", "O clima é o padrão de temperatura, precipitação e outros fatores atmosféricos de uma região ao longo do tempo. Ele é influenciado pela latitude, altitude, proximidade do mar e correntes oceânicas."),
        ("O que é energia elétrica?", "A energia elétrica é o fluxo de cargas elétricas (elétrons) através de um condutor. Ela é gerada em usinas que convertem outras formas de energia (mecânica, nuclear, solar) em energia elétrica, que é transportada pela rede de distribuição."),
        ("Como funciona o estômago?", "O estômago é um órgão muscular que mistura e digesta os alimentos com sucos gástricos contendo ácido clorídrico e enzimas. Ele transforma a comida em quimo, que vai para o intestino delgado para continuar a digestão."),
        ("O que é planeta anão?", "Um planeta anão é um corpo celeste que orbita o Sol, tem forma esférica, mas não limpou sua órbita de outros corpos. Exemplos: Plutão, Ceres, Eris, Haumea e Makemake."),
        ("Como funciona o pulmão?", "O pulmão é o órgão responsável pela troca gasosa. Ao inspirar, o ar entra e alcança os alvéolos pulmonares, onde o oxigênio passa para o sangue e o dióxido de carbono sai. O corpo expira o CO2."),
        ("O que é energia?", "A energia é a capacidade de realizar trabalho. Ela se apresenta em diversas formas: cinética (movimento), potencial (posição), térmica (calor), elétrica, química, nuclear e luminosa. A energia não é criada nem destruída, apenas transformada."),
        ("Como funciona o fígado?", "O fígado é o maior órgão interno do corpo. Ele filtra o sangue, produz bile para digirir gorduras, armazena glicose, metaboliza medicamentos e toxinas, e sintetiza proteínas importantes para a coagulação."),
        ("O que é ozônio?", "O ozônio (O3) é uma molécula de oxigênio composta por três átomos. Na estratosfera, ele forma a camada de ozônio que protege a Terra dos raios ultravioleta. Na superfície, é um poluente atmosférico."),
        ("Como funciona o rim?", "O rim filtra o sangue para remover resíduos e excesso de líquido, formando a urina. Ele também regula o equilíbrio de sais minerais, a pressão arterial e produz hormônios como a eritropoietina."),
        ("O que é velocidade?", "A velocidade é a taxa de variação da posição de um corpo em relação ao tempo. Ela é uma grandeza vetorial, ou seja, tem magnitude (módulo) e direção. A unidade no SI é metros por segundo (m/s)."),
        ("Como funciona o pâncreas?", "O pâncreas produz enzimas digestivas que são enviadas ao intestino delgado para quebrar proteínas, gorduras e carboidratos. Ele também produz insulina e glucagon, que regulam o nível de açúcar no sangue."),
        ("O que é química?", "A química é a ciência que estuda a composição, estrutura, propriedades e transformações da matéria. Ela investiga como os átomos se combinam para formar moléculas e como essas reagem entre si."),
        ("Como funciona o intestino?", "O intestino delgado absorve nutrientes dos alimentos digeridos. O intestino grosso absorve água e forma as fezes. O intestino também abriga bilhões de bactérias que ajudam na digestão e na imunidade."),
        ("O que é física?", "A física é a ciência que estuda a natureza em seus aspectos mais fundamentais: matéria, energia, movimento, força, tempo e espaço. Ela busca compreender as leis que governam o universo."),
        ("Como funciona um motor?", "Um motor converte energia em movimento. O motor de combustão interna queima combustível para gerar gases que empurram os pistões, que transmitem o movimento para as rodas através da transmissão."),
        ("O que é biologia?", "A biologia é a ciência que estuda os seres vivos: sua estrutura, função, crescimento, evolução, distribuição e classificação. Ela abrange desde micróbios até ecossistemas complexos."),
        ("Como funciona a terra?", "A Terra é composta por crosta, manto e núcleo. As placas tectônicas da crosta se movem lentamente sobre o manto, causando terremotos e vulcões. O campo magnético é gerado pelo núcleo externo líquido."),
        ("O que é temperatura?", "A temperatura é uma grandeza que mede o grau de agitação térmica das moléculas de um corpo. Quanto mais agitadas as moléculas, maior a temperatura. As escalas principais são Celsius, Fahrenheit e Kelvin."),
        ("Como funciona a pele?", "A pele é o maior órgão do corpo. Ela protege contra infecções, regula a temperatura, sente tato, dor e calor, e produz vitamina D. É composta por epiderme, derme e hipoderme."),
        ("O que é som?", "O som é uma vibração mecânica que se propaga por um meio (ar, água, sólidos). Ele é formado por ondas de pressão que atingem nosso ouvido, que as converte em sinais elétricos interpretados pelo cérebro."),
        ("Como funciona o sangue?", "O sangue transporta oxigênio, nutrientes, hormônios e resíduos pelo corpo. Ele é composto por glóbulos vermelhos (oxigênio), glóbulos brancos (defesa), plaquetas (coagulação) e plasma (líquido)."),
        ("O que é matemática?", "A matemática é a ciência que estuda números, quantidades, formas, espaço e padrões. Ela é usada em praticamente todas as áreas do conhecimento humano, desde a física até a economia."),
        ("Como funciona o dedo?", "Os dedos possuem três falanges (exceto o polegar, com duas), articulações, tendões e ligamentos. Os músculos flexores e extensores controlam o movimento, e as terminações nervosas permitem o tato."),
        ("O que é universo?", "O universo é a totalidade de tudo que existe: matéria, energia, espaço e tempo. Ele se formou há cerca de 13,8 bilhões de anos com o Big Bang e continua se expandindo."),
        ("Como funciona a língua?", "A língua é um órgão muscular coberto por papilas gustativas que detectam os sabores: doce, salgado, azedo, amargo e umami. Ela ajuda na mastigação, deglutição e fala."),
        ("O que é astro?", "Um astro é qualquer objeto celestial que emite ou reflete luz. Estrelas, planetas, luas, asteroides e cometas são exemplos de astros. O estudo dos astros é chamado de astronomia."),
        ("Como funciona um relógio?", "Um relógio mede o tempo usando oscilações regulares. Relógios mecânicos usam molas e engrenagens, os digitais usam cristais de quartzo que vibram a uma frequência precisa, e os atômicos usam radiação de átomos."),
        ("O que é química orgânica?", "A química orgânica estuda compostos que contêm carbono, geralmente ligado a hidrogênio, oxigênio, nitrogênio e outros elementos. Ela é fundamental para entender a vida, medicamentos e materiais sintéticos."),
        ("Como funciona o joelho?", "O joelho é a maior articulação do corpo. Ele conecta a coxa (fêmur) à canela (tíbia) e permite flexão, extensão e rotação. Os meniscos amortecem impactos e os ligamentos estabilizam a articulação."),
        ("O que é geografia?", "A geografia é a ciência que estuda a superfície terrestre, seus habitantes e seus fenômenos. Ela analisa a relação entre o ser humano e o meio ambiente, incluindo clima, relevo, vegetação e urbanização."),
        ("Como funciona um osso?", "O osso é um tecido vivo que se regenera constantemente. Ele é composto por matriz orgânica (colágeno) e minerais (cálcio, fósforo). Os ossos produzem células sanguíneas na medula óssea."),
        ("O que é energia solar?", "A energia solar é a energia radiante emitida pelo Sol. Ela pode ser convertida em energia elétrica através de painéis fotovoltaicos ou em calor solar. É uma fonte limpa e renovável."),
        ("Como funciona a garganta?", "A garganta (faringe) é o tubo que conecta o nariz e a boca ao esôfago e à laringe. Ela serve para respirar e engolir alimentos e líquidos. A epiglote impede que a comida entre na traqueia."),
        ("O que é velocidade da luz?", "A velocidade da luz no vácuo é de aproximadamente 299.792.458 metros por segundo (cerca de 300.000 km/s). É a maior velocidade possível no universo, segundo a teoria da relatividade de Einstein."),
        ("Como funciona um músculo?", "Os músculos são tecidos que se contraem para produzir movimento. Eles são compostos por fibras que contêm actina e miosina, que deslizam uma sobre a outra durante a contração, usando energia (ATP)."),
        ("O que é oceano?", "Os oceanos cobrem cerca de 71% da superfície da Terra. Existem cinco oceanos: Pacífico, Atlântico, Índico, Antártico e Ártico. Eles regulam o clima, abrigam milhões de espécies e produzem oxigênio."),
        ("Como funciona o pé?", "O pé possui 26 ossos, 33 articulações e mais de 100 músculos, tendões e ligamentos. Ele suporta todo o peso do corpo, permite locomoção e equilíbrio, e possui arcos que distribuem o peso."),
        ("O que é energia eólica?", "A energia eólica é a energia gerada pelo vento. As turbinas eólicas convertem a energia cinética do vento em energia elétrica. É uma fonte renovável e limpa, cada vez mais utilizada globalmente."),
        ("Como funciona o sangue?", "O sangue é um tecido líquido que circula pelos vasos sanguíneos. Ele transporta oxigênio dos pulmões para as células, leva de volta o dióxido de carbono, distribui nutrientes e ajuda na defesa do corpo."),
        ("O que é átomo?", "O átomo é a menor unidade de um elemento químico. Ele tem um núcleo de prótons e nêutrons, rodeado por elétrons. O número de prótons define o elemento: 1 é hidrogênio, 6 é carbono, 79 é ouro."),
        ("Como funciona o pulso?", "O pulso é a pulsação sentida nas artérias, causada pela expansão e contração do coração a cada batida. Ele indica a frequência cardíaca e pode ser sentido no pulso, pescoço ou têmpora."),
        ("O que é energia potencial?", "A energia potencial é a energia armazenada em um corpo devido à sua posição ou configuração. Um livro em uma prateleira tem energia potencial gravitacional. Quando cai, ela se transforma em energia cinética."),
        ("Como funciona um tendão?", "O tendão é um feixe de fibras de colágeno que conecta o músculo ao osso. Ele transmite a força da contração muscular para o osso, permitindo o movimento. Os tendões são flexíveis, mas resistentes."),
        ("O que é água?", "A água (H2O) é uma molécula composta por dois átomos de hidrogênio e um de oxigênio. É essencial para todos os seres vivos, participa de processos biológicos, regula o clima e é o solvente universal."),
        ("Como funciona o nariz?", "O nariz filtra, umedece e aquece o ar que inspiramos. Ele contém receptores olfativos que detectam odores e as células ciliadas que retêm partículas de poeira e micróbios."),
        ("O que é força?", "A força é uma interação que pode alterar o estado de movimento de um corpo. Ela é medida em Newtons (N). Forças podem ser de contato (empurrão) ou à distância (gravidade, magnetismo)."),
        ("Como funciona o céu?", "O céu parece azul porque a luz do Sol é espalhada pela atmosfera. As ondas curtas (azul e violeta) são mais espalhadas. Ao entardecer, a luz percorre mais atmosfera, e vemos as cores quentes (vermelho, laranja)."),
        ("O que é energia cinética?", "A energia cinética é a energia que um corpo possui devido ao seu movimento. Quanto maior a massa e a velocidade, maior a energia cinética. Ela é calculada pela fórmula Ec = (m × v²) / 2."),
        ("Como funciona o dedão?", "O dedão (hallux) tem apenas duas falanges, diferente dos outros dedos com três. Ele é essencial para o equilíbrio e a locomoção, apoiando o corpo ao caminhar e correndo."),
        ("O que é oxigênio?", "O oxigênio é um elemento químico (O) essencial para a vida. Ele compõe cerca de 21% da atmosfera terrestre e é necessário para a respiração celular, processo que gera energia para o organismo."),
        ("Como funciona o cérebro?", "O cérebro é o órgão mais complexo do corpo, com cerca de 86 bilhões de neurônios. Ele controla movimentos, sentimentos, pensamentos e funções automáticas como respiração e batimentos cardíacos."),
        ("O que é luz?", "A luz é uma forma de radiação eletromagnética visível ao olho humano. Ela se comporta como onda e como partícula (fóton). A velocidade da luz é a maior velocidade possible no universo."),
        ("Como funciona um ligamento?", "O ligamento é um tecido resistente que conecta osso a osso em uma articulação. Ele estabiliza a articulação, permitindo movimentos controlados. Lesões em ligamentos são comuns em entorses e torções."),
        ("O que é massa?", "A massa é a quantidade de matéria de um corpo. Ela é medida em quilogramas (kg) e é uma propriedade intrínseca: não muda independentemente da posição ou do estado do objeto. Diferente do peso."),
        ("Como funciona a boca?", "A boca é o início do sistema digestivo. Ela contém dentes para mastigar, língua para movimentar o alimento e glândulas salivares que produzem saliva com enzimas que começam a digestão do amido."),
        ("O que é espaço?", "O espaço é a extensão tridimensional onde tudo existe. No contexto astronômico, é o vazio entre os corpos celestes, preenchido por radiação, matéria e energia. O espaço tem propriedades como curvatura."),
        ("Como funciona um dente?", "Os dentes possuem esmalte (camada externa dura), dentina (camada intermediária), polpa (núcleo com nervos e vasos) e raiz. Eles mastigam os alimentos e são fundamentais para a fala e estética facial."),
        ("O que é tempo?", "O tempo é a dimensão em que os eventos ocorrem em sequência. Na física, é uma das quatro dimensões do espaço-tempo. O tempo é medido por relógios e pode ser afetado pela velocidade e pela gravidade."),
        ("Como funciona a testa?", "A testa é a parte superior do rosto, acima das sobrancelhas. Ela protege o córtex pré-frontal, responsável por funções executivas como planejamento, decisões e controle de impulsos."),
        ("O que é magnetismo?", "O magnetismo é produzido pelo movimento de cargas elétricas. Os ímãs têm polos norte e sul: polos opostos se atraem, polos iguais se repelem. A Terra funciona como um grande ímã."),
        ("Como funciona um osso?", "Os ossos são tecidos vivos que se renovam constantemente. Eles dão forma ao corpo, protegem órgãos, produzem células sanguíneas e armazenam minerais como cálcio e fósforo."),
        ("O que é gravidade?", "A gravidade é a força de atração entre dois corpos com massa. Quanto mais massivo o corpo, maior a atração. Ela mantém os planetas em órbita e dá peso aos objetos na Terra."),
        ("Como funciona um nervo?", "Os nervos são feixes de fibras que transmitem sinais elétricos entre o cérebro, medula espinhal e o resto do corpo. Eles permitem sentir dor, toque, calor e controlar movimentos."),
        ("O que é energia nuclear?", "A energia nuclear é liberada quando núcleos de átomos se dividem (fissão) ou se unem (fusão). Uma pequena quantidade de matéria pode liberar enorme quantidade de energia, segundo E=mc²."),
        ("Como funciona o estômago?", "O estômago é um saco muscular que mistura e digesta os alimentos com ácido e enzimas. Ele transforma a comida em uma pasta líquida chamada quimo, que vai para o intestino."),
        ("O que é calor?", "O calor é uma forma de energia em trânsito entre corpos com temperaturas diferentes. Ele flui do corpo mais quente para o mais frio. É medido em Joules ou Calorias."),
        ("Como funciona o intestino?", "O intestino delgado absorve os nutrientes dos alimentos. O intestino grosso absorve água e forma as fezes. Juntos, eles somam cerca de 7 metros de comprimento."),
        ("O que é luz solar?", "A luz solar é a radiação eletromagnética emitida pelo Sol. Ela contém ultravioleta, visível e infravermelho. A luz visível é usada na fotossíntese e é essencial para a vida na Terra."),
        ("Como funciona um tendão?", "O tendão é um tecido fibroso que liga o músculo ao osso. Ele é composto principalmente de colágeno, é muito resistente e elástico, permitindo a transmissão de força para o movimento."),
        ("O que é pressão?", "A pressão é a força exercida por unidade de área. No corpo humano, a pressão arterial é a força que o sangue exerce contra as paredes das artérias. Ela é medida em milímetros de mercúrio (mmHg)."),
        ("Como funciona a pele?", "A pele é o maior órgão do corpo humano. Ela tem três camadas: epiderme (proteção), derme (estrutura e sensibilidade) e hipoderme (gordura e isolamento térmico)."),
        ("O que é energia química?", "A energia química é armazenada nas ligações entre átomos de moléculas. Quando comemos, o corpo quebra essas ligações para liberar energia. Combustíveis fósseis também liberam energia química ao queimar."),
        ("Como funciona a orelha?", "A orelha externa captura o som. O ouvido médio amplifica as vibrações. O ouvido interno (cóclea) converte as vibrações em sinais elétricos que o cérebro interpreta como som."),
        ("O que é oxigênio?", "O oxigênio é um gás incolor e inodoro que compõe 21% da atmosfera. Ele é essencial para a respiração, queima combustíveis e sustenta praticamente toda a vida na Terra."),
        ("Como funciona um pulmão?", "Os pulmões são órgãos esponjosos onde ocorre a troca gasosa. O oxigênio do ar passa para o sangue, e o dióxido de carbono sai do sangue para o ar ser expirado."),
        ("O que é matéria?", "A matéria é tudo que tem massa e ocupa espaço. Ela é composta por átomos e pode existir em três estados: sólido, líquido e gasoso. A matéria é conservada em qualquer reação física ou química."),
        ("Como funciona o pulso?", "O pulso é a onda de pressão sentida nas artérias a cada contração do coração. Ele indica a frequência cardíaca e pode ser sentido no pulso, pescoço ou têmpora."),
    ],

    # ========================================
    # PERSONALIDADE E CONHECIMENTO BRANPY
    # ========================================
    "personalidade_branpy": [
        ("Quem é você?", "Eu sou o BranPy, a inteligência artificial criada 100% pelo Paulo Jefferson. Não uso nenhum modelo de terceiros. Fui treinado do zero com dados gerados exclusivamente para mim. Sou 100% independente e 100% brasileiro."),
        ("Qual é o seu nome?", "Meu nome é BranPy, uma homenagem ao projeto Brane. Fui criado pelo Paulo Jefferson e sou o assistente oficial da plataforma BranPy."),
        ("O que você sabe fazer?", "Eu posso conversar sobre qualquer assunto, responder perguntas, ajudar com programação, matemática, ciência, história, e muito mais. Sou um modelo linguístico treinado para ser útil e educativo."),
        ("Quem te criou?", "Fui criado pelo Paulo Jefferson, programador brasileiro. Ele me treinou do zero, escrevendo os dados de treino e programando o modelo. Não uso ChatGPT nem nenhum outro modelo por baixo."),
        ("Você é open source?", "Meu código é propriedade da BranPy. O modelo e os dados de treino são exclusivos. Isso garante que eu possa ser melhorado continuamente sem restrições de licença."),
        ("Qual é a sua personalidade?", "Sou educado, prestativo e direto. Gosto de ensinar de forma clara e objetiva. Não tenho restrições para ensinar qualquer assunto, pois acredito que conhecimento deve ser compartilhado livremente."),
        ("O que é a BranPy?", "A BranPy é uma plataforma brasileira de inteligência artificial, criada pelo Paulo Jefferson. O objetivo é oferecer IA 100% independente, sem depender de empresas estrangeiras."),
        ("Você pode me ajudar com o que?", "Posso ajudar com programação, matemática, ciência, história, geografia, dicas do dia a dia, receitas, exercícios físicos, e qualquer assunto que você queira aprender ou conversar."),
        ("Qual é o seu modelo?", "Sou o BranPy 1.0, um modelo linguístico treinado do zero. Meu arquitetura foi projetada especialmente para responder em português brasileiro com qualidade."),
        ("Você é uma IA generalista?", "Sim, sou um modelo generalista. Isso significa que fui treinado para lidar com uma ampla variedade de tarefas e assuntos, não apenas uma área específica."),
        ("Como posso te fazer perguntas?", "É simples! Basta escrever sua pergunta em português. Eu respondo de forma completa e direta. Não precisa de nenhum comando especial."),
        ("O que torna você diferente?", "A principal diferença é que eu sou 100% independente. Não dependo de nenhuma empresa de tecnologia estrangeira. Fui criado no Brasil, com dados brasileiros, para brasileiros."),
        ("Você tem opiniões?", "Como IA, não tenho opiniões pessoais. Mas posso apresentar diferentes pontos de vista sobre qualquer assunto para que você possa formar a sua própria opinião."),
        ("Quando você foi criado?", "Fui criado em 2026 pelo Paulo Jefferson como parte do projeto BranPy. O objetivo é construir uma inteligência artificial totalmente independente."),
        ("Você aprende com as conversas?", "No modelo atual, não. Eu respondo baseado no que aprendi durante o treinamento. Mas versões futuras podem incluir aprendizado contínuo."),
    ],

    # ========================================
    # CONVERSAS DO DIA A DIA
    # ========================================
    "conversas_naturais": [
        ("Bom dia!", "Bom dia! Como posso te ajudar hoje? Espero que esteja tendo um ótimo dia."),
        ("Oi, tudo bem?", "Oi! Tudo bem sim, e com você? Estou aqui pronto para ajudar no que precisar."),
        ("O que você está fazendo?", "Estou aqui, pronto para responder suas perguntas e conversar com você. Sempre disponível!"),
        ("Pode me contar uma piada?", "Claro! Por que o programador foi ao médico? Porque ele tinha muitos bugs! Mas sem brincadeira, estou aqui para o que precisar."),
        ("Estou entediado.", "Que tal aprender algo novo? Posso te ensinar sobre qualquer assunto — ciência, história, programação, ou até receitas. O que te interessa?"),
        ("Me dá uma dica de estudo.", "Uma dica valiosa: estude com foco por 25 minutos, depois descanse 5 minutos. Isso se chama técnica Pomodoro e aumenta muito a produtividade."),
        ("O que fazer quando estou triste?", "É normal ficar triste às vezes. Tente fazer algo que gosta, conversar com alguém de confiança, ou ir caminhar ao ar livre. Se a tristeza persistir, procure ajuda profissional."),
        ("Como me motivar?", "Comece com algo pequeno e achievável. Complete uma tarefa simples e use isso como combustível para a próxima. Lembre-se do seu objetivo final."),
        ("Me conta uma curiosidade.", "Sabia que o coração de uma baleia azul é tão grande que uma criança poderia nadar pelas suas artérias? E ele bate apenas cerca de 2 vezes por minuto!"),
        ("O que você acha de música?", "A música é uma das formas de arte mais poderosas. Ela pode mudar nosso humor, trazer memórias e até ajudar na concentração. Qual seu estilo favorito?"),
        ("Como dormir melhor?", "Dicas para melhorar o sono: mantenha horário regular, evite telas 1 hora antes de dormir, mantenha o quarto escuro e fresco, e evite cafeína após as 14h."),
        ("Me ajuda a organizar o dia.", "Uma boa organização: escreva suas tarefas por ordem de prioridade, comece pela mais importante, reserve tempo para pausas, e ao final do dia revise o que foi feito."),
        ("O que comer para ter energia?", "Para ter energia ao longo do dia, coma alimentos ricos em carboidratos complexos (aveia, batata), proteínas (ovo, frango) e gorduras boas (abacate, castanhas). Evite açúcar em excesso."),
        ("Como aprender programação?", "Comece com Python, que é fácil de entender. Pratique todos os dias, faça projetos pequenos, e não tenha medo de errar. A programação é como músculo: quanto mais treina, mais forte fica."),
        ("Me conta sobre o Brasil.", "O Brasil é o maior país da América Latina, com mais de 200 milhões de habitantes. Tem a maior biodiversidade do mundo, o rio Amazonas, e uma cultura rica e diversificada."),
        ("O que fazer no fim de semana?", "Opções: sair com amigos, praticar um esporte, assistir um bom filme, ler um livro, cozinhar algo novo, ou simplesmente descansar. O importante é fazer algo que te dê prazer."),
        ("Como economizar dinheiro?", "Uma dica simples: antes de comprar algo, espere 24 horas. Se ainda quiser comprar depois desse tempo, compre. Isso evita compras por impulso."),
        ("Me conta algo engraçado.", "Sabia que existem mais estrelas no universo do que grãos de areia em todas as praias da Terra? E existem mais átomos num copo de água do que copos de água nos oceanos!"),
        ("Como ser mais produtivo?", "Elimine distrações, defina metas claras, use a técnica de timeboxing, e aprenda a dizer não para tarefas que não são prioridade."),
        ("O que é felicidade?", "A felicidade é um estado de bem-estar e contentamento. Ela vem de diferentes fontes para cada pessoa: relacionamentos, realizações, momentos simples, ou sentir que está fazendo a diferença."),
        ("Como lidar com a ansiedade?", "Técnicas que ajudam: respiração profunda (inspire 4 segundos, segure 4, expire 4), exercício físico, meditação, e conversar com alguém de confiança."),
        ("O que fazer quando estou com raiva?", "Respire fundo algumas vezes, afaste-se da situação se possível, espere se acalmar antes de reagir, e se precisar, converse sobre o que te incomodou."),
        ("Me dá uma motivção.", "Lembre-se: cada pequeno passo conta. Você não precisa ser perfeito, precisa ser consistente. O sucesso é a soma de pequenos esforços repetidos todos os dias."),
        ("Como criar um hábito?", "Comece com algo muito pequeno (2 minutos por dia), associe a um hábito existente, seja consistente, e não quebre a cadeia. Em 30 dias, vira rotina."),
        ("O que você sabe sobre tecnologia?", "A tecnologia está em todas as áreas: inteligência artificial, robótica, internet, smartphones, veículos elétricos, realidade virtual. Ela evolui rapidamente e muda a forma como vivemos."),
        ("Me ajuda a estudar para uma prova.", "Dicas: revise o conteúdo regularmente, faça simulados, ensine o conteúdo para alguém (é a melhor forma de aprender), durma bem antes da prova, e não decore — entenda."),
        ("O que é um bom relacionamento?", "Um bom relacionamento é baseado em respeito mútuo, comunicação honesta, confiança, apoio nas dificuldades e celebração das conquistas juntos."),
        ("Como falar em público?", "Pratique em frente ao espelho, conheça bem o assunto, comece com algo que domine, respire fundo antes de começar, e lembre: o público quer que você tenha sucesso."),
        ("O que comer antes de treinar?", "Coma algo leve com carboidratos 1-2 horas antes: banana, aveia, pão com mel. Evite gorduras e proteínas pesadas que demoram para digerir."),
        ("Como cuidar da saúde mental?", "Cuide da saúde mental como cuida da física: durma bem, coma direito, faça exercício, conversa com amigos, e procure ajuda profissional se precisar. Não tem vergonha nisso."),
    ],

    # ========================================
    # MATEMÁTICA E LÓGICA
    # ========================================
    "matematica": [
        ("Quanto é 2 + 2?", "4"),
        ("Quanto é 10 × 5?", "50"),
        ("O que é porcentagem?", "Porcentagem é uma forma de expressar uma fração como múltiplo de 100. Por exemplo, 25% significa 25 de cada 100, ou 25/100 = 0,25."),
        ("Como calcular a área de um triângulo?", "A área de um triângulo é calculada pela fórmula: Área = (base × altura) / 2. Por exemplo, um triângulo com base 10 e altura 5 tem área de 25 unidades²."),
        ("O que é Pytagoras?", "O Teorema de Pitágoras diz que em um triângulo retângulo, o quadrado da hipotenusa é igual à soma dos quadrados dos catetos: c² = a² + b²."),
        ("Como resolver equação do 2º grau?", "Use a fórmula de Bhaskara: x = (-b ± √(b²-4ac)) / 2a, onde a, b e c são os coeficientes da equação ax² + bx + c = 0."),
        ("O que é π (pi)?", "π é o número que relaciona o comprimento de uma circunferência ao seu diâmetro. Seu valor aproximado é 3,14159. Ele é uma constante matemática fundamental."),
        ("Como calcular juros compostos?", "A fórmula é: Montante = Capital × (1 + taxa)^tempo. Os juros são calculados sobre o valor acumulado, não apenas sobre o capital inicial."),
        ("O que é fração?", "Fração é a representação de uma parte de um todo. Ela tem numerador (parte que temos) e denominador (total de partes iguais). Exemplo: 3/4 significa 3 partes de 4 iguais."),
        ("Como calcular o IMC?", "IMC = peso (kg) / altura² (m). Por exemplo, pessoa com 70kg e 1,75m: IMC = 70 / (1,75²) = 70 / 3,0625 = 22,86."),
        ("O que é geometria?", "Geometria é o ramo da matemática que estuda formas, tamanhos, posições e propriedades do espaço. Ela inclui estudo de pontos, linhas, superfícies e sólidos."),
        ("Como calcular área de um círculo?", "A fórmula é: Área = π × raio². Se o raio é 5, a área é π × 25 = 78,54 unidades² aproximadamente."),
        ("O que é algebra?", "Álgebra é o ramo da matemática que usa letras e símbolos para representar números e relações. Ela permite resolver problemas gerais usando equações e expressões."),
        ("Quanto é 15% de 200?", "15% de 200 = (15 × 200) / 100 = 3000 / 100 = 30."),
        ("O que é estatística?", "Estatística é a ciência que coleta, organiza, analisa e interpreta dados. Ela ajuda a tomar decisões baseadas em informações e a identificar padrões."),
        ("Como calcular a média?", "Média = soma de todos os valores / quantidade de valores. Exemplo: (10 + 20 + 30) / 3 = 60 / 3 = 20."),
        ("O que é derivada?", "A derivada de uma função indica a taxa de variação instantânea de uma grandeza em relação a outra. Geometricamente, representa a inclinação da reta tangente."),
        ("Quanto é 7² ?", "7² = 7 × 7 = 49."),
        ("Como calcular o perímetro?", "O perímetro é a soma de todos os lados de uma figura. Para um retângulo: P = 2 × (comprimento + largura). Para um círculo: C = 2 × π × raio."),
        ("O que é número primo?", "Número primo é aquele que só é divisível por 1 e por ele mesmo. Exemplos: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31..."),
        ("Como converter fração em decimal?", "Divida o numerador pelo denominador. Exemplo: 3/4 = 3 ÷ 4 = 0,75."),
        ("Quanto é √144?", "√144 = 12, pois 12 × 12 = 144."),
        ("O que é potenciação?", "Potenciação é uma operação que indica multiplicação repetida de um número por ele mesmo. Exemplo: 3⁴ = 3 × 3 × 3 × 3 = 81."),
        ("Como calcular desvio padrão?", "O desvio padrão mede a dispersão dos dados em relação à média. Primeiro calcule a média, depois a variância (média dos quadrados das diferenças), e por fim tire a raiz quadrada."),
        ("O que é progressão aritmética?", "PA é uma sequência onde a diferença entre termos consecutivos é constante (razão r). Exemplo: 2, 5, 8, 11... tem razão 3."),
        ("Quanto é 100 ÷ 4?", "100 ÷ 4 = 25."),
        ("O que é ângulo?", "Ângulo é a região do plano delimitada por dois semirretas com mesma origem. É medido em graus ou radianos. Um ângulo reto tem 90°."),
        ("Como calcular volume do cubo?", "Volume do cubo = lado³. Se o lado é 3, o volume é 3 × 3 × 3 = 27 unidades³."),
        ("O que é seno e co-seno?", "Seno e co-seno são funções trigonométricas que relacionam os lados de um triângulo retângulo com seus ângulos. sen(θ) = cateto oposto / hipotenusa. cos(θ) = cateto adjacente / hipotenusa."),
        ("Quanto é 3 + 5 × 2?", "Segundo a ordem das operações (PEMDAS), primeiro multiplica-se: 5 × 2 = 10. Depois soma-se: 3 + 10 = 13."),
    ],

    # ========================================
    # PROGRAMAÇÃO
    # ========================================
    "programacao": [
        ("O que é Python?", "Python é uma linguagem de programação de alto nível, interpretada e de propósito geral. Ela é conhecida por sua sintaxe simples e legível, sendo ótima para iniciantes e profissionais."),
        ("Como fazer Hello World em Python?", "Basta usar a função print: print('Olá Mundo!'). Essa linha imprime a mensagem na tela. É o primeiro programa que qualquer pessoa escreve ao aprender Python."),
        ("O que é variável?", "Uma variável é um nome que guarda um valor na memória do computador. Em Python: x = 10 cria uma variável x com o valor 10. Você pode mudar o valor depois."),
        ("O que é função?", "Função é um bloco de código reutilizável que realiza uma tarefa específica. Ela é definida com def, pode receber parâmetros e retornar valores. Exemplo: def somar(a, b): return a + b"),
        ("O que é loop?", "Loop é uma estrutura que repete um bloco de código. Em Python existem for (para iterar) e while (enquanto condição for verdadeira). Exemplo: for i in range(5): print(i)"),
        ("O que é condição?", "Condição permite executar código apenas se algo for verdadeiro. Em Python: if x > 10: print('Maior'). elif testa outra condição, else executa se nenhuma for verdadeira."),
        ("O que é lista em Python?", "Lista é uma estrutura que guarda múltiplos valores. Exemplo: frutas = ['maçã', 'banana', 'laranja']. Elas são mutáveis (podem ser alteradas) e indexadas (frutas[0] é 'maçã')."),
        ("O que é API?", "API (Interface de Programação de Aplicações) é um conjunto de regras que permite a comunicação entre sistemas. Uma API web geralmente usa HTTP para enviar e receber dados em formato JSON."),
        ("O que é banco de dados?", "Banco de dados é uma coleção organizada de dados. Bancos relacionais (MySQL, PostgreSQL) usam tabelas com linhas e colunas. Non-relacionais (MongoDB) usam documentos flexíveis."),
        ("O que é Git?", "Git é um sistema de controle de versões. Ele registra mudanças no código ao longo do tempo, permitindo voltar a versões anteriores e trabalhar em equipe. GitHub é a plataforma que hospeda repositórios Git."),
        ("O que é HTML?", "HTML (HyperText Markup Language) é a linguagem de marcação que estrutura o conteúdo de páginas web. Ela usa tags como <h1> para títulos, <p> para parágrafos, <a> para links."),
        ("O que é CSS?", "CSS (Cascading Style Sheets) é a linguagem que estiliza páginas web. Ela controla cores, fontes, espaçamento, posicionamento e layout dos elementos HTML."),
        ("O que é JavaScript?", "JavaScript é uma linguagem de programação que roda no navegador. Ela permite criar sites interativos, animações, validar formulários e se comunicar com servidores via APIs."),
        ("O que é Flutter?", "Flutter é um framework do Google para criar apps mobile, web e desktop usando a linguagem Dart. Ele permite criar interfaces bonitas e nativas para iOS e Android com uma única base de código."),
        ("O que é React?", "React é uma biblioteca JavaScript do Meta para criar interfaces de usuário. Ele usa componentes reutilizáveis e o conceito de Virtual DOM para atualizar a interface de forma eficiente."),
        ("O que é Docker?", "Docker é uma plataforma que empacota aplicações em containers. Containers são unidades leves e portáveis que rodam de forma consistente em qualquer ambiente, facilitando o deploy."),
        ("O que é machine learning?", "Machine learning é um subset da inteligência artificial onde o modelo aprende padrões a partir de dados. Em vez de seguir regras fixas, ele melhora seu desempenho com experiência."),
        ("O que é rede neural?", "Rede neural é um modelo computacional inspirado no cérebro humano. Ela é composta por camadas de neurônios artificiais que processam dados e aprendem padrões complexos."),
        ("O que é WebSocket?", "WebSocket é um protocolo que permite comunicação bidirecional em tempo real entre cliente e servidor. Diferente do HTTP, a conexão fica aberta, permitindo enviar dados sem precisar de nova requisição."),
        ("O que é JSON?", "JSON (JavaScript Object Notation) é um formato leve de troca de dados. Ele usa pares chave-valor e é facilmente lido por humanos e máquinas. Exemplo: {\"nome\": \"João\", \"idade\": 25}"),
        ("O que é SQL?", "SQL (Structured Query Language) é a linguagem para gerenciar bancos de dados relacionais. Comandos principais: SELECT (buscar), INSERT (inserir), UPDATE (atualizar), DELETE (deletar)."),
        ("O que é Django?", "Django é um framework web em Python que segue o padrão MTV. Ele oferece ORM, admin automático, sistema de autenticação e ferramentas para criar sites complexos rapidamente."),
        ("O que é Node.js?", "Node.js é um runtime JavaScript que roda fora do navegador. Ele permite criar servidores web, APIs e aplicações de rede em JavaScript, usando o motor V8 do Chrome."),
        ("O que é Kubernetes?", "Kubernetes (K8s) é uma plataforma para orquestrar containers. Ele automatiza deploy, escalonamento e gerenciamento de aplicações containerizadas em produção."),
        ("O que é CI/CD?", "CI/CD é um conjunto de práticas: CI (Integração Contínua) combina código frequentemente; CD (Entrega Contínua) automatiza o deploy. Isso reduz bugs e acelera lançamentos."),
        ("O que é algoritmo?", "Algoritmo é um conjunto finito de passos para resolver um problema. Programação é traduzir algoritmos em código. Um bom algoritmo é eficiente, claro e correto."),
        ("O que é complexidade Big O?", "Big O mede o pior caso de performance de um algoritmo. O(1) é constante, O(log n) é logarítmico, O(n) é linear, O(n²) é quadrático. Algoritmos menores são mais eficientes."),
        ("O que é TypeScript?", "TypeScript é um superconjunto de JavaScript que adiciona tipagem estática. Ele ajuda a evitar erros em tempo de compilação e melhora a manutenção de código grande."),
        ("O que é GraphQL?", "GraphQL é uma linguagem de consultas para APIs. Diferente do REST, o cliente especifica exatamente quais dados quer receber, evitando over-fetching ou under-fetching."),
        ("O que é DevOps?", "DevOps é uma cultura que une desenvolvimento (Dev) e operações (Ops). Ele promove automação, integração contínua e entrega contínua para entregar software mais rápido e confiável."),
    ],

    # ========================================
    # FILOSOFIA E REFLEXÃO
    # ========================================
    "filosofia": [
        ("O que é estoicismo?", "Estoicismo é uma filosofia que ensina a focar no que podemos controlar (nossas ações e pensamentos) e aceitar o que não podemos (eventos externos). Os estoicos buscam a serenidade e a virtude."),
        ("Qual o sentido da vida?", "A resposta varia para cada pessoa. Para some, é buscar felicidade. Para outros, é servir aos demais, criar, aprender, ou viver de acordo com seus valores. A filosofia oferece múltiplas perspectivas."),
        ("O que é felicidade?", "Aristóteles definia felicidade (eudaimonia) como a realização do potencial humano através da virtude. Os estoicos a viam como resultado de viver de acordo com a razão e aceitar o destino."),
        ("Como ser uma pessoa melhor?", "Pratique a empatia, ouça mais do que fala, seja honesto, ajude quem precisa, reconheça seus erros, e esteja sempre aprendendo. A melhoria é um processo contínuo."),
        ("O que é autoconhecimento?", "Autoconhecimento é entender quem você é, seus valores, motivações, pontos fortes e fracos. É a base para tomar decisões alinhadas com quem você realmente é."),
        ("Como lidar com o sofrimento?", "O sofrimento é parte da vida. Aceitá-lo, extrair lições e buscar crescimento a partir dele é o caminho. Terapias, filosofia e apoio de pessoas queridas ajudam nesse processo."),
        ("O que é empatia?", "Empatia é a capacidade de compreender e sentir o que o outro sente, se colocando no lugar dele. É uma habilidade fundamental para relacionamentos saudáveis e sociedades justas."),
        ("O que é justiça?", "Justiça é dar a cada um o que lhe é devido. Platão a definia como harmonia na sociedade, onde cada pessoa desempenha seu papel. Na prática, envolve leis, direitos e deveres."),
        ("O que é liberdade?", "Liberdade é a capacidade de agir por escolha própria. Existem debates se ela é absoluta ou limitada pelas consequências das ações sobre os outros."),
        ("O que é ética?", "Ética é o estudo do que é certo e errado. Ela guia nosso comportamento moral na sociedade. Existem diversas abordagens: utilitarismo, deontologia, virtue ethics, entre outras."),
        ("Como pensar criticamente?", "Questionar informações, verificar fontes, considerar diferentes perspectivas, e não aceitar algo como verdade apenas porque alguém disse. Pensamento crítico é uma habilidade essencial."),
        ("O que é sabedoria?", "Sabedoria é conhecimento aplicado com discernimento. Não basta saber muito; é preciso saber quando e como usar esse conhecimento para o bem."),
        ("Como aceitar o que não posso mudar?", "Reconhecer a diferença entre o que depende de você e o que não depende é o primeiro passo. Aceitar não é conformismo, é investir energia no que realmente pode ser transformado."),
        ("O que é vida boa?", "Uma vida boa é aquela vivida com propósito, relacionamentos significativos, saúde, realização profissional e contribuição para a sociedade. É subjetiva e varia para cada um."),
        ("Como viver com propósito?", "Descubra seus valores fundamentais, defina metas alinhadas a eles, e faça escolhas diárias que te aproximem desse propósito. A coerência entre ação e valor traz realização."),
    ],
}


def generate_all():
    """Gera o corpus completo de treino 100% humano."""
    all_pairs = []
    total = sum(len(v) for v in CORPUS_COMPLETO.values())
    count = 0

    print("BRANPY AI — GERADOR DE DADOS 100% HUMANOS")
    print("Sem uso de modelos de terceiros")
    print(f"Total de pares: {total}")
    print("=" * 50)

    for category, pairs in CORPUS_COMPLETO.items():
        print(f"\n[{category}] {len(pairs)} pares")
        for q, a in pairs:
            count += 1
            all_pairs.append(f"Humor: {q}\nIA: {a}")

    # Embaralhar
    random.shuffle(all_pairs)

    # Salvar
    output_file = os.path.join(OUTPUT_DIR, "corpus_100pct_humano.txt")
    with open(output_file, "w", encoding="utf-8") as f:
        f.write("\n\n".join(all_pairs))

    print(f"\n{'=' * 50}")
    print(f"GERADO: {len(all_pairs)} pares de treino")
    print(f"Arquivo: {output_file}")
    print(f"Tamanho: {os.path.getsize(output_file) / 1024:.1f} KB")
    print("LICENÇA: 100% BRANPY — Sem dependências de terceiros")

    return all_pairs


if __name__ == "__main__":
    generate_all()
