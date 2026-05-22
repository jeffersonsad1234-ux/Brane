import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { deflateSync } from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Minimal PNG encoder (no deps) ──

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([t, data]);
  const crcV = Buffer.alloc(4);
  crcV.writeUInt32BE(crc32(crcData));
  return Buffer.concat([len, t, data, crcV]);
}

function createPNG(w, h, pixels) {
  // pixels: Uint8ClampedArray RGBA, row-major
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Raw rows: filter byte (0) + RGBA pixels
  const rowLen = 1 + w * 4;
  const raw = Buffer.alloc(rowLen * h);
  for (let y = 0; y < h; y++) {
    raw[y * rowLen] = 0; // filter none
    for (let x = 0; x < w; x++) {
      const si = (y * w + x) * 4;
      const di = y * rowLen + 1 + x * 4;
      raw[di] = pixels[si];
      raw[di + 1] = pixels[si + 1];
      raw[di + 2] = pixels[si + 2];
      raw[di + 3] = pixels[si + 3];
    }
  }

  const compressed = deflateSync(raw);
  return Buffer.concat([sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', compressed), pngChunk('IEND', Buffer.alloc(0))]);
}

// ── Scene generators ──

function rgba(r, g, b, a = 255) { return [r, g, b, a]; }

function setPixel(pixels, w, x, y, color) {
  if (x < 0 || x >= w || y < 0) return;
  const i = (y * w + x) * 4;
  pixels[i] = color[0]; pixels[i+1] = color[1]; pixels[i+2] = color[2]; pixels[i+3] = color[3];
}

function fillRect(pixels, w, x, y, rw, rh, color) {
  for (let dy = Math.max(0, y); dy < Math.min(y + rh, 1080); dy++) {
    for (let dx = Math.max(0, x); dx < Math.min(x + rw, w); dx++) {
      const a = color[3] / 255;
      if (a < 1) {
        const i = (dy * w + dx) * 4;
        pixels[i] = pixels[i] * (1 - a) + color[0] * a;
        pixels[i+1] = pixels[i+1] * (1 - a) + color[1] * a;
        pixels[i+2] = pixels[i+2] * (1 - a) + color[2] * a;
        pixels[i+3] = Math.min(255, pixels[i+3] + color[3]);
      } else {
        const i = (dy * w + dx) * 4;
        pixels[i] = color[0]; pixels[i+1] = color[1]; pixels[i+2] = color[2]; pixels[i+3] = color[3];
      }
    }
  }
}

function fillCircle(pixels, w, cx, cy, r, color) {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx*dx + dy*dy <= r*r) {
        const px = cx + dx;
        const py = cy + dy;
        if (px >= 0 && px < w && py >= 0 && py < 1080) {
          const i = (py * w + px) * 4;
          const a = color[3] / 255;
          pixels[i] = pixels[i] * (1 - a) + color[0] * a;
          pixels[i+1] = pixels[i+1] * (1 - a) + color[1] * a;
          pixels[i+2] = pixels[i+2] * (1 - a) + color[2] * a;
          pixels[i+3] = Math.min(255, pixels[i+3] + color[3]);
        }
      }
    }
  }
}

function drawHLine(pixels, w, y, x1, x2, color) {
  for (let x = Math.max(0,x1); x <= Math.min(x2,w-1); x++) {
    const i = (y * w + x) * 4;
    pixels[i] = color[0]; pixels[i+1]=color[1]; pixels[i+2]=color[2]; pixels[i+3]=color[3];
  }
}

function drawVLine(pixels, w, x, y1, y2, color) {
  for (let y = Math.max(0,y1); y <= Math.min(y2,1079); y++) {
    const i = (y * w + x) * 4;
    pixels[i] = color[0]; pixels[i+1]=color[1]; pixels[i+2]=color[2]; pixels[i+3]=color[3];
  }
}

