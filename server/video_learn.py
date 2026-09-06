import os
import json
import uuid
import threading
import subprocess
import tempfile
import shutil
from pathlib import Path
from typing import Dict, Any, Optional, Callable
from knowledge import KnowledgeBase


class VideoLearner:
    def __init__(self, kb: KnowledgeBase):
        self.kb = kb
        self._jobs: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()

    def _update_job(self, job_id: str, **kwargs):
        with self._lock:
            if job_id in self._jobs:
                self._jobs[job_id].update(kwargs)

    def _run_yt_dlp(self, url: str, output_path: str) -> bool:
        try:
            cmd = [
                "py", "-3", "-m", "yt_dlp",
                "-f", "bestaudio/best",
                "--extract-audio",
                "--audio-format", "wav",
                "--audio-quality", "0",
                "-o", output_path,
                "--no-playlist",
                "--quiet",
                "--no-warnings",
                url
            ]
            print(f"[VIDEO_LEARN] Executando: {' '.join(cmd)}", flush=True)
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            print(f"[VIDEO_LEARN] returncode={result.returncode}", flush=True)
            if result.stdout:
                print(f"[VIDEO_LEARN] stdout: {result.stdout[:500]}", flush=True)
            if result.stderr:
                print(f"[VIDEO_LEARN] stderr: {result.stderr[:500]}", flush=True)
            
            # yt-dlp com --audio-format wav cria o arquivo exatamente no output_path
            if os.path.exists(output_path):
                print(f"[VIDEO_LEARN] Arquivo encontrado: {output_path}", flush=True)
                return True
            
            # Tentar variações
            for ext in ['.wav', '.webm', '.m4a', '.opus']:
                test_path = output_path.replace('.wav', ext)
                if os.path.exists(test_path):
                    print(f"[VIDEO_LEARN] Arquivo encontrado com ext {ext}: {test_path}", flush=True)
                    return True
            
            print(f"[VIDEO_LEARN] Arquivo NAO encontrado em: {output_path}", flush=True)
            return False
        except Exception as e:
            print(f"[VIDEO_LEARN] Excecao: {e}", flush=True)
            return False

    def _transcribe(self, audio_path: str) -> Optional[str]:
        try:
            # Usar whisper-cli.exe compilado
            cli_path = r"D:\BRANPY-AI\server\whisper.cpp\build\bin\Release\whisper-cli.exe"
            model_path = r"D:\BRANPY-AI\server\models\ggml-base.bin"
            
            cmd = [
                cli_path,
                "-m", model_path,
                "-f", audio_path,
                "-l", "pt",
                "--output-txt",
                "--no-timestamps"  # só texto, sem timestamps
            ]
            print(f"[VIDEO_LEARN] Transcrevendo: {' '.join(cmd)}", flush=True)
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=1800)
            print(f"[VIDEO_LEARN] returncode={result.returncode}", flush=True)
            if result.stdout:
                print(f"[VIDEO_LEARN] stdout: {result.stdout[:500]}", flush=True)
            if result.stderr:
                print(f"[VIDEO_LEARN] stderr: {result.stderr[:500]}", flush=True)
            
            # O whisper-cli cria um arquivo .txt com o mesmo nome do audio
            txt_path = audio_path + ".txt"
            if os.path.exists(txt_path):
                with open(txt_path, 'r', encoding='utf-8') as f:
                    text = f.read().strip()
                print(f"[VIDEO_LEARN] Transcrição ({len(text)} chars): {text[:200]}", flush=True)
                return text
            
            return None
        except Exception as e:
            print(f"[VIDEO_LEARN] Exceção transcrição: {e}", flush=True)
            return None

    def _split_sentences(self, text: str) -> list:
        import re
        sentences = re.split(r'(?<=[.!?])\s+', text)
        return [s.strip() for s in sentences if len(s.strip()) > 20]

    def learn_from_url(self, url: str, title: str = "", callback: Optional[Callable] = None) -> str:
        job_id = str(uuid.uuid4())[:8]
        with self._lock:
            self._jobs[job_id] = {
                "id": job_id,
                "url": url,
                "title": title or url,
                "status": "starting",
                "progress": 0,
                "learned": 0,
                "error": None,
                "transcript": ""
            }
        
        thread = threading.Thread(target=self._process_job, args=(job_id, url, title, callback))
        thread.daemon = True
        thread.start()
        return job_id

    def _process_job(self, job_id: str, url: str, title: str, callback: Optional[Callable]):
        temp_dir = None
        try:
            self._update_job(job_id, status="downloading", progress=10)
            if callback:
                callback(job_id, self._jobs[job_id])

            temp_dir = tempfile.mkdtemp(prefix=f"branpy_vid_{job_id}_")
            audio_file = os.path.join(temp_dir, "audio.wav")

            if not self._run_yt_dlp(url, audio_file):
                self._update_job(job_id, status="error", error="Falha ao baixar áudio do vídeo")
                if callback:
                    callback(job_id, self._jobs[job_id])
                return

            # Verificar se o arquivo de áudio é válido (maior que 1KB)
            if not os.path.exists(audio_file) or os.path.getsize(audio_file) < 1024:
                self._update_job(job_id, status="error", error="Arquivo de áudio inválido ou vazio")
                if callback:
                    callback(job_id, self._jobs[job_id])
                return

            self._update_job(job_id, status="transcribing", progress=40)
            if callback:
                callback(job_id, self._jobs[job_id])

            transcript = self._transcribe(audio_file)
            if not transcript:
                self._update_job(job_id, status="error", error="Falha na transcrição")
                if callback:
                    callback(job_id, self._jobs[job_id])
                return

            self._update_job(job_id, status="processing", progress=70, transcript=transcript)
            if callback:
                callback(job_id, self._jobs[job_id])

            sentences = self._split_sentences(transcript)
            learned = 0
            for sent in sentences:
                self.kb.add(
                    question=sent,
                    answer=f"[Do vídeo: {title or url}] {sent}",
                    category="video",
                    source="video_url",
                    keywords=sent.lower().split()
                )
                learned += 1

            self._update_job(job_id, status="done", progress=100, learned=learned)
            if callback:
                callback(job_id, self._jobs[job_id])

        except Exception as e:
            self._update_job(job_id, status="error", error=str(e))
            if callback:
                callback(job_id, self._jobs[job_id])
        finally:
            if temp_dir and os.path.exists(temp_dir):
                shutil.rmtree(temp_dir, ignore_errors=True)

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            return self._jobs.get(job_id)

    def list_jobs(self) -> list:
        with self._lock:
            return list(self._jobs.values())


_global_learner: Optional[VideoLearner] = None


def get_video_learner(kb: KnowledgeBase) -> VideoLearner:
    global _global_learner
    if _global_learner is None:
        _global_learner = VideoLearner(kb)
    return _global_learner