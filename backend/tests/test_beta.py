"""SAMSON Closed Beta portal — backend tests."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://vara-landing-v1.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@vara.com"
ADMIN_PASS = "vara_admin_2026"


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=15)
    if r.status_code != 200:
        pytest.skip(f"admin login failed: {r.status_code} {r.text}")
    return r.json().get("access_token")


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---------- Bug reports -----------------------------------------------------
def _bug_payload(email="TEST_bug@example.com"):
    return {
        "name": "TEST Tester",
        "email": email,
        "device_model": "Samsung Galaxy A15",
        "android_version": "14",
        "app_screen": "Tasks",
        "severity": "Major",
        "what_happened": "TEST — the task list did not refresh after tapping refresh.",
        "screenshot_link": "https://drive.google.com/file/test",
    }


class TestBetaBugReports:
    def test_bug_create_valid(self):
        r = requests.post(f"{BASE_URL}/api/beta/bug-reports", json=_bug_payload(), timeout=15)
        assert r.status_code == 201, r.text
        data = r.json()
        assert "id" in data and "created_at" in data
        assert isinstance(data["id"], str) and len(data["id"]) > 0

    def test_bug_missing_field(self):
        p = _bug_payload(); p.pop("device_model")
        r = requests.post(f"{BASE_URL}/api/beta/bug-reports", json=p, timeout=15)
        assert r.status_code == 422

    def test_bug_invalid_email(self):
        p = _bug_payload(); p["email"] = "not-an-email"
        r = requests.post(f"{BASE_URL}/api/beta/bug-reports", json=p, timeout=15)
        assert r.status_code == 422

    def test_bug_invalid_severity(self):
        p = _bug_payload(); p["severity"] = "Blocker"
        r = requests.post(f"{BASE_URL}/api/beta/bug-reports", json=p, timeout=15)
        assert r.status_code == 422


# ---------- Suggestions -----------------------------------------------------
def _sug_payload():
    return {
        "name": "TEST Tester",
        "email": "TEST_sug@example.com",
        "category": "New feature",
        "details": "TEST — please add dark mode toggle to the dashboard.",
    }


class TestBetaSuggestions:
    def test_suggestion_create_valid(self):
        r = requests.post(f"{BASE_URL}/api/beta/suggestions", json=_sug_payload(), timeout=15)
        assert r.status_code == 201, r.text
        data = r.json()
        assert "id" in data and "created_at" in data

    def test_suggestion_missing_field(self):
        p = _sug_payload(); p.pop("category")
        r = requests.post(f"{BASE_URL}/api/beta/suggestions", json=p, timeout=15)
        assert r.status_code == 422


# ---------- Admin endpoints -------------------------------------------------
class TestBetaAdmin:
    def test_counts_no_auth(self):
        r = requests.get(f"{BASE_URL}/api/beta/counts", timeout=15)
        assert r.status_code == 401

    def test_counts_admin(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/beta/counts", headers=admin_headers, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "bugs" in data and "suggestions" in data and "latest" in data
        assert isinstance(data["bugs"], int) and isinstance(data["suggestions"], int)

    def test_export_csv_no_auth(self):
        r = requests.get(f"{BASE_URL}/api/beta/export.csv", timeout=15)
        assert r.status_code == 401

    def test_export_csv_admin_all(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/beta/export.csv", headers=admin_headers, timeout=15)
        assert r.status_code == 200, r.text
        body = r.text
        assert "BUG REPORTS" in body
        assert "SUGGESTIONS" in body
        assert "attachment" in r.headers.get("Content-Disposition", "").lower()
        assert "text/csv" in r.headers.get("Content-Type", "").lower()

    def test_export_csv_bugs_only(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/beta/export.csv?kind=bugs", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        assert "BUG REPORTS" in r.text
        assert "SUGGESTIONS" not in r.text

    def test_export_csv_suggestions_only(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/beta/export.csv?kind=suggestions", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        assert "SUGGESTIONS" in r.text
        assert "BUG REPORTS" not in r.text


# ---------- Frontend route smoke --------------------------------------------
def test_beta_page_reachable():
    r = requests.get(f"{BASE_URL}/beta", timeout=15)
    assert r.status_code == 200
    # SPA — returns index.html; body content is React-mounted
    assert "<div id=\"root\"" in r.text or "<div id='root'" in r.text
