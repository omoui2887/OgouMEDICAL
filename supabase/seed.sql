-- ============================================================
-- MediSaaS CI — Seed SQL (PostgreSQL / Supabase)
-- ============================================================
-- Données de démonstration — contexte ivoirien (Abidjan, Cocody).
-- Tenant : Clinique du Plateau
-- 5 médecins, 10 patients (noms ivoiriens), quelques RDV,
-- ordonnances, factures, paiements Mobile Money.
--
-- ATTENTION : à exécuter avec un rôle ayant `bypassrls` ou après
-- avoir désactivé temporairement la RLS. Les UUID sont fixés
-- pour garantir la reproductibilité du seed.
-- ============================================================

-- ------------------------------------------------------------
-- 0. Nettoyage (idempotence)
-- ------------------------------------------------------------
truncate table audit_logs cascade;
truncate table payments cascade;
truncate table invoices cascade;
truncate table prescriptions cascade;
truncate table consultations cascade;
truncate table appointments cascade;
truncate table patients cascade;
truncate table users cascade;
truncate table subscriptions cascade;
truncate table tenants cascade;

-- ------------------------------------------------------------
-- 1. Tenant — Clinique du Plateau (Cocody, Abidjan)
-- ------------------------------------------------------------
insert into tenants (id, name, slug, type, city, district, phone, email, address, plan, status, code_prefix, created_at, updated_at)
values (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Clinique du Plateau',
  'clinique-plateau',
  'clinique',
  'Abidjan',
  'Cocody',
  '+225 27 22 49 87 30',
  'contact@clinique-plateau.ci',
  'Avenue Chardy, Cocody, Abidjan',
  'pro',
  'actif',
  'CP',
  now() - interval '180 days',
  now()
)
on conflict (slug) do update set
  name = excluded.name,
  code_prefix = excluded.code_prefix;

-- ------------------------------------------------------------
-- 2. Médecins (5) — utilisateurs rattachés au tenant
-- ------------------------------------------------------------
insert into users (id, tenant_id, email, name, role, phone, specialty, license_number, active, created_at, updated_at) values
  ('00000000-0000-0000-0000-000000000010'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   'a.kouassi@clinique-plateau.ci',
   'Dr. Aya Kouassi',
   'medecin',
   '+225 07 08 12 34 56',
   'Médecine générale',
   'CI-MG-2018-0431',
   true, now() - interval '180 days', now()),

  ('00000000-0000-0000-0000-000000000011'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   'k.yao@clinique-plateau.ci',
   'Dr. Konan Yao',
   'medecin',
   '+225 07 09 22 11 88',
   'Cardiologie',
   'CI-CARD-2015-0188',
   true, now() - interval '180 days', now()),

  ('00000000-0000-0000-0000-000000000012'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   'f.traore@clinique-plateau.ci',
   'Dr. Fatou Traoré',
   'medecin',
   '+225 05 64 78 90 12',
   'Pédiatrie',
   'CI-PED-2019-0512',
   true, now() - interval '180 days', now()),

  ('00000000-0000-0000-0000-000000000013'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   'i.cisse@clinique-plateau.ci',
   'Dr. Ibrahim Cissé',
   'medecin',
   '+225 01 22 33 44 55',
   'Gynécologie-Obstétrique',
   'CI-GYN-2016-0277',
   true, now() - interval '180 days', now()),

  ('00000000-0000-0000-0000-000000000014'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   'm.bamba@clinique-plateau.ci',
   'Dr. Mariam Bamba',
   'medecin',
   '+225 07 77 88 99 00',
   'Dermatologie',
   'CI-DERM-2020-0664',
   true, now() - interval '180 days', now()),

  -- Administrateur du cabinet (6e utilisateur)
  ('00000000-0000-0000-0000-000000000015'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   'admin@clinique-plateau.ci',
   'M. Adama Brou',
   'admin_cabinet',
   '+225 07 00 11 22 33',
   null,
   null,
   true, now() - interval '180 days', now()),

  -- Secrétaire médicale
  ('00000000-0000-0000-0000-000000000016'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   's.adjoua@clinique-plateau.ci',
   'Mme Adjoua N''Guessan',
   'secretaire',
   '+225 05 55 66 77 88',
   null,
   null,
   true, now() - interval '180 days', now()),

  -- Comptable
  ('00000000-0000-0000-0000-000000000017'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   'compta@clinique-plateau.ci',
   'M. Seydou Touré',
   'comptable',
   '+225 01 44 55 66 77',
   null,
   null,
   true, now() - interval '180 days', now());

