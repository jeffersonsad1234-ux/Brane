from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Request, Response
from fastapi.responses import JSONResponse, PlainTextResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import requests as http_requests
import base64
from PIL import Image
from io import BytesIO
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import jwt, JWTError
import asyncio
import resend
import time
import re
import html
import bleach

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ==================== UPLOAD STORAGE ====================
# Diretório local para armazenar imagens otimizadas
# Preparado para trocar por Cloudflare R2 ou S3 no futuro
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

# Railway / local: never crash at import — missing MONGO_URL prevented the app from binding (healthcheck failures).
mongo_url = (os.getenv("MONGO_URL") or "").strip()
db_name = (os.getenv("DB_NAME") or "brane").strip() or "brane"
if not mongo_url:
    mongo_url = "mongodb://127.0.0.1:27017"
    logging.warning(
        "MONGO_URL is not set; using localhost default so the server can start. "
        "Set MONGO_URL (and DB_NAME) in Railway for production."
    )

_mongo_timeout_ms = int(os.getenv("MONGO_SERVER_SELECTION_TIMEOUT_MS", "5000"))
# Mock Database for Sandbox Environment (Memory-based)
class MockCollection:
    def __init__(self, name):
        self.name = name
        self.data = []
    async def find_one(self, query, projection=None):
        for item in self.data:
            match = True
            for k, v in query.items():
                if k.startswith("$"):
                    continue
                if item.get(k) != v:
                    match = False
                    break
            if match: return item
        return None
    async def insert_one(self, doc):
        self.data.append(doc)
        return doc
    async def update_one(self, query, update, upsert=False):
        doc = await self.find_one(query)
        if doc:
            if "$set" in update: doc.update(update["$set"])
            if "$inc" in update:
                for k, v in update["$inc"].items():
                    doc[k] = doc.get(k, 0) + v
            return doc
        elif upsert:
            new_doc = {k: v for k, v in query.items() if not k.startswith("$")}
            if "$set" in update: new_doc.update(update["$set"])
            self.data.append(new_doc)
            return new_doc
    async def update_many(self, query, update, upsert=False):
        for item in self.data:
            match = True
            for k, v in query.items():
                if k.startswith("$"):
                    continue
                if item.get(k) != v:
                    match = False
                    break
            if match:
                if "$set" in update: item.update(update["$set"])
                if "$inc" in update:
                    for k, v in update["$inc"].items():
                        item[k] = item.get(k, 0) + v
    async def delete_one(self, query):
        doc = await self.find_one(query)
        if doc: self.data.remove(doc)
    async def delete_many(self, query):
        self.data = [item for item in self.data if not all(item.get(k) == v for k, v in query.items() if not k.startswith("$"))]
    def find(self, query=None, projection=None):
        query = query or {}
        class Cursor:
            def __init__(self, data): self.data = data
            def sort(self, field, direction=None):
                if isinstance(field, list):
                    for f, d in reversed(field):
                        self.data.sort(key=lambda x: x.get(f, ""), reverse=(d == -1))
                else:
                    self.data.sort(key=lambda x: x.get(field, ""), reverse=(direction == -1))
                return self
            def skip(self, n): self.data = self.data[n:]; return self
            def limit(self, n): self.data = self.data[:n] if n else self.data; return self
            async def to_list(self, n=None): return self.data[:n] if n else self.data
            def __aiter__(self):
                self.iter = iter(self.data)
                return self
            async def __anext__(self):
                try: return next(self.iter)
                except StopIteration: raise StopAsyncIteration
        
        filtered = []
        for item in self.data:
            match = True
            for k, v in query.items():
                if k == "$or":
                    sub_match = False
                    for sub in v:
                        if all(item.get(sk) == sv for sk, sv in sub.items() if not sk.startswith("$")):
                            sub_match = True
                            break
                    if not sub_match:
                        match = False
                        break
                elif k == "$and":
                    for sub in v:
                        for sk, sv in sub.items():
                            if sk == "$or":
                                sub_or = any(item.get(ssk) == ssv for sss in sv for ssk, ssv in sss.items() if not ssk.startswith("$"))
                                if not sub_or:
                                    match = False
                                    break
                elif k.startswith("$"):
                    continue
                elif isinstance(v, dict):
                    item_val = item.get(k)
                    for op, op_val in v.items():
                        if op == "$regex":
                            import re as _re
                            flags = 0
                            if "$options" in v and "i" in v["$options"]:
                                flags = _re.IGNORECASE
                            if not (item_val and _re.search(op_val, str(item_val), flags)):
                                match = False
                                break
                        elif op == "$in":
                            if item_val not in op_val:
                                match = False
                                break
                        elif op == "$ne":
                            if item_val == op_val:
                                match = False
                                break
                        elif op == "$exists":
                            if op_val and k not in item:
                                match = False
                                break
                            elif not op_val and k in item:
                                match = False
                                break
                else:
                    if item.get(k) != v:
                        match = False
                        break
            if match:
                filtered.append(item)
        return Cursor(filtered)
    async def count_documents(self, query=None):
        query = query or {}
        return len(self.find(query).data)
    async def create_index(self, keys, **kwargs):
        pass  # Mock: índices não necessários em memória
    def aggregate(self, pipeline):
        class AggCursor:
            def __init__(self, data): self.data = data; self.iter = iter(data)
            def __aiter__(self): return self
            async def __anext__(self):
                try: return next(self.iter)
                except StopIteration: raise StopAsyncIteration
        return AggCursor([])

class MockDB:
    def __init__(self):
        self.collections = {}
    def __getitem__(self, name):
        if name not in self.collections: self.collections[name] = MockCollection(name)
        return self.collections[name]
    def __getattr__(self, name):
        return self.__getitem__(name)

# Use MongoDB Atlas if MONGO_URL is set, otherwise fallback to MockDB
_use_mongo = bool(mongo_url and mongo_url != "mongodb://127.0.0.1:27017")
if _use_mongo:
    try:
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=_mongo_timeout_ms)
        db = client[db_name]
        logging.info(f"Using MongoDB Atlas: {db_name}")
    except Exception as _e:
        logging.warning(f"MongoDB connection failed ({_e}), falling back to MockDB")
        db = MockDB()
        client = None
else:
    db = MockDB()
    client = None

