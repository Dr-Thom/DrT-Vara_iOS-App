"""Iteration 7 — Trust score, daily streak, bonus ladder, and tier-based withdrawal tests.

Covers:
- GET /api/users/me/stats schema + auth gate
- New bonus ladder (5,$1)(10,$2)(25,$5)
- Streak logic (same-day no increment, gap=reset, multi-day chain)
- Streak multiplier on rewards (1.1× at 3d) — bonuses NOT multiplied
- Trust +1 per task; +2 after withdrawal
- Withdrawal tier gate: building tier → status=pending, 24h delay; daily cap $25
- Auth response shapes include trust_score, current_streak, longest_streak
"""
import os
import uuid
import pytest
import requests
from datetime import datetime, timedelta
from pymongo import MongoClient
from bson import ObjectId

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://vara-landing-v1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@vara.com"
ADMIN_PASSWORD = "vara_admin_2026"

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "vara_db")


def _db():
    c = MongoClient(MONGO_URL)
    return c[DB_NAME], c


def _register(referral_code=None):
    email = f"test_iter7_{uuid.uuid4().hex[:10]}@varatest.example.com"
    body = {"email": email, "password": "TestPass123!", "name": "Iter7"}
    if referral_code is not None:
        body["referral_code"] = referral_code
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/register", json=body)
    assert r.status_code == 200, f"register failed {r.status_code}: {r.text}"
    data = r.json()
    s.headers["Authorization"] = f"Bearer {data['access_token']}"
    s._user = data
    s._email = email
    return s, data


def _get_active_task_id():
    """Pick a single active task id for completion. We re-fetch per call to avoid running out."""
    s = requests.Session()
    # quick anonymous task list won't work — caller will use authed session
    raise NotImplementedError


def _complete_one_task(s):
    r = s.get(f"{API}/tasks/")
    assert r.status_code == 200, r.text
    tasks = r.json()
    if not tasks:
        return None
    tid = tasks[0]["_id"]
    rc = s.post(f"{API}/tasks/complete", json={"task_id": tid})
    assert rc.status_code == 200, rc.text
    return rc.json()


# ============================================================
# /api/users/me/stats
# ============================================================
class TestStatsEndpoint:
    def test_requires_auth(self):
        r = requests.get(f"{API}/users/me/stats")
        assert r.status_code in (401, 403)

    def test_fresh_user_stats_shape(self):
        s, u = _register()
        r = s.get(f"{API}/users/me/stats")
        assert r.status_code == 200, r.text
        data = r.json()
        # Trust block
        assert data["trust"]["score"] == 50
        assert data["trust"]["tier"] == "building"
        assert data["trust"]["withdrawal_delay_hours"] == 24
        assert data["trust"]["min_withdrawal"] == 5.0
        assert data["trust"]["max_daily_withdrawal"] == 25.0
        # Streak block
        assert data["streak"]["current"] == 0
        assert data["streak"]["longest"] == 0
        assert data["streak"]["multiplier"] == 1.0
        assert data["streak"]["tier"] == "none"
        # Bonuses block
        assert data["bonuses"]["earned_count"] == 0
        assert data["bonuses"]["next"] == {"threshold": 5, "amount": 1.0}
        ladder = data["bonuses"]["ladder"]
        assert {"threshold": 5, "amount": 1.0} in ladder
        assert {"threshold": 10, "amount": 2.0} in ladder
        assert {"threshold": 25, "amount": 5.0} in ladder
        assert {"threshold": 50, "amount": 10.0} in ladder
        assert {"threshold": 100, "amount": 25.0} in ladder


# ============================================================
# Bonus ladder math (full e2e)
# ============================================================
class TestBonusLadder:
    def test_first_5_tasks_pay_1_dollar_at_5(self):
        s, u = _register()
        # Tasks 1..4 → no bonus
        for i in range(1, 5):
            res = _complete_one_task(s)
            assert res is not None, f"ran out of tasks at #{i}"
            assert res["tasks_completed"] == i
            # total_earnings increment ≈ 0.10 (no bonus, no streak yet — streak=1, mult=1)
        # Task 5 → +$1
        res5 = _complete_one_task(s)
        assert res5["tasks_completed"] == 5
        # message should mention milestone
        assert "milestone" in res5["message"].lower() or "$1" in res5["message"]
        # Reward earned this call should be ~ $1.10 ($0.10 task + $1 bonus)
        assert abs(res5["reward_earned"] - 1.10) < 0.001, f"got {res5['reward_earned']}"

    def test_task_10_awards_2_dollar_bonus(self):
        s, u = _register()
        for i in range(1, 10):
            res = _complete_one_task(s)
            assert res is not None
        res10 = _complete_one_task(s)
        assert res10["tasks_completed"] == 10
        assert abs(res10["reward_earned"] - 2.10) < 0.001, f"got {res10['reward_earned']}"
        # stats should reflect 2 bonuses earned, next at 25
        stats = s.get(f"{API}/users/me/stats").json()
        assert stats["bonuses"]["earned_count"] == 2
        assert stats["bonuses"]["next"] == {"threshold": 25, "amount": 5.0}

    def test_total_earned_after_10_tasks(self):
        s, u = _register()
        for _ in range(10):
            _complete_one_task(s)
        r = s.get(f"{API}/auth/me")
        u2 = r.json()
        # 10 tasks × $0.10 = $1.00 + $1 (#5) + $2 (#10) = $4.00
        assert abs(u2["total_earned"] - 4.00) < 0.01, f"got {u2['total_earned']}"
        assert u2["tasks_completed"] == 10


