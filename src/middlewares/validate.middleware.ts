import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export const validate = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.issues.map((e: any) => ({ path: e.path, message: e.message })) 
      });
    }
    next(error);
  }
};
