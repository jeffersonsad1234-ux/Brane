"""
Gera dataset especializado para Cérebro 2 — Raciocínio.
Foco: lógica, multi-etapa, causa/efeito, matemática, comparação, inconsistência.
Formato: Humor: pergunta\nIA: resposta com raciocínio passo a passo.
"""
import random
import os

random.seed(42)

# ═══════════════════════════════════════════════════════════
# PADRÕES DE RACIOCÍNIO
# ═══════════════════════════════════════════════════════════

# Nomes brasileiros
NOMES = ["Ana", "João", "Maria", "Pedro", "Lucia", "Carlos", "Julia", "Rafael",
         "Camila", "Bruno", "Fernanda", "Thiago", "Larissa", "Marcos", "Beatriz",
         "Leonardo", "Amanda", "Gabriel", "Isabela", "Felipe", "Valéria", "Jefferson",
         "Sabrina", "Elaine", "Patricia", "Renato", "Cláudia", "Eduardo", "Mariana",
         "Roberto", "Tatiana", "André", "Vanessa", "Lucas", "Priscila"]

OBJETOS = ["boneca", "livro", "caneta", "moeda", "caixa", "bola", "lapiseira",
           "celular", "fone", "mouse", "teclado", "copo", "garrafa", "prato",
           "cadeira", "mesa", "quadro", "relogio", "chave", "carteira"]

FRUTAS = ["maçã", "banana", "laranja", "morango", "uva", "abacaxi", "manga",
          "pêssego", "melancia", "kiwi", "amendoin", "avelã"]

LOCAIS = ["escola", "mercado", "parque", "biblioteca", "academia", "hospital",
          "padaria", "restaurante", "farmacia", "banco", "posto", "igreja"]

CORES = ["vermelho", "azul", "verde", "amarelo", "preto", "branco", "rosa",
         "roxo", "laranja", "marrom", "cinza", "dourado"]

# ═══════════════════════════════════════════════════════════
# GERADORES POR TIPO DE RACIOCÍNIO
# ═══════════════════════════════════════════════════════════

def gen_causa_efeto():
    """Relações de causa e consequência."""
    pares = [
        ("não dormiu", "está cansado"),
        ("estudou muito", "tirou boa nota"),
        ("choveu muito", "o rio subiu"),
        ("não regou a planta", "a planta murchou"),
        ("faz frio", "a pessoa passa mal"),
        ("não comeu", "está com fome"),
        ("correu muito", "suou bastante"),
        ("não parou de beber", "ficou embriagado"),
        ("dormiu tarde", "acordou cansado"),
        ("não usou protetor solar", "queimou o pé"),
        ("lavou as mãos", "não pegou gripe"),
        ("exerceu todos os dias", "emagreceu"),
        ("comprou caro", "gastou mais"),
        ("não revisou o código", "apareceu bug"),
        ("programou bem", "o sistema funcionou"),
        ("não fez backup", "perdeu os dados"),
        ("a bateria descarregou", "o celular desligou"),
        ("o cano estourou", "inundou o banheiro"),
        ("a conta de luz aumentou", "usou ar-condicionado"),
        ("o trânsito estava pesado", "chegou atrasado"),
        ("não lavou a louça", "a louça acumulou"),
        ("comeu demais", "passou mal"),
        ("não guardou dinheiro", "ficou sem nada"),
        ("o vento ficou forte", "o galho caiu"),
        ("a temperatura subiu", "o sorvete derreteu"),
        ("não desligou o fogão", "o comida queimou"),
        ("estudou francês", "aprendeu a falar"),
        ("não fez exercício", "perdeu a forma"),
        ("comprou na internet", "recebeu em casa"),
        ("não pagou a conta", "o serviço cortou"),
    ]
    results = []
    for causa, efeito in pares:
        nome = random.choice(NOMES)
        results.append((
            f"{nome} {causa}. Por que {nome} {efeito.split()[0] if ' ' not in efeito else efeito}?",
            f"Porque {nome} {causa}. Isso causa diretamente: {nome} {efeito}."
        ))
    return results

