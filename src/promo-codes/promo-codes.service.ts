import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PromoCodesService {
  constructor(private prisma: PrismaService) {}

  async validate(code: string, subtotal: number) {
    const promo = await this.prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promo || !promo.isActive) {
      throw new BadRequestException('Invalid promo code');
    }

    if (promo.expiresAt && promo.expiresAt < new Date()) {
      throw new BadRequestException('Promo code expired');
    }

    if (promo.maxUses && promo.currentUses >= promo.maxUses) {
      throw new BadRequestException('Promo code usage limit reached');
    }

    let calculatedDiscount = 0;
    let message = '';

    if (promo.discountPercent) {
      calculatedDiscount = subtotal * (promo.discountPercent / 100);
      message = `${promo.discountPercent}% discount applied`;
    } else if (promo.discountAmount) {
      calculatedDiscount = Math.min(promo.discountAmount, subtotal);
      message = `$${promo.discountAmount} discount applied`;
    }

    return {
      valid: true,
      code: promo.code,
      discountPercent: promo.discountPercent,
      discountAmount: promo.discountAmount,
      calculatedDiscount,
      message,
    };
  }
}
