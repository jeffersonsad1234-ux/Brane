"""
BranPy 5B — Treino Rápido no Google Colab (GPU grátis)
100% branpy.com.br — Todos os direitos reservados

Como usar:
1. Abra colab.research.google.com
2. Runtime → Change runtime type → GPU (T4)
3. Cole este código numa célula
4. Execute
"""

import os
import subprocess
import sys

# ==========================================
# SETUP — Instalar dependências
# ==========================================
print("=" * 60)
print("BRANPY 5B — SETUP RÁPIDO")
print("=" * 60)

subprocess.run([sys.executable, "-m", "pip", "install", "-q",
    "torch", "transformers>=4.40", "datasets", "peft",
    "accelerate", "bitsandbytes", "trl", "sentencepiece", "protobuf"
], check=True)

import torch
from datasets import Dataset
from transformers import (
    AutoModelForCausalLM, AutoTokenizer,
    TrainingArguments, Trainer,
    BitsAndBytesConfig, DataCollatorForLanguageModeling
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training

print(f"\nGPU disponível: {torch.cuda.get_device_name(0)}")
print(f"VRAM: {torch.cuda.get_device_properties(0).total_mem / 1e9:.1f} GB")

# ==========================================
# DADOS — Carregar datasets da BranPy
# ==========================================
print("\n[1/4] Carregando dados...")

DATA_DIR = "/content/branpy-data"
os.makedirs(DATA_DIR, exist_ok=True)

# Baixar datasets do GitHub (ou upload manual)
DATASETS = {
    "corpus_knowledge_v2.txt": """Humor: o que é gravidade
IA: A gravidade é a força que atrai os objetos entre si. Na Terra, ela nos dá peso e nos mantém no chão. Quanto mais massa um objeto tem, mais forte é sua atração gravitacional.

Humor: por que o céu é azul
IA: O céu parece azul porque a luz solar se espalha ao colidir com moléculas na atmosfera. A luz azul tem um comprimento de onda mais curto e se espalha mais que outras cores.

Humor: como funciona a fotossíntese
IA: A fotossíntese é como as plantas convertem luz solar em alimento. Elas absorvem energia luminosa, usam dióxido de carbono do ar e água do solo, e produzem glicose e oxigênio.

Humor: o que é DNA
IA: O DNA é a molécula que carrega as instruções genéticas da vida. Tem formato de hélice dupla e contém quatro bases químicas: A, T, G e C. A ordem dessas bases determina as instruções para construir um organismo.

Humor: como funciona um computador
IA: Computadores funcionam processando dados binários (zeros e uns) através de transistores na CPU. Eles seguem um ciclo de obter instruções, decodificá-las, executá-las e armazenar resultados.

Humor: o que é internet
IA: A internet é uma rede global de computadores interconectados que se comunicam usando protocolos padronizados. Permite compartilhar informações, serviços e recursos pelo mundo em tempo real.

Humor: por que sonhamos
IA: Os cientistas acreditam que os sonhos ajudam a processar emoções e consolidar memórias do dia. Durante o sono REM, o cérebro reproduz experiências e processa sentimentos.

Humor: o que causa terremotos
IA: Terremotos acontecem quando placas tectônicas sob a superfície da Terra se movem de repente. A tensão acumulada nas falhas libera energia na forma de ondas sísmicas.

Humor: como o coração bombeia sangue
IA: O coração tem quatro câmaras que se contraem em sequência. O lado direito bombeia sangue para os pulmões, enquanto o esquerdo bombeia sangue oxigenado para o corpo. Esse ciclo acontece umas 100 mil vezes por dia.

Humor: o que é eletricidade
IA: A eletricidade é o fluxo de elétrons através de um condutor. Pode ser gerada por reações químicas, movimento, luz ou calor. Usamos ela para alimentar desde lâmpadas até smartphones.

Humor: como funcionam vacinas
IA: Vacinas ensinam seu sistema imunológico a reconhecer patógenos específicos. Introduzem uma forma enfraquecida ou inativa de um germe, desencadeando a produção de anticuerpos.

Humor: o que é mudança climática
IA: A mudança climática refere-se a mudanças de longo prazo nas temperaturas globais e padrões meteorológicos. Atividades humanas como queimar combustíveis fósiles aceleraram o aquecimento.

Humor: por que a lua muda de forma
IA: A lua não muda de forma realmente. Vemos diferentes porções de seu lado iluminado pelo sol enquanto ela orbita a Terra. Quando está entre a Terra e o sol, vemos lua nova.

Humor: o que é evolução
IA: A evolução é o processo pelo qual as espécies mudam ao longo do tempo através da seleção natural. Organismos com características melhor adaptadas sobrevivem e se reproduzem mais.

Humor: como aviões voam
IA: Aviões voam pelo princípio de Bernoulli. A forma da asa faz o ar se mover mais rápido por cima que por baixo, criando menor pressão acima da asa. Essa diferença de pressão gera sustentação.

Humor: qual é a velocidade da luz
IA: A velocidade da luz no vácuo é aproximadamente 299 mil quilômetros por segundo. Nada com massa pode viajar mais rápido que a luz.

Humor: o que é um buraco negro
IA: Um buraco negro é uma região do espaço onde a gravidade é tão forte que nada pode escapar, nem mesmo a luz. Eles se formam quando estrelas massivas colapsam ao final de sua vida.

Humor: como o cérebro armazena memórias
IA: O cérebro armazena memórias através de conexões neurais. Quando você aprende algo, neurônios formam novos caminhos. Repetir informações fortalece essas conexões.

Humor: o que é energia renovável
IA: Energia renovável vem de fontes que se replenam naturalmente, como sol, vento e água. Não se esgotam e produzem poucos gases de efeito estufa.

Humor: por que bostejamos
IA: Os cientistas acreditam que bostezar ajuda a regular a temperatura cerebral e aumentar a alerta. Também aumenta o fluxo sanguíneo. O bostezo é contagioso porque ativa neurônios-espelho.

Humor: o que é o ciclo da água
IA: O ciclo da água é o movimento contínuo da água através dos sistemas terrestres. A água evapora, forma nuvens, cai como precipitação e flui para oceanos. Esse ciclo purifica e redistribui a água.

Humor: como ímãs funcionam
IA: Ímãs funcionam pelo alinhamento de elétrons em seus átomos. Criam um campo magnético com polos norte e sul. Atraem certos metais como ferro, níquel e cobalto.

Humor: por que o oceano é salgado
IA: O oceano é salgado porque os rios arrastam minerais dissolvidos das rocas para o mar. Ao longo de milhões de anos, esses minerais se acumularam. O sal principal é o cloreto de sódio.

Humor: o que é inteligência artificial
IA: Inteligência artificial é a simulação de inteligência humana por sistemas de computador. Inclui aprendizado, raciocínio e resolução de problemas.

Humor: como funciona o GPS
IA: O GPS funciona recebendo sinais de múltiplos satélites. Seu dispositivo calcula sua posição medindo o tempo que os sinais levam para chegar de pelo menos quatro satélites.

Humor: por que as estrelas cintilam
IA: As estrelas cintilam porque sua luz passa pela atmosfera turbulenta da Terra. O ar dobra e distorce os raios de luz, fazendo o brilho aparente flutuar.

Humor: o que é o efeito estufa
IA: O efeito estufa ocorre quando gases como CO2 e metano prendem calor na atmosfera terrestre. É natural e necessário para a vida, mas o excesso de gases por atividades humanas está aquecendo o planeta demais.

Humor: como aves migram
IA: Aves migram usando a posição do sol, o campo magnético terrestre e pontos de referência. Algumas espécies percebem campos magnéticos através de proteínas especiais em seus olhos.

Humor: o que é som
IA: O som é uma vibração que viaja através de um meio como o ar. Quando objetos vibram, criam ondas de pressão que nossos ouvidos detectam.

Humor: por que temos fome
IA: Temos fome porque nosso corpo precisa de energia para funcionar. Quando o açúcar no sangue baixa, o cérebro sinaliza a necessidade de comida.

Humor: qual é o planeta maior
IA: Júpiter é o maior planeta do nosso sistema solar. É tão grande que mais de 1300 Terras caberiam dentro dele.

Humor: por que precisamos de oxigênio
IA: Precisamos de oxigênio para respirar porque nossas células o usam para converter comida em energia. Sem oxigênio, não produzimos energia suficiente e morreríamos em minutos.

Humor: o que é o universo
IA: O universo é tudo que existe: matéria, energia, espaço e tempo. Começou há 13,8 bilhões de anos com o Big Bang e tem se expandido desde então.

Humor: o que é um volcão
IA: Um vulcão é uma abertura na crosta terrestre por onde saem lava, cinzas e gases. Se formam quando magma debaixo da superfície encontra caminho para fora.

Humor: como se formam nuvens
IA: Nuvens se formam quando o ar úmido esfria e o vapor de água se condensa ao redor de partículas de poeira. A forma depende da temperatura e altitude.

Humor: por que o sol se põe
IA: O sol se põe porque a Terra gira em seu eixo. Quando sua localização se afasta do sol, você vê o sol descer no horizonte.

Humor: o que é um ecossistema
IA: Um ecossistema é uma comunidade de seres vivos que interagem entre si e com seu ambiente. Inclui plantas, animais, microrganismos e fatores não vivos.

Humor: por que os dinossauros se extinguiram
IA: Os dinossauros se extinguiram há 66 milhões de anos, provavelmente pelo impacto de um asteroide massivo. O impacto causou mudanças climáticas drásticas.

Humor: o que é o espaço exterior
IA: O espaço exterior é o vazio que existe entre os corpos celestes. Contém poeira, gás, radiação e matéria escura.

Humor: como o ouvido funciona
IA: O ouvido captura ondas de som que fazem vibrar o tímpano. Essas vibrações se transmitem por três ossos pequenos até a cóclea, que as converte em sinais elétricos para o cérebro.

Humor: o que são vitaminas
IA: Vitaminas são compostos orgânicos que seu corpo precisa em pequenas quantidades para funcionar bem. Suportam crescimento, digestão e saúde imunológica.

Humor: por que precisamos de comida
IA: Precisamos de comida para obter energia, nutrientes e materiais de construção para nosso corpo. Os alimentos contêm carboidratos, proteínas, gorduras, vitaminas e minerais.

Humor: o que é o cérebro
IA: O cérebro é o centro de controle do sistema nervoso. Processa informações sensoriais, controla movimentos, gerencia emoções e lida com pensamento e memória.

Humor: como as plantas bebem água
IA: As plantas bebem água através de suas raízes. A água sobe por tubos diminutos no caule chamados xilema, puxada pela transpiração.

Humor: o que é matéria escura
IA: A matéria escura é uma forma de matéria que não emite nem reflete luz. Não podemos vê-la diretamente, mas sabemos que existe por seus efeitos gravitacionais.

Humor: como se forma um arco-íris
IA: Um arco-íris se forma quando a luz solar passa através de gotas de chuva. As gotas refratam e dispersam a luz, separando-a em suas cores constituintes.

Humor: o que é sonar
IA: Sonar é uma tecnologia que usa ondas de som para detectar objetos sob a água. Envia pulsos de som e mede o tempo que levam para voltar.

Humor: por que gatos ronronam
IA: Gatos ronronam vibrando suas cordas vocais. Geralmente o fazem quando estão contentes, mas também quando estressados para se auto-acalmar.

Humor: como o nariz cheira
IA: O nariz cheira quando moléculas de cheiro se ligam a células receptoras na cavidade nasal. Essas células enviam sinais para o bulbo olfatório, que interpreta o cheiro.

Humor: o que é um planeta
IA: Um planeta é um corpo celeste que orbita uma estrela, tem forma esférica e limpou sua órbita de outros objetos. Nosso sistema solar tem oito planetas.

Humor: por que existem estações do ano
IA: As estações existem porque o eixo da Terra está inclinado 23,5 graus. Quando seu hemisfério está inclinado em direção ao sol, é verão.

Humor: o que é magnetismo
IA: O magnetismo é uma força causada pelo movimento de elétrons. Ímãs têm polos norte e sul que se atraem ou repelem. Campos magnéticos cercam os ímãs.

Humor: como o fogo se forma
IA: O fogo se forma quando três elementos se encontram: combustível, oxigênio e calor. Quando o combustível se aquece o suficiente, se acende e libera energia como luz e calor.

Humor: por que peixes respiram debaixo d'água
IA: Peixes respiram debaixo d'água usando brânquias. As brânquias extraem oxigênio dissolvido na água enquanto ela passa sobre elas.

Humor: o que é matéria
IA: Matéria é tudo que tem massa e ocupa espaço. É feita de átomos, que por sua vez são feitos de prótons, nêutrons e elétrons.

Humor: o que é energia
IA: Energia é a capacidade de fazer trabalho ou causar mudança. Existe em muitas formas: cinética, potencial, térmica, química, elétrica e nuclear.

Humor: como o sol nos dá luz
IA: O sol produz luz através de fusão nuclear em seu núcleo. Átomos de hidrogênio se fundem para formar hélio, liberando enormes quantidades de energia.

Humor: por que precisamos dormir
IA: Precisamos dormir para restaurar corpo e mente. Durante o sono, o cérebro consolida memórias, remove produtos de waste e repara tecidos. Adultos precisam de 7 a 9 horas por noite.

Humor: o que é o vento
IA: O vento é ar em movimento. Se produz por diferenças de pressão atmosférica causadas pelo aquecimento desigual da Terra pelo sol.

Humor: como a luz viaja
IA: A luz viaja em ondas eletromagnéticas pelo espaço. No vácuo, viaja a cerca de 300 mil quilômetros por segundo. Pode viajar através do ar, água e alguns materiais transparentes.

Humor: o que é energia solar
IA: Energia solar é a energia que vem do sol. Pode ser capturada com painéis solares que a convertem em eletricidade. É uma fonte limpa e renovável.

Humor: por que pássaros voam
IA: Pássaros voam porque têm asas aerodinâmicas, ossos leves e músculos potentes. O bater de asas cria sustentação e empuxo.

Humor: o que é a Lua
IA: A Lua é o satélite natural da Terra, orbitando a cerca de 384 mil quilômetros. Afeta as marés oceânicas, estabiliza o eixo da Terra e fornece luz noturna.

Humor: por que a Lua brilha
IA: A Lua brilha porque reflete a luz do sol. Não produz luz própria. A quantidade de superfície iluminada que vemos determina as fases da Lua.""",
}

# Salvar dados
all_text = ""
for name, content in DATASETS.items():
    path = os.path.join(DATA_DIR, name)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    all_text += content + "\n"
    print(f"  {name}: {len(content.split(chr(10)))} linhas")

print(f"\nTotal: {len(all_text.split(chr(10)))} linhas de dados")

# ==========================================
# TOKENIZER
# ==========================================
print("\n[2/4] Carregando tokenizer...")
MODEL_NAME = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
tokenizer.pad_token = tokenizer.eos_token

# ==========================================
# MODELO — QLoRA (4-bit, cabe na T4)
# ==========================================
print("\n[3/4] Carregando modelo 5B com QLoRA...")

# Usar Mistral 7B com 4-bit quantization (QLoRA)
MODEL_NAME = "mistralai/Mistral-7B-v0.1"

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True,
)

