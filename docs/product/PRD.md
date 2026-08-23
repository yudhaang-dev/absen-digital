# Product Requirements Document — Absen.Digital

| | |
|---|---|
| **Product** | Absen.Digital — SaaS Attendance Management System |
| **Version** | 1.0 (Approved for MVP build) |
| **Date** | 2026-08-23 |
| **Owner** | Product / Technical Lead |
| **Related** | [ADR Index](../architecture/README.md) · [ADRs Summary](../architecture/summaries/decisions-summary.md) |

---

## How to Read This Document

**For humans:** Read Part 1–3 in order. Skip the 🤖 blocks.

**For coding agents:** Do **NOT** load this whole file. Token-cheap strategy:

1. Load `docs/architecture/summaries/decisions-summary.md` (~1.2K tokens) once.
2. Jump to the **one feature section** you are implementing.
3. Each feature has a self-contained **🤖 Agent Context block**: package, tables, dependencies, files, tests. That block + ADR summary is enough context.
4. Never implement features marked `Phase 2` / `Phase 3` when building MVP scope.

Anchor format: `[PRD §6.1]`. Cross-references use these anchors.

---

# PART 1 — PRODUCT OVERVIEW

## 1. Executive Summary

Absen.Digital adalah platform SaaS multi-tenant untuk manajemen kehadiran yang fleksibel dan mudah digunakan oleh **siapa pun** — perusahaan, organisasi pemerintah, sekolah, maupun kelompok kerja.

**Problem:** Solusi attendance yang ada terlalu kaku (verifikasi tunggal), terlalu kompleks (setup berhari-hari), atau terlalu mahal. Organisasi non-korporat hampir tidak terlayani.

**Solution:**

- **Verifikasi configurable per orang, per hari, per lokasi** — kombinasi dari: Geofence (GPS), WiFi SSID, Face Recognition (client-side matching), Photo Capture (tanpa verifikasi) + koordinat.
- **Weekly Schedule Template** — pola mingguan: "Budi Senin di Lokasi A, Shift Lintas Malam, verifikasi Geofence".
- **Fallback yang manusiawi** — verifikasi gagal masuk antrean review backoffice, bukan ditolak mentah.
- **Modul pelengkap:** Holiday, Shift (fixed & flexible), Leave, Business Trip, Overtime, Shift Swap, Multi-Lokasi.
- **Netral domain & netral uang:** attendance = *single source of truth* untuk payroll eksternal. Sistem menghitung **jumlah & durasi, bukan uang**.
- **"Make it Easy":** onboarding < 5 menit sampai kehadiran pertama berhasil.

**North Star Metric:** Time-to-first-successful-attendance **< 5 menit** sejak tenant mendaftar.

## 2. Goals & Success Metrics

### 2.1 Product Goals

| # | Goal | Target |
|---|------|--------|
| G1 | Onboarding super cepat | First successful attendance < 5 min; ≥ 80% tenant menyelesaikan wizard |
| G2 | Fleksibilitas verifikasi | ≥ 40% tenant aktif memakai ≥ 2 metode verifikasi dalam 90 hari |
| G3 | Adopsi lintas entitas | ≥ 25% tenant dari segmen non-perusahaan dalam 12 bulan |
| G4 | Keandalan pencatatan | ≤ 2% kehadiran butuh intervensi manual setelah bulan ke-2 |

### 2.2 Business KPIs

| Metric | Target |
|---|---|
| Trial-to-paid conversion | ≥ 25% |
| Monthly churn (tenant) | < 3% |
| MRR growth | ≥ 15% / month |
| Tenant count | 1.000 dalam 6 bulan |
| DAU/MAU (attendee absen di hari kerja) | ≥ 70% |
| NPS | ≥ 50 |

### 2.3 Non-Goals (Explicit)

- ❌ Payroll/gaji/pajak/currency apa pun. Output hanya jumlah & durasi.
- ❌ Agenda khusus sekolah (jadwal pelajaran, approval ortu). Attendance = regular day check-in/out saja.
- ❌ Project/task timesheet.
- ❌ Hardware fingerprint / access control device.

## 3. User Personas

**P1 — Platform Super Admin (kami):** kelola tenant, langganan, metrik, infrastruktur. Context central DB.

**P2 — Tenant Admin** (HR Manager / Admin Sekolah / IT Officer / Ketua Unit):
Setup lokasi, shift, template jadwal, libur, tipe cuti; import attendee; atur verification policy; tindaklanjuti antrean approval manual; lihat laporan lintas unit + export.

