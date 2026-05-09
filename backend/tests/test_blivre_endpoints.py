"""
B Livre endpoint tests for iteration 5 - validates final pre-launch bug fixes:
- /api/social/favorites GET + toggle persistent
- /api/social/messages GET + POST (creates message + notification)
- /api/social/stats GET (views/interests/my_ads)
- /api/notifications GET
- /api/social/posts POST (criar anuncio)
- /api/admin/reports/{id}/respond, /resolve, /ignore, /block_ad, /block_user
- /api/admin/support/{id}/reply
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://blivre-quality-check.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@brane.com"
ADMIN_PASSWORD = "Admin123!@#"


# ---------- helpers / fixtures ----------
@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    tok = r.json().get("token")
    assert tok
    return tok


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


def _signup_user(prefix="TEST_blivre"):
    suffix = uuid.uuid4().hex[:8]
    email = f"{prefix.lower()}_{suffix}@brane-test.com"
    r = requests.post(f"{API}/auth/register",
                      json={"name": f"{prefix} {suffix}", "email": email, "password": "Pass123!"},
                      timeout=20)
    assert r.status_code in (200, 201), f"register failed: {r.status_code} {r.text}"
    data = r.json()
    return {"token": data["token"], "user": data["user"], "email": email,
            "headers": {"Authorization": f"Bearer {data['token']}", "Content-Type": "application/json"}}


@pytest.fixture(scope="session")
def user_a():
    return _signup_user("TEST_userA")


@pytest.fixture(scope="session")
def user_b():
    return _signup_user("TEST_userB")


@pytest.fixture(scope="session")
def post_by_a(user_a):
    payload = {
        "title": "TEST_post_blivre_iter5",
        "content": "Anuncio de teste B Livre iter5",
        "price": "99.90",
        "category": "outros",
        "media": [],
    }
    r = requests.post(f"{API}/social/posts", headers=user_a["headers"], json=payload, timeout=20)
    assert r.status_code in (200, 201), f"create post failed: {r.status_code} {r.text}"
    data = r.json()
    pid = data.get("post_id") or data.get("id")
    assert pid, f"no post id returned: {data}"
    return {"post_id": pid, "data": data}


# ---------- /api/social/posts (create ad) ----------
class TestSocialPosts:
    def test_create_post_returns_id_and_persists(self, user_a):
        title = f"TEST_post_persist_{uuid.uuid4().hex[:6]}"
        r = requests.post(f"{API}/social/posts", headers=user_a["headers"],
                          json={"title": title, "content": "x", "price": "10.00", "category": "outros", "media": []},
                          timeout=20)
        assert r.status_code in (200, 201), r.text
        body = r.json()
        pid = body.get("post_id") or body.get("id")
        assert pid

        r2 = requests.get(f"{API}/social/posts/{pid}", headers=user_a["headers"], timeout=15)
        assert r2.status_code == 200, r2.text
        data = r2.json()
        # endpoint may wrap in "post" or return flat
        post = data.get("post", data)
        assert title in (post.get("title") or "")

    def test_create_post_unauth(self):
        r = requests.post(f"{API}/social/posts", json={"title": "x", "content": "y"}, timeout=15)
        assert r.status_code in (401, 403), r.text


# ---------- /api/social/favorites ----------
class TestSocialFavorites:
    def test_toggle_favorite_persistent(self, user_b, post_by_a):
        pid = post_by_a["post_id"]

        # Initial GET
        r = requests.get(f"{API}/social/favorites", headers=user_b["headers"], timeout=15)
        assert r.status_code == 200, r.text
        initial = set(r.json().get("favorites") or [])

        # Toggle ON
        r1 = requests.post(f"{API}/social/favorites/{pid}", headers=user_b["headers"], timeout=15)
        assert r1.status_code == 200, r1.text
        body1 = r1.json()
        assert body1.get("favorited") is True
        assert body1.get("post_id") == pid

        r2 = requests.get(f"{API}/social/favorites", headers=user_b["headers"], timeout=15)
        assert r2.status_code == 200
        favs2 = set(r2.json().get("favorites") or [])
        assert pid in favs2, f"post {pid} not in favorites after toggle ON: {favs2}"

        # Toggle OFF
        r3 = requests.post(f"{API}/social/favorites/{pid}", headers=user_b["headers"], timeout=15)
        assert r3.status_code == 200
        assert r3.json().get("favorited") is False

        r4 = requests.get(f"{API}/social/favorites", headers=user_b["headers"], timeout=15)
        favs4 = set(r4.json().get("favorites") or [])
        assert pid not in favs4

    def test_favorites_unauth(self):
        r = requests.get(f"{API}/social/favorites", timeout=10)
        assert r.status_code in (401, 403)
        r2 = requests.post(f"{API}/social/favorites/anything", timeout=10)
        assert r2.status_code in (401, 403)


# ---------- /api/social/messages ----------
class TestSocialMessages:
    def test_send_message_creates_msg_and_notification(self, user_a, user_b, post_by_a):
        pid = post_by_a["post_id"]
        # B sends message to A about A's post
        body = {"post_id": pid, "message": "TEST_msg_iter5_olá!"}
        r = requests.post(f"{API}/social/messages", headers=user_b["headers"], json=body, timeout=15)
        assert r.status_code in (200, 201), r.text
        data = r.json()
        assert data.get("message") == "TEST_msg_iter5_olá!"
        assert data.get("sender_id") == user_b["user"]["user_id"]
        assert data.get("recipient_id") == user_a["user"]["user_id"]
        assert data.get("post_id") == pid
        assert data.get("source") == "blivre"

        # GET messages for sender (B) – should appear
        r2 = requests.get(f"{API}/social/messages", headers=user_b["headers"], timeout=15)
        assert r2.status_code == 200
        msgs_b = r2.json().get("messages") or []
        assert any(m.get("message") == "TEST_msg_iter5_olá!" for m in msgs_b), "msg not in sender list"

        # GET messages for recipient (A) – should also appear
        r3 = requests.get(f"{API}/social/messages", headers=user_a["headers"], timeout=15)
        assert r3.status_code == 200
        msgs_a = r3.json().get("messages") or []
        assert any(m.get("message") == "TEST_msg_iter5_olá!" for m in msgs_a), "msg not in recipient list"

        # A should have a B Livre notification (type direct_chat / source blivre)
        r4 = requests.get(f"{API}/notifications", headers=user_a["headers"], timeout=15)
        assert r4.status_code == 200
        notifs = r4.json().get("notifications") or []
        bl_notifs = [n for n in notifs
                     if (n.get("type") == "direct_chat") or
                        ((n.get("data") or {}).get("source") == "blivre")]
        assert bl_notifs, f"no B Livre notification created for recipient. notifs: {notifs[:3]}"

    def test_send_message_empty(self, user_b, post_by_a):
        r = requests.post(f"{API}/social/messages", headers=user_b["headers"],
                          json={"post_id": post_by_a["post_id"], "message": ""}, timeout=15)
        assert r.status_code == 400

    def test_messages_unauth(self):
        r = requests.get(f"{API}/social/messages", timeout=10)
        assert r.status_code in (401, 403)


# ---------- /api/social/stats ----------
class TestSocialStats:
    def test_stats_for_user_with_posts(self, user_a, post_by_a):
        r = requests.get(f"{API}/social/stats", headers=user_a["headers"], timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "views" in data and "interests" in data and "my_ads" in data
        assert isinstance(data["views"], int)
        assert isinstance(data["interests"], int)
        assert isinstance(data["my_ads"], int)
        assert data["my_ads"] >= 1
        assert data["interests"] >= 1  # user_b sent a message about A's post

    def test_stats_unauth(self):
        r = requests.get(f"{API}/social/stats", timeout=10)
        assert r.status_code in (401, 403)


# ---------- /api/notifications ----------
class TestNotifications:
    def test_notifications_list_auth(self, user_a):
        r = requests.get(f"{API}/notifications", headers=user_a["headers"], timeout=15)
        assert r.status_code == 200
        notifs = r.json().get("notifications")
        assert isinstance(notifs, list)

    def test_notifications_unauth(self):
        r = requests.get(f"{API}/notifications", timeout=10)
        assert r.status_code in (401, 403)


# ---------- ADMIN flows: reports respond/resolve/ignore/block_ad/block_user ----------
@pytest.fixture(scope="session")
def report_id(user_b, post_by_a):
    payload = {
        "tipo": "post",
        "post_id": post_by_a["post_id"],
        "motivo": "TEST_motivo_iter5",
        "descricao": "TEST descricao denuncia iter5",
    }
    r = requests.post(f"{API}/social/reports", headers=user_b["headers"], json=payload, timeout=15)
    assert r.status_code in (200, 201), r.text
    rid = r.json().get("report_id")
    assert rid
    return rid


class TestAdminReports:
    def test_admin_respond_creates_notification(self, admin_headers, report_id, user_b):
        r = requests.post(f"{API}/admin/reports/{report_id}/respond",
                          headers=admin_headers,
                          json={"response": "TEST_admin_response_iter5"},
                          timeout=20)
        assert r.status_code in (200, 201), r.text
        # reporter (user_b) should see a notification
        r2 = requests.get(f"{API}/notifications", headers=user_b["headers"], timeout=15)
        assert r2.status_code == 200
        notifs = r2.json().get("notifications") or []
        # Just confirm there is at least one notif (admin-respond push should add one)
        assert len(notifs) >= 1

    def test_admin_respond_unknown_404(self, admin_headers):
        r = requests.post(f"{API}/admin/reports/notexist_report_xyz/respond",
                          headers=admin_headers, json={"response": "x"}, timeout=15)
        assert r.status_code == 404

    def test_admin_respond_unauth(self, report_id):
        r = requests.post(f"{API}/admin/reports/{report_id}/respond", json={"response": "x"}, timeout=10)
        assert r.status_code in (401, 403)

    def test_admin_ignore(self, admin_headers, user_b, post_by_a):
        # create a fresh report
        rep = requests.post(f"{API}/social/reports", headers=user_b["headers"],
                            json={"tipo": "post", "post_id": post_by_a["post_id"],
                                  "motivo": "TEST_ignore", "descricao": "x"}, timeout=15).json()
        rid = rep["report_id"]
        r = requests.put(f"{API}/admin/reports/{rid}/ignore", headers=admin_headers, timeout=15)
        assert r.status_code in (200, 204), r.text

    def test_admin_resolve(self, admin_headers, user_b, post_by_a):
        rep = requests.post(f"{API}/social/reports", headers=user_b["headers"],
                            json={"tipo": "post", "post_id": post_by_a["post_id"],
                                  "motivo": "TEST_resolve", "descricao": "x"}, timeout=15).json()
        rid = rep["report_id"]
        r = requests.put(f"{API}/admin/reports/{rid}/resolve", headers=admin_headers, timeout=15)
        assert r.status_code in (200, 204), r.text

    def test_admin_block_ad(self, admin_headers, user_b, post_by_a):
        rep = requests.post(f"{API}/social/reports", headers=user_b["headers"],
                            json={"tipo": "post", "post_id": post_by_a["post_id"],
                                  "motivo": "TEST_block_ad", "descricao": "x"}, timeout=15).json()
        rid = rep["report_id"]
        r = requests.put(f"{API}/admin/reports/{rid}/block_ad", headers=admin_headers, timeout=15)
        assert r.status_code in (200, 204), r.text

    def test_admin_block_user(self, admin_headers, user_b, post_by_a):
        rep = requests.post(f"{API}/social/reports", headers=user_b["headers"],
                            json={"tipo": "user", "post_id": post_by_a["post_id"],
                                  "reported_user_id": "TEST_user_to_block",
                                  "motivo": "TEST_block_user", "descricao": "x"}, timeout=15).json()
        rid = rep["report_id"]
        r = requests.put(f"{API}/admin/reports/{rid}/block_user", headers=admin_headers, timeout=15)
        assert r.status_code in (200, 204), r.text


# ---------- ADMIN support reply ----------
class TestAdminSupportReply:
    def test_create_support_then_admin_reply(self, admin_headers, user_a):
        # public/support endpoint
        ticket = requests.post(f"{API}/public/support",
                               json={"name": user_a["user"]["name"],
                                     "email": user_a["email"],
                                     "subject": "TEST_iter5_support",
                                     "message": "Help me iter5"},
                               timeout=15)
        assert ticket.status_code in (200, 201), ticket.text
        body = ticket.json()
        sid = body.get("ticket_id") or body.get("id") or body.get("message_id")
        if not sid:
            # Fallback: list admin/support and pick latest TEST_iter5_support
            ls = requests.get(f"{API}/admin/support", headers=admin_headers, timeout=15)
            assert ls.status_code == 200
            items = ls.json().get("items") or ls.json().get("messages") or ls.json()
            if isinstance(items, dict):
                items = items.get("messages") or items.get("items") or []
            cand = [t for t in items if "TEST_iter5_support" in (t.get("subject") or "")]
            assert cand, "could not locate created support ticket"
            sid = cand[0].get("message_id") or cand[0].get("id")
        assert sid

        r = requests.post(f"{API}/admin/support/{sid}/reply",
                          headers=admin_headers,
                          json={"reply": "TEST_iter5_admin_reply", "message": "TEST_iter5_admin_reply"},
                          timeout=20)
        assert r.status_code in (200, 201), r.text
