"""
BranPy Meta-Agent — IA cria seus próprios agentes.

100% da branpy.com.br — Todos os direitos reservados.

Quando você falar "crie um agente que faça X", a IA gera o agente automaticamente.
"""

import os
import sys
import json
import time
import re
from pathlib import Path
from typing import Dict, List, Any, Optional

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

try:
    import torch
    from model import BranPyModel, create_model
    from tokenizer import BPETokenizer
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False


# ==================== TEMPLATES DE AGENTES ====================

AGENT_TEMPLATES = {
    "web_scraper": {
        "name": "Web Scraper Agent",
        "description": "Agente que coleta dados de sites",
        "tools": ["requests", "beautifulsoup4", "lxml"],
        "code": '''#!/usr/bin/env python3
"""
{agent_name} — Web Scraper Agent
Criado pelo BranPy AI
100% branpy.com.br
"""
import requests
from bs4 import BeautifulSoup
import json
import csv
import time

class {class_name}:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers = {{
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }}
        self.data = []

    def fetch(self, url):
        """Busca página."""
        try:
            response = self.session.get(url, timeout=10)
            return response.text
        except Exception as e:
            print(f"Erro ao buscar {{url}}: {{e}}")
            return None

    def parse(self, html, selectors):
        """Extrai dados usando seletores CSS."""
        soup = BeautifulSoup(html, 'html.parser')
        results = []

        for item in selectors:
            elements = soup.select(item['selector'])
            for el in elements:
                data = {{
                    'tag': el.name,
                    'text': el.get_text(strip=True),
                    'href': el.get('href', ''),
                }}
                results.append(data)

        return results

    def scrape(self, urls, selectors):
        """Scraping principal."""
        for url in urls:
            print(f"Scraping: {{url}}")
            html = self.fetch(url)
            if html:
                data = self.parse(html, selectors)
                self.data.extend(data)
            time.sleep(1)

        return self.data

    def save_json(self, filename):
        """Salva em JSON."""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, ensure_ascii=False, indent=2)
        print(f"Salvo: {{filename}}")

    def save_csv(self, filename):
        """Salva em CSV."""
        if self.data:
            with open(filename, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=self.data[0].keys())
                writer.writeheader()
                writer.writerows(self.data)
            print(f"Salvo: {{filename}}")

if __name__ == '__main__':
    agent = {class_name}()

    urls = ["https://example.com"]
    selectors = [{{"selector": "h1"}}]

    data = agent.scrape(urls, selectors)
    agent.save_json("dados.json")
'''
    },

    "auto_bot": {
        "name": "Auto Bot Agent",
        "description": "Agente que automatiza tarefas repetitivas",
        "tools": ["schedule", "pyautogui", "selenium"],
        "code": '''#!/usr/bin/env python3
"""
{agent_name} — Auto Bot Agent
Criado pelo BranPy AI
100% branpy.com.br
"""
import time
import os
import subprocess
import schedule
from datetime import datetime

class {class_name}:
    def __init__(self):
        self.tasks = []
        self.running = False

    def add_task(self, name, func, schedule_time=None):
        """Adiciona tarefa."""
        self.tasks.append({{
            'name': name,
            'func': func,
            'schedule': schedule_time
        }})

    def run_task(self, task):
        """Executa uma tarefa."""
        print(f"[{{datetime.now()}}] Executando: {{task['name']}}")
        try:
            task['func']()
            print(f"  Concluído!")
        except Exception as e:
            print(f"  Erro: {{e}}")

    def start(self):
        """Inicia o bot."""
        self.running = True
        print("Bot iniciado!")

        for task in self.tasks:
            if task['schedule']:
                schedule.every().day.at(task['schedule']).do(self.run_task, task)

        while self.running:
            schedule.run_pending()
            time.sleep(1)

    def stop(self):
        """Para o bot."""
        self.running = False
        print("Bot parado!")

    def example_task(self):
        """Exemplo de tarefa."""
        print("Tarefa executada!")

if __name__ == '__main__':
    agent = {class_name}()
    agent.add_task("Exemplo", agent.example_task, "09:00")
    agent.start()
'''
    },

    "file_manager": {
        "name": "File Manager Agent",
        "description": "Agente que gerencia arquivos automaticamente",
        "tools": ["watchdog", "shutil"],
        "code": '''#!/usr/bin/env python3
"""
{agent_name} — File Manager Agent
Criado pelo BranPy AI
100% branpy.com.br
"""
import os
import shutil
from pathlib import Path
from datetime import datetime

class {class_name}:
    def __init__(self, watch_dir="."):
        self.watch_dir = Path(watch_dir)
        self.rules = []

    def add_rule(self, extension, destination):
        """Adiciona regra de organização."""
        self.rules.append({{
            'extension': extension.lower(),
            'destination': destination
        }})

    def organize(self):
        """Organiza arquivos."""
        for file in self.watch_dir.iterdir():
            if file.is_file():
                ext = file.suffix.lower()

                for rule in self.rules:
                    if ext == rule['extension']:
                        dest_dir = self.watch_dir / rule['destination']
                        dest_dir.mkdir(exist_ok=True)

                        dest_file = dest_dir / file.name
                        shutil.move(str(file), str(dest_file))
                        print(f"Movido: {{file.name}} -> {{rule['destination']}}")
                        break

    def backup(self, source, destination):
        """Cria backup."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        dest = f"{{destination}}_{{timestamp}}"
        shutil.copytree(source, dest)
        print(f"Backup criado: {{dest}}")

    def cleanup(self, days=30):
        """Remove arquivos antigos."""
        now = datetime.now()
        for file in self.watch_dir.rglob("*"):
            if file.is_file():
                age = (now - datetime.fromtimestamp(file.stat().st_mtime)).days
                if age > days:
                    file.unlink()
                    print(f"Removido: {{file.name}} ({{age}} dias)")

if __name__ == '__main__':
    agent = {class_name}("./downloads")
    agent.add_rule(".jpg", "images")
    agent.add_rule(".pdf", "documents")
    agent.add_rule(".mp4", "videos")
    agent.organize()
'''
    },

    "api_client": {
        "name": "API Client Agent",
        "description": "Agente que consome APIs automaticamente",
        "tools": ["requests"],
        "code": '''#!/usr/bin/env python3
"""
{agent_name} — API Client Agent
Criado pelo BranPy AI
100% branpy.com.br
"""
import requests
import json

class {class_name}:
    def __init__(self, base_url=""):
        self.base_url = base_url
        self.headers = {{}}
        self.token = None

    def set_auth(self, token):
        """Define token de autenticação."""
        self.token = token
        self.headers['Authorization'] = f'Bearer {{token}}'

    def get(self, endpoint, params=None):
        """Requisição GET."""
        url = f"{{self.base_url}}{{endpoint}}"
        response = requests.get(url, headers=self.headers, params=params)
        return self._handle_response(response)

    def post(self, endpoint, data=None):
        """Requisição POST."""
        url = f"{{self.base_url}}{{endpoint}}"
        response = requests.post(url, headers=self.headers, json=data)
        return self._handle_response(response)

    def put(self, endpoint, data=None):
        """Requisição PUT."""
        url = f"{{self.base_url}}{{endpoint}}"
        response = requests.put(url, headers=self.headers, json=data)
        return self._handle_response(response)

    def delete(self, endpoint):
        """Requisição DELETE."""
        url = f"{{self.base_url}}{{endpoint}}"
        response = requests.delete(url, headers=self.headers)
        return self._handle_response(response)

    def _handle_response(self, response):
        """Trata resposta."""
        if response.status_code == 200:
            return response.json()
        else:
            return {{
                'error': True,
                'status': response.status_code,
                'message': response.text
            }}

if __name__ == '__main__':
    client = {class_name}("https://api.example.com")
    result = client.get("/users")
    print(result)
'''
    },

    "data_processor": {
        "name": "Data Processor Agent",
        "description": "Agente que processa e transforma dados",
        "tools": ["pandas", "numpy"],
        "code": '''#!/usr/bin/env python3
"""
{agent_name} — Data Processor Agent
Criado pelo BranPy AI
100% branpy.com.br
"""
import pandas as pd
import json
import csv

class {class_name}:
    def __init__(self):
        self.data = None

    def load_csv(self, filepath):
        """Carrega CSV."""
        self.data = pd.read_csv(filepath)
        print(f"Carregado: {{len(self.data)}} linhas")
        return self.data

    def load_json(self, filepath):
        """Carrega JSON."""
        with open(filepath, 'r', encoding='utf-8') as f:
            self.data = pd.DataFrame(json.load(f))
        print(f"Carregado: {{len(self.data)}} linhas")
        return self.data

    def filter(self, column, value):
        """Filtra dados."""
        self.data = self.data[self.data[column] == value]
        return self.data

    def select(self, columns):
        """Seleciona colunas."""
        self.data = self.data[columns]
        return self.data

    def sort(self, column, ascending=True):
        """Ordena dados."""
        self.data = self.data.sort_values(column, ascending=ascending)
        return self.data

    def aggregate(self, column, func):
        """Agrega dados."""
        return self.data[column].agg(func)

    def save_csv(self, filepath):
        """Salva CSV."""
        self.data.to_csv(filepath, index=False)
        print(f"Salvo: {{filepath}}")

    def save_json(self, filepath):
        """Salva JSON."""
        self.data.to_json(filepath, orient='records', force_ascii=False)
        print(f"Salvo: {{filepath}}")

if __name__ == '__main__':
    processor = {class_name}()
    # processor.load_csv("dados.csv")
    # processor.filter("status", "active")
    # processor.save_csv("filtrados.csv")
'''
    },

    "monitor": {
        "name": "System Monitor Agent",
        "description": "Agente que monitora sistema e envia alertas",
        "tools": ["psutil"],
        "code": '''#!/usr/bin/env python3
"""
{agent_name} — System Monitor Agent
Criado pelo BranPy AI
100% branpy.com.br
"""
import psutil
import time
from datetime import datetime

class {class_name}:
    def __init__(self):
        self.alerts = []
        self.thresholds = {{
            'cpu': 80,
            'memory': 80,
            'disk': 90
        }}

    def get_cpu(self):
        """Retorna uso da CPU."""
        return psutil.cpu_percent(interval=1)

    def get_memory(self):
        """Retorna uso da memória."""
        mem = psutil.virtual_memory()
        return mem.percent

    def get_disk(self):
        """Retorna uso do disco."""
        disk = psutil.disk_usage('/')
        return disk.percent

    def get_network(self):
        """Retorna tráfego de rede."""
        net = psutil.net_io_counters()
        return {{
            'bytes_sent': net.bytes_sent,
            'bytes_recv': net.bytes_recv
        }}

    def check_alerts(self):
        """Verifica alertas."""
        cpu = self.get_cpu()
        mem = self.get_memory()
        disk = self.get_disk()

        if cpu > self.thresholds['cpu']:
            self.alerts.append(f"CPU alta: {{cpu}}%")

        if mem > self.thresholds['memory']:
            self.alerts.append(f"Memória alta: {{mem}}%")

        if disk > self.thresholds['disk']:
            self.alerts.append(f"Disco cheio: {{disk}}%")

        return self.alerts

    def monitor(self, interval=5):
        """Monitora continuamente."""
        print("Monitoramento iniciado!")
        while True:
            print(f"\\n[{datetime.now()}]")
            print(f"CPU: {{self.get_cpu()}}%")
            print(f"RAM: {{self.get_memory()}}%")
            print(f"DISK: {{self.get_disk()}}%")

            alerts = self.check_alerts()
            for alert in alerts:
                print(f"⚠️  {{alert}}")

            time.sleep(interval)

if __name__ == '__main__':
    monitor = {class_name}()
    monitor.monitor()
'''
    },

    "webhook_server": {
        "name": "Webhook Server Agent",
        "description": "Agente que recebe e processa webhooks",
        "tools": ["flask"],
        "code": '''#!/usr/bin/env python3
"""
{agent_name} — Webhook Server Agent
Criado pelo BranPy AI
100% branpy.com.br
"""
from flask import Flask, request, jsonify
import json
from datetime import datetime

app = Flask(__name__)

class {class_name}:
    def __init__(self):
        self.webhooks = []
        self.logs = []

    def process(self, data):
        """Processa dados do webhook."""
        self.webhooks.append({{
            'timestamp': datetime.now().isoformat(),
            'data': data
        }})
        return {{'status': 'processed'}}

agent = {class_name}()

@app.route('/webhook', methods=['POST'])
def webhook():
    data = request.json
    result = agent.process(data)
    return jsonify(result)

@app.route('/webhooks', methods=['GET'])
def get_webhooks():
    return jsonify(agent.webhooks)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
'''
    },
}


