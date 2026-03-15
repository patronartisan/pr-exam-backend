import type { NextFunction, Request, Response } from 'express';

import { verifyAuthToken } from '../auth/jwt.js';

export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: number;
    email: string;
  };
}

export const authMiddleware = (
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
) => {
  const authorization = request.header('authorization');

  if (!authorization) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  const normalized = authorization.trim();
  let token = normalized.replace(/^Bearer\s+/i, '').trim();

  while (/^Bearer\s+/i.test(token)) {
    token = token.replace(/^Bearer\s+/i, '').trim();
  }

  if (!token) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = verifyAuthToken(token);
    request.auth = {
      userId: payload.userId,
      email: payload.email,
    };
    return next();
  } catch {
    return response.status(401).json({ error: 'Invalid or expired token' });
  }
};
