// ============================================================
// auth.service.ts — Logique d'authentification (login/register/refresh)
// ============================================================
// - login : vérifie user en base + bcrypt.compare + génère JWT pair
// - register : bcrypt.hash + création user + JWT pair
// - refresh : valide le refresh token, génère un nouveau JWT pair
//
// NOTE ALTERNATIVE : Supabase Auth peut remplacer cette logique
// (gestion users + JWT + magic link + OAuth). Pour activer Supabase,
// supprimer cette classe et brancher @supabase/supabase-js dans
// un SupabaseAuthStrategy équivalente. Voir docs/auth-supabase.md.
// ============================================================

import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service";
import type { JwtPayload, UserRole } from "../../../../packages/shared-types/src";
import { LoginDto, LoginSchema } from "./dto/login.dto";
import { RegisterDto, RegisterSchema } from "./dto/register.dto";

/** Résultat d'authentification renvoyé au client. */
export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // secondes
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    tenantId: string | null;
  };
}

/** Nombre de rounds bcrypt — coût CPU raisonnable (12 = équilibre sécu/perf). */
const BCRYPT_ROUNDS = 12;

/**
 * Service d'authentification MediSaaS CI.
 *
 * @remarks
 * Alternative Supabase Auth : si l'équipe migrate vers Supabase,
 * remplacer bcrypt + JwtService par supabase.auth.signInWithPassword()
 * et supabase.auth.admin.createUser(). Les DTO et le contrat AuthResult
 * restent identiques, garantissant la compatibilité avec le frontend.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject("JWT_REFRESH")
    private readonly jwtRefreshService: JwtService,
  ) {}

  /**
   * Authentifie un utilisateur et génère un pair JWT (access + refresh).
   *
   * @throws UnauthorizedException si email inconnu ou mot de passe invalide.
   * @throws UnauthorizedException si compte désactivé (active=false).
   */
  async login(dto: LoginDto): Promise<AuthResult> {
    const validated = LoginSchema.parse(dto);

    const user = await this.prisma.user.findUnique({
      where: { email: validated.email },
      include: { tenant: { select: { slug: true, name: true } } },
    });

    if (!user) {
      this.logger.warn(`Login échoué — email inconnu: ${validated.email}`);
      throw new UnauthorizedException("Email ou mot de passe incorrect");
    }

    if (!user.active) {
      throw new UnauthorizedException("Compte désactivé. Contactez l'administrateur.");
    }

    // Vérification bcrypt — comparaison constante-time
    const passwordValid = await bcrypt.compare(validated.password, user.password ?? "");
    if (!user.password || !passwordValid) {
      this.logger.warn(`Login échoué — mauvais mot de passe pour ${validated.email}`);
      throw new UnauthorizedException("Email ou mot de passe incorrect");
    }

    return this.issueTokens(user);
  }

  /**
   * Inscrit un nouvel utilisateur (admin cabinet à l'onboarding, ou patient).
   *
   * @throws ConflictException si l'email existe déjà.
   */
  async register(dto: RegisterDto): Promise<AuthResult> {
    const validated = RegisterSchema.parse(dto);

    const existing = await this.prisma.user.findUnique({
      where: { email: validated.email },
    });
    if (existing) {
      throw new ConflictException("Un compte existe déjà avec cet email");
    }

    // Résolution du tenant : par slug fourni, ou création d'un nouveau
    // cabinet à l'onboarding admin_cabinet.
    let tenantId: string | null = null;
    if (validated.tenantSlug) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { slug: validated.tenantSlug },
      });
      if (!tenant) {
        throw new NotFoundException(`Cabinet "${validated.tenantSlug}" introuvable`);
      }
      tenantId = tenant.id;
    }

    const hashedPassword = await bcrypt.hash(validated.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: validated.email,
        password: hashedPassword,
        name: validated.name,
        role: validated.role,
        phone: validated.phone,
        specialty: validated.specialty,
        licenseNumber: validated.licenseNumber,
        tenantId,
        active: true,
      },
    });

    this.logger.log(`Utilisateur créé — id=${user.id} role=${user.role} tenant=${tenantId ?? "n/a"}`);
    return this.issueTokens(user);
  }

  /**
   * Régénère un pair JWT à partir d'un refresh token valide.
   *
   * @throws UnauthorizedException si refresh token invalide ou expiré.
   */
  async refresh(refreshToken: string): Promise<AuthResult> {
    try {
      const payload = await this.jwtRefreshService.verifyAsync<JwtPayload>(refreshToken);

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user || !user.active) {
        throw new UnauthorizedException("Utilisateur introuvable ou désactivé");
      }

      return this.issueTokens(user);
    } catch {
      throw new UnauthorizedException("Refresh token invalide ou expiré. Reconnectez-vous.");
    }
  }

  /**
   * Génère un access token (court) + refresh token (long) pour un user.
   */
  private async issueTokens(user: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId: string | null;
    password?: string | null;
  }): Promise<AuthResult> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      tenantId: user.tenantId,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtRefreshService.signAsync(payload);

    const expiresInStr = this.configService.get<string>("app.jwt.expiresIn") ?? "1h";
    const expiresIn = this.parseDurationToSeconds(expiresInStr);

    return {
      accessToken,
      refreshToken,
      expiresIn,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: payload.role,
        tenantId: user.tenantId,
      },
    };
  }

  /** Convertit "1h", "7d", "3600s" en nombre de secondes. */
  private parseDurationToSeconds(duration: string): number {
    const match = /^(\d+)([smhd])$/.exec(duration);
    if (!match) return 3600;
    const value = Number.parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return value * (multipliers[unit] ?? 3600);
  }
}
