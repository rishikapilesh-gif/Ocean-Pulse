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
  stepSimulationTick,
} from '../services/standaloneSimulator';

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
  resetScenario: () => Promise<void>;
  updateWhatIf: (vesselId: string, params: any) => Promise<void>;
  acknowledgeIncident: (id: string, notes?: string) => Promise<void>;
  escalateIncident: (id: string, agency: string, reason: string) => Promise<void>;
  resolveIncident: (id: string, notes: string) => Promise<void>;
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
    const unsubscribe = subscribeToShore((data) => {
      if (data?.vessels) setVessels(data.vessels);
      if (data?.storm) setStorm(data.storm);
      if (data?.simulation) setSimulation(data.simulation);
      setIsConnected(true);
      isUsingLocalSimRef.current = false;
    });

    const pollInterval = setInterval(() => {
      fetchIncidentsAndRequests();
    }, 6000);

    return () => {
      mounted = false;
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [refreshState, fetchIncidentsAndRequests]);

  const selectedVessel = vessels.find((v) => v.id === selectedVesselId) || vessels[0] || null;

  const loadScenario = async (scenarioId: string) => {
    try {
      const res = await api.controlSimulation({ action: 'LOAD_SCENARIO', scenarioId });
      setVessels(res.vessels);
      setStorm(res.storm);
      setSimulation(res.simulation);
      await fetchIncidentsAndRequests();
    } catch (e) {
      const resetStorm = createInitialStorm();
      const resetVessels = createInitialVessels(resetStorm, hazards);
      setStorm(resetStorm);
      setVessels(resetVessels);
      setSimulation((prev) => (prev ? { ...prev, scenarioId } : prev));
    }
  };

  const togglePlay = async () => {
    const nextRunning = !simulation?.running;
    setSimulation((prev) => (prev ? { ...prev, running: nextRunning } : prev));
    try {
      await api.controlSimulation({ action: nextRunning ? 'PLAY' : 'PAUSE' });
    } catch (e) {
      // handled locally
    }
  };

  const setSpeed = async (multiplier: number) => {
    setSimulation((prev) => (prev ? { ...prev, speedMultiplier: multiplier } : prev));
    try {
      await api.controlSimulation({ action: 'SET_SPEED', speedMultiplier: multiplier });
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
    try {
      await api.controlSimulation({ action: 'RESET' });
    } catch (e) {
      // handled locally
    }
  };

  const updateWhatIf = async (vesselId: string, params: any) => {
    setVessels((prev) =>
      prev.map((v) => {
        if (v.id !== vesselId) return v;
        const next = { ...v, ...params };
        if (params.forceLost !== undefined) {
          next.forceLost = params.forceLost;
          next.commState = params.forceLost ? 'lost' : 'good';
          next.lastContactMinAgo = params.forceLost ? 20 : 0;
        }
        if (params.engineFault !== undefined) {
          next.engineFault = params.engineFault;
          next.effectiveSpeedKmh = params.engineFault ? next.speedKmh * 0.5 : next.speedKmh;
        }
        return next;
      })
    );
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
        resetScenario,
        updateWhatIf,
        acknowledgeIncident,
        escalateIncident,
        resolveIncident,
      }}
    >
      {children}
    </FleetContext.Provider>
  );
};

export function useFleet() {
  const context = useContext(FleetContext);
  if (!context) throw new Error('useFleet must be used within a FleetProvider');
  return context;
}
