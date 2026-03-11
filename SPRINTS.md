# Sprint Roadmap

---

## Sprint 1 — CRUD Completeness + Project Hierarchy ✅ COMPLETED

Foundation work that everything else depends on.

### Deliverables

| Task | Status | Details |
|---|---|---|
| Edit/delete bids | ✅ Done | PATCH & DELETE on `/api/bids/[id]` — edit title, description, deadline, status, project_id |
| Bid status lifecycle | ✅ Done | `draft → active → closed → awarded` with validation |
| Project layer (DB + API) | ✅ Done | `projects` table with FK `bids.project_id → projects.id` (ON DELETE SET NULL) |
| Project CRUD | ✅ Done | GET/POST `/api/projects`, GET/PATCH/DELETE `/api/projects/[id]` |
| Sidebar project → bids tree | ✅ Done | Expandable project accordion in customer layout, bids grouped under projects |
| Dashboard grouped by projects | ✅ Done | KPI cards (Active Projects, Open Bids, Responses, Rate) + project accordion with bid tables |
| New Project page | ✅ Done | Full form (name, address, type, description) posting to `/api/projects` |
| Create Bid with project selector | ✅ Done | Dropdown to assign bid to project, reads `?project=` from URL |
| Vercel deployment fix | ✅ Done | Resolved Proxy private-member error with `@libsql/client` on serverless runtime |

### Key Technical Decisions

- **Lazy DB initialization**: `db()` returns the real `@libsql/client` Client (no Proxy) — avoids build-time connection errors and Vercel private-member issue
- **Schema migrations**: Individual `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE` with try/catch for Turso compatibility
- **Test isolation**: Vitest + in-memory `better-sqlite3` — 119 tests, 7 test files, ~230ms total

### Files Changed

| File | What |
|---|---|
| `src/lib/db.ts` | Lazy client init, projects table, migrations |
| `src/app/api/projects/route.ts` | GET (list with bid_count), POST |
| `src/app/api/projects/[id]/route.ts` | GET (project + bids), PATCH, DELETE |
| `src/app/api/bids/route.ts` | Updated POST with `project_id`, `status` |
| `src/app/api/bids/[id]/route.ts` | Added PATCH (edit) and DELETE (cascade) |
| `src/app/customer/layout.tsx` | Sidebar with project tree, expand/collapse |
| `src/app/customer/page.tsx` | Dashboard with KPI cards + project accordion |
| `src/app/customer/create/page.tsx` | Project selector dropdown |
| `src/app/customer/new-project/page.tsx` | Full project creation form |
| `src/app/customer/[id]/page.tsx` | Status dropdown + delete button |
| `tests/helpers/test-db.ts` | `seedProject`, updated `seedBid` with status/project_id |
| `tests/system/projects-crud.test.ts` | 11 tests for project CRUD |
| `tests/system/bids-crud.test.ts` | 23 tests (includes status, project_id, edit, delete) |
| `tests/system/schema-integrity.test.ts` | 26 tests (includes projects table) |

### Test Coverage

```
 ✓ projects-crud.test.ts        11 tests
 ✓ bids-crud.test.ts            23 tests
 ✓ schema-integrity.test.ts     26 tests
 ✓ vendor-responses.test.ts     13 tests
 ✓ price-comparison.test.ts      6 tests
 ✓ discount-rules.test.ts       18 tests
 ✓ file-attachments.test.ts     22 tests
   ─────────────────────────────────
   Total                        119 tests — all passing
```

### Commits

```
43da883 Sprint 1: Add project hierarchy, bid CRUD, and status management
9e794f2 Fix PRAGMA foreign_keys for Turso compatibility
3551b33 Run schema init statements individually for Turso compatibility
1a45f6e Add error details to projects API response for debugging Vercel 500
a274e94 Fix Vercel 500: replace Proxy with direct getClient() calls
```

---

## Sprint 2 — Vendor Management ✅ COMPLETED

Enables the invite flow that makes the platform useful.

### Deliverables

| Task | Status | Details |
|---|---|---|
| `vendors` table | ✅ Done | Full profile: name, email, cc_emails, phone, contact_person, trade_category FK, website, license, notes, status (active/suspended/removed) |
| `trade_categories` table + 25 defaults | ✅ Done | 4 groups: Structure (7), MEP (6), Finishes (8), Site (4). Supports custom categories |
| `bid_invitations` table | ✅ Done | Per-vendor unique token, status lifecycle (pending → opened → submitted/declined/expired) |
| `vendor_responses.vendor_id` FK | ✅ Done | New column with migration for existing rows |
| Vendor CRUD API | ✅ Done | GET/POST `/api/vendors`, GET/PATCH/DELETE `/api/vendors/[id]` — soft-delete, trade filtering, duplicate email guard (409) |
| Trade categories API | ✅ Done | GET `/api/trade-categories`, POST for custom categories (unique name enforced) |
| CSV import API | ✅ Done | POST `/api/vendors/import` — case-insensitive trade matching, returns `{ created, errors[] }` |
| Bid invitation API | ✅ Done | GET/POST `/api/bids/[id]/invite` — generates unique tokens, prevents duplicate invites |
| Token-based submission API | ✅ Done | GET `/api/vendor-submit/[token]` loads bid + params. POST submits prices, marks invitation as submitted |
| Vendors management page | ✅ Done | List, search, filter by trade, add vendor modal, CSV import modal, suspend/remove actions |
| Invite vendors from bid detail | ✅ Done | Vendor picker (excludes already-invited), invitation status table, copy share link |
| Vendor submission page | ✅ Done | Public `/vendor-submit/[token]` — branded form, price grid for all combinations, thank-you on submit, expired/already-submitted guards |

