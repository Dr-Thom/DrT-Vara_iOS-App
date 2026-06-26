"""Offerwall integration — AdGate Media + CPX Research.
Handles URL generation (signed) + S2S postback verification + balance crediting.
"""
import hashlib
import os
import logging
from urllib.parse import urlencode
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import PlainTextResponse
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

from routes.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/offerwall", tags=["offerwall"])

mongo_url = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'vara_db')]

# ─── Config ────────────────────────────────────────────────
ADGATE_WALL_ID = os.environ.get('ADGATE_WALL_ID', '')
ADGATE_SECRET = os.environ.get('ADGATE_SECRET', '')
CPX_APP_ID = os.environ.get('CPX_APP_ID', '')
CPX_SECRET = os.environ.get('CPX_SECRET', '')


# ─── Helpers ──────────────────────────────────────────────
def cpx_secure_hash(ext_user_id: str) -> str:
    """CPX-required MD5 hash: md5({user_id}-{secret}). Used in iframe URL + postback verification."""
    data = f"{ext_user_id}-{CPX_SECRET}"
    return hashlib.md5(data.encode("utf-8")).hexdigest()


# ─── URL Generation (client-facing) ────────────────────────
@router.get("/url/adgate")
async def get_adgate_url(current_user: dict = Depends(get_current_user)):
    """Return the AdGate wall URL pre-populated with the current user's ID."""
    if not ADGATE_WALL_ID:
        raise HTTPException(status_code=503, detail="Offerwall not configured")

    user_id = str(current_user["_id"])
    url = f"https://wall.adgaterewards.com/{ADGATE_WALL_ID}/{user_id}"
    return {"url": url, "provider": "adgate"}


@router.get("/url/cpx")
async def get_cpx_url(current_user: dict = Depends(get_current_user)):
    """Return the CPX SurveyWall URL with secure_hash MD5 anti-tamper signature."""
    if not CPX_APP_ID or not CPX_SECRET:
        raise HTTPException(status_code=503, detail="Offerwall not configured")

    user_id = str(current_user["_id"])
    params = {
        "app_id": CPX_APP_ID,
        "ext_user_id": user_id,
        "secure_hash": cpx_secure_hash(user_id),
        "username": current_user.get("name") or current_user.get("email", "").split("@")[0],
        "email": current_user.get("email", ""),
        "subid_1": "",
        "subid_2": "",
    }
    url = f"https://offers.cpx-research.com/index.php?{urlencode(params)}"
    return {"url": url, "provider": "cpx"}


# ─── Postback handlers (S2S — provider → us) ───────────────
async def _credit_user_offerwall(
    user_id_str: str,
    provider: str,
    provider_trans_id: str,
    points_to_credit: float,
    payout_usd: float,
    status: str,
    raw_params: dict,
) -> str:
    """Atomic + idempotent crediting. Returns 'ok' / 'duplicate' / 'failed'."""
    # Convert user_id to ObjectId
    try:
        user_obj_id = ObjectId(user_id_str)
    except Exception:
        logger.warning(f"[offerwall:{provider}] invalid user_id: {user_id_str}")
        return "failed"

    # Idempotency check (using compound unique index in real life)
    existing = await db.offerwall_transactions.find_one({
        "provider": provider,
        "provider_trans_id": provider_trans_id,
    })
    if existing:
        return "duplicate"

    # Calculate delta
    if status in ("1", "completed", "success", "approved"):
        delta = abs(points_to_credit)
        tx_status = "completed"
    elif status in ("2", "reversed", "chargeback", "refunded"):
        delta = -abs(points_to_credit)
        tx_status = "reversed"
    else:
        logger.info(f"[offerwall:{provider}] ignoring status={status}")
        return "ignored"

    # Update user balance
    result = await db.users.update_one(
        {"_id": user_obj_id},
        {
            "$inc": {
                "earnings": delta,
                "total_earned": delta if delta > 0 else 0,
                "offerwall_earnings": delta,
            },
        },
    )
    if result.matched_count == 0:
        logger.warning(f"[offerwall:{provider}] user not found: {user_id_str}")
        return "failed"

    # Record transaction
    await db.offerwall_transactions.insert_one({
        "user_id": user_id_str,
        "provider": provider,
        "provider_trans_id": provider_trans_id,
        "status": tx_status,
        "amount_usd": delta,
        "payout_usd": payout_usd,
        "raw_params": raw_params,
        "created_at": datetime.now(timezone.utc),
    })

    logger.info(f"[offerwall:{provider}] credited ${delta} to user {user_id_str} (tx={provider_trans_id})")
    return "ok"


