# Requirements Specification
**Product:** BidMaster - Quote Management Platform for Contractors
**Based on:** Customer SRS v1.0
**Status:** Phase 1 Planning

---

## Current State

The existing POC covers basic bid creation, vendor pricing (combination + additive modes with discount rules), file attachments, and a price comparison view. There is no authentication, no project hierarchy, no email, and no payments.

### Already Implemented
- [x] Create bid requests with title, description, deadline
- [x] Add parameters with multiple options per bid
- [x] Attach files to bids
- [x] Vendor price submission (combination mode - price per combination)
- [x] Vendor price submission (additive mode - base + per-option additions)
- [x] Conditional discount rules (additive mode)
- [x] Customer price comparison via dropdown selectors
- [x] File download for vendors
- [x] SQLite database with migration support

---

## Phase 1 Requirements

### P1. Authentication & Users

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| P1-01 | Email + password registration/login | Must | Use NextAuth.js or similar |
| P1-02 | Two user roles: **Contractor** and **Vendor** | Must | Contractor = paying customer, Vendor = free |
| P1-03 | Invite additional users to a contractor account | Should | View-only or full access |
| P1-04 | Role-based permissions (admin, project manager, viewer) | Should | Within a contractor org |
| P1-05 | Two-factor authentication | Could | Phase 2 candidate |

### P2. Projects

Bids are currently standalone. The SRS requires a project hierarchy: a project groups multiple bid requests (one per product/category).

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| P2-01 | Create projects (name, description, overall deadline) | Must | Top-level container |
| P2-02 | Multiple bid requests per project (one per product/category) | Must | e.g., "Kitchens", "HVAC", "Elevators" |
| P2-03 | Duplicate an existing project (with all bid requests) | Should | |
| P2-04 | Pause a project + notify vendors ("on hold") | Should | Requires email system (P5) |
| P2-05 | Close and archive a project | Should | Read-only state, still viewable |
| P2-06 | Project dashboard showing status of all bid requests | Must | |

### P3. Supplier (Vendor) Management

Currently vendors are anonymous - they just type a company name. The SRS requires a managed vendor database.

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| P3-01 | Contractor maintains a vendor contact list | Must | Name, company, email, phone |
| P3-02 | Import vendors from Excel/CSV | Must | Bulk onboarding |
| P3-03 | Add/edit/remove vendors at any time | Must | |
| P3-04 | Assign specific vendors to each bid request | Must | Only invited vendors can respond |
| P3-05 | Vendor receives a unique link (no login required initially) | Must | Low friction for vendors |
| P3-06 | Optional: vendor accounts with login | Could | For repeat vendors who want history |

### P4. Bid Request Enhancements

The current system uses simple parameters with text options. The SRS requires richer field types and structured options/sub-options.

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| P4-01 | Custom field types: text, number, multiple choice, yes/no | Must | Currently only multiple choice |
| P4-02 | Mark fields as required or optional | Must | |
| P4-03 | Structured options with sub-options | Should | e.g., "US Manufacturing" option has sub-options for material type |
| P4-04 | Vendor can add multiple named options to their response | Must | e.g., "Budget Option", "Premium Option" |
| P4-05 | Vendor can upload files with their bid (approvals, samples) | Should | Currently only contractor uploads |
| P4-06 | Bid deadline enforcement (no submissions after deadline) | Must | |
| P4-07 | Draft/incomplete bid saving for vendors | Could | |

### P5. Email Notifications

No email system exists yet. This is critical for the product to work in production.

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| P5-01 | Send bid request email with unique vendor link | Must | SendGrid or similar |
| P5-02 | Automatic reminders before deadline | Must | Configurable frequency |
| P5-03 | Notification when a vendor submits a bid | Must | To contractor |
| P5-04 | Winner notification ("You won!") | Must | See P6 |
| P5-05 | Non-winner notification ("You were not selected") | Must | See P6 |
| P5-06 | Configurable notification preferences per project/global | Should | |
| P5-07 | In-app notification center | Could | Phase 2 candidate |

### P6. Winner Selection & Comparison

The current system shows prices but has no winner selection flow.

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| P6-01 | Comparison dashboard with all bids in a dynamic table | Must | Enhance current dropdown view |
| P6-02 | Filter by parameter combinations | Must | Already partially implemented |
| P6-03 | Side-by-side comparison of selected vendor options | Should | Select 2-3 and compare |
| P6-04 | Select winning option(s) | Must | Per bid request |
| P6-05 | Add notes/justification to selection | Should | |
| P6-06 | Trigger winner/loser notifications on selection | Must | Requires P5 |
| P6-07 | Mark bid request as "awarded" after selection | Must | Status tracking |