# Seed initial data for sandbox
def seed_data():
    import uuid
    from datetime import datetime, timezone
    
    # Check if already seeded
    if len(db['social_posts'].data) > 0: return
    
    # Seed social posts
    social_seeds = [
        {
            "post_id": f"post_{uuid.uuid4().hex[:12]}",
            "user_id": "system_seed",
            "user_name": "Jefferson UX",
            "user_picture": "https://api.dicebear.com/7.x/avataaars/svg?seed=Jefferson",
            "content": "iPhone 13 Pro Max 256GB em perfeito estado. Acompanha caixa e carregador original.",
            "image": "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?auto=format&fit=crop&w=800&q=80",
            "title": "iPhone 13 Pro Max 256GB",
            "price": "4.500",
            "category": "Celulares",
            "city": "São Paulo",
            "state": "SP",
            "product_condition": "Usado",
            "likes": [],
            "likes_count": 12,
            "comments_count": 3,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "post_id": f"post_{uuid.uuid4().hex[:12]}",
            "user_id": "system_seed",
            "user_name": "B-Livre Oficial",
            "user_picture": "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
            "content": "Cadeira Gamer Profissional com ajuste de altura e inclinação. Super confortável para longas sessões.",
            "image": "https://images.unsplash.com/photo-1598550476439-6847785fce66?auto=format&fit=crop&w=800&q=80",
            "title": "Cadeira Gamer Profissional",
            "price": "890",
            "category": "Casa e móveis",
            "city": "Rio de Janeiro",
            "state": "RJ",
            "product_condition": "Novo",
            "likes": [],
            "likes_count": 45,
            "comments_count": 8,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "post_id": f"post_{uuid.uuid4().hex[:12]}",
            "user_id": "system_seed",
            "user_name": "Paulo Tech",
            "user_picture": "https://api.dicebear.com/7.x/avataaars/svg?seed=Paulo",
            "content": "PlayStation 5 com 2 controles DualSense e 3 jogos inclusos. Pouco uso, na garantia.",
            "image": "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80",
            "title": "PlayStation 5 + 2 Controles",
            "price": "3.200",
            "category": "Games",
            "city": "Curitiba",
            "state": "PR",
            "product_condition": "Seminovo",
            "likes": [],
            "likes_count": 89,
            "comments_count": 15,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    db['social_posts'].data.extend(social_seeds)
    
    # Seed marketplace products (for /market)
    product_seeds = [
        {
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "seller_id": "system_seed",
            "seller_name": "Jefferson UX",
            "title": "iPhone 13 Pro Max 256GB",
            "description": "iPhone 13 Pro Max 256GB em perfeito estado. Acompanha caixa e carregador original.",
            "price": 4500,
            "category": "Celulares",
            "image": "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?auto=format&fit=crop&w=800&q=80",
            "images": ["https://images.unsplash.com/photo-1632661674596-df8be070a5c5?auto=format&fit=crop&w=800&q=80"],
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "seller_id": "system_seed",
            "seller_name": "B-Livre Oficial",
            "title": "Cadeira Gamer Profissional",
            "description": "Cadeira Gamer Profissional com ajuste de altura e inclinação. Super confortável para longas sessões.",
            "price": 890,
            "category": "Casa e móveis",
            "image": "https://images.unsplash.com/photo-1598550476439-6847785fce66?auto=format&fit=crop&w=800&q=80",
            "images": ["https://images.unsplash.com/photo-1598550476439-6847785fce66?auto=format&fit=crop&w=800&q=80"],
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "seller_id": "system_seed",
            "seller_name": "Paulo Tech",
            "title": "PlayStation 5 + 2 Controles",
            "description": "PlayStation 5 com 2 controles DualSense e 3 jogos inclusos. Pouco uso, na garantia.",
            "price": 3200,
            "category": "Games",
            "image": "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80",
            "images": ["https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80"],
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    db['products'].data.extend(product_seeds)

# Seed apenas para MockDB (em memória)
if isinstance(db, MockDB):
    seed_data()
    logging.info("Using MockDB for sandbox environment")
else:
    logging.info("Using MongoDB Atlas — skipping in-memory seed")
JWT_SECRET = os.environ.get('JWT_SECRET', 'brane-secret-key')
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 72

# Resend configuration
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

APP_NAME = "brane-marketplace"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI()

# ==================== SERVIR ARQUIVOS ESTÁTICOS DE UPLOAD ====================
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

@app.get("/", response_class=PlainTextResponse)
def root():
    return "OK"

@app.get("/health")
def health():
    return {"status": "ok"}

api_router = APIRouter(prefix="/api")

# ==================== RATE LIMITING ====================
# Armazenamento em memória para rate limiting (sem Redis necessário)
_rate_limit_store: dict = {}

def _rate_limit_key(request: Request, action: str) -> str:
    """Gera chave única por IP + ação"""
    forwarded = request.headers.get("X-Forwarded-For")
    ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")
    return f"{action}:{ip}"

def check_rate_limit(request: Request, action: str, max_requests: int, window_seconds: int) -> bool:
    """
    Verifica rate limit. Retorna True se permitido, False se bloqueado.
    Limites recomendados:
    - login: 10 req / 60s
    - register: 5 req / 300s
    - publish: 10 req / 60s
    - message: 30 req / 60s
    """
    key = _rate_limit_key(request, action)
    now = time.time()
    
    if key not in _rate_limit_store:
        _rate_limit_store[key] = []
    
    # Limpar entradas antigas
    _rate_limit_store[key] = [t for t in _rate_limit_store[key] if now - t < window_seconds]
    
    if len(_rate_limit_store[key]) >= max_requests:
        return False
    
    _rate_limit_store[key].append(now)
    return True

# ==================== SANITIZAÇÃO DE INPUTS ====================
ALLOWED_TAGS = []  # Sem HTML permitido em campos de texto

def sanitize_text(value: str, max_length: int = 2000) -> str:
    """Remove HTML/scripts e limita tamanho"""
    if not value:
        return ""
    # Remove tags HTML
    cleaned = bleach.clean(str(value), tags=ALLOWED_TAGS, strip=True)
    # Limita tamanho
    return cleaned[:max_length].strip()

def sanitize_price(value) -> float:
    """Valida e sanitiza preço"""
    try:
        price = float(str(value).replace(",", "."))
        if price < 0 or price > 999999999:
            raise ValueError("Preço inválido")
        return round(price, 2)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Preço inválido")

# ==================== SISTEMA DE UPLOAD DE IMAGENS ====================
# Configurações de imagem
IMAGE_MAX_SIZE_MB = 10
IMAGE_MAX_SIZE_BYTES = IMAGE_MAX_SIZE_MB * 1024 * 1024
THUMBNAIL_SIZE = (400, 400)   # Thumbnail para feed
FULL_SIZE = (1200, 1200)       # Imagem grande para detalhe do anúncio
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"}

def get_backend_url(request: Request) -> str:
    """Retorna a URL base do backend para montar URLs de arquivos"""
    # Tenta pegar do env primeiro (Railway configura isso)
    backend_url = os.getenv("BACKEND_URL", "").strip()
    if backend_url:
        return backend_url.rstrip("/")
    # Fallback: usa o host da requisição
    scheme = request.headers.get("X-Forwarded-Proto", request.url.scheme)
    host = request.headers.get("X-Forwarded-Host", request.headers.get("host", "localhost:8080"))
    return f"{scheme}://{host}"

async def process_and_save_image(
    file_data: bytes,
    mime_type: str,
    request: Request
) -> dict:
    """
    Processa imagem:
    1. Valida tipo e tamanho
    2. Converte para WebP
    3. Gera thumbnail 400x400
    4. Gera versão full 1200x1200
    5. Salva em disco local
    6. Retorna metadados com URLs
    
    Preparado para trocar por Cloudflare R2 / S3 no futuro:
    - Basta trocar o bloco de salvamento por upload para storage externo
    - As URLs retornadas já seguem o padrão esperado pelo frontend
    """
    if len(file_data) > IMAGE_MAX_SIZE_BYTES:
        raise HTTPException(status_code=400, detail=f"Imagem muito grande. Máximo: {IMAGE_MAX_SIZE_MB}MB")
    
    if mime_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Tipo de arquivo não permitido. Use: JPEG, PNG, WebP, GIF ou BMP")
    
    try:
        img = Image.open(BytesIO(file_data))
    except Exception:
        raise HTTPException(status_code=400, detail="Arquivo de imagem inválido ou corrompido")
    
    # Converter para RGB (necessário para WebP)
    if img.mode in ("RGBA", "P", "LA"):
        background = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == "P":
            img = img.convert("RGBA")
        if img.mode in ("RGBA", "LA"):
            background.paste(img, mask=img.split()[-1])
        img = background
    elif img.mode != "RGB":
        img = img.convert("RGB")
    
    original_width, original_height = img.size
    file_id = uuid.uuid4().hex
    
    # Gerar thumbnail (400x400, crop centralizado)
    thumb = img.copy()
    thumb.thumbnail(THUMBNAIL_SIZE, Image.LANCZOS)
    # Crop centralizado para manter proporção quadrada no feed
    thumb_w, thumb_h = thumb.size
    min_dim = min(thumb_w, thumb_h)
    left = (thumb_w - min_dim) // 2
    top = (thumb_h - min_dim) // 2
    thumb = thumb.crop((left, top, left + min_dim, top + min_dim))
    thumb = thumb.resize(THUMBNAIL_SIZE, Image.LANCZOS)
    
    thumb_buf = BytesIO()
    thumb.save(thumb_buf, format="WEBP", quality=75, optimize=True)
    thumb_data = thumb_buf.getvalue()
    
    # Gerar versão full (1200x1200 máximo, mantém proporção)
    full = img.copy()
    full.thumbnail(FULL_SIZE, Image.LANCZOS)
    full_buf = BytesIO()
    full.save(full_buf, format="WEBP", quality=85, optimize=True)
    full_data = full_buf.getvalue()
    
    # Salvar arquivos em disco
    thumb_filename = f"thumb_{file_id}.webp"
    full_filename = f"full_{file_id}.webp"
    
    thumb_path = UPLOADS_DIR / thumb_filename
    full_path = UPLOADS_DIR / full_filename
    
    # Operação de I/O em thread separada para não bloquear o event loop
    await asyncio.to_thread(_write_file, thumb_path, thumb_data)
    await asyncio.to_thread(_write_file, full_path, full_data)
    
    # Construir URLs
    base_url = get_backend_url(request)
    thumbnail_url = f"{base_url}/uploads/{thumb_filename}"
    image_url = f"{base_url}/uploads/{full_filename}"
    
    return {
        "imageUrl": image_url,
        "thumbnailUrl": thumbnail_url,
        "filename": full_filename,
        "thumbnailFilename": thumb_filename,
        "mimeType": "image/webp",
        "size": len(full_data),
        "thumbnailSize": len(thumb_data),
        "width": full.size[0],
        "height": full.size[1],
        "originalWidth": original_width,
        "originalHeight": original_height,
    }

def _write_file(path: Path, data: bytes):
    """Escreve arquivo em disco (executado em thread separada)"""
    with open(path, "wb") as f:
        f.write(data)

async def process_base64_image(image_data: str, request: Request) -> dict:
    """
    Processa imagem em base64 (compatibilidade com fluxo legado).
    Converte para bytes e chama process_and_save_image.
    """
    if not image_data or not image_data.startswith("data:image"):
        return {"imageUrl": image_data, "thumbnailUrl": image_data}
    
    try:
        header, encoded = image_data.split(",", 1)
        mime_type = header.split(":")[1].split(";")[0] if ":" in header else "image/jpeg"
        raw = base64.b64decode(encoded)
        return await process_and_save_image(raw, mime_type, request)
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Erro ao processar imagem base64: {e}")
        return {"imageUrl": image_data, "thumbnailUrl": image_data}

# ==================== ENDPOINT DE UPLOAD ====================
@api_router.post("/upload")
async def upload_file(request: Request, file: UploadFile = File(...)):
    """
    Upload de arquivo de imagem.
    Retorna URLs para thumbnail e imagem completa em WebP.
    Preparado para trocar storage por Cloudflare R2 ou S3 no futuro.
    """
    # Rate limit: 20 uploads por minuto por IP
    if not check_rate_limit(request, "upload", 20, 60):
        raise HTTPException(status_code=429, detail="Muitos uploads. Aguarde um momento.")
    
    # Verificar autenticação
    try:
        await get_current_user(request)
    except HTTPException:
        raise HTTPException(status_code=401, detail="Autenticação necessária para upload")
    
    # Validar tipo MIME
    content_type = file.content_type or ""
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Tipo de arquivo não permitido")
    
    # Ler dados
    file_data = await file.read()
    
    result = await process_and_save_image(file_data, content_type, request)
    return result

@api_router.post("/upload/multiple")
async def upload_multiple_files(request: Request, files: List[UploadFile] = File(...)):
    """Upload de múltiplas imagens de uma vez"""
    if not check_rate_limit(request, "upload", 20, 60):
        raise HTTPException(status_code=429, detail="Muitos uploads. Aguarde um momento.")
    
    try:
        await get_current_user(request)
    except HTTPException:
        raise HTTPException(status_code=401, detail="Autenticação necessária para upload")
    
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Máximo de 10 imagens por vez")
    
    results = []
    for file in files:
        content_type = file.content_type or ""
        if content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(status_code=400, detail=f"Tipo não permitido: {file.filename}")
        file_data = await file.read()
        result = await process_and_save_image(file_data, content_type, request)
        results.append(result)
    
    return {"images": results}

# Endpoint legado de compatibilidade (CreateStorePage usa /api/upload e espera {path})
@api_router.get("/files/{filename}")
async def serve_file(filename: str):
    """Serve arquivos de upload (compatibilidade com código legado)"""
    file_path = UPLOADS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    return FileResponse(str(file_path))

# ==================== MIDDLEWARE ====================
@app.middleware("http")
async def add_no_cache_headers(request, call_next):
    response = await call_next(request)
    # Apenas para rotas da API
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    # Cache longo para arquivos de upload (imagens otimizadas)
    elif request.url.path.startswith("/uploads/"):
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    return response

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
app.include_router(api_router)
# ==================== MODELS ====================
class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "buyer"

class EmailVerifyRequest(BaseModel):
    email: str

class EmailVerifyConfirm(BaseModel):
    email: str
    code: str

class SocialPostCreate(BaseModel):
    content: str
    image: Optional[str] = None
    title: Optional[str] = None
    price: Optional[str] = None
    category: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    product_condition: Optional[str] = None
    description: Optional[str] = None
    availability: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_whatsapp: Optional[str] = None

class ReportCreate(BaseModel):
    tipo: str  # 'anuncio' ou 'usuario'
    post_id: Optional[str] = None
    reported_user_id: Optional[str] = None
    motivo: str
    descricao: Optional[str] = None

class SocialCommentCreate(BaseModel):
    content: str

class UserLogin(BaseModel):
    email: str
    password: str

class ProductCreate(BaseModel):
    title: str
    description: str
    price: float
    category: str
    city: Optional[str] = None
    location: Optional[str] = None
    images: List[str] = []
    product_type: Optional[str] = "store"  # store, unique, secondhand
    condition: Optional[str] = None  # new, like_new, good, fair

class ProductUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    city: Optional[str] = None
    location: Optional[str] = None
    images: Optional[List[str]] = None
    product_type: Optional[str] = None
    condition: Optional[str] = None

class CartItemAdd(BaseModel):
    product_id: str
    quantity: int = 1

class ShippingAddress(BaseModel):
    name: str
    cpf: str
    phone: str
    street: str
    number: str
    complement: Optional[str] = ""
    neighborhood: str
    city: str
    state: str
    zip_code: str

class OrderCreate(BaseModel):
    affiliate_code: Optional[str] = None
    shipping_address: Optional[ShippingAddress] = None
    shipping_option: Optional[str] = "standard"
    coupon_code: Optional[str] = None
    payment_method: Optional[str] = "pix"  # pix, ted, paypal

class WithdrawalRequest(BaseModel):
    amount: float
    method: str

class RoleSwitch(BaseModel):
    role: str

class BankDetails(BaseModel):
    bank_name: Optional[str] = None
    account_name: Optional[str] = None
    account_number: Optional[str] = None
    pix_key: Optional[str] = None

class CommissionUpdate(BaseModel):
    platform_commission: Optional[float] = None
    affiliate_commission: Optional[float] = None

class PageUpdate(BaseModel):
    content: str

class SupportMessage(BaseModel):
    subject: str
    message: str

class SupportReply(BaseModel):
    reply: str

class PasswordReset(BaseModel):
    email: str

class PasswordResetVerify(BaseModel):
    email: str
    code: str
    new_password: str

class FinancialSettings(BaseModel):
    paypal_email: Optional[str] = None
    paypal_enabled: bool = False
    bank_name: Optional[str] = None
    bank_branch: Optional[str] = None
    bank_account_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    ted_enabled: bool = True
    pix_key: Optional[str] = None
    pix_key_type: Optional[str] = None  # cpf, email, phone, random
    pix_enabled: bool = True

class ShippingOption(BaseModel):
    name: str
    price: float
    days: str
    enabled: bool = True

class ShippingSettings(BaseModel):
    options: List[ShippingOption] = []

class SellerTermsAccept(BaseModel):
    accepted: bool = True

class Sale(BaseModel):
    sale_id: Optional[str] = None
    user_id: str
    customer_name: str
    value: float
    status: str = "pending"
    created_at: Optional[str] = None

# ==================== STORE MODELS ====================
class StoreCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    logo: Optional[str] = ""
    banner: Optional[str] = ""
    category: Optional[str] = ""
    business_hours: Optional[str] = ""  # Ex: "Seg-Sex: 9h-18h, Sáb: 9h-13h"

class StoreUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    logo: Optional[str] = None
    banner: Optional[str] = None
    category: Optional[str] = None
    business_hours: Optional[str] = None

class PlanUpgrade(BaseModel):
    plan: str  # 'free', 'pro', 'premium'

class StoreChatMessage(BaseModel):
    message: str
    store_id: Optional[str] = None  # optional - resolved from path

class AdCreate(BaseModel):
    title: str
    image: str
    link: str
    position: Optional[str] = "between_products"  # 'top', 'between_products', 'sidebar', 'footer'

class AdUpdate(BaseModel):
    title: Optional[str] = None
    image: Optional[str] = None
    link: Optional[str] = None
    position: Optional[str] = None
    active: Optional[bool] = None

# ==================== HELPERS ====================
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_jwt(user_id: str, email: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    session_token = request.cookies.get("session_token")
    if session_token:
        session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
        if session:
            expires_at = session["expires_at"]
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at > datetime.now(timezone.utc):
                user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
                if user:
                    return user
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            user = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0})
            if user:
                return user
        except JWTError:
            pass
    raise HTTPException(status_code=401, detail="Nao autorizado")

async def require_admin(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    return user

async def require_seller(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") not in ("seller", "admin"):
        raise HTTPException(status_code=403, detail="Acesso de vendedor necessario")
    return user


def init_storage():
    # Storage local configurado - uploads salvos em disco
    UPLOADS_DIR.mkdir(exist_ok=True)
    return True

def clean_user(user: dict) -> dict:
    return {k: v for k, v in user.items() if k not in ("password_hash", "_id")}


# ==================== EMAIL VALIDATION ====================

# Blocked disposable/temporary email domains (most common ones)
DISPOSABLE_EMAIL_DOMAINS = {
    "tempmail.com", "10minutemail.com", "guerrillamail.com", "mailinator.com",
    "throwawaymail.com", "trashmail.com", "yopmail.com", "temp-mail.org",
    "fakeinbox.com", "sharklasers.com", "getnada.com", "maildrop.cc",
    "mohmal.com", "dispostable.com", "mailnesia.com", "emailondeck.com",
    "spambox.us", "mytrashmail.com", "tempinbox.com", "tempmail.net",
    "tempmailaddress.com", "minuteinbox.com", "disposablemail.com",
    "mintemail.com", "mailcatch.com", "fake-mail.net",
}

# Regex que aceita emails válidos com pontos nos domínios (ex: gmail.com, outlook.com)
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")

def validate_email_strict(email: str) -> tuple:
    """Validate email format and check against disposable domains.
    Returns (is_valid, error_message)"""
    if not email or len(email) > 254:
        return False, "Email invalido"
    email = email.strip().lower()
    if not EMAIL_REGEX.match(email):
        return False, "Formato de email invalido"
    try:
        domain = email.split("@")[1]
    except IndexError:
        return False, "Email invalido"
    
    local_part = email.split("@")[0]
    if len(local_part) < 1:
        return False, "Email muito curto"
    
    return True, ""

# ==================== AUTH ROUTES ====================
@api_router.post("/auth/register")
async def register(data: UserRegister, request: Request):
    # Rate limit: 5 cadastros por IP a cada 5 minutos
    if not check_rate_limit(request, "register", 5, 300):
        raise HTTPException(status_code=429, detail="Muitas tentativas de cadastro. Aguarde alguns minutos.")
    
    # Sanitizar inputs
    name = sanitize_text(data.name, 100)
    if len(name) < 2:
        raise HTTPException(status_code=400, detail="Nome inválido")
    
    # Strict email validation
    ok, err = validate_email_strict(data.email)
    if not ok:
        raise HTTPException(status_code=400, detail=err)
    email_normalized = data.email.strip().lower()
    existing = await db.users.find_one({"email": email_normalized}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email ja cadastrado")
    # Validate password strength
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Senha deve ter no minimo 6 caracteres")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    register_role = data.role if data.role in ("buyer", "seller", "affiliate", "admin") else "buyer"
    user = {
        "user_id": user_id, "name": name, "email": email_normalized,
        "password_hash": hash_password(data.password), "role": register_role,
        "picture": "", "bio": "", "cover_photo": "",
        "bank_details": {}, "is_blocked": False,
        "email_verified": True,  # Auto-verified (no SMTP configured)
        "brane_coins": 0, "is_vip": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    await db.wallets.insert_one({"user_id": user_id, "available": 0.0, "held": 0.0})

    token = create_jwt(user_id, email_normalized, register_role)
    return {
        "token": token,
        "user": clean_user(user)
    }

@api_router.post("/auth/send-verification")
async def send_verification(data: EmailVerifyRequest, request: Request):
    """Resend verification code for current user"""
    email_normalized = data.email.strip().lower()
    user = await db.users.find_one({"email": email_normalized}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Email nao encontrado")
    if user.get("email_verified"):
        return {"message": "Email ja verificado", "already_verified": True}
    import random
    code = str(random.randint(100000, 999999))
    await db.email_verifications.delete_many({"email": email_normalized})
    await db.email_verifications.insert_one({
        "email": email_normalized, "code": code, "user_id": user["user_id"],
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    logger.info(f"Re-sent verification code for {email_normalized}: {code}")
    return {"message": "Codigo reenviado", "verification_code": code}

@api_router.post("/auth/verify-email")
async def verify_email(data: EmailVerifyConfirm):
    """Confirm email with 6-digit code"""
    email_normalized = data.email.strip().lower()
    record = await db.email_verifications.find_one({"email": email_normalized, "code": data.code}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=400, detail="Codigo invalido")
    expires = datetime.fromisoformat(record["expires_at"])
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Codigo expirado, solicite um novo")
    await db.users.update_one({"email": email_normalized}, {"$set": {"email_verified": True}})
    await db.email_verifications.delete_many({"email": email_normalized})
    updated = await db.users.find_one({"email": email_normalized}, {"_id": 0})
    return {"message": "Email verificado com sucesso", "user": clean_user(updated)}

@api_router.post("/auth/login")
async def login(data: UserLogin, request: Request):
    # Rate limit: 10 tentativas de login por IP a cada 60 segundos
    if not check_rate_limit(request, "login", 10, 60):
        raise HTTPException(status_code=429, detail="Muitas tentativas de login. Aguarde um momento.")
    
    email_normalized = data.email.strip().lower()
    user = await db.users.find_one({"email": email_normalized}, {"_id": 0})
    if not user or not verify_password(data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    if user.get("is_blocked"):
        raise HTTPException(status_code=403, detail="Conta bloqueada")
    token = create_jwt(user["user_id"], user["email"], user["role"])
    return {"token": token, "user": clean_user(user)}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return clean_user(user)

@api_router.post("/auth/session")
async def exchange_session(request: Request):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    try:
        resp = http_requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}, timeout=10
        )
        resp.raise_for_status()
        auth_data = resp.json()
    except Exception as e:
        logger.error(f"Auth exchange failed: {e}")
        raise HTTPException(status_code=401, detail="Autenticacao falhou")
    email = auth_data.get("email")
    name = auth_data.get("name")
    picture = auth_data.get("picture", "")
    session_token = auth_data.get("session_token")
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"user_id": user_id}, {"$set": {"name": name, "picture": picture}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id, "name": name, "email": email,
            "password_hash": "", "role": "buyer", "picture": picture,
            "bank_details": {}, "is_blocked": False,
            "brane_coins": 0, "is_vip": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        await db.wallets.insert_one({"user_id": user_id, "available": 0.0, "held": 0.0})
    if session_token:
        await db.user_sessions.insert_one({
            "session_token": session_token, "user_id": user_id,
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    response = JSONResponse(content=clean_user(user))
    response.set_cookie(
        key="session_token", value=session_token,
        httponly=True, secure=True, samesite="none", path="/", max_age=7*24*60*60
    )
    return response

@api_router.post("/auth/logout")
async def logout(request: Request):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response = JSONResponse(content={"message": "Logout realizado"})
    response.delete_cookie("session_token", path="/")
    return response

@api_router.post("/auth/forgot-password")
async def forgot_password(data: PasswordReset):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Email nao encontrado")
    import random
    code = str(random.randint(100000, 999999))
    await db.password_resets.delete_many({"email": data.email})
    await db.password_resets.insert_one({
        "email": data.email, "code": code,
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    logger.info(f"Password reset code for {data.email}: {code}")
    return {"message": "Codigo de recuperacao enviado", "code": code}

@api_router.post("/auth/reset-password")
async def reset_password(data: PasswordResetVerify):
    reset = await db.password_resets.find_one({"email": data.email, "code": data.code}, {"_id": 0})
    if not reset:
        raise HTTPException(status_code=400, detail="Codigo invalido")
    expires = datetime.fromisoformat(reset["expires_at"])
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Codigo expirado")
    await db.users.update_one({"email": data.email}, {"$set": {"password_hash": hash_password(data.new_password)}})
    await db.password_resets.delete_many({"email": data.email})
    return {"message": "Senha alterada com sucesso"}

# ==================== USER ROUTES ====================
@api_router.get("/users/profile")
async def get_profile(request: Request):
    user = await get_current_user(request)
    wallet = await db.wallets.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return {**clean_user(user), "wallet": wallet}

@api_router.put("/users/profile")
async def update_profile(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    allowed_fields = {"name", "picture", "phone", "bio", "city", "state"}
    updates = {}
    for k, v in body.items():
        if k in allowed_fields:
            updates[k] = sanitize_text(str(v), 500) if isinstance(v, str) else v
    if updates:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": updates})
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return clean_user(updated)

@api_router.put("/users/role")
async def switch_role(data: RoleSwitch, request: Request):
    user = await get_current_user(request)
    if data.role not in ("buyer", "seller", "affiliate"):
        raise HTTPException(status_code=400, detail="Papel invalido")
    if user.get("role") == "admin":
        raise HTTPException(status_code=400, detail="Admin nao pode trocar de papel")
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"role": data.role}})
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    token = create_jwt(updated["user_id"], updated["email"], updated["role"])
    return {"token": token, "user": clean_user(updated)}

@api_router.put("/users/bank-details")
async def update_bank_details(data: BankDetails, request: Request):
    user = await get_current_user(request)
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"bank_details": data.model_dump()}})
    return {"message": "Dados bancarios atualizados"}

@api_router.put("/users/profile-extended")
async def update_profile_extended(request: Request):
    """Update extended profile fields: bio, cover_photo, phone"""
    user = await get_current_user(request)
    body = await request.json()
    allowed = {"bio", "cover_photo", "phone", "name", "picture", "city", "state"}
    updates = {}
    for k, v in body.items():
        if k in allowed:
            updates[k] = sanitize_text(str(v), 500) if isinstance(v, str) else v
    if updates:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": updates})
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return clean_user(updated)

@api_router.get("/users/public/{user_id}")
async def get_public_user_profile(user_id: str):
    """Public user profile for social network"""
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Perfil nao encontrado")
    # Return only public fields
    return {
        "user_id": user["user_id"],
        "name": user.get("name", ""),
        "picture": user.get("picture", ""),
        "cover_photo": user.get("cover_photo", ""),
        "bio": user.get("bio", ""),
        "phone": user.get("phone", ""),
        "city": user.get("city", ""),
        "state": user.get("state", ""),
        "role": user.get("role", "buyer"),
        "created_at": user.get("created_at", "")
    }

# ==================== BRANE SOCIAL ROUTES ====================
@api_router.get("/social/profile")
async def get_social_profile():
    return {"status": "ok"}

@api_router.post("/social/posts")
async def create_social_post(data: SocialPostCreate, request: Request):
    # Rate limit: 10 posts por minuto por IP
    if not check_rate_limit(request, "publish", 10, 60):
        raise HTTPException(status_code=429, detail="Muitas publicações. Aguarde um momento.")
    
    user = await get_current_user(request)
    if not data.content or len(data.content.strip()) < 1:
        raise HTTPException(status_code=400, detail="Conteudo vazio")
    
    # Sanitizar conteúdo
    content = sanitize_text(data.content, 2000)
    title = sanitize_text(data.title or "", 200)
    description = sanitize_text(data.description or "", 2000)
    
    post_id = f"post_{uuid.uuid4().hex[:12]}"
    post = {
        "post_id": post_id,
        "user_id": user["user_id"],
        "user_name": user.get("name", ""),
        "user_picture": user.get("picture", ""),
        "content": content,
        "image": data.image or "",
        "title": title,
        "price": data.price,
        "category": data.category,
        "state": data.state,
        "city": data.city,
        "product_condition": data.product_condition,
        "description": description,
        "availability": data.availability,
        "contact_phone": sanitize_text(data.contact_phone or "", 20),
        "contact_whatsapp": sanitize_text(data.contact_whatsapp or "", 20),
        "likes": [],
        "likes_count": 0,
        "comments_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.social_posts.insert_one(post)
    return {k: v for k, v in post.items() if k != "_id"}

@api_router.get("/social/posts")
async def list_social_posts(page: int = 1, limit: int = 20, user_id: Optional[str] = None):
    query = {}
    if user_id:
        query["user_id"] = user_id
    # Excluir posts bloqueados
    query["is_blocked"] = {"$ne": True}
    skip = (page - 1) * limit
    posts = await db.social_posts.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.social_posts.count_documents(query)
    return {"posts": posts, "total": total, "page": page}

@api_router.post("/social/posts/{post_id}/like")
async def like_social_post(post_id: str, request: Request):
    user = await get_current_user(request)
    post = await db.social_posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post nao encontrado")
    likes = post.get("likes", [])
    if user["user_id"] in likes:
        # Unlike
        await db.social_posts.update_one(
            {"post_id": post_id},
            {"$pull": {"likes": user["user_id"]}, "$inc": {"likes_count": -1}}
        )
        return {"liked": False}
    else:
        # Like
        await db.social_posts.update_one(
            {"post_id": post_id},
            {"$addToSet": {"likes": user["user_id"]}, "$inc": {"likes_count": 1}}
        )
        return {"liked": True}

@api_router.get("/social/posts/{post_id}/comments")
async def get_post_comments(post_id: str, page: int = 1, limit: int = 20):
    skip = (page - 1) * limit
    comments = await db.social_comments.find({"post_id": post_id}, {"_id": 0}).sort("created_at", 1).skip(skip).limit(limit).to_list(limit)
    total = await db.social_comments.count_documents({"post_id": post_id})
    return {"comments": comments, "total": total}

@api_router.post("/social/posts/{post_id}/comments")
async def add_post_comment(post_id: str, data: SocialCommentCreate, request: Request):
    # Rate limit: 30 comentários por minuto por IP
    if not check_rate_limit(request, "message", 30, 60):
        raise HTTPException(status_code=429, detail="Muitas mensagens. Aguarde um momento.")
    
    user = await get_current_user(request)
    post = await db.social_posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post nao encontrado")
    
    content = sanitize_text(data.content, 1000)
    if not content:
        raise HTTPException(status_code=400, detail="Comentário vazio")
    
    comment_id = f"comment_{uuid.uuid4().hex[:12]}"
    comment = {
        "comment_id": comment_id,
        "post_id": post_id,
        "user_id": user["user_id"],
        "user_name": user.get("name", ""),
        "user_picture": user.get("picture", ""),
        "content": content,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.social_comments.insert_one(comment)
    await db.social_posts.update_one({"post_id": post_id}, {"$inc": {"comments_count": 1}})
    return {k: v for k, v in comment.items() if k != "_id"}

@api_router.get("/social/posts/{post_id}")
async def get_social_post(post_id: str):
    post = await db.social_posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post nao encontrado")
    return post

# ==================== DESAPEGA ROUTES ====================
@api_router.get("/desapega")
async def list_desapega_posts(page: int = 1, limit: int = 20, search: Optional[str] = None):
    query: dict = {
        "$or": [
            {"product_type": "secondhand"},
            {"source": "desapega"},
            {"condition": {"$in": ["used", "like_new", "good", "fair"]}},
            {"product_condition": {"$exists": True}}
        ]
    }
    if search:
        query["$and"] = [{"$or": [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]}]
    skip = (page - 1) * limit
    posts = await db.products.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    # Normalizar imagens para retornar thumbnailUrl e imageUrl
    for p in posts:
        _normalize_product_images(p)
    total = await db.products.count_documents(query)
    return {"posts": posts, "products": posts, "total": total, "page": page}

# ==================== SELLER TERMS ====================
@api_router.get("/seller/terms-status")
async def get_seller_terms_status(request: Request):
    user = await get_current_user(request)
    terms = await db.seller_terms.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return {"accepted": bool(terms and terms.get("accepted"))}

@api_router.post("/seller/accept-terms")
async def accept_seller_terms(request: Request):
    user = await get_current_user(request)
    await db.seller_terms.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"user_id": user["user_id"], "accepted": True, "accepted_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"message": "Termos aceitos"}

# ==================== MESSAGES ====================
@api_router.post("/messages")
async def send_message(request: Request):
    # Rate limit: 30 mensagens por minuto por IP
    if not check_rate_limit(request, "message", 30, 60):
        raise HTTPException(status_code=429, detail="Muitas mensagens. Aguarde um momento.")
    
    user = await get_current_user(request)
    body = await request.json()
    
    content = sanitize_text(body.get("message", ""), 2000)
    if not content:
        raise HTTPException(status_code=400, detail="Mensagem vazia")
    
    msg_id = f"msg_{uuid.uuid4().hex[:12]}"
    msg = {
        "message_id": msg_id,
        "sender_id": user["user_id"],
        "sender_name": user.get("name", ""),
        "recipient_id": body.get("recipient_id", ""),
        "product_id": body.get("product_id", ""),
        "message": content,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.messages.insert_one(msg)
    return {k: v for k, v in msg.items() if k != "_id"}

@api_router.get("/messages")
async def get_messages(request: Request):
    user = await get_current_user(request)
    msgs = await db.messages.find(
        {"$or": [{"sender_id": user["user_id"]}, {"recipient_id": user["user_id"]}]},
        {"_id": 0}
    ).sort("created_at", -1).limit(100).to_list(100)
    return {"messages": msgs}

# ==================== NOTIFICAÇÕES ====================
@api_router.get("/notifications")
async def get_notifications(request: Request):
    user = await get_current_user(request)
    notifs = db.notifications.find({"user_id": user["user_id"]}).sort("created_at", -1)
    result = []
    async for n in notifs:
        n.pop("_id", None)
        result.append(n)
    return {"notifications": result}

# ==================== PERFIL ====================
@api_router.get("/social/profile")
async def get_social_profile_auth(request: Request):
    user = await get_current_user(request)
    profile = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not profile:
        profile = user
    return clean_user(profile)

# ==================== DENÚNCIAS ====================
@api_router.post("/social/reports")
async def create_report(data: ReportCreate, request: Request):
    user = await get_current_user(request)
    report_id = f"report_{uuid.uuid4().hex[:12]}"
    report = {
        "report_id": report_id,
        "tipo": data.tipo,
        "post_id": data.post_id or "",
        "reported_user_id": data.reported_user_id or "",
        "reporter_id": user["user_id"],
        "motivo": sanitize_text(data.motivo, 200),
        "descricao": sanitize_text(data.descricao or "", 1000),
        "status": "pendente",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reports.insert_one(report)
    return {k: v for k, v in report.items() if k != "_id"}

# admin/reports and admin/reports/{id}/action are defined above in the B Livre section
# Legacy update endpoint kept for backward compatibility
@api_router.put("/admin/reports/{report_id}")
async def update_report_status_legacy(report_id: str, request: Request):
    await require_admin(request)
    body = await request.json()
    status = body.get("status", "resolvido")
    await db.reports.update_one({"report_id": report_id}, {"$set": {"status": status}})
    return {"ok": True}

# ==================== HELPERS DE IMAGEM ====================
def _normalize_product_images(product: dict) -> dict:
    """
    Normaliza campos de imagem do produto para incluir thumbnailUrl e imageUrl.
    Mantém compatibilidade com produtos antigos que usam base64 ou URLs externas.
    """
    images = product.get("images") or []
    image = product.get("image") or ""
    
    # Se já tem imageUrl e thumbnailUrl, não precisa normalizar
    if product.get("imageUrl") and product.get("thumbnailUrl"):
        return product
    
    # Pegar primeira imagem disponível
    first_image = images[0] if images else image
    
    # Se é base64, usar como está (legado)
    if first_image and first_image.startswith("data:image"):
        product["imageUrl"] = first_image
        product["thumbnailUrl"] = first_image
    elif first_image:
        product["imageUrl"] = first_image
        product["thumbnailUrl"] = product.get("thumbnailUrl") or first_image
    
    return product

# ==================== PRODUCT ROUTES ====================
@api_router.get("/products")
async def list_products(
    search: Optional[str] = None,
    category: Optional[str] = None,
    city: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None
):
    # Construir query base: aceitar produtos ativos ou sem status definido
    query: dict = {
        "$or": [
            {"status": "active"},
            {"status": {"$exists": False}},
            {"status": ""}
        ],
        "$and": [
            {"$or": [
                {"is_deleted": False},
                {"is_deleted": {"$exists": False}}
            ]}
        ]
    }
    if search:
        # Sanitizar busca
        search_clean = sanitize_text(search, 100)
        query["$or"] = [
            {"title": {"$regex": search_clean, "$options": "i"}},
            {"description": {"$regex": search_clean, "$options": "i"}}
        ]
    if category:
        query["category"] = category
    if city:
        query["city"] = {"$regex": sanitize_text(city, 100), "$options": "i"}
    
    skip = (page - 1) * limit
    # Projeção otimizada: apenas campos necessários para o feed
    # thumbnailUrl é servido no feed, imageUrl apenas no detalhe
    products = await db.products.find(
        query,
        {
            "_id": 0,
            "product_id": 1,
            "title": 1,
            "price": 1,
            "city": 1,
            "state": 1,
            "image": 1,
            "images": {"$slice": 1},
            "imageUrl": 1,
            "thumbnailUrl": 1,
            "seller_id": 1,
            "seller_name": 1,
            "category": 1,
            "condition": 1,
            "product_type": 1,
            "created_at": 1
        }
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Normalizar imagens para todos os produtos
    for p in products:
        _normalize_product_images(p)
    
    total = await db.products.count_documents(query)
    return {"products": products, "total": total, "page": page, "pages": max(1, (total + limit - 1) // limit)}

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Produto nao encontrado")
    seller = await db.users.find_one({"user_id": product["seller_id"]}, {"_id": 0, "password_hash": 0})
    # Get seller's store slug if exists
    store = await db.stores.find_one({"owner_id": product["seller_id"]}, {"_id": 0})
    if seller and store:
        seller["store_slug"] = store.get("slug")
        seller["store_name"] = store.get("name")
    # Normalizar imagens
    _normalize_product_images(product)
    return {**product, "seller": seller}

@api_router.post("/products")
async def create_product(data: ProductCreate, request: Request):
    # Rate limit: 10 publicações por minuto por IP
    if not check_rate_limit(request, "publish", 10, 60):
        raise HTTPException(status_code=429, detail="Muitas publicações. Aguarde um momento.")
    
    user = await require_seller(request)
    
    # Sanitizar inputs
    title = sanitize_text(data.title, 200)
    description = sanitize_text(data.description, 3000)
    category = sanitize_text(data.category, 100)
    city = sanitize_text(data.city or "", 100)
    
    if not title:
        raise HTTPException(status_code=400, detail="Título obrigatório")
    if not description:
        raise HTTPException(status_code=400, detail="Descrição obrigatória")
    
    price = sanitize_price(data.price)
    
    if category in ("imoveis", "automoveis") and not city:
        raise HTTPException(status_code=400, detail="Cidade obrigatoria para imoveis/automoveis")
    
    product_id = f"prod_{uuid.uuid4().hex[:12]}"
    
    # Processar imagens
    # Suporta tanto URLs diretas (novo fluxo com upload) quanto base64 (legado)
    processed_images = []
    thumbnail_url = ""
    image_url = ""
    
    for img in (data.images or []):
        if img.startswith("data:image"):
            # Legado: base64 - processar e converter para WebP
            try:
                img_meta = await process_base64_image(img, request)
                processed_images.append(img_meta.get("imageUrl", img))
                if not thumbnail_url:
                    thumbnail_url = img_meta.get("thumbnailUrl", img)
                    image_url = img_meta.get("imageUrl", img)
            except Exception:
                # Fallback: usar como está se falhar
                processed_images.append(img)
                if not thumbnail_url:
                    thumbnail_url = img
                    image_url = img
        else:
            # URL direta (novo fluxo ou URL externa)
            processed_images.append(img)
            if not thumbnail_url:
                thumbnail_url = img
                image_url = img
    
    product = {
        "product_id": product_id,
        "title": title,
        "description": description,
        "price": price,
        "category": category,
        "city": city,
        "location": sanitize_text(data.location or "", 200),
        "image": image_url or (processed_images[0] if processed_images else ""),
        "images": processed_images,
        "imageUrl": image_url,
        "thumbnailUrl": thumbnail_url,
        "product_type": data.product_type or "store",
        "condition": data.condition or "new",
        "seller_id": user["user_id"],
        "seller_name": user["name"],
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.products.insert_one(product)
    # Update store products count
    await db.stores.update_one(
        {"owner_id": user["user_id"]},
        {"$inc": {"products_count": 1}}
    )
    return {k: v for k, v in product.items() if k != "_id"}

@api_router.put("/products/{product_id}")
async def update_product(product_id: str, data: ProductUpdate, request: Request):
    user = await require_seller(request)
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Produto nao encontrado")
    if product["seller_id"] != user["user_id"] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Sem permissao")
    updates = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    # Sanitizar campos de texto
    for field in ["title", "description", "category", "city", "location"]:
        if field in updates and isinstance(updates[field], str):
            updates[field] = sanitize_text(updates[field], 3000 if field == "description" else 200)
    if updates:
        await db.products.update_one({"product_id": product_id}, {"$set": updates})
    updated = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    _normalize_product_images(updated)
    return updated

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, request: Request):
    user = await require_seller(request)

    product = await db.products.find_one(
        {"product_id": product_id},
        {"_id": 0}
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Produto nao encontrado"
        )

    if product["seller_id"] != user["user_id"] and user["role"] != "admin":
        raise HTTPException(
            status_code=403,
            detail="Sem permissao"
        )

    await db.products.update_one(
        {"product_id": product_id},
        {"$set": {"is_deleted": True, "status": "deleted"}}
    )

    return {"message": "Produto removido"}

@api_router.get("/products/seller/mine")
async def get_my_products(request: Request):
    user = await require_seller(request)
    products = await db.products.find({"seller_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for p in products:
        _normalize_product_images(p)
    return {"products": products}

@api_router.get("/sales/test")
async def test_sales():
    sales = await db.sales.find({}, {"_id": 0}).to_list(100)
    return sales

@api_router.post("/admin/sales/test-create")
async def create_test_sale(request: Request):
    await require_admin(request)

    sale = {
        "sale_id": f"sale_{uuid.uuid4().hex[:10]}",
        "buyer_id": "test_buyer",
        "seller_id": "test_seller",
        "product_id": "test_product",
        "amount": 100.0,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await db.sales.insert_one(sale)

    # simula dinheiro preso no vendedor
    await db.wallets.update_one(
        {"user_id": "test_seller"},
        {"$inc": {"held": 100.0}},
        upsert=True
    )

    return {"message": "Venda de teste criada", "sale": sale}

# ==================== STORE ROUTES ====================
@api_router.post("/stores")
async def create_store(data: StoreCreate, request: Request):
    user = await get_current_user(request)
    # Check if user already has a store
    existing = await db.stores.find_one({"owner_id": user["user_id"]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Voce ja possui uma loja")
    
    store_id = f"store_{uuid.uuid4().hex[:12]}"
    name = sanitize_text(data.name, 100)
    slug = name.lower().replace(" ", "-").replace(".", "")[:30] + f"-{store_id[-6:]}"
    
    store = {
        "store_id": store_id,
        "owner_id": user["user_id"],
        "owner_name": user["name"],
        "name": name,
        "slug": slug,
        "description": sanitize_text(data.description or "", 1000),
        "logo": data.logo or "",
        "banner": data.banner or "",
        "category": sanitize_text(data.category or "", 100),
        "business_hours": sanitize_text(data.business_hours or "", 200),
        "plan": "free",
        "is_approved": False,
        "products_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.stores.insert_one(store)
    # Upgrade user role to seller
    if user.get("role") == "buyer":
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"role": "seller"}})
    return {k: v for k, v in store.items() if k != "_id"}

@api_router.get("/stores")
async def list_stores(search: Optional[str] = None, category: Optional[str] = None, page: int = 1, limit: int = 20):
    query: dict = {}
    if search:
        search_clean = sanitize_text(search, 100)
        query["$or"] = [
            {"name": {"$regex": search_clean, "$options": "i"}},
            {"description": {"$regex": search_clean, "$options": "i"}}
        ]
    if category:
        query["category"] = category
    skip = (page - 1) * limit
    stores = await db.stores.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.stores.count_documents(query)
    return {"stores": stores, "total": total, "page": page, "pages": max(1, (total + limit - 1) // limit)}

@api_router.get("/stores/mine")
async def get_my_store(request: Request):
    user = await get_current_user(request)
    store = await db.stores.find_one({"owner_id": user["user_id"]}, {"_id": 0})
    if not store:
        raise HTTPException(status_code=404, detail="Voce nao tem uma loja")
    return store

@api_router.get("/stores/{store_id}")
async def get_store(store_id: str):
    store = await db.stores.find_one(
        {"$or": [{"store_id": store_id}, {"slug": store_id}]},
        {"_id": 0}
    )
    if not store:
        raise HTTPException(status_code=404, detail="Loja nao encontrada")
    # Get store products
    products = await db.products.find(
        {"seller_id": store["owner_id"], "status": "active"},
        {"_id": 0}
    ).sort("created_at", -1).limit(20).to_list(20)
    for p in products:
        _normalize_product_images(p)
    return {**store, "products": products}

@api_router.put("/stores/{store_id}")
async def update_store(store_id: str, data: StoreUpdate, request: Request):
    user = await get_current_user(request)
    store = await db.stores.find_one({"store_id": store_id}, {"_id": 0})
    if not store:
        raise HTTPException(status_code=404, detail="Loja nao encontrada")
    if store["owner_id"] != user["user_id"] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Sem permissao")
    updates = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    for field in ["name", "description", "category", "business_hours"]:
        if field in updates and isinstance(updates[field], str):
            updates[field] = sanitize_text(updates[field], 1000 if field == "description" else 200)
    if updates:
        await db.stores.update_one({"store_id": store_id}, {"$set": updates})
    return await db.stores.find_one({"store_id": store_id}, {"_id": 0})

@api_router.put("/stores/{store_id}/upgrade")
async def upgrade_store_plan(store_id: str, data: PlanUpgrade, request: Request):
    user = await get_current_user(request)
    store = await db.stores.find_one({"store_id": store_id}, {"_id": 0})
    if not store:
        raise HTTPException(status_code=404, detail="Loja nao encontrada")
    if store["owner_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Sem permissao")
    if data.plan not in ("free", "pro", "premium"):
        raise HTTPException(status_code=400, detail="Plano invalido")
    await db.stores.update_one({"store_id": store_id}, {"$set": {"plan": data.plan}})
    return {"message": "Plano atualizado", "plan": data.plan}

# ==================== CART ROUTES ====================
@api_router.get("/cart")
async def get_cart(request: Request):
    user = await get_current_user(request)
    cart_items = await db.cart_items.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    enriched = []
    for item in cart_items:
        product = await db.products.find_one({"product_id": item["product_id"]}, {"_id": 0})
        if product:
            _normalize_product_images(product)
            enriched.append({**item, "product": product})
    return {"cart": enriched}

@api_router.post("/cart")
async def add_to_cart(data: CartItemAdd, request: Request):
    user = await get_current_user(request)
    product = await db.products.find_one({"product_id": data.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Produto nao encontrado")
    existing = await db.cart_items.find_one({"user_id": user["user_id"], "product_id": data.product_id}, {"_id": 0})
    if existing:
        await db.cart_items.update_one(
            {"user_id": user["user_id"], "product_id": data.product_id},
            {"$inc": {"quantity": data.quantity}}
        )
    else:
        await db.cart_items.insert_one({
            "cart_item_id": f"cart_{uuid.uuid4().hex[:12]}",
            "user_id": user["user_id"],
            "product_id": data.product_id,
            "quantity": data.quantity,
            "added_at": datetime.now(timezone.utc).isoformat()
        })
    return {"message": "Adicionado ao carrinho"}

@api_router.put("/cart/{item_id}")
async def update_cart_item(item_id: str, request: Request):
    user = await get_current_user(request)
    body = await request.json()
    quantity = int(body.get("quantity", 1))
    if quantity <= 0:
        await db.cart_items.delete_one({"cart_item_id": item_id, "user_id": user["user_id"]})
        return {"message": "Item removido"}
    await db.cart_items.update_one(
        {"cart_item_id": item_id, "user_id": user["user_id"]},
        {"$set": {"quantity": quantity}}
    )
    return {"message": "Quantidade atualizada"}

@api_router.delete("/cart/{item_id}")
async def remove_from_cart(item_id: str, request: Request):
    user = await get_current_user(request)
    await db.cart_items.delete_one({"cart_item_id": item_id, "user_id": user["user_id"]})
    return {"message": "Item removido"}

# ==================== ORDERS ====================
@api_router.post("/orders")
async def create_order(data: OrderCreate, request: Request):
    user = await get_current_user(request)
    cart_items = await db.cart_items.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    if not cart_items:
        raise HTTPException(status_code=400, detail="Carrinho vazio")
    
    if not data.shipping_address:
        raise HTTPException(status_code=400, detail="Endereco de entrega obrigatorio")
    
    settings = await db.platform_settings.find_one({"key": "commissions"}, {"_id": 0})
    platform_rate = settings["value"]["platform_commission"] if settings else 0.09
    affiliate_rate = settings["value"]["affiliate_commission"] if settings else 0.065
    
    shipping_settings = await db.platform_settings.find_one({"key": "shipping"}, {"_id": 0})
    shipping_cost = 0.0
    shipping_name = "Padrao"
    if shipping_settings and data.shipping_option:
        for opt in shipping_settings["value"].get("options", []):
            if opt["name"].lower().replace(" ", "_") == data.shipping_option and opt.get("enabled", True):
                shipping_cost = opt["price"]
                shipping_name = opt["name"]
                break
    
    discount = 0.0
    coupon_applied = None
    if data.coupon_code:
        coupon = await db.coupons.find_one({"code": data.coupon_code.upper(), "active": True}, {"_id": 0})
        if coupon:
            coupon_applied = coupon["code"]
            if coupon.get("type") == "percentage":
                discount = coupon.get("value", 0)
            else:
                discount = coupon.get("value", 0)
    
    order_items = []
    subtotal = 0.0
    sellers = {}
    total_platform_commission = 0.0
    
    for ci in cart_items:
        product = await db.products.find_one({"product_id": ci["product_id"]}, {"_id": 0})
        if not product:
            continue
        item_subtotal = product["price"] * ci["quantity"]
        subtotal += item_subtotal
        
        is_desapega = product.get("product_type") in ["secondhand", "unique"]
        item_commission = 0.0 if is_desapega else (item_subtotal * platform_rate)
        total_platform_commission += item_commission
        
        img = product.get("thumbnailUrl") or (product.get("images", [None])[0] if product.get("images") else "")
        order_items.append({
            "product_id": product["product_id"], "title": product["title"],
            "price": product["price"], "quantity": ci["quantity"],
            "subtotal": item_subtotal, "seller_id": product["seller_id"],
            "product_type": product.get("product_type", "store"),
            "commission": item_commission,
            "image": img
        })
        sellers[product["seller_id"]] = sellers.get(product["seller_id"], 0) + item_subtotal
    
    if coupon_applied and discount > 0:
        if discount <= 1:
            discount_value = subtotal * discount
        else:
            discount_value = min(discount, subtotal)
    else:
        discount_value = 0
    
    total = subtotal - discount_value + shipping_cost
    
    affiliate_id = None
    max_affiliate_rate = affiliate_rate
    if data.affiliate_code:
        link = await db.affiliate_links.find_one({"code": data.affiliate_code}, {"_id": 0})
        if link:
            affiliate_id = link["affiliate_id"]
            await db.affiliate_links.update_one({"code": data.affiliate_code}, {"$inc": {"conversions": 1}})
            total_commission = platform_rate + max_affiliate_rate
            if total_commission > 0.15:
                max_affiliate_rate = max(0, 0.15 - platform_rate)
            for ci in cart_items:
                product = await db.products.find_one({"product_id": ci["product_id"]}, {"_id": 0})
                if product and product["price"] < 10:
                    max_affiliate_rate = min(max_affiliate_rate, 0.03)
    
    actual_affiliate_rate = max_affiliate_rate if affiliate_id else 0
    
    order_id = f"order_{uuid.uuid4().hex[:12]}"
    
    payment_method = data.payment_method or "pix"
    fin_settings = await db.platform_settings.find_one({"key": "financial"}, {"_id": 0})
    payment_info = {}
    if fin_settings:
        fs = fin_settings.get("value", {})
        if payment_method == "pix":
            payment_info = {"method": "PIX", "pix_key": fs.get("pix_key", ""), "pix_key_type": fs.get("pix_key_type", "")}
        elif payment_method == "ted":
            payment_info = {"method": "Transferencia Bancaria", "bank_name": fs.get("bank_name", ""), "bank_branch": fs.get("bank_branch", ""), "account_name": fs.get("bank_account_name", ""), "account_number": fs.get("bank_account_number", "")}
        elif payment_method == "paypal":
            payment_info = {"method": "PayPal", "paypal_email": fs.get("paypal_email", "")}
    
    order = {
        "order_id": order_id, "buyer_id": user["user_id"], "buyer_name": user["name"],
        "buyer_email": user.get("email", ""),
        "items": order_items, "subtotal": subtotal,
        "shipping_cost": shipping_cost, "shipping_option": shipping_name,
        "discount": discount_value, "coupon_code": coupon_applied,
        "total": total,
        "shipping_address": data.shipping_address.model_dump() if data.shipping_address else {},
        "platform_commission": total_platform_commission,
        "affiliate_commission": subtotal * actual_affiliate_rate if affiliate_id else 0,
        "affiliate_rate_applied": actual_affiliate_rate,
        "affiliate_id": affiliate_id, "status": "awaiting_payment",
        "payment_method": payment_method,
        "payment_info": payment_info,
        "tracking": [
            {"status": "created", "label": "Pedido Criado", "date": datetime.now(timezone.utc).isoformat()},
            {"status": "awaiting_payment", "label": "Aguardando Pagamento", "date": datetime.now(timezone.utc).isoformat()}
        ],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(order)
    
    await db.admin_notifications.insert_one({
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
        "type": "new_sale",
        "message": f"Nova venda #{order_id[:16]} - {user['name']}",
        "order_id": order_id,
        "buyer_id": user["user_id"],
        "buyer_name": user["name"],
        "total": total,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    for seller_id, amount in sellers.items():
        aff_rate = actual_affiliate_rate if affiliate_id else 0
        seller_share = amount * (1 - platform_rate - aff_rate)
        await db.wallets.update_one({"user_id": seller_id}, {"$inc": {"held": seller_share}})
        await db.wallet_transactions.insert_one({
            "tx_id": f"tx_{uuid.uuid4().hex[:12]}", "user_id": seller_id,
            "type": "sale", "amount": seller_share, "status": "held",
            "description": f"Venda #{order_id[:16]}", "order_id": order_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        await db.notifications.insert_one({
            "notification_id": f"notif_{uuid.uuid4().hex[:12]}", "user_id": seller_id,
            "type": "order", "message": f"Novo pedido #{order_id[:16]} recebido!",
            "read": False, "created_at": datetime.now(timezone.utc).isoformat()
        })
    if affiliate_id:
        aff_amount = total * actual_affiliate_rate
        await db.wallets.update_one({"user_id": affiliate_id}, {"$inc": {"held": aff_amount}})
        await db.wallet_transactions.insert_one({
            "tx_id": f"tx_{uuid.uuid4().hex[:12]}", "user_id": affiliate_id,
            "type": "affiliate_commission", "amount": aff_amount, "status": "held",
            "description": f"Comissao afiliado #{order_id[:16]}", "order_id": order_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    await db.cart_items.delete_many({"user_id": user["user_id"]})
    return {k: v for k, v in order.items() if k != "_id"}

@api_router.get("/orders")
async def list_orders(request: Request):
    user = await get_current_user(request)
    if user["role"] == "seller":
        orders = await db.orders.find({"items.seller_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    else:
        orders = await db.orders.find({"buyer_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"orders": orders}

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, request: Request):
    await get_current_user(request)
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Pedido nao encontrado")
    return order

# ==================== WALLET ROUTES ====================
@api_router.get("/wallet")
async def get_wallet(request: Request):
    user = await get_current_user(request)
    wallet = await db.wallets.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not wallet:
        wallet = {"user_id": user["user_id"], "available": 0.0, "held": 0.0}
    return wallet

@api_router.get("/wallet/history")
async def get_wallet_history(request: Request):
    user = await get_current_user(request)
    txs = await db.wallet_transactions.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"transactions": txs}

@api_router.post("/wallet/withdraw")
async def request_withdrawal(data: WithdrawalRequest, request: Request):
    user = await get_current_user(request)
    wallet = await db.wallets.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not wallet or wallet.get("available", 0) < data.amount:
        raise HTTPException(status_code=400, detail="Saldo insuficiente")
    wd_id = f"wd_{uuid.uuid4().hex[:12]}"
    await db.wallets.update_one({"user_id": user["user_id"]}, {"$inc": {"available": -data.amount}})
    await db.withdrawals.insert_one({
        "withdrawal_id": wd_id, "user_id": user["user_id"],
        "user_name": user["name"], "amount": data.amount, "method": data.method,
        "status": "pending", "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Saque solicitado", "withdrawal_id": wd_id}

# ==================== SUPPORT ====================
@api_router.post("/support")
async def send_support_message(data: SupportMessage, request: Request):
    user = await get_current_user(request)
    msg_id = f"support_{uuid.uuid4().hex[:12]}"
    msg = {
        "message_id": msg_id,
        "user_id": user["user_id"],
        "user_name": user["name"],
        "user_email": user.get("email", ""),
        "subject": sanitize_text(data.subject, 200),
        "message": sanitize_text(data.message, 2000),
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.support_messages.insert_one(msg)
    return {"message": "Mensagem enviada", "message_id": msg_id}

@api_router.get("/support")
async def get_support_messages(request: Request):
    user = await get_current_user(request)
    msgs = await db.support_messages.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"messages": msgs}

# ==================== ADMIN ROUTES ====================
@api_router.get("/admin/users")
async def admin_list_users(request: Request, page: int = 1, limit: int = 50, search: Optional[str] = None):
    await require_admin(request)
    query = {}
    if search:
        search_clean = sanitize_text(search, 100)
        query["$or"] = [
            {"name": {"$regex": search_clean, "$options": "i"}},
            {"email": {"$regex": search_clean, "$options": "i"}}
        ]
    skip = (page - 1) * limit
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents(query)
    return {"users": users, "total": total, "page": page, "pages": max(1, (total + limit - 1) // limit)}

@api_router.put("/admin/users/{user_id}/block")
async def admin_block_user(user_id: str, request: Request):
    await require_admin(request)
    await db.users.update_one({"user_id": user_id}, {"$set": {"is_blocked": True}})
    return {"message": "Usuario bloqueado"}

@api_router.put("/admin/users/{user_id}/unblock")
async def admin_unblock_user(user_id: str, request: Request):
    await require_admin(request)
    await db.users.update_one({"user_id": user_id}, {"$set": {"is_blocked": False}})
    return {"message": "Usuario desbloqueado"}

@api_router.put("/admin/users/{user_id}/role")
async def admin_change_user_role(user_id: str, request: Request):
    await require_admin(request)
    body = await request.json()
    role = body.get("role")
    if role not in ("buyer", "seller", "affiliate", "admin"):
        raise HTTPException(status_code=400, detail="Papel invalido")
    await db.users.update_one({"user_id": user_id}, {"$set": {"role": role}})
    return {"message": "Papel atualizado"}

@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, request: Request):
    await require_admin(request)
    await db.users.delete_one({"user_id": user_id})
    return {"message": "Usuario removido"}

@api_router.get("/admin/products")
async def admin_list_products(request: Request, page: int = 1, limit: int = 50, search: Optional[str] = None, status: Optional[str] = None):
    await require_admin(request)
    query = {}
    if search:
        search_clean = sanitize_text(search, 100)
        query["$or"] = [
            {"title": {"$regex": search_clean, "$options": "i"}},
            {"seller_name": {"$regex": search_clean, "$options": "i"}}
        ]
    if status:
        query["status"] = status
    skip = (page - 1) * limit
    products = await db.products.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    for p in products:
        _normalize_product_images(p)
    total = await db.products.count_documents(query)
    return {"products": products, "total": total, "page": page, "pages": max(1, (total + limit - 1) // limit)}

@api_router.put("/admin/products/{product_id}/status")
async def admin_update_product_status(product_id: str, request: Request):
    await require_admin(request)
    body = await request.json()
    status = body.get("status", "active")
    await db.products.update_one({"product_id": product_id}, {"$set": {"status": status}})
    return {"message": "Status atualizado"}

@api_router.delete("/admin/products/{product_id}")
async def admin_delete_product(product_id: str, request: Request):
    await require_admin(request)
    await db.products.delete_one({"product_id": product_id})
    return {"message": "Produto removido"}

@api_router.get("/admin/orders")
async def admin_list_orders(request: Request, page: int = 1, limit: int = 50, status: Optional[str] = None):
    await require_admin(request)
    query = {}
    if status:
        query["status"] = status
    skip = (page - 1) * limit
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.orders.count_documents(query)
    return {"orders": orders, "total": total, "page": page, "pages": max(1, (total + limit - 1) // limit)}

@api_router.put("/admin/orders/{order_id}/status")
async def admin_update_order_status(order_id: str, request: Request):
    await require_admin(request)
    body = await request.json()
    status = body.get("status", "processing")
    updates = {"status": status}
    if status == "shipped":
        updates["tracking_code"] = body.get("tracking_code", "")
    await db.orders.update_one({"order_id": order_id}, {"$set": updates})
    # Notificar comprador
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if order:
        status_labels = {
            "processing": "Pedido em processamento",
            "shipped": "Pedido enviado",
            "delivered": "Pedido entregue",
            "cancelled": "Pedido cancelado"
        }
        await db.notifications.insert_one({
            "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
            "user_id": order["buyer_id"],
            "type": "order_update",
            "message": status_labels.get(status, f"Pedido #{order_id[:16]} atualizado"),
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    return {"message": "Status atualizado"}

@api_router.get("/admin/messages")
async def admin_list_messages(request: Request, page: int = 1, limit: int = 50):
    await require_admin(request)
    try:
        skip = (page - 1) * limit
        msgs = await db.support_messages.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        total = await db.support_messages.count_documents({})
        return {"messages": msgs, "total": total, "page": page, "pages": max(1, (total + limit - 1) // limit)}
    except Exception as e:
        logging.error(f"admin/messages error: {e}")
        return {"messages": [], "total": 0, "page": page, "pages": 1, "error": str(e)}

@api_router.post("/admin/support/{message_id}/reply")
async def admin_reply_support(message_id: str, data: SupportReply, request: Request):
    await require_admin(request)
    msg = await db.support_messages.find_one({"message_id": message_id}, {"_id": 0})
    if not msg:
        raise HTTPException(status_code=404, detail="Mensagem nao encontrada")
    user_id = msg["user_id"]
    reply_text = sanitize_text(data.reply, 2000)
    await db.support_messages.update_one(
        {"message_id": message_id},
        {"$set": {"status": "replied", "reply": reply_text, "replied_at": datetime.now(timezone.utc).isoformat()}}
    )
    msg_doc = {
        "message_id": f"msg_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "subject": "Resposta do Suporte",
        "message": reply_text, "is_admin_reply": True, "status": "replied",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.support_messages.insert_one(msg_doc)
    await db.notifications.insert_one({
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}", "user_id": user_id,
        "type": "support", "message": "Voce recebeu uma resposta do suporte!",
        "read": False, "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Resposta enviada"}

# ==================== STORE CHAT ====================
async def _resolve_store(store_id_or_slug: str):
    """Resolve a store by ID or slug."""
    store = await db.stores.find_one(
        {"$or": [{"store_id": store_id_or_slug}, {"slug": store_id_or_slug}]},
        {"_id": 0}
    )
    return store

@api_router.post("/stores/{store_id}/chat")
async def send_store_chat_message(store_id: str, data: StoreChatMessage, request: Request):
    """Buyer sends message to store"""
    # Rate limit: 30 mensagens por minuto
    if not check_rate_limit(request, "message", 30, 60):
        raise HTTPException(status_code=429, detail="Muitas mensagens. Aguarde um momento.")
    
    user = await get_current_user(request)
    
    store = await _resolve_store(store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Loja nao encontrada")
    
    msg_text = sanitize_text(data.message, 2000)
    if not msg_text:
        raise HTTPException(status_code=400, detail="Mensagem vazia")
    
    real_store_id = store["store_id"]
    message_id = f"msg_{uuid.uuid4().hex[:12]}"
    message = {
        "message_id": message_id,
        "store_id": real_store_id,
        "sender_id": user["user_id"],
        "sender_name": user["name"],
        "sender_role": user["role"],
        "message": msg_text,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.store_messages.insert_one(message)
    
    await db.notifications.insert_one({
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
        "user_id": store["owner_id"],
        "type": "store_chat",
        "message": f"Nova mensagem de {user['name']}",
        "data": {
            "store_id": real_store_id,
            "message_id": message_id,
            "sender_id": user["user_id"],
            "receiver_id": store["owner_id"],
            "sender_name": user["name"],
            "open_chat_url": f"/stores/{store['slug']}/chat"
        },
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {k: v for k, v in message.items() if k != "_id"}

@api_router.get("/stores/{store_id}/chat")
async def get_store_chat_messages(store_id: str, request: Request, limit: int = 50):
    """Get chat messages for a store (visible to buyer and store owner)"""
    user = await get_current_user(request)
    
    store = await _resolve_store(store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Loja nao encontrada")
    
    real_store_id = store["store_id"]
    is_owner = store["owner_id"] == user["user_id"]
    
    if is_owner:
        query = {"store_id": real_store_id}
    else:
        query = {
            "store_id": real_store_id,
            "$or": [
                {"sender_id": user["user_id"]},
                {"sender_id": store["owner_id"]}
            ]
        }
    
    messages = await db.store_messages.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    messages.reverse()
    
    if not is_owner:
        await db.store_messages.update_many(
            {"store_id": real_store_id, "sender_id": store["owner_id"], "read": False},
            {"$set": {"read": True}}
        )
    else:
        await db.store_messages.update_many(
            {"store_id": real_store_id, "sender_id": {"$ne": store["owner_id"]}, "read": False},
            {"$set": {"read": True}}
        )
    
    return {"messages": messages, "store": store}

@api_router.get("/seller/chat/conversations")
async def get_seller_chat_conversations(request: Request):
    """Get all chat conversations for seller's store"""
    user = await get_current_user(request)
    
    if user["role"] != "seller":
        raise HTTPException(status_code=403, detail="Apenas vendedores podem acessar")
    
    store = await db.stores.find_one({"owner_id": user["user_id"]}, {"_id": 0})
    if not store:
        raise HTTPException(status_code=404, detail="Voce nao tem uma loja")
    
    messages = await db.store_messages.find(
        {"store_id": store["store_id"], "sender_id": {"$ne": user["user_id"]}},
        {"_id": 0, "sender_id": 1, "sender_name": 1, "message": 1, "read": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(500)
    
    conversations = {}
    for msg in messages:
        sender_id = msg["sender_id"]
        if sender_id not in conversations:
            conversations[sender_id] = {
                "user_id": sender_id,
                "user_name": msg["sender_name"],
                "last_message": msg["message"],
                "last_message_date": msg["created_at"],
                "unread_count": 0
            }
        if not msg["read"]:
            conversations[sender_id]["unread_count"] += 1
    
    return {"conversations": list(conversations.values()), "store": store}


# ==================== DIRECT CHAT (between two users) ====================
class DirectChatMessage(BaseModel):
    message: str
    product_id: Optional[str] = None


def _direct_thread_id(user_a: str, user_b: str) -> str:
    a, b = sorted([user_a, user_b])
    return f"dm_{a}_{b}"


@api_router.post("/direct-chat/{other_user_id}")
async def send_direct_message(other_user_id: str, data: DirectChatMessage, request: Request):
    """Send a direct message to another user"""
    # Rate limit: 30 mensagens por minuto
    if not check_rate_limit(request, "message", 30, 60):
        raise HTTPException(status_code=429, detail="Muitas mensagens. Aguarde um momento.")
    
    user = await get_current_user(request)
    if other_user_id == user["user_id"]:
        raise HTTPException(status_code=400, detail="Voce nao pode conversar consigo mesmo")
    other = await db.users.find_one({"user_id": other_user_id}, {"_id": 0})
    if not other:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado")

    msg_text = sanitize_text(data.message or "", 2000)
    if not msg_text:
        raise HTTPException(status_code=400, detail="Mensagem nao pode estar vazia")

    thread_id = _direct_thread_id(user["user_id"], other_user_id)
    message_id = f"msg_{uuid.uuid4().hex[:12]}"
    message = {
        "message_id": message_id,
        "thread_id": thread_id,
        "sender_id": user["user_id"],
        "sender_name": user["name"],
        "recipient_id": other_user_id,
        "recipient_name": other["name"],
        "product_id": data.product_id,
        "message": msg_text,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.direct_messages.insert_one(message)

    await db.notifications.insert_one({
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
        "user_id": other_user_id,
        "type": "direct_chat",
        "message": f"Nova mensagem de {user['name']}",
        "data": {
            "thread_id": thread_id,
            "sender_id": user["user_id"],
            "sender_name": user["name"],
            "receiver_id": other_user_id,
            "product_id": data.product_id,
            "open_chat_url": f"/chat/{user['user_id']}"
        },
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    return {k: v for k, v in message.items() if k != "_id"}


@api_router.get("/direct-chat/{other_user_id}")
async def get_direct_messages(other_user_id: str, request: Request, limit: int = 100):
    user = await get_current_user(request)
    other = await db.users.find_one({"user_id": other_user_id}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "role": 1})
    if not other:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado")
    thread_id = _direct_thread_id(user["user_id"], other_user_id)
    messages = await db.direct_messages.find({"thread_id": thread_id}, {"_id": 0}).sort("created_at", 1).limit(limit).to_list(limit)
    await db.direct_messages.update_many(
        {"thread_id": thread_id, "recipient_id": user["user_id"], "read": False},
        {"$set": {"read": True}}
    )
    return {"messages": messages, "other": other}


@api_router.get("/direct-chat")
async def list_my_direct_threads(request: Request):
    """List all direct chat threads for the logged-in user"""
    user = await get_current_user(request)
    uid = user["user_id"]
    
    # Buscar todas as mensagens do usuário
    all_msgs = await db.direct_messages.find(
        {"$or": [{"sender_id": uid}, {"recipient_id": uid}]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    
    # Agrupar por thread
    threads_map = {}
    for msg in all_msgs:
        tid = msg.get("thread_id")
        if tid not in threads_map:
            threads_map[tid] = msg
    
    threads = []
    for tid, msg in threads_map.items():
        other_id = msg["recipient_id"] if msg["sender_id"] == uid else msg["sender_id"]
        other = await db.users.find_one({"user_id": other_id}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "role": 1})
        if not other:
            continue
        unread = await db.direct_messages.count_documents(
            {"thread_id": tid, "recipient_id": uid, "read": False}
        )
        threads.append({
            "thread_id": tid,
            "other": other,
            "last_message": msg.get("message", ""),
            "last_message_date": msg.get("created_at", ""),
            "unread_count": unread
        })
    
    return {"threads": threads}


# ==================== ADS ====================
@api_router.get("/ads")
async def list_ads(position: Optional[str] = None):
    query = {"active": True}
    if position:
        query["position"] = position
    ads = await db.ads.find(query, {"_id": 0}).sort("created_at", -1).to_list(20)
    return {"ads": ads}

@api_router.post("/ads/{ad_id}/click")
async def register_ad_click(ad_id: str):
    await db.ads.update_one({"ad_id": ad_id}, {"$inc": {"clicks": 1}})
    return {"ok": True}

@api_router.get("/admin/ads")
async def admin_list_ads(request: Request):
    await require_admin(request)
    ads = await db.ads.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"ads": ads}

@api_router.post("/admin/ads")
async def admin_create_ad(data: AdCreate, request: Request):
    await require_admin(request)
    ad_id = f"ad_{uuid.uuid4().hex[:12]}"
    ad = {
        "ad_id": ad_id,
        "title": sanitize_text(data.title, 200),
        "image": data.image,
        "link": data.link,
        "position": data.position or "between_products",
        "active": True,
        "clicks": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.ads.insert_one(ad)
    return {k: v for k, v in ad.items() if k != "_id"}

@api_router.put("/admin/ads/{ad_id}")
async def admin_update_ad(ad_id: str, data: AdUpdate, request: Request):
    await require_admin(request)
    updates = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if updates:
        await db.ads.update_one({"ad_id": ad_id}, {"$set": updates})
    return await db.ads.find_one({"ad_id": ad_id}, {"_id": 0})

@api_router.delete("/admin/ads/{ad_id}")
async def admin_delete_ad(ad_id
: str, request: Request):
    await require_admin(request)
    await db.ads.delete_one({"ad_id": ad_id})
    return {"message": "Anuncio removido"}

# ==================== AFFILIATE ====================
@api_router.get("/affiliate/links")
async def get_affiliate_links(request: Request):
    user = await get_current_user(request)
    links = await db.affiliate_links.find({"affiliate_id": user["user_id"]}, {"_id": 0}).to_list(50)
    return {"links": links}

@api_router.post("/affiliate/links")
async def create_affiliate_link(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    product_id = body.get("product_id", "")
    code = f"aff_{uuid.uuid4().hex[:8]}"
    link = {
        "link_id": f"link_{uuid.uuid4().hex[:12]}",
        "affiliate_id": user["user_id"],
        "product_id": product_id,
        "code": code,
        "conversions": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.affiliate_links.insert_one(link)
    return {k: v for k, v in link.items() if k != "_id"}

# ==================== SAVED ADDRESS ====================
@api_router.get("/users/saved-address")
async def get_saved_address(request: Request):
    user = await get_current_user(request)
    addr = await db.saved_addresses.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return addr or {}

@api_router.put("/users/saved-address")
async def save_address(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    await db.saved_addresses.update_one(
        {"user_id": user["user_id"]},
        {"$set": {**body, "user_id": user["user_id"]}},
        upsert=True
    )
    return {"message": "Endereco salvo"}

# ==================== SHIPPING OPTIONS ====================
@api_router.get("/shipping/options")
async def get_shipping_options():
    settings = await db.platform_settings.find_one({"key": "shipping"}, {"_id": 0})
    if settings:
        return {"options": settings["value"].get("options", [])}
    return {"options": [
        {"name": "Gratis", "price": 0, "days": "7-15 dias uteis", "enabled": True},
        {"name": "Normal", "price": 15.90, "days": "5-8 dias uteis", "enabled": True},
        {"name": "Expresso", "price": 29.90, "days": "2-3 dias uteis", "enabled": True}
    ]}

# ==================== PAYMENT METHODS ====================
@api_router.get("/payment-methods")
async def get_payment_methods():
    fin = await db.platform_settings.find_one({"key": "financial"}, {"_id": 0})
    methods = []
    if fin:
        v = fin.get("value", {})
        if v.get("pix_enabled", True):
            methods.append({"id": "pix", "name": "PIX", "description": "Pagamento instantâneo"})
        if v.get("ted_enabled", True):
            methods.append({"id": "ted", "name": "TED/Transferência", "description": "Transferência bancária"})
        if v.get("paypal_enabled", False):
            methods.append({"id": "paypal", "name": "PayPal", "description": "Pagamento via PayPal"})
    if not methods:
        methods = [
            {"id": "pix", "name": "PIX", "description": "Pagamento instantâneo"},
            {"id": "ted", "name": "TED/Transferência", "description": "Transferência bancária"}
        ]
    return {"methods": methods}

# ==================== ADMIN: DENUNCIAS ====================
@api_router.get("/admin/reports")
async def admin_list_reports_v2(request: Request, status: Optional[str] = None, page: int = 1, limit: int = 50):
    """Admin lista denúncias com dados enriquecidos"""
    await require_admin(request)
    query = {}
    if status:
        query["status"] = status
    skip = (page - 1) * limit
    items = await db.reports.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    for item in items:
        reporter = await db.users.find_one({"user_id": item.get("reporter_id")}, {"_id": 0, "name": 1, "email": 1})
        item["reporter_name"] = reporter["name"] if reporter else "Desconhecido"
        item["reporter_email"] = reporter["email"] if reporter else ""
        if item.get("reported_user_id"):
            reported = await db.users.find_one({"user_id": item["reported_user_id"]}, {"_id": 0, "name": 1, "email": 1})
            item["reported_user_name"] = reported["name"] if reported else "Desconhecido"
        if item.get("post_id"):
            post = await db.social_posts.find_one({"post_id": item["post_id"]}, {"_id": 0, "title": 1})
            item["post_title"] = post["title"] if post else ""
    total = await db.reports.count_documents(query)
    return {"reports": items, "total": total, "page": page, "pages": max(1, (total + limit - 1) // limit)}

@api_router.put("/admin/reports/{report_id}/action")
async def admin_report_action(report_id: str, request: Request):
    await require_admin(request)
    body = await request.json()
    action = body.get("action", "resolver")
    
    report = await db.reports.find_one({"report_id": report_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Denúncia nao encontrada")
    
    new_status = "resolvida"
    result_msg = "Denúncia resolvida"
    
    if action == "ignorar":
        new_status = "ignorada"
        result_msg = "Denúncia ignorada"
    elif action == "bloquear_anuncio" and report.get("post_id"):
        await db.social_posts.update_one({"post_id": report["post_id"]}, {"$set": {"is_blocked": True}})
        new_status = "resolvida"
        result_msg = "Anúncio bloqueado"
    elif action == "bloquear_usuario" and report.get("reported_user_id"):
        await db.users.update_one({"user_id": report["reported_user_id"]}, {"$set": {"is_blocked": True}})
        new_status = "resolvida"
        result_msg = "Usuário bloqueado"
    
    await db.reports.update_one(
        {"report_id": report_id},
        {"$set": {"status": new_status, "action_taken": action, "resolved_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": result_msg, "status": new_status}

@api_router.put("/admin/reports/{report_id}/ignore")
async def admin_report_ignore(report_id: str, request: Request):
    await require_admin(request)
    await db.reports.update_one({"report_id": report_id}, {"$set": {"status": "ignorada", "action_taken": "ignorar", "resolved_at": datetime.now(timezone.utc).isoformat()}})
    return {"message": "Denúncia ignorada", "status": "ignorada"}

@api_router.put("/admin/reports/{report_id}/resolve")
async def admin_report_resolve(report_id: str, request: Request):
    await require_admin(request)
    await db.reports.update_one({"report_id": report_id}, {"$set": {"status": "resolvida", "action_taken": "resolver", "resolved_at": datetime.now(timezone.utc).isoformat()}})
    return {"message": "Denúncia resolvida", "status": "resolvida"}

@api_router.put("/admin/reports/{report_id}/block_ad")
async def admin_report_block_ad(report_id: str, request: Request):
    await require_admin(request)
    report = await db.reports.find_one({"report_id": report_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Denúncia não encontrada")
    if report.get("post_id"):
        await db.social_posts.update_one({"post_id": report["post_id"]}, {"$set": {"is_blocked": True}})
    await db.reports.update_one({"report_id": report_id}, {"$set": {"status": "resolvida", "action_taken": "bloquear_anuncio", "resolved_at": datetime.now(timezone.utc).isoformat()}})
    return {"message": "Anúncio bloqueado", "status": "resolvida"}

@api_router.put("/admin/reports/{report_id}/block_user")
async def admin_report_block_user(report_id: str, request: Request):
    await require_admin(request)
    report = await db.reports.find_one({"report_id": report_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Denúncia não encontrada")
    if report.get("reported_user_id"):
        await db.users.update_one({"user_id": report["reported_user_id"]}, {"$set": {"is_blocked": True}})
    await db.reports.update_one({"report_id": report_id}, {"$set": {"status": "resolvida", "action_taken": "bloquear_usuario", "resolved_at": datetime.now(timezone.utc).isoformat()}})
    return {"message": "Usuário bloqueado", "status": "resolvida"}

@api_router.put("/admin/social-posts/{post_id}/remove")
async def admin_remove_social_post_put(post_id: str, request: Request):
    await require_admin(request)
    post = await db.social_posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Anúncio não encontrado")
    await db.social_posts.delete_one({"post_id": post_id})
    await db.social_comments.delete_many({"post_id": post_id})
    return {"message": "Anúncio removido"}

@api_router.put("/admin/social-posts/{post_id}/unblock")
async def admin_unblock_social_post(post_id: str, request: Request):
    await require_admin(request)
    post = await db.social_posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Anúncio não encontrado")
    await db.social_posts.update_one({"post_id": post_id}, {"$set": {"is_blocked": False}})
    return {"message": "Anúncio desbloqueado", "is_blocked": False}

# ==================== ADMIN: NOTIFICATION COUNTS ====================
@api_router.get("/admin/notification-counts")
async def get_admin_notification_counts_v2(request: Request):
    await require_admin(request)
    pending_orders = await db.orders.count_documents({"status": {"$in": ["pending", "awaiting_payment"]}})
    pending_withdrawals = await db.withdrawals.count_documents({"status": "pending"})
    pending_support = await db.support_messages.count_documents({"status": {"$in": ["pending", "open"]}})
    pending_stores = await db.stores.count_documents({"is_approved": False})
    total_users = await db.users.count_documents({})
    pending_reports = await db.reports.count_documents({"status": "pendente"})
    return {
        "orders": pending_orders,
        "withdrawals": pending_withdrawals,
        "support": pending_support,
        "stores": pending_stores,
        "users": total_users,
        "reports": pending_reports,
    }

@api_router.get("/admin/withdrawals")
async def admin_list_withdrawals(request: Request):
    await require_admin(request)
    wds = await db.withdrawals.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"withdrawals": wds}

@api_router.put("/admin/withdrawals/{wd_id}/approve")
async def admin_approve_withdrawal(wd_id: str, request: Request):
    await require_admin(request)
    wd = await db.withdrawals.find_one({"withdrawal_id": wd_id}, {"_id": 0})
    if not wd:
        raise HTTPException(status_code=404, detail="Saque nao encontrado")
    await db.withdrawals.update_one({"withdrawal_id": wd_id}, {"$set": {"status": "approved"}})
    await db.wallet_transactions.insert_one({
        "tx_id": f"tx_{uuid.uuid4().hex[:12]}", "user_id": wd["user_id"],
        "type": "withdrawal", "amount": -wd["amount"], "status": "completed",
        "description": f"Saque via {wd['method']} aprovado",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    await db.notifications.insert_one({
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}", "user_id": wd["user_id"],
        "type": "withdrawal", "message": f"Seu saque de R$ {wd['amount']:.2f} foi aprovado!",
        "read": False, "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Saque aprovado"}

@api_router.put("/admin/withdrawals/{wd_id}/reject")
async def admin_reject_withdrawal(wd_id: str, request: Request):
    await require_admin(request)
    wd = await db.withdrawals.find_one({"withdrawal_id": wd_id}, {"_id": 0})
    if not wd:
        raise HTTPException(status_code=404, detail="Saque nao encontrado")
    await db.withdrawals.update_one({"withdrawal_id": wd_id}, {"$set": {"status": "rejected"}})
    await db.wallets.update_one({"user_id": wd["user_id"]}, {"$inc": {"available": wd["amount"]}})
    await db.notifications.insert_one({
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}", "user_id": wd["user_id"],
        "type": "withdrawal", "message": f"Seu saque de R$ {wd['amount']:.2f} foi rejeitado. Saldo restaurado.",
        "read": False, "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Saque rejeitado"}

# ==================== ADMIN: STORES ====================
@api_router.get("/admin/stores")
async def admin_list_stores(request: Request, page: int = 1, limit: int = 50):
    await require_admin(request)
    skip = (page - 1) * limit
    stores = await db.stores.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.stores.count_documents({})
    return {"stores": stores, "total": total, "page": page, "pages": max(1, (total + limit - 1) // limit)}

@api_router.put("/admin/stores/{store_id}/approve")
async def admin_approve_store(store_id: str, request: Request):
    await require_admin(request)
    await db.stores.update_one({"store_id": store_id}, {"$set": {"is_approved": True}})
    store = await db.stores.find_one({"store_id": store_id}, {"_id": 0})
    if store:
        await db.notifications.insert_one({
            "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
            "user_id": store["owner_id"],
            "type": "store_approved",
            "message": "Sua loja foi aprovada! Agora você pode vender.",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    return {"message": "Loja aprovada"}

@api_router.put("/admin/stores/{store_id}/reject")
async def admin_reject_store(store_id: str, request: Request):
    await require_admin(request)
    await db.stores.update_one({"store_id": store_id}, {"$set": {"is_approved": False, "rejected": True}})
    return {"message": "Loja rejeitada"}

# ==================== ADMIN: PLATFORM SETTINGS ====================
@api_router.get("/admin/settings/commissions")
async def get_commission_settings(request: Request):
    await require_admin(request)
    settings = await db.platform_settings.find_one({"key": "commissions"}, {"_id": 0})
    if settings:
        return settings["value"]
    return {"platform_commission": 0.09, "affiliate_commission": 0.065}

@api_router.put("/admin/settings/commissions")
async def update_commission_settings(data: CommissionUpdate, request: Request):
    await require_admin(request)
    current = await db.platform_settings.find_one({"key": "commissions"}, {"_id": 0})
    current_value = current["value"] if current else {"platform_commission": 0.09, "affiliate_commission": 0.065}
    if data.platform_commission is not None:
        current_value["platform_commission"] = data.platform_commission
    if data.affiliate_commission is not None:
        current_value["affiliate_commission"] = data.affiliate_commission
    await db.platform_settings.update_one(
        {"key": "commissions"},
        {"$set": {"key": "commissions", "value": current_value}},
        upsert=True
    )
    return current_value

@api_router.get("/admin/settings/financial")
async def get_financial_settings(request: Request):
    await require_admin(request)
    settings = await db.platform_settings.find_one({"key": "financial"}, {"_id": 0})
    if settings:
        return settings["value"]
    return {}

@api_router.put("/admin/settings/financial")
async def update_financial_settings(data: FinancialSettings, request: Request):
    await require_admin(request)
    await db.platform_settings.update_one(
        {"key": "financial"},
        {"$set": {"key": "financial", "value": data.model_dump()}},
        upsert=True
    )
    return data.model_dump()

@api_router.get("/admin/settings/shipping")
async def get_shipping_settings(request: Request):
    await require_admin(request)
    settings = await db.platform_settings.find_one({"key": "shipping"}, {"_id": 0})
    if settings:
        return settings["value"]
    return {"options": []}

@api_router.put("/admin/settings/shipping")
async def update_shipping_settings(data: ShippingSettings, request: Request):
    await require_admin(request)
    value = {"options": [o.model_dump() for o in data.options]}
    await db.platform_settings.update_one(
        {"key": "shipping"},
        {"$set": {"key": "shipping", "value": value}},
        upsert=True
    )
    return value

# ==================== ADMIN: WALLETS ====================
@api_router.get("/admin/wallets")
async def admin_list_wallets(request: Request):
    await require_admin(request)
    users = await db.users.find({}, {"_id": 0, "user_id": 1, "name": 1, "email": 1, "role": 1}).to_list(500)
    items = []
    for u in users:
        w = await db.wallets.find_one({"user_id": u["user_id"]}, {"_id": 0}) or {}
        items.append({
            "user_id": u["user_id"],
            "name": u.get("name"),
            "email": u.get("email"),
            "role": u.get("role"),
            "available": float(w.get("available") or 0.0),
            "held": float(w.get("held") or 0.0),
            "total": float((w.get("available") or 0.0) + (w.get("held") or 0.0)),
        })
    items.sort(key=lambda x: (x["held"], x["available"]), reverse=True)
    return {"wallets": items}

# ==================== PROMOTION PLANS ====================
class PromotionPlanCreate(BaseModel):
    name: str
    price: float
    duration_days: int = 30
    description: Optional[str] = ""
    benefits: Optional[dict] = {}

@api_router.get("/promotion-plans")
async def list_promotion_plans():
    plans = await db.promotion_plans.find({"active": True}, {"_id": 0}).sort("price", 1).to_list(length=50)
    return {"plans": plans}

@api_router.get("/admin/promotion-plans")
async def admin_list_promotion_plans(request: Request):
    await require_admin(request)
    plans = await db.promotion_plans.find({}, {"_id": 0}).sort("price", 1).to_list(length=50)
    return {"plans": plans}

@api_router.post("/admin/promotion-plans")
async def admin_create_promotion_plan(data: PromotionPlanCreate, request: Request):
    await require_admin(request)
    plan_id = f"plan_{uuid.uuid4().hex[:12]}"
    doc = {
        "plan_id": plan_id,
        "name": sanitize_text(data.name, 100),
        "price": float(data.price),
        "duration_days": int(data.duration_days),
        "description": sanitize_text(data.description or "", 500),
        "benefits": data.benefits or {
            "home_highlight": True,
            "footer_banner": True,
            "search_boost": True,
            "priority_support": False,
        },
        "active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.promotion_plans.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.put("/admin/promotion-plans/{plan_id}")
async def admin_update_promotion_plan(plan_id: str, request: Request):
    await require_admin(request)
    body = await request.json()
    allowed = {"name","price","duration_days","description","benefits","active"}
    clean = {k: v for k, v in body.items() if k in allowed}
    await db.promotion_plans.update_one({"plan_id": plan_id}, {"$set": clean})
    plan = await db.promotion_plans.find_one({"plan_id": plan_id}, {"_id": 0})
    return plan

@api_router.delete("/admin/promotion-plans/{plan_id}")
async def admin_delete_promotion_plan(plan_id: str, request: Request):
    await require_admin(request)
    await db.promotion_plans.delete_one({"plan_id": plan_id})
    return {"message": "Plano removido"}

# ==================== SELLER SUBSCRIBE TO PLAN ====================
@api_router.post("/seller/subscribe-plan")
async def seller_subscribe_plan(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    plan_id = body.get("plan_id")
    payment_method = body.get("payment_method", "wallet")
    if not plan_id:
        raise HTTPException(status_code=400, detail="Plano obrigatório")
    plan = await db.promotion_plans.find_one({"plan_id": plan_id, "active": True})
    if not plan:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    sub_id = f"sub_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    status = "pending"
    paid_at = None
    if payment_method == "wallet":
        wallet = await db.wallets.find_one({"user_id": user["user_id"]}) or {}
        available = float(wallet.get("available") or 0.0)
        price = float(plan["price"])
        if available < price:
            raise HTTPException(status_code=400, detail=f"Saldo disponível insuficiente (R$ {available:.2f})")
        await db.wallets.update_one(
            {"user_id": user["user_id"]},
            {"$inc": {"available": -price}, "$set": {"updated_at": now.isoformat()}}
        )
        status = "active"
        paid_at = now.isoformat()
    expires_at = (now + timedelta(days=int(plan["duration_days"]))).isoformat()
    doc = {
        "subscription_id": sub_id,
        "seller_id": user["user_id"],
        "seller_name": user.get("name"),
        "seller_email": user.get("email"),
        "plan_id": plan["plan_id"],
        "plan_name": plan["name"],
        "plan_price": float(plan["price"]),
        "duration_days": int(plan["duration_days"]),
        "payment_method": payment_method,
        "status": status,
        "benefits": plan.get("benefits") or {},
        "created_at": now.isoformat(),
        "paid_at": paid_at,
        "expires_at": expires_at if status == "active" else None,
    }
    await db.subscriptions.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.get("/seller/subscriptions")
async def seller_my_subscriptions(request: Request):
    user = await get_current_user(request)
    subs = await db.subscriptions.find({"seller_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(length=100)
    return {"subscriptions": subs}

@api_router.get("/admin/subscriptions")
async def admin_list_subscriptions(request: Request):
    await require_admin(request)
    status = request.query_params.get("status")
    query = {"status": status} if status else {}
    subs = await db.subscriptions.find(query, {"_id": 0}).sort("created_at", -1).to_list(length=200)
    return {"subscriptions": subs}

@api_router.put("/admin/subscriptions/{sub_id}/approve")
async def admin_approve_subscription(sub_id: str, request: Request):
    await require_admin(request)
    sub = await db.subscriptions.find_one({"subscription_id": sub_id})
    if not sub:
        raise HTTPException(status_code=404, detail="Assinatura não encontrada")
    now = datetime.now(timezone.utc)
    expires_at = (now + timedelta(days=int(sub.get("duration_days", 30)))).isoformat()
    await db.subscriptions.update_one(
        {"subscription_id": sub_id},
        {"$set": {"status": "active", "paid_at": now.isoformat(), "expires_at": expires_at}}
    )
    updated = await db.subscriptions.find_one({"subscription_id": sub_id}, {"_id": 0})
    return updated

@api_router.put("/admin/subscriptions/{sub_id}/reject")
async def admin_reject_subscription(sub_id: str, request: Request):
    await require_admin(request)
    await db.subscriptions.update_one(
        {"subscription_id": sub_id},
        {"$set": {"status": "rejected", "rejected_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Assinatura rejeitada"}

# ==================== DEMO SEED ====================
@api_router.post("/admin/seed-demo-products")
async def admin_seed_demo_products(request: Request):
    await require_admin(request)
    admin = await get_current_user(request)
    demo_items = [
        ("Smartphone Premium Galaxy Ultra", "Flagship com câmera de 200MP e tela AMOLED 120Hz.", 4299.00, "eletronicos", "loja", "new",
         "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=700"),
        ("Tênis Esportivo Runner Pro", "Amortecimento avançado e mesh respirável, ideal para corrida.", 389.90, "esportes", "loja", "new",
         "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700"),
        ("Luminária Decor Dourada", "Peça icônica para sala de estar, base em metal dourado fosco.", 529.00, "casa", "loja", "new",
         "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=700"),
        ("Jaqueta Leather Vintage", "Couro legítimo, corte clássico. Usada poucas vezes.", 220.00, "roupas", "desapega", "like_new",
         "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=700"),
        ("Coleção Funko Pop Series", "5 peças em perfeito estado, fora da caixa.", 180.00, "colecionaveis", "desapega", "good",
         "https://images.unsplash.com/photo-1608889175638-9322300c17ed?w=700"),
        ("Bicicleta Aro 29 MTB", "Suspensão dianteira, 21 marchas, revisada recentemente.", 1250.00, "esportes", "desapega", "like_new",
         "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=700"),
    ]
    created = 0
    now_iso = datetime.now(timezone.utc).isoformat()
    for title, desc, price, cat, ltype, cond, img in demo_items:
        exists = await db.products.find_one({"title": title})
        if exists:
            continue
        pid = str(uuid.uuid4())
        doc = {
            "product_id": pid,
            "seller_id": admin["user_id"],
            "title": title,
            "description": desc,
            "price": float(price),
            "category": cat,
            "condition": cond,
            "city": "São Paulo",
            "state": "SP",
            "images": [img],
            "image": img,
            "imageUrl": img,
            "thumbnailUrl": img,
            "listing_type": ltype,
            "product_type": "secondhand" if ltype == "desapega" else "new",
            "stock": 10,
            "status": "active",
            "is_active": True,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        await db.products.insert_one(doc)
        created += 1
    return {"message": f"{created} produtos demo criados", "created": created}

# ==================== COUPONS ====================
@api_router.get("/admin/coupons")
async def admin_list_coupons(request: Request):
    await require_admin(request)
    coupons = await db.coupons.find({}, {"_id": 0}).to_list(100)
    return {"coupons": coupons}

@api_router.post("/admin/coupons")
async def admin_create_coupon(request: Request):
    await require_admin(request)
    body = await request.json()
    coupon = {
        "coupon_id": f"coupon_{uuid.uuid4().hex[:12]}",
        "code": sanitize_text(body.get("code", ""), 50).upper(),
        "type": body.get("type", "percentage"),
        "value": float(body.get("value", 0)),
        "active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.coupons.insert_one(coupon)
    return {k: v for k, v in coupon.items() if k != "_id"}

@api_router.put("/admin/coupons/{coupon_id}")
async def admin_update_coupon(coupon_id: str, request: Request):
    await require_admin(request)
    body = await request.json()
    allowed = {"code", "type", "value", "active"}
    clean = {k: v for k, v in body.items() if k in allowed}
    await db.coupons.update_one({"coupon_id": coupon_id}, {"$set": clean})
    return await db.coupons.find_one({"coupon_id": coupon_id}, {"_id": 0})

@api_router.delete("/admin/coupons/{coupon_id}")
async def admin_delete_coupon(coupon_id: str, request: Request):
    await require_admin(request)
    await db.coupons.delete_one({"coupon_id": coupon_id})
    return {"message": "Cupom removido"}

# ==================== STATIC PAGES ====================
@api_router.get("/pages/{page_slug}")
async def get_static_page(page_slug: str):
    page = await db.static_pages.find_one({"slug": page_slug}, {"_id": 0})
    if not page:
        return {"slug": page_slug, "content": ""}
    return page

@api_router.put("/admin/pages/{page_slug}")
async def update_static_page(page_slug: str, data: PageUpdate, request: Request):
    await require_admin(request)
    await db.static_pages.update_one(
        {"slug": page_slug},
        {"$set": {"slug": page_slug, "content": data.content, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"message": "Página atualizada"}

# ==================== BRANE COINS ====================
@api_router.get("/brane-coins")
async def get_brane_coins(request: Request):
    user = await get_current_user(request)
    u = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "brane_coins": 1})
    return {"brane_coins": u.get("brane_coins", 0) if u else 0}

# ==================== ORDER TRACKING ====================
@api_router.get("/orders/{order_id}/tracking")
async def get_order_tracking(order_id: str, request: Request):
    await get_current_user(request)
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Pedido nao encontrado")
    return {
        "order_id": order["order_id"],
        "tracking_code": order.get("tracking_code", ""),
        "status": order.get("status", "pending"),
        "tracking": order.get("tracking", []),
        "created_at": order.get("created_at", "")
    }

# ==================== ADMIN: CUSTOMIZAÇÃO ====================
@api_router.get("/admin/customization")
async def get_admin_customization(request: Request):
    await require_admin(request)
    custom = await db.admin_customization.find_one({"key": "settings"}, {"_id": 0})
    defaults = {
        "dashboard_bg_color": "#F3F4F6",
        "sidebar_bg_color": "#1F2937",
        "sidebar_text_color": "#FFFFFF",
        "header_bg_color": "#FFFFFF",
        "header_text_color": "#111827",
        "button_primary_color": "#3B82F6",
        "button_primary_text_color": "#FFFFFF",
        "card_bg_color": "#FFFFFF",
        "card_border_color": "#E5E7EB",
        "text_primary_color": "#111827",
        "text_secondary_color": "#6B7280",
        "success_color": "#10B981",
        "warning_color": "#F59E0B",
        "danger_color": "#EF4444",
        "category_text_color": "#111827",
        "category_bg_color": "#FFFFFF"
    }
    return {**defaults, **(custom["value"] if custom else {})}

@api_router.put("/admin/customization")
async def update_admin_customization(request: Request):
    await require_admin(request)
    body = await request.json()
    await db.admin_customization.update_one(
        {"key": "settings"},
        {"$set": {"key": "settings", "value": body, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"message": "Personalizacao atualizada", "settings": body}

@api_router.get("/admin/layout-settings")
async def get_admin_layout_settings(request: Request):
    await require_admin(request)
    layout = await db.admin_customization.find_one({"key": "layout"}, {"_id": 0})
    defaults = {
        "buyer_profile_layout": "default",
        "seller_profile_layout": "default",
        "admin_dashboard_layout": "default",
        "show_sidebar": True,
        "sidebar_collapsed": False,
        "theme_mode": "light"
    }
    return {**defaults, **(layout["value"] if layout else {})}

@api_router.put("/admin/layout-settings")
async def update_admin_layout_settings(request: Request):
    await require_admin(request)
    body = await request.json()
    await db.admin_customization.update_one(
        {"key": "layout"},
        {"$set": {"key": "layout", "value": body, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"message": "Layout atualizado", "settings": body}

# ==================== NEWSLETTER ====================
import re as _re
_EMAIL_RX = _re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")

class SubscribeRequest(BaseModel):
    email: str

@api_router.post("/subscribers")
async def subscribe_newsletter(payload: SubscribeRequest):
    email = (payload.email or "").strip().lower()
    if not email or not _EMAIL_RX.match(email):
        raise HTTPException(status_code=400, detail="Email invalido")
    existing = await db.subscribers.find_one({"email": email}, {"_id": 0})
    if existing:
        return {"message": "Voce ja esta inscrito! Obrigado :)", "already_subscribed": True}
    await db.subscribers.insert_one({
        "subscriber_id": f"sub_{uuid.uuid4().hex[:12]}",
        "email": email,
        "subscribed_at": datetime.now(timezone.utc).isoformat(),
        "source": "footer",
    })
    return {"message": "Inscricao confirmada! Voce recebera nossas ofertas.", "already_subscribed": False}

@api_router.get("/admin/subscribers")
async def list_subscribers(request: Request, skip: int = 0, limit: int = 1000, search: str = ""):
    await require_admin(request)
    query = {}
    if search:
        query["email"] = {"$regex": _re.escape(search.strip()), "$options": "i"}
    items = await db.subscribers.find(query, {"_id": 0}).sort("subscribed_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.subscribers.count_documents(query)
    return {"subscribers": items, "total": total}

@api_router.delete("/admin/subscribers/{subscriber_id}")
async def delete_subscriber(subscriber_id: str, request: Request):
    await require_admin(request)
    result = await db.subscribers.delete_one({"subscriber_id": subscriber_id})
    return {"message": "Inscrito removido"}

# ==================== EMAIL CAMPAIGNS ====================
def _build_campaign_html(title: str, content: str, button_text: str = "", button_url: str = "") -> str:
    safe_content = (content or "").replace("\n", "<br>")
    button_html = ""
    if button_text and button_url:
        button_html = f'''
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 24px auto;">
          <tr>
            <td align="center" bgcolor="#D4A24C" style="border-radius: 8px;">
              <a href="{button_url}" target="_blank" style="display: inline-block; padding: 14px 28px; color: #000000; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 8px;">{button_text}</a>
            </td>
          </tr>
        </table>
        '''
    return f'''<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0B0D12;font-family:Arial,sans-serif;color:#F7F7FA;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#0B0D12" style="padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#11131A;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#D4A24C 0%,#B38B36 100%);padding:24px;text-align:center;">
              <h1 style="margin:0;color:#0B0D12;font-size:22px;font-weight:bold;font-family:Arial,sans-serif;">BRANE Marketplace</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 24px;">
              <h2 style="color:#F7F7FA;font-size:20px;margin:0 0 16px 0;font-family:Arial,sans-serif;">{title}</h2>
              <div style="color:#A6A8B3;font-size:14px;line-height:1.6;font-family:Arial,sans-serif;">{safe_content}</div>
              {button_html}
            </td>
          </tr>
          <tr>
            <td style="background:#0B0D12;padding:18px 24px;text-align:center;border-top:1px solid #1E2230;">
              <p style="color:#6F7280;font-size:11px;margin:0;font-family:Arial,sans-serif;">
                &copy; {datetime.now(timezone.utc).year} Brane Marketplace. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'''

class CampaignCreate(BaseModel):
    subject: str
    title: str
    content: str
    button_text: Optional[str] = ""
    button_url: Optional[str] = ""

@api_router.post("/admin/campaigns/preview")
async def preview_campaign(payload: CampaignCreate, request: Request):
    await require_admin(request)
    if not payload.subject.strip() or not payload.title.strip() or not payload.content.strip():
        raise HTTPException(status_code=400, detail="Assunto, titulo e conteudo sao obrigatorios")
    html_content = _build_campaign_html(payload.title, payload.content, payload.button_text or "", payload.button_url or "")
    return {"subject": payload.subject, "html": html_content}

@api_router.post("/admin/campaigns")
async def create_and_send_campaign(payload: CampaignCreate, request: Request):
    await require_admin(request)
    if not RESEND_API_KEY:
        raise HTTPException(status_code=500, detail="Servico de e-mail nao configurado (RESEND_API_KEY)")
    if not payload.subject.strip() or not payload.title.strip() or not payload.content.strip():
        raise HTTPException(status_code=400, detail="Assunto, titulo e conteudo sao obrigatorios")

    subscribers = await db.subscribers.find({}, {"_id": 0, "email": 1}).to_list(10000)
    if not subscribers:
        raise HTTPException(status_code=400, detail="Nenhum inscrito para enviar")

    html_content = _build_campaign_html(payload.title, payload.content, payload.button_text or "", payload.button_url or "")
    campaign_id = f"camp_{uuid.uuid4().hex[:12]}"
    sent_count = 0
    error_count = 0
    errors = []

    for sub in subscribers:
        email = sub.get("email")
        if not email:
            continue
        try:
            params = {
                "from": SENDER_EMAIL,
                "to": [email],
                "subject": payload.subject,
                "html": html_content,
            }
            await asyncio.to_thread(resend.Emails.send, params)
            sent_count += 1
        except Exception as e:
            error_count += 1
            errors.append({"email": email, "error": str(e)[:200]})
            logger.error(f"Failed to send campaign to {email}: {e}")

    campaign_doc = {
        "campaign_id": campaign_id,
        "subject": payload.subject,
        "title": payload.title,
        "content": payload.content,
        "button_text": payload.button_text or "",
        "button_url": payload.button_url or "",
        "total_subscribers": len(subscribers),
        "sent_count": sent_count,
        "error_count": error_count,
        "errors": errors[:20],
        "status": "completed" if error_count == 0 else "partial",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.campaigns.insert_one(campaign_doc)
    return {k: v for k, v in campaign_doc.items() if k != "_id"}

@api_router.get("/admin/campaigns")
async def list_campaigns(request: Request, limit: int = 100):
    await require_admin(request)
    items = await db.campaigns.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return {"campaigns": items, "total": len(items)}

@api_router.get("/admin/campaigns/{campaign_id}")
async def get_campaign(campaign_id: str, request: Request):
    await require_admin(request)
    item = await db.campaigns.find_one({"campaign_id": campaign_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Campanha nao encontrada")
    return item

# ==================== FOOTER CONFIG ====================
def _default_footer_config():
    return {
        "social_links": {
            "instagram": {"url": "", "enabled": False},
            "facebook": {"url": "", "enabled": False},
            "twitter": {"url": "", "enabled": False},
            "other": {"url": "", "enabled": False, "label": "Site"},
        }
    }

@api_router.get("/footer-config")
async def get_footer_config_public():
    doc = await db.platform_settings.find_one({"key": "footer_config"}, {"_id": 0})
    if not doc:
        return _default_footer_config()
    return doc.get("value") or _default_footer_config()

@api_router.get("/admin/footer-config")
async def get_footer_config_admin(request: Request):
    await require_admin(request)
    doc = await db.platform_settings.find_one({"key": "footer_config"}, {"_id": 0})
    if not doc:
        return _default_footer_config()
    return doc.get("value") or _default_footer_config()

class FooterConfigUpdate(BaseModel):
    social_links: dict

@api_router.put("/admin/footer-config")
async def update_footer_config(payload: FooterConfigUpdate, request: Request):
    await require_admin(request)
    value = {"social_links": payload.social_links}
    await db.platform_settings.update_one(
        {"key": "footer_config"},
        {"$set": {"key": "footer_config", "value": value}},
        upsert=True,
    )
    return value

# ==================== MONGODB INDEXES ====================
async def create_mongodb_indexes():
    """
    Cria índices no MongoDB para otimizar consultas.
    Executado no startup da aplicação.
    Índices são idempotentes - não causam erro se já existirem.
    """
    if isinstance(db, MockDB):
        logger.info("MockDB: pulando criação de índices")
        return
    
    try:
        # Índices de produtos (mais críticos para performance do feed)
        await db.products.create_index([("status", 1), ("created_at", -1)])
        await db.products.create_index([("seller_id", 1)])
        await db.products.create_index([("category", 1), ("status", 1)])
        await db.products.create_index([("city", 1), ("status", 1)])
        await db.products.create_index([("product_type", 1), ("status", 1)])
        await db.products.create_index([("is_deleted", 1), ("status", 1), ("created_at", -1)])
        await db.products.create_index([("title", "text"), ("description", "text")])
        
        # Índices de usuários
        await db.users.create_index([("email", 1)], unique=True, sparse=True)
        await db.users.create_index([("user_id", 1)], unique=True, sparse=True)
        await db.users.create_index([("role", 1)])
        await db.users.create_index([("is_blocked", 1)])
        
        # Índices de mensagens diretas
        await db.direct_messages.create_index([("thread_id", 1), ("created_at", 1)])
        await db.direct_messages.create_index([("sender_id", 1)])
        await db.direct_messages.create_index([("recipient_id", 1)])
        await db.direct_messages.create_index([("recipient_id", 1), ("read", 1)])
        
        # Índices de mensagens de loja
        await db.store_messages.create_index([("store_id", 1), ("created_at", -1)])
        await db.store_messages.create_index([("sender_id", 1)])
        
        # Índices de pedidos
        await db.orders.create_index([("buyer_id", 1), ("created_at", -1)])
        await db.orders.create_index([("status", 1), ("created_at", -1)])
        await db.orders.create_index([("items.seller_id", 1)])
        
        # Índices de denúncias
        await db.reports.create_index([("status", 1), ("created_at", -1)])
        await db.reports.create_index([("reporter_id", 1)])
        await db.reports.create_index([("reported_user_id", 1)])
        
        # Índices de social posts (B Livre)
        await db.social_posts.create_index([("created_at", -1)])
        await db.social_posts.create_index([("user_id", 1)])
        await db.social_posts.create_index([("is_blocked", 1), ("created_at", -1)])
        
        # Índices de comentários
        await db.social_comments.create_index([("post_id", 1), ("created_at", 1)])
        
        # Índices de notificações
        await db.notifications.create_index([("user_id", 1), ("created_at", -1)])
        await db.notifications.create_index([("user_id", 1), ("read", 1)])
        
        # Índices de lojas
        await db.stores.create_index([("owner_id", 1)])
        await db.stores.create_index([("slug", 1)], unique=True, sparse=True)
        await db.stores.create_index([("is_approved", 1)])
        
        # Índices de carteira
        await db.wallets.create_index([("user_id", 1)], unique=True, sparse=True)
        await db.wallet_transactions.create_index([("user_id", 1), ("created_at", -1)])
        
        # Índices de saques
        await db.withdrawals.create_index([("user_id", 1)])
        await db.withdrawals.create_index([("status", 1), ("created_at", -1)])
        
        # Índices de suporte
        await db.support_messages.create_index([("user_id", 1)])
        await db.support_messages.create_index([("status", 1), ("created_at", -1)])
        
        # Índices de assinaturas
        await db.subscriptions.create_index([("seller_id", 1)])
        await db.subscriptions.create_index([("status", 1)])
        
        # Índices de storage de arquivos (legado)
        await db.file_storage.create_index([("path", 1)], unique=True, sparse=True)
        
        logger.info("✅ Índices MongoDB criados com sucesso")
    except Exception as e:
        logger.error(f"Erro ao criar índices MongoDB: {e}")

# ==================== CORS + APP SETUP ====================
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(api_router)

@app.get("/api/social/profile")
async def get_social_profile_test():
    return {"status": "ok"}
    
@app.put("/api/social/profile")
async def update_social_profile_direct(request: Request):
    user = await get_current_user(request)
    data = await request.json()
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "user_id": user["user_id"],
            "name": sanitize_text(data.get("name", ""), 100),
            "city": sanitize_text(data.get("city", ""), 100),
            "state": sanitize_text(data.get("state", ""), 100),
            "avatar": data.get("avatar", "")
        }},
        upsert=True
    )
    return {"ok": True}

@app.on_event("startup")
async def startup():
    try:
        # Criar diretório de uploads
        UPLOADS_DIR.mkdir(exist_ok=True)
        
        # Admin padrão solicitado pelo usuário
        admin_req = await db.users.find_one({"email": "admin@branelivre.com"}, {"_id": 0})
        if not admin_req:
            admin_id = f"user_{uuid.uuid4().hex[:12]}"
            await db.users.insert_one({
                "user_id": admin_id, "name": "Admin B-Livre", "email": "admin@branelivre.com",
                "password_hash": hash_password("123456"), "role": "admin",
                "picture": "", "bank_details": {}, "is_blocked": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            await db.wallets.insert_one({"user_id": admin_id, "available": 0.0, "held": 0.0})
            logger.info("Admin user created: admin@branelivre.com / 123456")

        admin = await db.users.find_one({"email": "admin@brane.com"}, {"_id": 0})
        if not admin:
            admin_id = f"user_{uuid.uuid4().hex[:12]}"
            await db.users.insert_one({
                "user_id": admin_id, "name": "Admin BRANE", "email": "admin@brane.com",
                "password_hash": hash_password("Admin123!"), "role": "admin",
                "picture": "", "bank_details": {}, "is_blocked": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            await db.wallets.insert_one({"user_id": admin_id, "available": 0.0, "held": 0.0})
            logger.info("Admin user created: admin@brane.com / Admin123!")
        
        comm = await db.platform_settings.find_one({"key": "commissions"})
        if not comm:
            await db.platform_settings.insert_one({"key": "commissions", "value": {"platform_commission": 0.09, "affiliate_commission": 0.065}})
        
        shipping = await db.platform_settings.find_one({"key": "shipping"})
        if not shipping:
            await db.platform_settings.insert_one({
                "key": "shipping",
                "value": {
                    "options": [
                        {"name": "Gratis", "price": 0, "days": "7-15 dias uteis", "enabled": True},
                        {"name": "Normal", "price": 15.90, "days": "5-8 dias uteis", "enabled": True},
                        {"name": "Expresso", "price": 29.90, "days": "2-3 dias uteis", "enabled": True}
                    ]
                }
            })
        
        # Criar índices MongoDB
        await create_mongodb_indexes()
        
        try:
            init_storage()
            logger.info("Storage local pronto: uploads/")
        except Exception as e:
            logger.error(f"Storage init failed: {e}")
        
        logger.info("🚀 BRANE Marketplace iniciado com otimizações de performance!")
    except Exception as e:
        logger.error(f"Startup database initialization failed: {e}")
        logger.info("App starting without database initialization")


@app.on_event("shutdown")
async def shutdown_db_client():
    if client is not None:
        client.close()

@app.get("/teste")
def teste():
    return {"ok": True}

port = int(os.environ.get("PORT", 8080))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=port)
