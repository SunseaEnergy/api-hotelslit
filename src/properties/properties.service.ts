import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { UpdatePropertyDto } from './dto/update-property.dto.js';
import { QueryPropertiesDto } from './dto/query-properties.dto.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  // ─── PUBLIC (User App) ─────────────────────────────────

  async findAll(query: QueryPropertiesDto) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const skip = (page - 1) * limit;

    const where: Prisma.PropertyWhereInput = { isActive: true };

    if (query.category) where.category = query.category;
    if (query.area) where.area = { contains: query.area, mode: 'insensitive' };
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { address: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    if (query.sortBy === 'rating') orderBy.rating = query.sortOrder || 'desc';
    else if (query.sortBy === 'createdAt') orderBy.createdAt = query.sortOrder || 'desc';
    else orderBy.createdAt = 'desc';

    const [data, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          images: { orderBy: { order: 'asc' }, take: 5 },
          rooms: {
            orderBy: { price: 'asc' },
            take: 1,
            where: { available: true },
          },
          _count: { select: { rooms: true } },
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    const mapped = data.map((p) => {
      const cheapestRoom = p.rooms[0];
      return {
        id: p.id,
        name: p.name,
        image: p.images[0]?.url || null,
        images: p.images.map((i) => i.url),
        rating: p.rating,
        address: p.address,
        area: p.area,
        category: p.category,
        beds: cheapestRoom?.beds || 0,
        baths: cheapestRoom?.baths || 0,
        type: cheapestRoom?.type || '',
        bedType: cheapestRoom?.bedType || '',
        price: cheapestRoom?.price || 0,
        priceNote: cheapestRoom?.priceNote || '',
        available: p._count.rooms > 0,
        roomsLeft: p._count.rooms,
      };
    });

    // Filter by price if needed
    let filtered = mapped;
    if (query.minPrice) filtered = filtered.filter((p) => p.price >= parseFloat(query.minPrice!));
    if (query.maxPrice) filtered = filtered.filter((p) => p.price <= parseFloat(query.maxPrice!));

    if (query.sortBy === 'price') {
      filtered.sort((a, b) =>
        query.sortOrder === 'desc' ? b.price - a.price : a.price - b.price,
      );
    }

    return {
      data: filtered,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id, isActive: true },
      include: {
        images: { orderBy: { order: 'asc' } },
        gallery: { orderBy: { order: 'asc' } },
        rooms: { include: { images: { orderBy: { order: 'asc' } } } },
        amenities: { include: { amenity: { include: { category: true } } } },
        _count: { select: { rooms: true, reviews: true } },
      },
    });
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async getGallery(propertyId: string) {
    return this.prisma.galleryImage.findMany({
      where: { propertyId },
      orderBy: { order: 'asc' },
    });
  }

  async getAmenities(propertyId: string) {
    const amenities = await this.prisma.propertyAmenity.findMany({
      where: { propertyId, enabled: true },
      include: { amenity: { include: { category: true } } },
    });

    // Group by category
    const grouped: Record<string, any> = {};
    for (const pa of amenities) {
      const catId = pa.amenity.category.id;
      if (!grouped[catId]) {
        grouped[catId] = {
          id: pa.amenity.category.id,
          title: pa.amenity.category.title,
          icon: pa.amenity.category.icon,
          items: [],
        };
      }
      grouped[catId].items.push({
        id: pa.amenity.id,
        name: pa.amenity.name,
        icon: pa.amenity.icon,
        enabled: pa.enabled,
      });
    }

    return Object.values(grouped);
  }

  // ─── VENDOR ─────────────────────────────────────────────

  async findVendorProperties(vendorId: string) {
    return this.prisma.property.findMany({
      where: { vendorId },
      include: {
        images: { orderBy: { order: 'asc' }, take: 1 },
        _count: { select: { rooms: true, bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProperty(vendorId: string, dto: CreatePropertyDto) {
    return this.prisma.property.create({
      data: { ...dto, vendorId },
      include: { images: true },
    });
  }

  async findVendorProperty(vendorId: string, propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        images: { orderBy: { order: 'asc' } },
        gallery: { orderBy: { order: 'asc' } },
        rooms: { include: { images: { orderBy: { order: 'asc' } } } },
        amenities: { include: { amenity: { include: { category: true } } } },
        _count: { select: { rooms: true, bookings: true } },
      },
    });
    if (!property) throw new NotFoundException('Property not found');
    if (property.vendorId !== vendorId)
      throw new ForbiddenException('Not your property');
    return property;
  }

  async updateProperty(vendorId: string, propertyId: string, dto: UpdatePropertyDto) {
    await this.verifyOwnership(vendorId, propertyId);
    return this.prisma.property.update({
      where: { id: propertyId },
      data: dto,
    });
  }

  async deleteProperty(vendorId: string, propertyId: string) {
    await this.verifyOwnership(vendorId, propertyId);
    return this.prisma.property.update({
      where: { id: propertyId },
      data: { isActive: false },
    });
  }

  async addPropertyImages(vendorId: string, propertyId: string, urls: string[]) {
    await this.verifyOwnership(vendorId, propertyId);
    const currentMax = await this.prisma.propertyImage.aggregate({
      where: { propertyId },
      _max: { order: true },
    });
    const startOrder = (currentMax._max.order || 0) + 1;

    return this.prisma.propertyImage.createMany({
      data: urls.map((url, i) => ({
        propertyId,
        url,
        order: startOrder + i,
      })),
    });
  }

  async removePropertyImage(vendorId: string, propertyId: string, imageId: string) {
    await this.verifyOwnership(vendorId, propertyId);
    return this.prisma.propertyImage.delete({ where: { id: imageId } });
  }

  async addGalleryImages(
    vendorId: string,
    propertyId: string,
    images: { url: string; label: string }[],
  ) {
    await this.verifyOwnership(vendorId, propertyId);
    const currentMax = await this.prisma.galleryImage.aggregate({
      where: { propertyId },
      _max: { order: true },
    });
    const startOrder = (currentMax._max.order || 0) + 1;

    return this.prisma.galleryImage.createMany({
      data: images.map((img, i) => ({
        propertyId,
        url: img.url,
        label: img.label,
        order: startOrder + i,
      })),
    });
  }

  async removeGalleryImage(vendorId: string, propertyId: string, imageId: string) {
    await this.verifyOwnership(vendorId, propertyId);
    return this.prisma.galleryImage.delete({ where: { id: imageId } });
  }

  private async verifyOwnership(vendorId: string, propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property) throw new NotFoundException('Property not found');
    if (property.vendorId !== vendorId)
      throw new ForbiddenException('Not your property');
    return property;
  }
}