**P3 — Manager / Approver** (pimpinan tim / koordinator):
Approve/reject leave, overtime, swap, attendance fallback; dashboard tim hari ini; reminder approval > 24 jam.

**P4 — Attendee (end user)** — karyawan/guru/staf/anggota:
Check-in/out via PWA mobile (dominan); ajukan leave/overtime/trip/swap; lihat riwayat & saldo cuti sendiri.

**P5 — HR Staff (enterprise):** export ringkasan bulanan untuk payroll eksternal (angka & durasi).

**P6 — Integrator (developer eksternal tenant):** konsumsi Public REST API (profil attendee, summary report).

## 4. Core Concepts & Glossary

| Term | Definisi |
|---|---|
| **Tenant** | Organisasi pelanggan. DB terisolasi sendiri (ADR-0005). |
| **Attendee** | Individu yang mencatat kehadiran (karyawan/guru/staf/anggota). Entitas generik agar netral domain. |
| **Location / Site** | Tempat fisik: koordinat GPS opsional, radius geofence, daftar WiFi, timezone. Banyak per tenant. |
| **Verification Method** | `geofence`, `wifi`, `face`, `photo`, `coordinates`. |
| **Verification Policy** | Kombinasi method + parameter (radius, threshold, liveness) yang wajib saat check-in/out. |
| **Shift** | Jam kerja: **fixed** (start–end) atau **flexible** (durasi terpenuhi dalam window). |
| **Schedule Template** | Pola mingguan Sen–Min: per hari menautkan shift + location + verification policy. |
| **Assignment** | Penempatan Schedule Template ke attendee dengan effective date. |
| **Fallback / Manual Approval** | Verifikasi gagal → antrean review backoffice dengan alasan jelas. |
| **Descriptor** | Vektor embedding wajah 128-dimensi (FaceAPI.js). Bukan foto. Disimpan di server; matching di client. |
| **Liveness Detection** | Anti-spoofing: kedipan/gerakan kepala sebelum matching face. |
| **Business Trip** | Mode dinas: verifikasi ketat nonaktif → foto + koordinat saja. |
| **Overtime Cap** | Batas maksimal lembur per hari & per bulan (configurable). |
| **Leave Balance Period** | Periode reset saldo cuti milik tenant (kalender/tahun kerja/custom date). |
| **Approval Task** | Item antrean approval unified (attendance fallback, leave, overtime, swap). |

## 5. Product Principles — "Make it Easy"

1. **Smart Defaults.** Setelah signup tenant langsung punya: 1 lokasi contoh, 3 shift standar (Pagi/Sore/Malam), 4 tipe cuti preset (Cuti Tahunan/Sakit/Izin/Cuti Melahirkan), policy default = **Photo + Coordinates** (gesekan terendah). Pengamanan (Geofence/Face) adalah upgrade, bukan syarat awal.
2. **5-Minute Onboarding Wizard.** Alur linear: Info organisasi → Lokasi pertama → Shift → Import attendee → Assign jadwal → Absen pertama. Semua step bisa di-skip.
3. **Progressive Disclosure.** Fitur advanced (hierarki, threshold face, API key) tersembunyi sampai dibutuhkan.
4. **Fail Gracefully.** Gagal verifikasi ≠ gagal absen. Attendee selalu dapat bukti pengajuan; admin dapat warning list yang bisa ditindaklanjuti.
5. **Mobile-First PWA.** Tombol besar "CHECK IN"; permission kamera/GPS diminta tepat waktu, bukan di depan.
6. **One Approval Inbox.** Satu antrean unified untuk semua approval, dengan batch approve dan reminder otomatis.

---

# PART 2 — MVP FEATURES (Phase 1)

> Tier legend: **[S]** = Starter · **[P]** = Professional · **[E]** = Enterprise. Fitur tanpa tag = semua tier.

## 6.1 Attendance & Verification

Core capability: check-in/check-out dengan verifikasi configurable.

### 6.1.1 Clock In / Clock Out

- Attendee menekan satu tombol besar; sistem resolve **effective verification policy** untuk (attendee, tanggal, jam) lalu menjalankan langkah verifikasi berurutan.
- Business rules:
  - Tidak boleh double check-in di hari yang sama (kecuali shift lintas malam — lihat bawah).
  - Check-out harus > check-in.
  - Grace period telat: default 15 menit, configurable per tenant.
  - Shift lintas malam (*overnight*, melewati tengah malam): attendance dicatat sebagai satu sesi dengan `shift_date` = tanggal mulai shift.
  - Auto-checkout: **default OFF**. Jika diaktifkan tenant, job malam menutup sesi dan menandai task review "missing checkout".

