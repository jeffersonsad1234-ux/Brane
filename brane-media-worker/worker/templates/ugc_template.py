import math
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO
import os

W = 540
H = 960
FONT_DIR = os.path.join(os.path.dirname(__file__))

def _load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    name = "Inter-Bold.ttf" if bold else "Inter-Regular.ttf"
    path = os.path.join(FONT_DIR, name)
    try:
        return ImageFont.truetype(path, size)
    except (IOError, OSError):
        try:
            return ImageFont.truetype("arial.ttf", size)
        except (IOError, OSError):
            return ImageFont.load_default()


def _dark_gradient(draw: ImageDraw.ImageDraw, colors: list):
    for y in range(H):
        t = y / H
        i = min(int(t * (len(colors) - 1)), len(colors) - 2)
        frac = (t * (len(colors) - 1)) - i
        c1, c2 = colors[i], colors[i + 1]
        r = int(c1[0] + (c2[0] - c1[0]) * frac)
        g = int(c1[1] + (c2[1] - c1[1]) * frac)
        b = int(c1[2] + (c2[2] - c1[2]) * frac)
        draw.line([(0, y), (W, y)], fill=(r, g, b))


def _draw_rounded_rect(draw: ImageDraw.ImageDraw, x, y, w, h, r, fill):
    draw.rounded_rectangle([x, y, x + w, y + h], radius=r, fill=fill)


