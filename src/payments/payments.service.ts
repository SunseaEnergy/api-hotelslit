import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { InitiatePaymentDto } from './dto/initiate-payment.dto.js';
import { PaymentMethod, PaymentStatus, BookingStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async initiate(userId: string, dto: InitiatePaymentDto) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: dto.bookingId, userId },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== BookingStatus.CONFIRMED && booking.status !== BookingStatus.PENDING)
      throw new BadRequestException('Booking is not in a payable state');

    const reference = `PAY_${randomUUID().substring(0, 8).toUpperCase()}`;

    if (dto.method === PaymentMethod.WALLET) {
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId },
      });
      if (!wallet || wallet.balance < booking.total)
        throw new BadRequestException('Insufficient wallet balance');

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

    // For gateway payments, create pending payment record
    const payment = await this.prisma.payment.create({
      data: {
        bookingId: booking.id,
        method: dto.method,
        reference,
        amount: booking.total,
        status: PaymentStatus.PENDING,
      },
    });

    // TODO: Integrate actual gateway APIs (Paystack, Flutterwave, Interswitch)
    const authorizationUrl = `https://checkout.paystack.com/${reference}`;

    return {
      reference: payment.reference,
      authorizationUrl,
      amount: payment.amount,
      method: dto.method,
    };
  }

  async verify(reference: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { reference },
      include: { booking: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    // TODO: Verify with actual gateway API
    // For now, mock successful verification
    if (payment.status === PaymentStatus.PENDING) {
      await this.prisma.$transaction([
        this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.SUCCESS },
        }),
        this.prisma.booking.update({
          where: { id: payment.bookingId },
          data: { status: BookingStatus.PAID },
        }),
      ]);
    }

    return {
      reference: payment.reference,
      amount: payment.amount,
      status: 'SUCCESS',
      bookingId: payment.bookingId,
    };
  }

  async handleWebhook(provider: string, body: any) {
    // TODO: Implement actual webhook verification for each provider
    const reference = body.data?.reference || body.reference;
    if (!reference) return { status: 'ignored' };

    const payment = await this.prisma.payment.findUnique({
      where: { reference },
    });
    if (!payment) return { status: 'not_found' };

    if (body.event === 'charge.success' || body.status === 'successful') {
      await this.prisma.$transaction([
        this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.SUCCESS, gatewayResponse: body },
        }),
        this.prisma.booking.update({
          where: { id: payment.bookingId },
          data: { status: BookingStatus.PAID },
        }),
      ]);
    }

    return { status: 'processed' };
  }
}
