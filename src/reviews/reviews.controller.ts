import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service.js';
import { CreateReviewDto, UpdateReviewDto } from './dto/create-review.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UserAuthGuard } from '../common/guards/user-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('properties/:propertyId/reviews')
  findByProperty(@Param('propertyId') propertyId: string) {
    return this.reviewsService.findByProperty(propertyId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @Post('reviews')
  create(@CurrentUser('id') userId: string, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @Patch('reviews/:id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(userId, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @Delete('reviews/:id')
  delete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.reviewsService.delete(userId, id);
  }
}