-- ------------------------------------------------------------
-- 3. Patients (10) — noms ivoiriens, communes d'Abidjan
-- ------------------------------------------------------------
-- Les codes CI-CP-NNNN sont générés manuellement ici pour
-- rester déterministes (le trigger generate_patient_code
-- serait utilisé en production réelle).
-- ------------------------------------------------------------
insert into patients (id, tenant_id, code, first_name, last_name, gender, birth_date, phone, email, address, blood_type, weight, height, allergies, chronic_conditions, emergency_contact, insurance_provider, insurance_number, status, created_at, updated_at) values
  ('00000000-0000-0000-0000-000000000101'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   'CI-CP-0001', 'Aya', 'Kouassi', 'F', '1989-04-12',
   '+225 07 11 22 33 44', 'aya.kouassi@email.ci',
   'Rue des Jardins, Cocody', 'A+', 65.0, 168,
   '["Pénicilline"]'::jsonb, '["Migraine"]'::jsonb,
   'Kouadio Kouassi (frère) +225 07 99 88 77 66',
   'CNPS', 'CNPS-ABJ-2018-12345', 'actif',
   now() - interval '90 days', now()),

  ('00000000-0000-0000-0000-000000000102'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   'CI-CP-0002', 'Kouadio', 'Yao', 'M', '1975-09-23',
   '+225 07 22 33 44 55', 'kouadio.yao@email.ci',
   'Avenue Houphouët, Plateau', 'O+', 78.0, 175,
   '[]'::jsonb, '["Hypertension","Diabète type 2"]'::jsonb,
   'Adjoua Yao (épouse) +225 05 44 33 22 11',
   'CNPS', 'CNPS-ABJ-2015-67890', 'actif',
   now() - interval '85 days', now()),

  ('00000000-0000-0000-0000-000000000103'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   'CI-CP-0003', 'Fatou', 'Diallo', 'F', '1995-12-03',
   '+225 05 33 44 55 66', 'fatou.diallo@email.ci',
   'Rue 12, Yopougon', 'B+', 58.0, 162,
   '["Arachide"]'::jsonb, '[]'::jsonb,
   'Mamadou Diallo (père) +225 07 55 44 33 22',
   'Mutuelle NSIA', 'NSIA-2023-44556', 'actif',
   now() - interval '80 days', now()),

  ('00000000-0000-0000-0000-000000000104'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   'CI-CP-0004', 'Konan', 'Brou', 'M', '1988-06-15',
   '+225 01 44 55 66 77', 'konan.brou@email.ci',
   'Boulevard Lagunaire, Marcory', 'AB+', 82.0, 180,
   '[]'::jsonb, '["Asthme"]'::jsonb,
   'Awa Brou (sœur) +225 07 66 55 44 33',
   'CNPS', 'CNPS-ABJ-2020-11223', 'actif',
   now() - interval '75 days', now()),

  ('00000000-0000-0000-0000-000000000105'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   'CI-CP-0005', 'Mariam', 'Touré', 'F', '2001-02-28',
   '+225 07 55 66 77 88', 'mariam.toure@email.ci',
   'Avenue 13, Treichville', 'O-', 54.0, 158,
   '["Aspirine"]'::jsonb, '[]'::jsonb,
   'Aminata Touré (mère) +225 05 77 66 55 44',
   'Pas d''assurance', null, 'actif',
   now() - interval '70 days', now()),

  ('00000000-0000-0000-0000-000000000106'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   'CI-CP-0006', 'Ibrahim', 'Coulibaly', 'M', '1962-11-09',
   '+225 05 66 77 88 99', 'ibrahim.coulibaly@email.ci',
   'Rue 5, Adjamé', 'A+', 70.0, 170,
   '["Iode"]'::jsonb, '["Hypertension","Arthrose"]'::jsonb,
   'Salimata Coulibaly (fille) +225 07 88 77 66 55',
   'CNPS', 'CNPS-ABJ-2010-99887', 'actif',
   now() - interval '65 days', now()),

  ('00000000-0000-0000-0000-000000000107'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   'CI-CP-0007', 'Aminata', 'Koné', 'F', '2015-05-18',
   '+225 07 77 88 99 00', 'aminata.kone.parent@email.ci',
   'Rue 23, Abobo', 'B-', 25.0, 120,
   '[]'::jsonb, '["Drépanocytose"]'::jsonb,
   'Rokia Koné (mère) +225 05 99 88 77 66',
   'CNPS', 'CNPS-ABJ-2021-55667', 'actif',
   now() - interval '60 days', now()),

  ('00000000-0000-0000-0000-000000000108'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   'CI-CP-0008', 'Koffi', 'N''Guessan', 'M', '1979-08-30',
   '+225 01 55 66 77 88', 'koffi.nguessan@email.ci',
   'Rue 9, Koumassi', 'A-', 88.0, 178,
   '["Sulfamides"]'::jsonb, '["Diabète type 2"]'::jsonb,
   'Affoué N''Guessan (épouse) +225 07 00 99 88 77',
   'Mutuelle ASKIA', 'ASKIA-2019-33445', 'actif',
   now() - interval '55 days', now()),

  ('00000000-0000-0000-0000-000000000109'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   'CI-CP-0009', 'Adjoua', 'Aka', 'F', '1992-03-14',
   '+225 07 88 99 00 11', 'adjoua.aka@email.ci',
   'Boulevard Latrille, Cocody', 'AB+', 62.0, 165,
   '[]'::jsonb, '[]'::jsonb,
   'Yao Aka (père) +225 05 11 22 33 44',
   'CNPS', 'CNPS-ABJ-2022-77889', 'actif',
   now() - interval '50 days', now()),

  ('00000000-0000-0000-0000-000000000110'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   'CI-CP-0010', 'Seydou', 'Gnagne', 'M', '1985-07-21',
   '+225 05 99 00 11 22', 'seydou.gnagne@email.ci',
   'Avenue 8, Port-Bouët', 'O+', 75.0, 172,
   '["Pollen"]'::jsonb, '["Migraine"]'::jsonb,
   'Awa Gnagne (sœur) +225 07 22 11 00 99',
   'CNPS', 'CNPS-ABJ-2017-22334', 'actif',
   now() - interval '45 days', now());

