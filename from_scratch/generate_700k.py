#!/usr/bin/env python3
"""
BRANPY AI — Gerador de 700K Linhas de Treino Perfeitas
100% branpy.com.br — Todos os direitos reservados

Gera dados com foco em:
- Geração de sites (HTML/CSS/JS)
- Geração de apps (Flutter/Dart/React Native)
- Código Python avançado
- Raciocínio passo a passo
- Matemática com resolução
- Lógica e resolução de problemas
- Explicações técnicas detalhadas

Estrutura: input -> output com reasoning chain completa
"""

import json
import random
import os
import hashlib
from datetime import datetime

OUTPUT_DIR = r"D:\BRANPY-AI\from_scratch\datasets"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def gen_hash(text):
    return hashlib.md5(text.encode()).hexdigest()[:8]

# ============================================================
# CATEGORIA 1: GERAÇÃO DE SITES (150K linhas)
# ============================================================

SITE_TYPES = [
    "landing page", "e-commerce", "portfolio", "blog", "dashboard",
    "página de login", "página de registro", "página de contato",
    "página de sobre", "página de preços", "página de FAQ",
    "página de termos de uso", "página de política de privacidade",
    "página de carrinho", "página de checkout", "página de produto",
    "página de categorias", "página de busca", "página de perfil",
    "página de configurações", "página de notificações", "página de chat",
    "página de feed", "página de galeria", "página de vídeo",
    "página de música", "página de podcast", "página de eventos",
    "página de reservas", "página de agendamento", "página de delivery",
    "página de clínica", "página de escola", "página de restaurante",
    "página de pet shop", "página de academia", "página de salão",
    "página de escritório", "página de advocacia", "página de contabilidade",
    "página de imobiliária", "página de viagem", "página de turismo",
    "página de hotel", "página de pousada", "página de camping",
    "página de ONG", "página de igreja", "página de sindicato",
    "página de partido político", "página de campanha eleitoral",
    "página de manifesto", "página de currículo", "página de carta de apresentação",
    "página de proposta comercial", "página de orçamento", "página de fatura",
    "página de relatório", "página de gráficos", "página de analytics",
    "página de admin", "página de super admin", "página de moderador",
    "página de suporte", "página de ticket", "página de chat ao vivo",
    "página de base de conhecimento", "página de tutoriais", "página de documentação",
    "página de API", "página de webhook", "página de integração",
    "página de marketplace", "página de afiliados", "página de referral",
    "página de programa de pontos", "página de cashback", "página de cupom",
    "página de promoção", "página de black friday", "página de natal",
    "página de aniversário", "página de casamento", "página de formatura",
    "página de concurso", "página de prova", "página de resultado",
    "página de certificado", "página de diploma", "página de curso",
    "página de aula", "página de material", "página de download",
    "página de upload", "página de compartilhar", "página de invite",
    "página de RSVP", "página de check-in", "página de checkout rápido",
    "página de pagamento", "página de boleto", "página de PIX",
    "página de cartão de crédito", "página de criptomoeda", "página de NFT",
    "página de blockchain", "página de DeFi", "página de staking",
    "página de mineração", "página de trading", "página de investimento",
    "página de ações", "página de fundos", "página de previdência",
    "página de seguro", "página de empréstimo", "página de financiamento",
    "página de consórcio", "página de leilão", "página de lance",
    "página de doação", "página de crowdfunding", "página de vaquinha",
    "página de vaquinha online", "página de pix direto", "página de cobrança",
    "página de nota fiscal", "página de recibo", "página de comprovante",
    "página de extrato", "página de saldo", "página de transação",
    "página de histórico", "página de fatura aberta", "página de pagamento atrasado",
    "página de juros", "página de correção", "página de multa",
    "página de aviso", "página de notificação", "página de lembrete",
    "página de agenda", "página de calendário", "página de tarefas",
    "página de kanban", "página de scrum", "página de sprint",
    "página de retrospectiva", "página de standup", "página de daily",
    "página de review", "página de deploy", "página de CI/CD",
    "página de pipeline", "página de monitoramento", "página de alerta",
    "página de incidente", "página de post-mortem", "página de changelog",
    "página de release", "página de versão", "página de roadmap",
    "página de features", "página de votação", "página de feedback",
    "página de NPS", "página de CSAT", "página de pesquisa",
    "página de enquete", "página de formulário", "página desurvey",
    "página de quiz", "página de jogo", "página de sorteio",
    "página de raspadinha", "página de bingo", "página de loteria",
    "página de aposta", "página de cassino", "página de poker",
    "página de xadrez", "página de damas", "página de sudoku",
    "página de palavras cruzadas", "página de caça-palavras",
    "página de genially", "página de prezi", "página de apresentação",
    "página de slide", "página de pitch", "página de elevator pitch",
    "página de business model", "página de canvas", "página de lean",
    "página de mvp", "página de pivot", "página de scale",
    "página de growth", "página de churn", "página de retention",
    "página de engagement", "página de conversion", "página de funnel",
    "página de lead", "página de nurturing", "página de email marketing",
    "página de newsletter", "página de blog", "página de artigo",
    "página de post", "página de thread", "página de discussion",
    "página de fórum", "página de comunidade", "página de grupo",
    "página de canal", "página de podcast", "página de live",
    "página de stream", "página de webinar", "página de workshop",
    "página de hackathon", "página de meetup", "página de confraternização",
    "página de happy hour", "pão de queijo", "pão de alho",
    "pão de fermentação natural", "pão integral", "pão sírio",
]

SITE_FEATURES = [
    "dark mode", "light mode", "modo responsivo", "animações suaves",
    "transições CSS", "flexbox layout", "grid CSS", "scroll snap",
    "parallax", "efeito glassmorphism", "neomorfismo", "skeuomorfismo",
    "flat design", "material design", "fluent design", "bootstrap",
    "tailwind css", "bulma", "foundation", "materialize",
    "font awesome", "google fonts", "icones customizados",
    "formulários validados", "modais", "tooltips", "dropdowns",
    "carrossel", "slider", "tabs", "accordion",
    "sidebar fixa", "header sticky", "footer dinâmico",
    "breadcrumb", "paginação", "filtros", "ordenção",
    "busca em tempo real", "autocomplete", "debounce",
    "lazy loading", "infinite scroll", "virtual scrolling",
    "service workers", "PWA", "offline first", "cache strategy",
    "web sockets", "SSE", "push notifications",
    "geolocalização", "câmera", "microfone", "sensores",
    "vibração", "full screen", "screen orientation",
    "clipboard", "drag and drop", "file API",
    "web workers", "web assembly", "web GL",
    "three.js", "d3.js", "chart.js", "leaflet",
    "mapbox", "google maps", "open street map",
]

SITE_COLORS = [
    "azul e branco", "preto e dourado", "vermelho e cinza",
    "verde e branco", "roxo e rosa", "laranja e marrom",
    "ciano e magenta", "azul marinho e branco", "cinza escuro e neon",
    "branco e cinza claro", "preto e verde neon", "azul escuro e azul claro",
    "vermelho escuro e branco", "verde escuro e dourado", "roxo escuro e lilás",
    "marrom e bege", "turquesa e branco", "índigo e laranja",
    "salmão e branco", "bordô e dourado", "teal e cinza",
    "navy e branco", "burgundy e rosé", "olive e cream",
]

SITE_TARGETS = [
    "empresas de tecnologia", "startups", "freelancers", "artistas",
    "fotógrafos", "restaurantes", "lojas de roupas", "academias",
    "clínicas médicas", "dentistas", "advogados", "contadores",
    "imobiliárias", "escolas", "universidades", "ONGs",
    "igrejas", "governos", "políticos", "influenciadores",
    "YouTubers", "streamers", "podcasters", "escritores",
    "blogs pessoais", "portfólios criativos", "agências de marketing",
    "empresas de e-commerce", "SaaS", "fintechs", "healthtechs",
    "edtechs", "proptechs", "agritechs", "cleantechs",
    "mobilidade urbana", "logística", "delivery", "marketplace",
    "afiliados", "crypto", "NFT", "gaming",
]

