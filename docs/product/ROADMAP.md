# Absen.Digital — Roadmap & Status Tracker

**Legend:** ⬜ not started · 🟨 in progress / partially done · ✅ done · 🔒 blocked
**Scope source:** [`PRD.md`](PRD.md) — update status here, never edit PRD scope casually.

---

## Phase 1 — MVP

### Platform Foundation

| Sub-feature | Spec | Implement | Test | Notes |
|---|---|---|---|---|
| Tenant provisioning (idempotent DB create + migrate + seed) | ⬜ | ⬜ | ⬜ | Critical path < 60 s |
| Onboarding wizard step 1–2 (org info + first location) | ⬜ | ⬜ | ⬜ | |
| Onboarding wizard step 3–5 (shifts, import attendee, assign template) | ⬜ | ⬜ | ⬜ | Skippable steps |
| Smart defaults seeding (locations/shifts/leave presets/policy) | ⬜ | ⬜ | ⬜ | |
| PWA shell (manifest, SW, install prompt) | ⬜ | ⬜ | ⬜ | Mobile-first |

### `setting` package

| Sub-feature | Spec | Implement | Test | Notes |
|---|---|---|---|---|
| Typed settings repository (`TenantSettings` DTO) | ⬜ | ⬜ | ⬜ | Dependency of all packages |
| Settings groups: general / attendance / verification / leave / overtime caps | ⬜ | ⬜ | ⬜ | Per-request cache |

### `auth` + `employee` packages

| Sub-feature | Spec | Implement | Test | Notes |
|---|---|---|---|---|
| Auth flows (login/register per tenant domain) | ⬜ | ⬜ | ⬜ | Must-test: tenant isolation |
| Roles admin/manager/attendee (spatie team-scoped) | ⬜ | ⬜ | ⬜ | |
| Employee profile CRUD + manager_id routing | ⬜ | ⬜ | ⬜ | |
| CSV import + invite link/email | ⬜ | ⬜ | ⬜ | Template download |

### `location` package

| Sub-feature | Spec | Implement | Test | Notes |
|---|---|---|---|---|
| Location CRUD (+lat/lng, radius, timezone, active flag) | ⬜ | ⬜ | ⬜ | Tier gate: 1 [S] vs unlimited [P] |
| WiFi network registry per location | ⬜ | ⬜ | ⬜ | |
| Map picker UI (backoffice) | ⬜ | ⬜ | ⬜ | |

### `shift` package

| Sub-feature | Spec | Implement | Test | Notes |
|---|---|---|---|---|
| Shift definitions — fixed (start/end/break/grace) | ⬜ | ⬜ | ⬜ | |
| Shift definitions — flexible (window + required duration) | ⬜ | ⬜ | ⬜ | |
| Weekly schedule templates + 7-day rows + policy override | ⬜ | ⬜ | ⬜ | Core flexibility feature |
| Assignment effective dating (from/to, history) | ⬜ | ⬜ | ⬜ | Overlap rule: latest wins |
| Date exceptions per employee | ⬜ | ⬜ | ⬜ | Overrides assignment |
| Day resolver service (exception > assignment > null) | ⬜ | ⬜ | ⬜ | Overnight shift aware |

### `attendance` package

| Sub-feature | Spec | Implement | Test | Notes |
|---|---|---|---|---|
| Clock in/out core (sessions, double-in guard, overnight shift) | ⬜ | ⬜ | ⬜ | Must-test path |
| Effective policy resolver (trip > exception > assignment > location > tenant) | ⬜ | ⬜ | ⬜ | Store `effective_policy` json |
| Geofence validator (Haversine, +20 m margin, accuracy flag) | ⬜ | ⬜ | ⬜ | [S] |
| WiFi validator (SSID match, iOS fallback UX) | ⬜ | ⬜ | ⬜ | [P] |
| Photo capture pipeline (compress ≤ 500 KB, EXIF strip, retention) | ⬜ | ⬜ | ⬜ | [S] |
| Coordinate capture (always-on when GPS available) | ⬜ | ⬜ | ⬜ | |
| Verification attempt log (`attendance_verifications`) | ⬜ | ⬜ | ⬜ | Feeds warning list |
| Fallback queue → pending_review + backoffice warning list | ⬜ | ⬜ | ⬜ | Batch approve/reject |
| Approval reminders (> 24 h) + notify attendee decision | ⬜ | ⬜ | ⬜ | |
| Late/early-leave computation + auto-close job (opt-in) | ⬜ | ⬜ | ⬜ | Grace default 15 min |

### `leave` package

