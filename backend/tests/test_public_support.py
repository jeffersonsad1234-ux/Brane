"""
Backend tests for B Livre 'Esqueci minha conta' / 'Falar com suporte' feature.
Scope: POST /api/public/support (no auth) + GET /api/admin/support (admin token).
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@brane.com"
ADMIN_PASSWORD = "Admin123!@#"


@pytest.fixture(scope="session")
def admin_headers():
    r = requests.post(f"{API}/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
                      timeout=20)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    token = r.json().get("token")
    assert token, f"no token in admin login response: {r.json()}"
    return {"Authorization": f"Bearer {token}"}


# ---------- POSITIVE CASES ----------

class TestPublicSupportPositive:
    """Public support endpoint without auth."""

    def test_endpoint_no_auth_required(self):
        # No Authorization header at all
        suffix = uuid.uuid4().hex[:8]
        payload = {
            "name": f"TEST_user_{suffix}",
            "email": f"test_{suffix}@brane-test.com",
            "message": "Mensagem de teste de suporte público (sem auth)",
            "category": "support",
        }
        r = requests.post(f"{API}/public/support", json=payload, timeout=20)
        assert r.status_code == 200, f"got {r.status_code}: {r.text}"
        data = r.json()
        assert data.get("success") is True
        assert "message_id" in data
        assert data["message_id"].startswith("pub_")

    def test_recovery_category_subject(self, admin_headers):
        suffix = uuid.uuid4().hex[:8]
        email = f"test_recovery_{suffix}@brane-test.com"
        payload = {
            "name": f"TEST_recovery_{suffix}",
            "email": email,
            "message": "Esqueci minha senha",
            "category": "recovery",
        }
        r = requests.post(f"{API}/public/support", json=payload, timeout=20)
        assert r.status_code == 200, r.text
        msg_id = r.json()["message_id"]

        # verify on admin list (subject = 'Recuperação de conta/senha', is_public=true)
        r2 = requests.get(f"{API}/admin/support", headers=admin_headers,
                          params={"limit": 100}, timeout=20)
        assert r2.status_code == 200, r2.text
        msgs = r2.json().get("messages", [])
        match = next((m for m in msgs if m.get("message_id") == msg_id), None)
        assert match is not None, f"created ticket {msg_id} not in admin list"
        assert match.get("subject") == "Recuperação de conta/senha"
        assert match.get("category") == "recovery"
        assert match.get("is_public") is True
        assert match.get("user_name") == payload["name"]
        assert match.get("user_email") == email
        assert match.get("status") == "open"

    def test_support_category_subject(self, admin_headers):
        suffix = uuid.uuid4().hex[:8]
        payload = {
            "name": f"TEST_support_{suffix}",
            "email": f"test_support_{suffix}@brane-test.com",
            "message": "Preciso de ajuda geral",
            "category": "support",
        }
        r = requests.post(f"{API}/public/support", json=payload, timeout=20)
        assert r.status_code == 200, r.text
        msg_id = r.json()["message_id"]

        r2 = requests.get(f"{API}/admin/support", headers=admin_headers,
                          params={"limit": 100}, timeout=20)
        assert r2.status_code == 200
        msgs = r2.json().get("messages", [])
        match = next((m for m in msgs if m.get("message_id") == msg_id), None)
        assert match is not None
        assert match.get("subject") == "Suporte público"
        assert match.get("category") == "support"
        assert match.get("is_public") is True

    def test_default_category_when_omitted(self, admin_headers):
        # category field omitted -> default 'support'
        suffix = uuid.uuid4().hex[:8]
        payload = {
            "name": f"TEST_default_{suffix}",
            "email": f"test_default_{suffix}@brane-test.com",
            "message": "Sem categoria informada",
        }
        r = requests.post(f"{API}/public/support", json=payload, timeout=20)
        assert r.status_code == 200, r.text
        msg_id = r.json()["message_id"]

        r2 = requests.get(f"{API}/admin/support", headers=admin_headers,
                          params={"limit": 100}, timeout=20)
        msgs = r2.json().get("messages", [])
        match = next((m for m in msgs if m.get("message_id") == msg_id), None)
        assert match is not None
        assert match.get("subject") == "Suporte público"


# ---------- VALIDATION CASES ----------

class TestPublicSupportValidation:

    def test_invalid_email_no_at(self):
        payload = {
            "name": "TEST_invalid_email",
            "email": "not-an-email",
            "message": "Teste de email inválido",
            "category": "support",
        }
        r = requests.post(f"{API}/public/support", json=payload, timeout=15)
        assert r.status_code == 400, f"got {r.status_code}: {r.text}"

    def test_empty_name(self):
        payload = {
            "name": "   ",
            "email": "valid@brane-test.com",
            "message": "msg",
            "category": "support",
        }
        r = requests.post(f"{API}/public/support", json=payload, timeout=15)
        assert r.status_code == 400, f"got {r.status_code}: {r.text}"

    def test_empty_message(self):
        payload = {
            "name": "TEST_empty",
            "email": "valid@brane-test.com",
            "message": "",
            "category": "support",
        }
        r = requests.post(f"{API}/public/support", json=payload, timeout=15)
        # Pydantic may 422 for empty string, or app validates 400; accept both as failure
        assert r.status_code in (400, 422), f"got {r.status_code}: {r.text}"

    def test_missing_required_field(self):
        # Missing email field entirely -> Pydantic 422
        payload = {"name": "x", "message": "y"}
        r = requests.post(f"{API}/public/support", json=payload, timeout=15)
        assert r.status_code in (400, 422), f"got {r.status_code}: {r.text}"


# ---------- ADMIN LIST AUTH ----------

class TestAdminSupportAuth:

    def test_admin_support_requires_auth(self):
        r = requests.get(f"{API}/admin/support", timeout=15)
        assert r.status_code in (401, 403)

    def test_admin_support_returns_public_tickets(self, admin_headers):
        # create a public ticket and ensure it appears with required fields
        suffix = uuid.uuid4().hex[:8]
        r = requests.post(f"{API}/public/support", json={
            "name": f"TEST_listcheck_{suffix}",
            "email": f"listcheck_{suffix}@brane-test.com",
            "message": "validate fields",
            "category": "recovery",
        }, timeout=20)
        assert r.status_code == 200
        mid = r.json()["message_id"]

        r2 = requests.get(f"{API}/admin/support", headers=admin_headers,
                          params={"limit": 100}, timeout=20)
        assert r2.status_code == 200
        body = r2.json()
        assert "messages" in body and isinstance(body["messages"], list)
        match = next((m for m in body["messages"] if m.get("message_id") == mid), None)
        assert match is not None
        for key in ("user_name", "user_email", "subject", "category", "is_public", "status"):
            assert key in match, f"missing key '{key}' in admin support row: {match}"
