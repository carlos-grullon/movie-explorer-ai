type TmdbMovie = {
  id: number;
  title: string;
  overview?: string;
  poster_path?: string | null;
  release_date?: string;
  genre_ids?: number[];
};

type TmdbGenre = {
  id: number;
  name: string;
};

type TmdbSearchResponse = {
  page: number;
  results: TmdbMovie[];
  total_pages: number;
  total_results: number;
};

type TmdbGenresResponse = {
  genres: TmdbGenre[];
};

function apiBaseUrl(): string {
  const v = process.env.NEXT_PUBLIC_API_BASE_URL;
  return v?.replace(/\/$/, '') || 'http://localhost:4000';
}

async function fetchFromBackend<T>(path: string, searchParams?: URLSearchParams): Promise<T> {
  const url = new URL(`${apiBaseUrl()}${path}`);
  if (searchParams) {
    searchParams.forEach((val, key) => url.searchParams.append(key, val));
  }

  const res = await fetch(url.toString(), {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Backend request failed (${res.status}): ${text}`);
  }

  return (await res.json()) as T;
}

export async function tmdbSearchMovies(
  query: string,
  page: number,
  opts?: { year?: number; genreIds?: number[] }
): Promise<TmdbSearchResponse> {
  const params = new URLSearchParams();
  params.set('query', query);
  params.set('page', String(page));
  if (opts?.year) params.set('year', String(opts.year));
  if (opts?.genreIds?.length) params.set('genreIds', opts.genreIds.join(','));

  return fetchFromBackend<TmdbSearchResponse>('/tmdb/search', params);
}

export async function tmdbTrendingMovies(page: number): Promise<TmdbSearchResponse> {
  const params = new URLSearchParams();
  params.set('page', String(page));

  return fetchFromBackend<TmdbSearchResponse>('/tmdb/trending', params);
}

export async function tmdbGetGenres(): Promise<TmdbGenresResponse> {
  return fetchFromBackend<TmdbGenresResponse>('/tmdb/genres');
}

export async function tmdbDiscoverMovies(opts: {
  page: number;
  year?: number;
  genreIds?: number[];
}): Promise<TmdbSearchResponse> {
  const params = new URLSearchParams();
  params.set('page', String(opts.page));
  if (opts.year) params.set('year', String(opts.year));
  if (opts.genreIds?.length) params.set('genreIds', opts.genreIds.join(','));

  return fetchFromBackend<TmdbSearchResponse>('/tmdb/discover', params);
}

export async function tmdbGetMovieDetails(
  id: number
): Promise<TmdbMovie & { genres?: Array<{ id: number; name: string }> }> {
  return fetchFromBackend<TmdbMovie & { genres?: Array<{ id: number; name: string }> }>(
    `/tmdb/movie/${id}`
  );
}

export function tmdbPosterUrl(
  path: string | null | undefined,
  size: 'w185' | 'w342' | 'w500' = 'w342'
) {
  if (!path) return null;
  // This is still useful to keep in frontend or can be moved to backend if we want to proxy images too,
  // but usually standard to construct URL in frontend.
  // Note: Backend mocks return full paths or relative paths.
  // If it's a full URL (mock), use it. If relative, append base.
  if (path.startsWith('http')) return path;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

