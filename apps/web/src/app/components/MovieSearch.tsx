'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

type SearchResponse = {
  page: number;
  results: Array<{
    id: number;
    title: string;
    overview?: string;
    poster_path?: string | null;
    release_date?: string;
  }>;
  total_pages: number;
  total_results: number;
};

function posterUrl(path?: string | null) {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/w185${path}`;
}

export function MovieSearch() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [page, setPage] = useState(1);

  const enabled = submitted.trim().length > 0;

  const { data, isLoading, error } = useQuery({
    queryKey: ['tmdb', 'search', submitted, page],
    queryFn: async (): Promise<SearchResponse> => {
      const res = await fetch(`/api/tmdb/search?query=${encodeURIComponent(submitted)}&page=${page}`);
      if (!res.ok) throw new Error((await res.json()).message ?? 'Search failed');
      return (await res.json()) as SearchResponse;
    },
    enabled,
  });

  const results = useMemo(() => data?.results ?? [], [data]);
  const totalPages = data?.total_pages ?? 0;
  const canPrev = enabled && page > 1;
  const canNext = enabled && totalPages > 0 && page < totalPages;

  return (
    <div className="mt-8">
      <form
        className="flex gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(query);
          setPage(1);
        }}
      >
        <input
          className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          placeholder="Search movies (TMDb)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          type="submit"
        >
          Search
        </button>
      </form>

      <div className="mt-4 text-sm text-muted-foreground">
        {enabled ? (
          isLoading ? (
            'Searching…'
          ) : error ? (
            (error as Error).message
          ) : (
            `${data?.total_results ?? 0} results`
          )
        ) : (
          'Type a title and search'
        )}
      </div>

      {enabled && !isLoading && !error && totalPages > 1 ? (
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

      <div className="mt-6 grid gap-4">
        {results.map((m) => {
          const poster = posterUrl(m.poster_path);
          const year = m.release_date?.slice(0, 4);
          return (
            <Link
              key={m.id}
              href={`/movie/${m.id}`}
              className="flex gap-4 rounded-lg border border-border bg-card p-4 hover:bg-muted"
            >
              <div className="h-[92px] w-[62px] flex-none overflow-hidden rounded bg-muted">
                {poster ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="h-full w-full object-cover" src={poster} alt={m.title} />
                ) : null}
              </div>
              <div className="min-w-0">
                <div className="font-medium text-foreground">
                  {m.title}
                  {year ? <span className="text-muted-foreground"> ({year})</span> : null}
                </div>
                <div className="mt-1 line-clamp-3 text-sm text-muted-foreground">{m.overview || 'No overview.'}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
