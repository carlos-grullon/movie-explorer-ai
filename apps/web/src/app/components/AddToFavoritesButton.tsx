'use client';

import Link from 'next/link';

import { useState } from 'react';

export function AddToFavoritesButton(props: {
  tmdbMovieId: number;
  title: string;
  releaseDate?: string;
  posterPath?: string | null;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [saved, setSaved] = useState(false);

  async function add() {
    setIsSaving(true);
    setError(null);
    setSaved(false);
    setNeedsLogin(false);

    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          tmdbMovieId: props.tmdbMovieId,
          title: props.title,
          releaseDate: props.releaseDate,
          posterPath: props.posterPath ?? undefined,
        }),
      });

      const text = await res.text().catch(() => '');
      let message: string | undefined;
      try {
        const parsed = text ? JSON.parse(text) : null;
        message = parsed?.message;
      } catch {
        message = undefined;
      }

      if (!res.ok) {
        if (res.status === 401) {
          setNeedsLogin(true);
          throw new Error('Log in to add favorites.');
        }
        throw new Error(message ?? `Failed to add favorite (HTTP ${res.status})${text ? `: ${text}` : ''}`);
      }

      setSaved(true);
      window.dispatchEvent(new Event('favorites:changed'));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to add favorite';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-6">
      <button
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        disabled={isSaving}
        onClick={() => void add()}
        type="button"
      >
        {isSaving ? 'Saving…' : 'Add to favorites'}
      </button>

      {error ? (
        <div className="mt-2 text-sm text-destructive">
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
      {saved ? <div className="mt-2 text-sm text-muted-foreground">Saved.</div> : null}
    </div>
  );
}
