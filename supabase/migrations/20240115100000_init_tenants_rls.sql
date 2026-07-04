-- ============================================================
-- MediSaaS CI — Migration 1 : Initialisation multi-tenant + RLS
-- ============================================================
-- Active Row Level Security sur toutes les tables métier.
-- Politique : un utilisateur ne voit que les lignes où
--   tenant_id = app_metadata.tenant_id du JWT Supabase Auth.
-- Conformité : Loi ivoirienne n°2013-450 (isolation des données
--   par cabinet médical) + ARTCI.
-- ============================================================

-- ------------------------------------------------------------
-- 0. Schéma et tables (PostgreSQL 15+ / Supabase)
-- ------------------------------------------------------------
-- Les noms de tables suivent la convention snake_case, mapping
-- du schéma Prisma (Tenant → tenants, User → users, etc.).
-- ------------------------------------------------------------
create table if not exists tenants (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text unique not null,
  type         text not null default 'cabinet',
  city         text not null default 'Abidjan',
  district     text,
  phone        text,
  email        text,
  address      text,
  plan         text not null default 'essentiel',
  status       text not null default 'actif',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists users (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid references tenants(id) on delete set null,
  email          text unique not null,
  name           text not null,
  role           text not null default 'secretaire',
  phone          text,
  specialty      text,
  avatar         text,
  license_number text,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists patients (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references tenants(id) on delete cascade,
  code                text not null,
  first_name          text not null,
  last_name           text not null,
  gender              text,
  birth_date          date,
  phone               text,
  email               text,
  address             text,
  blood_type          text,
  weight              numeric,
  height              numeric,
  allergies           jsonb,
  chronic_conditions  jsonb,
  emergency_contact   text,
  insurance_provider  text,
  insurance_number    text,
  status              text not null default 'actif',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (tenant_id, code)
);

create table if not exists appointments (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  patient_id  uuid not null references patients(id) on delete cascade,
  doctor_id   uuid not null references users(id) on delete restrict,
  date        timestamptz not null,
  duration    integer not null default 30,
  reason      text not null,
  type        text not null default 'presentiel',
  status      text not null default 'planifie',
  notes       text,
  room_url    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists consultations (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  appointment_id  uuid unique references appointments(id) on delete set null,
  patient_id      uuid not null references patients(id) on delete cascade,
  doctor_id       uuid not null references users(id) on delete restrict,
  date            timestamptz not null default now(),
  symptoms        text not null,
  diagnosis       text not null,
  treatment       text not null,
  vitals_temp     numeric,
  vitals_tension  text,
  vitals_pulse    integer,
  vitals_weight   numeric,
  notes           text,
  created_at      timestamptz not null default now()
);

create table if not exists prescriptions (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references tenants(id) on delete cascade,
  patient_id       uuid not null references patients(id) on delete cascade,
  doctor_id        uuid not null references users(id) on delete restrict,
  consultation_id  uuid references consultations(id) on delete set null,
  number           text not null,
  date             timestamptz not null default now(),
  medications      jsonb not null,
  validity_days    integer not null default 30,
  status           text not null default 'active',
  notes            text,
  created_at       timestamptz not null default now(),
  unique (tenant_id, number)
);

create table if not exists invoices (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  patient_id  uuid not null references patients(id) on delete cascade,
  number      text not null,
  date        timestamptz not null default now(),
  due_date    timestamptz,
  items       jsonb not null,
  subtotal    integer not null,
  tax         integer not null default 0,
  total       integer not null,
  status      text not null default 'impayee',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (tenant_id, number)
);

create table if not exists payments (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  invoice_id  uuid not null references invoices(id) on delete cascade,
  amount      integer not null,
  method      text not null,
  provider    text,
  reference   text,
  status      text not null default 'en_attente',
  phone       text,
  payer_name  text,
  date        timestamptz not null default now()
);

create table if not exists subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid unique not null references tenants(id) on delete cascade,
  plan                  text not null,
  status                text not null default 'actif',
  billing_cycle         text not null default 'mensuel',
  amount                integer not null,
  seats                 integer not null default 5,
  current_period_start  timestamptz not null,
  current_period_end    timestamptz not null,
  payment_method        text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table if not exists audit_logs (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid,
  user_id     uuid,
  action      text not null,
  entity      text,
  entity_id   text,
  ip          text,
  user_agent  text,
  metadata    jsonb,
  old_data    jsonb,
  new_data    jsonb,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 1. Fonction utilitaire : extraction du tenant_id du JWT
-- ------------------------------------------------------------
-- Supabase Auth encode le tenant dans app_metadata.tenant_id.
-- Cette fonction est SECURITY DEFINER (s'exécute avec les
-- droits du propriétaire) pour rester accessible en lecture
-- depuis les politiques RLS.
-- ------------------------------------------------------------
create or replace function public.get_current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select nullif(
    (auth.jwt() -> 'app_metadata' ->> 'tenant_id'),
    ''
  )::uuid;
$$;

-- ------------------------------------------------------------
-- 2. Fonction utilitaire : extraction du user_id Supabase Auth
-- ------------------------------------------------------------
create or replace function public.get_current_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid();
$$;

-- ------------------------------------------------------------
-- 3. Activation de Row Level Security sur toutes les tables
-- ------------------------------------------------------------
alter table tenants        enable row level security;
alter table users          enable row level security;
alter table patients       enable row level security;
alter table appointments   enable row level security;
alter table consultations  enable row level security;
alter table prescriptions  enable row level security;
alter table invoices       enable row level security;
alter table payments       enable row level security;
alter table subscriptions  enable row level security;
alter table audit_logs     enable row level security;

-- ------------------------------------------------------------
-- 4. Politiques RLS — tenants
-- ------------------------------------------------------------
-- Le super_admin (rôle global, hors tenant) voit tous les tenants.
-- Les autres utilisateurs ne voient que leur propre tenant.
-- ------------------------------------------------------------
create policy "tenants_select_own"
  on tenants for select
  using (
    id = get_current_tenant_id()
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );

create policy "tenants_update_own"
  on tenants for update
  using (
    id = get_current_tenant_id()
    and (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin_cabinet', 'super_admin')
  );

-- ------------------------------------------------------------
-- 5. Politiques RLS — users (membres de l'équipe du cabinet)
-- ------------------------------------------------------------
create policy "users_select_own_tenant"
  on users for select
  using (
    tenant_id = get_current_tenant_id()
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );

create policy "users_insert_own_tenant"
  on users for insert
  with check (
    tenant_id = get_current_tenant_id()
    and (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin_cabinet', 'super_admin')
  );

create policy "users_update_own_tenant"
  on users for update
  using (
    tenant_id = get_current_tenant_id()
    and (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin_cabinet', 'super_admin')
  );

create policy "users_delete_own_tenant"
  on users for delete
  using (
    tenant_id = get_current_tenant_id()
    and (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin_cabinet', 'super_admin')
  );

-- ------------------------------------------------------------
-- 6. Politiques RLS — patients (Dossier Patient Numérique)
-- ------------------------------------------------------------
-- Le patient lui-même ne voit que sa propre fiche (via
-- app_metadata.patient_id). Les médecins/secrétaires du cabinet
-- voient tous les patients de leur tenant.
-- ------------------------------------------------------------
create policy "patients_select_own_tenant"
  on patients for select
  using (
    tenant_id = get_current_tenant_id()
    and (
      (auth.jwt() -> 'app_metadata' ->> 'role') in
        ('super_admin', 'admin_cabinet', 'medecin', 'secretaire', 'comptable')
      or id = nullif(
        (auth.jwt() -> 'app_metadata' ->> 'patient_id'), ''
      )::uuid
    )
  );

create policy "patients_insert_own_tenant"
  on patients for insert
  with check (
    tenant_id = get_current_tenant_id()
    and (auth.jwt() -> 'app_metadata' ->> 'role') in
        ('super_admin', 'admin_cabinet', 'medecin', 'secretaire')
  );

create policy "patients_update_own_tenant"
  on patients for update
  using (
    tenant_id = get_current_tenant_id()
    and (auth.jwt() -> 'app_metadata' ->> 'role') in
        ('super_admin', 'admin_cabinet', 'medecin', 'secretaire')
  );

create policy "patients_delete_own_tenant"
  on patients for delete
  using (
    tenant_id = get_current_tenant_id()
    and (auth.jwt() -> 'app_metadata' ->> 'role') in
        ('super_admin', 'admin_cabinet')
  );

-- ------------------------------------------------------------
-- 7. Politiques RLS — appointments
-- ------------------------------------------------------------
create policy "appointments_select_own_tenant"
  on appointments for select
  using (
    tenant_id = get_current_tenant_id()
  );

create policy "appointments_insert_own_tenant"
  on appointments for insert
  with check (
    tenant_id = get_current_tenant_id()
    and (auth.jwt() -> 'app_metadata' ->> 'role') in
        ('super_admin', 'admin_cabinet', 'medecin', 'secretaire', 'patient')
  );

create policy "appointments_update_own_tenant"
  on appointments for update
  using (
    tenant_id = get_current_tenant_id()
    and (auth.jwt() -> 'app_metadata' ->> 'role') in
        ('super_admin', 'admin_cabinet', 'medecin', 'secretaire')
  );

create policy "appointments_delete_own_tenant"
  on appointments for delete
  using (
    tenant_id = get_current_tenant_id()
    and (auth.jwt() -> 'app_metadata' ->> 'role') in
        ('super_admin', 'admin_cabinet', 'secretaire')
  );

-- ------------------------------------------------------------
-- 8. Politiques RLS — consultations
-- ------------------------------------------------------------
create policy "consultations_select_own_tenant"
  on consultations for select
  using (
    tenant_id = get_current_tenant_id()
    and (auth.jwt() -> 'app_metadata' ->> 'role') in
        ('super_admin', 'admin_cabinet', 'medecin', 'comptable')
  );

create policy "consultations_insert_own_tenant"
  on consultations for insert
  with check (
    tenant_id = get_current_tenant_id()
    and (auth.jwt() -> 'app_metadata' ->> 'role') in
        ('super_admin', 'admin_cabinet', 'medecin')
  );

create policy "consultations_update_own_tenant"
  on consultations for update
  using (
    tenant_id = get_current_tenant_id()
    and (auth.jwt() -> 'app_metadata' ->> 'role') in
        ('super_admin', 'admin_cabinet', 'medecin')
  );

create policy "consultations_delete_own_tenant"
  on consultations for delete
  using (
    tenant_id = get_current_tenant_id()
    and (auth.jwt() -> 'app_metadata' ->> 'role') in
        ('super_admin', 'admin_cabinet')
  );

-- ------------------------------------------------------------
-- 9. Politiques RLS — prescriptions
-- ------------------------------------------------------------
create policy "prescriptions_select_own_tenant"
  on prescriptions for select
  using (
    tenant_id = get_current_tenant_id()
  );

create policy "prescriptions_insert_own_tenant"
  on prescriptions for insert
  with check (
    tenant_id = get_current_tenant_id()
    and (auth.jwt() -> 'app_metadata' ->> 'role') in
        ('super_admin', 'admin_cabinet', 'medecin')
  );

create policy "prescriptions_update_own_tenant"
  on prescriptions for update
  using (
    tenant_id = get_current_tenant_id()
    and (auth.jwt() -> 'app_metadata' ->> 'role') in
        ('super_admin', 'admin_cabinet', 'medecin')
  );

create policy "prescriptions_delete_own_tenant"
  on prescriptions for delete
  using (
    tenant_id = get_current_tenant_id()
    and (auth.jwt() -> 'app_metadata' ->> 'role') in
        ('super_admin', 'admin_cabinet')
  );

-- ------------------------------------------------------------
-- 10. Politiques RLS — invoices
-- ------------------------------------------------------------
create policy "invoices_select_own_tenant"
  on invoices for select
  using (
    tenant_id = get_current_tenant_id()
  );

create policy "invoices_insert_own_tenant"
  on invoices for insert
  with check (
    tenant_id = get_current_tenant_id()
    and (auth.jwt() -> 'app_metadata' ->> 'role') in
        ('super_admin', 'admin_cabinet', 'secretaire', 'comptable')
  );

create policy "invoices_update_own_tenant"
  on invoices for update
  using (
    tenant_id = get_current_tenant_id()
    and (auth.jwt() -> 'app_metadata' ->> 'role') in
        ('super_admin', 'admin_cabinet', 'secretaire', 'comptable')
  );

create policy "invoices_delete_own_tenant"
  on invoices for delete
  using (
    tenant_id = get_current_tenant_id()
    and (auth.jwt() -> 'app_metadata' ->> 'role') in
        ('super_admin', 'admin_cabinet', 'comptable')
  );

-- ------------------------------------------------------------
-- 11. Politiques RLS — payments
-- ------------------------------------------------------------
create policy "payments_select_own_tenant"
  on payments for select
  using (
    tenant_id = get_current_tenant_id()
  );

create policy "payments_insert_own_tenant"
  on payments for insert
  with check (
    tenant_id = get_current_tenant_id()
  );

create policy "payments_update_own_tenant"
  on payments for update
  using (
    tenant_id = get_current_tenant_id()
    and (auth.jwt() -> 'app_metadata' ->> 'role') in
        ('super_admin', 'admin_cabinet', 'comptable')
  );

create policy "payments_delete_own_tenant"
  on payments for delete
  using (
    tenant_id = get_current_tenant_id()
    and (auth.jwt() -> 'app_metadata' ->> 'role') in
        ('super_admin', 'admin_cabinet', 'comptable')
  );

-- ------------------------------------------------------------
-- 12. Politiques RLS — subscriptions
-- ------------------------------------------------------------
create policy "subscriptions_select_own_tenant"
  on subscriptions for select
  using (
    tenant_id = get_current_tenant_id()
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );

create policy "subscriptions_update_own_tenant"
  on subscriptions for update
  using (
    tenant_id = get_current_tenant_id()
    and (auth.jwt() -> 'app_metadata' ->> 'role') in
        ('super_admin', 'admin_cabinet', 'comptable')
  );

create policy "subscriptions_insert_own_tenant"
  on subscriptions for insert
  with check (
    (auth.jwt() -> 'app_metadata' ->> 'role') in
        ('super_admin', 'admin_cabinet')
  );

-- ------------------------------------------------------------
-- 13. Politiques RLS — audit_logs
-- ------------------------------------------------------------
-- Insertion autorisée uniquement depuis les triggers (rôle
-- service_role ou propriétaire). Lecture restreinte au tenant
-- et aux rôles admin/super_admin (conformité Loi 2013-450).
-- ------------------------------------------------------------
create policy "audit_logs_select_own_tenant"
  on audit_logs for select
  using (
    tenant_id = get_current_tenant_id()
    and (auth.jwt() -> 'app_metadata' ->> 'role') in
        ('super_admin', 'admin_cabinet', 'comptable')
  );

create policy "audit_logs_insert_own_tenant"
  on audit_logs for insert
  with check (
    tenant_id = get_current_tenant_id()
    or tenant_id is null
  );

-- ------------------------------------------------------------
-- 14. Index de performance pour les filtres multi-tenant
-- ------------------------------------------------------------
create index if not exists idx_users_tenant         on users(tenant_id);
create index if not exists idx_patients_tenant      on patients(tenant_id);
create index if not exists idx_patients_code        on patients(tenant_id, code);
create index if not exists idx_appointments_tenant  on appointments(tenant_id, date);
create index if not exists idx_appointments_doctor  on appointments(doctor_id, date);
create index if not exists idx_consultations_tenant on consultations(tenant_id, date);
create index if not exists idx_prescriptions_tenant on prescriptions(tenant_id, date);
create index if not exists idx_invoices_tenant      on invoices(tenant_id, status);
create index if not exists idx_payments_tenant      on payments(tenant_id, date);
create index if not exists idx_payments_invoice     on payments(invoice_id);
create index if not exists idx_audit_logs_tenant    on audit_logs(tenant_id, created_at);

-- ------------------------------------------------------------
-- 15. updated_at auto-update sur les tables concernées
-- ------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
  tables text[] := array['tenants', 'users', 'patients', 'appointments',
                         'prescriptions', 'invoices', 'subscriptions'];
begin
  foreach t in array tables loop
    execute format(
      'drop trigger if exists trg_%s_touch on %s;
       create trigger trg_%s_touch before update on %s
       for each row execute function public.touch_updated_at();',
      t, t, t, t
    );
  end loop;
end;
$$;

-- ============================================================
-- Fin de la migration 1 — RLS actif sur les 10 tables métier.
-- ============================================================
