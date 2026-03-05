# Architecture

## Overview

The Bid Platform is a full-stack Next.js application with two user roles (Customer and Vendor) that communicate through a shared SQLite database. There is no authentication - this is a POC.

## Data Flow

```
Customer creates bid          Vendor submits prices         Customer views prices
       |                              |                             |
       v                              v                             v
  POST /api/bids              POST /api/bids/[id]/respond    GET /api/bids/[id]
       |                              |                             |
       v                              v                             v
  bids table                  vendor_responses table         Query all vendor_prices
  bid_parameters table        vendor_prices table            matching combination_key
  bid_parameter_options table
  bid_files table
```

## Database Design

### Tables

**bids**
- `id` TEXT PRIMARY KEY (UUID)
- `title` TEXT
- `description` TEXT
- `deadline` TEXT
- `created_at` TEXT (auto-set)

**bid_parameters**
- `id` TEXT PRIMARY KEY (UUID)
- `bid_id` TEXT FK -> bids
- `name` TEXT (e.g., "Color")
- `sort_order` INTEGER

**bid_parameter_options**
- `id` TEXT PRIMARY KEY (UUID)
- `parameter_id` TEXT FK -> bid_parameters
- `value` TEXT (e.g., "Red")
- `sort_order` INTEGER

**bid_files**
- `id` TEXT PRIMARY KEY (UUID)
- `bid_id` TEXT FK -> bids
- `filename` TEXT
- `data` BLOB

**vendor_responses**
- `id` TEXT PRIMARY KEY (UUID)
- `bid_id` TEXT FK -> bids
- `vendor_name` TEXT
- `submitted_at` TEXT (auto-set)

**vendor_prices**
- `id` TEXT PRIMARY KEY (UUID)
- `response_id` TEXT FK -> vendor_responses
- `combination_key` TEXT (JSON string)
- `price` REAL

### Combination Key

The combination_key is a JSON-serialized object mapping parameter names to selected option values, with keys sorted alphabetically:

```json
{"Color":"Red","Material":"Wood","Size":"Large"}
```

Both the vendor submission page and the customer comparison page generate keys with the same sorting logic, ensuring consistent matching.

## Frontend Pages

### Home (`/`)
- Static page with two role cards linking to `/customer` and `/vendor`

### Customer Dashboard (`/customer`)
- Client component, fetches `GET /api/bids`
- Displays bid cards with title, deadline, vendor response count
- Links to create page and individual bid detail pages

### Create Bid (`/customer/create`)
- Client component with controlled form
- Dynamic parameter builder with chip/tag UI for options
- Two-step submit: POST bid JSON, then POST files as FormData
- Redirects to dashboard on success

### Price Comparison (`/customer/[id]`)
- Client component, fetches `GET /api/bids/[id]`
- Renders a dropdown (`<select>`) for each parameter
- Constructs combination_key from selections
- Flattens vendor_responses array to find matching prices
- Displays results sorted by price ascending

### Vendor Dashboard (`/vendor`)
- Client component, fetches `GET /api/bids`
- Lists all bids with title, description, deadline

### Price Submission (`/vendor/[id]`)
- Client component, fetches `GET /api/bids/[id]`
- Generates all combinations using cartesian product of parameter options
- Renders a table row per combination with a price input
- Downloads attached files via `/api/bids/[id]/files/[fileId]`
- Submits all prices in a single POST to `/api/bids/[id]/respond`

## API Design

All API routes use the Next.js App Router pattern with:
- `NextResponse` for JSON responses
- `crypto.randomUUID()` for ID generation
- `better-sqlite3` transactions for multi-table inserts
- `params: Promise<{...}>` (Next.js 16 async params)

### Error Handling
- All routes wrapped in try/catch
- Returns appropriate HTTP status codes (400, 404, 500)
- JSON error responses with `{ error: string }`

## Key Design Decisions

1. **SQLite over PostgreSQL**: Simpler for POC, no external service needed, single file database (`bids.db`)
2. **No auth**: POC simplicity - anyone can create bids or submit prices
3. **Files as BLOBs**: Stored directly in SQLite for simplicity (not suitable for large files in production)
4. **Cartesian product on client**: The vendor page generates all combinations client-side rather than pre-computing on the server
5. **JSON combination keys**: Simple string matching for price lookup, keys are sorted alphabetically for consistency
