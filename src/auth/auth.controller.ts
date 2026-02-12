import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { UserSignupDto } from './dto/user-signup.dto.js';
import { VendorSignupDto } from './dto/vendor-signup.dto.js';
import { SigninDto } from './dto/signin.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── USER AUTH ──────────────────────────────────────────

  @Post('user/signup')
  userSignup(@Body() dto: UserSignupDto) {
    return this.authService.userSignup(dto);
  }

  @Post('user/signin')
  userSignin(@Body() dto: SigninDto) {
    return this.authService.userSignin(dto);
  }

  @Post('user/verify-otp')
  userVerifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.userVerifyOtp(dto);
  }

  @Post('user/resend-otp')
  userResendOtp(@Body('email') email: string) {
    return this.authService.userResendOtp(email);
  }

  @Post('user/refresh')
  userRefresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('user/logout')
  userLogout(@Req() req: any) {
    return this.authService.userLogout(req.user.id);
  }

  @Post('user/forgot-password')
  userForgotPassword(@Body('email') email: string) {
    return this.authService.userForgotPassword(email);
  }

  @Post('user/reset-password')
  userResetPassword(
    @Body('email') email: string,
    @Body('otp') otp: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.authService.userResetPassword(email, otp, newPassword);
  }

  // ─── VENDOR AUTH ────────────────────────────────────────

  @Post('vendor/signup')
  vendorSignup(@Body() dto: VendorSignupDto) {
    return this.authService.vendorSignup(dto);
  }

  @Post('vendor/signin')
  vendorSignin(@Body() dto: SigninDto) {
    return this.authService.vendorSignin(dto);
  }

  @Post('vendor/verify-otp')
  vendorVerifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.vendorVerifyOtp(dto);
  }

  @Post('vendor/resend-otp')
  vendorResendOtp(@Body('email') email: string) {
    return this.authService.vendorResendOtp(email);
  }

  @Post('vendor/refresh')
  vendorRefresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('vendor/logout')
  vendorLogout(@Req() req: any) {
    return this.authService.vendorLogout(req.user.id);
  }

  @Post('vendor/forgot-password')
  vendorForgotPassword(@Body('email') email: string) {
    return this.authService.vendorForgotPassword(email);
  }

  @Post('vendor/reset-password')
  vendorResetPassword(
    @Body('email') email: string,
    @Body('otp') otp: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.authService.vendorResetPassword(email, otp, newPassword);
  }
}
