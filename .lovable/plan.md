
# Guided Gameplay Mode - Diagnosis & Refactor Plan

## Executive Summary

The Guided Mode has four interconnected bugs stemming from architectural issues in state management and audio orchestration. This plan addresses them systematically across phases.

---

## Phase 1 Findings: Root Cause Analysis

### Bug 1: Next Step Card Shows Full Description

**Problem:** The "Next Step" card displays the complete AI response instead of a short summary.

**Root Cause:**
- `parseStepFromResponse()` in `useGuidedWalkthrough.ts` uses fragile regex patterns
- Falls back to taking the first 2 lines (up to 150 chars) when parsing fails
- The `GuidedStep` interface only has `title`, `instruction`, `upNext` — no separate `summary` field for the card

**Location:** `src/hooks/useGuidedWalkthrough.ts` lines 55-94

---

### Bug 2 & 3: Questions/Mic Toggle Wipes Transcript

**Problem:** Asking questions or toggling the mic clears all messages and guided state.

**Root Cause:**
```typescript
// AIAdjudicator.tsx line 445
const endRealtimeChat = () => {
  ...
  setRealtimeMessages([]);  // <-- WIPES ALL VOICE MESSAGES
  ...
};
```

This function is called:
1. When user manually disconnects voice
2. Automatically by `GuidedModeLayout.tsx` lines 87-97 when AI finishes speaking

**Additional Issue:**
- Two separate message arrays (`messages` from text chat, `realtimeMessages` from voice chat) are merged for display but managed independently
- No persistent transcript store exists

---

### Bug 4: Double Audio Output

**Problem:** Two voices speak the same content simultaneously.

**Root Cause — Two Audio Systems:**

| System | Location | Trigger |
|--------|----------|---------|
| OpenAI Realtime WebRTC | `RealtimeAudio.ts:118` | `pc.ontrack` streams audio directly |
| TTS Edge Function | `AIAdjudicator.tsx:288-326` | `speakResponse()` called via `handleSend()` |

Both can run at the same time when:
1. Realtime chat is connected (WebRTC streaming audio)
2. `willSpeak` is true in `handleSend()` (TTS also invoked)

The `spokenMessageIdsRef` guard only prevents duplicate TTS calls, not Realtime audio.

---

## Phase 2: Fix State & UI Persistence

### Changes Required

1. **Stop wiping messages on disconnect**
   - In `AIAdjudicator.tsx`, remove `setRealtimeMessages([])` from `endRealtimeChat()`
   - Instead, preserve messages and only clear on explicit reset

2. **Create unified transcript store**
   - Add `transcript` array to `useGuidedWalkthrough` state
   - Both text and voice messages append here
   - Never cleared except on explicit reset

3. **Separate step summary from detail**
   - Extend `GuidedStep` interface:
   ```typescript
   interface GuidedStep {
     title: string;
     summary: string;      // Short (for Next Step card)
     detail: string;       // Full (for transcript)
     speakText?: string;   // Optional TTS text
     upNext?: string;
   }
   ```

4. **Update parseStepFromResponse()**
   - Extract a true short summary (1 sentence, max 80 chars)
   - Store full instruction separately as `detail`

5. **Drive Next Step card from state only**
   - `currentStep.summary` populates the card
   - Never derive from last message

---

## Phase 3: Fix Mic/TTS Orchestration

### Changes Required

1. **Disable TTS when Realtime is active**
   - Add check in `speakResponse()`:
   ```typescript
   if (isRealtimeConnected) {
     console.log("Skipping TTS - Realtime audio active");
     return;
   }
   ```

2. **Add Stop Feedback button**
   - Create new component `StopFeedbackButton`
   - Visible only when `isSpeaking` is true
   - On click: stop audio playback, cancel any streaming

3. **Single TTS invocation per message**
   - Move `spokenMessageIds` tracking to `useGuidedWalkthrough` (already partially implemented but not used)
   - Use `guidedWalkthrough.hasBeenSpoken(messageId)` and `markAsSpoken()`

