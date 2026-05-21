const W = 2048, H = 1024;

function grad(ctx, x1, y1, x2, y2, stops) {
  const g = ctx.createLinearGradient(x1, y1, x2, y2);
  stops.forEach(s => g.addColorStop(s[0], s[1]));
  return g;
}

function rnd(seed) {
  let s = seed || 0;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function drawBuildings(ctx, side, startX, endX, baseY, height, seed, colorBase) {
  const rand = rnd(seed);
  for (let x = startX; x < endX; x += 60 + rand() * 80) {
    const bw = 50 + rand() * 40;
    const bh = 80 + rand() * 180;
    const bx = x;
    const by = baseY - bh;

    // Building body
    const bCol = colorBase + Math.floor(rand() * 30);
    ctx.fillStyle = `hsl(${bCol}, ${15 + rand() * 20}%, ${35 + rand() * 25}%)`;
    ctx.fillRect(bx, by, bw, bh);

    // Roof detail
    ctx.fillStyle = `hsl(${bCol}, 10%, 25%)`;
    ctx.fillRect(bx - 1, by - 2, bw + 2, 4);

    // Windows
    for (let wy = by + 10; wy < by + bh - 10; wy += 18) {
      for (let wx = bx + 6; wx < bx + bw - 8; wx += 12) {
        const lit = rand() > 0.4;
        ctx.fillStyle = lit ? `hsl(45, 80%, ${60 + rand() * 30}%)` : `hsl(220, 10%, 20%)`;
        ctx.fillRect(wx, wy, 7, 10);
        if (lit) {
          ctx.fillStyle = `hsla(45, 80%, 70%, 0.08)`;
          ctx.fillRect(wx + 1, wy + 1, 5, 3);
        }
      }
    }

    // Window frames
    ctx.strokeStyle = `hsla(0, 0%, 20%, 0.3)`;
    ctx.lineWidth = 0.5;
    for (let wy = by + 10; wy < by + bh - 10; wy += 18) {
      for (let wx = bx + 6; wx < bx + bw - 8; wx += 12) {
        ctx.strokeRect(wx, wy, 7, 10);
      }
    }

    // Ground floor storefront
    const storeH = 35;
    const storeY = baseY - storeH;
    ctx.fillStyle = `hsla(0, 0%, 90%, 0.15)`;
    ctx.fillRect(bx, storeY, bw, storeH);
    ctx.strokeStyle = `hsla(0, 0%, 100%, 0.1)`;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, storeY, bw, storeH);

    // Store sign
    if (rand() > 0.3) {
      ctx.fillStyle = `hsl(${rand() * 360}, 60%, 50%)`;
      ctx.fillRect(bx + 5, storeY + 3, bw - 10, 8);
    }

    // Door
    ctx.fillStyle = `hsla(220, 10%, 30%, 0.4)`;
    ctx.fillRect(bx + bw / 2 - 5, storeY + 12, 10, storeH - 12);
  }
}

function drawStreet(ctx, baseY) {
  // Road
  const roadY = baseY - 18;
  ctx.fillStyle = grad(ctx, 0, roadY, 0, baseY, [[0, '#3a3a3a'], [1, '#4a4a4a']]);
  ctx.fillRect(0, roadY, W, 18);

  // Lane markings (dashed)
  ctx.strokeStyle = `hsla(55, 20%, 60%, 0.4)`;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.moveTo(0, roadY + 9);
  ctx.lineTo(W, roadY + 9);
  ctx.stroke();
  ctx.setLineDash([]);

  // Sidewalk
  ctx.fillStyle = grad(ctx, 0, baseY - 18, 0, baseY, [[0, '#8a8a8a'], [1, '#9a9a9a']]);
  ctx.fillRect(0, baseY - 18, W, 6);

  // Sidewalk top edge
  ctx.fillStyle = '#7a7a7a';
  ctx.fillRect(0, baseY - 19, W, 1);

  // Curb
  ctx.fillStyle = '#6a6a6a';
  ctx.fillRect(0, baseY - 21, W, 2);

  // Ground
  ctx.fillStyle = grad(ctx, 0, baseY, 0, H, [[0, '#5a5a5a'], [1, '#3a3a3a']]);
  ctx.fillRect(0, baseY, W, H - baseY);
}