🤖 **Agent Context — Attendance Core**
- Package: `packages/attendance/` (Tenant context)
- Tables: `attendances` (id, employee_id, location_id nullable, shift_id nullable, schedule_date, checked_in_at, checked_out_at nullable, late_minutes, early_leave_minutes, worked_minutes, status enum: pending_review/approved/rejected/auto_closed, source enum: web/pwa/api), `attendance_verifications` (id, attendance_id nullable, employee_id, attempted_at, method enum, result enum: passed/failed/skipped, detail json)
- Depends on: shared, setting, shift (schedules), location
- Services: `AttendanceService::clockIn(ClockInData)`, `AttendanceService::clockOut(...)`, `PolicyResolver::resolveFor(employee, at)` (lihat §6.1.6), `GeofenceValidator`, `WifiValidator`
- Events: `AttendanceCheckedIn`, `AttendanceFlaggedForReview`
- Frontend feature: `features/attendance/` (hook `useClock`, komponen `ClockButton`, `VerificationFlow`)
- Tests (Feature): clock in happy path per method; double check-in ditolak; overnight shift; auto-close job; fallback → `pending_review`.

### 6.1.2 Geofence Verification [S]

- Admin set koordinat + radius per lokasi (50–500 m).
- Browser minta izin GPS saat check-in; frontend kirim `{lat, lng, accuracy}`; backend validasi jarak Haversine ≤ radius.
- Edge cases:
  - GPS tidak tersedia/ditolak → attempt gagal → masuk fallback queue (reason: `gps_unavailable`).
  - Akurasi GPS buruk (> 50 m) → tetap diproses tapi ditandai; jika gagal → reason `low_accuracy`.
  - GPS drift indoor → margin +20 m dari radius.

### 6.1.3 WiFi Verification [P]

- Admin registrasi SSID (+BSSID opsional) per lokasi.
- Deteksi via Network Information API (Chrome/Android). Safari/iOS tidak expose SSID → fallback UX: attendee memilih/mengisi nama WiFi yang tampil, admin memverifikasi via fallback queue bila diragukan.
- Kombinasi disarankan: WiFi + Geofence untuk anti-spoofing.

### 6.1.4 Photo Capture [S]

- Selfie wajib saat check-in/out bila policy mensyaratkan; **tanpa verifikasi biometrik**.
- Kamera via `getUserMedia()`; preview sebelum submit; compress client-side ke JPEG ≤ 500 KB (Canvas API); simpan ke cloud storage (S3-compatible); hapus metadata EXIF lokasi asli (koordinat dicatat terpisah sebagai field).
- Retensi foto mengikuti setting tenant (default 90 hari).

### 6.1.5 Coordinate Capture

- Selalu dilakukan bila GPS tersedia (terlepas dari metode): simpan lat/lng/accuracy pada attendance. Ditampilkan di backoffice dengan map embed + reverse geocoding.

### 6.1.6 Effective Policy Resolution (algoritma kunci)

Urutan resolve policy verifikasi pada saat clock:

1. **Trip aktif?** (Phase 2) → downgrade ke `photo+coordinates`.
2. **Schedule exception** tanggal itu ada? → pakai exception policy.
3. **Assignment schedule template** aktif → policy hari itu.
4. Location default policy (bila location diketahui).
5. Tenant default policy.

Hasil resolve disimpan pada attendance (`effective_policy` json) untuk audit.

### 6.1.7 Fallback & Manual Approval Queue

- Setiap attempt verifikasi tercatat di `attendance_verifications`. Jika ≥ 1 method required gagal:
  - Attendance dibuat dengan `status = pending_review`, lengkap dengan alasan tiap method.
  - Attendee menerima konfirmasi "pengajuan terkirim, menunggu persetujuan".
- Backoffice **Warning List**: daftar `pending_review` + `auto_closed` + anomali (telat > X, accuracy buruk), sortable, batch approve/reject dengan catatan.
- Keputusan → notify attendee (in-app push PWA).
- Reminder otomatis ke approver jika task menunggu > 24 jam.

## 6.2 Weekly Schedule Template

Model inti fleksibilitas. Contoh nyata:
- *Budi, Senin: Lokasi A + Shift Lintas Malam + verifikasi Geofence.*
- *Andi, Senin: mana pun + Shift Pagi + hanya photo & coordinate.*

### Spec

