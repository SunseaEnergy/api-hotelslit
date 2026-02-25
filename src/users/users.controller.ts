import { Controller, Get, Patch, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UserAuthGuard } from '../common/guards/user-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, UserAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get('me')
  getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Patch('me/avatar')
  updateAvatar(
    @CurrentUser('id') userId: string,
    @Body('avatar') avatarUrl: string,
  ) {
    return this.usersService.updateAvatar(userId, avatarUrl);
  }

  @Post('me/push-token')
  savePushToken(
    @CurrentUser('id') userId: string,
    @Body('token') token: string,
  ) {
    return this.notificationsService.saveUserPushToken(userId, token);
  }
}
