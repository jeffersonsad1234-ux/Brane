// ─── UE5 PROJECT GENERATOR ─────────────────────────────
// Generates professional Unreal Engine 5 documentation from a project.

function md(text) {
  return text;
}

function h1(t) { return `# ${t}\n\n`; }
function h2(t) { return `## ${t}\n\n`; }
function h3(t) { return `### ${t}\n\n`; }
function code(t) { return "```" + t + "\n"; }
function li(t) { return `- ${t}\n`; }
function bold(t) { return `**${t}**`; }

export function generateUE5Export(project) {
  const genre = (project.genre || "FPS").toLowerCase();
  const style = project.style || "Realista";
  const platform = project.platform || "PC";
  const name = project.name || "MeuJogo";
  const desc = project.description || "";

  const isFPS = genre.includes("fps") || genre.includes("tiro");
  const isSurvival = genre.includes("survival") || genre.includes("sobreviv");
  const isOpenWorld = genre.includes("open") || genre.includes("mundo") || genre.includes("world");
  const hasZombies = genre.includes("zumbi") || desc.toLowerCase().includes("zumbi");

  const files = {
    README_UE5: generateReadme(name, genre, style, platform, desc, hasZombies),
    GAME_DESIGN: generateGameDesign(name, genre, style, platform, desc, isFPS, isSurvival, isOpenWorld, hasZombies),
    ASSETS_LIST: generateAssetsList(name, style, isFPS, isSurvival, isOpenWorld, hasZombies),
    BLUEPRINT_STEPS: generateBlueprintSteps(name, isFPS, isSurvival, isOpenWorld, hasZombies),
  };

  return files;
}

function generateReadme(name, genre, style, platform, desc, hasZombies) {
  return md(`${h1(`${name} — Projeto Unreal Engine 5`)}

${bold("Gerado por Brane Studio")}

${h2("Visão Geral")}
${desc || `Jogo ${genre} em ${style} para ${platform}.`}

${h2("Requisitos")}
${li("Unreal Engine 5.4+")}
${li("Visual Studio 2022 + C++ Toolchain")}
${li("25+ GB de espaço em disco")}
${li("Placa de vídeo compatível com DirectX 12 / Vulkan")}

${h2("Setup Inicial")}
${code("shell")
}git init
git add .
git commit -m "Initial commit: UE5 project scaffold"

${h2("Plugins Recomendados")}
${li("Enhanced Input System (nativo UE5)")}
${li("Motion Matching (nativo UE5.4+)")}
${li("Quixel Bridge (Megascans)")}
${li("MetaSounds")}
${li("World Partition (open world)")}
${hasZombies ? li("MassAI / StateTree (para hordas)") : ""}

${h2("Estrutura de Pastas")}
${code("")
}ProjectRoot/
├── Content/
│   ├── Maps/          — Níveis do jogo
│   ├── Characters/    — Personagens, animações, BP
│   ├── Environment/   — Malhas, materiais, texturas
│   ├── Weapons/       — Armas, projéteis, FX
│   ├── UI/            — Widgets, HUD, menus
│   ├── Audio/         — Sons, música, MetaSounds
│   └── Data/          — DataTables, curvas, configs
└── Source/
    └── ${name}/       — C++ classes (opcional)

${h2("Build & Deploy")}
${li("Build: File → Package Project → Windows/Linux")}
${li("Teste: Play From Here no editor")}
${li("Deploy: Steam / Itch.io / Epic Games Store")}

---
${bold("Nota:")} Este projeto foi gerado automaticamente pelo Brane Studio.
O resultado web é apenas uma prévia conceitual. O jogo completo deve ser desenvolvido na Unreal Engine 5.`);
}

