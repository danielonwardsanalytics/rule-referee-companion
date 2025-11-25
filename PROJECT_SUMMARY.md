# Fair Play - Project Summary

## 📱 Overview
Fair Play is a comprehensive card game companion app that helps players manage tournaments, create custom house rules, settle rule disputes with AI voice chat, and connect with friends for organized game nights.

## 🎯 Core Features

### 1. **Authentication & User Management**
- Email/password authentication via Supabase
- 5-day free trial automatically activated on signup
- Auto-confirm email signups (no email verification required)
- Automatic profile and QR code generation
- Premium subscription system with trial period

### 2. **Game Management**
- 12+ pre-seeded card games (UNO, Monopoly Deal, Phase 10, Skip-Bo, etc.)
- Add games to personal collection
- Hide/unhide games from homepage
- Game detail pages with rules summaries
- Request new games feature

### 3. **Tournament System** (Premium Feature)
- Create and manage multiple tournaments per game
- Track player standings with automatic leaderboard
- Record game results with winner selection
- Add players via:
  - Display name (guest players)
  - QR code scanning
  - Email invitations (7-day expiry)
  - Friend selection
- Tournament-specific house rules
- Game history tracking
- Admin-only editing capabilities

### 4. **House Rules** (Premium Feature)
- Create custom rule sets per game
- One active rule set per game
- Add, edit, reorder, and delete individual rules
- Make rule sets public for community sharing
- Fork/save popular public rule sets (50+ saves threshold)
- Track last edited timestamp and editor name
- Attach rule sets to tournaments

### 5. **Social Features**
- Friend system with QR code and email invitations
- Send/accept/reject friend requests
- 7-day invitation expiry for pending requests
- Quick add friends to tournaments
- View and manage friend connections

### 6. **AI Voice Chat**
- OpenAI-powered conversational AI
- Voice-to-text and text-to-speech
- Context-aware responses based on:
  - Current game (in tournaments)
  - General card game knowledge (on homepage)
- Premium feature restrictions (free users: rules only)
- Real-time transcription and audio playback

### 7. **QR Code System**
- Unique QR code per user
- Scan QR codes to:
  - Add friends
  - Add tournament players
- Manual code entry fallback
- Camera permission handling

### 8. **Premium Monetization**
- 5-day free trial on signup
- Free plan limitations:
  - One active tournament per game
  - No house rules creation
  - Basic voice chat (rules only)
- Premium unlocks:
  - Unlimited tournaments
  - House rules creation/management
  - Full voice chat features
  - Public rule set sharing

## 🏗️ Technical Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling with custom design system
- **React Router** for navigation
- **TanStack Query** for data fetching and caching
- **Shadcn UI** components (customized)
- **Lucide React** for icons
- **date-fns** for date formatting
- **qrcode** library for QR generation

### Backend (Lovable Cloud / Supabase)
- **PostgreSQL** database with Row Level Security
- **Supabase Auth** for authentication
- **Edge Functions** for:
  - OpenAI Realtime API integration (voice chat)
  - Text-to-speech conversion
  - Audio transcription
- **Real-time subscriptions** for chat messages
- **Database triggers** for:
  - Auto-create profiles on signup
  - Update tournament standings
  - Timestamp updates
- **Security functions**:
  - `has_role()` - Check user roles
  - `has_premium_access()` - Verify premium status
  - `get_premium_status()` - Get subscription details

### Database Schema

#### Core Tables
- **profiles** - User profiles with subscription status
- **user_roles** - User permission levels (admin/user)
- **games** - Available card games catalog
- **user_games** - User's game collection

#### Tournament System
- **tournaments** - Tournament metadata
- **tournament_players** - Player roster with stats
- **game_results** - Match history

#### House Rules
- **house_rule_sets** - Rule set metadata
- **house_rules** - Individual rules

#### Social Features
- **friends** - Friend connections
- **friend_requests** - Pending friend requests
- **game_requests** - User game suggestions
- **game_suggestions** - User-submitted game requests

## 🎨 Design System

