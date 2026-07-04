# Conformité — Loi ivoirienne n°2013-450 & ARTCI

> Mapping exhaustif des exigences réglementaires vers l'implémentation
> MediSaaS CI. Document de référence pour les audits ARTCI et les
> demandes d'agrément.

## 1. Cadre juridique

### Loi n°2013-450 du 19 août 2013

La **Loi n°2013-450** relative à la protection des données à caractère
personnel est le texte fondateur de la protection des données en Côte
d'Ivoire. Elle transpose les principes de la Convention de Malabo (2014)
et s'aligne sur les standards internationaux (RGPD-like).

**Principes fondamentaux** :

1. **Légalité et loyauté** : les données ne sont collectées que pour un
   objectif médical explicite.
2. **Finalité** : gestion du dossier patient, soins, facturation.
3. **Minimisation** : seules les données nécessaires sont collectées.
4. **Exactitude** : le patient peut consulter et rectifier ses données.
5. **Conservation limitée** : 10 ans après le dernier contact (dossier médical).
6. **Sécurité** : chiffrement au repos + en transit + journalisation.
7. **Consentement** : le patient consent explicitement au traitement.

### ARTCI

L'**Autorité de Régulation des Télécommunications de Côte d'Ivoire**
veille à la conformité des traitements de données électroniques.
MediSaaS CI déclare ses traitements à l'ARTCI et coopère aux audits.

### Autorité de protection des données

La **ITIE-CI** (Commission Nationale de l'Informatique et des Libertés
de Côte d'Ivoire, en cours d'opérationnalisation) reçoit les
déclarations de traitement.

## 2. Registre des traitements

Conformément à l'article 27 de la Loi 2013-450, MediSaaS CI tient un
**registre des traitements** mis à jour à chaque évolution.

| Traitement | Finalité | Base légale | Données | Durée |
|------------|----------|-------------|---------|-------|
| Dossier patient numérique | Suivi médical | Consentement + intérêt légitime médical | Identité, antécédents, diagnostics, ordonnances | 10 ans post-dernier RDV |
| Prise de RDV | Organisation soins | Consentement | Nom, téléphone, motif (tronqué) | 2 ans post-RDV |
| Facturation | Obligation comptable | Obligation légale | Identité patient, prestations, paiements | 10 ans (comptables) |
| Téléconsultation | Consultation distante | Consentement | Vidéo/audio (E2E, non enregistré par défaut) | Session uniquement |
| Notifications SMS/WhatsApp | Rappel RDV | Consentement (opt-in) | Téléphone, date RDV | 6 mois |
| Journal d'audit | Traçabilité | Obligation légale | Action, utilisateur, IP, horodatage | 10 ans |
| Abonnement SaaS | Gestion client | Contrat | Identité cabinet, paiement | 5 ans post-résiliation |

## 3. Droits des patients

MediSaaS CI implémente les 5 droits garantis par la Loi 2013-450 :

### 3.1 Droit d'accès (art. 39)

Le patient peut consulter **l'intégralité** de son dossier médical via
le portail patient (`/patient`). L'accès est journalisé dans `audit_logs`.

```http
GET /api/patients/me
Authorization: Bearer <JWT patient>
```

Le patient reçoit une copie exportable (PDF) sur demande via
`POST /api/patients/me/export`.

### 3.2 Droit de rectification (art. 40)

Le patient peut demander la correction d'une donnée inexacte. La
demande est traitée par le médecin ou l'admin cabinet :

```http
PATCH /api/patients/:id
Authorization: Bearer <JWT medecin>
```

L'ancienne valeur est conservée dans `audit_logs.old_data`.

### 3.3 Droit d'opposition (art. 41)

Le patient peut s'opposer au traitement de ses données pour les
finalités non obligatoires (ex. : notifications SMS). Le champ
`patients.sms_consent` permet ce contrôle.

```http
PATCH /api/patients/me
{ "smsConsent": false }
```

### 3.4 Droit à l'effacement (droit à l'oubli) (art. 42)

Limité pour les données médicales (obligation de conservation 10 ans).
MediSaaS CI applique :

- **Effacement immédiat** : données non médicales (email marketing, etc.)
- **Anonymisation** : données médicales après 10 ans post-dernier RDV
  (le `tenant_id` et les identifiants directs sont supprimés, seuls les
  éléments cliniques agrégés sont conservés pour recherche).

### 3.5 Droit à la portabilité (art. 43)

Le patient peut exporter son dossier au format **HL7 FHIR** ou **JSON**
via :

```http
GET /api/patients/me/export?format=fhir
```

## 4. Consentement

### Recueil du consentement

À la création du compte patient (onboarding cabinet ou auto-inscription),
un consentement explicite est recueilli pour chaque finalité :

| Finalité | Champ base | Recueilli par |
|----------|------------|---------------|
| Soins médicaux | obligatoire (implied) | Médecin |
| Notifications SMS | `sms_consent` | Formulaire patient |
| Notifications WhatsApp | `whatsapp_consent` | Formulaire patient |
| Téléconsultation | `teleconsult_consent` | Avant chaque session |
| Recherche agrégée | `research_consent` | Formulaire patient |

