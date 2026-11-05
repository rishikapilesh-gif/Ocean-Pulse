import { describe, it, expect } from 'vitest';
import {
  bearingToAngle,
  angleToBearing,
  angleDiff,
  compassDirection,
  coastX,
  gridToGeo,
  geoToGrid,
} from '../risk-engine/calculations';
import {
  calculateFieldRisk,
  combineRisk,
  getRiskLevel,
  findSafeAngle,
  assessVesselRisk,
  rankFleet,
} from '../risk-engine/engine';
import {
  StormState,
  HazardZoneState,
  VesselState,
  VESSEL_EQUIPMENT_PROFILES,
} from '@ocean-pulse/shared';

describe('Risk Engine - Mathematical & Geospatial Calculations', () => {
  it('converts between compass bearings and math angles reversibly', () => {
    const bearings = [0, 45, 90, 135, 180, 225, 270, 315];
    for (const b of bearings) {
      const angle = bearingToAngle(b);
      const convertedBack = Math.round(angleToBearing(angle));
      expect(convertedBack % 360).toBe(b % 360);
    }
  });

  it('correctly reports 8-point compass directions', () => {
    expect(compassDirection(0)).toBe('N');
    expect(compassDirection(90)).toBe('E');
    expect(compassDirection(180)).toBe('S');
    expect(compassDirection(270)).toBe('W');
    expect(compassDirection(45)).toBe('NE');
    expect(compassDirection(225)).toBe('SW');
  });

  it('computes angular differences normalized between -pi and pi', () => {
    const diff1 = angleDiff(0, Math.PI / 2);
    expect(diff1).toBeCloseTo(Math.PI / 2);

    const diff2 = angleDiff(Math.PI * 0.9, -Math.PI * 0.9);
    expect(diff2).toBeCloseTo(Math.PI * 0.2);
  });

  it('calculates coastline distance properly and produces expected values', () => {
    const c0 = coastX(0);
    const c40 = coastX(40);
    expect(c0).toBeGreaterThan(0);
    expect(c40).toBeGreaterThan(0);
  });

  it('transforms between grid and geographic coordinates correctly', () => {
    const origin = { x: 0, y: 0 };
    const geo = gridToGeo(origin);
    const gridAgain = geoToGrid(geo);
    expect(gridAgain.x).toBeCloseTo(0);
    expect(gridAgain.y).toBeCloseTo(0);
  });
});

