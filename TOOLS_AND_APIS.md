# Momentum — ElevenLabs Agent Tools & APIs

Scope: this document covers **only what the ElevenLabs Conversational AI agent itself needs** to do its job — not the full Momentum backend (see `API_DOCUMENTATION.md` for the complete app API contract).

## How the agent actually gets and produces data today

Momentum's current implementation (`ConversationScreen.js`, `AssessmentNavigator.js`):

- The React Native app starts one short voice **session per emotion** (`useConversation().startSession()`), passing context in via **Dynamic Variables** (`emotionId`, `emotionName`, `question`, `checkInType`, `stepPosition`) — no API call happens to start a session.
- The agent's spoken exchange is transcribed live in the app (`onMessage`) but is **not sent to the Aligna backend during the conversation** — no audio or transcript leaves the device while the session is live.
- **Scoring happens after the conversation ends, not during it, and not by the agent.** When the user taps Continue, the app ends the session and sends that emotion's full transcript to a backend REST endpoint (`POST /assessment/emotion-score`, `API_DOCUMENTATION.md` §3.9), which runs an AI judge over it and returns the 1–10 score. `ConversationScreen.js` records that score directly — there is no manual scoring screen. `EmotionRatingScreen` (the old tap-to-select scale) has been removed from the baseline flow.
- **This replaced an earlier design** where the agent itself judged the exchange mid-conversation and called a `record_emotion_score` client tool. That proved unreliable to get calling consistently — a tool call buried inside a live voice session, with no visibility into whether or why it didn't fire, was much harder to debug than one ordinary REST call with a transcript you can log and replay. If your agent config still has `record_emotion_score` registered from that earlier setup, remove it.
- The one thing that still has to happen live, in-conversation, is crisis detection (`flag_needs_support`, below) — that can't wait for a transcript to be judged after the fact.
- If the voice connection fails, the screen falls back to a text-chat exchange with the same agent/session (mic muted, typed input via `sendUserMessage`) rather than a manual picker. The transcript is captured the same way either way, so post-conversation scoring is unaffected by which mode produced it. If the connection also fails, or `EXPO_PUBLIC_AGENT_ID` isn't set, the screen shows a Retry state.

**Daily check-in (`DailyCheckInScreen.js`) is out of scope for this pass** and still uses the manual `ScoreSlider` — bringing it in line with the baseline flow above is a follow-up.

---

## 1. Session Context (input to the agent — not a tool call)

Not a function the agent calls — this is the data the React Native app fetches/computes and passes in as **Dynamic Variables** when it calls `startSession()`, before the agent speaks a word.

| Variable | Purpose | Source |
|---|---|---|
| `emotionId` | The exact slug the agent must echo back as `emotionId` on `flag_needs_support` — sent explicitly so the agent never has to derive it from `emotionName` | `EMOTIONS` (client-bundled) |
| `emotionName` | Which of the 12 emotions this session is about, for speaking to the user | `EMOTIONS` (client-bundled) |
| `question` | The reflective question to open with | `BASELINE_QUESTIONS` / `DAILY_QUESTIONS` (client-bundled) |
| `checkInType` | `"baseline"` or `"daily"` | Which navigator/screen started the session |
| `stepPosition` | e.g. `"3 of 12"` | Assessment/daily check-in progress state |
| `previousScore` | User's last recorded score for this emotion, if any | `GET /emotions/{emotionId}` or `GET /dashboard` (see `API_DOCUMENTATION.md` §4.2, §6.1) — fetched by the app **before** starting the session |

No backend call is required from the agent to obtain any of this — it all arrives pre-resolved.

---

## 2. Client Tools (called BY the agent, during the conversation)

Registered as a **Client Tool** in the ElevenLabs agent config, then implemented in the app via `useConversation({ clientTools: { ... } })`. It executes locally in the React Native app (not a network hop to a server) — the fastest, lowest-latency way for the agent to affect app state mid-conversation.

There is exactly **one** client tool now — scoring is not a tool call (see §3).

### 2.1 `flag_needs_support`

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

**App-side behavior**: implemented as `SupportResourcesScreen.js`. On call, `ConversationScreen.js` does *not* end the session immediately — that would cut the agent off mid-sentence during its brief, caring redirect. Instead it flags local state, lets the agent finish speaking, and swaps the footer button to "Get Support"; tapping it ends the session and routes to `SupportResourcesScreen` (crisis-line resources, a bridge to real help, not the check-in flow). This copy has not had a clinical/legal review — treat it as a first pass.

---

## 3. Backend REST APIs the conversation's outcome depends on

The agent never calls these directly — they're invoked by the React Native app. Full request/response detail lives in `API_DOCUMENTATION.md`.

| Endpoint | Called when |
|---|---|
| `POST /assessment/emotion-score` | Once per emotion, right after the user taps Continue — sends that emotion's transcript, gets back its 1–10 score. This is where the AI judging actually happens now. See `API_DOCUMENTATION.md` §3.9. |
| `POST /assessment/baseline` | After the 12th (final) baseline emotion is scored — submits all 12 scores at once. See `API_DOCUMENTATION.md` §3.4. |
| `POST /checkin` | After the 4th (final) daily emotion is scored — submits that day's 4 scores. See `API_DOCUMENTATION.md` §3.6.2. |
| `GET /dashboard` | Immediately after either submission, to render the updated chart. See `API_DOCUMENTATION.md` §3.5. |

---

## Summary: what to actually add in the ElevenLabs dashboard

- **Client Tools**: `flag_needs_support` only (Section 2). The agent does not need read access to any backend API; all context arrives via Dynamic Variables (Section 1), and scoring is a REST call the app makes on its own after the session ends — not something the agent triggers.
- **No server tools / webhooks are required.** Momentum's backend never needs to be reachable from ElevenLabs directly.
