export type TmdbMovieDetails = {
  id: number;
  title: string;
  overview?: string;
  release_date?: string;
  genres?: Array<{ id: number; name: string }>;
};

export type TmdbMovieListItem = {
  id: number;
  title: string;
  overview?: string;
  release_date?: string;
};

function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    const err: any = new Error(
      name === 'TMDB_API_KEY'
        ? 'TMDB_API_KEY is not set in services/api/.env (required for recommendations)'
        : `Missing environment variable: ${name}`
    );
    err.status = 500;
    throw err;
  }
  return v;
}

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export class TmdbClient {
  private readonly apiKey: string;

  constructor() {
    this.apiKey = mustGetEnv('TMDB_API_KEY');
  }

  async getMovieDetails(movieId: number): Promise<TmdbMovieDetails> {
    const url = new URL(`${TMDB_BASE_URL}/movie/${movieId}`);
    url.searchParams.set('api_key', this.apiKey);

    let res: Response;
    try {
      res = await fetch(url.toString());
    } catch {
      const err: any = new Error('TMDb request failed (network error)');
      err.status = 502;
      throw err;
    }
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        const err: any = new Error('TMDb auth failed. Check TMDB_API_KEY in services/api/.env');
        err.status = 502;
        throw err;
      }
      const err: any = new Error(`TMDb error: ${res.status}`);
      err.status = 502;
      throw err;
    }
    return (await res.json()) as TmdbMovieDetails;
  }

  async searchMovieIdByTitle(title: string, year?: string): Promise<number | null> {
    const url = new URL(`${TMDB_BASE_URL}/search/movie`);
    url.searchParams.set('api_key', this.apiKey);
    url.searchParams.set('query', title);
    if (year) url.searchParams.set('year', year);

    let res: Response;
    try {
      res = await fetch(url.toString());
    } catch {
      const err: any = new Error('TMDb search request failed (network error)');
      err.status = 502;
      throw err;
    }
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        const err: any = new Error('TMDb auth failed. Check TMDB_API_KEY in services/api/.env');
        err.status = 502;
        throw err;
      }
      const err: any = new Error(`TMDb search error: ${res.status}`);
      err.status = 502;
      throw err;
    }

    const json = (await res.json()) as any;
    const first = json?.results?.[0];
    return typeof first?.id === 'number' ? first.id : null;
  }

  async getSimilarMovies(movieId: number): Promise<TmdbMovieListItem[]> {
    const url = new URL(`${TMDB_BASE_URL}/movie/${movieId}/similar`);
    url.searchParams.set('api_key', this.apiKey);

    let res: Response;
    try {
      res = await fetch(url.toString());
    } catch {
      const err: any = new Error('TMDb similar request failed (network error)');
      err.status = 502;
      throw err;
    }
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        const err: any = new Error('TMDb auth failed. Check TMDB_API_KEY in services/api/.env');
        err.status = 502;
        throw err;
      }
      const err: any = new Error(`TMDb similar error: ${res.status}`);
      err.status = 502;
      throw err;
    }

    const json = (await res.json()) as any;
    const results = Array.isArray(json?.results) ? json.results : [];
    return results
      .filter((r: any) => typeof r?.id === 'number' && typeof r?.title === 'string')
      .map((r: any) => ({
        id: r.id as number,
        title: r.title as string,
        overview: typeof r?.overview === 'string' ? r.overview : undefined,
        release_date: typeof r?.release_date === 'string' ? r.release_date : undefined,
      }));
  }
}
