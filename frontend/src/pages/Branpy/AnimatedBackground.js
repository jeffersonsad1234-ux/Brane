const S = (s) => s;

const NEON = [
  S({ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:0, overflow:"hidden", pointerEvents:"none", background:"#050608" }),
  <>
    <style>{`
      @keyframes n1 { 0%,100%{transform:translate(0,0)scale(1);opacity:.6}33%{transform:translate(120px,-80px)scale(1.2);opacity:.8}66%{transform:translate(-60px,100px)scale(.9);opacity:.5} }
      @keyframes n2 { 0%,100%{transform:translate(0,0)scale(1);opacity:.5}50%{transform:translate(-100px,60px)scale(1.3);opacity:.7} }
      @keyframes n3 { 0%,100%{transform:translate(0,0)scale(1);opacity:.4}50%{transform:translate(80px,40px)scale(.8);opacity:.6} }
      @keyframes ng { 0%{transform:perspective(500px)rotateX(60deg)translateY(0)}100%{transform:perspective(500px)rotateX(60deg)translateY(60px)} }
    `}</style>
    <div style={{ position:"absolute", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(138,44,255,.25) 0%,transparent 70%)", top:"10%", left:"20%", animation:"n1 25s ease-in-out infinite" }} />
    <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,229,255,.2) 0%,transparent 70%)", bottom:"10%", right:"15%", animation:"n2 30s ease-in-out infinite" }} />
    <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(46,204,113,.15) 0%,transparent 70%)", top:"50%", left:"50%", transform:"translate(-50%,-50%)", animation:"n3 20s ease-in-out infinite" }} />
    <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, backgroundImage:"linear-gradient(rgba(138,44,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(138,44,255,.08) 1px,transparent 1px)", backgroundSize:"60px 60px", opacity:.6, animation:"ng 20s linear infinite" }} />
  </>,
];

const ESPACO = [
  S({ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:0, overflow:"hidden", pointerEvents:"none", background:"linear-gradient(180deg,#020010 0%,#050608 50%,#0a0015 100%)" }),
  <>
    <style>{`
      @keyframes t1 { 0%,100%{opacity:.4}50%{opacity:1} }
      @keyframes s1 { 0%{transform:translateX(-100px)translateY(0);opacity:1}100%{transform:translateX(calc(100vw + 100px))translateY(80vh);opacity:0} }
      @keyframes np { 0%,100%{opacity:.3;transform:scale(1)}50%{opacity:.5;transform:scale(1.05)} }
    `}</style>
    <div style={{ position:"absolute", width:800, height:800, borderRadius:"50%", background:"radial-gradient(circle,rgba(138,44,255,.2) 0%,transparent 60%)", top:"-20%", right:"-10%", animation:"np 15s ease-in-out infinite" }} />
    <div style={{ position:"absolute", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,229,255,.15) 0%,transparent 60%)", bottom:"-10%", left:"-5%", animation:"np 20s ease-in-out infinite" }} />
    {Array.from({length:120}).map((_,i)=>(
      <div key={i} style={{
        position:"absolute", borderRadius:"50%",
        width: Math.random()*3+1, height: Math.random()*3+1,
        left: Math.random()*100+"%", top: Math.random()*100+"%",
        background: ["#fff","#8a2cff","#00e5ff"][Math.floor(Math.random()*3)],
        boxShadow: ["0 0 2px #fff","0 0 4px rgba(138,44,255,.8)","0 0 4px rgba(0,229,255,.8)"][Math.floor(Math.random()*3)],
        animationName: "t1", animationDuration: (Math.random()*3+2)+"s",
        animationTimingFunction: "ease-in-out", animationIterationCount: "infinite",
        animationDelay: Math.random()*5+"s",
      }} />
    ))}
    <div style={{
      position:"absolute", width:3, height:3, borderRadius:"50%", background:"#fff",
      boxShadow:"0 0 8px #fff,0 0 16px rgba(0,229,255,.8)",
      top: Math.random()*30+10+"%", transform:"rotate(-30deg)",
      animationName:"s1", animationDuration:"4s", animationTimingFunction:"linear",
      animationIterationCount:"infinite", animationDelay: Math.random()*10+"s",
    }} />
  </>,
];

