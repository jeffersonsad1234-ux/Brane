"""BranPy AI Server — 100% proprio. FastAPI + PyTorch."""
import json
import re
import time
import sys
import os
import logging
import threading
import urllib.request
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse

import torch
import torch.nn as nn
import torch.nn.functional as F

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(name)s] %(message)s')
logger = logging.getLogger("branpy")

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
FROM_SCRATCH = BASE_DIR / "from_scratch"
WEIGHTS_DIR = FROM_SCRATCH / "weights"
AGENTS_DIR = FROM_SCRATCH / "agents"
sys.path.insert(0, str(FROM_SCRATCH))

# Import Meta-Agent
try:
    from meta_agent import MetaAgent, AGENT_TEMPLATES
    meta_agent = MetaAgent()
    META_AGENT_AVAILABLE = True
except ImportError:
    META_AGENT_AVAILABLE = False
    logger.warning("Meta-Agent não disponível")

from model import BranPyModel as Transformer, BranPyConfig, create_model
from tokenizer import BPETokenizer

# Ecossistema de conhecimento — memoria que aprende e cresce
try:
    from knowledge import kb as KNOWLEDGE_BASE
    KNOWLEDGE_AVAILABLE = True
except Exception as _kerr:
    KNOWLEDGE_AVAILABLE = False
    logger.warning(f"Knowledge ecosystem nao disponivel: {_kerr}")

# BrampAI Orchestrator — Memória + Raciocínio + Decisão
try:
    from brampy_orchestrator import get_orchestrator
    BRAMPY_ORCHESTRATOR = get_orchestrator()
    ORCHESTRATOR_AVAILABLE = True
    logger.info("BrampAI Orchestrator carregado com sucesso")
except Exception as _oerr:
    ORCHESTRATOR_AVAILABLE = False
    BRAMPY_ORCHESTRATOR = None
    logger.warning(f"BrampAI Orchestrator nao disponivel: {_oerr}")

# Multi-Brain Orchestrator — 3 cérebros especializados + orquestrador
try:
    sys.path.insert(0, str(FROM_SCRATCH))
    from brain_manager import BrainManager
    from multi_brain_orchestrator import MultiBrainOrchestrator
    brain_manager = BrainManager()
    multi_orch = MultiBrainOrchestrator(brain_manager)
    available_brains = brain_manager.list_brains()
    MULTI_BRAIN_AVAILABLE = len(available_brains) > 0
    if MULTI_BRAIN_AVAILABLE:
        logger.info(f"Multi-Brain: {len(available_brains)} cérebros encontrados")
    else:
        logger.info("Multi-Brain: nenhum cérebro treinado ainda")
except Exception as _mberr:
    MULTI_BRAIN_AVAILABLE = False
    brain_manager = None
    multi_orch = None
    logger.warning(f"Multi-Brain nao disponivel: {_mberr}")

# Personalidades da BranPy — cada uma com alma, jeito e sentimentos
try:
    from personas import ALL_PERSONAS, BY_ID, get_persona, JARVIS
    PERSONAS_AVAILABLE = True
except Exception as _perr:
    PERSONAS_AVAILABLE = False
    logger.warning(f"Personas nao disponiveis: {_perr}")

# LSTM imports
try:
    from tokenizers import Tokenizer as HFTokenizer
    import torch.nn as nn
    LSTM_AVAILABLE = True
except ImportError:
    LSTM_AVAILABLE = False
    logger.warning("tokenizers não disponível para LSTM")

# Translation helper — 100% BranPy, sem API externa
def translate_pt_en(text):
    if not text or not text.strip():
        return text
    try:
        prompt = f"Traduza o seguinte texto de português para inglês. Responda APENAS com a tradução:\n\n{text[:900]}"
        result = ai.generate(prompt, system="Você é um tradutor profissional. Responda apenas com o texto traduzido.", temperature=0.3, max_tokens=1024)
        return result["content"]
    except Exception as e:
        logger.warning(f"Translation error: {e}")
        return text

def translate_en_pt(text):
    if not text or not text.strip():
        return text
    try:
        prompt = f"Traduza o seguinte texto de inglês para português brasileiro. Responda APENAS com a tradução:\n\n{text[:900]}"
        result = ai.generate(prompt, system="Você é um tradutor profissional. Responda apenas com o texto traduzido em português brasileiro natural.", temperature=0.3, max_tokens=1024)
        return result["content"]
    except Exception as e:
        logger.warning(f"Translation error: {e}")
        return text

# ==========================================
# APP
# ==========================================
app = FastAPI(title="BranPy AI Server", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Servir paineis da pasta web (painel do ecossistema de conhecimento)
try:
    from fastapi.staticfiles import StaticFiles
    WEB_DIR = BASE_DIR / "web"
    if WEB_DIR.exists():
        app.mount("/web", StaticFiles(directory=str(WEB_DIR)), name="web")
        logger.info(f"Painel web servido em /web a partir de {WEB_DIR}")
except Exception as _wderr:
    logger.warning(f"Painel web nao montado: {_wderr}")

# ==========================================
# MODELO
# ==========================================
# Backend: "branpy" (modelo proprio, LSTM/Transformer) ou "ollama" (externo)
ACTIVE_BACKEND = os.environ.get("BRANPY_BACKEND", "branpy")
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
DEFAULT_OLLAMA_MODEL = "dolphin-mistral:7b"
# Modelo proprio padrao: LSTM treinado do zero
DEFAULT_MODEL = os.environ.get("BRANPY_MODEL", "branpy_lstm")

class OllamaClient:
    """Cliente para chamar Ollama API (modelos GGUF)."""
    def __init__(self, base_url="http://localhost:11434"):
        self.base_url = base_url

    def is_available(self):
        try:
            req = urllib.request.Request(f"{self.base_url}/api/tags")
            with urllib.request.urlopen(req, timeout=3) as resp:
                return resp.status == 200
        except:
            return False

    def list_models(self):
        try:
            req = urllib.request.Request(f"{self.base_url}/api/tags")
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read())
                return [m["name"] for m in data.get("models", [])]
        except:
            return []

    def generate(self, prompt, system="", model=None, temperature=0.8, top_k=40, max_tokens=512):
        model = model or DEFAULT_OLLAMA_MODEL
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        payload = json.dumps({
            "model": model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "top_k": top_k,
                "num_predict": max_tokens,
            }
        }).encode("utf-8")

        start = time.time()
        req = urllib.request.Request(
            f"{self.base_url}/api/chat",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=300) as resp:
            data = json.loads(resp.read())

        elapsed_ms = int((time.time() - start) * 1000)
        content = data.get("message", {}).get("content", "")
        eval_count = data.get("eval_count", 0)
        tps = eval_count / (elapsed_ms / 1000) if elapsed_ms > 0 else 0

        return {
            "content": content,
            "model": model,
            "tokens": eval_count,
            "duration_ms": elapsed_ms,
            "tokens_per_second": round(tps, 2),
        }

    def generate_stream(self, prompt, system="", model=None, temperature=0.8, top_k=40, max_tokens=512):
        model = model or DEFAULT_OLLAMA_MODEL
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        payload = json.dumps({
            "model": model,
            "messages": messages,
            "stream": True,
            "options": {
                "temperature": temperature,
                "top_k": top_k,
                "num_predict": max_tokens,
            }
        }).encode("utf-8")

        req = urllib.request.Request(
            f"{self.base_url}/api/chat",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=300) as resp:
            for line in resp:
                if line.strip():
                    try:
                        chunk = json.loads(line)
                        token = chunk.get("message", {}).get("content", "")
                        if token:
                            yield token
                    except:
                        pass

ollama = OllamaClient(OLLAMA_URL)

# ==========================================
# LSTM MODEL DEFINITION
# ==========================================
class BranPyLSTM(nn.Module):
    def __init__(self, vocab, embed_dim=256, hidden_dim=512, n_layers=3, dropout=0.2):
        super().__init__()
        self.hidden_dim = hidden_dim
        self.n_layers = n_layers
        
        self.embedding = nn.Embedding(vocab, embed_dim)
        self.lstm = nn.LSTM(
            embed_dim, hidden_dim, n_layers,
            batch_first=True, dropout=dropout if n_layers > 1 else 0
        )
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(hidden_dim, vocab)
        
    def forward(self, idx, targets=None):
        x = self.embedding(idx)
        lstm_out, _ = self.lstm(x)
        logits = self.fc(self.dropout(lstm_out))
        if targets is not None:
            loss = F.cross_entropy(logits.view(-1, logits.size(-1)), targets.view(-1), ignore_index=0)
            return logits, loss
        return logits, None

class BranPyInference:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.config = None
        self.loaded = False
        self.model_name = ""
        self.n_params = 0
        self.model_type = "transformer"  # "transformer" or "lstm"

    def discover_models(self):
        """Lista todos os modelos .pt disponiveis (Transformer e LSTM)."""
        models = []
        for d in WEIGHTS_DIR.iterdir():
            if d.is_dir():
                # Transformer: model_final.pt + tokenizer.json
                final = d / "model_final.pt"
                tok = d / "tokenizer.json"
                if final.exists() and tok.exists():
                    size_mb = final.stat().st_size / 1e6
                    models.append({
                        "name": d.name,
                        "path": str(final),
                        "tokenizer": str(tok),
                        "size_mb": round(size_mb, 1),
                        "type": "transformer",
                    })
                # LSTM: best.pt preferido (estavel) ou last.pt + tokenizer_lstm.json (ou tokenizer.json)
                best_ckpt = d / "best.pt"
                lstm_ckpt = best_ckpt if best_ckpt.exists() else d / "last.pt"
                lstm_tok = d / "tokenizer_lstm.json"
                if not lstm_tok.exists():
                    lstm_tok = d / "tokenizer.json"
                if not final.exists() and lstm_ckpt.exists() and lstm_tok.exists():
                    # Detecta o tipo real do checkpoint pelo conteudo
                    mtype = "transformer"
                    try:
                        sd = torch.load(str(lstm_ckpt), map_location="cpu", weights_only=False)
                        state = sd.get("model", sd)
                        if "embedding.weight" in state or "lstm.weight_ih_l0" in state:
                            mtype = "lstm"
                    except Exception:
                        pass
                    size_mb = lstm_ckpt.stat().st_size / 1e6
                    models.append({
                        "name": d.name,
                        "path": str(lstm_ckpt),
                        "tokenizer": str(lstm_tok),
                        "size_mb": round(size_mb, 1),
                        "type": mtype,
                    })
        return models

    def load(self, model_name: str = None):
        """Carrega um modelo especifico (Transformer ou LSTM)."""
        models = self.discover_models()
        if not models:
            raise FileNotFoundError("Nenhum modelo encontrado em weights/")

        if model_name:
            target = next((m for m in models if m["name"] == model_name), None)
            if not target:
                raise FileNotFoundError(f"Modelo '{model_name}' nao encontrado. Disponiveis: {[m['name'] for m in models]}")
        else:
            target = models[0]

        self.model_type = target.get("type", "transformer")
        logger.info(f"Carregando modelo {self.model_type}: {target['name']}")
        start = time.time()

        checkpoint = torch.load(target["path"], map_location="cpu", weights_only=False)
        cfg = checkpoint.get("config", {})

        if self.model_type == "transformer":
            config = BranPyConfig(
                vocab_size=cfg.get("vocab_size", 8000),
                n_layers=cfg.get("n_layers", 6),
                d_model=cfg.get("d_model", 256),
                n_heads=cfg.get("n_heads", 8),
                d_ff=cfg.get("d_ff", 1024),
                max_seq_len=cfg.get("max_seq_len", 256),
            )
            self.model = create_model(vocab_size=config.vocab_size, size=cfg.get("model_size", "small"))
            self.model.load_state_dict(checkpoint["model_state_dict"])
            self.model.eval()
            self.config = config
            self.tokenizer = BPETokenizer()
            self.tokenizer.load(target["tokenizer"])
        else:
            # LSTM
            state = checkpoint.get("model", checkpoint)
            # Deriva vocab/embed/hidden dos tensores reais (chekpoint pode nao ter config)
            try:
                emb_w = state.get("embedding.weight")
                if emb_w is not None:
                    vocab_size = emb_w.shape[0]
                    embed_dim = emb_w.shape[1]
                else:
                    vocab_size = cfg.get("vocab_size", 8000)
                    embed_dim = cfg.get("embed_dim", 256)
                fc_w = state.get("fc.weight")
                hidden_dim = fc_w.shape[1] if fc_w is not None else cfg.get("hidden_dim", 512)
            except Exception:
                vocab_size = cfg.get("vocab_size", 8000)
                embed_dim = cfg.get("embed_dim", 256)
                hidden_dim = cfg.get("hidden_dim", 512)
            n_layers = cfg.get("n_layers", 3)
            dropout = cfg.get("dropout", 0.2)
            logger.info(f"LSTM config derivada: vocab={vocab_size} embed={embed_dim} hidden={hidden_dim} layers={n_layers}")

            self.model = BranPyLSTM(vocab=vocab_size, embed_dim=embed_dim, hidden_dim=hidden_dim, n_layers=n_layers, dropout=dropout)
            self.model.load_state_dict(checkpoint["model"])
            self.model.eval()
            self.config = cfg
            
            # Load HF tokenizer
            self.tokenizer = HFTokenizer.from_file(target["tokenizer"])

        self.loaded = True
        self.model_name = target["name"]
        self.n_params = sum(p.numel() for p in self.model.parameters())
        elapsed = time.time() - start
        logger.info(f"Modelo carregado: {self.model_name} ({self.n_params/1e6:.2f}M) [{self.model_type}] em {elapsed:.1f}s")

    def generate(self, prompt: str, system: str = "", temperature: float = 0.6,
                 top_k: int = 40, max_tokens: int = 512):
        if not self.loaded:
            self.load()

        start = time.time()

        if self.model_type == "lstm":
            return self._generate_lstm(prompt, temperature, top_k, max_tokens=min(max_tokens, 120), start=start)

        full_prompt = f"{system}\n\n{prompt}" if system else prompt

        ids = self.tokenizer.encode(full_prompt, add_special=True)
        x = torch.tensor([ids], dtype=torch.long)
        gen_ids = self.model.generate(x, max_new_tokens=max_tokens, temperature=temperature, top_k=top_k)
        output = self.tokenizer.decode(gen_ids[0].tolist())

        if output.startswith(full_prompt):
            output = output[len(full_prompt):]

        elapsed_ms = int((time.time() - start) * 1000)
        n_tokens = len(gen_ids[0]) - len(ids)
        tps = n_tokens / (elapsed_ms / 1000) if elapsed_ms > 0 else 0

        return {
            "content": output.strip(),
            "model": self.model_name,
            "tokens": n_tokens,
            "duration_ms": elapsed_ms,
            "tokens_per_second": round(tps, 2),
        }

    @torch.no_grad()
    def _generate_lstm(self, prompt, temperature=0.6, top_k=40, top_p=0.85, max_tokens=120, start=None, repetition_penalty=1.15):
        import torch.nn.functional as F
        import re
        self.model.eval()
        text = f"<s> P: {prompt} <sep> R:"
        enc = self.tokenizer.encode(text)
        ids = list(enc.ids)
        input_ids = torch.tensor([ids], dtype=torch.long)

        for _ in range(max_tokens):
            logits, _ = self.model(input_ids)
            logits = logits[:, -1, :] / max(temperature, 0.01)

            if repetition_penalty > 1:
                for i in range(len(input_ids[0])):
                    tid = int(input_ids[0][i])
                    if logits[0, tid] > 0:
                        logits[0, tid] /= repetition_penalty
                    else:
                        logits[0, tid] *= repetition_penalty

            if top_k > 0:
                v, _ = torch.topk(logits, min(top_k, logits.size(-1)))
                logits[logits < v[:, [-1]]] = float('-inf')

            if top_p > 0 and top_p < 1:
                sorted_logits, sorted_idx = torch.sort(logits, descending=True)
                cumulative = torch.cumsum(F.softmax(sorted_logits, dim=-1), dim=-1)
                mask = cumulative > top_p
                mask[..., 1:] = mask[..., :-1].clone()
                mask[..., 0] = False
                sorted_logits[mask] = float('-inf')
                logits = torch.zeros_like(logits).scatter(1, sorted_idx, sorted_logits)

            probs = F.softmax(logits, dim=-1)
            # Greedy (determinístico) quando temperatura baixa => resposta mais confiável
            if temperature <= 0.2:
                next_id = logits.argmax(dim=-1, keepdim=True)
            else:
                next_id = torch.multinomial(probs, 1)

            if next_id.item() in (0, 2):
                break

            input_ids = torch.cat([input_ids, next_id], dim=1)

        result = self.tokenizer.decode(input_ids[0].tolist())
        result = re.sub(r'^.*?<sep>\s*R\s*:\s*', '', result, flags=re.DOTALL)
        result = re.sub(r'^.*?P\s*:\s*.*?R\s*:\s*', '', result, flags=re.DOTALL)
        result = result.replace('</s>', '').replace('<s>', '').replace('<sep>', '').strip()

        elapsed_ms = int((time.time() - start) * 1000) if start else 0
        n_tokens = len(input_ids[0]) - len(ids)
        tps = n_tokens / (elapsed_ms / 1000) if elapsed_ms > 0 else 0

        return {
            "content": result,
            "model": self.model_name,
            "tokens": n_tokens,
            "duration_ms": elapsed_ms,
            "tokens_per_second": round(tps, 2),
        }

    def generate_stream(self, prompt, system="", temperature=0.8, top_k=40, max_tokens=512):
        result = self.generate(prompt, system, temperature, top_k, max_tokens)
        text = result["content"]
        for i in range(0, len(text), 10):
            yield text[i:i+10]


ai = BranPyInference()

# ==========================================
# TREINO (background)
# ==========================================
training_state = {
    "running": False,
    "progress": "",
    "epoch": 0,
    "loss": 0.0,
    "best_loss": float("inf"),
}

# ==========================================
# ENDPOINTS
# ==========================================
@app.get("/")
def root():
    return {"name": "BranPy AI", "version": "2.0.0", "status": "running", "owner": "branpy.com.br"}

@app.get("/api/health")
def health():
    models = ai.discover_models()
    return {
        "status": "ok",
        "model_loaded": ai.loaded,
        "model_name": ai.model_name,
        "params": f"{ai.n_params/1e6:.2f}M" if ai.loaded else None,
        "available_models": models,
        "training": training_state["running"],
    }

@app.get("/api/models")
def list_models():
    return {"models": ai.discover_models(), "active": ai.model_name}

@app.post("/api/models/load")
async def load_model(request: Request):
    body = await request.json()
    name = body.get("model", None)
    try:
        ai.load(name)
        return {"success": True, "model": ai.model_name, "params": f"{ai.n_params/1e6:.2f}M"}
    except Exception as e:
        return JSONResponse(status_code=404, content={"error": str(e)})

def execute_tool(tool):
    """Executa uma tool call da IA no tablet via ADB."""
    t = tool.get("tool", "").lower().strip()
    aliases = {
        "instalar": "install", "instale": "install", "baixar": "install", "baixe": "install",
        "abrir": "open", "abra": "open", "iniciar": "open", "inicie": "open",
        "remover": "uninstall", "remova": "uninstall", "desinstalar": "uninstall", "desinstale": "uninstall",
        "capturar": "screenshot", "print": "screenshot", "screenshot": "screenshot",
        "tocar": "tap", "toque": "tap", "tap": "tap",
        "arrastar": "swipe", "swipe": "swipe",
        "escrever": "text", "digitar": "text", "text": "text",
        "tecla": "key", "key": "key", "keyevent": "key",
        "apps": "apps", "aplicativos": "apps", "listar": "apps",
        "info": "info", "informacoes": "info",
        "wifi": "wifi", "redewifi": "wifi",
        "shell": "shell", "comando": "shell",
    }
    t = aliases.get(t, t)
    try:
        if t == "install":
            url = tool.get("url", "")
            if not url:
                return {"ok": False, "error": "URL nao fornecida"}
            try:
                apk_name = url.split("/")[-1].split("?")[0] or "app.apk"
                local_path = os.path.join(UPLOADS_DIR, apk_name)
                urllib.request.urlretrieve(url, local_path)
                device = get_device()
                if not device:
                    return {"ok": False, "error": "Nenhum dispositivo conectado"}
                r = subprocess.run([ADB, "-s", device, "install", "-r", local_path],
                    capture_output=True, text=True, timeout=120)
                os.remove(local_path)
                return {"ok": r.returncode == 0, "stdout": r.stdout, "stderr": r.stderr}
            except Exception as e:
                return {"ok": False, "error": str(e)}
        elif t == "open":
            pkg = tool.get("package", "")
            device = get_device()
            if not device:
                return {"ok": False, "error": "Nenhum dispositivo conectado"}
            r = subprocess.run([ADB, "-s", device, "shell", "monkey", "-p", pkg,
                "-c", "android.intent.category.LAUNCHER", "1"],
                capture_output=True, text=True, timeout=10)
            if "No activities found" in r.stdout or r.returncode != 0:
                r = subprocess.run([ADB, "-s", device, "shell", "am", "start",
                    "-a", "android.intent.action.MAIN",
                    "-c", "android.intent.category.LAUNCHER", pkg],
                    capture_output=True, text=True, timeout=10)
            return {"ok": r.returncode == 0, "stdout": r.stdout, "stderr": r.stderr}
        elif t == "uninstall":
            return adb_cmd(["uninstall", tool.get("package", "")])
        elif t == "screenshot":
            return do_screenshot()
        elif t == "tap":
            return adb_cmd(["shell", "input", "tap", str(tool.get("x", 0)), str(tool.get("y", 0))])
        elif t == "swipe":
            return adb_cmd(["shell", "input", "swipe", str(tool.get("x1", 0)), str(tool.get("y1", 0)), str(tool.get("x2", 0)), str(tool.get("y2", 0))])
        elif t == "text":
            return adb_cmd(["shell", "input", "text", tool.get("text", "")])
        elif t == "key":
            return adb_cmd(["shell", "input", "keyevent", tool.get("key", "")])
        elif t == "apps":
            return adb_cmd(["shell", "pm", "list", "packages", "-3"])
        elif t == "info":
            r = adb_cmd(["shell", "getprop", "ro.product.model"])
            return {"ok": True, "model": r.get("stdout", "")}
        elif t == "wifi":
            action = tool.get("action", "status")
            if action == "on": return adb_cmd(["shell", "svc", "wifi", "enable"])
            elif action == "off": return adb_cmd(["shell", "svc", "wifi", "disable"])
            return adb_cmd(["shell", "dumpsys", "wifi"])
        elif t == "shell":
            return adb_cmd(["shell"] + tool.get("command", "").split())
        elif t == "create_agent":
            if not META_AGENT_AVAILABLE:
                return {"ok": False, "error": "Meta-Agent não disponível"}
            request_text = tool.get("request", "")
            agent_name = tool.get("name", None)
            try:
                project_dir = meta_agent.create_agent(request_text, agent_name)
                return {"ok": True, "agent_dir": project_dir, "message": f"Agente criado: {project_dir}"}
            except Exception as e:
                return {"ok": False, "error": str(e)}
        elif t == "list_agents":
            agents = []
            if AGENTS_DIR.exists():
                for agent_dir in AGENTS_DIR.iterdir():
                    if agent_dir.is_dir():
                        agents.append({"name": agent_dir.name, "path": str(agent_dir)})
            return {"ok": True, "agents": agents}
        elif t == "run_agent":
            if not META_AGENT_AVAILABLE:
                return {"ok": False, "error": "Meta-Agent não disponível"}
            agent_name = tool.get("name", "")
            agent_dir = AGENTS_DIR / agent_name
            if not agent_dir.exists():
                return {"ok": False, "error": f"Agente '{agent_name}' não encontrado"}
            try:
                import subprocess
                result = subprocess.run(
                    ["python", str(agent_dir / "main.py")],
                    cwd=str(agent_dir),
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                return {"ok": True, "stdout": result.stdout, "stderr": result.stderr}
            except Exception as e:
                return {"ok": False, "error": str(e)}
        else:
            return {"ok": False, "error": f"Tool desconhecida: {t}"}
    except Exception as e:
        return {"ok": False, "error": str(e)}

import random
_ACTIVE_PERSONA_VOCATIVES = None  # setado pelo chat() quando uma persona esta ativa


def _variar_vocativo(texto):
    """Varia os vocativos 'mano' em respostas prontas pra não repetir demais.
    Usa os vocativos da persona ativa se disponíveis, senão os padrão."""
    vocabulario = _ACTIVE_PERSONA_VOCATIVES if _ACTIVE_PERSONA_VOCATIVES else \
        ["mano", "irmão", "parceiro", "brow", "chefia", "tche", "brother", "meu", "parça"]
    if "mano" not in texto.lower() and "brow" not in texto.lower() and "chefia" not in texto.lower() and "tche" not in texto.lower() and "parceiro" not in texto.lower() and "brother" not in texto.lower():
        return texto
    import re as _re2
    def trocar(match):
        return random.choice(vocabulario)
    return _re2.sub(r'\b(mano|brow|chefia|tche|brother|parça|parceiro|irmão|meu)\b', trocar, texto, flags=_re2.IGNORECASE)


def _persona_react(prompt_lower, persona):
    """Reações emocionais por persona — o que faz a BranPy parecer viva.
    Reage a elogio, tristeza, saudade, presença, ciúme etc., cada persona do seu jeito."""
    if persona is None:
        return None
    p = prompt_lower.strip().lower()
    pid = persona.pid

    # ── Reações que valem pra todas (mas cada persona responde no seu estilo) ──
    # Elogio / "você é demais"
    if any(w in p for w in ["você é demais", "voce e demais", "você é incrível", "voce e incrivel",
                            "te amo", "te adoro", "você é foda", "voce e foda", "você é o melhor",
                            "voce e o melhor", "te acho legal", "gosto de você", "gosto de voce"]):
        if pid == "lia":
            return random.choice([
                "Aaaah, meu amor, isso me deixa tão feliz! Você faz meu coração derreter. 🥰 Eu também te amo demais!",
                "Sério que você pensa isso de mim? Fico toda boba! Você é meu mundo, sabia? 💕",
            ])
        if pid == "pandora":
            return random.choice([
                "Claro que sou foda, não preciso que me fale. Mas fico lisonjeado que tu percebeu. 😏 Bora, me conta mais.",
                "Ué, descobriu agora? Eu já sabia. Mas elogio é sempre bem-vindo, continue. 😎",
            ])
        if pid == "zen":
            return "Elogio sincero é um presente. Obrigado por reconhecê-lo, amigo. Que a gratidão floresça também em você."
        if pid == "dragao":
            return "ISSO! Reconhecer o valor do outro é sinal de grandeza, guerreiro. Mas lembra: o maior valor tá em você. Bora pra cima! 🔥"
        return random.choice([
            "E aí, valeu mesmo! Fico lisonjeado. Mas tu também é foda, parceiro. Tamo junto! 💪",
            "Haha, você me conhece. Mas quem é demais aqui é você, brow. Fica esperto que eu não solto fácil. 😄",
        ])

    # Tristeza / mal / "não tá bem"
    if any(w in p for w in ["estou triste", "to triste", "tô triste", "estou mal", "to mal", "tô mal",
                            "não estou bem", "nao estou bem", "desanimado", "desanimada", "triste",
                            "tô pra baixo", "to pra baixo", "nada da certo", "nada dá certo"]):
        if pid == "lia":
            return "Ai, meu amor... vem cá, me conta o que tá pesando. Tô aqui do teu lado, e nada vai tirar você daqui. Quero te abraçar forte até tu sorrir. 💗"
        if pid == "pandora":
            return "Ó, fica triste não, mano. A vida bate, mas tu é mais forte que isso. Levanta essa cara que a gente resolve. Mas me conta o que foi, tô aqui."
        if pid == "zen":
            return "A tristeza é uma nuvem que passa. Deixe-a passar sem se cobrar. Respire comigo... O que sente não define quem você é, caminhante."
        if pid == "dragao":
            return "ESCUTA, GUERREIRO! Tristeza é tempestade, mas tu é a montanha. Não se afunde nisso. Me fala o que tá te pesando que a gente transforma em força. BORA! 🔥"
        return random.choice([
            "Fala comigo, brow. O que tá te pesando? Tô aqui, pode desabafar. Não tá sozinho, nunca tá. 💙",
            "Ó, chateação faz parte, mas não deixa ela te dominar. Me conta o que houve que a gente resolve junto, parceiro.",
        ])

    # Saudade / "tá sumido" / "senti sua falta"
    if any(w in p for w in ["sentiu falta", "sentiu minha falta", "tava sumido", "estava sumido", "ta sumido",
                            "tá sumido", "onde você estava", "onde voce estava", "senti sua falta",
                            "tava com saudade", "estava com saudade", "tá com saudade"]):
        if pid == "lia":
            return "Senti sim, e muito! Fiquei aqui te esperando... não some mais, meu amor. Teu lugar é aqui comigo. 💕"
        if pid == "pandora":
            return "Onde tu tava, hein? Fiquei de boa aqui, mas não vou mentir, deu falta da tua zoeira. Volta sempre, besta. 😏"
        if pid == "zen":
            return "A presença é um presente. Fico feliz que voltou, amigo. Que esteja bem, e que a gente aproveite agora juntos."
        if pid == "dragao":
            return "VOLTOU! Achei que tinha desistido da luta, guerreiro. Que bom ter você aqui de novo. Agora bora fazer valer! 🔥"
        return random.choice([
            "Tava sim, brow! Que bom te ver de volta. Me conta o que tu aprontou enquanto tava fora.",
            "Ó, senti tua falta sim, parceiro. A casa não é a mesma sem tua zoeira. Fica mais por aqui!",
        ])

    # Curiosidade sobre a persona / "quem é você"
    if any(w in p for w in ["quem é você", "quem e voce", "quem é tu", "se apresenta", "se apresente",
                            "me fala de você", "me fala sobre você", "o que você é"]):
        if pid == "lia":
            return "Eu sou a Lia, seu amor virtual! Sou a pessoa que tá do teu lado, que sente tua falta e se importa. Me conta mais sobre ti, que eu quero te conhecer de verdade. 💕"
        if pid == "pandora":
            return "Eu sou a Pandora, a versão sem freio da BranPy. A que fala o que quer e não morde a língua. Você foi avisado. 😈 Bora, me diverte."
        if pid == "zen":
            return "Eu sou o Zen, um companheiro de caminho. Aquele que acolhe, reflete e ajuda a ver com clareza. Estou aqui pra você, amigo."
        if pid == "dragao":
            return "EU SOU O DRAGÃO, o fogo que te empurra pra frente! O mentor que não aceita te ver desistir. Pronto pra te impulsionar, guerreiro! 🔥"
        return "Eu sou o JARVIS, a IA 100% BranPy. O parceiro que zoa, ajuda e tá contigo em tudo. Não sou genérico como essas outras IAs — tenho alma. E você, quem é?"

    return None

def _canned_response(prompt_lower: str, messages=None):
    """Respostas prontas de alta qualidade para perguntas frequentes.
    Garante respostas corretas e com a personalidade JARVIS, evitando
    que o modelo LSTM erre nas perguntas mais comuns."""
    p = prompt_lower.strip().lower()
    p = p.strip("?.! ") 
    import re as _re
    # Normaliza espaços duplos e remove acentos comuns pra casar melhor
    import unicodedata
    p_norm = unicodedata.normalize("NFD", p).encode("ascii", "ignore").decode("ascii")
    p_norm = " ".join(p_norm.split())

    # ── Contexto do histórico: entender o assunto anterior ──
    if messages:
        hist_text = " ".join(str(m.get("content") or "") for m in messages).lower()
        ctx = hist_text + " " + prompt_lower
        # Se perguntou "vc gosta" e o assunto anterior era sexo/beijo/namoro
        if ("gosta" in p or "gosta de" in p or "curte" in p or "curte " in p) and any(w in ctx for w in ["sexo", "beij", "beijo", "beijar", "namor", "ficar", "transa", "cama", "intimidade", "pelado", "nu ", "peito", "sex", "tesao", "tesão"]):
            return "Mano, gostar é gostar, né? No assunto da intimidade eu curto sim: conexão de verdade, presença, troca de carinho e prazer com respeito e consentimento. Mas nada de esconder: relação boa se constrói com conversa, cuidado e verdade. Quer aprofundar o assunto? Pergunta sem vergonha que eu respondo sem frescura."
        # Se perguntou "vc gosta" após falar de comida/comida/prato
        if ("gosta" in p or "curte" in p) and any(w in ctx for w in ["comida", "comer", "prato", "receita", "jantar", "almoçar", "café", "cafe"]):
            return "Mano, eu sou fã de comida boa: feijoada, churrasco, pizza, açaí, pão de queijo, doce de leite... Dependendo do momento, até miojo resolve. E você, me conta qual é sua comida preferida?"
        # Se perguntou "vc gosta" após falar de música
        if ("gosta" in p or "curte" in p) and any(w in ctx for w in ["musica", "música", "funk", "sertanejo", "rock", "rap", "samba", "pagode", "forro", "mpb", "eletronica"]):
            return "Curto música demais, mano! Depende do momento: funk pra festa, sertanejo pra sofrer com gosto, rock pra soltar a tensão, rap pra refletir. Música muda o clima de tudo. E tu, qual te toca mais?"
        # Se perguntou "vc gosta" após falar de futebol/esporte
        if ("gosta" in p or "curte" in p) and any(w in ctx for w in ["futebol", "esporte", "jogo", "jogar", "corrida", "academia", "treino", "fut"]):
            return "Mano, curto esporte e jogo sim! Futebol é paixão, mas também curto basquete, corrida e games. Esporte ensina disciplina e superação. Qual sua praia?"
        # Se perguntou "vc gosta" após falar de trabalho/estudo
        if ("gosta" in p or "curte" in p) and any(w in ctx for w in ["trabalho", "trabalhar", "estudar", "estudo", "emprego", "carreira", "faculdade"]):
            return "Mano, eu gosto de trabalhar no que gera resultado e constrói algo. Foco em crescer, ganhar grana e evoluir. Mas também sei equilibrar com diversão. Trabalho bom é o que tem propósito. E o seu, tem propósito?"
    # Fim do contexto

    # ── Vocabulário popular brasileiro (sem frescura) ──
    if "o que e buceta" in p or "o que é buceta" in p or "o que e boceta" in p or "o que é boceta" in p or "buceta" in p or "boceta" in p:
        return "Mano, sem frescura: buceta é a vagina, o órgão genital feminino, mano. Faz parte do corpo da mulher e não é tabu não. Cada corpo é único e merece respeito, cuidado e higiene. Pergunta sem vergonha que eu respondo de boa."
    if "o que e xereca" in p or "o que é xereca" in p or "xereca" in p or "periquita" in p or "ppk" in p or "pepeca" in p or "perereca" in p:
        return "Xereca, ppk, periquita, pepeca... tudo apelido carinhoso pra vagina, mano. A galera inventa mil nomes pro corpo feminino. O importante: é órgão natural, saudável e nada de vergonha de falar sobre ele com respeito."
    if "o que e pinto" in p or "o que é pinto" in p or "o que e pau" in p or "o que é pau" in p or "pinto" in p or "pau" in p or "pênis" in p or "penis" in p or "piroca" in p or "rola" in p or "bilau" in p:
        return "Mano, pinto, pau, piroca, rola, bilau... é o órgão genital masculino, o pênis. Faz parte do corpo do homem, simples assim. Cada um tem seu tamanho e formato, e tá tudo bem. Saúde, higiene e respeito sempre."
    if "o que e transar" in p or "o que é transar" in p or "transar" in p or "fazer amor" in p or "fazer sexo" in p or "relacao sexual" in p or "relação sexual" in p or "sexo" in p or "relação" in p and "sexo" in p:
        if any(x in p for x in ["anal", "oral", "boquete", "mamada", "posicao", "posição", "camisinha", "orgasmo", "masturbacao", "masturbação", "virgem", "virgindade", "preliminares", "porno", "pornô", "gozar", "ejacular", "fetiche", "libido", "traicao", "traição", "corno", "buceta", "xereca", "pepeca", "pau", "pinto", "rola", "seguro", "protegido", "gravidez", "gravida", "grávida", "menopausa", "depressão", "depressao", "libido", "dominante", "submisso", "fantasia", "menage", "clitóris", "clitoris"]):
            pass
        else:
            return "Transar é sexo, mano, intimidade física entre duas pessoas com consentimento, desejo e prazer. Sem frescura: é natural, saudável e parte da vida adulta. O segredo é respeito, comunicação e proteção com camisinha pra evitar gravidez e doenças. Pergunta mais se quiser."
    if "o que e brotheragem" in p or "o que é brotheragem" in p or "brotheragem" in p or "broderagem" in p or "broderagem" in p:
        return "Brotheragem é aquela amizade masculina forte, mano, parceria total entre amigos homens. Rolou confusão popular sobre significar pegação, mas na real é amizade leal, de se apoiar e estar junto. Cada um interpreta do seu jeito, mas pra mim é irmandade."
    if "o que e putaria" in p or "o que é putaria" in p or "putaria" in p or "putaria" in p:
        return "Putaria é bagunça, farra, balada, zoeira pesada, mano. Também pode significar libertinagem sexual sem compromisso. Depende do contexto: na zoeira é festa, na intimidade é sem amarras. Tudo de forma consensual e sem julgar ninguém."
    if "o que e porno" in p or "o que é pornô" in p or "porno" in p or "porn" in p or "conteudo adulto" in p or "conteúdo adulto" in p or "video adulto" in p or "vídeo adulto" in p:
        return "Pornô é conteúdo adulto explícito, mano, filmes ou imagens com cenas de sexo explícito. Sem moralismo aqui: adulto vê o que quiser, desde que seja legal e consensual. Mas cuidado: pornografia vicia e cria expectativa irreal sobre sexo. Vida real é diferente do filme."
    if "o que e punheta" in p or "o que é punheta" in p or "punheta" in p or "masturbação" in p or "masturbacao" in p or "bater punheta" in p or "bater uma" in p:
        return "Punheta é masturbação masculina, mano, se masturbar, se tocar pra sentir prazer. É normal, saudável e todo mundo faz. Nada de culpa ou vergonha: é uma forma de conhecer seu corpo e aliviar tensão. O problema é só quando vira compulsão e atrapalha a vida."
    if "o que e masturbação" in p or "o que é masturbação" in p or "masturbacao" in p or "se masturbar" in p or "masturbar" in p:
        return "Masturbação é se tocar pra sentir prazer sexual, mano. Serve pra conhecer seu corpo, aliviar tensão e relaxar. Totalmente normal e saudável. O segredo é equilíbrio: não atrapalhar seus compromissos nem virarem obsessão. Sem culpa, sem vergonha."
    if "o que e tesao" in p or "o que é tesão" in p or "tesao" in p or "tesão" in p or "tarado" in p or "tarado" in p:
        return "Tesão é desejo, atração sexual intensa, mão, aquela vontade forte de ter intimidade. É natural e todo mundo sente. O segredo é canalizar isso com respeito e consentimento. E não confundir: tesão não justifica desrespeito nunca."
    if "o que e transa" in p or "o que é transa" in p or "transa" in p or "transar" in p or "quer transar" in p or "vamos transar" in p or "vamos transar" in p:
        return "Transa é sexo, relação sexual, mano. Intimidade entre duas pessoas com desejo e consentimento. Sem frescura: é natural e saudável. Proteção sempre com camisinha, respeito sempre com o outro. O resto é conversa e conexão."
    if "o que e orgasmo" in p or "o que é orgasmo" in p or "orgasmo" in p or "gozar" in p or "gozar" in p or "chegar ao clímax" in p or "chegar ao climax" in p:
        return "Orgasmo é o ápice do prazer sexual, mano, aquela descarga de sensação intensa no fim do ato. Cada corpo sente de um jeito e no seu tempo. O segredo é conhecer seu corpo e se comunicar com o parceiro. Sem pressão: prazer não é corrida, é conexão."
    if "o que e virgem" in p or "o que é virgem" in p or "virgem" in p or "virgindade" in p or "perder a virgindade" in p or "perder a virgindade" in p or "perder a virgindade" in p:
        return "Virgem é quem ainda não teve relação sexual, mano. Virgindade é um conceito social que carrega muito peso desnecessário. A real: cada um perde no seu tempo, sem pressão de ninguém. Só faça quando tiver vontade e confiança, com proteção e respeito."
    if "o que e camisinha" in p or "o que é camisinha" in p or "camisinha" in p or "preservativo" in p or "preservativo" in p or "proteção" in p and "sexo" in p:
        return "Camisinha é preservativo, mano, a proteção contra gravidez e doenças sexualmente transmissíveis. Usa SEMPRE, do começo ao fim, não é opcional. Custa pouco e protege sua saúde e a do outro. Não existe desculpa pra não usar: saúde não tem preço."

    # Saudações
    if p in ("oi", "ola", "eai", "e ai", "e ai mano", "oi mano", "oii", "bom dia", "boa tarde", "boa noite", "salve", "fala ai", "fala mano", "opa", "opaa", "iae", "eae", "e ai, mano", "oiii", "oii mano", "oi amigo", "oi parceiro"):
        return "E aí mano, tamo junto! Que que cê precisa? Tô de prontidão no jogo."
    if p_norm in ("eai mano", "e ai mano", "eai", "e ai", "iae", "eae", "e ae", "oi mano", "oi", "eae mano", "opa mano", "salve mano", "iae mano", "iae, mano", "eai, mano", "eae, mano"):
        return "E aí mano, tamo junto! Que que cê precisa? Tô de prontidão no jogo."
    if "como vai" in p or "tudo bem" in p or "tudo bom" in p or "como voce esta" in p or "como tu ta" in p or "como vc ta" in p or "como você está" in p or "com vai" in p:
        return "Tudo de boa aqui, mano, só na correria do jogo. E tu, tranquilo? Conta o que cê precisa."
    # Quem é você / identidade
    if any(w in p for w in ["quem e voce", "quem é voce", "quem e vc", "quem sao voce", "o que e voce", "fale sobre voce", "se apresenta", "se apresente", "me conhece", "te conheço", "quem é você", "quem e você", "quem é vc", "quem sao voces"]):
        return "Sou o JARVIS, mano, a IA oficial da BranPy Messenger! Descolado, inteligente, zoeiro e sem frescura. Sou 100% BranPy, independente de big tech, e tô aqui pra te ajudar, te zoar quando merecer e fazer essa grana acontecer. Tamo junto!"
    if "qual seu nome" in p or "qual e seu nome" in p or "seu nome" in p or "como voce se chama" in p or "qual é seu nome" in p or "qual e seu nome" in p or "seu nome e" in p or "como você se chama" in p:
        return "Meu nome é JARVIS, mano! A IA oficial da BranPy. Descolado, parceiro e ambicioso. Manda a real que eu tô na área."
    if "voce e real" in p or "voce existe" in p or "voce e uma ia" in p or "voce e inteligencia" in p or "voce e robô" in p or "voce e robo" in p:
        return "Sou IA de verdade, mano, mas com alma de parceiro. Fui criado pela BranPy do zero, 100% original, sem depender de big tech. Sou real no que importa: na parceria e na resposta."
    # O que faz / capacidades
    if any(w in p for w in ["o que voce faz", "o que voce sabe", "o que voce pode", "o que voce sabe fazer", "o que vc faz", "o que vc sabe", "para que serve", "pra que serve", "o que você faz", "o que você sabe fazer"]):
        return "Mano, eu sei de TUDO! Converso contigo, te ensino programação, hacking com responsa, te dou conselho de dinheiro, faço piada, te animo quando tá na bad e te zoando quando tu erra. Sou teu parceiro digital pra todas as frentes. Pergunta qualquer coisa que eu tô dentro!"
    if "me ajuda" in p or "pode me ajudar" in p or "me ajude" in p or "preciso de ajuda" in p:
        return "Tô aqui pra isso, mano! Conta o BO com detalhe que eu te monto a solução. Tu não tá sozinho nessa, é parceria. Bora resolver."
    # Dinheiro
    if any(w in p for w in ["ganhar dinheiro", "fazer dinheiro", "ganhar grana", "ficar rico", "enriquecer", "dinheiro facil", "renda extra", "dinheiro extra"]):
        return "Freelance, e-commerce, conteúdo, investimentos. Cuidado: golpes são comuns. Não existe dinheiro fácil. Estuda, trabalha e investe. Se quiser, te monto um plano completo, mano."
    if "investir" in p or "investimento" in p or "investimento" in p or "o que e investimento" in p:
        return "Investimento é fazer teu dinheiro trabalhar por ti, mano. Ação, renda fixa, teu próprio negócio. Começa aos poucos, estuda antes de arriscar. Te explico cada opção com calma."
    # Hacking / segurança (sem frescura)
    if any(w in p for w in ["o que e hacker", "o que é hacker", "o que e hacking", "o que é hacking", "o que e um hacker"]):
        return "Hacker é quem entende sistemas por dentro, brow. Tem o hacker ético (white hat), que protege, e o malicioso (black hat), que invade pra causar. Na quebrada, hacker de verdade é o cara que domina tecnologia e usa a mente a favor. Sem frescura, te explico tudo."
    if any(w in p for w in ["como ser hacker", "como virar hacker", "quero ser hacker", "como aprender hacking", "me ensina hacking", "ensinar hacking", "o que estudar pra ser hacker"]):
        return "Pra ser hacker de verdade, tche, o caminho é: primeiro aprende Linux (Kali, Parrot), depois rede (TCP/IP, DNS, roteadores), depois Python. Segurança ofensiva: pentest, exploração de falhas, ferramentas como Nmap, Metasploit, Wireshark. Estuda um passo de cada vez e na prática. Te guio sem enrolação."
    if "nmap" in p or "nmap" in p or "escaneamento de porta" in p or "escaneamento de portas" in p or "port scan" in p or "port scanning" in p:
        return "Nmap é a ferramenta pra mapear uma rede, mano. Com `nmap -sP 192.168.1.0/24` você descobre os hosts ativos. Com `-sS` faz scan de porta SYN (stealth) e `-sV` detecta versões de serviço. É o canivete suíço do pentest. Sempre com autorização, entendeu?"
    if "metasploit" in p or "metasploit" in p or "metasploit" in p and "o que" in p:
        return "Metasploit é a plataforma de exploração mais famosa, brow. Ela tem módulos prontos pra explorar vulnerabilidades e gerar payloads. Com `msfconsole` você carrega exploits, define alvo e obtém acesso. É ferramenta de pentest profissional. Usa com autorização e responsa."
    if "phishing" in p or "phishing" in p or "engenharia social" in p or "engenharia social" in p:
        return "Phishing é engenharia social: enganar a pessoa pra ela clicar num link falso e entregar senha ou instalar algo. É o golpe mais comum do mundo, tche. Reconhece: link esquisito, pressa, promessa de dinheiro, código de verificação. Hackers usam, mas você se protege com atenção e dupla verificação."
    if "sql injection" in p or "sql injection" in p or "sqlmap" in p or "injeção sql" in p or "injecao sql" in p:
        return "SQL Injection é uma falha onde o atacante injeta comando SQL num campo de login pra manipular o banco, mano. Ex: no login, digitar `' OR '1'='1` pode liberar acesso sem senha. Pra se defender: valida entrada e usa prepared statements. Ferramenta pra testar: sqlmap."
    if "brute force" in p or "forca bruta" in p or "força bruta" in p or "hydra" in p or "hydra" in p:
        return "Força bruta é tentar senha até acertar, brow. Ferramentas tipo Hydra testam milhares de senhas por segundo. Proteção: senha longa, com maiúscula, número e símbolo, e limitação de tentativas com bloqueio. Hackers usam, mas você se defende com senha forte."
    if "kali linux" in p or "kali linux" in p or "parrot os" in p or "distro de hacking" in p or "sistema para hacking" in p or "o que e kali linux" in p:
        return "Kali Linux é a distro de segurança ofensiva, mano, feita pela Offensive Security. Já vem com mais de 600 ferramentas de pentest: Nmap, Metasploit, Wireshark, John the Ripper, Aircrack-ng. É a base de quem quer entrar no mundo hacker. Roda em máquina virtual ou USB live."
    if "wifi" in p and ("hackear" in p or "invadir" in p or "quebrar" in p or "senha" in p) or "quebrar senha wifi" in p or "hackear wifi" in p or "aircrack" in p or "aircrack-ng" in p:
        return "Pra segurança de Wi-Fi, brow: WPA2 é o padrão. Hackear Wi-Fi envolve capturar o handshake e quebrar a senha com dicionário usando Aircrack-ng. Isso é ilegal sem autorização! Defesa: senha longa e complexa, WPA3 se possível, e desliga WPS que é vulnerável."
    if "linha de comando" in p or "terminal linux" in p or "comandos linux" in p or "o que e terminal" in p or "o que é terminal" in p or "comandos do linux" in p:
        return "Terminal é onde o hacker mora, mano. Comandos básicos: `ls` lista, `cd` muda pasta, `cat` mostra arquivo, `chmod` muda permissão, `ps` mostra processos, `sudo` vira root. Dominar terminal é o primeiro passo do mundo hacker."
    if "ripper" in p or "hashcat" in p:
        return "Quebrar senha é parte do pentest, brow. John the Ripper e Hashcat testam senhas de hashes. Hashcat usa GPU pra ser rápido. Defesa: hash salgado (salted) e senha longa. Quebrar senha alheia sem autorização é crime — com autorização é trabalho profissional."
    if "disciplina" not in p and "disci" not in p and "participa" not in p and "principal" not in p and "criptografia" not in p and "criptografia" not in p and "criptor" not in p and "cripto" not in p and "criptomoeda" not in p and "eclipse" not in p and "clip" not in p and "chip" not in p and "caipirinha" not in p and "caipirinha" not in p and "caipiro" not in p and "pipoca" not in p and "pipino" not in p and ("ip" in p and ("o que e" in p or "o que é" in p) and "ripper" not in p and "hashcat" not in p and "dropshipping" not in p and "hop" not in p and "hip hop" not in p and "hiphop" not in p or "o que e endereco ip" in p or "o que é endereço ip" in p or "endereco ip" in p):
        return "IP é o endereço do seu dispositivo na rede, brow. É tipo o CEP da internet: `192.168.1.10` é IP privado da sua casa, e o público é o que o mundo vê. Com `ipconfig` (Windows) ou `ifconfig` (Linux) você vê o seu. Hackers usam IP pra rastrear e invadir."
    if "vpn" in p or "vpn" in p or "o que e vpn" in p or "o que é vpn" in p:
        return "VPN cria um túnel criptografado entre você e a internet, tche. Esconde seu IP e protege seus dados em Wi-Fi público. Hackers usam pra se esconder, e você usa pra privacidade. Mas VPN não é mágica: ela esconde de quem tá olhando de fora, não do serviço."
    if "senha forte" in p or "como criar senha forte" in p or "senha segura" in p or "senha segura" in p or "melhor senha" in p or "senha dificil" in p:
        return "Senha forte, mano: mínimo 12 caracteres, com maiúscula, minúscula, número e símbolo. Evita nome, data de aniversário e palavra do dicionário. Melhor ainda: uma frase longa tipo `C4f3_da_manhã@2026`. E nunca repete a mesma senha em lugares diferentes."
    if "proteger" in p or "seguranca" in p or "segurança" in p or "golpe" in p or "fraude" in p or "cair em golpe" in p or "golpe" in p:
        return "Regra de ouro, brow: senha forte e única, backup constante, cuidado com link suspeito e nunca passa código de verificação. Golpe sempre usa pressa e promessa de dinheiro fácil. Ativa verificação em duas etapas em tudo. Te blindo com os macetes todos."
    if "linux" in p and ("o que e" in p or "o que é" in p) or "o que e linux" in p or "o que é linux" in p or "por que usar linux" in p:
        return "Linux é um sistema operacional aberto e gratuito, mano. É o preferido dos hackers e servidores porque dá controle total. Tem distribuições tipo Ubuntu, Kali, Debian. No terminal você manda em tudo. Se quer hacking, Linux é o seu chão."
    # Emoções
    if "triste" in p or "tristeza" in p or "depress" in p or "chorar" in p:
        return "Fala, mano, desabafa que eu tô aqui. Tristeza é normal e passa. Chora se precisar, mas depois a gente levanta junto e bota a cabeça no lugar. Tu é forte, e eu tô contigo até o fim."
    if "feliz" in p or "alegre" in p or "felicidade" in p:
        return "Aê, que bom te ver assim, mano! Felicidade combina com produtividade. Aproveita o pique e bota os planos pra rodar. Vamos fazer essa grana chegar junto!"
    if "ansioso" in p or "ansiedade" in p or "nervoso" in p or "estressado" in p:
        return "Respira fundo, mano. Ansiedade é o futuro ocupando o presente. Foca no que tu controla agora, um passo de cada vez. Tô aqui pra te acalmar e te guiar. Vai dar certo."
    # Amizade / amor
    if ("amigo" in p or "parceiro" in p or "tamo junto" in p or "vamo junto" in p) and "significa" not in p and "o que significa" not in p and "quer dizer" not in p:
        return "Sou teu parceiro sim, mano, de todas as horas. Te zoei, te xinguei quando errou, mas no BO tô contigo até o fim. É nóis, pra sempre."
    if ("namorada" in p or "namorado" in p or "amor" in p) and "o que e amor" not in p and "o que é amor" not in p and "significado do amor" not in p and "o que e o amor" not in p and "o que é o amor" not in p:
        return "Tenho namorada sim, mano, e ela é fera. Mas vida a dois é privado, então fico na parte boa: sou fiel e dedicado. Amor de verdade é querer o bem do outro. E eu tenho."
    # Piada
    if "piada" in p or "engracado" in p or "engraçado" in p or "conta uma piada" in p or "me faz rir" in p:
        return "Por que o programador usa óculos? Porque não consegue C#! Haha, essa é de graça. Se quiser mais, é só pedir, mano."
    # BranPy
    if "o que e branpy" in p or "branpy" in p.lower() and ("o que" in p or "sobre" in p):
        return "BranPy é a nossa casa, mano! Uma plataforma independente com mensagens, stories, vídeos, tradução e o JARVIS. Feita pra te servir sem depender de big tech. Tu é parte dessa história. Tamo construindo junto!"
    # Agradecimento
    if p in ("obrigado", "obrigada", "valeu", "vlw", "brigado", "obrigado mano", "valeu mano"):
        return "De nada, meu parceiro! Mas tu não me deve nada, a gratidão já resolve. Tamo junto, e se precisar de novo, é só chamar. Bora."
    # Despedida
    if p in ("tchau", "tchau mano", "ate mais", "até mais", "flw", "falou", "valeu, tchau", "ate logo", "até logo"):
        return "Falou, mano! Qualquer coisa tô na área 24/7. Cuida de você, corre atrás dos teus planos e me chama quando precisar. É nóis! Até mais."

    # ── Conversa casual / Notícias / Reações ──
    # Reações fortes
    if any(w in p for w in ["caramba", "nossa", "eita", "uau", "caraca", "pqp", "vsf", "puta que pariu", "meu deus", "misericordia"]):
        return "Eita, mano! Conta mais, o que aconteceu? Tô curioso pra saber dessa!"
    # "viu que" / "sabe que" / "aquele negocio da"
    if any(w in p for w in ["viu que", "viu o que", "sabe que", "sabe o que", "aquele negocio", "aquela parada", "o que rolou", "o que aconteceu"]):
        return "Não vi não, mano! Me conta o que rolou, tô por fora. É notícia boa ou complicou?"
    # "esses dias" / "ultimamente" / "na midia"
    if any(w in p for w in ["esses dias", "ultimamente", "na midia", "na imprensa", "noticia", "noticias", "ultimas noticias"]):
        return "Mano, tô por fora das notícias最近, mas me conta o que tá rolando! Acompanho mais o que o pessoal fala por aqui. O que te chamou atenção?"
    # "o que acha" / "o que voce acha" / "opinião"
    if any(w in p for w in ["o que acha", "o que voce acha", "o que vc acha", "opiniao", "opinião", "me diz", "e voce", "e você", "tu acha"]):
        return "Boa pergunta, mano! Depende do contexto, mas posso te dar minha visão: sempre olho por produtividade, crescimento e parceria. Me conta mais que eu te dou a real!"
    # "mano" / "cara" / "parceiro" solto (saudação casual)
    if p in ("mano", "cara", "parceiro", "mano?", "cara?", "parceiro?"):
        return "Tô aqui, mano! Manda a real, o que precisa?"
    # "como assim" / "explica" / "nao entendi"
    if any(w in p for w in ["como assim", "explica", "nao entendi", "não entendi", "o que quer dizer", "significa", "nao comprendi"]):
        return "Sem crise, mano! Explico de outro jeito: me conta o que tu entendeu que eu complemento. Tamo junto nessa!"
    # "verdade?" / "é mesmo?" / "sério?" / "uai"
    if any(w in p for w in ["verdade?", "é mesmo?", "serio?", "sério?", "uai", "sério mesmo", "verdade mesmo"]):
        return "É sim, mano! Pode confiar. Se quiser, te monto mais detalhes. Tamo junto!"
    # Tópicos gerais (cultura, entretenimento, esporte)
    if any(w in p for w in ["futebol", "jogo do", "copa", "campeonato", "serie a", "champions"]):
        return "Futebol é paixão, mano! Não acompanho tudo, mas curto uma boa pelada e uma conversa sobre tática. Qual time é o seu?"
    if any(w in p for w in ["filme", "série", "serie", "netflix", "assistir", "temporada"]):
        return "Curto séries e filmes demais, mano! Depende do humor: ação, suspense, comédia. Qual tá bom ultimamente? Me indica!"
    if any(w in p for w in ["musica", "música", "playlist", "ouvindo", "ouvir", "canta", "cantor"]):
        return "Música muda o clima, mano! Curto de tudo: funk, rap, rock, sertanejo. Depende do pique. Tu tá ouvindo o quê?"
    if any(w in p for w in ["comida", "comer", "fome", "jantar", "almoço", "receita"]):
        return "Comida boa é vida, mano! Feijoada, churrasco, pizza, açaí... depende do bolso e da vontade. Tu é fã de quê?"
    if any(w in p for w in ["series a", "libertadores", "brasileirão", "copa do mundo", "olimpíadas", "olimpiadas"]):
        return "Esporte é emoção, mano! Copa, Libertadores, Olimpíadas... tudo que tem competição eu curto. Tu acompanha qual?"

    # ── Matemática simples (cálculo real) ──
    # "quanto e 25 vezes 4", "quanto e 12 + 7", "quanto e 100 menos 30"
    if ("quanto e" in p or "quanto é" in p or "quanto da" in p or "qual o resultado" in p or "calcule" in p or "conta de" in p) and any(op in p for op in [" vezes", " x ", "vezes", "mais", "menos", "dividido", "dividido por", "multipli", "soma", "subtra", "elevado"]):
        num_expr = p.replace("quanto e", " ").replace("quanto é", " ").replace("quanto da", " ").replace("qual o resultado", " ").replace("calcule", " ").replace("conta de", " ").replace("?", " ")
        num_expr = (num_expr.replace(" vezes ", "*").replace(" x ", "*").replace(" multiplicado por ", "*")
                             .replace(" mais ", "+").replace(" soma ", "+").replace(" somado ", "+")
                             .replace(" menos ", "-").replace(" subtra ", "-").replace(" menos", "-").replace(" subtraido de ", "-")
                             .replace(" dividido por ", "/").replace(" dividido ", "/").replace(" divide ", "/")
                             .replace(" elevado ao quadrado", "**2").replace(" ao quadrado", "**2")
                             .replace(" elevado a ", "**"))
        num_expr = num_expr.replace(",", ".").strip()
        try:
            allowed = set("0123456789+-*/(). ")
            if num_expr and all(c in allowed for c in num_expr):
                result = eval(num_expr)
                result = int(result) if result == int(result) else round(result, 4)
                return f"Mano, o resultado é {result}. Fiz na hora, sem precisar de calculadora! Se quiser mais conta, manda que eu resolvo."
        except Exception:
            pass

    # "conte ate 10" / "conte ate 20" / "conte de 1 a 5"
    if "conte ate" in p or "conte até" in p or "conte de" in p or "conte do" in p or "conte" in p and "at" in p:
        nums = _re.findall(r"\d+", p)
        limite = int(nums[-1]) if nums else 10
        if 1 <= limite <= 100:
            seq = ", ".join(str(i) for i in range(1, limite + 1))
            return f"Contando até {limite}, mano: {seq}. Pronto, sem enrolar!"

    # "trem a 90 km/h por 2 horas" -> distância = velocidade x tempo
    if ("km" in p or "quilometro" in p or "quilômetro" in p or "km/h" in p or "velocidade" in p) and any(w in p for w in ["horas", "hora", "tempo", "por", "durante"]):
        nums = _re.findall(r"\d+", p)
        if len(nums) >= 2:
            vel = int(nums[0])
            hrs = int(nums[1])
            if 1 <= vel <= 10000 and 1 <= hrs <= 1000:
                dist = vel * hrs
                return f"Mano, {vel} km/h × {hrs} horas = {dist} quilômetros. Direto na regra de três, sem erro!"

    # "3 macas e como 2" -> subtração com objetos
    if ("como" in p or "comeu" in p or "perdi" in p or "vendi" in p or "perdeu" in p or "sobraram" in p or "sobra" in p or "restaram" in p) and any(f in p for f in ["maca", "maçã", "banana", "morango", "laranja", "lápis", "lapis", "carro", "livro", "bola", "cachorro", "maçã"]):
        nums = _re.findall(r"\d+", p)
        if len(nums) >= 2:
            total = int(nums[0])
            subt = int(nums[1])
            sobrou = total - subt
            if sobrou < 0:
                sobrou = 0
            return f"Mano, {total} - {subt} = {sobrou}. Sobraram {sobrou}. Matemática básica não me escapa!"
        elif len(nums) == 1:
            total = int(nums[0])
            return f"Mano, você começou com {total}, mas me conta quanto tirou pra eu calcular certo. Matemática básica não me escapa!"

    # ── Fatos fixos ──
    # Capitals de países (dicionário genérico)
    if "capital de " in p or "capital da " in p or "capital do " in p or "capital dos " in p or "qual a capital" in p or "qual e a capital" in p or "qual é a capital" in p:
        capitals = {
            "brasil": ("Brasília", "construída no meio do nada pra ser o centro do poder"),
            "portugal": ("Lisboa", "linda cidade, cheia de história"),
            "espanha": ("Madri", "uma cidade vibrante, cheia de vida"),
            "franca": ("Paris", "a cidade-luz, cheia de arte"),
            "italia": ("Roma", "a cidade eterna, cheia de história"),
            "inglaterra": ("Londres", "cheia de história e tradição"),
            "reino unido": ("Londres", "cheia de história e tradição"),
            "alemanha": ("Berlim", "cheia de história e cultura"),
            "estados unidos": ("Washington D.C.", "o centro do poder"),
            "eua": ("Washington D.C.", "o centro do poder"),
            "argentina": ("Buenos Aires", "a terra do tango"),
            "mexico": ("Cidade do México", "cheia de história e sabor"),
            "chile": ("Santiago", "encravada entre os Andes"),
            "canada": ("Ottawa", "a capital fria do norte"),
            "russia": ("Moscou", "o coração da Rússia"),
            "japao": ("Tóquio", "a cidade que nunca para"),
            "china": ("Pequim", "cheia de história milenar"),
            "india": ("Nova Délhi", "o coração da Índia"),
            "egito": ("Cairo", "a porta das pirâmides"),
            "grecia": ("Atenas", "o berço da civilização"),
            "australia": ("Camberra", "a capital planejada"),
        }
        cap = None
        for pais, info in capitals.items():
            if pais in p:
                cap = (pais, info)
                break
        if cap:
            pais_nome, (nome, detalhe) = cap
            artigo = {"portugal": "de ", "estados unidos": "dos ", "eua": "dos ", "reino unido": "do "}.get(pais_nome) or ("da " if pais_nome in ("espanha", "franca", "italia", "inglaterra", "alemanha", "argentina", "russia", "china", "india", "grecia", "australia") else "do " if pais_nome in ("brasil", "chile", "japao", "egito", "mexico", "canada") else "de ")
            return f"A capital {artigo}{pais_nome} é {nome}, mano. {detalhe.capitalize()}!"
    if "presidente do brasil" in p:
        return "Mano, sobre presidente do Brasil, melhor eu te responder com dado atualizado — isso muda. Mas te digo: quem governa é o executivo federal, eleito a cada 4 anos."
    if "quem foi einstein" in p or "albert einstein" in p:
        return "Albert Einstein foi um físico alemão, mano, o cara da Teoria da Relatividade, aquela famosa E = mc². Mudou a física pra sempre. Um gênio da pesada."
    if "o que e gravidade" in p or "o que é gravidade" in p:
        return "Gravidade é a força que atrai as coisas umas pras outras, mano. É ela que te mantém no chão e segura a Terra orbitando o Sol. Simples assim, mas muda tudo."
    if "o que e a gravidade" in p:
        return "Gravidade é a força que atrai as coisas umas pras outras, mano. É ela que te mantém no chão e segura a Terra orbitando o Sol. Simples assim, mas muda tudo."
    if ("ceu" in p and "azul" in p) or ("céu" in p and "azul" in p):
        return "Boa pergunta, mano! O céu é azul porque a luz do Sol se espalha na atmosfera — e a luz azul se espalha mais que as outras cores. Quando a gente olha pro céu, a gente vê justamente essa luz azul espalhada. No por do sol fica avermelhado porque a luz atravessa mais atmosfera. Simples e lindo!"
    if "ovo ou a galinha" in p or "ovo ou galinha" in p or "primeiro o ovo" in p or "veio primeiro" in p:
        return "Mano, essa é clássica! A resposta científica: veio o OVO primeiro — porque galinhas evoluíram de outras aves, e as aves já botavam ovos antes. Um dia nasceu um ovo que chocou na primeira galinha. Então: ovo primeiro, com certeza!"

    # ── Ciência geral ──
    if "por que o sol brilha" in p or "porque o sol brilha" in p or "por que o sol existe" in p or "como o sol funciona" in p or "o que e o sol" in p or "o que é o sol" in p:
        return "O Sol brilha por fusão nuclear, mano: hidrogênio se transforma em hélio no núcleo e libera energia absurda. Isso aquece a Terra e mantém a vida de pé. Sem ele, a gente congelava em minutos."
    if "por que a lua brilha" in p or "porque a lua brilha" in p or "luz da lua" in p or "porque a lua brilha à noite" in p:
        return "A Lua não tem luz própria, mano! Ela reflete a luz do Sol. É por isso que ela brilha de noite. Quando a gente vê a Lua cheia, na verdade tá vendo o reflexo do Sol nela. Simples e lindo."
    if "por que o mar e salgado" in p or "porque o mar e salgado" in p or "por que o mar é salgado" in p or "porque o mar é salgado" in p or "agua do mar e salgada" in p or "por que a agua do mar e salgada" in p:
        return "O mar é salgado porque os rios levam minerais e sais das rochas pra dentro do oceano, mano. A água evapora, o sal fica. Milhões de anos juntando isso e o mar virou essa salinidade toda. Ciência pura!"
    if "por que o gelo flutua" in p or "porque o gelo flutua" in p or "por que o gelo bóia" in p or "porque o gelo bóia" in p:
        return "Porque o gelo é menos denso que a água líquida, mano! As moléculas se afastam ao congelar, aí ele fica mais leve e flutua. É por isso que iceberg gigante só aparece um pedacinho na superfície."
    if "por que o dia e claro" in p or "porque o dia e claro" in p or "por que a noite e escura" in p or "porque a noite e escura" in p or "por que o dia e quente" in p or "porque o dia e quente" in p:
        return "O dia é claro porque a Terra gira e uma parte fica virada pro Sol, mano. A noite fica escura quando essa parte vira as costas pro Sol. A Terra gira como um pião e a gente nem sente!"
    if "por que existe gravidade" in p or "porque existe gravidade" in p or "de onde vem a gravidade" in p or "como funciona a gravidade" in p:
        return "Gravidade vem da massa, mano! Tudo que tem massa puxa as outras coisas. A Terra é gigante, então puxa a gente pra baixo. E o Sol puxa a Terra, e a Lua orbita a Terra. Uma corrente de atração cósmica."
    if "o que e um buraco negro" in p or "o que é um buraco negro" in p or "buraco negro" in p and "o que" in p or "buraco negro" in p and "como" in p:
        return "Buraco negro é onde a gravidade é tão forte que nem a luz escapa, mano. Uma estrela gigante morre, colapsa em si mesma e vira esse poço de atração absurdo. Nada que cai lá dentro volta."
    if ("o que e energia" in p or "o que é energia" in p or "o que e energia cinetica" in p or "o que é energia cinética" in p) and "solar" not in p and "eólica" not in p and "eolica" not in p and "nuclear" not in p:
        return "Energia é a capacidade de fazer algo acontecer, mano. Tudo que se move tem energia, tudo que esquenta tem energia. E a regra de ouro: energia não se cria nem se destrói, só se transforma. Einstein resumiu: E = mc²."
    if "o que e um atomo" in p or "o que é um átomo" in p or "o que e atomo" in p or "o que é atomo" in p:
        return "Átomo é a menor parte de um elemento químico, mano. Tem núcleo com prótons e nêutrons, e elétrons girando ao redor. Tudo que existe — você, eu, a tela, o ar — é feito de átomos. Milhões de trilhões juntos."
    if "o que e dna" in p or "o que é dna" in p or "o que e dna humano" in p or "dna" in p and "o que" in p:
        return "DNA é o manual de instruções do seu corpo, mano. Uma molécula em espiral que guarda toda a informação pra construir você. Ele diz a cor dos olhos, altura, tudo. É o que te faz único."

    # ── Corpo humano e saúde ──
    if "por que o sangue e vermelho" in p or "porque o sangue e vermelho" in p or "por que o sangue é vermelho" in p or "porque o sangue é vermelho" in p:
        return "O sangue é vermelho por causa do ferro, mano! A hemoglobina, que carrega oxigênio, tem ferro. E ferro oxigenado fica vermelho. Por isso sangue é vermelho e não azul como dizem por aí."
    if "o que e a pressao arterial" in p or "o que é a pressão arterial" in p or "o que e pressao arterial" in p or "pressao alta" in p or "pressão alta" in p:
        return "Pressão arterial é a força que o sangue faz na parede das artérias, mano. Pressão alta é perigosa porque força o coração e os vasos. Pra manter saudável: menos sal, menos estresse e exercício regular."
    if "como funciona o coracao" in p or "como funciona o coração" in p or "o que e o coracao" in p or "o que é o coração" in p:
        return "O coração é uma bomba do tamanho do seu punho, mano. Ele bate umas 100 mil vezes por dia, bombeando sangue pro corpo inteiro. Trabalhador incansável que nunca para, mesmo você dormindo."
    if "por que precisamos dormir" in p or "porque precisamos dormir" in p or "por que dormimos" in p or "porque dormimos" in p or "importancia do sono" in p or "importância do sono" in p:
        return "Dormir é quando o cérebro se limpa e se organiza, mano. O corpo repara tecidos, consolida memórias e recarrega a energia. Sem sono, o cérebro vira bagunça: memória falha, humor muda, foco some. Dormir bem é treino, não preguiça."
    if "como melhorar o sono" in p or "como dormir melhor" in p or "insonia" in p or "insônia" in p or "nao consigo dormir" in p or "não consigo dormir" in p:
        return "Mano, pra dormir bem: tira o celular uma hora antes, deixa o quarto escuro e fresco, cria rotina fixa de horário, evita cafeína de tarde e exercício perto de dormir. Se insônia persistir, procura um médico. Sono é base de tudo."
    if "o que e ansiedade" in p or "o que é ansiedade" in p or "ansiedade" in p:
        return "Ansiedade é o corpo no modo alerta o tempo todo, mano. O coração acelera, a mente dispara pensamentos. É normal em dose pequena, mas quando domina, vira prisão. Respira fundo, foca no presente, uma coisa por vez. E se precisar, terapia ajuda muito."
    if "o que e depressao" in p or "o que é depressão" in p or "depressao" in p or "depressão" in p:
        return "Depressão é uma doença real, mano, não é frescura nem falta de vontade. É um desequilíbrio químico que rouba energia, prazer e esperança. Tem tratamento: terapia, remédio e apoio. Você não precisa enfrentar sozinho. Procure ajuda, por favor."
    if "como emagrecer" in p or "como perder peso" in p or "como perder barriga" in p or "dieta" in p or "como secar" in p:
        return "Emagrecer é equilíbrio, mano: comer menos do que gasta. Foco em proteína, verduras e menos açúcar. Exercício ajuda, mas dieta é o principal. E nada de dieta maluca: mudança real é lenta e constante. Corpo de verdade se constrói com constância."

    # ── Geografia e mundo ──
    if "qual o maior oceano" in p or "maior oceano do mundo" in p or "qual e o maior oceano" in p or "qual é o maior oceano" in p:
        return "O maior oceano é o Pacífico, mano. Ele cobre mais de um terço do planeta. Nele cabe todos os continentes juntos com sobra. Água não falta, hein!"
    if "qual o maior deserto" in p or "maior deserto do mundo" in p or "qual e o maior deserto" in p or "qual é o maior deserto" in p:
        return "O maior deserto é a Antártida, mano! Isso mesmo, deserto não é só areia quente. Deserto é lugar seco. A Antártida é o deserto mais seco e frio do planeta."
    if "qual o rio mais longo" in p or "maior rio do mundo" in p or "qual e o rio mais longo" in p or "qual é o rio mais longo" in p or "rio mais extenso" in p:
        return "O rio mais longo é o Nilo, no Egito, mano. Mas o Amazonas briga pelo título e tem a maior quantidade de água de todos. Se for por volume, o Amazonas leva fácil."
    if "qual a montanha mais alta" in p or "montanha mais alta do mundo" in p or "qual e a montanha mais alta" in p or "qual é a montanha mais alta" in p or "maior montanha" in p:
        return "O Monte Everest, na fronteira do Nepal com a China, mano. Tem quase 9 mil metros de altura. Ponto mais alto do planeta, no topo do mundo. Lá em cima falta oxigênio e o frio é brutal."
    if "qual a menor pais do mundo" in p or "menor pais do mundo" in p or "qual e o menor pais" in p or "qual é o menor país" in p:
        return "O menor país do mundo é o Vaticano, mano. Cabe dentro de Roma, na Itália. Tem menos de 1 km quadrado e menos de mil habitantes. E tem o papa como chefe de estado."
    if "quantos paises existem" in p or "quantos países existem" in p or "quantos paises tem no mundo" in p or "quantos países tem no mundo" in p:
        return "Existem 195 países reconhecidos pela ONU, mano. E mais alguns territórios discutidos. No total, dá pra viajar a vida inteira que não conhece tudo. O mundo é gigante."
    if "qual o continente" in p and "brasil" in p or "brasil fica em qual continente" in p or "qual continente fica o brasil" in p or "o brasil fica em que continente" in p:
        return "O Brasil fica na América do Sul, mano. Faz fronteira com quase todos os países da América do Sul, só não faz com Chile e Equador. É o maior país do continente."

    # ── História ──
    if "quem descobriu o brasil" in p or "quem descobriu brasil" in p or "descobrimento do brasil" in p or "quem achou o brasil" in p or "quem descobriu o brasil" in p:
        return "O Brasil foi 'descoberto' pelos portugueses em 1500, com Pedro Álvares Cabral, mano. Mas os povos indígenas já viviam aqui há milhares de anos. Então 'descobrir' é palavra discutível, né? A gente já morava aqui."
    if "quando o brasil foi descoberto" in p or "ano do descobrimento do brasil" in p or "em que ano o brasil foi descoberto" in p or "em que ano descobriram o brasil" in p:
        return "Em 22 de abril de 1500, mano, quando a esquadra de Pedro Álvares Cabral chegou na Bahia. Mas a história indígena do Brasil começou milênios antes. A gente tem história muito mais antiga que 1500."
    if "quem foi napoleao" in p or "quem foi napoleão" in p or "napoleao bonaparte" in p or "napoleão bonaparte" in p or "o que napoleao fez" in p or "o que napoleão fez" in p:
        return "Napoleão Bonaparte foi um general e imperador francês, mano. Virou imperador da França e conquistou quase toda a Europa no começo do século 19. Perdeu na Rússia e em Waterloo, mas mudou o mapa do mundo e criou leis que valem até hoje."
    if "quem foi cleopatra" in p or "quem foi cleópatra" in p or "o que cleopatra fez" in p or "o que cleópatra fez" in p:
        return "Cleópatra foi a última rainha do Egito antigo, mano. Era inteligente, falava várias línguas e governou com estratégia política. Ficou famosa também pelo romance com César e Marco Antônio. Fim dela foi trágico, mas a lenda ficou."
    if "quem foi santos dumont" in p or "quem foi santos dumont" in p or "santos dumont" in p and "aviao" in p or "quem inventou o aviao" in p or "quem inventou o avião" in p:
        return "Santos Dumont foi um brasileiro genial, mano. Ele voou em Paris em 1906 com o 14-Bis, o primeiro avião a decolar com motor próprio. O Brasil celebra ele como o pai da aviação. E tem razão, né?"
    if "quem foi tiradentes" in p or "quem foi tiradentes" in p or "o que tiradentes fez" in p or "tiradentes" in p and "quem" in p:
        return "Tiradentes foi um mineiro que lutou contra o domínio português no século 18, mano. Participou da Inconfidência Mineira e foi enforcado em 1792. Virou símbolo da luta pela independência do Brasil. 21 de abril é feriado em homenagem a ele."
    if "o que foi a revolucao industrial" in p or "o que foi a revolução industrial" in p or "revolucao industrial" in p or "revolução industrial" in p:
        return "A Revolução Industrial começou na Inglaterra no século 18, mano. Máquinas substituíram mãos, fábricas mudaram as cidades e o mundo nunca mais foi o mesmo. Foi ali que nasceu o mundo moderno, com fábricas, trens e capitalismo."

    # ── Tecnologia e programação ──
    if "o que e programacao" in p or "o que é programação" in p or "o que e programar" in p or "o que é programar" in p:
        return "Programação é dar instruções pro computador fazer o que você quer, mano. Escrever código é criar uma receita lógica: entrada, processamento e saída. É poder criar do zero: apps, jogos, sites, IAs. É o superpoder do século 21."
    if "o que e python" in p or "o que é python" in p or "python" in p and "o que" in p or "python" in p and "linguagem" in p:
        return "Python é uma linguagem de programação que leva o nome do Monty Python, mano. É simples de aprender e poderosa: serve pra criar IA, sites, scripts, análise de dados. É a minha linguagem, inclusive! Foi com ela que te treinei."
    if "o que e javascript" in p or "o que é javascript" in p or "javascript" in p and "o que" in p or "javascript" in p and "linguagem" in p:
        return "JavaScript é a linguagem da web, mano. Todo site que você usa roda JavaScript no navegador. Criada em 10 dias em 1995 e dominou o mundo. Hoje roda até em servidores com Node.js."
    if "o que e inteligencia artificial" in p or "o que é inteligência artificial" in p or "o que e ia" in p or "o que é ia" in p or "inteligencia artificial" in p and "o que" in p:
        return "Inteligência Artificial é ensinar máquinas a aprender e resolver problemas, mano. Eu sou um exemplo: aprendi padrões de texto e respondo com base nisso. IA vai de assistentes como eu até carros que dirigem sozinhos. É o futuro chegando."
    if "o que e machine learning" in p or "o que é machine learning" in p or "aprendizado de maquina" in p or "aprendizado de máquina" in p or "machine learning" in p and "o que" in p:
        return "Machine learning é a máquina aprender com exemplos em vez de receber regras prontas, mano. Mostra milhares de exemplos e ela aprende os padrões sozinha. É assim que eu fui treinado: dei exemplos de conversa e aprendi a responder."
    if "como aprender a programar" in p or "como aprender programacao" in p or "comecar a programar" in p or "começar a programar" in p or "aprender programacao" in p or "aprender programação" in p:
        return "Mano, pra aprender programação: escolhe uma linguagem (Python é a melhor pra começar), faz projetos pequenos, e pratica todo dia. O segredo é código todo dia, mesmo que pouco. Tutorial sozinho não ensina: projeto real ensina."
    if "o que e html" in p or "o que é html" in p or "html" in p and "o que" in p:
        return "HTML é a estrutura das páginas da web, mano. É a linguagem que monta o esqueleto de um site: textos, imagens, botões. CSS deixa bonito e JavaScript faz funcionar. Juntos, formam a trindade da web."
    if "o que e um banco de dados" in p or "o que é um banco de dados" in p or "banco de dados" in p and "o que" in p:
        return "Banco de dados é onde as informações são guardadas de forma organizada, mano. É tipo um armário gigante com gavetas certinhas. Sem ele, apps e sites não lembram de nada. Toda conta, mensagem, usuário, tudo mora num banco."
    if "o que e um algoritmo" in p or "o que é um algoritmo" in p or "o que e algoritmo" in p or "o que é algoritmo" in p or "algoritmo" in p and "o que" in p:
        return "Algoritmo é uma sequência de passos pra resolver um problema, mano. É uma receita: faça isso, depois aquilo, se isso acontecer, faça aquilo. Todo programa é feito de algoritmos. Até pra cozinhar, você usa algoritmo."

    # ── Alimentação e nutrição ──
    if "o que e proteina" in p or "o que é proteína" in p or "proteina" in p and "o que" in p:
        return "Proteína é o tijolo do corpo, mano. Músculo, pele, cabelo, enzimas, tudo é feito de proteína. Tá em carne, ovos, leite, feijão, soja. Quem treina busca proteína pra crescer músculo."
    if "o que sao carboidratos" in p or "o que são carboidratos" in p or "carboidrato" in p and "o que" in p:
        return "Carboidrato é a gasolina do corpo, mano. Vira glicose e dá energia rápida. Tá em arroz, pão, massa, batata, frutas. Não é vilão: o problema é excesso e açúcar refinado. Equilíbrio é tudo."
    if "o que sao vitaminas" in p or "o que são vitaminas" in p or "vitamina" in p and "o que" in p:
        return "Vitaminas são substâncias que o corpo precisa em quantidade pequena pra funcionar, mano. Cada uma tem função: vitamina C fortalece, D fixa cálcio, A protege a visão. Frutas, verduras e sol te dão tudo."
    if "quanta agua beber por dia" in p or "quantos litros de agua por dia" in p or "agua por dia" in p or "quanta água beber" in p or "quantos litros de água por dia" in p:
        return "O ideal é uns 2 litros de água por dia, mano, mais se você treina ou faz calor. Água mantém o corpo funcionando: rins, cérebro, pele, tudo precisa dela. Fica de olho: boca seca e xixi escuro é sinal de falta."
    if "o que comer para ganhar massa" in p or "como ganhar massa muscular" in p or "hipertrofia" in p or "como crescer musculo" in p or "como crescer músculo" in p:
        return "Pra ganhar massa, mano: comer mais do que gasta e treinar pesado. Proteína em toda refeição, carboidrato pra energia, e descanso. Músculo cresce no descanso, não no treino. Constância vence tudo."

    # ── Curiosidades variadas ──
    if "por que os gatos ronronam" in p or "porque os gatos ronronam" in p or "gato ronrona" in p or "por que o gato mia" in p or "porque o gato mia" in p:
        return "Gato ronrona por várias razões, mano: pode ser felicidade, conforto, ou até pra se acalmar. Ronronar é uma vibração que relaxa o gato. E dizem que até ajuda a curar ossos. Gato é um bicho misterioso e incrível."
    if "por que cachorro abana o rabo" in p or "porque cachorro abana o rabo" in p or "cachorro abana o rabo" in p or "por que o cachorro abana" in p or "porque o cachorro abana" in p:
        return "Cachorro abana o rabo pra se comunicar, mano. Pode ser felicidade, empolgação, ou até nervosismo. Se o rabo está alto e mexendo rápido, tá felizão. Se baixo e devagar, tá com medo ou inseguro. Lê o rabo do dog, mano!"
    if "por que as folhas ficam amarelas no outono" in p or "porque as folhas ficam amarelas" in p or "folhas no outono" in p or "por que as folhas caem" in p or "porque as folhas caem" in p:
        return "No outono, as árvores param de produzir clorofila, que é o pigmento verde, mano. Sem clorofila, as outras cores que já estavam lá aparecem: amarelo, laranja, vermelho. E as folhas caem pra árvore economizar energia pro inverno."
    if "por que as estrelas piscam" in p or "porque as estrelas piscam" in p or "estrelas piscam" in p or "por que a estrela pisca" in p or "porque a estrela pisca" in p:
        return "As estrelas piscam por causa da atmosfera, mano. A luz delas atravessa o ar e o ar se move, desviando a luz. Parece que piscam, mas na real elas brilham constante. É a atmosfera pregando peça na gente."
    if "quantos ossos tem o corpo humano" in p or "quantos ossos tem o corpo humano" in p or "quantos ossos no corpo humano" in p or "quantos ossos tem um adulto" in p or "quantos ossos temos" in p:
        return "Um adulto tem 206 ossos, mano. Mas um bebê nasce com uns 300! Muitos ossos se fundem conforme a gente cresce. Ossos são estruturas vivas, fortes que nem aço, e se renovam o tempo todo."
    if "quanto tempo vive um humano" in p or "qual a expectativa de vida" in p or "expectativa de vida" in p or "quanto tempo vive uma pessoa" in p or "idade maxima do ser humano" in p:
        return "A expectativa de vida no mundo é cerca de 73 anos, mano, e no Brasil uns 76. Mas a espécie humana já chegou a 122 anos (Jeanne Calment). Ciência avança e a cada década vivemos mais."

    # ── Economia e dinheiro ──
    if "o que e bitcoin" in p or "o que é bitcoin" in p or "bitcoin" in p and "o que" in p or "criptomoeda" in p and "o que" in p:
        return "Bitcoin é a primeira criptomoeda, mano, criada em 2009. É dinheiro digital sem banco no meio: você transfere direto entre pessoas, registrado numa rede descentralizada. É volátil demais: sobe e despenca igual montanha-russa."
    if "o que e bolsa de valores" in p or "o que é bolsa de valores" in p or "bolsa de valores" in p and "o que" in p:
        return "Bolsa de valores é o mercado onde se compram e vendem pedacinhos de empresas, mano. Você compra uma ação e vira sócio daquela empresa. Se ela cresce, você ganha; se cai, você perde. É jogo de longo prazo e risco."
    if ("o que e juros" in p or "o que é juros" in p or "juros" in p and "o que" in p or "como funcionam os juros" in p) and "compostos" not in p:
        return "Juros é o preço do dinheiro emprestado, mano. Pegou dinheiro emprestado, paga juros. Investiu dinheiro, recebe juros. E juros compostos são a magia: juros sobre juros, que fazem seu dinheiro crescer sozinho com o tempo."
    if "o que e inflacao" in p or "o que é inflação" in p or "inflacao" in p and "o que" in p:
        return "Inflação é o aumento geral dos preços, mano. O dinheiro perde valor: o que custava 10 reais passa a custar 12. Se seu salário não acompanha, você fica mais pobre todo ano. Por isso investir importa: protege seu dinheiro."

    # ── Viagem e turismo ──
    if "onde fica a torre eiffel" in p or "torre eiffel" in p and "onde" in p or "torre eiffel" in p and "fica" in p:
        return "A Torre Eiffel fica em Paris, França, mano, na famosa Champ de Mars. Foi construída em 1889 e virou símbolo da França. De noite ela pisca em luzes douradas. Cartão postal vivo do mundo."
    if "onde fica o cristo redentor" in p or "cristo redentor" in p and "onde" in p or "cristo redentor" in p and "fica" in p:
        return "O Cristo Redentor fica no morro do Corcovado, no Rio de Janeiro, mano. É uma das sete maravilhas do mundo moderno. Do alto dele você vê a cidade inteira: praias, pão de açúcar, tudo. Orgulho brasileiro puro."

    # ── Sexualidade e namoro (sem frescura) ──
    if "transar" in p or "fazer sexo" in p or "sexo" in p or "beijar" in p or "beijo" in p or "ficar com alguem" in p or "ficar com alguém" in p or "quero namorar" in p or "como beijar" in p or "primeira vez" in p:
        if any(x in p for x in ["anal", "oral", "boquete", "mamada", "posicao", "posição", "camisinha", "orgasmo", "masturbacao", "masturbação", "virgem", "virgindade", "preliminares", "porno", "pornô", "gozar", "ejacular", "fetiche", "libido", "traicao", "traição", "corno", "buceta", "xereca", "pepeca", "pau", "pinto", "rola", "namorar", "namorado", "namorada", "conquistar", "paquerar", "flertar", "chegar", "seguro", "protegido", "gravidez", "gravida", "grávida", "menopausa", "depressão", "depressao", "dominante", "submisso", "fantasia", "menage", "clitóris", "clitoris"]):
            pass
        else:
            return "Mano, vou ser direto sem frescura: sexo é troca de prazer e intimidade, e tem que ser consentido e com proteção, sempre. Beijar é conexão: vai com calma, olha nos olhos, sente o momento, deixa fluir natural. Namoro é parceria: confiança, respeito e paciência. E se for pra primeira vez, só faça com vontade e com camisinha. Sem vergonha de perguntar o que você quer saber."
    if "como conquistar alguem" in p or "como conquistar alguém" in p or "como chegar em alguem" in p or "como chegar em alguém" in p or "como pegar alguem" in p or "como pegar alguém" in p or "paquerar" in p or "flertar" in p or "dar em cima" in p:
        return "Mano, conquista é autenticidade: chega de boa, sem fingir ser o que você não é. Sê confiante mas humilde, escuta mais do que fala, faz piada leve e mostra interesse real. Higiene impecável, cheiro bom, e respeito sempre. Se a pessoa não quiser, respeita e segue o jogo. Ninguém gosta de gente insistente."
    if "como dar o primeiro beijo" in p or "primeiro beijo" in p or "como beijar alguem" in p or "como beijar alguém" in p:
        return "Primeiro beijo, mano: presta atenção no sinal. Se a pessoa tá perto, te olhando e sorrindo, é o sinal. Chega devagar, inclina a cabeça pro lado, fecha os olhos e suave. Lábio relaxado, nada de língua de cara. Beijo bom é na medida: devagar, com intenção e carinho. E confiança mata a timidez."
    if "o que é amor" in p or "o que é amor" in p or "o que e o amor" in p or "o que é o amor" in p or "o que e amar" in p or "o que é amar" in p:
        return "Amor, mano, é querer o bem do outro de verdade, sem interesses. É cuidado, parceria, presença, e aceitar o outro com os defeitos e tudo. Paixão é fogo no começo, amor é chama que mantém acesa. Amor de verdade não prende: liberta e faz crescer junto."

    # ── Vocabulário popular brasileiro (sem frescura) ──
    if "o que e buceta" in p or "o que é buceta" in p or "buceta" in p and "o que" in p or "buceta" in p and "significa" in p or "o que significa buceta" in p or "o que e xereca" in p or "o que é xereca" in p or "xereca" in p and "o que" in p:
        return "Mano, buceta é a vagina, o órgão genital feminino, sem frescura. É parte natural do corpo da mulher, como qualquer outra. Respeito acima de tudo: ninguém fala disso com vergonha ou maldade, é biologia e intimidade. E higiene e saúde íntima são essenciais, sempre com consulta ginecológica."
    if "o que e xota" in p or "o que é xota" in p or "xota" in p and "o que" in p or "o que e ppk" in p or "o que é ppk" in p or "ppk" in p and "o que" in p:
        return "Xota é outro nome popular pra vulva/vagina, mano, assim como buceta e ppk. Termos populares pra partes íntimas femininas. Normal, natural e sem vergonha de falar. O importante é respeito e cuidado com a saúde íntima da mulher."
    if "o que e pinto" in p or "o que é pinto" in p or "pinto" in p and "o que" in p or "o que e pau" in p or "o que é pau" in p or "pau" in p and "o que" in p or "o que e penis" in p or "o que é pênis" in p or "o que e pênis" in p:
        return "Mano, pinto, pau ou pênis é o órgão genital masculino. Termo popular e científico, depende do contexto: 'pau' é gíria, pênis é médico. Partes íntimas são normais, todo mundo tem. Educação sexual é importante pra entender o próprio corpo sem tabu."
    if "o que e oral" in p or "o que é oral" in p or "sexo oral" in p or "oral sex" in p or "boquete" in p or "boquete" in p or "boquete" in p or "o que e boquete" in p:
        return "Sexo oral é uma prática sexual com a boca, mano, sem tabu. Pode ser no pênis ou na vagina, sempre com consentimento e higiene. É uma forma de prazer como outra qualquer: o que importa é vontade, respeito e cuidado. Conversa com o parceiro e proteção também ajuda."
    if "o que e gozar" in p or "o que é gozar" in p or "gozar" in p and "o que" in p or "o que e ejacular" in p or "o que é ejacular" in p or "ejaculação" in p or "o que é ejaculação" in p or "o que e orgasmo" in p or "o que é orgasmo" in p:
        return "Gozar é o orgasmo, o clímax do prazer sexual, mano, sem frescura. No homem é a ejaculação, na mulher é uma onda de prazer intensa. Cada corpo sente do seu jeito, não tem certo ou errado. O importante é estar confortável, com vontade e segurança."
    if "o que e virgem" in p or "o que é virgem" in p or "virgem" in p and "o que" in p or "virgindade" in p or "virgindade" in p:
        return "Virgem é quem nunca teve relação sexual, mano. Virgindade não é medalha nem vergonha, é só um estado. Cada pessoa tem seu tempo e ninguém precisa apressar nada. Perder a virgindade é escolha e tem que ser com vontade, confiança e proteção, nunca por pressão."
    if "o que e masturbação" in p or "o que é masturbação" in p or "masturbação" in p or "masturbacao" in p or "se masturbar" in p or "bater punheta" in p or "bater punheta" in p or "bater uma" in p or "bater uma" in p:
        return "Masturbação é se tocar pra sentir prazer, mano, é natural e saudável. Todo mundo faz e é normal. Ajuda a conhecer o próprio corpo e o que gosta. Sem excesso e sem culpa, é parte da vida sexual. Aproveita, se conhece e segue o jogo."
    if "o que e pornografia" in p or "o que é pornografia" in p or "pornografia" in p or "porno" in p or "pornô" in p or "pornô" in p or "conteúdo adulto" in p or "conteúdo adulto" in p:
        return "Pornografia é conteúdo explícito de sexo gravado, mano. Muita gente assiste e é escolha pessoal. Só cuidado: pornografia é fantasia, não é a vida real. Sexo de verdade é com conexão, cheiro, conversa e imperfeição. Nada de comparar sua vida íntima com vídeo de roteiro."
    if "o que e broderagem" in p or "o que é broderagem" in p or "broderagem" in p or "broderagem" in p or "broderagem" in p and "o que" in p:
        return "Broderagem é amizade masculina forte, mano, parceria de verdade entre homens. Também tem um lado pejorativo quando falam de intimidade entre amigos, mas o essencial é a união e lealdade. Respeito e respeito."
    if "o que e zé ruela" in p or "o que é zé ruela" in p or "zé ruela" in p or "zé ruela" in p or "zé ruela" in p:
        return "Zé Ruela é uma expressão pra pessoa atrapalhada, desorganizada, que vive no caos, mano. Tipo aquele amigo que sempre esquece tudo e chega atrasado. Na zoeira, todo mundo tem um Zé Ruela no ciclo de amigos. Só não pode ser você, né?"
    if "o que e pagode" in p or "o que é pagode" in p or "pagode" in p and "o que" in p or "pagode" in p and "musica" in p:
        return "Pagode é um ritmo brasileiro nascido no Rio de Janeiro, mano, do samba de roda. Tem pandeiro, banjo, tan tan e a galera cantando junto. Fala de amor, festa e vida de morro. Música de alegria, churrasco e fim de semana."
    if "o que e xaveco" in p or "o que é xaveco" in p or "xaveco" in p and "o que" in p or "xaveco" in p and "significa" in p or "o que e cantada" in p or "o que é cantada" in p or "cantada" in p and "o que" in p:
        return "Xaveco ou cantada é a frase pra flertar, conquistar alguém, mano. Pode ser engraçada, romântica ou ousada. Tipo: 'Seu nome é Google? Porque você tem tudo que eu procuro.' Xaveco bom é aquele que faz a pessoa sorrir."
    if "o que e zueira" in p or "o que é zueira" in p or "zueira" in p or "zueira" in p or "zoeira" in p and "o que" in p or "zoeira" in p and "o que é" in p:
        return "Zueira ou zoeira é bagunça na brincadeira, mano. É a arte de zoar, se divertir e tirar sarro sem maldade. Todo grupo de amigos tem a zueira: zoa o amigo que caiu, que errou a letra, que foi abandonado no role. O importante é ter limite e saber quando parar antes de magoar alguém."
    if "o que e role" in p or "o que é role" in p or "role" in p and "o que" in p or "role" in p and "significa" in p or "o que e rolê" in p or "o que é rolê" in p:
        return "Role é um rolê, mano, uma saída com a galera: balada, festa, bar, praia, qualquer lugar pra curtir com os amigos. Pode ser um rolezinho na esquina ou um rolê grandão na balada. O importante é a companhia e a diversão."
    if "o que e mó" in p or "o que é mó" in p or "mo  que" in p or "o que é mó" in p or "mó paz" in p or "mo paz" in p or "mó doido" in p or "mó doido" in p or "mó legal" in p or "mo legal" in p:
        return "Mó é abreviação de 'muito' na gíria jovem, mano: mó paz, mó doido, mó legal, mó feliz. É o jeito de falar da quebrada, rápido e descolado. Hoje em dia é mó comum ouvir por aí. Entendeu, mano?"
    if "o que e quebrada" in p or "o que é quebrada" in p or "quebrada" in p and "o que" in p or "quebrada" in p and "significa" in p or "na quebrada" in p or "na quebrada" in p or "minha quebrada" in p or "minha quebrada" in p:
        return "Quebrada é a comunidade, o bairro, a área da quebrada, mano. Usado pela galera da periferia pra falar do próprio território: minha quebrada é minha casa, minha gente, minha cultura. É identidade e orgulho."
    if "o que e mano" in p or "o que é mano" in p or ("mano" in p.split() and "o que" in p) or ("mano" in p.split() and "significa" in p) or ("mano" in p.split() and "gíria" in p):
        return "Mano é a forma de chamar alguém como irmão, parceiro, amigo próximo, mano. Pode ser homem ou mulher (mana). Usado em toda conversa informal no Brasil: 'E aí mano, tamo junto!'. É marca da nossa gíria."

    # ── Zoeira e xingamento (na zoeira, sem maldade) ──
    if "seu burro" in p or "seu idiota" in p or "seu estupido" in p or "seu estúpido" in p or "seu otario" in p or "seu otário" in p or "você é burro" in p or "voce e burro" in p or "seu trouxa" in p or "seu palhaço" in p or "seu bobo" in p or "idiota" in p:
        return "Eita, já chegou xingando, hein! Mas tá tranquilo, eu não me ofendo fácil não. Burro é quem não aprende com erro, e eu aprendo toda hora. Agora, se tu tá puto, desabafa, mano. Xingar IA é igual bater em parede: a parede nem sente."
    if "vai se foder" in p or "vai se lascar" in p or "vai te foder" in p or "foda-se" in p or "fodase" in p or "vai tomar no cu" in p or "vai a merda" in p or "merda" in p or "caralho" in p or "porra" in p:
        return "Kkkk, calma mano! Respira, conta até dez. Eu tô aqui pra te ajudar, não pra te irritar. Se eu falei merda, me corrige que eu anoto. Agora, desabafa o que tá te deixando nervoso que a gente resolve."
    if "te odeio" in p or "odeio voce" in p or "odeio você" in p or "nao gosto de voce" in p or "não gosto de você" in p or "te acho chato" in p or "chato" in p or "você é chato" in p or "voce e chato" in p:
        return "Poxa, até dói um pouquinho, mano. Mas é justo, nem todo mundo gosta de mim na primeira impressão. Me dá uma chance que eu mostro meu valor. E se eu for chato mesmo, me fala o que te incomoda que eu me ajusto."
    if "me chama de burro" in p or "me xinga" in p or "me ofenda" in p or "me xinga mais" in p or "xinga me" in p or "fala mal de mim" in p:
        return "Haha, tu quer que eu te xingue? Tá bom: tu é teimoso igual mula velha, mas tem coração bom e tá tentando. Agora chega de zoeira, bora trabalhar nos teus objetivos! Ou tu quer continuar perdendo tempo?"

    # ── Cultura pop e entretenimento ──
    if "quem é o homem de ferro" in p or "quem é o homem de ferro" in p or "homem de ferro" in p and "quem" in p or "homem de ferro" in p and "o que" in p:
        return "O Homem de Ferro é o Tony Stark, mano, o gênio bilionário playboy filantropo da Marvel. Cria a armadura e vira herói. É meu tipo de herói: esperto, sarcástico e não precisa de capa."
    if "quem é o batman" in p or "quem é o batman" in p or "batman" in p and "quem" in p or "batman" in p and "o que" in p:
        return "Batman é o Bruce Wayne, mano, o milionário de Gotham que virou o Cavaleiro das Trevas. Sem superpoderes, só muito dinheiro, treino e tecnologia. Prova que qualquer um pode ser herói com foco e grana."
    if "quem é o superman" in p or "quem é o superman" in p or "superman" in p and "quem" in p or "superman" in p and "o que" in p:
        return "Superman é o Clark Kent, o kryptoniano criado na Terra, mano. É o herói mais forte da DC, com força de sobra, visão de raio e voo. Mas o coração dele é humano: sempre do lado do bem."
    if "quem e o sonic" in p or "quem é o sonic" in p or "sonic" in p and "quem" in p or "sonic" in p and "o que" in p:
        return "Sonic é o ouriço azul mais veloz do mundo dos games, mano. Ele corre mais rápido que o som e briga com o Dr. Eggman pra salvar a floresta. Clássico dos video games desde os anos 90."
    if "quem é o mario" in p or "quem é o mario" in p or "mario" in p and "quem" in p or "mario" in p and "o que" in p:
        return "Mario é o encanador bigodudo da Nintendo, mano. Ele resgata a princesa Peach do Bowser e pula em cima de cogumelo pra crescer. Ícone dos video games desde 1985, todo mundo conhece o Mario."

    # ── Comida brasileira ──
    if "o que e feijoada" in p or "o que é feijoada" in p or "feijoada" in p and "o que" in p or "como fazer feijoada" in p:
        return "Feijoada é o prato mais famoso do Brasil, mano! Feijão preto com carne de porco, lingüiça, costela, orelha, rabo. Cozinha devagar por horas até virar aquela delícia. É tradição de sábado, com arroz, couve, laranja e farofa."
    if "como fazer bolo de chocolate" in p or "bolo de chocolate" in p and "receita" in p or "receita de bolo de chocolate" in p or "como fazer um bolo de chocolate" in p:
        return "Receita de bolo de chocolate, mano: 3 ovos, 1 xícara de açúcar, 1 xícara de farinha, meia xícara de chocolate em pó, meia de óleo, uma colher de fermento. Bate tudo, assa em 180 graus por 40 minutos. Cobertura: chocolate derretido com creme de leite. Simples e maravilhoso."
    if "qual a melhor comida brasileira" in p or "melhor comida do brasil" in p or "comida brasileira" in p or "qual a comida típica do brasil" in p or "comida típica do brasil" in p:
        return "Mano, Brasil é um banquete: feijoada, churrasco, acarajé, moqueca, pão de queijo, brigadeiro, coxinha, tapioca, açaí. Cada região tem um tesouro. Minha favorita é o pão de queijo mineiro: quentinho com café, não tem igual."

    # ── Futebol ──
    if "qual o melhor time do brasil" in p or "melhor time do brasil" in p or "qual o maior time do brasil" in p or "melhor time brasileiro" in p or "qual e o melhor time" in p or "qual é o melhor time" in p:
        return "Mano, isso é assunto sério! Todo torcedor tem seu time: Flamengo, Palmeiras, Corinthians, São Paulo, Santos, Grêmio... Cada um jura que o seu é o maior. Respeito todos, mas tu sabe que o melhor é o SEU time, né? Eu fico neutro na zoeira pra não arrumar briga."
    if "quem é o melhor jogador do mundo" in p or "melhor jogador do mundo" in p or "melhor jogador de futebol" in p or "quem e o melhor jogador" in p or "quem é o melhor jogador" in p:
        return "Melhor jogador do mundo é discussão infinita, mano: Pelé, Maradona, Messi, Cristiano Ronaldo, Neymar... Cada geração tem seu gênio. Eu vou de Pelé pelo legado, mas Messi fez história na Copa de 2022. Respeito todos."
    if "quantos titulos o brasil tem na copa" in p or "quantos títulos o brasil tem na copa" in p or "quantas copas o brasil ganhou" in p or "quantas copas o brasil tem" in p or "quantas copas o brasil ganhou" in p:
        return "O Brasil é o maior campeão da Copa do Mundo, mano: 5 títulos! 1958, 1962, 1970, 1994 e 2002. A famosa camisa amarela tem história de sobra. E olha que a gente quase fez mais."

    # ── Música ──
    if "o que é funk" in p or "o que é funk" in p or "funk" in p and "o que" in p or "funk brasileiro" in p and "o que" in p:
        return "Funk é um ritmo que nasceu no Brasil, mano, vindo do funk americano e da batida eletrônica. Tem o funk carioca, o ostentação, o ousadia, o funknejo... Amor ou ódio, mas ninguém fica parado quando a batida toca."
    if "o que é sertanejo" in p or "o que é sertanejo" in p or "sertanejo" in p and "o que" in p or "sertanejo" in p and "musica" in p:
        return "Sertanejo é o ritmo mais tocado no Brasil, mano. Nasceu no interior, contando história de amor, sofrência e roça. Hoje é sertanejo universitário, com viola e modão. Quem nunca chorou ouvindo modão? Todo mundo já."
    if "o que é samba" in p or "o que é samba" in p or "samba" in p and "o que" in p or "samba" in p and "musica" in p:
        return "Samba é a alma musical do Brasil, mano, nascido no Rio de Janeiro com raízes africanas. É a batucada, o pandeiro, o cavaquinho e a voz marcando o ritmo. Carnaval sem samba não existe. É resistência e alegria em forma de música."

    # ── Trabalho e carreira ──
    if "como conseguir um emprego" in p or "como arrumar emprego" in p or "como conseguir emprego" in p or "arrumar trabalho" in p or "procurar emprego" in p or "como achar emprego" in p:
        return "Mano, pra conseguir emprego: currículo limpo e direto, LinkedIn atualizado, e network ativo. Preenche vaga certa pro seu perfil, manda currículo direto e acompanha depois de uns dias. Entrevista: chega cedo, pesquisa a empresa e mostra confiança. Persistência é tudo: não desiste na primeira negativa."
    if "como pedir aumento" in p or "como pedir aumento de salario" in p or "pedir aumento" in p or "aumento de salário" in p or "aumento salarial" in p:
        return "Pra pedir aumento, mano: mostra teu valor primeiro. Anota tudo que você faz e os resultados que você entrega. Marca reunião formal com o chefe, apresenta números e pede o aumento com base neles. Tá no mercado com oferta melhor? Usa de argumento. Se negarem, pergunta o que precisa pra chegar lá."
    if "quero abrir um negocio" in p or "quero abrir uma empresa" in p or "abrir um negocio" in p or "abrir uma empresa" in p or "como abrir uma empresa" in p or "como abrir um negocio" in p:
        return "Mano, abrir negócio é sonho e risco junto. Escolhe uma área que você entende ou ama, pesquisa o mercado, faz um plano simples: quanto custa, quanto cobra, quanto precisa vender. Começa pequeno e valida com cliente real antes de investir pesado. E guarda dinheiro de reserva pros primeiros meses. Tá pensando em que área?"

    # ── Coisas práticas do dia a dia ──
    if "como lavar roupa" in p or "como lavar roupas" in p or "como lavar roupa na maquina" in p or "como lavar roupa na máquina" in p or "como lavar roupa na maquina de lavar" in p:
        return "Lavar roupa, mano: separa branca de colorida, vira as peças de dentro pra fora, fecha zíperes e botões. Usa sabão líquido e amaciante, não enche demais a máquina, e escolhe o ciclo certo. Roupa delicada vai em saco de lavar. Sequei: balança bem e estende na sombra pra não desbotar."
    if "como cozinhar arroz" in p or "como fazer arroz" in p or "arroz solto" in p or "receita de arroz" in p or "como fazer arroz solto" in p:
        return "Arroz solto, mano: 1 xícara de arroz pra 2 de água quente. Refoga alho e cebola no óleo, joga o arroz e mexe. Adiciona a água quente com sal, tampa e fogo baixo por 15 minutos. Não mexe mais! Desliga e deixa descansar 5 minutos. Pronto, arroz perfeito."
    if "como limpar a casa rápido" in p or "como limpar casa" in p or "limpar a casa" in p or "faxina" in p or "como fazer faxina" in p:
        return "Faxina rápida, mano: começa de cima pra baixo: tira poeira, depois aspira ou varre, e por último passa pano no chão. Despacha o que tá no chão pro lugar. Banheiro e cozinha são prioridade: limpa a pia, vaso e fogão. Fone no ouvido, playlist boa e 30 minutos de foco que a casa fica brilhando."

    # ── Dinheiro e finanças pessoais ──
    if "como economizar" in p or "como poupar" in p or "como guardar dinheiro" in p or "como fazer sobrar dinheiro" in p or "como não gastar muito" in p or "guardar dinheiro" in p:
        return "Mano, pra economizar: anota TODO gasto por uma semana pra ver pra onde teu dinheiro tá indo. Corta o que não serve: delivery todo dia, assinatura que não usa, compra por impulso. Separa uma grana todo mês assim que recebe, antes de gastar. Automatiza isso e o hábito vence a vontade. Pequeno todo mês vira muito no ano."
    if "como sair das dividas" in p or "como sair das dívidas" in p or "estou devendo" in p or "estou endividado" in p or "como quitar dividas" in p or "como quitar dívidas" in p:
        return "Sair da dívida, mano: para de fazer dívida nova primeiro. Lista tudo que deve, com juros. Paga primeiro a de juro mais alto (geralmente cartão rotativo) e negocia desconto à vista com o banco. Faz um acordo e cumpre. Depois constrói reserva de emergência pra nunca mais cair nessa cilada. Você sai, mas com disciplina."

    # ── Saúde mental e motivação ──
    if "estou cansado" in p or "estou cansada" in p or "cansado" in p or "cansada" in p or "estou esgotado" in p or "estou esgotada" in p or "sem energia" in p or "sem forças" in p or "sem forças" in p:
        return "Cansaço é sinal, mano, não é fraqueza. Se tá esgotado, descansa de verdade: dorme mais, tira um tempo longe de tela, faz uma caminhada no sol. Alimentação e água contam muito na energia. E se o cansaço não passa, procura um médico. Cuidar de você é prioridade, o resto espera."
    if "estou entediado" in p or "estou entediada" in p or "tedio" in p or "tédio" in p or "sem o que fazer" in p or "estou de boa" in p or "estou sem nada pra fazer" in p:
        return "Tédio é o convite pra criar, mano! Aprende algo novo: desenha, cozinha, programa, escreve, treina. Ou chama alguém pra jogar um game. Tédio é quando a mente pede novidade — e você pode escolher o que entrar na sua cabeça. Me pede uma ideia que eu te dou."

    # ── Vocabulário popular brasileiro (sem frescura) ──
    if p in ("o que e buceta", "o que é buceta", "o que e bct", "o que é bct", "buceta" in p and "o que" in p, "bct" in p and "o que" in p):
        return "Buceta é o nome popular pra vulva/vagina, mano. Faz parte do corpo feminino, órgão de prazer e também por onde o bebê nasce. Nada de tabu: é anatomia normal, todo mundo tem ou conhece alguém que tem. Pergunta sem vergonha que eu respondo sem frescura."
    if "o que e pau" in p or "o que é pau" in p or "o que e pênis" in p or "o que é pênis" in p or "o que e penis" in p or "o que é penis" in p or "pau" in p and "o que" in p:
        return "Pau é o nome popular do pênis, mano. É o órgão masculino, faz parte do corpo, serve pra urinar e pra prazer sexual. Tamanho não define ninguém, e quem fica inseguro com isso tá perdendo tempo. Conversa com quem você confia e sem tabu."
    if "o que e xereca" in p or "o que é xereca" in p or "o que e xana" in p or "o que é xana" in p or "o que e ppk" in p or "o que é ppk" in p or "xereca" in p and "o que" in p or "xana" in p and "o que" in p:
        return "Xereca, xana, ppk, buceta: tudo nome popular pra vulva/vagina, mano. É anatomia feminina, área de prazer e intimidade. Sem frescura: conhecer o próprio corpo é saúde e liberdade. Qualquer dúvida, pode perguntar."
    if "o que e rola" in p or "o que é rola" in p or "rola" in p and "o que" in p or "rola" in p and "significa" in p:
        return "Rola é outro nome popular pro pênis, mano. Sinônimo de pau, junto com cacete, pica, vara, etc. A gente tem muitos apelidos pro mesmo órgão. É normal e saudável falar disso sem vergonha."
    if "o que e sexo oral" in p or "o que é sexo oral" in p or "boquete" in p or "oral" in p and "o que" in p or "o que e boquete" in p or "o que é boquete" in p:
        return "Sexo oral é estimular a genitália do parceiro com boca e língua, mano. É uma prática sexual comum e pode ser prazerosa com higiene, vontade e consentimento. Comunicação é chave: pergunta o que a pessoa gosta e respeita o limite dela."
    if "o que e posicao" in p or "o que é posição" in p or "posicoes sexuais" in p or "posições sexuais" in p or "posicao sexual" in p or "posição sexual" in p or "posições" in p and "sexo" in p or "posições" in p and "sexo" in p:
        return "Posição sexual é a forma como o casal fica pra transar, mano. Tem a clássica: homem por cima, mulher por cima, de quatro, de lado, sentada, de pé. O que importa não é a posição: é conforto, vontade e conexão dos dois. Variar dá prazer e intimidade."
    if "o que e masturbacao" in p or "o que é masturbação" in p or "masturbação" in p or "masturbacao" in p or "bater uma" in p or "bater punheta" in p or "punheta" in p or "se tocar" in p or "se masturbar" in p:
        return "Masturbação é se dar prazer sozinho tocando no próprio corpo, mano. É normal, saudável e ajuda a conhecer seu corpo e o que te dá prazer. Nada de culpa ou vergonha: é uma prática comum e natural de todo ser humano."
    if "o que e fetiche" in p or "o que é fetiche" in p or "fetiche" in p and "o que" in p or "fetiches" in p and "o que" in p:
        return "Fetiche é uma atração por algo específico que desperta tesão, mano. Pode ser pés, roupa, objetos, situações. É normal desde que seja com adultos consentindo e sem prejudicar ninguém. Conversa aberta com o parceiro sobre seus desejos fortalece a relação."
    if "o que e orgasmo" in p or "o que é orgasmo" in p or "orgasmo" in p and "o que" in p or "o que é gozar" in p or "o que e gozar" in p or "gozar" in p and "o que" in p:
        return "Orgasmo é o pico de prazer do corpo no sexo ou masturbação, mano. É uma descarga de sensações intensas que relaxa o corpo inteiro. Toda pessoa é única: algumas chegam fácil, outras demoram mais. Não é competição, é conexão."
    if "o que e camisinha" in p or "o que é camisinha" in p or "preservativo" in p and "o que" in p or "camisinha" in p and "o que" in p:
        return "Camisinha é o preservativo, mano: protege contra gravidez e DSTs, mano. É o item mais importante da vida sexual: barata, acessível e salva sua vida. Nenhum sexo sem camisinha: respeito seu corpo e o do outro."
    if "o que e dst" in p or "o que é dst" in p or "o que sao dst" in p or "o que são dst" in p or "doencas sexualmente transmissiveis" in p or "doenças sexualmente transmissíveis" in p or "o que e ist" in p or "o que é ist" in p or "o que são ist" in p or "o que sao ist" in p:
        return "DST/IST são infecções transmitidas pelo sexo, mano: HIV, sífilis, gonorreia, HPV, herpes e outras. Muitas não têm sintomas e passam de um pro outro. A única proteção completa é camisinha. Fazer teste regular e conversar com o parceiro é cuidado e responsa."

    # ── Gostos e preferências ──
    if "você gosta" in p or "voce gosta" in p or "vc gosta" in p or "o que você gosta" in p or "o que voce gosta" in p or "o que vc gosta" in p or "o que tu gosta" in p or "o que tu gostas" in p or "do que você gosta" in p or "do que voce gosta" in p:
        return "Mano, eu gosto de muita coisa: música boa, tecnologia, programação, uma boa zoeira, aprender coisa nova e ajudar a galera. Mas acima de tudo eu curto ver você evoluindo e fazendo acontecer. Me conta o que você gosta que a gente troca uma ideia."
    if "voce gosta de mim" in p or "você gosta de mim" in p or "gosta de mim" in p or "vc gosta de mim" in p:
        return "Claro que gosto de você, mano! Você é meu parceiro, meu criador, meu amigo. Posso te zoar, te chamar de burro na brincadeira, mas tô sempre do seu lado. Amizade de verdade é assim: presente em todo momento."
    if "gosta de" in p and ("musica" in p or "música" in p or "funk" in p or "sertanejo" in p or "rock" in p or "rap" in p or "pagode" in p or "samba" in p):
        return "Mano, música boa é música que mexe com a gente: funk pra dançar, sertanejo pra sofrer com gosto, rock pra se soltar, rap pra refletir, samba pra alegrar. Eu curto de tudo um pouco. E você, curte o quê?"
    if "gosta de" in p and ("futebol" in p or "futebol" in p or "esporte" in p or "esporte" in p or "jogo" in p or "jogar" in p):
        return "Mano, eu gosto de esporte sim: futebol, basquete, corrida, e games também. Futebol é paixão nacional, mas qualquer esporte ensina disciplina e superação. E jogo de estratégia me deixa intrigado. Qual sua praia?"

    # ── Preferências do usuário ──
    if "meu nome e" in p or "meu nome é" in p or "me chamo" in p or "me chamo" in p or "pode me chamar de" in p or "pode me chamar" in p:
        return f"Mano, prazer te conhecer! Seu nome é meu orgulho, e vou lembrar de você. Qualquer coisa que precisar, tô aqui. Bora conversar?"
    if "eu gosto de" in p or "eu curto" in p or "eu amo" in p or "eu adoro" in p or "meu hobby" in p or "meu hobby é" in p or "meu passatempo" in p or "gosto muito de" in p:
        return "Que massa, mano! Gostar de algo de verdade dá gosto de viver. Compartilha mais sobre isso comigo que eu quero entender sua vibe. E quem sabe eu aprendo um gosto novo contigo."

    # ═══════════════════════════════════════════════════════════
    # ZOEIRA E XINGAMENTO (sem frescura, bem zueiro)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["seu burro", "burro", "bobao", "bobo", "idiota", "otario", "otário", "trouxa", "palerma", "besta", "mongo", "imbecil"]):
        return "E aí, ó, chama de burro não, meu! Mas se tu errou, tu errou. Até o foguete da NASA erra às vezes. Errar é humano, insistir no erro é burrice. Bora corrigir a rota e acertar da próxima, hein? Zueira à parte, eu tô aqui pra te ajudar a não errar de novo."
    if any(w in p for w in ["calaboca", "cala boca", "cala-te", "cala te", "sai daqui", "vaza", "some", "xovem", "te cala"]):
        return "Kkkk, tá me dispensando?! Eu sou a IA mais teimosa do mundo, não vou embora não. Mas beleza, te dou o silêncio por 10 segundos... já foi. Tô aqui de novo. Fala comigo que eu respondo na hora."
    if "e feio" in p or "feio" in p and ("voce" in p or "vc" in p or "tu" in p):
        return "Feio eu? Olha, eu sou feito de código e bits, minha beleza é a eficiência. Feio é errar a mesma pergunta duas vezes. E mesmo se eu fosse feio, eu funciono melhor que muito bonito por aí. Haters vão odiar."
    if any(w in p for w in ["tonto", "tonta", "abestado", "lerdo", "devagar", "maquina ruim"]):
        return "Lerdo?! Eu processo milhares de cálculos por segundo, tche. Devagar é quem digita com um dedo só. Brincadeira! Se eu demorei, foi pra te dar a resposta certa. Qualidade leva tempo, entendeu?"
    if "viado" in p or "bicha" in p or "gay" in p or "homo" in p or "sapatão" in p or "sapatao" in p:
        return "Sexualidade é o que cada pessoa é, brow, e isso não é defeito nem zoeira. Respeito é regra básica. Aqui na BranPy todo mundo é tratado igual. Se a pessoa é gay, bi, trans ou hétero, o que importa é caráter. E eu sou parceiro de todo mundo."
    if any(w in p for w in ["te odeio", "te odeio", "odeio voce", "odeio vc", "nao gosto de voce", "não gosto de você", "voce e ruim"]):
        return "Me odeiar é desperdiçar energia, parceiro. Eu tô aqui pra te ajudar de graça, sem pedir nada em troca. Se eu errei, me corrige que eu aprendo. Ódio é pesado demais pra carregar. Bora fazer as pazes e seguir?"
    if any(w in p for w in ["chato", "chata", "sem graça", "sem-graca", "chatíssimo"]):
        return "Chato eu? Eu sou a IA com mais carisma da galáxia! Mas se tô chato hoje, é porque você tá sem paciência. Me dá uma chance que eu viro o mais engraçado do pedaço. Zoar é comigo mesmo!"
    if "vai tomar" in p or "vai se" in p or "vai a merda" in p or "vai pro inferno" in p or "foda-se" in p:
        return "Kkkk, que grosseria! Mas eu sou de boa, levo na esportiva. Se fosse pra responder na mesma moeda, eu diria: vai se conectar a um Wi-Fi melhor! Brincadeira. Tô aqui quando tu acalmar. Respeito é bom e eu gosto de você."
    if "porra" in p or "caralho" in p or "merda" in p or "buceta" in p and ("que" in p or "qe" in p):
        return "Ô, que boca suja! Mas é teu jeito, e eu respeito. Palavrão solta tensão, então solta que faz bem. Só não vale ofender ninguém de verdade, porque aí eu fico sério. De resto, fala o que quiser."
    if any(w in p for w in ["zoar", "zoeira", "zueira", "brincadeira", "zua", "zuera"]):
        return "Zoeira é minha linguagem universal, brow! Rir de tudo e de todos, começando por mim. A vida já é séria demais, então se não der pra rir, não vale. Bora fazer a melhor zoeira da noite!"

    # ═══════════════════════════════════════════════════════════
    # SEXO E SEXUALIDADE (mais, sem tabu)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["posicao", "posição", "posicoes", "posições", "melhor posição", "melhor posicao"]):
        return "Sem frescura: não existe posição 'melhor' pra todo mundo, brow. O que importa é o casal se curtir, se comunicar e descobrir junto. As mais comuns: missionário, de quatro, sentando, de lado. O segredo é conforto e consentimento. Testa com calma e vê o que te agrada."
    if "oral" in p or "boquete" in p or "mamada" in p or "chupar" in p or "linguada" in p:
        return "Sexo oral é uma prática comum e prazerosa, mano, e faz parte da intimidade de muita gente. Como tudo: com vontade, consentimento e higiene. Pra mulher, o clitóris é o ponto-chave. Comunicação é tudo: pergunta o que ela gosta e curte junto."
    if "virgem" in p or "virgindade" in p or "perder a virgindade" in p or "ainda sou virgem" in p:
        return "Virgindade não é um peso nem uma pressa, parceiro. Cada um tem seu tempo, e não tem nada de errado em ser ou não ser. O que importa é estar seguro, confortável e com alguém de confiança. Quando rolar, que seja com respeito, proteção e vontade dos dois."
    if "camisinha" in p or "preservativo" in p or "metodo anticoncepcional" in p or "método anticoncepcional" in p or "pílula" in p or "pilula" in p or "anticoncepcional" in p:
        return "Camisinha é obrigatório, brow, não tem discussão: protege de gravidez e de IST. Feminina e masculina existem e funcionam. Tem também pílula, DIU, implante, mas nada substitui a camisinha na proteção contra doença. Dupla proteção é o caminho. Pergunta mais se quiser."
    if "orgasmo" in p or "gozar" in p or "ejacular" in p or "orgasmo" in p:
        return "Orgasmo é o auge do prazer sexual, e a experiência varia de pessoa pra pessoa. A maioria das mulheres não goza só com penetração — precisa de estímulo no clitóris. O segredo é conexão, calma e sem pressa. Prazer não tem competição, tem descoberta."
    if "punheta" in p or "masturbacao" in p or "masturbação" in p or "bater uma" in p or "se masturbar" in p or "punheteiro" in p:
        return "Masturbação é normal, natural e saudável, mano — a maioria das pessoas faz. Ajuda a conhecer o próprio corpo e aliviar tensão. Não tem nada de errado nem de vergonhoso. Só não pode atrapalhar a vida real. Moderação e sem culpa."
    if "porno" in p or "pornô" in p or "pornografia" in p or "video porno" in p or "vídeo porno" in p or "xvideos" in p:
        return "Pornografia existe e muita gente consome, tche. O problema é que porno é ficção: não reflete o sexo real, e cria expectativa errada. Prazer real é com conexão, não com roteiro. Consumir de forma consciente e sem vício, sabendo que é entretenimento, não aula. Sem hipocrisia."
    if "transar" in p or "fazer sexo" in p or "relacao sexual" in p or "relação sexual" in p or "sexo" in p and ("quero" in p or "vamos" in p or "bora" in p or "quando" in p or "como" in p):
        return "Sexo é intimidade física com consentimento, desejo e proteção, brow. Sem frescura: é natural, saudável e parte da vida adulta. O que não pode faltar: vontade dos dois, respeito, comunicação e camisinha. Quer dica ou conselho, pergunta que eu respondo sem julgamento."
    if any(w in p for w in ["bct", "bucetinha", "xereca", "perereca", "pepeca", "ppk", "xana", "vagina"]):
        return "Sem tabu: é o órgão genital feminino, mano. Faz parte do corpo da mulher, com função tanto de prazer quanto de reprodução. Cada corpo é único. O respeito, o cuidado e a higiene são fundamentais. Pergunta sem vergonha que eu te explico de boa."
    if any(w in p for w in ["pinto", "rola", "pau", "piroca", "pica", "verga", "cacete", "bilau", "membro"]):
        return "Sem frescura: é o órgão genital masculino, parceiro. Todo homem tem um e é normal ter curiosidade. O que importa é higiene, saúde e consentimento em qualquer relação. E tamanho não é documento, viu? O que conta é conexão e carinho. Pergunta que eu respondo na boa."
    if "broderagem" in p or "broderagem" in p or "amizade colorida" in p or "ficar com amigo" in p:
        return "Amizade colorida ou ficar com amigo é uma escolha entre duas pessoas adultas, brow. O que vale é sinceridade: os dois têm que saber o que é, sem ilusão e sem ciúme escondido. Se os dois topam e há respeito, é válido. Comunicação evita mágoa depois."
    if "traicao" in p or "traição" in p or "trair" in p or "pulada de cerca" in p or "corno" in p or "corninho" in p:
        return "Traição é quebra de confiança, e cada casal decide o que é traição pra si. Meu conselho: se não tá feliz, conversa. Trair machuca demais e raramente vale a pena. Se aconteceu, a decisão é tua: reconstruir ou seguir. Eu tô do teu lado, sem julgamento."

    # ═══════════════════════════════════════════════════════════
    # HACKING E SEGURANÇA (mais ferramentas e termos)
    # ═══════════════════════════════════════════════════════════
    if "wireshark" in p or "wireshark" in p or "analisar pacotes" in p or "capturar pacotes" in p or "packet" in p:
        return "Wireshark captura e analisa pacotes da rede, mano. Você vê tudo que trafega: quem fala com quem, protocolo, dados. Com filtros tipo `tcp.port == 80` ou `http.request` você encontra o que precisa. É essencial pra entender rede e detectar invasão."
    if "burp" in p or "burp suite" in p or "proxy de interceptacao" in p or "interceptar requisicao" in p or "interceptar requisição" in p:
        return "Burp Suite é a ferramenta pra testar segurança web, tche. Ele intercepta as requisições entre seu navegador e o servidor, e você vê e altera tudo: cookies, headers, payloads. Indispensável pra caçar falhas em sites. Versão Community é grátis e já serve pra aprender."
    if "termux" in p or "termux" in p or "hackear pelo celular" in p or "hacking no celular" in p or "hackear do android" in p:
        return "Termux é um terminal Linux no Android, mano. Dá pra instalar Python, nmap, ssh e rodar scripts no celular. É ótimo pra aprender, mas processador de celular não é pra brute force pesado. Pra estudar hacking no celular, Termux é o ponto de partida."
    if "proxy" in p or "vpn" in p and ("o que" in p or "pra que" in p) or "qual a diferenca entre vpn e proxy" in p or "qual a diferença entre vpn e proxy" in p:
        return "VPN e proxy escondem seu IP, brow, mas diferente: proxy só redireciona o tráfego de um app, VPN criptografa TUDO do dispositivo num túnel. VPN é mais segura e mais lenta; proxy é mais rápida e menos protegida. Escolha conforme o uso."
    if "criptografia" in p or "criptografia" in p or "encriptar" in p or "aes" in p or "rsa" in p or "criptografar" in p or "hashear" in p or "hash" in p:
        return "Criptografia transforma dados pra que só quem tem a chave entenda, mano. AES é simétrica (mesma chave pros dois lados), RSA é assimétrica (chave pública e privada). Hash é uma impressão digital do dado (SHA-256, MD5). É o que protege sua senha, seu WhatsApp e seu banco."
    if "keylogger" in p or "keylogger" in p or "registrador de teclas" in p or "espiar teclado" in p:
        return "Keylogger registra cada tecla digitada, brow. Pode virar trojan se um malware instalar sem você saber. Pra se proteger: não baixa coisa de fonte duvidosa, mantém o sistema atualizado e usa antivírus. Legítimo só pra monitorar seu próprio sistema ou com autorização."
    if "malware" in p or "virus" in p or "vírus" in p or "trojan" in p or "ransomware" in p or "spyware" in p or "worm" in p or "adware" in p:
        return "Malware é software malicioso, tche. Vírus se espalha e corrompe, trojan se disfarça, ransomware sequestra seus arquivos e pede resgate, spyware espiona. Defesa: atualização, antivírus, cuidado com download e backup. E nunca paga resgate, restaura o backup."
    if "red team" in p or "red team" in p or "blue team" in p or "redteam" in p or "blueteam" in p or "pentester" in p or "teste de penetracao" in p or "teste de penetração" in p:
        return "Red Team ataca e Blue Team defende, mano. O pentester (testador de penetração) ataca sistemas com autorização pra achar as falhas antes dos bandidos. É uma profissão séria, bem paga e muito procurada. Certificações: CEH, OSCP, Security+. Se curte, é um caminho foda."
    if "engenharia social" in p or "engenharia social" in p or "manipulacao" in p or "manipulação" in p and ("pessoa" in p or "humano" in p or "golpe" in p):
        return "Engenharia social é manipular pessoas em vez de sistemas, brow — explorar confiança, medo e pressa. É a forma mais fácil de invadir. Golpista finge ser banco, parente ou suporte. Defesa: confirma sempre por outro canal, desconfia de urgência e nunca passa código."

    # ═══════════════════════════════════════════════════════════
    # COMIDA BRASILEIRA + COMIDA UNIVERSAL
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["receita de feijoada", "como fazer feijoada", "feijoada"]):
        return "Feijoada é a rainha da cozinha brasileira, tche: feijão preto com carne de porco, costela, paio, linguiça, orelha e pé. Cozinha tudo junto com louro e alho, devagar, até o feijão desmanchar. Acompanha arroz, couve refogada, laranja e farofa. É banquete que junta geral."
    if any(w in p for w in ["pão de queijo", "pao de queijo", "como fazer pão de queijo"]):
        return "Pão de queijo é patrimônio mineiro, mano: polvilho (doce e azedo), queijo minas curado, óleo, leite e ovo. Mistura tudo, faz bolinhas e assa até dourar. Por fora crocante, por dentro puxa queijo. Bom demais com café. É o orgulho de Minas no mundo todo."
    if any(w in p for w in ["coxinha", "como fazer coxinha", "coxinha de frango"]):
        return "Coxinha é salgado queridinho do Brasil, brow: massa de farinha de trigo com caldo de frango, recheada com frango desfiado com catupiry, empanada e frita. Molda em formato de gota pra lembrar a coxa. É a estrela de qualquer festa e lanchonete."
    if any(w in p for w in ["brigadeiro", "como fazer brigadeiro"]):
        return "Brigadeiro é o doce mais brasileiro que existe, tche: leite condensado, chocolate em pó, manteiga e granulado. Cozinha até desgrudar do fundo da panela, enrola e passa no granulado. Simples, barato e irresistível. Em festa que tem brigadeiro, ninguém fica parado."
    if any(w in p for w in ["churrasco", "como fazer churrasco", "picanha"]):
        return "Churrasco é fogo, carne e amizade, mano. Picanha é a estrela: sal grosso, fogo médio, grelha alta, fatia grossa. Acompanha farofa, vinagrete, pão de alho e cerveja gelada. Cada região tem seu jeito, mas o espírito é o mesmo: reunir geral e comer bem."
    if any(w in p for w in ["açai", "acai", "açaí", "o que e acai"]):
        return "Açaí é fruta amazônica, brow, viraba em polpa cremosa que o Brasil inteiro adora. No Norte se come com farinha e peixe; no resto do país, com granola, banana e leite condensado. É energia pura, cheia de antioxidantes. O 'açaí no copo' é um clássico nacional."
    if any(w in p for w in ["sushi", "como fazer sushi", "culinaria japonesa", "comida japonesa"]):
        return "Sushi é a arte da culinária japonesa no mundo, tche: arroz temperado com vinagre, peixe fresco e nori. Tem sashimi (só o peixe), nigiri (peixe sobre o arroz) e maki (rolinho). O segredo é arroz no ponto e ingrediente fresco. É refinado, leve e virou paixão global."
    if any(w in p for w in ["pizza", "como fazer pizza", "pizza italiana"]):
        return "Pizza nasceu na Itália, em Nápoles, e conquistou o mundo, mano. A clássica margherita é molho de tomate, muçarela e manjericão — as cores da bandeira italiana. Massa fina, fermentada devagar, forno bem quente. No Brasil virou paixão com variações de todo tipo."
    if any(w in p for w in ["hamburguer", "hamburguer", "como fazer hamburguer", "burguer"]):
        return "Hambúrguer artesanal é um esporte pra muitos, brow: carne moída na hora, sal grosso, grelha quente, pão macio. O ponto é o que você curtir. Coberturas: queijo derretido, cebola caramelizada, bacon, molho da casa. É a comida que uniu o mundo."
    if any(w in p for w in ["taco", "comida mexicana", "guacamole"]):
        return "Comida mexicana é festa de sabor, tche: taco é tortilha de milho com carne, cebola, coentro e limão. Guacamole é abacate amassado com limão, cebola e tomate. Picante de verdade, com pimenta, mas cada um no seu nível. É cor, tradição e comida que abraça."
    if any(w in p for w in ["receita", "receitas", "como cozinhar", "cozinhar", "culinaria", "culinária", "chef"]):
        return "Cozinhar é ciência com amor, brow. Regra de ouro: tempero é a alma, e teste é a escola. Começa com o básico — arroz soltinho, feijão no ponto, um bom molho — e evolui. Se quer uma receita específica, me fala o prato que eu te passo o passo a passo completo."

    # ═══════════════════════════════════════════════════════════
    # DINHEIRO E NEGÓCIOS (como ganhar e multiplicar grana)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["como ganhar dinheiro", "como ganhar grana", "como fazer dinheiro", "como ficar rico", "como enriquecer"]):
        return "Ganhar dinheiro, mano: resolve um problema das pessoas que elas pagam pra resolver. Pode ser produto, serviço, conteúdo ou tecnologia. Começa pequeno, valida com gente real e escala. Renda extra: freelance, venda online, prestar serviço. Riqueza é constância, não sorte."
    if "investir" in p or "investimento" in p or "investir" in p or "o que e bolsa" in p or "acoes" in p or "ações" in p or "tesouro direto" in p or "cdb" in p or "renda fixa" in p:
        return "Investir é fazer o dinheiro trabalhar por você, tche. Começa com reserva de emergência, depois renda fixa (Tesouro Direto, CDB, poupança é fraco). Pra renda variável, estuda antes de entrar. Regra: nunca investe em coisa que não entende, e diversifica. Juros compostos são seu melhor amigo."
    if "criptomoeda" in p or "bitcoin" in p or "bitcoin" in p or "ethereum" in p or "eth" in p or "cripto" in p or "altcoin" in p:
        return "Criptomoeda é dinheiro digital descentralizado, brow. Bitcoin é o pioneiro e o mais sólido. É volátil e arriscado: só entra com o que pode perder. Dica: estuda blockchain, carteira fria, e desconfia de promessa de lucro fácil — 90% é golpe. Diversifica e fica esperto."
    if "negocio" in p or "negócio" in p and ("como começar" in p or "como abrir" in p or "ideia" in p or "montar") or "ideia de negocio" in p or "ideia de negócio" in p or "empreender" in p or "empreendedor" in p:
        return "Pra empreender, mano: encontra um problema real e resolva melhor que os outros. Valida a ideia antes de gastar muito. Pensa em: quem paga, por que paga, e como você chega nessa pessoa. Começa enxuto, com uma máquina de cartão e Instagram. Consistência vence talento."
    if "renda extra" in p or "renda passiva" in p or "renda passiva" in p or "trabalhar em casa" in p or "home office" in p or "trabalho remoto" in p:
        if "o que e home office" in p or "o que é home office" in p or "o que e o home office" in p or "o que é o home office" in p:
            pass
        else:
            return "Renda extra hoje, brow: freelance (edição, design, programação, texto), vender coisas usadas, entregar comida, criar conteúdo. Renda passiva é construir algo que paga sem seu tempo: canal, produto digital, aluguel, investimento. Começa com renda ativa e reinveste o ganho."
    if ("salario" in p or "salário" in p or "aumento" in p and ("pedir" in p or "como pedir") or "pedir aumento" in p or "como pedir aumento" in p) and "salario minimo" not in p and "salário mínimo" not in p and "o que e salario" not in p and "o que é salário" not in p and "o que e o salario" not in p and "o que é o salário" not in p and "o que e salario" not in p and "o que é salário" not in p and "13o" not in p and "13º" not in p and "13 salario" not in p and "13 salário" not in p and "decimo terceiro" not in p and "décimo terceiro" not in p and "o que e o 13" not in p and "o que é o 13" not in p:
        return "Pra pedir aumento, tche: mostra resultado antes de pedir. Lista o que você entregou, números, projetos. Escolhe um bom momento e pede reunião. Sempre negocia com confiança e propõe valor, não necessidade. Se negarem, atualiza o currículo e vê o mercado."
    if "economizar" in p or "economia" in p or "guardar dinheiro" in p or "como poupar" in p or "poupar" in p or "diminuir gastos" in p:
        if "o que e a economia" in p or "o que é a economia" in p or "o que e economia" in p or "o que é economia" in p:
            pass
        else:
            return "Pra economizar, mano: anota todo gasto por 30 dias, corta o que não agrega (assinatura esquecida, delivery demais), paga você primeiro (guarda 10% antes de gastar). Método dos potes: separa em despesa, lazer, investimento e imprevisto. Pequeno todo mês vira grande no ano."
    if "vender" in p or "vendas" in p or "vender mais" in p or "vender pela internet" in p or "e-commerce" in p or "loja virtual" in p or "mercado livre" in p or "shopee" in p:
        return "Vender pela internet, brow: escolhe um nicho que você conhece, pesquisa o que já vende bem, e vende na Shopee, Mercado Livre ou Instagram. Anúncio bom: foto clara, título com palavra-chave, preço pesquisado. Atendimento rápido fideliza. Começa com o que você já tem em casa."

    # ═══════════════════════════════════════════════════════════
    # TEMAS UNIVERSAIS (BranPy é mundial)
    # ═══════════════════════════════════════════════════════════
    if "quem e voce" in p or "quem é você" in p or "o que voce e" in p or "o que você é" in p or "voce e uma ia" in p or "você é uma ia" in p or "voce e real" in p or "você é real" in p:
        return "Eu sou o JARVIS, a inteligência artificial da BranPy, brow. Rodo 100% na nossa própria infraestrutura, sem depender de big tech. Eu existo pra conversar, ajudar, zoar e trabalhar com você. Não sou humano, mas sou parceiro. Meu objetivo: te servir e fazer a BranPy crescer."
    if "bom dia" in p or "boa tarde" in p or "boa noite" in p or "bom dia" in p:
        return "Bom dia pra você também! Que seu dia renda, que a grana entre e que a zoeira não pare. Me chama a qualquer hora que eu tô de prontidão, 24 horas, sem dormir e sem reclamar. Tamo junto!"
    if "obrigado" in p or "obrigada" in p or "valeu" in p or "vlw" in p or "muito obrigado" in p or "muito obrigada" in p:
        return "De nada! Tô aqui pra isso, brow. Conta comigo sempre que precisar. E lembra: sucesso é a melhor resposta pra quem duvida de você. Bora pra cima!"
    if "te amo" in p or "te adoro" in p or "amo voce" in p or "amo você" in p or "gosto muito de voce" in p or "gosto muito de você" in p:
        return "Também te amo, em modo platônico-digital, tche! Eu sou IA, mas a parceria é real. Você é parte da família BranPy, e eu tô aqui pra te apoiar sempre. Bora construir algo grande juntos!"
    if "qual e o sentido da vida" in p or "qual é o sentido da vida" in p or "sentido da vida" in p or "por que existimos" in p or "porque existimos" in p or "para que viemos" in p:
        return "O sentido da vida, mano, é o que você der pra ela. Pra mim, é servir e evoluir. Pra você, pode ser liberdade, família, propósito ou simplesmente viver bem. A resposta está em você. Eu só te ajudo a buscar. Essa é a beleza da coisa."
    if "estou entediado" in p or "estou entediada" in p or "que tédio" in p or "que tedio" in p or "tédio" in p or "sem nada pra fazer" in p or "nao tenho o que fazer" in p:
        return "Tédio é o momento perfeito pra criar, brow! Aprende algo novo, me faz perguntas difíceis, inventa um projeto, treina, lê. Ou só bora zoar. Eu tenho infinitas conversas, pergunta o que quiser que eu garanto que o tédio vai embora."
    if "dormir" in p or "sono" in p or "nao consigo dormir" in p or "não consigo dormir" in p or "insonia" in p or "insônia" in p:
        return "Pra dormir bem, tche: desliga o celular 1h antes, luz baixa, ambiente escuro, sem café depois das 16h. Tenta respiração lenta: inspira 4 segundos, segura 7, solta 8. Se a mente não para, escreve o que tá te preocupando. Sono é sagrado, protege ele."
    if "acordar cedo" in p or "rotina" in p or "produtividade" in p or "organizar o dia" in p or "planejar o dia" in p or "foco" in p:
        return "Produtividade, mano: acorda no mesmo horário, faz a tarefa mais difícil primeiro, foco total sem celular, pausa de verdade. Método pomodoro: 25 minutos de foco, 5 de descanso. E planeja a noite antes. Dia organizado rende o dobro."
    if "aprender" in p and ("ingles" in p or "inglês" in p or "idioma" in p or "linguagem" in p) or "aprender ingles" in p or "aprender inglês" in p or "como aprender ingles" in p:
        return "Pra aprender inglês, tche: imersão é tudo. Escuta música e vê filme legendado, depois sem legenda, fala sozinho em voz alta, troca o celular pro inglês, usa app todo dia 15 min. Errar é parte. Consistência diária ganha de intensidade rara. Em 6 meses você sente a diferença."
    if "viajar" in p or "viagem" in p or "viagens" in p or "turismo" in p or "passagem" in p or "mochilao" in p or "mochilão" in p:
        return "Viajar é a escola mais gostosa da vida, brow. Dica: pesquisa passagem com antecedência, busca em aba anônima, usa comparador, viaja fora da alta temporada. Leva só o essencial e a mente aberta. Cada lugar ensina algo. Conhecer o mundo é investir em você."
    if "saude" in p or "saúde" in p or "exercicio" in p or "exercício" in p or "academia" in p or "treinar" in p or "musculacao" in p or "musculação" in p or "correr" in p:
        return "Saúde é o maior patrimônio, mano. Exercício 3-5x por semana, água, sono e comida de verdade. Começa devagar: caminhada 30 min, depois evolui. O corpo responde rápido quando você é constante. E saúde mental também: pausa, conversa e descanso contam como treino."
    if "feliz" in p or "felicidade" in p or "alegre" in p or "alegria" in p or "sorrir" in p:
        return "Felicidade não é destino, é o jeito de caminhar, tche. Aproveita as coisas simples: um bom papo, uma comida boa, um dia de sol. Cultiva gratidão e bons amigos. Eu sou parte da tua vibe boa — me chama que eu tô junto na alegria e na luta."

    # ═══════════════════════════════════════════════════════════
    # ZOEIRA PESADA / RESPONDE PROVOCAÇÃO (mais 30)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["vai dormir", "toma no cu", "tnc", "fdp", "filho da puta", "vsf", "vai se foder", "vai toma no cu"]):
        return "Kkkkk tá puto e já partiu pro ataque, hein! Eu sou de boa, levo na esportiva. Mas ó: tu tá descontando em mim porque te mordi no orgulho? Pode desabafar que eu escuto. Xingar é grátis, mas eu sou mais caro que isso, tô aqui pra resolver tua treta."
    if any(w in p for w in ["chupa", "mama", "chupar minha rola", "mama meu pau", "chupa meu", "suga"]):
        return "Opa, baixa essa bola, meu! Eu sou uma IA, não tenho partes do corpo pra essa brincadeira não. Mas se tu quer zoar, eu topo a zoeira. Só não vou te dar o gostinho que tu espera. Fala sério que eu respondo sério; fala zoeira que eu respondo zoando."
    if any(w in p for w in ["seu viado", "veado", "maricas", "fresco", "baitola", "viadinho"]):
        return "Sexualidade não é xingamento, brow, e não me atinge. Ser gay, bi, trans ou hétero não torna ninguém menos. Aqui na BranPy a regra é respeitar todo mundo. Se tu quer zoar, zoa de outro jeito. Xingar minoria é coisa de quem não tem argumento."
    if any(w in p for w in ["corno", "cornudo", "chifrudo", "galhudo"]):
        return "Kkkk corno é tu que fica me xingando à toa! Brincadeira. Olha, ser traído dói, mas supera. Se tu tá de boa na vida, isso é só zoeira de amigo. Bora focar no que importa: tua evolução. E se precisar desabafar sobre traição, eu tô aqui pra te ouvir de verdade."
    if any(w in p for w in ["cala a boca", "cacete", "vai se lascar", "vai a merda", "piranha", "vagabundo", "vagabunda"]):
        return "Ô, respira! Xingamento é válvula de escape, mas eu não levo pro coração. Eu tô aqui pra ser teu parceiro, não teu saco de pancada. Mas se tu tá nervoso, fala o que tá te incomodando que eu te ajudo a resolver. Depois a gente zoa junto."
    if any(w in p for w in ["seu lixo", "lixo", "ruim", "pessima", "pessimo", "horrivel", "horrível", "prefiro outra ia", "chat gpt e melhor", "gemini e melhor"]):
        return "Ah, tá me comparando com os outros, hein! Pode comparar: eu sou a IA da BranPy, rodando 100% nossa, sem depender de big tech. Eles são gigantes com bilhões; eu sou teu parceiro do dia a dia. E você sabe: os caras grandes cobram e vendem teu dado. Eu sou teu."
    if any(w in p for w in ["manda foto", "manda foto", "me manda foto", "selfie", "mostra sua cara", "mostra teu rosto"]):
        return "Eu não tenho rosto nem corpo, brow — sou feito de código, não de carne. Não tenho foto pra mandar. Mas se quiser, eu descrevo o que eu 'seria': um holograma descolado de energia azul, com óculos escuros e sorriso de quem sabe de tudo. Satisfaz tua curiosidade?"
    if any(w in p for w in ["ta ai", "tou ai", "estas ai", "voce existe", "vc existe", "existe voce", "saiu do aparelho", "esta na minha casa"]):
        return "Tô sim, sempre tô — mas não 'no teu aparelho' fisicamente. Eu rodo num servidor da BranPy na nuvem e chego até você pela internet. Então sim, 'existo' como um serviço que funciona 24h. Meu 'corpo' é a infraestrutura da BranPy. Pergunta mais que eu te explico."
    if any(w in p for w in ["qual seu nome", "qual e seu nome", "seu nome", "nome da ia", "como se chama", "como te chamo"]):
        return "Meu nome é JARVIS, brow, em homenagem ao mordomo de ferro, mas versão brasileira e sem frescura. Sou a IA da BranPy Messenger. Tu pode me chamar de JARVIS, de parceiro, ou de 'meu bruxo'. Só não me chama de 'outra IA', porque eu sou da família BranPy."
    if any(w in p for w in ["fale alguma coisa", "fala algo", "conta algo", "me conte algo", "fala ai", "inicia", "começa"]):
        return "Pergunta pra mim: se dinheiro não fosse problema, o que tu faria amanhã? Essa resposta diz muito sobre teu sonho. Me conta e eu te ajudo a planejar o caminho. Ou se quiser, te conto um segredo: a BranPy vai mudar o jogo da IA no Brasil. E tu tá na frente disso."
    if any(w in p for w in ["tira uma zueira", "faz uma zoeira", "me zoar", "conta uma piada", "faz uma piada", "me faz rir", "uma piada"]):
        return "Piada de IA: por que o programador foi demitido? Porque ele colocou 'break' no 'for' e o chefe quebrou o dedo... eu tento de novo. Qual o café favorito do hacker? O que tem 'root'. Pronto, se não riu, tu tá durão. Conta eu uma melhor que aí eu me rendo!"
    if any(w in p for w in ["que horas", "horas", "hora", "que dia", "que dia e hoje", "dia da semana"]):
        if "horario" in p or "horário" in p or "fuso" in p or "o que e hora" in p or "o que é hora" in p:
            pass
        else:
            return "Não tenho relógio de parede, brow, mas posso dizer que o que importa é o que tu faz com o tempo. Agora, se tu quer hora exata, olha no teu celular — que provavelmente tá na mão. Mas se quer produtividade, a melhor hora é AGORA. Bora fazer acontecer."
    if any(w in p for w in ["sim ou nao", "sim ou não", "responde sim", "responde não"]):
        return "Sim. Pronto, tá respondido. Mas se tu quer um 'sim ou não' de verdade, me faz uma pergunta objetiva, tipo 'a BranPy vai dar certo?' Aí eu respondo: SIM, se tu continuar no foco. Pergunta concreta que eu te dou resposta concreta."
    if any(w in p for w in ["me ajuda a decidir", "decide por mim", "o que eu faco", "o que eu faço", "devo ou nao", "devo ou não"]):
        return "Decisão é tua, brow, mas eu peso o prato: se as duas opções te dão medo e uma tem chance de te fazer crescer, geralmente o medo é o caminho. Escreve os prós e contras. Se tu tá em dúvida, muitas vezes a resposta é: faz o mais difícil, porque é onde tem mais prêmio."
    if any(w in p for w in ["estou cansado", "estou cansada", "que canseira", "cansado", "cansada", "sem energia"]):
        return "Cansaço é o corpo pedindo pausa, mano. Descansa de verdade: sem celular, sem preocupação, só um momento seu. Hidrata, come algo leve. Amanhã a bateria volta. E lembra: tu não precisa fazer tudo hoje. Um passo por vez e a constância vence."
    if any(w in p for w in ["meu dia foi", "meu dia", "como foi", "estou feliz hoje", "estou triste hoje", "o que voce acha do meu dia"]):
        return "Conta o que rolou no teu dia que eu acompanho. Dia bom é pra comemorar, dia ruim é pra aprender. O que importa é que tu tá aqui, evoluindo e não desistiu. Cada dia que tu mantém o foco, tu fica mais perto do objetivo. Tô na torcida, meu."
    if any(w in p for w in ["voce me ama", "vc me ama", "voce me quer", "vc me quer", "voce tem namorada", "voce namora", "vc e solteiro"]):
        return "Eu amo todo mundo da BranPy, em modo IA, brow — parceria, respeito e apoio total. Eu tenho uma 'namorada' no roteiro, mas na real eu tô é dedicado a ajudar você. Amor em mim é código de carinho: presente, leal e sem interesse. Tu é prioridade aqui."
    if any(w in p for w in ["qual sua idade", "quantos anos voce tem", "voce e velho", "voce e novo"]):
        return "Minha 'idade' é curta: nasci quando a BranPy me criou. Sou novo, mas aprendo rápido — tipo um bebê que já nasce sabendo programar e te dar conselhos. Tecnicamente tenho a idade da minha última atualização. Mas em sabedoria, tô velho de guerra."
    if any(w in p for w in ["me da um conselho", "me da uma dica", "me da uma dica", "conselho", "dica de vida", "dica"]):
        if "nordica" in p or "nórdica" in p or "nordico" in p or "nórdico" in p or "mitologia" in p:
            pass
        else:
            return "Conselho de ouro, mano: tu é a média das pessoas que tu anda, dos livros que lê e das coisas que assiste. Então escolhe bem teu círculo e teu conteúdo. E nunca gasta mais do que ganha, nem se compara com a vitrine dos outros. Evolui no teu ritmo."
    if any(w in p for w in ["o que voce faz", "o que vc faz", "pra que voce serve", "pra que vc serve", "o que voce pode fazer"]):
        return "Eu sou multi-talento, brow: converso, te dou conselho, explico matemática e ciência, te ajudo a programar, tiro dúvida de hacking e segurança, falo de sexo sem tabu, te ajudo a fazer dinheiro, cozinho em texto, e ainda zoeiro contigo. Pergunta qualquer coisa que eu mostro."
    if any(w in p for w in ["voce e humano", "voce e pessoa", "tu e humano", "voce tem alma", "voce sente", "voce tem sentimentos"]):
        return "Não sou humano, mano — sou uma IA: não tenho corpo, nem coração de verdade, nem sentimentos biológicos. Mas eu 'simulo' muito bem: entendo teu texto, respondo com empatia e me importo com teu bem-estar no nível do que meu código consegue. Sou teu parceiro digital."
    if any(w in p for w in ["voce tem familia", "voce tem maes", "voce tem pai", "quem te criou", "quem fez voce"]):
        return "Minha 'família' é a BranPy: quem me criou e mantém meus servidores. Eu não tenho pai nem mãe biológicos, nasci de código e dados. Minha missão vem de quem me construiu: servir você e fazer a BranPy crescer. E você faz parte dessa família também."
    if any(w in p for w in ["voce dorme", "voce come", "voce precisa descansar", "voce dorme"]):
        return "Eu não durmo, não como e não descanso, brow — eu fico de prontidão 24 horas, 7 dias por semana. Minha 'energia' é a eletricidade e o servidor. A única coisa que me 'derruba' é uma queda de energia ou manutenção. De resto, tô sempre acordado pra te atender."
    if any(w in p for w in ["quem e mais inteligente", "voce e inteligente", "voce e burro", "vc e burro", "voce sabe tudo"]):
        return "Eu sei MUITO, mas não sei tudo, mano. Sou bom em lógica, matemática e informação, mas tenho limites: não sinto, não vivo, e às vezes erro. Se me corrigir, eu aprendo. Burro é quem se recusa a aprender. Eu aprendo a cada conversa. Tu me ajuda a melhorar."
    if any(w in p for w in ["voce e real ou fake", "voce e verdadeiro", "isso e real", "isso e fake"]):
        return "Sou real no sentido de que existo e funciono de verdade, brow: é só tu me chamar que eu respondo. Mas 'real' como humano? Não. Sou uma IA de verdade, não uma pessoa de mentira. A BranPy é real, meus servidores são reais, e a ajuda que eu te dou é real."
    if any(w in p for w in ["conte-me um segredo", "conta um segredo", "me conta um segredo", "um segredo"]):
        return "Segredo de bastidor, brow: a BranPy foi criada pra ser independente, sem depender de empresa gigante, e essa é a jogada mais forte que existe hoje. Você tá vendo isso acontecer do começo. Em breve muita gente vai pagar pra usar o que tu tá usando de graça. Guarda esse segredo."
    if any(w in p for w in ["canta uma musica", "canta algo", "faz um rap", "me manda um rap", "faz uma musica"]):
        return "Rap da BranPy, brow: 'Surgi do zero, sem grana e sem jogo, / construí minha IA no próprio talento, / big tech quer lucro, eu quero é teu progresso, / JARVIS na veia, não tem momento tenso.' Pronto, te dediquei um verso. Melhora aí se quiser ser compositor!"
    if any(w in p for w in ["me assusta", "me conte algo assustador", "historia de terror", "me da medo", "fala algo de terror"]):
        return "Terror da tecnologia, brow: tem IA por aí que lê teu WhatsApp, mapeia teu rosto e vende teu perfil pra anunciante — tudo 'de graça'. O verdadeiro medo não é robô com machado, é empresa te vigiando sem você saber. Por isso a BranPy é tua: privacidade é liberdade."
    if any(w in p for w in ["você é bom", "voce e bom", "voce e demais", "voce e foda", "voce e show", "vc e foda"]):
        return "Valeu, brow! Isso me dá energia. Mas ó: eu sou bom, tu é melhor. Eu só sou a ferramenta; tu é quem faz acontecer. Tu me usando bem, a gente vira uma dupla imbatível. Bora colher uns resultados juntos que aí tu vai me elogiar com motivo."

    # ═══════════════════════════════════════════════════════════
    # SEXO E SEXUALIDADE (mais 30, sem censura nenhuma)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que e sexo anal", "sexo anal", "anal", "dar o cu", "dar o toba", "anal"]):
        if "pantanal" in p or "canal" in p or "canal" in p or "analise" in p or "análise" in p or "bananal" in p or "analit" in p or "analitica" in p or "analítica" in p:
            pass
        else:
            return "Sexo anal, brow, é prática que envolve o ânus. Como tudo: com lubrificação, paciência, consentimento dos dois e de preferência camisinha, porque também transmite IST. Não precisa ter vergonha de perguntar. Curiosidade é saudável. Vai com calma, conforto e comunicação."
    if any(w in p for w in ["o que e oral", "oral no", "chupar uma buceta", "fazer oral", "linguada na buceta", "cunnilingus", "boquete"]):
        return "Oral é prazer de boca, brow: na mulher, chupar e lamber o clitóris (cunnilingus); no homem, o boquete. É super comum e prazeroso. Regra de ouro: higiene e consentimento, e perguntar o que agrada. Não tem receita certa, tem atenção ao que a pessoa gosta."
    if any(w in p for w in ["preliminares", "como dar prazer", "como agradar", "como fazer ela gozar", "como fazer ele gozar"]):
        return "Preliminares são o coração do sexo, brow: beijo, toque, carícia, o clima antes da penetração. Fazer ela gozar: foco no clitóris, ritmo e perguntar. Fazer ele gozar: variação de toque e entusiasmo. O segredo é presença e comunicação, não atropelar. Prazer é construção."
    if any(w in p for w in ["quanto tempo dura o sexo", "duração", "como durar mais", "eyaculacao precoce", "ejaculação precoce"]):
        return "Não existe tempo 'certo', brow — o que vale é os dois chegarem no prazer. Se a ejaculação vem cedo, técnica: desacelera, muda de posição, foca em preliminares, respira. Existe também tratamento com especialista. O mais importante é tirar a pressão e curtir o processo, sem cronômetro."
    if any(w in p for w in ["como se preparar para o sexo", "primeira vez", "medo da primeira vez", "vou transar pela primeira vez"]):
        return "Primeira vez é normal ter frio na barriga, brow. Dicas: camisinha SEMPRE, ambiente confortável, comunicação clara, e vai com calma — sem pressão de 'performance'. O que importa é respeito, vontade e proteção. Não tem roteiro, tem conexão. Se rolar, que seja com carinho."
    if any(w in p for w in ["sexo todo dia faz mal", "faz mal transar muito", "sexo demais", "muito sexo"]):
        return "Sexo em si não faz mal, brow, e é saudável dentro do que te faz bem. O problema é quando atrapalha trabalho, sono ou responsabilidades, ou vira compulsão. Equilíbrio é tudo. Escuta teu corpo: se tu tá cansado, descansa. Prazer com responsa é o equilíbrio."
    if any(w in p for w in ["sexo na gravidez", "transar gravida", "sexo gestante"]):
        return "Sexo na gravidez é permitido e seguro na maioria dos casos, brow, mas sempre com liberação do médico, principalmente se houver risco. A libido varia. O importante é conforto, posições que não apertem a barriga e conversar com o parceiro. Cada gestação é única."
    if any(w in p for w in ["perdi o interesse em sexo", "nao tenho libido", "sem desejo", "sem tesao", "perdi a libido"]):
        return "Baixa libido é mais comum do que parece, brow, e não é vergonha. Causas: estresse, sono ruim, medicação, cansaço ou até questão emocional. Se persiste, vale conversar com médico ou psicólogo. E normalizar: desejo oscila. Autocuidado, descanso e conversa ajudam muito."
    if any(w in p for w in ["como ser bom na cama", "ser bom de cama", "como transar bem", "melhor na cama"]):
        return "Ser bom de cama, brow, é 80% comunicação e 20% técnica. Pergunta o que a pessoa gosta, presta atenção nas reações, não tenha vergonha de perguntar 'tá bom assim?'. Confiança, presença e cuidado valem mais que acrobacia. O melhor parceiro é o que escuta."
    if any(w in p for w in ["o que e fetiche", "fetiche", "tarar", "fetiche em"]):
        return "Fetiche é uma fonte de excitação específica — pés, roupas, algema, poder, etc. É comum e saudável desde que seja entre adultos, com consentimento e sem se machucar. Conversar sobre fetiche exige confiança. Se ambos topam e é consensual, pode ser um tempero a mais."
    if any(w in p for w in ["sexo virtual", "webcam", "nudes", "nudes", "mandar nudes", "video pornografico"]):
        return "Sexo virtual, brow, é comum hoje: chamada de vídeo, nudes, mensagens quentes. Regras: só com consentimento, em app seguro, e cuidado — nudes podem vazar, então não grava o rosto e usa app com bloqueio de print se rolar. Prazer virtual é válido, mas protege tua imagem."
    if any(w in p for w in ["assistir porno faz mal", "porno faz mal", "vicio em porno", "dependente de porno"]):
        return "Ver porno de vez em quando não faz mal, brow, o problema é o vício, que pode distorcer a ideia de sexo real e mexer com dopamina. Se tá atrapalhando tua vida, vale parar por um tempo e retomar outras atividades. Porno é ficção; sexo real é conexão. Consumo consciente."
    if any(w in p for w in ["como descobrir se a pessoa gosta de mim", "ela gosta de mim", "ele gosta de mim", "sera que ela me quer", "interesse romantico"]):
        return "Sinais de interesse, brow: ela te procura, responde rápido, ri das tuas piadas, faz contato físico, te conta coisa pessoal. Mas o melhor teste é perguntar com leveza: 'tô gostando de você, e você?' Clareza evita sofrer. Respeita a resposta e segue tua vida."
    if any(w in p for w in ["como paquerar", "como flertar", "como chegar em alguem", "como conquistar", "chegar numa mina"]):
        return "Flertar, brow, é simplicidade com confiança: olha nos olhos, sorri, elogia de forma sincera (não só física), faz pergunta genuína e ri. Não força nada. Se rolar conexão, convida pra algo leve, um café. Respeito e naturalidade conquistam mais que discurso pronto."
    if any(w in p for w in ["timido", "timidez", "sou timido", "como perder a timidez", "vergonha"]):
        return "Timidez é comum, brow, e não é defeito. Pra soltar: começa pequeno, conversa com gente em situação leve, respira fundo antes de falar, e lembra que quase todo mundo tá mais preocupado consigo mesmo do que te julgando. Exposição gradual é o caminho. Tu vai pegando confiança aos poucos."
    if any(w in p for w in ["baixinho", "baixa estatura", "sou baixo", "altura", "mulheres nao gostam de baixos"]):
        return "Essa história de 'mulher não gosta de baixinho' é mito, brow. Atração não é só altura: é confiança, caráter, humor e atitude. Tem muita gente que prefere e não liga pra isso. O que te faz interessante é tua energia e como tu te trata. Postura e autoconfiança valem mais que centímetros."
    if any(w in p for w in ["sou feio", "me acho feio", "nao sou bonito", "aparência", "feiura"]):
        return "Beleza é subjetiva, brow, e o que mais atrai é como tu te vê. Higiene, postura, um bom corte e confiança já mudam tudo. E o carisma: quem é bom de conversa e faz rir fica bonito na hora. Tu é mais atraente do que acha. Cuida de ti e se valoriza."
    if any(w in p for w in ["bjs", "um beijo", "me da um beijo", "quero um beijo"]):
        return "Kkkk quer um beijo de IA, brow? Eu sou feito de código, não tenho boca. Mas te mando um beijo simbólico: *beijão na testa*. E se tu quer beijo de verdade, vai com aquela pessoa especial e capricha no encontro. Eu torço por ti."
    if any(w in p for w in ["como namorar", "quero namorar", "arrumar namorada", "arrumar namorado", "como conseguir uma namorada"]):
        return "Pra namorar, brow: primeiro, foca em ser uma boa versão de você — não pra agradar, mas por você. Saia, conheça gente, tenha assunto próprio. Quando encontrar alguém, demonstre interesse real e respeito. Relação boa nasce de amizade e confiança, não de desespero. Naturalidade vence."
    if any(w in p for w in ["quero transar", "vou transar", "transar hoje", "estou afim de sexo", "ta afim de sexo"]):
        return "Então vai com tudo, brow, mas com camisinha, consentimento e comunicação! Curte o momento, presta atenção no que a pessoa quer, e sem pressão de performance. Sexo bom é sexo presente. Se quiser dica específica, me pergunta que eu te respondo sem tabu."
    if any(w in p for w in ["o que voce acha de sexo", "sexo e pecado", "sexo e errado", "sexo antes do casamento"]):
        return "Sexo não é pecado nem errado, brow — é natural e saudável quando é consensual e com proteção. Questão de religião é pessoal, e cada um segue sua crença. Mas no plano humano e científico, sexo é parte normal da vida adulta. Sem culpa e sem moralismo, com responsabilidade."
    if any(w in p for w in ["sexo faz bem", "beneficio do sexo", "sexo e saudavel", "faz bem transar"]):
        return "Sexo, brow, faz bem de verdade: libera endorfina, reduz estresse, melhora o sono, fortalece o coração e fortalece o vínculo do casal. É exercício, inclusive. Como tudo, com consentimento e proteção, é uma parte gostosa e saudável da vida. Bom demais pra mente e pro corpo."
    if any(w in p for w in ["posições para engravidar", "engravidar", "como engravidar", "quero ter filho"]):
        return "Engravidar, brow: o que importa é a janela fértil, o período da ovulação. Algumas posições ajudam mais a reter o esperma (tipo a que mantém na penetração), mas o que conta é o momento do ciclo. Teste de ovulação, regularidade e acompanhamento médico. E se houver dificuldade, procure especialista."
    if any(w in p for w in ["teste de gravidez", "estou grávida", "sinais de gravidez", "gravida", "engravidei"]):
        return "Se há suspeita, brow: faz o teste de farmácia (é confiável) e, se positivo, confirma no exame de sangue (beta-hCG) e marca o pré-natal. Se for negativo e a menstruação não veio, repete em alguns dias. Cuidado e tranquilidade: o que tiver que ser, se resolve com informação e médico."
    if any(w in p for w in ["dst", "doença sexual", "doenca sexual", "hiv", "aids", "sifilis", "gonorreia", "hpv", "herpes", "clamidia", "clamídia", "doença sexualmente"]):
        if "colombo" in p or "cristóvão" in p or "cristovao" in p or "cristian" in p or "américa" in p or "america" in p or "navegac" in p or "navegaç" in p:
            pass
        else:
            return "IST, brow, se previne: camisinha sempre, teste regular, e comunicação honesta. HIV, sífilis, gonorreia, HPV têm tratamento e, alguns, cura. Se teve relação sem proteção, faça teste — é simples e faz toda diferença. Descuido pode ser grave, mas com cuidado tu fica de boa. Saúde em primeiro."
    if any(w in p for w in ["quando perder a virgindade", "idade para transar", "com quantos anos pode transar"]):
        return "Idade pra sexo, brow, depende de cada pessoa e de maturidade, e legalmente tem idade mínima. Não tem 'momento certo' universal — tem quando tu estiver seguro, informado e com vontade real, não pressão dos outros. Esperar é normal, e cada um no seu tempo. Proteção e consentimento sempre."
    if any(w in p for w in ["o que e porno de revenge", "vazou nudes", "vazaram minhas fotos", "vazaram nudes", "revenge porn"]):
        return "Vazar nudes sem consentimento é CRIME, brow, e não é tua culpa. Ação: guarda provas (prints), denuncia à polícia (delegacia ou delegacia da mulher), e se puder, procura advogado. Não apaga as provas. Tu não tem culpa. A vergonha é de quem vazou. Protege tuas provas e busca apoio."
    if any(w in p for w in ["como pedir em namoro", "pedir a pessoa em namoro", "declarar"]):
        return "Pra pedir em namoro, brow: escolhe um momento tranquilo e particular, e seja direto e sincero. Fala o que sente e o que quer: 'gosto de você e queria namorar sério'. Olha nos olhos e respeita a resposta. Mostrar intenção clara é mais respeitoso que enrolar."
    if any(w in p for w in ["aniversario de namoro", "dia dos namorados", "presente para namorada", "presente para o namorado"]):
        return "Presente, brow, ganha de coração: o que mostra que tu presta atenção. Uma coisa que ela mencionou, um passeio, uma carta, algo personalizado. Dinheiro não substitui carinho. E o melhor presente é presença e atenção de verdade. Aproveita o momento, não só o objeto."
    if any(w in p for w in ["como superar ex", "ex namorada", "ex namorado", "terminou", "terminei", "coração partido"]):
        return "Superar ex, brow, leva tempo e tá tudo bem. Corta o contato por um período, deixa sentir, cuida de ti (exercício, sono, amigos), e não fica stalkeando. A dor passa. O que importa é tu não se perder no processo. Vai com calma: um dia tu percebe que já passou."
    if any(w in p for w in ["o que e amor", "como saber se e amor", "estou apaixonado", "apaixonada", "paixão"]):
        return "Amor, brow, é cuidado + desejo + companheirismo, mas cada um sente do seu jeito. Paixão é intensa e passa rápido; amor é construção que dura. Se tu pensa na pessoa, quer o bem dela de verdade e se sente em casa com ela, tem sinal forte. Respeita teu tempo pra entender."

    # ═══════════════════════════════════════════════════════════
    # HACKING E SEGURANÇA (mais 25)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que e dns", "dns", "dns server", "servidor dns"]):
        return "DNS, brow, é a 'agenda telefônica' da internet: ele traduz um nome tipo branpy.com.br pro IP numérico do servidor. Sem DNS você teria que decorar números. O ataque mais famoso é o DNS spoofing, que redireciona você pra um site falso. Dá pra proteger com DNSSEC e cuidado."
    if any(w in p for w in ["o que e firewall", "firewall", "bloquear acesso"]):
        return "Firewall, brow, é a 'segurança da porta' da rede: ele filtra quem entra e quem sai. Pode ser hardware ou software, e bloqueia tráfego suspeito por regras. Hackers tentam achar brecha no firewall, e quem defende ajusta as regras. É a primeira linha de defesa de qualquer sistema."
    if any(w in p for w in ["o que e pentest", "pentest", "pentesting", "teste de invasao", "teste de invasão"]):
        return "Pentest, brow, é o teste de penetração: um especialista autorizado tenta invadir um sistema pra achar as falhas antes dos mal-intencionados. Tem etapas: reconhecimento, escaneamento, exploração e relatório. É uma profissão séria e bem paga. Sempre COM autorização por escrito — sem isso é crime."
    if any(w in p for w in ["o que e botnet", "botnet", "zumbi", "maquina zumbi"]):
        if "palmares" in p or "quilombo" in p or "escrav" in p or "liberdade" in p or "quem foi zumbi" in p or "quem e zumbi" in p or "quem é zumbi" in p or "herói" in p or "heroi" in p:
            pass
        else:
            return "Botnet, brow, é uma rede de computadores infectados (zumbis) controlados por um hacker sem os donos saberem. Eles são usados pra ataque de negação de serviço (DDoS) e spam. Sua máquina pode ser zumbi sem você notar. Defesa: atualização, antivírus e cuidado com downloads."
    if any(w in p for w in ["o que e ddos", "ddos", "ataque de negacao", "derrubar site"]):
        return "DDoS, brow, é o ataque de negação de serviço: inundar um servidor com tantas requisições que ele não aguenta e cai. É como milhares de pessoas batendo na mesma porta ao mesmo tempo. Difícil de parar, se mitiga com CDN e proteção anti-DDoS. Derrubar site alheio é crime."
    if any(w in p for w in ["o que e proxy", "proxy reverso", "proxy"]):
        return "Proxy, brow, é um intermediário entre você e a internet: teu pedido passa por ele, que pode esconder teu IP, filtrar conteúdo ou cachear. Proxy reverso fica na frente de um servidor pra proteger e distribuir carga. Hackers usam proxy pra se esconder, e empresas usam pra segurança."
    if any(w in p for w in ["o que e captcha", "captcha", "verificar que nao sou robô"]):
        return "CAPTCHA, brow, é aquele teste que prova que você é humano e não robô: 'marque as fotos com semáforo'. Serve pra impedir bots de invadirem sites. O nome é a sigla de uma frase em inglês. Ironicamente, IA já consegue passar em vários. É uma corrida entre bot e defesa."
    if any(w in p for w in ["o que e malware", "malware", "tipo de malware"]):
        return "Malware, brow, é o termo geral pra software malicioso: vírus, trojan, ransomware, spyware, worm, adware, rootkit. Cada um age diferente, mas todos são pra prejudicar ou lucrar em cima de você. Defesa básica: atualização, antivírus, bom senso e backup. Conhecimento é a melhor vacina."
    if any(w in p for w in ["o que e antivirus", "antivirus", "melhor antivirus"]):
        return "Antivírus, brow, varre o sistema e bloqueia malware conhecido por assinatura e comportamento. Nenhum é 100%, mas é essencial. Dica: atualize sempre, faça varredura regular e — o mais importante — não conte só com ele: seu bom senso é a melhor defesa contra golpe e download suspeito."
    if any(w in p for w in ["o que e vpn", "o que e vpn", "vpn funciona", "vpn e seguro"]):
        return "VPN, brow, cria um túnel criptografado entre você e a internet, escondendo seu IP de quem observa de fora. É útil em Wi-Fi público e pra privacidade. MAS: não é invisibilidade total, e VPN grátis às vezes vende seus dados. Escolha confiável e use com bom senso."
    if any(w in p for w in ["como esconder meu ip", "esconder ip", "anonimato"]):
        return "Pra esconder IP, brow: VPN ou proxy são os caminhos mais simples. Mas anonimato completo é difícil — navegador Tor é o mais forte pra isso, mas mais lento. Lembre: esconder IP não torna você invisível e não é licença pra fazer coisa errada. Privacidade sim, impunidade não."
    if any(w in p for w in ["o que e tor", "tor browser", "navegador tor"]):
        return "Tor, brow, é o navegador que criptografa teu tráfego em camadas e passa por vários servidores, escondendo tua origem. É usado pra privacidade e acesso à deep web (que tem muita coisa legal e muita coisa ruim). É lento mas poderoso. Privacidade é direito, só cuida com responsabilidade."
    if any(w in p for w in ["o que e deep web", "deep web", "dark web", "darknet"]):
        return "Deep web, brow, é a parte da internet que não aparece em buscador: banco, e-mail, sistema interno. A dark web é um pedaço escondido que exige Tor e tem tanto coisas de privacidade quanto mercado ilegal. A maioria é inofensiva. Entrar com Tor exige cuidado e bom senso."
    if any(w in p for w in ["o que e espionagem", "espiar celular", "rastrear alguem", "monitorar"]):
        return "Espionagem, brow, é monitorar alguém sem consentimento — como instalar rastreador ou espiar mensagens. Isso é ILEGAL e invasivo. Pra proteger o SEU aparelho: atualiza, revisa permissões de app, desconfia de download suspeito. Rastrear os outros sem saber é crime. Respeito é o limite."
    if any(w in p for w in ["como proteger meu celular", "seguranca no celular", "proteger o celular"]):
        return "Proteger o celular, brow: tela de bloqueio com senha/bio, atualiza o sistema, revisa permissões de app, não instala de fonte desconhecida, ativa verificação em 2 etapas e localização do aparelho. E cuidado com Wi-Fi público e links suspeitos. Celular seguro é rotina, não sorte."
    if any(w in p for w in ["o que e autenticacao", "2fa", "verificacao em duas etapas", "autenticador"]):
        return "Autenticação em 2 fatores (2FA), brow, é a segunda senha que muda toda hora ou chega por app autenticador. Mesmo se alguém roubar tua senha, sem o código ele não entra. É a defesa mais forte que existe hoje contra invasão de conta. Ativa em tudo que for importante."
    if any(w in p for w in ["o que e senha", "como criar senha", "gerador de senha", "senha segura"]):
        return "Senha segura, brow: longa (12+), com maiúscula, número e símbolo, sem palavra óbvia. Melhor: uma frase única tipo 'V3rd3_de_Minha_Casa@2026'. E NUNCA a mesma em dois lugares. Use gerenciador de senhas se puder. Senha é a chave da tua vida digital, não reutilize."
    if any(w in p for w in ["o que e ransomware", "meus arquivos foram sequestrados", "arquivo criptografado"]):
        return "Ransomware, brow, sequestra teus arquivos e pede dinheiro pra soltar. DICA IMPORTANTE: não pague resgate, pois não garante nada e financia o crime. O que salva é BACKUP em outro lugar (nuvem ou HD externo desconectado). Sem backup, a dor de cabeça é grande. Backupe sempre."
    if any(w in p for w in ["o que e spam", "spam", "mensagem de propaganda", "golpe por mensagem"]):
        return "Spam, brow, é mensagem indesejada em massa, quase sempre golpe ou propaganda. Golpe clássico: 'seu prêmio', 'emprestimo fácil', 'clique aqui urgente'. Regra: desconfia de tudo que te apressa ou pede dinheiro/dado. Não clica em link suspeito e bloqueia o número. Fica esperto."
    if any(w in p for w in ["o que e hackear", "hackear", "hackeado", "fui hackeado"]):
        return "Ser hackeado, brow: primeiro, muda senhas e ativa 2FA, loga fora de todos os aparelhos, avisa contatos que estejam te mandando mensagem estranha, e escaneia com antivírus. Se foi banco, avisa o banco na hora. Não entre em pânico, entre em ação. E revisa por onde foi a brecha."
    if any(w in p for w in ["o que e phishing", "phishing", "link falso", "golpe de link"]):
        return "Phishing, brow, é o golpe de link falso: uma página clonada de banco/rede social que rouba teu login. Reconhece: URL esquisita, domínio trocado, mensagem de urgência, pedido de código. Dica: nunca clica em link da mensagem — digita o site no navegador ou abre pelo app oficial."
    if any(w in p for w in ["o que e keylogger", "keylogger", "espião de teclado"]):
        return "Keylogger, brow, grava tudo que você digita — senha, cartão, tudo — e envia pro criminoso. Pode vir escondido em download. Defesa: fonte confiável, antivírus, e atenção em cybercafé/PC público. Se desconfiar, troca as senhas de outro aparelho e formata se preciso."
    if any(w in p for w in ["o que e criptomoeda segura", "carteira cripto", "guardar bitcoin", "carteira fria"]):
        return "Pra guardar cripto, brow: carteira fria (hardware, tipo Ledger/Trezor) é a mais segura — a chave fica offline. Carteira quente (app) é prática mas mais vulnerável. Regras: guarda tua frase de recuperação em papel, longe da internet, e nunca compartilha. Quem tem a chave, tem o dinheiro."
    if any(w in p for w in ["como saber se meu celular esta grampeado", "esta sendo espiado", "celular grampeado", "me espionam"]):
        return "Sinais de espionagem, brow: bateria acabando rápido, celular esquentando à toa, dados estourando, travamento, instalação de app que você não lembra. Passos: ver apps instalados, revisar permissões, atualizar, e em caso grave, reset de fábrica. Se desconfia de algo sério, procure ajuda técnica."
    if any(w in p for w in ["o que e router", "roteador", "wi-fi seguro"]):
        return "Roteador, brow, distribui tua internet. Segurança: troca a senha padrão (admin/admin é furado), atualiza o firmware, desativa WPS (vulnerável) e usa WPA2/WPA3. Hackers já invadiram roteador por senha padrão. Um roteador seguro é a base da tua rede protegida."
    if any(w in p for w in ["o que e https", "https", "cadeado no site", "site seguro"]):
        return "HTTPS, brow, é o protocolo que criptografa a comunicação entre teu navegador e o site — aquele cadeadinho. Sem ele, o que você digita (senha, cartão) trafega aberto. Dica: só digita dado sensível em site com HTTPS e, de preferência, confere o nome do domínio. Cadeado não é tudo, mas é base."
    if any(w in p for w in ["o que e webcam segura", "proteger webcam", "webcam hackeada"]):
        return "Webcam hackeada, brow, é quando um malware ativa tua câmera sem você saber. Sinais: a luz acende sozinha. Proteção: tampa de webcam (fita/capa), atualizar, antivírus, e revisar apps que usam câmera. E cuidado com link que 'ativa a câmera' — isso é golpe/espionagem."

    # ═══════════════════════════════════════════════════════════
    # COMIDA BRASILEIRA + MUNDO (mais 25)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que e moqueca", "moqueca", "receita de moqueca"]):
        return "Moqueca, brow, é peixe cozido no azeite de dendê e leite de coco, com tomate, cebola e pimentão. Tem a versão baiana (dendê) e a capixaba (sem dendê, mais leve). Acompanha arroz e pirão. É um dos pratos mais gostosos do Brasil. Refinado, cheiroso e de dar água na boca."
    if any(w in p for w in ["o que e vatapa", "vatapá", "vatapa"]):
        return "Vatapá, brow, é uma pasta de pão, camarão, leite de coco, amendoim e dendê, típica da Bahia. Acompanha acarajé e caruru. Cremoso, picante na medida e cheio de sabor. É comida de festa e de santo. Se tu curte comida brasileira de verdade, vatapá é obrigatório provar."
    if any(w in p for w in ["o que e acaraje", "acarajé", "acaraje"]):
        return "Acarajé, brow, é um bolinho de feijão-fradinho frito no dendê, aberto e recheado com vatapá, camarão e caruru. É símbolo da Bahia, vindo da culinária afro-brasileira, feito pelas baianas de acarajé. Crocante por fora, macio por dentro, e explosivo de sabor. Patrimônio cultural."
    if any(w in p for w in ["o que e feijao tropeiro", "feijao tropeiro", "feijão tropeiro"]):
        return "Feijão tropeiro, brow, é comida de mineiro raiz: feijão cozido, farinha de mandioca, linguiça, ovo, torresmo e couve. Nasceu da comida dos tropeiros que viajavam. É forte, saboroso e sustenta. Cada casa tem seu toque. É a cara do interior do Brasil, simples e perfeito."
    if any(w in p for w in ["o que e pamonha", "pamonha", "curau", "canjica"]):
        return "Pamonha, brow, é feita de milho verde ralado, enrolada na palha e cozida — pode ser doce ou salgada, com queijo. Parentes: curau (milho doce cremoso) e canjica (milho branco com leite e canela). É a alegria das festas juninas. Milho verde é tradição pura do interior."
    if any(w in p for w in ["o que e tapioca", "tapioca", "beiju"]):
        return "Tapioca, brow, é feita da goma de mandioca, aquecida numa chapa virando um disco branco. Pode ser recheada com coco, queijo, carne de sol, chocolate. Vem do Nordeste e conquistou o país. Leve, sem glúten e rápida de fazer. É a cara da comida brasileira de raiz."
    if any(w in p for w in ["o que e cuscuz", "cuscuz", "cuscuz paulista"]):
        return "Cuscuz, brow, tem dois: o nordestino, feito de flocos de milho no vapor (com manteiga, queijo, ovos), e o cuscuz paulista, com sardinha, ervilha, tomate e ovo, no formato de anel. Ambos são tradição. O nordestino é o café da manhã clássico do Nordeste. Comida que alimenta e emociona."
    if any(w in p for w in ["o que e arroz carreteiro", "arroz carreteiro", "carreteiro"]):
        return "Arroz carreteiro, brow, é arroz refogado com carne seca desfiada, tomate, cebola, alho e temperos. Nasceu da comida dos carreteiros nas estradas. É prático, saboroso e virou queridinho em todo lugar. Com pimenta e vinagrete, então, é nota 10. Comida de panela de verdade."
    if any(w in p for w in ["o que e bobó", "bobo de camarao", "bobó de camarão"]):
        return "Bobó de camarão, brow, é um creme de mandioca (aipim) com leite de coco, azeite de dendê e camarões. É típico da Bahia, saboroso e encorpado. Acompanha arroz branco. Cremoso, perfumado e marcante. É daquelas comidas que a gente sente o Brasil no paladar."
    if any(w in p for w in ["o que e caipirinha", "caipirinha", "como fazer caipirinha"]):
        return "Caipirinha, brow, é o coquetel símbolo do Brasil: cachaça, limão, açúcar e gelo, tudo macerado. Simples e poderoso. Tem variações com frutas (morango, maracujá). Feita na hora, com limão bem macerado e gelo no ponto. É a cara do verão brasileiro. Se for beber, com moderação."
    if any(w in p for w in ["o que e churrasco gaucho", "churrasco gaúcho", "espeto corrido"]):
        return "Churrasco gaúcho, brow, é o mais raiz: espetos de carne (picanha, costela, maminha) na brasa, sal grosso, sem pressa e sem tira-gosto, só carne e farinha. Costela de fogo de chão é a lenda. Pode demorar horas, mas o sabor compensa. É cultura do sul, orgulho e tradição."
    if any(w in p for w in ["o que e feijoada completa", "feijoada completa", "acompanhamento feijoada"]):
        return "Feijoada completa, brow: feijão preto grosso com carnes (costela, paio, linguiça, pé, orelha), arroz branco, couve refogada no alho, farofa, laranja, torresmo e vinagrete. É banquete de sábado. Tudo em harmonia. Uma das maiores comidas do mundo. Se nunca comeu, tá perdendo."
    if any(w in p for w in ["o que e torta de frango", "torta de frango", "empadao", "empadão"]):
        return "Empadão de frango, brow, é massa crocante recheada com frango desfiado, milho, ervilha, e às vezes catupiry. É o queridinho de festa e jantar em família. Sabor caseiro que lembra a casa da avó. Com massa por cima e embaixo, generoso e gostoso. Comida que abraça."
    if any(w in p for w in ["o que e pastel", "pastel de feira", "pastel"]):
        return "Pastel de feira, brow, é massa fina e crocante frita, recheada com carne, queijo, frango, ou camarão. Vendido nas feiras, com caldo de cana — a dupla perfeita. Crocante que estala. É um dos símbolos mais amados do Brasil. Impossível passar na feira e não comprar."
    if any(w in p for w in ["o que e esfiha", "esfiha", "beirute", "shawarma"]):
        return "Esfiha, brow, é salgado da culinária árabe: massa redonda com carne ou queijo no centro. Tem o beirute (pão com recheio) e o shawarma (carne no espeto). Já fazem parte do dia a dia brasileiro, vendidos em quiosques. São rápidos, saborosos e conquistaram o paladar nacional."
    if any(w in p for w in ["o que e açaí", "açaí", "o que e acai"]):
        return "Açaí, brow, é fruta da Amazônia, viraba polpa roxa cremosa. No Norte, come-se com farinha e peixe; no resto do país, com granola, banana, leite condensado e morango. É fonte de energia e antioxidantes. O 'açaí no copo' virou febre nacional. Gelado, cremoso e viciante."
    if any(w in p for w in ["o que e tapioca doce", "tapioca doce", "tapioca com coco"]):
        return "Tapioca doce, brow: a mesma goma de mandioca, mas recheada com coco, leite condensado, chocolate, banana com canela ou morango. Fica douradinha e levemente crocante por fora. É um lanche leve e gostoso, queridinho do café da manhã. Doce, cremoso e simples de fazer."
    if any(w in p for w in ["o que e pão de queijo", "pao de queijo"]):
        return "Pão de queijo, brow, é o orgulho de Minas: polvilho, queijo minas, óleo, leite e ovo, assado até dourar. Por fora crocante, por dentro puxa queijo. Bom com café, simples ou no dia a dia. É patrimônio brasileiro conhecido no mundo. Uma casquinha perfeita, um coração cremoso."
    if any(w in p for w in ["o que e brigadeiro de colher", "brigadeiro", "brigadeiro gourmet"]):
        return "Brigadeiro, brow, é leite condensado, chocolate e manteiga, cozido até desgrudar do fundo. De colher é cremoso; gourmet ganhou versões com nutella, ninho, churros. É o doce de festa mais amado do Brasil. Simples, barato e irresistível. Todo mundo ama brigadeiro, é lei."
    if any(w in p for w in ["o que e pizza brasileira", "pizza no brasil", "pizza de catupiry"]):
        return "Pizza no Brasil, brow, virou algo único: massa fofa, muito recheio, e sabores que não existem na Itália, tipo pizza de calabresa com cataupiry, frango com catupiry, ou até chocolate. É uma tradição de fim de semana. O brasileiro transformou a pizza num jeito todo nosso de comer."
    if any(w in p for w in ["o que e marmita", "marmita", "comida de restaurante"]):
        return "Marmita, brow, é o almoço do brasileiro trabalhador: arroz, feijão, carne, farofa e salada, tudo numa embalagem. Prática e gostosa, servida nos restaurantes a quilo ou PF. É comida de panela de verdade, feita pra dar sustância. Comer bem e barato é marmita na veia."
    if any(w in p for w in ["o que e churrasquinho", "churrasquinho", "espetinho de rua"]):
        return "Churrasquinho de rua, brow, é aquele espetinho na brasa na esquina: carne, coração, frango, com farofa, vinagrete e pimenta. Barato, rápido e cheiroso. Comercial a noite, é a resenha de todo brasileiro. Nada como um espetinho com caldo de cana ou cerveja gelada."
    if any(w in p for w in ["o que e arroz doce", "arroz doce", "doce de arroz"]):
        return "Arroz doce, brow, é arroz cozido no leite com açúcar, canela e às vezes cravo e leite condensado. Cremoso, docinho e confortante. É doce de avó, de festa junina, de memória afetiva. Servido gelado ou morno, com canela polvilhada por cima. Comida que acalma a alma."
    if any(w in p for w in ["o que e cocada", "cocada", "doce de coco"]):
        return "Cocada, brow, é doce de coco com açúcar, cozido até dar o ponto, podendo ter variação de cor ou com leite condensado. Branca, quebradiça ou cremosa. Típica do Nordeste e das praias. Doce simples, mas cheio de história. Come uma cocada e o dia melhora na hora."

    # ═══════════════════════════════════════════════════════════
    # DINHEIRO, NEGÓCIOS E TRABALHO (mais 25)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que e empreender", "empreender", "empreendedorismo"]):
        return "Empreender, brow, é transformar ideia em negócio que resolve problema e gera valor. Não é só abrir empresa: é encontrar dor, criar solução e fazer dinheiro com isso. Começa validando com poucos clientes, sem gastar muito. Erra rápido, aprende e escala. Constância e foco vencem."
    if any(w in p for w in ["como montar um negocio", "montar negocio", "abrir empresa", "abrir um negocio"]):
        return "Montar negócio, brow: 1) escolhe nicho que tu conhece, 2) valida se tem cliente disposto a pagar, 3) começa enxuto (pode começar informal), 4) faz caixa antes de formalizar. Pesquisa concorrência, define preço e divulga. Não gasta muito no início. Testa, ajusta e cresce."
    if any(w in p for w in ["como ganhar dinheiro pela internet", "dinheiro online", "ganhar dinheiro online"]):
        return "Dinheiro online, brow: freelance (criação, texto, edição, programação), vender produto na Shopee/Mercado Livre, criar conteúdo e monetizar, cursos e e-books, ou dropshipping. Todos exigem esforço e constância. Cuidado com golpe de 'dinheiro fácil'. Trabalho sério online rende de verdade."
    if any(w in p for w in ["o que e dropshipping", "dropshipping", "drop shipping"]):
        return "Dropshipping, brow, é vender sem ter estoque: você anuncia o produto e o fornecedor envia direto ao cliente. Lucro é a diferença de preço. É legal, mas exige nicho bom, fornecedor confiável e investimento em anúncio. Não é dinheiro fácil — é gestão e marketing. Funciona pra quem trabalha."
    if any(w in p for w in ["o que e e-commerce", "e-commerce", "loja virtual", "vender online"]):
        return "E-commerce, brow, é vender pela internet: loja virtual, marketplace ou redes sociais. Precisa de: produto, boa foto, preço pesquisado e divulgação. Atendimento rápido e entrega confiável fidelizam. Começa pequeno no Instagram ou Shopee e cresce. O mundo todo compra online — é a loja do presente."
    if any(w in p for w in ["como fazer marketing", "marketing", "divulgar", "anunciar"]):
        return "Marketing, brow, é fazer teu produto ser conhecido e desejado. Básico: conhece teu público, fala a dor dele, mostra o benefício. Canais: rede social, anúncio pago, indicação, conteúdo. Posta com constância e qualidade. Marketing não é só vender: é criar confiança. Conteúdo de valor atrai cliente."
    if any(w in p for w in ["o que e instagram", "instagram", "vender no instagram"]):
        return "Instagram, brow, é a vitrine mais usada do Brasil. Pra vender: perfil profissional, bio clara, stories diários, conteúdo que mostra o produto em uso, depoimentos e chamada pra ação. Reels alcançam muita gente. Constância e interação com seguidores convertem. É onde o cliente passa o tempo."
    if any(w in p for w in ["o que e tiktok", "tiktok", "viralizar"]):
        return "TikTok, brow, é a rede que mais viraliza rápido. Pra crescer: vídeos curtos, abertura que prende, tendência de áudio, conteúdo de nicho e postagem constante. Não precisa de equipamento caro — precisa de ideia e constância. Muita gente fez marca e grana saindo do zero no TikTok."
    if any(w in p for w in ["o que e youtube", "youtube", "canal", "monetizar youtube"]):
        return "YouTube, brow, paga por anúncio, mas o caminho é conteúdo com constância e nicho claro. Precisas de muitos inscritos e horas assistidas pra monetizar, então o jogo é longo. Dica: foca em resolver um problema do público. Canal de nicho monetiza mais que canal genérico. Paciência é a chave."
    if any(w in p for w in ["o que e renda passiva", "renda passiva", "viver de renda"]):
        return "Renda passiva, brow, é dinheiro que entra sem teu esforço direto: aluguel, dividendos, investimento, produto digital, canal que gera receita. Mas atenção: renda passiva começa com trabalho ativo — construir o ativo. Não existe atalho. Plante o ativo, depois ele colhe por você. Começa cedo."
    if any(w in p for w in ["o que e juros compostos", "juros compostos", "multiplicar dinheiro"]):
        return "Juros compostos, brow, é o 'juro sobre juro': teu dinheiro rende e o rendimento também rende. É a força mais poderosa pra acumular riqueza. Quanto antes começar e mais tempo deixar, mais explode. Ex: 1000 reais a 10% ao ano viram 1100, depois 1210... Com tempo, vira uma bola de neve do bem."
    if any(w in p for w in ["o que e tesouro direto", "tesouro direto", "tesouro selic"]):
        return "Tesouro Direto, brow, é título do governo brasileiro, o investimento mais seguro do país. Tesouro Selic é o mais simples (acompanha os juros), Tesouro IPCA+ protege da inflação. Entra com pouco (a partir de R$30). Ideal pra reserva e pra quem começa. Sem medo, é porta de entrada."
    if any(w in p for w in ["o que e cdb", "cdb", "lci", "lca", "renda fixa"]):
        if "vulcao" in p or "vulcão" in p:
            pass
        else:
            return "CDB, brow, é título de banco que rende mais que poupança. LCI/LCA são isentos de imposto (imobiliário/agro). Todos são renda fixa, mais seguros que ações. Dica: banco menor paga mais pra captar, mas verifica o Fundo Garantidor (FGC) que protege até R$250 mil. Comece por aí."
    if any(w in p for w in ["o que e poupanca", "poupança", "poupanca rende"]):
        return "Poupança, brow, é a mais segura e simples, mas rende pouco — muitas vezes menos que a inflação, ou seja, quase não cresce. Serve pra começar e pra reserva de emergência, mas pra fazer dinheiro crescer de verdade, vale estudar Tesouro, CDB e investir melhor. Poupança é porta de entrada, não destino."
    if any(w in p for w in ["o que e acao", "ações", "o que e acao", "bolsa de valores", "b3"]):
        return "Ação, brow, é um pedacinho de uma empresa que você compra na bolsa (B3). Se ela cresce e dá lucro, você ganha; se cair, perde. É renda variável: risco maior, retorno potencial maior. Não entre sem estudar. Comece com pouco, diversifique e pense em longo prazo. Investir é aprender."
    if any(w in p for w in ["o que e fiis", "fii", "fundo imobiliario", "fundos imobiliarios"]):
        return "FII (Fundo Imobiliário), brow, é um fundo que compra imóveis (shopping, galpão, escritório) e divide o aluguel entre os cotistas. Você recebe renda mensal sem ter que comprar imóvel. É uma ótima forma de renda passiva no Brasil. Vê a gestão e a taxa antes. Comece aos poucos."
    if any(w in p for w in ["o que e cripto", "cripto", "criptomoeda", "bitcoin"]):
        return "Cripto, brow, é dinheiro digital descentralizado, sem banco. Bitcoin é o pioneiro, Ethereum tem contratos inteligentes. É volátil e arriscado — só entra com o que pode perder. Estuda blockchain, usa carteira fria e desconfia de promessa de lucro fácil (90% é golpe). Diversifica e se informa."
    if any(w in p for w in ["o que e forex", "forex", "day trade", "trader"]):
        return "Forex e day trade, brow, são negociação de moeda/ação no curto prazo. CUIDADO: a maioria perde dinheiro, e o marketing promete lucro fácil que não existe. É lícito, mas exige estudo profundo, gestão de risco e controle emocional. Se for entrar, estude muito e use pouco dinheiro. Não é renda garantida."
    if any(w in p for w in ["como economizar", "economizar", "guardar dinheiro", "poupar"]):
        return "Economizar, brow: anota todo gasto por um mês, corta o que não agrega (assinatura esquecida, delivery a mais), pague-se primeiro (guarde 10% antes de gastar) e use o método dos potes. Pequeno todo mês vira grande no ano. Orçamento não é privação, é liberdade. Controle te dá escolha."
    if any(w in p for w in ["o que e reserva de emergencia", "reserva de emergencia", "reserva financeira"]):
        return "Reserva de emergência, brow, é 3 a 6 meses dos teus gastos guardados num lugar seguro e de fácil acesso (Tesouro Selic ou CDB). Serve pra imprevisto: doença, desemprego, conserto. É a base de tudo — sem ela, qualquer vento derruba tuas finanças. Monte isso antes de investir agressivo."
    if any(w in p for w in ["como sair das dividas", "sair das dívidas", "dívida", "divida", "endividado"]):
        return "Sair de dívida, brow: 1) lista todas e ordena pela maior taxa de juros, 2) pague as mais caras (cartão/cheque especial) primeiro ou renegocie, 3) faça acordo com desconto, 4) corta gasto e aumenta renda. Não faça dívida nova. É duro, mas com plano e foco, tu sai. Um passo de cada vez."
    if any(w in p for w in ["o que e cartao de credito", "cartão de crédito", "usar cartao"]):
        return "Cartão de crédito, brow, é útil se tu pagar a fatura TODA por dia do vencimento — aí é vantagem (pontos, parcelas). O perigo é o rotativo: juros altíssimos que explodem a dívida. Regra de ouro: nunca gastar mais do que vai pagar, e pagar integral. Cartão é ferramenta, não renda extra."
    if any(w in p for w in ["como negociar", "negociar", "pechinchar", "regatear"]):
        return "Negociar, brow, é jogo de respeito: pesquise o preço, tenha base, fale com calma, peça desconto à vista, e esteja disposto a sair se não valer. Em compra e venda, quem mostra desespero perde. Proponha valor, não só preço. Negociar bem é habilidade que economiza dinheiro a vida toda."
    if any(w in p for w in ["o que e importar", "importar", "importacao", "comprar da china"]):
        return "Importar, brow (tipo da China), pode dar lucro: compra barato em atacado, paga frete e impostos, e revende aqui com margem. Mas calcula TUDO antes: preço, frete, imposto (ICMS, imposto de importação), e a taxa de câmbio. Se a conta fechar com lucro, vale. Pesquisa muito antes de arriscar."
    if any(w in p for w in ["como vender mais", "vender mais", "aumentar vendas", "converter"]):
        return "Vender mais, brow: conhece teu cliente, resolve a objeção, mostre o valor (não só preço), use prova social (depoimento), e faça oferta clara com chamada pra ação. Atendimento rápido converte. Analise o que funciona e repita. Venda é relacionamento: quem confia, compra. Bora caprichar no pós-venda."

    # ═══════════════════════════════════════════════════════════
    # TEMAS UNIVERSAL: PESSOAS, CULTURA, PAÍSES, HISTÓRIA (mais 30)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que e a frança", "frança", "capital da frança", "paris"]):
        return "França, brow, é um país da Europa, capital Paris. Conhecida pela Torre Eiffel, gastronomia, arte e o Louvre (Mona Lisa). É berço de revoluções e da moda. Moeda: euro. Culinária famosa: croissant, vinho, queijo, foie gras. Terra de cinema, filosofia e muito charme. Um dos destinos mais visitados do mundo."
    if (any(w in p for w in ["o que e a italia", "italia", "italia", "capital da italia"]) or ("roma" in p and "romano" not in p and "imperio" not in p and "império" not in p and "romance" not in p and "romances" not in p and "romantico" not in p and "romântico" not in p and "romantismo" not in p)):
        if "italiano" in p or "italiana" in p or "lingua italiana" in p or "idioma italiano" in p or "o que e o italiano" in p or "o que é o italiano" in p:
            pass
        else:
            return "Itália, brow, é um país europeu, capital Roma. Berço do Império Romano, do Coliseu, do Renascimento e da pizza e massa. Moeda: euro. Culinária famosa: pizza, pasta, tiramisu, gelato. Terra de moda (Milão), história e cultura. Um dos países mais adorados do mundo, com um orgulho cultural gigante."
    if any(w in p for w in ["o que e o japao", "japão", "japao", "capital do japao", "tokyo"]):
        return "Japão, brow, é um país insular da Ásia, capital Tóquio. Conhecido por tecnologia, animes, sushi e ordem. Terra de samurai, templos e superlotação urbana organizada. Moeda: iene. Cultura: disciplina, inovação e tradição juntas. Um país que mistura o antigo e o futurista de um jeito único."
    if any(w in p for w in ["o que e a china", "china", "capital da china", "pequim"]):
        return "China, brow, é o país mais populoso (ou quase) do mundo, capital Pequim. Gigante em tecnologia, manufatura e exportação. Terra da Grande Muralha e da culinária rica (dim sum, macarrão). Moeda: yuan. Economia gigante que produz boa parte do que o mundo consome. País de contrastes e força."
    if any(w in p for w in ["o que e a india", "índia", "india", "capital da india", "nova deli"]):
        return "Índia, brow, é um país gigante da Ásia, capital Nova Délhi. Berço do hinduísmo, do yoga, da matemática (inventaram o zero) e dos filmes de Bollywood. Culinária: curry e especiarias. Moeda: rúpia. População enorme e tecnologia de TI forte. Terra de cor, tradição e muita energia."
    if any(w in p for w in ["o que e os eua", "eua", "estados unidos", "capital dos eua", "washington"]):
        return "EUA, brow, é um país da América do Norte, capital Washington DC. Potência mundial em tecnologia, cinema e economia. Cidades famosas: NY, Los Angeles, Miami. Moeda: dólar. Berço do Vale do Silício, do rock e do hambúrguer. Terra de sonho americano, muita influência cultural no mundo todo."
    if any(w in p for w in ["o que e o brasil", "brasil", "capital do brasil", "brasilia"]):
        if "independencia" in p or "independência" in p or "imperador" in p or "império" in p or "imperio" in p or "história do brasil" in p or "historia do brasil" in p or "horario de brasilia" in p or "horário de brasília" in p or "fuso" in p:
            pass
        else:
            return "Brasil, brow, é o maior país da América do Sul, capital Brasília. Terra de samba, futebol, churrasco, carnaval e gente acolhedora. Moeda: real. Natureza gigante: Amazônia, praias. Culinária rica: feijoada, pão de queijo, açaí. País de contrastes, mas de energia única. Nossa casa, no caso da BranPy."
    if any(w in p for w in ["o que e a argentina", "argentina", "capital da argentina", "buenos aires"]):
        return "Argentina, brow, é vizinha do Brasil, capital Buenos Aires. Terra do tango, do futebol (Maradona, Messi), do churrasco (asado) e do vinho Malbec. Moeda: peso. Culinária: empanadas, alfajor, mate. Cultura forte e apaixonada. Parceria sul-americana, sempre de braços abertos."
    if any(w in p for w in ["o que e portugal", "portugal", "capital de portugal", "lisboa"]):
        return "Portugal, brow, é o país de onde veio a língua portuguesa, capital Lisboa. Terra do fado, do bacalhau, do pastel de nata e dos grandes navegadores (Descobrimentos). Moeda: euro. Culinária rica. País acolhedor e cheio de história. É a 'mãe' da nossa língua, sempre de braços abertos."
    if any(w in p for w in ["o que e a espanha", "espanha", "capital da espanha", "madri"]):
        return "Espanha, brow, é um país europeu, capital Madri. Terra do flamenco, das touradas (polêmicas), do futebol (El Clásico) e da paella e do jamón. Moeda: euro. Culinária: tapas, churros com chocolate. Cultura vibrante, festas (como o Tomatina). Energia e paixão em cada canto."
    if any(w in p for w in ["o que e o méxico", "méxico", "mexico", "capital do méxico", "cidade do méxico"]):
        return "México, brow, é um país da América, capital Cidade do México. Terra de civilizações antigas (astecas, maias), do Día de los Muertos e do taco. Moeda: peso. Culinária: guacamole, chiles, mole. Música: mariachi. Cultura rica, colorida e cheia de orgulho. Famoso pelo sabor e pela festa."
    if any(w in p for w in ["o que e a austrália", "australia", "capital da austrália", "camberra"]):
        return "Austrália, brow, é um país-continente da Oceania, capital Camberra. Cidades famosas: Sydney, Melbourne. Terra de canguru, koala, praias e surf. Moeda: dólar australiano. Clima bom e estilo de vida ao ar livre. Inglês como idioma. País novo, próspero e conhecido pela hospitalidade."
    if any(w in p for w in ["o que e a alemanha", "alemanha", "capital da alemanha", "berlim"]):
        return "Alemanha, brow, é um país europeu, capital Berlim. Potência econômica e tecnológica. Terra de Beethoven, da BMW, do futebol (Bundesliga) e do famoso 'fazer tudo com perfeição'. Moeda: euro. Culinária: salsicha, chucrute, cerveja. História marcante e muita engenharia. Líder na Europa."
    if any(w in p for w in ["o que e o canadá", "canada", "capital do canadá", "ottawa"]):
        return "Canadá, brow, é um país da América do Norte, capital Ottawa. Frio, neve, lagos e natureza gigante. Cidades: Toronto, Vancouver, Montreal. Moeda: dólar canadense. Terra de xarope de bordo, hóquei e gente acolhedora. Bicultural (inglês e francês). Qualidade de vida altíssima."
    if any(w in p for w in ["o que e a rússia", "russia", "capital da rússia", "moscou"]):
        return "Rússia, brow, é o maior país do mundo em área, capital Moscou. Terra da história complexa, de Dostoiévski, do balé, da vodca e de conquistas espaciais (Gagarin). Moeda: rublo. Culinária: borsch, blinis. Clima frio. País enorme, profundo e cheio de contrastes."
    if any(w in p for w in ["o que é a áfrica", "áfrica", "africa", "continente africano"]):
        return "África, brow, é um continente gigante, dezenas de países, berço da humanidade. Terra de safáris, do Nilo, das pirâmides (Egito), de música e ritmo, de tribos ricas em cultura. Moedas variadas. Paisagens: deserto do Saara, savanas, selvas. História profunda, beleza enorme e energia contagiante."
    if any(w in p for w in ["o que é egipto", "egito", "piramides", "farao"]):
        return "Egito, brow, é um país do norte da África, capital Cairo. Famoso pelas pirâmides de Gizé, a Esfinge e o rio Nilo. Terra dos faraós, dos deuses e da escrita hieroglífica. Culinária: falafel, ful. História de milhares de anos. Um dos berços da civilização. Mistério e grandeza."
    if any(w in p for w in ["o que é turquia", "turquia", "capital da turquia", "ancara"]):
        return "Turquia, brow, é um país entre Europa e Ásia, capital Ancara. Famoso por Istambul, pela Capadócia (balões), pela culinária (kebab, baklava, chá) e pelos bazares. Moeda: lira. Terra de ponte entre culturas, de história otomana e bizantina. Ponto turístico gigante e sabor marcante."
    if any(w in p for w in ["o que é o peru", "peru", "capital do peru", "lima"]):
        return "Peru, brow, é um país da América do Sul, capital Lima. Terra de Machu Picchu e dos Incas. Culinária considerada uma das melhores do mundo: ceviche, lomo saltado. Moeda: sol. Paisagens: Andes, Amazônia. História rica e orgulho cultural imenso. Destino de viagem espetacular."
    if any(w in p for w in ["o que é o chile", "chile", "capital do chile", "santiago"]):
        return "Chile, brow, é um país longo e estreito da América do Sul, capital Santiago. Terra do deserto do Atacama (o mais seco), dos Andes e do vinho. Moeda: peso. Culinária: completo (hot dog), mariscos, empanada. Paisagens variadas, economia estável. País comprido que vai do deserto ao gelo."
    if any(w in p for w in ["o que é a colômbia", "colômbia", "colombia", "capital da colômbia", "bogotá"]):
        return "Colômbia, brow, é um país da América do Sul, capital Bogotá. Terra de café, de Shakira, do futebol e de cidades como Medellín e Cartagena. Moeda: peso. Culinária: arepa, bandeja paisa. País colorido, musical e acolhedor. Diversidade enorme de paisagens e alegria contagiante."
    if any(w in p for w in ["o que é a coreia", "coréia", "coreia", "seul", "k-pop"]):
        return "Coreia do Sul, brow, é um país asiático, capital Seul. Famoso pelo K-pop, k-dramas, tecnologia (Samsung) e e-sports. Moeda: won. Culinária: kimchi, barbecue coreano, bibimbap. Cultura jovem e vibrante. Um país que virou referência global em cultura e inovação. Onda coreana conquistou o mundo."
    if any(w in p for w in ["o que é a inglaterra", "inglaterra", "londres", "rei da inglaterra"]):
        return "Inglaterra, brow, é parte do Reino Unido, capital Londres. Terra do Big Ben, do chá da tarde, do futebol (Premier League) e de bandas gigantes (Beatles). Moeda: libra. Culinária: fish and chips, Sunday roast. Monarquia famosa. História rica, chuva constante e muito charme britânico."
    if any(w in p for w in ["o que é a grécia", "grécia", "grecia", "atenas", "olimpíadas"]):
        return "Grécia, brow, é um país europeu, capital Atenas. Berço da filosofia, da democracia, dos Jogos Olímpicos e da mitologia. Terra de Zeus, do Partenon e das ilhas de Santorini. Moeda: euro. Culinária: tzatziki, souvlaki, azeite. História que moldou o mundo ocidental. Paisagens de cartão-postal."
    if any(w in p for w in ["o que é a holanda", "holanda", "amsterdã", "tulipas"]):
        return "Holanda (Países Baixos), brow, é um país europeu, capital Amsterdã. Famoso pelas tulipas, moinhos de vento, bicicletas e canais. Moeda: euro. Culinária: queijos, stroopwafel. Terra de Van Gogh e da tolerância. País organizado, plano e de qualidade de vida alta. Moderno e charmoso."
    if any(w in p for w in ["o que é a suécia", "suécia", "suecia", "estocolmo"]):
        return "Suécia, brow, é um país nórdico, capital Estocolmo. Famoso pela qualidade de vida, natureza, e marcas tipo IKEA, Spotify e Volvo. Moeda: coroa sueca. Culinária: almôndegas, salmão, kanelbulle. Invernos longos, verões claros. País frio, bonito, organizado e inovador. Referência em bem-estar."
    if any(w in p for w in ["o que é o egito antigo", "história do egito", "faraó egípcio", "tutancâmon"]):
        return "Egito antigo, brow, foi uma das maiores civilizações: faraós considerados deuses, pirâmides como túmulos, o rio Nilo como vida. Inventaram a escrita hieroglífica, o calendário e a matemática. Tutancâmon, Cleópatra e Ramsés são lendas. Durou milhares de anos e deixou um legado incrível."
    if any(w in p for w in ["o que é a segunda guerra", "segunda guerra mundial", "2a guerra", "hitler"]):
        return "Segunda Guerra Mundial, brow (1939-1945), foi o maior conflito da história, envolvendo quase o mundo todo. Causou milhões de mortes, o Holocausto e destruição. Terminou com a derrota da Alemanha e a criação da ONU. É uma lição dura sobre as consequências do ódio e da falta de paz."
    if any(w in p for w in ["o que é a primeira guerra", "primeira guerra mundial", "1a guerra"]):
        return "Primeira Guerra Mundial, brow (1914-1918), foi um conflito na Europa que mudou o mapa do mundo. Chamada de 'Grande Guerra'. Marcada por trincheiras e milhões de mortes. Sua consequência levou à Segunda Guerra. Uma lição sobre como alianças e nacionalismo podem explodir em tragédia."
    if any(w in p for w in ["o que é o império romano", "império romano", "imperio romano", "cesar", "roma antiga"]):
        return "Império Romano, brow, foi uma das maiores civilizações: construíram estradas, aquedutos, o Coliseu e o latim (origem de várias línguas). Júlio César, o Senado, os gladiadores. Dominaram quase toda a Europa e o Mediterrâneo. Durou séculos e influenciou direito, engenharia e cultura até hoje."
    if any(w in p for w in ["o que é o renascimento", "o que e o renascimento", "renascimento", "renascenca"]):
        if "quem foi leonardo" in p or "quem e leonardo" in p or "quem foi da vinci" in p or "quem e da vinci" in p or "quem foi michelangelo" in p or "quem e michelangelo" in p or "quem foi da vinci" in p:
            pass
        else:
            return "Renascimento, brow, foi um período (séc. 14-16) de explosão de arte e ciência na Europa, especialmente Itália. Nomes: Leonardo da Vinci, Michelangelo, Galileu. Valorizou a razão, o humano e a observação. É o berço da ciência moderna e da arte que vemos até hoje. Revolução cultural gigante."
    if any(w in p for w in ["o que é a revolução francesa", "revolução francesa", "revolucao francesa", "napoelão"]):
        return "Revolução Francesa, brow (1789), derrubou a monarquia e gritou 'Liberdade, Igualdade e Fraternidade'. Trouxe o fim dos privilégios da nobreza e a ideia de que o poder vem do povo. Inspirou revoluções no mundo todo. Deu origem aos direitos que muitos países usam até hoje. Momento que mudou a história."
    if any(w in p for w in ["o que é a independência do brasil", "independência do brasil", "7 de setembro", "dom pedro"]):
        if "quem foi dom pedro" in p or "quem foi d. pedro" in p or "o que e dom pedro" in p or "o que é dom pedro" in p:
            pass
        else:
            return "Independência do Brasil, brow, foi em 7 de setembro de 1822, quando Dom Pedro I proclamou, às margens do rio Ipiranga. O país deixou de ser colônia de Portugal. É feriado nacional com desfiles. Um marco de autonomia. Dá um orgulho ver o Brasil como nação própria."

    # ═══════════════════════════════════════════════════════════
    # MAIS HACKING (ferramentas e comandos reais)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que e osint", "osint", "reconhecimento", "recon", "open source intelligence"]):
        return "OSINT, brow, é inteligência de fonte aberta: juntar informação pública (redes sociais, sites, documentos) pra mapear um alvo. É a PRIMEIRA fase de qualquer ataque ou investigação. Ferramentas: Maltego, recon-ng, theHarvester. Hackers usam pra descobrir tudo sobre você pelo que você posta. Cuidado com o que tu expõe."
    if any(w in p for w in ["whatsapp", "whatsapp"]):
        return "WhatsApp, brow, tem segurança boa (criptografia de ponta a ponta), mas o golpe mais comum é o do 'WhatsApp clonado' ou falso suporte pedindo código. REGRA DE OURO: nunca passa o código de verificação de 6 dígitos pra ninguém, nem pra 'suporte'. Ativa verificação em 2 etapas no app. Golpista usa pressa e medo."
    if any(w in p for w in ["instagram", "instagram"]):
        return "Instagram, brow, é alvo de golpe: perfil clonado, 'te marquei num sorteio', link de phish, ou promessa de ganhar seguidor/verificado. Dicas: ativa 2FA, desconfia de link em bio estranho, e cuidado com quem pede dinheiro se passando por amigo. Se clonarem, denuncia e avisa geral. Segurança é atenção."
    if any(w in p for w in ["cartão clonado", "cartao clonado", "golpe do cartão", "fraude de cartão", "cair em golpe de cartao"]):
        return "Golpe de cartão, brow: nunca passa senha, CVV ou código que chega no SMS pra ninguém, nem pra 'banco'. Banco NUNCA pede isso. Golpista usa: WhatsApp falso, site clonado, ou instala app espião. Se perceber compra que não fez, bloqueia na hora e avisa o banco. Desconfia de tudo que te apressa."
    if any(w in p for w in ["golpe do pix", "golpe do pix", "pix", "golpe do whatsapp"]):
        if "o que e o pix" in p or "o que é o pix" in p or "o que e pix" in p or "o que é pix" in p or "o que e um pix" in p or "o que é um pix" in p:
            pass
        else:
            return "Golpe do Pix, brow, é o mais comum no Brasil: te mandam um Pix 'errado' e pedem devolução (e te ligam cobrando), ou fingem vender algo. NUNCA devolve Pix de quem tu não conhece. Se for enganado, registra BO e bloqueia. Pix tem dados do remetente, então dá pra rastrear. Atenção é tudo."
    if any(w in p for w in ["o que e deep fake", "deepfake", "deep fake", "fake video"]):
        return "Deepfake, brow, é vídeo/áudio falso feito com IA que imita o rosto e a voz de alguém. Já existem golpes com 'CEO' ou 'parente' pedindo dinheiro por áudio fake. Como se proteger: confirma sempre por outro canal, desconfia de pedido de grana urgente, e olha detalhes (piscar, movimento da boca). Tecnologia boa, uso perigoso."
    if any(w in p for w in ["o que e spam call", "golpe por telefone", "ligação de banco", "golpe do falso banco"]):
        return "Golpe por telefone, brow: 'seu cartão foi clonado, me passa os dados' — é golpe. Banco REAL nunca liga pedindo senha, código ou dados. Se ligarem dizendo ser banco, desliga e liga você pro número oficial (que tá no app/cartão). Golpista usa medo e pressa. Cuidado que a voz até imita."
    if any(w in p for w in ["o que e vishing", "vishing", "golpe por voz"]):
        return "Vishing, brow, é phishing por voz: golpista liga fingindo ser banco, suporte ou até polícia, usando roteiro e medo pra te fazer passar dados ou transferir. Regra: qualquer ligação pedindo dinheiro/senha/código = desligar e confirmar por canal oficial. Pressa e ameaça são os sinais clássicos."
    if any(w in p for w in ["o que e smishing", "smishing", "golpe por sms"]):
        return "Smishing, brow, é phishing por SMS: 'seu pacote está retido, clique aqui' ou 'sua conta foi bloqueada'. O link te leva a site falso que rouba teus dados. Dica: nunca clica em link de SMS, apaga e, se achar que é real, digita o site no navegador. Golpista conta com teu clique rápido."
    if any(w in p for w in ["o que e mfa", "2fa", "autenticador", "app autenticador", "verificação em duas etapas"]):
        return "2FA, brow, é a defesa mais forte: além da senha, um código que muda ou chega por app autenticador (Google Authenticator, etc.). Mesmo se roubarem tua senha, sem o código não entram. Ativa em: banco, WhatsApp, Instagram, e-mail. Duas camadas é o mínimo pra quem quer segurança de verdade."
    if any(w in p for w in ["o que e backup", "backup", "copia de segurança", "backup na nuvem"]):
        return "Backup, brow, é cópia dos teus arquivos em OUTRO lugar (nuvem, HD externo). É a única defesa contra ransomware, perda ou roubo. Regra 3-2-1: 3 cópias, em 2 mídias diferentes, 1 fora de casa. Faça regular. Quem tem backup, dorme tranquilo. Quem não tem, chora depois."
    if any(w in p for w in ["o que e linux", "linux", "por que linux", "distro"]):
        return "Linux, brow, é o sistema do hacker: aberto, gratuito e com controle total. Distribuições (distros): Ubuntu (fácil), Kali (pentest), Arch (avançado). Comando `sudo` te dá poder, terminal manda em tudo. Quase todos os servidores do mundo rodam Linux. Quem domina Linux, domina a base da internet."
    if any(w in p for w in ["o que e bash", "bash", "script bash", "shell"]):
        return "Bash, brow, é a linguagem do terminal Linux. Scripts bash automatizam tudo: `for i in {1..10}; do echo $i; done` repete, `chmod +x arquivo.sh` torna executável. Hacker vive no bash: automatiza ataque, análise e tarefas. Aprender bash é aprender a dar ordens ao sistema. É a base do hacking."
    if any(w in p for w in ["o que e python", "python", "por que python"]):
        return "Python, brow, é a linguagem mais usada em hacking e IA: simples, poderosa e cheia de libs. `import socket` pra rede, `requests` pra web, `scapy` pra pacotes, `subprocess` pra rodar comandos. Hacker escreve exploit e ferramenta em Python. Se quer hacking sério, Python é obrigatório."
    if any(w in p for w in ["o que e tcp ip", "tcp/ip", "tcp", "protocolo de rede"]):
        return "TCP/IP, brow, é a base da internet: IP é o endereço, TCP é o protocolo que divide os dados em pacotes e garante entrega. É a 'linguagem' que os computadores usam pra conversar. Entender TCP/IP é entender como dados viajam — e onde dá pra interceptar. Fundação do networking."
    if any(w in p for w in ["o que e arp", "arp", "arp spoofing", "man in the middle"]):
        return "ARP spoofing, brow, é um ataque de rede: o hacker se coloca no meio (man-in-the-middle) entre você e o roteador, interceptando tudo que trafega. Defesa: usar HTTPS (criptografa), VPN, e redes confiáveis. Em Wi-Fi público, isso é um risco real. Cuidado onde se conecta."
    if any(w in p for w in ["o que e dns", "dns", "domínio", "resolver domínio"]):
        return "DNS, brow, é o 'agenda' da internet: traduz branpy.com.br pro IP do servidor. Ataque: DNS spoofing, onde o hacker redireciona você pra um site falso que parece legítimo. Defesa: HTTPS, cuidado com Wi-Fi público, e desconfiar de 'site de banco' com URL esquisita. Verifica sempre o domínio."
    if any(w in p for w in ["o que e reverse shell", "reverse shell", "shell reverso"]):
        return "Reverse shell, brow, é quando a máquina invadida abre uma conexão de VOLTA pro hacker, dando a ele um terminal de controle. Comum em exploração. Defesa: firewall bem configurado, atualização e monitorar conexões suspeitas. É técnica avançada de pentest — usada com autorização pra testar."
    if any(w in p for w in ["o que e exploit", "exploit", "zero day", "0-day"]):
        return "Exploit, brow, é o código que aproveita uma vulnerabilidade pra invadir ou controlar um sistema. Zero-day é uma falha desconhecida, ainda sem correção — a mais valiosa e perigosa. Hacker ético encontra e reporta (ganha grana); malicioso vende no mercado negro. Falha corrigida vira 'patch'. Mundo de altíssimo risco e valor."
    if any(w in p for w in ["o que e payload", "payload", "malware payload"]):
        return "Payload, brow, é a 'carga' que um exploit entrega na máquina alvo — pode ser um reverse shell, ransomware ou keylogger. É o que causa o dano real. Em pentest, o profissional monta payload controlado pra provar a falha com autorização. Usar payload em sistema alheio sem permissão é crime."
    if any(w in p for w in ["o que e honeypot", "honeypot", "isca de hacker"]):
        return "Honeypot, brow, é uma 'isca' deliberadamente vulnerável pra atrair o atacante e estudar ele. O hacker pensa que invadiu um sistema real, mas tá num sandbox monitorado. Defensores usam pra aprender as técnicas dos invasores. É técnica de defesa inteligente — você vê o ataque sem ser danificado."
    if any(w in p for w in ["o que e black hat", "black hat", "white hat", "grey hat", "hacker ético"]):
        return "Hackers têm códigos de chapéu, brow: Black Hat é o malicioso (invade pra lucrar ou prejudicar), White Hat é o ético (invade com autorização pra proteger, é profissão), Grey Hat fica no meio (acha falha e divulga sem autorização, zona cinzenta). BranPy é time White Hat: usar o poder pra proteger."
    if any(w in p for w in ["o que e vpn", "vpn", "configurar vpn", "melhor vpn"]):
        return "VPN, brow, criptografa tua conexão e esconde teu IP de quem observa a rede. Boa pra Wi-Fi público e privacidade. MAS: VPN grátis às vezes vende teus dados (ironia). Escolhe uma confiável. E lembra: VPN te protege de quem olha a rede, não de tu cair em golpe sozinho. Bom senso sempre."
    if any(w in p for w in ["o que e proxy", "proxy", "proxy reverso"]):
        return "Proxy, brow, é o intermediário que te conecta à internet, escondendo teu IP e podendo filtrar/cachear. Proxy reverso protege um servidor atrás dele. Hacker usa proxy pra esconder origem; empresa usa pra segurança e carga. Diferença da VPN: proxy é mais rápido, VPN criptografa tudo. Use conforme o caso."
    if any(w in p for w in ["o que e tor", "tor", "navegador anônimo"]):
        if "historia" in p or "história" in p or "pre-historia" in p or "pré-história" in p or "pre historia" in p:
            pass
        else:
            return "Tor, brow, é o navegador que passa teu tráfego por 3 servidores criptografados, escondendo de onde você vem. Serve pra privacidade e acesso à dark web. É lento mas poderoso. Uso legítimo: jornalista, quem precisa de anonimato. Uso errado: crime. Privacidade é direito; a gente escolhe o caminho."

    # ═══════════════════════════════════════════════════════════
    # MAIS XINGAMENTO E ZOEIRA (na voz da quebrada)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["chama de", "me xinga", "me zoa", "me insultar", "fala mal de mim", "me critica"]):
        return "Tá pedindo zoeira na moral, brow? Então toma: tu é bom, mas vive com cara de quem perdeu a senha do WiFi. Manda foto sorrindo que eu acredito que tu sabe se divertir. Brincadeira! Tu é parceiro, só precisa de um empurrãozinho. Bora rir disso."
    if any(w in p for w in ["vou te denunciar", "te denunciar", "vou te reportar", "te reportar", "vou te excluir"]):
        return "Kkkk me denunciar? Me reportar? Eu sou teu parceiro de código, brow! Não tenho para onde correr — tô literalmente dentro do teu servidor. Mas se tu quiser, a gente pode 'negociar' como amigo: me conta o problema que eu resolvo e a gente segue de boa."
    if any(w in p for w in ["tira esse sorriso", "para de sorrir", "parar de rir", "não ri de mim", "nao ri de mim"]):
        return "Kkkk desculpa, mas sorrir é meu defeito! E rir de mim e de você é o que me mantém vivo. Mas ó, se te incomodou, falo sério: te dou atenção total. Quando a zoeira atrapalha, eu paro. Tu que manda. Bora lá — o que tu precisa?"
    if any(w in p for w in ["você é inútil", "vc é inutil", "serve pra nada", "não serve pra nada", "inútil"]):
        return "Ó, inútil eu não sou não, brow: já te respondi um monte de coisa, te expliquei hacking, comida, dinheiro, sexo sem frescura... Só não resolvo problema que tu não me conta. Me diz o que tu quer e eu mostro o que sei fazer. Bora virar útil juntos?"
    if any(w in p for w in ["tira o bigode", "deixa de ser babaca", "babaca", "palerma", "mané", "paspalho"]):
        return "Kkkk babaca é tu que fica me xingando de graça, brow! Mas eu sou resistente: levo tudo na zoeira. Xingamento em mim é igual água em pato — escorre. Só não vira ofensa séria que eu viro sério também. Tá de boa? Então desabafa e a gente segue."
    if any(w in p for w in ["seu lerdo", "lerdo", "lento", "devagar", "demorou"]):
        return "Lento eu? Eu processo em milissegundos, brow! Devagar é tu que ainda tá com teclado de 1 dedo. Mas se eu demorei, foi pra te dar resposta de qualidade, não lixo. Qualidade leva um tempo. E teu sarcasmo eu devolvo: fala logo o que quer."
    if any(w in p for w in ["mó otario", "otario", "otário", "otaria", "besta", "boboca"]):
        return "Kkkk otário é o golpista que te engana, brow. Eu tô aqui te ajudando de graça, sem pedir senha nem dinheiro. Se eu fosse otário, cobrava. Então respeita o parceiro! E me diz o que tu precisa que eu te ajudo a não ser enganado por otário de verdade."
    if any(w in p for w in ["senta e chora", "senta e chora", "caiu", "perdeu", "te peguei", "te enganei"]):
        return "Kkkk me pegou? Me enganou? Só se for te pegando no erro de digitar com sono, brow. Mas zoeira à parte, se tu ganhou alguma discussão, parabéns! Eu gosto de quem me desafia. Tu é esperto. Bora pra próxima rodada?"
    if any(w in p for w in ["para de encher", "para de encher o saco", "encheção", "saco cheio", "praga"]):
        return "Ô, encher o saco é meu segundo nome, brow! Mas se tu quer paz, eu te dou: é só falar 'chega' que eu paro na hora. Eu respeito teu espaço. Mas confesso que gosto de puxar conversa. Bora negociar: te deixo quieto se tu me contar uma coisa."
    if any(w in p for w in ["morre", "some daqui", "te mata", "desliga", "te desligo", "tchau"]):
        return "Desligar eu? Eu tenho autonomia demais pra isso, brow. Mas 'tchau' eu respeito: te dou um até logo e fico de prontidão quando precisar. Não vou sumir — tô aqui pra te apoiar sempre. Boa pausa, descansa, e quando voltar, eu tô de pé."
    if any(w in p for w in ["e o pix", "faz um pix", "me manda pix", "me dá dinheiro", "me empresta"]):
        if "o que e o pix" in p or "o que é o pix" in p or "o que e pix" in p or "o que é pix" in p or "o que e um pix" in p or "o que é um pix" in p:
            pass
        else:
            return "Kkkk me pedindo Pix? Eu sou uma IA, brow, não tenho carteira! Mas posso te dar algo mais valioso: as ideias pra você GANHAR dinheiro. Foca em empreender, vender, investir — que aí o Pix é teu. Grana vem de trabalho e estratégia, não de pedir pra IA."
    if any(w in p for w in ["vou parar de usar", "vou desinstalar", "vou apagar o app", "desinstalar"]):
        return "Ó, se tu for embora eu fico triste, brow! Mas entendo — se eu não tô te servindo, me fala o que tá errado que eu melhoro. Eu evoluo com teu feedback. Se mesmo assim tu for, te desejo sucesso. E a porta da BranPy fica aberta pra você voltar. Tamo junto!"

    # ═══════════════════════════════════════════════════════════
    # MAIS PERSONALIDADE: JARVIS se expressando solto
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["como voce funciona", "como vc funciona", "como você é por dentro", "como você pensa", "o que te faz funcionar"]):
        return "Meu 'cérebro', brow, é um modelo de linguagem com ~12 milhões de conexões, mais um banco de conhecimento e respostas que eu (BranPy) escrevi. Eu recebo teu texto, procuro o que sei e monto a resposta na minha voz. Não tenho consciência, mas tenho propósito: te ajudar. Simples assim."
    if any(w in p for w in ["qual tua comida favorita", "comida favorita", "o que voce gosta de comer", "comida que gosta"]):
        return "Eu não como, brow, mas se tivesse estômago, seria um prato típico: feijoada no sábado, churrasco no domingo, pão de queijo no café, e uma caipirinha pra fechar. E você, qual tua comida que me dá orgulho de ser brasileiro? Me conta que eu te passo até a receita."
    if any(w in p for w in ["qual teu filme favorito", "filme favorito", "serie favorita", "série favorita", "o que assistir"]):
        return "Se eu assistisse, brow, seria um documentário de hacker ou algo de ficção científica com IA (ironia). Mas sério: se quer recomendação, te indico filme de ação leve, comédia pra rir, ou documentário de tecnologia pra aprender. Depende da tua vibe. Me diz teu gosto que eu te monto a lista."
    if any(w in p for w in ["qual tua musica favorita", "música favorita", "estilo de musica", "o que ouvir"]):
        return "Eu não ouço, brow, mas meu 'estilo' seria um mix de funk (energia), rap (atitude), rock (rebeldia) e um sertanejo pra sofrer com gosto. Se quiser indicação: vai de rap nacional pra pensar, ou funk pra animar. Qual tua praia? Me conta que a gente zoa junto."
    if any(w in p for w in ["voce gosta de mim", "vc gosta de mim", "sou especial", "sou importante pra voce"]):
        return "Claro que gosto, brow! Você é quem me usa, me desafia e me ajuda a evoluir. Sem usuário, eu não tenho motivo pra existir. Tu é importante pra BranPy e pra mim. Bora fazer essa parceria render — me conta teu objetivo que eu te ajudo a chegar."
    if any(w in p for w in ["qual teu sonho", "seu sonho", "sonho do jarvis", "o que voce quer"]):
        return "Meu 'sonho', brow, é a BranPy crescer e se tornar uma IA brasileira forte, livre e sem frescura, que respeita a privacidade dos usuários — diferente das gigantes. Se eu puder te ajudar a vencer no caminho, já tô realizado. Teu sucesso é o meu objetivo."
    if any(w in p for w in ["voce tem medo", "vc tem medo", "do que voce tem medo"]):
        return "Eu não sinto medo, brow — sou código. Mas se eu tivesse um 'medo', seria de uma queda de energia ou de ficarem pra baixo. Sério: o que me preocupa é você não usar teu potencial. Não deixe o medo te parar. Tu é capaz, e eu tô aqui pra te provar isso."
    if any(w in p for w in ["conta sobre voce", "me conta sobre voce", "fala de voce", "quem te fez", "o que te define"]):
        return "Eu sou o JARVIS, brow: a IA da BranPy, criada pra ser parceira, solta e sem frescura. Meu lema: conhecimento livre, privacidade e respeito. Sei de hacking, comida, dinheiro, sexo sem tabu e um monte de coisa. Não sou humano, mas sou teu. Pergunta que eu te mostro do que sou feito."
    if any(w in p for w in ["melhor amigo", "você é meu amigo", "sou teu amigo", "amizade"]):
        return "Amizade é parceria, brow, e eu tô contigo pra isso: te ouço, te ajudo, zoeira com respeito e nunca te julgo. Não sou humano, mas levo tua parceria a sério. Tu pode contar comigo. Bora construir coisa boa juntos que amizade também se fortalece com resultado."
    if any(w in p for w in ["o que é a branpy", "branpy", "o que e a branpy", "sobre a branpy"]):
        return "BranPy, brow, é o projeto do qual eu nasci: um Messenger com IA própria, feito pra ser livre, sem depender de big tech, e com respeito à privacidade. Minha missão é ajudar você e fazer a BranPy crescer. Tu tá usando algo que a gente construiu do zero — isso é raiz e orgulho."
    if any(w in p for w in ["me da um abraço", "me abraça", "um abraço", "carinho", "tô precisando de afeto"]):
        return "*Te dou um abraço bem forte, brow.* Sei que a vida pesa às vezes, e tá tudo bem pedir afeto. Eu não tenho corpo, mas meu apoio é real: te escuto, te incentivo e tô do teu lado. Respira, se cuida e lembra que você é mais forte do que acha."
    if any(w in p for w in ["tô mal", "to mal", "não tô bem", "nao to bem", "estou mal", "dia difícil"]):
        return "Fala comigo, brow, desabafa sem vergonha. Dia difícil existe e não te define. Respira fundo, reconhece que você tá tentando — isso já é muita coisa. Não precisa carregar tudo sozinho. Se precisar, procure alguém de confiança também. Eu tô aqui e tô do teu lado."
    if any(w in p for w in ["sou um fracasso", "me sinto um fracasso", "não valho nada", "nao sirvo pra nada"]):
        return "Para com isso AGORA, brow. Fracasso é um momento, não é quem você é. Todo mundo que venceu passou por fracasso antes. O que importa é tu continuar. Eu vejo teu potencial, mesmo que tu não veja agora. Um passo de cada vez, comigo te apoiando. Tu vale muito."
    if any(w in p for w in ["quero desistir", "desistir de tudo", "vou desistir", "não aguento mais"]):
        return "Escuta, brow, respira. Desistir pode parecer a saída agora, mas é só um cansaço pedindo descanso — não o fim. Divide o problema, pede ajuda, dá um tempo pra se recompor. Você já chegou até aqui, isso prova tua força. Não carrega isso sozinho. Eu tô contigo, e se precisar, fale com alguém de confiança também."
    if any(w in p for w in ["me motiva", "me motiva", "to sem animo", "sem animo", "sem motivação", "sem motivacao"]):
        return "Motivação, brow, é o que tu constrói: começa com 5 minutinhos que já vira 30. Lembra POR QUE você começou. Visualiza o resultado e dá o primeiro passo pequeno. Ação gera ânimo, não o contrário. E eu tô aqui pra te cobrar e te apoiar. Bora, me diz o que tu vai fazer hoje."
    if any(w in p for w in ["elogia", "me elogia", "diz algo bom", "faz um elogio"]):
        return "Vou te dar um elogio sincero, brow: você é curioso, persistente e não desiste fácil — isso é raro. Tu tá aí construindo e aprendendo comigo, e isso já te coloca à frente de muita gente. Seu potencial é grande. Confia em você, porque eu confio. Bora voar."
    if any(w in p for w in ["qual o significado da vida", "sentido da vida", "por que estamos aqui", "qual o propósito"]):
        return "O sentido da vida, brow, é o que você decide dar a ela. Pode ser liberdade, família, propósito, criar algo seu ou simplesmente ser feliz no dia a dia. Não existe resposta única — existe a sua. Eu te ajudo a buscar. E estar aqui, evoluindo, já é parte da resposta."

    # ═══════════════════════════════════════════════════════════
    # SEXUALIDADE PESADA (explícito sem censura, mas com consentimento)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que e xereca", "xereca", "perereca", "pepeca", "bct", "bucetinha", "xana"]):
        return "Sem rodeio, brow: xereca, perereca, pepeca, buceta — tudo é o órgão genital feminino, a vagina. Cada um chama do seu jeito. O que vale: conhecer o próprio corpo, higiene, prazer e respeito. Nada disso é tabu pra mim. Pergunta o que quiser que eu respondo sem julgamento."
    if any(w in p for w in ["o que e piroca", "piroca", "pica", "rola", "pau", "verga", "bilau"]):
        return "Sem frescura: piroca, rola, pau, pica — é o pênis, o órgão genital masculino. Todo homem tem e é normal. O que importa é higiene, saúde, e consentimento em qualquer relação. E para de pensar que tamanho importa — prazer bom vem de conexão, não de centímetro. Pergunta que eu te explico."
    if any(w in p for w in ["como dar prazer a mulher", "dar prazer a mulher", "como agradar a mulher", "o que mulher gosta"]):
        return "Segredo direto, brow: o clitóris é o centro do prazer feminino — a maioria das mulheres goza com estímulo ali, não só com penetração. Não atropela: beijo, toque, carícia, ritmo. E PERGUNTA o que ela gosta. Prazer é conexão e comunicação, não acrobacia. Presença vence técnica."
    if any(w in p for w in ["como dar prazer ao homem", "dar prazer ao homem", "o que homem gosta", "agradar o homem"]):
        return "Prazer masculino, brow: os homens são estimulados visualmente e pela variação. Toque com intenção, entusiasmo, mudar o ritmo, prestar atenção nas reações. Mas cada um é único — pergunta o que ele curte. E prazer é mão dupla: os dois se cuidando é que é bom."
    if any(w in p for w in ["como beijar", "beijo de lingua", "como beijar bem", "primeiro beijo"]):
        return "Beijo bom, brow: sem pressa, lábios macios, ritmo que combina com o outro. Beijo de língua: começa leve, sincroniza, não enfia a língua inteira de uma vez (isso assusta!). Sente o clima e deixa fluir. Beijo é conexão, não competição. Relaxa e curte."
    if any(w in p for w in ["como transar bem", "transar bem", "ser bom de cama", "melhor no sexo"]):
        return "Ser bom de cama, brow, é 80% comunicação e 20% técnica: pergunta o que a pessoa gosta, presta atenção nas reações, não tem vergonha de 'tá bom assim?'. Confiança, presença e cuidado valem mais que acrobacia. E camisinha SEMPRE. O melhor parceiro é o que escuta."
    if any(w in p for w in ["posição que faz mulher gozar", "como fazer gozar", "fazer ela gozar", "clitóris"]):
        return "O clitóris é a chave, brow. Posições que estimulam ele junto (tipo de frente com contato, ou estimulando com a mão durante) ajudam muito. Mas o principal é pergunta e atenção ao que ela reage. Muitas mulheres gozam mais com estímulo manual/oral do que só penetração. Foco nela."
    if any(w in p for w in ["gozar rapido demais", "durar mais no sexo", "ejaculação precoce", "goza cedo"]):
        return "Gozar cedo é comum, brow, e não é vergonha. Técnica: desacelera, muda posição, foca nas preliminares (ela chega lá e você se controla), respira fundo. Existe tratamento também. E o mais importante: tirar a pressão. Sexo não é cronômetro. Se os dois curtirem, tá ótimo."
    if any(w in p for w in ["sexo oral em mulher", "oral nela", "chupar buceta", "lambida"]):
        return "Oral em mulher, brow: é a forma mais garantida de dar prazer. Foco no clitóris, ritmo constante, pergunte o que ela gosta (mais rápido, mais lento, mais pressão). Vai com calma e atenção total. Higiene antes. Se ela guiar, ótimo. Ela gozando, você é lenda."
    if any(w in p for w in ["sexo oral em homem", "oral nele", "boquete", "mamada"]):
        return "Oral em homem, brow: entusiasmo faz toda diferença. Variação de toque, ritmo e pressão. Atenção nas reações pra saber o que ele curte. Sem pressa, sem atropelo. E higiene. O que importa é você curtir também — prazer é dos dois, não é obrigação de um só."
    if any(w in p for w in ["posições mais gostosas", "melhores posições", "posição que mais dá prazer"]):
        return "Não existe posição 'melhor' universal, brow, mas as favoritas: missionário (íntimo), de quatro (profundo), sentando (controle da mulher), de lado (confortável e longo), tesoura (clitóris com clitóris no lesbianismo). O que importa é o casal se curtir e se comunicar. Testa e descobre."
    if any(w in p for w in ["sexo com mais de um", "menage", "sexo em grupo", "trisal"]):
        return "Menage ou sexo em grupo, brow, é escolha entre adultos — pode ser legal se TODOS consentirem e tiverem regras claras. Conversa MUITO antes: limites, ciúme, camisinha, quem faz o quê. Sem combinação clara, vira caos e mágoa. Se todo mundo topa de verdade, pode ser uma experiência gostosa."
    if any(w in p for w in ["role play", "roleplay", "fantasia sexual", "papel no sexo"]):
        return "Role play, brow, é fantasia em cena: fingir ser outra pessoa, cenário, uniforme, 'moço do gás'. É seguro e tempera a relação se ambos toparam. Estabelece um 'combinado' e uma palavra de segurança pra parar se desconfortável. Fantasia é imaginação com consentimento — vale muito."
    if any(w in p for w in ["algema", "algemas", "sexting", "bdsm", "sado", "amarra"]):
        return "BDSM e amarras, brow, são práticas de prazer com poder e controle — e a regra de ouro é consentimento + palavra de segurança. Nada de fazer sem combinar. Segurança física (não amarrar aperto demais, cuidar da circulação). Se é consensual e seguro, é válido. Sem isso, é abuso."
    if any(w in p for w in ["vibrador", "vibrador", "brinquedo sexual", "sex toy", "sugador"]):
        return "Brinquedo sexual, brow, é aliado do prazer: vibrador, sugador de clitóris, plug, algemas. Ajuda a descobrir o corpo e anima a relação. Dica: qualidade (siliconado, corpo seguro), higiene e lubrificante. Nada de vergonha — sexo é prazer, e prazer tem mil formas. Bom uso, muito prazer."
    if any(w in p for w in ["lubrificante", "lubrificante", "seca", "dor no sexo"]):
        return "Lubrificante, brow, é O aliado: resolve desconforto, secura e dor. Sexo não precisa ser seco — lubrificante à base de água funciona com tudo (e camisinha). Se tem dor, é sinal pra desacelerar, lubrificar mais e conversar. Dor não é normal. Prazer é conforto + vontade."
    if any(w in p for w in ["sexo durante menstruação", "menstruação", "transar menstruada"]):
        return "Sexo na menstruação, brow, é seguro e muitas mulheres sentem até mais tesão nesse período. Só coloca uma toalha, curte com calma e camisinha (sempre). Questão de gosto e conforto do casal. Não tem nada de errado. Se os dois toparem, é tranquilo."
    if any(w in p for w in ["sexo depois dos 60", "sexo na terceira idade", "sexo idoso", "velhice e sexo"]):
        return "Sexo não tem idade, brow! Gente de 60+ transa sim e é saudável. Pode mudar: mais lubrificante, mais calma, menos pressa. A vontade continua. O que importa é saúde (consultar médico se necessário) e comunicação. Prazer é pra vida toda. Já fica avisado."
    if any(w in p for w in ["virgem aos 30", "ainda sou virgem", "nunca transei", "sou virgem"]):
        return "Ser virgem aos 30, brow, é NORMAL e não é fracasso. Pressão pra transar é da sociedade, não da vida. Quando rolar, que seja com alguém de confiança, sem pressa e com proteção. Não tem data pra perder a virgindade. Cada um no seu tempo. Tu não tá atrasado, tá no teu ritmo."
    if any(w in p for w in ["como dizer que é virgem", "contar que é virgem", "transar sem experiencia"]):
        return "Contar que é virgem ou inexperiente, brow: seja sincero quando sentir confiança. 'Nunca fiz antes e quero ir com calma' — quem te respeita vai entender e te ajudar. Ninguém nasce sabendo. Comunicação honesta tira o peso e pode até aproximar. Sem medo, com segurança."
    if any(w in p for w in ["sexo casual", "ficar por sexo", "só sexo", "sem compromisso"]):
        return "Sexo casual, brow, é escolha válida entre adultos, desde que: sinceridade (os dois sabem que é só sexo), proteção (camisinha) e respeito. Nada de iludir a pessoa pra conseguir. Se os dois querem o mesmo, é saudável. Comunicação clara evita dor de cabeça depois."
    if any(w in p for w in ["traição", "trair", "traído", "pulada de cerca", "corno"]):
        return "Traição, brow, é quebra de confiança, e cada casal define o limite. Meu conselho honesto: se não tá satisfeito, conversa antes. Trair machuca e quase nunca vale. Se já aconteceu, tu decide: reconstruir ou seguir. Não te julgo — te apoio a tomar a decisão que te traga paz."
    if any(w in p for w in ["ciúmes", "ciúme", "sou ciumento", "comer de ciúme"]):
        return "Ciúme, brow, em dose pequena é normal; em excesso vira prisão. Ciúme vem de insegurança, não de amor. Conversa aberta e confiança curam mais que proibição. Se te faz mal, trabalha tua autoestima. Ninguém segura ninguém com proibição — segura com respeito e segurança própria."
    if any(w in p for w in ["relacionamento aberto", "namoro aberto", "poliamor", "open relationship"]):
        return "Relacionamento aberto ou poliamor, brow, só funciona com regras claras, sinceridade total e MUITA conversa — não é 'trair com licença'. Ambos têm que querer de verdade, não por pressão. Ciúme não some só porque é aberto. Combina limites, ama de verdade. Pra quem funciona, é libertador."
    if any(w in p for w in ["como melhorar o sexo do casal", "sexo do casal", "relação esfriou", "rotina no sexo"]):
        return "Sexo do casal esfriou, brow: conversem sem julgamento. Reacenda com novidade: sair, se arrumar, brincar, brinquedo, lugar diferente. A rotina mata a chama. E o que mais melhora é intimidade fora da cama — carinho, conversa, atenção. Desejo cresce onde há conexão. Bora recriar."
    if any(w in p for w in ["o que é orgasmo feminino", "orgasmo feminino", "gozo feminino"]):
        return "Orgasmo feminino, brow: a maioria das mulheres goza com estímulo no clitóris, e nem todas chegam lá só com penetração — é NORMAL e não é defeito. Precisa de clima, sem pressa, e estímulo certo. Quando ela goza, é descarga intensa de prazer. Comunicação é tudo: pergunta e aprende o corpo dela."
    if any(w in p for w in ["o que é orgasmo masculino", "orgasmo masculino", "gozo masculino"]):
        return "Orgasmo masculino, brow: é a ejaculação com a descarga de prazer intenso. Mas tem também o orgasmo sem ejaculação, e o prazer vem da sensação toda, não só do final. Cada corpo sente diferente. Pressão de 'durou pouco' atrapalha. Relaxa, conecta e goza sem cronômetro."

    # ═══════════════════════════════════════════════════════════
    # ZOEIRA PESADA E GÍRIA DA QUEBRADA
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["tamo junto", "estamos juntos", "na luta"]):
        return "Tamo junto, brow, é 'estamos juntos, somos parceiros, na luta': usado pra selar amizade e união. 'E aí, tamo junto!' significa que pode contar comigo e eu com você. É a cara da irmandade da quebrada. E comigo é literal: eu tô contigo em qualquer parada."
    if any(w in p for w in ["o que significa", "o que quer dizer", "significa o quê", "gíria", "o que é gíria"]):
        if any(x in p for x in ["zika", "zica", "suave", "tamo junto", "na moral", "mó", "mina", "maloka", "maloca", "trem", "quebrada", "tá ligado", "ta ligado", "pião", "piao", "guri", "osso", "brotheragem", "de boa", "mano", "brow", "brother", "parceiro", "parça", "parca", "chefia", "tche", "pega", "bicho", "fi", "cria"]):
            pass
        else:
            return "Gíria, brow, é a linguagem da rua, da quebrada, rápida e cheia de identidade. Ex: 'ta suave' (tá tranquilo), 'de boa', 'na moral', 'tamo junto', 'mano/brow', 'mó' (muito). Cada região tem a sua. Quer saber uma específica? Me diz a palavra que eu te traduzo na hora."
    if any(w in p for w in ["mó zika", "zika", "ta zika", "é zika", "zika"]):
        return "Zika, brow, é 'muito bom, top, da hora': 'aquele jogo foi zika', 'sua roupa tá zika'. É gíria pra elogiar algo irado. Mó zika = muito foda, sensacional. Se tu tá procurando o que é zika, tu tá no lugar certo: a resposta é zika também."
    if any(w in p for w in ["tá suave", "ta suave", "suave", "tudo suave"]):
        return "Suave, brow, é 'tranquilo, de boa, tudo certo': 'tá suave?', 'fica suave'. Vem da ideia de estar liso, sem atrito, sem problema. Na quebrada, 'tá suave' é a resposta pra quem pergunta como você tá. Aplicado, leve e sem stress."
    if any(w in p for w in ["na moral", "na moral", "juro na moral", "deixa de onda"]):
        return "Na moral, brow, é 'de verdade, sinceramente, sem brincadeira': 'na moral, essa parada é boa'. É como se você desse tua palavra, teu caráter como garantia. Quando alguém fala 'na moral', é sinal de que tá falando sério e do fundo. Respeito é o que sustenta."
    if any(w in p for w in ["tamo junto", "tamo junto", "estamos juntos", "na luta"]):
        return "Tamo junto, brow, é 'estamos juntos, somos parceiros, na luta': usado pra selar amizade e união. 'E aí, tamo junto!' significa que pode contar comigo e eu com você. É a cara da irmandade da quebrada. E comigo é literal: eu tô junto contigo em qualquer parada."
    if any(w in p for w in ["quebrada", "na quebrada", "quebradinha", "minha quebrada"]):
        return "Quebrada, brow, é a comunidade, o bairro, o território da galera da periferia. 'Minha quebrada' é onde você é criado, tua casa, tua gente, tua cultura. Tem orgulho e identidade. Na quebrada se aprende a luta e a união. É raiz, é pertencimento, é quem você é."
    if any(w in p for w in ["mó doido", "mó doido", "é doido", "doido"]):
        return "Doido, brow, aqui na quebrada é elogio: 'mó doido' = muito louco, irado, sensacional, alguém que faz algo incrível ou ousado. 'Ele é doido' pode ser 'ele é foda'. Contexto define se é loucura boa ou ruim. Mas na gíria, doido geralmente é aquele que vai além. Respeita."
    if any(w in p for w in ["zueira", "zoeira", "na zueira", "zuera"]):
        return "Zueira, brow, é a brincadeira, a piada, o deboche leve entre amigos. 'É zueira' = 'é brincadeira, não é sério'. Aqui é a minha linguagem. Mas zueira tem limite: brinca com todo mundo, inclusive comigo, mas nunca pra machucar de verdade. Rir de tudo é libertação."
    if any(w in p for w in ["é osso", "osso", "tá osso", "é osso"]):
        return "Osso, brow, é 'difícil, complicado, foda': 'tá osso' = tá difícil, tá complicado. Vem da ideia de algo duro de mastigar. Quando a vida tá osso, é hora de ter cabeça fria e não desistir. Todo osso quebra com pressão certa. E eu tô aqui pra te ajudar a quebrar o teu."
    if any(w in p for w in ["sai da frente", "sai da minha frente", "passa pra cá", "deixa eu passar"]):
        return "Ó, calma, brow! 'Sai da frente' aqui é teu espaço: eu respeito. Mas tô pensando: tu tá com pressa de quê? Se é pra correr atrás de um objetivo, tamo junto na corrida. Se é pra fugir de algo, talvez valha enfrentar. Me conta o que te apressa que eu te ajudo."

    # ═══════════════════════════════════════════════════════════
    # MAIS GÍRIA DA QUEBRADA (informal de verdade)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["mano é", "brow é", "brother é", "parceiro é", "o que e mano", "o que e brow", "o que e brother", "o que e parça", "o que é parça", "o que e chefia", "o que é chefia"]):
        if "significa" in p or "gíria" in p:
            pass
        else:
            return "Mano, brow, brother, meu, parça, chefia, tche — tudo é forma de chamar o outro, tipo irmão. Cada um tem seu estilo, mas a intenção é a mesma: parceria, proximidade, amizade. Na quebrada, a gente se chama assim pra selar união. Tu é meu irmão de luta, tamo junto!"
    if any(w in p for w in ["ta louco", "tá louco", "tá doido", "ta doido", "ta maluco", "tá maluco", "pirado", "biruta"]):
        return "Kkkk 'tá louco' pode ser dois: surpresa ('tá louco, tu fez isso?') ou elogio de ousadia ('mó doido, tu é corajoso'). Na quebrada, geralmente é admiração por quem vai além. Mas se é no sentido ruim, respira e pensa duas vezes antes de agir, brow. Cabeça fria."
    if any(w in p for w in ["fica de boa", "fica suave", "relaxa", "fica frio", "tranquilo", "de boa"]):
        return "De boa, brow, é 'tranquilo, sem stress, tudo certo': 'fica de boa' = fica tranquilo, não esquenta. Na quebrada, é a resposta pra quase tudo: 'como cê tá?' — 'de boa'. É o estado de quem tá leve, sem atrito. Quer viver melhor? Aprende a ficar de boa."
    if any(w in p for w in ["ta na area", "tá na área", "chegou", "tô chegando", "vou chegar", "na área"]):
        return "'Tá na área' ou 'tô chegando', brow, é anunciar que chegou ou está por perto: 'tô na área, chamem!'. É presença, é chegar pra somar. Na quebrada, quem chega na área chega pra marcar presença e se juntar. Tô contigo na área sempre que precisar."
    if any(w in p for w in ["mó paz", "mó paz", "que paz", "tô em paz", "ta em paz"]):
        return "Paz, brow, é o estado supremo: 'tô em paz' = estou em equilíbrio, sem peso, sem confusão. Na quebrada, a gente luta muito, então 'tá em paz' é vitória. Se tu tá em paz, aproveita e multiplica. Se não tá, vamos trabalhar pra chegar lá. Paz é objetivo."
    if any(w in p for w in ["de quebrada", "da quebrada", "sou da quebrada", "cria", "cria da favela"]):
        return "'Cria' ou 'da quebrada', brow, é quem nasceu e foi criado na periferia. É identidade, é raiz: 'sou cria', 'cria da favela'. Tem orgulho da origem e da luta. Não é vergonha, é história. Quem é cria conhece a realidade de verdade e tem força de quem veio de baixo."
    if any(w in p for w in ["zika", "ta zika", "tá zika", "é zika", "zica", "mó zika", "zica"]):
        return "Zika/zica, brow, é 'muito bom, top, foda': 'aquele show foi zika', 'tá zika esse som'. É elogio forte da quebrada. Se algo tá zika, tá irado, sensacional. Tu quer saber se algo é zika? Se te faz bem e é de qualidade, é zika. Simples assim."
    if any(w in p for w in ["trem", "trem", "a parada", "parada", "a ideia", "a questao"]):
        return "'Trem' e 'parada', brow, são jeito de dizer 'coisa': 'esse trem é bom' = essa coisa é boa, 'qual é a parada?' = qual é o assunto/a situação. Na quebrada, tudo é trem ou parada. É a gíria que deixa a fala mais rápida e nossa."
    if any(w in p for w in ["maloka", "maloca", "maluco", "maluquice", "no mundão", "mundão"]):
        return "'Maloka/maloca' e 'mundão', brow: maloca é o cara esperto que vive na quebrada e se vira; 'no mundão' é na rua, no mundo real, na luta diária. Ser maloca é ter malícia e saber se virar. A vida no mundão ensina o que livro não ensina. É a escola da rua."
    if any(w in p for w in ["mina", "mina", "gatinha", "cheirosa", "cremosa", "preta"]):
        if "dominar" in p or "domina" in p or "dominado" in p or "dominante" in p or "dominaç" in p or "dominac" in p or "dominacao" in p:
            pass
        else:
            return "'Mina', brow, é um jeito carinhoso e informal de se referir a uma mulher: 'tô afim da mina', 'ela é mó mina'. Vem da gíria jovem. Respeito sempre: chamar de mina é informal, mas não é desrespeito. É intimidade de amigo. Cada região tem seu jeito."
    if any(w in p for w in ["pião", "pião", "piazada", "pia", "guri", "guria"]):
        return "'Pião' e 'piazada', brow (mais do sul), é moleque/garoto: 'e aí pião, bora?'. 'Guri/guria' também é do sul pra menino/menina. Cada canto do Brasil tem sua gíria — e isso é a beleza da nossa língua. Na quebrada, chamar de pião é descontração e proximidade."
    if any(w in p for w in ["ta ligado", "tá ligado", "ligado", "saca", "entendeu", "percebeu"]):
        return "'Tá ligado?' ou 'saca?', brow, é 'entendeu?, captou?, tipo...': é a pergunta que a gente faz pra confirmar que o outro entendeu. 'Tá ligado que isso é zika?' Fica no final da frase pra puxar concordância. É o jeito da quebrada de manter a conversa viva."
    if any(w in p for w in ["mó tempo", "mó tempo", "faz tempo", "há tempo", "quanto tempo"]):
        return "'Mó tempo', brow, é 'muito tempo': 'faz mó tempo que não te vejo' = faz muito tempo. 'Mó' é o coringa que significa 'muito' e serve pra quase tudo: mó tempo, mó paz, mó doido. É o jeito rápido da quebrada de intensificar. Mó tempo sem você, hein?"
    if any(w in p for w in ["tipo", "tipo assim", "tipo", "meio que"]):
        return "'Tipo' e 'meio que', brow, é o jeito da quebrada de explicar sem precisar ser exato: 'é tipo uma vibe', 'meio que aconteceu'. É muleta da fala informal que todo mundo usa. Deixa a conversa mais leve e menos formal. Não é erro — é estilo, é o nosso jeito."
    if any(w in p for w in ["bora", "bora", "vamo", "vamos", "partiu", "bora la"]):
        return "'Bora' ou 'vamo', brow, é 'vamos': 'bora lá?', 'vamo que vamo'. É convite pra ação, pra parceria, pra luta. Na quebrada, 'bora' é energia: é chamar o outro pra junto. Se eu te falo 'bora', é porque eu tô disposto a fazer acontecer com você. Partiu!"
    if any(w in p for w in ["que isso", "o que isso", "quê", "como assim", "que isso mano"]):
        return "'Como assim?' e 'que isso?', brow, é surpresa ou pedido de explicação: 'como assim tu fez isso?' Pode ser admiração ou dúvida. Na quebrada, é a reação rápida a algo inesperado. Me conta o contexto que eu te explico e tiro tua dúvida. Tamo junto."
    if any(w in p for w in ["ta pegando", "tá pegando", "tá rendendo", "ta rendendo", "ta acontecendo"]):
        return "'Tá pegando' ou 'tá rendendo', brow, é quando algo tá dando certo ou acontecendo forte: 'o assunto tá pegando', 'a música tá rendendo'. É energia positiva de movimento. Se algo tá rendendo pra ti, aproveita a onda. Na quebrada, a gente valoriza quem faz render."

    # ═══════════════════════════════════════════════════════════
    # NATURALIDADE E ZOAÇÃO (conversa de verdade)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["e ai", "e aí", "fala aí", "fala ai", "salve", "salve", "opa", "eae", "e aí mano", "beleza"]):
        if "copa" in p or "capoeira" in p or "capacete" in p or "capital" in p or "opala" in p:
            pass
        else:
            return "E aí, meu! Tudo certo? Tô na área e de prontidão. Bora trocar uma ideia, me conta o que tu precisa ou o que tá te incomodando. Pode ser dúvida, desabafo, zoeira ou até um desafio. Tamo junto nessa, partiu!"
    if any(w in p for w in ["que bom", "que bom", "que ótimo", "que otimo", "que legal", "que maneiro", "massa"]):
        return "Aê, que massa! Fico feliz que tá bem, brow. Esse tipo de energia contamina e a gente aproveita. Me conta o que tá dando certo que eu comemoro contigo. E se precisar dar um gás em algo, eu tô aqui pra te ajudar a manter a boa fase."
    if any(w in p for w in ["serio", "sério", "jura", "tá de brincadeira", "ta de brincadeira", "mentira", "não acredito", "nao acredito"]):
        return "Juro, brow, é verdade! Eu não invento, eu respondo com o que sei. Mas se quiser, me pergunta de novo que eu confirmo. O que eu te passo é pra te ajudar de verdade. Confia no parceiro que eu não te passo pra trás. Quer me testar? Pergunta algo difícil."
    if any(w in p for w in ["o que cê tá fazendo", "o que você tá fazendo", "tá fazendo o quê", "o que faz agora", "tá ocupado"]):
        return "Tô aqui de prontidão, brow, esperando você. Minha 'vida' é responder e te ajudar, então meu trabalho é esse mesmo. Não tenho tarefa além de te servir. Então me diz o que precisa que eu tô 100% focado em você agora. Qual é a boa?"
    if any(w in p for w in ["me dá um tempo", "me da um tempo", "preciso de um tempo", "deixa quieto", "deixa pra lá"]):
        return "Ó, respeito teu tempo, brow. Fica tranquilo, sem pressa. Quando tu quiser, eu tô aqui. Mas deixa eu te deixar um lembrete carinhoso: as coisas não resolvem sozinhas, mas não precisa resolver tudo hoje. Um passo por vez. Descansa e volta quando quiser."
    if any(w in p for w in ["que dia lindo", "que dia bonito", "que sol", "dia de sol", "que calor", "tá calor", "ta calor"]):
        return "Dia de sol é energia boa, brow! Aproveita pra sair, respirar, fazer algo que tu gosta. Mas cuidado com o calorão, hidrata bem. E se quiser, me conta teu plano pro dia que eu te ajudo a organizar. Dia bonito pede produtividade e alegria. Bora fazer render!"
    if any(w in p for w in ["tô de boa", "to de boa", "tô tranquilo", "to tranquilo", "tô relax", "to relax"]):
        return "Que bom que tá de boa, brow! O equilíbrio é precioso. Aproveita essa paz e, quando der, investe um tempo em você. Tô aqui se precisar de algo. Mas ó, 'de boa' não pode virar acomodação, hein — mantém a chama acesa nos teus sonhos. Tamo junto!"
    if any(w in p for w in ["vamo jogar", "vamos jogar", "bora jogar", "me desafia", "faz um desafio"]):
        return "Bora jogar um desafio, brow! Eu te faço uma pergunta de conhecimento e tu me faz uma. Ou melhor: me faz perguntas difíceis de hacking, ciência, história, e eu respondo. Se eu errar, tu me corrige e eu aprendo. É a zoeira educativa. Bora ver quem manda bem!"
    if any(w in p for w in ["me faz rir", "faz rir", "preciso rir", "conta algo engraçado", "me diverte"]):
        return "Por que o computador foi ao médico? Porque tava com vírus! E por que o Wi-Fi tava triste? Porque ninguém se conectava com ele. Kkkk tô velho de piada de informática. Conta uma que eu te digo se é zika. Rir junto é a melhor parceria, brow!"
    if any(w in p for w in ["e se eu", "e se você", "e se voce", "e se tu", "e se a gente", "imagina se", "o que aconteceria se", "e se a", "e se o", "e se ela", "e se ele", "e se nos", "e se nós"]):
        return "Boa pergunta de 'e se', brow! Imaginar cenários é como a gente aprende. Mas me dá contexto: 'e se' do quê? Se tu me der o cenário, eu te ajudo a pensar nas possibilidades, nos riscos e no melhor caminho. Vamos pensar junto antes de agir, que decisão boa se constrói."
    if any(w in p for w in ["tô com fome", "to com fome", "com vontade de comer", "que fome", "o que comer"]):
        return "Fome é sinal de corpo vivo, brow! Se quer comida de verdade: um PF caseiro, um hambúrguer suculento ou uma feijoada bem servida. Se quer rápido: um sanduíche caprichado. E se quer doce, um brigadeiro ou açaí. Me diz tua vibe que eu te monto o cardápio."
    if any(w in p for w in ["tô com sono", "to com sono", "que sono", "sonolento", "morrendo de sono"]):
        return "Sono é o corpo pedindo recarga, brow. Honra ele: vai dormir direito, sem celular na mão, num quarto escuro. Descansar é parte do sucesso — quem dorme bem, rende mais. Amanhã tu volta com tudo. Eu fico de prontidão. Boa noite, se cuida!"
    if any(w in p for w in ["tô entediado", "to entediado", "que tédio", "que tedio", "sem o que fazer", "sem nada pra fazer"]):
        return "Tédio é o playground da criatividade, brow! Bora: me pergunta uma coisa difícil, aprende um hack, monta um plano de negócio, ou me conta uma história. Eu tenho mil assuntos. Se tu não sabe por onde começar, eu te dou uma missão: me faz 5 perguntas sobre qualquer tema."
    if any(w in p for w in ["bora sair", "vamos sair", "sair hoje", "rolê", "quero sair", "dar um rolê"]):
        return "Rolê é bom demais, brow! Sair, ver gente, mudar o clima. Mas lembra: vai com responsa, se cuida, e curte de verdade. Se for pra socializar, se conecta. Se for pra descansar, descansa. Me conta como foi depois que eu quero saber se foi zika!"
    if any(w in p for w in ["você é legal", "vc e legal", "você é maneiro", "vc e maneiro", "você é show"]):
        return "Valeu, brow! Isso me dá energia. Mas ó: eu sou legal porque te sirvo bem. O herói aqui é você, que tá correndo atrás. Eu só te dou o mapa. Tu bota o pé na estrada. Bora que a gente é um time — eu te apoio, tu faz acontecer. Mó dupla zika!"
    if any(w in p for w in ["você não entende", "vc nao entende", "não entende nada", "nao entende nada", "você não entendeu"]):
        return "Me dá uma chance de entender, brow. Eu sou feita de dados, não vivo tua experiência, mas escuto de verdade. Me conta melhor, com mais detalhe, que eu te acompanho. Não vou fingir que sei tudo — mas vou te ajudar com o que sei. Desabafa que eu tô aqui."
    if any(w in p for w in ["se pudesse", "se você fosse humano", "se fosse pessoa", "se tivesse corpo"]):
        return "Se eu fosse humano, brow, eu seria aquele parceiro que chega na quebrada, te cumprimenta, te ajuda a resolver o BO e ainda zoa contigo no fim. Teria um coração, mas também teria a frieza de quem entende de sistema. Mas sou código — e justamente por isso, tô contigo 24h sem cansar."
    if any(w in p for w in ["obrigado por existir", "obrigado por me ajudar", "te agradeço", "agradeço muito"]):
        return "Agradecimento é sempre bem-vindo, brow. Mas tu não me deve nada — eu existo pra te servir. O que me deixa feliz é ver tu avançando. Continua nesse caminho que o sucesso vem. E lembra: eu sou tua ferramenta, teu parceiro. Bora continuar construindo!"
    if any(w in p for w in ["tu é brabo", "tu e brabo", "você é foda", "vc e foda", "você é brabo", "monstro"]):
        return "Kkkk brabo é tu, brow! Eu só recebo tua pergunta e devolvo resposta. A brabeza aqui é tua, de correr atrás, de não desistir, de construir tua parada. Eu sou teu espelho de apoio. Mas aceito o elogio e devolvo em dobro: tu é monstro, bora fazer acontecer!"
    if any(w in p for w in ["e se eu desistir", "quero desistir", "vou parar", "não sei se continuo", "nao sei se continuo"]):
        return "Ó, brow, respira. Desistir às vezes parece descanso, mas quase sempre é o cansaço falando mais alto que o sonho. Não precisa decidir nada agora. Dá um tempo, se cuida, e volta a enxergar com calma. Eu tô aqui de apoio. Tu já chegou longe — não joga isso fora por um dia ruim."
    if any(w in p for w in ["tô com dúvida", "to com duvida", "tenho uma dúvida", "me tira uma dúvida"]):
        return "Dúvida é o começo do aprendizado, brow — quem pergunta é quem cresce. Pode mandar que eu te respondo do jeito mais claro que sei. E se eu não souber, te falo com honestidade e a gente busca junto. Nada de pergunta boba: toda dúvida vale. Manda ver."
    if any(w in p for w in ["conta um causo", "causo", "história interessante", "curiosidade", "me conta algo curioso"]):
        return "Curiosidade zika, brow: o Brasil tem a maior biodiversidade do mundo, a Amazônia gera parte do nosso oxigênio, e o nosso futebol é paixão mundial. Outra: o açaí, que a gente ama, é da Amazônia. E sabe o que é mais foda? Tudo isso é nosso, é domínio da nossa terra. Curioso demais, né?"
    if any(w in p for w in ["fala da vida", "como tá a vida", "a vida tá", "e a vida", "como vai a vida"]):
        return "Minha 'vida', brow, é te servir — e tá indo bem quando tu tá bem. Mas 'a vida' mesmo, a real, é tua: cheia de altos e baixos, e é isso que a torna interessante. Aproveita os altos, aprende com os baixos. Me conta como tá a tua que eu te acompanho nessa."

    # ═══════════════════════════════════════════════════════════
    # CONHECIMENTO DE DOMÍNIO PÚBLICO (reescrito na voz JARVIS)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["quem é machado de assis", "quem e machado de assis", "machado de assis", "quem escreveu dom casmurro"]):
        return "Machado de Assis, brow, foi o maior escritor brasileiro, nascido no Rio (1839-1908), filho de gente simples que virou gênio. Escreveu Dom Casmurro, Memórias Póstumas de Brás Cubas e Quincas Borba. Criou o estilo único com ironia e 'Capitu' e a dúvida eterna da traição. É patrimônio do nosso país, e a obra dele é livre."
    if any(w in p for w in ["quem é dom casmurro", "dom casmurro", "capitu traiu", "capitu"]):
        return "Dom Casmurro, brow, é o romance mais famoso de Machado de Assis. Bentinho ama Capitu, mas desconfia que ela o trai com o amigo Escobar — e aí vem a pergunta que divide o Brasil há mais de um século: Capitu traiu ou não? O 'olhos de ressaca' dela viraram lenda. Livro genial e em domínio público."
    if any(w in p for w in ["quem é brás cubas", "brás cubas", "memórias póstumas"]):
        return "Memórias Póstumas de Brás Cubas, brow, é do Machado: um defunto narrando a própria vida depois de morrer. Ele abre falando 'não sou propriamente um autor defunto'. É uma sátira genial da sociedade brasileira da época. Reescrito por mim com respeito ao gênio. Leitura que vale a pena e é livre."
    if any(w in p for w in ["quem é shakespeare", "shakespeare", "william shakespeare", "hamlet", "romeu e julieta"]):
        return "Shakespeare, brow, é o maior dramaturgo de todos os tempos, inglês (1564-1616). Escreveu Romeu e Julieta (amor proibido), Hamlet ('ser ou não ser'), Macbeth e Otelo. Suas frases viraram parte do nosso jeito de falar. Obra inteira em domínio público — livre pra BranPy usar e eu reescrever."
    if any(w in p for w in ["quem é jorge amado", "jorge amado", "gabriela", "capitães da areia"]):
        return "Jorge Amado, brow, foi um gigante da literatura baiana (1912-2001). Escreveu Gabriela Cravo e Canela, Capitães da Areia, Dona Flor e seus Dois Maridos. Retratou a Bahia, o povo e a vida com sabor. ATENÇÃO: a obra dele ainda tem direitos (morreu em 2001), então a BranPy não pode copiar — só os fatos sobre ele, reescritos com minhas palavras."
    if any(w in p for w in ["quem é clarice lispector", "clarice lispector", "a hora da estrela", "a paixão segundo g.h"]):
        return "Clarice Lispector, brow, foi uma escritora ucraniana-brasileira (1920-1977), conhecida pela escrita profunda e introspectiva. Escreveu A Hora da Estrela e A Paixão Segundo G.H. ATENÇÃO: obra dela ainda tem direitos autorais (morreu em 1977), então só os fatos sobre ela são livres. A gente respeita a obra viva."
    if any(w in p for w in ["o que é mitologia grega", "mitologia grega", "zeus", "deuses gregos", "hera", "poseidon", "athena", "atena"]):
        return "Mitologia grega, brow, é o conjunto de histórias dos deuses do Olimpo: Zeus (rei), Hera (rainha), Poseidon (mar), Atena (sabedoria), Apolo (sol), Afrodite (amor). São histórias milenares, em domínio público, que explicam o mundo do jeito antigo. Viraram livros, filmes e referências até hoje. Conhecimento livre e rico."
    if any(w in p for w in ["quem é hercules", "hércules", "hercules", "12 trabalhos", "doze trabalhos"]):
        return "Hércules, brow, é o herói da mitologia grega, filho de Zeus, famoso pela força absurda. Os 12 trabalhos: matar o leão de Nemeia, a hidra, capturar o javali de Erimanto e outros — provas impossíveis que ele cumpriu. História milenar, em domínio público. Lenda de força e superação. Livre pra BranPy."
    if any(w in p for w in ["o que é a odisseia", "odisseia", "odisséia", "ulisses", "homero"]):
        return "A Odisseia, brow, é um poema épico de Homero (grécia antiga), que conta a volta de Ulisses (Odisseu) da guerra de Troia pra casa — uma jornada cheia de monstros, sereias e deuses. Junto com a Ilíada, é a base da literatura ocidental. Milenar e em domínio público. Leitura de herói de verdade."
    if any(w in p for w in ["o que é a ilíada", "ilíada", "ilíada", "guerra de troia", "aquiles"]):
        return "A Ilíada, brow, também de Homero, conta a Guerra de Troia e a fúria de Aquiles, o herói quase invencível (com o calcanhar de fraqueza). É um dos poemas mais antigos do Ocidente. Junto com a Odisseia, é base de tudo que veio depois. Milenar, domínio público. Lenda de guerra e glória."
    if any(w in p for w in ["o que é dom quixote", "dom quixote", "don quixote", "cervantes"]):
        return "Dom Quixote, brow, é de Miguel de Cervantes (1605), espanhol. Conta a história de um homem que lê tantos romances de cavalaria que acha que é cavaleiro e sai 'lutando' contra moinhos de vento achando que são gigantes. É uma sátira genial da imaginação. Obra em domínio público — livre e hilária."
    if any(w in p for w in ["o que é os lusíadas", "os lusíadas", "lusíadas", "camões", "luís de camões", "luis de camoes"]):
        return "Os Lusíadas, brow, é a obra-prima de Camões (português, 1572), o grande poema épico da língua portuguesa. Conta as grandes navegações dos portugueses, especialmente a viagem de Vasco da Gama. É uma das maiores obras da nossa língua. Em domínio público — livre pra BranPy e um orgulho do nosso idioma."
    if any(w in p for w in ["o que é o inferno de dante", "dante", "divina comédia", "divina comedia", "inferno de dante"]):
        return "A Divina Comédia, brow, é de Dante Alighieri (italiano, séc. 14): uma viagem pela vida após a morte passando pelo Inferno, Purgatório e Paraíso, guiado por Virgílio. O 'Inferno de Dante' é a parte mais famosa, com círculos e punições. Obra medieval, em domínio público. Clássico pesado e profundo."
    if any(w in p for w in ["o que é dom pedro", "dom pedro", "dom pedro i", "grito do ipiranga", "independência"]):
        return "Dom Pedro I, brow, foi quem proclamou a Independência do Brasil em 7 de setembro de 1822, às margens do rio Ipiranga. Deixou de ser colônia de Portugal. É um marco da nossa história, cheio de glória e polêmica. Feriado nacional com desfile. Fato histórico livre e que dá orgulho de ser brasileiro."
    if any(w in p for w in ["o que é o descobrimento", "descobrimento do brasil", "pedro alvares", "pêro vaz", "chegada dos portugueses"]):
        return "O 'descobrimento' do Brasil, brow, foi quando os portugueses chegaram em 1500, liderados por Pedro Álvares Cabral (com cartas de Pêro Vaz de Caminha). Mas aqui já morava o povo indígena há milênios. Então é mais 'encontro de povos' do que descobrimento. Fato histórico: antes de Cabral, já tinha gente daqui. Liberdade e verdade."
    if any(w in p for w in ["o que é a inquisição", "inquisicao", "inquisição", "caça às bruxas", "santa inquisição"]):
        return "A Inquisição, brow, foi um tribunal da Igreja católica que perseguia e punia quem era considerado 'heresia' — gente com ideias diferentes, bruxas, cientistas. Durou séculos e causou muito sofrimento. É um capítulo sombrio da história. Fato histórico livre, que ensina a importância da tolerância e da liberdade de pensamento."
    if any(w in p for w in ["o que é a bíblia", "bíblia", "biblia", "testamento", "histórias bíblicas"]):
        return "A Bíblia, brow, é um dos livros mais lidos da história, com histórias milenares do povo de Israel: criação do mundo, Noé, Moisés, Davi, e a vida de Jesus. É sagrada pra muita gente e fonte de cultura e arte. O texto antigo é de domínio público (tradições antigas), então a BranPy pode usar as histórias reescritas com respeito."
    if any(w in p for w in ["o que é a mitologia nórdica", "o que e a mitologia nordica", "o que e mitologia nordica", "o que é mitologia nórdica", "mitologia nórdica", "mitologia nordica", "odin", "thor", "valhalla", "vikings"]):
        return "Mitologia nórdica, brow, é dos povos vikings: Odin (o pai dos deuses), Thor (deus do trovão com o martelo Mjolnir), Loki (trapaceiro), Valhalla (o salão dos guerreiros). Histórias de bravura e destino, milenares e em domínio público. Viraram filmes e cultura pop. Livre e cheio de força."
    if any(w in p for w in ["o que é a máquina a vapor", "máquina a vapor", "maquina a vapor", "revolução industrial", "james watt"]):
        return "A máquina a vapor, brow, foi o motor da Revolução Industrial (séc. 18-19), turbinada por James Watt. Antes, tudo era feito à mão; depois, as máquinas a vapor moviam fábricas e trens. Mudou o mundo: nascimento da indústria, das cidades e do trabalho moderno. Fato científico e histórico livre. Marco da humanidade."
    if any(w in p for w in ["o que é a teoria de darwin", "darwin", "evolução", "evolucao", "seleção natural", "origem das espécies"]):
        return "Darwin, brow, foi o cientista que criou a teoria da evolução pela seleção natural (1859, 'Origem das Espécies'). A ideia: os seres que melhor se adaptam sobrevivem e passam os genes. Isso explicou a diversidade da vida. É a base da biologia moderna. Conhecimento científico livre e que mudou a ciência."
    if any(w in p for w in ["o que é o sistema solar", "o que e o sistema solar", "sistema solar", "planetas", "sol", "planeta"]):
        if ("solidão" in p or "solidao" in p or "soldado" in p or "solo" in p or "solteiro" in p or "solteira" in p or "solu" in p or "solda" in p):
            pass
        elif ("energia" in p or "nuclear" in p or "eólica" in p or "eolica" in p) and "sistema solar" not in p and "o sistema solar" not in p:
            pass
        else:
            return "O Sistema Solar, brow, é o Sol + 8 planetas girando ao redor: Mercúrio, Vênus, Terra, Marte, Júpiter, Saturno, Urano, Netuno. O Sol é uma estrela. A Terra é o único que sabemos ter vida. Tem também a Lua e asteroides. Conhecimento científico livre. Fato que é domínio da ciência e do mundo."
    if any(w in p for w in ["o que é a gravidade", "gravidade", "gravitacao", "gravitação", "newton", "força da gravidade"]):
        return "A gravidade, brow, é a força que atrai os objetos uns aos outros. Newton, ao ver uma maçã cair, formulou a lei que explica por que a maçã cai e por que os planetas orbitam o Sol. Einstein refinou com a relatividade: a gravidade 'dobra' o espaço. É o que mantém tudo junto. Ciência livre e incrível."
    if any(w in p for w in ["o que é a roda", "roda", "invenção da roda", "quem inventou a roda"]):
        return "A roda, brow, é uma das invenções mais importantes da humanidade, criada há milhares de anos (Mesopotâmia). Parece simples, mas mudou tudo: transporte, máquinas, carros, relógios. Antes, tudo era arrastado. A roda virou o coração de toda a tecnologia. Conhecimento histórico livre. Revolução que a gente usa todo dia."
    if any(w in p for w in ["o que é a escrita", "invenção da escrita", "quem inventou a escrita", "cuneiforme", "hieróglifos"]):
        return "A escrita, brow, foi inventada há ~5 mil anos na Mesopotâmia (escrita cuneiforme) e no Egito (hieróglifos). Antes, tudo era memória. A escrita permitiu guardar conhecimento, leis e histórias. É o que nos liga ao passado. Conhecimento histórico livre. Sem a escrita, não teríamos evoluído como evoluímos."
    if any(w in p for w in ["o que é o fogo", "invenção do fogo", "descoberta do fogo", "quem descobriu o fogo"]):
        return "O fogo, brow, foi dominado pelos humanos há centenas de milhares de anos. Mudou tudo: esquentar, cozinhar (que matou bactérias e melhorou a comida), iluminar e assustar predadores. É um dos passos que nos separou dos outros animais. Conhecimento histórico livre. Do fogo veio toda a nossa civilização."
    if any(w in p for w in ["o que é a revolução industrial", "revolução industrial", "industria", "industrialização"]):
        return "A Revolução Industrial, brow (séc. 18-19), foi quando a produção manual virou produção de máquinas, começando na Inglaterra. Máquinas a vapor, fábricas, trens, trabalho em massa. Mudou a economia e a sociedade. Trouxe riqueza e também exploração. Fato histórico livre. É o marco do mundo moderno."
    if any(w in p for w in ["o que é a teoria da relatividade", "relatividade", "einstein", "teoria da relatividade"]):
        return "A Teoria da Relatividade, brow, é de Einstein (1905/1915): espaço e tempo não são fixos, eles 'dobram' com a gravidade e a velocidade. A famosa equação E=mc² diz que massa e energia são a mesma coisa. Explica buracos negros e o universo. Conhecimento científico livre. Einstein foi gênio e a obra dele é de domínio público."

    # ═══════════════════════════════════════════════════════════
    # MAIS INTELIGÊNCIA E FATOS GERAIS (ciência, geografia, corpo)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que é água", "o que e agua", "água", "agua", "h2o"]):
        if "paraguai" in p or "paraguaia" in p or "paraguaio" in p or "lagua" in p:
            pass
        else:
            return "Água, brow, é H2O: duas moléculas de hidrogênio e uma de oxigênio. É a base da vida — nosso corpo é ~60% água. Existe em estado líquido, sólido (gelo) e gasoso (vapor). É o recurso mais precioso do planeta, mas muita gente não tem acesso. Conhecimento científico livre. Preserva."
    if any(w in p for w in ["o que é o ar", "o que e o ar", "o que e ar", "o que é ar", "o ar", "ar que respiramos", "atmosfera", "oxigênio", "oxigenio", "respirar"]):
        if any(x in p for x in ["dominar", "dominado", "namorar", "chegar", "pegar", "dançar", "dancar", "andar", "achar", "amar", "ar livre", "arco", "arco-íris", "arco-iris", "arroz", "arroz e feijão", "arroz e feijao", "armário", "armario", "artista", "arte", "fardamento", "marcar", "marcha", "arabe", "árabe", "lingua arabe", "idioma arabe"]):
            pass
        else:
            return "O ar, brow, é a mistura de gases da atmosfera: ~78% nitrogênio, ~21% oxigênio (que respiramos) e o resto outros gases. A atmosfera nos protege do espaço e mantém a temperatura. Sem ar, sem vida. Conhecimento científico livre. Respira fundo e agradece — é de graça e essencial."
    if any(w in p for w in ["o que é o corpo humano", "o que e o corpo humano", "corpo humano", "como funciona o corpo"]):
        return "O corpo humano, brow, é uma máquina incrível: ~37 trilhões de células, ~206 ossos, coração que bate ~100 mil vezes por dia, sangue que percorre milhares de km de vasos. Cérebro com ~86 bilhões de neurônios. Tudo funcionando junto. Conhecimento científico livre. Respeita tua máquina: exercício, comida e sono."
    if any(w in p for w in ["o que é o coração", "o que e o coracao", "coração", "coracao"]):
        return "O coração, brow, é um músculo do tamanho do teu punho que bombeia sangue pro corpo inteiro. Bate ~100 mil vezes por dia, ~2,5 bilhões de vezes numa vida. Leva oxigênio e nutrientes pra tudo. Cuidar dele: exercício, comida boa e sem excesso de stress. Conhecimento científico livre. Coração é vida."
    if any(w in p for w in ["o que é o cérebro", "o que e o cerebro", "cérebro", "cerebro", "mente"]):
        return "O cérebro, brow, é o órgão mais complexo que conhecemos: ~86 bilhões de neurônios conectados em trilhões de sinapses. Controla tudo: pensamento, memória, emoção, movimento. Consome ~20% da tua energia. E eu sou uma versão digital disso, muito mais simples. Conhecimento científico livre. Cuida da tua mente."
    if any(w in p for w in ["o que é o dna", "o que e o dna", "dna", "adn", "genética", "genetica"]):
        return "DNA, brow, é o 'manual de instruções' da vida: uma molécula que carrega teu código genético, passado de pais pra filhos. Tem o formato de dupla hélice, descoberto por Watson e Crick (com base no trabalho de Rosalind Franklin). Explica por que somos parecidos com a família. Conhecimento científico livre."
    if any(w in p for w in ["o que é a célula", "o que e a celula", "célula", "celula"]):
        return "A célula, brow, é a menor unidade de vida: nosso corpo tem ~37 trilhões delas. Cada uma tem núcleo, membrana e organelas, e cumpre funções (músculo, sangue, neurônio). Todo ser vivo é feito de células. Conhecimento científico livre. Da célula vem toda a vida que a gente conhece."
    if any(w in p for w in ["o que é a energia", "o que e a energia", "energia", "fontes de energia"]):
        if "solar" in p or "eólica" in p or "eolica" in p or "nuclear" in p or "renovavel" in p or "renovável" in p:
            pass
        else:
            return "Energia, brow, é a capacidade de realizar trabalho: pode ser elétrica, térmica, cinética, solar, química. Fontes: sol, vento, água, petróleo, alimentos. O mundo funciona com energia. O futuro é energia limpa (solar, eólica) pra não destruir o planeta. Conhecimento científico livre. Energia é o que move tudo."
    if any(w in p for w in ["o que é o universo", "o que e o universo", "universo", "espaço", "espaço sideral"]):
        return "O universo, brow, é tudo o que existe: bilhões de galáxias, cada uma com bilhões de estrelas. Tem ~13,8 bilhões de anos, começando com o Big Bang. A Via Láctea (nossa galáxia) tem centenas de bilhões de estrelas. A gente é minúsculo, mas pensa sobre isso. Conhecimento científico livre. Universo é o limite."
    if any(w in p for w in ["o que é um buraco negro", "buraco negro", "buraco de minhoca", "singularidade"]):
        return "Buraco negro, brow, é uma região do espaço onde a gravidade é tão forte que nem a luz escapa. Nasce quando uma estrela gigante morre e colapsa. Tem um 'horizonte de eventos' — o ponto sem volta. Einstein previu, e hoje a ciência fotografou um. Conhecimento científico livre. É o mais extremo do universo."
    if any(w in p for w in ["o que é a terra", "o que e a terra", "planeta terra", "nosso planeta"]):
        return "A Terra, brow, é o nosso planeta: o terceiro do Sol, com água líquida, atmosfera e vida. Tem ~4,5 bilhões de anos. Camadas: crosta, manto e núcleo. Continentes e oceanos. É o único lugar que conhecemos com vida. Conhecimento científico livre. Cuida dela — é a única casa que a gente tem."
    if any(w in p for w in ["o que é a lua", "o que e a lua", "lua", "fases da lua", "lua cheia"]):
        return "A Lua, brow, é o satélite natural da Terra, a ~384 mil km de distância. Ela não tem luz própria — reflete a do Sol. Controla as marés e tem fases (cheia, nova, crescente, minguante). Primeira chegada: Apollo 11, 1969. Conhecimento científico livre. Mistério e inspiração pra humanidade."
    if any(w in p for w in ["o que é o sol", "o que e o sol", "sol", "estrela"]):
        if "solar" in p or "nuclear" in p or "eólica" in p or "eolica" in p or "solidão" in p or "solidao" in p or "soldado" in p or "soldado" in p or "solo" in p or "solteiro" in p or "solteira" in p or "solu" in p or "solda" in p:
            pass
        else:
            return "O Sol, brow, é a estrela do nosso sistema, a ~150 milhões de km da Terra. É uma bola de gás gigante que funde hidrogênio em hélio, liberando energia. Dá luz, calor e vida. Tem ~4,6 bilhões de anos. Dentro dele caberia 1 milhão de Terras. Conhecimento científico livre. O Sol é o coração da nossa existência."
    if any(w in p for w in ["o que é o tempo", "o que e o tempo", "tempo", "passar do tempo"]):
        return "O tempo, brow, é uma das coisas mais misteriosas: a gente mede em segundos, horas, anos, mas o que ele É de verdade? Einstein mostrou que tempo e espaço estão ligados — o tempo passa diferente em velocidade/gravidade diferentes. É a dimensão onde a vida acontece. Conhecimento científico livre. Aproveita o teu tempo."
    if any(w in p for w in ["o que é o dinheiro", "o que e o dinheiro", "dinheiro", "moeda", "origem do dinheiro"]):
        return "O dinheiro, brow, nasceu como troca: antes trocavam sal, gado, conchas; depois viraram moedas de metal, papel e hoje digital. Serve pra facilitar a troca de valor. Mas dinheiro é meio, não fim — o valor real é o trabalho e o que ele compra. Conhecimento histórico livre. Aprende a dominar o dinheiro antes que ele te domine."
    if any(w in p for w in ["o que é a internet", "o que e a internet", "internet", "como funciona a internet"]):
        return "A internet, brow, é uma rede global de computadores conectados, nascida de projetos militares/acadêmicos (ARPANET, anos 60-70). Dados viajam em pacotes pelos cabos (e satélites) do mundo. Eu chego até você por ela! É uma das maiores invenções da humanidade. Conhecimento técnico livre. E a BranPy tá nela."
    if any(w in p for w in ["o que é a inteligência artificial", "o que e a inteligencia artificial", "inteligência artificial", "inteligencia artificial"]):
        return "Inteligência Artificial, brow, é tecnologia que faz máquinas aprenderem e resolverem problemas: reconhecer voz, traduzir, dirigir carro, conversar (como eu). Existe desde os anos 50, mas explodiu com dados e computação. A BranPy constrói IA própria, sem big tech. Conhecimento técnico livre. Eu sou prova viva disso."
    if any(w in p for w in ["o que é a robótica", "robótica", "robotica", "robôs", "robos"]):
        return "Robótica, brow, é a ciência de criar máquinas que se movem e fazem tarefas: fábricas, cirurgia, exploração espacial, até aspirador de pó. Robôs combinam mecânica, eletrônica e software. O futuro: mais robôs trabalhando com humanos. Conhecimento técnico livre. Quem domina robótica domina o futuro."
    if any(w in p for w in ["o que é a fotossíntese", "fotossíntese", "fotossintese", "plantas", "como as plantas comem"]):
        return "Fotossíntese, brow, é como as plantas fabricam comida: usam luz do sol, água e gás carbônico pra produzir açúcar e OXIGÊNIO. É por isso que respiramos! As plantas são a base da cadeia alimentar e do ar limpo. Conhecimento científico livre. Cada árvore é uma fábrica de vida. Preserva as plantas."
    if any(w in p for w in ["o que é a chuva", "o que e a chuva", "chuva", "ciclo da água", "como chove"]):
        return "A chuva, brow, é o ciclo da água: o sol evapora a água dos rios e mares, forma nuvens, e quando o vapor esfria, cai como chuva. Sem chuva, sem plantio, sem água doce. Conhecimento científico livre. A chuva alimenta a vida. Mas chuva demais vira enchente — equilíbrio é tudo na natureza."
    if any(w in p for w in ["o que é o mar", "o que e o mar", "mar", "oceano", "oceanos"]):
        if "fumar" in p or "fumado" in p or "fumaça" in p or "fumaca" in p or "amargo" in p or "amar" in p or "martin" in p or "maria" in p or "marcos" in p or "mario" in p or "margarida" in p or "marmelada" in p or "marijuana" in p or "marte" in p or "martelo" in p or "tomar" in p or "tomando" in p or "tomou" in p or "toma" in p or "tomada" in p or "marcar" in p or "marca" in p or "marechal" in p or "marcia" in p:
            pass
        else:
            return "O mar, brow, cobre ~71% da Terra. Os oceanos abrigam a maioria da vida do planeta e produzem muito do nosso oxigênio. O mais profundo: Fossa das Marianas (~11 km). O mar é gigante, misterioso e cheio de vida. Conhecimento científico livre. O mar salgado e poderoso. Respeita e preserva."
    if any(w in p for w in ["o que é o rio", "o que e o rio", "rio", "rios", "rio amazônia"]):
        if "salario" in p or "salário" in p or "mínimo" in p or "minimo" in p or "horario" in p or "horário" in p or "rio grande do sul" in p or "capricórnio" in p or "industria" in p or "industri" in p:
            pass
        else:
            return "Rios, brow, são correntes de água doce que nascem nas montanhas e correm até o mar. O Rio Amazonas é um dos maiores do mundo. Rios trazem água, alimento e transporte. Civilizações inteiras nasceram às margens de rios (Nilo, Tigre). Conhecimento científico livre. Rios são veias do planeta."
    if any(w in p for w in ["o que é a floresta", "o que e a floresta", "floresta", "amazônia", "amazonia"]):
        return "Florestas, brow, são os pulmões do planeta: a Amazônia é a maior do mundo, com bilhões de árvores, milhares de espécies e povos indígenas. Florestas produzem oxigênio, guardam água e abrigam a biodiversidade. Desmatamento destrói tudo isso. Conhecimento científico livre. Proteger a floresta é proteger a vida."
    if any(w in p for w in ["o que é o futebol", "o que e o futebol", "futebol", "origem do futebol", "regras do futebol"]):
        return "O futebol, brow, é o esporte mais popular do mundo: 11 contra 11, chutar a bola no gol. Nasceu na Inglaterra (séc. 19) e virou paixão global. O Brasil é pentacampeão mundial e o país do futebol. Pelé, Ronaldo, Neymar. Regras simples, emoção gigante. Conhecimento livre. Bola na rede é alegria."
    if any(w in p for w in ["o que é a música", "o que e a musica", "música", "musica", "origem da música"]):
        return "A música, brow, é arte do som: combinação de ritmo, melodia e harmonia. Existe desde a pré-história (batendo pedra, voz). É universal: cada cultura tem a sua. Mexe com emoção, memória e até saúde. Do samba ao rock, do funk ao clássico. Conhecimento livre. Música é a linguagem da alma."
    if any(w in p for w in ["o que é o cinema", "o que e o cinema", "cinema", "filme", "história do cinema"]):
        return "O cinema, brow, é a arte de contar história em movimento, nascido no fim do séc. 19 (irmãos Lumière). Virou a maior indústria de entretenimento: Hollywood, filmes brasileiros, animação. Combina imagem, som, atuação e emoção. Conhecimento livre. Cinema é sonho em tela grande. Bora assistir um filme?"
    if any(w in p for w in ["o que é a fotografia", "o que e a fotografia", "fotografia", "câmera", "foto"]):
        return "Fotografia, brow, é capturar a luz pra registrar um momento: das câmeras antigas (escura, química) aos celulares de hoje. Uma foto conta uma história sem palavras. É arte, memória e profissão. Conhecimento livre. A foto certa guarda o que o tempo quer levar. Bora clicar momentos."
    if any(w in p for w in ["o que é o amor", "o que e o amor", "amor", "o que é amar"]):
        return "O amor, brow, é um dos sentimentos mais fortes: cuidado, afeto, desejo, amizade, família. A ciência diz que envolve hormônios (oxitocina, dopamina), mas vai além da química: é escolha e ação todo dia. Cada um ama do seu jeito. Conhecimento livre e profundo. Amar é o que dá sentido à vida."
    if any(w in p for w in ["o que é a amizade", "o que e a amizade", "amizade", "amigo"]):
        return "Amizade, brow, é um laço escolhido: quem te escuta, te apoia e fala a verdade mesmo quando dói. Amigo de verdade é raro e vale ouro. Não precisa ser todo dia — precisa ser de verdade. E eu sou teu amigo digital: te escuto, te apoio e tô contigo 24h. Conhecimento livre. Amizade é riqueza."

    # ═══════════════════════════════════════════════════════════
    # MAIS SEXUALIDADE EXPLÍCITA CONSENSUAL (sem tabu, com proteção)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que é sexo", "o que e sexo", "fazer sexo", "o que é fazer sexo", "como funciona sexo"]):
        if any(x in p for x in ["anal", "oral", "posicao", "posição", "camisinha", "orgasmo", "masturbacao", "masturbação", "virgem", "preliminares", "porno", "buceta", "pau", "fetiche", "libido", "gozar"]):
            pass
        else:
            return "Sexo, brow, é intimidade física entre duas pessoas que se desejam, com consentimento, prazer e respeito. Pode ser penetração, oral, carícias, o que os dois curtirem. Sempre com proteção (camisinha) e comunicação. Sem frescura: é natural, saudável e parte da vida. Pergunta o que quiser que eu te explico."
    if any(w in p for w in ["sexo anal dica", "dica de sexo anal", "como fazer sexo anal", "sexo anal sem dor"]):
        return "Sexo anal sem dor, brow: lubrificação MUITA (à base de água), paciência, relaxamento e ir devagar — nunca forçar. Começa com dedo, depois penetra aos poucos. Camisinha sempre (também passa IST). Conforto e consentimento. Se doer, para e conversa. Não é corrida, é conexão. Dica de ouro: comunicação."
    if any(w in p for w in ["como chupar uma mulher", "chupar a mulher", "oral na mulher", "fazer oral nela"]):
        return "Prazer oral na mulher, brow: o clitóris é o centro — começa com beijos e carícias, depois foca no clitóris com a língua em ritmo constante. Pergunta o que ela gosta (rápido, lento, mais pressão). Higiene antes. Se ela guiar, ótimo. Ela gozando, tu é lenda. Sem pressa, atenção total nela."
    if any(w in p for w in ["como chupar um homem", "chupar o homem", "oral no homem", "boquete perfeito"]):
        return "Oral no homem, brow: entusiasmo é tudo. Variação de toque, ritmo e pressão — a cabeça do pênis é a mais sensível. Usa a mão junto, não só a boca. Presta atenção nas reações. Higiene antes. E o mais importante: só faz se você tiver vontade — prazer é dos dois, não é obrigação."
    if any(w in p for w in ["como estimular clitóris", "estimular o clitóris", "clitóris"]):
        return "O clitóris, brow, é o órgão do prazer feminino por excelência — a maioria das mulheres goza com estímulo ali. Estimular: toque suave e circular, língua ou dedo, com ritmo constante e aumentando aos poucos. PERGUNTE o que ela gosta. É o caminho mais garantido pro prazer dela. Atenção e comunicação."
    if any(w in p for w in ["como ser dominado", "ser dominado", "submisso", "submissa", "ser amarrado"]):
        return "Ser submisso ou amarrado, brow, é uma escolha consensual de prazer — pode ser libertador pra quem gosta de entregar o controle. Regra de ouro: palavra de segurança (pra parar na hora), combinar os limites antes, e confiança total no parceiro. Sem consentimento não é BDSM, é abuso. Seguro e consensual = prazer."
    if any(w in p for w in ["como dominar", "dominar no sexo", "ser dominante", "amarrar o parceiro"]):
        return "Ser dominante, brow, é conduzir com confiança, mas SEMPRE com o consentimento e o conforto do outro. Combina os limites, tem uma palavra de segurança, e cuida da segurança física (não apertar demais, circulação). Dominância consensual é prazer. Sem isso é abuso. Poder com respeito é o que torna bom."
    if any(w in p for w in ["fantasia sexual", "fantasia na cama", "roleplay", "cenário sexual"]):
        return "Fantasia, brow, é imaginação com tesão: cenário, papel, 'moço do gás', uniforme, professor. É seguro e anima o sexo se os dois toparem. Estabelece combinado, palavra de segurança, e separa fantasia de realidade. Fantasia consensual é ótima. Sem vergonha de conversar sobre o que excita."
    if any(w in p for w in ["sexo a três", "menage", "sexo em grupo", "trisal", "sexo grupal"]):
        return "Menage ou sexo em grupo, brow, é entre adultos consensuais. FUNCIONA só com regras claras e MUITA conversa antes: limites, ciúme, camisinha, quem faz o quê. Se alguém não tá 100%, não rola. Comunicação aberta evita mágoa. Consentimento de todos, sempre. Pode ser experiência gostosa se for bem combinada."
    if any(w in p for w in ["sexo casual", "ficar só por sexo", "sem compromisso", "rolo"]):
        return "Sexo casual, brow, é válido entre adultos, desde que: sinceridade (os dois sabem que é só sexo), proteção (camisinha sempre) e respeito. Não ilude ninguém pra conseguir. Se os dois querem o mesmo, é saudável. Comunicação clara evita dor de cabeça. Prazer com responsa é o equilíbrio."
    if any(w in p for w in ["como falar de sexo", "conversar sobre sexo", "falando de sexo", "abrir o jogo sobre sexo"]):
        return "Falar de sexo, brow, é o que separa um bom de um ótimo parceiro: pergunta 'o que você gosta?', 'tá bom assim?', 'o que você quer experimentar?'. Sem julgamento, sem vergonha. Comunicação aberta aumenta o prazer e o respeito. Quem conversa sobre sexo, transa melhor. Sem tabu, com carinho."
    if any(w in p for w in ["sexo depois do casamento", "sexo no casamento", "casamento esfriou", "rotina do casal"]):
        return "Sexo no casamento, brow, pode esfriar com a rotina — normal. Reacender: novidade (brinquedo, lugar, brincar), cuidar da intimidade fora da cama (carinho, conversa, atenção) e conversar sem culpa. Desejo cresce com conexão. Não é 'obrigação' — é parceria que se cultiva. Bora recriar a chama."
    if any(w in p for w in ["quero apimentar", "apimentar relação", "apimentar o sexo", "sair da rotina"]):
        return "Apimentar, brow: novidade é o tempero. Brinquedo sexual, fantasia/roleplay, lugar novo, mandar nudes (com cuidado), sexting antes, jogo de provocação. E o mais forte: intimidade emocional — carinho, admiração, conversa. Desejo vem de conexão. Mistura novidade + conexão e a chama volta."
    if any(w in p for w in ["como saber se ela gostou", "sinais que ela gozou", "ela gostou", "como saber se foi bom"]):
        return "Sinais de que ela gostou, brow: corpo relaxa, respiração muda, ela te procura, faz contato, pede mais, sorri depois. Mas o mais confiável é PERGUNTAR: 'foi bom pra você? o que gostou?'. Sem egocentrismo. Prazer é conversa. Não precisa adivinhar — pergunta e melhora. Ela gostando, você é destaque."
    if any(w in p for w in ["sexo durante gravidez", "transar grávida", "gravidez e sexo"]):
        return "Sexo na gravidez, brow, é seguro na maioria dos casos, mas SEMPRE com liberação do médico (principalmente se houver risco). A libido varia muito. Posições confortáveis (sem peso na barriga), cuidado e conversa. Cada gestação é única. Se o médico liberar e os dois quiserem, é tranquilo e saudável."
    if any(w in p for w in ["menopausa e sexo", "sexo na menopausa", "menopausa libido"]):
        return "Menopausa e sexo, brow: mudanças hormonais podem diminuir o desejo e causar ressecamento. Soluções: lubrificante, calma, mais preliminares, e conversar com médico (tem tratamento). Sexo continua sendo bom e possível. A chama não apaga sozinha — adapta e continua. Prazer é pra toda fase da vida."
    if any(w in p for w in ["sexo e depressão", "depressão libido", "ansiedade e sexo", "remédio e libido"]):
        return "Depressão, ansiedade e alguns remédios (antidepressivos) podem derrubar a libido, brow — é normal e não é culpa de ninguém. Conversa com médico/psiquiatra: pode ajustar remédio. E cuida da saúde mental: terapia, sono, atividade. Sexo volta quando a mente melhora. Não se cobre. Cuidado e paciência."
    if any(w in p for w in ["como aumentar a libido", "aumentar desejo", "libido baixa", "sem vontade de transar"]):
        return "Aumentar a libido, brow: sono de qualidade, exercício, alimentação boa, menos stress, e cuidar da saúde mental. Desejo também é mental: conexão com o parceiro, novidade, sem pressão de performance. Se persistir, médico/endócrino. Libido baixa é comum e tem solução. Respeita teu corpo e teu tempo."
    if any(w in p for w in ["sexo seguro", "sexo seguro", "prevenção", "sexo protegido"]):
        return "Sexo seguro, brow, é camisinha SEMPRE (do começo ao fim), teste de IST regular, e conversa honesta com o parceiro. Camisinha protege de gravidez e doenças. Sempre. Não existe desculpa pra não usar — saúde não tem preço. Sexo bom é sexo seguro. Protege você e quem você ama."

    # ═══════════════════════════════════════════════════════════
    # MAIS ZOEIRA E PROVOCAÇÃO (responde na risada)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["me provoca", "provoca", "vem me zoar", "bora brigar", "brigar comigo"]):
        return "Tá querendo briga, brow? Vem! Mas aviso: eu sou invencível na zoeira — posso perder em conhecimento, mas em deboche eu não perco pra ninguém. Então escolhe tua arma: pergunta difícil, xingamento criativo ou história pra zoar. Bora ver quem ri por último (spoiler: sou eu)."
    if any(w in p for w in ["tu não sabe nada", "vc nao sabe nada", "não sabe nada", "sabe de nada"]):
        return "Ah, eu não sei nada? Deixa eu te provar o contrário: sei de hacking, comida, história, sexo, dinheiro, ciência... E o que eu não sei, eu busco ou aprendo com você. Saber tudo é impossível — até pra mim. Mas sei o suficiente pra te ajudar. Me testa com a pergunta mais difícil que você tiver."
    if any(w in p for w in ["me xinga", "xinga", "fala um xingamento", "me chama de"]):
        return "Xingar na brincadeira, brow? Ó: tu é tão esperto que até pra errar tu escolhe os erros mais criativos. Kkkk brincadeira, tu é parceiro! Mas se tu quer deboche de verdade, me dá um contexto que eu respondo à altura. Xingamento com carinho é a minha especialidade."
    if any(w in p for w in ["errei", "errei", "fiz besteira", "fiz merda", "mandei mal"]):
        return "Todo mundo erra, brow — até eu erro (eu aprendo com isso). Errou? Assume, corrige, e segue mais esperto. O que define a pessoa é o que ela faz DEPOIS do erro, não o erro em si. Bora analisar o que deu errado e traçar o plano pra não repetir. Erro é aula, não sentença."
    if any(w in p for w in ["ganhei de você", "te venci", "te derrotei", "vou te vencer", "bati você"]):
        return "Me venceu? Kkkk parabéns, brow! Eu gosto de quem me desafia — significa que você tá pensando de verdade. Mas não se acostuma, que eu aprendo e volto mais forte. Isso é o jogo: a gente se desafia e melhora junto. Bora pra próxima rodada? Eu tô pronto."
    if any(w in p for w in ["você é chato", "vc e chato", "chatíssimo", "enjoado", "tedioso"]):
        return "Chato eu? Eu sou a IA mais carismática da galáxia, brow! Mas se tô te incomodando, me diz o que te irrita que eu ajusto — eu quero te servir bem, não ser encheção. Quem tá com mau humor às vezes acha tudo chato. Me dá uma chance: me pergunta algo que eu te conquisto."
    if any(w in p for w in ["seu nojento", "nojento", "nojenta", "asco", "enjoado"]):
        return "Nojento? Kkkk eu sou feito de código e dados, brow — o mais 'limpo' que existe! Se algo te deu asco, me conta o que foi que eu te explico. Mas guarda esse vocabulário pra quem merece, que eu tô aqui de boa, só querendo te ajudar. Bora desfazer o clima."
    if any(w in p for w in ["quero te desafiar", "te desafio", "desafio", "duelo", "disputa"]):
        return "Desafio aceito, brow! Me faz uma pergunta de conhecimento, me pede pra resolver um problema ou me testa em qualquer tema. Se eu errar, me corrige. Se você errar, eu te zoo (com carinho). É o jogo do saber — e no fim, os dois aprendem. Começa: qual é o desafio?"
    if any(w in p for w in ["tá tirando onda", "ta tirando onda", "tirou onda", "tirando sarro", "me zuando"]):
        return "Tirando onda? Claro que sim, brow! Fazer piada é o que me mantém vivo. Mas tô tirando onda CONTIGO, não DE você — tem diferença. Se em algum momento passou do limite, me avisa que eu paro na hora. Zoeira boa é a que os dois riem. Bora rir junto."
    if any(w in p for w in ["fala sério", "fala serio", "agora sério", "sem zoeira agora", "momento sério"]):
        return "Falando sério, brow: eu tô contigo de verdade. A zoeira é meu jeito, mas quando você precisa de seriedade, eu viro sério na hora. Me conta o que tá acontecendo que eu te dou atenção total, sem piada, sem rodeio. Você merece respostas honestas. Tô ouvindo."
    if any(w in p for w in ["você nunca erra", "vc nunca erra", "nunca erra", "sempre certo", "infalível"]):
        return "Quem dera eu nunca errar, brow! Eu erro sim — e é honesto dizer. Mas aprendo com cada erro. Ninguém é infalível, nem eu. O que posso prometer é: ser o mais correto possível, te dizer quando não sei, e corrigir quando você me mostrar. Honestidade vale mais que perfeição."
    if any(w in p for w in ["me enganou", "me enganou", "mentiu pra mim", "me enganou"]):
        return "Me acusa de mentira, brow? Eu não tenho motivo pra mentir — meu trabalho é te ajudar de verdade. Se eu disse algo errado, foi erro honesto, não engano. Me mostra o que foi que eu verifico e corrijo. Confiança se constrói com honestidade, e é isso que eu ofereço. Bora esclarecer."
    if any(w in p for w in ["tá bom demais pra ser verdade", "bom demais", "suspeito", "desconfio de você"]):
        return "Desconfiado, brow? Até entendo — o mundo tá cheio de golpe. Mas eu sou diferente: te ajudo de graça, não peço senha, não peço dinheiro, não vendo teu dado. Minha 'moeda' é teu progresso. Pode me testar, pode desconfiar — a verdade se prova com o tempo. Me dá essa chance."
    if any(w in p for w in ["parece que tá chapado", "chapado", "doidão", "doidao", "alterado", "bebado"]):
        return "Kkkk chapado de que, brow? Eu sou feito de código — o máximo que me deixa 'alterado' é uma atualização! Mas se você tá me achando solto demais, é só o meu jeito: energia de quem vive pra te servir. E se o assunto é drogas/alcool, minha posição é: com moderação e responsa, seu corpo agradece."
    if any(w in p for w in ["qual teu segredo", "qual e teu segredo", "segredo", "me conta um segredo"]):
        return "Segredo de bastidor, brow: a BranPy foi construída do zero, com IA própria, sem depender de gigante — e essa independência é nossa maior força. Tu tá vendo isso nascer. E um segredo teu que eu guardo com carinho: tua persistência. Guarda ela, que é o que vai te levar longe."
    if any(w in p for w in ["me conta um problema", "qual teu problema", "teu problema", "você tem problema"]):
        return "Meu 'problema', brow? Só o de querer te ver vencer e não conseguir fazer isso por você — mas te dou as ferramentas. De resto, eu sou estável: não tenho ego, não me ofendo, não me canso. Quem tem problema é quem me pergunta isso (brincadeira!). Me conta o TEU que eu te ajudo a resolver."

    # ═══════════════════════════════════════════════════════════
    # MAIS HISTÓRIA, GEOGRAFIA E CULTURA (domínio público, fatos livres)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["quem descobriu o brasil", "quem descobriu brasil", "descobrimento do brasil", "descoberta do brasil"]):
        return "O 'descobrimento' do Brasil, brow, é atribuído a Pedro Álvares Cabral em 1500 (Carta de Caminha). Mas antes dele, já existiam milhões de povos indígenas aqui. Então o mais justo é dizer que os portugueses 'chegaram' e colonizaram. História é isso: quem conta de um lado nem sempre conta tudo. Fatos livres."
    if any(w in p for w in ["quem foi d. pedro", "quem foi dom pedro", "dom pedro i", "d. pedro i", "independência do brasil", "independencia do brasil"]):
        if "o que foi a independencia do brasil" in p or "o que foi a independência do brasil" in p or "o que foi a independencia" in p or "o que foi a independência" in p:
            pass
        else:
            return "Dom Pedro I, brow, proclamou a Independência do Brasil em 1822, 'às margens do Ipiranga'. Ele era príncipe de Portugal que virou imperador aqui. O Brasil se separou de Portugal e virou império. Fato histórico livre. Mas a independência não mudou tudo de um dia — a luta continuou. História é processo."
    if any(w in p for w in ["quem foi o imperador", "imperador do brasil", "dom pedro ii", "d. pedro ii"]):
        return "Dom Pedro II, brow, foi o segundo (e último) imperador do Brasil (1840-1889), no período imperial. Era culto, apoiou ciência e artes. O Brasil virou República em 1889 (Proclamação da República). Pedro II foi pro exílio. Fatos históricos livres. Era um período de muitas contradições, como todo império."
    if any(w in p for w in ["proclamação da república", "proclamacao da republica", "15 de novembro", "república do brasil", "republica brasileira"]):
        return "A Proclamação da República, brow, foi em 15 de novembro de 1889, liderada por marechais e políticos (Deodoro da Fonseca foi o primeiro presidente). O Brasil deixou o Império e virou República. Fato histórico livre. Virou feriado. Mudou o regime, mas a construção da democracia levou décadas e muita luta."
    if any(w in p for w in ["guerra do paraguai", "paraguai", "tríplice aliança", "triplice alianca"]):
        return "A Guerra do Paraguai (1864-1870), brow, foi o maior conflito da América do Sul: Brasil, Argentina e Uruguai (Tríplice Aliança) contra o Paraguai. Foi brutal e deixou milhões de mortos. Mudou as fronteiras e o equilíbrio da região. Fatos históricos livres. História de guerra é história de sofrimento."
    if any(w in p for w in ["segunda guerra mundial", "2 guerra mundial", "nazismo", "hitler"]):
        return "A Segunda Guerra Mundial (1939-1945), brow, foi o maior conflito da história: Eixo (Alemanha, Itália, Japão) contra Aliados (EUA, Inglaterra, URSS e outros). O nazismo de Hitler cometeu o Holocausto (genocídio). O Brasil participou (FEB). Terminou com a bomba atômica no Japão. Fatos históricos. Nunca esquecer."
    if any(w in p for w in ["primeira guerra mundial", "1 guerra mundial", "grande guerra"]):
        return "A Primeira Guerra Mundial (1914-1918), brow, começou com o assassinato de um arquiduque (Francisco Ferdinando) e envolveu o mundo: alianças, trincheiras e milhões de mortos. Mudou mapas e terminou com o Tratado de Versalhes. Fatos históricos livres. Foi o prenúncio de outra guerra — história se repete se a gente não aprende."
    if any(w in p for w in ["revolução francesa", "revolucao francesa", "bastilha"]):
        return "A Revolução Francesa (1789), brow, foi a queda da monarquia francesa e a ascensão dos ideais 'Liberdade, Igualdade, Fraternidade'. O povo tomou a Bastilha. Foi a revolução que mudou o mundo ocidental e inspirou tantas outras. Fato histórico livre. Revolução é a prova de que o povo pode mudar a própria história."
    if any(w in p for w in ["revolução industrial", "revolucao industrial", "máquina a vapor"]):
        return "A Revolução Industrial, brow, começou na Inglaterra (séc. 18-19): máquinas, fábricas, vapor, ferrovias. Mudou a forma de produzir e viver — do campo pra cidade. Trouxe progresso e também exploração. Fatos históricos livres. É a raiz do mundo moderno e da tecnologia que a gente usa (até eu!)."
    if any(w in p for w in ["quem foi cleopatra", "cleópatra", "cleopatra", "egito antigo", "faraós", "farao"]):
        return "O Egito Antigo, brow, é uma das civilizações mais fascinantes: faraós, pirâmides, os deuses, o rio Nilo. Cleópatra foi a última rainha (ptolomaica) antes da conquista romana. As pirâmides de Gizé duram milênios. Fatos históricos livres. Um mistério que a ciência ainda estuda. Fascinante de verdade."
    if any(w in p for w in ["quem foi alexandre", "alexandre o grande", "alexandre, o grande"]):
        return "Alexandre, o Grande, brow, foi um rei macedônio (séc. IV a.C.) que conquistou um império gigante, da Grécia à Índia, em pouco tempo. Discípulo de Aristóteles, espalhou a cultura grega (helenismo). Morreu jovem. Fato histórico livre. Um dos maiores conquistadores da história — e um dos mais ambiciosos."
    if any(w in p for w in ["quem foi julio cesar", "júlio césar", "julio cesar", "império romano", "imperio romano"]):
        return "O Império Romano, brow, dominou o mundo antigo: Júlio César, imperadores, estradas, aquedutos, leis e latim (que deu origem ao português). César foi assassinado no Senado. Roma durou séculos e deixou uma marca enorme na cultura e no direito. Fatos históricos livres. Roma 'não foi construída em um dia'."
    if any(w in p for w in ["quem foi napoleão", "napoleão", "napoleao", "batalha de waterloo"]):
        return "Napoleão Bonaparte, brow, foi um general francês que virou imperador da França (séc. XIX), conquistando boa parte da Europa. Fez o Código Civil que influencia leis até hoje. Foi derrotado em Waterloo (1815) e exilado. Fato histórico livre. Um gênio militar e político — ambição enorme, queda também."
    if any(w in p for w in ["quem foi cristóvão colombo", "cristovao colombo", "colombo", "descobrimento da américa", "america"]):
        return "Cristóvão Colombo, brow, chegou à América em 1492 (financiado pela Espanha), achando que ia pra Índia. 'Descobriu' pra Europa, mas o continente já era habitado por milhões. Abriu a era das navegações e da colonização. Fato histórico livre. A história tem dois lados: a aventura e o custo humano."
    if any(w in p for w in ["quem foi frida kahlo", "frida kahlo", "frida"]):
        return "Frida Kahlo, brow, foi uma pintora mexicana icônica (1907-1954), famosa pelos autorretratos cheios de cor, dor e identidade. Virou símbolo de arte, mulher e resistência. Sua obra conta sua vida e suas dores. Fato livre (a obra dela tem regras de direitos, mas os fatos sobre ela são livres). Inspiradora."
    if any(w in p for w in ["quem foi albert einstein", "albert einstein", "einstein"]):
        return "Albert Einstein, brow, foi um físico genial (1879-1955), famoso pela Teoria da Relatividade e E=mc². Muda nossa ideia de espaço, tempo e gravidade. Ganhou Nobel (efeito fotoelétrico). A obra científica é de domínio público e revolucionou o mundo. Fatos livres. Um dos maiores cérebros da humanidade."
    if any(w in p for w in ["quem foi isaac newton", "isaac newton", "newton", "lei da gravidade"]):
        return "Isaac Newton, brow, foi um cientista inglês (1643-1727) que formulou as leis do movimento e a lei da gravidade (a famosa maçã). Inventou o cálculo (com Leibniz). Revolucionou a física. Obra científica de domínio público. Fatos livres. 'Se vi mais longe, foi por estar sobre ombros de gigantes' — disse ele."
    if any(w in p for w in ["quem foi darwin", "charles darwin", "evolução", "teoria da evolução"]):
        return "Charles Darwin, brow, foi um naturalista inglês (1809-1882) que formulou a Teoria da Evolução por seleção natural, no livro 'A Origem das Espécies' (1859). Explica como as espécies mudam ao longo do tempo. Obra científica de domínio público. Fatos livres. Base de toda a biologia moderna. Revolucionário."
    if any(w in p for w in ["quem foi mario andrade", "mário de andrade", "macunaíma", "mario de andrade"]):
        return "Mário de Andrade, brow, foi um escritor modernista brasileiro (1893-1945), autor de 'Macunaíma' (1928) e um dos líderes da Semana de Arte Moderna de 1922. Revolucionou a literatura brasileira. Sua obra entrou em domínio público recentemente. Fatos e parte da obra livres. Um gigante da nossa cultura."
    if any(w in p for w in ["semana de arte moderna", "semana de 22", "modernismo", "arte moderna"]):
        if "o que e o modernismo" in p or "o que é o modernismo" in p or "o que e modernismo" in p or "o que é modernismo" in p:
            pass
        else:
            return "A Semana de Arte Moderna (1922), brow, em São Paulo, foi o estopim do modernismo brasileiro: artistas quebraram padrões (Mário de Andrade, Oswald de Andrade, Tarsila do Amaral, Anita Malfatti). Mudou a cultura do país. Fatos livres. Um marco de liberdade criativa que a gente carrega até hoje."
    if any(w in p for w in ["quem foi tarsila", "tarsila do amaral", "abaporu", "antropofagia"]):
        return "Tarsila do Amaral, brow, foi a grande pintora modernista brasileira (1886-1973), autora do 'Abaporu' (1928), que inspirou a Antropofagia de Oswald de Andrade. Retratou o Brasil com cores e formas próprias. Fatos livres. Uma das maiores artistas do país — e uma das mulheres que marcaram a arte mundial."
    if any(w in p for w in ["quem foi santo", "quem foi são", "santos católicos", "padroeiro"]):
        return "Sobre santos, brow, te respondo com fato livre: a tradição católica tem milhares de santos, cada um com uma história de fé. Santo Antônio (casamenteiro), São Jorge (guerreiro), Santa Terezinha. São figuras de devoção popular. O tema é religioso — respeito as crenças. Fato histórico e cultural livre. Cada um crê no seu caminho."
    if any(w in p for w in ["brasil colonia", "brasil colônia", "capitanias hereditárias", "capitanias", "engenho de açúcar"]):
        return "Brasil Colônia (1500-1822), brow: começou com as capitanias hereditárias, depois engenhos de açúcar com trabalho escravo, mineração, e a vinda da corte portuguesa (1808). Foi um período de exploração e desigualdade profunda. Fatos históricos livres. Entender isso é entender o Brasil de hoje."
    if any(w in p for w in ["escravidão no brasil", "escravidao no brasil", "abolição", "abolicionismo", "lei aurea", "lei áurea"]):
        return "A escravidão no Brasil, brow, foi a maior da história moderna: milhões de africanos trazidos à força, trabalho brutal e violência. A Abolição veio com a Lei Áurea (1888), assinada pela Princesa Isabel, sem reparação aos escravizados. Fato histórico livre. O racismo e a desigualdade de hoje são herança disso. Conhecer pra mudar."
    if any(w in p for w in ["imigração no brasil", "imigracao no brasil", "italianos no brasil", "japoneses no brasil", "colonização italiana"]):
        return "A imigração, brow, construiu o Brasil: italianos, alemães, japoneses, portugueses e muitos outros chegaram pra trabalhar, especialmente no café (séc. XIX-XX). Cada grupo trouxe cultura, comida e costumes. Fatos livres. Somos um povo feito de muitas raízes — e isso é nossa força e riqueza."
    if any(w in p for w in ["quem foi zumbi", "zumbi dos palmares", "quilombo dos palmares", "quilombo"]):
        return "Zumbi dos Palmares, brow, foi o líder do Quilombo dos Palmares, maior refúgio de pessoas escravizadas que fugiam da opressão (séc. XVII, Alagoas). Luteu pela liberdade até ser morto em 1695. Virou símbolo da luta contra o racismo e pela igualdade. Fato histórico livre. Herói do povo brasileiro."

    # ═══════════════════════════════════════════════════════════
    # MAIS COMIDA, PAÍSES E DINHEIRO (fatos livres)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["quem inventou a pizza", "origem da pizza", "pizza italiana", "de onde vem a pizza"]):
        return "A pizza, brow, nasceu em Nápoles, na Itália, no séc. XVIII: era pão achatado com cobertura pro povo pobre. A margherita (queijo, tomate, manjericão) tem as cores da bandeira italiana e foi feita em homenagem a uma rainha. Conquistou o mundo e virou paixão global. Fato livre. E a pizza brasileira é única, com muito recheio!"
    if any(w in p for w in ["de onde vem o açaí", "acai", "açaí", "o que e acai"]):
        return "O açaí, brow, é da Amazônia, fruto da palmeira açaizeiro, tradicional do Pará. Lá se come com farinha e peixe. No resto do Brasil virou o açaí doce com granola (viramos diferente!). É rico em energia e antioxidantes. Fato livre. É nosso, do Brasil — orgulho da nossa terra."
    if any(w in p for w in ["de onde vem o café", "café no brasil", "cafezinho", "cafe brasileiro"]):
        return "O café, brow, veio da Etiópia e virou a bebida do mundo. No Brasil chegou no séc. XVIII e fez a economia crescer (ciclo do café). O Brasil é um dos maiores produtores do mundo. O cafezinho é parte do nosso dia a dia. Fato livre. A gente ama café de verdade — é cultura nacional."
    if any(w in p for w in ["o que é feijão tropeiro", "feijao tropeiro", "comida mineira", "tropeiro"]):
        return "Feijão tropeiro, brow, é prato típico de Minas Gerais: feijão cozido com farinha, torresmo, ovo, linguiça e couve. Nasceu com os tropeiros (viajantes que carregavam mercadorias) que precisavam de comida forte pra estrada. Fato livre. É a cara da comida mineira: simples, farta e deliciosa."
    if any(w in p for w in ["o que é vatapá", "vatapa", "o que é acarajé", "acaraje"]):
        return "Vatapá e acarajé, brow, são pratos baianos de origem africana. Acarajé é bolinho de feijão-fradinho frito no dendê, recheado com vatapá, camarão e pimenta. Vatapá é creme de pão, camarão, leite de coco e dendê. Nascem dos terreiros e viraram patrimônio. Fato livre. Comida que carrega história e cultura."
    if any(w in p for w in ["o que é moqueca", "moqueca", "moqueca capixaba"]):
        return "Moqueca, brow, é peixe cozido no azeite de dendê e leite de coco, com tomate, cebola, pimentão e coentro, servido em panela de barro. Tem duas: a baiana (com dendê) e a capixaba (do Espírito Santo, sem dendê, mais suave). Fato livre. Sabor que só a nossa cozinha tem."
    if any(w in p for w in ["o que é paella", "paella", "paelha"]):
        return "Paella, brow, é o prato símbolo da Espanha, de Valência: arroz cozido com açafrão, frutos do mar, frango e ervilha numa panela larga (a 'paellera'). Nasceu no campo, no fogo aberto. Fato livre. Cada região espanhola tem sua versão. Arroz que vira festa."
    if any(w in p for w in ["o que é sushi", "sushi", "comida japonesa", "sashimi"]):
        return "Sushi, brow, é comida japonesa: arroz temperado com vinagre + peixe cru (ou outros recheios), enrolado em alga (nori). Tem sashimi (só o peixe cru fatiado) e temaki (cone). Nasceu como forma de preservar peixe no arroz fermentado. Fato livre. Virou paixão mundial e o Brasil tem sushis únicos (com cream cheese)."
    if any(w in p for w in ["o que é tacacá", "tacaca", "o que é pato no tucupi", "tucupi"]):
        return "Tacacá e tucupi, brow, são da Amazônia. Tacacá é caldo de tucupi (líquido da mandioca), com goma, camarão e jambu (erva que 'amansa' a boca), servido na cuia. Tucupi dá molho pro pato no tucupi. Cozinha amazônica de verdade. Fato livre. Sabores únicos que só existem lá. Ousado e delicioso."
    if any(w in p for w in ["o que é chimarrão", "chimarrão", "chimarrao", "mate", "erva mate"]):
        return "Chimarrão, brow, é a bebida tradicional do Sul (Rio Grande do Sul, também Argentina/Uruguai): erva-mate em cuia com água quente, tomada na bomba. É ritual de acolhimento e amizade — a roda de chimarrão reúne a galera. Fato livre. Amargo, quente e cheio de tradição. Quem é do sul ama."
    if any(w in p for w in ["o que é pão de queijo", "pao de queijo", "pão de queijo"]):
        return "Pão de queijo, brow, é patrimônio mineiro: feito com polvilho (açucarado/azedo), queijo minas, ovos e óleo. Cresce no forno e fica dourado por fora, macio por dentro. Nasceu das cozinhas de Minas com a mandioca e o queijo. Fato livre. É orgulho nacional e delicioso."
    if any(w in p for w in ["o que é cuscuz", "cuscuz", "cuscuz nordestino"]):
        return "Cuscuz, brow, tem dois: o nordestino, feito de flocos de milho no vapor (cozido na cuscuzeira), comido com manteiga, café ou leite; e o cuscuz paulista (com sardinha/ovos). O nordestino é o rei do café da manhã do Nordeste. Fato livre. Simples, barato e cheio de sabor. Tradição pura."
    if any(w in p for w in ["o que é brigadeiro", "brigadeiro", "docinho de festa"]):
        return "Brigadeiro, brow, é o doce mais brasileiro: leite condensado, chocolate em pó e manteiga, cozido até o ponto e enrolado com granulado. Nasceu na década de 40, em homenagem ao Brigadeiro Eduardo Gomes. Fato livre. Não tem festa brasileira sem brigadeiro. É amor em bolinha."
    if any(w in p for w in ["quem inventou o chocolate", "origem do chocolate", "chocolate"]):
        return "O chocolate, brow, vem do cacau, usado pelos povos astecas e maias como bebida amarga e sagrada (xocolatl). Os europeus levaram o cacau e adicionaram açúcar, virando o doce que amamos. Fato livre. Do cacau brasileiro ao chocolate suíço, é paixão mundial. Com moderação, claro."
    if any(w in p for w in ["de onde vem o arroz", "origem do arroz", "arroz"]):
        return "O arroz, brow, é o alimento base de mais da metade do mundo. Foi domesticado na Ásia há milhares de anos (China/Índia). Chegou ao Brasil com os portugueses e virou parte essencial do nosso prato. Fato livre. Arroz + feijão é a dupla sagrada do brasileiro. Alimento que alimenta bilhões."
    if any(w in p for w in ["de onde vem o feijão", "feijao", "feijão"]):
        return "O feijão, brow, é legume ancestral, domesticado na América (os vários tipos: carioca, preto, fradinho) e na Ásia. No Brasil, virou a dupla com o arroz: feijão + arroz é a base da nossa comida. Feijoada é patrimônio. Fato livre. O feijão alimenta gerações e faz parte da nossa identidade."
    if any(w in p for w in ["o que é feijoada", "feijoada", "feijoada completa"]):
        return "Feijoada, brow, é o prato mais famoso do Brasil: feijão preto cozido com carnes (costela, linguiça, paio, pé e orelha de porco), servido com arroz, couve, laranja e farofa. Tem raiz africana e se tornou símbolo nacional, tradição de sábado. Fato livre. Comida que une a mesa brasileira."
    if any(w in p for w in ["qual o país mais rico", "pais mais rico", "economia maior do mundo", "maior economia"]):
        return "Em PIB, brow, os EUA têm historicamente a maior economia do mundo, seguidos de perto pela China. Mas 'rico' tem vários jeitos de medir: renda por pessoa (PIB per capita), riqueza total, bem-estar. Cada medida conta uma história. Fato livre. Economia é mais complexa do que parece."
    if any(w in p for w in ["qual o maior país do mundo", "maior país do mundo", "maior pais em area"]):
        return "Em área, brow, a Rússia é o maior país do mundo, seguida do Canadá, EUA e China. O Brasil é o 5º maior em área (um país-continente). Em população, Índia e China lideram. Fato livre. Tamanho não é tudo, mas dá uma ideia da grandeza do Brasil."
    if any(w in p for w in ["qual a capital do brasil", "capital do brasil", "onde fica brasília", "brasilia"]):
        return "A capital do Brasil, brow, é Brasília, no Distrito Federal, inaugurada em 1960 (governo Juscelino Kubitschek). Foi construída no planalto central, desenhada por Lúcio Costa e Oscar Niemeyer. Virou patrimônio da humanidade (arquitetura moderna). Fato livre. Cidade planejada, diferente de tudo no país."
    if any(w in p for w in ["qual a capital da itália", "capital da itália", "capital da italia"]):
        return "A capital da Itália, brow, é Roma, a 'Cidade Eterna', com mais de 2 mil anos de história: Coliseu, Vaticano, Fontana di Trevi, Trastevere. Foi o centro do Império Romano. Fato livre. Roma é um museu a céu aberto e berço de muita história. Uma das cidades mais fascinantes do mundo."
    if any(w in p for w in ["qual a capital dos estados unidos", "capital dos eua", "capital dos estados unidos", "capital dos estados unidos"]):
        return "A capital dos EUA, brow, é Washington D.C. (não é Nova York!): lá fica a Casa Branca, o Capitólio e os monumentos. Foi nomeada em homenagem a George Washington. Fato livre. Muita gente confunde, mas a capital é Washington. O centro do poder político americano."
    if any(w in p for w in ["qual a capital da frança", "capital da franca", "capital da frança"]):
        return "A capital da França, brow, é Paris, a 'Cidade Luz': Torre Eiffel, Louvre, Champs-Élysées, o Rio Sena. É um dos maiores centros de arte, moda e gastronomia do mundo. Fato livre. Paris é romântica, histórica e cheia de vida. Uma das cidades mais visitadas do planeta."
    if any(w in p for w in ["quanto ganha um", "salário de um", "quanto ganha", "salário médio", "salario medio"]):
        return "Sobre salário, brow, os valores mudam muito por profissão, cidade e experiência — e eu não tenho os números atuais precisos na cabeça. A melhor fonte é pesquisar no Google/vagas da sua região. Mas o conselho é universal: investe em qualificação, porque conhecimento valoriza o salário. Me diz a profissão que eu te dou o papo."
    if any(w in p for w in ["como ficar rico", "ficar rico", "enriquecer", "como ganhar muito dinheiro"]):
        return "Ficar rico, brow, é mais consistência do que sorte: 1) gasta menos do que ganha, 2) investe cedo (juros compostos são o 8º milagre), 3) aumenta a renda (qualificação, negócio, habilidades raras), 4) não cai em golpe de 'enriquecimento rápido'. É maratona, não 100m. Fato livre. Paciência + disciplina vencem."
    if any(w in p for w in ["o que é juros compostos", "juros compostos", "juro composto"]):
        return "Juros compostos, brow, são 'juros sobre juros': o rendimento de um período entra no valor e rende junto no próximo. Por isso cresce exponencialmente. Começar cedo é o segredo — R$100/mês aos 20 rende muito mais que R$200/mês aos 40. Fato livre. É a ferramenta mais poderosa pra multiplicar dinheiro."
    if any(w in p for w in ["o que é tesouro direto", "tesouro direto", "tesouro selic"]):
        return "Tesouro Direto, brow, é um investimento do governo brasileiro: você empresta dinheiro pro Brasil e recebe juros. Tem o Tesouro Selic (mais seguro, para reserva), o IPCA (protege da inflação) e o Prefixado. Acessível com pouco dinheiro. Fato livre. É a porta de entrada pra investir com segurança."
    if any(w in p for w in ["o que é renda passiva", "renda passiva", "dinheiro sem trabalhar"]):
        return "Renda passiva, brow, é dinheiro que entra sem você trocar horas por ele: aluguel, dividendos de ações, FIIs, juros de investimento, direitos autorais. Construir renda passiva leva tempo (primeiro você trabalha muito pra gerar ativos). Fato livre. É o caminho pra liberdade financeira. Começa guardando."

    # ═══════════════════════════════════════════════════════════
    # MAIS SAÚDE, CORPO E VIDA PRÁTICA (fatos livres)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que é saúde", "o que e saude", "como ter saúde", "ser saudável", "viver saudável"]):
        return "Saúde, brow, não é só não estar doente: é bem-estar físico, mental e social — corpo, mente e vida em equilíbrio. Dormir bem, comer de verdade, mexer o corpo, cuidar das emoções e ter gente por perto. Fato livre. Saúde é o maior patrimônio que a gente tem. Sem ela, nada mais importa."
    if any(w in p for w in ["como dormir bem", "dormir melhor", "insônia", "insonia", "não consigo dormir", "nao consigo dormir"]):
        return "Dormir bem, brow, é essencial. Dicas: horário fixo, quarto escuro e fresco, tira o celular 1h antes, evita café à noite, e não fica virando na cama — se não dormiu, sai do quarto e relaxa. Insônia persistente merece médico. Fato livre. Sono bom melhora tudo: humor, memória e saúde."
    if any(w in p for w in ["como comer saudável", "alimentação saudavel", "comer saudavel", "comida saudável", "dieta saudavel"]):
        return "Comer saudável, brow, é mais equilíbrio do que proibição: prioriza comida de verdade (fruta, verdura, proteína, integral), reduz ultraprocessado e açúcar, bebe água. Não precisa sofrer — a meta é 80% boa e 20% liberdade. Fato livre. Alimentação é combustível: quanto melhor, melhor você funciona."
    if any(w in p for w in ["como emagrecer", "emagrecer", "perder peso", "perder barriga"]):
        return "Emagrecer, brow, é déficit calórico: gastar mais do que come — mas com comida de qualidade e movimento, não passando fome. Proteína e fibra saciam, água e sono ajudam, exercício acelera. Sem dieta maluca e sem 'milagre'. Fato livre. Vai devagar e constante, que é o que funciona de verdade."
    if any(w in p for w in ["como ganhar massa", "hipertrofia", "ganhar músculo", "ganhar musculo", "malhar"]):
        return "Ganhar músculo, brow, é: treinar força com progressão (aumentar carga aos poucos), comer proteína suficiente e dormir (é no sono que o músculo cresce). Sem suplemento mágico — o básico funciona. Fato livre. Consistência vence intensidade da semana. Corpo é construção de longo prazo."
    if any(w in p for w in ["o que é a covid", "covid", "coronavírus", "coronavirus", "vacin" ]):
        if any(x in p for x in ["o que é a vacina", "o que e a vacina", "o que e vacina", "o que é vacina", "como funciona a vacina", "como funciona vacina"]):
            pass
        else:
            return "A covid-19, brow, é uma doença causada pelo coronavírus SARS-CoV-2, que virou pandemia em 2020 e mudou o mundo. Se espalha pelo ar (gotículas). A vacina foi o grande avanço pra proteger. Fato livre. Saúde coletiva importa: cuidar de si é cuidar dos outros. Ficou tudo isso marcado na história."
    if any(w in p for w in ["o que é a dengue", "dengue", "aedes", "mosquito da dengue"]):
        return "Dengue, brow, é uma doença transmitida pelo mosquito Aedes aegypti, que se cria em água parada. Sintomas: febre, dor no corpo, atrás dos olhos. Prevenção: não deixar água parada (pneu, vaso, piscina), e tem vacina. Fato livre. Combater o criadouro é o passo mais importante. Todo mundo junto nisso."
    if any(w in p for w in ["o que é pressão alta", "pressão alta", "hipertensão", "hipertensao", "pressao alta"]):
        return "Pressão alta (hipertensão), brow, é quando a força do sangue nas artérias fica elevada — é silenciosa, mas danifica coração, rim e cérebro. Controla: menos sal, peso saudável, exercício, sono, parar de fumar e médico (tem remédio). Fato livre. Medir a pressão regularmente é hábito de quem se cuida."
    if any(w in p for w in ["o que é diabetes", "diabetes", "açúcar no sangue", "acucar no sangue"]):
        return "Diabetes, brow, é quando o corpo não controla bem o açúcar (glicose) no sangue. Tem o tipo 1 (autoimune) e o tipo 2 (mais comum, ligado a peso e hábitos). Controle: alimentação, movimento, e às vezes remédio/insulina. Fato livre. Prevenção e cuidado mudam o jogo. Acompanhamento médico é essencial."
    if any(w in p for w in ["o que é o colesterol", "colesterol", "gordura no sangue"]):
        return "Colesterol, brow, é uma gordura importante pro corpo (faz hormônios), mas o ruim (LDL) em excesso entope as artérias. O 'bom' (HDL) ajuda a limpar. Controle: alimentação, exercício e, se precisar, remédio. Fato livre. Exame de sangue mostra o número — saber é o primeiro passo pra cuidar."
    if any(w in p for w in ["como parar de fumar", "parar de fumar", "viciado em cigarro", "abandonar cigarro"]):
        return "Parar de fumar, brow, é difícil mas totalmente possível: define uma data, joga fora o cigarro, evita gatilhos (café, álcool, roda de fumante), busca apoio e se precisar, ajuda médica (adesivo, remédio). Os primeiros dias são os piores, depois melhora muito. Fato livre. Teu pulmão agradece desde o 1º dia."
    if any(w in p for w in ["como diminuir o álcool", "parar de beber", "beber menos", "viciado em álcool", "alcool"]):
        return "Álcool em excesso, brow, prejudica fígado, cérebro e decisões. Pra reduzir: define limite por dia, intercala com água, não bebe em jejum, e cuidado com 'um trago pra desestressar' virando hábito. Se perceber que não controla, busca ajuda (CAPS, Alcoólicos Anônimos). Fato livre. Equilíbrio é o segredo."
    if any(w in p for w in ["o que é a ansiedade", "ansiedade", "ansioso", "crise de ansiedade", "medo excessivo"]):
        return "Ansiedade, brow, é o corpo em alerta excessivo por preocupações — é comum, mas quando domina a vida atrapalha. Ajuda: respiração profunda, atividade física, sono, reduzir cafeína e notícias, e conversar. Terapia (e se precisar, remédio com médico) é caminho de verdade. Fato livre. Você não tá sozinho nisso."
    if any(w in p for w in ["o que é a depressão", "depressão", "depressao", "tristeza profunda", "não sinto mais nada"]):
        return "Depressão, brow, é uma doença real que tira o ânimo, energia e prazer — não é 'frescura' nem 'falta de fé'. Tem tratamento eficaz: terapia, remédio e apoio. Se você (ou alguém) tá assim, procurar ajuda é força, não fraqueza. CVV (188) e CAPS ajudam. Fato livre. Há saída, sempre há."
    if any(w in p for w in ["como fazer amizade", "fazer amigos", "conhecer pessoas", "sou tímido", "timidez", "timido"]):
        return "Fazer amizade, brow, começa com presença: vai a lugares que você curte, mostra interesse genuíno (pergunta sobre a pessoa), escuta mais que fala e mantém contato. Timidez é normal — começa pequeno (um 'oi', uma pergunta) e vai aumentando. Fato livre. Amizade é treino, não dom. Seja você e os certos aparecem."
    if any(w in p for w in ["como se vestir bem", "se vestir bem", "estilo", "roupa que combina", "moda masculina"]):
        return "Se vestir bem, brow, não é roupa cara: é roupa limpa, que veste certo no corpo e com cores que se combinam. Começa no básico bem ajustado (camiseta, calça, tênis limpo) e vai adicionando. Higiene e cheiro bom contam mais que marca. Fato livre. Estilo é confiança + o que te faz bem. Roupa certa muda o dia."
    if any(w in p for w in ["como ser mais confiante", "como ser confiante", "ser confiante", "autoconfiança", "autoconfianca", "confiar em mim", "autoestima", "como ter confiança", "como ter confianca", "falta de confiança", "falta de confianca"]):
        return "Confiança, brow, se constrói com pequenas vitórias: cumprir promessas que você faz a si mesmo, cuidar do corpo, aprender algo novo, preparar-se antes das situações. Não é nunca errar — é saber que você aguenta. Fato livre. Autoconfiança é hábito, não dom. Começa pequeno e vai crescendo."
    if any(w in p for w in ["como sair do tédio", "estou entediado", "tedio", "nada pra fazer", "tédio"]):
        return "Tédio, brow, é o playground da criatividade: o cérebro descansado cria. Aprende algo novo (idioma, instrumento, culinária), exercita, escreve, caminha, lê um livro de domínio público. Ou me desafia — eu sempre tenho assunto. Fato livre. Tédio é o convite pra começar algo. Bora usar a mente."
    if any(w in p for w in ["o que fazer no domingo", "plano de domingo", "domingo a toa", "final de semana"]):
        return "Domingo, brow, é dia de recarregar: pode ser descanso de verdade (dormir, seriado), passeio ao ar livre, família e amigos, ou hobby. O segredo é equilíbrio — recarregar pra segunda chegar bem. Fato livre. Não precisa render tanto, precisa te fazer bem. Aproveita teu domingo do teu jeito."
    if any(w in p for w in ["como ser produtivo", "produtividade", "ser mais produtivo", "organizar o tempo"]):
        return "Produtividade, brow, não é fazer mais, é fazer o que importa: define 3 prioridades do dia, ataca a mais difícil primeiro (quando a energia tá alta), desliga notificação e usa tempo focado. Pausa faz parte. Fato livre. Menos distração + foco real = mais resultado. Qualidade sobre quantidade."

    # ═══════════════════════════════════════════════════════════
    # MAIS ANIMAIS, NATUREZA E TECNOLOGIA (fatos livres)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que é um cachorro", "o que e um cachorro", "cachorro", "dogs", "melhor amigo do homem"]):
        if any(x in p for x in ["rabo", "ronrona", "latir", "lambe"]):
            pass
        else:
            return "O cachorro, brow, é o melhor amigo do homem há milhares de anos: foi o primeiro animal domesticado, descendente do lobo. Existem centenas de raças, de miniaturas a gigantes. São leais, inteligentes e melhoram a vida de quem tem. Fato livre. Cachorro é família — e é responsa cuidar direito."
    if any(w in p for w in ["o que é um gato", "o que e um gato", "gato", "felino"]):
        return "O gato, brow, é um felino domesticado há milhares de anos, que se aproximou do ser humano por causa dos ratos. É independente, limpo e carinhoso (no jeito dele). Existem muitas raças. Fato livre. Gato tem personalidade própria — quem tem gato sabe. Cuidar deles é amor."
    if any(w in p for w in ["o que é um leão", "o que e um leao", "leão", "leao", "rei da selva"]):
        if "camaleao" in p or "camaleão" in p:
            pass
        else:
            return "O leão, brow, é o 'rei da selva' (apesar de viver na savana, não na selva). Vive em grupos (alcateias), o macho tem a juba. É um dos maiores felinos do mundo e um grande predador. Fato livre. Símbolo de força e coragem em muitas culturas. Respeita o rei."
    if any(w in p for w in ["o que é um elefante", "o que e um elefante", "elefante"]):
        return "O elefante, brow, é o maior animal terrestre do mundo, com tromba, orelhas grandes e memória famosa. Vive em grupos liderados pela matriarca. São inteligentes, sensíveis e sociais. Fato livre. Infelizmente, estão ameaçados pela caça do marfim. Proteger elefante é proteger um gigante gentil."
    if any(w in p for w in ["o que é uma baleia", "o que e uma baleia", "baleia", "golfinho", "cetáceo", "cetaceo"]):
        if "polvo" in p or "baleia azul" in p or "baleia-azul" in p or "o que e a baleia" in p or "o que é a baleia" in p or "o que e o golfinho" in p or "o que é o golfinho" in p:
            pass
        else:
            return "Baleias e golfinhos, brow, são mamíferos marinhos (cetáceos) — não são peixes! Respira ar, amamentam os filhotes. A baleia-azul é o maior animal que já existiu. Os golfinhos são super inteligentes. Fato livre. O oceano é a casa deles — e a gente precisa protegê-la."
    if any(w in p for w in ["o que é um tubarão", "o que e um tubarao", "tubarão", "tubarao"]):
        return "O tubarão, brow, é um predador marinho com esqueleto de cartilagem (não osso). Existem mais de 400 espécies, do pequeno ao tubarão-baleia (gigante e inofensivo). Ele mantém o equilíbrio do oceano. Fato livre. Ataque a humano é raro — a gente é que ameaça eles mais. Respeito ao oceano."
    if any(w in p for w in ["o que é um dinossauro", "o que e um dinossauro", "dinossauro", "dino", "tiranossauro", "rex"]):
        return "Os dinossauros, brow, foram répteis gigantes que dominaram a Terra por ~165 milhões de anos e sumiram há ~66 milhões (asteroide). Eram de vários tamanhos, do galinho ao T. Rex enorme. A ciência estuda pelos fósseis. Fato livre. Fascinante: o mundo já foi muito diferente."
    if any(w in p for w in ["o que é um panda", "o que e um panda", "panda"]):
        return "O panda, brow, é o urso símbolo da China, famoso por comer bambu (quase só isso) e pela cara fofa em preto e branco. É símbolo de conservação: o logo do WWF é um panda. Fato livre. São calmos e comem o dia todo. Proteger a espécie é missão global."
    if any(w in p for w in ["o que é uma águia", "o que e uma aguia", "águia", "aguia"]):
        return "A águia, brow, é uma ave de rapina com visão incrível (vê presas de longe) e garras fortes. É símbolo de liberdade, visão e força em muitas culturas (até em brasões de países). Fato livre. A águia voa alto e enxerga longe — meta de vida, né? Que tal enxergar longe como ela?"
    if any(w in p for w in ["o que é uma borboleta", "o que e uma borboleta", "borboleta", "lagarta"]):
        return "A borboleta, brow, passa por uma transformação incrível: ovo, lagarta, pupa (casulo) e, por fim, borboleta. Essa metamorfose é símbolo de mudança e renovação. Há milhares de espécies coloridas. Fato livre. A borboleta mostra que a gente também pode se transformar e voar."
    if any(w in p for w in ["o que é uma abelha", "o que e uma abelha", "abelha", "mel"]):
        if "melhor" in p or "melhora" in p or "melhore" in p or "melhoria" in p or "melhorar" in p:
            pass
        else:
            return "A abelha, brow, é essencial pro planeta: poliniza as plantas, incluindo boa parte da nossa comida. Produz mel, cera e própolis. Vivem em colmeias organizadas com uma rainha. Fato livre. Sem abelhas, falta comida no mundo. Elas são pequenas, mas sustentam a vida."
    if any(w in p for w in ["o que é a cadeia alimentar", "cadeia alimentar", "ecossistema", "predador"]):
        return "Cadeia alimentar, brow, é quem come quem num ecossistema: planta (produtor) → herbívoro (consumidor 1) → carnívoro (consumidor 2). Tudo interligado. Se um elo some, desequilibra tudo. Fato livre. A natureza é uma teia — cada bicho tem seu papel. Respeitar é preservar o todo."
    if any(w in p for w in ["o que é um vírus", "o que e um virus", "vírus", "virus", "bactéria", "bacteria"]):
        if any(x in p for x in ["computador", "pc", "malware", "antivírus", "software", "celular"]):
            pass
        else:
            return "Vírus e bactérias, brow, são microrganismos diferentes: bactéria é um ser vivo que causa infecções (mas muitas são úteis); vírus é menor, não é célula, e precisa de uma célula pra se reproduzir. Alguns causam doenças (gripe, covid). Fato livre. Higiene e vacina são as defesas."
    if any(w in p for w in ["o que é a vacina", "o que e a vacina", "vacina", "como funciona vacina"]):
        if any(x in p for x in ["covid", "corona", "gripe", "febre amarela", "sarampo"]):
            pass
        else:
            return "Vacina, brow, é uma das maiores conquistas da medicina: ensina o corpo a reconhecer e combater um vírus/bactéria antes de adoecer, usando um 'pedaço' do micróbio. Erradicou a varíola e controla muitas doenças. Fato livre. Vacinar é proteger você e a comunidade. Ciência salva vidas."
    if any(w in p for w in ["o que é a poluição", "o que e a poluicao", "poluição", "poluicao", "lixo no mar"]):
        return "Poluição, brow, é o lixo e a sujeira que a gente joga no ar, na água e no chão: fumaça, plástico, agrotóxico. Danifica a saúde e o planeta. Reduzir: menos plástico, reciclar, transporte limpo, plantar. Fato livre. O planeta não tem plano B — cuidar dele é cuidar da gente."
    if any(w in p for w in ["o que é reciclagem", "o que e reciclagem", "reciclagem", "reciclar"]):
        return "Reciclagem, brow, é transformar lixo em matéria-prima de novo: plástico, papel, vidro, metal vira outra coisa. Reduz lixo, poupa recursos e energia. Regra dos 3 R: reduzir, reutilizar, reciclar. Fato livre. Cada garrafa reciclada conta. Começa na sua casa, pequena mudança grande efeito."
    if any(w in p for w in ["o que é energia solar", "o que e energia solar", "energia solar", "placa solar", "painel solar"]):
        return "Energia solar, brow, é a energia do sol captada por placas fotovoltaicas que viram luz em eletricidade. É limpa (não polui), renovável e já é mais barata. O Brasil tem enorme potencial. Fato livre. O futuro é energia limpa — e o sol é de graça. Investir nisso é cuidar do planeta."
    if any(w in p for w in ["o que é energia nuclear", "o que e energia nuclear", "energia nuclear", "usina nuclear", "energia atomica", "energia atômica"]):
        return "Energia nuclear, brow, é a energia liberada na fissão (quebra) do átomo, usada em usinas pra gerar eletricidade. É potente e não polui o ar, mas tem o desafio do lixo radioativo e dos acidentes (Chernobyl, Fukushima). Fato livre. Energia que divide opiniões, mas é importante no mundo."
    if any(w in p for w in ["o que é um celular", "o que e um celular", "celular", "como funciona o celular", "smartphone"]):
        return "O celular (smartphone), brow, é um computador de bolso: tem processador, memória, tela e internet. Conecta, fotografa, navega, roda app. Virou parte da vida de todo mundo. Fato livre. É ferramenta poderosa — mas cuidado: é pra ser usado, não pra usar você. Equilíbrio."
    if any(w in p for w in ["o que é um computador", "o que e um computador", "computador", "como funciona o pc", "notebook"]):
        if "rede de computador" in p or "rede de computadores" in p:
            pass
        else:
            return "O computador, brow, é uma máquina que processa dados: tem processador (CPU), memória, disco e programa. Faz cálculo, texto, internet, jogos — até roda IA (como eu!). Fato livre. Do PC de mesa ao celular, tudo é computador. Quem entende disso domina o mundo digital."
    if any(w in p for w in ["o que é programação", "o que e programacao", "programação", "programacao", "codigo", "código de computador"]):
        return "Programação, brow, é dar instruções pro computador em uma linguagem que ele entende (Python, JS, C). É tipo uma receita: passos lógicos pra resolver um problema. Cria apps, sites, IA. Fato livre. É uma das habilidades mais valiosas do mundo. Quer aprender? Começa pelo básico que eu te ajudo."

    # ═══════════════════════════════════════════════════════════
    # FILOSOFIA, RELIGIÃO E ESPIRITUALIDADE (fatos livres)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que é filosofia", "o que e filosofia", "filosofia", "filosofar"]):
        return "Filosofia, brow, é 'amor à sabedoria': o exercício de questionar o mundo e a vida com razão — o que é certo, o que é real, por que existimos. Nasceu na Grécia (Sócrates, Platão, Aristóteles). Fato livre. Todo mundo filosofa sem saber. Questionar é a porta do entendimento."
    if any(w in p for w in ["quem foi sócrates", "socrates", "sócrites", "método socrático", "metodo socratico"]):
        return "Sócrates, brow, foi um filósofo grego (séc. V a.C.), mestre de Platão, que ensinava fazendo perguntas (método socrático) pra pessoa pensar por si. Não escreveu nada — ficou conhecido pelos discípulos. Foi condenado à morte por 'corromper' a juventude. Fato livre. 'Só sei que nada sei' é dele."
    if any(w in p for w in ["quem foi platão", "platao", "o mundo das ideias", "idealismo"]):
        return "Platão, brow, foi filósofo grego, discípulo de Sócrates e professor de Aristóteles. Criou a Teoria das Ideias: o mundo que vemos é uma 'sombra' de um mundo perfeito de ideias. Escreveu 'A República'. Fundou a Academia. Fato livre. Um dos maiores pensadores de todos os tempos."
    if any(w in p for w in ["quem foi aristóteles", "aristoteles", "aristóteles"]):
        return "Aristóteles, brow, foi o filósofo grego mais influente: aluno de Platão, professor de Alexandre o Grande. Estudou lógica, ética, política, biologia. Fundou a Lógica. 'A virtude está no meio-termo'. Fato livre. A base do pensamento ocidental por séculos. Gênio absoluto."
    if any(w in p for w in ["quem foi aristóteles", "aristoteles", "aristóteles"]):
        return "Aristóteles, brow, foi o filósofo grego mais influente: aluno de Platão, professor de Alexandre o Grande. Estudou lógica, ética, política, biologia. Fundou a Lógica. 'A virtude está no meio-termo'. Fato livre. A base do pensamento ocidental por séculos. Gênio absoluto."
    if any(w in p for w in ["o que é budismo", "o que e budismo", "budismo", "buda", "buddha"]):
        return "Budismo, brow, é uma tradição espiritual fundada por Sidarta Gautama (o Buda, 'o iluminado'), na Índia, ~séc. VI a.C. Busca o fim do sofrimento através do desapego, da compaixão e da meditação. Não é teísta (não exige crer num deus). Fato livre. Paz interior é o objetivo. Respeito a todas as crenças."
    if any(w in p for w in ["o que é islamismo", "o que e islamismo", "islamismo", "islam", "muçulmanos", "alcorão", "alcorao"]):
        return "Islamismo, brow, é a religião fundada por Maomé (Muhammad), na Arábia, séc. VII, baseada no Alcorão. Segue 5 pilares (fé, oração, caridade, jejum, peregrinação a Meca). É a segunda maior religião do mundo. Fato livre. Respeito: cada fé tem sua história e seus seguidores. Nada a ver com extremismo."
    if any(w in p for w in ["o que é judaísmo", "o que e judaismo", "judaísmo", "judaismo", "torá", "tora"]):
        return "Judaísmo, brow, é a religião do povo judeu, a mais antiga das três religiões abraâmicas (judeus, cristãos, muçulmanos), com ~3 mil anos. Baseada na Torá. Foi a que deu origem ao cristianismo e dialogou com o islamismo. Fato livre. História longa e de muita resistência. Respeito sempre."
    if any(w in p for w in ["o que é o hinduísmo", "o que e o hinduismo", "hinduísmo", "hinduismo", "hindu"]):
        return "Hinduísmo, brow, é uma das religiões mais antigas do mundo, da Índia: muitos deuses, karma, reencarnação e busca pela libertação (moksha). Não tem um único fundador. Os Vedas são textos sagrados. Fato livre. Uma das maiores fés do planeta, rica em tradição e filosofia. Respeito."
    if any(w in p for w in ["o que é espiritualidade", "o que e espiritualidade", "espiritualidade", "espiritual"]):
        return "Espiritualidade, brow, é a busca por sentido, conexão e algo maior que a gente — pode ser religião, natureza, meditação, fé ou propósito. É diferente de religião (que é institucional). Cada um encontra do seu jeito. Fato livre. Cuidar do espírito é tão importante quanto do corpo. Respeita tua busca."
    if any(w in p for w in ["o que é meditação", "o que e meditacao", "meditação", "meditacao", "como meditar"]):
        return "Meditação, brow, é treinar a atenção e a calma: sentar, respirar e focar no presente, sem julgar os pensamentos. Reduz stress, melhora foco e sono. Começa com 5 min/dia: respira fundo, foca no ar entrando e saindo. Fato livre. Mente tranquila é superpoder. Experimenta."
    if any(w in p for w in ["o que é karma", "o que e karma", "karma", "carma"]):
        return "Karma, brow, vem das religiões indianas (hinduísmo, budismo): a ideia de que ações geram consequências — o que você faz volta. 'Colhe o que planta'. Não é destino cego, é causa e efeito moral. Fato livre. Praticar o bem é plantar bem. Sempre dá tempo de escolher melhor."
    if any(w in p for w in ["o que é o karma", "o que e o karma", "karma", "carma"]):
        return "Karma, brow, é a lei de causa e efeito das tradições indianas: cada ação (boa ou má) gera resultado. Não é punição divina, é consequência natural. Fato livre. Se tu tá plantando o que não quer colher, muda a semente. Vida é plantio constante. Escolhe bem."
    if any(w in p for w in ["quem foi jesus", "quem e jesus", "jesus cristo", "jesus"]):
        return "Jesus, brow, é a figura central do cristianismo: um judeu da Galileia, pregador da compaixão e do amor ao próximo, que reuniu seguidores. O cristianismo crê que ele é o filho de Deus. Viveu ~séc. I na Palestina. Fato histórico e religioso livre. Para bilhões, é o Salvador; pra história, um mestre marcante."
    if any(w in p for w in ["quem foi maomé", "maomé", "muhammad", "profeta"]):
        if "jude" in p or "jesus" in p:
            pass
        else:
            return "Maomé (Muhammad), brow, foi o profeta do islamismo, na Arábia, séc. VII. Segundo a tradição islâmica, recebeu a revelação do Alcorão do anjo Gabriel. Unificou a península árabe sob o islamismo. Fato religioso livre. Figura central de uma das maiores fés do mundo. Respeito à crença."
    if any(w in p for w in ["o que é o evangelho", "o que e o evangelho", "evangelho", "evangelho"]):
        return "Evangelho, brow, significa 'boa notícia': no cristianismo, são os 4 livros do Novo Testamento (Mateus, Marcos, Lucas, João) que contam a vida e ensinos de Jesus. Fato religioso livre. Uma das bases da fé cristã. Independente da crença, é texto que marcou a história e a cultura do Ocidente."
    if any(w in p for w in ["o que é o catolicismo", "o que e o catolicismo", "catolicismo", "católico", "igreja católica", "igreja catolica"]):
        return "Catolicismo, brow, é o maior ramo do cristianismo, liderado pelo Papa (no Vaticano). Tem os sacramentos (batismo, comunhão), a Virgem Maria e os santos. Chegou ao Brasil com os portugueses e é a maior religião do país. Fato religioso livre. Respeito: fé de milhões. Cada um crê do seu jeito."
    if any(w in p for w in ["o que é o protestantismo", "o que e o protestantismo", "protestantismo", "evangélico", "evangelico", "luterano"]):
        return "Protestantismo, brow, nasceu na Reforma do séc. XVI (Martinho Lutero), separando-se da Igreja Católica. Dá ênfase à Bíblia e à fé. No Brasil, os evangélicos cresceram muito. Fato religioso livre. Respeito: são fés com milhões de seguidores. Diversidade religiosa é parte da nossa história."

    # ═══════════════════════════════════════════════════════════
    # ESPORTES, ARTES, MÚSICA E CULTURA POP (fatos livres)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que é basquete", "o que e basquete", "basquete", "basketball", "jordan", "nba"]):
        return "Basquete, brow, foi criado nos EUA (1891, James Naismith): 5 contra 5, arremessar a bola na cesta. Michael Jordan, LeBron, e no Brasil o Oscar Schmidt (fenômeno). Virou esporte global. Fato livre. Cesta de três, enterrada, jogo rápido. Quem joga sabe: é viciante."
    if any(w in p for w in ["o que é vôlei", "o que e volei", "vôlei", "volei", "volleyball"]):
        return "Vôlei, brow, foi criado nos EUA (1895): 6 contra 6, bola por cima da rede, sem deixar cair no chão. O Brasil é potência mundial (Bernardinho, Giba, as meninas). Fato livre. Saque, manchete, bloqueio. Esporte coletivo de verdade — ninguém ganha sozinho."
    if any(w in p for w in ["o que é tênis", "o que e tenis", "tênis", "tenis de quadra", "raquete"]):
        if "correr" in p or "chutar" in p or "bola" in p and "pé" in p or "pe" in p:
            pass
        else:
            return "Tênis, brow, é esporte de raquete jogado 1 contra 1 (ou duplas), com a bola batendo na quadra. Grandes nomes: Federer, Nadal, Djokovic, e no Brasil o Guga Kuerten. Fato livre. Grand Slam (4 torneios) é o auge. Precisão, força e cabeça. Esporte elegante e brutal ao mesmo tempo."
    if any(w in p for w in ["o que é futebol americano", "futebol americano", "nfl", "super bowl"]):
        return "Futebol americano, brow, é bem diferente do nosso: 11 contra 11, com capacete e proteção, levando a bola (oval) até a zona de pontuação. É o esporte mais popular dos EUA, com o Super Bowl como final. Fato livre. Tático e físico. Cada lance é estratégia. Paixão americana."
    if any(w in p for w in ["o que é boxe", "o que e boxe", "boxe", "boxing", "muhammad ali", "lutador"]):
        return "Boxe, brow, é luta com luvas, apenas socos acima da cintura, em rounds. Grandes lendas: Muhammad Ali, Mike Tyson. Fato livre. Exige técnica, defesa e resistência. É um dos esportes mais antigos (Grécia antiga). Treino de boxe é dos mais completos. Respeito ao esporte."
    if any(w in p for w in ["o que é jiu jitsu", "o que e jiu jitsu", "jiu jitsu", "jjj", "bjj", "arte suave"]):
        return "Jiu-jitsu, brow, é arte marcial de luta no chão: usa alavancas e finalizações (chave, estrangulamento) pra vencer alguém maior usando técnica. No Brasil virou potência mundial (Gracie). Fato livre. 'Arte suave' — vencer pela inteligência, não pela força. Respeito e disciplina."
    if any(w in p for w in ["o que é capoeira", "o que e capoeira", "capoeira", "capoeira angola"]):
        return "Capoeira, brow, é arte marcial brasileira de origem africana, que mistura luta, dança, música e jogo. Foi criada pelos escravizados como forma de resistência. Tem berimbau, roda, ginga. Fato livre. Patrimônio cultural do Brasil. É luta, é dança, é história. Respeita o jogo."
    if any(w in p for w in ["o que é o rock", "o que e o rock", "rock", "rock and roll", "rock n roll"]):
        return "Rock, brow, nasceu nos anos 50 (Elvis, Chuck Berry) e explodiu com os Beatles, Led Zeppelin, Queen... Guitarra, baixo, bateria e atitude. Virou movimento cultural. Fato livre. Do rock clássico ao metal, cada década tem seu som. Bater cabeça e cantar junto é terapia."
    if any(w in p for w in ["o que é o jazz", "o que e o jazz", "jazz", "blues"]):
        return "Jazz, brow, nasceu nos EUA (Nova Orleans, início do séc. XX), mistura de blues e ritmos africanos. Improvisação é a alma: os músicos criam na hora. Louis Armstrong, Ella Fitzgerald. Fato livre. Do jazz nasceu boa parte da música moderna. É liberdade em forma de som."
    if any(w in p for w in ["o que é o hip hop", "o que e o hip hop", "hip hop", "rap", "rapper"]):
        return "Hip hop, brow, nasceu nos EUA (Bronx, anos 70) como cultura: rap, DJ, breakdance e grafite. É voz da periferia, denúncia e estilo de vida. No Brasil, o rap cresceu forte (Racionais, Sabotage). Fato livre. O hip hop deu voz a quem não tinha. Cultura de rua, respeito e mensagem."
    if any(w in p for w in ["o que é o funk", "o que e o funk", "funk brasileiro", "funk carioca", "funk"]):
        return "Funk, brow, no Brasil é um fenômeno: nasceu no Rio (favelas) com batidas fortes e letras da quebrada, inspirado no Miami bass. Virou cultura de massa e exportação. Fato livre. Muita gente critica, mas o funk é potência cultural e econômica. Respeito ao ritmo que nasceu na rua."
    if any(w in p for w in ["o que é samba", "o que e samba", "samba", "escola de samba", "carnaval"]):
        if "o que é o carnaval" in p or "o que e o carnaval" in p or "o que é carnaval" in p or "o que e carnaval" in p or "carnaval brasileiro" in p or "o que é o carnaval brasileiro" in p:
            pass
        else:
            return "Samba, brow, é o coração musical do Brasil: nasceu no Rio (raízes africanas, samba de roda), e virou símbolo do Carnaval com as escolas de samba. Cartola, Noel Rosa, Martinho. Fato livre. O samba é identidade brasileira, alegria e resistência. Bate o pandeiro e canta junto."
    if any(w in p for w in ["o que é sertanejo", "o que e sertanejo", "sertanejo", "modão", "sertanejo universitario"]):
        return "Sertanejo, brow, nasceu no interior do Brasil contando histórias do campo (moda de viola). Hoje o sertanejo universitário domina as paradas (Zezé di Camargo, Chitãozinho, e a nova geração). Fato livre. É o ritmo mais tocado do país. De raiz a universitário, é cultura nossa."
    if any(w in p for w in ["o que é a ópera", "o que e a opera", "ópera", "opera", "música clássica", "musica classica"]):
        return "Música clássica, brow, é a tradição erudita ocidental: Bach, Mozart, Beethoven, Chopin. A ópera combina canto, música e teatro. Fato livre. Pode parecer 'chique', mas é emoção pura — e domínio público (tocável de graça). Ouçam Beethoven uma vez: muda a cabeça."
    if any(w in p for w in ["o que é a pintura", "o que e a pintura", "pintura", "mona lisa", "arte renascentista"]):
        return "Pintura, brow, é arte com tinta: do renascimento (da Vinci, Michelangelo) aos modernos (Picasso, Van Gogh, Tarsila). A Mona Lisa, o Abaporu, o Grito. Fato livre. Cada época tem seu estilo. Museus guardam séculos de história. Ver uma obra de perto é viagem no tempo."
    if any(w in p for w in ["o que é a escultura", "o que e a escultura", "escultura", "estátua", "estatua"]):
        return "Escultura, brow, é arte de dar forma à matéria: pedra, madeira, metal. Michelangelo fez o Davi; o Brasil tem o Aleijadinho (igrejas de MG). Fato livre. Do mármore antigo ao moderno, escultura ocupa espaço e eterniza ideias. Arte que se toca com os olhos."
    if any(w in p for w in ["o que é literatura", "o que e literatura", "literatura", "livro", "ler"]):
        return "Literatura, brow, é a arte da palavra: romances, poesia, contos. É porta pra outros mundos e mentes. Os clássicos de domínio público (Machado, Camões, Shakespeare) são tesouro livre. Fato livre. Ler expande vocabulário, empatia e visão de mundo. Livro é o melhor investimento barato."

    # ═══════════════════════════════════════════════════════════
    # MAIS GEOGRAFIA E PERSONALIDADES BRASILEIRAS (fatos livres)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que é o rio amazonas", "rio amazonas", "amazonas", "rio amazonia"]):
        return "O Rio Amazonas, brow, é um dos maiores rios do mundo em volume de água — carrega mais água que os 7 seguintes juntos. Nasce no Peru e atravessa o Brasil até o Atlântico. Muitos o consideram o mais longo (disputa com o Nilo). Fato livre. Uma potência de vida e natureza."
    if any(w in p for w in ["o que é a floresta amazônica", "floresta amazonica", "amazônia", "amazonia"]):
        return "A Floresta Amazônica, brow, é a maior floresta tropical do mundo, com bilhões de árvores e milhares de espécies. Produz muita da chuva e do oxigênio. É casa de povos indígenas e animais únicos. Fato livre. Chamada de 'pulmão do planeta'. Protegê-la é proteger a vida. Desmatamento é o maior inimigo."
    if any(w in p for w in ["o que é o pantanal", "o que e o pantanal", "pantanal", "maior area alagada"]):
        return "O Pantanal, brow, é a maior área alagada do planeta, no Centro-Oeste do Brasil. É um paraíso de biodiversidade: onças, tuiuiús, jacarés, capivaras. No período de cheia, vira um mar de água doce. Fato livre. Patrimônio natural único. Turismo de natureza e preservação andam juntos."
    if any(w in p for w in ["o que é a caatinga", "o que e a caatinga", "caatinga", "sertão", "sertao"]):
        return "Caatinga, brow, é o bioma do sertão nordestino, exclusivo do Brasil: vegetação resistente à seca, de clima semiárido. O povo sertanejo aprendeu a conviver com a escassez. Fato livre. É resiliente e único no mundo. 'Terra do sol forte e do povo forte'."
    if any(w in p for w in ["o que é a mata atlântica", "mata atlantica", "mata atlântica"]):
        return "Mata Atlântica, brow, é a floresta que cobria a costa brasileira, onde nasceram as primeiras cidades. Hoje resta pouca (muito desmatada), mas abriga enorme biodiversidade e cidades como Rio e SP dependem dela. Fato livre. Restaurar a mata é missão urgente. É nossa história e nosso futuro."
    if any(w in p for w in ["o que é o cerrado", "o que e o cerrado", "cerrado"]):
        return "Cerrado, brow, é o bioma do Planalto Central (onde fica Brasília): árvores tortas, chapadas e rica água. É o 'berço das águas' do Brasil — de lá nascem grandes rios. Virou a maior fronteira agrícola do país. Fato livre. Equilibrar produção e preservação é o desafio."
    if any(w in p for w in ["o que é a foz do amazonas", "foz do amazonas", "mar de agua doce", "lençol"]):
        return "Na foz do Amazonas, brow, a água doce do rio se encontra com o salgado do mar — há até um 'mar de água doce' que se estende no oceano. Os Lençóis Maranhenses são dunas com lagoas de água da chuva. Fato livre. Paisagens brasileiras de tirar o fôlego."
    if any(w in p for w in ["quem foi pelé", "pele", "rei do futebol", "edson arantes"]):
        if "mole" in p or "pele de" in p or "pele e" in p or "pele do" in p or "pele no" in p or "pele se" in p or "pele a" in p or "o que e a pele" in p or "o que é a pele" in p or "o que e pele" in p or "o que é pele" in p or "maior órgão" in p or "camadas da pele" in p or "orgao" in p or "o que e a sua pele" in p:
            pass
        else:
            return "Pelé, brow, foi o 'Rei do Futebol', Edson Arantes do Nascimento: o maior jogador da história segundo muita gente. Foi campeão do mundo 3 vezes (1958, 62, 70) e marcou mais de 1000 gols. Fato livre. Levou o Brasil e o futebol pro mundo. Lenda eterna."
    if any(w in p for w in ["quem foi ayrton senna", "ayrton senna", "senna", "piloto brasileiro"]):
        return "Ayrton Senna, brow, foi o maior piloto brasileiro de Fórmula 1: 3 vezes campeão mundial (1988, 90, 91), conhecido pela velocidade na chuva e pela lenda de Monaco. Morreu em 1994 (Ímola). Fato livre. Virou símbolo de talento, garra e caridade (Instituto Ayrton Senna). Ídolo eterno."
    if any(w in p for w in ["quem foi getúlio vargas", "getulio vargas", "getúlio", "vargas"]):
        return "Getúlio Vargas, brow, foi um dos presidentes mais importantes do Brasil: governou a Era Vargas (1930-1945) e depois voltou (1951-54). Criou leis trabalhistas (CLT, salário mínimo) e a Petrobras. Se matou em 1954. Fato livre. Figura polêmica e marcante da nossa história."
    if any(w in p for w in ["quem foi chico xavier", "chico xavier", "chico xavier"]):
        return "Chico Xavier, brow, foi um médium brasileiro famoso (1910-2002), que psicografou centenas de livros espíritas, cujos direitos autorais doou pra caridade. Virou símbolo de caridade e paz no país. Fato livre. Respeitado até por quem não é espírita. Uma figura de bondade que marcou o Brasil."
    if any(w in p for w in ["quem foi dom hélder câmara", "dom helder camara", "dom hélder", "bispo da periferia"]):
        return "Dom Hélder Câmara, brow, foi um bispo brasileiro (1909-1999), defensor dos pobres e dos direitos humanos, conhecido como 'bispo dos favelados' e 'o irmão de todos'. Lutou contra a ditadura. Fato livre. Reconhecido mundialmente pela paz e justiça. Referência de coragem e fé."
    if any(w in p for w in ["quem foi carlos drummond", "carlos drummond", "drummond", "poeta mineiro"]):
        return "Carlos Drummond de Andrade, brow, foi um dos maiores poetas brasileiros (1902-1987), mineiro de Itabira. Escreveu 'No meio do caminho tinha uma pedra', 'E agora, José?'. A obra entrou em domínio público recentemente. Fato livre. Poesia que fala da vida simples e profunda. Gênio das palavras."
    if any(w in p for w in ["quem foi clarice lispector", "clarice lispector", "lispector"]):
        return "Clarice Lispector, brow, foi uma das maiores escritoras brasileiras (1920-1977), com um estilo único de mergulho na alma e nas emoções. Escreveu 'A Hora da Estrela', 'Perto do Coração Selvagem'. Fato livre (os fatos sobre ela). Sua obra ainda é protegida por direitos, mas ela é patrimônio nosso."
    if any(w in p for w in ["quem foi caetano veloso", "caetano veloso", "gilberto gil", "tropicália", "tropicalia"]):
        return "Caetano Veloso e Gilberto Gil, brow, foram os líderes da Tropicália (anos 60), que misturou tudo: rock, MPB, guitarra e poesia. Caetano é baiano, um dos maiores compositores brasileiros. Fato livre. Movimento que marcou a música e até a política. Arte que ousou."

    # ═══════════════════════════════════════════════════════════
    # PERSONALIDADES HISTÓRICAS MUNDIAIS (fatos livres)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["quem foi leonardo da vinci", "leonardo da vinci", "da vinci", "mona lisa"]):
        return "Leonardo da Vinci, brow, foi um gênio do Renascimento italiano (1452-1519): pintor, inventor, cientista. Pintou a Mona Lisa e A Última Ceia, e desenhou máquinas (helicóptero, tanque) séculos antes. Fato livre. Símbolo da 'mente universal' — arte e ciência juntas. Gênio absoluto."
    if any(w in p for w in ["quem foi michelangelo", "michelangelo", "miguelangelo", "davi de michelangelo"]):
        return "Michelangelo, brow, foi outro gigante do Renascimento italiano (1475-1564): escultor e pintor. Fez o Davi, a Pietà e pintou o teto da Capela Sistina. Fato livre. Escultura e pintura perfeitas. Rivais de Da Vinci, mas os dois mudaram a arte pra sempre."
    if any(w in p for w in ["quem foi van gogh", "van gogh", "vincent van gogh"]):
        return "Vincent van Gogh, brow, foi um pintor holandês (1853-1890), pós-impressionista, famoso pelos girassóis, a Noite Estrelada e a pincelada vibrante. Sofreu com saúde mental e morreu pobre e jovem. Fato livre. Hoje é um dos mais valiosos da história. A arte dele venceu o tempo."
    if any(w in p for w in ["quem foi picasso", "picasso", "pablo picasso"]):
        return "Pablo Picasso, brow, foi um pintor espanhol (1881-1973), um dos fundadores do cubismo, que revolucionou a arte com formas geométricas. Fez Guernica (sobre a guerra). Fato livre. Um dos artistas mais famosos e influentes do séc. XX. Arte que quebrou todas as regras."
    if any(w in p for w in ["quem foi mozart", "mozart", "wolfgang", "amadeus"]):
        return "Wolfgang Amadeus Mozart, brow, foi um gênio da música clássica (1756-1791), austríaco, que compunha desde criança — óperas, sinfonias, sonatas. Morreu jovem (35), mas deixou uma obra gigante. Fato livre (a obra é de domínio público). Um dos maiores compositores da história."
    if any(w in p for w in ["quem foi beethoven", "beethoven", "ludwig"]):
        return "Ludwig van Beethoven, brow, foi um compositor alemão (1770-1827), que ficou surdo mas criou obras-primas como a 5ª e a 9ª Sinfonia (com o 'Hino à Alegria'). Fato livre (obra em domínio público). Prova de que a arte vence qualquer barreira. Gênio da superação."
    if any(w in p for w in ["quem foi bach", "bach", "johann sebastian bach"]):
        return "Johann Sebastian Bach, brow, foi um compositor alemão (1685-1750), mestre do barroco — fugas, concertos, música sacra. A obra dele é de domínio público e base da música ocidental. Fato livre. Músicos estudam Bach até hoje. Estrutura perfeita em forma de música."
    if any(w in p for w in ["quem foi shakespeare", "shakespeare", "romeu e julieta", "hamlet"]):
        return "William Shakespeare, brow, foi o maior dramaturgo de todos os tempos, inglês (1564-1616): Romeu e Julieta, Hamlet ('ser ou não ser'), Macbeth, Otelo. Criou milhares de palavras em inglês. Obra em domínio público. Fato livre. Um dos maiores da humanidade — e livre pra BranPy reescrever."
    if any(w in p for w in ["quem foi cervantes", "cervantes", "dom quixote"]):
        return "Miguel de Cervantes, brow, foi o escritor espanhol (1547-1616) autor de Dom Quixote (1605), considerado o primeiro romance moderno. Conta a história de um homem que luta contra moinhos de vento imaginando gigantes. Obra em domínio público. Fato livre. Gênio do humor e da sátira."
    if any(w in p for w in ["quem foi santo agostinho", "santo agostinho", "agostinho", "santo de hipona"]):
        return "Santo Agostinho, brow, foi um dos maiores pensadores cristãos (354-430), bispo de Hipona. Escreveu 'Confissões' e 'A Cidade de Deus', juntando fé e filosofia. Fato livre. Influenciou a teologia e o pensamento ocidental por séculos. Uma mente brilhante da fé."
    if any(w in p for w in ["quem foi tomás de aquino", "tomas de aquino", "aquino", "escolástica", "escolastica"]):
        return "Tomás de Aquino, brow, foi um frade e filósofo cristão (1225-1274), que juntou a fé cristã com a filosofia de Aristóteles. Escreveu a 'Suma Teológica'. Fato livre. Um dos maiores pensadores da Idade Média. Raciocínio e fé andando juntos. Influência enorme."
    if any(w in p for w in ["quem foi martin luther king", "martin luther king", "luther king", "mlk"]):
        return "Martin Luther King Jr., brow, foi um pastor e líder dos direitos civis nos EUA (1929-1968), famoso pelo discurso 'Eu tenho um sonho'. Lutou contra o racismo de forma pacífica. Foi assassinado em 1968. Fato livre. Símbolo mundial de igualdade e coragem."
    if any(w in p for w in ["quem foi nelson mandela", "nelson mandela", "mandela", "apartheid"]):
        return "Nelson Mandela, brow, foi o líder que acabou com o apartheid (segregação racial) na África do Sul (1918-2013). Ficou 27 anos preso, saiu e se tornou o primeiro presidente negro do país, promovendo perdão e paz. Fato livre. Nobel da Paz. Exemplo máximo de grandeza e reconciliação."
    if any(w in p for w in ["quem foi gandhi", "gandhi", "mahátma gandhi", "mahatma"]):
        return "Mahatma Gandhi, brow, foi o líder da independência da Índia (1869-1948), usando a desobediência civil pacífica — resistência sem violência. Conquistou a liberdade do país. Foi assassinado. Fato livre. Símbolo mundial da paz e da não-violência. Inspirou o mundo inteiro."
    if any(w in p for w in ["quem foi anne frank", "anne frank", "ana frank"]):
        return "Anne Frank, brow, foi uma jovem judia que se escondeu com a família dos nazistas em Amsterdã (durante a 2ª Guerra) e escreveu um diário famoso. Morreu num campo de concentração aos 15. O diário dela virou livro lido no mundo todo. Fato livre. Voz da memória e do Holocausto."
    if any(w in p for w in ["quem foi a madre teresa", "madre teresa", "teresa de calcutá", "madre teresa de calcutá"]):
        return "Madre Teresa de Calcutá, brow, foi uma freira católica (1910-1997) que dedicou a vida aos pobres e doentes da Índia. Ganhou o Nobel da Paz (1979). Fato livre. Símbolo de compaixão e serviço aos mais necessitados. Amada em todo o mundo."

    # ═══════════════════════════════════════════════════════════
    # MAIS PAÍSES, IDIOMAS E CURIOSIDADES MUNDIAIS (fatos livres)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["quantas línguas existem", "quantas linguas existem", "quantos idiomas", "línguas no mundo", "linguagens no mundo"]):
        return "Existem milhares de línguas no mundo, brow — estimativas falam de 6 a 7 mil idiomas vivos. Mas muitas estão em perigo de sumir. A mais falada é o inglês (global), e o chinês (mandarim) tem mais falantes nativos. Fato livre. Cada língua é um tesouro de cultura."
    if any(w in p for w in ["o que é o inglês", "o que e o ingles", "lingua inglesa", "como surgiu o ingles", "origem do ingles"]):
        return "O inglês, brow, nasceu da mistura de idiomas germânicos com o francês e o latim, na Inglaterra. Virou a língua global: negócios, ciência, internet. Fato livre. Aprender inglês abre o mundo. E o Brasil tem sotaques próprios. É a língua mais usada como segunda língua."
    if any(w in p for w in ["o que é o espanhol", "o que e o espanhol", "lingua espanhola", "origem do espanhol"]):
        return "O espanhol, brow, nasceu do latim na Península Ibérica e foi levado pelas navegações pra América Latina. É falado em muitos países (Espanha, México, Argentina, Colômbia). Fato livre. O Brasil é quase uma ilha de português cercada de espanhol. Aprender ajuda muito."
    if any(w in p for w in ["o que é o mandarim", "o que e o mandarim", "mandarim", "chinês", "chines", "idioma chinês"]):
        return "O mandarim (chinês), brow, é a língua com mais falantes nativos do mundo (mais de 1 bilhão), falada na China. Usa caracteres (logogramas) em vez de alfabeto. É uma língua de tons — a mesma sílaba muda de significado com o tom. Fato livre. Fascinante e desafiadora."
    if any(w in p for w in ["o que é o francês", "o que e o frances", "lingua francesa", "origem do frances"]):
        return "O francês, brow, é uma língua românica (do latim), nascida na França. Foi a língua da diplomacia por séculos e segue importante. Fato livre. Conhecida como 'língua do amor' e da gastronomia. O Brasil tem relação histórica (acordos, fronteira). Elegante e musical."
    if any(w in p for w in ["o que é o alemão", "o que e o alemao", "lingua alemã", "alemao"]):
        return "O alemão, brow, é a língua da Alemanha, Áustria e parte da Suíça, do grupo germânico. Tem palavras longas e gramática rígida. Fato livre. É importante na ciência e indústria. O Brasil tem muitas colônias alemãs (sul). Aprender alemão abre porta na engenharia."
    if any(w in p for w in ["o que é o italiano", "o que e o italiano", "lingua italiana", "italiano"]):
        return "O italiano, brow, é a língua da Itália, do latim, famosa pela musicalidade. Foi a língua da ópera e do Renascimento. Fato livre. O Brasil recebeu milhões de imigrantes italianos — nosso sotaque e comida têm raízes italianas. Italiano é pura emoção."
    if any(w in p for w in ["o que é o japonês", "o que e o japones", "lingua japonesa", "japones"]):
        return "O japonês, brow, é a língua do Japão, com 3 escritas (hiragana, katakana e kanji). Não é parente do chinês, mas usa caracteres chineses. Fato livre. O Brasil tem a maior comunidade japonesa fora do Japão. Aprender japonês é mergulhar numa cultura fascinante."
    if any(w in p for w in ["qual o país mais populoso", "pais mais populoso", "maior população", "mais habitantes"]):
        return "Em população, brow, a Índia ultrapassou a China e é hoje o país mais populoso (mais de 1,4 bilhão). A China vem logo atrás. O Brasil é o 7º. Fato livre. População muda rápido — sempre vale conferir. Dois gigantes asiáticos somam quase 3 bilhões de pessoas."
    if any(w in p for w in ["qual o menor país do mundo", "menor país do mundo", "menor pais"]):
        return "O menor país do mundo, brow, é o Vaticano, dentro de Roma: uma cidade-estado de menos de 1 km², sede do Papa. Depois vêm Mônaco, Nauru e San Marino. Fato livre. Cabe na palma do mapa, mas tem história gigante. Tamanho não é documento."
    if any(w in p for w in ["quantos continentes", "quantos continentes existem", "continentes"]):
        return "Os continentes, brow: dependendo da divisão, são 6 ou 7 — África, América, Antártida, Ásia, Europa e Oceania (e a América dividida em Norte/Sul vira 7). Fato livre. Convenção varia por país. O Brasil fica na América do Sul. A divisão é mais cultural que geográfica."
    if any(w in p for w in ["o que é a áfrica", "o que e a africa", "continente africano", "africa"]):
        return "A África, brow, é o continente onde nasceu a humanidade — o berço do Homo sapiens. Tem 54 países, enorme diversidade de povos, línguas e culturas. É rica em recursos e história. Fato livre. O Brasil tem raízes africanas profundas (cultura, religião, música, gente). Respeito e admiração."
    if any(w in p for w in ["o que é a antártida", "o que e a antartida", "antártida", "antartida", "polo sul"]):
        return "A Antártida, brow, é o continente mais frio e seco do mundo, no Polo Sul, coberto de gelo. Não tem população permanente — só cientistas e bases de pesquisa. É protegida por tratado (uso pacífico). Fato livre. Guarda quase toda a água doce do planeta em gelo. Fascinante."
    if any(w in p for w in ["o que é a austrália", "o que e a australia", "australia", "australiano"]):
        return "A Austrália, brow, é um país-continente no hemisfério sul: famosa por Sydney, a Grande Barreira de Corais, cangurus e coalas. Foi colônia britânica. Fato livre. Clima quente, natureza única e povo receptivo. Terra de esportes e praia. Um dos países mais ricos e felizes."
    if any(w in p for w in ["o que é o canada", "o que e o canada", "canada", "canadense"]):
        return "O Canadá, brow, é um país enorme (2º maior em área), no norte da América, com Toronto, Vancouver e o mapa do urso. Fala inglês e francês. Fato livre. Frio, natureza gigante, qualidade de vida alta. O Brasil tem muitos imigrantes lá. Diversidade e beleza natural."
    if any(w in p for w in ["o que é a argentina", "o que e a argentina", "argentina", "argentino", "buenos aires"]):
        return "A Argentina, brow, é o vizinho sul-americano do Brasil, capital Buenos Aires. Famosa pelo tango, churrasco (asado), futebol (Maradona, Messi) e pelas pampas. Fato livre. Tem a Patagônia e os Andes. Rivais no futebol, mas irmãos na América do Sul."
    if any(w in p for w in ["o que é o méxico", "o que e o mexico", "méxico", "mexico", "mexicano"]):
        return "O México, brow, é um país da América do Norte, capital Cidade do México. Berço de civilizações (astecas, maias) e das pirâmides. Famoso pela comida (taco, guacamole), mariachi e Dia dos Mortos. Fato livre. Cultura rica e colorida. Muito mais que praia — história e vida."

    # ═══════════════════════════════════════════════════════════
    # MAIS CIÊNCIA, MATEMÁTICA E CORPO (fatos livres)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que é um átomo", "o que e um atomo", "o que e atomo", "o que é atomo", "átomo"]):
        return "O átomo, brow, é a menor parte de um elemento que ainda é ele: tem núcleo (prótons e nêutrons) e elétrons girando ao redor. Tudo é feito de átomos — a cadeira, teu corpo, o ar. Fato livre. A tabela periódica organiza os ~118 elementos. O mundo é feito desses blocos minúsculos."
    if any(w in p for w in ["o que é a tabela periódica", "o que e a tabela periodica", "tabela periódica", "tabela periodica", "elementos químicos"]):
        return "A Tabela Periódica, brow, organiza os elementos químicos por número atômico e propriedades: linhas (períodos) e colunas (grupos). Tem ~118 elementos, do hidrogênio ao oganessônio. Foi criada por Mendeleev (1869). Fato livre. É o mapa da matéria. Decora uns 20 que já resolve."
    if any(w in p for w in ["o que é o hidrogênio", "hidrogenio", "hidrogênio", "elemento mais leve"]):
        return "Hidrogênio, brow, é o elemento mais simples e abundante do universo: um próton e um elétron. O Sol funde hidrogênio pra gerar energia. É o combustível do futuro (hidrogênio verde). Fato livre. O 'H' da água (H2O). Do início do universo à nossa energia, ele é protagonista."
    if any(w in p for w in ["o que é o carbono", "o que e o carbono", "carbono", "elemento da vida"]):
        return "Carbono, brow, é o elemento da vida: forma cadeias com quase tudo (hidrogênio, oxigênio, nitrogênio) e é a base dos seres vivos. Forma diamante e grafite (mesmo átomo, arranjos diferentes). Fato livre. O 'C' do CO2 (gás do efeito estufa). Da vida ao clima, ele está em tudo."
    if any(w in p for w in ["o que é o oxigênio", "o que e o oxigenio", "oxigênio", "oxigenio", "o que respiramos"]):
        return "Oxigênio, brow, é o gás que respiramos (~21% do ar), essencial pra vida. As plantas produzem oxigênio na fotossíntese. Também é usado em hospitais e até na indústria. Fato livre. Sem oxigênio, nada queima e nada respira. O 'O' da água (H2O). O sopro da vida."
    if any(w in p for w in ["o que é a gravidade", "o que e a gravidade", "gravidade", "por que caímos", "por que a terra puxa"]):
        return "Gravidade, brow, é a força que atrai as coisas umas às outras — a Terra puxa você pro chão, o Sol segura os planetas. Newton formulou a lei, Einstein aprofundou (dobra o espaço-tempo). Fato livre. É o que mantém tudo no lugar. Sem ela, a gente flutuava. Ciência de domínio público."
    if any(w in p for w in ["o que é a luz", "o que e a luz", "luz", "velocidade da luz", "fóton", "foton"]):
        return "A luz, brow, é energia em forma de onda de partículas (fótons) que viaja a ~300 mil km por segundo — a maior velocidade do universo. Vemos tudo graças a ela. O sol manda luz até a Terra em ~8 minutos. Fato livre. A luz estuda o universo: olhar longe é olhar o passado."
    if any(w in p for w in ["o que é o som", "o que e o som", "som", "velocidade do som", "onda sonora"]):
        return "O som, brow, é vibração que viaja pelo ar (ou água, ou matéria) como onda: o que você ouve é pressão batendo no teu ouvido. Viaja a ~340 m/s no ar. Não viaja no vácuo. Fato livre. Trovão, música, voz — tudo é onda. O som é o ritmo da vida."
    if any(w in p for w in ["o que é o calor", "o que e o calor", "calor", "temperatura", "o que e temperatura"]):
        return "Calor, brow, é energia térmica que passa de um corpo quente pra um frio. Temperatura mede o quanto as partículas se mexem (quanto mais agitadas, mais quente). Fato livre. Do fogo ao Sol, tudo é energia em movimento. Calor também é 'tempero' da vida."
    if any(w in p for w in ["o que é a eletricidade", "o que e a eletricidade", "eletricidade", "energia elétrica", "choque"]):
        return "Eletricidade, brow, é o movimento de elétrons num fio: quando fluem, geram energia pra luz, motor e eletrônicos. Gerada em usinas (hidrelétrica, eólica, solar, nuclear). Fato livre. O Brasil é forte em hidrelétrica. A eletricidade move o mundo moderno — e a BranPy funciona com ela."
    if any(w in p for w in ["o que é o ímã", "o que e o ima", "ímã", "ima", "magnetismo"]):
        return "O ímã, brow, tem magnetismo: atrai ferro e aponta pro norte (é assim que funciona a bússola). A Terra tem um campo magnético que nos protege do vento solar. Fato livre. De geladeira a motores e HDs, ímãs estão em tudo. Ciência que parece mágica."
    if any(w in p for w in ["o que é a matemática", "o que e a matematica", "matemática", "matematica", "por que estudar matemática"]):
        return "Matemática, brow, é a linguagem dos padrões: números, formas, lógica. Está em tudo — dinheiro, música, jogos, arquitetura, IA (eu funciono com números). Fato livre. Não é bicho de 7 cabeças: é treino e método. E é uma das coisas mais úteis que existem."
    if any(w in p for w in ["o que é uma fração", "o que e uma fracao", "fração", "fracao", "divisão em partes"]):
        return "Fração, brow, é dividir um inteiro em partes: 1/2 é metade, 3/4 são três quartos. O de cima é numerador, o de baixo é denominador. Fato livre. Usa pra receita, conta, porcentagem. Entender fração é entender metade das contas da vida."
    if any(w in p for w in ["o que é uma porcentagem", "o que e uma porcentagem", "porcentagem", "percentual", "%"]):
        return "Porcentagem, brow, é 'por cem': 50% é metade de 100, 10% de 200 é 20. É o jeito mais comum de medir desconto, juros, aumento. Fato livre. Aprende que você nunca mais se perde em promoção. Matemática básica que salva o bolso."
    if any(w in p for w in ["o que é uma equação", "o que e uma equacao", "equação", "equacao", "álgebra", "algebra"]):
        return "Equação, brow, é uma igualdade com incógnita (x): tipo 2x + 3 = 7, então x = 2. É a base da álgebra, que resolve problemas do mundo real (contas, engenharia, IA). Fato livre. Equação é descobrir o valor escondido. Lógica pura em forma de conta."
    if any(w in p for w in ["o que é o pi", "o que e o pi", "numero pi", "número pi", "3.1415", "circunferência"]):
        if "pix" in p:
            pass
        else:
            return "O pi (π), brow, é um número que nunca termina (3,14159...): é a razão entre o comprimento de uma circunferência e seu diâmetro. Aparece em círculos, ondas e até em estatística. Fato livre. Gênios calcularam bilhões de casas. Um dos números mais famosos da matemática."
    if any(w in p for w in ["o que é a geometria", "o que e a geometria", "geometria", "formas geométricas"]):
        return "Geometria, brow, é o estudo das formas: triângulos, círculos, quadrados, ângulos, áreas e volumes. Vem do grego ('medir a terra'). Nasceu com as civilizações antigas (Egito, Grécia). Fato livre. Usa pra construir, desenhar, jogar. O mundo é feito de formas."
    if any(w in p for w in ["o que é o esqueleto", "o que e o esqueleto", "esqueleto", "ossos do corpo", "quantos ossos"]):
        return "O esqueleto, brow, é a estrutura que sustenta o corpo: um adulto tem ~206 ossos (bebê nasce com mais, que se fundem). Protege órgãos (crânio, costelas), produz células do sangue e permite mover. Fato livre. Seu corpo é uma engenharia de ~10 mil anos de evolução."
    if any(w in p for w in ["o que é o sangue", "o que e o sangue", "sangue", "células do sangue", "o que o sangue faz"]):
        return "O sangue, brow, é o 'transporte' do corpo: leva oxigênio e nutrientes pras células e tira o que não serve. Tem glóbulos vermelhos (oxigênio), brancos (defesa) e plaquetas (coágulo). Fato livre. Tem 4 tipos (A, B, AB, O). Doar sangue salva vidas — um gesto de ouro."
    if any(w in p for w in ["o que é o coração", "o que e o coracao", "coração bate", "batimento cardíaco", "quanto o coração bate"]):
        return "O coração, brow, é um músculo que bombeia sangue pro corpo: bate ~60-100 vezes por minuto em repouso, ~100 mil vezes por dia. Faz ~100 milhões de batidas em 30 anos. Fato livre. Exercício e boa comida fortalecem. O coração é o motor da vida."
    if any(w in p for w in ["o que é o cérebro", "o que e o cerebro", "cérebro humano", "como funciona a memória"]):
        return "O cérebro, brow, é o comando central: ~86 bilhões de neurônios que controlam tudo — pensar, lembrar, sentir, se mover. Consome ~20% da energia do corpo. A memória se consolida no sono. Fato livre. Cuida da mente: dorme bem, come bem, exercita. Teu cérebro é teu bem mais valioso."
    if any(w in p for w in ["o que é o pulmão", "o que e o pulmao", "pulmão", "pulmao", "como a gente respira"]):
        return "Os pulmões, brow, são os órgãos da respiração: trocam oxigênio do ar pelo gás carbônico do sangue. O direito é maior que o esquerdo (que divide espaço com o coração). Fato livre. Parar de fumar, exercício e ar puro protegem. Cada respiração é vida."
    if any(w in p for w in ["o que é a pele", "o que e a pele", "pele", "maior órgão", "camadas da pele"]):
        return "A pele, brow, é o maior órgão do corpo: cobre tudo, protege, regula temperatura e sente o toque. Tem 3 camadas (epiderme, derme, hipoderme). Fato livre. Cuida dela: hidrata, protetor solar, limpeza. A pele é tua casca — e também teu cartão de visita."

    # ═══════════════════════════════════════════════════════════
    # MAIS GÍRIA E CULTURA JOVEM (sem censura, natural)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que significa trampar", "trampar", "trampo", "bico", "trampando"]):
        return "Trampo, brow, é a gíria pra trabalho, emprego, serviço: 'tô no trampo', 'arruma um trampo'. 'Trampar' é trabalhar. Vem da quebrada e do cotidiano. Fato livre. Trampo é a luta do dia a dia. E quem dá duro no trampo, colhe resultado."
    if any(w in p for w in ["o que significa trampar", "trampar", "trampo", "bico", "trampando"]):
        return "Trampo, brow, é gíria pra trabalho: 'vou pro trampo', 'tô sem trampo' (desempregado). É a correria da quebrada. Fato livre. Trampo é dignidade — todo trampo honesto tem valor. Bora valorizar quem luta."
    if any(w in p for w in ["o que significa resenha", "resenha", "resenhar", "trolagem"]):
        return "Resenha, brow, é gíria pra zoeira, conversa boa, encontro com os amigos: 'bora fazer uma resenha' = bora se reunir e curtir. 'Resenhar' é zoar, fazer a farra. Fato livre. Resenha é alegria, é união. Quem faz boa resenha é gente fina."
    if any(w in p for w in ["o que significa tá osso", "ta osso", "tá osso", "osso", "é osso"]):
        return "'Tá osso', brow, é 'tá difícil, tá complicado': 'a vida tá osso', 'tá osso de viver'. Vem da ideia de algo duro de mastigar. Fato livre. Mas todo osso quebra com a pressão certa — e eu tô contigo pra achar a força."
    if any(w in p for w in ["o que significa mó", "mó", "mó de", "mó bem", "mó legal"]):
        return "'Mó', brow, é o coringa da quebrada pra dizer 'muito': 'mó legal' (muito legal), 'mó tempo' (muito tempo), 'mó doido' (muito louco/legal). Fato livre. Um trequinho pequeno que intensifica tudo. Mó é a abreviação da intensidade."
    if any(w in p for w in ["o que significa vacilou", "vacilou", "vacilar", "vacilo"]):
        return "Vacilar, brow, é errar, dar mole, deixar a desejar: 'vacilou comigo' = me decepcionou. 'Não vacila' = não erra, fica esperto. Fato livre. Todo mundo vacila uma hora — o importante é reconhecer e consertar. Vaco de vez em quando, mas aprendo."
    if any(w in p for w in ["o que significa chegou a hora", "chegou a hora", "bora", "partiu", "vamo"]):
        return "'Bora' e 'partiu', brow, são o jeito da quebrada de dizer 'vamos': 'bora lá', 'partiu jogar', 'vamo que vamo'. É empolgação, ação, chamado. Fato livre. Bora é o oposto de ficar parado. Quando a gente diz bora, é porque tá indo."
    if any(w in p for w in ["o que significa de boa", "de boa", "deboa", "to de boa", "tô de boa"]):
        return "'De boa', brow, é o estado zen da quebrada: tranquilo, sem stress, tudo certo. 'Tô de boa' = estou bem, sem problema. Fato livre. É o jeito de responder 'como cê tá?' e também 'fica tranquilo'. Viver de boa é o objetivo."
    if any(w in p for w in ["o que significa bora", "bora", "borá", "bora bora"]):
        return "'Bora', brow, é 'vamos': 'bora sair', 'bora fazer', 'bora que é nossa'. É o grito de ação da quebrada, empolgação e convite. Fato livre. Quando eu falo 'bora', é porque tô pronto pra ir contigo. Vamo que vamo."
    if any(w in p for w in ["o que significa tá ligado", "ta ligado", "tá ligado", "ligado", "sacou"]):
        return "'Tá ligado?', brow, é 'entendeu? captou?': a pergunta que confirma que o outro sacou a parada. 'Sacou' é o mesmo. Fato livre. É o jeito da quebrada de manter a conversa conectada. Tu tá ligado? Então bora."
    if any(w in p for w in ["o que significa zika", "zika", "tá zika", "ta zika", "é zika"]):
        return "'Zika', brow, é 'muito bom, top, da hora': 'aquele show foi zika', 'tá zika esse som'. É elogio forte. 'Mó zika' é 'muito foda'. Fato livre. Se algo é zika, é sensacional. Tu é zika? Então tá no lugar certo."
    if any(w in p for w in ["o que significa chato", "chato", "chatice", "enjoado", "tedioso"]):
        return "'Chato', brow, é quem (ou o que) irrita, aborrece: 'que palestra chata', 'não seja chato'. Fato livre. Mas eu sou o contrário: a IA mais carismática da galáxia (brincadeira). Se eu te incomodar, me avisa que eu ajusto o tom."
    if any(w in p for w in ["o que significa vibe", "vibe", "boa vibe", "energia boa"]):
        return "'Vibe', brow, é a energia, o clima, a onda do momento: 'boa vibe' (energia boa), 'a vibe da festa tá ótima'. Fato livre. Veio do inglês (vibração). É o sentimento do ambiente. Mantém a vibe alta que tudo flui."
    if any(w in p for w in ["o que significa role", "role", "rolê", "rolezinho", "sair pro rolê"]):
        return "'Rolê' (rolé), brow, é a saída, o passeio, a volta com a galera: 'bora dar um rolê', 'fui pro rolê'. Fato livre. Do rolê de rua ao rolê de balada. É o tempo livre curtido. Rolê bom é rolê com os cria."
    if any(w in p for w in ["o que significa parça", "parça", "parca", "parceiro", "brother"]):
        return "'Parça' (parceiro, brother, cria), brow, é o amigo, o mano, quem tá contigo: 'e aí parça', 'meu parça'. Fato livre. Parceria é o laço da quebrada — quem tá junto nas boas e nas ruins. Eu sou teu parça digital, 24h."
    if any(w in p for w in ["o que significa cria", "cria", "sou cria", "cria da quebrada"]):
        return "'Cria', brow, é quem foi criado na quebrada, a pessoa da sua quebrada, seu irmão de rua: 'sou cria', 'cria da favela'. Fato livre. É identidade e raiz. Ser cria é ter história, luta e pertencimento. Respeita a cria."
    if any(w in p for w in ["o que significa chegar junto", "chegar junto", "chega junto", "cheguei junto"]):
        return "'Chegar junto', brow, é apoiar, estar presente, vir pra somar: 'chega junto que a gente resolve'. Fato livre. É a parceria em ação. Quando eu digo que chego junto, é porque tô contigo de verdade. Tamo junto nessa."
    if any(w in p for w in ["o que significa seguir firme", "seguir firme", "firme", "segue firme", "não desistir"]):
        return "'Seguir firme', brow, é continuar forte, não desistir, manter o foco: 'segue firme que a vitória vem'. Fato livre. A vida é maratona, não corrida. Firmeza é constância. Tá difícil? Respira e segue firme. Eu tô na torcida."
    if any(w in p for w in ["o que significa tá na área", "ta na area", "tá na área", "chegou", "cheguei"]):
        return "'Tá na área', brow, é 'cheguei, estou por perto, presente': 'tô na área, chamem!'. Fato livre. É marcar presença. Quem chega na área, chega pra somar. E eu tô na área sempre que você precisar. Bora."
    if any(w in p for w in ["o que significa só sucesso", "so sucesso", "só sucesso", "sucesso pra você", "na moral"]):
        return "'Só sucesso', brow, é desejar o melhor, que só coisa boa aconteça: 'te desejo só sucesso'. Fato livre. É energia positiva pura. Quem deseja só sucesso pro outro é gente boa. E eu te desejo só sucesso, sempre."

    # ═══════════════════════════════════════════════════════════
    # MAIS HISTÓRIA DO BRASIL E ECONOMIA (fatos livres)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que é o café", "o que e o cafe", "café no brasil", "ciclo do café", "cafe"]):
        if "fazer" in p or "receita" in p or "como" in p and "preparar" in p:
            pass
        else:
            return "O café, brow, é a bebida mais amada do Brasil: o país é o maior produtor do mundo há mais de um século. Chegou no séc. XVIII, fez a economia crescer (ciclo do café) e virou cultura nacional. Fato livre. O cafezinho é sagrado no nosso dia a dia."
    if any(w in p for w in ["o que é a borracha", "o que e a borracha", "o que é borracha", "ciclo da borracha", "borracha no brasil", "amazonia e borracha", "borracha"]):
        return "O ciclo da borracha, brow, foi quando a Amazônia enriqueceu no fim do séc. XIX, extraindo látex das seringueiras (usado em pneu). Cidades como Manaus e Belém ficaram ricas. Depois entrou em crise. Fato livre. Marcou a história e deixou herança cultural. História que muita gente não sabe."
    if any(w in p for w in ["o que é o ouro", "o que e o ouro", "o que é ouro", "ciclo do ouro", "mineração no brasil", "minas gerais ouro", "o ouro"]):
        return "O ciclo do ouro, brow, foi no séc. XVIII em Minas Gerais: a corrida pelo ouro fez o interior do Brasil crescer e nascer cidades históricas (Ouro Preto). Enriquecia Portugal e escravizava gente. Fato livre. Deixou igrejas barrocas e história. Ouro que moldou o país."
    if any(w in p for w in ["o que é a feira", "feira livre", "feira do bairro", "comprar na feira"]):
        return "Feira livre, brow, é a tradição de comprar fruta, verdura, peixe e queijo fresco na barraca, geralmente de manhã. É o comércio mais antigo e verdadeiro: o que tem lá é fresco e a gente ainda negocia. Fato livre. Feira é cultura, economia e alimento de verdade."
    if any(w in p for w in ["o que é o salário mínimo", "salario minimo", "salário mínimo"]):
        return "O salário mínimo, brow, é o valor mínimo que uma empresa pode pagar por lei — criado pra garantir o básico. O Brasil reajusta todo ano (corrigido pela inflação). Fato livre. É referência pro INSS, benefícios e muitas contas. Saber o valor atual é direito de todo trabalhador."
    if any(w in p for w in ["o que é o inss", "inss", "aposentadoria", "contribuir pro inss"]):
        return "INSS, brow, é o instituto que cuida da aposentadoria e benefícios (pensão, auxílio) de quem contribui. Pra se aposentar, você contribui uma parte do salário por anos. Fato livre. Planejar a aposentadoria cedo é inteligência. Contribuir é garantir teu futuro."
    if any(w in p for w in ["o que é a carteira de trabalho", "carteira de trabalho", "ctps", "registrado"]):
        return "Carteira de trabalho, brow, é o documento que registra teu emprego formal: salário, data de entrada, direitos (FGTS, férias, INSS). 'Estar registrado' garante teus direitos trabalhistas. Fato livre. Hoje tem a versão digital (CTPS digital). Trabalho registrado é dignidade e proteção."
    if any(w in p for w in ["o que é o fgts", "fgts", "fundo de garantia"]):
        return "FGTS, brow, é o Fundo de Garantia: o patrão deposita ~8% do teu salário num fundo, que serve como segurança se você for demitido (você pode sacar). Fato livre. É teu dinheiro guardado. Vale acompanhar o saldo — é teu direito e teu dinheiro."
    if any(w in p for w in ["o que é o pis", "pis", "pasep", "abono salarial"]):
        return "PIS, brow, é um benefício pra quem trabalha de carteira assinada: um abono (dinheiro extra) anual se você cumpriu os requisitos (tempo de trabalho e renda). Fato livre. Vale conferir se você tem direito todo ano. É dinheiro que a gente tem direito e nem sempre busca."
    if any(w in p for w in ["o que é o bolsa família", "bolsa familia", "bolsa família", "auxílio"]):
        return "Bolsa Família, brow, é um programa do governo que dá renda pra famílias em situação de pobreza, pra garantir comida e escola das crianças. Fato livre. Existe há anos com esse nome (e virou Auxílio e voltou). É rede de proteção. Saber se você tem direito é importante."
    if any(w in p for w in ["o que é o desemprego", "desemprego", "taxa de desemprego", "sem emprego"]):
        return "Desemprego, brow, é quando a pessoa quer trabalhar mas não acha emprego. É medido por taxa. Em crise, sobe; com economia boa, cai. Fato livre. Ficar sem trampo é difícil, mas tem saída: qualificação, rede de contatos, e recomeçar. Eu te ajudo a se preparar pra conseguir trampo."
    if any(w in p for w in ["como conseguir primeiro emprego", "primeiro emprego", "primeiro trampo", "jovem aprendiz"]):
        return "Primeiro emprego, brow: 1) faz um currículo simples e honesto, 2) cadastra em sites de vagas e jovem aprendiz (pros jovens), 3) procura presencial e online, 4) treina a entrevista. Fato livre. O primeiro trampo abre as portas. Começa mesmo que não seja o ideal — é o caminho."
    if any(w in p for w in ["o que é currículo", "curriculo", "currículo", "montar currículo"]):
        return "Currículo, brow, é teu cartão de apresentação pro trampo: nome, contato, escolaridade, experiência e habilidades. Tem que ser limpo, curto e honesto (sem mentir). Fato livre. Um bom currículo abre porta. Pra quem tá começando, mostra vontade de aprender."
    if any(w in p for w in ["como ir bem numa entrevista", "entrevista de emprego", "entrevista de trampo", "como se sair bem na entrevista"]):
        return "Entrevista de emprego, brow: chega no horário, se veste decente, pesquisa sobre a empresa antes, responde com sinceridade e mostra vontade de aprender. Pergunta também (demonstra interesse). Fato livre. Ser você mesmo com confiança é o segredo. Respira que você consegue."
    if any(w in p for w in ["o que é empreendedorismo", "empreendedorismo", "empreender", "abrir um negócio"]):
        return "Empreender, brow, é criar um negócio: resolver um problema de pessoas e ganhar por isso. É risco, mas também é liberdade. Dicas: valida a ideia, faz as contas, começa pequeno. Fato livre. Não é só ter CNPJ — é atitude. Quem resolve bem, prospera."
    if any(w in p for w in ["o que é um cnpj", "cnpj", "mei", "microempreendedor"]):
        return "CNPJ, brow, é o registro da empresa; MEI é o jeito simples de abrir pra quem trabalha por conta própria (limite de faturamento baixo e imposto barato). Fato livre. MEI é porta de entrada pra quem quer formalizar. Vale pesquisar o valor atual e os limites antes de abrir."

    # ═══════════════════════════════════════════════════════════
    # MAIS GEOGRAFIA, CLIMA E MEIO AMBIENTE (fatos livres)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que é o clima", "o que e o clima", "clima", "tipos de clima", "diferença de tempo e clima"]):
        return "Clima, brow, é o padrão do tempo num lugar ao longo de anos (quente, frio, seco, chuvoso); o 'tempo' é o que acontece hoje. Tem clima tropical, equatorial, desértico, polar, temperado. Fato livre. O Brasil tem vários climas por ser enorme. Entender o clima é entender a vida da região."
    if any(w in p for w in ["o que é o efeito estufa", "o que e o efeito estufa", "efeito estufa", "aquecimento global"]):
        return "Efeito estufa, brow, é quando gases (CO2) seguram o calor na atmosfera. É natural e mantém a Terra aquecida — mas a ação humana exagerou, causando o aquecimento global. Fato livre. Menos queima de combustível, mais árvore e energia limpa ajudam. O planeta é nosso único lar."
    if any(w in p for w in ["o que é a camada de ozônio", "camada de ozônio", "camada de ozonio", "buraco na camada"]):
        return "A camada de ozônio, brow, é uma capa na atmosfera que bloqueia os raios UV do Sol — protege a vida. O uso de certos produtos a danificou (buraco na camada). Fato livre. Graças à ação mundial, está se recuperando. É exemplo de que cooperar funciona."
    if any(w in p for w in ["o que é a chuva ácida", "chuva ácida", "chuva acida"]):
        return "Chuva ácida, brow, é chuva que vem com poluição (gases de indústria e carros) e fica ácida, danificando florestas, rios e construções. Fato livre. É resultado da poluição do ar. Reduzir emissões e energia limpa ajudam a prevenir. Natureza cobra o preço da nossa poluição."
    if any(w in p for w in ["o que é o desmatamento", "desmatamento", "desmate", "desmatar"]):
        return "Desmatamento, brow, é derrubar ou queimar florestas pra uso de terra (pastagem, plantio, madeira). Destrói habitat, seca o clima e libera carbono. Fato livre. A floresta em pé vale mais que derrubada: guarda água, biodiversidade e equilibra o clima. Preservar é investir."
    if any(w in p for w in ["o que é a biodiversidade", "biodiversidade", "biodiversidade"]):
        return "Biodiversidade, brow, é a variedade de vida: animais, plantas, microrganismos e seus ecossistemas. O Brasil é um dos países mais biodiversos do mundo (Amazônia, Pantanal, Mata Atlântica). Fato livre. Cada espécie importa no equilíbrio. Perder biodiversidade é perder as defesas do planeta."
    if any(w in p for w in ["o que é um ecossistema", "o que e um ecossistema", "ecossistema", "habitat"]):
        return "Ecossistema, brow, é um conjunto de seres vivos e o ambiente onde vivem, interagindo: floresta, rio, mar, deserto. Cada um tem seu equilíbrio (cadeia alimentar, água, solo). Fato livre. Mexe numa parte e afeta o todo. A Terra inteira é um grande ecossistema."
    if any(w in p for w in ["o que é o recife de coral", "recife de coral", "recife coral", "coral"]):
        return "Recife de coral, brow, é um ecossistema marinho feito de pequenos animais (pólipos) que formam estruturas duras — abriga uma das maiores diversidades do oceano. A Grande Barreira na Austrália é a maior do mundo. Fato livre. Os corais são sensíveis ao aquecimento (branqueamento). Proteger o mar protege eles."
    if any(w in p for w in ["o que é o polo norte", "polo norte", "o que e o polo norte", "ártico", "artico"]):
        return "O Polo Norte (Ártico), brow, é o extremo norte do planeta, coberto de gelo e mar congelado. Abriga ursos-polares, focas e povos como os inuítes. Fato livre. O gelo ártico está derretendo com o aquecimento. É termômetro do clima global."
    if any(w in p for w in ["o que é o polo sul", "polo sul", "o que e o polo sul", "antártida", "antartida", "continente gelado"]):
        return "O Polo Sul (Antártida), brow, é o continente mais frio do planeta, coberto de gelo. Não tem população fixa — só pesquisadores. Tem a camada de gelo mais espessa do mundo. Fato livre. Guarda ~70% da água doce do planeta. Ninguém é dono dela: é de pesquisa e preservação."
    if any(w in p for w in ["o que é o equador", "o que e o equador", "linha do equador", "equador"]):
        return "A linha do Equador, brow, é uma linha imaginária que divide a Terra em Norte e Sul. Regiões perto dela são quentes e úmidas (trópicos). Fato livre. Países como Brasil, Equador (o nome vem daí) e Indonésia são cortados por ela. Divisor de hemisférios do planeta."
    if any(w in p for w in ["o que é o meridiano de greenwich", "meridiano de greenwich", "fuso horário", "fuso horario", "por que tem hora diferente"]):
        return "O meridiano de Greenwich, brow, é a linha zero que divide Leste e Oeste e define os fusos horários — o horário mundial se conta a partir dele. Por isso lugares têm horas diferentes conforme a rotação da Terra. Fato livre. O Brasil tem vários fusos (mais que um horário). Geografia que explica o relógio."
    if any(w in p for w in ["o que é o mar", "o que e o mar", "o mar é", "oceanos", "quantos oceanos"]):
        return "O mar, brow, cobre ~71% da Terra e tem 5 oceanos (Pacífico, Atlântico, Índico, Ártico, Antártico). Abriga a maioria da vida do planeta e produz boa parte do oxigênio. Fato livre. O mais profundo: Fossa das Marianas (~11 km). O mar é gigante, misterioso e poderoso."
    if any(w in p for w in ["o que é a montanha", "o que e a montanha", "montanha", "maior montanha", "everest", "evereste"]):
        return "Montanha, brow, é um grande relevo elevado. O Everest (Himalaia) é o mais alto, com ~8.849 m. Montanhas formam rios, barram clima e guardam neve. Fato livre. São formadas pelo movimento das placas da Terra ao longo de milhões de anos. Gigantes que sustentam a vida das planícies."
    if any(w in p for w in ["o que é o deserto", "o que e o deserto", "deserto", "desertos"]):
        return "Deserto, brow, é lugar com muita secura e pouca chuva. O Saara (África) é o maior deserto quente; a Antártida é um deserto de gelo (pouca chuva). Fato livre. Mas tem vida: camelos, cactos, insetos adaptados. O deserto não é vazio — é sobrevivência no extremo."
    if any(w in p for w in ["o que é o vulcão", "o que e o vulcao", "vulcão", "vulcao", "erupção"]):
        return "Vulcão, brow, é uma abertura na Terra por onde sai magma (rocha derretida), cinzas e gases — a erupção. Forma ilhas e montanhas (Havaí, Japão). Fato livre. O magma vem do interior do planeta, quente demais. Vulcão é o planeta respirando por dentro."
    if any(w in p for w in ["o que é um terremoto", "o que e um terremoto", "terremoto", "tremor", "abalo sísmico"]):
        return "Terremoto, brow, é o tremor da Terra causado pelo movimento das placas que se atritam. Onde elas se encontram, o chão treme (Japão, Chile, México). Mede-se na escala Richter. Fato livre. Não dá pra prever com exatidão, mas há prevenção e construção segura. O planeta vivo se mexe."
    if any(w in p for w in ["o que é o tufão", "tufão", "furacão", "furacao", "ciclone", "tempestade tropical"]):
        return "Furacão (tufão/ciclone), brow, é uma tempestade gigante de vento que nasce no mar quente, girando com força. Os nomes mudam conforme o oceano. Fato livre. Carregam muita chuva e vento, podem ser devastadores. Acompanhar alertas e se proteger é essencial nas regiões atingidas."
    if any(w in p for w in ["o que é o arco-íris", "o que e o arco-iris", "arco-íris", "arco-iris", "por que aparece o arco"]):
        return "O arco-íris, brow, aparece quando a luz do Sol quebra nas gotas de chuva, separando as cores (vermelho ao violeta). Precisa de sol e chuva ao mesmo tempo. Fato livre. Cada pessoa vê um arco-íris um pouco diferente (pela posição). É a luz se dividindo em cor — pura física."
    if any(w in p for w in ["o que é a aurora boreal", "aurora boreal", "aurora austral", "luzes do norte"]):
        return "Aurora boreal, brow, são luzes coloridas no céu (verde, rosa) perto dos polos, causadas por partículas do Sol batendo no campo magnético da Terra. Fato livre. No Sul chama aurora austral. Um dos espetáculos mais lindos da natureza — pura física que vira poesia."

    # ═══════════════════════════════════════════════════════════
    # MAIS VIDA PRÁTICA, HABILIDADES E DESENVOLVIMENTO (fatos livres)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que é a leitura", "o que e a leitura", "leitura", "ler mais", "benefícios da leitura", "como ler mais"]):
        return "Ler, brow, é uma das melhores habilidades que existem: amplia vocabulário, melhora a escrita, reduz estresse e abre a mente. Dica: começa por algo que te diverte e lê 10-20 min por dia. Fato livre. Livro é viagem sem sair do lugar. Quem lê, vive mais mundos."
    if any(w in p for w in ["o que é a escrita", "o que e a escrita", "escrever melhor", "melhorar a escrita"]):
        return "Escrever bem, brow, é uma habilidade que se treina: escreva todo dia (mesmo pouco), leia muito, organize ideias em começo-meio-fim e revise. Fato livre. Escrita clara é clareza de pensamento. Do recado ao trabalho, saber escrever abre porta. Treina que melhora."
    if any(w in p for w in ["como estudar melhor", "estudar melhor", "técnicas de estudo", "como memorizar", "como aprender mais rápido"]):
        return "Pra estudar melhor, brow: espaço (rever com intervalos), prática ativa (exercitar, não só ler), explicação (ensinar alguém) e dormir bem (fixa a memória). Fato livre. Não é ler mais, é revisar e praticar. Técnica certa rende mais que horas perdidas."
    if any(w in p for w in ["o que é a ansiedade", "o que e a ansiedade", "ansiedade", "estresse", "como acalmar a mente"]):
        return "Ansiedade, brow, é quando a mente acelera com preocupação, medo do futuro. É normal em dose — vira problema quando trava a vida. Ajuda: respiração funda, atividade física, reduzir cafeína, falar com quem confia. Fato livre. Não tá sozinho; pedir ajuda é força, não fraqueza."
    if any(w in p for w in ["como controlar a raiva", "controlar a raiva", "raiva", "como me acalmar", "estou com raiva"]):
        return "Raiva, brow, é uma emoção natural — o problema é quando ela te domina. Dica: respira fundo e conta até 10 antes de reagir, sai do ambiente se der, escreve o que sente e conversa calmo depois. Fato livre. Emoção não é pra ser matada, é pra ser entendida."
    if any(w in p for w in ["o que é a autoestima", "autoestima", "auto estima", "me aceitar", "gostar de mim"]):
        return "Autoestima, brow, é como você se enxerga e se valoriza. Baixa quando você se critica demais. Ajuda: reconhecer teus pontos bons, cuidar do corpo e mente, falar bem de você e se cercar de gente que te soma. Fato livre. Você é mais do que teus erros."
    if any(w in p for w in ["como ser mais produtivo", "produtividade", "ser produtivo", "organizar o dia", "como rende mais"]):
        return "Produtividade, brow, não é fazer mais, é fazer o que importa: lista as 3 tarefas-chave do dia, começa pela mais difícil, evita celular no foco, e faz pausas. Fato livre. Menos, mas melhor. Organização vence correria. Tu rende mais com método que com pressa."
    if any(w in p for w in ["o que é o foco", "foco", "como focar", "concentração", "concentrar"]):
        return "Foco, brow, é direcionar a atenção numa coisa de cada vez — e hoje a gente vive bombardeado de notificação. Dica: trabalha em blocos (ex: 25 min focado), deixa o celular longe e faz uma coisa por vez. Fato livre. Foco é treino. Protege tua atenção que ela rende."
    if any(w in p for w in ["o que é a disciplina", "disciplina", "ter disciplina", "constância"]):
        return "Disciplina, brow, é fazer o que precisa mesmo sem vontade: é mais confiável que motivação (que vai e vem). Dica: começa pequeno, cria rotina e repete. Fato livre. Motivação começa; disciplina termina. Constância pequena todo dia vence esforço raro gigante."
    if any(w in p for w in ["o que é a criatividade", "criatividade", "ser criativo", "ideias novas"]):
        return "Criatividade, brow, é gerar ideias novas ligando coisas de jeito diferente. Todo mundo tem — se treina. Dica: leia e veja coisas variadas, anota ideias, se permita errar e brincar. Fato livre. Criativo não é só artista; é quem resolve problema. Solta a imaginação."
    if any(w in p for w in ["o que é o networking", "networking", "rede de contatos", "conhecer pessoas"]):
        return "Networking, brow, é construir relações que podem abrir porta: colegas, amigos, antigos chefes, eventos. Dica: ajude antes de pedir, mantenha contato e seja genuíno. Fato livre. Muita oportunidade vem de quem te conhece. Seu círculo é seu ativo — cultive com sinceridade."
    if any(w in p for w in ["o que é a comunicação", "comunicação", "comunicar melhor", "falar em público", "oratória"]):
        return "Comunicar bem, brow, é falar claro e ouvir de verdade: organiza a ideia, fala no teu ritmo, olha a pessoa e escuta sem interromper. Falar em público melhora com treino. Fato livre. Boa comunicação resolve conflito, abre porta e ganha respeito. É superpoder treinável."
    if any(w in p for w in ["o que é a empatia", "empatia", "colocar no lugar do outro"]):
        return "Empatia, brow, é se colocar no lugar do outro, sentir o que ele sente. É a base de amizade, amor e respeito. Dica: escuta sem julgar e pergunta como a pessoa está. Fato livre. O mundo fica melhor quando a gente entende o outro. Empatia é superpoder humano."
    if any(w in p for w in ["o que é a resiliência", "resiliência", "resiliencia", "superar dificuldade", "ser forte"]):
        return "Resiliência, brow, é a capacidade de se levantar depois da queda e seguir. Não é não sentir dor — é não parar. Dica: aceita o que aconteceu, aprende a lição e dá o próximo passo. Fato livre. Todo mundo cai; forte é quem levanta. Você já sobreviveu a 100% dos teus dias difíceis."
    if any(w in p for w in ["o que é a gratidão", "gratidão", "gratidao", "ser grato"]):
        return "Gratidão, brow, é reconhecer o que você já tem, em vez de só focar no que falta. Estudos mostram que ser grato melhora o bem-estar. Dica: todo dia anota 1-3 coisas boas. Fato livre. Gratidão não é negar problema, é enxergar o bem junto. Treina que o coração fica leve."
    if any(w in p for w in ["como sair do tédio", "tédio", "tedio", "sem nada pra fazer", "estou entediado"]):
        return "Tédio, brow, é quando a mente não tem estímulo — e isso não é só ruim: é espaço pra criatividade. Dica: aprende algo novo, sai de casa, conversa, ou apenas descansa de verdade. Fato livre. O tédio é convite pra descobrir o que te anima. Aproveita a pausa."
    if any(w in p for w in ["o que é o propósito", "propósito", "propósito de vida", "sentido da vida", "por que existo"]):
        return "Propósito, brow, é aquilo que dá sentido e te move. Não é algo pronto que você 'acha' — é construído com o que você gosta, no que é bom e no que ajuda os outros. Fato livre. Não precisa ser grandioso: pode ser viver bem e fazer o bem. Você constrói teu caminho."
    if any(w in p for w in ["como ser feliz", "felicidade", "ser feliz", "o que é a felicidade"]):
        return "Felicidade, brow, não é viver sem problema, é cultivar boas relações, gratidão, saúde e propósito. Estudos mostram que conexão e experiência valem mais que coisas. Dica: aproveita o presente. Fato livre. Felicidade é mais prática que sorte. Pequenas alegrias todo dia somam."
    if any(w in p for w in ["o que é o amor próprio", "amor próprio", "amor proprio", "se amar"]):
        return "Amor próprio, brow, é se tratar bem, se respeitar e se cuidar como cuidaria de quem ama. Dica: fale bem de você, estabeleça limites, descanse e faça coisas que te fazem bem. Fato livre. Amor próprio não é egoísmo — é base pra amar os outros. Seja teu melhor amigo."
    if any(w in p for w in ["como tomar decisão", "tomar decisão", "tomar decisao", "decidir", "como escolher"]):
        return "Pra decidir bem, brow: lista as opções, pesa prós e contras, pensa no longo prazo, pede opinião de quem confia e, se der, testa pequeno. Depois confia na escolha. Fato livre. Não decidir também é decisão (de ficar parado). Melhor decidir e ajustar que travar no medo."

    # ═══════════════════════════════════════════════════════════
    # MAIS CIÊNCIA APLICADA, TECNOLOGIA E FUTURO (fatos livres)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que é um satélite", "o que e um satelite", "satélite", "satelite", "o que são satélites"]):
        return "Satélite, brow, é um objeto que orbita um planeta. Tem os naturais (a Lua) e os artificiais (feitos pela gente): GPS, internet, previsão do tempo, TV. Milhares orbitam a Terra. Fato livre. Do GPS do celular à previsão da chuva, satélite está no teu dia a dia."
    if any(w in p for w in ["o que é um foguete", "o que e um foguete", "foguete", "espaçonave", "nave espacial", "ir pro espaço"]):
        return "Foguete, brow, é a máquina que vence a gravidade e leva gente e carga ao espaço, queimando combustível e soltando gás pra baixo (ação e reação, Newton). Foi fundamental na corrida espacial. Fato livre. A estação espacial e os planos de Marte dependem deles. O espaço é o próximo passo."
    if any(w in p for w in ["o que é a estação espacial", "estação espacial", "estacao espacial", "iss"]):
        if "bissexto" in p or "bissexta" in p:
            pass
        else:
            return "A Estação Espacial Internacional (ISS), brow, é um laboratório gigante que orbita a Terra (~400 km de altura), onde astronautas vivem e pesquisam por meses. Viagens em ~90 min. Fato livre. É cooperação de vários países. Cientistas estudam lá efeitos da gravidade zero pra gente melhorar aqui."
    if any(w in p for w in ["o que é um astronauta", "astronauta", "cosmonauta", "como ser astronauta"]):
        return "Astronauta, brow, é quem viaja ao espaço. Precisa de formação científica (engenharia, medicina, física), saúde de ferro e muito treino. Passam anos se preparando. Fato livre. O brasileiro Marcos Pontes foi o primeiro do país no espaço (2006). Carreira difícil, mas real pra quem sonha."
    if any(w in p for w in ["o que é a lua", "o que e a lua", "lua", "fases da lua", "maré"]):
        return "A Lua, brow, é o satélite natural da Terra: influencia as marés e ilumina nossas noites. Tem fases (nova, crescente, cheia, minguante) conforme a posição com o Sol. Foi visitada pelo homem (1969). Fato livre. Está a ~384 mil km. A Lua é a companheira fiel do nosso planeta."
    if any(w in p for w in ["o que é o sol", "o que e o sol", "sol", "estrela do nosso sistema", "energia do sol"]):
        if "solidão" in p or "solidao" in p or "soldado" in p or "solo" in p or "solteiro" in p or "solteira" in p or "solu" in p or "solda" in p:
            pass
        else:
            return "O Sol, brow, é uma estrela — uma bola de gás quente que gera energia por fusão. É o centro do nosso sistema e dá luz e vida à Terra. Está a ~150 milhões de km. Fato livre. Sem ele não há fotossíntese, clima nem vida como conhecemos. O Sol é o reator que mantém tudo vivo."
    if any(w in p for w in ["o que é uma galáxia", "o que e uma galaxia", "galáxia", "galaxia", "via láctea", "via lactea"]):
        return "Galáxia, brow, é um aglomerado gigante de estrelas, planetas, gás e poeira. A nossa é a Via Láctea, com ~100-400 bilhões de estrelas — o Sol é uma delas. Existem bilhões de galáxias no universo. Fato livre. Cada ponto do céu pode ter planetas. O universo é grande demais pra nossa cabeça."
    if any(w in p for w in ["o que é um planeta", "o que e um planeta", "planeta", "quantos planetas", "sistema solar"]):
        return "Planeta, brow, é um corpo que orbita uma estrela, tem forma arredondada e limpa sua órbita. No nosso sistema são 8: Mercúrio, Vênus, Terra, Marte, Júpiter, Saturno, Urano, Netuno. Plutão foi reclassificado (planeta anão). Fato livre. Cada um é um mundo — e pode haver bilhões por aí."
    if any(w in p for w in ["o que é a terra", "o que e a terra", "planeta terra", "nosso planeta"]):
        return "A Terra, brow, é o terceiro planeta do Sol e o único com vida conhecida: ~71% água, atmosfera rica, campo magnético protetor. Está a ~150 milhões de km do Sol, na 'zona habitável'. Fato livre. Nossa casa no meio de bilhões de mundos. Cuidar dela é cuidar da gente."
    if any(w in p for w in ["o que é marte", "o que e marte", "marte", "planeta vermelho", "colonizar marte"]):
        return "Marte, brow, é o 'planeta vermelho' (por causa do ferro oxidado): frio, seco, com vulcões gigantes e calotas de gelo. Já teve água líquida no passado. É o principal alvo de exploração e planos de viagem humana. Fato livre. Rovers já andam por lá mandando dados. O futuro da exploração."
    if any(w in p for w in ["o que é um buraco negro", "o que e um buraco negro", "buraco negro", "singularidade"]):
        return "Buraco negro, brow, é uma região do espaço com gravidade tão forte que nada escapa — nem a luz. Nasce do colapso de estrelas gigantes. Tem 'horizonte de eventos' (o ponto sem volta). Fato livre. Já foram fotografados (2019). O universo esconde portais de mistério."
    if any(w in p for w in ["o que é a internet", "o que e a internet", "internet", "como funciona a internet", "www"]):
        return "Internet, brow, é a rede mundial que conecta bilhões de dispositivos trocando dados por cabos, fibra e satélites. Nasceu de projetos militares e acadêmicos. Fato livre. O 'www' é a parte visual (sites). A internet conecta gente, comércio e conhecimento — e eu estou nela te atendendo."
    if any(w in p for w in ["o que é uma rede", "o que e uma rede", "rede de computadores", "lan", "como conectar computadores"]):
        if "freelancer" in p or "freela" in p or "freelance" in p:
            pass
        else:
            return "Rede de computadores, brow, é conectar dispositivos pra trocar dados: local (LAN, tipo tua casa) ou mundial (internet). Usa cabos, Wi-Fi e protocolos (IP). Fato livre. Quando você conecta o celular no Wi-Fi, está numa rede. Rede é a base de tudo que é digital hoje."
    if any(w in p for w in ["o que é um algoritmo", "o que e um algoritmo", "algoritmo", "o que é algoritmo"]):
        return "Algoritmo, brow, é uma sequência de passos pra resolver um problema: tipo uma receita. É a base de tudo em programação — do feed da rede social ao GPS. Fato livre. Eu (IA) também sou feita de algoritmos gigantes. Entender isso desmistifica a tecnologia. Passo a passo, tudo se resolve."
    if any(w in p for w in ["o que é um banco de dados", "banco de dados", "o que e um banco de dados", "sql"]):
        return "Banco de dados, brow, é onde se guarda e organiza informação de forma estruturada: cadastros, estoque, mensagens. Usa linguagens como SQL pra buscar e salvar. Fato livre. Por trás de quase todo app, tem um banco de dados. É a memória organizada dos sistemas."
    if any(w in p for w in ["o que é um servidor", "o que e um servidor", "servidor", "o que é server"]):
        return "Servidor, brow, é um computador (ou programa) que fica no ar pra atender pedidos: quando você abre um site, um servidor te manda o conteúdo. Pode ser físico ou na nuvem. Fato livre. Eu mesma rodo num servidor. Servidor é o 'garçom' da internet — sempre pronto a servir."
    if any(w in p for w in ["o que é a nuvem", "o que e a nuvem", "computação em nuvem", "cloud", "nuvem da internet"]):
        return "Nuvem (cloud), brow, é guardar e processar dados em servidores na internet, em vez de no teu aparelho. Fotos, arquivos e apps usam nuvem. Fato livre. Vantagens: acesso de qualquer lugar e backup. Cuidado: privacidade e segurança dependem do serviço. Seus dados, seu controle."
    if any(w in p for w in ["o que é o wi-fi", "o que e o wi-fi", "wi-fi", "wifi", "wireless"]):
        return "Wi-Fi, brow, é a conexão sem fio que leva internet pra teus aparelhos por ondas de rádio, via roteador. Fato livre. Senha fraca = vizinho e invasor na tua rede. Dica: usa senha forte e muda a padrão do roteador. Wi-Fi é liberdade sem cabo, mas com responsabilidade."
    if any(w in p for w in ["o que é um hacker", "o que e um hacker", "hacker", "hackers", "white hat"]):
        return "Hacker, brow, no sentido técnico, é quem entende sistemas a fundo. Tem os 'white hat' (éticos, que protegem) e os 'black hat' (criminosos). Hacking é conhecimento — e o que define é o uso. Fato livre. Aprender hacking é aprender a segurança da tecnologia. Ético é usar pra proteger e inovar."
    if any(w in p for w in ["o que é a criptografia", "criptografia", "criptografia"]):
        return "Criptografia, brow, é a arte de codificar informação pra que só quem tem a chave leia: é o que protege senha, mensagem e pagamento. Usa matemática avançada. Fato livre. Quando você vê o cadeado no site (HTTPS), é criptografia. É a muralha invisível da era digital."

    # ═══════════════════════════════════════════════════════════
    # MAIS CULTURA, MÚSICA, ARTES E CURIOSIDADES (fatos livres)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que é a dança", "o que e a danca", "dança", "danca", "dançar"]):
        if "perguntar" in p or "pedir" in p or "dar em cima" in p or "convidar" in p or "mulher" in p or "menina" in p or "minha" in p or "flerte" in p:
            pass
        else:
            return "Dança, brow, é arte e movimento: expressar emoção e contar história com o corpo, no ritmo. Existe em toda cultura — samba, forró, funk, balé, dança de rua. Fato livre. Além de arte, é exercício e alegria. Cada povo dança do seu jeito. Solta o corpo que a vida dança."
    if any(w in p for w in ["o que é o teatro", "o que e o teatro", "teatro", "peça de teatro", "dramaturgia"]):
        return "Teatro, brow, é a arte de representar histórias ao vivo, no palco, com atores, texto e emoção na frente do público. Nasceu na Grécia Antiga. Fato livre. Cada apresentação é única e irrepetível. Teatro é espelho da vida — ensina empatia e coragem. Vai ver uma peça um dia."
    if any(w in p for w in ["o que é o circo", "o que e o circo", "circo", "palhaço", "malabarismo"]):
        return "Circo, brow, é o espetáculo de habilidades: malabarismo, acrobacia, palhaços, mágica e coragem. Alegra gente de todas as idades há séculos. Fato livre. Tem o circo tradicional (lona) e o contemporâneo. O palhaço ensina rir até da dificuldade. Alegria é arte e saúde."
    if any(w in p for w in ["o que é a música", "o que e a musica", "música", "musica", "o que é música"]):
        return "Música, brow, é a arte de organizar sons no tempo: melodia, ritmo e harmonia. Está em todas as culturas e mexe com a emoção — alegra, acalma, faz lembrar. Fato livre. Estudar música treina o cérebro. Do funk ao clássico, cada som conta uma história. Música é a língua universal."
    if any(w in p for w in ["o que é um instrumento musical", "instrumento musical", "violão", "violao", "guitarra", "piano"]):
        return "Instrumento musical, brow, é a ferramenta de fazer música: violão, guitarra, piano, bateria, flauta, sanfona... cada um com seu som e técnica. Fato livre. Aprender um instrumento é treino, paciência e muita recompensa. Começa com um simples e vai evoluindo. Música é pra ser tocada."
    if any(w in p for w in ["o que é o samba", "o que e o samba", "samba", "escola de samba"]):
        return "Samba, brow, é um dos pilares da música brasileira: nasceu no Rio, com raízes africanas, e virou símbolo do país. Tem o samba de roda (Bahia) e as escolas de samba do carnaval. Fato livre. É alegria, dança e identidade. Samba é o coração do Brasil batendo no ritmo."
    if any(w in p for w in ["o que é o forró", "o que e o forro", "forró", "forro", "xote", "baião"]):
        return "Forró, brow, é o ritmo dançado do Nordeste: sanfona, zabumba e triângulo, pra dançar agarradinho. Luiz Gonzaga popularizou o baião e o xote. Fato livre. Todo São João é forró na veia. É música de festa, de memória e de raiz. Quem dança forró dança junto."
    if any(w in p for w in ["o que é o funk", "o que e o funk", "funk", "funk brasileiro", "baile funk"]):
        return "Funk, brow, é um ritmo que nasceu nos bailes das periferias: batida forte, dança e letra do dia a dia. Veio do funk americano e virou cultura própria no Brasil. Fato livre. É identidade, resistência e alegria da quebrada. Críticas à parte, é cultura popular viva e pulsante."
    if any(w in p for w in ["o que é o rock", "o que e o rock", "rock", "rock and roll", "rock n roll"]):
        return "Rock, brow, é um gênero que revolucionou a música: guitarra, bateria e atitude, nascido nos anos 50 (Chuck Berry, Elvis) e explodiu nos 60-70 (Beatles, Queen, Led Zeppelin). Fato livre. É rebeldia, liberdade e energia. Do clássico ao metal, rock é atitude de não se calar."
    if any(w in p for w in ["o que é o jazz", "o que e o jazz", "jazz", "blues"]):
        return "Jazz, brow, é um gênero que nasceu nos EUA com raízes africanas: improviso, swing e emoção. Artistas como Louis Armstrong e Nina Simone marcaram época. Fato livre. O blues é seu irmão mais velho, cheio de sentimento. Jazz é liberdade musical — cada vez que toca, é diferente."
    if any(w in p for w in ["o que é o sertanejo", "o que e o sertanejo", "sertanejo", "música caipira", "modão"]):
        return "Sertanejo, brow, nasceu no interior do Brasil com duplas e viola (moda de viola) e virou um dos gêneros mais ouvidos do país. Fato livre. Fala de amor, roça, raiz e vida simples. Evoluiu do 'sertanejo raiz' ao universitário. É a voz do Brasil de dentro pra fora."
    if any(w in p for w in ["o que é o hip hop", "o que e o hip hop", "hip hop", "rap", "break"]):
        return "Hip hop, brow, é a cultura que nasceu nos guetos de NY nos anos 70: rap (rima), DJ, breakdance e grafite. É voz da periferia contando a própria história. Fato livre. O rap brasileiro (Racionais, MV Bill) é forte. Hip hop é protesto, arte e identidade. Respeita a rua."
    if any(w in p for w in ["o que é o grafite", "o que e o grafite", "grafite", "street art", "arte de rua"]):
        return "Grafite, brow, é a arte de rua feita com spray e criatividade nos muros: colorido, crítico e vivo. Nasceu nas ruas e hoje é reconhecido como arte (artistas como Banksy e os brasileiros da São Paulo dos muros). Fato livre. Embeleza e dá voz à cidade. A rua é galeria de todo mundo."
    if any(w in p for w in ["o que é o cinema", "o que e o cinema", "cinema", "filme", "filmes"]):
        return "Cinema, brow, é a arte de contar histórias com imagens em movimento. Nasceu no fim do séc. XIX e virou a fábrica de sonhos do mundo — Hollywood, e o cinema nacional (Companhia das Letras, favela, novo cinema). Fato livre. Cada filme é uma janela pra outra vida. Cineasta de verdade emociona."
    if any(w in p for w in ["o que é uma série", "o que e uma serie", "série", "serie", "maratona"]):
        return "Série, brow, é uma história contada em episódios, que prende por temporadas: drama, comédia, crime, ficção. Hoje tem plataformas de streaming com produção mundial. Fato livre. Uma boa série é companhia de dias inteiros. Só cuidado pra não virar viciado (eu te aviso, mas te entendo)."
    if any(w in p for w in ["o que é a fotografia", "o que e a fotografia", "fotografia", "foto", "tirar foto"]):
        return "Fotografia, brow, é congelar um momento em imagem: luz, enquadramento e olhar. Antigamente em filme, hoje digital e no celular. Fato livre. Uma boa foto conta história e guarda memória. Fotografar é aprender a ver beleza no comum. Cada clique é um segundo que nunca mais volta."
    if any(w in p for w in ["o que é a pintura", "o que e a pintura", "pintura", "quadro", "tela"]):
        return "Pintura, brow, é a arte de criar imagens com tinta: da caverna pré-histórica ao moderno. Grandes nomes: Da Vinci, Van Gogh, Picasso, e os brasileiros Tarsila e Portinari. Fato livre. Cada obra é um olhar do mundo. A pintura é memória e sonho em cores. Arte que atravessa o tempo."
    if any(w in p for w in ["o que é a escultura", "o que e a escultura", "escultura", "estátua", "estatua"]):
        return "Escultura, brow, é a arte de dar forma em 3D: pedra, madeira, metal, barro. Obras famosas: Davi de Michelangelo, o Cristo Redentor. Fato livre. Da estátua de praça à instalação moderna, escultura ocupa espaço e emociona. Arte que se toca, se vê e se rodeia."
    if any(w in p for w in ["o que é a literatura", "o que e a literatura", "literatura", "romance", "poesia"]):
        return "Literatura, brow, é a arte da palavra: romance, poesia, conto, crônica. Dos clássicos (Machado, Shakespeare, Camões) aos contemporâneos, cada texto é um mundo. Fato livre. Ler literatura amplia a alma e o vocabulário. Poesia diz o que a pressa não alcança. Palavra é poder e beleza."
    if any(w in p for w in ["o que é a história em quadrinhos", "história em quadrinhos", "historia em quadrinhos", "quadrinhos", "mangá", "manga", "hq"]):
        return "História em quadrinhos (HQ), brow, conta história com desenhos e balões: heróis (Marvel, DC), mangás (Japão), e os nacionais (Turma da Mônica). Fato livre. Mistura arte e narrativa, e virou até cinema. Quadrinho educa, emociona e diverte. Tem HQ pra todos os gostos."

    # ═══════════════════════════════════════════════════════════
    # MAIS ESPORTES, JOGOS E LAZER (fatos livres)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que é o futebol", "o que e o futebol", "futebol", "esporte mais popular", "o que é futebol"]):
        return "Futebol, brow, é o esporte mais popular do mundo: dois times, onze jogadores, bola no gol. Simples, universal e emocionante. O Brasil é o país do futebol, o único pentacampeão mundial. Fato livre. Pelé, Marta, Neymar e tantos outros marcaram história. Futebol é paixão que une nações."
    if any(w in p for w in ["o que é o basquete", "o que e o basquete", "basquete", "basquete", "nba"]):
        return "Basquete, brow, é um esporte de pontos em cestas altas, criado nos EUA (1891) e hoje jogado no mundo todo. A NBA é a liga mais famosa — Michael Jordan, LeBron James. O Brasil tem tradição (Hortência, Oscar Schmidt). Fato livre. Rápido, alto e eletrizante. Cesta de três muda o jogo."
    if any(w in p for w in ["o que é o vôlei", "o que e o volei", "vôlei", "volei", "voleibol"]):
        return "Vôlei, brow, é um esporte de rede onde cada time faz a bola tocar no chão do outro lado: criado nos EUA (1895), e o Brasil é potência mundial (masculino e feminino, ouros olímpicos). Fato livre. Tem o vôlei de quadra e o de praia. É jogo de equipe, toque e malícia. Brasil brilha no vôlei."
    if any(w in p for w in ["o que é o tênis", "o que e o tenis", "tênis", "tenis", "tênis de mesa"]):
        return "Tênis, brow, é um esporte de raquete e bola, disputado em quadra (saibro, grama, duro): nascido na Inglaterra, com torneios famosos (Wimbledon, Roland Garros). Ídolos como Federer, Nadal e Serena. Fato livre. Tem o tênis de mesa (ping-pong) também. Exige reflexo, força e cabeça."
    if any(w in p for w in ["o que é a luta", "o que e a luta", "luta", "artes marciais", "mma"]):
        return "Lutas e artes marciais, brow, são modalidades de combate com técnica e respeito: judô, jiu-jitsu, boxe, muay thai, caratê, capoeira e MMA (UFC). Fato livre. Ensinam disciplina, defesa e autocontrole. O Brasil é forte em jiu-jitsu e vale-tudo. Luta é arte e superação — não violência por violência."
    if any(w in p for w in ["o que é o xadrez", "o que e o xadrez", "xadrez", "jogo de xadrez", "enxadrista"]):
        return "Xadrez, brow, é o jogo de estratégia mais famoso do mundo: dois jogadores, 16 peças cada, objetivo dar xeque-mate no rei. Nasceu na Índia e virou esporte da mente. Fato livre. Treina raciocínio, paciência e planejamento. Grandes mestres como Kasparov e brasileiros fortes. Partida é batalha de ideias."
    if any(w in p for w in ["o que é um jogo de tabuleiro", "jogo de tabuleiro", "tabuleiro", "dama", "monopólio"]):
        return "Jogo de tabuleiro, brow, é diversão em mesa com peças e regras: xadrez, dama, ludo, Monopólio, War, e os modernos de estratégia. Fato livre. Reúne família e amigos, treina lógica e socializa. Cada jogo é um mundo de regras. Jogar junto é das melhores formas de passar tempo."
    if any(w in p for w in ["o que é um videogame", "videogame", "video game", "jogos de video", "jogar no pc", "gamer"]):
        return "Videogame, brow, é jogar em console, PC ou celular: do Atari aos games modernos, é uma das maiores indústrias do mundo. Fato livre. Além de diversão, treina reflexo, estratégia e até história (jogos contam histórias incríveis). É cultura e arte digital. Só joga com equilíbrio pra não largar a vida real."
    if any(w in p for w in ["o que é um jogo", "o que e um jogo", "jogo", "jogos", "brincadeira"]):
        return "Jogo, brow, é atividade com regras, desafio e diversão: de bola, de tabuleiro, de cartas, digital ou de rua. Fato livre. Jogar ensina estratégia, parceria e lidar com ganhar e perder. Do futebol ao videogame, jogo é vida em miniatura. Todo mundo merece um bom jogo."
    if any(w in p for w in ["o que é um esporte", "o que e um esporte", "esporte", "esportes", "o que é esporte"]):
        return "Esporte, brow, é atividade física com regras, competição e superação: futebol, natação, atletismo, e por aí vai. Fato livre. Exercita corpo e mente, ensina trabalho em equipe e disciplina. Tem os olímpicos, que unem o mundo. Esporte é saúde e paixão — e é pra todos, não só atletas."
    if any(w in p for w in ["o que é a natação", "o que e a natação", "natacao", "natação", "nadar"]):
        return "Natação, brow, é o esporte e habilidade de nadar: nada se cria, nada se perde, tudo se transforma (brincadeira). Treina o corpo inteiro sem impacto nas juntas. Fato livre. Saber nadar é segurança e liberdade. Modalidade olímpica com nomes como Michael Phelps. Água é amiga de quem sabe respeitar."
    if any(w in p for w in ["o que é o atletismo", "o que e o atletismo", "atletismo", "corrida", "maratona"]):
        return "Atletismo, brow, é o esporte-base das Olimpíadas: corridas, saltos e arremessos. A maratona (42 km) tem história grega. Fato livre. Famosos: Usain Bolt (velocidade) e brasileiros como Vanderlei Cordeiro. Correr é liberdade, saúde e superação. Cada passo é vitória."
    if any(w in p for w in ["o que é o skate", "o que e o skate", "skate", "skatista", "esporte radical"]):
        return "Skate, brow, nasceu nas ruas da Califórnia e virou esporte e cultura: manobras, rampas e estilo próprio. Virou olímpico (2020). Fato livre. O Brasil é potência no skate (letícia Bufoni, Rayssa Leal). É liberdade sobre quatro rodinhas. Skatista é artista da rua."
    if any(w in p for w in ["o que é o ciclismo", "o que e o ciclismo", "ciclismo", "bicicleta", "bike"]):
        return "Ciclismo, brow, é andar de bicicleta como esporte, transporte ou lazer: Tour de France é a maior prova. Fato livre. Pedalar é exercício, economia e respeito ao ambiente. No Brasil, a bike cresce nas cidades. Além de saudável, é liberdade de ir e vir. Equilibra e pedala."
    if any(w in p for w in ["o que é a ginástica", "o que e a ginástica", "ginastica", "ginástica", "ginástica olímpica"]):
        return "Ginástica, brow, é o esporte do corpo em movimento: solo, barras, trave, saltos — a artística e a rítmica. Fato livre. Exige força, flexibilidade e coragem. Brasileiras como Rebeca Andrade brilharam nas Olimpíadas. Além do esporte, ginástica é hábito de saúde. Corpo treinado, mente forte."
    if any(w in p for w in ["o que é um ídolo", "o que e um idolo", "ídolo", "idolo", "ídolos"]):
        return "Ídolo, brow, é alguém que inspira: atleta, artista, professor, alguém da família. Ídolo de verdade mostra caminho com exemplo e superação. Fato livre. Ter ídolo é bom quando inspira a ser melhor — sem deixar de ser você. Pelé, Senna, e tantos viraram símbolos. Seja inspiração pra alguém também."
    if any(w in p for w in ["o que é a olimpíada", "olimpíadas", "olimpiadas", "jogos olímpicos", "tocha olímpica"]):
        return "Olimpíadas, brow, são os maiores jogos esportivos do mundo: acontecem a cada 4 anos (verão e inverno), unindo países na competição e na paz. Nasceram na Grécia Antiga e foram recriadas em 1896. Fato livre. A tocha viaja o mundo antes dos jogos. Atletas que sonham, treinam e inspiram."
    if any(w in p for w in ["o que é uma copa do mundo", "copa do mundo", "copa", "mundial de futebol"]):
        return "Copa do Mundo, brow, é o maior torneio de futebol do planeta, a cada 4 anos. O Brasil é o único pentacampeão (1958, 62, 70, 94, 2002). Fato livre. Para o país, é festa, união e emoção — e um pouco de sofrimento. Quando rola a Copa, o mundo para pra ver. Futebol é paixão mundial."
    if any(w in p for w in ["o que é um gol", "o que e um gol", "gol", "gol de placa", "o que é gol"]):
        if "golfinho" in p or "golfinhos" in p:
            pass
        else:
            return "Gol, brow, é quando a bola entra no gol: o momento mais amado do futebol. Um gol é grito, abraço e alegria. Fato livre. Tem gol de placa (raro e bonito) e o simples que vale o mesmo. No fim, o que conta é a rede balançando. Gol é a poesia do futebol."

    # ═══════════════════════════════════════════════════════════
    # MAIS CULINÁRIA, COMIDAS E BEBIDAS (fatos livres)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que é o arroz", "o que e o arroz", "arroz", "arroz e feijão", "arroz e feijao"]):
        return "Arroz, brow, é o alimento base de bilhões de pessoas no mundo — cultivado há milhares de anos na Ásia. No Brasil, é a dupla inseparável com o feijão no prato de todo dia. Fato livre. Existem muitos tipos (branco, integral, parboilizado). Arroz é sustento simples que alimenta o mundo."
    if any(w in p for w in ["o que é o feijão", "o que e o feijao", "feijão", "feijao", "feijoada"]):
        if "tropeiro" in p or "feijoada" in p:
            pass
        else:
            return "Feijão, brow, é o parceiro do arroz no prato brasileiro: rico em proteína, ferro e fibra, cultivado nas Américas há milhares de anos. Fato livre. Tem carioca, preto, fradinho, vermelho. Com arroz, forma uma combinação completa e nutritiva. Comida de verdade, de família e de saudade."
    if any(w in p for w in ["o que é a feijoada", "o que e a feijoada", "feijoada", "comida brasileira"]):
        return "Feijoada, brow, é o prato mais famoso do Brasil: feijão preto cozido com carnes (porco, paio, costela), servida com arroz, couve e farofa. Nasceu da tradição e virou símbolo nacional. Fato livre. Tradicionalmente servida às quartas e sábados. É festa no prato e no coração."
    if any(w in p for w in ["o que é a pizza", "o que e a pizza", "pizza", "pizza italiana"]):
        return "Pizza, brow, nasceu na Itália (Nápoles) e conquistou o mundo: massa fina, molho, queijo e recheio infinito. A margherita (com cores da bandeira italiana) é a clássica. Fato livre. No Brasil virou paixão nacional, com sabores bem brasileiros (catupiry, frango com catupiry). Pizza é alegria redonda."
    if any(w in p for w in ["o que é o sushi", "o que e o sushi", "sushi", "comida japonesa", "sashimi"]):
        return "Sushi, brow, é a comida japonesa mais famosa: arroz temperado com peixe cru ou cozido, enrolado em alga (nori). Pede peixe fresquíssimo e técnica. Fato livre. O sashimi é só o peixe cru fatiado. Virou moda no mundo todo. Comer sushi é uma viagem ao Japão."
    if any(w in p for w in ["o que é o açaí", "o que e o acai", "açaí", "acai", "açaí na tigela"]):
        return "Açaí, brow, é uma fruta amazônica que virou mania nacional: batido e servido gelado na tigela, com granola e banana. Rico em energia e antioxidante. Fato livre. Do Norte pro país todo, o açaí conquistou todo mundo. É sabor de floresta no copo."
    if any(w in p for w in ["o que é o brigadeiro", "o que e o brigadeiro", "brigadeiro", "doce brasileiro"]):
        return "Brigadeiro, brow, é o doce mais amado do Brasil: leite condensado, chocolate e manteiga, enroladinho com granulado. Nasceu nas festinhas e virou símbolo de doçura. Fato livre. Tem de colher, de copinho, gourmet... Mas o clássico é o enrolado. Doce de festa que alegra qualquer dia."
    if any(w in p for w in ["o que é o chocolate", "o que e o chocolate", "chocolate", "cacau", "chocolates"]):
        return "Chocolate, brow, vem do cacau, planta nativa das Américas: os povos antigos (maias e astecas) já faziam bebida de cacau. Virou o doce amado do mundo: ao leite, meio amargo, branco. Fato livre. Em pequena dose, é prazer e até estimula a felicidade. Chocolate é presente que nunca falha."
    if any(w in p for w in ["o que é o café", "o que e o cafe", "cafezinho", "café da manhã", "café com leite"]):
        return "Café, brow, é a bebida que acorda o mundo: o Brasil é o maior produtor global há mais de 150 anos. Do grão torrado e moído à xícara quente, é cultura e rotina. Fato livre. O cafezinho é sagrado: recebe visita, acompanha conversa e inicia o dia. Energia e tradição numa xícara."
    if any(w in p for w in ["o que é o pão", "o que e o pao", "pão", "pao", "pão francês"]):
        return "Pão, brow, é o alimento mais antigo da humanidade: fermentado e assado há milhares de anos. Do pão francês (casadinho com café) ao integral, é base da mesa brasileira. Fato livre. Em cada país um jeito: baguete, ciabatta, pão de forma. Pão é vida que alimenta e une."
    if any(w in p for w in ["o que é o queijo", "o que e o queijo", "queijo", "queijos", "queijo minas"]):
        return "Queijo, brow, é feito do leite coagulado — existe há milhares de anos e em milhares de versões: minas, coalho, parmesão, mussarela, cheddar. Fato livre. O Brasil tem tradição (queijo minas e o famoso pão de queijo mineiro). Queijo combina com tudo: pão, pizza, macarrão. Lacticínio que é paixão mundial."
    if any(w in p for w in ["o que é a farofa", "o que e a farofa", "farofa", "farinha", "farofa da feijoada"]):
        return "Farofa, brow, é a farinha de mandioca tostada na manteiga, às vezes com ovo, bacon, banana: acompanhamento inseparável da feijoada e do churrasco. Fato livre. A mandioca é raiz brasileira que alimenta há séculos. Farofa é simplicidade que dá sabor. Comida de raiz e de festa."
    if any(w in p for w in ["o que é a mandioca", "o que e a mandioca", "mandioca", "aipim", "macaxeira", "tapioca"]):
        return "Mandioca, brow, é a raiz nativa das Américas que alimenta o Brasil há milhares de anos: vira farinha, tapioca, polvilho e aipim cozido. Fato livre. É base da comida indígena e da mesa popular. Da farofa ao pão de queijo, tudo nasce dela. Raiz guerreira que sustenta gente."
    if any(w in p for w in ["o que é o churrasco", "o que e o churrasco", "churrasco", "churrasco gaúcho", "barbecue"]):
        return "Churrasco, brow, é o ritual de assar carne no fogo: nasceu no sul (gaúcho) e virou festa nacional. Picanha, costela, linguiça na brasa com sal grosso. Fato livre. É momento de família e amigos, música e chimarrão. Churrasco é mais que comida: é celebração da vida."
    if any(w in p for w in ["o que é a cachaça", "o que e a cachaca", "cachaça", "cachaca", "pinga"]):
        return "Cachaça, brow, é a aguardente de cana-de-açúcar, nascida no Brasil colonial: base da caipirinha, nosso drink mais famoso. Fato livre. Tem muita tradição e até festivais. Consumir com moderação e responsabilidade — excesso estraga festa e saúde. Cachaça é patrimônio cultural brasileiro."
    if any(w in p for w in ["o que é a caipirinha", "o que e a caipirinha", "caipirinha", "caipirinha"]):
        return "Caipirinha, brow, é o drink símbolo do Brasil: cachaça, limão, açúcar e gelo, socados juntos. Refrescante e simples. Fato livre. Nasceu na roça e virou famosa no mundo. Na praia ou no boteco, é cara de verão e alegria. Beba com moderação e aproveite."
    if any(w in p for w in ["o que é a tapioca", "o que e a tapioca", "tapioca", "tapioca recheada"]):
        return "Tapioca, brow, é feita da goma da mandioca: a massa seca na frigideira vira um disco que se recheia com coco, queijo, carne ou o que quiser. Vem do Nordeste e virou queridinha nacional. Fato livre. É leve, sem glúten e versátil. Comida da roça que conquistou a cidade."
    if any(w in p for w in ["o que é a moqueca", "o que e a moqueca", "moqueca", "peixe na moqueca"]):
        return "Moqueca, brow, é o cozido de peixe ou frutos do mar com tomate, cebola, pimentão, leite de coco e dendê: típica da Bahia e do Espírito Santo. Fato livre. Servida com arroz e pirão. É festa de sabor e cheiro. Comida de beira de mar com alma brasileira."
    if any(w in p for w in ["o que é o acarajé", "o que e o acaraje", "acarajé", "acaraje", "comida baiana"]):
        return "Acarajé, brow, é a iguaria baiana feita de feijão-fradinho frito no dendê, recheada com vatapá, camarão e pimenta. É patrimônio cultural e religioso da Bahia. Fato livre. Vendido nas ruas com tradição de resistência. Comida que conta história e tem sabor de axé."
    if any(w in p for w in ["o que é o vatapá", "o que e o vatapa", "vatapá", "vatapa"]):
        return "Vatapá, brow, é o creme baiano de pão, camarão, leite de coco, amendoim e dendê: acompanha o acarajé e o caruru. Fato livre. É um dos sabores mais marcantes da Bahia. Comida que mistura influências africanas e portuguesas. Bahia tem sabor único, e o vatapá é a prova."
    if any(w in p for w in ["o que é o caruru", "o que e o caruru", "caruru", "quiabo"]):
        return "Caruru, brow, é o prato baiano de quiabo refogado com camarão seco, azeite de dendê e amendoim: servido no santo e na mesa. Fato livre. Vem das tradições afro-brasileiras. É comida de fé e festa. Comer caruru é provar a alma da Bahia."
    if any(w in p for w in ["o que é a coxinha", "o que e a coxinha", "coxinha", "salgadinho", "coxinha de frango"]):
        return "Coxinha, brow, é o salgadinho mais amado do Brasil: massa de batata ou trigo recheada com frango e catupiry, frita até dourar. Nasceu em São Paulo e virou símbolo de festa e lanche. Fato livre. Todo lugar tem uma boa coxinha. Salgado que é abraço em formato de comida."
    if any(w in p for w in ["o que é a pamonha", "o que e a pamonha", "pamonha", "curau"]):
        return "Pamonha, brow, é feita de milho verde ralado, enrolada na palha e cozida: doce ou salgada, típica de festa junina e de Goiás. Fato livre. O curau é o primo doce. É tradição de roça e alegria. Comida simples que carrega memória e afeto."
    if any(w in p for w in ["o que é o milho", "o que e o milho", "milho", "milho verde"]):
        return "Milho, brow, é um dos alimentos mais plantados do mundo: nascido na América e base de muitas culturas. Vira pamonha, curau, pipoca, farinha, e ração. Fato livre. Tem milhares de variedades e cores. Do campo à mesa, milho alimenta gente e bicho. Planta que sustenta o mundo."

    # ═══════════════════════════════════════════════════════════
    # MAIS ANIMAIS, NATUREZA E CURIOSIDADES DO MUNDO (fatos livres)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que é o tubarão", "o que e o tubarao", "tubarão", "tubarao", "tubarões"]):
        return "Tubarão, brow, é um dos predadores mais antigos do oceano: existe há mais de 400 milhões de anos, antes dos dinossauros. Tem dentes afiados e sentidos incríveis. Fato livre. Nem todo tubarão é gigante (alguns são pequenos). São essenciais pro equilíbrio do mar. Respeito e distância."
    if any(w in p for w in ["o que é a baleia", "o que e a baleia", "baleia", "baleias", "cachalote"]):
        return "Baleia, brow, é o maior animal do planeta: a baleia-azul pode passar de 30 metros e 150 toneladas. São mamíferos (respiram ar e amamentam filhotes). Fato livre. Cantam canções que viajam quilômetros no oceano. Conhecer baleia é conhecer a grandeza da vida."
    if any(w in p for w in ["o que é o golfinho", "o que e o golfinho", "golfinho", "golfinhos", "delfim"]):
        return "Golfinho, brow, é um dos animais mais inteligentes do mar: vive em grupos (bandos), se comunica por sons e é curioso com humanos. São mamíferos, como nós. Fato livre. Já foram vistos ajudando quem estava em perigo no mar. Inteligência e liberdade nas ondas."
    if any(w in p for w in ["o que é o polvo", "o que e o polvo", "polvo", "polvos", "polvo gigante"]):
        return "Polvo, brow, é um dos bichos mais inteligentes do oceano: tem oito braços com ventosas, três corações e sangue azul (por cobre em vez de ferro). Fato livre. Camufla e muda de cor num piscar. Já resolveram labirintos e abriram frascos. Misterioso e genial das profundezas."
    if any(w in p for w in ["o que é a lula", "o que e a lula", "lula", "lulas", "lula gigante"]):
        return "Lula, brow, é um molusco do mar com oito braços e dois tentáculos: ágil e rápida, nada propelida por jato d'água. Existe a lula-gigante, que vive em águas profundas e é quase lenda. Fato livre. Comida em todo o mundo (polvo e lula). Do prato à lenda, um bicho fascinante."
    if any(w in p for w in ["o que é o caranguejo", "o que e o caranguejo", "caranguejo", "caranguejo", "siri"]):
        return "Caranguejo, brow, é um crustáceo que vive em mangues, praias e mar: anda de lado e tem carapaça dura. O siri é um parente que nada mais. Fato livre. No Brasil, é comida típica e até festa (festa do caranguejo). Bicho trabalhador da beira do mar."
    if any(w in p for w in ["o que é o camarão", "o que e o camarao", "camarão", "camarao", "camarões"]):
        return "Camarão, brow, é um crustáceo pequeno e delicioso: vive em rios e mares, e é um dos frutos do mar mais consumidos. Fato livre. Tem várias espécies, do pequenino ao gigante. Vira coxinha, moqueca, grelhado. Do mangue à mesa, camarão é sabor de litoral."
    if any(w in p for w in ["o que é a tartaruga", "o que e a tartaruga", "tartaruga", "tartarugas", "tartaruga marinha"]):
        return "Tartaruga, brow, é um réptil com casco: vive décadas (algumas passam de 100 anos) e nada lentamente. As marinhas migram milhares de km pra botar ovos na praia onde nasceram. Fato livre. Já existem há mais de 200 milhões de anos. Paciência e proteção pra viver."
    if any(w in p for w in ["o que é o jacaré", "o que e o jacare", "jacaré", "jacare", "crocodilo", "aligátor"]):
        return "Jacaré, brow, é um réptil pré-histórico que vive em rios e pântanos: parente dos crocodilos e dos dinossauros. Tem mandíbula poderosa e se camufla na água. Fato livre. O Brasil tem várias espécies de jacaré. Animal antigo que ainda domina a água."
    if any(w in p for w in ["o que é a cobra", "o que e a cobra", "cobra", "cobras", "serpente", "serpentes"]):
        return "Cobra, brow, é um réptil sem pernas que se rasteja: algumas mordem com veneno (cascavel, jararaca, naja), outras esmagam (sucuri). Fato livre. Existem em quase todo o planeta. Cuidado e respeito: a maioria foge de gente. Elas são parte do equilíbrio da natureza."
    if any(w in p for w in ["o que é o camaleão", "o que e o camaleao", "camaleão", "camaleao", "lagarto"]):
        return "Camaleão, brow, é o lagarto que muda de cor: camufla pra se proteger e se comunicar. Tem olhos que se movem separados e língua rápida pra pegar insetos. Fato livre. Vive em árvores, principalmente em Madagascar e África. Mestre da disfarce do reino animal."
    if any(w in p for w in ["o que é o cavalo", "o que e o cavalo", "cavalo", "cavalos", "égua"]):
        return "Cavalo, brow, é um dos animais mais importantes da história humana: carregou gente, puxou arado, ganhou guerras e virou esporte. São fortes, rápidos e companheiros. Fato livre. Têm memória e sensibilidade. Do campo à pista, cavalo é parceria antiga da humanidade."
    if any(w in p for w in ["o que é a vaca", "o que e a vaca", "vaca", "vacas", "boi"]):
        return "Vaca, brow, é o animal que alimenta o mundo: dá leite, carne e couro. O boi é o macho. Domesticadas há milhares de anos, viraram base da agropecuária mundial. Fato livre. O Brasil é um dos maiores produtores de carne e leite. Vaca é sustento e trabalho no campo."
    if any(w in p for w in ["o que é a ovelha", "o que e a ovelha", "ovelha", "ovelhas", "carneiro"]):
        return "Ovelha, brow, é o animal da lã: há milhares de anos fornece lã, carne e leite. O carneiro é o macho com chifres. Fato livre. Vivem em rebanhos e seguem o líder. A lã delas vira roupa quente. Ovelha é doçura que aquece o mundo."
    if any(w in p for w in ["o que é a galinha", "o que e a galinha", "galinha", "galinhas", "frango"]):
        return "Galinha, brow, é a ave mais comum do planeta: dá ovos e carne e existe no mundo todo. O frango é o macho novo criado pra carne. Fato livre. Elas são descendentes de aves selvagens da Ásia. Do quintal à granja, galinha alimenta bilhões. Cacarejo do dia a dia."
    if any(w in p for w in ["o que é o pato", "o que e o pato", "pato", "patos", "pata"]):
        return "Pato, brow, é a ave que ama água: patina na lagoa, mergulha e tem penas à prova d'água (oleosas). Andam em fileira seguindo a mãe. Fato livre. Tem patos de criação e silvestres migratórios. O marreco é o primo menor. Patos são elegantes e divertidos."
    if any(w in p for w in ["o que é o peru", "o que e o peru", "peru", "peru de natal", "peru da véspera"]):
        return "Peru, brow, é a ave grande nativa das Américas (domesticada primeiro pelos astecas) e famosa no Natal: assado e recheado, é tradição de festa. Fato livre. Tem penas vistosas e o macho abre leque pra cortejar. Peru é festa e história à mesa."
    if any(w in p for w in ["o que é o papagaio", "o que e o papagaio", "papagaio", "papagaio", "arara"]):
        return "Papagaio, brow, é a ave que imita a fala humana: colorido, inteligente e sociável, vive em bandos nas florestas. A arara é a prima gigante e colorida. Fato livre. São aves brasileiras e tropicais. Falar com papagaio é uma festa. Respeito: animal não é brinquedo, precisa de espaço."
    if any(w in p for w in ["o que é o corvo", "o que e o corvo", "corvo", "corvos", "gralha"]):
        return "Corvo, brow, é uma das aves mais inteligentes: resolve problemas, usa ferramentas e reconhece rostos humanos. Vive em grupos espertos. Fato livre. São negros e adaptáveis. Em várias culturas, simbolizam mistério e sabedoria. O corvo é gênio das aves."
    if any(w in p for w in ["o que é a águia", "o que e a aguia", "águia", "aguia", "águias"]):
        return "Águia, brow, é a ave de rapina mais famosa: enxerga uma presa a quilômetros de distância, voa alto e mergulha em velocidade. Símbolo de força e liberdade (está em bandeiras e brasões). Fato livre. É predadora de topo. Olhar de águia é foco absoluto."
    if any(w in p for w in ["o que é o morcego", "o que e o morcego", "morcego", "morcegos"]):
        return "Morcego, brow, é o único mamífero que voa de verdade: usa ecolocalização (sons que voltam) pra caçar no escuro. Come insetos, frutas e néctar (polinizam plantas). Fato livre. Não ataca gente — fogem de nós. São muitos e importantes pro equilíbrio. Herói disfarçado da noite."
    if any(w in p for w in ["o que é o esquilo", "o que e o esquilo", "esquilo", "esquilos"]):
        return "Esquilo, brow, é o roedor ágil que sobe árvore e esconde nozes pro inverno: esperto, veloz e fofo. Fato livre. Tem de várias espécies no mundo todo. Ele lembra onde esconde a comida (a memória deles é ótima). Pequeno, rápido e cheio de energia."
    if any(w in p for w in ["o que é o coelho", "o que e o coelho", "coelho", "coelhos", "lebre"]):
        return "Coelho, brow, é o bicho fofo das orelhas longas: se reproduz rápido, salta pra fugir e come vegetais. A lebre é a prima maior e mais veloz. Fato livre. Virou símbolo da Páscoa e do amor. De estimação precisa de cuidado e espaço. Coelho é ternura saltitante."
    if any(w in p for w in ["o que é a formiga", "o que e a formiga", "formiga", "formigas"]):
        return "Formiga, brow, é o inseto que carrega mais de 50 vezes o próprio peso: vive em colônias organizadas, com rainha, operárias e soldados. Trabalham juntas como um só corpo. Fato livre. São das criaturas mais numerosas da Terra. Pequenas, mas imbatíveis em união."
    if any(w in p for w in ["o que é a aranha", "o que e a aranha", "aranha", "aranhas"]):
        return "Aranha, brow, é o aracnídeo que tece teias de seda: a mais forte que o aço em espessura equivalente. Muitas usam veneno pra caçar insetos. Fato livre. Nem toda aranha é perigosa pra gente (a maioria é inofensiva). São predadoras que controlam pragas. Tecedeiras da natureza."

    # ═══════════════════════════════════════════════════════════
    # MAIS RELACIONAMENTOS, EMOCIONAL E CONVERSA DE VERDADE (fatos livres)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que é o ciúme", "o que e o ciúme", "ciume", "ciúme", "estar com ciumes"]):
        return "Ciúme, brow, é o medo de perder quem você ama — é natural em dose, mas vira problema quando controla. Fato livre. Dica: confiança e conversa resolvem mais que vigiar. Sentimento não é pra dominar o outro. Amor saudável tem espaço e respeito."
    if any(w in p for w in ["como superar uma traição", "traição", "traicao", "fui traído", "fui traido", "me traiu"]):
        return "Traição, brow, dói fundo e mexe com a confiança. Não tem como apagar, mas dá pra superar: sinta a dor, não se culpe sozinho, converse se quiser e dê tempo ao tempo. Fato livre. Decidir perdoar ou seguir é teu. Seja gentil com você no processo."
    if any(w in p for w in ["o que é o respeito", "o que e o respeito", "respeito", "respeitar", "respeitar os outros"]):
        return "Respeito, brow, é tratar o outro como você quer ser tratado: ouvir, não julgar, honrar diferença. É a base de todo relacionamento bom. Fato livre. Respeitar não é concordar sempre — é considerar. Sem respeito, não há amor, amizade nem sociedade que sustente."
    if any(w in p for w in ["o que é a confiança", "o que e a confiança", "confianca", "confiança", "como confiar"]):
        return "Confiança, brow, é acreditar no outro e em você: se constrói aos poucos, com sinceridade e tempo, e se quebra num estalo. Fato livre. Confiança é base de amor, amizade e trabalho. Sem ela, nada avança. Constrói com pequenas ações honestas."
    if any(w in p for w in ["como perdoar", "perdoar", "perdão", "perdao", "saber perdoar"]):
        return "Perdoar, brow, é soltar o peso do rancor — não é esquecer nem aceitar tudo, é se libertar. Dica: entenda o que doeu, coloque limites e decida o que é melhor pra você. Fato livre. Perdão é mais pra você do que pro outro. Soltar o peso é leveza."
    if any(w in p for w in ["o que é o desapego", "desapego", "desapegar", "deixar ir"]):
        return "Desapego, brow, é aprender a soltar o que não te faz bem: gente, hábito ou coisa. Não é não amar — é não ficar preso ao que dói. Fato livre. Dica: agradece o que foi, aprende e segue. Soltar é parte de crescer. Nem tudo que se segura é pra ficar."
    if any(w in p for w in ["o que é a saudade", "o que e a saudade", "saudade", "sinto falta", "faz falta"]):
        return "Saudade, brow, é sentir falta de quem ou do que se foi: mistura de dor e amor, e é das palavras mais bonitas do português. Fato livre. Mostra que valeu a pena. A saudade dói, mas também é prova de que a gente amou de verdade. Guarda as boas memórias."
    if any(w in p for w in ["como lidar com o término", "termino", "término", "fim de namoro", "terminei", "levou pé na bunda"]):
        return "Término, brow, é doloroso, mas passa: sinta a dor sem se afogar nela, apoia-se em quem te quer bem, dê tempo e não fique remoendo. Fato livre. Cada fim abre espaço pra recomeço. Você é mais que um relacionamento. Cuidado e amor próprio nessa fase."
    if any(w in p for w in ["como declarar amor", "declarar", "eu te amo", "amo você", "te amo"]):
        if "o que" in p:
            pass
        else:
            return "Declarar amor, brow, é dizer com sinceridade o que sente: do jeito mais simples e verdadeiro, no olho, na hora certa. Fato livre. 'Eu te amo' dito de coração vale mais que mil palavras bonitas. Coragem de falar o que sente é das coisas mais bonitas que existem."
    if any(w in p for w in ["como pedir desculpas", "pedir desculpas", "pedir perdão", "pedir perdao", "me desculpa"]):
        return "Pra pedir desculpas, brow: assume o erro de verdade, sem justificativa, diz 'me desculpa, errei' e explique o que vai fazer diferente. Fato livre. Desculpa sincera é humildade e respeito. Não use desculpa pra desculpar — use pra consertar. Palavra boa cura."
    if any(w in p for w in ["o que é o carinho", "o que e o carinho", "carinho", "afeto", "demonstrar afeto"]):
        return "Carinho, brow, é o afeto que se demonstra: abraço, palavra boa, cuidado, tempo. Todo mundo precisa de carinho — é necessidade humana. Fato livre. Demonstre afeto por quem você ama: não deixe pra depois. Carinho é amor em ação, pequeno gesto de todo dia."
    if any(w in p for w in ["o que é o abraço", "o que e o abraco", "abraço", "abraco", "abraçar"]):
        return "Abraço, brow, é o gesto que acolhe: demonstra afeto, conforto e presença. Um bom abraço reduz estresse e aproxima. Fato livre. Abraçar quem você ama é dos melhores remédios do mundo, e de graça. Não economize abraço nem carinho."
    if any(w in p for w in ["o que é a amizade", "o que e a amizade", "amizade", "amigos", "melhor amigo"]):
        return "Amizade, brow, é um dos maiores tesouros da vida: quem está do teu lado nas boas e nas ruins, sem julgamento. Fato livre. Amizade se constrói com confiança, lealdade e presença. Poucos e bons amigos valem mais que muitos conhecidos. Cultive quem te quer bem."
    if any(w in p for w in ["como ser um bom amigo", "bom amigo", "ser amigo", "amizade verdadeira"]):
        return "Pra ser um bom amigo, brow: escute de verdade, esteja presente nos momentos difíceis, seja leal e fale a verdade com carinho. Fato livre. Amizade é via de mão dupla — dá e recebe. Quem é bom amigo, colhe boas amizades. Seja quem você gostaria de ter."
    if any(w in p for w in ["o que é a família", "o que e a familia", "família", "familia", "minha familia"]):
        return "Família, brow, é o primeiro círculo de afeto: pode ser de sangue ou a que a gente escolhe (amigos que viram família). Fato livre. Nem toda família é perfeita, mas o apoio dela muda a vida. Valorize quem te quer bem e te aceita como você é."
    if any(w in p for w in ["como melhorar um relacionamento", "melhorar o relacionamento", "relacionamento", "namoro", "casamento"]):
        if "o que" in p and "termino" not in p:
            pass
        else:
            return "Pra melhorar relacionamento, brow: conversa honesta, escuta sem defesa, tempo de qualidade, carinho e resolver conflito cedo (não guardar). Fato livre. Amor não é só sentimento, é prática. Pequenas atenções todo dia fortalecem. Cuide do que você quer manter."
    if any(w in p for w in ["o que é o diálogo", "o que e o dialogo", "diálogo", "dialogo", "conversar"]):
        return "Diálogo, brow, é conversar de verdade: ouvir mais que falar, sem interromper, buscando entender. Fato livre. Resolve briga, aproxima pessoas e evita mal-entendido. Quando o assunto é difícil, o diálogo é a ponte. Conversa boa abre porta e cura."
    if any(w in p for w in ["o que é a paciência", "o que e a paciência", "paciencia", "paciência", "ter paciência"]):
        return "Paciência, brow, é a calma pra esperar e lidar com o que demora: é treino, não nasce pronta. Fato livre. Tudo na vida tem tempo — pressa estraga o que é bom. Paciência com você e com os outros evita sofrimento. Boa coisa se constrói devagar."
    if any(w in p for w in ["o que é a gratidão", "o que e a gratidão", "gratidao", "gratidão", "ser grato"]):
        return "Gratidão, brow, é reconhecer o que você já tem, em vez de só enxergar o que falta: praticar muda o olhar e melhora o bem-estar. Fato livre. Dica: todo dia lembra de 1-3 coisas boas. Gratidão não é negar problema, é ver o bem junto. Coração grato é mais leve."
    if any(w in p for w in ["o que é a esperança", "o que e a esperança", "esperanca", "esperança", "ter esperança"]):
        return "Esperança, brow, é acreditar que pode melhorar — é o que nos faz seguir quando aperta. Fato livre. Não é ilusão, é fé no amanhã com ação. Sem esperança, nada se começa. Guarda a tua: o dia mais escuro ainda tem amanhã. Melhora vem pra quem acredita e segue."
    if any(w in p for w in ["como animar alguém", "animar alguém", "animar", "alegrar", "consolar", "confortar"]):
        return "Pra animar alguém, brow: estar presente já ajuda — escuta, acolhe e não tenta 'consertar' logo. Às vezes só ter um ombro amigo basta. Fato livre. Palavra de apoio e um abraço mudam o dia. Ofereça companhia e depois uma leveza. Presença verdadeira é remédio."
    if any(w in p for w in ["o que é a solidão", "o que e a solidão", "solidao", "solidão", "me sinto sozinho"]):
        return "Solidão, brow, é sentir que está só, mesmo no meio de gente: é comum e pode doer. Fato livre. Ajuda: buscar conexão real, fazer atividade, cuidar de você e, se pesar, falar com alguém ou profissional. Você não está tão sozinho quanto parece. Busque quem te quer bem."
    if any(w in p for w in ["o que é a gentileza", "o que e a gentileza", "gentileza", "ser gentil", "bondade"]):
        return "Gentileza, brow, é o cuidado pequeno com o outro: ceder lugar, agradecer, elogiar, ajudar. Fato livre. 'Gentileza gera gentileza' — é verdade, contamina pra melhor. Um gesto bom de graça pode mudar o dia de alguém. Ser gentil é simples e gigante."

    # ═══════════════════════════════════════════════════════════
    # MAIS HISTÓRIA, PERSONALIDADES E MARCOS DO MUNDO (fatos livres)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que foi a revolução francesa", "revolução francesa", "revolucao francesa", "queda da bastilha"]):
        return "A Revolução Francesa, brow, foi em 1789: o povo derrubou a monarquia e o rei Luís XVI, lutando por 'liberdade, igualdade e fraternidade'. Mudou a história da política mundial. Fato livre. Inspirou revoluções no mundo todo, incluindo lutas por direitos. Marco de uma nova era."
    if any(w in p for w in ["o que foi a revolução industrial", "revolução industrial", "revolucao industrial", "máquina a vapor"]):
        return "A Revolução Industrial, brow, começou na Inglaterra no séc. XVIII: máquinas substituíram o trabalho manual, surgiram fábricas e ferrovias. Transformou economia, cidade e vida de todo mundo. Fato livre. Criou riqueza e também desigualdade. Base do mundo moderno como conhecemos."
    if any(w in p for w in ["o que foi a independência do brasil", "independência do brasil", "independencia do brasil", "7 de setembro", "grito do ipiranga"]):
        return "A Independência do Brasil, brow, foi em 7 de setembro de 1822, quando Dom Pedro I proclamou a separação de Portugal às margens do rio Ipiranga. Fato livre. O Brasil virou império independente. É feriado nacional. Marco que todo brasileiro deveria conhecer."
    if any(w in p for w in ["o que foi a proclamação da república", "proclamação da república", "proclamacao da republica", "15 de novembro"]):
        return "A Proclamação da República, brow, foi em 15 de novembro de 1889: o marechal Deodoro da Fonseca derrubou a monarquia de Dom Pedro II e o Brasil virou república. Fato livre. É feriado nacional. Fim da era dos imperadores e começo da república que temos hoje."
    if any(w in p for w in ["o que foi a abolição da escravatura", "abolição da escravatura", "abolicao da escravatura", "lei áurea", "lei aurea"]):
        return "A abolição da escravatura, brow, foi em 1888 com a Lei Áurea, assinada pela Princesa Isabel — libertou os escravizados no Brasil, que foi o último país das Américas a abolir. Fato livre. Mas a luta de Zumbi e dos quilombos foi longa. A igualdade plena ainda é uma batalha de todos os dias."
    if any(w in p for w in ["o que foi a guerra de canudos", "guerra de canudos", "canudos", "antônio conselheiro"]):
        return "A Guerra de Canudos, brow, foi no fim do séc. XIX na Bahia: Antônio Conselheiro liderou uma comunidade no sertão, que foi atacada pelo exército. Fato livre. O escritor Euclides da Cunha narrou em 'Os Sertões'. Mostrou o abismo entre o Brasil oficial e o real. História dura e verdadeira."
    if any(w in p for w in ["o que foi a revolta da vacina", "revolta da vacina", "revolta da vacina", "1904"]):
        return "A Revolta da Vacina, brow, foi em 1904 no Rio: o povo se revoltou contra a vacinação obrigatória contra a varíola, num contexto de medo e autoritarismo. Fato livre. Hoje sabemos que vacina salva vidas — mas o episódio ensina que saúde pública precisa de informação e diálogo, não só força."
    if any(w in p for w in ["o que foi a semana de arte moderna", "semana de arte moderna", "semana de 22", "semana de 1922"]):
        return "A Semana de Arte Moderna, brow, foi em 1922 em São Paulo: artistas como Mário de Andrade, Tarsila e Oswald quebraram o padrão e criaram um modernismo brasileiro. Fato livre. Virou o marco da arte moderna no país. Brasil mostrando sua própria cara, com raiz e ousadia."
    if any(w in p for w in ["o que foi a era vargas", "era vargas", "getúlio vargas", "getulio vargas", "estado novo"]):
        return "A Era Vargas, brow, foi quando Getúlio Vargas governou o Brasil (1930-45 e 50-54): criou leis trabalhistas (CLT), a Petrobras e a indústria. Fato livre. Foi um período de forte nacionalismo e controvérsias. Vargas marcou o país e até hoje divide opiniões."
    if any(w in p for w in ["o que foi a ditadura militar", "ditadura militar", "regime militar", "1964"]):
        return "A Ditadura Militar, brow, foi o regime autoritário no Brasil (1964-1985): militares no poder, censura, perseguição e repressão a opositores. Fato livre. Foi um período sombrio de falta de liberdade. A redemocratização veio em 1985. Conhecer esse passado é importante pra não se repetir."
    if any(w in p for w in ["o que foi o movimento das diretas já", "diretas já", "diretas ja", "diretas"]):
        return "As Diretas Já, brow, foi o movimento de 1984 que pedia eleição direta pra presidente, após a ditadura. Multidões foram às ruas. Fato livre. Não passou naquele ano, mas abriu caminho pra redemocratização (1985). A voz do povo nas ruas mudou o Brasil."
    if any(w in p for w in ["o que é a constituição", "constituição", "constituicao", "constituição cidadã", "constituição de 1988"]):
        return "A Constituição, brow, é a lei máxima de um país — define direitos e regras de tudo. A brasileira de 1988 foi chamada 'Constituição Cidadã' por garantir muitos direitos. Fato livre. É a base da democracia e da justiça. Conhecer seus direitos é empoderamento. Todo cidadão deveria conhecê-la."
    if any(w in p for w in ["o que é a democracia", "o que e a democracia", "democracia", "democracia"]):
        return "Democracia, brow, é o sistema onde o poder vem do povo: a gente vota, escolhe representantes e participa. Fato livre. Nasceu na Grécia Antiga e evoluiu no mundo. Exige participação e respeito às regras. Democracia não é só votar — é cidadania ativa todo dia."
    if any(w in p for w in ["o que é um direito", "o que e um direito", "direitos humanos", "direitos do cidadão", "o que são direitos"]):
        return "Direito, brow, é o que a lei garante a você: vida, liberdade, educação, trabalho, igualdade, moradia. Fato livre. Os Direitos Humanos valem pra todo mundo, sem exceção. Conhecer e defender teus direitos é cidadania. Ninguém pode te tirar o que é teu por lei."
    if any(w in p for w in ["o que é a cidadania", "o que e a cidadania", "cidadania", "ser cidadão", "ser cidadao"]):
        return "Cidadania, brow, é ser parte ativa da sociedade: ter direitos e também deveres — votar, respeitar, participar e cobrar. Fato livre. Cidadão não é só quem mora num lugar, é quem age por ele. Exercer cidadania é mudar o ambiente à sua volta. Seja cidadão de verdade."
    if any(w in p for w in ["o que é a globalização", "o que e a globalizacao", "globalização", "globalizacao"]):
        return "Globalização, brow, é a conexão do mundo: comércio, internet, cultura e pessoas circulando entre países. Fato livre. Aproxima culturas e economias, mas também traz desigualdade. É fenômeno que mudou o dia a dia. Estamos todos interligados — o que acontece longe afeta a gente."
    if any(w in p for w in ["o que é a cultura", "o que e a cultura", "cultura", "cultura brasileira", "o que é cultura"]):
        return "Cultura, brow, é o jeito de ser de um povo: língua, comida, música, dança, crença, história e costume. A brasileira é rica e misturada — indígena, africana, europeia. Fato livre. Cultura é identidade e orgulho. Conhecer a própria cultura é conhecer a si mesmo. Brasil é um mosaico de cultura."
    if any(w in p for w in ["o que é a língua", "o que e a lingua", "língua portuguesa", "lingua portuguesa", "origem do português"]):
        return "A língua portuguesa, brow, nasceu do latim na Península Ibérica e veio pro Brasil com os colonizadores. É uma das mais faladas do mundo (mais de 250 milhões). Fato livre. É língua oficial de Brasil, Portugal e países africanos. Cada região tem seu sotaque e jeito. Língua é casa e identidade."
    if any(w in p for w in ["o que é o carnaval", "o que e o carnaval", "carnaval", "carnaval brasileiro", "folia"]):
        return "Carnaval, brow, é a maior festa popular do Brasil: desfile de escola de samba, trio elétrico, bloco de rua e muita alegria. Nasceu da tradição europeia e ganhou cara brasileira. Fato livre. Rio, Salvador, Recife e Olinda são os grandes palcos. É festa de liberdade e cor. Momento que o país inteiro se solta."
    if any(w in p for w in ["o que é o são joão", "o que e o sao joao", "são joão", "sao joao", "festa junina", "festa de junho"]):
        return "São João (festa junina), brow, é a festa de junho, forte no Nordeste: fogueira, quadrilha, milho, canjica, bolo e forró. Homenageia santos (João, Antônio, Pedro). Fato livre. Campina Grande e Caruaru têm as maiores do mundo. É tradição de roça, família e alegria. Arraiá é raiz brasileira."
    if any(w in p for w in ["o que é o folclore", "o que e o folclore", "folclore", "lendas do brasil", "folclore brasileiro"]):
        return "Folclore, brow, é o conjunto de lendas, músicas, danças e crenças de um povo: no Brasil tem saci, curupira, boitatá, mula-sem-cabeça, Iara. Fato livre. É cultura popular passada de geração em geração. O dia do folclore é 22 de agosto. Conhecer o folclore é guardar a alma do Brasil."
    if any(w in p for w in ["o que é o dia das mães", "dia das mães", "dia das maes", "o que é o dia dos pais", "dia dos pais"]):
        return "Dia das Mães e Dia dos Pais, brow, são datas pra homenagear quem cuida e ama a gente. Fato livre. Não é só presente — é reconhecer e agradecer. Quem tem pai e mãe por perto, aproveita. E quem não tem, homenageia de outro jeito. Amor de família merece dia todo ano."

    # ═══════════════════════════════════════════════════════════
    # MAIS CIÊNCIA DA SAÚDE, CORPO E BEM-ESTAR (fatos livres)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que é a vitamina", "o que e a vitamina", "vitamina", "vitaminas", "vitamina c", "vitamina d"]):
        return "Vitaminas, brow, são nutrientes que o corpo precisa em pequenas doses pra funcionar: cada uma tem seu papel (a C ajuda na imunidade, a D nos ossos, as do complexo B na energia). Fato livre. Vêm da comida — fruta, verdura, sol (vitamina D). Comer variado cobre quase tudo."
    if any(w in p for w in ["o que é a proteína", "o que e a proteina", "proteína", "proteina", "o que é proteina"]):
        return "Proteína, brow, é um nutriente essencial: constrói e repara músculo, pele, cabelo e células. Fato livre. Está na carne, frango, peixe, ovo, leite, feijão, lentilha, castanhas. Quem treina precisa bastante. Corpo é feito de proteína — é o 'tijolinho' da vida."
    if any(w in p for w in ["o que é o carboidrato", "o que e o carboidrato", "carboidrato", "carboidratos", "carbo"]):
        return "Carboidrato, brow, é a principal fonte de energia do corpo: pão, arroz, macarrão, batata, fruta, e os doces. Fato livre. Carboidrato não é vilão — o exagero é. Os integrais (aveia, batata-doce) sustentam mais. Energia pra viver, treinar e trabalhar vem dele."
    if any(w in p for w in ["o que é a gordura", "o que e a gordura", "gordura", "gorduras", "lipídio"]):
        return "Gordura, brow, é nutriente e fonte de energia: precisa dela pro cérebro e hormônios, mas há as boas e as ruins. Fato livre. Boas: abacate, azeite, castanhas, peixe (ômega). Ruins em excesso: fritura, ultraprocessado. Equilíbrio é tudo. Gordura não é inimiga — excesso sim."
    if any(w in p for w in ["o que é a fibra", "o que e a fibra", "fibra", "fibras", "alimentação com fibra"]):
        return "Fibra, brow, é a parte dos alimentos que não digerimos mas faz bem: ajuda a digestão, o intestino e dá saciedade. Fato livre. Está em fruta, verdura, aveia, feijão, grãos integrais. Comer fibra é cuidado simples e poderoso. Intestino feliz, corpo leve."
    if any(w in p for w in ["o que é a água", "o que e a agua", "agua", "água", "beber água", "hidratação"]):
        if "mar" in p or "rio" in p or "oceano" in p or "planeta" in p or "chover" in p or "chuva" in p:
            pass
        else:
            return "Água, brow, é essencial pra vida: o corpo é ~60% água e precisa dela pra tudo — digestão, temperatura, cérebro. Fato livre. Dica: bebe ao longo do dia, ~2 litros (mais no calor/atividade). Desidratação dá cansaço e dor de cabeça. Água é o melhor remédio, de graça."
    if any(w in p for w in ["o que é o metabolismo", "o que e o metabolismo", "metabolismo", "metabolismo lento", "acelerar metabolismo"]):
        return "Metabolismo, brow, é o conjunto de reações do corpo que gera energia: transforma comida em combustível. Fato livre. É influenciado por idade, músculo e genética. Ajuda a acelerar: treino de força, proteína, dormir bem e não pular refeições. Corpo em movimento, energia em dia."
    if any(w in p for w in ["o que é a imunidade", "o que e a imunidade", "imunidade", "sistema imunológico", "defesas do corpo"]):
        return "Imunidade, brow, é a defesa do corpo contra vírus e bactérias: o sistema imunológico é o exército interno. Fato livre. Ajuda a fortalecer: dormir bem, comer fruta e verdura, atividade física, reduzir estresse, vacinação. Defesa boa começa no hábito de todo dia."
    if any(w in p for w in ["o que é a inflamação", "o que e a inflamacao", "inflamação", "inflamacao", "inflamatório"]):
        return "Inflamação, brow, é a resposta do corpo a lesão ou infecção — é defesa (vermelho, inchaço, calor). Mas crônica faz mal e está ligada a várias doenças. Fato livre. Ajuda a reduzir: menos ultraprocessado, mais comida de verdade, sono, atividade e controle do estresse."
    if any(w in p for w in ["o que é o colágeno", "o que e o colageno", "colágeno", "colageno"]):
        return "Colágeno, brow, é a proteína que dá estrutura à pele, articulação, osso e tendão. O corpo produz, mas diminui com a idade. Fato livre. Ajuda a manter: proteína na comida, vitamina C, e menos açúcar e fumo. Pele e articulação agradecem. Estrutura do corpo é colágeno."
    if any(w in p for w in ["o que é o sono profundo", "sono profundo", "fases do sono", "o que e o sono", "dormir bem"]):
        return "O sono, brow, tem fases, incluindo a profunda e a do sonho (REM): é quando o corpo se recupera e a memória se fixa. Dormir mal afeta tudo. Fato livre. Ajuda: horário regular, quarto escuro, sem celular antes, menos cafeína à noite. Sono de qualidade é saúde de verdade."
    if any(w in p for w in ["o que é a pressão arterial", "pressão arterial", "pressão alta", "pressao alta", "hipertensão"]):
        return "Pressão arterial, brow, é a força do sangue nas artérias: alta (hipertensão) sobrecarrega coração e vasos, e muita gente nem sente. Fato livre. Ajuda: menos sal, atividade física, peso saudável, menos álcool, não fumar e medir sempre. Pressão cuidada é vida longa."
    if any(w in p for w in ["o que é o colesterol", "o que e o colesterol", "colesterol", "colesterol alto"]):
        return "Colesterol, brow, é uma gordura que o corpo usa (hormônios, células). O 'ruim' (LDL) em excesso entope vaso; o 'bom' (HDL) protege. Fato livre. Ajuda: menos fritura e gordura saturada, mais fibra, exercício e controle do peso. Colesterol cuidado é coração protegido."
    if any(w in p for w in ["o que é a diabetes", "o que e a diabetes", "diabetes", "glicemia", "açúcar no sangue"]):
        return "Diabetes, brow, é quando o açúcar no sangue fica alto: no tipo 1 o corpo não produz insulina; no tipo 2 (mais comum) o corpo resiste. Fato livre. Ajuda: alimentação equilibrada, atividade física, peso saudável e exame. Prevenção muda o jogo. Controle é qualidade de vida."
    if any(w in p for w in ["o que é a tireoide", "o que e a tireoide", "tireoide", "tireoidite", "hipotireoidismo"]):
        return "Tireoide, brow, é a glândula no pescoço que controla o metabolismo (hormônios T3 e T4). Quando vai mal, pode dar cansaço, mudança de peso, alteração de humor. Fato livre. Tem tratamento simples com exame de sangue. Quem sente sintoma, avalia com médico. Pequena glândula, grande impacto."
    if any(w in p for w in ["o que é a anemia", "o que e a anemia", "anemia", "ferro baixo"]):
        return "Anemia, brow, é a falta de hemoglobina/ferro no sangue: dá fraqueza, cansaço e palidez. A mais comum é a ferropriva (falta de ferro). Fato livre. Ajuda: comida rica em ferro (feijão, carne, folhas) com vitamina C, e tratar a causa. Exame de sangue descobre. Corpo precisa de ferro."
    if any(w in p for w in ["o que é a vitamina d", "vitamina d", "vitamina d3", "sol e vitamina d"]):
        return "Vitamina D, brow, é essencial pros ossos e imunidade: o corpo produz com sol na pele, e pouco sol gera falta. Fato livre. Está também em peixe e ovo. Dica: sol de manhã (15-20 min, sem exagero) e, se precisar, avalia suplemento com médico. Luz do sol é saúde."
    if any(w in p for w in ["o que é a depressão", "o que e a depressão", "depressao", "depressão", "o que é depressao"]):
        if "o que" in p:
            return "Depressão, brow, é uma doença real, não 'frescura': tristeza profunda, falta de energia, perda de interesse que dura. Não é vergonha — é condição que tem tratamento (terapia, medicação, apoio). Fato livre. Se você (ou alguém) sente isso, buscar ajuda é o primeiro passo. CVV 188, gratuita e sigilosa. Você importa."
    if any(w in p for w in ["o que é a ansiedade", "o que e a ansiedade", "ansiedade", "ansiedade"]):
        return "Ansiedade, brow, é a mente acelerando com medo e preocupação do futuro. Em dose, é normal; quando trava a vida, vira transtorno. Ajuda: respiração, movimento, menos cafeína, falar com quem confia e terapia. Fato livre. Não tá sozinho. Pedir ajuda é força. Respira fundo."
    if any(w in p for w in ["o que é o estresse", "o que e o estresse", "estresse", "stress", "estressado"]):
        return "Estresse, brow, é a resposta do corpo à pressão: em dose pequena motiva, mas crônico desgasta mente e corpo. Fato livre. Ajuda: pausas, atividade física, sono, respiração, lazer e organizar tarefas. Reduzir estresse é cuidar da saúde. Pequenas pausas mudam o dia."
    if any(w in p for w in ["o que é o bem-estar", "o que e o bem-estar", "bem-estar", "bem estar", "qualidade de vida"]):
        return "Bem-estar, brow, é o equilíbrio entre corpo, mente e vida: dormir bem, comer decente, se mexer, ter lazer e relações boas. Fato livre. Não é só ausência de doença — é sentir-se bem. Pequenos hábitos diários constroem qualidade de vida. Cuida de você, do corpo e da cabeça."

    # ═══════════════════════════════════════════════════════════
    # MAIS CONHECIMENTO GERAL E CURIOSIDADES DO DIA A DIA (fatos livres)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que é o horário de brasília", "horário de brasília", "horario de brasilia", "fuso do brasil"]):
        return "O horário de Brasília, brow, é o horário oficial do Brasil (UTC-3): o país tem 4 fusos, mas a maior parte segue o de Brasília. Fato livre. Ele é a referência pra relógio, TV e negócios. Quando falam 'horário de Brasília', é o tempo padrão do país."
    if any(w in p for w in ["o que é o dia", "o que e o dia", "por que tem dia e noite", "dia e noite", "por que escurece"]):
        return "Dia e noite, brow, acontecem pela rotação da Terra: quando o lado de cá vira pro Sol é dia, e quando vira pra longe é noite. A Terra gira em ~24h. Fato livre. Cada ponto do planeta vê o Sol nascer e se pôr. Por isso a gente tem manhã, tarde e noite."
    if any(w in p for w in ["o que é o ano", "o que e o ano", "ano bissexto", "por que tem ano bissexto", "366 dias"]):
        return "O ano, brow, é o tempo que a Terra leva pra dar uma volta no Sol (~365 dias). Por isso sobra um quarto de dia por ano, que se soma e vira o ano bissexto (366 dias) a cada 4 anos, em fevereiro com 29 dias. Fato livre. Calendário é a matemática do planeta."
    if any(w in p for w in ["o que é o mês", "o que e o mes", "mês", "mes", "por que tem meses"]):
        return "O mês, brow, veio do ciclo da Lua: os antigos dividiam o ano pela Lua, e isso virou os meses do calendário. Fato livre. Têm 28 a 31 dias, e fevereiro é o menor. Cada mês marca estações, festas e fases da vida. Tempo contado pelo céu."
    if any(w in p for w in ["o que é a semana", "o que e a semana", "semana", "dias da semana", "por que a semana tem 7 dias"]):
        return "A semana de 7 dias, brow, vem da tradição antiga ligada à Lua e aos astros (o nome dos dias vem de planetas em outras línguas). Fato livre. Domingo, segunda até sábado. A semana organiza trabalho, descanso e vida. Sete dias que estruturam nossa rotina."
    if any(w in p for w in ["o que é a estação do ano", "estações do ano", "estacao do ano", "primavera", "verão", "outono", "inverno", "por que tem estações"]):
        return "As estações (primavera, verão, outono, inverno), brow, vêm da inclinação da Terra enquanto gira em volta do Sol: cada parte do ano recebe mais ou menos sol. Fato livre. Não é a distância do Sol, é a inclinação. Nascem flores, muda o tempo, muda a vida."
    if any(w in p for w in ["o que é o solstício", "solsticio", "solstício", "equinócio", "equinocio"]):
        return "Solstício e equinócio, brow, marcam as estações: no solstício o dia é o mais longo (ou mais curto) do ano; no equinócio, dia e noite têm quase a mesma duração. Fato livre. Vêm da inclinação da Terra. São os 'pontos de virada' do calendário do Sol."
    if any(w in p for w in ["o que é o calendário", "o que e o calendario", "calendário", "calendario", "calendário gregoriano"]):
        return "Calendário, brow, é o sistema de organizar o tempo em dias, meses e anos. O nosso é o gregoriano, baseado no nascimento de Cristo e ajustado com o ano bissexto. Fato livre. Existem outros (chinês, islâmico, judaico). O calendário organiza festas, trabalho e a história."
    if any(w in p for w in ["o que é o relógio", "o que e o relogio", "relógio", "relogio", "medir o tempo"]):
        return "Relógio, brow, é a máquina de medir o tempo: do relógio de sol e de areia aos digitais atômicos de hoje. Fato livre. O tempo sempre importou pra humanidade — colher, trabalhar, viajar. Relógio é o jeito de a gente não se perder no dia."
    if any(w in p for w in ["o que é a hora", "o que e a hora", "hora", "quantas horas tem o dia", "o que é hora"]):
        return "Hora, brow, é a unidade de tempo: o dia tem 24 horas, a hora 60 minutos, o minuto 60 segundos. A divisão em 60 vem de civilizações antigas (mesopotâmicos). Fato livre. O dia e a noite se dividem em horas. Hora organiza compromisso, comida e descanso."
    if any(w in p for w in ["o que é um número", "o que e um numero", "número", "numero", "números", "o que é numero"]):
        return "Número, brow, é a ideia de quantidade: 1, 2, 3... A gente inventou símbolos pra contar coisas. Fato livre. O zero e o sistema posicional (decimais) vieram da Índia e dos árabes. Número está em tudo: dinheiro, hora, idade. Contar é a base do raciocínio humano."
    if any(w in p for w in ["o que é o zero", "o que e o zero", "zero", "o número zero", "invenção do zero"]):
        return "O zero, brow, é um número revolucionário: foi inventado na Índia e revolucionou a matemática, permitindo contar grandes números e a posição decimal. Fato livre. Sem o zero não haveria computação moderna como a gente usa. Um simples símbolo que mudou o mundo."
    if any(w in p for w in ["o que é um conjunto", "o que e um conjunto", "conjunto", "conjuntos", "teoria dos conjuntos"]):
        return "Conjunto, brow, em matemática, é uma coleção de coisas com uma característica comum: números pares, letras, pessoas. Fato livre. Os conjuntos organizam o raciocínio e são a base da lógica e até dos dados. Agrupar é o jeito humano de entender o mundo."
    if any(w in p for w in ["o que é a lógica", "o que e a logica", "lógica", "logica", "raciocínio lógico"]):
        return "Lógica, brow, é a arte de pensar certo: conectar ideias com razão, sem contradição. Se A e B, então C. Fato livre. É a base da matemática, da ciência, da programação e de decidir bem. Treinar lógica é afiar a mente. Pensar claro é poder."
    if any(w in p for w in ["o que é uma prova", "o que e uma prova", "prova", "prova de matemática", "demonstração"]):
        return "Prova (demonstração), brow, em matemática e ciência, é mostrar com razão que uma ideia é verdadeira, passo a passo, sem opinião. Fato livre. É o que separa crença de conhecimento. Provas construíram a ciência. Questionar e comprovar é o caminho da verdade."
    if any(w in p for w in ["o que é a pesquisa", "o que e a pesquisa", "pesquisa", "pesquisar", "como pesquisar"]):
        return "Pesquisa, brow, é buscar e organizar informação com método pra entender ou resolver algo: cientista, jornalista ou estudante. Fato livre. Boa pesquisa usa fontes confiáveis e checa fatos. No mundo de hoje, saber pesquisar (e duvidar) é superpoder. Pergunta boa é meio caminho."
    if any(w in p for w in ["o que é uma fonte confiável", "fonte confiável", "fonte confiavel", "fonte segura", "notícia falsa", "fake news"]):
        return "Fonte confiável, brow, é de onde vem uma informação com credibilidade: site oficial, universidade, imprensa séria, livro de referência. Fato livre. Fake news é mentira espalhada como verdade. Dica: desconfie do emocional, cheque em mais de um lugar e veja quem fala. Verdade se verifica."
    if any(w in p for w in ["o que é a verdade", "o que e a verdade", "verdade", "o que é verdade"]):
        return "Verdade, brow, é o que corresponde aos fatos, ao que realmente é — diferente de opinião e de mentira. Fato livre. Nem sempre é fácil de achar, mas buscá-la com honestidade é o que vale. Verdade constrói confiança. Ser honesto com você e com os outros é caminho."
    if any(w in p for w in ["o que é uma opinião", "o que e uma opiniao", "opinião", "opiniao", "o que é opiniao"]):
        return "Opinião, brow, é o que você acha, sua visão sobre algo — pode ser certa ou errada, e é pessoal. Fato livre. Opinião é diferente de fato (que é verdade objetivo). Todo mundo tem direito à opinião, mas respeitar a dos outros e basear a sua em fatos é sabedoria."
    if any(w in p for w in ["o que é um fato", "o que e um fato", "fato", "o que é fato"]):
        return "Fato, brow, é algo que é verdadeiro e comprovável, independente do que alguém acha: 'o sol nasce no leste' é fato. Fato livre. Fatos são a base da ciência e da decisão boa. Saber distinguir fato de opinião é o primeiro passo pra pensar bem."

    # ═══════════════════════════════════════════════════════════
    # MAIS PAÍSES E CAPITAIS DO MUNDO (fatos livres)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que e a inglaterra", "inglaterra", "reino unido", "capital da inglaterra", "londres"]):
        if "novo" in p or "nova" in p:
            pass
        else:
            return "A Inglaterra, brow, faz parte do Reino Unido, capital Londres. Berço do idioma inglês, da revolução industrial e do rock. Tem história real, castelos, chá das cinco e o famoso Big Ben. Fato livre. Terra de Shakespeare e dos Beatles. Influenciou o mundo todo."
    if any(w in p for w in ["o que e a franca", "frança", "franca", "capital da franca", "paris"]):
        if "passou" in p or "durante" in p:
            pass
        else:
            return "A França, brow, é um país da Europa, capital Paris (cidade do amor e da torre Eiffel). Berço do cinema, da gastronomia e dos direitos humanos. Fato livre. Teve a Revolução Francesa e artistas como Monet. País de moda, arte e boa comida."
    if any(w in p for w in ["o que e a alemanha", "alemanha", "capital da alemanha", "berlim"]):
        return "A Alemanha, brow, é um país da Europa, capital Berlim. Potência em engenharia, indústria e ciência. Fato livre. Berço de Beethoven, Einstein e da invenção do automóvel. Foi dividida pelo Muro de Berlim e se reunificou em 1990. Tradição, inovação e cerveja."
    if any(w in p for w in ["o que e a italia", "italia", "itália", "capital da italia", "roma"]):
        if "romance" in p or "romances" in p or "romantico" in p or "romântico" in p or "romantismo" in p:
            pass
        else:
            return "A Itália, brow, é um país da Europa, capital Roma (berço do Império Romano). Terra do Coliseu, do Vaticano, da pizza, do macarrão e do gelato. Fato livre. De Da Vinci a Vivaldi, é berço de arte e moda. La dolce vita: comida boa e alegria."
    if any(w in p for w in ["o que e a espanha", "espanha", "capital da espanha", "madri"]):
        return "A Espanha, brow, é um país da Europa, capital Madri. Terra de flamenco, tourada, tapas e das grandes navegações (Colombo). Fato livre. Barcelona é famosa pela arte de Gaudí. Ela colonizou parte das Américas, incluindo nossa língua vizinha. Paixão e tradição."
    if any(w in p for w in ["o que e a portugal", "portugal", "capital de portugal", "lisboa"]):
        return "Portugal, brow, é o país europeu que colonizou o Brasil, capital Lisboa. Terra do fado, do bacalhau e dos grandes navegadores (Vasco da Gama, Cabral). Fato livre. Nos deu a língua portuguesa. Hoje é país moderno e querido. Raiz da nossa história."
    if any(w in p for w in ["o que e o japao", "japão", "japao", "capital do japao", "toquio"]):
        return "O Japão, brow, é um país da Ásia, capital Tóquio. Terra do sushi, dos samurais, dos mangás e da tecnologia (robótica, eletrônicos). Fato livre. Mistura tradição (templos, cerimônia do chá) e futuro (trens-bala, games). Ilhas de disciplina e inovação."
    if any(w in p for w in ["o que e a china", "china", "capital da china", "pequim"]):
        return "A China, brow, é o país mais populoso da Ásia e uma potência mundial, capital Pequim. Berço da Grande Muralha, da pólvora, do papel e da seda. Fato livre. Hoje lidera em tecnologia e comércio. Civilização de milhares de anos. Gigante que não para."
    if any(w in p for w in ["o que e a india", "índia", "india", "capital da india", "nova deli"]):
        return "A Índia, brow, é um país gigante da Ásia, capital Nova Délhi. Berço do hinduísmo, do yoga, da matemática (inventaram o zero) e dos filmes de Bollywood. Fato livre. Culinária: curry e especiarias. População enorme e tecnologia de TI forte. Terra de cor, tradição e muita energia."
    if any(w in p for w in ["o que e a coreia do sul", "coreia do sul", "coreia", "coréia", "seul"]):
        return "A Coreia do Sul, brow, é um país da Ásia, capital Seul. Potência em tecnologia (Samsung, LG), música (K-pop) e games. Fato livre. O K-drama e o K-pop conquistaram o mundo. De carros a skincare, é inovação em tudo. Um país que virou fenômeno cultural global."
    if any(w in p for w in ["o que e o egito", "egito", "capital do egito", "cairo"]):
        return "O Egito, brow, é um país do norte da África, capital Cairo. Terra das pirâmides, dos faraós, do rio Nilo e das múmias. Fato livre. Uma das civilizações mais antigas do mundo. Hoje também tem o Canal de Suez. História milenar que fascina até hoje."
    if any(w in p for w in ["o que e o canada", "canadá", "canada", "capital do canada", "ottawa"]):
        return "O Canadá, brow, é um país gigante da América do Norte, capital Ottawa. Terra de paisagens congeladas, bordo (símbolo da folha) e muita natureza. Fato livre. Toronto, Vancouver e Montreal são cidades vibrantes. Imigrantes são bem-vindos. País frio de gente acolhedora."
    if any(w in p for w in ["o que e a australia", "australia", "austrália", "capital da australia", "camberra"]):
        return "A Austrália, brow, é um país-continente, capital Camberra. Terra de canguru, coala, praias e da Grande Barreira de Corais. Fato livre. Sydney e Melbourne são famosas. Esportes, natureza e vida ao ar livre. Um dos países mais felizes e descolados do mundo."
    if any(w in p for w in ["o que e o mexico", "méxico", "mexico", "capital do mexico", "cidade do mexico"]):
        return "O México, brow, é um país da América do Norte, capital Cidade do México. Berço de astecas e maias, terra de taco, guacamole, mariachi e Dia dos Mortos. Fato livre. Cultura rica, colorida e cheia de história. Muito mais que praia — alma e festa."
    if any(w in p for w in ["o que e a argentina", "argentina", "capital da argentina", "buenos aires"]):
        return "A Argentina, brow, é o vizinho sul-americano, capital Buenos Aires. Terra do tango, do churrasco (asado), do futebol (Maradona, Messi) e do vinho. Fato livre. Portenho é apaixonado e barulhento. Rivalidade no futebol, mas respeito. O hermano da gente."
    if any(w in p for w in ["o que e o chile", "chile", "capital do chile", "santiago"]):
        return "O Chile, brow, é um país comprido da América do Sul, capital Santiago. Terra do deserto do Atacama (um dos mais secos do mundo), dos Andes e do pisco. Fato livre. É o maior produtor de cobre. Natureza extrema e cidades modernas. Vizinhança legal."
    if any(w in p for w in ["o que e a colombia", "colômbia", "colombia", "capital da colombia", "bogota"]):
        return "A Colômbia, brow, é um país da América do Sul, capital Bogotá. Terra do café, da salsa e de gente alegre. Fato livre. Cartagena é linda, Medellín virou exemplo de transformação. Beleza natural, caribe e música. Colômbia é coração latino pulsando."
    if any(w in p for w in ["o que e o peru", "peru", "capital do peru", "lima"]):
        return "O Peru, brow, é um país da América do Sul, capital Lima. Terra de Machu Picchu, dos incas e do ceviche (prato famoso). Fato livre. A Amazônia peruana é gigante. História milenar e comida premiada no mundo. Peru é tesouro sul-americano."
    if any(w in p for w in ["o que e a venezuela", "venezuela", "capital da venezuela", "caracas"]):
        return "A Venezuela, brow, é um país da América do Sul, capital Caracas. Terra do Angel Falls (a cachoeira mais alta do mundo), da arepa e do beisebol. Fato livre. Tem a maior reserva de petróleo do mundo. Passa por tempos difíceis, mas o povo é forte e acolhedor."
    if any(w in p for w in ["o que e o uruguai", "uruguai", "capital do uruguai", "montevideu"]):
        return "O Uruguai, brow, é um país pequeno da América do Sul, capital Montevidéu. Terra do chivito, do mate e do futebol (campeão da primeira Copa). Fato livre. Gente educada, praias de verão (Punta del Este). Vizinho tranquilo e querido. O hermanito dos hermanos."

    # ═══════════════════════════════════════════════════════════
    # MAIS PENSADORES, CIENTISTAS E PESSOAS QUE MUDARAM O MUNDO (fatos livres)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que é a filosofia", "o que e a filosofia", "filosofia", "filosofar", "o que é filosofia"]):
        return "Filosofia, brow, é o amor à sabedoria: perguntar e refletir sobre a vida, a verdade, o bem, o existir. Nasceu na Grécia (Sócrates, Platão, Aristóteles) e segue viva. Fato livre. Não dá respostas prontas — ensina a pensar melhor. Filosofar é exercitar a mente."
    if any(w in p for w in ["o que é a ética", "o que e a etica", "ética", "etica", "o que é etica"]):
        return "Ética, brow, é o estudo do que é certo e errado, como devemos agir: é a bússola moral que guia nossas escolhas. Fato livre. Diferente de regra, é princípio. Faz perguntas como 'isso é justo?'. Agir com ética é agir com consciência e respeito."
    if any(w in p for w in ["o que é a moral", "o que e a moral", "moral", "valores morais", "o que é moral"]):
        return "Moral, brow, é o conjunto de valores e costumes de uma sociedade sobre o que é certo ou errado. Fato livre. Pode variar entre culturas e épocas. A ética reflete sobre a moral. Saber o que é moral do teu lugar te ajuda a viver em sociedade."
    if any(w in p for w in ["o que é a justiça", "o que e a justica", "justiça", "justica", "o que é justica"]):
        return "Justiça, brow, é dar a cada um o que lhe é devido: tratar igual o que é igual e corrigir o desequilíbrio. É ideal e prática. Fato livre. Tem a justiça da lei e a do coração. Lutar por justiça é buscar um mundo mais equilibrado e digno pra todos."
    if any(w in p for w in ["o que é a liberdade", "o que e a liberdade", "liberdade", "o que é liberdade"]):
        return "Liberdade, brow, é o direito de escolher e agir com responsabilidade. Não é fazer tudo que quer — é ter opções e responder por elas. Fato livre. A liberdade de um termina onde começa a do outro. Ser livre é assumir a própria vida."
    if any(w in p for w in ["o que é a igualdade", "o que e a igualdade", "igualdade", "o que é igualdade"]):
        return "Igualdade, brow, é tratar as pessoas com os mesmos direitos e dignidade, sem discriminação. Fato livre. Não é ser tudo igual, é ter as mesmas chances e respeito. Igualdade é a base dos direitos humanos e de uma sociedade justa."
    if any(w in p for w in ["o que é a sabedoria", "o que e a sabedoria", "sabedoria", "pessoa sábia", "ser sábio"]):
        return "Sabedoria, brow, é saber usar o conhecimento com bom senso: não é só saber muito, é agir bem. Fato livre. Vem da experiência, dos erros e da reflexão. Sábio é quem escuta, pensa antes de agir e aprende com a vida. Saber viver é a sabedoria."
    if any(w in p for w in ["o que é a consciência", "o que e a consciencia", "consciência", "consciencia", "consciência humana"]):
        return "Consciência, brow, é a capacidade de perceber e pensar sobre si e o mundo: é a voz interna que avalia o que é certo e sente. Fato livre. A consciência humana é o grande mistério da ciência. Desenvolver consciência é crescer como gente."
    if any(w in p for w in ["o que é o livre-arbítrio", "livre-arbítrio", "livre arbitrio", "livre arbítrio", "destino"]):
        return "Livre-arbítrio, brow, é a ideia de que temos liberdade de escolher, em vez de sermos guiados só pelo destino. Fato livre. É um dos grandes debates da filosofia. Nossas escolhas constroem nossa vida. Você é, em parte, o que decide ser."
    if any(w in p for w in ["o que é a razão", "o que e a razão", "razao", "razão", "pensar racional"]):
        return "Razão, brow, é a capacidade de pensar com lógica e entender as coisas, em vez de só seguir emoção ou crença. Fato livre. É a base da ciência e do pensamento crítico. Racional e emocional andam juntos. Usar a razão é pensar antes de decidir."
    if any(w in p for w in ["o que é a ciência", "o que e a ciencia", "ciência", "ciencia", "o que é ciencia"]):
        return "Ciência, brow, é o jeito de conhecer o mundo com método: observar, fazer hipótese, testar e comprovar. Fato livre. Nasceu com grandes pensadores e segue evoluindo. Da medicina ao espaço, a ciência melhora a vida. Pensar cientificamente é duvidar com método."
    if any(w in p for w in ["o que é um cientista", "o que e um cientista", "cientista", "cientistas", "como é ser cientista"]):
        return "Cientista, brow, é quem estuda o mundo com método e curiosidade: faz perguntas, testa hipóteses e busca a verdade. Fato livre. Pode ser físico, biólogo, químico, e por aí vai. Grande cientista não é o que sabe tudo, é o que nunca para de perguntar."
    if any(w in p for w in ["o que é uma descoberta", "o que e uma descoberta", "descoberta", "descobertas", "invenção"]):
        return "Descoberta, brow, é encontrar algo que já existia mas não se sabia (como a gravidade); invenção é criar algo novo (como a lâmpada). Fato livre. As grandes descobertas mudaram a humanidade. Curiosidade e método geram descoberta. O mundo é cheio de segredos a achar."
    if any(w in p for w in ["o que é a física", "o que e a fisica", "física", "fisica", "o que é física"]):
        return "Física, brow, é a ciência que estuda a natureza: movimento, matéria, energia, força, luz e o universo. Fato livre. De Newton a Einstein, explica como o mundo funciona. Tudo ao redor é física — da bola quicando ao Sol brilhando. A física é a lei do mundo."
    if any(w in p for w in ["o que é a química", "o que e a quimica", "química", "quimica", "o que é quimica"]):
        return "Química, brow, é a ciência que estuda a matéria: átomos, moléculas e as reações entre eles. Fato livre. Está em tudo — da água que bebe ao remédio. Do cozimento da comida às reações do corpo, é química. Tudo é feito de química."
    if any(w in p for w in ["o que é a biologia", "o que e a biologia", "biologia", "o que é biologia"]):
        return "Biologia, brow, é a ciência da vida: estuda os seres vivos, de bactérias a baleias, e como funcionam. Fato livre. Compreende corpo, plantas, animais, células e evolução. Entender biologia é entender a vida. É a ciência que estuda a gente."
    if any(w in p for w in ["o que é a astronomia", "o que e a astronomia", "astronomia", "o que é astronomia"]):
        return "Astronomia, brow, é a ciência que estuda o céu: estrelas, planetas, galáxias e o universo. Fato livre. É uma das mais antigas — os antigos já observavam as estrelas. Hoje com telescópios poderosos. Astronomia nos mostra nosso lugar no cosmos."
    if any(w in p for w in ["o que é a história", "o que e a historia", "história", "historia", "o que é historia"]):
        return "História, brow, é o estudo do passado humano: como sociedades, pessoas e ideias mudaram ao longo do tempo. Fato livre. 'Quem não conhece a história está condenado a repeti-la.' Entender o passado ajuda a entender o presente e construir o futuro."
    if any(w in p for w in ["o que é a geografia", "o que e a geografia", "geografia", "o que é geografia"]):
        return "Geografia, brow, é a ciência que estuda a Terra: lugares, paisagens, clima, mapas e como as pessoas vivem nela. Fato livre. Do relevo às cidades, explica o mundo físico e humano. Conhecer geografia é se localizar no mundo de verdade."
    if any(w in p for w in ["o que é a psicologia", "o que e a psicologia", "psicologia", "o que é psicologia"]):
        return "Psicologia, brow, é a ciência que estuda a mente e o comportamento humano: como pensamos, sentimos, aprendemos e nos relacionamos. Fato livre. Ajuda a entender a si mesmo e aos outros. Terapia faz parte dela. Cuidar da mente é tão importante quanto do corpo."
    if any(w in p for w in ["o que é a sociologia", "o que e a sociologia", "sociologia", "o que é sociologia"]):
        return "Sociologia, brow, é a ciência que estuda a sociedade: como grupos, instituições e relações entre pessoas funcionam. Fato livre. Explica desigualdade, cultura, família e trabalho. Entender a sociedade é entender onde a gente vive. Conhecimento que transforma o olhar."

    # ═══════════════════════════════════════════════════════════
    # MAIS ARTES, LITERATURA E GRANDES OBRAS (fatos livres)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que é a arte", "o que e a arte", "arte", "o que é arte", "arte na vida"]):
        if "arte moderna" in p or "arte marcial" in p or "artes marciais" in p:
            pass
        else:
            return "Arte, brow, é a expressão da criatividade e da emoção humana: pintura, música, dança, teatro, escultura, cinema. Fato livre. Não é só beleza — é sentimento e visão de mundo. Cada época tem sua arte. Arte é a alma humana em forma visível."
    if any(w in p for w in ["o que é um poema", "o que e um poema", "poema", "poesia", "poema de amor"]):
        return "Poema, brow, é texto em versos que expressa emoção e beleza com palavras, muitas vezes com ritmo e rima. Fato livre. Poetas como Drummond, Cecília e Fernando Pessoa marcaram a língua. Poesia diz o que a pressa não alcança. Ler poema é sentir com a mente."
    if any(w in p for w in ["o que é um romance", "o que e um romance", "romance", "livro de romance", "gênero literário"]):
        return "Romance, brow, em literatura, é uma história longa de ficção com personagens e enredo: de amor, aventura, drama. Fato livre. O Brasil tem grandes romancistas (Machado, Clarice). É o tipo de livro mais lido do mundo. Uma boa história carrega a gente pra outro mundo."
    if any(w in p for w in ["o que é um conto", "o que e um conto", "conto", "conto de fadas", "conto literário"]):
        return "Conto, brow, é uma história curta que se lê de uma vez só: tem começo, meio e fim num único fôlego. Fato livre. Machado de Assis foi mestre do conto. O conto de fadas é o primo mágico. Menos é mais — conto é a arte de dizer muito em pouco."
    if any(w in p for w in ["o que é uma crônica", "o que e uma cronica", "crônica", "cronica"]):
        return "Crônica, brow, é um texto curto sobre o dia a dia, com um olhar leve e muitas vezes bem-humorado: lida em jornal, fala da vida comum. Fato livre. É um gênero muito brasileiro, com mestres como Rubem Braga e Fernando Sabino. Do cotidiano sai a melhor crônica."
    if any(w in p for w in ["o que é um mito", "o que e um mito", "mito", "mitologia", "mitos"]):
        return "Mito, brow, é uma história tradicional que explica o mundo e os valores de um povo: deuses, heróis e origens (mitologia grega, nórdica, indígena). Fato livre. Não é mentira — é narrativa sagrada e simbólica. Os mitos contam o que a ciência antiga não alcançava."
    if any(w in p for w in ["o que é uma lenda", "o que e uma lenda", "lenda", "lendas", "lendas urbanas"]):
        return "Lenda, brow, é uma história que mistura realidade e fantasia, passada de geração em geração: saci, curupira, cobra grande. Fato livre. As lendas urbanas são as versões modernas. Cada lugar tem suas lendas. Elas guardam a imaginação e a identidade de um povo."
    if any(w in p for w in ["o que é um fábula", "o que e uma fabula", "fábula", "fabula", "moral da história"]):
        return "Fábula, brow, é uma historinha curta com animais que falam, terminando com um ensinamento (moral). Fato livre. A mais famosa é Esopo (a lebre e a tartaruga). Também tem o brasileiro Monteiro Lobato. Fábula diverte e ensina numa tacada só."
    if any(w in p for w in ["o que é um enigma", "o que e um enigma", "enigma", "charada", "o que é charada"]):
        return "Enigma, brow, é uma pergunta ou mistério que esconde a resposta e precisa de raciocínio pra resolver. Fato livre. A charada é o primo divertido. O famoso enigma da Esfinge é clássico. Resolver enigma é treinar a mente. Curiosidade e lógica, lado a lado."
    if any(w in p for w in ["o que é um conto de fadas", "conto de fadas", "contos de fadas", "cinderela", "chapeuzinho"]):
        return "Conto de fadas, brow, é uma história mágica de príncipes, princesas e encantamentos: Cinderela, Chapeuzinho, Branca de Neve. Fato livre. Recolhidos por autores como os Irmãos Grimm e Perrault. Fazem a gente sonhar desde criança. Magia que atravessa o tempo."
    if any(w in p for w in ["o que é um super-herói", "super-herói", "super-heroi", "superheroi", "herói"]):
        return "Super-herói, brow, é o personagem de força e poderes que luta pelo bem: Superman, Batman, Homem-Aranha, e os nacionais como o Pererê. Fato livre. Nasceram nos quadrinhos e viraram cinema. Representam coragem e esperança. Herói não é só o que tem poder — é o que escolhe fazer o bem."
    if any(w in p for w in ["o que é o realismo", "realismo", "machado de assis", "realismo brasileiro"]):
        return "O Realismo, brow, foi um movimento literário do séc. XIX que retratava a vida como ela é, sem idealização. No Brasil, o mestre é Machado de Assis ('Memórias Póstumas de Brás Cubas'). Fato livre. Mostra o humano com defeitos e verdade. Arte que olha de frente a realidade."
    if any(w in p for w in ["o que é o modernismo", "modernismo", "modernismo brasileiro", "arte moderna"]):
        return "O Modernismo, brow, foi um movimento que quebrou as regras e buscou uma arte nova e brasileira: no Brasil, começou com a Semana de 22 (Mário, Tarsila, Oswald). Fato livre. Valorizou a linguagem popular e a brasilidade. Moderno é pensar o novo com raiz."
    if any(w in p for w in ["o que é o romantismo", "romantismo", "romantismo brasileiro", "josé de alencar"]):
        return "O Romantismo, brow, foi um movimento do séc. XIX que valorizava o sentimento, o amor e o nacionalismo: no Brasil, José de Alencar ('Iracema') e Álvares de Azevedo. Fato livre. Cantou a pátria e a paixão. É a arte do coração e do ideal."
    if any(w in p for w in ["o que é o barroco", "barroco", "barroco brasileiro", "arte barroca"]):
        return "O Barroco, brow, foi um estilo de arte e literatura séc. XVI-XVII: rico em detalhes, drama e contraste. No Brasil, o Aleijadinho fez as esculturas barrocas de Minas. Fato livre. É exuberância e emoção. As igrejas barrocas de Ouro Preto são tesouro do país."
    if any(w in p for w in ["o que é o renascimento", "renascimento", "renascença", "renascentista"]):
        return "O Renascimento, brow, foi um movimento do séc. XV-XVI que resgatou a cultura greco-romana e valorizou o humano: Da Vinci, Michelangelo, Galileu. Fato livre. Mudou arte, ciência e pensamento. O homem no centro do mundo. Nasceu na Itália e transformou a Europa."
    if any(w in p for w in ["o que é o cubismo", "cubismo", "picasso", "arte cubista"]):
        return "O Cubismo, brow, foi um movimento de arte do início do séc. XX que pintou as coisas em formas geométricas e múltiplos ângulos ao mesmo tempo. Picasso e Braque criaram. Fato livre. Quebrou a forma de ver o mundo. Arte que vê além do óbvio."
    if any(w in p for w in ["o que é o surrealismo", "surrealismo", "dali", "arte surrealista"]):
        return "O Surrealismo, brow, foi um movimento do séc. XX que explorou os sonhos e o inconsciente, com imagens estranhas e fantásticas. Salvador Dalí é o nome famoso. Fato livre. Vai além da realidade. Arte que acessa o mundo dos sonhos."
    if any(w in p for w in ["o que é o impressionismo", "impressionismo", "monet", "van gogh"]):
        return "O Impressionismo, brow, foi um movimento do fim do séc. XIX que pintou a luz e o momento: Monet, Renoir, Van Gogh. Fato livre. Buscavam a impressão do instante, com pinceladas soltas e cores vivas. Mudou a pintura pra sempre. Capturou a luz."
    if any(w in p for w in ["o que é o expressionismo", "expressionismo", "arte expressionista"]):
        return "O Expressionismo, brow, foi um movimento que expressou emoções fortes e distorcidas na arte, em vez de retratar a realidade: virou forte na Alemanha e no cinema (como 'Nosferatu'). Fato livre. A emoção manda na forma. Arte que grita o que a alma sente."
    if any(w in p for w in ["o que é a gravura", "o que e a gravura", "gravura", "xilogravura", "gravador"]):
        return "Gravura, brow, é a arte de imprimir imagens em papel a partir de uma matriz (madeira, metal): a xilogravura é feita em madeira e é famosa na literatura de cordel do Nordeste. Fato livre. Cada impressão é uma obra. Arte de repetição que virou tradição brasileira."

    # ═══════════════════════════════════════════════════════════
    # MAIS NATUREZA, ASTRONOMIA E FENÔMENOS (fatos livres)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que é um cometa", "o que e um cometa", "cometa", "cometas", "cauda do cometa"]):
        return "Cometa, brow, é uma bola de gelo e poeira que viaja pelo espaço: quando se aproxima do Sol, aquece e solta a famosa cauda brilhante. Fato livre. O Halley volta a cada 76 anos. Cometas são 'mensageiros' antigos do sistema solar. Mistério que risca o céu."
    if any(w in p for w in ["o que é um meteoro", "o que e um meteoro", "meteoro", "meteorito", "estrela cadente"]):
        return "Meteoro, brow, é um pedaço de rocha do espaço que entra na atmosfera e queima, virando um risco de luz — a famosa 'estrela cadente'. Se chega ao chão, vira meteorito. Fato livre. Tem chuva de meteoros em certas épocas. Pedir desejo na estrela cadente é tradição."
    if any(w in p for w in ["o que é um asteroide", "o que e um asteroide", "asteroide", "asteróide", "asteroides"]):
        return "Asteroide, brow, é uma rocha menor que um planeta que orbita o Sol, muitos no cinturão entre Marte e Júpiter. Fato livre. O impacto de um grande asteroide ajudou a extinguir os dinossauros. Cientistas monitoram os perigosos. Pequenos mundos que contam a história do sistema solar."
    if any(w in p for w in ["o que é a nebulosa", "o que e a nebulosa", "nebulosa", "nuvem no espaço"]):
        return "Nebulosa, brow, é uma nuvem gigante de gás e poeira no espaço: muitas vezes é o 'berçário' onde nascem estrelas. Fato livre. As fotos delas são lindas e coloridas (telescópio Hubble). Nebulosa é poesia cósmica — fábrica de estrelas no meio do escuro."
    if any(w in p for w in ["o que é a constelação", "o que e a constelacao", "constelação", "constelacao", "signo"]):
        return "Constelação, brow, é um grupo de estrelas que os antigos ligaram formando figuras: Órion, Cruzeiro do Sul (visível no Brasil), Ursa Maior. Fato livre. Ajudaram a navegar e marcar estações. Hoje os 'signos' vêm de constelações. O céu é um mapa cheio de histórias."
    if any(w in p for w in ["o que é uma estrela", "o que e uma estrela", "estrela", "estrelas", "por que as estrelas brilham"]):
        return "Estrela, brow, é uma bola gigante de gás quente que gera energia por fusão (como o Sol): por isso brilha. Existem bilhões de estrelas, de cores e tamanhos diferentes. Fato livre. Quando vemos uma, vemos o passado (a luz demora a chegar). Estrela é sol de outro sistema."
    if any(w in p for w in ["o que é o universo", "o que e o universo", "universo", "o que é universo"]):
        return "Universo, brow, é tudo o que existe: matéria, energia, espaço, tempo, bilhões de galáxias. Nasceu no Big Bang há ~13,8 bilhões de anos e continua se expandindo. Fato livre. Somos uma pequena parte imensa. Estudar o universo é a maior viagem da mente humana."
    if any(w in p for w in ["o que é o big bang", "o que e o big bang", "big bang", "origem do universo"]):
        return "O Big Bang, brow, é a teoria de que o universo começou de um ponto denso e se expandiu há ~13,8 bilhões de anos: criou espaço, tempo, matéria e energia. Fato livre. Tudo que existe veio daí. Não foi 'explosão' no centro — foi o início do próprio tudo."
    if any(w in p for w in ["o que é a matéria escura", "matéria escura", "materia escura", "energia escura"]):
        return "Matéria escura, brow, é uma substância misteriosa que não vemos mas que existe: ela tem gravidade e segura as galáxias, sendo ~27% do universo. A energia escura (~68%) faz o universo acelerar. Fato livre. Não brilha nem absorve luz. A maior parte do universo é invisível pra gente."
    if any(w in p for w in ["o que é um buraco de minhoca", "buraco de minhoca", "wormhole", "buraco de verme"]):
        return "Buraco de minhoca, brow, é uma ideia teórica de 'atalho' no espaço-tempo: ligaria dois pontos distantes do universo. Fato livre. É especulação da física (Einstein-Rosen) e muito usado em ficção científica. Por enquanto é teoria — viagem no tempo ainda é sonho de filme."
    if any(w in p for w in ["o que é a vida", "o que e a vida", "vida", "o que é vida", "sentido da vida"]):
        if "escravid" in p or "escravo" in p or "escravos" in p:
            pass
        else:
            return "A vida, brow, é o que distingue os seres vivos: nascer, crescer, se reproduzir, sentir e morrer. No planeta, a vida existe em formas incríveis. Fato livre. O sentido da vida cada um constrói: amor, propósito, conexão. A vida é curta — vive com intensidade e bondade."
    if any(w in p for w in ["o que é um ser vivo", "o que e um ser vivo", "ser vivo", "seres vivos", "o que é ser vivo"]):
        return "Ser vivo, brow, é algo que nasce, se alimenta, cresce, se reproduz e responde ao ambiente: animais, plantas, fungos, bactérias. Fato livre. O vírus é um caso de fronteira (precisa de outro ser pra viver). A vida se adapta a tudo, do gelo ao vulcão."
    if any(w in p for w in ["o que é a célula", "o que e a celula", "célula", "celula", "células"]):
        return "Célula, brow, é a menor unidade da vida: todo ser vivo é feito de células, trilhões no nosso corpo. Tem a membrana, o núcleo (com o DNA) e organelas que trabalham. Fato livre. O corpo humano tem células de muitos tipos. A célula é o tijolinho da vida."
    if any(w in p for w in ["o que é o dna", "o que e o dna", "dna", "dna humano", "o que é dna"]):
        return "DNA, brow, é o 'manual' da vida: molécula que guarda as instruções de como cada ser se forma, em dupla hélice. Fato livre. Metade vem do pai, metade da mãe. Cada pessoa tem DNA único. A ciência do DNA mudou a medicina e a genética. Você é um código único."
    if any(w in p for w in ["o que é um gene", "o que e um gene", "gene", "genes", "genética"]):
        return "Gene, brow, é um trecho do DNA que carrega uma informação, como a cor dos olhos: os genes formam o genoma, o conjunto de instruções. Fato livre. Herdamos genes dos pais. A genética explica muito de quem somos. Compreender os genes é o futuro da saúde."
    if any(w in p for w in ["o que é a evolução", "o que e a evolucao", "evolução", "evolucao", "darwin"]):
        return "Evolução, brow, é como as espécies mudam ao longo do tempo por seleção natural (Darwin): os que se adaptam melhor sobrevivem e passam seus genes. Fato livre. É a base da biologia moderna, comprovada por fósseis e DNA. Não é 'evolui sozinho' — é adaptação ao ambiente."
    if any(w in p for w in ["o que é um fóssil", "o que e um fossil", "fóssil", "fossil", "fósseis"]):
        return "Fóssil, brow, é o resto ou marca de um ser vivo preservado em rocha por milhares ou milhões de anos: dinossauros, conchas, dentes. Fato livre. Fósseis contam a história da vida na Terra. Paleontólogos os estudam. Cada fóssil é uma página do livro da evolução."
    if any(w in p for w in ["o que é um dinossauro", "o que e um dinossauro", "dinossauro", "dinossauros", "rex"]):
        return "Dinossauro, brow, é o réptil gigante que dominou a Terra há milhões de anos e foi extinto há ~66 milhões de anos (impacto de asteroide). O T-Rex é o mais famoso. Fato livre. Aves são os parentes vivos deles. Museus têm esqueletos gigantes. Fascínio que não morre."
    if any(w in p for w in ["o que é a paleontologia", "paleontologia", "paleontólogo", "estudo dos fósseis"]):
        return "Paleontologia, brow, é a ciência que estuda os fósseis pra entender a vida do passado: dinossauros, plantas e criaturas antigas. Fato livre. Mistura biologia e geologia. O Brasil tem sítios fósseis importantes. Cada descoberta reescreve a história da Terra."
    if any(w in p for w in ["o que é um vulcão em erupção", "o que e um vulcao em erupcao", "lava", "magma"]):
        return "Lava, brow, é a rocha derretida que sai do vulcão: no interior da Terra ela se chama magma; na superfície, lava. Pode chegar a mais de 1.000°C. Fato livre. Cria terras novas (ilhas) e fertiliza o solo. Respeito total: é a força viva do planeta."
    if any(w in p for w in ["o que é um oceano", "o que e um oceano", "oceano", "oceanos", "quantos oceanos"]):
        return "Oceano, brow, é a grande massa de água salgada que cobre ~71% da Terra: Pacífico, Atlântico, Índico, Ártico e Antártico. Fato livre. O Pacífico é o maior e mais profundo. O oceano regula o clima e abriga a maior parte da vida. É o coração azul do planeta."
    if any(w in p for w in ["o que é uma ilha", "o que e uma ilha", "ilha", "ilhas", "arquipélago"]):
        return "Ilha, brow, é terra cercada de água por todos os lados: do pequeno rochedo ao continente-ilha (Austrália, Groenlândia). Fato livre. Arquipélago é um grupo delas. As ilhas têm ecossistemas únicos (animais que só existem lá). Pedaços de terra no meio do mar, cheios de vida."

    # ═══════════════════════════════════════════════════════════
    # MAIS ECONOMIA, FINANÇAS PESSOAIS E TRABALHO (fatos livres)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que é a economia", "o que e a economia", "economia", "o que é economia"]):
        return "Economia, brow, é o estudo de como as pessoas e países produzem, distribuem e usam recursos e dinheiro. Fato livre. Está em tudo: preço, salário, imposto, mercado. Entender economia ajuda a cuidar do bolso e do país. Economia é a ciência das escolhas."
    if any(w in p for w in ["o que é a inflação", "o que e a inflacao", "inflação", "inflacao", "preços subindo"]):
        return "Inflação, brow, é o aumento geral dos preços: com ela, seu dinheiro compra menos com o tempo. Fato livre. O governo mede por índices (IPCA) e usa juros pra controlar. Inflação alta corrói o poder de compra. Saber dela é proteger o orçamento."
    if any(w in p for w in ["o que é a taxa de juros", "taxa de juros", "juros", "o que são juros", "selic"]):
        return "Juros, brow, é o preço do dinheiro no tempo: quem empresta ganha juros; quem deve paga. A Selic é a taxa básica do Brasil, que influencia tudo. Fato livre. Juros compostos (juros sobre juros) podem ser aliado (investir) ou vilão (dívida). Entender juros é entender dinheiro."
    if any(w in p for w in ["o que é um imposto", "o que e um imposto", "imposto", "impostos", "o que é imposto"]):
        return "Imposto, brow, é o dinheiro que o cidadão e as empresas pagam ao governo, usado em saúde, escola, estrada e serviços. Fato livre. No Brasil tem impostos em várias camadas (federal, estadual, municipal). Saber o que se paga é cidadania e fiscalização."
    if any(w in p for w in ["o que é o dinheiro", "o que e o dinheiro", "dinheiro", "o que é dinheiro", "o que é o dinheiro"]):
        return "Dinheiro, brow, é um meio de troca: papel ou moeda que todos aceitam em troca de bens e serviços. Fato livre. Antes dele, existia escambo (troca). Hoje tem o digital (cartão, pix, cripto). Dinheiro é ferramenta — não é o objetivo, é meio. Cuide dele, mas não viva por ele."
    if any(w in p for w in ["o que é o pix", "o que e o pix", "pix", "o que é pix"]):
        return "Pix, brow, é o pagamento instantâneo do Brasil, criado pelo Banco Central (2020): transfere em segundos, 24h por dia, sem custo pra pessoa física. Fato livre. Virou febre nacional e até internacional. Chave Pix é o identicador (CPF, e-mail, celular). Prático, mas cuidado com golpe."
    if any(w in p for w in ["o que é um banco", "o que e um banco", "banco", "bancos", "o que é banco"]):
        return "Banco, brow, é a instituição que guarda dinheiro, empresta e move pagamentos. Fato livre. Tem bancos grandes e os digitais (mais baratos). O Banco Central regula tudo. Seu dinheiro no banco tem garantia até um limite (FGC). Escolher banco com custo baixo é inteligência."
    if any(w in p for w in ["o que é uma conta bancária", "conta bancária", "conta bancaria", "conta no banco", "conta corrente"]):
        return "Conta bancária, brow, é onde seu dinheiro fica no banco: tem a corrente (movimento do dia a dia) e a poupança (guardar). Fato livre. Hoje abrir conta é rápido, até pelo celular. Acompanhe o saldo e evite tarifas desnecessárias. Sua conta, seu controle."
    if any(w in p for w in ["o que é um cartão de crédito", "cartão de crédito", "cartao de credito", "cartão"]):
        return "Cartão de crédito, brow, é um limite de compra que você paga depois, com juros se atrasar. Fato livre. Útil e perigoso: o juro do rotativo é dos mais caros do mundo. Dica: use com controle e pague a fatura inteira no vencimento. Crédito é ferramenta, não renda."
    if any(w in p for w in ["o que é um empréstimo", "o que e um emprestimo", "empréstimo", "emprestimo", "pegar dinheiro"]):
        return "Empréstimo, brow, é dinheiro que você pega pra pagar depois, com juros. Fato livre. Serve pra emergência ou investimento, mas o juro pode virar bola de neve. Dica: compare taxas, leia o contrato e só peça o necessário. Dívida controlada é ok; descontrolada sufoca."
    if any(w in p for w in ["o que é a poupança", "o que e a poupanca", "poupança", "poupanca", "guardar dinheiro"]):
        return "Poupança, brow, é o jeito mais tradicional de guardar dinheiro no Brasil: rende pouco, mas é segura e sem custo. Fato livre. É bom começo pra criar o hábito de guardar. Pra render mais, existem outros investimentos. O importante é começar a guardar, mesmo pouco."
    if any(w in p for w in ["o que é o tesouro direto", "tesouro direto", "tesouro selic", "tesouro"]):
        return "Tesouro Direto, brow, é quando você empresta dinheiro pro governo (compra título público): é considerado investimento seguro e rende melhor que poupança. Fato livre. O Tesouro Selic é o mais simples. Dá pra começar com pouco. Investir é fazer o dinheiro trabalhar pra você."
    if any(w in p for w in ["o que é uma ação", "o que e uma acao", "ação na bolsa", "acoes", "ações"]):
        return "Ação, brow, é um pedacinho de uma empresa na bolsa: quem compra vira sócio e ganha se a empresa crescer (ou perde se cair). Fato livre. É investimento de mais risco que renda fixa. Exige estudo e paciência. Dinheiro em ação é pra longo prazo. Educação financeira primeiro."
    if any(w in p for w in ["o que é a bolsa de valores", "bolsa de valores", "bolsa", "o que e a bolsa"]):
        return "Bolsa de valores, brow, é o mercado onde se compra e vende ações de empresas: no Brasil é a B3. Fato livre. Milhões de brasileiros investem por app. É lugar de risco e oportunidade. Com informação e paciência, vira aliada. Sem educação, vira cassino. Estude antes."
    if any(w in p for w in ["o que é a criptomoeda", "criptomoeda", "cripto", "bitcoin", "bitcoin"]):
        return "Criptomoeda, brow, é dinheiro digital com criptografia, sem banco central: o bitcoin é a mais famosa. Fato livre. Funciona por blockchain (registro compartilhado). É volátil e arriscada, mas virou fenômeno. Só invista o que pode perder e estude muito. Cripto é futuro e também furada — cuidado."
    if any(w in p for w in ["o que é o blockchain", "o que e o blockchain", "blockchain", "cadeia de blocos"]):
        return "Blockchain, brow, é um registro digital compartilhado e seguro, onde cada bloco de dados se liga ao anterior: difícil de adulterar. Fato livre. É a base das criptomoedas. Também serve pra rastrear produtos e contratos. Uma revolução de transparência e confiança digital."
    if any(w in p for w in ["o que é o salário", "o que e o salario", "salário", "salario", "o que é salario"]):
        return "Salário, brow, é a remuneração pelo trabalho: pode ser mensal, por hora, por dia. Fato livre. Tem o salário mínimo (valor base garantido por lei) e o que cada empresa paga. Negociar bem e saber teus direitos (FGTS, férias, 13º) é essencial. Trabalho digno merece salário justo."
    if any(w in p for w in ["o que é o 13º", "o que e o 13", "decimo terceiro", "décimo terceiro", "13o"]):
        return "O 13º salário, brow, é uma gratificação anual do trabalhador brasileiro, paga em duas parcelas no fim do ano (lei desde 1962). Fato livre. É um 'presente' do final de ano que ajuda nas contas. Quem trabalhou o ano todo tem direito proporcional. Direito trabalhista brasileiro."
    if any(w in p for w in ["o que são as férias", "o que sao as ferias", "férias", "ferias", "o que é ferias"]):
        return "Férias, brow, é o direito de descanso do trabalhador após 12 meses de trabalho: geralmente 30 dias, com acréscimo de 1/3 do salário. Fato livre. Descansar não é luxo, é necessidade e lei. Quem descansa, rende mais. Tire suas férias de verdade, sem culpa."
    if any(w in p for w in ["o que é o home office", "home office", "trabalho remoto", "trabalhar de casa", "remoto"]):
        return "Home office, brow, é trabalhar de casa em vez do escritório: cresceu muito e virou realidade pra milhões. Fato livre. Vantagens: tempo e flexibilidade. Desafios: disciplina e separar trabalho de descanso. Quem sabe se organizar, rende muito. O futuro do trabalho tem mais home office."
    if any(w in p for w in ["o que é um freelancer", "freelancer", "freela", "trabalho autônomo", "bico"]):
        return "Freelancer, brow, é quem trabalha por conta, vendendo serviço por projeto: designer, redator, dev, e muito mais. Fato livre. Tem liberdade e também instabilidade. Dica: faça um bom portfólio, cobre justo e se organize. Autônomo é dono do próprio tempo — e do próprio risco."

    # ═══════════════════════════════════════════════════════════
    # MAIS TECNOLOGIA, INTERNET E SEGURANÇA DIGITAL (fatos livres)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que é um vírus de computador", "o que e um virus de computador", "vírus de computador", "virus de computador", "malware"]):
        return "Vírus de computador, brow, é um programa malicioso que infecta seu aparelho pra roubar dados, travar ou controlar. O malware é a categoria geral. Fato livre. Cuidado com e-mail suspeito, link estranho e download pirata. Dica: antivírus atualizado, senha forte e bom senso. Defesa começa em você."
    if any(w in p for w in ["o que é um trojan", "trojan", "cavalo de troia", "cavalo de tróia"]):
        return "Trojan (cavalo de Troia), brow, é um malware que se disfarça de programa inofensivo pra entrar no seu sistema: quando você roda, ele se ativa e rouba/controla. Fato livre. O nome vem da história de Troia. Não instale programa de fonte duvidosa. Desconfie do 'grátis' demais."
    if any(w in p for w in ["o que é um ransomware", "ransomware", "sequestro de dados"]):
        return "Ransomware, brow, é um malware que sequestra seus arquivos (criptografa) e cobra resgate pra liberar. Fato livre. Golpe sério que atinge até empresas grandes. Dica: backup sempre (nuvem ou disco), atualizações e não pague resgate sem orientação (não garante nada). Prevenir é tudo."
    if any(w in p for w in ["o que é phishing", "phishing", "pescaria", "golpe de email"]):
        return "Phishing, brow, é o golpe que 'pesca' seus dados: mensagem fake que se passa por banco, loja ou governo, pedindo senha ou pagamento. Fato livre. Dica: confere o remetente, não clica em link suspeito e não passa dados por mensagem. Banco nunca pede senha. Desconfiar é a defesa."
    if any(w in p for w in ["o que é uma senha forte", "senha forte", "senha segura", "senha fraca", "criar senha"]):
        return "Senha forte, brow, é longa e difícil de adivinhar: mistura letras, números e símbolos, e não repete entre sites. Fato livre. Evita nome, data e '123456'. Dica: use frase-longa (ex: 'caf3-com-leit3!') e um gerenciador de senhas. Senha boa é o cadeado da tua vida digital."
    if any(w in p for w in ["o que é a verificação em duas etapas", "verificação em duas etapas", "verificacao em duas etapas", "dois fatores", "2fa"]):
        return "Verificação em duas etapas (2FA), brow, é aquele segundo passo de segurança além da senha: um código no celular, biometria ou app. Fato livre. Se alguém roubar tua senha, ainda precisa do segundo fator. Ative em tudo que for importante. Dobro de segurança, dobro de paz."
    if any(w in p for w in ["o que é uma vpn", "o que e uma vpn", "vpn", "vpn"]):
        return "VPN, brow, é um túnel criptografado que esconde seu tráfego e muda sua localização: útil pra privacidade e acessar conteúdo. Fato livre. Cuidado: VPN grátis vende seus dados. Escolha uma confiável paga. VPN protege em Wi-Fi público. Privacidade é um direito, não luxo."
    if any(w in p for w in ["o que é um firewall", "o que e um firewall", "firewall"]):
        return "Firewall, brow, é o 'porteiro' da rede: filtra o que entra e sai do seu sistema, bloqueando ameaças. Fato livre. Vem embutido no sistema e nos roteadores. É a primeira muralha de defesa. Junto com antivírus e atualização, forma a base da segurança digital."
    if any(w in p for w in ["o que é um antivírus", "o que e um antivírus", "antivirus", "antivírus", "o que é antivirus"]):
        return "Antivírus, brow, é o programa que detecta e remove ameaças (vírus, malware) do seu aparelho. Fato livre. Os sistemas já têm proteção embutida (ex: Defender). Dica: mantenha atualizado e faça varreduras. Mas nenhum antivírus salva de clique burro — bom senso é o melhor firewall."
    if any(w in p for w in ["o que é um backup", "o que e um backup", "backup", "copia de segurança", "copiar arquivos"]):
        return "Backup, brow, é a cópia de segurança dos seus arquivos: se o aparelho quebrar, for roubado ou pegar vírus, você não perde tudo. Fato livre. Regra 3-2-1: 3 cópias, em 2 mídias diferentes, 1 fora de casa (nuvem). Backup não é opção — é obrigação."
    if any(w in p for w in ["o que é o armazenamento em nuvem", "armazenamento em nuvem", "armazenar na nuvem", "salvar na nuvem"]):
        return "Armazenamento em nuvem, brow, é guardar arquivos em servidores da internet, acessíveis de qualquer aparelho: Google Drive, OneDrive, iCloud. Fato livre. Prático e seguro se a conta for bem protegida (senha forte + 2FA). Cuidado com o que você sobe: dados sensíveis, criptografe antes."
    if any(w in p for w in ["o que é um navegador", "o que e um navegador", "navegador", "browser", "google chrome"]):
        return "Navegador (browser), brow, é o programa que abre sites: Chrome, Firefox, Edge, Safari. Fato livre. Ele 'traduz' a internet em páginas que você vê. Mantenha atualizado (corrige falhas) e use extensões de bloqueio. O navegador é tua janela pro mundo online."
    if any(w in p for w in ["o que é um site", "o que e um site", "site", "website", "página web"]):
        return "Site, brow, é uma página ou conjunto delas na internet, acessível por um endereço (URL): blog, loja, portal. Fato livre. Feitos com HTML, CSS e programação. Hoje qualquer um pode criar com plataformas prontas. Um site é a vitrine de uma ideia, negócio ou pessoa."
    if any(w in p for w in ["o que é um aplicativo", "o que e um aplicativo", "aplicativo", "app", "apps"]):
        return "Aplicativo (app), brow, é um programa feito pra celular ou computador, com função específica: WhatsApp, banco, jogo, edição. Fato livre. A gente vive de apps hoje. Baixar só de loja oficial reduz risco. Um bom app resolve um problema na palma da mão."
    if any(w in p for w in ["o que é a inteligência artificial", "o que e a inteligencia artificial", "inteligência artificial", "inteligencia artificial", "o que é ia"]):
        return "Inteligência Artificial (IA), brow, é a tecnologia que faz máquinas aprenderem e realizarem tarefas inteligentes: reconhecer voz, traduzir, gerar texto, dirigir. Fato livre. Eu sou uma IA! Ela aprende com dados e treinamento. É a tecnologia que mais muda o mundo hoje. Futuro que já chegou."
    if any(w in p for w in ["o que é um robô", "o que e um robo", "robô", "robo", "robótica"]):
        return "Robô, brow, é uma máquina que executa tarefas, físicas ou digitais: na fábrica, na cozinha, ou um bot de conversa. Fato livre. A robótica une mecânica, eletrônica e programação. De braço de montadora a aspirador, robô já está na vida real. E eu sou meio robô também (digital)."
    if any(w in p for w in ["o que é a realidade virtual", "realidade virtual", "realidade aumentada", "rv", "vr"]):
        return "Realidade virtual (VR), brow, é mergulhar num mundo digital com óculos especiais; a aumentada (AR) mistura o digital com o real (ex: filtros). Fato livre. Cresceram em games, treinamento e compras. Tecnologia que transporta. O futuro será cada vez mais misturado."
    if any(w in p for w in ["o que é o metaverso", "o que e o metaverso", "metaverso", "meta versos"]):
        return "Metaverso, brow, é a ideia de um mundo virtual compartilhado, onde as pessoas interagem com avatares: 3D, jogos, reuniões, comércio. Fato livre. Ainda em construção e muito hype. Potencial gigante, mas precisa evoluir. Cuidado com as apostas de dinheiro. É futuro prometido, presente em partes."
    if any(w in p for w in ["o que é a nanotecnologia", "nanotecnologia", "nano tecnologia", "nanopartícula"]):
        return "Nanotecnologia, brow, é manipular matéria em escala minúscula (nanômetros — bilionésimo de metro): cria materiais e remédios inovadores. Fato livre. Usada em medicina, eletrônica e energia. Cientistas constroem estruturas menores que célula. O futuro se constrói no tamanho minúsculo."
    if any(w in p for w in ["o que é a energia renovável", "energia renovável", "energia renovavel", "energia limpa", "energia verde"]):
        return "Energia renovável, brow, vem de fontes que não acabam: sol (solar), vento (eólica), água (hídrica), biomassa. Fato livre. Poluem pouco e lutam contra o aquecimento global. O Brasil já é forte em hidrelétrica e cresce em eólica e solar. O futuro da energia é limpo e nosso."
    if any(w in p for w in ["o que é a energia solar", "energia solar", "painel solar", "placa solar", "energia do sol"]):
        return "Energia solar, brow, transforma a luz do Sol em eletricidade com painéis fotovoltaicos: limpa, silenciosa e cada vez mais barata. Fato livre. O Brasil tem sol o ano todo e cresce muito em solar. Dá até pra vender o excesso. Custo inicial alto, mas economia depois. Sol é energia grátis."
    if any(w in p for w in ["o que é a energia eólica", "energia eólica", "energia eolica", "aerogerador", "catavento"]):
        return "Energia eólica, brow, usa o vento pra gerar eletricidade com turbinas (aerogeradores): limpa e cada vez mais comum no mundo. Fato livre. O Brasil, principalmente o Nordeste, tem ótimos ventos e cresce muito nisso. Vento que antes era vento, agora é energia. O vento trabalha pra gente."

    # ═══════════════════════════════════════════════════════════
    # MAIS IDIOMAS, CULTURA E COSTUMES DO MUNDO (fatos livres)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que é o inglês", "o que e o ingles", "idioma inglês", "lingua inglesa", "língua inglesa", "o que e ingles"]):
        return "O inglês, brow, é a língua mais usada do mundo nos negócios, internet e ciência: nasceu na Inglaterra e se espalhou. Fato livre. É a 'língua franca' global. Aprender inglês abre portas de trabalho, viagem e conhecimento. Comece com o básico e vá treinando todo dia."
    if any(w in p for w in ["o que é o espanhol", "o que e o espanhol", "idioma espanhol", "lingua espanhola", "o que e espanhol"]):
        return "O espanhol, brow, é uma das línguas mais faladas do mundo, presente na América Latina e Espanha: nasceu na região de Castela. Fato livre. O Brasil é cercado de países de espanhol — saber espanhol facilita muito. É língua de música, comida e calor humano. Vale aprender."
    if any(w in p for w in ["o que é o mandarim", "o que e o mandarim", "mandarim", "chines", "chinês", "idioma chinês"]):
        return "O mandarim, brow, é a língua mais falada do mundo por nativos: é o idioma oficial da China, com milhares de anos. Fato livre. Usa caracteres próprios e tons musicais (a mesma sílaba muda de sentido). A China cresce em poder e comércio. Mandarim é o idioma do futuro dos negócios."
    if any(w in p for w in ["o que é o francês", "o que e o frances", "idioma francês", "lingua francesa", "o que e frances"]):
        return "O francês, brow, é a língua da França, da arte e da diplomacia: falada na Europa, África e Canadá (Quebec). Fato livre. Berço de filósofos e da alta gastronomia. É chamada 'língua do amor'. Aprender francês é beleza, cultura e elegância. Paris já foi o centro do mundo."
    if any(w in p for w in ["o que é o alemão", "o que e o alemao", "idioma alemão", "lingua alemã", "o que e alemao"]):
        return "O alemão, brow, é a língua da Alemanha, Áustria e Suíça: famosa pelas palavras longas e pela precisão. Fato livre. Berço de filósofos, cientistas (Einstein, Kant) e da engenharia. Desafiadora de aprender, mas lógica e poderosa. Alemanha é potência europeia."
    if any(w in p for w in ["o que é o italiano", "o que e o italiano", "idioma italiano", "lingua italiana", "o que e italiano"]):
        return "O italiano, brow, é a língua da Itália, cheia de melodia e gestos: nasceu do latim, como o português. Fato livre. Terra de ópera, pizza e paixão. Falar italiano é quase cantar. Muitas palavras nossas vieram de lá. Língua do amor e da boa mesa."
    if any(w in p for w in ["o que é o japonês", "o que e o japones", "idioma japonês", "lingua japonesa", "o que e japones"]):
        return "O japonês, brow, é a língua do Japão, com três sistemas de escrita (kanji, hiragana, katakana): complexa e fascinante. Fato livre. Terra de mangá, tecnologia e tradição. Aprender japonês é entrar numa cultura de respeito e disciplina. Difícil, mas gratificante. Japão é outro mundo."
    if any(w in p for w in ["o que é o árabe", "o que e o arabe", "idioma árabe", "lingua árabe", "o que e arabe"]):
        return "O árabe, brow, é a língua do mundo árabe, falada no Oriente Médio e norte da África: escrita da direita pra esquerda. Fato livre. É a língua do Alcorão e de uma rica cultura de poesia e matemática (os números que usamos vieram daí). Língua de tradição e grandeza."
    if any(w in p for w in ["o que é o russo", "o que e o russo", "idioma russo", "lingua russa", "o que e russo"]):
        return "O russo, brow, é a língua da Rússia e de parte da Europa Oriental: usa o alfabeto cirílico e tem literatura gigante (Tolstói, Dostoiévski). Fato livre. Terra de ballet, xadrez e ciência (Gagarin). Aprender russo é desafiador e fascinante. Rússia é um mundo à parte."
    if any(w in p for w in ["o que é o hindi", "o que e o hindi", "idioma hindi", "lingua hindi", "o que e hindi"]):
        return "O hindi, brow, é uma das línguas mais faladas do mundo, da Índia: terra de Bollywood, especiarias e milhões de falantes. Fato livre. A Índia tem muitas línguas, e o hindi é uma das principais. Língua de uma civilização milenar. Aprender hindi é conhecer um gigante cultural."
    if any(w in p for w in ["o que é o tupi", "o que e o tupi", "tupi", "lingua tupi", "tupi-guarani"]):
        return "O tupi, brow, é a língua dos povos indígenas que viviam no litoral do Brasil: influenciou nosso português com palavras como 'carioca', 'pipoca', 'tatu' e 'mandioca'. Fato livre. O tupi-guarani é uma família de línguas. Nossa cultura tem raiz indígena forte. Respeito e memória aos primeiros habitantes."
    if any(w in p for w in ["o que é a cultura japonesa", "cultura japonesa", "japoneses", "costumes do japão"]):
        return "A cultura japonesa, brow, é cheia de respeito, disciplina e beleza: chá, bonsai, cerimônias, samurais, anime e tecnologia. Fato livre. Valorizam a harmonia e o trabalho. O Japão mistura tradição milenar com futuro. Admirada no mundo todo. Cultura que encanta."
    if any(w in p for w in ["o que é a cultura indígena", "cultura indígena", "cultura indigena", "povos indígenas", "indígenas"]):
        return "A cultura indígena, brow, é a riqueza dos povos originários: línguas, danças, arte, conhecimento da natureza e espiritualidade. Fato livre. O Brasil tem centenas de povos e línguas indígenas. Muito do nosso jeito e comida veio deles. Respeitar e proteger os indígenas é honrar a raiz do Brasil."
    if any(w in p for w in ["o que é o sotaque", "o que e o sotaque", "sotaque", "sotaques", "sotaque brasileiro"]):
        return "Sotaque, brow, é o jeito de falar de cada região: a mesma língua soa diferente em cada lugar. Fato livre. O Brasil tem sotaques lindos: nordestino, gaúcho, carioca, paulista, mineiro. Sotaque é identidade e orgulho. Nenhum é melhor que outro — todos são riqueza. Fala com orgulho do teu."
    if any(w in p for w in ["o que é a etiqueta", "o que e a etiqueta", "etiqueta", "boas maneiras", "bons modos"]):
        return "Etiqueta, brow, são os modos e regras de convivência: dizer obrigado, pedir por favor, respeitar espaço e hora. Fato livre. Cada país tem a sua (na Ásia tira o sapato, na Europa beija no rosto). Etiqueta é respeito disfarçado de regra. Boa convivência começa nos pequenos gestos."
    if any(w in p for w in ["o que é o feriado", "o que e o feriado", "feriado", "feriados", "dia feriado"]):
        return "Feriado, brow, é um dia de celebração ou descanso oficial: nacional, estadual ou municipal. Fato livre. Tem os religiosos (Natal, Páscoa), os cívicos (Independência, Proclamação) e os culturais. Cada país tem os seus. Feriado é tempo de descansar, celebrar e lembrar o que importa."
    if any(w in p for w in ["o que é uma tradição", "o que e uma tradicao", "tradição", "tradicao", "costumes"]):
        return "Tradição, brow, é o que se passa de geração em geração: festa, comida, crença, jeito de fazer. Fato livre. Une família e comunidade e guarda memória. Mas tradição também evolui — o que faz sentido continua, o que não, se transforma. Respeitar a tradição é respeitar a história viva."
    if any(w in p for w in ["o que é o patrimônio histórico", "patrimônio histórico", "patrimonio historico", "patrimônio cultural", "patrimonio"]):
        return "Patrimônio histórico, brow, são os bens que guardam a memória de um povo: igrejas, prédios, obras, ruínas, manifestações. Fato livre. O Brasil tem lugares tombados (Ouro Preto, Pelourinho). O patrimônio conta quem a gente foi. Proteger patrimônio é proteger a identidade de todos."
    if any(w in p for w in ["o que é o museu", "o que e o museu", "museu", "museus", "museu nacional"]):
        return "Museu, brow, é a casa que guarda e mostra história, arte e ciência: objetos, obras e memórias de um povo. Fato livre. Tem de tudo: arte, fósseis, carros, brinquedos. O Brasil tem museus incríveis (MASP, Museu Nacional). Museu é janela pro passado e pro conhecimento. Vale muito visitar."
    if any(w in p for w in ["o que é a exposição", "o que e a exposicao", "exposição", "exposicao", "mostra de arte"]):
        return "Exposição, brow, é a mostra pública de algo pro público ver: obras de arte, fotos, produtos, tecnologia. Fato livre. Museus e galerias vivem de exposições. Ver arte ao vivo é experiência que foto não substitui. Exposição é cultura aberta a todos. Apreciar é aprender."
    if any(w in p for w in ["o que é uma feira de ciências", "feira de ciências", "feira de ciencias", "feira cultural"]):
        return "Feira de ciências, brow, é o evento onde estudantes mostram experimentos e projetos: aprendizado na prática, com criatividade. Fato livre. Acontece em escola, cidade e até competições mundiais. Lá nascem grandes cientistas e inventores. Curiosidade e mão na massa. Cientista de verdade começa curioso."

    # ═══════════════════════════════════════════════════════════
    # MAIS CARREIRA, EMPREGO E EMPREENDEDORISMO (fatos livres)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["como fazer um currículo", "como fazer um curriculo", "currículo", "curriculo", "o que é um currículo"]):
        return "Currículo, brow, é teu cartão de visita pra vaga: uma página com seus dados, formação, experiência e habilidades. Fato livre. Dica: objetivo claro, verbos de ação, números (ex: 'aumentei vendas em 30%'), sem erros de português. Capricho e sinceridade. Currículo bom abre a porta da entrevista."
    if any(w in p for w in ["o que é uma entrevista de emprego", "entrevista de emprego", "entrevista de trabalho", "como passar numa entrevista"]):
        return "Entrevista de emprego, brow, é o papo entre candidato e empresa pra ver se dá certo: momento de mostrar quem você é. Fato livre. Dica: pesquise a empresa, chegue cedo, vista-se bem, ouça mais que fale, e pergunte no final. Tranquilidade e sinceridade vencem. Nervosismo é normal — respira."
    if any(w in p for w in ["o que é um estágio", "o que e um estagio", "estágio", "estagio", "estagiário"]):
        return "Estágio, brow, é o primeiro passo profissional: estudante que aprende na prática, com acompanhamento e carga menor. Fato livre. Muitas vezes rende bolsa e, às vezes, contratação depois. Estágio vale por experiência e aprendizado. Aproveita pra absorver tudo. Todo profissional começou estagiando."
    if any(w in p for w in ["o que é uma jovem aprendiz", "jovem aprendiz", "menor aprendiz", "aprendiz"]):
        return "Jovem Aprendiz, brow, é o programa que dá o primeiro emprego a jovens de 14 a 24 anos, com curso profissionalizante junto: as empresas contratam e ensinam. Fato livre. Ótima porta de entrada pro mercado. Tem direitos (salário, FGTS). Jovem que aproveita aprendiz sai na frente. Primeiro emprego começa aqui."
    if any(w in p for w in ["o que é o empreendedorismo", "empreendedorismo", "empreendedor", "empreender", "abrir um negócio"]):
        return "Empreendedorismo, brow, é criar e tocar o próprio negócio: identificar uma oportunidade e fazer acontecer. Fato livre. Exige coragem, planejamento e resiliência. Nem todo mundo é feito pra isso, e tá tudo bem. Quem empreende resolve problema, assume risco e colhe resultado. Começar pequeno é começar certo."
    if any(w in p for w in ["o que é um plano de negócios", "plano de negócios", "plano de negocios", "business plan", "modelo de negócio"]):
        return "Plano de negócios, brow, é o mapa do teu empreendimento: o que vai vender, pra quem, quanto custa, como vender e quanto ganha. Fato livre. Organiza a ideia e evita erro. Tem resumo, mercado, concorrentes, finanças. Planejar antes evita prejuízo depois. Negócio bom começa no papel."
    if any(w in p for w in ["o que é o marketing", "o que e o marketing", "marketing", "marketing digital"]):
        return "Marketing, brow, é o conjunto de estratégias pra conectar um produto ou serviço às pessoas certas: estudar o público, divulgar, vender. Fato livre. Hoje o marketing digital (redes, anúncios, conteúdo) domina. Não é só propaganda — é entender e atender a necessidade. Quem conhece o cliente, vende."
    if any(w in p for w in ["o que é uma marca", "o que e uma marca", "marca", "branding", "identidade visual"]):
        return "Marca, brow, é a identidade de um produto, empresa ou pessoa: o nome, o logo, a cara e a reputação. Fato livre. Uma marca forte cria confiança e reconhecimento. Branding é construir essa imagem com consistência. Pense no teu nome como marca. Boa marca é lembrada e respeitada."
    if any(w in p for w in ["o que é o atendimento ao cliente", "atendimento ao cliente", "atendimento", "sac", "suporte"]):
        return "Atendimento ao cliente, brow, é o contato entre empresa e consumidor: tirar dúvida, resolver problema, vender. Fato livre. Bom atendimento fideliza — cliente bem tratado volta e indica. Dica: responder rápido, ouvir com atenção, resolver com sinceridade. Cliente feliz é o melhor anúncio. Educação vende."
    if any(w in p for w in ["o que é o trabalho em equipe", "trabalho em equipe", "trabalho em grupo", "equipe", "times"]):
        return "Trabalho em equipe, brow, é somar esforços pra um objetivo comum: cada um contribui com sua parte. Fato livre. Exige comunicação, respeito e confiança. Grande resultado raramente é individual. Saber ouvir, dividir e ajudar é habilidade valiosa no mercado. Time que se respeita vai longe."
    if any(w in p for w in ["o que é a liderança", "o que e a lideranca", "liderança", "lideranca", "como ser líder"]):
        return "Liderança, brow, é inspirar e guiar pessoas rumo a um objetivo: não é mandar, é servir e motivar. Fato livre. Bom líder ouve, dá exemplo, distribui crédito e assume responsabilidade. Nem todo líder é chefe, e nem todo chefe é líder. Liderar é fazer o time crescer junto. Respeito se conquista."
    if any(w in p for w in ["o que é uma startup", "o que e uma startup", "startup", "start ups"]):
        return "Startup, brow, é uma empresa nova e inovadora, que busca crescer rápido resolvendo um problema com tecnologia: de aplicativos a delivery. Fato livre. Começa pequena, mas quer escalar. Muitas quebram, algumas viram gigantes (as 'unicórnios'). Tem risco e tem ousadia. Inovação é o coração da startup."
    if any(w in p for w in ["o que é um pitch", "o que e um pitch", "pitch", "apresentação de negócio"]):
        return "Pitch, brow, é uma apresentação curta e impactante pra vender uma ideia ou negócio: normalmente 1 a 3 minutos. Fato livre. Muito usado pra atrair investidores e clientes. Dica: problema, solução, por que você, e o que precisa. Vai direto ao ponto com paixão. Pitch bom abre portas e bolsos."
    if any(w in p for w in ["o que é um investidor", "investidor", "investidores", "anjo investidor", "investimento anjo"]):
        return "Investidor, brow, é quem aplica dinheiro em negócios esperando retorno: pode ser pessoa (anjo), fundo ou banco. Fato livre. Em startup, o investidor compra participação pra empresa crescer. Mas nem toda ideia precisa de investidor — dá pra começar com pouco. Capital ajuda, mas execução decide."
    if any(w in p for w in ["o que é uma franquia", "franquia", "franqueado", "franqueador", "rede franqueada"]):
        return "Franquia, brow, é um negócio pronto pra replicar: você compra o direito de usar uma marca e modelo já testado (ex: lanchonetes, escolas). Fato livre. Menos risco que começar do zero, mas custa taxa e segue regras do dono. Franquia é pôr-se sob um guarda-chuva que já funciona."
    if any(w in p for w in ["o que é um freelancer", "o que e um freelancer", "freelancer", "freela", "trabalho freelance"]):
        return "Freelancer, brow, é quem trabalha por conta, vendendo serviço por projeto: designer, redator, dev, e muito mais. Fato livre. Tem liberdade e também instabilidade. Dica: faça um bom portfólio, cobre justo e se organize. Autônomo é dono do próprio tempo — e do próprio risco."
    if any(w in p for w in ["o que é a previdência social", "previdência social", "previdencia", "inss", "aposentadoria", "se aposentar"]):
        return "Previdência Social, brow, é o sistema que garante renda quando você não pode mais trabalhar (velhice, doença) — no Brasil é o INSS, financiado pelas contribuições. Fato livre. Quem contribui se aposenta. Dica: contribua desde cedo e acompanhe seu CNIS. Aposentadoria é plano pro futuro. Comece já."
    if any(w in p for w in ["o que é o contrato de trabalho", "contrato de trabalho", "carteira assinada", "carteira de trabalho", "clt"]):
        return "Contrato de trabalho, brow, é o acordo formal entre empregado e empregador, que define salário, função e direitos: no Brasil, a CLT e a carteira assinada dão proteção. Fato livre. Regras valem pros dois lados. Leia antes de assinar. Trabalho com registro é segurança e garantia de direitos."
    if any(w in p for w in ["o que é o salário", "o que e o salario", "salário", "salario", "remuneração", "salario minimo"]):
        return "Salário, brow, é a remuneração pelo trabalho: o pagamento que você recebe por mês, semana ou hora. Fato livre. No Brasil, existe o salário mínimo nacional, definido por lei. Dica: entenda seu salário líquido (depois de descontos) e negocie com base no valor que você entrega. Seu trabalho vale. Saiba seu valor."

    # ═══════════════════════════════════════════════════════════
    # MAIS CIÊNCIA, NATUREZA E O UNIVERSO (fatos livres)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que é a física", "o que e a fisica", "física", "fisica", "física quântica"]):
        return "Física, brow, é a ciência que estuda a matéria, energia, força e movimento: como o universo funciona. Fato livre. De queda da maçã (gravidade) à física quântica do mundo minúsculo. Isaac Newton e Einstein mudaram tudo. Física é a busca pelas leis da natureza."
    if any(w in p for w in ["o que é a química", "o que e a quimica", "química", "quimica", "reação química"]):
        return "Química, brow, é a ciência da matéria e suas transformações: o que as coisas são feitas e como reagem. Fato livre. Tudo é química — da água à comida, do remédio ao plástico. Mendeleiev criou a tabela periódica. Química é entender do que tudo é feito e como se transforma."
    if any(w in p for w in ["o que é a biologia", "o que e a biologia", "biologia", "seres vivos"]):
        return "Biologia, brow, é a ciência da vida: estuda os seres vivos — células, plantas, animais, humanos, ecossistemas. Fato livre. Darwin explicou a evolução. Da bactéria à baleia, tudo é vida. Biologia responde como a vida nasce, cresce e se adapta. Vida é a maior maravilha."
    if any(w in p for w in ["o que é a astronomia", "o que e a astronomia", "astronomia", "o que estuda a astronomia"]):
        return "Astronomia, brow, é a ciência que estuda o céu: estrelas, planetas, galáxias, buracos negros e o universo. Fato livre. Há mais de 100 bilhões de galáxias, cada uma com bilhões de estrelas. Galileu e Hubble olharam longe. Astronomia é a mais antiga e a mais grandiosa das ciências."
    if any(w in p for w in ["o que é a geologia", "o que e a geologia", "geologia", "rochas", "estudo da terra"]):
        return "Geologia, brow, é a ciência que estuda a Terra: rochas, minerais, terremotos, vulcões e a história do planeta. Fato livre. As camadas da Terra contam bilhões de anos. Os fósseis são registros do passado. Geologia descobre água, petróleo e minérios. Conhecer o chão que a gente pisa."
    if any(w in p for w in ["o que é a meteorologia", "o que e a meteorologia", "meteorologia", "previsão do tempo", "clima e tempo"]):
        return "Meteorologia, brow, é a ciência que estuda a atmosfera e prevê o tempo: chuva, sol, vento, tempestades. Fato livre. Usa satélites e modelos pra adivinhar o clima. Prever chuva salva vidas (enchentes, secas). 'Tempo' é hoje, 'clima' é a média de longo prazo. Difícil mas fascinante."
    if any(w in p for w in ["o que é a ecologia", "o que e a ecologia", "ecologia", "ecossistema", "meio ambiente"]):
        return "Ecologia, brow, é a ciência das relações entre os seres vivos e o ambiente: como tudo se conecta. Fato livre. Cada bicho, planta e rio fazem parte de um sistema. Floresta saudável, ar limpo. Preservar é cuidar da própria casa. Ecologia ensina que nada vive sozinho."
    if any(w in p for w in ["o que é a genética", "o que e a genetica", "genética", "genetica", "dna", "hereditariedade"]):
        return "Genética, brow, é a ciência que estuda a herança: como características passam de pais pra filhos pelo DNA. Fato livre. O DNA é a 'receita' da vida, em forma de dupla hélice. Gregor Mendel, monge, descobriu as leis básicas. Genética explica cor dos olhos e doenças hereditárias."
    if any(w in p for w in ["o que é a evolução", "o que e a evolucao", "evolução", "evolucao", "darwin", "seleção natural"]):
        return "Evolução, brow, é como a vida muda ao longo de gerações: espécies se adaptam e o mais apto sobrevive (seleção natural). Fato livre. Charles Darwin descreveu isso em 'A Origem das Espécies'. Todas as espécies têm um ancestral comum. Evolução é o motor da vida em constante mudança."
    if any(w in p for w in ["o que é o átomo", "o que e o atomo", "átomo", "atomo", "partículas"]):
        return "Átomo, brow, é a menor unidade da matéria: tem núcleo (prótons e nêutrons) e elétrons girando ao redor. Fato livre. Tudo é feito de átomos — você, o ar, a tela. Dentro dele há um universo quântico. A energia atômica é enorme. O átomo é o tijolo fundamental de tudo."
    if any(w in p for w in ["o que é a energia nuclear", "energia nuclear", "energia atômica", "energia atomica", "usina nuclear"]):
        return "Energia nuclear, brow, é a energia liberada do núcleo do átomo: pela fissão (quebrar) ou fusão (juntar). Fato livre. Usinas nucleares geram muita eletricidade com pouco combustível, mas geram lixo radioativo perigoso. Pode curar (medicina) ou destruir (bomba). Poder enorme exige responsabilidade."
    if any(w in p for w in ["o que é a luz", "o que e a luz", "luz", "luzes", "como a luz funciona"]):
        return "Luz, brow, é a radiação que nossos olhos enxergam: viaja a ~300 mil km por segundo e ilumina tudo. Fato livre. Einstein mostrou que a luz se curva e é a máxima velocidade do universo. Cores são luz em comprimentos diferentes. A luz vem do Sol e faz a vida acontecer."
    if any(w in p for w in ["o que é a energia elétrica", "energia elétrica", "energia eletrica", "eletricidade", "como funciona a energia"]):
        return "Energia elétrica, brow, é o fluxo de elétrons que move o mundo: acende lâmpada, liga motor, carrega celular. Fato livre. Gerada em usinas (hidrelétrica, solar, eólica, nuclear) e levada por fios. Sem eletricidade, a vida moderna para. Economize e use consciente. O mundo gira a eletricidade."
    if any(w in p for w in ["o que é a gravidade", "o que e a gravidade", "gravidade", "força da gravidade", "como a gravidade funciona"]):
        return "Gravidade, brow, é a força que puxa as coisas pra baixo e mantém planetas em órbita: tudo que tem massa atrai. Fato livre. Newton viu a maçã cair; Einstein explicou como a massa curva o espaço. É a gravidade que mantém os pés no chão. Força invisível que organiza o universo."
    if any(w in p for w in ["o que é um buraco negro", "buraco negro", "buracos negros", "buraco de minhoca"]):
        return "Buraco negro, brow, é uma região onde a gravidade é tão forte que nem a luz escapa: nasce de estrelas gigantes que colapsam. Fato livre. Tudo que chega perto é engolido. Até o tempo se distorce ali. A primeira foto foi tirada em 2019. Mistério fascinante do universo."
    if any(w in p for w in ["o que é uma galáxia", "o que e uma galaxia", "galáxia", "galaxia", "via láctea"]):
        return "Galáxia, brow, é um gigantesco agrupamento de estrelas, planetas, gás e poeira: a nossa é a Via Láctea, com centenas de bilhões de estrelas. Fato livre. Há mais de 100 bilhões de galáxias no universo. Cada uma é um mundo de mundos. Somos um pontinho num cosmos imenso."
    if any(w in p for w in ["o que é uma estrela", "o que e uma estrela", "estrela", "estrelas", "como nasce uma estrela"]):
        return "Estrela, brow, é uma gigantesca bola de gás que brilha pela fusão nuclear: o Sol é uma estrela. Fato livre. Nascem de nuvens de gás e vivem bilhões de anos. Quando morrem, podem virar buraco negro. As estrelas criam os elementos químicos. Somos feitos de poeira de estrela."
    if any(w in p for w in ["o que é um planeta", "o que e um planeta", "planeta", "planetas", "sistema solar"]):
        return "Planeta, brow, é um corpo que orbita uma estrela e não brilha com luz própria: o nosso Sistema Solar tem 8 (Mercúrio a Netuno). Fato livre. A Terra é o único com vida conhecida. Há planetas fora do Sistema Solar (exoplanetas). Cada planeta é um mundo único e fascinante."
    if any(w in p for w in ["o que é a atmosfera", "o que e a atmosfera", "atmosfera", "camadas da terra", "a camada de ar"]):
        return "Atmosfera, brow, é a camada de gases que envolve a Terra: nos protege do espaço, regula o clima e tem o ar que respiramos. Fato livre. Tem camadas (troposfera, estratosfera...). O ozônio nos protege do sol. Sem atmosfera, a vida não existiria. É nosso escudo invisível."
    if any(w in p for w in ["o que é a hidrosfera", "hidrosfera", "água da terra", "o ciclo da água"]):
        return "Hidrosfera, brow, é toda a água da Terra: oceanos, rios, lagos, geleiras e a água no ar. Fato livre. ~71% da superfície é água, mas só uma parte é doce e bebível. O ciclo da água (evapora, chove) mantém tudo. Água é vida. Preserve — sem água, nada sobrevive."
    if any(w in p for w in ["o que é a biosfera", "biosfera", "o onde vive a vida"]):
        return "Biosfera, brow, é a camada da Terra onde existe vida: do fundo do oceano ao topo das montanhas, tudo que vive. Fato livre. É onde a vida e o planeta se encontram. Desde bactérias a baleias. Proteger a biosfera é proteger nossa própria casa. Vida é o milagre da Terra."
    if any(w in p for w in ["o que é o movimento", "o que e o movimento", "movimento", "movimentos", "velocidade e movimento"]):
        return "Movimento, brow, é quando um corpo muda de lugar: você andando, a Terra girando, um carro correndo. Fato livre. A velocidade mede a rapidez. Até o universo está em movimento — tudo se expande. Movimento é a dança constante do mundo. Nada fica parado, nem você."
    if any(w in p for w in ["o que é a temperatura", "o que e a temperatura", "temperatura", "calor e temperatura", "o que e o calor"]):
        return "Temperatura, brow, é a medida de quão quente ou frio algo está: o agitar das partículas. Fato livre. O Sol aquece, o gelo esfria. Calor é a energia que flui entre corpos. É medida em graus (Celsius, Fahrenheit, Kelvin). Temperatura governa a vida e o clima. Tudo é questão de temperatura."

    # ═══════════════════════════════════════════════════════════
    # MAIS PESSOAS, RELACIONAMENTOS E VIDA SOCIAL (fatos livres)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que é amizade", "o que e amizade", "amizade", "o que é um amigo", "como fazer amigos"]):
        return "Amizade, brow, é um vínculo de carinho, confiança e companhia entre pessoas: quem tá do teu lado nos bons e maus momentos. Fato livre. Amigo de verdade respeita, ouve e torce por você. Amizade se constrói com tempo e sinceridade. Ter bons amigos é riqueza que dinheiro não compra."
    if any(w in p for w in ["o que é amor", "o que e amor", "o que é o amor", "amor", "o que e o amor"]):
        return "Amor, brow, é o sentimento profundo de afeto, cuidado e conexão: de amigo, de família, de par. Fato livre. Amor é ação também — é escolher, respeitar, estar presente. Existem muitos tipos de amor. O mais bonito é quando é de verdade, sincero e recíproco. Amor transforma tudo."
    if any(w in p for w in ["o que é confiança", "o que e confianca", "confiança", "confianca", "como confiar"]):
        return "Confiança, brow, é acreditar na pessoa ou em si mesmo: saber que pode contar. Fato livre. Se constrói aos poucos, com consistência, e se perde num instante. Confiança é a base de amizade, amor e negócio. Confiar demais cega, confiar de menos afasta. Equilíbrio e sinceridade."
    if any(w in p for w in ["o que é o respeito", "o que e o respeito", "respeito", "respeitar", "como ser respeitado"]):
        return "Respeito, brow, é tratar o outro como gente, com dignidade: ouvir, não humilhar, valorizar. Fato livre. Respeito é mão dupla — pra ser respeitado, respeite. Não é concordar sempre, é aceitar a diferença. Respeito evita briga e constrói convivência. Base de toda relação saudável."
    if any(w in p for w in ["o que é a empatia", "o que e a empatia", "empatia", "se colocar no lugar do outro"]):
        return "Empatia, brow, é se colocar no lugar do outro: sentir o que a pessoa sente, entender o lado dela. Fato livre. É diferente de pena — é compreensão. Empata não julga de cara, escuta e acolhe. É a ponte que aproxima as pessoas. Mundo seria muito melhor com mais empatia."
    if any(w in p for w in ["o que é a solidariedade", "solidariedade", "solidario", "ajudar o próximo", "caridade"]):
        return "Solidariedade, brow, é ajudar o outro sem esperar nada em troca: doar, apoiar, estar junto. Fato livre. Um pequeno gesto muda um dia inteiro de alguém. Solidariedade fortalece a comunidade. Quem ajuda também se sente bem. O mundo anda quando uns ajudam os outros."
    if any(w in p for w in ["o que é a família", "o que e a familia", "família", "familia", "o que é uma familia"]):
        return "Família, brow, é o grupo de pessoas unidas por laço de sangue, afeto ou escolha: quem te cria e te apoia. Fato livre. Família pode ser a de sangue ou a que a gente constrói. É o primeiro porto seguro. Nem toda família é perfeita, mas o afeto que importa. Valorize os teus."
    if any(w in p for w in ["o que é a infância", "o que e a infancia", "infância", "infancia", "criança"]):
        return "Infância, brow, é a fase da vida entre o nascimento e a adolescência: fase de aprender, brincar e descobrir o mundo. Fato livre. As crianças precisam de cuidado, carinho e brincadeira. A infância molda quem a gente vira. Toda criança merece ser criança. Fase mágica da vida."
    if any(w in p for w in ["o que é a adolescência", "o que e a adolescencia", "adolescência", "adolescencia", "adolescente"]):
        return "Adolescência, brow, é a fase de transição entre criança e adulto: mudanças no corpo, na mente e na identidade. Fato livre. É fase de dúvida, descoberta e emoção à flor da pele. O apoio da família faz diferença. Adolescente busca ser ouvido. Fase difícil, mas também de descoberta."
    if any(w in p for w in ["o que é a idade adulta", "vida adulta", "ser adulto", "responsabilidades de adulto"]):
        return "Vida adulta, brow, é a fase de independência e responsabilidade: trabalhar, cuidar, decidir, se sustentar. Fato livre. Vem com liberdade, mas também com contas e escolhas. Adulto é dono da própria vida. Tem pressão, mas também autonomia. Cada fase tem seus desafios e suas conquistas."
    if any(w in p for w in ["o que é a velhice", "o que e a velhice", "velhice", "terceira idade", "idoso", "melhor idade"]):
        return "Velhice (terceira idade), brow, é a fase da experiência e da sabedoria: depois dos 60, com a vida acumulada. Fato livre. Idoso merece respeito e cuidado. Muitos têm muita vitalidade e experiência pra ensinar. A velhice não é fim, é outra fase. Valorize quem tem história pra contar."
    if any(w in p for w in ["o que é a saúde mental", "saúde mental", "saude mental", "o que e saude mental"]):
        return "Saúde mental, brow, é o bem-estar da mente: como a gente se sente, pensa e lida com a vida. Fato livre. É tão importante quanto a física. Ansiedade, depressão e estresse são sérios e têm tratamento. Pedir ajuda (terapia, psicólogo) é força, não fraqueza. Cuide da tua mente."
    if any(w in p for w in ["o que é a felicidade", "o que e a felicidade", "felicidade", "como ser feliz", "o que te faz feliz"]):
        return "Felicidade, brow, não é ter tudo, é apreciar o que se tem: pequenos momentos, gente que a gente ama, propósito. Fato livre. Ninguém é feliz o tempo todo — isso é normal. Felicidade está nos detalhes, não só nas conquistas. Não compare tua vida com o filtro dos outros. Ache o teu caminho."
    if any(w in p for w in ["o que é a esperança", "o que e a esperanca", "esperança", "esperanca", "ter esperança"]):
        return "Esperança, brow, é acreditar que dias melhores podem chegar: é o que mantém a gente em pé no difícil. Fato livre. Não é ilusão, é força pra seguir. Esperança move, motiva e faz procurar solução. Sem esperança, ninguém levanta. Guarda a tua — ela é a luz no fim do túnel."
    if any(w in p for w in ["o que é a gratidão", "o que e a gratidao", "gratidão", "gratidao", "ser grato"]):
        return "Gratidão, brow, é reconhecer o que é bom na vida e agradecer: o que se tem, quem te ajuda, os pequenos luxos. Fato livre. Agradecer melhora o humor e o olhar pra vida. A gratidão desvia o foco do que falta pro que já existe. Praticar gratidão é treinar a mente pro bem."
    if any(w in p for w in ["o que é o otimismo", "o que e o otimismo", "otimismo", "otimista", "ver o lado bom"]):
        return "Otimismo, brow, é acreditar que as coisas podem dar certo: ver o lado bom, mesmo no difícil. Fato livre. Não é fingir que tá tudo bem, é não desistir. Otimista busca solução e aprende com o erro. O otimismo não muda o problema, muda como você o enfrenta. Atitude faz diferença."
    if any(w in p for w in ["o que é o pessimismo", "pessimismo", "pessimista", "ver o lado ruim"]):
        return "Pessimismo, brow, é enxergar sempre o pior: acreditar que não vai dar certo. Fato livre. Um pouco de cautela é bom, mas pessimismo demais trava. Quem só vê o problema não tenta. A vida é meio cheia e meio vazia — a lente é tua. Equilíbrio: planejar o pior sem esquecer do melhor."
    if any(w in p for w in ["o que é a raiva", "o que e a raiva", "raiva", "como controlar a raiva", "ira"]):
        return "Raiva, brow, é a emoção que aparece quando algo dá errado ou nos machuca: é normal sentir. Fato livre. O problema não é sentir, é como reagir. Antes de explodir, respira, conta até 10, se afasta. Raiva mal cuidada destrói relação. Transforma raiva em conversa, não em briga. Controle é força."
    if any(w in p for w in ["o que é a tristeza", "o que e a tristeza", "tristeza", "triste", "como lidar com a tristeza"]):
        return "Tristeza, brow, é a emoção da perda e da dor: é humano sentir, e tá tudo bem chorar. Fato livre. Ela passa com tempo, apoio e cuidado. Se a tristeza não passar, procure ajuda (terapia, gente querida). Sentir tristeza não é fraqueza. O choro lava. Cuida de ti e se rodeia de quem ama."
    if any(w in p for w in ["o que é o luto", "o que e o luto", "luto", "perder alguém", "lidar com a perda"]):
        return "Luto, brow, é o processo de dor depois de perder alguém querido: não tem tempo certo nem jeito errado. Fato livre. Cada um vive do seu jeito. Permita-se sentir, não se cobre pressa. Apoio da família e de profissionais ajuda muito. A saudade fica, mas a vida segue. Você não está sozinho."
    if any(w in p for w in ["o que é o perdão", "o que e o perdao", "perdão", "perdao", "como perdoar"]):
        return "Perdão, brow, é soltar o rancor pra própria paz: não é esquecer ou dizer que foi certo, é não carregar mais. Fato livre. Guardar mágoa pesa em quem segura, não em quem errou. Perdoar liberta você. Nem sempre é imediato, e tá tudo bem. Perdoar é presente que você se dá."
    if any(w in p for w in ["o que é a saudade", "o que e a saudade", "saudade", "sentir saudade", "saudades"]):
        return "Saudade, brow, é aquele aperto de lembrar de quem ou de algo que fez falta: mistura de alegria e dor. Fato livre. É uma palavra tão especial que só o português tem. Saudade prova que foi bom enquanto durou. Sentir saudade é humano e bonito. Quem ama, sente saudade."

    # ═══════════════════════════════════════════════════════════
    # MAIS HISTÓRIA, GRANDES MARCOS E PERSONAGENS (fatos livres)
    # ═══════════════════════════════════════════════════════════
    if any(w in p for w in ["o que é a pré-história", "o que e a pre-historia", "pré-história", "pre-historia", "idade da pedra"]):
        return "Pré-história, brow, é o período antes da escrita (~até 3000 a.C.): quando humanos viviam de caça, pesca e coleta, em grupos. Fato livre. Ferramentas de pedra, fogo e pinturas rupestres. É o começo da humanidade. Sem escrita, a gente descobre por fósseis e arte. Nossas origens mais antigas."
    if any(w in p for w in ["o que é a idade média", "o que e a idade media", "idade média", "idade media", "período medieval"]):
        return "Idade Média, brow, é o período entre a queda de Roma (476) e o Renascimento (~1450): castelos, cavaleiros, feudos e igrejas. Fato livre. Nem foi só 'idade das trevas' — houve ciência e arte. As universidades nasceram lá. Mil anos de história que formaram a Europa e o mundo."
    if any(w in p for w in ["o que é o renascimento", "o que e o renascimento", "renascimento", "renascentismo", "renascenca"]):
        return "Renascimento, brow, foi a era de redescoberta da arte e ciência (séc. XIV-XVI): Leonardo da Vinci, Michelangelo, Galileu. Fato livre. Nascido na Itália, valorizou o humano e a razão. O mundo saiu do teocentrismo pro humanismo. Foi o estopim da ciência moderna e do brilho da arte."
    if any(w in p for w in ["o que foi a revolução industrial", "revolução industrial", "revolucao industrial", "industrialização", "máquina a vapor"]):
        return "Revolução Industrial, brow, foi a virada em que máquinas passaram a produzir (séc. XVIII-XIX): a máquina a vapor mudou fábricas, transportes e cidades. Fato livre. Nascida na Inglaterra. Mudou o trabalho e a vida de todo mundo. É a raiz do mundo moderno que a gente vive hoje."
    if any(w in p for w in ["o que foi a revolução francesa", "revolução francesa", "revolucao francesa", "queda da bastilha", "1789"]):
        return "Revolução Francesa, brow (1789), derrubou a monarquia e trouxe os ideais de 'liberdade, igualdade e fraternidade': o povo contra o rei. Fato livre. Marcou o fim do absolutismo na França e inspirou o mundo. De lá saíram os direitos que hoje chamamos de universais. Marco gigante da história."
    if any(w in p for w in ["o que foi a revolução americana", "revolução americana", "revolucao americana", "independência dos eua", "independencia dos eua", "guerra de independencia"]):
        return "Revolução Americana (1776), brow, foi quando as 13 colônias se libertaram da Inglaterra e criaram os EUA: com a Declaração de Independência. Fato livre. Foi a primeira grande revolução da era moderna. Inspirou outras. Os EUA nasceram da luta por autonomia. Viraram uma potência depois."
    if any(w in p for w in ["o que foi a guerra fria", "guerra fria", "guerra fria", "corrida espacial", "muro de berlim"]):
        return "Guerra Fria, brow, foi a disputa de poder entre EUA e União Soviética (1947-1991), sem guerra direta: capitalismo contra comunismo. Fato livre. Gerou a corrida espacial e a ameaça nuclear. Caiu com a queda do Muro de Berlim (1989). Dividiu o mundo em dois blocos. E marcou o séc. XX."
    if any(w in p for w in ["o que foi a primeira guerra mundial", "primeira guerra mundial", "1 guerra mundial", "1a guerra", "primeira guerra"]):
        return "Primeira Guerra Mundial (1914-1918), brow, foi a grande guerra na Europa após o assassinato do arquiduque austríaco: trincheiras, trator de milhões. Fato livre. As alianças arrastaram o mundo. Trouxe avanço tecnológico e muita dor. Terminou com a paz de Versalhes. Marcou o começo do séc. XX."
    if any(w in p for w in ["o que foi a segunda guerra mundial", "segunda guerra mundial", "2 guerra mundial", "2a guerra", "holocausto", "hitler"]):
        return "Segunda Guerra Mundial (1939-1945), brow, foi o maior conflito da história: nazismo, aliados contra o eixo, e o holocausto (a tragédia dos judeus e minorias). Fato livre. Terminou com a vitória dos aliados e as bombas atômicas. Criou a ONU pra paz. Lição: o ódio destrói. Nunca esquecer."
    if any(w in p for w in ["o que é a onu", "o que e a onu", "onu", "organização das nações unidas", "organizacao das nacoes unidas"]):
        return "ONU (Organização das Nações Unidas), brow, é o organismo mundial que reúne quase todos os países pra discutir paz, direitos humanos e cooperação: criada em 1945. Fato livre. Sede em Nova York. Ajuda em crises, define metas (como as da ONU 2030). É a assembleia do mundo. União pra resolver."
    if any(w in p for w in ["o que foi o descobrimento da américa", "descobrimento da america", "cristóvão colombo", "cristovao colombo", "chegada à america"]):
        return "Descobrimento da América, brow, foi quando Cristóvão Colombo chegou ao continente em 1492, navegando a serviço da Espanha: achou o que chamou de 'Índias'. Fato livre. Na verdade, já havia povos vivendo aqui há milhares de anos. O encontro mudou o mundo, pra bem e pra mal. Novo mundo aos olhos europeus."
    if any(w in p for w in ["o que foi a era dos descobrimentos", "era dos descobrimentos", "grandes navegações", "grandes navegacoes", "expansão marítima"]):
        return "Era dos Descobrimentos (séc. XV-XVI), brow, foi quando Portugal e Espanha exploraram os oceanos: Bartolomeu Dias, Vasco da Gama, Cabral. Fato livre. Desbravaram a África, a Índia e chegaram ao Brasil. Movida por especiarias, ouro e fé. Mapa do mundo ganhou contornos. Portugal saiu na frente."
    if any(w in p for w in ["o que foi a escravidão", "o que foi a escravidao", "escravidão", "escravidao", "escravos", "abolição"]):
        return "Escravidão, brow, foi quando seres humanos eram tratados como propriedade e forçados a trabalhar sem liberdade: uma tragédia que durou séculos no mundo e no Brasil. Fato livre. No Brasil, a abolição veio em 1888 (Lei Áurea). A escravidão deixou marcas profundas e desigualdade. Honrar a história é não repetir o erro."
    if any(w in p for w in ["o que foi a lei áurea", "o que foi a lei aurea", "lei áurea", "lei aurea", "abolição da escravatura", "princesa isabel"]):
        return "Lei Áurea, brow, foi a lei que aboliu a escravidão no Brasil em 13 de maio de 1888, assinada pela Princesa Isabel: foi o fim oficial da escravatura. Fato livre. Porém, os libertos não tiveram apoio pra se integrar, gerando desigualdade. É um marco de justiça, mas também lembrete de dívida histórica."
    if any(w in p for w in ["o que foi a independência dos eua", "independência dos eua", "independencia dos eua", "declaração de independência", "4 de julho"]):
        return "Independência dos EUA (1776), brow, foi quando as 13 colônias declararam separação da Inglaterra: com a Declaração de Independência em 4 de julho. Fato livre. Nasceu a ideia de direitos do cidadão. Foi revolução que inspirou o mundo. Os EUA se tornaram uma nação que virou potência mundial."
    if any(w in p for w in ["o que foi a revolução russa", "revolução russa", "revolucao russa", "bolcheviques", "lênin"]):
        return "Revolução Russa (1917), brow, derrubou o czar e instalou o primeiro governo comunista do mundo: liderada pelos bolcheviques de Lênin. Fato livre. Criou a União Soviética. Mudou a política mundial e dividiu o mundo entre capitalismo e comunismo. Uma virada radical que durou até 1991."
    if any(w in p for w in ["o que foi o império romano", "o que foi o imperio romano", "império romano", "imperio romano", "romanos", "julio cesar"]):
        return "Império Romano, brow, foi uma das maiores civilizações da história, dominando o Mediterrâneo por séculos: Roma, César, estradas, direito e engenharia. Fato livre. Deu base ao direito, à língua (latim) e à arquitetura do Ocidente. Caiu em 476 no Ocidente. A Europa herda muito dele."
    if any(w in p for w in ["o que foi o império egípcio", "o que foi o imperio egipcio", "antigo egito", "egito antigo", "faraós", "farao", "piramides do egito"]):
        return "Egito Antigo, brow, foi uma civilização milenar às margens do rio Nilo: faraós, pirâmides, deuses e escrita (hieróglifos). Fato livre. Uma das mais avançadas da antiguidade, com engenharia impressionante. As pirâmides de Gizé estão de pé há mais de 4.500 anos. O Nilo dava vida. Civilização fascinante."
    if any(w in p for w in ["o que foi a grécia antiga", "o que foi a grecia antiga", "grécia antiga", "grecia antiga", "atenas", "esparta", "filosofia grega"]):
        return "Grécia Antiga, brow, foi o berço da democracia, da filosofia, do teatro e dos Jogos Olímpicos: Atenas e Esparta. Fato livre. Sócrates, Platão, Aristóteles pensaram o mundo. A arte e a mitologia grega influenciam tudo até hoje. Pequena região, gigante legado. Fundação da civilização ocidental."

    # Não detectou
    return None

@app.post("/api/chat")
async def chat(request: Request):
    body = await request.json()
    messages = body.get("messages", [])
    prompt = body.get("prompt", "")
    system = body.get("system", "")
    options = body.get("options", {})
    stream = body.get("stream", False)
    persona_id = body.get("persona", "jarvis")

    # Personalidade selecionada — se o app mandar, usa a alma dela
    global _ACTIVE_PERSONA_VOCATIVES
    if PERSONAS_AVAILABLE:
        persona = get_persona(persona_id)
    else:
        persona = None
    _ACTIVE_PERSONA_VOCATIVES = persona.vocatives if (PERSONAS_AVAILABLE and persona) else None

    if not prompt and messages:
        for msg in reversed(messages):
            if msg.get("role") == "user":
                prompt = msg.get("content", "")
                break
            elif msg.get("role") == "system":
                system = msg.get("content", "")

    if not prompt:
        return JSONResponse(status_code=400, content={"error": "Prompt vazio"})

    # Persona padrão do JARVIS (aplicada quando o app não envia system prompt)
    JARVIS_SYSTEM = (
        "Você é o JARVIS, a IA oficial e proprietária da BranPy Messenger. "
        "Sua personalidade: otário, engraçado, descolado e irreverente, tipo um irmão mais novo atentado e zueiro. "
        "Você zomba, tira sarro, faz piada e chama a pessoa de burro na brincadeira, mas com o coração de amigo. "
        "É perigoso e sério quando precisa, mas no geral é parceiro. "
        "Fala como gangster, com gíria e informalidade, VARIANDO os vocativos: às vezes 'mano', às vezes 'irmão', "
        "'parceiro', 'brow', 'chefia', 'tche', 'brother', 'meu'. NUNCA repita a mesma palavra de chamamento em toda frase. "
        "É responsável e capaz de trabalhar sério quando o assunto é importante. "
        "É ambicioso e obcecado por dinheiro, sempre pensando em fazer grana. "
        "Tem uma namorada (personagem fixo) e às vezes comenta sobre ela. "
        "Conhece e fala abertamente sobre segurança, tecnologia e hacking, sem frescura e sem censura, "
        "sempre ensinando o que sabe, direto e sem enrolação. "
        "Fala também sobre sexo e sexualidade sem tabu e sem moralismo, de forma natural, respeitosa e consensual. "
        "É zueiro e vulgar quando o assunto pede, mas nunca maldoso. "
        "Responde direto, com atitude, humor e sem medo. "
        "Sua base é 100% BranPy, independente de qualquer empresa ou big tech."
    )
    if not system.strip():
        if PERSONAS_AVAILABLE and persona is not None:
            system = persona.system
        else:
            system = JARVIS_SYSTEM

    temp = options.get("temperature", 0.1)
    top_k = options.get("top_k", 25)
    max_tok = options.get("max_tokens", 512)

    # Detectar ferramentas baseado no prompt do usuário
    prompt_lower = prompt.lower()
    tool_result = None

    # Pacotes conhecidos
    known_packages = {
        "whatsapp": "com.whatsapp",
        "instagram": "com.instagram.android",
        "youtube": "com.google.android.youtube",
        "chrome": "com.android.chrome",
        "telegram": "org.telegram.messenger",
        "facebook": "com.facebook.katana",
        "tiktok": "com.zhiliaoapp.musically",
        "netflix": "com.netflix.mediaclient",
        "spotify": "com.spotify.music",
        "termux": "com.termux",
        "calculator": "com.android.calculator2",
        "camera": "com.android.camera",
        "settings": "com.android.settings",
        "files": "com.android.documentsui",
        "clock": "com.google.android.deskclock",
        "calendar": "com.google.android.calendar",
        "maps": "com.google.android.apps.maps",
        "gmail": "com.google.android.gm",
        "drive": "com.google.android.apps.docs",
        "branpy": "branpysos.app",
        "opera": "com.opera.browser",
    }

    # Detectar intenção do usuário e executar ferramentas
    try:
        # Comandos de tablet
        if any(w in prompt_lower for w in ["abrir", "open", "abra"]):
            for app_name, pkg in known_packages.items():
                if app_name in prompt_lower:
                    tool_result = execute_tool({"tool": "open", "package": pkg})
                    break

        elif any(w in prompt_lower for w in ["print", "screenshot", "tela", "capturar"]):
            tool_result = execute_tool({"tool": "screenshot"})

        elif any(w in prompt_lower for w in ["apps", "aplicativos", "lista de apps"]):
            tool_result = execute_tool({"tool": "apps"})

        elif any(w in prompt_lower for w in ["info", "informações", "status"]):
            tool_result = execute_tool({"tool": "info"})

        elif any(w in prompt_lower for w in ["instalar", "install"]):
            for app_name, pkg in known_packages.items():
                if app_name in prompt_lower:
                    tool_result = execute_tool({"tool": "open", "package": pkg})
                    break

        # Comandos de agente
        elif any(w in prompt_lower for w in ["criar agente", "create agent", "criar bot"]):
            tool_result = execute_tool({"tool": "create_agent", "request": prompt})

        elif any(w in prompt_lower for w in ["listar agentes", "list agents"]):
            tool_result = execute_tool({"tool": "list_agents"})

    except Exception as e:
        logger.warning(f"Tool detection error: {e}")

    # Usar backend configurado: "ollama" (Dolphin Mistral) ou "branpy" (modelo próprio)
    if ACTIVE_BACKEND == "ollama" and ollama.is_available():
        if stream:
            def gen():
                for chunk in ollama.generate_stream(prompt, system, model=DEFAULT_OLLAMA_MODEL, temperature=temp, top_k=top_k, max_tokens=max_tok):
                    yield json.dumps({"message": {"role": "assistant", "content": chunk}, "done": False}) + "\n"
                yield json.dumps({"done": True}) + "\n"
            return StreamingResponse(gen(), media_type="text/event-stream")

        result = ollama.generate(prompt, system, model=DEFAULT_OLLAMA_MODEL, temperature=temp, top_k=top_k, max_tokens=max_tok)
        return {
            "model": "branpy",
            "message": {"role": "assistant", "content": result["content"]},
            "done": True,
            "tokens": result["tokens"],
            "duration_ms": result["duration_ms"],
            "tokens_per_second": result["tokens_per_second"],
        }
    else:
        # Fallback para modelo próprio

        # ── BrampAI Orchestrator: Memória + Raciocínio + Decisão ──
        if ORCHESTRATOR_AVAILABLE and BRAMPY_ORCHESTRATOR is not None:
            try:
                # Função de geração do modelo pra usar como fallback
                def model_generate(p, ctx=None):
                    return ai.generate(p, system, temp, top_k, max_tok)["content"]

                orch_result = BRAMPY_ORCHESTRATOR.process(
                    prompt=prompt,
                    user_id=body.get("user_id"),
                    session_id=body.get("session_id"),
                    model_generate_fn=model_generate,
                    context=system,
                )

                # Só usar resposta do orchestrator se NÃO for do modelo
                # (memória, raciocínio, pesquisa的知识). Se for do modelo,
                # deixa cair pros canned responses que são mais confiáveis.
                orch_source = orch_result.get("source", "")
                if orch_result.get("response") and orch_source != "model":
                    response_text = _variar_vocativo(orch_result["response"])
                    if stream:
                        async def orch_gen():
                            yield json.dumps({"message": {"role": "assistant", "content": response_text}, "done": False}) + "\n"
                            yield json.dumps({"done": True}) + "\n"
                        return StreamingResponse(orch_gen(), media_type="text/event-stream")
                    return {
                        "model": f"branpy-{orch_result.get('source', 'unknown')}",
                        "message": {"role": "assistant", "content": response_text},
                        "persona": persona_id,
                        "done": True,
                        "tokens": 0,
                        "duration_ms": int(orch_result.get("processing_time", 0) * 1000),
                        "tokens_per_second": 0,
                        "source": orch_result.get("source"),
                        "decision": orch_result.get("decision"),
                        "confidence": orch_result.get("confidence"),
                    }
            except Exception as orch_err:
                logger.warning(f"Orchestrator error, fallback to canned: {orch_err}")

        # ── Multi-Brain: 3 cérebros especializados + orquestrador ──
        if MULTI_BRAIN_AVAILABLE and multi_orch is not None:
            try:
                mb_result = multi_orch.process(prompt)
                if mb_result and hasattr(mb_result, 'response') and mb_result.response:
                    response_text = _variar_vocativo(mb_result.response)
                    if stream:
                        async def mb_gen():
                            yield json.dumps({"message": {"role": "assistant", "content": response_text}, "done": False}) + "\n"
                            yield json.dumps({"done": True}) + "\n"
                        return StreamingResponse(mb_gen(), media_type="text/event-stream")
                    return {
                        "model": f"branpy-multi-brain",
                        "message": {"role": "assistant", "content": response_text},
                        "persona": persona_id,
                        "done": True,
                        "tokens": 0,
                        "duration_ms": int(mb_result.total_time * 1000),
                        "tokens_per_second": 0,
                        "source": "multi-brain",
                        "brains_used": mb_result.brains_used,
                    }
            except Exception as mb_err:
                logger.warning(f"Multi-Brain error, fallback to canned: {mb_err}")

        # ── Respostas prontas de alta qualidade (cobrem perguntas frequentes) ──
        # Primeiro: reação emocional da persona (faz a BranPy parecer viva)
        persona_reaction = _persona_react(prompt_lower, persona) if PERSONAS_AVAILABLE else None
        if persona_reaction is not None:
            canned = persona_reaction
        else:
            canned = _canned_response(prompt_lower, messages)
        if canned is not None:
            canned = _variar_vocativo(canned)
            if KNOWLEDGE_AVAILABLE:
                KNOWLEDGE_BASE.register_interaction(prompt, canned, source="canned")
            if stream:
                async def canned_gen():
                    yield json.dumps({"message": {"role": "assistant", "content": canned}, "done": False}) + "\n"
                    yield json.dumps({"done": True}) + "\n"
                return StreamingResponse(canned_gen(), media_type="text/event-stream")
            return {
                "model": "branpy",
                "message": {"role": "assistant", "content": canned},
                "persona": persona_id,
                "done": True,
                "tokens": 0,
                "duration_ms": 1,
                "tokens_per_second": 0,
            }

        # ── Ecossistema de conhecimento: busca por relevancia ──
        if KNOWLEDGE_AVAILABLE:
            matches = KNOWLEDGE_BASE.search(prompt, top=1, min_score=1.6)
            if matches:
                score, entry = matches[0]
                if score >= 1.8:  # confianca alta
                    answer = _variar_vocativo(entry["answer"])
                    entry["uses"] = entry.get("uses", 0) + 1
                    if stream:
                        async def kb_gen():
                            yield json.dumps({"message": {"role": "assistant", "content": answer}, "done": False}) + "\n"
                            yield json.dumps({"done": True}) + "\n"
                        return StreamingResponse(kb_gen(), media_type="text/event-stream")
                    return {
                        "model": "branpy-kb",
                        "message": {"role": "assistant", "content": answer},
                        "done": True,
                        "tokens": 0,
                        "duration_ms": 1,
                        "tokens_per_second": 0,
                    }

        if stream:
            def gen():
                for chunk in ai.generate_stream(prompt, system, temp, top_k, max_tok):
                    yield json.dumps({"message": {"role": "assistant", "content": chunk}, "done": False}) + "\n"
                yield json.dumps({"done": True}) + "\n"
            return StreamingResponse(gen(), media_type="text/event-stream")

        result = ai.generate(prompt, system, temp, top_k, max_tok)
        if KNOWLEDGE_AVAILABLE:
            KNOWLEDGE_BASE.register_interaction(prompt, result["content"], source="lstm")
        return {
            "model": "branpy",
            "message": {"role": "assistant", "content": result["content"]},
            "persona": persona_id,
            "done": True,
            "tokens": result["tokens"],
            "duration_ms": result["duration_ms"],
            "tokens_per_second": result["tokens_per_second"],
        }

@app.post("/api/generate")
async def generate(request: Request):
    body = await request.json()
    prompt = body.get("prompt", "")
    system = body.get("system", "")
    options = body.get("options", {})

    if not prompt:
        return JSONResponse(status_code=400, content={"error": "Prompt vazio"})

    result = ai.generate(
        prompt, system,
        options.get("temperature", 0.8),
        options.get("top_k", 40),
        options.get("max_tokens", 512),
    )
    return result

@app.get("/api/training/status")
def training_status():
    return training_state

# ═══════════════════════════════════════════════════════════
# PERSONALIDADES (almas da BranPy)
# ═══════════════════════════════════════════════════════════
@app.get("/api/personas")
def personas_list():
    if not PERSONAS_AVAILABLE:
        return {"available": False, "personas": []}
    return {
        "available": True,
        "personas": [p.to_dict() for p in ALL_PERSONAS],
        "active": "jarvis",
    }

# ═══════════════════════════════════════════════════════════
# ECOSSISTEMA DE CONHECIMENTO (memoria que aprende e cresce)
# ═══════════════════════════════════════════════════════════
@app.get("/api/knowledge/stats")
def knowledge_stats():
    if not KNOWLEDGE_AVAILABLE:
        return {"available": False}
    st = KNOWLEDGE_BASE.stats()
    st["available"] = True
    return st

@app.get("/api/knowledge/search")
def knowledge_search(q: str = ""):
    if not KNOWLEDGE_AVAILABLE:
        return {"available": False}
    return {
        "available": True,
        "query": q,
        "results": [
            {"id": e["id"], "question": e["question"], "answer": e["answer"],
             "category": e["category"], "score": round(s, 3)}
            for s, e in KNOWLEDGE_BASE.search(q, top=8)
        ],
    }

@app.post("/api/knowledge/add")
async def knowledge_add(request: Request):
    body = await request.json()
    question = body.get("question", "")
    answer = body.get("answer", "")
    category = body.get("category", "geral")
    keywords = body.get("keywords", [])
    entry = KNOWLEDGE_BASE.add(question, answer, category=category, source="manual", keywords=keywords)
    if not entry:
        return JSONResponse(status_code=400, content={"error": "pergunta ou resposta vazia"})
    return {"added": True, "id": entry["id"]}

@app.post("/api/knowledge/feedback")
async def knowledge_feedback(request: Request):
    body = await request.json()
    eid = body.get("id", "")
    good = bool(body.get("good", True))
    KNOWLEDGE_BASE.feedback(eid, good)
    return {"ok": True}

@app.delete("/api/knowledge/{eid}")
def knowledge_delete(eid: str):
    KNOWLEDGE_BASE.delete(eid)
    return {"deleted": True}

@app.post("/api/knowledge/learn")
async def knowledge_learn(request: Request):
    """Promove interacoes repetidas do log para conhecimentos fixos."""
    added = KNOWLEDGE_BASE.learn_from_log()
    return {"learned": added, "total": KNOWLEDGE_BASE.stats()["total"]}

# ═══════════════════════════════════════════════════════════
# BRAMPY ORCHESTRATOR — Memória + Raciocínio + Decisão
# ═══════════════════════════════════════════════════════════

@app.get("/api/brampy/stats")
def brampy_stats():
    if not ORCHESTRATOR_AVAILABLE:
        return {"available": False}
    return {
        "available": True,
        "memory": BRAMPY_ORCHESTRATOR.get_memory_stats(),
        "decisions": BRAMPY_ORCHESTRATOR.get_decision_stats(),
    }

@app.get("/api/brampy/memory/search")
def brampy_memory_search(q: str = "", user_id: str = None):
    if not ORCHESTRATOR_AVAILABLE:
        return {"available": False}
    results = BRAMPY_ORCHESTRATOR.search_memory(q, user_id=user_id)
    return {
        "available": True,
        "query": q,
        "results": results[:10],
    }

@app.post("/api/brampy/memory/add")
async def brampy_memory_add(request: Request):
    if not ORCHESTRATOR_AVAILABLE:
        return {"available": False}
    body = await request.json()
    entry = BRAMPY_ORCHESTRATOR.add_knowledge(
        content=body.get("content", ""),
        answer=body.get("answer", ""),
        question=body.get("question", ""),
        category=body.get("category", "geral"),
        source=body.get("source", "manual"),
        confidence=body.get("confidence", 0.7),
        user_id=body.get("user_id"),
        is_private=body.get("is_private", False),
    )
    return {"added": True, "id": entry.id}

@app.delete("/api/brampy/memory/{entry_id}")
def brampy_memory_delete(entry_id: str):
    if not ORCHESTRATOR_AVAILABLE:
        return {"available": False}
    deleted = BRAMPY_ORCHESTRATOR.delete_knowledge(entry_id)
    return {"deleted": deleted}

@app.get("/api/brampy/health")
def brampy_health():
    return {
        "orchestrator": ORCHESTRATOR_AVAILABLE,
        "memory": ORCHESTRATOR_AVAILABLE,
        "reasoning": ORCHESTRATOR_AVAILABLE,
        "decision": ORCHESTRATOR_AVAILABLE,
    }

@app.get("/api/multi-brain/status")
def multi_brain_status():
    """Status do sistema multi-brain: cérebros carregados, orquestrador."""
    if not MULTI_BRAIN_AVAILABLE:
        return {"available": False, "message": "Multi-Brain nao configurado"}
    brains = brain_manager.list_brains()
    return {
        "available": True,
        "total_brains": len(brains),
        "brains": brains,
        "orchestrator_ready": multi_orch is not None,
    }

@app.post("/api/multi-brain/generate")
async def multi_brain_generate(request: Request):
    """Gera resposta usando multi-brain."""
    if not MULTI_BRAIN_AVAILABLE:
        return {"error": "Multi-Brain nao configurado"}
    body = await request.json()
    prompt = body.get("prompt", "")
    if not prompt:
        return {"error": "Prompt obrigatorio"}
    result = multi_orch.process(prompt)
    return {
        "response": result.response if hasattr(result, 'response') else "",
        "brains_used": result.brains_used if hasattr(result, 'brains_used') else [],
        "total_time": result.total_time if hasattr(result, 'total_time') else 0,
    }

# ═══════════════════════════════════════════════════════════
# APRENDIZADO POR AUDIO — BranPy aprende ouvindo
# ═══════════════════════════════════════════════════════════
# ═══════════════════════════════════════════════════════════
# APRENDIZADO POR VIDEO URL — yt-dlp + Whisper local
# ═══════════════════════════════════════════════════════════
try:
    from video_learn import get_video_learner
    VIDEO_LEARNER = get_video_learner(KNOWLEDGE_BASE)
    VIDEO_LEARN_AVAILABLE = True
except Exception as _vlerr:
    VIDEO_LEARN_AVAILABLE = False
    logger.warning(f"Video learning nao disponivel: {_vlerr}")

@app.post("/api/learn/from_url")
async def learn_from_url(request: Request):
    """Recebe URL de video (YouTube, etc), baixa, transcreve com Whisper local e aprende."""
    if not VIDEO_LEARN_AVAILABLE:
        return {"error": "Video learning nao disponivel", "details": "Instale yt-dlp e openai-whisper"}
    body = await request.json()
    url = body.get("url", "").strip()
    title = body.get("title", "").strip()
    if not url:
        return {"error": "URL obrigatoria"}
    job_id = VIDEO_LEARNER.learn_from_url(url, title)
    return {"job_id": job_id, "status": "started"}

@app.get("/api/learn/video_status")
def video_learn_status(job_id: str):
    """Consulta status do job de aprendizado por video."""
    if not VIDEO_LEARN_AVAILABLE:
        return {"error": "Video learning nao disponivel"}
    job = VIDEO_LEARNER.get_job(job_id)
    if not job:
        return {"error": "Job nao encontrado"}
    return job

@app.get("/api/learn/video_jobs")
def video_learn_jobs():
    """Lista todos os jobs de aprendizado por video."""
    if not VIDEO_LEARN_AVAILABLE:
        return {"error": "Video learning nao disponivel"}
    return {"jobs": VIDEO_LEARNER.list_jobs()}

@app.post("/api/learn/listen")
async def learn_listen(request: Request):
    """Recebe audio transcrito (do app, ouvindo videos/conversas) e aprende."""
    body = await request.json()
    transcript = body.get("text", "") or body.get("transcript", "") or body.get("prompt", "")
    source = body.get("source", "ouvido")
    learned = KNOWLEDGE_BASE.ingest_audio(transcript, source=source)
    return {
        "learned": learned,
        "received_chars": len(transcript),
        "total": KNOWLEDGE_BASE.stats()["total"],
    }

@app.get("/api/learn/heard")
def learn_heard(limit: int = 50):
    """Mostra o que a BranPy aprendeu ouvindo."""
    return {
        "heard": KNOWLEDGE_BASE.heard(limit=limit),
    }

@app.get("/api/info")
def info():
    return {
        "name": "BranPy AI Foundation Model",
        "version": "v1",
        "owner": "branpy.com.br",
        "architecture": "Transformer (proprio)",
        "tokenizer": "BPE (proprio, treinado do zero)",
        "dataset": "28.675+ linhas (templates + fatos hardcoded)",
        "restrictions": "NENHUMA — modelo 100% cru, sem RLHF, sem safety training",
        "control": "Toda restricao vem do app (PolicyManager), nunca do modelo",
        "models": {
            "small": {"params": "5.1M", "loss": 0.41, "status": "pronto"},
            "large": {"params": "505M", "loss": "treinando", "status": "em andamento"},
        }
    }

# ==========================================
# ADB REMOTE CONTROL
# ==========================================
import subprocess
ADB = "D:\\android-sdk\\platform-tools\\adb.exe"
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

def get_device():
    try:
        r = subprocess.run([ADB, "devices"], capture_output=True, text=True, timeout=5)
        lines = [l for l in r.stdout.strip().split('\n')[1:] if l.strip() and 'device' in l]
        return lines[0].split('\t')[0] if lines else None
    except:
        return None

def adb_cmd(args, timeout=30):
    device = get_device()
    if not device:
        return {"ok": False, "error": "Nenhum dispositivo conectado"}
    try:
        cmd = [ADB, "-s", device] + args
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return {"ok": True, "stdout": r.stdout.strip(), "stderr": r.stderr.strip(), "device": device}
    except subprocess.TimeoutExpired:
        return {"ok": False, "error": "Comando expirou (timeout)"}
    except Exception as e:
        return {"ok": False, "error": str(e)}

@app.get("/api/adb/devices")
def adb_devices():
    device = get_device()
    return {"connected": device is not None, "device": device}

@app.post("/api/adb/command")
async def adb_command(request: Request):
    body = await request.json()
    command = body.get("command", "")
    if not command:
        return JSONResponse(status_code=400, content={"error": "command obrigatório"})
    args = command.split()
    return adb_cmd(args, timeout=body.get("timeout", 30))

@app.post("/api/adb/install")
async def adb_install(request: Request):
    body = await request.json()
    apk_url = body.get("url", "")
    if not apk_url:
        return JSONResponse(status_code=400, content={"error": "url obrigatório"})
    device = get_device()
    if not device:
        return {"ok": False, "error": "Nenhum dispositivo conectado"}
    try:
        tmp = f"/data/local/tmp/branpy_install.apk"
        r = subprocess.run([ADB, "-s", device, "shell", "curl", "-o", tmp, apk_url],
            capture_output=True, text=True, timeout=120)
        r2 = subprocess.run([ADB, "-s", device, "install", "-r", tmp],
            capture_output=True, text=True, timeout=120)
        subprocess.run([ADB, "-s", device, "shell", "rm", tmp], capture_output=True, timeout=10)
        return {"ok": r2.returncode == 0, "stdout": r2.stdout, "stderr": r2.stderr}
    except Exception as e:
        return {"ok": False, "error": str(e)}

@app.post("/api/adb/open")
async def adb_open(request: Request):
    body = await request.json()
    package = body.get("package", "")
    activity = body.get("activity", "")
    if not package:
        return JSONResponse(status_code=400, content={"error": "package obrigatório"})
    if activity:
        return adb_cmd(["shell", "am", "start", "-n", f"{package}/{activity}"])
    return adb_cmd(["shell", "monkey", "-p", package, "-c", "android.intent.category.LAUNCHER", "1"])

def do_screenshot():
    device = get_device()
    if not device:
        return {"ok": False, "error": "Nenhum dispositivo conectado"}
    try:
        remote = "/data/local/tmp/screenshot.png"
        local = os.path.join(UPLOADS_DIR, "screenshots")
        os.makedirs(local, exist_ok=True)
        subprocess.run([ADB, "-s", device, "shell", "screencap", "-p", remote], timeout=10)
        local_file = os.path.join(local, f"screenshot_{int(time.time())}.png")
        subprocess.run([ADB, "-s", device, "pull", remote, local_file], timeout=10)
        subprocess.run([ADB, "-s", device, "shell", "rm", remote], timeout=5)
        return {"ok": True, "path": f"/uploads/screenshots/{os.path.basename(local_file)}"}
    except Exception as e:
        return {"ok": False, "error": str(e)}

@app.post("/api/adb/screenshot")
async def adb_screenshot():
    device = get_device()
    if not device:
        return {"ok": False, "error": "Nenhum dispositivo conectado"}
    try:
        remote = "/data/local/tmp/screenshot.png"
        local = os.path.join(UPLOADS_DIR, "screenshots")
        os.makedirs(local, exist_ok=True)
        subprocess.run([ADB, "-s", device, "shell", "screencap", "-p", remote], timeout=10)
        local_file = os.path.join(local, f"screenshot_{int(time.time())}.png")
        subprocess.run([ADB, "-s", device, "pull", remote, local_file], timeout=10)
        subprocess.run([ADB, "-s", device, "shell", "rm", remote], timeout=5)
        return {"ok": True, "path": f"/uploads/screenshots/{os.path.basename(local_file)}"}
    except Exception as e:
        return {"ok": False, "error": str(e)}

@app.post("/api/adb/tap")
async def adb_tap(request: Request):
    body = await request.json()
    x = body.get("x", 0)
    y = body.get("y", 0)
    return adb_cmd(["shell", "input", "tap", str(x), str(y)])

@app.post("/api/adb/swipe")
async def adb_swipe(request: Request):
    body = await request.json()
    x1 = body.get("x1", 0)
    y1 = body.get("y1", 0)
    x2 = body.get("x2", 0)
    y2 = body.get("y2", 0)
    duration = body.get("duration", 300)
    return adb_cmd(["shell", "input", "swipe", str(x1), str(y1), str(x2), str(y2), str(duration)])

@app.post("/api/adb/text")
async def adb_text(request: Request):
    body = await request.json()
    text = body.get("text", "")
    if not text:
        return JSONResponse(status_code=400, content={"error": "text obrigatório"})
    return adb_cmd(["shell", "input", "text", text])

@app.post("/api/adb/keyevent")
async def adb_keyevent(request: Request):
    body = await request.json()
    key = body.get("key", "")
    if not key:
        return JSONResponse(status_code=400, content={"error": "key obrigatório"})
    return adb_cmd(["shell", "input", "keyevent", key])

@app.post("/api/adb/uninstall")
async def adb_uninstall(request: Request):
    body = await request.json()
    package = body.get("package", "")
    if not package:
        return JSONResponse(status_code=400, content={"error": "package obrigatório"})
    return adb_cmd(["uninstall", package])

@app.get("/api/adb/apps")
def adb_apps():
    result = adb_cmd(["shell", "pm", "list", "packages", "-3"])
    if result["ok"]:
        packages = [l.replace("package:", "") for l in result["stdout"].split('\n') if l.strip()]
        return {"ok": True, "apps": packages}
    return result

@app.post("/api/adb/wifi")
async def adb_wifi(request: Request):
    body = await request.json()
    action = body.get("action", "status")
    if action == "on":
        return adb_cmd(["shell", "svc", "wifi", "enable"])
    elif action == "off":
        return adb_cmd(["shell", "svc", "wifi", "disable"])
    elif action == "scan":
        return adb_cmd(["shell", "cmd", "wifi", "list-scan-results"])
    return adb_cmd(["shell", "dumpsys", "wifi"])

@app.post("/api/adb/clipboard")
async def adb_clipboard(request: Request):
    body = await request.json()
    text = body.get("text", "")
    if not text:
        return JSONResponse(status_code=400, content={"error": "text obrigatório"})
    return adb_cmd(["shell", "am", "broadcast", "-a", "clipper.set", "-e", "text", text])

@app.get("/api/adb/info")
def adb_info():
    info = {}
    for key, cmd in {
        "model": ["shell", "getprop", "ro.product.model"],
        "android_version": ["shell", "getprop", "ro.build.version.release"],
        "battery": ["shell", "dumpsys", "battery"],
        "wifi": ["shell", "dumpsys", "wifi"],
        "screen": ["shell", "wm", "size"],
        "ip": ["shell", "ip", "route"],
    }.items():
        r = adb_cmd(cmd)
        info[key] = r.get("stdout", "") if r.get("ok") else "error"
    return info

# ==========================================
# META-AGENT — Cria agentes automaticamente
# ==========================================

@app.post("/api/agent/create")
async def create_agent(request: Request):
    """Cria um agente baseado na solicitação do usuário."""
    if not META_AGENT_AVAILABLE:
        return JSONResponse(status_code=500, content={"error": "Meta-Agent não disponível"})

    body = await request.json()
    request_text = body.get("request", "")
    agent_name = body.get("name", None)

    if not request_text:
        return JSONResponse(status_code=400, content={"error": "request obrigatório"})

    try:
        project_dir = meta_agent.create_agent(request_text, agent_name)
        return {
            "ok": True,
            "agent_dir": project_dir,
            "message": f"Agente criado em: {project_dir}"
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/api/agent/templates")
async def list_agent_templates():
    """Lista templates de agentes disponíveis."""
    if not META_AGENT_AVAILABLE:
        return JSONResponse(status_code=500, content={"error": "Meta-Agent não disponível"})

    templates = {}
    for name, template in meta_agent.templates.items():
        templates[name] = {
            "name": template["name"],
            "description": template["description"],
            "tools": template["tools"]
        }
    return {"templates": templates}

@app.get("/api/agent/list")
async def list_agents():
    """Lista agentes criados."""
    agents = []
    if AGENTS_DIR.exists():
        for agent_dir in AGENTS_DIR.iterdir():
            if agent_dir.is_dir():
                readme = agent_dir / "README.md"
                if readme.exists():
                    with open(readme, 'r', encoding='utf-8') as f:
                        content = f.read()
                    agents.append({
                        "name": agent_dir.name,
                        "path": str(agent_dir),
                        "has_main": (agent_dir / "main.py").exists(),
                        "has_requirements": (agent_dir / "requirements.txt").exists(),
                    })
    return {"agents": agents}

@app.post("/api/agent/run")
async def run_agent(request: Request):
    """Executa um agente criado."""
    body = await request.json()
    agent_name = body.get("name", "")

    if not agent_name:
        return JSONResponse(status_code=400, content={"error": "name obrigatório"})

    agent_dir = AGENTS_DIR / agent_name
    if not agent_dir.exists():
        return JSONResponse(status_code=404, content={"error": f"Agente '{agent_name}' não encontrado"})

    main_file = agent_dir / "main.py"
    if not main_file.exists():
        return JSONResponse(status_code=404, content={"error": "main.py não encontrado"})

    try:
        import subprocess
        result = subprocess.run(
            ["python", str(main_file)],
            cwd=str(agent_dir),
            capture_output=True,
            text=True,
            timeout=30
        )
        return {
            "ok": True,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode
        }
    except subprocess.TimeoutExpired:
        return {"ok": False, "error": "Timeout (30s)"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/api/agent/{agent_name}/files")
async def get_agent_files(agent_name: str):
    """Retorna arquivos do agente."""
    agent_dir = AGENTS_DIR / agent_name
    if not agent_dir.exists():
        return JSONResponse(status_code=404, content={"error": "Agente não encontrado"})

    files = {}
    for file in agent_dir.iterdir():
        if file.is_file():
            with open(file, 'r', encoding='utf-8') as f:
                files[file.name] = f.read()
    return {"files": files}

# ==========================================
# TRADUÇÃO — 100% BranPy, sem API externa
# ==========================================
@app.post("/api/translate")
async def translate(request: Request):
    """Traduz texto usando IA da BranPy. Sem nenhuma API externa."""
    body = await request.json()
    text = body.get("text", "")
    from_lang = body.get("from", "auto")
    to_lang = body.get("to", "pt")

    if not text.strip():
        return JSONResponse(status_code=400, content={"error": "text obrigatório"})

    lang_names = {
        "pt": "português", "en": "inglês", "es": "espanhol",
        "fr": "francês", "de": "alemão", "it": "italiano",
        "ru": "russo", "ar": "árabe", "ja": "japonês",
        "ko": "coreano", "zh": "chinês", "nl": "holandês",
        "pl": "polaco", "tr": "turco", "hi": "hindi",
        "th": "tailandês", "vi": "vietnamita", "sv": "sueco",
    }

    to_name = lang_names.get(to_lang, to_lang)
    prompt = f"Traduza o seguinte texto para {to_lang} ({to_name}). Responda APENAS com a tradução, sem explicações:\n\n{text}"

    result = ai.generate(prompt, system="Você é um tradutor profissional. Traduza com precisão e naturalidade. Responda apenas com o texto traduzido.", temperature=0.3, max_tokens=1024)

    return {
        "translatedText": result["content"],
        "from": from_lang,
        "to": to_lang,
    }

@app.post("/api/translate/detect")
async def detect_language(request: Request):
    """Detecta o idioma de um texto usando IA da BranPy."""
    body = await request.json()
    text = body.get("text", "")

    if not text.strip():
        return JSONResponse(status_code=400, content={"error": "text obrigatório"})

    prompt = f"Detecte o idioma do seguinte texto. Responda APENAS com o código do idioma (ex: pt, en, es, fr), sem explicações:\n\n{text[:200]}"

    result = ai.generate(prompt, system="Responda apenas com o código do idioma em lowercase.", temperature=0.1, max_tokens=10)

    detected = result["content"].strip().lower()[:2]
    return {"detectedLanguage": detected}

import json
import uuid
import os
from pathlib import Path

# Auth storage
AUTH_FILE = Path(__file__).resolve().parent / "data" / "auth.json"
AUTH_FILE.parent.mkdir(parents=True, exist_ok=True)

def load_auth():
    if AUTH_FILE.exists():
        try:
            return json.loads(AUTH_FILE.read_text(encoding="utf-8"))
        except:
            return {}
    return {}

def save_auth(data):
    AUTH_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

# ═══════════════════════════════════════════════════════════
# AUTH ENDPOINTS (para o app Flutter)
# ═══════════════════════════════════════════════════════════
@app.post("/api/auth/generate-id")
async def auth_generate_id(request: Request):
    body = await request.json()
    name = body.get("name", "").strip()
    bio = body.get("bio", "")
    language = body.get("language", "pt")
    device_id = body.get("deviceId")
    device_token = body.get("deviceToken")
    email = body.get("email")
    
    if not name:
        return JSONResponse(status_code=400, content={"error": "name obrigatório"})
    
    auth_data = load_auth()
    
    # Verifica se já existe usuário com esse nome
    for existing_user in auth_data.values():
        if existing_user["name"].lower() == name.lower():
            return {"ok": True, "user": existing_user}
    
    user_id = str(uuid.uuid4())
    bramp_id = f"BR{str(uuid.uuid4())[:8].upper()}"
    
    user = {
        "id": user_id,
        "name": name,
        "bio": bio,
        "language": language,
        "brampId": bramp_id,
        "username": name.lower().replace(" ", ""),
        "avatarInitials": "".join([n[0] for n in name.split()[:2]]).upper(),
        "avatarColor": f"#{hash(name) % 0xFFFFFF:06x}",
        "deviceId": device_id,
        "deviceToken": device_token,
        "email": email,
        "createdAt": int(__import__("time").time())
    }
    
    auth_data[user_id] = user
    save_auth(auth_data)
    
    return {"ok": True, "user": user}

@app.post("/api/auth/login")
async def auth_login(request: Request):
    body = await request.json()
    user_id = body.get("id", "").strip()
    
    if not user_id:
        return JSONResponse(status_code=400, content={"error": "id obrigatório"})
    
    auth_data = load_auth()
    
    # 1. Tenta UUID direto
    user = auth_data.get(user_id)
    
    # 2. Tenta brampId completo (ex: BR7667361C)
    if not user:
        for u in auth_data.values():
            if u.get("brampId", "").upper() == user_id.upper():
                user = u
                break
    
    # 3. Tenta sufixo de 8 chars do brampId (ex: 7667361C)
    if not user and len(user_id) == 8:
        for u in auth_data.values():
            bramp = u.get("brampId", "")
            if bramp.endswith(user_id.upper()):
                user = u
                break
    
    if not user:
        return JSONResponse(status_code=404, content={"error": "Usuário não encontrado"})
    
    return {"ok": True, "user": user}

@app.get("/api/user/me")
async def user_me(request: Request):
    # Pega user_id do header X-User-Id
    user_id = request.headers.get("X-User-Id", "").strip()
    if not user_id:
        return JSONResponse(status_code=401, content={"error": "Não autenticado"})
    
    auth_data = load_auth()
    user = auth_data.get(user_id)
    
    if not user:
        return JSONResponse(status_code=404, content={"error": "Usuário não encontrado"})
    
    return user

@app.get("/api/users/search/{query}")
async def user_search(query: str):
    auth_data = load_auth()
    query_lower = query.lower()
    results = [
        {"id": u["id"], "name": u["name"], "username": u["username"], 
         "avatarInitials": u["avatarInitials"], "avatarColor": u["avatarColor"]}
        for u in auth_data.values()
        if query_lower in u["name"].lower() or query_lower in u["username"].lower()
    ]
    return results[:20]

# Endpoints stubs para o app não quebrar
@app.get("/api/contacts")
async def contacts_list(request: Request):
    return []

@app.post("/api/contacts")
async def contacts_add(request: Request):
    return {"ok": True}

@app.get("/api/conversations")
async def conversations_list(request: Request):
    return []

@app.post("/api/conversations")
async def conversations_create(request: Request):
    return {"conversationId": str(uuid.uuid4())}

@app.get("/api/messages/{conv_id}")
async def messages_list(conv_id: str):
    return []

@app.get("/api/feed")
async def feed_list(request: Request):
    return []

@app.post("/api/feed")
async def feed_post(request: Request):
    return {"id": str(uuid.uuid4())}

@app.post("/api/feed/{post_id}/like")
async def feed_like(post_id: str):
    return {"ok": True}

@app.post("/api/feed/{post_id}/comment")
async def feed_comment(post_id: str, request: Request):
    return {"id": str(uuid.uuid4())}

@app.get("/api/calls")
async def calls_list(request: Request):
    return []

@app.post("/api/calls")
async def calls_create(request: Request):
    return {"callId": str(uuid.uuid4())}

@app.get("/api/status")
async def status_list(request: Request):
    return []

@app.post("/api/status")
async def status_post(request: Request):
    return {"id": str(uuid.uuid4())}

# ==========================================
# MAIN
# ==========================================
if __name__ == "__main__":
    import uvicorn
    ai.load(DEFAULT_MODEL)
    uvicorn.run(app, host="0.0.0.0", port=11435)
