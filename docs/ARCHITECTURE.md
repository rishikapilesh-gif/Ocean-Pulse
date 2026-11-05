# Ocean Pulse — System Architecture

## 1. High-Level Overview

Ocean Pulse is designed as a software-first maritime safety and decision-support layer for coastal fishing communities and shore command operators. It bridges the operational gap between raw environmental advisories (INCOIS, IMD) and practical, boat-specific interventions.

```
                              ┌───────────────────────────────────────┐
                              │     External Marine Feeds (Sim)       │
                              │  INCOIS Forecasts • IMD Doppler Radar │
                              │     ISRO NavIC / DAT Satellite Gateway│
                              └──────────────────┬────────────────────┘
                                                 │
                                                 ▼
┌─────────────────────────┐           ┌───────────────────────┐           ┌────────────────────────┐
│  Fisherman Mobile HUD   │           │   Ocean Pulse API     │           │  Shore Command Center  │
│ (Offline-First / PWA)   │◄─────────►│  Express + Socket.IO  │◄─────────►│  Digital Ocean Twin    │
│  - Press-and-Hold SOS   │  REST /   │  - Auth & RBAC        │  REST /   │  - Real-time Map       │
│  - Multilingual Speech  │ WebSockets│  - Deterministic Risk │ WebSockets│  - Fleet Urgency Rank  │
│  - Evasive Safe Vector  │           │  - Simulation Loop    │           │  - Incident Triage     │
│  - IndexedDB Sync Queue │           │  - AI Copilot Adapter │           │  - MRCC Escalation     │
└─────────────────────────┘           └──────────┬────────────┘           └────────────────────────┘
                                                 │
                                                 ▼
                                      ┌───────────────────────┐
                                      │   Persistent Storage  │
                                      │  Prisma ORM (SQLite / │
                                      │   Render PostgreSQL)  │
                                      └───────────────────────┘
```

## 2. Monorepo Structure

- **`packages/shared`**: Single source of truth for TypeScript types, Zod schemas, math constants, multilingual translations (English, Malayalam, Tamil, Hindi), and Socket.IO events.
- **`apps/api`**: Node.js/Express service with Socket.IO, Prisma ORM, deterministic risk calculations, simulation engine, and external data adapters.
- **`apps/web`**: React 18, Vite, Tailwind CSS, Leaflet/Canvas mapping, Web Speech API, and IndexedDB offline persistence.

## 3. Authoritative vs. Generative Boundaries

| Component | Responsibility | Authoritative Status |
| :--- | :--- | :--- |
| **Deterministic Risk Engine** | Proximity calculation, 15-min trajectory projection, time-to-danger (TTD), safe angle search, and fleet ranking. | **100% Authoritative** (Cannot be overridden by AI or random percentages). |
| **Prisma Database** | User sessions, vessel records, incident event logs, assistance requests, and audit trails. | **Persistent Source of Truth**. |
| **AI Safety Copilot** | Summarizes verified telemetry and explainable risk factors into natural language briefs for operators. | **Non-authoritative Advisor** (Operates behind strict evidence bounds). |
| **Fisherman HUD IndexedDB** | Caches unconfirmed SOS transmissions and assistance requests locally when offline. | **Local Staging Buffer** (Reconciled with idempotency keys upon reconnection). |

## 4. Real-time Event Flow

1. **Simulation Tick**: The backend simulation engine advances the storm and vessels at a configurable rate (default: 1 real second = 1 sim minute).
2. **Deterministic Evaluation**: Each vessel's telemetry is evaluated against the advancing storm and hazard zones; risk scores, safe vectors, and comms quality are calculated.
3. **Broadcasting**: The updated fleet state is broadcast over Socket.IO to the `shore-operators` room, while individual vessel telemetries are dispatched to `vessel:<vesselId>`.
4. **Distress Lifecycle**:
   - Fisherman initiates SOS with a unique client-generated UUID idempotency key.
   - Server commits the incident in a database transaction (`status = 'RECEIVED'`).
   - Shore Command displays the emergency with audible alert and pulsing red indicator.
   - Operator clicks **Acknowledge** (`status = 'ACKNOWLEDGED'`).
   - Fisherman HUD updates immediately: *"Coast Guard Shore Operator acknowledged alert"*.
