import { Router } from 'express';
import {
  authenticate,
  optionalAuth,
  requireRole,
  validateBody,
} from '../middleware';
import {
  LoginSchema,
  SOSSubmissionSchema,
  IncidentAcknowledgeSchema,
  IncidentAssignSchema,
  IncidentEscalateSchema,
  IncidentResolveSchema,
  IncidentNoteSchema,
  AssistanceRequestSchema,
  AssistanceStatusUpdateSchema,
  VesselWhatIfSchema,
  SimulationControlSchema,
  ROLES,
} from '@ocean-pulse/shared';
import * as authCtrl from '../controllers/auth.controller';
import * as vesselCtrl from '../controllers/vessel.controller';
import * as incidentCtrl from '../controllers/incident.controller';
import * as assistanceCtrl from '../controllers/assistance.controller';
import * as simCtrl from '../controllers/simulation.controller';
import * as statusCtrl from '../controllers/status.controller';

const router = Router();

// ================= AUTH ROUTES =================
router.post('/auth/login', validateBody(LoginSchema), authCtrl.login);
router.post('/auth/logout', optionalAuth, authCtrl.logout);
router.get('/auth/me', authenticate, authCtrl.getCurrentUser);

// ================= VESSEL ROUTES =================
router.get('/vessels', optionalAuth, vesselCtrl.getVessels);
router.get('/vessels/:id', optionalAuth, vesselCtrl.getVesselById);
router.patch(
  '/vessels/:id/whatif',
  optionalAuth,
  validateBody(VesselWhatIfSchema.omit({ vesselId: true })),
  vesselCtrl.updateVesselWhatIf
);
router.post('/vessels/:id/acknowledge-warning', optionalAuth, vesselCtrl.acknowledgeWarning);
router.get('/vessels/:id/copilot-brief', optionalAuth, vesselCtrl.getCopilotBrief);

// ================= INCIDENT & DISTRESS (SOS) ROUTES =================
router.post('/sos', optionalAuth, validateBody(SOSSubmissionSchema), incidentCtrl.submitSOS);
router.get('/incidents', optionalAuth, incidentCtrl.getIncidents);
router.get('/incidents/:id', optionalAuth, incidentCtrl.getIncidentById);
router.post(
  '/incidents/:id/acknowledge',
  optionalAuth,
  validateBody(IncidentAcknowledgeSchema),
  incidentCtrl.acknowledgeIncident
);
router.post(
  '/incidents/:id/assign',
  optionalAuth,
  validateBody(IncidentAssignSchema),
  incidentCtrl.assignIncident
);
router.post(
  '/incidents/:id/escalate',
  optionalAuth,
  validateBody(IncidentEscalateSchema),
  incidentCtrl.escalateIncident
);
router.post(
  '/incidents/:id/resolve',
  optionalAuth,
  validateBody(IncidentResolveSchema),
  incidentCtrl.resolveIncident
);
router.post(
  '/incidents/:id/notes',
  optionalAuth,
  validateBody(IncidentNoteSchema),
  incidentCtrl.addIncidentNote
);

// ================= ASSISTANCE REQUESTS =================
router.post(
  '/requests',
  optionalAuth,
  validateBody(AssistanceRequestSchema),
  assistanceCtrl.createAssistanceRequest
);
router.get('/requests', optionalAuth, assistanceCtrl.getAssistanceRequests);
router.patch(
  '/requests/:id/status',
  optionalAuth,
  validateBody(AssistanceStatusUpdateSchema),
  assistanceCtrl.updateRequestStatus
);

// ================= SIMULATION & SCENARIOS =================
router.get('/simulation/state', optionalAuth, simCtrl.getSimulationState);
router.get('/simulation/scenarios', optionalAuth, simCtrl.getScenarios);
router.post(
  '/simulation/control',
  optionalAuth,
  validateBody(SimulationControlSchema),
  simCtrl.controlSimulation
);

// ================= STATUS & ANALYTICS =================
router.get('/status', statusCtrl.healthCheck);
router.get('/datasources', optionalAuth, statusCtrl.getDataSources);
router.get('/analytics/overview', optionalAuth, statusCtrl.getAnalyticsOverview);

export default router;
