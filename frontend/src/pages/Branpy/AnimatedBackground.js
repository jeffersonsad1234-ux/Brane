const BASE = { position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" };

const NEON = {
  ...BASE, zIndex: -1, background: "#050608",
  content: (
    <>
      <style>{`
        @keyframes no1 { 0%,100%{transform:translate(0,0) scale(1);opacity:.3} 33%{transform:translate(120px,-80px) scale(1.2);opacity:.4} 66%{transform:translate(-60px,100px) scale(.9);opacity:.25} }
        @keyframes no2 { 0%,100%{transform:translate(0,0) scale(1);opacity:.2} 50%{transform:translate(-100px,60px) scale(1.3);opacity:.35} }
        @keyframes no3 { 0%,100%{transform:translate(0,0) scale(1);opacity:.15} 50%{transform:translate(80px,40px) scale(.8);opacity:.25} }
        @keyframes ng { 0%{transform:perspective(500px) rotateX(60deg) translateY(0)} 100%{transform:perspective(500px) rotateX(60deg) translateY(60px)} }
      `}</style>
      <div style={{ position:"absolute", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(138,44,255,.12) 0%,transparent 70%)", top:"10%", left:"20%", animation:"no1 25s ease-in-out infinite" }} />
      <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,229,255,.1) 0%,transparent 70%)", bottom:"10%", right:"15%", animation:"no2 30s ease-in-out infinite" }} />
      <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(46,204,113,.08) 0%,transparent 70%)", top:"50%", left:"50%", transform:"translate(-50%,-50%)", animation:"no3 20s ease-in-out infinite" }} />
      <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(138,44,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(138,44,255,.04) 1px,transparent 1px)", backgroundSize:"60px 60px", opacity:.5, animation:"ng 20s linear infinite" }} />
    </>
  ),
};

const ESPACO = {
  ...BASE, zIndex: -1, background: "linear-gradient(180deg,#020010 0%,#050608 50%,#0a0015 100%)",
  content: (
    <>
      <style>{`
        @keyframes tw { 0%,100%{opacity:.3} 50%{opacity:1} }
        @keyframes ss { 0%{transform:translateX(-100px) translateY(0);opacity:1} 100%{transform:translateX(calc(100vw + 100px)) translateY(80vh);opacity:0} }
        @keyframes np { 0%,100%{opacity:.15;transform:scale(1)} 50%{opacity:.25;transform:scale(1.05)} }
      `}</style>
      <div style={{ position:"absolute", width:800, height:800, borderRadius:"50%", background:"radial-gradient(circle,rgba(138,44,255,.1) 0%,transparent 60%)", top:"-20%", right:"-10%", animation:"np 15s ease-in-out infinite" }} />
      <div style={{ position:"absolute", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,229,255,.08) 0%,transparent 60%)", bottom:"-10%", left:"-5%", animation:"np 20s ease-in-out infinite" }} />
      {Array.from({ length: 80 }).map((_, i) => (
        <div key={i} style={{
          position:"absolute", borderRadius:"50%",
          width: Math.random()*3+1, height: Math.random()*3+1,
          left: Math.random()*100+"%", top: Math.random()*100+"%",
          background: ["#fff","#8a2cff","#00e5ff"][Math.floor(Math.random()*3)],
          boxShadow: ["none","0 0 4px rgba(138,44,255,.5)","0 0 4px rgba(0,229,255,.5)"][Math.floor(Math.random()*3)],
          animationName: "tw",
          animationTimingFunction: "ease-in-out",
          animationIterationCount: "infinite",
          animationDelay: Math.random()*5+"s",
          animationDuration: (Math.random()*3+2)+"s",
        }} />
      ))}
      <div style={{
        position:"absolute", width:2, height:2, borderRadius:"50%",
        background:"#fff", boxShadow:"0 0 6px #fff,0 0 12px rgba(0,229,255,.5)",
        top: Math.random()*30+10+"%",
        transform: "rotate(-30deg)",
        animationName: "ss",
        animationDuration: "4s",
        animationTimingFunction: "linear",
        animationIterationCount: "infinite",
        animationDelay: Math.random()*10+"s",
      }} />
    </>
  ),
};

