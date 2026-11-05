import { Request, Response, NextFunction } from 'express';
import { simulator } from '../simulation/simulator';
import { SCENARIOS } from '../simulation/scenarios';
import { logAuditEvent } from '../security/auth';

export async function getSimulationState(req: Request, res: Response, next: NextFunction) {
  try {
    const fullState = simulator.getFullState();
    res.json({
      success: true,
      data: fullState,
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
}

export async function getScenarios(req: Request, res: Response, next: NextFunction) {
  try {
    const list = Object.values(SCENARIOS).map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      category: s.category,
    }));

    res.json({
      success: true,
      data: { scenarios: list },
      meta: { requestId: req.requestId, total: list.length },
    });
  } catch (err) {
    next(err);
  }
}

export async function controlSimulation(req: Request, res: Response, next: NextFunction) {
  try {
    const { action, speedMultiplier, scenarioId, followAdvice, storm } = req.body;

    switch (action) {
      case 'PLAY':
        simulator.setPlay(true);
        break;
      case 'PAUSE':
        simulator.setPlay(false);
        break;
      case 'SET_SPEED':
        if (speedMultiplier) simulator.setSpeed(speedMultiplier);
        break;
      case 'LOAD_SCENARIO':
        if (scenarioId) simulator.loadScenario(scenarioId);
        break;
      case 'RESET':
        simulator.resetScenario();
        break;
      case 'SET_FOLLOW_ADVICE':
        if (followAdvice !== undefined) simulator.setFollowAdvice(followAdvice);
        break;
      case 'UPDATE_STORM':
        if (storm) simulator.updateStorm(storm);
        break;
    }

    if (req.user) {
      await logAuditEvent({
        actorId: req.user.userId,
        actorRole: req.user.role,
        action: `SIMULATION_${action}`,
        entityType: 'Simulation',
        entityId: 'global',
        details: req.body,
      });
    }

    res.json({
      success: true,
      data: simulator.getFullState(),
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
}
