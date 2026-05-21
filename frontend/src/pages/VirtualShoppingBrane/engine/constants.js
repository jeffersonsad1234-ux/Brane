export const W = 200, BLOCK = 1.4, WH = 12;
export const SKIN = "wildcraft_data";
export const BLOCK_TYPES = {
  dirt: { color: 0x8B6914, name: "Terra", roughness: 0.9 },
  wood: { color: 0x6a4a2a, name: "Madeira", roughness: 0.8 },
  stone: { color: 0x808080, name: "Pedra", roughness: 0.7 },
  plank: { color: 0xc4a46a, name: "Tábua", roughness: 0.6 },
  brick: { color: 0xaa5533, name: "Tijolo", roughness: 0.7 },
  crystal_block: { color: 0xcc66ff, name: "Bloco de Cristal", roughness: 0.2, metalness: 0.5 },
};
export const RES_COLORS = { tree: 0x44cc44, rock: 0x999999, crystal: 0xff66ff, coal: 0x444444 };
export const RES_NAMES = { tree: "Madeira", rock: "Pedra", crystal: "Cristal Mágico", coal: "Carvão" };
export const RES_HP = { tree: 5, rock: 4, crystal: 3, coal: 4 };

export function rng(m, M) { return m + Math.random() * (M - m); }
export function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }
