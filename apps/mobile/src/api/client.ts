export type TmdbMovieListItem = {
  id: number;
  title: string;
  overview?: string;
  release_date?: string;
  poster_path?: string;
};

export type TmdbPagedResponse<T> = {
  page: number;
  results: T[];
  total_pages?: number;
  total_results?: number;
};

export type TmdbMovieDetails = {
  id: number;
  title: string;
  overview?: string;
  release_date?: string;
  poster_path?: string;
  genres?: Array<{ id: number; name: string }>;
};

export type Favorite = {
  id: string;
  userId: string;
  tmdbMovieId: number;
  title: string;
  releaseDate?: string | null;
  posterPath?: string | null;
  customTitle?: string | null;
  personalNotes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

const DEFAULT_API_BASE_URL = 'http://192.168.100.8:4000';

export function getApiBaseUrl(): string {
  const v = process.env.EXPO_PUBLIC_API_BASE_URL;
  return (v && v.trim()) || DEFAULT_API_BASE_URL;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getApiBaseUrl().replace(/\/$/, '');
  const url = `${base}${path.startsWith('/') ? '' : '/'}${path}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed: ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text().catch(() => '');
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

async function apiFetchAuthed<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  return apiFetch<T>(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers || {}),
    },
  });
}

export function tmdbTrending(page = 1) {
  return apiFetch<TmdbPagedResponse<TmdbMovieListItem>>(`/tmdb/trending?page=${page}`);
}

export function tmdbSearch(query: string, page = 1) {
  return apiFetch<TmdbPagedResponse<TmdbMovieListItem>>(
    `/tmdb/search?query=${encodeURIComponent(query)}&page=${page}`
  );
}

export function tmdbMovieDetails(movieId: number) {
  return apiFetch<TmdbMovieDetails>(`/tmdb/movie/${movieId}`);
}

export async function favoritesList(accessToken: string): Promise<Favorite[]> {
  const res = await apiFetchAuthed<{ favorites: Favorite[] }>(`/favorites`, accessToken);
  return res.favorites;
}

export async function favoritesAdd(
  accessToken: string,
  input: {
    tmdbMovieId: number;
    title: string;
    releaseDate?: string;
    posterPath?: string;
  }
): Promise<Favorite> {
  const res = await apiFetchAuthed<{ favorite: Favorite }>(`/favorites`, accessToken, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  return res.favorite;
}

export async function favoritesRemove(accessToken: string, id: string): Promise<void> {
  await apiFetchAuthed<void>(`/favorites/${encodeURIComponent(id)}`, accessToken, { method: 'DELETE' });
}

export function tmdbPosterUrl(posterPath: string | null | undefined, width: 500 | 780 = 500): string | null {
  if (!posterPath) return null;
  return `https://image.tmdb.org/t/p/w${width}${posterPath}`;
}
