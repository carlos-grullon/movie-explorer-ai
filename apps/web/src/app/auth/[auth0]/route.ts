import { NextRequest } from 'next/server';

import { auth0 } from '@/lib/auth0';

export const runtime = 'nodejs';

async function handler(request: NextRequest, action: string) {
  switch (action) {
    case 'login':
    case 'logout':
    case 'callback':
    case 'me':
    case 'profile':
      try {
        return await auth0.middleware(request);
      } catch {
        return new Response('Internal Server Error', { status: 500 });
      }
    default:
      return new Response('Not Found', { status: 404 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ auth0: string }> }
) {
  const { auth0: action } = await params;
  return handler(request, action);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ auth0: string }> }
) {
  const { auth0: action } = await params;
  return handler(request, action);
}
