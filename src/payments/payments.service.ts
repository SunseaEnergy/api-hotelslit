import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { InitiatePaymentDto } from './dto/initiate-payment.dto.js';
import { PaymentMethod, PaymentStatus, BookingStatus } from '@prisma/client';
import { StripeService } from '../stripe/stripe.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { randomUUID } from 'crypto';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
    private notifications: NotificationsService,
  ) {}

  async initiate(userId: string, dto: InitiatePaymentDto) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: dto.bookingId, userId },
      include: {
        property: {
          include: { vendor: true },
        },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (
      booking.status !== BookingStatus.CONFIRMED &&
      booking.status !== BookingStatus.PENDING
    ) {
      throw new BadRequestException('Booking is not in a payable state');
    }

    const reference = `PAY_${randomUUID().substring(0, 8).toUpperCase()}`;

    if (dto.method === PaymentMethod.WALLET) {
      const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
      if (!wallet || wallet.balance < booking.total) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      await this.prisma.$transaction([
        this.prisma.wallet.update({
          where: { userId },
          data: { balance: { decrement: booking.total } },
        }),
        this.prisma.transaction.create({
          data: {
            walletId: wallet.id,
            type: 'DEBIT',
            amount: booking.total,
            description: `Payment for booking ${booking.id}`,
            reference,
          },
        }),
        this.prisma.payment.create({
          data: {
            bookingId: booking.id,
            method: PaymentMethod.WALLET,
            reference,
            amount: booking.total,
            status: PaymentStatus.SUCCESS,
          },
        }),
        this.prisma.booking.update({
          where: { id: booking.id },
          data: { status: BookingStatus.PAID },
        }),
      ]);

      return {
        reference,
        amount: booking.total,
        method: 'WALLET',
        status: 'SUCCESS',
        message: 'Payment completed via wallet',
      };
    }

    // Stripe Checkout payment
    const vendor = booking.property.vendor;
    if (!vendor.stripeAccountId || !vendor.stripeOnboardingComplete) {
      throw new BadRequestException(
        'Vendor has not completed Stripe onboarding. Please contact support.',
      );
    }

    const amountInCents = Math.round(booking.total * 100);
    const session = await this.stripeService.createCheckoutSession({
      bookingId: booking.id,
      amountInCents,
      currency: 'usd',
      vendorStripeAccountId: vendor.stripeAccountId,
      reference,
      propertyName: booking.property.name,
    });

    await this.prisma.payment.create({
      data: {
        bookingId: booking.id,
        method: PaymentMethod.STRIPE,
        reference,
        amount: booking.total,
        status: PaymentStatus.PENDING,
        gatewayResponse: { sessionId: session.id },
      },
    });

    return {
      reference,
      authorizationUrl: session.url,
      amount: booking.total,
      method: 'STRIPE',
    };
  }

  async verify(reference: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { reference },
      include: { booking: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    return {
      reference: payment.reference,
      amount: payment.amount,
      status: payment.status,
      bookingId: payment.bookingId,
    };
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    let event: any;
    try {
      event = this.stripeService.constructWebhookEvent(rawBody, signature);
    } catch {
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const reference = session.metadata?.reference;
        if (!reference) break;

        const payment = await this.prisma.payment.findUnique({
          where: { reference },
          include: {
            booking: {
              include: {
                property: { select: { name: true, vendorId: true } },
              },
            },
          },
        });
        if (!payment || payment.status !== PaymentStatus.PENDING) break;

        await this.prisma.$transaction([
          this.prisma.payment.update({
            where: { id: payment.id },
            data: { status: PaymentStatus.SUCCESS, gatewayResponse: session },
          }),
          this.prisma.booking.update({
            where: { id: payment.bookingId },
            data: { status: BookingStatus.PAID },
          }),
        ]);

        // Notify user and vendor of successful payment
        this.notifications.sendToUser(payment.booking.userId, {
          title: 'Payment Confirmed!',
          body: `Your payment for ${payment.booking.property.name} was successful.`,
          data: { bookingId: payment.bookingId, type: 'payment_successful' },
        });
        this.notifications.sendToVendor(payment.booking.property.vendorId, {
          title: 'Payment Received',
          body: `Payment of $${payment.amount.toFixed(2)} received for ${payment.booking.property.name}.`,
          data: { bookingId: payment.bookingId, type: 'payment_received' },
        });
        void this.notifications.sendPaymentConfirmedEmail(
          payment.booking.userId,
          payment.booking.property.name,
          payment.amount,
          payment.reference,
          payment.bookingId,
        );
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const reference = paymentIntent.metadata?.reference;
        if (!reference) break;

        const payment = await this.prisma.payment.findUnique({
          where: { reference },
          include: {
            booking: {
              include: {
                property: { select: { name: true, vendorId: true } },
              },
            },
          },
        });
        if (!payment || payment.status !== PaymentStatus.PENDING) break;

        await this.prisma.$transaction([
          this.prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.SUCCESS,
              gatewayResponse: paymentIntent,
            },
          }),
          this.prisma.booking.update({
            where: { id: payment.bookingId },
            data: { status: BookingStatus.PAID },
          }),
        ]);

        this.notifications.sendToUser(payment.booking.userId, {
          title: 'Payment Confirmed!',
          body: `Your payment for ${payment.booking.property.name} was successful.`,
          data: { bookingId: payment.bookingId, type: 'payment_successful' },
        });
        this.notifications.sendToVendor(payment.booking.property.vendorId, {
          title: 'Payment Received',
          body: `Payment of $${payment.amount.toFixed(2)} received for ${payment.booking.property.name}.`,
          data: { bookingId: payment.bookingId, type: 'payment_received' },
        });
        break;
      }

      case 'account.updated': {
        const account = event.data.object;
        if (account.details_submitted && account.charges_enabled) {
          await this.prisma.vendor.updateMany({
            where: { stripeAccountId: account.id },
            data: { stripeOnboardingComplete: true },
          });
        }
        break;
      }

      case 'payout.paid': {
        // Stripe automatically paid vendor — no action needed on our side
        break;
      }
    }

    return { received: true };
  }
}
