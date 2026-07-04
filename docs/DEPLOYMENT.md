# Déploiement — MediSaaS CI

> Procédures de déploiement, CI/CD, monitoring, backups.
> Environnements : `production` (principal), `staging` (pré-prod), `preview` (PR).

## 1. Topologie de déploiement

| Composant | Environnement | Hébergeur | Région |
|-----------|---------------|-----------|--------|
| Web Next.js | production / preview | Vercel | Edge globale + `cdg1` (Paris) |
| API NestJS | production / staging | AWS ECS Fargate | `af-south-1` (Le Cap) |
| Base PostgreSQL | production | Supabase (RDS) | `af-south-1` |
| Edge Functions | production | Supabase Edge | Multi-région |
| Backups | production | AWS S3 | `af-south-1` + réplication `eu-west-1` |
| Assets statiques | production | Vercel Blob + S3 | `af-south-1` |

**Justification `af-south-1`** : conformité Loi ivoirienne n°2013-450
(les données personnelles de santé doivent être hébergées sur le
continent africain en l'absence d'un datacenter certifié en Côte d'Ivoire).

## 2. Variables d'environnement

### Production (`apps/web` — Vercel)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...          # server-side only

# API
NEXT_PUBLIC_API_URL=https://api.medisaas.ci

# CinetPay
NEXT_PUBLIC_CINETPAY_SITE_ID=8888888
CINETPAY_API_KEY=xxx
CINETPAY_WEBHOOK_SECRET=xxx

# Daily.co
DAILY_API_KEY=xxx
DAILY_WEBHOOK_SECRET=xxx

# Notifications
AFRICAS_TALKING_API_KEY=xxx
AFRICAS_TALKING_USERNAME=MediSaaS
AFRICAS_TALKING_SENDER=MediSaaS
WHATSAPP_ACCESS_TOKEN=xxx
WHATSAPP_PHONE_NUMBER_ID=xxx
WHATSAPP_TEMPLATE_RDV=rdv_rappel
RESEND_API_KEY=xxx

# Sécurité / chiffrement
MEDICAL_ENCRYPTION_KEY=base64:xxx              # clé AES-256
JWT_SECRET=xxx
INTERNAL_API_SECRET=xxx                         # pour appeler les Edge Functions

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Conformité
NODE_ENV=production
```

### Production (`apps/api` — AWS ECS)

```bash
PORT=4000
DATABASE_URL=postgresql://medisaas:xxx@db.supabase.co:5432/medisaas
DIRECT_URL=postgresql://medisaas:xxx@db.supabase.co:5432/medisaas

SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx

# Les autres variables sont identiques à apps/web
```

### Secrets AWS

Stockés dans **AWS Secrets Manager** (`medisaas/prod/*`) et injectés en
tant que variables d'environnement dans la tâche ECS au démarrage.
Rotation automatique tous les 90 jours pour :

- `DATABASE_URL` (mot de passe RDS)
- `MEDICAL_ENCRYPTION_KEY` (rotation annuelle avec re-chiffrement)
- `JWT_SECRET` (rotation semestrielle)

## 3. CI/CD — GitHub Actions

### Workflow principal (`.github/workflows/ci.yml`)

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: 1.1.0

      - run: bun install --frozen-lockfile
      - run: bun run lint
      - run: bun run typecheck
      - run: bun run test

  build-web:
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install --frozen-lockfile
      - run: bun run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

  deploy-web:
    needs: build-web
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  deploy-api:
    needs: quality
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: af-south-1
      - run: |
          aws ecs update-service --cluster medisaas-prod \
            --service medisaas-api --force-new-deployment
```

### Workflow migrations (`.github/workflows/migrate.yml`)

```yaml
name: Migrations

on:
  push:
    branches: [main]
    paths:
      - 'supabase/migrations/**'
      - 'prisma/schema.prisma'

jobs:
  supabase-migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - run: supabase db push --db-url ${{ secrets.SUPABASE_DB_URL }}
      - run: supabase functions deploy cinetpay-webhook
      - run: supabase functions deploy daily-webhook
      - run: supabase functions deploy sms-reminder-cron
      - run: supabase functions deploy whatsapp-reminder
```

### Workflow Edge Functions

Chaque push sur `main` redéploie les fonctions affectées. Le deploy est
atomic (Supabase gère le blue-green).

## 4. Migrations

### Supabase (PostgreSQL production)

```bash
# Appliquer les migrations en local
supabase db push

# En production
supabase db push --db-url "postgresql://...@db.xxx.supabase.co:5432/postgres"

# Seed (démo seulement — JAMAIS en prod)
psql "$DATABASE_URL" -f supabase/seed.sql
```

**Ordre des migrations** :

1. `20240115100000_init_tenants_rls.sql` — tables + RLS
2. `20240115101000_audit_trigger.sql` — triggers d'audit
3. `20240115102000_patient_code_sequence.sql` — codes patients CI-CP-NNNN
4. `20240115103000_encryption_helper.sql` — pgcrypto AES-256

### Prisma (SQLite dev local)

Le schéma Prisma (`prisma/schema.prisma`) sert au développement local
avec SQLite. La synchro avec le schéma Supabase est manuelle (les deux
représentent le même modèle métier).

```bash
# Dev local
bun run db:push       # pousse le schéma Prisma vers SQLite
bun run db:generate   # régénère le client Prisma
bun run db:reset      # reset complet (destructif)
```

## 5. Monitoring

### Sentry (erreurs applicatives)

- **Web** : `@sentry/nextjs` — capture automatique des erreurs React/Next.js.
- **API** : `@sentry/nestjs` — middleware NestJS.
- **Edge Functions** : wrapper `Sentry.captureException()` dans chaque handler.
- **Alerting** : Slack webhook sur erreurs P0 (taux > 1% / 5 min).

### PostHog (analytics produit)

- **Funnel** : landing → inscription → onboarding → premier RDV.
- **Session replay** sur 10% des sessions (échantillon pour respect RGPD-like).
- **Feature flags** : rollout progressif des nouvelles fonctionnalités.

### Uptime

- **BetterStack** : ping HTTP toutes les 30s sur `/api/health` (web + API).
- **Supabase Status** : monitoring intégré DB + Auth + Functions.
- **Status page publique** : `status.medisaas.ci`.

### Logs centralisés

- **Vercel** : logs Next.js (serverless functions) — 30 jours.
- **AWS CloudWatch** : logs API NestJS — 90 jours + export S3 (1 an).
- **Supabase** : logs PostgreSQL + Edge Functions — 7 jours.

### Métriques clés

| Métrique | Seuil d'alerte |
|----------|----------------|
| Latence API p95 | < 500 ms |
| Taux d'erreur API | < 0.5 % |
| Disponibilité | > 99.9 % |
| Temps de chargement web (LCP) | < 2.5 s |
| Taux d'échec paiement | < 2 % |

## 6. Backups

### Base de données PostgreSQL

- **PITR (Point-in-Time Recovery)** : activé sur Supabase, rétention 30 jours.
- **Snapshot quotidien** : 02h00 UTC, rétention 14 jours.
- **Snapshot hebdomadaire** : dimanche 03h00 UTC, rétention 8 semaines.
- **Réplication** : read replica dans `eu-west-1` (UE) pour reprise après sinistre.

### Restauration

```bash
# Restaurer un snapshot Supabase
supabase db restore --snapshot 2024-01-15-0200

# PITR (récupération à un instant précis)
supabase db restore --pitr "2024-01-15 14:32:00+00:00"
```

**Procédure de test** : restauration vers un projet `staging` le 1er du
mois pour valider l'intégrité des backups.

### Fichiers patients (uploads)

Les pièces jointes (ordonnances scannées, etc.) sont stockées dans
**AWS S3 `af-south-1`** avec :

- Versioning activé
- Chiffrement SSE-KMS (clé gérée par AWS KMS)
- Règle de cycle de vie : transition vers S3 Glacier après 90 jours (10 ans)
- Suppression définitive uniquement après expiration de la rétention Loi 2013-450

## 7. Procédure de déploiement pas à pas

### Déploiement web (Vercel)

1. Merge PR vers `main`.
2. GitHub Actions déclenche `build-web` (lint + typecheck + build).
3. Si succès → Vercel déploie automatiquement en **preview** (URL temporaire).
4. Validation manuelle (smoke test sur preview).
5. Promotion en **production** via `vercel --prod` ou auto-promote si
   `AUTO_DEPLOY=true`.

### Déploiement API (AWS ECS)

1. Build de l'image Docker : `docker build -t medisaas-api:latest apps/api`.
2. Push vers ECR `af-south-1` : `aws ecr push ...`.
3. Mise à jour de la tâche ECS : nouvelle révision avec le tag d'image.
4. `aws ecs update-service --force-new-deployment` → rolling update.
5. Vérification health check : `GET /api/health` retourne 200.
6. En cas d'échec : rollback automatique vers la révision précédente
   (ECS circuit breaker).

### Rollback

```bash
# API : rollback ECS
aws ecs update-service \
  --cluster medisaas-prod \
  --service medisaas-api \
  --task-definition medisaas-api:REVISION_PRECEDENTE

# Web : Vercel CLI
vercel rollback medisaas-web
```

## 8. Procédure d'incident

### Sévérités

| Sévérité | Description | Délai de réponse |
|----------|-------------|------------------|
| P0 | Indisponibilité totale, fuite de données | 15 min, 24/7 |
| P1 | Fonctionnalité critique cassée | 1 h, horaires ouvrés |
| P2 | Bug impactant un sous-ensemble d'utilisateurs | 4 h |
| P3 | Bug mineur, cosmétique | 24 h |

### Communication

- **Status page** mise à jour dans les 5 min (P0/P1).
- **Email** aux admins des tenants impactés.
- **Post-mortem** publié dans `docs/postmortems/` sous 7 jours (P0/P1).

## 9. Conformité déploiement

- ✅ Aucune donnée patient n'apparaît dans les logs Vercel/CloudWatch
  (filtre `redact` sur les payloads).
- ✅ Les secrets ne sont jamais committés (pre-commit hook `detect-secrets`).
- ✅ Les images Docker sont scannées par AWS Inspector à chaque push ECR.
- ✅ L'accès SSH aux serveurs ECS est désactivé (Fargate serverless).
- ✅ Audit CloudTrail actif sur le compte AWS (rétention 1 an).
