import os
import subprocess
import uuid
import threading
import tempfile
import httpx
from io import BytesIO
from PIL import Image
from .config import OUTPUT_DIR, FPS, VIDEO_WIDTH, VIDEO_HEIGHT
from .queue import queue, save_job, load_job
from .models import UGCJobRequest, JobInfo, JobStatus
from .templates.ugc_template import render_scene


def _download_image(url: str) -> Image.Image | None:
    if not url or not url.startswith("http"):
        return None
    try:
        resp = httpx.get(url, timeout=15, follow_redirects=True)
        resp.raise_for_status()
        img = Image.open(BytesIO(resp.content)).convert("RGBA")
        return img
    except Exception:
        return None


def _ffmpeg_path() -> str:
    for cmd in ["ffmpeg", "ffmpeg.exe"]:
        try:
            subprocess.run([cmd, "-version"], capture_output=True, check=True, timeout=5)
            return cmd
        except (FileNotFoundError, subprocess.TimeoutExpired, subprocess.CalledProcessError):
            continue
    return "ffmpeg"


def _generate_audio_track(path: str, duration_sec: float):
    freq = 120
    sr = 44100
    samples = int(sr * duration_sec)
    cmd = [
        _ffmpeg_path(), "-y", "-f", "lavfi", "-i",
        f"sine=frequency={freq}:duration={duration_sec}:sample_rate={sr}",
        "-af", "volume=0.08",
        path,
    ]
    subprocess.run(cmd, capture_output=True, timeout=30)


def _frames_to_video(frame_dir: str, output_path: str, duration_sec: float):
    audio_path = os.path.join(frame_dir, "audio.wav")
    _generate_audio_track(audio_path, duration_sec)
    cmd = [
        _ffmpeg_path(), "-y",
        "-framerate", str(FPS),
        "-i", os.path.join(frame_dir, "frame_%05d.png"),
        "-i", audio_path,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-shortest",
        "-movflags", "+faststart",
        output_path,
    ]
    subprocess.run(cmd, capture_output=True, timeout=120)


def _compose_scene_frames(
    scene_type: str,
    product_img: Image.Image,
    product_name: str,
    price: float,
    old_price: float,
    description: str,
    category: str,
    avatar_style: str,
    affiliate_link: str,
    frame_dir: str,
    start_frame: int,
    duration_frames: int,
    log: callable,
):
    for f in range(duration_frames):
        frame = render_scene(
            scene_type, f, duration_frames,
            product_img, product_name, price, old_price,
            description, category, avatar_style, affiliate_link,
        )
        path = os.path.join(frame_dir, f"frame_{start_frame + f:05d}.png")
        frame.save(path)
        if f % 10 == 0:
            log(f"  frame {f + 1}/{duration_frames}")


SCENES = [
    {"type": "intro", "duration_sec": 5},
    {"type": "showcase", "duration_sec": 7},
    {"type": "benefits", "duration_sec": 6},
    {"type": "price", "duration_sec": 6},
    {"type": "cta", "duration_sec": 6},
]


def run_job(job_id: str, req: UGCJobRequest):
    job = load_job(job_id)
    if not job:
        return

    def log(msg: str):
        job.logs.append(msg)
        save_job(job)

    try:
        log("🔍 Iniciando geração de UGC AI Ad...")
        save_job(job)

        log(f"📦 Produto: {req.productName}")
        log(f"💰 Preço: R$ {req.price:.2f}")
        log(f"🔗 Link: {req.affiliateLink}")
        log(f"🎨 Estilo avatar: {req.avatarStyle}")
        log(f"🎭 Tom: {req.tone}")

        log("⬇️ Baixando imagem do produto...")
        product_img = _download_image(req.productImageUrl)

        if product_img:
            log(f"✅ Imagem baixada: {product_img.size[0]}x{product_img.size[1]}")
        else:
            log("⚠️ Imagem não pôde ser baixada — gerando sem imagem do produto")

        total_duration = sum(s["duration_sec"] for s in SCENES)
        total_frames = int(total_duration * FPS)
        log(f"🎬 Gerando {total_frames} frames ({total_duration}s a {FPS}fps)")

        with tempfile.TemporaryDirectory() as tmpdir:
            frame_dir = os.path.join(tmpdir, "frames")
            os.makedirs(frame_dir, exist_ok=True)

            start = 0
            for scene in SCENES:
                dur_frames = int(scene["duration_sec"] * FPS)
                log(f"🎬 Cena '{scene['type']}' — {scene['duration_sec']}s")
                _compose_scene_frames(
                    scene["type"], product_img,
                    req.productName, req.price,
                    req.oldPrice if req.oldPrice else req.price * 1.4,
                    req.description, req.category, req.avatarStyle,
                    req.affiliateLink,
                    frame_dir, start, dur_frames, log,
                )
                start += dur_frames
                job.progress = start / total_frames
                save_job(job)

            output_filename = f"{job_id}.mp4"
            output_path = os.path.join(OUTPUT_DIR, output_filename)
            log("🎞️ Compilando vídeo com FFmpeg...")
            _frames_to_video(frame_dir, output_path, total_duration)

            file_size = os.path.getsize(output_path)
            log(f"✅ Vídeo gerado: {output_filename} ({file_size / 1024 / 1024:.1f} MB)")

        job.status = JobStatus.done
        job.progress = 1.0
        job.videoUrl = f"/videos/{job_id}.mp4"
        job.logs.append(f"✅ UGC Ad finalizado com sucesso")
        save_job(job)

    except Exception as e:
        job.status = JobStatus.failed
        job.error = str(e)
        log(f"❌ Erro: {e}")
        save_job(job)
    finally:
        queue.complete(job_id)


def start_job_worker():
    def _worker_loop():
        while True:
            job_id = queue.dequeue()
            if job_id is None:
                import time
                time.sleep(1)
                continue
            job = load_job(job_id)
            if job is None:
                queue.complete(job_id)
                continue
            run_job(job_id, UGCJobRequest.model_validate(job.request_data))

    t = threading.Thread(target=_worker_loop, daemon=True)
    t.start()
