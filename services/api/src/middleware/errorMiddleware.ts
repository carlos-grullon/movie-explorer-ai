import type { NextFunction, Request, Response } from 'express';

export function errorMiddleware(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = typeof err?.status === 'number' ? err.status : 500;

  const message =
    typeof err?.message === 'string' && err.message.length > 0
      ? err.message
      : 'Internal Server Error';

  if (status === 401) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  return res.status(status).json({ message });
}
