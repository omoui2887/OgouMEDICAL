# Onboarding cabinet — MediSaaS CI

> Guide d'onboarding en 4 étapes pour les nouveaux cabinets et cliniques
> ivoiriens. À destination des `admin_cabinet` et de l'équipe support MediSaaS.

## Vue d'ensemble

L'onboarding d'un cabinet médical se déroule en **4 étapes** sur une durée
moyenne de **3 à 7 jours**. Chaque étape a une checklist à valider avant
de passer à la suivante.

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  1. Création │ ─►│ 2. Import    │ ─►│ 3. Config    │ ─►│ 4. Go-live   │
│  du tenant   │   │  patients    │   │  équipe      │   │  + support   │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
   1 journée          1–3 jours          1 journée           Jour J
```

---

## Étape 1 — Création du tenant

**Objectif** : mettre à disposition le tenant et l'abonnement SaaS.

### Actions

1. L'admin cabinet s'inscrit sur `https://medisaas.ci/register`.
2. Remplir le formulaire d'inscription :
   - Nom du cabinet (ex. « Clinique du Plateau »)
   - Slug (auto-généré : `clinique-plateau`)
   - Type : `cabinet` ou `clinique`
   - Ville, commune, adresse, téléphone, email
   - Plan SaaS souhaité (Essentiel / Pro / Entreprise)
3. Paiement du premier mois via Mobile Money (CinetPay).
4. Validation du compte par email (Resend).
5. Création automatique du tenant + abonnement en statut `essai` (14 jours).

### Code — Création du tenant (côté API)

```typescript
// apps/api/src/modules/onboarding/onboarding.service.ts
async function createTenant(dto: CreateTenantDto, userId: string) {
  // 1. Créer le tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: dto.name,
      slug: slugify(dto.name),
      type: dto.type,
      city: dto.city,
      district: dto.district,
      phone: dto.phone,
      email: dto.email,
      address: dto.address,
      plan: dto.plan,
      status: "actif",
      code_prefix: computePrefix(dto.name),
    },
  });

  // 2. Créer l'abonnement SaaS (essai 14 jours)
  await prisma.subscription.create({
    data: {
      tenantId: tenant.id,
      plan: dto.plan,
      status: "essai",
      billingCycle: "mensuel",
      amount: getPlanPrice(dto.plan),
      seats: getPlanSeats(dto.plan),
      currentPeriodStart: new Date(),
      currentPeriodEnd: addDays(new Date(), 14),
      paymentMethod: dto.paymentMethod,
    },
  });

  // 3. Promouvoir l'utilisateur courant en admin_cabinet du tenant
  await prisma.user.update({
    where: { id: userId },
    data: { tenantId: tenant.id, role: "admin_cabinet" },
  });

  // 4. Audit log
  await audit(tenant.id, userId, "tenant.create", "tenant", tenant.id, { plan: dto.plan });

  return tenant;
}
```

### Checklist

- [ ] Inscription validée (email confirmé)
- [ ] Tenant créé en base (UUID `ten_...`)
- [ ] Slug unique (ex. `clinique-plateau`)
- [ ] Préfixe code patient calculé (ex. `CP` pour Clinique du Plateau)
- [ ] Abonnement SaaS actif (statut `essai` 14 jours)
- [ ] Premier utilisateur promu `admin_cabinet`
- [ ] Audit log `tenant.create` écrit
- [ ] Email de bienvenue envoyé (Resend)

---

## Étape 2 — Import des patients existants

**Objectif** : migrer le fichier patients existant (Excel, CSV, papier)
vers le Dossier Patient Numérique (DPN) MediSaaS.

### Formats acceptés