def logica_proposicional():
    """Lógica proposicional: se X então Y."""
    templates = [
        ("Todos os {objeto}s são {cor}. {nome} tem um {objeto}. De que cor é o {objeto} de {nome}?",
         "O {objeto} de {nome} é {cor}, porque todos os {objeto}s são {cor}."),
        ("Nenhum {local} é um {objeto}. {nome} está no {local}. {nome} está em um {objeto}?",
         "Não, {nome} não está em um {objeto}, porque nenhum {local} é um {objeto}."),
        ("Se chove, {nome} leva guarda-chuva. Está chovendo. O que {nome} faz?",
         "{nome} leva guarda-chuva, porque está chovendo e a regra é: se chove, leva guarda-chuva."),
        ("Se {nome} estuda, tira nota boa. {nome} não tirou nota boa. {nome} estudou?",
         "Não necessariamente. Sabemos que se estuda, tira nota boa. Mas não tirar nota boa pode ter outros motivos."),
        ("Todo dia {nome} corre. Hoje é dia. {nome} vai correr?",
         "Sim, provavelmente {nome} vai correr, porque todo dia {nome} corre e hoje é dia."),
        ("Se a luz está verde, pode seguir. A luz está vermelha. {nome} pode seguir?",
         "Não, {nome} não pode seguir porque a luz está vermelha, não verde."),
        ("Todos os {fruta}s são doces. {nome} tem uma cesta de {fruta}s. As frutas são doces?",
         "Sim, todas as {fruta}s da cesta são doces, porque todo {fruta} é doce."),
        ("Se {nome} comer, não fica com fome. {nome} ficou com fome. {nome} comeu?",
         "Não necessariamente. Podemos concluir que {nome} NÃO comeu, porque se comesse não ficaria com fome."),
    ]
    results = []
    for tmpl in templates:
        nome = random.choice(NOMES)
        objeto = random.choice(OBJETOS)
        cor = random.choice(CORES)
        local = random.choice(LOCAIS)
        fruta = random.choice(FRUTAS)
        q = tmpl[0].format(nome=nome, objeto=objeto, cor=cor, local=local, fruta=fruta)
        r = tmpl[1].format(nome=nome, objeto=objeto, cor=cor, local=local, fruta=fruta)
        results.append((q, r))
    return results

def gen_multi_etapa():
    """Problemas que exigem múltiplos passos."""
    results = []
    for _ in range(80):
        nome = random.choice(NOMES)
        tipo = random.choice(["compra", "conta", "distancia", "reuniao", "projeto"])

        if tipo == "compra":
            item1 = random.choice(OBJETOS)
            item2 = random.choice(OBJETOS)
            preco1 = random.randint(5, 50)
            preco2 = random.randint(5, 50)
            desconto = random.randint(1, 10)
            total = preco1 + preco2 - desconto
            q = f"{nome} comprou um {item1} por {preco1} reais e um {item2} por {preco2} reais. Ganhou {desconto} reais de desconto. Quanto pagou no total?"
            r = f"Passo 1: {preco1} + {preco2} = {preco1 + preco2} (soma dos preços)\nPasso 2: {preco1 + preco2} - {desconto} = {total} (desconto)\nResposta: {nome} pagou {total} reais."

        elif tipo == "conta":
            valor = random.randint(100, 500)
            parcelas = random.choice([2, 3, 4, 5, 6])
            valorParcela = valor // parcelas
            q = f"A conta de {nome} é {valor} reais. Ela divide em {parcelas} parcelas iguais. Quanto é cada parcela?"
            r = f"Passo 1: {valor} ÷ {parcelas} = {valorParcela} (divisão)\nResposta: Cada parcela é {valorParcela} reais."

        elif tipo == "distancia":
            vel = random.randint(30, 120)
            tempo = random.randint(1, 5)
            dist = vel * tempo
            q = f"{nome} viaja a {vel} km/h por {tempo} horas. Qual a distância percorrida?"
            r = f"Passo 1: {vel} × {tempo} = {dist} (velocidade × tempo)\nResposta: {nome} percorreu {dist} km."

        elif tipo == "reuniao":
            total = random.randint(10, 50)
            presentes = random.randint(3, total - 1)
            faltantes = total - presentes
            q = f"Uma reunião tem {total} pessoas. {presentes} compareceram. Quantas faltaram?"
            r = f"Passo 1: {total} - {presentes} = {faltantes} (total - presentes)\nResposta: {faltantes} pessoas faltaram."

        elif tipo == "projeto":
            dias = random.randint(5, 30)
            porDia = random.randint(2, 8)
            total = dias * porDia
            q = f"{nome} trabalha {porDia} horas por dia durante {dias} dias em um projeto. Quantas horas no total?"
            r = f"Passo 1: {porDia} × {dias} = {total} (horas por dia × dias)\nResposta: {nome} trabalhou {total} horas no total."

        results.append((q, r))
    return results

