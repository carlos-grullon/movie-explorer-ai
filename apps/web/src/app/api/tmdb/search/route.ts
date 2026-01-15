import { NextResponse } from 'next/server';
import { z } from 'zod';

import { tmdbSearchMovies } from '@/lib/tmdb';

const QuerySchema = z.object({
  query: z.string().min(1),
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
      query: url.searchParams.get('query') ?? '',
      page: url.searchParams.get('page') ?? undefined,
      year: url.searchParams.get('year') ?? undefined,
      genres: url.searchParams.get('genres') ?? undefined,
    });
  } catch {
    return NextResponse.json({ message: 'Invalid query params' }, { status: 400 });
  }

  if (!parsed.query.trim()) {
    return NextResponse.json({ page: 1, results: [], total_pages: 0, total_results: 0 });
  }

  try {
    const data = await tmdbSearchMovies(parsed.query, parsed.page ?? 1, {
      year: parsed.year,
      genreIds: parsed.genres,
    });
    return NextResponse.json(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'TMDb error';
    return NextResponse.json({ message }, { status: 502 });
  }
}
