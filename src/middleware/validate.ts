import { ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    console.log("Request body:", req.body);
    console.log("Request query:", req.query);
    console.log("Request params:", req.params);
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      return res.status(400).json({
        error: result.error.flatten(),
      });
    }

    next();
};