// ============================================================
// MediSaaS CI — Contrats d'API (réponses standardisées)
// ============================================================

/**
 * Réponse API standard — succès.
 * @example
 * const res: ApiResponse<User> = { success: true, data: user };
 */
export interface ApiResponse<T> {
  success: true;
  data: T;
  /** Message optionnel (ex: "Patient créé avec succès"). */
  message?: string;
  /** Horodatage serveur ISO. */
  timestamp?: string;
}

/**
 * Réponse API standard — erreur.
 * Le discriminant `success` permet de typer étroitement.
 */
export interface ApiErrorResponse {
  success: false;
  error: ApiError;
  timestamp?: string;
}

/** Union des réponses API (succès OU erreur). */
export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;

/**
 * Réponse paginée standard.
 * Utilisée pour les listes (patients, factures, RDV).
 */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  /** Page courante (1-indexed). */
  page: number;
  /** Nombre d'éléments par page. */
  pageSize: number;
  /** Nombre total d'éléments (toutes pages confondues). */
  total: number;
  /** Nombre total de pages. */
  totalPages: number;
  timestamp?: string;
}

/**
 * Erreur normalisée renvoyée par l'API.
 * Le `code` est une chaîne stable, consommable côté client.
 */
export interface ApiError {
  /** Code machine (ex: "PATIENT_NOT_FOUND"). */
  code: string;
  /** Message compréhensible par l'utilisateur final (français). */
  message: string;
  /** Code HTTP associé (400, 401, 403, 404, 422, 500…). */
  status: number;
  /** Détails complémentaires (erreurs de validation champ par champ). */
  details?: Record<string, string>;
}

/** Codes d'erreur standardisés de l'API MediSaaS CI. */
export const API_ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

/** Helper pour construire une erreur API. */
export function buildApiError(
  code: string,
  message: string,
  status: number,
  details?: Record<string, string>
): ApiError {
  return { code, message, status, details };
}
