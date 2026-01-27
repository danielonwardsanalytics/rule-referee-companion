
# Audio & Guided Mode - Full Functional Audit and Specification

## Purpose
Create a single source of truth document that defines exactly how audio, voice chat, and guided mode should behave. This prevents regressions by giving every future change a clear specification to validate against.

---

## Phase 1: Functional Specification Document

### 1.1 Audio Source Rules (Unified WebRTC)

| Trigger | Audio Source | Expected Behavior |
|---------|--------------|-------------------|
| **Voice Button (all modes)** | WebRTC (RealtimeChat) | Live bidirectional voice - AI speaks through WebRTC stream |
| **Next Button (Guided Mode)** | WebRTC (useWebRTCSpeech) | Text-to-speech via WebRTC - AI reads instruction aloud |
| **Text Send with Audio ON** | WebRTC (useWebRTCSpeech) | AI response spoken via WebRTC after text response arrives |
| **Text Send with Audio OFF** | None | No audio output |

**Critical Rule**: Only ONE audio source may be active at any time. Before starting a new audio stream, the previous one MUST be fully stopped and cleaned up.

### 1.2 Guided Mode State Machine

```text
                    User says "guide me through [game]"
                                    │
                                    ▼
┌───────┐         ┌──────────┐         ┌───────────┐
│ idle  │────────►│ planning │────────►│  in_step  │◄────────────────┐
└───────┘         └──────────┘         └─────┬─────┘                 │
    ▲                                        │                       │
    │                                        │ User asks question    │
    │                                        ▼                       │
    │                            ┌────────────────────┐              │
    │                            │ answering_question │──────────────┘
    │                            └────────────────────┘   "Press Next"
    │
    └───────────────────────────── User ends session or resets
```

### 1.3 Button Behaviors

| Button | Current State | Action |
|--------|---------------|--------|
| **Next** | in_step | 1. Stop any active audio (WebRTC speech or live chat) 2. Send step request to LLM 3. Parse response for **DO THIS NOW:** marker 4. Update currentStep 5. Speak instruction via WebRTC 6. Auto-disconnect after speaking |
| **Voice** | idle/in_step | 1. Stop any active audio 2. Connect to RealtimeChat 3. Listen for user speech 4. AI responds via WebRTC audio stream 5. If step marker in response, update currentStep |
| **Text Send** | in_step | 1. Send question to LLM (no step markers expected) 2. Display response in transcript 3. If Audio ON, speak response via WebRTC 4. Do NOT advance step |

### 1.4 "DO THIS NOW:" Marker Behavior

- **When to include**: Game start, "Next" command, navigation commands (skip/go back)
- **When to exclude**: Q&A responses, clarifying questions, non-step content
- **Audio behavior**: The words "DO THIS NOW" should NOT be spoken aloud - the marker is for UI parsing only

### 1.5 Audio Cleanup Sequence

Before starting ANY new audio:
1. Call `stopSpeaking()` (stops useWebRTCSpeech)
2. If `realtimeChatRef.current` exists, call `.disconnect()` and set to null
3. Set `isRealtimeConnected` to false
4. Wait for cleanup to complete before starting new audio

---

## Phase 2: Files and Dependencies

### Core Files to Audit

| File | Responsibility | Touches Audio? |
|------|----------------|----------------|
| `src/components/AIAdjudicator.tsx` | Main orchestrator for all modes | Yes - manages both audio sources |
| `src/hooks/useWebRTCSpeech.ts` | WebRTC-based TTS (speaks text aloud) | Yes - primary TTS mechanism |
| `src/utils/RealtimeAudio.ts` | WebRTC live voice chat (bidirectional) | Yes - live conversation audio |
| `src/hooks/useGuidedWalkthrough.ts` | Guided mode state machine | No - state only |
| `src/components/ai-adjudicator/GuidedModeLayout.tsx` | Guided mode UI | Indirectly - triggers parent handlers |
| `supabase/functions/chat-with-actions/index.ts` | LLM prompts for text chat | No - text only |
| `supabase/functions/realtime-session/index.ts` | LLM prompts for voice chat | No - configures AI instructions |

### Dependency Graph

