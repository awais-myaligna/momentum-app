# Momentum — Backend API Documentation

Derived entirely from the current frontend implementation (`src/services/*`, `src/context/*`, `src/screens/**`, `src/navigation/**`, `src/data/*`, `src/utils/*`). Every endpoint below is backed by a real call site in the app today — nothing is speculative. Endpoints the frontend does not yet call are called out explicitly in **Future / Recommended Additions** at the end, kept separate from the required spec.

The app currently runs entirely on an in-memory mock (`src/mocks/mockStore.js` + `src/utils/mockRequest.js`) via a stubbed Axios instance (`src/api/axios.js`) pointed at `https://example.com/api`. `src/api/endpoints.js` already defines the intended path map — this document formalizes it into a full contract.

---

## 1. Conventions

### Base URL
```
https://api.aligna.ai/v1
```
(placeholder — replace with the real Aligna backend host)

### Authentication
Two modes, matching `src/api/axios.js`:
- **Public** — no token required (Register, Login).
- **Bearer Token** — `Authorization: Bearer <token>` attached automatically by the Axios request interceptor from `expo-secure-store` (`momentum_auth_token`) for every other call. There is currently **no refresh-token flow** in the frontend — a `401` is treated as "session expired, please sign in again" (see `ERROR_TYPES.UNAUTHORIZED` in `src/utils/apiError.js`).

### Standard Request Headers
```
Content-Type: application/json
Accept: application/json
Authorization: Bearer <token>   // omit for public endpoints
```

### Standard Response Envelope
The frontend's Axios response interceptor unwraps `response.data` directly (`src/api/axios.js` line 32), so the backend should return the payload described per-endpoint below at the top level of `data`. Recommended envelope:
```json
{
  "success": true,
  "message": "Optional human-readable message",
  "data": { }
}
```

### Standard Error Envelope
```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "VALIDATION_ERROR",
  "errors": [{ "field": "email", "message": "Enter a valid email address" }]
}
```
The frontend maps HTTP status to one of five internal error types (`src/utils/apiError.js`):

| Status | Internal type | Frontend behavior |
|---|---|---|
| No response / network down | `OFFLINE` | "You appear to be offline..." toast |
| Timeout (15s, see `REQUEST_TIMEOUT`) | `TIMEOUT` | "That took longer than expected..." toast |
| `401` | `UNAUTHORIZED` | "Your session has expired..." — should force re-login |
| `>= 500` | `SERVER` | "Something went wrong on our end..." |
| Anything else | `UNKNOWN` | Uses `data.message` if present, else generic fallback |

These apply globally to **every** endpoint below, so per-endpoint sections only list status codes with endpoint-specific meaning (e.g. a `404` for "emotion not found"). `403` (forbidden) and `429` (rate limited) are not currently distinguished by the frontend — they will render as `UNKNOWN`/generic error toasts, but should still be returned correctly by the backend for security/observability.

### Score scale
All emotion scores are **integers 1–10 inclusive** (`src/components/ScoreSlider.js` — pill selector, not a continuous slider). No 0 or decimal values anywhere in the frontend.

### The 12 emotions (fixed enum)
```
joy, gratitude, inspiration, focus, determination, compassion,
clarity, confidence, enthusiasm, resilience, hope, contentment
```
Source of truth today: `src/data/emotions.js` (`EMOTIONS`). Order matters — it drives assessment step sequence and daily rotation grouping.

---

## 2. Authentication

### 2.1 Register

| | |
|---|---|
| **Endpoint** | `POST /auth/register` |
| **Purpose** | Creates a new Aligna account and starts an authenticated session so the app can proceed straight into the baseline assessment. Called from `RegisterScreen` → `AuthContext.register()` → `authService.register()`. |
| **Auth** | Public |

**Request Headers**
```
Content-Type: application/json
Accept: application/json
```

**Request Payload**
```json
{
  "name": "Jordan Lee",
  "email": "jordan@example.com",
  "password": "hunter22"
}
```

| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `name` | string | Yes | trimmed, min 2 chars | Full display name |
| `email` | string | Yes | trimmed, valid email format | Login identifier |
| `password` | string | Yes | min 6 chars | Plaintext over TLS; hash server-side (bcrypt/argon2) |

