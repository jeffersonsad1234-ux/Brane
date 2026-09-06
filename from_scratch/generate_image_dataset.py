"""Dataset de imagens para treinar VQ-VAE — 100% gerado por codigo.

100% da branpy.com.br — Todos os direitos reservado.
Gera imagens sinteticas para treino: padroes, formas, gradientes, fractais.
Sem nenhuma imagem externa. Tudo criado por codigo.

Rodar: python generate_image_dataset.py
"""

import os
import random
import math

random.seed(42)


def criar_pasta_saida():
    out_dir = os.path.join(os.path.dirname(__file__), 'data', 'images')
    os.makedirs(out_dir, exist_ok=True)
    return out_dir


def clamp(val, min_val=0, max_val=255):
    return max(min_val, min(max_val, int(val)))


def salvar_ppm(pixels, width, height, path):
    """Salva imagem PPM (formato simples, sem dependencias)."""
    with open(path, 'wb') as f:
        f.write(f'P6\n{width} {height}\n255\n'.encode())
        for r, g, b in pixels:
            f.write(bytes([clamp(r), clamp(g), clamp(b)]))


# ==========================================
# 1. PADROES GEOMETRICOS
# ==========================================

def gerar_padroes_geometricos(out_dir, n_por_tipo=50):
    """Gera padroes geometricos basicos."""
    count = 0
    size = 128

    # Xadrez
    for _ in range(n_por_tipo):
        pixels = []
        block = random.randint(4, 16)
        c1 = (random.randint(50, 255), random.randint(50, 255), random.randint(50, 255))
        c2 = (random.randint(0, 150), random.randint(0, 150), random.randint(0, 150))
        for y in range(size):
            for x in range(size):
                if ((x // block) + (y // block)) % 2 == 0:
                    pixels.append(c1)
                else:
                    pixels.append(c2)
        salvar_ppm(pixels, size, size, os.path.join(out_dir, f'checker_{count:04d}.ppm'))
        count += 1

    # Gradiente horizontal
    for _ in range(n_por_tipo):
        pixels = []
        r1, g1, b1 = random.randint(0, 255), random.randint(0, 255), random.randint(0, 255)
        r2, g2, b2 = random.randint(0, 255), random.randint(0, 255), random.randint(0, 255)
        for y in range(size):
            for x in range(size):
                t = x / size
                r = r1 + (r2 - r1) * t
                g = g1 + (g2 - g1) * t
                b = b1 + (b2 - b1) * t
                pixels.append((r, g, b))
        salvar_ppm(pixels, size, size, os.path.join(out_dir, f'grad_h_{count:04d}.ppm'))
        count += 1

    # Gradiente vertical
    for _ in range(n_por_tipo):
        pixels = []
        r1, g1, b1 = random.randint(0, 255), random.randint(0, 255), random.randint(0, 255)
        r2, g2, b2 = random.randint(0, 255), random.randint(0, 255), random.randint(0, 255)
        for y in range(size):
            for x in range(size):
                t = y / size
                r = r1 + (r2 - r1) * t
                g = g1 + (g2 - g1) * t
                b = b1 + (b2 - b1) * t
                pixels.append((r, g, b))
        salvar_ppm(pixels, size, size, os.path.join(out_dir, f'grad_v_{count:04d}.ppm'))
        count += 1

    # Circulos concentricos
    for _ in range(n_por_tipo):
        pixels = []
        cx, cy = size // 2 + random.randint(-20, 20), size // 2 + random.randint(-20, 20)
        c1 = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
        c2 = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
        for y in range(size):
            for x in range(size):
                d = math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
                if int(d) % 16 < 8:
                    pixels.append(c1)
                else:
                    pixels.append(c2)
        salvar_ppm(pixels, size, size, os.path.join(out_dir, f'circles_{count:04d}.ppm'))
        count += 1

    # Linhas diagonais
    for _ in range(n_por_tipo):
        pixels = []
        c1 = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
        c2 = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
        for y in range(size):
            for x in range(size):
                if (x + y) % 16 < 8:
                    pixels.append(c1)
                else:
                    pixels.append(c2)
        salvar_ppm(pixels, size, size, os.path.join(out_dir, f'diag_{count:04d}.ppm'))
        count += 1

    return count


# ==========================================
# 2. FORMAS SIMPLES
# ==========================================

def gerar_formas_simples(out_dir, n_por_tipo=50):
    """Gera formas: quadrados, circulos, triangulos."""
    count = 0
    size = 128

    # Quadrado no centro
    for _ in range(n_por_tipo):
        pixels = [(0, 0, 0)] * (size * size)
        cx, cy = size // 2, size // 2
        s = random.randint(10, 50)
        c = (random.randint(50, 255), random.randint(50, 255), random.randint(50, 255))
        for y in range(max(0, cy - s), min(size, cy + s)):
            for x in range(max(0, cx - s), min(size, cx + s)):
                pixels[y * size + x] = c
        salvar_ppm(pixels, size, size, os.path.join(out_dir, f'square_{count:04d}.ppm'))
        count += 1

    # Circulo no centro
    for _ in range(n_por_tipo):
        pixels = [(0, 0, 0)] * (size * size)
        cx, cy = size // 2 + random.randint(-10, 10), size // 2 + random.randint(-10, 10)
        r = random.randint(10, 50)
        c = (random.randint(50, 255), random.randint(50, 255), random.randint(50, 255))
        for y in range(size):
            for x in range(size):
                if (x - cx) ** 2 + (y - cy) ** 2 < r ** 2:
                    pixels[y * size + x] = c
        salvar_ppm(pixels, size, size, os.path.join(out_dir, f'circle_{count:04d}.ppm'))
        count += 1

    # Triangulo
    for _ in range(n_por_tipo):
        pixels = [(0, 0, 0)] * (size * size)
        cx, cy = size // 2, size // 2
        s = random.randint(20, 50)
        c = (random.randint(50, 255), random.randint(50, 255), random.randint(50, 255))
        for y in range(max(0, cy - s), min(size, cy + s)):
            for x in range(max(0, cx - s), min(size, cx + s)):
                if y < cy + (x - cx) // 2 + s // 2:
                    pixels[y * size + x] = c
        salvar_ppm(pixels, size, size, os.path.join(out_dir, f'triangle_{count:04d}.ppm'))
        count += 1

    return count


# ==========================================
# 3. NOISE E TEXTURAS
# ==========================================

def gerar_noise_texturas(out_dir, n_por_tipo=50):
    """Gera noise e texturas variadas."""
    count = 0
    size = 128

    # Noise aleatorio
    for _ in range(n_por_tipo):
        pixels = []
        for _ in range(size * size):
            pixels.append((random.randint(0, 255), random.randint(0, 255), random.randint(0, 255)))
        salvar_ppm(pixels, size, size, os.path.join(out_dir, f'noise_{count:04d}.ppm'))
        count += 1

    # Noise suave (blur)
    for _ in range(n_por_tipo):
        pixels = []
        base = [[random.randint(0, 255) for _ in range(size)] for _ in range(size)]
        for y in range(size):
            for x in range(size):
                total = 0
                cnt = 0
                for dy in range(-2, 3):
                    for dx in range(-2, 3):
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < size and 0 <= nx < size:
                            total += base[ny][nx]
                            cnt += 1
                v = total // cnt
                pixels.append((v, v, v))
        salvar_ppm(pixels, size, size, os.path.join(out_dir, f'smooth_{count:04d}.ppm'))
        count += 1

    # Linhas horizontais
    for _ in range(n_por_tipo):
        pixels = []
        w = random.randint(2, 8)
        c1 = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
        c2 = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
        for y in range(size):
            for x in range(size):
                if (y // w) % 2 == 0:
                    pixels.append(c1)
                else:
                    pixels.append(c2)
        salvar_ppm(pixels, size, size, os.path.join(out_dir, f'lines_h_{count:04d}.ppm'))
        count += 1

    # Linhas verticais
    for _ in range(n_por_tipo):
        pixels = []
        w = random.randint(2, 8)
        c1 = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
        c2 = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
        for y in range(size):
            for x in range(size):
                if (x // w) % 2 == 0:
                    pixels.append(c1)
                else:
                    pixels.append(c2)
        salvar_ppm(pixels, size, size, os.path.join(out_dir, f'lines_v_{count:04d}.ppm'))
        count += 1

    return count


# ==========================================
# 4. COMBINACOES
# ==========================================

def gerar_combinacoes(out_dir, n=200):
    """Gera combinacoes de formas e cores."""
    count = 0
    size = 128

    for _ in range(n):
        pixels = [(0, 0, 0)] * (size * size)

        # Fundo com gradiente suave
        r1, g1, b1 = random.randint(0, 100), random.randint(0, 100), random.randint(0, 100)
        r2, g2, b2 = random.randint(100, 255), random.randint(100, 255), random.randint(100, 255)
        for y in range(size):
            for x in range(size):
                t = y / size
                r = r1 + (r2 - r1) * t
                g = g1 + (g2 - g1) * t
                b = b1 + (b2 - b1) * t
                pixels[y * size + x] = (r, g, b)

        # Forma aleatoria
        n_formas = random.randint(1, 5)
        for _ in range(n_formas):
            forma = random.choice(['circulo', 'quadrado', 'retangulo'])
            cx = random.randint(0, size)
            cy = random.randint(0, size)
            c = (random.randint(50, 255), random.randint(50, 255), random.randint(50, 255))

            if forma == 'circulo':
                r = random.randint(5, 30)
                for y in range(max(0, cy - r), min(size, cy + r)):
                    for x in range(max(0, cx - r), min(size, cx + r)):
                        if (x - cx) ** 2 + (y - cy) ** 2 < r ** 2:
                            pixels[y * size + x] = c
            else:
                w = random.randint(10, 40)
                h = random.randint(10, 40)
                for y in range(max(0, cy - h), min(size, cy + h)):
                    for x in range(max(0, cx - w), min(size, cx + w)):
                        pixels[y * size + x] = c

        salvar_ppm(pixels, size, size, os.path.join(out_dir, f'combo_{count:04d}.ppm'))
        count += 1

    return count


# ==========================================
# MAIN
# ==========================================

def main():
    print("=" * 60)
    print("BRANPY VQ-VAE — Gerador de Dataset de Imagens")
    print("100% branpy.com.br — Todos os direitos reservados")
    print("=" * 60)

    out_dir = criar_pasta_saida()
    total = 0

    print("\n[1/4] Padroes geometricos...")
    n = gerar_padroes_geometricos(out_dir)
    total += n
    print(f"  {n} imagens")

    print("[2/4] Formas simples...")
    n = gerar_formas_simples(out_dir)
    total += n
    print(f"  {n} imagens")

    print("[3/4] Noise e texturas...")
    n = gerar_noise_texturas(out_dir)
    total += n
    print(f"  {n} imagens")

    print("[4/4] Combinacoes...")
    n = gerar_combinacoes(out_dir)
    total += n
    print(f"  {n} imagens")

    print("\n" + "=" * 60)
    print(f"TOTAL: {total} imagens geradas")
    print(f"Pasta: {out_dir}")
    print(f"Formato: PPM (128x128)")
    print(f"Licenca: 100% branpy.com.br")
    print("=" * 60)


if __name__ == '__main__':
    main()