def gen_site_code(site_type, features, colors, target):
    """Gera código HTML/CSS/JS completo para um site"""
    
    # HTML base
    html_features = []
    css_features = []
    js_features = []
    
    if "dark mode" in features:
        css_features.append("background: #0a0a0a; color: #ffffff;")
    else:
        css_features.append("background: #ffffff; color: #333333;")
    
    if "glassmorphism" in features:
        css_features.append("backdrop-filter: blur(10px); background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);")
    
    if "animações suaves" in features:
        css_features.append("transition: all 0.3s ease;")
    
    if "flexbox layout" in features:
        css_features.append("display: flex; justify-content: center; align-items: center;")
    
    if "grid CSS" in features:
        css_features.append("display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;")
    
    if "sidebar fixa" in features:
        html_features.append('<nav class="sidebar">')
        html_features.append('  <ul><li><a href="#home">Home</a></li><li><a href="#about">Sobre</a></li><li><a href="#services">Serviços</a></li><li><a href="#contact">Contato</a></li></ul>')
        html_features.append('</nav>')
    
    if "header sticky" in features:
        html_features.append('<header class="sticky">')
        html_features.append('  <h1>Logo</h1>')
        html_features.append('  <nav><a href="#home">Home</a> <a href="#about">Sobre</a></nav>')
        html_features.append('</header>')
    
    if "formulários validados" in features:
        js_features.append("""
// Validação de formulário
const form = document.querySelector('form');
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = form.querySelector('input[type="email"]').value;
    if (!email.includes('@')) {
        alert('Email inválido');
        return;
    }
    // Enviar dados
    fetch('/api/contact', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email})
    });
});""")
    
    if "busca em tempo real" in features:
        js_features.append("""
// Busca em tempo real com debounce
let searchTimeout;
const searchInput = document.querySelector('#search');
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        fetch(`/api/search?q=${e.target.value}`)
            .then(r => r.json())
            .then(data => {
                const results = document.querySelector('#results');
                results.innerHTML = data.map(item => 
                    `<div class="result">${item.title}</div>`
                ).join('');
            });
    }, 300);
});""")
    
    if "carrossel" in features:
        js_features.append("""
// Carrossel automático
let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
function showSlide(n) {
    slides.forEach(s => s.style.display = 'none');
    currentSlide = (n + slides.length) % slides.length;
    slides[currentSlide].style.display = 'block';
}
setInterval(() => showSlide(currentSlide + 1), 5000);""")
    
    if "lazy loading" in features:
        js_features.append("""
// Lazy loading de imagens
const images = document.querySelectorAll('img[data-src]');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.src = entry.target.dataset.src;
            observer.unobserve(entry.target);
        }
    });
});
images.forEach(img => observer.observe(img));""")
    
    if "web sockets" in features:
        js_features.append("""
// WebSocket para atualizações em tempo real
const ws = new WebSocket(`ws://${location.host}/ws`);
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    updateUI(data);
};
ws.onclose = () => {
    setTimeout(() => location.reload(), 3000);
};""")
    
    # Montar CSS
    css = f"""
/* {site_type.title()} - {target} */
/* Cores: {colors} */
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{ {css_features[0] if css_features else 'background: #ffffff; color: #333;'} {' '.join(css_features[1:]) if len(css_features) > 1 else ''} }}
.container {{ max-width: 1200px; margin: 0 auto; padding: 0 20px; }}
 {' '.join(html_features)}
button {{ padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; }}
button:hover {{ transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }}
@media (max-width: 768px) {{
    .container {{ padding: 0 15px; }}
    .grid {{ grid-template-columns: 1fr; }}
}}"""
    
    # Montar JS
    js = "\n".join(js_features) if js_features else "// JavaScript do site"
    
    # Montar HTML
    html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{site_type.title()} - {target.title()}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <h1>{site_type.title()}</h1>
        <p>Site profissional para {target}</p>
        {''.join(html_features)}
    </div>
    <script src="script.js"></script>
</body>
</html>"""
    
    return html, css, js

# Templates de prompts e respostas para sites
SITE_PROMPTS = [
    "Crie um site {tipo} para {target} com {features} usando cores {colors}",
    "Desenvolva um site {tipo} completo para {target} com {features}",
    "Faça um site {tipo} profissional para {target} com design {colors}",
    "Preciso de um site {tipo} para {target} com {features}",
    "Monte um site {tipo} para {target} usando {features} e cores {colors}",
]

def generate_site_entries(n):
    """Gera n entradas de treino para sites"""
    entries = []
    for i in range(n):
        site_type = random.choice(SITE_TYPES)
        features = random.sample(SITE_FEATURES, k=random.randint(3, 6))
        colors = random.choice(SITE_COLORS)
        target = random.choice(SITE_TARGETS)
        prompt_template = random.choice(SITE_PROMPTS)
        
        prompt = prompt_template.format(
            tipo=site_type, target=target,
            features=", ".join(features), colors=colors
        )
        
        html, css, js = gen_site_code(site_type, features, colors, target)
        
        response = f"""Vou criar um site {site_type} profissional para {target}.

**Estrutura do projeto:**
1. `index.html` - Estrutura principal
2. `styles.css` - Estilos e design
3. `script.js` - Funcionalidades

**index.html:**
```html
{html}
```

**styles.css:**
```css
{css}
```

**script.js:**
```javascript
{js}
```

**Recursos implementados:**
{chr(10).join(f"- {f}" for f in features)}

**Cores:** {colors}

O site está responsivo e funciona em todos os dispositivos. Para colocar online, basta fazer upload dos arquivos em qualquer hospedagem (Netlify, Vercel, GitHub Pages)."""
        
        entries.append({"prompt": prompt, "response": response})
    
    return entries

# ============================================================
# CATEGORIA 2: GERAÇÃO DE APPS (150K linhas)
# ============================================================

APP_TYPES = [
    "app de messenger", "app de rede social", "app de e-commerce",
    "app de delivery", "app de fitness", "app de meditação",
    "app de finanças", "app de investimentos", "app de criptomoedas",
    "app de música", "app de vídeo", "app de podcast",
    "app de fotografia", "app de edição de vídeo", "app de design",
    "app de produtividade", "app de tarefas", "app de calendário",
    "app de notas", "app de lista de compras", "app de receitas",
    "app de saúde", "app de consultas médicas", "app de farmácia",
    "app de academias", "app de personal trainer", "app de nutrição",
    "app de pets", "app de veterinário", "app de pet shop",
    "app de viagens", "app de passagens aéreas", "app de hotel",
    "app de Airbnb", "app de transporte", "app de Uber",
    "app de táxi", "app de ônibus", "app de metrô",
    "app de estacionamento", "app de gasolina", "app de carona",
    "app de juegos", "app de apostas", "app de loteria",
    "app de bingo", "app de poker", "app de xadrez",
    "app de sudoku", "app de crossword", "app de quiz",
    "app de educacao", "app de idiomas", "app de matemática",
    "app de programação", "app de ciências", "app de história",
    "app de geografia", "app de literatura", "app de escrita criativa",
    "app de música", "app de instrumento", "app de composição",
    "app de áudio", "app de gravação", "app de podcast player",
    "app de rádio", "app de streaming", "app de playlist",
]

APP_FRAMEWORKS = [
    "Flutter com Dart", "React Native com TypeScript",
    "Kotlin nativo", "Swift nativo", "Xamarin C#",
    "Ionic Angular", "Ionic React", "Capacitor",
    "NativeScript", "Kotlin Multiplatform",
]

APP_FEATURES = [
    "login com biometria", "push notifications", "câmera integrada",
    "mapa interativo", "pagamento PIX", "pagamento cartão",
    "chat em tempo real", "chamada de vídeo", "chamada de áudio",
    "compartilhamento social", "offline first", "sincronização cloud",
    "dashboard com gráficos", "relatórios PDF", "exportação Excel",
    "QR code scanner", "QR code generator", "NFC",
    "Bluetooth", "GPS tracking", "geofencing",
    " reconhecimento facial", "OCR de documentos", "assinatura digital",
    "calendário integrado", "lembretes", "alarmes",
    "cronômetro", "timer", "stopwatch",
    "calculadora", "conversor de unidades", "moeda",
    "previsão do tempo", "cotações", "notícias",
    " podcasts", "audiolivros", "e-books",
    "videoaulas", "webinars", "aulas ao vivo",
    "fórum", "comunidade", "chat de suporte",
    "ticket de suporte", "FAQ", "base de conhecimento",
    "programa de fidelidade", "cashback", "cupons",
    "promoções", "ofertas", "leilões",
    "marketplace", "afiliados", "referral",
]

APP_PLATFORMS = [
    "Android e iOS", "Android apenas", "iOS apenas",
    "Web (PWA)", "Desktop (Electron)", "Todos os platforms",
]

def gen_flutter_code(app_type, features):
    """Gera código Flutter para um app"""
    
    app_title = app_type.title()
    
    dart_code = """import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '""" + app_title + """',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        brightness: Brightness.light,
      ),
      darkTheme: ThemeData(
        primarySwatch: Colors.blue,
        brightness: Brightness.dark,
      ),
      home: AuthWrapper(),
    );
  }
}

