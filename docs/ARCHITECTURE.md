# Architecture — Remme

## Overview

Remme is a **Next.js 16 App Router** application with two distinct modes (Care / Caregiver) sharing a single database and auth layer. The architecture favors **server components for data fetching**, **client components for interactivity**, and **route handlers for mutations**. No external microservices — all "services" (STT, TTS, push, maps, PDF) are behind thin, mockable abstractions so the app runs fully offline in dev.

---

## Topology

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                                 │
│  ┌───────────────────┐      ┌─────────────────────────────┐  │
│  │ Care Mode SPA     │      │ Caregiver Mode SPA           │  │
│  │ (mobile-first)    │      │ (desktop-first, sidebar)    │  │
│  └───────┬───────────┘      └──────────────┬──────────────┘  │
└──────────┼─────────────────────────────────┼──────────────────┘
           │                                 │
           ▼                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 16 Server                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  App Router (Route Groups)                             │  │
│  │   /(auth)    /login  /signup  /role                   │  │
│  │   /(care)    /home  /reminders  /people  /memories/   │  │
│  │                      /assistant /sos /mood /routine /quiz │  │
│  │   /(caregiver)/dashboard /reminders /memories ...     │  │
│  │   /api/...    (reminders, memories, people, alerts,   │  │
│  │                 location, quiz, sos, auth/signup...)   │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  proxy.ts (route guard — Next 16 renamed middleware)   │  │
│  │  NextAuth v4 (JWT sessions, Credentials + Google)     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│                      Prisma ORM 5.22                         │
│  SQLite file (dev) → PostgreSQL (prod)                       │
│  Full schema: User, CareProfile, CaregiverRelationship,     │
│  Reminder/ReminderOccurrence, Medication, Person,           │
│  Memory/MemoryMedia/MemoryTranscript, Routine/RoutineStep,  │
│  MoodCheckIn, ImportantPlace, SafetyZone/ZoneEvent,         │
│  LocationPing, EmergencyContact, Alert/Notification,        │
│  MemoryQuiz/MemoryQuizQuestion/MemoryQuizAttempt,           │
│  MemoryReport, + NextAuth Account/Session/VerificationToken │
└─────────────────────────────────────────────────────────────┘
```

---

## Data access conventions

| Layer | Pattern |
|-------|---------|
| **Server Components** (pages) | `requireCareSession()` / `requireCaregiverSession()` helpers (in `care-db.ts` / `caregiver-db.ts`) → read `prisma` directly. |
| **Route Handlers** (mutations) | `getApiCareSession()` / `getApiCaregiverSession()` → return `Response` with 401/403 JSON or proceed. |
| **Client Components** | `useSession()` from `next-auth/react` + `fetch()` to `/api/...` endpoints. |

**Never** import Prisma in a client component. **Never** call server-only helpers from client code.

---

## Role & session model

- **Roles**: `CARE_USER` (patient), `CAREGIVER` (family), `ADMIN` (future).
- **Auth**: NextAuth v4, CredentialsProvider (email/password + bcrypt), JWT strategy.
- **Session**: `{ user: { id, name, email, role } }` — role surfaced via custom JWT/session callbacks (`src/lib/auth.ts`).
- **Authorization**:
  - `proxy.ts` (route guard) does an **optimistic check** on the JWT token to redirect early.
  - Real authorization happens in `requireCareSession()` / `requireCaregiverSession()` which verify the role against the DB (careProfile / caregiverRelationship).

---

## Design system — "Liquid Glass" (Tailwind v4)

**Color tokens** defined in `src/app/globals.css` via `@theme`:
```css
--color-remme-sage: #5B8C72;       /* primary calm green */
--color-remme-amber: #E8A94C;      /* warm accent */
--color-remme-offwhite: #FAF7F2;   /* warm canvas */
--color-remme-charcoal: #1E2620;   /* near-black headings */
--color-remme-ink: #26302B;        /* body text */
--color-remme-inklight: #F3EFE8;   /* dark-mode text */
--color-remme-terracotta: #C96A4B; /* status/attention */
--color-remme-emergency: #D93A2B;  /* SOS red */
```

**Utilities** via `@utility`:
- `glass-panel` — light frosted panel
- `glass-card` — interactive card (hover → subtle lift)
- `glass-solid` — opaque fallback for reduce-transparency
- `shadow-glass` / `shadow-glass-sm` / `shadow-glass-lg`

**Responsive strategy**: Care Mode = mobile-first, bottom nav; Caregiver Mode = desktop-first, left sidebar.

---

## Retrieval-only AI (Remma)

No LLM key required. The assistant (`/care/assistant`, `api/assistant`) runs a **deterministic retrieval pipeline** over the patient's own records:

1. User query → `tokenize()` (stop-word removal, lowercasing).
2. Collect all candidate docs (memories, people, reminders, moods, routines, places) → `RetrievalDoc[]`.
3. `rankDocs()`: TF-IDF-style scoring → top matches.
4. If top score > 0 → craft gentle answer **quoting real stored text**; include "Listen" button for memory playback.
5. If no match → **only** the safe fallback:  
   > "I don't remember that yet — tell me about it and I can keep it here for both of us 💛"

**Guarantee**: The assistant never invents content, never hallucinates. It is a retrieval UI, not a generator.

---

## Service abstractions (mock-friendly)

All external services live behind `src/lib/services/*.ts` with **mock implementations**:

| Service | File | Mock behavior |
|---------|------|---------------|
| Media upload | `storage.ts` | Stores base64 data URLs in-memory → returns `/uploads/...` paths |
| STT (voice → text) | `voice.ts` | Browser Web Speech API (`SpeechRecognition`) + fallback |
| TTS (text → voice) | `voice.ts` | Browser `speechSynthesis` + `useTextToSpeech` hook |
| Push notifications | `notifications.ts` | `console.log("[Remme mock push] ...")` |
| Geofencing | `geo.ts` | Haversine distance + `isInsideZone()`, `checkAllZones()` |

Swap in real providers by replacing the mock function bodies; call sites stay identical.

---

## Geofencing / safety zones

- `SafetyZone` (lat, lng, radius meters, activeHours JSON).
- `LocationPing` stores patient position (lat/lng, timestamp).
- `ZoneEvent` logs ENTERED/EXITED transitions.
- `src/lib/geo.ts`: `haversineMeters()`, `isInsideZone(ping, zone)`, `checkAllZones(ping, zones[])`.
- Caregiver Location page → demo "live ping" toggle posts random-walk pings to `/api/location/ping`, which runs zone checks + creates alerts/events on transitions.

---

## Key files

```
src/
├─ app/
│  ├─ (auth)/login|signup|role/page.tsx
│  ├─ (care)/... (all Care Mode pages)
│  ├─ (caregiver)/... (all Caregiver pages)
│  └─ api/... (route handlers grouped by domain)
├─ components/
│  ├─ ui/                # Button, Card, Input, Select, Dialog, Badge, Skeleton, EmptyState, A11yProvider
│  ├─ auth/              # LoginForm, SignupForm, RoleSelector, PatientPicker, Providers
│  ├─ care/              # NavBar, MemoryTimelineCard, ReminderCheckRow, PeopleClient, VoiceRecorder, care-db.ts
│  └─ caregiver/         # PatientSwitcher, patient-context, StatusBadge, DataCard, AlertRow, ZoneCard
├─ lib/
│  ├─ auth.ts            # NextAuth options
│  ├─ authz.ts           # getServerUser, requireRole, canAccessPatient
│  ├─ prisma.ts          # Prisma singleton (dev warn/error, prod error)
│  ├─ roles.ts           # RoleOption enum + labels
│  ├─ geo.ts             # Haversine, zone checks
│  └─ services/          # storage, voice, notifications
├─ types/next-auth.d.ts  # Module augmentation
├─ proxy.ts              # Route guard (Next 16 "proxy")
└─ app/globals.css       # @theme tokens + @utility glass-* + base styles
prisma/
├─ schema.prisma         # Full relational schema (no enums in SQLite)
└─ seed.mjs              # Idempotent demo data (Ravi + Anitha)
```

---

## Build / run matrix

| Command | Purpose |
|---------|---------|
| `npm run dev` | Turbopack dev server (localhost:3000) |
| `npm run build` | Production build (static + dynamic routes) |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm run db:generate` | `prisma generate` |
| `npm run db:push` | `prisma db push` (schema → SQLite) |
| `npm run db:seed` | `prisma db seed` (idempotent demo data) |
| `npx tsc --noEmit` | TypeScript check (used by CI/agents) |

---

## Why this architecture?

- **Next.js 16 App Router + Server Components** → minimal client JS, fast initial paint, data fetched at layout/page level without over-fetching.
- **Single SQLite dev DB** → zero infra, same schema as prod (PostgreSQL via Prisma).
- **Proxy route guard** → early redirect before rendering, cheaper than per-page checks.
- **Retrieval-only AI** → zero API cost, zero hallucination risk, fully auditable.
- **Mockable services** → fully runnable in CI/preview without secrets.
- **Tailwind v4 @theme** → design tokens in CSS, no JS config, works with Turbopack.
- **Role-separated route groups** → clear ownership, no mixed concerns.