-- ============================================================
-- MediSaaS CI — Migration 3 : Séquence code patient (CI-CP-NNNN)
-- ============================================================
-- Génère automatiquement un code patient unique par tenant au
-- format : CI-{PREFIX}-{NNNN}
--   - CI        : Côte d'Ivoire (constant)
--   - PREFIX    : code court du cabinet (ex. CP = Clinique du
--                 Plateau) — stocké dans tenants.code_prefix
--   - NNNN      : compteur séquentiel par tenant (4 chiffres,
--                 complété par des zéros)
-- Exemple : CI-CP-0001, CI-CP-0002 ... CI-CP-9999
-- ============================================================
-- Approche : table de compteurs (patient_code_seq) plutôt qu'une
-- SEQUENCE PostgreSQL (les sequences ne supportent pas nativement
-- un compteur indépendant par tenant sans verrou global).
-- La fonction utilise SELECT ... FOR UPDATE pour garantir
-- l'atomicité et l'unicité même en cas d'insertions concurrentes.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Colonne `code_prefix` sur les tenants
-- ------------------------------------------------------------
alter table tenants
  add column if not exists code_prefix text;

-- ------------------------------------------------------------
-- 2. Table des compteurs par tenant
-- ------------------------------------------------------------
create table if not exists patient_code_seq (
  tenant_id  uuid primary key references tenants(id) on delete cascade,
  next_val   integer not null default 1,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. Fonction de génération du code patient
-- ------------------------------------------------------------
-- SECURITY DEFINER pour pouvoir écrire dans patient_code_seq
-- quel que soit le rôle applicatif de l'utilisateur (medecin,
-- secretaire, admin_cabinet). La politique RLS sur patients
-- reste responsable du filtrage par tenant.
-- ------------------------------------------------------------
create or replace function public.generate_patient_code(p_tenant uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefix    text;
  v_next      integer;
  v_code      text;
begin
  if p_tenant is null then
    raise exception 'Tenant requis pour générer un code patient';
  end if;

  -- Récupère le préfixe du tenant
  select code_prefix into v_prefix
  from tenants
  where id = p_tenant;

  if v_prefix is null then
    -- Préfixe par défaut : 3 premières lettres du slug en majuscules
    select upper(left(regexp_replace(slug, '[^a-zA-Z]', '', 'g'), 3))
    into v_prefix
    from tenants
    where id = p_tenant;

    if v_prefix is null or length(v_prefix) < 2 then
      v_prefix := 'GEN';
    end if;

    -- Persiste le préfixe calculé pour les futurs appels
    update tenants set code_prefix = v_prefix where id = p_tenant;
  end if;

  -- Incrémentation atomique du compteur par tenant
  insert into patient_code_seq (tenant_id, next_val)
  values (p_tenant, 2)
  on conflict (tenant_id)
  do update
    set next_val = patient_code_seq.next_val + 1,
        updated_at = now()
    returning patient_code_seq.next_val into v_next;

  -- Formatage : CI-CP-0001
  v_code := 'CI-' || v_prefix || '-' || lpad((v_next - 1)::text, 4, '0');

  return v_code;
end;
$$;

-- ------------------------------------------------------------
-- 4. Trigger BEFORE INSERT sur patients
-- ------------------------------------------------------------
-- Si le code n'est pas fourni (ou vide), il est généré
-- automatiquement à partir du tenant_id.
-- ------------------------------------------------------------
create or replace function public.set_patient_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.tenant_id is null then
    raise exception 'tenant_id requis pour créer un patient';
  end if;

  if new.code is null or new.code = '' then
    new.code := public.generate_patient_code(new.tenant_id);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_patients_set_code on patients;
create trigger trg_patients_set_code
  before insert on patients
  for each row execute function public.set_patient_code();

-- ------------------------------------------------------------
-- 5. Vérification d'unicité (en complément de la contrainte)
-- ------------------------------------------------------------
-- La contrainte UNIQUE (tenant_id, code) définie dans la
-- migration 1 garantit l'unicité au niveau base. Le trigger
-- ci-dessus garantit la génération automatique.
-- ------------------------------------------------------------
comment on function public.generate_patient_code(uuid) is
  'Génère un code patient CI-{PREFIX}-{NNNN} unique par tenant.';

-- ============================================================
-- Fin de la migration 3 — Code patient auto-généré au format
-- CI-CP-0001, CI-CP-0002, etc.
-- ============================================================
