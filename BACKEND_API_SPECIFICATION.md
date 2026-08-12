# Momentum — Backend Build Spec

Scope: **only what still needs to be built or modified on the backend.** Already-live endpoints (Login, Register, Send OTP, Verify OTP, Reset Password) are not included here — nothing to do on them. Full frontend context (which screen calls what, why, and what it does with each field) lives in `API_SPECIFICATION.md` if you need it; this file is trimmed to exactly what you need to implement: path, payload, response, and business logic.

---

## Conventions

**Base URL**: `https://devapi.myaligna.com/api`

**Path prefix**: every new endpoint below lives under `/momentum/*`. Two exceptions that stay where they already are (already live, don't rename): `/logout` and `/refresh-token` sit alongside the other auth endpoints, no prefix.

**Auth**: `Authorization: Bearer <token>` on every endpoint below except none — all of these require auth.

**Headers on every request**: `Content-Type: application/json`, `Accept: application/json`, `x-api-key: 12345678`.

**Success envelope** (use this shape for every endpoint in this document):
```json
{ "success": true, "message": "...", "data": { } }
```

**Error envelope**:
```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "VALIDATION_ERROR",
  "errors": [{ "field": "email", "message": "Enter a valid email address" }]
}
```
`errors` only present on `422`.

**Emotion identifier**: use the string **slug**, not a numeric id, everywhere below (`scores` object keys, `emotionId` fields, path params). The 12 valid slugs, in this fixed order:
```
joy, gratitude, inspiration, focus, determination, compassion,
clarity, confidence, enthusiasm, resilience, hope, contentment
```

**Score band thresholds** (used in several responses below — replicate exactly):
```
danger:  score <= 4   → label "Needs attention"
warning: score 5–7    → label "Building"
success: score 8–10   → label "Thriving"
```

**Score scale**: integers 1–10 inclusive everywhere. No 0, no decimals.

---

## Part A — Modify Existing (Already-Live) Endpoints

### A.1 `GET /momentum/emotions` — add a `slug` field

Currently returns only a numeric `id` (1–12). Add a `slug` string field to each item — every other endpoint in this document references emotions by this slug, not the numeric id.

**Response item, updated shape:**
```json
{
  "id": 1,
  "slug": "joy",
  "name": "Joy",
  "icon": "happy-outline",
  "description": "Joy is the feeling of happiness, lightness, and fulfillment...",
  "sortOrder": 1
}
```
`slug` values: `joy`, `gratitude`, `inspiration`, `focus`, `determination`, `compassion`, `clarity`, `confidence`, `enthusiasm`, `resilience`, `hope`, `contentment` — matched 1:1 by `sortOrder` to the list above. Keep `id` as-is (internal DB key, not used elsewhere).

---

### A.2 `GET /user/profile` and `PUT /user/profile` — add three fields

Add to the `user` object returned by `GET` and accepted (as optional, partial-update fields) by `PUT`:

| Field | Type | Notes |
|---|---|---|
| `avatar_url` | string \| null | Nullable. No upload endpoint needed yet — just needs to round-trip (store/return) whatever is set. |
| `notifications_enabled` | boolean | Daily check-in reminder toggle. |
| `voice_gender` | enum `"Female"` \| `"Male"` | Distinct from the existing `default_agent` field (which is an agent persona name — `peggy`/`lotus`/`denis` — not a voice gender). |

`PUT` behavior: partial update — only apply fields present in the request body, leave the rest untouched. These three join the existing accepted fields (`first_name`, `last_name`, `nickname`, `email`, `phone`, `dob`, `gender`, `default_language`, `default_agent`) — no change to those.

**Full `user` object shape after this change:**
```json
{
  "id": "usr_8f3a1c",
  "first_name": "Alex",
  "last_name": "Rivera",
  "nickname": "Alex",
  "email": "alex.rivera@example.com",
  "phone": "+1 555 010 2020",
  "dob": "1994-03-12",
  "gender": "female",
  "default_language": "English",
  "default_agent": "peggy",
  "avatar_url": null,
  "notifications_enabled": true,
  "voice_gender": "Female",
  "hasCompletedBaseline": true
}
```

Also add `hasCompletedBaseline` (boolean) here if not already present — it should already be returned by Login/Register; make sure `GET /user/profile` returns it too for consistency.

**`default_language` validation note**: two different frontend screens currently expect two different option lists for this field (`English, Arabic, Spanish, French, Hindi, Chinese` vs `English, Spanish, French, Portuguese`). Accept the union of both (`English, Arabic, Spanish, French, Hindi, Chinese, Portuguese`) rather than picking one — this is a known frontend inconsistency being resolved separately, don't validate more strictly than either screen expects in the meantime.

---

## Part B — New Endpoints to Build

### B.1 Score Emotion From Conversation

| | |
|---|---|
| **Method / Path** | `POST /momentum/assessment/emotion-score` |
| **Purpose** | Runs an AI judge over one emotion's check-in transcript, returns a 1–10 score. Called once per emotion, right after that emotion's conversation ends — not once per full check-in. |

**Request**
```json
{
  "emotionId": "confidence",
  "checkInType": "baseline",
  "transcript": [
    { "source": "ai", "message": "Let's talk about confidence — how are you feeling about yourself lately?" },
    { "source": "user", "message": "Honestly pretty solid, I spoke up in a meeting today and it felt good." }
  ]
}
```
| Field | Type | Required | Validation |
|---|---|---|---|
| `emotionId` | string | Yes | One of the 12 slugs |
| `checkInType` | `"baseline"` \| `"daily"` | Yes | Calibrates expected depth — daily exchanges are much shorter than baseline ones |
| `transcript` | array of `{ source: "user"\|"ai", message: string }` | Yes | At least one `source: "user"` entry required |

**Response — `200`**
```json
{ "success": true, "message": "Score calculated", "data": { "emotionId": "confidence", "score": 7 } }
```

**Errors**
- `401` — unauthorized, standard shape.
- `422` — `{ "success": false, "message": "Validation failed", "code": "VALIDATION_ERROR", "errors": [{ "field": "transcript", "message": "At least one user turn is required" }] }`
- `500` — `{ "success": false, "message": "Something went wrong scoring that conversation. Please try again.", "code": "SCORING_FAILED" }` (judging model failed/timed out — frontend just retries the same call)

**Functionality to implement (AI processing):**
- Run `transcript` through an LLM judge to output an integer 1–10 for how strongly `emotionId` is present, based only on the `user`-sourced turns (the `ai` turns are context, not signal).
- Suggested rubric to prompt the judge with:
  - **1–2** — emotion largely absent, or explicitly negative/distressed language about this specific area.
  - **3–4** — mostly struggling or subdued, only faint positive signal.
  - **5–6** — mixed/middling: present but inconsistent, "okay," "so-so."
  - **7–8** — clearly present and positively described, steady, several concrete positive signals.
  - **9–10** — vivid, strongly positive language, consistently/exceptionally present.
  - If the user states a number themselves in the transcript, treat it as one signal among several, not ground truth.
  - Weak/ambiguous signal should still resolve to a best-effort estimate (favor 5–6), never an error — every emotion needs a score for B.2/B.4 to succeed.
- **No database write.** This endpoint is a stateless judge — nothing is persisted here. The full set of scores is only saved once, at B.2 (baseline) or B.4 (daily).
- **Crisis/self-harm detection is not this endpoint's job** — that's handled live elsewhere (ElevenLabs agent tool call, outside this backend's scope). Assume this endpoint never needs to detect or respond to crisis language.

---

### B.2 Submit Baseline Assessment

| | |
|---|---|
| **Method / Path** | `POST /momentum/assessment/baseline` |
| **Purpose** | Submits all 12 emotion scores from the one-time baseline check-in. Fired once, after the 12th emotion's score comes back from B.1. |

**Request**
```json
{
  "scores": {
    "joy": 7, "gratitude": 8, "inspiration": 6, "focus": 5, "determination": 6,
    "compassion": 8, "clarity": 4, "confidence": 4, "enthusiasm": 7,
    "resilience": 5, "hope": 6, "contentment": 7
  }
}
```
| Field | Type | Required | Validation |
|---|---|---|---|
| `scores` | object | Yes | Must contain **all 12** slugs as keys, each an integer 1–10 — no more, no fewer |

**Response — `200`**
```json
{
  "success": true,
  "message": "Baseline saved",
  "data": {
    "scores": { "joy": 7, "gratitude": 8, "...": "...same 12 keys" },
    "hasCompletedBaseline": true,
    "currentDay": 1
  }
}
```

**Errors**
- `401` — standard.
- `409` — `{ "success": false, "message": "Baseline already completed", "code": "ALREADY_COMPLETED" }` (no redo flow exists — treat a second submit as a hard conflict)
- `422` — `{ "success": false, "message": "Validation failed", "code": "VALIDATION_ERROR", "errors": [{ "field": "scores.clarity", "message": "Score must be between 1 and 10" }] }`
- `500` — standard.

**Functionality to implement:**
- Validate exactly the 12 known slugs present, each integer 1–10.
- Persist as a history record: `type: "baseline"`, `dayNumber: 0`.
- Set `hasCompletedBaseline = true` on the user record.
- Initialize `currentDay = 1` (drives B.5's rotation).

---

### B.3 Get Emotion Detail

| | |
|---|---|
| **Method / Path** | `GET /momentum/emotions/{slug}` |
| **Purpose** | One emotion's metadata plus the current user's latest score, band, and guidance. Per-user — do not cache across users. |

**Path param**: `slug` — one of the 12 emotion slugs.

**Response — `200`**
```json
{
  "success": true,
  "message": "Emotion detail fetched successfully",
  "data": {
    "slug": "confidence",
    "name": "Confidence",
    "icon": "shield-checkmark-outline",
    "description": "Confidence is the belief in one's abilities, worth, and capacity to take action...",
    "score": 4,
    "band": "danger",
    "bandLabel": "Needs attention",
    "guidance": "Confidence may feel shaky right now. Recall a recent moment, even small, where you handled something well.",
    "previousScore": 5,
    "lastUpdated": "2026-08-01T09:12:00.000Z"
  }
}
```

**Errors**
- `401` — standard.
- `404` — `{ "success": false, "message": "Unknown emotion: xyz", "code": "NOT_FOUND" }` — also return this if the user has no score yet for this emotion (baseline not completed).
- `500` — standard.

**Functionality to implement:**
- Look up the user's most recent recorded score for this emotion (from baseline or any daily check-in — "latest submission wins" per emotion, see B.5's aggregation rule) and compute `band`/`bandLabel` from the thresholds above.
- `previousScore`: the score recorded immediately before the current one, in submission order; `null` if there isn't one.
- `guidance`: 36 static strings (12 emotions × 3 bands) — if you don't want to own this copy server-side yet, `guidance` can be omitted from the response entirely and the client falls back to its own bundled copy. If you do include it, get the current copy from the frontend team (`src/data/emotionGuidance.js`) rather than writing new copy.

---

### B.4 Get Dashboard

| | |
|---|---|
| **Method / Path** | `GET /momentum/dashboard` |
| **Purpose** | Aggregate endpoint: all 12 emotions' latest scores + rollup average + current day counter. Powers the home summary and the full chart screen. |

**Response — `200`**
```json
{
  "success": true,
  "message": "Dashboard fetched successfully",
  "data": {
    "hasCompletedBaseline": true,
    "chart": [
      { "emotionId": "joy", "name": "Joy", "score": 7, "color": "success" },
      { "emotionId": "gratitude", "name": "Gratitude", "score": 8, "color": "success" }
    ],
    "averageScore": 6.2,
    "currentDay": 4,
    "lastCheckInDate": "2026-08-06T18:04:00.000Z"
  }
}
```
`chart` contains all 12 emotions, in the fixed order from the Conventions section (truncated above for brevity).

**Errors**: `401`, `500` — standard shapes.

**Functionality to implement:**
- For each of the 12 emotions, find the **latest** recorded score across the baseline submission and all daily check-ins so far — most recent submission wins per emotion.
- Compute `chart[].color` (band) and `averageScore` (mean of all 12, rounded to 1 decimal) using the thresholds above.
- `lastCheckInDate`: timestamp of the most recent check-in of any kind; `null` before baseline.
- If no baseline yet: `hasCompletedBaseline: false`, every `chart[].score` is `0` (not an error).

---

### B.5 Get Today's Check-In

| | |
|---|---|
| **Method / Path** | `GET /momentum/checkin/today` |
| **Purpose** | Returns the current day's 4-emotion rotation with that rotation's questions. |

**Response — `200`**
```json
{
  "success": true,
  "message": "Today's check-in fetched successfully",
  "data": {
    "dayNumber": 4,
    "alreadyCheckedInToday": false,
    "prompts": [
      { "emotionId": "joy", "emotionName": "Joy", "question": "How much lightness or happiness showed up for you today, from 1 to 10?" },
      { "emotionId": "gratitude", "emotionName": "Gratitude", "question": "From 1 to 10, how much appreciation have you felt for the good things around you today?" },
      { "emotionId": "inspiration", "emotionName": "Inspiration", "question": "From 1 to 10, how much creative spark or motivation have you felt today?" },
      { "emotionId": "focus", "emotionName": "Focus", "question": "From 1 to 10, how well were you able to stay present with what mattered today?" }
    ]
  }
}
```

**Errors**: `401`, `500` — standard shapes.

**Functionality to implement — rotation formula (must match exactly):**
```
groupIndex     = (dayNumber - 1) % 3
group          = GROUPS[groupIndex]
rotationIndex  = floor((dayNumber - 1) / 3)   // picks which of each emotion's 3 questions to use
```
Fixed groups:
```
pattern 1: joy, gratitude, inspiration, focus
pattern 2: determination, compassion, clarity, confidence
pattern 3: enthusiasm, resilience, hope, contentment
```
Each emotion has a bank of 3 rotating questions — get the current copy from the frontend team (`src/data/questions.js:DAILY_QUESTIONS`) rather than writing new copy.

- `alreadyCheckedInToday`: `true` if a `type: "daily"` history record already exists for the user's current calendar date (user's timezone) — used to gate B.6's `409`.

---

### B.6 Submit Daily Check-In

| | |
|---|---|
| **Method / Path** | `POST /momentum/checkin` |
| **Purpose** | Submits the day's 4 scores, advances to the next day. |

**Request**
```json
{ "scores": { "joy": 6, "gratitude": 7, "inspiration": 5, "focus": 8 } }
```
| Field | Type | Required | Validation |
|---|---|---|---|
| `scores` | object | Yes | Must contain **exactly** today's 4-emotion group (per B.5's formula), each 1–10 — reject extra/missing keys |

