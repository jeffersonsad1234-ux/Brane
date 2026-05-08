from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import io
import uuid
import logging
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, Response, Query
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak

# ---------- DB ----------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# ---------- App ----------
app = FastAPI(title="B-Livre ADM API")
api = APIRouter(prefix="/api")

JWT_ALGO = "HS256"
JWT_SECRET = os.environ["JWT_SECRET"]

logger = logging.getLogger("blivre")
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# ---------- Helpers ----------
def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def to_iso(dt: datetime) -> str:
    if isinstance(dt, str):
        return dt
    return dt.isoformat()


def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()


def verify_password(p: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(p.encode(), h.encode())
    except Exception:
        return False


def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": now_utc() + timedelta(days=7),
        "iat": now_utc(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])


bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    token = auth[7:] if auth.startswith("Bearer ") else None
    if not token:
        raise HTTPException(401, "Não autenticado")
    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Sessão expirada")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Token inválido")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(401, "Usuário não encontrado")
    # update last activity
    await db.users.update_one({"id": user["id"]}, {"$set": {"last_seen": to_iso(now_utc())}})
    return user


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(403, "Acesso restrito ao administrador")
    return user


# ---------- Models ----------
class UserPublic(BaseModel):
    id: str
    name: str
    email: str
    role: str = "user"
    status: str = "active"  # active | suspended | banned
    avatar: Optional[str] = None
    created_at: str
    last_seen: Optional[str] = None
    listings_count: int = 0


class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ListingIn(BaseModel):
    title: str
    description: str
    category: Optional[str] = "geral"
    price: Optional[float] = None
    location: Optional[str] = None
    image: Optional[str] = None


class MessageIn(BaseModel):
    listing_id: str
    to_user_id: str
    content: str


class ReportIn(BaseModel):
    target_type: Literal["listing", "user", "message"]
    target_id: str
    reason: str
    description: Optional[str] = None


class SupportIn(BaseModel):
    subject: str
    message: str
    category: Optional[str] = "geral"


class SupportReplyIn(BaseModel):
    message: str


class StatusUpdate(BaseModel):
    status: str


# ---------- Startup ----------
@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.listings.create_index("id", unique=True)
    await db.messages.create_index("id", unique=True)
    await db.reports.create_index("id", unique=True)
    await db.support_tickets.create_index("id", unique=True)
    await db.listing_views.create_index([("listing_id", 1), ("created_at", -1)])
    await db.listing_interests.create_index([("listing_id", 1), ("created_at", -1)])

    admin_email = os.environ["ADMIN_EMAIL"]
    admin_pw = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "name": "Administrador",
            "email": admin_email,
            "password_hash": hash_password(admin_pw),
            "role": "admin",
            "status": "active",
            "avatar": None,
            "created_at": to_iso(now_utc()),
            "last_seen": to_iso(now_utc()),
        })
        logger.info("Admin seeded: %s", admin_email)
    else:
        # ensure admin password matches env
        if not verify_password(admin_pw, existing.get("password_hash", "")):
            await db.users.update_one(
                {"email": admin_email},
                {"$set": {"password_hash": hash_password(admin_pw), "role": "admin"}},
            )
            logger.info("Admin password updated")


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


# ---------- Auth Routes ----------
@api.post("/auth/register")
async def register(payload: RegisterIn):
    email = payload.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "E-mail já cadastrado")
    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "name": payload.name.strip(),
        "email": email,
        "password_hash": hash_password(payload.password),
        "role": "user",
        "status": "active",
        "avatar": None,
        "created_at": to_iso(now_utc()),
        "last_seen": to_iso(now_utc()),
    }
    await db.users.insert_one(doc)
    token = create_token(user_id, email, "user")
    doc.pop("password_hash", None)
    doc.pop("_id", None)
    return {"token": token, "user": doc}


@api.post("/auth/login")
async def login(payload: LoginIn):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(401, "Credenciais inválidas")
    if user.get("status") in ("banned",):
        raise HTTPException(403, "Conta bloqueada")
    await db.users.update_one({"id": user["id"]}, {"$set": {"last_seen": to_iso(now_utc())}})
    token = create_token(user["id"], user["email"], user.get("role", "user"))
    user.pop("password_hash", None)
    user.pop("_id", None)
    return {"token": token, "user": user}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@api.post("/auth/heartbeat")
async def heartbeat(user: dict = Depends(get_current_user)):
    await db.users.update_one({"id": user["id"]}, {"$set": {"last_seen": to_iso(now_utc())}})
    return {"ok": True}


