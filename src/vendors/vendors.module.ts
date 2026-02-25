import { Module } from '@nestjs/common';
import { VendorsController } from './vendors.controller.js';
import { VendorsService } from './vendors.service.js';
import { StripeModule } from '../stripe/stripe.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [StripeModule, NotificationsModule],
  controllers: [VendorsController],
  providers: [VendorsService],
  exports: [VendorsService],
})
export class VendorsModule {}
