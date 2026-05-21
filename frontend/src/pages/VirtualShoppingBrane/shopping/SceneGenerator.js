const W = 4096, H = 2048;

function grad(ctx, x1, y1, x2, y2, stops) {
  const g = ctx.createLinearGradient(x1, y1, x2, y2);
  stops.forEach(s => g.addColorStop(s[0], s[1]));
  return g;
}

function rgrad(ctx, x, y, r, stops) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  stops.forEach(s => g.addColorStop(s[0], s[1]));
  return g;
}

function hash(x, y, s) {
  const n = Math.sin(x * 127.1 + y * 311.7 + s) * 43758.5453;
  return n - Math.floor(n);
}

function fbm(x, y, seed, octaves) {
  let v = 0, amp = 0.5, freq = 1, total = 0;
  for (let i = 0; i < octaves; i++) {
    const sx = x * freq, sy = y * freq;
    const ix = Math.floor(sx), iy = Math.floor(sy);
    const fx = sx - ix, fy = sy - iy;
    const a = hash(ix, iy, seed + i);
    const b = hash(ix + 1, iy, seed + i);
    const c = hash(ix, iy + 1, seed + i);
    const d = hash(ix + 1, iy + 1, seed + i);
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    const lr = a + (b - a) * ux;
    const rr = c + (d - c) * ux;
    v += (lr + (rr - lr) * uy) * amp;
    total += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return v / total;
}

function rnd(seed) {
  let s = seed || 0;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function softShadow(ctx, x, y, w, h, blur, alpha) {
  ctx.save();
  ctx.shadowColor = `rgba(0,0,0,${alpha})`;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetY = blur * 0.3;
  ctx.fillStyle = 'rgba(0,0,0,0.01)';
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

export function generateFallback(id) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  try {
    const ctx = c.getContext('2d');
    const g = grad(ctx, 0, 0, 0, H, [
      [0, '#0a0a14'], [0.3, '#141428'], [0.6, '#1a1a30'], [1, '#0f0f20']
    ]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 120; i++) {
      ctx.fillStyle = `hsla(220, 30%, 60%, ${Math.random() * 0.08})`;
      ctx.beginPath();
      ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 4 + 1, 0, 6.28);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 36px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((id || '').replace(/-/g, ' ').toUpperCase(), W / 2, H / 2 - 10);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText('Clique nos pontos ⊙ para navegar', W / 2, H / 2 + 35);
  } catch (_) {}
  return c;
}

function renderSky(ctx) {
  const g = grad(ctx, 0, 0, 0, H * 0.42, [
    [0, '#0d1b2a'],
    [0.15, '#1b2d4a'],
    [0.3, '#2a4565'],
    [0.5, '#5a8aaa'],
    [0.7, '#8abada'],
    [0.85, '#b0d0e0'],
    [1, '#c8dce8'],
  ]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H * 0.42);

  for (let i = 0; i < 30; i++) {
    const cx = hash(i * 73, i * 97, 42) * W;
    const cy = hash(i * 131, i * 53, 42) * H * 0.18;
    const cw = 40 + hash(i * 29, i * 67, 42) * 120;
    const ch = cw * 0.25;
    const a = 0.04 + hash(i * 89, i * 41, 42) * 0.06;
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, cw, ch, 0, 0, 6.28);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx - cw * 0.5, cy + 3, cw * 0.7, ch * 1.2, 0, 0, 6.28);
    ctx.fill();
  }
}