Note: `RegisterScreen`'s form also collects `confirmPassword`, validated client-side only (`Yup.ref('password')` in `src/utils/validationSchemas.js`) — **do not** send it to the backend.

**Success Response — `201 Created`**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "id": "usr_8f3a1c",
      "name": "Jordan Lee",
      "email": "jordan@example.com"
    },
    "hasCompletedBaseline": false
  }
}
```

| Field | Description |
|---|---|
| `token` | Bearer token, stored client-side in `expo-secure-store` under `momentum_auth_token` |
| `user.id` / `.name` / `.email` | Echoed back for the session |
| `hasCompletedBaseline` | **Required for `RootNavigator`'s routing gate** — `AuthContext` sets this immediately after register/login without a second round trip; must be `false` for a brand-new account |

**Error Responses**

| Status | Meaning | Example |
|---|---|---|
| `400` | Malformed JSON body | `{ "success": false, "message": "Invalid request body", "code": "BAD_REQUEST" }` |
| `409` | Email already registered | `{ "success": false, "message": "An account with this email already exists", "code": "EMAIL_TAKEN" }` |
| `422` | Field validation failed | `{ "success": false, "message": "Validation failed", "code": "VALIDATION_ERROR", "errors": [{ "field": "password", "message": "Password must be at least 6 characters" }] }` |
| `429` | Too many registration attempts from this IP | `{ "success": false, "message": "Too many attempts. Try again later.", "code": "RATE_LIMITED" }` |
| `500` | Server error | `{ "success": false, "message": "Something went wrong on our end. Please try again shortly.", "code": "SERVER_ERROR" }` |

**Validation Rules**
- Email must be RFC-valid and unique (case-insensitive match recommended).
- Password minimum 6 characters (frontend enforces this minimum; consider raising server-side to 8+ with complexity rules since 6 is quite low for production).
- Name minimum 2 characters after trim.

**Database Objects**: `User`

**Frontend Usage**: `src/screens/Auth/RegisterScreen.js` (Formik submit) → `src/context/AuthContext.js:register()` → `src/services/authService.js:register()`. Called once, on account creation.

**Caching**: None. Token persisted to `expo-secure-store`; no in-memory cache needed beyond React state.

**Pagination**: N/A

**Search & Filters**: N/A

**File Upload**: N/A — no avatar/image upload exists anywhere in the current UI (`Avatar.js` renders initials only).

**Notes**: `AuthContext` sets `isAuthenticated = true` and reads `hasCompletedBaseline` synchronously from this response — do not omit it or the app will misroute.

---

### 2.2 Login

| | |
|---|---|
| **Endpoint** | `POST /auth/login` |
| **Purpose** | Authenticates an existing user. Called from `LoginScreen` → `AuthContext.login()` → `authService.login()`. |
| **Auth** | Public |

**Request Headers**
```
Content-Type: application/json
Accept: application/json
```

**Request Payload**
```json
{
  "email": "jordan@example.com",
  "password": "hunter22"
}
```

| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `email` | string | Yes | trimmed, valid email | Login identifier |
| `password` | string | Yes | min 6 chars | Plaintext over TLS |

**Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "id": "usr_8f3a1c",
      "name": "Jordan Lee",
      "email": "jordan@example.com"
    },
    "hasCompletedBaseline": true
  }
}
```
Same field meanings as Register. `hasCompletedBaseline` here reflects the account's real history and drives whether `RootNavigator` sends the user into the baseline `AssessmentFlow` or straight to `MainFlow`.

**Error Responses**

| Status | Meaning | Example |
|---|---|---|
| `400` | Malformed body | `{ "success": false, "message": "Invalid request body", "code": "BAD_REQUEST" }` |
| `401` | Wrong email/password | `{ "success": false, "message": "Incorrect email or password", "code": "INVALID_CREDENTIALS" }` |
| `404` | No account for that email *(optional — many APIs intentionally return 401 instead, to avoid leaking which emails are registered)* | `{ "success": false, "message": "Incorrect email or password", "code": "INVALID_CREDENTIALS" }` |
| `422` | Validation failed | `{ "success": false, "message": "Validation failed", "code": "VALIDATION_ERROR", "errors": [{ "field": "email", "message": "Enter a valid email address" }] }` |
| `429` | Too many failed attempts | `{ "success": false, "message": "Too many attempts. Try again later.", "code": "RATE_LIMITED" }` |
| `500` | Server error | `{ "success": false, "message": "Something went wrong on our end. Please try again shortly.", "code": "SERVER_ERROR" }` |

