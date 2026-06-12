"""
generate_images.py — Pipeline de geração de imagens reais para Modo História Cinemática

Fluxo:
  história → cenas → prompts → imagens (HuggingFace InferenceClient / SDXL)

Uso:
  python backend/generate_images.py --category terror --story a-casa-abandonada --scenes 5
  python backend/generate_images.py --all
  python backend/generate_images.py --placeholders

Requer HUGGINGFACE_API_KEY no ambiente ou backend/.env
  Obtenha em: https://huggingface.co/settings/tokens
"""

import os, sys, json, time
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
DATA_DIR = BASE / "assets" / "story-data"
IMAGES_DIR = BASE / "assets" / "story-images"

MODEL_ID = "stabilityai/stable-diffusion-xl-base-1.0"

GENRE_STYLE_KEYWORDS = {
    "terror":              "horror, dark moody, cinematic lighting, abandoned, eerie, mist, dramatic shadows, photorealistic, 8k, high detail",
    "suspense":            "thriller, dramatic tension, urban noir, cinematic composition, mysterious atmosphere, photorealistic, 8k",
    "misterio":            "noir aesthetics, moody lighting, detective atmosphere, vintage tones, mysterious, cinematic, photorealistic, 8k",
    "ficcao-cientifica":   "sci-fi, futuristic, space station, advanced technology, neon lights, holographic, photorealistic, 8k",
    "educacao":            "bright warm lighting, library atmosphere, scholarly, clean composition, educational, photorealistic, 8k",
    "fantasia":            "epic fantasy, magical ethereal lighting, mythical landscape, detailed, cinematic, photorealistic, 8k",
    "mundo-proprio":       "unique architecture, bioluminescent, surreal landscape, otherworldly, atmospheric, cinematic, photorealistic, 8k",
    "historia":            "historical, period accurate, vintage atmosphere, dramatic lighting, authentic, photorealistic, 8k",
    "ciencia":             "scientific, laboratory, high tech, clean lighting, modern research facility, photorealistic, 8k",
    "contos-infantis":     "storybook style, colorful, warm magical lighting, dreamy, whimsical, detailed illustration, 8k",
}

NEGATIVE_DEFAULT = (
    "cartoon, anime, illustration, drawing, painting, sketch, low quality, blurry, "
    "distortion, ugly, deformed, watermark, text, signature, bad anatomy, extra limbs, "
    "worst quality, normal quality, jpeg artifacts, signature, watermark, username"
)


def get_hf_api_key():
    key = os.environ.get("HF_API_KEY") or os.environ.get("HUGGINGFACE_API_KEY")
    if key:
        return key
    env_path = BASE / "backend" / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if "=" in line:
                k, v = line.split("=", 1)
                if k.strip() in ("HF_API_KEY", "HUGGINGFACE_API_KEY"):
                    val = v.strip()
                    if val and "your" not in val:
                        return val
    return None


def make_client():
    from huggingface_hub import InferenceClient
    key = get_hf_api_key()
    return InferenceClient(token=key) if key else None


def build_prompt(story_title: str, narration: str, category: str, scene_style: str = "") -> str:
    genre_kw = GENRE_STYLE_KEYWORDS.get(category, "photorealistic, cinematic, 8k")
    scene_desc = f"{story_title}: {narration[:300]}"
    return f"{scene_desc}. Style: {genre_kw}, {scene_style}"


def generate_image_sdk(client, prompt: str, negative: str, retries: int = 3):
    for attempt in range(retries):
        try:
            image = client.text_to_image(
                prompt,
                model=MODEL_ID,
                width=1024,
                height=768,
                num_inference_steps=25,
                guidance_scale=7.5,
                negative_prompt=negative,
            )
            return image
        except Exception as e:
            err = str(e)
            print(f"    Attempt {attempt+1}/{retries} failed: {err[:150]}")
            if "loading" in err.lower() and attempt < retries - 1:
                time.sleep(30)
            elif attempt < retries - 1:
                time.sleep(10)
    return None


