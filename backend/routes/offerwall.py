Here are all the files. I'll group them by size — small diffs first, then full files.

---

## 📝 FILE 1: `backend/server.py` (2-line patch)

👉 https://github.com/Dr-Thom/DrT-Vara_iOS-App/edit/main/backend/server.py

Find this line:
```python
from routes.legal import router as legal_router
```
**Add this line right below it:**
```python
from routes.offerwall import router as offerwall_router
```

Then find:
```python
app.include_router(legal_router)
```
**Add this line right below it:**
```python
app.include_router(offerwall_router)
```
Commit directly to `main`.

---

## 📝 FILE 2: `mobile/app.json` (2-line version bump)

👉 https://github.com/Dr-Thom/DrT-Vara_iOS-App/edit/main/mobile/app.json

Find `"version": "1.0.11"` → change to `"version": "1.0.12"`  
Find `"versionCode": 12` → change to `"versionCode": 13`  
Commit directly to `main`.

---

## 📝 FILE 3: `backend/routes/offerwall.py` (NEW FILE)

👉 Open: https://github.com/Dr-Thom/DrT-Vara_iOS-App/new/main/backend/routes

In the **"Name your file"** field, type: `offerwall.py`

In the content area, paste:
Action: file_editor view /app/backend/routes/offerwall.py
Observation: [Showing lines 1-265 of 265 total] /app/backend/routes/offerwall.py:
1|"""Offerwall integration — AdGate Media + CPX Research.
2|Handles URL generation (signed) + S2S postback verification + balance crediting.
3|"""
4|import hashlib
5|import os
6|import logging
7|from urllib.parse import urlencode
8|from datetime import datetime, timezone
9|
10|from fastapi import APIRouter, Depends, HTTPException, Request
11|from fastapi.responses import PlainTextResponse
12|from motor.motor_asyncio import AsyncIOMotorClient
13|from bson import ObjectId
14|
15|from routes.auth import get_current_user
16|
17|logger = logging.getLogger(__name__)
18|
19|router = APIRouter(prefix="/api/offerwall", tags=["offerwall"])
20|
21|mongo_url = os.environ.get('MONGO_URL')
22|client = AsyncIOMotorClient(mongo_url)
23|db = client[os.environ.get('DB_NAME', 'vara_db')]
24|
25|# ─── Config ────────────────────────────────────────────────
26|ADGATE_WALL_ID = os.environ.get('ADGATE_WALL_ID', '')
27|ADGATE_SECRET = os.environ.get('ADGATE_SECRET', '')
28|CPX_APP_ID = os.environ.get('CPX_APP_ID', '')
29|CPX_SECRET = os.environ.get('CPX_SECRET', '')
30|
31|
32|# ─── Helpers ──────────────────────────────────────────────
33|def cpx_secure_hash(ext_user_id: str) -> str:
34|    """CPX-required MD5 hash: md5({user_id}-{secret}). Used in iframe URL + postback verification."""
35|    data = f"{ext_user_id}-{CPX_SECRET}"
36|    return hashlib.md5(data.encode("utf-8")).hexdigest()
37|
38|
39|# ─── URL Generation (client-facing) ────────────────────────
40|@router.get("/url/adgate")
41|async def get_adgate_url(current_user: dict = Depends(get_current_user)):
42|    """Return the AdGate wall URL pre-populated with the current user's ID."""
43|    if not ADGATE_WALL_ID:
44|        raise HTTPException(status_code=503, detail="Offerwall not configured")
45|
46|    user_id = str(current_user["_id"])
47|    url = f"https://wall.adgaterewards.com/{ADGATE_WALL_ID}/{user_id}"
48|    return {"url": url, "provider": "adgate"}
49|
50|
51|@router.get("/url/cpx")
52|async def get_cpx_url(current_user: dict = Depends(get_current_user)):
53|    """Return the CPX SurveyWall URL with secure_hash MD5 anti-tamper signature."""
54|    if not CPX_APP_ID or not CPX_SECRET:
55|        raise HTTPException(status_code=503, detail="Offerwall not configured")
56|
57|    user_id = str(current_user["_id"])
58|    params = {
59|        "app_id": CPX_APP_ID,
60|        "ext_user_id": user_id,
61|        "secure_hash": cpx_secure_hash(user_id),
62|        "username": current_user.get("name") or current_user.get("email", "").split("@")[0],
63|        "email": current_user.get("email", ""),
64|        "subid_1": "",
65|        "subid_2": "",
66|    }
67|    url = f"https://offers.cpx-research.com/index.php?{urlencode(params)}"
68|    return {"url": url, "provider": "cpx"}
69|
70|
71|# ─── Postback handlers (S2S — provider → us) ───────────────
72|async def _credit_user_offerwall(
73|    user_id_str: str,
74|    provider: str,
75|    provider_trans_id: str,
76|    points_to_credit: float,
77|    payout_usd: float,
78|    status: str,
79|    raw_params: dict,
80|) -> str:
81|    """Atomic + idempotent crediting. Returns 'ok' / 'duplicate' / 'failed'."""
82|    # Convert user_id to ObjectId
83|    try:
84|        user_obj_id = ObjectId(user_id_str)
85|    except Exception:
86|        logger.warning(f"[offerwall:{provider}] invalid user_id: {user_id_str}")
87|        return "failed"
88|
89|    # Idempotency check (using compound unique index in real life)
90|    existing = await db.offerwall_transactions.find_one({
91|        "provider": provider,
92|        "provider_trans_id": provider_trans_id,
93|    })
94|    if existing:
95|        return "duplicate"
96|
97|    # Calculate delta
98|    if status in ("1", "completed", "success", "approved"):
99|        delta = abs(points_to_credit)
100|        tx_status = "completed"
101|    elif status in ("2", "reversed", "chargeback", "refunded"):
102|        delta = -abs(points_to_credit)
103|        tx_status = "reversed"
104|    else:
105|        logger.info(f"[offerwall:{provider}] ignoring status={status}")
106|        return "ignored"
107|
108|    # Update user balance
109|    result = await db.users.update_one(
110|        {"_id": user_obj_id},
111|        {
112|            "$inc": {
113|                "earnings": delta,
114|                "total_earned": delta if delta > 0 else 0,
115|                "offerwall_earnings": delta,
116|            },
117|        },
118|    )
119|    if result.matched_count == 0:
120|        logger.warning(f"[offerwall:{provider}] user not found: {user_id_str}")
121|        return "failed"
122|
123|    # Record transaction
124|    await db.offerwall_transactions.insert_one({
125|        "user_id": user_id_str,
126|        "provider": provider,
127|        "provider_trans_id": provider_trans_id,
128|        "status": tx_status,
129|        "amount_usd": delta,
130|        "payout_usd": payout_usd,
131|        "raw_params": raw_params,
132|        "created_at": datetime.now(timezone.utc),
133|    })
134|
135|    logger.info(f"[offerwall:{provider}] credited ${delta} to user {user_id_str} (tx={provider_trans_id})")
136|    return "ok"
137|
138|
139|@router.get("/postback/adgate", response_class=PlainTextResponse)
140|async def adgate_postback(request: Request):
141|    """AdGate VC Wall S2S callback. Configure this URL in AdGate dashboard:
142|       https://drt-vara-ios-app.onrender.com/api/offerwall/postback/adgate?user_id={user_id}&points={points}&payout={payout}&tx={transaction_id}&status={status}
143|    """
144|    params = dict(request.query_params)
145|    await db.offerwall_postback_logs.insert_one({
146|        "provider": "adgate",
147|        "received_at": datetime.now(timezone.utc),
148|        "query": params,
149|        "remote_ip": request.client.host if request.client else None,
150|    })
151|
152|    user_id = params.get("user_id") or params.get("uid")
153|    transaction_id = params.get("tx") or params.get("transaction_id")
154|    status = (params.get("status") or "").lower()
155|    points_str = params.get("points") or params.get("amount") or "0"
156|    payout_str = params.get("payout") or "0"
157|
158|    if not user_id or not transaction_id:
159|        return PlainTextResponse("missing user_id or transaction_id", status_code=400)
160|
161|    try:
162|        # AdGate "points" are typically configured as USD * conversionRate (e.g. 100 = $1)
163|        # Treat 'points' field as our USD reward directly — adjust conversion if needed
164|        points = float(points_str)
165|        payout = float(payout_str)
166|    except ValueError:
167|        return PlainTextResponse("invalid amount", status_code=400)
168|
169|    # CONVERSION: AdGate "points" → USD. Default: 1 point = $0.01 (i.e. 100 points = $1)
170|    # Adjust this in your AdGate wall settings.
171|    usd_credit = round(points / 100.0, 4)
172|
173|    result = await _credit_user_offerwall(
174|        user_id_str=user_id,
175|        provider="adgate",
176|        provider_trans_id=transaction_id,
177|        points_to_credit=usd_credit,
178|        payout_usd=payout,
179|        status=status if status else "completed",
180|        raw_params=params,
181|    )
182|    return PlainTextResponse(result)
183|
184|
185|@router.get("/postback/cpx", response_class=PlainTextResponse)
186|async def cpx_postback(request: Request):
187|    """CPX Research S2S callback with MD5 hash verification. Configure this URL in CPX:
188|       https://drt-vara-ios-app.onrender.com/api/offerwall/postback/cpx?status={status}&trans_id={trans_id}&user_id={user_id}&amount_local={amount_local}&amount_usd={amount_usd}&hash={hash}
189|    """
190|    params = dict(request.query_params)
191|    await db.offerwall_postback_logs.insert_one({
192|        "provider": "cpx",
193|        "received_at": datetime.now(timezone.utc),
194|        "query": params,
195|        "remote_ip": request.client.host if request.client else None,
196|    })
197|
198|    user_id = params.get("user_id")
199|    transaction_id = params.get("trans_id") or params.get("transaction_id")
200|    status = (params.get("status") or "").lower()
201|    amount_local_str = params.get("amount_local") or params.get("amount") or "0"
202|    amount_usd_str = params.get("amount_usd") or "0"
203|    received_hash = params.get("hash") or params.get("secure_hash")
204|
205|    if not user_id or not transaction_id:
206|        return PlainTextResponse("missing params", status_code=400)
207|
208|    # Verify MD5 hash (anti-tamper)
209|    if CPX_SECRET:
210|        expected = cpx_secure_hash(user_id)
211|        if received_hash != expected:
212|            logger.warning(f"[offerwall:cpx] hash mismatch: got={received_hash} expected={expected}")
213|            return PlainTextResponse("invalid hash", status_code=403)
214|
215|    try:
216|        amount_local = float(amount_local_str)
217|        amount_usd = float(amount_usd_str)
218|    except ValueError:
219|        return PlainTextResponse("invalid amount", status_code=400)
220|
221|    # Use amount_usd directly (publisher revenue in USD); fall back to amount_local
222|    usd_credit = round(amount_usd if amount_usd > 0 else amount_local, 4)
223|
224|    result = await _credit_user_offerwall(
225|        user_id_str=user_id,
226|        provider="cpx",
227|        provider_trans_id=transaction_id,
228|        points_to_credit=usd_credit,
229|        payout_usd=amount_usd,
230|        status=status if status else "completed",
231|        raw_params=params,
232|    )
233|    return PlainTextResponse(result)
234|
235|
236|# ─── Admin / debugging endpoints ───────────────────────────
237|@router.get("/me/transactions")
238|async def list_my_offerwall_transactions(current_user: dict = Depends(get_current_user)):
239|    """Return the current user's offerwall transactions for display in 'Earnings History'."""
240|    user_id_str = str(current_user["_id"])
241|    cursor = db.offerwall_transactions.find(
242|        {"user_id": user_id_str},
243|        sort=[("created_at", -1)],
244|        limit=50,
245|    )
246|    out = []
247|    async for tx in cursor:
248|        out.append({
249|            "provider": tx.get("provider"),
250|            "amount_usd": tx.get("amount_usd"),
251|            "status": tx.get("status"),
252|            "created_at": tx.get("created_at").isoformat() if tx.get("created_at") else None,
253|        })
254|    return {"transactions": out, "total_count": len(out)}
255|
256|
257|@router.get("/health")
258|async def offerwall_health():
259|    return {
260|        "configured": {
261|            "adgate": bool(ADGATE_WALL_ID),
262|            "cpx": bool(CPX_APP_ID and CPX_SECRET),
263|        },
264|    }
265|
[End of file]
