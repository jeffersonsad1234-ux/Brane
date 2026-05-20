import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import "./VirtualShoppingBrane.css";

// ─── GAMES DATABASE ─────────────────────────────────────
const GAMES = [
  { id:"road-racer",title:"Road Racer",subtitle:"Corrida na estrada!",price:1.50,cat:"corrida",age:"7+",desc:"Corra na estrada desviando dos carros! Quanto mais longe, mais pontos. Gráficos 3D fake super coloridos e música eletrônica contagiante.",color:"#ff6600",bg:"linear-gradient(135deg,#ff4400,#ff8800)",icon:"🏎️",dev:"Brany Studio",rating:4.8,tags:["corrida","carro","ação"],plays:24500 },
  { id:"fruit-frenzy",title:"Fruit Frenzy",subtitle:"Corte tudo!",price:2.00,cat:"arcade",age:"5+",desc:"Corte frutas voadoras sem acertar as bombas! Combos, power-ups e desafios diários. Viciante e colorido!",color:"#ff4488",bg:"linear-gradient(135deg,#ff2288,#ff6644)",icon:"🍉",dev:"Brany Studio",rating:4.9,tags:["arcade","frutas","ação"],plays:31200 },
  { id:"pixl-jump",title:"Pixl Jump",subtitle:"Pule sem parar!",price:1.50,cat:"plataforma",age:"6+",desc:"Pule de plataforma em plataforma nesse mundo pixelado cheio de desafios. Colete moedas, desbloqueie skins!",color:"#44aaff",bg:"linear-gradient(135deg,#2288ff,#44ddff)",icon:"🎮",dev:"Brany Studio",rating:4.7,tags:["plataforma","pixel","aventura"],plays:18900 },
  { id:"farm-crush",title:"Farm Crush",subtitle:"Colheita explosiva!",price:3.00,cat:"puzzle",age:"4+",desc:"Combine frutas e vegetais para fazer explosões coloridas na fazenda! Centenas de fases, power-ups e animais fofos.",color:"#44cc44",bg:"linear-gradient(135deg,#22aa44,#66dd44)",icon:"🌾",dev:"Brany Studio",rating:4.6,tags:["puzzle","fazenda","animais"],plays:15700 },
  { id:"moto-rage",title:"Moto Rage",subtitle:"Velocidade radical!",price:2.00,cat:"moto",age:"8+",desc:"Pilote sua moto em pistas radicais cheias de obstáculos. Faça manobras, acelere e chegue primeiro!",color:"#cc44ff",bg:"linear-gradient(135deg,#aa22ff,#ff44cc)",icon:"🏍️",dev:"Brany Studio",rating:4.5,tags:["moto","corrida","ação"],plays:12300 },
  { id:"chef-kids",title:"Chef Kids",subtitle:"Cozinha divertida!",price:2.00,cat:"culinária",age:"4+",desc:"Prepare pratos deliciosos seguindo receitas divertidas! Pizza, bolo, hambúrguer e muito mais. Modo livre e desafios!",color:"#ff8844",bg:"linear-gradient(135deg,#ff6622,#ffcc44)",icon:"🍳",dev:"Brany Studio",rating:4.8,tags:["culinária","criativo","meninas"],plays:9800 },
  { id:"makeup-artist",title:"Makeup Artist",subtitle:"Arte e beleza!",price:3.00,cat:"maquiagem",age:"5+",desc:"Crie makes incríveis com centenas de produtos! Sombrancelha, batom, sombra, blush. Salve e compartilhe suas artes!",color:"#ff88cc",bg:"linear-gradient(135deg,#ff66aa,#ffaadd)",icon:"💄",dev:"Brany Studio",rating:4.7,tags:["maquiagem","meninas","criativo"],plays:8700 },
  { id:"build-city",title:"Build City",subtitle:"Sua cidade dos sonhos!",price:5.00,cat:"construção",age:"6+",desc:"Construa uma cidade inteira do zero! Casas, prédios, parques, estradas. Modo livre com centenas de peças.",color:"#44bbff",bg:"linear-gradient(135deg,#2288ee,#44ddff)",icon:"🏗️",dev:"Brany Studio",rating:4.9,tags:["construção","sandbox","criativo"],plays:6500 },
  { id:"zoo-adventure",title:"Zoo Adventure",subtitle:"Animais incríveis!",price:3.00,cat:"animais",age:"3+",desc:"Explore o zoológico, cuide dos animais, alimente, brinque e aprenda! Cada animal tem personalidade única.",color:"#66cc44",bg:"linear-gradient(135deg,#44aa33,#88dd55)",icon:"🦁",dev:"Brany Studio",rating:4.8,tags:["animais","aventura","educativo"],plays:11200 },
  { id:"survival-island",title:"Survival Island",subtitle:"Sobreviva na ilha!",price:5.00,cat:"sobrevivência",age:"10+",desc:"Naufragou? Construa abrigo, cace, pesque, explore a ilha e descubra segredos. Sobrevivência divertida e desafiadora!",color:"#22aa88",bg:"linear-gradient(135deg,#118866,#44ccaa)",icon:"🏝️",dev:"Brany Studio",rating:4.6,tags:["sobrevivência","aventura","ação"],plays:5400 },
  { id:"parkour-pro",title:"Parkour Pro",subtitle:"Corra e salte!",price:2.00,cat:"parkour",age:"7+",desc:"Corra pelos telhados da cidade pulando obstáculos! Parkour viciante com física realista e cenários incríveis.",color:"#ff4444",bg:"linear-gradient(135deg,#dd2222,#ff6644)",icon:"🏃",dev:"Brany Studio",rating:4.5,tags:["parkour","ação","corrida"],plays:14300 },
  { id:"idle-farm",title:"Idle Farm",subtitle:"Fazenda automática!",price:3.00,cat:"idle",age:"4+",desc:"Sua fazenda cresce mesmo enquanto você não joga! Plante, colha, venda e expanda. Viciante e relaxante.",color:"#88cc44",bg:"linear-gradient(135deg,#66aa33,#aadd55)",icon:"🚜",dev:"Brany Studio",rating:4.4,tags:["idle","fazenda","simulador"],plays:9200 },
  { id:"clicker-hero",title:"Clicker Hero",subtitle:"Clique para vencer!",price:1.50,cat:"clicker",age:"5+",desc:"Clique sem parar para derrotar monstros, ganhar moedas e evoluir seu herói! Clicker épico com centenas de upgrades.",color:"#ffaa22",bg:"linear-gradient(135deg,#ff8800,#ffcc44)",icon:"🖱️",dev:"Brany Studio",rating:4.3,tags:["clicker","arcade","aventura"],plays:18600 },
  { id:"terror-mansion",title:"Terror Mansion",subtitle:"Medo divertido!",price:5.00,cat:"terror",age:"10+",desc:"Explore a mansão assombrada em busca de doces! Terror leve cheio de sustos engraçados e puzzles divertidos.",color:"#8844aa",bg:"linear-gradient(135deg,#6622aa,#aa66dd)",icon:"👻",dev:"Brany Studio",rating:4.7,tags:["terror","aventura","puzzle"],plays:7800 },
  { id:"multi-arena",title:"Multi Arena",subtitle:"Batalhe com amigos!",price:5.00,cat:"multiplayer",age:"8+",desc:"Batalhe online com amigos em arenas cheias de power-ups! Até 8 jogadores. Partidas rápidas e muito caos divertido!",color:"#ff4466",bg:"linear-gradient(135deg,#ee2244,#ff6688)",icon:"⚔️",dev:"Brany Studio",rating:4.9,tags:["multiplayer","ação","arcade"],plays:4500 },
];

