import type { Favorite, Prisma } from '@prisma/client';

import { prisma } from '../prismaClient';

export class FavoriteRepository {
  async listByUserId(userId: string): Promise<Favorite[]> {
    return prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Prisma.FavoriteCreateInput): Promise<Favorite> {
    return prisma.favorite.create({ data });
  }

  async findById(id: string): Promise<Favorite | null> {
    return prisma.favorite.findUnique({ where: { id } });
  }

  async updateById(id: string, data: Prisma.FavoriteUpdateInput): Promise<Favorite> {
    return prisma.favorite.update({ where: { id }, data });
  }

  async deleteById(id: string): Promise<void> {
    await prisma.favorite.delete({ where: { id } });
  }
}
