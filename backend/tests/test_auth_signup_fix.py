"""
Backend tests for SAMSON Sprint 4 auth register signup-copy fix.
Covers /api/auth/register: happy path, duplicates (case/whitespace),
invalid email, weak/missing password, referral silent-ignore, log format,
and regressions (login, ad-reward 410, beta bug-reports 201).
"""
import os
import re
import time
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://vara-landing-v1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@vara.com"
ADMIN_PASSWORD = "vara_admin_2026"


def _unique_email(tag="signup"):
    return f"TEST_{tag}_{uuid.uuid4().hex[:10]}@example.com"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- Register: happy path ---
def test_register_happy_path(session):
    email = _unique_email("happy")
    r = session.post(f"{API}/auth/register", json={
        "email": email, "password": "StrongPass123!", "name": "Happy Tester"
    })
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("access_token")
    assert body.get("_id")
    assert body["email"] == email.lower()
    assert body["name"] == "Happy Tester"
    assert body.get("referral_code")


# --- Duplicate email exact-string check ---
def test_register_duplicate_returns_400_exact_detail(session):
    email = _unique_email("dup")
    r1 = session.post(f"{API}/auth/register", json={
        "email": email, "password": "StrongPass123!", "name": "Dup A"
    })
    assert r1.status_code == 200, r1.text
    r2 = session.post(f"{API}/auth/register", json={
        "email": email, "password": "StrongPass123!", "name": "Dup B"
    })
    assert r2.status_code == 400
    assert r2.json().get("detail") == "Email already registered"


# --- Padded whitespace / mixed casing dedupe ---
def test_register_padded_whitespace_trimmed(session):
    raw_email = _unique_email("pad")
    padded = f"  {raw_email.upper()}  "
    r = session.post(f"{API}/auth/register", json={
        "email": padded, "password": "StrongPass123!", "name": "  Padded Name  "
    })
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["email"] == raw_email.lower()
    assert body["name"] == "Padded Name"


def test_register_duplicate_case_whitespace_variant_blocked(session):
    base = _unique_email("case")
    r1 = session.post(f"{API}/auth/register", json={
        "email": base, "password": "StrongPass123!", "name": "Case A"
    })
    assert r1.status_code == 200, r1.text
    # Try upper + padded variant
    variant = f"  {base.upper()}  "
    r2 = session.post(f"{API}/auth/register", json={
        "email": variant, "password": "StrongPass123!", "name": "Case B"
    })
    assert r2.status_code == 400
    assert r2.json().get("detail") == "Email already registered"


# --- Referral silent-ignore ---
def test_register_bad_referral_code_still_succeeds(session):
    email = _unique_email("badref")
    r = session.post(f"{API}/auth/register", json={
        "email": email, "password": "StrongPass123!",
        "name": "Bad Ref", "referral_code": "NEVEREVER99"
    })
    assert r.status_code == 200, r.text
    # referred_by shouldn't be set — user got their own code though
    assert r.json().get("referral_code")


def test_register_empty_referral_code_succeeds(session):
    email = _unique_email("emptyref")
    r = session.post(f"{API}/auth/register", json={
        "email": email, "password": "StrongPass123!",
        "name": "Empty Ref", "referral_code": ""
    })
    assert r.status_code == 200, r.text


# --- Pydantic validation ---
def test_register_invalid_email_returns_422(session):
    r = session.post(f"{API}/auth/register", json={
        "email": "not-an-email", "password": "StrongPass123!", "name": "Bad Email"
    })
    assert r.status_code == 422
    text = r.text.lower()
    # Pydantic v2 EmailStr error mentions '@-sign' or 'valid email'
    assert ("@-sign" in text) or ("valid email" in text)


