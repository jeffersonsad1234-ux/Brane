import { useEffect, useRef, useState, useCallback } from "react";
import { Send, Sparkles, Check, Camera, Phone, MessageSquare } from "lucide-react";

const CONDITIONS = ["Novo", "Seminovo", "Usado", "Recondicionado"];
const AVAILABILITIES = ["Item único", "Várias unidades", "Sob demanda", "Serviço"];
const CATEGORIES = ["Celulares", "Veículos", "Imóveis", "Casa e móveis", "Moda", "Serviços", "Outros"];

const defaultAd = {
  title: "", price: "", category: "", condition: "", city: "", state: "",
  availability: "", description: "", phone: "", whatsapp: ""
};

const safe = (v) => String(v || "").trim();

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const KNOWN_CITIES = [
  "castanhal","belém","ananindeua","santarém","marabá","parauapebas","redenção",
  "são paulo","campinas","santos","são josé dos campos","ribeirão preto","guarulhos",
  "rio de janeiro","niterói","duque de caxias","nova iguaçu","petrópolis",
  "salvador","feira de santana","vitória da conquista","camaçari",
  "fortaleza","juazeiro do norte","sobral","caucaia",
  "recife","olinda","caruaru","petrolina",
  "brasília",
  "curitiba","londrina","maringá","ponta grossa","cascavel",
  "belo horizonte","uberlândia","contagem","juiz de fora","montes claros",
  "manaus","parintins",
  "goiânia","aparecida de goiânia","anápolis",
  "são luís","imperatriz",
  "natal","mossoró","parnamirim",
  "joão pessoa","campina grande",
  "maceió","arapiraca",
  "aracaju","nossa senhora do socorro",
  "cuiabá","várzea grande","rondonópolis",
  "campo grande","dourados",
  "porto alegre","caxias do sul","pelotas","canoas",
  "florianópolis","joinville","blumenau","chapecó",
  "teresina","parnaíba",
  "porto velho","ji-paraná",
  "rio branco",
  "macapá","santana",
  "boa vista",
  "palmas","araguaína",
  "vitória","vila velha","serra","cariacica"
];

const BRAZIL_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];

const STATE_NAMES = [
  "acre","alagoas","amapá","amazonas","bahia","ceará","distrito federal",
  "espírito santo","goiás","maranhão","mato grosso","mato grosso do sul",
  "minas gerais","pará","paraíba","paraná","pernambuco","piauí",
  "rio de janeiro","rio grande do norte","rio grande do sul","rondônia",
  "roraima","santa catarina","são paulo","sergipe","tocantins"
];

const CATEGORY_KEYWORDS = [
  { cat: "Veículos", words: ["bicicleta","bike","moto","motocicleta","carro","automóvel","caminhão","caminhonete","ônibus","veículo","patinete","skate"] },
  { cat: "Serviços", words: ["serviço","conserto","manutenção","aula","reforma","limpeza","entrega","frete","instalação","reparo","pintura","consultoria"] },
  { cat: "Celulares", words: ["celular","iphone","smartphone","tablet","ipad","notebook","computador","pc","laptop","apple","samsung","xiaomi","motorola","fone","carregador","cabo","teclado","mouse","monitor"] },
  { cat: "Imóveis", words: ["casa","apartamento","kitnet","terreno","sala comercial","imóvel","aluguel","condomínio","cobertura"] },
  { cat: "Casa e móveis", words: ["cama","colchão","sofá","mesa","cadeira","armário","estante","móvel","guarda-roupa","geladeira","fogão","micro-ondas","tv","televisão","ventilador","tapete","cortina"] },
  { cat: "Moda", words: ["sapato","roupa","bolsa","vestido","camisa","calça","tênis","jaqueta","blusa","bermuda","short","casaco","sandália","cinto","chapéu","moletom"] },
];

const isLocation = (s) => {
  const low = s.toLowerCase().trim();
  if (KNOWN_CITIES.includes(low)) return true;
  const m = s.match(/^(.+)\s*[-–]\s*(.+)$/);
  if (m) {
    const stateU = m[2].trim().toUpperCase();
    if (BRAZIL_STATES.includes(stateU)) return true;
    if (STATE_NAMES.includes(m[2].trim().toLowerCase())) return true;
  }
  if (BRAZIL_STATES.includes(low.toUpperCase())) return true;
  if (STATE_NAMES.includes(low)) return true;
  const words = low.split(/\s+/);
  if (words.length >= 2) {
    const last = words[words.length - 1];
    const rest = words.slice(0, -1).join(" ");
    if (BRAZIL_STATES.includes(last.toUpperCase()) || STATE_NAMES.includes(last)) return true;
  }
  return false;
};

const wordBoundary = (w) => "(?:^|[\\s,])" + escapeRegex(w) + "(?=[\\s,]|$)";

const detectCategory = (title) => {
  const low = title.toLowerCase();
  for (const entry of CATEGORY_KEYWORDS) {
    for (const w of entry.words) {
      const wl = w.toLowerCase();
      if (new RegExp(wordBoundary(wl), "i").test(low)) return entry.cat;
      if (wl.includes(" ") && low.includes(wl)) return entry.cat;
    }
  }
  return "Outros";
};

const wordMatch = (text, phrase) => {
  if (text.toLowerCase() === phrase.toLowerCase()) return true;
  const base = phrase.replace(/[oa]$/, "");
  if (base.length < 2) return false;
  return new RegExp("(?:^|[\\s,])" + escapeRegex(base) + "[oa]?s?(?=[\\s,]|$)", "i").test(text);
};