**Response — `200`**
```json
{ "success": true, "message": "Check-in saved", "data": { "nextDay": 5 } }
```

**Errors**
- `401` — standard.
- `409` — `{ "success": false, "message": "You've already checked in today", "code": "ALREADY_CHECKED_IN" }`
- `422` — `{ "success": false, "message": "Validation failed", "code": "VALIDATION_ERROR", "errors": [{ "field": "scores", "message": "Expected scores for joy, gratitude, inspiration, focus" }] }`
- `500` — standard.

**Functionality to implement:**
- Validate submitted keys are exactly today's group (from B.5's formula), each integer 1–10.
- Gate on calendar date in the user's timezone, not an unconditional counter — do not allow a second submission for the same day.
- Persist as a history record: `type: "daily"`, `dayNumber` = the day just completed.
- Increment `currentDay`.

---

### B.7 Get History

| | |
|---|---|
| **Method / Path** | `GET /momentum/history` |
| **Purpose** | Every completed check-in (baseline + daily), most recent first. |

**Query params (optional)**: `page` (default `1`), `limit` (default `20`), `type` (`baseline` \| `daily`).

**Response — `200`**
```json
{
  "success": true,
  "message": "History fetched successfully",
  "data": [
    {
      "id": "chk_9f2a41",
      "date": "2026-08-06T14:02:11.000Z",
      "dayNumber": 4,
      "type": "daily",
      "scores": { "joy": 6, "gratitude": 7, "inspiration": 5, "focus": 8 },
      "averageScore": 6.5,
      "band": "warning"
    },
    {
      "id": "chk_0001aa",
      "date": "2026-08-02T09:15:00.000Z",
      "dayNumber": 0,
      "type": "baseline",
      "scores": { "joy": 7, "gratitude": 8, "...": "...all 12 keys" },
      "averageScore": 6.4,
      "band": "warning"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 187, "totalPages": 10 }
}
```

