import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { BulkSetAmenitiesDto } from './dto/toggle-amenity.dto.js';

@Injectable()
export class AmenitiesService {
  constructor(private prisma: PrismaService) {}

  async findAllCategories() {
    return this.prisma.amenityCategory.findMany({
      include: { items: true },
      orderBy: { order: 'asc' },
    });
  }

  async findPropertyAmenities(propertyId: string) {
    const amenities = await this.prisma.propertyAmenity.findMany({
      where: { propertyId },
      include: { amenity: { include: { category: true } } },
    });

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

  async bulkSetAmenities(vendorId: string, propertyId: string, dto: BulkSetAmenitiesDto) {
    await this.verifyOwnership(vendorId, propertyId);

    const operations = dto.amenities.map((item) =>
      this.prisma.propertyAmenity.upsert({
        where: {
          propertyId_amenityId: { propertyId, amenityId: item.amenityItemId },
        },
        create: {
          propertyId,
          amenityId: item.amenityItemId,
          enabled: item.enabled,
        },
        update: { enabled: item.enabled },
      }),
    );

    await this.prisma.$transaction(operations);
    return { message: 'Amenities updated' };
  }

  async toggleAmenity(vendorId: string, propertyId: string, amenityItemId: string, enabled: boolean) {
    await this.verifyOwnership(vendorId, propertyId);

    return this.prisma.propertyAmenity.upsert({
      where: {
        propertyId_amenityId: { propertyId, amenityId: amenityItemId },
      },
      create: { propertyId, amenityId: amenityItemId, enabled },
      update: { enabled },
    });
  }

  private async verifyOwnership(vendorId: string, propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property) throw new NotFoundException('Property not found');
    if (property.vendorId !== vendorId)
      throw new ForbiddenException('Not your property');
  }
}
