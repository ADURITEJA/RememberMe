# Feature List — Remme

This is the authoritative checklist of what the application delivers, mapped to the spec sections.

---

## 0. Auth & Role Selection

- [x] Unified `/login` (email/password, optional Google OAuth)
- [x] `/signup` with role picker (CARE_USER / CAREGIVER)
- [x] `/role` post-login picker: "Who are you signing in as?" with Patient / Caregiver cards
- [x] Per-device role persistence (`localStorage` + `useDeviceRole` hook)
- [x] Patient picker for multi-patient caregivers (PatientSwitcher + localStorage)
- [x] Session: NextAuth v4, JWT strategy, bcrypt credentials, role in token

---

## Care Mode (Patient-facing — `/care`)

### 1. Today / Home Screen
- [x] Warm greeting by time-of-day + name
- [x] Today's date, prominent
- [x] "Up next" — next 3 pending reminders with big check-off
- [x] Day summary: memory count, people count, mood checks today
- [x] Quick actions: Add memory, Check mood, Ask Remma

### 2. Smart Reminders
- [x] List all active reminders grouped by status (pending / completed today)
- [x] Big, touch-friendly checkboxes → creates/updates `ReminderOccurrence`
- [x] "New reminder" form: title, time, description, category, recurrence (DAILY/WEEKLY/ONCE)
- [x] Gentle empty state when nothing due

### 3. People / Memory Book
- [x] Photo cards: name, relationship, nickname, phone, description
- [x] Add/edit/delete via dialog
- [x] Photo upload via storage abstraction

### 4. Memories — "My Memories" Timeline + Share-a-Memory
- [x] Timeline: reverse chronological, glass cards, large type
- [x] Each memory card shows: photo thumbnail, title, date, location, "Listen" (TTS playback of transcript)
- [x] **Share-a-memory flow** (`/care/memories/new`):
  - Photo picker (camera / gallery via `<input type=file accept=image/* capture=environment>`)
  - Voice recorder (Web Speech API) with animated pulse button
  - Live transcript appears in text field as you speak
  - Text field editable for corrections
  - **Atomic create**: one `Memory` + `MemoryMedia` (PHOTO + VOICE) + `MemoryTranscript` in a single Prisma transaction
  - Warm copy: "Tell it your way… Remme will keep it safe for both of you"
- [x] Listen button → TTS reads the transcript aloud

### 5. AI Memory Assistant — "Remma"
- [x] Full-screen calm chat interface
- [x] Text input + mic button (STT) + send
- [x] Auto-TTS playback of every assistant message
- [x] **Retrieval-only, zero hallucination**:
  - Deterministic TF-IDF ranking over patient's own memories / people / reminders / moods / routines / places
  - If relevant doc found → gentle answer quoting **real stored text** + source link
  - If nothing found → **only** the safe fallback:
    > "I don't remember that yet — tell me about it and I can keep it here for both of us 💛"
  - Never invents content, never fabricates dates/names

### 6. SOS / Emergency
- [x] Prominent SOS button in top chrome (Care layout)
- [x] `/care/sos` page: big red panel, confirm dialog ("Are you sure you need help?")
- [x] Creates `Alert(severity=EMERGENCY, type=SOS)`
- [x] Mock push notification to caregivers
- [x] "Help is on the way" screen with emergency contact names + mock call buttons
- [x] Clear Cancel button at every step

### 7. Mood Check-ins
- [x] `/care/mood`: 5 big emoji buttons (GOOD / OKAY / BAD / WORRIED / CONFUSED)
- [x] Optional note field
- [x] Saves `MoodCheckIn`; gentle thank-you screen + "We're here for you" line

### 8. Routines (Day Plan)
- [x] `/care/routine`: Morning / Afternoon / Evening buckets
- [x] Reads `Routine` + `RoutineStep` from DB, grouped by bucket
- [x] Large check-off cards per step

### 9. Memory Quiz — "Let's remember together 💛"
- [x] `/care/quiz`: warm framing, never test-like
- [x] Generates 3–5 MCQ by sampling patient's own Memories/People/Reminders
- [x] Distractors drawn from other real data (never fake)
- [x] One question at a time, big answer buttons
- [x] Immediate gentle feedback:
  - Correct: "That's right, lovely! 💛"
  - Incorrect: "No worries — it's okay to forget. Here's the memory: …"
- [x] Tracks `MemoryQuizAttempt` with score
- [x] End screen: friendly encouragement, no grading judgment

---

## Caregiver Mode (Family-facing — `/caregiver`)

