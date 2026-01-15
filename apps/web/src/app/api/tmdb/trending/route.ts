import { NextResponse } from 'next/server';

import { tmdbTrendingMovies } from '@/lib/tmdb';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = Number(url.searchParams.get('page') ?? '1');

  try {
    const data = await tmdbTrendingMovies(
      Number.isFinite(page) && page > 0 ? page : 1
    );
    return NextResponse.json(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'TMDb error';
    return NextResponse.json({ message }, { status: 502 });
  }
}
