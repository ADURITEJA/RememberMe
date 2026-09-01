# Deploy & Test Instructions — Remme

---

## Local development

### Prerequisites

- Node.js 20+ (LTS)
- npm 10+ (comes with Node)
- No external services required (all mocked)

### First-time setup

```bash
cd remme
cp .env.example .env   # or create .env with the vars below
npm install
npx prisma db push     # creates prisma/dev.db + tables
npm run db:seed        # seeds Ravi + Anitha demo data
npm run dev            # Turbopack dev server at http://localhost:3000
```

### Required `.env` (local)

```bash
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="remme-dev-secret-change-me-in-production-9f2c4e8a1b"
# Optional — leave blank for mocks
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
MAPS_API_KEY=""
STT_API_KEY=""
TTS_API_KEY=""
PUSH_API_KEY=""
```

### Demo logins

| Role | Email | Password |
|------|-------|----------|
| Patient | `ravi@remme.demo` | `remme-demo-password` |
| Caregiver | `anitha@remme.demo` | `remme-demo-password` |

---

## Available npm scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "db:generate": "prisma generate",
  "db:push": "prisma db push",
  "db:seed": "prisma db seed"
}
```

- `npm run dev` — Turbopack dev (fast HMR)
- `npm run build` — Production build (type-checks, compiles, prerenders)
- `npm run start` — Runs the production server (after `build`)
- `npm run lint` — ESLint (configured for Next.js + TypeScript)
- `npm run db:generate` — Regenerates Prisma Client after schema changes
- `npm run db:push` — Syncs schema to SQLite (dev only)
- `npm run db:seed` — Runs `prisma/seed.mjs` (idempotent)

---

## Production deployment

### Option 1: Vercel (recommended for Next.js)

1. Push to GitHub/GitLab/Bitbucket.
2. Import project in Vercel.
3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL` → PostgreSQL connection string (e.g., `postgresql://user:pass@host:5432/remme?schema=public`)
   - `NEXTAUTH_URL` → `https://your-domain.vercel.app`
   - `NEXTAUTH_SECRET` → **generate a new 32+ char secret**: `openssl rand -base64 32`
   - Optional: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `MAPS_API_KEY`, `STT_API_KEY`, `TTS_API_KEY`, `PUSH_API_KEY`
4. Build command: `npm run build` (auto-detected)
5. Output: Vercel handles `prisma generate` + `prisma migrate deploy` via `postinstall` if you add:
   ```json
   "scripts": {
     "postinstall": "prisma generate && prisma migrate deploy"
   }
   ```
   Or use a separate build step.

### Option 2: Docker (anywhere)

**Dockerfile** (create at repo root):

```dockerfile
# syntax = docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# Generate Prisma Client
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000
CMD ["node", "server.js"]
```

**Build & run:**

```bash
docker build -t remme .
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_URL="https://your-domain.com" \
  -e NEXTAUTH_SECRET="..." \
  remme
```

> **Note**: Add `output: "standalone"` to `next.config.ts` for the standalone output.

### Option 3: Traditional VM / PaaS (Railway, Render, Fly.io)

- Same env vars as Vercel.
- Run `npm run build` then `npm run start`.
- Ensure the process manager (PM2, systemd) restarts on crash.
- Run `npx prisma migrate deploy` on deploy (or as a release phase).

---

## Database notes

| Environment | Provider | Schema sync |
|-------------|----------|-------------|
| Dev | SQLite (`file:./dev.db`) | `npx prisma db push` |
| CI | SQLite (ephemeral) | `npx prisma db push` |
| Staging/Prod | PostgreSQL | `npx prisma migrate deploy` |

**Important**: SQLite does not support native enums. The schema uses `String` with comments for enum-like fields (`role`, `MemoryMedia.type`, etc.). PostgreSQL **does** support enums — if you migrate to native enums in prod, create a migration that converts the columns.

---

## Testing

### Type-check (fast, no browser)

```bash
npx tsc --noEmit
```

### Lint

```bash
npm run lint
```

### Unit tests (Vitest) — *not yet added, roadmap P0*

```bash
# When added:
npm run test
npm run test:coverage
```

Suggested test files:
- `src/lib/geo.test.ts` — `haversineMeters`, `isInsideZone`, `checkAllZones`
- `src/components/care/care-db.test.ts` — `tokenize`, `rankDocs`, `greetingForTime`
- `src/lib/services/voice.test.ts` — mock STT/TTS interfaces
- `src/lib/authz.test.ts` — `canAccessPatient`, `requireRole`

### Integration tests — *not yet added, roadmap P0*

Seed → login → flow assertions using Vitest + Supertest or Playwright API mode.

### E2E tests (Playwright) — *not yet added, roadmap P0*

```bash
# When added:
npm run test:e2e
```

**7 User Journeys** (from spec §28) to automate:

