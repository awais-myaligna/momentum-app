# Backend API Issues

Found while integrating the real backend per `BACKEND_API_SPECIFICATION.md`, tested directly against `https://devapi.myaligna.com/api` on 2026-08-10 with the provided test bearer token and a freshly-registered account (`POST /register`). Every endpoint not listed here was tested and matches the spec — see the integration summary in the conversation for the full pass list. These two are genuine backend defects; the frontend has been wired to call the real endpoints regardless (per instructions), so the app will surface these as visible error states rather than silently falling back to mock data.

---

### API
Submit Baseline Assessment

### Endpoint
`POST /momentum/assessment/baseline`

### Problem
Every submission with a complete, valid 12-emotion `scores` payload fails with a `500` and a raw, unhandled Laravel exception — a SQL foreign-key constraint violation — instead of the documented success envelope. Reproduced consistently across two separate freshly-registered accounts (ids 65 and 66), so it is not account-specific or transient.

The underlying error is a foreign key violation on `momentum_baseline_emotion_scores.emotion_id` referencing `momentum_emotions.id`: the service is inserting `emotion_id` values `1` through `12` (looks like it's using the *array position* of each slug in the request body, or a hardcoded 1–12 range) rather than looking up each slug's real numeric `id` in `momentum_emotions` (per `GET /momentum/emotions`, e.g. `joy` → `id: 1`, `gratitude` → `id: 2`, ... `contentment` → `id: 12` — these happen to already line up 1:1 with `sortOrder`, which may be why this bug wasn't caught: it's likely failing because the emotion IDs in this environment's `momentum_emotions` table don't actually start at 1 / aren't contiguous 1–12, or the insert is using a completely unrelated numbering).

Additionally, the `500` response does not follow the documented error envelope at all — it returns Laravel's raw debug error page (`message`, `exception`, `file`, `line`, `trace`) instead of `{ success: false, message, code }`. This suggests `APP_DEBUG` is on for this route in the dev environment, which is also leaking internal file paths, DB host, and schema details in the response body.

### Expected Request
```
POST /momentum/assessment/baseline
{ "scores": { "joy": 7, "gratitude": 8, "inspiration": 6, "focus": 5, "determination": 6, "compassion": 8, "clarity": 4, "confidence": 4, "enthusiasm": 7, "resilience": 5, "hope": 6, "contentment": 7 } }
```

### Actual Request
Same as expected — request shape is correct and accepted (a deliberately incomplete payload, e.g. `{"scores":{"joy":7}}`, correctly returns the documented `422 VALIDATION_ERROR`, so request validation itself is fine; only the full, valid 12-key payload triggers the failure).

### Expected Response
```json
{
  "success": true,
  "message": "Baseline saved",
  "data": {
    "scores": { "joy": 7, "...": "...same 12 keys" },
    "hasCompletedBaseline": true,
    "currentDay": 1
  }
}
```

### Actual Response
```
HTTP 500
{
  "message": "SQLSTATE[23000]: Integrity constraint violation: 1452 Cannot add or update a child row: a foreign key constraint fails (`webexper_devapi`.`momentum_baseline_emotion_scores`, CONSTRAINT `momentum_baseline_emotion_scores_emotion_id_foreign` FOREIGN KEY (`emotion_id`) REFERENCES `momentum_emotions` (`id`)) ...",
  "exception": "Illuminate\\Database\\QueryException",
  "file": "/home/webexper/devapi.myaligna.com/vendor/laravel/framework/src/Illuminate/Database/Connection.php",
  "line": 838,
  "trace": [ /* full Laravel stack trace, ~50 frames, including MomentumApiService.php:74 and MomentumController.php:94 */ ]
}
```

### Required Backend Change
1. In `App\Services\MomentumApiService::submitBaseline()` (`app/Services/MomentumApiService.php:28`), resolve each slug in the request's `scores` object to its real `momentum_emotions.id` via a lookup (e.g. `Emotion::where('slug', $slug)->value('id')`), rather than whatever positional/hardcoded mapping is currently being used.
2. Wrap this endpoint's error handling so failures return the documented envelope (`{ success: false, message, code: "..." }`) instead of Laravel's raw debug output — this route should not be exempt from whatever error-handling middleware produces the correct envelope on other endpoints (e.g. compare to the well-formed `422`/`404` responses on other `/momentum/*` routes, which do follow the spec).
3. Confirm `APP_DEBUG` / debug error pages are disabled for the `devapi` environment's API responses regardless of this specific bug — stack traces currently expose server file paths, DB host, and schema.

### Impact
**Blocks the entire baseline check-in flow end to end.** `AssessmentCompleteScreen`/`BaselineCompletionScreen` can never be reached — the app throws a toast error on the last step of `ConversationScreen` (12th emotion) every time. This also blocks downstream verification of:
- `GET /momentum/emotions/{slug}` (§B.3) with real score data (only verified the pre-baseline `404` case).
- `GET /momentum/dashboard` (§B.4) with real, non-zero scores (only verified the pre-baseline all-zero case).
- `GET /momentum/history` (§B.7) with a real baseline entry (only verified the empty-history case).
- `POST /momentum/checkin` (§B.6) success path — correctly returns `409 { code: "BASELINE_REQUIRED" }` when baseline isn't done yet (not itself a bug, just an additional gate not mentioned in the spec), but the actual submit-and-advance-day path can't be exercised until baseline works.

---

### API
Get Today's Check-In

### Endpoint
`GET /momentum/checkin/today`

### Problem
Every call fails with a `500`, reproduced on two separate freshly-registered accounts (ids 65 and 66):
```json
{ "success": false, "message": "Daily question 1 is not configured for joy.", "code": "QUESTION_CONFIGURATION_INVALID" }
```
At least the error envelope itself is correctly shaped here (unlike the baseline bug above). The message indicates the backend's daily-question bank for `joy` (and likely all emotions) is missing or misconfigured — probably not seeded, or seeded with a different index scheme than the rotation formula in §B.5 expects (`rotationIndex = floor((dayNumber - 1) / 3)`, 0-indexed into a 3-question bank per emotion). For a brand-new user on day 1, `rotationIndex` should be `0`, but the message says "question 1," which reads like the backend may be using 1-indexed lookups against a 0-indexed (or empty) data source, or the question bank simply hasn't been populated from `src/data/questions.js:DAILY_QUESTIONS` as instructed in the spec.

### Expected Request
`GET /momentum/checkin/today` (no body, auth header only)

### Actual Request
Same as expected.

### Expected Response
```json
{
  "success": true,
  "message": "Today's check-in fetched successfully",
  "data": {
    "dayNumber": 1,
    "alreadyCheckedInToday": false,
    "prompts": [
      { "emotionId": "joy", "emotionName": "Joy", "question": "..." },
      { "emotionId": "gratitude", "emotionName": "Gratitude", "question": "..." },
      { "emotionId": "inspiration", "emotionName": "Inspiration", "question": "..." },
      { "emotionId": "focus", "emotionName": "Focus", "question": "..." }
    ]
  }
}
```

### Actual Response
```
HTTP 500
{ "success": false, "message": "Daily question 1 is not configured for joy.", "code": "QUESTION_CONFIGURATION_INVALID" }
```

### Required Backend Change
Populate/fix the daily question bank for all 12 emotions (3 rotating questions each, per `src/data/questions.js:DAILY_QUESTIONS` as the spec instructs), and verify the rotation index used to look up a question is 0-indexed to match the documented formula (`rotationIndex = floor((dayNumber - 1) / 3)`, which yields `0` for a brand-new user's first check-in — index `0` into a 3-item array, not `1`).

### Impact
**Blocks the entire daily check-in flow.** `DailyCheckInScreen` cannot load any prompts for any user on any day — it will always show the "Couldn't load today's check-in" error/retry state. This is independent of the baseline bug above (reproduced on accounts that haven't completed baseline), though in practice a user would need baseline completed first anyway before reaching daily check-ins.
