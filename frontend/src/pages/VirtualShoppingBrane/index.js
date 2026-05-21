import React, { useState, useEffect, useRef, useCallback } from "react";
import GameEngine from "./engine/GameEngine.js";
import "./VirtualShoppingBrane.css";

const SKIN = "wildcraft_data";
const ITEMS_INIT = [
  { id: "dirt", n: "Terra", i: "🟫", c: 15 },
  { id: "wood", n: "Madeira", i: "🪵", c: 8 },
  { id: "stone", n: "Pedra", i: "🪨", c: 5 },
];

export default function VirtualShoppingBrane() {
  const mountRef = useRef(null);
  const engineRef = useRef(null);
  const gameRef = useRef(null);
  const joyRef = useRef({ x: 0, y: 0 });
  const keysRef = useRef({});
  const [screen, setScreen] = useState("menu");
  const [gameState, setGameState] = useState({
    health: 100, hunger: 100, energy: 100, coins: 100, level: 1, xp: 0,
    hour: 6, min: 0, items: [], selectedSlot: 0, debug: { camX:0, camY:0, camZ:0, meshes:0, worldOk:false, phase:"" },
  });
  const [message, setMessage] = useState("");
  const msgTimer = useRef(null);

  const showMsg = useCallback((m) => {
    setMessage(m);
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMessage(""), 2000);
  }, []);

  // ─── POLL ENGINE STATE ────────────────────────────────
  const pollRef = useRef(null);
  const pollState = useCallback(() => {
    const eng = gameRef.current;
    if (eng) {
      setGameState(eng.getState());
    }
    pollRef.current = requestAnimationFrame(pollState);
  }, []);

  // ─── INIT ENGINE ──────────────────────────────────────
  useEffect(() => {
    if (screen !== "game" || !mountRef.current || engineRef.current) return;
    const mount = mountRef.current;
    console.log("[REACT] Creating engine...");
    const eng = new GameEngine(mount, {
      onTime: () => {},
      onHealth: (v) => setGameState(s => ({...s, health: v})),
      onHunger: (v) => setGameState(s => ({...s, hunger: v})),
      onEnergy: (v) => setGameState(s => ({...s, energy: v})),
      onItems: (items) => setGameState(s => ({...s, items})),
      onMessage: showMsg,
    });
    eng.items = (() => {
      try { return JSON.parse(localStorage.getItem(SKIN))?.items || [...ITEMS_INIT]; } catch { return [...ITEMS_INIT]; }
    })();
    gameRef.current = eng;
    const ok = eng.init();
    if (ok) {
      engineRef.current = eng;
      pollRef.current = requestAnimationFrame(pollState);
      console.log("[REACT] Engine initialized OK");
    } else {
      console.error("[REACT] Engine init failed");
    }
    return () => {
      if (pollRef.current) cancelAnimationFrame(pollRef.current);
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
        gameRef.current = null;
      }
    };
  }, [screen, showMsg, pollState]);

  // ─── KEYBOARD ─────────────────────────────────────────
  useEffect(() => {
    const eng = gameRef.current;
    const onKeyDown = (e) => {
      if (eng) eng.keys[e.code] = true;
      keysRef.current[e.code] = true;
      if (e.code >= "Digit1" && e.code <= "Digit5") {
        const slot = parseInt(e.code[5]) - 1;
        setGameState(s => ({...s, selectedSlot: slot}));
        if (eng) eng.selectedSlot = slot;
      }
    };
    const onKeyUp = (e) => {
      if (eng) eng.keys[e.code] = false;
      keysRef.current[e.code] = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    // Keyboard-initiated pointer lock
    const onClick = () => {
      if (screen === "game" && !document.pointerLockElement) {
        mountRef.current?.requestPointerLock?.();
      }
    };
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("click", onClick);
    };
  }, [screen]);

  const startGame = useCallback(() => {
    setScreen("game");
  }, []);

  const h = gameState.health, hu = gameState.hunger, e = gameState.energy;
  const items = gameState.items;
  const selectedSlot = gameState.selectedSlot;
  const dbg = gameState.debug;

  return (
    <div className="sb-root">
      {screen === "menu" && (
        <div className="sb-menu">
          <div className="sb-menu-content">
            <div className="sb-logo">
              <span className="sb-l-t" style={{background:'linear-gradient(135deg,#ff66aa,#aa66ff,#66aaff)',WebkitBackgroundClip:'text',backgroundClip:'text',color:'transparent',backgroundSize:'200% 200%',animation:'logoShift 4s ease infinite'}}>WILD</span>
              <span className="sb-l-s" style={{color:'#ffd700'}}>CRAFT</span>
            </div>
            <p className="sb-m-sub" style={{color:'#999',fontSize:'.7rem',marginBottom:'.5rem'}}>✨ Sandbox Mágico • Sobrevivência • Construção</p>
            <div className="sb-m-stats" style={{marginBottom:'.6rem'}}>
              <span>⭐ Nv.{gameState.level}</span><span>🪙 {gameState.coins}</span><span>🏆 {gameState.xp}XP</span>
            </div>
            <button className="sb-btn sb-btn-play" onClick={startGame}>🌍 ENTRAR NO MUNDO</button>
            <div className="sb-m-hint" style={{fontSize:'.55rem',color:'#666',marginTop:'.4rem'}}>WASD andar • Shift correr • Mouse olhar • Esquerda minerar • Direita construir</div>
            <div className="sb-m-info" style={{marginTop:'.5rem'}}>
              <span>🌲 350 árvores</span><span>💎 80 cristais mágicos</span><span>🪨 150 pedras</span>
              <span>🌙 Dia/Noite</span><span>✨ Bloom</span><span>🦌 Animais</span>
            </div>
          </div>
        </div>
      )}

      {screen === "game" && (
        <div className="sb-game">
          <div className="sb-canvas" ref={mountRef} />
          <div className="sb-hud">
            <div className="sb-hud-top">
              <div className="sb-hud-stats">
                <div className="sb-stat"><span className="sb-si">❤️</span><div className="sb-st"><div className="sb-sf" style={{width:`${h}%`,background:'linear-gradient(90deg,#ff3344,#ff6688)'}} /></div></div>
                <div className="sb-stat"><span className="sb-si">🍖</span><div className="sb-st"><div className="sb-sf" style={{width:`${hu}%`,background:'linear-gradient(90deg,#cc8833,#eeaa44)'}} /></div></div>
                <div className="sb-stat"><span className="sb-si">⚡</span><div className="sb-st"><div className="sb-sf" style={{width:`${e}%`,background:'linear-gradient(90deg,#44aaff,#66ddff)'}} /></div></div>
                <div className="sb-hud-coin">🪙 {gameState.coins}</div>
                <div className="sb-hud-lvl">⭐ {gameState.level}</div>
              </div>
              <div className="sb-hud-time">🕐 {gameState.hour.toString().padStart(2,"0")}:{gameState.min.toString().padStart(2,"0")}</div>
            </div>

            <div className="sb-crosshair">+</div>

            <div className="sb-hotbar">
              {[...Array(5)].map((_, i) => {
                const item = items[i];
                const isActive = i === selectedSlot;
                return (
                  <div key={i} className={`sb-hotbar-slot${isActive?' active':''}`} onClick={() => {
                    setGameState(s => ({...s, selectedSlot: i}));
                    if (gameRef.current) gameRef.current.selectedSlot = i;
                  }}>
                    {item ? <><span className="sb-hotbar-icon">{item.i}</span><span className="sb-hotbar-count">{item.c}</span></> : null}
                  </div>
                );
              })}
            </div>

            {message && <div className="sb-msg">{message}</div>}

            {/* ─── MOBILE CONTROLS ─── */}
            <div className="sb-mobile-controls" style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:40,display:'flex'}}>
              <div className="sb-joystick-area" style={{
                position:'absolute', bottom:30, left:20, width:120, height:120,
                borderRadius:'50%', background:'rgba(255,255,255,0.08)', pointerEvents:'auto',
                border:'2px solid rgba(255,255,255,0.15)', touchAction:'none',
              }}
                onTouchStart={(e) => { const t=e.touches[0]; const el=e.currentTarget; const r=el.getBoundingClientRect(); const cx=r.left+r.width/2, cy=r.top+r.height/2; const dx=t.clientX-cx, dy=t.clientY-cy; const d=Math.sqrt(dx*dx+dy*dy); const max=50; const s=Math.min(1,d/max); joyRef.current={x:(dx/d||0)*s,y:(-dy/d||0)*s}; if(gameRef.current)gameRef.current.joy=joyRef.current; el.style.background='rgba(255,255,255,0.15)'; const dot=el.querySelector('.jb'); if(dot)dot.style.transform=`translate(${Math.min(dx/d*max||0,50)}px,${Math.min(-dy/d*max||0,50)}px)`; }}
                onTouchMove={(e) => { const t=e.touches[0]; const el=e.currentTarget; const r=el.getBoundingClientRect(); const cx=r.left+r.width/2, cy=r.top+r.height/2; const dx=t.clientX-cx, dy=t.clientY-cy; const d=Math.sqrt(dx*dx+dy*dy); const max=50; const s=Math.min(1,d/max); joyRef.current={x:(dx/d||0)*s,y:(-dy/d||0)*s}; if(gameRef.current)gameRef.current.joy=joyRef.current; const dot=el.querySelector('.jb'); if(dot)dot.style.transform=`translate(${(dx/d||0)*Math.min(d,50)}px,${(-dy/d||0)*Math.min(d,50)}px)`; }}
                onTouchEnd={(e) => { joyRef.current={x:0,y:0}; if(gameRef.current)gameRef.current.joy=joyRef.current; const el=e.currentTarget; el.style.background='rgba(255,255,255,0.08)'; const dot=el.querySelector('.jb'); if(dot)dot.style.transform='translate(0,0)'; }}
              >
                <div className="jb" style={{position:'absolute',top:'50%',left:'50%',width:20,height:20,margin:-10,borderRadius:'50%',background:'rgba(255,255,255,0.3)',border:'2px solid rgba(255,255,255,0.5)',transition:'transform 0.05s'}} />
              </div>
              <div className="sb-mobile-buttons" style={{position:'absolute',bottom:40,right:20,display:'flex',gap:10,pointerEvents:'auto'}}>
                <button style={{width:54,height:54,borderRadius:'50%',background:'rgba(255,255,255,0.12)',border:'2px solid rgba(255,255,255,0.2)',color:'#fff',fontSize:'10px',touchAction:'none'}}
                  onTouchStart={()=>{if(gameRef.current)gameRef.current.keys['ShiftLeft']=true}} onTouchEnd={()=>{if(gameRef.current)gameRef.current.keys['ShiftLeft']=false}}>🏃<br/>Correr</button>
                <button style={{width:54,height:54,borderRadius:'50%',background:'rgba(255,255,255,0.12)',border:'2px solid rgba(255,255,255,0.2)',color:'#fff',fontSize:'10px',touchAction:'none'}}
                  onTouchStart={()=>{if(gameRef.current)gameRef.current.keys['Space']=true}} onTouchEnd={()=>{if(gameRef.current)gameRef.current.keys['Space']=false}}>⬆️<br/>Pular</button>
                <button style={{width:54,height:54,borderRadius:'50%',background:'rgba(255,255,255,0.12)',border:'2px solid rgba(255,255,255,0.2)',color:'#fff',fontSize:'10px',touchAction:'none'}}
                  onTouchStart={()=>{if(gameRef.current)gameRef.current.keys['ControlLeft']=true}} onTouchEnd={()=>{if(gameRef.current)gameRef.current.keys['ControlLeft']=false}}>⬇️<br/>Agachar</button>
              </div>
            </div>

            {/* ─── DEBUG OVERLAY ─── */}
            <div style={{
              position:'fixed', bottom:0, left:0, zIndex:50,
              background:'rgba(0,0,0,0.7)', color:'#0f0',
              fontFamily:'monospace', fontSize:'11px', padding:'4px 8px',
              lineHeight:1.3, pointerEvents:'none', whiteSpace:'pre',
            }}>
cam {dbg.camX} {dbg.camY} {dbg.camZ}
              {'  '}player {dbg.pX} {dbg.pY} {dbg.pZ}
              {'  '}terrainH {dbg.terrainH}
              {'  '}meshes {dbg.meshes}
              {'  '}world {dbg.worldOk?'OK':'FALLBACK'} [{dbg.phase}]
              {'  '}[F1 debug]
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