# ============================================================
# Streak logic
# ============================================================
class TestStreak:
    def test_first_task_sets_streak_to_1(self):
        s, u = _register()
        _complete_one_task(s)
        r = s.get(f"{API}/auth/me").json()
        assert r["current_streak"] == 1
        assert r["longest_streak"] == 1

    def test_same_day_tasks_dont_increment(self):
        s, u = _register()
        for _ in range(3):
            _complete_one_task(s)
        r = s.get(f"{API}/auth/me").json()
        assert r["current_streak"] == 1, "Multiple same-day tasks should keep streak=1"

    def test_streak_3_days_applies_1_1_multiplier(self):
        """Simulate yesterday + day-before-yesterday in DB → 3rd-day completion uses 1.1× multiplier."""
        s, u = _register()
        db, client = _db()
        try:
            uid = ObjectId(u["_id"])
            # Set last_active_date = yesterday, current_streak=2 → today's task should make it 3
            yesterday = datetime.utcnow().date() - timedelta(days=1)
            db.users.update_one(
                {"_id": uid},
                {"$set": {
                    "last_active_date": datetime(yesterday.year, yesterday.month, yesterday.day),
                    "current_streak": 2,
                    "longest_streak": 2,
                }}
            )
            res = _complete_one_task(s)
            # Today's task: streak becomes 3 → multiplier=1.1 → reward = 0.10*1.1 = $0.11 (no bonus, only 1st task for this user)
            assert abs(res["reward_earned"] - 0.11) < 0.001, f"got {res['reward_earned']}"
            r = s.get(f"{API}/auth/me").json()
            assert r["current_streak"] == 3
            stats = s.get(f"{API}/users/me/stats").json()
            assert stats["streak"]["multiplier"] == 1.1
            assert stats["streak"]["tier"] == "warming"
        finally:
            client.close()

    def test_streak_7_days_applies_1_25_multiplier_and_trust_boost(self):
        s, u = _register()
        db, client = _db()
        try:
            uid = ObjectId(u["_id"])
            yesterday = datetime.utcnow().date() - timedelta(days=1)
            db.users.update_one(
                {"_id": uid},
                {"$set": {
                    "last_active_date": datetime(yesterday.year, yesterday.month, yesterday.day),
                    "current_streak": 6,
                    "longest_streak": 6,
                    "trust_score": 50,
                }}
            )
            res = _complete_one_task(s)
            # 0.10 * 1.25 = 0.125
            assert abs(res["reward_earned"] - 0.125) < 0.001, f"got {res['reward_earned']}"
            r = s.get(f"{API}/auth/me").json()
            assert r["current_streak"] == 7
            # Trust: +1 (task) + 5 (7-day streak crossing) = +6 → 50→56
            assert r["trust_score"] == 56, f"trust_score={r['trust_score']}"
        finally:
            client.close()

    def test_streak_14_days_multiplier_with_bonus_NOT_multiplied(self):
        """At 14-day streak, task #5 should give 0.10*1.5 + 1.00 (bonus NOT multiplied)."""
        s, u = _register()
        db, client = _db()
        try:
            uid = ObjectId(u["_id"])
            # Complete 4 tasks today first to set up
            for _ in range(4):
                _complete_one_task(s)
            yesterday = datetime.utcnow().date() - timedelta(days=1)
            db.users.update_one(
                {"_id": uid},
                {"$set": {
                    "last_active_date": datetime(yesterday.year, yesterday.month, yesterday.day),
                    "current_streak": 13,
                    "longest_streak": 13,
                }}
            )
            res5 = _complete_one_task(s)
            # task#5 → 0.10*1.5 + 1.00 = 0.15 + 1.00 = 1.15
            assert abs(res5["reward_earned"] - 1.15) < 0.001, f"got {res5['reward_earned']}"
        finally:
            client.close()

    def test_streak_gap_resets(self):
        s, u = _register()
        db, client = _db()
        try:
            uid = ObjectId(u["_id"])
            three_days_ago = datetime.utcnow().date() - timedelta(days=3)
            db.users.update_one(
                {"_id": uid},
                {"$set": {
                    "last_active_date": datetime(three_days_ago.year, three_days_ago.month, three_days_ago.day),
                    "current_streak": 5,
                    "longest_streak": 5,
                }}
            )
            _complete_one_task(s)
            r = s.get(f"{API}/auth/me").json()
            assert r["current_streak"] == 1, "Gap should reset to 1"
            assert r["longest_streak"] == 5, "Longest preserved"
        finally:
            client.close()


