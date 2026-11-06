import {
  VesselState,
  StormState,
  HazardZoneState,
  SimulationState,
  IncidentRecord,
  AssistanceRequestRecord,
  INITIAL_FLEET,
  VESSEL_EQUIPMENT_PROFILES,
  DEFAULT_HAZARDS,
} from '@ocean-pulse/shared';
import {
  gridToGeo,
  bearingToAngle,
  coastX,
} from '../../../api/src/risk-engine/calculations';
import {
  assessVesselRisk,
  rankFleet,
  calculateStormVelocity,
} from '../../../api/src/risk-engine/engine';

export function createInitialStorm(): StormState {
  return {
    x: 88,
    y: 30,
    lat: gridToGeo({ x: 88, y: 30 }).lat,
    lng: gridToGeo({ x: 88, y: 30 }).lng,
    radiusKm: 13,
    bearingDeg: 270,
    speedKmh: 18,
    maxWindSpeedKts: 52,
    centralPressureHpa: 982,
    source: 'IMD Coastal Doppler Radar (Kochi Station)',
    isSimulated: true,
    updatedAtIso: new Date().toISOString(),
  };
}

export function createInitialHazards(): HazardZoneState[] {
  return DEFAULT_HAZARDS.map((h) => ({
    id: h.id,
    name: h.name,
    x: h.x,
    y: h.y,
    lat: gridToGeo({ x: h.x, y: h.y }).lat,
    lng: gridToGeo({ x: h.x, y: h.y }).lng,
    radiusKm: h.r,
    severity: h.severity as any,
    type: (h.id === 'HAZ-01' ? 'REEF' : h.id === 'HAZ-02' ? 'RESTRICTED' : 'SHOAL') as any,
  }));
}

export function createInitialVessels(storm: StormState, hazards: HazardZoneState[]): VesselState[] {
  const baseVessels: VesselState[] = INITIAL_FLEET.map((f) => {
    const angle = bearingToAngle(f.bearing);
    const geo = gridToGeo({ x: f.x, y: f.y });

    // Scenario flags
    const isB01 = f.id === 'B01';
    const isB04 = f.id === 'B04';
    const isB06 = f.id === 'B06';

    const vessel: VesselState = {
      id: f.id,
      name: f.name,
      regNo: f.regNo,
      master: f.master,
      type: f.type,
      equipment: VESSEL_EQUIPMENT_PROFILES[f.type],
      x: f.x,
      y: f.y,
      lat: geo.lat,
      lng: geo.lng,
      speedKmh: f.speedKmh,
      effectiveSpeedKmh: isB04 ? f.speedKmh * 0.5 : f.speedKmh,
      headingRad: angle,
      courseRad: angle,
      bearingDeg: f.bearing,
      trail: [{ x: f.x, y: f.y }],
      forceLost: isB06,
      glitchActive: false,
      glitchRemainingSec: 0,
      glitchOffset: { x: 0, y: 0 },
      engineFault: isB04,
      commState: isB06 ? 'lost' : 'good',
      commQuality: isB06 ? 0.0 : 1.0,
      lastContactMinAgo: isB06 ? 28 : 0,
      lastContactIso: new Date().toISOString(),
      lastDeliveredWarning: {
        level: 'SAFE',
        safeBearingDeg: 270,
        issuedAtIso: new Date().toISOString(),
        acknowledgedByFisher: false,
      },
      activeDistress: isB01,
      activeDistressType: isB01 ? 'MANUAL_SOS' : undefined,
      unacknowledgedAlertsCount: isB01 ? 1 : 0,
      openAssistanceRequestsCount: f.id === 'B02' || f.id === 'B07' ? 1 : 0,
    };

    return vessel;
  });

  return rankFleet(
    baseVessels.map((v) => ({
      ...v,
      assessment: assessVesselRisk(v, storm, hazards, 0),
    }))
  );
}