def _draw_avatar_placeholder(draw: ImageDraw.ImageDraw, cx, cy, size, style: str):
    r = size // 2
    colors = {
        "profissional": [(37, 99, 235), (59, 130, 246)],
        "jovem": [(236, 72, 153), (168, 85, 247)],
        "influencer": [(245, 158, 11), (239, 68, 68)],
        "minimalista": [(100, 116, 139), (148, 163, 184)],
    }
    palette = colors.get(style, colors["profissional"])
    for i in range(r, 0, -1):
        t = i / r
        cr = int(palette[0][0] + (palette[1][0] - palette[0][0]) * (1 - t))
        cg = int(palette[0][1] + (palette[1][1] - palette[0][1]) * (1 - t))
        cb = int(palette[0][2] + (palette[1][2] - palette[0][2]) * (1 - t))
        draw.ellipse([cx - i, cy - i, cx + i, cy + i], fill=(cr, cg, cb))

    draw.ellipse([cx - r // 3, cy - r // 2, cx + r // 3, cy + r // 6], fill=(255, 255, 255, 40))
    draw.arc([cx - r // 2, cy + r // 4, cx + r // 2, cy + r // 1.2], 0, 180, fill=(255, 255, 255, 30), width=2)


def _draw_product_image(base: Image.Image, product_img: Image.Image, max_w, max_h, offset_y, glow_color, scale):
    if product_img is None:
        return
    s = scale if scale else 1.0
    iw, ih = product_img.size
    ratio = min(max_w / iw, max_h / ih) * s
    dw, dh = int(iw * ratio), int(ih * ratio)
    dx = (W - dw) // 2
    dy = int(offset_y + (max_h - dh) / 2)

    if glow_color:
        gs = int(max(dw, dh) * 0.8)
        glow = Image.new("RGBA", (gs * 2, gs * 2), (0, 0, 0, 0))
        gdraw = ImageDraw.Draw(glow)
        for j in range(gs, 0, -2):
            alpha = int(40 * (1 - j / gs))
            gdraw.ellipse([gs - j, gs - j, gs + j, gs + j], fill=(*glow_color, alpha))
        base.paste(glow, (dx - gs + dw // 2, dy - gs + dh // 2), glow)

    resized = product_img.resize((dw, dh), Image.LANCZOS)
    base.paste(resized, (dx, dy), resized if resized.mode == "RGBA" else None)


def _draw_text_centered(draw: ImageDraw.ImageDraw, text, y, font_size, bold, color=(255, 255, 255), shadow=True, max_w=None):
    font = _load_font(font_size, bold)
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    if max_w and tw > max_w:
        while tw > max_w and font_size > 10:
            font_size -= 1
            font = _load_font(font_size, bold)
            bbox = draw.textbbox((0, 0), text, font=font)
            tw = bbox[2] - bbox[0]
    x = (W - tw) // 2
    if shadow:
        draw.text((x + 2, y + 2), text, font=font, fill=(0, 0, 0, 160))
    draw.text((x, y), text, font=font, fill=color)
    return y + (bbox[3] - bbox[1]) + 8


def _draw_text_left(draw: ImageDraw.ImageDraw, text, x, y, font_size, bold, color=(255, 255, 255)):
    font = _load_font(font_size, bold)
    draw.text((x, y), text, font=font, fill=color)
    bbox = draw.textbbox((0, 0), text, font=font)
    return y + (bbox[3] - bbox[1]) + 6


def render_scene(
    scene_type: str,
    frame_idx: int,
    total_frames: int,
    product_img: Image.Image,
    product_name: str,
    price: float,
    old_price: float,
    description: str,
    category: str,
    avatar_style: str,
    affiliate_link: str,
) -> Image.Image:
    frame = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    draw = ImageDraw.Draw(frame)

    is_tech = category in ("tecnologia", "gamer")
    scene_phase = frame_idx / total_frames if total_frames > 0 else 0

    if is_tech:
        _dark_gradient(draw, [(10, 10, 26), (13, 13, 43), (10, 10, 26)])
        for i in range(10):
            px = int((W * 0.05 + (i * W * 0.1) + math.sin(frame_idx * 0.03 + i * 1.7) * 30) % W)
            py = int((H * 0.05 + (i * H * 0.1) + math.cos(frame_idx * 0.025 + i * 2.3) * 20 + frame_idx * 0.3) % H)
            ps = max(1, int(2 + math.sin(frame_idx * 0.05 + i) * 1.5))
            hue = int((frame_idx * 0.5 + i * 40) % 360)
            alpha = int(60 + math.sin(frame_idx * 0.04 + i) * 30)
            draw.ellipse([px - ps, py - ps, px + ps, py + ps], fill=(0, 255, 255, alpha))
    else:
        _dark_gradient(draw, [(26, 26, 46), (22, 33, 62), (15, 52, 96)])

    if scene_type == "intro":
        av_size = int(min(W, H) * 0.25)
        cx, cy = W // 2, int(H * 0.22)
        _draw_avatar_placeholder(draw, cx, cy, av_size, avatar_style)
        name_y = int(H * 0.44)
        _draw_text_centered(draw, product_name, name_y, 36, True, (255, 255, 255))
        _draw_text_centered(draw, "Confira essa oferta imperdível!", name_y + 50, 22, False, (245, 158, 11))
        if product_img:
            _draw_product_image(frame, product_img, int(W * 0.4), int(H * 0.15), int(H * 0.6), (59, 130, 246), 1.0)
        else:
            _draw_text_centered(draw, "📦", int(H * 0.58), 60, False, (255, 255, 255))

    elif scene_type == "showcase":
        if product_img:
            zoom = 1 + math.sin(frame_idx * 0.04) * 0.04
            _draw_product_image(frame, product_img, int(W * 0.75), int(H * 0.45), int(H * 0.08), (59, 130, 246), zoom)
        _draw_text_centered(draw, product_name, int(H * 0.62), 30, True, (255, 255, 255))
        _draw_text_centered(draw, "Produto original de alta qualidade", int(H * 0.67), 18, False, (200, 200, 200))

    elif scene_type == "benefits":
        benefs = [b.strip() for b in description.split(",") if len(b.strip()) > 5][:3]
        if not benefs:
            benefs = ["Produto de alta qualidade", "Frete grátis", "Oferta imperdível"]

        _draw_text_centered(draw, "✨ Vantagens", int(H * 0.08), 30, True, (255, 255, 255))

        for i, b in enumerate(benefs):
            delay = i * 0.15
            alpha = min((scene_phase - delay) / 0.2, 1)
            if alpha <= 0:
                continue
            by = int(H * (0.25 + i * 0.08))
            temp = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            tdraw = ImageDraw.Draw(temp)
            _draw_text_left(tdraw, f"✅  {b}", 50, 0, 22, False, (255, 255, 255))
            frame = Image.alpha_composite(frame, temp)

    elif scene_type == "price":
        pulse = 1 + math.sin(frame_idx * 0.06) * 0.03
        py_center = int(H * 0.35)
        op = old_price if old_price else price * 1.4
        old_str = f"De R$ {op:.2f}"
        new_str = f"R$ {price:.2f}"

        _draw_text_centered(draw, old_str, py_center - 50, 26, False, (239, 68, 68))

        strike_y = py_center - 42
        font_s = _load_font(26, False)
        bbox = draw.textbbox((0, 0), old_str, font=font_s)
        tw = bbox[2] - bbox[0]
        sx = (W - tw) // 2
        draw.line([(sx, strike_y), (sx + tw, strike_y)], fill=(239, 68, 68), width=2)

        _draw_text_centered(draw, new_str, int(py_center + 10), 52, True, (245, 158, 11))
        _draw_text_centered(draw, "🔥 PROMOÇÃO 🔥", py_center + 80, 22, True, (16, 185, 129))

    elif scene_type == "cta":
        fade = min(frame_idx / (total_frames * 0.3), 1)
        temp = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        tdraw = ImageDraw.Draw(temp)

        _draw_text_centered(tdraw, "🔗 Link na bio!", int(H * 0.25), 38, True, (255, 255, 255))
        _draw_text_centered(tdraw, affiliate_link, int(H * 0.34), 18, False, (96, 165, 250))
        _draw_text_centered(tdraw, "Confira antes que acabe!", int(H * 0.42), 26, True, (255, 255, 255, 180))

        arrow_off = int(math.sin(frame_idx * 0.08) * 8)
        _draw_text_centered(tdraw, "👇", int(H * 0.65 + arrow_off), 40, False, (255, 255, 255, 80))

        if fade < 1:
            temp = temp.point(lambda p: int(p * fade))
        frame = Image.alpha_composite(frame, temp)

    return frame
