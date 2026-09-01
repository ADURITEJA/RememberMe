# Security Considerations — Remme

This document captures the threat model, mitigations, and security hygiene for Remme. It is written for the engineering team and for any future security review.

---

## Threat model summary

| Actor | Motivation | Capability |
|-------|------------|------------|
| **Patient (CARE_USER)** | Accidental misuse, confusion | Authenticated, limited to own `CareProfile` data |
| **Caregiver (CAREGIVER)** | Overreach, curiosity about other patients | Authenticated, sees only linked patients via `CaregiverRelationship` |
| **Unauthenticated attacker** | Data harvest, account takeover | Network access to public endpoints |
| **Malicious insider (compromised caregiver account)** | Exfiltrate patient data | Valid session, elevated caregiver permissions |
| **Supply chain** | Compromised npm package | Build-time / runtime code execution |

---

## Authentication & Authorization

### NextAuth v4 (Credentials + JWT)

- **Password hashing**: bcryptjs, cost factor 10 (configurable via env if needed).
- **Session strategy**: JWT (stateless). Token contains `{ id, name, email, role }`.
- **Token signing**: `NEXTAUTH_SECRET` (32+ chars, rotated in prod).
- **Token lifetime**: Default NextAuth (30 days); refresh on activity.
- **No password reset flow yet** — add `/api/auth/forgot-password` with time-limited token for production.

### Role-based access (defense in depth)

| Layer | Mechanism |
|-------|-----------|
| **Edge (proxy.ts)** | Optimistic JWT role check → early redirect (cheap, no DB) |
| **Server Component** | `requireCareSession()` / `requireCaregiverSession()` — verifies role + profile exists in DB |
| **Route Handler** | `getApiCareSession()` / `getApiCaregiverSession()` — returns 401/403 JSON |
| **Prisma queries** | All reads/writes scoped by `patientId` (CareProfile.id) derived from session — **never** trust client-sent IDs |

**Critical**: No API endpoint accepts a `patientId` or `userId` from the client body without verifying it matches the session's authorized profile(s). The only exception is Caregiver APIs which accept `?patientId=` **after** verifying the caregiver is linked to that patient via `CaregiverRelationship`.

### Caregiver → Patient authorization

- `CaregiverRelationship` links `caregiverId` (User) → `patientId` (CareProfile) with granular `permissions` JSON.
- `src/lib/authz.ts` exports `canAccessPatient(profileId, session)` used by caregiver route handlers.
- Caregiver pages resolve the active patient via `PatientSwitcher` (localStorage) + server verification.

---

## Data protection

### At rest

- **SQLite (dev)** / **PostgreSQL (prod)** — standard filesystem / volume encryption (provider responsibility).
- **Passwords**: bcrypt hash only; never logged.
- **Secrets**: `NEXTAUTH_SECRET`, OAuth keys, API keys in `.env` — **never** committed. `.gitignore` includes `.env*`.

### In transit

- **HTTPS only** in production (enforced by hosting platform).
- **HSTS** header via `next.config.ts` (add `strict-transport-security`).
- **Cookies**: NextAuth uses `__Secure-next-auth.*` (secure, httpOnly, sameSite=lax).

### In the browser

- **No API keys in frontend** — all external services (maps, STT, TTS, push) called from **server route handlers** only.
- **CSP**: Recommended to add via `next.config.ts` `headers()` — restrict `script-src`, `connect-src` to self + allowed providers.
- **Referrer-Policy**: `strict-origin-when-cross-origin` (default in Next.js).

---

## Input validation & injection prevention

- **Route handlers**: Hand-rolled validation (see `/api/auth/signup/route.ts`) — no `zod` dependency, but same pattern: allow-list fields, type check, length bounds, sanitize.
- **Prisma**: Parameterized queries — SQL injection not possible via ORM.
- **XSS**: React auto-escapes JSX. User-generated content rendered as text (not `dangerouslySetInnerHTML`). Memory transcripts, descriptions, notes are plain text.
- **File uploads**: Currently base64 data URLs stored in DB (mock). Production: validate MIME type, size limit, scan for malware, store in object storage with signed URLs — **never** serve user uploads from the app domain.

---

## Geofencing & location privacy

- **Consent**: Location tracking only active if caregiver has `location: true` permission in `CaregiverRelationship` AND patient (or their legal guardian) has granted consent (future: explicit consent screen + revocable token).
- **Data minimization**: `LocationPing` stores only lat/lng/accuracy/timestamp/source. No continuous track history by default — only pings explicitly sent.
- **Retention**: No automated purge yet. Roadmap: TTL policy (e.g., 90 days) via cron.

