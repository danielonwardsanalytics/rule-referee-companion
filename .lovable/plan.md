

# Guided Mode Alignment Plan

## Summary

This plan aligns the existing Guided Mode implementation with your detailed specification. The core architecture is sound, but several key behaviors need refinement around state management, UI hierarchy, confirmation flows, and audio orchestration.

---

## Current State Analysis

### What's Already In Place
- `useGuidedWalkthrough` hook with state machine (`idle`, `planning`, `in_step`, `answering_question`, `complete`)
- `GuidedStep` interface with `title`, `summary`, `detail`, `speakText`, `upNext`
- Transcript management with `addToTranscript`, `clearTranscript`
- TTS double-speak prevention via `spokenMessageIdsRef`
- Backend prompts with scope filter and step structure (`DO THIS NOW`, `UP NEXT`)

### What Needs Fixing

| Issue | Current Behavior | Required Behavior |
|-------|-----------------|-------------------|
| Transcript wiping | `realtimeMessages` cleared on disconnect | Persist transcript across mic toggles |
| Next Step card content | Uses parsed AI response | Derive ONLY from `currentStep.summary` |
| Questions change steps | Can reset state | Questions append to transcript only, never change stepIndex |
| No confirmation on exit | Mode switches instantly | Show confirmation popup |
| Mic behavior | Sometimes stays on | Auto OFF after instruction delivery |
| Missing End Guided Mode button | Not present | Required with confirmation |
| No Stop Feedback button always visible | Only shows when speaking | Should appear during any audio |

---

## Implementation Tasks

### Task 1: Fix Transcript Persistence

**File:** `src/components/AIAdjudicator.tsx`

Problem: The transcript uses two separate arrays (`messages` from text chat, `realtimeMessages` from voice) which are merged for display but managed independently. When `endRealtimeChat` is called, messages can be lost.

**Changes:**
1. Use `guidedWalkthrough.transcript` as the single source of truth in Guided Mode
2. When messages arrive (text or voice), append to `guidedWalkthrough.addToTranscript()`
3. Pass `guidedWalkthrough.transcript` to `GuidedModeLayout` instead of the merged arrays
4. Remove any code that clears messages on mic toggle

```typescript
// In handleSend callback, after AI responds:
if (activeMode === 'guided') {
  guidedWalkthrough.addToTranscript('user', messageToSend);
  guidedWalkthrough.addToTranscript('assistant', aiResponse);
}

// In realtime message handler:
if (activeMode === 'guided') {
  guidedWalkthrough.addToTranscript('user', transcript);
  // For assistant messages, add on response.audio_transcript.done
}
```

---

### Task 2: Fix Next Step Card to Use State Only

**File:** `src/components/ai-adjudicator/GuidedModeLayout.tsx`

Problem: The Next Step card is currently populated by parsing the last AI message. It should derive exclusively from `currentStep.summary`.

**Changes:**
1. The card already uses `currentStep.summary` and `currentStep.title` (lines 318-330)
2. Ensure the `parseStepFromResponse` correctly extracts short summaries (80 char max)
3. Add validation that `summary` is never the full instruction

**File:** `src/hooks/useGuidedWalkthrough.ts`

**Changes:**
1. Improve `extractSummary()` to be more aggressive about shortening
2. When parsing step, if summary > 80 chars, truncate more aggressively

```typescript
function extractSummary(instruction: string): string {
  // Take just the core action, not the full explanation
  const firstSentence = instruction.split(/[.!?]/)[0].trim();
  const cleaned = firstSentence.replace(/^\*+|\*+$/g, '').trim();
  
  if (cleaned.length <= 60) return cleaned;
  
  // Find a natural break point
  const words = cleaned.split(' ');
  let summary = '';
  for (const word of words) {
    if ((summary + ' ' + word).length > 60) break;
    summary += (summary ? ' ' : '') + word;
  }
  return summary + '...';
}
```

---

### Task 3: Add Confirmation Popup for Exit

**File:** `src/components/ai-adjudicator/GuidedModeLayout.tsx`

Problem: No confirmation when user tries to exit Guided Mode.

**Changes:**
1. Add state for showing exit confirmation: `showExitConfirmation`
2. Replace direct `onModeChange` calls with confirmation trigger
3. Add AlertDialog for confirmation

