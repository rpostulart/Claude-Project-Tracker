# Fix login redirect loop

Users are experiencing an infinite redirect loop when trying to log in with expired sessions.

## Steps to Reproduce

1. Log in to the application
2. Wait for the session to expire (or manually clear the session cookie)
3. Try to access a protected route
4. Observe: browser enters an infinite redirect loop between `/login` and `/dashboard`

## Expected Behavior

User should be redirected to `/login` once and stay there until they re-authenticate.

## Root Cause

The auth middleware checks for a valid session and redirects to `/login`, but the login page also checks for a session and redirects to `/dashboard` if any session cookie exists (even expired ones).
