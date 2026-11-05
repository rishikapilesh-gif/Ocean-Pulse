import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/client';
import { simulator } from '../simulation/simulator';
import {
  emitIncidentCreated,
  emitIncidentUpdated,
  emitIncidentAcknowledged,
} from '../realtime/socket';
import { logAuditEvent } from '../security/auth';
import {
  SOSSubmissionInput,
  INCIDENT_STATUSES,
  IncidentRecord,
} from '@ocean-pulse/shared';
import { geoToGrid } from '../risk-engine/calculations';

function formatIncidentRecord(inc: any): IncidentRecord {
  return {
    id: inc.id,
    vesselId: inc.vesselId,
    vesselName: inc.vessel?.name || `Vessel ${inc.vesselId}`,
    type: inc.type,
    priority: inc.priority,
    status: inc.status,
    reportedLat: inc.reportedLat,
    reportedLng: inc.reportedLng,
    reportedGridX: inc.reportedGridX,
    reportedGridY: inc.reportedGridY,
    gpsAccuracyMeters: inc.gpsAccuracyMeters,
    source: inc.source,
    idempotencyKey: inc.idempotencyKey,
    clientSubmittedAt: inc.clientSubmittedAt.toISOString(),
    serverReceivedAt: inc.serverReceivedAt.toISOString(),
    acknowledgedAt: inc.acknowledgedAt?.toISOString(),
    acknowledgedByOperatorId: inc.acknowledgedByOperatorId,
    acknowledgedByOperatorName: inc.acknowledgedByOperatorId ? 'Shore Operator' : undefined,
    assignedOperatorId: inc.assignedOperatorId,
    assignedOperatorName: inc.assignedOperator?.name,
    escalatedToExternalAgencyAt: inc.escalatedAt?.toISOString(),
    escalatedAgencyName: inc.escalatedToExternalAgency,
    resolvedAt: inc.resolvedAt?.toISOString(),
    resolutionNotes: inc.resolutionNotes,
    operatorNotes: (inc.notes || []).map((n: any) => ({
      id: n.id,
      operatorName: n.operatorName,
      note: n.note,
      createdAt: n.createdAt.toISOString(),
    })),
    auditTrail: [],
  };
}

export async function submitSOS(req: Request, res: Response, next: NextFunction) {
  try {
    const input: SOSSubmissionInput = req.body;

    // 1. Idempotency Check: prevent duplicate SOS on retries or reconnection
    const existing = await prisma.incident.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { vessel: true, assignedOperator: true, notes: true },
    });

    if (existing) {
      console.log(`[Incident] Idempotent retry detected for key: ${input.idempotencyKey}`);
      return res.status(200).json({
        success: true,
        data: {
          incident: formatIncidentRecord(existing),
          isDuplicate: true,
          message: 'Distress alert already registered; idempotent response returned.',
        },
        meta: { requestId: req.requestId },
      });
    }

    // 2. Derive grid coordinates from GPS
    const grid = geoToGrid({ lat: input.lat, lng: input.lng });

    // 3. Create Incident within transaction
    const incident = await prisma.$transaction(async (tx) => {
      const created = await tx.incident.create({
        data: {
          vesselId: input.vesselId,
          type: input.type,
          priority: 'CRITICAL',
          status: INCIDENT_STATUSES.RECEIVED,
          reportedLat: input.lat,
          reportedLng: input.lng,
          reportedGridX: grid.x,
          reportedGridY: grid.y,
          gpsAccuracyMeters: input.gpsAccuracyMeters,
          source: 'MANUAL_HUD',
          idempotencyKey: input.idempotencyKey,
          clientSubmittedAt: input.clientSubmittedAt ? new Date(input.clientSubmittedAt) : new Date(),
          serverReceivedAt: new Date(),
        },
        include: { vessel: true, notes: true },
      });

      if (input.notes) {
        await tx.incidentNote.create({
          data: {
            incidentId: created.id,
            operatorId: req.user?.userId || 'system',
            operatorName: 'Fisherman Master Report',
            note: input.notes,
          },
        });
      }

      return created;
    });

    // 4. Update live simulation state with active distress override
    simulator.setVesselDistress(input.vesselId, true, input.type);

    const formatted = formatIncidentRecord(incident);

    // 5. Broadcast to connected shore operators and fisherman HUD
    emitIncidentCreated(formatted);

    // 6. Audit Trail
    await logAuditEvent({
      actorId: req.user?.userId || `fisher-${input.vesselId}`,
      actorRole: req.user?.role || 'FISHERMAN',
      action: 'SUBMIT_SOS',
      entityType: 'Incident',
      entityId: incident.id,
      details: {
        vesselId: input.vesselId,
        type: input.type,
        idempotencyKey: input.idempotencyKey,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        incident: formatted,
        isDuplicate: false,
        message: 'Distress alert successfully committed and registered with Shore Command.',
      },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
}

export async function getIncidents(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, vesselId } = req.query;

    const where: any = {};
    if (status && typeof status === 'string') {
      where.status = status;
    }
    if (vesselId && typeof vesselId === 'string') {
      where.vesselId = vesselId;
    }

    const incidents = await prisma.incident.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        vessel: true,
        assignedOperator: true,
        notes: { orderBy: { createdAt: 'desc' } },
      },
    });

    res.json({
      success: true,
      data: { incidents: incidents.map(formatIncidentRecord) },
      meta: { requestId: req.requestId, total: incidents.length },
    });
  } catch (err) {
    next(err);
  }
}