# ---------- Public B-Livre data flow (so admin sees real data) ----------
@api.post("/listings")
async def create_listing(payload: ListingIn, user: dict = Depends(get_current_user)):
    listing_id = str(uuid.uuid4())
    doc = {
        "id": listing_id,
        "owner_id": user["id"],
        "owner_name": user.get("name"),
        "title": payload.title,
        "description": payload.description,
        "category": payload.category or "geral",
        "price": payload.price,
        "location": payload.location,
        "image": payload.image,
        "status": "active",
        "views": 0,
        "interests": 0,
        "created_at": to_iso(now_utc()),
    }
    await db.listings.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.get("/listings")
async def list_listings(limit: int = 50):
    docs = await db.listings.find({"status": {"$ne": "removed"}}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return docs


@api.post("/listings/{listing_id}/view")
async def register_view(listing_id: str, request: Request):
    listing = await db.listings.find_one({"id": listing_id})
    if not listing:
        raise HTTPException(404, "Anúncio não encontrado")
    await db.listing_views.insert_one({
        "id": str(uuid.uuid4()),
        "listing_id": listing_id,
        "ip": request.client.host if request.client else None,
        "created_at": to_iso(now_utc()),
    })
    await db.listings.update_one({"id": listing_id}, {"$inc": {"views": 1}})
    return {"ok": True}


@api.post("/listings/{listing_id}/interest")
async def register_interest(listing_id: str, user: dict = Depends(get_current_user)):
    listing = await db.listings.find_one({"id": listing_id})
    if not listing:
        raise HTTPException(404, "Anúncio não encontrado")
    await db.listing_interests.insert_one({
        "id": str(uuid.uuid4()),
        "listing_id": listing_id,
        "user_id": user["id"],
        "created_at": to_iso(now_utc()),
    })
    await db.listings.update_one({"id": listing_id}, {"$inc": {"interests": 1}})
    return {"ok": True}


@api.post("/messages")
async def send_message(payload: MessageIn, user: dict = Depends(get_current_user)):
    listing = await db.listings.find_one({"id": payload.listing_id})
    if not listing:
        raise HTTPException(404, "Anúncio não encontrado")
    target = await db.users.find_one({"id": payload.to_user_id})
    if not target:
        raise HTTPException(404, "Destinatário não encontrado")
    msg_id = str(uuid.uuid4())
    doc = {
        "id": msg_id,
        "listing_id": payload.listing_id,
        "listing_title": listing.get("title"),
        "from_user_id": user["id"],
        "from_user_name": user.get("name"),
        "to_user_id": payload.to_user_id,
        "to_user_name": target.get("name"),
        "content": payload.content,
        "created_at": to_iso(now_utc()),
    }
    await db.messages.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.post("/reports")
async def create_report(payload: ReportIn, user: dict = Depends(get_current_user)):
    rid = str(uuid.uuid4())
    doc = {
        "id": rid,
        "reporter_id": user["id"],
        "reporter_name": user.get("name"),
        "target_type": payload.target_type,
        "target_id": payload.target_id,
        "reason": payload.reason,
        "description": payload.description,
        "status": "pending",  # pending | reviewing | resolved | dismissed
        "created_at": to_iso(now_utc()),
    }
    await db.reports.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.post("/support")
async def create_support(payload: SupportIn, user: dict = Depends(get_current_user)):
    tid = str(uuid.uuid4())
    doc = {
        "id": tid,
        "user_id": user["id"],
        "user_name": user.get("name"),
        "user_email": user.get("email"),
        "subject": payload.subject,
        "message": payload.message,
        "category": payload.category or "geral",
        "status": "open",  # open | in_progress | resolved | closed
        "replies": [],
        "created_at": to_iso(now_utc()),
        "updated_at": to_iso(now_utc()),
    }
    await db.support_tickets.insert_one(doc)
    doc.pop("_id", None)
    return doc


# ---------- ADMIN B-LIVRE ROUTES ----------
admin = APIRouter(prefix="/admin/blivre", dependencies=[Depends(require_admin)])


def online_threshold_iso() -> str:
    return to_iso(now_utc() - timedelta(minutes=5))


@admin.get("/stats")
async def admin_stats():
    threshold = online_threshold_iso()
    today_start = to_iso(now_utc().replace(hour=0, minute=0, second=0, microsecond=0))

    users_total = await db.users.count_documents({"role": "user"})
    users_active = await db.users.count_documents({"role": "user", "status": "active"})
    users_suspended = await db.users.count_documents({"role": "user", "status": {"$in": ["suspended", "banned"]}})
    users_online = await db.users.count_documents({"role": "user", "last_seen": {"$gte": threshold}})
    listings_total = await db.listings.count_documents({})
    listings_active = await db.listings.count_documents({"status": "active"})
    listings_removed = await db.listings.count_documents({"status": "removed"})
    messages_total = await db.messages.count_documents({})
    messages_today = await db.messages.count_documents({"created_at": {"$gte": today_start}})
    reports_pending = await db.reports.count_documents({"status": "pending"})
    reports_total = await db.reports.count_documents({})
    support_open = await db.support_tickets.count_documents({"status": {"$in": ["open", "in_progress"]}})
    support_total = await db.support_tickets.count_documents({})
    views_total = await db.listing_views.count_documents({})
    interests_total = await db.listing_interests.count_documents({})

    # 7-day activity series
    series = []
    for i in range(6, -1, -1):
        day = (now_utc() - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        next_day = day + timedelta(days=1)
        d_iso, n_iso = to_iso(day), to_iso(next_day)
        new_users = await db.users.count_documents({"created_at": {"$gte": d_iso, "$lt": n_iso}, "role": "user"})
        new_listings = await db.listings.count_documents({"created_at": {"$gte": d_iso, "$lt": n_iso}})
        new_messages = await db.messages.count_documents({"created_at": {"$gte": d_iso, "$lt": n_iso}})
        new_views = await db.listing_views.count_documents({"created_at": {"$gte": d_iso, "$lt": n_iso}})
        series.append({
            "date": day.strftime("%d/%m"),
            "users": new_users,
            "listings": new_listings,
            "messages": new_messages,
            "views": new_views,
        })

    # category distribution
    cats_pipeline = [
        {"$match": {"status": "active"}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 6},
    ]
    cats = []
    async for c in db.listings.aggregate(cats_pipeline):
        cats.append({"name": c["_id"] or "geral", "value": c["count"]})

    return {
        "users": {"total": users_total, "active": users_active, "suspended": users_suspended, "online": users_online},
        "listings": {"total": listings_total, "active": listings_active, "removed": listings_removed},
        "messages": {"total": messages_total, "today": messages_today},
        "reports": {"pending": reports_pending, "total": reports_total},
        "support": {"open": support_open, "total": support_total},
        "views": {"total": views_total},
        "interests": {"total": interests_total},
        "series_7d": series,
        "categories": cats,
    }


@admin.get("/notifications")
async def admin_notifications():
    """Polling endpoint - returns counts of unhandled items."""
    pending_reports = await db.reports.count_documents({"status": "pending"})
    open_support = await db.support_tickets.count_documents({"status": "open"})
    # newly created in last 5 minutes
    threshold = to_iso(now_utc() - timedelta(minutes=5))
    new_reports_5m = await db.reports.count_documents({"created_at": {"$gte": threshold}})
    new_support_5m = await db.support_tickets.count_documents({"created_at": {"$gte": threshold}})
    new_messages_5m = await db.messages.count_documents({"created_at": {"$gte": threshold}})
    return {
        "pending_reports": pending_reports,
        "open_support": open_support,
        "recent": {
            "reports_5m": new_reports_5m,
            "support_5m": new_support_5m,
            "messages_5m": new_messages_5m,
        },
        "checked_at": to_iso(now_utc()),
    }


@admin.get("/users")
async def admin_list_users(q: str = "", status: str = "", limit: int = 200):
    query: dict = {"role": "user"}
    if status:
        query["status"] = status
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}},
        ]
    docs = await db.users.find(query, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(limit)
    # add listings count
    threshold = online_threshold_iso()
    out = []
    for d in docs:
        lc = await db.listings.count_documents({"owner_id": d["id"]})
        d["listings_count"] = lc
        d["online"] = bool(d.get("last_seen") and d["last_seen"] >= threshold)
        out.append(d)
    return out


@admin.patch("/users/{user_id}")
async def admin_update_user(user_id: str, payload: StatusUpdate):
    if payload.status not in ("active", "suspended", "banned"):
        raise HTTPException(400, "Status inválido")
    res = await db.users.update_one({"id": user_id, "role": "user"}, {"$set": {"status": payload.status}})
    if not res.matched_count:
        raise HTTPException(404, "Usuário não encontrado")
    if payload.status in ("suspended", "banned"):
        # also hide their listings
        await db.listings.update_many({"owner_id": user_id}, {"$set": {"status": "removed"}})
    return {"ok": True}


@admin.delete("/users/{user_id}")
async def admin_delete_user(user_id: str):
    user = await db.users.find_one({"id": user_id, "role": "user"})
    if not user:
        raise HTTPException(404, "Usuário não encontrado")
    await db.users.delete_one({"id": user_id})
    await db.listings.delete_many({"owner_id": user_id})
    return {"ok": True}


@admin.get("/listings")
async def admin_list_listings(q: str = "", status: str = "", limit: int = 200):
    query: dict = {}
    if status:
        query["status"] = status
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"category": {"$regex": q, "$options": "i"}},
        ]
    docs = await db.listings.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return docs


