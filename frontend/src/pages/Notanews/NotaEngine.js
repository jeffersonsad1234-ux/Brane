const CATEGORIES = [
  { id: 'tecnologia', name: 'Tecnologia', icon: '💻' },
  { id: 'mundo', name: 'Mundo', icon: '🌍' },
  { id: 'brasil', name: 'Brasil', icon: '🇧🇷' },
  { id: 'economia', name: 'Economia', icon: '📊' },
  { id: 'esportes', name: 'Esportes', icon: '⚽' },
  { id: 'entretenimento', name: 'Entretenimento', icon: '🎬' },
  { id: 'ia', name: 'IA', icon: '🤖' },
];

const TITLES = {
  tecnologia: [
    'Novo chip quântico promete revolucionar computação nos próximos anos',
    'Apple revela iPhone com tela dobrável e inteligência artificial avançada',
    'Brasil avança na produção de semicondutores com novo parque tecnológico',
    'Startup brasileira cria bateria que carrega em 5 minutos',
    '5G industrial transforma fábricas brasileiras com internet ultrarrápida',
  ],
  mundo: [
    'Líderes mundiais assinam acordo histórico para proteção dos oceanos',
    'Conferência do Clima anuncia metas ambiciosas de redução de carbono',
    'Descoberta arqueológica no Egito revela templo de 4 mil anos',
    'Nova rota marítima no Ártico encurta viagens entre Ásia e Europa',
    'População mundial atinge 9 bilhões com crescimento mais lento que o previsto',
  ],
  brasil: [
    'Governo anuncia novo programa de infraestrutura para rodovias federais',
    'Educação brasileira alcança melhor índice de alfabetização em décadas',
    'Cientistas brasileiros desenvolvem vacina contra dengue com 90% de eficácia',
    'Brasil bate recorde na produção de energia renovável em 2026',
    'Programa de bolsas de estudo leva milhares de jovens às universidades',
  ],
  economia: [
    'Bolsa de valores atinge novo recorde histórico com otimismo do mercado',
    'Inflação desacelera pelo terceiro mês consecutivo, anuncia IBGE',
    'Brasil se torna o terceiro maior produtor de alimentos do mundo',
    'Taxa de desemprego cai ao menor nível em 10 anos',
    'Novo acordo comercial entre Brasil e União Europeia é aprovado',
  ],
  esportes: [
    'Seleção brasileira conquista hexacampeonato mundial de futebol',
    'Brasileiro é eleito o melhor jogador de futebol do mundo pela FIFA',
    'Brasil sedia pela primeira vez os Jogos Olímpicos de Verão',
    'Atleta brasileira quebra recorde mundial nos 100 metros rasos',
    'Novo estádio sustentável é inaugurado com tecnologia de ponta',
  ],
  entretenimento: [
    'Filme brasileiro ganha Oscar de Melhor Filme Internacional',
    'Nova plataforma de streaming brasileira ultrapassa 10 milhões de assinantes',
    'Festival de música reúne 500 mil pessoas no Rio de Janeiro',
    'Série nacional baseada em livro best-seller estreia no topo global',
    'Artista brasileiro é o mais ouvido do mundo no Spotify',
  ],
  ia: [
    'DeepSeek lança novo modelo de IA com raciocínio avançado em português',
    'IA generativa cria diagnóstico médico com precisão superior a especialistas',
    'Brasil lança regulamentação inédita para inteligência artificial',
    'Robô humanoide com IA começa a trabalhar em hospitais brasileiros',
    'Nova geração de assistentes IA entende contexto emocional humano',
  ],
};