const CIDADE = [
  S({ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:0, overflow:"hidden", pointerEvents:"none", background:"linear-gradient(180deg,#0a0017 0%,#050608 40%,#0d0020 100%)" }),
  <>
    <style>{`
      @keyframes sl { 0%{transform:translateY(-100%)}100%{transform:translateY(100vh)} }
      @keyframes wb { 0%,100%{opacity:.6}50%{opacity:.2} }
      @keyframes np2 { 0%,100%{opacity:.6}50%{opacity:1} }
      @keyframes cg { 0%,100%{opacity:.4}50%{opacity:.7} }
    `}</style>
    <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"50%", background:"linear-gradient(0deg,rgba(138,44,255,.15) 0%,transparent)", animation:"cg 5s ease-in-out infinite" }} />
    <svg viewBox="0 0 800 200" preserveAspectRatio="xMidYMax meet" style={{ position:"absolute", bottom:0, left:0, width:"100%", height:"40%" }}>
      <defs>
        <linearGradient id="g1"><stop offset="0%" stopColor="rgba(138,44,255,.25)"/><stop offset="100%" stopColor="rgba(138,44,255,.5)"/></linearGradient>
        <linearGradient id="g2"><stop offset="0%" stopColor="rgba(0,229,255,.2)"/><stop offset="100%" stopColor="rgba(0,229,255,.4)"/></linearGradient>
      </defs>
      {[[0,50,140],[55,35,100],[95,60,180],[160,40,80],[205,55,160],[265,45,120],[315,70,190],[390,40,90],
        [435,55,150],[495,35,110],[535,60,170],[600,45,100],[650,50,155],[705,40,130],[750,55,165]
      ].map(([x,w,h],i)=>(
        <g key={i}>
          <rect x={x} y={200-h} width={w-2} height={h} fill={`url(#${i%2===0?"g1":"g2"})`} rx={2}/>
          {Array.from({length:Math.floor(h/20)}).map((_,j)=>(
            <rect key={j} x={x+4} y={200-h+8+j*20} width={(w-10)/2} height={6} rx={1}
              fill={`rgba(255,255,255,${Math.random()*.4+.3})`}
              style={{ animation:"wb "+(Math.random()*4+2)+"s ease-in-out infinite", animationDelay:Math.random()*3+"s" }}
            />
          ))}
        </g>
      ))}
    </svg>
    <div style={{ position:"absolute", left:0, right:0, height:2, top:"30%", background:"linear-gradient(90deg,transparent,rgba(0,229,255,.3),transparent)", animation:"sl 4s linear infinite" }} />
    <div style={{ position:"absolute", top:"45%", left:0, right:0, height:1, background:"linear-gradient(90deg,transparent,rgba(0,229,255,.4),rgba(138,44,255,.4),transparent)", animation:"np2 3s ease-in-out infinite" }} />
  </>,
];