@admin.delete("/listings/{listing_id}")
async def admin_delete_listing(listing_id: str):
    res = await db.listings.update_one({"id": listing_id}, {"$set": {"status": "removed"}})
    if not res.matched_count:
        raise HTTPException(404, "Anúncio não encontrado")
    return {"ok": True}


@admin.get("/messages")
async def admin_list_messages(q: str = "", limit: int = 200):
    query: dict = {}
    if q:
        query["$or"] = [
            {"content": {"$regex": q, "$options": "i"}},
            {"from_user_name": {"$regex": q, "$options": "i"}},
            {"to_user_name": {"$regex": q, "$options": "i"}},
            {"listing_title": {"$regex": q, "$options": "i"}},
        ]
    docs = await db.messages.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return docs


@admin.get("/reports")
async def admin_list_reports(status: str = "", limit: int = 200):
    query: dict = {}
    if status:
        query["status"] = status
    docs = await db.reports.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return docs


@admin.patch("/reports/{report_id}")
async def admin_update_report(report_id: str, payload: StatusUpdate):
    if payload.status not in ("pending", "reviewing", "resolved", "dismissed"):
        raise HTTPException(400, "Status inválido")
    res = await db.reports.update_one(
        {"id": report_id},
        {"$set": {"status": payload.status, "updated_at": to_iso(now_utc())}},
    )
    if not res.matched_count:
        raise HTTPException(404, "Denúncia não encontrada")
    return {"ok": True}


