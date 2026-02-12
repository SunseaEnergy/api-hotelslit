import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller.js';
import { VendorBookingsController } from './vendor-bookings.controller.js';
import { BookingsService } from './bookings.service.js';

@Module({
  controllers: [BookingsController, VendorBookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
