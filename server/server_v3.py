"""BranPy Server v3 — Servidor completo com IA + Ações + Banco + Web.

100% da branpy.com.br — Todos os direitos reservados.
Servidor que integra tudo: linguagem + ações + banco + web + negócios.

Rodar: python server_v3.py
"""

import os
import sys
import json
import time
import torch
import logging
import uvicorn
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Adicionar path do sistema
sys.path.insert(0, str(Path(__file__).parent.parent))
from system import BranPySystem, BranPyCore, BankingModule, WebModule, BusinessModule

# Adicionar path do modelo
sys.path.insert(0, str(Path(__file__).parent.parent / "from_scratch"))
from model import BranPyModel, BranPyConfig, create_model
from tokenizer import BPETokenizer

# ==========================================
# CONFIGURAÇÃO
# ==========================================

BASE_DIR = Path(__file__).parent.parent
WEIGHTS_DIR = BASE_DIR / "weights" / "bran9bpy_medium"
DEVICE = "cpu"

# ==========================================
# MODELO DE LINGUAGEM
# ==========================================

class LanguageModel:
    """Modelo de linguagem — cérebro da IA."""
    
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.loaded = False
        
    def load(self):
        """Carrega modelo treinado."""
        try:
            # Carregar tokenizer
            tok_path = WEIGHTS_DIR / "tokenizer.json"
            if tok_path.exists():
                self.tokenizer = BPETokenizer()
                self.tokenizer.load(str(tok_path))
            
            # Carregar modelo
            model_path = WEIGHTS_DIR / "model_final.pt"
            if not model_path.exists():
                model_path = WEIGHTS_DIR / "model_epoch1.pt"
            
            if model_path.exists():
                checkpoint = torch.load(model_path, map_location=DEVICE, weights_only=False)
                config = checkpoint.get("config", {})
                
                self.model = create_model(
                    vocab_size=config.get("vocab_size", 1358),
                    size="xlarge"
                )
                self.model.load_state_dict(checkpoint["model_state_dict"])
                self.model.eval()
                self.loaded = True
                print(f"[LanguageModel] Carregado: {model_path.name}")
                return True
        except Exception as e:
            print(f"[LanguageModel] Erro: {e}")
            return False
    
    def generate(self, prompt, max_tokens=200, temperature=0.8):
        """Gera texto."""
        if not self.loaded:
            return "Modelo não carregado!"
        
        try:
            ids = self.tokenizer.encode(prompt, add_special=True)
            x = torch.tensor([ids], dtype=torch.long)
            gen_ids = self.model.generate(x, max_new_tokens=max_tokens, temperature=temperature)
            response = self.tokenizer.decode(gen_ids[0].tolist())
            return response
        except Exception as e:
            return f"Erro na geração: {e}"


# ==========================================
# API PRINCIPAL
# ==========================================

app = FastAPI(
    title="BranPy API",
    description="100% branpy.com.br — Sistema completo de IA",
    version="3.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos de dados
class ChatRequest(BaseModel):
    message: str
    context: Optional[List[Dict]] = None
    
class ChatResponse(BaseModel):
    response: str
    intent: str
    actions: List[Dict]
    
class FinancialRequest(BaseModel):
    action: str
    amount: Optional[float] = None
    key: Optional[str] = None
    
class BusinessRequest(BaseModel):
    name: str
    niche: str
    budget: float
    
class SiteRequest(BaseModel):
    name: str
    niche: str


# ==========================================
# INSTÂNCIAS GLOBAIS
# ==========================================

language_model = LanguageModel()
system = None


@app.on_event("startup")
async def startup():
    """Inicializa o sistema."""
    global system
    
    print("=" * 60)
    print("BranPy Server v3 — Iniciando...")
    print("=" * 60)
    
    # Carregar modelo de linguagem
    language_model.load()
    
    # Inicializar sistema completo
    system = BranPySystem()
    system.start()
    
    print("=" * 60)
    print("BranPy Server v3 — Pronto!")
    print("=" * 60)


# ==========================================
# ENDPOINTS
# ==========================================

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "BranPy API",
        "version": "3.0.0",
        "status": "online",
        "owner": "Paulo Jefferson Nascimento do Rosário",
        "license": "100% branpy.com.br"
    }


