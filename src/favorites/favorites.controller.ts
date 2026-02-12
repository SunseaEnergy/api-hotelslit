import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UserAuthGuard } from '../common/guards/user-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, UserAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.favoritesService.findAll(userId);
  }

  @Post(':propertyId')
  add(
    @CurrentUser('id') userId: string,
    @Param('propertyId') propertyId: string,
  ) {
    return this.favoritesService.add(userId, propertyId);
  }

  @Delete(':propertyId')
  remove(
    @CurrentUser('id') userId: string,
    @Param('propertyId') propertyId: string,
  ) {
    return this.favoritesService.remove(userId, propertyId);
  }
}