model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    quantization_config=bnb_config,
    device_map="auto",
    trust_remote_code=True,
)
model = prepare_model_for_kbit_training(model)

# LoRA — treinar só 0.1% dos parâmetros (rápido e leve)
lora_config = LoraConfig(
    r=8,
    lora_alpha=16,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
)
model = get_peft_model(model, lora_config)
model.print_trainable_parameters()

# ==========================================
# DATASET
# ==========================================
print("\n[4/4] Preparando dataset...")

# Converter texto em pares de conversa
pairs = []
lines = all_text.strip().split("\n")
i = 0
while i < len(lines) - 1:
    line = lines[i].strip()
    next_line = lines[i + 1].strip() if i + 1 < len(lines) else ""
    if line.startswith("Humor:") and next_line.startswith("IA:"):
        user_msg = line.replace("Humor:", "").strip()
        ai_msg = next_line.replace("IA:", "").strip()
        pairs.append({
            "text": f"<s>[INST] {user_msg} [/INST] {ai_msg}</s>"
        })
        i += 2
    else:
        i += 1

dataset = Dataset.from_list(pairs)
dataset = dataset.train_test_split(test_size=0.05)

print(f"  Pares de treino: {len(dataset['train'])}")
print(f"  Pares de teste: {len(dataset['test'])}")

