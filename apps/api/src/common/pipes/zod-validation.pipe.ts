// ============================================================
// zod-validation.pipe.ts — Validation Zod des DTO entrants
// ============================================================
// Valide le body/params/query d'une route contre un schéma Zod.
// Lève BadRequestException avec les erreurs formatées si invalide.
//
// Usage : @Body(new ZodValidationPipe(CreatePatientSchema))
// Le DTO et le schéma Zod sont exportés ensemble (voir dto/*.ts).
// ============================================================

import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from "@nestjs/common";
import { ZodError, type ZodSchema } from "zod";

/**
 * Pipe de validation Zod générique.
 * À instancier inline dans un contrôleur avec le schéma souhaité.
 *
 * @example
 * @Post()
 * create(@Body(new ZodValidationPipe(CreatePatientSchema)) dto: CreatePatientDto) { ... }
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown, _metadata: ArgumentMetadata): T {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        const formatted = error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(" ; ");
        throw new BadRequestException({
          code: "VALIDATION_ERROR",
          message: `Validation échouée : ${formatted}`,
          details: error.errors,
        });
      }
      throw error;
    }
  }
}
