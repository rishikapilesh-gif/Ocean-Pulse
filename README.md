# 🌊 Ocean Pulse — Maritime Safety Platform

> **"See the risk. Prioritize the fleet. Protect lives."**

AI-assisted maritime decision-support and fleet safety platform for the SELF(E) hackathon.

---

## 🚀 Quick Start (Local)

```bash
npm install
cp .env.example apps/api/.env
# Edit apps/api/.env → set DATABASE_URL to a PostgreSQL connection string
# OR for local SQLite: change provider in apps/api/prisma/schema.prisma to "sqlite"
#    and set DATABASE_URL="file:./dev.db"
npm run db:push
npm run db:seed
npm run build
npm start
# Open http://localhost:3001
```

## 🌍 Deploy to Render (One-Click)

### Prerequisites
- GitHub account
- Render account (free at [render.com](https://render.com))

### Steps

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Ocean Pulse v1.0"
   git remote add origin https://github.com/YOUR_USER/ocean-pulse.git
   git branch -M main
   git push -u origin main
   ```

2. **Deploy on Render:**
   - Go to [dashboard.render.com](https://dashboard.render.com)
   - Click **"New +"** → **"Blueprint"**
   - Select your `ocean-pulse` repo
   - Render reads `render.yaml` automatically — provisions web service + PostgreSQL
   - Click **"Apply"**
   - Wait 3-5 minutes for build

3. **Your app is live at:** `https://ocean-pulse.onrender.com`

> The build command in `render.yaml` runs `npm install && npm run build && cd apps/api && npx prisma db push`. The server auto-seeds demo users on first boot.

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Shore Operator | `operator@oceanpulse.org` | `ShorePass123!` |
| Fisherman | `fisher@oceanpulse.org` | `FisherPass123!` |
| Admin | `admin@oceanpulse.org` | `AdminPass123!` |
| Demo Viewer | `viewer@oceanpulse.org` | `DemoPass123!` |

## 📐 Architecture

```
ocean-pulse/
├── packages/shared/     ← Shared types, schemas, constants (TypeScript)
├── apps/
│   ├── api/             ← Node.js + Express + Prisma + Socket.IO backend
│   │   ├── prisma/      ← PostgreSQL schema + seed
│   │   └── src/
│   │       ├── risk-engine/   ← Deterministic risk calculator
│   │       ├── simulation/    ← Fleet simulation loop
│   │       ├── realtime/      ← WebSocket broadcast
│   │       ├── controllers/   ← REST API handlers
│   │       └── security/      ← JWT auth + RBAC
│   └── web/             ← React + Vite + Tailwind + Leaflet frontend
│       └── src/
│           ├── pages/         ← Landing, Shore Console, Fisherman HUD
│           └── features/      ← Fleet list, map, incidents, SOS
├── render.yaml          ← Render blueprint (one-click deploy)
├── Dockerfile           ← Docker container build
└── .env.example         ← Environment variable reference
```

## 🔧 Environment Variables

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | fallback | Auto-generated on Render |
| `PORT` | ✅ | `3001` | HTTP port |
| `NODE_ENV` | ✅ | `development` | Set `production` for deploy |
| `DEMO_MODE` | No | `true` | Enables simulated fleet |
| `AI_PROVIDER` | No | `fallback` | No API key needed |
| `CORS_ORIGINS` | No | `*` | Allowed origins |

## 🧪 Tests

```bash
npm test    # Runs 21 tests (12 risk-engine + 9 API integration)
```

## 📜 License

Hackathon project — SELF(E) College 2026.