const CIDADE = {
  ...BASE, zIndex: -1, background: "linear-gradient(180deg,#0a0017 0%,#050608 40%,#0d0020 100%)",
  content: (
    <>
      <style>{`
        @keyframes sl { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @keyframes wb { 0%,100%{opacity:.6} 50%{opacity:.2} }
        @keyframes np2 { 0%,100%{opacity:.5} 50%{opacity:1} }
        @keyframes cg { 0%,100%{opacity:.3} 50%{opacity:.5} }
      `}</style>
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"50%", background:"linear-gradient(0deg,rgba(138,44,255,.08) 0%,transparent)", animation:"cg 5s ease-in-out infinite" }} />
      <svg viewBox="0 0 800 200" preserveAspectRatio="xMidYMax meet" style={{ position:"absolute", bottom:0, left:0, width:"100%", height:"40%" }}>
        <defs>
          <linearGradient id="bg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(138,44,255,.15)" /><stop offset="100%" stopColor="rgba(138,44,255,.4)" /></linearGradient>
          <linearGradient id="bg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(0,229,255,.1)" /><stop offset="100%" stopColor="rgba(0,229,255,.3)" /></linearGradient>
        </defs>
        {[
          [0,50,140],[55,35,100],[95,60,180],[160,40,80],[205,55,160],[265,45,120],[315,70,190],[390,40,90],
          [435,55,150],[495,35,110],[535,60,170],[600,45,100],[650,50,155],[705,40,130],[750,55,165],
        ].map(([x,w,h],i) => (
          <g key={i}>
            <rect x={x} y={200-h} width={w-2} height={h} fill={`url(#${i%2===0?"bg1":"bg2"})`} rx={2} />
            {Array.from({length: Math.floor(h/20)}).map((_,j) => (
              <rect key={j} x={x+4} y={200-h+8+j*20} width={(w-10)/2} height={6} rx={1}
                fill={`rgba(255,255,255,${Math.random()*.3+.2})`}
                style={{ animation:"wb "+(Math.random()*4+2)+"s ease-in-out infinite", animationDelay: Math.random()*3+"s" }}
              />
            ))}
          </g>
        ))}
      </svg>
      <div style={{ position:"absolute", left:0, right:0, height:2, top:"30%", background:"linear-gradient(90deg,transparent,rgba(0,229,255,.15),transparent)", animation:"sl 4s linear infinite" }} />
      <div style={{ position:"absolute", top:"45%", left:0, right:0, height:1, background:"linear-gradient(90deg,transparent,rgba(0,229,255,.2),rgba(138,44,255,.2),transparent)", animation:"np2 3s ease-in-out infinite" }} />
    </>
  ),
};