function renderBuildings(ctx, baseY) {
  const rg = rnd(100);

  for (let x = -100; x < W + 100; x += 60 + rg() * 100) {
    const bw = 55 + rg() * 55;
    const bh = 120 + rg() * 280;
    const bx = x;
    const by = baseY - bh;

    const mat = Math.floor(rg() * 3);
    const hue = 210 + rg() * 40;

    ctx.save();

    if (mat === 0) {
      ctx.fillStyle = `hsl(${hue}, ${8 + rg() * 12}%, ${35 + rg() * 20}%)`;
      ctx.fillRect(bx, by, bw, bh);
      const noiseScale = 0.02;
      for (let ny = by; ny < by + bh; ny += 8) {
        for (let nx = bx; nx < bx + bw; nx += 4) {
          const n = fbm(nx * noiseScale, ny * noiseScale, 200, 3);
          ctx.fillStyle = `rgba(255,255,255,${n * 0.04})`;
          ctx.fillRect(nx, ny, 4, 8);
        }
      }
    } else if (mat === 1) {
      const brickH = 8, brickW = 16;
      for (let by2 = by; by2 < by + bh; by2 += brickH) {
        const offset = (Math.floor((by2 - by) / brickH) % 2) * (brickW / 2);
        for (let bx2 = bx - offset; bx2 < bx + bw; bx2 += brickW) {
          const v = 30 + hash(bx2 * 0.1, by2 * 0.1, 50) * 20;
          ctx.fillStyle = `hsl(15, ${5 + hash(bx2, by2, 60) * 10}%, ${v}%)`;
          ctx.fillRect(bx2, by2, brickW - 1, brickH - 1);
        }
      }
    } else {
      const panels = Math.ceil(bw / 30);
      for (let p = 0; p < panels; p++) {
        const v = 45 + hash(p * 10, x, 70) * 15;
        ctx.fillStyle = `hsl(200, ${5 + hash(p, x, 80) * 8}%, ${v}%)`;
        ctx.fillRect(bx + p * 30, by, 28, bh);
      }
    }

    for (let wy = by + 15; wy < by + bh - 20; wy += 25) {
      for (let wx = bx + 8; wx < bx + bw - 10; wx += 14) {
        const lit = fbm(wx * 0.05, wy * 0.05, 300 + Math.floor(bx / 10), 2) > 0.35;
        if (lit) {
          ctx.fillStyle = `hsl(40, 60%, ${55 + hash(wx, wy, 400) * 35}%)`;
          ctx.fillRect(wx, wy, 9, 14);
          ctx.fillStyle = 'rgba(255,220,150,0.05)';
          ctx.fillRect(wx + 1, wy + 1, 7, 3);
        } else {
          ctx.fillStyle = `hsl(220, 8%, ${12 + hash(wx, wy, 500) * 8}%)`;
          ctx.fillRect(wx, wy, 9, 14);
        }
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(wx, wy, 9, 14);
      }
    }

    const sh = 40;
    ctx.fillStyle = 'rgba(20,20,30,0.25)';
    ctx.fillRect(bx + 2, baseY - sh, bw - 4, sh);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(bx + 4, baseY - sh + 3, bw - 8, 10);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(bx + 4, baseY - sh + 3, bw - 8, 10);

    if (rg() > 0.3) {
      const signH = 8 + rg() * 6;
      ctx.fillStyle = `hsl(${rg() * 360}, 50%, 45%)`;
      ctx.fillRect(bx + 6, baseY - sh + 5, bw - 12, signH);
    }

    ctx.restore();
  }
}

