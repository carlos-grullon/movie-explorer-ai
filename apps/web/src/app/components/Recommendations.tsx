'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

function posterUrl(path?: string | null) {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/w342${path}`;
}

type Recommendation = {
  title: string;
  year?: string;
  reason?: string;
  tmdbMovieId: number | null;
};

type RecommendationsResponse = {
  recommendations: Recommendation[];
  source?: 'openai' | 'tmdb';
  message?: string;
};

export function Recommendations(props: { movieId: number }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [items, setItems] = useState<Recommendation[]>([]);
  const [source, setSource] = useState<'openai' | 'tmdb' | null>(null);
  const [postersByTmdbId, setPostersByTmdbId] = useState<Record<number, string | null | undefined>>({});

  const tmdbIds = useMemo(
    () => items.map((i) => i.tmdbMovieId).filter((id): id is number => typeof id === 'number' && Number.isFinite(id)),
    [items]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      setSource(null);
      setNeedsLogin(false);
      try {
        const res = await fetch(`/api/recommendations/${encodeURIComponent(String(props.movieId))}`, {
          cache: 'no-store',
        });

        const text = await res.text().catch(() => '');
        let json: RecommendationsResponse | null = null;
        try {
          json = text ? (JSON.parse(text) as RecommendationsResponse) : null;
        } catch {
          json = null;
        }

        if (!res.ok) {
          const message = json?.message ?? (text || `Failed to load recommendations (HTTP ${res.status})`);
          if (res.status === 401) {
            if (!cancelled) {
              setNeedsLogin(true);
              setItems([]);
              setSource(null);
            }
            throw new Error('Log in to see recommendations.');
          }
          throw new Error(message);
        }

        const recs = Array.isArray(json?.recommendations) ? json!.recommendations : [];
        if (!cancelled) {
          setItems(recs.slice(0, 5));
          setSource(json?.source ?? null);
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to load recommendations';
        if (!cancelled) setError(message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [props.movieId]);

  useEffect(() => {
    let cancelled = false;

    async function loadPosters() {
      const missing = tmdbIds.filter((id) => !(id in postersByTmdbId));
      if (!missing.length) return;

      const results = await Promise.all(
        missing.map(async (id) => {
          try {
            const res = await fetch(`/api/tmdb/movie/${id}`, { cache: 'no-store' });
            if (!res.ok) return [id, null] as const;
            const json = (await res.json().catch(() => null)) as unknown;
            const obj = json && typeof json === 'object' ? (json as Record<string, unknown>) : null;
            const posterPath = typeof obj?.poster_path === 'string' ? obj.poster_path : null;
            return [id, posterPath] as const;
          } catch {
            return [id, null] as const;
          }
        })
      );

      if (cancelled) return;
      setPostersByTmdbId((prev) => {
        const next = { ...prev };
        for (const [id, poster] of results) next[id] = poster;
        return next;
      });
    }

    void loadPosters();
    return () => {
      cancelled = true;
    };
  }, [postersByTmdbId, tmdbIds]);

  return (
    <section className="mt-10">
      <div className="flex items-center gap-3">
        <div className="text-base font-semibold text-foreground">Recommendations</div>
        {source ? (
          <span className="rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground">
            {source === 'openai' ? 'AI' : 'TMDb fallback'}
          </span>
        ) : null}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">Up to 5 similar movies.</div>

      <div className="mt-4 rounded-lg border border-border bg-card p-4">
        {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : null}

        {error ? (
          <div className="text-sm text-destructive">
            {error}
            {needsLogin ? (
              <div className="mt-3">
                <Link
                  className="inline-flex rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  href="/auth/login"
                >
                  Log in
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}

        {!isLoading && !error && items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No recommendations yet.</div>
        ) : null}

        <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((r, idx) => {
            const title = `${r.title}${r.year ? ` (${r.year})` : ''}`;
            const posterPath = typeof r.tmdbMovieId === 'number' ? postersByTmdbId[r.tmdbMovieId] : null;
            const poster = posterUrl(posterPath);
            return (
              <div key={`${r.tmdbMovieId ?? r.title}-${idx}`} className="rounded-lg border border-border bg-background p-3">
                {r.tmdbMovieId ? (
                  <Link href={`/movie/${r.tmdbMovieId}`} className="group block">
                    <div className="aspect-[2/3] w-full overflow-hidden rounded-md bg-muted">
                      {poster ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                          src={poster}
                          alt={r.title}
                        />
                      ) : null}
                    </div>
                    <div className="mt-3 line-clamp-2 text-sm font-medium text-foreground group-hover:underline">{title}</div>
                  </Link>
                ) : (
                  <div className="line-clamp-2 text-sm font-medium text-foreground">{title}</div>
                )}

                {r.reason ? <div className="mt-2 line-clamp-3 text-xs text-muted-foreground">{r.reason}</div> : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
