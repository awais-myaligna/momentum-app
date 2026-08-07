# Momentum — Backend API Documentation

Derived entirely from the current frontend implementation (`src/services/*`, `src/context/*`, `src/screens/**`, `src/navigation/**`, `src/data/*`, `src/utils/*`). Every endpoint below is backed by a real call site in the app today — nothing is speculative.

**The app is now a hybrid.** Part of it talks to the real Aligna backend at `https://devapi.myaligna.com/api` (`src/api/axios.js`); the rest still runs on the in-memory mock (`src/mocks/mockStore.js` + `src/utils/mockRequest.js`). §2 below lists everything that is genuinely wired to the real backend today — those are **excluded** from the build spec in §3, since they're already done and any spec drift should be resolved by reading the real call sites (linked per entry), not this document. §3 is the actual remaining backend work, corrected against what we now know about the real backend's conventions (see §1).

---

## 1. Conventions

### Base URL
```
https://devapi.myaligna.com/api
```
No longer a placeholder — this is the real, live host the app points at (`src/api/axios.js`).

### Authentication
Two modes, matching `src/api/axios.js`:
- **Public** — no token required (Login, Register, Send OTP, Verify OTP, Reset Password).
- **Bearer Token** — `Authorization: Bearer <token>` attached automatically by the Axios request interceptor from `expo-secure-store` (`momentum_auth_token`) for every other call. There is currently **no refresh-token flow** — a `401` is not yet handled specially (see **Standard Error Envelope** below — the status-code mapping described there is not currently wired up in code).