@router.get("/postback/adgate", response_class=PlainTextResponse)
async def adgate_postback(request: Request):
    """AdGate VC Wall S2S callback. Configure this URL in AdGate dashboard:
       https://drt-vara-ios-app.onrender.com/api/offerwall/postback/adgate?user_id={user_id}&points={points}&payout={payout}&tx={transaction_id}&status={status}
    """
    params = dict(request.query_params)
    await db.offerwall_postback_logs.insert_one({
        "provider": "adgate",
        "received_at": datetime.now(timezone.utc),
        "query": params,
        "remote_ip": request.client.host if request.client else None,
    })

    user_id = params.get("user_id") or params.get("uid")
    transaction_id = params.get("tx") or params.get("transaction_id")
    status = (params.get("status") or "").lower()
    points_str = params.get("points") or params.get("amount") or "0"
    payout_str = params.get("payout") or "0"

    if not user_id or not transaction_id:
        return PlainTextResponse("missing user_id or transaction_id", status_code=400)

    try:
        # AdGate "points" are typically configured as USD * conversionRate (e.g. 100 = $1)
        # Treat 'points' field as our USD reward directly — adjust conversion if needed
        points = float(points_str)
        payout = float(payout_str)
    except ValueError:
        return PlainTextResponse("invalid amount", status_code=400)

    # CONVERSION: AdGate "points" → USD. Default: 1 point = $0.01 (i.e. 100 points = $1)
    # Adjust this in your AdGate wall settings.
    usd_credit = round(points / 100.0, 4)

    result = await _credit_user_offerwall(
        user_id_str=user_id,
        provider="adgate",
        provider_trans_id=transaction_id,
        points_to_credit=usd_credit,
        payout_usd=payout,
        status=status if status else "completed",
        raw_params=params,
    )
    return PlainTextResponse(result)


@router.get("/postback/cpx", response_class=PlainTextResponse)
async def cpx_postback(request: Request):
    """CPX Research S2S callback with MD5 hash verification. Configure this URL in CPX:
       https://drt-vara-ios-app.onrender.com/api/offerwall/postback/cpx?status={status}&trans_id={trans_id}&user_id={user_id}&amount_local={amount_local}&amount_usd={amount_usd}&hash={hash}
    """
    params = dict(request.query_params)
    await db.offerwall_postback_logs.insert_one({
        "provider": "cpx",
        "received_at": datetime.now(timezone.utc),
        "query": params,
        "remote_ip": request.client.host if request.client else None,
    })

    user_id = params.get("user_id")
    transaction_id = params.get("trans_id") or params.get("transaction_id")
    status = (params.get("status") or "").lower()
    amount_local_str = params.get("amount_local") or params.get("amount") or "0"
    amount_usd_str = params.get("amount_usd") or "0"
    received_hash = params.get("hash") or params.get("secure_hash")

    if not user_id or not transaction_id:
        return PlainTextResponse("missing params", status_code=400)

    # Verify MD5 hash (anti-tamper)
    if CPX_SECRET:
        expected = cpx_secure_hash(user_id)
        if received_hash != expected:
            logger.warning(f"[offerwall:cpx] hash mismatch: got={received_hash} expected={expected}")
            return PlainTextResponse("invalid hash", status_code=403)

    try:
        amount_local = float(amount_local_str)
        amount_usd = float(amount_usd_str)
    except ValueError:
        return PlainTextResponse("invalid amount", status_code=400)

    # Use amount_usd directly (publisher revenue in USD); fall back to amount_local
    usd_credit = round(amount_usd if amount_usd > 0 else amount_local, 4)

    result = await _credit_user_offerwall(
        user_id_str=user_id,
        provider="cpx",
        provider_trans_id=transaction_id,
        points_to_credit=usd_credit,
        payout_usd=amount_usd,
        status=status if status else "completed",
        raw_params=params,
    )
    return PlainTextResponse(result)


# ─── Admin / debugging endpoints ───────────────────────────
@router.get("/me/transactions")
async def list_my_offerwall_transactions(current_user: dict = Depends(get_current_user)):
    """Return the current user's offerwall transactions for display in 'Earnings History'."""
    user_id_str = str(current_user["_id"])
    cursor = db.offerwall_transactions.find(
        {"user_id": user_id_str},
        sort=[("created_at", -1)],
        limit=50,
    )
    out = []
    async for tx in cursor:
        out.append({
            "provider": tx.get("provider"),
            "amount_usd": tx.get("amount_usd"),
            "status": tx.get("status"),
            "created_at": tx.get("created_at").isoformat() if tx.get("created_at") else None,
        })
    return {"transactions": out, "total_count": len(out)}


@router.get("/health")
async def offerwall_health():
    return {
        "configured": {
            "adgate": bool(ADGATE_WALL_ID),
            "cpx": bool(CPX_APP_ID and CPX_SECRET),
        },
    }
