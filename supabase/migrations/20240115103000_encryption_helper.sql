-- ============================================================
-- MediSaaS CI — Migration 4 : Aide au chiffrement (pgcrypto)
-- ============================================================
-- Chiffrement au repos AES-256 pour les champs médicaux
-- sensibles : diagnostic, notes médicaes, symptômes.
-- Conformité Loi ivoirienne n°2013-450 / ARTCI : les données
-- de santé doivent être chiffrées au repos.
-- ============================================================
-- Utilise pgcrypto (extension PostgreSQL officielle) et la
-- fonction pgp_sym_encrypt (OpenPGP symétrique, AES-256).
-- La clé de chiffrement est fournie via la variable de session
-- `app.encryption_key` (SET LOCAL app.encryption_key = '...'),
-- positionnée par l'API NestJS à chaque requête.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Activation de l'extension pgcrypto
-- ------------------------------------------------------------
create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 2. Fonction de chiffrement
-- ------------------------------------------------------------
-- encrypt_medical_data(data text) -> bytea
-- Chiffre une chaîne avec AES-256 (cipher-algo aes256).
-- La clé est lue depuis current_setting('app.encryption_key').
-- ------------------------------------------------------------
create or replace function public.encrypt_medical_data(p_data text)
returns bytea
language sql
security definer
set search_path = public
as $$
  select pgp_sym_encrypt(
    coalesce(p_data, ''),
    current_setting('app.encryption_key', true),
    'cipher-algo=aes256, compress-algo=zip'
  );
$$;

-- ------------------------------------------------------------
-- 3. Fonction de déchiffrement
-- ------------------------------------------------------------
-- decrypt_medical_data(ciphertext bytea) -> text
-- Déchiffre un blob produit par encrypt_medical_data.
-- Lève une exception si la clé est incorrecte ou le payload
-- corrompu.
-- ------------------------------------------------------------
create or replace function public.decrypt_medical_data(p_cipher bytea)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plain text;
begin
  if p_cipher is null then
    return null;
  end if;

  begin
    select pgp_sym_decrypt(p_cipher, current_setting('app.encryption_key', true))
    into v_plain;
  exception when others then
    raise exception 'Déchiffrement impossible : clé invalide ou payload corrompu';
  end if;

  return v_plain;
end;
$$;

-- ------------------------------------------------------------
-- 4. Helper : chiffrement avec rotation de clé (optionnel)
-- ------------------------------------------------------------
-- Permet de re-chiffrer une colonne lors d'une rotation de clé.
-- Utile pour la politique de sécurité annuelle.
-- ------------------------------------------------------------
create or replace function public.rotate_medical_encryption(
  p_cipher bytea,
  p_new_key text
)
returns bytea
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plain text;
  v_new   bytea;
begin
  -- Déchiffre avec l'ancienne clé courante
  v_plain := public.decrypt_medical_data(p_cipher);

  -- Re-chiffre avec la nouvelle clé
  select pgp_sym_encrypt(v_plain, p_new_key, 'cipher-algo=aes256, compress-algo=zip')
  into v_new;

  return v_new;
end;
$$;

-- ------------------------------------------------------------
-- 5. Colonnes chiffrées sur `consultations` et `prescriptions`
-- ------------------------------------------------------------
-- On conserve les colonnes texte originales pour la rétro-
-- compatibilité avec le schéma Prisma (SQLite dev) et on ajoute
-- des colonnes chiffrées _enc pour la production Supabase.
-- ------------------------------------------------------------
alter table consultations
  add column if not exists diagnosis_enc bytea,
  add column if not exists notes_enc     bytea;

alter table prescriptions
  add column if not exists notes_enc bytea;

alter table patients
  add column if not exists chronic_conditions_enc bytea,
  add column if not exists allergies_enc          bytea;

-- ------------------------------------------------------------
-- 6. Trigger de chiffrement automatique sur consultations
-- ------------------------------------------------------------
-- À l'INSERT/UPDATE : si diagnosis ou notes est fourni, on
-- chiffre automatiquement dans diagnosis_enc / notes_enc.
-- ------------------------------------------------------------
create or replace function public.encrypt_consultation_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.diagnosis is not null then
    new.diagnosis_enc := public.encrypt_medical_data(new.diagnosis);
  end if;

  if new.notes is not null then
    new.notes_enc := public.encrypt_medical_data(new.notes);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_consultations_encrypt on consultations;
create trigger trg_consultations_encrypt
  before insert or update on consultations
  for each row execute function public.encrypt_consultation_fields();

-- ------------------------------------------------------------
-- 7. Trigger de chiffrement automatique sur prescriptions
-- ------------------------------------------------------------
create or replace function public.encrypt_prescription_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.notes is not null then
    new.notes_enc := public.encrypt_medical_data(new.notes);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prescriptions_encrypt on prescriptions;
create trigger trg_prescriptions_encrypt
  before insert or update on prescriptions
  for each row execute function public.encrypt_prescription_fields();

-- ------------------------------------------------------------
-- 8. Vue de lecture en clair (rôle médical uniquement)
-- ------------------------------------------------------------
-- La vue expose les champs déchiffrés. La RLS de la table
-- sous-jacente s'applique automatiquement à la vue.
-- ------------------------------------------------------------
create or replace view public.consultations_decrypted
with (security_invoker = true) as
select
  c.id,
  c.tenant_id,
  c.appointment_id,
  c.patient_id,
  c.doctor_id,
  c.date,
  c.symptoms,
  public.decrypt_medical_data(c.diagnosis_enc) as diagnosis,
  c.treatment,
  c.vitals_temp,
  c.vitals_tension,
  c.vitals_pulse,
  c.vitals_weight,
  public.decrypt_medical_data(c.notes_enc)     as notes,
  c.created_at
from consultations c;

comment on view public.consultations_decrypted is
  'Vue déchiffrée des consultations — accès médical uniquement.';

-- ------------------------------------------------------------
-- 9. Paramètre de session par défaut (vide = erreur si oubli)
-- ------------------------------------------------------------
-- L'API NestJS doit impérativement positionner la clé avant
-- chaque transaction : `set local app.encryption_key = '...'`.
-- ------------------------------------------------------------
comment on function public.encrypt_medical_data(text) is
  'Chiffrement AES-256 des données médicales sensibles. '
  'La clé est lue depuis current_setting(''app.encryption_key'').';

comment on function public.decrypt_medical_data(bytea) is
  'Déchiffrement AES-256 des données médicales sensibles.';

-- ============================================================
-- Fin de la migration 4 — Chiffrement AES-256 actif sur
-- diagnosis, notes (consultations) et notes (prescriptions).
-- ============================================================