-- ------------------------------------------------------------
-- 4. Rendez-vous (8) — dont téléconsultations
-- ------------------------------------------------------------
insert into appointments (id, tenant_id, patient_id, doctor_id, date, duration, reason, type, status, notes, room_url, created_at, updated_at) values
  ('00000000-0000-0000-0000-000000000201'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   '00000000-0000-0000-0000-000000000101'::uuid,
   '00000000-0000-0000-0000-000000000010'::uuid,
   now() + interval '1 day', 30, 'Consultation de routine', 'presentiel', 'confirme', null, null,
   now() - interval '5 days', now()),

  ('00000000-0000-0000-0000-000000000202'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   '00000000-0000-0000-0000-000000000102'::uuid,
   '00000000-0000-0000-0000-000000000011'::uuid,
   now() + interval '1 day', 45, 'Suivi cardiologique', 'teleconsultation', 'confirme',
   'Patient hypertendu — vérification tension à domicile',
   'https://medisaas.daily.co/ci-cp-cardio-20240116', now() - interval '4 days', now()),

  ('00000000-0000-0000-0000-000000000203'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   '00000000-0000-0000-0000-000000000103'::uuid,
   '00000000-0000-0000-0000-000000000012'::uuid,
   now() + interval '2 days', 30, 'Consultation pédiatrique enfant', 'presentiel', 'planifie', null, null,
   now() - interval '3 days', now()),

  ('00000000-0000-0000-0000-000000000204'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   '00000000-0000-0000-0000-000000000104'::uuid,
   '00000000-0000-0000-0000-000000000013'::uuid,
   now() - interval '5 days', 60, 'Échographie obstétricale', 'presentiel', 'termine', null, null,
   now() - interval '12 days', now()),

  ('00000000-0000-0000-0000-000000000205'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   '00000000-0000-0000-0000-000000000106'::uuid,
   '00000000-0000-0000-0000-000000000010'::uuid,
   now() - interval '7 days', 30, 'Douleurs thoraciques', 'presentiel', 'termine', null, null,
   now() - interval '14 days', now()),

  ('00000000-0000-0000-0000-000000000206'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   '00000000-0000-0000-0000-000000000108'::uuid,
   '00000000-0000-0000-0000-000000000014'::uuid,
   now() + interval '3 days', 30, 'Éruption cutanée', 'teleconsultation', 'planifie', null,
   'https://medisaas.daily.co/ci-cp-derm-20240118', now() - interval '2 days', now()),

  ('00000000-0000-0000-0000-000000000207'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   '00000000-0000-0000-0000-000000000110'::uuid,
   '00000000-0000-0000-0000-000000000011'::uuid,
   now() + interval '5 days', 45, 'Bilan cardiovasculaire annuel', 'presentiel', 'confirme', null, null,
   now() - interval '1 day', now()),

  ('00000000-0000-0000-0000-000000000208'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   '00000000-0000-0000-0000-000000000105'::uuid,
   '00000000-0000-0000-0000-000000000012'::uuid,
   now() - interval '2 days', 30, 'Consultation grippe saisonnière', 'presentiel', 'termine', null, null,
   now() - interval '9 days', now());