- **Shift Definition** [S]: name, type fixed/flexible, start/end time (fixed), break minutes, grace minutes; flexible: window start/end + required duration (menit) + min duration sebelum boleh check-out.
- **Schedule Template**: name + 7 baris hari (Sen–Min). Tiap hari: shift (nullable = libur), location (nullable = "mana pun"), policy override (nullable = ikut location/tenant default).
- **Assignment**: template → attendee(s), effective_from (dan effective_to opsional). Riwayat assignment disimpan (audit).
- **Exception**: override spesifik per attendee per tanggal (mis. event sekolah), dibuat admin.
- Copy template, duplikasi minggu, bulk assign per grup (Phase 2 pakai hierarchy).

🤖 **Agent Context — Scheduling**
- Package: `packages/shift/` (definitions + templates + assignments + exceptions)
- Tables: `shift_definitions`, `schedule_templates`, `schedule_template_days` (template_id, weekday 0–6, shift_id nullable, location_id nullable, policy_override json nullable), `employee_schedule_assignments` (employee_id, template_id, effective_from, effective_to nullable), `schedule_exceptions` (employee_id, date, shift_id nullable, location_id nullable, policy_override json nullable, note)
- Resolver query: exception(date) > assignment(effective range) > null
- Services: `ScheduleService::resolveDay(employee, date): ResolvedDay(shift?, location?, policy?)`
- Tests: overnight shift resolve; assignment overlap (yang terbaru menang); exception meng-override assignment; hari libur template.

## 6.3 Multi-Location / Sites [S: 1 lokasi · P: unlimited]

- Fields: name, address, lat/lng optional, geofence radius, timezone (default = tenant tz), WiFi list, default policy, active flag.
- CRUD + peta picker di backoffice.
- Attendee dengan schedule "mana pun" boleh check-in di lokasi manapun yang aktif (lokasi tercatat dari resolve GPS/WiFi terbaik, atau manual pilih).

🤖 **Agent Context — Locations**
- Package: `packages/location/`
- Tables: `locations`, `location_wifi_networks` (location_id, ssid, bssid nullable)
- Depends: shared, setting. Consumed by: attendance (geofence/wifi validation).

## 6.4 Holiday Calendar

- Manual add: date, name, recurring annually (optional), location-scoped atau tenant-wide.
- Preset nasional Indonesia (importable list per tahun).
- Efek: hari libur tidak dihitung absent bagi yang template-nya libur; report menandai `holiday_count`; leave yang jatuh di holiday tidak memotong saldo (rule per tipe cuti, default: tidak memotong).

## 6.5 Leave Management

### 6.5.1 Leave Type Master (configurable)

Fields: name, code, color, `reduces_balance` (bool), `paid` (bool — mempengaruhi benefit/upah di payroll eksternal), requires_approval (bool), attachment_required (bool), max_consecutive_days nullable.

Preset saat onboarding:

| Preset | reduces_balance | paid |
|---|---|---|
| Cuti Tahunan | ✅ | ✅ |
| Sakit | ✅ (jika ada kuota) | ✅ |
| Izin (Unpaid) | ❌ | ❌ |
| Cuti Melahirkan | ❌ | ✅ |

### 6.5.2 Balance & Period

- **Balance period milik tenant**: `calendar_year` | `employment_anniversary` | `custom_date` (tanggal reset ditentukan tenant).
- Default balance per type; bisa di-override per attendee (senioritas).
- Carryover opsional per type (max N hari), dieksekusi job pada tanggal reset.
- Tampilan saldo: granted / used / carried_over / remaining.
- Leave disetujui memotong saldo hanya bila type `reduces_balance`; hari holiday dalam rentang cuti tidak dipotong (default).

### 6.5.3 Request & Approval

- Attendee pilih type + range tanggal (+half-day opsional) + catatan + lampiran.
- Validasi: saldo cukup (bila reduces_balance), tidak overlap leave lain, max_consecutive_days.
- Approval MVP: single-level (manager). Approve → potong saldo; Reject → wajib catatan.
- Batal oleh attendee sebelum start date; setelah approve hanya admin.

🤖 **Agent Context — Leave**
- Package: `packages/leave/`
- Tables: `leave_types`, `leave_balances` (employee_id, leave_type_id, period_start, period_end, granted, used, carried_over), `leave_requests` (employee_id, leave_type_id, start_date, end_date, half_day bool, note, attachment_path nullable, status enum pending/approved/rejected/cancelled, approver_id, decided_at)
- Jobs: `ResetLeaveBalancesJob`, `CarryOverJob`
- Depends: shared, setting (period config), employee
- Tests: potong saldo hanya untuk reduces_balance; reset custom date; carryover cap; overlap ditolak; approve baru memotong saldo.