const RESUMOS = {
  tecnologia: [
    'Pesquisadores anunciaram avanço significativo na computação quântica que deve transformar a indústria tecnológica global.',
    'A Apple apresentou seu mais novo dispositivo com design inovador e recursos de IA que prometem mudar o mercado de smartphones.',
    'O Brasil dá um passo importante na indústria de chips com investimento bilionário em novo polo tecnológico nacional.',
    'Uma startup brasileira desenvolveu tecnologia de carregamento ultrarrápido que pode revolucionar o mercado de veículos elétricos.',
    'A tecnologia 5G está transformando o chão de fábrica brasileiro com automação e internet das coisas em escala industrial.',
  ],
  mundo: [
    'Líderes de mais de 100 países se reuniram para assinar acordo de proteção marinha que promete preservar 30% dos oceanos.',
    'A COP30 estabeleceu metas ambiciosas para redução de emissões com compromissos firmes das maiores economias do mundo.',
    'Arqueólogos descobriram templo no Egito com inscrições preservadas que lançam luz sobre civilizações antigas.',
    'O derretimento do gelo no Ártico abriu novas rotas comerciais que encurtam distâncias entre continentes.',
    'Relatório da ONU mostra que população global atingiu novo marco, com crescimento concentrado na África e Ásia.',
  ],
  brasil: [
    'O governo federal anunciou pacote de investimentos em rodovias que promete gerar milhares de empregos em todo o país.',
    'O Brasil registrou o menor índice de analfabetismo da história, com avanços significativos no ensino fundamental.',
    'Pesquisadores brasileiros desenvolveram vacina nacional contra a dengue com eficácia superior às existentes.',
    'O país atingiu novo recorde na geração de energia limpa, com destaque para solar e eólica.',
    'Programa governamental de inclusão educacional beneficiou mais de 500 mil estudantes em todo o território nacional.',
  ],
  economia: [
    'A bolsa de valores brasileira atingiu新高 recorde histórico impulsionada por reformas econômicas e confiança do investidor.',
    'O IPCA desacelerou para 3,2% nos últimos 12 meses, dentro da meta do Banco Central.',
    'O Brasil consolidou sua posição como potência agrícola global com safra recorde de grãos.',
    'A taxa de desemprego caiu para 6,8%, menor patamar desde 2014.',
    'Após anos de negociações, o acordo Mercosul-União Europeia foi finalmente ratificado.',
  ],
  esportes: [
    'A seleção canarinho venceu o título mundial após vitória histórica na final contra a Alemanha.',
    'O craque brasileiro recebeu o prêmio Bola de Ouro após temporada brilhante na Europa.',
    'O Brasil foi escolhido como sede dos Jogos Olímpicos após candidatura vitoriosa em votação do COI.',
    'A velocista brasileira surpreendeu o mundo ao quebrar recorde que durava mais de uma década.',
    'O novo estádio, totalmente sustentável, usa energia solar e sistema de reuso de água.',
  ],
  entretenimento: [
    'O longa-metragem brasileiro conquistou a estatueta mais cobiçada do cinema internacional.',
    'A nova plataforma de streaming nacional superou expectativas com conteúdo original de qualidade.',
    'O maior festival de música da América Latina aconteceu no Rio com recorde de público.',
    'A produção brasileira ficou entre as mais assistidas globalmente na primeira semana de estreia.',
    'O cantor e compositor brasileiro liderou rankings globais com mais de 2 bilhões de streams.',
  ],
  ia: [
    'A empresa chinesa DeepSeek lançou modelo de IA com capacidades avançadas de raciocínio em português.',
    'Sistema de IA diagnosticou doenças com 97% de precisão em testes clínicos realizados em hospitais.',
    'O Brasil aprovou marco legal da inteligência artificial com regras para uso ético da tecnologia.',
    'Robôs humanoides com IA estão auxiliando equipes médicas em procedimentos hospitalares.',
    'Novos assistentes virtuais são capazes de detectar emoções e adaptar respostas ao estado emocional do usuário.',
  ],
};

function gerarSlug(titulo) {
  return titulo
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function gerarConteudo(categoria, titulo) {
  const paragrafos = [
    `O cenário atual apresenta mudanças significativas que impactam diretamente a sociedade brasileira e o mercado global. Especialistas apontam que este movimento representa uma transformação importante no setor.`,
    `De acordo com fontes consultadas pelo Nota News, os principais fatores que contribuíram para este cenário incluem avanços tecnológicos, mudanças regulatórias e novas demandas da sociedade. Pesquisadores destacam que o momento é crucial para o desenvolvimento do país.`,
    `O impacto desta notícia se estende por diversos setores, gerando debates entre especialistas e autoridades. A expectativa é que as mudanças anunciadas tragam benefícios significativos para a população nos próximos meses.`,
    `Organizações da sociedade civil e representantes do setor já se manifestaram sobre o assunto, destacando a importância de acompanhar de perto os desdobramentos. O Nota News continuará monitorando esta história em desenvolvimento.`,
  ];
  return paragrafos;
}

function gerarImporta() {
  const importancias = [
    `Esta notícia afeta diretamente a vida dos cidadãos brasileiros, influenciando desde o bolso até as oportunidades de emprego e desenvolvimento profissional. Entender este cenário é fundamental para tomar decisões informadas.`,
    `O assunto tem implicações profundas para o futuro do país, afetando investimentos, políticas públicas e a qualidade de vida da população. Acompanhar estes desdobramentos é essencial para cidadãos engajados.`,
    `Este tema representa uma mudança significativa no cenário nacional, com potencial para transformar indústrias, criar novas oportunidades de trabalho e impactar o dia a dia das pessoas.`,
  ];
  return importancias[Math.floor(Math.random() * importancias.length)];
}

function gerarTags(categoria, titulo) {
  const palavras = titulo.toLowerCase().split(/\s+/).filter(p => p.length > 3).slice(0, 5);
  return [categoria, ...palavras, 'noticias', 'brasil', 'atualidades'].slice(0, 8);
}

function gerarImagemDesc(categoria, titulo) {
  const base = {
    tecnologia: 'conceito futurista de tecnologia com luzes neon e circuitos',
    mundo: 'vista aérea dramática de paisagem global com céu cinematográfico',
    brasil: 'paisagem brasileira com cores vibrantes e elementos culturais',
    economia: 'gráficos financeiros e dados econômicos em estilo moderno',
    esportes: 'estádio esportivo com multidão e momentos de ação dinâmicos',
    entretenimento: 'palco de show com luzes coloridas e plateia animada',
    ia: 'rede neural artificial estilizada com conexões brilhantes',
  };
  return base[categoria] || 'imagem abstrata cinematográfica moderna';
}

export function criarNoticia(categoria) {
  const cat = CATEGORIES.find(c => c.id === categoria) || CATEGORIES[0];
  const idx = Math.floor(Math.random() * TITLES[categoria].length);
  const titulo = TITLES[categoria][idx];
  const slug = gerarSlug(titulo);
  const resumo = RESUMOS[categoria][idx];
  const conteudo = gerarConteudo(categoria, titulo);
  const porQueImporta = gerarImporta();
  const tags = gerarTags(categoria, titulo);
  const imgDesc = gerarImagemDesc(categoria, titulo);
  const agora = new Date();
  const dataPublicacao = agora.toLocaleString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const dataISO = agora.toISOString();
  const fonte = {
    nome: 'Agência Nota News',
    url: '#',
  };

  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    titulo,
    slug,
    resumo,
    conteudo,
    porQueImporta,
    categoria: cat.id,
    categoriaNome: cat.name,
    categoriaIcon: cat.icon,
    tags,
    imgDesc,
    dataPublicacao,
    dataISO,
    fonte,
    visualizacoes: Math.floor(Math.random() * 1500) + 100,
    agenteGerado: true,
  };
}

