import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RoomsService } from './rooms.service.js';

@ApiTags('Rooms')
@Controller('properties/:propertyId/rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  findAll(@Param('propertyId') propertyId: string, @Query() query: any) {
    return this.roomsService.findByProperty(propertyId, query);
  }

  @Get(':roomId')
  findOne(
    @Param('propertyId') propertyId: string,
    @Param('roomId') roomId: string,
  ) {
    return this.roomsService.findOne(propertyId, roomId);
  }
}