function renderStreet(ctx, baseY) {
  const roadY = baseY - 22;

  const g = grad(ctx, 0, roadY, 0, roadY + 22, [
    [0, '#2a2a2a'], [0.3, '#333333'], [0.6, '#3a3a3a'], [1, '#2a2a2a']
  ]);
  ctx.fillStyle = g;
  ctx.fillRect(0, roadY, W, 22);

  ctx.save();
  for (let x = 0; x < W; x += 2) {
    for (let y = roadY; y < roadY + 22; y += 2) {
      const n = fbm(x * 0.04, y * 0.04, 999, 3);
      ctx.fillStyle = `rgba(255,255,255,${n * 0.015})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(220,210,160,0.35)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 10]);
  ctx.beginPath();
  ctx.moveTo(0, roadY + 11);
  ctx.lineTo(W, roadY + 11);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  const swY = baseY - 22;
  ctx.fillStyle = grad(ctx, 0, swY, 0, baseY, [
    [0, '#7a7a7a'], [0.3, '#888888'], [0.6, '#8a8a8a'], [1, '#7a7a7a']
  ]);
  ctx.fillRect(0, swY, W, 7);

  ctx.save();
  for (let x = 0; x < W; x += 3) {
    for (let y = swY; y < swY + 7; y += 2) {
      const n = fbm(x * 0.06, y * 0.06, 777, 2);
      ctx.fillStyle = `rgba(0,0,0,${n * 0.04})`;
      ctx.fillRect(x, y, 3, 2);
    }
  }
  ctx.restore();

  ctx.fillStyle = '#5a5a5a';
  ctx.fillRect(0, baseY - 24, W, 1.5);
  ctx.fillStyle = '#4a4a4a';
  ctx.fillRect(0, baseY - 26, W, 2);
}

function renderTrees(ctx, positions, baseY) {
  for (const [x] of positions) {
    const r = rnd(x * 7);

    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(x - 2.5, baseY - 32, 5, 14);

    for (let i = 0; i < 12; i++) {
      const fx = x + (r() - 0.5) * 28;
      const fy = baseY - 38 + (r() - 0.5) * 22;
      const fr = 7 + r() * 14;
      const h = 120 + r() * 40;
      const s = 25 + r() * 25;
      const l = 20 + r() * 20;
      ctx.fillStyle = `hsl(${h}, ${s}%, ${l}%)`;
      ctx.globalAlpha = 0.4 + r() * 0.4;
      ctx.beginPath();
      ctx.arc(fx, fy, fr, 0, 6.28);
      ctx.fill();
    }

    ctx.shadowColor = 'rgba(0,0,0,0.08)';
    ctx.shadowBlur = 12;
    const lx = x + (r() - 0.5) * 6;
    const ly = baseY - 44 + r() * 6;
    ctx.fillStyle = `hsl(130, 30%, 25%)`;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(lx, ly, 14 + r() * 8, 0, 6.28);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
}

function renderStreetLights(ctx, positions, baseY) {
  for (const x of positions) {
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(x - 1, baseY - 55, 2.5, 37);

    ctx.fillStyle = '#555';
    ctx.fillRect(x - 5, baseY - 58, 12, 4);

    const gg = rgrad(ctx, x, baseY - 58, 50, [
      [0, 'rgba(255,220,150,0.04)'],
      [0.15, 'rgba(255,220,150,0.025)'],
      [1, 'rgba(255,220,150,0)']
    ]);
    ctx.fillStyle = gg;
    ctx.fillRect(x - 50, baseY - 90, 100, 60);

    ctx.fillStyle = `rgba(255,200,120,0.12)`;
    ctx.beginPath();
    ctx.arc(x, baseY - 56, 5, 0, 6.28);
    ctx.fill();
  }
}

function renderCars(ctx, positions, baseY) {
  for (const [x, dir] of positions) {
    const cl = 30 + hash(x, 0, 50) * 20;
    ctx.save();
    ctx.fillStyle = `hsl(${cl}, ${20 + hash(x, 0, 60) * 30}%, ${20 + hash(x, 0, 70) * 25}%)`;
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;

    if (dir > 0) {
      ctx.fillRect(x, baseY - 14, 40, 10);
      ctx.fillRect(x + 5, baseY - 18, 30, 6);
    } else {
      ctx.fillRect(x, baseY - 14, 40, 10);
      ctx.fillRect(x + 5, baseY - 18, 30, 6);
    }

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(150,180,220,0.15)';
    ctx.fillRect(x + 5, baseY - 16, 8, 2);
    ctx.fillRect(x + 27, baseY - 16, 8, 2);

    ctx.fillStyle = 'rgba(10,10,10,0.6)';
    ctx.fillRect(x + 4, baseY - 5, 6, 3);
    ctx.fillRect(x + 30, baseY - 5, 6, 3);
    ctx.restore();
  }
}

function renderMallFacade(ctx, baseY) {
  const entW = 380, entH = 220;
  const entX = (W - entW) / 2, entY = baseY - entH;

  for (let py = 0; py < 4; py++) {
    for (let px = 0; px < 8; px++) {
      const v = 45 + hash(px, py, 100) * 15;
      ctx.fillStyle = `hsl(210, ${5 + hash(px, py, 110) * 8}%, ${v}%)`;
      ctx.fillRect(px * 60, entY + py * 60, 58, 58);
      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(px * 60, entY + py * 60, 58, 58);
    }
  }

  for (let gx = 0; gx < entW; gx += 60) {
    ctx.fillStyle = `rgba(140,180,210,${0.08 + (gx / entW) * 0.06})`;
    ctx.fillRect(entX + gx, entY + 30, 58, entH - 30);
    ctx.strokeStyle = 'rgba(100,100,120,0.15)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(entX + gx, entY + 30, 58, entH - 30);

    if ((gx / 60) % 2 === 0) {
      ctx.fillStyle = 'rgba(200,220,240,0.03)';
      const rx = entX + gx + 5, ry = entY + 40;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(rx, ry + 15);
      ctx.lineTo(rx + 18, ry);
      ctx.lineTo(rx + 48, ry);
      ctx.lineTo(rx + 48, ry + 15);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  for (let d = 0; d < 2; d++) {
    const dx = entX + 50 + d * (entW - 100);
    ctx.fillStyle = 'rgba(150,180,210,0.1)';
    ctx.fillRect(dx, entY + 50, 60, entH - 60);
    ctx.strokeStyle = 'rgba(150,150,170,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(dx, entY + 50, 60, entH - 60);

    ctx.fillStyle = '#666';
    ctx.fillRect(dx + 56, entY + entH / 2 - 10, 2, 20);
    ctx.fillRect(dx + 2, entY + entH / 2 - 10, 2, 20);
  }

  ctx.fillStyle = '#2a2a3a';
  ctx.fillRect(entX - 40, entY - 14, entW + 80, 14);
  ctx.fillStyle = '#3a3a4a';
  ctx.fillRect(entX - 40, entY - 16, entW + 80, 2);

  ctx.fillStyle = '#4a2a6a';
  ctx.shadowColor = 'rgba(100,60,180,0.15)';
  ctx.shadowBlur = 20;
  ctx.fillRect((W - 280) / 2, entY - 50, 280, 26);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#c0c0e0';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✦  SHOPPING BRANE  ✦', W / 2, entY - 32);

  for (let s = 0; s < 4; s++) {
    const yOff = s * 4;
    ctx.fillStyle = `hsl(0, 0%, ${45 - s * 5}%)`;
    ctx.fillRect(entX - 40 + s * 6, baseY - 2 + yOff, entW + 80 - s * 12, 4);
  }

  ctx.fillStyle = '#4a4a5a';
  ctx.fillRect(entX - 60, entY + entH - 10, 20, entH - 40);
  ctx.fillRect(entX + entW + 40, entY + entH - 10, 20, entH - 40);
}

function renderMallExterior(ctx, baseY) {
  const wallGrad = grad(ctx, 0, H * 0.15, 0, baseY, [
    [0, '#4a5a6a'], [0.3, '#3a4a5a'], [0.6, '#3a4a5a'], [1, '#2a3a4a']
  ]);
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, H * 0.15, W, baseY - H * 0.15);
}

function renderMallHall(ctx) {
  const floorY = H * 0.78;

  const cg = grad(ctx, 0, 0, 0, H * 0.1, [
    [0, '#e8e8f0'], [0.5, '#d0d0da'], [1, '#b8b8c4']
  ]);
  ctx.fillStyle = cg;
  ctx.fillRect(0, 0, W, H * 0.1);

  for (let x = 0; x < W; x += 50) {
    ctx.fillStyle = `rgba(180,200,220,${0.04 + (Math.floor(x / 100) % 2 === 0 ? 0.03 : 0)})`;
    ctx.fillRect(x, H * 0.1 - 4, 48, 8);
    ctx.strokeStyle = 'rgba(200,200,220,0.04)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x, H * 0.1 - 4, 48, 8);
  }

  ctx.fillStyle = grad(ctx, 0, H * 0.1, 0, floorY, [
    [0, '#d8d8e4'], [0.2, '#c8c8d4'], [0.5, '#c0c0cc'], [0.8, '#b8b8c4'], [1, '#b0b0bc']
  ]);
  ctx.fillRect(0, H * 0.1, W, floorY - H * 0.1);

  const fg = grad(ctx, 0, floorY - 60, 0, floorY, [
    [0, '#c8c0b8'], [0.2, '#c0b8b0'], [0.5, '#b8b0a8'], [0.8, '#b0a8a0'], [1, '#a8a098']
  ]);
  ctx.fillStyle = fg;
  ctx.fillRect(0, floorY - 60, W, 60);

  ctx.save();
  for (let x = 0; x < W; x += 3) {
    for (let y = floorY - 60; y < floorY; y += 3) {
      const n = fbm(x * 0.015, y * 0.015, 555, 4);
      ctx.fillStyle = `rgba(255,255,255,${n * 0.02})`;
      ctx.fillRect(x, y, 3, 3);
    }
  }
  ctx.restore();

  ctx.strokeStyle = 'rgba(100,90,80,0.06)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < W; x += 32) {
    ctx.beginPath(); ctx.moveTo(x, floorY - 60); ctx.lineTo(x, floorY); ctx.stroke();
  }
  for (let y = floorY - 60; y < floorY; y += 32) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  const rf = ctx.getImageData(0, 0, W, floorY);
  const rfCanvas = document.createElement('canvas');
  rfCanvas.width = W; rfCanvas.height = floorY;
  const rfx = rfCanvas.getContext('2d');
  rfx.putImageData(rf, 0, 0);
  ctx.save();
  ctx.translate(0, floorY * 2 - 60);
  ctx.scale(1, -1);
  ctx.globalAlpha = 0.06;
  rfx.drawImage(rfCanvas, 0, 0);
  ctx.drawImage(rfCanvas, 0, 0);
  ctx.restore();
  ctx.globalAlpha = 1;

  const storeW = 200, storeH = floorY - H * 0.22;
  const stores = [
    { x: 40, hue: 280, name: 'SNEAKER KING' },
    { x: 270, hue: 200, name: 'FASHION' },
    { x: 500, hue: 10, name: 'TECHWORLD' },
    { x: 730, hue: 40, name: 'LUX GOLD' },
    { x: 960, hue: 120, name: 'SUPER MARKET' },
    { x: 1190, hue: 330, name: 'GLOW BEAUTY' },
    { x: 1420, hue: 30, name: 'FOOD COURT' },
    { x: 1650, hue: 220, name: 'SPORTS' },
    { x: 1880, hue: 60, name: 'BOOKS' },
  ];

  for (const s of stores) {
    const sy = H * 0.22;
    const sh = floorY - sy;

    ctx.fillStyle = `hsl(${s.hue}, 15%, 35%)`;
    ctx.fillRect(s.x, sy, storeW, sh);

    const fg1 = grad(ctx, s.x, sy, s.x, sy + sh, [
      [0, `hsla(${s.hue}, 20%, 45%, 0.3)`],
      [1, `hsla(${s.hue}, 20%, 25%, 0.3)`]
    ]);
    ctx.fillStyle = fg1;
    ctx.fillRect(s.x, sy, storeW, sh);

    const gw = 4 + Math.floor(Math.random() * 2);
    for (let gp = 0; gp < gw; gp++) {
      const gx = s.x + 5 + gp * ((storeW - 10) / gw);
      ctx.fillStyle = 'rgba(160,190,220,0.06)';
      ctx.fillRect(gx, sy + 12, (storeW - 10) / gw - 2, sh - 20);
      ctx.strokeStyle = 'rgba(150,150,180,0.06)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(gx, sy + 12, (storeW - 10) / gw - 2, sh - 20);
    }

    ctx.fillStyle = `hsl(${s.hue}, 45%, 45%)`;
    ctx.shadowColor = `hsla(${s.hue}, 60%, 50%, 0.1)`;
    ctx.shadowBlur = 8;
    ctx.fillRect(s.x + 8, sy + 3, storeW - 16, 16);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fff';
    ctx.font = '7px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(s.name, s.x + storeW / 2, sy + 14);
  }

  for (let cx = 250; cx < W - 200; cx += 380) {
    ctx.fillStyle = '#7a7a8a';
    ctx.fillRect(cx - 5, H * 0.15, 10, floorY - H * 0.15);
    const cg2 = grad(ctx, cx - 5, H * 0.15, cx + 5, floorY, [
      [0, '#8a8a9a'], [0.5, '#7a7a8a'], [1, '#6a6a7a']
    ]);
    ctx.fillStyle = cg2;
    ctx.fillRect(cx - 3, H * 0.15, 6, floorY - H * 0.15);
  }

  [80, 660, 1300, 1950].forEach(x => {
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(x - 10, floorY - 22, 20, 14);
    for (let i = 0; i < 10; i++) {
      const px = x + (Math.random() - 0.5) * 35;
      const py = floorY - 30 + (Math.random() - 0.5) * 16;
      const pr = 5 + Math.random() * 12;
      ctx.fillStyle = `hsl(${120 + Math.random() * 40}, ${20 + Math.random() * 30}%, ${20 + Math.random() * 20}%)`;
      ctx.globalAlpha = 0.5 + Math.random() * 0.3;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, 6.28);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });

  const escX = W / 2 + 20;
  const escH = floorY - H * 0.35;
  ctx.fillStyle = '#5a5a6a';
  ctx.fillRect(escX, H * 0.35, 35, escH);

  for (let s = 0; s < 15; s++) {
    const sy = H * 0.35 + (s / 15) * escH;
    ctx.fillStyle = '#4a4a5a';
    ctx.fillRect(escX + 2, sy, 31, 3);
    ctx.fillStyle = '#7a7a8a';
    ctx.fillRect(escX + 3, sy + 1, 29, 1);
  }

  ctx.fillStyle = '#6a6a7a';
  ctx.fillRect(escX - 2, H * 0.35, 2, escH);
  ctx.fillRect(escX + 35, H * 0.35, 2, escH);

  [200, 900, 1550].forEach(x => {
    ctx.fillStyle = '#4a3a2a';
    ctx.fillRect(x, floorY - 12, 65, 8);
    ctx.fillRect(x + 5, floorY - 15, 4, 3);
    ctx.fillRect(x + 56, floorY - 15, 4, 3);
  });
}

function renderStoreInterior(ctx) {
  const baseY = H;

  const fg = grad(ctx, 0, baseY - 100, 0, baseY, [
    [0, '#4a4a5a'], [0.3, '#3a3a4a'], [0.7, '#2a2a3a'], [1, '#1a1a2a']
  ]);
  ctx.fillStyle = fg;
  ctx.fillRect(0, baseY - 100, W, 100);

  ctx.strokeStyle = 'rgba(200,200,220,0.03)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < W; x += 30) {
    ctx.beginPath(); ctx.moveTo(x, baseY - 100); ctx.lineTo(x, baseY); ctx.stroke();
  }
  for (let y = baseY - 100; y < baseY; y += 30) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  const cg = grad(ctx, 0, 0, 0, H * 0.12, [
    [0, '#e0e0e8'], [0.5, '#d0d0d8'], [1, '#c0c0c8']
  ]);
  ctx.fillStyle = cg;
  ctx.fillRect(0, 0, W, H * 0.12);

  for (let x = 50; x < W - 50; x += 130) {
    ctx.fillStyle = 'rgba(240,240,250,0.5)';
    ctx.fillRect(x, H * 0.1, 45, 8);
    ctx.fillStyle = 'rgba(250,250,255,0.08)';
    ctx.fillRect(x - 10, H * 0.1 + 1, 65, 4);
    const lg = rgrad(ctx, x + 22, H * 0.14, 80, [
      [0, 'rgba(240,240,255,0.06)'],
      [0.3, 'rgba(240,240,255,0.02)'],
      [1, 'rgba(240,240,255,0)']
    ]);
    ctx.fillStyle = lg;
    ctx.fillRect(x - 50, H * 0.1, 140, 80);
  }
}

function renderStoreFront(ctx, hue, shelfHue, id) {
  renderStoreInterior(ctx);

  const wallY = H * 0.12;
  const wallH = H * 0.58;
  ctx.fillStyle = `hsl(${hue}, 12%, 50%)`;
  ctx.fillRect(0, wallY, W, wallH);

  ctx.save();
  for (let x = 0; x < W; x += 4) {
    for (let y = wallY; y < wallY + wallH; y += 4) {
      const n = fbm(x * 0.01, y * 0.01, 444 + hue, 3);
      ctx.fillStyle = `rgba(0,0,0,${n * 0.03})`;
      ctx.fillRect(x, y, 4, 4);
    }
  }
  ctx.restore();

  ctx.fillStyle = `hsl(${hue}, 8%, 30%)`;
  ctx.fillRect(0, wallY + wallH - 6, W, 6);

  const shelfY = H * 0.22;
  const shelfH2 = H * 0.42;
  const rng = rnd(id ? id.charCodeAt(0) || 99 : 99);

  for (let sx = 20; sx < W - 20; sx += 120 + rng() * 60) {
    ctx.fillStyle = `hsl(${shelfHue}, 15%, 35%)`;
    ctx.fillRect(sx, shelfY, 80, shelfH2);

    ctx.fillStyle = `hsla(0, 0%, 0%, 0.15)`;
    ctx.fillRect(sx, shelfY, 80, shelfH2);
    ctx.fillStyle = `hsla(0, 0%, 100%, 0.04)`;
    ctx.fillRect(sx, shelfY, 80, 2);
    ctx.fillRect(sx, shelfY + shelfH2 - 2, 80, 2);

    for (let ri = 0; ri < 4; ri++) {
      const ry = shelfY + (ri / 4) * shelfH2;
      ctx.fillStyle = `hsl(${shelfHue}, 12%, 42%)`;
      ctx.fillRect(sx, ry, 80, 1.5);

      for (let px = sx + 4; px < sx + 76; px += 12 + rng() * 8) {
        if (rng() > 0.15) {
          const ph = 7 + rng() * 10;
          const pw = 6 + rng() * 5;
          const py = ry - ph;
          ctx.fillStyle = `hsl(${rng() * 360}, 45%, ${35 + rng() * 35}%)`;
          ctx.shadowColor = 'rgba(0,0,0,0.06)';
          ctx.shadowBlur = 2;
          ctx.fillRect(px, py, pw, ph);
          ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          ctx.fillRect(px, py, pw, 1.5);
        }
      }
    }

    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillRect(sx + 2, shelfY + shelfH2 - 16, 76, 14);
  }

  const names = {
    'shoe-store': 'SNEAKER KING',
    'clothes-store': 'FASHION STORE',
    'electronics': 'TECHWORLD',
    'supermarket': 'SUPER MARKET',
    'perfume-store': 'GLOW BEAUTY',
    'jewelry-store': 'LUX GOLD',
    'food-court': 'FOOD COURT',
  };
  const name = names[id] || 'LOJA';

  ctx.shadowColor = `hsla(${hue + 40}, 60%, 50%, 0.12)`;
  ctx.shadowBlur = 15;
  ctx.fillStyle = `hsl(${hue + 40}, 55%, 45%)`;
  ctx.fillRect(W / 2 - 140, H * 0.14, 280, 20);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name, W / 2, H * 0.155 + 6);
}

export function generateScene(id) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return generateFallback(id);

    ctx.clearRect(0, 0, W, H);

    switch (id) {
      case 'city-street-1':
      case 'city-street-2': {
        const baseY = Math.round(H * 0.7);
        renderSky(ctx);
        renderBuildings(ctx, baseY);
        renderStreet(ctx, baseY);
        renderTrees(ctx, [
          [120], [380], [560], [720], [880], [1150], [1450], [1750], [2050],
          [2300], [2600], [2900], [3150], [3400], [3650], [3900]
        ], baseY);
        renderStreetLights(ctx, [220, 520, 820, 1120, 1420, 1720, 2020, 2320, 2620, 2920, 3220, 3520, 3820], baseY);
        renderCars(ctx, [
          [200, 1], [600, -1], [1000, 1], [1400, -1], [1800, 1],
          [2200, -1], [2600, 1], [3000, -1], [3400, 1], [3800, -1]
        ], baseY);
        break;
      }
      case 'mall-entrance': {
        const baseY = Math.round(H * 0.68);
        renderSky(ctx);
        renderMallExterior(ctx, baseY);
        renderMallFacade(ctx, baseY);
        renderStreet(ctx, baseY);
        renderTrees(ctx, [[150], [500], [900], [1300], [1700], [2100], [2500], [2900], [3300], [3700]], baseY);
        renderStreetLights(ctx, [300, 700, 1100, 1500, 1900, 2300, 2700, 3100, 3500, 3900], baseY);
        break;
      }
      case 'mall-hall': {
        renderMallHall(ctx);
        break;
      }
      case 'shoe-store':
      case 'clothes-store':
      case 'electronics':
      case 'supermarket':
      case 'perfume-store':
      case 'jewelry-store':
      case 'food-court': {
        const hues = {
          'shoe-store': [30, 50],
          'clothes-store': [220, 80],
          'electronics': [190, 60],
          'supermarket': [100, 70],
          'perfume-store': [330, 40],
          'jewelry-store': [40, 30],
          'food-court': [25, 55],
        };
        const [h, sh] = hues[id] || [200, 50];
        renderStoreFront(ctx, h, sh, id);
        break;
      }
      default:
        return generateFallback(id);
    }

    return canvas;
  } catch (e) {
    return generateFallback(id);
  }
}
