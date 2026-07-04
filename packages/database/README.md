# @medisaas/database

Schéma Prisma centralisé et script de seed pour **MediSaaS CI**.

Ce package est la **source de vérité** du schéma de données multi-tenant
de la plateforme. Il est consommé à la fois par `apps/web` (Next.js) et
`apps/api` (NestJS) via le workspace.

---

## 📦 Contenu

| Fichier | Rôle |
|---|---|
| `schema.prisma` | Schéma Prisma complet (Tenant, User, Patient, Appointment, Consultation, Prescription, Invoice, Payment, Subscription, AuditLog, TenantSettings) |
| `seed/index.ts` | Script de seed TypeScript — 1 tenant, 5 médecins, 10 patients, 8 RDV, 6 factures, abonnement Pro, audit |
| `README.md` | Ce document |

---

## 🚀 Démarrage rapide (dev local — SQLite)

### 1. Configurer la variable d'environnement

Dans le `.env` à la racine du monorepo :

```bash
DATABASE_URL="file:./packages/database/dev.db"
```

### 2. Pousser le schéma (création des tables)

```bash
# depuis la racine du monorepo
bun run db:push
# ou depuis le package
cd packages/database && bun run db:push
```

> `db:push` est idéal en prototypage : il synchronise le schéma sans
> créer de migration. Pour un projet réel, préférez `db:migrate` (voir
> plus bas).

### 3. Générer le client Prisma

```bash
cd packages/database && bun run db:generate
```

### 4. Lancer le seed

```bash
cd packages/database && bun run db:seed
```

Données créées :

- **1 tenant** : *Clinique du Plateau* (Cocody, Abidjan) — plan Pro
- **5 médecins** (Dr. Aya Kouassi, Dr. Konan Yao, Dr. Fatou Traoré,
  Dr. Ibrahim Cissé, Dr. Mariam Bamba) avec spécialités et licences CI
- **1 secrétaire** + **1 administrateur cabinet**
- **10 patients** (noms ivoiriens, communes d'Abidjan, groupes
  sanguins, assurances CNPS/mutuelle)
- **8 rendez-vous** (présentiel + téléconsultation, statuts variés)
- **6 factures** avec TVA 18 %, dont certaines payées/partielles
  via Orange Money / Wave / MTN / espèces
- **1 abonnement SaaS** Pro (75 000 FCFA/mois, 7/10 sièges utilisés)
- **Journal d'audit** initial

---

## 🧱 Commandes disponibles

| Commande | Description |
|---|---|
| `bun run db:push` | Synchronise le schéma sur la base (dev) |
| `bun run db:generate` | Régénère `@prisma/client` |
| `bun run db:migrate` | Crée et applique une migration (dev) |
| `bun run db:seed` | Exécute `seed/index.ts` |
| `bun run lint` | ESLint sur le package |

À la racine du monorepo, `bun run db:push` / `bun run db:seed` sont
exposés via Turborepo.

---

## 🏗️ Migrations (production)

En production on utilise **PostgreSQL** (Supabase), pas SQLite :

```bash
# 1. Définir DATABASE_URL postgresql://... (Supabase)
# 2. Adapter le datasource du schema.prisma :
#      provider = "postgresql"
# 3. Créer une migration initiale
cd packages/database
bunx prisma migrate dev --schema=./schema.prisma --name init
```

Les migrations sont versionnées dans `packages/database/migrations/`.

---

## 🏢 Multi-tenant & isolation des données

### Principe

Chaque tenant (= cabinet/clinique cliente) possède un `id` unique.
**Toutes les tables métier** (`Patient`, `Appointment`, `Invoice`,
`Prescription`, `Consultation`, `AuditLog`…) portent un `tenantId`
obligatoire qui référence `Tenant.id`.

L'isolation repose sur deux mécanismes complémentaires :

1. **Couche applicative (Prisma)**
   - Toutes les requêtes doivent filtrer par `tenantId`.
   - Le contexte tenant est injecté par le middleware (header
     `X-Tenant-Id` ou JWT) au début de chaque requête API.
   - Un guard NestJS (ou middleware Next.js) vérifie que l'utilisateur
     appartient bien au tenant demandé.

2. **Couche base de données (RLS PostgreSQL / Supabase)** ⚠️ en prod
   - Sur Supabase on active le **Row-Level Security** sur chaque table.
   - Politique type :
     ```sql
     ALTER TABLE "Patient" ENABLE ROW LEVEL SECURITY;
     CREATE POLICY tenant_isolation ON "Patient"
       USING (tenant_id = current_setting('app.tenant_id')::text);
     ```
   - Avant chaque transaction, l'API exécute :
     ```sql
     SET LOCAL app.tenant_id = '<tenant-du-user>';
     ```
   - Garde-fou ultime : même si l'API oublie de filtrer, la base
     refuse de renvoyer des lignes d'un autre tenant.

### Conformité Loi ivoirienne n°2013-450

- **Hébergement** : AWS `af-south-1` (Le Cap) — données Côte d'Ivoire
  non sorties du continent africain.
- **Chiffrement** : AES-256 au repos, TLS 1.3 en transit.
- **Audit** : table `AuditLog` qui trace **toute** action sensible
  (lecture/écriture DPN, paiement, export, accès admin).
- **Anonymisation** : en cas de demande de suppression d'un patient
  (droit à l'oubli), les données médicales sont anonymisées mais les
  écritures comptables (factures) sont conservées (obligation fiscale).

---

## 🔐 Bonnes pratiques

- **Ne jamais** omettre `tenantId` dans une requête Prisma métier.
- **Toujours** créer via `prisma.$transaction` les entités liées
  (ex: Patient + AuditLog) pour préserver l'intégrité.
- **Index composites** `[tenantId, code]` / `[tenantId, number]` pour
  garantir l'unicité d'un code patient par cabinet.
- **JSON string** côté SQLite (champs `allergies`, `medications`…)
  → passer en `Json` natif PostgreSQL en prod.

---

## 📚 Ressources

- [Loi n°2013-450 du 14 août 2013 (ARTCI)](https://artci.ci)
- [Documentation Prisma](https://www.prisma.io/docs)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
