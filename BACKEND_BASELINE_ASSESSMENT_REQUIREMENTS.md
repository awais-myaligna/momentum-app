# Backend Requirements — Baseline Assessment Progress & Resume

Written for the backend developer implementing persistent, resumable progress for the one-time Baseline Assessment (the 12-emotion Emotional Compass Check-in). Extends `BACKEND_API_SPECIFICATION.md` §B.1/§B.2, which remain the source of truth for everything not called out below as changed.

## Why this is needed

Today, `POST /momentum/assessment/emotion-score` (§B.1) is documented and implemented as a **stateless** judge — "No database write. ... The full set of scores is only saved once, at B.2 (baseline)." That means nothing is persisted until the *12th* emotion's score comes back and the client fires the one bulk `POST /momentum/assessment/baseline` (§B.2).

Consequence: if a user answers 8 of 12 emotions and then closes the app, force-quits, loses connectivity, or the app crashes, **all 8 answers are gone** — nothing was ever written to the database. On return, they have no choice but to start over from emotion 1 (Joy).

This document changes that by making each emotion's score durable the moment it's produced, and adds an endpoint the client can call on entry to resume from the correct emotion. **B.2 (`POST /momentum/assessment/baseline`) is retired** — its two jobs (persist scores, flip `hasCompletedBaseline`) move into the updated B.1, called once per emotion, so there is no longer a final bulk-submit step. This avoids introducing a duplicate/parallel persistence path.

---

## API 1 — Score Emotion From Conversation (modified)

### API Name
Score Emotion From Conversation

### Method
`POST`

### Endpoint
`/api/momentum/assessment/emotion-score`

### Authentication
Bearer token required.

### Purpose
Runs an AI judge over one emotion's check-in transcript to produce a 1–10 score, **and now also persists that score as part of the authenticated user's baseline assessment progress** — this is the single write path for baseline data. Called once per emotion, immediately after that emotion's conversation ends (not once per full check-in). This replaces the old behavior where scoring was stateless and persistence only happened later in a separate bulk call.

Behavior differs by `checkInType`:
- `"baseline"` — score is persisted per the logic below (**this is the change**).
- `"daily"` — **unchanged**, still stateless here; daily check-ins continue to be persisted in bulk by `POST /momentum/checkin` as already specified. Do not apply any of the persistence logic below when `checkInType` is `"daily"`.

### Request
No change to the request shape:
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
| `emotionId` | string | Yes | One of the 12 known emotion slugs |
| `checkInType` | `"baseline"` \| `"daily"` | Yes | Determines whether this call persists (see above) |
| `transcript` | array of `{ source: "user"\|"ai", message: string }` | Yes | At least one `source: "user"` entry required |

### Response — `200` (when `checkInType: "baseline"`)
Mid-assessment example — the 9th of 12 emotions was just scored:
```json
{
  "success": true,
  "message": "Score calculated",
  "data": {
    "emotionId": "confidence",
    "score": 7,
    "totalEmotions": 12,
    "completedEmotions": 9,
    "hasCompletedBaseline": false,
    "nextEmotion": { "id": "enthusiasm", "name": "Enthusiasm", "order": 9 },
    "currentDay": null
  }
}
```

Final-emotion example — the 12th (last) emotion was just scored, completing the baseline:
```json
{
  "success": true,
  "message": "Score calculated",
  "data": {
    "emotionId": "contentment",
    "score": 8,
    "totalEmotions": 12,
    "completedEmotions": 12,
    "hasCompletedBaseline": true,
    "nextEmotion": null,
    "currentDay": 1
  }
}
```

| Field | Type | Notes |
|---|---|---|
| `emotionId` | string | Echo of the request |
| `score` | integer 1–10 | The judged score |
| `totalEmotions` | integer | Always `12` |
| `completedEmotions` | integer | Count of emotions with a saved baseline score for this user **after** this write, including this one |
| `hasCompletedBaseline` | boolean | `true` only on the call that completes the 12th (last) previously-incomplete emotion |
| `nextEmotion` | object \| `null` | `{ id, name, order }` of the next emotion (in the fixed order below) that still needs a score; `null` once `hasCompletedBaseline` is `true` |
| `currentDay` | integer \| `null` | `null` unless this call just completed the baseline, in which case `1` — same meaning/value as §B.2's old `currentDay` (drives §B.5's daily rotation) |

