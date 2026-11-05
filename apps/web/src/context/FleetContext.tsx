import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  const [vessels, setVessels] = useState<VesselState[]>([]);
  const [storm, setStorm] = useState<StormState | null>(null);
  const [hazards, setHazards] = useState<HazardZoneState[]>([]);
  const [simulation, setSimulation] = useState<SimulationState | null>(null);
  const [selectedVesselId, setSelectedVesselId] = useState<string>('B01');
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [requests, setRequests] = useState<AssistanceRequestRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(true);

  const fetchIncidentsAndRequests = useCallback(async () => {
    try {
      const [incRes, reqRes] = await Promise.all([
        api.getIncidents(),
        api.getAssistanceRequests(),
      ]);
      setIncidents(incRes.incidents);
      setRequests(reqRes.requests);
    } catch (e) {
      console.warn('[Fleet] Incident sync error:', e);
    }
  }, []);

  const refreshState = useCallback(async () => {
    try {
      const res = await api.getSimulationState();
      setVessels(res.vessels);
      setStorm(res.storm);
      setHazards(res.hazards);
      setSimulation(res.simulation);
      setIsConnected(true);
    } catch (err) {
      console.warn('[Fleet] API sync warning:', err);
      setIsConnected(false);
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

    // 1. Subscribe to Real-time WebSockets
    const unsubscribe = subscribeToShore((data) => {
      if (data?.vessels) setVessels(data.vessels);
      if (data?.storm) setStorm(data.storm);
      if (data?.simulation) setSimulation(data.simulation);
      setIsConnected(true);
    });

    // 2. Poll incidents every 3 seconds for active sync
    const pollInterval = setInterval(() => {
      fetchIncidentsAndRequests();
    }, 3000);

    return () => {
      mounted = false;
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [refreshState, fetchIncidentsAndRequests]);

  const selectedVessel = vessels.find((v) => v.id === selectedVesselId) || vessels[0] || null;

  const loadScenario = async (scenarioId: string) => {
    const res = await api.controlSimulation({ action: 'LOAD_SCENARIO', scenarioId });
    setVessels(res.vessels);
    setStorm(res.storm);
    setSimulation(res.simulation);
    await fetchIncidentsAndRequests();
  };

  const togglePlay = async () => {
    const nextRunning = !simulation?.running;
    const res = await api.controlSimulation({ action: nextRunning ? 'PLAY' : 'PAUSE' });
    setSimulation(res.simulation);
  };

  const setSpeed = async (multiplier: number) => {
    const res = await api.controlSimulation({ action: 'SET_SPEED', speedMultiplier: multiplier });
    setSimulation(res.simulation);
  };

  const resetScenario = async () => {
    const res = await api.controlSimulation({ action: 'RESET' });
    setVessels(res.vessels);
    setStorm(res.storm);
    setSimulation(res.simulation);
    await fetchIncidentsAndRequests();
  };

  const updateWhatIf = async (vesselId: string, params: any) => {
    await api.updateVesselWhatIf(vesselId, params);
    await refreshState();
  };

  const acknowledgeIncident = async (id: string, notes?: string) => {
    await api.acknowledgeIncident(id, notes);
    await fetchIncidentsAndRequests();
  };

  const escalateIncident = async (id: string, agency: string, reason: string) => {
    await api.escalateIncident(id, agency, reason);
    await fetchIncidentsAndRequests();
  };

  const resolveIncident = async (id: string, notes: string) => {
    await api.resolveIncident(id, notes);
    await fetchIncidentsAndRequests();
    await refreshState();
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
