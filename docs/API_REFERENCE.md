# Ocean Pulse — REST API & WebSocket Event Reference

Base URL: `/api/v1`  
All successful responses return a JSON envelope:
```json
{
  "success": true,
  "data": {},
  "meta": { "requestId": "..." }
}
```

---

## 1. Authentication Endpoints

### `POST /auth/login`
Authenticates a user and issues a signed JWT.
- **Body:** `{ "email": "string", "password": "string" }`
- **Response (200):** `{ token: "jwt...", user: { id, name, email, role, assignedVesselId } }`

### `GET /auth/me`
Retrieves currently authenticated session.
- **Header:** `Authorization: Bearer <token>`
- **Response (200):** `{ user: { ... } }`

---

## 2. Fleet & Vessel Endpoints

### `GET /vessels`
Returns all fleet vessels ranked deterministically by risk urgency.
- **Query:** `?filter=Critical` (optional)
- **Response (200):** `{ vessels: VesselState[] }`

### `GET /vessels/:id`
Returns single vessel state, assessment, and 15-min horizon projections.
- **Response (200):** `{ vessel: VesselState }`

### `PATCH /vessels/:id/whatif`
Applies an operator what-if override.
- **Body:**
  - `forceLostComms?: boolean`
  - `triggerGpsGlitch?: boolean`
  - `toggleEngineFault?: boolean`
  - `rerouteHeadingDeg?: number`
- **Response (200):** `{ vessel: VesselState }`

### `POST /vessels/:id/acknowledge-warning`
Records that the fisherman aboard has seen the warning.
- **Response (200):** `{ message: "..." }`

### `GET /vessels/:id/copilot-brief`
Generates an evidence-grounded AI briefing for the operator.
- **Response (200):** `{ brief: AICopilotBrief }`

---

## 3. Distress & Incident Endpoints

### `POST /sos`
Submits an emergency SOS distress alert. **Protected by Idempotency Key.**
- **Body:**
  ```json
  {
    "vesselId": "B01",
    "type": "MANUAL_SOS",
    "lat": 9.75,
    "lng": 76.35,
    "gpsAccuracyMeters": 5.0,
    "idempotencyKey": "sos-b01-179299...",
    "notes": "Engine fire aboard"
  }
  ```
- **Response (201 Created / 200 Idempotent Retry):**
  ```json
  {
    "incident": { "id": "...", "status": "RECEIVED" },
    "isDuplicate": false,
    "message": "Distress alert committed to database"
  }
  ```

### `GET /incidents`
Lists active or historical incidents.
- **Query:** `?status=RECEIVED&vesselId=B01`
- **Response (200):** `{ incidents: IncidentRecord[] }`

### `POST /incidents/:id/acknowledge`
Shore operator acknowledges receipt of emergency distress.
- **Body:** `{ "notes": "Acknowledged by operator on duty" }`
- **Response (200):** `{ incident: IncidentRecord }`

### `POST /incidents/:id/escalate`
Supervisor escalates incident to external agency (e.g. Indian Coast Guard MRCC).
- **Body:** `{ "agencyName": "ICG MRCC Kochi", "reason": "Severe gale capsize threat" }`
- **Response (200):** `{ incident: IncidentRecord }`

### `POST /incidents/:id/resolve`
Marks incident resolved with mandatory outcome documentation.
- **Body:** `{ "resolutionNotes": "Vessel towed to safe harbor" }`
- **Response (200):** `{ incident: IncidentRecord }`

---

## 4. Assistance Requests

### `POST /requests`
Submits non-distress logistical requests.
- **Body:** `{ "vesselId": "B02", "category": "DRINKING_WATER", "quantityOrDetails": "30 Liters", "urgency": "MEDIUM", "lat": 9.6, "lng": 76.1, "idempotencyKey": "..." }`
- **Response (201 / 200):** `{ request: AssistanceRequestRecord }`

### `PATCH /requests/:id/status`
Updates lifecycle status (`ACKNOWLEDGED`, `DISPATCHED`, `COMPLETED`, `CANCELLED`).
- **Body:** `{ "status": "DISPATCHED", "notes": "Patrol craft launched with supplies" }`

---

## 5. Simulation Endpoints

### `GET /simulation/state`
Returns complete simulation state (vessels, storm, hazards, simulation clock).

### `POST /simulation/control`
Executes simulation actions (`PLAY`, `PAUSE`, `SET_SPEED`, `LOAD_SCENARIO`, `RESET`, `UPDATE_STORM`).

---

## 6. Socket.IO Real-time Events

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `subscribe:shore` | Client -> Server | None | Joins `shore-operators` room |
| `subscribe:vessel` | Client -> Server | `vesselId` | Joins authorized vessel room |
| `fleet:state` | Server -> Client | Full state | Dispatched on every simulation tick |
| `incident:created` | Server -> Client | `IncidentRecord` | Dispatched immediately upon committed SOS |
| `incident:acknowledged` | Server -> Client | Acknowledgment meta | Notifies fisherman HUD that operator has seen distress |
| `request:created` | Server -> Client | `AssistanceRequestRecord` | Logistical request received |
| `request:updated` | Server -> Client | `AssistanceRequestRecord` | Logistical status transition |