export async function getIncidentById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        vessel: true,
        assignedOperator: true,
        notes: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'INCIDENT_NOT_FOUND',
          message: `Incident '${id}' was not found.`,
          requestId: req.requestId,
        },
      });
    }

    res.json({
      success: true,
      data: { incident: formatIncidentRecord(incident) },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
}

export async function acknowledgeIncident(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const operatorId = req.user?.userId || 'unknown-op';
    const operatorName = req.user?.name || 'Shore Operator';

    const incident = await prisma.incident.update({
      where: { id },
      data: {
        status: INCIDENT_STATUSES.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
        acknowledgedByOperatorId: operatorId,
      },
      include: { vessel: true, assignedOperator: true, notes: true },
    });

    if (req.body?.notes) {
      await prisma.incidentNote.create({
        data: {
          incidentId: id,
          operatorId,
          operatorName,
          note: req.body.notes,
        },
      });
    }

    emitIncidentAcknowledged({
      incidentId: id,
      vesselId: incident.vesselId,
      acknowledgedAt: new Date().toISOString(),
      operatorName,
    });

    emitIncidentUpdated(formatIncidentRecord(incident));

    await logAuditEvent({
      actorId: operatorId,
      actorRole: req.user?.role || 'SHORE_OPERATOR',
      action: 'ACKNOWLEDGE_INCIDENT',
      entityType: 'Incident',
      entityId: id,
      details: { operatorName },
    });

    res.json({
      success: true,
      data: { incident: formatIncidentRecord(incident) },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
}

export async function assignIncident(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { assignedOperatorId, assignedOperatorName, notes } = req.body;

    const incident = await prisma.incident.update({
      where: { id },
      data: {
        status: INCIDENT_STATUSES.ASSIGNED,
        assignedOperatorId,
      },
      include: { vessel: true, assignedOperator: true, notes: true },
    });

    if (notes) {
      await prisma.incidentNote.create({
        data: {
          incidentId: id,
          operatorId: req.user?.userId || 'system',
          operatorName: req.user?.name || 'Operator',
          note: `Assigned to ${assignedOperatorName}: ${notes}`,
        },
      });
    }

    emitIncidentUpdated(formatIncidentRecord(incident));

    res.json({
      success: true,
      data: { incident: formatIncidentRecord(incident) },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
}

export async function escalateIncident(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { agencyName, reason } = req.body;

    const incident = await prisma.incident.update({
      where: { id },
      data: {
        status: INCIDENT_STATUSES.ACTION_IN_PROGRESS,
        escalatedToExternalAgency: agencyName,
        escalatedAt: new Date(),
      },
      include: { vessel: true, assignedOperator: true, notes: true },
    });

    await prisma.incidentNote.create({
      data: {
        incidentId: id,
        operatorId: req.user?.userId || 'supervisor',
        operatorName: req.user?.name || 'Supervisor',
        note: `ESCALATED to external authority [${agencyName}]: ${reason}`,
      },
    });

    emitIncidentUpdated(formatIncidentRecord(incident));

    await logAuditEvent({
      actorId: req.user?.userId || 'supervisor',
      actorRole: req.user?.role || 'SUPERVISOR',
      action: 'ESCALATE_INCIDENT',
      entityType: 'Incident',
      entityId: id,
      details: { agencyName, reason },
    });

    res.json({
      success: true,
      data: { incident: formatIncidentRecord(incident) },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
}

export async function resolveIncident(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { resolutionNotes } = req.body;

    const incident = await prisma.incident.update({
      where: { id },
      data: {
        status: INCIDENT_STATUSES.RESOLVED,
        resolvedAt: new Date(),
        resolutionNotes,
      },
      include: { vessel: true, assignedOperator: true, notes: true },
    });

    // Clear active distress in live simulation
    simulator.setVesselDistress(incident.vesselId, false);

    await prisma.incidentNote.create({
      data: {
        incidentId: id,
        operatorId: req.user?.userId || 'system',
        operatorName: req.user?.name || 'Operator',
        note: `RESOLVED: ${resolutionNotes}`,
      },
    });

    emitIncidentUpdated(formatIncidentRecord(incident));

    await logAuditEvent({
      actorId: req.user?.userId || 'operator',
      actorRole: req.user?.role || 'SHORE_OPERATOR',
      action: 'RESOLVE_INCIDENT',
      entityType: 'Incident',
      entityId: id,
      details: { resolutionNotes },
    });

    res.json({
      success: true,
      data: { incident: formatIncidentRecord(incident) },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
}

export async function addIncidentNote(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const newNote = await prisma.incidentNote.create({
      data: {
        incidentId: id,
        operatorId: req.user?.userId || 'system',
        operatorName: req.user?.name || 'Operator',
        note,
      },
    });

    res.status(201).json({
      success: true,
      data: { note: newNote },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
}
