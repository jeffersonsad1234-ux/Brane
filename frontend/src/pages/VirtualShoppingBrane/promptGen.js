// ─── INTELLIGENT PROMPT GENERATOR ─────────────────────
// Keywords → structured output. No API needed.

const GENRES = {
  fps: ["FPS", "tiro", "shooter", "first person", "tiro em primeira", "arma", "gun", "battle"],
  survival: ["survival", "sobrevivência", "sobrevivencia", "craft", "construir", "recursos", "fome", "hunger", "coletar"],
  rpg: ["rpg", "rôlego", "roleplay", "nível", "level", "xp", "experiência", "experiencia", "skill", "árvore de habilidade"],
  openworld: ["open world", "mundo aberto", "livre", "exploração", "exploracao", "mapa grande", "sandbox"],
  horror: ["terror", "horror", "zumbi", "zombie", "assustador", "scary", "dark", "escuro", "sombrio"],
  racing: ["corrida", "racing", "carro", "vehicle", "velocidade", "speed", "drift", "pista", "track"],
  platform: ["plataforma", "platformer", "puzzle", "quebra-cabeça", "quebra cabeca", "2d"],
  strategy: ["estratégia", "estrategia", "strategy", "rts", "base", "construção", "construcao", "gerenciamento"],
  battleRoyale: ["battle royale", "br", "100 jogadores", "último", "ultimo", "circle", "zona"],
  mmo: ["mmo", "mmorpg", "online", "multijogador", "multiplayer", "servidor", "guilda"],
};

const STYLES = {
  realistic: ["realista", "realistic", "fotorrealista", "photorealistic", "4k", "hd"],
  pixel: ["pixel", "8bit", "16bit", "retro", "retrô", "oldschool", "old school"],
  lowpoly: ["low poly", "lowpoly", "poligonal", "polygonal", "minimalista"],
  cartoon: ["cartoon", "animado", "toon", "stylized", "estilizado", "colorido"],
  dark: ["dark", "sombrio", "sombrio", "gótico", "gothic", "cyberpunk", "neon"],
  anime: ["anime", "manga", "japonês", "japones", "cel shading"],
};

const PLATFORMS = {
  pc: ["pc", "desktop", "computador", "windows", "steam"],
  mobile: ["mobile", "celular", "android", "ios", "smartphone", "tablet"],
  console: ["console", "playstation", "xbox", "nintendo", "ps5"],
  web: ["web", "navegador", "browser", "html5"],
};

// ─── DETECT FEATURES ───────────────────────────────────
function detectKeywords(text, map) {
  const t = text.toLowerCase();
  for (const [key, keywords] of Object.entries(map)) {
    for (const kw of keywords) {
      if (t.includes(kw.toLowerCase())) return key;
    }
  }
  return null;
}

function detectAll(text, map) {
  const t = text.toLowerCase();
  const results = new Set();
  for (const [key, keywords] of Object.entries(map)) {
    for (const kw of keywords) {
      if (t.includes(kw.toLowerCase())) results.add(key);
    }
  }
  return results.size > 0 ? [...results] : ["general"];
}

// ─── TEMPLATES ─────────────────────────────────────────
const ARCH = {
  fps: "Motor 3D com câmera em primeira pessoa, sistema de armas (raycast/projectile), IA de inimigos com árvore de comportamento, física de colisão e networking via WebSocket.",
  survival: "ECS-based engine com sistemas de mundo procedural (terreno, biomas, clima), inventário, crafting, nutrição (fome/sede), construção e ciclo dia/noite.",
  rpg: "Data-driven engine com sistemas de stats, skills, árvore de talentos, quests (estado-based), diálogo em árvore, loot tables e salvamento em JSON.",
  horror: "Motor de render com iluminação volumétrica, sistema de sombra dinâmico, IA de detecção por audição/visão, sanity system e geração procedural de mapas.",
  openworld: "Streaming world engine com carregamento de chunks, LOD procedural, sistema de fauna/flora, clima dinâmico e pontos de interesse gerados por noise.",
  racing: "Motor de física veicular (suspensão/colisão/derrapagem), sistema de track procedural, multiplayer com sincronização de estado e replay system.",
  platform: "Motor 2D/3D com física de pulo preciso, sistema de colisão por tile, câmera cinematic, checkpoint system e geração procedural de fases.",
  strategy: "Sistema de malha (grid) com pathfinding A*, IA econômica baseada em FSM, sistema de fog-of-war e multiplayer com sincronização determinística.",
  battleRoyale: "Servidor dedicado com 100+ players, matchmaking por elo, sistema de zona letal (circle), loot procedural e anti-cheat básico.",
  mmo: "Arquitetura cliente-servidor com sharding, banco de dados Redis para cache, sistema de guildas, economia baseada em servidor e suporte a modding.",
  general: "Engine modular com render separado, física, áudio, inputs e networking. Suporte a plugins e scripting via Lua/JavaScript.",
};

