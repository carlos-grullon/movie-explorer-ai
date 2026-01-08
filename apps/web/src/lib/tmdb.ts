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

const MOCK_MOVIES: Array<TmdbMovie & { genres?: Array<{ id: number; name: string }> }> = [
  {
    id: 603,
    title: 'The Matrix',
    overview:
      'A computer hacker learns about the true nature of his reality and his role in the war against its controllers.',
    poster_path: '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
    release_date: '1999-03-30',
    genres: [
      { id: 28, name: 'Action' },
      { id: 878, name: 'Science Fiction' },
    ],
  },
  {
    id: 157336,
    title: 'Interstellar',
    overview:
      'A team of explorers travel through a wormhole in space in an attempt to ensure humanity’s survival.',
    poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    release_date: '2014-11-05',
    genres: [
      { id: 12, name: 'Adventure' },
      { id: 18, name: 'Drama' },
      { id: 878, name: 'Science Fiction' },
    ],
  },
  {
    id: 27205,
    title: 'Inception',
    overview: 'A thief who steals corporate secrets through dream-sharing technology is given an impossible task.',
    poster_path: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
    release_date: '2010-07-16',
    genres: [
      { id: 28, name: 'Action' },
      { id: 878, name: 'Science Fiction' },
      { id: 53, name: 'Thriller' },
    ],
  },
  {
    id: 155,
    title: 'The Dark Knight',
    overview: 'Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and Harvey Dent...',
    poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    release_date: '2008-07-18',
    genres: [
      { id: 18, name: 'Drama' },
      { id: 28, name: 'Action' },
      { id: 80, name: 'Crime' },
    ],
  },
];

function envFlag(name: string): boolean {
  const v = process.env[name];
  if (!v) return false;
  return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());
}

function isMockEnabled(): boolean {
  return envFlag('TMDB_MOCK');
}

function mockSearchMovies(query: string, page: number): TmdbSearchResponse {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? MOCK_MOVIES.filter((m) => `${m.title} ${m.overview ?? ''}`.toLowerCase().includes(q))
    : MOCK_MOVIES;

  const pageSize = 20;
  const total_results = filtered.length;
  const total_pages = Math.max(1, Math.ceil(total_results / pageSize));
  const safePage = Number.isFinite(page) && page > 0 ? Math.min(page, total_pages) : 1;
  const start = (safePage - 1) * pageSize;
  const results = filtered.slice(start, start + pageSize).map(({ genres, ...movie }) => ({
    ...movie,
    genre_ids: (genres ?? []).map((g) => g.id),
  }));

  return { page: safePage, results, total_pages, total_results };
}

function mockGetMovieDetails(id: number): TmdbMovie & { genres?: Array<{ id: number; name: string }> } {
  const found = MOCK_MOVIES.find((m) => m.id === id);
  if (!found) {
    const err: any = new Error(`Movie not found (mock): ${id}`);
    err.status = 404;
    throw err;
  }
  return found;
}

function mustGetApiKey(): string {
  const v = process.env.TMDB_API_KEY;
  if (!v) {
    throw new Error(
      'TMDB_API_KEY is not set. Add it to apps/web/.env.local or set TMDB_MOCK=true to use the built-in mock dataset.'
    );
  }
  return v;
}

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export async function tmdbSearchMovies(query: string, page: number, opts?: { year?: number }): Promise<TmdbSearchResponse> {
  if (isMockEnabled()) {
    return mockSearchMovies(query, page);
  }

  const apiKey = mustGetApiKey();

  const url = new URL(`${TMDB_BASE_URL}/search/movie`);
  url.searchParams.set('query', query);
  url.searchParams.set('page', String(page));
  url.searchParams.set('include_adult', 'false');
  url.searchParams.set('language', 'en-US');
  if (opts?.year) url.searchParams.set('year', String(opts.year));
  url.searchParams.set('api_key', apiKey);

  let res: Response;
  try {
    res = await fetch(url.toString(), { cache: 'no-store' });
  } catch {
    return mockSearchMovies(query, page);
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403 || res.status >= 500) {
      return mockSearchMovies(query, page);
    }
    const text = await res.text();
    throw new Error(`TMDb search failed (${res.status}): ${text}`);
  }

  return (await res.json()) as TmdbSearchResponse;
}

