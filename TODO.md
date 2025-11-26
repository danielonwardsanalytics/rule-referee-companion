# Project To-Do List

## Pending Features

### Payment Integration
- [x] **Stripe Payment Integration** - Subscription flow implemented
  - [x] Created edge functions (create-checkout, check-subscription, customer-portal)
  - [x] Integrated subscription management in UI components
  - [x] Auto-sync subscription status to profiles table
  - [ ] **USER ACTION REQUIRED:** Create Stripe product and update Price ID (see STRIPE_SETUP.md)
  - [ ] **USER ACTION REQUIRED:** Configure Stripe Customer Portal
  - [ ] Test in Stripe Test Mode
  - [ ] Deploy to Live Mode

### Game Requests Enhancement
- [ ] Complete Game Requests page with full CRUD
- [ ] Add accept/decline functionality
- [ ] Add game scheduling features
- [ ] Show notifications for incoming requests

### Premium Features
- [ ] Add trial expiry notifications
- [ ] Create premium features showcase page
- [ ] Add subscription management in Settings

## Future Enhancements
- [ ] Analytics integration (user behavior tracking)
- [ ] Performance optimization (code splitting, lazy loading)
- [ ] Advanced voice chat features (game result parsing via voice)
- [ ] Additional game content and rules
- [ ] Push notifications for game requests and invites
- [ ] Tournament bracket/playoff mode
- [ ] Game statistics and player performance tracking
- [ ] Export tournament results (PDF/CSV)
- [ ] Custom tournament rules and scoring systems
- [ ] Dark/light mode toggle improvements
- [ ] PWA support (offline mode)

## Completed ✅
- ✅ Phase 1-14: Core app functionality
- ✅ Phase 15: Friends system with requests and QR codes
- ✅ Phase 16: Tournament player management (reviewed - already implemented)
- ✅ Phase 17: Public House Rules discovery, search, filter, and save functionality
- ✅ Phase 18: Game Requests system with friend-to-friend invitations
- ✅ Phase 19: Premium subscription infrastructure and gates
- ✅ Phase 20: Voice Rule Editor for creating/editing house rules via voice commands
