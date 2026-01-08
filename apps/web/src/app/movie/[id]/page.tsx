import Link from 'next/link';

import { tmdbGetMovieDetails, tmdbPosterUrl } from '@/lib/tmdb';
import { AddToFavoritesButton } from '@/app/components/AddToFavoritesButton';
import { Recommendations } from '@/app/components/Recommendations';

export default async function MoviePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const movieId = Number(id);

  const movie = await tmdbGetMovieDetails(movieId);
  const poster = tmdbPosterUrl(movie.poster_path ?? null, 'w342');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-gradient-to-r from-purple-600/20 to-white dark:to-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link className="text-sm font-medium text-foreground" href="/">
            ← Back
          </Link>
          <div className="text-base font-semibold text-foreground">Movie Explorer</div>
          <div />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-col gap-8 md:flex-row">
          <div className="w-full md:w-[280px]">
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              {poster ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={poster} alt={movie.title} className="w-full object-cover" />
              ) : (
                <div className="flex h-[420px] items-center justify-center bg-muted text-sm text-muted-foreground">
                  No poster
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">{movie.title}</h1>
            <div className="mt-2 text-sm text-muted-foreground">
              {movie.release_date ? movie.release_date : 'Release date n/a'}
              {movie.genres?.length ? (
                <span>
                  {' '}
                  • {movie.genres.map((g) => g.name).join(', ')}
                </span>
              ) : null}
            </div>

            <p className="mt-6 whitespace-pre-wrap text-foreground">{movie.overview || 'No overview.'}</p>

            <AddToFavoritesButton
              tmdbMovieId={movie.id}
              title={movie.title}
              releaseDate={movie.release_date}
              posterPath={movie.poster_path ?? null}
            />
          </div>
        </div>

        <Recommendations movieId={movie.id} />
      </main>
    </div>
  );
}
