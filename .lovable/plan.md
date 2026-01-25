

# Guided Mode Feedback Fix - Diagnosis & Implementation Plan

## Problem Summary

The Guided Mode walkthrough fails to show the **Next Step card** after the initial game response because Step 1 is never parsed and added to state.

---

## Root Cause Analysis

### The Core Bug

In `AIAdjudicator.tsx` lines 282-290:

```typescript
// TASK 6: Detect if this is a "Next" command vs a question
const isNextCommand = messageToSend.toLowerCase().trim() === 'next';

if (isNextCommand) {
  // This is a step advancement - parse and add step
  const parsedStep = parseStepFromResponse(aiResponse);
  if (parsedStep) {
    guidedWalkthrough.addStep(parsedStep);
  }
}
```

**The issue:** The FIRST response (when user says "Guide me through UNO") is NOT a "next" command, so `parseStepFromResponse()` is never called. Step 1 exists in the AI response but is never extracted and added to `guidedWalkthrough.steps[]`.

Result: `currentStep` stays `null`, and the Next Step card shows the placeholder forever.

### What Should Happen

When the user says "Guide me through UNO":

1. LLM returns: Orientation + Step 1 (with `**DO THIS NOW:**`)
2. App parses the response and extracts Step 1
3. App calls `guidedWalkthrough.addStep(step1)`
4. Next Step card displays `step1.summary`

### What Currently Happens

1. LLM returns: Orientation + Step 1 (with `**DO THIS NOW:**`)
2. App adds response to transcript ✓
3. App checks if message was "next" → NO, so skips step parsing ✗
4. No step added, `currentStep` = null
5. Next Step card shows "Preparing your next step..." forever

---

## Implementation Plan

### Task 1: Parse Step 1 from Initial Response

**File:** `src/components/AIAdjudicator.tsx`

**Change:** Detect game-start requests AND "next" commands as step-producing messages.

```typescript
// In handleSend callback (around line 281):
if (activeMode === 'guided' && aiResponse) {
  // Add AI response to transcript
  const messageId = guidedWalkthrough.addToTranscript('assistant', aiResponse);
  
  // Detect if this message should produce a step:
  // 1. "Next" command - advance to next step
  // 2. Game-start request - initial response contains Step 1
  // 3. Skip/navigation commands that produce new steps
  const lowerMessage = messageToSend.toLowerCase().trim();
  const isNextCommand = lowerMessage === 'next';
  const isGameStartRequest = lowerMessage.includes('guide') || 
                             lowerMessage.includes('walk') ||
                             lowerMessage.includes('teach') ||
                             lowerMessage.includes('show me');
  const isNavigationCommand = ['skip', 'go back', 'restart', 'previous'].some(
    cmd => lowerMessage.includes(cmd)
  );
  
  // Check if the AI response contains a step (has "DO THIS NOW:")
  const hasStepMarker = aiResponse.includes('DO THIS NOW:') || 
                        aiResponse.includes('**DO THIS NOW:**');
  
  if ((isNextCommand || isGameStartRequest || isNavigationCommand) && hasStepMarker) {
    const parsedStep = parseStepFromResponse(aiResponse);
    if (parsedStep) {
      console.log('[GuidedMode] Adding step:', parsedStep.title);
      guidedWalkthrough.addStep(parsedStep);
    }
  }
  // For questions without step markers, step is NOT changed
  
  // Speak if needed...
}
```

### Task 2: Improve Step Detection Logic

**File:** `src/hooks/useGuidedWalkthrough.ts`

**Change:** Make `parseStepFromResponse()` more robust and add a helper to check if a response contains a step.

```typescript
/**
 * Checks if an AI response contains a step (DO THIS NOW pattern)
 */
export function responseContainsStep(content: string): boolean {
  return /\*\*DO THIS NOW:\*\*/i.test(content);
}

/**
 * Parses AI response into structured step format.
 * Only returns a step if the response contains the DO THIS NOW marker.
 */
export function parseStepFromResponse(content: string): GuidedStep | null {
  // Only proceed if this looks like a step response
  if (!responseContainsStep(content)) {
    return null;
  }
  
  // Existing parsing logic...
}
```

