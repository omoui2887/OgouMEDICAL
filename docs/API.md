# Référence API — MediSaaS CI

> API REST du backend NestJS (`apps/api`). Base URL : `https://api.medisaas.ci`
> Authentification : Bearer JWT (Supabase Auth) + header `X-Tenant-Id`.

## Conventions

### Format de réponse unifié

Toutes les réponses suivent le format `ApiResponse<T>` :

```typescript
interface ApiResponse<T> {
  success: boolean;       // true si l'opération a réussi
  data?: T;               // données (absent si erreur)
  error?: {
    code: string;         // ex. "PATIENT_NOT_FOUND"
    message: string;      // message utilisateur en français
    details?: unknown;    // détails techniques (dev only)
  };
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    tenantId?: string;
    requestId?: string;
  };
}
```

### Exemple de succès

```json
{
  "success": true,
  "data": {
    "id": "00000000-0000-0000-0000-000000000101",
    "code": "CI-CP-0001",
    "firstName": "Aya",
    "lastName": "Kouassi"
  },
  "meta": {
    "requestId": "req_abc123",
    "tenantId": "00000000-0000-0000-0000-000000000001"
  }
}
```

### Exemple d'erreur

```json
{
  "success": false,
  "error": {
    "code": "PATIENT_NOT_FOUND",
    "message": "Patient introuvable dans votre cabinet."
  }
}
```

### Pagination

Les endpoints de liste acceptent :

| Param | Défaut | Description |
|-------|--------|-------------|
| `page` | 1 | Numéro de page |
| `pageSize` | 20 | Éléments par page (max 100) |
| `sort` | `createdAt:desc` | Tri `champ:asc|desc` |
| `search` | — | Recherche plein texte |

Réponse paginée :

```json
{
  "success": true,
  "data": [ /* ... */ ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 48
  }
}
```

### Codes d'erreur HTTP

| Code | Signification | Exemple |
|------|---------------|---------|
| 200 | Succès | `GET /patients` |
| 201 | Création réussie | `POST /patients` |
| 204 | Succès sans contenu | `DELETE /patients/:id` |
| 400 | Requête invalide | Payload mal formé |
| 401 | Non authentifié | JWT manquant ou expiré |
| 403 | Rôle insuffisant | `secretaire` accède à `/prescriptions` |
| 404 | Ressource introuvable | ID inexistant |
| 409 | Conflit | Doublon d'email |
| 422 | Erreur métier | Patient inactif ne peut pas recevoir d'ordonnance |
| 429 | Trop de requêtes | Rate limit |
| 500 | Erreur serveur | Bug interne (Sentry notifié) |

### Codes d'erreur métier

| Code | Description |
|------|-------------|
| `PATIENT_NOT_FOUND` | Patient introuvable |
| `APPOINTMENT_CONFLICT` | Conflit de créneau |
| `INVOICE_ALREADY_PAID` | Facture déjà payée |
| `PAYMENT_FAILED` | Paiement Mobile Money échoué |
| `TENANT_SUSPENDED` | Abonnement SaaS suspendu |
| `ROLE_FORBIDDEN` | Rôle insuffisant pour cette action |
| `RLS_VIOLATION` | Tentative d'accès cross-tenant |
| `CONSENT_REQUIRED` | Consentement patient requis (Loi 2013-450) |

### En-têtes standards

```
Authorization: Bearer <JWT>
X-Tenant-Id: <uuid>              # optionnel — dérivé du JWT par défaut
Content-Type: application/json
Accept-Language: fr              # messages d'erreur en français
X-Request-Id: <uuid>             # généré côté client pour tracing
```

---

## 1. Authentification

### `POST /api/auth/login`

Connexion utilisateur via Supabase Auth.

**Rôles** : public

**Body** :
```json
{ "email": "dr.kouassi@clinique-plateau.ci", "password": "••••••••" }
```

