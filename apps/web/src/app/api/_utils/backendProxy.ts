import { NextResponse } from 'next/server';

function apiBaseUrl(): string {
  const v = process.env.API_BASE_URL;
  return v?.replace(/\/$/, '') || 'http://localhost:4000';
}

export async function proxyGetToApi(pathWithQuery: string): Promise<NextResponse> {
  const base = apiBaseUrl();
  const path = pathWithQuery.startsWith('/') ? pathWithQuery : `/${pathWithQuery}`;

  const res = await fetch(`${base}${path}`);
  const text = await res.text();

  return new NextResponse(text, {
    status: res.status,
    headers: {
      'content-type': res.headers.get('content-type') ?? 'application/json',
      'cache-control': 'no-store',
    },
  });
}
