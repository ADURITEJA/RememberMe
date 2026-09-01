# Database Schema — Remme

Generated from `prisma/schema.prisma`. SQLite in dev; PostgreSQL in production.

---

## Entity relationship overview

```
User 1──1 CareProfile (CARE_USER only)
User *──* CareProfile via CaregiverRelationship (CAREGIVER → patients)

CareProfile 1──* Reminder
Reminder 1──* ReminderOccurrence (one per day per active reminder)

CareProfile 1──* Person
CareProfile 1──* Memory
Memory 1──* MemoryMedia (PHOTO | VOICE)
Memory 1──1 MemoryTranscript

CareProfile 1──* Routine
Routine 1──* RoutineStep

CareProfile 1──* MoodCheckIn
CareProfile 1──* ImportantPlace
CareProfile 1──* SafetyZone
SafetyZone 1──* ZoneEvent

CareProfile 1──* LocationPing
LocationPing *──1 ZoneEvent (polymorphic via zoneId + pingId)

CareProfile 1──* EmergencyContact
CareProfile 1──* Alert
CareProfile 1──* Notification

CareProfile 1──* MemoryQuiz
MemoryQuiz 1──* MemoryQuizQuestion
MemoryQuiz 1──* MemoryQuizAttempt
MemoryQuizAttempt 1──* details (JSON)

CareProfile 1──* MemoryReport
```

---

## Tables

### User

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | PK |
| `name` | String? | Display name |
| `email` | String | Unique, lowercase |
| `emailVerified` | DateTime? | |
| `password` | String? | bcrypt hash (credentials) |
| `role` | String | `"CARE_USER" \| "CAREGIVER" \| "ADMIN"` |
| `image` | String? | Profile photo URL |
| `createdAt` | DateTime | @default(now()) |
| `updatedAt` | DateTime | @updatedAt |

**Relations**: `accounts`, `sessions`, `careProfile`, `caregiverLinks` (as caregiver), `patientLinks` (as patient)

---

### CareProfile

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | PK |
| `userId` | String | Unique, FK → User.id (CARE_USER) |
| `dateOfBirth` | DateTime? | |
| `address` | String? | Home address |
| `diagnosis` | String? | Free text |
| `medicalNotes` | String? | Free text |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

**Relations**: `user`, `reminders`, `people`, `memories`, `routines`, `moodCheckIns`, `importantPlaces`, `safetyZones`, `locationPings`, `emergencyContacts`, `alerts`, `notifications`, `memoryQuizzes`, `memoryReports`, `caregiverRelationships` (as patient)

---

### CaregiverRelationship

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | PK |
| `caregiverId` | String | FK → User.id (CAREGIVER) |
| `patientId` | String | FK → CareProfile.id |
| `permissions` | Json | `{ alerts, reminders, location, memories }` booleans |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

Unique on `[caregiverId, patientId]`.

---

### Reminder

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | PK |
| `patientId` | String | FK → CareProfile.id |
| `title` | String | e.g. "Morning pills" |
| `description` | String? | |
| `time` | String | `"HH:mm"` 24h |
| `category` | String? | Medication / Meals / Exercise / Custom |
| `recurrence` | String | `"DAILY" \| "WEEKLY" \| "ONCE"` |
| `daysOfWeek` | Json? | Bitmask for weekly |
| `isActive` | Boolean | @default(true) |
| `createdAt` / `updatedAt` | DateTime | |

**Relations**: `occurrences` (1→*)

---

### ReminderOccurrence

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | PK |
| `reminderId` | String | FK → Reminder.id |
| `scheduledFor` | DateTime | The specific day+time |
| `status` | String | `"PENDING" \| "COMPLETED" \| "MISSED" \| "SNOOZED"` |
| `completedAt` | DateTime? | |
| `createdAt` / `updatedAt` | DateTime | |

Unique on `[reminderId, scheduledFor]`.

---

### Medication

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | PK |
| `patientId` | String | FK → CareProfile.id |
| `name` | String | |
| `dosage` | String? | e.g. "10 mg" |
| `instructions` | String? | e.g. "With food" |
| `timeOfDay` | String? | `"HH:mm"` |
| `isActive` | Boolean | @default(true) |
| `createdAt` / `updatedAt` | DateTime | |