**Réponse 200** :
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "v1.MRU_...",
    "user": {
      "id": "00000000-0000-0000-0000-000000000010",
      "email": "dr.kouassi@clinique-plateau.ci",
      "name": "Dr. Aya Kouassi",
      "role": "medecin",
      "tenantId": "00000000-0000-0000-0000-000000000001",
      "tenantName": "Clinique du Plateau"
    }
  }
}
```

### `POST /api/auth/refresh`
Renouvelle l'access token. **Rôles** : authentifié.

### `POST /api/auth/logout`
Révoque la session Supabase. **Rôles** : authentifié.

### `POST /api/auth/forgot-password`
Envoie un email de réinitialisation (Resend). **Rôles** : public.

### `POST /api/auth/reset-password`
Réinitialise le mot de passe avec un token. **Rôles** : public.

---

## 2. Patients

### `GET /api/patients`
Liste paginée des patients du tenant.

**Rôles** : `super_admin`, `admin_cabinet`, `medecin`, `secretaire`

**Query params** : `search`, `commune`, `status`, `bloodType`, `page`, `pageSize`

**Réponse 200** :
```json
{
  "success": true,
  "data": [
    {
      "id": "00000000-0000-0000-0000-000000000101",
      "code": "CI-CP-0001",
      "firstName": "Aya",
      "lastName": "Kouassi",
      "gender": "F",
      "birthDate": "1989-04-12",
      "phone": "+225 07 11 22 33 44",
      "bloodType": "A+",
      "status": "actif"
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "total": 48 }
}
```

### `GET /api/patients/:id`
Détail d'un patient (Dossier Patient Numérique).

**Rôles** : `super_admin`, `admin_cabinet`, `medecin`, `secretaire`, `patient` (sa propre fiche uniquement)

### `POST /api/patients`
Crée un patient. Le `code` est généré automatiquement au format `CI-CP-NNNN`.

**Rôles** : `super_admin`, `admin_cabinet`, `medecin`, `secretaire`

**Body** :
```json
{
  "firstName": "Aya",
  "lastName": "Kouassi",
  "gender": "F",
  "birthDate": "1989-04-12",
  "phone": "+225 07 11 22 33 44",
  "commune": "Cocody",
  "bloodType": "A+"
}
```

### `PATCH /api/patients/:id`
Met à jour un patient. **Rôles** : `super_admin`, `admin_cabinet`, `medecin`, `secretaire`

### `DELETE /api/patients/:id`
Supprime (soft delete) un patient. **Rôles** : `super_admin`, `admin_cabinet`

---

## 3. Appointments (Rendez-vous)

### `GET /api/appointments`
Liste les RDV. Filtres : `date`, `doctorId`, `status`, `type`.

**Rôles** : `super_admin`, `admin_cabinet`, `medecin`, `secretaire`, `patient` (ses RDV)

### `POST /api/appointments`
Crée un RDV.

**Rôles** : `super_admin`, `admin_cabinet`, `medecin`, `secretaire`, `patient`

**Body** :
```json
{
  "patientId": "00000000-0000-0000-0000-000000000101",
  "doctorId": "00000000-0000-0000-0000-000000000010",
  "date": "2024-01-16T14:30:00+00:00",
  "duration": 30,
  "reason": "Consultation de routine",
  "type": "presentiel"
}
```

### `PATCH /api/appointments/:id`
Met à jour un RDV (statut, notes). Si `type = teleconsultation`, génère `roomUrl` Daily.co.

**Rôles** : `super_admin`, `admin_cabinet`, `medecin`, `secretaire`

### `DELETE /api/appointments/:id`
Annule un RDV (`status = annule`). **Rôles** : `super_admin`, `admin_cabinet`, `secretaire`

---

## 4. Medical Records (Consultations & Ordonnances)

### `GET /api/consultations`
Liste les comptes-rendus médicaux. **Rôles** : `super_admin`, `admin_cabinet`, `medecin`, `comptable`

### `POST /api/consultations`
Crée un compte-rendu. Le `diagnosis` et les `notes` sont chiffrés AES-256.

**Rôles** : `super_admin`, `admin_cabinet`, `medecin`

**Body** :
```json
{
  "appointmentId": "00000000-0000-0000-0000-000000000205",
  "patientId": "00000000-0000-0000-0000-000000000106",
  "doctorId": "00000000-0000-0000-0000-000000000010",
  "symptoms": "Douleurs thoraciques atypiques, fatigue",
  "diagnosis": "Hypertension artérielle mal équilibrée",
  "treatment": "Ajustement antihypertenseur, ECG de contrôle sous 48h",
  "vitalsTemp": 37.0,
  "vitalsTension": "16/9",
  "vitalsPulse": 88
}
```

### `GET /api/prescriptions`
Liste les ordonnances. Filtres : `patientId`, `doctorId`, `status`.

**Rôles** : `super_admin`, `admin_cabinet`, `medecin`, `patient` (ses ordonnances)

### `POST /api/prescriptions`
Émet une ordonnance. **Rôles** : `super_admin`, `admin_cabinet`, `medecin`

### `PATCH /api/prescriptions/:id`
Modifie une ordonnance active. **Rôles** : `super_admin`, `admin_cabinet`, `medecin`

### `POST /api/prescriptions/:id/renew`
Renouvelle une ordonnance (nouveau numéro, validité 30 jours). **Rôles** : `medecin`, `admin_cabinet`

---

## 5. Billing (Facturation & Paiements)

### `GET /api/invoices`
Liste les factures. Filtres : `status`, `method`, `patientId`.

**Rôles** : `super_admin`, `admin_cabinet`, `secretaire`, `comptable`, `patient` (ses factures)

### `POST /api/invoices`
Crée une facture (TVA 18 % CI calculée automatiquement).

**Rôles** : `super_admin`, `admin_cabinet`, `secretaire`, `comptable`

**Body** :
```json
{
  "patientId": "00000000-0000-0000-0000-000000000104",
  "items": [
    { "description": "Consultation gynécologique", "quantity": 1, "unitPrice": 25000 },
    { "description": "Échographie obstétricale", "quantity": 1, "unitPrice": 30000 }
  ]
}
```

### `GET /api/invoices/:id`
Détail d'une facture.

### `POST /api/invoices/:id/payments`
Initie un paiement Mobile Money via CinetPay.

**Rôles** : `secretaire`, `comptable`, `patient`

**Body** :
```json
{
  "amount": 64900,
  "method": "orange_money",
  "phone": "+225 07 22 33 44 55"
}
```

**Réponse 200** :
```json
{
  "success": true,
  "data": {
    "paymentId": "00000000-0000-0000-0000-000000000601",
    "providerTransactionId": "CINETPAY-TX-202401101530001",
    "checkoutUrl": "https://checkout.cinetpay.com/..."
  }
}
```

### `POST /api/invoices/:id/refund`
Rembourse un paiement. **Rôles** : `admin_cabinet`, `comptable`

---

## 6. Teleconsultation

### `POST /api/teleconsultation/rooms`
Crée une salle Daily.co chiffrée E2E pour un RDV.

**Rôles** : `medecin`, `admin_cabinet`

**Body** : `{ "appointmentId": "..." }`

**Réponse 201** :
```json
{
  "success": true,
  "data": {
    "roomUrl": "https://medisaas.daily.co/ci-cp-cardio-20240116",
    "roomName": "ci-cp-cardio-20240116",
    "e2eEncryption": true,
    "recordingEnabled": false
  }
}
```

### `GET /api/teleconsultation/sessions`
Historique des sessions de téléconsultation. **Rôles** : `medecin`, `admin_cabinet`, `comptable`

Voir [TELECONSULTATION.md](./TELECONSULTATION.md) pour le détail.

---

## 7. Notifications

### `POST /api/notifications/sms`
Envoie un SMS via Africa's Talking (rarement appelé directement — le cron s'en charge).

**Rôles** : `admin_cabinet`

### `POST /api/notifications/whatsapp`
Envoie un message WhatsApp Business template.

**Rôles** : `admin_cabinet`

### `GET /api/notifications/templates`
Liste les templates disponibles. **Rôles** : `admin_cabinet`

---

## 8. Analytics

### `GET /api/analytics/dashboard`
KPIs agrégés pour le tableau de bord.

**Rôles** : `super_admin`, `admin_cabinet`, `comptable`

**Query** : `period=30d|90d|12m`

**Réponse 200** :
```json
{
  "success": true,
  "data": {
    "revenue": { "total": 1198290, "trend": 12.5 },
    "appointments": { "total": 512, "completionRate": 0.87 },
    "patients": { "total": 1240, "newThisMonth": 42 },
    "paymentDistribution": [
      { "method": "orange_money", "percentage": 48 },
      { "method": "wave", "percentage": 27 }
    ]
  }
}
```

### `GET /api/analytics/revenue`
Série temporelle des revenus (12 mois). **Rôles** : `super_admin`, `admin_cabinet`, `comptable`

### `GET /api/analytics/doctors`
Performance par médecin. **Rôles** : `admin_cabinet`

---

## 9. Subscriptions (Abonnements SaaS)

### `GET /api/subscriptions`
Abonnement du tenant courant. **Rôles** : `super_admin`, `admin_cabinet`, `comptable`

### `POST /api/subscriptions/upgrade`
Change de plan (Essentiel → Pro → Entreprise). **Rôles** : `admin_cabinet`

### `POST /api/subscriptions/cancel`
Résilie l'abonnement (effet en fin de période). **Rôles** : `admin_cabinet`

### `GET /api/subscriptions/invoices`
Historique de facturation SaaS (6 derniers mois). **Rôles** : `admin_cabinet`, `comptable`

---

## 10. Audit

### `GET /api/audit/logs`
Liste paginée des entrées du journal d'audit.

**Rôles** : `super_admin`, `admin_cabinet`, `comptable`

**Filtres** : `userId`, `action`, `entity`, `startDate`, `endDate`

### `GET /api/audit/logs/:id`
Détail d'une entrée d'audit (avec `old_data` / `new_data`).

### `GET /api/audit/export`
Export CSV du journal d'audit (période max 90 jours). **Rôles** : `admin_cabinet`

---

## Rate limiting

| Scope | Limite | Fenêtre |
|-------|--------|---------|
| IP publique | 100 req | 1 min |
| Utilisateur authentifié | 1000 req | 1 min |
| `POST /api/auth/login` | 5 tentatives | 15 min (anti-brute-force) |
| `POST /api/invoices/:id/payments` | 10 | 1 min |
| `POST /api/notifications/*` | 30 | 1 min |

Au-delà de la limite : HTTP 429 avec header `Retry-After`.

## Versionnement

- URL prefixée par version : `/api/v1/...`
- Changements cassants → bump de version + déprécation 6 mois.
- Changelog publié dans `docs/CHANGELOG.md`.
