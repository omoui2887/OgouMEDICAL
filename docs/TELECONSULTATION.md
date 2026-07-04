# Téléconsultation — Intégration Daily.co

> MediSaaS CI utilise **Daily.co** pour les téléconsultations vidéo
> chiffrées de bout en bout (E2E). Ce document décrit la création de
> salles, le consentement patient, la gestion des recordings et la
> conformité à la Loi ivoirienne n°2013-450.

## 1. Pourquoi Daily.co ?

| Critère | Daily.co | Justification |
|---------|----------|---------------|
| Chiffrement E2E | ✅ (option activable) | Loi 2013-450 — confidentialité des données de santé |
| WebRTC standard | ✅ | Aucun plugin requis côté patient |
| Latence Afrique | < 200 ms (CDN Johannesburg) | Expérience patient acceptable |
| Recordings | Désactivables par défaut | Loi 2013-450 — enregistrement vidéo interdit sans consentement explicite |
| API REST | ✅ | Création de salles programmatique |
| Webhooks | ✅ | Début/fin de session, participants |
| Prix | 0,003 $/min/participant | Compatible modèle SaaS |

## 2. Architecture

```
┌──────────────┐  1. Créer RDV téléconsultation   ┌──────────────┐
│  apps/web    │ ────────────────────────────────► │   apps/api   │
│ (médecin)    │                                   │  (NestJS)    │
└──────────────┘                                   └──────┬───────┘
                                                          │ 2. POST /v1/rooms
                                                          ▼
                                                   ┌──────────────┐
                                                   │   Daily.co   │
                                                   │   API        │
                                                   └──────┬───────┘
                                                          │ 3. room_url
                                                          ▼
┌──────────────┐  4. Rejoindre la salle          ┌──────────────┐
│  Patient &   │ ──────────────────────────────► │  Daily.co    │
│  Médecin     │ ◄────────── WebRTC E2E ────────► │  SFU/RTC     │
└──────────────┘                                   └──────┬───────┘
                                                          │ 5. Webhooks
                                                          ▼
                                                   ┌──────────────────┐
                                                   │  Edge Function   │
                                                   │  daily-webhook   │
                                                   └────────┬─────────┘
                                                            │ 6. Update DB
                                                            ▼
                                                   ┌──────────────────┐
                                                   │  Supabase DB     │
                                                   │  (audit_logs)    │
                                                   └──────────────────┘
```

## 3. Création de salles

### Endpoint API MediSaaS

```http
POST /api/teleconsultation/rooms
Authorization: Bearer <JWT medecin>
Content-Type: application/json

{
  "appointmentId": "00000000-0000-0000-0000-000000000202"
}
```

### Implémentation côté apps/api

```typescript
// apps/api/src/modules/teleconsultation/daily.service.ts
async function createRoom(appointmentId: string, tenantCode: string) {
  const roomName = `medisaas-${tenantCode}-${appointmentId.slice(0, 8)}`;

  const res = await fetch("https://api.daily.co/v1/rooms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: roomName,
      privacy: "private",                       // accès par token uniquement
      properties: {
        enable_screenshare: false,              // par défaut, médecin peut activer
        enable_chat: true,
        enable_recording: "local",              // DÉSACTIVÉ par défaut (Loi 2013-450)
        // exp: Math.floor(Date.now() / 1000) + 3600,  // expiration 1h
        enable_dialout: false,
        enable_prejoin_ui: true,
        start_video_off: false,
        start_audio_off: false,
        // Chiffrement E2E (Daily E2EE)
        enable_mesh_sfu: true,
        e2ee: true,
      },
    }),
  });

  const data = await res.json();
  return {
    roomUrl: data.url,
    roomName: data.name,
    e2ee: data.properties?.e2ee === true,
    recordingEnabled: false,
  };
}
```

### Réponse 201

```json
{
  "success": true,
  "data": {
    "roomUrl": "https://medisaas.daily.co/medisaas-cp-00000202",
    "roomName": "medisaas-cp-00000202",
    "e2eEncryption": true,
    "recordingEnabled": false,
    "expiresAt": "2024-01-16T15:30:00Z"
  }
}
```