## 6.6 Basic Reporting

**Prinsip: counting & duration only — tanpa currency.**

### Employee self-service
Riwayat kehadiran 30 hari; saldo cuti; libur mendatang; status pengajuan.

### Manager dashboard
Tim hari ini: hadir/terlambat/absen/belum check-out; jumlah approval inbox; tren telat 7 hari.

### Admin reports + export
- **Monthly attendance summary** per attendee: present_days, absent_days, late_count, late_minutes_total, worked_hours_total, leave days per type (paid/unpaid split). Kolom overtime/trip muncul otomatis saat fitur Phase 2 aktif.
- **Daily log**: check-in/out time, lokasi, status.
- **Leave utilization**: granted vs used vs remaining.
- Export CSV/XLSX/PDF.

## 6.7 Tenant Settings

Key settings (typed, grouped):
- General: nama organisasi, locale UI (**id** default, en tersedia), timezone default.
- Attendance: grace minutes, auto-checkout on/off, photo retention days, GPS accuracy threshold.
- Verification defaults: policy JSON default tenant.
- Leave: balance period mode + custom reset date.
- Overtime caps (Phase 2): daily max, monthly max.
- Advanced toggle: Basic/Advanced setup mode.

🤖 **Agent Context — Settings**
- Package: `packages/setting/` — typed settings repository (bukan key-value string mentah): `TenantSettings` DTO + `SettingsRepository`.
- Table: `settings` (key, value json, group). Cached per request.
- Setting adalah dependency hampir semua package → definisikan kontrak lebih dulu.

## 6.8 Auth, Roles & Employee

- Laravel auth + spatie/laravel-permission (sudah ada di composer).
- Role MVP per tenant: `admin`, `manager`, `attendee`. Platform: `super_admin` di central context.
- **Employee** = profil attendance user: user_id, employee_no, name, phone optional, location default nullable, join_date, active flag, manager_id nullable (approval routing; hierarchy penuh = Phase 3).
- Import CSV (template download) + invite via link/email.

🤖 **Agent Context**
- Package: `packages/employee/` + `packages/auth/`
- Tables: `employees` (tenant DB); roles via spatie team-scoped per tenant.
- Tests: tenant isolation — employee tenant A tak terlihat dari tenant B (priority test, ADR-0006).

## 6.9 Public REST API (MVP scope)

Scope dibatasi sesuai keputusan produk: **profil attendee + summary report**.

```
GET /api/v1/attendee/profile          # attendee pemilik token
GET /api/v1/reports/attendance-summary?from=&to=
```

- Auth: Bearer token per integrator (scoped read-only).
- Rate limit: 100 req/min/token.
- Format: JSON; waktu ISO-8601 UTC (client convert).
- Versioning path `/v1/`; error konsisten `{message, code, errors?}`.

🤖 **Agent Context — API**
- Package: `packages/api/` — routes terpisah, middleware tenancy + token auth.
- Dependency perlu diputuskan dulu (sanctum vs token table sederhana) via ADR mini sebelum implement.
- Docs: OpenAPI spec statis (generate otomatis = Phase 2).

## 6.10 Onboarding Wizard ("5 menit")

Step linear (semua skippable):
1. Info organisasi → tenant provisioning (DB create, migrate, seed defaults).
2. Lokasi pertama (nama + alamat; koordinat optional).
3. Shift standar auto-created (Pagi/Sore/Malam, editable).
4. Import attendee (CSV/manual; minimal 1).
5. Assign template default (Sen–Jum Shift Pagi @ Lokasi 1, policy Photo+Coordinates).
6. Test absen pertama (deep-link PWA ke HP attendee).

Provisioning tenant = critical path: idempotent, < 60 detik.

---

# PART 3 — POST-MVP FEATURES

## 7.1 Face Recognition (Phase 2) [P]

### Enrollment
1. Attendee rekam 3–5 selfie (variasi sudut/cahaya) via guided flow PWA.
2. Frontend (face-api.js — SSD MobileNet detection + 128-d descriptor) extract descriptor **di device**.
3. Hanya descriptor (bukan foto) dikirim & disimpan server (`face_profiles.descriptors` json).
4. Re-enrollment didukung (wajah berubah, ganti device, dsb.).

