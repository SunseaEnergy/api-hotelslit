import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AmenitiesService } from './amenities.service.js';
import { BulkSetAmenitiesDto, ToggleAmenityDto } from './dto/toggle-amenity.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { VendorAuthGuard } from '../auth/guards/vendor-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Amenities')
@Controller()
export class AmenitiesController {
  constructor(private readonly amenitiesService: AmenitiesService) {}

  @Get('amenities')
  findAllCategories() {
    return this.amenitiesService.findAllCategories();
  }

  @Get('amenities/:propertyId')
  findPropertyAmenities(@Param('propertyId') propertyId: string) {
    return this.amenitiesService.findPropertyAmenities(propertyId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, VendorAuthGuard)
  @Post('vendor/properties/:propertyId/amenities')
  bulkSet(
    @CurrentUser('id') vendorId: string,
    @Param('propertyId') propertyId: string,
    @Body() dto: BulkSetAmenitiesDto,
  ) {
    return this.amenitiesService.bulkSetAmenities(vendorId, propertyId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, VendorAuthGuard)
  @Patch('vendor/properties/:propertyId/amenities/:amenityItemId')
  toggle(
    @CurrentUser('id') vendorId: string,
    @Param('propertyId') propertyId: string,
    @Param('amenityItemId') amenityItemId: string,
    @Body() dto: ToggleAmenityDto,
  ) {
    return this.amenitiesService.toggleAmenity(vendorId, propertyId, amenityItemId, dto.enabled);
  }
}
