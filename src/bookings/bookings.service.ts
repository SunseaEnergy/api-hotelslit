import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // ─── USER BOOKINGS ────────────────────────────────────

  async create(userId: string, dto: CreateBookingDto) {
    const room = await this.prisma.room.findUnique({
      where: { id: dto.roomId },
      include: { property: true },
    });
    if (!room) throw new NotFoundException('Room not found');
    if (!room.available) throw new BadRequestException('Room not available');

    const checkIn = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (nights < 1) throw new BadRequestException('Check-out must be after check-in');

    const subtotal = room.price * nights;
    const serviceFee = 0;
    const deliveryFee = 1000;
    let total = subtotal + serviceFee + deliveryFee;

    let promoCodeId: string | undefined;
    if (dto.promoCode) {
      const promo = await this.prisma.promoCode.findUnique({
        where: { code: dto.promoCode },
      });
      if (promo && promo.isActive) {
        if (promo.expiresAt && promo.expiresAt < new Date()) {
          throw new BadRequestException('Promo code expired');
        }
        if (promo.maxUses && promo.currentUses >= promo.maxUses) {
          throw new BadRequestException('Promo code usage limit reached');
        }
        let discount = 0;
        if (promo.discountPercent) discount = subtotal * (promo.discountPercent / 100);
        if (promo.discountAmount) discount = promo.discountAmount;
        total = Math.max(0, total - discount);
        promoCodeId = promo.id;

        await this.prisma.promoCode.update({
          where: { id: promo.id },
          data: { currentUses: { increment: 1 } },
        });
      }
    }

    const booking = await this.prisma.booking.create({
      data: {
        userId,
        propertyId: dto.propertyId,
        roomId: dto.roomId,
        guestName: dto.guestName,
        guestEmail: dto.guestEmail,
        guestPhone: dto.guestPhone,
        checkIn,
        checkOut,
        nights,
        guests: dto.guests,
        roomType: dto.roomType,
        subtotal,
        serviceFee,
        deliveryFee,
        total,
        priceNote: room.priceNote,
        specialRequests: dto.specialRequests,
        promoCodeId,
      },
      include: {
        property: { select: { id: true, name: true, images: { take: 1 } } },
        room: {
          select: {
            id: true, name: true, beds: true, baths: true,
            type: true, bedType: true, price: true, priceNote: true,
            images: { take: 1 },
          },
        },
      },
    });

    // Notify vendor of new booking (push + email)
    this.notifications.sendToVendor(room.property.vendorId, {
      title: 'New Booking Request',
      body: `${dto.guestName} has booked at ${room.property.name}`,
      data: { bookingId: booking.id, type: 'new_booking' },
    });
    void this.notifications.sendBookingCreatedEmails({
      guestEmail: dto.guestEmail,
      guestName: dto.guestName,
      propertyName: room.property.name,
      roomName: booking.room.name,
      checkIn: checkIn.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      checkOut: checkOut.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      nights,
      total,
      bookingId: booking.id,
      vendorId: room.property.vendorId,
    });

    return booking;
  }

  async findUserBookings(userId: string, status?: string, page = 1, limit = 10) {
    const where: any = { userId };
    if (status) where.status = status;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          property: { select: { id: true, name: true, images: { take: 1 }, rating: true } },
          room: { select: { images: { take: 1 }, beds: true, baths: true, type: true, bedType: true } },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data: data.map((b) => ({
        ...b,
        hotelName: b.property.name,
        image: b.property.images[0]?.url || b.room.images[0]?.url || null,
        rating: b.property.rating,
        beds: b.room.beds,
        baths: b.room.baths,
        type: b.room.type,
        bedType: b.room.bedType,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findUserBooking(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, userId },
      include: {
        property: { include: { images: { take: 3 } } },
        room: { include: { images: { take: 3 } } },
        payment: true,
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async cancelUserBooking(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, userId },
      include: { property: { select: { vendorId: true, name: true } } },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== BookingStatus.PENDING && booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Cannot cancel this booking');
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    });

    // Notify vendor that customer cancelled
    this.notifications.sendToVendor(booking.property.vendorId, {
      title: 'Booking Cancelled',
      body: `${booking.guestName} cancelled their booking at ${booking.property.name}`,
      data: { bookingId, type: 'booking_cancelled_by_user' },
    });

    return updated;
  }

  async getActiveBookings(userId: string) {
    return this.findUserBookings(userId, undefined, 1, 100).then((r) => ({
      ...r,
      data: r.data.filter((b) =>
        b.status === BookingStatus.PAID ||
        b.status === BookingStatus.CONFIRMED ||
        b.status === BookingStatus.CHECKED_IN,
      ),
    }));
  }

  async getBookingHistory(userId: string, status?: string, page = 1, limit = 10) {
    const where: any = { userId };
    if (status) {
      where.status = status;
    } else {
      where.status = { in: [BookingStatus.COMPLETED, BookingStatus.CANCELLED] };
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { checkOut: 'desc' },
        include: {
          property: { select: { id: true, name: true, images: { take: 1 }, rating: true } },
          room: { select: { images: { take: 3 }, beds: true, baths: true, type: true, bedType: true } },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data: data.map((b) => ({
        ...b,
        hotelName: b.property.name,
        image: b.property.images[0]?.url || b.room.images[0]?.url || null,
        images: b.room.images.map((i) => i.url),
        rating: b.property.rating,
        beds: b.room.beds,
        baths: b.room.baths,
        type: b.room.type,
        bedType: b.room.bedType,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async rebookBooking(userId: string, bookingId: string) {
    const original = await this.prisma.booking.findFirst({
      where: { id: bookingId, userId, status: BookingStatus.COMPLETED },
    });
    if (!original) throw new NotFoundException('Completed booking not found');

    const room = await this.prisma.room.findUnique({ where: { id: original.roomId } });
    if (!room || !room.available) throw new BadRequestException('Room not available');

    return { message: 'Ready to rebook', originalBooking: original };
  }

  // ─── VENDOR BOOKINGS ──────────────────────────────────

  async findVendorBookings(vendorId: string, status?: string, page = 1, limit = 10) {
    const properties = await this.prisma.property.findMany({
      where: { vendorId },
      select: { id: true },
    });
    const propertyIds = properties.map((p) => p.id);

    const where: any = { propertyId: { in: propertyIds } };
    if (status) where.status = status;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          room: { select: { name: true, images: { take: 1 }, beds: true, baths: true, type: true, bedType: true } },
          property: { select: { name: true } },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data: data.map((b) => ({
        ...b,
        roomName: b.room.name,
        image: b.room.images[0]?.url || null,
        beds: b.room.beds,
        baths: b.room.baths,
        type: b.room.type,
        bedType: b.room.bedType,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findVendorBooking(vendorId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        property: { select: { id: true, vendorId: true, name: true } },
        room: { include: { images: { take: 3 } } },
        payment: true,
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.property.vendorId !== vendorId)
      throw new ForbiddenException('Not your booking');

    return {
      ...booking,
      roomName: booking.room.name,
      image: booking.room.images[0]?.url || null,
      images: booking.room.images.map((i) => i.url),
      beds: booking.room.beds,
      baths: booking.room.baths,
      type: booking.room.type,
      bedType: booking.room.bedType,
    };
  }

  async acceptBooking(vendorId: string, bookingId: string) {
    const booking = await this.getVendorBookingOrFail(vendorId, bookingId);
    if (booking.status !== BookingStatus.PENDING)
      throw new BadRequestException('Can only accept pending bookings');

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CONFIRMED },
    });

    this.notifications.sendToUser(booking.userId, {
      title: 'Booking Confirmed!',
      body: `Your booking at ${booking.property.name} has been confirmed.`,
      data: { bookingId, type: 'booking_confirmed' },
    });
    void this.notifications.sendBookingAcceptedEmail(
      booking.userId,
      booking.property.name,
      booking.checkIn.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      booking.checkOut.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      bookingId,
    );

    return updated;
  }

  async declineBooking(vendorId: string, bookingId: string) {
    const booking = await this.getVendorBookingOrFail(vendorId, bookingId);
    if (booking.status !== BookingStatus.PENDING)
      throw new BadRequestException('Can only decline pending bookings');

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    });

    this.notifications.sendToUser(booking.userId, {
      title: 'Booking Update',
      body: `Your booking request at ${booking.property.name} was not accepted.`,
      data: { bookingId, type: 'booking_declined' },
    });
    void this.notifications.sendBookingCancelledEmail(
      booking.userId,
      booking.property.name,
      booking.checkIn.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      booking.checkOut.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      bookingId,
    );

    return updated;
  }

  async checkInBooking(vendorId: string, bookingId: string) {
    const booking = await this.getVendorBookingOrFail(vendorId, bookingId);
    if (booking.status !== BookingStatus.CONFIRMED && booking.status !== BookingStatus.PAID)
      throw new BadRequestException('Can only check-in confirmed or paid bookings');

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CHECKED_IN },
    });

    this.notifications.sendToUser(booking.userId, {
      title: 'Checked In!',
      body: `You have been checked in at ${booking.property.name}. Enjoy your stay!`,
      data: { bookingId, type: 'check_in' },
    });
    void this.notifications.sendCheckInEmail(
      booking.userId,
      booking.property.name,
      booking.checkIn.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      booking.checkOut.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      bookingId,
    );

    return updated;
  }

  async cancelVendorBooking(vendorId: string, bookingId: string) {
    const booking = await this.getVendorBookingOrFail(vendorId, bookingId);
    if (booking.status !== BookingStatus.CONFIRMED && booking.status !== BookingStatus.PAID)
      throw new BadRequestException('Cannot cancel this booking');

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    });

    this.notifications.sendToUser(booking.userId, {
      title: 'Booking Cancelled',
      body: `Your booking at ${booking.property.name} has been cancelled by the host.`,
      data: { bookingId, type: 'booking_cancelled_by_vendor' },
    });
    void this.notifications.sendBookingCancelledEmail(
      booking.userId,
      booking.property.name,
      booking.checkIn.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      booking.checkOut.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      bookingId,
    );

    return updated;
  }

  async completeBooking(vendorId: string, bookingId: string) {
    const booking = await this.getVendorBookingOrFail(vendorId, bookingId);
    if (booking.status !== BookingStatus.CHECKED_IN)
      throw new BadRequestException('Can only complete checked-in bookings');

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.COMPLETED },
    });

    this.notifications.sendToUser(booking.userId, {
      title: 'Stay Complete',
      body: `Your stay at ${booking.property.name} is complete. Thank you for choosing us!`,
      data: { bookingId, type: 'booking_completed' },
    });

    return updated;
  }

  async getVendorActiveBookings(vendorId: string) {
    return this.findVendorBookings(vendorId, BookingStatus.CONFIRMED, 1, 100);
  }

  async getVendorPendingBookings(vendorId: string) {
    return this.findVendorBookings(vendorId, BookingStatus.PENDING, 1, 100);
  }

  async getVendorTodayBookings(vendorId: string) {
    const properties = await this.prisma.property.findMany({
      where: { vendorId },
      select: { id: true },
    });
    const propertyIds = properties.map((p) => p.id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const data = await this.prisma.booking.findMany({
      where: {
        propertyId: { in: propertyIds },
        checkIn: { gte: today, lt: tomorrow },
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.PAID] },
      },
      include: {
        room: { select: { name: true, images: { take: 1 }, beds: true, baths: true, type: true, bedType: true } },
      },
      orderBy: { checkIn: 'asc' },
    });

    return data.map((b) => ({
      ...b,
      roomName: b.room.name,
      image: b.room.images[0]?.url || null,
      beds: b.room.beds,
      baths: b.room.baths,
      type: b.room.type,
      bedType: b.room.bedType,
    }));
  }

  async getVendorBookingHistory(vendorId: string, status?: string, page = 1, limit = 10) {
    const properties = await this.prisma.property.findMany({
      where: { vendorId },
      select: { id: true },
    });
    const propertyIds = properties.map((p) => p.id);

    const where: any = { propertyId: { in: propertyIds } };
    if (status) {
      where.status = status;
    } else {
      where.status = { in: [BookingStatus.COMPLETED, BookingStatus.CANCELLED] };
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { checkOut: 'desc' },
        include: {
          room: { select: { name: true, images: { take: 1 }, beds: true, baths: true, type: true, bedType: true } },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data: data.map((b) => ({
        ...b,
        roomName: b.room.name,
        image: b.room.images[0]?.url || null,
        beds: b.room.beds,
        baths: b.room.baths,
        type: b.room.type,
        bedType: b.room.bedType,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  private async getVendorBookingOrFail(vendorId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { property: { select: { vendorId: true, name: true } } },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.property.vendorId !== vendorId)
      throw new ForbiddenException('Not your booking');
    return booking;
  }
}