```tsx
// New state
const [showExitConfirmation, setShowExitConfirmation] = useState(false);
const [pendingMode, setPendingMode] = useState<CompanionMode | null>(null);

// Modified mode change handler
const handleModeChangeRequest = (mode: CompanionMode) => {
  if (hasStartedWalkthrough) {
    setPendingMode(mode);
    setShowExitConfirmation(true);
  } else {
    onModeChange(mode);
  }
};

// Confirmation dialog
<AlertDialog open={showExitConfirmation} onOpenChange={setShowExitConfirmation}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>End Guided Session?</AlertDialogTitle>
      <AlertDialogDescription>
        Your walkthrough progress will be lost. Are you sure?
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={() => {
        onReset();
        if (pendingMode) onModeChange(pendingMode);
      }}>
        Yes, End Session
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

### Task 4: Add Dedicated "End Guided Mode" Button

**File:** `src/components/ai-adjudicator/GuidedModeLayout.tsx`

**Changes:**
1. Replace the "Switch to Normal Game Mode" button with a proper "End Guided Mode" button
2. This button should trigger the confirmation popup
3. Place it at the bottom of the layout, styled distinctly

```tsx
{/* End Guided Mode Button - Always visible */}
<Button
  variant="outline"
  onClick={() => handleModeChangeRequest('hub')}
  className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
>
  <X className="h-4 w-4 mr-2" />
  End Guided Mode
</Button>
```

---

### Task 5: Fix Mic Auto-OFF After Instructions

**File:** `src/components/ai-adjudicator/GuidedModeLayout.tsx`

Problem: The mic behavior needs to be: OFF by default, OFF after instruction delivery, only ON when user explicitly presses it.

**Changes:**
1. In the `useEffect` watching `isSpeaking`, when AI finishes speaking via TTS, ensure mic/realtime is disconnected
2. When "Next" is pressed, force mic OFF before requesting next step
3. Add clear documentation in code about mic lifecycle

```typescript
// Force mic OFF after AI finishes speaking an instruction
useEffect(() => {
  if (wasSpeaking && !isSpeaking) {
    // AI finished speaking via TTS
    console.log("[GuidedMode] Instruction delivered, ensuring mic is OFF");
    if (isRealtimeConnected) {
      onEndRealtime();
    }
  }
  setWasSpeaking(isSpeaking);
}, [isSpeaking, wasSpeaking, isRealtimeConnected, onEndRealtime]);

