import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import { StripeModule } from '../stripe/stripe.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [StripeModule, NotificationsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
