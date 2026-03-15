import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';

import { signAuthToken } from '../auth/jwt.js';
import { db } from '../db.js';
import { ApiError } from '../middleware/error-handler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { authMiddleware } from '../middleware/auth.js';

export const authRouter = Router();

type AuthUserRecord = {
  id: number;
  fullName: string;
  email: string;
  passwordHash: string;
};

type PublicAuthUser = {
  id: number;
  fullName: string;
  email: string;
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post('/login', async (request, response, next) => {
  try {
    const payload = loginSchema.parse(request.body);

    const user = (await db.authUser.findUnique({
      where: { email: payload.email },
    })) as AuthUserRecord | null;

    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(payload.password, user.passwordHash);

    if (!isValidPassword) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const token = signAuthToken({
      userId: user.id,
      email: user.email,
    });

    response.json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', authMiddleware, async (request, response, next) => {
  try {
    const authRequest = request as AuthenticatedRequest;

    if (!authRequest.auth?.userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const user = (await db.authUser.findUnique({
      where: { id: authRequest.auth.userId },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    })) as PublicAuthUser | null;

    if (!user) {
      throw new ApiError(401, 'Unauthorized');
    }

    response.json(user);
  } catch (error) {
    next(error);
  }
});
