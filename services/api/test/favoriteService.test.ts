import { FavoriteService } from '../src/services/favoriteService';

type Favorite = {
  id: string;
  userId: string;
  tmdbMovieId: number;
  title: string;
  releaseDate?: string | null;
  posterPath?: string | null;
  customTitle?: string | null;
  personalNotes?: string | null;
};

type CreateInput = {
  userId: string;
  tmdbMovieId: number;
  title: string;
  releaseDate?: string;
  posterPath?: string;
  customTitle?: string;
  personalNotes?: string;
};

type UpdateInput = {
  personalNotes?: string | null;
  customTitle?: string | null;
};

class FakeFavoriteRepository {
  private items: Favorite[] = [];

  async listByUserId(userId: string): Promise<Favorite[]> {
    return this.items.filter((i) => i.userId === userId);
  }

  async create(data: any): Promise<Favorite> {
    const exists = this.items.some(
      (i) => i.userId === data.userId && i.tmdbMovieId === data.tmdbMovieId
    );
    if (exists) {
      const err: any = new Error('Unique constraint');
      err.code = 'P2002';
      throw err;
    }

    const created: Favorite = {
      id: `fav_${this.items.length + 1}`,
      userId: data.userId,
      tmdbMovieId: data.tmdbMovieId,
      title: data.title,
      releaseDate: data.releaseDate ?? null,
      posterPath: data.posterPath ?? null,
      customTitle: data.customTitle ?? null,
      personalNotes: data.personalNotes ?? null,
    };
    this.items.push(created);
    return created;
  }

  async findById(id: string): Promise<Favorite | null> {
    return this.items.find((i) => i.id === id) ?? null;
  }

  async updateById(id: string, data: any): Promise<Favorite> {
    const idx = this.items.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error('not found');
    const prev = this.items[idx];
    const next: Favorite = {
      ...prev,
      customTitle:
        Object.prototype.hasOwnProperty.call(data, 'customTitle') ? data.customTitle : prev.customTitle,
      personalNotes:
        Object.prototype.hasOwnProperty.call(data, 'personalNotes') ? data.personalNotes : prev.personalNotes,
    };
    this.items[idx] = next;
    return next;
  }

  async deleteById(id: string): Promise<void> {
    this.items = this.items.filter((i) => i.id !== id);
  }
}

describe('FavoriteService', () => {
  it('adds and lists favorites per user', async () => {
    const repo = new FakeFavoriteRepository();
    const service = new FavoriteService(repo as any);

    await service.add('u1', { tmdbMovieId: 1, title: 'A' } as any);
    await service.add('u2', { tmdbMovieId: 2, title: 'B' } as any);

    const u1 = await service.list('u1');
    expect(u1).toHaveLength(1);
    expect(u1[0].title).toBe('A');
  });

  it('returns 409 when adding duplicate favorite for same user', async () => {
    const repo = new FakeFavoriteRepository();
    const service = new FavoriteService(repo as any);

    await service.add('u1', { tmdbMovieId: 1, title: 'A' } as any);

    await expect(service.add('u1', { tmdbMovieId: 1, title: 'A' } as any)).rejects.toMatchObject({
      status: 409,
    });
  });

  it('prevents updating favorites of another user', async () => {
    const repo = new FakeFavoriteRepository();
    const service = new FavoriteService(repo as any);

    const fav = await service.add('u1', { tmdbMovieId: 1, title: 'A' } as any);

    await expect(service.update('u2', fav.id, { personalNotes: 'x' })).rejects.toMatchObject({
      status: 404,
    });
  });

  it('updates personalNotes/customTitle', async () => {
    const repo = new FakeFavoriteRepository();
    const service = new FavoriteService(repo as any);

    const fav = await service.add('u1', { tmdbMovieId: 1, title: 'A' } as any);

    const updated = await service.update('u1', fav.id, { personalNotes: 'great', customTitle: 'My A' });
    expect(updated.personalNotes).toBe('great');
    expect(updated.customTitle).toBe('My A');
  });
});