**Validation Rules**: Same as Register (email format, password min 6).

**Database Objects**: `User`

**Frontend Usage**: `src/screens/Auth/LoginScreen.js` → `AuthContext.login()` → `authService.login()`.

**Caching**: None.

**Notes**: Recommend `401` (not `404`) for unknown email, to avoid user enumeration.

---

### 2.3 Logout

| | |
|---|---|
| **Endpoint** | `POST /auth/logout` |
| **Purpose** | Invalidates the current session server-side. Called from `ProfileScreen` (via the "Log Out" confirmation dialog) → `AuthContext.logout()` → `authService.logout()`. |
| **Auth** | Bearer Token |

**Request Headers**
```
Authorization: Bearer <token>
Accept: application/json
```

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

**Database Objects**: `User` (and `Session`/`RefreshToken` if that model is adopted — see Future Additions).

**Frontend Usage**: `src/screens/Profile/ProfileScreen.js` — confirmation dialog → `logout()`. On success (or failure), the client always clears its local mock state and deletes the stored token (`SecureStore.deleteItemAsync`), so the backend call should be treated as best-effort from the client's perspective, but the server must still actually invalidate the token.

**Caching**: N/A. **Notes**: Should be idempotent — calling it twice (e.g. a retried request) must not error.

---

## 3. Profile & Settings

The frontend has **one** profile object and **one** update endpoint. `NotificationScreen`, `LanguageScreen`, and `VoicePreferencesScreen` are three different UI surfaces that all call the *same* `updateProfile()` with a single changed field — there is no separate "notifications API" or "language API". Documenting this as one endpoint (not four) intentionally avoids duplicate endpoints per the reuse principle.

### 3.1 Get Profile

| | |
|---|---|
| **Endpoint** | `GET /profile` |
| **Purpose** | Fetches the current user's profile: identity plus Momentum preferences (language, voice, notifications). |
| **Auth** | Bearer Token |

**Request Headers**
```
Authorization: Bearer <token>
Accept: application/json
```

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
| `id` | string | User id |
| `name` | string | Display name |
| `email` | string | Account email |
| `language` | enum string | One of `English`, `Spanish`, `French`, `Portuguese` (`LanguageScreen.js` — roadmap §12) |
| `voice` | enum string | One of `Female`, `Male` (`VoicePreferencesScreen.js` — roadmap §12, agent voice/gender) |
| `notificationsEnabled` | boolean | Daily check-in reminder toggle (`NotificationScreen.js`) |

**Error Responses**: `401` (no/expired token), `404` (profile not found for a valid token — should not normally happen), `500`.

**Database Objects**: `User`

**Frontend Usage**: Called on mount/focus by `HomeScreen`, `ProfileScreen`, `SettingsScreen` (via `useFocusEffect`, refetches every time the tab regains focus), `NotificationScreen`, `LanguageScreen`, `VoicePreferencesScreen`.

**Caching**: Frontend does **not** cache — every screen refetches on mount/focus. A short server-side cache (or ETag support) is reasonable since this is a low-write, high-read resource.

---

### 3.2 Update Profile

| | |
|---|---|
| **Endpoint** | `PATCH /profile` |
| **Purpose** | Partial update of profile preferences. Used for three distinct UI actions that all funnel through this one call. |
| **Auth** | Bearer Token |

**Request Payload** — any subset of these fields (frontend always sends exactly one at a time, but the endpoint should accept any combination):
```json
{ "notificationsEnabled": false }
```
```json
{ "language": "Spanish" }
```
```json
{ "voice": "Male" }
```

| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `name` | string | No | min 2 chars if present | Not currently editable in the UI, but the service layer is generic — reserve the field |
| `language` | string | No | one of `English`, `Spanish`, `French`, `Portuguese` | |
| `voice` | string | No | one of `Female`, `Male` | |
| `notificationsEnabled` | boolean | No | — | |