def gen_comparacao():
    """Comparação entre objetos, quantidades, situações."""
    results = []
    for _ in range(60):
        nome1, nome2 = random.choice(NOMES), random.choice(NOMES)
        while nome2 == nome1:
            nome2 = random.choice(NOMES)

        tipo = random.choice(["quantidade", "altura", "preco", "velocidade", "idade"])

        if tipo == "quantidade":
            obj = random.choice(OBJETOS)
            qtd1 = random.randint(1, 20)
            qtd2 = random.randint(1, 20)
            q = f"{nome1} tem {qtd1} {obj}s. {nome2} tem {qtd2} {obj}s. Quem tem mais {obj}s e por quanto?"
            diff = abs(qtd1 - qtd2)
            mais = nome1 if qtd1 > qtd2 else nome2
            r = f"{mais} tem mais {obj}s. A diferença é {diff} {obj}s ({max(qtd1,qtd2)} - {min(qtd1,qtd2)} = {diff})."

        elif tipo == "altura":
            h1 = random.randint(150, 195)
            h2 = random.randint(150, 195)
            q = f"{nome1} tem {h1} cm. {nome2} tem {h2} cm. Quem é mais alto e por quanto?"
            diff = abs(h1 - h2)
            mais = nome1 if h1 > h2 else nome2
            r = f"{mais} é mais alto. A diferença é {diff} cm ({max(h1,h2)} - {min(h1,h2)} = {diff})."

        elif tipo == "preco":
            item = random.choice(OBJETOS)
            p1 = random.randint(10, 100)
            p2 = random.randint(10, 100)
            q = f"Na loja A, o {item} custa {p1} reais. Na loja B, custa {p2} reais. Onde é mais barato e por quanto?"
            diff = abs(p1 - p2)
            barato = "loja A" if p1 < p2 else "loja B"
            r = f"É mais barato na {barato}. A diferença é {diff} reais ({max(p1,p2)} - {min(p1,p2)} = {diff})."

        elif tipo == "velocidade":
            v1 = random.randint(30, 120)
            v2 = random.randint(30, 120)
            q = f"{nome1} corre a {v1} km/h. {nome2} corre a {v2} km/h. Quem é mais rápido e por quanto?"
            diff = abs(v1 - v2)
            rapido = nome1 if v1 > v2 else nome2
            r = f"{rapido} é mais rápido. A diferença é {diff} km/h ({max(v1,v2)} - {min(v1,v2)} = {diff})."

        elif tipo == "idade":
            a1 = random.randint(10, 60)
            a2 = random.randint(10, 60)
            q = f"{nome1} tem {a1} anos. {nome2} tem {a2} anos. Quem é mais velho e por quanto?"
            diff = abs(a1 - a2)
            velho = nome1 if a1 > a2 else nome2
            r = f"{velho} é mais velho. A diferença é {diff} anos ({max(a1,a2)} - {min(a1,a2)} = {diff})."

        results.append((q, r))
    return results

def gen_inconsistencia():
    """Detecção de inconsistências e contradições."""
    pares = [
        ("Pedro é alto. Pedro tem 1,50m. Isso é consistente?",
         "Inconsistente. 1,50m não é considerado alto. Pedro não pode ser alto e ter 1,50m ao mesmo tempo."),
        ("Ana estuda todo dia. Ana não sabe nada. Isso é consistente?",
         "Inconsistente. Se Ana estuda todo dia, esperar-se-ia que soubesse algo. Pode haver outros fatores, mas a afirmação é contraditória."),
        ("O restaurante está vazio. Tem 50 pessoas dentro. Isso é consistente?",
         "Inconsistente. Se tem 50 pessoas, não está vazio. As duas afirmações se contradizem."),
        ("Lucas corre todo dia. Lucas nunca se exercita. Isso é consistente?",
         "Inconsistente. Correr é uma forma de exercício. Se Lucas corre todo dia, ele se exercita."),
        ("Choveu ontem. O chão está seco. Isso é consistente?",
         "Pode ser inconsistente, mas depende. Se choveu muito tempo atrás, o chão pode ter secado. Se choveu há pouco, é inconsistente."),
        ("Maria tem 10 anos. Maria é aposentada. Isso é consistente?",
         "Inconsistente. Pessoas com 10 anos não podem ser aposentadas. A aposentadoria requer idade mínima."),
        ("O computador está desligado. Está processando dados. Isso é consistente?",
         "Inconsistente. Um computador desligado não pode processar dados. As duas coisas são opostas."),
        ("João comeu bastante. João está com fome. Isso é consistente?",
         "Inconsistente. Se João comeu bastante, não deveria estar com fome. Pode ser que comesse há muito tempo, mas a afirmação é contraditória."),
        ("Faz 40 graus. Está nevando. Isso é consistente?",
         "Inconsistente. Neve só cai abaixo de 0°C. Em 40 graus é impossível nevar."),
        ("Carlos é medico. Carlos nunca estudou medicina. Isso é consistente?",
         "Inconsistente. Para ser médico, é necessário estudar medicina. As duas afirmações se contradizem."),
    ]
    results = []
    for q, r in pares:
        # Varia com nomes
        nome = random.choice(NOMES)
        q_var = q.replace("Pedro", nome).replace("Ana", nome).replace("Lucas", nome).replace("Maria", nome).replace("João", nome).replace("Carlos", nome)
        results.append((q_var, r))
    return results

