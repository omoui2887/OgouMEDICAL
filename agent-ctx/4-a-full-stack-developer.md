# Task 4-a — Auth UI (login, register wizard, forgot, verify)

Agent : full-stack-developer (auth UI)
Périmètre : 4 écrans d'authentification + orchestrateur `AuthRouter` pour MediSaaS CI.

## Fichiers produits

| Fichier | Export | Rôle |
| --- | --- | --- |
| `src/components/medisisaas/auth/auth-shell.tsx` | `AuthShell` | Layout partagé split-screen (panneau médical desktop + carte centrée) |
| `src/components/medisisaas/auth/login-form.tsx` | `LoginForm` | Connexion email/password + Google + comptes démo + connexion rapide |
| `src/components/medisisaas/auth/register-wizard.tsx` | `RegisterWizard` | Inscription 3 étapes (Cabinet / Administrateur / Plan) avec progression |
| `src/components/medisisaas/auth/forgot-password-form.tsx` | `ForgotPasswordForm` | Demande reset mot de passe + état succès |
| `src/components/medisisaas/auth/verify-email.tsx` | `VerifyEmail` | Confirmation email (icône + cooldown 60s + Loi 2013-450) |
| `src/components/medisisaas/auth/auth-router.tsx` | `AuthRouter` | Orchestrateur selon `useAppStore((s) => s.authScreen)` |

## Intégration

- `src/app/page.tsx` : `<AuthRouter />` monté en overlay au-dessus de `<LandingPage />` (renvoie `null` quand `authScreen` est `null`).
- `src/components/medisisaas/landing-page.tsx` : header desktop + menu mobile câblés — bouton "Connexion" → `showAuth("login")`, bouton "Démarrer l'essai" → `showAuth("register")`. Les CTA Hero/Pricing/FinalCTA conservent `enterDashboard` (chemin démo instantané préservé).

## Contrats respectés

- Store Zustand (`@/lib/store`) : `authScreen`, `showAuth`, `hideAuth`, `authenticate`, `enterDashboard` consommés tels quels.
- Client auth (`@/lib/auth`) : `signIn`, `signInWithGoogle`, `signUp`, `requestPasswordReset` + types `Credentials`, `RegisterData`.
- Validations (`@/lib/validations/auth`) : `loginSchema`, `registerStep1Schema`, `registerStep2Schema`, `registerStep3Schema`, `forgotPasswordSchema` via `zodResolver`.
- Brand (`@/components/medisisaas/brand`) : `Brand size="lg"` dans le panneau desktop, `Brand size="md"` mini-logo mobile.
- shadcn/ui : Form, Button, Input, Label, Select, Checkbox, Progress, Alert, Separator, Badge.
- Palette médicale : `bg-primary` (#0EA5E9) + `bg-emerald-600` (succès/démo/étapes done) + `bg-orange-500` (badge Populaire) + `bg-rose-500` (erreurs). Gradient desktop `from-sky-600 via-cyan-600 to-teal-700`.
- Toasts sonner pour feedback. Aucun `useMemo`/`useCallback` superflu.

## Vérification end-to-end (agent-browser, 1440×900)

Golden path validé :
1. Landing → clic header "Connexion" → LoginForm (H1 "Connexion", 5 comptes démo visibles).
2. LoginForm → "Créer un compte cabinet" → RegisterWizard étape 1 (Progress 33%).
3. Étape 1 (Clinique Test Plateau / Cabinet médical / Abidjan / +225 07 08 12 34 56) → Continuer → Étape 2 (Progress 66%).
4. Étape 2 (Aya / Kouassi / aya.kouassi@test.ci / Demo1234 / Demo1234) → Continuer → Étape 3 (Progress 100%, Pro pré-sélectionné avec badge "Populaire").
5. Checkbox Loi 2013-450 cochée → "Créer mon compte" → toast success → VerifyEmail (H2 "Confirmez votre adresse email", email "aya.kouassi@test.ci" lu depuis localStorage).
6. "Renvoyer l'email" → bouton passe en "Renvoyer dans 60s" (cooldown actif).
7. "J'ai vérifié, me connecter" → retour LoginForm.
8. LoginForm → "Mot de passe oublié ?" → ForgotPasswordForm (H1 "Mot de passe oublié").

## Lint

`bun run lint` → EXIT 0 (0 erreur, 0 warning). dev.log propre, GET / 200, compilation sans erreur.
