import { NextResponse } from 'next/server';

import { auth0 } from '@/lib/auth0';

export const dynamic = 'force-dynamic';

function apiBaseUrl(): string | null {
  const v = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
  if (v && v.trim()) return v.replace(/\/$/, '');
  if (process.env.NODE_ENV === 'production') return null;
  return 'http://localhost:4000';
}

function bearerTokenFromAuth0Token(token: unknown): string | null {
  if (!token) return null;
  if (typeof token === 'string') return token;
  if (typeof token === 'object') {
    const t = token as Record<string, unknown>;
    if (typeof t.token === 'string') return t.token;
    if (typeof t.accessToken === 'string') return t.accessToken;
  }
  return null;
}

async function getBearerToken(): Promise<string | null> {
  try {
    const token = await auth0.getAccessToken();
    return bearerTokenFromAuth0Token(token);
  } catch {
    return null;
  }
}

async function getBearerTokenFromRequest(req: Request): Promise<string | null> {
  try {
    void req;
    const token = await auth0.getAccessToken();
    return bearerTokenFromAuth0Token(token);
  } catch {
    return null;
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const baseUrl = apiBaseUrl();
  if (!baseUrl) {
    return NextResponse.json({ message: 'Server misconfigured' }, { status: 500 });
  }
  const token = (await getBearerTokenFromRequest(req)) ?? (await getBearerToken());
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.text();

  const res = await fetch(`${baseUrl}/favorites/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'content-type': req.headers.get('content-type') ?? 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body,
    cache: 'no-store',
  });

  if (res.status === 204) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'cache-control': 'no-store',
      },
    });
  }

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: {
      'content-type': res.headers.get('content-type') ?? 'application/json',
      'cache-control': 'no-store',
    },
  });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const baseUrl = apiBaseUrl();
  if (!baseUrl) {
    return NextResponse.json({ message: 'Server misconfigured' }, { status: 500 });
  }
  const token = (await getBearerTokenFromRequest(req)) ?? (await getBearerToken());
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const res = await fetch(`${baseUrl}/favorites/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (res.status === 204) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'cache-control': 'no-store',
      },
    });
  }

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: {
      'content-type': res.headers.get('content-type') ?? 'application/json',
      'cache-control': 'no-store',
    },
  });
}
