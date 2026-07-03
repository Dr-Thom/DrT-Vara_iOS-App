"""Admin-only routes. All endpoints require role='admin'."""
from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
import logging

from routes.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])

mongo_url = os.environ.get("MONGO_URL")
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get("DB_NAME", "vara_db")]


def _require_admin(user: dict) -> None:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")


# ---- SAMSON Beta Tasks -------------------------------------------------------
# The exact 5 tasks specified for the beta launch. Keeping this list in code
# so the seed is idempotent and reviewable in git history.
BETA_TASKS = [
    {
        "title": "Complete Profile Check",
        "description": "Open your profile and verify your email, name, and payout method are set.",
        "task_type": "data_entry",
        "reward_amount": 0.10,
        "estimated_time": 1,
        "verification_type": "self_reported",
        "is_active": True,
        "beta": True,
    },
    {
        "title": "Watch Rewarded Video",
        "description": "Watch a short rewarded video ad from the Tasks screen.",
        "task_type": "video",
        "reward_amount": 0.05,
        "estimated_time": 1,
        "verification_type": "self_reported",
        "is_active": True,
        "beta": True,
    },
    {
        "title": "Visit Offers Screen",
        "description": "Open the Offers screen and browse available surveys/offerwalls.",
        "task_type": "data_entry",
        "reward_amount": 0.10,
        "estimated_time": 1,
        "verification_type": "self_reported",
        "is_active": True,
        "beta": True,
    },
    {
        "title": "Review Withdrawal Screen",
        "description": "Open the Cash Out screen and review payout methods & thresholds.",
        "task_type": "data_entry",
        "reward_amount": 0.10,
        "estimated_time": 1,
        "verification_type": "self_reported",
        "is_active": True,
        "beta": True,
    },
    {
        "title": "Submit Beta Feedback",
        "description": "Send us your first impressions of SAMSON — what works, what doesn't. Earn $1.00.",
        "task_type": "survey",
        "reward_amount": 1.00,
        "estimated_time": 3,
        "verification_type": "self_reported",
        "is_active": True,
        "beta": True,
    },
]


@router.post("/seed-beta-tasks")
async def seed_beta_tasks(
    replace: bool = False,
    current_user: dict = Depends(get_current_user),
):
    """
    Seed the 5 SAMSON beta tasks.

    - Idempotent by default: skips tasks whose exact title already exists.
    - Pass ?replace=true to delete existing beta tasks (`beta: true`) and reinsert.

    Returns { inserted: [...], skipped: [...], deleted: N }.
    """
    _require_admin(current_user)

    deleted = 0
    if replace:
        res = await db.tasks.delete_many({"beta": True})
        deleted = res.deleted_count
        logger.info(f"seed-beta-tasks: deleted {deleted} existing beta tasks")

    inserted = []
    skipped = []
    now = datetime.utcnow()

    for task in BETA_TASKS:
        existing = await db.tasks.find_one({"title": task["title"]})
        if existing and not replace:
            skipped.append(task["title"])
            continue
        doc = {**task, "created_at": now, "completion_count": 0}
        result = await db.tasks.insert_one(doc)
        inserted.append({"id": str(result.inserted_id), "title": task["title"], "reward": task["reward_amount"]})
        logger.info(f"seed-beta-tasks: inserted '{task['title']}' (${task['reward_amount']:.2f})")

    return {
        "inserted": inserted,
        "skipped": skipped,
        "deleted": deleted,
        "total_beta_tasks": await db.tasks.count_documents({"beta": True}),
    }


@router.get("/beta-tasks")
async def list_beta_tasks(current_user: dict = Depends(get_current_user)):
    """List all beta tasks currently in the DB (admin diagnostic)."""
    _require_admin(current_user)
    tasks = await db.tasks.find({"beta": True}).to_list(100)
    for t in tasks:
        t["_id"] = str(t["_id"])
    return {"count": len(tasks), "tasks": tasks}
