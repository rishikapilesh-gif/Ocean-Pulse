import {
  VesselState,
  StormState,
  HazardZoneState,
  SimulationState,
  INITIAL_FLEET,
  VESSEL_EQUIPMENT_PROFILES,
  TOWER_COORDS,
  WORLD_BOUNDS,
  WARNING_ADVICE,
} from '@ocean-pulse/shared';
import {
  bearingToAngle,
  angleToBearing,
  angleDiff,
  coastX,
  clamp,
  gridToGeo,
} from '../risk-engine/calculations';
import {
  assessVesselRisk,
  rankFleet,
  getEffectiveSpeedKmPerMin,
  getWarningAdvice,
  calculateFieldRisk,
  calculateStormVelocity,
} from '../risk-engine/engine';
import { SCENARIOS } from './scenarios';

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Simulator {
  private vessels: VesselState[] = [];
  private storm: StormState;
  private hazards: HazardZoneState[] = [];
  private simulation: SimulationState;
  private rng = mulberry32(7);
  private lastTickMs: number = Date.now();
  private timer: NodeJS.Timeout | null = null;
  private onStateUpdateCallback?: (state: { vessels: VesselState[]; storm: StormState; simulation: SimulationState }) => void;

  constructor() {
    const s1 = SCENARIOS['scenario-1'];
    this.storm = { ...s1.storm };
    this.hazards = [...s1.hazards];
    this.simulation = {
      running: true,
      speedMultiplier: 1.0,
      simTimeMinutes: 0,
      scenarioId: 'scenario-1',
      scenarioName: s1.name,
      fishermenFollowAdvice: false,
      predictedPathsVisible: true,
      language: 'en',
    };
    this.initVessels();
    this.computeAll(true);
  }

  public setOnStateUpdate(cb: (state: { vessels: VesselState[]; storm: StormState; simulation: SimulationState }) => void) {
    this.onStateUpdateCallback = cb;
  }

  private initVessels() {
    this.vessels = INITIAL_FLEET.map((f) => {
      const angle = bearingToAngle(f.bearing);
      const geo = gridToGeo({ x: f.x, y: f.y });
      return {
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
        effectiveSpeedKmh: f.speedKmh,
        headingRad: angle,
        courseRad: angle,
        bearingDeg: f.bearing,
        trail: [{ x: f.x, y: f.y }],
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
      };
    });
  }

  public start() {
    if (this.timer) return;
    this.lastTickMs = Date.now();
    this.timer = setInterval(() => this.tick(), 1000);
    console.log('[Simulator] Simulation loop started.');
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[Simulator] Simulation loop paused.');
    }
  }

  public tick() {
    const now = Date.now();
    const dtSeconds = (now - this.lastTickMs) / 1000;
    this.lastTickMs = now;

    if (!this.simulation.running) return;

    // 1 real second = 1 sim minute * speedMultiplier
    const dtMinutes = (dtSeconds * this.simulation.speedMultiplier);
    this.step(dtMinutes);
    this.computeAll(false);

    if (this.onStateUpdateCallback) {
      this.onStateUpdateCallback({
        vessels: this.getRankedVessels(),
        storm: this.storm,
        simulation: this.simulation,
      });
    }
  }

  public step(dtMinutes: number) {
    this.simulation.simTimeMinutes += dtMinutes;

    // Advance storm
    const sVel = calculateStormVelocity(this.storm);
    this.storm.x += sVel.vx * dtMinutes;
    this.storm.y += sVel.vy * dtMinutes;

    // Boundary wrapping for endless simulation
    const margin = this.storm.radiusKm + 6;
    if (this.storm.x < -margin) this.storm.x = WORLD_BOUNDS.widthKm + margin;
    if (this.storm.x > WORLD_BOUNDS.widthKm + margin) this.storm.x = -margin;
    if (this.storm.y < -margin) this.storm.y = WORLD_BOUNDS.heightKm + margin;
    if (this.storm.y > WORLD_BOUNDS.heightKm + margin) this.storm.y = -margin;

    const stormGeo = gridToGeo({ x: this.storm.x, y: this.storm.y });
    this.storm.lat = stormGeo.lat;
    this.storm.lng = stormGeo.lng;
    this.storm.updatedAtIso = new Date().toISOString();

    // Advance vessels
    for (const b of this.vessels) {
      // Countdown glitch timer
      if (b.glitchRemainingSec > 0) {
        b.glitchRemainingSec -= dtMinutes * 60;
        if (b.glitchRemainingSec <= 0) {
          b.glitchActive = false;
          b.glitchOffset = { x: 0, y: 0 };
        }
      }

      // Check if following advice
      const canAvoid = this.simulation.fishermenFollowAdvice &&
        b.lastDeliveredWarning.level !== 'SAFE' &&
        b.assessment?.safeAngleRad !== null &&
        b.assessment?.safeAngleRad !== undefined;

      let targetHeading: number;
      if (canAvoid && b.assessment?.safeAngleRad) {
        targetHeading = b.assessment.safeAngleRad;
        b.courseRad = b.headingRad;
      } else {
        b.courseRad += (this.rng() - 0.5) * 0.03 * dtMinutes;
        targetHeading = b.courseRad;
      }

      // Coastal & Boundary steering
      if (
        b.x < coastX(b.y) + 5 ||
        b.x > WORLD_BOUNDS.widthKm - 3 ||
        b.y < 3 ||
        b.y > WORLD_BOUNDS.heightKm - 3
      ) {
        targetHeading = Math.atan2(WORLD_BOUNDS.heightKm / 2 - b.y, WORLD_BOUNDS.widthKm / 2 - b.x);
        b.courseRad = targetHeading;
      }

      // Smooth turn
      b.headingRad += clamp(angleDiff(b.headingRad, targetHeading), -0.2 * dtMinutes, 0.2 * dtMinutes);
      b.bearingDeg = angleToBearing(b.headingRad);

      const sp = getEffectiveSpeedKmPerMin(b);
      b.effectiveSpeedKmh = b.speedKmh * (b.engineFault ? 0.5 : 1.0);
      b.x += Math.cos(b.headingRad) * sp * dtMinutes;
      b.y += Math.sin(b.headingRad) * sp * dtMinutes;

      const geo = gridToGeo({ x: b.x, y: b.y });
      b.lat = geo.lat;
      b.lng = geo.lng;

      // Trail recording
      const last = b.trail[b.trail.length - 1];
      if (!last || Math.hypot(last.x - b.x, last.y - b.y) > 0.4) {
        b.trail.push({ x: b.x, y: b.y });
        if (b.trail.length > 80) b.trail.shift();
      }
    }
  }

  public updateComms(b: VesselState) {
    const d = Math.hypot(b.x - TOWER_COORDS.x, b.y - TOWER_COORDS.y);
    let q = 1 - Math.pow(d / b.equipment.rangeKm, 1.5);
    if (!(q > -1e9)) q = 0;

    const field = calculateFieldRisk(b.x, b.y, 0, this.storm, this.hazards);
    q = clamp(q, 0, 1) - 0.5 * field.rs;

    const state = b.forceLost ? 'lost' : q >= 0.35 ? 'good' : q >= 0.12 ? 'weak' : 'lost';
    b.commState = state;
    b.commQuality = Math.max(0, Math.min(1, q));

    if (state !== 'lost') {
      b.lastContactMinAgo = 0;
      b.lastContactIso = new Date().toISOString();
    } else {
      b.lastContactMinAgo += 1; // updated per compute step
    }
  }

  public computeAll(silent = false) {
    this.vessels.forEach((b) => this.updateComms(b));

    for (const b of this.vessels) {
      b.assessment = assessVesselRisk(b, this.storm, this.hazards, this.simulation.simTimeMinutes);

      if (b.commState !== 'lost') {
        const advice = getWarningAdvice(b.assessment.level);
        const changed = b.lastDeliveredWarning.level !== advice;

        b.lastDeliveredWarning = {
          level: advice,
          safeBearingDeg: b.assessment.safeBearingDeg,
          issuedAtIso: new Date().toISOString(),
          acknowledgedByFisher: changed ? false : b.lastDeliveredWarning.acknowledgedByFisher,
          acknowledgedAtIso: changed ? undefined : b.lastDeliveredWarning.acknowledgedAtIso,
        };
      }
    }
  }

  public loadScenario(scenarioId: string) {
    const s = SCENARIOS[scenarioId] || SCENARIOS['scenario-1'];
    this.rng = mulberry32(7);
    this.simulation.simTimeMinutes = 0;
    this.simulation.scenarioId = s.id;
    this.simulation.scenarioName = s.name;
    this.storm = { ...s.storm };
    this.hazards = [...s.hazards];
    this.initVessels();

    if (s.vesselOverrides) {
      for (const [vid, override] of Object.entries(s.vesselOverrides)) {
        const v = this.vessels.find((x) => x.id === vid);
        if (v) {
          if (override.x !== undefined) v.x = override.x;
          if (override.y !== undefined) v.y = override.y;
          if (override.bearingDeg !== undefined) {
            v.bearingDeg = override.bearingDeg;
            v.headingRad = bearingToAngle(override.bearingDeg);
            v.courseRad = v.headingRad;
          }
          if (override.speedKmh !== undefined) v.speedKmh = override.speedKmh;
          if (override.engineFault !== undefined) v.engineFault = override.engineFault;
          if (override.forceLost !== undefined) v.forceLost = override.forceLost;
          if (override.glitchActive !== undefined) {
            v.glitchActive = override.glitchActive;
            v.glitchRemainingSec = 30;
            v.glitchOffset = { x: 5, y: -5 };
          }
          if (override.activeDistress !== undefined) {
            v.activeDistress = override.activeDistress;
            v.activeDistressType = override.activeDistressType || 'MANUAL_SOS';
          }
          const geo = gridToGeo({ x: v.x, y: v.y });
          v.lat = geo.lat;
          v.lng = geo.lng;
        }
      }
    }

    this.computeAll(true);
    console.log(`[Simulator] Loaded scenario: ${s.name}`);
  }

  public resetScenario() {
    this.loadScenario(this.simulation.scenarioId);
  }

  public setPlay(running: boolean) {
    this.simulation.running = running;
  }

  public setSpeed(multiplier: number) {
    this.simulation.speedMultiplier = clamp(multiplier, 0.25, 10);
  }

  public setFollowAdvice(follow: boolean) {
    this.simulation.fishermenFollowAdvice = follow;
  }

  public updateStorm(params: { x?: number; y?: number; radiusKm?: number; bearingDeg?: number; speedKmh?: number }) {
    if (params.x !== undefined) this.storm.x = params.x;
    if (params.y !== undefined) this.storm.y = params.y;
    if (params.radiusKm !== undefined) this.storm.radiusKm = params.radiusKm;
    if (params.bearingDeg !== undefined) this.storm.bearingDeg = params.bearingDeg;
    if (params.speedKmh !== undefined) this.storm.speedKmh = params.speedKmh;

    const geo = gridToGeo({ x: this.storm.x, y: this.storm.y });
    this.storm.lat = geo.lat;
    this.storm.lng = geo.lng;
    this.storm.updatedAtIso = new Date().toISOString();
    this.computeAll(true);
  }

  public updateVesselWhatIf(
    vesselId: string,
    params: {
      forceLostComms?: boolean;
      triggerGpsGlitch?: boolean;
      toggleEngineFault?: boolean;
      rerouteHeadingDeg?: number;
      rerouteTargetX?: number;
      rerouteTargetY?: number;
    }
  ) {
    const v = this.vessels.find((x) => x.id === vesselId);
    if (!v) return null;

    if (params.forceLostComms !== undefined) {
      v.forceLost = params.forceLostComms;
    }
    if (params.triggerGpsGlitch) {
      v.glitchActive = true;
      v.glitchRemainingSec = 30;
      const glitchAngle = this.rng() * Math.PI * 2;
      v.glitchOffset = { x: Math.cos(glitchAngle) * 8, y: Math.sin(glitchAngle) * 8 };
    }
    if (params.toggleEngineFault !== undefined) {
      if (v.equipment.hasEngineSensor) {
        v.engineFault = params.toggleEngineFault;
      }
    }
    if (params.rerouteHeadingDeg !== undefined) {
      v.bearingDeg = params.rerouteHeadingDeg;
      v.headingRad = bearingToAngle(params.rerouteHeadingDeg);
      v.courseRad = v.headingRad;
    } else if (params.rerouteTargetX !== undefined && params.rerouteTargetY !== undefined) {
      const angle = Math.atan2(params.rerouteTargetY - v.y, params.rerouteTargetX - v.x);
      v.headingRad = angle;
      v.courseRad = angle;
      v.bearingDeg = angleToBearing(angle);
    }

    this.computeAll(true);
    return v;
  }

  public setVesselDistress(vesselId: string, active: boolean, type?: any) {
    const v = this.vessels.find((x) => x.id === vesselId);
    if (v) {
      v.activeDistress = active;
      v.activeDistressType = type;
      this.computeAll(true);
    }
  }

  public acknowledgeWarning(vesselId: string) {
    const v = this.vessels.find((x) => x.id === vesselId);
    if (v && v.lastDeliveredWarning) {
      v.lastDeliveredWarning.acknowledgedByFisher = true;
      v.lastDeliveredWarning.acknowledgedAtIso = new Date().toISOString();
    }
  }

  public getRankedVessels(): VesselState[] {
    return rankFleet(this.vessels);
  }

  public getVessel(vesselId: string): VesselState | undefined {
    return this.vessels.find((v) => v.id === vesselId);
  }

  public getStorm(): StormState {
    return this.storm;
  }

  public getHazards(): HazardZoneState[] {
    return this.hazards;
  }

  public getSimulationState(): SimulationState {
    return this.simulation;
  }

  public getFullState() {
    return {
      vessels: this.getRankedVessels(),
      storm: this.storm,
      hazards: this.hazards,
      simulation: this.simulation,
    };
  }
}

// Global singleton simulator instance
export const simulator = new Simulator();