@app.get("/status")
async def status():
    """Status do sistema."""
    return system.get_status()


@app.post("/chat")
async def chat(request: ChatRequest):
    """Endpoint principal de chat."""
    try:
        # Processar com modelo de linguagem
        if language_model.loaded:
            response = language_model.generate(request.message)
        else:
            # Fallback para sistema
            response = system.process_input(request.message)
        
        # Verificar intenção
        intent = system.core._analyze_intent(request.message)
        
        # Executar ações se necessário
        actions = []
        if intent == "financial_check":
            balance = system.actions.execute("check_balance", {})
            actions.append({"type": "check_balance", "result": balance})
        
        elif intent == "business_create":
            business = system.actions.execute("create_business", {
                "name": f"Negócio {len(system.business.businesses) + 1}",
                "niche": "online",
                "budget": 1000
            })
            actions.append({"type": "create_business", "result": business})
        
        return ChatResponse(
            response=response,
            intent=intent,
            actions=actions
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/financial/balance")
async def get_balance():
    """Verifica saldo."""
    balance = system.banking.check_balance()
    return {"balance": balance, "currency": "BRL"}


@app.post("/financial/pix")
async def send_pix(request: FinancialRequest):
    """Envia PIX."""
    if not request.key or not request.amount:
        raise HTTPException(status_code=400, detail="Key and amount required")
    
    result = system.banking.send_pix(request.key, request.amount)
    return result


@app.post("/business/create")
async def create_business(request: BusinessRequest):
    """Cria negócio."""
    business = system.business.create_business(
        request.name, request.niche, request.budget
    )
    return business


@app.get("/business/list")
async def list_businesses():
    """Lista negócios."""
    return system.business.get_all_businesses()


@app.post("/web/site")
async def create_site(request: SiteRequest):
    """Cria site."""
    site = system.web.create_site(request.name, request.niche)
    return site


@app.get("/web/sites")
async def list_sites():
    """Lista sites."""
    return system.web.sites


@app.post("/web/app")
async def create_app(request: SiteRequest):
    """Cria app."""
    app_result = system.web.create_app(request.name, "multiplatform")
    return app_result


@app.get("/web/apps")
async def list_apps():
    """Lista apps."""
    return system.web.apps


@app.get("/monitor")
async def monitor():
    """Monitora tudo."""
    alerts = system.monitor.check_all()
    return {"alerts": alerts}


@app.get("/actions/log")
async def actions_log():
    """Log de ações."""
    return system.actions.actions_log


@app.post("/chat/raw")
async def chat_raw(request: ChatRequest):
    """Chat com modelo de linguagem puro."""
    if not language_model.loaded:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    response = language_model.generate(request.message)
    return {"response": response}


# ==========================================
# EXECUÇÃO
# ==========================================

if __name__ == "__main__":
    print("=" * 60)
    print("BRANPY SERVER v3 — 100% branpy.com.br")
    print("Sistema completo: IA + Banco + Web + Negócios")
    print("=" * 60)
    print("\nEndpoints disponíveis:")
    print("  GET  /           → Status")
    print("  GET  /status     → Status detalhado")
    print("  POST /chat       → Chat principal")
    print("  GET  /financial/balance → Ver saldo")
    print("  POST /financial/pix     → Enviar PIX")
    print("  POST /business/create   → Criar negócio")
    print("  GET  /business/list     → Listar negócios")
    print("  POST /web/site          → Criar site")
    print("  GET  /web/sites         → Listar sites")
    print("  POST /web/app           → Criar app")
    print("  GET  /web/apps          → Listar apps")
    print("  GET  /monitor           → Monitorar")
    print("  GET  /actions/log       → Log de ações")
    print("  POST /chat/raw          → Chat puro")
    print("\nIniciando servidor na porta 11435...")
    
    uvicorn.run(
        "server_v3:app",
        host="0.0.0.0",
        port=11435,
        reload=False,
        log_level="info"
    )