describe('Risk Engine - Field & Vessel Risk Calculations', () => {
  const dummyStorm: StormState = {
    x: 70,
    y: 30,
    lat: 9.7,
    lng: 76.4,
    radiusKm: 15,
    bearingDeg: 270,
    speedKmh: 18,
    maxWindSpeedKts: 55,
    centralPressureHpa: 980,
    source: 'IMD Doppler Radar Seed',
    isSimulated: true,
    updatedAtIso: new Date().toISOString(),
  };

  const dummyHazards: HazardZoneState[] = [
    {
      id: 'HAZ-01',
      name: 'Rocky Reef',
      x: 45,
      y: 63,
      lat: 10.0,
      lng: 76.2,
      radiusKm: 7,
      severity: 'HIGH',
      type: 'REEF',
    },
  ];

  function createVessel(id: string, x: number, y: number, overrides?: Partial<VesselState>): VesselState {
    return {
      id,
      name: `Vessel ${id}`,
      regNo: `IND-KL-${id}`,
      master: 'Test Master',
      type: 'standard',
      equipment: VESSEL_EQUIPMENT_PROFILES.standard,
      x,
      y,
      lat: 9.7,
      lng: 76.4,
      speedKmh: 12,
      effectiveSpeedKmh: 12,
      headingRad: bearingToAngle(90),
      courseRad: bearingToAngle(90),
      bearingDeg: 90,
      trail: [],
      forceLost: false,
      glitchActive: false,
      glitchRemainingSec: 0,
      glitchOffset: { x: 0, y: 0 },
      engineFault: false,
      commState: 'good',
      commQuality: 1.0,
      lastContactMinAgo: 0,
      lastContactIso: new Date().toISOString(),
      lastDeliveredWarning: {
        level: 'SAFE',
        safeBearingDeg: null,
        issuedAtIso: new Date().toISOString(),
        acknowledgedByFisher: true,
      },
      unacknowledgedAlertsCount: 0,
      openAssistanceRequestsCount: 0,
      ...overrides,
    };
  }

  it('calculates maximum field risk when vessel is inside the storm center', () => {
    const risk = calculateFieldRisk(70, 30, 0, dummyStorm, dummyHazards);
    expect(risk.inStorm).toBe(true);
    expect(risk.rs).toBe(1);
    expect(risk.waveHeightM).toBeGreaterThan(6.0);
  });

  it('calculates low field risk when vessel is far away from hazards and storm', () => {
    const risk = calculateFieldRisk(10, 70, 0, dummyStorm, dummyHazards);
    expect(risk.inStorm).toBe(false);
    expect(risk.rs).toBe(0);
    expect(risk.waveHeightM).toBeCloseTo(0.8, 1);
  });

  it('amplifies risk when engine fault or comms loss occurs', () => {
    const nominal = combineRisk(
      { engineFault: false, commState: 'good', activeDistress: false },
      { rs: 0.5, rh: 0, closestHazard: null, rw: 0.4, waveHeightM: 3.5, distToStormCenterKm: 12, stormCenter: { x: 0, y: 0, r: 15 }, inStorm: false, inHazardZone: false }
    );

    const withEngineFault = combineRisk(
      { engineFault: true, commState: 'good', activeDistress: false },
      { rs: 0.5, rh: 0, closestHazard: null, rw: 0.4, waveHeightM: 3.5, distToStormCenterKm: 12, stormCenter: { x: 0, y: 0, r: 15 }, inStorm: false, inHazardZone: false }
    );

    const withCommsLoss = combineRisk(
      { engineFault: false, commState: 'lost', activeDistress: false },
      { rs: 0.5, rh: 0, closestHazard: null, rw: 0.4, waveHeightM: 3.5, distToStormCenterKm: 12, stormCenter: { x: 0, y: 0, r: 15 }, inStorm: false, inHazardZone: false }
    );

    expect(withEngineFault).toBeGreaterThan(nominal);
    expect(withCommsLoss).toBeGreaterThan(nominal);
  });

  it('enforces active distress emergency override to >= 0.95', () => {
    const combined = combineRisk(
      { engineFault: false, commState: 'good', activeDistress: true },
      { rs: 0, rh: 0, closestHazard: null, rw: 0, waveHeightM: 0.8, distToStormCenterKm: 100, stormCenter: { x: 0, y: 0, r: 15 }, inStorm: false, inHazardZone: false }
    );
    expect(combined).toBeGreaterThanOrEqual(0.95);
  });

  it('correctly assigns risk categories according to thresholds', () => {
    expect(getRiskLevel(0.85)).toBe('Critical');
    expect(getRiskLevel(0.65)).toBe('High');
    expect(getRiskLevel(0.40)).toBe('Medium');
    expect(getRiskLevel(0.15)).toBe('Safe');
  });

  it('finds a safer steering angle away from advancing storm', () => {
    // Vessel at (50, 45) heading East (90 deg), with storm at (88, 30) moving West
    const vessel = createVessel('B01', 50, 45, {
      headingRad: bearingToAngle(90),
    });
    const storm: StormState = {
      ...dummyStorm,
      x: 88,
      y: 30,
      radiusKm: 13,
      speedKmh: 18,
      bearingDeg: 270,
    };
    const safeAngle = findSafeAngle(vessel, { x: 50, y: 45 }, storm, dummyHazards);
    const safeBearing = Math.round(angleToBearing(safeAngle));
    // Safe steering bearing should direct away from heading 90 into the storm
    expect(safeBearing).not.toBe(90);
  });

  it('ranks vessels deterministically with distress override and urgency', () => {
    const v1 = createVessel('B01', 20, 20); // safe
    const v2 = createVessel('B02', 65, 30); // in storm
    const v3 = createVessel('B03', 15, 15, { activeDistress: true }); // far away but manual SOS

    v1.assessment = assessVesselRisk(v1, dummyStorm, dummyHazards, 0);
    v2.assessment = assessVesselRisk(v2, dummyStorm, dummyHazards, 0);
    v3.assessment = assessVesselRisk(v3, dummyStorm, dummyHazards, 0);

    const ranked = rankFleet([v1, v2, v3]);

    // Active distress vessel v3 must rank first despite zero storm risk!
    expect(ranked[0].id).toBe('B03');
    // Vessel in storm must rank next
    expect(ranked[1].id).toBe('B02');
    // Safe vessel must rank last
    expect(ranked[2].id).toBe('B01');
  });
});