const CATEGORIES = [
  { id:"corrida",name:"Corrida",icon:"🏎️",color:"#ff6600" },
  { id:"arcade",name:"Arcade",icon:"🎯",color:"#ff4488" },
  { id:"plataforma",name:"Plataforma",icon:"🎮",color:"#44aaff" },
  { id:"puzzle",name:"Puzzle",icon:"🧩",color:"#44cc44" },
  { id:"aventura",name:"Aventura",icon:"🗺️",color:"#44dd88" },
  { id:"moto",name:"Moto",icon:"🏍️",color:"#cc44ff" },
  { id:"culinária",name:"Culinária",icon:"🍳",color:"#ff8844" },
  { id:"maquiagem",name:"Maquiagem",icon:"💄",color:"#ff88cc" },
  { id:"construção",name:"Construção",icon:"🏗️",color:"#44bbff" },
  { id:"animais",name:"Animais",icon:"🦁",color:"#66cc44" },
  { id:"sobrevivência",name:"Sobrevivência",icon:"🏝️",color:"#22aa88" },
  { id:"parkour",name:"Parkour",icon:"🏃",color:"#ff4444" },
  { id:"idle",name:"Idle",icon:"💤",color:"#88cc44" },
  { id:"clicker",name:"Clicker",icon:"🖱️",color:"#ffaa22" },
  { id:"terror",name:"Terror",icon:"👻",color:"#8844aa" },
  { id:"multiplayer",name:"Multiplayer",icon:"⚔️",color:"#ff4466" },
];

const STORE_KEY = "brany_library";
const FAV_KEY = "brany_favs";
const COIN_KEY = "brany_coins";
const USER_KEY = "brany_user";

