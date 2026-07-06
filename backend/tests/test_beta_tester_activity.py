"""SAMSON beta tester-activity endpoint tests."""
import os
import time
from datetime import datetime, timezone

import pytest
import requests

BASE_URL = os.environ.get(
    "REACT_APP_BACKEND_URL", "https://vara-landing-v1.preview.emergentagent.com"
).rstrip("/")
ADMIN_EMAIL = "admin@vara.com"
ADMIN_PASS = "vara_admin_2026"

VALID_ITEMS = ["login", "task", "ad", "offers", "dashboard", "report"]


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASS},
        timeout=15,
    )
    if r.status_code != 200:
        pytest.skip(f"admin login failed: {r.status_code} {r.text}")
    return r.json().get("access_token")


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def test_email():
    return f"activity_test_{int(time.time() * 1000)}@example.com"


# ---------- POST /api/beta/tester-activity ----------------------------------
class TestActivityPost:
    def test_valid_returns_200_and_structure(self, test_email):
        r = requests.post(
            f"{BASE_URL}/api/beta/tester-activity",
            json={"email": test_email, "item_id": "login"},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["ok"] is True
        assert data["email"] == test_email.lower()
        # server UTC date YYYY-MM-DD
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        assert data["date"] == today
        assert data["items_completed_today"] == 1
        assert data["all_six_today"] is False

    def test_all_six_items_flag_true(self, test_email):
        for i, item in enumerate(VALID_ITEMS):
            r = requests.post(
                f"{BASE_URL}/api/beta/tester-activity",
                json={"email": test_email, "item_id": item},
                timeout=15,
            )
            assert r.status_code == 200, r.text
            data = r.json()
            assert data["items_completed_today"] == i + 1
        assert data["all_six_today"] is True

    def test_idempotent_duplicate_no_change(self, test_email):
        r1 = requests.post(
            f"{BASE_URL}/api/beta/tester-activity",
            json={"email": test_email, "item_id": "task"},
            timeout=15,
        )
        assert r1.status_code == 200
        count1 = r1.json()["items_completed_today"]

        r2 = requests.post(
            f"{BASE_URL}/api/beta/tester-activity",
            json={"email": test_email, "item_id": "task"},
            timeout=15,
        )
        assert r2.status_code == 200
        assert r2.json()["items_completed_today"] == count1  # no duplicate

    def test_invalid_item_id(self, test_email):
        r = requests.post(
            f"{BASE_URL}/api/beta/tester-activity",
            json={"email": test_email, "item_id": "banana"},
            timeout=15,
        )
        assert r.status_code == 422

    def test_invalid_email(self):
        r = requests.post(
            f"{BASE_URL}/api/beta/tester-activity",
            json={"email": "not-an-email", "item_id": "login"},
            timeout=15,
        )
        assert r.status_code == 422

    def test_valid_date_override(self, test_email):
        r = requests.post(
            f"{BASE_URL}/api/beta/tester-activity",
            json={"email": test_email, "item_id": "login", "date": "2026-01-05"},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        assert r.json()["date"] == "2026-01-05"

    def test_malformed_date_short_month(self, test_email):
        r = requests.post(
            f"{BASE_URL}/api/beta/tester-activity",
            json={"email": test_email, "item_id": "login", "date": "2026-1-1"},
            timeout=15,
        )
        assert r.status_code == 422

    def test_malformed_date_gibberish(self, test_email):
        r = requests.post(
            f"{BASE_URL}/api/beta/tester-activity",
            json={"email": test_email, "item_id": "login", "date": "abc"},
            timeout=15,
        )
        assert r.status_code == 422


# ---------- GET /api/beta/tester-activity/me --------------------------------
class TestActivityMe:
    def test_me_returns_14_day_window(self, test_email):
        # Log 3 items today
        for item in ["login", "task", "ad"]:
            requests.post(
                f"{BASE_URL}/api/beta/tester-activity",
                json={"email": test_email, "item_id": item},
                timeout=15,
            )
        r = requests.get(
            f"{BASE_URL}/api/beta/tester-activity/me",
            params={"email": test_email},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["email"] == test_email.lower()
        assert data["window_days"] == 14
        assert len(data["per_day"]) == 14
        assert isinstance(data["days_active"], int)
        assert isinstance(data["full_days"], int)

        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        today_entry = next(e for e in data["per_day"] if e["date"] == today)
        assert today_entry["count"] == 3
        assert set(today_entry["items"]) == {"login", "task", "ad"}
        assert today_entry["is_full"] is False


# ---------- GET /api/beta/qualified-testers ---------------------------------
class TestQualifiedTesters:
    def test_no_auth_401(self):
        r = requests.get(f"{BASE_URL}/api/beta/qualified-testers", timeout=15)
        assert r.status_code in (401, 403)

    def test_with_admin_jwt(self, admin_headers):
        r = requests.get(
            f"{BASE_URL}/api/beta/qualified-testers",
            headers=admin_headers,
            timeout=15,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        for key in [
            "window_days",
            "min_full_days",
            "total_testers_active",
            "qualified_count",
            "qualified",
            "all_testers",
        ]:
            assert key in data
        assert isinstance(data["qualified"], list)
        assert isinstance(data["all_testers"], list)

    def test_min_full_days_1_promotes_full_day_tester(self, admin_headers, test_email):
        # Log all 6 today so this tester has a full day
        for item in VALID_ITEMS:
            requests.post(
                f"{BASE_URL}/api/beta/tester-activity",
                json={"email": test_email, "item_id": item},
                timeout=15,
            )
        r = requests.get(
            f"{BASE_URL}/api/beta/qualified-testers",
            params={"min_full_days": 1},
            headers=admin_headers,
            timeout=15,
        )
        assert r.status_code == 200
        data = r.json()
        assert data["min_full_days"] == 1
        emails = [t["email"] for t in data["qualified"]]
        assert test_email.lower() in emails

    def test_min_full_days_impossible(self, admin_headers):
        r = requests.get(
            f"{BASE_URL}/api/beta/qualified-testers",
            params={"min_full_days": 90},  # max allowed by validator
            headers=admin_headers,
            timeout=15,
        )
        assert r.status_code == 200
        assert r.json()["qualified_count"] == 0

    def test_key_param_without_env_key_401(self):
        # BETA_EXPORT_KEY is unset in preview → any ?key= should 401
        r = requests.get(
            f"{BASE_URL}/api/beta/qualified-testers?key=anything",
            timeout=15,
        )
        assert r.status_code in (401, 403)
