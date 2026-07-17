"""SAMSON compliance patch tests — rewarded-ad kill-switch.

Verifies:
- POST /api/users/ad-reward returns 410 with AdMob/policy message when
  REWARDED_ADS_ENABLED is disabled (default).
- Auth check runs before compliance check (unauth → 401, not 410).
- Endpoint does NOT credit user.earnings when disabled.
- Endpoint does NOT insert into db.ad_rewards when disabled.
- Regression: /api/tasks, /api/withdrawal/request, /api/users/me/dashboard,
  /api/beta/bug-reports still function.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://vara-landing-v1.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@vara.com"
ADMIN_PASSWORD = "vara_admin_2026"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=15,
    )
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    data = r.json()
    tok = data.get("access_token") or data.get("token")
    assert tok, f"no token in login response: {data}"
    return tok


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---------- Compliance kill-switch tests ----------

def test_ad_reward_returns_410_when_disabled(auth_headers):
    r = requests.post(
        f"{BASE_URL}/api/users/ad-reward",
        headers=auth_headers,
        json={"network": "admob", "amount": 1},
        timeout=15,
    )
    assert r.status_code == 410, f"expected 410 Gone, got {r.status_code}: {r.text}"


def test_ad_reward_410_body_contains_admob_and_policy(auth_headers):
    r = requests.post(
        f"{BASE_URL}/api/users/ad-reward",
        headers=auth_headers,
        json={"network": "admob"},
        timeout=15,
    )
    assert r.status_code == 410
    body = r.json()
    detail = (body.get("detail") or "").lower()
    assert "admob" in detail, f"'AdMob' missing from detail: {detail}"
    assert "policy" in detail, f"'policy' missing from detail: {detail}"


def test_ad_reward_unauthenticated_returns_401_not_410():
    r = requests.post(
        f"{BASE_URL}/api/users/ad-reward",
        json={"network": "admob"},
        timeout=15,
    )
    # Auth check must run BEFORE compliance branch
    assert r.status_code == 401, f"expected 401 (auth first), got {r.status_code}: {r.text}"


def test_ad_reward_does_not_credit_earnings(auth_headers):
    # Snapshot balance BEFORE
    before = requests.get(f"{BASE_URL}/api/users/me/dashboard", headers=auth_headers, timeout=15)
    assert before.status_code == 200
    bal_before = before.json()["balance"]["available"]
    lifetime_before = before.json()["balance"]["lifetime_earnings"]

    # Hit the disabled endpoint
    r = requests.post(
        f"{BASE_URL}/api/users/ad-reward",
        headers=auth_headers,
        json={"network": "admob", "amount": 1},
        timeout=15,
    )
    assert r.status_code == 410

    # Snapshot AFTER — must be identical
    after = requests.get(f"{BASE_URL}/api/users/me/dashboard", headers=auth_headers, timeout=15)
    assert after.status_code == 200
    bal_after = after.json()["balance"]["available"]
    lifetime_after = after.json()["balance"]["lifetime_earnings"]

    assert bal_after == bal_before, f"earnings changed! {bal_before} -> {bal_after}"
    assert lifetime_after == lifetime_before, f"lifetime changed! {lifetime_before} -> {lifetime_after}"


def test_ad_reward_does_not_insert_into_ad_rewards_collection(auth_headers):
    """Directly query MongoDB to confirm no ad_rewards row was inserted."""
    from motor.motor_asyncio import AsyncIOMotorClient
    import asyncio

    async def count():
        client = AsyncIOMotorClient(os.environ.get("MONGO_URL"))
        db = client[os.environ.get("DB_NAME", "vara_db")]
        c = await db.ad_rewards.count_documents({})
        client.close()
        return c

    before_count = asyncio.get_event_loop().run_until_complete(count())

    # Fire two disabled calls
    for _ in range(2):
        r = requests.post(
            f"{BASE_URL}/api/users/ad-reward",
            headers=auth_headers,
            json={"network": "admob"},
            timeout=15,
        )
        assert r.status_code == 410

    after_count = asyncio.get_event_loop().run_until_complete(count())
    assert after_count == before_count, f"ad_rewards inserted! {before_count} -> {after_count}"


# ---------- Regression tests ----------

def test_regression_dashboard_returns_200(auth_headers):
    r = requests.get(f"{BASE_URL}/api/users/me/dashboard", headers=auth_headers, timeout=15)
    assert r.status_code == 200
    body = r.json()
    for key in ("balance", "today", "next_bonus", "streak", "account_status", "referrals"):
        assert key in body, f"missing dashboard key: {key}"


def test_regression_tasks_list_and_complete(auth_headers):
    """Task-based earning still works. We just list tasks; completing may hit
    daily caps for admin — treat non-500 as pass."""
    r = requests.get(f"{BASE_URL}/api/tasks/", headers=auth_headers, timeout=15)
    assert r.status_code == 200, f"tasks list failed: {r.status_code} {r.text}"
    tasks = r.json()
    assert isinstance(tasks, list)


def test_regression_withdrawal_request_endpoint_reachable(auth_headers):
    """The withdrawal request endpoint must remain reachable. Insufficient
    balance / cooldown are acceptable business responses (4xx); we only
    fail on 5xx or 410."""
    r = requests.post(
        f"{BASE_URL}/api/withdrawal/request",
        headers=auth_headers,
        json={"amount": 5.0, "method": "paypal", "destination": "admin@vara.com"},
        timeout=15,
    )
    assert r.status_code < 500, f"5xx from withdrawal: {r.status_code} {r.text}"
    assert r.status_code != 410, f"withdrawal wrongly disabled: {r.text}"


def test_regression_beta_bug_reports_endpoint(auth_headers):
    r = requests.post(
        f"{BASE_URL}/api/beta/bug-reports",
        headers=auth_headers,
        json={
            "name": "TEST admin",
            "email": ADMIN_EMAIL,
            "title": "TEST_samson compliance regression",
            "description": "Regression check that beta router still returns 201.",
            "severity": "Minor",
            "device_model": "Pixel 7",
            "android_version": "14",
            "app_screen": "Dashboard",
        },
        timeout=15,
    )
    # Accept 201 (spec) or 200 (some impls). Explicitly assert 201 per spec.
    assert r.status_code == 201, f"expected 201, got {r.status_code}: {r.text}"


# ---------- Startup log ----------

def test_startup_log_emits_samson_compliance_line():
    """Grep backend logs for the module-load compliance marker."""
    found = False
    for path in ("/var/log/supervisor/backend.err.log", "/var/log/supervisor/backend.out.log"):
        try:
            with open(path, "r", errors="ignore") as f:
                if "SAMSON compliance" in f.read():
                    found = True
                    break
        except FileNotFoundError:
            pass
    assert found, "'[SAMSON compliance] REWARDED_ADS_ENABLED=...' not found in backend logs"
