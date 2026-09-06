"""
BranPy Agent — Agente Autônomo que CONSTRÓI e ENTREGA projetos.

100% da branpy.com.br — Todos os direitos reservados.

O agente NÃO SÓ gera código — ele CRIA, CONSTROI e ENTREGA o projeto pronto.
"""

import os
import sys
import json
import subprocess
import time
import shutil
import re
from pathlib import Path
from typing import Dict, List, Any, Optional
import torch

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from model import BranPyModel, create_model
from tokenizer import BPETokenizer


class BranPyAgent:
    """Agente autônomo que constrói projetos completos."""

    def __init__(self, model_path: str = None):
        self.model = None
        self.tokenizer = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.workspace = os.path.join(os.path.dirname(__file__), 'workspace')
        os.makedirs(self.workspace, exist_ok=True)

        # Ferramentas disponíveis
        self.tools = {
            'create_file': self._create_file,
            'create_folder': self._create_folder,
            'write_file': self._write_file,
            'read_file': self._read_file,
            'list_files': self._list_files,
            'run_command': self._run_command,
            'build_project': self._build_project,
            'install_dependencies': self._install_dependencies,
            'create_android_app': self._create_android_app,
            'create_web_app': self._create_web_app,
            'create_server': self._create_server,
            'create_flutter_app': self._create_flutter_app,
        }

        if model_path and os.path.exists(model_path):
            self.load_model(model_path)

    def load_model(self, model_path: str):
        """Carrega modelo treinado."""
        print(f"Carregando modelo de {model_path}...")

        # Carregar tokenizer
        tok_path = os.path.join(model_path, 'tokenizer.json')
        if os.path.exists(tok_path):
            self.tokenizer = BPETokenizer.load(tok_path)
            print(f"  Tokenizer: {len(self.tokenizer.vocab)} tokens")

        # Carregar modelo
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
            elif 'model' in checkpoint:
                self.model.load_state_dict(checkpoint['model'])

            self.model = self.model.to(self.device)
            self.model.eval()
            print(f"  Modelo: {sum(p.numel() for p in self.model.parameters())/1e6:.1f}M params")

    def generate(self, prompt: str, max_tokens: int = 2048, temperature: float = 0.7) -> str:
        """Gera resposta usando o modelo."""
        if not self.model or not self.tokenizer:
            return self._fallback_response(prompt)

        try:
            ids = self.tokenizer.encode(prompt, add_special=True)
            x = torch.tensor([ids], dtype=torch.long).to(self.device)

            with torch.no_grad():
                gen_ids = self.model.generate(x, max_new_tokens=max_tokens, temperature=temperature)

            response = self.tokenizer.decode(gen_ids[0].tolist())
            return response

        except Exception as e:
            print(f"Erro na geração: {e}")
            return self._fallback_response(prompt)

    def _fallback_response(self, prompt: str) -> str:
        """Resposta quando modelo não está disponível."""
        prompt_lower = prompt.lower()

        if 'android' in prompt_lower or 'apk' in prompt_lower or 'app' in prompt_lower:
            return json.dumps({
                "tool": "create_android_app",
                "args": {"app_name": "BranpyApp", "package": "branpy.app"}
            })
        elif 'web' in prompt_lower or 'site' in prompt_lower:
            return json.dumps({
                "tool": "create_web_app",
                "args": {"name": "BranpySite"}
            })
        elif 'server' in prompt_lower or 'api' in prompt_lower:
            return json.dumps({
                "tool": "create_server",
                "args": {"name": "BranpyServer"}
            })
        else:
            return json.dumps({
                "tool": "create_file",
                "args": {"path": "README.md", "content": f"# Projeto Criado pelo BranPy Agent\n\nSolicitação: {prompt}"}
            })

    def execute(self, task: str) -> Dict[str, Any]:
        """Executa uma tarefa completa — gera, constrói e entrega."""
        print(f"\n{'='*60}")
        print(f"BRANPY AGENT — Executando tarefa")
        print(f"{'='*60}")
        print(f"Tarefa: {task}")

        # Gerar plano de ação
        plan = self._generate_plan(task)
        print(f"\nPlano: {len(plan)} passos")

        # Executar cada passo
        results = []
        for i, step in enumerate(plan):
            print(f"\n[{i+1}/{len(plan)}] {step.get('description', 'Executando...')}")

            tool_name = step.get('tool', 'create_file')
            args = step.get('args', {})

            if tool_name in self.tools:
                try:
                    result = self.tools[tool_name](**args)
                    results.append({
                        'step': i + 1,
                        'tool': tool_name,
                        'success': True,
                        'result': result
                    })
                    print(f"  ✅ Sucesso")
                except Exception as e:
                    results.append({
                        'step': i + 1,
                        'tool': tool_name,
                        'success': False,
                        'error': str(e)
                    })
                    print(f"  ❌ Erro: {e}")
            else:
                print(f"  ⚠️ Ferramenta desconhecida: {tool_name}")

        # Resumo
        success_count = sum(1 for r in results if r['success'])
        print(f"\n{'='*60}")
        print(f"CONCLUÍDO: {success_count}/{len(plan)} passos OK")
        print(f"{'='*60}")

        return {
            'task': task,
            'plan': plan,
            'results': results,
            'success_count': success_count,
            'total_steps': len(plan)
        }

    def _generate_plan(self, task: str) -> List[Dict]:
        """Gera plano de ação baseado na tarefa."""
        prompt = f"""Analise esta tarefa e gere um plano JSON com as ferramentas necessárias:

TAREFA: {task}

Ferramentas disponíveis:
- create_file(path, content) — Cria arquivo
- create_folder(path) — Cria pasta
- create_android_app(app_name, package, features) — App Android completo
- create_web_app(name, features) — Site completo
- create_server(name, port, features) — Servidor backend
- create_flutter_app(name, features) — App Flutter
- run_command(command) — Executa comando
- install_dependencies(requirements) — Instala dependências

Responda APENAS com JSON array:
[
  {{"tool": "create_folder", "args": {{...}}, "description": "Criar pasta X"}},
  {{"tool": "create_file", "args": {{...}}, "description": "Criar arquivo Y"}}
]
"""

        response = self.generate(prompt, max_tokens=1024)

        try:
            # Tentar extrair JSON
            json_match = re.search(r'\[.*\]', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
        except json.JSONDecodeError:
            pass

        # Fallback: plano genérico baseado na tarefa
        return self._fallback_plan(task)

    def _fallback_plan(self, task: str) -> List[Dict]:
        """Plano fallback baseado em palavras-chave."""
        task_lower = task.lower()

        if any(w in task_lower for w in ['android', 'apk', 'app mobile']):
            return [{
                'tool': 'create_android_app',
                'args': {'app_name': 'BranpyApp', 'package': 'branpy.app', 'features': task},
                'description': 'Criar aplicativo Android'
            }]
        elif any(w in task_lower for w in ['website', 'site', 'web', 'landing']):
            return [{
                'tool': 'create_web_app',
                'args': {'name': 'BranpySite', 'features': task},
                'description': 'Criar website completo'
            }]
        elif any(w in task_lower for w in ['server', 'api', 'backend']):
            return [{
                'tool': 'create_server',
                'args': {'name': 'BranpyServer', 'port': 8000, 'features': task},
                'description': 'Criar servidor backend'
            }]
        else:
            return [{
                'tool': 'create_file',
                'args': {'path': 'projeto/README.md', 'content': f'# Projeto\n\n{task}'},
                'description': 'Criar estrutura básica'
            }]

    # ==================== FERRAMENTAS ====================

    def _create_file(self, path: str, content: str) -> str:
        """Cria arquivo com conteúdo."""
        full_path = os.path.join(self.workspace, path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)

        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)

        return f"Arquivo criado: {full_path}"

    def _create_folder(self, path: str) -> str:
        """Cria pasta."""
        full_path = os.path.join(self.workspace, path)
        os.makedirs(full_path, exist_ok=True)
        return f"Pasta criada: {full_path}"

    def _write_file(self, path: str, content: str) -> str:
        """Escreve em arquivo existente."""
        return self._create_file(path, content)

    def _read_file(self, path: str) -> str:
        """Lê arquivo."""
        full_path = os.path.join(self.workspace, path)
        with open(full_path, 'r', encoding='utf-8') as f:
            return f.read()

    def _list_files(self, path: str = '') -> str:
        """Lista arquivos."""
        full_path = os.path.join(self.workspace, path)
        files = os.listdir(full_path)
        return '\n'.join(files)

    def _run_command(self, command: str) -> str:
        """Executa comando do sistema."""
        try:
            result = subprocess.run(
                command, shell=True, capture_output=True, text=True, timeout=60
            )
            return f"STDOUT:\n{result.stdout}\nSTDERR:\n{result.stderr}"
        except subprocess.TimeoutExpired:
            return "Comando expirou (60s)"
        except Exception as e:
            return f"Erro: {e}"

    def _install_dependencies(self, requirements: List[str]) -> str:
        """Instala dependências."""
        cmd = f"pip install {' '.join(requirements)}"
        return self._run_command(cmd)

    def _build_project(self, project_path: str) -> str:
        """Compila/projeto."""
        full_path = os.path.join(self.workspace, project_path)

        if os.path.exists(os.path.join(full_path, 'pubspec.yaml')):
            # Flutter
            return self._run_command(f'flutter pub get && flutter build apk', workdir=full_path)
        elif os.path.exists(os.path.join(full_path, 'package.json')):
            # Node.js
            return self._run_command('npm install', workdir=full_path)
        elif os.path.exists(os.path.join(full_path, 'requirements.txt')):
            # Python
            return self._run_command('pip install -r requirements.txt', workdir=full_path)

        return "Tipo de projeto não reconhecido"

    def _create_android_app(self, app_name: str = "BranpyApp",
                            package: str = "branpy.app",
                            features: str = "") -> str:
        """Cria aplicativo Android completo."""
        project_dir = os.path.join(self.workspace, app_name)
        os.makedirs(project_dir, exist_ok=True)

        # Estrutura de pastas
        dirs = [
            'app/src/main/java/branpy/app',
            'app/src/main/res/layout',
            'app/src/main/res/values',
            'app/src/main/res/drawable',
            'app/src/main/res/xml',
        ]
        for d in dirs:
            os.makedirs(os.path.join(project_dir, d), exist_ok=True)

        # build.gradle (projeto)
        build_gradle = f"""buildscript {{
    repositories {{
        google()
        mavenCentral()
    }}
    dependencies {{
        classpath 'com.android.tools.build:gradle:8.2.0'
    }}
}}

allprojects {{
    repositories {{
        google()
        mavenCentral()
    }}
}}
"""
        self._write_file(f'{app_name}/build.gradle', build_gradle)

        # build.gradle (app)
        app_gradle = f"""plugins {{
    id 'com.android.application'
}}

android {{
    namespace '{package}'
    compileSdk 34

    defaultConfig {{
        applicationId '{package}'
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName '1.0'
    }}

    buildTypes {{
        release {{
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }}
    }}

    compileOptions {{
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }}
}}

dependencies {{
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
}}
"""
        self._write_file(f'{app_name}/app/build.gradle', app_gradle)

        # AndroidManifest.xml
        manifest = f"""<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="{app_name}"
        android:theme="@style/Theme.MaterialComponents.NoActionBar">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
"""
        self._write_file(f'{app_name}/app/src/main/AndroidManifest.xml', manifest)

        # MainActivity.java
        main_activity = f"""package {package};

import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {{
    @Override
    protected void onCreate(Bundle savedInstanceState) {{
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
    }}
}}
"""
        self._write_file(f'{app_name}/app/src/main/java/branpy/app/MainActivity.java', main_activity)

        # activity_main.xml
        layout = f"""<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="{app_name}"
        android:textSize="24sp"
        app:layout_constraintTop_toTopOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintBottom_toBottomOf="parent" />

</androidx.constraintlayout.widget.ConstraintLayout>
"""
        self._write_file(f'{app_name}/app/src/main/res/layout/activity_main.xml', layout)

        # styles.xml
        styles = """<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.MaterialComponents.NoActionBar" parent="Theme.MaterialComponents.DayNight.NoActionBar">
        <item name="colorPrimary">#FF6B00</item>
        <item name="colorPrimaryVariant">#CC5500</item>
        <item name="colorOnPrimary">#FFFFFF</item>
    </style>
</resources>
"""
        self._write_file(f'{app_name}/app/src/main/res/values/styles.xml', styles)

        return f"App Android criado em: {project_dir}"

    def _create_web_app(self, name: str = "BranpySite",
                        features: str = "") -> str:
        """Cria website completo."""
        project_dir = os.path.join(self.workspace, name)
        os.makedirs(project_dir, exist_ok=True)

        # index.html
        html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{name}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <nav>
            <a href="#" class="logo">{name}</a>
            <ul>
                <li><a href="#">Home</a></li>
                <li><a href="#">Sobre</a></li>
                <li><a href="#">Contato</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <section class="hero">
            <h1>Bem-vindo ao {name}</h1>
            <p>Site criado pelo BranPy Agent</p>
            <button>Saiba Mais</button>
        </section>
    </main>

    <footer>
        <p>&copy; 2024 {name} — branpy.com.br</p>
    </footer>

    <script src="script.js"></script>
