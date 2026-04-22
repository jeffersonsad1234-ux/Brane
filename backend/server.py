from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Request, Response
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import requests as http_requests
import base64
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import jwt, JWTError

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
JWT_SECRET = os.environ.get('JWT_SECRET', 'brane-secret-key')
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 72

STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "brane-marketplace"
storage_key = None

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
app.include_router(api_router)
@app.get("/health")
def health():
    return {"status": "ok", "debug": "v1"} 
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

class StoreUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    logo: Optional[str] = None
    banner: Optional[str] = None
    category: Optional[str] = None

class PlanUpgrade(BaseModel):
    plan: str  # 'free', 'pro', 'premium'

class AdCreate(BaseModel):
    title: str
    image: str
    link: str
    position: Optional[str] = "between_products"  # 'top', 'between_products', 'sidebar'

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
    if domain in DISPOSABLE_EMAIL_DOMAINS:
        return False, "Emails temporarios/descartaveis nao sao permitidos"
    # Block obviously fake patterns
    local_part = email.split("@")[0]
    if len(local_part) < 2:
        return False, "Email muito curto"
    # Block emails with only numbers in local part (suspicious)
    if local_part.isdigit() and len(local_part) < 4:
        return False, "Email suspeito, use um email real"
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
    register_role = data.role if data.role in ("buyer", "seller", "affiliate") else "buyer"
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


# ==================== PRODUCT ROUTES ====================
@api_router.get("/products")
async def list_products(search: Optional[str] = None, category: Optional[str] = None, city: Optional[str] = None, page: int = 1, limit: int = 20):
    query = {"status": "active"}
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
    products = await db.products.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
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

