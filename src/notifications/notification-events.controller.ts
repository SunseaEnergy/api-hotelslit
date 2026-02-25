import { Controller, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from './mail/mail.service.js';
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

@Controller()
export class NotificationEventsController {
  private readonly logger = new Logger(NotificationEventsController.name);

  constructor(private readonly mailService: MailService) {}

  @OnEvent(USER_OTP_EVENT)
  async onUserOtp(event: UserOtpPayload): Promise<void> {
    const { email, name, code } = event.payload;
    this.logger.log(`Sending OTP email to user ${email}`);
    await this.mailService.sendOtpEmail({
      to: email,
      name,
      code,
      subject: 'Hotelslit – Your Verification Code',
    });
  }

  @OnEvent(USER_FORGOT_PASSWORD_EVENT)
  async onUserForgotPassword(event: UserForgotPasswordPayload): Promise<void> {
    const { email, name, code } = event.payload;
    this.logger.log(`Sending password reset email to user ${email}`);
    await this.mailService.sendForgotPasswordEmail({
      to: email,
      name,
      code,
      subject: 'Hotelslit – Password Reset Code',
    });
  }

  @OnEvent(VENDOR_OTP_EVENT)
  async onVendorOtp(event: VendorOtpPayload): Promise<void> {
    const { email, name, code } = event.payload;
    this.logger.log(`Sending OTP email to vendor ${email}`);
    await this.mailService.sendOtpEmail({
      to: email,
      name,
      code,
      subject: 'Hotelslit – Your Verification Code',
    });
  }

  @OnEvent(VENDOR_FORGOT_PASSWORD_EVENT)
  async onVendorForgotPassword(event: VendorForgotPasswordPayload): Promise<void> {
    const { email, name, code } = event.payload;
    this.logger.log(`Sending password reset email to vendor ${email}`);
    await this.mailService.sendForgotPasswordEmail({
      to: email,
      name,
      code,
      subject: 'Hotelslit – Password Reset Code',
    });
  }
}
