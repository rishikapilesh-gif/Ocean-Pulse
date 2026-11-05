import {
  VesselState,
  StormState,
  HazardZoneState,
  RiskAssessment,
  HorizonAssessment,
  RiskFactor,
  RiskLevel,
  WarningAdvice,
  WORLD_BOUNDS,
  RISK_LEVELS,
  WARNING_ADVICE,
} from '@ocean-pulse/shared';
import {
  bearingToAngle,
  angleToBearing,
  angleDiff,
  compassDirection,
  coastX,
  clamp,
} from './calculations';

export const RISK_MODEL_VERSION = 'ocean-pulse-rule-v1.0';

export interface StormVelocity {
  vx: number; // km per minute
  vy: number; // km per minute
}

export function calculateStormVelocity(storm: StormState): StormVelocity {
  const angle = bearingToAngle(storm.bearingDeg);
  const speedKmPerMin = storm.speedKmh / 60;
  return {
    vx: Math.cos(angle) * speedKmPerMin,
    vy: Math.sin(angle) * speedKmPerMin,
  };
}

export function projectStormAt(storm: StormState, tMinutes: number): { x: number; y: number; r: number } {
  const vel = calculateStormVelocity(storm);
  return {
    x: storm.x + vel.vx * tMinutes,
    y: storm.y + vel.vy * tMinutes,
    r: storm.radiusKm + 0.25 * tMinutes, // forecast spreads over time
  };
}

export interface FieldRiskResult {
  rs: number; // Storm proximity risk [0, 1]
  rh: number; // Hazard zone proximity risk [0, 1]
  closestHazard: HazardZoneState | null;
  rw: number; // Wave severity risk [0, 1]
  waveHeightM: number;
  distToStormCenterKm: number;
  stormCenter: { x: number; y: number; r: number };
  inStorm: boolean;
  inHazardZone: boolean;
}

export function calculateFieldRisk(
  x: number,
  y: number,
  tMinutes: number,
  storm: StormState,
  hazards: HazardZoneState[]
): FieldRiskResult {
  const s = projectStormAt(storm, tMinutes);
  const d = Math.hypot(x - s.x, y - s.y);

  // Storm risk curve
  const rs = clamp(1 - (d - 0.7 * s.r) / (0.7 * s.r + 10), 0, 1);

  // Hazard zones
  let rh = 0;
  let closestHazard: HazardZoneState | null = null;
  for (const h of hazards) {
    const dh = Math.hypot(x - h.x, y - h.y);
    const v = clamp(1 - (dh - 0.7 * h.radiusKm) / (0.7 * h.radiusKm + 4), 0, 1);
    if (v > rh || closestHazard === null) {
      if (v >= rh) {
        rh = v;
        closestHazard = h;
      }
    }
  }

  // Wave model (waves rise exponentially near storm core)
  const waveHeightM = 0.8 + 6.0 * Math.exp(-Math.pow(d / (s.r * 1.1), 2));
  const rw = clamp((waveHeightM - 2.5) / 3.0, 0, 1);

  return {
    rs,
    rh,
    closestHazard,
    rw,
    waveHeightM,
    distToStormCenterKm: d,
    stormCenter: s,
    inStorm: d <= s.r,
    inHazardZone: closestHazard ? Math.hypot(x - closestHazard.x, y - closestHazard.y) <= closestHazard.radiusKm : false,
  };
}

export function combineRisk(
  vessel: Pick<VesselState, 'engineFault' | 'commState' | 'activeDistress'>,
  field: FieldRiskResult
): number {
  let r = 1 - (1 - field.rs) * (1 - field.rh) * (1 - 0.5 * field.rw);

  // Engine breakdown drastically impairs evasive capability
  if (vessel.engineFault) {
    r += (1 - r) * 0.25;
  }

  // Communication degradation raises operational risk
  const commPenalty = vessel.commState === 'lost' ? 0.15 : vessel.commState === 'weak' ? 0.06 : 0;
  r += (1 - r) * commPenalty;

  // Active distress constitutes an authoritative emergency override
  if (vessel.activeDistress) {
    r = Math.max(r, 0.95);
  }

  return clamp(r, 0, 1);
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 0.8) return RISK_LEVELS.CRITICAL;
  if (score >= 0.6) return RISK_LEVELS.HIGH;
  if (score >= 0.35) return RISK_LEVELS.MEDIUM;
  return RISK_LEVELS.SAFE;
}

