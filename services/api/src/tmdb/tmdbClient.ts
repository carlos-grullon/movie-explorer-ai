import { MOCK_MOVIES, MockMovie } from './mockData';

export type TmdbMovieDetails = {
  id: number;
  title: string;
  overview?: string;
  release_date?: string;
  poster_path?: string;
  genres?: Array<{ id: number; name: string }>;
};

export type TmdbMovieListItem = {
  id: number;
  title: string;
  overview?: string;
  release_date?: string;
  poster_path?: string;
  genre_ids?: number[];
};

export type TmdbPagedResponse<T> = {
  page: number;
  results: T[];
  total_pages?: number;
  total_results?: number;
};

function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    if (name === 'TMDB_API_KEY') return ''; // Allow empty if we might use mock
    const err: any = new Error(`Missing environment variable: ${name}`);
    err.status = 500;
    throw err;
  }
  return v;
}

function isMockEnabled(): boolean {
  return process.env.TMDB_MOCK === 'true' || !process.env.TMDB_API_KEY;
}

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export class TmdbClient {
  private readonly apiKey: string;

  constructor() {
    this.apiKey = mustGetEnv('TMDB_API_KEY');
  }

  private async fetchJson(url: URL, authErrorMessage: string, genericErrorPrefix: string): Promise<any> {
    let res: Response;
    try {
      res = await fetch(url.toString());
    } catch {
      const err: any = new Error(`${genericErrorPrefix} (network error)`);
      err.status = 502;
      throw err;
    }
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        const err: any = new Error(authErrorMessage);
        err.status = 502;
        throw err;
      }
      const err: any = new Error(`${genericErrorPrefix}: ${res.status}`);
      err.status = 502;
      throw err;
    }
    return (await res.json()) as any;
  }

  private mapMovieListItems(json: any): TmdbMovieListItem[] {
    const results = Array.isArray(json?.results) ? json.results : [];
    return results
      .filter((r: any) => typeof r?.id === 'number' && typeof r?.title === 'string')
      .map((r: any) => ({
        id: r.id as number,
        title: r.title as string,
        overview: typeof r?.overview === 'string' ? r.overview : undefined,
        release_date: typeof r?.release_date === 'string' ? r.release_date : undefined,
        poster_path: typeof r?.poster_path === 'string' ? r.poster_path : undefined,
        genre_ids: Array.isArray(r.genre_ids) ? r.genre_ids : undefined,
      }));
  }

  // --- Mock Helpers ---

  private getMockMovies(page: number, filter?: (m: MockMovie) => boolean): TmdbPagedResponse<TmdbMovieListItem> {
    let filtered = MOCK_MOVIES;
    if (filter) {
      filtered = filtered.filter(filter);
    }

    const pageSize = 20;
    const total_results = filtered.length;
    const total_pages = Math.max(1, Math.ceil(total_results / pageSize));
    const safePage = Number.isFinite(page) && page > 0 ? Math.min(page, total_pages) : 1;
    const start = (safePage - 1) * pageSize;
    const results = filtered.slice(start, start + pageSize).map((m) => ({
      id: m.id,
      title: m.title,
      overview: m.overview,
      release_date: m.release_date,
      poster_path: m.poster_path,
      genre_ids: m.genres.map((g) => g.id),
    }));

    return { page: safePage, results, total_pages, total_results };
  }

  // --- Public Methods ---

  async getTrendingMovies(page = 1): Promise<TmdbPagedResponse<TmdbMovieListItem>> {
    if (isMockEnabled()) {
      return this.getMockMovies(page);
    }

    const url = new URL(`${TMDB_BASE_URL}/trending/movie/week`);
    url.searchParams.set('api_key', this.apiKey);
    url.searchParams.set('page', String(page));

    const json = await this.fetchJson(
      url,
      'TMDb auth failed. Check TMDB_API_KEY in services/api/.env',
      'TMDb trending error'
    );

    return {
      page: typeof json?.page === 'number' ? json.page : page,
      results: this.mapMovieListItems(json),
      total_pages: typeof json?.total_pages === 'number' ? json.total_pages : undefined,
      total_results: typeof json?.total_results === 'number' ? json.total_results : undefined,
    };
  }

  async searchMovies(
    query: string,
    page = 1,
    opts?: { year?: number; genreIds?: number[] }
  ): Promise<TmdbPagedResponse<TmdbMovieListItem>> {
    const targetPage = Number.isFinite(page) && page > 0 ? page : 1;
    const genreIds = Array.isArray(opts?.genreIds) ? opts.genreIds.filter((n) => Number.isFinite(n)) : [];
    const hasGenreFilter = genreIds.length > 0;

    const parseYear = (date?: string): number | null => {
      if (!date || typeof date !== 'string' || date.length < 4) return null;
      const y = Number(date.slice(0, 4));
      return Number.isFinite(y) ? y : null;
    };

    const filterByGenre = (items: TmdbMovieListItem[]) => {
      if (!hasGenreFilter) return items;
      return items.filter((m) => Array.isArray(m.genre_ids) && m.genre_ids.some((g) => genreIds.includes(g)));
    };

    const sortByYearCloseness = (items: TmdbMovieListItem[], targetYear: number) => {
      return [...items].sort((a, b) => {
        const ay = parseYear(a.release_date) ?? Number.MAX_SAFE_INTEGER;
        const by = parseYear(b.release_date) ?? Number.MAX_SAFE_INTEGER;
        const diffA = Math.abs(ay - targetYear);
        const diffB = Math.abs(by - targetYear);
        if (diffA !== diffB) return diffA - diffB;
        return (a.title || '').localeCompare(b.title || '');
      });
    };

    if (isMockEnabled()) {
      const q = query.trim().toLowerCase();
      const matches = MOCK_MOVIES.filter((m) => `${m.title} ${m.overview}`.toLowerCase().includes(q));

      const toListItem = (m: MockMovie): TmdbMovieListItem => ({
        id: m.id,
        title: m.title,
        overview: m.overview,
        release_date: m.release_date,
        poster_path: m.poster_path,
        genre_ids: m.genres.map((g) => g.id),
      });

      const applyFilters = (list: MockMovie[], year?: number) => {
        let filtered = list;
        if (year) filtered = filtered.filter((m) => m.release_date.startsWith(String(year)));
        if (hasGenreFilter) filtered = filtered.filter((m) => m.genres.some((g) => genreIds.includes(g.id)));
        return filtered;
      };

      let filtered = applyFilters(matches, opts?.year);
      if (opts?.year && filtered.length === 0) {
        const withoutYear = applyFilters(matches, undefined).map(toListItem);
        const sorted = sortByYearCloseness(withoutYear, opts.year);

        const pageSize = 20;
        const total_results = sorted.length;
        const total_pages = Math.max(1, Math.ceil(total_results / pageSize));
        const safePage = Math.min(targetPage, total_pages);
        const start = (safePage - 1) * pageSize;

        return {
          page: safePage,
          results: sorted.slice(start, start + pageSize),
          total_pages,
          total_results,
        };
      }

      const listToPaginate = filtered.map(toListItem);

      const pageSize = 20;
      const total_results = listToPaginate.length;
      const total_pages = Math.max(1, Math.ceil(total_results / pageSize));
      const safePage = Math.min(targetPage, total_pages);
      const start = (safePage - 1) * pageSize;
      const results = listToPaginate.slice(start, start + pageSize);

      return { page: safePage, results, total_pages, total_results };
    }

    const buildUrl = (year?: number) => {
      const url = new URL(`${TMDB_BASE_URL}/search/movie`);
      url.searchParams.set('api_key', this.apiKey);
      url.searchParams.set('include_adult', 'false');
      url.searchParams.set('query', query);
      url.searchParams.set('page', String(targetPage));
      if (year) url.searchParams.set('year', String(year));
      return url;
    };

    const searchOnce = async (year?: number) => {
      const url = buildUrl(year);
      const json = await this.fetchJson(
        url,
        'TMDb auth failed. Check TMDB_API_KEY in services/api/.env',
        'TMDb search error'
      );

      return {
        page: typeof json?.page === 'number' ? json.page : targetPage,
        results: this.mapMovieListItems(json),
        total_pages: typeof json?.total_pages === 'number' ? json.total_pages : undefined,
        total_results: typeof json?.total_results === 'number' ? json.total_results : undefined,
      };
    };

    const initial = await searchOnce(opts?.year);
    const initialFiltered = filterByGenre(initial.results);

    if (!opts?.year || initialFiltered.length > 0) {
      return { ...initial, results: initialFiltered };
    }

    // Fallback: no results for that year, fetch without year and return closest year matches
    const fallback = await searchOnce(undefined);
    const fallbackFiltered = filterByGenre(fallback.results);

    if (!fallbackFiltered.length) {
      return { page: 1, results: [], total_pages: 0, total_results: 0 };
    }

    const sorted = sortByYearCloseness(fallbackFiltered, opts.year);
    const pageSize = 20;
    const total_results = sorted.length;
    const total_pages = Math.max(1, Math.ceil(total_results / pageSize));
    const safePage = Math.min(targetPage, total_pages);
    const start = (safePage - 1) * pageSize;

    return {
      page: safePage,
      results: sorted.slice(start, start + pageSize),
      total_pages,
      total_results,
    };
  }

  async getMovieDetails(movieId: number): Promise<TmdbMovieDetails> {
    if (isMockEnabled()) {
      const found = MOCK_MOVIES.find((m) => m.id === movieId);
      if (!found) {
        const err: any = new Error(`Movie not found (mock): ${movieId}`);
        err.status = 404;
        throw err;
      }
      return found;
    }

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
    if (isMockEnabled()) {
       const q = title.trim().toLowerCase();
       const found = MOCK_MOVIES.find((m) => m.title.toLowerCase() === q);
       return found ? found.id : null;
    }

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

  async getGenres(): Promise<Array<{ id: number; name: string }>> {
    if (isMockEnabled()) {
      const allGenres = MOCK_MOVIES.flatMap(m => m.genres || []);
      const unique = new Map(allGenres.map(g => [g.id, g]));
      return Array.from(unique.values());
    }

    const url = new URL(`${TMDB_BASE_URL}/genre/movie/list`);
    url.searchParams.set('api_key', this.apiKey);
    url.searchParams.set('language', 'en-US');

    const json = await this.fetchJson(
      url,
      'TMDb auth failed. Check TMDB_API_KEY in services/api/.env',
      'TMDb genres error'
    );

    return Array.isArray(json?.genres) ? json.genres : [];
  }

  async discoverMovies(opts: {
    page?: number;
    year?: number;
    genreIds?: number[];
  }): Promise<TmdbPagedResponse<TmdbMovieListItem>> {
    if (isMockEnabled()) {
      return this.getMockMovies(opts.page ?? 1, (m) => {
        if (opts.year && !m.release_date.startsWith(String(opts.year))) return false;
        if (opts.genreIds?.length && !m.genres.some(g => opts.genreIds!.includes(g.id))) return false;
        return true;
      });
    }

    const url = new URL(`${TMDB_BASE_URL}/discover/movie`);
    url.searchParams.set('api_key', this.apiKey);
    url.searchParams.set('language', 'en-US');
    url.searchParams.set('sort_by', 'popularity.desc');
    url.searchParams.set('include_adult', 'false');

    if (opts.page) url.searchParams.set('page', String(opts.page));
    if (opts.year) url.searchParams.set('primary_release_year', String(opts.year));
    if (opts.genreIds?.length) url.searchParams.set('with_genres', opts.genreIds.join(','));

    const json = await this.fetchJson(
      url,
      'TMDb auth failed. Check TMDB_API_KEY in services/api/.env',
      'TMDb discover error'
    );

    return {
      page: typeof json?.page === 'number' ? json.page : (opts.page ?? 1),
      results: this.mapMovieListItems(json),
      total_pages: typeof json?.total_pages === 'number' ? json.total_pages : undefined,
      total_results: typeof json?.total_results === 'number' ? json.total_results : undefined,
    };
  }

  async getSimilarMovies(movieId: number): Promise<TmdbMovieListItem[]> {
    if (isMockEnabled()) {
      // Just return other mock movies as similar
      return MOCK_MOVIES.filter(m => m.id !== movieId).map(m => ({
        id: m.id,
        title: m.title,
        overview: m.overview,
        release_date: m.release_date,
        poster_path: m.poster_path,
      }));
    }

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
