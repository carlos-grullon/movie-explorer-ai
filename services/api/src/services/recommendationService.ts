import fs from 'node:fs';
import path from 'node:path';

import { z } from 'zod';

import { createOpenAiClient } from '../openai/openaiClient';
import { TmdbClient } from '../tmdb/tmdbClient';

const RecommendationItemSchema = z.object({
  title: z.string().min(1),
  year: z.string().optional(),
  reason: z.string().optional(),
});

const RecommendationsSchema = z.object({
  recommendations: z.array(RecommendationItemSchema).max(5),
});

export type Recommendation = z.infer<typeof RecommendationItemSchema> & {
  tmdbMovieId: number | null;
  posterPath?: string | null;
};

export type RecommendationsResult = {
  recommendations: Recommendation[];
  source: 'openai' | 'tmdb';
};

type CacheEntry = {
  expiresAt: number;
  value: RecommendationsResult;
};

const cache = new Map<number, CacheEntry>();

function cacheTtlMs(): number {
  const v = Number(process.env.RECOMMENDATIONS_CACHE_TTL_SECONDS || 6 * 60 * 60);
  if (!Number.isFinite(v) || v <= 0) return 0;
  return v * 1000;
}

function cacheGet(movieId: number): RecommendationsResult | null {
  const entry = cache.get(movieId);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    cache.delete(movieId);
    return null;
  }
  return entry.value;
}

function cacheSet(movieId: number, value: RecommendationsResult) {
  const ttl = cacheTtlMs();
  if (!ttl) return;
  cache.set(movieId, { expiresAt: Date.now() + ttl, value });
}

function envFlag(name: string): boolean {
  const v = process.env[name];
  if (!v) return false;
  return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());
}

function ensureDir(dir: string) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    // ignore
  }
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…[truncated ${s.length - max} chars]`;
}

function logOpenAiExchange(entry: {
  phase: 'before' | 'after';
  movieId: number;
  model: string;
  prompt?: string;
  response?: string;
}) {
  if (!envFlag('API_LOG_OPENAI')) return;

  const baseDir = process.env.API_LOG_DIR || path.join(process.cwd(), '.logs');
  const configured = process.env.API_LOG_OPENAI_FILE;
  const filePath = configured
    ? path.isAbsolute(configured)
      ? configured
      : path.join(baseDir, configured)
    : path.join(baseDir, 'openai.log');

  ensureDir(path.dirname(filePath));

  const maxChars = Number(process.env.API_LOG_OPENAI_MAX_CHARS || 8000);
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    phase: entry.phase,
    movieId: entry.movieId,
    model: entry.model,
    prompt: entry.prompt ? truncate(entry.prompt, maxChars) : undefined,
    response: entry.response ? truncate(entry.response, maxChars) : undefined,
  });

  try {
    fs.appendFileSync(filePath, `${line}\n`, 'utf8');
  } catch {
    // ignore
  }
}

export class RecommendationService {
  async getRecommendations(movieId: number): Promise<RecommendationsResult> {
    const cached = cacheGet(movieId);
    if (cached) return cached;

    const tmdb = new TmdbClient();
    let openai: ReturnType<typeof createOpenAiClient> | null = null;
    try {
      openai = createOpenAiClient();
    } catch {
      openai = null;
    }

    const details = await tmdb.getMovieDetails(movieId);

    const title = details.title;
    const year = details.release_date?.slice(0, 4);
    const overview = details.overview ?? '';
    const genres = (details.genres ?? []).map((g) => g.name).join(', ');

    const prompt =
      `You are a movie recommender. Return JSON only. ` +
      `Recommend up to 5 movies similar in vibe/theme to: ${title} (${year ?? 'n/a'}). ` +
      `Genres: ${genres || 'n/a'}. Overview: ${overview || 'n/a'}. ` +
      `Return exactly this shape: {"recommendations":[{"title":"...","year":"YYYY","reason":"short"}]}. ` +
      `Do not include markdown or extra keys.`;

    if (!openai) {
      const similar = await tmdb.getSimilarMovies(movieId);
      const result: RecommendationsResult = {
        source: 'tmdb',
        recommendations: similar
          .slice(0, 5)
          .map((m) => ({
            title: m.title,
            year: m.release_date?.slice(0, 4),
            reason: 'Similar on TMDb.',
            tmdbMovieId: m.id,
            posterPath: (m as any)?.poster_path ?? null,
          })),
      };

      cacheSet(movieId, result);
      return result;
    }

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    logOpenAiExchange({ phase: 'before', movieId, model, prompt });

    let response: any;
    try {
      response = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 350,
      });
    } catch (e: any) {
      const status = typeof e?.status === 'number' ? e.status : undefined;
      if (status === 401) {
        const similar = await tmdb.getSimilarMovies(movieId);
        return {
          source: 'tmdb',
          recommendations: similar
            .slice(0, 5)
            .map((m) => ({
              title: m.title,
              year: m.release_date?.slice(0, 4),
              reason: 'Similar on TMDb.',
              tmdbMovieId: m.id,
            })),
        };
      }
      throw e;
    }

    const content = response.choices?.[0]?.message?.content ?? '';
    logOpenAiExchange({ phase: 'after', movieId, model, response: content });

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      // If OpenAI returns non-JSON, fail fast (keeps behavior predictable)
      const err = new Error('AI response was not valid JSON');
      (err as any).status = 502;
      throw err;
    }

    const valid = RecommendationsSchema.parse(parsed);

    const resolved: Recommendation[] = await Promise.all(
      valid.recommendations.map(async (r) => {
        const tmdbMovieId = await tmdb.searchMovieIdByTitle(r.title, r.year);
        if (!tmdbMovieId) return { ...r, tmdbMovieId: null, posterPath: null };
        try {
          const m = await tmdb.getMovieDetails(tmdbMovieId);
          return { ...r, tmdbMovieId, posterPath: (m as any)?.poster_path ?? null };
        } catch {
          return { ...r, tmdbMovieId, posterPath: null };
        }
      })
    );

    const result: RecommendationsResult = { source: 'openai', recommendations: resolved.slice(0, 5) };
    cacheSet(movieId, result);
    return result;
  }
}
