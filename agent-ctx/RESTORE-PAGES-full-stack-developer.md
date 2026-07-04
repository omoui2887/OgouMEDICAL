# Task RESTORE-PAGES — Restauration pages About + Legal + Status + routing

Agent : full-stack-developer
Task ID : RESTORE-PAGES
Périmètre : 3 pages critiques OgouMEDICAL (About, Legal, Status) + leur routing dans le store Zustand et `src/app/page.tsx` + branchement des liens footer landing → nouvelles pages.

## Contexte lu

- `worklog.md` (Tasks 1, 2-a, 3-b, 3-c, 4-a, 5-b, 5-c) — projet OgouMEDICAL SaaS médical CI.
- `src/lib/store.ts` (avant) : `AppView = "landing" | "dashboard"` seulement.
- `src/app/page.tsx` (avant) : routing landing/dashboard seulement.
- `src/components/medisisaas/landing-page.tsx` footer : 4 colonnes avec `<a href="#">` non fonctionnels pour "À propos", "Mentions légales", "Statut plateforme", etc.
- `src/app/api/status/route.ts` : déjà livré par Task 5-c (12 services, contact Romain OGOU, conformité Loi 2013-450).
- `src/lib/mock-data.ts` : `TENANT` déjà aligné OgouMEDICAL / Romain OGOU (ogouromain@gmail.com / +225 05 76 10 32 77).
- `src/components/ui/tabs.tsx` : composant Tabs (Radix) disponible.
- Dossiers `src/components/medisisaas/legal/` et `status-page/` vides présents.
- `agent-ctx/5-b-full-stack-developer.md` : précédent sous-agent (portail patient RDV).

## Fichiers produits / modifiés

| Fichier | Action | Rôle |
| --- | --- | --- |
| `src/lib/store.ts` | MODIFIÉ | `AppView` étendu `"status" \| "about" \| "legal"` + actions `showStatus`/`showAbout`/`showLegal` |
| `src/app/page.tsx` | MODIFIÉ | Imports + 3 branches de routing (about/legal/status) avec AuthRouter en overlay |
| `src/components/medisisaas/about-page.tsx` | CRÉÉ | Page À propos complète (hero + concepteur + mission/vision/valeurs + support + footer) |
| `src/components/medisisaas/legal/legal-page.tsx` | CRÉÉ | Mentions légales avec Tabs (CGU 8 sections / Confidentialité 6 sections / Mentions 6 sections) |
| `src/components/medisisaas/status-page/status-page.tsx` | CRÉÉ | Page statut publique (fetch /api/status, 12 services, KPIs, incidents, conformité, contact) |
| `src/components/medisisaas//landing-page.tsx` | MODIFIÉ | Footer `col.links.map` remplacement par `<button onClick>` pour À propos/Légal/Statut |

## Stack & contrats respectés

- Next.js 16 + TypeScript + Tailwind 4 + shadcn/ui (New York).
- shadcn utilisés : `Card`, `Button`, `Badge`, `Avatar`+`AvatarFallback`, `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent`.
- `framer-motion` pour animations `fadeUp`/`whileInView` cohérent avec landing-page.
- `lucide-react` pour icônes (ShieldCheck, Lock, Mail, MessageCircle, Globe2, Server, Target, Eye, HeartPulse, Clock, History, Cpu, etc.).
- Palette **sky (#0EA5E9) + orange (#F59E0B)** sur les 3 nouvelles pages — AUCUNE référence teal dans le nouveau code (vérifié par review).
- 100% français, contexte ivoirien (Loi 2013-450, ARTCI, AWS af-south-1, Mobile Money, Romain OGOU designer).
- Aucun test code écrit.
- `useAppStore.getState()` utilisé pour les actions dans les fonctions helper (évite les hooks supplémentaires).

## Designer

- Romain OGOU, email `ogouromain@gmail.com`, WhatsApp `+225 05 76 10 32 77`, lien `https://wa.me/2250576103277`.
- Avatar "RO" (gradient sky-500 → sky-700) sur la page À propos.
- Présent sur les 3 pages (header Brand implicite + footer + section dédiée sur about + section contact sur status).

## API consommée

- `GET /api/status` → JSON `{ overallStatus, summary, services[12], incidents, support, legal }`. Fetch au montage + refresh auto 60 s + bouton "Actualiser" manuel.

## Lint & runtime

- `bun run lint` → **EXIT 0** (0 erreur, 0 warning).
- Une erreur `react-hooks/set-state-in-effect` initiale dans status-page corrigée via pattern async annulable : fonction `load()` async à l'intérieur du `useEffect`, `setState` uniquement après `await fetch`, flag `cancelled` pour éviter les fuites.
- dev.log propre, serveur dev HTTP 200 stable.

## Notes pour l'orchestrateur

- Les 3 pages partagent la même palette (sky/orange) et la même architecture (header sticky + main + footer sticky `mt-auto`) pour cohérence visuelle.
- `landing-page.tsx` footer : 5 liens transformés en boutons (`À propos`, `Statut plateforme`, `Mentions légales`, `Conditions générales`, `Politique de confidentialité`) — les autres liens (Modules, Tarifs, Documentation, etc.) restent en `<a href>` car ils pointent vers des ancres (#modules, #tarifs, #etapes) ou sont encore non implémentés.
- `brand.tsx` conserve son gradient teal historique — hors périmètre RESTORE-PAGES (la task demandait seulement de ne pas introduire de teal dans les nouvelles pages, pas de refactoriser le brand existant).
- Les 3 nouvelles pages réutilisent `AuthRouter` en overlay au cas où l'utilisateur déclencherait showAuth("booking") depuis ces pages (pas de bouton explicite actuellement, mais l'overlay reste disponible pour extension future).
