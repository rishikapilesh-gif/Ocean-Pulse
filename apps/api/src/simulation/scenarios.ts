import { StormState, GridPoint, HazardZoneState, DEFAULT_HAZARDS } from '@ocean-pulse/shared';
import { gridToGeo } from '../risk-engine/calculations';

export interface ScenarioDefinition {
  id: string;
  name: string;
  description: string;
  category: 'STORM_INTERSECTION' | 'ENGINE_BREAKDOWN' | 'COMMUNICATION_BLACKOUT' | 'CONCURRENT_SOS' | 'OFFLINE_RECONCILIATION';
  storm: StormState;
  hazards: HazardZoneState[];
  vesselOverrides: Record<
    string,
    {
      x?: number;
      y?: number;
      bearingDeg?: number;
      speedKmh?: number;
      engineFault?: boolean;
      forceLost?: boolean;
      glitchActive?: boolean;
      activeDistress?: boolean;
      activeDistressType?: any;
    }
  >;
}

export const SCENARIOS: Record<string, ScenarioDefinition> = {
  'scenario-1': {
    id: 'scenario-1',
    name: '1. Approaching Storm Cell (Track Intersection)',
    description: 'A deep depression moves westward at 18 km/h. Vessel B01 (Sagar Kanya) is on a collision course, reaching the storm perimeter in ~12 min.',
    category: 'STORM_INTERSECTION',
    storm: {
      x: 88,
      y: 30,
      lat: gridToGeo({ x: 88, y: 30 }).lat,
      lng: gridToGeo({ x: 88, y: 30 }).lng,
      radiusKm: 13,
      bearingDeg: 270,
      speedKmh: 18,
      maxWindSpeedKts: 52,
      centralPressureHpa: 982,
      source: 'IMD Coastal Doppler Radar (Kochi)',
      isSimulated: true,
      updatedAtIso: new Date().toISOString(),
    },
    hazards: DEFAULT_HAZARDS.map((h) => ({
      ...h,
      lat: gridToGeo({ x: h.x, y: h.y }).lat,
      lng: gridToGeo({ x: h.x, y: h.y }).lng,
      radiusKm: h.r,
      severity: h.severity as any,
      type: h.id === 'HAZ-01' ? 'REEF' : h.id === 'HAZ-02' ? 'RESTRICTED' : 'SHOAL',
    })),
    vesselOverrides: {
      B01: { x: 70, y: 30, bearingDeg: 90, speedKmh: 14 },
    },
  },
  'scenario-2': {
    id: 'scenario-2',
    name: '2. Propulsion Failure & Drifting into Reef',
    description: 'Vessel B04 (Samudra Ratna) reports complete engine breakdown. Speed is halved, drift carries it toward the rocky reef zone.',
    category: 'ENGINE_BREAKDOWN',
    storm: {
      x: 95,
      y: 40,
      lat: gridToGeo({ x: 95, y: 40 }).lat,
      lng: gridToGeo({ x: 95, y: 40 }).lng,
      radiusKm: 14,
      bearingDeg: 250,
      speedKmh: 15,
      maxWindSpeedKts: 48,
      centralPressureHpa: 986,
      source: 'IMD Cyclone Warning Center',
      isSimulated: true,
      updatedAtIso: new Date().toISOString(),
    },
    hazards: DEFAULT_HAZARDS.map((h) => ({
      ...h,
      lat: gridToGeo({ x: h.x, y: h.y }).lat,
      lng: gridToGeo({ x: h.x, y: h.y }).lng,
      radiusKm: h.r,
      severity: h.severity as any,
      type: h.id === 'HAZ-01' ? 'REEF' : h.id === 'HAZ-02' ? 'RESTRICTED' : 'SHOAL',
    })),
    vesselOverrides: {
      B04: { x: 42, y: 60, bearingDeg: 120, speedKmh: 8, engineFault: true },
    },
  },
  'scenario-3': {
    id: 'scenario-3',
    name: '3. Communication Blackout & Stale Telemetry',
    description: 'Vessel B03 (Kadal Rani) loses cellular signal beyond 40 km. Last contact age increments; status marked "CONTACT LOST — STATUS UNKNOWN".',
    category: 'COMMUNICATION_BLACKOUT',
    storm: {
      x: 80,
      y: 25,
      lat: gridToGeo({ x: 80, y: 25 }).lat,
      lng: gridToGeo({ x: 80, y: 25 }).lng,
      radiusKm: 15,
      bearingDeg: 280,
      speedKmh: 20,
      maxWindSpeedKts: 55,
      centralPressureHpa: 978,
      source: 'INCOIS High Seas Advisory',
      isSimulated: true,
      updatedAtIso: new Date().toISOString(),
    },
    hazards: DEFAULT_HAZARDS.map((h) => ({
      ...h,
      lat: gridToGeo({ x: h.x, y: h.y }).lat,
      lng: gridToGeo({ x: h.x, y: h.y }).lng,
      radiusKm: h.r,
      severity: h.severity as any,
      type: h.id === 'HAZ-01' ? 'REEF' : h.id === 'HAZ-02' ? 'RESTRICTED' : 'SHOAL',
    })),
    vesselOverrides: {
      B03: { x: 48, y: 22, bearingDeg: 270, speedKmh: 9, forceLost: true },
    },
  },
  'scenario-4': {
    id: 'scenario-4',
    name: '4. Concurrent Emergency SOS Distress Triage',
    description: 'Two vessels trigger distress simultaneously (B02 capsize risk, B07 medical emergency). Fleet Attention prioritizes by life-safety urgency.',
    category: 'CONCURRENT_SOS',
    storm: {
      x: 88,
      y: 35,
      lat: gridToGeo({ x: 88, y: 35 }).lat,
      lng: gridToGeo({ x: 88, y: 35 }).lng,
      radiusKm: 13,
      bearingDeg: 260,
      speedKmh: 16,
      maxWindSpeedKts: 50,
      centralPressureHpa: 984,
      source: 'IMD Coastal Doppler Radar (Kochi)',
      isSimulated: true,
      updatedAtIso: new Date().toISOString(),
    },
    hazards: DEFAULT_HAZARDS.map((h) => ({
      ...h,
      lat: gridToGeo({ x: h.x, y: h.y }).lat,
      lng: gridToGeo({ x: h.x, y: h.y }).lng,
      radiusKm: h.r,
      severity: h.severity as any,
      type: h.id === 'HAZ-01' ? 'REEF' : h.id === 'HAZ-02' ? 'RESTRICTED' : 'SHOAL',
    })),
    vesselOverrides: {
      B02: { x: 55, y: 40, activeDistress: true, activeDistressType: 'CAPSIZE_OR_SINKING' },
      B07: { x: 72, y: 48, activeDistress: true, activeDistressType: 'MEDICAL_EMERGENCY' },
    },
  },
  'scenario-5': {
    id: 'scenario-5',
    name: '5. Offline Fisherman HUD & Idempotent Reconnection',
    description: 'Fisherman on B10 loses connectivity, drafts and submits SOS locally; on signal reconnection, message is safely synchronized with idempotency key.',
    category: 'OFFLINE_RECONCILIATION',
    storm: {
      x: 85,
      y: 20,
      lat: gridToGeo({ x: 85, y: 20 }).lat,
      lng: gridToGeo({ x: 85, y: 20 }).lng,
      radiusKm: 12,
      bearingDeg: 270,
      speedKmh: 14,
      maxWindSpeedKts: 45,
      centralPressureHpa: 988,
      source: 'IMD Doppler Radar Seed',
      isSimulated: true,
      updatedAtIso: new Date().toISOString(),
    },
    hazards: DEFAULT_HAZARDS.map((h) => ({
      ...h,
      lat: gridToGeo({ x: h.x, y: h.y }).lat,
      lng: gridToGeo({ x: h.x, y: h.y }).lng,
      radiusKm: h.r,
      severity: h.severity as any,
      type: h.id === 'HAZ-01' ? 'REEF' : h.id === 'HAZ-02' ? 'RESTRICTED' : 'SHOAL',
    })),
    vesselOverrides: {
      B10: { x: 60, y: 15, forceLost: true },
    },
  },
};
