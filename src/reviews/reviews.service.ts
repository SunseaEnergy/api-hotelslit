import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateReviewDto, UpdateReviewDto } from './dto/create-review.dto.js';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async findByProperty(propertyId: string) {
    return this.prisma.review.findMany({
      where: { propertyId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreateReviewDto) {
    const review = await this.prisma.review.create({
      data: {
        userId,
        propertyId: dto.propertyId,
        rating: dto.rating,
        comment: dto.comment,
      },
    });
    await this.recalculateRating(dto.propertyId);
    return review;
  }

  async update(userId: string, reviewId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId) throw new ForbiddenException('Not your review');

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: dto,
    });
    await this.recalculateRating(review.propertyId);
    return updated;
  }

  async delete(userId: string, reviewId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId) throw new ForbiddenException('Not your review');

    await this.prisma.review.delete({ where: { id: reviewId } });
    await this.recalculateRating(review.propertyId);
    return { message: 'Review deleted' };
  }

  private async recalculateRating(propertyId: string) {
    const result = await this.prisma.review.aggregate({
      where: { propertyId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        rating: result._avg.rating || 0,
        totalRatings: result._count.rating,
      },
    });
  }
}