function generateGameDesign(name, genre, style, platform, desc, isFPS, isSurvival, isOpenWorld, hasZombies) {
  return md(`${h1(`${name} — Game Design Document`)}

${h2("1. Conceito")}
${desc || `Jogo ${genre} desenvolvido para ${platform} utilizando Unreal Engine 5.`}
${isFPS ? "\nJogabilidade em primeira pessoa com foco em combate tático e movimentação fluida." : ""}
${isSurvival ? "\nSistema de sobrevivência com gerenciamento de recursos, crafting e exploração." : ""}
${hasZombies ? "\nInimigos zumbis com IA de perseguição, hordas e combate corpo a corpo." : ""}

${h2("2. Mecânicas Principais")}
${isFPS ? `${li("Movimento FPS: sprint, slide, crouch, jump com físicas realistas")}
${li("Sistema de armas: disparo, recarga, troca, mira")}
${li("Damage system: headshot (2x), membros, torso")}
${li("IA inimiga: patrulha, perseguição, combate em cobertura")}`
: `${li("Movimento第三人称 suave com blend de animações")}
${li("Câmera dinâmica com FOV ajustável")}
${li("Interação com objetos e NPCs")}`}

${isSurvival ? `${li("Stats do jogador: vida, fome, sede, energia, temperatura")}
${li("Inventário com slots, peso e crafting")}
${li("Ciclo dia/noite com impactos na jogabilidade")}
${li("Construção de bases com grid snapping")}`
: ""}

${hasZombies ? `${li("Zumbis com IA Behavior Tree: patrol, chase, attack")}
${li("Dano por contato e ataques corpo a corpo")}
${li("Spawn por wave ou exploração do mapa")}
${li("Diferentes tipos: comum, rápido, tanque")}`
: `${li("Inimigos com Behavior Tree e EQS")}
${li("Sistema de combate com recoil e spread")}`}

${h2("3. Ambientação")}
${li("Floresta densa com vegetação procedural")}
${li("Estrada abandonada com asfalto rachado e marcações")}
${li("Casas destruídas com interiores acessíveis")}
${li("Iluminação Lumen com luz de fim de tarde")}
${li("Névoa volumétrica e partículas de poeira/serra")}
${li("Céu dinâmico com sistema de clima")}

${h2("4. Progressão")}
${li("Tutorial: primeiros passos, combate, crafting")}
${li("Missões principais com objetivos variados")}
${li("Sistema de crafting e upgrade de equipamento")}
${li("Árvore de habilidades passivas e ativas")}

${h2("5. Público-Alvo")}
${li("Jogadores de FPS e survival")}
${li("Fãs de Days Gone, The Last of Us, Resident Evil")}
${li("Plataforma: ${platform}")}
${li("Classificação: +16")}

${h2("6. Stack Tecnológico")}
${li("Unreal Engine 5.4+")}
${li("Lumen (Global Illumination)")}
${li("Nanite (geometria detalhada)")}
${li("World Partition (níveis grandes)")}
${li("MetaSounds (áudio procedural)")}
${li("Enhanced Input (controles modernos)")}`);
}