const ESTUDIO = [
  S({ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:0, overflow:"hidden", pointerEvents:"none", background:"linear-gradient(180deg,#080012 0%,#050608 50%,#0a0018 100%)" }),
  <>
    <style>{`
      @keyframes sv { 0%{transform:translateY(-100%)}100%{transform:translateY(100vh)} }
      @keyframes vp { 0%,100%{opacity:.6}50%{opacity:.9} }
      @keyframes lb { 0%,100%{opacity:.3}50%{opacity:.6} }
      @keyframes df { 0%{transform:translateX(-100%)}100%{transform:translateX(200%)} }
    `}</style>
    <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, background:"radial-gradient(ellipse at center,transparent 30%,rgba(0,0,0,.7) 100%)", animation:"vp 8s ease-in-out infinite" }} />
    <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, backgroundImage:"linear-gradient(rgba(138,44,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(138,44,255,.06) 1px,transparent 1px)", backgroundSize:"40px 40px", opacity:.7 }} />
    <div style={{ position:"absolute", top:"30%", left:0, right:0, height:2, background:"linear-gradient(90deg,transparent,rgba(138,44,255,.2),rgba(0,229,255,.2),transparent)", animation:"lb 4s ease-in-out infinite" }} />
    <div style={{ position:"absolute", top:"70%", left:0, right:0, height:2, background:"linear-gradient(90deg,transparent,rgba(0,229,255,.2),rgba(138,44,255,.2),transparent)", animation:"lb 5s ease-in-out infinite", animationDelay:"1s" }} />
    <div style={{ position:"absolute", left:0, right:0, height:1, top:"0%", background:"linear-gradient(90deg,transparent,rgba(0,229,255,.15),transparent)", animation:"sv 6s linear infinite" }} />
    <div style={{ position:"absolute", left:0, right:0, height:1, top:"0%", background:"linear-gradient(90deg,transparent,rgba(0,229,255,.15),transparent)", animation:"sv 6s linear infinite", animationDelay:"3s" }} />
    <div style={{ position:"absolute", top:16, left:16, width:40, height:40, borderTop:"1px solid rgba(138,44,255,.25)", borderLeft:"1px solid rgba(138,44,255,.25)" }} />
    <div style={{ position:"absolute", top:16, right:16, width:40, height:40, borderTop:"1px solid rgba(138,44,255,.25)", borderRight:"1px solid rgba(138,44,255,.25)" }} />
    <div style={{ position:"absolute", bottom:16, left:16, width:40, height:40, borderBottom:"1px solid rgba(138,44,255,.25)", borderLeft:"1px solid rgba(138,44,255,.25)" }} />
    <div style={{ position:"absolute", bottom:16, right:16, width:40, height:40, borderBottom:"1px solid rgba(138,44,255,.25)", borderRight:"1px solid rgba(138,44,255,.25)" }} />
    <div style={{ position:"absolute", top:"50%", left:0, width:"30%", height:1, background:"linear-gradient(90deg,transparent,rgba(0,229,255,.2))", animation:"df 8s linear infinite" }} />
  </>,
];

const PARTICULAS = [
  S({ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:0, overflow:"hidden", pointerEvents:"none", background:"#050608" }),
  <>
    <style>{`
      @keyframes fu { 0%{transform:translateY(0)translateX(0)scale(1);opacity:0}10%{opacity:1}90%{opacity:.8}100%{transform:translateY(-100vh)translateX(50px)scale(.5);opacity:0} }
      @keyframes ew { 0%{transform:scaleY(0);opacity:0}50%{opacity:.2;transform:scaleY(1)}100%{transform:scaleY(0);opacity:0} }
    `}</style>
    <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"40%", background:"linear-gradient(0deg,rgba(138,44,255,.1) 0%,transparent)", animation:"ew 8s ease-in-out infinite" }} />
    <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"30%", background:"linear-gradient(0deg,rgba(0,229,255,.06) 0%,transparent)", animation:"ew 10s ease-in-out infinite", animationDelay:"2s" }} />
    {Array.from({length:60}).map((_,i)=>(
      <div key={i} style={{
        position:"absolute", borderRadius:"50%",
        width: Math.random()*5+2, height: Math.random()*5+2,
        left: Math.random()*100+"%", bottom:"-10px",
        background: ["rgba(138,44,255,.9)","rgba(0,229,255,.8)","rgba(46,204,113,.7)","rgba(255,255,255,.6)"][Math.floor(Math.random()*4)],
        boxShadow: "0 0 8px currentColor",
        animationName: "fu", animationDuration: (Math.random()*10+10)+"s",
        animationTimingFunction: "linear", animationIterationCount: "infinite",
        animationDelay: Math.random()*15+"s",
      }} />
    ))}
  </>,
];

