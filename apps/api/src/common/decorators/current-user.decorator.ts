// ============================================================
// current-user.decorator.ts — @CurrentUser() extrait req.user
// ============================================================
// ParamDecorator qui récupère l'utilisateur JWT authentifié.
// Pratique pour récupérer l'ID, l'email, le rôle dans un handler.
// ============================================================

import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { JwtPayload } from "../../../../packages/shared-types/src";

/**
 * Extrait l'utilisateur courant du JWT validé par JwtAuthGuard.
 *
 * @example
 * @Get('me')
 * @UseGuards(JwtAuthGuard)
 * me(@CurrentUser() user: JwtPayload) {
 *   return user;
 * }
 *
 * @example // Une propriété spécifique
 * me(@CurrentUser('id') userId: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): JwtPayload | unknown => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    return data ? user?.[data] : user;
  },
);