### Verification at clock-in
1. Liveness challenge dulu (intensity configurable): blink detection + head turn random.
2. Frontend fetch descriptors milik sendiri dari server → matching Euclidean distance **client-side**.
3. Threshold default **0.6**, configurable per tenant (0.5 ketat – 0.7 longgar).
4. Pass → face lolos. Fail → fallback queue (`face_mismatch`) + warning list backoffice.

### Privacy & security
- Foto enrollment tidak disimpan permanen (opsional 1 referensi terenkripsi).
- Descriptor encrypted-at-rest; consent eksplisit saat enrollment; hapus data saat offboard (GDPR/UU PDP style).
- Matching client-side → biometrik raw tidak transit jaringan tiap absen.

🤖 **Agent Context — Face Recognition**
- Package: `packages/face-recognition/`
- Table: `face_profiles` (employee_id, descriptors json, enrolled_at, consented_at)
- Endpoints: `POST /face/enroll`, `GET /face/descriptors/me`, `DELETE /face/me`
- Backend TIDAK melakukan matching (client-side by design); server menyimpan + audit saja.
- Frontend: `features/face-recognition/` — lazy-load face-api.js (~50KB gz) hanya di halaman enroll/clock-face; models via CDN + SW cache.
- Tests: enrollment flow (mock descriptors), efek threshold config, consent wajib, delete saat offboard.

## 7.2 Overtime Management (Phase 2)

- **Pre-approved:** ajukan (tanggal, jam rencana, alasan) → manager approve → kerja → rekonsiliasi jam aktual dari attendance.
- **Post-submission:** kerja dulu → submit claim → manager verify → approve.
- Keduanya **valid hanya jika manager approve**.
- **Cap configurable per tenant:** max harian (default 4 jam) & bulanan (default 20 jam); warn saat mendekati, block saat lewat (override admin).
- Report: `overtime_hours_approved` masuk summary bulanan.

🤖 **Agent Context — Overtime**
- Package: `packages/overtime/`
- Table: `overtime_requests` (employee_id, date, planned_start/end nullable, actual_start/end nullable, type enum pre/post, reason, status pending/approved/rejected, approver_id, approved_minutes)
- Cap validation di Service sebelum save; link ke attendances via employee+date.

## 7.3 Business Trip Mode (Phase 2)

- Manager/admin buat trip: employee(s), date range, tujuan (teks + koordinat optional), catatan.
- Selama trip: effective policy otomatis downgrade ke **photo + coordinates** (langkah 1 di §6.1.6); geofence/wifi/face tercatat `skipped`.
- Report: `trip_days` per attendee. Tanpa finansial sama sekali.

## 7.4 Shift Swap (Phase 2)

Flow dua tingkat:
1. Attendee A ajukan swap shift tanggal D ↔ B (pilih dari rekan sekolah/lokasi kompatibel).
2. **Peer approval:** B accept/reject.
3. **Manager approval:** final gate.
4. Approved → tukar assignment efektif tanggal D (pair schedule_exceptions), notify keduanya.

Validasi: tidak overlap leave/trip milik B; shift lewat tidak bisa diajukan; notice maksimal 7 hari sebelum tanggal.

🤖 **Agent Context — Swap**
- Package: `packages/shift/` (subdomain Swap)
- Table: `shift_swaps` (requester_id, target_id, date, requester_shift_id, target_shift_id nullable, status pending_peer/pending_manager/approved/rejected/cancelled, peer_decided_at, manager_decided_at)

## 7.5 Advanced Reporting & Exports (Phase 2)

- Scheduled email report mingguan/bulanan ke admin.
- Template laporan payroll-ready (angka & durasi).
- Filter lintas lokasi + periode custom + comparison YoY sederhana.

---

# PART 4 — NON-FUNCTIONAL, BUSINESS & APPENDIX

## 8. Technical Architecture (high-level)

Mengikuti ADR yang sudah accepted — tidak ada deviasi:

| Concern | Keputusan | ADR |
|---|---|---|
| Business logic | Service-Repository (thin controller) | ADR-0001 |
| Organisasi kode | Package-based `packages/{domain}/` | ADR-0002 |
| Frontend | Feature modules mirror packages | ADR-0003 |
| UI Stack | Inertia.js + React 19 + TS + Tailwind + shadcn/ui | ADR-0004 |
| Multi-tenancy | Database per tenant (stancl/tenancy), domain-based | ADR-0005 |
| Testing | Phase-based; feature-first; 60–70% target | ADR-0006 |
| Type safety | spatie/laravel-data → TypeScript generate | ADR-0007 |
| Naming | PSR-12 / Airbnb React / snake_case DB | ADR-0008 |