function generateAssetsList(name, style, isFPS, isSurvival, isOpenWorld, hasZombies) {
  return md(`${h1(`${name} — Lista de Assets`)}
Gerado por Brane Studio | Fonte: Quixel Megascans / Fab

${h2("🌲 Vegetação")}
${li("[Megascans] TreePack: Coniferas, Deciduous, Dead Trees (Fab)")}
${li("[Megascans] GroundCover: Grama alta, arbustos, samambaias")}
${li("[Megascans] LeafLitter: Folhas caídas, galhos, musgo")}
${li("[Megascans] BarkTextures: Troncos de árvores variados")}
${li("[Fab] ForestEnvironment: Árvores low-poly realistas")}

${h2("🏞️ Terreno")}
${li("[Megascans] GroundTextures: Terra, lama, cascalho, grama seca (4K)")}
${li("[Megascans] RockPack: Pedras, rochedos, penhascos")}
${li("[Megascans] RoadTextures: Asfalto rachado, concreto, sujeira")}
${li("[Fab] MudDecals: Decalques de lama e poças")}

${h2("🏚️ Construções")}
${li("[Megascans] WoodTextures: Madeira velha, tábuas, vigas (4K)")}
${li("[Megascans] RoofTextures: Telhas quebradas, metal enferrujado")}
${li("[Megascans] WallTextures: Reboco rachado, tijolos, concreto")}
${li("[Fab] AbandonedProps: Móveis quebrados, entulho, ferragens")}
${li("[Fab] WindowPack: Janelas quebradas, vidro sujo, molduras")}

${h2("🚗 Veículos")}
${li("[Megascans] VehicleWreckage: Carros abandonados, caminhões")}
${li("[Fab] ScrapMetal: Sucata, latas, peças de motor")}

${h2("🧟 Personagens")}
${hasZombies ? `${li("[Fab] ZombiePack: 5+ variações de zumbis realistas (rigged)")}
${li("[Mixamo/UE5] HumanoidAnimPack: Idle, walk, run, attack, die")}
${li("[Fab] BloodDecals: Decalques de sangue, ferimentos")}`
: `${li("[Mixamo/UE5] SoldierAnimPack: Idle, walk, run, crouch, shoot")}
${li("[Fab] MilitaryGear: Equipamento tático, mochilas, capacetes")}`}

${isFPS ? `${li("[Fab] WeaponPack: Rifle, shotgun, pistola, faca (FBX)")}
${li("[Megascans] MetalTextures: Texturas de armas 4K")}`
: ""}

${h2("💡 Iluminação e FX")}
${li("[Fab] LightingPresets: Setup Lumen + SkyAtmosphere")}
${li("[Fab] VFXPack: Partículas de impacto, fogo, fumaça")}
${li("[Megascans] DecalTextures: Sujeira, rachaduras, manchas")}

${h2("🔊 Áudio")}
${li("[Fab] FPSFootstepPack: Passos em grama, asfalto, madeira, metal")}
${li("[Fab] GunSounds: Tiros, ricochete, recarga")}
${hasZombies ? li("[Fab] ZombieSounds: Grunhidos, passos, ataques") : ""}
${li("[Fab] AmbientNature: Pássaros, vento, insetos, tempestade")}
${li("[Fab] MusicPackDark: Trilha sonora tensa/cinematográfica")}

${h2("📦 Total Estimado")}
${li("Assets principais: ~40-60 itens")}
${li("Tamanho aproximado: 8-15 GB (com texturas 4K)")}
${li("Custo estimado: ~$50-200 USD (Fab/Megascans)")}`);
}

