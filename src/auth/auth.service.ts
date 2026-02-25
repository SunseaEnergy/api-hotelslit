import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { UserSignupDto } from './dto/user-signup.dto.js';
import { VendorSignupDto } from './dto/vendor-signup.dto.js';
import { SigninDto } from './dto/signin.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import {
  USER_OTP_EVENT,
  USER_FORGOT_PASSWORD_EVENT,
  VENDOR_OTP_EVENT,
  VENDOR_FORGOT_PASSWORD_EVENT,
  UserOtpPayload,
  UserForgotPasswordPayload,
  VendorOtpPayload,
  VendorForgotPasswordPayload,
} from '../events/index.js';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {}

  // ─── USER AUTH ──────────────────────────────────────────

  async userSignup(dto: UserSignupDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const otpCode = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        password: hashedPassword,
        otpCode,
        otpExpiresAt,
        referralCode: this.generateReferralCode(),
      },
    });

    this.eventEmitter.emit(
      USER_OTP_EVENT,
      new UserOtpPayload({ email: user.email, name: user.name, code: otpCode }),
    );

    return {
      user: { id: user.id, name: user.name, email: user.email },
      message: 'OTP sent to email',
    };
  }

  async userSignin(dto: SigninDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isValid = await bcrypt.compare(dto.password, user.password);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user.id, user.email, 'USER');
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        avatar: user.avatar,
      },
    };
  }

  async userVerifyOtp(dto: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new BadRequestException('User not found');
    if (user.otpCode !== dto.otp) throw new BadRequestException('Invalid OTP');
    if (user.otpExpiresAt && user.otpExpiresAt < new Date())
      throw new BadRequestException('OTP expired');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, otpCode: null, otpExpiresAt: null },
    });

    const tokens = await this.generateTokens(user.id, user.email, 'USER');
    return { ...tokens, message: 'Email verified successfully' };
  }

  async userResendOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('User not found');

    const otpCode = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { otpCode, otpExpiresAt },
    });

    this.eventEmitter.emit(
      USER_OTP_EVENT,
      new UserOtpPayload({ email: user.email, name: user.name, code: otpCode }),
    );
    return { message: 'OTP resent to email' };
  }

  async userLogout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: 'Logged out successfully' };
  }

  async userForgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('User not found');

    const otpCode = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { otpCode, otpExpiresAt },
    });

    this.eventEmitter.emit(
      USER_FORGOT_PASSWORD_EVENT,
      new UserForgotPasswordPayload({ email: user.email, name: user.name, code: otpCode }),
    );
    return { message: 'Password reset OTP sent' };
  }

  async userResetPassword(email: string, otp: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('User not found');
    if (user.otpCode !== otp) throw new BadRequestException('Invalid OTP');
    if (user.otpExpiresAt && user.otpExpiresAt < new Date())
      throw new BadRequestException('OTP expired');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, otpCode: null, otpExpiresAt: null },
    });

    return { message: 'Password reset successfully' };
  }

  // ─── VENDOR AUTH ────────────────────────────────────────

  async vendorSignup(dto: VendorSignupDto) {
    const exists = await this.prisma.vendor.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const otpCode = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const vendor = await this.prisma.vendor.create({
      data: {
        businessName: dto.businessName,
        email: dto.email,
        phone: dto.phone,
        password: hashedPassword,
        otpCode,
        otpExpiresAt,
      },
    });

    this.eventEmitter.emit(
      VENDOR_OTP_EVENT,
      new VendorOtpPayload({ email: vendor.email, name: vendor.businessName, code: otpCode }),
    );
    return {
      vendor: { id: vendor.id, businessName: vendor.businessName, email: vendor.email },
      message: 'OTP sent to email',
    };
  }

  async vendorSignin(dto: SigninDto) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { email: dto.email },
    });
    if (!vendor) throw new UnauthorizedException('Invalid credentials');

    const isValid = await bcrypt.compare(dto.password, vendor.password);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(vendor.id, vendor.email, 'VENDOR');
    await this.prisma.vendor.update({
      where: { id: vendor.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return {
      ...tokens,
      vendor: {
        id: vendor.id,
        businessName: vendor.businessName,
        email: vendor.email,
        phone: vendor.phone,
        avatar: vendor.avatar,
      },
    };
  }

  async vendorVerifyOtp(dto: VerifyOtpDto) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { email: dto.email },
    });
    if (!vendor) throw new BadRequestException('Vendor not found');
    if (vendor.otpCode !== dto.otp) throw new BadRequestException('Invalid OTP');
    if (vendor.otpExpiresAt && vendor.otpExpiresAt < new Date())
      throw new BadRequestException('OTP expired');

    await this.prisma.vendor.update({
      where: { id: vendor.id },
      data: { isVerified: true, otpCode: null, otpExpiresAt: null },
    });

    const tokens = await this.generateTokens(vendor.id, vendor.email, 'VENDOR');
    return { ...tokens, message: 'Email verified successfully' };
  }

  async vendorResendOtp(email: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { email } });
    if (!vendor) throw new BadRequestException('Vendor not found');

    const otpCode = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.vendor.update({
      where: { id: vendor.id },
      data: { otpCode, otpExpiresAt },
    });

    this.eventEmitter.emit(
      VENDOR_OTP_EVENT,
      new VendorOtpPayload({ email: vendor.email, name: vendor.businessName, code: otpCode }),
    );
    return { message: 'OTP resent to email' };
  }

  async vendorLogout(vendorId: string) {
    await this.prisma.vendor.update({
      where: { id: vendorId },
      data: { refreshToken: null },
    });
    return { message: 'Logged out successfully' };
  }

  async vendorForgotPassword(email: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { email } });
    if (!vendor) throw new BadRequestException('Vendor not found');

    const otpCode = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.vendor.update({
      where: { id: vendor.id },
      data: { otpCode, otpExpiresAt },
    });

    this.eventEmitter.emit(
      VENDOR_FORGOT_PASSWORD_EVENT,
      new VendorForgotPasswordPayload({ email: vendor.email, name: vendor.businessName, code: otpCode }),
    );
    return { message: 'Password reset OTP sent' };
  }

  async vendorResetPassword(email: string, otp: string, newPassword: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { email } });
    if (!vendor) throw new BadRequestException('Vendor not found');
    if (vendor.otpCode !== otp) throw new BadRequestException('Invalid OTP');
    if (vendor.otpExpiresAt && vendor.otpExpiresAt < new Date())
      throw new BadRequestException('OTP expired');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.vendor.update({
      where: { id: vendor.id },
      data: { password: hashedPassword, otpCode: null, otpExpiresAt: null },
    });

    return { message: 'Password reset successfully' };
  }

  // ─── SHARED ─────────────────────────────────────────────

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      if (payload.role === 'VENDOR') {
        const vendor = await this.prisma.vendor.findUnique({
          where: { id: payload.sub },
        });
        if (!vendor || vendor.refreshToken !== refreshToken)
          throw new UnauthorizedException();
        return this.generateTokens(vendor.id, vendor.email, 'VENDOR');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user || user.refreshToken !== refreshToken)
        throw new UnauthorizedException();
      return this.generateTokens(user.id, user.email, 'USER');
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // ─── HELPERS ────────────────────────────────────────────

  private async generateTokens(id: string, email: string, role: string) {
    const payload = { sub: id, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: (this.configService.get<string>('JWT_EXPIRATION') || '15m') as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d') as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateReferralCode(): string {
    return 'HL' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}
