import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as SibApiV3Sdk from 'sib-api-v3-sdk';
import { TemplateRendererService } from './template-renderer.service.js';
import type {
  SendOtpMailDto,
  SendBookingCreatedMailDto,
  SendNewBookingVendorMailDto,
  SendBookingStatusMailDto,
  SendPaymentConfirmedMailDto,
} from './dto/mail.dto.js';

@Injectable()
export class MailService {
  private readonly emailApiInstance: SibApiV3Sdk.TransactionalEmailsApi;
  private readonly logger = new Logger(MailService.name);
  private readonly senderName: string;
  private readonly senderEmail: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly templateRenderer: TemplateRendererService,
  ) {
    const brevoApiKey = this.configService.get<string>('BREVO_API_KEY') || '';
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    defaultClient.authentications['api-key'].apiKey = brevoApiKey;
    this.emailApiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    this.senderName = this.configService.get<string>('APP_NAME') || 'Hotelslit';
    this.senderEmail =
      this.configService.get<string>('EMAIL_SENDER') || 'noreply@hotelslit.com';
  }

  private async send(to: string, subject: string, htmlContent: string): Promise<void> {
    try {
      await this.emailApiInstance.sendTransacEmail({
        sender: { name: this.senderName, email: this.senderEmail },
        to: [{ email: to }],
        subject,
        htmlContent,
      });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (err: any) {
      this.logger.error(`Failed to send email to ${to}: ${err.message}`, err.stack);
    }
  }

  async sendOtpEmail(dto: SendOtpMailDto): Promise<void> {
    const html = this.templateRenderer.render('/account-verification.hbs', {
      verification_code: dto.code,
      name: dto.name,
    });
    await this.send(dto.to, dto.subject, html);
  }

  async sendForgotPasswordEmail(dto: SendOtpMailDto): Promise<void> {
    const html = this.templateRenderer.render('/forgot-password.hbs', {
      reset_code: dto.code,
      name: dto.name,
    });
    await this.send(dto.to, dto.subject, html);
  }

  async sendBookingConfirmationEmail(dto: SendBookingCreatedMailDto): Promise<void> {
    const html = this.templateRenderer.render('/booking-confirmation.hbs', {
      guest_name: dto.guestName,
      property_name: dto.propertyName,
      room_name: dto.roomName,
      check_in: dto.checkIn,
      check_out: dto.checkOut,
      nights: dto.nights,
      total: dto.total.toFixed(2),
      booking_id: dto.bookingId,
    });
    await this.send(
      dto.guestEmail,
      `Booking Confirmation – ${dto.propertyName}`,
      html,
    );
  }

  async sendNewBookingVendorEmail(dto: SendNewBookingVendorMailDto): Promise<void> {
    const html = this.templateRenderer.render('/new-booking-vendor.hbs', {
      vendor_name: dto.vendorName,
      guest_name: dto.guestName,
      property_name: dto.propertyName,
      check_in: dto.checkIn,
      check_out: dto.checkOut,
      nights: dto.nights,
      total: dto.total.toFixed(2),
      booking_id: dto.bookingId,
    });
    await this.send(
      dto.vendorEmail,
      `New Booking Request – ${dto.propertyName}`,
      html,
    );
  }

  async sendBookingAcceptedEmail(dto: SendBookingStatusMailDto): Promise<void> {
    const html = this.templateRenderer.render('/booking-accepted.hbs', {
      name: dto.name,
      property_name: dto.propertyName,
      check_in: dto.checkIn,
      check_out: dto.checkOut,
      booking_id: dto.bookingId,
    });
    await this.send(dto.to, dto.subject, html);
  }

  async sendBookingCancelledEmail(dto: SendBookingStatusMailDto): Promise<void> {
    const html = this.templateRenderer.render('/booking-cancelled.hbs', {
      name: dto.name,
      property_name: dto.propertyName,
      check_in: dto.checkIn,
      check_out: dto.checkOut,
      booking_id: dto.bookingId,
    });
    await this.send(dto.to, dto.subject, html);
  }

  async sendCheckInEmail(dto: SendBookingStatusMailDto): Promise<void> {
    const html = this.templateRenderer.render('/check-in-confirmation.hbs', {
      name: dto.name,
      property_name: dto.propertyName,
      check_in: dto.checkIn,
      check_out: dto.checkOut,
      booking_id: dto.bookingId,
    });
    await this.send(dto.to, dto.subject, html);
  }

  async sendPaymentConfirmedEmail(dto: SendPaymentConfirmedMailDto): Promise<void> {
    const html = this.templateRenderer.render('/payment-confirmation.hbs', {
      name: dto.name,
      property_name: dto.propertyName,
      amount: dto.amount.toFixed(2),
      reference: dto.reference,
      booking_id: dto.bookingId,
    });
    await this.send(
      dto.to,
      `Payment Confirmed – ${dto.propertyName}`,
      html,
    );
  }
}
