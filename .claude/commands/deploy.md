# /deploy — Deployment Workflow

## Option A: Docker (local or self-hosted)

### Pre-Deploy Checklist
1. Ensure `.env` is filled in (copy from `.env.example`):
   - `DATABASE_URL`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — **required at build time** (baked into JS bundle)
   - `CLERK_SECRET_KEY`
2. Type check: `npx tsc --noEmit`
3. Build and start all services:
   ```bash
   docker compose up --build
   ```
4. Migrations run automatically via the `migrate` service before the app starts.
5. App available at http://localhost:3000

### Stopping
```bash
docker compose down          # stop containers, keep DB volume
docker compose down -v       # stop containers + delete DB data
```

### Rebuilding after code changes
```bash
docker compose up --build app
```

### Docker Notes
- Base image is `node:20-slim` (Debian). Do NOT switch to Alpine — Prisma requires OpenSSL 3.x which Alpine doesn't ship.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` must be in `.env` before `docker compose up --build` — it cannot be injected at runtime.

---

## Option B: Vercel (recommended for production)

### Pre-Deploy Checklist
1. Run full test suite: `npm test`
2. Type check: `npx tsc --noEmit`
3. Build locally: `npm run build` — fix any errors
4. Verify all required env vars are configured in Vercel dashboard
5. Run DB migrations against production DB: `npx prisma migrate deploy`
6. Deploy: `vercel --prod` (or push to main branch via GitHub Actions)
7. Smoke test critical paths:
   - [ ] Sign up / login works
   - [ ] Create tree + add person
   - [ ] Tree visualization loads
   - [ ] Photo upload works

### Required Environment Variables
```
DATABASE_URL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/tree
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
NEXT_PUBLIC_APP_URL
AWS_ACCESS_KEY_ID        (when S3 is wired up)
AWS_SECRET_ACCESS_KEY    (when S3 is wired up)
AWS_BUCKET_NAME          (when S3 is wired up)
AWS_REGION               (when S3 is wired up)
```