**Errors**: `401`, `500` — standard shapes.

**Functionality to implement:**
- Return every check-in record for the user, most recent first, paginated.
- Compute `averageScore` (mean, rounded to 1 decimal) and `band` per entry server-side.

---

### B.8 Logout

| | |
|---|---|
| **Method / Path** | `POST /logout` |
| **Purpose** | Invalidate the current session server-side. |

**Request**: empty body.

**Response — `200`**
```json
{ "success": true, "message": "Logged out successfully" }
```

**Errors**
- `401` — `{ "success": false, "message": "Your session has already expired.", "code": "UNAUTHORIZED" }`
- `500` — standard.

**Functionality to implement:**
- Revoke/invalidate the bearer token server-side.
- **Must be idempotent** — calling it twice must not error.

---

### B.9 Refresh Token *(recommended for production; not called by the frontend yet)*

| | |
|---|---|
| **Method / Path** | `POST /refresh-token` |
| **Purpose** | Exchanges a refresh token for a new bearer token without re-login. |

**Request**
```json
{ "refresh_token": "rft_3a91c8..." }
```

**Response — `200`**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "rft_new_value...",
  "expires_in": 3600
}
```

**Errors**
- `401` — `{ "success": false, "message": "Your session has expired. Please sign in again.", "code": "INVALID_REFRESH_TOKEN" }`
- `500` — standard.

**Functionality to implement:**
- Issue both a short-lived bearer token (~1hr) and a rotating refresh token at Login/Register — if you build this, add `refresh_token` to the Login/Register responses too.
- Rotate the refresh token on every use (issue new, invalidate old).

---

## Implementation Notes (apply across multiple endpoints above)

1. **Emotion slug, not numeric id** — A.1 adds `slug`; every other endpoint above uses that slug, never the numeric `id`.
2. **Band thresholds** — used in B.3, B.4, B.7 — must match exactly: `danger` ≤4, `warning` 5–7, `success` 8–10.
3. **`x-api-key: 12345678`** — sent on every request today as a hardcoded client-side literal, not a real secret. Confirm with the frontend/security team whether this should actually gate anything before launch.
4. **Score scale** — integers 1–10 inclusive, enforced via `422` everywhere scores are submitted (B.2, B.6).
5. **B.1's AI judging is stateless** — don't persist anything there; B.2/B.6 are the only writes.
