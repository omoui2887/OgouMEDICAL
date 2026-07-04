// ============================================================
// swagger.config.ts — Configuration OpenAPI / Swagger
// ============================================================
// Documentation interactive servie sur /api/docs en dev/staging.
// Désactivée en production (noindex conformité Loi 2013-450).
// ============================================================

import { DocumentBuilder } from "@nestjs/swagger";

/**
 * Construit les options OpenAPI pour MediSaaS CI.
 * Inclut les schémas de sécurité JWT Bearer + Webhooks CinetPay.
 */
export function buildSwaggerOptions() {
  return new DocumentBuilder()
    .setTitle("MediSaaS CI API")
    .setDescription(
      [
        "API REST de la plateforme SaaS de gestion médicale pour la Côte d'Ivoire.",
        "",
        "## Rôles (RBAC)",
        "- `super_admin` — Administrateur plateforme (multi-tenant)",
        "- `admin_cabinet` — Administrateur d'un cabinet (tenant)",
        "- `medecin` — Médecin (consultations, ordonnances, DPN)",
        "- `secretaire` — Secrétaire (RDV, patients, factures)",
        "- `comptable` — Comptable (facturation, paiements)",
        "- `patient` — Patient (portail patient)",
        "",
        "## Conformité",
        "- Loi n°2013-450 du 19 décembre 2013 (protection des données personnelles en Côte d'Ivoire)",
        "- Chiffrement AES-256 au repos, TLS 1.3 en transit",
        "- Hébergement AWS af-south-1 (souveraineté CI)",
        "- Journal d'audit immuable (consultations, ordonnances, paiements)",
        "",
        "## Intégrations",
        "- **CinetPay** — Mobile Money Orange/Wave/MTN Money",
        "- **Daily.co** — Téléconsultation vidéo chiffrée E2E",
        "- **Africa's Talking** — SMS rappels RDV",
        "- **WhatsApp Cloud API** — Notifications patient",
        "- **Resend** — Emails transactionnels",
      ].join("\n"),
    )
    .setVersion("1.0.0")
    .setContact("MediSaaS CI", "https://medisaas.ci", "contact@medisaas.ci")
    .setLicense("Propriétaire", "https://medisaas.ci/licence")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "Authorization",
        description: "Entrez le JWT obtenu via POST /api/auth/login",
        in: "header",
      },
      "JWT-auth",
    )
    .addTag("auth", "Authentification & gestion des sessions JWT")
    .addTag("patients", "Dossier Patient Numérique (DPN)")
    .addTag("appointments", "Rendez-vous (présentiel & téléconsultation)")
    .addTag("medical-records", "Consultations, ordonnances, DPN médical")
    .addTag("billing", "Facturation & paiements Mobile Money")
    .addTag("teleconsultation", "Téléconsultation vidéo Daily.co")
    .addTag("notifications", "SMS, WhatsApp, Email")
    .addTag("analytics", "Indicateurs & tableaux de bord analytiques")
    .addTag("subscriptions", "Abonnements SaaS & facturation plan")
    .addTag("audit", "Journal d'audit — conformité Loi 2013-450")
    .build();
}
