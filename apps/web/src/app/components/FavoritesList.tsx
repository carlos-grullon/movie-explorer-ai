'use client';

import Link from 'next/link';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { AlertDialog } from './AlertDialog';
import { Dialog } from './Dialog';

type Favorite = {
  id: string;
  tmdbMovieId: number;
  title: string;
  releaseDate?: string | null;
  posterPath?: string | null;
  customTitle?: string | null;
  personalNotes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type ListFavoritesResponse = {
  favorites: Favorite[];
};

function posterUrl(path?: string | null) {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/w185${path}`;
}

export function FavoritesList() {
  const [confirm, setConfirm] = useState<{ id: string; title: string } | null>(null);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overviewsByTmdbId, setOverviewsByTmdbId] = useState<Record<number, string>>({});
  const [genresByTmdbId, setGenresByTmdbId] = useState<Record<number, string[]>>({});

  const [editing, setEditing] = useState<null | {
    id: string;
    title: string;
    customTitle: string;
    personalNotes: string;
  }>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const loadFavorites = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/favorites', { cache: 'no-store' });
      const json = (await res.json().catch(() => ({}))) as Partial<ListFavoritesResponse> & { message?: string };
      if (!res.ok) throw new Error(json?.message ?? 'Failed to load favorites');
      setFavorites(Array.isArray(json.favorites) ? json.favorites : []);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load favorites');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFavorites();

    function onChanged() {
      void loadFavorites();
    }

    window.addEventListener('favorites:changed', onChanged as any);
    return () => window.removeEventListener('favorites:changed', onChanged as any);
  }, [loadFavorites]);

  useEffect(() => {
    let cancelled = false;

    async function loadOverviews() {
      const missing = favorites
        .map((f) => f.tmdbMovieId)
        .filter((id) => Number.isFinite(id) && (!(id in overviewsByTmdbId) || !(id in genresByTmdbId)));
      if (!missing.length) return;

      const results = await Promise.all(
        missing.map(async (tmdbId) => {
          try {
            const res = await fetch(`/api/tmdb/movie/${tmdbId}`, { cache: 'no-store' });
            if (!res.ok) return [tmdbId, '', [] as string[]] as const;
            const json = (await res.json().catch(() => null)) as any;
            const overview = String(json?.overview ?? '');
            const genres = Array.isArray(json?.genres) ? json.genres.map((g: any) => String(g?.name ?? '')).filter(Boolean) : [];
            return [tmdbId, overview, genres] as const;
          } catch {
            return [tmdbId, '', [] as string[]] as const;
          }
        })
      );

      if (cancelled) return;
      setOverviewsByTmdbId((prev) => {
        const next = { ...prev };
        for (const [tmdbId, overview] of results) next[tmdbId] = overview;
        return next;
      });
      setGenresByTmdbId((prev) => {
        const next = { ...prev };
        for (const [tmdbId, _overview, genres] of results) next[tmdbId] = genres;
        return next;
      });
    }

    void loadOverviews();
    return () => {
      cancelled = true;
    };
  }, [favorites, genresByTmdbId, overviewsByTmdbId]);

  const count = useMemo(() => favorites.length, [favorites.length]);

  const [removingId, setRemovingId] = useState<string | null>(null);

  const removeFavorite = useCallback(
    async (id: string) => {
      const prev = favorites;
      setRemovingId(id);
      setFavorites((curr) => curr.filter((f) => f.id !== id));
      try {
        const res = await fetch(`/api/favorites/${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          let message: string | undefined;
          try {
            const parsed = text ? JSON.parse(text) : null;
            message = parsed?.message;
          } catch {
            message = undefined;
          }

          throw new Error(message ?? `Failed to remove favorite (HTTP ${res.status})${text ? `: ${text}` : ''}`);
        }
        window.dispatchEvent(new Event('favorites:changed'));
      } catch (e: any) {
        setFavorites(prev);
        setError(e?.message ?? 'Failed to remove favorite');
      } finally {
        setRemovingId(null);
      }
    },
    [favorites]
  );

  const saveEdit = useCallback(async () => {
    if (!editing) return;

    const prev = favorites;
    setIsSavingEdit(true);
    setError(null);

    const payload = {
      customTitle: editing.customTitle.trim() ? editing.customTitle.trim() : null,
      personalNotes: editing.personalNotes.trim() ? editing.personalNotes.trim() : null,
    };

    setFavorites((curr) =>
      curr.map((f) => (f.id === editing.id ? { ...f, customTitle: payload.customTitle, personalNotes: payload.personalNotes } : f))
    );

    try {
      const res = await fetch(`/api/favorites/${encodeURIComponent(editing.id)}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        let message: string | undefined;
        try {
          const parsed = text ? JSON.parse(text) : null;
          message = parsed?.message;
        } catch {
          message = undefined;
        }
        throw new Error(message ?? `Failed to update favorite (HTTP ${res.status})${text ? `: ${text}` : ''}`);
      }

      window.dispatchEvent(new Event('favorites:changed'));
      setEditing(null);
    } catch (e: any) {
      setFavorites(prev);
      setError(e?.message ?? 'Failed to update favorite');
    } finally {
      setIsSavingEdit(false);
    }
  }, [editing, favorites]);

  return (
    <div>
      <AlertDialog
        open={Boolean(confirm)}
        title="Remove favorite?"
        description={confirm ? `This will remove “${confirm.title}” from your favorites.` : undefined}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        destructive
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (!confirm) return;
          void removeFavorite(confirm.id);
          setConfirm(null);
        }}
      />

      <Dialog
        open={Boolean(editing)}
        title={editing ? `Edit favorite: ${editing.title}` : 'Edit favorite'}
        description="Update your custom title and personal notes."
        onClose={() => {
          if (isSavingEdit) return;
          setEditing(null);
        }}
        footer={
          <>
            <button
              className="rounded-md border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-50"
              disabled={isSavingEdit}
              onClick={() => setEditing(null)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              disabled={isSavingEdit}
              onClick={() => void saveEdit()}
              type="button"
            >
              {isSavingEdit ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <div className="grid gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Custom title</label>
            <input
              className="mt-2 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="Optional"
              value={editing?.customTitle ?? ''}
              onChange={(e) => setEditing((prev) => (prev ? { ...prev, customTitle: e.target.value } : prev))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Personal notes</label>
            <textarea
              className="mt-2 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="Optional"
              rows={5}
              value={editing?.personalNotes ?? ''}
              onChange={(e) => setEditing((prev) => (prev ? { ...prev, personalNotes: e.target.value } : prev))}
            />
          </div>
        </div>
      </Dialog>

      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{isLoading ? 'Loading…' : error ? error : favorites.length ? '' : 'No favorites yet.'}</div>
        <div className="text-xs text-muted-foreground">{count}</div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {favorites.map((f) => {
          const poster = posterUrl(f.posterPath);
          const year = f.releaseDate?.slice(0, 4);
          const hasCustomTitle = Boolean(f.customTitle?.trim());
          const originalTitle = f.title;
          const customTitle = f.customTitle?.trim() ?? '';
          const overview = overviewsByTmdbId[f.tmdbMovieId] ?? '';
          const genres = (genresByTmdbId[f.tmdbMovieId] ?? []).slice(0, 3);

          return (
            <div key={f.id} className="rounded-lg border border-border bg-card p-3">
              <Link href={`/movie/${f.tmdbMovieId}`} className="group block">
                <div className="aspect-[2/3] w-full overflow-hidden rounded-md bg-muted">
                  {poster ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]" src={poster} alt={originalTitle} />
                  ) : null}
                </div>

                <div className="mt-3">
                  <div className="line-clamp-2 text-sm font-medium text-foreground">
                    {originalTitle}
                    {year ? <span className="text-muted-foreground"> ({year})</span> : null}
                  </div>

                  {hasCustomTitle ? <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">Custom: {customTitle}</div> : null}

                  {genres.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {genres.map((name) => (
                        <span key={name} className="rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground">
                          {name}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {overview ? <div className="mt-2 line-clamp-3 text-xs text-muted-foreground">{overview}</div> : null}

                  {f.personalNotes ? (
                    <div className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Notes:</span> <span>{f.personalNotes}</span>
                    </div>
                  ) : null}
                </div>
              </Link>

              <div className="mt-3 flex gap-2">
                <button
                  className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-50"
                  disabled={removingId === f.id}
                  onClick={() => setConfirm({ id: f.id, title: originalTitle })}
                  type="button"
                >
                  Remove
                </button>

                <button
                  className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-50"
                  disabled={removingId === f.id}
                  onClick={() =>
                    setEditing({
                      id: f.id,
                      title: originalTitle,
                      customTitle: f.customTitle ?? '',
                      personalNotes: f.personalNotes ?? '',
                    })
                  }
                  type="button"
                >
                  Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