```text
GuidedModeLayout
    │
    ├── onNextStep() ──────────► AIAdjudicator.handleSend()
    │                                   │
    │                                   ├── stopSpeaking() [useWebRTCSpeech]
    │                                   ├── realtimeChatRef.disconnect() [RealtimeChat]
    │                                   └── speakResponse() [useWebRTCSpeech]
    │
    ├── onStartRealtime() ─────► AIAdjudicator.startRealtimeChat()
    │                                   │
    │                                   └── new RealtimeChat().init()
    │
    └── onEndRealtime() ───────► AIAdjudicator.endRealtimeChat()
                                        │
                                        └── realtimeChatRef.disconnect()
```

---

## Phase 3: Implementation Checklist

### Step 1: Audio Source Locking (Prevents double audio)
- [ ] Add `audioSourceRef` to track which source is active: `'none' | 'webrtc-tts' | 'realtime-chat'`
- [ ] Before starting any audio, check and cleanup the other source
- [ ] Log source transitions for debugging

### Step 2: Formalize Next Button Flow
- [ ] Next button ALWAYS: stops all audio, then requests step, then speaks via WebRTC
- [ ] Verify `shouldSpeak=true` is honored regardless of state race conditions
- [ ] Add 50ms debounce to prevent double-clicks

### Step 3: Prevent "DO THIS NOW" from being spoken
- [ ] In `useWebRTCSpeech.speakText()`, strip the marker before sending to WebRTC
- [ ] Pattern: `text.replace(/\*\*DO THIS NOW:\*\*\s*/gi, '').replace(/DO THIS NOW:\s*/gi, '')`

### Step 4: Add Regression Tests
- [ ] Test: "Next button after voice chat disconnects voice before speaking"
- [ ] Test: "Voice button stops TTS before connecting"
- [ ] Test: "Only one audio source active at a time"

### Step 5: Update LLM Prompts for Consistency
- [ ] Ensure `chat-with-actions` and `realtime-session` both generate consistent step format
- [ ] Both should use identical `**DO THIS NOW:**` and `**UP NEXT:**` markers

---

## Phase 4: Acceptance Criteria

For each change, verify:

1. **No double audio** - Only one stream playing at any time
2. **Next button works** - Step 2 audio plays after pressing Next from Step 1
3. **Voice questions work** - Can ask a question mid-walkthrough without advancing steps
4. **Audio stops cleanly** - Stop button and toggle actually stop audio
5. **State stays synchronized** - UI card matches what was just spoken

---

## Technical Details

### useWebRTCSpeech Hook Enhancement

Add text preprocessing to strip UI markers:

```typescript
const speakText = useCallback(async (text: string, instructions?: string): Promise<void> => {
  // Strip UI parsing markers that shouldn't be spoken
  const cleanedText = text
    .replace(/\*\*DO THIS NOW:\*\*\s*/gi, '')
    .replace(/DO THIS NOW:\s*/gi, '')
    .replace(/\*\*UP NEXT:\*\*\s*/gi, 'Up next: ')
    .replace(/UP NEXT:\s*/gi, 'Up next: ')
    .replace(/Press Next when.*$/gi, ''); // Remove UI instruction

  if (!cleanedText.trim()) return;
  // ... rest of implementation
}, []);
```

### Audio Source Lock Pattern

```typescript
type AudioSource = 'none' | 'webrtc-tts' | 'realtime-chat';
const audioSourceRef = useRef<AudioSource>('none');

const acquireAudioLock = async (source: AudioSource) => {
  const current = audioSourceRef.current;
  if (current === source) return true; // Already have lock

  // Cleanup current source
  if (current === 'webrtc-tts') {
    stopSpeaking();
  } else if (current === 'realtime-chat') {
    realtimeChatRef.current?.disconnect();
    realtimeChatRef.current = null;
    setIsRealtimeConnected(false);
  }

  // Small delay to ensure cleanup
  await new Promise(r => setTimeout(r, 50));
  audioSourceRef.current = source;
  return true;
};
```

---

## Summary

This plan creates:
1. **A specification** - What should happen in every scenario
2. **A dependency map** - Which files affect which behaviors
3. **A checklist** - Incremental steps with clear acceptance criteria
4. **Test patterns** - How to verify each change doesn't break others

With this foundation, every future change can be validated against the spec, preventing the "whack-a-mole" regression cycle.