const NATUREZA = [
  S({ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:0, overflow:"hidden", pointerEvents:"none", background:"linear-gradient(180deg,#0a1f0a 0%,#1a3a1a 30%,#2d5a2d 60%,#1a4a2a 100%)" }),
  <>
    <style>{`
      @keyframes lf { 0%,100%{transform:translateY(0)scale(1);opacity:.3}50%{transform:translateY(-20px)scale(1.02);opacity:.5} }
      @keyframes sn { 0%,100%{opacity:.6}50%{opacity:.9} }
      @keyflies ray { 0%{transform:rotate(0deg)}100%{transform:rotate(360deg)} }
    `}</style>
    <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"60%", background:"linear-gradient(0deg,rgba(34,80,34,.6) 0%,rgba(20,60,20,.3) 40%,transparent 100%)" }} />
    <div style={{ position:"absolute", top:"8%", left:"50%", transform:"translateX(-50%)", width:120, height:120, borderRadius:"50%", background:"radial-gradient(circle,rgba(255,220,100,.8) 0%,rgba(255,180,50,.3) 50%,transparent 70%)", animation:"sn 6s ease-in-out infinite" }} />
    {Array.from({length:30}).map((_,i)=>(
      <div key={i} style={{
        position:"absolute", borderRadius:"50%",
        width: Math.random()*6+3, height: Math.random()*6+3,
        left: Math.random()*100+"%", bottom: Math.random()*30+5+"%",
        background: ["rgba(46,120,46,.8)","rgba(60,150,60,.6)","rgba(30,90,30,.9)","rgba(70,160,70,.5)"][Math.floor(Math.random()*4)],
        borderRadius:"50% 50% 50% 50% / 60% 60% 40% 40%",
        animation:"lf "+(Math.random()*4+3)+"s ease-in-out infinite",
        animationDelay: Math.random()*5+"s",
      }} />
    ))}
    <div style={{ position:"absolute", bottom:"15%", left:"5%", width:"90%", height:"15%", background:"linear-gradient(0deg,rgba(20,50,20,.8) 0%,transparent 100%)", borderRadius:"50%" }} />
    <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, background:"radial-gradient(ellipse at 30% 20%,rgba(255,200,80,.1) 0%,transparent 50%)" }} />
  </>,
];

const TECNOLOGIA = [
  S({ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:0, overflow:"hidden", pointerEvents:"none", background:"linear-gradient(135deg,#0a1628 0%,#0d1f3c 30%,#112a4a 60%,#0a1628 100%)" }),
  <>
    <style>{`
      @keyframes cl { 0%{transform:translateX(-100%)}100%{transform:translateX(200%)} }
      @keyframes pl { 0%,100%{opacity:.4}50%{opacity:.8} }
      @keyframes dn { 0%{transform:translateY(-100%)}100%{transform:translateY(100vh)} }
    `}</style>
    <div style={{ position:"absolute", top:0, left:0, right:0, height:"100%", backgroundImage:"linear-gradient(rgba(0,150,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,150,255,.05) 1px,transparent 1px)", backgroundSize:"30px 30px" }} />
    {Array.from({length:8}).map((_,i)=>(
      <div key={i} style={{
        position:"absolute", width:2, height:Math.random()*60+20,
        left: Math.random()*100+"%", top: Math.random()*100+"%",
        background: `linear-gradient(180deg,transparent,rgba(0,150,255,${Math.random()*.3+.2}),transparent)`,
        animation:"dn "+(Math.random()*4+6)+"s linear infinite",
        animationDelay: Math.random()*8+"s",
      }} />
    ))}
    <div style={{ position:"absolute", top:"20%", left:0, right:0, height:1, background:"linear-gradient(90deg,transparent,rgba(0,200,255,.4),rgba(0,100,255,.4),transparent)", animation:"cl 4s linear infinite" }} />
    <div style={{ position:"absolute", top:"50%", left:"30%", width:"40%", height:"30%", border:"1px solid rgba(0,150,255,.15)", borderRadius:12, transform:"perspective(400px) rotateX(10deg)" }}>
      <div style={{ position:"absolute", top:"10%", left:"10%", width:"80%", height:"80%", border:"1px solid rgba(0,150,255,.1)", borderRadius:8 }} />
      <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:8, height:8, borderRadius:"50%", background:"rgba(0,200,255,.5)", boxShadow:"0 0 20px rgba(0,200,255,.3)", animation:"pl 2s ease-in-out infinite" }} />
    </div>
    <div style={{ position:"absolute", bottom:"15%", left:"20%", width:8, height:8, borderRadius:"50%", background:"rgba(0,200,255,.6)", boxShadow:"0 0 15px rgba(0,200,255,.4)", animation:"pl 1.5s ease-in-out infinite" }} />
    <div style={{ position:"absolute", bottom:"25%", right:"25%", width:5, height:5, borderRadius:"50%", background:"rgba(0,150,255,.5)", boxShadow:"0 0 10px rgba(0,150,255,.3)", animation:"pl 2.5s ease-in-out infinite", animationDelay:"1s" }} />
  </>,
];

