import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateRoomDto } from './dto/create-room.dto.js';
import { UpdateRoomDto } from './dto/update-room.dto.js';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  // ─── PUBLIC ────────────────────────────────────────────

  async findByProperty(propertyId: string, query: any) {
    const where: any = { propertyId };
    if (query.available !== undefined) where.available = query.available === 'true';
    if (query.maxGuests) where.maxGuests = { gte: parseInt(query.maxGuests) };
    if (query.minPrice) where.price = { ...where.price, gte: parseFloat(query.minPrice) };
    if (query.maxPrice) where.price = { ...where.price, lte: parseFloat(query.maxPrice) };

    const rooms = await this.prisma.room.findMany({
      where,
      include: { images: { orderBy: { order: 'asc' } } },
      orderBy: { price: 'asc' },
    });

    return rooms.map((r) => ({
      ...r,
      image: r.images[0]?.url || null,
      images: r.images.map((i) => i.url),
    }));
  }

  async findOne(propertyId: string, roomId: string) {
    const room = await this.prisma.room.findFirst({
      where: { id: roomId, propertyId },
      include: { images: { orderBy: { order: 'asc' } } },
    });
    if (!room) throw new NotFoundException('Room not found');
    return { ...room, image: room.images[0]?.url || null, images: room.images.map((i) => i.url) };
  }

  // ─── VENDOR ─────────────────────────────────────────────

  async findVendorRooms(vendorId: string, propertyId: string) {
    await this.verifyOwnership(vendorId, propertyId);
    const rooms = await this.prisma.room.findMany({
      where: { propertyId },
      include: { images: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return rooms.map((r) => ({
      ...r,
      image: r.images[0]?.url || null,
      images: r.images.map((i) => i.url),
    }));
  }

  async createRoom(vendorId: string, propertyId: string, dto: CreateRoomDto) {
    await this.verifyOwnership(vendorId, propertyId);
    return this.prisma.room.create({
      data: { ...dto, propertyId },
      include: { images: true },
    });
  }

  async findVendorRoom(vendorId: string, propertyId: string, roomId: string) {
    await this.verifyOwnership(vendorId, propertyId);
    const room = await this.prisma.room.findFirst({
      where: { id: roomId, propertyId },
      include: { images: { orderBy: { order: 'asc' } } },
    });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async updateRoom(vendorId: string, propertyId: string, roomId: string, dto: UpdateRoomDto) {
    await this.verifyOwnership(vendorId, propertyId);
    return this.prisma.room.update({
      where: { id: roomId },
      data: dto,
    });
  }

  async deleteRoom(vendorId: string, propertyId: string, roomId: string) {
    await this.verifyOwnership(vendorId, propertyId);
    return this.prisma.room.delete({ where: { id: roomId } });
  }

  async toggleAvailability(vendorId: string, propertyId: string, roomId: string, available: boolean) {
    await this.verifyOwnership(vendorId, propertyId);
    return this.prisma.room.update({
      where: { id: roomId },
      data: { available },
    });
  }

  async addRoomImages(vendorId: string, propertyId: string, roomId: string, urls: string[]) {
    await this.verifyOwnership(vendorId, propertyId);
    const currentMax = await this.prisma.roomImage.aggregate({
      where: { roomId },
      _max: { order: true },
    });
    const startOrder = (currentMax._max.order || 0) + 1;
    return this.prisma.roomImage.createMany({
      data: urls.map((url, i) => ({ roomId, url, order: startOrder + i })),
    });
  }

  async removeRoomImage(vendorId: string, propertyId: string, _roomId: string, imageId: string) {
    await this.verifyOwnership(vendorId, propertyId);
    return this.prisma.roomImage.delete({ where: { id: imageId } });
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
