import { Router, type RequestHandler } from 'express';

export const asyncRoute =
  (handler: RequestHandler): RequestHandler =>
  async (request, response, next) => {
    try {
      await Promise.resolve(handler(request, response, next));
    } catch (error) {
      next(error);
    }
  };
