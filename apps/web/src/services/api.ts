import {
  LoginInput,
  SOSSubmissionInput,
  AssistanceRequestInput,
  VesselState,
  IncidentRecord,
  AssistanceRequestRecord,
  SimulationState,
  StormState,
  HazardZoneState,
  AICopilotBrief,
} from '@ocean-pulse/shared';

const API_BASE = '/api/v1';

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('ocean_pulse_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok || json.success === false) {
    const errorMsg = json.error?.message || `HTTP error ${response.status}`;
    const err = new Error(errorMsg) as any;
    err.code = json.error?.code;
    err.status = response.status;
    throw err;
  }

  return json.data;
}

export const api = {
  // Auth
  login: (data: LoginInput) =>
    fetchApi<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  logout: () => fetchApi<{ message: string }>('/auth/logout', { method: 'POST' }),
  getCurrentUser: () => fetchApi<{ user: any }>('/auth/me'),

  // Fleet & Vessels
  getVessels: () => fetchApi<{ vessels: VesselState[] }>('/vessels'),
  getVesselById: (id: string) => fetchApi<{ vessel: VesselState }>(`/vessels/${id}`),
  updateVesselWhatIf: (id: string, whatIf: any) =>
    fetchApi<{ vessel: VesselState }>(`/vessels/${id}/whatif`, {
      method: 'PATCH',
      body: JSON.stringify(whatIf),
    }),
  acknowledgeWarning: (id: string) =>
    fetchApi<{ message: string }>(`/vessels/${id}/acknowledge-warning`, { method: 'POST' }),
  getCopilotBrief: (id: string) =>
    fetchApi<{ brief: AICopilotBrief }>(`/vessels/${id}/copilot-brief`),

  // Incidents & Distress (SOS)
  submitSOS: (data: SOSSubmissionInput) =>
    fetchApi<{ incident: IncidentRecord; isDuplicate: boolean; message: string }>('/sos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getIncidents: (query?: { status?: string; vesselId?: string }) => {
    const params = new URLSearchParams(query as Record<string, string>).toString();
    return fetchApi<{ incidents: IncidentRecord[] }>(`/incidents${params ? `?${params}` : ''}`);
  },
  getIncidentById: (id: string) => fetchApi<{ incident: IncidentRecord }>(`/incidents/${id}`),
  acknowledgeIncident: (id: string, notes?: string) =>
    fetchApi<{ incident: IncidentRecord }>(`/incidents/${id}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),
  assignIncident: (id: string, operatorId: string, operatorName: string, notes?: string) =>
    fetchApi<{ incident: IncidentRecord }>(`/incidents/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ assignedOperatorId: operatorId, assignedOperatorName: operatorName, notes }),
    }),
  escalateIncident: (id: string, agencyName: string, reason: string) =>
    fetchApi<{ incident: IncidentRecord }>(`/incidents/${id}/escalate`, {
      method: 'POST',
      body: JSON.stringify({ agencyName, reason }),
    }),
  resolveIncident: (id: string, resolutionNotes: string) =>
    fetchApi<{ incident: IncidentRecord }>(`/incidents/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolutionNotes }),
    }),
  addIncidentNote: (id: string, note: string) =>
    fetchApi<{ note: any }>(`/incidents/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    }),

  // Assistance Requests
  createAssistanceRequest: (data: AssistanceRequestInput) =>
    fetchApi<{ request: AssistanceRequestRecord; isDuplicate: boolean }>('/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getAssistanceRequests: (query?: { vesselId?: string; status?: string }) => {
    const params = new URLSearchParams(query as Record<string, string>).toString();
    return fetchApi<{ requests: AssistanceRequestRecord[] }>(`/requests${params ? `?${params}` : ''}`);
  },
  updateRequestStatus: (id: string, status: string, notes?: string) =>
    fetchApi<{ request: AssistanceRequestRecord }>(`/requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    }),

  // Simulation
  getSimulationState: () =>
    fetchApi<{
      vessels: VesselState[];
      storm: StormState;
      hazards: HazardZoneState[];
      simulation: SimulationState;
    }>('/simulation/state'),
  getScenarios: () => fetchApi<{ scenarios: any[] }>('/simulation/scenarios'),
  controlSimulation: (payload: any) =>
    fetchApi<any>('/simulation/control', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Status & Data Sources
  getDataSources: () => fetchApi<{ sources: any[] }>('/datasources'),
  getAnalyticsOverview: () => fetchApi<{ fleet: any; incidents: any; assistance: any; simulation: any }>('/analytics/overview'),
};
