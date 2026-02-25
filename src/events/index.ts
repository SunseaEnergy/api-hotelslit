// Auth events
export const USER_OTP_EVENT = 'USER_OTP_EVENT';
export const USER_FORGOT_PASSWORD_EVENT = 'USER_FORGOT_PASSWORD_EVENT';
export const VENDOR_OTP_EVENT = 'VENDOR_OTP_EVENT';
export const VENDOR_FORGOT_PASSWORD_EVENT = 'VENDOR_FORGOT_PASSWORD_EVENT';

// Booking events
export const BOOKING_CREATED_EVENT = 'BOOKING_CREATED_EVENT';
export const BOOKING_CONFIRMED_EVENT = 'BOOKING_CONFIRMED_EVENT';
export const BOOKING_DECLINED_EVENT = 'BOOKING_DECLINED_EVENT';
export const BOOKING_CANCELLED_BY_VENDOR_EVENT = 'BOOKING_CANCELLED_BY_VENDOR_EVENT';
export const BOOKING_CANCELLED_BY_USER_EVENT = 'BOOKING_CANCELLED_BY_USER_EVENT';
export const BOOKING_CHECKIN_EVENT = 'BOOKING_CHECKIN_EVENT';
export const BOOKING_COMPLETED_EVENT = 'BOOKING_COMPLETED_EVENT';

// Payment events
export const PAYMENT_CONFIRMED_EVENT = 'PAYMENT_CONFIRMED_EVENT';

// ─── Payload classes ─────────────────────────────────────────────────────────

export class UserOtpPayload {
  constructor(
    public readonly payload: {
      email: string;
      name: string;
      code: string;
    },
  ) {}
}

export class UserForgotPasswordPayload {
  constructor(
    public readonly payload: {
      email: string;
      name: string;
      code: string;
    },
  ) {}
}

export class VendorOtpPayload {
  constructor(
    public readonly payload: {
      email: string;
      name: string;
      code: string;
    },
  ) {}
}

export class VendorForgotPasswordPayload {
  constructor(
    public readonly payload: {
      email: string;
      name: string;
      code: string;
    },
  ) {}
}

export class BookingCreatedPayload {
  constructor(
    public readonly payload: {
      guestEmail: string;
      guestName: string;
      propertyName: string;
      roomName: string;
      checkIn: string;
      checkOut: string;
      nights: number;
      total: number;
      bookingId: string;
      vendorId: string;
      vendorEmail: string;
      vendorName: string;
    },
  ) {}
}

export class BookingStatusPayload {
  constructor(
    public readonly payload: {
      userEmail: string;
      userName: string;
      propertyName: string;
      checkIn: string;
      checkOut: string;
      bookingId: string;
    },
  ) {}
}

export class PaymentConfirmedPayload {
  constructor(
    public readonly payload: {
      userEmail: string;
      userName: string;
      propertyName: string;
      amount: number;
      reference: string;
      bookingId: string;
    },
  ) {}
}
