import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://brane-next-gen.preview.emergentagent.com").rstrip("/")


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _login(api, email, password):
    r = api.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    if r.status_code == 200:
        return r.json()
    return None


def _register(api, name, email, password):
    r = api.post(f"{BASE_URL}/api/auth/register", json={
        "name": name, "email": email, "password": password, "role": "buyer"
    })
    if r.status_code == 200:
        return r.json()
    return None


@pytest.fixture(scope="session")
def admin_auth(api):
    data = _login(api, "admin@brane.com", "Admin123!")
    assert data is not None, "Admin login failed"
    return data


@pytest.fixture(scope="session")
def admin_token(admin_auth):
    return admin_auth["token"]


@pytest.fixture(scope="session")
def admin_user(admin_auth):
    return admin_auth["user"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def user_auth(api):
    # Try login first, else register
    data = _login(api, "maria@test.com", "test1234")
    if data is None:
        data = _register(api, "Maria Teste", "maria@test.com", "test1234")
    assert data is not None, "User login/register failed"
    return data


@pytest.fixture(scope="session")
def user_token(user_auth):
    return user_auth["token"]


@pytest.fixture(scope="session")
def user_headers(user_token):
    return {"Authorization": f"Bearer {user_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def user_user(user_auth):
    return user_auth["user"]
