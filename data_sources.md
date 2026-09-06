# DATA SOURCES — BRANPY AI FOUNDATION MODEL v1

Data de criacao: 12/07/2026
Responsavel: branpy.com.br
Versao do modelo: v1

---

## FONTES DE DADOS UTILIZADAS NO TREINO FINAL

### 1. generate_smart.py (PRINCIPAL)

| Campo | Valor |
|---|---|
| Arquivo | `from_scratch/generate_smart.py` |
| Metodo | Combinacao dimensional de ~20 listas hardcoded via itertools.product |
| Conteudo | Perguntas de programacao, conversas casuais, ensino, opinioes, multi-turno, codigo |
| Linhas geradas | ~28.000 |
| Fonte externa | NENHUMA |
| Modelo utilizado | NENHUM |
| Data de criacao | 12/07/2026 |
| Licenca | Nenhuma (dados funcionais) |

### 2. generate_combined.py (SECUNDARIO)

| Campo | Valor |
|---|---|
| Arquivo | `from_scratch/generate_combined.py` |
| Metodo | Templates programaticos + fatos publicos hardcoded |
| Conteudo | 9 linguagens x 15 topicos, 8 areas de vida, 8 fatos de ciencia, 10 respostas rapidas, 35 fatos gerais |
| Linhas geradas | ~675 |
| Fonte externa | NENHUMA |
| Modelo utilizado | NENHUM |
| Data de criacao | 12/07/2026 |
| Licenca | Nenhuma (dados funcionais) |

### Dataset total do treino final

| Campo | Valor |
|---|---|
| Total de linhas | 28.675 |
| Pares pergunta-resposta | 14.168 |
| Tokens no vocabulario | 1.054 |
| Unicidade | ~95% |

---

## FONTES REMOVIDAS (arquivadas)

### generate_combined.py (versao anterior com Ollama — REMOVIDA)

| Campo | Valor |
|---|---|
| Metodo | Chamadas a API Ollama (localhost:11434) com modelo dolphin-phi:latest |
| Conteudo | ~480 pares de conversas geradas por modelo externo |
| Status | REMOVIDA em 12/07/2026 |
| Motivo | Dependencia de modelo externo (dolphin-phi) |

### train_lora.py (REMOVIDO)

| Campo | Valor |
|---|---|
| Metodo | LoRA fine-tuning sobre Qwen/Qwen2.5-1.5B-Instruct |
| Status | REMOVIDO em 12/07/2026 |
| Motivo | Dependencia total de modelo externo (Qwen) |

### GGUFs de terceiros (REMOVIDOS)

| Arquivo | Origem | Status |
|---|---|---|
| bran9bpy-1.5b.gguf | Copia do qwen2.5-coder:1.5b | MOVIDO para archive/third_party/ |
| bran9bpy-base-uncensored.gguf | Copia do dolphin-phi:latest | MOVIDO para archive/third_party/ |
| bran9bpy-lora/ | LoRA adapter sobre Qwen | MOVIDO para archive/third_party/ |

---

## PIPELINE DE TREINO FINAL

```
generate_smart.py (~28K linhas, templates combinatórios)
    + generate_combined.py (~675 linhas, templates + fatos)
    = corpus_final.txt (28.675 linhas)
    → tokenizer BPE proprio (1.054 tokens, treinado no corpus)
    → modelo transformer proprio (5.14M params, pesos aleatórios)
    → treino do zero (AdamW + CosineAnnealing, 10 epochs)
    → weights/bran9bpy_final/model_final.pt
```

### Cadeia de propriedade

| Componente | Proprietario | Metodo de criacao |
|---|---|---|
| Codigo-fonte | branpy.com.br | Escrito pela equipe |
| Arquitetura | branpy.com.br | Implementacao propria do Transformer |
| Tokenizer | branpy.com.br | BPE treinado do zero no corpus proprio |
| Dataset | branpy.com.br | 28.675 linhas de templates + fatos hardcoded |
| Pesos | branpy.com.br | Treinamento do zero com pesos aleatorios |
| Checkpoints | branpy.com.br | Salvos pelo treino proprio |

---

## MODELO 100% CRU — SEM FILTROS, SEM RESTRICOES, SEM ALINHAMENTO

| Aspecto | Status |
|---|---|
| RLHF (Reinforcement Learning from Human Feedback) | **NAO UTILIZADO** |
| Safety training | **NAO UTILIZADO** |
| Content filtering no treino | **NAO UTILIZADO** |
| Alinhamento comportamental | **NAO UTILIZADO** |
| Refusos programaticos | **NAO UTILIZADO** |
| System prompts de seguranca | **NAO UTILIZADO** |
| Dados de seguranca/toxicidade | **NAO UTILIZADOS** |

O modelo e **puro next-token prediction** — aprende a prever o proximo token baseado nos dados de treino. Sem camada de seguranca, sem comportamento condicionado.

### Controle de restricoes

Toda restricao, filtro ou limite e controlado pelo **app** (PolicyManager, AIBridge), NUNCA pelo modelo. O usuario (Paulo/branpy.com.br) decide:
- O que o modelo pode responder
- Quais topicos sao restritos
- Quais filtros aplicar
- Quais seguranças manter

O modelo em si e uma ferramenta bruta — como um motor sem freio. Voce coloca o freio onde quiser.

---

## DECLARACAO

Declaro que todos os dados de treinamento foram criados pela branpy.com.br, utilizando apenas:
- Strings hardcoded no codigo-fonte
- Templates combinatorios algoritmicos
- Fatos publicos de dominio publico

Nenhum dataset comercial, dataset com licenca restritiva, scraping web ou texto protegido foi utilizado.

Nenhum modelo externo (Llama, Mistral, Qwen, Dolphin, GPT, Gemma, Phi ou similar) foi utilizado para gerar dados de treinamento.
