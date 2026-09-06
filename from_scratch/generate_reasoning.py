"""
BranPy Reasoning Dataset Generator — 100% próprio, zero dependência externa.
Gera dados sintéticos programáticos para ensinar padrões de raciocínio.
NÃO usa modelo externo, NÃO copia conhecimento, NÃO requer licença.
"""

import random
import json
import os
from typing import List, Tuple, Dict, Any

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "data")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "corpus_reasoning.txt")
OUTPUT_FILE_LARGE = os.path.join(OUTPUT_DIR, "corpus_reasoning_large.txt")

os.makedirs(OUTPUT_DIR, exist_ok=True)

# ==========================================
# TEMPLATES DE RACIOCÍNIO (paramétricos, variáveis)
# ==========================================

ARITHMETIC_TEMPLATES = [
    # Adição
    ("{name} tem {a} {obj} e compra mais {b}. Quantos {obj} {name} tem agora?",
     "{name} tem {total} {obj}."),
    ("{name} possui {a} {obj} e ganha {b} de presente. Total de {obj}?",
     "Total: {total} {obj}."),
    ("{name} encontra {a} {obj} no chão e já tinha {b}. Quantos {obj} {name} tem?",
     "{name} tem {total} {obj}."),
    ("{name} recebe {a} {obj} do pai e {b} da mãe. Quantos {obj} no total?",
     "Total: {total} {obj}."),
    # Subtração
    ("{name} tinha {a} {obj} e comeu {b}. Quantos sobraram?",
     "Sobraram {total} {obj}."),
    ("{name} tinha {a} {obj} e deu {b} para {other}. Quantos ficaram?",
     "Ficaram {total} {obj}."),
    ("{name} perdeu {b} {obj} dos {a} que tinha. Quantos restam?",
     "Restam {total} {obj}."),
    ("{name} emprestou {b} {obj} dos {a} que possuía. Quantos ficaram?",
     "Ficaram {total} {obj}."),
    # Multiplicação simples
    ("{name} tem {a} caixas de {obj}. Em cada caixa tem {b}. Quantos {obj} no total?",
     "Total: {total} {obj}."),
    ("{name} compra {a} pacotes de {obj}. Cada pacote contém {b}. Quantos {obj}?",
     "Total: {total} {obj}."),
    # Divisão simples
    ("{name} tem {a} {obj} e quer dividir igual entre {b} amigos. Quantos cada um recebe?",
     "Cada um recebe {total} {obj}."),
    ("{name} distribui {a} {obj} entre {b} pessoas igualmente. Quantos por pessoa?",
     "Cada pessoa recebe {total} {obj}."),
]

COMPARISON_TEMPLATES = [
    ("{name} tem {a} {obj} e {other} tem {b}. Quem tem mais?",
     "{winner} tem mais ({max} contra {min})."),
    ("{name} tem {a} {obj} e {other} tem {b}. Quantos a mais o maior tem?",
     "{winner} tem {diff} a mais."),
    ("Caixa A tem {a} {obj}. Caixa B tem {b}. Qual caixa tem menos?",
     "A caixa {loser} tem menos ({min})."),
    ("{name} mede {a} metros e {other} mede {b}. Quem é mais alto?",
     "{winner} é mais alto ({max}m contra {min}m)."),
    ("{name} pesa {a} kg e {other} pesa {b} kg. Quem é mais leve?",
     "{loser} é mais leve ({min}kg contra {max}kg)."),
]

LOGIC_TEMPLATES = [
    # Silogismo simples
    ("Todos os {category} são {property}. {name} é um {category}. {name} é {property}?",
     "Sim, {name} é {property}."),
    ("Nenhum {category} é {property}. {name} é um {category}. {name} é {property}?",
     "Não, {name} não é {property}."),
    ("Se {condition}, então {consequence}. {condition} aconteceu. O que segue?",
     "{consequence}."),
    ("{name} é maior que {other}. {other} é maior que {third}. Quem é o maior?",
     "{name} é o maior."),
    ("{name} é {property}. Todos os {property} são {category}. {name} é {category}?",
     "Sim, {name} é {category}."),
]

