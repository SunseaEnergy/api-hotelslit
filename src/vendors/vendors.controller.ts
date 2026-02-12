import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { VendorsService } from './vendors.service.js';
import { UpdateVendorProfileDto } from './dto/update-vendor-profile.dto.js';
import { UpdatePayoutDto } from './dto/update-payout.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { VendorAuthGuard } from '../auth/guards/vendor-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Vendors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, VendorAuthGuard)
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

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

  @Get('me/payout')
  getPayoutSettings(@CurrentUser('id') vendorId: string) {
    return this.vendorsService.getPayoutSettings(vendorId);
  }

  @Patch('me/payout')
  updatePayoutSettings(
    @CurrentUser('id') vendorId: string,
    @Body() dto: UpdatePayoutDto,
  ) {
    return this.vendorsService.updatePayoutSettings(vendorId, dto);
  }

  @Get('me/stats')
  getDashboardStats(@CurrentUser('id') vendorId: string) {
    return this.vendorsService.getDashboardStats(vendorId);
  }
}