class MetaAgent:
    """Meta-Agente que cria outros agentes."""

    def __init__(self, model_path: str = None):
        self.model = None
        self.tokenizer = None
        self.device = "cuda" if HAS_TORCH and torch.cuda.is_available() else "cpu"
        self.workspace = os.path.join(os.path.dirname(__file__), 'agents')
        os.makedirs(self.workspace, exist_ok=True)
        self.templates = AGENT_TEMPLATES

        if model_path and os.path.exists(model_path):
            self.load_model(model_path)

    def load_model(self, model_path: str):
        """Carrega modelo treinado."""
        if not HAS_TORCH:
            print("PyTorch não disponível")
            return

        tok_path = os.path.join(model_path, 'tokenizer.json')
        if os.path.exists(tok_path):
            self.tokenizer = BPETokenizer.load(tok_path)

        ckpt_files = [f for f in os.listdir(model_path) if f.endswith('.pt')]
        if ckpt_files:
            ckpt_path = os.path.join(model_path, ckpt_files[-1])
            checkpoint = torch.load(ckpt_path, map_location=self.device)

            if 'config' in checkpoint:
                config = checkpoint['config']
                self.model = create_model(
                    vocab_size=config.get('vocab_size', 8000),
                    size=config.get('model_size', 'medium')
                )
            else:
                self.model = create_model(vocab_size=8000, size='medium')

            if 'model_state_dict' in checkpoint:
                self.model.load_state_dict(checkpoint['model_state_dict'])

            self.model = self.model.to(self.device)
            self.model.eval()

    def understand_request(self, request: str) -> Dict:
        """Entende o que o usuário quer e escolhe template."""
        request_lower = request.lower()

        # Mapear palavras-chave para templates
        keyword_map = {
            'scrape': 'web_scraper',
            'scraper': 'web_scraper',
            'coletar': 'web_scraper',
            'extrair': 'web_scraper',
            'site': 'web_scraper',
            'web': 'web_scraper',
            'bot': 'auto_bot',
            'automatizar': 'auto_bot',
            'automação': 'auto_bot',
            'repetir': 'auto_bot',
            'agendar': 'auto_bot',
            'arquivo': 'file_manager',
            'organizar': 'file_manager',
            'limpar': 'file_manager',
            'backup': 'file_manager',
            'pasta': 'file_manager',
            'api': 'api_client',
            'requisição': 'api_client',
            'consumir': 'api_client',
            'endpoint': 'api_client',
            'dados': 'data_processor',
            'processar': 'data_processor',
            'filtrar': 'data_processor',
            'csv': 'data_processor',
            'json': 'data_processor',
            'monitorar': 'monitor',
            'cpu': 'monitor',
            'memória': 'monitor',
            'sistema': 'monitor',
            'alerta': 'monitor',
            'webhook': 'webhook_server',
            'receber': 'webhook_server',
            'evento': 'webhook_server',
        }

        # Encontrar template mais adequado
        scores = {}
        for keyword, template in keyword_map.items():
            if keyword in request_lower:
                scores[template] = scores.get(template, 0) + 1

        if scores:
            best_template = max(scores, key=scores.get)
            return {
                'template': best_template,
                'confidence': scores[best_template] / len(keyword_map)
            }

        return {'template': 'auto_bot', 'confidence': 0.1}

    def create_agent(self, request: str, agent_name: str = None) -> str:
        """Cria um agente baseado na solicitação."""
        print(f"\n{'='*60}")
        print("BRANPY META-AGENT — Criando Agente")
        print(f"{'='*60}")
        print(f"Solicitação: {request}")

        # Entender o que foi pedido
        understanding = self.understand_request(request)
        template_name = understanding['template']
        confidence = understanding['confidence']

        print(f"\nTemplate escolhido: {template_name}")
        print(f"Confiança: {confidence*100:.0f}%")

        # Obter template
        if template_name not in self.templates:
            template_name = 'auto_bot'

        template = self.templates[template_name]

        # Gerar nome do agente
        if not agent_name:
            agent_name = f"branpy_{template_name}_{int(time.time())}"

        class_name = agent_name.replace('-', '_').replace(' ', '_').title()

        # Gerar código
        code = template['code'].format(
            agent_name=agent_name,
            class_name=class_name
        )

        # Criar projeto
        project_dir = os.path.join(self.workspace, agent_name)
        os.makedirs(project_dir, exist_ok=True)

        # Salvar código
        main_file = os.path.join(project_dir, 'main.py')
        with open(main_file, 'w', encoding='utf-8') as f:
            f.write(code)

        # Salvar requirements
        req_file = os.path.join(project_dir, 'requirements.txt')
        with open(req_file, 'w') as f:
            f.write('\n'.join(template['tools']))

        # Salvar README
        readme = f"""# {agent_name}

{template['description']}

Criado automaticamente pelo BranPy Meta-Agent
100% branpy.com.br

## Instalação

```bash
pip install -r requirements.txt
```

## Uso

```bash
python main.py
```

## Ferramentas

- {', '.join(template['tools'])}
"""
        readme_file = os.path.join(project_dir, 'README.md')
        with open(readme_file, 'w', encoding='utf-8') as f:
            f.write(readme)

        print(f"\n✅ Agente criado: {project_dir}")
        print(f"   Arquivo principal: {main_file}")
        print(f"   Dependências: {', '.join(template['tools'])}")

        return project_dir

    def list_templates(self) -> List[str]:
        """Lista templates disponíveis."""
        return list(self.templates.keys())

    def add_template(self, name: str, template: Dict):
        """Adiciona novo template."""
        self.templates[name] = template