-- ------------------------------------------------------------
-- 5. Consultations (compte-rendus médicaux)
-- ------------------------------------------------------------
insert into consultations (id, tenant_id, appointment_id, patient_id, doctor_id, date, symptoms, diagnosis, treatment, vitals_temp, vitals_tension, vitals_pulse, vitals_weight, notes, created_at) values
  ('00000000-0000-0000-0000-000000000301'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   '00000000-0000-0000-0000-000000000204'::uuid,
   '00000000-0000-0000-0000-000000000104'::uuid,
   '00000000-0000-0000-0000-000000000013'::uuid,
   now() - interval '5 days',
   'Grossesse à 22 SA, patiente asymptomatique',
   'Grossesse normale à 22 semaines d''aménorrhée',
   'Surveillance mensuelle, supplémentation acide folique',
   36.8, '11/7', 78, 70.0,
   'Échographie de contrôle normale. RDV dans 4 semaines.',
   now() - interval '5 days'),

  ('00000000-0000-0000-0000-000000000302'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   '00000000-0000-0000-0000-000000000205'::uuid,
   '00000000-0000-0000-0000-000000000106'::uuid,
   '00000000-0000-0000-0000-000000000010'::uuid,
   now() - interval '7 days',
   'Douleurs thoraciques atypiques, fatigue',
   'Hypertension artérielle mal équilibrée',
   'Ajustement antihypertenseur, ECG de contrôle sous 48h',
   37.0, '16/9', 88, 70.0,
   'ECG sans anomalie majeure. Bilan biologique prescrit.',
   now() - interval '7 days'),

  ('00000000-0000-0000-0000-000000000303'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   '00000000-0000-0000-0000-000000000208'::uuid,
   '00000000-0000-0000-0000-000000000105'::uuid,
   '00000000-0000-0000-0000-000000000012'::uuid,
   now() - interval '2 days',
   'Syndrome grippal : fièvre, courbatures, toux sèche',
   'Syndrome viral saisonnier',
   'Traitement symptomatique, repos, hydratation',
   38.6, '12/7', 96, 54.0,
   'Test paludisme négatif. Revenir si aggravation.',
   now() - interval '2 days');

