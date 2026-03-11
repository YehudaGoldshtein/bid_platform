# BidMaster — Software Requirements Specification
**Version:** 1.0 — March 2026
**Status:** Draft — Pending Development Review
**Product:** BidMaster SaaS Platform
**Target Market:** General Contractors, New York City
**Pricing:** $199/month (Stripe)

---

## 1. Product Overview

BidMaster is a cloud-based SaaS platform designed for general contractors managing large residential and commercial construction projects in New York City. The platform streamlines the entire bid solicitation process — from creating projects and defining bid fields, to sending RFQs to vendors, comparing responses, selecting winners, and notifying all parties automatically.

The system operates on a unique **no-login model for vendors**: each vendor receives a unique link to submit their bid without requiring an account, dramatically reducing friction and increasing response rates.

### 1.1 Core Value Proposition
- Replace manual bid management (email/Excel) with a structured digital workflow
- Give GCs full visibility over which vendors responded, at what price, and when
- Enable multi-option bids so vendors can submit multiple pricing tiers
- Automate follow-up reminders, winner notifications, and contract delivery
- Maintain a vetted vendor network organized by trade category

### 1.2 Target Users

| User Type | Role & Access |
|---|---|
| Owner (GC Principal) | Full access — all projects, settings, billing, team management |
| Admin | Full access except billing and account deletion |
| Editor | Create/edit projects and bid requests, cannot manage team |
| Viewer | Read-only access — can see bids and results, cannot edit |
| Vendor (external) | No login required — accesses unique link to submit bid only |

---

## 2. Functional Requirements

### 2.1 Authentication & Team Management

| Feature | Description | Priority |
|---|---|---|
| User Login | Email + password login with JWT session management | Critical |
| Google SSO | Sign in with Google (OAuth 2.0) | High |
| Role-Based Access | Owner / Admin / Editor / Viewer role enforcement on all routes | Critical |
| Invite Team Member | Owner/Admin sends invite email; recipient sets password on first login | Critical |
| Remove Team Member | Deactivate user without deleting their history | High |
| Change Password | Self-service password reset via email link | Critical |
| Two-Factor Auth (2FA) | Optional TOTP-based 2FA (Google Authenticator) | Medium |
| Audit Log | Track all actions with user, timestamp, and description | High |

### 2.2 Project Management

| Feature | Description | Priority |
|---|---|---|
| Create Project | Multi-step form: name, address, type, units, dates, team, files, vendors, categories, bid fields | Critical |
| Project Dashboard | List of all active/completed projects with status, bid count, last activity | Critical |
| Project Settings | Edit all project info across 8 tabs: Info, Team, Files, Dates, Bid Requests, Vendors, Categories, Actions | Critical |
| Import from Project | Copy categories and bid fields from an existing project into a new one | High |
| Project Status | Active / In Progress / Completed / Archived status with color tags | High |
| Project Archive | Soft-archive completed projects; exclude from active view but retain all data | Medium |
| File Attachments | Upload drawings, specs, RFI documents per project (S3 storage) | High |
| Project Team | Assign team members with their role per project | Medium |

### 2.3 Bid Requests

| Feature | Description | Priority |
|---|---|---|
| Create Bid Request | Define name, trade category, deadline, custom fields (text, number, file, dropdown) | Critical |
| Bid Field Templates | Default field sets per trade (Kitchens, MEP, Roofing, etc.) loaded with one click | High |
| Send to Vendors | Select vendors from project vendor list; generate unique link per vendor | Critical |
| Vendor Link | Unique URL with token; no login required; expires after deadline or manual close | Critical |
| Vendor Submission Form | Branded form showing bid fields; vendor can submit multiple options/tiers | Critical |
| Multi-Option Bids | Vendor submits Option A, B, C with different specs/prices | High |
| Bid Status Tracking | Per-vendor status: Sent / Opened / Submitted / No Response / Declined | Critical |
| Deadline Management | Auto-close submissions at deadline; manual extend option | High |
| Duplicate Bid Request | Clone existing bid request with all fields and vendor list | Medium |

### 2.4 Bid Comparison

| Feature | Description | Priority |
|---|---|---|
| Comparison Table | Side-by-side view of all submitted bids with dynamic field columns | Critical |
| Sort & Filter | Sort by price, vendor name, star rating; filter by status or trade | Critical |
| Multi-Option Display | Each vendor's options shown as sub-rows in comparison | High |
| Select Winner | Mark winning vendor and option; trigger winner/loser notifications | Critical |
| Winner Notification | Auto-email to winning vendor with congratulations and next steps | Critical |
| Loser Notification | Auto-email to non-selected vendors (customizable message) | High |
| Export to CSV/Excel | Download full comparison as spreadsheet | High |
| Finalize Bid | Lock comparison; mark bid request as Finalized with winner badge | High |