function gradientBG(pixels, w, topColor, bottomColor) {
  for (let y = 0; y < 1080; y++) {
    const t = y / 1079;
    const r = topColor[0] + (bottomColor[0] - topColor[0]) * t;
    const g = topColor[1] + (bottomColor[1] - topColor[1]) * t;
    const b = topColor[2] + (bottomColor[2] - topColor[2]) * t;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      pixels[i] = r; pixels[i+1] = g; pixels[i+2] = b; pixels[i+3] = 255;
    }
  }
}

// ── Category scene generators ──

function genGamer(pixels, w) {
  gradientBG(pixels, w, [10, 5, 30], [5, 2, 15]);
  // Desk surface
  fillRect(pixels, w, 30, 780, w-60, 200, rgba(25, 20, 35));
  drawHLine(pixels, w, 780, 0, w-1, rgba(80, 40, 120, 160));
  // Monitor
  fillRect(pixels, w, 140, 350, w-280, 380, rgba(8, 8, 20));
  fillRect(pixels, w, 150, 360, w-300, 360, rgba(15, 15, 40));
  // Screen glow
  fillRect(pixels, w, 160, 370, w-320, 340, rgba(20, 30, 80, 60));
  // RGB lines on monitor
  for (let xx = 160; xx < w-160; xx += 4) {
    const yy = 370 + Math.sin(xx * 0.02) * 10;
    if (yy >= 370 && yy < 710) setPixel(pixels, w, xx, yy | 0, rgba(0, 255, 100, 200));
  }
  // Keyboard
  fillRect(pixels, w, 120, 740, w-240, 40, rgba(15, 12, 25));
  for (let kx = 140; kx < w-140; kx += 14) {
    fillRect(pixels, w, kx, 745, 8, 30, rgba(0, 200, 255, 120));
  }
  // Mouse
  fillCircle(pixels, w, w-80, 810, 20, rgba(20, 15, 35));
  fillCircle(pixels, w, w-80, 810, 10, rgba(0, 200, 255, 60));
  // RGB strip bottom
  for (let x = 0; x < w; x++) {
    const hue = (x * 0.3) % 360;
    const r = Math.sin(hue * Math.PI/180 + 0) * 127 + 128;
    const g = Math.sin(hue * Math.PI/180 + 2) * 127 + 128;
    const b = Math.sin(hue * Math.PI/180 + 4) * 127 + 128;
    setPixel(pixels, w, x, 980, rgba(r|0, g|0, b|0));
    setPixel(pixels, w, x, 981, rgba(r|0, g|0, b|0, 100));
  }
  // Floating particles
  for (let i = 0; i < 60; i++) {
    const px = (i * 197 + 53) % w;
    const py = (i * 311 + 97) % 700;
    const ps = 1 + (i % 3);
    fillCircle(pixels, w, px, py, ps, rgba(0, 255, 150, 30 + (i%3)*20));
  }
}

function genTech(pixels, w) {
  gradientBG(pixels, w, [10, 10, 45], [5, 5, 20]);
  // Desk
  fillRect(pixels, w, 20, 800, w-40, 180, rgba(20, 18, 15));
  drawHLine(pixels, w, 800, 0, w-1, rgba(60, 60, 120, 100));
  // Laptop screen
  fillRect(pixels, w, 180, 300, w-360, 380, rgba(8, 8, 25));
  fillRect(pixels, w, 195, 315, w-390, 350, rgba(15, 20, 50));
  // Laptop base
  fillRect(pixels, w, 170, 680, w-340, 20, rgba(25, 25, 40));
  // Screen content - code lines
  for (let i = 0; i < 12; i++) {
    const ly = 340 + i * 28;
    const lw = 60 + (i * 37) % 200;
    fillRect(pixels, w, 210, ly, lw, 6, rgba(0, 200, 255, 150));
    if (i % 3 === 0) fillRect(pixels, w, 210 + lw + 10, ly, 30, 6, rgba(0, 255, 100, 120));
  }
  // Phone
  fillRect(pixels, w, w-120, 720, 50, 100, rgba(8, 8, 25));
  fillRect(pixels, w, w-115, 730, 40, 80, rgba(20, 30, 80, 100));
  // Coffee mug
  fillRect(pixels, w, 80, 750, 40, 50, rgba(180, 160, 140));
  fillCircle(pixels, w, 100, 750, 22, rgba(180, 160, 140));
  // Steam
  for (let i = 0; i < 8; i++) {
    fillCircle(pixels, w, 90 + i*4, 720 - i*5, 3 + i%2, rgba(200, 200, 200, 30));
  }
  // Tech grid
  for (let x = 0; x < w; x += 30) {
    drawVLine(pixels, w, x, 850, 1079, rgba(0, 150, 255, 15));
  }
}

