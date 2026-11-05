import { z } from 'zod';
import {
  INCIDENT_TYPES,
  INCIDENT_STATUSES,
  ASSISTANCE_CATEGORIES,
  REQUEST_STATUSES,
  ROLES,
} from '../constants';

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const TelemetryIngestionSchema = z.object({
  vesselId: z.string().min(1, 'Vessel ID is required'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracyMeters: z.number().optional().default(5),
  speedKmh: z.number().min(0).max(120),
  bearingDeg: z.number().min(0).max(360),
  source: z.enum(['GPS_HARDWARE', 'BROWSER_GEOLOCATION', 'SIMULATION', 'AIS_FEED']).default('GPS_HARDWARE'),
  observationTimestamp: z.string().datetime().optional(),
});

export type TelemetryIngestionInput = z.infer<typeof TelemetryIngestionSchema>;

export const SOSSubmissionSchema = z.object({
  vesselId: z.string().min(1, 'Vessel ID is required'),
  type: z.nativeEnum(INCIDENT_TYPES).default('MANUAL_SOS'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  gpsAccuracyMeters: z.number().optional(),
  idempotencyKey: z.string().min(8, 'Idempotency key is required'),
  clientSubmittedAt: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
});

export type SOSSubmissionInput = z.infer<typeof SOSSubmissionSchema>;

export const IncidentAcknowledgeSchema = z.object({
  notes: z.string().max(500).optional(),
});

export const IncidentAssignSchema = z.object({
  assignedOperatorId: z.string().min(1),
  assignedOperatorName: z.string().min(1),
  notes: z.string().max(500).optional(),
});

export const IncidentEscalateSchema = z.object({
  agencyName: z.string().min(1, 'External agency name is required (e.g., Indian Coast Guard MRCC)'),
  reason: z.string().min(1),
});

export const IncidentResolveSchema = z.object({
  resolutionNotes: z.string().min(5, 'Resolution details are required'),
});

export const IncidentNoteSchema = z.object({
  note: z.string().min(1).max(1000),
});

export const AssistanceRequestSchema = z.object({
  vesselId: z.string().min(1),
  category: z.nativeEnum(ASSISTANCE_CATEGORIES),
  quantityOrDetails: z.string().min(1).max(500),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  idempotencyKey: z.string().min(8),
});

export type AssistanceRequestInput = z.infer<typeof AssistanceRequestSchema>;

export const AssistanceStatusUpdateSchema = z.object({
  status: z.nativeEnum(REQUEST_STATUSES),
  notes: z.string().max(500).optional(),
});

export const VesselWhatIfSchema = z.object({
  vesselId: z.string().min(1),
  forceLostComms: z.boolean().optional(),
  triggerGpsGlitch: z.boolean().optional(),
  toggleEngineFault: z.boolean().optional(),
  rerouteHeadingDeg: z.number().min(0).max(360).optional(),
  rerouteTargetX: z.number().optional(),
  rerouteTargetY: z.number().optional(),
});

export const SimulationControlSchema = z.object({
  action: z.enum(['PLAY', 'PAUSE', 'RESET', 'SET_SPEED', 'LOAD_SCENARIO', 'UPDATE_STORM', 'SET_FOLLOW_ADVICE']),
  speedMultiplier: z.number().min(0.25).max(10).optional(),
  scenarioId: z.string().optional(),
  followAdvice: z.boolean().optional(),
  storm: z.object({
    x: z.number().optional(),
    y: z.number().optional(),
    radiusKm: z.number().min(5).max(50).optional(),
    bearingDeg: z.number().min(0).max(360).optional(),
    speedKmh: z.number().min(0).max(60).optional(),
  }).optional(),
});

export const MessageSubmissionSchema = z.object({
  recipientId: z.string().min(1),
  vesselId: z.string().optional(),
  messageType: z.enum(['WARNING', 'ACK', 'CHAT', 'INSTRUCTION']).default('CHAT'),
  content: z.string().min(1).max(1000),
  idempotencyKey: z.string().min(8),
});