const ROADMAPS = {
  fps: [
    "Configurar motor 3D e câmera FPS",
    "Implementar armas (disparo, recarga, troca)",
    "Criar IA de inimigos (patrulha, perseguição, ataque)",
    "Sistema de dano, vida e morte",
    "HUD: mira, vida, munição, minimapa",
    "Mapas com cover, spawn points e objetivos",
    "Multiplayer: lobby, matchmaking, sincronização",
    "Testes de gameplay e balanceamento",
    "Polimento: efeitos, som, UI",
    "Deploy e publicação",
  ],
  survival: [
    "Motor de mundo procedural com biomas",
    "Sistema de jogador: vida, fome, sede, energia",
    "Inventário com slots e crafting",
    "Construção de estruturas (paredes, portas, telhados)",
    "Ciclo dia/noite com iluminação dinâmica",
    "Recursos naturais: madeira, pedra, metal, comida",
    "Fauna: animais caçáveis e hostis",
    "Sistema de estações e clima",
    "Save/Load do mundo e inventário",
    "Polimento e balancing",
  ],
  rpg: [
    "Criação de personagem (classe, raça, atributos)",
    "Sistema de stats e progressão de nível",
    "Árvore de habilidades e talentos",
    "Sistema de quests com diálogo",
    "Loot, equipamentos e inventário",
    "NPCs com IA de rotina e comércio",
    "Bestiário e sistema de combate",
    "Mapa interativo com marcadores",
    "Sistema de facções e reputação",
    "História principal + side quests",
  ],
  openworld: [
    "Gerador de terreno procedural (noise + biomas)",
    "Sistema de chunks com loading dinâmico",
    "Vegetação, rochas e recursos naturais",
    "Fauna: animais selvagens e domesticáveis",
    "Clima dinâmico: chuva, neve, vento",
    "Ciclo dia/noite com céu estrelado",
    "Mapa-múndi com revelação por exploração",
    "Vilas, cidades e pontos de interesse",
    "Missões espalhadas pelo mundo",
    "Veículos e montarias",
  ],
  general: [
    "Configuração do projeto e engine base",
    "Implementar render, câmera e inputs",
    "Criar sistemas de física e colisão",
    "Adicionar áudio e efeitos sonoros",
    "Implementar UI/HUD base",
    "Criar sistema de salvamento",
    "Adicionar cenário/demo jogável",
    "Testes de performance e estabilidade",
    "Polimento visual e otimização",
    "Publicação e distribuição",
  ],
};

const CHECKLISTS = {
  fps: [
    "[ ] Câmera FPS com mouse look + sensibilidade ajustável",
    "[ ] Sistema de armas: dano, recarga, alcance, munição",
    "[ ] IA inimiga: patrulha, estado de alerta, perseguição, combate",
    "[ ] HUD: crosshair, vida, munição, granadas, killfeed",
    "[ ] Mapas com geometria, spawn points e objetivos",
    "[ ] Efeitos: partículas de tiro, sangue, impacto, sombra",
    "[ ] Multiplayer básico: 2-8 jogadores, lobby, servidor dedicado",
    "[ ] Sistema de dano: headshot, armadura, cura",
    "[ ] Menu: configurações, seleção de mapa, loadout",
    "[ ] Polimento: VFX, SFX, minimapa, scoreboard",
  ],
  survival: [
    "[ ] Terreno procedural com biomas (floresta, deserto, montanha, água)",
    "[ ] Inventário: 20+ slots, crafting, drop, coleta",
    "[ ] Stats: vida, fome, sede, energia, temperatura",
    "[ ] Construção: paredes, portas, telhados, escadas, mobília",
    "[ ] Ciclo dia/noite com iluminação dinâmica",
    "[ ] Recursos: madeira, pedra, minério, comida, água",
    "[ ] Animais: passivos (caça) e hostis (lobo, urso)",
    "[ ] Clima: chuva, tempestade, neve, vento",
    "[ ] Save/Loot: mundo, inventário, construções",
    "[ ] Crafting: ferramentas, armas, armaduras, itens",
  ],
  general: [
    "[ ] Configuração do ambiente de desenvolvimento",
    "[ ] Estrutura de projeto modular",
    "[ ] Render, câmera e inputs configurados",
    "[ ] Física e colisão básicas",
    "[ ] Sistema de áudio (SFX, música, ambiente)",
    "[ ] UI/HUD funcional",
    "[ ] Save/Load state",
    "[ ] Mundo/cenário demonstrativo",
    "[ ] Performance otimizada (60fps)",
    "[ ] Build e deploy",
  ],
};

