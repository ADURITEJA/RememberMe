# Remme — Remember. Connect. Care.

A production-quality **dementia-care and cognitive-support application**. Remme pairs a calm, large-type, voice-first **Care Mode** for the person living with dementia with a detailed **Caregiver Mode** for family members — memories, smart reminders, mood check-ins, gentle memory quizzes, safety zones with live location, and a retrieval-only AI companion that never invents data.

## The idea in one sentence

> People with dementia forget *things*; Remme helps them **remember**, keeps them **connected** to the people they love, and supports the **caregiver** who cares for them — all with warmth and dignity.

## Quick start

```bash
cp .env.example .env            # if needed
npm install
./node_modules/.bin/prisma db push   # create & sync SQLite schema (remme/prisma/dev.db)
npm run db:seed                 # demo data: Ravi Kumar (patient) + Anitha Kumar (caregiver)
npm run dev                     # http://localhost:3000
```

### Demo logins

| Role      | Email              | Password            |
| --------- | ------------------ | ------------------- |
| Patient   | `ravi@remme.demo`  | `remme-demo-password` |
| Caregiver | `anitha@remme.demo` | `remme-demo-password` |

## Stack

- **Next.js 16.3.3** (App Router, Turbopack) — React 19
- **Tailwind CSS v4** — "Liquid Glass" calm design system via CSS `@theme` tokens
- **Prisma 5.22 + SQLite** — full relational schema
- **NextAuth v5 + @auth/prisma-adapter** — email/password (bcrypt) with `JWT` strategy
- **jspdf** — PDF keepsake reports and printable memory cards
- **Web Speech API** — browser-based voice recording → transcript for memories, TTS for listening back ("Listen" narration)

## Feature tour

| Area | Care Mode (`/`) | Caregiver Mode (`/caregiver`) |
| ---- | ------------------- | ----------------------------- |
| Home | Today greeting, "up next" reminders, day summary, quick actions | Dashboard: reminder/today status, mood trend, memory count, zone status, alert feed, medication adherence |
| Reminders | Big "take your pills" check-off, gentle new-reminder form | Management grid with create/edit/delete/done + today status |
| Medications | Medication list with dosage and schedule | Full CRUD + dosage tracking + adherence stats |
| People | Photo cards of the people they love | Photo & contact management for the patient |
| Memories | "Share a memory" (photo **+** voice **+** transcript as **one linked Memory**), timeline, "Listen" TTS | Memory library + PDF keepsake export + flagging |
| Assistant | "Remma", a retrieval-only AI companion — voice-first, never invents data | — |
| Quiz | "Let's remember together 💛" — gentle MCQs built only from the patient's own records | Score trends + PDF snapshot reports |
| Mood | Five big emotions, one tap, gentle aftercare | Mood history timeline + sparkline on dashboard |
| Routine | Morning/Afternoon/Evening day plan — tap to complete | CRUD management with step ordering |
| Notifications | Alert list with read/unread status | Notification preferences (email/push toggles) |
| SOS | Big red button → confirm → alert + emergency contacts | Alert inbox, mark handled |
| Emergency Contacts | — | Manage contacts shown during SOS |
| Important Places | — | CRUD for places the patient visits |
| Safety Zones | — | Geofencing with haversine distance, zone events, demo live-ping simulator |
| Reports | — | PDF export: mood trends, quiz scores, medication adherence |
| Alerts | — | Real-time alert inbox with type filtering and mark-read |
| Settings | Profile editing, password change, care profile (DOB, address, diagnosis, medical notes), GDPR data export, account deletion, sign out | 4 tabs: notifications, patient management, accessibility, profile |
| Onboarding | First-run wizard: Welcome → Caregiver → Routine → SOS → Done | — |
| Accessibility | — | Large text, reduce transparency, high contrast (syncs to Care Mode) |
| Patient Linking | — | Link/unlink patients by email |
| Multi-Patient | — | Switch between patients from sidebar |
| Error Handling | Custom 404 page, error boundary with retry, branded loading states | Same |

## Purpose & audience

**Remme is for:**
- **The person living with early-stage dementia** — a patient companion, not a hospital tool. Everything is large, calm, one-step-at-a-time, and free of pressure ("let's remember together", never "quiz time!").
- **Family caregivers** — non-medical people who need visibility, alerts, and easy export. They see real data, real analytics, real alerts.
- **Care clinicians (future)** — reports are built to export (PDF) so they can be taken to a doctor's visit.

**Remme is intentionally NOT:**
- A medical device or diagnostic tool. Its reports say so, plainly.
- A replacement for human care. Every flow ends in "you are not alone — your people are one tap away."

## User journeys

1. **Patient daily rhythm** — sign in → Home greeting → take morning pills (check-off) → share a memory (photo + record voice) → hear it read back.
2. **Remma, the memory companion** — ask "When did we go to Goa?" → retrieval pulls the real Goa memory → gentle answer + "Listen" playback; ask something unknowable → safe fallback, no fabrication.
3. **Caregiver oversight** — dashboard → alert inbox → mark handled.
4. **Safety** — caregiver opens Location & Safety → sees patient is inside/outside Home zone → zone-exit alert in inbox.
5. **Memory keepsake** — caregiver exports a memory card to PDF and prints it.
6. **Gentle cognitive check-in** — patient plays the memory quiz; score trend visible to caregiver; report PDF for the next appointment.
7. **Caregiver multi-patient** — a caregiver serving several people switches patients from the sidebar.
8. **Profile management** — patient or caregiver edits name, email, password; patient adds diagnosis and medical notes; GDPR data export; account deletion with password confirmation.
9. **First-time onboarding** — new patients see a 5-step wizard introducing the app's key features on their first login.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [API & env reference](docs/API.md)
- [Database schema](docs/SCHEMA.md)
- [Features](docs/FEATURES.md)
- [Known limitations & roadmap](docs/LIMITATIONS.md)
- [Security considerations](docs/SECURITY.md)
- [Deploy & test instructions](docs/DEPLOY.md)

## Project layout

```
remme/
├─ prisma/
│  ├─ schema.prisma        # full relational schema
│  └─ seed.mjs             # demo data (idempotent)
└─ src/
   ├─ app/
   │  ├─ (auth)/           # /login /signup /role
   │  ├─ (care)/           # Care Mode pages (home, reminders, meds, people, memories, mood, routine, quiz, notifications, sos, settings)
   │  ├─ caregiver/        # Caregiver Mode pages (dashboard, reminders, meds, people, memories, mood, routine, alerts, reports, places, zones, settings)
   │  ├─ api/              # route handlers (reminders, memories, people, alerts, location, quiz, sos, profile, assistant…)
   │  ├─ error.tsx         # global error boundary
   │  ├─ not-found.tsx     # custom 404 page
   │  └─ loading.tsx       # root loading state
   ├─ components/
   │  ├─ ui/               # button, card, input, dialog, badge, skeleton, a11y…
   │  ├─ auth/             # signup form, role selector
   │  ├─ care/             # patient-side components (NavBar, MoodPicker, AssistantChat, RoutineStepItem…)
   │  ├─ caregiver/        # caregiver-side components (CaregiverChrome, PatientSwitcher, MoodHistory, ReportGenerator…)
   │  ├─ onboarding/       # first-run wizard + gate
   │  └─ SignOutButton.tsx # shared sign-out component
   ├─ lib/                 # auth, prisma, geo, roles, service mocks
   └─ types/
```

## License

Internal/demo project — not for clinical use.