const parseInput = (text) => {
  const r = { ...defaultAd };
  let remaining = text;

  // 1. Extract price (Brazilian format priority)
  const p1 = remaining.match(/R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})|\d+(?:,\d{2})|\d+)/i);
  const p2 = !p1 && remaining.match(/R\$\s*(\d+(?:\.\d{2}))/i);
  const p3 = !p1 && !p2 && remaining.match(/(\d{1,3}(?:\.\d{3})+(?:,\d{2}))/);
  const p4 = !p1 && !p2 && !p3 && remaining.match(/(\d+(?:,\d{2}))/);
  const p5 = !p1 && !p2 && !p3 && !p4 && remaining.match(/(\d+(?:\.\d{2}))/);
  const p6 = !p1 && !p2 && !p3 && !p4 && !p5 && remaining.match(/(\d{2,8})/);
  const pm = p1 || p2 || p3 || p4 || p5 || p6;
  if (pm) {
    const raw = pm[1] || pm[0];
    r.price = raw.replace(/^R\$\s*/i, "").trim();
    remaining = remaining.replace(pm[0], "");
    remaining = remaining.replace(/\s*,\s*,/g, ",").replace(/^,\s*/, "").replace(/\s*,$/, "").trim();
  }

  // 2. Extract location (city - state) BEFORE comma split
  const locMatch = remaining.match(/(?:^|,\s*)([\w\sÀ-ÿ]+)\s*[-–]\s*([A-Za-zÀ-ÿ]+)(?=\s*,|$)/);
  if (locMatch) {
    r.city = locMatch[1].trim();
    r.state = locMatch[2].trim();
    remaining = remaining.replace(locMatch[0].replace(/^,\s*/, ""), "");
    remaining = remaining.replace(/\s*,\s*,/g, ",").replace(/^,\s*/, "").replace(/\s*,$/, "").trim();
  }

  // 3. Split by comma
  const parts = remaining.split(",").map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return r;
  r.title = parts[0];

  for (let i = 1; i < parts.length; i++) {
    const raw = parts[i];
    const low = raw.toLowerCase();

    const cat = CATEGORIES.find((c) => new RegExp(wordBoundary(c.toLowerCase()), "i").test(low));
    if (cat && !r.category) { r.category = cat; continue; }

    const cond = CONDITIONS.find((c) => wordMatch(low, c));
    if (cond && !r.condition) { r.condition = cond; continue; }

    const avail = AVAILABILITIES.find((a) => wordMatch(low, a));
    if (avail && !r.availability) { r.availability = avail; continue; }

    if (!r.city && !r.state && isLocation(raw)) {
      const words = raw.split(/\s+/);
      if (words.length >= 2) {
        const last = words[words.length - 1];
        if (BRAZIL_STATES.includes(last.toUpperCase()) || STATE_NAMES.includes(last.toLowerCase())) {
          r.city = words.slice(0, -1).join(" ");
          r.state = last;
        } else {
          r.city = raw;
        }
      } else {
        r.city = raw;
      }
      continue;
    }

    r.description += (r.description ? ", " : "") + raw;
  }

  // 4. Auto-detect category from title
  if (!r.category && r.title) r.category = detectCategory(r.title);

  // 5. Clean description: remove any leftover location or known fields
  [r.city, r.state, r.title, r.price, r.condition, r.availability, r.category].filter(Boolean).forEach((f) => {
    r.description = r.description.replace(new RegExp(escapeRegex(f), "gi"), "");
    r.description = r.description.replace(/\s*,\s*,/g, ",").replace(/^,\s*/, "").replace(/\s*,$/, "").replace(/\s{2,}/g, " ").trim();
  });

  return r;
};

/* ─── Improvement data ─── */
const TITLE_PREFIXES = ["", "✨ ", "📱 ", "💎 ", "🚀 ", "⭐ ", "🎯 ", "📌 ", "🔖 "];
const DESC_APPENDS = [
  "✨ Produto bem conservado, pronto para uso",
  "👍 Não perca essa oportunidade",
  "🔥 Entre em contato e garanta o seu",
  "💎 Excelente custo-benefício",
  "⭐ Produto em ótimo estado",
  "✅ Disponível e em perfeitas condições",
  "🚀 Aproveite esta oferta imperdível",
  "🎯 Qualidade e bom negócio",
];

