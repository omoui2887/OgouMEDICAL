-- ============================================================
-- MediSaaS CI — Migration 2 : Trigger d'audit (Loi 2013-450)
-- ============================================================
-- Journalise chaque INSERT / UPDATE / DELETE sur les tables
-- `patients` et `prescriptions` dans `audit_logs`.
-- Conformité : Loi ivoirienne n°2013-450 / ARTCI — traçabilité
-- obligatoire des accès et modifications des données de santé.
-- ============================================================
-- Champs remplis :
--   - action      : 'INSERT' | 'UPDATE' | 'DELETE'
--   - entity      : 'patients' | 'prescriptions'
--   - entity_id   : id de la ligne concernée (texte)
--   - user_id     : utilisateur Supabase Auth (auth.uid())
--   - tenant_id   : tenant courant (get_current_tenant_id())
--   - old_data    : ligne avant modification (jsonb)
--   - new_data    : ligne après modification (jsonb)
--   - metadata    : métadonnées additionnelles (jsonb)
--   - created_at  : horodatage serveur
-- ============================================================

-- ------------------------------------------------------------
-- 1. Fonction générique d'audit
-- ------------------------------------------------------------
-- SECURITY DEFINER : le trigger s'exécute avec les droits du
-- propriétaire afin de pouvoir écrire dans audit_logs même si
-- l'utilisateur courant n'a pas le droit INSERT direct (RLS).
-- ------------------------------------------------------------
create or replace function public.audit_log_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_user_id   uuid;
  v_entity    text := tg_table_name;
  v_action    text := tg_op;
  v_entity_id text;
  v_old       jsonb;
  v_new       jsonb;
begin
  -- Tenant et utilisateur courants (depuis le JWT)
  v_tenant_id := public.get_current_tenant_id();
  v_user_id   := public.get_current_user_id();

  -- Si la table a un tenant_id, on l'utilise en priorité
  if v_tenant_id is null and tg_table_name in
     ('patients', 'prescriptions') then
    if tg_op = 'DELETE' then
      v_tenant_id := (old).tenant_id;
    else
      v_tenant_id := (new).tenant_id;
    end if;
  end if;

  -- Données avant / après
  if tg_op in ('UPDATE', 'DELETE') then
    v_old := to_jsonb(old);
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    v_new := to_jsonb(new);
  end if;

  -- Identifiant de l'entité
  if tg_op = 'DELETE' then
    v_entity_id := (old).id::text;
  else
    v_entity_id := (new).id::text;
  end if;

  -- Insertion dans le journal d'audit
  insert into audit_logs (
    tenant_id, user_id, action, entity, entity_id,
    old_data, new_data, metadata, created_at
  )
  values (
    v_tenant_id,
    v_user_id,
    v_action,
    v_entity,
    v_entity_id,
    v_old,
    v_new,
    jsonb_build_object(
      'table',   tg_table_name,
      'schema',  tg_table_schema,
      'tag',     tg_tag,
      'ts',      now()
    ),
    now()
  );

  -- Pour les triggers AFTER, on retourne null (INSERT/UPDATE/DELETE)
  return null;
end;
$$;

-- ------------------------------------------------------------
-- 2. Triggers AFTER sur `patients`
-- ------------------------------------------------------------
drop trigger if exists trg_patients_audit_insert on patients;
drop trigger if exists trg_patients_audit_update on patients;
drop trigger if exists trg_patients_audit_delete on patients;

create trigger trg_patients_audit_insert
  after insert on patients
  for each row execute function public.audit_log_change();

create trigger trg_patients_audit_update
  after update on patients
  for each row execute function public.audit_log_change();

create trigger trg_patients_audit_delete
  after delete on patients
  for each row execute function public.audit_log_change();

-- ------------------------------------------------------------
-- 3. Triggers AFTER sur `prescriptions`
-- ------------------------------------------------------------
drop trigger if exists trg_prescriptions_audit_insert on prescriptions;
drop trigger if exists trg_prescriptions_audit_update on prescriptions;
drop trigger if exists trg_prescriptions_audit_delete on prescriptions;

create trigger trg_prescriptions_audit_insert
  after insert on prescriptions
  for each row execute function public.audit_log_change();

create trigger trg_prescriptions_audit_update
  after update on prescriptions
  for each row execute function public.audit_log_change();

create trigger trg_prescriptions_audit_delete
  after delete on prescriptions
  for each row execute function public.audit_log_change();

-- ------------------------------------------------------------
-- 4. Politique complémentaire : seuls les rôles autorisés
--    peuvent purger le journal d'audit (rétention 10 ans).
-- ------------------------------------------------------------
-- La purge est exécutée par un job planifié (pg_cron) avec le
-- rôle service_role qui contourne la RLS. Aucune politique
-- DELETE n'est donc définie ici pour les rôles applicatifs.
-- ------------------------------------------------------------
comment on table audit_logs is
  'Journal d''audit conforme Loi ivoirienne n°2013-450 — '
  'rétention 10 ans, purge via pg_cron uniquement.';

-- ============================================================
-- Fin de la migration 2 — Triggers d'audit actifs sur patients
-- et prescriptions.
-- ============================================================
