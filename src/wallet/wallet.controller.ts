import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WalletService } from './wallet.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UserAuthGuard } from '../common/guards/user-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, UserAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  getWallet(@CurrentUser('id') userId: string) {
    return this.walletService.getWallet(userId);
  }

  @Get('transactions')
  getTransactions(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.walletService.getTransactions(
      userId,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  @Post('fund')
  fund(
    @CurrentUser('id') userId: string,
    @Body('amount') amount: number,
  ) {
    return this.walletService.fundWallet(userId, amount);
  }
}