@admin.get("/support")
async def admin_list_support(status: str = "", limit: int = 200):
    query: dict = {}
    if status:
        query["status"] = status
    docs = await db.support_tickets.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return docs


@admin.post("/support/{ticket_id}/reply")
async def admin_reply_support(ticket_id: str, payload: SupportReplyIn, user: dict = Depends(require_admin)):
    ticket = await db.support_tickets.find_one({"id": ticket_id})
    if not ticket:
        raise HTTPException(404, "Chamado não encontrado")
    reply = {
        "id": str(uuid.uuid4()),
        "by": "admin",
        "by_name": user.get("name", "Administrador"),
        "message": payload.message,
        "created_at": to_iso(now_utc()),
    }
    await db.support_tickets.update_one(
        {"id": ticket_id},
        {
            "$push": {"replies": reply},
            "$set": {"status": "in_progress", "updated_at": to_iso(now_utc())},
        },
    )
    return reply


@admin.patch("/support/{ticket_id}")
async def admin_update_support(ticket_id: str, payload: StatusUpdate):
    if payload.status not in ("open", "in_progress", "resolved", "closed"):
        raise HTTPException(400, "Status inválido")
    res = await db.support_tickets.update_one(
        {"id": ticket_id},
        {"$set": {"status": payload.status, "updated_at": to_iso(now_utc())}},
    )
    if not res.matched_count:
        raise HTTPException(404, "Chamado não encontrado")
    return {"ok": True}


