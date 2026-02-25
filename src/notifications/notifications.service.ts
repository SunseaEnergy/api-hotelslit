import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { MailService } from './mail/mail.service.js';

interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly expoPushUrl = 'https://exp.host/--/api/v2/push/send';

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  // ─── Push Notifications ─────────────────────────────────────────────────────

  async sendToUser(userId: string, message: PushMessage): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { pushToken: true },
    });
    if (user?.pushToken) {
      this.sendPush(user.pushToken, message);
    }
  }

  async sendToVendor(vendorId: string, message: PushMessage): Promise<void> {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { pushToken: true },
    });
    if (vendor?.pushToken) {
      this.sendPush(vendor.pushToken, message);
    }
  }

  async saveUserPushToken(userId: string, token: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { pushToken: token },
    });
  }

  async saveVendorPushToken(vendorId: string, token: string): Promise<void> {
    await this.prisma.vendor.update({
      where: { id: vendorId },
      data: { pushToken: token },
    });
  }

  private sendPush(token: string, message: PushMessage): void {
    fetch(this.expoPushUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ to: token, ...message }),
    }).catch((err) =>
      this.logger.error(`Push notification failed for token ${token}`, err),
    );
  }

  // ─── Email Helpers (called from booking/payment services) ───────────────────

  async sendBookingCreatedEmails(params: {
    guestEmail: string;
    guestName: string;
    propertyName: string;
    roomName: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    total: number;
    bookingId: string;
    vendorId: string;
  }): Promise<void> {
    try {
      // Email to guest
      await this.mailService.sendBookingConfirmationEmail({
        guestEmail: params.guestEmail,
        guestName: params.guestName,
        propertyName: params.propertyName,
        roomName: params.roomName,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        nights: params.nights,
        total: params.total,
        bookingId: params.bookingId,
      });

      // Email to vendor
      const vendor = await this.prisma.vendor.findUnique({
        where: { id: params.vendorId },
        select: { email: true, businessName: true },
      });
      if (vendor) {
        await this.mailService.sendNewBookingVendorEmail({
          vendorEmail: vendor.email,
          vendorName: vendor.businessName,
          guestName: params.guestName,
          propertyName: params.propertyName,
          checkIn: params.checkIn,
          checkOut: params.checkOut,
          nights: params.nights,
          total: params.total,
          bookingId: params.bookingId,
        });
      }
    } catch (err) {
      this.logger.error('Failed booking created emails', err);
    }
  }

  async sendBookingAcceptedEmail(userId: string, propertyName: string, checkIn: string, checkOut: string, bookingId: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });
      if (!user) return;
      await this.mailService.sendBookingAcceptedEmail({
        to: user.email,
        name: user.name,
        propertyName,
        checkIn,
        checkOut,
        bookingId,
        subject: `Booking Confirmed – ${propertyName}`,
      });
    } catch (err) {
      this.logger.error('Failed booking accepted email', err);
    }
  }

  async sendBookingCancelledEmail(userId: string, propertyName: string, checkIn: string, checkOut: string, bookingId: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });
      if (!user) return;
      await this.mailService.sendBookingCancelledEmail({
        to: user.email,
        name: user.name,
        propertyName,
        checkIn,
        checkOut,
        bookingId,
        subject: `Booking Cancelled – ${propertyName}`,
      });
    } catch (err) {
      this.logger.error('Failed booking cancelled email', err);
    }
  }

  async sendCheckInEmail(userId: string, propertyName: string, checkIn: string, checkOut: string, bookingId: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });
      if (!user) return;
      await this.mailService.sendCheckInEmail({
        to: user.email,
        name: user.name,
        propertyName,
        checkIn,
        checkOut,
        bookingId,
        subject: `Welcome – You've Checked In at ${propertyName}`,
      });
    } catch (err) {
      this.logger.error('Failed check-in email', err);
    }
  }

  async sendPaymentConfirmedEmail(userId: string, propertyName: string, amount: number, reference: string, bookingId: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });
      if (!user) return;
      await this.mailService.sendPaymentConfirmedEmail({
        to: user.email,
        name: user.name,
        propertyName,
        amount,
        reference,
        bookingId,
      });
    } catch (err) {
      this.logger.error('Failed payment confirmed email', err);
    }
  }
}