CAUSAL_TEMPLATES = [
    ("{cause}. Por que {effect}?",
     "Porque {cause}."),
    ("{name} estudou muito para a prova. Por que {name} tirou boa nota?",
     "Porque estudou muito."),
    ("Choveu muito. O rio subiu. Por que o rio subiu?",
     "Porque choveu muito."),
    ("{name} não dormiu. Por que {name} está cansado?",
     "Porque não dormiu."),
    ("{name} praticou todo dia. Por que {name} melhorou?",
     "Porque praticou todo dia."),
    ("A planta não recebeu água. Por que a planta morreu?",
     "Porque não recebeu água."),
]

UNKNOWN_TEMPLATES = [
    ("Qual a capital de {fake_country}?",
     "Não tenho informações suficientes para determinar isso."),
    ("Quem venceu a batalha de {fake_battle}?",
     "Não consigo saber isso apenas com o contexto fornecido."),
    ("Quantos habitantes tem {fake_city}?",
     "Não tenho dados sobre {fake_city}."),
    ("O que significa {fake_word}?",
     "Não sei o significado de {fake_word}."),
    ("Quando ocorreu o evento {fake_event}?",
     "Não tenho registro de {fake_event}."),
    ("Quem é {fake_person}?",
     "Não conheço {fake_person}."),
]

PARAPHRASE_TEMPLATES = [
    ("{name} tem uma {obj} {color}.", "De que cor é a {obj} de {name}?"),
    ("{name} comprou uma {obj1} e um {obj2}.", "{obj1} e {obj2} combinam?"),
    ("{name} mora em {city}.", "Onde {name} mora?"),
    ("{name} gosta de {activity}.", "O que {name} gosta de fazer?"),
    ("{name} é {adjective}.", "Como é {name}?"),
    ("{name} vai {verb} {preposition} {city}.", "O que {name} vai fazer?"),
]

# ==========================================
# BANCOS DE DADOS PARA VARIAÇÃO EXTREMA (VOCAB RICO)
# ==========================================

NAMES = ["Ana", "João", "Maria", "Pedro", "Carlos", "Lucia", "Rafael", "Fernanda", 
         "Lucas", "Juliana", "Bruno", "Camila", "Diego", "Patricia", "Felipe", "Amanda",
         "Gabriel", "Isabela", "Mateus", "Larissa", "Rodrigo", "Beatriz", "Gustavo", "Mariana",
         "Thiago", "Vanessa", "Leonardo", "Julia", "André", "Natália", "Ricardo", "Carolina",
         "Eduardo", "Renata", "Vinicius", "Tatiana", "Hugo", "Sabrina", "Paulo", "Roberta",
         "Fernando", "Mônica", "Daniel", "Adriana", "Marcos", "Silvia", "Sérgio", "Elaine"]

OBJECTS = ["maçã", "livro", "caneta", "caderno", "bola", "carro", "boneca", "bloco",
           "moeda", "figura", "carta", "adesivo", "brinquedo", "doce", "fruta", "cadeira",
           "mesa", "porta", "janela", "relógio", "telefone", "computador", "teclado", "mouse",
           "monitor", "fone", "cabo", "carregador", "bateria", "lâmpada", "interruptor", "tomada",
           "sofá", "cama", "travesseiro", "cobertor", "lençol", "toalha", "sabonete", "shampoo",
           "escova", "pente", "espelho", "armário", "guarda-roupa", "prateleira", "caixa", "saco"]

COLORS = ["vermelha", "azul", "verde", "amarela", "preta", "branca", "rosa", "laranja",
          "roxa", "marrom", "cinza", "dourada", "prateada", "bege", "turquesa", "violeta",
          "magenta", "ciano", "amarela-clara", "azul-escura", "verde-clara", "vermelha-escura"]

