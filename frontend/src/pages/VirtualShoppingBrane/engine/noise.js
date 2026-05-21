export function hash(x, y) { let h = x * 374761393 + y * 668265263; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967296; }

export function smooth(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  return (hash(ix, iy) + (hash(ix + 1, iy) - hash(ix, iy)) * sx) + ((hash(ix, iy + 1) + (hash(ix + 1, iy + 1) - hash(ix, iy + 1)) * sx) - (hash(ix, iy) + (hash(ix + 1, iy) - hash(ix, iy)) * sx)) * sy;
}

export function fbm(x, y, o = 5) { let v = 0, a = 1, f = 1, m = 0; for (let i = 0; i < o; i++) { v += smooth(x * f, y * f) * a; m += a; a *= 0.5; f *= 2; } return v / m; }
