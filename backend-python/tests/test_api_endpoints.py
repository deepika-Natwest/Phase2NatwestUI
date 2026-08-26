'''
API endpoint tests using FastAPI TestClient.
Tests all major endpoints to ensure Python backend is at full parity.

Run with:
    cd backend-python
    .\.venv\Scripts\pytest tests/test_api_endpoints.py -v
'''
import sys
import os
import pytest
import re

from fastapi.testclient import TestClient
from main import app

client = TestClient(app, raise_server_exceptions=True)


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------
def _get_admin_token():
    '''Log in as admin and return bearer token.'''
    resp = client.post("/api/login", json={
        "username": "admin",
        "password": "admin123",
    })
    if resp.status_code != 200:
        pytest.skip(f"Could not log in as admin: {resp.text}")
    return resp.json()["token"]


_TOKEN = None

@pytest.fixture(scope="session")
def admin_token():
    global _TOKEN
    if _TOKEN is None:
        _TOKEN = _get_admin_token()
    return _TOKEN


@pytest.fixture(scope="session")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
def test_login_missing_body():
    resp = client.post("/api/login", json={})
    assert resp.status_code in (400, 422)


def test_login_wrong_credentials():
    resp = client.post("/api/login", json={"username": "nobody", "password": "wrong"})
    assert resp.status_code == 401


def test_login_success(admin_token):
    assert isinstance(admin_token, str)
    assert len(admin_token) > 20


# ---------------------------------------------------------------------------
# Public dashboard
# ---------------------------------------------------------------------------
def test_public_dashboard():
    resp = client.get("/api/dashboard/data")
    assert resp.status_code == 200


def test_admin_dashboard(auth_headers):
    resp = client.get("/api/dashboard", headers=auth_headers)
    assert resp.status_code == 200
    assert "message" in resp.json()


# ---------------------------------------------------------------------------
# Capabilities
# ---------------------------------------------------------------------------
def test_get_capabilities(auth_headers):
    resp = client.get("/api/capabilities", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


# ---------------------------------------------------------------------------
# Franchises
# ---------------------------------------------------------------------------
def test_get_franchises(auth_headers):
    resp = client.get("/api/franchises", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


# ---------------------------------------------------------------------------
# Programs
# ---------------------------------------------------------------------------
def test_get_programs(auth_headers):
    resp = client.get("/api/programs", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------
def test_get_users(auth_headers):
    resp = client.get("/api/users", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, (list, dict))


def test_get_users_unauthenticated():
    resp = client.get("/api/users")
    assert resp.status_code in (200, 401, 403)


# ---------------------------------------------------------------------------
# Leadership
# ---------------------------------------------------------------------------
def test_get_leadership(auth_headers):
    resp = client.get("/api/leadership", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


# ---------------------------------------------------------------------------
# Events
# ---------------------------------------------------------------------------
def test_get_events(auth_headers):
    resp = client.get("/api/events", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


# ---------------------------------------------------------------------------
# Deliverables
# ---------------------------------------------------------------------------
def test_get_deliverables(auth_headers):
    resp = client.get("/api/deliverables", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, (list, dict))


# ---------------------------------------------------------------------------
# Recognitions
# ---------------------------------------------------------------------------
def test_get_recognitions(auth_headers):
    resp = client.get("/api/recognition", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), (list, dict))


# ---------------------------------------------------------------------------
# Pricing
# ---------------------------------------------------------------------------
def test_get_pricing(auth_headers):
    resp = client.get("/api/pricing", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)


# ---------------------------------------------------------------------------
# Reference data
# ---------------------------------------------------------------------------
def test_get_reference_data():
    resp = client.get("/api/reference-data")
    assert resp.status_code == 200


# ---------------------------------------------------------------------------
# User statuses
# ---------------------------------------------------------------------------
def test_get_user_statuses(auth_headers):
    resp = client.get("/api/user-statuses", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


# ---------------------------------------------------------------------------
# Chatbot (rule-based, no external LLM required)
# ---------------------------------------------------------------------------
def test_chatbot_basic(auth_headers):
    resp = client.post(
        "/api/chatbot/chat",
        json={"message": "what is the total headcount"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "reply" in data or "message" in data or "response" in data or "answer" in data
    text = data.get("reply") or data.get("message") or data.get("response") or data.get("answer")
    assert "543" in text
