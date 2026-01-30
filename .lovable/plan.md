# Code Cleanup and Consolidation - COMPLETED

Last updated: 2026-01-30

---

## Cleanup Summary

### Batch 1: Deleted Dead Edge Functions ✅
- **Deleted:** `supabase/functions/text-to-speech/` (replaced by WebRTC)
- **Deleted:** `supabase/functions/transcribe-audio/` (replaced by native speech)
- **Deleted:** `supabase/functions/chat/` (superseded by chat-with-actions)
- **Updated:** `supabase/config.toml` to remove deleted function configs

### Batch 2: Consolidated Chat Hooks ✅
- **Migrated:** `ChatInterface.tsx` from `useRealtimeChat` to `useChatWithActions`
- **Deleted:** `src/hooks/useRealtimeChat.ts`

### Batch 3: Created VoiceChatCore Component ✅
- **Created:** `src/components/ai-adjudicator/VoiceChatCore.tsx` - shared voice chat UI
- **Created:** `src/hooks/useAudioLock.ts` - audio source locking hook
- **Refactored:** `VoiceRuleEditor.tsx` to use VoiceChatCore
- **Refactored:** `ChatInterface.tsx` to use VoiceChatCore

### Batch 4: Unified GameCard Variants ✅
- **Consolidated:** `GameCard.tsx` now supports `variant` prop: 'default' | 'circular' | 'compact'
- **Deleted:** `src/components/GameCardCircular.tsx`
- **Deleted:** `src/components/GameCardCompact.tsx`
- **Updated:** `MyGames.tsx` to use `GameCard` with `variant="circular"`

---

## Files Deleted (7 total)
- `supabase/functions/text-to-speech/index.ts`
- `supabase/functions/transcribe-audio/index.ts`
- `supabase/functions/chat/index.ts`
- `src/hooks/useRealtimeChat.ts`
- `src/components/GameCardCircular.tsx`
- `src/components/GameCardCompact.tsx`

## Files Created (2 total)
- `src/components/ai-adjudicator/VoiceChatCore.tsx`
- `src/hooks/useAudioLock.ts`

## Files Modified
- `supabase/config.toml`
- `src/components/ChatInterface.tsx`
- `src/components/house-rules/VoiceRuleEditor.tsx`
- `src/components/GameCard.tsx`
- `src/components/MyGames.tsx`

---

## Architecture After Cleanup

### Edge Functions (Remaining)
| Function | Purpose |
|----------|---------|
| `chat-with-actions` | Primary chat with tool calling |
| `execute-action` | Execute confirmed actions |
| `realtime-session` | WebRTC session token |
| `parse-rule-command` | Voice rule editing |
| `check-subscription` | Stripe subscription |
| `check-trial-expiry` | Trial validation |
| `create-checkout` | Stripe checkout |
| `customer-portal` | Stripe portal |

### Voice Chat Components
- **VoiceChatCore** - Shared UI (big button, text input, messages)
- **ChatInterface** - Uses VoiceChatCore for game detail pages
- **VoiceRuleEditor** - Uses VoiceChatCore for house rules editing
- **AIAdjudicator** - Has custom implementation for guided mode complexity

### GameCard Component
Single component with variant prop replaces three separate components.
