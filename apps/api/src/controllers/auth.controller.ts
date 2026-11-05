import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/client';
import { verifyPassword, signToken, logAuditEvent } from '../security/auth';
import { LoginInput } from '@ocean-pulse/shared';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password }: LoginInput = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
          requestId: req.requestId,
        },
      });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
          requestId: req.requestId,
        },
      });
    }

    const token = signToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role as any,
      assignedVesselId: user.assignedVesselId,
    });

    await logAuditEvent({
      actorId: user.id,
      actorRole: user.role,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user.id,
      details: { email: user.email },
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          assignedVesselId: user.assignedVesselId,
        },
      },
      meta: {
        requestId: req.requestId,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getCurrentUser(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Sign-in required',
          requestId: req.requestId,
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        assignedVesselId: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User account could not be found.',
          requestId: req.requestId,
        },
      });
    }

    res.json({
      success: true,
      data: { user },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user) {
      await logAuditEvent({
        actorId: req.user.userId,
        actorRole: req.user.role,
        action: 'USER_LOGOUT',
        entityType: 'User',
        entityId: req.user.userId,
      });
    }
    res.json({
      success: true,
      data: { message: 'Signed out successfully' },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
}