---

## SOS / Emergency data

- `Alert(severity=EMERGENCY)` created on SOS press.
- Emergency contacts (`EmergencyContact`) stored with phone numbers.
- **Mock push** logs to console. Real push would send minimal payload: `{ alertId, type: "SOS", patientName }` — no location unless explicitly shared.
- **No automatic emergency services call** — Remme is not a medical device. UI shows contact names + "Call" buttons (tel: links) for human action.

---

## Supply chain hygiene

- **Dependencies**: Locked versions in `package.json` (no `^`/`~` for critical deps).
- **Audit**: `npm audit` in CI; fail on high/critical.
- **No postinstall scripts** in direct dependencies (checked).
- **Transitive deps**: Monitor via `npm audit` + Dependabot / Renovate.

---

## Secrets management checklist (production)

| Secret | Rotation | Storage |
|--------|----------|---------|
| `NEXTAUTH_SECRET` | Every 90 days | Vault / platform secret store |
| `DATABASE_URL` | Per infra policy | Vault |
| `GOOGLE_CLIENT_SECRET` | Per Google policy | Vault |
| `MAPS_API_KEY` | Per provider policy | Vault (restrict referrer) |
| `STT_API_KEY` / `TTS_API_KEY` / `PUSH_API_KEY` | Per provider | Vault |

**Never** put secrets in:
- Docker image layers
- Build-time env (Next.js `NEXT_PUBLIC_*` only for non-secrets)
- Client-side code

---

## Logging & audit

- **Auth events**: Login success/failure, signup, role selection — logged via `console.log` with `[Remme auth]` prefix. Production: ship to structured log store (Datadog, Loki, CloudWatch).
- **SOS alerts**: Full alert record + handler in `Alert.handledBy` / `handledAt`.
- **Caregiver actions**: Marking alerts handled, creating reminders, location pings — all create `Notification` or `AuditLog` (future table) entries.

---

## Incident response playbook (abridged)

| Scenario | Detection | Containment | Recovery |
|----------|-----------|-------------|----------|
| Credential stuffing | Failed login spike (logs) | Rate-limit `/api/auth/[...nextauth]` (add `express-rate-limit` or edge middleware) | Rotate `NEXTAUTH_SECRET`, force re-login |
| Caregiver account compromised | Unusual alert access pattern | Revoke session (delete `Session` rows), rotate caregiver password | Review `Alert`/`Notification` access logs |
| SQL injection attempt | WAF / Prisma error logs | Block IP at edge | Verify no data exfil (Prisma param queries = safe) |
| Malicious package | `npm audit` / Dependabot alert | Pin version, audit diff, deploy patch | Post-mortem, update allow-list |

---

## Compliance notes

- **Not HIPAA / GDPR certified** — this is a demo / internal tool. For clinical use:
  - Add Business Associate Agreement (BAA) with hosting provider.
  - Implement full audit log (`AuditLog` table).
  - Data Subject Access Request (DSAR) endpoint: export all data for a `CareProfile`.
  - Right to erasure: cascade delete `CareProfile` + all related data.
  - Encryption at rest (managed DB) + in transit (TLS 1.2+).
  - Data Processing Addendum (DPA) with all subprocessors.

---

## Secure development practices

1. **All new route handlers** must use `getApiCareSession()` / `getApiCaregiverSession()` — never read `req.headers` for auth.
2. **All new Prisma queries** in server components must be scoped by `patientId` from `requireCareSession()` — never `prisma.memory.findMany()` without `where: { patientId }`.
3. **Client components** never import `prisma` or server-only helpers (`care-db.ts`, `caregiver-db.ts`).
4. **External API calls** only from route handlers (`src/app/api/**`), never from client components or server components.
5. **New dependencies** require approval (no auto-install). Add to `package.json` manually, run `npm install`, commit lockfile.

---

## Penetration testing scope (for future)

- Auth bypass (role confusion, session fixation)
- IDOR on caregiver patient switching
- XSS via memory transcript / description fields
- CSRF on mutation endpoints (NextAuth uses same-site cookies — verify)
- Rate limiting on `/api/auth/signup`, `/api/assistant`, `/api/sos`
- Information leakage in error messages (stack traces in production)

---

## Contact

Security issues: create a private GitHub security advisory or email the maintainer. Do not file public issues for vulnerabilities.