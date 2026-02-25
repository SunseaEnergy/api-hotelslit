import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateVendorProfileDto } from './dto/update-vendor-profile.dto.js';
import { StripeService } from '../stripe/stripe.service.js';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class VendorsService {
  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
  ) {}

  async getProfile(vendorId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      select: {
        id: true,
        businessName: true,
        email: true,
        phone: true,
        avatar: true,
        stripeAccountId: true,
        stripeOnboardingComplete: true,
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

  async initiateStripeOnboarding(vendorId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    let stripeAccountId = vendor.stripeAccountId;
    if (!stripeAccountId) {
      const account = await this.stripeService.createConnectedAccount(
        vendor.email,
        vendor.businessName,
      );
      stripeAccountId = account.id;
      await this.prisma.vendor.update({
        where: { id: vendorId },
        data: { stripeAccountId },
      });
    }

    const onboardingUrl = await this.stripeService.createAccountLink(stripeAccountId);
    return { onboardingUrl };
  }

  async getStripeStatus(vendorId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      select: {
        stripeAccountId: true,
        stripeOnboardingComplete: true,
      },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    if (!vendor.stripeAccountId) {
      return {
        stripeAccountId: null,
        onboardingComplete: false,
        chargesEnabled: false,
        payoutsEnabled: false,
      };
    }

    const account = await this.stripeService.retrieveAccount(vendor.stripeAccountId);
    const onboardingComplete = !!(account.details_submitted && account.charges_enabled);

    if (onboardingComplete && !vendor.stripeOnboardingComplete) {
      await this.prisma.vendor.update({
        where: { id: vendorId },
        data: { stripeOnboardingComplete: true },
      });
    }

    return {
      stripeAccountId: vendor.stripeAccountId,
      onboardingComplete,
      chargesEnabled: !!account.charges_enabled,
      payoutsEnabled: !!account.payouts_enabled,
    };
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
