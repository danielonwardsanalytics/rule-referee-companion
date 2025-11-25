# Phase 18: Game Requests System Enhancement

## Overview
Completing the game requests feature with full accept/decline functionality, enhanced UI, and integration with the friends system.

## Features to Implement

### 1. Enhanced Game Requests Page
- Separate tabs for Received and Sent requests
- Accept/Decline functionality for received requests
- Cancel option for sent requests
- Real-time status updates
- Request history with timestamps

### 2. Request Creation Flow
- Send game requests to friends from Friends page
- Send requests from tournament context
- Include optional message with request
- Game selection in request

### 3. Request Management
- Mark requests as accepted/declined
- Update request status in database
- Notification system for new requests
- Badge counters for pending requests

### 4. Navigation Integration
- Add request counter badge in menu
- Link from Friends page to send requests
- Quick actions from friend cards

### 5. UI/UX Improvements
- Game-specific styling with accent colors
- Friend profile display in requests
- Timestamp and status indicators
- Empty states for no requests

## Database Structure
Existing:
- `game_requests` table with status enum (pending/accepted/declined)
- Foreign keys to games and users
- Optional message field
- RLS policies for viewing own requests

## User Experience Flow
### Sending Request:
1. User goes to Friends page or Game Requests
2. Selects friend and game
3. Optionally adds message
4. Submits request

### Receiving Request:
1. User sees notification badge
2. Opens Game Requests page
3. Reviews request details
4. Accepts or declines
5. Status updates for both users

## Components to Create/Update
- `GameRequests.tsx` page enhancement
- `SendRequestModal.tsx` component
- `GameRequestCard.tsx` component
- Badge counter in navigation
- Friend card quick actions

## Next Phase Preview
Phase 19 will focus on Stripe payment integration for premium subscriptions.
