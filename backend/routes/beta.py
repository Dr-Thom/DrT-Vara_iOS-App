"""
SAMSON Closed Beta portal API.

Public (no auth):
    POST /api/beta/bug-reports       — submit a bug report
    POST /api/beta/suggestions       — submit a suggestion

Admin (either shared-secret key OR admin JWT):
    GET  /api/beta/export.csv        — CSV of all submissions
                                       auth via ?key=<BETA_EXPORT_KEY> OR admin JWT
    GET  /api/beta/counts            — {bugs: N, suggestions: N, latest: ts}
"""
import csv
import io
import logging
import os
from datetime import datetime, timezone
from typing import List, Literal, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

from routes.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/beta", tags=["beta"])

mongo_url = os.environ["MONGO_URL"]
_client = AsyncIOMotorClient(mongo_url)
db = _client[os.environ.get("DB_NAME", "vara_db")]


# ---------- Models -----------------------------------------------------------
Severity = Literal["Critical", "Major", "Minor"]


class BugReportIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    device_model: str = Field(min_length=1, max_length=100)
    android_version: str = Field(min_length=1, max_length=50)
    app_screen: str = Field(min_length=1, max_length=100)
    severity: Severity
    description: str = Field(min_length=5, max_length=5000, alias="what_happened")
    screenshot_link: Optional[str] = Field(default=None, max_length=500)

    class Config:
        populate_by_name = True


class SuggestionIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    category: str = Field(min_length=1, max_length=80)
    details: str = Field(min_length=5, max_length=5000)


VALID_CHECKLIST_ITEMS = {"login", "task", "ad", "offers", "dashboard", "report"}


class ActivityIn(BaseModel):
    email: EmailStr
    item_id: Literal["login", "task", "ad", "offers", "dashboard", "report"]
    # Optional client-supplied date (YYYY-MM-DD). Defaults to server UTC date.
    date: Optional[str] = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")


# ---------- Helpers ----------------------------------------------------------
def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _admin_ok(request: Request, key: Optional[str]) -> None:
    """Allow either ?key=<BETA_EXPORT_KEY> or a valid admin JWT."""
    export_key = os.environ.get("BETA_EXPORT_KEY", "")
    if export_key and key and key == export_key:
        return
    # Fall back to admin JWT
    try:
        user = await get_current_user(request)
    except HTTPException:
        raise HTTPException(status_code=401, detail="Admin key or JWT required")
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")


# ---------- Public endpoints -------------------------------------------------
@router.post("/bug-reports", status_code=201)
async def submit_bug_report(payload: BugReportIn, request: Request):
    doc = {
        **payload.model_dump(by_alias=False),
        "created_at": _now_iso(),
        "ip": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent", "")[:300],
    }
    result = await db.beta_bug_reports.insert_one(doc)
    logger.info(
        f"beta.bug_report: id={result.inserted_id} severity={payload.severity} "
        f"screen={payload.app_screen!r} from={payload.email}"
    )
    return {"id": str(result.inserted_id), "created_at": doc["created_at"]}


@router.post("/suggestions", status_code=201)
async def submit_suggestion(payload: SuggestionIn, request: Request):
    doc = {
        **payload.model_dump(),
        "created_at": _now_iso(),
        "ip": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent", "")[:300],
    }
    result = await db.beta_suggestions.insert_one(doc)
    logger.info(
        f"beta.suggestion: id={result.inserted_id} category={payload.category!r} "
        f"from={payload.email}"
    )
    return {"id": str(result.inserted_id), "created_at": doc["created_at"]}


# ---------- Tester activity tracking -----------------------------------------
@router.post("/tester-activity", status_code=200)
async def log_activity(payload: ActivityIn):
    """
    Log a checklist item completion for a beta tester.
    Idempotent: same (email, date, item_id) is upserted, not duplicated.
    Returns {ok, email, date, items_completed_today, all_six_today}.
    """
    email = payload.email.lower()
    date = payload.date or datetime.now(timezone.utc).strftime("%Y-%m-%d")

    await db.beta_tester_activity.update_one(
        {"email": email, "date": date, "item_id": payload.item_id},
        {
            "$set": {"email": email, "date": date, "item_id": payload.item_id},
            "$setOnInsert": {"created_at": _now_iso()},
        },
        upsert=True,
    )

    # Fetch today's item set
    today_items = await db.beta_tester_activity.distinct(
        "item_id", {"email": email, "date": date}
    )
    completed_today = len(today_items)
    all_six = completed_today >= len(VALID_CHECKLIST_ITEMS)

    logger.info(
        f"beta.activity: {email} date={date} item={payload.item_id} "
        f"today={completed_today}/6"
    )
    return {
        "ok": True,
        "email": email,
        "date": date,
        "items_completed_today": completed_today,
        "all_six_today": all_six,
    }


