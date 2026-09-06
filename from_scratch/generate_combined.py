"""Gerador COMBINADO — Templates + Fatos = Dataset 100% nosso.

Estrategia:
  1. Templates programaticos (estrutura, padroes)
  2. Fatos publicos (conhecimento)
  3. Tudo misturado = dataset unico para treinar modelo proprio

SEM dependencia de modelos externos.
SEM chamadas a APIs externas.
100% codigo e dados da Brampy.

Rodar: python generate_combined.py
"""

import os
import random

random.seed(42)


# ==========================================
# 1. TEMPLATES PROGRAMATICOS (100% nosso)
# ==========================================

def gerar_templates() -> list:
    """Gera dados a partir de templates programaticos."""
    lines = []

    # --- Templates de programacao ---
    langs = ["Python", "JavaScript", "TypeScript", "Java", "C++", "Go", "Rust", "PHP", "Dart"]
    topics = [
        "funcao", "classe", "loop", "condicional", "variavel", "array",
        "string", "dicionario", "arquivo", "excecao", "decorador",
        "generator", "list comprehension", "async/await", "callback",
    ]
    acoes = [
        "criar", "usar", "entender", "aprender", "praticar",
        "dominar", "aplicar", "implementar", "otimizar",
    ]

    for lang in langs:
        for topic in topics:
            acao = random.choice(acoes)
            lines.append(f"Como {acao} {topic} em {lang}?")
            lines.append(f"{lang} tem {topic} que serve pra organizar o codigo. Comece pelo basico, practique bastante.")
            lines.append("")

    # --- Templates de vida ---
    areas = [
        ("produtividade", "organize seu tempo use tecnicas como pomodoro"),
        ("saude", "durma bem coma direito e se exercite regularmente"),
        ("financas", "controle seus gastos invista mensalmente e tenha reserva"),
        ("relacionamento", "comunique-se bem ouca mais e seja honesto"),
        ("estudos", "revisao espacada pratica ativa e foco sao chaves"),
        ("carreira", "aprenda sempre networking e portfolio sao importantes"),
        ("tecnologia", "se atualize aprenda novas ferramentas e pratique muito"),
        ("criatividade", "expose-se a coisas novas anote ideias e pratique diariamente"),
    ]

    for area, conselho in areas:
        perguntas = [
            f"Como melhorar em {area}?",
            f"Dicas de {area}",
            f"O que fazer pra evoluir em {area}?",
            f"Quero melhorar em {area}, por onde comeco?",
        ]
        for p in perguntas:
            lines.append(p)
            lines.append(f"Em {area}: {conselho}. Comece devagar e seja consistente.")
            lines.append("")

    # --- Templates de ciencia ---
    ciencia = [
        ("por que o ceu e azul?", "A atmosfera espalha mais luz azul. Isso se chama espalhamento Rayleigh."),
        ("como funciona a gravidade?", "Massa atrai massa. Quanto maior o objeto, maior a atracao gravitacional."),
        ("o que e ADN?", "ADN e uma molecula que carrega informacao genetica. Determina suas caracteristicas."),
        ("como nasce uma estrela?", "Nuvens de gas e poeira colapsam por gravidade e iniciam fusao nuclear."),
        ("o que e energia solar?", "Energia obtida do sol usando paineis fotovoltaicos. E renovavel e limpa."),
        ("como funciona o coracao?", "O coracao bomba sangue pelo corpo. Tem 4 camaras que trabalham juntas."),
        ("o que e vulcao?", "Abertura na crosta terrestre por onde lava e gases sao expelidos."),
        ("como funciona o olho humano?", "Luz entra pela pupila, e projetada na retina, que envia sinais ao cerebro."),
    ]

    for pergunta, resposta in ciencia:
        lines.append(pergunta)
        lines.append(resposta)
        lines.append("")

    # --- Templates de respostas rapidas ---
    rapidas = [
        ("oi", "Ola! Como voce ta? Posso te ajudar com algo?"),
        ("obrigado", "De nada! Sempre que precisar, estou aqui."),
        ("tchau", "Tchau! Cuide-se e volte quando quiser!"),
        ("bom dia", "Bom dia! Que seu dia seja otimo!"),
        ("boa noite", "Boa noite! Durma bem e acorde descansado!"),
        ("como voce ta?", "To bem, obrigada! E voce?"),
        ("o que voce sabe fazer?", "Sei programar, ensinar, conversar e ajudar em varios assuntos!"),
        ("qual seu nome?", "Meu nome e BranPy! Prazer em conhecer voce."),
        ("voce e humana?", "Sou uma IA, mas gosto de conversar como gente!"),
        ("me conta uma piada", "Por que programador usa oculos? Porque nao consegue C#!"),
    ]

    for pergunta, resposta in rapidas:
        lines.append(pergunta)
        lines.append(resposta)
        lines.append("")

    return lines