/* ─── Premium Character Illustration (front-facing) ─── */
function BraneScene({ state }) {
  const isWorking = state === "working";
  const isSuccess = state === "success";

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <svg className="w-full h-full" viewBox="0 0 360 520" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="sBg" cx="50%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#151120" />
            <stop offset="60%" stopColor="#0b0815" />
            <stop offset="100%" stopColor="#050308" />
          </radialGradient>
          <radialGradient id="sAmbi" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#D4A24C" stopOpacity="0.07" />
            <stop offset="60%" stopColor="#D4A24C" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#D4A24C" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sSkin" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f5e0c8" />
            <stop offset="100%" stopColor="#e8c8a8" />
          </linearGradient>
          <linearGradient id="sHair" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2e1a12" />
            <stop offset="50%" stopColor="#1c0e08" />
            <stop offset="100%" stopColor="#100805" />
          </linearGradient>
          <linearGradient id="sBlazer" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1c1428" />
            <stop offset="100%" stopColor="#0e0818" />
          </linearGradient>
          <linearGradient id="sDesk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a3038" />
            <stop offset="100%" stopColor="#221a22" />
          </linearGradient>
          <linearGradient id="sScrBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#D4A24C" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#7EC8E3" stopOpacity="0.04" />
          </linearGradient>
        </defs>

        <rect width="360" height="520" fill="url(#sBg)" />
        <rect width="360" height="520" fill="url(#sAmbi)" />

        {/* Gold ambient top glow */}
        <ellipse cx="180" cy="0" rx="240" ry="160" fill="#D4A24C" opacity="0.035" />

        {/* === CHAIR (visible behind character) === */}
        <rect x="120" y="175" width="120" height="200" rx="35" fill="#0d0a15" stroke="#1a1525" strokeWidth="0.5" />
        {/* Chair headrest */}
        <rect x="138" y="160" width="84" height="30" rx="18" fill="#0d0a15" stroke="#1a1525" strokeWidth="0.5" />
        {/* Chair gold accent */}
        <line x1="160" y1="180" x2="200" y2="180" stroke="#D4A24C" strokeWidth="0.3" opacity="0.15" />

        {/* === DESK (lighter) === */}
        <rect x="0" y="375" width="360" height="14" rx="3" fill="url(#sDesk)" />
        {/* Gold top edge */}
        <rect x="0" y="375" width="360" height="2" fill="#D4A24C" opacity="0.15" />
        {/* Desk front */}
        <rect x="5" y="389" width="350" height="131" rx="2" fill="#151018" />
        {/* Desk subtle reflection */}
        <rect x="20" y="377" width="320" height="6" fill="#D4A24C" opacity="0.04" />

        {/* === NOTEBOOK (centered on desk) === */}
        <g>
          {/* Base / bottom half */}
          <rect x="130" y="350" width="100" height="8" rx="2" fill="#181218" />
          {/* Screen lid (angled open) */}
          <path d="M134 350 L134 292 Q134 284 142 282 L218 282 Q226 284 226 292 L226 350 Z" fill="#0e0a15" stroke="#1a1528" strokeWidth="0.5" />
          {/* Screen bezel */}
          <rect x="140" y="288" width="80" height="58" rx="1.5" fill="#050408" stroke="#1a1525" strokeWidth="0.3" />
          {/* Screen glow */}
          <rect x="144" y="292" width="72" height="50" rx="1" fill="url(#sScrBg)" />
          {/* Code/data lines on screen */}
          <rect x="148" y="296" width="48" height="2" rx="0.5" fill="#D4A24C" opacity="0.22" />
          <rect x="148" y="302" width="36" height="2" rx="0.5" fill="#D4A24C" opacity="0.14" />
          <rect x="148" y="308" width="42" height="2" rx="0.5" fill="#D4A24C" opacity="0.18" />
          <rect x="148" y="314" width="28" height="2" rx="0.5" fill="#D4A24C" opacity="0.1" />
          <rect x="148" y="320" width="52" height="2" rx="0.5" fill="#D4A24C" opacity="0.2" />
          <rect x="148" y="326" width="38" height="2" rx="0.5" fill="#D4A24C" opacity="0.12" />
          <rect x="148" y="332" width="44" height="2" rx="0.5" fill="#D4A24C" opacity="0.16" />
          {/* Gold accent on notebook edge */}
          <line x1="134" y1="350" x2="226" y2="350" stroke="#D4A24C" strokeWidth="0.4" opacity="0.12" />
        </g>

        {/* === CHARACTER (front-facing) === */}
        <g>
          {/* BLAZER */}
          <path d="M146 238 Q150 226 162 224 L180 222 L198 224 Q210 226 214 238 L218 378 L142 378 Z" fill="url(#sBlazer)" />
          {/* Lapels */}
          <path d="M168 224 L180 268 L192 224" fill="#141020" stroke="#1a1530" strokeWidth="0.4" />
          {/* Gold shoulder trim */}
          <path d="M150 235 Q152 227 162 224" stroke="#D4A24C" strokeWidth="0.5" fill="none" opacity="0.18" />
          <path d="M210 235 Q208 227 198 224" stroke="#D4A24C" strokeWidth="0.5" fill="none" opacity="0.18" />

          {/* NECK */}
          <rect x="168" y="192" width="24" height="38" rx="6" fill="url(#sSkin)" />

          {/* COLLAR / blouse hint */}
          <path d="M165 228 Q170 224 180 222 Q190 224 195 228" stroke="#2a2035" strokeWidth="0.5" fill="#1a1225" opacity="0.3" />

          {/* HEAD (front view) */}
          <ellipse cx="180" cy="160" rx="32" ry="36" fill="url(#sSkin)" />

          {/* HAIR — natural dark brown, parted, falling on both sides */}
          <path d="M148 155 Q146 128 156 114 Q168 102 180 100 Q192 102 204 114 Q214 128 212 155 Q213 170 214 188 Q215 204 216 218 L212 222 Q208 208 206 192 Q204 178 203 168 Q200 156 196 150 Q190 144 180 142 Q170 144 164 150 Q160 156 157 168 Q156 178 154 192 Q152 208 148 222 L144 218 Q145 204 146 188 Q147 170 148 155 Z" fill="url(#sHair)" />
          {/* Hair behind shoulders */}
          <path d="M148 160 Q144 180 146 200 Q148 218 150 232 Q140 210 138 190 Q136 170 140 154 Q142 146 146 140 Z" fill="url(#sHair)" />
          <path d="M212 160 Q216 180 214 200 Q212 218 210 232 Q220 210 222 190 Q224 170 220 154 Q218 146 214 140 Z" fill="url(#sHair)" />
          {/* Hair shine */}
          <path d="M162 116 Q172 108 180 106 Q192 108 200 114" stroke="#4a3020" strokeWidth="1" fill="none" opacity="0.2" />
          <path d="M165 112 Q175 106 180 105" stroke="#5a4030" strokeWidth="0.7" fill="none" opacity="0.12" />

          {/* FACE — front view */}
          {/* EYES */}
          {/* Left eye */}
          <ellipse cx="168" cy="156" rx="4" ry="3" fill="white" opacity="0.15" />
          <ellipse cx="168" cy="156" rx="3" ry="2.5" fill="#1a0a25" />
          <circle cx="169" cy="155.5" r="0.9" fill="white" opacity="0.4" />
          {/* Right eye */}
          <ellipse cx="192" cy="156" rx="4" ry="3" fill="white" opacity="0.15" />
          <ellipse cx="192" cy="156" rx="3" ry="2.5" fill="#1a0a25" />
          <circle cx="193" cy="155.5" r="0.9" fill="white" opacity="0.4" />

          {/* EYEBROWS */}
          <path d="M163 150 Q168 148 173 150" stroke="#2a1815" strokeWidth="0.7" fill="none" strokeLinecap="round" />
          <path d="M187 150 Q192 148 197 150" stroke="#2a1815" strokeWidth="0.7" fill="none" strokeLinecap="round" />

          {/* EYELASHES */}
          <path d="M170 158 Q171 159 170 160" stroke="#1a0a25" strokeWidth="0.3" fill="none" />
          <path d="M190 158 Q189 159 190 160" stroke="#1a0a25" strokeWidth="0.3" fill="none" />

          {/* NOSE */}
          <path d="M180 158 Q182 160 183 163 Q184 166 182 168 Q180 169 178 168" fill="url(#sSkin)" stroke="#d4b898" strokeWidth="0.4" />
          {/* Nostrils */}
          <circle cx="177" cy="168" r="0.6" fill="#c4a888" opacity="0.4" />
          <circle cx="183" cy="168" r="0.6" fill="#c4a888" opacity="0.4" />

          {/* MOUTH — warm smile */}
          <path d="M173 176 Q180 180 187 176" stroke="#c48060" strokeWidth="0.8" fill="none" strokeLinecap="round" />
          {/* Lip fill */}
          <path d="M174 176 Q180 181 186 176" fill="#c48060" opacity="0.15" />

          {/* CHEEKS — subtle blush */}
          <ellipse cx="164" cy="168" rx="6" ry="4" fill="#e8a880" opacity="0.08" />
          <ellipse cx="196" cy="168" rx="6" ry="4" fill="#e8a880" opacity="0.08" />

          {/* EARS */}
          <path d="M147 158 Q145 154 145 158 Q145 162 147 161" stroke="#d4b898" strokeWidth="0.4" fill="url(#sSkin)" />
          <path d="M213 158 Q215 154 215 158 Q215 162 213 161" stroke="#d4b898" strokeWidth="0.4" fill="url(#sSkin)" />

          {/* Small gold earrings */}
          <circle cx="145" cy="166" r="1.5" fill="#D4A24C" opacity="0.5" />
          <circle cx="215" cy="166" r="1.5" fill="#D4A24C" opacity="0.5" />

          {/* Warm gold light on face */}
          <ellipse cx="180" cy="160" rx="22" ry="28" fill="#D4A24C" opacity="0.025" />

          {/* === ARMS (typing on notebook) === */}
          {isWorking ? (
            <>
              {/* Left arm */}
              <g className="brane-ch-arms" style={{ transformOrigin: "150px 250px" }}>
                <path d="M150 244 Q132 264 128 282 Q126 292 130 300" stroke="url(#sBlazer)" strokeWidth="8" strokeLinecap="round" fill="none">
                  <animateTransform attributeName="transform" type="rotate" values="-1 150 250;1 150 250;-1 150 250" dur="0.8s" repeatCount="indefinite" />
                </path>
                <ellipse cx="130" cy="302" rx="7" ry="4.5" fill="url(#sSkin)">
                  <animateTransform attributeName="transform" type="rotate" values="-1 130 302;1 130 302;-1 130 302" dur="0.8s" repeatCount="indefinite" />
                </ellipse>
              </g>
              {/* Right arm */}
              <g className="brane-ch-arms" style={{ transformOrigin: "210px 250px" }}>
                <path d="M210 244 Q228 264 232 282 Q234 292 230 300" stroke="url(#sBlazer)" strokeWidth="8" strokeLinecap="round" fill="none">
                  <animateTransform attributeName="transform" type="rotate" values="1 210 250;-1 210 250;1 210 250" dur="0.8s" repeatCount="indefinite" />
                </path>
                <ellipse cx="230" cy="302" rx="7" ry="4.5" fill="url(#sSkin)">
                  <animateTransform attributeName="transform" type="rotate" values="1 230 302;-1 230 302;1 230 302" dur="0.8s" repeatCount="indefinite" />
                </ellipse>
              </g>
            </>
          ) : isSuccess ? (
            <>
              {/* Left arm raised */}
              <path d="M150 244 Q132 224 128 208" stroke="url(#sBlazer)" strokeWidth="8" strokeLinecap="round" fill="none" />
              <ellipse cx="127" cy="206" rx="7" ry="4.5" fill="url(#sSkin)" />
              {/* Right arm raised */}
              <path d="M210 244 Q228 224 232 208" stroke="url(#sBlazer)" strokeWidth="8" strokeLinecap="round" fill="none" />
              <ellipse cx="233" cy="206" rx="7" ry="4.5" fill="url(#sSkin)" />
            </>
          ) : (
            <>
              {/* Left arm resting */}
              <path d="M150 244 Q135 264 132 278 Q130 288 134 296" stroke="url(#sBlazer)" strokeWidth="8" strokeLinecap="round" fill="none" />
              <ellipse cx="134" cy="298" rx="7" ry="4.5" fill="url(#sSkin)" />
              {/* Right arm resting */}
              <path d="M210 244 Q225 264 228 278 Q230 288 226 296" stroke="url(#sBlazer)" strokeWidth="8" strokeLinecap="round" fill="none" />
              <ellipse cx="226" cy="298" rx="7" ry="4.5" fill="url(#sSkin)" />
            </>
          )}
        </g>

        {/* Screen ambient light on face */}
        <ellipse cx="180" cy="185" rx="25" ry="20" fill="#D4A24C" opacity="0.015" />

        {/* === SUCCESS PARTICLES === */}
        {isSuccess && [0, 1, 2, 3, 4, 5].map((i) => (
          <circle key={i} cx={155 + i * 18} cy={135 + (i % 3) * 15} r={1.8 + (i % 2) * 0.5} fill="#D4A24C" className="brane-ch-particle" style={{ animationDelay: `${i * 0.1}s` }} />
        ))}
      </svg>
    </div>
  );
}

