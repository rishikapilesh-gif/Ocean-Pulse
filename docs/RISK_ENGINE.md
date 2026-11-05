# Ocean Pulse — Deterministic Risk Engine Specification

**Engine Model Version:** `ocean-pulse-rule-v1.0`

## 1. Principles & Objectives
The Ocean Pulse risk engine calculates an explainable **scenario risk score** (0 to 100%) and **risk level** (`Safe`, `Medium`, `High`, `Critical`) for every vessel in the fleet.

- **Deterministic:** The engine yields identical results for identical inputs.
- **Safety Conservative:** Missing telemetry, radio blackout, or sensor degradation is **never** treated as proof of safety.
- **Audit Provenance:** All scoring decisions store contributing factors, calculation time, confidence, and horizon scores.

---

## 2. Mathematical Formulations

### A. Dynamic Storm Projection
The storm's center $(x_t, y_t)$ and radius $r_t$ spread over forward time $t$ (in minutes):
$$\vec{v}_{storm} = \left(\cos(\theta_{bearing}) \cdot \frac{s}{60}, \sin(\theta_{bearing}) \cdot \frac{s}{60}\right)$$
$$x(t) = x_0 + v_x \cdot t, \quad y(t) = y_0 + v_y \cdot t, \quad r(t) = r_0 + 0.25 \cdot t$$

### B. Field Risk Components
For any position $(x, y)$ at future minute $t$:
1. **Storm Proximity Risk ($r_s$):**
   $$d = \sqrt{(x - x_t)^2 + (y - y_t)^2}$$
   $$r_s = \text{clamp}\left(1 - \frac{d - 0.7 r_t}{0.7 r_t + 10}, 0, 1\right)$$
2. **Marine Hazard Zone Risk ($r_h$):**
   $$d_h = \sqrt{(x - x_{haz})^2 + (y - y_{haz})^2}$$
   $$r_h = \max_{h \in Hazards} \text{clamp}\left(1 - \frac{d_h - 0.7 r_h}{0.7 r_h + 4}, 0, 1\right)$$
3. **Exponential Sea State / Wave Height Model ($r_w$):**
   $$H_{wave}(d) = 0.8 + 6.0 \cdot \exp\left(-\left(\frac{d}{1.1 r_t}\right)^2\right)$$
   $$r_w = \text{clamp}\left(\frac{H_{wave} - 2.5}{3.0}, 0, 1\right)$$

### C. Combined Vessel Risk
$$R_{base} = 1 - (1 - r_s)(1 - r_h)(1 - 0.5 r_w)$$
- **Engine Fault Penalty:** If propulsion fails, $R \leftarrow R + (1 - R) \cdot 0.25$.
- **Communication Blackout Penalty:**
  - Lost contact: $R \leftarrow R + (1 - R) \cdot 0.15$.
  - Weak contact: $R \leftarrow R + (1 - R) \cdot 0.06$.
- **Active Distress Override:** If an emergency SOS is triggered, $R \leftarrow \max(R, 0.95)$.

---

## 3. Safe Heading Vector Search (`findSafeAngle`)
The engine evaluates 36 possible compass bearings $\theta \in [0^\circ, 350^\circ]$ in $10^\circ$ increments over forward horizons $t \in [5, 10, 15, 20]$ minutes.

$$\text{Cost}(\theta) = \max_{t} R(x_t(\theta), y_t(\theta), t) + \frac{|\Delta\theta|}{\pi} \cdot 0.08$$

Grounding penalties are enforced if the projected trajectory approaches the Malabar coastline:
$$x(t) < \text{coastX}(y(t)) + 2 \implies R \ge 0.92$$

The heading minimizing this cost function is published to the fisherman's cockpit as the recommended evasive bearing.

---

## 4. Evidence Confidence Scoring
Confidence starts at **96%** and degrades according to missing or conflicting onboard sensors:
- Weak communication signal: $-10\%$
- Lost communication signal: $-25\% - \min(20, \Delta t_{contact} \cdot 0.8)$
- Missing marine weather receiver: $-8\%$
- Missing gyrocompass: $-6\%$
- GPS telemetry glitch / beacon divergence: $-30\%$
- Clamped between $15\%$ and $99\%$.