### Key Technical Decisions

- **No-login vendor model**: Vendors access bids via unique UUID tokens — no account required (core SRS differentiator)
- **Soft-delete vendors**: Status set to `removed` rather than hard delete — preserves historical bid data
- **Token lifecycle**: pending → opened (on GET) → submitted (on POST). Expired if past bid deadline or bid not active
- **CSV import**: Server-side parsing with case-insensitive trade matching, duplicate email detection, per-row error reporting
- **25 default trade categories**: Seeded via `INSERT OR IGNORE` in `initializeDatabase()` — idempotent across deploys

### Schema Diagram

```
projects 1──∞ bids 1──∞ bid_invitations ∞──1 vendors
                │                                │
                ∞                                │
          vendor_responses ──────────────────────┘
                │                          (vendor_id FK)
                ∞
          vendor_prices

trade_categories 1──∞ vendors (trade_category FK)
```

### Files Changed

| File | What |
|---|---|
| `src/lib/db.ts` | Added vendors, trade_categories, bid_invitations tables + vendor_id migration + default category seeding |
| `src/app/api/vendors/route.ts` | GET (list with trade join, filter by status/trade), POST (create with unique email) |
| `src/app/api/vendors/[id]/route.ts` | GET (single with trade join), PATCH (update any field), DELETE (soft-delete) |
| `src/app/api/vendors/import/route.ts` | POST (bulk import from parsed CSV rows) |
| `src/app/api/trade-categories/route.ts` | GET (list all), POST (create custom) |
| `src/app/api/bids/[id]/invite/route.ts` | GET (list invitations), POST (create invitations with unique tokens) |
| `src/app/api/vendor-submit/[token]/route.ts` | GET (validate token, return bid), POST (submit prices, update invitation) |
| `src/app/customer/vendors/page.tsx` | Full vendor management UI (was void placeholder) |
| `src/app/customer/[id]/page.tsx` | Added invite button, invitation table, copy link, vendor picker modal |
| `src/app/vendor-submit/[token]/page.tsx` | New public submission page with branded header, price grid, deadline countdown |
| `tests/helpers/test-db.ts` | Added 3 new tables + `seedTradeCategory`, `seedVendor`, `seedBidInvitation` helpers |
| `tests/system/vendors-crud.test.ts` | 12 tests: create, read, update, suspend, reactivate, soft-delete, trade FK |
| `tests/system/trade-categories.test.ts` | 7 tests: defaults, groups, custom, unique names, vendor association |
| `tests/system/vendor-import.test.ts` | 8 tests: valid import, case matching, missing fields, duplicates, unknown trades |
| `tests/system/bid-invitations.test.ts` | 13 tests: create, unique tokens, status transitions, token lookup, cascade deletes |
| `tests/system/vendor-submit.test.ts` | 9 tests: valid submit, vendor_id link, prices stored, reject invalid/duplicate/expired |

### Test Coverage

```
 ✓ vendors-crud.test.ts          12 tests
 ✓ trade-categories.test.ts       7 tests
 ✓ vendor-import.test.ts          8 tests
 ✓ bid-invitations.test.ts       13 tests
 ✓ vendor-submit.test.ts          9 tests
 ✓ projects-crud.test.ts         11 tests
 ✓ bids-crud.test.ts             23 tests
 ✓ schema-integrity.test.ts      26 tests
 ✓ vendor-responses.test.ts      13 tests
 ✓ price-comparison.test.ts       6 tests
 ✓ discount-rules.test.ts        18 tests
 ✓ file-attachments.test.ts      22 tests
   ─────────────────────────────────
   Total                         168 tests — all passing
```

### Commits

```
337d09c Plan Sprint 2: Vendor Management with 22 tasks across 4 phases
8ee4d52 Sprint 2: Vendor management, invitations, and token-based submissions
```

---

## Sprint 3 — Winner Selection + Email + Export

Closes the bid lifecycle loop — from invite to award.

### Phase 1 — DB & Winner Logic

