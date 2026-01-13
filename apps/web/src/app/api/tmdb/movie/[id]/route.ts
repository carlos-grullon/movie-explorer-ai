import { NextResponse } from 'next/server';

import { proxyGetToApi } from '../../../_utils/backendProxy';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const movieId = Number(id);

  if (!Number.isFinite(movieId)) {
    return NextResponse.json({ message: 'Invalid movie id' }, { status: 400 });
  }

  try {
    return await proxyGetToApi(`/tmdb/movie/${encodeURIComponent(String(movieId))}`);
  } catch (e: any) {
    return NextResponse.json({ message: e?.message ?? 'TMDb error' }, { status: 502 });
  }
}
