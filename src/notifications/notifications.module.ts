import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { NotificationEventsController } from './notification-events.controller.js';
import { MailService } from './mail/mail.service.js';
import { TemplateRendererService } from './mail/template-renderer.service.js';

@Module({
  controllers: [NotificationEventsController],
  providers: [NotificationsService, MailService, TemplateRendererService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