CITIES = ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Porto Alegre", "Curitiba",
          "Salvador", "Fortaleza", "Brasília", "Recife", "Goiânia", "Manaus", "Belém",
          "Vitória", "Florianópolis", "Natal", "Maceió", "Teresina", "São Luís", "João Pessoa",
          "Aracaju", "Campinas", "Santos", "Sorocaba", "Ribeirão Preto", "Uberlândia", "Londrina"]

ACTIVITIES = ["ler", "correr", "nadar", "desenhar", "cantar", "dançar", "jogar", "estudar",
              "cozinhar", "pintar", "viajar", "fotografar", "programar", "pescar", "caminhar",
              "pedalar", "meditar", "escrever", "tocar", "ouvir", "assistir", "pesquisar", "criar",
              "construir", "reparar", "limpar", "organizar", "planejar", "sonhar", "imaginar"]

FAKE_COUNTRIES = ["Xylophia", "Zentria", "Quilvar", "Novaterra", "Astralis", "Vespera",
                  "Oceania", "Terranova", "Vulcania", "Glacia", "Silvania", "Ferrania",
                  "Luminaria", "Umbratia", "Aquaria", "Ignisia", "Ventoria", "Petrania"]

FAKE_BATTLES = ["Batalha de Eldoria", "Guerra de Crystal", "Conflito de Nexus", "Cerco de Aether",
                "Batalha do Vale", "Guerra das Estrelas", "Conflito de Titãs", "Cerco de Olympus"]

FAKE_CITIES = ["Luminaris", "Obsidia", "Verdantis", "Pyronia", "Glacius", "Aerithia", "Terranis",
               "Aqualis", "Ignis", "Ventus", "Petra", "Silva", "Ferra", "Crystalis", "Nebulon"]

FAKE_WORDS = ["xelion", "zantropia", "quivarus", "novex", "astrin", "velor", "quimera", "nexus",
              "vortex", "zenith", "nadir", "apex", "orbita", "fluxo", "eco", "pulsar", "quasar"]

CATEGORIES = ["gato", "cachorro", "pássaro", "peixe", "mamífero", "réptil", "inseto",
              "aves", "roedor", "primata", "felino", "canino", "equino", "bovino", "suíno"]

PROPERTIES = ["mamífero", "ovíparo", "carnívoro", "herbívoro", "doméstico", "selvagem",
              "noturno", "diurno", "aquático", "terrestre", "aéreo", "social", "solitário"]

ADJECTIVES = ["grande", "pequeno", "rápido", "lento", "forte", "fraco", "inteligente", "simples",
              "complexo", "bonito", "feio", "novo", "velho", "limpo", "sujo", "claro", "escuro",
              "quente", "frio", "seco", "molhado", "pesado", "leve", "duro", "macio", "liso", "áspero"]

VERBS = ["comer", "beber", "dormir", "acordar", "correr", "andar", "pular", "sentar", "levantar",
         "falar", "ouvir", "ver", "ler", "escrever", "pensar", "sentir", "querer", "precisar",
         "gostar", "amar", "odiar", "conhecer", "aprender", "ensinar", "ajudar", "atrapalhar"]

PREPOSITIONS = ["em", "na", "no", "para", "por", "com", "sem", "sob", "sobre", "entre", "até", "desde"]

CONJUNCTIONS = ["e", "ou", "mas", "porque", "pois", "logo", "então", "assim", "portanto", "contudo"]


def rand_name() -> str:
    return random.choice(NAMES)

def rand_obj() -> str:
    return random.choice(OBJECTS)

def rand_color() -> str:
    return random.choice(COLORS)

def rand_city() -> str:
    return random.choice(CITIES)

def rand_activity() -> str:
    return random.choice(ACTIVITIES)

def rand_category() -> str:
    return random.choice(CATEGORIES)

def rand_property() -> str:
    return random.choice(PROPERTIES)

def rand_fake_country() -> str:
    return random.choice(FAKE_COUNTRIES)

def rand_fake_battle() -> str:
    return random.choice(FAKE_BATTLES)

def rand_fake_city() -> str:
    return random.choice(FAKE_CITIES)

