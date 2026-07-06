"""Render production deployment verification for SAMSON beta task admin endpoints.

Tests ONLY hit the Render production URL. No direct MongoDB writes.
Only observes idempotent behavior (since prod DB may already have seeded tasks).
"""
import os
import time
import pytest
import requests

BASE_URL = "https://drt-vara-ios-app.onrender.com"
ADMIN_EMAIL = "admin@vara.com"
ADMIN_PASSWORD = "vara_admin_2026"

EXPECTED = {
    "Complete Profile Check": 0.10,
    "Watch Rewarded Video": 0.05,
    "Visit Offers Screen": 0.10,
    "Review Withdrawal Screen": 0.10,
    "Submit Beta Feedback": 1.00,
}

TIMEOUT = 60  # Render free tier can be slow


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
                      timeout=TIMEOUT)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data.get("role") == "admin", f"Expected admin role, got: {data}"
    assert isinstance(data.get("access_token"), str) and len(data["access_token"]) > 20
    return data["access_token"]


@pytest.fixture(scope="module")
def user_token():
    email = f"TEST_render_beta_{int(time.time())}@example.com"
    r = requests.post(f"{BASE_URL}/api/auth/register",
                      json={"email": email, "password": "TestPass123!", "name": "Beta User"},
                      timeout=TIMEOUT)
    assert r.status_code in (200, 201), f"Register failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


def _auth(t):
    return {"Authorization": f"Bearer {t}"}


class TestRenderBetaEndpoints:

    # ---- endpoint existence / auth guard ----
    def test_1_get_beta_tasks_unauth_401(self):
        r = requests.get(f"{BASE_URL}/api/admin/beta-tasks", timeout=TIMEOUT)
        assert r.status_code != 404, "Endpoint missing on Render (404)"
        assert r.status_code == 401, f"Expected 401, got {r.status_code}: {r.text}"

    def test_2_post_seed_unauth_401(self):
        r = requests.post(f"{BASE_URL}/api/admin/seed-beta-tasks", timeout=TIMEOUT)
        assert r.status_code != 404, "Endpoint missing on Render (404)"
        assert r.status_code == 401, f"Expected 401, got {r.status_code}: {r.text}"

    # ---- admin auth ----
    def test_3_admin_login(self, admin_token):
        assert admin_token  # implicit via fixture

    # ---- GET /api/admin/beta-tasks ----
    def test_4_admin_list_beta_tasks(self, admin_token):
        r = requests.get(f"{BASE_URL}/api/admin/beta-tasks",
                         headers=_auth(admin_token), timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["count"] == 5, f"Expected count=5, got {data['count']}"
        titles = {t["title"] for t in data["tasks"]}
        assert titles == set(EXPECTED.keys()), f"Titles mismatch: {titles}"

    # ---- POST seed idempotent ----
    def test_5_seed_idempotent(self, admin_token):
        r = requests.post(f"{BASE_URL}/api/admin/seed-beta-tasks",
                          headers=_auth(admin_token), timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        data = r.json()
        # Prod DB may already have them seeded
        assert data["deleted"] == 0
        assert data["total_beta_tasks"] == 5
        # Either all inserted (first-ever call) OR all skipped (already seeded)
        n_inserted = len(data["inserted"])
        n_skipped = len(data["skipped"])
        assert n_inserted + n_skipped == 5, f"Expected 5 total, got inserted={n_inserted}, skipped={n_skipped}"

    # ---- non-admin forbidden ----
    def test_6_non_admin_forbidden(self, user_token):
        r = requests.post(f"{BASE_URL}/api/admin/seed-beta-tasks",
                          headers=_auth(user_token), timeout=TIMEOUT)
        assert r.status_code == 403, f"Expected 403, got {r.status_code}: {r.text}"

        r2 = requests.get(f"{BASE_URL}/api/admin/beta-tasks",
                          headers=_auth(user_token), timeout=TIMEOUT)
        assert r2.status_code == 403, f"Expected 403 on GET, got {r2.status_code}"

    # ---- replace=true ----
    def test_7_seed_replace_true(self, admin_token):
        r = requests.post(f"{BASE_URL}/api/admin/seed-beta-tasks?replace=true",
                          headers=_auth(admin_token), timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["deleted"] == 5, f"Expected deleted=5, got {data['deleted']}"
        assert len(data["inserted"]) == 5, f"Expected 5 inserted, got {len(data['inserted'])}"
        assert data["skipped"] == []
        assert data["total_beta_tasks"] == 5
        titles = {i["title"] for i in data["inserted"]}
        assert titles == set(EXPECTED.keys())

    # ---- /api/tasks/ shows beta tasks with correct rewards ----
    def test_8_tasks_endpoint_shows_beta_tasks(self, admin_token):
        r = requests.get(f"{BASE_URL}/api/tasks/",
                         headers=_auth(admin_token), timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        tasks = r.json()
        beta_map = {t["title"]: t for t in tasks if t["title"] in EXPECTED}
        assert set(beta_map.keys()) == set(EXPECTED.keys()), \
            f"Missing beta tasks in /api/tasks/: got {set(beta_map.keys())}"
        for title, expected_reward in EXPECTED.items():
            t = beta_map[title]
            assert abs(t["reward_amount"] - expected_reward) < 1e-6, \
                f"{title} reward {t['reward_amount']} != {expected_reward}"
            assert t["is_active"] is True
            assert t["task_type"] in {"survey", "video", "social", "data_entry", "quiz"}, \
                f"{title} invalid task_type {t['task_type']}"

    # ---- regression: no impact on existing endpoints ----
    def test_9_no_regression_health_and_login(self):
        r = requests.get(f"{BASE_URL}/api/health", timeout=TIMEOUT)
        assert r.status_code == 200
        body = r.json()
        assert body.get("status") == "healthy"
        assert body.get("database") == "connected"

        r2 = requests.post(f"{BASE_URL}/api/auth/login",
                           json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
                           timeout=TIMEOUT)
        assert r2.status_code == 200