# ==========================================
# 2. FATOS PUBLICOS (conhecimento geral)
# ==========================================

def gerar_fatos() -> list:
    """Gera dados de fatos publicos (sem copyright)."""
    lines = []

    fatos = [
        # Historia
        ("Quem descobriu o Brasil?", "Pedro Alvares Cabral chegou ao Brasil em 1500."),
        ("O que foi a Revolucao Francesa?", "Revolucao politica que comecou em 1789 e derrubou a monarquia na Franca."),
        ("Quem foi Albert Einstein?", "Fisico alemao que criou a teoria da relatividade e ganhou o Nobel de Fisica."),
        ("O que foi a Segunda Guerra Mundial?", "Conflito global de 1939 a 1945 envolvendo potencias mundiais."),
        ("Quem inventou a lampada?", "Thomas Edison criou a lampada eletrica pratica em 1879."),

        # Geografia
        ("Qual o maior pais do mundo?", "Russia com 17,1 milhoes de km2. Seguido pelo Canada e EUA."),
        ("Quantos continentes existem?", "7: Asia, Africa, America do Norte, America do Sul, Europa, Oceania e Antartida."),
        ("Qual o rio mais longo do mundo?", "Rio Nilo com 6.650 km, passando por 11 paises africanos."),
        ("Qual a montanha mais alta?", "Monte Everest com 8.849 metros de altitude, no Nepal."),
        ("Onde fica o Deserto do Saara?", "No norte da Africa, e o maior deserto quente do mundo."),

        # Ciencia basica
        ("O que e hidrogenio?", "Elemento quimico mais leve do universo, simbolo H, numero atomico 1."),
        ("Quantos ossos tem o corpo humano?", "206 ossos em um adulto. Bebes nascem com cerca de 270."),
        ("O que e agua feita?", "Dois atomos de hidrogenio e um de oxigenio: H2O."),
        ("Como funciona a digestao?", "Alimentos sao quebrados no estomago e intestinos para absorver nutrientes."),
        ("O que sao celulas?", "Unidades basicas da vida. Todo ser vivo e feito de celulas."),

        # Tecnologia
        ("O que e internet?", "Rede global de computadores conectados que permite troca de informacoes."),
        ("Como funciona um computador?", "Processador executa instrucoes, memoria armazena dados, entrada/saida comunica."),
        ("O que e inteligencia artificial?", "Area da computacao que cria sistemas capazes de realizar tarefas inteligentes."),
        ("O que e cloud computing?", "Computacao em nuvem: acessar recursos de computacao pela internet."),
        ("Como funciona um celular?", "Computador miniaturizado com processador, memoria, tela e conexao wireless."),

        # Matematica
        ("O que e pi?", "Numero irracional que relaciona circunferencia e diametro. Aprox. 3.14159."),
        ("Como calcular area de circulo?", "Area = pi x raio ao quadrado. A = pi * r^2."),
        ("O que sao numeros primos?", "Numeros maiores que 1 divisiveis apenas por 1 e por eles mesmos."),
        ("Quanto e 7 x 8?", "56."),
        ("O que e equacao do 2o grau?", "ax^2 + bx + c = 0. Resolve com formula de Bhaskara."),

        # Natureza
        ("O que sao mamiferos?", "Animais que amamentam crias, tem pelo e sao vertebrados."),
        ("Quantos planetas tem o sistema solar?", "8: Mercurio, Venus, Terra, Marte, Jupiter, Saturno, Urano e Netuno."),
        ("O que e fotossintese?", "Processo que plantas usam pra transformar luz solar em energia e oxigenio."),
        ("Como nasce uma borboleta?", "Ovo -> lagarta -> crisalida -> borboleta. Chama-se metamorfose."),
        ("O que e biodiversidade?", "Variety de seres vivos em um ecossistema. Quanto mais, mais equilibrado."),

        # Alimentos
        ("O que sao proteinas?", "Macronutriente essencial para construir e reparar tecidos do corpo."),
        ("Frutas sao saudaveis?", "Sim! Contem vitaminas, minerais e fibras essenciais para saude."),
        ("Beber agua e importante?", "Sim! O corpo e 60% agua. Beber 2L por dia e recomendado."),
        ("O que sao carboidratos?", "Macronutriente que fornece energia rapida pro corpo e cerebro."),
        ("Comer verduras faz bem?", "Sim! Verduras contem vitaminas, minerais e fibras importantes."),

        # Emocoes e saude mental
        ("O que e ansiedade?", "Resposta natural do corpo a ameacas. Em excesso, causa desconforto."),
        ("Como lidar com estresse?", "Exercicio, respiracao profunda, sono adequado e hobbies ajudam muito."),
        ("O que e autoestima?", "Como voce se ve e valoriza. Autoestima saudavel e importante pra saude."),
        ("Por que rir e bom?", "Liberar endorfina, reduz estresse, fortalece imunidade e melhora o humor."),
        ("Como ter mais energia?", "Durma bem, coma direito, se exercite e beba agua suficiente."),
    ]

    for pergunta, resposta in fatos:
        lines.append(pergunta)
        lines.append(resposta)
        lines.append("")

    return lines


