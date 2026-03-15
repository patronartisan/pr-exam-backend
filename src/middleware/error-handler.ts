import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const errorHandler = (
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) => {
  if (error instanceof ApiError) {
    return response.status(error.statusCode).json({ error: error.message });
  }

  if (error instanceof ZodError) {
    return response.status(400).json({
      error: 'Validation failed',
      details: error.flatten(),
    });
  }

  console.error(error);
  return response.status(500).json({ error: 'Internal server error' });
};