function genCozinha(pixels, w) {
  gradientBG(pixels, w, [220, 180, 140], [180, 140, 100]);
  // Wall tile pattern
  for (let y = 0; y < 650; y += 40) {
    for (let x = 0; x < w; x += 60) {
      const off = (Math.floor(y/40) % 2) * 30;
      fillRect(pixels, w, x + off, y, 58, 38, rgba(240, 210, 170, 80));
      drawHLine(pixels, w, y+39, 0, w-1, rgba(200, 170, 130, 60));
    }
  }
  // Countertop
  fillRect(pixels, w, 0, 650, w, 40, rgba(160, 130, 100));
  drawHLine(pixels, w, 650, 0, w-1, rgba(140, 110, 80));
  // Upper cabinets
  fillRect(pixels, w, 20, 40, w/2-40, 200, rgba(200, 170, 130));
  fillRect(pixels, w, w/2+20, 40, w/2-40, 200, rgba(200, 170, 130));
  for (let cx = 30; cx < w/2-30; cx += 80) {
    drawVLine(pixels, w, cx, 40, 240, rgba(180, 150, 110, 80));
  }
  // Sink
  fillRect(pixels, w, 260, 700, 100, 60, rgba(180, 190, 200));
  fillCircle(pixels, w, 280, 730, 15, rgba(170, 180, 190));
  fillCircle(pixels, w, 340, 730, 15, rgba(170, 180, 190));
  // Faucet
  drawVLine(pixels, w, 320, 660, 700, rgba(180, 180, 190));
  fillCircle(pixels, w, 320, 660, 5, rgba(180, 180, 190));
  // Fruits on counter
  fillCircle(pixels, w, 120, 720, 18, rgba(220, 50, 50));
  fillCircle(pixels, w, 150, 725, 15, rgba(50, 180, 50));
  fillCircle(pixels, w, 100, 728, 14, rgba(240, 200, 50));
  fillCircle(pixels, w, 135, 718, 10, rgba(240, 150, 50));
  // Window
  fillRect(pixels, w, w-200, 100, 160, 200, rgba(150, 200, 255, 100));
  fillRect(pixels, w, w-195, 105, 150, 190, rgba(100, 180, 255, 60));
  drawHLine(pixels, w, 200, w-200, w-40, rgba(200, 180, 150));
  drawVLine(pixels, w, w-120, 100, 300, rgba(200, 180, 150));
}

function genBeleza(pixels, w) {
  gradientBG(pixels, w, [220, 160, 200], [180, 120, 160]);
  // Vanity table
  fillRect(pixels, w, 40, 720, w-80, 160, rgba(230, 210, 220));
  drawHLine(pixels, w, 720, 0, w-1, rgba(200, 180, 190));
  // Mirror
  fillRect(pixels, w, 120, 120, w-240, 480, rgba(200, 180, 190, 80));
  fillRect(pixels, w, 130, 130, w-260, 460, rgba(220, 200, 215, 60));
  // Mirror frame
  drawHLine(pixels, w, 119, 119, w-120, rgba(190, 160, 175));
  drawHLine(pixels, w, 601, 119, w-120, rgba(190, 160, 175));
  drawVLine(pixels, w, 119, 119, 601, rgba(190, 160, 175));
  drawVLine(pixels, w, w-120, 119, 601, rgba(190, 160, 175));
  // Light bulbs around mirror
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const bx = w/2 + Math.cos(angle) * (w/2 - 140);
    const by = 360 + Math.sin(angle) * 230;
    fillCircle(pixels, w, bx|0, by|0, 6, rgba(255, 240, 200, 200));
    fillCircle(pixels, w, bx|0, by|0, 10, rgba(255, 240, 200, 30));
  }
  // Perfume bottles on table
  fillRect(pixels, w, 120, 660, 35, 60, rgba(200, 180, 255));
  fillRect(pixels, w, 120, 650, 35, 12, rgba(180, 160, 220));
  fillRect(pixels, w, 180, 670, 25, 50, rgba(255, 200, 220));
  fillRect(pixels, w, 240, 655, 30, 65, rgba(180, 220, 255));
  // Makeup brushes
  for (let i = 0; i < 5; i++) {
    const bx = 300 + i * 15;
    drawVLine(pixels, w, bx, 680, 720, rgba(180, 160, 150));
    fillRect(pixels, w, bx-2, 670, 4, 12, rgba(200, 180, 170));
  }
  // Sparkles
  for (let i = 0; i < 30; i++) {
    const sx = (i * 157 + 33) % w;
    const sy = (i * 271 + 77) % 600;
    fillCircle(pixels, w, sx, sy, 1 + i%2, rgba(255, 255, 200, 50 + (i%5)*30));
  }
}

