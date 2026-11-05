import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { CONFIG } from '../config';
import { UserRole, ROLES, UserSession } from '@ocean-pulse/shared';
import { prisma } from '../prisma/client';

export interface TokenPayload {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  assignedVesselId?: string | null;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, CONFIG.jwtSecret, {
    expiresIn: '7d',
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, CONFIG.jwtSecret) as TokenPayload;
  } catch (err) {
    return null;
  }
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function canAccessVessel(user: TokenPayload, vesselId: string): boolean {
  if (user.role === ROLES.ADMIN || user.role === ROLES.SHORE_OPERATOR || user.role === ROLES.SUPERVISOR) {
    return true;
  }
  if (user.role === ROLES.DEMO_VIEWER) {
    return true; // Read-only access for evaluation
  }
  if (user.role === ROLES.FISHERMAN) {
    return user.assignedVesselId === vesselId;
  }
  return false;
}

export function canPerformOperatorAction(user: TokenPayload): boolean {
  return (
    user.role === ROLES.ADMIN ||
    user.role === ROLES.SHORE_OPERATOR ||
    user.role === ROLES.SUPERVISOR
  );
}

export async function logAuditEvent(params: {
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, any>;
}): Promise<void> {
  try {
    await prisma.auditEvent.create({
      data: {
        actorId: params.actorId,
        actorRole: params.actorRole,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        details: params.details ? JSON.stringify(params.details) : null,
      },
    });
  } catch (error) {
    console.error('[Audit] Failed to log audit event:', error);
  }
}
