import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service.js';
import { InitiatePaymentDto } from './dto/initiate-payment.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UserAuthGuard } from '../common/guards/user-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @Post('initiate')
  initiate(
    @CurrentUser('id') userId: string,
    @Body() dto: InitiatePaymentDto,
  ) {
    return this.paymentsService.initiate(userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @Post('verify/:reference')
  verify(@Param('reference') reference: string) {
    return this.paymentsService.verify(reference);
  }

  @Post('webhook/paystack')
  webhookPaystack(@Body() body: any) {
    return this.paymentsService.handleWebhook('paystack', body);
  }

  @Post('webhook/flutterwave')
  webhookFlutterwave(@Body() body: any) {
    return this.paymentsService.handleWebhook('flutterwave', body);
  }

  @Post('webhook/interswitch')
  webhookInterswitch(@Body() body: any) {
    return this.paymentsService.handleWebhook('interswitch', body);
  }
}