const SALA_GAMER = [
  S({ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:0, overflow:"hidden", pointerEvents:"none", background:"linear-gradient(180deg,#0d0d1a 0%,#1a1a2e 30%,#0f0f1f 60%,#0a0a18 100%)" }),
  <>
    <style>{`
      @keyframes rg { 0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%} }
      @keyframes ng2 { 0%,100%{opacity:.3}50%{opacity:.7} }
      @keyframes kb { 0%{transform:translateY(0)}100%{transform:translateY(-5px)} }
    `}</style>
    <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, background:"linear-gradient(135deg,rgba(255,0,100,.05),rgba(0,200,255,.05),rgba(138,44,255,.05),rgba(0,255,136,.05))", backgroundSize:"400% 400%", animation:"rg 10s ease infinite" }} />
    <div style={{ position:"absolute", bottom:"20%", left:"50%", transform:"translateX(-50%)", width:"70%", height:"40%", background:"linear-gradient(180deg,rgba(30,30,50,.6) 0%,rgba(20,20,40,.8) 100%)", borderRadius:20, border:"1px solid rgba(138,44,255,.2)" }}>
      <div style={{ position:"absolute", bottom:"10%", left:"10%", width:"80%", height:"30%", background:"linear-gradient(90deg,rgba(138,44,255,.2),rgba(0,229,255,.2),rgba(255,0,100,.2),rgba(0,255,136,.2))", borderRadius:4, backgroundSize:"300% 100%", animation:"rg 4s ease infinite" }} />
      <div style={{ position:"absolute", top:"8%", left:"15%", width:"70%", height:"8%", display:"flex", gap:4 }}>
        {Array.from({length:10}).map((_,i)=>(
          <div key={i} style={{ flex:1, height:"100%", background:["rgba(0,255,136,.4)","rgba(255,0,100,.4)","rgba(0,200,255,.4)"][i%3], borderRadius:2, animation:"ng2 "+(Math.random()*2+1)+"s ease-in-out infinite", animationDelay:Math.random()*2+"s" }} />
        ))}
      </div>
    </div>
    {Array.from({length:4}).map((_,i)=>(
      <div key={i} style={{
        position:"absolute", width:6, height:6, borderRadius:"50%",
        top: Math.random()*40+5+"%", left: Math.random()*90+5+"%",
        background: ["#ff0066","#00e5ff","#8a2cff","#00ff88"][i],
        boxShadow: `0 0 15px ${["#ff0066","#00e5ff","#8a2cff","#00ff88"][i]}`,
        animation:"ng2 "+(Math.random()*3+2)+"s ease-in-out infinite",
        animationDelay: Math.random()*3+"s",
      }} />
    ))}
  </>,
];