Response — `200` (when `checkInType: "daily"`): **unchanged**, no new fields, no persistence — `{ "success": true, "message": "Score calculated", "data": { "emotionId": "confidence", "score": 7 } }`.

### Errors
Same as existing §B.1, plus:
- `409` — `{ "success": false, "message": "Baseline already completed", "code": "ALREADY_COMPLETED" }` if `checkInType: "baseline"` and the user's baseline is already fully complete (all 12 emotions already have a saved score). This mirrors the old B.2 conflict case and protects against a stale/duplicate client resubmitting after completion.
- `422` / `500` — standard shapes, unchanged.

### Backend Logic
1. Run the AI judge exactly as already specified in §B.1 to produce `score` (1–10) for `emotionId`.
2. If `checkInType` is `"daily"`, return the response as-is today — stop here, no persistence.
3. If `checkInType` is `"baseline"`:
   a. If the user's baseline is already marked complete, return `409 ALREADY_COMPLETED` without writing anything.
   b. **Upsert** (not insert-only) a baseline score record keyed by `(user_id, emotion_id)`: if a record for this user+emotion already exists (e.g. the client retried the same emotion after a network failure on a previous attempt), overwrite its `score` and `updated_at` rather than creating a duplicate row. This makes the endpoint safe to retry.
   c. Recompute `completedEmotions` = count of distinct emotions this user has a saved baseline score for, after the upsert.
   d. Determine `nextEmotion`: the first emotion, in the fixed order below, that does **not** yet have a saved score for this user. `null` if none remain.
   e. If `completedEmotions === 12` (all emotions now scored): set `hasCompletedBaseline = true` on the user record, initialize `currentDay = 1` (same as old §B.2 step), and also write a rollup history record if your schema requires one for `GET /momentum/history` / `GET /momentum/dashboard` to read baseline scores the same way they read daily ones (see Database Requirements — reuse whatever table already backs those two reads for daily check-ins, keyed `type: "baseline"`, `dayNumber: 0`, exactly as originally specified in §B.2).
   f. Return the response fields above.