-- ------------------------------------------------------------
-- 6. Ordonnances (5)
-- ------------------------------------------------------------
insert into prescriptions (id, tenant_id, patient_id, doctor_id, consultation_id, number, date, medications, validity_days, status, notes, created_at) values
  ('00000000-0000-0000-0000-000000000401'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   '00000000-0000-0000-0000-000000000104'::uuid,
   '00000000-0000-0000-0000-000000000013'::uuid,
   '00000000-0000-0000-0000-000000000301'::uuid,
   'ORD-2024-0001', now() - interval '5 days',
   '[{"name":"Acide folique 5mg","dosage":"1 comprimé","frequency":"1 fois/jour","duration":"30 jours","instructions":"Matin à jeun"}]'::jsonb,
   30, 'active', 'Supplémentation grossesse', now() - interval '5 days'),

  ('00000000-0000-0000-0000-000000000402'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   '00000000-0000-0000-0000-000000000106'::uuid,
   '00000000-0000-0000-0000-000000000010'::uuid,
   '00000000-0000-0000-0000-000000000302'::uuid,
   'ORD-2024-0002', now() - interval '7 days',
   '[{"name":"Amlodipine 10mg","dosage":"1 comprimé","frequency":"1 fois/jour","duration":"30 jours","instructions":"Matin"},{"name":"Aspirine 100mg","dosage":"1 comprimé","frequency":"1 fois/jour","duration":"30 jours","instructions":"Soir au coucher"}]'::jsonb,
   30, 'active', 'HTA — ajustement posologique', now() - interval '7 days'),

  ('00000000-0000-0000-0000-000000000403'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   '00000000-0000-0000-0000-000000000105'::uuid,
   '00000000-0000-0000-0000-000000000012'::uuid,
   '00000000-0000-0000-0000-000000000303'::uuid,
   'ORD-2024-0003', now() - interval '2 days',
   '[{"name":"Paracétamol 500mg","dosage":"2 comprimés","frequency":"3 fois/jour","duration":"5 jours","instructions":"Si fièvre > 38°C"},{"name":"Vitamine C 1g","dosage":"1 comprimé","frequency":"1 fois/jour","duration":"10 jours","instructions":"Matin"}]'::jsonb,
   10, 'active', 'Syndrome viral — traitement symptomatique', now() - interval '2 days'),

  ('00000000-0000-0000-0000-000000000404'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   '00000000-0000-0000-0000-000000000102'::uuid,
   '00000000-0000-0000-0000-000000000011'::uuid,
   null,
   'ORD-2024-0004', now() - interval '15 days',
   '[{"name":"Metformine 850mg","dosage":"1 comprimé","frequency":"2 fois/jour","duration":"90 jours","instructions":"Au cours des repas"}]'::jsonb,
   90, 'active', 'Diabète type 2 — renouvellement', now() - interval '15 days'),

  ('00000000-0000-0000-0000-000000000405'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   '00000000-0000-0000-0000-000000000108'::uuid,
   '00000000-0000-0000-0000-000000000014'::uuid,
   null,
   'ORD-2024-0005', now() - interval '20 days',
   '[{"name":"Crème hydrocortisone 1%","dosage":"Application locale","frequency":"2 fois/jour","duration":"15 jours","instructions":"Sur zone atteinte"}]'::jsonb,
   15, 'expiree', 'Dermatite — traitement local', now() - interval '20 days');

-- ------------------------------------------------------------
-- 7. Factures (6) — avec TVA 18 % CI
-- ------------------------------------------------------------
insert into invoices (id, tenant_id, patient_id, number, date, due_date, items, subtotal, tax, total, status, created_at, updated_at) values
  ('00000000-0000-0000-0000-000000000501'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   '00000000-0000-0000-0000-000000000104'::uuid,
   'FAC-2024-0001', now() - interval '5 days', now() + interval '25 days',
   '[{"description":"Consultation gynécologique","quantity":1,"unitPrice":25000},{"description":"Échographie obstétricale","quantity":1,"unitPrice":30000}]'::jsonb,
   55000, 9900, 64900, 'payee', now() - interval '5 days', now()),

  ('00000000-0000-0000-0000-000000000502'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   '00000000-0000-0000-0000-000000000106'::uuid,
   'FAC-2024-0002', now() - interval '7 days', now() + interval '23 days',
   '[{"description":"Consultation cardiologie","quantity":1,"unitPrice":35000},{"description":"ECG 12 dérivations","quantity":1,"unitPrice":15000}]'::jsonb,
   50000, 9000, 59000, 'payee', now() - interval '7 days', now()),

  ('00000000-0000-0000-0000-000000000503'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   '00000000-0000-0000-0000-000000000105'::uuid,
   'FAC-2024-0003', now() - interval '2 days', now() + interval '28 days',
   '[{"description":"Consultation pédiatrique","quantity":1,"unitPrice":20000}]'::jsonb,
   20000, 3600, 23600, 'payee', now() - interval '2 days', now()),

  ('00000000-0000-0000-0000-000000000504'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   '00000000-0000-0000-0000-000000000101'::uuid,
   'FAC-2024-0004', now() + interval '1 day', now() + interval '31 days',
   '[{"description":"Consultation médecine générale","quantity":1,"unitPrice":15000}]'::jsonb,
   15000, 2700, 17700, 'impayee', now() + interval '1 day', now() + interval '1 day'),

  ('00000000-0000-0000-0000-000000000505'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   '00000000-0000-0000-0000-000000000102'::uuid,
   'FAC-2024-0005', now() + interval '1 day', now() + interval '31 days',
   '[{"description":"Téléconsultation cardiologie","quantity":1,"unitPrice":30000}]'::jsonb,
   30000, 5400, 35400, 'impayee', now() + interval '1 day', now() + interval '1 day'),

  ('00000000-0000-0000-0000-000000000506'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   '00000000-0000-0000-0000-000000000110'::uuid,
   'FAC-2024-0006', now() + interval '5 days', now() + interval '35 days',
   '[{"description":"Bilan cardiovasculaire complet","quantity":1,"unitPrice":80000}]'::jsonb,
   80000, 14400, 94400, 'impayee', now() + interval '5 days', now() + interval '5 days');

