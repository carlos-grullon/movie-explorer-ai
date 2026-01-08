import { NextResponse } from 'next/server';

import { tmdbTrendingMovies } from '@/lib/tmdb';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = Number(url.searchParams.get('page') ?? '1');

  try {
    const data = await tmdbTrendingMovies(Number.isFinite(page) && page > 0 ? page : 1);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ message: e?.message ?? 'TMDb error' }, { status: 502 });
  }
}
