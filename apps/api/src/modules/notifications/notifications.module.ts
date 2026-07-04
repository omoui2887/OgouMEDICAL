// ============================================================
// notifications.module.ts
// ============================================================

import { Module } from "@nestjs/common";
import { NotificationsController } from "./notifications.controller";
import { SmsService } from "./sms.service";
import { WhatsAppService } from "./whatsapp.service";
import { EmailService } from "./email.service";

@Module({
  controllers: [NotificationsController],
  providers: [
    SmsService,
    WhatsAppService,
    EmailService,
    { provide: "FETCH", useValue: fetch },
  ],
  exports: [SmsService, WhatsAppService, EmailService],
})
export class NotificationsModule {}
