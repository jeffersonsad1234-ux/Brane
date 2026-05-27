# 🎯 BrandPy AI Tools - API Mapping

## Arquitetura Padrão (como AI Chat)
```
Frontend → /api/* → Backend Proxy → API Externa → JSON Limpo
```

## 🔧 Ferramentas e APIs Escolhidas

### 1. ✅ AI Chat (JÁ IMPLEMENTADO)
- API: Groq
- Endpoint: `/api/chat` (SSE streaming)
- Key: `GROQ_API_KEY`
- Status: FUNCIONAL

### 2. 🎬 AI Video Generator
- API: **Replicate** (AnimateDiff/Stable Video Diffusion) OU **HuggingFace** (AnimateDiff)
- Endpoint: `/api/generate-video`
- Key: `REPLICATE_API_KEY` ou `HUGGINGFACE_API_KEY`
- Modelo: text-to-video
- Formato: MP4 base64

### 3. 🎥 AI Movie Generator
- API: **Runway ML** (RunwayML Gen-2) OU **Replicate** (long-form video)
- Endpoint: `/api/generate-movie`
- Key: `REPLICATE_API_KEY`
- Modelo: Long-form video generation
- Formato: MP4 base64

### 4. 🖼️ Image Generator (IMPLEMENTADO)
- API: **HuggingFace** (Stable Diffusion XL)
- Endpoint: `/api/generate-image`
- Key: `HUGGINGFACE_API_KEY`
- Status: FUNCIONAL

### 5. 🎨 AI Art Generator
- API: **HuggingFace** (Stable Diffusion + ControlNet)
- Endpoint: `/api/generate-art`
- Key: `HUGGINGFACE_API_KEY`
- Modelo: artistic styles
- Formato: PNG base64

### 6. 🎤 Voice Studio (IMPLEMENTADO)
- API: **Edge-TTS** (Microsoft - FREE)
- Endpoint: `/api/text-to-speech`
- Key: Nenhuma (100% grátis)
- Status: FUNCIONAL

### 7. 🔊 SoundFX Studio
- API: **AudioCraft** (Meta) via HuggingFace OU **ElevenLabs** free tier
- Endpoint: `/api/generate-soundfx`
- Key: `ELEVENLABS_API_KEY` ou `HUGGINGFACE_API_KEY`
- Formato: WAV/MP3 base64

### 8. 🎵 Music Generator
- API: **MusicGen** (Meta) via Replicate OU **Suno** free tier
- Endpoint: `/api/generate-music`
- Key: `REPLICATE_API_KEY`
- Formato: MP3 base64

### 9. 📝 Subtitle Studio
- API: **Whisper** via Replicate OU **AssemblyAI** free
- Endpoint: `/api/generate-subtitles`
- Key: `REPLICATE_API_KEY` ou `ASSEMBLYAI_API_KEY`
- Formato: SRT text

### 10. 🎙️ AI Dub Studio
- API: **Whisper** (transcription) + **Edge-TTS** (voice)
- Endpoint: `/api/dub-audio`
- Key: `REPLICATE_API_KEY` (para Whisper)
- Processo: audio → text → translate → TTS

### 11. 📻 Transcription AI
- API: **Whisper** via Replicate
- Endpoint: `/api/transcribe`
- Key: `REPLICATE_API_KEY`
- Formato: JSON com texto

### 12. 👤 AI Avatars
- API: **HeyGen** free tier OU **D-ID** free OU **Pollinations**
- Endpoint: `/api/generate-avatar`
- Key: `POLLINATIONS_API_KEY` ou nenhuma (Pollinations é grátis)
- Formato: PNG base64

### 13. 📄 Document AI
- API: **PyPDF2** (local) + **Groq** (para análise)
- Endpoint: `/api/analyze-document`
- Key: `GROQ_API_KEY`
- Features: extract, summarize, Q&A

### 14. 📊 Presentation Builder (IMPLEMENTADO)
- API: **python-pptx** (local, sem API key)
- Endpoint: `/api/generate-presentation`
- Key: Nenhuma (local)
- Formato: PPTX base64