- **CSV** (UTF-8, séparateur virgule ou point-virgule)
- **Excel** (`.xlsx`, feuille unique)
- **HL7 FHIR** (pour les cliniques équipées d'un SI existant)
- **Saisie manuelle** (pour les petits cabinets < 50 patients)

### Template CSV

```csv
firstName,lastName,gender,birthDate,phone,email,address,bloodType,weight,height,insuranceProvider,insuranceNumber
Aya,Kouassi,F,1989-04-12,+225 07 11 22 33 44,aya.kouassi@email.ci,"Rue des Jardins, Cocody",A+,65,168,CNPS,CNPS-ABJ-2018-12345
Kouadio,Yao,M,1975-09-23,+225 07 22 33 44 55,kouadio.yao@email.ci,"Avenue Houphouët, Plateau",O+,78,175,CNPS,CNPS-ABJ-2015-67890
```

### Endpoint d'import

```http
POST /api/patients/import
Authorization: Bearer <JWT admin_cabinet>
Content-Type: multipart/form-data

file: <csv file>
```

**Réponse 200** :

```json
{
  "success": true,
  "data": {
    "imported": 48,
    "skipped": 2,
    "errors": [
      { "row": 12, "error": "Téléphone invalide" },
      { "row": 33, "error": "Date de naissance manquante" }
    ]
  }
}
```

### Génération automatique des codes patients

Chaque patient importé reçoit un code unique `CI-{PREFIX}-{NNNN}` via le
trigger PostgreSQL `set_patient_code` (voir migration
`20240115102000_patient_code_sequence.sql`).

```sql
-- Trigger BEFORE INSERT sur patients
-- Génère automatiquement CI-CP-0001, CI-CP-0002, ...
```

### Procédure d'import (côté admin cabinet)

1. Télécharger le template CSV depuis `Paramètres → Import`.
2. Remplir le fichier (respecter les formats : téléphone `+225 ...`, date `AAAA-MM-JJ`).
3. Uploader le fichier dans MediSaaS.
4. Vérifier le rapport d'erreurs (lignes en échec).
5. Corriger les lignes en erreur et re-importer uniquement celles-ci.
6. Valider l'import final.

### Checklist

- [ ] Template CSV téléchargé
- [ ] Fichier préparé (au moins 80 % des patients existants)
- [ ] Import réussi (taux d'erreur < 5 %)
- [ ] Codes patients générés (`CI-CP-0001` à `CI-CP-XXXX`)
- [ ] Données sensibles (allergies, antécédents) vérifiées
- [ ] Doublons détectés et fusionnés
- [ ] Audit log `patient.import.bulk` écrit avec compte

---

## Étape 3 — Configuration de l'équipe

**Objectif** : créer les comptes utilisateurs pour les médecins,
secrétaires et comptables du cabinet.

### Création des utilisateurs

L'admin cabinet invite les membres de l'équipe via
`Paramètres → Utilisateurs → Inviter` :

```http
POST /api/users/invite
Authorization: Bearer <JWT admin_cabinet>

{
  "email": "dr.kouassi@clinique-plateau.ci",
  "name": "Dr. Aya Kouassi",
  "role": "medecin",
  "specialty": "Médecine générale",
  "licenseNumber": "CI-MG-2018-0431"
}
```

### Rôles et permissions

| Rôle | Périmètre |
|------|-----------|
| `admin_cabinet` | Tout le tenant (sauf données médicales détaillées) |
| `medecin` | Patients, RDV, consultations, ordonnances |
| `secretaire` | RDV, patients, facturation |
| `comptable` | Facturation, paiements, abonnement, audit |
| `patient` | Portail patient (créé automatiquement à l'import) |

### Limite de sièges

| Plan | Sièges inclus | Siège supplémentaire |
|------|---------------|----------------------|
| Essentiel | 3 | 5 000 FCFA/mois |
| Pro | 10 | 4 000 FCFA/mois |
| Entreprise | 50 | 3 000 FCFA/mois |

### Configuration des horaires

L'admin cabinet définit les horaires d'ouverture par médecin et par jour
(`Paramètres → Horaires`) :

```json
{
  "doctorId": "00000000-0000-0000-0000-000000000010",
  "schedule": {
    "monday":    { "start": "08:00", "end": "17:00", "slotMin": 30 },
    "tuesday":   { "start": "08:00", "end": "17:00", "slotMin": 30 },
    "wednesday": { "start": "08:00", "end": "13:00", "slotMin": 30 },
    "thursday":  { "start": "08:00", "end": "17:00", "slotMin": 30 },
    "friday":    { "start": "08:00", "end": "17:00", "slotMin": 30 },
    "saturday":  null,
    "sunday":    null
  }
}
```

### Configuration des notifications

L'admin cabinet configure les canaux de notification :

- **SMS** (Africa's Talking) — rappel J-1 automatique
- **WhatsApp** (Cloud API) — rappel J-1 alternatif
- **Email** (Resend) — confirmation de RDV

Le patient peut choisir ses canaux préférés dans son portail.

### Checklist

- [ ] Tous les médecins invités et ayant accepté
- [ ] Rôles attribués correctement
- [ ] Numéros de licence médicale renseignés (Ordre des Médecins CI)
- [ ] Horaires d'ouverture configurés par médecin
- [ ] Créneaux de RDV testés (30 min par défaut, ajustables)
- [ ] Canaux de notification testés (envoi d'un SMS de test)
- [ ] 2FA activée pour l'admin cabinet (TOTP Google Authenticator)

---

## Étape 4 — Go-live et support

**Objectif** : démarrer l'utilisation en production avec un support
rapproché pendant les 2 premières semaines.

### Pré-flight checks

Avant le go-live, vérifier :

- [ ] Imports patients validés (étape 2)
- [ ] Équipe configurée et formée (étape 3)
- [ ] Abonnement SaaS converti d'`essai` à `actif` (paiement premier mois)
- [ ] Configuration CinetPay testée en sandbox puis production
- [ ] Configuration Daily.co testée (1 téléconsultation de test)
- [ ] Configuration Africa's Talking testée (1 SMS de test)
- [ ] Configuration WhatsApp Business testée (1 template approuvé)
- [ ] Page de consentement patient affichée et validée
- [ ] Mentions légales et politique de confidentialité publiées
- [ ] Audit logs visibles dans le module Paramètres → Sécurité

### Formation équipe

| Rôle | Durée | Contenu |
|------|-------|---------|
| `admin_cabinet` | 2 h | Configuration, abonnement, audit, conformité |
| `medecin` | 1 h 30 | Patients, RDV, consultations, ordonnances, téléconsultation |
| `secretaire` | 1 h | RDV, patients, facturation Mobile Money |
| `comptable` | 1 h | Facturation, paiements, réconciliation, abonnement |
| `patient` | Auto-formation | Vidéo 5 min + FAQ portail patient |

### Support des 2 premières semaines

- **Canal Slack dédié** `#support-clinique-plateau` (équipe MediSaaS + admin cabinet).
- **Hotline** `+225 27 22 49 87 30` (heures ouvrées).
- **Revue hebdomadaire** : 30 min chaque vendredi pour analyser les KPIs
  (RDV créés, paiements encaissés, téléconsultations effectuées,
  erreurs rencontrées).

### KPIs de réussite (J+30)

| KPI | Cible |
|-----|-------|
| Patients actifs | ≥ 80 % des patients importés |
| RDV créés via MediSaaS | ≥ 70 % du volume total |
| Paiements encaissés via Mobile Money | ≥ 50 % des encaissements |
| Téléconsultations effectuées | ≥ 5 (si applicable) |
| Taux d'erreur < 1 % | Oui |
| Satisfaction équipe (NPS interne) | ≥ 7/10 |

### Conversion d'essai en abonnement payant

À J+12 (2 jours avant fin d'essai), l'admin cabinet reçoit :

1. Un email de rappel automatique.
2. Une notification dans le dashboard.
3. Un appel de l'équipe support MediSaaS.

Le passage en `actif` se fait via `Paramètres → Abonnement → Confirmer`
+ paiement Mobile Money.

### Procédure de résiliation (si nécessaire)

Si le cabinet décide de ne pas poursuivre :

1. L'admin cabinet clique sur `Résilier` dans `Paramètres → Abonnement`.
2. Modal de confirmation (pertes détaillées, raison, mention Loi 2013-450).
3. L'abonnement passe en `resilie` (effet en fin de période).
4. Les données patient sont conservées 10 ans (rétention légale) puis
   anonymisées.
5. Export FHIR complet proposé au cabinet avant résiliation.

---

## Checklist globale d'onboarding

À cocher par l'équipe support MediSaaS avant de marquer l'onboarding
comme **terminé** :

### Étape 1 — Création
- [ ] Compte créé
- [ ] Tenant créé avec bon préfixe
- [ ] Abonnement `essai` actif
- [ ] Admin cabinet promu

### Étape 2 — Import patients
- [ ] Fichier CSV reçu
- [ ] Import réussi (≥ 95 %)
- [ ] Codes patients générés
- [ ] Données vérifiées par le médecin référent

### Étape 3 — Équipe
- [ ] Tous les utilisateurs invités et ayant rejoint
- [ ] Rôles attribués
- [ ] Horaires configurés
- [ ] Notifications testées
- [ ] 2FA admin activée

### Étape 4 — Go-live
- [ ] Pré-flight checks OK
- [ ] Formation dispensée
- [ ] Canal Slack créé
- [ ] Abonnement converti en `actif`
- [ ] Première revue J+7 programmée
- [ ] Revue J+30 programmée

### Conformité
- [ ] Consentement patient documenté
- [ ] Politique de confidentialité publiée
- [ ] Mentions légales visibles
- [ ] Audit logs fonctionnels
- [ ] DPA CinetPay/Daily.co/AWS signés et archivés
- [ ] Registre des traitements initialisé (`docs/CONFORMITY.md`)

---

## Contact support

- **Email** : support@medisaas.ci
- **Téléphone** : +225 27 22 49 87 30 (lun-ven, 8h–18h GMT)
- **Slack** : `#support-{slug-tenant}`
- **Documentation** : `https://docs.medisaas.ci`
- **Status** : `https://status.medisaas.ci`
