"""
Backend tests for B Livre Admin Reports respond flow (iteration 4).
Validates:
  - POST /api/admin/reports/{id}/respond pushes entries into admin_responses[]
  - GET /api/admin/reports returns admin_responses array
  - /api/public/support and /api/admin/support continue to function
"""
import os
import uuid
import pytest
import requests


def _load_backend_url():
    url = os.environ.get("REACT_APP_BACKEND_URL")
    if not url:
        env_path = "/app/frontend/.env"
        if os.path.exists(env_path):
            for line in open(env_path):
                line = line.strip()
                if line.startswith("REACT_APP_BACKEND_URL="):
                    url = line.split("=", 1)[1].strip()
                    break
    if not url:
        raise RuntimeError("REACT_APP_BACKEND_URL not set")
    return url.rstrip("/")


BASE_URL = _load_backend_url()
ADMIN_EMAIL = "admin@brane.com"
ADMIN_PASSWORD = "Admin123!@#"


# ---------- fixtures ----------
@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=15,
    )
    if r.status_code != 200:
        pytest.skip(f"Admin login failed ({r.status_code}): {r.text[:200]}")
    data = r.json()
    token = data.get("access_token") or data.get("token")
    assert token, f"No token in admin login response: {data}"
    # If admin became seller (per memory note), restore role via a user endpoint is not available;
    # we still get a token usable for admin endpoints because backend checks role at request time.
    return token


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def created_report(admin_headers):
    """Create a report (as admin/buyer) so we can respond to it."""
    payload = {
        "tipo": "post",
        "post_id": f"TEST_post_{uuid.uuid4().hex[:8]}",
        "reported_user_id": "",
        "motivo": "TEST_motivo_iter4",
        "descricao": "TEST descricao para iteration 4",
    }
    r = requests.post(
        f"{BASE_URL}/api/social/reports",
        json=payload,
        headers=admin_headers,
        timeout=15,
    )
    assert r.status_code == 200, f"create report failed: {r.status_code} {r.text[:200]}"
    body = r.json()
    assert "report_id" in body
    return body


# ---------- module: admin reports respond ----------
class TestAdminReportsRespond:
    def test_admin_login_works(self, admin_token):
        assert isinstance(admin_token, str) and len(admin_token) > 10

    def test_create_report_persists(self, created_report, admin_headers):
        rid = created_report["report_id"]
        # GET admin reports list and ensure presence
        r = requests.get(f"{BASE_URL}/api/admin/reports", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "reports" in data
        assert any(rep["report_id"] == rid for rep in data["reports"]), \
            f"Report {rid} not in admin list"

    def test_respond_first_time_pushes_entry(self, created_report, admin_headers):
        rid = created_report["report_id"]
        first_msg = "TEST_resposta_1 - primeira resposta"
        r = requests.post(
            f"{BASE_URL}/api/admin/reports/{rid}/respond",
            json={"response": first_msg},
            headers=admin_headers,
            timeout=15,
        )
        assert r.status_code == 200, f"first respond failed: {r.status_code} {r.text[:300]}"

        # Verify GET returns admin_responses with 1 entry
        r2 = requests.get(f"{BASE_URL}/api/admin/reports", headers=admin_headers, timeout=15)
        assert r2.status_code == 200
        rep = next((x for x in r2.json()["reports"] if x["report_id"] == rid), None)
        assert rep is not None
        assert "admin_responses" in rep, f"admin_responses missing in report: {rep}"
        assert isinstance(rep["admin_responses"], list)
        assert len(rep["admin_responses"]) == 1
        entry = rep["admin_responses"][0]
        assert entry.get("by") == "admin"
        assert entry.get("message") == first_msg
        assert "created_at" in entry
        # legacy field also set
        assert rep.get("admin_response") == first_msg
        # status auto-bumped from pending → analyzed
        assert rep.get("status") in ("analyzed", "resolved", "ignored")

    def test_respond_second_time_appends(self, created_report, admin_headers):
        rid = created_report["report_id"]
        second_msg = "TEST_resposta_2 - segunda resposta"
        r = requests.post(
            f"{BASE_URL}/api/admin/reports/{rid}/respond",
            json={"response": second_msg},
            headers=admin_headers,
            timeout=15,
        )
        assert r.status_code == 200

        r2 = requests.get(f"{BASE_URL}/api/admin/reports", headers=admin_headers, timeout=15)
        assert r2.status_code == 200
        rep = next((x for x in r2.json()["reports"] if x["report_id"] == rid), None)
        assert rep is not None
        assert isinstance(rep.get("admin_responses"), list)
        assert len(rep["admin_responses"]) == 2, \
            f"expected 2 entries, got {len(rep['admin_responses'])}: {rep['admin_responses']}"
        # both entries by admin
        assert all(e.get("by") == "admin" for e in rep["admin_responses"])
        msgs = [e["message"] for e in rep["admin_responses"]]
        assert "TEST_resposta_1 - primeira resposta" in msgs
        assert second_msg in msgs
        # legacy field reflects latest
        assert rep.get("admin_response") == second_msg

    def test_respond_404_unknown_report(self, admin_headers):
        r = requests.post(
            f"{BASE_URL}/api/admin/reports/report_does_not_exist_xyz/respond",
            json={"response": "x"},
            headers=admin_headers,
            timeout=15,
        )
        assert r.status_code == 404

    def test_respond_requires_auth(self):
        r = requests.post(
            f"{BASE_URL}/api/admin/reports/whatever/respond",
            json={"response": "x"},
            timeout=15,
        )
        assert r.status_code in (401, 403)


# ---------- module: existing public/admin support endpoints still work ----------
class TestSupportEndpointsStillWork:
    def test_public_support_post(self):
        payload = {
            "name": "TEST_iter4_user",
            "email": "test_iter4@example.com",
            "subject": "TEST_iter4_subject",
            "message": "TEST_iter4 message body",
            "category": "support",
        }
        r = requests.post(f"{BASE_URL}/api/public/support", json=payload, timeout=15)
        assert r.status_code == 200, f"public support failed: {r.status_code} {r.text[:200]}"
        body = r.json()
        assert body.get("ok") is True or "ticket_id" in body or "message_id" in body or body.get("success") is True

    def test_admin_support_list(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/support", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        data = r.json()
        # accept either {messages:[...]} or list
        assert isinstance(data, (dict, list))
