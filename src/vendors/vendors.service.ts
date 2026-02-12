import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateVendorProfileDto } from './dto/update-vendor-profile.dto.js';
import { UpdatePayoutDto } from './dto/update-payout.dto.js';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class VendorsService {
  constructor(private prisma: PrismaService) {}

  async getProfile(vendorId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      select: {
        id: true,
        businessName: true,
        email: true,
        phone: true,
        avatar: true,
        payoutActive: true,
        createdAt: true,
      },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async updateProfile(vendorId: string, dto: UpdateVendorProfileDto) {
    return this.prisma.vendor.update({
      where: { id: vendorId },
      data: dto,
      select: {
        id: true,
        businessName: true,
        email: true,
        phone: true,
        avatar: true,
      },
    });
  }

  async updateAvatar(vendorId: string, avatarUrl: string) {
    return this.prisma.vendor.update({
      where: { id: vendorId },
      data: { avatar: avatarUrl },
      select: { id: true, avatar: true },
    });
  }

  async getPayoutSettings(vendorId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      select: {
        bankName: true,
        accountNumber: true,
        accountName: true,
        payoutActive: true,
      },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async updatePayoutSettings(vendorId: string, dto: UpdatePayoutDto) {
    return this.prisma.vendor.update({
      where: { id: vendorId },
      data: dto,
      select: {
        bankName: true,
        accountNumber: true,
        accountName: true,
        payoutActive: true,
      },
    });
  }

  async getDashboardStats(vendorId: string) {
    const properties = await this.prisma.property.findMany({
      where: { vendorId },
      select: { id: true },
    });
    const propertyIds = properties.map((p) => p.id);

    const [
      totalBookings,
      activeGuests,
      completedBookings,
      cancelledBookings,
      totalRooms,
      availableRooms,
      revenueResult,
      nightsResult,
    ] = await Promise.all([
      this.prisma.booking.count({
        where: { propertyId: { in: propertyIds } },
      }),
      this.prisma.booking.count({
        where: {
          propertyId: { in: propertyIds },
          status: { in: [BookingStatus.CHECKED_IN, BookingStatus.CONFIRMED] },
        },
      }),
      this.prisma.booking.count({
        where: { propertyId: { in: propertyIds }, status: BookingStatus.COMPLETED },
      }),
      this.prisma.booking.count({
        where: { propertyId: { in: propertyIds }, status: BookingStatus.CANCELLED },
      }),
      this.prisma.room.count({ where: { propertyId: { in: propertyIds } } }),
      this.prisma.room.count({
        where: { propertyId: { in: propertyIds }, available: true },
      }),
      this.prisma.booking.aggregate({
        where: {
          propertyId: { in: propertyIds },
          status: { in: [BookingStatus.PAID, BookingStatus.COMPLETED] },
        },
        _sum: { total: true },
      }),
      this.prisma.booking.aggregate({
        where: {
          propertyId: { in: propertyIds },
          status: BookingStatus.COMPLETED,
        },
        _sum: { nights: true },
      }),
    ]);

    return {
      totalBookings,
      activeGuests,
      totalRevenue: revenueResult._sum.total || 0,
      totalRooms,
      availableRooms,
      completedBookings,
      totalNightsHosted: nightsResult._sum.nights || 0,
      cancelledBookings,
    };
  }
}
