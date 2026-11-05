import {
  VesselState,
  RiskAssessment,
  IncidentRecord,
  AssistanceRequestRecord,
  MessageRecord,
  StormState,
  SimulationState,
} from '../types';

export const SOCKET_EVENTS = {
  // Client -> Server
  SUBSCRIBE_VESSEL: 'subscribe:vessel',
  UNSUBSCRIBE_VESSEL: 'unsubscribe:vessel',
  SUBSCRIBE_SHORE: 'subscribe:shore',
  UNSUBSCRIBE_SHORE: 'unsubscribe:shore',

  // Server -> Client
  VESSEL_TELEMETRY: 'vessel:telemetry',
  VESSEL_ASSESSMENT: 'vessel:assessment',
  FLEET_STATE: 'fleet:state',
  FLEET_PRIORITY_UPDATED: 'fleet:priority_updated',
  INCIDENT_CREATED: 'incident:created',
  INCIDENT_UPDATED: 'incident:updated',
  INCIDENT_ACKNOWLEDGED: 'incident:acknowledged',
  REQUEST_CREATED: 'request:created',
  REQUEST_UPDATED: 'request:updated',
  MESSAGE_RECEIVED: 'message:received',
  MESSAGE_ACKNOWLEDGED: 'message:acknowledged',
  ENVIRONMENT_UPDATED: 'environment:updated',
  SIMULATION_STATE: 'simulation:state',
  SYSTEM_STATUS: 'system:status',
} as const;

export interface SocketEventPayloads {
  [SOCKET_EVENTS.VESSEL_TELEMETRY]: VesselState;
  [SOCKET_EVENTS.VESSEL_ASSESSMENT]: RiskAssessment;
  [SOCKET_EVENTS.FLEET_STATE]: {
    vessels: VesselState[];
    storm: StormState;
    simulation: SimulationState;
  };
  [SOCKET_EVENTS.FLEET_PRIORITY_UPDATED]: {
    rankedVesselIds: string[];
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    safeCount: number;
    unknownCount: number;
  };
  [SOCKET_EVENTS.INCIDENT_CREATED]: IncidentRecord;
  [SOCKET_EVENTS.INCIDENT_UPDATED]: IncidentRecord;
  [SOCKET_EVENTS.INCIDENT_ACKNOWLEDGED]: { incidentId: string; acknowledgedAt: string; operatorName: string };
  [SOCKET_EVENTS.REQUEST_CREATED]: AssistanceRequestRecord;
  [SOCKET_EVENTS.REQUEST_UPDATED]: AssistanceRequestRecord;
  [SOCKET_EVENTS.MESSAGE_RECEIVED]: MessageRecord;
  [SOCKET_EVENTS.MESSAGE_ACKNOWLEDGED]: { messageId: string; acknowledgedAt: string };
  [SOCKET_EVENTS.ENVIRONMENT_UPDATED]: { storm: StormState };
  [SOCKET_EVENTS.SIMULATION_STATE]: SimulationState;
}
