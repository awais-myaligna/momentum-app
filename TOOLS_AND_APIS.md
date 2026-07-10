# Momentum — ElevenLabs Agent Tools & APIs

Scope: this document covers **only what the ElevenLabs Conversational AI agent itself needs** to do its job — not the full Momentum backend (see `API_DOCUMENTATION.md` for the complete app API contract).

## How the agent actually gets and produces data today

Momentum's current implementation (`ConversationScreen.js`, `AssessmentNavigator.js`) is deliberately thin at the voice layer:

- The React Native app starts one short voice **session per emotion** (`useConversation().startSession()`), passing context in via **Dynamic Variables** (`emotionName`, `question`) — no API call happens to start a session, and the agent calls no tools today.
- The agent's spoken exchange is transcribed live in the app (`onMessage`) but is **not sent to the Aligna backend** — no audio or transcript leaves the device.
- The numeric 1–10 score is currently captured **after** the voice turn, by hand, on the next screen (`EmotionRatingScreen` / `DailyCheckInScreen`'s `ScoreSlider`).

**This last point is a documented gap, not the intended design.** Per the Momentum Roadmap, the intended flow has the LLM itself interpret the user's spoken answer and assign the 1–10 score — the user is never asked to manually pick a number during the assessment. `EmotionRatingScreen`'s tap-to-select scale reflects an earlier/interim build and should be removed from the intended baseline and daily flows once `record_emotion_score` (below) is wired in; it should not be treated as a confirmation step the user sees.

Everything below Section 1 is the **recommended production configuration** — grounded entirely in Momentum's existing, documented backend contract (`API_DOCUMENTATION.md`) — that lets the agent capture the score itself from the conversation. Nothing below is speculative feature creep: each tool exists to let the agent do only what `SYSTEM_PROMPT.md` already asks of it.

---

## 1. Session Context (input to the agent — not a tool call)

Not a function the agent calls — this is the data the React Native app fetches/computes and passes in as **Dynamic Variables** when it calls `startSession()`, before the agent speaks a word.

| Variable | Purpose | Source |
|---|---|---|
| `emotionName` | Which of the 12 emotions this session is about | `EMOTIONS` (client-bundled) |
| `question` | The reflective question to open with | `BASELINE_QUESTIONS` / `DAILY_QUESTIONS` (client-bundled) |
| `checkInType` | `"baseline"` or `"daily"` | Which navigator/screen started the session |
| `stepPosition` | e.g. `"3 of 12"` | Assessment/daily check-in progress state |
| `previousScore` | User's last recorded score for this emotion, if any | `GET /emotions/{emotionId}` or `GET /dashboard` (see `API_DOCUMENTATION.md` §4.2, §6.1) — fetched by the app **before** starting the session |

No backend call is required from the agent to obtain any of this — it all arrives pre-resolved.

---

## 2. Client Tools (called BY the agent, during the conversation)

These are registered as **Client Tools** in the ElevenLabs agent config, then implemented in the app via `useConversation({ clientTools: { ... } })`. They execute locally in the React Native app (not a network hop to a server) — the fastest, lowest-latency way for the agent to affect app state mid-conversation.

### 2.1 `record_emotion_score`

| | |
|---|---|
| **Purpose** | Lets the agent save the 1–10 score **it has determined itself**, by interpreting the user's natural-language answer (tone, word choice, content) against the rubric in `SYSTEM_PROMPT.md`'s "How scores are assigned." The user is never asked to state or choose a number — this tool is how the AI's own judgment becomes the recorded score. |
| **When called** | Once per session, silently, after the agent has gathered enough from the exchange (the initial answer, plus at most one follow-up if needed) to confidently judge how strongly the emotion is present. Not announced to the user and not preceded by asking them for a number. |

**Payload (agent → app)**
```json
{
  "emotionId": "confidence",
  "score": 7
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `emotionId` | string enum | Yes | One of the 12 emotion ids; must match the session's `{{emotionName}}` |
| `score` | integer | Yes | 1–10 inclusive — the agent's own assigned value, not a number spoken by the user |

**Response (app → agent)**
```json
{ "success": true, "score": 7 }
```

**Error response**
```json
{ "success": false, "error": "INVALID_SCORE", "message": "Score must be an integer between 1 and 10." }
```
On error, the agent should silently retry with a corrected integer in range — this is a formatting failure on the agent's side, not something to surface to the user, since the user was never involved in producing the number.

**Fallback when voice is unavailable**: because manual score entry is intentionally removed from the intended flow, a connection failure (`onError`, no `AGENT_ID`) needs its own path to a score rather than falling back to a tap-to-select scale. Recommended: fall back to a **text-chat** exchange that still runs the same interpret-and-score behavior (the user types instead of speaks, the same scoring logic calls this tool) rather than reintroducing a manual picker. This is flagged as an open implementation item, not yet built.

---

### 2.2 `flag_needs_support`

| | |
|---|---|
| **Purpose** | Safety escalation. Lets the agent signal the app to surface real support resources when a user expresses crisis, self-harm, or emergency language — without the agent attempting to handle the situation itself (per `SYSTEM_PROMPT.md`'s "never do" rules). |
| **When called** | Immediately when the user says something indicating they may be in crisis or danger, in the same turn the agent gives its brief, caring redirect. At most once per session. |

**Payload (agent → app)**
```json
{ "emotionId": "hope", "reason": "user_expressed_crisis_language" }
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `emotionId` | string enum | Yes | The emotion active when the flag was raised |
| `reason` | string enum | Yes | `"user_expressed_crisis_language"` (only value needed today — kept as an enum for future extension) |

**Response (app → agent)**
```json
{ "success": true }
```

**Error response**
```json
{ "success": false, "error": "FLAG_NOT_RECORDED" }
```
This tool's error path does not change the agent's behavior — the agent still gives its brief, caring, redirect-to-real-help response regardless of whether the flag was recorded successfully; recording the flag is for the app to surface resources, not a precondition for the agent's response.

**App-side behavior**: on success, the app should end the voice session and route the user to a support-resources screen rather than continuing the check-in flow. (No such screen exists in the current build — flagged here as a required companion addition alongside enabling this tool.)

---

## 3. Backend REST APIs the conversation's outcome depends on

The agent never calls these directly — they're invoked by the React Native app immediately after a check-in flow completes, using the scores the conversation (via `record_emotion_score`, or the manual scale as fallback) produced. Included here because the voice conversation's entire purpose is to produce the data these calls submit — full request/response detail lives in `API_DOCUMENTATION.md`.

| Endpoint | Called when |
|---|---|
| `POST /assessment/baseline` | After the 12th (final) baseline emotion is rated — submits all 12 scores at once. See `API_DOCUMENTATION.md` §5.1. |
| `POST /checkin` | After the 4th (final) daily emotion is rated — submits that day's 4 scores. See `API_DOCUMENTATION.md` §7.2. |
| `GET /dashboard` | Immediately after either submission, to render the updated chart. See `API_DOCUMENTATION.md` §6.1. |

These require no changes for voice support — they already accept exactly the score data the conversation produces.

---

## Summary: what to actually add in the ElevenLabs dashboard

- **Client Tools**: `record_emotion_score`, `flag_needs_support` (Section 2). Nothing else — the agent does not need read access to any backend API; all context arrives via Dynamic Variables (Section 1).
- **No server tools / webhooks are required.** Momentum's backend never needs to be reachable from ElevenLabs directly.