def run_meta_agent():
    """Executa o meta-agente."""
    meta = MetaAgent()

    print("\n" + "="*60)
    print("BRANPY META-AGENT — IA Cria Seus Próprios Agentes")
    print("100% branpy.com.br — Todos os direitos reservados")
    print("="*60)
    print("\nTemplates disponíveis:")
    for name, template in meta.templates.items():
        print(f"  • {name}: {template['description']}")
    print("\nComo usar:")
    print("  Digite o que quer que o agente faça")
    print("  Exemplo: 'crie um agente que colete dados de sites'")
    print("  Exemplo: 'crie um agente que monitore meu computador'")
    print("\nComandos:")
    print("  'templates' — Ver templates")
    print("  'sair' — Encerrar")
    print()

    while True:
        try:
            request = input("BranPy > ").strip()

            if request.lower() in ['sair', 'exit', 'quit']:
                print("Encerrando...")
                break

            if request.lower() == 'templates':
                print("\nTemplates disponíveis:")
                for name, template in meta.templates.items():
                    print(f"  • {name}: {template['description']}")
                continue

            if not request:
                continue

            # Criar agente
            result = meta.create_agent(request)

            print(f"\nPara usar o agente:")
            print(f"  cd {result}")
            print(f"  pip install -r requirements.txt")
            print(f"  python main.py")

        except KeyboardInterrupt:
            print("\nEncerrando...")
            break
        except Exception as e:
            print(f"Erro: {e}")


if __name__ == '__main__':
    run_meta_agent()
