// ============================================================
// daily.service.ts — Intégration Daily.co (téléconsultation vidéo)
// ============================================================
// Daily.co = plateforme de vidéo WebRTC managée. API REST sur
// https://api.daily.co/v1 avec authentification Bearer.
//
// Endpoints utilisés :
//  - POST   /rooms            — créer une room
//  - GET    /rooms/:name      — infos room
//  - POST   /rooms/:name/tokens — générer un token d'accès utilisateur
//  - DELETE /rooms/:name      — terminer une room
//
// Sécurité : chiffrement E2E, tokens à courte durée (1h),
// conformité Loi 2013-450 (aucune donnée médicale stockée côté Daily).
// ============================================================

import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/** Propriétés d'une room Daily.co. */
export interface DailyRoom {
  id: string;
  name: string;
  url: string;
  privacy: "public" | "private";
  createdAt: string;
  config?: {
    enable_chat?: boolean;
    enable_recording?: boolean;
    start_video_off?: boolean;
    start_audio_off?: boolean;
  };
}

/** Options de création d'une room. */
export interface CreateRoomOptions {
  name?: string; // si non fourni, généré automatiquement
  privacy?: "public" | "private"; // privé par défaut (téléconsultation)
  enableRecording?: boolean; // false par défaut (RGPD/Loi 2013-450)
  exp?: number; // timestamp d'expiration (seconds)
}

/** Résultat de createRoom(). */
export interface CreateRoomResult {
  room: DailyRoom;
  url: string;
}

/**
 * Service d'intégration Daily.co.
 *
 * Méthodes :
 *  - `createRoom(opts)`   — crée une room de téléconsultation
 *  - `getRoomUrl(name)`   — récupère l'URL de la room
 *  - `endRoom(name)`      — termine une room (libère les ressources)
 *  - `createMeetingToken(name, isOwner)` — token d'accès utilisateur
 */
@Injectable()
export class DailyService {
  private readonly logger = new Logger(DailyService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly config: ConfigService,
    @Inject("FETCH") private readonly fetchImpl: typeof fetch,
  ) {
    this.apiUrl = this.config.get<string>("app.daily.apiUrl") ?? "https://api.daily.co/v1";
    this.apiKey = this.config.get<string>("app.daily.apiKey") ?? "";
  }

  /**
   * Crée une room de téléconsultation.
   * Privacy=private par défaut : seuls les détenteurs d'un token peuvent rejoindre.
   * Enregistrement DÉSACTIVÉ par défaut (conformité Loi 2013-450).
   */
  async createRoom(opts: CreateRoomOptions = {}): Promise<CreateRoomResult> {
    const name = opts.name ?? `medisaas-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const privacy = opts.privacy ?? "private";

    const body = {
      name,
      privacy,
      properties: {
        enable_chat: true,
        enable_recording: opts.enableRecording ?? false,
        start_video_off: false,
        start_audio_off: false,
        // Expire automatiquement après 4h max (sécurité)
        exp: opts.exp ?? Math.floor(Date.now() / 1000) + 4 * 3600,
        nbf: Math.floor(Date.now() / 1000),
      },
    };

    this.logger.log(`Création room Daily.co — name=${name} privacy=${privacy}`);

    const response = await this.fetchImpl(`${this.apiUrl}/rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`Daily.co HTTP ${response.status}: ${text}`);
      throw new Error(`Erreur Daily.co (${response.status})`);
    }

    const data = (await response.json()) as DailyRoom;
    return { room: data, url: data.url };
  }

  /**
   * Récupère l'URL d'accès à une room existante.
   */
  async getRoomUrl(roomName: string): Promise<string> {
    const response = await this.fetchImpl(`${this.apiUrl}/rooms/${roomName}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });

    if (!response.ok) {
      throw new Error(`Room Daily.co introuvable (${response.status})`);
    }

    const data = (await response.json()) as DailyRoom;
    return data.url;
  }

  /**
   * Termine une room (supprime la ressource côté Daily.co).
   * À appeler après la fin de la téléconsultation.
   */
  async endRoom(roomName: string): Promise<void> {
    const response = await this.fetchImpl(`${this.apiUrl}/rooms/${roomName}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`Erreur suppression room Daily.co (${response.status})`);
    }

    this.logger.log(`Room Daily.co terminée — name=${roomName}`);
  }

  /**
   * Génère un token d'accès court (1h) pour un utilisateur à une room.
   * isOwner=true pour le médecin (contrôles), false pour le patient.
   */
  async createMeetingToken(
    roomName: string,
    isOwner = false,
  ): Promise<{ token: string; expiresAt: Date }> {
    const response = await this.fetchImpl(`${this.apiUrl}/meeting-tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          is_owner: isOwner,
          exp: Math.floor(Date.now() / 1000) + 3600, // 1h
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur token Daily.co (${response.status})`);
    }

    const data = (await response.json()) as { token: string };
    return {
      token: data.token,
      expiresAt: new Date(Date.now() + 3600 * 1000),
    };
  }
}
