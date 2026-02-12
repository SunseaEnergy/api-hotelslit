import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller.js';
import { VendorPropertiesController } from './vendor-properties.controller.js';
import { PropertiesService } from './properties.service.js';

@Module({
  controllers: [PropertiesController, VendorPropertiesController],
  providers: [PropertiesService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
