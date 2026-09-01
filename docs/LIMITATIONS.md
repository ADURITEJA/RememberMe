# Known Limitations & Roadmap — Remme

This document captures the current boundaries of the implementation and the prioritized roadmap for future work.

---

## Current limitations

### 1. Retrieval-only AI (Remma) is keyword-based, not semantic
- **What it does**: TF-IDF term matching over the patient's stored text (memories, people, reminders, moods).
- **What it doesn't do**: Understand synonyms, paraphrases, or intent beyond term overlap. "How did my birthday go?" won't match a memory titled "My 60th birthday" unless "birthday" appears in the query.
- **Mitigation**: The safe fallback explicitly invites the user to share the memory, so gaps are filled naturally.
- **Roadmap**: Integrate a local embedding model (e.g., `onnxruntime-web` + `all-MiniLM-L6-v2`) for true semantic search, still fully offline and retrieval-only.

### 2. No real push notifications in dev
- **Mock**: `console.log("[Remme mock push] ...")` in `storage.ts` / `notifications.ts`.
- **Production**: Requires FCM / OneSignal / Expo integration + VAPID keys + service worker.
- **Roadmap**: Add `/api/push/subscribe` + service worker registration; swap mock for real provider.

### 3. No real maps in location UI
- **Mock**: Coordinates displayed as text + `MOCK_MAP` component (a styled box with lat/lng).
- **Production**: Google Maps JS API or Mapbox GL with marker + geofence circle overlay.
- **Roadmap**: Add map component behind `MAPS_API_KEY`; fallback to static map image when key absent.

### 4. STT / TTS rely on browser Web Speech API
- **Limitation**: `SpeechRecognition` and `speechSynthesis` are Chrome/Edge/Safari only; quality varies; no offline support; limited voice selection.
- **Production**: Replace with AssemblyAI / Whisper API (STT) and ElevenLabs / Azure TTS (TTS) via `src/lib/services/voice.ts`.
- **Roadmap**: Add provider abstraction + API key env vars; keep browser fallback for privacy-conscious users.

### 5. SQLite dev DB → PostgreSQL prod gap
- **No enums in SQLite**: Role is `String` with comment; `MemoryMedia.type` is String not enum.
- **Migrations**: Dev uses `db push`; prod needs `prisma migrate deploy`.
- **Roadmap**: Run CI against both SQLite (dev) and PostgreSQL (prod) to catch dialect differences.

### 6. Single-device location "live" demo only
- **Demo**: Caregiver Location page toggles a random-walk simulator that posts to `/api/location/ping`.
- **Real**: Patient mobile app (React Native / Expo) or PWA with background geolocation + consent flow.
- **Roadmap**: Build companion mobile app (Expo) sharing the same Prisma schema via API.

### 7. No automated test suite yet
- **What's missing**: Unit tests (retrieval, geo), integration tests (seed → flow), E2E (Playwright).
- **Roadmap**: Add Vitest for unit, Playwright for 7 user journeys.

### 8. Doctor portal is a placeholder
- **Spec Section 15**: "Future doctor portal placeholder (MemoryReport exportable)."
- **Current**: `MemoryReport` model exists; no `/doctor` routes or ADMIN UI.
- **Roadmap**: Add `/doctor` route group behind ADMIN role, read-only report viewer.

### 9. No medication interaction checking
- **Spec Section 2**: Reminders support `category: "Medication"` but no drug DB, interaction warnings, or refill tracking.
- **Roadmap**: Integrate open-source drug interaction data (e.g., DailyMed) if scope expands.

### 10. Multi-language / i18n not implemented
- **Current**: English only, hardcoded strings in components.
- **Roadmap**: Add `next-intl` or similar; extract all user-facing strings.

### 11. Offline-first / PWA not implemented
- **Current**: Requires network for all reads/writes.
- **Roadmap**: Service worker + IndexedDB cache for Care Mode (read memories, see reminders offline); background sync for mutations.

### 12. Caregiver invitation flow missing
- **Current**: CaregiverRelationship created only via seed or direct DB.
- **Roadmap**: `/invite` flow — caregiver enters email → magic link → creates relationship with permissions.

---

## Prioritized roadmap

| Priority | Item | Effort | Notes |
|----------|------|--------|-------|
| P0 | Automated test suite (Vitest + Playwright) | M | 7 journeys from spec §28 |
| P0 | Semantic retrieval for Remma (local embeddings) | M | Keep retrieval-only guarantee |
| P1 | Real push notifications (FCM + service worker) | M | Requires VAPID + SW |
| P1 | Real maps in Location page | S | Behind `MAPS_API_KEY` |
| P1 | Production STT/TTS providers | M | Swap `voice.ts` implementations |
| P2 | Doctor portal (ADMIN, read-only reports) | S | Uses existing `MemoryReport` model |
| P2 | Caregiver invitation magic-link flow | M | Email + token + relationship create |
| P2 | PWA / offline support for Care Mode | L | Service worker + IndexedDB |
| P3 | Multi-language (i18n) | M | `next-intl` |
| P3 | Medication interaction checking | L | External data source |
| P4 | Companion mobile app (Expo) | XL | Shares API + Prisma schema |

---

## Design decisions that limit scope (intentional)

1. **No LLM by default** — Retrieval-only is a *feature* for safety, not a limitation to be "fixed" with an LLM. Any future LLM use must be opt-in, sandboxed, and citation-required.
2. **No real-time WebSockets** — Polling + server actions are simpler, cheaper, and sufficient for this domain (location updates every ~30s is fine).
3. **Single SQLite file in dev** — Zero infra; same schema works on PostgreSQL.
4. **Mock services are first-class** — Every external dependency has a working mock; the app is fully runnable in CI without secrets.
5. **Patient data never leaves their device without consent** — Architecture supports local-first; cloud sync is opt-in.

---

## Spec coverage check

| Spec Section | Status | Notes |
|--------------|--------|-------|
| 0–6 (Care Mode core) | ✅ | All implemented |
| 7–9 (Caregiver dashboard, location, alerts) | ✅ | All implemented |
| 10–13 (Mood, routine, places, connection) | ✅ | Implemented |
| 14 (Two UI modes) | ✅ | Care mobile-first, Caregiver desktop-first |
| 4A (Quiz + reports) | ✅ | Quiz warm, reports PDF |
| 15 (Doctor portal) | ⬜ | Placeholder only |
| 16–17 (Onboarding, auth, schema) | ✅ | Full Prisma + NextAuth |
| 18 (Notifications) | ✅ | Mock + API surface |
| 19 (AI architecture) | ✅ | Retrieval-only, safe fallback |
| 20 (Privacy/security) | ✅ | Least privilege, no frontend secrets |
| 21 (Accessibility) | ✅ | Large text, contrast, motion, touch |
| 22–23 (Liquid Glass design) | ✅ | Tailwind v4 @theme |
| 24–26 (Architecture, real features, errors) | ✅ | Production patterns |
| 27 (Demo data) | ✅ | Seed matches spec exactly |
| 28 (7 user journeys) | ⬜ | Manual verified; automated TODO |
| 29–32 (Quality, docs) | ✅ | This doc + ARCHITECTURE/API/SCHEMA/SECURITY/DEPLOY |