import type { Favorite } from '@prisma/client';

import { FavoriteRepository } from '../repositories/favoriteRepository';

export class FavoriteService {
  constructor(private readonly repo: FavoriteRepository) {}

  list(userId: string): Promise<Favorite[]> {
    return this.repo.listByUserId(userId);
  }

  async add(userId: string, input: { tmdbMovieId: number; title: string; releaseDate?: string; posterPath?: string; personalNotes?: string; customTitle?: string; }): Promise<Favorite> {
    try {
      return await this.repo.create({
        userId,
        tmdbMovieId: input.tmdbMovieId,
        title: input.title,
        releaseDate: input.releaseDate,
        posterPath: input.posterPath,
        personalNotes: input.personalNotes,
        customTitle: input.customTitle,
      });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        const err = new Error('Movie already in favorites');
        (err as any).status = 409;
        throw err;
      }
      throw e;
    }
  }

  async update(userId: string, id: string, input: { personalNotes?: string | null; customTitle?: string | null; }): Promise<Favorite> {
    const existing = await this.repo.findById(id);
    if (!existing || existing.userId !== userId) {
      const err = new Error('Favorite not found');
      (err as any).status = 404;
      throw err;
    }

    return this.repo.updateById(id, {
      personalNotes: input.personalNotes,
      customTitle: input.customTitle,
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing || existing.userId !== userId) {
      const err = new Error('Favorite not found');
      (err as any).status = 404;
      throw err;
    }

    await this.repo.deleteById(id);
  }
}