---

### Person

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | PK |
| `patientId` | String | FK → CareProfile.id |
| `name` | String | |
| `relationship` | String | Daughter, Son, Granddaughter, Friend… |
| `nickname` | String? | |
| `phoneNumber` | String? | |
| `photoUrl` | String? | |
| `description` | String? | Notes for the patient |
| `createdAt` / `updatedAt` | DateTime | |

---

### Memory

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | PK |
| `patientId` | String | FK → CareProfile.id |
| `title` | String | "Goa beach trip" |
| `description` | String? | |
| `date` | DateTime | The memory's date |
| `location` | String? | Free text |
| `createdAt` / `updatedAt` | DateTime | |

**Relations**: `media` (1→*), `transcript` (1→1)

---

### MemoryMedia

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | PK |
| `memoryId` | String | FK → Memory.id |
| `type` | String | `"PHOTO" \| "VOICE"` |
| `url` | String | Data URL or `/uploads/...` path |
| `createdAt` | DateTime | |

---

### MemoryTranscript

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | PK |
| `memoryId` | String | Unique, FK → Memory.id |
| `text` | String | Full transcript from voice recording |
| `createdAt` / `updatedAt` | DateTime | |

---

### Routine / RoutineStep

| Table | Field | Type | Notes |
|-------|-------|------|-------|
| Routine | `id` | String (cuid) | PK |
| Routine | `patientId` | String | FK → CareProfile.id |
| Routine | `name` | String | "Morning routine" |
| Routine | `bucket` | String | `"MORNING" \| "AFTERNOON" \| "EVENING"` |
| Routine | `order` | Int | |
| Routine | `createdAt` / `updatedAt` | DateTime | |
| RoutineStep | `id` | String (cuid) | PK |
| RoutineStep | `routineId` | String | FK → Routine.id |
| RoutineStep | `title` | String | "Brush teeth" |
| RoutineStep | `description` | String? | |
| RoutineStep | `durationMinutes` | Int? | |
| RoutineStep | `order` | Int | |
| RoutineStep | `createdAt` / `updatedAt` | DateTime | |

---

### MoodCheckIn

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | PK |
| `patientId` | String | FK → CareProfile.id |
| `mood` | String | `"GOOD" \| "OKAY" \| "BAD" \| "WORRIED" \| "CONFUSED"` |
| `note` | String? | Optional short note |
| `createdAt` | DateTime | @default(now()) |

---

### ImportantPlace

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | PK |
| `patientId` | String | FK → CareProfile.id |
| `name` | String | "Home", "Doctor's clinic" |
| `address` | String? | |
| `lat` | Float | |
| `lng` | Float | |
| `category` | String? | `"HOME" \| "MEDICAL" \| "SOCIAL" \| "OTHER"` |
| `createdAt` / `updatedAt` | DateTime | |

---

### SafetyZone

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | PK |
| `patientId` | String | FK → CareProfile.id |
| `name` | String | "Home" |
| `lat` | Float | Center latitude |
| `lng` | Float | Center longitude |
| `radius` | Int | Meters (e.g. 300) |
| `isActive` | Boolean | @default(true) |
| `activeHours` | Json | Array of `{ start: "HH:mm", end: "HH:mm" }` in 24h |
| `createdAt` / `updatedAt` | DateTime | |

**Relations**: `events` (1→*)

---

### LocationPing

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | PK |
| `patientId` | String | FK → CareProfile.id |
| `lat` | Float | |
| `lng` | Float | |
| `accuracy` | Float? | Meters |
| `source` | String? | `"MANUAL" \| "DEMO" \| "DEVICE"` |
| `createdAt` | DateTime | @default(now()) |

**Relations**: `zoneEvents` (1→*)

---

### ZoneEvent

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | PK |
| `zoneId` | String | FK → SafetyZone.id |
| `pingId` | String | FK → LocationPing.id |
| `type` | String | `"ENTERED" \| "EXITED"` |
| `createdAt` | DateTime | @default(now()) |

---

### EmergencyContact

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | PK |
| `patientId` | String | FK → CareProfile.id |
| `name` | String | |
| `phoneNumber` | String | |
| `relationship` | String? | |
| `priority` | Int | @default(1) — lower = higher priority |
| `createdAt` / `updatedAt` | DateTime | |

