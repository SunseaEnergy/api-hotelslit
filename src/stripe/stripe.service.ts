import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly platformFeePercent: number;
  private readonly webhookSecret: string;
  private readonly successUrl: string;
  private readonly cancelUrl: string;
  private readonly vendorRefreshUrl: string;
  private readonly vendorReturnUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.stripe = new Stripe(this.configService.getOrThrow('STRIPE_SECRET_KEY'));
    this.platformFeePercent = Number(
      this.configService.get('STRIPE_PLATFORM_FEE_PERCENT') ?? 10,
    );
    this.webhookSecret = this.configService.getOrThrow('STRIPE_WEBHOOK_SECRET');
    this.successUrl = this.configService.getOrThrow('STRIPE_SUCCESS_URL');
    this.cancelUrl = this.configService.getOrThrow('STRIPE_CANCEL_URL');
    this.vendorRefreshUrl = this.configService.getOrThrow('STRIPE_VENDOR_REFRESH_URL');
    this.vendorReturnUrl = this.configService.getOrThrow('STRIPE_VENDOR_RETURN_URL');
  }

  async createConnectedAccount(email: string, businessName: string): Promise<Stripe.Account> {
    return this.stripe.accounts.create({
      type: 'express',
      email,
      business_profile: { name: businessName },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
  }

  async createAccountLink(accountId: string): Promise<string> {
    const link = await this.stripe.accountLinks.create({
      account: accountId,
      refresh_url: this.vendorRefreshUrl,
      return_url: this.vendorReturnUrl,
      type: 'account_onboarding',
    });
    return link.url;
  }

  async retrieveAccount(accountId: string): Promise<Stripe.Account> {
    return this.stripe.accounts.retrieve(accountId);
  }

  async createCheckoutSession(params: {
    bookingId: string;
    amountInCents: number;
    currency: string;
    vendorStripeAccountId: string;
    reference: string;
    propertyName: string;
  }): Promise<Stripe.Checkout.Session> {
    const feeAmount = Math.round(
      params.amountInCents * (this.platformFeePercent / 100),
    );

    return this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: params.currency,
            product_data: { name: params.propertyName },
            unit_amount: params.amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${this.successUrl}?session_id={CHECKOUT_SESSION_ID}&reference=${params.reference}`,
      cancel_url: `${this.cancelUrl}?reference=${params.reference}`,
      payment_intent_data: {
        application_fee_amount: feeAmount,
        transfer_data: {
          destination: params.vendorStripeAccountId,
        },
        metadata: {
          bookingId: params.bookingId,
          reference: params.reference,
        },
      },
      metadata: {
        bookingId: params.bookingId,
        reference: params.reference,
      },
    });
  }

  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.webhookSecret,
    );
  }
}
