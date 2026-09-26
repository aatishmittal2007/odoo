# STOCKSENSE — Inventory Reality & Exception Management Platform

> **An enterprise-grade, explainable inventory control tower and exception management platform bridging the gap between system book inventory and physical reality.**

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3+-61dafb.svg)](https://react.dev/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22.0-2D3748.svg)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4+-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)

---

## 1. Executive Summary & Product Purpose

Modern warehouses lose millions every year to the **"Inventory Reality Gap"**: the divergence between what the Enterprise Resource Planning (ERP) database asserts is on the shelves and what actually physically exists. Traditional systems treat inventory as static numbers; discrepancies are either ignored, masked by blanket write-offs, or discovered too late when a customer delivery fails.

**StockSense** solves this by establishing a continuous, deterministic audit loop:

```
[ Inventory Operation ]
         │
         ▼
[ Stock Movement & Double-Sided Ledger ]
         │
         ▼
[ Physical Verification (Cycle Count) ]
         │
         ▼
[ Discrepancy Detection Engine ]
         │
         ▼
[ Exception Incident (INC-xxx) ]
         │
         ▼
[ Multi-Party Investigation & Tasks ]
         │
         ▼
[ Root Cause Resolution & Reconciliation ]
         │
         ▼
[ Process Health Analytics & Prevention ]
```

### Why StockSense is Differentiated:
1. **Deterministic & Explainable**: Zero black-box AI chatbots or fake ML hallucinations. Every confidence score, discrepancy variance, customer demand shortfall, and recurring root-cause metric is transparent, auditable, and mathematically grounded.
2. **Double-Sided Ledger Accounting**: Modeled on financial accounting, every stock movement logs balanced debit/credit entries with immutable before/after quantities.
3. **Automated Business Impact Analysis**: Discrepancies immediately calculate downstream impact on committed customer orders, projecting delivery risks and unit shortages before customers are impacted.
4. **Actionable Exception Lifecycle**: Complete investigation workflow with assignable staff tasks, digital audit trails, root cause taxonomy, and corrective reconciliation adjustments.

---

## 2. Quickstart & Installation

### Prerequisites
- **Node.js**: `v20.x` or later (tested on Node v24)
- **npm**: `v10.x` or later
- **SQLite3** (built-in, zero external database setup required)

### Step 1: Clone & Install Dependencies

```bash
# In the project root directory
cd backend
npm install

cd ../frontend
npm install
```

### Step 2: Initialize & Seed the Database

The backend includes a comprehensive deterministic seed script that configures users, warehouses, locations, products, historical resolved incidents, and the **Steel Rods (INC-024)** demonstration scenario.

```bash
cd backend
npm run prisma:generate
npm run prisma:push
npm run seed
```

### Step 3: Launch Application

You can launch both servers simultaneously:

```bash
# Terminal 1 - Start Backend API (Port 5000)
cd backend
npm run dev

# Terminal 2 - Start Frontend Application (Port 3000)
cd frontend
npm run dev -- --port 3000
```

- **Frontend Application**: [http://localhost:3000](http://localhost:3000)
- **Backend API Server**: [http://localhost:5000/api](http://localhost:5000/api)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 3. Demo Credentials & Seamless Role Switching

StockSense provides pre-configured enterprise personas with **instant 1-click role switching** in the top navigation bar:

| Role | Email | Password | Responsibilities |
|---|---|---|---|
| **Inventory Manager** | `manager@stocksense.io` | `password123` | Full visibility, Control Tower, starts investigations, approves resolutions, manages products & warehouses. |
| **Warehouse Staff** | `staff@stocksense.io` | `password123` | Floor execution, records receipts/deliveries/transfers, completes physical counts, executes assigned investigation tasks. |

> **Evaluator Tip**: In the UI top navigation bar, click the **"Switch Role"** button to toggle instantly between Inventory Manager and Warehouse Staff with zero re-login friction.

---

## 4. The Canonical Demonstration Scenario: Steel Rods (INC-024)

StockSense comes pre-seeded with the exact verification scenario specified in the platform challenge:

### The Storyline:
1. **Product**: Steel Rods (`SR001`), Unit of Measure: `kg`.
2. **Initial State**: Stored in **Main Warehouse / Rack A** with starting balance of `100 kg`.
3. **Movement 1 (Receipt)**: `+100 kg` received into Rack A (System balance = `200 kg`).
4. **Movement 2 (Internal Transfer)**: `-20 kg` transferred from Rack A to Rack B (Rack A = `180 kg`, Rack B = `20 kg`).
5. **Movement 3 (Customer Delivery)**: `-60 kg` dispatched for **Order #1042** (Rack A = `120 kg`).
6. **Movement 4 (Scrap Adjustment)**: `-3 kg` damaged stock written off (Rack A = `117 kg`, Facility total = `137 kg`).
7. **The Discrepancy (Physical Count)**: Warehouse staff performs a physical count at Rack A and counts **`83 kg`** (Expected: `100 kg` at location).
   - **Variance**: `-17 kg` (`-17.0%`).
8. **Exception Triggered**: The deterministic exception engine automatically raises **`INC-024`** with `HIGH` severity.
9. **Business Impact Analysis**:
   - System aggregates committed pending customer orders:
     - `Order #1042`: Apex Infrastructure Ltd (Demand: 60 kg, Scheduled)
     - `Order #1051`: Skyline Builders (Demand: 10 kg, Scheduled)
     - `Order #1066`: Horizon Engineering Group (Demand: 66 kg, Scheduled)
   - **Total Demand**: `136 kg` vs **Physical Availability**: `83 kg`.
   - **Shortage Detected**: **`53 kg shortfall`**! Order #1066 is marked as **`AT_RISK`**.
10. **Investigation & Resolution**:
    - Investigation assigned to staff (`Sam Rodriguez`) with 3 floor audit tasks.
    - Root cause identified: **`TRANSFER_ERROR`** (Rack A to Rack B transfer misplacement).
    - Resolution reconciles system balance via a formal Stock Adjustment and logs full audit history.
    - Process Health aggregates the incident into the recurring transfer failure analysis.

---

## 5. System Architecture & Tech Stack

```
stocksense/
├── backend/                  # Node.js + Express + TypeScript Backend
│   ├── prisma/
│   │   ├── schema.prisma     # 18 relational models (Prisma ORM)
│   │   ├── dev.db            # SQLite database
│   │   └── seed.ts           # Comprehensive deterministic seed script
│   └── src/
│       ├── controllers/      # REST API route controllers
│       ├── middleware/       # JWT auth, role validation, error handling
│       ├── routes/           # Express router endpoints
│       ├── services/         # Deterministic business logic & engines
│       │   ├── exception-engine.ts   # 7 Deterministic exception rules
│       │   ├── business-impact.ts    # Shortage & customer order demand math
│       │   ├── confidence-score.ts   # Transparent 0-100% score + itemized factors
│       │   ├── analytics.service.ts  # Process health & root cause recurrence
│       │   ├── ledger.service.ts     # Immutable double-sided ledger entries
│       │   └── stock.service.ts      # Multi-location atomic balance updates
│       ├── acceptance-test.ts        # 12-Step automated acceptance test suite
│       └── server.ts                 # Express HTTP server bootstrap
│
└── frontend/                 # React 18 + Vite + TypeScript SPA
    ├── src/
    │   ├── components/
    │   │   ├── common/       # Badges, ConfidenceGauge, Modals, StatCards
    │   │   ├── exceptions/   # Timeline, EvidencePanel, BusinessImpact, InvestigationBox, ResolutionModal
    │   │   ├── layout/       # AppShell, Navbar, Sidebar, RoleSwitch
    │   │   └── operations/   # RecordCountModal, Operation Modals
    │   ├── context/          # AuthContext with 1-click role switcher
    │   ├── pages/            # Control Tower, Exceptions, Products, Warehouses, Operations, Process Health
    │   ├── services/         # Axios API client
    │   └── types/            # TypeScript domain interfaces
    └── vite.config.ts        # Vite configuration with /api proxy
```

---

## 6. Deterministic Exception Rules Engine

StockSense replaces unpredictable AI prompts with **7 rigorous, auditable mathematical rules**:

| Rule ID | Rule Name | Trigger Criteria | Severity |
|---|---|---|---|
| **RULE-01** | **Physical Discrepancy** | `|Physical Qty - System Qty| > 0` during count. Discrepancy > 15% yields CRITICAL; > 5% yields HIGH. | `HIGH` / `CRITICAL` |
| **RULE-02** | **Location Mismatch** | Stock found in unassigned rack/location or during mismatched barcode scan. | `MEDIUM` |
| **RULE-03** | **Unusual Adjustment** | Manual adjustment exceeds 10% of total stock or threshold of 25 units. | `HIGH` |
| **RULE-04** | **Count Overdue** | Location has not had a physical cycle count in over 30 days. | `LOW` |
| **RULE-05** | **Low Stock Threshold** | Total available inventory falls below defined product reorder level. | `MEDIUM` |
| **RULE-06** | **Negative Stock Anomaly** | Any operation attempting to bring a location or facility balance below zero. | `CRITICAL` |
| **RULE-07** | **Transfer In-Transit Lag** | Internal transfer remains in transit for more than 48 hours without receipt. | `MEDIUM` |

---

## 7. REST API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/login` — Login with email and password.
- `POST /api/auth/demo-login` — 1-click login by role (`INVENTORY_MANAGER` or `WAREHOUSE_STAFF`).
- `GET /api/auth/me` — Get authenticated user profile.
- `GET /api/auth/users` — List staff and managers for task assignment.
- `POST /api/auth/mock-otp` — Request mock OTP password reset.

### Control Tower & Analytics (`/api/dashboard`)
- `GET /api/dashboard/control-tower` — KPI metrics, system confidence score, factor breakdown, and needs-attention triage.
- `GET /api/dashboard/process-health` — Aggregated resolution rates, root cause distribution, and high-risk transfer routes.
- `GET /api/dashboard/drilldown/:rootCause` — Drill-down analysis for specific failure modes.
- `GET /api/dashboard/search?q=...` — Unified global search across products, exceptions, orders, and locations.
- `POST /api/dashboard/reset-demo` — 1-click reset of demo data to pristine initial scenario state.

### Exceptions Management (`/api/exceptions`)
- `GET /api/exceptions` — List exceptions with multi-dimensional filtering (status, severity, type, warehouse, SKU).
- `GET /api/exceptions/:id` — Full exception dossier (by UUID or `INC-xxx`), including evidence, audit timeline, and business impact.
- `POST /api/exceptions/:id/investigate` — Assign investigator, set due date, and open formal investigation.
- `POST /api/exceptions/:id/tasks` — Add investigation task for warehouse staff.
- `PATCH /api/exceptions/tasks/:taskId` — Complete/toggle task with verification notes.
- `POST /api/exceptions/:id/resolve` — Submit root cause, corrective actions, and execute inventory reconciliation adjustment.
- `POST /api/exceptions/scan-transfers` — Run automated transfer latency scan.

### Inventory Operations (`/api/inventory`)
- `GET /api/inventory/stock` — Company-wide and location-level stock balance overview.
- `GET /api/inventory/ledger` — Immutable double-sided stock movement audit ledger.
- `GET /api/inventory/receipts` — List purchase receipts.
- `POST /api/inventory/receipts` — Create new receipt.
- `POST /api/inventory/receipts/:id/validate` — Validate receipt and increment stock.
- `GET /api/inventory/deliveries` — List outgoing customer deliveries.
- `POST /api/inventory/deliveries/:id/validate` — Validate delivery and decrement stock.
- `GET /api/inventory/transfers` — List internal warehouse transfers.
- `POST /api/inventory/transfers/:id/complete` — Complete transfer between locations.
- `GET /api/inventory/adjustments` — List inventory adjustments.
- `POST /api/inventory/adjustments` — Record manual inventory adjustment.
- `GET /api/inventory/physical-counts` — List cycle counts and audits.
- `POST /api/inventory/physical-counts` — Submit physical count (triggers discrepancy engine).

### Products & Warehouses
- `GET /api/products` — List all products with category and total stock.
- `GET /api/products/:id` — Product detail with location balances and movement history.
- `POST /api/products` — Create new product with SKU, barcode, and reorder levels.
- `GET /api/warehouses` — List warehouses with location hierarchy (racks & shelves).

---

## 8. Verification & Acceptance Testing

The platform includes an automated 12-step end-to-end integration and acceptance test suite validating the complete lifecycle.

To execute the test suite:

```bash
cd backend
npx tsx src/acceptance-test.ts
```

### Verified Test Suite Steps:
```
[PASS] Test 01: Product Creation with SKU and Category
[PASS] Test 02: Initial Receipt & Double-Sided Stock Ledger Entry
[PASS] Test 03: Internal Transfer from Rack A to Rack B
[PASS] Test 04: Customer Delivery Outflow
[PASS] Test 05: Physical Cycle Count Recording (Variance Detected)
[PASS] Test 06: Auto-Creation of Exception Incident (INC-xxx)
[PASS] Test 07: Evidence Dossier & Timeline Event Linking
[PASS] Test 08: Investigation Assignment & Status Transition
[PASS] Test 09: Staff Investigation Checklist Task Completion
[PASS] Test 10: Root Cause Resolution & Reconciliation Stock Adjustment
[PASS] Test 11: Control Tower Confidence Score Dynamic Recalculation
[PASS] Test 12: Relational Data Persistence Verification in Database
```

---

## 9. License

This project is created for the Hackathon / StockSense Inventory Reality & Exception Management Challenge. Licensed under the ISC License.
