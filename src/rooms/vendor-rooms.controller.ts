import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RoomsService } from './rooms.service.js';
import { CreateRoomDto } from './dto/create-room.dto.js';
import { UpdateRoomDto } from './dto/update-room.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { VendorAuthGuard } from '../auth/guards/vendor-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Vendor Rooms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, VendorAuthGuard)
@Controller('vendor/properties/:propertyId/rooms')
export class VendorRoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  findAll(
    @CurrentUser('id') vendorId: string,
    @Param('propertyId') propertyId: string,
  ) {
    return this.roomsService.findVendorRooms(vendorId, propertyId);
  }

  @Post()
  create(
    @CurrentUser('id') vendorId: string,
    @Param('propertyId') propertyId: string,
    @Body() dto: CreateRoomDto,
  ) {
    return this.roomsService.createRoom(vendorId, propertyId, dto);
  }

  @Get(':roomId')
  findOne(
    @CurrentUser('id') vendorId: string,
    @Param('propertyId') propertyId: string,
    @Param('roomId') roomId: string,
  ) {
    return this.roomsService.findVendorRoom(vendorId, propertyId, roomId);
  }

  @Patch(':roomId')
  update(
    @CurrentUser('id') vendorId: string,
    @Param('propertyId') propertyId: string,
    @Param('roomId') roomId: string,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.roomsService.updateRoom(vendorId, propertyId, roomId, dto);
  }

  @Delete(':roomId')
  remove(
    @CurrentUser('id') vendorId: string,
    @Param('propertyId') propertyId: string,
    @Param('roomId') roomId: string,
  ) {
    return this.roomsService.deleteRoom(vendorId, propertyId, roomId);
  }

  @Patch(':roomId/availability')
  toggleAvailability(
    @CurrentUser('id') vendorId: string,
    @Param('propertyId') propertyId: string,
    @Param('roomId') roomId: string,
    @Body('available') available: boolean,
  ) {
    return this.roomsService.toggleAvailability(vendorId, propertyId, roomId, available);
  }

  @Post(':roomId/images')
  addImages(
    @CurrentUser('id') vendorId: string,
    @Param('propertyId') propertyId: string,
    @Param('roomId') roomId: string,
    @Body('urls') urls: string[],
  ) {
    return this.roomsService.addRoomImages(vendorId, propertyId, roomId, urls);
  }

  @Delete(':roomId/images/:imageId')
  removeImage(
    @CurrentUser('id') vendorId: string,
    @Param('propertyId') propertyId: string,
    @Param('roomId') roomId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.roomsService.removeRoomImage(vendorId, propertyId, roomId, imageId);
  }
}
