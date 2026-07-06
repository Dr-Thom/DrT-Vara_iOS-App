"""Tests for SAMSON beta task seed endpoint & script."""
import os
import subprocess
import pytest
import requests
from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path

BACKEND_DIR = Path("/app/backend")
load_dotenv(BACKEND_DIR / ".env")

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://vara-landing-v1.preview.emergentagent.com").rstrip("/")
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ.get("DB_NAME", "vara_db")

ADMIN_EMAIL = "admin@vara.com"
ADMIN_PASSWORD = "vara_admin_2026"

EXPECTED = {
    "Complete Profile Check": 0.10,
    "Watch Rewarded Video": 0.05,
    "Visit Offers Screen": 0.10,
    "Review Withdrawal Screen": 0.10,
    "Submit Beta Feedback": 1.00,
}


@pytest.fixture(scope="module")
def mongo():
    c = MongoClient(MONGO_URL)
    yield c[DB_NAME]
    c.close()


@pytest.fixture(scope="module")
def clean_beta(mongo):
    # Ensure clean starting state - remove any prior beta tasks and any tasks with these titles
    mongo.tasks.delete_many({"beta": True})
    mongo.tasks.delete_many({"title": {"$in": list(EXPECTED.keys())}})
    yield
    # cleanup after tests
    mongo.tasks.delete_many({"beta": True})
    mongo.tasks.delete_many({"title": {"$in": list(EXPECTED.keys())}})


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data.get("role") == "admin"
    return data["access_token"]


@pytest.fixture(scope="module")
def user_token():
    """Register a non-admin user for 403 test."""
    email = f"TEST_betauser_{os.getpid()}@example.com"
    r = requests.post(f"{BASE_URL}/api/auth/register",
                      json={"email": email, "password": "TestPass123!", "name": "Beta User"}, timeout=15)
    assert r.status_code in (200, 201), f"Register failed: {r.text}"
    return r.json()["access_token"], email


def _auth(t):
    return {"Authorization": f"Bearer {t}"}


class TestBetaSeed:

    def test_1_first_seed_inserts_5(self, clean_beta, admin_token, mongo):
        r = requests.post(f"{BASE_URL}/api/admin/seed-beta-tasks", headers=_auth(admin_token), timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert len(data["inserted"]) == 5
        assert data["skipped"] == []
        assert data["deleted"] == 0
        titles = {i["title"] for i in data["inserted"]}
        assert titles == set(EXPECTED.keys())
        # verify DB
        assert mongo.tasks.count_documents({"beta": True}) == 5

    def test_2_seed_idempotent(self, admin_token, mongo):
        r = requests.post(f"{BASE_URL}/api/admin/seed-beta-tasks", headers=_auth(admin_token), timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["inserted"] == []
        assert set(data["skipped"]) == set(EXPECTED.keys())
        assert data["deleted"] == 0
        assert mongo.tasks.count_documents({"beta": True}) == 5

    def test_3_non_admin_forbidden(self, user_token):
        token, _ = user_token
        r = requests.post(f"{BASE_URL}/api/admin/seed-beta-tasks", headers=_auth(token), timeout=15)
        assert r.status_code == 403

    def test_4_unauth_401(self):
        r = requests.post(f"{BASE_URL}/api/admin/seed-beta-tasks", timeout=15)
        assert r.status_code == 401

    def test_5_admin_list_beta_tasks(self, admin_token):
        r = requests.get(f"{BASE_URL}/api/admin/beta-tasks", headers=_auth(admin_token), timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["count"] == 5
        titles = {t["title"] for t in data["tasks"]}
        assert titles == set(EXPECTED.keys())

    def test_6_tasks_endpoint_shows_beta_tasks(self, admin_token):
        # Note: /api/tasks/ filters completed tasks by user; admin fresh has none completed for these
        r = requests.get(f"{BASE_URL}/api/tasks/", headers=_auth(admin_token), timeout=15)
        assert r.status_code == 200, r.text
        tasks = r.json()
        beta_map = {t["title"]: t for t in tasks if t["title"] in EXPECTED}
        assert set(beta_map.keys()) == set(EXPECTED.keys()), \
            f"Missing beta tasks in /api/tasks: got {set(beta_map.keys())}"
        for title, expected_reward in EXPECTED.items():
            t = beta_map[title]
            assert abs(t["reward_amount"] - expected_reward) < 1e-6, \
                f"{title} reward {t['reward_amount']} != {expected_reward}"
            assert t["is_active"] is True
            assert t["task_type"] in {"survey", "video", "social", "data_entry", "quiz"}

    def test_7_replace_flag_deletes_and_reinserts(self, admin_token, mongo):
        # snapshot ids before
        before_ids = {str(t["_id"]) for t in mongo.tasks.find({"beta": True})}
        assert len(before_ids) == 5

        r = requests.post(f"{BASE_URL}/api/admin/seed-beta-tasks?replace=true",
                          headers=_auth(admin_token), timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["deleted"] == 5
        assert len(data["inserted"]) == 5

        after_ids = {str(t["_id"]) for t in mongo.tasks.find({"beta": True})}
        assert len(after_ids) == 5
        assert before_ids.isdisjoint(after_ids), "IDs should be new after replace"

    def test_8_non_beta_tasks_not_affected_by_replace(self, admin_token, mongo):
        # Insert a decoy non-beta task
        decoy_id = mongo.tasks.insert_one({
            "title": "TEST_DECOY_non_beta",
            "description": "decoy",
            "task_type": "survey",
            "reward_amount": 0.25,
            "estimated_time": 1,
            "verification_type": "self_reported",
            "is_active": True,
        }).inserted_id
        try:
            r = requests.post(f"{BASE_URL}/api/admin/seed-beta-tasks?replace=true",
                              headers=_auth(admin_token), timeout=15)
            assert r.status_code == 200
            data = r.json()
            assert data["deleted"] == 5  # only 5 beta tasks deleted, not the decoy
            assert mongo.tasks.find_one({"_id": decoy_id}) is not None
        finally:
            mongo.tasks.delete_one({"_id": decoy_id})

    def test_9_standalone_script_idempotent(self, mongo):
        # Clean first
        mongo.tasks.delete_many({"beta": True})
        # Run 1
        r1 = subprocess.run(["python", "-m", "scripts.seed_beta_tasks"],
                            cwd=str(BACKEND_DIR), capture_output=True, text=True, timeout=30)
        assert r1.returncode == 0, f"stderr: {r1.stderr}\nstdout: {r1.stdout}"
        assert "inserted: 5" in r1.stdout
        assert mongo.tasks.count_documents({"beta": True}) == 5

        # Run 2 - idempotent
        r2 = subprocess.run(["python", "-m", "scripts.seed_beta_tasks"],
                            cwd=str(BACKEND_DIR), capture_output=True, text=True, timeout=30)
        assert r2.returncode == 0, r2.stderr
        assert "inserted: 0" in r2.stdout
        assert "skipped (already exist): 5" in r2.stdout
        assert mongo.tasks.count_documents({"beta": True}) == 5

        # Run with --replace
        r3 = subprocess.run(["python", "-m", "scripts.seed_beta_tasks", "--replace"],
                            cwd=str(BACKEND_DIR), capture_output=True, text=True, timeout=30)
        assert r3.returncode == 0, r3.stderr
        assert "deleted 5" in r3.stdout
        assert "inserted: 5" in r3.stdout
        assert mongo.tasks.count_documents({"beta": True}) == 5
