from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Request, Response
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import requests as http_requests
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

# ==================== MODELS ====================
class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "buyer"

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

class ProductUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    city: Optional[str] = None
    location: Optional[str] = None
    images: Optional[List[str]] = None

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
    bank_name: Optional[str] = None
    bank_account_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    pix_key: Optional[str] = None
    paypal_enabled: bool = False
    pix_enabled: bool = True
    ted_enabled: bool = True

class ShippingOption(BaseModel):
    name: str
    price: float
    days: str
    enabled: bool = True

class ShippingSettings(BaseModel):
    options: List[ShippingOption] = []

class SellerTermsAccept(BaseModel):
    accepted: bool = True

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
    global storage_key
    if storage_key:
        return storage_key
    try:
        resp = http_requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage unavailable")
    resp = http_requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage unavailable")
    resp = http_requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

def clean_user(user: dict) -> dict:
    return {k: v for k, v in user.items() if k not in ("password_hash", "_id")}

# ==================== AUTH ROUTES ====================
@api_router.post("/auth/register")
async def register(data: UserRegister):
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email ja cadastrado")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    register_role = data.role if data.role in ("buyer", "seller", "affiliate") else "buyer"
    user = {
        "user_id": user_id, "name": data.name, "email": data.email,
        "password_hash": hash_password(data.password), "role": register_role,
        "picture": "", "bank_details": {}, "is_blocked": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    await db.wallets.insert_one({"user_id": user_id, "available": 0.0, "held": 0.0})
    token = create_jwt(user_id, data.email, register_role)
    return {"token": token, "user": clean_user(user)}

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
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
        "seller_id": user["user_id"], "seller_name": user["name"],
        "status": "active", "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.products.insert_one(product)
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

# ==================== UPLOAD ROUTES ====================
@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), request: Request = None):
    user = await get_current_user(request)
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    path = f"{APP_NAME}/uploads/{user['user_id']}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or "application/octet-stream")
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
        data, content_type = get_object(path)
        return Response(content=data, media_type=content_type)
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
    if data.affiliate_code:
        link = await db.affiliate_links.find_one({"code": data.affiliate_code}, {"_id": 0})
        if link:
            affiliate_id = link["affiliate_id"]
            await db.affiliate_links.update_one({"code": data.affiliate_code}, {"$inc": {"conversions": 1}})
    
    order_id = f"order_{uuid.uuid4().hex[:12]}"
    order = {
        "order_id": order_id, "buyer_id": user["user_id"], "buyer_name": user["name"],
        "buyer_email": user.get("email", ""),
        "items": order_items, "subtotal": subtotal,
        "shipping_cost": shipping_cost, "shipping_option": shipping_name,
        "discount": discount_value, "coupon_code": coupon_applied,
        "total": total,
        "shipping_address": data.shipping_address.model_dump() if data.shipping_address else {},
        "platform_commission": subtotal * platform_rate,
        "affiliate_commission": subtotal * affiliate_rate if affiliate_id else 0,
        "affiliate_id": affiliate_id, "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(order)
    for seller_id, amount in sellers.items():
        aff_rate = affiliate_rate if affiliate_id else 0
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
        aff_amount = total * affiliate_rate
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
    pending_orders = await db.orders.count_documents({"status": "pending"})
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
    await db.orders.update_one({"order_id": order_id}, {"$set": {"status": "approved"}})
    # Move held to available for related transactions
    await db.wallet_transactions.update_many({"order_id": order_id, "status": "held"}, {"$set": {"status": "available"}})
    # Update wallets - find all held transactions for this order
    txs = await db.wallet_transactions.find({"order_id": order_id}, {"_id": 0}).to_list(100)
    for tx in txs:
        await db.wallets.update_one({"user_id": tx["user_id"]}, {"$inc": {"held": -tx["amount"], "available": tx["amount"]}})
    await db.notifications.insert_one({
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}", "user_id": order["buyer_id"],
        "type": "order", "message": f"Seu pedido #{order_id[:16]} foi aprovado!",
        "read": False, "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Pedido aprovado"}

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
    return s["value"] if s else {"paypal_email": "", "bank_name": "", "bank_account_name": "", "bank_account_number": "", "pix_key": "", "paypal_enabled": False, "pix_enabled": True, "ted_enabled": True}

@api_router.put("/admin/financial-settings")
async def update_financial_settings(data: FinancialSettings, request: Request):
    await require_admin(request)
    await db.platform_settings.update_one({"key": "financial"}, {"$set": {"key": "financial", "value": data.model_dump()}}, upsert=True)
    return {"message": "Configuracoes financeiras atualizadas"}

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

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        await db.platform_settings.insert_one({"key": "shipping", "value": {
            "options": [
                {"name": "Gratis", "price": 0, "days": "7-15 dias uteis", "enabled": True},
                {"name": "Normal", "price": 15.90, "days": "5-8 dias uteis", "enabled": True},
                {"name": "Expresso", "price": 29.90, "days": "2-3 dias uteis", "enabled": True}
            ]
        }})
    try:
        init_storage()
        logger.info("Object storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
    logger.info("BRANE Marketplace started!")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
