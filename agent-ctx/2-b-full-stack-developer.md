# Task 2-b — Modules Rendez-vous (3) & Dossiers Patients (4)

Agent : full-stack-developer (RDV + Patients)
Date : session en cours

## Contexte lu
- `worklog.md` : fondation MediSaaS CI (Next.js 16 + TS + Tailwind 4 + shadcn/ui + Recharts).
- Palette : primaire `teal-600`/`emerald-600`, accent `orange-500`. PAS d'indigo/bleu.
- Données mock : `APPOINTMENTS`, `PATIENTS`, `DOCTORS`, `PRESCRIPTIONS`, `INVOICES`.
- Helpers : `formatFCFA`, `formatDate`, `formatDateTime` depuis `@/lib/types`.
- Composants partagés : `AppointmentStatusBadge`, `InvoiceStatusBadge`, `Avatar` depuis `@/components/medisisaas/shared`.

## Fichiers produits
1. `src/components/modules/appointments-view.tsx` — `AppointmentsView`
2. `src/components/modules/patients-view.tsx` — `PatientsView`

## Décisions techniques
- **Module 3 (RDV)** : En-tête + 4 KPIs (Aujourd'hui, Cette semaine, Confirmés, En attente) + Tabs (Aujourd'hui/Cette semaine/Tous) + filtres (recherche, médecin, statut). Liste chronologique groupée par jour avec sticky headers. Card horizontale par RDV (heure gros, avatar patient, motif, médecin, badge type, badge statut, actions confirmer/annuler avec toast sonner). Dialog "Nouveau RDV" avec formulaire (patient Select, médecin Select, date/heure, motif, type radio).
- **Module 4 (Patients)** : En-tête + compteur + bandeau conformité Loi 2013-450 + barre de filtres (recherche nom/code/téléphone, commune, statut, groupe sanguin). Tableau desktop (colonnes Patient/Contact/Commune/Dernière visite/Assurance/Groupe/Statut) + cards mobile. Clic ligne → Sheet détaillé (DPN) avec : en-tête avatar+code+badges, démographie (âge calculé), données médicales (poids/taille/IMC calculé+catégorie, allergies en badges rouges, antécédents en badges ambrés), assurance, historique (RDV/ordonnances/factures filtrés par patientId). Dialog "Nouveau patient".
- **Types** : `Gender` non exporté de `types.ts` → déclaré localement (`type Gender = "M" | "F"`) pour éviter de modifier la fondation.
- **Aucun useMemo/useCallback** (conformément aux consignes React Compiler).
- **Toasts** via `sonner` pour tous les feedbacks (création RDV, confirmation, annulation, nouveau patient).
- **Scroll** : listes longues avec `max-h-[60vh] overflow-y-auto`.
- **Responsive** : grids mobile-first, table desktop / cards mobile pour les patients, cards RDV empilées sur petit écran.

## Lint
- `bun run lint` → EXIT 0 (aucune erreur, aucun warning).

## Statut
- Les deux modules remplacent les stubs et sont prêts à l'affichage dans le dashboard via `module-router`.