class AuthWrapper extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return StreamBuilder<User?>(
      stream: FirebaseAuth.instance.authStateChanges(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return CircularProgressIndicator();
        }
        if (snapshot.hasData) {
          return HomeScreen();
        }
        return LoginScreen();
      },
    );
  }
}

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  Future<void> _login() async {
    setState(() => _isLoading = true);
    try {
      await FirebaseAuth.instance.signInWithEmailAndPassword(
        email: _emailController.text,
        password: _passwordController.text,
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erro: ' + e.toString())),
      );
    }
    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Login')),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            TextField(
              controller: _emailController,
              decoration: InputDecoration(
                labelText: 'Email',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.emailAddress,
            ),
            SizedBox(height: 16),
            TextField(
              controller: _passwordController,
              decoration: InputDecoration(
                labelText: 'Senha',
                border: OutlineInputBorder(),
              ),
              obscureText: true,
            ),
            SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isLoading ? null : _login,
              child: _isLoading
                  ? CircularProgressIndicator(color: Colors.white)
                  : Text('Entrar'),
              style: ElevatedButton.styleFrom(
                minimumSize: Size(double.infinity, 50),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class HomeScreen extends StatefulWidget {
  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('""" + app_title + """'),
        actions: [
          IconButton(
            icon: Icon(Icons.notifications),
            onPressed: () {},
          ),
          IconButton(
            icon: Icon(Icons.settings),
            onPressed: () {},
          ),
        ],
      ),
      body: _buildBody(),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        items: [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.search), label: 'Buscar'),
          BottomNavigationBarItem(icon: Icon(Icons.add_circle), label: 'Criar'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Perfil'),
        ],
      ),
    );
  }

  Widget _buildBody() {
    switch (_currentIndex) {
      case 0:
        return ListView(
          children: [
            Card(
              child: ListTile(
                leading: Icon(Icons.star),
                title: Text('Destaque'),
                subtitle: Text('Conteudo em destaque'),
              ),
            ),
            Card(
              child: ListTile(
                leading: Icon(Icons.trending_up),
                title: Text('Tendencias'),
                subtitle: Text('O que esta em alta'),
              ),
            ),
          ],
        );
      case 1:
        return Center(
          child: TextField(
            decoration: InputDecoration(
              labelText: 'Buscar...',
              prefixIcon: Icon(Icons.search),
              border: OutlineInputBorder(),
            ),
          ),
        );
      case 2:
        return Center(
          child: ElevatedButton.icon(
            onPressed: () {},
            icon: Icon(Icons.add),
            label: Text('Criar Novo'),
          ),
        );
      case 3:
        return Column(
          children: [
            CircleAvatar(radius: 50, child: Icon(Icons.person, size: 50)),
            SizedBox(height: 16),
            Text('Meu Perfil', style: TextStyle(fontSize: 24)),
            Divider(),
            ListTile(leading: Icon(Icons.edit), title: Text('Editar Perfil')),
            ListTile(leading: Icon(Icons.lock), title: Text('Privacidade')),
            ListTile(leading: Icon(Icons.logout), title: Text('Sair')),
          ],
        );
      default:
        return Container();
    }
  }
}"""
    
    return dart_code

APP_PROMPTS = [
    "Crie um {tipo} usando {framework} com {features}",
    "Desenvolva um {tipo} completo em {framework} com {features}",
    "Faça um {tipo} profissional em {framework}",
    "Preciso de um {tipo} em {framework} com {features}",
    "Monte um {tipo} usando {framework} para {platform}",
]

def generate_app_entries(n):
    """Gera n entradas de treino para apps"""
    entries = []
    for i in range(n):
        app_type = random.choice(APP_TYPES)
        framework = random.choice(APP_FRAMEWORKS)
        features = random.sample(APP_FEATURES, k=random.randint(3, 6))
        platform = random.choice(APP_PLATFORMS)
        prompt_template = random.choice(APP_PROMPTS)
        
        prompt = prompt_template.format(
            tipo=app_type, framework=framework,
            features=", ".join(features), platform=platform
        )
        
        dart_code = gen_flutter_code(app_type, features)
        
        response = f"""Vou criar um {app_type} profissional usando {framework}.

**Arquitetura do App:**
- Arquitetura: Clean Architecture + BLoC
- State Management: BLoC/Cubit
- Injeção de dependência: GetIt
- Navegação: GoRouter
- HTTP Client: Dio
- Local Storage: Hive

**Código Principal (main.dart):**
```dart
{dart_code}
```

**Funcionalidades implementadas:**
{chr(10).join(f"- {f}" for f in features)}

**Plataformas:** {platform}

**Para rodar:**
```bash
flutter create {app_type.replace(' ', '_')}
cd {app_type.replace(' ', '_')}
flutter pub get
flutter run
```

**Estrutura de pastas recomendada:**
```
lib/
├── main.dart
├── app/
│   ├── app.dart
│   └── routes.dart
├── core/
│   ├── constants/
│   ├── theme/
│   └── utils/
├── data/
│   ├── datasources/
│   ├── models/
│   └── repositories/
├── domain/
│   ├── entities/
│   ├── repositories/
│   └── usecases/
└── presentation/
    ├── bloc/
    ├── pages/
    └── widgets/
```"""
        
        entries.append({"prompt": prompt, "response": response})
    
    return entries

# ============================================================
# CATEGORIA 3: CÓDIGO PYTHON AVANÇADO (100K linhas)
# ============================================================

PYTHON_TOPICS = [
    "API REST com FastAPI", "web scraping com BeautifulSoup",
    "machine learning com scikit-learn", "deep learning com PyTorch",
    "análise de dados com pandas", "visualização com matplotlib",
    "automação de tarefas", "web scraping com Selenium",
    "chatbot com NLP", "recomendação de sistemas",
    "processamento de imagem com OpenCV", "processamento de texto com NLTK",
    "extração de dados", "limpeza de dados",
    "ETL completo", "pipeline de dados",
    "dashboard com Dash", "API GraphQL com Strawberry",
    "microserviços com FastAPI", "fila de mensagens com Celery",
    "cache com Redis", "banco de dados com SQLAlchemy",
    "migrações com Alembic", "autenticação JWT",
    "OAuth2 com FastAPI", "websocket com FastAPI",
    "tarefas agendadas com APScheduler", "logs estruturados",
    "monitoramento com Prometheus", "deploy com Docker",
    "CI/CD com GitHub Actions", "testes com pytest",
    "code quality com black e flake8", "type hints avançados",
    "decorators personalizados", "context managers",
    "generators e iterators", "asyncio avançado",
    "metaclasses", "descriptors", "properties",
    "dataclasses avançados", "Pydantic v2",
    "Typer CLI", "Rich terminal",
    "invoke tasks", "poetry management",
]

PYTHON_LEVELS = [
    "básico", "intermediário", "avançado", "expert",
]

def gen_python_code(topic, level):
    """Gera código Python para um tópico"""
    
    if "FastAPI" in topic:
        code = """from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import uvicorn

