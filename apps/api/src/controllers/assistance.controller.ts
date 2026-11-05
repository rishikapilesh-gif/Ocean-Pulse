import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/client';
import { emitRequestCreated, emitRequestUpdated } from '../realtime/socket';
import { logAuditEvent } from '../security/auth';
import {
  AssistanceRequestInput,
  REQUEST_STATUSES,
  AssistanceRequestRecord,
} from '@ocean-pulse/shared';

function formatRequestRecord(r: any): AssistanceRequestRecord {
  return {
    id: r.id,
    vesselId: r.vesselId,
    vesselName: r.vessel?.name || `Vessel ${r.vesselId}`,
    category: r.category,
    quantityOrDetails: r.quantityOrDetails,
    urgency: r.urgency,
    status: r.status,
    reportedLat: r.reportedLat,
    reportedLng: r.reportedLng,
    idempotencyKey: r.idempotencyKey,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    acknowledgedAt: r.acknowledgedAt?.toISOString(),
    dispatchedAt: r.dispatchedAt?.toISOString(),
    completedAt: r.completedAt?.toISOString(),
    notes: r.notes,
  };
}

export async function createAssistanceRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const input: AssistanceRequestInput = req.body;

    // Idempotency Check
    const existing = await prisma.assistanceRequest.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { vessel: true },
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        data: {
          request: formatRequestRecord(existing),
          isDuplicate: true,
          message: 'Assistance request already registered (idempotent response).',
        },
        meta: { requestId: req.requestId },
      });
    }

    const created = await prisma.assistanceRequest.create({
      data: {
        vesselId: input.vesselId,
        category: input.category,
        quantityOrDetails: input.quantityOrDetails,
        urgency: input.urgency,
        status: REQUEST_STATUSES.PENDING,
        reportedLat: input.lat,
        reportedLng: input.lng,
        idempotencyKey: input.idempotencyKey,
      },
      include: { vessel: true },
    });

    const formatted = formatRequestRecord(created);
    emitRequestCreated(formatted);

    await logAuditEvent({
      actorId: req.user?.userId || `fisher-${input.vesselId}`,
      actorRole: req.user?.role || 'FISHERMAN',
      action: 'CREATE_ASSISTANCE_REQUEST',
      entityType: 'AssistanceRequest',
      entityId: created.id,
      details: {
        vesselId: input.vesselId,
        category: input.category,
        urgency: input.urgency,
      },
    });

    res.status(201).json({
      success: true,
      data: { request: formatted, isDuplicate: false },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
}

export async function getAssistanceRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const { vesselId, status } = req.query;
    const where: any = {};
    if (vesselId && typeof vesselId === 'string') where.vesselId = vesselId;
    if (status && typeof status === 'string') where.status = status;

    const requests = await prisma.assistanceRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { vessel: true },
    });

    res.json({
      success: true,
      data: { requests: requests.map(formatRequestRecord) },
      meta: { requestId: req.requestId, total: requests.length },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateRequestStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const data: any = { status };
    if (status === REQUEST_STATUSES.ACKNOWLEDGED) data.acknowledgedAt = new Date();
    if (status === REQUEST_STATUSES.DISPATCHED) data.dispatchedAt = new Date();
    if (status === REQUEST_STATUSES.COMPLETED) data.completedAt = new Date();
    if (notes) data.notes = notes;

    const updated = await prisma.assistanceRequest.update({
      where: { id },
      data,
      include: { vessel: true },
    });

    const formatted = formatRequestRecord(updated);
    emitRequestUpdated(formatted);

    await logAuditEvent({
      actorId: req.user?.userId || 'operator',
      actorRole: req.user?.role || 'SHORE_OPERATOR',
      action: 'UPDATE_REQUEST_STATUS',
      entityType: 'AssistanceRequest',
      entityId: id,
      details: { status, notes },
    });

    res.json({
      success: true,
      data: { request: formatted },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
}
