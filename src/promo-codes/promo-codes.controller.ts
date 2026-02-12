import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PromoCodesService } from './promo-codes.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UserAuthGuard } from '../common/guards/user-auth.guard.js';

@ApiTags('Promo Codes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, UserAuthGuard)
@Controller('promo-codes')
export class PromoCodesController {
  constructor(private readonly promoCodesService: PromoCodesService) {}

  @Post('validate')
  validate(
    @Body('code') code: string,
    @Body('subtotal') subtotal: number,
  ) {
    return this.promoCodesService.validate(code, subtotal);
  }
}
