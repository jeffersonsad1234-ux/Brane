"""BranPy Web — Web scraping, criação de sites, automação web.

100% da branpy.com.br — Todos os direitos reservados.
Cria sites, apps, faz web scraping, automação de marketing.

Rodar: python web_module.py
"""

import os
import sys
import json
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
import urllib.request
import urllib.parse
from html.parser import HTMLParser


class WebModule:
    """Módulo Web — 100% branpy.com.br."""
    
    def __init__(self):
        self.sites = []
        self.apps = []
        self.cache = {}
        
    # ==========================================
    # WEB SCRAPING
    # ==========================================
    
    def fetch_page(self, url: str) -> str:
        """Busca página web."""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as response:
                return response.read().decode('utf-8', errors='ignore')
        except Exception as e:
            return f"Erro: {e}"
    
    def extract_text(self, html: str) -> str:
        """Extrai texto do HTML."""
        # Remove tags HTML
        text = re.sub(r'<[^>]+>', ' ', html)
        # Remove espaços extras
        text = re.sub(r'\s+', ' ', text)
        return text.strip()
    
    def extract_links(self, html: str, base_url: str = "") -> List[str]:
        """Extrai links do HTML."""
        links = re.findall(r'href=["\']([^"\']+)["\']', html)
        if base_url:
            links = [urllib.parse.urljoin(base_url, link) for link in links]
        return links
    
    def extract_images(self, html: str, base_url: str = "") -> List[str]:
        """Extrai imagens do HTML."""
        images = re.findall(r'src=["\']([^"\']+\.(jpg|jpeg|png|gif|webp))["\']', html)
        images = [img[0] for img in images]
        if base_url:
            images = [urllib.parse.urljoin(base_url, img) for img in images]
        return images
    
    def scrape(self, url: str) -> Dict:
        """Faz scraping completo de uma página."""
        html = self.fetch_page(url)
        return {
            "url": url,
            "text": self.extract_text(html),
            "links": self.extract_links(html, url),
            "images": self.extract_images(html, url),
            "size": len(html),
            "timestamp": datetime.now().isoformat(),
        }
    
    def search_google(self, query: str, num_results: int = 10) -> List[Dict]:
        """Busca no Google (simplificado)."""
        query_encoded = urllib.parse.quote_plus(query)
        url = f"https://www.google.com/search?q={query_encoded}&num={num_results}"
        
        html = self.fetch_page(url)
        
        # Extrair resultados (simplificado)
        results = []
        # Padrão para resultados do Google
        pattern = r'<a href="/url\?q=([^&"]+)'
        matches = re.findall(pattern, html)
        
        for i, match in enumerate(matches[:num_results]):
            results.append({
                "position": i + 1,
                "url": urllib.parse.unquote(match),
                "title": f"Resultado {i + 1}",
            })
        
        return results
    
    # ==========================================
    # CRIAÇÃO DE SITES
    # ==========================================
    
    def create_site(self, name: str, niche: str, pages: List[str] = None) -> Dict:
        """Cria site completo."""
        if pages is None:
            pages = ["home", "sobre", "servicos", "blog", "contato"]
        
        site = {
            "name": name,
            "niche": niche,
            "created": datetime.now().isoformat(),
            "pages": {},
            "seo": self._generate_seo(name, niche),
            "monetization": self._setup_monetization(niche),
            "template": self._generate_template(name, niche),
        }
        
        # Gerar páginas
        for page in pages:
            site["pages"][page] = self._generate_page(page, name, niche)
        
        self.sites.append(site)
        return site
    
    def _generate_seo(self, name: str, niche: str) -> Dict:
        """Gera SEO otimizado."""
        return {
            "title": f"{name} - {niche.title()} | O Melhor do Brasil",
            "description": f"{name}: {niche} com qualidade e confiança. Descubra nossos serviços!",
            "keywords": [niche, name.lower(), "brasil", "online", "profissional"],
            "og_title": f"{name} - {niche.title()}",
            "og_description": f"Descubra {name}: {niche} profissional",
            "og_image": f"/images/{name.lower().replace(' ', '-')}-cover.jpg",
            "twitter_card": "summary_large_image",
            "sitemap": True,
            "robots": True,
            "canonical": f"https://{name.lower().replace(' ', '')}.com.br",
        }
    
    def _setup_monetization(self, niche: str) -> Dict:
        """Configura monetização."""
        return {
            "adsense": {
                "enabled": True,
                "publisher_id": "",
                "ad_units": ["banner_728x90", "sidebar_300x250", "in文章_336x280"],
            },
            "affiliate": {
                "enabled": True,
                "programs": ["Amazon", "Hotmart", "Monetizze"],
            },
            "products": {
                "enabled": True,
                "digital": True,
                "physical": False,
            },
            "courses": {
                "enabled": True,
                "platform": "hotmart",
            },
            "consulting": {
                "enabled": True,
                "booking": True,
            },
        }
    
    def _generate_template(self, name: str, niche: str) -> str:
        """Gera template HTML."""
        return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{name} - {niche.title()}</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; }}
        nav {{ background: #333; padding: 1rem; text-align: center; }}
        nav a {{ color: white; text-decoration: none; margin: 0 1rem; }}
        .container {{ max-width: 1200px; margin: 0 auto; padding: 2rem; }}
        .hero {{ text-align: center; padding: 4rem 2rem; background: #f8f9fa; }}
        .features {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; padding: 2rem 0; }}
        .feature {{ background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        footer {{ background: #333; color: white; text-align: center; padding: 2rem; margin-top: 2rem; }}
        .cta {{ display: inline-block; background: #667eea; color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 5px; margin-top: 1rem; }}
    </style>
</head>
<body>
    <header>
        <h1>{name}</h1>
        <p>{niche.title()} Profissional</p>
    </header>
    <nav>
        <a href="#home">Home</a>
        <a href="#sobre">Sobre</a>
        <a href="#servicos">Serviços</a>
        <a href="#blog">Blog</a>
        <a href="#contato">Contato</a>
    </nav>
    <div class="container">
        <section class="hero">
            <h2>Bem-vindo ao {name}</h2>
            <p>Somos especialistas em {niche}</p>
            <a href="#contato" class="cta">Fale Conosco</a>
        </section>
        <section class="features">
            <div class="feature">
                <h3>Qualidade</h3>
                <p>Entregamos sempre o melhor serviço de {niche}</p>
            </div>
            <div class="feature">
                <h3>Confiança</h3>
                <p>Clientes satisfeitos em todo o Brasil</p>
            </div>
            <div class="feature">
                <h3>Preço Justo</h3>
                <p>Serviço profissional com preço acessível</p>
            </div>
        </section>
    </div>
    <footer>
        <p>&copy; {datetime.now().year} {name}. Todos os direitos reservados.</p>
    </footer>
</body>
</html>"""
    
    def _generate_page(self, page: str, name: str, niche: str) -> Dict:
        """Gera conteúdo da página."""
        pages_content = {
            "home": {
                "title": f"Bem-vindo ao {name}",
                "content": f"Somos especialistas em {niche}. Confira nossos serviços!",
                "cta": "Solicitar Orçamento",
            },
            "sobre": {
                "title": f"Sobre o {name}",
                "content": f"O {name} é referência em {niche} no Brasil.",
                "team": "Nossa equipe é formada por profissionais qualificados.",
            },
            "servicos": {
                "title": f"Serviços de {niche.title()}",
                "items": [
                    {"name": "Consultoria", "description": f"Consultoria especializada em {niche}"},
                    {"name": "Implementação", "description": f"Implementação profissional de {niche}"},
                    {"name": "Suporte", "description": f"Suporte técnico 24/7"},
                ],
            },
            "blog": {
                "title": f"Blog de {niche.title()}",
                "posts": [
                    {"title": f"Como começar em {niche}", "date": "2024-01-01"},
                    {"title": f"Dicas de {niche}", "date": "2024-01-15"},
                ],
            },
            "contato": {
                "title": f"Fale Conosco",
                "form": ["nome", "email", "telefone", "mensagem"],
                "whatsapp": "+5511999999999",
                "email": f"contato@{name.lower().replace(' ', '')}.com.br",
            },
        }
        return pages_content.get(page, {"title": page, "content": ""})
    
    def save_site(self, site: Dict, output_dir: str):
        """Salva site em disco."""
        site_dir = Path(output_dir) / site["name"].lower().replace(" ", "_")
        site_dir.mkdir(parents=True, exist_ok=True)
        
        # Salvar template principal
        with open(site_dir / "index.html", "w", encoding="utf-8") as f:
            f.write(site["template"])
        
        # Salvar configurações
        with open(site_dir / "config.json", "w", encoding="utf-8") as f:
            json.dump(site, f, indent=2, ensure_ascii=False)
        
        return str(site_dir)
    
    # ==========================================
    # CRIAÇÃO DE APPS
    # ==========================================
    
    def create_app(self, name: str, app_type: str, features: List[str] = None) -> Dict:
        """Cria app completo."""
        if features is None:
            features = ["login", "dashboard", "notifications", "payments", "support"]
        
        app = {
            "name": name,
            "type": app_type,
            "created": datetime.now().isoformat(),
            "platforms": ["android", "ios", "web"],
            "features": features,
            "monetization": {
                "freemium": True,
                "subscriptions": True,
                "ads": True,
                "in_app_purchases": True,
            },
            "tech_stack": {
                "frontend": "React Native / Flutter",
                "backend": "Node.js / Python",
                "database": "PostgreSQL / MongoDB",
                "hosting": "AWS / Google Cloud",
            },
        }
        
        self.apps.append(app)
        return app
    
    def generate_app_code(self, app: Dict) -> str:
        """Gera código inicial do app."""
        return f"""// {app['name']} - App gerado por BranPy
// 100% branpy.com.br

import React from 'react';
import {{ View, Text, StyleSheet }} from 'react-native';

const App = () => {{
  return (
    <View style={{styles.container}}>
      <Text style={{styles.title}}>{app['name']}</Text>
      <Text style={{styles.subtitle}}>Type: {app['type']}</Text>
    </View>
  );
}};

const styles = StyleSheet.create({{
  container: {{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  }},
  title: {{
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  }},
  subtitle: {{
    fontSize: 16,
    color: '#666',
  }},
}});

export default App;
"""
    
    # ==========================================
    # MARKETING AUTOMATION
    # ==========================================
    
    def generate_social_media_post(self, content: str, platform: str) -> Dict:
        """Gera post para redes sociais."""
        templates = {
            "instagram": {
                "max_length": 2200,
                "hashtags": True,
                "emoji": True,
                "format": "post/carousel/reel",
            },
            "twitter": {
                "max_length": 280,
                "hashtags": True,
                "emoji": True,
                "format": "tweet/thread",
            },
            "linkedin": {
                "max_length": 3000,
                "hashtags": False,
                "emoji": False,
                "format": "post/article",
            },
            "facebook": {
                "max_length": 63206,
                "hashtags": True,
                "emoji": True,
                "format": "post/story/reel",
            },
        }
        
        template = templates.get(platform, templates["instagram"])
        
        # Truncar se necessário
        if len(content) > template["max_length"]:
            content = content[:template["max_length"] - 3] + "..."
        
        return {
            "platform": platform,
            "content": content,
            "format": template["format"],
            "scheduled": datetime.now().isoformat(),
            "status": "ready",
        }
    
    def generate_email_marketing(self, subject: str, content: str) -> Dict:
        """Gera email de marketing."""
        return {
            "subject": subject,
            "content": content,
            "template": "professional",
            "cta": "Confira agora!",
            "unsubscribe": True,
            "tracking": True,
        }
    
    # ==========================================
    # SEO
    # ==========================================
    
    def generate_seo_report(self, url: str) -> Dict:
        """Gera relatório SEO."""
        html = self.fetch_page(url)
        
        # Extrair meta tags
        title = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE)
        description = re.search(r'<meta name="description" content="(.*?)"', html, re.IGNORECASE)
        
        # Verificar HTTPS
        is_https = url.startswith("https")
        
        # Verificar mobile
        has_viewport = 'viewport' in html.lower()
        
        return {
            "url": url,
            "title": title.group(1) if title else "Não encontrado",
            "description": description.group(1) if description else "Não encontrado",
            "https": is_https,
            "mobile_friendly": has_viewport,
            "score": sum([is_https * 20, has_viewport * 20, bool(title) * 30, bool(description) * 30]),
            "recommendations": [
                "Adicionar meta description" if not description else None,
                "Usar HTTPS" if not is_https else None,
                "Otimizar para mobile" if not has_viewport else None,
            ],
        }
    
    # ==========================================
    # ANALYTICS
    # ==========================================
    
    def generate_analytics_dashboard(self) -> Dict:
        """Gera dashboard de analytics."""
        return {
            "visitors": {
                "total": 0,
                "today": 0,
                "trend": "+0%",
            },
            "pageviews": {
                "total": 0,
                "today": 0,
                "avg_time": "0:00",
            },
            "bounce_rate": "0%",
            "top_pages": [],
            "traffic_sources": {
                "organic": "0%",
                "direct": "0%",
                "social": "0%",
                "referral": "0%",
            },
        }


# ==========================================
# EXECUÇÃO
# ==========================================

if __name__ == "__main__":
    web = WebModule()
    
    print("=" * 60)
    print("BRANPY WEB — Web Scraping, Criação de Sites, Automação")
    print("100% branpy.com.br")
    print("=" * 60)
    
    print("\n[CRIAÇÃO] Criando site de exemplo...")
    site = web.create_site("MeuSite", "tecnologia")
    print(f"  Nome: {site['name']}")
    print(f"  Nicho: {site['niche']}")
    print(f"  Páginas: {list(site['pages'].keys())}")
    
    print("\n[SEO] Configurações SEO:")
    for key, value in site['seo'].items():
        print(f"  {key}: {value}")
    
    print("\n[MONETIZAÇÃO] Configurações:")
    for key, value in site['monetization'].items():
        print(f"  {key}: {'Ativado' if value.get('enabled') else 'Desativado'}")
    
    print("\n[SCRAPING] Testando scraping...")
    result = web.scrape("https://example.com")
    print(f"  URL: {result['url']}")
    print(f"  Tamanho: {result['size']} bytes")
    print(f"  Links: {len(result['links'])}")
    print(f"  Imagens: {len(result['images'])}")
    
    print("\n[APP] Criando app de exemplo...")
    app = web.create_app("MeuApp", "ecommerce")
    print(f"  Nome: {app['name']}")
    print(f"  Tipo: {app['type']}")
    print(f"  Plataformas: {app['platforms']}")
    
    print("\n" + "=" * 60)
    print("Web Module pronto!")
    print("=" * 60)
