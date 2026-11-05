# Ocean Pulse — Prototype Migration Checklist

This document details the migration of the original HTML/JS single-file prototype (`OceanAhead`) into the full-stack, persistent, production-grade **Ocean Pulse** platform.

| Original Prototype Feature | Status in Ocean Pulse | Architectural Improvements & Migration Notes |
| :--- | :--- | :--- |
| **Product Branding** | **Standardized** | Replaced all obsolete references to `OceanAhead` with **Ocean Pulse** and standardized the tagline: *"See the risk. Prioritize the fleet. Protect lives."* |
| **Deterministic Risk Engine** | **Preserved & Modularized** | Extracted from script tag into an authoritative pure TypeScript module (`@ocean-pulse/api/risk-engine`). Versioned as `ocean-pulse-rule-v1.0` with 100% automated test coverage. |
| **Safe Steering Vector Search** | **Preserved & Improved** | Search algorithm preserved across 36 bearings and 4 temporal horizons (5, 10, 15, 20m), with grounding avoidance along the Malabar coastline. |
| **Time-to-Danger (TTD)** | **Preserved & Persisted** | 30-minute forward scan in 0.5-min intervals against dynamic storm polygons and static hazard zones. Persisted in database and streamed via WebSockets. |
| **15-Minute Risk Horizon Bar Chart** | **Preserved & Polished** | 0m, 5m, 10m, 15m risk score progression displayed in both Shore Command and Fisherman HUD. |
| **Confidence & Sensor Profiling** | **Preserved & Expanded** | Starts at 96% and explicitly deducts penalties for missing weather receivers (-8%), missing compass (-6%), GPS glitches (-30%), and communication degradation. |
| **What-If Controls** | **Preserved & Synchronized** | Shore operators can toggle engine faults, trigger GPS glitches, cut radio comms, or reverse/reroute course. Live changes propagate immediately across real-time sockets. |
| **Fisherman HUD** | **Completely Upgraded** | Migrated from a small preview card into a **dedicated mobile-first touch cockpit**: press-and-hold SOS (2s hold to prevent accidental triggers on rocking boats), multilingual speech synthesis (Malayalam, Tamil, Hindi, English), and transmission status tracking. |
| **Offline Resilience** | **New Implementation** | Added genuine **IndexedDB offline queue** (`idb`). When internet or radio contact is lost, unsent SOS and assistance requests are cached with UUID idempotency keys and automatically reconciled upon reconnection. |
| **Data Persistence** | **New Implementation** | Migrated from browser RAM into **Prisma ORM with SQLite (local) and PostgreSQL (Render)** with tables for Users, Vessels, Telemetries, Incidents, AssistanceRequests, Messages, and AuditEvents. |
| **Authentication & RBAC** | **New Implementation** | Implemented JWT authentication and role-based permissions (`ADMIN`, `SHORE_OPERATOR`, `SUPERVISOR`, `FISHERMAN`, `DEMO_VIEWER`) with one-click test account switcher for judges. |
| **Incident Management** | **New Implementation** | Prioritized incident triage queue supporting: `RECEIVED -> ACKNOWLEDGED -> ASSESSED -> ASSIGNED -> ACTION_IN_PROGRESS (MRCC) -> RESOLVED -> CLOSED`. |
| **Assistance Coordination** | **New Implementation** | Separate logistical lifecycle for non-emergency resource requests (Drinking Water, Food, Diesel, Towing, First Aid). |
| **Evidence-Grounded AI Copilot** | **Preserved & Fortified** | Local/pluggable LLM adapter (Ollama/OpenAI/Fallback) strictly restricted by safety prompt: cannot invent telemetry, cannot override deterministic scores, and cannot declare a vessel safe without data. |
| **5 Reproducible Scenarios** | **New Implementation** | Added dedicated scenario selector for the 5 hackathon test cases (Collision Course, Propulsion Failure, Comms Loss, Concurrent SOS, and Offline HUD Reconciliation) with instant scenario reset. |