### 2.5 Vendor Network (Global)

| Feature | Description | Priority |
|---|---|---|
| Trade Categories | 25 default categories grouped by Structure / MEP / Finishes / Site | Critical |
| Add Vendor | Full vendor profile: name, trade, email, CC emails, phone, contact person, website, license, notes | Critical |
| Vendor Card | Shows star rating, projects won, response rate, top performer badge | Critical |
| Suspend Vendor | Temporarily disable vendor from receiving new invitations (with reason) | High |
| Remove Vendor | Soft-remove with reason; preserved in historical bids | High |
| Reactivate Vendor | Restore suspended vendor to active status | High |
| Add Category | Create custom trade category with group assignment | High |
| Global Search | Search vendors and trades across the network (Cmd+K shortcut) | High |
| Top Performer Badge | Auto-flag vendors with highest win rate in their category | Medium |
| Import Vendors | CSV import for bulk vendor upload | Medium |

### 2.6 Automated Reminders

| Feature | Description | Priority |
|---|---|---|
| First Reminder | Auto-email X days before deadline (configurable, default: 5 days) | Critical |
| Second Reminder | Auto-email Y days before deadline (configurable, default: 2 days) | Critical |
| Opened-Not-Submitted | Special reminder to vendors who opened the link but did not submit | High |
| Weekend Avoidance | Option to skip sending reminders on Saturdays and Sundays | Medium |
| Post-Deadline Follow-Up | Email to non-responders after deadline closes | Medium |
| Custom Message | GC can edit the default reminder message template | High |
| Send Time | Configure preferred hour for reminders (e.g. 9:00 AM) | Low |

### 2.7 Notifications (Team)

| Feature | Description | Priority |
|---|---|---|
| New Bid Request | Notify team members when a new bid request is created | High |
| All Bids In | Notify when all invited vendors have submitted | High |
| Winner Selected | Notify when a winner is finalized | High |
| No Reply Alert | Notify when one or more vendors have not responded 1 day before deadline | High |
| File Added | Notify when a new file is added to a project | Medium |
| New Vendor | Notify when a vendor is added to a project | Low |
| Per-Member Control | Each team member chooses which notification types they receive | High |
| Owner Lock | Owner always receives all notification types (cannot be disabled) | Critical |

### 2.8 Contract & Documents

| Feature | Description | Priority |
|---|---|---|
| Upload Template | Upload PDF or Word contract template (max 10MB) | High |
| Dynamic Fields | Template supports `{{vendor_name}}`, `{{project_name}}`, `{{winning_price}}`, `{{today_date}}`, `{{gc_name}}`, `{{category}}`, `{{vendor_email}}` | High |
| Auto-Send on Win | Option to automatically send contract to winner when selected | High |
| Manual Send | GC reviews and manually triggers contract delivery | High |
| Contract Status | Track Sent / Signed / Pending per vendor | Medium |

### 2.9 Settings & Account

| Feature | Description | Priority |
|---|---|---|
| Company Profile | Name, logo, email, phone, timezone, language, email signature | Critical |
| Billing Portal | View plan ($199/mo), next billing date, payment method, invoice history | Critical |
| Stripe Integration | Subscription management via Stripe Customer Portal | Critical |
| Daily Backup | Auto-backup at configurable time; 7/30/90-day retention | High |
| Manual Backup | Trigger backup on demand; download as .zip | Medium |
| Support Tickets | In-app form: subject, priority, message; history of previous tickets | High |
| WhatsApp Contact | Direct link to developer WhatsApp for urgent support | Medium |

---

## 3. Technical Architecture

### 3.1 Recommended Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite — Single Page Application |
| Styling | Tailwind CSS — responsive, mobile-first design |
| Backend | Node.js + Express (REST API) — or Supabase Edge Functions |
| Database | PostgreSQL via Supabase — RLS (Row Level Security) per account |
| Authentication | Supabase Auth — email/password + Google OAuth |
| File Storage | Supabase Storage (S3-compatible) — project files and contract templates |
| Email Service | Resend or SendGrid — transactional emails with HTML templates |
| Payments | Stripe — subscription billing + Customer Portal |
| Background Jobs | Supabase Edge Functions + pg_cron — scheduled reminders |
| Hosting | Vercel (frontend) + Supabase (backend) — or Railway for Node.js |
| Domain & SSL | Cloudflare DNS + automatic TLS |

### 3.2 Database Schema (Key Tables)