### Preuve de consentement

Chaque consentement est :

- **Horodaté** (`consented_at`)
- **Signé** (hash du contenu du texte de consentement)
- **Versionné** (lien vers la version du texte legal au moment du consentement)
- **Journalisé** dans `audit_logs` avec `action = 'consent.grant'`

### Retrait du consentement

Le patient peut retirer son consentement à tout moment via le portail.
Les notifications sont immédiatement interrompues. Les données déjà
collectées restent soumises à la rétention légale.

## 5. Rétention des données

| Type de donnée | Durée de rétention | Source légale |
|----------------|--------------------|---------------|
| Dossier médical (DPN) | 10 ans post-dernier RDV | Loi 2013-450 + code de déontologie médicale |
| Factures | 10 ans | Code de commerce ivoirien |
| Journal d'audit | 10 ans | Loi 2013-450 (traçabilité) |
| Logs applicatifs | 90 jours | Bonnes pratiques sécurité |
| Notifications SMS/WhatsApp envoyées | 6 mois | Minimisation |
| Backups base de données | 30 jours (PITR) + 14 jours (snapshots) | Reprise après sinistre |
| Cookies analytiques | 13 mois | Loi 2013-450 + ePrivacy |

### Politique de purge

Un job `pg_cron` (Supabase Scheduled Functions) s'exécute chaque nuit :

```sql
-- Exemple : anonymisation des dossiers > 10 ans
select cron.schedule(
  'anonymize-old-patients',
  '0 2 * * *',
  $$
    update patients
    set first_name = 'ANONYMIZED',
        last_name = 'ANONYMIZED',
        phone = null,
        email = null,
        address = null,
        status = 'archive'
    where updated_at < now() - interval '10 years'
      and status <> 'archive';
  $$
);
```

## 6. Journal d'audit (audit_logs)

### Événements journalisés

| Action | Déclencheur | Conformité |
|--------|-------------|------------|
| `patient.create` | INSERT patient | Traçabilité création DPN |
| `patient.update` | UPDATE patient | Traçabilité modification DPN |
| `patient.delete` | DELETE patient | Traçabilité suppression DPN |
| `patient.view` | SELECT détail patient | Traçabilité accès DPN |
| `prescription.create` | INSERT ordonnance | Traçabilité prescriptions |
| `prescription.update` | UPDATE ordonnance | Traçabilité modifications |
| `prescription.delete` | DELETE ordonnance | Traçabilité suppressions |
| `payment.success` | Webhook CinetPay confirmé | Traçabilité financière |
| `payment.failed` | Webhook CinetPay échoué | Anti-fraude |
| `teleconsultation.start` | Webhook Daily.co | Traçabilité téléconsultation |
| `teleconsultation.end` | Webhook Daily.co | Durée, participants |
| `sms.reminder.sent` | Cron SMS | Preuve envoi notification |
| `whatsapp.reminder.sent` | Appel API WhatsApp | Preuve envoi notification |
| `consent.grant` | Formulaire consentement | Preuve consentement |
| `consent.withdraw` | Retrait consentement | Preuve retrait |
| `auth.login` | Connexion utilisateur | Sécurité |
| `auth.logout` | Déconnexion | Sécurité |
| `export.patient` | Export dossier patient | Droit d'accès exercé |

### Structure de l'audit log

```sql
create table audit_logs (
  id          uuid primary key,
  tenant_id   uuid,
  user_id     uuid,
  action      text not null,         -- 'patient.update'
  entity      text,                  -- 'patients'
  entity_id   text,                  -- id de la ligne
  ip          text,
  user_agent  text,
  metadata    jsonb,                 -- contexte additionnel
  old_data    jsonb,                 -- avant (UPDATE/DELETE)
  new_data    jsonb,                 -- après (INSERT/UPDATE)
  created_at  timestamptz not null default now()
);
```

### Trigger d'audit automatique

```sql
-- Voir supabase/migrations/20240115101000_audit_trigger.sql
create trigger trg_patients_audit_update
  after update on patients
  for each row execute function public.audit_log_change();
```

Le trigger capture automatiquement `old_data`, `new_data`, l'utilisateur
courant (`auth.uid()`) et le tenant (`get_current_tenant_id()`).

### Accès au journal d'audit

- **Lecture** : `admin_cabinet`, `comptable`, `super_admin` (via `/api/audit/logs`)
- **Écriture** : triggers uniquement (les applications ne peuvent pas écrire directement)
- **Purge** : job `pg_cron` avec rôle `service_role` (bypass RLS), rétention 10 ans
- **Export** : CSV signé numériquement (PAdES) pour audit ARTCI

## 7. Chiffrement

### Au repos

| Donnée | Algorithme | Mécanisme |
|--------|------------|-----------|
| Diagnostic, notes médicales | AES-256 (pgcrypto) | `encrypt_medical_data()` |
| Backups PostgreSQL | AES-256 | AWS RDS encryption |
| Fichiers patients (S3) | SSE-KMS | Clé gérée AWS KMS |
| Mots de passe | bcrypt (cost 12) | Supabase Auth |

### En transit