export function getWarningAdvice(level: RiskLevel): WarningAdvice {
  if (level === RISK_LEVELS.CRITICAL) return WARNING_ADVICE.DANGER;
  if (level === RISK_LEVELS.HIGH || level === RISK_LEVELS.MEDIUM) return WARNING_ADVICE.CAUTION;
  return WARNING_ADVICE.SAFE;
}

export function getEffectiveSpeedKmPerMin(vessel: Pick<VesselState, 'speedKmh' | 'engineFault'>): number {
  const speed = vessel.speedKmh * (vessel.engineFault ? 0.5 : 1.0);
  return speed / 60;
}

export function getReportedPosition(vessel: Pick<VesselState, 'x' | 'y' | 'glitchActive' | 'glitchOffset'>): { x: number; y: number } {
  if (vessel.glitchActive) {
    return {
      x: vessel.x + vessel.glitchOffset.x,
      y: vessel.y + vessel.glitchOffset.y,
    };
  }
  return { x: vessel.x, y: vessel.y };
}

export function findSafeAngle(
  vessel: Pick<VesselState, 'headingRad' | 'speedKmh' | 'engineFault' | 'commState' | 'activeDistress'>,
  repPos: { x: number; y: number },
  storm: StormState,
  hazards: HazardZoneState[]
): number {
  const sp = getEffectiveSpeedKmPerMin(vessel);
  let bestAngle = vessel.headingRad;
  let bestCost = Infinity;

  // Search 36 bearings in 10-degree increments
  for (let k = 0; k < 36; k++) {
    const angle = bearingToAngle(k * 10);
    const vx = Math.cos(angle) * sp;
    const vy = Math.sin(angle) * sp;
    let peakRisk = 0;

    for (const t of [5, 10, 15, 20]) {
      const px = repPos.x + vx * t;
      const py = repPos.y + vy * t;
      const f = calculateFieldRisk(px, py, t, storm, hazards);
      let r = combineRisk(vessel, f);

      // Severe penalty for grounding on coast or exiting operational bounds
      if (px < coastX(py) + 2 || px > WORLD_BOUNDS.widthKm - 1 || py < 1 || py > WORLD_BOUNDS.heightKm - 1) {
        r = Math.max(r, 0.92);
      }
      peakRisk = Math.max(peakRisk, r);
    }

    // Cost combines peak hazard risk and minimal course deviation
    const deviationPenalty = (Math.abs(angleDiff(vessel.headingRad, angle)) / Math.PI) * 0.08;
    const cost = peakRisk + deviationPenalty;

    if (cost < bestCost) {
      bestCost = cost;
      bestAngle = angle;
    }
  }

  return bestAngle;
}

