import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      include: {
        property: {
          include: {
            gallery: { orderBy: { order: 'asc' } },
            rooms: { orderBy: { price: 'asc' }, where: { available: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return favorites.map((f) => ({
      id: f.id,
      propertyId: f.property.id,
      createdAt: f.createdAt,
      property: {
        id: f.property.id,
        vendorId: f.property.vendorId,
        name: f.property.name,
        address: f.property.address,
        area: f.property.area,
        description: f.property.description,
        category: f.property.category,
        rating: f.property.rating,
        totalRatings: f.property.totalRatings,
        isActive: f.property.isActive,
        images: f.property.gallery.map((g) => ({ id: g.id, url: g.url, order: g.order })),
        createdAt: f.property.createdAt,
        updatedAt: f.property.updatedAt,
      },
    }));
  }

  async add(userId: string, propertyId: string) {
    const existing = await this.prisma.favorite.findFirst({
      where: { userId, propertyId },
    });

    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      return { message: 'Removed from favorites' };
    }

    return await this.prisma.favorite.create({
      data: { userId, propertyId },
    });
  }

  async remove(userId: string, propertyId: string) {
    await this.prisma.favorite.deleteMany({
      where: { userId, propertyId },
    });
    return { message: 'Removed from favorites' };
  }
}
