# Ocean Pulse — 5-Minute Technical Demonstration Script

**Event:** SELF(E) College Hackathon 2026  
**Audience:** Technical Judges & Evaluation Panel  
**Time Limit:** 5 Minutes

---

## 0:00 – 0:45 | The Problem & Architectural Positioning
- **Hook:** "In India, over 35.74 Lakh fishers operate annually under the Group Accident Insurance Scheme. Official bodies like INCOIS and IMD provide world-class forecasts, and ISRO has deployed over 20,000 Distress Alert Terminals. But here is the critical operational challenge: **one warning does not equal one risk**. Two boats facing the same storm have vastly different vulnerabilities depending on speed, hull, engine health, and radio range. Shore command centers suffer from alert fatigue."
- **Solution:** "Ocean Pulse is an **explainable fleet attention layer and digital ocean twin**. It continuously evaluates all available evidence to answer three questions for shore operators: *Who needs attention first? Why? And what specific action should be taken?*"

---

## 0:45 – 1:45 | Shore Safety Command Center & Digital Ocean Twin
1. Navigate to `http://localhost:3001` or `/shore`.
2. **Show the Digital Ocean Twin Map:** Point out the Malabar coastline, Kochi Shore Command station with its radio coverage range ring, marine hazard zones (Rocky Reef, Shipping Sanctuary), and the moving storm cell.
3. **Show Autonomous Fleet Prioritization:**
   - Demonstrate the ranked fleet list on the right.
   - Point out that vessels are ranked not by arbitrary AI guesses, but by an authoritative, deterministic backend risk engine factoring projected 15-minute storm intersections and time-to-hazard.
4. **Inspect Vessel B01 (Sagar Kanya):**
   - Click B01 to open the detail panel.
   - Show the **15-minute horizon chart** showing risk progression (Now, +5m, +10m, +15m).
   - Show the explainable factor breakdown (Storm proximity, course into storm, wave heights).

---

## 1:45 – 2:45 | What-If Simulation & Local AI Safety Copilot
1. **Trigger a What-If Fault:**
   - In the Vessel detail panel, click **"Cut Comms"** or **"Trigger Glitch"**.
   - Observe how confidence immediately drops and contributing factors flag *"Radio contact lost"* or *"GPS conflict detected"*.
   - Drag the storm cell on the map or adjust its speed/bearing slider; watch the fleet re-rank in real time.
2. **Demonstrate the AI Copilot:**
   - Switch to the **Copilot Tab**. Click **"Generate AI Brief"**.
   - Show the judges the verified input evidence tags: *"Boat B01", "GPS Conflict", "Confidence 66%"*.
   - Point out the **Safety Policy boundary**: the AI strictly explains verified telemetry under four standard operational headings (Priority, Why, What To Do, Data Limitations). It cannot invent readings or override risk scores.

---

## 2:45 – 4:00 | Fisherman Touch HUD & Press-and-Hold SOS Workflow
1. Open the **Fisherman HUD** (`/fisherman`) in a second browser window or side-by-side tab.
2. **Show the Mobile Cockpit:**
   - Point out the large, high-contrast **DANGER** advisory badge.
   - Select **Malayalam (മലയാളം)** or **Tamil (தமிழ்)** and click **"Speak Warning"**; let judges hear the speech synthesis.
   - Show the green evasive heading arrow instructing the master to steer clear of the storm.
3. **Simulate an Emergency Distress Call:**
   - Press and hold the **SOS Button** for 2 seconds. The animated white progress ring confirms the hold to prevent accidental activation.
   - Select emergency category: *"Capsize / Sinking Concern"*. Click **Transmit SOS**.
4. **Observe Shore Command Real-Time Alert:**
   - Switch back to Shore Command. The active distress counter pulses red with an audible alarm.
   - Click the **Distress Tab**. The emergency is logged with exact GPS fix, submission timestamp, and server commitment timestamp.
5. **Acknowledge the Emergency:**
   - As the shore operator, click **"Acknowledge Distress Immediately"**.
   - Switch back to the Fisherman HUD: the status progression immediately transitions from *Sent* to *✓ Operator Acknowledged at [Time]*.

---

## 4:00 – 4:45 | Offline Queue & Reconnection Resilience
1. In the browser Developer Tools (or by cutting the simulated radio toggle), set network to **Offline**.
2. Notice the persistent warning on the Fisherman HUD:
   > *"NOT CONNECTED — YOUR SOS HAS NOT BEEN CONFIRMED RECEIVED."*
3. Click **"Request Supplies"** and submit a request for *"40 Liters Diesel"*.
4. Show that the message is safely queued in **IndexedDB** with a unique UUID idempotency key: *"1 request stored in offline device memory"*.
5. Restore network connectivity to **Online**:
   - The offline queue immediately synchronizes with the backend.
   - The idempotency key ensures zero duplicate records are created.

---

## 4:45 – 5:00 | Conclusion & Impact
- "Ocean Pulse does not claim to replace India's official maritime safety apparatus or certified satellite beacons. Instead, it provides the missing decision-support layer: connecting fragmented signals, prioritizing limited shore attention, and keeping fishers safe."
- Invite judges' questions.