const ESTUDIO = {
  ...BASE, zIndex: -1, background: "linear-gradient(180deg,#080012 0%,#050608 50%,#0a0018 100%)",
  content: (
    <>
      <style>{`
        @keyframes sv { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @keyframes vp { 0%,100%{opacity:.6} 50%{opacity:.9} }
        @keyframes lb { 0%,100%{opacity:.2} 50%{opacity:.5} }
        @keyframes df { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
      `}</style>
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,.6) 100%)", animation:"vp 8s ease-in-out infinite" }} />
      <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(138,44,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(138,44,255,.03) 1px,transparent 1px)", backgroundSize:"40px 40px", opacity:.6 }} />
      <div style={{ position:"absolute", top:"30%", left:0, right:0, height:2, background:"linear-gradient(90deg,transparent,rgba(138,44,255,.1),rgba(0,229,255,.1),transparent)", animation:"lb 4s ease-in-out infinite" }} />
      <div style={{ position:"absolute", top:"70%", left:0, right:0, height:2, background:"linear-gradient(90deg,transparent,rgba(0,229,255,.1),rgba(138,44,255,.1),transparent)", animation:"lb 5s ease-in-out infinite", animationDelay:"1s" }} />
      <div style={{ position:"absolute", left:0, right:0, height:1, top:"0%", background:"linear-gradient(90deg,transparent,rgba(0,229,255,.08),transparent)", animation:"sv 6s linear infinite" }} />
      <div style={{ position:"absolute", left:0, right:0, height:1, top:"0%", background:"linear-gradient(90deg,transparent,rgba(0,229,255,.08),transparent)", animation:"sv 6s linear infinite", animationDelay:"3s" }} />
      <div style={{ position:"absolute", top:16, left:16, width:40, height:40, borderTop:"1px solid rgba(138,44,255,.15)", borderLeft:"1px solid rgba(138,44,255,.15)" }} />
      <div style={{ position:"absolute", top:16, right:16, width:40, height:40, borderTop:"1px solid rgba(138,44,255,.15)", borderRight:"1px solid rgba(138,44,255,.15)" }} />
      <div style={{ position:"absolute", bottom:16, left:16, width:40, height:40, borderBottom:"1px solid rgba(138,44,255,.15)", borderLeft:"1px solid rgba(138,44,255,.15)" }} />
      <div style={{ position:"absolute", bottom:16, right:16, width:40, height:40, borderBottom:"1px solid rgba(138,44,255,.15)", borderRight:"1px solid rgba(138,44,255,.15)" }} />
      <div style={{ position:"absolute", top:"50%", left:0, width:"30%", height:1, background:"linear-gradient(90deg,transparent,rgba(0,229,255,.12))", animation:"df 8s linear infinite" }} />
    </>
  ),
};

const PARTICULAS = {
  ...BASE, zIndex: -1, background: "#050608",
  content: (
    <>
      <style>{`
        @keyframes fu { 0%{transform:translateY(0) translateX(0) scale(1);opacity:0} 10%{opacity:.8} 90%{opacity:.6} 100%{transform:translateY(-100vh) translateX(50px) scale(.5);opacity:0} }
        @keyframes ew { 0%{transform:scaleY(0);opacity:0} 50%{opacity:.1;transform:scaleY(1)} 100%{transform:scaleY(0);opacity:0} }
      `}</style>
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"40%", background:"linear-gradient(0deg,rgba(138,44,255,.05) 0%,transparent)", animation:"ew 8s ease-in-out infinite" }} />
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"30%", background:"linear-gradient(0deg,rgba(0,229,255,.03) 0%,transparent)", animation:"ew 10s ease-in-out infinite", animationDelay:"2s" }} />
      {Array.from({ length: 40 }).map((_, i) => (
        <div key={i} style={{
          position:"absolute", borderRadius:"50%",
          width: Math.random()*4+2, height: Math.random()*4+2,
          left: Math.random()*100+"%", bottom: "-10px",
          background: ["rgba(138,44,255,.8)","rgba(0,229,255,.7)","rgba(46,204,113,.6)","rgba(255,255,255,.5)"][Math.floor(Math.random()*4)],
          boxShadow: "0 0 6px currentColor",
          animationName: "fu",
          animationTimingFunction: "linear",
          animationIterationCount: "infinite",
          animationDuration: (Math.random()*10+10)+"s",
          animationDelay: Math.random()*15+"s",
        }} />
      ))}
    </>
  ),
};

const MAP = { neon: NEON, espaco: ESPACO, cidade: CIDADE, estudio: ESTUDIO, particulas: PARTICULAS };

export default function AnimatedBackground({ variant }) {
  const cfg = MAP[variant] || NEON;
  return <div style={cfg}>{cfg.content}</div>;
}
