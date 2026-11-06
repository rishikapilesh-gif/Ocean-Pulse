import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { subscribeToShore } from '../services/socket';
import {
  VesselState,
  StormState,
  HazardZoneState,
  SimulationState,
  IncidentRecord,
  AssistanceRequestRecord,
} from '@ocean-pulse/shared';
import {
  createInitialStorm,
  createInitialHazards,
  createInitialVessels,
  createInitialIncidents,
  createInitialRequests,
  getStandaloneScenarioData,
  stepSimulationTick,
} from '../services/standaloneSimulator';
import { assessVesselRisk, rankFleet } from '../../../api/src/risk-engine/engine';

interface FleetContextType {
  vessels: VesselState[];
  storm: StormState | null;
  hazards: HazardZoneState[];
  simulation: SimulationState | null;
  selectedVessel: VesselState | null;
  selectedVesselId: string;
  setSelectedVesselId: (id: string) => void;
  incidents: IncidentRecord[];
  requests: AssistanceRequestRecord[];
  loading: boolean;
  isConnected: boolean;
  refreshState: () => Promise<void>;
  loadScenario: (scenarioId: string) => Promise<void>;
  togglePlay: () => Promise<void>;
  setSpeed: (multiplier: number) => Promise<void>;
  setFollowAdvice: (follow: boolean) => Promise<void>;
  updateStorm: (params: Partial<StormState>) => Promise<void>;
  resetScenario: () => Promise<void>;
  updateWhatIf: (vesselId: string, params: any) => Promise<void>;
  acknowledgeIncident: (id: string, notes?: string) => Promise<void>;
  escalateIncident: (id: string, agency: string, reason: string) => Promise<void>;
  resolveIncident: (id: string, notes: string) => Promise<void>;
  updateAssistanceStatus: (id: string, status: string, notes?: string) => Promise<void>;
  createSOS: (payload: any) => Promise<void>;
  createAssistanceRequest: (payload: any) => Promise<void>;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export const FleetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialStorm = createInitialStorm();
  const initialHazards = createInitialHazards();
  const initialVessels = createInitialVessels(initialStorm, initialHazards);
  const initialIncidents = createInitialIncidents();
  const initialRequests = createInitialRequests();
  const initialSim: SimulationState = {
    running: true,
    speedMultiplier: 1.0,
    simTimeMinutes: 0,
    scenarioId: 'scenario-1',
    scenarioName: '1. Approaching Storm Cell (Track Intersection)',
    fishermenFollowAdvice: false,
    predictedPathsVisible: true,
    language: 'en',
  };

  const [vessels, setVessels] = useState<VesselState[]>(initialVessels);
  const [storm, setStorm] = useState<StormState | null>(initialStorm);
  const [hazards, setHazards] = useState<HazardZoneState[]>(initialHazards);
  const [simulation, setSimulation] = useState<SimulationState | null>(initialSim);
  const [selectedVesselId, setSelectedVesselId] = useState<string>('B01');
  const [incidents, setIncidents] = useState<IncidentRecord[]>(initialIncidents);
  const [requests, setRequests] = useState<AssistanceRequestRecord[]>(initialRequests);
  const [loading, setLoading] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(true);

  const isUsingLocalSimRef = useRef<boolean>(true);

  // Synchronized simulation state ref for rock-solid crash-proof animation ticks
  const simDataRef = useRef({
    vessels: initialVessels,
    storm: initialStorm,
    hazards: initialHazards,
    simulation: initialSim,
  });

  // Keep simDataRef in sync with state changes
  useEffect(() => {
    if (storm && simulation) {
      simDataRef.current = {
        vessels,
        storm,
        hazards,
        simulation,
      };
    }
  }, [vessels, storm, hazards, simulation]);