# ==========================================
# TREINO
# ==========================================
print("\n" + "=" * 60)
print("BRANPY 5B — INICIANDO TREINO QLoRA")
print("=" * 60)

training_args = TrainingArguments(
    output_dir="/content/branpy-5b-output",
    num_train_epochs=3,
    per_device_train_batch_size=2,
    gradient_accumulation_steps=8,
    learning_rate=2e-4,
    warmup_steps=50,
    logging_steps=10,
    save_steps=100,
    save_total_limit=2,
    fp16=True,
    optim="paged_adamw_8bit",
    report_to="none",
    remove_unused_columns=False,
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset["train"],
    eval_dataset=dataset["test"],
    data_collator=DataCollatorForLanguageModeling(tokenizer, mlm=False),
)

print("Treinando... (vai demorar ~1-2 horas na T4)")
trainer.train()

# ==========================================
# SALVAR
# ==========================================
SAVE_DIR = "/content/branpy-5b-final"
model.save_pretrained(SAVE_DIR)
tokenizer.save_pretrained(SAVE_DIR)

print("\n" + "=" * 60)
print("BRANPY 5B — TREINO CONCLUÍDO!")
print(f"Modelo salvo em: {SAVE_DIR}")
print("Baixe a pasta branpy-5b-final do Colab")
print("=" * 60)

# ==========================================
# TESTE
# ==========================================
print("\n[TESTE] Gerando texto...")
test_prompts = ["oi", "me conta sobre o Brasil", "o que é inteligência artificial"]
for prompt in test_prompts:
    inputs = tokenizer(f"<s>[INST] {prompt} [/INST]", return_tensors="pt").to("cuda")
    outputs = model.generate(**inputs, max_new_tokens=100, temperature=0.7)
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    print(f"\n{prompt} -> {response}")
