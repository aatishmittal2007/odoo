# StockSense — Enterprise Inventory Reality Engine

> **Full-stack inventory management system** with real-time exception detection, investigation workflows, n8n automation, and PostgreSQL persistence.

## Architecture

```
┌─────────────────┐       ┌──────────────────────┐       ┌────────────┐
│   Frontend      │ ───→  │   StockSense Backend  │ ───→  │ PostgreSQL │
│  React + Vite   │       │   Node.js + Express   │       │   Port 5434│
│  Port 3000      │       │   Port 5000           │       └────────────┘
└─────────────────┘       └──────────────────────┘
                                     │
                           (non-blocking dispatch)
                                     ↓
                           ┌──────────────────────┐
                           │     n8n Automation   │
                           │    Port 5678/5679    │
                           │  5 Active Workflows  │
                           └──────────────────────┘
                                     │
                         (callback via /api/integrations)
                                     ↓
                           ┌──────────────────────┐
                           │   StockSense Backend  │
                           │ /api/internal/...    │
                           └──────────────────────┘
```

## Quick Start

### Option A: Docker Compose (Recommended)

```bash
# Clone and start all services
git clone <repo>
cd stocksense

# Start everything (PostgreSQL + Backend + Frontend + n8n)
docker compose up --build

# Services:
#   Frontend:  http://localhost:3000
#   Backend:   http://localhost:5000
#   n8n:       http://localhost:5679
#   PostgreSQL: localhost:5434
```

### Option B: Local Development

**Prerequisites:** Node 20+, PostgreSQL 16+ running at port 5434

```bash
# 1. Start PostgreSQL (or use Docker just for DB)
docker run -d \
  --name stocksense-postgres \
  -e POSTGRES_USER=stocksense \
  -e POSTGRES_PASSWORD=stocksense_secret_2026 \
  -e POSTGRES_DB=stocksense_db \
  -p 5434:5432 \
  postgres:16-alpine

# 2. Backend
cd backend
npm install
npx prisma db push
npx tsx prisma/seed.ts   # Seeds demo data
npm run dev              # http://localhost:5000

# 3. Frontend (separate terminal)
cd frontend
npm install
npm run dev              # http://localhost:3000
```

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Manager | `manager@stocksense.io` | `password123` |
| Staff | `staff@stocksense.io` | `password123` |

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
DATABASE_URL="postgresql://stocksense:stocksense_secret_2026@localhost:5434/stocksense_db?schema=public"
JWT_SECRET="stocksense-enterprise-jwt-secret-2026"
NODE_ENV="development"

# n8n integration (optional — app works without n8n)
N8N_HOST=localhost
N8N_PORT=5678
N8N_WEBHOOK_URL=http://localhost:5678/webhook/stocksense
N8N_WEBHOOK_SECRET="stocksense-n8n-webhook-secret-2026"
INTERNAL_AUTOMATION_SECRET="stocksense-internal-automation-2026"