  // Crash-proof standalone simulation loop (runs smoothly every 1.5s on GitHub Pages or offline)
  useEffect(() => {
    const simInterval = setInterval(() => {
      try {
        if (!isUsingLocalSimRef.current) return;
        const current = simDataRef.current;
        if (!current.simulation?.running || !current.storm) return;

        const next = stepSimulationTick(
          current.vessels,
          current.storm,
          current.hazards,
          current.simulation,
          1.5
        );

        simDataRef.current = {
          ...current,
          vessels: next.vessels,
          storm: next.storm,
          simulation: next.simulation,
        };

        setVessels(next.vessels);
        setStorm(next.storm);
        setSimulation(next.simulation);
      } catch (err) {
        console.warn('[Simulation] Tick caught safely:', err);
      }
    }, 1500);

    return () => clearInterval(simInterval);
  }, []);

  const fetchIncidentsAndRequests = useCallback(async () => {
    try {
      const [incRes, reqRes] = await Promise.all([
        api.getIncidents(),
        api.getAssistanceRequests(),
      ]);
      if (incRes?.incidents?.length) setIncidents(incRes.incidents);
      if (reqRes?.requests?.length) setRequests(reqRes.requests);
    } catch (e) {
      // Keep rich standalone incidents
    }
  }, []);

