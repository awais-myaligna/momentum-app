# Backend Requirements — Daily Check-In

Written for the backend developer implementing the daily check-in question bank. Extends `BACKEND_API_SPECIFICATION.md` §B.5/§B.6 (that remains the source of truth for the request/response envelope) with the roadmap's pre-recorded-audio requirement and the exact fix needed for the current `500`.

Live bug this doc fixes: `GET /momentum/checkin/today` currently returns
```json
{ "success": false, "message": "Daily question 1 is not configured for joy.", "code": "QUESTION_CONFIGURATION_INVALID" }
```
on every account (also logged in `BACKEND_API_ISSUES.md`). This blocks the daily check-in screen entirely — it is a backend data/config gap, not a frontend bug. Frontend is already wired to consume the correct response shape; it just has nothing valid to render yet.

---

## 1. `GET /momentum/checkin/today`

**Auth:** Bearer token.

**Response — `200`**
```json
{
  "success": true,
  "message": "Today's check-in fetched successfully",
  "data": {
    "dayNumber": 1,
    "alreadyCheckedInToday": false,
    "prompts": [
      {
        "emotionId": "joy",
        "emotionName": "Joy",
        "questionId": "joy_question_1",
        "question": "How joyful do you feel today, from 1 to 10?",
        "audioUrl": "https://devapi.myaligna.com/storage/audio/daily-checkin/joy_question_1.mp3"
      },
      { "emotionId": "gratitude", "emotionName": "Gratitude", "questionId": "gratitude_question_1", "question": "...", "audioUrl": "https://devapi.myaligna.com/storage/audio/daily-checkin/gratitude_question_1.mp3" },
      { "emotionId": "inspiration", "emotionName": "Inspiration", "questionId": "inspiration_question_1", "question": "...", "audioUrl": "https://devapi.myaligna.com/storage/audio/daily-checkin/inspiration_question_1.mp3" },
      { "emotionId": "focus", "emotionName": "Focus", "questionId": "focus_question_1", "question": "...", "audioUrl": "https://devapi.myaligna.com/storage/audio/daily-checkin/focus_question_1.mp3" }
    ]
  }
}
```

`questionId` and `audioUrl` are **new fields**, additive to the existing spec — the frontend already tolerates their absence (falls back to no audio player), so this is safe to roll out incrementally. `audioUrl` must be a fully-qualified, publicly-fetchable URL — audio is hosted server-side (not bundled in the app), and the app plays it directly from this URL. See §3.

### 1.1 Day → emotion group (already specified, restated for convenience)
```
groupIndex = (dayNumber - 1) % 3
group      = GROUPS[groupIndex]
```
```
GROUPS[0] = joy, gratitude, inspiration, focus
GROUPS[1] = determination, compassion, clarity, confidence
GROUPS[2] = enthusiasm, resilience, hope, contentment
```

### 1.2 Question selection — per emotion, per user
Do **not** use a fixed formula based on `dayNumber` alone (that repeats the same question for a user who skips days, and desyncs across emotions once days are missed). Instead:

1. Look up the user's most recent `daily` history record for this `emotionId` (any past submission, most recent by date).
2. Take the `questionId` that was used → find its index in that emotion's question bank.
3. Return the **next** question in the bank (index + 1).
4. If there is no prior record for this emotion, or the prior question was the last in the bank, wrap to question 1.

```
lastQuestionIndex = indexOf(lastUsedQuestionId, bank[emotionId])   // -1 if no prior record
nextIndex         = (lastQuestionIndex + 1) % bank[emotionId].length
questionId        = bank[emotionId][nextIndex].id
```

This is what makes "Joy → Question 2" show up correctly on a user's 2nd Joy check-in even if they skipped a day, and is why it must be driven by the user's actual history, not `dayNumber` alone.

### 1.3 Question bank content
Use the existing copy in `src/data/questions.js:DAILY_QUESTIONS` (3 questions per emotion × 12 emotions = 36 rows) as the seed data — do not write new copy. Suggested schema:

| Column | Example |
|---|---|
| `id` | `joy_question_1` |
| `emotion_id` (FK → `momentum_emotions.id`) | resolves to `joy` |
| `order` | `1` |
| `question_text` | `How joyful do you feel today, from 1 to 10?` |
| `audio_url` | `https://devapi.myaligna.com/storage/audio/daily-checkin/joy_question_1.mp3` |

Every emotion must have **at least one** row before this endpoint can return `200` for any user — this is the direct cause of the current `QUESTION_CONFIGURATION_INVALID` error (`joy` has zero configured rows).

### 1.4 `alreadyCheckedInToday`
Unchanged from spec: `true` if a `type: "daily"` history record exists for the user's current calendar date (user's timezone).

---

## 2. `POST /momentum/checkin` (submit)

**No contract change** — keep exactly as specified:
```json
{ "scores": { "joy": 7, "gratitude": 8, "inspiration": 6, "focus": 9 } }
```
→
```json
{ "success": true, "message": "Check-in saved", "data": { "nextDay": 2 } }
```

Backend already knows which `questionId` it served each emotion for today's session (from step 1.2) — persist that alongside the score server-side; the frontend does not need to send `questionId` back. Required persistence per emotion in the day's submission:

- `user_id`, `emotion_id`, `question_id` (the one actually served), `score` (1–10), `type: "daily"`, `day_number`, submission date (user's timezone).
- Enforce one `daily` record per user per calendar day (backs `alreadyCheckedInToday` and the `409 ALREADY_CHECKED_IN` gate — this part already works correctly today).
- These records are what `GET /momentum/history` and the dashboard's emotional-trend chart read from — no separate storage needed, just make sure `question_id` is captured for future "don't repeat" lookups (§1.2).

---

## 3. Audio — hosted server-side, served as a URL

Check-in voice prompts are **pre-recorded** (not generated live by ElevenLabs/TTS on each request), but they are **stored on the backend/server**, not bundled inside the mobile app binary. The app does not ship any audio files and does not maintain a local key→asset map — it just plays whatever URL the backend returns.

- Upload the 36 recordings (12 emotions × 3 questions) to server-side storage (e.g. Laravel's public disk / S3 / equivalent) and serve them over HTTPS.
- Return the **full, absolute, publicly-fetchable URL** in `audioUrl` on each prompt (§1) — not a relative path, not a bare key.
- The app streams/plays directly from that URL (via `expo-audio`), so no additional download endpoint is needed — a normal static file URL is sufficient, same as any other publicly served asset.
- Do not wire ElevenLabs or any TTS/audio generation into this endpoint — these are static, pre-recorded files, generated/recorded once and reused.
- If a given question's recording isn't uploaded yet, omit `audioUrl` (or return `null`) rather than a broken link — the frontend renders the question text-only in that case, no player shown.

---

## Summary of required backend work
1. Seed the daily question bank (36 rows: 12 emotions × 3 questions) from `src/data/questions.js:DAILY_QUESTIONS` — this alone fixes the current `500`.
2. Implement per-user, per-emotion "next question" selection (§1.2) instead of a pure `dayNumber` formula.
3. Host the 36 pre-recorded audio files server-side and add `questionId` + `audioUrl` (full HTTPS URL) to each `GET /momentum/checkin/today` prompt object.
4. Persist `question_id` on each daily check-in record so future selections can find "the last one used."