**Path naming is inconsistent across the real backend** — worth flattening/agreeing with the backend team before building more:
- Auth endpoints are flat: `/login`, `/register`, `/send-otp`, `/verify-otp`, `/reset-password` (not `/auth/*` as `src/api/endpoints.js`'s `ENDPOINTS.AUTH` still assumes — that constant is stale/unused; `authService.js` calls these paths as string literals directly).
- Profile is namespaced: `/user/profile`.
- Emotions is namespaced differently again: `/momentum/emotions`.

If §3's remaining endpoints get a `/momentum/*` prefix too (matching Emotions), everything documented below with a bare path (`/dashboard`, `/checkin`, `/history`, etc.) will need the same prefix — flag this with the backend team rather than guessing per-endpoint.

### Standard Request Headers
```
Content-Type: application/json
Accept: application/json
Authorization: Bearer <token>   // omitted for public endpoints
x-api-key: 12345678
```
The `x-api-key` header is sent on **every** request (`src/api/axios.js`) and is currently a hardcoded literal in client source, not an env/secret-store value — flag this with the backend team; it's not documented anywhere as a real requirement, it's just what the client happens to send today.

### Standard Response Envelope
**Real responses do not consistently use one envelope shape** — two shapes are observed in integrated endpoints today:
- **Flat** — Login/Register/Profile responses put fields (`user`, `token`, `message`) directly at the top level, no `data` wrapper (`src/services/authService.js`, `src/services/profileService.js`).
- **Wrapped** — Get Emotions List returns `{ success, message, data: [...] }` (confirmed via Postman, now integrated — see §2).

The Axios response interceptor only unwraps `response.data` (the HTTP body) — it does **not** normalize between these two shapes (`src/api/axios.js` line 32-33). Any new endpoint should confirm which shape it actually returns rather than assuming the wrapped one below is universal.

### Standard Error Envelope
```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "VALIDATION_ERROR",
  "errors": [{ "field": "email", "message": "Enter a valid email address" }]
}
```
**This mapping is currently disabled in code**, not active behavior — `src/api/axios.js`'s response error interceptor (the part that would turn a raw Axios error into one of the internal types below) is commented out. Today, a failed request rejects with the raw Axios error object, and each screen parses it itself — and inconsistently:
- `LoginScreen.js` / `RegisterScreen.js` only read `err.message` (the generic Axios message, e.g. "Request failed with status code 422" — not the backend's actual `message`).
- `ForgotPasswordScreen.js` / `VerifyOtpScreen.js` / `ResetPasswordScreen.js` correctly read `err.response?.data?.message` first, falling back to `err.message`.

Worth fixing (re-enable the interceptor, make all screens consistent) but out of scope for this document. The table below describes the **intended** behavior once/if the interceptor is re-enabled:

| Status | Internal type | Frontend behavior |
|---|---|---|
| No response / network down | `OFFLINE` | "You appear to be offline..." toast |
| Timeout (15s, see `REQUEST_TIMEOUT`) | `TIMEOUT` | "That took longer than expected..." toast |
| `401` | `UNAUTHORIZED` | "Your session has expired..." — should force re-login |
| `>= 500` | `SERVER` | "Something went wrong on our end..." |
| Anything else | `UNKNOWN` | Uses `data.message` if present, else generic fallback |

`403` (forbidden) and `429` (rate limited) are not currently distinguished by the frontend — they will render as `UNKNOWN`/generic error toasts, but should still be returned correctly by the backend for security/observability.

### Score scale
All emotion scores are **integers 1–10 inclusive** (`src/components/ScoreSlider.js` — pill selector, not a continuous slider). No 0 or decimal values anywhere in the frontend.

### The 12 emotions (fixed enum)
```
joy, gratitude, inspiration, focus, determination, compassion,
clarity, confidence, enthusiasm, resilience, hope, contentment
```
Source of truth today: `src/data/emotions.js` (`EMOTIONS`). Order matters — it drives assessment step sequence and daily rotation grouping.

**⚠️ ID scheme mismatch to resolve before building §3.4–§3.7:** the now-real Get Emotions List endpoint (§2) returns **numeric** ids (`1`–`12`), not these string slugs. Every endpoint still to be built in §3 — Assessment baseline, Dashboard, Daily Check-in, History — currently assumes `scores`/`chart`/`emotionId` are keyed by the **string slug** (e.g. `"joy": 7`), because that's what the bundled `src/data/emotions.js` and all client-side logic (`AssessmentContext`, daily rotation, score bands) still use. Nothing in the frontend currently maps the real numeric emotion ids back to these slugs — that mapping needs to be decided (by name match, since `sortOrder` 1–12 happens to line up with this list's order today, or by adding a slug field to the real endpoint) before the remaining endpoints below are built against real numeric ids.

---

## 2. Integrated Endpoints (Live — Do Not Rebuild)

These are genuinely wired to the real backend today. Treat the linked source file as the source of truth for exact shapes — this is a pointer, not a spec, since the real behavior may keep evolving independently of this document.

| Endpoint | Purpose | Frontend call site |
|---|---|---|
| `POST /login` | Authenticates an existing user; returns `{ user, token, message }` flat (no `data` wrapper). `hasCompletedBaseline` comes back on `user`. | `src/services/authService.js:login()` ← `LoginScreen.js` |
| `POST /register` | Creates an account. Real payload is much richer than a name/email/password form: `{ first_name, last_name, nickname, dob, gender, default_language, default_agent, email, phone, password, password_confirmation }`. | `src/services/authService.js:register()` ← `RegisterScreen.js` |
| `POST /send-otp` | Sends a password-reset OTP to `{ email }`. Used both for the initial "Forgot password?" flow and OTP resend. | `src/services/authService.js:sendOtp()` ← `ForgotPasswordScreen.js`, `VerifyOtpScreen.js` (resend) |
| `POST /verify-otp` | Verifies `{ email, otp }`; response must include `reset_token`, which the client carries forward to Reset Password — client throws if it's missing. | `src/services/authService.js:verifyOtp()` ← `VerifyOtpScreen.js` |
| `POST /reset-password` | Submits `{ email, token, password, password_confirmation }` to finalize the reset. | `src/services/authService.js:resetPassword()` ← `ResetPasswordScreen.js` |
| `GET /user/profile` | Returns the user's **identity** fields: `first_name`, `last_name`, `nickname`, `email`, `phone`, `dob`, `gender`, `default_language`, `default_agent`. Response is `{ user, message }` or the user flat — client checks both (`response?.user \|\| response`). | `src/services/profileService.js:getUserProfile()` ← `EditProfileScreen.js` |
| `PUT /user/profile` | Partial update of the same identity fields; client only ever sends the diffed subset. Response must include `user`, or the client throws. | `src/services/profileService.js:updateUserProfile()` ← `EditProfileScreen.js` |
| `GET /momentum/emotions` | Returns the 12 core emotions: `{ success, message, data: [{ id, name, icon, description, sortOrder }] }` — `data` **is** the wrapper here (see §1's envelope note). `id` is numeric, not the string slug — see §1's ID scheme warning. | `src/services/emotionService.js:getEmotions()` — just integrated; **no screen calls it yet**, same as before (screens still read the bundled `src/data/emotions.js` constant directly) |

**Not (yet) real, despite looking similar:**
- **Logout** (`POST /logout`) — the real call is written but currently **commented out** in `src/services/authService.js:logout()`; only the local token/user is cleared from `expo-secure-store`. No server-side session invalidation happens today. This stays documented as a remaining item — see §3.1.
- **Preferences profile** (language / voice / notifications) — a *different* profile concept from `/user/profile` above, still fully mocked. See §3.2.

---

## 3. Remaining / To Be Built

Only these are still backed by the mock (`src/mocks/mockStore.js`) and need real backend work. Everything else has been removed from this document per §2.

### 3.1 Logout

| | |
|---|---|
| **Endpoint** | `POST /logout` |
| **Purpose** | Invalidate the current session server-side. The frontend already has this call written (`src/services/authService.js`) but it's commented out — re-enabling it is a one-line frontend change once the backend endpoint is confirmed to exist and behave correctly. |
| **Auth** | Bearer Token |

**Request Payload**: none (empty body)

**Success Response — `200 OK`**
```json
{ "success": true, "message": "Logged out successfully" }
```

**Error Responses**

| Status | Meaning |
|---|---|
| `401` | Token missing/expired/already invalidated |
| `500` | Server error |

**Frontend Usage**: `src/screens/Profile/ProfileScreen.js` — confirmation dialog → `AuthContext.logout()` → `authService.logout()`. The client always clears its local token/user regardless of this call's outcome, so it should be treated as best-effort from the client's perspective, but the server must still actually invalidate the token.

**Notes**: Should be idempotent — calling it twice (e.g. a retried request) must not error.

---

### 3.2 Preferences Profile (Notifications / Language / Voice)

**Distinct from the real `/user/profile` in §2** — that endpoint owns identity fields (name, email, dob, gender, etc.); this one owns Momentum-specific preferences. `NotificationScreen`, `LanguageScreen`, and `VoicePreferencesScreen` are three different UI surfaces that all call the *same* mocked `getProfile()`/`updateProfile()` today — there is no separate "notifications API" or "language API", and that reuse should carry over to the real implementation (one endpoint, not four).

**Before building this as a new endpoint**, note the overlap with §2's real `/user/profile`: it already returns `default_language` and `default_agent`, which are conceptually the same values as this section's `language` and `voice`. Confirm with the backend team whether `LanguageScreen`/`VoicePreferencesScreen` should simply be repointed at `/user/profile`'s existing fields instead of getting a new endpoint — that would remove this section entirely rather than requiring new backend work.

#### 3.2.1 Get Preferences

| | |
|---|---|
| **Endpoint** | `GET /profile` *(placeholder path — resolve against §3.2's overlap note above before building)* |
| **Auth** | Bearer Token |

**Success Response — `200 OK`**
```json
{
  "success": true,
  "data": {
    "id": "usr_8f3a1c",
    "name": "Alex Rivera",
    "email": "alex.rivera@example.com",
    "language": "English",
    "voice": "Female",
    "notificationsEnabled": true
  }
}
```

| Field | Type | Description |
|---|---|---|
| `language` | enum string | One of `English`, `Spanish`, `French`, `Portuguese` (`LanguageScreen.js`) |
| `voice` | enum string | One of `Female`, `Male` (`VoicePreferencesScreen.js`) |
| `notificationsEnabled` | boolean | Daily check-in reminder toggle (`NotificationScreen.js`) |

**Error Responses**: `401`, `404` (profile not found for a valid token — should not normally happen), `500`.

**Frontend Usage**: `HomeScreen.js`, `SettingsScreen.js`, `NotificationScreen.js`, `LanguageScreen.js`, `VoicePreferencesScreen.js` (all via `useFocusEffect`/mount, no shared cache).

**Caching**: Frontend does **not** cache — every screen refetches on mount/focus.

#### 3.2.2 Update Preferences

| | |
|---|---|
| **Endpoint** | `PATCH /profile` *(same placeholder-path caveat as above)* |
| **Auth** | Bearer Token |

**Request Payload** — any subset (frontend always sends exactly one field at a time):
```json
{ "notificationsEnabled": false }
```
```json
{ "language": "Spanish" }
```
```json
{ "voice": "Male" }
```

**Success Response — `200 OK`** — returns the full, updated preferences object (same shape as 3.2.1).

**Error Responses**

| Status | Meaning | Example |
|---|---|---|
| `401` | No/expired token | — |
| `422` | Invalid enum value | `{ "success": false, "message": "Validation failed", "code": "VALIDATION_ERROR", "errors": [{ "field": "language", "message": "Unsupported language" }] }` |
| `500` | Server error | — |

**Frontend Usage**: `NotificationScreen.js`, `LanguageScreen.js`, `VoicePreferencesScreen.js` — all three use an identical optimistic-update-then-rollback-on-error pattern, so a `4xx` here must not partially apply the update server-side, and the response should stay fast (<300ms) since the UI already shows the new value before the request resolves.

---

### 3.3 Get Emotion Detail

| | |
|---|---|
| **Endpoint** | `GET /emotions/{emotionId}` *(confirm prefix against §1's `/momentum/emotions` note — likely `/momentum/emotions/{emotionId}`)* |
| **Purpose** | Returns one emotion's metadata **plus the current user's score, score band, and personalized guidance for that band**. Per-user, not static. |
| **Auth** | Bearer Token |

**Path Parameters**

| Param | Type | Description |
|---|---|---|
| `emotionId` | — | **Resolve against §1's ID scheme warning** — the real Get Emotions List (§2) uses numeric ids; decide whether this path param takes that numeric id or the frontend's string slug before building. |

**Success Response — `200 OK`**
```json
{
  "success": true,
  "data": {
    "id": "confidence",
    "name": "Confidence",
    "icon": "shield-checkmark-outline",
    "description": "Confidence is the belief in one's abilities, worth, and capacity to take action...",
    "score": 4,
    "band": "danger",
    "bandLabel": "Needs attention",
    "guidance": "Confidence may feel shaky right now. Recall a recent moment, even small, where you handled something well."
  }
}
```

| Field | Type | Description |
|---|---|---|
| `score` | int 1–10 | User's latest recorded score for this emotion (from the most recent baseline or daily check-in) |
| `band` | enum | `danger` (score ≤4), `warning` (5–7), `success` (8–10) — see `getScoreBand()` in `src/data/emotions.js` |
| `bandLabel` | string | `Needs attention` / `Building` / `Thriving` |
| `guidance` | string | Band-specific encouragement/action text (36 total combinations: 12 emotions × 3 bands) |

**Error Responses**

| Status | Meaning | Example |
|---|---|---|
| `401` | No/expired token | — |
| `404` | Unknown `emotionId`, or user has no score yet for this emotion (e.g. baseline not completed) | `{ "success": false, "message": "Unknown emotion: xyz", "code": "NOT_FOUND" }` |
| `500` | Server error | — |

**Frontend Usage**: `src/screens/Dashboard/EmotionDetailScreen.js`, used in two modes distinguished by `route.params.mode`:
- `'baseline'` — stepping through all 12 right after the Emotional Compass Check-in, "Continue" chains to the next emotion in order.
- `'dashboard'` — single ad hoc lookup from Home/Chart tap, no chaining.

**Caching**: `description`/`guidance` text is static and cacheable long-term; `score`/`band` must always be fresh per user.

**Notes**: `guidance` text (`src/data/emotionGuidance.js`) and baseline/daily question text (`src/data/questions.js`) are currently **bundled client-side static content**, not backend-served. This endpoint's shape already accounts for guidance coming from the server for a single source of truth and easier localization, but if that's overkill for launch, guidance can stay bundled and this endpoint can omit `guidance`.

---

### 3.4 Submit Baseline Assessment

| | |
|---|---|
| **Endpoint** | `POST /assessment/baseline` *(confirm prefix per §1)* |
| **Purpose** | Submits all 12 emotion scores collected during the one-time Emotional Compass Check-in, establishing the user's baseline chart. |
| **Auth** | Bearer Token |

**Request Payload** — keys are the string slugs today (see §1's ID scheme warning):
```json
{
  "scores": {
    "joy": 7,
    "gratitude": 8,
    "inspiration": 6,
    "focus": 5,
    "determination": 6,
    "compassion": 8,
    "clarity": 4,
    "confidence": 4,
    "enthusiasm": 7,
    "resilience": 5,
    "hope": 6,
    "contentment": 7
  }
}
```

| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `scores` | object | Yes | must contain **all 12** emotion ids as keys, each value integer 1–10 | One score per core emotion |

**Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "Baseline saved",
  "data": {
    "scores": { "joy": 7, "gratitude": 8, "...": "..." },
    "hasCompletedBaseline": true
  }
}
```

**Error Responses**

| Status | Meaning | Example |
|---|---|---|
| `401` | No/expired token | — |
| `409` | Baseline already completed for this user *(optional — current frontend has no redo flow, so treat a second submit as a hard conflict unless product wants otherwise)* | `{ "success": false, "message": "Baseline already completed", "code": "ALREADY_COMPLETED" }` |
| `422` | Missing emotion(s) or out-of-range score | `{ "success": false, "message": "Validation failed", "code": "VALIDATION_ERROR", "errors": [{ "field": "scores.clarity", "message": "Score must be between 1 and 10" }] }` |
| `500` | Server error | — |

**Validation Rules**
- Exactly the 12 known emotion ids, no more, no fewer.
- Each score: integer, 1 ≤ score ≤ 10.

**Frontend Usage**: `src/screens/Assessment/ConversationScreen.js` — accumulates all 12 answers client-side across the wizard (`AssessmentContext`) and fires this **once**, only on the 12th (last) emotion's "Finish Check-In" tap. On success, `AssessmentCompleteScreen` calls `AuthContext.completeBaseline()`, which is what flips `RootNavigator` from the assessment flow into the main tabs.

**Notes**: The reflective *question* for this flow is driven by a third-party **ElevenLabs Conversational AI voice agent** (`ConversationScreen.js`), not this backend. The 1–10 *score* for each emotion comes from `POST /assessment/emotion-score` (§3.9) — the app sends that emotion's transcript there right after the user taps Continue, and accumulates the 12 returned scores client-side before firing this endpoint once at the end. Only text transcripts reach the Aligna backend (via §3.9), never audio, and only for AI judging — this endpoint itself only ever receives the final per-emotion integers.

---

### 3.5 Get Dashboard

| | |
|---|---|
| **Endpoint** | `GET /dashboard` *(confirm prefix per §1)* |
| **Purpose** | Single aggregate endpoint powering the Home tab summary, the full Chart screen, and the post-baseline chart reveal. Returns all 12 emotions' latest scores, color-coded, plus a rollup average and the user's current check-in day counter. |
| **Auth** | Bearer Token |

**Success Response — `200 OK`**
```json
{
  "success": true,
  "data": {
    "hasCompletedBaseline": true,
    "chart": [
      { "emotionId": "joy", "name": "Joy", "score": 7, "color": "success" },
      { "emotionId": "clarity", "name": "Clarity", "score": 4, "color": "danger" }
    ],
    "averageScore": 6.2,
    "currentDay": 4
  }
}
```

| Field | Type | Description |
|---|---|---|
| `hasCompletedBaseline` | boolean | Whether the baseline has been submitted |
| `chart` | array (12 items) | One entry per emotion, in the fixed 12-emotion order |
| `chart[].color` | enum | `danger` \| `warning` \| `success` — pre-computed score band color |
| `averageScore` | number | Mean of all 12 scores, rounded to 1 decimal |
| `currentDay` | int, 1-indexed | Which daily check-in "day" the user is on — drives §3.6's rotation |

**Error Responses**: `401`, `500`.

**Frontend Usage**: `HomeScreen.js`, `ChartScreen.js`, `BaselineCompletionScreen.js` (all three call `getDashboard()` independently — no shared cache).

**Notes**: If no baseline exists yet (`hasCompletedBaseline: false`), `chart[].score` should be `0` for every emotion (matches current mock behavior via `?? 0`), not an error.

---

### 3.6 Daily Check-in

#### 3.6.1 Get Today's Check-in

| | |
|---|---|
| **Endpoint** | `GET /checkin/today` *(confirm prefix per §1)* |
| **Purpose** | Returns the current day's 4-emotion rotation with that rotation's reflective question. Momentum checks in on 4 of the 12 emotions per day, in a repeating 3-day cycle. |
| **Auth** | Bearer Token |

**Rotation logic** (must be reproduced server-side — currently in `src/data/dailyCheckInSchedule.js`):
```
groupIndex = (dayNumber - 1) % 3
group = DAILY_CHECKIN_GROUPS[groupIndex]   // one of the three fixed 4-emotion groups
rotationIndex = floor((dayNumber - 1) / 3)  // which question variant to use, cycles through each emotion's question bank
```
Groups (fixed):
```
Day pattern 1: joy, gratitude, inspiration, focus
Day pattern 2: determination, compassion, clarity, confidence
Day pattern 3: enthusiasm, resilience, hope, contentment
```

**Success Response — `200 OK`**
```json
{
  "success": true,
  "data": {
    "dayNumber": 4,
    "prompts": [
      { "emotionId": "joy", "emotionName": "Joy", "question": "How much lightness or happiness showed up for you today, from 1 to 10?" },
      { "emotionId": "gratitude", "emotionName": "Gratitude", "question": "From 1 to 10, how much appreciation have you felt for the good things around you today?" },
      { "emotionId": "inspiration", "emotionName": "Inspiration", "question": "From 1 to 10, how much creative spark or motivation have you felt today?" },
      { "emotionId": "focus", "emotionName": "Focus", "question": "From 1 to 10, how well were you able to stay present with what mattered today?" }
    ]
  }
}
```

**Error Responses**: `401`, `500`.

**Frontend Usage**: `src/screens/CheckIn/DailyCheckInScreen.js`, on mount and on pull-to-retry.

**Notes**: Question text is currently bundled client-side (`src/data/questions.js`, 3 rotating variants per emotion). This endpoint can either keep serving from that same static table server-side, or the client can keep computing it locally and this endpoint can be skipped entirely.

#### 3.6.2 Submit Daily Check-in

| | |
|---|---|
| **Endpoint** | `POST /checkin` *(confirm prefix per §1)* |
| **Purpose** | Submits the day's 4 emotion scores and advances the user to the next day. |
| **Auth** | Bearer Token |

**Request Payload**
```json
{
  "scores": {
    "joy": 6,
    "gratitude": 7,
    "inspiration": 5,
    "focus": 8
  }
}
```

| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `scores` | object | Yes | must contain exactly the 4 emotion ids for **today's** group, each 1–10 | |

**Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "Check-in saved",
  "data": {
    "nextDay": 5
  }
}
```

**Error Responses**

| Status | Meaning | Example |
|---|---|---|
| `401` | No/expired token | — |
| `409` | Already checked in for today *(recommended — current mock has no such guard since `currentDay` just increments unconditionally on every call, but a real backend should prevent double-submission for the same calendar day)* | `{ "success": false, "message": "You've already checked in today", "code": "ALREADY_CHECKED_IN" }` |
| `422` | Wrong emotion set for today, or out-of-range score | `{ "success": false, "message": "Validation failed", "code": "VALIDATION_ERROR", "errors": [{ "field": "scores", "message": "Expected scores for joy, gratitude, inspiration, focus" }] }` |
| `500` | Server error | — |

**Frontend Usage**: `DailyCheckInScreen.js`, fired once after the 4th prompt's "Finish Check-In".

**Notes**: The current mock (`checkInService.js`) increments `currentDay` unconditionally with no "already checked in today" guard and no real date-based gating — a production backend should key this off calendar date (in the user's timezone) rather than trusting the client to only call it once per day.

---

### 3.7 Get History

| | |
|---|---|
| **Endpoint** | `GET /history` *(confirm prefix per §1)* |
| **Purpose** | Returns every completed check-in (baseline + all daily entries), most recent first, for the History tab's timeline. |
| **Auth** | Bearer Token |

**Success Response — `200 OK`**
```json
{
  "success": true,
  "data": [
    {
      "id": "chk_9f2a41",
      "date": "2026-07-09T14:02:11.000Z",
      "dayNumber": 4,
      "type": "daily",
      "scores": { "joy": 6, "gratitude": 7, "inspiration": 5, "focus": 8 }
    },
    {
      "id": "chk_0001aa",
      "date": "2026-07-05T09:15:00.000Z",
      "dayNumber": 0,
      "type": "baseline",
      "scores": { "joy": 7, "gratitude": 8, "...": "..." }
    }
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `id` | string | Entry id |
| `date` | ISO 8601 string | Submission timestamp |
| `dayNumber` | int | `0` for the baseline entry, 1+ for daily entries |
| `type` | enum | `baseline` \| `daily` |
| `scores` | object | 12 keys for baseline, 4 keys for daily |

**Error Responses**: `401`, `500`.

**Frontend Usage**: `src/screens/History/HistoryScreen.js` — computes each entry's average and score band **client-side** from the raw `scores` map; the backend does not need to pre-compute an average for this endpoint.

**Pagination**: **Not implemented by the current frontend** — it renders the full array with no page/limit params and no infinite scroll. Recommended (not required):
```
GET /history?page=1&limit=20
```
```json
{ "data": [ ], "pagination": { "page": 1, "limit": 20, "total": 187, "totalPages": 10 } }
```

**Search & Filters**: Not implemented today. A `type=daily|baseline` or date-range filter would be a reasonable future addition.

---

### 3.8 Onboarding — No Backend API

`OnboardingScreen` and `IntroductionScreen` are entirely local: "has onboarded" is a boolean flag in `AsyncStorage` (`momentum_has_onboarded`), never sent to the backend (`src/context/AuthContext.js`). There is no `/onboarding` endpoint to build. If Momentum's shared Aligna profile should eventually know whether a user has completed onboarding, the simplest path is adding an `hasOnboarded` boolean to the `User` record and the real `/user/profile` / login response, rather than a dedicated endpoint.

---

### 3.9 Score Emotion From Conversation

| | |
|---|---|
| **Endpoint** | `POST /assessment/emotion-score` *(confirm prefix per §1)* |
| **Purpose** | Runs an AI judge over one emotion's voice/text check-in transcript and returns the 1–10 score for it. Called once per emotion, immediately after the user taps Continue on `ConversationScreen.js` — **not** once per full check-in. |
| **Auth** | Bearer Token |

**Background**: this replaced an earlier design where the ElevenLabs Conversational AI agent itself judged the exchange and called a `record_emotion_score` client tool mid-conversation (still documented in git history / `SYSTEM_PROMPT.md`'s prior revisions). That proved unreliable to get calling consistently — a tool call buried inside a live voice session is hard to debug when it silently doesn't happen. Moving the judgment to an ordinary REST call means the exact input (the transcript) and output (the score) can be logged and replayed like any other request.

**Request Payload**:
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

| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `emotionId` | string enum | Yes | One of the 12 emotion ids | Which emotion this transcript is about |
| `checkInType` | enum | Yes | `"baseline"` \| `"daily"` | Lets the judge calibrate tone/depth expectations the same way `SYSTEM_PROMPT.md` did for the agent |
| `transcript` | array | Yes | At least one `source: "user"` entry | Full exchange for this emotion only, in order, both sides |
| `transcript[].source` | enum | Yes | `"user"` \| `"ai"` | Matches the ElevenLabs SDK's `onMessage` `source` field verbatim — see `ConversationScreen.js` |
| `transcript[].message` | string | Yes | non-empty | The turn's text |

**Success Response — `200 OK`**
```json
{
  "success": true,
  "data": {
    "emotionId": "confidence",
    "score": 7
  }
}
```

**Error Responses**

| Status | Meaning | Example |
|---|---|---|
| `401` | No/expired token | — |
| `422` | Missing/empty transcript, no user turns, or unknown `emotionId` | `{ "success": false, "message": "Validation failed", "code": "VALIDATION_ERROR", "errors": [{ "field": "transcript", "message": "At least one user turn is required" }] }` |
| `500` | Server error, or the judging model itself failed/timed out | — |

**Suggested judging rubric** (moved here from `SYSTEM_PROMPT.md`'s former "How scores are assigned" section — this was written for the ElevenLabs agent to self-apply, and is preserved as a starting point for whatever prompts the backend's judging model):
- **1–2 (very low)** — the emotion sounds largely absent, or the user uses explicitly negative/distressed language about this specific area.
- **3–4 (low)** — mostly struggling or subdued, with only occasional or faint positive signal.
- **5–6 (moderate)** — a mixed or middling picture: present but inconsistent, "okay," "so-so," some good and some not.
- **7–8 (good/strong)** — clearly present and positively described, steady, several concrete positive signals.
- **9–10 (very high)** — vivid, strongly positive language, described as consistently or exceptionally present.
- If the user volunteers a number themselves in the transcript, treat it as one signal among several, not as ground truth.
- No transcript signal strong enough to judge confidently should still resolve to a best-effort estimate (favor 5–6) rather than erroring — §3.4/§3.6.2 require a score for every emotion to submit a baseline/daily check-in, so this endpoint should not leave one out.

**Frontend Usage**: `src/services/emotionService.js:scoreEmotionFromConversation()` ← `ConversationScreen.js`'s `handleContinue`. **Currently mocked** client-side with a placeholder keyword-count scorer (`estimateScoreFromTranscript`) since this backend endpoint doesn't exist yet — swap the mock body for a real `api.post(ENDPOINTS.ASSESSMENT.SCORE_EMOTION, ...)` call once it does; the function's signature and return shape already match this contract.

**Notes**: Crisis/self-harm detection is intentionally **not** part of this endpoint's job — that still happens live, in-conversation, via the ElevenLabs agent's `flag_needs_support` client tool (`TOOLS_AND_APIS.md` §2.2), so the safety response isn't delayed by a network round trip after the fact.

---

## 4. Future / Recommended Additions (Not Required by Current Frontend)

- **Refresh tokens** — the current auth model is a single long-lived bearer token with no rotation/refresh; `axios.js` has no `401` handling wired up at all right now (see §1's Error Envelope note). Production should add refresh-token support and re-enable the error interceptor before launch.
- **Server-side logout** — see §3.1; the client-side call exists but is disabled, so no session is actually invalidated server-side today.
- **Reconcile the emotion ID scheme** — see §1's warning; §3.3–§3.7 all assume string slugs, but the one real reference-data endpoint (§2) uses numeric ids. Settle this before building any of §3.3–§3.7 against real data.
- **Shared Aligna profile sync** — cross-app data sharing with Lotus/TargetPro isn't reflected in this frontend at all today; it's a backend/platform concern layered on top of the `User`/`EmotionScore` tables, not a Momentum-specific endpoint.
