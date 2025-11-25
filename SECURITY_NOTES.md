# Security Notes & Warnings

## Pending Security Items

### ⚠️ Leaked Password Protection (Non-Critical)

**Status**: Warning from Supabase Security Linter  
**Severity**: Low (Optional enhancement)  
**Category**: Authentication Security

**Description**:  
Leaked password protection is currently disabled in the authentication configuration. This feature checks user passwords against known databases of compromised passwords.

**What it does**:  
- Prevents users from setting passwords that have been exposed in data breaches
- Checks passwords against the HaveIBeenPwned database
- Adds an extra layer of account security

**How to enable** (when you're ready):  
1. Open the backend dashboard (Lovable Cloud)
2. Navigate to Authentication settings
3. Enable "Password Strength" and "Leaked Password Protection"
4. Or visit: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

**Impact if not enabled**:  
- Users can potentially use compromised passwords
- Slightly lower account security
- No immediate risk to app functionality

**Recommendation**:  
Enable this before production launch for better user account security. Not critical for MVP/development phase.

---

## Completed Security Items ✅

- ✅ Row Level Security enabled on all tables
- ✅ Auto-confirm email signups configured
- ✅ Premium checks server-side via security definer functions
- ✅ User roles in separate table (avoiding privilege escalation)
- ✅ Protected routes with authentication checks
- ✅ Input validation on all forms
- ✅ Secure session management via Supabase
- ✅ Environment variables properly configured
- ✅ Edge function secrets properly stored

---

## Security Best Practices Implemented

### Authentication
- Email/password authentication via Supabase
- Session persistence with secure storage
- Protected routes redirect to auth page
- Auto-logout on session expiry

### Authorization
- Row Level Security (RLS) policies on all tables
- User roles stored in separate `user_roles` table
- Premium access checked server-side
- Security definer functions for role checks

### Data Protection
- Users can only access their own data
- Tournament admins can only manage their tournaments
- Friend requests properly scoped
- No direct access to auth.users table

### Input Validation
- Form validation on all inputs
- Length limits enforced (100-500 chars)
- SQL injection prevention (via Supabase)
- XSS prevention through React

### API Security
- Edge function secrets properly stored
- No API keys in codebase
- Service role key only in backend
- Publishable keys only in frontend

---

**Last Updated**: Phase 13 - Testing & Refinement  
**Next Security Review**: Before production deployment
