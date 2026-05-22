# Brane Media Worker — UGC AI Ads

Worker separado do painel React para geração de **vídeos UGC AI Ads** (estilo CreateUGC).

Recebe dados da campanha via API REST, gera frames com Pillow, compila MP4 com FFmpeg, e disponibiliza o vídeo pronto para download.

---

## Como funciona

```
React (Cloudflare Pages)
    │  POST /jobs  { productName, productImageUrl, price, ... }
    ▼
brane-media-worker (FastAPI + FFmpeg)
    │
    ├── 1. Baixa imagem do produto
    ├── 2. Gera frames (Pillow) — cenas UGC
    ├── 3. Compila MP4 com áudio (FFmpeg)
    │
    ▼
    GET /videos/{jobId}.mp4  ← URL pronta
```

O React envia apenas os **dados**. O worker devolve a **URL do MP4**.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| API | FastAPI (Python) |
| Imagens | Pillow (PIL) |
| Vídeo | FFmpeg (subprocess) |
| HTTP | httpx |
| Async | threading + fila em memória |

---

## Instalação

```bash
cd brane-media-worker

# Dependências Python
pip install -r requirements.txt

# FFmpeg (obrigatório)
# Windows: winget install ffmpeg  ou  choco install ffmpeg
# Linux:   sudo apt install ffmpeg
# macOS:   brew install ffmpeg
```

## Uso

```bash
python server.py
# Servidor em http://localhost:3200
```

---

## API

### POST /jobs

Criar um job de geração de vídeo UGC.

```json
{
  "productName": "Fone Bluetooth X200",
  "productImageUrl": "https://images-na.ssl-images-amazon.com/images/I/...jpg",
  "price": 89.90,
  "oldPrice": 149.90,
  "affiliateLink": "https://amzn.to/...",
  "description": "Cancelamento de ruído, bateria 30h, carregamento rápido",
  "category": "tecnologia",
  "tone": "entusiasmado",
  "avatarStyle": "profissional"
}
```

Resposta:
```json
{
  "jobId": "a1b2c3d4e5f6",
  "status": "pending",
  "message": "Job criado. Use GET /jobs/{jobId} para acompanhar."
}
```

### GET /jobs/{jobId}

Status do job:
```json
{
  "jobId": "a1b2c3d4e5f6",
  "status": "done",
  "progress": 1.0,
  "videoUrl": "/videos/a1b2c3d4e5f6.mp4",
  "logs": ["✅ UGC Ad finalizado com sucesso"],
  "createdAt": "2026-05-22T11:00:00+00:00"
}
```

### GET /videos/{filename}.mp4

Download do vídeo MP4 gerado.

### GET /health

Health check + status da fila.

### POST /api/jobs (Mock)

Cria um job UGC simulado. Retorna imediatamente com `jobId`.  
O job transita automaticamente por `pending → running → rendering → done` (~12s).

### GET /api/jobs/{jobId} (Mock)

Status do job simulado com progresso e logs.

---

## Integração com o Frontend

No React, defina as variáveis de ambiente:

```bash
REACT_APP_MEDIA_WORKER_URL=http://localhost:3200
REACT_APP_MEDIA_WORKER_API_KEY=opcional
```

Ou no deploy (Cloudflare Pages / Railway):

```bash
# Dashboard → Environment Variables
MEDIA_WORKER_URL = https://seu-worker.up.railway.app
```

Quando configurado, o painel exibe um botão **"Gerar vídeo UGC com apresentador"** na página de campanha.

### Fluxo Frontend → Worker

```
1. Usuário clica "Gerar vídeo UGC com apresentador"
2. React → POST /api/jobs { productName, productImageUrl, price, ... }
3. Worker → { jobId: "abc123", status: "pending" }
4. React faz polling GET /api/jobs/abc123 a cada 2.5s
5. Worker → { status: "running" } → { status: "rendering" } → { status: "done", videoUrl: "..." }
6. React exibe preview do vídeo UGC
7. Usuário escolhe: usar UGC ou manter vídeo visual atual
8. Publicação usa o vídeo selecionado
```

### Substituição por API Real (HeyGen / D-ID / Tavus / Runway)

Para trocar o mock por um serviço real:

1. Crie um novo módulo em `worker/providers/`
2. Implemente a integração com a API (ex: `heygen_provider.py`)
3. No `server.py`, aponte o endpoint `/api/jobs` para o provider real
4. Atualize o mapeamento de status

Exemplo de provider:

```python
# worker/providers/heygen_provider.py
async def create_heygen_video(product_data: dict) -> dict:
    # Chama API HeyGen
    # Retorna { jobId, status }
    pass
```

---

## Estrutura de Cenas

O vídeo UGC tem 5 cenas no formato 9:16 (540×960):

| Cena | Duração | Conteúdo |
|------|---------|----------|
| **Intro** | 5s | Avatar placeholder + nome do produto + "Confira essa oferta!" |
| **Showcase** | 7s | Produto em destaque com zoom + nome + legenda |
| **Benefícios** | 6s | 3 vantagens extraídas da descrição (fade-in) |
| **Preço** | 6s | Preço antigo riscado + preço novo pulsante + selo PROMOÇÃO |
| **CTA** | 6s | "Link na bio!" + URL + seta animada |

**Tema tech/gamer**: fundo escuro neon com partículas RGB.
**Tema padrão**: gradiente escuro azul-profundo.

---

## Fases do Projeto

### Fase 1 ✅ — Template UGC com Produto Real (atual)
- Geração de frames via Pillow
- Imagem real do produto baixada da URL
- Avatar placeholder estilizado (gradiente geométrico)
- Legendas grandes, animações de fade/zoom/pulse
- Música de fundo (tom simples via FFmpeg)
- Exportação MP4 com FFmpeg
- Job queue, endpoints REST

### Fase 2 🔜 — Voz IA
- edge-tts ou OpenAI TTS para narração
- Sincronia com as cenas
- Mix de voiceover com música

### Fase 3 🔜 — Avatar / Lip Sync
- Avatar animado com sincronia labial
- Rhubarb Lip Sync ou similar
- Expressões faciais básicas

### Fase 4 🔜 — Personagem Realista com API Externa
- Integração com API de avatar realista (ex: HeyGen, D-ID)
- Personagem personalizado apresentando o produto
- Voz natural com entonação
- Fundo personalizado por categoria

---

## Configuração

Variáveis de ambiente:

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `PORT` | 3200 | Porta do servidor |
| `OUTPUT_DIR` | `./outputs` | Pasta de vídeos gerados |
| `MAX_JOBS` | 50 | Jobs simultâneos máximos |
| `FPS` | 24 | Quadros por segundo |

---

## Deploy (Railway)

```bash
# railway.toml
[build]
  builder = "nixpacks"
  buildCommand = "pip install -r requirements.txt"

[deploy]
  startCommand = "python server.py"
```

Ou Docker:

```dockerfile
FROM python:3.11-slim
RUN apt-get update && apt-get install -y ffmpeg
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
CMD ["python", "server.py"]
```

---

## Roadmap Curto

- [x] Estrutura inicial do worker
- [x] Template UGC com 5 cenas
- [x] Download de imagem do produto
- [x] Renderização com Pillow
- [x] Compilação MP4 com FFmpeg
- [x] API REST + job queue
- [ ] Voz IA (edge-tts)
- [ ] Avatar animado
- [ ] Personagem realista
- [ ] Thumbnail automática
- [ ] Webhook de callback
