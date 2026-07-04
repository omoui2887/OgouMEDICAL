# Intégration Mobile Money — CinetPay

> MediSaaS CI agrège les paiements Mobile Money ivoiriens via **CinetPay**,
> qui fournit une API unifiée pour Orange Money, Wave, MTN Money et Carte
> Bancaire. Ce document décrit l'intégration technique, les flux de
> paiement, la gestion des échecs, les remboursements et la réconciliation.

## 1. Pourquoi CinetPay ?

| Méthode | Part de marché CI (2024) | Disponibilité CinetPay |
|---------|--------------------------|--------------------------|
| Orange Money | ~45 % | ✅ |
| Wave | ~30 % | ✅ |
| MTN MoMo | ~20 % | ✅ |
| Moov Money | ~3 % | ✅ |
| Carte bancaire (Visa/Mastercard) | ~2 % | ✅ |

**Avantages** :

- API unifiée → une seule intégration pour 5 moyens de paiement.
- Webhooks signés HMAC → sécurité.
- Tableau de bord marchand (reconciliation, exports).
- Agrément BCEAO en tant qu'agrégateur de paiement.

## 2. Architecture

```
┌──────────────┐    1. Initier paiement        ┌──────────────┐
│  apps/web    │ ────────────────────────────► │   apps/api   │
│ (portail)    │                               │  (NestJS)    │
└──────────────┘                               └──────┬───────┘
                                                       │ 2. POST /v2/payment
                                                       ▼
                                                ┌──────────────┐
                                                │   CinetPay   │
                                                │   Checkout   │
                                                └──────┬───────┘
                                                       │ 3. URL checkout
                                                       ▼
┌──────────────┐    4. Patient paie         ┌──────────────┐
│  Patient     │ ◄────────────────────────  │  Page        │
│ (téléphone)  │ ──────────────────────────► │  CinetPay    │
└──────────────┘                              └──────┬───────┘
                                                     │ 5. Webhook POST
                                                     ▼
                                              ┌──────────────────┐
                                              │  Edge Function   │
                                              │ cinetpay-webhook │
                                              └────────┬─────────┘
                                                       │ 6. Confirm + update DB
                                                       ▼
                                              ┌──────────────────┐
                                              │  Supabase DB     │
                                              │  (RLS + audit)   │
                                              └────────┬─────────┘
                                                       │ 7. SMS patient
                                                       ▼
                                              ┌──────────────────┐
                                              │ Africa's Talking │
                                              └──────────────────┘
```

## 3. Flux de paiement détaillé

### Étape 1 — Initiation (côté apps/api)

Le patient clique sur « Payer » depuis le portail patient ou la
secrétaire initie un encaissement :

```typescript
// apps/api/src/modules/billing/cinetpay.service.ts
async function initiatePayment(invoiceId: string, amount: number, phone: string, method: string) {
  const transactionId = `MEDISAAS-${invoiceId}-${Date.now()}`;

  const res = await fetch("https://api-checkout.cinetpay.com/v2/payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apikey: process.env.CINETPAY_API_KEY,
      site_id: process.env.CINETPAY_SITE_ID,
      transaction_id: transactionId,
      amount,                            // FCFA, entier
      currency: "XOF",
      channels: methodToChannel(method), // "ORANGE_MONEY" | "WAVE" | ...
      customer_phone: phone,
      description: `Facture MediSaaS ${invoiceId}`,
      metadata: { invoice_id: invoiceId, tenant_id: getCurrentTenantId() },
      notify_url: `${process.env.API_URL}/webhooks/cinetpay`,
      return_url: `${process.env.WEB_URL}/patient/billing?status=success`,
    }),
  });

  const data = await res.json();
  return {
    paymentId: data.payment_id,
    checkoutUrl: data.payment_url,
    transactionId,
  };
}
```

### Étape 2 — Redirection patient

Le frontend redirige vers `checkoutUrl`. Le patient saisit son code
Mobile Money sur la page hébergée par CinetPay (PCI-DSS).

### Étape 3 — Webhook de confirmation

CinetPay appelle `notify_url` (l'Edge Function
`supabase/functions/cinetpay-webhook/index.ts`) avec un payload :

