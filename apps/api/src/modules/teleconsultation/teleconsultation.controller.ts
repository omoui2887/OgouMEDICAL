// ============================================================
// teleconsultation.controller.ts — Routes /teleconsultation
// ============================================================
// Création de rooms Daily.co + génération de tokens d'accès pour
// médecin et patient. Routes protégées JWT + RBAC.
// ============================================================

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { DailyService } from "./daily.service";
import { Roles } from "../../common/decorators/roles.decorator";
import { Audit } from "../../common/interceptors/audit.interceptor";

/**
 * Contrôleur Téléconsultation.
 *
 * Routes :
 *  - POST   /teleconsultation/rooms         — créer une room
 *  - GET    /teleconsultation/rooms/:name   — URL d'accès
 *  - DELETE /teleconsultation/rooms/:name   — terminer la room
 *  - POST   /teleconsultation/rooms/:name/token — token d'accès
 */
@ApiTags("teleconsultation")
@Controller("teleconsultation")
export class TeleconsultationController {
  constructor(private readonly daily: DailyService) {}

  @Post("rooms")
  @Roles("medecin", "admin_cabinet", "secretaire")
  @Audit("teleconsultation.create_room", "appointment")
  @ApiOperation({ summary: "Créer une room Daily.co" })
  @ApiResponse({ status: 201, description: "Room créée + URL" })
  createRoom(
    @Body("appointmentId") _appointmentId?: string,
    @Body("enableRecording") enableRecording = false,
    @Query("name") name?: string,
  ) {
    return this.daily.createRoom({ name, enableRecording });
  }

  @Get("rooms/:name")
  @Roles("medecin", "admin_cabinet", "secretaire", "patient")
  @Audit("teleconsultation.view_room", "appointment")
  @ApiOperation({ summary: "Récupérer l'URL d'une room" })
  getRoomUrl(@Param("name") name: string) {
    return this.daily.getRoomUrl(name).then((url) => ({ url }));
  }

  @Delete("rooms/:name")
  @Roles("medecin", "admin_cabinet")
  @Audit("teleconsultation.end_room", "appointment")
  @ApiOperation({ summary: "Terminer une room Daily.co" })
  async endRoom(@Param("name") name: string) {
    await this.daily.endRoom(name);
    return { ended: true, name };
  }

  @Post("rooms/:name/token")
  @Roles("medecin", "admin_cabinet", "secretaire", "patient")
  @ApiOperation({ summary: "Générer un token d'accès à la room" })
  createMeetingToken(
    @Param("name") name: string,
    @Body("isOwner") isOwner = false,
  ) {
    return this.daily.createMeetingToken(name, isOwner);
  }
}