export async function tmdbTrendingMovies(page: number): Promise<TmdbSearchResponse> {
  if (isMockEnabled()) {
    // Good enough for demos: show mock movies as "trending".
    return mockSearchMovies('', page);
  }

  const apiKey = mustGetApiKey();
  const url = new URL(`${TMDB_BASE_URL}/trending/movie/day`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('language', 'en-US');
  url.searchParams.set('api_key', apiKey);

  let res: Response;
  try {
    res = await fetch(url.toString(), { cache: 'no-store' });
  } catch {
    return mockSearchMovies('', page);
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403 || res.status >= 500) {
      return mockSearchMovies('', page);
    }
    const text = await res.text();
    throw new Error(`TMDb trending failed (${res.status}): ${text}`);
  }

  return (await res.json()) as TmdbSearchResponse;
}

export async function tmdbGetGenres(): Promise<TmdbGenresResponse> {
  if (isMockEnabled()) {
    const genres = Array.from(
      new Map(
        MOCK_MOVIES.flatMap((m) => m.genres ?? []).map((g) => [g.id, g] as const)
      ).values()
    );
    return { genres };
  }

  const apiKey = mustGetApiKey();
  const url = new URL(`${TMDB_BASE_URL}/genre/movie/list`);
  url.searchParams.set('language', 'en-US');
  url.searchParams.set('api_key', apiKey);

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`TMDb genres failed (${res.status})${text ? `: ${text}` : ''}`);
  }
  return (await res.json()) as TmdbGenresResponse;
}

export async function tmdbDiscoverMovies(opts: { page: number; year?: number; genreIds?: number[] }): Promise<TmdbSearchResponse> {
  const { page, year, genreIds } = opts;

  if (isMockEnabled()) {
    let filtered = MOCK_MOVIES;
    if (genreIds?.length) {
      filtered = filtered.filter((m) => (m.genres ?? []).some((g) => genreIds.includes(g.id)));
    }
    if (year) {
      filtered = filtered.filter((m) => (m.release_date?.slice(0, 4) ? Number(m.release_date.slice(0, 4)) === year : false));
    }

    const pageSize = 20;
    const total_results = filtered.length;
    const total_pages = Math.max(1, Math.ceil(total_results / pageSize));
    const safePage = Number.isFinite(page) && page > 0 ? Math.min(page, total_pages) : 1;
    const start = (safePage - 1) * pageSize;
    const results = filtered.slice(start, start + pageSize).map(({ genres, ...movie }) => movie);
    return { page: safePage, results, total_pages, total_results };
  }

  const apiKey = mustGetApiKey();
  const url = new URL(`${TMDB_BASE_URL}/discover/movie`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('include_adult', 'false');
  url.searchParams.set('language', 'en-US');
  url.searchParams.set('sort_by', 'popularity.desc');
  if (year) url.searchParams.set('primary_release_year', String(year));
  if (genreIds?.length) url.searchParams.set('with_genres', genreIds.join(','));
  url.searchParams.set('api_key', apiKey);

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`TMDb discover failed (${res.status})${text ? `: ${text}` : ''}`);
  }
  return (await res.json()) as TmdbSearchResponse;
}

export async function tmdbGetMovieDetails(id: number): Promise<TmdbMovie & { genres?: Array<{ id: number; name: string }> }> {
  if (isMockEnabled()) {
    return mockGetMovieDetails(id);
  }

  const apiKey = mustGetApiKey();

  const url = new URL(`${TMDB_BASE_URL}/movie/${id}`);
  url.searchParams.set('language', 'en-US');
  url.searchParams.set('api_key', apiKey);

  let res: Response;
  try {
    res = await fetch(url.toString(), { cache: 'no-store' });
  } catch {
    return mockGetMovieDetails(id);
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403 || res.status >= 500) {
      return mockGetMovieDetails(id);
    }
    const text = await res.text();
    throw new Error(`TMDb details failed (${res.status}): ${text}`);
  }

  return (await res.json()) as any;
}

export function tmdbPosterUrl(path: string | null | undefined, size: 'w185' | 'w342' | 'w500' = 'w342') {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