// ─── GAME COMPONENTS ────────────────────────────────────

function RoadRacer({ onBack, onBuy, owned }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const stateRef = useRef({ player: { x: 0, y: 0 }, obstacles: [], score: 0, speed: 3, frame: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !playing) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width = canvas.clientWidth;
    const h = canvas.height = canvas.clientHeight;
    const s = stateRef.current;
    s.player = { x: w / 2, y: h - 80, w: 30, h: 20 };
    s.obstacles = []; s.score = 0; s.speed = 3; s.frame = 0;
    setGameOver(false);
    const keys = {};
    const onKey = (e, d) => { keys[e.key] = d; };
    window.addEventListener("keydown", e => onKey(e, true));
    window.addEventListener("keyup", e => onKey(e, false));

    const loop = () => {
      s.frame++;
      const p = s.player;
      if (keys["ArrowLeft"] || keys["a"]) p.x -= 4;
      if (keys["ArrowRight"] || keys["d"]) p.x += 4;
      if (keys["ArrowUp"] || keys["w"]) p.y -= 3;
      if (keys["ArrowDown"] || keys["s"]) p.y += 3;
      p.x = Math.max(20, Math.min(w - 20, p.x));
      p.y = Math.max(h * 0.3, Math.min(h - 20, p.y));

      if (s.frame % Math.max(15, 40 - s.speed * 2) === 0) {
        const lane = Math.floor(Math.random() * 3);
        const x = w * 0.2 + lane * w * 0.3;
        s.obstacles.push({ x, y: -30, w: 25, h: 18, color: `hsl(${Math.random() * 360},80%,50%)` });
      }
      s.obstacles.forEach(o => o.y += s.speed);
      s.obstacles = s.obstacles.filter(o => o.y < h + 30);
      s.score += 0.05;
      s.speed = 3 + s.score * 0.03;

      // Collision
      for (const o of s.obstacles) {
        if (p.x < o.x + o.w && p.x + p.w > o.x && p.y < o.y + o.h && p.y + p.h > o.y) {
          setGameOver(true); setPlaying(false); return;
        }
      }

      // Draw
      // Road
      ctx.fillStyle = "#1a1a2e"; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 6; i++) {
        const ly = ((i * (h / 6) + s.speed * s.frame * 2) % h);
        ctx.fillStyle = i % 2 === 0 ? "#2a2a3e" : "#1a1a2e";
        ctx.fillRect(0, ly, w, h / 6);
      }
      // Road lines
      ctx.strokeStyle = "#ffcc00"; ctx.lineWidth = 3; ctx.setLineDash([15, 15]);
      ctx.beginPath();
      const ly = (s.speed * s.frame * 3) % h;
      ctx.moveTo(w / 2, ly - h); ctx.lineTo(w / 2, ly + h);
      ctx.stroke(); ctx.setLineDash([]);
      // Player car
      ctx.shadowColor = "#ff6600"; ctx.shadowBlur = 15;
      ctx.fillStyle = "#ff4400";
      ctx.beginPath(); ctx.roundRect(p.x, p.y, p.w, p.h, 4); ctx.fill();
      ctx.fillStyle = "#ff8800";
      ctx.fillRect(p.x + 4, p.y - 6, 8, 6);
      ctx.fillRect(p.x + p.w - 12, p.y - 6, 8, 6);
      ctx.shadowBlur = 0;
      // Obstacles
      s.obstacles.forEach(o => {
        ctx.shadowColor = o.color; ctx.shadowBlur = 8;
        ctx.fillStyle = o.color;
        ctx.beginPath(); ctx.roundRect(o.x, o.y, o.w, o.h, 3); ctx.fill();
        // Windows
        ctx.fillStyle = "#44aaff";
        ctx.fillRect(o.x + 3, o.y + 3, o.w - 6, o.h * 0.35);
      });
      ctx.shadowBlur = 0;
      // Score
      ctx.fillStyle = "#fff"; ctx.font = "bold 20px Inter"; ctx.textAlign = "center";
      ctx.fillText(`🏎️ ${Math.floor(s.score)}m`, w / 2, 30);

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKey); };
  }, [playing]);

  return (
    <div className="bg-game-view">
      <div className="bg-game-top">
        <button className="bg-btn-back" onClick={onBack}>‹ Voltar</button>
        <span className="bg-game-title">🏎️ Road Racer</span>
        {!owned && <button className="bg-btn-buy-small" onClick={onBuy}>R$ 1,50</button>}
      </div>
      {!playing && !gameOver ? (
        <div className="bg-game-menu">
          <div className="bg-game-icon" style={{ color: "#ff6600", fontSize: "4rem" }}>🏎️</div>
          <h2>Road Racer</h2>
          <p>Desvie dos carros na estrada!</p>
          <p className="bg-game-controls">⬅️ ➡️ W A S D</p>
          <button className="bg-btn-play" onClick={() => setPlaying(true)}>▶ JOGAR</button>
        </div>
      ) : gameOver ? (
        <div className="bg-game-menu">
          <div className="bg-game-icon" style={{ fontSize: "3rem" }}>💥</div>
          <h2>Game Over!</h2>
          <p className="bg-game-score">🏎️ {Math.floor(stateRef.current.score)} metros</p>
          <button className="bg-btn-play" onClick={() => setPlaying(true)}>🔄 Tentar Novamente</button>
          <button className="bg-btn-back" onClick={onBack}>‹ Sair</button>
        </div>
      ) : null}
      <canvas ref={canvasRef} className="bg-game-canvas" style={{ display: playing ? "block" : "none" }} />
    </div>
  );
}

