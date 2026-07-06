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