</body>
</html>
"""
        self._write_file(f'{name}/index.html', html)

        # style.css
        css = f"""* {{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}}

body {{
    font-family: 'Segoe UI', sans-serif;
    background: #0a0a0a;
    color: #fff;
}}

header {{
    background: #111;
    padding: 1rem 2rem;
}}

nav {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
}}

.logo {{
    font-size: 1.5rem;
    font-weight: bold;
    color: #ff6b00;
    text-decoration: none;
}}

nav ul {{
    display: flex;
    list-style: none;
    gap: 2rem;
}}

nav a {{
    color: #fff;
    text-decoration: none;
    transition: color 0.3s;
}}

nav a:hover {{
    color: #ff6b00;
}}

.hero {{
    min-height: 80vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 2rem;
}}

.hero h1 {{
    font-size: 3rem;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #ff6b00, #ff9500);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}}

.hero p {{
    font-size: 1.2rem;
    color: #888;
    margin-bottom: 2rem;
}}

button {{
    padding: 1rem 2rem;
    font-size: 1rem;
    background: #ff6b00;
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.3s, background 0.3s;
}}

button:hover {{
    background: #cc5500;
    transform: scale(1.05);
}}

footer {{
    text-align: center;
    padding: 2rem;
    color: #555;
    border-top: 1px solid #222;
}}
"""
        self._write_file(f'{name}/style.css', css)

        # script.js
        js = f"""// {name} — Script Principal
document.addEventListener('DOMContentLoaded', function() {{
    console.log('{name} carregado!');

    const button = document.querySelector('button');
    if (button) {{
        button.addEventListener('click', function() {{
            alert('Branpy Agent criou este site!');
        }});
    }}
}});
"""
        self._write_file(f'{name}/script.js', js)

        return f"Website criado em: {project_dir}"

    def _create_server(self, name: str = "BranpyServer",
                       port: int = 8000,
                       features: str = "") -> str:
        """Cria servidor backend."""
        project_dir = os.path.join(self.workspace, name)
        os.makedirs(project_dir, exist_ok=True)

        # requirements.txt
        self._write_file(f'{name}/requirements.txt',
                        'fastapi\nuvicorn\npydantic\nsqlalchemy\npython-jose\npasslib\nbcrypt')

        # main.py
        server_code = f""""""
        from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import uvicorn

app = FastAPI(title="{name}")

# Modelos
class Item(BaseModel):
    id: Optional[int] = None
    title: str
    description: Optional[str] = None

class User(BaseModel):
    username: str
    email: str

# Banco de dados fake
items_db = []
users_db = []

# Rotas
@app.get("/")
async def root():
    return {{"message": "{name} — branpy.com.br"}}

@app.get("/health")
async def health():
    return {{"status": "ok"}}

@app.post("/items/")
async def create_item(item: Item):
    item.id = len(items_db) + 1
    items_db.append(item)
    return item

@app.get("/items/")
async def list_items():
    return items_db

@app.get("/items/{{item_id}}")
async def get_item(item_id: int):
    for item in items_db:
        if item.id == item_id:
            return item
    raise HTTPException(status_code=404, detail="Item não encontrado")

@app.delete("/items/{{item_id}}")
async def delete_item(item_id: int):
    global items_db
    items_db = [i for i in items_db if i.id != item_id]
    return {{"deleted": True}}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port={port})
"""
        self._write_file(f'{name}/main.py', server_code)

        return f"Servidor criado em: {project_dir}"

    def _create_flutter_app(self, name: str = "BranpyFlutter",
                            features: str = "") -> str:
        """Cria app Flutter."""
        project_dir = os.path.join(self.workspace, name)

        # Criar projeto Flutter
        cmd = f"flutter create {name}"
        self._run_command(cmd)

        # Modificar main.dart
        main_dart = f"""import 'package:flutter/material.dart';

void main() {{
  runApp(const MyApp());
}}

class MyApp extends StatelessWidget {{
  const MyApp({{Key? key}}) : super(key: key);

  @override
  Widget build(BuildContext context) {{
    return MaterialApp(
      title: '{name}',
      theme: ThemeData(
        primarySwatch: Colors.orange,
        scaffoldBackgroundColor: const Color(0xFF0A0A0A),
      ),
      home: const HomeScreen(),
    );
  }}
}}

class HomeScreen extends StatelessWidget {{
  const HomeScreen({{Key? key}}) : super(key: key);

  @override
  Widget build(BuildContext context) {{
    return Scaffold(
      appBar: AppBar(
        title: const Text('{name}'),
        backgroundColor: const Color(0xFF111111),
      ),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.android, size: 100, color: Color(0xFFFF6B00)),
            SizedBox(height: 20),
            Text(
              'Branpy Agent',
              style: TextStyle(
                fontSize: 24,
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 10),
            Text(
              'App criado automaticamente',
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }}
}}
"""
        main_path = os.path.join(project_dir, 'lib', 'main.dart')
        if os.path.exists(main_path):
            with open(main_path, 'w', encoding='utf-8') as f:
                f.write(main_dart)

        return f"App Flutter criado em: {project_dir}"


def run_agent():
    """Executa o agente com interface de comando."""
    agent = BranPyAgent()

    print("\n" + "="*60)
    print("BRANPY AGENT — Agente Autônomo")
    print("100% branpy.com.br — Todos os direitos reservados")
    print("="*60)
    print("\nComandos:")
    print("  Criar app Android: 'criar app android [nome]'")
    print("  Criar website:     'criar site [nome]'")
    print("  Criar servidor:    'criar server [nome]'")
    print("  Criar Flutter:     'criar flutter [nome]'")
    print("  Sair:              'sair'")
    print()

    while True:
        try:
            task = input("Tarefa > ").strip()

            if task.lower() in ['sair', 'exit', 'quit']:
                print("Encerrando...")
                break

            if not task:
                continue

            result = agent.execute(task)

            print(f"\nResultado: {result['success_count']}/{result['total_steps']} passos OK")
            print(f"Projeto em: {agent.workspace}")

        except KeyboardInterrupt:
            print("\nEncerrando...")
            break
        except Exception as e:
            print(f"Erro: {e}")


if __name__ == '__main__':
    run_agent()