def gen_matematica_raciocinio():
    """Matemática com explicação do raciocínio."""
    results = []
    for _ in range(100):
        tipo = random.choice(["soma", "subtracao", "multiplicacao", "divisao", "porcentagem", "media", "proporcao"])

        if tipo == "soma":
            a, b = random.randint(10, 500), random.randint(10, 500)
            q = f"Quanto é {a} + {b}?"
            r = f"Raciocínio: {a} + {b} = {a + b}. Soma direta.\nResultado: {a + b}."

        elif tipo == "subtracao":
            a = random.randint(50, 500)
            b = random.randint(10, a)
            q = f"Quanto é {a} - {b}?"
            r = f"Raciocínio: {a} - {b} = {a - b}. Subtração direta.\nResultado: {a - b}."

        elif tipo == "multiplicacao":
            a, b = random.randint(2, 30), random.randint(2, 30)
            q = f"Quanto é {a} × {b}?"
            r = f"Raciocínio: {a} × {b} = {a * b}. Multiplicação.\nResultado: {a * b}."

        elif tipo == "divisao":
            b = random.randint(2, 15)
            resultado = random.randint(2, 20)
            a = b * resultado
            q = f"Quanto é {a} ÷ {b}?"
            r = f"Raciocínio: {a} ÷ {b} = {resultado}. Divisão exata.\nResultado: {resultado}."

        elif tipo == "porcentagem":
            base = random.choice([100, 200, 500, 1000])
            pct = random.choice([10, 15, 20, 25, 30, 50])
            resultado = base * pct // 100
            q = f"Quanto é {pct}% de {base}?"
            r = f"Raciocínio: {pct}% de {base} = {base} × {pct}/100 = {base} × 0.{pct:02d} = {resultado}.\nResultado: {resultado}."

        elif tipo == "media":
            nums = [random.randint(1, 100) for _ in range(3)]
            media = sum(nums) / 3
            q = f"Qual é a média de {nums[0]}, {nums[1]} e {nums[2]}?"
            r = f"Raciocínio: ({nums[0]} + {nums[1]} + {nums[2]}) / 3 = {sum(nums)} / 3 = {media:.2f}.\nResultado: {media:.2f}."

        elif tipo == "proporcao":
            a1 = random.randint(1, 10)
            b1 = random.randint(1, 10)
            a2 = a1 * random.randint(2, 5)
            b2 = b1 * (a2 // a1)
            q = f"Se {a1} corresponde a {b1}, quanto {a2} corresponde?"
            r = f"Raciocínio: Proporção: {a1}/{b1} = {a2}/x. x = {a2} × {b1} / {a1} = {b2}.\nResultado: {b2}."

        results.append((q, r))
    return results

def gen_explicacao_caminho():
    """Explicação do caminho lógico."""
    pares = [
        ("Por que precisamos dormir?",
         "Caminho lógico: 1) O corpo acumula fadiga ao longo do dia. 2) O cérebro precisa de tempo para processar informações. 3) Durante o sono, o corpo repara tecidos e consolida memórias. 4) Portanto, dormir é necessário para manter a saúde física e mental."),
        ("Por que o céu é azul?",
         "Caminho lógico: 1) A luz do sol tem todas as cores. 2) A atmosfera é composta por moléculas pequenas. 3) As moléculas espalham mais a luz azul (comprimento de onda curto). 4) Portanto, vemos o céu como azul porque a luz azul é espalhada em todas as direções."),
        ("Como funciona a memória?",
         "Caminho lógico: 1) Informações entram pelos sentidos. 2) O hipocampo processa e codifica. 3) Se repetidas, passam para memória de longo prazo no córtex. 4) Ao recordar, o cérebro reativa essas conexões. 5) Portanto, memória é a consolidação de conexões neurais."),
        ("Por que choramos quando tristes?",
         "Caminho lógico: 1) Tristeza ativa o sistema límbico (emoções). 2) O corpo libera hormônios de estresse. 3) As lágrimas são uma forma de liberar esses hormônios. 4) Também sinalizam para outros que precisamos de ajuda. 5) Portanto, chorar é uma resposta biológica e social."),
        ("Como um avião voa?",
         "Caminho lógico: 1) As asas têm formato curvo (perfil aerodinâmico). 2) O ar move mais rápido acima da asa que abaixo. 3) Isso cria pressão menor em cima (princípio de Bernoulli). 4) A diferença de pressão gera sustentação. 5) Portanto, o avião voa porque a sustentação supera o peso."),
        ("Por que a água ferve a 100°C?",
         "Caminho lógico: 1) Moléculas de água se movem mais quando esquentam. 2) A 100°C, ganham energia suficiente para escapar da superfície. 3) Isso é ebulição: o líquido vira gás. 4) Portanto, a 100°C a água ferve porque as moléculas superam a coesão líquida."),
        ("Como funciona o coração?",
         "Caminho lógico: 1) O coração é um músculo com 4 câmaras. 2) O lado direito recebe sangue venoso dos rins. 3) Bomba para os pulmões (circuito pulmonar). 4) O lado esquerdo recebe sangue arterial. 5) Bomba para todo o corpo (circuito sistêmico). 6) Portanto, o coração é uma bomba dupla que mantém a circulação."),
        ("Por que sentimos dor?",
         "Caminho lógico: 1) Receptores de dor (nociceptores) detectam estímulos nocivos. 2) Enviam sinais pelo sistema nervoso ao cérebro. 3) O cérebro interpreta como dor. 4) Isso faz a pessoa se afastar do estímulo. 5) Portanto, dor é um mecanismo de proteção que nos faz evitar danos ao corpo."),
        ("Como funciona a gravidade?",
         "Caminho lógico: 1) Toda massa gera um campo gravitacional. 2) Quanto maior a massa, maior o campo. 3) Objetos próximos são atraídos para o centro de massa. 4) Quanto mais perto, mais forte a atração. 5) Portanto, a gravidade é a força de atração entre massas, proporcional à massa e inversamente proporcional ao quadrado da distância."),
        ("Por que envelhecemos?",
         "Caminho lógico: 1) Células se dividem continuamente. 2) A cada divisão, os telômeros (extremidades do DNA) encurtam. 3) Quando encurtam demais, a célula não consegue mais se dividir. 4) Acumulação de danos celulares reduz funções. 5) Portanto, envelhecemos porque as células perdem capacidade de regeneração ao longo do tempo."),
    ]
    results = []
    for q, r in pares:
        results.append((q, r))
    return results

# ═══════════════════════════════════════════════════════════
# GERAÇÃO PRINCIPAL
# ═══════════════════════════════════════════════════════════

def main():
    all_pairs = []

    # Adiciona cada tipo
    generators = [
        ("causa_efeto", gen_causa_efeto, 30),
        ("logica", logica_proposicional, 8),
        ("multi_etapa", gen_multi_etapa, 80),
        ("comparacao", gen_comparacao, 60),
        ("inconsistencia", gen_inconsistencia, 10),
        ("matematica", gen_matematica_raciocinio, 100),
        ("explicacao_caminho", gen_explicacao_caminho, 10),
    ]

    for name, gen_fn, repeat in generators:
        pairs = gen_fn()
        # Repete para garantir diversidade
        for _ in range(repeat):
            all_pairs.extend(pairs)

    random.shuffle(all_pairs)

    # Adiciona dados existentes de raciocínio
    reasoning_file = os.path.join(os.path.dirname(__file__), "data", "corpus_reasoning_large.txt")
    if os.path.exists(reasoning_file):
        with open(reasoning_file, 'r', encoding='utf-8') as f:
            existing = f.read()
        all_existing = []
        blocks = existing.strip().split('\n\n')
        for block in blocks:
            lines = block.strip().split('\n')
            if len(lines) >= 2:
                q = lines[0].replace("Humor: ", "").replace("Pergunta: ", "")
                r = lines[1].replace("IA: ", "").replace("Resposta: ", "")
                all_existing.append((q, r))
        all_pairs.extend(all_existing)

    # Salva
    output_path = os.path.join(os.path.dirname(__file__), "data", "brain2_reasoning.txt")
    with open(output_path, 'w', encoding='utf-8') as f:
        for q, r in all_pairs:
            f.write(f"Humor: {q}\nIA: {r}\n\n")

    print(f"Dataset Brain 2 (Raciocínio) gerado: {output_path}")
    print(f"Total de exemplos: {len(all_pairs)}")
    print(f"Tamanho: {os.path.getsize(output_path) / 1024 / 1024:.1f} MB")

if __name__ == "__main__":
    main()