function generateBlueprintSteps(name, isFPS, isSurvival, isOpenWorld, hasZombies) {
  return md(`${h1(`${name} — Blueprint Implementation Steps`)}
Guia passo a passo para implementar o jogo na Unreal Engine 5.

${h2("Fase 1: Configuração Inicial")}
${code("text")
}1. Criar novo projeto: Games → First Person / Third Person
2. Enable Starter Content
3. Configurar Enhanced Input:
   - Criar IA_PlayerControls (Input Mapping Context)
   - Adicionar Actions: Move, Look, Jump, Sprint, Crouch, Slide
   - Adicionar IA_Move (2D Axis), IA_Look (2D Axis)
4. Setar Project Settings → Input → Default IMC

${h2("Fase 2: Personagem")}
${code("text")
}1. BP_FPSCharacter (herda de Character)
   - Câmera: CameraComponent (attached ao root)
   - SpringArmComponent (Third Person)
   - Mesh esqueleto (escolher UE5 Mannequin)

2. Movimento:
   - Sprint: GetCharacterMovement → MaxWalkSpeed = 1200
   - Crouch: DefaultLandMovementMode → Walking
   - Slide: Timeline + Lerp Capsule Half Height

3. Câmera:
   - FOV Interp: Timeline de 90 → 110 durante sprint
   - Head Bob: CameraShake Base no movimento

${h2("Fase 3: Armas (FPS)")}
${code("text")
}1. BP_WeaponBase:
   - SceneComponent (sockets: Muzzle, ShellEject)
   - Variables: Damage, FireRate, Ammo, MaxAmmo, ReloadTime
   - Events: Shoot, Reload, Equip

2. BP_Weapon_${isFPS ? "Rifle / Shotgun / Pistol" : "Generic"}:
   - Herda BP_WeaponBase
   - LineTrace por dano (hitscan)
   - MuzzleFlash ParticleSystem
   - Som de tiro (MetaSound)

${h2("Fase 4: Ambiente")}
${code("text")
}1. Landscape:
   - Size: 1001x1001 (ou 2001x2001 para open world)
   - Paint Layers: Grass, Dirt, Road, Rock, Mud
   - Foliagem procedural: árvores, grama, arbustos

2. Estrada:
   - SplineActor com malha de asfalto
   - Decalques de rachaduras, sujeira, marcações

3. Casas:
   - BP_AbandonedHouse (StaticMesh + interior cênico)
   - Windows: vidro quebrado, sujeira

${h2("Fase 5: Iluminação Lumen")}
${code("text")
}1. DirectionalLight:
   - Light type: Stationary
   - Intensidade: 8 lux, Temperature: 4500K (pôr do sol)
   - Cast Shadows: True, Shadow Map (ou Virtual Shadow Map)

2. SkyAtmosphere + VolumetricCloud:
   - Altura: 5-10 km
   - Densidade: 0.4, Albedo: 0.8

3. PostProcessVolume:
   - Lumen Global Illumination: Enabled
   - Lumen Reflections: Enabled
   - Bloom: 0.3, Exposure: 0.7
   - Color Grading: LUT personalizada (quente/escura)

${h2("Fase 6: Inimigos")}
${hasZombies ? code("text")
+ `1. BP_ZombieBase:
   - Herda Character
   - AI Controller: BP_ZombieAI
   - Behavior Tree: BT_Zombie

2. Behavior Tree:
   - Selector → Sequence:
     a. Patrol: MoveTo Waypoint (se sem alvo)
     b. Detect: EQS → Sense Player (visão 30m, audição 15m)
     c. Chase: MoveTo Player Location
     d. Attack: Play Montage Damage → Apply Damage

3. Blackboard Keys:
   - TargetActor (Object)
   - HomeLocation (Vector)
   - State (Enum: Patrol, Alert, Chase, Attack)

4. Spawner:
   - BP_ZombieSpawner: Spawn por timer ou proximidade
   - Max Zombies: 10-15 simultâneos`
: code("text")
+ `1. BP_EnemyBase:
   - Herda Character
   - Behavior Tree com Patrol, Alert, Chase, Combat
   - EQS para cobertura e flanqueio
   - Dificuldade adaptativa por nível do jogador`}

${h2("Fase 7: HUD e UI")}
${code("text")
}1. WBP_HUD:
   - HealthBar: ProgressBar (0-100)
   - StaminaBar: ProgressBar (dreno no sprint)
   - AmmoCount: TextBlock (munição atual / total)
   - Crosshair: Image + Spread dinâmico
   - Minimap: RenderTarget + câmera ortográfica

2. WBP_GameOver:
   - Overlay com animação fade
   - Botões: Restart, MainMenu

${h2("Fase 8: Áudio")}
${code("text")
}1. MetaSounds:
   - Ambience: floresta, vento, insetos
   - Footsteps: detecção de superfície por PhysicalMaterial
   - Weapons: tiros, recarga, impacto

2. Music:
   - AudioMixer com camadas dinâmicas
   - Intensidade por proximidade de inimigos
   - Trigger: boss, descoberta, morte

${h2("Fase 9: Otimização")}
${code("text")
}1. Nanite: StaticMeshes com alta densidade de triângulos
2. World Partition: Streaming de chunks
3. HLOD: Instâncias agrupadas em LODs
4. Culling: Distance + Frustum + Occlusion
5. Texturas: 4K para hero assets, 1K/2K para secundários

${h2("Fase 10: Build & Test")}
${code("text")
}1. Build: File → Package Project → Windows (64-bit)
2. Testar: 5 partidas completas sem crash
3. Performance: 60 FPS em RTX 3060 / RX 6600
4. Deploy: Steam (Steamworks SDK) ou Itch.io

---
${bold("Dica:")} Siga a ordem das fases. Cada fase gera um executável funcional.
Não pule fases. Teste cada implementação antes de avançar.`);
}