def rand_fake_word() -> str:
    return random.choice(FAKE_WORDS)

def rand_fake_event() -> str:
    return random.choice(FAKE_BATTLES)  # reuse battles as events

def rand_fake_person() -> str:
    return random.choice(FAKE_COUNTRIES)  # reuse countries as fake persons

def rand_adjective() -> str:
    return random.choice(ADJECTIVES)

def rand_verb() -> str:
    return random.choice(VERBS)

def rand_preposition() -> str:
    return random.choice(PREPOSITIONS)

def rand_conjunction() -> str:
    return random.choice(CONJUNCTIONS)


def generate_arithmetic(count: int) -> List[Tuple[str, str]]:
    pairs = []
    for _ in range(count):
        name = rand_name()
        other = rand_name()
        while other == name:
            other = rand_name()
        obj = rand_obj()
        a = random.randint(1, 10)
        b = random.randint(1, 10)
        
        template, answer_tpl = random.choice(ARITHMETIC_TEMPLATES)
        
        # Calcula resposta
        if "compra mais" in template or "ganha" in template:
            total = a + b
        elif "comeu" in template or "deu" in template:
            total = a - b
        elif "caixas" in template:
            total = a * b
        elif "dividir" in template:
            total = a // b if b > 0 else 0
        else:
            total = a + b
        
        q = template.format(name=name, other=other, obj=obj, a=a, b=b)
        ans = answer_tpl.format(name=name, other=other, obj=obj, total=total, 
                                winner=name if a > b else other,
                                loser=name if a < b else other,
                                max=max(a,b), min=min(a,b), diff=abs(a-b))
        pairs.append((q, ans))
    return pairs


def generate_comparison(count: int) -> List[Tuple[str, str]]:
    pairs = []
    for _ in range(count):
        name = rand_name()
        other = rand_name()
        while other == name:
            other = rand_name()
        obj = rand_obj()
        a = random.randint(1, 20)
        b = random.randint(1, 20)
        while b == a:
            b = random.randint(1, 20)
        
        template, answer_tpl = random.choice(COMPARISON_TEMPLATES)
        winner = name if a > b else other
        loser = name if a < b else other
        
        q = template.format(name=name, other=other, obj=obj, a=a, b=b)
        ans = answer_tpl.format(name=name, other=other, obj=obj,
                                winner=winner, loser=loser,
                                max=max(a,b), min=min(a,b), diff=abs(a-b))
        pairs.append((q, ans))
    return pairs


def generate_logic(count: int) -> List[Tuple[str, str]]:
    pairs = []
    for _ in range(count):
        name = rand_name()
        other = rand_name()
        third = rand_name()
        cat = rand_category()
        prop = rand_property()
        condition = f"{name} faz X"
        consequence = f"{name} obtém Y"
        
        template, answer_tpl = random.choice(LOGIC_TEMPLATES)
        
        q = template.format(name=name, other=other, third=third,
                           category=cat, property=prop,
                           condition=condition, consequence=consequence)
        ans = answer_tpl.format(name=name, other=other, third=third,
                               category=cat, property=prop,
                               consequence=consequence)
        pairs.append((q, ans))
    return pairs


def generate_causal(count: int) -> List[Tuple[str, str]]:
    pairs = []
    for _ in range(count):
        name = rand_name()
        template, answer_tpl = random.choice(CAUSAL_TEMPLATES)
        
        if "estudou" in template:
            q = template.format(name=name)
            ans = answer_tpl.format(name=name)
        elif "choveu" in template:
            q = template
            ans = answer_tpl
        elif "dormiu" in template:
            q = template.format(name=name)
            ans = answer_tpl.format(name=name)
        elif "praticou" in template:
            q = template.format(name=name)
            ans = answer_tpl.format(name=name)
        elif "planta" in template:
            q = template
            ans = answer_tpl
        else:
            cause = f"{name} fez algo"
            effect = f"algo aconteceu"
            q = template.format(cause=cause, effect=effect, name=name)
            ans = answer_tpl.format(cause=cause, name=name)
        pairs.append((q, ans))
    return pairs


