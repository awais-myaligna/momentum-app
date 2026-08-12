# Momentum — API Specification

**Audience:** backend developer implementing the Aligna/Momentum backend.
**Status legend:** ✅ **Live** (already built and integrated — documented here for completeness/reference, do not change the contract without coordinating with the frontend) · 🔧 **To Be Built** (frontend currently runs on an in-memory mock; this is the real contract to implement) · ⭐ **Recommended New** (not called by the frontend today; added here because a production app needs it).

This document was produced by scanning the entire React Native/Expo frontend — every screen, context, service, mock, and existing Axios integration — as of the current codebase. Where a mocked endpoint's existing shape was missing data the frontend (or an obvious near-term need) requires, the spec below has been extended accordingly; those additions are called out explicitly in each endpoint's **Notes**.

Once the backend is built, replace the mock `services/*.js` implementations with real `api.*()` calls per endpoint, without changing screen/UI code — this is the intended migration path and this document is the contract for it.

---

## Table of Contents

1. [Conventions](#1-conventions)
2. [Authentication](#2-authentication)
3. [Profile & Settings](#3-profile--settings)
4. [Emotions (Reference Data)](#4-emotions-reference-data)
5. [Assessment (Baseline Emotional Compass Check-In)](#5-assessment-baseline-emotional-compass-check-in)
6. [Dashboard & Charts](#6-dashboard--charts)
7. [Daily Check-In](#7-daily-check-in)
8. [History](#8-history)
9. [Onboarding — No Backend API](#9-onboarding--no-backend-api)
10. [Cross-Cutting Decisions Backend Must Know About](#10-cross-cutting-decisions-backend-must-know-about)

---

## 1. Conventions

### Base URL
```
https://devapi.myaligna.com/api
```

### Path prefix
The one real, live, namespaced endpoint (`GET /momentum/emotions`) uses a `/momentum/*` prefix; Auth and Identity Profile ship flat (`/login`, `/user/profile`, no prefix) and are **already live — do not rename them**. Every endpoint in this document that is still 🔧 To Be Built or ⭐ Recommended is specified under `/momentum/*` to resolve the "which prefix?" ambiguity left open in earlier drafts of this contract. This is a firm decision, not a suggestion — build new endpoints at the paths given below.

### Authentication
Two modes:
- **Public** — no token required: Login, Register, Send OTP, Verify OTP, Reset Password.
- **Bearer Token** — `Authorization: Bearer <token>` required for everything else.

### Standard Request Headers
```
Content-Type: application/json
Accept: application/json
Authorization: Bearer <token>   // omitted for public endpoints
x-api-key: 12345678
```
`x-api-key` is sent on every request today as a hardcoded literal in client source (`src/api/axios.js`). Flag with the backend/security team before launch — it isn't documented anywhere as a real requirement, it's just what the client happens to send; it should move to a proper secret/env mechanism, and the backend should decide whether it actually gates anything.

### Standard Response Envelope
Two shapes exist across this spec, deliberately:
- **Flat** (Login, Register, Get/Update Profile) — `user`/`token`/`message` sit directly at the top level, no `data` wrapper. These are **already live** with this shape; do not change them retroactively.
- **Wrapped** — `{ success, message, data }`. This is the shape for every endpoint that is 🔧 To Be Built or ⭐ Recommended in this document. Use it consistently for all new work so the inconsistency doesn't spread further.

The frontend's Axios response interceptor (`src/api/axios.js`) only unwraps the HTTP body (`response.data`) — it does not normalize between these two shapes, so each service function reads the shape appropriate to its endpoint.

### Standard Error Envelope
```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "VALIDATION_ERROR",
  "errors": [{ "field": "email", "message": "Enter a valid email address" }]
}
```
`errors` is present only for `422` field-level validation failures; omit it otherwise. The frontend's error-mapping interceptor exists but is currently **disabled** (commented out in `src/api/axios.js`) — re-enabling it is a frontend follow-up, not something the backend needs to wait on, but the backend should still return this exact shape so that re-enabling is a no-op on the frontend side. The intended status-code → frontend-behavior mapping, once re-enabled:

| Status | Frontend behavior |
|---|---|
| No response / network down | "You appear to be offline…" toast |
| Timeout (client-side, 15s) | "That took longer than expected…" toast |
| `401` | "Your session has expired…" toast, forces re-login |
| `>= 500` | "Something went wrong on our end…" toast |
| Anything else | Uses `data.message` if present, else generic fallback |

### Score scale
All emotion scores are **integers 1–10 inclusive**. No `0`, no decimals, anywhere in this spec.

### The 12 core emotions
```
joy, gratitude, inspiration, focus, determination, compassion,
clarity, confidence, enthusiasm, resilience, hope, contentment
```
See [§10](#10-cross-cutting-decisions-backend-must-know-about) for the resolved `slug` vs numeric-`id` decision — **every endpoint in this document that references an emotion uses the string `slug`** (e.g. `"joy"`), not a numeric database id, in request/response bodies and path params.

---

## 2. Authentication

### 2.1 Login — ✅ Live

| | |
|---|---|
| **API Name** | Login |
| **Method** | `POST` |
| **Endpoint** | `/login` |
| **Description** | Authenticates an existing user and returns a bearer token. |
| **Auth** | Public |
| **Headers** | `Content-Type: application/json`, `Accept: application/json`, `x-api-key` |

**Request Payload**
```json
{
  "email": "alex.rivera@example.com",
  "password": "correct-horse-battery-staple"
}
```

| Field | Type | Required | Description | Validation |
|---|---|---|---|---|
| `email` | string | Yes | Account email | Valid email format |
| `password` | string | Yes | Account password | Non-empty |

**Success Response — `200 OK`** (flat, no `data` wrapper)
```json
{
  "message": "Login successful",
  "user": {
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
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

| Field | Type | Description |
|---|---|---|
| `user.id` | string | Stable user id |
| `user.avatar_url` | string \| null | ⭐ Recommended addition (see [§3](#3-profile--settings)) — nullable, absent today. `HomeScreen`/`ProfileScreen` already render an `Avatar` that shows this image when present and falls back to initials when `null`. |
| `user.notifications_enabled` | boolean | ⭐ Recommended addition — folded in from the mocked Preferences concept, see [§3](#3-profile--settings) |
| `user.voice_gender` | enum `"Female"` \| `"Male"` | ⭐ Recommended addition — same |
| `user.hasCompletedBaseline` | boolean | Drives whether `RootNavigator` routes into the Assessment flow or straight to Main tabs |
| `token` | string | Bearer token, stored in `expo-secure-store` |

**Error Responses**

`401`
```json
{ "success": false, "message": "Invalid email or password.", "code": "INVALID_CREDENTIALS" }
```
`422`
```json
{ "success": false, "message": "Validation failed", "code": "VALIDATION_ERROR", "errors": [{ "field": "email", "message": "Enter a valid email address" }] }
```
`500`
```json
{ "success": false, "message": "Something went wrong on our end. Please try again shortly.", "code": "SERVER_ERROR" }
```
`400`, `403`, `404`, `409` — not applicable to this endpoint.

**Backend Logic**
- Verify credentials, issue a bearer token (see [§10](#10-cross-cutting-decisions-backend-must-know-about) for the recommended token-expiry/refresh model).
- Compute `hasCompletedBaseline` from whether the user has a baseline assessment record.

**Frontend Usage**: `LoginScreen.js` → `AuthContext.login()` → `authService.login()`. Called on Sign In tap. Consumes `user` (stored via `expo-secure-store`, drives `HomeScreen`/`ProfileScreen` display) and `hasCompletedBaseline` (drives `RootNavigator` routing).

---

### 2.2 Register — ✅ Live

| | |
|---|---|
| **API Name** | Register |
| **Method** | `POST` |
| **Endpoint** | `/register` |
| **Description** | Creates a new account and returns a bearer token (auto-login on signup). |
| **Auth** | Public |
| **Headers** | `Content-Type: application/json`, `Accept: application/json`, `x-api-key` |

**Request Payload**
```json
{
  "first_name": "Alex",
  "last_name": "Rivera",
  "nickname": "Alex",
  "dob": "1994-03-12",
  "gender": "female",
  "default_language": "English",
  "default_agent": "peggy",
  "email": "alex.rivera@example.com",
  "phone": "+1 555 010 2020",
  "password": "correct-horse-battery-staple",
  "password_confirmation": "correct-horse-battery-staple"
}
```

| Field | Type | Required | Description | Validation |
|---|---|---|---|---|
| `first_name` | string | Yes | | Non-empty |
| `last_name` | string | Yes | | Non-empty |
| `nickname` | string \| null | Optional | Display name preference | — |
| `dob` | string (`YYYY-MM-DD`) | Yes | Date of birth | Valid past date |
| `gender` | enum `"male"` \| `"female"` \| `"other"` | Yes | | One of the enum values |
| `default_language` | string | Optional | One of `English`, `Arabic`, `Spanish`, `French`, `Hindi`, `Chinese` (see [§10](#10-cross-cutting-decisions-backend-must-know-about) for a naming mismatch to resolve) | |
| `default_agent` | enum `"peggy"` \| `"lotus"` \| `"denis"` | Optional | Which Aligna-suite AI persona/agent the user defaults to | |
| `email` | string | Yes | | Valid email, unique |
| `phone` | string \| null | Optional | | — |
| `password` | string | Yes | | Min 8 characters |
| `password_confirmation` | string | Yes | | Must equal `password` |

**Success Response — `200 OK`** (flat) — same `user`/`token`/`message` shape as [§2.1](#21-login--%E2%9C%85-live), with `hasCompletedBaseline: false` for a brand-new account and `avatar_url: null`.

**Error Responses**

`409`
```json
{ "success": false, "message": "An account with this email already exists.", "code": "EMAIL_TAKEN" }
```
`422`
```json
{ "success": false, "message": "Validation failed", "code": "VALIDATION_ERROR", "errors": [{ "field": "password", "message": "Password must be at least 8 characters" }] }
```
`500` — same shape as [§2.1](#21-login--%E2%9C%85-live). `400`, `401`, `403`, `404` — not applicable.

**Backend Logic**
- Create the user record, hash the password, issue a bearer token.
- `hasCompletedBaseline` is always `false` on a freshly created account.

**Frontend Usage**: `RegisterScreen.js` → `AuthContext.register()` → `authService.register()`. Called on Create Account tap.

---

### 2.3 Send OTP (Forgot Password) — ✅ Live

| | |
|---|---|
| **API Name** | Send OTP |
| **Method** | `POST` |
| **Endpoint** | `/send-otp` |
| **Description** | Sends a password-reset OTP to the given email. Also reused for OTP resend. |
| **Auth** | Public |

**Request Payload**
```json
{ "email": "alex.rivera@example.com" }
```
| Field | Type | Required | Description | Validation |
|---|---|---|---|---|
| `email` | string | Yes | | Valid email format; should not reveal whether the account exists (see Notes) |

**Success Response — `200 OK`** (flat)
```json
{ "message": "A 6-digit code has been sent to your email." }
```

**Error Responses**

`422`
```json
{ "success": false, "message": "Validation failed", "code": "VALIDATION_ERROR", "errors": [{ "field": "email", "message": "Enter a valid email address" }] }
```
`429`
```json
{ "success": false, "message": "Too many requests. Please wait before requesting another code.", "code": "RATE_LIMITED" }
```
`500` — standard shape. `400`, `401`, `403`, `404`, `409` — not applicable.

**Backend Logic**
- Generate a 6-digit OTP, store it with a short expiry (recommend 10 minutes), email it.
- **Always return `200`, even for an unknown email** — do not leak account existence via a `404`. This is a security requirement, not an oversight; make sure it's implemented this way even though it isn't explicitly visible in the current mock.
- Rate-limit repeated sends per email (the frontend's Resend button has no client-side cooldown today — enforce it server-side).

**Frontend Usage**: `ForgotPasswordScreen.js` (initial send) and `VerifyOtpScreen.js` (Resend link) → `authService.sendOtp()`.

---

### 2.4 Verify OTP — ✅ Live

| | |
|---|---|
| **API Name** | Verify OTP |
| **Method** | `POST` |
| **Endpoint** | `/verify-otp` |
| **Description** | Verifies the 6-digit code and returns a short-lived reset token used to authorize the actual password reset. |
| **Auth** | Public |

**Request Payload**
```json
{ "email": "alex.rivera@example.com", "otp": "482913" }
```
| Field | Type | Required | Description | Validation |
|---|---|---|---|---|
| `email` | string | Yes | | Valid email |
| `otp` | string | Yes | 6-digit code | Exactly 6 digits |

**Success Response — `200 OK`** (flat)
```json
{ "message": "Code verified.", "reset_token": "rst_9c22f8b1e4..." }
```
`reset_token` is **required** in the response — the client throws if it's missing.

**Error Responses**

`401`
```json
{ "success": false, "message": "That code is incorrect or has expired.", "code": "INVALID_OTP" }
```
`422`
```json
{ "success": false, "message": "Validation failed", "code": "VALIDATION_ERROR", "errors": [{ "field": "otp", "message": "Enter the 6-digit code" }] }
```
`500` — standard shape. `400`, `403`, `404`, `409` — not applicable.

**Backend Logic**
- Validate the OTP against the stored value and expiry window; invalidate it after one successful use (single-use).
- Issue a short-lived `reset_token` (recommend 10–15 minutes) scoped only to authorizing the next Reset Password call — not a full session token.

**Frontend Usage**: `VerifyOtpScreen.js` → `authService.verifyOtp()`. On success, navigates to Reset Password carrying `email` + `resetToken`.

---

### 2.5 Reset Password — ✅ Live

| | |
|---|---|
| **API Name** | Reset Password |
| **Method** | `POST` |
| **Endpoint** | `/reset-password` |
| **Description** | Finalizes the password reset using the token from Verify OTP. |
| **Auth** | Public (authorized via `token`, not a bearer session) |

**Request Payload**
```json
{
  "email": "alex.rivera@example.com",
  "token": "rst_9c22f8b1e4...",
  "password": "new-correct-horse-battery",
  "password_confirmation": "new-correct-horse-battery"
}
```
| Field | Type | Required | Description | Validation |
|---|---|---|---|---|
| `email` | string | Yes | | Valid email |
| `token` | string | Yes | The `reset_token` from [§2.4](#24-verify-otp--%E2%9C%85-live) | Must match an unexpired, unused token for this email |
| `password` | string | Yes | New password | Min 8 characters |
| `password_confirmation` | string | Yes | | Must equal `password` |

**Success Response — `200 OK`** (flat)
```json
{ "message": "Your password has been reset. Please sign in." }
```

**Error Responses**

`401`
```json
{ "success": false, "message": "This reset link has expired. Please request a new code.", "code": "INVALID_RESET_TOKEN" }
```
`422`
```json
{ "success": false, "message": "Validation failed", "code": "VALIDATION_ERROR", "errors": [{ "field": "password", "message": "Password must be at least 8 characters" }] }
```
`500` — standard shape. `400`, `403`, `404`, `409` — not applicable.

**Backend Logic**
- Validate `token`, hash and persist the new password, invalidate the token (single-use).
- Recommend invalidating all existing bearer sessions for that user on password reset, as a security best practice.

**Frontend Usage**: `ResetPasswordScreen.js` → `authService.resetPassword()`. On success, resets navigation back to Login.

---

### 2.6 Logout — 🔧 To Be Built (call exists, currently disabled client-side)

| | |
|---|---|
| **API Name** | Logout |
| **Method** | `POST` |
| **Endpoint** | `/logout` |
| **Description** | Invalidates the current session server-side. |
| **Auth** | Bearer Token |

**Request Payload**: none (empty body).

**Success Response — `200 OK`**
```json
{ "success": true, "message": "Logged out successfully" }
```

**Error Responses**

`401`
```json
{ "success": false, "message": "Your session has already expired.", "code": "UNAUTHORIZED" }
```
`500` — standard shape. `400`, `403`, `404`, `409`, `422` — not applicable.

**Backend Logic**
- Invalidate the bearer token server-side (revoke/blacklist it, or delete the session row, depending on your token model).
- **Must be idempotent** — calling it twice (e.g. a retried request) must not error.

**Notes**: `authService.logout()` has this call written but currently commented out — the client only clears its local token/user today, no server-side invalidation happens. Once this endpoint exists, uncomment the call; it's a one-line frontend change. The client will continue to clear local state regardless of this call's outcome (best-effort from the client's perspective), but the server must still actually invalidate the token.

**Frontend Usage**: `ProfileScreen.js` → confirmation dialog → `AuthContext.logout()` → `authService.logout()`.

---

### 2.7 Refresh Token — ⭐ Recommended New

| | |
|---|---|
| **API Name** | Refresh Token |
| **Method** | `POST` |
| **Endpoint** | `/refresh-token` |
| **Description** | Exchanges a refresh token for a new bearer token, without requiring the user to log in again. |
| **Auth** | Public (authorized via `refresh_token`, not the expiring bearer token) |

**Request Payload**
```json
{ "refresh_token": "rft_3a91c8..." }
```

**Success Response — `200 OK`** (flat, matching the Login/Register token shape)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "rft_new_value...",
  "expires_in": 3600
}
```

**Error Responses**

`401`
```json
{ "success": false, "message": "Your session has expired. Please sign in again.", "code": "INVALID_REFRESH_TOKEN" }
```
`500` — standard shape. `400`, `403`, `404`, `409`, `422` — not applicable.

**Backend Logic**
- Issue both a short-lived bearer token (recommend ~1 hour) and a longer-lived rotating refresh token at Login/Register time (add `refresh_token` to both those responses if you adopt this).
- Rotate the refresh token on every use (issue a new one, invalidate the old) to limit replay risk.

**Notes**: **Not called by the frontend today** — there is currently a single long-lived bearer token with no rotation, and `src/api/axios.js` has no `401` handling wired up at all. Included here because a production app needs this before launch; implementing it is backend-only until the frontend's Axios interceptor is updated to call it on a `401`, which is a tracked frontend follow-up, not blocking backend work.

---

## 3. Profile & Settings

**Design decision**: the frontend today has *two* separate profile concepts — the real, live `/user/profile` (identity: name, email, dob, gender, `default_language`, `default_agent`) and a second, fully mocked "Preferences" concept (`notificationsEnabled`, `language`, `voice`) that `NotificationScreen`, `LanguageScreen`, and `VoicePreferencesScreen` all read/write via the same mocked `getProfile()`/`updateProfile()` calls. Per this document's "avoid duplicate APIs, reuse endpoints wherever possible" mandate, **these are consolidated into one endpoint below** — `GET`/`PUT /user/profile` — rather than building a second `/momentum/preferences` endpoint. Two fields (`notifications_enabled`, `voice_gender`) are added to the identity profile to carry what the mock's `notificationsEnabled`/`voice` fields covered; `language` already existed as `default_language`, so Language screen now reads/writes that field directly.

### 3.1 Get Profile — ✅ Live (field additions below are 🔧 new)

| | |
|---|---|
| **API Name** | Get Profile |
| **Method** | `GET` |
| **Endpoint** | `/user/profile` |
| **Description** | Returns the current user's full identity + preferences profile. |
| **Auth** | Bearer Token |

**Request Payload**: none.

**Success Response — `200 OK`** (flat)
```json
{
  "message": "Profile fetched successfully",
  "user": {
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
}
```

| Field | Type | Description |
|---|---|---|
| `avatar_url` | string \| null | 🔧 New. `HomeScreen`/`ProfileScreen` already have `Avatar` components ready to render this (falls back to initials when `null`); no field currently carries it. No avatar-upload UI exists in Momentum today, so this only needs to be settable from elsewhere in the Aligna suite for now — just needs to round-trip correctly here. |
| `notifications_enabled` | boolean | 🔧 New, replaces the mocked `profile.notificationsEnabled`. Drives `NotificationScreen`'s toggle and `SettingsScreen`'s subtitle. |
| `voice_gender` | enum `"Female"` \| `"Male"` | 🔧 New, replaces the mocked `profile.voice`. Drives `VoicePreferencesScreen`. Distinct from `default_agent` (which is the persona/agent name — `peggy`/`lotus`/`denis` — not a voice gender). |

**Error Responses**

`401`
```json
{ "success": false, "message": "Your session has expired. Please sign in again.", "code": "UNAUTHORIZED" }
```
`500` — standard shape. `400`, `403`, `404`, `409`, `422` — not applicable.

**Frontend Usage**: `EditProfileScreen.js` (full identity form), `SettingsScreen.js`, `NotificationScreen.js`, `LanguageScreen.js`, `VoicePreferencesScreen.js` — all reload on mount/focus, no shared cache today (each screen independently calls this).

---

### 3.2 Update Profile — ✅ Live (field additions below are 🔧 new)

| | |
|---|---|
| **API Name** | Update Profile |
| **Method** | `PUT` |
| **Endpoint** | `/user/profile` |
| **Description** | Partial update of any subset of profile fields. The client always sends only the diffed subset it actually changed. |
| **Auth** | Bearer Token |

**Request Payload** — any subset of the fields in [§3.1](#31-get-profile--%E2%9C%85-live-field-additions-below-are--new)'s `user` object is valid, e.g.:
```json
{ "first_name": "Alexandra" }
```
```json
{ "notifications_enabled": false }
```
```json
{ "default_language": "Spanish" }
```
```json
{ "voice_gender": "Male" }
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `first_name`, `last_name`, `nickname` | string | Optional | Non-empty if provided |
| `email` | string | Optional | Valid email, unique |
| `phone` | string | Optional | — |
| `dob` | string (`YYYY-MM-DD`) | Optional | Valid past date |
| `gender` | enum `"male"` \| `"female"` \| `"other"` | Optional | One of the enum values |
| `default_language` | string | Optional | See [§10](#10-cross-cutting-decisions-backend-must-know-about) — recommend unifying the option list |
| `default_agent` | enum `"peggy"` \| `"lotus"` \| `"denis"` | Optional | One of the enum values |
| `notifications_enabled` | boolean | Optional | — |
| `voice_gender` | enum `"Female"` \| `"Male"` | Optional | One of the enum values |

**Success Response — `200 OK`** (flat) — must include `user`, full updated profile, same shape as [§3.1](#31-get-profile--%E2%9C%85-live-field-additions-below-are--new). The client throws if `user` is missing.
```json
{ "message": "Profile updated", "user": { "...": "full updated profile object" } }
```

**Error Responses**

`401` — standard shape (see [§3.1](#31-get-profile--%E2%9C%85-live-field-additions-below-are--new)).
`409`
```json
{ "success": false, "message": "This email is already in use.", "code": "EMAIL_TAKEN" }
```
`422`
```json
{ "success": false, "message": "Validation failed", "code": "VALIDATION_ERROR", "errors": [{ "field": "gender", "message": "Must be one of male, female, other" }] }
```
`500` — standard shape. `400`, `403`, `404` — not applicable.

**Backend Logic**
- Apply only the fields present in the request body; unspecified fields are left untouched.
- `NotificationScreen`/`LanguageScreen`/`VoicePreferencesScreen` all use an optimistic-update-then-rollback-on-error pattern client-side, so a `4xx` here must **not** partially apply the update server-side, and the response should stay fast (recommend < 300ms) since the UI already shows the new value before the request resolves.

**Frontend Usage**: `EditProfileScreen.js` (multi-field diff), `NotificationScreen.js`/`LanguageScreen.js`/`VoicePreferencesScreen.js` (always exactly one field at a time). On success, `EditProfileScreen` also calls `AuthContext.updateUser()` to keep the locally cached name/email in sync without a re-login.

---

## 4. Emotions (Reference Data)

### 4.1 Get Emotions List — ✅ Live (field addition below is 🔧 new)

| | |
|---|---|
| **API Name** | Get Emotions List |
| **Method** | `GET` |
| **Endpoint** | `/momentum/emotions` |
| **Description** | Returns the 12 core emotions with display metadata, sorted by `sortOrder`. Static reference data — does not vary per user. |
| **Auth** | Bearer Token |

**Success Response — `200 OK`** (wrapped — `data` is the array)
```json
{
  "success": true,
  "message": "Emotions fetched successfully",
  "data": [
    {
      "id": 1,
      "slug": "joy",
      "name": "Joy",
      "icon": "happy-outline",
      "description": "Joy is the feeling of happiness, lightness, and fulfillment that comes from positive moments, meaningful progress, or simple experiences in daily life.",
      "sortOrder": 1
    },
    {
      "id": 2,
      "slug": "gratitude",
      "name": "Gratitude",
      "icon": "heart-outline",
      "description": "Gratitude is the recognition and appreciation of the good in life, whether it comes from people, experiences, opportunities, or small moments of beauty.",
      "sortOrder": 2
    }
    /* ...repeated for all 12: inspiration, focus, determination, compassion,
       clarity, confidence, enthusiasm, resilience, hope, contentment,
       in this fixed order — order drives assessment step sequence and
       daily-rotation grouping, do not change it without coordinating with
       the frontend's bundled src/data/emotions.js and
       src/data/dailyCheckInSchedule.js */
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `id` | integer | Database primary key. Internal use only — **no other endpoint in this spec uses this value**; see [§10](#10-cross-cutting-decisions-backend-must-know-about). |
| `slug` | string | 🔧 New. Stable, human-readable identifier (`"joy"`, `"gratitude"`, …). **This is the value every other endpoint in this spec uses** wherever an `emotionId` field appears. |
| `name` | string | Display name (`"Joy"`) |
| `icon` | string | Ionicons glyph name, used as-is by the client |
| `description` | string | Static explainer text |
| `sortOrder` | integer | 1–12, fixed order |

**Error Responses**: `401`, `500` — standard shapes. `400`, `403`, `404`, `409`, `422` — not applicable (no request body/params).

**Frontend Usage**: `emotionService.getEmotions()` — integrated but **no screen calls it yet**; screens currently read the bundled `src/data/emotions.js` constant directly. Once `slug` is added, this becomes the source of truth and the bundled constant can be retired.

---

### 4.2 Get Emotion Detail — 🔧 To Be Built

| | |
|---|---|
| **API Name** | Get Emotion Detail |
| **Method** | `GET` |
| **Endpoint** | `/momentum/emotions/{slug}` |
| **Description** | Returns one emotion's metadata plus the **current user's** latest score, score band, and personalized guidance for that band. Per-user, not static — do not cache across users. |
| **Auth** | Bearer Token |

**Path Parameters**

| Param | Type | Description |
|---|---|---|
| `slug` | string | One of the 12 emotion slugs, e.g. `confidence` |

**Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "Emotion detail fetched successfully",
  "data": {
    "slug": "confidence",
    "name": "Confidence",
    "icon": "shield-checkmark-outline",
    "description": "Confidence is the belief in one's abilities, worth, and capacity to take action. It empowers users to speak up, make decisions, and pursue goals with self-assurance.",
    "score": 4,
    "band": "danger",
    "bandLabel": "Needs attention",
    "guidance": "Confidence may feel shaky right now. Recall a recent moment, even small, where you handled something well.",
    "previousScore": 5,
    "lastUpdated": "2026-08-01T09:12:00.000Z"
  }
}
```

| Field | Type | Description |
|---|---|---|
| `score` | int 1–10 | User's latest recorded score for this emotion (most recent baseline or daily check-in) |
| `band` | enum `danger`\|`warning`\|`success` | `danger` ≤4, `warning` 5–7, `success` 8–10 — see [§10](#10-cross-cutting-decisions-backend-must-know-about) for the exact thresholds to replicate server-side |
| `bandLabel` | string | `Needs attention` / `Building` / `Thriving` |
| `guidance` | string | Band-specific encouragement text (36 combinations: 12 emotions × 3 bands) — see Notes |
| `previousScore` | int 1–10 \| null | 🔧 New. The score recorded *before* the current one, if any — feeds the ElevenLabs voice agent's `{{previousScore}}` dynamic variable (see `SYSTEM_PROMPT.md`), which the frontend does not yet fetch but is documented as the intended source. `null` if this is the user's first-ever score for this emotion. |
| `lastUpdated` | ISO 8601 string | 🔧 New. When `score` was last recorded — useful for the frontend to eventually show "as of…" copy. |

**Error Responses**

`401` — standard.
`404`
```json
{ "success": false, "message": "Unknown emotion: xyz", "code": "NOT_FOUND" }
```
Also returned if the user has no score yet for this emotion (baseline not completed).
`500` — standard shape. `400`, `403`, `409`, `422` — not applicable.

**Backend Logic**
- Look up the user's most recent recorded score for this emotion (from baseline or any daily check-in — see [§6](#6-dashboard--charts) for the "latest wins" rule) and compute `band`/`bandLabel` from it.
- Look up `previousScore` as the score immediately before the current one, in submission order (`null` if none).
- `guidance` text: currently bundled client-side (`src/data/emotionGuidance.js`, 12×3 static strings). This endpoint's shape already accounts for guidance coming from the server for a single source of truth and easier localization — recommend moving it server-side so it can localize with `default_language`, but if that's overkill for launch, `guidance` can be omitted from the response and the client will keep using its bundled copy.

**Frontend Usage**: `EmotionDetailScreen.js`, used in two modes via `route.params.mode`:
- `'baseline'` — stepping through all 12 right after the baseline check-in; Continue chains to the next emotion in the fixed order.
- `'dashboard'` — single ad hoc lookup from Home/Chart tap, no chaining.

---

## 5. Assessment (Baseline Emotional Compass Check-In)

The baseline flow is a 12-step wizard (`AssessmentContext.js`, `ConversationScreen.js`): for each of the 12 emotions, the user has a short voice/text conversation with an ElevenLabs Conversational AI agent (see `SYSTEM_PROMPT.md`, `ELEVENLABS_SETUP.md`, `TOOLS_AND_APIS.md` — out of scope for this document, which covers only the Momentum backend contract). When the user taps Continue, the app calls **5.1** with that emotion's transcript to get a score, accumulates all 12 scores client-side, then calls **5.2** once, on the 12th emotion.

### 5.1 Score Emotion From Conversation — 🔧 To Be Built

| | |
|---|---|
| **API Name** | Score Emotion From Conversation |
| **Method** | `POST` |
| **Endpoint** | `/momentum/assessment/emotion-score` |
| **Description** | Runs an AI judge over one emotion's check-in transcript and returns the 1–10 score for it. Called once per emotion, immediately after the user taps Continue — **not** once per full check-in. Stateless: does not persist anything by itself (see Backend Logic). |
| **Auth** | Bearer Token |

**Request Payload**
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

| Field | Type | Required | Description | Validation |
|---|---|---|---|---|
| `emotionId` | string enum | Yes | One of the 12 emotion slugs | Must be a known slug |
| `checkInType` | enum `"baseline"` \| `"daily"` | Yes | Lets the judge calibrate tone/depth expectations (a daily check-in exchange is much shorter than a baseline one) | |
| `transcript` | array | Yes | Full exchange for this emotion only, in order, both sides | At least one `source: "user"` entry |
| `transcript[].source` | enum `"user"` \| `"ai"` | Yes | Matches the ElevenLabs SDK's `onMessage` `source` field verbatim | |
| `transcript[].message` | string | Yes | The turn's text | Non-empty |

**Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "Score calculated",
  "data": {
    "emotionId": "confidence",
    "score": 7
  }
}
```

**Error Responses**

`401` — standard.
`422`
```json
{ "success": false, "message": "Validation failed", "code": "VALIDATION_ERROR", "errors": [{ "field": "transcript", "message": "At least one user turn is required" }] }
```
`500`
```json
{ "success": false, "message": "Something went wrong scoring that conversation. Please try again.", "code": "SCORING_FAILED" }
```
Returned if the judging model itself fails or times out — the frontend retries this exact call when the user taps Continue again, since the transcript is unchanged and still held client-side.
`400`, `403`, `404`, `409` — not applicable.

**Backend Logic (AI Processing)**
- Run `transcript` through an LLM judge to determine a 1–10 score for how strongly the target emotion (`emotionId`) is present, based on tone, word choice, and content of the `user`-sourced turns (the `ai` turns are context, not signal).
- Suggested rubric (moved here from an earlier revision of the ElevenLabs agent's own system prompt, where the same judgment used to happen live in-conversation before that design was replaced by this endpoint — see `SYSTEM_PROMPT.md`'s current revision and `TOOLS_AND_APIS.md` for that history):
  - **1–2 (very low)** — the emotion sounds largely absent, or the user uses explicitly negative/distressed language about this specific area.
  - **3–4 (low)** — mostly struggling or subdued, with only occasional or faint positive signal.
  - **5–6 (moderate)** — a mixed or middling picture: present but inconsistent, "okay," "so-so," some good and some not.
  - **7–8 (good/strong)** — clearly present and positively described, steady, several concrete positive signals.
  - **9–10 (very high)** — vivid, strongly positive language, described as consistently or exceptionally present.
  - If the user volunteers a number themselves in the transcript, treat it as one signal among several, not as ground truth.
  - A transcript with weak signal should still resolve to a best-effort estimate (favor 5–6) rather than erroring — §5.2/§7.2 require a score for every emotion to submit a check-in, so this endpoint must not leave one out.
- **Crisis/self-harm detection is intentionally not this endpoint's job.** That happens live, in-conversation, via the ElevenLabs agent's own `flag_needs_support` tool (see `TOOLS_AND_APIS.md` §2.1) so the safety response isn't delayed by a network round trip after the fact. This endpoint can assume it is never receiving a transcript that needs a crisis response — the app never calls it in that case.
- **No database write happens here.** The full set of scores is only persisted once, at [§5.2](#52-submit-baseline-assessment--to-be-built) (or [§7.2](#72-submit-daily-check-in--to-be-built) for daily). This endpoint is a pure judge — call it, get a number back, nothing is saved.

**Notes**: This replaced an earlier design where the ElevenLabs agent itself judged the exchange mid-conversation and called a `record_emotion_score` client tool. That proved unreliable to get calling consistently — a tool call buried inside a live voice session, with no visibility into whether or why it didn't fire, was much harder to debug than one ordinary REST call with a transcript that can be logged and replayed. **Currently mocked client-side** with a placeholder keyword-count scorer (`src/services/emotionService.js:estimateScoreFromTranscript`) since this endpoint doesn't exist yet.

**Frontend Usage**: `emotionService.scoreEmotionFromConversation()` ← `ConversationScreen.js`'s `handleContinue`. Called once per emotion, right after the voice/text session ends. The returned `score` is written into `AssessmentContext`'s in-progress answers map; if this call fails, the transcript is still held client-side and Continue can simply be tapped again to retry.

---

### 5.2 Submit Baseline Assessment — 🔧 To Be Built

| | |
|---|---|
| **API Name** | Submit Baseline Assessment |
| **Method** | `POST` |
| **Endpoint** | `/momentum/assessment/baseline` |
| **Description** | Submits all 12 emotion scores collected during the one-time baseline check-in, establishing the user's baseline chart. Fired once, only after the 12th emotion's score comes back from [§5.1](#51-score-emotion-from-conversation--to-be-built). |
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

| Field | Type | Required | Validation |
|---|---|---|---|
| `scores` | object | Yes | Must contain **all 12** emotion slugs as keys, each value an integer 1–10 |

**Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "Baseline saved",
  "data": {
    "scores": {
      "joy": 7, "gratitude": 8, "inspiration": 6, "focus": 5, "determination": 6,
      "compassion": 8, "clarity": 4, "confidence": 4, "enthusiasm": 7,
      "resilience": 5, "hope": 6, "contentment": 7
    },
    "hasCompletedBaseline": true,
    "currentDay": 1
  }
}
```

| Field | Type | Description |
|---|---|---|
| `hasCompletedBaseline` | boolean | Always `true` on success |
| `currentDay` | integer | 🔧 New — initialized to `1`, so the frontend can start the daily rotation immediately without a separate [§6.1](#61-get-dashboard--to-be-built) round trip right after submit |

**Error Responses**

`401` — standard.
`409`
```json
{ "success": false, "message": "Baseline already completed", "code": "ALREADY_COMPLETED" }
```
The current frontend has no redo flow, so treat a second submit as a hard conflict.
`422`
```json
{ "success": false, "message": "Validation failed", "code": "VALIDATION_ERROR", "errors": [{ "field": "scores.clarity", "message": "Score must be between 1 and 10" }] }
```
`500` — standard shape. `400`, `403`, `404` — not applicable.

**Backend Logic**
- Validate exactly the 12 known emotion slugs are present, each an integer 1–10.
- Persist as the user's baseline check-in record (`type: "baseline"`, `dayNumber: 0` — see [§8](#8-history)).
- Set `hasCompletedBaseline = true` on the user record — this is what [§2.1](#21-login--%E2%9C%85-live)'s Login response and future session checks read.
- Initialize `currentDay = 1` for the daily check-in rotation (see [§7](#7-daily-check-in) for the rotation formula this drives).

**Frontend Usage**: `ConversationScreen.js`'s `handleContinue`, fired once, only on the 12th (last) emotion. On success, `AssessmentCompleteScreen` calls `AuthContext.completeBaseline()`, which flips `RootNavigator` from the Assessment flow into the Main tabs.

---

## 6. Dashboard & Charts

### 6.1 Get Dashboard — 🔧 To Be Built

| | |
|---|---|
| **API Name** | Get Dashboard |
| **Method** | `GET` |
| **Endpoint** | `/momentum/dashboard` |
| **Description** | Single aggregate endpoint powering the Home tab summary, the full Chart screen, and the post-baseline chart reveal. Returns all 12 emotions' latest scores, color-coded, plus a rollup average and the user's current check-in day counter. |
| **Auth** | Bearer Token |

**Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "Dashboard fetched successfully",
  "data": {
    "hasCompletedBaseline": true,
    "chart": [
      { "emotionId": "joy", "name": "Joy", "score": 7, "color": "success" },
      { "emotionId": "gratitude", "name": "Gratitude", "score": 8, "color": "success" },
      { "emotionId": "clarity", "name": "Clarity", "score": 4, "color": "danger" }
      /* ...repeated for all 12 emotions, in the fixed order from §4.1 */
    ],
    "averageScore": 6.2,
    "currentDay": 4,
    "lastCheckInDate": "2026-08-06T18:04:00.000Z"
  }
}
```

| Field | Type | Description |
|---|---|---|
| `hasCompletedBaseline` | boolean | Whether the baseline has been submitted |
| `chart` | array (12 items) | One entry per emotion, in the fixed 12-emotion order |
| `chart[].color` | enum `danger`\|`warning`\|`success` | Pre-computed score band color — see [§10](#10-cross-cutting-decisions-backend-must-know-about) for exact thresholds |
| `averageScore` | number | Mean of all 12 scores, rounded to 1 decimal |
| `currentDay` | integer, 1-indexed | Which daily check-in "day" the user is on — drives [§7](#7-daily-check-in)'s rotation |
| `lastCheckInDate` | ISO 8601 string \| null | 🔧 New — last time any check-in (baseline or daily) was submitted; useful for a future "you haven't checked in today" nudge. `null` before baseline. |

**Error Responses**: `401`, `500` — standard shapes. `400`, `403`, `404`, `409`, `422` — not applicable (no request body/params).

**Backend Logic**
- For each of the 12 emotions, look up the **latest** recorded score across the baseline submission and all daily check-ins so far (most recent submission wins per emotion — a user's `joy` score reflects whichever check-in most recently included `joy`, not necessarily today's).
- Compute `color` per emotion and `averageScore` across all 12 using the band thresholds in [§10](#10-cross-cutting-decisions-backend-must-know-about).
- If no baseline exists yet (`hasCompletedBaseline: false`), `chart[].score` should be `0` for every emotion, not an error.

**Frontend Usage**: `HomeScreen.js` (summary card + top-3 lowest-scoring "Emotions to focus on"), `ChartScreen.js` (full bar chart via `EmotionBarChart`), `BaselineCompletionScreen.js` (post-baseline reveal) — all three call this independently today, no shared cache.

---

## 7. Daily Check-In

After the baseline, Momentum checks in on 4 of the 12 emotions per day, in a repeating 3-day cycle, so the full set of 12 is revisited every 3 days.

### 7.1 Get Today's Check-In — 🔧 To Be Built

| | |
|---|---|
| **API Name** | Get Today's Check-In |
| **Method** | `GET` |
| **Endpoint** | `/momentum/checkin/today` |
| **Description** | Returns the current day's 4-emotion rotation with that rotation's reflective question set. |
| **Auth** | Bearer Token |

**Success Response — `200 OK`**
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

| Field | Type | Description |
|---|---|---|
| `dayNumber` | integer | Current day counter |
| `alreadyCheckedInToday` | boolean | 🔧 New — lets the frontend show a "you're done for today" state instead of re-prompting; backs the `409` guard on [§7.2](#72-submit-daily-check-in--to-be-built) |
| `prompts` | array (4 items) | This day's emotion group + question |

**Error Responses**: `401`, `500` — standard shapes. `400`, `403`, `404`, `409`, `422` — not applicable.

**Backend Logic (rotation formula — must be reproduced server-side, currently client-side in `src/data/dailyCheckInSchedule.js`)**
```
groupIndex     = (dayNumber - 1) % 3
group          = DAILY_CHECKIN_GROUPS[groupIndex]     // one of the 3 fixed 4-emotion groups
rotationIndex  = floor((dayNumber - 1) / 3)           // which question variant, cycles per emotion's 3-question bank
```
Fixed groups:
```
Day pattern 1: joy, gratitude, inspiration, focus
Day pattern 2: determination, compassion, clarity, confidence
Day pattern 3: enthusiasm, resilience, hope, contentment
```
Each emotion has a 3-question rotation bank (see `src/data/questions.js:DAILY_QUESTIONS` for the current copy — recommend moving this server-side alongside the rotation logic, or the client can keep computing both locally and this endpoint's `prompts` becomes optional, but `dayNumber`/`alreadyCheckedInToday` are still needed from the server).
- Determine `alreadyCheckedInToday` by checking whether a `type: "daily"` history entry already exists for the user's current calendar date (in the user's timezone) — do not trust the client to only call [§7.2](#72-submit-daily-check-in--to-be-built) once per day.

**Frontend Usage**: `DailyCheckInScreen.js`, on mount and on pull-to-retry.

---

### 7.2 Submit Daily Check-In — 🔧 To Be Built

| | |
|---|---|
| **API Name** | Submit Daily Check-In |
| **Method** | `POST` |
| **Endpoint** | `/momentum/checkin` |
| **Description** | Submits the day's 4 emotion scores and advances the user to the next day. |
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
| Field | Type | Required | Validation |
|---|---|---|---|
| `scores` | object | Yes | Must contain exactly the 4 emotion slugs for **today's** group (per [§7.1](#71-get-todays-check-in--to-be-built)'s formula), each 1–10 |

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

`401` — standard.
`409`
```json
{ "success": false, "message": "You've already checked in today", "code": "ALREADY_CHECKED_IN" }
```
`422`
```json
{ "success": false, "message": "Validation failed", "code": "VALIDATION_ERROR", "errors": [{ "field": "scores", "message": "Expected scores for joy, gratitude, inspiration, focus" }] }
```
`500` — standard shape. `400`, `403`, `404` — not applicable.

**Backend Logic**
- Validate the submitted keys are **exactly** today's 4-emotion group (per [§7.1](#71-get-todays-check-in--to-be-built)'s formula), each an integer 1–10 — reject extra or missing emotions.
- Key the "already checked in" guard off calendar date in the user's timezone, not an unconditional counter increment (the current mock just increments `currentDay` on every call with no guard — do not replicate that in production).
- Persist as a history entry (`type: "daily"`, `dayNumber` = the day just completed — see [§8](#8-history)).
- Increment `currentDay`.

**Frontend Usage**: `DailyCheckInScreen.js`, fired once after the 4th prompt's "Finish Check-In" tap.

---

## 8. History

### 8.1 Get History — 🔧 To Be Built

| | |
|---|---|
| **API Name** | Get History |
| **Method** | `GET` |
| **Endpoint** | `/momentum/history` |
| **Description** | Returns every completed check-in (baseline + all daily entries), most recent first, for the History tab's timeline. |
| **Auth** | Bearer Token |

**Query Parameters** (🔧 new — recommended, not required by the current frontend, which renders the full array with no pagination at all)

| Param | Type | Required | Description |
|---|---|---|---|
| `page` | integer | Optional, default `1` | |
| `limit` | integer | Optional, default `20` | |
| `type` | enum `"baseline"` \| `"daily"` | Optional | Filter by entry type |

**Success Response — `200 OK`**
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
      "scores": {
        "joy": 7, "gratitude": 8, "inspiration": 6, "focus": 5, "determination": 6,
        "compassion": 8, "clarity": 4, "confidence": 4, "enthusiasm": 7,
        "resilience": 5, "hope": 6, "contentment": 7
      },
      "averageScore": 6.4,
      "band": "warning"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 187,
    "totalPages": 10
  }
}
```

| Field | Type | Description |
|---|---|---|
| `id` | string | Entry id |
| `date` | ISO 8601 string | Submission timestamp |
| `dayNumber` | integer | `0` for the baseline entry, 1+ for daily entries |
| `type` | enum `baseline`\|`daily` | |
| `scores` | object | 12 keys for baseline, 4 keys for daily |
| `averageScore` | number | 🔧 New — mean of that entry's scores, rounded to 1 decimal. Currently computed client-side in `HistoryScreen.js`; move server-side so all Aligna-suite consumers agree. |
| `band` | enum `danger`\|`warning`\|`success` | 🔧 New — band for `averageScore`, same thresholds as [§10](#10-cross-cutting-decisions-backend-must-know-about) |
| `pagination` | object | 🔧 New — see Query Parameters above |

**Error Responses**: `401`, `500` — standard shapes. `400`, `403`, `404`, `409`, `422` — not applicable.

**Backend Logic**
- Return every check-in record (baseline + daily) for the user, most recent first.
- Compute `averageScore`/`band` per entry server-side (currently duplicated client-side — see [§10](#10-cross-cutting-decisions-backend-must-know-about)).

**Notes**: Pagination is additive — if the frontend doesn't send `page`/`limit`, default to `page=1&limit=20` and still return the `pagination` object; today's frontend ignores it and just renders `data` in full, so this doesn't break existing behavior, but a growing history list will need it soon.

**Frontend Usage**: `HistoryScreen.js`.

---

## 9. Onboarding — No Backend API

`OnboardingScreen`/`IntroductionScreen` are entirely local: "has onboarded" is a boolean flag in `AsyncStorage` (`momentum_has_onboarded`), never sent to the backend (`AuthContext.js`). No endpoint needed. If Momentum's shared Aligna profile should eventually know whether a user has onboarded, the simplest path is adding an `has_onboarded` boolean to the `User` record and [§2.1](#21-login--%E2%9C%85-live)/[§3.1](#31-get-profile--%E2%9C%85-live-field-additions-below-are--new)'s response, rather than a dedicated endpoint — flagged here, not built.

---

## 10. Cross-Cutting Decisions Backend Must Know About

These apply across multiple endpoints above and are called out once here rather than repeated everywhere.

### 10.1 Emotion identifier: `slug`, not numeric `id`
[§4.1](#41-get-emotions-list--%E2%9C%85-live-field-addition-below-is--new)'s live endpoint returns a numeric `id` (`1`–`12`) as its database primary key. Every other place an emotion is referenced in this spec — `scores` object keys, `emotionId` fields, path params — uses the **string slug** (`"joy"`, `"gratitude"`, …), because that's what all of the frontend's bundled client-side logic (`AssessmentContext`, daily rotation, score bands, the ElevenLabs dynamic variables) already keys off. **Add the `slug` field to §4.1's response** (it does not exist in the live endpoint today) so both identifiers are available: `id` for your own database relations, `slug` for every request/response boundary documented in this file. Do not expose the numeric `id` anywhere else in this API — it would force every consumer to carry a slug↔id mapping table for no benefit.

### 10.2 Score band thresholds (replicate exactly)
Used in [§4.2](#42-get-emotion-detail--to-be-built), [§6.1](#61-get-dashboard--to-be-built), and [§8.1](#81-get-history--to-be-built) — must match `src/data/emotions.js`'s `getScoreBand()` exactly, since the frontend has historically computed this client-side and any drift will visibly disagree with cached/legacy client behavior:
```
danger:  score <= 4   → "Needs attention"
warning: score 5–7    → "Building"
success: score 8–10   → "Thriving"
```

### 10.3 `default_language` option list mismatch
`EditProfileScreen.js` offers `English, Arabic, Spanish, French, Hindi, Chinese`; the (now-consolidated, see [§3](#3-profile--settings)) Language screen previously offered only `English, Spanish, French, Portuguese`. These are two different lists for what is now one field (`default_language`). **Backend should accept the union of both** (`English, Arabic, Spanish, French, Hindi, Chinese, Portuguese`) rather than picking one, and this mismatch should be raised with product/design as a frontend follow-up to unify the two pickers — it isn't something the backend can resolve unilaterally, but validation should not be stricter than either existing screen expects in the meantime.

### 10.4 `x-api-key` header
Sent on every request today as a hardcoded literal (`12345678`) in client source, not an env/secret-store value. Not documented anywhere as a real requirement — flag with the backend/security team before launch: either it should actually gate something (and move to a real secret), or it should be removed from the client entirely.

### 10.5 Error-mapping interceptor is currently disabled
`src/api/axios.js`'s response error interceptor (the part that would turn a raw Axios error into a typed internal error) is commented out today. A failed request currently rejects with the raw Axios error object, and each screen parses it inconsistently (some read `err.message`, some read `err.response?.data?.message`). This is a frontend-only fix, tracked separately — **the backend does not need to wait for it**, but should return the [Standard Error Envelope](#standard-error-envelope) consistently so that re-enabling the interceptor is a clean, no-surprises change once it happens.

### 10.6 Token model
No refresh-token flow exists today — a single long-lived bearer token, no `401` handling wired up client-side at all. [§2.7](#27-refresh-token--%E2%AD%90-recommended-new)'s Refresh Token endpoint is recommended for production; adopting it means adding a `refresh_token` field to [§2.1](#21-login--%E2%9C%85-live)/[§2.2](#22-register--%E2%9C%85-live)'s responses too.