## 4. Tokens d'accès (meeting tokens)

Chaque participant reçoit un **token signé** Daily.co avec un rôle
spécifique (`owner` pour le médecin, `participant` pour le patient) :

```typescript
async function createMeetingToken(roomName: string, isOwner: boolean) {
  const res = await fetch("https://api.daily.co/v1/meeting-tokens", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        is_owner: isOwner,
        exp: Math.floor(Date.now() / 1000) + 3600,  // 1h
        user_name: isOwner ? "Dr. Aya Kouassi" : "Patient",
      },
    }),
  });
  const data = await res.json();
  return data.token;
}
```

Le patient reçoit le `roomUrl` + `?t=<token>` par SMS/email sécurisé.
Le token expire après 1 heure.

## 5. Consentement patient

### Préalable obligatoire

Avant toute téléconsultation, le patient doit avoir consenti
explicitement (champ `patients.teleconsult_consent = true`). Le
consentement est recueilli :

1. **À l'inscription** (case à cocher obligatoire dans le portail patient).
2. **Avant chaque RDV téléconsultation** (modal de confirmation qui
   réaffiche les conditions : chiffrement E2E, pas d'enregistrement,
   données stockées en Afrique).

### Modal de consentement

```
┌─────────────────────────────────────────────────────────────┐
│  Téléconsultation — Consentement                            │
├─────────────────────────────────────────────────────────────┤
│  Vous êtes sur le point de débuter une téléconsultation     │
│  avec Dr. Aya Kouassi.                                      │
│                                                             │
│  • La session est chiffrée de bout en bout (E2E).           │
│  • Aucun enregistrement vidéo/audio ne sera effectué.       │
│  • Vos données restent en Afrique (AWS af-south-1).         │
│  • Vous pouvez interrompre la session à tout moment.        │
│                                                             │
│  Conformément à la Loi ivoirienne n°2013-450, vous          │
│  consentez à la collecte des métadonnées de session         │
│  (durée, horodatage) à des fins de traçabilité médicale.   │
│                                                             │
│  [ Refuser ]                              [ Accepter et rejoindre ] │
└─────────────────────────────────────────────────────────────┘
```

### Audit

Chaque consentement génère un audit log :

```json
{
  "action": "teleconsultation.consent",
  "entity": "appointment",
  "entity_id": "00000000-0000-0000-0000-000000000202",
  "metadata": {
    "consent_version": "2024-01",
    "patient_id": "00000000-0000-0000-0000-000000000102"
  }
}
```

## 6. Recordings

### Politique par défaut : DÉSACTIVÉS

Conformément à la Loi ivoirienne n°2013-450 (minimisation + confidentialité
des données de santé), les enregistrements vidéo sont **désactivés par
défaut** sur toutes les salles Daily.co créées par MediSaaS CI.

```typescript
properties: {
  enable_recording: "local",  // l'utilisateur peut enregistrer localement
                              // mais MediSaaS ne stocke rien côté serveur
  // cloud_recording: false,  // jamais activé
}
```

### Cas exceptionnel d'activation

L'enregistrement cloud ne peut être activé que :

1. Sur **demande explicite écrite** du patient (formulaire signé).
2. Pour des **motifs médicaux documentés** (expertise, seconde opinion).
3. Avec **consentement dual** (patient + médecin).
4. Stockage chiffré KMS, rétention limitée à 6 mois (sauf conservation
   médicale justifiée).
5. Audit log `teleconsultation.recording.start` obligatoire.

Cette procédure est **désactivée par défaut** dans le code MediSaaS CI
et nécessite l'intervention du support pour activation manuelle.

## 7. Webhooks Daily.co

### Événements gérés

L'Edge Function `supabase/functions/daily-webhook/index.ts` traite :

| Événement | Action MediSaaS |
|-----------|------------------|
| `meeting.started` | RDV → `en_cours`, audit `teleconsultation.start` |
| `meeting.ended` | RDV → `termine`, durée calculée, audit `teleconsultation.end` |
| `participant.joined` | Audit (optionnel, bruyant) |
| `participant.left` | Audit (optionnel) |
| `recording.started` | Alerte P1 (devrait être désactivé) + audit |
| `recording.available` | Notification admin + audit |