```
accounts          — company info, plan, Stripe customer ID, timezone
users             — name, email, hashed password, role, account_id, last_login
projects          — all project metadata, status, account_id
project_team      — user_id + project_id + role
bid_requests      — project_id, name, deadline, status, fields (JSONB)
vendors           — global vendor profiles per account (trade, contact info, stats)
project_vendors   — vendor_id + project_id + status (active/suspended/removed)
bid_invitations   — bid_request_id + vendor_id + unique_token + status
bid_submissions   — invitation_id + submitted_at + field_values (JSONB) + options (JSONB)
bid_winners       — bid_request_id + vendor_id + option + selected_at
notifications     — user_id + type + read + payload + created_at
files             — project_id + name + url + size + uploaded_by
reminder_settings — account_id + first_days + second_days + send_time + message
support_tickets   — account_id + subject + priority + message + status
backups           — account_id + created_at + size + url + status
```

### 3.3 API Endpoints (REST)

**Authentication**
- `POST /auth/login` — email + password login
- `POST /auth/logout` — invalidate session
- `POST /auth/invite` — send team invite email
- `POST /auth/reset-password` — send password reset email

**Projects**
- `GET /projects` — list all projects for account
- `POST /projects` — create new project
- `GET /projects/:id` — full project data
- `PATCH /projects/:id` — update project fields
- `DELETE /projects/:id` — soft-archive project

**Bid Requests**
- `GET /projects/:id/bids` — list bid requests for project
- `POST /projects/:id/bids` — create new bid request
- `POST /bids/:id/send` — generate vendor tokens and send invitations
- `GET /bids/:id/compare` — get all submissions for comparison view
- `POST /bids/:id/winner` — select winner and trigger notifications
- `GET /vendor/submit/:token` — public endpoint — load bid form (no auth)
- `POST /vendor/submit/:token` — public endpoint — submit bid (no auth)

**Vendors**
- `GET /vendors` — list all vendors (with optional trade filter)
- `POST /vendors` — create vendor
- `PATCH /vendors/:id` — update vendor
- `POST /vendors/:id/suspend` — suspend vendor
- `POST /vendors/:id/reactivate` — reactivate vendor
- `POST /projects/:id/vendors` — add vendor to project

---

## 4. Non-Functional Requirements

| Requirement | Specification |
|---|---|
| Performance | Page load under 2 seconds; API responses under 500ms for 95th percentile |
| Uptime | 99.9% monthly uptime SLA (Supabase + Vercel infrastructure) |
| Mobile Responsive | Full functionality on mobile Safari and Chrome (375px minimum width) |
| Email Deliverability | Dedicated sending domain with SPF, DKIM, DMARC records |
| Data Security | All data encrypted at rest (AES-256) and in transit (TLS 1.3) |
| Row-Level Security | Supabase RLS enforces account isolation — no data leakage between accounts |
| Vendor Link Expiry | Unique tokens expire at bid deadline or manual close — one-time use per vendor |
| GDPR / Privacy | Vendor data used only for bid purposes; deletion on request within 30 days |
| Browser Support | Chrome 90+, Safari 15+, Firefox 90+, Edge 90+ |
| Accessibility | WCAG 2.1 AA compliance for color contrast and keyboard navigation |
| Backup | Daily automated backup with 30-day retention; point-in-time recovery |
| Rate Limiting | API rate limiting: 100 req/min per IP; stricter on auth endpoints |

---

## 5. UI/UX Design Requirements