@router.get("/tester-activity/me")
async def get_my_activity(email: EmailStr = Query(...), window_days: int = Query(default=14, ge=1, le=90)):
    """
    Public: return this tester's own activity summary for the last N days.
    { email, days_active, full_days, per_day: [{date, items: [...], count, is_full}] }
    """
    email = email.lower()
    today = datetime.now(timezone.utc).date()
    start = today.toordinal() - (window_days - 1)
    dates_in_window = [
        datetime.fromordinal(start + i).strftime("%Y-%m-%d")
        for i in range(window_days)
    ]

    cursor = db.beta_tester_activity.find(
        {"email": email, "date": {"$in": dates_in_window}}
    )
    by_day = {}
    async for d in cursor:
        by_day.setdefault(d["date"], set()).add(d["item_id"])

    per_day = []
    days_active = 0
    full_days = 0
    for date_str in dates_in_window:
        items = sorted(by_day.get(date_str, set()))
        count = len(items)
        is_full = count >= len(VALID_CHECKLIST_ITEMS)
        if count > 0:
            days_active += 1
        if is_full:
            full_days += 1
        per_day.append({"date": date_str, "items": items, "count": count, "is_full": is_full})

    return {
        "email": email,
        "window_days": window_days,
        "days_active": days_active,
        "full_days": full_days,
        "per_day": per_day,
    }


@router.get("/qualified-testers")
async def qualified_testers(
    request: Request,
    key: Optional[str] = Query(default=None),
    min_full_days: int = Query(default=10, ge=1, le=90),
    window_days: int = Query(default=14, ge=1, le=90),
):
    """
    Admin: list testers who have completed all 6 checklist items on at least
    `min_full_days` different days within the last `window_days`.
    """
    await _admin_ok(request, key)

    today = datetime.now(timezone.utc).date()
    start = today.toordinal() - (window_days - 1)
    dates_in_window = [
        datetime.fromordinal(start + i).strftime("%Y-%m-%d")
        for i in range(window_days)
    ]
    total_items = len(VALID_CHECKLIST_ITEMS)

    # Aggregate: per (email, date) count distinct item_ids; then group by email
    pipeline = [
        {"$match": {"date": {"$in": dates_in_window}}},
        {"$group": {
            "_id": {"email": "$email", "date": "$date"},
            "items": {"$addToSet": "$item_id"},
        }},
        {"$project": {
            "email": "$_id.email",
            "date": "$_id.date",
            "items_count": {"$size": "$items"},
            "is_full_day": {"$eq": [{"$size": "$items"}, total_items]},
        }},
        {"$group": {
            "_id": "$email",
            "days_active": {"$sum": 1},
            "full_days": {"$sum": {"$cond": ["$is_full_day", 1, 0]}},
            "total_item_completions": {"$sum": "$items_count"},
        }},
        {"$sort": {"full_days": -1, "days_active": -1}},
    ]

    all_testers = []
    async for row in db.beta_tester_activity.aggregate(pipeline):
        all_testers.append({
            "email": row["_id"],
            "days_active": row["days_active"],
            "full_days": row["full_days"],
            "total_item_completions": row["total_item_completions"],
            "qualified": row["full_days"] >= min_full_days,
        })

    qualified = [t for t in all_testers if t["qualified"]]
    return {
        "window_days": window_days,
        "min_full_days": min_full_days,
        "total_testers_active": len(all_testers),
        "qualified_count": len(qualified),
        "qualified": qualified,
        "all_testers": all_testers,
    }


# ---------- Admin endpoints --------------------------------------------------
@router.get("/counts")
async def beta_counts(request: Request, key: Optional[str] = Query(default=None)):
    await _admin_ok(request, key)
    bugs = await db.beta_bug_reports.count_documents({})
    suggestions = await db.beta_suggestions.count_documents({})
    latest_bug = await db.beta_bug_reports.find_one(sort=[("_id", -1)])
    latest_sug = await db.beta_suggestions.find_one(sort=[("_id", -1)])
    latest = max(
        (d.get("created_at", "") for d in (latest_bug, latest_sug) if d),
        default="",
    )
    return {"bugs": bugs, "suggestions": suggestions, "latest": latest}


@router.get("/export.csv")
async def export_csv(
    request: Request,
    key: Optional[str] = Query(default=None),
    kind: Literal["bugs", "suggestions", "all"] = Query(default="all"),
):
    """CSV export of beta submissions. Auth via ?key= or admin JWT."""
    await _admin_ok(request, key)

    buf = io.StringIO()
    writer = csv.writer(buf)

    if kind in ("bugs", "all"):
        writer.writerow(["=== BUG REPORTS ==="])
        writer.writerow([
            "id", "created_at", "name", "email", "device_model", "android_version",
            "app_screen", "severity", "description", "screenshot_link", "ip",
        ])
        cursor = db.beta_bug_reports.find({}).sort("_id", -1)
        async for d in cursor:
            writer.writerow([
                str(d.get("_id", "")),
                d.get("created_at", ""),
                d.get("name", ""),
                d.get("email", ""),
                d.get("device_model", ""),
                d.get("android_version", ""),
                d.get("app_screen", ""),
                d.get("severity", ""),
                d.get("description", ""),
                d.get("screenshot_link", ""),
                d.get("ip", ""),
            ])
        writer.writerow([])

    if kind in ("suggestions", "all"):
        writer.writerow(["=== SUGGESTIONS ==="])
        writer.writerow([
            "id", "created_at", "name", "email", "category", "details", "ip",
        ])
        cursor = db.beta_suggestions.find({}).sort("_id", -1)
        async for d in cursor:
            writer.writerow([
                str(d.get("_id", "")),
                d.get("created_at", ""),
                d.get("name", ""),
                d.get("email", ""),
                d.get("category", ""),
                d.get("details", ""),
                d.get("ip", ""),
            ])

    buf.seek(0)
    filename = f"samson_beta_{kind}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
