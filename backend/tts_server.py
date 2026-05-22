"""
Standalone TTS server — edge-tts + ffmpeg, no MongoDB dependency.
Run:  python tts_server.py
Uses edge-tts (free, no API key) with FFmpeg for audio normalization.
"""
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import edge_tts
import subprocess
import tempfile
import json
import uuid
import asyncio
import logging
import os
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(asctime)s [TTS] %(message)s')
logger = logging.getLogger('tts')

app = FastAPI(title='BRANE TTS Server')
app.add_middleware(CORSMiddleware, allow_origin_regex=r'.*', allow_credentials=True, allow_methods=['*'], allow_headers=['*'])

TEMP_DIR = Path(tempfile.gettempdir()) / 'brane-tts'
TEMP_DIR.mkdir(exist_ok=True)

TTS_VOICES = [
    'pt-BR-FranciscaNeural',
    'pt-BR-ThalitaNeural',
    'pt-BR-AntonioNeural',
    'pt-BR-YaraNeural',
    'pt-BR-FabioNeural',
    'pt-BR-BrendaNeural',
    'pt-BR-JulioNeural',
    'pt-BR-LeilaNeural',
    'pt-BR-DonatoNeural',
    'pt-BR-ElzaNeural',
    'pt-BR-GiovannaNeural',
    'pt-BR-HumbertoNeural',
    'pt-BR-ManuelaNeural',
    'pt-BR-NicolasNeural',
    'pt-BR-ValeriaNeural',
    'pt-BR-LeticiaNeural',
]

class TTSRequest(BaseModel):
    text: str
    voice: str = 'pt-BR-FranciscaNeural'
    rate: str = '+0%'
    pitch: str = '+0Hz'

@app.get('/')
async def root():
    return {'status': 'ok', 'service': 'tts', 'voices': TTS_VOICES}

@app.get('/health')
async def health():
    return {'status': 'ok'}

@app.post('/api/tts', response_class=FileResponse)
async def generate_tts(req: TTSRequest):
    if not req.text or len(req.text.strip()) < 2:
        raise HTTPException(status_code=400, detail='Texto muito curto')

    text = req.text.strip()[:5000]
    voice = req.voice if req.voice in TTS_VOICES else 'pt-BR-FranciscaNeural'
    voices_to_try = [voice] + [v for v in TTS_VOICES if v != voice]

    last_error = None

    for attempt, v in enumerate(voices_to_try[:5]):
        uid = f'tts_{uuid.uuid4().hex[:10]}'
        mp3_path = TEMP_DIR / f'{uid}.mp3'
        wav_path = TEMP_DIR / f'{uid}.wav'

        try:
            logger.info(f'Attempt {attempt+1}: {v}')
            tts = edge_tts.Communicate(text=text, voice=v, rate=req.rate, pitch=req.pitch)
            await tts.save(str(mp3_path))

            if not mp3_path.exists() or mp3_path.stat().st_size < 200:
                raise ValueError(f'Arquivo muito pequeno: {mp3_path.stat().st_size if mp3_path.exists() else 0} bytes')

            duration_s = 0
            final_path = mp3_path
            media_type = 'audio/mpeg'
            codec = 'mp3'

            try:
                probe = subprocess.run(
                    ['ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_streams', str(mp3_path)],
                    capture_output=True, text=True, timeout=10
                )
                info = json.loads(probe.stdout)
                if info.get('streams'):
                    duration_s = round(float(info['streams'][0].get('duration', 0)))
            except:
                pass

            # FFmpeg normalization
            try:
                subprocess.run(
                    ['ffmpeg', '-y',
                     '-i', str(mp3_path),
                     '-acodec', 'pcm_s16le',
                     '-ar', '24000',
                     '-ac', '1',
                     '-af', 'loudnorm=I=-16:LRA=11:TP=-1.5',
                     str(wav_path)],
                    check=True, capture_output=True, text=True, timeout=30
                )
                final_path = wav_path
                media_type = 'audio/wav'
                codec = 'pcm_s16le'

                try:
                    probe2 = subprocess.run(
                        ['ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_streams', str(wav_path)],
                        capture_output=True, text=True, timeout=10
                    )
                    info2 = json.loads(probe2.stdout)
                    if info2.get('streams'):
                        duration_s = round(float(info2['streams'][0].get('duration', 0)))
                except:
                    pass
            except (subprocess.TimeoutExpired, subprocess.CalledProcessError) as ff_err:
                logger.warning(f'FFmpeg failed, using raw MP3: {ff_err}')

            size_kb = round(final_path.stat().st_size / 1024, 1)
            logger.info(f'OK: {v} | {size_kb}KB | {duration_s}s | {codec}')

            response = FileResponse(
                path=str(final_path),
                media_type=media_type,
                filename=f'tts_{uid}.{final_path.suffix[1:]}',
                headers={
                    'X-TTS-Voice': v,
                    'X-TTS-Duration': str(duration_s),
                    'X-TTS-Size': str(size_kb),
                    'X-TTS-Codec': codec,
                    'X-TTS-SampleRate': '24000',
                }
            )

            async def cleanup(paths=[mp3_path, wav_path]):
                await asyncio.sleep(5)
                for p in paths:
                    try:
                        if p.exists(): p.unlink()
                    except: pass

            asyncio.create_task(cleanup())
            return response

        except Exception as e:
            last_error = str(e)
            logger.error(f'{v} failed: {e}')
            for p in [mp3_path, wav_path]:
                try:
                    if p.exists(): p.unlink()
                except: pass
            continue

    logger.error(f'All {len(voices_to_try)} attempts failed')
    return JSONResponse(
        status_code=502,
        content={'error': f'TTS falhou: {last_error}', 'attempts': len(voices_to_try)}
    )

if __name__ == '__main__':
    import uvicorn
    port = int(os.environ.get('TTS_PORT', 3200))
    logger.info(f'Starting TTS server on port {port}')
    uvicorn.run('tts_server:app', host='0.0.0.0', port=port)
