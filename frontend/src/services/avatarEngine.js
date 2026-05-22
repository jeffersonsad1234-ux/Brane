/**
 * Avatar Engine — draws realistic human avatar using Canvas2D
 * Supports 8 personas with distinct appearances, mouth animation for speech sync,
 * blinking, and subtle head movement.
 */

const PESSOAS = {
  tecnologia: {
    nome: 'Ana', idade: 28, pele: '#d4a574', cabelo: '#3d1f00', olhos: '#2d5a27',
    estilo: 'jovem criativa em home office', roupa: '#2563eb', bocaCor: '#c77b6e',
  },
  casa: {
    nome: 'Carla', idade: 35, pele: '#e8c39e', cabelo: '#5c3a1e', olhos: '#6b4423',
    estilo: 'mulher realista em sala decorada', roupa: '#8b5cf6', bocaCor: '#d4937a',
  },
  beleza: {
    nome: 'Julia', idade: 25, pele: '#f5d6c6', cabelo: '#8b4513', olhos: '#4a7c59',
    estilo: 'influenciadora digital', roupa: '#ec4899', bocaCor: '#e08b7a',
  },
  gadgets: {
    nome: 'Lucas', idade: 30, pele: '#c4956a', cabelo: '#2c1810', olhos: '#4a6741',
    estilo: 'jovem urbano moderno', roupa: '#0891b2', bocaCor: '#b87060',
  },
  gamer: {
    nome: 'Rafael', idade: 22, pele: '#dba87a', cabelo: '#1a0a00', olhos: '#3d5a80',
    estilo: 'gamer em quarto RGB', roupa: '#7c3aed', bocaCor: '#c07060',
  },
  fitness: {
    nome: 'Mariana', idade: 27, pele: '#dbb894', cabelo: '#4a2810', olhos: '#5a7a4a',
    estilo: 'atleta em academia', roupa: '#059669', bocaCor: '#d08070',
  },
  cozinha: {
    nome: 'Paulo', idade: 40, pele: '#c4956a', cabelo: '#3d2818', olhos: '#5a4a3a',
    estilo: 'chef profissional', roupa: '#d97706', bocaCor: '#b87060',
  },
  pets: {
    nome: 'Fernanda', idade: 32, pele: '#e8c39e', cabelo: '#6b3a1a', olhos: '#3d6b4a',
    estilo: 'dona de casa com cachorro', roupa: '#65a30d', bocaCor: '#d4937a',
  },
};

export function getPersona(categoria) {
  return PESSOAS[categoria] || PESSOAS.tecnologia;
}

