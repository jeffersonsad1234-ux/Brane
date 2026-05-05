from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Request, Response
from fastapi.responses import JSONResponse, PlainTextResponse
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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

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
            return doc
        elif upsert:
            new_doc = query.copy()
            if "$set" in update: new_doc.update(update["$set"])
            self.data.append(new_doc)
            return new_doc
    async def delete_one(self, query):
        doc = await self.find_one(query)
        if doc: self.data.remove(doc)
    async def delete_many(self, query):
        self.data = [item for item in self.data if not all(item.get(k) == v for k, v in query.items())]
    def find(self, query, projection=None):
        class Cursor:
            def __init__(self, data): self.data = data
            def sort(self, field, direction): 
                self.data.sort(key=lambda x: x.get(field, ""), reverse=(direction == -1))
                return self
            def skip(self, n): self.data = self.data[n:]; return self
            def limit(self, n): self.data = self.data[:n]; return self
            async def to_list(self, n): return self.data[:n]
            def __aiter__(self):
                self.iter = iter(self.data)
                return self
            async def __anext__(self):
                try: return next(self.iter)
                except StopIteration: raise StopAsyncIteration
        
        filtered = [item for item in self.data if all(item.get(k) == v for k, v in query.items())]
        return Cursor(filtered)
    async def count_documents(self, query):
        return len([item for item in self.data if all(item.get(k) == v for k, v in query.items())])

class MockDB:
    def __init__(self):
        self.collections = {}
    def __getitem__(self, name):
        if name not in self.collections: self.collections[name] = MockCollection(name)
        return self.collections[name]
    def __getattr__(self, name):
        return self.__getitem__(name)

# Forcing MockDB for sandbox environment to ensure 100% availability
db = MockDB()