export function createInitialIncidents(): IncidentRecord[] {
  return [
    {
      id: 'INC-2026-001',
      vesselId: 'B01',
      vesselName: 'Sagar Kanya',
      type: 'MANUAL_SOS',
      priority: 'CRITICAL',
      status: 'RECEIVED',
      reportedLat: 9.77,
      reportedLng: 76.44,
      reportedGridX: 70,
      reportedGridY: 30,
      source: 'MANUAL_HUD',
      idempotencyKey: 'inc-seed-b01',
      clientSubmittedAt: new Date(Date.now() - 180000).toISOString(),
      serverReceivedAt: new Date(Date.now() - 179000).toISOString(),
      operatorNotes: [
        {
          id: 'note-01',
          operatorName: 'Shore Controller',
          note: 'Vessel on collision path with cyclone outer band. ICGS Samar dispatched.',
          createdAt: new Date().toISOString(),
        },
      ],
      auditTrail: [
        {
          action: 'RECEIVED_SOS',
          actor: 'Antony Joseph (Fisherman)',
          timestamp: new Date().toISOString(),
        },
      ],
    },
    {
      id: 'INC-2026-002',
      vesselId: 'B04',
      vesselName: 'Samudra Ratna',
      type: 'FIRE_OR_ENGINE',
      priority: 'HIGH',
      status: 'ACKNOWLEDGED',
      reportedLat: 10.09,
      reportedLng: 76.09,
      reportedGridX: 32,
      reportedGridY: 66,
      source: 'MANUAL_HUD',
      idempotencyKey: 'inc-seed-b04',
      clientSubmittedAt: new Date(Date.now() - 600000).toISOString(),
      serverReceivedAt: new Date(Date.now() - 598000).toISOString(),
      acknowledgedAt: new Date(Date.now() - 300000).toISOString(),
      operatorNotes: [],
      auditTrail: [],
    },
  ];
}

