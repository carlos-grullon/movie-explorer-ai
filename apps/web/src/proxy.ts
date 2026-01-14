import type { NextRequest } from 'next/server';

import { auth0 } from '@/lib/auth0';

export default async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/auth/')) {
    const missing: string[] = [];
    const required = ['AUTH0_DOMAIN', 'AUTH0_CLIENT_ID', 'AUTH0_SECRET', 'APP_BASE_URL'] as const;
    for (const key of required) {
      if (!process.env[key]) missing.push(key);
    }

    const domain = process.env.AUTH0_DOMAIN;
    if (domain && domain.includes('://')) missing.push('AUTH0_DOMAIN(must be domain only, no scheme)');

    const secret = process.env.AUTH0_SECRET;
    if (secret && secret.length < 32) missing.push('AUTH0_SECRET(must be 32+ chars)');

    const appBaseUrl = process.env.APP_BASE_URL;
    if (appBaseUrl && !appBaseUrl.startsWith('http')) missing.push('APP_BASE_URL(must include http/https)');

    if (missing.length > 0) {
      return Response.json({ error: 'Auth0 configuration error', missing }, { status: 500 });
    }
  }

  return auth0.middleware(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
