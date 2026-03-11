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

## Sprint 2 — Vendor Management

Enables the invite flow that makes the platform useful.

### Phase 1 — DB & API Foundation

| # | Task | Details | Files |
|---|---|---|---|
| 1 | `vendors` table | id, name, email, cc_emails, phone, contact_person, trade_category, website, license, notes, status (active/suspended/removed), created_at | `src/lib/db.ts` |
| 2 | `trade_categories` table + 25 defaults | id, name, group (Structure/MEP/Finishes/Site), is_custom | `src/lib/db.ts`, seed in `initializeDatabase()` |
| 3 | `bid_invitations` table | id, bid_id FK, vendor_id FK, token (unique), status (pending/opened/submitted/declined/expired), sent_at, opened_at, submitted_at | `src/lib/db.ts` |
| 4 | Vendor CRUD API | GET/POST `/api/vendors`, GET/PATCH/DELETE `/api/vendors/[id]` — full profile fields, soft-delete (status→removed) | `src/app/api/vendors/route.ts`, `src/app/api/vendors/[id]/route.ts` |
| 5 | Trade categories API | GET `/api/trade-categories`, POST for custom categories | `src/app/api/trade-categories/route.ts` |
| 6 | CSV import API | POST `/api/vendors/import` — parse CSV (name, email, phone, trade), bulk insert, return created count + errors | `src/app/api/vendors/import/route.ts` |
| 7 | Bid invitation API | POST `/api/bids/[id]/invite` — accept vendor_ids[], generate unique token per vendor, create `bid_invitations` rows | `src/app/api/bids/[id]/invite/route.ts` |
| 8 | Update vendor response endpoint | GET `/api/vendor-submit/[token]` — validate token, return bid details. POST `/api/vendor-submit/[token]` — submit response, link to vendor_id, update invitation status | `src/app/api/vendor-submit/[token]/route.ts` |
| 9 | Wire `vendor_responses.vendor_id` FK | Add `vendor_id` column to `vendor_responses`, migration for existing rows | `src/lib/db.ts` |

### Phase 2 — Customer UI (Vendor Management)

| # | Task | Details | Files |
|---|---|---|---|
| 10 | Vendors list page | Table with name, trade, email, phone, status, response rate. Search/filter by trade. Suspend/remove actions | `src/app/customer/vendors/page.tsx` |
| 11 | Add vendor modal/form | Full profile form (name, email, cc_emails, phone, contact_person, trade dropdown, website, license, notes) | `src/app/customer/vendors/page.tsx` |
| 12 | CSV import UI | Upload button, file picker, preview parsed rows, confirm import, show results (created/errors) | `src/app/customer/vendors/page.tsx` |
| 13 | Invite vendors to bid | On bid detail page: vendor picker (filter by trade), select vendors, "Send Invitations" button, show invitation status per vendor | `src/app/customer/[id]/page.tsx` |
| 14 | Invitation status tracking | Per-bid table: vendor name, status (pending/opened/submitted), sent date, link to copy | `src/app/customer/[id]/page.tsx` |

### Phase 3 — Vendor Portal (Token-Based, No Login)

| # | Task | Details | Files |
|---|---|---|---|
| 15 | Vendor submission page | Public page at `/vendor-submit/[token]` — shows bid title, description, deadline, parameters. Vendor fills prices and submits | `src/app/vendor-submit/[token]/page.tsx` |
| 16 | Submission confirmation | After submit: thank-you page with summary, "already submitted" guard if revisiting | `src/app/vendor-submit/[token]/page.tsx` |
| 17 | Token expiry | Reject submissions after bid deadline or manual close. Show "expired" message | `src/app/api/vendor-submit/[token]/route.ts` |

### Phase 4 — Tests

| # | Task | Details | Files |
|---|---|---|---|
| 18 | Vendor CRUD tests | Create, edit, suspend, remove, reactivate, list with filters | `tests/system/vendors-crud.test.ts` |
| 19 | Trade categories tests | List defaults, create custom, filter vendors by trade | `tests/system/trade-categories.test.ts` |
| 20 | CSV import tests | Valid CSV, missing fields, duplicate emails, empty file | `tests/system/vendor-import.test.ts` |
| 21 | Bid invitation tests | Generate tokens, validate uniqueness, status transitions, token expiry | `tests/system/bid-invitations.test.ts` |
| 22 | Vendor submission tests | Submit via token, reject expired, reject duplicate, link to vendor_id | `tests/system/vendor-submit.test.ts` |

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

### Definition of Done

- [ ] All 5 new test files pass
- [ ] Vendors page functional (list, add, search, CSV import, suspend/remove)
- [ ] Contractor can invite vendors to a bid from the bid detail page
- [ ] Vendor can open unique link, see bid details, submit prices — no login
- [ ] Token expires after deadline
- [ ] Vercel deployment works end-to-end

---

## Sprint 3 — Winner Selection + Email

Closes the bid lifecycle loop

| Task | Why |
|---|---|
| Select winner on comparison page | Button exists but is void |
| Email service (Resend/SendGrid) | Unblocks all notifications |
| Bid invitation emails with unique vendor links | Core flow |
| Winner/loser notification emails | SRS Critical |
| Auto-reminders before deadline | SRS Critical |

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