```json
{
  "transaction_id": "MEDISAAS-xxx-1700000000",
  "status": "ACCEPTED",
  "amount": 64900,
  "currency": "XOF",
  "payment_method": "ORANGE_MONEY",
  "customer_phone": "+225 07 22 33 44 55",
  "customer_name": "Konan Brou",
  "metadata": {
    "invoice_id": "00000000-0000-0000-0000-000000000501",
    "tenant_id": "00000000-0000-0000-0000-000000000001"
  }
}
```

### Étape 4 — Vérification anti-fraude

L'Edge Function ne fait **jamais** confiance au webhook seul. Elle
appelle systématiquement l'API CinetPay `/payment/check` pour
confirmer :

```typescript
const confirmation = await confirmWithCinetPay(
  payload.transaction_id,
  process.env.CINETPAY_API_KEY,
  process.env.CINETPAY_SITE_ID
);
if (!confirmation.ok || confirmation.amount !== payload.amount) {
  // Possible usurpation — rejeter
  return json({ error: "Incohérence détectée" }, 400);
}
```

### Étape 5 — Mise à jour base de données

```sql
UPDATE payments
SET status = 'reussi',
    phone = '+225 07 22 33 44 55',
    payer_name = 'Konan Brou',
    method = 'orange_money'
WHERE provider = 'MEDISAAS-xxx-1700000000';

UPDATE invoices
SET status = 'payee'
WHERE id = '00000000-0000-0000-0000-000000000501';
```

### Étape 6 — Notification patient

SMS de confirmation envoyé via Africa's Talking :

```
MediSaaS CI : Paiement de 64 900 FCFA confirmé pour la facture
FAC-2024-0001. Merci.
```

### Étape 7 — Journalisation

Audit log `payment.success` écrit dans `audit_logs` avec
`metadata = { transaction_id, amount, method }`.

## 4. Sécurité des webhooks

### Vérification de signature

Chaque webhook CinetPay inclut un header `X-CinetPay-Signature`
(HMAC SHA-256 du corps de la requête avec un secret partagé).

```typescript
async function verifySignature(rawBody: string, signature: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const expected = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expectedHex = Array.from(new Uint8Array(expected))
    .map(b => b.toString(16).padStart(2, "0")).join("");
  return expectedHex === signature;
}
```

### Idempotence

Le `transaction_id` CinetPay est unique. La table `payments.provider`
est indexée et possède une contrainte d'unicité (au niveau applicatif) :
un même `transaction_id` reçu deux fois ne déclenche qu'une seule mise
à jour.

### IP allowlist

L'Edge Function peut (optionnellement) vérifier l'IP source contre la
liste des IP CinetPay publiées par l'agrégateur. Recommandé en
production.

## 5. Gestion des échecs

### Statuts possibles d'un paiement

| Statut CinetPay | Statut MediSaaS | Action |
|------------------|-----------------|--------|
| `ACCEPTED` | `reussi` | Facture → `payee` |
| `REFUSED` | `echoue` | Notification patient + retry possible |
| `PENDING` | `en_attente` | Attente webhook final (max 30 min) |
| `CANCELLED` | `echoue` | Aucune action côté patient |

### Retry automatique patient

En cas d'échec (`REFUSED`), le patient peut réessayer depuis le
portail. MediSaaS n'applique pas de pénalité. Un délai de 30 secondes
entre les tentatives évite le brute-force.

### Expiration des paiements en attente

Un job cron quotidien (`supabase/functions/`) marque les paiements
`en_attente` de plus de 24 heures en `echoue` :

```sql
UPDATE payments
SET status = 'echoue'
WHERE status = 'en_attente'
  AND date < now() - interval '24 hours';
```

## 6. Remboursements

### Procédure

1. L'admin cabinet ou le comptable initie un remboursement depuis le
   détail d'une facture payée.
2. L'API appelle CinetPay `/v2/payment/refund` :

