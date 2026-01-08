import { NextResponse } from 'next/server';

import { tmdbGetGenres } from '@/lib/tmdb';

export async function GET() {
  try {
    const data = await tmdbGetGenres();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ message: e?.message ?? 'TMDb error' }, { status: 502 });
  }
}
