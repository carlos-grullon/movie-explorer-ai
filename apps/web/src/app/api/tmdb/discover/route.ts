import { NextResponse } from 'next/server';
import { z } from 'zod';

import { tmdbDiscoverMovies } from '@/lib/tmdb';

const QuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  year: z.coerce.number().int().min(1878).max(2100).optional(),
  genres: z
    .string()
    .optional()
    .transform((v) => {
      if (!v) return [];
      return v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((n) => Number(n))
        .filter((n) => Number.isFinite(n));
    }),
});

export async function GET(req: Request) {
  const url = new URL(req.url);

  let parsed: z.infer<typeof QuerySchema>;
  try {
    parsed = QuerySchema.parse({
      page: url.searchParams.get('page') ?? undefined,
      year: url.searchParams.get('year') ?? undefined,
      genres: url.searchParams.get('genres') ?? undefined,
    });
  } catch {
    return NextResponse.json({ message: 'Invalid query params' }, { status: 400 });
  }

  try {
    const data = await tmdbDiscoverMovies({
      page: parsed.page ?? 1,
      year: parsed.year,
      genreIds: parsed.genres,
    });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ message: e?.message ?? 'TMDb error' }, { status: 502 });
  }
}