---

### Alert

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | PK |
| `patientId` | String | FK → CareProfile.id |
| `type` | String | `"SOS" \| "ZONE_EXIT" \| "ZONE_ENTRY" \| "MISSED_REMINDER" \| "MOOD_LOW" \| "OTHER"` |
| `severity` | String | `"INFO" \| "ATTENTION" \| "URGENT" \| "EMERGENCY"` |
| `title` | String | |
| `message` | String? | |
| `status` | String | `"OPEN" \| "ACKNOWLEDGED" \| "HANDLED" \| "DISMISSED"` |
| `metadata` | Json? | Extra context (zone name, reminder id, etc.) |
| `createdAt` | DateTime | @default(now()) |
| `handledAt` | DateTime? | |
| `handledBy` | String? | FK → User.id (caregiver) |

---

### Notification

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | PK |
| `patientId` | String | FK → CareProfile.id |
| `type` | String | `"REMINDER" \| "MOOD" \| "QUIZ" \| "ALERT" \| "MEMORY_SHARED" \| "OTHER"` |
| `title` | String | |
| `body` | String? | |
| `data` | Json? | Deep-link params |
| `read` | Boolean | @default(false) |
| `createdAt` | DateTime | @default(now()) |

---

### MemoryQuiz / Question / Attempt

| Table | Field | Type | Notes |
|-------|-------|------|-------|
| MemoryQuiz | `id` | String (cuid) | PK |
| MemoryQuiz | `patientId` | String | FK → CareProfile.id |
| MemoryQuiz | `date` | DateTime | Day the quiz was generated |
| MemoryQuiz | `createdAt` / `updatedAt` | DateTime | |
| MemoryQuizQuestion | `id` | String (cuid) | PK |
| MemoryQuizQuestion | `quizId` | String | FK → MemoryQuiz.id |
| MemoryQuizQuestion | `sourceMemoryId` | String? | FK → Memory.id |
| MemoryQuizQuestion | `sourcePersonId` | String? | FK → Person.id |
| MemoryQuizQuestion | `questionText` | String | "Who came with you to Goa?" |
| MemoryQuizQuestion | `questionType` | String | `"WHO_IS_THIS" \| "WHERE_WAS_THIS" \| "WHAT_HAPPENED" \| "WHEN_WAS_THIS"` |
| MemoryQuizQuestion | `options` | Json | `string[]` — 4 options incl. correct |
| MemoryQuizQuestion | `correctAnswer` | String | |
| MemoryQuizAttempt | `id` | String (cuid) | PK |
| MemoryQuizAttempt | `quizId` | String | FK → MemoryQuiz.id |
| MemoryQuizAttempt | `score` | Int | Correct answers |
| MemoryQuizAttempt | `details` | Json | `[{question, userAnswer, correct, order}]` |
| MemoryQuizAttempt | `completedAt` | DateTime | @default(now()) |

---

### MemoryReport

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | PK |
| `patientId` | String | FK → CareProfile.id |
| `period` | String | `"DAY" \| "WEEK" \| "MONTH"` |
| `startDate` | DateTime | |
| `endDate` | DateTime | |
| `dataJson` | Json | Aggregated snapshot (quiz scores, moods, activity) |
| `pdfUrl` | String? | If generated |
| `createdAt` | DateTime | @default(now()) |

---

## NextAuth tables (managed by @auth/prisma-adapter)

- `Account` — OAuth / credentials links
- `Session` — Active sessions (JWT strategy = not used for storage, but table exists)
- `VerificationToken` — Email verification

---

## Indexing notes

- All FK columns are indexed by Prisma automatically (`@relation`).
- Composite uniques: `CaregiverRelationship [caregiverId, patientId]`, `ReminderOccurrence [reminderId, scheduledFor]`, `MemoryTranscript [memoryId]`.
- Queries by `patientId` + date ranges are the hot paths (dashboard, home, alerts, quiz) — covered by FK indexes.

---

## Migration / sync

```bash
# Dev (SQLite) — push schema changes directly
npx prisma db push

# Prod (PostgreSQL) — use migrations
npx prisma migrate deploy
```

Run `npx prisma generate` after any schema change to update the client.