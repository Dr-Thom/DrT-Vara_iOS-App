"""
Expo Push Notifications sender — async, batched, with stale-token cleanup.
Uses the public Expo Push API (no SDK needed).
Docs: https://docs.expo.dev/push-notifications/sending-notifications/
"""
from __future__ import annotations
import logging
import re
from typing import Iterable, Optional

import httpx

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
EXPO_TOKEN_RE = re.compile(r"^Expo(?:nent)?PushToken\[[^\]]+\]$")
BATCH_SIZE = 100  # Expo accepts up to 100 messages per request


def is_valid_expo_token(token: Optional[str]) -> bool:
    return bool(token) and bool(EXPO_TOKEN_RE.match(token))


async def _post_batch(client: httpx.AsyncClient, messages: list[dict]) -> list[dict]:
    """POST a single batch (≤100) to Expo. Returns the list of receipt tickets."""
    try:
        resp = await client.post(
            EXPO_PUSH_URL,
            json=messages,
            headers={
                "Accept": "application/json",
                "Accept-Encoding": "gzip, deflate",
                "Content-Type": "application/json",
            },
            timeout=15.0,
        )
        resp.raise_for_status()
        return resp.json().get("data", []) or []
    except httpx.HTTPError as e:
        logger.error(f"Expo push batch failed: {e}")
        return []


async def send_push(
    db,
    *,
    tokens: Iterable[str],
    title: str,
    body: str,
    data: Optional[dict] = None,
    sound: str = "default",
    priority: str = "high",
) -> dict:
    """
    Send a notification to a list of Expo push tokens.
    Cleans up stale (DeviceNotRegistered) tokens automatically.
    Returns: {sent, failed, invalidated}.
    """
    valid = [t for t in tokens if is_valid_expo_token(t)]
    if not valid:
        return {"sent": 0, "failed": 0, "invalidated": 0}

    messages = [
        {
            "to": t,
            "title": title,
            "body": body,
            "data": data or {},
            "sound": sound,
            "priority": priority,
            "channelId": "default",  # Android channel
        }
        for t in valid
    ]

    sent = 0
    failed = 0
    invalidated_tokens: list[str] = []

    async with httpx.AsyncClient() as client:
        for i in range(0, len(messages), BATCH_SIZE):
            batch = messages[i : i + BATCH_SIZE]
            tickets = await _post_batch(client, batch)

            # Map tickets back to tokens (positional)
            for j, ticket in enumerate(tickets):
                token = batch[j]["to"]
                status = ticket.get("status")
                if status == "ok":
                    sent += 1
                else:
                    failed += 1
                    err = (ticket.get("details") or {}).get("error")
                    if err == "DeviceNotRegistered":
                        invalidated_tokens.append(token)
                    logger.warning(
                        f"Push failed for {token[:30]}...: {ticket.get('message')} ({err})"
                    )

            # If Expo returned nothing (network/HTTP error), count whole batch as failed
            if not tickets:
                failed += len(batch)

    # Remove invalid tokens from users
    if invalidated_tokens:
        try:
            await db.users.update_many(
                {"push_token": {"$in": invalidated_tokens}},
                {"$unset": {"push_token": "", "push_token_platform": ""}},
            )
            logger.info(f"Cleaned {len(invalidated_tokens)} stale push tokens")
        except Exception as e:
            logger.error(f"Failed to clean stale tokens: {e}")

    return {"sent": sent, "failed": failed, "invalidated": len(invalidated_tokens)}


async def send_to_user(
    db,
    user_id: str,
    *,
    title: str,
    body: str,
    data: Optional[dict] = None,
) -> dict:
    """Send a push to a single user (no-op if they have no token)."""
    from bson import ObjectId

    try:
        oid = ObjectId(user_id)
    except Exception:
        return {"sent": 0, "failed": 0, "invalidated": 0}

    user = await db.users.find_one({"_id": oid}, {"push_token": 1})
    token = (user or {}).get("push_token")
    if not token:
        return {"sent": 0, "failed": 0, "invalidated": 0}

    return await send_push(db, tokens=[token], title=title, body=body, data=data)
