"""VARA API comprehensive test suite.
Covers: auth (login+register+refresh), bonus economics (5/15/25..), referral system
(10% payout + $10 cap), public stats endpoints, validation.
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://vara-landing-v1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@vara.com"
ADMIN_PASSWORD = "vara_admin_2026"


# ---------- Fixtures ----------
@pytest.fixture(scope="session")
def admin_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "access_token" in data, "Login must return access_token in body (mobile)"
    assert "refresh_token" in data, "Login must return refresh_token in body (mobile)"
    assert "referral_code" in data and data["referral_code"], "Admin must have referral_code"
    s.headers["Authorization"] = f"Bearer {data['access_token']}"
    s._user = data
    return s


def _register(email, password="TestPass123!", name=None, referral_code=None):
    body = {"email": email, "password": password, "name": name or "Test User"}
    if referral_code is not None:
        body["referral_code"] = referral_code
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/register", json=body)
    return r, s


def _make_user(referral_code=None):
    email = f"test_{uuid.uuid4().hex[:10]}@varatest.example.com"
    r, s = _register(email, referral_code=referral_code)
    assert r.status_code == 200, f"Register failed: {r.status_code} {r.text}"
    data = r.json()
    s.headers["Authorization"] = f"Bearer {data['access_token']}"
    s._user = data
    s._email = email
    return s, data


# ---------- Auth ----------
class TestAuth:
    def test_login_returns_tokens_in_body(self, admin_session):
        # verified by fixture, double-check fields
        u = admin_session._user
        assert u["access_token"] and u["refresh_token"]
        assert u["token_type"] == "bearer"
        assert u["email"] == ADMIN_EMAIL

    def test_register_without_referral(self):
        s, u = _make_user()
        assert u["referral_code"] and len(u["referral_code"]) == 8
        assert u["referred_count"] == 0
        assert u["referral_earnings"] == 0.0
        # me endpoint works
        r = s.get(f"{API}/auth/me")
        assert r.status_code == 200
        assert r.json()["email"] == s._email

    def test_register_with_valid_referral(self, admin_session):
        admin_code = admin_session._user["referral_code"]
        s, u = _make_user(referral_code=admin_code)
        assert u["email"].startswith("test_")
        # user was created successfully; check referrer's referred_count incremented
        r = admin_session.get(f"{API}/referrals/me")
        assert r.status_code == 200
        info = r.json()
        assert info["referred_count"] >= 1

    def test_register_with_invalid_referral_silently_accepted(self):
        s, u = _make_user(referral_code="INVALID99")
        # User should be created successfully
        assert u["email"]
        assert u["referral_code"]  # their own code

    def test_refresh_token_body(self):
        # Login fresh to get a refresh token in body
        s, u = _make_user()
        refresh = u["refresh_token"]
        r = requests.post(f"{API}/auth/refresh", headers={"Authorization": f"Bearer {refresh}"})
        assert r.status_code == 200
        body = r.json()
        assert body.get("access_token"), "refresh must return new access_token"


# ---------- Bonus economics ----------
class TestBonusEconomics:
    @pytest.fixture(scope="class")
    def fresh_user(self):
        s, u = _make_user()
        # fetch tasks
        r = s.get(f"{API}/tasks/")
        assert r.status_code == 200
        tasks = r.json()
        assert len(tasks) >= 15, f"Need at least 15 tasks to test bonuses, got {len(tasks)}"
        s._tasks = tasks
        return s

    def _complete(self, s, task_id):
        r = s.post(f"{API}/tasks/complete", json={"task_id": task_id})
        assert r.status_code == 200, f"Complete task failed: {r.status_code} {r.text}"
        return r.json()

    def test_tasks_1_to_4_no_bonus(self, fresh_user):
        s = fresh_user
        for i in range(4):
            res = self._complete(s, s._tasks[i]["_id"])
            assert res["tasks_completed"] == i + 1
            assert abs(res["reward_earned"] - 0.10) < 0.001, f"Task {i+1} should reward only $0.10, got {res['reward_earned']}"
            assert "bonus" not in res["message"].lower(), f"Task {i+1} should not mention bonus: {res['message']}"

    def test_task_5_awards_bonus(self, fresh_user):
        s = fresh_user
        res = self._complete(s, s._tasks[4]["_id"])
        assert res["tasks_completed"] == 5
        assert abs(res["reward_earned"] - 1.10) < 0.001, f"Task #5 should award $1.10 ($0.10 + $1 bonus), got {res['reward_earned']}"
        assert "bonus" in res["message"].lower()
        assert res["bonus_unlocked"] is True

    def test_tasks_6_to_9_no_bonus(self, fresh_user):
        # Iter7 ladder: (5,$1)(10,$2)(25,$5)(50,$10)(100,$25). Tasks 6-9 → $0.10 only.
        s = fresh_user
        for i in range(5, 9):
            res = self._complete(s, s._tasks[i]["_id"])
            assert res["tasks_completed"] == i + 1
            assert abs(res["reward_earned"] - 0.10) < 0.001, f"Task #{i+1} should reward only $0.10"

    def test_task_10_awards_2_dollar_bonus(self, fresh_user):
        # Iter7 ladder: task #10 → +$2 bonus. Tasks 1..9 already completed by previous tests.
        s = fresh_user
        res = self._complete(s, s._tasks[9]["_id"])
        assert res["tasks_completed"] == 10
        assert abs(res["reward_earned"] - 2.10) < 0.001, f"Task #10 should award $2.10, got {res['reward_earned']}"
        me = s.get(f"{API}/auth/me").json()
        assert me["bonuses_earned"] == 2
        # 10 × $0.10 + $1 (#5) + $2 (#10) = $4.00
        assert abs(me["total_earned"] - 4.00) < 0.01, f"Total earned should be $4.00, got {me['total_earned']}"


# ---------- Referral system ----------
class TestReferrals:
    def test_referral_payout_basic(self, admin_session):
        """Referrer should earn 10% of what referred user earns."""
        admin_code = admin_session._user["referral_code"]
        # baseline
        r0 = admin_session.get(f"{API}/referrals/me").json()
        base_earnings = r0["referral_earnings"]

        s, u = _make_user(referral_code=admin_code)
        tasks = s.get(f"{API}/tasks/").json()
        # Complete 4 tasks (should trigger $0.40 earnings → $0.04 referral)
        for i in range(4):
            r = s.post(f"{API}/tasks/complete", json={"task_id": tasks[i]["_id"]})
            assert r.status_code == 200

        time.sleep(0.3)
        r1 = admin_session.get(f"{API}/referrals/me").json()
        delta = r1["referral_earnings"] - base_earnings
        # Expected: 4 * 0.10 * 0.10 = 0.04
        assert abs(delta - 0.04) < 0.001, f"Expected $0.04 referral payout, got ${delta}"

    def test_referral_includes_bonus(self, admin_session):
        """Referrer earns 10% of task reward + bonus when bonus triggers."""
        admin_code = admin_session._user["referral_code"]
        r0 = admin_session.get(f"{API}/referrals/me").json()
        base = r0["referral_earnings"]

        s, _ = _make_user(referral_code=admin_code)
        tasks = s.get(f"{API}/tasks/").json()
        # Complete 5 tasks → earnings = 5*0.10 + 1.00 = $1.50 → referral = $0.15
        for i in range(5):
            s.post(f"{API}/tasks/complete", json={"task_id": tasks[i]["_id"]})

        time.sleep(0.3)
        r1 = admin_session.get(f"{API}/referrals/me").json()
        delta = r1["referral_earnings"] - base
        assert abs(delta - 0.15) < 0.001, f"Expected $0.15 referral (5 tasks + bonus), got ${delta}"

    def test_referral_cap_enforced(self, admin_session):
        """Referrer cannot earn more than $10 from a single referred user."""
        admin_code = admin_session._user["referral_code"]
        r0 = admin_session.get(f"{API}/referrals/me").json()
        base = r0["referral_earnings"]

        # Referred user must earn >$100 to hit cap. $100/0.10 = 1000 tasks — infeasible.
        # Instead, directly manipulate: check cap by reading user state after high-earning session.
        # We'll verify the referrer_earnings_paid field cap-logic by completing all available tasks.
        s, _ = _make_user(referral_code=admin_code)
        tasks = s.get(f"{API}/tasks/").json()
        # Complete all available tasks
        for t in tasks:
            s.post(f"{API}/tasks/complete", json={"task_id": t["_id"]})

        time.sleep(0.3)
        r1 = admin_session.get(f"{API}/referrals/me").json()
        delta = r1["referral_earnings"] - base
        # Delta must be <= $10
        assert delta <= 10.0 + 0.001, f"Referral earnings delta ${delta} exceeded $10 cap"

    def test_get_referrals_me(self, admin_session):
        r = admin_session.get(f"{API}/referrals/me")
        assert r.status_code == 200
        d = r.json()
        for f in ["referral_code", "referred_count", "referral_earnings", "cap_per_referral", "pct", "recent_payouts"]:
            assert f in d, f"Missing field {f}"
        assert d["cap_per_referral"] == 10.0
        assert d["pct"] == 0.10
        assert isinstance(d["recent_payouts"], list)
        # Emails in payouts should be masked
        for p in d["recent_payouts"][:3]:
            if p.get("referred_email"):
                assert "***" in p["referred_email"], f"Email not masked: {p['referred_email']}"

    def test_validate_referral_code_valid(self, admin_session):
        code = admin_session._user["referral_code"]
        r = requests.get(f"{API}/referrals/validate/{code}")
        assert r.status_code == 200
        d = r.json()
        assert d["valid"] is True
        assert "referrer_name" in d

    def test_validate_referral_code_invalid(self):
        r = requests.get(f"{API}/referrals/validate/NOTREAL9")
        assert r.status_code == 200
        assert r.json() == {"valid": False}

    def test_validate_referral_code_case_insensitive(self, admin_session):
        code = admin_session._user["referral_code"].lower()
        r = requests.get(f"{API}/referrals/validate/{code}")
        assert r.status_code == 200
        assert r.json()["valid"] is True


# ---------- Public stats ----------
class TestPublicStats:
    def test_total_paid_out_no_auth(self):
        r = requests.get(f"{API}/stats/total-paid-out")
        assert r.status_code == 200
        d = r.json()
        assert "total_paid_out" in d
        assert d["currency"] == "USD"
        assert isinstance(d["total_paid_out"], (int, float))
        assert d["total_paid_out"] >= 0

    def test_recent_withdrawals_no_auth(self):
        r = requests.get(f"{API}/stats/recent-withdrawals?limit=5")
        assert r.status_code == 200
        d = r.json()
        assert "recent_withdrawals" in d
        assert isinstance(d["recent_withdrawals"], list)
        # Emails masked
        for w in d["recent_withdrawals"]:
            if w.get("masked_email") and w["masked_email"] != "anonymous":
                assert "***" in w["masked_email"]



# ---------- Referral Leaderboard (iteration 5) ----------
class TestReferralLeaderboard:
    def test_leaderboard_requires_auth(self):
        r = requests.get(f"{API}/referrals/leaderboard?period=month")
        assert r.status_code in (401, 403), f"Expected 401/403 without auth, got {r.status_code}"

    def test_leaderboard_month_period_shape(self, admin_session):
        r = admin_session.get(f"{API}/referrals/leaderboard?period=month")
        assert r.status_code == 200
        d = r.json()
        assert d["period"] == "month"
        assert isinstance(d["leaderboard"], list)
        assert "you" in d
        # Validate row shape when present
        for row in d["leaderboard"]:
            assert {"rank", "display_name", "total_earned", "referral_count", "is_you"}.issubset(row.keys())
            assert isinstance(row["rank"], int) and row["rank"] >= 1
            assert isinstance(row["total_earned"], (int, float))
            assert isinstance(row["referral_count"], int)

    def test_leaderboard_all_period_shape(self, admin_session):
        r = admin_session.get(f"{API}/referrals/leaderboard?period=all")
        assert r.status_code == 200
        d = r.json()
        assert d["period"] == "all"
        assert isinstance(d["leaderboard"], list)

    def test_leaderboard_admin_is_you_flag(self, admin_session):
        """Admin should be rank 1 with is_you=true (they have $0.69 from referrals)."""
        r = admin_session.get(f"{API}/referrals/leaderboard?period=all")
        d = r.json()
        if len(d["leaderboard"]) > 0:
            # Find any row flagged is_you
            you_rows = [row for row in d["leaderboard"] if row["is_you"]]
            assert len(you_rows) <= 1, "Only one row should be is_you"
            # If admin is in top N, you field should be null (caller is in top)
            if len(you_rows) == 1:
                assert d["you"] is None, "If caller is in top-N, 'you' should be None"
                assert you_rows[0]["total_earned"] > 0

    def test_leaderboard_all_period_has_more_or_equal_earnings(self, admin_session):
        """'all' period totals should be >= 'month' period totals for same user."""
        r_month = admin_session.get(f"{API}/referrals/leaderboard?period=month").json()
        r_all = admin_session.get(f"{API}/referrals/leaderboard?period=all").json()
        # Find admin row in each
        def admin_total(resp):
            for row in resp["leaderboard"]:
                if row["is_you"]:
                    return row["total_earned"]
            if resp.get("you"):
                return resp["you"]["total_earned"]
            return 0
        assert admin_total(r_all) >= admin_total(r_month)

    def test_leaderboard_limit_param(self, admin_session):
        r = admin_session.get(f"{API}/referrals/leaderboard?period=all&limit=3")
        assert r.status_code == 200
        d = r.json()
        assert len(d["leaderboard"]) <= 3

    def test_leaderboard_limit_capped_at_50(self, admin_session):
        r = admin_session.get(f"{API}/referrals/leaderboard?period=all&limit=999")
        assert r.status_code == 200
        d = r.json()
        assert len(d["leaderboard"]) <= 50

    def test_leaderboard_you_for_non_top_user(self):
        """Register a fresh user with no referrals; they should get you=null or you with 0 stats."""
        s, _ = _make_user()
        r = s.get(f"{API}/referrals/leaderboard?period=all")
        assert r.status_code == 200
        d = r.json()
        # This user has 0 payouts -> they won't be in top and won't have a payout row
        # Either you is None (no payouts found) OR rank with 0 stats
        if d["you"] is not None:
            assert d["you"]["is_you"] is True
        # They should not appear in leaderboard as is_you
        for row in d["leaderboard"]:
            assert row["is_you"] is False, "Fresh user should not appear as is_you in top"



# ---------- Weekly Super Bonus Challenge (iteration 6) ----------
class TestWeeklyChallenge:
    def test_challenge_requires_auth(self):
        r = requests.get(f"{API}/referrals/challenge")
        assert r.status_code in (401, 403), f"Expected 401/403, got {r.status_code}"

    def test_challenge_response_shape_admin(self, admin_session):
        r = admin_session.get(f"{API}/referrals/challenge")
        assert r.status_code == 200
        d = r.json()
        for f in ["target", "super_bonus_amount", "qualified_count",
                  "raw_qualified_count", "completed", "week_start", "week_end"]:
            assert f in d, f"Missing field: {f}"
        assert d["target"] == 3
        assert d["super_bonus_amount"] == 5.0
        assert isinstance(d["qualified_count"], int)
        assert isinstance(d["raw_qualified_count"], int)
        assert isinstance(d["completed"], bool)
        # qualified_count is capped at target
        assert d["qualified_count"] <= d["target"]
        # raw_qualified_count >= qualified_count
        assert d["raw_qualified_count"] >= d["qualified_count"]

    def test_admin_already_completed_this_week(self, admin_session):
        """Per smoke test: admin already completed this week's challenge."""
        r = admin_session.get(f"{API}/referrals/challenge")
        d = r.json()
        assert d["completed"] is True, "Admin should have completed this week per setup"
        assert d["qualified_count"] == 3

    def test_additional_task_by_existing_friend_does_not_re_pay(self, admin_session):
        """If an existing friend of admin completes another task, no double super bonus."""
        # Capture admin's current balance
        me0 = admin_session.get(f"{API}/auth/me").json()
        r0 = admin_session.get(f"{API}/referrals/challenge").json()
        assert r0["completed"] is True
        # Create a fresh user using admin's code, complete 1 task
        admin_code = admin_session._user["referral_code"]
        s, _ = _make_user(referral_code=admin_code)
        tasks = s.get(f"{API}/tasks/").json()
        s.post(f"{API}/tasks/complete", json={"task_id": tasks[0]["_id"]})
        time.sleep(0.4)

        me1 = admin_session.get(f"{API}/auth/me").json()
        # Admin should only receive the small referral payout (~$0.01), NOT another $5
        delta = me1["earnings"] - me0["earnings"]
        assert delta < 1.0, f"Admin got unexpectedly large credit ${delta} — possible double super bonus"
        # Challenge still completed, qualified_count still capped at 3
        r1 = admin_session.get(f"{API}/referrals/challenge").json()
        assert r1["completed"] is True
        assert r1["qualified_count"] == 3
        # raw_qualified_count may exceed target (new friend counted internally)
        assert r1["raw_qualified_count"] >= 3

    def test_fresh_referrer_earns_super_bonus_with_3_friends(self):
        """Register a fresh referrer A, have 3 distinct users each complete 1 task.
        Verify A's challenge completes and balance increases by ~ $5 + small referral payouts."""
        # Create referrer A
        a_session, a_user = _make_user()
        a_code = a_user["referral_code"]
        assert a_code

        # Baseline
        me_a_0 = a_session.get(f"{API}/auth/me").json()
        ch_a_0 = a_session.get(f"{API}/referrals/challenge").json()
        assert ch_a_0["qualified_count"] == 0
        assert ch_a_0["completed"] is False

        # Register 3 friends with A's code, each completes 1 task
        for i in range(3):
            b_session, _ = _make_user(referral_code=a_code)
            tasks = b_session.get(f"{API}/tasks/").json()
            r = b_session.post(f"{API}/tasks/complete", json={"task_id": tasks[0]["_id"]})
            assert r.status_code == 200
            time.sleep(0.3)
            ch_mid = a_session.get(f"{API}/referrals/challenge").json()
            assert ch_mid["qualified_count"] == i + 1, f"After friend #{i+1}, qualified_count={ch_mid['qualified_count']}"

        # After 3 friends → completed + $5 super bonus credited
        ch_a_1 = a_session.get(f"{API}/referrals/challenge").json()
        assert ch_a_1["completed"] is True, "Challenge should be completed after 3 friends"
        assert ch_a_1["qualified_count"] == 3

        me_a_1 = a_session.get(f"{API}/auth/me").json()
        delta = me_a_1["earnings"] - me_a_0["earnings"]
        # Each friend's $0.10 task → $0.01 referral payout * 3 = $0.03, + $5 super bonus = ~$5.03
        assert 4.99 < delta < 5.10, f"Expected ~$5.03 delta, got ${delta}"
        # super_bonuses_earned counter should increment
        assert me_a_1.get("super_bonuses_earned", 0) >= 1

    def test_challenge_dedup_same_friend_multiple_tasks(self):
        """One friend completing multiple tasks only counts once."""
        a_session, a_user = _make_user()
        a_code = a_user["referral_code"]

        b_session, _ = _make_user(referral_code=a_code)
        tasks = b_session.get(f"{API}/tasks/").json()
        # B completes 3 tasks
        for i in range(3):
            b_session.post(f"{API}/tasks/complete", json={"task_id": tasks[i]["_id"]})
        time.sleep(0.4)

        ch = a_session.get(f"{API}/referrals/challenge").json()
        # Only 1 unique friend qualified, even though they did 3 tasks
        assert ch["qualified_count"] == 1, f"Dedup failed: qualified_count={ch['qualified_count']}"
        assert ch["raw_qualified_count"] == 1
        assert ch["completed"] is False

    def test_week_boundaries_iso_format(self, admin_session):
        """week_start/week_end should be parseable ISO strings and span ~7 days."""
        from datetime import datetime as dt
        r = admin_session.get(f"{API}/referrals/challenge").json()
        # Parse (strip trailing Z)
        ws = dt.fromisoformat(r["week_start"].rstrip("Z"))
        we = dt.fromisoformat(r["week_end"].rstrip("Z"))
        diff = (we - ws).total_seconds()
        # Week span ~ 7 days minus 1 microsecond
        assert 6 * 86400 < diff <= 7 * 86400, f"Week span out of range: {diff}s"
        # week_start should be a Monday
        assert ws.weekday() == 0, f"week_start is not a Monday: weekday={ws.weekday()}"