Fixed emotion order (must match `GET /momentum/emotions` and the client's bundled copy exactly):
```
1. joy            5. determination   9. enthusiasm
2. gratitude      6. compassion     10. resilience
3. inspiration    7. clarity        11. hope
4. focus          8. confidence     12. contentment
```

### Database Requirements
- A per-user, per-emotion baseline score record is the source of truth for progress. Minimum columns: `user_id`, `emotion_id`, `score` (1–10), `question_source` / `transcript_ref` if you want to keep the judged transcript for audit (optional — not required by the frontend), `created_at`, `updated_at`. Unique constraint on `(user_id, emotion_id)` for baseline-type records so the upsert in step 3b is enforceable at the DB level, not just in application code.
- `completedEmotions` for a user = `COUNT(DISTINCT emotion_id)` of their baseline score records.
- `nextEmotion` = first emotion (by the fixed `order` above) with no baseline score record for this user.
- Baseline completion status: either a dedicated `hasCompletedBaseline` boolean on the user record (as already specified in §B.2/Part A), flipped the moment `completedEmotions` reaches 12 — this is what `GET /user/profile`, Login, and Register already return and what the app's navigation gate relies on — or derive it live from the count; either is fine as long as `GET /user/profile`'s `hasCompletedBaseline` stays consistent with what API 2 below reports.
- If baseline scores need to feed `GET /momentum/dashboard` / `GET /momentum/history` the same way daily scores do (per the existing "latest submission wins per emotion" rule in §B.4), write the same rollup history record your daily check-in path already writes, once, when the 12th emotion completes — reuse that existing table/format rather than creating a second one.

---

## API 2 — Get Baseline Progress (new)

### API Name
Get Baseline Progress

### Method
`GET`

### Endpoint
`/api/momentum/assessment/baseline/progress`

### Authentication
Bearer token required.

### Purpose
Called by the client every time the Baseline Assessment flow is entered (app open, app restart, re-login, or simply navigating back into it) so it can resume at the correct emotion instead of restarting from the first one. Tells the client:
- Whether the baseline is fully completed.
- How many of the 12 emotions have a saved score, and which ones.
- Which emotion to resume from next (if not yet complete).
- Each completed emotion's saved score, so the client can rebuild its local answer state without re-asking anything.

This endpoint must reflect the exact same underlying data as API 1 writes — it does not need its own separate storage.

### Request
No parameters. The user is identified from the Bearer token.

### Response — `200`

New user / baseline not yet started:
```json
{
  "success": true,
  "message": "Baseline progress fetched successfully",
  "data": {
    "completed": false,
    "totalEmotions": 12,
    "completedEmotions": 0,
    "nextEmotion": { "id": "joy", "name": "Joy", "order": 1 },
    "emotions": [
      { "emotionId": "joy", "name": "Joy", "order": 1, "status": "pending", "score": null, "completedAt": null },
      { "emotionId": "gratitude", "name": "Gratitude", "order": 2, "status": "pending", "score": null, "completedAt": null },
      { "emotionId": "inspiration", "name": "Inspiration", "order": 3, "status": "pending", "score": null, "completedAt": null },
      { "emotionId": "focus", "name": "Focus", "order": 4, "status": "pending", "score": null, "completedAt": null },
      { "emotionId": "determination", "name": "Determination", "order": 5, "status": "pending", "score": null, "completedAt": null },
      { "emotionId": "compassion", "name": "Compassion", "order": 6, "status": "pending", "score": null, "completedAt": null },
      { "emotionId": "clarity", "name": "Clarity", "order": 7, "status": "pending", "score": null, "completedAt": null },
      { "emotionId": "confidence", "name": "Confidence", "order": 8, "status": "pending", "score": null, "completedAt": null },
      { "emotionId": "enthusiasm", "name": "Enthusiasm", "order": 9, "status": "pending", "score": null, "completedAt": null },
      { "emotionId": "resilience", "name": "Resilience", "order": 10, "status": "pending", "score": null, "completedAt": null },
      { "emotionId": "hope", "name": "Hope", "order": 11, "status": "pending", "score": null, "completedAt": null },
      { "emotionId": "contentment", "name": "Contentment", "order": 12, "status": "pending", "score": null, "completedAt": null }
    ]
  }
}
```

Partially complete (matches the roadmap's Joy → Gratitude → Inspiration example, resume from Focus):
```json
{
  "success": true,
  "message": "Baseline progress fetched successfully",
  "data": {
    "completed": false,
    "totalEmotions": 12,
    "completedEmotions": 3,
    "nextEmotion": { "id": "focus", "name": "Focus", "order": 4 },
    "emotions": [
      { "emotionId": "joy", "name": "Joy", "order": 1, "status": "completed", "score": 8, "completedAt": "2026-08-20T14:02:00.000Z" },
      { "emotionId": "gratitude", "name": "Gratitude", "order": 2, "status": "completed", "score": 7, "completedAt": "2026-08-20T14:05:00.000Z" },
      { "emotionId": "inspiration", "name": "Inspiration", "order": 3, "status": "completed", "score": 9, "completedAt": "2026-08-20T14:08:00.000Z" },
      { "emotionId": "focus", "name": "Focus", "order": 4, "status": "pending", "score": null, "completedAt": null },
      { "emotionId": "determination", "name": "Determination", "order": 5, "status": "pending", "score": null, "completedAt": null },
      { "emotionId": "compassion", "name": "Compassion", "order": 6, "status": "pending", "score": null, "completedAt": null },
      { "emotionId": "clarity", "name": "Clarity", "order": 7, "status": "pending", "score": null, "completedAt": null },
      { "emotionId": "confidence", "name": "Confidence", "order": 8, "status": "pending", "score": null, "completedAt": null },
      { "emotionId": "enthusiasm", "name": "Enthusiasm", "order": 9, "status": "pending", "score": null, "completedAt": null },
      { "emotionId": "resilience", "name": "Resilience", "order": 10, "status": "pending", "score": null, "completedAt": null },
      { "emotionId": "hope", "name": "Hope", "order": 11, "status": "pending", "score": null, "completedAt": null },
      { "emotionId": "contentment", "name": "Contentment", "order": 12, "status": "pending", "score": null, "completedAt": null }
    ]
  }
}
```

Fully completed:
```json
{
  "success": true,
  "message": "Baseline progress fetched successfully",
  "data": {
    "completed": true,
    "totalEmotions": 12,
    "completedEmotions": 12,
    "nextEmotion": null,
    "emotions": [
      { "emotionId": "joy", "name": "Joy", "order": 1, "status": "completed", "score": 8, "completedAt": "2026-08-20T14:02:00.000Z" },
      { "emotionId": "gratitude", "name": "Gratitude", "order": 2, "status": "completed", "score": 7, "completedAt": "2026-08-20T14:05:00.000Z" }
      /* ...remaining 10 emotions, all status: "completed" */
    ]
  }
}
```

| Field | Type | Notes |
|---|---|---|
| `completed` | boolean | `true` once all 12 emotions have a saved score — equivalent to the user's `hasCompletedBaseline` |
| `totalEmotions` | integer | Always `12` |
| `completedEmotions` | integer | Count of emotions with a saved score for this user |
| `nextEmotion` | object \| `null` | `{ id, name, order }` — the emotion the client should resume from; `null` when `completed` is `true` |
| `emotions` | array (always all 12, in fixed order) | Per-emotion status — see below |
| `emotions[].emotionId` | string | Matches `GET /momentum/emotions` slugs |
| `emotions[].name` | string | Display name |
| `emotions[].order` | integer | 1–12, fixed order above |
| `emotions[].status` | `"completed"` \| `"pending"` | |
| `emotions[].score` | integer 1–10 \| `null` | `null` when `status` is `"pending"` |
| `emotions[].completedAt` | ISO 8601 string \| `null` | When this emotion's score was saved |

### Errors
- `401` — unauthorized, standard shape.
- `500` — standard shape.

No `404`/empty-state case: a brand-new user with zero progress still gets a `200` with `completed: false`, `completedEmotions: 0`, `nextEmotion` pointing at the first emotion, and all 12 `emotions[]` entries `"pending"` — same "not an error" convention already used by `GET /momentum/dashboard` for a user with no baseline yet (§B.4).

### Backend Logic
1. Identify the user from the Bearer token.
2. Load all baseline score records for this user (the same table API 1 writes to).
3. Build the `emotions` array in the fixed 12-emotion order, marking each `"completed"` (with its `score`/`completedAt`) or `"pending"` (`score`/`completedAt` both `null`) based on whether a record exists for that emotion.
4. `completedEmotions` = count of `"completed"` entries. `completed` = `completedEmotions === 12` (or read the user's `hasCompletedBaseline` flag directly if you're maintaining it — the two must always agree).
5. `nextEmotion` = the first `"pending"` entry in order, or `null` if none.

### Database Requirements
Reads only — no writes. Same table(s) as API 1's Database Requirements section: one row per `(user_id, emotion_id)` baseline score, plus however `hasCompletedBaseline` is tracked on the user record. No new tables required beyond what API 1 already introduces.

---

## API 3 — Submit Baseline Assessment (retired)

`POST /momentum/assessment/baseline` (previously §B.2) is **no longer called by the client** and is superseded by API 1 above — persistence and baseline completion now happen incrementally, one emotion at a time, as part of `POST /momentum/assessment/emotion-score`. You do not need to build or maintain this endpoint for the flow described in this document. If it's already implemented and other consumers depend on it, it can be left in place unused; it is not required to be removed, but no new work should go into it.

---

## Summary of required backend work
1. Create the per-user, per-emotion baseline score table/records described in API 1's Database Requirements (unique on `(user_id, emotion_id)`).
2. Update `POST /momentum/assessment/emotion-score` so that, when `checkInType: "baseline"`, it upserts the score, recomputes progress, flips `hasCompletedBaseline` + sets `currentDay = 1` on the 12th emotion, and returns the new response fields (`totalEmotions`, `completedEmotions`, `hasCompletedBaseline`, `nextEmotion`, `currentDay`). No change to `"daily"` behavior.
3. Build the new `GET /momentum/assessment/baseline/progress` endpoint (API 2) reading from that same table.
4. No changes required to `POST /momentum/assessment/baseline` (API 3) — simply stop treating it as part of this flow.
