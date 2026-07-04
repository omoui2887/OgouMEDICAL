// ============================================================
// teleconsultation.module.ts
// ============================================================

import { Module } from "@nestjs/common";
import { TeleconsultationController } from "./teleconsultation.controller";
import { DailyService } from "./daily.service";

@Module({
  controllers: [TeleconsultationController],
  providers: [
    DailyService,
    { provide: "FETCH", useValue: fetch },
  ],
  exports: [DailyService],
})
export class TeleconsultationModule {}
