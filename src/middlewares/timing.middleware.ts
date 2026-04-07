import { Request, Response, NextFunction } from 'express';

export const requestTiming = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const elapsed = process.hrtime(start);
    const ms = (elapsed[0] * 1000 + elapsed[1] / 1e6).toFixed(3);
    console.log(`[Timer] ${req.method} ${req.originalUrl} - ${ms}ms`);
  });

  next();
};