-- ------------------------------------------------------------
-- 8. Paiements Mobile Money (3)
-- ------------------------------------------------------------
insert into payments (id, tenant_id, invoice_id, amount, method, provider, reference, status, phone, payer_name, date) values
  ('00000000-0000-0000-0000-000000000601'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   '00000000-0000-0000-0000-000000000501'::uuid,
   64900, 'orange_money', 'CINETPAY-TX-202401101530001',
   'OMP-2024-0001', 'reussi', '+225 07 22 33 44 55', 'Konan Brou',
   now() - interval '5 days'),

  ('00000000-0000-0000-0000-000000000602'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   '00000000-0000-0000-0000-000000000502'::uuid,
   59000, 'wave', 'CINETPAY-TX-202401081230002',
   'WAVE-2024-0002', 'reussi', '+225 05 66 77 88 99', 'Ibrahim Coulibaly',
   now() - interval '7 days'),

  ('00000000-0000-0000-0000-000000000603'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   '00000000-0000-0000-0000-000000000503'::uuid,
   23600, 'mtn_money', 'CINETPAY-TX-202401131700003',
   'MTN-2024-0003', 'reussi', '+225 07 55 66 77 88', 'Mariam Touré',
   now() - interval '2 days');

-- ------------------------------------------------------------
-- 9. Abonnement SaaS du tenant (plan Pro)
-- ------------------------------------------------------------
insert into subscriptions (id, tenant_id, plan, status, billing_cycle, amount, seats, current_period_start, current_period_end, payment_method, created_at, updated_at) values
  ('00000000-0000-0000-0000-000000000701'::uuid,
   '00000000-0000-0000-0000-000000000001'::uuid,
   'pro', 'actif', 'mensuel', 75000, 10,
   now() - interval '15 days', now() + interval '15 days',
   'orange_money', now() - interval '180 days', now())
on conflict (tenant_id) do update set
  plan = excluded.plan,
  status = excluded.status,
  amount = excluded.amount,
  current_period_start = excluded.current_period_start,
  current_period_end = excluded.current_period_end;

-- ------------------------------------------------------------
-- 10. Audit logs initiaux (trace de création du tenant)
-- ------------------------------------------------------------
insert into audit_logs (tenant_id, user_id, action, entity, entity_id, metadata, created_at) values
  ('00000000-0000-0000-0000-000000000001'::uuid,
   '00000000-0000-0000-0000-000000000015'::uuid,
   'tenant.create', 'tenant', '00000000-0000-0000-0000-000000000001',
   '{"source":"seed","plan":"pro"}'::jsonb,
   now() - interval '180 days'),
  ('00000000-0000-0000-0000-000000000001'::uuid,
   '00000000-0000-0000-0000-000000000015'::uuid,
   'subscription.activate', 'subscription', '00000000-0000-0000-0000-000000000701',
   '{"plan":"pro","amount":75000,"cycle":"mensuel"}'::jsonb,
   now() - interval '15 days');

-- ============================================================
-- Fin du seed — Clinique du Plateau prête pour la démo.
-- 1 tenant, 8 utilisateurs (5 médecins + admin + secrétaire +
-- comptable), 10 patients, 8 RDV, 3 consultations, 5 ordonnances,
-- 6 factures, 3 paiements Mobile Money, 1 abonnement SaaS.
-- ============================================================
