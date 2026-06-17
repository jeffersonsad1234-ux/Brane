"""
OGImage Renderer - Pillow-based image generation.
Generates 1200x630 PNG images for Open Graph.
"""

from io import BytesIO
from PIL import Image, ImageDraw, ImageFont

WIDTH = 1200
HEIGHT = 630

# ── Style configs ──

STYLES = {
    "minimal": {
        "bg_color": (15, 15, 15),
        "text_color": (255, 255, 255),
        "accent_color": (124, 58, 237),
    },
    "dark": {
        "bg_color": (10, 25, 50),
        "text_color": (220, 230, 255),
        "accent_color": (56, 189, 248),
    },
    "gradient": {
        "bg_color": (88, 28, 135),
        "text_color": (255, 255, 255),
        "accent_color": (59, 130, 246),
    },
    "bold": {
        "bg_color": (220, 38, 38),
        "text_color": (255, 255, 255),
        "accent_color": (255, 255, 255),
    },
}

def _get_font(size: int) -> ImageFont.FreeTypeFont:
    """Get font, fallback to default if not available."""
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "C:\\Windows\\Fonts\\arial.ttf",
    ]
    for path in font_paths:
        try:
            return ImageFont.truetype(path, size)
        except (IOError, OSError):
            continue
    return ImageFont.load_default()

def _wrap_text(text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    """Wrap text to fit within max_width."""
    words = text.split()
    lines = []
    current_line = ""

    for word in words:
        test_line = f"{current_line} {word}".strip()
        bbox = font.getbbox(test_line)
        if bbox[2] <= max_width:
            current_line = test_line
        else:
            if current_line:
                lines.append(current_line)
            current_line = word

    if current_line:
        lines.append(current_line)

    return lines

def render_og_image(title: str, style: str = "minimal") -> bytes:
    """Render title text as OG image (1200x630)."""
    config = STYLES.get(style, STYLES["minimal"])

    img = Image.new("RGB", (WIDTH, HEIGHT), config["bg_color"])
    draw = ImageDraw.Draw(img)

    # Draw accent bar at top
    draw.rectangle([(0, 0), (WIDTH, 8)], fill=config["accent_color"])

    # Draw subtle accent circle in background
    draw.ellipse(
        [(WIDTH - 300, -100), (WIDTH + 100, 300)],
        fill=(*config["accent_color"], 30) if len(config["accent_color"]) == 3 else config["accent_color"],
    )

    # Title text
    font_size = 72
    font = _get_font(font_size)
    max_text_width = WIDTH - 200

    lines = _wrap_text(title, font, max_text_width)

    # Limit to 4 lines, truncate if needed
    if len(lines) > 4:
        lines = lines[:4]
        lines[-1] = lines[-1][:20] + "..."

    # Calculate total text height
    line_height = font_size + 16
    total_height = len(lines) * line_height
    y_start = (HEIGHT - total_height) // 2

    # Draw each line
    for i, line in enumerate(lines):
        bbox = font.getbbox(line)
        text_width = bbox[2] - bbox[0]
        x = (WIDTH - text_width) // 2
        y = y_start + (i * line_height)
        draw.text((x, y), line, fill=config["text_color"], font=font)

    # Draw accent line below title
    accent_y = y_start + total_height + 20
    draw.rectangle(
        [(WIDTH // 2 - 60, accent_y), (WIDTH // 2 + 60, accent_y + 4)],
        fill=config["accent_color"],
    )

    # Convert to PNG bytes
    buffer = BytesIO()
    img.save(buffer, format="PNG", optimize=True)
    buffer.seek(0)
    return buffer.getvalue()
