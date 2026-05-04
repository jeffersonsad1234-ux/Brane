"""
Backend tests for BRANE marketplace iteration 2.
Focus: admin wallets, ads positions incl. footer, promotion plans CRUD,
seller subscribe-plan, admin approve/reject subscriptions, saved-address.
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://social-links-config.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@brane.com"
ADMIN_PASSWORD = "Admin123!"


# ---------- fixtures ----------
@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


def _signup_user(name_prefix="TEST_seller"):
    suffix = uuid.uuid4().hex[:8]
    email = f"{name_prefix.lower()}_{suffix}@brane-test.com"
    payload = {"name": f"{name_prefix} {suffix}", "email": email, "password": "Pass123!"}
    r = requests.post(f"{API}/auth/register", json=payload, timeout=20)
    assert r.status_code in (200, 201), f"register failed {r.status_code} {r.text}"
    data = r.json()
    return {"token": data.get("token"), "user": data.get("user"), "email": email}


@pytest.fixture(scope="session")
def seller_ctx():
    ctx = _signup_user("TEST_seller")
    headers = {"Authorization": f"Bearer {ctx['token']}"}
    # switch role to seller
    r = requests.put(f"{API}/users/role", headers=headers, json={"role": "seller"}, timeout=15)
    assert r.status_code in (200, 201), f"role switch failed: {r.status_code} {r.text}"
    ctx["headers"] = headers
    return ctx


# ---------- health ----------
def test_health():
    r = requests.get(f"{API}/", timeout=10)
    # some apps have /api health -- fallback root
    assert r.status_code in (200, 404)


# ---------- admin wallets (escrow fix) ----------
class TestAdminWallets:
    def test_admin_wallets_requires_auth(self):
        r = requests.get(f"{API}/admin/wallets", timeout=15)
        assert r.status_code in (401, 403)

    def test_admin_wallets_list(self, admin_headers):
        r = requests.get(f"{API}/admin/wallets", headers=admin_headers, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "wallets" in data
        assert isinstance(data["wallets"], list)
        assert len(data["wallets"]) >= 1
        w = data["wallets"][0]
        for key in ("user_id", "name", "email", "role", "available", "held", "total"):
            assert key in w, f"missing {key} in wallet row"
        assert isinstance(w["available"], (int, float))
        assert isinstance(w["held"], (int, float))


# ---------- ads: footer position ----------
class TestAdsFooter:
    ad_id = None

    def test_create_ad_footer(self, admin_headers):
        payload = {
            "title": "TEST_footer_ad",
            "image": "https://via.placeholder.com/800x200.png",
            "link": "https://example.com",
            "position": "footer",
        }
        r = requests.post(f"{API}/ads", headers=admin_headers, json=payload, timeout=20)
        assert r.status_code in (200, 201), r.text
        data = r.json()
        assert data["position"] == "footer"
        assert data["active"] is True  # admin ads active immediately
        assert "ad_id" in data
        TestAdsFooter.ad_id = data["ad_id"]

    def test_list_ads_by_footer_position(self):
        r = requests.get(f"{API}/ads", params={"position": "footer"}, timeout=15)
        assert r.status_code == 200
        ads = r.json().get("ads", [])
        assert any(a.get("ad_id") == TestAdsFooter.ad_id for a in ads), "created footer ad not found"

    def test_list_ads_top_position(self, admin_headers):
        # create one top ad too, then list
        payload = {"title": "TEST_top_ad", "image": "https://via.placeholder.com/800x200.png",
                   "link": "https://example.com", "position": "top"}
        r = requests.post(f"{API}/ads", headers=admin_headers, json=payload, timeout=20)
        assert r.status_code in (200, 201)
        top_id = r.json()["ad_id"]
        r2 = requests.get(f"{API}/ads", params={"position": "top"}, timeout=15)
        assert r2.status_code == 200
        assert any(a.get("ad_id") == top_id for a in r2.json().get("ads", []))

    def test_cleanup_footer_ad(self, admin_headers):
        if TestAdsFooter.ad_id:
            r = requests.delete(f"{API}/admin/ads/{TestAdsFooter.ad_id}", headers=admin_headers, timeout=15)
            assert r.status_code in (200, 204)


# ---------- promotion plans CRUD ----------
class TestPromotionPlans:
    plan_id = None

    def test_create_plan_requires_admin(self):
        r = requests.post(f"{API}/admin/promotion-plans", json={"name": "x", "price": 10, "duration_days": 30}, timeout=15)
        assert r.status_code in (401, 403)

    def test_create_plan(self, admin_headers):
        payload = {
            "name": "TEST_plan_basic",
            "price": 29.9,
            "duration_days": 30,
            "description": "Plano de testes",
            "benefits": {"home_highlight": True, "footer_banner": True, "search_boost": False, "priority_support": False},
        }
        r = requests.post(f"{API}/admin/promotion-plans", headers=admin_headers, json=payload, timeout=20)
        assert r.status_code in (200, 201), r.text
        data = r.json()
        assert data["name"] == payload["name"]
        assert float(data["price"]) == pytest.approx(29.9)
        assert "plan_id" in data
        TestPromotionPlans.plan_id = data["plan_id"]

    def test_public_list_plans(self):
        r = requests.get(f"{API}/promotion-plans", timeout=15)
        assert r.status_code == 200
        plans = r.json().get("plans", [])
        assert any(p.get("plan_id") == TestPromotionPlans.plan_id for p in plans)

    def test_admin_list_plans(self, admin_headers):
        r = requests.get(f"{API}/admin/promotion-plans", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        plans = r.json().get("plans", [])
        assert any(p.get("plan_id") == TestPromotionPlans.plan_id for p in plans)

    def test_update_plan(self, admin_headers):
        pid = TestPromotionPlans.plan_id
        r = requests.put(f"{API}/admin/promotion-plans/{pid}", headers=admin_headers,
                         json={"price": 49.9, "description": "Atualizado"}, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert float(data["price"]) == pytest.approx(49.9)
        assert data["description"] == "Atualizado"


# ---------- seller subscribe to plan ----------
class TestSellerSubscribe:
    pending_sub_id = None

    def test_subscribe_wallet_insufficient(self, seller_ctx):
        pid = TestPromotionPlans.plan_id
        assert pid, "plan must exist"
        r = requests.post(f"{API}/seller/subscribe-plan",
                          headers=seller_ctx["headers"],
                          json={"plan_id": pid, "payment_method": "wallet"}, timeout=20)
        # fresh user wallet has 0 balance -> should fail with 400
        assert r.status_code == 400, f"expected 400 got {r.status_code}: {r.text}"

    def test_subscribe_pix_pending(self, seller_ctx):
        pid = TestPromotionPlans.plan_id
        r = requests.post(f"{API}/seller/subscribe-plan",
                          headers=seller_ctx["headers"],
                          json={"plan_id": pid, "payment_method": "pix"}, timeout=20)
        assert r.status_code in (200, 201), r.text
        data = r.json()
        assert data["status"] == "pending"
        assert data["payment_method"] == "pix"
        assert "subscription_id" in data
        TestSellerSubscribe.pending_sub_id = data["subscription_id"]

    def test_seller_list_subscriptions(self, seller_ctx):
        r = requests.get(f"{API}/seller/subscriptions", headers=seller_ctx["headers"], timeout=15)
        assert r.status_code == 200
        subs = r.json().get("subscriptions", [])
        assert any(s.get("subscription_id") == TestSellerSubscribe.pending_sub_id for s in subs)

    def test_admin_list_subscriptions(self, admin_headers):
        r = requests.get(f"{API}/admin/subscriptions", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        subs = r.json().get("subscriptions", [])
        assert any(s.get("subscription_id") == TestSellerSubscribe.pending_sub_id for s in subs)

    def test_admin_approve_subscription(self, admin_headers):
        sid = TestSellerSubscribe.pending_sub_id
        r = requests.put(f"{API}/admin/subscriptions/{sid}/approve", headers=admin_headers, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "active"
        assert data.get("expires_at") is not None

    def test_admin_reject_subscription(self, seller_ctx, admin_headers):
        # create another pending subscription then reject
        pid = TestPromotionPlans.plan_id
        r = requests.post(f"{API}/seller/subscribe-plan",
                          headers=seller_ctx["headers"],
                          json={"plan_id": pid, "payment_method": "pix"}, timeout=20)
        assert r.status_code in (200, 201)
        sid = r.json()["subscription_id"]
        r2 = requests.put(f"{API}/admin/subscriptions/{sid}/reject", headers=admin_headers, timeout=15)
        assert r2.status_code == 200
        r3 = requests.get(f"{API}/admin/subscriptions", headers=admin_headers, timeout=15)
        sub = next((s for s in r3.json().get("subscriptions", []) if s.get("subscription_id") == sid), None)
        assert sub is not None
        assert sub["status"] == "rejected"


# ---------- cleanup plan ----------
class TestPromotionPlansCleanup:
    def test_delete_plan(self, admin_headers):
        pid = TestPromotionPlans.plan_id
        if not pid:
            pytest.skip("no plan to delete")
        r = requests.delete(f"{API}/admin/promotion-plans/{pid}", headers=admin_headers, timeout=15)
        assert r.status_code == 200


# ---------- saved address ----------
class TestSavedAddress:
    def test_put_and_get_saved_address(self, seller_ctx):
        payload = {
            "name": "TEST User", "cpf": "00000000000", "phone": "11999999999",
            "street": "Rua X", "number": "100", "complement": "apto 1",
            "neighborhood": "Centro", "city": "SP", "state": "SP", "zip_code": "01000000",
        }
        r = requests.put(f"{API}/users/saved-address", headers=seller_ctx["headers"], json=payload, timeout=15)
        assert r.status_code == 200
        assert r.json().get("address", {}).get("city") == "SP"
        r2 = requests.get(f"{API}/users/saved-address", headers=seller_ctx["headers"], timeout=15)
        assert r2.status_code == 200
        addr = r2.json().get("address")
        assert addr and addr.get("city") == "SP"


# ---------- theme ----------
class TestAdminTheme:
    def test_get_theme(self, admin_headers):
        r = requests.get(f"{API}/admin/theme", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), dict)

    def test_update_theme(self, admin_headers):
        payload = {"title_color": "#D4A24C", "nav_link_color": "#FFFFFF", "category_text_color": "#C9B37A"}
        r = requests.put(f"{API}/admin/theme", headers=admin_headers, json=payload, timeout=15)
        assert r.status_code == 200
        # verify persistence via GET
        r2 = requests.get(f"{API}/admin/theme", headers=admin_headers, timeout=15)
        assert r2.status_code == 200
        data = r2.json()
        theme = data.get("theme") if isinstance(data, dict) and "theme" in data else data
        assert theme.get("title_color") == "#D4A24C", f"theme did not persist: {theme}"
        assert theme.get("nav_link_color") == "#FFFFFF"
        assert theme.get("category_text_color") == "#C9B37A"
