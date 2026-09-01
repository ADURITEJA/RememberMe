# API & Environment Reference — Remme

## Environment variables (`.env`)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ | Prisma datasource (SQLite file in dev) | `file:./dev.db` |
| `NEXTAUTH_URL` | ✅ | Canonical origin (used for callbacks) | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | ✅ | JWT signing secret (32+ chars) | `remme-dev-secret-change-me-in-production-9f2c4e8a1b` |
| `GOOGLE_CLIENT_ID` | ❌ | Google OAuth client ID | |
| `GOOGLE_CLIENT_SECRET` | ❌ | Google OAuth secret | |
| `MAPS_API_KEY` | ❌ | Google Maps / Mapbox key for location UI | |
| `STT_API_KEY` | ❌ | Speech-to-text provider key (e.g., AssemblyAI, Azure) | |
| `TTS_API_KEY` | ❌ | Text-to-speech provider key (e.g., ElevenLabs, Azure) | |
| `PUSH_API_KEY` | ❌ | FCM / OneSignal / Expo push server key | |

**No external keys are required to run locally** — all services have in-code mocks.

---

## Auth API (NextAuth v4)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth internal (signin, callback, session, signout) |
| `/api/auth/signup` | POST | Create new user + optional CareProfile |
| `/api/auth/signout` | POST | NextAuth signout (handled by NextAuth) |

### `/api/auth/signup`

**Request:**
```json
{
  "name": "Anitha Kumar",
  "email": "anitha@example.com",
  "password": "strong-password-123",
  "role": "CAREGIVER"
}
```

**Response 201:**
```json
{ "ok": true, "id": "clxxx", "role": "CAREGIVER" }
```

**Errors:** 400 (validation), 409 (email exists).

---

## Care Mode APIs

Base: patient is the signed-in `CARE_USER` (resolved via `getApiCareSession()`).

### Reminders

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reminders` | GET | List active reminders for today (with occurrences) |
| `/api/reminders` | POST | Create reminder |
| `/api/reminders/[id]` | PATCH | Toggle completion / update fields |
| `/api/reminders/[id]` | DELETE | Delete reminder |

**POST /api/reminders body:**
```json
{
  "title": "Morning pills",
  "description": "Blood pressure + vitamin D",
  "time": "10:00",
  "category": "Medication",
  "recurrence": "DAILY",
  "daysOfWeek": [1,2,3,4,5,6,7]
}
```

### People

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/people` | GET | List all people for patient |
| `/api/people` | POST | Create person (with optional photo URL) |
| `/api/people/[id]` | PATCH | Update person |
| `/api/people/[id]` | DELETE | Delete person |

### Memories

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/memories` | GET | Timeline (reverse chronological) with media + transcript |
| `/api/memories` | POST | Share-a-memory (create Memory + Media + Transcript atomically) |
| `/api/memories/[id]` | GET | Single memory with full media + transcript (for playback) |

**POST /api/memories body:**
```json
{
  "title": "Goa beach trip",
  "description": "Family holiday to Calangute in 1998.",
  "location": "Calangute, Goa",
  "date": "1998-12-20T00:00:00.000Z",
  "photoDataUrl": "data:image/jpeg;base64,...",
  "voiceDataUrl": "data:audio/webm;base64,...",
  "transcriptText": "We walked along Calangute beach..."
}
```

### Assistant (Remma)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/assistant` | POST | Retrieval-only AI response |

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "When did we go to Goa?" }
  ]
}
```

**Response:**
```json
{
  "answer": "We went to Calangute, Goa in December 1998. You remembered the boats coming in and the children having ice cream.",
  "source": { "kind": "memory", "id": "cm...", "title": "Goa beach trip" }
}
```

If no match: `{ "answer": "I don't remember that yet — tell me about it and I can keep it here for both of us 💛", "source": null }`

### SOS

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sos` | POST | Create EMERGENCY alert + notify contacts |

**Request:** `{ }` (empty — patient from session)

**Response:** `{ "ok": true, "alertId": "cm..." }`

### Moods

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/moods` | GET | List recent mood check-ins |
| `/api/moods` | POST | Create mood check-in |

**POST body:**
```json
{ "mood": "GOOD", "note": "Feeling bright today" }
```

`mood`: `GOOD | OKAY | BAD | WORRIED | CONFUSED`

### Quiz

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/quiz` | GET | Generate a new quiz (3–5 MCQs from stored data) |
| `/api/quiz/submit` | POST | Submit answers, record attempt |

