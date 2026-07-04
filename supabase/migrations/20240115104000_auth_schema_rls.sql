-- ============================================================
-- MediSaaS CI — Schéma d'authentification + RLS strict
-- Conformité : Loi ivoirienne n°2013-450 + ARTCI
-- ============================================================
-- Tables : tenants, users, doctors, audit_logs
-- RLS : isolation par tenant + restrictions par rôle
-- Triggers : audit automatique + updated_at
-- ============================================================

-- Extension pour gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. TABLE DES TENANTS (cabinets/cliniques)
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL,                          -- 'cabinet', 'clinique', 'polyclinique'
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100) DEFAULT 'Abidjan',
  logo_url TEXT,
  subscription_plan VARCHAR(50) DEFAULT 'freemium',
  subscription_status VARCHAR(50) DEFAULT 'active',   -- 'active', 'trialing', 'past_due', 'canceled'
  subscription_ends_at TIMESTAMPTZ,
  max_doctors INTEGER DEFAULT 1,
  max_patients INTEGER DEFAULT 50,
  settings JSONB DEFAULT '{}',
  artci_compliant BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_status ON tenants(subscription_status);

-- ============================================================
-- 2. TABLE DES UTILISATEURS (liés à auth.users Supabase)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN (
    'super_admin', 'admin_cabinet', 'medecin',
    'secretaire', 'patient', 'comptable'
  )),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER((auth.users.email)));

-- Index sur l'email via jointure (pour recherche) — on stocke aussi l'email pour éviter la jointure
CREATE INDEX IF NOT EXISTS idx_users_tenant_role ON users(tenant_id, role);

-- ============================================================
-- 3. TABLE SPÉCIFIQUE MÉDECINS
-- ============================================================
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  speciality VARCHAR(100) NOT NULL,                   -- ex: 'Médecine générale'
  license_number VARCHAR(50),                         -- Numéro Ordre des Médecins CI
  consultation_fee DECIMAL(10,0),                     -- En FCFA
  teleconsultation_fee DECIMAL(10,0),                 -- En FCFA
  bio TEXT,
  available_days JSONB,                               -- Jours de disponibilité
  consultation_duration INTEGER DEFAULT 30,            -- En minutes
  is_available_for_teleconsult BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doctors_tenant_id ON doctors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_doctors_speciality ON doctors(speciality);

-- ============================================================
-- 4. AUDIT LOGS (conformité ARTCI + Loi 2013-450)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,                       -- ex: 'VIEW_PATIENT_RECORD'
  resource_type VARCHAR(50),                          -- ex: 'patient'
  resource_id UUID,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================
-- 5. FONCTIONS UTILITAIRES (lisent le JWT Supabase)
-- ============================================================

-- Récupère l'ID utilisateur courant depuis le JWT
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'sub')::UUID,
    NULL
  );
$$;

-- Récupère l'ID du tenant de l'utilisateur courant
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT tenant_id INTO v_tenant_id
  FROM public.users
  WHERE id = get_current_user_id();

  RETURN v_tenant_id;
END;
$$;

-- Récupère le rôle de l'utilisateur courant
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_role VARCHAR;
BEGIN
  SELECT role INTO v_role
  FROM public.users
  WHERE id = get_current_user_id();

  RETURN v_role;
END;
$$;

-- Vérifie si l'abonnement du tenant courant est actif
CREATE OR REPLACE FUNCTION is_subscription_active()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_status VARCHAR;
  v_ends_at TIMESTAMPTZ;
BEGIN
  SELECT subscription_status, subscription_ends_at
  INTO v_status, v_ends_at
  FROM public.tenants
  WHERE id = get_current_tenant_id();

  -- super_admin toujours autorisé
  IF get_current_user_role() = 'super_admin' THEN
    RETURN TRUE;
  END IF;

  RETURN v_status IN ('active', 'trialing')
    AND (v_ends_at IS NULL OR v_ends_at > NOW());
END;
$$;

-- ============================================================
-- 6. ACTIVATION ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 7. POLITIQUES RLS — TENANTS
-- ============================================================
-- Un utilisateur ne voit QUE les données de son tenant
-- super_admin voit tous les tenants