export function assessVesselRisk(
  vessel: VesselState,
  storm: StormState,
  hazards: HazardZoneState[],
  simTimeMinutes: number
): RiskAssessment {
  const repPos = getReportedPosition(vessel);
  const sp = getEffectiveSpeedKmPerMin(vessel);
  const vx = Math.cos(vessel.headingRad) * sp;
  const vy = Math.sin(vessel.headingRad) * sp;

  // 1. Evaluate horizons at 0, 5, 10, 15 minutes
  const horizons: HorizonAssessment[] = [0, 5, 10, 15].map((t) => {
    const px = repPos.x + vx * t;
    const py = repPos.y + vy * t;
    const f = calculateFieldRisk(px, py, t, storm, hazards);
    const r = combineRisk(vessel, f);
    return {
      minute: t,
      riskScore: r,
      level: getRiskLevel(r),
      waveHeightM: f.waveHeightM,
      inStorm: f.inStorm,
      inHazardZone: f.inHazardZone,
    };
  });

  // 2. Scan for Time to Danger (TTD) over 30 minutes in 0.5 min steps
  let ttdStorm: number | null = null;
  let ttdHazard: number | null = null;
  let hazardName: string | null = null;

  for (let t = 0; t <= 30; t += 0.5) {
    const px = repPos.x + vx * t;
    const py = repPos.y + vy * t;
    const f = calculateFieldRisk(px, py, t, storm, hazards);
    if (ttdStorm === null && f.inStorm) ttdStorm = t;
    if (ttdHazard === null && f.inHazardZone && f.closestHazard) {
      ttdHazard = t;
      hazardName = f.closestHazard.name;
    }
    if (ttdStorm !== null && ttdHazard !== null) break;
  }

  const rawRisk = Math.max(...horizons.map((h) => h.riskScore));
  const level = getRiskLevel(rawRisk);
  const scenarioRiskScore = Math.round(rawRisk * 100);

  let timeToDanger: number | null = null;
  let timeToDangerLabel = 'No hazard expected within 30 min';

  if (ttdStorm !== null && (ttdHazard === null || ttdStorm <= ttdHazard)) {
    timeToDanger = ttdStorm;
    timeToDangerLabel = ttdStorm === 0 ? 'Inside storm core now' : `Storm intersects projected track in ${Math.round(ttdStorm)} min`;
  } else if (ttdHazard !== null) {
    timeToDanger = ttdHazard;
    timeToDangerLabel = ttdHazard === 0 ? `Inside ${hazardName} now` : `Enters ${hazardName} in ${Math.round(ttdHazard)} min`;
  }

  // 3. Compute Evidence Confidence (starts at 96%)
  let confidence = 96;
  if (vessel.commState === 'weak') confidence -= 10;
  if (vessel.commState === 'lost') {
    confidence -= 25 + Math.min(20, (simTimeMinutes - vessel.lastContactMinAgo) * 0.8);
  }
  if (!vessel.equipment.hasWeatherReceiver) confidence -= 8;
  if (!vessel.equipment.hasCompass) confidence -= 6;
  if (vessel.glitchActive) confidence -= 30;
  confidence = clamp(Math.round(confidence), 15, 99);

  // 4. Construct Explainable Risk Factors
  const factors: RiskFactor[] = [];
  const addFactor = (weight: number, code: string, text: string, severity: 'crit' | 'warn' | 'info', source?: string) => {
    factors.push({ weight, code, text, severity, source });
  };

  const f0 = calculateFieldRisk(repPos.x, repPos.y, 0, storm, hazards);
  const maxRs = Math.max(...horizons.map((h) => calculateFieldRisk(repPos.x + vx * h.minute, repPos.y + vy * h.minute, h.minute, storm, hazards).rs));
  const maxWave = Math.max(...horizons.map((h) => h.waveHeightM));

  if (vessel.activeDistress) {
    addFactor(1.0, 'ACTIVE_DISTRESS', `Active Emergency Distress Alert (${vessel.activeDistressType || 'SOS'}) received`, 'crit', 'HUD_EMERGENCY');
  }

  if (maxRs >= 0.2) {
    let desc = '';
    if (f0.inStorm) {
      desc = `Vessel inside active storm cell; sea state ${f0.waveHeightM.toFixed(1)} m waves`;
    } else if (ttdStorm !== null) {
      desc = `Approaching storm cell; projected intersection in ~${Math.round(ttdStorm)} min`;
    } else {
      desc = `Storm proximity: outer boundary is ${Math.max(0, f0.distToStormCenterKm - storm.radiusKm).toFixed(0)} km away`;
    }
    addFactor(maxRs, 'STORM_PROXIMITY', desc, maxRs >= 0.6 ? 'crit' : 'warn', storm.source);

    // Course pointing directly into storm
    const toStormAngle = Math.atan2(storm.y - repPos.y, storm.x - repPos.x);
    if (!f0.inStorm && Math.abs(angleDiff(vessel.headingRad, toStormAngle)) < 0.9) {
      addFactor(maxRs * 0.9, 'COURSE_INTO_STORM', 'Vessel course is heading directly toward advancing storm core', 'warn');
    }
  }

  if (ttdHazard !== null && hazardName) {
    addFactor(
      0.75,
      'HAZARD_INTERSECTION',
      ttdHazard === 0 ? `Vessel situated within ${hazardName}` : `Projected track intersects ${hazardName} in ~${Math.round(ttdHazard)} min`,
      'crit'
    );
  }

  if (maxWave >= 2.8) {
    addFactor(0.65, 'HIGH_SEAS', `Adverse sea state: wave heights up to ${maxWave.toFixed(1)} m projected`, 'warn');
  }

  if (vessel.commState === 'weak') {
    addFactor(0.3, 'COMMS_DEGRADED', 'Cellular/Radio signal weak; safety advisory delivery may lag', 'warn');
  }

  if (vessel.commState === 'lost') {
    addFactor(0.55, 'COMMS_LOST', `Radio contact lost; last telemetry confirmed ${Math.round(vessel.lastContactMinAgo)} min ago`, 'crit');
  }

  if (vessel.engineFault) {
    addFactor(0.55, 'ENGINE_FAULT', 'Engine propulsion malfunction reported; maneuvering speed reduced by 50%', 'crit');
  }

  if (vessel.glitchActive) {
    addFactor(0.6, 'TELEMETRY_CONFLICT', 'Telemetry conflict detected: GPS fix diverges from coastal beacon reference', 'crit');
  }

  if (!vessel.equipment.hasWeatherReceiver) {
    addFactor(0.06, 'NO_WEATHER_EQUIPMENT', 'No onboard ocean forecast receiver; reliant solely on shore broadcasts', 'info');
  }

  if (!vessel.equipment.hasCompass) {
    addFactor(0.05, 'ESTIMATED_HEADING', 'No marine compass equipped; heading estimated via GPS track', 'info');
  }

  if (factors.filter((f) => f.severity !== 'info').length === 0) {
    addFactor(0.1, 'NOMINAL_STATE', 'No critical hazard detected along projected track for next 15 minutes', 'info');
  }

  factors.sort((a, b) => b.weight - a.weight);

  // 5. Calculate Safe Heading Direction
  const safeAngleRad = rawRisk >= 0.2 ? findSafeAngle(vessel, repPos, storm, hazards) : null;
  const safeBearingDeg = safeAngleRad !== null ? angleToBearing(safeAngleRad) : null;
  const recommendedCompass = safeBearingDeg !== null ? compassDirection(safeBearingDeg) : null;

  // 6. Urgency Score for Deterministic Prioritization
  const urgencyScore = timeToDanger !== null ? 0.25 * (1 - timeToDanger / 30) : 0;
  const distressBonus = vessel.activeDistress ? 5.0 : 0;
  const sortKey = rawRisk + urgencyScore + distressBonus;

  const dataQuality = vessel.glitchActive
    ? 'CONFLICTING'
    : vessel.commState === 'lost'
    ? 'STALE'
    : confidence >= 80
    ? 'VERIFIED'
    : 'PARTIAL';

  return {
    vesselId: vessel.id,
    scenarioRiskScore,
    rawRisk,
    level,
    confidence,
    horizons,
    factors,
    timeToDanger,
    timeToDangerLabel,
    safeAngleRad,
    safeBearingDeg,
    recommendedCompass,
    urgencyScore,
    sortKey,
    dataQuality,
    modelVersion: RISK_MODEL_VERSION,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Deterministic fleet ranking:
 * 1. Active distress reports first (CRITICAL override)
 * 2. Critical hazard exposure & time-to-hazard urgency
 * 3. High severity risk supported by evidence
 * 4. Significant risk with comms/equipment degradation
 * 5. Other assessed vessels requiring monitoring
 * 6. Low risk vessels
 * Tie-breaker: stable vessel ID
 */
export function rankFleet(vessels: VesselState[]): VesselState[] {
  return [...vessels].sort((a, b) => {
    const keyA = a.assessment?.sortKey ?? 0;
    const keyB = b.assessment?.sortKey ?? 0;
    if (Math.abs(keyB - keyA) > 0.0001) {
      return keyB - keyA;
    }
    // Stable tie-breaker
    return a.id.localeCompare(b.id);
  });
}
