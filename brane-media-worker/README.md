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
