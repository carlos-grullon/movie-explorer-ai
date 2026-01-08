import { Router } from 'express';
import { z } from 'zod';

import type { AuthedRequest } from '../middleware/requireAuth';
import { FavoriteRepository } from '../repositories/favoriteRepository';
import { FavoriteService } from '../services/favoriteService';

export const favoritesRouter = Router();

const service = new FavoriteService(new FavoriteRepository());

function getUserId(req: AuthedRequest): string {
  const sub = (req.auth as any)?.sub;
  if (!sub) {
    const err = new Error('Unauthorized');
    (err as any).status = 401;
    throw err;
  }
  return String(sub);
}

favoritesRouter.get('/', async (req, res, next) => {
  try {
    const userId = getUserId(req as AuthedRequest);
    const favorites = await service.list(userId);
    res.json({ favorites });
  } catch (e) {
    next(e);
  }
});

const CreateFavoriteSchema = z.object({
  tmdbMovieId: z.number().int().positive(),
  title: z.string().min(1),
  releaseDate: z.string().optional(),
  posterPath: z.string().optional(),
  customTitle: z.string().optional(),
  personalNotes: z.string().optional(),
});

favoritesRouter.post('/', async (req, res, next) => {
  try {
    const userId = getUserId(req as AuthedRequest);
    const body = CreateFavoriteSchema.parse(req.body);
    const favorite = await service.add(userId, body);
    res.status(201).json({ favorite });
  } catch (e) {
    next(e);
  }
});

const UpdateFavoriteSchema = z.object({
  customTitle: z.string().nullable().optional(),
  personalNotes: z.string().nullable().optional(),
});

favoritesRouter.put('/:id', async (req, res, next) => {
  try {
    const userId = getUserId(req as AuthedRequest);
    const id = String(req.params.id);
    const body = UpdateFavoriteSchema.parse(req.body);
    const favorite = await service.update(userId, id, body);
    res.json({ favorite });
  } catch (e) {
    next(e);
  }
});

favoritesRouter.delete('/:id', async (req, res, next) => {
  try {
    const userId = getUserId(req as AuthedRequest);
    const id = String(req.params.id);
    await service.remove(userId, id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});