@api_router.post("/products")
async def create_product(data: ProductCreate, request: Request):
    user = await require_seller(request)
    if data.category in ("imoveis", "automoveis") and not data.city:
        raise HTTPException(status_code=400, detail="Cidade obrigatoria para imoveis/automoveis")
    product_id = f"prod_{uuid.uuid4().hex[:12]}"
    product = {
        "product_id": product_id, "title": data.title, "description": data.description,
        "price": data.price, "category": data.category, "city": data.city or "",
        "location": data.location or "", "images": data.images,
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

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, request: Request):
    user = await require_seller(request)
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Produto nao encontrado")
    if product["seller_id"] != user["user_id"] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Sem permissao")
    await db.products.delete_one({"product_id": product_id})
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
        "plan": "free",  # free, pro, premium
        "plan_commission": 0.09,  # 9% for free
        "is_featured": False,  # Only PRO/PREMIUM can be featured
        "is_approved": False,  # Admin must approve to show in Stores section
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
        query = {"is_approved": True, "plan": {"$in": ["pro", "premium"]}}
    skip = (page - 1) * limit
    stores = await db.stores.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
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
    for ci in cart_items:
        product = await db.products.find_one({"product_id": ci["product_id"]}, {"_id": 0})
        if not product:
            continue
        item_subtotal = product["price"] * ci["quantity"]
        subtotal += item_subtotal
        order_items.append({
            "product_id": product["product_id"], "title": product["title"],
            "price": product["price"], "quantity": ci["quantity"],
            "subtotal": item_subtotal, "seller_id": product["seller_id"],
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
        "platform_commission": subtotal * platform_rate,
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
    orders = await db.orders.find({}, {"_id": 0, "total": 1, "platform_commission": 1}).to_list(10000)
    total_sales = sum(o.get("total", 0) for o in orders)
    total_commissions = sum(o.get("platform_commission", 0) for o in orders)
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

# ==================== ADMIN PLATFORM CUSTOMIZATION ====================
@api_router.get("/admin/theme")
async def get_theme_settings(request: Request):
    await require_admin(request)
    s = await db.platform_settings.find_one({"key": "theme"}, {"_id": 0})
    defaults = {
        "primary_color": "#B38B36",
        "price_color": "#0F1111",
        "price_cents_color": "#0F1111",
        "button_color": "#F0C14B",
        "button_text_color": "#0F1111",
        "buy_now_color": "#FF8C00",
        "star_color": "#FFA41C",
        "free_shipping_color": "#067D62",
        "navbar_bg": "#0A0A0A",
        "navbar_text": "#FFFFFF",
        "card_bg": "#FFFFFF",
        "card_border": "#E0E0E0",
        "page_bg": "#EAEDED",
        "category_text_color": "#B38B36",
        "category_bg_color": "#1A1A1A",
        "menu_text_color": "#CCCCCC",
        "nav_link_color": "#888888",
        "nav_link_hover_color": "#B38B36",
        "title_color": "#B38B36",
        "product_card_size": "medium",
        # Social page customization (DM)
        "social_bg_color": "#0a0014",
        "social_accent_color": "#ec4899",
        "social_card_bg": "#1a1028",
        "social_card_border": "rgba(168,85,247,0.25)",
        "social_text_color": "#ffffff",
        "social_muted_color": "rgba(216,180,254,0.6)",
        "social_feed_width": "medium",
        "social_card_radius": "xl",
        "platform_name": "BRANE",
        "platform_slogan": "Sua nova experiência social",
        "show_stars": True,
        "show_free_shipping": True,
        "show_installments": True,
        "installment_count": 12
    }
    return {**defaults, **(s["value"] if s else {})}

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
    defaults = {
        "primary_color": "#B38B36",
        "price_color": "#0F1111",
        "price_cents_color": "#0F1111",
        "button_color": "#F0C14B",
        "button_text_color": "#0F1111",
        "buy_now_color": "#FF8C00",
        "star_color": "#FFA41C",
        "free_shipping_color": "#067D62",
        "navbar_bg": "#0A0A0A",
        "navbar_text": "#FFFFFF",
        "card_bg": "#FFFFFF",
        "card_border": "#E0E0E0",
        "page_bg": "#EAEDED",
        "category_text_color": "#B38B36",
        "category_bg_color": "#1A1A1A",
        "menu_text_color": "#CCCCCC",
        "nav_link_color": "#888888",
        "nav_link_hover_color": "#B38B36",
        "title_color": "#B38B36",
        "product_card_size": "medium",
        "social_bg_color": "#0a0014",
        "social_accent_color": "#ec4899",
        "social_card_bg": "#1a1028",
        "social_card_border": "rgba(168,85,247,0.25)",
        "social_text_color": "#ffffff",
        "social_muted_color": "rgba(216,180,254,0.6)",
        "social_feed_width": "medium",
        "social_card_radius": "xl",
        "platform_name": "BRANE",
        "platform_slogan": "Sua nova experiência social",
        "show_stars": True,
        "show_free_shipping": True,
        "show_installments": True,
        "installment_count": 12
    }
    return {**defaults, **(s["value"] if s else {})}

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
    await db.products.update_one({"product_id": product_id}, {"$set": {"is_deleted": True}})
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

@api_router.post("/admin/support/{message_id}/reply")
async def admin_reply_support(message_id: str, data: SupportReply, request: Request):
    admin = await require_admin(request)
    msg = await db.support_messages.find_one({"message_id": message_id}, {"_id": 0})
    if not msg:
        raise HTTPException(status_code=404, detail="Mensagem nao encontrada")
    reply = {
        "reply_id": f"reply_{uuid.uuid4().hex[:12]}", "admin_name": admin["name"],
        "reply": data.reply, "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.support_messages.update_one({"message_id": message_id}, {"$push": {"replies": reply}, "$set": {"status": "answered"}})
    await db.notifications.insert_one({
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}", "user_id": msg["user_id"],
        "type": "support", "message": "Voce recebeu uma resposta do suporte!",
        "read": False, "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Resposta enviada"}

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
        "description": f"Liberacao manual de saldo retido" + (f" (Pedido #{order_id[:16]})" if order_id else ""),
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
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(.*\.vercel\.app|.*\.emergentagent\.com|localhost(:\d+)?)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.on_event("startup")
async def startup():
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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