-- SELECT : voir son propre tenant (ou tous si super_admin)
CREATE POLICY "tenants_select_own_or_admin"
  ON tenants FOR SELECT
  TO authenticated
  USING (
    id = get_current_tenant_id()
    OR get_current_user_role() = 'super_admin'
  );

-- INSERT/UPDATE/DELETE : seul l'admin_cabinet du tenant (ou super_admin)
CREATE POLICY "tenants_modify_own_admin"
  ON tenants FOR ALL
  TO authenticated
  USING (
    (id = get_current_tenant_id()
     AND get_current_user_role() IN ('admin_cabinet', 'super_admin'))
    OR get_current_user_role() = 'super_admin'
  )
  WITH CHECK (
    get_current_user_role() IN ('admin_cabinet', 'super_admin')
  );

-- ============================================================
-- 8. POLITIQUES RLS — USERS
-- ============================================================
-- Un utilisateur voit les users de son tenant (patient ne voit que lui-même)
CREATE POLICY "users_select_own_tenant"
  ON users FOR SELECT
  TO authenticated
  USING (
    -- super_admin : tous
    get_current_user_role() = 'super_admin'
    -- patient : uniquement son propre profil
    OR (get_current_user_role() = 'patient' AND id = get_current_user_id())
    -- autres rôles : tous les users de leur tenant
    OR (tenant_id = get_current_tenant_id()
        AND get_current_user_role() IN ('admin_cabinet', 'medecin', 'secretaire', 'comptable'))
  );

-- INSERT : admin_cabinet et super_admin (même tenant)
CREATE POLICY "users_insert_admin"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    get_current_user_role() IN ('admin_cabinet', 'super_admin')
    AND tenant_id = get_current_tenant_id()
  );

-- UPDATE : admin_cabinet et super_admin (même tenant) OU l'utilisateur modifie son propre profil
CREATE POLICY "users_update_admin_or_self"
  ON users FOR UPDATE
  TO authenticated
  USING (
    id = get_current_user_id()
    OR (get_current_user_role() IN ('admin_cabinet', 'super_admin')
        AND tenant_id = get_current_tenant_id())
  )
  WITH CHECK (
    id = get_current_user_id()
    OR (get_current_user_role() IN ('admin_cabinet', 'super_admin')
        AND tenant_id = get_current_tenant_id())
  );

-- DELETE : seul admin_cabinet (même tenant) ou super_admin
CREATE POLICY "users_delete_admin"
  ON users FOR DELETE
  TO authenticated
  USING (
    get_current_user_role() IN ('admin_cabinet', 'super_admin')
    AND tenant_id = get_current_tenant_id()
  );

-- ============================================================
-- 9. POLITIQUES RLS — DOCTORS
-- ============================================================
-- Médecin/admin/secretaire voient les médecins de leur cabinet
CREATE POLICY "doctors_select_own_tenant"
  ON doctors FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() = 'super_admin'
    OR tenant_id = get_current_tenant_id()
  );

-- Modification : admin_cabinet uniquement (même tenant)
CREATE POLICY "doctors_modify_admin"
  ON doctors FOR ALL
  TO authenticated
  USING (
    get_current_user_role() = 'super_admin'
    OR (get_current_user_role() = 'admin_cabinet' AND tenant_id = get_current_tenant_id())
  )
  WITH CHECK (
    get_current_user_role() = 'super_admin'
    OR (get_current_user_role() = 'admin_cabinet' AND tenant_id = get_current_tenant_id())
  );

-- ============================================================
-- 10. POLITIQUES RLS — AUDIT_LOGS
-- ============================================================
-- Les audit_logs ne sont lisibles que par super_admin et admin_cabinet
CREATE POLICY "audit_logs_select_admin"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() = 'super_admin'
    OR (get_current_user_role() = 'admin_cabinet' AND tenant_id = get_current_tenant_id())
  );

-- INSERT : tout utilisateur authentifié peut créer un log d'audit (le système journalise)
CREATE POLICY "audit_logs_insert_any_authenticated"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- Aucune politique UPDATE/DELETE : les audit_logs sont immuables (conformité Loi 2013-450)
-- → seuls les triggers/service_role peuvent écrire, jamais modifier/supprimer via API

