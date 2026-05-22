# brane-media-worker

Módulo separado para geração de mídia pesada (voz, avatar, personagem IA, render).

## Motivação

O painel React **não deve** gerar mídia pesada diretamente:
- TTS (text-to-speech) com edge-tts ou similar
- Avatares animados com IA
- Personagens virtuais com sincronia labial
- Renderização pesada de vídeo com sobreposições

O React envia apenas o **pedido** (texto, voz, persona) e recebe o **MP4/WAV pronto**.

## Arquitetura Futura

```
React (Cloudflare Pages)
    │
    │  POST /api/media (texto + voz + persona)
    ▼
brane-media-worker (Railway / Worker)
    │
    ├── TTS Engine (edge-tts / OpenAI TTS)
    ├── Avatar Engine (sincronia labial / personagem)
    ├── Video Render (FFmpeg / Canvas Server)
    │
    ▼
    Retorna MP4 + WAV para o React
```

## Status Atual

- [ ] TTS: não implementado
- [ ] Avatar: não implementado
- [ ] Render pesado: não implementado
- [ ] API endpoints: não implementados

## Stack Planejada

- Python + FastAPI (servidor de mídia)
- edge-tts (voz natural gratuita)
- FFmpeg (render e mixagem)
- (Opcional) OpenAI TTS para vozes premium
- (Opcional) Live2D / Ready Player Me para avatares

## Uso (futuro)

```bash
cd brane-media-worker
pip install -r requirements.txt
python server.py
```

O React apontará `REACT_APP_MEDIA_API` para este servidor.
