import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const errorCode = err.code || 'SERVER_ERROR';

  console.error(`[API Error] ${req.method} ${req.url} - ${status} (${errorCode}): ${message}`);

  res.status(status).json({
    error: message,
    code: errorCode,
    status
  });
};