def test_register_missing_password_returns_422(session):
    r = session.post(f"{API}/auth/register", json={
        "email": _unique_email("nopwd"), "name": "No Pwd"
    })
    assert r.status_code == 422
    body = r.json()
    # Find password field-required error
    found = False
    for err in body.get("detail", []):
        loc = err.get("loc", [])
        if "password" in loc and err.get("type", "").startswith("missing"):
            found = True
            break
    # If pydantic uses different wording, fall back to string search
    if not found:
        assert "password" in r.text.lower() and ("required" in r.text.lower() or "missing" in r.text.lower())


def test_register_short_password_behavior(session):
    """UserCreate has password: str with no min_length. Document actual behavior."""
    r = session.post(f"{API}/auth/register", json={
        "email": _unique_email("shortpwd"), "password": "12", "name": "Short Pwd"
    })
    # Pydantic model has no min_length constraint — expect 200.
    # Test is informational; assert it does NOT return 500.
    assert r.status_code in (200, 422), r.text


# --- Login regression ---
def test_login_after_register(session):
    email = _unique_email("login")
    pwd = "LoginPass123!"
    r = session.post(f"{API}/auth/register", json={
        "email": email, "password": pwd, "name": "Login Tester"
    })
    assert r.status_code == 200, r.text
    r2 = session.post(f"{API}/auth/login", json={"email": email, "password": pwd})
    assert r2.status_code == 200, r2.text
    assert r2.json().get("access_token")


# --- Regression: ad-reward compliance 410 ---
def test_ad_reward_still_410(session):
    # Admin login
    lr = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert lr.status_code == 200, lr.text
    token = lr.json()["access_token"]
    r = requests.post(
        f"{API}/users/ad-reward",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={},
    )
    assert r.status_code == 410, f"Expected 410, got {r.status_code}: {r.text}"


# --- Regression: beta bug-reports 201 ---
def test_beta_bug_report_201(session):
    payload = {
        "name": "TEST Regression",
        "email": _unique_email("bugrep"),
        "device_model": "Pixel 7",
        "android_version": "14",
        "app_screen": "Signup",
        "severity": "Minor",
        "what_happened": "TEST_ regression bug report from signup fix test suite.",
    }
    r = requests.post(f"{API}/beta/bug-reports", json=payload)
    assert r.status_code == 201, f"Expected 201, got {r.status_code}: {r.text}"


# --- Backend log format check ---
def test_backend_logs_contain_register_reason_and_no_password(session):
    """After a register call, log line 'auth.register endpoint=/api/auth/register status=... reason=...' must exist."""
    marker_email = _unique_email("logcheck")
    marker_pwd = "SuperSecretPwd_UNIQUE_ABCDEF_123!"
    r = session.post(f"{API}/auth/register", json={
        "email": marker_email, "password": marker_pwd, "name": "Log Check"
    })
    assert r.status_code == 200, r.text
    time.sleep(3.0)

    import glob, time as _t
    log_paths = sorted(glob.glob("/var/log/supervisor/backend.*.log"))
    assert log_paths, "No backend supervisor logs found"

    def _read_all():
        buf = ""
        for p in log_paths:
            try:
                with open(p, "rb") as f:
                    try:
                        f.seek(-300_000, 2)
                    except OSError:
                        f.seek(0)
                    buf += f.read().decode("utf-8", errors="replace") + "\n"
            except Exception:
                pass
        return buf

    # Retry — supervisor may buffer stderr for a few seconds.
    # Backend lowercases the email before logging, so compare in lowercase.
    marker_lower = marker_email.lower()
    combined = ""
    for _ in range(10):
        combined = _read_all()
        if marker_lower in combined:
            break
        _t.sleep(1.0)

    # Check format present at least once
    pattern = re.compile(r"auth\.register endpoint=/api/auth/register status=\d+.*reason=")
    assert pattern.search(combined), "Expected 'auth.register endpoint=... status=... reason=...' log line not found"

    # Ensure the marker email is in logs (proves this test's call was logged)
    assert marker_lower in combined, "Register call for marker email was not logged"

    # Ensure the password is NEVER in the logs
    assert marker_pwd not in combined, "SECURITY: Password appeared in backend logs!"