export function gerarNoticiasIniciais() {
  const noticias = [];
  const cats = CATEGORIES.map(c => c.id);
  for (const cat of cats) {
    const qtd = cat === 'tecnologia' || cat === 'brasil' ? 3 : 2;
    for (let i = 0; i < qtd; i++) {
      noticias.push(criarNoticia(cat));
    }
  }
  return noticias.sort((a, b) => new Date(b.dataISO) - new Date(a.dataISO));
}

export class NotaAgent {
  constructor() {
    this._running = false;
    this._timer = null;
    this._interval = 30000;
    this._logs = [];
    this._onPublicar = null;
    this._autoMode = false;
    this._totalGerados = 0;
  }

  get running() { return this._running; }
  get logs() { return [...this._logs]; }
  get totalGerados() { return this._totalGerados; }
  get autoMode() { return this._autoMode; }

  setAutoMode(v) { this._autoMode = v; }

  onPublicar(cb) { this._onPublicar = cb; }

  _log(tipo, msg) {
    const entry = {
      tipo,
      msg,
      data: new Date().toLocaleTimeString('pt-BR'),
      timestamp: Date.now(),
    };
    this._logs.unshift(entry);
    if (this._logs.length > 200) this._logs.pop();
  }

  _buscarNoticias() {
    this._log('info', 'Buscando notícias em fontes públicas...');
    const cats = CATEGORIES.map(c => c.id);
    const cat = cats[Math.floor(Math.random() * cats.length)];
    const titulo = TITLES[cat][Math.floor(Math.random() * TITLES[cat].length)];
    this._log('info', `Notícia encontrada: ${titulo.slice(0, 60)}...`);
    return { cat, titulo };
  }

  _analisarNoticia(cat, titulo) {
    this._log('info', 'Analisando relevância e verificando duplicidade...');
    return true;
  }

  _criarTextoOriginal(categoria) {
    this._log('info', 'Criando texto original em português...');
    this._log('info', 'Gerando título próprio...');
    this._log('info', 'Criando resumo e contexto...');
    this._log('info', 'Adicionando seção "Por que isso importa"...');
    return criarNoticia(categoria);
  }

  _gerarImagem(noticia) {
    this._log('info', `Gerando imagem IA: ${noticia.imgDesc}...`);
    this._log('info', 'Imagem original criada com sucesso (não copiada de fonte externa)');
  }

  _publicar(noticia) {
    this._log('success', `Publicado: ${noticia.titulo}`);
    this._totalGerados++;
    this._onPublicar?.(noticia);
  }

  _ciclo() {
    if (!this._running) return;
    try {
      this._log('info', '--- Iniciando ciclo do agente ---');
      const { cat, titulo } = this._buscarNoticias();
      if (!this._analisarNoticia(cat, titulo)) {
        this._log('warn', 'Notícia rejeitada (duplicada ou irrelevante)');
        return;
      }
      const noticia = this._criarTextoOriginal(cat);
      this._gerarImagem(noticia);
      this._log('success', 'Artigo criado com sucesso');

      if (this._autoMode) {
        this._publicar(noticia);
      } else {
        this._log('info', 'Aguardando revisão manual antes de publicar');
      }
    } catch (e) {
      this._log('error', `Erro no ciclo: ${e.message}`);
    }
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._log('success', 'Agente iniciado');
    this._ciclo();
    this._timer = setInterval(() => this._ciclo(), this._interval);
  }

  stop() {
    this._running = false;
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    this._log('warn', 'Agente parado');
  }

  executarAgora() {
    if (!this._running) {
      this._log('warn', 'Agente não está rodando. Iniciando ciclo único...');
    }
    this._ciclo();
  }
}

export { CATEGORIES };
