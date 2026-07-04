# Documentation technique — MediSaaS CI

> Plateforme SaaS de gestion médicale pour la Côte d'Ivoire.
> Conforme à la Loi n°2013-450 (protection des données personnelles) et aux exigences de l'ARTCI.

## Index

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Architecture monorepo, multi-tenant, auth, chiffrement, hébergement |
| [API.md](./API.md) | Référence des endpoints REST, conventions, codes d'erreur |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Déploiement Vercel + AWS af-south-1, CI/CD, monitoring, backups |
| [CONFORMITY.md](./CONFORMITY.md) | Conformité Loi 2013-450 + ARTCI — mapping exigence → implémentation |
| [MOBILE_MONEY.md](./MOBILE_MONEY.md) | Intégration CinetPay (Orange Money, Wave, MTN Money, CB) |
| [TELECONSULTATION.md](./TELECONSULTATION.md) | Intégration Daily.co — salles E2E, consentement, recordings |
| [ONBOARDING.md](./ONBOARDING.md) | Onboarding cabinet en 4 étapes + checklist |

## Aperçu du produit

MediSaaS CI est un SaaS multi-tenant qui permet à des cabinets et cliniques de Côte d'Ivoire de gérer :

- **Patients** : Dossier Patient Numérique (DPN) avec code unique `CI-{PREFIX}-{NNNN}`
- **Rendez-vous** : agenda, rappels SMS (Africa's Talking) et WhatsApp Business
- **Consultations** : compte-rendus médicaux chiffrés (AES-256)
- **Ordonnances** : émission électronique, validité, renouvellement
- **Facturation** : paiements Mobile Money via CinetPay (Orange, Wave, MTN, CB)
- **Téléconsultation** : salles Daily.co chiffrées E2E
- **Portail patient** : accès sécurisé aux RDV, ordonnances, factures
- **Abonnements SaaS** : 3 plans (Essentiel / Pro / Entreprise)
- **Audit** : journalisation conforme Loi 2013-450 (rétention 10 ans)

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Web | Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + shadcn/ui |
| API | NestJS (TypeScript) — voir `apps/api` |
| Base de données | PostgreSQL 15 (Supabase) + Prisma ORM |
| Auth | Supabase Auth + JWT + RBAC (6 rôles) |
| Temps réel | Supabase Realtime (WebSockets) |
| Edge Functions | Deno (Supabase Functions) |
| Mobile Money | CinetPay (agrégateur Orange/Wave/MTN/CB) |
| SMS | Africa's Talking |
| WhatsApp | WhatsApp Business Cloud API (Meta Graph) |
| Téléconsultation | Daily.co (chiffrement E2E) |
| Email | Resend |
| Monorepo | Turborepo + Bun |
| Hébergement | Vercel (web) + AWS af-south-1 (api + db) |

## Rôles (RBAC)

| Rôle | Périmètre |
|------|-----------|
| `super_admin` | Tous les tenants (multi-cabinets) |
| `admin_cabinet` | Tenant courant — configuration, équipe, abonnement |
| `medecin` | Patients, RDV, consultations, ordonnances |
| `secretaire` | RDV, patients, facturation |
| `comptable` | Facturation, paiements, abonnement, audit |
| `patient` | Portail patient — ses propres données uniquement |

## Démarrage rapide

```bash
# 1. Installation des dépendances
bun install

# 2. Variables d'environnement
cp .env.example .env.local
# → renseigner SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CINETPAY_*, etc.

# 3. Base de données locale (Prisma SQLite pour le dev)
bun run db:push

# 4. Démarrer le serveur de développement
bun run dev
```

## Conformité

- **Loi n°2013-450** du 19 août 2013 relative à la protection des données personnelles (Côte d'Ivoire)
- **ARTCI** : Autorité de Régulation des Télécommunications de Côte d'Ivoire
- **Hébergement africain** : AWS `af-south-1` (Le Cap, Afrique du Sud)
- **Chiffrement** : AES-256 au repos, TLS 1.3 en transit
- **Rétention** : 10 ans pour les dossiers médicaux et le journal d'audit

Voir [CONFORMITY.md](./CONFORMITY.md) pour le mapping complet exigence → implémentation.

## Licence

Propriétaire — © MediSaaS CI. Tous droits réservés.
