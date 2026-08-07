# Momentum — ElevenLabs Agent Setup Guide

Practical, concise steps to configure the ElevenLabs Conversational AI agent that powers Momentum's voice check-ins, and how it fits into the app end to end.

## 1. Create the Agent

1. In the ElevenLabs dashboard, go to **Conversational AI → Agents → Create Agent**.
2. Start from a blank agent (not a template) — Momentum's flow (one short session per emotion) is simple enough not to need one.
3. Name it clearly, e.g. `Momentum – Voice Guide`.
4. Once created, copy the **Agent ID** — it goes into the app's `.env` as `EXPO_PUBLIC_AGENT_ID` (see `.env.example`). Without it, the app runs in text-only fallback mode with no voice at all.

## 2. Model

Pick a fast, low-latency conversational LLM tier (e.g. the provider's "flash"/"mini"-class model), not the largest/highest-reasoning option. Reasoning: each baseline check-in runs **12 back-to-back short sessions**, one per emotion — latency compounds across them, and the reasoning required here (a brief empathetic exchange + reading back a number) doesn't need a frontier-scale model. Enable low-latency/streaming mode if the dashboard offers it.

## 3. Voice

Choose one warm, natural, unhurried voice from the ElevenLabs voice library as the default. Avoid overly energetic or synthetic-sounding voices — Momentum's tone is calm and grounded, not upbeat marketing energy.

Momentum's Profile → Voice Preferences screen lets a user choose `Female` or `Male`. The current app does not yet switch voices per user — it always uses this one agent/voice. To honor that preference in production, either:
- Create two agents (one per voice) and have the app pick `EXPO_PUBLIC_AGENT_ID` per user's saved preference, **or**
- Use ElevenLabs' voice-override option at session start, if supported for your plan, driven by the same preference.

Either approach is an app-side routing decision — the Instructions/Knowledge Base/Tools below stay identical for both voices.

## 4. What to Paste Into Instructions

Copy the entire **Instructions** section of `SYSTEM_PROMPT.md` (everything from "### Agent role" down) into the agent's **System Prompt** field. Do not summarize or shorten it — it encodes required safety behavior (the crisis-language redirect) that must not be dropped.

Confirm the Dynamic Variables it references (`emotionId`, `emotionName`, `question`, `checkInType`, `stepPosition`, `previousScore`) are enabled under the agent's **Dynamic Variables** settings so they resolve correctly when the app supplies them at `startSession()`. `emotionId` is the one most worth double-checking — it's what the agent must echo back on `flag_needs_support` calls, and a missing/disabled variable here means the agent never learns the right value.

## 5. What to Upload Into Knowledge Base

Upload `KNOWLEDGE_BASE.md` as-is under **Knowledge Base → Add Document**. No splitting or editing needed — it's already scoped to user-facing information only (no technical detail to strip).

## 6. Tools to Add

Add as a **Client Tool** (not a server/webhook tool — Momentum's backend is never called directly by ElevenLabs):

| Tool name | Parameters |
|---|---|
| `flag_needs_support` | `emotionId` (string), `reason` (string) |

This is the only tool the agent needs. Scoring is **not** a tool call anymore — an earlier design had the agent call a `record_emotion_score` tool mid-conversation, but that proved unreliable to get calling consistently, so scoring moved to an ordinary backend REST call the app makes after the session ends (see `API_DOCUMENTATION.md` §3.9). If your agent config still has `record_emotion_score` registered from that earlier setup, remove it — nothing calls it anymore.

`flag_needs_support`'s full schema, payload, and response are in `TOOLS_AND_APIS.md` §2.2 — use that definition verbatim when configuring the tool's parameters in the dashboard. On the app side it's implemented by passing a `clientTools` object into `useConversation({ clientTools: { flag_needs_support } })` in `ConversationScreen.js`.

## 7. Recommended Conversation Settings

- **First message**: agent-initiated (the agent should speak first, greeting and asking `{{question}}}` — the user shouldn't have to speak first each of the 12 times).
- **Max session duration**: short, ~60–90 seconds. Each session covers exactly one emotion; there's no reason for it to run longer.
- **Silence/inactivity timeout**: short (~10–15s) — if the user goes quiet, the app's `Continue` button and text fallback are always available, so the voice session doesn't need to wait long.
- **Interruptions**: allow the user to interrupt/barge-in — natural conversation, not a scripted monologue.
- **Turn detection**: standard VAD is sufficient; no custom wake-word or push-to-talk needed.
- **Language**: default English. Momentum's Profile → Language screen supports Spanish, French, and Portuguese; supporting those in voice requires either a `language` Dynamic Variable the agent switches on, or one agent per language, mirroring the voice-selection approach in Section 3.

## 8. How the React Native App Communicates With the Agent

- The app uses the `@elevenlabs/react-native` SDK. `AssessmentNavigator.js` wraps the assessment flow in a `<ConversationProvider>`; `ConversationScreen.js` calls the `useConversation()` hook.
- For each emotion, the screen calls `conversation.startSession({ agentId, dynamicVariables })` — this opens one fresh voice session per emotion, not one long session for the whole check-in.
- Live transcript arrives via the `onMessage({ message, source })` callback and is rendered in real time; connection state comes from `conversation.status` / `conversation.isSpeaking`.
- If the agent isn't configured (`EXPO_PUBLIC_AGENT_ID` unset) or a connection error occurs (`onError`), the screen falls back to a plain written question with no voice — the check-in still works, just as text.
- The app requests microphone access via `expo-audio` (`NSMicrophoneUsageDescription` on iOS, `RECORD_AUDIO` on Android — both already declared in `app.json`).
- When the user taps Continue after the agent's closing line, the app ends the session, sends that emotion's full transcript to `POST /assessment/emotion-score` (`API_DOCUMENTATION.md` §3.9) for AI judging, then moves to the next emotion's screen once the score comes back — **there is no manual scoring screen, and the agent itself never assigns the score.** `EmotionRatingScreen` (the old tap-to-select scale) has been removed from the baseline flow; Continue is disabled with a validation message until the user has actually said something, since an empty transcript can't be judged.
- Voice failure falls back to a text-chat exchange with the same agent instead of a manual picker — see the "Fallback when voice is unavailable" note in `TOOLS_AND_APIS.md` §2.1. The transcript is captured the same way either way, so scoring afterward is unaffected by which mode produced it.

## 9. Complete Conversation Lifecycle

```
1. User opens the app
   → RootNavigator routes them into the Assessment flow (baseline) or Check-In tab (daily)

2. App resolves Session Context for the current emotion
   → emotionName, question, checkInType, stepPosition
   → previousScore fetched via GET /emotions/{emotionId} or GET /dashboard, if available

3. App starts the conversation
   → conversation.startSession({ agentId, dynamicVariables })

4. AI speaks
   → Agent greets the user and asks {{question}} in its own natural phrasing

5. User responds; agent may ask one brief follow-up if the answer was too thin
   to reflect anything real — it never asks the user for a number, and it does
   not judge or score the exchange itself
   → (If the user is in crisis) Agent instead calls flag_needs_support and gives its
     brief, caring redirect — this is the one thing still handled live, in-conversation

6. Agent closes the turn with a short thank-you; session stays open until the
   user taps Continue (so the agent can still be listening/scored if they add more)

7. User taps Continue
   → App ends the session (conversation.endSession())
   → App sends this emotion's full transcript to POST /assessment/emotion-score
   → Backend's AI judge returns a 1–10 score for that emotion
   → App writes the score into local check-in state, then moves to the next
     emotion (repeat steps 2–7) — or, if the agent flagged support in step 5,
     the app instead routes to the support-resources screen

8. After the LAST emotion in the set:
   → Baseline: app calls POST /assessment/baseline with all 12 scores
   → Daily: app calls POST /checkin with that day's 4 scores

9. Scores are returned
   → Backend confirms the save; app calls GET /dashboard for the updated chart

10. Charts update
   → BaselineCompletionScreen / HomeScreen / ChartScreen render the refreshed,
     color-coded chart from the dashboard response
```

Steps 3–7 repeat once per emotion (12 times for a baseline, 4 times for a daily check-in) before steps 8–10 run once at the end of the set.
