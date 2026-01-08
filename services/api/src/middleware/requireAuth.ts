import { expressjwt, Request as JwtRequest } from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import type { NextFunction, Request, Response } from 'express';

function getEnv(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

export function requireAuth() {
  const authDisabled = getEnv('AUTH_DISABLED') === 'true';
  if (authDisabled) {
    return (req: Request, _res: Response, next: NextFunction) => {
      (req as any).auth = { sub: getEnv('AUTH_DISABLED_USER') ?? 'dev-user' };
      next();
    };
  }

  const domain = getEnv('AUTH0_DOMAIN');
  const audience = getEnv('AUTH0_AUDIENCE');

  if (!domain || !audience) {
    return (_req: Request, res: Response, _next: NextFunction) => {
      res.status(500).json({
        message:
          'Auth0 is not configured. Set AUTH0_DOMAIN and AUTH0_AUDIENCE environment variables.',
      });
    };
  }

  return expressjwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
      jwksUri: `https://${domain}/.well-known/jwks.json`,
    }) as any,
    audience,
    issuer: `https://${domain}/`,
    algorithms: ['RS256'],
  });
}

export type AuthedRequest = JwtRequest;