```typescript
async function refundPayment(transactionId: string, amount: number, reason: string) {
  const res = await fetch("https://api-checkout.cinetpay.com/v2/payment/refund", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.CINETPAY_API_KEY}`,
    },
    body: JSON.stringify({
      transaction_id: transactionId,
      amount,
      reason,
    }),
  });
  return res.json();
}
```

3. CinetPay envoie un webhook de confirmation (type `REFUND_CONFIRMED`).
4. MediSaaS met à jour `payments.status = 'rembourse'` et
   `invoices.status = 'partielle'` ou `'impayee'` selon le montant
   remboursé.

### Limites

- Remboursement possible sous **30 jours** après le paiement.
- Montant maximum : montant initial du paiement.
- Les frais Mobile Money ne sont pas remboursés par les opérateurs.

## 7. Réconciliation

### Quotidienne

Chaque nuit à 03h00 UTC, un job compare les paiements MediSaaS avec
l'export CSV de la console CinetPay :

| Écart | Action |
|-------|--------|
| Paiement CinetPay non présent en base | Alerte Slack P1 (webhook potentiellement manqué) |
| Paiement en base `reussi` mais absent CinetPay | Alerte P0 (possible usurpation) |
| Montant différent | Alerte P1 |

### Mensuelle

Le comptable génère un rapport de réconciliation :

```http
GET /api/billing/reconciliation?month=2024-01
```

```json
{
  "success": true,
  "data": {
    "period": "2024-01",
    "totalCinetPay": 452300,
    "totalMediSaaS": 452300,
    "discrepancy": 0,
    "transactions": 14,
    "byMethod": {
      "orange_money": { "count": 7, "amount": 230000 },
      "wave":         { "count": 4, "amount": 152300 },
      "mtn_money":    { "count": 3, "amount": 70000 }
    }
  }
}
```

## 8. Webhooks de sécurité

CinetPay envoie plusieurs types de webhooks :

| Type | Trigger | Action MediSaaS |
|------|---------|------------------|
| `PAYMENT_CONFIRMED` | Paiement accepté | Marquer facture `payee` + SMS |
| `PAYMENT_FAILED` | Paiement refusé | Marquer paiement `echoue` + log |
| `REFUND_CONFIRMED` | Remboursement effectué | Marquer paiement `rembourse` |
| `DISPUTE_OPENED` | Litige client ouvert | Alerte P1 + gel facture |
| `DISPUTE_RESOLVED` | Litige résolu | Mise à jour statut |
| `FRAUD_ALERT` | Détection fraude CinetPay | Blocage immédiat + audit |

Chaque type est géré par l'Edge Function
`cinetpay-webhook/index.ts` (branchement par champ `event` du payload).

## 9. Limites et quotas CinetPay

| Paramètre | Valeur |
|-----------|--------|
| Montant min par transaction | 100 FCFA |
| Montant max par transaction | 1 500 000 FCFA (Mobile Money) |
| Quota journalier marchand | 50 000 000 FCFA (extensible) |
| Latence moyenne webhook | < 5 secondes |
| Tentatives de webhook | 5 (backoff exponentiel 30s, 1m, 5m, 15m, 1h) |

## 10. Test (sandbox)

CinetPay fournit un environnement sandbox :

```bash
CINETPAY_API_KEY=sandbox_xxx
CINETPAY_SITE_ID=9999999
CINETPAY_BASE_URL=https://api-checkout-sandbox.cinetpay.com/v2
```

Comptes de test :

| Méthode | Téléphone | Code |
|---------|-----------|------|
| Orange Money | 0700000000 | 0000 |
| Wave | 0700000001 | (validation auto) |
| MTN Money | 0700000002 | 0000 |
| Carte bancaire | 4242 4242 4242 4242 | 123 |

## 11. Conformité

- **Agrément BCEAO** : CinetPay est agréé en tant qu'Établissement de
  Monnaie Électronique (EME) — les fonds des patients transitent par
  un compte séquestre.
- **PCI-DSS** : MediSaaS CI ne stocke **jamais** de données de carte
  bancaire. Toute la saisie CB se fait sur les pages CinetPay.
- **Loi 2013-450** : chaque paiement génère un audit log
  (`payment.success` / `payment.failed`) avec IP, user-agent, horodatage.
- **TVA 18 % CI** : les factures MediSaaS appliquent automatiquement la
  TVA de 18 % sur les prestations médicaux imposables.