const BIBLIOTECA = [
  S({ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:0, overflow:"hidden", pointerEvents:"none", background:"linear-gradient(180deg,#1a1410 0%,#2a2018 30%,#1e1814 60%,#14100c 100%)" }),
  <>
    <style>{`
      @keyframes fl { 0%,100%{opacity:.3}50%{opacity:.6} }
      @keyframes sh { 0%{transform:translateX(-100%)}100%{transform:translateX(200%)} }
    `}</style>
    <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, background:"radial-gradient(ellipse at 50% 30%,rgba(180,140,60,.05) 0%,transparent 60%)" }} />
    {Array.from({length:20}).map((_,i)=>(
      <div key={i} style={{
        position:"absolute",
        width: Math.random()*8+4, height: Math.random()*40+20,
        left: Math.random()*95+"%", bottom: Math.random()*30+10+"%",
        background: `linear-gradient(180deg,rgba(100,70,40,${Math.random()*.3+.2}) 0%,rgba(80,55,30,${Math.random()*.3+.2}) 100%)`,
        borderRadius:1,
        borderLeft:"1px solid rgba(180,140,60,.1)",
        borderRight:"1px solid rgba(180,140,60,.1)",
      }} />
    ))}
    <div style={{ position:"absolute", top:"15%", left:"10%", width:"80%", height:"70%", border:"1px solid rgba(180,140,60,.1)", borderRadius:4, boxShadow:"inset 0 0 40px rgba(0,0,0,.3)" }} />
    <div style={{ position:"absolute", top:"10%", left:"50%", transform:"translateX(-50%)", width:"30%", height:2, background:"linear-gradient(90deg,transparent,rgba(180,140,60,.3),transparent)", animation:"sh 6s linear infinite" }} />
    <div style={{ position:"absolute", top:"35%", left:"15%", width:4, height:4, borderRadius:"50%", background:"rgba(180,140,60,.3)", boxShadow:"0 0 8px rgba(180,140,60,.2)", animation:"fl 3s ease-in-out infinite" }} />
    <div style={{ position:"absolute", bottom:"30%", right:"20%", width:3, height:3, borderRadius:"50%", background:"rgba(180,140,60,.2)", boxShadow:"0 0 6px rgba(180,140,60,.15)", animation:"fl 4s ease-in-out infinite", animationDelay:"1s" }} />
  </>,
];

const FUTURISTA = [
  S({ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:0, overflow:"hidden", pointerEvents:"none", background:"linear-gradient(135deg,#0a0020 0%,#100030 30%,#180050 50%,#0a0030 70%,#050015 100%)" }),
  <>
    <style>{`
      @keyframes hp { 0%{transform:rotate(0deg)}100%{transform:rotate(360deg)} }
      @keyframes gl { 0%,100%{opacity:.2}50%{opacity:.6} }
      @keyframes wv { 0%{transform:translateX(-200%)}100%{transform:translateX(200%)} }
    `}</style>
    <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, background:"radial-gradient(circle at 50% 50%,rgba(138,44,255,.08) 0%,transparent 50%)", animation:"gl 4s ease-in-out infinite" }} />
    {Array.from({length:15}).map((_,i)=>(
      <div key={i} style={{
        position:"absolute",
        width: Math.random()*3+1, height: Math.random()*3+1,
        borderRadius:"50%",
        left: Math.random()*100+"%", top: Math.random()*100+"%",
        background: ["rgba(138,44,255,.8)","rgba(0,229,255,.7)","rgba(255,0,200,.6)"][Math.floor(Math.random()*3)],
        boxShadow: `0 0 ${Math.random()*10+5}px currentColor`,
        animation:"gl "+(Math.random()*3+2)+"s ease-in-out infinite",
        animationDelay: Math.random()*4+"s",
      }} />
    ))}
    <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:200, height:200, borderRadius:"50%", border:"1px solid rgba(138,44,255,.15)", animation:"hp 20s linear infinite" }}>
      <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:120, height:120, borderRadius:"50%", border:"1px solid rgba(0,229,255,.1)", animation:"hp 15s linear infinite reverse" }}>
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:50, height:50, borderRadius:"50%", background:"radial-gradient(circle,rgba(138,44,255,.2) 0%,transparent 70%)" }} />
      </div>
    </div>
    <div style={{ position:"absolute", bottom:"20%", left:0, right:0, height:1, background:"linear-gradient(90deg,transparent,rgba(0,229,255,.3),rgba(138,44,255,.3),transparent)", animation:"wv 5s linear infinite" }} />
    <div style={{ position:"absolute", bottom:"40%", left:0, right:0, height:1, background:"linear-gradient(90deg,transparent,rgba(138,44,255,.2),rgba(0,229,255,.2),transparent)", animation:"wv 7s linear infinite", animationDelay:"2s" }} />
  </>,
];