export function createInitialRequests(): AssistanceRequestRecord[] {
  return [
    {
      id: 'REQ-2026-001',
      vesselId: 'B02',
      vesselName: 'Matsya Jyoti',
      category: 'FUEL',
      quantityOrDetails: '60 Litres Diesel replenishment needed before return',
      urgency: 'HIGH',
      status: 'PENDING',
      reportedLat: 9.91,
      reportedLng: 76.28,
      idempotencyKey: 'req-seed-b02',
      createdAt: new Date(Date.now() - 360000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'REQ-2026-002',
      vesselId: 'B07',
      vesselName: 'Varuna',
      category: 'MEDICAL',
      quantityOrDetails: 'Crew member injured by rigging line — first aid dressing required',
      urgency: 'CRITICAL',
      status: 'ACKNOWLEDGED',
      reportedLat: 9.97,
      reportedLng: 76.49,
      idempotencyKey: 'req-seed-b07',
      createdAt: new Date(Date.now() - 720000).toISOString(),
      updatedAt: new Date().toISOString(),
      acknowledgedAt: new Date(Date.now() - 400000).toISOString(),
    },
  ];
}

/**
 * Tactical Scenarios with full local support for standalone browser demo
 */
export function getStandaloneScenarioData(scenarioId: string, hazards: HazardZoneState[]) {
  const baseStorm = createInitialStorm();
  const baseVessels = createInitialVessels(baseStorm, hazards);

  if (scenarioId === 'scenario-2') {
    // 2. Propulsion Breakdown & Drift into Reef
    const storm: StormState = {
      ...baseStorm,
      x: 95,
      y: 40,
      radiusKm: 14,
      bearingDeg: 250,
      speedKmh: 15,
      lat: gridToGeo({ x: 95, y: 40 }).lat,
      lng: gridToGeo({ x: 95, y: 40 }).lng,
    };
    const vessels = baseVessels.map((v) => {
      if (v.id === 'B04') {
        const angle = bearingToAngle(120);
        return {
          ...v,
          x: 42,
          y: 60,
          lat: gridToGeo({ x: 42, y: 60 }).lat,
          lng: gridToGeo({ x: 42, y: 60 }).lng,
          bearingDeg: 120,
          headingRad: angle,
          courseRad: angle,
          engineFault: true,
          effectiveSpeedKmh: 4,
          trail: [{ x: 42, y: 60 }],
        };
      }
      return v;
    });

    const ranked = rankFleet(
      vessels.map((v) => ({ ...v, assessment: assessVesselRisk(v, storm, hazards, 0) }))
    );

    const incidents: IncidentRecord[] = [
      {
        id: 'INC-SC2-001',
        vesselId: 'B04',
        vesselName: 'Samudra Ratna',
        type: 'FIRE_OR_ENGINE',
        priority: 'CRITICAL',
        status: 'RECEIVED',
        reportedLat: 10.09,
        reportedLng: 76.09,
        reportedGridX: 42,
        reportedGridY: 60,
        source: 'MANUAL_HUD',
        idempotencyKey: 'inc-sc2-b04',
        clientSubmittedAt: new Date().toISOString(),
        serverReceivedAt: new Date().toISOString(),
        operatorNotes: [],
        auditTrail: [],
      },
    ];

    return {
      storm,
      vessels: ranked,
      incidents,
      requests: createInitialRequests(),
      scenarioName: '2. Propulsion Breakdown & Reef Drift',
    };
  }

  if (scenarioId === 'scenario-3') {
    // 3. Communication Loss & Stale Telemetry
    const storm: StormState = {
      ...baseStorm,
      x: 80,
      y: 25,
      radiusKm: 15,
      bearingDeg: 280,
      speedKmh: 20,
      lat: gridToGeo({ x: 80, y: 25 }).lat,
      lng: gridToGeo({ x: 80, y: 25 }).lng,
    };
    const vessels = baseVessels.map((v) => {
      if (v.id === 'B03') {
        return {
          ...v,
          x: 48,
          y: 22,
          lat: gridToGeo({ x: 48, y: 22 }).lat,
          lng: gridToGeo({ x: 48, y: 22 }).lng,
          forceLost: true,
          commState: 'lost' as const,
          commQuality: 0,
          lastContactMinAgo: 45,
          trail: [{ x: 48, y: 22 }],
        };
      }
      return v;
    });

    const ranked = rankFleet(
      vessels.map((v) => ({ ...v, assessment: assessVesselRisk(v, storm, hazards, 0) }))
    );

    return {
      storm,
      vessels: ranked,
      incidents: createInitialIncidents(),
      requests: createInitialRequests(),
      scenarioName: '3. Communication Loss & Stale Telemetry',
    };
  }

  if (scenarioId === 'scenario-4') {
    // 4. Multiple Concurrent SOS Alerts
    const storm: StormState = {
      ...baseStorm,
      x: 88,
      y: 35,
      radiusKm: 13,
      bearingDeg: 260,
      speedKmh: 16,
      lat: gridToGeo({ x: 88, y: 35 }).lat,
      lng: gridToGeo({ x: 88, y: 35 }).lng,
    };
    const vessels = baseVessels.map((v) => {
      if (v.id === 'B02') {
        return {
          ...v,
          x: 55,
          y: 40,
          lat: gridToGeo({ x: 55, y: 40 }).lat,
          lng: gridToGeo({ x: 55, y: 40 }).lng,
          activeDistress: true,
          activeDistressType: 'CAPSIZE_OR_SINKING' as any,
          unacknowledgedAlertsCount: 1,
        };
      }
      if (v.id === 'B07') {
        return {
          ...v,
          x: 72,
          y: 48,
          lat: gridToGeo({ x: 72, y: 48 }).lat,
          lng: gridToGeo({ x: 72, y: 48 }).lng,
          activeDistress: true,
          activeDistressType: 'MEDICAL_EMERGENCY' as any,
          unacknowledgedAlertsCount: 1,
        };
      }
      return v;
    });

    const ranked = rankFleet(
      vessels.map((v) => ({ ...v, assessment: assessVesselRisk(v, storm, hazards, 0) }))
    );

    const incidents: IncidentRecord[] = [
      {
        id: 'INC-SC4-001',
        vesselId: 'B02',
        vesselName: 'Matsya Jyoti',
        type: 'CAPSIZE_OR_SINKING',
        priority: 'CRITICAL',
        status: 'RECEIVED',
        reportedLat: 9.91,
        reportedLng: 76.28,
        reportedGridX: 55,
        reportedGridY: 40,
        source: 'MANUAL_HUD',
        idempotencyKey: 'inc-sc4-b02',
        clientSubmittedAt: new Date().toISOString(),
        serverReceivedAt: new Date().toISOString(),
        operatorNotes: [],
        auditTrail: [],
      },
      {
        id: 'INC-SC4-002',
        vesselId: 'B07',
        vesselName: 'Varuna',
        type: 'MEDICAL_EMERGENCY',
        priority: 'CRITICAL',
        status: 'RECEIVED',
        reportedLat: 9.97,
        reportedLng: 76.49,
        reportedGridX: 72,
        reportedGridY: 48,
        source: 'MANUAL_HUD',
        idempotencyKey: 'inc-sc4-b07',
        clientSubmittedAt: new Date().toISOString(),
        serverReceivedAt: new Date().toISOString(),
        operatorNotes: [],
        auditTrail: [],
      },
    ];

    return {
      storm,
      vessels: ranked,
      incidents,
      requests: createInitialRequests(),
      scenarioName: '4. Multiple Concurrent SOS Alerts',
    };
  }

  if (scenarioId === 'scenario-5') {
    // 5. Offline HUD Reconnection & Sync
    const storm: StormState = {
      ...baseStorm,
      x: 85,
      y: 20,
      radiusKm: 12,
      bearingDeg: 270,
      speedKmh: 14,
      lat: gridToGeo({ x: 85, y: 20 }).lat,
      lng: gridToGeo({ x: 85, y: 20 }).lng,
    };
    const vessels = baseVessels.map((v) => {
      if (v.id === 'B10') {
        return {
          ...v,
          x: 60,
          y: 15,
          lat: gridToGeo({ x: 60, y: 15 }).lat,
          lng: gridToGeo({ x: 60, y: 15 }).lng,
          forceLost: true,
          commState: 'lost' as const,
          lastContactMinAgo: 22,
        };
      }
      return v;
    });

    const ranked = rankFleet(
      vessels.map((v) => ({ ...v, assessment: assessVesselRisk(v, storm, hazards, 0) }))
    );

    return {
      storm,
      vessels: ranked,
      incidents: createInitialIncidents(),
      requests: createInitialRequests(),
      scenarioName: '5. Offline HUD Reconnection & Sync',
    };
  }

  // Default scenario-1
  return {
    storm: baseStorm,
    vessels: baseVessels,
    incidents: createInitialIncidents(),
    requests: createInitialRequests(),
    scenarioName: '1. Approaching Storm Cell (Track Intersection)',
  };
}

/**
 * Advance deterministic simulation tick
 */
export function stepSimulationTick(
  vessels: VesselState[],
  storm: StormState,
  hazards: HazardZoneState[],
  sim: SimulationState,
  deltaSec: number = 1.5
): { vessels: VesselState[]; storm: StormState; simulation: SimulationState } {
  if (!sim.running) {
    return { vessels, storm, simulation: sim };
  }

  const effectiveDeltaSec = deltaSec * (sim.speedMultiplier || 1.0);
  const deltaMinutes = effectiveDeltaSec / 60;

  // 1. Advance Storm Coordinates
  const stormVel = calculateStormVelocity(storm);
  let nextStormX = storm.x + stormVel.vx * deltaMinutes;
  let nextStormY = storm.y + stormVel.vy * deltaMinutes;

  if (nextStormX < 5) nextStormX = 115;
  if (nextStormX > 115) nextStormX = 5;

  const nextStorm: StormState = {
    ...storm,
    x: nextStormX,
    y: nextStormY,
    lat: gridToGeo({ x: nextStormX, y: nextStormY }).lat,
    lng: gridToGeo({ x: nextStormX, y: nextStormY }).lng,
    updatedAtIso: new Date().toISOString(),
  };

  // 2. Advance Vessels
  const nextVessels: VesselState[] = vessels.map((v) => {
    let currentBearing = v.bearingDeg;

    if (sim.fishermenFollowAdvice && v.assessment?.safeBearingDeg != null) {
      currentBearing = v.assessment.safeBearingDeg;
    }

    const angle = bearingToAngle(currentBearing);
    const speedKmPerMin = (v.effectiveSpeedKmh || v.speedKmh) / 60;
    let nextX = v.x + Math.cos(angle) * speedKmPerMin * deltaMinutes;
    let nextY = v.y + Math.sin(angle) * speedKmPerMin * deltaMinutes;

    const cx = coastX(nextY);
    if (nextX < cx + 2) nextX = cx + 2;
    if (nextX > 115) nextX = 115;
    if (nextY < 5) nextY = 5;
    if (nextY > 75) nextY = 75;

    const trail = [...(v.trail || [])];
    const lastPoint = trail[trail.length - 1];
    if (!lastPoint || Math.hypot(nextX - lastPoint.x, nextY - lastPoint.y) > 0.8) {
      trail.push({ x: nextX, y: nextY });
      if (trail.length > 30) trail.shift();
    }

    const geo = gridToGeo({ x: nextX, y: nextY });

    return {
      ...v,
      x: nextX,
      y: nextY,
      lat: geo.lat,
      lng: geo.lng,
      bearingDeg: currentBearing,
      headingRad: angle,
      courseRad: angle,
      trail,
    };
  });

  const nextSimTimeMinutes = (sim.simTimeMinutes || 0) + deltaMinutes;

  const nextSim: SimulationState = {
    ...sim,
    simTimeMinutes: nextSimTimeMinutes,
  };

  // 3. Recalculate deterministic risk and rank fleet (TDZ-free)
  const assessedVessels = rankFleet(
    nextVessels.map((v) => ({
      ...v,
      assessment: assessVesselRisk(v, nextStorm, hazards, nextSimTimeMinutes),
    }))
  );

  return {
    vessels: assessedVessels,
    storm: nextStorm,
    simulation: nextSim,
  };
}
