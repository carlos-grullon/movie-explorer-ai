import { Router } from 'express';
import { z } from 'zod';

import { TmdbClient } from '../tmdb/tmdbClient';

export const tmdbRouter = Router();

const client = new TmdbClient();

tmdbRouter.get('/trending', async (req, res, next) => {
  try {
    const page = z.coerce.number().int().positive().optional().parse(req.query.page);
    const result = await client.getTrendingMovies(page ?? 1);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

tmdbRouter.get('/search', async (req, res, next) => {
  try {
    const query = z.string().min(1).parse(req.query.query);
    const page = z.coerce.number().int().positive().optional().parse(req.query.page);
    const year = z.coerce.number().int().optional().parse(req.query.year);
    const rawGenres = typeof req.query.genreIds === 'string' ? req.query.genreIds : typeof req.query.genres === 'string' ? req.query.genres : undefined;
    const genreIds = rawGenres
      ? z
          .string()
          .transform((s) => s.split(',').map(Number))
          .parse(rawGenres)
      : undefined;

    const result = await client.searchMovies(query, page ?? 1, { year, genreIds });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

tmdbRouter.get('/genres', async (_req, res, next) => {
  try {
    const genres = await client.getGenres();
    res.json({ genres });
  } catch (e) {
    next(e);
  }
});

tmdbRouter.get('/discover', async (req, res, next) => {
  try {
    const page = z.coerce.number().int().positive().optional().parse(req.query.page);
    const year = z.coerce.number().int().optional().parse(req.query.year);
    const rawGenres = typeof req.query.genreIds === 'string' ? req.query.genreIds : typeof req.query.genres === 'string' ? req.query.genres : undefined;
    const genreIds = rawGenres
      ? z
          .string()
          .transform((s) => s.split(',').map(Number))
          .parse(rawGenres)
      : undefined;

    const result = await client.discoverMovies({ page, year, genreIds });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

tmdbRouter.get('/movie/:id', async (req, res, next) => {
  try {
    const movieId = z.coerce.number().int().positive().parse(req.params.id);
    const result = await client.getMovieDetails(movieId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});
