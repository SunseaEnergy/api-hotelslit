import { Controller, Get, Post, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { VendorsService } from './vendors.service.js';
import { UpdateVendorProfileDto } from './dto/update-vendor-profile.dto.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { VendorAuthGuard } from '../auth/guards/vendor-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Vendors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, VendorAuthGuard)
@Controller('vendors')
export class VendorsController {
  constructor(
    private readonly vendorsService: VendorsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get('me')
  getProfile(@CurrentUser('id') vendorId: string) {
    return this.vendorsService.getProfile(vendorId);
  }

  @Patch('me')
  updateProfile(
    @CurrentUser('id') vendorId: string,
    @Body() dto: UpdateVendorProfileDto,
  ) {
    return this.vendorsService.updateProfile(vendorId, dto);
  }

  @Patch('me/avatar')
  updateAvatar(
    @CurrentUser('id') vendorId: string,
    @Body('avatar') avatarUrl: string,
  ) {
    return this.vendorsService.updateAvatar(vendorId, avatarUrl);
  }

  @Post('me/stripe/onboard')
  initiateStripeOnboarding(@CurrentUser('id') vendorId: string) {
    return this.vendorsService.initiateStripeOnboarding(vendorId);
  }

  @Get('me/stripe/status')
  getStripeStatus(@CurrentUser('id') vendorId: string) {
    return this.vendorsService.getStripeStatus(vendorId);
  }

  @Get('me/stats')
  getDashboardStats(@CurrentUser('id') vendorId: string) {
    return this.vendorsService.getDashboardStats(vendorId);
  }

  @Post('me/push-token')
  savePushToken(
    @CurrentUser('id') vendorId: string,
    @Body('token') token: string,
  ) {
    return this.notificationsService.saveVendorPushToken(vendorId, token);
  }
}
