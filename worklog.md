# MediSaaS CI — Worklog partagé

Projet : MediSaaS CI — Plateforme SaaS de gestion médicale pour la Côte d'Ivoire
Stack : Next.js 16 (App Router) + TypeScript + Tailwind 4 + shadcn/ui + Prisma (SQLite) + Recharts + Zustand

---
Task ID: 1
Agent: Z.ai (orchestrateur)
Task: Fondation — schéma Prisma multi-tenant, types TS, données mock (contexte ivoirien), thème médical, layout, store Zustand, API routes, shell dashboard, Module 8 (Tableau de bord & Analytique)

Work Log:
- Schéma Prisma multi-tenant créé : Tenant, User (rôles), Patient (DPN), Appointment, Consultation, Prescription, Invoice, Payment, Subscription, AuditLog. Push DB effectué.
- Types TS partagés (`src/lib/types.ts`) : rôles, modules, statuts, helpers `formatFCFA`/`formatDate`.
- Données mock riches (`src/lib/mock-data.ts`) : clinique du Plateau (Cocody, Abidjan), 5 médecins (Dr. Aya Kouassi, Dr. Konan Yao...), 48 patients (noms ivoiriens, communes d'Abidjan), 40 RDV, 24 ordonnances, 30 factures, paiements Mobile Money, consultation, abonnement, 3 plans SaaS, données analytiques 12 mois.
- Thème médical dans `globals.css` : primaire sarcelle/émeraude (santé), accent orange (drapeau CI + Orange Money), dark mode, scrollbar custom, grille médicale, animations.
- Layout (`src/app/layout.tsx`) : métadonnées FR, lang="fr", Toaster + Sonner.
- Store Zustand (`src/lib/store.ts`) : `view` (landing/dashboard), `module` actif, `role`, sidebar, `enterDashboard`/`exitToLanding`.
- Config navigation (`src/lib/nav.ts`) : 10 modules, rôles et leurs accès modules.
- Composants partagés : `brand.tsx` (logo croix médicale), `shared.tsx` (badges statut RDV/facture/paiement, avatars, rôles).
- Shell dashboard (`dashboard-shell.tsx`) : sidebar repliable (groupes Pilotage/Métier/Finance/Espace patient), topbar (sélecteur de rôle, thème, notifications, profil), bandeau conformité Loi 2013-450.
- Module 8 Tableau de bord (`dashboard-view.tsx`) : bandeau bienvenue, 4 KPIs, area chart revenus 12 mois, pie chart moyens de paiement (Orange/Wave/MTN), bar chart RDV 7j, liste RDV récents, charge médecins, ordonnances récentes.
- Routeur de modules (`module-router.tsx`).
- API routes : `/api/dashboard`, `/api/patients`, `/api/appointments`, `/api/prescriptions`, `/api/invoices`, `/api/doctors`, `/api/subscription`.
- Page principale (`src/app/page.tsx`) : bascule landing ↔ dashboard via store.
- Stubs créés pour les modules à construire par les subagents.
- Lint OK, serveur dev démarré sur port 3000.

Stage Summary:
- Fondation complète et fonctionnelle. Le dashboard s'affiche avec le Module 8 (Analytique) opérationnel.
- Contrat pour les subagents : chaque module = un composant client dans `src/components/modules/<name>-view.tsx`, exportant `export function <Name>View()`. Aucun prop requis : importer les données depuis `@/lib/mock-data` et les helpers depuis `@/lib/types`. Utiliser shadcn/ui (déjà installé), Recharts pour graphiques, texte 100% français, FCFA, contexte ivoirien.
- Fichiers disponibles pour les subagents :
  - `src/lib/types.ts` (types + formatFCFA/formatDate + ROLE_LABELS, PAYMENT_LABELS, PAYMENT_COLORS)
  - `src/lib/mock-data.ts` (TENANT, DOCTORS, PATIENTS, APPOINTMENTS, PRESCRIPTIONS, INVOICES, PAYMENTS, CONSULTATIONS, SUBSCRIPTION, PLANS, MONTHLY_REVENUE, PAYMENT_DISTRIBUTION, SPECIALTY_DISTRIBUTION, APPOINTMENTS_TREND)
  - `src/components/medisisaas/shared.tsx` (AppointmentStatusBadge, InvoiceStatusBadge, PaymentBadge, Avatar, RoleBadge)
  - `src/components/medisisaas/brand.tsx` (Brand, BrandMark)
  - `src/lib/store.ts` (useAppStore — role, module, enterDashboard...)
  - shadcn/ui complet dans `src/components/ui/`
- Palette : primaire sarcelle `teal-600`, accent `orange-500`, succès `emerald-600`, danger `rose-500`. PAS d'indigo/bleu.

---
Task ID: 2-a
Agent: full-stack-developer (landing page)
Task: Landing page marketing 100% française MediSaaS CI

Work Log:
- Lecture du worklog Task 1 (fondation, store, mock-data, brand, palette) et des fichiers partagés (store.ts, mock-data.ts, types.ts, brand.tsx, globals.css, button/badge/sheet shadcn).
- Écriture complète de `src/components/medisisaas/landing-page.tsx` (env. 900 lignes) qui remplace le stub. Composant `"use client"` qui consomme `useAppStore((s) => s.enterDashboard)` et appelle `enterDashboard("admin_cabinet")` sur tous les CTA principaux.
- 11 sections livrées dans l'ordre demandé :
  1. Header sticky (Brand + nav 6 liens + boutons "Connexion" / "Démarrer l'essai"), menu hamburger Sheet sur mobile.
  2. Hero : titre gradient sarcelle, sous-titre FR (RDV, DPE, ordonnances, Mobile Money, téléconsultation), 2 CTA, carte glassmorphism avec mini aperçu dashboard (KPIs 512 RDV / 4,8M FCFA / 1 240 patients, mini bar chart, lignes RDV + paiement Orange Money), badges confiance (Loi 2013-450, af-south-1, Mobile Money), fond `medical-grid` + halos `glow-teal`, notifications flottantes animées.
  3. Bandeau partenaires (CinetPay, Orange Money, Wave, MTN Money, Africa's Talking, WhatsApp Business, Daily.co) avec pastilles colorées (Wave=sky, MTN=yellow, Orange=orange).
  4. Section Modules : 10 cartes (Tableau de bord, RDV, Dossier Patient, Ordonnances, Facturation Mobile Money, Téléconsultation, Portail patient, Abonnements SaaS, Analytique, Onboarding) avec icônes lucide, gradients teal/orange, hover bordure teal + translate-y.
  5. Section "Pourquoi MediSaaS CI" : 6 cartes (Multi-tenant isolé, Loi 2013-450 + ARTCI, AES-256, Mobile Money, Téléconsultation Daily.co, SMS/WhatsApp).
  6. Section "Comment ça marche" : 4 étapes numérotées (Onboarding → Import patients → Consultations → Paiements).
  7. Section Témoignages : 3 figures (Dr. Aya Kouassi / Clinique Cocody, Dr. Konan Yao / Cardiologue Plateau, Mme Affoué Tanoh / Yopougon) avec étoiles orange, citations, avatars initiales colorées.
  8. Section Tarifs (#tarifs) : 3 cartes PLANS importés depuis `@/lib/mock-data`, plan "pro" mis en avant (bordure teal, badge "Le plus populaire", scale-up), bouton bascule mensuel/annuel avec state local (annual = -20% visuel), prix formatFCFA + "/mois".
  9. Section conformité/sécurité : 4 cartes (af-south-1, Loi 2013-450, AES-256, Backups quotidiens) avec icônes ShieldCheck/Lock/Server/Database.
  10. CTA final : bloc gradient teal→emerald→emerald-700, "Prêt à digitaliser votre cabinet ?", 2 boutons, halos décoratifs.
  11. Footer sticky (`mt-auto`) : 4 colonnes (Produit, Ressources, Entreprise, Légal) + Brand + coordonnées TENANT (téléphone, email, adresse) + copyright "© {year} MediSaaS CI — Conforme à la Loi ivoirienne n°2013-450" + badges hébergement.
- Animations Framer Motion : `fadeUp` + `stagger` sur sections, `whileInView` avec `viewport once`, transitions douces (0.5–0.7s, ease [0.22,1,0.36,1]).
- Layout `min-h-screen flex flex-col` + `mt-auto` sur le footer (sticky bottom respecté).
- Palette 100% teal-600 / emerald-600 / orange-500 / emerald / rose ; aucun indigo/bleu (sauf pastilles Wave=sky et MTN=yellow autorisées).
- Aucun `useMemo`/`useCallback` superflu (2 useState seulement : `mobileOpen`, `annual`).
- `bun run lint` : aucune erreur.
- Serveur dev : compile propre, GET / 200.

Stage Summary:
- Fichier produit : `src/components/medisisaas/landing-page.tsx` (composant unique `LandingPage`, ~900 lignes, 100% français, mobile-first responsive, Framer Motion, shadcn/ui).
- Toutes les sections demandées sont présentes et branchées sur le store Zustand via `enterDashboard("admin_cabinet")`.
- Lint propre, prêt pour la suite (subagents modules 1-7).

---
Task ID: 2-b
Agent: full-stack-developer (RDV + Patients)
Task: Modules Rendez-vous (3) et Dossiers Patients (4)

Work Log:
- Lecture de la fondation (worklog, types, mock-data, shared.tsx, dashboard-view pour respecter le style).
- Module 3 `appointments-view.tsx` : en-tête + 4 KPIs (Aujourd'hui, Cette semaine, Confirmés, En attente) + Tabs (Aujourd'hui / Cette semaine / Tous) + filtres (recherche, Select médecin, Select statut). Liste chronologique groupée par jour avec en-têtes sticky. Card horizontale par RDV (heure en gros dans un bloc teal, avatar patient, motif + commune, médecin + spécialité, badge type présentiel/téléconsultation avec icônes MapPin/Video, badge statut `AppointmentStatusBadge`, actions confirmer/annuler avec `toast` sonner). Dialog "Nouveau RDV" : formulaire complet (patient via Select depuis PATIENTS, médecin via Select depuis DOCTORS, date/heure, motif, type radio présentiel/téléconsultation) → toast success + fermeture.
- Module 4 `patients-view.tsx` : en-tête + compteur + bandeau conformité Loi 2013-450 + barre de filtres (recherche nom/code/téléphone, Select commune, Select statut actif/inactif, Select groupe sanguin). Tableau desktop (colonnes Patient avatar+nom+code, Contact téléphone, Commune, Dernière visite, Assurance, Groupe sanguin, Statut) + cards mobile. Clic sur ligne → Sheet droit détaillé "Dossier Patient Numérique" : en-tête (avatar lg + nom + code + badges groupe sanguin/assurance/statut), démographie (naissance avec âge calculé, genre, téléphone, email, adresse, commune), données médicales (poids, taille, IMC calculé avec catégorie colorée, allergies en badges rouges, antécédents chroniques en badges ambrés), assurance (provider + numéro), historique (RDV filtrés par patientId, ordonnances depuis PRESCRIPTIONS, factures depuis INVOICES — listes avec max-h-60 scroll). Dialog "Nouveau patient" : formulaire (prénom, nom, genre radio, naissance, téléphone, commune Select, groupe sanguin Select) → toast.
- Détails : `type Gender` déclaré localement (non exporté dans types.ts) pour éviter de modifier la fondation. Aucun useMemo/useCallback (React Compiler). Toasts via sonner. Listes longues en `max-h-[60vh] overflow-y-auto`. Palette respectée (teal/emerald/orange, pas d'indigo/bleu). Responsive mobile-first.
- `bun run lint` → EXIT 0 (aucune erreur ni warning).

Stage Summary:
- Deux fichiers produits, remplaçant les stubs : `src/components/modules/appointments-view.tsx` (`AppointmentsView`) et `src/components/modules/patients-view.tsx` (`PatientsView`).
- Module 3 : agenda RDV complet avec KPIs, onglets, filtres, planning chronologique et création de RDV.
- Module 4 : gestion du DPN avec table filtrable + Sheet détaillé riche (démographie, médical, assurance, historique cross-modules) et création de patient.
- Interface 100% française, montants en FCFA, contexte ivoirien (communes d'Abidjan, CNPS/mutuelles, Mobile Money). Prêt pour intégration dans le routeur de modules.

---
Task ID: 2-d
Agent: full-stack-developer (Portail patient + Abonnements)
Task: Modules Portail Patient (9) et Abonnements SaaS (10)

Work Log:
- Lu worklog + mock-data + types + shared/brand pour respecter la fondation et les conventions (palette teal/emerald/orange, FCFA, contexte ivoirien, composants partagés).
- Module 9 — `src/components/modules/patient-portal-view.tsx` (PatientPortalView, ~900 lignes) :
  • En-tête chaleureux : gradient teal→emerald, "Bonjour, [Prénom] 👋", carte patient (avatar, code CI-CP-0001, sexe/âge/commune, badges groupe sanguin A+ rose et assurance CNPS).
  • Carte "Mon dossier médical" : 4 sous-cartes (groupe sanguin, allergies en badges amber, antécédents en badges orange, mesures poids/taille/IMC avec catégorie colorée) + encart "Prochain rendez-vous".
  • Encart téléconsultation conditionnel (gradient orange) si RDV téléconsult à venir, bouton "Rejoindre la téléconsultation" → toast Daily.co.
  • 4 onglets : Mes RDV (liste filtrée patientId=pat_1, badges statut, bouton Annuler si planifié/confirmé), Mes ordonnances (liste, bouton Voir détail → Dialog détaillé avec médicaments, bouton Renouveler → toast), Mes factures (liste avec InvoiceStatusBadge, montant, bouton Payer si impayée → Dialog Mobile Money Orange/Wave/MTN/CB + numéro + paiement), Prendre RDV (formulaire Select spécialité→médecin + date/heure/motif + aperçu médecin noté + infos pratiques + bouton Confirmer → toast).
  • États vides stylés (EmptyState), utilisation des badges partagés (AppointmentStatusBadge, InvoiceStatusBadge, PaymentBadge, Avatar).
- Module 10 — `src/components/modules/subscriptions-view.tsx` (SubscriptionsView, ~560 lignes) :
  • En-tête "Abonnement & Facturation SaaS" + badge statut actif (point vert pulsant).
  • Carte plan actuel (gradient teal/emerald, Crown orange, montant 75 000 FCFA/mois, période start→end, méthode Orange Money, boutons "Améliorer mon plan" et "Modifier le paiement").
  • Carte "Utilisation du plan" : 4 barres Progress colorées (Utilisateurs 7/10 teal, Patients 48/illimité emerald, Téléconsultations 12/50 orange, SMS 320/1000 cyan) + rappel renouvellement.
  • Section "Changer de plan" : 3 cartes PLANS avec icône, prix, features cochées, badge "Plan actuel" sur Pro, boutons "Mettre à niveau" (teal) / "Rétrograder" (orange) → Dialog confirmation avec choix Mobile Money + toast.
  • Carte "Méthode de paiement" (Orange Money affiché) + bouton Modifier → Dialog.
  • Table historique facturation : 6 mois mockés à 75 000 FCFA, badge "Payée", bouton PDF → toast, total 450 000 FCFA.
  • Zone résiliation (bordure rose) avec bouton → Dialog de confirmation (pertes détaillées, raison, mention Loi 2013-450).
- Lint standard OK. Lint strict (no-unused-vars) : nettoyage de 3 imports/vars inutilisés (BrandMark, ChevronRight, aptId, age intégré dans la carte patient).
- Vérification dev.log : serveur tourne sur port 3000, pas d'erreur de compilation.

Stage Summary:
- 2 modules livrés et fonctionnels, branchés dans `module-router.tsx` (cases "patient-portal" et "subscriptions").
- Fichiers produits :
  - `src/components/modules/patient-portal-view.tsx` → `export function PatientPortalView()`
  - `src/components/modules/subscriptions-view.tsx` → `export function SubscriptionsView()`
- 100% français, FCFA, palette teal/emerald/orange (zéro indigo/bleu), 100% shadcn/ui, toasts Sonner, contexte ivoirien (Cinpay, Orange/Wave/MTN Money, Loi 2013-450, communes d'Abidjan).
- Pas de props requis : données depuis `@/lib/mock-data`, helpers depuis `@/lib/types`, badges depuis `@/components/medisisaas/shared`.
- Patient connecté = PATIENTS[0] (Aya Kouassi, code CI-CP-0001, CNPS, Cocody, groupe A+).
- Tous les Dialogs (détail ordonnance, paiement facture, changement plan, méthode paiement, résiliation) utilisent shadcn Dialog avec actions toast.

---
Task ID: 2-c
Agent: full-stack-developer (Ordonnances + Facturation)
Task: Modules Ordonnances (5) et Facturation Mobile Money (6)

Work Log:
- Lecture du worklog (Task 1 + 2-a/b/d), types.ts, mock-data.ts, shared.tsx, dashboard-view (pour style charts), appointments-view (style KPI/filtres) et patient-portal-view (style dialog Mobile Money). Stubs existants confirmés à remplacer.
- Module 5 — `src/components/modules/prescriptions-view.tsx` (~430 lignes, `PrescriptionsView`) :
  • En-tête "Ordonnances" + compteur actives/expirées + bouton "Nouvelle ordonnance" (teal-600).
  • 4 KPIs : Ordonnances actives (emerald), Expirées (zinc), Total émises (teal), Validité moyenne (orange, "X j").
  • Filtres : recherche (numéro/patient), Select statut (tous/active/expiree/annulee), Select médecin (depuis DOCTORS).
  • Tableau responsive (scroll `max-h-[60vh]`) : numéro mono teal, patient (Avatar), médecin (md+), date (sm+), nb médicaments (badge), statut (PrescriptionStatusBadge local : active=emerald, expiree=zinc, annulee=rose). Header sticky.
  • Ligne cliquable → Dialog détaillé `sm:max-w-3xl` pro : en-tête clinique (gradient teal/emerald, TENANT name + address + phone + email, numéro + date), carte Patient (avatar + code + commune), carte Médecin (specialty + license), tableau médicaments (nom | posologie | fréquence | durée | instructions), notes (encart amber) + validité (encart emerald/zinc avec date d'expiration calculée). Footer : Imprimer, Envoyer WhatsApp (emerald), Renouveler (teal) → toasts sonner.
  • Dialog "Nouvelle ordonnance" `sm:max-w-2xl` : Select patient (PATIENTS, scroll), Select médecin (DOCTORS), liste dynamique de médicaments (inputs nom/dosage/fréquence/durée + remove button par ligne), bouton "Ajouter un médicament" (border teal), notes Textarea, encart rappel validité 30 jours. Bouton "Émettre" → toast success.
- Module 6 — `src/components/modules/billing-view.tsx` (~620 lignes, `BillingView`) :
  • En-tête "Facturation & Paiements" + total encaissé + bouton "Nouvelle facture" (teal-600).
  • 4 KPIs : Revenus encaissés (emerald + Progress taux), Factures impayées montant (rose), Partielles montant (amber), Taux de recouvrement % (teal).
  • Tabs (Toutes | Impayées | Payées | Partielles) + recherche (numéro/patient) + Select méthode paiement (Orange/Wave/MTN/CB/Espèces).
  • Tableau responsive scroll `max-h-[60vh]` : N° facture mono teal, patient (Avatar), date (sm+), total (bold), payé (md+, emerald), statut (InvoiceStatusBadge partagé), méthode (PaymentBadge si payée, lg+). Header sticky.
  • Ligne cliquable → Dialog détaillé `sm:max-w-3xl` : en-tête clinique (TENANT) + statut, carte patient (avatar + code + commune), tableau prestations (description | qté | prix unitaire | total ligne), récap (sous-total, TVA 18% CI, total teal), section règlement (payé emerald, reste rose si >0, PaymentBadge). Bouton Imprimer (outline) + bouton "Encaisser {reste}" (orange) visible si impayée/partielle.
  • Sous-Dialog Mobile Money `sm:max-w-md` (PaymentDialog) : carte récap gradient teal/emerald (reste à payer, total, déjà payé), Input montant pré-rempli avec le reste (modifiable), grille 2x2 de 4 cartes méthode (Orange Money=orange, Wave=sky, MTN Money=yellow text-yellow-950, Carte bancaire=violet), Input numéro Mobile Money (ou email si CB), encart CinetPay. Bouton "Payer {montant} FCFA" (orange) → toast "Paiement initié via [méthode]". Ouvert au-dessus du Dialog détail (z-index géré par Radix).
  • Dialog "Nouvelle facture" `sm:max-w-2xl` : Select patient, Select méthode paiement, items dynamiques (description + qté + prix unitaire, remove button), récap auto (sous-total, TVA 18%, total), bouton "Créer la facture" → toast.
  • Section graphique bas : BarChart 12 mois (gradient teal→emerald, tooltip FCFA, axe Y en millions) dans Card lg:col-span-2 + PieChart répartition paiements (PAYMENT_DISTRIBUTION, color de chaque entrée, légende + liste détaillée %) dans Card lg:col-span-1.
- Détails techniques : aucun useMemo/useCallback (calculs directs pour React Compiler). Toasts via sonner. Avatar/InvoiceStatusBadge/PaymentBadge depuis shared.tsx. Palette teal/emerald/orange respectée (zéro indigo/bleu, sauf badges Mobile Money Wave=sky, MTN=yellow, CB=violet autorisés). 100% FR, FCFA, contexte ivoirien (CinetPay, TVA 18%, communes Abidjan).
- `bun run lint` → EXIT 0 (aucune erreur ni warning). dev.log propre, GET / 200.

Stage Summary:
- 2 fichiers produits, remplaçant les stubs :
  - `src/components/modules/prescriptions-view.tsx` → `export function PrescriptionsView()`
  - `src/components/modules/billing-view.tsx` → `export function BillingView()`
- Module 5 : ordonnances électroniques complètes (KPIs, filtres, tableau, détail pro format clinique, création avec meds dynamiques, actions Imprimer/WhatsApp/Renouveler).
- Module 6 : facturation Mobile Money (KPIs, onglets, tableau, détail facture avec TVA 18%, encaissement Orange/Wave/MTN/CB via sous-Dialog CinetPay, nouvelle facture, graphiques revenus + répartition paiements).
- Branchés dans `module-router.tsx` (cases "prescriptions" et "billing" déjà câblées).
- Prêt pour intégration finale.

---
Task ID: 8b + 9
Agent: Z.ai (orchestrateur)
Task: Modules Téléconsultation (7) + Analytique + Paramètres, puis intégration finale et vérification Agent Browser

Work Log:
- Module 7 Téléconsultation (teleconsultation-view.tsx) : salle vidéo simulée Daily.co (vignette médecin PiP, barre contrôle micro/caméra/partage/messages, badge chiffré E2E, timer), notes de consultation en direct, liste RDV téléconsultation à venir/passés, encart sécurité & conformité Loi 2013-450.
- Module Analytique (analytics-view.tsx) : 4 KPIs synthèse (revenus 12 mois, consultations, patients, taux recouvrement), 4 onglets (Revenus/Patients/Médical/Équipe) avec AreaChart combiné, PieChart paiements, BarChart diagnostics & tranches d'âge & communes Abidjan, RadarChart spécialités, LineChart tendances, performance équipe médicale.
- Module Paramètres (settings-view.tsx) : 4 onglets (Cabinet/Utilisateurs/Sécurité/Notifications), infos cabinet (TENANT), horaires, équipe + rôles, conformité AES-256/af-south-1/audit logs/2FA, sauvegardes, canaux notif (Africa's Talking SMS/WhatsApp/Resend/PWA), modèles de rappel.
- Vérification Agent Browser end-to-end réussie :
  * Landing page : 11 sections rendues (hero, modules, features, étapes, témoignages, tarifs, conformité, CTA, footer sticky avec © 2024 + Loi 2013-450 + adresse Cocody Abidjan)
  * Dashboard : sidebar 10 modules, topbar (sélecteur rôle, thème, notifs, profil), bandeau bienvenue Clinique du Plateau, KPIs, graphiques
  * Module RDV : planning chronologique, filtres, dialog nouveau RDV
  * Module Patients : 48 patients enregistrés/42 actifs, DPN détaillé
  * Module Facturation : 1 198 290 FCFA encaissés, factures impayées 292 640 FCFA, dialog détail facture, dialog paiement Mobile Money (Orange/Wave/MTN/CB + CinetPay + numéro + bouton Payer)
  * Module Téléconsultation : salle vidéo, RDV à venir
  * Responsivité mobile (390px) : menu hamburger landing + dashboard, footer sticky
- Lint exit 0 sur tout le projet.

Stage Summary:
- MediSaaS CI est COMPLET et vérifié navigateur. 10 modules fonctionnels, interface 100% française, FCFA, Mobile Money (Orange/Wave/MTN/CB via CinetPay), conformité Loi 2013-450, multi-tenant (schéma Prisma), rôles (6), téléconsultation, analytique, portail patient, abonnements SaaS (3 plans).
- Architecture : Next.js 16 App Router + Prisma (SQLite, schéma multi-tenant) + Recharts + Zustand + shadcn/ui + Framer Motion + sonner.
- Le golden path complet est vérifié : landing → dashboard → navigation modules → facturation → paiement Mobile Money.