# ---------- PDF Export ----------
@admin.get("/export/pdf")
async def export_report_pdf():
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title="Relatório B-Livre",
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "title", parent=styles["Title"], textColor=colors.HexColor("#10b981"), fontSize=22, spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        "sub", parent=styles["Normal"], textColor=colors.HexColor("#6b7280"), fontSize=10, spaceAfter=18
    )
    h2 = ParagraphStyle("h2", parent=styles["Heading2"], textColor=colors.HexColor("#111827"), spaceAfter=6)

    story = []
    story.append(Paragraph("Relatório B-Livre", title_style))
    story.append(Paragraph(
        f"Gerado em {now_utc().strftime('%d/%m/%Y %H:%M UTC')} • Painel administrativo",
        subtitle_style,
    ))

    # KPIs
    threshold = online_threshold_iso()
    today_start = to_iso(now_utc().replace(hour=0, minute=0, second=0, microsecond=0))
    kpis = [
        ["Indicador", "Total"],
        ["Usuários", str(await db.users.count_documents({"role": "user"}))],
        ["Usuários online (5 min)", str(await db.users.count_documents({"role": "user", "last_seen": {"$gte": threshold}}))],
        ["Anúncios ativos", str(await db.listings.count_documents({"status": "active"}))],
        ["Anúncios removidos", str(await db.listings.count_documents({"status": "removed"}))],
        ["Mensagens (total)", str(await db.messages.count_documents({}))],
        ["Mensagens hoje", str(await db.messages.count_documents({"created_at": {"$gte": today_start}}))],
        ["Visualizações", str(await db.listing_views.count_documents({}))],
        ["Interesses", str(await db.listing_interests.count_documents({}))],
        ["Denúncias pendentes", str(await db.reports.count_documents({"status": "pending"}))],
        ["Suporte aberto", str(await db.support_tickets.count_documents({"status": {"$in": ["open", "in_progress"]}}))],
    ]
    story.append(Paragraph("Indicadores principais", h2))
    t = Table(kpis, colWidths=[10 * cm, 5 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#10b981")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f9fafb"), colors.white]),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e5e7eb")),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 16))

    # Recent listings
    story.append(Paragraph("Anúncios recentes", h2))
    recent_listings = await db.listings.find({}, {"_id": 0}).sort("created_at", -1).to_list(20)
    if recent_listings:
        rows = [["Título", "Categoria", "Autor", "Status", "Criado em"]]
        for item in recent_listings:
            rows.append([
                (item.get("title") or "")[:40],
                item.get("category") or "-",
                (item.get("owner_name") or "-")[:20],
                item.get("status") or "-",
                (item.get("created_at") or "")[:10],
            ])
        t2 = Table(rows, colWidths=[5.5 * cm, 2.5 * cm, 3 * cm, 2 * cm, 2.5 * cm])
        t2.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f9fafb"), colors.white]),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e5e7eb")),
        ]))
        story.append(t2)
    else:
        story.append(Paragraph("Nenhum anúncio no período.", styles["Italic"]))
    story.append(Spacer(1, 16))

    # Pending reports
    story.append(Paragraph("Denúncias pendentes", h2))
    rep = await db.reports.find({"status": "pending"}, {"_id": 0}).sort("created_at", -1).to_list(20)
    if rep:
        rows = [["Tipo", "Motivo", "Reportado por", "Criado em"]]
        for r in rep:
            rows.append([
                r.get("target_type") or "-",
                (r.get("reason") or "")[:50],
                (r.get("reporter_name") or "-")[:20],
                (r.get("created_at") or "")[:16],
            ])
        t3 = Table(rows, colWidths=[2.5 * cm, 7 * cm, 3.5 * cm, 3 * cm])
        t3.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#dc2626")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#fef2f2"), colors.white]),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#fecaca")),
        ]))
        story.append(t3)
    else:
        story.append(Paragraph("Nenhuma denúncia pendente.", styles["Italic"]))

    story.append(PageBreak())

    # Open support tickets
    story.append(Paragraph("Chamados de suporte abertos", h2))
    sup = await db.support_tickets.find({"status": {"$in": ["open", "in_progress"]}}, {"_id": 0}).sort("created_at", -1).to_list(20)
    if sup:
        rows = [["Assunto", "Categoria", "Usuário", "Status", "Criado em"]]
        for s in sup:
            rows.append([
                (s.get("subject") or "")[:35],
                s.get("category") or "-",
                (s.get("user_name") or "-")[:18],
                s.get("status") or "-",
                (s.get("created_at") or "")[:10],
            ])
        t4 = Table(rows, colWidths=[5 * cm, 2.5 * cm, 3 * cm, 2.5 * cm, 2.5 * cm])
        t4.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0ea5e9")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f0f9ff"), colors.white]),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#bae6fd")),
        ]))
        story.append(t4)
    else:
        story.append(Paragraph("Nenhum chamado em aberto.", styles["Italic"]))

    doc.build(story)
    buffer.seek(0)
    filename = f"relatorio-blivre-{now_utc().strftime('%Y%m%d-%H%M')}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ---------- Health ----------
@api.get("/")
async def root():
    return {"service": "B-Livre ADM API", "status": "ok"}


# Mount routers
api.include_router(admin)
app.include_router(api)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