def generate_placeholder(story_title: str, scene_id: int, narration: str, category: str, out_path: Path):
    from PIL import Image, ImageDraw, ImageFont
    try:
        font_lg = ImageFont.truetype("arial.ttf", 44)
        font_md = ImageFont.truetype("arial.ttf", 28)
        font_sm = ImageFont.truetype("arial.ttf", 20)
    except:
        font_lg = font_md = font_sm = ImageFont.load_default()

    w, h = 1024, 768

    palette = {
        "terror":            {"bg": (8, 3, 18), "fg": (160, 40, 40), "accent": (200, 70, 30), "glow": (80, 10, 10)},
        "suspense":          {"bg": (12, 8, 22), "fg": (50, 90, 160), "accent": (110, 50, 150), "glow": (20, 30, 80)},
        "misterio":          {"bg": (5, 5, 28), "fg": (90, 50, 170), "accent": (70, 30, 150), "glow": (30, 10, 70)},
        "ficcao-cientifica": {"bg": (5, 10, 35), "fg": (30, 170, 210), "accent": (90, 210, 170), "glow": (10, 30, 90)},
        "educacao":          {"bg": (10, 28, 15), "fg": (50, 170, 90), "accent": (210, 190, 50), "glow": (20, 70, 30)},
        "fantasia":          {"bg": (22, 8, 38), "fg": (210, 170, 50), "accent": (170, 50, 210), "glow": (60, 20, 100)},
        "mundo-proprio":     {"bg": (18, 13, 8), "fg": (190, 150, 90), "accent": (150, 90, 50), "glow": (40, 30, 15)},
        "historia":          {"bg": (18, 18, 13), "fg": (170, 150, 90), "accent": (190, 170, 70), "glow": (40, 35, 20)},
        "ciencia":           {"bg": (5, 15, 28), "fg": (50, 170, 210), "accent": (90, 210, 190), "glow": (10, 40, 80)},
        "contos-infantis":   {"bg": (28, 18, 42), "fg": (230, 190, 90), "accent": (190, 90, 230), "glow": (70, 30, 110)},
    }
    p = palette.get(category, palette["terror"])

    img = Image.new("RGB", (w, h), p["bg"])
    draw = ImageDraw.Draw(img)

    for y in range(h):
        t = y / h
        r = int(p["bg"][0] * (1 - t) + min(p["bg"][0] + 30, 255) * t)
        g = int(p["bg"][1] * (1 - t) + min(p["bg"][1] + 20, 255) * t)
        b = int(p["bg"][2] * (1 - t) + min(p["bg"][2] + 40, 255) * t)
        draw.line([(0, y), (w, y)], fill=(r, g, b))

    import random as _rng
    _rng.seed(hash(story_title + str(scene_id)) % (2**31))

    if category in ("terror", "suspense", "misterio"):
        for _ in range(_rng.randint(2, 5)):
            x = _rng.randint(50, w - 50)
            yp = _rng.randint(50, h - 50)
            r = _rng.randint(30, 120)
            draw.ellipse([x - r, yp - r, x + r, yp + r], outline=(*p["accent"], _rng.randint(10, 40)), width=_rng.randint(1, 3))
            for _ in range(_rng.randint(3, 6)):
                lx = _rng.randint(x - r, x + r)
                ly = _rng.randint(yp - r, yp + r)
                draw.line([(lx, ly), (lx + _rng.randint(-40, 40), ly + _rng.randint(-20, 20))],
                          fill=(*p["glow"], _rng.randint(10, 30)), width=_rng.randint(1, 3))
    elif category == "ficcao-cientifica":
        for _ in range(_rng.randint(3, 6)):
            x = _rng.randint(50, w - 50)
            yp = _rng.randint(50, h - 50)
            size = _rng.randint(20, 80)
            draw.rectangle([x - size, yp - size, x + size, yp + size],
                           outline=(*p["accent"], _rng.randint(30, 70)), width=_rng.randint(1, 3))
            for _ in range(4):
                dx = _rng.randint(-30, 30)
                dy = _rng.randint(-30, 30)
                draw.line([(x, yp), (x + dx, yp + dy)], fill=(*p["accent"], 20), width=1)
    elif category == "fantasia":
        for _ in range(_rng.randint(3, 7)):
            cx = _rng.randint(100, w - 100)
            cy = _rng.randint(100, h - 100)
            r = _rng.randint(40, 150)
            for ring in range(3):
                draw.ellipse([cx - r + ring * 10, cy - r + ring * 10, cx + r - ring * 10, cy + r - ring * 10],
                             outline=(*p["glow"], _rng.randint(15, 40)), width=1)
    else:
        for _ in range(_rng.randint(4, 8)):
            x = _rng.randint(20, w - 20)
            yp = _rng.randint(20, h - 20)
            r = _rng.randint(15, 60)
            draw.ellipse([x - r, yp - r, x + r, yp + r], outline=(*p["accent"], _rng.randint(20, 50)), width=1)

    draw.text((w // 2, h // 2 - 80), story_title, fill=(255, 255, 255, 230), font=font_lg, anchor="mm", align="center")
    draw.text((w // 2, h // 2), f"Cena {scene_id}", fill=(*p["fg"], 200), font=font_md, anchor="mm", align="center")
    lines = []
    words = narration.split()
    for i in range(0, len(words), 8):
        lines.append(" ".join(words[i:i + 8]))
    draw.text((w // 2, h - 120), "\n".join(lines[:5]), fill=(200, 200, 200, 140), font=font_sm, anchor="mm", align="center")

    img.save(str(out_path), "JPEG", quality=80)
    return out_path.stat().st_size


def process_story(category: str, story_id: str, client=None, max_scenes: int | None = None, force: bool = False):
    story_path = DATA_DIR / category / f"{story_id}.json"
    if not story_path.exists():
        print(f"  [SKIP] Story not found: {story_id}")
        return None

    story = json.loads(story_path.read_text(encoding="utf-8"))
    title = story["title"]
    scenes = story["scenes"]
    if max_scenes:
        scenes = scenes[:max_scenes]

    img_dir = IMAGES_DIR / category / story_id
    img_dir.mkdir(parents=True, exist_ok=True)
    style = story.get("promptsForImageGen", {}).get("style", "")

    results = []
    for scene in scenes:
        sid = scene["id"]
        out_path = img_dir / f"scene-{sid}.jpg"
        if out_path.exists() and not force:
            kb = round(out_path.stat().st_size / 1024, 1)
            print(f"    Scene {sid}: cached ({kb} KB)")
            results.append({"scene": sid, "status": "cached", "size_kb": kb})
            continue

        narration = scene.get("narration", "")
        prompt = build_prompt(title, narration, category, style)

        if client:
            t0 = time.time()
            print(f"    Scene {sid}: generating via HuggingFace SDXL...")
            print(f"      Prompt: {prompt[:120]}...")
            image = generate_image_sdk(client, prompt, NEGATIVE_DEFAULT)
            elapsed = time.time() - t0
            if image:
                image.save(str(out_path), "JPEG", quality=90)
                kb = round(out_path.stat().st_size / 1024, 1)
                print(f"      OK: {out_path.name} ({kb} KB, {elapsed:.1f}s)")
                results.append({"scene": sid, "status": "generated", "size_kb": kb, "time_s": round(elapsed, 1), "prompt": prompt})
            else:
                print(f"      FAIL: generating placeholder instead")
                size = generate_placeholder(title, sid, narration, category, out_path)
                kb = round(size / 1024, 1)
                results.append({"scene": sid, "status": "fallback_placeholder", "size_kb": kb, "error": "API gen failed"})
        else:
            print(f"    Scene {sid}: generating placeholder (no API key)...")
            size = generate_placeholder(title, sid, narration, category, out_path)
            kb = round(size / 1024, 1)
            print(f"      OK: {out_path.name} ({kb} KB)")
            results.append({"scene": sid, "status": "placeholder", "size_kb": kb})

    return {
        "story_id": story_id,
        "title": title,
        "category": category,
        "scenes_processed": len(scenes),
        "results": results,
    }


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Generate real images for Story Mode")
    parser.add_argument("--category", default="terror", help="Category ID")
    parser.add_argument("--story", default="a-casa-abandonada", help="Story ID")
    parser.add_argument("--scenes", type=int, default=None, help="Number of scenes to process")
    parser.add_argument("--force", action="store_true", help="Regenerate existing images")
    parser.add_argument("--all", action="store_true", help="Process all categories and stories")
    parser.add_argument("--placeholders", action="store_true", help="Generate improved placeholders (no API)")
    args = parser.parse_args()

    client = None if args.placeholders else make_client()
    if not client and not args.placeholders:
        print("=" * 60)
        print("  Nenhuma API key encontrada.")
        print("  Gerando placeholders melhorados como fallback.")
        print("  Para usar HuggingFace API, defina HUGGINGFACE_API_KEY:")
        print("    set HUGGINGFACE_API_KEY=hf_seu_token_aqui")
        print("  Ou edite backend/.env")
        print("=" * 60)
        print()
    elif client:
        print(f"Usando HuggingFace InferenceClient (modelo: {MODEL_ID})")
        print()

    total_stories = 0
    total_scenes = 0
    total_images = 0
    total_bytes = 0
    details = []

    if args.all:
        categories = [d.name for d in sorted(DATA_DIR.iterdir()) if d.is_dir() and d.name != "categories.json"]
        for cat in categories:
            cat_dir = DATA_DIR / cat
            stories = sorted([f.stem for f in cat_dir.glob("*.json")])
            for sid in stories:
                print(f"\n[{cat}] {sid}:")
                result = process_story(cat, sid, client, force=args.force)
                if result:
                    total_stories += 1
                    for r in result["results"]:
                        total_scenes += 1
                        if r.get("size_kb"):
                            total_images += 1
                            total_bytes += r["size_kb"] * 1024
                            details.append(r)
    else:
        print(f"\n[{args.category}] {args.story}:")
        result = process_story(args.category, args.story, client, max_scenes=args.scenes, force=args.force)
        if result:
            total_stories = 1
            for r in result["results"]:
                total_scenes += 1
                if r.get("size_kb"):
                    total_images += 1
                    total_bytes += r["size_kb"] * 1024
                    details.append(r)

    print()
    print("=" * 60)
    print(f"  Resumo da geracao:")
    print(f"  Historias processadas: {total_stories}")
    print(f"  Cenas processadas:     {total_scenes}")
    print(f"  Imagens geradas:       {total_images}")
    print(f"  Tamanho total:         {round(total_bytes / 1024 / 1024, 2)} MB")
    print("=" * 60)

    # Print details per scene
    if details:
        print()
        print("Detalhes por cena:")
        for d in details:
            line = f"  Scene {d['scene']}: {d['status']}"
            if d.get("size_kb"):
                line += f", {d['size_kb']} KB"
            if d.get("time_s"):
                line += f", {d['time_s']}s"
            if d.get("prompt"):
                line += f"\n    Prompt: {d['prompt'][:150]}..."
            print(line)


if __name__ == "__main__":
    main()
