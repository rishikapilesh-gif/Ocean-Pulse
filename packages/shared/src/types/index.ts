import {
  UserRole,
  VesselEquipmentType,
  RiskLevel,
  WarningAdvice,
  CommsState,
  IncidentType,
  IncidentStatus,
  AssistanceCategory,
  RequestStatus,
  SupportedLanguage,
} from '../constants';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface GridPoint {
  x: number; // km from west edge
  y: number; // km from north edge
}

export interface VesselEquipmentProfile {
  label: string;
  comms: string;
  rangeKm: number;
  hasWeatherReceiver: boolean;
  hasCompass: boolean;
  hasEngineSensor: boolean;
}

export interface HorizonAssessment {
  minute: number;
  riskScore: number; // 0.0 - 1.0
  level: RiskLevel;
  waveHeightM: number;
  inStorm: boolean;
  inHazardZone: boolean;
}

export interface RiskFactor {
  weight: number;
  code: string;
  text: string;
  severity: 'crit' | 'warn' | 'info';
  source?: string;
}

export interface RiskAssessment {
  vesselId: string;
  scenarioRiskScore: number; // 0 - 100
  rawRisk: number; // 0.0 - 1.0
  level: RiskLevel;
  confidence: number; // 0 - 100 %
  horizons: HorizonAssessment[];
  factors: RiskFactor[];
  timeToDanger: number | null; // in minutes, or null if no hazard
  timeToDangerLabel: string;
  safeAngleRad: number | null;
  safeBearingDeg: number | null;
  recommendedCompass: string | null;
  urgencyScore: number;
  sortKey: number;
  dataQuality: 'VERIFIED' | 'PARTIAL' | 'STALE' | 'CONFLICTING' | 'INSUFFICIENT';
  modelVersion: string;
  calculatedAt: string;
}

export interface VesselState {
  id: string;
  name: string;
  regNo: string;
  master: string;
  type: VesselEquipmentType;
  equipment: VesselEquipmentProfile;
  x: number;
  y: number;
  lat: number;
  lng: number;
  speedKmh: number;
  effectiveSpeedKmh: number;
  headingRad: number;
  courseRad: number;
  bearingDeg: number;
  trail: GridPoint[];
  forceLost: boolean;
  glitchActive: boolean;
  glitchRemainingSec: number;
  glitchOffset: GridPoint;
  engineFault: boolean;
  commState: CommsState;
  commQuality: number; // 0.0 - 1.0
  lastContactMinAgo: number;
  lastContactIso: string;
  lastDeliveredWarning: {
    level: WarningAdvice;
    safeBearingDeg: number | null;
    issuedAtIso: string;
    acknowledgedByFisher: boolean;
    acknowledgedAtIso?: string;
  };
  assessment?: RiskAssessment;
  activeDistress?: boolean;
  activeDistressType?: IncidentType;
  unacknowledgedAlertsCount: number;
  openAssistanceRequestsCount: number;
}

export interface StormState {
  x: number;
  y: number;
  lat: number;
  lng: number;
  radiusKm: number;
  bearingDeg: number;
  speedKmh: number;
  maxWindSpeedKts: number;
  centralPressureHpa: number;
  source: string;
  isSimulated: boolean;
  updatedAtIso: string;
}

export interface HazardZoneState {
  id: string;
  name: string;
  x: number;
  y: number;
  lat: number;
  lng: number;
  radiusKm: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: 'REEF' | 'SHOAL' | 'RESTRICTED' | 'WRECK';
}

export interface IncidentRecord {
  id: string;
  vesselId: string;
  vesselName: string;
  type: IncidentType;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: IncidentStatus;
  reportedLat: number;
  reportedLng: number;
  reportedGridX: number;
  reportedGridY: number;
  gpsAccuracyMeters?: number;
  source: 'MANUAL_HUD' | 'AUTOMATED_ALGORITHM' | 'COAST_GUARD_RELAY';
  idempotencyKey: string;
  clientSubmittedAt: string;
  serverReceivedAt: string;
  acknowledgedAt?: string;
  acknowledgedByOperatorId?: string;
  acknowledgedByOperatorName?: string;
  assignedOperatorId?: string;
  assignedOperatorName?: string;
  escalatedToExternalAgencyAt?: string;
  escalatedAgencyName?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  operatorNotes: Array<{
    id: string;
    operatorName: string;
    note: string;
    createdAt: string;
  }>;
  auditTrail: Array<{
    action: string;
    actor: string;
    timestamp: string;
    details?: string;
  }>;
}

export interface AssistanceRequestRecord {
  id: string;
  vesselId: string;
  vesselName: string;
  category: AssistanceCategory;
  quantityOrDetails: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: RequestStatus;
  reportedLat: number;
  reportedLng: number;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
  acknowledgedAt?: string;
  dispatchedAt?: string;
  completedAt?: string;
  notes?: string;
}

export interface MessageRecord {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string; // e.g. vessel ID or operator ID
  vesselId?: string;
  messageType: 'WARNING' | 'ACK' | 'CHAT' | 'INSTRUCTION';
  content: string;
  idempotencyKey: string;
  sentAt: string;
  deliveredAt?: string;
  acknowledgedAt?: string;
}

export interface SimulationState {
  running: boolean;
  speedMultiplier: number;
  simTimeMinutes: number;
  scenarioId: string;
  scenarioName: string;
  fishermenFollowAdvice: boolean;
  predictedPathsVisible: boolean;
  language: SupportedLanguage;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedVesselId?: string;
}

export interface AICopilotBrief {
  vesselId: string;
  modelVersion: string;
  generatedAt: string;
  isFallback: boolean;
  prioritySection: string;
  whySection: string;
  whatToDoSection: string;
  dataLimitationsSection: string;
  evidenceTags: string[];
}
