---
Task ID: fix-login
Agent: Main
Task: Fix login not working after registration

Work Log:
- Investigated the login/register flow end-to-end
- Discovered the root cause: in-memory session store (Map) in auth.ts was losing state between Next.js route handler invocations
- Added Session model to Prisma schema (token, userId, expiresAt)
- Pushed schema changes and regenerated Prisma client
- Rewrote auth.ts to use database-backed sessions instead of in-memory Map
- Updated login and register routes to use async createSession/deleteSession
- Verified with curl: Register → Login → /me all return 200 with correct user data
- Verified with Agent Browser: Register new user → Sign out → Login with same credentials → Successfully logs in
- Cleaned up debug logging from routes

Stage Summary:
- **Root Cause**: In-memory sessions were lost between Next.js serverless route invocations
- **Fix**: Moved sessions to SQLite database via Prisma Session model
- **Result**: Full auth flow (register → logout → login) works correctly
