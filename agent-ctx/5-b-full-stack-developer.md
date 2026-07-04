# Task 5-b — Portail patient prise de RDV en ligne (OTP Africa's Talking)

Agent : full-stack-developer (portail patient RDV)
Périmètre : Composant `PatientBooking` (wizard 4 étapes) + intégration au `AuthRouter` + boutons d'accès sur la landing.

## Fichiers produits / modifiés

| Fichier | Action | Rôle |
| --- | --- | --- |
| `src/components/medisisaas/auth/patient-booking.tsx` | CRÉÉ | Wizard 4 étapes : téléphone → OTP → médecin+créneau → confirmation |
| `src/lib/store.ts` | MODIFIÉ | `AuthScreen` étendu avec `"booking"` |
| `src/components/medisisaas/auth/auth-router.tsx` | MODIFIÉ | `case "booking": return <PatientBooking />;` + import |
| `src/components/medisisaas/landing-page.tsx` | MODIFIÉ | Boutons "Prendre RDV" (Header desktop + mobile + Hero CTA secondaire) |

## Stack & contrats respectés

- Next.js 16 + TypeScript + Tailwind 4 + shadcn/ui (New York).
- shadcn utilisés : `Card`, `Button`, `Input`, `Label`, `Checkbox`, `Progress`, `Separator`, `Alert`, `Badge`, `Calendar`, `Popover`, `RadioGroup`, `InputOTP` (6 cases).
- `sonner` pour toasts. `lucide-react` pour icônes. `date-fns/locale/fr` pour le calendrier FR.
- Palette médicale : teal-600 primary, emerald succès, orange accent, amber démo, rose erreur. Aucun indigo/bleu hors palette.
- Pas de `useMemo`/`useCallback` superflus (cooldown via `useRef` + fonction classique).
- 100% français, contexte ivoirien (TENANT Clinique du Plateau Cocody Abidjan, médecins ivoiriens, formatage FR virgule).

## API consommées

- `POST /api/appointments/otp/send` body `{ phone }` → `{ success, message, demoCode? }` (démo).
- `POST /api/appointments/otp/verify` body `{ phone, code }` → `{ success, verified, phone }`.
- `GET /api/appointments/slots?doctorId=&date=YYYY-MM-DD` → `{ slots: [{ time, available }] }`.
- `POST /api/appointments` body `{ patientId, doctorId, appointmentDate, startTime, endTime, type, motif, sendSmsConfirmation }` → `{ success, appointment, smsSent }`.

## Flux du wizard

1. **Téléphone** — input +225 07/05/01/27 XX XX XX XX + checkbox consentement SMS Loi 2013-450 obligatoire → `POST /otp/send`. En dev : Alert amber affichant `demoCode` pour faciliter le test. Cooldown 60s démarré.
2. **OTP** — `InputOTP` 6 cases + texte "Entrez le code à 6 chiffres envoyé au {phone}" + bouton "Vérifier" → `POST /otp/verify`. Lien "Renvoyer le code" (cooldown affiché), "Changer de numéro" → retour étape 1.
3. **Médecin + créneau** — grille de cards DOCTORS (avatar, nom, spécialité, rating étoiles) + `Calendar` FR (dimanches + dates passées désactivées) + grille créneaux fetch via `/slots` (dispo = primary, occupé = gris line-through) + `RadioGroup` 4 types (Consultation/Suivi/Téléconsultation/Urgence avec icônes) + motif optionnel. Bouton "Continuer" désactivé tant que tout n'est pas choisi.
4. **Confirmation** — récap (médecin, date, heure, type, motif, cabinet) + Alert rappel SMS → `POST /api/appointments` avec `sendSmsConfirmation: true`. Écran succès : CheckCircle verte + récap + boutons "Recevoir le récap par SMS" (toast) + "Terminer" (→ `hideAuth()`).

## Barre de progression

4 étapes numérotées en haut : Téléphone → Vérification → Médecin & créneau → Confirmation. Étape active = pastille primary, validée = pastille emerald + Check, à venir = muted. `Progress` shadcn en dessous avec `value = ((step-1)/3)*100`. Navigation libre vers étapes déjà validées.

## Helpers locaux

- `isValidIvorianPhone(phone)` — regex `/^(\+225)?(07|05|01|27)\d{8}$/` sur version sans espaces.
- `toDateKey(date)` — `YYYY-MM-DD` local sans décalage UTC.
- `computeEndTime(start)` — ajoute 30 min à `HH:MM`.
- `resolvePatientId(phone)` — matche `PATIENTS` par téléphone ou fallback `pat_1` (pour la démo).
- `formatRating(n)` — `4.9` → `4,9` (virgule FR).

## Layout

Layout dédié plein écran (pas `AuthShell`, car le contenu est plus large : grille de médecins + calendrier + grille créneaux) — overlay `fixed inset-0 z-50` avec fond médical dégradé `from-sky-50 via-white to-emerald-50`, halos cyan/emerald, `medical-grid`. Header sticky avec `Brand` + nom du cabinet + bouton `X` (→ `hideAuth()`). Footer conformité (Loi 2013-450 + SMS Africa's Talking + TENANT.phone) sur les 4 étapes.

## Intégration landing

- `LandingPage` : `handleBooking = () => showAuth("booking")`, passé au `Header` et au `Hero`.
- `Header` desktop : bouton "Prendre RDV" (outline + CalendarDays) ajouté entre la nav et "Connexion" / "Démarrer l'essai" (existants inchangés).
- `Header` mobile : bouton "Prendre rendez-vous" (outline full-width) ajouté en haut du menu Sheet.
- `Hero` : bouton secondaire "Prendre rendez-vous" (outline orange) ajouté à côté de "Accéder à la plateforme". Lien "Voir les tarifs" conservé, déplacé sous les boutons en lien texte discret.

## Vérifications

- `bun run lint` → **EXIT 0** (0 erreur, 0 warning sur mes fichiers).
- Une erreur `react-hooks/set-state-in-effect` a brièvement été remontée dans `src/components/modules/appointments-view.tsx` (fichier du sous-agent 5-a en cours d'édition parallèle) — non introduite par mes changements, auto-résolue par 5-a pendant ma session.
- dev.log propre : GET / 200, compilation sans erreur.

## Notes pour l'orchestrateur (Task 5-final)

- Le flux patient est entièrement autonome (pas besoin d'être authentifié, juste OTP téléphone).
- Le `patientId` envoyé à `POST /api/appointments` est résolu côté client par `resolvePatientId` (match `PATIENTS` par téléphone, fallback `pat_1`). En production, ce serait un token patient temporaire issu de la vérification OTP.
- Le code de démo (`demoCode`) est renvoyé par l'API en `NODE_ENV !== "production"` et affiché dans une Alert amber à l'étape 2 — utile pour les tests end-to-end Agent Browser.
- Le bouton "Terminer" appelle `useAppStore.getState().hideAuth()` (via `hideAuth` du hook) → retour landing + toast.
