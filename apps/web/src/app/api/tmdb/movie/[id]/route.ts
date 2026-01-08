import { NextResponse } from 'next/server';

import { tmdbGetMovieDetails } from '@/lib/tmdb';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const movieId = Number(id);

  if (!Number.isFinite(movieId)) {
    return NextResponse.json({ message: 'Invalid movie id' }, { status: 400 });
  }

  try {
    const data = await tmdbGetMovieDetails(movieId);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ message: e?.message ?? 'TMDb error' }, { status: 502 });
  }
}
