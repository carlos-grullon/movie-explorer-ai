import { NextResponse } from 'next/server';

import { proxyGetToApi } from '../../_utils/backendProxy';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = Number(url.searchParams.get('page') ?? '1');

  try {
    return await proxyGetToApi(
      `/tmdb/trending?page=${encodeURIComponent(String(Number.isFinite(page) && page > 0 ? page : 1))}`
    );
  } catch (e: any) {
    return NextResponse.json({ message: e?.message ?? 'TMDb error' }, { status: 502 });
  }
}