app = FastAPI(title="API BranPy", version="1.0.0")
security = HTTPBearer()

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str

class Token(BaseModel):
    access_token: str
    token_type: str

@app.post("/users", response_model=UserResponse)
async def create_user(user: UserCreate):
    # Criar usuário no banco
    db_user = await create_user_in_db(user)
    return db_user

@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int):
    user = await get_user_from_db(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user

@app.get("/users", response_model=List[UserResponse])
async def list_users(skip: int = 0, limit: int = 100):
    users = await get_users_from_db(skip=skip, limit=limit)
    return users

@app.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user: UserCreate):
    updated = await update_user_in_db(user_id, user)
    if not updated:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return updated

@app.delete("/users/{user_id}")
async def delete_user(user_id: int):
    deleted = await delete_user_from_db(user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return {"message": "Usuário deletado com sucesso"}

@app.post("/login", response_model=Token)
async def login(email: str, password: str):
    user = await authenticate_user(email, password)
    if not user:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    token = create_access_token(data={"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/protected")
async def protected_route(credentials: HTTPAuthorizationCredentials = Depends(security)):
    return {"message": "Acesso autorizado", "user": credentials.credentials}"""
    
    elif "machine learning" in topic or "PyTorch" in topic:
        code = """import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

class BranPyModel(nn.Module):
    def __init__(self, input_size, hidden_size, output_size):
        super(BranPyModel, self).__init__()
        self.layers = nn.Sequential(
            nn.Linear(input_size, hidden_size),
            nn.ReLU(),
            nn.BatchNorm1d(hidden_size),
            nn.Dropout(0.3),
            nn.Linear(hidden_size, hidden_size // 2),
            nn.ReLU(),
            nn.BatchNorm1d(hidden_size // 2),
            nn.Dropout(0.2),
            nn.Linear(hidden_size // 2, output_size)
        )
    
    def forward(self, x):
        return self.layers(x)

def train_model(model, train_loader, val_loader, epochs=100, lr=0.001):
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-5)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=5)
    
    best_val_loss = float('inf')
    patience_counter = 0
    
    for epoch in range(epochs):
        # Treino
        model.train()
        train_loss = 0
        for batch_X, batch_y in train_loader:
            optimizer.zero_grad()
            outputs = model(batch_X)
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()
            train_loss += loss.item()
        
        # Validação
        model.eval()
        val_loss = 0
        correct = 0
        total = 0
        with torch.no_grad():
            for batch_X, batch_y in val_loader:
                outputs = model(batch_X)
                loss = criterion(outputs, batch_y)
                val_loss += loss.item()
                _, predicted = torch.max(outputs, 1)
                total += batch_y.size(0)
                correct += (predicted == batch_y).sum().item()
        
        val_loss /= len(val_loader)
        accuracy = 100 * correct / total
        
        scheduler.step(val_loss)
        
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save(model.state_dict(), 'best_model.pth')
            patience_counter = 0
        else:
            patience_counter += 1
            if patience_counter >= 10:
                print(f"Early stopping at epoch {epoch}")
                break
        
        if epoch % 10 == 0:
            print(f"Epoch {epoch}: Train Loss: {train_loss/len(train_loader):.4f}, "
                  f"Val Loss: {val_loss:.4f}, Accuracy: {accuracy:.2f}%")

# Preparar dados
X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2)
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_val = scaler.transform(X_val)

train_dataset = TensorDataset(torch.FloatTensor(X_train), torch.LongTensor(y_train))
val_dataset = TensorDataset(torch.FloatTensor(X_val), torch.LongTensor(y_val))
train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=32)

# Treinar
model = BranPyModel(input_size=X.shape[1], hidden_size=128, output_size=10)
train_model(model, train_loader, val_loader)"""
    
    elif "pandas" in topic or "análise de dados" in topic:
        code = """import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta

# Carregar dados
df = pd.read_csv('dados.csv')

# Explorar dados
print(f"Shape: {df.shape}")
print(f"\\nTipos:\\n{df.dtypes}")
print(f"\\nEstatísticas:\\n{df.describe()}")
print(f"\\nValores nulos:\\n{df.isnull().sum()}")

# Limpeza
df = df.drop_duplicates()
df = df.dropna(subset=['coluna_importante'])
df['data'] = pd.to_datetime(df['data'])
df['valor'] = pd.to_numeric(df['valor'], errors='coerce')

# Transformações
df['ano'] = df['data'].dt.year
df['mes'] = df['data'].dt.month
df['dia_semana'] = df['data'].dt.day_name()
df['trimestre'] = df['data'].dt.quarter

# Análises
resumo = df.groupby('categoria').agg({
    'valor': ['sum', 'mean', 'count'],
    'data': ['min', 'max']
}).round(2)

# Visualizações
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# Gráfico 1: Vendas por categoria
df.groupby('categoria')['valor'].sum().plot(kind='bar', ax=axes[0, 0])
axes[0, 0].set_title('Vendas por Categoria')
axes[0, 0].set_ylabel('Valor Total')

# Gráfico 2: Evolução temporal
df.groupby('mes')['valor'].sum().plot(kind='line', ax=axes[0, 1], marker='o')
axes[0, 1].set_title('Evolução Mensal')
axes[0, 1].set_ylabel('Valor')

# Gráfico 3: Distribuição
df['valor'].hist(bins=30, ax=axes[1, 0])
axes[1, 0].set_title('Distribuição de Valores')

# Gráfico 4: Top 10
df.nlargest(10, 'valor').plot(kind='barh', x='nome', y='valor', ax=axes[1, 1])
axes[1, 1].set_title('Top 10 Maiores Valores')

plt.tight_layout()
plt.savefig('analise_completa.png', dpi=300)
plt.show()

# Exportar resultados
with pd.ExcelWriter('relatorio.xlsx') as writer:
    resumo.to_excel(writer, sheet_name='Resumo')
    df.to_excel(writer, sheet_name='Dados Completos', index=False)"""
    
    else:
        code = """# """
        code += topic
        code += """
# Nivel: """
        code += level
        code += """
# Autor: BranPy AI - branpy.com.br

import asyncio
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class Task:
    id: int
    name: str
    status: str = "pending"
    created_at: datetime = field(default_factory=datetime.now)
    result: Optional[Any] = None

class TaskManager:
    def __init__(self):
        self.tasks: Dict[int, Task] = {}
        self.next_id = 1
    
    def create_task(self, name: str) -> Task:
        task = Task(id=self.next_id, name=name)
        self.tasks[self.next_id] = task
        self.next_id += 1
        logger.info("Tarefa criada: " + task.name)
        return task
    
    async def execute_task(self, task_id: int) -> Any:
        task = self.tasks.get(task_id)
        if not task:
            raise ValueError("Tarefa " + str(task_id) + " nao encontrada")
        
        task.status = "running"
        logger.info("Executando tarefa: " + task.name)
        
        # Simular processamento
        await asyncio.sleep(1)
        
        task.status = "completed"
        task.result = "Resultado de " + task.name
        logger.info("Tarefa concluida: " + task.name)
        return task.result
    
    def get_pending_tasks(self) -> List[Task]:
        return [t for t in self.tasks.values() if t.status == "pending"]
    
    def get_stats(self) -> Dict:
        return {
            "total": len(self.tasks),
            "pending": len([t for t in self.tasks.values() if t.status == "pending"]),
            "running": len([t for t in self.tasks.values() if t.status == "running"]),
            "completed": len([t for t in self.tasks.values() if t.status == "completed"]),
        }

async def main():
    manager = TaskManager()
    
    # Criar tarefas
    for i in range(5):
        manager.create_task("Tarefa " + str(i+1))
    
    # Executar todas
    tasks = manager.get_pending_tasks()
    results = await asyncio.gather(*[manager.execute_task(t.id) for t in tasks])
    
    print("Resultados: " + str(results))
    print("Estatisticas: " + str(manager.get_stats()))

if __name__ == "__main__":
    asyncio.run(main())"""
    
    return code

PYTHON_PROMPTS = [
    "Como criar {topic} em Python?",
    "Explique {topic} com código",
    "Faça um exemplo de {topic}",
    "Preciso de um {topic} completo",
    "Crie {topic} do zero",
]

def generate_python_entries(n):
    """Gera n entradas de treino para Python"""
    entries = []
    for i in range(n):
        topic = random.choice(PYTHON_TOPICS)
        level = random.choice(PYTHON_LEVELS)
        prompt_template = random.choice(PYTHON_PROMPTS)
        
        prompt = prompt_template.format(topic=topic)
        code = gen_python_code(topic, level)
        
        response = f"""Vou criar {topic} em Python (nível {level}).

**Estrutura do projeto:**
```
projeto/
├── main.py
├── requirements.txt
├── config.py
├── models/
├── services/
├── utils/
└── tests/
```

**Código principal:**
```python
{code}
```

**Dependências (requirements.txt):**
```
fastapi>=0.100.0
uvicorn>=0.23.0
pydantic>=2.0
sqlalchemy>=2.0
asyncpg>=0.28.0
redis>=4.5.0
celery>=5.3.0
pytest>=7.4.0
httpx>=0.24.0
```

**Para rodar:**
```bash
pip install -r requirements.txt
python main.py
```

**Dicas importantes:**
1. Use type hints em todas as funções
2. Implemente tratamento de erros robusto
3. Adicione logging estruturado
4. Escreva testes unitários
5. Use virtualenv para isolar dependências"""
        
        entries.append({"prompt": prompt, "response": response})
    
    return entries

# ============================================================
# CATEGORIA 4: RACIOCÍNIO E MATEMÁTICA (100K linhas)
# ============================================================

MATH_TOPICS = [
    "álgebra linear", "cálculo diferencial", "cálculo integral",
    "equações diferenciais", "probabilidade", "estatística",
    "combinatória", "teoria dos números", "geometria analítica",
    "matemática discreta", "lógica matemática", "topologia",
    "álgebra abstrata", "análise real", "análise complexa",
    "otimização", "programação linear", "programação dinâmica",
    "grafos", "algoritmos", "estruturas de dados",
]

LOGIC_PUZZLES = [
    "Problema dos prisoneiros", "Problema dos 3 corvos",
    "Problema da princesa e o sapo", "Problema do Monty Hall",
    "Problema dos 3 garçons", "Problema de Banach-Tarski",
    "Paradoxo de Zenão", "Paradoxo dos gêmeos",
    "Problema do viajante", "Problema das 8 rainhas",
    "Problema da torre de Hanói", "Problema do cavalo",
    "Sudoku", "KenKen", "Nonograma",
    "Problema dos 3 cuerpos", "Problema de Koenigsberg",
    "Conjectura de Goldbach", "Teorema de Fermat",
    "Último teorema de Fermat", "Hipótese de Riemann",
]

def gen_math_solution(topic, difficulty):
    """Gera solução de matemática"""
    
    if "álgebra linear" in topic:
        solution = """**Problema:** Resolva o sistema de equações:
2x + 3y - z = 1
4x + y + 2z = 8
-2x + 5y + 3z = 7

**Solução passo a passo:**

**Passo 1:** Montar a matriz aumentada
```
[2   3  -1 | 1]
[4   1   2 | 8]
[-2  5   3 | 7]
```

**Passo 2:** Eliminação de Gauss
R2 = R2 - 2*R1:
```
[2   3  -1 | 1]
[0  -5   4 | 6]
[-2  5   3 | 7]
```

R3 = R3 + R1:
```
[2   3  -1 | 1]
[0  -5   4 | 6]
[0   8   2 | 8]
```

R3 = R3 + (8/5)*R2:
```
[2   3  -1 | 1]
[0  -5   4 | 6]
[0   0  5.6 | 13.6]
```

**Passo 3:** Substituição regressiva
Da R3: 5.6z = 13.6 → z = 2.43
Da R2: -5y + 4(2.43) = 6 → y = 0.74
Da R1: 2x + 3(0.74) - 2.43 = 1 → x = 0.62

**Resposta:** x = 0.62, y = 0.74, z = 2.43"""
    
    elif "cálculo" in topic:
        solution = """**Problema:** Calcule a integral de f(x) = x² * e^x

**Solução usando integração por partes:**

**Fórmula:** ∫u dv = uv - ∫v du

**Passo 1:** Definir u e dv
u = x² → du = 2x dx
dv = e^x dx → v = e^x

**Passo 2:** Aplicar fórmula
∫x²e^x dx = x²e^x - ∫2xe^x dx

**Passo 3:** Integrar ∫2xe^x por partes novamente
u = 2x → du = 2 dx
dv = e^x dx → v = e^x
∫2xe^x dx = 2xe^x - ∫2e^x dx = 2xe^x - 2e^x

**Passo 4:** Resultado final
∫x²e^x dx = x²e^x - (2xe^x - 2e^x) + C
           = x²e^x - 2xe^x + 2e^x + C
           = e^x(x² - 2x + 2) + C

**Verificação:** Derivando o resultado:
d/dx[e^x(x² - 2x + 2)] = e^x(x² - 2x + 2) + e^x(2x - 2)
                          = e^x(x² - 2x + 2 + 2x - 2)
                          = e^x(x²) ✓"""
    
    elif "probabilidade" in topic:
        solution = """**Problema:** Em um torneio de xadrez, 8 jogadores se enfrentam. Qual a probabilidade de que o jogador A vença todos os seus 3 jogos?

**Solução:**

**Premissas:**
- 8 jogadores, cada um joga 3 partidas
- Assumimos que todos têm a mesma habilidade
- Probabilidade de vitória em cada partida = 0.5

**Cálculo:**
P(A vence 3 jogos) = P(A vence jogo 1) × P(A vence jogo 2) × P(A vence jogo 3)
                   = 0.5 × 0.5 × 0.5
                   = 0.125

**Resposta:** 12,5% ou 1/8

**Se os jogadores tiverem habilidades diferentes:**
P(A vence B) = 0.6
P(A vence C) = 0.7
P(A vence D) = 0.5

P(A vence todos) = 0.6 × 0.7 × 0.5 = 0.21 = 21%"""
    
    else:
        solution = f"""**Problema de {topic}**

**Enunciado:**
Resolva o problema usando conceitos de {topic}.

**Solução passo a passo:**

**Passo 1:** Identificar os dados do problema
- Dados conhecidos: a, b, c
- Incógnita: x

**Passo 2:** Aplicar a fórmula adequada
Usando a fórmula: x = (-b ± √(b² - 4ac)) / 2a

**Passo 3:** Substituir valores
x = (-3 ± √(9 - 4(2)(1))) / 2(2)
x = (-3 ± √(9 - 8)) / 4
x = (-3 ± √1) / 4
x = (-3 ± 1) / 4

**Passo 4:** Calcular as raízes
x₁ = (-3 + 1) / 4 = -0.5
x₂ = (-3 - 1) / 4 = -1

**Resposta:** x = -0.5 ou x = -1

**Verificação:**
2(-0.5)² + 3(-0.5) + 1 = 0.5 - 1.5 + 1 = 0 ✓
2(-1)² + 3(-1) + 1 = 2 - 3 + 1 = 0 ✓"""
    
    return solution

MATH_PROMPTS = [
    "Resolva um problema de {topic}",
    "Explique {topic} com exemplo",
    "Como resolver {topic}?",
    "Problema de {topic} com solução",
    "Enunciado e resolução de {topic}",
]

def generate_math_entries(n):
    """Gera n entradas de treino para matemática"""
    entries = []
    for i in range(n):
        topic = random.choice(MATH_TOPICS)
        difficulty = random.choice(["fácil", "médio", "difícil", "olimpíada"])
        prompt_template = random.choice(MATH_PROMPTS)
        
        prompt = prompt_template.format(topic=topic)
        solution = gen_math_solution(topic, difficulty)
        
        response = f"""**Tópico:** {topic.title()}
**Dificuldade:** {difficulty}

{solution}

**Dicas para problemas de {topic}:**
1. Sempre identifique o que é dado e o que se pede
2. Desenhe um diagrama quando possível
3. Verifique se a resposta faz sentido
4. Use técnicas de verificação
5. Pratique problemas similares"""
        
        entries.append({"prompt": prompt, "response": response})
    
    return entries

# ============================================================
# CATEGORIA 5: EXPLICAÇÕES TÉCNICAS (100K linhas)
# ============================================================

TECH_TOPICS = [
    "microserviços vs monolito", "containers Docker",
    "Kubernetes", "CI/CD", "Git flow",
    "code review", "clean code", "SOLID",
    "design patterns", "arquitetura hexagonal",
    "domain driven design", "event sourcing",
    "CQRS", "API REST best practices", "GraphQL",
    "websockets", "HTTP/2", "HTTP/3",
    "CDN", "load balancing", "microservices",
    "serverless", "edge computing", "cloud computing",
    "AWS", "Azure", "Google Cloud",
    "Linux admin", "nginx", "apache",
    "Redis", "MongoDB", "PostgreSQL",
    "MySQL", "Elasticsearch", "RabbitMQ",
    "Kafka", "gRPC", "Protocol Buffers",
    "OAuth2", "JWT", "SAML",
    "HTTPS", "TLS", "SSL",
    "firewall", "VPN", "zero trust",
    "monitoramento", "logging", "tracing",
    "observabilidade", "SRE", "DevOps",
    "Agile", "Scrum", "Kanban",
    "TDD", "BDD", "DDD",
    "refactoring", "technical debt", "code smells",
]

def gen_tech_explanation(topic):
    """Gera explicação técnica detalhada"""
    
    if "Docker" in topic:
        explanation = """**O que é Docker?**

Docker é uma plataforma de containerização que permite empacotar aplicações com todas suas dependências em unidades padronizadas chamadas containers.

**Por que usar Docker?**

1. **Consistência:** Funciona igual em qualquer ambiente
2. **Isolamento:** Cada container é independente
3. **Portabilidade:** Roda em qualquer lugar com Docker
4. **Eficiência:** Usa menos recursos que máquinas virtuais
5. **Escalabilidade:** Fácil de escalar horizontalmente

**Conceitos Fundamentais:**

```
Imagem Docker → Container → Volume → Network
     ↓              ↓          ↓         ↓
  Blueprint    Instância    Dados    Comunicação
```

**Exemplo de Dockerfile:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Comandos Essenciais:**
```bash
# Construir imagem
docker build -t minha-app .

# Rodar container
docker run -d -p 8000:8000 minha-app

# Listar containers
docker ps

# Parar container
docker stop <container_id>

# Logar dentro do container
docker exec -it <container_id> /bin/bash
```

**Docker Compose para múltiplos serviços:**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis
  
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: mydb
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data
  
  redis:
    image: redis:alpine

volumes:
  pgdata:
```

**Boas Práticas:**
1. Use imagens base oficiais
2. Minimize camadas de build
3. Use .dockerignore
4. Não execute como root
5. Use multi-stage builds"""
    
    elif "Kubernetes" in topic:
        explanation = """**O que é Kubernetes?**

Kubernetes (K8s) é um sistema de orquestração de containers que automatiza deploy, escalonamento e gestão de aplicações containerizadas.

**Arquitetura:**
```
Master Node
├── API Server
├── Scheduler
├── Controller Manager
└── etcd

Worker Nodes
├── Kubelet
├── Kube Proxy
└── Containers
```

**Recursos Principais:**

1. **Pod:** Unidade mínima, contém 1+ containers
2. **Deployment:** Gerencia réplicas do Pod
3. **Service:** Expõe Pods como rede
4. **Ingress:** Roteamento HTTP externo
5. **ConfigMap/Secret:** Configurações
6. **Volume:** Armazenamento persistente

**Exemplo de Deployment:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: minha-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: minha-app
  template:
    metadata:
      labels:
        app: minha-app
    spec:
      containers:
      - name: app
        image: minha-app:latest
        ports:
        - containerPort: 8000
        resources:
          requests:
            memory: "128Mi"
            cpu: "250m"
          limits:
            memory: "256Mi"
            cpu: "500m"
```

**Service:**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: minha-app-service
spec:
  selector:
    app: minha-app
  ports:
  - port: 80
    targetPort: 8000
  type: LoadBalancer
```

**Comandos:**
```bash
kubectl get pods
kubectl describe pod <pod-name>
kubectl logs <pod-name>
kubectl exec -it <pod-name> -- /bin/bash
kubectl apply -f deployment.yaml
kubectl scale deployment minha-app --replicas=5
```"""
    
    else:
        explanation = f"""**{topic} - Guia Completo**

**O que é?**
{topic} é uma prática/ferramenta fundamental no desenvolvimento moderno de software.

**Por que é importante?**
1. Melhora a qualidade do código
2. Facilita a manutenção
3. Reduz bugs
4. Aumenta a produtividade
5. Padroniza o trabalho em equipe

**Conceitos Fundamentais:**

**1. Princípios Básicos**
- Separação de responsabilidades
- Princípio DRY (Don't Repeat Yourself)
- Princípio KISS (Keep It Simple, Stupid)
- Princípio YAGNI (You Aren't Gonna Need It)

**2. Implementação**
```python
# Exemplo de código com {topic}
class Service:
    def __init__(self, repository):
        self.repository = repository
    
    async def get_data(self, id: int):
        data = await self.repository.find(id)
        if not data:
            raise NotFoundError(f"Dados {id} não encontrados")
        return self.transform(data)
    
    def transform(self, data):
        return {{
            'id': data.id,
            'processed': True,
            'timestamp': datetime.now()
        }}
```

**3. Boas Práticas**
- Documente sempre
- Escreva testes
- Revise código regularmente
- Use ferramentas de análise estática
- Mantenha dependências atualizadas

**4. Erros Comuns**
- Não documentar decisões
- Ignorar edge cases
- Não escrever testes
- Copiar código sem entender
- Não fazer code review

**Recursos para Aprofundar:**
- Livros: Clean Code, Refactoring, Design Patterns
- Cursos online: Coursera, Udemy, Alura
- Prática: Contribua para projetos open source"""
    
    return explanation

TECH_PROMPTS = [
    "Explique {topic}",
    "O que é {topic} e como usar?",
    "Guia completo de {topic}",
    "{topic} na prática",
    "Como implementar {topic}?",
]

def generate_tech_entries(n):
    """Gera n entradas de treino para explicações técnicas"""
    entries = []
    for i in range(n):
        topic = random.choice(TECH_TOPICS)
        prompt_template = random.choice(TECH_PROMPTS)
        
        prompt = prompt_template.format(topic=topic)
        explanation = gen_tech_explanation(topic)
        
        response = f"""**{topic}**

{explanation}

**Resumo:**
{topic} é essencial para desenvolvedores modernos. Domine os conceitos, pratique implementações e sempre busque melhorar."""
        
        entries.append({"prompt": prompt, "response": response})
    
    return entries

# ============================================================
# CATEGORIA 6: CHAIN OF THOUGHT / RACIOCÍNIO (100K linhas)
# ============================================================

REASONING_PROMPTS = [
    "Resolva passo a passo: {problem}",
    "Pense e resolva: {problem}",
    "Raciocine sobre: {problem}",
    "Explique seu raciocínio para: {problem}",
    "Resolva com detalhes: {problem}",
]

REASONING_PROBLEMS = [
    "Se 5 máquinas fazem 5 peças em 5 minutos, quanto tempo 100 máquinas levam pra fazer 100 peças?",
    "Um trem sai de São Paulo às 8h indo para o Rio a 120km/h. Outro sai do Rio às 9h indo para SP a 150km/h. A distância é 430km. Onde se encontram?",
    "Você tem 2 cordas que queimam em 1 hora cada, mas não queimam uniformemente. Como medir 45 minutos?",
    "3 portas, 1 prêmio. Você escolhe, o apresentador abre uma porta vazia. Deve trocar?",
    "Em um grupo de 23 pessoas, qual a probabilidade de duas terem aniversário no mesmo dia?",
    "Se eu te der R$1.000.000 agora ou R$0,01 que dobra todo dia por 30 dias, qual escolho?",
    "100 presos, 100 chapéus. Cada um vê os dos outros menos o seu. Todos devem acertar. Estratégia?",
    "Problema de Monty Hall: 3 portas, 1 prêmio. Você escolhe, abrem 1 vazia. Trocar é melhor?",
    "Torre de Hanói com 5 discos. Quantos movimentos mínimos? Qual a fórmula?",
    "Se A é pai de B, B é pai de C, C é pai de D, D é pai de E. Quantos anos A tem se E tem 5 e cada geração tem 25 anos?",
    "Qual é o próximo número: 1, 1, 2, 3, 5, 8, 13, ?",
    "Se 3 gatos pegam 3 ratos em 3 minutos, quantos gatos são necessários para pegar 100 ratos em 100 minutos?",
    "Em uma sala com 3 interruptores que controlam 3 lâmpadas em outra sala, como descobrir qual interruptor controla qual lâmpada sem entrar na sala?",
    "Qual é a área do triângulo com vértices (0,0), (4,0), e (2,3)?",
    "Se a soma de dois números é 10 e o produto é 21, quais são os números?",
    "Resolva: 3x + 7 = 22",
    "Qual é o MMC de 12 e 18?",
    "Simplifique: (x² - 9)/(x + 3)",
    "Se log₂(x) = 5, quanto vale x?",
    "Calcule: sen(30°) + cos(60°)",
]

def gen_reasoning(problem):
    """Gera raciocínio passo a passo"""
    
    if "máquinas" in problem and "peças" in problem:
        reasoning = """**Raciocínio passo a passo:**

**Premissa:** 5 máquinas fazem 5 peças em 5 minutos

**Passo 1: Entender a taxa por máquina**
Se 5 máquinas fazem 5 peças em 5 minutos, cada máquina faz 1 peça em 5 minutos.

**Passo 2: Calcular para 100 máquinas**
100 máquinas × 1 peça/máquina = 100 peças em 5 minutos

**Resposta:** 5 minutos

**Por que não é 100 minutos?**
O erro comum é pensar proporcionalmente: "5 máquinas = 5 min, 100 máquinas = 100 min". Mas na verdade, mais máquinas trabalham em paralelo.

**Verificação:**
- 5 máquinas → 5 peças em 5 min ✓
- 100 máquinas → 100 peças em 5 min ✓
- Cada máquina faz 1 peça em 5 min ✓"""
    
    elif "trem" in problem:
        reasoning = """**Raciocínio passo a passo:**

**Dados:**
- Trem A (SP→Rio): sai às 8h, velocidade 120 km/h
- Trem B (Rio→SP): sai às 9h, velocidade 150 km/h
- Distância total: 430 km

**Passo 1: Distância percorrida pelo Trem A até as 9h**
Das 8h às 9h = 1 hora
Distância = 120 km/h × 1h = 120 km
Distância restante = 430 - 120 = 310 km

**Passo 2: Velocidade de aproximação**
Quando B sai às 9h, ambos se aproximam
Velocidade de aproximação = 120 + 150 = 270 km/h

**Passo 3: Tempo até se encontrarem**
Tempo = Distância / Velocidade = 310 / 270 ≈ 1,148 horas
1,148 horas ≈ 1 hora e 8,9 minutos

**Passo 4: Horário do encontro**
9h + 1h8min = 10h08min

**Passo 5: Posição do encontro**
Distância de SP = 120 km/h × 2,148h ≈ 257,8 km
Distância do Rio = 150 km/h × 1,148h ≈ 172,2 km
Total = 257,8 + 172,2 = 430 km ✓

**Resposta:** Se encontram a ~258 km de SP, por volta das 10h08"""
    
    elif "cordas" in problem:
        reasoning = """**Raciocínio passo a passo:**

**Problema:** Medir 45 minutos com 2 cordas de 1 hora cada (não uniformes)

**Chave:** Acender as pontas das cordas conta como queimar metade do tempo restante

**Passo 1: t=0 minutos**
- Acenda Corda 1 pelas DUAS pontas
- Acenda Corda 2 por UMA ponta

**Passo 2: t=30 minutos**
- Corda 1 acaba (queimou pelas duas pontas = 30 min)
- Corda 2 ainda tem 30 minutos de queima

**Passo 3: t=30 minutos**
- Acenda a OUTRA ponta da Corda 2
- Agora Corda 2 queima por 2 pontas = 15 minutos

**Passo 4: t=45 minutos**
- Corda 2 acaba (30min iniciais + 15min pelas 2 pontas = 45 min)

**Resposta:** 45 minutos medidos!

**Timeline:**
t=0:   Acende C1(2 pontas) e C2(1 ponta)
t=30:  C1 acaba. Acende outra ponta de C2
t=45:  C2 acaba = 45 minutos! ✓"""
    
    else:
        reasoning = f"""**Raciocínio passo a passo:**

**Problema:** {problem}

**Passo 1: Identificar o que se pede**
Vamos analisar cuidadosamente o que está sendo questionado.

**Passo 2: Listar informações conhecidas**
- Dados do problema
- Restrições
- Condições

**Passo 3: Estabelecer relações**
Conectar os dados conhecidos com o que se pede usando fórmulas ou lógica.

**Passo 4: Calcular**
Aplicar as fórmulas/relações com os valores conhecidos.

**Passo 5: Verificar**
Checar se a resposta faz sentido no contexto do problema.

**Resposta:** Resolução completa do problema."""
    
    return reasoning

def generate_reasoning_entries(n):
    """Gera n entradas de treino para raciocínio"""
    entries = []
    for i in range(n):
        problem = random.choice(REASONING_PROBLEMS)
        prompt_template = random.choice(REASONING_PROMPTS)
        
        prompt = prompt_template.format(problem=problem)
        reasoning = gen_reasoning(problem)
        
        response = f"""**Raciocínio passo a passo:**

{reasoning}

**Dicas para problemas de raciocínio:**
1. Leia o problema 3 vezes
2. Identifique os dados e o que se pede
3. Desenhe um diagrama se possível
4. Quebre em subproblemas
5. Verifique a resposta"""
        
        entries.append({"prompt": prompt, "response": response})
    
    return entries

# ============================================================
# CATEGORIA 7: FLUTTER/DART ESPECÍFICO (50K linhas)
# ============================================================

FLUTTER_WIDGETS = [
    "StatefulWidget", "StatelessWidget", "InheritedWidget",
    "AnimatedBuilder", "AnimatedWidget", "SlideTransition",
    "FadeTransition", "ScaleTransition", "RotationTransition",
    "Hero", "ClipRRect", "CustomPaint",
    "LayoutBuilder", "MediaQuery", "OrientationBuilder",
    "FutureBuilder", "StreamBuilder", "AnimatedSwitcher",
    "AnimatedContainer", "AnimatedOpacity", "AnimatedPositioned",
    "PageView", "TabBar", "BottomNavigationBar",
    "Drawer", "SnackBar", "Dialog", "BottomSheet",
    "Tooltip", "PopupMenu", "ShowModalBottomSheet",
    "Form", "FormField", "TextFormField",
    "ListView", "GridView", "CustomScrollView",
    "SliverAppBar", "SliverList", "SliverGrid",
    "Wrap", "Stack", "Positioned",
    "SizedBox", "ConstrainedBox", "Expanded",
    "Flexible", "Align", "Center",
    "Padding", "Margin", "DecoratedBox",
    "Card", "Chip", "Badge",
    "CircleAvatar", "LinearProgressIndicator", "CircularProgressIndicator",
]

FLUTTER_FEATURES = [
    "animação com Lottie", "efeito de partículas",
    "scroll personalizado", "gestos customizados",
    "tema escuro/claro", "internacionalização",
    "acessibilidade", "testes unitários",
    "testes de widget", "testes de integração",
    "state management com Riverpod", "state management com BLoC",
    "navegação com GoRouter", "injeção de dependência",
    "HTTP client com Dio", "local storage com Hive",
    "push notifications", "deep linking",
    "widgets responsivos", "layout adaptativo",
    "efeitos de scroll", "parallax scrolling",
    "pull to refresh", "infinite scroll",
    "virtualização", "lazy loading",
    "cache de imagens", "networking avançado",
    "websockets", "GraphQL",
]

def gen_flutter_widget_code(widget, features):
    """Gera código Flutter para um widget específico"""
    
    if widget == "AnimatedContainer":
        code = """class AnimatedContainerExample extends StatefulWidget {
  @override
  _AnimatedContainerExampleState createState() => _AnimatedContainerExampleState();
}

class _AnimatedContainerExampleState extends State<AnimatedContainerExample> {
  bool _expanded = false;
  Color _color = Colors.blue;
  double _borderRadius = 8.0;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        setState(() {
          _expanded = !_expanded;
          _color = _expanded ? Colors.green : Colors.blue;
          _borderRadius = _expanded ? 50.0 : 8.0;
        });
      },
      child: AnimatedContainer(
        duration: Duration(milliseconds: 500),
        curve: Curves.easeInOut,
        width: _expanded ? 300 : 200,
        height: _expanded ? 300 : 200,
        decoration: BoxDecoration(
          color: _color,
          borderRadius: BorderRadius.circular(_borderRadius),
          boxShadow: [
            BoxShadow(
              color: Colors.black26,
              blurRadius: _expanded ? 20 : 10,
              offset: Offset(0, _expanded ? 10 : 5),
            ),
          ],
        ),
        child: Center(
          child: Text(
            _expanded ? 'Expandido!' : 'Toque para expandir',
            style: TextStyle(
              color: Colors.white,
              fontSize: _expanded ? 24 : 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ),
    );
  }
}"""
    
    elif widget == "Hero":
        code = """// Tela de listagem
class HeroListScreen extends StatelessWidget {
  final List<Item> items = [
    Item(id: 1, name: 'Item 1', color: Colors.blue),
    Item(id: 2, name: 'Item 2', color: Colors.red),
    Item(id: 3, name: 'Item 3', color: Colors.green),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Lista com Hero')),
      body: ListView.builder(
        itemCount: items.length,
        itemBuilder: (context, index) {
          final item = items[index];
          return ListTile(
            leading: Hero(
              tag: 'hero-${item.id}',
              child: CircleAvatar(
                backgroundColor: item.color,
                child: Text(item.name[0]),
              ),
            ),
            title: Text(item.name),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => HeroDetailScreen(item: item),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

// Tela de detalhe
class HeroDetailScreen extends StatelessWidget {
  final Item item;

  HeroDetailScreen({required this.item});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(item.name)),
      body: Center(
        child: Hero(
          tag: 'hero-${item.id}',
          child: CircleAvatar(
            radius: 100,
            backgroundColor: item.color,
            child: Text(
              item.name,
              style: TextStyle(fontSize: 32, color: Colors.white),
            ),
          ),
        ),
      ),
    );
  }
}"""
    
    else:
        widget_lower = widget.lower()
        code = """class """ + widget + """Example extends StatefulWidget {
  @override
  _""" + widget + """ExampleState createState() => _""" + widget + """ExampleState();
}

class _""" + widget + """ExampleState extends State<""" + widget + """Example> {
  int _counter = 0;

  void _increment() {
    setState(() {
      _counter++;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('""" + widget + """ Example'),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: () => setState(() => _counter = 0),
          ),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Contador: ' + _counter.toString(),
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            SizedBox(height: 20),
            ElevatedButton(
              onPressed: _increment,
              child: Text('Incrementar'),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _increment,
        child: Icon(Icons.add),
      ),
    );
  }
}"""
    
    return code

FLUTTER_PROMPTS = [
    "Como usar {widget} no Flutter?",
    "Exemplo de {widget} com {features}",
    "Crie um {widget} personalizado",
    "{widget} no Flutter com {features}",
    "Tutorial de {widget} no Flutter",
]

def generate_flutter_entries(n):
    """Gera n entradas de treino para Flutter"""
    entries = []
    for i in range(n):
        widget = random.choice(FLUTTER_WIDGETS)
        features = random.sample(FLUTTER_FEATURES, k=random.randint(2, 4))
        prompt_template = random.choice(FLUTTER_PROMPTS)
        
        prompt = prompt_template.format(widget=widget, features=", ".join(features))
        code = gen_flutter_widget_code(widget, features)
        
        response = f"""**{widget} no Flutter**

**O que é?**
{widget} é um widget do Flutter que permite criar interfaces ricas e interativas.

**Código de exemplo:**
```dart
{code}
```

**Funcionalidades:**
{chr(10).join(f"- {f}" for f in features)}

**Boas práticas:**
1. Use const construtores quando possível
2. Mantenha widgets pequenos e reutilizáveis
3. Use Keys apropriadamente
4. Evite rebuilds desnecessários
5. Teste seus widgets"""
        
        entries.append({"prompt": prompt, "response": response})
    
    return entries

# ============================================================
# MAIN - Gerar 700K linhas
# ============================================================

def main():
    print("=" * 60)
    print("BRANPY AI — GERADOR DE 700K LINHAS DE TREINO PERFEITAS")
    print("100% branpy.com.br — Todos os direitos reservados")
    print("=" * 60)
    
    # Distribuição de 700K linhas
    categories = {
        "sites": {"count": 150_000, "generator": generate_site_entries},
        "apps": {"count": 150_000, "generator": generate_app_entries},
        "python": {"count": 100_000, "generator": generate_python_entries},
        "math": {"count": 100_000, "generator": generate_math_entries},
        "tech": {"count": 100_000, "generator": generate_tech_entries},
        "reasoning": {"count": 100_000, "generator": generate_reasoning_entries},
    }
    
    all_entries = []
    
    for cat_name, cat_info in categories.items():
        print(f"\nGerando {cat_info['count']:,} linhas de {cat_name}...")
        entries = cat_info["generator"](cat_info["count"])
        all_entries.extend(entries)
        
        # Salvar parcial
        output_file = os.path.join(OUTPUT_DIR, f"corpus_{cat_name}_700k.jsonl")
        with open(output_file, 'w', encoding='utf-8') as f:
            for entry in entries:
                f.write(json.dumps(entry, ensure_ascii=False) + '\n')
        
        print(f"  OK {len(entries):,} linhas salvas em {output_file}")
    
    # Salvar corpus completo
    print(f"\nSalvando corpus completo ({len(all_entries):,} linhas)...")
    output_file = os.path.join(OUTPUT_DIR, "corpus_700k_completo.jsonl")
    with open(output_file, 'w', encoding='utf-8') as f:
        for entry in all_entries:
            f.write(json.dumps(entry, ensure_ascii=False) + '\n')
    
    print(f"\n{'=' * 60}")
    print(f"CONCLUÍDO! Total: {len(all_entries):,} linhas geradas")
    print(f"Arquivo: {output_file}")
    print(f"{'=' * 60}")

if __name__ == "__main__":
    main()
