// ============================================================
// public.decorator.ts — Décorateur @Public() (bypass JWT)
// ============================================================
// Marque une route comme publique (login, register, webhook...).
// JwtAuthGuard vérifie ce metadata et saute l'auth si présent.
// ============================================================

import { SetMetadata } from "@nestjs/common";

/** Clé metadata utilisée par JwtAuthGuard pour détecter les routes publiques. */
export const IS_PUBLIC_KEY = "isPublic";

/**
 * Décorateur de méthode/classe — désactive l'authentification JWT.
 *
 * @example
 * @Public()
 * @Post('login')
 * login(@Body() dto: LoginDto) { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
