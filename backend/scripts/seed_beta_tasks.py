"""
Standalone script to seed the 5 SAMSON beta tasks directly into MongoDB.

Usage (from /app/backend/):
    python -m scripts.seed_beta_tasks               # idempotent (skips duplicates)
    python -m scripts.seed_beta_tasks --replace     # deletes existing beta tasks and reinserts

Reads MONGO_URL and DB_NAME from backend/.env.
"""
import asyncio
import argparse
import os
import sys
from pathlib import Path
from datetime import datetime

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load backend/.env
ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")

# Reuse the exact same task list as the admin endpoint
sys.path.insert(0, str(ROOT))
from routes.admin import BETA_TASKS  # noqa: E402


async def main(replace: bool) -> None:
    mongo_url = os.environ["MONGO_URL"]
    db_name = os.environ.get("DB_NAME", "vara_db")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    deleted = 0
    if replace:
        res = await db.tasks.delete_many({"beta": True})
        deleted = res.deleted_count
        print(f"[seed_beta_tasks] deleted {deleted} existing beta tasks")

    now = datetime.utcnow()
    inserted, skipped = [], []
    for task in BETA_TASKS:
        existing = await db.tasks.find_one({"title": task["title"]})
        if existing and not replace:
            skipped.append(task["title"])
            continue
        doc = {**task, "created_at": now, "completion_count": 0}
        result = await db.tasks.insert_one(doc)
        inserted.append((str(result.inserted_id), task["title"], task["reward_amount"]))

    print(f"[seed_beta_tasks] DB: {db_name}")
    print(f"[seed_beta_tasks] deleted: {deleted}")
    print(f"[seed_beta_tasks] inserted: {len(inserted)}")
    for _id, title, reward in inserted:
        print(f"  + {_id}  ${reward:>5.2f}  {title}")
    print(f"[seed_beta_tasks] skipped (already exist): {len(skipped)}")
    for title in skipped:
        print(f"  = {title}")
    total = await db.tasks.count_documents({"beta": True})
    print(f"[seed_beta_tasks] total beta tasks in DB: {total}")

    client.close()


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--replace", action="store_true", help="Delete existing beta tasks first")
    args = ap.parse_args()
    asyncio.run(main(args.replace))