function drawSky(ctx) {
  const g = grad(ctx, 0, 0, 0, H * 0.4, [
    [0, '#1a2a4a'],
    [0.3, '#3a6a9a'],
    [0.6, '#6a9aba'],
    [1, '#8abada'],
  ]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H * 0.4);

  // Clouds
  const rand = rnd(42);
  for (let i = 0; i < 12; i++) {
    const cx = rand() * W;
    const cy = rand() * H * 0.2;
    const cr = 20 + rand() * 40;
    ctx.fillStyle = `hsla(0, 0%, 100%, ${0.05 + rand() * 0.08})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, cr, cr * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx - cr * 0.6, cy + 5, cr * 0.7, cr * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + cr * 0.5, cy + 3, cr * 0.6, cr * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTrees(ctx, positions, baseY) {
  positions.forEach(([x]) => {
    // Trunk
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(x - 2, baseY - 28, 4, 10);

    // Foliage
    const colors = ['#2a5a2a', '#1a4a1a', '#3a6a3a', '#2a6a3a'];
    const foliageColor = colors[Math.floor(Math.random() * colors.length)];
    for (let i = 0; i < 5; i++) {
      const fx = x + (Math.random() - 0.5) * 16;
      const fy = baseY - 32 + (Math.random() - 0.5) * 12;
      const fr = 6 + Math.random() * 8;
      ctx.fillStyle = foliageColor;
      ctx.globalAlpha = 0.5 + Math.random() * 0.3;
      ctx.beginPath();
      ctx.arc(fx, fy, fr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
}

function drawStoreInterior(ctx, baseColor, shelfColor, hasProducts) {
  const rand = rnd(99);
  const baseY = H;
  const cx = W / 2;

  // Floor
  const fg = grad(ctx, 0, baseY - 80, 0, baseY, [
    [0, '#4a4a5a'], [0.3, '#3a3a4a'], [1, '#2a2a3a']
  ]);
  ctx.fillStyle = fg;
  ctx.fillRect(0, baseY - 80, W, 80);

  // Floor reflection grid
  ctx.strokeStyle = `hsla(0, 0%, 100%, 0.04)`;
  ctx.lineWidth = 0.5;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, baseY - 80); ctx.lineTo(x, baseY); ctx.stroke();
  }
  for (let y = baseY - 80; y < baseY; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Ceiling
  const cg = grad(ctx, 0, 0, 0, H * 0.15, [
    [0, '#e8e8ee'], [0.5, '#d8d8e0'], [1, '#c8c8d0']
  ]);
  ctx.fillStyle = cg;
  ctx.fillRect(0, 0, W, H * 0.15);

  // Ceiling lights
  for (let x = 60; x < W - 60; x += 120) {
    ctx.fillStyle = `hsla(55, 40%, 90%, 0.6)`;
    ctx.fillRect(x, H * 0.14, 40, 6);
    // Light glow
    const lg = grad(ctx, x, H * 0.14, x, H * 0.25);
    lg.addColorStop(0, `hsla(55, 40%, 90%, 0.08)`);
    lg.addColorStop(1, `hsla(55, 40%, 90%, 0)`);
    ctx.fillStyle = lg;
    ctx.fillRect(x - 10, H * 0.14, 60, H * 0.12);
  }

  // Walls
  ctx.fillStyle = `hsl(${baseColor}, 15%, 55%)`;
  ctx.fillRect(0, H * 0.15, W, H * 0.53);

  // Back wall baseboard
  ctx.fillStyle = `hsl(${baseColor}, 10%, 35%)`;
  ctx.fillRect(0, H * 0.6, W, 6);

  // Shelves
  const shelfY = H * 0.25;
  const shelfH = H * 0.33;
  const numShelves = 4;

  for (let sx = 30; sx < W - 30; sx += 140 + rand() * 60) {
    // Shelf column
    ctx.fillStyle = `hsl(${shelfColor}, 20%, 40%)`;
    ctx.fillRect(sx, shelfY, 90, shelfH);

    // Shelf boards
    for (let si = 0; si < numShelves; si++) {
      const sy = shelfY + (si / numShelves) * shelfH;
      ctx.fillStyle = `hsl(${shelfColor}, 15%, 50%)`;
      ctx.fillRect(sx, sy, 90, 2);

      // Products on shelf
      if (hasProducts) {
        for (let px = sx + 5; px < sx + 85; px += 15 + rand() * 10) {
          if (rand() > 0.2) {
            const ph = 8 + rand() * 12;
            const pw = 8 + rand() * 6;
            const py = sy - ph;
            ctx.fillStyle = `hsl(${rand() * 360}, 50%, ${40 + rand() * 40}%)`;
            ctx.fillRect(px, py, pw, ph);
            // Highlight
            ctx.fillStyle = `hsla(0, 0%, 100%, 0.1)`;
            ctx.fillRect(px, py, pw, 2);
          }
        }
      }
    }

    // Shelf label
    ctx.fillStyle = `hsla(0, 0%, 100%, 0.08)`;
    ctx.fillRect(sx, shelfY + shelfH - 14, 90, 12);
  }

  // Store sign
  ctx.fillStyle = `hsl(${baseColor + 40}, 60%, 45%)`;
  ctx.fillRect(W / 2 - 100, H * 0.16, 200, 14);
  ctx.fillStyle = '#fff';
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LOJA', W / 2, H * 0.17 + 10);
}

export function generateScene(id) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, W, H);

  switch (id) {
    case 'city-street-1':
    case 'city-street-2': {
      const baseY = H * 0.72;

      // Sky background (wrapping)
      for (let x = 0; x < W; x += W / 2) {
        drawSky(ctx);
      }

      // Distant buildings on both sides
      const baseHue = 220;
      drawBuildings(ctx, 0, 0, W, baseY - 5, baseY + 15, 1, baseHue);
      drawBuildings(ctx, 0, 0, W, baseY + 3, baseY + 10, 100, baseHue + 30);

      // Street
      drawStreet(ctx, baseY);

      // Trees
      const treePositions = [[100], [350], [550], [700], [850], [1200], [1500], [1800]];
      drawTrees(ctx, treePositions, baseY);

      // Street lights
      [200, 500, 800, 1100, 1400, 1700, 2000].forEach(x => {
        ctx.fillStyle = '#5a5a5a';
        ctx.fillRect(x - 1, baseY - 50, 2, 32);
        ctx.fillStyle = `hsla(45, 80%, 70%, 0.15)`;
        ctx.beginPath();
        ctx.arc(x, baseY - 52, 6, 0, Math.PI * 2);
        ctx.fill();
        const lg = grad(ctx, x - 10, baseY - 52, x + 10, baseY - 20);
        lg.addColorStop(0, `hsla(45, 80%, 70%, 0.06)`);
        lg.addColorStop(1, `hsla(45, 80%, 70%, 0)`);
        ctx.fillStyle = lg;
        ctx.fillRect(x - 10, baseY - 52, 20, 35);
      });

      break;
    }

    case 'mall-entrance': {
      const baseY = H * 0.7;

      drawSky(ctx);

      // Building facade
      ctx.fillStyle = grad(ctx, 0, H * 0.15, 0, baseY, [
        [0, '#5a6a7a'], [0.5, '#4a5a6a'], [1, '#3a4a5a']
      ]);
      ctx.fillRect(0, H * 0.15, W, baseY - H * 0.15);

      // Mall entrance (center)
      const entW = 300, entH = 180;
      const entX = W / 2 - entW / 2, entY = baseY - entH;

      // Glass panels
      for (let gx = 0; gx < entW; gx += 50) {
        ctx.fillStyle = `hsla(210, 40%, 70%, ${0.15 + (gx / entW) * 0.1})`;
        ctx.fillRect(entX + gx, entY, 48, entH);
        ctx.strokeStyle = `hsla(0, 0%, 50%, 0.3)`;
        ctx.lineWidth = 1;
        ctx.strokeRect(entX + gx, entY, 48, entH);
      }

      // Door frames
      for (let d = 0; d < 2; d++) {
        const dx = entX + 40 + d * (entW - 80);
        ctx.fillStyle = `hsla(210, 30%, 70%, 0.2)`;
        ctx.fillRect(dx, entY + 20, 50, entH - 20);
        ctx.strokeStyle = `hsla(0, 0%, 60%, 0.4)`;
        ctx.lineWidth = 1;
        ctx.strokeRect(dx, entY + 20, 50, entH - 20);
        // Door handle
        ctx.fillStyle = '#888';
        ctx.fillRect(dx + 44, entY + entH / 2 - 8, 3, 16);
      }

      // Canopy over entrance
      ctx.fillStyle = '#3a3a4a';
      ctx.fillRect(entX - 30, entY - 10, entW + 60, 10);
      ctx.fillStyle = '#4a4a5a';
      ctx.fillRect(entX - 30, entY - 12, entW + 60, 2);

      // Mall sign
      ctx.fillStyle = '#6a4a8a';
      ctx.fillRect(W / 2 - 120, H * 0.16, 240, 20);
      ctx.fillStyle = '#aaaacc';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SHOPPING BRANE', W / 2, H * 0.17 + 13);

      // Sidewalk
      ctx.fillStyle = '#8a8a8a';
      ctx.fillRect(0, baseY - 3, W, 6);
      ctx.fillStyle = grad(ctx, 0, baseY, 0, H, [[0, '#5a5a5a'], [1, '#3a3a3a']]);
      ctx.fillRect(0, baseY, W, H - baseY);

      // Street at bottom
      ctx.fillStyle = '#4a4a4a';
      ctx.fillRect(0, baseY + 5, W, 15);

      // Steps
      for (let s = 0; s < 3; s++) {
        ctx.fillStyle = `hsl(0, 0%, ${50 - s * 5}%)`;
        ctx.fillRect(entX - 30 + s * 5, baseY - 3 + s * 3, entW + 60 - s * 10, 3);
      }

      break;
    }

    case 'mall-hall': {
      const floorY = H * 0.82;

      // Ceiling
      const cg = grad(ctx, 0, 0, 0, H * 0.12, [
        [0, '#e8e8f0'], [1, '#c8c8d0']
      ]);
      ctx.fillStyle = cg;
      ctx.fillRect(0, 0, W, H * 0.12);

      // Glass ceiling panels
      for (let x = 0; x < W; x += 60) {
        ctx.fillStyle = `hsla(210, 30%, 80%, ${0.08 + (x % 120 === 0 ? 0.05 : 0)})`;
        ctx.fillRect(x, H * 0.12, 58, 6);
      }

      // Walls
      ctx.fillStyle = grad(ctx, 0, H * 0.12, W, floorY, [
        [0, '#d8d8e0'], [0.3, '#c8c8d0'], [0.7, '#c8c8d0'], [1, '#b8b8c0']
      ]);
      ctx.fillRect(0, H * 0.12, W, floorY - H * 0.12);

      // Floor (polished marble)
      const fg = grad(ctx, 0, floorY - 40, 0, floorY, [
        [0, '#d0c8c0'], [0.3, '#c8c0b8'], [0.7, '#b8b0a8'], [1, '#a8a098']
      ]);
      ctx.fillStyle = fg;
      ctx.fillRect(0, floorY - 40, W, 40);

      // Floor reflection
      const rg = grad(ctx, 0, floorY - 40, 0, floorY, [
        [0, `hsla(0, 0%, 100%, 0.02)`],
        [0.5, `hsla(0, 0%, 100%, 0.06)`],
        [1, `hsla(0, 0%, 100%, 0)`]
      ]);
      ctx.fillStyle = rg;
      ctx.fillRect(0, floorY - 40, W, 40);

      // Floor tile lines
      ctx.strokeStyle = `hsla(0, 0%, 50%, 0.1)`;
      ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, floorY - 40); ctx.lineTo(x, floorY); ctx.stroke();
      }

      // Storefronts (left and right sides)
      const storeW = 180, storeH = floorY - H * 0.25;
      const stores = [
        { x: 50, color: 280, name: 'SNEAKER' },
        { x: 280, color: 200, name: 'FASHION' },
        { x: 510, color: 10, name: 'TECH' },
        { x: 740, color: 40, name: 'GOLD' },
        { x: 970, color: 120, name: 'MARKET' },
        { x: 1200, color: 330, name: 'BEAUTY' },
        { x: 1430, color: 30, name: 'CAFE' },
        { x: 1660, color: 220, name: 'SPORT' },
        { x: 1890, color: 60, name: 'BOOKS' },
      ];

      stores.forEach((s) => {
        const sy = H * 0.25;
        const sh = floorY - sy;

        // Store frame
        ctx.fillStyle = `hsl(${s.color}, 20%, 40%)`;
        ctx.fillRect(s.x, sy, storeW, sh);

        // Glass front
        ctx.fillStyle = `hsla(210, 30%, 70%, 0.12)`;
        ctx.fillRect(s.x + 5, sy + 5, storeW - 10, sh - 10);

        // Store sign
        ctx.fillStyle = `hsl(${s.color}, 50%, 50%)`;
        ctx.fillRect(s.x + 10, sy + 6, storeW - 20, 14);
        ctx.fillStyle = '#fff';
        ctx.font = '7px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(s.name, s.x + storeW / 2, sy + 16);

        // Display window
        ctx.fillStyle = `hsla(210, 40%, 80%, 0.08)`;
        ctx.fillRect(s.x + 12, sy + 25, storeW - 24, sh - 35);

        // Interior hint (darker area)
        ctx.fillStyle = `hsla(0, 0%, 20%, 0.15)`;
        ctx.fillRect(s.x + 15, sy + 28, storeW - 30, sh - 38);
      });

      // Center columns
      for (let cx = 300; cx < W - 200; cx += 400) {
        ctx.fillStyle = '#888890';
        ctx.fillRect(cx - 6, H * 0.18, 12, floorY - H * 0.18);
        ctx.fillStyle = '#9a9aa0';
        ctx.fillRect(cx - 4, H * 0.18, 8, floorY - H * 0.18 - 2);
      }

      // Plants
      [100, 700, 1300, 1900].forEach(x => {
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(x - 8, floorY - 18, 16, 10);
        ctx.fillStyle = '#2a5a2a';
        ctx.beginPath();
        ctx.arc(x, floorY - 24, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a4a1a';
        ctx.beginPath();
        ctx.arc(x - 4, floorY - 28, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 5, floorY - 26, 7, 0, Math.PI * 2);
        ctx.fill();
      });

      // Escalator (center-right area)
      const escX = W / 2 + 50;
      const escH = floorY - H * 0.35;
      ctx.fillStyle = '#666676';
      ctx.fillRect(escX, H * 0.35, 40, escH);

      // Escalator steps
      for (let s = 0; s < 20; s++) {
        const sy = H * 0.35 + (s / 20) * escH;
        ctx.fillStyle = '#555565';
        ctx.fillRect(escX, sy, 40, 2);
        ctx.fillStyle = '#888898';
        ctx.fillRect(escX + 2, sy + 1, 36, 1);
      }

      // Escalator railing
      ctx.fillStyle = '#8888a0';
      ctx.fillRect(escX - 2, H * 0.35, 2, escH);
      ctx.fillRect(escX + 40, H * 0.35, 2, escH);

      // Bench
      [250, 950, 1600].forEach(x => {
        ctx.fillStyle = '#5a4a3a';
        ctx.fillRect(x, floorY - 8, 60, 6);
        ctx.fillRect(x + 5, floorY - 10, 4, 2);
        ctx.fillRect(x + 51, floorY - 10, 4, 2);
      });

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
      drawStoreInterior(ctx, h, sh, true);

      // Custom sign per store
      const names = {
        'shoe-store': 'SNEAKER KING',
        'clothes-store': 'FASHION STORE',
        'electronics': 'TECHWORLD',
        'supermarket': 'SUPER MARKET',
        'perfume-store': 'GLOW BEAUTY',
        'jewelry-store': 'LUX GOLD',
        'food-court': 'FOOD COURT',
      };
      ctx.fillStyle = `hsl(${h + 40}, 60%, 50%)`;
      ctx.fillRect(W / 2 - 130, H * 0.17, 260, 18);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(names[id] || id.toUpperCase(), W / 2, H * 0.185 + 6);

      break;
    }

    default: {
      // Fallback scene
      ctx.fillStyle = '#1a1a2a';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Carregando...', W / 2, H / 2);
    }
  }

  return canvas;
}