# ============================================================
# Trust system
# ============================================================
class TestTrust:
    def test_trust_increments_per_task(self):
        s, u = _register()
        assert u["trust_score"] == 50
        _complete_one_task(s)
        r = s.get(f"{API}/auth/me").json()
        assert r["trust_score"] == 51

    def test_auth_endpoints_return_trust_streak_fields(self):
        s, u = _register()
        # register response
        for k in ("trust_score", "current_streak", "longest_streak"):
            assert k in u, f"missing {k} in register response"
        # login response
        login = requests.post(f"{API}/auth/login", json={"email": s._email, "password": "TestPass123!"}).json()
        for k in ("trust_score", "current_streak", "longest_streak"):
            assert k in login, f"missing {k} in login response"
        # /me response
        me = s.get(f"{API}/auth/me").json()
        for k in ("trust_score", "current_streak", "longest_streak"):
            assert k in me, f"missing {k} in /me response"


# ============================================================
# Tier-based withdrawal
# ============================================================
class TestWithdrawalTierGate:
    def _grant_balance(self, user_id, amount):
        db, client = _db()
        try:
            db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$inc": {"earnings": amount, "total_earned": amount}}
            )
        finally:
            client.close()

    def test_building_tier_24h_delay_pending(self):
        s, u = _register()
        self._grant_balance(u["_id"], 20.0)
        r = s.post(f"{API}/withdrawal/request", json={
            "amount": 10.0, "method": "gcash", "account_details": "+639123456789"
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "pending"
        assert "24h" in data["message"] or "24 h" in data["message"].lower() or "hold" in data["message"].lower()

    def test_building_tier_daily_cap_25(self):
        s, u = _register()
        self._grant_balance(u["_id"], 50.0)
        # First withdrawal $20 — OK
        r1 = s.post(f"{API}/withdrawal/request", json={"amount": 20.0, "method": "gcash", "account_details": "X"})
        assert r1.status_code == 200, r1.text
        # Second withdrawal $10 → 30 > 25 cap → 400
        r2 = s.post(f"{API}/withdrawal/request", json={"amount": 10.0, "method": "gcash", "account_details": "X"})
        assert r2.status_code == 400, r2.text
        msg = r2.json().get("detail", "")
        assert "25" in msg or "limit" in msg.lower(), f"unexpected msg: {msg}"

    def test_withdrawal_min_5(self):
        s, u = _register()
        self._grant_balance(u["_id"], 20.0)
        r = s.post(f"{API}/withdrawal/request", json={"amount": 1.0, "method": "gcash", "account_details": "X"})
        assert r.status_code == 400
        assert "5" in r.json()["detail"]

    def test_successful_withdrawal_adds_2_trust(self):
        s, u = _register()
        self._grant_balance(u["_id"], 10.0)
        before = s.get(f"{API}/users/me/stats").json()["trust"]["score"]
        r = s.post(f"{API}/withdrawal/request", json={"amount": 5.0, "method": "gcash", "account_details": "X"})
        assert r.status_code == 200, r.text
        after = s.get(f"{API}/users/me/stats").json()["trust"]["score"]
        assert after == before + 2, f"{before}→{after}"

    def test_trusted_tier_instant_withdrawal(self):
        """Bump trust to 80 in DB → withdrawal status=approved with 0h delay."""
        s, u = _register()
        db, client = _db()
        try:
            uid = ObjectId(u["_id"])
            db.users.update_one(
                {"_id": uid},
                {"$set": {"trust_score": 80, "earnings": 50.0, "total_earned": 50.0}}
            )
            r = s.post(f"{API}/withdrawal/request", json={"amount": 10.0, "method": "gcash", "account_details": "X"})
            assert r.status_code == 200, r.text
            data = r.json()
            assert data["status"] == "approved", data
            stats = s.get(f"{API}/users/me/stats").json()
            assert stats["trust"]["tier"] == "trusted"
            assert stats["trust"]["max_daily_withdrawal"] == 100.0
            assert stats["trust"]["withdrawal_delay_hours"] == 0
        finally:
            client.close()
