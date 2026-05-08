"""B-Livre ADM end-to-end backend tests.

Covers:
- Auth (login, /me, heartbeat, invalid creds, 401/403)
- Public endpoints (listings/messages/reports/support, view/interest counters)
- Admin: stats, notifications, users CRUD, listings, messages, reports, support, PDF export
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@blivre.com"
ADMIN_PW = "admin123"
USER_EMAIL = "maria@blivre.com"
USER_PW = "senha123"


# ---------- Fixtures ----------
@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PW})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["user"]["role"] == "admin"
    return data["token"]


@pytest.fixture(scope="session")
def user_token(s):
    r = s.post(f"{API}/auth/login", json={"email": USER_EMAIL, "password": USER_PW})
    assert r.status_code == 200, f"user login failed: {r.status_code} {r.text}"
    return r.json()["token"]


def H(tok):
    return {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}


# ---------- Auth ----------
class TestAuth:
    def test_login_admin(self, s):
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PW})
        assert r.status_code == 200
        d = r.json()
        assert "token" in d and len(d["token"]) > 10
        assert d["user"]["role"] == "admin"
        assert d["user"]["email"] == ADMIN_EMAIL

    def test_login_invalid(self, s):
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrongpass"})
        assert r.status_code == 401

    def test_me_with_token(self, s, admin_token):
        r = s.get(f"{API}/auth/me", headers=H(admin_token))
        assert r.status_code == 200
        u = r.json()
        assert u["email"] == ADMIN_EMAIL
        assert "password_hash" not in u
        assert "_id" not in u

    def test_me_without_token(self, s):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_heartbeat(self, s, user_token):
        r = s.post(f"{API}/auth/heartbeat", headers=H(user_token))
        assert r.status_code == 200
        assert r.json().get("ok") is True


# ---------- Admin RBAC ----------
class TestAdminRBAC:
    def test_admin_no_token(self):
        r = requests.get(f"{API}/admin/blivre/stats")
        assert r.status_code == 401

    def test_admin_with_user_token(self, s, user_token):
        r = s.get(f"{API}/admin/blivre/stats", headers=H(user_token))
        assert r.status_code == 403


# ---------- Stats ----------
class TestAdminStats:
    def test_stats_structure(self, s, admin_token):
        r = s.get(f"{API}/admin/blivre/stats", headers=H(admin_token))
        assert r.status_code == 200
        d = r.json()
        for k in ["users", "listings", "messages", "reports", "support", "views", "interests", "series_7d", "categories"]:
            assert k in d, f"missing {k}"
        assert {"total", "active", "suspended", "online"}.issubset(d["users"].keys())
        assert {"total", "active", "removed"}.issubset(d["listings"].keys())
        assert {"total", "today"}.issubset(d["messages"].keys())
        assert {"pending", "total"}.issubset(d["reports"].keys())
        assert {"open", "total"}.issubset(d["support"].keys())
        assert isinstance(d["series_7d"], list) and len(d["series_7d"]) == 7
        for entry in d["series_7d"]:
            assert {"date", "users", "listings", "messages", "views"}.issubset(entry.keys())
        # real data sanity
        assert d["users"]["total"] >= 1
        assert d["listings"]["total"] >= 1

    def test_notifications(self, s, admin_token):
        r = s.get(f"{API}/admin/blivre/notifications", headers=H(admin_token))
        assert r.status_code == 200
        d = r.json()
        for k in ["pending_reports", "open_support", "recent", "checked_at"]:
            assert k in d
        for k in ["reports_5m", "support_5m", "messages_5m"]:
            assert k in d["recent"]


# ---------- Users ----------
class TestAdminUsers:
    def test_list_users_with_extras(self, s, admin_token):
        r = s.get(f"{API}/admin/blivre/users", headers=H(admin_token))
        assert r.status_code == 200
        users = r.json()
        assert isinstance(users, list) and len(users) >= 1
        u = users[0]
        assert "listings_count" in u
        assert "online" in u and isinstance(u["online"], bool)
        assert "password_hash" not in u

    def test_filter_status_active(self, s, admin_token):
        r = s.get(f"{API}/admin/blivre/users?status=active", headers=H(admin_token))
        assert r.status_code == 200
        for u in r.json():
            assert u["status"] == "active"

    def test_filter_q(self, s, admin_token):
        r = s.get(f"{API}/admin/blivre/users?q=maria", headers=H(admin_token))
        assert r.status_code == 200
        names = [u["name"].lower() + u["email"].lower() for u in r.json()]
        assert any("maria" in n for n in names)

    def test_suspend_then_reactivate(self, s, admin_token):
        # pick a non-admin user (lucas)
        r = s.get(f"{API}/admin/blivre/users?q=lucas", headers=H(admin_token))
        users = r.json()
        assert users, "lucas user not found"
        uid = users[0]["id"]
        # count active listings before
        rl = s.get(f"{API}/admin/blivre/listings?status=active", headers=H(admin_token))
        before_active = [l for l in rl.json() if l.get("owner_id") == uid]

        # suspend
        r = s.patch(f"{API}/admin/blivre/users/{uid}", headers=H(admin_token), json={"status": "suspended"})
        assert r.status_code == 200
        # verify
        r = s.get(f"{API}/admin/blivre/users?q=lucas", headers=H(admin_token))
        assert r.json()[0]["status"] == "suspended"
        # listings of suspended user are removed
        rl = s.get(f"{API}/admin/blivre/listings?status=active", headers=H(admin_token))
        after_active = [l for l in rl.json() if l.get("owner_id") == uid]
        assert len(after_active) == 0, "suspended user's listings should be hidden"
        # reactivate
        r = s.patch(f"{API}/admin/blivre/users/{uid}", headers=H(admin_token), json={"status": "active"})
        assert r.status_code == 200
        r = s.get(f"{API}/admin/blivre/users?q=lucas", headers=H(admin_token))
        assert r.json()[0]["status"] == "active"
        # restore listings (set back to active so dataset stays consistent)
        if before_active:
            # we don't have a re-activate listing endpoint, so leave them removed; flag in report
            pass

    def test_invalid_status(self, s, admin_token):
        r = s.get(f"{API}/admin/blivre/users?q=ana", headers=H(admin_token))
        uid = r.json()[0]["id"]
        r = s.patch(f"{API}/admin/blivre/users/{uid}", headers=H(admin_token), json={"status": "weirdo"})
        assert r.status_code == 400

    def test_create_then_delete_user(self, s, admin_token):
        # register a temporary user
        payload = {"name": "TEST_TempUser", "email": f"test_temp_{int(time.time())}@blivre.com", "password": "senha123"}
        r = requests.post(f"{API}/auth/register", json=payload)
        assert r.status_code == 200
        uid = r.json()["user"]["id"]
        # create a listing for this user
        utok = r.json()["token"]
        r2 = requests.post(f"{API}/listings", headers=H(utok), json={"title": "TEST_l", "description": "x"})
        lid = r2.json()["id"]
        # delete via admin
        r = s.delete(f"{API}/admin/blivre/users/{uid}", headers=H(admin_token))
        assert r.status_code == 200
        # listing should be deleted too
        r = s.get(f"{API}/admin/blivre/listings", headers=H(admin_token))
        ids = [l["id"] for l in r.json()]
        assert lid not in ids


# ---------- Listings ----------
class TestAdminListings:
    def test_list_listings(self, s, admin_token):
        r = s.get(f"{API}/admin/blivre/listings", headers=H(admin_token))
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list) and len(items) >= 1
        assert "views" in items[0] and "interests" in items[0]

    def test_filter_active(self, s, admin_token):
        r = s.get(f"{API}/admin/blivre/listings?status=active", headers=H(admin_token))
        assert r.status_code == 200
        for it in r.json():
            assert it["status"] == "active"

    def test_view_and_interest_counters(self, s, user_token, admin_token):
        # create a listing
        r = requests.post(f"{API}/listings", headers=H(user_token),
                          json={"title": "TEST_counter", "description": "d", "category": "geral"})
        assert r.status_code == 200
        lid = r.json()["id"]
        # view
        r1 = requests.post(f"{API}/listings/{lid}/view")
        assert r1.status_code == 200
        # interest
        r2 = requests.post(f"{API}/listings/{lid}/interest", headers=H(user_token))
        assert r2.status_code == 200
        # verify counts
        r3 = s.get(f"{API}/admin/blivre/listings?q=TEST_counter", headers=H(admin_token))
        items = [l for l in r3.json() if l["id"] == lid]
        assert items
        assert items[0]["views"] >= 1
        assert items[0]["interests"] >= 1
        # cleanup
        s.delete(f"{API}/admin/blivre/listings/{lid}", headers=H(admin_token))

    def test_delete_listing_marks_removed(self, s, user_token, admin_token):
        r = requests.post(f"{API}/listings", headers=H(user_token),
                          json={"title": "TEST_del", "description": "d"})
        lid = r.json()["id"]
        r = s.delete(f"{API}/admin/blivre/listings/{lid}", headers=H(admin_token))
        assert r.status_code == 200
        r = s.get(f"{API}/admin/blivre/listings?q=TEST_del", headers=H(admin_token))
        items = [l for l in r.json() if l["id"] == lid]
        assert items and items[0]["status"] == "removed"


# ---------- Messages ----------
class TestAdminMessages:
    def test_list_messages(self, s, admin_token):
        r = s.get(f"{API}/admin/blivre/messages", headers=H(admin_token))
        assert r.status_code == 200
        msgs = r.json()
        assert isinstance(msgs, list)
        if msgs:
            for k in ["from_user_name", "to_user_name", "listing_title", "content"]:
                assert k in msgs[0]


# ---------- Reports ----------
class TestAdminReports:
    def test_list_and_filter(self, s, admin_token):
        r = s.get(f"{API}/admin/blivre/reports", headers=H(admin_token))
        assert r.status_code == 200
        r2 = s.get(f"{API}/admin/blivre/reports?status=pending", headers=H(admin_token))
        assert r2.status_code == 200
        for rep in r2.json():
            assert rep["status"] == "pending"

    def test_update_status(self, s, admin_token):
        r = s.get(f"{API}/admin/blivre/reports", headers=H(admin_token))
        items = r.json()
        if not items:
            pytest.skip("no reports to update")
        rid = items[0]["id"]
        old = items[0]["status"]
        r = s.patch(f"{API}/admin/blivre/reports/{rid}", headers=H(admin_token), json={"status": "reviewing"})
        assert r.status_code == 200
        # invalid
        r = s.patch(f"{API}/admin/blivre/reports/{rid}", headers=H(admin_token), json={"status": "weirdo"})
        assert r.status_code == 400
        # restore
        s.patch(f"{API}/admin/blivre/reports/{rid}", headers=H(admin_token), json={"status": old})


# ---------- Support ----------
class TestAdminSupport:
    def test_list_support(self, s, admin_token):
        r = s.get(f"{API}/admin/blivre/support", headers=H(admin_token))
        assert r.status_code == 200
        items = r.json()
        if items:
            for k in ["user_name", "user_email", "replies"]:
                assert k in items[0]
        r2 = s.get(f"{API}/admin/blivre/support?status=open", headers=H(admin_token))
        for it in r2.json():
            assert it["status"] == "open"

    def test_reply_and_status_flow(self, s, admin_token, user_token):
        # create a fresh ticket
        r = requests.post(f"{API}/support", headers=H(user_token),
                          json={"subject": "TEST_subject", "message": "help me", "category": "geral"})
        assert r.status_code == 200
        tid = r.json()["id"]
        # reply
        r = s.post(f"{API}/admin/blivre/support/{tid}/reply", headers=H(admin_token),
                   json={"message": "Olá, vamos resolver"})
        assert r.status_code == 200
        body = r.json()
        assert body["by"] == "admin"
        # verify replies pushed and status -> in_progress
        r = s.get(f"{API}/admin/blivre/support", headers=H(admin_token))
        item = next((x for x in r.json() if x["id"] == tid), None)
        assert item is not None
        assert len(item["replies"]) >= 1
        assert item["status"] == "in_progress"
        # patch status to resolved
        r = s.patch(f"{API}/admin/blivre/support/{tid}", headers=H(admin_token), json={"status": "resolved"})
        assert r.status_code == 200
        # invalid status
        r = s.patch(f"{API}/admin/blivre/support/{tid}", headers=H(admin_token), json={"status": "boom"})
        assert r.status_code == 400


# ---------- PDF Export ----------
class TestPdfExport:
    def test_pdf(self, s, admin_token):
        r = s.get(f"{API}/admin/blivre/export/pdf", headers=H(admin_token))
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("application/pdf")
        assert "attachment" in r.headers.get("content-disposition", "").lower()
        assert r.content[:5] == b"%PDF-"
