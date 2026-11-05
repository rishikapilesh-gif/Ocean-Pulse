import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/client';
import { simulator } from '../simulation/simulator';
import { CONFIG } from '../config';

export async function healthCheck(_req: Request, res: Response) {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    version: '1.0.0',
    mode: CONFIG.demoMode ? 'DEMO' : 'LIVE',
  });
}

export async function readinessCheck(_req: Request, res: Response) {
  try {
    // Ping DB
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ready',
      database: 'connected',
      simulation: 'initialized',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'not_ready',
      database: 'disconnected',
      error: err.message,
    });
  }
}

export async function getDataSources(req: Request, res: Response, next: NextFunction) {
  try {
    const sources = await prisma.dataSourceStatus.findMany({
      orderBy: { sourceName: 'asc' },
    });

    res.json({
      success: true,
      data: { sources },
      meta: { requestId: req.requestId, total: sources.length },
    });
  } catch (err) {
    next(err);
  }
}

export async function getAnalyticsOverview(req: Request, res: Response, next: NextFunction) {
  try {
    const vessels = simulator.getRankedVessels();
    const criticalVessels = vessels.filter((v) => v.assessment?.level === 'Critical').length;
    const highVessels = vessels.filter((v) => v.assessment?.level === 'High').length;
    const mediumVessels = vessels.filter((v) => v.assessment?.level === 'Medium').length;
    const safeVessels = vessels.filter((v) => v.assessment?.level === 'Safe').length;
    const lostCommsVessels = vessels.filter((v) => v.commState === 'lost').length;

    const activeIncidentsCount = await prisma.incident.count({
      where: { status: { in: ['RECEIVED', 'ACKNOWLEDGED', 'ASSESSED', 'ASSIGNED', 'ACTION_IN_PROGRESS'] } },
    });

    const pendingRequestsCount = await prisma.assistanceRequest.count({
      where: { status: { in: ['PENDING', 'ACKNOWLEDGED'] } },
    });

    res.json({
      success: true,
      data: {
        fleet: {
          totalVessels: vessels.length,
          critical: criticalVessels,
          high: highVessels,
          medium: mediumVessels,
          safe: safeVessels,
          lostCommunication: lostCommsVessels,
        },
        incidents: {
          activeCount: activeIncidentsCount,
        },
        assistance: {
          pendingRequestsCount,
        },
        simulation: {
          simTimeMinutes: simulator.getSimulationState().simTimeMinutes,
          scenarioId: simulator.getSimulationState().scenarioId,
          scenarioName: simulator.getSimulationState().scenarioName,
        },
      },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
}
