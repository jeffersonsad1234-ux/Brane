// ─── FEATURE DATA: mock content per system ─────────────
// Each feature: name, description, roadmap, script, architecture, checklist, ue5, prompts, systems

const F = {
  fps: {
    name: "Gerar Gameplay FPS",
    description: "Sistema completo de tiro em primeira pessoa com física de projéteis, armas variadas, recarga, dano por partes do corpo, efeitos visuais e sonoros.",
    roadmap: [
      "Configurar câmera FPS com mouse look e sensibilidade",
      "Criar sistema de armas: disparo, recarga, troca, munição",
      "Implementar física de projéteis (raycast/hitscan)",
      "Sistema de dano: headshot, torso, membros, armadura",
      "Efeitos: partículas de impacto, flash, fumaça, sangue",
      "HUD: crosshair, vida, munição, granadas, killfeed",
      "IA inimiga com combate em cobertura",
      "Multiplayer: sincronização de tiros e dano",
      "Áudio: tiros, passos, ricochete, ambiente de guerra",
    ],
    script: `// Sistema de Armas FPS
class WeaponSystem {
  constructor() {
    this.weapons = {
      pistol: { damage: 25, fireRate: 0.2, ammo: 15, reloadTime: 1.2, type: 'hitscan' },
      rifle: { damage: 35, fireRate: 0.1, ammo: 30, reloadTime: 2.0, type: 'hitscan' },
      shotgun: { damage: 80, fireRate: 0.5, ammo: 8, reloadTime: 2.5, type: 'spread' },
      sniper: { damage: 100, fireRate: 1.0, ammo: 5, reloadTime: 3.0, type: 'hitscan' },
    };
    this.current = 'pistol';
    this.ammo = this.weapons[this.current].ammo;
  }

  shoot(origin, direction) {
    if (this.ammo <= 0) return this.reload();
    this.ammo--;
    const hit = this.raycast(origin, direction);
    if (hit) this.applyDamage(hit.entity, this.weapons[this.current].damage);
    return { shot: true, ammo: this.ammo, hit };
  }

  raycast(origin, direction) {
    // Raycast contra inimigos e objetos
    const raycaster = new THREE.Raycaster(origin, direction);
    return raycaster.intersectObjects(this.targets)[0];
  }

  applyDamage(entity, damage) {
    entity.hp -= damage;
    if (entity.hp <= 0) entity.die();
  }

  reload() {
    if (this.ammo === this.weapons[this.current].ammo) return;
    this.ammo = this.weapons[this.current].ammo;
    return { reloading: true, time: this.weapons[this.current].reloadTime };
  }
}`,
    architecture: "ECS (Entity-Component-System) com sistema de armas separado por tipo. Raycaster para hitscan, projéteis físicos para ballistic. Event-driven para dano e morte. Sistema de pool para partículas e projéteis.",
    checklist: [
      "[ ] Câmera FPS com mouse look e suporte a gamepad",
      "[ ] 4+ armas com stats diferentes",
      "[ ] Sistema de recarga com animação",
      "[ ] Dano por parte do corpo (headshot 2x)",
      "[ ] Partículas de tiro, impacto e sangue",
      "[ ] Som 3D para cada arma",
      "[ ] HUD: crosshair dinâmico, munição, vida",
      "[ ] Killfeed e scoreboard",
      "[ ] Suporte a multiplayer (2-16 players)",
    ],
    ue5: [
      "BP_Weapon_Base: sistema de armas com DataTable",
      "BP_Projectile: projétil físico com dano e efeitos",
      "BP_FPSCharacter: câmera, movimento, armas",
      "BP_DamageSystem: dano por parte do corpo",
      "BP_HUD_FPS: crosshair, vida, munição, killfeed",
      "BP_EnemyAI: patrol, chase, combat com cover",
      "Niagara: sistema de partículas de impacto",
    ],
    prompts: [
      "Crie um sistema de armas FPS com diferentes tipos de disparo (hitscan, projectile, spread) e stats configuráveis via DataTable.",
      "Implemente IA de inimigos com árvore de comportamento: patrulha, alerta, perseguição, combate com cover e flanking.",
      "Gere HUD de FPS profissional com crosshair dinâmico (expandindo ao atirar), vida, munição, granadas e minimapa.",
    ],
    opencode: [
      "Implemente sistema de combate FPS completo com armas, munição, recarga, dano headshot e efeitos.",
      "Crie IA de inimigos FPS com comportamento de grupo, cobertura e comunicação entre unidades.",
      "Gere sistema de multiplayer FPS com lobby, matchmaking e sincronização de estado via WebSocket.",
    ],
    systems: ["Sistema de Armas", "Raycast/Projétil", "Dano por Parte", "Partículas", "Áudio 3D", "IA Inimiga", "Multiplayer"],
  },

  openworld: {
    name: "Mapas Open World",
    description: "Gerador procedural de mundos abertos com biomas, relevo, vegetação, água, clima e pontos de interesse. Baseado em domain warped noise multi-oitava.",
    roadmap: [
      "Implementar gerador de ruído (FBM + Domain Warp)",
      "Criar sistema de biomas por altura/umidade/temperatura",
      "Gerar terreno com montanhas, vales, rios e lagos",
      "Sistema de chunks com streaming dinâmico",
      "Vegetação procedural: árvores, arbustos, grama, rochas",
      "Clima dinâmico: chuva, neblina, vento, tempestade",
      "Ciclo dia/noite com céu estrelado e aurora",
      "Fauna: animais passivos e hostis por bioma",
      "Cidades, vilas, ruínas e dungeons geradas",
      "LOD progressivo para performance",
    ],
    script: `// Gerador de Terreno Procedural
class TerrainGenerator {
  constructor(width, depth, scale) {
    this.width = width;
    this.depth = depth;
    this.scale = scale;
  }

  generate(biomeMap) {
    const heightMap = [];
    for (let z = 0; z < this.depth; z++) {
      heightMap[z] = [];
      for (let x = 0; x < this.width; x++) {
        const wx = x + this.#domainWarp(x, z, 20);
        const wz = z + this.#domainWarp(x + 100, z + 100, 15);
        const base = this.#fbm(wx * 0.008, wz * 0.008, 6) * 3.2;
        const ridge = Math.pow(1 - Math.abs(this.#fbm(wx * 0.0025, wz * 0.0025) * 2 - 1), 2.2) * 11;
        heightMap[z][x] = base + ridge + this.#detail(wx, wz);
      }
    }
    return heightMap;
  }

  #fbm(x, z, octaves) {
    let value = 0, amplitude = 1, frequency = 1, maxVal = 0;
    for (let i = 0; i < octaves; i++) {
      value += this.#smooth(x * frequency, z * frequency) * amplitude;
      maxVal += amplitude; amplitude *= 0.5; frequency *= 2;
    }
    return value / maxVal;
  }

  #domainWarp(x, z, strength) {
    return this.#fbm(x * 0.004 + 1.5, z * 0.004 + 1.5, 4) * strength;
  }

  #smooth(x, z) {
    const ix = Math.floor(x), iz = Math.floor(z);
    const fx = x - ix, fz = z - iz;
    const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
    const v00 = this.#hash(ix, iz), v10 = this.#hash(ix + 1, iz);
    const v01 = this.#hash(ix, iz + 1), v11 = this.#hash(ix + 1, iz + 1);
    return (v00 + (v10 - v00) * sx) + ((v01 + (v11 - v01) * sx) - (v00 + (v10 - v00) * sx)) * sz;
  }

  #hash(x, z) {
    let h = x * 374761393 + z * 668265263;
    h = (h ^ (h >> 13)) * 1274126177;
    return ((h ^ (h >> 16)) >>> 0) / 4294967296;
  }

  #detail(x, z) {
    return this.#fbm(x * 0.035 + 60, z * 0.035 + 60) * 0.7;
  }
}`,
    architecture: "Streaming world engine com divisão em chunks (16x16). Geração multi-threaded com LOD quad-tree. Biomas definidos por mapa de altura + umidade + temperatura. Vegetação instanciada com GPU instancing.",
    checklist: [
      "[ ] Gerador de ruído base (FBM 6 oitavas + Domain Warp)",
      "[ ] Mapa de biomas: floresta, deserto, montanha, neve, água",
      "[ ] Terreno com vértices coloridos por bioma",
      "[ ] Chunks com carregamento dinâmico por distância",
      "[ ] Vegetação procedural (árvores, grama, rochas)",
      "[ ] Clima: chuva, neve, vento, neblina",
      "[ ] Ciclo dia/noite com skybox dinâmico",
      "[ ] Corpos d'água: rios, lagos, oceanos",
      "[ ] LOD progressivo para terreno e objetos",
      "[ ] Fauna por bioma com IA de movimento",
    ],
    ue5: [
      "Landscape: terreno com LayerInfo por bioma",
      "Procedural Foliage Volume: vegetação por bioma",
      "BP_WeatherSystem: chuva, neve, vento, neblina",
      "BP_DayNightCycle: sol, lua, estrelas, aurora",
      "HLOD: instâncias agrupadas por distância",
      "World Partition: streaming de mundo",
    ],
    prompts: [
      "Crie um gerador de terreno procedural com domain warped noise, 6+ biomas e coloração por altura.",
      "Implemente sistema de chunks com streaming, LOD e carregamento assíncrono.",
      "Gere vegetação procedural com GPU instancing: árvores, grama, arbustos, rochas.",
    ],
    opencode: [
      "Crie um mundo aberto procedural com biomas, clima dinâmico, ciclo dia/noite e fauna.",
      "Implemente streaming de mundo com chunks, LOD e carregamento sob demanda para performance.",
      "Gere sistema de vegetação procedural com distribuição por bioma e instanciamento GPU.",
    ],
    systems: ["Gerador de Ruído", "Biomas", "Chunks", "Vegetação", "Clima", "Dia/Noite", "Fauna", "LOD"],
  },

  survival: {
    name: "Sistemas Survival",
    description: "Sistema completo de sobrevivência com gerenciamento de vida, fome, sede, energia, temperatura, crafting, construção, recursos naturais e ciclo dia/noite.",
    roadmap: [
      "Implementar stats do jogador: vida, fome, sede, energia, temperatura",
      "Sistema de recursos naturais: madeira, pedra, minério, comida, água",
      "Inventário com slots, peso e categorias",
      "Sistema de crafting: receitas, bancada, ferramentas",
      "Construção: paredes, portas, telhados, mobília, grid snapping",
      "Ciclo dia/noite com efeitos na gameplay",
      "Clima: chuva reduz energia, neve causa frio, sol aumenta sede",
      "Fauna: caça para comida, animais hostis à noite",
      "Sistema de estações: primavera, verão, outono, inverno",
      "Save/Load completo do mundo e progresso",
    ],
    script: `// Sistema de Survival
class SurvivalSystem {
  constructor() {
    this.stats = {
      health: 100, maxHealth: 100,
      hunger: 100, maxHunger: 100,
      thirst: 100, maxThirst: 100,
      energy: 100, maxEnergy: 100,
      temperature: 36.5,
    };
    this.drainRates = {
      hunger: 0.4, thirst: 0.6, energy: 0.3,
    };
  }

  update(dt, environment) {
    // Drenagem passiva
    this.stats.hunger = Math.max(0, this.stats.hunger - this.drainRates.hunger * dt);
    this.stats.thirst = Math.max(0, this.stats.thirst - this.drainRates.thirst * dt);
    this.stats.energy = Math.max(0, this.stats.energy - this.drainRates.energy * dt);

    // Temperatura por ambiente
    const tempDiff = environment.temperature - this.stats.temperature;
    this.stats.temperature += tempDiff * 0.1 * dt;

    // Dano por fome/sede
    if (this.stats.hunger <= 0) this.stats.health -= 0.5 * dt;
    if (this.stats.thirst <= 0) this.stats.health -= 0.8 * dt;
    if (this.stats.temperature < 30 || this.stats.temperature > 42) {
      this.stats.health -= 1.0 * dt;
    }

    // Regeneração
    if (this.stats.hunger > 50 && this.stats.thirst > 50) {
      this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + 0.2 * dt);
    }
  }

  eat(food) { this.stats.hunger = Math.min(this.stats.maxHunger, this.stats.hunger + food.nutrition); }
  drink(water) { this.stats.thirst = Math.min(this.stats.maxThirst, this.stats.thirst + water.hydration); }
  rest(dt) { this.stats.energy = Math.min(this.stats.maxEnergy, this.stats.energy + 5 * dt); }
  takeDamage(amount) { this.stats.health = Math.max(0, this.stats.health - amount); }
}`,
    architecture: "Sistema de stats baseado em taxas de drenagem por segundo. Ambiente afeta temperatura e taxas. Event-driven para coleta, crafting e construção. Save/Load via JSON serialization.",
    checklist: [
      "[ ] Stats: vida, fome, sede, energia, temperatura",
      "[ ] Recursos: madeira, pedra, ferro, ouro, comida, água",
      "[ ] Inventário com 30 slots e peso máximo",
      "[ ] Crafting com 20+ receitas e bancada",
      "[ ] Construção com grid snapping e preview",
      "[ ] Ciclo dia/noite com efeitos na gameplay",
      "[ ] Clima: chuva, neve, calor, vento",
      "[ ] Fauna: 5+ espécies caçáveis e hostis",
      "[ ] 4 estações com mudanças visuais",
      "[ ] Save/Load automático e manual",
    ],
    ue5: [
      "BP_SurvivalComponent: stats, taxas, efeitos",
      "DT_Recipes: DataTable de receitas de crafting",
      "BP_CraftingBench: UI de crafting com categorias",
      "BP_BuildingSystem: construção com grid snapping",
      "BP_WeatherManager: clima dinâmico e estações",
      "BP_FaunaSpawner: animais por bioma e horário",
    ],
    prompts: [
      "Crie sistema de survival com vida, fome, sede, energia e temperatura com taxas de drenagem.",
      "Implemente sistema de crafting com receitas, bancada, ferramentas e categorias.",
      "Gere sistema de construção com grid snapping, preview e materiais.",
    ],
    opencode: [
      "Implemente sistema de sobrevivência completo: stats, nutrição, temperatura e clima.",
      "Crie sistema de crafting com receitas configuráveis, bancada e progressão de ferramentas.",
      "Gere sistema de construção com grid snapping, preview fantasma e suporte a multiplayer.",
    ],
    systems: ["Stats", "Recursos", "Inventário", "Crafting", "Construção", "Clima", "Fauna", "Estações", "Save/Load"],
  },

  movement: {
    name: "Movimento COD",
    description: "Sistema de movimento inspirado em Call of Duty: sprint, slide, crouch, jump, wall-run, mantling, parkour suave e câmera dinâmica.",
    roadmap: [
      "Implementar movimento base: WASD + aceleração/atrito",
      "Sprint com aumento de velocidade e FOV dinâmico",
      "Slide ao agachar durante sprint",
      "Crouch toggle com redução de hitbox",
      "Pulo com gravidade variável (mais alto no sprint)",
      "Wall-run: detectar parede, correr na vertical",
      "Mantling: subir em obstáculos automaticamente",
      "Parkour: pular entre plataformas, escorregar",
      "Câmera dinâmica: FOV, bob, tilt, shake",
      "Animações: transições suaves entre estados",
    ],
    script: `// Sistema de Movimento COD-style
class MovementSystem {
  constructor() {
    this.state = { x: 0, y: 0, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.grounded = true;
    this.sprinting = false;
    this.crouching = false;
    this.sliding = false;
    this.slideTimer = 0;
    this.wallRunning = false;
  }

  update(input, dt) {
    const GRAVITY = 16;
    const ACCEL = 14;
    const FRICTION = 10;
    const MAX_WALK = 3;
    const MAX_RUN = 5.5;
    const MAX_SPRINT = 8.5;
    const JUMP_SPEED = 5;
    const SLIDE_DURATION = 0.4;

    // Input direction
    const fwd = this.getForward();
    const right = this.getRight();
    const wishDir = fwd.multiplyScalar(input.y).add(right.multiplyScalar(input.x));
    const hasInput = wishDir.length() > 0.01;

    if (hasInput) wishDir.normalize();

    // Sprint → Slide
    if (this.sprinting && input.crouch && this.grounded && hasInput && !this.sliding) {
      this.sliding = true;
      this.slideTimer = 0;
    }

    if (this.sliding) {
      this.slideTimer += dt;
      if (this.slideTimer > SLIDE_DURATION || !hasInput) {
        this.sliding = false;
      }
    }

    // Horizontal movement
    let maxSpeed = this.sliding ? MAX_SPRINT * 0.9 :
      this.sprinting ? (this.crouching ? MAX_RUN * 0.5 : MAX_SPRINT) :
      this.crouching ? MAX_WALK * 0.5 : MAX_WALK;

    const curSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);

    if (hasInput && !this.sliding) {
      const acc = ACCEL * dt;
      this.velocity.x += wishDir.x * acc;
      this.velocity.z += wishDir.z * acc;
      const newSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
      if (newSpeed > maxSpeed) {
        this.velocity.x *= maxSpeed / newSpeed;
        this.velocity.z *= maxSpeed / newSpeed;
      }
    } else {
      // Friction
      const fric = (this.sliding ? 1.5 : FRICTION) * dt;
      if (curSpeed > fric) {
        const s = 1 - fric / curSpeed;
        this.velocity.x *= s;
        this.velocity.z *= s;
      } else {
        this.velocity.x = 0;
        this.velocity.z = 0;
      }
    }

    // Gravity + Jump
    if (this.grounded && input.jump && !this.sliding) {
      this.velocity.y = JUMP_SPEED;
      this.grounded = false;
    }
    this.velocity.y -= GRAVITY * dt;

    // Apply
    this.x += this.velocity.x * dt;
    this.y += this.velocity.y * dt;
    this.z += this.velocity.z * dt;
  }
}`,
    architecture: "Sistema de movimento baseado em física com aceleração, atrito, gravidade e velocidade máxima. Estados mutuamente exclusivos (walk/sprint/crouch/slide/wall-run). Câmera separada com FOV dinâmico e bob procedural.",
    checklist: [
      "[ ] Movimento WASD com aceleração e atrito",
      "[ ] Sprint com aumento de velocidade (8.5 vs 5.5)",
      "[ ] Slide com duração de 0.4s e redução de hitbox",
      "[ ] Crouch toggle com transição suave",
      "[ ] Pulo com gravidade e altura variável",
      "[ ] Wall-run: detecção de parede, movimento vertical",
      "[ ] Mantling: subir em obstáculos até 1.5m",
      "[ ] Câmera dinâmica: FOV 55→63, bob, tilt, screen shake",
      "[ ] Animações com blending entre estados",
      "[ ] Suporte a gamepad com aim assist",
    ],
    ue5: [
      "BP_MovementComponent: aceleração, atrito, gravidade",
      "BP_CameraEffects: FOV dinâmico, bob, tilt, shake",
      "BP_SlideAbility: slide com detecção de colisão",
      "BP_WallRunAbility: wall-run com gravidade reduzida",
      "BP_MantleAbility: detecção de borda e subida",
      "BP_ThirdPersonAnimBP: animação com blending",
    ],
    prompts: [
      "Crie sistema de movimento FPS com sprint, slide, crouch, jump e câmera dinâmica.",
      "Implemente wall-run e mantling para parkour suave estilo COD.",
      "Gere sistema de animação de movimento com blending entre estados (idle/walk/run/sprint/slide).",
    ],
    opencode: [
      "Implemente sistema de movimento inspirado em COD com física realista, sprint, slide, crouch e jump.",
      "Crie sistema de parkour com wall-run, mantling e transições suaves entre estados de movimento.",
      "Gere câmera dinâmica com FOV variável por velocidade, head bob, screen shake e tilts.",
    ],
    systems: ["Movimento WASD", "Sprint", "Slide", "Crouch", "Jump", "Wall-Run", "Mantling", "Câmera Dinâmica", "Animações"],
  },

  hud: {
    name: "Gerar HUD",
    description: "Sistema de HUD profissional com vida, stamina, munição, minimapa, inventário, notificações, crosshair dinâmico e menus estilizados.",
    roadmap: [
      "Criar HUD base: vida, stamina, energia",
      "Crosshair dinâmico: expande ao andar/atirar",
      "Minimapa com revelação por exploração",
      "Inventário visual: slots, drag & drop, categorias",
      "Hotbar com seleção por tecla (1-5)",
      "Notificações: dano, coleta, missão, conquista",
      "Menu de pausa: configurações, salvar, sair",
      "Tela de morte com estatísticas",
      "HUD adaptativo: muda em combate/exploração",
      "Suporte a gamepad e teclado",
    ],
    script: `// Gerenciador de HUD
class HUDSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.elements = {};
    this.visible = true;
  }

  addElement(name, config) {
    this.elements[name] = {
      x: config.x, y: config.y,
      width: config.width, height: config.height,
      draw: config.draw,
      visible: true,
    };
  }

  update(playerStats, gameState) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Crosshair
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const spread = gameState.isMoving ? 8 : 4;
    this.ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(cx - spread * 2, cy);
    this.ctx.lineTo(cx - spread, cy);
    this.ctx.moveTo(cx + spread, cy);
    this.ctx.lineTo(cx + spread * 2, cy);
    this.ctx.moveTo(cx, cy - spread * 2);
    this.ctx.lineTo(cx, cy - spread);
    this.ctx.moveTo(cx, cy + spread);
    this.ctx.lineTo(cx, cy + spread * 2);
    this.ctx.stroke();

    // Health bar
    this.drawBar(20, 20, 200, 12, playerStats.health / 100, '#ff3344');
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '10px monospace';
    this.ctx.fillText(\`❤️ \${Math.round(playerStats.health)}\`, 25, 30);
  }

  drawBar(x, y, w, h, pct, color) {
    this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
    this.ctx.roundRect(x, y, w, h, 4);
    this.ctx.fill();
    this.ctx.fillStyle = color;
    this.ctx.roundRect(x, y, w * pct, h, 4);
    this.ctx.fill();
  }
}`,
    architecture: "Canvas 2D overlay para HUD principal. Elementos modulares registrados por nome. Crosshair separado em camada própria. Minimapa em canvas isolado com câmera ortográfica.",
    checklist: [
      "[ ] Barra de vida, stamina, energia animadas",
      "[ ] Crosshair dinâmico com spread por movimento",
      "[ ] Minimapa com visão panorâmica e marcadores",
      "[ ] Hotbar 5 slots com ícones e contadores",
      "[ ] Inventário full-screen com drag & drop",
      "[ ] Notificações com fade in/out e fila",
      "[ ] Menu de pausa com configurações",
      "[ ] Tela de morte com revive/kits",
      "[ ] HUD adaptativo (combate vs exploração)",
      "[ ] Suporte a controles e remapeamento",
    ],
    ue5: [
      "WBP_HUD: Widget Blueprint com todos os elementos",
      "WBP_Crosshair: crosshair dinâmico com spread",
      "WBP_Minimap: minimapa com material procedural",
      "WBP_Inventory: grid de inventário com drag",
      "WBP_DamageIndicator: indicador de direção do dano",
    ],
    prompts: [
      "Crie HUD completo com vida, stamina, munição, minimapa e crosshair dinâmico.",
      "Implemente inventário visual com drag & drop, categorias e contexto.",
      "Gere sistema de notificações com fila, fade e prioridade.",
    ],
    opencode: [
      "Crie sistema de HUD completo com barras de status, crosshair dinâmico, minimapa e notificações.",
      "Implemente inventário visual com drag & drop, slots, categorias e interação por clique.",
      "Gere menu de pausa com configurações de áudio, vídeo, controles e salvamento.",
    ],
    systems: ["Barras de Status", "Crosshair", "Minimapa", "Hotbar", "Inventário", "Notificações", "Menu", "HUD Adaptativo"],
  },

  quests: {
    name: "Gerar Quests",
    description: "Sistema de missões com diálogo em árvore, objetivos multietapa, recompensas, progressão narrativa e integração com mundo aberto.",
    roadmap: [
      "Estrutura de quests: ID, nome, descrição, etapas",
      "Sistema de diálogo com NPCs (árvore de diálogo)",
      "Objetivos: coletar, matar, entregar, explorar, proteger",
      "Sistema de recompensas: XP, itens, dinheiro, reputação",
      "Progressão narrativa: quests principais e secundárias",
      "Marcadores no mapa e minimapa",
      "Notificações de progresso e conclusão",
      "Suporte a quests dinâmicas (geradas proceduralmente)",
      "Log de missões com abas (principal/secundária/completas)",
      "Sistema de facções e reputação",
    ],
    script: `// Sistema de Quests
class QuestSystem {
  constructor() {
    this.quests = {};
    this.active = [];
    this.completed = [];
    this.reputation = {};
  }

  addQuest(quest) {
    this.quests[quest.id] = {
      ...quest,
      stage: 0,
      status: 'inactive',
      objectives: quest.objectives.map(o => ({ ...o, done: false })),
    };
  }

  startQuest(id) {
    const q = this.quests[id];
    if (!q || q.status !== 'inactive') return false;
    q.status = 'active';
    q.stage = 0;
    this.active.push(id);
    this.notify(\`Nova missão: \${q.name}\`);
    return true;
  }

  updateObjective(questId, objectiveKey) {
    const q = this.quests[questId];
    if (!q || q.status !== 'active') return;
    const obj = q.objectives.find(o => o.key === objectiveKey);
    if (obj && !obj.done) {
      obj.done = true;
      this.checkCompletion(questId);
    }
  }

  checkCompletion(questId) {
    const q = this.quests[questId];
    if (q.objectives.every(o => o.done)) {
      q.status = 'completed';
      this.active = this.active.filter(id => id !== questId);
      this.completed.push(questId);
      this.giveRewards(q);
      this.notify(\`Missão concluída: \${q.name}!\`);
    }
  }

  giveRewards(quest) {
    for (const reward of quest.rewards) {
      if (reward.type === 'xp') player.addXP(reward.amount);
      if (reward.type === 'item') inventory.add(reward.item, reward.amount);
      if (reward.type === 'reputation') {
        this.reputation[reward.faction] = (this.reputation[reward.faction] || 0) + reward.amount;
      }
    }
  }
}`,
    architecture: "Data-driven quest system com JSON. Diálogo em árvore com nós de fala, escolha e condição. Event-driven para detecção de objetivos. Integração com inventário e reputação.",
    checklist: [
      "[ ] 10+ quests com objetivos variados",
      "[ ] Árvore de diálogo com escolhas do jogador",
      "[ ] Objetivos: coletar, matar, entregar, explorar",
      "[ ] Recompensas: XP, itens, dinheiro, reputação",
      "[ ] Marcadores no mapa e minimapa",
      "[ ] Log de missões com filtros",
      "[ ] Quests secundárias geradas proceduralmente",
      "[ ] Sistema de facções com reputação",
      "[ ] Notificações de progresso",
      "[ ] Suporte a quests multiplayer",
    ],
    ue5: [
      "DT_Quests: DataTable de quests com etapas",
      "BP_QuestGiver: NPC com diálogo e entrega",
      "WBP_QuestLog: UI de acompanhamento de missões",
      "BP_DialogueSystem: árvore de diálogo com escolhas",
      "BP_QuestObjective: detecção de objetivos no mundo",
    ],
    prompts: [
      "Crie sistema de quests com objetivos variados, árvore de diálogo e recompensas.",
      "Implemente sistema de diálogo com NPCs, escolhas do jogador e ramificações.",
      "Gere quests dinâmicas proceduralmente baseadas em templates e estado do mundo.",
    ],
    opencode: [
      "Crie sistema de missões completo com objetivos, diálogo em árvore, recompensas e progressão.",
      "Implemente sistema de diálogo com NPCs incluindo árvore de falas, escolhas e condições.",
      "Gere quests secundárias proceduralmente com base em templates, bioma e nível do jogador.",
    ],
    systems: ["Quests", "Diálogo", "Objetivos", "Recompensas", "Reputação", "Facções", "Marcadores", "Progressão"],
  },

  inventory: {
    name: "Sistema de Inventário",
    description: "Inventário com slots, drag & drop, crafting, loot, raridade, categorias, peso máximo, busca e organização automática.",
    roadmap: [
      "Grid de inventário com slots (30+)",
      "Drag & drop entre slots e para fora",
      "Categorias: armas, armaduras, consumíveis, materiais",
      "Sistema de raridade: comum, raro, épico, lendário",
      "Peso máximo por tipo de item",
      "Crafting: receitas, materiais, bancada, resultado",
      "Loot de inimigos e baús",
      "Quick equip: clicar para equipar",
      "Busca e filtros no inventário",
      "Organização automática (sort)",
    ],
    script: `// Sistema de Inventário
class InventorySystem {
  constructor(maxSlots = 30) {
    this.slots = new Array(maxSlots).fill(null);
    this.maxSlots = maxSlots;
    this.maxWeight = 50;
    this.gold = 0;
  }

  addItem(item, count = 1) {
    // Stack em slot existente
    if (item.stackable) {
      const existing = this.slots.findIndex(s => s?.id === item.id && s.count < item.maxStack);
      if (existing >= 0) {
        const space = item.maxStack - this.slots[existing].count;
        const toAdd = Math.min(space, count);
        this.slots[existing].count += toAdd;
        count -= toAdd;
        if (count <= 0) return true;
      }
    }
    // Novo slot
    for (let i = 0; i < this.maxSlots; i++) {
      if (!this.slots[i]) {
        this.slots[i] = { ...item, count: 1 };
        count--;
        if (count <= 0) return true;
      }
    }
    return false; // Inventário cheio
  }

  removeItem(slotIndex, count = 1) {
    const slot = this.slots[slotIndex];
    if (!slot) return false;
    slot.count -= count;
    if (slot.count <= 0) this.slots[slotIndex] = null;
    return true;
  }

  moveItem(from, to) {
    [this.slots[from], this.slots[to]] = [this.slots[to], this.slots[from]];
  }

  craft(recipe, bench) {
    if (!this.hasMaterials(recipe.materials)) return null;
    for (const mat of recipe.materials) this.removeMaterial(mat.id, mat.count);
    const result = this.addItem(recipe.result, recipe.resultCount);
    return result ? recipe.result : null;
  }

  getWeight() {
    return this.slots.reduce((w, s) => w + (s ? s.weight * s.count : 0), 0);
  }

  sort() {
    this.slots.sort((a, b) => {
      if (!a) return 1; if (!b) return -1;
      return (a.rarity || 0) - (b.rarity || 0) || a.name.localeCompare(b.name);
    });
  }
}`,
    architecture: "Array-based grid inventory with stackable items. Drag & drop via HTML5 DnD API. Crafting system with recipe DataTable. Loot tables with weighted random drops.",
    checklist: [
      "[ ] 30+ slots com suporte a stack",
      "[ ] Drag & drop funcional entre slots",
      "[ ] 5 categorias de itens",
      "[ ] 4 níveis de raridade com cores",
      "[ ] Peso máximo por inventário",
      "[ ] Crafting com 15+ receitas",
      "[ ] Loot de inimigos com tabelas de drop",
      "[ ] Quick equip (armas, armaduras)",
      "[ ] Busca por nome e tipo",
      "[ ] Sort automático por raridade/nome",
    ],
    ue5: [
      "WBP_Inventory: grid de inventário com drag",
      "DT_Items: DataTable de itens com stats e raridade",
      "DT_Recipes: DataTable de receitas de crafting",
      "BP_LootSystem: geração de loot por tabela de peso",
      "BP_ItemPickup: ator coletável no mundo",
    ],
    prompts: [
      "Crie sistema de inventário com grid, drag & drop, categorias e raridade.",
      "Implemente sistema de crafting com receitas, materiais e bancada.",
      "Gere sistema de loot com tabelas de drop ponderado por raridade.",
    ],
    opencode: [
      "Crie sistema de inventário completo com slots, drag & drop, peso, categorias e raridade.",
      "Implemente sistema de crafting com receitas configuráveis em DataTable, materiais e bancada.",
      "Gere sistema de loot com tabelas de drop ponderado, raridade e loot de inimigos.",
    ],
    systems: ["Slots", "Drag & Drop", "Categorias", "Raridade", "Peso", "Crafting", "Loot", "Quick Equip", "Busca"],
  },

  enemyAI: {
    name: "IA de Inimigos",
    description: "Sistema de inteligência artificial para inimigos com patrulha, perseguição, combate, cobertura, trabalho em equipe e diferentes comportamentos por tipo.",
    roadmap: [
      "Máquina de estados: idle, patrol, alert, chase, combat, flee",
      "Sistema de percepção: visão, audição, dano recebido",
      "Patrulha por waypoints com pausa",
      "Perseguição com pathfinding (A*)",
      "Combate: atacar, recuar, flanquear, cobertura",
      "Trabalho em equipe: comunicação entre unidades",
      "Diferentes tipos: soldado, atirador, explosivo, boss",
      "Sistema de cobertura: encontrar, mover, atirar",
      "Reação a eventos: barulho, luz, corpo",
      "Dificuldade adaptativa por progresso",
    ],
    script: `// IA de Inimigos — Máquina de Estados
class EnemyAI {
  constructor(config) {
    this.state = 'idle';
    this.target = null;
    this.lastKnownPosition = null;
    this.waypoints = config.waypoints || [];
    this.currentWaypoint = 0;
    this.detectionRange = config.detectionRange || 20;
    this.hearingRange = config.hearingRange || 10;
    this.stats = { hp: 100, speed: 3, damage: 10, fireRate: 0.5 };
  }

  update(playerPos, noises, dt) {
    this.detect(playerPos, noises);

    switch (this.state) {
      case 'idle': this.idle(dt); break;
      case 'patrol': this.patrol(dt); break;
      case 'alert': this.alert(playerPos, dt); break;
      case 'chase': this.chase(playerPos, dt); break;
      case 'combat': this.combat(playerPos, dt); break;
      case 'flee': this.flee(playerPos, dt); break;
    }
  }

  detect(playerPos, noises) {
    const dist = this.distanceTo(playerPos);
    if (dist < this.detectionRange && this.hasLineOfSight(playerPos)) {
      this.target = playerPos;
      this.lastKnownPosition = { ...playerPos };
      this.state = dist < 10 ? 'combat' : 'chase';
      return;
    }
    for (const noise of noises) {
      if (dist < this.hearingRange) {
        this.lastKnownPosition = noise.position;
        this.state = 'alert';
      }
    }
  }

  patrol(dt) {
    if (this.waypoints.length === 0) return;
    const target = this.waypoints[this.currentWaypoint];
    this.moveTowards(target, dt);
    if (this.distanceTo(target) < 1) {
      this.currentWaypoint = (this.currentWaypoint + 1) % this.waypoints.length;
    }
  }

  chase(target, dt) {
    this.moveTowards(target, dt);
    if (this.distanceTo(target) < 10) this.state = 'combat';
  }

  combat(target, dt) {
    // Flanqueamento
    const flankDir = this.getFlankDirection(target);
    this.moveTowards(flankDir, dt * 0.5);

    // Atirar
    if (this.canShoot()) {
      this.shoot(target);
    }

    // Recuar se HP baixo
    if (this.stats.hp < 30) {
      this.state = 'flee';
    }
  }

  moveTowards(target, dt) {
    const dx = target.x - this.x;
    const dz = target.z - this.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 0.5) return;
    this.x += (dx / dist) * this.stats.speed * dt;
    this.z += (dz / dist) * this.stats.speed * dt;
  }
}`,
    architecture: "FSM (Finite State Machine) com estados mutuamente exclusivos. Percepção baseada em distância + linha de visão. Pathfinding A* com grid de navegação. Comunicação entre unidades via event bus.",
    checklist: [
      "[ ] 6 estados: idle, patrol, alert, chase, combat, flee",
      "[ ] Detecção por visão (cone) e audição (distância)",
      "[ ] Patrulha por waypoints configuráveis",
      "[ ] Pathfinding A* com grid dinâmico",
      "[ ] Combate: ataque, recuo, flanqueio, cobertura",
      "[ ] 4 tipos: soldado, sniper, explosivo, boss",
      "[ ] Cobertura: encontrar, navegar, usar",
      "[ ] Dificuldade adaptativa (mais agressivo com nível)",
      "[ ] Comunicação entre unidades (flank, help, retreat)",
      "[ ] Resposta a estímulos: barulho, luz, corpo encontrado",
    ],
    ue5: [
      "BP_EnemyBase: AI Controller com Behavior Tree",
      "BT_EnemyBehavior: patrol, chase, combat, flee",
      "BB_EnemyBlackboard: alvo, waypoints, estado",
      "EQS: detecção de cobertura e flanqueio",
      "BP_PerceptionComponent: visão, audição, dano",
    ],
    prompts: [
      "Crie IA de inimigos com máquina de estados: patrulha, perseguição, combate e fuga.",
      "Implemente sistema de percepção com visão em cone, audição e detecção de dano.",
      "Gere sistema de combate com cobertura, flanqueio e trabalho em equipe.",
    ],
    opencode: [
      "Implemente IA de inimigos completa com FSM, waypoints, pathfinding A* e percepção.",
      "Crie sistema de combate com cobertura dinâmica, flanqueio e comunicação entre unidades.",
      "Gere 4 tipos de inimigos com comportamentos distintos: soldado, sniper, explosivo e boss.",
    ],
    systems: ["FSM", "Percepção", "Patrulha", "Pathfinding", "Combate", "Cobertura", "Tipos", "Dificuldade", "Comunicação"],
  },

  graphics: {
    name: "Gráficos Cinematográficos",
    description: "Sistema de renderização cinematográfica com iluminação dinâmica, sombras PCF soft, tone mapping ACES, névoa volumétrica, depth of field, bloom e color grading.",
    roadmap: [
      "Iluminação dinâmica com DirectionalLight + hemisfério",
      "Sombras PCF Soft (1024x1024 ou superior)",
      "Tone mapping ACES filmic para cores naturais",
      "Névoa volumétrica com FogExp2 ou height fog",
      "Bloom sutil para emissivos e luzes",
      "Depth of field para efeito cinematográfico",
      "Color grading: LUT 3D para paleta de cores",
      "Ambient occlusion (SSAO) para profundidade",
      "Reflexos: SSR ou CubeMap para água e metais",
      "Anti-aliasing: SMAA ou TAA para bordas suaves",
    ],
    script: `// Configuração de Render Cinematográfico
function setupCinematicRenderer(container) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB);

  // Fog
  scene.fog = new THREE.FogExp2(0x87CEEB, 0.001);

  // Lights
  const amb = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(amb);
  const hemi = new THREE.HemisphereLight(0x88CCFF, 0xCC9966, 0.25);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xFFCC88, 1.0);
  sun.position.set(20, 35, 15);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  scene.add(sun);

  return { renderer, scene, sun, amb, hemi };
}`,
    architecture: "Deferred rendering (se disponível) com pipeline PBR. Iluminação por imagem HDR para ambiente. Pós-processamento em passes separados. LUT 3D para color grading final.",
    checklist: [
      "[ ] Iluminação direcional + hemisfério + ambiente",
      "[ ] Sombras PCF Soft 2048x2048",
      "[ ] ACES Filmic tone mapping (exposure 0.9)",
      "[ ] Névoa: height fog + distance fog",
      "[ ] Bloom: emissivos e luzes brilhantes",
      "[ ] Depth of field: foco no jogador",
      "[ ] Color grading com LUT personalizada",
      "[ ] SSAO para contatos e profundidade",
      "[ ] Reflexos SSR em superfícies planas",
      "[ ] SMAA/TAA para anti-aliasing",
    ],
    ue5: [
      "PostProcessVolume: bloom, DOF, color grading, AO",
      "DirectionalLight: sol com sombras ray-traced",
      "SkyAtmosphere: céu com dispersão de luz",
      "VolumetricFog: névoa volumétrica com luz dinâmica",
      "LUT: Color Lookup Table personalizada",
    ],
    prompts: [
      "Configure render cinematográfico com ACES tone mapping, sombras PCF, névoa e bloom.",
      "Implemente skybox dinâmico com gradiente por hora do dia.",
      "Gere sistema de iluminação com ciclo dia/noite e cores de temperatura.",
    ],
    opencode: [
      "Configure motor de render com iluminação PBR, ACES filmic tone mapping e sombras suaves.",
      "Implemente pós-processamento cinematográfico: bloom, depth of field e color grading.",
      "Crie sistema de iluminação dinâmica com ciclo dia/noite, temperatura de cor e skybox procedural.",
    ],
    systems: ["Iluminação PBR", "Sombras", "Tone Mapping", "Névoa", "Bloom", "DOF", "Color Grading", "SSAO", "Reflexos"],
  },

  multiplayer: {
    name: "Multiplayer",
    description: "Sistema multiplayer com servidor dedicado, matchmaking, lobby, sincronização de estado, chat de voz/texto e suporte a até 32 jogadores.",
    roadmap: [
      "Arquitetura cliente-servidor com WebSocket",
      "Sistema de matchmaking por ELO/ping/região",
      "Lobby com seleção de mapa e modos",
      "Sincronização de estado: posição, vida, ação",
      "Autoridade do servidor com client-side prediction",
      "Sistema de hit registration com reconciliação",
      "Chat de texto e voz integrado",
      "Sistema de party/amigos",
      "Anti-cheat básico: validação de pacotes",
      "Suporte a 32+ jogadores simultâneos",
    ],
    script: `// Servidor Multiplayer (Node.js + WebSocket)
const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8080 });

class GameServer {
  constructor() {
    this.rooms = {};
    this.players = {};
  }

  onConnection(ws) {
    ws.on('message', (data) => {
      const packet = JSON.parse(data);
      this.handlePacket(ws, packet);
    });
    ws.send(JSON.stringify({ type: 'welcome', id: ws._id }));
  }

  handlePacket(ws, packet) {
    switch (packet.type) {
      case 'join_room':
        this.joinRoom(ws, packet.roomId);
        break;
      case 'player_state':
        this.broadcastRoom(ws, packet);
        break;
      case 'shoot':
        this.handleShoot(ws, packet);
        break;
      case 'chat':
        this.broadcastRoom(ws, { type: 'chat', msg: packet.msg, player: ws._id });
        break;
    }
  }

  joinRoom(ws, roomId) {
    if (!this.rooms[roomId]) {
      this.rooms[roomId] = [];
    }
    this.rooms[roomId].push(ws);
    this.broadcastRoom(ws, { type: 'player_joined', id: ws._id });
    ws.send(JSON.stringify({ type: 'room_players', ids: this.rooms[roomId].map(c => c._id) }));
  }

  broadcastRoom(sender, packet) {
    const room = this.rooms[packet.room || 'default'];
    if (!room) return;
    for (const client of room) {
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(packet));
      }
    }
  }

  handleShoot(ws, packet) {
    // Verificar autoridade do servidor
    const hit = this.validateShot(ws._id, packet);
    if (hit) {
      this.broadcastRoom(ws, { type: 'hit', shooter: ws._id, target: hit.target, damage: hit.damage });
    }
  }
}`,
    architecture: "Cliente-servidor com Node.js + WebSocket. Servidor com autoridade sobre estado do jogo. Client-side prediction + server reconciliation para movimento. UDP para estado, TCP para mensagens críticas.",
    checklist: [
      "[ ] Servidor dedicado Node.js + WebSocket",
      "[ ] Matchmaking por ELO e região",
      "[ ] Lobby com 4+ modos de jogo",
      "[ ] Sincronização de posição a 20Hz",
      "[ ] Hit registration com reconciliação",
      "[ ] Chat de texto com comandos",
      "[ ] Voz integrada (WebRTC)",
      "[ ] Party system com convites",
      "[ ] Anti-cheat: validação de pacotes",
      "[ ] 32+ jogadores por sala",
    ],
    ue5: [
      "BP_GameInstance: gerenciamento de sessão",
      "BP_PlayerController: RPCs de movimentos e ações",
      "BP_GameMode: regras, spawn, vitória",
      "BP_PlayerState: stats, loadout, time",
      "OnlineSubsystem: matchmaking, lobby, amigos",
    ],
    prompts: [
      "Crie arquitetura multiplayer cliente-servidor com WebSocket e sincronização de estado.",
      "Implemente sistema de matchmaking com ELO, ping e região.",
      "Gere sistema de hit registration com server authority e client-side prediction.",
    ],
    opencode: [
      "Crie sistema multiplayer completo com servidor WebSocket, lobby e sincronização de estado.",
      "Implemente matchmaking com ELO, prioridade por região e balanceamento de times.",
      "Gere sistema de combate multiplayer com server authority, client-side prediction e reconciliação.",
    ],
    systems: ["Servidor", "WebSocket", "Matchmaking", "Lobby", "Sincronização", "Hit Reg", "Chat", "Party", "Anti-Cheat"],
  },
};

export default F;
