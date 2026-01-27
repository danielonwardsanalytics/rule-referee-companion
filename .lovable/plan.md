# Audio & Guided Mode - Full Functional Audit and Specification

## Implementation Status: ✅ COMPLETE

Last updated: 2026-01-27

---

## Summary of Changes Made

### 1. Audio Source Locking (Prevents double audio) ✅
- Added `audioSourceRef` to track which audio source is active: `'none' | 'webrtc-tts' | 'realtime-chat'`
- Implemented `acquireAudioLock()` function that:
  - Cleans up the previous audio source before switching
  - Adds 50ms delay for cleanup to complete
  - Logs all source transitions for debugging
- Implemented `releaseAudioLock()` function
- **File:** `src/components/AIAdjudicator.tsx`

### 2. Formalized Next Button Flow ✅
- Next button now calls `handleSend(stepContext, true)` with explicit `shouldSpeak=true`
- `handleSend` acquires TTS lock first when `willSpeak` is true, which automatically cleans up any active realtime chat
- Removed manual cleanup code from Next button handler (now handled by lock pattern)
- **File:** `src/components/AIAdjudicator.tsx`

### 3. Strip UI Markers from Speech ✅
- Enhanced `useWebRTCSpeech.speakText()` to strip UI parsing markers before sending to WebRTC
- Stripped patterns:
  - `**DO THIS NOW:**` and variants → removed (silent)
  - `**UP NEXT:**` and variants → replaced with "Up next: "
  - `*Press Next when...*/` → removed (italic instruction)
  - `Press Next when...` at end of lines → removed
- Returns early if cleaned text is empty
- **File:** `src/hooks/useWebRTCSpeech.ts`

### 4. LLM Prompts Consistency ✅
- Verified both `chat-with-actions` and `realtime-session` edge functions use identical step format:
  - `**DO THIS NOW:** [instruction]`
  - `**UP NEXT:** [preview]`
  - `Press Next when ready.`
- No changes needed - prompts were already consistent

---

## Technical Architecture

### Audio Source Rules (Unified WebRTC)

| Trigger | Audio Source | Expected Behavior |
|---------|--------------|-------------------|
| **Voice Button (all modes)** | WebRTC (RealtimeChat) | Live bidirectional voice - AI speaks through WebRTC stream |
| **Next Button (Guided Mode)** | WebRTC (useWebRTCSpeech) | Text-to-speech via WebRTC - AI reads instruction aloud |
| **Text Send with Audio ON** | WebRTC (useWebRTCSpeech) | AI response spoken via WebRTC after text response arrives |
| **Text Send with Audio OFF** | None | No audio output |

**Critical Rule**: Only ONE audio source may be active at any time. The `acquireAudioLock()` function enforces this.

### Audio Lock Pattern

```typescript
type AudioSource = 'none' | 'webrtc-tts' | 'realtime-chat';
const audioSourceRef = useRef<AudioSource>('none');

const acquireAudioLock = async (source: AudioSource): Promise<boolean> => {
  const current = audioSourceRef.current;
  if (current === source && source !== 'none') return true;
  
  // Cleanup current source
  if (current === 'webrtc-tts') stopSpeaking();
  else if (current === 'realtime-chat') { /* disconnect */ }
  
  await new Promise(r => setTimeout(r, 50));
  audioSourceRef.current = source;
  return true;
};
```

### Files Modified

| File | Changes |
|------|---------|
| `src/components/AIAdjudicator.tsx` | Audio source locking, Next button flow, endRealtimeChat lock release |
| `src/hooks/useWebRTCSpeech.ts` | Strip UI markers before speaking |

---

## Acceptance Criteria Checklist

- [x] **No double audio** - Only one stream playing at any time (enforced by lock)
- [x] **Next button works** - Step 2 audio plays after pressing Next from Step 1
- [x] **Voice questions work** - Can ask a question mid-walkthrough without advancing steps
- [x] **Audio stops cleanly** - Stop button acquires 'none' lock to stop audio
- [x] **State stays synchronized** - UI card matches what was just spoken

---

## Dependency Graph (Updated)

```text
GuidedModeLayout
    │
    ├── onNextStep() ──────────► AIAdjudicator.handleSend(stepContext, true)
    │                                   │
    │                                   ├── acquireAudioLock('webrtc-tts')
    │                                   │       └── stops any active realtime chat
    │                                   └── speakResponse() [useWebRTCSpeech]
    │
    ├── onStartRealtime() ─────► AIAdjudicator.startRealtimeChat()
    │                                   │
    │                                   ├── acquireAudioLock('realtime-chat')
    │                                   │       └── stops any active TTS
    │                                   └── new RealtimeChat().init()
    │
    ├── onEndRealtime() ───────► AIAdjudicator.endRealtimeChat()
    │                                   │
    │                                   ├── disconnect()
    │                                   └── releaseAudioLock()
    │
    └── onStopSpeaking() ──────► acquireAudioLock('none')
                                        └── stops all audio, releases lock
```

---

## Original Specification (for reference)

### Phase 1: Functional Specification Document

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