const ASSET_LISTS = {
  fps: ["Armas (pistola, rifle, shotgun, sniper)", "Modelos de inimigos (3-5 tipos)", "Mapas (3+ cenários)", "Texturas de armas e cenário", "Efeitos (tiro, explosão, sangue, fumaça)", "Áudio (tiros, passos, impacto, ambiente)", "UI (crosshair, HUD, menus, minimapa)"],
  survival: ["Terreno procedural (biomas, árvores, rochas)", "Modelos de construções (paredes, portas, telhados)", "Recursos (madeira, pedra, minério, comida)", "Animais (3+ espécies)", "Itens (ferramentas, armas, armaduras, comidas)", "UI (inventário, crafting, HUD, mapa)", "Áudio (ambiente, passos, coleta, construção)"],
  general: ["Modelos 3D base", "Texturas (terreno, objetos, UI)", "Áudio (SFX, música, ambiente)", "UI/HUD elements", "Ícones e sprites", "Efeitos visuais (partículas, luzes)"],
};

const PROMPTS = {
  fps: [
    "Crie um sistema de armas FPS com raycast, recarga, troca e diferentes tipos de munição.",
    "Implemente IA de inimigos com patrulha, alerta, perseguição e combate em equipe.",
    "Gere HUD de FPS com vida, munição, granadas, killfeed e minimapa.",
    "Crie mapas multiplayer com spawn points, cover e objetivos.",
    "Implemente sistema de dano com headshot, armadura e cura.",
  ],
  survival: [
    "Crie terreno procedural com biomas usando domain warped noise.",
    "Implemente inventário com slots, crafting, drop e coleta de recursos.",
    "Gere sistema de nutrição: vida, fome, sede, energia e temperatura.",
    "Crie sistema de construção com snapped grid e preview.",
    "Implemente ciclo dia/noite com iluminação dinâmica e clima.",
  ],
  general: [
    "Configure motor 3D com render, câmera e sistema de inputs.",
    "Implemente física básica com gravidade, colisão e movimento.",
    "Crie sistema de áudio com SFX, música ambiente e efeitos 3D.",
    "Implemente UI/HUD com menus, barras de status e feedback visual.",
    "Crie sistema de salvamento do estado do jogo em localStorage.",
  ],
};

// ─── MAIN GENERATOR ────────────────────────────────────
export function generateProject(promptText) {
  const text = promptText || "";
  const genre = detectKeywords(text, GENRES) || "general";
  const style = detectKeywords(text, STYLES) || "realistic";
  const platform = detectKeywords(text, PLATFORMS) || "pc";
  const features = detectAll(text, { ...GENRES, ...STYLES });

  const roadmap = ROADMAPS[genre] || ROADMAPS.general;
  const checklist = CHECKLISTS[genre] || CHECKLISTS.general;
  const architecture = ARCH[genre] || ARCH.general;
  const assetList = ASSET_LISTS[genre] || ASSET_LISTS.general;
  const promptList = PROMPTS[genre] || PROMPTS.general;

  const nameSuggestions = [
    `${genre.charAt(0).toUpperCase() + genre.slice(1)}Quest`,
    `Project ${genre.charAt(0).toUpperCase() + genre.slice(1)}`,
    genre === "survival" ? "WildCraft" :
    genre === "fps" ? "FireStrike" :
    genre === "rpg" ? "EternalQuest" :
    genre === "horror" ? "DarkRealm" :
    genre === "openworld" ? "InfiniteWilds" :
    genre === "racing" ? "TurboDrive" :
    genre === "battleRoyale" ? "LastStand" :
    genre === "mmo" ? "UniverseOnline" :
    "NewGame",
  ];

  return {
    type: genre,
    style,
    platform,
    features,
    name: nameSuggestions[0],
    nameSuggestions,
    roadmap,
    architecture,
    checklist,
    assets: assetList,
    prompts: promptList,
    description: `Jogo ${style === "realistic" ? "realista" : style} do gênero ${genre}, para ${platform}, com foco em ${features.slice(0, 3).join(", ")}.`,
    opencodePrompt: `Crie um jogo ${genre} ${style} para ${platform}.\n\nRequisitos:\n- Motor: ${architecture.split(".")[0]}.\n- Plataforma: ${platform}\n- Estilo visual: ${style}\n- Gênero: ${genre}\n\nChecklist:\n${checklist.map(c => c.replace(/^\[ \] /, "- ")).join("\n")}\n\nAssets necessários:\n${assetList.map(a => `- ${a}`).join("\n")}\n\nCrie o jogo completo com todos os sistemas acima.`,
  };
}