### 15. 🌐 AI Browser (IMPLEMENTADO)
- API: **DuckDuckGo** (grátis, sem key) OU **Serper** (1000 req/mês grátis)
- Endpoint: `/api/web-search`
- Key: Nenhuma (DuckDuckGo) ou `SERPER_API_KEY`
- Status: FUNCIONAL

### 16. 📦 Product Importer
- API: **Scraping** (BeautifulSoup) + **Groq** (para descrições)
- Endpoint: `/api/import-product`
- Key: `GROQ_API_KEY`
- Features: URL → product data → AI description

### 17. 🤖 Automation Hub
- API: **N8N** self-hosted OU **Zapier** webhook OU logic interno
- Endpoint: `/api/create-workflow`
- Key: Depende do escolhido
- Features: workflow automation

### 18. ⚡ AI Creator Engine
- API: **Combinação** de várias APIs (Image + Video + Text)
- Endpoint: `/api/create-content`
- Key: Mesmas keys acima
- Features: content creation pipeline

### 19. 🌍 AI Influencer
- API: **Groq** (text) + **HuggingFace** (image) + **Replicate** (video)
- Endpoint: `/api/influencer-content`
- Key: `GROQ_API_KEY`, `HUGGINGFACE_API_KEY`
- Features: persona-based content

### 20. 🎮 World Builder
- API: **Stable Diffusion** (panoramas) + **Groq** (descriptions)
- Endpoint: `/api/generate-world`
- Key: `HUGGINGFACE_API_KEY`, `GROQ_API_KEY`
- Features: world/environment generation

### 21. 📡 AI Stream Host
- API: **Groq** (chat) + **Edge-TTS** (voice) + **WebRTC**
- Endpoint: `/api/stream-host`
- Key: `GROQ_API_KEY`
- Features: AI-powered live streaming

---

## 🔑 Variáveis de Ambiente Necessárias

```bash
# Core APIs (obrigatórias)
GROQ_API_KEY=gsk_xxxxx
HUGGINGFACE_API_KEY=hf_xxxxx
REPLICATE_API_KEY=r8_xxxxx

# Opcionais (para features avançadas)
ELEVENLABS_API_KEY=xxxxx
ASSEMBLYAI_API_KEY=xxxxx
SERPER_API_KEY=xxxxx
POLLINATIONS_API_KEY=xxxxx  # (se necessário)
```

---

## 📊 Resumo de Prioridades

**Tier 1 - APIs Principais (OBRIGATÓRIAS):**
- Groq → Chat, Document AI, Product Importer
- HuggingFace → Image, Video, Art, Avatars
- Edge-TTS → Voice (FREE, sem key)

**Tier 2 - APIs Secundárias (RECOMENDADAS):**
- Replicate → Video, Music, Subtitles, Transcription
- python-pptx → Presentations (FREE, local)
- DuckDuckGo → Web Search (FREE, sem key)

**Tier 3 - APIs Opcionais:**
- ElevenLabs → SoundFX (alternativa)
- AssemblyAI → Subtitles (alternativa)
- Serper → Web Search (alternativa)

---

## ✅ Status de Implementação

- [x] 1. AI Chat
- [x] 4. Image Generator
- [x] 6. Voice Studio
- [x] 14. Presentation Builder
- [x] 15. AI Browser
- [ ] 2. AI Video Generator (backend ready, precisa fix)
- [ ] 3. AI Movie Generator
- [ ] 5. AI Art Generator
- [ ] 7. SoundFX Studio
- [ ] 8. Music Generator
- [ ] 9. Subtitle Studio
- [ ] 10. AI Dub Studio
- [ ] 11. Transcription AI
- [ ] 12. AI Avatars
- [ ] 13. Document AI
- [ ] 16. Product Importer
- [ ] 17. Automation Hub
- [ ] 18. AI Creator Engine
- [ ] 19. AI Influencer
- [ ] 20. World Builder
- [ ] 21. AI Stream Host

**Progresso:** 5/21 ferramentas (24%)

---

## 🎯 Próximos Passos

1. Implementar todos os endpoints backend
2. Criar/atualizar todos os frontends
3. Garantir JSON válido sempre
4. Testar cada ferramenta
5. Deploy e validação