function genPet(pixels, w) {
  gradientBG(pixels, w, [200, 180, 160], [160, 140, 120]);
  // Floor
  fillRect(pixels, w, 0, 800, w, 280, rgba(150, 130, 110));
  drawHLine(pixels, w, 800, 0, w-1, rgba(140, 120, 100));
  // Pet bed (oval)
  fillCircle(pixels, w, w/2, 780, 120, rgba(180, 130, 100, 180));
  fillCircle(pixels, w, w/2, 770, 100, rgba(200, 160, 120, 200));
  fillCircle(pixels, w, w/2, 760, 85, rgba(220, 180, 140));
  // Food bowls
  fillCircle(pixels, w, 150, 850, 35, rgba(180, 170, 160));
  fillCircle(pixels, w, 150, 848, 30, rgba(200, 190, 180));
  fillCircle(pixels, w, 150, 848, 22, rgba(140, 100, 60));
  fillCircle(pixels, w, w-150, 850, 35, rgba(180, 170, 160));
  fillCircle(pixels, w, w-150, 848, 30, rgba(200, 190, 180));
  fillCircle(pixels, w, w-150, 848, 22, rgba(60, 140, 220));
  // Toys
  fillCircle(pixels, w, 80, 760, 12, rgba(220, 80, 80));
  fillCircle(pixels, w, 100, 750, 8, rgba(80, 200, 80));
  fillCircle(pixels, w, 120, 755, 10, rgba(80, 80, 220));
  fillCircle(pixels, w, w-80, 770, 14, rgba(240, 200, 80));
  // Bone shape
  fillRect(pixels, w, w-120, 700, 40, 10, rgba(240, 220, 200));
  fillCircle(pixels, w, w-120, 700, 8, rgba(240, 220, 200));
  fillCircle(pixels, w, w-80, 700, 8, rgba(240, 220, 200));
  fillCircle(pixels, w, w-120, 710, 8, rgba(240, 220, 200));
  fillCircle(pixels, w, w-80, 710, 8, rgba(240, 220, 200));
  // Paw prints
  for (let i = 0; i < 5; i++) {
    const px = w * 0.1 + i * w * 0.2;
    const py = 880 + Math.sin(i * 1.5) * 20;
    fillCircle(pixels, w, px|0, py|0, 10, rgba(140, 110, 90, 40));
    fillCircle(pixels, w, (px-6)|0, (py-5)|0, 4, rgba(140, 110, 90, 30));
    fillCircle(pixels, w, (px+6)|0, (py-5)|0, 4, rgba(140, 110, 90, 30));
  }
}