| Sub-feature | Spec | Implement | Test | Notes |
|---|---|---|---|---|
| Leave type master CRUD (reduces_balance / paid flags, presets) | ⬜ | ⬜ | ⬜ | Must-test balance math |
| Balance engine (tenant period: calendar/anniversary/custom) | ⬜ | ⬜ | ⬜ | |
| Reset job + carryover job (max N days cap) | ⬜ | ⬜ | ⬜ | |
| Leave request flow (range, half-day, attachment, validations) | ⬜ | ⬜ | ⬜ | Overlap + max consecutive |
| Approval flow (single-level MVP) + holiday non-deduction rule | ⬜ | ⬜ | ⬜ | |

### `holiday` package

| Sub-feature | Spec | Implement | Test | Notes |
|---|---|---|---|---|
| Holiday CRUD (date, recurring, tenant-wide or location-scoped) | ⬜ | ⬜ | ⬜ | |
| National preset importer (Indonesia, per year) | ⬜ | ⬜ | ⬜ | |

### `reporting` package

| Sub-feature | Spec | Implement | Test | Notes |
|---|---|---|---|---|
| Employee self-service (history 30 d, saldo cuti, upcoming holidays) | ⬜ | ⬜ | ⬜ | |
| Manager dashboard (today team status, inbox count, late trend) | ⬜ | ⬜ | ⬜ | |
| Monthly summary engine (counts + durations only, no currency) | ⬜ | ⬜ | ⬜ | Payroll-ready output |
| Daily log report | ⬜ | ⬜ | ⬜ | |
| Export CSV / XLSX / PDF | ⬜ | ⬜ | ⬜ | |

### `api` package

| Sub-feature | Spec | Implement | Test | Notes |
|---|---|---|---|---|
| Token auth decision (ADR mini: sanctum vs simple token table) | ⬜ | ⬜ | ⬜ | Decide before build |
| `GET /api/v1/attendee/profile` | ⬜ | ⬜ | ⬜ | |
| `GET /api/v1/reports/attendance-summary?from=&to=` | ⬜ | ⬜ | ⬜ | |
| Rate limiting 100 req/min/token + error format | ⬜ | ⬜ | ⬜ | |
| OpenAPI static doc | ⬜ | ⬜ | ⬜ | Generate = Phase 2 |

---

## Phase 2 — Post-MVP

| Sub-feature | Spec | Implement | Test | Notes |
|---|---|---|---|---|
| Face enrollment flow (descriptors only, consent) | ⬜ | ⬜ | ⬜ | face-api.js client-side |
| Liveness challenge (blink + head turn, configurable) | ⬜ | ⬜ | ⬜ | |
| Client-side matching + threshold config (default 0.6) | ⬜ | ⬜ | ⬜ | Backend stores/audits only |
| Overtime pre-approved requests | ⬜ | ⬜ | ⬜ | |
| Overtime post-submission claims + reconciliation | ⬜ | ⬜ | ⬜ | Valid only when approved |
| Overtime cap engine (daily/monthly, warn + block) | ⬜ | ⬜ | ⬜ | Defaults 4 h / 20 h |
| Business trip CRUD + policy downgrade to photo+coords | ⬜ | ⬜ | ⬜ | |
| Shift swap (peer approval → manager approval → exception pair) | ⬜ | ⬜ | ⬜ | 7-day notice rule |
| Subscription billing (`packages/subscription`, central) | ⬜ | ⬜ | ⬜ | Tiers S/P/E gating |
| Scheduled email reports + payroll-ready templates | ⬜ | ⬜ | ⬜ | |
| Offline check-in queue + sync | ⬜ | ⬜ | ⬜ | Enhancement |

## Phase 3 — Scale

| Sub-feature | Spec | Implement | Test | Notes |
|---|---|---|---|---|
| Organization hierarchy (units, approval chains) | ⬜ | ⬜ | ⬜ | Optional per tenant |
| Advanced analytics | ⬜ | ⬜ | ⬜ | |
| SSO (Google Workspace, Entra ID) | ⬜ | ⬜ | ⬜ | Enterprise |
| Full audit trail | ⬜ | ⬜ | ⬜ | |
| Webhooks + API expansion | ⬜ | ⬜ | ⬜ | |
| Native app wrapper evaluation (Capacitor) | ⬜ | ⬜ | ⬜ | |

---

## Milestones (engineering cadence, PRD §11)

| Window | Goal |
|---|---|
| W1–2 | Packages structure + setting/auth skeleton |
| W3–4 | Attendance core (clock sessions) |
| W5–6 | Geofence + photo + fallback queue |
| W7 | Leave management |
| W8 | Shift + schedules |
| W9 | Holiday + full locations |
| W10 | Reporting + export |
| W11 | Public API v1 |
| W12 | Wizard + polish + hardening |

## Changelog

| Date | Update |
|---|---|
| 2026-08-23 | Tracker created from PRD v1.0; all items ⬜ |
