import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PropertiesService } from './properties.service.js';
import { QueryPropertiesDto } from './dto/query-properties.dto.js';

@ApiTags('Properties')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  findAll(@Query() query: QueryPropertiesDto) {
    return this.propertiesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @Get(':id/gallery')
  getGallery(@Param('id') id: string) {
    return this.propertiesService.getGallery(id);
  }

  @Get(':id/amenities')
  getAmenities(@Param('id') id: string) {
    return this.propertiesService.getAmenities(id);
  }
}