### Vérification de signature

```typescript
async function verifyDailySignature(rawBody, signature, secret) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const expected = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  return Array.from(new Uint8Array(expected))
    .map(b => b.toString(16).padStart(2, "0")).join("") === signature;
}
```

### Calcul de la durée

```typescript
if (payload.event === "meeting.ended") {
  const durationMin = Math.round((payload.payload?.duration ?? 0) / 60);
  await fetch(`${supabaseUrl}/rest/v1/appointments?id=eq.${appointmentId}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "termine",
      duration: durationMin || 30,
    }),
  });
}
```

## 8. Notes de consultation en direct

Pendant la téléconsultation, le médecin peut saisir des notes dans
l'interface MediSaaS (module Téléconsultation, panneau latéral). Ces
notes sont :

- **Chiffrées AES-256** avant insertion en base.
- **Sauvegardées en continu** (auto-save toutes les 10 secondes).
- **Visibles par le patient** via le portail (après fin de session).
- **Journalisées** dans `audit_logs`.

```http
PATCH /api/consultations/:id
{
  "notes": "Patient vue à domicile, tension 14/8. Ajustement posologique."
}
```

## 9. Archives et historique

### Table `consultations`

Chaque téléconsultation terminée génère une entrée dans `consultations`
liée à l'appointment :

```sql
INSERT INTO consultations (
  tenant_id, appointment_id, patient_id, doctor_id,
  symptoms, diagnosis, treatment, notes, created_at
) VALUES (...);
```

### Historique patient

Le patient voit l'historique de ses téléconsultations dans le portail
patient (`/patient/consultations`), avec :

- Date et durée
- Médecin
- Diagnostic (déchiffré via la vue `consultations_decrypted`)
- Ordonnances associées
- Compte-rendu PDF téléchargeable

## 10. Qualité de service

### Pré-requis réseau patient

- Débit descendant : ≥ 1 Mbps (vidéo SD) ou ≥ 2,5 Mbps (HD).
- Latence : < 300 ms vers `af-south-1`.
- Navigateur supporté : Chrome 90+, Firefox 88+, Safari 14+, Edge 90+.
- Caméra + micro autorisés dans le navigateur.

### Dégradation progressive

Daily.co adapte automatiquement la qualité en fonction de la bande
passante :

| Débit | Qualité vidéo | Audio |
|-------|---------------|-------|
| ≥ 2,5 Mbps | 720p | HD |
| 1–2,5 Mbps | 480p | HD |
| 0,5–1 Mbps | 360p | opus 16kHz |
| < 0,5 Mbps | Vidéo coupée | Audio seul |

### Mode fallback

Si WebRTC échoue (pare-feu restrictif), Daily.co bascule en mode
audio-only via WebSocket. MediSaaS affiche un message informatif au
patient.

## 11. Conformité

| Exigence Loi 2013-450 | Implémentation |
|----------------------|-----------------|
| Confidentialité des données de santé | Chiffrement E2E (Daily.co E2EE) |
| Minimisation | Pas de recording par défaut |
| Consentement | Modal préalable + audit `teleconsultation.consent` |
| Conservation limitée | Métadonnées : 10 ans (audit), vidéo : 0 par défaut |
| Hébergement africain | SFU Daily.co Johannesburg (proximité Afrique) |
| Droit d'accès | Consultations visibles par le patient dans son portail |
| Droit d'effacement | Anonymisation après 10 ans (téléconsultation incluse) |
| Traçabilité | Audit `teleconsultation.start` + `.end` + `.consent` |
| Notification violation | Procédure 72h si incident Daily.co |

## 12. Limites et quotas

| Paramètre | Valeur |
|-----------|--------|
| Durée max session | 2 heures |
| Participants max | 2 (médecin + patient) — extensible à 4 (interprète LSF, tuteur) |
| Salles simultanées par tenant | 50 (plan Pro), 200 (plan Entreprise) |
| Latence moyenne Afrique | 180 ms |
| Disponibilité Daily.co | 99,95 % |