# Seed initial data for sandbox
def seed_data():
    import uuid
    from datetime import datetime, timezone
    
    # Check if already seeded
    if len(db['social_posts'].data) > 0: return
    
    seeds = [
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
    db['social_posts'].data.extend(seeds)

seed_data()
client = None # Define client to avoid NameError in shutdown
logging.info("Using MockDB for sandbox environment")
JWT_SECRET = os.environ.get('JWT_SECRET', 'brane-secret-key')
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 72

# Resend configuration
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

#STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
#EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "brane-marketplace"
#storage_key = None

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI()

@app.get("/", response_class=PlainTextResponse)
def root():
    return "OK"

@app.get("/health")
def health():
    return {"status": "ok"}

api_router = APIRouter(prefix="/api")

# Middleware para adicionar headers anti-cache nas respostas da API
@app.middleware("http")
async def add_no_cache_headers(request, call_next):
    response = await call_next(request)
    # Apenas para rotas da API
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
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
class SellerTermsAccept(BaseModel):
    accepted: bool = True

class Sale(BaseModel):
    sale_id: Optional[str] = None
    user_id: str
    customer_name: str
    value: float
    status: str = "pending"
    created_at: Optional[str] = None 
    
class Sale(BaseModel):
    sale_id: str
    buyer_id: str
    seller_id: str
    product_id: str
    amount: float
    status: str  # "pending" | "released"
    created_at: datetime    
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
    # Storage agora usa MongoDB - nenhuma inicializacao externa necessaria
    return True

async def put_object_mongo(db_ref, path: str, data: bytes, content_type: str) -> dict:
    """Salva arquivo diretamente no MongoDB como base64"""
    encoded = base64.b64encode(data).decode('utf-8')
    await db_ref.file_storage.update_one(
        {"path": path},
        {"$set": {
            "path": path,
            "data": encoded,
            "content_type": content_type,
            "size": len(data),
            "created_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    return {"path": path, "size": len(data)}

async def get_object_mongo(db_ref, path: str):
    """Recupera arquivo do MongoDB"""
    doc = await db_ref.file_storage.find_one({"path": path})
    if not doc:
        return None, None
    data = base64.b64decode(doc["data"])
    return data, doc.get("content_type", "application/octet-stream")

def clean_user(user: dict) -> dict:
    return {k: v for k, v in user.items() if k not in ("password_hash", "_id")}


# ==================== EMAIL VALIDATION ====================
import re

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

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")

def validate_email_strict(email: str) -> tuple[bool, str]:
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
    # Removendo bloqueio de emails temporários para facilitar testes e uso real
    # if domain in DISPOSABLE_EMAIL_DOMAINS:
    #     return False, "Emails temporarios/descartaveis nao sao permitidos"
    
    local_part = email.split("@")[0]
    if len(local_part) < 1:
        return False, "Email muito curto"
    
    return True, ""

# ==================== AUTH ROUTES ====================
@api_router.post("/auth/register")
async def register(data: UserRegister):
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
    if not data.name or len(data.name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Nome invalido")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    register_role = data.role if data.role in ("buyer", "seller", "affiliate", "admin") else "buyer"
    user = {
        "user_id": user_id, "name": data.name.strip(), "email": email_normalized,
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
async def login(data: UserLogin):
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
    updates = {k: v for k, v in body.items() if k in {"name", "picture"}}
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
    allowed = {"bio", "cover_photo", "phone", "name", "picture"}
    updates = {k: v for k, v in body.items() if k in allowed}
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
        "role": user.get("role", "buyer"),
        "created_at": user.get("created_at", "")
    }

# ==================== BRANE SOCIAL ROUTES ====================
@api_router.get("/social/profile")
async def get_social_profile():
    return {"status": "ok"}

@api_router.post("/social/posts")
async def create_social_post(data: SocialPostCreate, request: Request):
    user = await get_current_user(request)
    if not data.content or len(data.content.strip()) < 1:
        raise HTTPException(status_code=400, detail="Conteudo vazio")
    post_id = f"post_{uuid.uuid4().hex[:12]}"
    post = {
        "post_id": post_id,
        "user_id": user["user_id"],
        "user_name": user.get("name", ""),
        "user_picture": user.get("picture", ""),
        "content": data.content.strip()[:2000],
        "image": data.image or "",
        "title": data.title,
        "price": data.price,
        "category": data.category,
        "state": data.state,
        "city": data.city,
        "product_condition": data.product_condition,
        "description": data.description,
        "availability": data.availability,
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
        return {"liked": False, "likes_count": max(0, post.get("likes_count", 1) - 1)}
    else:
        await db.social_posts.update_one(
            {"post_id": post_id},
            {"$push": {"likes": user["user_id"]}, "$inc": {"likes_count": 1}}
        )
        return {"liked": True, "likes_count": post.get("likes_count", 0) + 1}

@api_router.put("/social/posts/{post_id}")
async def update_social_post(post_id: str, data: dict, request: Request):
    user = await get_current_user(request)
    post = await db.social_posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post nao encontrado")
    if post["user_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Sem permissao")
    
    allowed_fields = {
        "content", "image", "title", "price", "category", 
        "state", "city", "product_condition", "description", "availability"
    }
    updates = {k: v for k, v in data.items() if k in allowed_fields}
    
    if updates:
        await db.social_posts.update_one({"post_id": post_id}, {"$set": updates})
    
    updated = await db.social_posts.find_one({"post_id": post_id}, {"_id": 0})
    return updated

@api_router.delete("/social/posts/{post_id}")
async def delete_social_post(post_id: str, request: Request):
    user = await get_current_user(request)
    post = await db.social_posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post nao encontrado")
    if post["user_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Sem permissao")
    await db.social_posts.delete_one({"post_id": post_id})
    await db.social_comments.delete_many({"post_id": post_id})
    return {"message": "Post removido"}

@api_router.post("/social/posts/{post_id}/comments")
async def create_comment(post_id: str, data: SocialCommentCreate, request: Request):
    user = await get_current_user(request)
    post = await db.social_posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post nao encontrado")
    if not data.content.strip():
        raise HTTPException(status_code=400, detail="Comentario vazio")
    comment_id = f"cmt_{uuid.uuid4().hex[:12]}"
    comment = {
        "comment_id": comment_id,
        "post_id": post_id,
        "user_id": user["user_id"],
        "user_name": user.get("name", ""),
        "user_picture": user.get("picture", ""),
        "content": data.content.strip()[:500],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.social_comments.insert_one(comment)
    await db.social_posts.update_one({"post_id": post_id}, {"$inc": {"comments_count": 1}})
    return {k: v for k, v in comment.items() if k != "_id"}

@api_router.get("/social/posts/{post_id}/comments")
async def list_comments(post_id: str):
    comments = await db.social_comments.find({"post_id": post_id}, {"_id": 0}).sort("created_at", 1).to_list(200)
    return {"comments": comments}
# =========================
# FAVORITOS
# =========================

@api_router.post("/social/favorites/{post_id}")
async def toggle_favorite(post_id: str, request: Request):
    user = await get_current_user(request)

    existing = await db.social_favorites.find_one({
        "user_id": user["user_id"],
        "post_id": post_id
    })

    if existing:
        await db.social_favorites.delete_one({"_id": existing["_id"]})
        return {"favorited": False}

    await db.social_favorites.insert_one({
        "user_id": user["user_id"],
        "post_id": post_id
    })

    return {"favorited": True}


@api_router.get("/social/favorites")
async def get_favorites(request: Request):
    user = await get_current_user(request)

    favs = db.social_favorites.find({"user_id": user["user_id"]})
    ids = [f["post_id"] async for f in favs]

    return {"favorites": ids}


# =========================
# VISUALIZAÇÕES
# =========================

@api_router.put("/social/profile")
async def update_profile(data: dict, request: Request):
    user = await get_current_user(request)

    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "name": data.get("name", ""),
            "city": data.get("city", ""),
            "state": data.get("state", ""),
            "avatar": data.get("avatar", "")
        }},
        upsert=True
    )

    return {"ok": True}


# =========================
# INTERESSE
# =========================

@api_router.post("/social/posts/{post_id}/interest")
async def register_interest(post_id: str, request: Request):
    user = await get_current_user(request)

    await db.social_interests.insert_one({
        "post_id": post_id,
        "user_id": user["user_id"],
        "created_at": datetime.now(timezone.utc)
    })

    return {"ok": True}


# =========================
# STATS (ALCANCE)
# =========================

@api_router.get("/social/stats")
async def get_stats(request: Request):
    user = await get_current_user(request)

    my_posts = db.social_posts.find({"user_id": user["user_id"]})
    post_ids = [p["post_id"] async for p in my_posts]

    views = await db.social_views.count_documents({
        "post_id": {"$in": post_ids}
    })

    interests = await db.social_interests.count_documents({
        "post_id": {"$in": post_ids}
    })

    return {
        "views": views,
        "interests": interests,
        "my_ads": len(post_ids)
    }


# =========================
# MENSAGENS
# =========================

@api_router.post("/social/messages")
async def send_message(data: dict, request: Request):
    user = await get_current_user(request)

    message = {
        "post_id": data.get("post_id"),
        "message": data.get("message"),
        "sender_id": user["user_id"],
        "sender_name": user.get("name", ""),
        "created_at": datetime.now(timezone.utc)
    }

    await db.social_messages.insert_one(message)

    return {"ok": True}


@api_router.get("/social/messages")
async def get_messages(request: Request):
    user = await get_current_user(request)

    msgs = db.social_messages.find({
        "sender_id": user["user_id"]
    }).sort("created_at", -1)

    result = []
    async for m in msgs:
        m.pop("_id", None)
        result.append(m)

    return {"messages": result}


# =========================
# NOTIFICAÇÕES
# =========================

@api_router.get("/notifications")
async def get_notifications(request: Request):
    user = await get_current_user(request)

    notifs = db.notifications.find({
        "user_id": user["user_id"]
    }).sort("created_at", -1)
    result = []
    async for n in notifs:
        n.pop("_id", None)
        result.append(n)

    return {"notifications": result}


# =========================
# PERFIL
# =========================
@api_router.get("/social/profile")
async def get_social_profile(request: Request):
    user = await get_current_user(request)

    profile = await db.users.find_one(
        {"user_id": user["user_id"]},
        {"_id": 0}
    )

    if not profile:
        profile = {
            "user_id": user["user_id"],
            "name": user.get("name", ""),
            "city": user.get("city", ""),
            "state": user.get("state", ""),
            "avatar": user.get("avatar", user.get("picture", ""))
        }

    return {"profile": profile}
@api_router.put("/social/profile")
async def update_profile(data: dict, request: Request):
    user = await get_current_user(request)

    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "name": data.get("name"),
            "city": data.get("city"),
            "state": data.get("state"),
            "avatar": data.get("avatar")
        }}
    )

    return {"ok": True}

# ==================== PRODUCT ROUTES ====================
@api_router.get("/products")
async def list_products(search: Optional[str] = None, category: Optional[str] = None, city: Optional[str] = None, page: int = 1, limit: int = 20):
    query = {
        "status": "active",
        "$or": [
            {"is_deleted": False},
            {"is_deleted": {"$exists": False}}
        ]
    }
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    if category:
        query["category"] = category
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    skip = (page - 1) * limit
    products = await db.products.find(
        query,
        {
            "_id": 0,
            "product_id": 1,
            "title": 1,
            "price": 1,
            "city": 1,
            "image": 1,
            "images": {"$slice": 1},
            "seller_id": 1,
            "created_at": 1
        }
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
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
    return {**product, "seller": seller}
def compress_base64_image(image_data: str) -> str:
    try:
        if not image_data or not image_data.startswith("data:image"):
            return image_data

        header, encoded = image_data.split(",", 1)
        raw = base64.b64decode(encoded)

        img = Image.open(BytesIO(raw))

        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        img.thumbnail((1200, 1200))

        output = BytesIO()
        img.save(output, format="JPEG", quality=70, optimize=True)

        compressed = base64.b64encode(output.getvalue()).decode("utf-8")
        return "data:image/jpeg;base64," + compressed

    except Exception:
        return image_data
@api_router.post("/products")
async def create_product(data: ProductCreate, request: Request):
    user = await require_seller(request)
    if data.category in ("imoveis", "automoveis") and not data.city:
        raise HTTPException(status_code=400, detail="Cidade obrigatoria para imoveis/automoveis")
    product_id = f"prod_{uuid.uuid4().hex[:12]}"
    product = {
        "product_id": product_id, "title": data.title, "description": data.description,
        "price": data.price, "category": data.category, "city": data.city or "",
        "location": data.location or "",
"image": compress_base64_image(data.images[0]) if data.images else "",
"images": [compress_base64_image(img) for img in data.images] if data.images else [],
"product_type": data.product_type or "store",
        "condition": data.condition or "new",
        "seller_id": user["user_id"], "seller_name": user["name"],
        "status": "active", "created_at": datetime.now(timezone.utc).isoformat()
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
    if updates:
        await db.products.update_one({"product_id": product_id}, {"$set": updates})
    return await db.products.find_one({"product_id": product_id}, {"_id": 0})

query = {
    "status": "active",
    "$or": [
        {"is_deleted": False},
        {"is_deleted": {"$exists": False}}
    ]
}
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

    await db.products.delete_many({
        "seller_id": "JXTRHT"
    })

    return {"message": "Produto removido"}

@api_router.get("/products/seller/mine")
async def get_my_products(request: Request):
    user = await require_seller(request)
    products = await db.products.find({"seller_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
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
    slug = data.name.lower().replace(" ", "-").replace(".", "")[:30] + f"-{store_id[-6:]}"
    
    store = {
        "store_id": store_id,
        "owner_id": user["user_id"],
        "owner_name": user["name"],
        "name": data.name,
        "slug": slug,
        "description": data.description or "",
        "logo": data.logo or "",
        "banner": data.banner or "",
        "category": data.category or "",
        "business_hours": data.business_hours or "",
        "plan": "free",  # free, pro, premium
        "plan_commission": 0.09,  # 9% for free
        "is_featured": False,  # Only PRO/PREMIUM can be featured
        "is_approved": True,  # Admin must approve to show in Stores section
        "ads_per_day": 0,  # 0 for free, 2 for PRO/PREMIUM
        "products_count": 0,
        "total_sales": 0,
        "rating": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.stores.insert_one(store)
    
    # Update user to be a seller
    await db.users.update_one(
        {"user_id": user["user_id"]}, 
        {"$set": {"role": "seller", "store_id": store_id}}
    )
    
    return {k: v for k, v in store.items() if k != "_id"}

@api_router.get("/stores")
async def list_stores(featured_only: bool = False, limit: int = 20, page: int = 1):
    query = {}
    if featured_only:
        query = {}
    skip = (page - 1) * limit
    stores = await db.stores.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Otimização: Buscar todos os produtos de uma vez (evita N+1 queries)
    if stores:
        owner_ids = [store["owner_id"] for store in stores]
        products = await db.products.find(
            {
                "seller_id": {"$in": owner_ids},
                "is_deleted": {"$ne": True}
            },
            {"_id": 0, "product_id": 1, "title": 1, "price": 1, "images": 1, "seller_id": 1}
        ).sort("created_at", -1).to_list(1000)
        
        # Agrupar produtos por seller_id
        products_by_seller = {}
        for p in products:
            seller_id = p.pop("seller_id")
            if seller_id not in products_by_seller:
                products_by_seller[seller_id] = []
            if len(products_by_seller[seller_id]) < 4:  # Max 4 produtos por loja
                products_by_seller[seller_id].append({
                    "product_id": p["product_id"],
                    "title": p["title"],
                    "price": p["price"],
                    "image": p["images"][0] if p.get("images") else ""
                })
        
        # Adicionar produtos em destaque para cada loja
        for store in stores:
            store["featured_products"] = products_by_seller.get(store["owner_id"], [])
    
    total = await db.stores.count_documents(query)
    return {"stores": stores, "total": total, "page": page}

@api_router.get("/stores/my")
async def get_my_store(request: Request):
    user = await get_current_user(request)
    store = await db.stores.find_one({"owner_id": user["user_id"]}, {"_id": 0})
    if not store:
        return {"store": None}
    return {"store": store}

@api_router.get("/stores/{store_id}")
async def get_store(store_id: str):
    # Support both store_id and slug
    store = await db.stores.find_one(
        {"$or": [{"store_id": store_id}, {"slug": store_id}]}, 
        {"_id": 0}
    )
    if not store:
        raise HTTPException(status_code=404, detail="Loja nao encontrada")
    # Get store products
    products = await db.products.find({"seller_id": store["owner_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
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
    if updates:
        await db.stores.update_one({"store_id": store_id}, {"$set": updates})
    return await db.stores.find_one({"store_id": store_id}, {"_id": 0})

@api_router.post("/stores/upgrade")
async def upgrade_store_plan(data: PlanUpgrade, request: Request):
    user = await get_current_user(request)
    store = await db.stores.find_one({"owner_id": user["user_id"]}, {"_id": 0})
    if not store:
        raise HTTPException(status_code=404, detail="Voce nao possui uma loja")
    
    plans = {
        "free": {"commission": 0.09, "ads_per_day": 0, "price": 0},
        "pro": {"commission": 0.02, "ads_per_day": 2, "price": 99},
        "premium": {"commission": 0.01, "ads_per_day": 2, "price": 199}
    }
    
    if data.plan not in plans:
        raise HTTPException(status_code=400, detail="Plano invalido")
    
    plan_info = plans[data.plan]
    await db.stores.update_one(
        {"store_id": store["store_id"]},
        {"$set": {
            "plan": data.plan,
            "plan_commission": plan_info["commission"],
            "ads_per_day": plan_info["ads_per_day"],
            "is_featured": data.plan in ["pro", "premium"]
        }}
    )
    
    return {"message": f"Plano atualizado para {data.plan.upper()}", "plan": data.plan}

# ==================== ADMIN STORE ROUTES ====================
@api_router.get("/admin/stores")
async def admin_list_stores(request: Request):
    await require_admin(request)
    stores = await db.stores.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"stores": stores}

@api_router.put("/admin/stores/{store_id}/approve")
async def admin_approve_store(store_id: str, request: Request):
    await require_admin(request)
    body = await request.json()
    approved = body.get("approved", True)
    await db.stores.update_one(
        {"store_id": store_id},
        {"$set": {"is_approved": approved}}
    )
    return {"message": "Loja aprovada" if approved else "Aprovacao removida"}

@api_router.put("/admin/stores/{store_id}/plan")
async def admin_set_store_plan(store_id: str, request: Request):
    await require_admin(request)
    body = await request.json()
    plan = body.get("plan", "free")
    
    plans = {
        "free": {"commission": 0.09, "ads_per_day": 0},
        "pro": {"commission": 0.02, "ads_per_day": 2},
        "premium": {"commission": 0.01, "ads_per_day": 2}
    }
    
    if plan not in plans:
        raise HTTPException(status_code=400, detail="Plano invalido")
    
    plan_info = plans[plan]
    await db.stores.update_one(
        {"store_id": store_id},
        {"$set": {
            "plan": plan,
            "plan_commission": plan_info["commission"],
            "ads_per_day": plan_info["ads_per_day"],
            "is_featured": plan in ["pro", "premium"]
        }}
    )
    return {"message": f"Plano alterado para {plan.upper()}"}

# ==================== ADS ROUTES ====================
@api_router.get("/ads")
async def list_ads(position: Optional[str] = None):
    query = {"active": True}
    if position:
        query["position"] = position
    ads = await db.ads.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"ads": ads}

@api_router.post("/ads")
async def create_ad(data: AdCreate, request: Request):
    user = await get_current_user(request)
    
    # Check if user can create ads
    if user["role"] != "admin":
        store = await db.stores.find_one({"owner_id": user["user_id"]}, {"_id": 0})
        if not store:
            raise HTTPException(status_code=403, detail="Voce precisa ter uma loja para criar anuncios")
        if store["plan"] not in ["pro", "premium"]:
            raise HTTPException(status_code=403, detail="Apenas planos PRO e PREMIUM podem criar anuncios")
        
        # Check daily ad limit
        today = datetime.now(timezone.utc).date().isoformat()
        ads_today = await db.ads.count_documents({
            "owner_id": user["user_id"],
            "created_at": {"$regex": f"^{today}"}
        })
        if ads_today >= store["ads_per_day"]:
            raise HTTPException(status_code=400, detail="Limite diario de anuncios atingido")
    
    ad_id = f"ad_{uuid.uuid4().hex[:12]}"
    ad = {
        "ad_id": ad_id,
        "owner_id": user["user_id"],
        "owner_name": user["name"],
        "title": data.title,
        "image": data.image,
        "link": data.link,
        "position": data.position or "between_products",
        "active": True if user["role"] == "admin" else False,  # Admin ads active immediately
        "clicks": 0,
        "views": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.ads.insert_one(ad)
    return {k: v for k, v in ad.items() if k != "_id"}

@api_router.get("/admin/ads")
async def admin_list_ads(request: Request):
    await require_admin(request)
    ads = await db.ads.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"ads": ads}

@api_router.put("/admin/ads/{ad_id}")
async def admin_update_ad(ad_id: str, data: AdUpdate, request: Request):
    await require_admin(request)
    updates = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if updates:
        await db.ads.update_one({"ad_id": ad_id}, {"$set": updates})
    return await db.ads.find_one({"ad_id": ad_id}, {"_id": 0})

@api_router.delete("/admin/ads/{ad_id}")
async def admin_delete_ad(ad_id: str, request: Request):
    await require_admin(request)
    await db.ads.delete_one({"ad_id": ad_id})
    return {"message": "Anuncio removido"}

@api_router.post("/ads/{ad_id}/click")
async def track_ad_click(ad_id: str):
    await db.ads.update_one({"ad_id": ad_id}, {"$inc": {"clicks": 1}})
    return {"message": "Click registrado"}

# ==================== UPLOAD ROUTES ====================
@api_router.post("/upload")
async def upload_file(request: Request, file: UploadFile = File(...)):
    user = await get_current_user(request)
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    path = f"{APP_NAME}/uploads/{user['user_id']}/{uuid.uuid4()}.{ext}"

    data = await file.read()

    # Limitar tamanho do arquivo (10MB)
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Arquivo muito grande (max 10MB)")

    try:
        result = await put_object_mongo(db, path, data, file.content_type or "application/octet-stream")
    except Exception as e:
        print("ERRO UPLOAD:", str(e))
        raise HTTPException(status_code=500, detail="Erro ao salvar arquivo")

    await db.files.insert_one({
        "file_id": str(uuid.uuid4()), "storage_path": result["path"],
        "original_filename": file.filename, "content_type": file.content_type,
        "size": result.get("size", len(data)), "user_id": user["user_id"],
        "is_deleted": False, "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"path": result["path"], "url": f"/api/files/{result['path']}"}

@api_router.get("/files/{path:path}")
async def get_file(path: str):
    try:
        data, content_type = await get_object_mongo(db, path)
        if data is None:
            raise HTTPException(status_code=404, detail="Arquivo nao encontrado")
        return Response(content=data, media_type=content_type)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=404, detail="Arquivo nao encontrado")

# ==================== CART ROUTES ====================
@api_router.get("/cart")
async def get_cart(request: Request):
    user = await get_current_user(request)
    items = await db.cart_items.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    for item in items:
        product = await db.products.find_one({"product_id": item["product_id"]}, {"_id": 0})
        if product:
            item["product"] = product
    return {"items": items}

@api_router.post("/cart")
async def add_to_cart(data: CartItemAdd, request: Request):
    user = await get_current_user(request)
    existing = await db.cart_items.find_one({"user_id": user["user_id"], "product_id": data.product_id}, {"_id": 0})
    if existing:
        await db.cart_items.update_one(
            {"user_id": user["user_id"], "product_id": data.product_id},
            {"$inc": {"quantity": data.quantity}}
        )
    else:
        await db.cart_items.insert_one({
            "item_id": f"cart_{uuid.uuid4().hex[:12]}", "user_id": user["user_id"],
            "product_id": data.product_id, "quantity": data.quantity,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    return {"message": "Adicionado ao carrinho"}

@api_router.put("/cart/{item_id}")
async def update_cart_item(item_id: str, request: Request):
    user = await get_current_user(request)
    body = await request.json()
    quantity = body.get("quantity", 1)
    if quantity <= 0:
        await db.cart_items.delete_one({"item_id": item_id, "user_id": user["user_id"]})
    else:
        await db.cart_items.update_one({"item_id": item_id, "user_id": user["user_id"]}, {"$set": {"quantity": quantity}})
    return {"message": "Carrinho atualizado"}

@api_router.delete("/cart/{item_id}")
async def remove_from_cart(item_id: str, request: Request):
    user = await get_current_user(request)
    await db.cart_items.delete_one({"item_id": item_id, "user_id": user["user_id"]})
    return {"message": "Item removido"}

# ==================== ORDER ROUTES ====================
@api_router.post("/orders")
async def create_order(data: OrderCreate, request: Request):
    user = await get_current_user(request)
    cart_items = await db.cart_items.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    if not cart_items:
        raise HTTPException(status_code=400, detail="Carrinho vazio")
    
    # Validate shipping address
    if not data.shipping_address:
        raise HTTPException(status_code=400, detail="Endereco de entrega obrigatorio")
    
    settings = await db.platform_settings.find_one({"key": "commissions"}, {"_id": 0})
    platform_rate = settings["value"]["platform_commission"] if settings else 0.09
    affiliate_rate = settings["value"]["affiliate_commission"] if settings else 0.065
    
    # Get shipping settings
    shipping_settings = await db.platform_settings.find_one({"key": "shipping"}, {"_id": 0})
    shipping_cost = 0.0
    shipping_name = "Padrao"
    if shipping_settings and data.shipping_option:
        for opt in shipping_settings["value"].get("options", []):
            if opt["name"].lower().replace(" ", "_") == data.shipping_option and opt.get("enabled", True):
                shipping_cost = opt["price"]
                shipping_name = opt["name"]
                break
    
    # Check for coupon discount
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
        
        # Comissão: 0% para Desapega (secondhand/unique), normal para outros
        is_desapega = product.get("product_type") in ["secondhand", "unique"]
        item_commission = 0.0 if is_desapega else (item_subtotal * platform_rate)
        total_platform_commission += item_commission
        
        order_items.append({
            "product_id": product["product_id"], "title": product["title"],
            "price": product["price"], "quantity": ci["quantity"],
            "subtotal": item_subtotal, "seller_id": product["seller_id"],
            "product_type": product.get("product_type", "store"),
            "commission": item_commission,
            "image": product["images"][0] if product.get("images") else ""
        })
        sellers[product["seller_id"]] = sellers.get(product["seller_id"], 0) + item_subtotal
    
    # Calculate final total
    if coupon_applied and discount > 0:
        if discount <= 1:  # percentage
            discount_value = subtotal * discount
        else:
            discount_value = min(discount, subtotal)
    else:
        discount_value = 0
    
    total = subtotal - discount_value + shipping_cost
    
    affiliate_id = None
    # Smart Margin System - Anti-Loss
    # Platform: 9%, Affiliate: up to 6.5%
    # Total commissions never exceed safe margin
    max_affiliate_rate = affiliate_rate  # 6.5% default
    if data.affiliate_code:
        link = await db.affiliate_links.find_one({"code": data.affiliate_code}, {"_id": 0})
        if link:
            affiliate_id = link["affiliate_id"]
            await db.affiliate_links.update_one({"code": data.affiliate_code}, {"$inc": {"conversions": 1}})
            # Smart margin check: ensure platform + affiliate doesn't exceed safe threshold
            total_commission = platform_rate + max_affiliate_rate
            if total_commission > 0.15:  # Safety cap at 15%
                max_affiliate_rate = max(0, 0.15 - platform_rate)
            # For very low margin products, reduce or disable affiliate
            for ci in cart_items:
                product = await db.products.find_one({"product_id": ci["product_id"]}, {"_id": 0})
                if product and product["price"] < 10:  # Critical low price products
                    max_affiliate_rate = min(max_affiliate_rate, 0.03)  # Cap at 3%
    
    actual_affiliate_rate = max_affiliate_rate if affiliate_id else 0
    
    order_id = f"order_{uuid.uuid4().hex[:12]}"
    
    # Get payment instructions based on method
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
        "platform_commission": total_platform_commission,  # Já calculada por item (0% para Desapega)
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
    
    # Criar notificacao para admin (nova venda)
    await db.admin_notifications.insert_one({
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
        "type": "new_sale",
        "message": f"Nova venda #{order_id[:16]} - {user['name']} comprou de {', '.join([item.get('seller_id', '')[:8] for item in order_items[:2]])}",
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
    if not wallet or wallet["available"] < data.amount or data.amount <= 0:
        raise HTTPException(status_code=400, detail="Saldo insuficiente ou valor invalido")
    wd_id = f"wd_{uuid.uuid4().hex[:12]}"
    await db.withdrawals.insert_one({
        "withdrawal_id": wd_id, "user_id": user["user_id"], "user_name": user["name"],
        "amount": data.amount, "method": data.method,
        "bank_details": user.get("bank_details", {}), "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    await db.wallets.update_one({"user_id": user["user_id"]}, {"$inc": {"available": -data.amount}})
    await db.notifications.insert_one({
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}", "user_id": user["user_id"],
        "type": "withdrawal", "message": f"Solicitacao de saque de R$ {data.amount:.2f} enviada!",
        "read": False, "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Saque solicitado", "withdrawal_id": wd_id}

# ==================== AFFILIATE ROUTES ====================
@api_router.post("/affiliates/link")
async def create_affiliate_link(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    product_id = body.get("product_id")
    if not product_id:
        raise HTTPException(status_code=400, detail="product_id necessario")
    code = f"aff_{uuid.uuid4().hex[:8]}"
    link = {
        "link_id": f"link_{uuid.uuid4().hex[:12]}", "product_id": product_id,
        "affiliate_id": user["user_id"], "code": code,
        "clicks": 0, "conversions": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.affiliate_links.insert_one(link)
    return {"code": code}

@api_router.get("/affiliates/earnings")
async def get_affiliate_earnings(request: Request):
    user = await get_current_user(request)
    links = await db.affiliate_links.find({"affiliate_id": user["user_id"]}, {"_id": 0}).to_list(100)
    txs = await db.wallet_transactions.find({"user_id": user["user_id"], "type": "affiliate_commission"}, {"_id": 0}).to_list(100)
    total = sum(t["amount"] for t in txs)
    return {"links": links, "transactions": txs, "total_earnings": total}

# ==================== NOTIFICATION ROUTES ====================
@api_router.get("/notifications")
async def get_notifications(request: Request):
    user = await get_current_user(request)
    notifs = await db.notifications.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    unread = sum(1 for n in notifs if not n.get("read"))
    return {"notifications": notifs, "unread": unread}

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, request: Request):
    user = await get_current_user(request)
    await db.notifications.update_one({"notification_id": notification_id, "user_id": user["user_id"]}, {"$set": {"read": True}})
    return {"message": "Notificacao marcada como lida"}

@api_router.put("/notifications/read-all")
async def mark_all_read(request: Request):
    user = await get_current_user(request)
    await db.notifications.update_many({"user_id": user["user_id"]}, {"$set": {"read": True}})
    return {"message": "Todas marcadas como lidas"}

# ==================== SUPPORT ROUTES ====================
@api_router.post("/support")
async def create_support(data: SupportMessage, request: Request):
    user = await get_current_user(request)
    msg_id = f"support_{uuid.uuid4().hex[:12]}"
    msg = {
        "message_id": msg_id, "user_id": user["user_id"],
        "user_name": user["name"], "user_email": user["email"],
        "subject": data.subject, "message": data.message,
        "replies": [], "status": "open",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.support_messages.insert_one(msg)
    return {k: v for k, v in msg.items() if k != "_id"}

@api_router.get("/support")
async def get_user_support(request: Request):
    user = await get_current_user(request)
    msgs = await db.support_messages.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"messages": msgs}

# ==================== PAGES ROUTES ====================
@api_router.get("/pages/{slug}")
async def get_page(slug: str):
    page = await db.pages.find_one({"slug": slug}, {"_id": 0})
    if not page:
        return {"slug": slug, "title": slug.replace("-", " ").title(), "content": ""}
    return page

# ==================== CATEGORIES ====================
@api_router.get("/categories")
async def get_categories():
    return {"categories": [
        {"id": "eletronicos", "name": "Eletronicos", "icon": "Smartphone"},
        {"id": "roupas", "name": "Roupas", "icon": "Shirt"},
        {"id": "cosmeticos", "name": "Cosmeticos", "icon": "Sparkles"},
        {"id": "casa", "name": "Casa e Decoracao", "icon": "Home"},
        {"id": "acessorios", "name": "Acessorios", "icon": "Watch"},
        {"id": "esportes", "name": "Esportes", "icon": "Dumbbell"},
        {"id": "arte", "name": "Arte", "icon": "Palette"},
        {"id": "imoveis", "name": "Imoveis", "icon": "Building"},
        {"id": "automoveis", "name": "Automoveis", "icon": "Car"}
    ]}

# ==================== ADMIN ROUTES ====================
@api_router.get("/admin/dashboard")
async def admin_dashboard(request: Request):
    await require_admin(request)
    total_users = await db.users.count_documents({})
    total_products = await db.products.count_documents({})
    total_orders = await db.orders.count_documents({})
    pending_orders = await db.orders.count_documents({"status": {"$in": ["pending", "awaiting_payment"]}})
    pending_withdrawals = await db.withdrawals.count_documents({"status": "pending"})
    
    # Otimização: Usar agregação ao invés de carregar todos os documentos
    sales_agg = await db.orders.aggregate([
        {
            "$group": {
                "_id": None,
                "total_sales": {"$sum": "$total"},
                "total_commissions": {"$sum": "$platform_commission"}
            }
        }
    ]).to_list(1)
    
    total_sales = sales_agg[0]["total_sales"] if sales_agg else 0
    total_commissions = sales_agg[0]["total_commissions"] if sales_agg else 0
    
    return {
        "total_users": total_users, "total_products": total_products,
        "total_orders": total_orders, "pending_orders": pending_orders,
        "pending_withdrawals": pending_withdrawals,
        "total_sales": total_sales, "total_commissions": total_commissions
    }

@api_router.get("/admin/orders")
async def admin_list_orders(request: Request, status: Optional[str] = None):
    await require_admin(request)
    query = {"status": status} if status else {}
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"orders": orders}

@api_router.put("/admin/orders/{order_id}/approve")
async def admin_approve_order(order_id: str, request: Request):
    await require_admin(request)
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Pedido nao encontrado")
    now = datetime.now(timezone.utc).isoformat()
    tracking = order.get("tracking", [])
    tracking.append({"status": "payment_confirmed", "label": "Pagamento Confirmado", "date": now})
    tracking.append({"status": "approved", "label": "Pedido Aprovado", "date": now})
    await db.orders.update_one({"order_id": order_id}, {"$set": {"status": "approved", "payment_confirmed": True, "tracking": tracking}})
    # Move held to available for related transactions
    await db.wallet_transactions.update_many({"order_id": order_id, "status": "held"}, {"$set": {"status": "available"}})
    txs = await db.wallet_transactions.find({"order_id": order_id}, {"_id": 0}).to_list(100)
    for tx in txs:
        await db.wallets.update_one({"user_id": tx["user_id"]}, {"$inc": {"held": -tx["amount"], "available": tx["amount"]}})
    # Award 1 Brane Coin to buyer
    await db.users.update_one({"user_id": order["buyer_id"]}, {"$inc": {"brane_coins": 1}})
    await db.brane_coins_history.insert_one({
        "tx_id": f"coin_{uuid.uuid4().hex[:12]}", "user_id": order["buyer_id"],
        "amount": 1, "type": "earned", "reason": f"Compra #{order_id[:16]}",
        "created_at": now
    })
    await db.notifications.insert_one({
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}", "user_id": order["buyer_id"],
        "type": "order", "message": f"Pagamento confirmado! Seu pedido #{order_id[:16]} foi aprovado! Voce ganhou 1 Brane Coin!",
        "read": False, "created_at": now
    })
    return {"message": "Pagamento confirmado e pedido aprovado"}

@api_router.put("/admin/orders/{order_id}/reject")
async def admin_reject_order(order_id: str, request: Request):
    await require_admin(request)
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Pedido nao encontrado")
    await db.orders.update_one({"order_id": order_id}, {"$set": {"status": "rejected"}})
    # Cancel held transactions
    held_txs = await db.wallet_transactions.find({"order_id": order_id, "status": "held"}, {"_id": 0}).to_list(100)
    for tx in held_txs:
        await db.wallets.update_one({"user_id": tx["user_id"]}, {"$inc": {"held": -tx["amount"]}})
    await db.wallet_transactions.update_many({"order_id": order_id, "status": "held"}, {"$set": {"status": "cancelled"}})
    await db.notifications.insert_one({
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}", "user_id": order["buyer_id"],
        "type": "order", "message": f"Seu pedido #{order_id[:16]} foi rejeitado.",
        "read": False, "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Pedido rejeitado"}

# ==================== ADMIN ORDER TRACKING ====================
@api_router.put("/admin/orders/{order_id}/ship")
async def admin_ship_order(order_id: str, request: Request):
    await require_admin(request)
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Pedido nao encontrado")
    now = datetime.now(timezone.utc).isoformat()
    tracking = order.get("tracking", [])
    tracking.append({"status": "shipped", "label": "Enviado", "date": now})
    await db.orders.update_one({"order_id": order_id}, {"$set": {"status": "shipped", "tracking": tracking}})
    await db.notifications.insert_one({
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}", "user_id": order["buyer_id"],
        "type": "order", "message": f"Seu pedido #{order_id[:16]} foi enviado!",
        "read": False, "created_at": now
    })
    return {"message": "Pedido enviado"}

@api_router.put("/admin/orders/{order_id}/deliver")
async def admin_deliver_order(order_id: str, request: Request):
    await require_admin(request)
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Pedido nao encontrado")
    now = datetime.now(timezone.utc).isoformat()
    tracking = order.get("tracking", [])
    tracking.append({"status": "delivered", "label": "Entregue", "date": now})
    await db.orders.update_one({"order_id": order_id}, {"$set": {"status": "delivered", "tracking": tracking}})
    await db.notifications.insert_one({
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}", "user_id": order["buyer_id"],
        "type": "order", "message": f"Seu pedido #{order_id[:16]} foi entregue!",
        "read": False, "created_at": now
    })
    return {"message": "Pedido entregue"}

# ==================== BRANE COINS & REWARDS ====================
@api_router.get("/brane-coins")
async def get_brane_coins(request: Request):
    user = await get_current_user(request)
    coins = user.get("brane_coins", 0)
    is_vip = user.get("is_vip", False)
    history = await db.brane_coins_history.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    # Available rewards
    rewards = []
    if coins >= 5:
        rewards.append({"id": "coupon_5pct", "name": "Cupom 5% OFF", "cost": 5, "description": "5% de desconto na proxima compra"})
        rewards.append({"id": "coupon_3eur", "name": "Cupom R$3 OFF", "cost": 5, "description": "R$3 de desconto na proxima compra"})
    if coins >= 50 and not is_vip:
        rewards.append({"id": "vip_access", "name": "Acesso VIP Brane", "cost": 50, "description": "Promocoes exclusivas, descontos especiais e ofertas antecipadas"})
    return {"coins": coins, "is_vip": is_vip, "history": history, "available_rewards": rewards}

@api_router.post("/brane-coins/redeem")
async def redeem_brane_coins(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    reward_id = body.get("reward_id")
    coins = user.get("brane_coins", 0)
    now = datetime.now(timezone.utc).isoformat()
    
    if reward_id == "coupon_5pct" and coins >= 5:
        code = f"BRANE5-{uuid.uuid4().hex[:6].upper()}"
        await db.coupons.insert_one({
            "coupon_id": f"coupon_{uuid.uuid4().hex[:12]}", "code": code,
            "type": "percentage", "value": 0.05, "max_uses": 1, "uses": 0,
            "is_active": True, "user_id": user["user_id"],
            "created_at": now
        })
        await db.users.update_one({"user_id": user["user_id"]}, {"$inc": {"brane_coins": -5}})
        await db.brane_coins_history.insert_one({"tx_id": f"coin_{uuid.uuid4().hex[:12]}", "user_id": user["user_id"], "amount": -5, "type": "redeemed", "reason": f"Cupom 5% OFF: {code}", "created_at": now})
        return {"message": f"Cupom {code} criado!", "coupon_code": code}
    elif reward_id == "coupon_3eur" and coins >= 5:
        code = f"BRANE3-{uuid.uuid4().hex[:6].upper()}"
        await db.coupons.insert_one({
            "coupon_id": f"coupon_{uuid.uuid4().hex[:12]}", "code": code,
            "type": "fixed", "value": 3.0, "max_uses": 1, "uses": 0,
            "is_active": True, "user_id": user["user_id"],
            "created_at": now
        })
        await db.users.update_one({"user_id": user["user_id"]}, {"$inc": {"brane_coins": -5}})
        await db.brane_coins_history.insert_one({"tx_id": f"coin_{uuid.uuid4().hex[:12]}", "user_id": user["user_id"], "amount": -5, "type": "redeemed", "reason": f"Cupom R$3 OFF: {code}", "created_at": now})
        return {"message": f"Cupom {code} criado!", "coupon_code": code}
    elif reward_id == "vip_access" and coins >= 50:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"is_vip": True, "vip_since": now}, "$inc": {"brane_coins": -50}})
        await db.brane_coins_history.insert_one({"tx_id": f"coin_{uuid.uuid4().hex[:12]}", "user_id": user["user_id"], "amount": -50, "type": "redeemed", "reason": "Acesso VIP Brane", "created_at": now})
        return {"message": "VIP Brane ativado!"}
    else:
        raise HTTPException(status_code=400, detail="Coins insuficientes ou recompensa invalida")

# ==================== BUYER WALLET ====================
@api_router.get("/buyer-wallet")
async def get_buyer_wallet(request: Request):
    user = await get_current_user(request)
    coins = user.get("brane_coins", 0)
    is_vip = user.get("is_vip", False)
    orders_count = await db.orders.count_documents({"buyer_id": user["user_id"], "status": "approved"})
    # Get user coupons
    coupons = await db.coupons.find({"user_id": user["user_id"], "is_active": True}, {"_id": 0}).to_list(20)
    active_coupons = [c for c in coupons if c.get("uses", 0) < c.get("max_uses", 1)]
    return {
        "coins": coins, "is_vip": is_vip, "orders_count": orders_count,
        "active_coupons": active_coupons,
        "next_reward_at": 5 - (coins % 5) if coins % 5 != 0 else 0
    }

# ==================== DESAPEGA (UNIQUE/SECONDHAND PRODUCTS) ====================
@api_router.get("/desapega")
async def list_desapega_products(skip: int = 0, limit: int = 20):
    products = await db.products.find(
        {"product_type": {"$in": ["unique", "secondhand"]}, "is_deleted": {"$ne": True}},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    for p in products:
        seller = await db.users.find_one({"user_id": p["seller_id"]}, {"_id": 0, "password_hash": 0})
        p["seller_name"] = seller["name"] if seller else "Vendedor"
    return {"products": products, "total": await db.products.count_documents({"product_type": {"$in": ["unique", "secondhand"]}, "is_deleted": {"$ne": True}})}

# ==================== SUPPORT CHAT ====================
@api_router.post("/support/message")
async def send_support_message(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    msg = body.get("message", "").strip()
    if not msg:
        raise HTTPException(status_code=400, detail="Mensagem vazia")
    msg_doc = {
        "message_id": f"msg_{uuid.uuid4().hex[:12]}", "user_id": user["user_id"],
        "user_name": user["name"], "user_role": user["role"],
        "message": msg, "is_admin_reply": False, "status": "open",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.support_messages.insert_one(msg_doc)
    return {"message": "Mensagem enviada!", "message_id": msg_doc["message_id"]}

@api_router.get("/support/messages")
async def get_support_messages(request: Request):
    user = await get_current_user(request)
    messages = await db.support_messages.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", 1).to_list(100)
    return {"messages": messages}

@api_router.get("/admin/support/messages")
async def admin_get_support_messages(request: Request):
    await require_admin(request)
    messages = await db.support_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"messages": messages}

@api_router.post("/admin/support/reply")
async def admin_reply_support(request: Request):
    await require_admin(request)
    body = await request.json()
    user_id = body.get("user_id")
    msg = body.get("message", "").strip()
    if not msg or not user_id:
        raise HTTPException(status_code=400, detail="Dados incompletos")
    msg_doc = {
        "message_id": f"msg_{uuid.uuid4().hex[:12]}", "user_id": user_id,
        "user_name": "Suporte BRANE", "user_role": "admin",
        "message": msg, "is_admin_reply": True, "status": "replied",
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
    user = await get_current_user(request)
    
    store = await _resolve_store(store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Loja nao encontrada")
    
    real_store_id = store["store_id"]
    message_id = f"msg_{uuid.uuid4().hex[:12]}"
    message = {
        "message_id": message_id,
        "store_id": real_store_id,
        "sender_id": user["user_id"],
        "sender_name": user["name"],
        "sender_role": user["role"],
        "message": data.message.strip(),
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.store_messages.insert_one(message)
    
    # Notify store owner
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
    # Only store owner or participants can see messages
    is_owner = store["owner_id"] == user["user_id"]
    
    if is_owner:
        # Owner sees all messages
        query = {"store_id": real_store_id}
    else:
        # Buyer sees only their messages with the store
        query = {
            "store_id": real_store_id,
            "$or": [
                {"sender_id": user["user_id"]},
                {"sender_id": store["owner_id"]}
            ]
        }
    
    messages = await db.store_messages.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    messages.reverse()  # Chronological order
    
    # Mark as read for current user
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
    
    # Get all unique users who messaged this store
    messages = await db.store_messages.find(
        {"store_id": store["store_id"], "sender_id": {"$ne": user["user_id"]}},
        {"_id": 0, "sender_id": 1, "sender_name": 1, "message": 1, "read": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(500)
    
    # Group by sender
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
    user = await get_current_user(request)
    if other_user_id == user["user_id"]:
        raise HTTPException(status_code=400, detail="Voce nao pode conversar consigo mesmo")
    other = await db.users.find_one({"user_id": other_user_id}, {"_id": 0})
    if not other:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado")

    msg_text = (data.message or "").strip()
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
    # Mark inbound as read
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
    pipeline = [
        {"$match": {"$or": [{"sender_id": uid}, {"recipient_id": uid}]}},
        {"$sort": {"created_at": -1}},
        {"$group": {
            "_id": "$thread_id",
            "last_message": {"$first": "$message"},
            "last_message_date": {"$first": "$created_at"},
            "last_sender_id": {"$first": "$sender_id"},
            "messages": {"$push": "$$ROOT"}
        }},
    ]
    threads = []
    async for row in db.direct_messages.aggregate(pipeline):
        thread_id = row["_id"]
        msgs = row.get("messages") or []
        # determine "other" user id
        other_id = None
        for m in msgs:
            if m.get("sender_id") != uid:
                other_id = m.get("sender_id")
                break
            if m.get("recipient_id") != uid:
                other_id = m.get("recipient_id")
                break
        if not other_id:
            continue
        other = await db.users.find_one({"user_id": other_id}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "role": 1})
        if not other:
            continue
        unread = await db.direct_messages.count_documents({"thread_id": thread_id, "recipient_id": uid, "read": False})
        threads.append({
            "thread_id": thread_id,
            "other": other,
            "last_message": row.get("last_message"),
            "last_message_date": row.get("last_message_date"),
            "unread_count": unread,
        })
    return {"threads": threads}


# ==================== ADMIN: monitor chat conversations ====================
@api_router.get("/admin/chats/store-messages")
async def admin_list_store_messages(request: Request, store_id: Optional[str] = None, limit: int = 200):
    await require_admin(request)
    query = {"store_id": store_id} if store_id else {}
    msgs = await db.store_messages.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return {"messages": msgs, "total": len(msgs)}


@api_router.get("/admin/chats/direct-messages")
async def admin_list_direct_messages(request: Request, thread_id: Optional[str] = None, limit: int = 200):
    await require_admin(request)
    query = {"thread_id": thread_id} if thread_id else {}
    msgs = await db.direct_messages.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return {"messages": msgs, "total": len(msgs)}

# ==================== ADMIN PLATFORM CUSTOMIZATION ====================
def _theme_defaults():
    return {
        # Brand
        "platform_name": "BRANE",
        "platform_slogan": "Marketplace Premium",
        # Global
        "primary_color": "#D4A24C",
        "title_color": "#D4A24C",
        "page_bg": "#050608",
        # Navbar
        "navbar_bg": "#050608",
        "navbar_text": "#F7F7FA",
        "nav_link_color": "#A6A8B3",
        "nav_link_hover_color": "#D4A24C",
        "menu_text_color": "#F7F7FA",
        # Categories
        "category_text_color": "#F7F7FA",
        "category_bg_color": "#0B0D12",
        # Product card
        "card_bg": "#0B0D12",
        "card_border": "#1E2230",
        "card_hover_border": "#D4A24C",
        "product_title_color": "#F7F7FA",
        # Prices
        "price_color": "#D4A24C",
        "price_cents_color": "#D4A24C",
        # Buttons
        "button_color": "#FFF3C4",
        "button_text_color": "#0F1111",
        "buy_now_color": "#6D28D9",
        # Rating / shipping
        "star_color": "#D4A24C",
        "free_shipping_color": "#10A875",
        # Layout
        "product_card_size": "medium",
        "product_card_shape": "rounded",
        "product_image_ratio": "square",
        "product_grid_columns": "4",
        # Toggles
        "show_stars": True,
        "show_free_shipping": True,
        "show_installments": True,
        "installment_count": 12,
        "show_category_icons": True,
        # Social page customization (DM)
        "social_bg_color": "#0a0014",
        "social_accent_color": "#ec4899",
        "social_card_bg": "#1a1028",
        "social_card_border": "rgba(168,85,247,0.25)",
        "social_text_color": "#ffffff",
        "social_muted_color": "rgba(216,180,254,0.6)",
        "social_feed_width": "medium",
        "social_card_radius": "xl",
    }

@api_router.get("/admin/theme")
async def get_theme_settings(request: Request):
    await require_admin(request)
    s = await db.platform_settings.find_one({"key": "theme"}, {"_id": 0})
    return {**_theme_defaults(), **(s["value"] if s else {})}

@api_router.put("/admin/theme")
async def update_theme_settings(request: Request):
    await require_admin(request)
    body = await request.json()
    await db.platform_settings.update_one(
        {"key": "theme"},
        {"$set": {"key": "theme", "value": body}},
        upsert=True
    )
    return {"message": "Tema atualizado"}

# Public theme endpoint (no auth needed)
@api_router.get("/theme")
async def get_public_theme():
    s = await db.platform_settings.find_one({"key": "theme"}, {"_id": 0})
    return {**_theme_defaults(), **(s["value"] if s else {})}

# ==================== ADMIN PRODUCTS MANAGEMENT ====================
@api_router.get("/admin/products")
async def admin_list_products(request: Request, skip: int = 0, limit: int = 50):
    await require_admin(request)
    products = await db.products.find({"is_deleted": {"$ne": True}}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.products.count_documents({"is_deleted": {"$ne": True}})
    return {"products": products, "total": total}

@api_router.post("/admin/products")
async def admin_create_product(request: Request):
    await require_admin(request)
    body = await request.json()
    product_id = f"prod_{uuid.uuid4().hex[:12]}"
    product = {
        "product_id": product_id,
        "title": body.get("title", ""),
        "description": body.get("description", ""),
        "price": float(body.get("price", 0)),
        "category": body.get("category", ""),
        "city": body.get("city", ""),
        "location": body.get("location", ""),
        "images": body.get("images", []),
        "product_type": body.get("product_type", "store"),
        "condition": body.get("condition", "new"),
        "seller_id": "platform",
        "seller_name": "BRANE Oficial",
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.products.insert_one(product)
    return {"product_id": product_id, "message": "Produto criado"}

@api_router.put("/admin/products/{product_id}")
async def admin_update_product(product_id: str, request: Request):
    await require_admin(request)
    body = await request.json()
    update = {}
    for field in ["title", "description", "price", "category", "city", "location", "images", "product_type", "condition", "status"]:
        if field in body:
            update[field] = body[field]
    if update:
        await db.products.update_one({"product_id": product_id}, {"$set": update})
    return {"message": "Produto atualizado"}

@api_router.delete("/admin/products/{product_id}")
async def admin_delete_product(product_id: str, request: Request):
    await require_admin(request)
    await db.products.delete_one({
    "product_id": product_id
})
    return {"message": "Produto removido"}


@api_router.get("/admin/users")
async def admin_list_users(request: Request):
    await require_admin(request)
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return {"users": users}

@api_router.put("/admin/users/{user_id}/block")
async def admin_toggle_block(user_id: str, request: Request):
    await require_admin(request)
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado")
    new_status = not user.get("is_blocked", False)
    await db.users.update_one({"user_id": user_id}, {"$set": {"is_blocked": new_status}})
    return {"message": "Bloqueado" if new_status else "Desbloqueado", "is_blocked": new_status}

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

@api_router.get("/admin/commissions")
async def get_commissions(request: Request):
    await require_admin(request)
    s = await db.platform_settings.find_one({"key": "commissions"}, {"_id": 0})
    return s["value"] if s else {"platform_commission": 0.09, "affiliate_commission": 0.065}

@api_router.put("/admin/commissions")
async def update_commissions(data: CommissionUpdate, request: Request):
    await require_admin(request)
    s = await db.platform_settings.find_one({"key": "commissions"}, {"_id": 0})
    values = s["value"] if s else {"platform_commission": 0.09, "affiliate_commission": 0.065}
    if data.platform_commission is not None:
        values["platform_commission"] = data.platform_commission
    if data.affiliate_commission is not None:
        values["affiliate_commission"] = data.affiliate_commission
    await db.platform_settings.update_one({"key": "commissions"}, {"$set": {"value": values}}, upsert=True)
    return values

@api_router.get("/admin/support")
async def admin_list_support(request: Request):
    await require_admin(request)
    msgs = await db.support_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"messages": msgs}

@api_router.get("/admin/pages/{slug}")
async def admin_get_page(slug: str, request: Request):
    await require_admin(request)
    page = await db.pages.find_one({"slug": slug}, {"_id": 0})
    return page or {"slug": slug, "title": slug.replace("-", " ").title(), "content": ""}

@api_router.put("/admin/pages/{slug}")
async def admin_update_page(slug: str, data: PageUpdate, request: Request):
    await require_admin(request)
    await db.pages.update_one(
        {"slug": slug},
        {"$set": {"slug": slug, "title": slug.replace("-", " ").title(), "content": data.content, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"message": "Pagina atualizada"}

@api_router.get("/admin/financial-settings")
async def get_financial_settings(request: Request):
    await require_admin(request)
    s = await db.platform_settings.find_one({"key": "financial"}, {"_id": 0})
    return s["value"] if s else {"paypal_email": "", "bank_name": "", "bank_branch": "", "bank_account_name": "", "bank_account_number": "", "pix_key": "", "pix_key_type": "cpf", "paypal_enabled": False, "pix_enabled": True, "ted_enabled": True}

@api_router.put("/admin/financial-settings")
async def update_financial_settings(data: FinancialSettings, request: Request):
    await require_admin(request)
    await db.platform_settings.update_one({"key": "financial"}, {"$set": {"key": "financial", "value": data.model_dump()}}, upsert=True)
    return {"message": "Configuracoes financeiras atualizadas"}

# ==================== PAYMENT METHODS (PUBLIC) ====================
@api_router.get("/payment-methods")
async def get_payment_methods():
    """Retorna metodos de pagamento ativos com detalhes para o comprador"""
    s = await db.platform_settings.find_one({"key": "financial"}, {"_id": 0})
    settings = s["value"] if s else {}
    methods = []
    if settings.get("pix_enabled", True):
        methods.append({
            "id": "pix",
            "name": "PIX",
            "description": "Pagamento instantaneo via PIX",
            "configured": bool(settings.get("pix_key")),
            "details": {
                "pix_key": settings.get("pix_key", ""),
                "pix_key_type": settings.get("pix_key_type", "cpf")
            }
        })
    if settings.get("ted_enabled", True):
        methods.append({
            "id": "ted",
            "name": "Transferencia Bancaria",
            "description": "Transferencia via TED/DOC",
            "configured": bool(settings.get("bank_name") and settings.get("bank_account_number")),
            "details": {
                "bank_name": settings.get("bank_name", ""),
                "bank_branch": settings.get("bank_branch", ""),
                "account_name": settings.get("bank_account_name", ""),
                "account_number": settings.get("bank_account_number", "")
            }
        })
    if settings.get("paypal_enabled", False):
        methods.append({
            "id": "paypal",
            "name": "PayPal",
            "description": "Pagamento via PayPal",
            "configured": bool(settings.get("paypal_email")),
            "details": {
                "paypal_email": settings.get("paypal_email", "")
            }
        })
    return {"methods": methods}

# ==================== ADMIN NOTIFICATION COUNTS ====================
@api_router.get("/admin/notification-counts")
async def get_admin_notification_counts(request: Request):
    await require_admin(request)
    pending_orders = await db.orders.count_documents({"status": {"$in": ["pending", "awaiting_payment"]}})
    pending_withdrawals = await db.withdrawals.count_documents({"status": "pending"})
    pending_support = await db.support_messages.count_documents({"status": {"$in": ["pending", "open"]}})
    pending_stores = await db.stores.count_documents({"is_approved": False})
    new_users_24h = await db.users.count_documents({})  # total users as badge
    return {
        "orders": pending_orders,
        "withdrawals": pending_withdrawals,
        "support": pending_support,
        "stores": pending_stores,
        "users": new_users_24h
    }

@api_router.get("/admin/contact-settings")
async def get_contact_settings(request: Request):
    await require_admin(request)
    s = await db.platform_settings.find_one({"key": "contact"}, {"_id": 0})
    return s["value"] if s else {"email": "", "whatsapp": "", "instagram": ""}

@api_router.put("/admin/contact-settings")
async def update_contact_settings(request: Request):
    await require_admin(request)
    body = await request.json()
    await db.platform_settings.update_one({"key": "contact"}, {"$set": {"key": "contact", "value": body}}, upsert=True)
    return {"message": "Configuracoes de contato atualizadas"}

# ==================== SHIPPING SETTINGS ====================
@api_router.get("/shipping/options")
async def get_shipping_options():
    s = await db.platform_settings.find_one({"key": "shipping"}, {"_id": 0})
    if s:
        return {"options": [opt for opt in s["value"].get("options", []) if opt.get("enabled", True)]}
    return {"options": [
        {"name": "Gratis", "price": 0, "days": "7-15 dias uteis", "enabled": True},
        {"name": "Normal", "price": 15.90, "days": "5-8 dias uteis", "enabled": True},
        {"name": "Expresso", "price": 29.90, "days": "2-3 dias uteis", "enabled": True}
    ]}

@api_router.get("/admin/shipping-settings")
async def admin_get_shipping_settings(request: Request):
    await require_admin(request)
    s = await db.platform_settings.find_one({"key": "shipping"}, {"_id": 0})
    if s:
        return s["value"]
    return {"options": [
        {"name": "Gratis", "price": 0, "days": "7-15 dias uteis", "enabled": True},
        {"name": "Normal", "price": 15.90, "days": "5-8 dias uteis", "enabled": True},
        {"name": "Expresso", "price": 29.90, "days": "2-3 dias uteis", "enabled": True}
    ]}

@api_router.put("/admin/shipping-settings")
async def admin_update_shipping_settings(request: Request):
    await require_admin(request)
    body = await request.json()
    await db.platform_settings.update_one(
        {"key": "shipping"},
        {"$set": {"key": "shipping", "value": body}},
        upsert=True
    )
    return {"message": "Configuracoes de frete atualizadas"}

# ==================== SELLER TERMS ====================
@api_router.get("/seller/terms-status")
async def get_seller_terms_status(request: Request):
    user = await get_current_user(request)
    return {"accepted": user.get("seller_terms_accepted", False)}

@api_router.post("/seller/accept-terms")
async def accept_seller_terms(request: Request):
    user = await get_current_user(request)
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"seller_terms_accepted": True, "seller_terms_accepted_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Termos aceitos com sucesso"}

@api_router.get("/seller/has-products")
async def seller_has_products(request: Request):
    user = await get_current_user(request)
    count = await db.products.count_documents({"seller_id": user["user_id"]})
    return {"has_products": count > 0, "count": count}

# ==================== GESTÃO FINANCEIRA / PAYMENT CONFIG (PRO) ====================
FINANCE_SETTINGS_ID = "finance_settings_singleton"

def _default_finance_settings():
    return {
        "_kind": "finance_settings",
        "_id": FINANCE_SETTINGS_ID,
        # 1. Dados da Empresa
        "company": {
            "name": "", "trade_name": "", "legal_name": "",
            "document_type": "cpf",  # cpf | cnpj
            "cnpj": "", "cpf": "",
            "ie": "", "im": "",
            "email": "", "phone": "",
            "address": "", "zip_code": "", "city": "", "state": "", "country": "Brasil"
        },
        # 2. Dados Bancários
        "bank": {
            "bank_name": "", "bank_code": "",
            "account_type": "corrente",  # corrente | poupanca | pj
            "agency": "", "account": "", "account_digit": "",
            "holder_name": "", "holder_document": "",
            "holder_type": "pf"  # pf | pj
        },
        # 3. Chaves PIX (lista)
        "pix_keys": [],  # [{ id, key_type, key, display_name, bank_linked, notes, active, primary }]
        # 4. Gateways
        "gateways": {
            g: {"active": False, "environment": "sandbox", "public_key": "", "secret_key": "",
                "access_token": "", "webhook_url": "", "status": "disconnected"}
            for g in ["mercadopago", "pagseguro", "stripe", "asaas", "pagarme", "paypal"]
        },
        # 5. Repasse
        "payout": {
            "commission_percent": 10.0,
            "fixed_fee": 0.0,
            "release_days": 7,
            "security_hold_percent": 0.0,
            "auto_split": True,
            "auto_approve": False
        },
        # 6. Controle saques
        "withdrawals_config": {
            "min_amount": 50.0,
            "payout_days": 2
        },
        # 7. Comprovantes
        "receipts": {
            "display_name": "", "company_on_receipt": "",
            "logo_url": "", "auto_email": True, "auto_receipt": True
        },
        # 8. Segurança
        "security": {
            "twofa_enabled": False,
            "lock_sensitive_edit": False
        },
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

async def _ensure_finance_settings():
    doc = await db.settings.find_one({"_id": FINANCE_SETTINGS_ID})
    if not doc:
        doc = _default_finance_settings()
        await db.settings.insert_one(doc)
    return doc

def _sanitize_finance_doc(doc):
    if not doc:
        return None
    doc.pop("_id", None)
    doc.pop("_kind", None)
    return doc

@api_router.get("/admin/finance/settings")
async def admin_finance_get(request: Request):
    await require_admin(request)
    doc = await _ensure_finance_settings()
    return _sanitize_finance_doc(doc)

@api_router.put("/admin/finance/settings")
async def admin_finance_update(request: Request):
    admin = await require_admin(request)
    body = await request.json()
    # Allow updating any of the sections: company, bank, payout, withdrawals_config, receipts, security, gateways
    allowed_sections = {"company","bank","payout","withdrawals_config","receipts","security","gateways"}
    updates = {}
    for section, value in body.items():
        if section in allowed_sections and isinstance(value, dict):
            # merge into existing
            current = (await _ensure_finance_settings()).get(section, {}) or {}
            if section == "gateways":
                # deep merge per gateway
                merged = dict(current)
                for gw, cfg in value.items():
                    if isinstance(cfg, dict):
                        existing = merged.get(gw, {}) or {}
                        existing.update({k: v for k, v in cfg.items()})
                        merged[gw] = existing
                updates[section] = merged
            else:
                merged = dict(current)
                merged.update(value)
                updates[section] = merged
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    # Audit log
    log_entry = {
        "log_id": str(uuid.uuid4()),
        "admin_id": admin["user_id"],
        "admin_email": admin.get("email"),
        "action": "finance_settings_update",
        "sections": list(updates.keys()),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.finance_logs.insert_one(log_entry)
    await db.settings.update_one({"_id": FINANCE_SETTINGS_ID}, {"$set": updates}, upsert=True)
    doc = await db.settings.find_one({"_id": FINANCE_SETTINGS_ID})
    return {"message": "Configurações atualizadas", "settings": _sanitize_finance_doc(doc)}

@api_router.post("/admin/finance/pix-keys")
async def admin_finance_add_pix(request: Request):
    await require_admin(request)
    body = await request.json()
    settings = await _ensure_finance_settings()
    pix_keys = list(settings.get("pix_keys") or [])
    new_key = {
        "id": str(uuid.uuid4()),
        "key_type": body.get("key_type", "cpf"),
        "key": body.get("key", "").strip(),
        "display_name": body.get("display_name", "").strip(),
        "bank_linked": body.get("bank_linked", "").strip(),
        "notes": body.get("notes", "").strip(),
        "active": bool(body.get("active", True)),
        "primary": bool(body.get("primary", False)),
    }
    if new_key["primary"]:
        for k in pix_keys:
            k["primary"] = False
    if not pix_keys:
        new_key["primary"] = True
    pix_keys.append(new_key)
    await db.settings.update_one({"_id": FINANCE_SETTINGS_ID}, {"$set": {"pix_keys": pix_keys}})
    return {"message": "Chave PIX adicionada", "pix_keys": pix_keys}

@api_router.put("/admin/finance/pix-keys/{key_id}")
async def admin_finance_update_pix(key_id: str, request: Request):
    await require_admin(request)
    body = await request.json()
    settings = await _ensure_finance_settings()
    pix_keys = list(settings.get("pix_keys") or [])
    target_idx = next((i for i, k in enumerate(pix_keys) if k.get("id") == key_id), -1)
    if target_idx < 0:
        raise HTTPException(status_code=404, detail="Chave PIX não encontrada")
    if body.get("primary") is True:
        for k in pix_keys:
            k["primary"] = False
    for field in ["key_type","key","display_name","bank_linked","notes","active","primary"]:
        if field in body:
            pix_keys[target_idx][field] = body[field]
    await db.settings.update_one({"_id": FINANCE_SETTINGS_ID}, {"$set": {"pix_keys": pix_keys}})
    return {"message": "Chave PIX atualizada", "pix_keys": pix_keys}

@api_router.delete("/admin/finance/pix-keys/{key_id}")
async def admin_finance_delete_pix(key_id: str, request: Request):
    await require_admin(request)
    settings = await _ensure_finance_settings()
    pix_keys = [k for k in (settings.get("pix_keys") or []) if k.get("id") != key_id]
    # ensure a primary remains if any
    if pix_keys and not any(k.get("primary") for k in pix_keys):
        pix_keys[0]["primary"] = True
    await db.settings.update_one({"_id": FINANCE_SETTINGS_ID}, {"$set": {"pix_keys": pix_keys}})
    return {"message": "Chave PIX removida", "pix_keys": pix_keys}

@api_router.get("/admin/finance/dashboard")
async def admin_finance_dashboard(request: Request):
    await require_admin(request)
    now = datetime.now(timezone.utc)
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()

    async def _sum(match):
        cursor = db.orders.aggregate([{"$match": match}, {"$group": {"_id": None, "sum": {"$sum": "$total"}, "count": {"$sum": 1}}}])
        docs = await cursor.to_list(length=1)
        return (docs[0] if docs else {"sum": 0, "count": 0})

    paid_filter = {"status": {"$in": ["approved", "shipped", "delivered", "payment_confirmed"]}}
    today = await _sum({**paid_filter, "created_at": {"$gte": start_of_day}})
    month = await _sum({**paid_filter, "created_at": {"$gte": start_of_month}})
    pending = await _sum({"status": {"$in": ["awaiting_payment", "pending"]}})
    cancelled = await _sum({"status": "rejected"})

    # wallets
    wallet_cursor = db.wallets.aggregate([{"$group": {"_id": None, "avail": {"$sum": "$available"}, "held": {"$sum": "$held"}}}])
    wdocs = await wallet_cursor.to_list(length=1)
    total_avail = (wdocs[0]["avail"] if wdocs else 0.0) or 0.0
    total_held = (wdocs[0]["held"] if wdocs else 0.0) or 0.0

    total_commissions = await db.commissions.count_documents({})
    pending_withdrawals = await db.withdrawals.count_documents({"status": "pending"})
    completed_withdrawals = await db.withdrawals.count_documents({"status": "approved"})

    return {
        "balance_total": total_avail + total_held,
        "balance_available": total_avail,
        "balance_held": total_held,
        "sales_today": {"amount": today["sum"], "count": today["count"]},
        "sales_month": {"amount": month["sum"], "count": month["count"]},
        "pending": {"amount": pending["sum"], "count": pending["count"]},
        "cancelled": {"amount": cancelled["sum"], "count": cancelled["count"]},
        "commissions_count": total_commissions,
        "withdrawals_pending": pending_withdrawals,
        "withdrawals_completed": completed_withdrawals,
        "refunds_count": 0,
        "chargebacks_count": 0,
    }

@api_router.get("/admin/finance/logs")
async def admin_finance_logs(request: Request):
    await require_admin(request)
    logs = await db.finance_logs.find({}, {"_id": 0}).sort("created_at", -1).limit(100).to_list(length=100)
    return {"logs": logs}

# ==================== SAVED SHIPPING ADDRESS ====================
@api_router.get("/users/saved-address")
async def get_saved_address(request: Request):
    user = await get_current_user(request)
    return {"address": user.get("saved_address") or None}

@api_router.put("/users/saved-address")
async def save_address(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    allowed = {"name","cpf","phone","street","number","complement","neighborhood","city","state","zip_code"}
    clean = {k: str(v).strip() for k, v in body.items() if k in allowed}
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"saved_address": clean, "saved_address_updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Endereço salvo", "address": clean}

# ==================== ADMIN: ALL WALLETS (for escrow dashboard) ====================
@api_router.get("/admin/wallets")
async def admin_list_all_wallets(request: Request):
    await require_admin(request)
    users = await db.users.find({"role": {"$in": ["seller", "affiliate", "buyer", "admin"]}}, {"_id": 0}).to_list(length=1000)
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
    # sort by held descending so admins see who needs attention first
    items.sort(key=lambda x: (x["held"], x["available"]), reverse=True)
    return {"wallets": items}

# ==================== PROMOTION PLANS (admin-managed) ====================
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
        "name": data.name.strip(),
        "price": float(data.price),
        "duration_days": int(data.duration_days),
        "description": (data.description or "").strip(),
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
    payment_method = body.get("payment_method", "wallet")  # wallet | pix
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
        "status": status,  # pending | active | expired | rejected
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


# ==================== DEMO SEED (admin only) ====================
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
        # avoid duplicates
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
        "code": body.get("code", "").upper(),
        "type": body.get("type", "fixed"),  # fixed or percentage
        "value": body.get("value", 0),
        "active": body.get("active", True),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.coupons.insert_one(coupon)
    return {k: v for k, v in coupon.items() if k != "_id"}

@api_router.delete("/admin/coupons/{coupon_id}")
async def admin_delete_coupon(coupon_id: str, request: Request):
    await require_admin(request)
    await db.coupons.delete_one({"coupon_id": coupon_id})
    return {"message": "Cupom removido"}

@api_router.post("/coupons/validate")
async def validate_coupon(request: Request):
    await get_current_user(request)
    body = await request.json()
    code = body.get("code", "").upper()
    coupon = await db.coupons.find_one({"code": code, "active": True}, {"_id": 0})
    if not coupon:
        raise HTTPException(status_code=404, detail="Cupom invalido ou expirado")
    return {"valid": True, "type": coupon["type"], "value": coupon["value"], "code": coupon["code"]}

# ==================== 1. GESTÃO DE SALDO (ADMIN) ====================
@api_router.post("/admin/wallet/add-balance")
async def admin_add_balance(request: Request):
    """Admin adiciona saldo manualmente na carteira de vendedor/afiliado"""
    await require_admin(request)
    body = await request.json()
    user_id = body.get("user_id")
    amount = float(body.get("amount", 0))
    balance_type = body.get("balance_type", "available")  # available ou held
    
    if not user_id or amount <= 0:
        raise HTTPException(status_code=400, detail="user_id e amount obrigatorios")
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado")
    
    # Atualizar wallet
    if balance_type == "held":
        await db.wallets.update_one({"user_id": user_id}, {"$inc": {"held": amount}}, upsert=True)
    else:
        await db.wallets.update_one({"user_id": user_id}, {"$inc": {"available": amount}}, upsert=True)
    
    # Registrar transacao
    await db.wallet_transactions.insert_one({
        "tx_id": f"tx_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "type": "admin_credit",
        "amount": amount,
        "status": balance_type,
        "description": f"Credito manual do admin ({balance_type})",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Notificar usuario
    await db.notifications.insert_one({
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "type": "wallet",
        "message": f"R$ {amount:.2f} adicionado a sua carteira!",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    wallet = await db.wallets.find_one({"user_id": user_id}, {"_id": 0})
    return {"message": "Saldo adicionado com sucesso", "wallet": wallet}

# ==================== 2. SISTEMA DE LIBERAÇÃO DE SALDO (ESCROW) ====================
@api_router.post("/admin/wallet/release-held")
async def admin_release_held_balance(request: Request):
    """Admin libera saldo retido (held -> available)"""
    await require_admin(request)
    body = await request.json()
    user_id = body.get("user_id")
    amount = body.get("amount")  # Optional: se None, libera tudo
    order_id = body.get("order_id")  # Optional: liberar por pedido especifico
    
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id obrigatorio")
    
    wallet = await db.wallets.find_one({"user_id": user_id}, {"_id": 0})
    if not wallet:
        raise HTTPException(status_code=404, detail="Carteira nao encontrada")
    
    held_balance = wallet.get("held", 0)
    if held_balance <= 0:
        raise HTTPException(status_code=400, detail="Nenhum saldo retido para liberar")
    
    # Se amount nao especificado, libera tudo
    release_amount = float(amount) if amount else held_balance
    
    if release_amount > held_balance:
        raise HTTPException(status_code=400, detail="Valor maior que saldo retido")
    
    # Transferir de held para available
    await db.wallets.update_one(
        {"user_id": user_id},
        {"$inc": {"held": -release_amount, "available": release_amount}}
    )
    
    # Atualizar transacoes relacionadas ao pedido
    if order_id:
        await db.wallet_transactions.update_many(
            {"user_id": user_id, "order_id": order_id, "status": "held"},
            {"$set": {"status": "available", "released_at": datetime.now(timezone.utc).isoformat()}}
        )
    
    # Registrar liberacao
    await db.wallet_transactions.insert_one({
        "tx_id": f"tx_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "type": "admin_release",
        "amount": release_amount,
        "status": "available",
        "description": "Liberacao manual de saldo retido" + (f" (Pedido #{order_id[:16]})" if order_id else ""),
        "order_id": order_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Notificar usuario
    await db.notifications.insert_one({
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "type": "wallet",
        "message": f"R$ {release_amount:.2f} liberado e disponivel para saque!",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    updated_wallet = await db.wallets.find_one({"user_id": user_id}, {"_id": 0})
    return {"message": "Saldo liberado com sucesso", "released": release_amount, "wallet": updated_wallet}

# ==================== 3. CONTROLE DE AFILIADOS ====================
@api_router.put("/admin/users/{user_id}/affiliate-settings")
async def admin_update_affiliate_settings(user_id: str, request: Request):
    """Admin ativa/desativa ganhos de afiliado"""
    await require_admin(request)
    body = await request.json()
    affiliate_earnings_enabled = body.get("affiliate_earnings_enabled", True)
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado")
    
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"affiliate_earnings_enabled": affiliate_earnings_enabled}}
    )
    
    return {"message": "Configuracoes de afiliado atualizadas", "affiliate_earnings_enabled": affiliate_earnings_enabled}

@api_router.post("/admin/affiliate/release-commission")
async def admin_release_affiliate_commission(request: Request):
    """Admin libera comissao de afiliado manualmente"""
    await require_admin(request)
    body = await request.json()
    affiliate_id = body.get("affiliate_id")
    order_id = body.get("order_id")
    
    if not affiliate_id or not order_id:
        raise HTTPException(status_code=400, detail="affiliate_id e order_id obrigatorios")
    
    # Buscar transacao de comissao
    tx = await db.wallet_transactions.find_one(
        {"user_id": affiliate_id, "order_id": order_id, "type": "affiliate_commission"},
        {"_id": 0}
    )
    
    if not tx:
        raise HTTPException(status_code=404, detail="Comissao nao encontrada")
    
    if tx.get("status") == "available":
        raise HTTPException(status_code=400, detail="Comissao ja liberada")
    
    amount = tx["amount"]
    
    # Transferir de held para available
    await db.wallets.update_one(
        {"user_id": affiliate_id},
        {"$inc": {"held": -amount, "available": amount}}
    )
    
    # Atualizar transacao
    await db.wallet_transactions.update_one(
        {"tx_id": tx["tx_id"]},
        {"$set": {"status": "available", "released_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Notificar afiliado
    await db.notifications.insert_one({
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
        "user_id": affiliate_id,
        "type": "wallet",
        "message": f"Comissao de R$ {amount:.2f} liberada!",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Comissao liberada", "amount": amount}

# ==================== 4. PAINEL DE VENDAS MELHORADO ====================
@api_router.get("/admin/sales/dashboard")
async def admin_sales_dashboard(request: Request):
    """Dashboard completo de vendas com detalhes de comprador, vendedor, produto"""
    await require_admin(request)
    
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).limit(100).to_list(100)
    
    sales_data = []
    for order in orders:
        buyer = await db.users.find_one({"user_id": order["buyer_id"]}, {"_id": 0, "password_hash": 0})
        
        for item in order.get("items", []):
            seller = await db.users.find_one({"user_id": item["seller_id"]}, {"_id": 0, "password_hash": 0})
            product = await db.products.find_one({"product_id": item["product_id"]}, {"_id": 0})
            
            sales_data.append({
                "order_id": order["order_id"],
                "buyer": {
                    "user_id": order["buyer_id"],
                    "name": order.get("buyer_name", ""),
                    "email": order.get("buyer_email", "")
                },
                "seller": {
                    "user_id": item["seller_id"],
                    "name": seller.get("name", "") if seller else "",
                    "email": seller.get("email", "") if seller else ""
                },
                "product": {
                    "product_id": item["product_id"],
                    "title": item.get("title", ""),
                    "price": item.get("price", 0),
                    "quantity": item.get("quantity", 1),
                    "image": item.get("image", "")
                },
                "value": item.get("subtotal", 0),
                "total": order.get("total", 0),
                "status": order.get("status", "pending"),
                "payment_method": order.get("payment_method", "pix"),
                "tracking_code": order.get("tracking_code", ""),
                "created_at": order.get("created_at", ""),
                "shipping_address": order.get("shipping_address", {})
            })
    
    return {"sales": sales_data, "total_sales": len(sales_data)}

# ==================== 5. NOTIFICAÇÕES AUTOMÁTICAS DE VENDAS ====================
@api_router.get("/admin/notifications")
async def admin_get_notifications(request: Request):
    """Obter notificacoes do admin (vendas, etc)"""
    await require_admin(request)
    
    notifications = await db.admin_notifications.find({}, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    unread_count = await db.admin_notifications.count_documents({"read": False})
    
    return {"notifications": notifications, "unread_count": unread_count}

@api_router.put("/admin/notifications/{notification_id}/read")
async def admin_mark_notification_read(notification_id: str, request: Request):
    """Marcar notificacao como lida"""
    await require_admin(request)
    
    await db.admin_notifications.update_one(
        {"notification_id": notification_id},
        {"$set": {"read": True}}
    )
    
    return {"message": "Notificacao marcada como lida"}

# ==================== 6. RASTREAMENTO DE PEDIDOS ====================
@api_router.put("/admin/orders/{order_id}/tracking")
async def admin_update_tracking_code(order_id: str, request: Request):
    """Admin/Vendedor adiciona codigo de rastreio"""
    user = await get_current_user(request)
    body = await request.json()
    tracking_code = body.get("tracking_code", "").strip()
    
    if not tracking_code:
        raise HTTPException(status_code=400, detail="Codigo de rastreio obrigatorio")
    
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Pedido nao encontrado")
    
    # Verificar permissao (admin ou vendedor do pedido)
    is_seller = any(item["seller_id"] == user["user_id"] for item in order.get("items", []))
    if user.get("role") != "admin" and not is_seller:
        raise HTTPException(status_code=403, detail="Sem permissao")
    
    # Atualizar codigo de rastreio
    await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {"tracking_code": tracking_code, "tracking_updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Notificar comprador
    await db.notifications.insert_one({
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
        "user_id": order["buyer_id"],
        "type": "order",
        "message": f"Codigo de rastreio adicionado: {tracking_code}",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Codigo de rastreio atualizado", "tracking_code": tracking_code}

@api_router.put("/seller/orders/{order_id}/tracking")
async def seller_add_tracking_code(order_id: str, request: Request):
    """Vendedor adiciona código de rastreio ao seu pedido"""
    user = await get_current_user(request)
    
    if user.get("role") != "seller":
        raise HTTPException(status_code=403, detail="Apenas vendedores podem adicionar codigo de rastreio")
    
    body = await request.json()
    tracking_code = body.get("tracking_code", "").strip()
    
    if not tracking_code:
        raise HTTPException(status_code=400, detail="Codigo de rastreio obrigatorio")
    
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Pedido nao encontrado")
    
    # Verificar se vendedor tem produtos neste pedido
    is_seller = any(item["seller_id"] == user["user_id"] for item in order.get("items", []))
    if not is_seller:
        raise HTTPException(status_code=403, detail="Este pedido nao pertence a voce")
    
    # Atualizar codigo de rastreio
    await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {
            "tracking_code": tracking_code,
            "tracking_updated_at": datetime.now(timezone.utc).isoformat(),
            "tracking_updated_by": user["user_id"]
        }}
    )
    
    # Notificar comprador
    await db.notifications.insert_one({
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
        "user_id": order["buyer_id"],
        "type": "order_tracking",
        "message": f"Código de rastreio disponível: {tracking_code}",
        "data": {"order_id": order_id, "tracking_code": tracking_code},
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "message": "Codigo de rastreio adicionado com sucesso",
        "tracking_code": tracking_code,
        "order_id": order_id
    }

@api_router.get("/orders/{order_id}/tracking")
async def get_order_tracking(order_id: str, request: Request):
    """Obter informacoes de rastreio do pedido"""
    user = await get_current_user(request)
    
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Pedido nao encontrado")
    
    # Verificar se usuario tem permissao
    is_buyer = order["buyer_id"] == user["user_id"]
    is_seller = any(item["seller_id"] == user["user_id"] for item in order.get("items", []))
    is_admin = user.get("role") == "admin"
    
    if not (is_buyer or is_seller or is_admin):
        raise HTTPException(status_code=403, detail="Sem permissao")
    
    return {
        "order_id": order["order_id"],
        "tracking_code": order.get("tracking_code", ""),
        "status": order.get("status", "pending"),
        "tracking": order.get("tracking", []),
        "created_at": order.get("created_at", "")
    }

# ==================== 7. PERSONALIZAÇÃO DO PAINEL ADMIN ====================
@api_router.get("/admin/customization")
async def get_admin_customization(request: Request):
    """Obter configuracoes de personalizacao do admin"""
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
    """Atualizar configuracoes de personalizacao"""
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
    """Obter configuracoes de layout do painel"""
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
    """Atualizar configuracoes de layout"""
    await require_admin(request)
    body = await request.json()
    
    await db.admin_customization.update_one(
        {"key": "layout"},
        {"$set": {"key": "layout", "value": body, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    return {"message": "Layout atualizado", "settings": body}

# ==================== NEWSLETTER / SUBSCRIBERS ====================
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
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Inscrito nao encontrado")
    return {"message": "Inscrito removido"}


# ==================== EMAIL CAMPAIGNS (RESEND) ====================
def _build_campaign_html(title: str, content: str, button_text: str = "", button_url: str = "") -> str:
    """Build a simple, email-client-safe HTML for campaigns"""
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
                &copy; {datetime.now(timezone.utc).year} Brane Marketplace. Todos os direitos reservados.<br>
                Voce esta recebendo este e-mail porque se inscreveu em nossa newsletter.
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
    """Generate HTML preview without sending"""
    await require_admin(request)
    if not payload.subject.strip() or not payload.title.strip() or not payload.content.strip():
        raise HTTPException(status_code=400, detail="Assunto, titulo e conteudo sao obrigatorios")
    html = _build_campaign_html(payload.title, payload.content, payload.button_text or "", payload.button_url or "")
    return {"subject": payload.subject, "html": html}


@api_router.post("/admin/campaigns")
async def create_and_send_campaign(payload: CampaignCreate, request: Request):
    """Create a campaign and send to all subscribers via Resend"""
    await require_admin(request)
    if not RESEND_API_KEY:
        raise HTTPException(status_code=500, detail="Servico de e-mail nao configurado (RESEND_API_KEY)")
    if not payload.subject.strip() or not payload.title.strip() or not payload.content.strip():
        raise HTTPException(status_code=400, detail="Assunto, titulo e conteudo sao obrigatorios")

    subscribers = await db.subscribers.find({}, {"_id": 0, "email": 1}).to_list(10000)
    if not subscribers:
        raise HTTPException(status_code=400, detail="Nenhum inscrito para enviar")

    html = _build_campaign_html(payload.title, payload.content, payload.button_text or "", payload.button_url or "")
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
                "html": html,
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


# ==================== FOOTER CONFIG (SOCIAL LINKS) ====================
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
    """Public endpoint - read by Footer component"""
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
async def update_social_profile_direct(data: dict, request: Request):
    user = await get_current_user(request)

    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "user_id": user["user_id"],
            "name": data.get("name", ""),
            "city": data.get("city", ""),
            "state": data.get("state", ""),
            "avatar": data.get("avatar", "")
        }},
        upsert=True
    )

    return {"ok": True}

@app.on_event("startup")
async def startup():
    try:
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
        # Initialize shipping settings
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
        try:
            init_storage()
            logger.info("MongoDB storage ready - no external storage needed")
        except Exception as e:
            logger.error(f"Storage init failed: {e}")
        logger.info("BRANE Marketplace started!")
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