# ==========================================
# 3. COMBINACAO E EXPORTACAO
# ==========================================

def main():
    print("=" * 60)
    print("GERADOR COMBINADO — Templates + Fatos (100% Brampy)")
    print("=" * 60)

    all_lines = []

    # 1. Templates programaticos
    print("\n[1/2] Gerando templates programaticos...")
    templates = gerar_templates()
    all_lines.extend(templates)
    print(f"  {len(templates)} linhas de templates")

    # 2. Fatos publicos
    print("\n[2/2] Gerando fatos publicos...")
    fatos = gerar_fatos()
    all_lines.extend(fatos)
    print(f"  {len(fatos)} linhas de fatos")

    # Embaralhar tudo
    random.shuffle(all_lines)

    # Salvar
    out_dir = os.path.join(os.path.dirname(__file__), 'data')
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, 'corpus_combined.txt')

    with open(out_path, 'w', encoding='utf-8') as f:
        for line in all_lines:
            f.write(line + '\n')

    # Estatisticas
    non_empty = [l for l in all_lines if l.strip()]
    unique = set(non_empty)

    print("\n" + "=" * 60)
    print("RESULTADO:")
    print(f"  Total de linhas: {len(all_lines)}")
    print(f"  Linhas nao-vazias: {len(non_empty)}")
    print(f"  Linhas unicas: {len(unique)}")
    print(f"  Taxa unica: {len(unique)/max(len(non_empty),1)*100:.1f}%")
    print(f"  Arquivo: {out_path}")
    print(f"  Tamanho: {os.path.getsize(out_path)/1024:.1f} KB")
    print(f"  Fontes: templates (100%) + fatos (100%)")
    print(f"  Modelos externos: NENHUM")
    print(f"  APIs externas: NENHUMA")
    print("=" * 60)


if __name__ == '__main__':
    main()