**Package map (target penuh):**

| Fase | Packages |
|---|---|
| Phase 1 (MVP) | `shared`, `auth`, `setting`, `employee`, `location`, `shift` (+schedules), `attendance`, `leave`, `holiday`, `reporting`, `api` |
| Phase 2 | `subscription`, `tenancy`, `face-recognition`, `overtime`, `business-trip`, (`swap` di dalam shift) |
| Phase 3 | `organization` (hierarki), `analytics`, `integration` (SSO/webhook) |

> Urutan implementasi package mengikuti dependensi: shared → setting → auth/employee → location/shift/holiday → attendance → leave → reporting → api.

## 9. Non-Functional Requirements

### Performance
Page load < 2 s (p95); clock-in end-to-end < 2 s; face match < 3 s (device-dependent); geofence validation < 1 s; API < 500 ms.

### Scalability
Target 10.000 tenant; 100.000 attendee per tenant; 10 juta record attendance/bulan. DB per tenant → horizontal sharding saat dibutuhkan.

### Security
TLS only; bcrypt 12; 2FA TOTP opsional; descriptor encrypted-at-rest; rate limit API; audit log untuk semua keputusan approval.

### Privacy & Compliance
Biometrik: consent eksplisit, retensi configurable, right-to-deletion. Selaras GDPR/UU PDP. Data tenant terisolasi fisik per DB.

### Platform Support
PWA installable (Chrome/Edge/Safari 17+); Android 12+/iOS 16+; GPS accuracy min 20 m; kamera min 640×480.
Offline: antrian check-in offline + sync = **enhancement Phase 2** (bukan MVP).

### i18n & Timezone
Kode & identifier: English. UI display: Bahasa Indonesia default (en tersedia). Waktu disimpan UTC; ditampilkan sesuai timezone lokasi/user; report mengikuti timezone tenant.

## 10. Subscription & Pricing

Per **user/month**, feature tier:

| | Starter $2 | Professional $5 | Enterprise Custom |
|---|---|---|---|
| Attendance Geofence + Photo + Coordinates | ✅ | ✅ | ✅ |
| WiFi verification | — | ✅ | ✅ |
| Face Recognition (saat rilis Phase 2) | — | ✅ | ✅ |
| Leave management | ✅ | ✅ | ✅ |
| Shift fixed | ✅ | ✅ | ✅ |
| Shift flexible + Swap | — | ✅ | ✅ |
| Overtime + Business Trip | — | ✅ | ✅ |
| Locations | 1 | Unlimited | Unlimited |
| Reporting | Basic | Advanced + export | Advanced |
| Public API | — | ✅ | ✅ |
| SSO / Audit trail / SLA 99.9% | — | — | ✅ |

**Trial:** 14 hari full Professional. Untuk kebutuhan migrasi dari sistem lama: extended migration trial (import data historis, onboarding assist).

## 11. Roadmap

| Fase | Periode | Scope |
|---|---|---|
| **MVP** | Bulan 1–3 | Tenant provisioning + wizard; attendance (geofence/wifi/photo/coords) + fallback queue; schedule template; shift fixed+flexible; location; holiday; leave; basic reporting + export; roles; REST API v1 (profil + summary) |
| **Phase 2** | Bulan 4–6 | Face recognition + liveness; overtime; business trip; shift swap; advanced reporting; billing/subscription (packages subscription+tenancy); offline PWA |
| **Phase 3** | Bulan 7–9 | Organization hierarchy; advanced analytics; SSO; audit trail penuh; webhooks + API expansion; native app wrapper (Capacitor) evaluasi |

Prioritas engineering MVP (mingguan): W1–2 struktur packages + setting/auth; W3–4 attendance core; W5–6 geofence+photo+fallback; W7 leave; W8 shift+schedules; W9 holiday+location lengkap; W10 reporting+export; W11 API; W12 wizard+polish+hardening.

## 12. Risks & Mitigations

| Risk | Dampak | Mitigasi |
|---|---|---|
| GPS spoofing / mock location | Kehadiran palsu | Deteksi sinyal mock (Android), catat accuracy, kombinasi WiFi+Geofence, warning list review |
| WiFi SSID mudah dipalsukan | Verifikasi lemah | Positioning sebagai convenience, bukan keamanan tunggal; dorong kombinasi |
| Face false accept/reject | Kepercayaan user | Threshold configurable, liveness, fallback manual selalu tersedia |
| GPS indoor drift | Check-in gagal | Margin +20 m, reason `low_accuracy`, fallback |
| Kompleksitas konfigurasi | Adopsi rendah | Wizard 5 menit, smart defaults, progressive disclosure |
| Skeptisisme privasi wajah | Penolakan fitur | Client-side matching, consent, deletion rights; face selalu optional |
| Provisioning tenant lambat/gagal | Churn dini | Idempotent provisioning job + health check + alerting |