**Success Response — `200 OK`** — returns the full, updated profile (same shape as 3.1):
```json
{
  "success": true,
  "message": "Profile updated",
  "data": {
    "id": "usr_8f3a1c",
    "name": "Alex Rivera",
    "email": "alex.rivera@example.com",
    "language": "Spanish",
    "voice": "Female",
    "notificationsEnabled": true
  }
}
```

**Error Responses**

| Status | Meaning | Example |
|---|---|---|
| `401` | No/expired token | — |
| `422` | Invalid enum value | `{ "success": false, "message": "Validation failed", "code": "VALIDATION_ERROR", "errors": [{ "field": "language", "message": "Unsupported language" }] }` |
| `500` | Server error | — |

**Database Objects**: `User`

**Frontend Usage**:
- `NotificationScreen.js` — optimistic toggle (flips UI immediately, reverts on error) with `{ notificationsEnabled }`.
- `LanguageScreen.js` — optimistic select with `{ language }`.
- `VoicePreferencesScreen.js` — optimistic select with `{ voice }`.

All three use the identical optimistic-update-then-rollback-on-error pattern — worth keeping the response fast (<300ms) since the UI is already showing the new value before the request resolves.

**Caching**: None — always a fresh write.

**Notes**: Every one of these three screens rolls the local UI state back to the previous value if this call fails, so a `4xx` here must not partially apply the update server-side.

---

## 4. Emotions (Reference Data)

### 4.1 Get Emotions List

| | |
|---|---|
| **Endpoint** | `GET /emotions` |
| **Purpose** | Returns the 12 fixed core emotions with display metadata. Wrapped by `emotionService.getEmotions()`, though most screens currently read the bundled `src/data/emotions.js` constant directly rather than calling this — the service exists specifically so that swap is a one-line change later. |
| **Auth** | Bearer Token (or Public — this is non-personal reference data; either is defensible) |