function genModa(pixels, w) {
  gradientBG(pixels, w, [180, 120, 180], [120, 80, 140]);
  // Mannequin / dress form
  fillRect(pixels, w, w/2-30, 300, 60, 80, rgba(200, 180, 200, 100));
  fillCircle(pixels, w, w/2, 270, 25, rgba(200, 180, 200, 100));
  fillRect(pixels, w, w/2-20, 380, 40, 200, rgba(200, 180, 200, 80));
  // Dress on mannequin
  fillRect(pixels, w, w/2-35, 360, 70, 160, rgba(220, 80, 160, 100));
  for (let flounce = 0; flounce < 6; flounce++) {
    const fx = w/2 - 35 + flounce * 14;
    fillCircle(pixels, w, fx, 520, 8, rgba(220, 80, 160, 80));
  }
  // Rack with clothes
  drawHLine(pixels, w, 400, 20, w/4, rgba(150, 130, 140));
  for (let i = 0; i < 5; i++) {
    const hx = 40 + i * 25;
    fillRect(pixels, w, hx, 400, 4, 200, rgba(100, 80, 100, 60));
    fillCircle(pixels, w, hx+2, 600, 20, rgba(180 + i*10, 100, 150, 70));
    fillCircle(pixels, w, hx+2, 580, 18, rgba(160 + i*15, 120, 170, 60));
  }
  // Second rack
  drawHLine(pixels, w, 300, w*0.7, w-20, rgba(150, 130, 140));
  for (let i = 0; i < 4; i++) {
    const hx = (w*0.7 + i*35)|0;
    fillRect(pixels, w, hx, 300, 4, 180, rgba(100, 80, 100, 60));
    fillRect(pixels, w, hx-15, 480, 34, 60, rgba(80, 160, 220, 70));
  }
  // Shelf with shoes
  drawHLine(pixels, w, 700, w*0.5, w-20, rgba(180, 160, 170));
  for (let i = 0; i < 4; i++) {
    const sx = (w*0.55 + i*45)|0;
    fillRect(pixels, w, sx, 670, 30, 30, rgba(60 + i*20, 60, 80, 80));
    fillCircle(pixels, w, sx+5, 670, 10, rgba(80, 80, 100, 70));
  }
  // Hanging light
  drawVLine(pixels, w, w/2, 0, 80, rgba(180, 160, 170));
  fillCircle(pixels, w, w/2, 85, 15, rgba(255, 240, 200, 150));
  fillCircle(pixels, w, w/2, 85, 25, rgba(255, 240, 200, 30));
}

function genFitness(pixels, w) {
  gradientBG(pixels, w, [40, 15, 10], [20, 8, 5]);
  // Floor / mat
  fillRect(pixels, w, 0, 820, w, 260, rgba(30, 15, 10));
  drawHLine(pixels, w, 820, 0, w-1, rgba(60, 40, 30));
  // Gym mat horizontal
  fillRect(pixels, w, 60, 780, w-120, 60, rgba(15, 15, 20));
  fillRect(pixels, w, 65, 785, w-130, 50, rgba(25, 25, 35));
  // Dumbbells
  for (let i = 0; i < 3; i++) {
    const dx = 100 + i * 150;
    const dw = 20 + i * 10;
    const dr = 15 + i * 5;
    // Bar
    fillRect(pixels, w, dx, 700, 80, 6, rgba(120, 120, 130));
    // Weights
    fillCircle(pixels, w, dx, 700, dr, rgba(60 + i*15, 60 + i*10, 70));
    fillCircle(pixels, w, dx + 80, 700, dr, rgba(60 + i*15, 60 + i*10, 70));
    fillCircle(pixels, w, dx, 700, dr-3, rgba(80 + i*10, 80 + i*5, 90, 180));
    fillCircle(pixels, w, dx + 80, 700, dr-3, rgba(80 + i*10, 80 + i*5, 90, 180));
  }
  // Kettlebell
  fillCircle(pixels, w, w-100, 740, 20, rgba(80, 80, 90));
  fillRect(pixels, w, w-105, 720, 10, 25, rgba(80, 80, 90));
  fillCircle(pixels, w, w-100, 720, 8, rgba(80, 80, 90));
  // Jump rope
  fillRect(pixels, w, 80, 740, w-160, 3, rgba(200, 100, 100, 80));
  fillCircle(pixels, w, 80, 742, 8, rgba(180, 80, 80));
  fillCircle(pixels, w, w-80, 742, 8, rgba(180, 80, 80));
  // Energy lines
  for (let i = 0; i < 20; i++) {
    const lx = (i * 53 + 17) % w;
    const ly = (i * 89 + 31) % 600;
    drawHLine(pixels, w, ly, lx, lx + 20 + i*3, rgba(255, 150, 50, 20 + i*2));
  }
  // Spotlight effect
  fillCircle(pixels, w, w/2, 0, w/3, rgba(255, 200, 100, 15));
}

