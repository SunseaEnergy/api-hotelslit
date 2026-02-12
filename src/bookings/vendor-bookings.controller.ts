import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { VendorAuthGuard } from '../auth/guards/vendor-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Vendor Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, VendorAuthGuard)
@Controller('vendor/bookings')
export class VendorBookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  findAll(
    @CurrentUser('id') vendorId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.bookingsService.findVendorBookings(
      vendorId,
      status,
      parseInt(page || '1'),
      parseInt(limit || '10'),
    );
  }

  @Get('active')
  getActive(@CurrentUser('id') vendorId: string) {
    return this.bookingsService.getVendorActiveBookings(vendorId);
  }

  @Get('pending')
  getPending(@CurrentUser('id') vendorId: string) {
    return this.bookingsService.getVendorPendingBookings(vendorId);
  }

  @Get('today')
  getToday(@CurrentUser('id') vendorId: string) {
    return this.bookingsService.getVendorTodayBookings(vendorId);
  }

  @Get('history')
  getHistory(
    @CurrentUser('id') vendorId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.bookingsService.getVendorBookingHistory(
      vendorId,
      status,
      parseInt(page || '1'),
      parseInt(limit || '10'),
    );
  }

  @Get(':id')
  findOne(
    @CurrentUser('id') vendorId: string,
    @Param('id') id: string,
  ) {
    return this.bookingsService.findVendorBooking(vendorId, id);
  }

  @Patch(':id/accept')
  accept(
    @CurrentUser('id') vendorId: string,
    @Param('id') id: string,
  ) {
    return this.bookingsService.acceptBooking(vendorId, id);
  }

  @Patch(':id/decline')
  decline(
    @CurrentUser('id') vendorId: string,
    @Param('id') id: string,
  ) {
    return this.bookingsService.declineBooking(vendorId, id);
  }

  @Patch(':id/check-in')
  checkIn(
    @CurrentUser('id') vendorId: string,
    @Param('id') id: string,
  ) {
    return this.bookingsService.checkInBooking(vendorId, id);
  }

  @Patch(':id/cancel')
  cancel(
    @CurrentUser('id') vendorId: string,
    @Param('id') id: string,
  ) {
    return this.bookingsService.cancelVendorBooking(vendorId, id);
  }

  @Patch(':id/complete')
  complete(
    @CurrentUser('id') vendorId: string,
    @Param('id') id: string,
  ) {
    return this.bookingsService.completeBooking(vendorId, id);
  }
}