### Color Scheme
- **Primary**: Blue (#3B82F6) - Main brand color
- **Accent**: Gold/Amber - Premium features
- **Game-specific accents**:
  - UNO: Red
  - Skip-Bo: Blue
  - Phase 10: Green
  - Monopoly Deal: Teal

### Theme Modes
- **Dark Mode** (default) - Enhanced blue with deep backgrounds
- **Light Mode** - Clean white with subtle blue tints
- **System** - Follows OS preference

### Design Tokens
All colors defined as HSL values in CSS variables for consistency:
- `--primary`, `--secondary`, `--accent`
- `--background`, `--foreground`, `--card`
- `--muted`, `--destructive`, `--border`
- Custom gradients and shadows

### Animations
- Page transitions (fade-in)
- Hover effects (scale)
- Loading states (spinner)
- Smooth theme transitions

## 🔒 Security Features

### Row Level Security Policies
- Users can only access their own data
- Tournament admins can manage their tournaments
- Premium checks enforced server-side
- Friend requests properly scoped
- Public rule sets viewable by all

### Input Validation
- Form validation on all inputs
- Length limits enforced
- SQL injection prevention (via Supabase)
- XSS prevention through React

### Authentication
- Secure password storage
- Session management via Supabase
- Protected routes with redirect
- Auto-logout on session expiry

## 📱 Responsive Design

### Mobile First
- Bottom navigation for easy thumb access
- Touch-friendly tap targets
- Optimized for 320px+ screens
- Collapsible menu overlay

### Breakpoints
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

### Accessibility
- Skip link for keyboard users
- ARIA labels on sections
- Semantic HTML structure
- Focus indicators
- Screen reader support

## 🚀 Deployment

### Environment Variables
All managed automatically via Lovable Cloud:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

### Edge Function Secrets
- `LOVABLE_API_KEY` - For Lovable AI
- `OPENAI_API_KEY` - For voice chat
- `SUPABASE_SERVICE_ROLE_KEY` - For admin operations

### Database Migrations
All migrations tracked in `supabase/migrations/`
- Tables with RLS policies
- Database functions
- Triggers for automation
- Indexes for performance

## 📊 Key Metrics to Track

### User Engagement
- Daily/Monthly active users
- Trial conversion rate
- Premium subscriber retention
- Average tournaments per user
- House rules created

### Feature Usage
- Voice chat queries per day
- QR code scans
- Friend requests sent/accepted
- Game requests submitted
- Public rule set saves

### Performance
- Page load times
- API response times
- Database query performance
- Error rates

## 🔮 Future Enhancements

### Potential Features
1. **In-app payments** - Stripe integration for premium subscriptions
2. **Push notifications** - Tournament invites, friend requests
3. **Leaderboards** - Global and friend rankings
4. **Achievements/Badges** - Gamification
5. **Game statistics** - Personal win/loss tracking
6. **Tournament brackets** - Structured elimination rounds
7. **Live game mode** - Real-time scoring during games
8. **Custom themes** - User-selected color schemes
9. **Multi-language support** - Internationalization
10. **Mobile app** - React Native version

### Technical Improvements
1. **Performance optimization** - Code splitting, lazy loading
2. **Offline mode** - Service worker, local caching
3. **Analytics integration** - User behavior tracking
4. **Error monitoring** - Sentry or similar
5. **A/B testing** - Feature experimentation
6. **SEO optimization** - Meta tags, sitemaps
7. **PWA features** - Install prompt, app icon

## 📝 Development Notes

### Code Organization
- **Components**: Reusable UI components in `src/components/`
- **Pages**: Route-level components in `src/pages/`
- **Hooks**: Custom React hooks in `src/hooks/`
- **Utils**: Helper functions in `src/lib/`
- **Integrations**: External service configs in `src/integrations/`

### Best Practices
- All colors use semantic tokens (no hardcoded colors)
- Components follow single responsibility principle
- Hooks encapsulate data fetching logic
- Loading and error states handled consistently
- Empty states provide clear guidance
- Forms use proper validation

### Testing Approach
See `TESTING_GUIDE.md` for comprehensive test scenarios

## 🎓 Learning Resources

### Technologies Used
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Guides](https://supabase.com/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [Shadcn UI](https://ui.shadcn.com)

### Lovable Platform
- [Lovable Docs](https://docs.lovable.dev/)
- [Lovable Cloud Features](https://docs.lovable.dev/features/cloud)
- [Lovable AI Features](https://docs.lovable.dev/features/ai)

---

**Built with**: React + TypeScript + Tailwind CSS + Supabase (via Lovable Cloud)  
**Status**: Phase 13 - Testing & Refinement  
**License**: Proprietary  
**Contact**: [Your contact information]
