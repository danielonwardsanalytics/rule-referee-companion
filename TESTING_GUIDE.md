# Fair Play - Comprehensive Testing Guide

This document outlines all features and testing scenarios for the Fair Play card game companion app.

## 🔐 Authentication & User Management

### Test Scenarios:
1. **Sign Up Flow**
   - [ ] Create new account with email/password
   - [ ] Verify 5-day trial is automatically activated
   - [ ] Check that display name is captured during signup
   - [ ] Verify profile is automatically created
   - [ ] Confirm QR code is generated for new user

2. **Sign In Flow**
   - [ ] Login with existing credentials
   - [ ] Verify session persistence after page refresh
   - [ ] Check redirect to home page after successful login

3. **Sign Out**
   - [ ] Sign out from menu
   - [ ] Verify redirect to auth page
   - [ ] Confirm session is cleared

## 🏠 Home Page

### Test Scenarios:
1. **Hero Section**
   - [ ] Verify hero image loads properly
   - [ ] Check responsive design on mobile/tablet/desktop
   - [ ] Verify gradient overlay and text visibility

2. **Quick Fire Questions**
   - [ ] Test voice chat interface
   - [ ] Ask game-specific questions
   - [ ] Verify AI responses are contextual
   - [ ] Test microphone permissions

3. **My Games Section**
   - [ ] Add games to collection
   - [ ] Hide/unhide games
   - [ ] Remove games from collection
   - [ ] Verify visibility toggle works

4. **Popular Games**
   - [ ] Verify 4 games with images display
   - [ ] Click on game card navigates to detail page
   - [ ] Check game card hover animations

## 🏆 Tournaments

### Test Scenarios:
1. **Tournament List**
   - [ ] View all user's tournaments
   - [ ] Filter by active/inactive status
   - [ ] See tournament cards with game info
   - [ ] Verify empty state when no tournaments

2. **Create Tournament**
   - [ ] Select game from list
   - [ ] Enter tournament name
   - [ ] Optionally attach house rules set
   - [ ] Create tournament successfully
   - [ ] Verify free users limited to 1 active tournament per game

3. **Tournament Detail Page**
   - [ ] View tournament name (editable by admin)
   - [ ] See Quick Fire Questions section
   - [ ] View leaderboard/standings
   - [ ] Add players (name, QR code, email invite)
   - [ ] Record game results
   - [ ] View game history
   - [ ] Edit tournament name (admin only)

4. **Add Players**
   - [ ] Add by display name
   - [ ] Add by QR code scan
   - [ ] Add by email invite (7-day expiry)
   - [ ] Add friend from friends list

5. **Record Game Results**
   - [ ] Select winner from players
   - [ ] Add optional notes
   - [ ] Verify points/wins updated
   - [ ] Check leaderboard position recalculated

6. **Invitations**
   - [ ] Send email invite
   - [ ] Verify 7-day expiration
   - [ ] Auto-accept on signup
   - [ ] View pending invitations banner

## 📋 House Rules

### Test Scenarios:
1. **My House Rules**
   - [ ] View all rule sets grouped by game
   - [ ] Create new rule set
   - [ ] Only one active rule set per game
   - [ ] Edit rule set name
   - [ ] Add/edit/delete individual rules
   - [ ] Toggle rule set active status

2. **Create Rule Set**
   - [ ] Select game
   - [ ] Enter rule set name
   - [ ] Add multiple rules
   - [ ] Reorder rules (sort_order)
   - [ ] Verify premium feature gate

3. **Edit Rule Set**
   - [ ] Update rule set name
   - [ ] Add new rules
   - [ ] Edit existing rules
   - [ ] Delete rules
   - [ ] Track last edited timestamp
   - [ ] Toggle public/private status

4. **Public Rule Sets**
   - [ ] View popular public rules (50+ saves)
   - [ ] Filter by game
   - [ ] Save/fork public rule set
   - [ ] Increment save_count on save

## 👥 Friends

### Test Scenarios:
1. **Add Friends**
   - [ ] Send friend request by email
   - [ ] Scan QR code to add friend
   - [ ] Manual friend code entry
   - [ ] Verify 7-day invitation expiry

2. **Friend Requests**
   - [ ] View incoming requests
   - [ ] Accept friend request
   - [ ] Reject friend request
   - [ ] View outgoing requests
   - [ ] Cancel outgoing request

3. **Friends List**
   - [ ] View all friends
   - [ ] Remove friend
   - [ ] See friend's display name
   - [ ] Quick add to tournament

## 🎮 Game Requests

### Test Scenarios:
1. **Submit Request**
   - [ ] Enter game name (required)
   - [ ] Add description (optional)
   - [ ] Add reason (optional)
   - [ ] Submit successfully
   - [ ] Verify form validation

2. **View Requests**
   - [ ] See all user's requests
   - [ ] View status badges (pending/approved/rejected)
   - [ ] Read admin notes when available
   - [ ] See submission date

## 🔒 Premium Features