// Next button handler already forces mic OFF - keep this
const handleNextStep = useCallback(() => {
  setIsAudioEnabled(false);
  if (isRealtimeConnected) {
    onEndRealtime();
  }
  onNextStep();
}, [setIsAudioEnabled, isRealtimeConnected, onEndRealtime, onNextStep]);
```

---

### Task 6: Make Questions NOT Change Steps

**File:** `src/components/AIAdjudicator.tsx`

Problem: Currently, when a user asks a question, the response gets parsed and may create/change steps.

**Changes:**
1. In `handleSend`, detect if this is a "Next" command vs a question
2. Only call `guidedWalkthrough.addStep()` when advancing
3. For questions, just add to transcript without changing steps

```typescript
// In handleSend callback:
if (activeMode === 'guided' && aiResponse) {
  const isNextCommand = messageToSend.toLowerCase().trim() === 'next';
  
  if (isNextCommand) {
    // This is a step advancement - parse and add step
    const parsedStep = parseStepFromResponse(aiResponse);
    if (parsedStep) {
      guidedWalkthrough.addStep(parsedStep);
    }
  } else {
    // This is a question - just add to transcript, don't change steps
    // After answering, the prompt tells AI to restate current step
  }
}
```

---

### Task 7: Update Backend Prompt for Question Handling

**File:** `supabase/functions/chat-with-actions/index.ts`

Problem: The prompt needs to explicitly instruct the AI to restate the current step after answering questions.

**Changes:**
1. Add instruction to restate current step after Q&A
2. Add instruction to end answers with "Press Next when ready"

Update the `buildGuidedPrompt` function:

```text
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HANDLING QUESTIONS (CRITICAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When users ask questions (anything other than "Next"):
1. Answer the question clearly and concisely
2. Do NOT use "DO THIS NOW:" format - this is NOT a new step
3. Do NOT change or advance the walkthrough
4. After answering, briefly remind them of the current step:
   "When you're ready, continue with: [brief current action]."
5. End with: "Press Next to continue."

Example Q&A response:
"Good question! In Go Fish, if you run out of cards during your turn, you draw 5 cards from the pond and continue playing.

When you're ready, continue with: asking another player for a card.

Press Next to continue."
```

---

### Task 8: Improve Initial State UI

**File:** `src/components/ai-adjudicator/GuidedModeLayout.tsx`

Problem: The initial state should show a friendly prompt in the Next Step card.

**Changes:**
1. When no walkthrough started, show placeholder in Next Step card:
   "Tell me which game you want me to guide you through"
2. Transcript area should be smaller initially, expand when content arrives

The current implementation already does this (lines 366-369), but verify it matches your spec:

```tsx
{/* Default placeholder in Next Step card */}
{!hasStartedWalkthrough && !currentStep && (
  <p className="text-sm text-muted-foreground text-center py-2">
    Tell me which game you want me to guide you through.
  </p>
)}
```

---

### Task 9: Add Game Complete State with "Start New Game" Button

**File:** `src/components/ai-adjudicator/GuidedModeLayout.tsx`

Problem: When walkthrough completes, need "Start New Game" button instead of Next/Prev.

The current implementation already handles this (lines 294-314), but verify the button text matches:

```tsx
{isComplete ? (
  <div className="text-center space-y-3">
    <h4 className="font-semibold text-foreground">🎉 Game Complete!</h4>
    <p className="text-sm text-muted-foreground">
      Would you like to play again or try a different game?
    </p>
    <div className="flex gap-2 justify-center">
      <Button onClick={onReset} variant="outline">
        <RotateCcw className="h-4 w-4 mr-2" />
        Start New Game
      </Button>
      <Button onClick={() => handleModeChangeRequest('hub')}>
        Exit Guided Mode
      </Button>
    </div>
  </div>
) : ...}
```

---

### Task 10: Ensure Stop Feedback Button is Prominent

**File:** `src/components/ai-adjudicator/GuidedModeLayout.tsx`

The Stop button exists (lines 188-205), but ensure it:
1. Appears whenever TTS is active
2. Stops both TTS audio and any streaming
3. Is styled prominently (current implementation looks good)

---

## Technical Details: State Machine Flow

```text
┌──────────────────────────────────────────────────────────────┐
│                    GUIDED MODE STATE MACHINE                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [User presses "Guided" mode button]                         │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────┐                                            │
│  │    IDLE      │ ← "Tell me which game..."                  │
│  └──────┬───────┘                                            │
│         │ User says "Guide me through Go Fish"               │
│         ▼                                                    │
│  ┌──────────────┐                                            │
│  │   PLANNING   │ ← AI gives orientation + Step 1            │
│  └──────┬───────┘                                            │
│         │ First step parsed and added                        │
│         ▼                                                    │
│  ┌──────────────┐                                            │
│  │   IN_STEP    │◄─────────────────────────┐                 │
│  └──────┬───────┘                          │                 │
│         │                                  │                 │
│    ┌────┴────────────────┐                 │                 │
│    │                     │                 │                 │
│    ▼                     ▼                 │                 │
│ [User asks    [User presses Next]          │                 │
│  question]          │                      │                 │
│    │                ▼                      │                 │
│    ▼         stepIndex++                   │                 │
│ ┌──────────┐  Request next step            │                 │
│ │ANSWERING │  from AI                      │                 │
│ │QUESTION  │        │                      │                 │
│ └────┬─────┘        ▼                      │                 │
│      │       Parse step, add to steps[]    │                 │
│      │              │                      │                 │
│      └──────────────┴──────────────────────┘                 │
│                                                              │
│    [Last step reached + Next pressed]                        │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────┐                                            │
│  │   COMPLETE   │ ← "Start New Game" shown                   │
│  └──────────────┘                                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useGuidedWalkthrough.ts` | Improve `extractSummary()` to enforce 60-char max |
| `src/components/AIAdjudicator.tsx` | Fix transcript to use unified store; detect Next vs question |
| `src/components/ai-adjudicator/GuidedModeLayout.tsx` | Add exit confirmation dialog; add "End Guided Mode" button; improve initial placeholder |
| `supabase/functions/chat-with-actions/index.ts` | Update `buildGuidedPrompt` to handle questions better |
| `supabase/functions/realtime-session/index.ts` | Update `buildGuidedVoiceInstructions` similarly |

---

## Testing Checklist

After implementation:
- [ ] Enter Guided Mode → see placeholder in Next Step card
- [ ] Ask "Guide me through Go Fish" → get orientation + Step 1 immediately
- [ ] Next Step card shows short summary only (not full text)
- [ ] Transcript shows full detailed instructions
- [ ] Ask a question mid-step → answer appears, step doesn't change
- [ ] Toggle mic on/off → transcript preserved
- [ ] Press Next → advance to next step, mic stays OFF
- [ ] Press "End Guided Mode" → confirmation popup appears
- [ ] Confirm exit → returns to Hub mode
- [ ] Cancel exit → stays in Guided mode
- [ ] Complete walkthrough → see "Start New Game" button
- [ ] No double audio during any flow

