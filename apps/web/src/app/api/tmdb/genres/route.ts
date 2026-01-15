import { NextResponse } from 'next/server';

import { tmdbGetGenres } from '@/lib/tmdb';

export async function GET() {
  try {
    const data = await tmdbGetGenres();
    return NextResponse.json(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'TMDb error';
    return NextResponse.json({ message }, { status: 502 });
  }
}