### 1. Dashboard
- [x] Today's reminder status chips (done / upcoming / missed)
- [x] Warm greeting line for the patient
- [x] 7-day mood sparkline (CSS bars)
- [x] Memory count + 3 latest memory mini-cards
- [x] Safety zone status (inside/outside from last ping)
- [x] Recent alerts feed (last 5)
- [x] Quick actions: Open Safety, View Reports

### 2. Reminders Management
- [x] Full grid of patient's reminders with today's occurrence status
- [x] Create / edit / delete / mark done
- [x] Own API under `/api/caregiver/reminders`

### 3. Memories Library
- [x] Grid of all memories with thumbnail, title, date, transcript preview
- [x] Click → expand detail (dialog) with full media + transcript
- [x] **Export PDF** per memory (jspdf) — keepsake print with title, date, location, description, transcript

### 4. People Management
- [x] CRUD over patient's People

### 5. Alerts Inbox
- [x] Table of alerts with severity badge, type, relative time, status
- [x] Mark HANDLED / ACKNOWLEDGED / DISMISSED
- [x] Empty state: "All quiet 💚"

### 6. Location & Safety
- [x] Last `LocationPing` card (coordinates + friendly "Home zone — inside/outside")
- [x] Safety zones list (name, lat/lng, radius, active, activeHours)
- [x] Zone events feed (ENTERED/EXITED with timestamps)
- [x] **Demo live ping simulator** (toggle ON → random walk from Home zone every ~5s, posts to `/api/location/ping`, runs geofence checks, creates alerts/events on transitions)
- [x] Clearly labeled "Demo simulation"

### 7. Reports
- [x] Date range picker (quick buttons: Day / Week / Month)
- [x] Shows quiz score trend, mood distribution, memory/reminder activity counts
- [x] **Generate PDF snapshot** (jspdf) with disclaimer:
  > "Remme reports support memory care. They are not a medical diagnosis."

### 8. Settings
- [x] Notification preferences (mock toggles → localStorage)
- [x] Patient accessibility: large text / reduce transparency / high contrast (synced to A11yProvider)
- [x] Caregiver profile card from session
- [x] Patient connections list (add/remove CaregiverRelationship)

---

## Cross-cutting

### Accessibility
- [x] 48px min touch targets (`min-touch` utility)
- [x] High contrast mode (`.a11y-high-contrast`)
- [x] Large text mode (`.a11y-large-text`)
- [x] Reduce transparency mode (`.a11y-reduce-transparency`)
- [x] `prefers-reduced-motion` respected (no animation)
- [x] Screen-reader labels on all interactive elements
- [x] Focus-visible outlines

### Design System — "Liquid Glass"
- [x] Palette tokens: sage #5B8C72, amber #E8A94C, offWhite #FAF7F2, charcoal #1E2620, ink #26302B, inkLight #F3EFE8, terracotta #C96A4B, emergency #D93A2B
- [x] Frosted glass surfaces (`glass-panel`, `glass-card`, `glass-solid`)
- [x] Squircle radii (`rounded-remme-*`)
- [x] Minimal motion, reduced-motion support

### Service Abstractions (mockable)
- [x] `storage.ts` — media upload (base64 data URL mock)
- [x] `voice.ts` — STT (Web Speech API) + TTS (speechSynthesis) + hooks
- [x] `notifications.ts` — in-app + push mock
- [x] `geo.ts` — haversine, `isInsideZone`, `checkAllZones`

### Demo Data (idempotent seed)
- [x] Ravi Kumar (CARE_USER) + CareProfile
- [x] Anitha Kumar (CAREGIVER) linked to Ravi
- [x] 4 reminders (10am, 1pm, 5pm, 9pm)
- [x] 3 People (Anitha daughter, Rahul son, Meera granddaughter)
- [x] 3 Memories (Goa trip, 60th birthday, Childhood home) each with media + transcript
- [x] 1 SafetyZone (Home, Bangalore, 300m)
- [x] 7 MoodCheckIns (past week)
- [x] 1 MemoryQuiz + 3 questions + 2 attempts

### Tests / Quality
- [ ] Unit tests for retrieval ranking (`rankDocs`)
- [ ] Unit tests for geofencing (`isInsideZone`)
- [ ] Integration test: seed → login → care home → share memory → quiz
- [ ] Integration test: seed → login caregiver → dashboard → location ping → alert created
- [ ] E2E (Playwright) for 7 user journeys

---

## Future / Doctor Portal (placeholder)
- [ ] `/doctor` route group (guarded by ADMIN role)
- [ ] Read-only MemoryReport export
- [ ] Patient consent flow for data sharing

---

## Legend
- ✅ = implemented and type-checked
- [ ] = pending