const CIDADE_NOTURNA = [
  S({ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:0, overflow:"hidden", pointerEvents:"none", background:"linear-gradient(180deg,#050510 0%,#0a0a2e 30%,#0f0f3a 50%,#0a0a2e 70%,#050510 100%)" }),
  <>
    <style>{`
      @keyframes tw { 0%,100%{opacity:.3}50%{opacity:.8} }
      @keyframes mb { 0%,100%{opacity:.2}50%{opacity:.5} }
      @keyframes cr { 0%{transform:translateY(0)}100%{transform:translateY(-20px)} }
    `}</style>
    <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"45%", background:"linear-gradient(0deg,rgba(10,10,46,.9) 0%,rgba(20,20,60,.6) 50%,transparent 100%)" }} />
    {Array.from({length:50}).map((_,i)=>(
      <div key={i} style={{
        position:"absolute",
        width: Math.random()*2+1, height: Math.random()*2+1,
        borderRadius:"50%",
        left: Math.random()*100+"%", top: Math.random()*40+"%",
        background: "#fff",
        animation:"tw "+(Math.random()*3+2)+"s ease-in-out infinite",
        animationDelay: Math.random()*5+"s",
      }} />
    ))}
    <div style={{ position:"absolute", bottom:"45%", left:0, right:0, height:"30%", display:"flex", alignItems:"flex-end", justifyContent:"space-around", padding:"0 4%" }}>
      {Array.from({length:12}).map((_,i)=>(
        <div key={i} style={{
          width: `${6+Math.random()*4}%`, height: `${30+Math.random()*70}%`,
          background: `linear-gradient(180deg,rgba(30,30,80,${.6+Math.random()*.3}) 0%,rgba(20,20,60,${.7+Math.random()*.3}) 100%)`,
          borderRadius:"2px 2px 0 0",
          borderBottom:"2px solid rgba(80,80,150,.3)",
          position:"relative",
          animation:"cr "+(Math.random()*3+4)+"s ease-in-out infinite",
          animationDelay: Math.random()*3+"s",
        }}>
          {Array.from({length:Math.floor(Math.random()*4+2)}).map((_,j)=>(
            <div key={j} style={{
              position:"absolute",
              width: "30%", height: "8%",
              left: Math.random()*60+10+"%",
              top: Math.random()*80+10+"%",
              background: ["rgba(255,200,50,.6)","rgba(255,100,50,.5)","rgba(100,200,255,.5)","rgba(255,255,255,.4)"][Math.floor(Math.random()*4)],
              borderRadius:1,
              animation:"mb "+(Math.random()*2+2)+"s ease-in-out infinite",
              animationDelay: Math.random()*3+"s",
            }} />
          ))}
        </div>
      ))}
    </div>
    <div style={{ position:"absolute", bottom:"20%", left:"10%", width:"80%", height:1, background:"linear-gradient(90deg,transparent,rgba(0,150,255,.2),rgba(138,44,255,.2),transparent)" }} />
  </>,
];

const MAP = {
  neon:NEON, espaco:ESPACO, cidade:CIDADE, estudio:ESTUDIO, particulas:PARTICULAS,
  natureza:NATUREZA, tecnologia:TECNOLOGIA, sala_gamer:SALA_GAMER,
  biblioteca:BIBLIOTECA, futurista:FUTURISTA, cidade_noturna:CIDADE_NOTURNA
};

export default function AnimatedBackground({ variant }) {
  const [style, content] = MAP[variant] || NEON;
  return <div style={style}>{content}</div>;
}