### 5.1 Design System
- **Font:** Bricolage Grotesque (display/headings) + Plus Jakarta Sans (body text)
- **Color:** Gold accent (#B8860B), Dark navy (#1a1a2e), Light gray backgrounds
- **Logo:** Black "BidMaster" with gold "M" initial
- **Theme:** Light mode only (dark mode optional for v2)
- **Radius:** 10–12px border radius on cards and inputs
- **Shadows:** Subtle drop shadows on cards (`0 1px 6px rgba(0,0,0,0.08)`)

### 5.2 Layout
- Fixed left sidebar: logo + navigation + project tree (collapsible)
- Main content area: page header (title + subtitle) + scrollable content
- Top bar: project breadcrumb, search (Cmd+K), notifications bell, user avatar
- Sidebar project tree: active project expanded by default with bid requests nested
- Navigation items: Dashboard, New Project, Create Bid, Compare Bids, Vendor Management, Settings

### 5.3 Key UI Patterns
- Filter strip on all list pages: search input + chip filters (All / Active / Completed)
- Cards with avatar initials for vendors (colored background per vendor)
- Tabbed settings pages with pill-style tab buttons
- Modal overlays for confirmations, add forms, send-bid flows
- Toast notifications for success/error feedback (auto-dismiss after 3s)
- Floating context menus (three-dot button) for vendor/project actions
- Progress indicators on multi-step new project form
- Star rating display for vendor performance
- Color-coded status tags: Active (blue), Submitted (green), No Response (red), Suspended (orange)

---

## 6. Development Phases & Timeline

| Phase | Name | Deliverables | Duration |
|---|---|---|---|
| Phase 1 | Foundation | Auth, DB schema, role management, basic project CRUD, team invites | 3 weeks |
| Phase 2 | Bid Core | Bid request creation, vendor links, submission portal, bid tracking | 4 weeks |
| Phase 3 | Comparison & Winners | Comparison table, winner selection, email notifications, CSV export | 3 weeks |
| Phase 4 | Vendor Network | Global vendor management, trade categories, vendor profiles, search | 2 weeks |
| Phase 5 | Automation | Reminders engine, notification preferences, contract delivery | 3 weeks |
| Phase 6 | Settings & Billing | Stripe integration, account settings, backup, support tickets | 2 weeks |
| Phase 7 | Polish & Launch | Mobile responsive, performance, accessibility, onboarding flow, QA | 3 weeks |

> Total estimated timeline: **20 weeks (5 months)** with a single full-stack developer, or **12 weeks** with a 2-person team (frontend + backend).

---

## 7. Third-Party Integrations

| Service | Purpose | Notes |
|---|---|---|
| Supabase | Database, Auth, Storage, Edge Functions | Managed PostgreSQL + Auth — replaces custom backend setup |
| Stripe | Subscription billing, invoices, payment methods | Use Stripe Billing + Customer Portal for self-service |
| Resend / SendGrid | All transactional emails | HTML email templates with BidMaster branding |
| Google OAuth | Optional social login | Simplifies onboarding for GCs with Google Workspace |
| Cloudflare | DNS, CDN, DDoS protection | Free tier sufficient for initial launch |
| Vercel | Frontend hosting and CI/CD | Auto-deploy from GitHub on push to main branch |
| Sentry | Error tracking and monitoring | Catch frontend and backend errors in production |
| PostHog | Product analytics | Track feature usage, funnels, user behavior |

---

## 8. Out of Scope (Version 1.0)

The following features are explicitly deferred to future versions:

- Mobile native apps (iOS / Android) — v2 roadmap
- DocuSign or e-signature integration — v2
- QuickBooks / accounting integration — v3
- Automated plan takeoff from drawings — v3
- Multi-language interface (Hebrew, Spanish) — v2
- Dark mode — v2
- Public vendor marketplace (vendors discover GCs) — v3
- In-app chat / messaging between GC and vendors — v2
- Offline mode / PWA — v3

---

## 9. Acceptance Criteria

The following criteria must be met before production launch:

- [ ] All Critical priority features fully functional and tested
- [ ] Vendor submission flow tested end-to-end on mobile Safari and Chrome
- [ ] Stripe test mode payments confirmed working with webhook handling
- [ ] Email delivery tested (reminder, winner, loser, invite flows)
- [ ] All RLS policies verified — one account cannot access another account's data
- [ ] Load test: 50 concurrent users, all pages under 3 second load time
- [ ] Zero Critical or High severity bugs in QA backlog at launch
- [ ] GDPR privacy policy and terms of service published at bidmaster.app/legal

---

## Current Implementation Status

### Already Implemented (POC)
- [x] Create bid requests with title, description, deadline
- [x] Add parameters with multiple options per bid
- [x] Attach files to bids
- [x] Vendor price submission (combination mode — price per combination)
- [x] Vendor price submission (additive mode — base + per-option additions)
- [x] Conditional discount rules (additive mode)
- [x] Customer price comparison via dropdown selectors
- [x] File download for vendors
- [x] SQLite/Turso database
- [x] BidMaster UI theme (fonts, colors, gold accent)
- [x] 95 system tests (Vitest)

### Not Yet Implemented
- [ ] Authentication & team management
- [ ] Project hierarchy (projects → bid requests)
- [ ] Vendor contact database & management
- [ ] Bid field templates & trade categories
- [ ] Email notifications (invites, reminders, winner/loser)
- [ ] Winner selection flow
- [ ] Sidebar layout with project tree
- [ ] Stripe billing integration
- [ ] Contract template system
- [ ] CSV/Excel export
- [ ] PostgreSQL / Supabase migration
- [ ] S3 file storage migration

---

*BidMaster — Software Requirements Specification v1.0 — March 2026 | Confidential*
