import { Injectable, ConflictException } from '@nestjs/common';
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
            images: { take: 1, orderBy: { order: 'asc' } },
            rooms: { take: 1, orderBy: { price: 'asc' }, where: { available: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return favorites.map((f) => ({
      id: f.id,
      propertyId: f.property.id,
      name: f.property.name,
      image: f.property.images[0]?.url || null,
      rating: f.property.rating,
      address: f.property.address,
      area: f.property.area,
      price: f.property.rooms[0]?.price || 0,
      priceNote: f.property.rooms[0]?.priceNote || '',
      category: f.property.category,
      createdAt: f.createdAt,
    }));
  }

  async add(userId: string, propertyId: string) {
    try {
      return await this.prisma.favorite.create({
        data: { userId, propertyId },
      });
    } catch {
      throw new ConflictException('Already in favorites');
    }
  }

  async remove(userId: string, propertyId: string) {
    await this.prisma.favorite.deleteMany({
      where: { userId, propertyId },
    });
    return { message: 'Removed from favorites' };
  }
}