# AI (optional — deterministic fallback active when not set)
OPENROUTER_API_KEY=
OPENROUTER_MODEL=google/gemini-2.0-flash-001
```

### Docker `.env` (project root — optional overrides)

```env
POSTGRES_USER=stocksense
POSTGRES_PASSWORD=stocksense_secret_2026
POSTGRES_DB=stocksense_db
POSTGRES_PORT=5434
JWT_SECRET=stocksense-enterprise-jwt-secret-2026
N8N_WEBHOOK_SECRET=stocksense-n8n-webhook-secret-2026
INTERNAL_AUTOMATION_SECRET=stocksense-internal-automation-2026
N8N_PORT=5679
# AI is optional:
OPENROUTER_API_KEY=
```

## Key Design Principles

### No External API Keys Required
The system is **fully functional without any external API keys**. AI analysis degrades gracefully to deterministic heuristics:
- Exception summaries → rule-based text from exception data
- Daily inventory briefs → generated from KPI metrics
- Severity escalations → threshold-based rules

### n8n Failure Isolation
n8n failures **never affect core inventory operations**. Every dispatch is:
- Fire-and-forget (non-blocking)
- Retried up to 2 times with backoff
- Logged to `AutomationEvent` table regardless of success/failure

### Idempotent Database Seeding
The backend entrypoint checks user count before seeding — **data is never wiped** on container restart.

## n8n Workflows

| # | Name | Trigger | Action |
|---|------|---------|--------|
| 1 | Exception Created AI Analysis | Webhook `POST /webhook/stocksense/exception-created` | Calls AI summary endpoint → stores to AIAnalysis |
| 2 | High & Critical Severity Escalation | Webhook `POST /webhook/stocksense/exception-high-severity` | Auto-creates InvestigationTask for HIGH/CRITICAL |
| 3 | Daily Inventory Summary | Schedule: 8AM UTC | Fetches KPIs → stores to InventorySummary |
| 4 | Overdue Investigation Detection | Schedule: Every hour | Finds overdue open exceptions → creates escalation tasks |
| 5 | Generic Inventory Event Router | Webhook `POST /webhook/stocksense/inventory-event` | Routes receipt/delivery/adjustment events to internal log |

### Workflow Import (automatic in Docker)
Workflows are auto-imported when the n8n container starts via `n8n/docker-entrypoint.sh`.

### Webhook Secret
All webhook calls from StockSense → n8n include header:
```
x-stocksense-webhook-secret: <N8N_WEBHOOK_SECRET>
```

### n8n → Backend (Internal Automation Channel)
n8n calls back to the backend using:
```
x-internal-automation-secret: <INTERNAL_AUTOMATION_SECRET>
```

Endpoints:
- `POST /api/internal/automation/events` — log a processed event
- `POST /api/internal/automation/tasks` — create escalation task
- `POST /api/internal/automation/summaries` — store daily inventory summary
- `GET /api/internal/automation/events` — query event log
- `GET /api/internal/automation/summaries` — query summaries

## API Overview

```
POST   /api/auth/login
GET    /api/products
GET    /api/warehouses
GET    /api/inventory
GET    /api/exceptions          POST /api/exceptions
GET    /api/exceptions/:id      PATCH /api/exceptions/:id
GET    /api/tasks               POST /api/tasks
GET    /api/audit-logs
GET    /api/dashboard/control-tower
GET    /api/dashboard/process-health
GET    /api/integrations/status
POST   /api/integrations/n8n/callback
POST   /api/ai/exceptions/:id/summary
GET    /api/receipts            POST /api/receipts
GET    /api/deliveries          POST /api/deliveries
GET    /api/transfers           POST /api/transfers
GET    /api/adjustments         POST /api/adjustments
GET    /api/physical-counts     POST /api/physical-counts
GET    /api/stock
GET    /api/ledger
```

## Database Schema (PostgreSQL)

Key models: `User`, `Product`, `Warehouse`, `StockLevel`, `StockLedger`, `Receipt`, `Delivery`, `Transfer`, `Adjustment`, `PhysicalCount`, `Exception`, `InvestigationTask`, `AIAnalysis`, `AutomationEvent`, `InventorySummary`, `AuditLog`

## Testing

```bash
# Phase 1 acceptance tests
cd backend && npx tsx tests/acceptance-test.ts

# Phase 2 E2E tests
npx tsx tests/e2e-phase2-test.ts

# Phase 3 integration tests (requires running backend + DB)
node test-phase3.mjs

# Full workflow test
npx tsx tests/test-workflow.ts
```

## Docker Volumes

| Volume | Contents |
|--------|----------|
| `stocksense_postgres_data` | PostgreSQL data (persistent) |
| `stocksense_n8n_data` | n8n workflows, credentials, SQLite DB |

## Troubleshooting

**n8n webhooks returning 500?**
- Ensure n8n is healthy: `curl http://localhost:5679/healthz`
- Check workflow is active in n8n UI: `http://localhost:5679`
- Re-import workflows: `docker compose restart n8n`

**Backend can't reach PostgreSQL?**
- Check container: `docker ps | grep postgres`
- Check port: `docker compose port postgres 5432`

**Seed runs but data already exists?**
- This is safe — the entrypoint checks `user.count()` before seeding

**AI analysis always shows "Heuristic"?**
- This is correct when `OPENROUTER_API_KEY` is not set — the system uses deterministic fallbacks