**Success Response — `200 OK`**
```json
{
  "success": true,
  "data": [
    {
      "id": "joy",
      "name": "Joy",
      "icon": "happy-outline",
      "description": "Joy is the feeling of happiness, lightness, and fulfillment...",
      "sortOrder": 1
    }
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `id` | string enum | Stable slug, one of the 12 emotion ids |
| `name` | string | Display name |
| `icon` | string | Ionicons glyph name (frontend-specific, but harmless to keep server-driven for consistency across Aligna apps) |
| `description` | string | "Why it matters" copy shown throughout the app |
| `sortOrder` | int | Determines assessment step order and daily grouping (see §6 daily rotation) |

**Error Responses**: `500` only — this is static reference data, no auth/validation failure modes.

**Database Objects**: `EmotionDefinition` (effectively a seed/lookup table, not user-specific)

**Frontend Usage**: `emotionService.getEmotions()` (defined, not yet wired into a screen — screens currently import `EMOTIONS` from `src/data/emotions.js` directly).

**Caching**: Aggressively cacheable (long TTL / CDN) — this data changes essentially never.

**Notes**: Because this never varies per user, consider serving it as a static JSON asset or with long `Cache-Control` headers rather than a DB round trip.

---

### 4.2 Get Emotion Detail

| | |
|---|---|
| **Endpoint** | `GET /emotions/{emotionId}` |
| **Purpose** | Returns one emotion's metadata **plus the current user's score, score band, and personalized guidance for that band**. This is a per-user, not purely static, endpoint. |
| **Auth** | Bearer Token |

**Path Parameters**

| Param | Type | Description |
|---|---|---|
| `emotionId` | string enum | One of the 12 emotion ids |

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

**Database Objects**: `EmotionDefinition`, `EmotionGuidance` (or bundled — see Notes), `EmotionScore` (latest value per user+emotion)

**Frontend Usage**: `src/screens/Dashboard/EmotionDetailScreen.js`, used in two modes distinguished by `route.params.mode`:
- `'baseline'` — stepping through all 12 right after the Emotional Compass Check-in, "Continue" chains to the next emotion in order.
- `'dashboard'` — single ad hoc lookup from Home/Chart tap, no chaining.

**Caching**: `description`/`guidance` text is static and cacheable long-term; `score`/`band` must always be fresh per user.

**Notes**: `guidance` text (`src/data/emotionGuidance.js`) and baseline/daily question text (`src/data/questions.js`) are currently **bundled client-side static content**, not backend-served. This endpoint's shape already accounts for guidance coming from the server for a single source of truth and easier localization (roadmap §12), but if that's overkill for launch, guidance can stay bundled and this endpoint can omit `guidance`/serve it from the same static file the client already has.

---

## 5. Assessment (Baseline / Emotional Compass Check-in)

### 5.1 Submit Baseline Assessment

| | |
|---|---|
| **Endpoint** | `POST /assessment/baseline` |
| **Purpose** | Submits all 12 emotion scores collected during the one-time Emotional Compass Check-in (roadmap §5), establishing the user's baseline chart. |
| **Auth** | Bearer Token |

**Request Payload**
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
| `409` | Baseline already completed for this user *(optional — decide whether re-submission is allowed as a "redo baseline" feature; current frontend has no redo flow, so treat a second submit as a hard conflict unless product wants otherwise)* | `{ "success": false, "message": "Baseline already completed", "code": "ALREADY_COMPLETED" }` |
| `422` | Missing emotion(s) or out-of-range score | `{ "success": false, "message": "Validation failed", "code": "VALIDATION_ERROR", "errors": [{ "field": "scores.clarity", "message": "Score must be between 1 and 10" }] }` |
| `500` | Server error | — |

**Validation Rules**
- Exactly the 12 known emotion ids, no more, no fewer.
- Each score: integer, 1 ≤ score ≤ 10.

**Database Objects**: `User` (flips `hasCompletedBaseline`), `CheckInEntry` (type=`baseline`), `EmotionScore` (×12)

**Frontend Usage**: `src/screens/Assessment/EmotionRatingScreen.js` — accumulates all 12 answers client-side across the wizard (`AssessmentContext`) and fires this **once**, only on the 12th (last) emotion's "Finish Check-In" tap. On success, `AssessmentCompleteScreen` calls `AuthContext.completeBaseline()`, which is what flips `RootNavigator` from the assessment flow into the main tabs.

**Caching**: N/A (write). **Pagination/Search**: N/A.

**Notes**: The reflective *question* text asked during this flow (`ConversationScreen.js`) is driven by a third-party **ElevenLabs Conversational AI voice agent**, not this backend — the agent asks the question aloud and has a short spoken exchange; only the final 1–10 rating (entered by hand on the next screen) is what reaches this API. No transcript/audio is sent to the Aligna backend today.

---

## 6. Dashboard

### 6.1 Get Dashboard

| | |
|---|---|
| **Endpoint** | `GET /dashboard` |
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
| `currentDay` | int, 1-indexed | Which daily check-in "day" the user is on — drives §7.1's rotation |

**Error Responses**: `401`, `500`.

**Database Objects**: `User`, `EmotionScore` (latest per emotion), `CheckInEntry` (for `currentDay` derivation)

**Frontend Usage**: `HomeScreen.js`, `ChartScreen.js`, `BaselineCompletionScreen.js` (all three call `getDashboard()` independently — no shared cache).

**Caching**: Short TTL (seconds) is reasonable — this changes at most once per day (after a check-in submit), but three separate screens fetch it independently today with no client-side cache, so keep the server response fast.

**Notes**: If no baseline exists yet (`hasCompletedBaseline: false`), `chart[].score` should be `0` for every emotion (matches current mock behavior via `?? 0`), not an error.

---

## 7. Daily Check-in

### 7.1 Get Today's Check-in

| | |
|---|---|
| **Endpoint** | `GET /checkin/today` |
| **Purpose** | Returns the current day's 4-emotion rotation with that rotation's reflective question. Momentum checks in on 4 of the 12 emotions per day, in a repeating 3-day cycle (roadmap §9–10), so the question set changes each time a group comes back around. |
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

| Field | Type | Description |
|---|---|---|
| `dayNumber` | int | The user's current day counter (matches `dashboard.currentDay`) |
| `prompts` | array (exactly 4) | This day's emotion group with the correct rotation-index question |

**Error Responses**: `401`, `500`.

**Database Objects**: `User` (for `currentDay`), `EmotionDefinition`, `DailyQuestionBank` (if server-driven — see Notes)

**Frontend Usage**: `src/screens/CheckIn/DailyCheckInScreen.js`, on mount and on pull-to-retry.

**Caching**: Cacheable for the remainder of the calendar day per user.

**Notes**: Question text is currently bundled client-side (`src/data/questions.js`, 3 rotating variants per emotion). This endpoint can either keep serving from that same static table server-side, or the client can keep computing it locally and this endpoint can be skipped entirely — current frontend already has a service function for it, so it's documented as a real endpoint, but it's a low-risk one to defer if the static file is judged sufficient long-term.

---

### 7.2 Submit Daily Check-in

| | |
|---|---|
| **Endpoint** | `POST /checkin` |
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
| `scores` | object | Yes | must contain exactly the 4 emotion ids for **today's** group (per §7.1), each 1–10 | |

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

| Field | Description |
|---|---|
| `nextDay` | The incremented day counter, stored server-side for the next `GET /checkin/today` call |

**Error Responses**

| Status | Meaning | Example |
|---|---|---|
| `401` | No/expired token | — |
| `409` | Already checked in for today *(recommended — current mock has no such guard since `currentDay` just increments unconditionally on every call, but a real backend should prevent double-submission for the same calendar day)* | `{ "success": false, "message": "You've already checked in today", "code": "ALREADY_CHECKED_IN" }` |
| `422` | Wrong emotion set for today, or out-of-range score | `{ "success": false, "message": "Validation failed", "code": "VALIDATION_ERROR", "errors": [{ "field": "scores", "message": "Expected scores for joy, gratitude, inspiration, focus" }] }` |
| `500` | Server error | — |

**Database Objects**: `User` (`currentDay` increment), `CheckInEntry` (type=`daily`, `dayNumber`), `EmotionScore` (×4)

**Frontend Usage**: `DailyCheckInScreen.js`, fired once after the 4th prompt's "Finish Check-In".

**Notes**: The current mock (`checkInService.js`) increments `currentDay` unconditionally with no "already checked in today" guard and no real date-based gating — a production backend should key this off calendar date (in the user's timezone) rather than trusting the client to only call it once per day.

---

## 8. History

### 8.1 Get History

| | |
|---|---|
| **Endpoint** | `GET /history` |
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

**Database Objects**: `CheckInEntry`, `EmotionScore`

**Frontend Usage**: `src/screens/History/HistoryScreen.js` — computes each entry's average and score band **client-side** from the raw `scores` map; the backend does not need to pre-compute an average for this endpoint.

**Caching**: Refetched on every screen mount, no client cache.

**Pagination**: **Not implemented by the current frontend** — it renders the full array with no page/limit params and no infinite scroll. This is fine at low volume but will not scale as a user accumulates months of daily entries. Recommended (not required) addition:
```
GET /history?page=1&limit=20
```
```json
{ "data": [ ], "pagination": { "page": 1, "limit": 20, "total": 187, "totalPages": 10 } }
```

**Search & Filters**: Not implemented by the current frontend. A `type=daily|baseline` or date-range filter would be a reasonable future addition but is not required today.

---

## 9. Onboarding — No Backend API

`OnboardingScreen` and `IntroductionScreen` are entirely local: "has onboarded" is a boolean flag in `AsyncStorage` (`momentum_has_onboarded`), never sent to the backend (`src/context/AuthContext.js`). There is no `/onboarding` endpoint to build. If Momentum's shared Aligna profile (roadmap §13) should eventually know whether a user has completed onboarding, the simplest path is adding an `hasOnboarded` boolean to the `User` record and the `GET /profile` / login response, rather than a dedicated endpoint — flagged here as an option, not a requirement.

---

## 10. Future / Recommended Additions (Not Required by Current Frontend)

These are not backed by any current frontend call site — do not build them speculatively, but they're worth the backend team knowing about since they're near-certain next steps:

- **`POST /auth/forgot-password`, `POST /auth/verify-otp`, `POST /auth/reset-password`** — `LoginScreen` has a "Forgot password?" link today, but it only shows a toast ("Password reset isn't available in this preview yet") and calls nothing.
- **Refresh tokens** — the current auth model is a single long-lived bearer token with no rotation/refresh; `axios.js` treats any `401` as "log the user out." Production should likely add refresh-token support before launch.
- **Shared Aligna profile sync** (roadmap §13) — cross-app data sharing with Lotus/TargetPro isn't reflected in this frontend at all today; it's a backend/platform concern layered on top of the `User`/`EmotionScore` tables below, not a Momentum-specific endpoint.
