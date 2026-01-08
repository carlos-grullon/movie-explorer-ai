import { NextResponse } from 'next/server';

import { tmdbSearchMovies } from '@/lib/tmdb';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = url.searchParams.get('query') ?? '';
  const page = Number(url.searchParams.get('page') ?? '1');
  const yearRaw = url.searchParams.get('year');
  const year = yearRaw ? Number(yearRaw) : undefined;

  if (!query.trim()) {
    return NextResponse.json({ page: 1, results: [], total_pages: 0, total_results: 0 });
  }

  try {
    const data = await tmdbSearchMovies(query, Number.isFinite(page) && page > 0 ? page : 1, {
      year: Number.isFinite(year) ? year : undefined,
    });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ message: e?.message ?? 'TMDb error' }, { status: 502 });
  }
}
