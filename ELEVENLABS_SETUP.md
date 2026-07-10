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

Confirm the Dynamic Variables it references (`emotionName`, `question`, `checkInType`, `stepPosition`, `previousScore`) are enabled under the agent's **Dynamic Variables** settings so they resolve correctly when the app supplies them at `startSession()`.

## 5. What to Upload Into Knowledge Base

Upload `KNOWLEDGE_BASE.md` as-is under **Knowledge Base → Add Document**. No splitting or editing needed — it's already scoped to user-facing information only (no technical detail to strip).

## 6. Tools to Add

Add both as **Client Tools** (not server/webhook tools — Momentum's backend is never called directly by ElevenLabs):

| Tool name | Parameters |
|---|---|
| `record_emotion_score` | `emotionId` (string), `score` (integer, 1–10) |
| `flag_needs_support` | `emotionId` (string), `reason` (string) |

Full schemas, payloads, and responses are in `TOOLS_AND_APIS.md` — use those definitions verbatim when configuring each tool's parameters in the dashboard. On the app side, implement both by passing a `clientTools` object into `useConversation({ clientTools: { record_emotion_score, flag_needs_support } })` in `ConversationScreen.js`.

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
- When the agent finishes its closing line, the app calls `conversation.endSession()` and moves straight to the next emotion's screen, which starts an entirely new session. Per the Momentum Roadmap's intended design, the AI assigns the score itself during the conversation (via `record_emotion_score` — see `TOOLS_AND_APIS.md`) — **there is no manual scoring screen in between.** `EmotionRatingScreen`'s current tap-to-select scale is an interim build artifact and should be removed from this flow once the tool is wired in; it should not be treated as a confirmation step.
- Voice failure needs its own answer to "how does a score get produced," since there's no manual picker to fall back to — see the "Fallback when voice is unavailable" note in `TOOLS_AND_APIS.md` §2.1.

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

5. User responds; agent may ask one brief follow-up if it doesn't yet have enough
   to judge how strongly this emotion is present — it never asks the user for a number

6. Client tool is called
   → Agent silently determines a 1–10 score from the full exchange (never spoken aloud)
     and calls record_emotion_score({ emotionId, score })
   → App writes the score into local check-in state
   → (If the user is in crisis) Agent instead calls flag_needs_support and gives its
     brief, caring redirect; the app ends the session and routes to support resources

7. Agent closes the turn with a short thank-you; session ends
   → conversation.endSession()
   → User taps Continue; app moves to the next emotion (repeat steps 2–7)

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