export function drawAvatarFrame(ctx, x, y, size, persona, mouthOpen, blinkFrame, headTilt) {
  const s = size;
  const cx = x + s / 2;
  const headY = y + s * 0.15;
  const headR = s * 0.28;

  ctx.save();
  ctx.translate(cx + headTilt * 3, headY);
  ctx.rotate(headTilt * 0.05);

  // Neck
  ctx.fillStyle = persona.pele;
  ctx.fillRect(-8, headR - 4, 16, 18);

  // Shoulders
  ctx.fillStyle = persona.roupa;
  ctx.beginPath();
  ctx.moveTo(-s * 0.38, headR + 14);
  ctx.quadraticCurveTo(-s * 0.44, headR + 26, -s * 0.34, headR + 28);
  ctx.lineTo(s * 0.34, headR + 28);
  ctx.quadraticCurveTo(s * 0.44, headR + 26, s * 0.38, headR + 14);
  ctx.fill();

  // Body
  ctx.fillStyle = persona.roupa;
  ctx.beginPath();
  ctx.moveTo(-s * 0.34, headR + 14);
  ctx.lineTo(-s * 0.3, headR + s * 0.55);
  ctx.lineTo(s * 0.3, headR + s * 0.55);
  ctx.lineTo(s * 0.34, headR + 14);
  ctx.fill();

  // Collar highlight
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(-6, headR + 2, 12, 8);

  // Head
  ctx.fillStyle = persona.pele;
  ctx.beginPath();
  ctx.arc(0, 0, headR, 0, Math.PI * 2);
  ctx.fill();

  // Hair back
  ctx.fillStyle = persona.cabelo;
  ctx.beginPath();
  ctx.arc(0, -headR * 0.1, headR * 1.05, Math.PI * 0.1, Math.PI * 0.9);
  ctx.fill();

  // Hair top volume
  ctx.beginPath();
  ctx.ellipse(0, -headR * 0.5, headR * 0.9, headR * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hair sides
  ctx.fillRect(-headR * 0.95, -headR * 0.4, headR * 0.2, headR * 0.6);
  ctx.fillRect(headR * 0.75, -headR * 0.4, headR * 0.2, headR * 0.6);

  // Eyes
  const eyeY = -headR * 0.08;
  const eyeSpacing = headR * 0.35;

  // Eye whites
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(-eyeSpacing, eyeY, headR * 0.14, headR * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(eyeSpacing, eyeY, headR * 0.14, headR * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();

  if (blinkFrame > 0.5) {
    // Iris - looking at camera
    ctx.fillStyle = persona.olhos;
    ctx.beginPath();
    ctx.arc(-eyeSpacing + 2, eyeY, headR * 0.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eyeSpacing + 2, eyeY, headR * 0.09, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(-eyeSpacing + 3, eyeY, headR * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eyeSpacing + 3, eyeY, headR * 0.05, 0, Math.PI * 2);
    ctx.fill();

    // Eye shine
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(-eyeSpacing + 5, eyeY - 3, headR * 0.03, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eyeSpacing + 5, eyeY - 3, headR * 0.03, 0, Math.PI * 2);
    ctx.fill();

    // Eyebrows
    ctx.strokeStyle = persona.cabelo;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-eyeSpacing - headR * 0.12, eyeY - headR * 0.2);
    ctx.quadraticCurveTo(-eyeSpacing, eyeY - headR * 0.27, -eyeSpacing + headR * 0.12, eyeY - headR * 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(eyeSpacing - headR * 0.12, eyeY - headR * 0.2);
    ctx.quadraticCurveTo(eyeSpacing, eyeY - headR * 0.27, eyeSpacing + headR * 0.12, eyeY - headR * 0.2);
    ctx.stroke();
  } else {
    // Blink - closed eyes
    ctx.strokeStyle = persona.cabelo;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-eyeSpacing - headR * 0.1, eyeY);
    ctx.quadraticCurveTo(-eyeSpacing, eyeY + 2, -eyeSpacing + headR * 0.1, eyeY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(eyeSpacing - headR * 0.1, eyeY);
    ctx.quadraticCurveTo(eyeSpacing, eyeY + 2, eyeSpacing + headR * 0.1, eyeY);
    ctx.stroke();
  }

  // Nose
  ctx.fillStyle = persona.pele;
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-3, eyeY + headR * 0.1);
  ctx.quadraticCurveTo(4, eyeY + headR * 0.28, 0, eyeY + headR * 0.32);
  ctx.quadraticCurveTo(-4, eyeY + headR * 0.28, 3, eyeY + headR * 0.1);
  ctx.fill();
  ctx.stroke();

  // Smile lines
  ctx.strokeStyle = 'rgba(0,0,0,0.04)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-headR * 0.2, headR * 0.12);
  ctx.quadraticCurveTo(-headR * 0.15, headR * 0.22, -headR * 0.05, headR * 0.15);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(headR * 0.2, headR * 0.12);
  ctx.quadraticCurveTo(headR * 0.15, headR * 0.22, headR * 0.05, headR * 0.15);
  ctx.stroke();

  // Mouth
  const mouthY = headR * 0.2;
  const mouthW = headR * 0.22;
  if (mouthOpen > 0.1) {
    const openAmount = Math.min(mouthOpen * 0.6, 0.25);
    ctx.fillStyle = persona.bocaCor;
    ctx.beginPath();
    ctx.ellipse(0, mouthY + openAmount * headR * 0.1, mouthW, openAmount * headR * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Teeth
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(0, mouthY - openAmount * headR * 0.05, mouthW * 0.8, openAmount * headR * 0.08, 0, 0, Math.PI);
    ctx.fill();
    // Tongue
    ctx.fillStyle = '#e08070';
    ctx.beginPath();
    ctx.ellipse(0, mouthY + openAmount * headR * 0.15, mouthW * 0.5, openAmount * headR * 0.12, 0, 0, Math.PI, 0);
    ctx.fill();
  } else {
    // Closed smile
    ctx.strokeStyle = persona.bocaCor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, mouthY - 2, mouthW, 0.15, Math.PI - 0.15);
    ctx.stroke();
  }

  // Cheeks blush
  ctx.fillStyle = 'rgba(200, 100, 80, 0.08)';
  ctx.beginPath();
  ctx.ellipse(-headR * 0.35, headR * 0.1, headR * 0.1, headR * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(headR * 0.35, headR * 0.1, headR * 0.1, headR * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