  const refreshState = useCallback(async () => {
    try {
      const res = await api.getSimulationState();
      if (res?.vessels?.length) {
        setVessels(res.vessels);
        setStorm(res.storm);
        setHazards(res.hazards);
        setSimulation(res.simulation);
        setIsConnected(true);
        isUsingLocalSimRef.current = false;
      }
    } catch (err) {
      // Running standalone in browser
      setIsConnected(true);
      isUsingLocalSimRef.current = true;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function init() {
      await refreshState();
      await fetchIncidentsAndRequests();
      if (mounted) setLoading(false);
    }
    init();

    // Subscribe to Real-time WebSockets if backend is active
    let unsubscribe = () => {};
    try {
      unsubscribe = subscribeToShore((data) => {
        if (data?.vessels) setVessels(data.vessels);
        if (data?.storm) setStorm(data.storm);
        if (data?.simulation) setSimulation(data.simulation);
        setIsConnected(true);
        isUsingLocalSimRef.current = false;
      });
    } catch (e) {
      // Standalone mode
    }

    const pollInterval = setInterval(() => {
      fetchIncidentsAndRequests();
    }, 10000);

    return () => {
      mounted = false;
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [refreshState, fetchIncidentsAndRequests]);

  const selectedVessel = vessels.find((v) => v.id === selectedVesselId) || vessels[0] || null;

  const loadScenario = async (scenarioId: string) => {
    const data = getStandaloneScenarioData(scenarioId, hazards);
    setStorm(data.storm);
    setVessels(data.vessels);
    setIncidents(data.incidents);
    setRequests(data.requests);
    setSimulation((prev) =>
      prev
        ? {
            ...prev,
            scenarioId,
            scenarioName: data.scenarioName,
            simTimeMinutes: 0,
          }
        : prev
    );

    simDataRef.current = {
      vessels: data.vessels,
      storm: data.storm,
      hazards,
      simulation: {
        ...(simulation || initialSim),
        scenarioId,
        scenarioName: data.scenarioName,
        simTimeMinutes: 0,
      },
    };

    try {
      await api.controlSimulation({ action: 'LOAD_SCENARIO', scenarioId });
    } catch (e) {
      // standalone handled
    }
  };

  const togglePlay = async () => {
    const nextRunning = !simulation?.running;
    setSimulation((prev) => (prev ? { ...prev, running: nextRunning } : prev));
    if (simDataRef.current.simulation) {
      simDataRef.current.simulation.running = nextRunning;
    }
    try {
      await api.controlSimulation({ action: nextRunning ? 'PLAY' : 'PAUSE' });
    } catch (e) {
      // handled locally
    }
  };

  const setSpeed = async (multiplier: number) => {
    setSimulation((prev) => (prev ? { ...prev, speedMultiplier: multiplier } : prev));
    if (simDataRef.current.simulation) {
      simDataRef.current.simulation.speedMultiplier = multiplier;
    }
    try {
      await api.controlSimulation({ action: 'SET_SPEED', speedMultiplier: multiplier });
    } catch (e) {
      // handled locally
    }
  };

  const setFollowAdvice = async (follow: boolean) => {
    setSimulation((prev) => (prev ? { ...prev, fishermenFollowAdvice: follow } : prev));
    if (simDataRef.current.simulation) {
      simDataRef.current.simulation.fishermenFollowAdvice = follow;
    }
    try {
      await api.controlSimulation({ action: 'SET_FOLLOW_ADVICE', followAdvice: follow });
    } catch (e) {
      // handled locally
    }
  };

  const updateStorm = async (params: Partial<StormState>) => {
    setStorm((prev) => {
      if (!prev) return prev;
      const updated: StormState = {
        ...prev,
        ...params,
        updatedAtIso: new Date().toISOString(),
      };

      // Immediately recalculate vessel risks with new storm parameters
      const reassessed = rankFleet(
        vessels.map((v) => ({
          ...v,
          assessment: assessVesselRisk(v, updated, hazards, simulation?.simTimeMinutes || 0),
        }))
      );
      setVessels(reassessed);

      simDataRef.current = {
        ...simDataRef.current,
        storm: updated,
        vessels: reassessed,
      };

      return updated;
    });

    try {
      await api.controlSimulation({ action: 'UPDATE_STORM', storm: params });
    } catch (e) {
      // handled locally
    }
  };

  const resetScenario = async () => {
    const freshStorm = createInitialStorm();
    const freshVessels = createInitialVessels(freshStorm, hazards);
    setStorm(freshStorm);
    setVessels(freshVessels);
    setIncidents(createInitialIncidents());
    setRequests(createInitialRequests());
    setSimulation((prev) => (prev ? { ...prev, simTimeMinutes: 0 } : prev));

    simDataRef.current = {
      vessels: freshVessels,
      storm: freshStorm,
      hazards,
      simulation: {
        ...(simulation || initialSim),
        simTimeMinutes: 0,
      },
    };

    try {
      await api.controlSimulation({ action: 'RESET' });
    } catch (e) {
      // handled locally
    }
  };

  const updateWhatIf = async (vesselId: string, params: any) => {
    setVessels((prev) => {
      const updated = prev.map((v) => {
        if (v.id !== vesselId) return v;
        const next = { ...v, ...params };
        if (params.forceLost !== undefined) {
          next.forceLost = params.forceLost;
          next.commState = params.forceLost ? 'lost' : 'good';
          next.lastContactMinAgo = params.forceLost ? 28 : 0;
        }
        if (params.engineFault !== undefined) {
          next.engineFault = params.engineFault;
          next.effectiveSpeedKmh = params.engineFault ? next.speedKmh * 0.5 : next.speedKmh;
        }
        return next;
      });

      if (storm) {
        const reranked = rankFleet(
          updated.map((v) => ({
            ...v,
            assessment: assessVesselRisk(v, storm, hazards, simulation?.simTimeMinutes || 0),
          }))
        );
        simDataRef.current.vessels = reranked;
        return reranked;
      }
      return updated;
    });

    try {
      await api.updateVesselWhatIf(vesselId, params);
    } catch (e) {
      // handled locally
    }
  };

  const acknowledgeIncident = async (id: string, notes?: string) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: 'ACKNOWLEDGED', acknowledgedAt: new Date().toISOString() } : inc))
    );
    try {
      await api.acknowledgeIncident(id, notes);
    } catch (e) {
      // handled locally
    }
  };

  const escalateIncident = async (id: string, agency: string, reason: string) => {
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === id
          ? {
              ...inc,
              status: 'ACTION_IN_PROGRESS',
              escalatedToExternalAgency: agency,
              escalatedAt: new Date().toISOString(),
            }
          : inc
      )
    );
    try {
      await api.escalateIncident(id, agency, reason);
    } catch (e) {
      // handled locally
    }
  };

  const resolveIncident = async (id: string, notes: string) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: 'RESOLVED', resolvedAt: new Date().toISOString() } : inc))
    );
    try {
      await api.resolveIncident(id, notes);
    } catch (e) {
      // handled locally
    }
  };

  const updateAssistanceStatus = async (id: string, status: string, notes?: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: status as any, updatedAt: new Date().toISOString() } : r))
    );
    try {
      await api.updateRequestStatus(id, status, notes);
    } catch (e) {
      // handled locally
    }
  };

  const createSOS = async (payload: any) => {
    const vessel = vessels.find((v) => v.id === payload.vesselId);
    const newInc: IncidentRecord = {
      id: `INC-${Date.now().toString().slice(-4)}`,
      vesselId: payload.vesselId,
      vesselName: vessel?.name || payload.vesselId,
      type: payload.type || 'MANUAL_SOS',
      priority: 'CRITICAL',
      status: 'RECEIVED',
      reportedLat: payload.lat || 9.77,
      reportedLng: payload.lng || 76.44,
      reportedGridX: vessel?.x || 50,
      reportedGridY: vessel?.y || 40,
      source: 'MANUAL_HUD',
      idempotencyKey: payload.idempotencyKey || `sos-${Date.now()}`,
      clientSubmittedAt: payload.clientSubmittedAt || new Date().toISOString(),
      serverReceivedAt: new Date().toISOString(),
      operatorNotes: [],
      auditTrail: [
        {
          action: 'RECEIVED_SOS',
          actor: vessel?.master || 'Fisherman',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    setIncidents((prev) => [newInc, ...prev]);

    // Flag vessel as active distress
    setVessels((prev) =>
      prev.map((v) =>
        v.id === payload.vesselId
          ? {
              ...v,
              activeDistress: true,
              activeDistressType: payload.type || 'MANUAL_SOS',
              unacknowledgedAlertsCount: (v.unacknowledgedAlertsCount || 0) + 1,
            }
          : v
      )
    );
  };

  const createAssistanceRequest = async (payload: any) => {
    const vessel = vessels.find((v) => v.id === payload.vesselId);
    const newReq: AssistanceRequestRecord = {
      id: `REQ-${Date.now().toString().slice(-4)}`,
      vesselId: payload.vesselId,
      vesselName: vessel?.name || payload.vesselId,
      category: payload.category || 'DRINKING_WATER',
      quantityOrDetails: payload.quantityOrDetails || 'Assistance requested by fisherman',
      urgency: payload.urgency || 'HIGH',
      status: 'PENDING',
      reportedLat: payload.lat || 9.9,
      reportedLng: payload.lng || 76.3,
      idempotencyKey: payload.idempotencyKey || `req-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setRequests((prev) => [newReq, ...prev]);
  };

  return (
    <FleetContext.Provider
      value={{
        vessels,
        storm,
        hazards,
        simulation,
        selectedVessel,
        selectedVesselId,
        setSelectedVesselId,
        incidents,
        requests,
        loading,
        isConnected,
        refreshState,
        loadScenario,
        togglePlay,
        setSpeed,
        setFollowAdvice,
        updateStorm,
        resetScenario,
        updateWhatIf,
        acknowledgeIncident,
        escalateIncident,
        resolveIncident,
        updateAssistanceStatus,
        createSOS,
        createAssistanceRequest,
      }}
    >
      {children}
    </FleetContext.Provider>
  );
};

export const useFleet = (): FleetContextType => {
  const context = useContext(FleetContext);
  if (!context) {
    throw new Error('useFleet must be used within a FleetProvider');
  }
  return context;
};
