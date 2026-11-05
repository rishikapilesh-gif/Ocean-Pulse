import { Request, Response, NextFunction } from 'express';
import { simulator } from '../simulation/simulator';
import { generateAICopilotBrief } from '../adapters/ai-copilot';
import { canAccessVessel, logAuditEvent } from '../security/auth';
import { ROLES } from '@ocean-pulse/shared';

export async function getVessels(req: Request, res: Response, next: NextFunction) {
  try {
    const vessels = simulator.getRankedVessels();

    // If fisherman is signed in, only return their assigned vessel, unless demo viewer or shore operator
    if (req.user && req.user.role === ROLES.FISHERMAN) {
      const assigned = vessels.filter((v) => v.id === req.user?.assignedVesselId);
      return res.json({
        success: true,
        data: { vessels: assigned },
        meta: { requestId: req.requestId, total: assigned.length },
      });
    }

    res.json({
      success: true,
      data: { vessels },
      meta: {
        requestId: req.requestId,
        total: vessels.length,
        simTimeMinutes: simulator.getSimulationState().simTimeMinutes,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getVesselById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const vessel = simulator.getVessel(id);

    if (!vessel) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'VESSEL_NOT_FOUND',
          message: `Vessel with identifier '${id}' was not found.`,
          requestId: req.requestId,
        },
      });
    }

    if (req.user && !canAccessVessel(req.user, id)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You are not authorized to view this vessel telemetry.',
          requestId: req.requestId,
        },
      });
    }

    res.json({
      success: true,
      data: { vessel },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateVesselWhatIf(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const updated = simulator.updateVesselWhatIf(id, req.body);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'VESSEL_NOT_FOUND',
          message: `Vessel '${id}' not found.`,
          requestId: req.requestId,
        },
      });
    }

    if (req.user) {
      await logAuditEvent({
        actorId: req.user.userId,
        actorRole: req.user.role,
        action: 'UPDATE_WHAT_IF',
        entityType: 'Vessel',
        entityId: id,
        details: req.body,
      });
    }

    res.json({
      success: true,
      data: { vessel: updated },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
}

export async function acknowledgeWarning(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    simulator.acknowledgeWarning(id);

    if (req.user) {
      await logAuditEvent({
        actorId: req.user.userId,
        actorRole: req.user.role,
        action: 'ACKNOWLEDGE_WARNING',
        entityType: 'Vessel',
        entityId: id,
      });
    }

    res.json({
      success: true,
      data: { message: `Warning acknowledged for vessel ${id}` },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
}

export async function getCopilotBrief(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const vessel = simulator.getVessel(id);

    if (!vessel) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'VESSEL_NOT_FOUND',
          message: `Vessel '${id}' not found.`,
          requestId: req.requestId,
        },
      });
    }

    const ranked = simulator.getRankedVessels();
    const position = ranked.findIndex((v) => v.id === id) + 1;

    const brief = await generateAICopilotBrief({
      vessel,
      storm: simulator.getStorm(),
      rankedPosition: position,
      totalVessels: ranked.length,
    });

    res.json({
      success: true,
      data: { brief },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
}