**GET response:**
```json
{
  "quiz": {
    "id": "cm...",
    "questions": [
      {
        "id": "cm...",
        "questionText": "Who came with you to Goa on that beach holiday?",
        "options": ["Anitha", "Rahul", "Meera", "All of them"],
        "questionType": "WHO_IS_THIS"
      }
    ]
  }
}
```

**POST /api/quiz/submit body:**
```json
{
  "quizId": "cm...",
  "answers": ["All of them", "Calangute, Goa", "A surprise family dinner with a big cake"]
}
```

**Response:**
```json
{
  "attempt": { "id": "cm...", "score": 3, "completedAt": "2026-..." },
  "feedback": [
    { "question": "...", "userAnswer": "...", "correct": true, "explanation": "That's right, lovely! 💛" }
  ]
}
```

---

## Caregiver APIs

Base: caregiver is the signed-in `CAREGIVER`. Active patient = `patientId` query param or first linked patient.

### Relationships

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/caregiver/relationships` | GET | List caregiver's linked patients |

**Response:**
```json
{
  "caregiver": { "id": "...", "name": "Anitha Kumar" },
  "patients": [
    { "id": "cm...", "name": "Ravi Kumar", "dateOfBirth": "1949-03-14" }
  ]
}
```

### Caregiver Reminders (manage patient's reminders)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/caregiver/reminders` | GET | List patient's reminders (with today's occurrences) |
| `/api/caregiver/reminders` | POST | Create reminder for patient |
| `/api/caregiver/reminders/[id]` | PATCH | Update reminder |
| `/api/caregiver/reminders/[id]` | DELETE | Delete reminder |

Query param: `?patientId=cm...`

### Alerts

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/alerts` | GET | List alerts for patient (filter by status, severity) |
| `/api/alerts` | POST | Create alert (internal use) |
| `/api/alerts/[id]` | PATCH | Update status (ACKNOWLEDGED, HANDLED, DISMISSED) |

Query params: `?patientId=cm...&status=OPEN&severity=EMERGENCY`

### Location & Safety

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/location` | GET | Last ping + zone status for patient |
| `/api/location` | POST | Record location ping (manual / demo) + run zone checks |
| `/api/location/ping` | POST | Simulated live ping (demo random walk) |

**GET response:**
```json
{
  "lastPing": { "lat": 12.9784, "lng": 77.6408, "createdAt": "..." },
  "zones": [
    { "id": "cm...", "name": "Home", "lat": 12.9784, "lng": 77.6408, "radius": 300, "isActive": true, "inside": true }
  ],
  "recentEvents": [
    { "id": "cm...", "zoneName": "Home", "type": "EXITED", "createdAt": "..." }
  ]
}
```

**POST /api/location body:**
```json
{ "patientId": "cm...", "lat": 12.9784, "lng": 77.6408, "source": "DEMO" }
```

### Reports

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reports` | GET | Aggregated data for date range |
| `/api/reports` | POST | Generate & store PDF report (returns PDF URL) |

**GET query:** `?patientId=cm...&period=WEEK&start=2026-08-24&end=2026-08-30`

---

## Common patterns

### Error responses

```json
// 401
{ "error": "Please sign in first." }

// 403
{ "error": "This page is for the person in care." }

// 400
{ "error": "Validation failed.", "fieldErrors": { "email": "Enter a valid email." } }
```

### Pagination

List endpoints accept `?cursor=&limit=` for cursor-based pagination (not yet implemented everywhere; default limit 50).

### Date/time format

All timestamps are ISO 8601 UTC (`toISOString()`). Reminder `time` is local `"HH:mm"`.

---

## Service mocks (swap for real providers)

| Service | File | Replace with |
|---------|------|--------------|
| Media upload | `src/lib/services/storage.ts` | S3 / GCS / Cloudinary |
| STT | `src/lib/services/voice.ts` | AssemblyAI, Azure Speech, Whisper API |
| TTS | `src/lib/services/voice.ts` | ElevenLabs, Azure TTS |
| Push | `src/lib/services/notifications.ts` | FCM, OneSignal, Expo |
| Maps | (inline in components) | Google Maps JS, Mapbox GL |

Each file exports a single async function with a stable signature. Swap the implementation; call sites are unchanged.