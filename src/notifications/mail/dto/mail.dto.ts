export interface SendOtpMailDto {
  to: string;
  name: string;
  code: string;
  subject: string;
}

export interface SendBookingCreatedMailDto {
  guestEmail: string;
  guestName: string;
  propertyName: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  total: number;
  bookingId: string;
}

export interface SendNewBookingVendorMailDto {
  vendorEmail: string;
  vendorName: string;
  guestName: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  total: number;
  bookingId: string;
}

export interface SendBookingStatusMailDto {
  to: string;
  name: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  bookingId: string;
  subject: string;
}

export interface SendPaymentConfirmedMailDto {
  to: string;
  name: string;
  propertyName: string;
  amount: number;
  reference: string;
  bookingId: string;
}
