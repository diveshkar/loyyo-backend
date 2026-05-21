import type { Response } from 'express';

export const sendSuccess = (
  res: Response,
  data: unknown,
  statusCode = 200
): void => {
  res.status(statusCode).json({
    status: 'success',
    data,
  });
};

export const getClientIp = (req: { ip?: string; headers: Record<string, unknown> }): string | undefined => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string') {
    return forwardedFor.split(',')[0]?.trim();
  }

  return req.ip;
};
