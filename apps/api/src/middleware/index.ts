import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { verifyToken, TokenPayload } from '../security/auth';
import { UserRole } from '@ocean-pulse/shared';
import crypto from 'crypto';

// Extend Express Request interface to carry user and requestId
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      requestId?: string;
    }
  }
}

export function requestMeta(req: Request, res: Response, next: NextFunction) {
  req.requestId = req.header('x-request-id') || crypto.randomUUID();
  res.setHeader('x-request-id', req.requestId);
  next();
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token is missing or malformed',
        requestId: req.requestId,
      },
    });
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_INVALID_OR_EXPIRED',
        message: 'Session has expired or token is invalid. Please sign in again.',
        requestId: req.requestId,
      },
    });
  }

  req.user = payload;
  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
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

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Your account role (${req.user.role}) is not authorized to perform this operation.`,
          requestId: req.requestId,
        },
      });
    }

    next();
  };
}

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request payload',
            details: err.errors.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
            requestId: req.requestId,
          },
        });
      }
      next(err);
    }
  };
}

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  console.error(`[Error] [${req.requestId}] ${req.method} ${req.url}:`, err);

  const status = err.status || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = status === 500 && process.env.NODE_ENV === 'production'
    ? 'An unexpected operational error occurred. The incident has been logged.'
    : err.message || 'Server error';

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      requestId: req.requestId,
    },
  });
}