---

# APPENDIX

## A. Data Model Overview

**Central DB (`abdigi_central`)**: tenants, domains, plans, plan_prices, subscriptions *(subscription tables dipakai sejak Phase 2 billing; struktur sudah dirancang ADR-0005)*.

**Tenant DB (`absen_digital_tenant_{uuid}`)** — per package:

| Package | Tables |
|---|---|
| setting | settings |
| employee | employees |
| location | locations, location_wifi_networks |
| shift | shift_definitions, schedule_templates, schedule_template_days, employee_schedule_assignments, schedule_exceptions, shift_swaps* |
| attendance | attendances, attendance_verifications |
| leave | leave_types, leave_balances, leave_requests |
| holiday | holidays |
| approval (shared service) | approval_tasks |
| face-recognition* | face_profiles |
| overtime* | overtime_requests |
| business-trip* | trips |
| organization* | organization_units |

(*= Phase 2/3)

Konvensi penamaan tabel/kolom mengikuti ADR-0008. Semua migrasi tenant di `database/migrations/tenant/`.

## B. Coding Agent Implementation Guide

### B.1 Reading Protocol (hemat token)

0. Entry point: `AGENTS.md` di repo root — rules ringkas untuk agent, dibaca otomatis tiap sesi baru.
1. `docs/architecture/summaries/decisions-summary.md` (~1.2K tok) — sekali di awal sesi.
2. Buka HANYA section fitur [PRD §x.y] yang dikerjakan + blok 🤖-nya.
3. Jangan baca Part 1 (narasi produk) saat coding — tidak dibutuhkan.
4. Satu PR = satu sub-feature dari satu package.

### B.2 Implementation Checklist (per feature)
```
1. Migration        database/migrations/tenant/{table}.php
2. Model            packages/{pkg}/src/Models/{Entity}.php
3. DTO              packages/{pkg}/src/DataTransferObjects/{Entity}Data.php
4. Action/Service   packages/{pkg}/src/{Actions|Services}/...
5. Controller       app/Http/Controllers/Tenant/... (thin, ≤20 baris/method)
6. Routes           routes/tenant.php (Wayfinder)
7. Frontend         features/{feature}/ + pages/ thin (≤30 baris)
8. Types            php artisan typescript:generate
9. Tests            packages/{pkg}/tests/Feature/{Feature}Test.php
10. Lint+Stan       ./vendor/bin/pint && ./vendor/bin/phpstan analyse
```

### B.3 Prompt Template (contoh: Geofence Verification)
```
Implement Geofence Verification [PRD §6.1.2].

Context:
- ADR-0001 Service-Repository, ADR-0002 package-based, DB per tenant (ADR-0005)
- Package: packages/attendance/
- Tables: locations(lat,lng,radius_m), attendances, attendance_verifications
- Logic: Haversine distance ≤ radius + 20m margin; accuracy>50m → flag low_accuracy;
  no GPS → attempt failed reason gps_unavailable → attendance pending_review
- Out of scope: wifi, face, photo compression detail

Acceptance criteria:
- In-radius check-in passes; out-radius fails with reason
- Failed attempt creates pending_review attendance + verification log row
- Feature test covers pass/fail/no-gps paths

Follow ADR-0008 naming. Write Pest feature tests (ADR-0006).
Do NOT implement WiFi/Face/Photo methods in this PR.
```

### B.4 Definition of Done (per feature)
- [ ] Acceptance criteria terpenuhi + feature tests hijau
- [ ] pint + phpstan + tsc lolos
- [ ] Tidak ada dependency lintas domain package (kecuali via contract di `shared`)
- [ ] Settings baru masuk `TenantSettings` DTO (bukan hardcode)

## C. Out of Scope (tidak dibangun)

Payroll/uang/pajak · timesheet per task · jadwal pelajaran sekolah · approval orang tua · hardware biometric · mobile native (MVP) · multi-level org chart (MVP) · white-label custom domain Enterprise (evaluasi Phase 3).

---

*End of document. Perubahan besar terhadap scope MVP harus melalui revisi dokumen ini (version bump + changelog di bawah).*

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 2026-08-23 | Draft awal approved for build |


