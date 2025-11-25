# Phase 17: Public House Rules Discovery & Browsing

## Overview
Creating a comprehensive public house rules discovery system where users can browse, search, filter, and save community-created rule sets.

## Features to Implement

### 1. Public House Rules Browse Page
- Grid/list view of public rule sets
- Search functionality (by rule set name, game)
- Filter by game type
- Sort by: Popularity (save count), Most Recent, Alphabetical
- "Save to My Rules" functionality

### 2. Rule Set Display
- Display rule set name, game, creator
- Show number of saves (popularity indicator)
- Preview rules in the card
- "View Full Rules" modal
- "Save/Fork" action button

### 3. Save/Fork System
- One-click save creates copy in user's house rules
- Increments save_count on original
- User can edit their forked version
- Attribution to original creator (optional)

### 4. Discovery Features
- "Trending" section (most saves in last 30 days)
- "Popular" section (highest save count)
- "Recent" section (newly published)
- Game-specific browsing

### 5. Navigation Integration
- Link from main menu (already exists)
- Link from House Rules page ("Browse Public Rules")
- Link from tournament creation (optional rules)

## Database Usage
Existing structure:
- `house_rule_sets` table with `is_public`, `save_count`
- `house_rules` table for individual rules
- RLS policies already allow public viewing

## User Experience Flow
1. User navigates to Public House Rules
2. Browses by game or searches
3. Views rule set details
4. Clicks "Save to My Rules"
5. System creates copy in user's house rules
6. User can edit their version

## Components to Create
- `PublicHouseRules.tsx` page (already exists as stub)
- `PublicRuleSetCard.tsx` - Display public rule set
- `RuleSetDetailModal.tsx` - Full rule details
- `usePublicHouseRuleSets.ts` hook (already exists)
- Filter and search components

## Next Phase Preview
Phase 18 will focus on Game Requests completion and scheduling.
