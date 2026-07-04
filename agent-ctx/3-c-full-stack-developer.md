# Task 3-c — Couche Supabase (migrations + Edge Functions + seed) + docs technique

Agent : full-stack-developer (Supabase + Docs)
Task ID : 3-c
Date : session en cours

## Contexte lu
- `worklog.md` (Task 1, 2-a/b/c/d, 8b+9, 3) : MediSaaS CI est une plateforme SaaS
  médicale pour la Côte d'Ivoire, multi-tenant (10 tables métier), 6 rôles RBAC,
  Loi 2013-450, paiements Mobile Money (CinetPay / Orange/Wave/MTN/CB),
  téléconsultation Daily.co, notifications Africa's Talking + WhatsApp Business,
  hébergement AWS af-south-1.
- Schéma Prisma source de vérité (`prisma/schema.prisma`) : Tenant, User,
  Patient, Appointment, Consultation, Prescription, Invoice, Payment,
  Subscription, AuditLog.
- Schéma Supabase cible : PostgreSQL 15, convention snake_case, isolation par
  `tenant_id`, RLS, triggers d'audit, chiffrement AES-256 via pgcrypto.

## Décisions techniques

### Migrations SQL (`supabase/migrations/`)
- `20240115100000_init_tenants_rls.sql` — Crée les 10 tables (snake_case),
  active RLS, fonctions `get_current_tenant_id()` / `get_current_user_id()`
  (SECURITY DEFINER, lisent le JWT via `auth.jwt()`), politiques RLS par
  table (SELECT/INSERT/UPDATE/DELETE filtrés par `tenant_id = get_current_tenant_id()`
  + restrictions par rôle via `app_metadata.role`), index multi-tenant,
  trigger `touch_updated_at()` pour `updated_at` automatique.
- `20240115101000_audit_trigger.sql` — Fonction `audit_log_change()` qui
  journalise INSERT/UPDATE/DELETE sur `patients` et `prescriptions` dans
  `audit_logs` (action, entity, entity_id, user_id, tenant_id, old_data,
  new_data, metadata). 6 triggers AFTER créés. SECURITY DEFINER pour
  permettre l'écriture même si l'utilisateur n'a pas INSERT direct sur
  audit_logs.
- `20240115102000_patient_code_sequence.sql` — Colonne `code_prefix` sur
  tenants, table `patient_code_seq` (compteur par tenant), fonction
  `generate_patient_code(tenant uuid)` qui incrémente atomiquement
  (`INSERT ... ON CONFLICT DO UPDATE ... FOR UPDATE`) et formate en
  `CI-{PREFIX}-{NNNN}` (4 chiffres zero-padded). Trigger BEFORE INSERT
  `set_patient_code()` qui génère le code automatiquement si non fourni.
- `20240115103000_encryption_helper.sql` — Extension `pgcrypto`, fonctions
  `encrypt_medical_data(text)` et `decrypt_medical_data(bytea)` (AES-256,
  clé via `current_setting('app.encryption_key')`), `rotate_medical_encryption()`
  pour rotation annuelle de clé. Colonnes `_enc` ajoutées sur consultations
  (diagnosis_enc, notes_enc), prescriptions (notes_enc), patients
  (allergies_enc, chronic_conditions_enc). Triggers de chiffrement
  automatique BEFORE INSERT/UPDATE. Vue `consultations_decrypted`
  (security_invoker) pour lecture en clair.