| # | Task | Details | Files |
|---|---|---|---|
| 1 | `bid_winners` table | id, bid_id FK (unique), vendor_id FK, vendor_response_id FK, selected_at, notes | `src/lib/db.ts` |
| 2 | Winner selection API | POST `/api/bids/[id]/winner` — set winner, update bid status to `awarded`, create `bid_winners` row. GET to retrieve current winner | `src/app/api/bids/[id]/winner/route.ts` |
| 3 | Finalize bid API | POST `/api/bids/[id]/finalize` — lock bid (status → `awarded`), prevent further submissions, expire pending invitations | `src/app/api/bids/[id]/finalize/route.ts` |
| 4 | CSV export API | GET `/api/bids/[id]/export` — generate CSV with all vendor responses, prices per combination, parameters | `src/app/api/bids/[id]/export/route.ts` |

### Phase 2 — Email Service

| # | Task | Details | Files |
|---|---|---|---|
| 5 | Install Resend SDK | `npm install resend`. Add `RESEND_API_KEY` env var | `package.json`, `.env.local` |
| 6 | Email helper module | Shared `sendEmail(to, subject, html)` wrapper around Resend. HTML templates for each email type | `src/lib/email.ts` |
| 7 | Invitation email | When inviting vendors (POST `/api/bids/[id]/invite`), send email with unique link, bid title, deadline | `src/app/api/bids/[id]/invite/route.ts`, `src/lib/email.ts` |
| 8 | Winner notification email | On winner selection: congratulations email to winner with bid details and next steps | `src/app/api/bids/[id]/winner/route.ts`, `src/lib/email.ts` |
| 9 | Loser notification email | On winner selection: "not selected" email to all other invited vendors (customizable message) | `src/app/api/bids/[id]/winner/route.ts`, `src/lib/email.ts` |
| 10 | Deadline reminder API | POST `/api/cron/reminders` — find bids with deadlines in 5 days or 2 days, email pending/opened vendors. Guard against duplicate sends | `src/app/api/cron/reminders/route.ts` |
| 11 | `reminder_log` table | id, bid_invitation_id, reminder_type (first/second), sent_at — prevents duplicate reminder emails | `src/lib/db.ts` |

### Phase 3 — Customer UI

| # | Task | Details | Files |
|---|---|---|---|
| 12 | Wire "Select" button | On comparison table: clicking Select calls POST `/api/bids/[id]/winner` with vendor data, shows confirmation dialog | `src/app/customer/[id]/page.tsx` |
| 13 | Winner badge display | After award: show winner badge on comparison row, lock editing, show "Awarded" status | `src/app/customer/[id]/page.tsx` |
| 14 | Wire "Finalize" button | Calls finalize endpoint, expires pending invitations, locks bid | `src/app/customer/[id]/page.tsx` |
| 15 | Wire "Export CSV" button | Calls GET `/api/bids/[id]/export`, triggers browser download | `src/app/customer/[id]/page.tsx` |
| 16 | Email sent indicators | On invitation table: show email-sent icon, resend button for failed deliveries | `src/app/customer/[id]/page.tsx` |

### Phase 4 — Tests

| # | Task | Details | Files |
|---|---|---|---|
| 17 | Winner selection tests | Select winner, bid auto-awarded, reject duplicate winner, reject on draft bid | `tests/system/winner-selection.test.ts` |
| 18 | Finalize tests | Lock bid, expire invitations, reject submissions after finalize | `tests/system/bid-finalize.test.ts` |
| 19 | CSV export tests | Export with combinations, empty bids, multi-vendor multi-param | `tests/system/csv-export.test.ts` |
| 20 | Reminder logic tests | Find bids needing reminders, skip already-sent, skip past-deadline | `tests/system/reminders.test.ts` |

### Email Templates

| Email | Trigger | Recipient | Content |
|---|---|---|---|
| Bid Invitation | Vendor invited | Vendor email | Bid title, description, deadline, unique submit link |
| Deadline Reminder (5d) | Cron, 5 days before | Pending/opened vendors | "Deadline approaching" + submit link |
| Deadline Reminder (2d) | Cron, 2 days before | Pending/opened vendors | "Last chance" + submit link |
| Winner Notification | Winner selected | Winning vendor | Congratulations, bid summary, next steps |
| Not Selected | Winner selected | All other vendors | Thank you, bid closed, not selected this time |

### Definition of Done

- [ ] All 4 new test files pass
- [ ] Contractor can select winner from comparison table → bid auto-awards
- [ ] Winner/loser emails sent on selection (via Resend)
- [ ] Invitation emails sent when inviting vendors
- [ ] Export CSV downloads full comparison spreadsheet
- [ ] Finalize locks bid and expires pending invitations
- [ ] Reminder cron endpoint works (manually triggerable, Vercel cron-ready)
- [ ] Vercel deployment works end-to-end

---

## Sprint 4 — Auth + Multi-tenancy

Makes it a real SaaS product

| Task | Why |
|---|---|
| Auth system (email/password + JWT) | Currently no login at all |
| User roles (Owner/Admin/Editor/Viewer) | SRS Critical |
| Team invites | Owner invites team members |
| Row-level security (account isolation) | SRS requirement for multi-tenant |
| DB migration to PostgreSQL/Supabase | SQLite won't scale for multi-user |

---

## Sprint 5 — Payments + Polish (Launch)