function genCasa(pixels, w) {
  gradientBG(pixels, w, [200, 180, 160], [160, 140, 120]);
  // Wall
  fillRect(pixels, w, 0, 0, w, 800, rgba(220, 200, 180, 80));
  // Floor
  fillRect(pixels, w, 0, 800, w, 280, rgba(140, 110, 90));
  // Baseboard
  drawHLine(pixels, w, 800, 0, w-1, rgba(180, 150, 130));
  // Sofa
  fillRect(pixels, w, 80, 650, w-160, 120, rgba(140, 100, 80));
  fillRect(pixels, w, 70, 650, w-140, 20, rgba(160, 120, 100));
  // Cushions
  fillRect(pixels, w, 100, 670, (w-200)/2, 60, rgba(180, 140, 110));
  fillRect(pixels, w, 100 + (w-200)/2 + 10, 670, (w-200)/2, 60, rgba(180, 140, 110));
  // Pillows
  fillRect(pixels, w, 100, 640, 50, 35, rgba(200, 180, 160));
  fillRect(pixels, w, 160, 640, 50, 35, rgba(200, 180, 160));
  // Coffee table
  fillRect(pixels, w, w/2-80, 780, 160, 12, rgba(100, 80, 65));
  fillRect(pixels, w, w/2-70, 770, 140, 15, rgba(120, 100, 85));
  // Books on table
  fillRect(pixels, w, w/2-50, 760, 40, 15, rgba(80, 60, 140));
  fillRect(pixels, w, w/2-5, 755, 30, 20, rgba(200, 80, 80));
  // Window
  fillRect(pixels, w, w-220, 100, 180, 250, rgba(150, 200, 255, 80));
  fillRect(pixels, w, w-215, 105, 170, 240, rgba(180, 220, 255, 40));
  drawHLine(pixels, w, 225, w-220, w-40, rgba(200, 180, 160));
  drawVLine(pixels, w, w-130, 100, 350, rgba(200, 180, 160));
  // Lamp
  drawVLine(pixels, w, 120, 500, 650, rgba(160, 140, 120));
  fillRect(pixels, w, 100, 495, 40, 10, rgba(200, 180, 160));
  fillCircle(pixels, w, 120, 490, 25, rgba(255, 240, 200, 100));
  fillCircle(pixels, w, 120, 490, 35, rgba(255, 240, 200, 20));
  // Picture frame on wall
  fillRect(pixels, w, 120, 150, 120, 90, rgba(80, 60, 50));
  fillRect(pixels, w, 125, 155, 110, 80, rgba(100, 180, 200, 60));
  fillCircle(pixels, w, 175, 195, 15, rgba(80, 140, 80, 80));
}

function genDefault(pixels, w) {
  gradientBG(pixels, w, [30, 30, 60], [15, 15, 40]);
}

// ── Main ──

const W = 540;
const H = 960;

const GENERATORS = {
  gamer: genGamer,
  tecnologia: genTech,
  cozinha: genCozinha,
  beleza: genBeleza,
  pet: genPet,
  moda: genModa,
  fitness: genFitness,
  casa: genCasa,
  default: genDefault,
};

const outDir = join(__dirname, '..', 'frontend', 'public', 'backgrounds');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

for (const [name, gen] of Object.entries(GENERATORS)) {
  const pixels = new Uint8ClampedArray(W * H * 4);
  gen(pixels, W);
  const png = createPNG(W, H, pixels);
  const outPath = join(outDir, `${name}.png`);
  createWriteStream(outPath).end(png);
  console.log(`Created ${outPath} (${(png.length / 1024).toFixed(1)} KB)`);
}

console.log('Done!');