1. **Patient daily rhythm** — login as Ravi → Home → check off reminder → share memory (photo + voice) → listen back.
2. **Remma memory recall** — ask "When did we go to Goa?" → verify real memory quoted → ask unknown → verify safe fallback.
3. **Caregiver oversight** — login as Anitha → Dashboard → open Alert → mark Handled.
4. **Safety zone** — Location page → simulate ping outside Home zone → verify Alert created.
5. **Memory keepsake** — Caregiver Memories → Export PDF → verify file downloads.
6. **Gentle quiz** — Patient Quiz → answer 3 questions → verify attempt recorded → Caregiver Reports shows trend.
7. **Multi-patient caregiver** — (requires second patient seed) → switch patients → verify data isolation.

---

## Manual smoke test checklist (run after every deploy)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open `/` | Redirects to `/login` |
| 2 | Login as `ravi@remme.demo` | Lands on `/care` (Home) |
| 3 | Check Home greeting + 3 upcoming reminders | Shows "Good morning, Ravi" + 4 reminders |
| 4 | Click "Add a memory" → fill form → photo + voice → submit | Memory appears at top of `/care/memories` |
| 5 | Click "Listen" on that memory | TTS plays transcript |
| 6 | Open `/care/assistant` → ask "When did we go to Goa?" | Answer quotes Goa memory |
| 7 | Ask "What's the capital of France?" | Safe fallback shown |
| 8 | Open `/care/sos` → confirm | Alert created, "Help is on the way" screen |
| 9 | Logout → Login as `anitha@remme.demo` | Lands on `/caregiver/dashboard` |
| 10 | Dashboard shows Ravi's reminder status + mood sparkline | Data present |
| 11 | Open Location → toggle "Demo live ping" → wait | Zone events appear, Alert on exit |
| 12 | Open Reports → Generate PDF | PDF downloads with disclaimer |
| 13 | Open Settings → toggle Large Text → refresh Care Mode | Patient sees larger text |

---

## CI/CD pipeline (GitHub Actions example)

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  typecheck-and-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx prisma generate
      - run: npx tsc --noEmit
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx prisma generate
      - run: npx prisma db push
      - run: npm run db:seed
      # - run: npm run test        # when unit tests exist
      # - run: npm run test:e2e    # when e2e tests exist

  build:
    runs-on: ubuntu-latest
    needs: [typecheck-and-lint]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx prisma generate
      - run: npm run build
```

---

## Health check endpoint

Add `src/app/api/health/route.ts` for load balancer probes:

```ts
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", db: "connected" });
  } catch {
    return Response.json({ status: "degraded", db: "disconnected" }, { status: 503 });
  }
}
```

---

## Monitoring / observability (production)

| Concern | Tool | Implementation |
|---------|------|----------------|
| Uptime | Vercel / Pingdom / UptimeRobot | Hit `/api/health` |
| Errors | Sentry / Datadog / Logtail | `next.config.ts` → `experimental.instrumentationHook` |
| Performance | Vercel Analytics / Web Vitals | Built-in Next.js |
| Logs | Loki / CloudWatch / Datadog | Structured JSON logs from route handlers |

---

## Rollback

- **Vercel**: Instant rollback to previous deployment from dashboard.
- **Docker**: `docker tag remme:current remme:rollback` → redeploy previous image.
- **Database**: `npx prisma migrate resolve --rolled-back <migration_name>` (if migration caused issue).

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `PrismaClientKnownRequestError: P2003` | FK constraint violation | Check `patientId` / `caregiverId` in request matches session |
| `NextAuthError: JWT decryption failed` | `NEXTAUTH_SECRET` mismatch | Ensure same secret across all instances |
| `proxy.ts` redirect loop | Role in JWT doesn't match DB | Clear cookies, re-login; check `requireCareSession` logic |
| Build fails on `prisma generate` | Schema drift | Run `npx prisma db push` locally, commit `prisma/schema.prisma` |
| TTS/STT not working in Safari | Web Speech API not supported | Falls back gracefully; add provider keys for production |

---

## Performance budgets (for CI gate)

| Metric | Budget |
|--------|--------|
| First Contentful Paint (mobile) | < 1.8s |
| Largest Contentful Paint (mobile) | < 2.5s |
| Total JS (gzipped) | < 150 KB |
| Time to Interactive | < 3.5s |

Use `npm run build && npx @next/bundle-analyzer` to inspect.

---

## Support matrix

| Browser | Version | Notes |
|---------|---------|-------|
| Chrome | 118+ | Full STT/TTS |
| Edge | 118+ | Full STT/TTS |
| Safari | 16+ | STT limited, TTS works |
| Firefox | 119+ | STT not supported (no SpeechRecognition) — falls back to text input |
| iOS Safari | 16+ | TTS works, STT requires user gesture |

---

## Contact

Deployment issues: check the GitHub Actions logs first. For architecture questions, see [ARCHITECTURE.md](ARCHITECTURE.md).