function FruitFrenzy({ onBack, onBuy, owned }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const stateRef = useRef({ fruits: [], score: 0, lives: 3, frame: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !playing) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width = canvas.clientWidth;
    const h = canvas.height = canvas.clientHeight;
    const st = stateRef.current;
    st.fruits = []; st.score = 0; st.lives = 3; st.frame = 0;
    setScore(0); setGameOver(false);

    const fruits = ["🍎","🍊","🍋","🍇","🍉","🍓","🍑","🍒","🥝","🍌"];
    const spawn = () => {
      const isBomb = Math.random() < 0.15;
      st.fruits.push({
        x: 30 + Math.random() * (w - 60), y: h + 20,
        vx: (Math.random() - 0.5) * 3, vy: -(4 + Math.random() * 4),
        emoji: isBomb ? "💣" : fruits[Math.floor(Math.random() * fruits.length)],
        bomb: isBomb, r: 18,
      });
    };

    const loop = () => {
      st.frame++;
      if (st.frame % Math.max(20, 55 - st.score * 0.3) === 0) spawn();
      st.fruits.forEach(f => { f.x += f.vx; f.y += f.vy; f.vy += 0.12; });
      st.fruits = st.fruits.filter(f => f.y < h + 30);
      if (st.lives <= 0) { setGameOver(true); setPlaying(false); return; }

      // Draw
      ctx.fillStyle = "#1a0a2e"; ctx.fillRect(0, 0, w, h);
      const grad = ctx.createRadialGradient(w / 2, h * 0.6, 50, w / 2, h * 0.6, w * 0.6);
      grad.addColorStop(0, "rgba(136,68,255,.05)"); grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      st.fruits.forEach(f => {
        ctx.font = `${f.r * 1.8}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.shadowColor = f.bomb ? "#ff4400" : "#ffdd00"; ctx.shadowBlur = 15;
        ctx.fillText(f.emoji, f.x, f.y);
      });
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff"; ctx.font = "bold 20px Inter"; ctx.textAlign = "center";
      ctx.fillText(`🍉 ${Math.floor(st.score)}`, w / 2, 28);
      ctx.fillText(`❤️`.repeat(Math.max(0, st.lives)), w / 2, 55);

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    const onClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
      for (let i = st.fruits.length - 1; i >= 0; i--) {
        const f = st.fruits[i];
        if (Math.hypot(cx - f.x, cy - f.y) < f.r) {
          if (f.bomb) { st.lives--; st.fruits.splice(i, 1); }
          else { st.score++; st.fruits.splice(i, 1); }
          return;
        }
      }
    };
    canvas.addEventListener("click", onClick);
    return () => { canvas.removeEventListener("click", onClick); };
  }, [playing]);

  return (
    <div className="bg-game-view">
      <div className="bg-game-top">
        <button className="bg-btn-back" onClick={onBack}>‹ Voltar</button>
        <span className="bg-game-title">🍉 Fruit Frenzy</span>
        {!owned && <button className="bg-btn-buy-small" onClick={onBuy}>R$ 2,00</button>}
      </div>
      {!playing && !gameOver ? (
        <div className="bg-game-menu">
          <div className="bg-game-icon" style={{ fontSize: "4rem" }}>🍉</div>
          <h2>Fruit Frenzy</h2>
          <p>Clique nas frutas! Evite bombas! 💣</p>
          <button className="bg-btn-play" onClick={() => setPlaying(true)}>▶ JOGAR</button>
        </div>
      ) : gameOver ? (
        <div className="bg-game-menu">
          <div className="bg-game-icon" style={{ fontSize: "3rem" }}>💥</div>
          <h2>Game Over!</h2>
          <p className="bg-game-score">🍉 {Math.floor(stateRef.current.score)} pontos</p>
          <button className="bg-btn-play" onClick={() => setPlaying(true)}>🔄 Tentar Novamente</button>
          <button className="bg-btn-back" onClick={onBack}>‹ Sair</button>
        </div>
      ) : null}
      <canvas ref={canvasRef} className="bg-game-canvas" style={{ display: playing ? "block" : "none" }} />
    </div>
  );
}

function PixlJump({ onBack, onBuy, owned }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const stateRef = useRef({ player: { x: 0, y: 0, vy: 0 }, platforms: [], score: 0, cam: 0, frame: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !playing) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width = canvas.clientWidth;
    const h = canvas.height = canvas.clientHeight;
    const st = stateRef.current;
    st.player = { x: w / 2, y: h - 60, vy: -6 }; st.platforms = []; st.score = 0; st.cam = 0; st.frame = 0;
    setGameOver(false);
    // Initial platforms
    for (let i = 0; i < 8; i++) {
      st.platforms.push({ x: 20 + Math.random() * (w - 100), y: h - 40 - i * 70, w: 60 + Math.random() * 40 });
    }

    const loop = () => {
      st.frame++;
      const p = st.player;
      p.vy += 0.35;
      p.y += p.vy;

      // Scroll
      if (p.y < h * 0.4) {
        const diff = h * 0.4 - p.y;
        p.y = h * 0.4;
        st.cam += diff;
        st.score += diff * 0.05;
      }

      // Platform collision
      for (const pl of st.platforms) {
        if (p.vy > 0 && p.y > pl.y && p.y < pl.y + 12 && p.x > pl.x - 12 && p.x < pl.x + pl.w + 12) {
          p.vy = -8;
          p.y = pl.y - 8;
        }
      }

      // Generate platforms
      while (st.platforms.length < 12) {
        const lastY = st.platforms.length ? Math.min(...st.platforms.map(pl => pl.y)) : h;
        st.platforms.push({ x: 15 + Math.random() * (w - 80), y: lastY - 55 - Math.random() * 30, w: 45 + Math.random() * 50 });
      }

      // Remove off-screen + update visible
      st.platforms = st.platforms.filter(pl => pl.y < st.cam + h + 50);

      // Fall death
      if (p.y > h + 30) { setGameOver(true); setPlaying(false); return; }

      // Draw
      ctx.fillStyle = "#0a0a2e"; ctx.fillRect(0, 0, w, h);
      // Gradient background
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#0a0a3e"); grad.addColorStop(0.5, "#1a1a4e"); grad.addColorStop(1, "#2a1a3e");
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      // Stars
      for (let i = 0; i < 30; i++) {
        const sx = (i * 137 + 50) % w, sy = ((i * 97 + 30) % h) - st.cam * 0.1 % h;
        ctx.fillStyle = `rgba(255,255,255,${0.1 + Math.sin(st.frame * 0.02 + i) * 0.08})`;
        ctx.fillRect(sx, sy < 0 ? sy + h : sy, 2, 2);
      }
      // Platforms
      st.platforms.forEach(pl => {
        const py = pl.y - st.cam;
        if (py < -20 || py > h + 20) return;
        const hue = (pl.x * 50) % 360;
        ctx.shadowColor = `hsl(${hue},80%,60%)`; ctx.shadowBlur = 8;
        ctx.fillStyle = `hsl(${hue},70%,50%)`;
        ctx.beginPath(); ctx.roundRect(pl.x, py, pl.w, 10, 4); ctx.fill();
        ctx.fillStyle = `hsl(${hue},70%,40%)`;
        ctx.beginPath(); ctx.roundRect(pl.x + 2, py + 1, pl.w - 4, 4, 2); ctx.fill();
      });
      ctx.shadowBlur = 0;
      // Player
      ctx.shadowColor = "#44aaff"; ctx.shadowBlur = 12;
      ctx.fillStyle = "#44aaff";
      ctx.beginPath(); ctx.roundRect(p.x - 10, p.y - 15, 20, 20, 5); ctx.fill();
      ctx.fillStyle = "#88ddff";
      ctx.fillRect(p.x - 6, p.y - 10, 12, 8);
      ctx.shadowBlur = 0;
      // Eyes
      ctx.fillStyle = "#fff";
      ctx.fillRect(p.x - 5, p.y - 10, 4, 4);
      ctx.fillRect(p.x + 2, p.y - 10, 4, 4);
      ctx.fillStyle = "#111";
      ctx.fillRect(p.x - 4, p.y - 9, 2, 2);
      ctx.fillRect(p.x + 3, p.y - 9, 2, 2);
      // Score
      ctx.fillStyle = "#fff"; ctx.font = "bold 20px Inter"; ctx.textAlign = "center";
      ctx.fillText(`🎮 ${Math.floor(st.score)}`, w / 2, 28);

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }, [playing]);

  return (
    <div className="bg-game-view">
      <div className="bg-game-top">
        <button className="bg-btn-back" onClick={onBack}>‹ Voltar</button>
        <span className="bg-game-title">🎮 Pixl Jump</span>
        {!owned && <button className="bg-btn-buy-small" onClick={onBuy}>R$ 1,50</button>}
      </div>
      {!playing && !gameOver ? (
        <div className="bg-game-menu">
          <div className="bg-game-icon" style={{ fontSize: "4rem" }}>🎮</div>
          <h2>Pixl Jump</h2>
          <p>Pule de plataforma em plataforma!</p>
          <p className="bg-game-controls">⬅️ ➡️ ou toque nas laterais</p>
          <button className="bg-btn-play" onClick={() => setPlaying(true)}>▶ JOGAR</button>
        </div>
      ) : gameOver ? (
        <div className="bg-game-menu">
          <div className="bg-game-icon" style={{ fontSize: "3rem" }}>💫</div>
          <h2>Game Over!</h2>
          <p className="bg-game-score">🎮 {Math.floor(stateRef.current.score)} pontos</p>
          <button className="bg-btn-play" onClick={() => setPlaying(true)}>🔄 Tentar Novamente</button>
          <button className="bg-btn-back" onClick={onBack}>‹ Sair</button>
        </div>
      ) : null}
      <canvas ref={canvasRef} className="bg-game-canvas" style={{ display: playing ? "block" : "none" }} />
    </div>
  );
}

// ─── MAIN PLATFORM ───────────────────────────────────────
export default function VirtualShoppingBrane() {
  const [page, setPage] = useState("home"); // home | library | detail | cart | profile | search | game
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState(null);
  const [currentGame, setCurrentGame] = useState(null);
  const [library, setLibrary] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch { return []; }
  });
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch { return []; }
  });
  const [coins, setCoins] = useState(() => {
    try { return parseInt(localStorage.getItem(COIN_KEY)) || 20; } catch { return 20; }
  });
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState("");
  const [profile] = useState(() => ({ name: "Jogador", avatar: "🎮", level: 1, xp: 0 }));
  const [viewMode, setViewMode] = useState("store"); // store | game
  const [notif, setNotif] = useState(null);

  useEffect(() => { localStorage.setItem(STORE_KEY, JSON.stringify(library)); }, [library]);
  useEffect(() => { localStorage.setItem(FAV_KEY, JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem(COIN_KEY, String(coins)); }, [coins]);

  const showNotif = useCallback((msg) => { setNotif(msg); setTimeout(() => setNotif(null), 2000); }, []);
  const buyGame = useCallback((g) => {
    if (library.includes(g.id)) { showNotif("Você já possui este jogo!"); return; }
    const cost = Math.round(g.price);
    if (coins < cost) { showNotif("Saldo insuficiente! 💰"); return; }
    setCoins(c => c - cost);
    setLibrary(l => [...l, g.id]);
    showNotif(`🎉 ${g.title} comprado!`);
  }, [library, coins, showNotif]);

  const toggleFav = useCallback((id) => {
    setFavorites(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);
  }, []);

  const filtered = useMemo(() => {
    let gs = GAMES;
    if (search) gs = gs.filter(g => g.title.toLowerCase().includes(search.toLowerCase()) || g.tags.some(t => t.includes(search.toLowerCase())));
    if (catFilter) gs = gs.filter(g => g.cat === catFilter);
    return gs;
  }, [search, catFilter]);

  const renderStars = (r) => {
    const full = Math.floor(r); const half = r % 1 >= 0.5;
    return "⭐".repeat(full) + (half ? "✨" : "") + ` ${r}`;
  };

  // Render game detail page
  if (viewMode === "game" && currentGame) {
    const g = currentGame; const owned = library.includes(g.id);
    const GameComponent = g.id === "road-racer" ? RoadRacer : g.id === "fruit-frenzy" ? FruitFrenzy : g.id === "pixl-jump" ? PixlJump : null;
    if (GameComponent) return <GameComponent onBack={() => setViewMode("store")} onBuy={() => buyGame(g)} owned={owned} />;
  }

  return (
    <div className="bg-root" onClick={() => setMessage("")}>
      {notif && <div className="bg-notif">{notif}</div>}

      {/* TOP BAR */}
      <div className="bg-topbar">
        <div className="bg-logo">
          <span className="bg-logo-icon">🎮</span>
          <span className="bg-logo-text">Brany</span>
          <span className="bg-logo-sub">Games</span>
        </div>
        <div className="bg-topbar-right">
          <div className="bg-coin-wallet" onClick={() => setPage("cart")}>
            <span>🪙</span><span className="bg-coin-val">{coins}</span>
          </div>
          <button className="bg-avatar-btn" onClick={() => setPage("profile")}>👤</button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="bg-search">
        <span className="bg-search-icon">🔍</span>
        <input className="bg-search-input" placeholder="Buscar jogos..." value={search} onChange={e => { setSearch(e.target.value); setPage("home"); }} />
      </div>

      {/* CATEGORIES SCROLL */}
      <div className="bg-cats">
        <button className={`bg-cat-btn ${!catFilter ? "active" : ""}`} onClick={() => { setCatFilter(null); setPage("home"); }}>🔥 Todos</button>
        {CATEGORIES.map(c => (
          <button key={c.id} className={`bg-cat-btn ${catFilter === c.id ? "active" : ""}`} onClick={() => { setCatFilter(c.id); setPage("home"); }}
            style={catFilter === c.id ? { background: c.color, borderColor: c.color } : {}}>
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      {/* NAV BAR */}
      <div className="bg-nav">
        {[
          { id:"home",icon:"🏠",label:"Início" },
          { id:"library",icon:"📚",label:"Biblioteca" },
          { id:"cart",icon:"🛒",label:"Carrinho"+(cart.length?` (${cart.length})`:"") },
          { id:"profile",icon:"👤",label:"Perfil" },
        ].map(nav => (
          <button key={nav.id} className={`bg-nav-btn ${page === nav.id ? "active" : ""}`} onClick={() => setPage(nav.id)}>
            <span className="bg-nav-icon">{nav.icon}</span>
            <span className="bg-nav-label">{nav.label}</span>
          </button>
        ))}
      </div>

      {/* PAGE CONTENT */}
      <div className="bg-content">

        {/* ─── HOME ─── */}
        {page === "home" && (
          <>
            {/* Hero Banner */}
            <div className="bg-banner">
              <div className="bg-banner-bg" />
              <div className="bg-banner-content">
                <div className="bg-banner-tag">🔥 LANÇAMENTO</div>
                <div className="bg-banner-title">Road Racer</div>
                <div className="bg-banner-sub">Corra na estrada! Desvie dos carros!</div>
                <div className="bg-banner-price">R$ 1,50</div>
                <button className="bg-banner-btn" onClick={() => { setCurrentGame(GAMES[0]); setViewMode("game"); }}>
                  🎮 Jogar Agora
                </button>
              </div>
            </div>

            {/* Games Grid */}
            <div className="bg-section">
              <div className="bg-section-header">
                <h3>{catFilter ? CATEGORIES.find(c => c.id === catFilter)?.name : "🎯 Jogos Populares"}</h3>
                <span className="bg-section-count">{filtered.length} jogos</span>
              </div>
              <div className="bg-grid">
                {filtered.length === 0 && <div className="bg-empty">Nenhum jogo encontrado 🔍</div>}
                {filtered.map(g => (
                  <div key={g.id} className="bg-game-card"
                    onClick={() => { setCurrentGame(g); setViewMode("game"); }}>
                    <div className="bg-game-card-bg" style={{ background: g.bg }}>
                      <span className="bg-game-card-icon">{g.icon}</span>
                    </div>
                    <div className="bg-game-card-info">
                      <div className="bg-game-card-title">{g.title}</div>
                      <div className="bg-game-card-meta">
                        <span className="bg-game-card-rating">{renderStars(g.rating)}</span>
                        <span className="bg-game-card-price">R$ {g.price.toFixed(2).replace(".", ",")}</span>
                      </div>
                    </div>
                    <button className={`bg-fav-btn ${favorites.includes(g.id) ? "active" : ""}`}
                      onClick={e => { e.stopPropagation(); toggleFav(g.id); }}>♥</button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ─── LIBRARY ─── */}
        {page === "library" && (
          <div className="bg-section">
            <div className="bg-section-header"><h3>� Minha Biblioteca</h3></div>
            {library.length === 0 ? (
              <div className="bg-empty-state">
                <div className="bg-empty-icon">📚</div>
                <h3>Biblioteca vazia</h3>
                <p>Compre jogos para começar sua coleção!</p>
                <button className="bg-btn-buy-small" onClick={() => setPage("home")}>🎮 Explorar Jogos</button>
              </div>
            ) : (
              <div className="bg-grid">
                {GAMES.filter(g => library.includes(g.id)).map(g => (
                  <div key={g.id} className="bg-game-card" onClick={() => { setCurrentGame(g); setViewMode("game"); }}>
                    <div className="bg-game-card-bg" style={{ background: g.bg }}>
                      <span className="bg-game-card-icon">{g.icon}</span>
                      <div className="bg-owned-badge">✓</div>
                    </div>
                    <div className="bg-game-card-info">
                      <div className="bg-game-card-title">{g.title}</div>
                      <button className="bg-btn-play-small">▶ Jogar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── CART / COINS ─── */}
        {page === "cart" && (
          <div className="bg-section">
            <div className="bg-section-header"><h3>🪙 Saldo</h3></div>
            <div className="bg-coin-card">
              <div className="bg-coin-big">🪙 {coins}</div>
              <p className="bg-coin-desc">Compre pacotes de Brany Coins para comprar jogos!</p>
              <div className="bg-coin-packs">
                {[{c:10,price:"R$ 1,00"},{c:25,price:"R$ 2,00"},{c:50,price:"R$ 4,00"},{c:100,price:"R$ 7,00"},{c:250,price:"R$ 15,00"}].map((p,i) => (
                  <button key={i} className="bg-coin-pack" onClick={() => { setCoins(c => c + p.c); showNotif(`+${p.c} Brany Coins! 🪙`); }}>
                    <span className="bg-cp-coins">🪙 {p.c}</span>
                    <span className="bg-cp-price">{p.price}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-section-header" style={{ marginTop: "1rem" }}><h3>🛒 Carrinho</h3></div>
            {cart.length === 0 ? (
              <div className="bg-empty" style={{ textAlign: "center", padding: "1rem" }}>Carrinho vazio</div>
            ) : (
              <div className="bg-cart-list">
                {cart.map((id,i) => {
                  const g = GAMES.find(gg => gg.id === id);
                  if (!g) return null;
                  return (
                    <div key={i} className="bg-cart-item">
                      <span>{g.icon} {g.title}</span>
                      <span>R$ {g.price.toFixed(2)}</span>
                      <button onClick={() => setCart(c => c.filter(x => x !== id))}>✕</button>
                    </div>
                  );
                })}
                <button className="bg-btn-buy-small" style={{ width: "100%", marginTop: ".5rem" }}
                  onClick={() => { const total = cart.reduce((s,id) => s + Math.round(GAMES.find(g => g.id === id)?.price || 0), 0); if (coins < total) { showNotif("Saldo insuficiente!"); return; } setCoins(c => c - total); cart.forEach(id => setLibrary(l => [...l, id])); setCart([]); showNotif("Compra realizada! 🎉"); }}>
                  Finalizar Compra
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── PROFILE ─── */}
        {page === "profile" && (
          <div className="bg-section">
            <div className="bg-section-header"><h3>👤 Meu Perfil</h3></div>
            <div className="bg-profile-card">
              <div className="bg-profile-avatar">{profile.avatar}</div>
              <div className="bg-profile-name">{profile.name}</div>
              <div className="bg-profile-stats">
                <div className="bg-pstat"><span>Nível</span><strong>{profile.level}</strong></div>
                <div className="bg-pstat"><span>Jogos</span><strong>{library.length}</strong></div>
                <div className="bg-pstat"><span>Favoritos</span><strong>{favorites.length}</strong></div>
                <div className="bg-pstat"><span>Moedas</span><strong>🪙 {coins}</strong></div>
              </div>
              <div className="bg-profile-xp">
                <div className="bg-xp-bar"><div className="bg-xp-fill" style={{ width: `${(profile.xp % 100)}%` }} /></div>
                <span>Nível {profile.level} • {profile.xp % 100}/100 XP</span>
              </div>
            </div>
            <div className="bg-section-header"><h3>❤️ Favoritos</h3></div>
            <div className="bg-grid">
              {favorites.length === 0 ? <div className="bg-empty" style={{ textAlign: "center", padding: "1rem" }}>Nenhum favorito</div> :
                GAMES.filter(g => favorites.includes(g.id)).map(g => (
                  <div key={g.id} className="bg-game-card" onClick={() => { setCurrentGame(g); setViewMode("game"); }}>
                    <div className="bg-game-card-bg" style={{ background: g.bg }}>
                      <span className="bg-game-card-icon">{g.icon}</span>
                    </div>
                    <div className="bg-game-card-info">
                      <div className="bg-game-card-title">{g.title}</div>
                      <div className="bg-game-card-meta"><span>⭐ {g.rating}</span></div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

      </div>

      {/* FOOTER NOTE */}
      <div className="bg-footer">
        <span>🎮 Brany Games • 15 jogos • © 2026</span>
        <span className="bg-footer-badge">beta</span>
      </div>
    </div>
  );
}