| Communication | Protocole |
|---------------|-----------|
| Navigateur ↔ Web | TLS 1.3 (HSTS, certificat Let's Encrypt) |
| Web ↔ API | TLS 1.3 |
| API ↔ DB | SSL PostgreSQL (`sslmode=require`) |
| Webhooks partenaires | HTTPS + HMAC SHA-256 |
| Téléconsultation | DTLS-SRTP (Daily.co E2E) |

### Gestion des clés

- **Clé AES-256 médicale** : stockée dans AWS KMS `af-south-1`, rotation
  annuelle. Re-chiffrement de la base via `rotate_medical_encryption()`.
- **Clés JWT** : rotation semestrielle (Supabase Auth).
- **Clés webhook** : stockées en clair dans AWS Secrets Manager (rotation
  coordonnée avec les partenaires).

## 8. Hébergement africain

### Article 41 de la Loi 2013-450

> « Le transfert de données à caractère personnel vers un État non
> membre de la CEDEAO est subordonné à une autorisation préalable de
> l'autorité de protection des données. »

### Implémentation MediSaaS CI

- **Base de données** : Supabase sur AWS `af-south-1` (Le Cap, Afrique du Sud — membre CEDEAO/CEN-SAD).
- **API** : AWS ECS Fargate `af-south-1`.
- **Web** : Vercel (edge globale, mais aucune donnée patient n'est
  stockée hors `af-south-1` — Vercel ne sert que le front rendu).
- **Backups** : S3 `af-south-1` + réplication `eu-west-1` (UE — accord
  de transfert prévu).

### Accords de transfert

| Destination | Donnée | Accord |
|-------------|--------|--------|
| AWS `eu-west-1` (UE) | Backups DB | Clauses contractuelles types (CCT) + chiffrement |
| Daily.co (États-Unis) | Métadonnées session téléconsultation | DPA signé, données vidéo E2E non stockées |
| Meta Graph API (États-Unis) | Numéro téléphone patient pour WhatsApp | DPA + chiffrement en transit |
| Resend (États-Unis) | Email patient | DPA, contenu minimal |

## 9. Registre des violations

Conformément à l'article 53 de la Loi 2013-450, toute violation de
données doit être :

1. **Détectée** : alerte Sentry + CloudWatch + monitoring Supabase.
2. **Notifiée à l'ARTCI** sous 72 heures.
3. **Notifiée aux patients concernés** sous 72 heures si risque élevé.
4. **Documentée** dans `docs/incidents/YYYY-MM-DD-incident.md`.

## 10. Mapping exhaustif exigence → implémentation

| Article Loi 2013-450 | Exigence | Implémentation MediSaaS CI |
|----------------------|----------|-----------------------------|
| Art. 7 | Loyauté de la collecte | Formulaire patient avec mentions légales |
| Art. 9 | Minimisation | Schéma Prisma — seules les données médicales nécessaires |
| Art. 13 | Information du sujet | Page `/legal/privacy` + mention à l'onboarding |
| Art. 17 | Consentement | `consent_*` flags + audit `consent.grant` |
| Art. 27 | Registre des traitements | `docs/CONFORMITY.md` § 2 |
| Art. 31 | Sécurité | RLS + AES-256 + TLS 1.3 + 2FA admin |
| Art. 33 | Confidentialité | RBAC (6 rôles) + RLS multi-tenant |
| Art. 39 | Droit d'accès | `GET /api/patients/me` + export PDF/FHIR |
| Art. 40 | Droit de rectification | `PATCH /api/patients/:id` + audit |
| Art. 41 | Droit d'opposition | `sms_consent`, `whatsapp_consent` |
| Art. 42 | Droit à l'oubli | Anonymisation après 10 ans |
| Art. 43 | Portabilité | Export JSON/FHIR |
| Art. 45 | Conservation | 10 ans (DPN) + purge pg_cron |
| Art. 50 | Notification violation | Procédure 72h + registre incidents |
| Art. 53 | Sous-traitants | DPA CinetPay, Daily.co, AWS, Resend |
| Art. 56 | Audit | `audit_logs` + export ARTCI |

## 11. Procédure d'audit ARTCI

Lors d'un audit ARTCI, MediSaaS CI fournit :

1. Le présent document (`docs/CONFORMITY.md`).
2. Le registre des traitements (§ 2).
3. Les DPA signés avec les sous-traitants.
4. Un export du journal d'audit sur la période demandée (CSV signé).
5. La politique de sécurité (document interne `docs/SECURITY.md`).
6. La preuve de chiffrement (certificats KMS, configuration pgcrypto).
7. La politique de rétention et de purge (§ 5 + job pg_cron).
8. Les procédures d'incident (§ 9 + `docs/incidents/`).

## 12. Références

- Loi n°2013-450 du 19 août 2013 : https://www.droit-afrique.com/uploads/Cote-Ivoire-Loi-2013-450-donnees-personnelles.pdf
- Convention de Malabo (2014) : Convention de l'Union Africaine sur la cybersécurité et la protection des données.
- ARTCI : https://artci.ci
- Règlement Général sur la Protection des Données (RGPD UE) — utilisé comme référence comparative.