### Task 3: Handle Orientation vs Step Separation

**File:** `src/hooks/useGuidedWalkthrough.ts`

**Change:** Add ability to detect and separate orientation content from step content for better transcript display.

```typescript
/**
 * Extracts orientation content (everything before the first step)
 */
export function extractOrientation(content: string): string | null {
  const stepStart = content.search(/\*\*[^*]*(?:Setup|Step|First)/i);
  if (stepStart > 100) { // Only if there's substantial content before the step
    return content.substring(0, stepStart).trim();
  }
  return null;
}
```

### Task 4: Update Backend Prompt Clarity

**File:** `supabase/functions/chat-with-actions/index.ts`

**Change:** Make the prompt more explicit about ALWAYS producing Step 1 after orientation.

Update around line 403-411:

```text
3️⃣ **THE FIRST STEP** (MANDATORY - NEVER SKIP!)

You MUST include this section in your FIRST response:

**Setup – [Specific Title]**

**DO THIS NOW:** [One specific physical action - this is REQUIRED]

**UP NEXT:** [Preview of next action]

*Press Next when you're ready to continue.*

⚠️ If you do NOT include "**DO THIS NOW:**" in your first response, 
   the walkthrough will not start. This is a hard requirement.
```

### Task 5: Add Step State Logging for Debugging

**File:** `src/components/ai-adjudicator/GuidedModeLayout.tsx`

**Change:** Add console logging to help debug state issues.

```typescript
// Add near the top of the component
useEffect(() => {
  console.log('[GuidedModeLayout] Step state:', {
    currentStep: currentStep?.title || 'null',
    stepIndex,
    totalSteps,
    transcriptLength: transcript.length,
    isComplete
  });
}, [currentStep, stepIndex, totalSteps, transcript.length, isComplete]);
```

---

## Implementation Order

```text
Task 1: Fix step parsing for initial response (AIAdjudicator.tsx)
   └── This is the critical fix - enables Step 1 to be captured

Task 2: Add responseContainsStep helper (useGuidedWalkthrough.ts)
   └── Makes detection logic reusable and clear

Task 3: Add orientation extraction (useGuidedWalkthrough.ts)
   └── Future enhancement for cleaner transcript

Task 4: Strengthen backend prompt (chat-with-actions/index.ts)
   └── Reduces chance of LLM not producing Step 1

Task 5: Add debug logging (GuidedModeLayout.tsx)
   └── Helps verify the fix and catch future issues
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/AIAdjudicator.tsx` | Detect game-start requests as step-producing messages |
| `src/hooks/useGuidedWalkthrough.ts` | Add `responseContainsStep()` helper; improve `parseStepFromResponse()` |
| `supabase/functions/chat-with-actions/index.ts` | Strengthen prompt to enforce Step 1 |
| `src/components/ai-adjudicator/GuidedModeLayout.tsx` | Add debug logging |

---

## Testing Checklist

After implementation:
- [ ] Say "Guide me through UNO" → Orientation appears in transcript AND Step 1 appears in Next Step card
- [ ] Say "Guide me through Go Fish" → Same behavior
- [ ] Press Next → Step 2 appears
- [ ] Ask a question → Answer in transcript, step doesn't change
- [ ] Toggle mic → Transcript preserved, step preserved
- [ ] Next Step card shows SHORT summary (max 60 chars), not full instruction

---

## Technical Details

### Why the Current Logic is Wrong

The original Task 6 implementation said "only parse steps on 'Next' command" to prevent questions from accidentally advancing steps. This is correct for questions BUT incorrect for the initial game start.

The fix: Also detect game-start patterns (`guide`, `walk`, `teach`) as step-producing.

### Why Check for `hasStepMarker`

Not all responses produce steps:
- Questions: "How many cards do I deal?" → No step marker
- Next command: "Next" → Has `**DO THIS NOW:**`
- Game start: "Guide me through UNO" → Has `**DO THIS NOW:**`

By requiring the step marker, we ensure questions don't accidentally create steps.

