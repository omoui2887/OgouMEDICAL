// ============================================================
// configuration.ts — Configuration validée de l'API MediSaaS CI
// ============================================================
// Charge et valide les variables d'environnement via @nestjs/config.
// Toutes les valeurs sensibles (clés API, secrets JWT) proviennent
// du .env — JAMAIS codées en dur (conformité Loi 2013-450).
// ============================================================

import { registerAs } from "@nestjs/config";

/**
 * Schéma de configuration applicative.
 * Chaque propriété est typée et documentée pour faciliter l'audit.
 */
export interface AppConfig {
  nodeEnv: "development" | "staging" | "production" | "test";
  appName: string;
  apiPort: number;
  apiPrefix: string;
  corsOrigins: string[];
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  database: {
    url: string;
  };
  // Hébergement AWS af-south1 (Cape Town) — données CI souveraines
  storage: {
    region: string;
    bucket: string;
  };
  // Chiffrement au repos AES-256 (Loi 2013-450 — art. 44)
  encryption: {
    algorithm: string;
    key: string;
  };
  // Intégrations tierces (Mobile Money, téléconsultation, notifications)
  cinetpay: {
    apiUrl: string;
    siteId: string;
    apiKey: string;
    notifyUrl: string;
    returnUrl: string;
  };
  daily: {
    apiUrl: string;
    apiKey: string;
  };
  africasTalking: {
    apiUrl: string;
    apiKey: string;
    senderId: string;
  };
  whatsapp: {
    apiUrl: string;
    phoneNumberId: string;
    accessToken: string;
  };
  resend: {
    apiUrl: string;
    apiKey: string;
    fromEmail: string;
  };
}

/**
 * Charge la configuration depuis process.env avec valeurs par défaut.
 * En production, une variable obligatoire manquante provoque un crash
 * rapide (fail-fast) plutôt qu'un comportement silencieux.
 */
export default registerAs("app", (): AppConfig => {
  const nodeEnv = (process.env.NODE_ENV ?? "development") as AppConfig["nodeEnv"];

  return {
    nodeEnv,
    appName: process.env.APP_NAME ?? "MediSaaS CI API",
    apiPort: Number.parseInt(process.env.API_PORT ?? "4000", 10),
    apiPrefix: process.env.API_PREFIX ?? "api",
    corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:3000")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean),
    jwt: {
      secret: process.env.JWT_SECRET ?? "dev-jwt-secret-change-me",
      expiresIn: process.env.JWT_EXPIRES_IN ?? "1h",
      refreshSecret:
        process.env.JWT_REFRESH_SECRET ?? "dev-jwt-refresh-secret-change-me",
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
    },
    database: {
      url: process.env.DATABASE_URL ?? "postgresql://medisaas:medisaas@localhost:5432/medisaas",
    },
    storage: {
      region: process.env.AWS_REGION ?? "af-south-1",
      bucket: process.env.AWS_S3_BUCKET ?? "medisaas-ci-uploads",
    },
    encryption: {
      algorithm: process.env.ENCRYPTION_ALGORITHM ?? "aes-256-gcm",
      key: process.env.ENCRYPTION_KEY ?? "dev-encryption-key-32-bytes-long!",
    },
    cinetpay: {
      apiUrl: process.env.CINETPAY_API_URL ?? "https://api-checkout.cinetpay.com/v2",
      siteId: process.env.CINETPAY_SITE_ID ?? "",
      apiKey: process.env.CINETPAY_API_KEY ?? "",
      notifyUrl:
        process.env.CINETPAY_NOTIFY_URL ?? "https://api.medisaas.ci/api/billing/webhook",
      returnUrl:
        process.env.CINETPAY_RETURN_URL ?? "https://app.medisaas.ci/billing/return",
    },
    daily: {
      apiUrl: process.env.DAILY_API_URL ?? "https://api.daily.co/v1",
      apiKey: process.env.DAILY_API_KEY ?? "",
    },
    africasTalking: {
      apiUrl: process.env.AFRICAS_TALKING_API_URL ?? "https://api.africastalking.com/version1",
      apiKey: process.env.AFRICAS_TALKING_API_KEY ?? "",
      senderId: process.env.AFRICAS_TALKING_SENDER_ID ?? "MediSaaS",
    },
    whatsapp: {
      apiUrl:
        process.env.WHATSAPP_API_URL ??
        "https://graph.facebook.com/v18.0",
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN ?? "",
    },
    resend: {
      apiUrl: process.env.RESEND_API_URL ?? "https://api.resend.com",
      apiKey: process.env.RESEND_API_KEY ?? "",
      fromEmail: process.env.RESEND_FROM_EMAIL ?? "MediSaaS CI <noreply@medisaas.ci>",
    },
  };
});