/* ─── Clickable Card ─── */
function ClickableCard({ label, selected, onClick, icon }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-3 w-full p-3 rounded-2xl border text-sm font-bold transition-all duration-200 ${
        selected
          ? "border-[#D4A24C] bg-[#D4A24C]/15 text-[#F1D28A] shadow-[0_0_20px_rgba(212,162,76,0.12)]"
          : "border-white/10 bg-white/[0.04] text-[#C9CBD6] hover:bg-white/[0.08] hover:border-white/20"
      }`}>
      {icon && <span className="text-base">{icon}</span>}
      <span>{label}</span>
      {selected && <Check size={15} className="ml-auto text-[#D4A24C]" />}
    </button>
  );
}

/* ─── Feed-style Preview Card ─── */
function PreviewCard({ ad, images }) {
  const cover = images?.[0] || ad.photos?.[0] || "";
  const p = ad;

  return (
    <div className="brane-card-premium overflow-hidden rounded-2xl border border-[#D4A24C]/25"
      style={{ background: "linear-gradient(180deg, rgba(212,162,76,0.06), rgba(10,10,15,0.92))" }}>
      {cover ? (
        <img src={cover} alt="" className="w-full aspect-square object-cover" />
      ) : (
        <div className="w-full aspect-square bg-[#0B0D12] flex items-center justify-center">
          <Camera size={36} className="text-[#6F7280]" />
        </div>
      )}
      <div className="p-3.5 space-y-2">
        {p.category && (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#D4A24C]/15 text-[#D4A24C] border border-[#D4A24C]/30 leading-none">
            {p.category}
          </span>
        )}
        <h3 className="text-sm font-black text-white leading-tight">{p.title || "Título do anúncio"}</h3>
        {p.price && <p className="brane-gold-text text-lg font-black">R$ {p.price}</p>}
        {(p.city || p.state) && (
          <p className="text-[11px] text-[#8C8F9A]">📍 {[p.city, p.state].filter(Boolean).join(" - ")}</p>
        )}
        <div className="flex flex-wrap gap-1">
          {p.condition && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#5B1CB5]/20 text-[#7C3AED] border border-[#5B1CB5]/30 leading-none">{p.condition}</span>
          )}
          {p.availability && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#10A875]/15 text-[#10A875] border border-[#10A875]/30 leading-none">{p.availability}</span>
          )}
        </div>
        {p.description && (
          <p className="text-[11px] text-[#A6A8B3] leading-relaxed line-clamp-3">{p.description}</p>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function AIAssistantPanelSocial({
  onPhotoUpload = () => {},
  onGenerateAd = () => {},
  onImproveAd = () => {},
  onGenerateNew = () => {},
  onFillForm = () => {},
  onPublishAd = () => {},
  generatedAd = null,
  isGenerating = false
}) {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState("");
  const [localAd, setLocalAd] = useState(defaultAd);
  const [braneState, setBraneState] = useState("idle");
  const [messages, setMessages] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [contactPhone, setContactPhone] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");
  const [improveCount, setImproveCount] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");

  const fileRef = useRef(null);
  const endRef = useRef(null);
  const mobileEndRef = useRef(null);
  const initialized = useRef(false);
  const originalDescRef = useRef("");

  const ad = generatedAd || localAd;
  const hasAd = safe(ad.title) || safe(ad.price);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      setMessages([{ id: 1, from: "ai",
        text: "Escreva os dados do seu anúncio separados por vírgula.\n\nExemplo:\niPhone 12 Pro, R$1200, Belém Pará, em perfeito estado, celular usado completo com acessórios"
      }]);
    }
  }, []);

  useEffect(() => {
    const el = window.innerWidth >= 768 ? endRef.current : mobileEndRef.current;
    el?.scrollIntoView({ behavior: "smooth" });
  }, [messages, step]);

  const addMsg = useCallback((text, from = "ai") => {
    setMessages((prev) => [...prev, { id: Date.now(), from, text }]);
  }, []);

  const handleSubmitInput = async () => {
    const text = safe(input);
    if (!text) return;
    addMsg(text, "user");
    setInput("");
    setBraneState("working");
    await new Promise((r) => setTimeout(r, 1800));
    const parsed = parseInput(text);
    setLocalAd(parsed);
    originalDescRef.current = safe(parsed.description);
    setBraneState("idle");
    setStep(1);
  };

  const handleReviewContinue = () => {
    const needsCondition = !safe(ad.condition);
    const needsAvailability = !safe(ad.availability);
    if (needsCondition) { setStep(2); return; }
    if (needsAvailability) { setStep(3); return; }
    setStep(4);
  };

  const handleRetype = () => { setStep(0); setLocalAd(defaultAd); addMsg("Digite novamente:"); };

  const handleSelectCondition = (cond) => {
    setLocalAd((prev) => ({ ...prev, condition: cond }));
    setStep(!safe(ad.availability) ? 3 : 4);
  };

  const handleSelectAvailability = (avail) => {
    setLocalAd((prev) => ({ ...prev, availability: avail }));
    setStep(4);
  };

  const handleContactChoice = (choice) => {
    if (choice === "skip") {
      setContactPhone(""); setContactWhatsapp("");
      setLocalAd((prev) => ({ ...prev, phone: "", whatsapp: "" }));
      setStep(5);
    } else setStep(7);
  };

  const handleContactDone = () => {
    setLocalAd((prev) => ({ ...prev, phone: safe(contactPhone), whatsapp: safe(contactWhatsapp) }));
    setStep(5);
  };

  const handlePhotoSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    await onPhotoUpload(files);
    const previews = await Promise.all(
      files.slice(0, 5).map((f) => new Promise((resolve) => {
        const r2 = new FileReader();
        r2.onload = () => resolve(r2.result);
        r2.readAsDataURL(f);
      }))
    );
    setPhotoPreviews(previews);
    setStep(6);
  };

  const handleImprove = async () => {
    if (!ad) return;
    setBraneState("working");
    await new Promise((r) => setTimeout(r, 1800));
    const prefixIdx = improveCount % TITLE_PREFIXES.length;
    const prefix = TITLE_PREFIXES[prefixIdx];
    const rawTitle = safe(ad.title).replace(/^vendo\s+/i, "").replace(/^[✨📱💎🚀⭐🎯📌🔖]\s*/, "");
    const newTitle = prefix ? `${prefix}${rawTitle}` : rawTitle;
    const appendIdx = improveCount % DESC_APPENDS.length;
    const suffix = DESC_APPENDS[appendIdx];
    const base = originalDescRef.current || safe(ad.description);
    const newDesc = base ? `${base} ${suffix}` : suffix;
    setImproveCount((c) => c + 1);
    const improved = { ...ad, title: newTitle, description: newDesc };
    setLocalAd(improved);
    onImproveAd(improved);
    onFillForm(improved);
    setBraneState("idle");
  };

  const handlePublish = async () => {
    if (!ad || publishing) return;
    setBraneState("working");
    setPublishing(true);
    setPublishError("");
    try {
      const ok = await onPublishAd({ ...ad, photos: photoPreviews });
      if (ok) {
        setBraneState("success");
      } else {
        setBraneState("idle");
        setPublishError("Não foi possível publicar. Verifique os dados e tente novamente.");
        addMsg("Erro ao publicar. Verifique título, preço e condição do produto.", "ai");
      }
    } catch (err) {
      console.error("Publish error:", err);
      setBraneState("idle");
      setPublishError("Erro de conexão. Tente novamente.");
      addMsg("Erro de conexão ao publicar. Verifique sua internet e tente novamente.", "ai");
    } finally {
      setPublishing(false);
    }
  };

  const handleNew = () => {
    setStep(0); setInput(""); setLocalAd(defaultAd);
    setPhotoPreviews([]); setContactPhone(""); setContactWhatsapp("");
    setBraneState("idle"); setMessages([]);
    initialized.current = false; originalDescRef.current = "";
    onGenerateNew();
  };

  /* ─── CENTER: Render step content ─── */
  const renderStepContent = () => {
    switch (step) {
      case 0: return null;
      case 1:
        return (
          <div className="rounded-2xl border border-[#D4A24C]/30 p-3.5 space-y-2 brane-fade-in"
            style={{ background: "linear-gradient(135deg, rgba(212,162,76,0.12), rgba(212,162,76,0.03))" }}>
            <p className="text-xs font-black brane-gold-text mb-1">✨ Dados identificados</p>
            {[{ label: "📌", value: ad.title }, { label: "💰", value: ad.price ? `R$ ${ad.price}` : "" }, { label: "📂", value: ad.category }, { label: "📍", value: ad.city }, { label: "🏷️", value: ad.condition }, { label: "📝", value: ad.description }]
              .filter((f) => safe(f.value))
              .map((f) => (
                <div key={f.label} className="flex items-start gap-2">
                  <span className="text-[10px] text-[#8C8F9A] min-w-[24px]">{f.label}</span>
                  <span className="text-sm text-white">{f.value}</span>
                </div>
              ))}
            <div className="flex gap-2 mt-2">
              <button type="button" onClick={handleReviewContinue} className="flex-1 brane-btn-gold py-2 text-xs font-bold">✓ Continuar</button>
              <button type="button" onClick={handleRetype} className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] py-2 text-xs font-bold text-[#A6A8B3] hover:bg-white/[0.08]">Redigitar</button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-1.5 brane-fade-in">
            <p className="text-xs font-black brane-gold-text mb-1">Qual a condição?</p>
            {CONDITIONS.map((c) => (
              <ClickableCard key={c} label={c} selected={localAd.condition === c} onClick={() => handleSelectCondition(c)}
                icon={c === "Novo" ? "🆕" : c === "Seminovo" ? "✨" : c === "Usado" ? "🔄" : "🔧"} />
            ))}
          </div>
        );
      case 3:
        return (
          <div className="space-y-1.5 brane-fade-in">
            <p className="text-xs font-black brane-gold-text mb-1">Disponibilidade?</p>
            {AVAILABILITIES.map((a) => (
              <ClickableCard key={a} label={a} selected={localAd.availability === a} onClick={() => handleSelectAvailability(a)}
                icon={a === "Item único" ? "📦" : a === "Várias unidades" ? "📦📦" : a === "Sob demanda" ? "📋" : "🔧"} />
            ))}
          </div>
        );
      case 4:
        return (
          <div className="space-y-1.5 brane-fade-in">
            <p className="text-xs font-black brane-gold-text mb-1">Adicionar contato?</p>
            <p className="text-[10px] text-[#8C8F9A] mb-1">Só aparece após "Entrar em contato"</p>
            <ClickableCard label="Telefone" icon="📞" onClick={() => { setStep(7); setContactWhatsapp(""); }} />
            <ClickableCard label="WhatsApp" icon="💬" onClick={() => { setStep(7); setContactPhone(""); }} />
            <ClickableCard label="Telefone e WhatsApp" icon="📱" onClick={() => setStep(7)} />
            <ClickableCard label="Continuar sem contato" icon="⏭️" onClick={() => handleContactChoice("skip")} />
          </div>
        );
      case 7:
        return (
          <div className="space-y-2 brane-fade-in">
            <p className="text-xs font-black brane-gold-text">Digite seu contato</p>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 p-2.5">
              <Phone size={14} className="text-[#D4A24C]" />
              <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
                placeholder="Telefone" className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#6F7280]" />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 p-2.5">
              <MessageSquare size={14} className="text-[#25D366]" />
              <input value={contactWhatsapp} onChange={(e) => setContactWhatsapp(e.target.value)}
                placeholder="WhatsApp" className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#6F7280]" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handleContactDone} className="flex-1 brane-btn-gold py-2 text-xs font-bold">✓ Confirmar</button>
              <button type="button" onClick={() => handleContactChoice("skip")}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-[#A6A8B3] hover:bg-white/[0.08]">Pular</button>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="brane-fade-in text-center">
            <p className="text-xs font-black brane-gold-text mb-2">Envie uma foto</p>
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full max-w-[220px] mx-auto rounded-2xl border-2 border-dashed border-[#D4A24C]/30 py-10 flex flex-col items-center justify-center gap-2 text-[#C9CBD6] hover:border-[#D4A24C]/60 hover:bg-[#D4A24C]/5 transition-all cursor-pointer">
              <Camera size={28} className="text-[#D4A24C]/60" />
              <span className="text-sm font-bold">Clique para enviar</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
          </div>
        );
      default: return null;
    }
  };

  return (
    <>
      {/* ════════════════════════════════════════════════ */}
      {/* DESKTOP — 3-column layout (unchanged)           */}
      {/* ════════════════════════════════════════════════ */}
      <div className="hidden md:flex md:flex-row h-full w-full md:rounded-[24px] overflow-hidden bg-[#08060d]"
        style={{ boxShadow: "0 0 80px rgba(212,162,76,0.05), inset 0 0 60px rgba(212,162,76,0.02)" }}>
        {/* LEFT: Character */}
        <div className="w-[25%] min-w-[180px] max-w-[280px] relative flex flex-col flex-shrink-0"
          style={{ background: "linear-gradient(180deg, rgba(212,162,76,0.02), rgba(10,8,15,1))" }}>
          <div className="absolute top-0 left-0 right-0 h-48 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 30% 0%, rgba(212,162,76,0.06), transparent 60%)" }} />
          <div className="flex-1 flex items-end justify-center">
            <div className="w-full h-[82%]">
              <BraneScene state={braneState} />
            </div>
          </div>
        </div>

        {/* CENTER: Chat */}
        <div className="flex-1 flex flex-col min-w-0 max-w-[55%] border-r border-white/[0.03]">
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/[0.04] flex-shrink-0">
            <div className="flex items-center gap-2">
              <img src="/logo-belivre.png" alt="B Livre" className="w-6 h-6 rounded-lg object-cover ring-1 ring-[#D4A24C]/30" />
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] brane-gold-text">B Livre</span>
            </div>
            {step > 0 && (
              <button type="button" onClick={handleNew} className="text-[9px] font-bold text-[#6F7280] hover:text-[#D4A24C] transition-colors">✨ Novo</button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2.5 scrollbar-thin min-h-0">
            {messages.map((m) => (
              <div key={m.id}
                className={`rounded-2xl px-3.5 py-2 text-sm max-w-[80%] ${
                  m.from === "user"
                    ? "ml-auto bg-[#D4A24C] text-black"
                    : "mr-auto bg-white/10 text-white"
                }`}>
                <span className="whitespace-pre-wrap">{m.text}</span>
              </div>
            ))}
            {renderStepContent()}
            <div ref={endRef} />
          </div>
          <div className="flex-shrink-0 px-5 py-3 border-t border-white/[0.04]">
            <div className="flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmitInput()}
                placeholder={step === 0 ? "iPhone 12 Pro, R$1200, Belém Pará, em perfeito estado..." : "Digite para editar o anúncio..."}
                className="h-10 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-sm text-white outline-none focus:border-[#D4A24C]/40 focus:shadow-[0_0_12px_rgba(212,162,76,0.06)] placeholder:text-[#6F7280]" />
              <button type="button" onClick={handleSubmitInput} disabled={!safe(input)}
                className="h-10 brane-btn-gold px-3.5 text-[12px] disabled:opacity-50">
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Preview + Actions */}
        <div className="w-[25%] min-w-[180px] max-w-[300px] flex-shrink-0 flex flex-col p-4"
          style={{ background: "linear-gradient(180deg, rgba(212,162,76,0.02), rgba(10,8,15,1))" }}>
          <div className="flex-shrink-0 mb-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#6F7280]">Prévia do anúncio</p>
          </div>
          {hasAd ? (
            <div className="flex-1 overflow-y-auto scrollbar-thin space-y-3">
              <PreviewCard ad={ad} images={photoPreviews} />
              {step === 6 && (
                <div className="space-y-2 pt-1">
                  <button type="button" onClick={handleImprove} disabled={!ad || isGenerating || publishing}
                    className="w-full rounded-xl border border-[#D4A24C]/30 bg-[#D4A24C]/10 py-2.5 text-xs font-bold text-[#F1D28A] hover:bg-[#D4A24C]/20 disabled:opacity-50 transition-all">
                    <Sparkles size={13} className="inline mr-1.5" />Melhorar anúncio
                  </button>
                  <button type="button" onClick={handlePublish} disabled={!ad || isGenerating || publishing}
                    className="w-full brane-btn-gold py-2.5 text-xs font-bold disabled:opacity-50">
                    {publishing ? "⏳ Publicando..." : "Publicar agora"}
                  </button>
                  {publishError && (
                    <p className="text-[10px] text-red-400 text-center">{publishError}</p>
                  )}
                  <button type="button" onClick={handleNew} disabled={publishing}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-xs font-bold text-[#A6A8B3] hover:bg-white/[0.08]">
                    ✨ Novo anúncio
                  </button>
                </div>
              )}
              {step > 0 && step < 6 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${step > 0 ? 'bg-[#D4A24C]' : 'bg-[#3a3a45]'}`} />
                    <div className={`w-1.5 h-1.5 rounded-full ${step > 1 ? 'bg-[#D4A24C]' : 'bg-[#3a3a45]'}`} />
                    <div className={`w-1.5 h-1.5 rounded-full ${step > 2 ? 'bg-[#D4A24C]' : 'bg-[#3a3a45]'}`} />
                    <div className={`w-1.5 h-1.5 rounded-full ${step > 3 ? 'bg-[#D4A24C]' : 'bg-[#3a3a45]'}`} />
                    <div className={`w-1.5 h-1.5 rounded-full ${step > 4 ? 'bg-[#D4A24C]' : 'bg-[#3a3a45]'}`} />
                    <div className={`w-1.5 h-1.5 rounded-full ${step > 5 ? 'bg-[#D4A24C]' : 'bg-[#3a3a45]'}`} />
                  </div>
                  <p className="text-[9px] text-[#6F7280]">Preenchendo dados...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Camera size={32} className="mx-auto text-[#3a3a45] mb-2" />
                <p className="text-[11px] text-[#6F7280]">Digite os dados no chat<br />para ver a prévia</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════ */}
      {/* MOBILE — own layout, independent from desktop   */}
      {/* ════════════════════════════════════════════════ */}
      <div className="brane-ad-mobile flex md:hidden flex-col bg-[#08060d]" style={{ height: '100%' }}>
        <style>{`@media(max-width:767px){
.brane-ad-mobile{display:flex!important;flex-direction:column!important;height:100%!important;overflow:hidden!important}
.brane-ad-mobile .brane-ad-chat{flex:1!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important}
.brane-ad-mobile .brane-ad-input{flex-shrink:0!important;border-top:1px solid rgba(255,255,255,0.04);background:#08060d}
}`}</style>
        {/* Tutorial card */}
        <div className="flex-shrink-0 px-4 pt-2.5 pb-0.5">
          <div className="rounded-xl border border-[#D4A24C]/20 bg-[#D4A24C]/6 p-2.5">
            <p className="text-xs text-white/85 leading-relaxed">
              Escreva os dados do seu anúncio separados por vírgula.
            </p>
            <p className="text-[10px] text-[#D4A24C]/70 mt-1 font-medium">
              Ex: iPhone 12 Pro, R$1200, Belém Pará, em perfeito estado
            </p>
          </div>
          <div className="flex justify-center -mt-1">
            <div className="w-8 h-8 opacity-30">
              <BraneScene state={braneState} />
            </div>
          </div>
        </div>

        {/* Scrollable chat */}
        <div className="brane-ad-chat px-4 py-1.5 space-y-2.5">
          {messages.slice(1).map((m) => (
            <div key={m.id}
              className={`rounded-2xl px-3 py-2 text-sm max-w-[85%] ${
                m.from === "user"
                  ? "ml-auto bg-[#D4A24C] text-black"
                  : "mr-auto bg-white/10 text-white"
              }`}>
              <span className="whitespace-pre-wrap leading-relaxed">{m.text}</span>
            </div>
          ))}
          {renderStepContent()}

          {hasAd && (
            <div className="space-y-2.5 pt-0.5">
              <PreviewCard ad={ad} images={photoPreviews} />
              {step === 6 && (
                <div className="space-y-2">
                  <button type="button" onClick={handleImprove} disabled={!ad || isGenerating || publishing}
                    className="w-full rounded-xl border border-[#D4A24C]/30 bg-[#D4A24C]/10 py-2.5 text-sm font-bold text-[#F1D28A] hover:bg-[#D4A24C]/20 disabled:opacity-50 transition-all active:scale-[0.98]">
                    <Sparkles size={14} className="inline mr-1.5" />Melhorar anúncio
                  </button>
                  <button type="button" onClick={handlePublish} disabled={!ad || isGenerating || publishing}
                    className="w-full brane-btn-gold py-2.5 text-sm font-bold disabled:opacity-50 active:scale-[0.98]">
                    {publishing ? "⏳ Publicando..." : "Publicar agora"}
                  </button>
                  {publishError && <p className="text-[10px] text-red-400 text-center">{publishError}</p>}
                  <button type="button" onClick={handleNew} disabled={publishing}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-sm font-bold text-[#A6A8B3] hover:bg-white/[0.08] active:scale-[0.98]">
                    ✨ Novo anúncio
                  </button>
                </div>
              )}
            </div>
          )}

          {step > 0 && step < 6 && (
            <button type="button" onClick={handleNew}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-sm font-bold text-[#A6A8B3] hover:bg-white/[0.08] active:scale-[0.98]">
              ✨ Novo anúncio
            </button>
          )}

          <div ref={mobileEndRef} />
        </div>

        {/* Input bar */}
        <div className="brane-ad-input flex-shrink-0 px-4 py-2.5">
          <div className="flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmitInput()}
              placeholder={step === 0 ? "iPhone 12 Pro, R$1200, Belém Pará, em perfeito estado..." : "Digite para editar o anúncio..."}
              className="h-10 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none focus:border-[#D4A24C]/40 focus:shadow-[0_0_12px_rgba(212,162,76,0.06)] placeholder:text-[#6F7280]" />
            <button type="button" onClick={handleSubmitInput} disabled={!safe(input)}
              className="h-10 brane-btn-gold px-3.5 text-sm disabled:opacity-50 active:scale-[0.98]">
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