### Edge Functions Deno (`supabase/functions/`)
Toutes commencent par `// @ts-nocheck` (Deno globals non disponibles
dans l'environnement Next.js/TS), utilisent `Deno.serve()`, lisent les
secrets via `Deno.env.get()`, valident payload + signatures HMAC, et
journalisent dans `audit_logs`.
- `cinetpay-webhook/index.ts` — Reçoit webhooks CinetPay, vérifie
  signature HMAC SHA-256, appelle API CinetPay `/payment/check` pour
  anti-fraude, met à jour `payments` et `invoices`, envoie SMS patient
  via Africa's Talking, audit log `payment.success` / `payment.failed`.
- `daily-webhook/index.ts` — Reçoit webhooks Daily.co, vérifie signature
  HMAC, gère `meeting.started` (RDV → `en_cours`) et `meeting.ended`
  (RDV → `termine` + durée calculée), audit log `teleconsultation.start`
  / `.end`. RAPPEL recordings désactivés (Loi 2013-450).
- `sms-reminder-cron/index.ts` — Cron horaire, requête RDV J+1 (24h-48h)
  avec jointures patients/users/tenants, filtre `patients.sms_consent = true`,
  envoie SMS via Africa's Talking, audit `sms.reminder.sent` / `.failed`.
- `whatsapp-reminder/index.ts` — Envoie message template WhatsApp Business
  Cloud API (Meta Graph), authentification par `INTERNAL_API_SECRET`,
  validation numéro (8-15 chiffres), audit `whatsapp.reminder.sent` /
  `.failed`.

### Seed SQL (`supabase/seed.sql`)
- 1 tenant : Clinique du Plateau (Cocody Abidjan, plan Pro, code_prefix `CP`)
- 8 utilisateurs : 5 médecins (Aya Kouassi, Konan Yao, Fatou Traoré,
  Ibrahim Cissé, Mariam Bamba) + 1 admin cabinet + 1 secrétaire + 1 comptable
- 10 patients (noms ivoiriens : Kouassi, Yao, Diallo, Brou, Touré,
  Coulibaly, Koné, N'Guessan, Aka, Gnagne ; communes Abidjan : Cocody,
  Plateau, Yopougon, Marcory, Treichville, Adjamé, Abobo, Koumassi,
  Port-Bouët) avec codes CI-CP-0001 à CI-CP-0010, groupes sanguins,
  allergies, antécédents, assurance CNPS / NSIA / ASKIA
- 8 RDV (dont 2 téléconsultations Daily.co avec room_url)
- 3 consultations (comptes-rendus avec vitals, diagnostic chiffré en prod)
- 5 ordonnances (médicaments JSON, validité 10/15/30/90 jours)
- 6 factures (TVA 18% CI calculée, statuts payee/impayee)
- 3 paiements Mobile Money (Orange/Wave/MTN, statut réussi)
- 1 abonnement SaaS Pro (75 000 FCFA/mois, 10 sièges)
- 2 audit logs initiaux (tenant.create, subscription.activate)

### Documentation (`docs/`)
8 fichiers Markdown en français :
1. `README.md` — Index + vue d'ensemble produit + stack + rôles RBAC +
   démarrage rapide + conformité.
2. `ARCHITECTURE.md` — Monorepo Turborepo (apps/web, apps/api, packages/*),
   schéma Mermaid flux global, multi-tenant (RLS + JWT + RBAC), schéma
   Mermaid séquence login, chiffrement (AES-256 pgcrypto au repos + TLS 1.3
   transit), hébergement (Vercel + AWS af-south-1), topologie réseau ASCII,
   Edge Functions, modèle de données synthèse.
3. `API.md` — Convention `ApiResponse<T>`, pagination, codes erreur HTTP +
   codes métier, en-têtes, 10 groupes d'endpoints (auth, patients, RDV,
   medical-records, billing, teleconsultation, notifications, analytics,
   subscriptions, audit) avec méthode/URL/rôles/body/réponse, rate
   limiting, versionnement.
4. `DEPLOYMENT.md` — Topologie déploiement, variables d'env (web + api),
   secrets AWS, CI/CD GitHub Actions (workflows `ci.yml` + `migrate.yml`),
   migrations Supabase/Prisma, monitoring Sentry/PostHog/BetterStack,
   backups PITR + snapshots, restauration, rollback, procédure incident.
5. `CONFORMITY.md` — Loi ivoirienne n°2013-450 + ARTCI, registre des
   traitements, 5 droits des patients (accès/rectification/opposition/
   oubli/portabilité), consentement, rétention (10 ans DPN, purge pg_cron),
   journal d'audit (événements + structure + trigger), chiffrement, hébergement
   africain (art. 41), registre violations, mapping exhaustif article →
   implémentation, procédure audit ARTCI.
6. `MOBILE_MONEY.md` — Intégration CinetPay (Orange/Wave/MTN/CB/Moov),
   architecture flux, 7 étapes (initiation → confirmation anti-fraude →
   DB → SMS → audit), sécurité HMAC + idempotence, gestion échecs,
   remboursements, réconciliation quotidienne/mensuelle, webhooks sécurité,
   limites, sandbox, conformité (BCEAO, PCI-DSS, TVA 18%).
7. `TELECONSULTATION.md` — Intégration Daily.co (E2E), architecture flux,
   création de salles (privacy private, e2ee true, recording local only),
   tokens d'accès (owner/participant), consentement patient (modal + audit
   `teleconsultation.consent`), recordings DÉSACTIVÉS par défaut (Loi
   2013-450), webhooks (meeting.started/ended), notes en direct chiffrées
   AES-256, archives, qualité de service + fallback audio, conformité.
8. `ONBOARDING.md` — Onboarding cabinet en 4 étapes (création tenant →
   import patients CSV/Excel/FHIR → config équipe + horaires + notifications
   → go-live + support 2 sem), checklists par étape, code de création
   tenant (NestJS), KPIs J+30, conversion essai → actif, résiliation,
   checklist globale conformité, contact support.

## Lint & TypeScript
- `eslint.config.mjs` : ajouté `supabase/**`, `docs/**`, `apps/**`,
  `packages/**`, `download/**` aux ignores ESLint (Edge Functions Deno
  utilisent des globales non disponibles côté Next.js).
- `tsconfig.json` : exclu `supabase/functions/**`, `apps/api/**`,
  `packages/**` du typecheck TypeScript.
- `bun run lint` → EXIT 0 (aucune erreur, aucun warning).
- `dev.log` propre, serveur tourne sur port 3000, GET / 200.

## Statut
- 4 migrations SQL horodatées créées et valides PostgreSQL 15+.
- 4 Edge Functions Deno TypeScript créées avec `// @ts-nocheck`.
- 1 fichier seed SQL complet (Clinique du Plateau, 8 users, 10 patients,
  8 RDV, 3 consultations, 5 ordonnances, 6 factures, 3 paiements, 1
  abonnement, 2 audit logs initiaux).
- 8 fichiers de documentation technique en français créés.
- Lint propre, serveur dev opérationnel, aucune régression sur l'existant.
