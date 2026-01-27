# Guided Mode - Design & Implementation Reference

## Purpose

Guided Mode is a **step-by-step game facilitator** that works for ANY game (card games, board games, strategy games). It guides players from setup through gameplay with actionable instructions and contextual tips.

---

## User Flow

1. **Mode Selection** → User selects "Guided" from the 2x2 mode grid
2. **Game Identification** → User requests a game (e.g., "Guide me through Monopoly")
   - If game is unclear, AI asks clarifying questions before proceeding
   - AI must establish which game before generating steps
3. **Orientation + Step Plan** → AI returns:
   - Brief overview (gist, win condition, turn rhythm)
   - Pre-computed step sequence for setup AND gameplay
   - First actionable instruction (Step 1)
4. **Step Execution** → User performs the instruction
5. **Next Progression** → User presses "Next" to advance
   - Each step includes gameplay tips/understanding in transcript
   - Next Step card shows ONLY the simple instruction
6. **Q&A (optional)** → User can ask questions without advancing steps
7. **Completion** → AI confirms game is set up and ready to play

---

## State Machine

```
idle → planning → in_step ↔ answering_question → complete
```

- `idle`: No walkthrough active
- `planning`: AI is generating orientation + step plan
- `in_step`: User is on an active step
- `answering_question`: User asked a question (step preserved)
- `complete`: Walkthrough finished

---

## LLM Response Contract

### Initial Response (Game Start)

When user says "Guide me through [Game]":

1. **ORIENTATION** (for transcript)
   - Gist (1-2 lines)
   - How you win (1 line)
   - Turn rhythm (3-6 bullets)
   - Phases overview

2. **STEP 1** (for Next Step card + transcript)
   - `**DO THIS NOW:**` [Simple actionable instruction]
   - Gameplay tip/context (in transcript only)
   - `**UP NEXT:**` [Preview of next step]

3. **CONTROL**
   - "Press Next when ready"

### Subsequent Steps (On "Next")

- `**DO THIS NOW:**` [Next instruction]
- Gameplay understanding/tips
- `**UP NEXT:**` [Preview]

### Questions

- Answer the question
- Restate current step
- "Press Next to continue"

---

## UI Components

| Component | Content | Max Length |
|-----------|---------|------------|
| Next Step Card | Simple instruction only | 60 chars |
| Transcript | Full orientation + tips + detailed instructions | No limit |
| Up Next Preview | Optional teaser | 40 chars |

---

## Step Detection Logic

The app parses steps when:
1. User sends game-start request (`guide`, `walk`, `teach`, `show me`)
2. User sends "next" command
3. User sends navigation command (`skip`, `go back`, `restart`)

AND the AI response contains `**DO THIS NOW:**` marker.

Questions (no step marker) do NOT advance steps.

---

## Audio Behavior

- Steps are auto-read via TTS
- Mic turns OFF after step is spoken (allows group discussion)
- "Next" button re-enables audio for next step
- "Stop Feedback" button halts speech immediately

---

## Files

| File | Purpose |
|------|---------|
| `src/components/AIAdjudicator.tsx` | Main component, handles send/receive |
| `src/hooks/useGuidedWalkthrough.ts` | State machine + step parsing |
| `src/components/ai-adjudicator/GuidedModeLayout.tsx` | UI layout |
| `supabase/functions/chat-with-actions/index.ts` | Backend prompt |

