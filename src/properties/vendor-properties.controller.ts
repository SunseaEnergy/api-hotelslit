import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PropertiesService } from './properties.service.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { UpdatePropertyDto } from './dto/update-property.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { VendorAuthGuard } from '../auth/guards/vendor-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Vendor Properties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, VendorAuthGuard)
@Controller('vendor/properties')
export class VendorPropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  findAll(@CurrentUser('id') vendorId: string) {
    return this.propertiesService.findVendorProperties(vendorId);
  }

  @Post()
  create(
    @CurrentUser('id') vendorId: string,
    @Body() dto: CreatePropertyDto,
  ) {
    return this.propertiesService.createProperty(vendorId, dto);
  }

  @Get(':id')
  findOne(
    @CurrentUser('id') vendorId: string,
    @Param('id') id: string,
  ) {
    return this.propertiesService.findVendorProperty(vendorId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') vendorId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.updateProperty(vendorId, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser('id') vendorId: string,
    @Param('id') id: string,
  ) {
    return this.propertiesService.deleteProperty(vendorId, id);
  }

  @Post(':id/images')
  addImages(
    @CurrentUser('id') vendorId: string,
    @Param('id') id: string,
    @Body('urls') urls: string[],
  ) {
    return this.propertiesService.addPropertyImages(vendorId, id, urls);
  }

  @Delete(':id/images/:imageId')
  removeImage(
    @CurrentUser('id') vendorId: string,
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ) {
    return this.propertiesService.removePropertyImage(vendorId, id, imageId);
  }

  @Post(':id/gallery')
  addGallery(
    @CurrentUser('id') vendorId: string,
    @Param('id') id: string,
    @Body('images') images: { url: string; label: string }[],
  ) {
    return this.propertiesService.addGalleryImages(vendorId, id, images);
  }

  @Delete(':id/gallery/:imageId')
  removeGallery(
    @CurrentUser('id') vendorId: string,
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ) {
    return this.propertiesService.removeGalleryImage(vendorId, id, imageId);
  }
}
