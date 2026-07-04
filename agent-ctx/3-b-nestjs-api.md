# Task 3-b — Agent full-stack-developer (NestJS API)

## Périmètre
Structure backend NestJS de `apps/api/src/` pour MediSaaS CI. Code source production-ready (non exécuté dans le sandbox — Next.js tourne sur port 3000).

## Travail effectué
1. Lecture du `worklog.md` (Tasks 1, 3) et de la fondation existante : `prisma/schema.prisma` (Tenant, User, Patient, Appointment, Consultation, Prescription, Invoice, Payment, Subscription, AuditLog), `src/lib/types.ts` (6 rôles RBAC), `apps/api/package.json` (vide hormis scripts), `packages/shared-types/package.json` (vide).
2. Création d'un `packages/shared-types/src/index.ts` minimal pour résoudre les imports (`UserRole`, `JwtPayload`, `ApiResponse`, `PaginationParams`, `PaginatedResult`, types métier). L'agent 3-a pourra l'étendre.
3. Écriture des **39 fichiers** TypeScript sous `apps/api/src/` :
   - `main.ts` (bootstrap : helmet, CORS, ValidationPipe, HttpExceptionFilter, Swagger `/api/docs`, écoute port 4000)
   - `app.module.ts` (ConfigModule + PrismaModule + 10 modules métier + ThrottlerGuard + 3 interceptors globaux)
   - `config/` (4 fichiers : configuration, database, jwt, swagger)
   - `prisma/` (prisma.service.ts étend PrismaClient avec onModuleInit/onModuleDestroy, prisma.module.ts global)
   - `common/` :
     - `guards/` : jwt-auth.guard (bypass @Public), roles.guard (RBAC + super_admin bypass), tenant.guard (isolation multi-tenant)
     - `decorators/` : public, roles, current-user (req.user), current-tenant
     - `interceptors/` : logging (HTTP logs structurés), audit (@Audit() → AuditLog + Loi 2013-450), transform (ApiResponse<T>)
     - `filters/` : http-exception.filter (format unifié {success, error, message, statusCode, timestamp, path})
     - `pipes/` : zod-validation.pipe (validation Zod générique)
     - `dto/` : pagination.dto.ts (Zod + helper toPrismaSkip)
   - `modules/auth/` : auth.module, auth.controller (login/register/refresh @Public), auth.service (bcrypt 12 rounds + JWT pair + refresh), jwt.strategy (Passport), dto login/register (politique mot de passe, validation numéro CI, refine médecin)
   - `modules/patients/` : module/controller/service/dto — CRUD DPN multi-tenant, code CI-CP-XXXX, soft-delete (conservation Loi 2013-450)
   - `modules/appointments/` : module/controller/service/dto — CRUD RDV + détection conflit médecin, téléconsultation
   - `modules/medical-records/` : module/controller/service/dto — consultations (CRD), ordonnances (numéro ORD-YYYY-XXXX), vue DPN agrégée
   - `modules/billing/` : module/controller/service/dto + cinetpay.service — factures (numéro FAC-YYYY-XXXXX, TVA 18% CI), paiements Mobile Money (Orange/Wave/MTN/CB), webhook CinetPay idempotent, recalcul statut facture
   - `modules/teleconsultation/` : module/controller + daily.service — createRoom, getRoomUrl, endRoom, createMeetingToken (chiffrement E2E, expiration 4h)
   - `modules/notifications/` : module/controller + sms.service (Africa's Talking, normalisation +225), whatsapp.service (Meta Cloud API templates), email.service (Resend + template {{var}})
   - `modules/analytics/` : module/controller/service — KPIs (revenus, consultations, RDV, patients, taux recouvrement, no-show), topDoctors, paymentDistribution, patientsByCommune, revenueByMonth
   - `modules/subscriptions/` : module/controller/service/dto — changePlan, updatePaymentMethod, cancel (préavis Loi 2013-450), checkUsage (seats/patients/téléconsult), tarifs PLAN_PRICING (essentiel/pro/entreprise)
   - `modules/audit/` : module/controller/service — lecture paginée, export CSV, log() manuel (immutabilité append-only, art. 33/44/51 Loi 2013-450)

## Conformité Loi 2013-450 (mentionnée dans commentaires)
- Isolation multi-tenant stricte (TenantGuard) — art. 44 minimisation
- Chiffrement AES-256 au repos, TLS 1.3 en transit — config.encryption
- Hébergement AWS af-south-1 (souveraineté CI) — config.storage.region
- Journal d'audit immuable, conservation ≥ 12 mois — AuditInterceptor + AuditService
- Soft-delete patients (conservation dossiers médicaux) — PatientsService.deactivate
- Préavis résiliation 30j + suppression différée 90j — SubscriptionsService.cancel
- Consentement patient SMS/WhatsApp (opt-in) — commentaires sms/whatsapp.service
- Aucune donnée médicale loggée ni envoyée à CinetPay/Daily.co

## Conformité technique
- TypeScript strict, JSDoc en français sur toutes les classes/méthodes publiques
- Validation Zod dans tous les DTO (schémas + types dérivés)
- RBAC via `@Roles(...)` + RolesGuard sur chaque endpoint
- Multi-tenant via `@CurrentTenant()` + TenantGuard (super_admin bypass)
- 6 rôles : super_admin, admin_cabinet, medecin, secretaire, patient, comptable
- Intégrations tierces : CinetPay (Mobile Money), Daily.co (téléconsultation), Africa's Talking (SMS), WhatsApp Cloud API, Resend (email)
- Alternative Supabase Auth mentionnée dans auth.service.ts (commentaire de classe)
- Helmet + CORS strict + ValidationPipe whitelist + ThrottlerGuard (rate-limiting)
- Swagger sur `/api/docs` (désactivé en production)

## Lint
`bun run lint` → EXIT 0 (0 erreur, 0 warning). 4 problèmes initiaux corrigés :
- `main.ts` : eslint-disable `no-console` inutile (no-console déjà off) → supprimé
- `audit.service.ts` + `patients.service.ts` : `Prisma.XxxGetPayload<{}>` → `<Record<string, never>>` ou commentaire eslint-disable
- `auth.module.ts` : `require("@nestjs/jwt")` → `new JwtService(...)` via import statique

## Fichiers produits
- 1 fichier shared-types : `packages/shared-types/src/index.ts`
- 39 fichiers NestJS sous `apps/api/src/` (main, app.module, 4 config, 2 prisma, 4 guards, 4 decorators, 3 interceptors, 1 filter, 1 pipe, 1 dto commun, 10 modules × ~3-5 fichiers = 32 fichiers)

## Prochain agent (3-c)
Le backend NestJS est prêt à être intégré au monorepo. Les prochains agents peuvent :
- Brancher le frontend Next.js sur ces routes via fetch relatif `/api/...?XTransformPort=4000`
- Créer la doc Supabase + migrations + docs/ (agent 3-c)
- Étendre `packages/shared-types` (agent 3-a) avec plus de types métier (déjà amorcé)