4. **Cancel previous audio before new**
   - In `speakResponse()`, stop any playing audio first:
   ```typescript
   if (audioRef.current) {
     audioRef.current.pause();
     audioRef.current.currentTime = 0;
   }
   ```

5. **Clean up listeners properly**
   - Ensure `useEffect` cleanup in `GuidedModeLayout` properly removes listeners
   - Verify no duplicate subscriptions on re-render

---

## Phase 4: Controlled Step Changes

### Changes Required

1. **Next button is the only default progression**
   - `onNextStep()` increments `stepIndex`
   - Questions append to transcript but do NOT change steps

2. **Detect explicit navigation phrases**
   - In `sendMessage` response handler, check for phrases like:
     - "skip", "go back", "restart", "jump to", "we already did this"
   - Only then allow step index modification

3. **Confirm before contextual updates**
   - If AI detects game state contradiction (e.g., "we already dealt"):
     - AI should ask confirmation: "It sounds like you've already completed setup. Should I skip to the first turn?"
     - User confirms → update step
     - User denies → stay on current step

4. **Log step changes in transcript**
   - When step changes unexpectedly, append:
     - `[System] Updating next step based on what you told me…`

---

## Phase 5: Global Scope/Safety Filter

### Changes Required

1. **Add off-topic detection to system prompts**
   - In `buildGuidedPrompt()`, `buildQuickStartPrompt()`, and `buildSystemPrompt()`:
   ```
   If user asks about non-game topics (weather, news, personal advice, system design):
   - Refuse briefly: "House Rules only supports game setup/rules/scoring."
   - Redirect: "Tell me the game you're playing or ask a rules question."
   ```

2. **Handle ambiguous requests**
   - If unclear whether it's a game question: "Is this about a game? Which one?"

3. **Apply across all modes**
   - Hub, QuickStart, Tournament, and Guided all use this filter

---

## File Changes Summary

| File | Changes |
|------|---------|
| `src/hooks/useGuidedWalkthrough.ts` | Add `transcript` array; extend `GuidedStep` with `summary`/`detail`; add transcript management methods |
| `src/components/AIAdjudicator.tsx` | Remove message clearing on disconnect; use unified transcript; add Realtime check in TTS; add Stop button |
| `src/components/ai-adjudicator/GuidedModeLayout.tsx` | Drive card from `currentStep.summary`; add Stop Feedback button; fix Next/Prev logic |
| `supabase/functions/chat-with-actions/index.ts` | Update `buildGuidedPrompt()` to instruct AI on summary generation; add scope filter |
| `supabase/functions/realtime-session/index.ts` | Add scope filter to `buildGuidedVoiceInstructions()` |

---

## Implementation Order

```text
Phase 2 (State/UI)
├── 2.1 Stop wiping realtimeMessages
├── 2.2 Add transcript array to guided state
├── 2.3 Extend GuidedStep interface
├── 2.4 Update parseStepFromResponse
└── 2.5 Update GuidedModeLayout to use summary

Phase 3 (Audio)
├── 3.1 Add isRealtimeConnected check to TTS
├── 3.2 Create StopFeedbackButton
├── 3.3 Move spoken tracking to hook
├── 3.4 Add audio cancellation
└── 3.5 Verify listener cleanup

Phase 4 (Step Control)
├── 4.1 Next button only progression
├── 4.2 Detect navigation phrases
├── 4.3 Confirmation flow for context changes
└── 4.4 Log step changes

Phase 5 (Scope Filter)
├── 5.1 Update backend prompts
└── 5.2 Apply to all modes
```

---

## Testing Checklist

After implementation, verify:
- [ ] Asking a question mid-step preserves transcript and step
- [ ] Toggling mic does not clear messages
- [ ] Next Step card shows only short summary
- [ ] Full instructions appear in chat transcript
- [ ] Only one audio source plays at a time
- [ ] Stop Feedback button halts speech
- [ ] "Next" button advances steps
- [ ] Questions don't auto-advance steps
- [ ] Off-topic questions are refused politely