### Test Scenarios:
1. **Trial Period**
   - [ ] Verify 5-day trial on signup
   - [ ] See days remaining banner
   - [ ] Access all premium features during trial
   - [ ] Auto-convert to free after trial ends

2. **Premium Gate**
   - [ ] Block house rules for free users
   - [ ] Block multiple tournaments for free users
   - [ ] Show upgrade prompts
   - [ ] Allow trial users full access

3. **Upgrade Flow**
   - [ ] Open upgrade modal
   - [ ] View pricing information
   - [ ] See feature comparison
   - [ ] (Payment integration TBD)

## ⚙️ Settings

### Test Scenarios:
1. **Theme Settings**
   - [ ] Switch to light mode
   - [ ] Switch to dark mode
   - [ ] System theme preference
   - [ ] Verify theme persists after refresh

2. **QR Code**
   - [ ] View personal QR code
   - [ ] Download QR code
   - [ ] Share QR code

3. **Profile**
   - [ ] View email
   - [ ] View subscription status
   - [ ] See trial expiry date
   - [ ] View premium badge if applicable

## 🎤 Voice Chat Features

### Test Scenarios:
1. **General Chat (Home)**
   - [ ] Start voice recording
   - [ ] Stop recording
   - [ ] Get AI response for any game
   - [ ] Verify text-to-speech response
   - [ ] Test error handling

2. **Context-Aware Chat (Tournament)**
   - [ ] Ask game-specific questions
   - [ ] Verify context includes tournament game
   - [ ] Test command parsing ("Mike won")
   - [ ] Premium vs free feature restrictions

## 📱 QR Code Features

### Test Scenarios:
1. **QR Code Display**
   - [ ] View personal QR code in settings
   - [ ] QR code contains user ID
   - [ ] QR code is scannable

2. **QR Code Scanning**
   - [ ] Scan friend's QR code
   - [ ] Scan to add tournament player
   - [ ] Manual code entry fallback
   - [ ] Camera permissions handling

## 🎨 Design & UX

### Test Scenarios:
1. **Responsive Design**
   - [ ] Test on mobile (320px - 767px)
   - [ ] Test on tablet (768px - 1023px)
   - [ ] Test on desktop (1024px+)
   - [ ] Verify bottom navigation on mobile

2. **Animations**
   - [ ] Page transitions (fade-in)
   - [ ] Hover effects (scale)
   - [ ] Loading states
   - [ ] Empty states

3. **Accessibility**
   - [ ] Skip link functionality
   - [ ] Keyboard navigation
   - [ ] ARIA labels on sections
   - [ ] Screen reader compatibility

4. **Theme Consistency**
   - [ ] All colors use semantic tokens
   - [ ] Gradients render properly
   - [ ] Game-specific accent colors
   - [ ] Shadow effects

## 🔒 Security

### Test Scenarios:
1. **Row Level Security**
   - [ ] Users can only see their own data
   - [ ] Tournament admins can manage tournaments
   - [ ] Premium checks server-side
   - [ ] Friend requests properly scoped

2. **Input Validation**
   - [ ] Form validation on all inputs
   - [ ] SQL injection prevention (via Supabase)
   - [ ] XSS prevention
   - [ ] Length limits enforced

## 🐛 Error Handling

### Test Scenarios:
1. **Error Boundary**
   - [ ] Catches React errors
   - [ ] Shows error UI
   - [ ] Allows reset/reload
   - [ ] Logs errors to console

2. **Network Errors**
   - [ ] Offline mode handling
   - [ ] API timeout handling
   - [ ] Toast notifications for errors
   - [ ] Retry mechanisms

3. **Empty States**
   - [ ] No tournaments message
   - [ ] No friends message
   - [ ] No house rules message
   - [ ] No game requests message

## 📊 Performance

### Test Scenarios:
1. **Loading States**
   - [ ] Skeleton loaders where appropriate
   - [ ] Loading spinners with text
   - [ ] Optimistic UI updates

2. **Image Optimization**
   - [ ] Lazy loading for images
   - [ ] Proper alt text
   - [ ] Responsive images

3. **Database Queries**
   - [ ] Efficient RLS policies
   - [ ] Proper indexes
   - [ ] Query optimization

## ✅ Final Checklist

- [ ] All 12+ games seeded in database
- [ ] Auto-confirm email signups enabled
- [ ] All edge functions deployed
- [ ] All migrations applied
- [ ] Security linter warnings addressed
- [ ] No console errors in production
- [ ] All routes properly protected
- [ ] Premium checks working correctly
- [ ] All animations smooth
- [ ] Mobile navigation working
- [ ] Theme switching functional

## 🚀 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Edge functions deployed
- [ ] Frontend published
- [ ] Custom domain configured (if applicable)
- [ ] Analytics setup (if applicable)
- [ ] Error monitoring (if applicable)
- [ ] Performance monitoring (if applicable)

---

**Note**: This is a comprehensive testing guide. Prioritize testing critical user flows first:
1. Auth → Home → Add Game
2. Create Tournament → Add Players → Record Results
3. Create House Rules → Attach to Tournament
4. Premium features and paywalls
