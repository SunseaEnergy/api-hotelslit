import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AddressesService } from './addresses.service.js';
import { CreateAddressDto } from './dto/create-address.dto.js';
import { UpdateAddressDto } from './dto/update-address.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UserAuthGuard } from '../common/guards/user-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, UserAuthGuard)
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.addressesService.findAll(userId);
  }

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAddressDto,
  ) {
    return this.addressesService.create(userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressesService.update(userId, id, dto);
  }

  @Delete(':id')
  delete(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.addressesService.delete(userId, id);
  }

  @Patch(':id/default')
  setDefault(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.addressesService.setDefault(userId, id);
  }
}