### P7. Payments & Subscriptions

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| P7-01 | Stripe integration for $199/month subscription | Must | Contractor accounts only |
| P7-02 | Subscription management (upgrade, cancel, billing history) | Must | |
| P7-03 | Free trial period | Should | Duration TBD |
| P7-04 | Restrict features for unpaid accounts | Must | Graceful degradation |

---

## Data Model Changes Required

### New Tables
```
organizations        - contractor companies (multi-user)
users                - auth, role, organization_id
projects             - groups of bid requests
vendor_contacts      - contractor's vendor database
bid_invitations      - which vendors are invited to which bid
bid_submissions      - replaces anonymous vendor_responses (linked to vendor_contact)
notifications        - email/in-app notification log
subscriptions        - Stripe subscription state
```

### Modified Tables
```
bids                 - add project_id FK, status (draft/active/paused/closed/awarded)
bid_parameters       - add field_type (text/number/choice/boolean), required flag
vendor_responses     - link to vendor_contact_id instead of free-text vendor_name
```

---

## Non-Functional Requirements

| Category | Requirement | Target |
|---|---|---|
| Performance | Dashboard load time | < 3 seconds |
| Performance | Max active vendors per bid | 100 |
| Scalability | Active projects per account | 500+ |
| Security | Transport | HTTPS only |
| Security | Auth | Session-based + optional 2FA |
| Security | Data | Encrypted at rest (files, PII) |
| Compliance | Regulations | GDPR + CCPA aware |
| Availability | Uptime | 99.5% |
| Compatibility | Browsers | Chrome, Firefox, Safari, Edge (latest 2 versions) |
| Compatibility | Mobile | Responsive design (not native app) |
| Language | Primary | English |
| Language | Future | Hebrew support |

---

## Technology Decisions (To Be Made)

| Decision | Options | Notes |
|---|---|---|
| Database | Stay SQLite vs migrate to PostgreSQL | SQLite won't scale for multi-user SaaS |
| Auth | NextAuth.js vs Clerk vs Auth0 | Clerk is simplest, Auth0 most flexible |
| Email | SendGrid vs Resend vs AWS SES | Resend has best DX for Next.js |
| Payments | Stripe | No alternatives considered |
| Hosting | Vercel vs Railway vs AWS | Vercel simplest for Next.js, but SQLite needs persistent disk |
| File storage | DB blobs vs S3/R2 | Must move to object storage for production |

---

## Phase Breakdown (Suggested)

### Phase 1a - Foundation (Current + Auth + Projects)
- Authentication system
- Organization/user management
- Project hierarchy
- Migrate database to PostgreSQL
- Move file storage to S3/R2

### Phase 1b - Vendor Management + Email
- Vendor contact database with Excel import
- Email notifications (SendGrid/Resend)
- Unique vendor links
- Bid deadline enforcement
- Reminders

### Phase 1c - Comparison + Selection
- Enhanced comparison dashboard
- Side-by-side comparison
- Winner selection flow
- Winner/loser notifications

### Phase 1d - Payments + Launch
- Stripe subscription integration
- Subscription management
- Landing page
- Onboarding flow

### Phase 2 (Future)
- Integration with Procore, PlanGrid
- Electronic contract signing
- AI-based winner recommendations
- Hebrew language support
- Native mobile app
- Advanced analytics/reporting

---

## Gap Analysis: POC vs Phase 1

| Area | POC Status | Phase 1 Gap |
|---|---|---|
| Auth | None | Full auth system needed |
| Projects | None (flat bids) | Project hierarchy needed |
| Vendors | Anonymous text input | Managed contact database needed |
| Bid fields | Multiple choice only | Text, number, boolean fields needed |
| Options | Parameter combinations | Named options with sub-options needed |
| Email | None | Full notification system needed |
| Selection | None | Winner selection + notifications needed |
| Payments | None | Stripe integration needed |
| Database | SQLite | Must migrate to PostgreSQL |
| Files | SQLite blobs | Must migrate to object storage |
| Hosting | localhost + ngrok | Production hosting needed |
| Pricing modes | Combination + Additive + Rules | Keep and enhance |
