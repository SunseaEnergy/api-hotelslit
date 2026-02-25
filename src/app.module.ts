import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './prisma/prisma.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { VendorsModule } from './vendors/vendors.module.js';
import { PropertiesModule } from './properties/properties.module.js';
import { RoomsModule } from './rooms/rooms.module.js';
import { BookingsModule } from './bookings/bookings.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { AmenitiesModule } from './amenities/amenities.module.js';
import { FavoritesModule } from './favorites/favorites.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { WalletModule } from './wallet/wallet.module.js';
import { PromoCodesModule } from './promo-codes/promo-codes.module.js';
import { AddressesModule } from './addresses/addresses.module.js';
import { UploadModule } from './upload/upload.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    NotificationsModule,
    AuthModule,
    UsersModule,
    VendorsModule,
    PropertiesModule,
    RoomsModule,
    BookingsModule,
    CategoriesModule,
    AmenitiesModule,
    FavoritesModule,
    ReviewsModule,
    PaymentsModule,
    WalletModule,
    PromoCodesModule,
    AddressesModule,
    UploadModule,
  ],
})
export class AppModule {}