def generate_unknown(count: int) -> List[Tuple[str, str]]:
    pairs = []
    for _ in range(count):
        template, answer_tpl = random.choice(UNKNOWN_TEMPLATES)
        
        q = template.format(fake_country=rand_fake_country(),
                           fake_battle=rand_fake_battle(),
                           fake_city=rand_fake_city(),
                           fake_word=rand_fake_word(),
                           fake_event=rand_fake_event(),
                           fake_person=rand_fake_person())
        ans = answer_tpl.format(fake_country=rand_fake_country(),
                               fake_battle=rand_fake_battle(),
                               fake_city=rand_fake_city(),
                               fake_word=rand_fake_word(),
                               fake_event=rand_fake_event(),
                               fake_person=rand_fake_person())
        pairs.append((q, ans))
    return pairs


def generate_paraphrase(count: int) -> List[Tuple[str, str]]:
    pairs = []
    for _ in range(count):
        name = rand_name()
        obj = rand_obj()
        color = rand_color()
        obj1 = rand_obj()
        obj2 = rand_obj()
        city = rand_city()
        activity = rand_activity()
        adjective = rand_adjective()
        verb = rand_verb()
        preposition = rand_preposition()
        
        template, question = random.choice(PARAPHRASE_TEMPLATES)
        
        context = template.format(name=name, obj=obj, color=color,
                                 obj1=obj1, obj2=obj2,
                                 city=city, activity=activity,
                                 adjective=adjective, verb=verb,
                                 preposition=preposition)
        q = question.format(name=name, obj=obj, obj1=obj1, obj2=obj2,
                           city=city, activity=activity,
                           adjective=adjective, verb=verb,
                           preposition=preposition)
        pairs.append((context + " " + q, context))
    return pairs


def generate_all(target_total: int = 5000000) -> List[Tuple[str, str]]:
    """Gera dataset balanceado de raciocínio - ESCALA 100x."""
    
    # Distribuição balanceada
    per_type = target_total // 6
    
    all_pairs = []
    
    print(f"Gerando {per_type:,} aritmética...")
    all_pairs.extend(generate_arithmetic(per_type))
    
    print(f"Gerando {per_type:,} comparação...")
    all_pairs.extend(generate_comparison(per_type))
    
    print(f"Gerando {per_type:,} lógica...")
    all_pairs.extend(generate_logic(per_type))
    
    print(f"Gerando {per_type:,} causal...")
    all_pairs.extend(generate_causal(per_type))
    
    print(f"Gerando {per_type:,} 'não sei'...")
    all_pairs.extend(generate_unknown(per_type))
    
    print(f"Gerando {per_type:,} paráfrase...")
    all_pairs.extend(generate_paraphrase(per_type))
    
    # Embaralha
    random.shuffle(all_pairs)
    
    # Formata no padrão do treino: "Humor: pergunta\nIA: resposta"
    formatted = []
    for q, ans in all_pairs:
        formatted.append(f"Humor: {q}\nIA: {ans}")
    
    return formatted


def save_corpus(pairs: List[str], path: str):
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n\n".join(pairs))
    print(f"Salvo: {path} ({len(pairs):,} exemplos, {os.path.getsize(path)/1024/1024:.1f} MB)")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="BranPy Reasoning Dataset Generator")
    parser.add_argument("--total", type=int, default=5000000, help="Total de exemplos (default 5M)")
    parser.add_argument("--output", type=str, default=OUTPUT_FILE_LARGE)
    args = parser.parse_args()
    
    print("=" * 60)
    print("BRANPY REASONING DATASET GENERATOR — ESCALA 100x")
    print("100% próprio — Zero dependência externa")
    print("=" * 60)
    
    pairs = generate_all(args.total)
    save_corpus(pairs, args.output)
    
    print(f"\nTotal gerado: {len(pairs):,} exemplos")
    print("Pronto para treino!")