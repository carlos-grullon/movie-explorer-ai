'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

type Genre = { id: number; name: string };

type ListResponse = {
  page: number;
  results: Array<{
    id: number;
    title: string;
    overview?: string;
    poster_path?: string | null;
    release_date?: string;
    genre_ids?: number[];
  }>;
  total_pages: number;
  total_results: number;
};

function posterUrl(path?: string | null) {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/w185${path}`;
}

function yearOptions(): Array<number> {
  const current = new Date().getFullYear();
  const earliest = 1950;
  const years: number[] = [];
  for (let y = current; y >= earliest; y -= 1) years.push(y);
  return years;
}

export function HomeBrowse() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [page, setPage] = useState(1);

  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [year, setYear] = useState<number | null>(null);
  const [isGenresOpen, setIsGenresOpen] = useState(false);

  const yearNumber = typeof year === 'number' ? year : undefined;

  const hasQuery = submitted.trim().length > 0;
  const hasFilters = selectedGenres.length > 0 || Boolean(yearNumber);

  const mode: 'trending' | 'discover' | 'search' = hasQuery ? 'search' : hasFilters ? 'discover' : 'trending';

  const genresQuery = useQuery({
    queryKey: ['tmdb', 'genres'],
    queryFn: async (): Promise<{ genres: Genre[] }> => {
      const res = await fetch('/api/tmdb/genres', { cache: 'no-store' });
      if (!res.ok) throw new Error((await res.json()).message ?? 'Failed to load genres');
      return (await res.json()) as { genres: Genre[] };
    },
  });

  const listQuery = useQuery({
    queryKey: ['tmdb', mode, submitted, page, selectedGenres.join(','), yearNumber ?? ''],
    queryFn: async (): Promise<ListResponse> => {
      if (mode === 'trending') {
        const res = await fetch(`/api/tmdb/trending?page=${page}`, { cache: 'no-store' });
        if (!res.ok) throw new Error((await res.json()).message ?? 'Failed to load trending');
        return (await res.json()) as ListResponse;
      }

      if (mode === 'discover') {
        const params = new URLSearchParams();
        params.set('page', String(page));
        if (selectedGenres.length) params.set('genres', selectedGenres.join(','));
        if (yearNumber) params.set('year', String(yearNumber));
        const res = await fetch(`/api/tmdb/discover?${params.toString()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error((await res.json()).message ?? 'Failed to load discover');
        return (await res.json()) as ListResponse;
      }

      const params = new URLSearchParams();
      params.set('query', submitted);
      params.set('page', String(page));
      if (yearNumber) params.set('year', String(yearNumber));
      if (selectedGenres.length) params.set('genres', selectedGenres.join(','));

      const res = await fetch(`/api/tmdb/search?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error((await res.json()).message ?? 'Search failed');
      return (await res.json()) as ListResponse;
    },
  });

  const genres = useMemo(() => genresQuery.data?.genres ?? [], [genresQuery.data]);
  const genreNameById = useMemo(() => new Map(genres.map((g) => [g.id, g.name] as const)), [genres]);
  const selectedGenreNames = useMemo(() => {
    if (!selectedGenres.length) return [] as string[];
    const map = new Map(genres.map((g) => [g.id, g.name] as const));
    return selectedGenres.map((id) => map.get(id)).filter((v): v is string => typeof v === 'string' && v.length > 0);
  }, [genres, selectedGenres]);
  const results = useMemo(() => listQuery.data?.results ?? [], [listQuery.data]);

  const totalPages = listQuery.data?.total_pages ?? 0;
  const canPrev = page > 1;
  const canNext = totalPages > 0 && page < totalPages;

  function toggleGenre(id: number) {
    setSelectedGenres((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
    setPage(1);
  }

  function clearFilters() {
    setSelectedGenres([]);
    setYear(null);
    setPage(1);
  }

  return (
    <div className="mt-6">
      <form
        className="flex flex-col gap-3 md:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(query);
          setPage(1);
        }}
      >
        <input
          className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          placeholder="Search by title…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="flex gap-3">
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90" type="submit">
            Search
          </button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3">
        <div className="relative">
          <button
            className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-muted"
            onClick={() => setIsGenresOpen((v) => !v)}
            type="button"
          >
            Genres: {selectedGenres.length ? `${selectedGenres.length}` : 'Any'}
          </button>

          {isGenresOpen ? (
            <div className="absolute left-0 top-11 z-20 w-[280px] rounded-lg border border-border bg-card p-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-foreground">Genres</div>
                <button
                  className="rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground hover:bg-muted"
                  onClick={() => setIsGenresOpen(false)}
                  type="button"
                >
                  Close
                </button>
              </div>

              <div className="mt-3 max-h-[260px] overflow-auto pr-1">
                {genresQuery.isLoading ? (
                  <div className="text-sm text-muted-foreground">Loading…</div>
                ) : genresQuery.error ? (
                  <div className="text-sm text-destructive">{(genresQuery.error as Error).message}</div>
                ) : (
                  <div className="grid gap-2">
                    {genres.map((g) => (
                      <label key={g.id} className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                        <input type="checkbox" checked={selectedGenres.includes(g.id)} onChange={() => toggleGenre(g.id)} />
                        <span className="truncate">{g.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-1 flex-wrap gap-2">
          {selectedGenreNames.length ? (
            selectedGenreNames.slice(0, 4).map((name) => (
              <span key={name} className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground">
                {name}
              </span>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">Any genres</span>
          )}
          {selectedGenreNames.length > 4 ? (
            <span className="text-xs text-muted-foreground">+{selectedGenreNames.length - 4}</span>
          ) : null}
        </div>

        <select
          className="w-[130px] rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground"
          aria-label="Year"
          value={year ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            setYear(v ? Number(v) : null);
            setPage(1);
          }}
        >
          <option value="">Year: Any</option>
          {yearOptions().map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <button
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-50"
          disabled={!selectedGenres.length && !yearNumber}
          onClick={() => clearFilters()}
          type="button"
        >
          Clear
        </button>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        {listQuery.isLoading ? 'Loading…' : listQuery.error ? (listQuery.error as Error).message : `${listQuery.data?.total_results ?? 0} results`}
      </div>

      {!listQuery.isLoading && !listQuery.error && totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between">
          <button
            className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-50"
            disabled={!canPrev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            type="button"
          >
            Prev
          </button>

          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>

          <button
            className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-50"
            disabled={!canNext}
            onClick={() => setPage((p) => p + 1)}
            type="button"
          >
            Next
          </button>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {results.map((m) => {
          const poster = posterUrl(m.poster_path);
          const year = m.release_date?.slice(0, 4);
          const genreNames = (m.genre_ids ?? [])
            .map((id) => genreNameById.get(id))
            .filter((n): n is string => typeof n === 'string' && n.length > 0)
            .slice(0, 3);

          return (
            <Link key={m.id} href={`/movie/${m.id}`} className="group rounded-lg border border-border bg-card p-3 hover:bg-muted">
              <div className="aspect-[2/3] w-full overflow-hidden rounded-md bg-muted">
                {poster ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]" src={poster} alt={m.title} />
                ) : null}
              </div>

              <div className="mt-3">
                <div className="line-clamp-2 text-sm font-medium text-foreground">
                  {m.title}
                  {year ? <span className="text-muted-foreground"> ({year})</span> : null}
                </div>

                {genreNames.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {genreNames.map((name) => (
                      <span key={name} className="rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground">
                        {name}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-2 line-clamp-3 text-xs text-muted-foreground">{m.overview || 'No overview.'}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
