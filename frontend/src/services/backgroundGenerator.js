const W = 540;
const H = 960;
const cache = {};

function _cover(img, cw, ch) {
  const r = Math.max(cw / img.width, ch / img.height);
  return { dw: img.width * r, dh: img.height * r };
}

function _grad(ctx, y1, y2, c1, c2) {
  const g = ctx.createLinearGradient(0, y1, 0, y2);
  g.addColorStop(0, c1);
  g.addColorStop(1, c2);
  return g;
}

function _rect(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}

function _rrect(ctx, x, y, w, h, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function _shadow(ctx, blur, color) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}

function _noShadow(ctx) {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

function _ellipse(ctx, x, y, rx, ry, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function _line(ctx, x1, y1, x2, y2, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

// ── Gamer Setup ──

function bgGamer(ctx) {
  _rect(ctx, 0, 0, W, H, '#0a0a12');
  _rect(ctx, 0, 0, W, H, _grad(ctx, 0, H, '#0f0f1a', '#050508'));

  _rect(ctx, 20, H * 0.72, W - 40, H * 0.3, _grad(ctx, H * 0.72, H, '#1a1410', '#0d0b08'));
  _line(ctx, 20, H * 0.72, W - 20, H * 0.72, '#2a1f18', 2);

  _rrect(ctx, W * 0.15, H * 0.18, W * 0.7, H * 0.38, 8, '#111');
  _rrect(ctx, W * 0.17, H * 0.20, W * 0.66, H * 0.34, 4, _grad(ctx, H * 0.2, H * 0.54, '#1a1a2e', '#0a0a15'));
  const glow = ctx.createRadialGradient(W * 0.5, H * 0.37, 10, W * 0.5, H * 0.37, W * 0.3);
  glow.addColorStop(0, 'rgba(0,200,255,0.06)');
  glow.addColorStop(1, 'rgba(0,200,255,0)');
  _rect(ctx, 0, 0, W, H, glow);

  _rect(ctx, W * 0.35, H * 0.56, W * 0.3, H * 0.06, _grad(ctx, H * 0.56, H * 0.62, '#222', '#111'));
  for (let i = 0; i < 12; i++) {
    const kx = W * 0.36 + i * (W * 0.028);
    const ky = H * 0.57;
    const hue = (i * 30 + Date.now() * 0.01) % 360;
    ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.3)`;
    ctx.fillRect(kx, ky, 8, 12);
  }

  _ellipse(ctx, W * 0.78, H * 0.64, 12, 8, '#222');
  _line(ctx, W * 0.78, H * 0.64, W * 0.78, H * 0.72, '#444', 2);

  _rrect(ctx, W * 0.82, H * 0.12, W * 0.14, H * 0.08, 4, '#1a1a2e');
  _rrect(ctx, W * 0.84, H * 0.14, W * 0.10, H * 0.04, 2, _grad(ctx, H * 0.14, H * 0.18, '#0ff', '#06f'));

  for (let i = 0; i < 20; i++) {
    const lx = 20 + i * ((W - 40) / 19);
    const ly = H * 0.73;
    const hue = (i * 18) % 360;
    ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${0.15 + Math.sin(i * 0.5) * 0.08})`;
    _rrect(ctx, lx, ly, (W - 40) / 22, 4, 2, ctx.fillStyle);
  }
}

// ── Kitchen ──

function bgCozinha(ctx) {
  _rect(ctx, 0, 0, W, H, _grad(ctx, 0, H * 0.4, '#f5f0e8', '#e8e0d0'));
  _rect(ctx, 0, H * 0.4, W, H * 0.6, _grad(ctx, H * 0.4, H, '#d4c8b8', '#c0b0a0'));

  for (let x = 0; x < W; x += 30) {
    for (let y = H * 0.4; y < H * 0.42; y += 15) {
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(x, y, 28, 13);
    }
  }

  _rect(ctx, 0, H * 0.42, W, H * 0.34, _grad(ctx, H * 0.42, H * 0.76, '#8b7355', '#6b5335'));
  _line(ctx, 0, H * 0.42, W, H * 0.42, '#5a4a3a', 3);
  _line(ctx, 0, H * 0.76, W, H * 0.76, '#5a4a3a', 3);

  _rrect(ctx, W * 0.05, H * 0.04, W * 0.42, H * 0.30, 6, _grad(ctx, H * 0.04, H * 0.34, '#e8e0d0', '#ddd5c5'));
  _rrect(ctx, W * 0.53, H * 0.04, W * 0.42, H * 0.30, 6, _grad(ctx, H * 0.04, H * 0.34, '#e8e0d0', '#ddd5c5'));
  _rrect(ctx, W * 0.06, H * 0.06, W * 0.18, H * 0.10, 3, '#fff');
  _rrect(ctx, W * 0.54, H * 0.06, W * 0.18, H * 0.10, 3, '#fff');

  _ellipse(ctx, W * 0.25, H * 0.52, 25, 18, '#444');
  _ellipse(ctx, W * 0.25, H * 0.52, 20, 14, '#555');
  _line(ctx, W * 0.27, H * 0.48, W * 0.27, H * 0.44, '#777', 3);
  _line(ctx, W * 0.23, H * 0.48, W * 0.23, H * 0.44, '#777', 3);

  _ellipse(ctx, W * 0.65, H * 0.58, 22, 16, '#e63946');
  _ellipse(ctx, W * 0.70, H * 0.54, 20, 14, '#f4a261');
  _ellipse(ctx, W * 0.60, H * 0.56, 18, 12, '#2a9d8f');
}

// ── Beauty ──

function bgBeleza(ctx) {
  _rect(ctx, 0, 0, W, H, _grad(ctx, 0, H, '#fce4ec', '#f8e8f0'));
  _rect(ctx, 0, H * 0.5, W, H * 0.5, _grad(ctx, H * 0.5, H, '#f0d0d8', '#e8c0d0'));

  _rrect(ctx, W * 0.2, H * 0.08, W * 0.6, H * 0.35, 12, '#fff');
  _rrect(ctx, W * 0.2, H * 0.08, W * 0.6, H * 0.35, 12, 'rgba(255,200,220,0.2)');
  _ellipse(ctx, W * 0.5, H * 0.25, 50, 60, 'rgba(255,220,230,0.3)');

  _rect(ctx, W * 0.1, H * 0.52, W * 0.8, H * 0.06, _grad(ctx, H * 0.52, H * 0.58, '#e8d0d8', '#d8c0c8'));
  _line(ctx, W * 0.1, H * 0.52, W * 0.9, H * 0.52, '#d0b0b8', 2);

  for (let i = 0; i < 5; i++) {
    const bx = W * 0.12 + i * (W * 0.18);
    const bh = 40 + i * 8;
    _rrect(ctx, bx, H * 0.62, 30, bh, 4, `hsl(${320 + i * 20}, 40%, ${70 + i * 3}%)`);
    _rrect(ctx, bx + 2, H * 0.62 + bh - 8, 26, 8, 2, '#fff');
  }

  _ellipse(ctx, W * 0.5, H * 0.80, 30, 8, 'rgba(255,100,150,0.2)');

  for (let i = 0; i < 8; i++) {
    const sx = Math.random() * W;
    const sy = Math.random() * H;
    ctx.fillStyle = `rgba(255, 200, 220, ${0.1 + Math.random() * 0.15})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 1 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Pet ──

function bgPet(ctx) {
  _rect(ctx, 0, 0, W, H, _grad(ctx, 0, H * 0.5, '#fefae0', '#f0e6c8'));
  _rect(ctx, 0, H * 0.5, W, H * 0.5, _grad(ctx, H * 0.5, H, '#e8dcc0', '#d8ccb0'));

  _line(ctx, 0, H * 0.5, W, H * 0.5, '#c0b498', 2);

  _ellipse(ctx, W * 0.3, H * 0.70, 70, 30, _grad(ctx, H * 0.7, H * 0.7, '#d4a574', '#c4956a'));
  _ellipse(ctx, W * 0.3, H * 0.68, 60, 25, '#dbb08c');

  _circle(ctx, W * 0.65, H * 0.08, 8, '#e63946');
  _circle(ctx, W * 0.70, H * 0.12, 6, '#457b9d');
  _circle(ctx, W * 0.60, H * 0.15, 10, '#2a9d8f');
  _circle(ctx, W * 0.72, H * 0.06, 5, '#f4a261');

  _ellipse(ctx, W * 0.5, H * 0.38, 45, 12, '#d4a574');
  _rect(ctx, W * 0.1, H * 0.36, W * 0.8, H * 0.02, _grad(ctx, H * 0.36, H * 0.38, '#c4956a', '#b08560'));
  _line(ctx, W * 0.1, H * 0.36, W * 0.9, H * 0.36, '#b08560', 2);

  for (let i = 0; i < 4; i++) {
    const dx = W * 0.15 + i * (W * 0.2);
    _ellipse(ctx, dx, H * 0.50, 8, 3, '#c4956a');
  }
}

function _circle(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// ── Moda / Fashion ──

function bgModa(ctx) {
  _rect(ctx, 0, 0, W, H, _grad(ctx, 0, H, '#fdf6f0', '#f5e8dc'));

  for (let i = 0; i < 12; i++) {
    const lx = W * 0.06 + i * (W * 0.08);
    _line(ctx, lx, H * 0.04, lx, H * 0.16, '#d0c0b0', 1);
  }
  _rect(ctx, W * 0.04, H * 0.02, W * 0.92, H * 0.02, _grad(ctx, H * 0.02, H * 0.04, '#d0c0b0', '#c0b0a0'));

  const colors = ['#e63946', '#457b9d', '#2a9d8f', '#f4a261', '#e9c46a'];
  for (let i = 0; i < 5; i++) {
    const cx = W * 0.1 + i * (W * 0.17);
    ctx.fillStyle = colors[i];
    ctx.beginPath();
    ctx.moveTo(cx, H * 0.18);
    ctx.lineTo(cx + 30, H * 0.22);
    ctx.lineTo(cx + 25, H * 0.42);
    ctx.lineTo(cx + 5, H * 0.42);
    ctx.closePath();
    ctx.fill();
  }

  _ellipse(ctx, W * 0.3, H * 0.55, 18, 40, '#d0c0b0');
  _ellipse(ctx, W * 0.7, H * 0.55, 18, 40, '#d0c0b0');

  _rect(ctx, W * 0.25, H * 0.30, W * 0.5, H * 0.35, 'rgba(255,255,255,0.15)');
  _rect(ctx, W * 0.25, H * 0.30, W * 0.5, H * 0.35, 'rgba(200,180,160,0.08)');

  for (let i = 0; i < 6; i++) {
    const sx = W * 0.1 + Math.random() * W * 0.8;
    const sy = H * 0.05 + Math.random() * H * 0.3;
    ctx.fillStyle = `rgba(200,180,160,${0.05 + Math.random() * 0.08})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 1 + Math.random() * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Fitness ──

function bgFitness(ctx) {
  _rect(ctx, 0, 0, W, H, _grad(ctx, 0, H * 0.6, '#2a2a35', '#1a1a25'));
  _rect(ctx, 0, H * 0.6, W, H * 0.4, _grad(ctx, H * 0.6, H, '#1a1a20', '#0f0f15'));

  for (let x = 0; x < W; x += 60) {
    for (let y = H * 0.6; y < H; y += 60) {
      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      ctx.fillRect(x, y, 58, 58);
    }
  }

  _rrect(ctx, W * 0.35, H * 0.42, W * 0.3, H * 0.12, 10, _grad(ctx, H * 0.42, H * 0.54, '#555', '#333'));
  _line(ctx, W * 0.35, H * 0.46, W * 0.65, H * 0.46, '#777', 2);
  _line(ctx, W * 0.35, H * 0.50, W * 0.65, H * 0.50, '#777', 2);

  _ellipse(ctx, W * 0.25, H * 0.25, 20, 30, '#444');
  _ellipse(ctx, W * 0.75, H * 0.25, 20, 30, '#444');

  _rect(ctx, W * 0.22, H * 0.08, W * 0.56, H * 0.14, _grad(ctx, H * 0.08, H * 0.22, '#3a3a4a', '#2a2a3a'));
  _rect(ctx, W * 0.22, H * 0.08, W * 0.56, H * 0.14, 'rgba(100,150,255,0.05)');

  for (let i = 0; i < 5; i++) {
    const px = W * 0.1 + i * (W * 0.2);
    const py = H * 0.7 + Math.sin(i * 1.5) * 10;
    ctx.fillStyle = 'rgba(255,100,50,0.08)';
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Casa / Living Room ──

function bgCasa(ctx) {
  _rect(ctx, 0, 0, W, H, _grad(ctx, 0, H * 0.5, '#e8e0d8', '#d8d0c8'));
  _rect(ctx, 0, H * 0.5, W, H * 0.5, _grad(ctx, H * 0.5, H, '#c8c0b8', '#b8b0a8'));

  _rect(ctx, W * 0.08, H * 0.05, W * 0.4, H * 0.42, '#fff');
  _rect(ctx, W * 0.08, H * 0.05, W * 0.4, H * 0.42, 'rgba(200,220,255,0.15)');
  _line(ctx, W * 0.08, H * 0.05, W * 0.48, H * 0.05, '#c0b8b0', 2);
  _line(ctx, W * 0.08, H * 0.47, W * 0.48, H * 0.47, '#c0b8b0', 2);
  _line(ctx, W * 0.08, H * 0.05, W * 0.08, H * 0.47, '#c0b8b0', 2);
  _line(ctx, W * 0.48, H * 0.05, W * 0.48, H * 0.47, '#c0b8b0', 2);
  _rect(ctx, W * 0.15, H * 0.12, W * 0.26, H * 0.28, 'rgba(150,200,255,0.08)');

  _rect(ctx, W * 0.15, H * 0.55, W * 0.7, H * 0.32, _grad(ctx, H * 0.55, H * 0.87, '#a08060', '#8a7050'));
  _rrect(ctx, W * 0.15, H * 0.55, W * 0.7, H * 0.32, 8, 'rgba(0,0,0,0.1)');
  for (let i = 0; i < 3; i++) {
    _ellipse(ctx, W * 0.22 + i * W * 0.25, H * 0.60, 25, 15, '#8a7050');
  }

  _ellipse(ctx, W * 0.12, H * 0.80, 15, 25, '#b8a898');
  _ellipse(ctx, W * 0.88, H * 0.80, 15, 25, '#b8a898');

  _rect(ctx, W * 0.55, H * 0.52, W * 0.06, H * 0.08, '#5a4a3a');
  ctx.fillStyle = '#f4a261';
  ctx.beginPath();
  ctx.moveTo(W * 0.55, H * 0.52);
  ctx.lineTo(W * 0.58, H * 0.48);
  ctx.lineTo(W * 0.61, H * 0.52);
  ctx.closePath();
  ctx.fill();
}

// ── Tecnologia / Tech ──

function bgTech(ctx) {
  _rect(ctx, 0, 0, W, H, _grad(ctx, 0, H, '#1a1a2e', '#0f0f1a'));

  _rect(ctx, 20, H * 0.65, W - 40, H * 0.35, _grad(ctx, H * 0.65, H, '#1a1612', '#0f0d0a'));
  _line(ctx, 20, H * 0.65, W - 20, H * 0.65, '#2a2218', 2);

  _rect(ctx, W * 0.12, H * 0.10, W * 0.40, H * 0.28, '#111');
  _rect(ctx, W * 0.14, H * 0.12, W * 0.36, H * 0.24, _grad(ctx, H * 0.12, H * 0.36, '#1a1a3e', '#0a0a1a'));
  const sg = ctx.createRadialGradient(W * 0.32, H * 0.24, 5, W * 0.32, H * 0.24, 60);
  sg.addColorStop(0, 'rgba(0,150,255,0.08)');
  sg.addColorStop(1, 'rgba(0,150,255,0)');
  _rect(ctx, 0, 0, W, H, sg);

  _rect(ctx, W * 0.58, H * 0.12, W * 0.30, H * 0.18, '#111');
  _rect(ctx, W * 0.60, H * 0.14, W * 0.26, H * 0.14, _grad(ctx, H * 0.14, H * 0.28, '#222', '#111'));

  _rect(ctx, W * 0.60, H * 0.15, W * 0.08, H * 0.12, _grad(ctx, H * 0.15, H * 0.27, '#06f', '#0055cc'));

  _rect(ctx, W * 0.42, H * 0.52, W * 0.16, H * 0.12, _grad(ctx, H * 0.52, H * 0.64, '#222', '#111'));

  for (let i = 0; i < 15; i++) {
    const lx = 25 + i * ((W - 50) / 14);
    const ly = H * 0.665;
    ctx.fillStyle = `rgba(0,200,255,${0.05 + Math.sin(i * 0.8) * 0.03})`;
    ctx.fillRect(lx, ly, (W - 50) / 16, 2);
  }

  for (let i = 0; i < 8; i++) {
    const px = W * 0.05 + i * W * 0.11;
    const py = H * 0.4 + Math.sin(i * 1.3) * 15;
    ctx.fillStyle = `rgba(0,200,255,${0.04 + Math.sin(i * 0.7) * 0.02})`;
    ctx.beginPath();
    ctx.arc(px, py, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Default fallback ──

function bgDefault(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1a1a2e');
  g.addColorStop(0.5, '#16213e');
  g.addColorStop(1, '#0f3460');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 10; i++) {
    const px = (W * 0.05 + i * W * 0.1 + Math.sin(i * 1.7) * 20) % W;
    const py = (H * 0.05 + i * H * 0.1 + Math.cos(i * 2.3) * 15) % H;
    ctx.fillStyle = `rgba(255,255,255,${0.03 + Math.sin(i * 0.5) * 0.02})`;
    ctx.beginPath();
    ctx.arc(px, py, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

const RENDERERS = {
  gamer: bgGamer,
  tecnologia: bgTech,
  cozinha: bgCozinha,
  beleza: bgBeleza,
  pet: bgPet,
  moda: bgModa,
  fitness: bgFitness,
  casa: bgCasa,
};

export function generateBackground(category, width = W, height = H) {
  const key = `${category}_${width}_${height}`;
  if (cache[key]) return cache[key];

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const renderer = RENDERERS[category] || bgDefault;
  renderer(ctx);

  const img = new Image();
  img.src = canvas.toDataURL('image/png');
  cache[key] = img;
  return img;
}

export function getBackgroundCategory(categoria) {
  const map = {
    gamer: 'gamer', tecnologia: 'tecnologia', celular: 'tecnologia', eletrônicos: 'tecnologia',
    cozinha: 'cozinha', beleza: 'beleza', fitness: 'fitness', moda: 'moda', roupa: 'moda',
    pet: 'pet', casa: 'casa', eletronicos: 'tecnologia',
  };
  return map[categoria] || 'default';
}