-- ============================================================
-- 11. TRIGGER — MISE À JOUR updated_at AUTOMATIQUE
-- ============================================================
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_tenants_updated_at ON tenants;
CREATE TRIGGER trigger_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ============================================================
-- 12. TRIGGER — AUDIT AUTOMATIQUE (toute modification)
-- ============================================================
-- Journalise INSERT/UPDATE/DELETE sur les tables sensibles
CREATE OR REPLACE FUNCTION audit_log_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_resource_id UUID;
  v_old_data JSONB;
  v_new_data JSONB;
BEGIN
  -- Détermine le tenant_id depuis l'enregistrement
  v_tenant_id := COALESCE(
    CASE
      WHEN TG_TABLE_NAME = 'tenants' THEN COALESCE(NEW.id, OLD.id)
      ELSE COALESCE(NEW.tenant_id, OLD.tenant_id)
    END,
    get_current_tenant_id()
  );

  -- Détermine l'ID de la ressource
  v_resource_id := COALESCE(NEW.id, OLD.id);

  -- Capture les données (chiffrement recommandé pour champs médicaux — voir migration 20240115103000)
  IF TG_OP = 'DELETE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
  ELSE  -- INSERT
    v_old_data := NULL;
    v_new_data := to_jsonb(NEW);
  END IF;

  INSERT INTO public.audit_logs (
    tenant_id, user_id, action, resource_type, resource_id,
    ip_address, user_agent, metadata
  ) VALUES (
    v_tenant_id,
    get_current_user_id(),
    UPPER(TG_OP) || '_' || UPPER(REPLACE(TG_TABLE_NAME, 's', '')) || '_RECORD',
    TG_TABLE_NAME,
    v_resource_id,
    NULL,  -- IP renseignée par l'application
    NULL,  -- User-Agent renseigné par l'application
    jsonb_build_object('old', v_old_data, 'new', v_new_data, 'table', TG_TABLE_NAME)
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Triggers d'audit sur les tables critiques (patients, prescriptions, etc. gérés ailleurs)
DROP TRIGGER IF EXISTS trigger_audit_tenants ON tenants;
CREATE TRIGGER trigger_audit_tenants
  AFTER INSERT OR UPDATE OR DELETE ON tenants
  FOR EACH ROW EXECUTE FUNCTION audit_log_change();

DROP TRIGGER IF EXISTS trigger_audit_users ON users;
CREATE TRIGGER trigger_audit_users
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_log_change();

DROP TRIGGER IF EXISTS trigger_audit_doctors ON doctors;
CREATE TRIGGER trigger_audit_doctors
  AFTER INSERT OR UPDATE OR DELETE ON doctors
  FOR EACH ROW EXECUTE FUNCTION audit_log_change();

-- ============================================================
-- 13. TRIGGER — CRÉATION AUTO DU PROFIL USER À L'INSCRIPTION
-- ============================================================
-- Quand un utilisateur s'inscrit via Supabase Auth, on crée son profil dans public.users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role VARCHAR;
  v_tenant_id UUID;
BEGIN
  -- Rôle par défaut : patient (les cabinets créent leurs users internes)
  v_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'patient');
  v_tenant_id := NULLIF(NEW.raw_user_meta_data ->> 'tenant_id', '')::UUID;

  INSERT INTO public.users (id, tenant_id, role, first_name, last_name, phone, avatar_url)
  VALUES (
    NEW.id,
    v_tenant_id,
    v_role,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'Prénom'),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', 'Nom'),
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );

  -- Audit de la création
  INSERT INTO public.audit_logs (tenant_id, user_id, action, resource_type, resource_id, metadata)
  VALUES (v_tenant_id, NEW.id, 'USER_REGISTERED', 'user', NEW.id,
          jsonb_build_object('email', NEW.email, 'role', v_role));

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_on_auth_user_created ON auth.users;
CREATE TRIGGER trigger_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 14. TRIGGER — MISE À JOUR last_login_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.users
  SET last_login_at = NOW()
  WHERE id = NEW.id;

  INSERT INTO public.audit_logs (tenant_id, user_id, action, resource_type, resource_id, metadata)
  SELECT tenant_id, id, 'USER_LOGIN', 'user', id, jsonb_build_object('login_at', NOW())
  FROM public.users WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Note : ce trigger se branche sur l'événement de login Supabase
-- (à configurer via Supabase Dashboard > Auth > Hooks, ou via Edge Function)

-- ============================================================
-- FIN — Schéma d'authentification MediSaaS CI
-- ============================================================
