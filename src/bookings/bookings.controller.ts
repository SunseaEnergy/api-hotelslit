import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UserAuthGuard } from '../common/guards/user-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, UserAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingsService.create(userId, dto);
  }

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.bookingsService.findUserBookings(
      userId,
      status,
      parseInt(page || '1'),
      parseInt(limit || '10'),
    );
  }

  @Get('active')
  getActive(@CurrentUser('id') userId: string) {
    return this.bookingsService.getActiveBookings(userId);
  }

  @Get('history')
  getHistory(
    @CurrentUser('id') userId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.bookingsService.getBookingHistory(
      userId,
      status,
      parseInt(page || '1'),
      parseInt(limit || '10'),
    );
  }

  @Get(':id')
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.bookingsService.findUserBooking(userId, id);
  }

  @Patch(':id/cancel')
  cancel(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.bookingsService.cancelUserBooking(userId, id);
  }

  @Post(':id/rebook')
  rebook(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.bookingsService.rebookBooking(userId, id);
  }
}
