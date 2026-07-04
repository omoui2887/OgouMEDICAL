// ============================================================
// auth.controller.ts — Routes POST /auth/login | /register | /refresh
// ============================================================

import { Body, Controller, Post, UsePipes } from "@nestjs/common";
import { AuthService, type AuthResult } from "./auth.service";
import { LoginDto, LoginSchema } from "./dto/login.dto";
import { RegisterDto, RegisterSchema } from "./dto/register.dto";
import { Public } from "../../common/decorators/public.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { Audit } from "../../common/interceptors/audit.interceptor";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

/**
 * Contrôleur d'authentification — routes publiques (pas de JWT requis).
 * Rate-limiting appliqué pour limiter le bruteforce (ThrottlerGuard).
 */
@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Authentifie un utilisateur et renvoie un pair JWT.
   */
  @Public()
  @Post("login")
  @Audit("auth.login", "user")
  @ApiOperation({ summary: "Connexion utilisateur (JWT)" })
  @ApiBody({ type: Object, description: "LoginDto { email, password }" })
  @ApiResponse({ status: 200, description: "Pair JWT (access + refresh)" })
  @ApiResponse({ status: 401, description: "Identifiants invalides" })
  @UsePipes(new ZodValidationPipe(LoginSchema))
  login(@Body() dto: LoginDto): Promise<AuthResult> {
    return this.authService.login(dto);
  }

  /**
   * Crée un nouveau compte utilisateur (admin cabinet, médecin, patient...).
   */
  @Public()
  @Post("register")
  @Audit("auth.register", "user")
  @ApiOperation({ summary: "Inscription utilisateur" })
  @ApiBody({ type: Object, description: "RegisterDto" })
  @ApiResponse({ status: 201, description: "Compte créé + JWT" })
  @ApiResponse({ status: 409, description: "Email déjà utilisé" })
  @UsePipes(new ZodValidationPipe(RegisterSchema))
  register(@Body() dto: RegisterDto): Promise<AuthResult> {
    return this.authService.register(dto);
  }

  /**
   * Régénère un pair JWT à partir d'un refresh token.
   */
  @Public()
  @Post("refresh")
  @ApiOperation({ summary: "Rafraîchir le token d'accès" })
  @ApiBody({ type: Object, description: "{ refreshToken: string }" })
  @ApiResponse({ status: 200, description: "Nouveau pair JWT" })
  @ApiResponse({ status: 401, description: "Refresh token invalide" })
  refresh(@Body("refreshToken") refreshToken: string): Promise<AuthResult> {
    return this.authService.refresh(refreshToken);
  }
}

/**
 * Note : le rate-limiting (ThrottlerGuard) est configuré globalement
 * dans app.module.ts pour limiter le bruteforce sur /auth/login.
 * Voir @nestjs/throttler.
 */
