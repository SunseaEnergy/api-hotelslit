import { Module } from '@nestjs/common';
import { RoomsController } from './rooms.controller.js';
import { VendorRoomsController } from './vendor-rooms.controller.js';
import { RoomsService } from './rooms.service.js';

@Module({
  controllers: [RoomsController, VendorRoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
