-- ============================================================
-- MediSaaS CI — Module Rendez-vous : schéma + RLS + triggers
-- Conformité : Loi ivoirienne n°2013-450 + ARTCI
-- ============================================================
-- Tables : appointments, doctor_availabilities, doctor_unavailabilities
-- RLS : isolation par tenant + restrictions par rôle
-- ============================================================

-- ============================================================
-- 1. TABLE APPOINTMENTS (rendez-vous)
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'consultation', 'suivi', 'teleconsultation',
    'urgence', 'visite_domicile'
  )),
  status VARCHAR(50) DEFAULT 'planifie' CHECK (status IN (
    'planifie', 'confirme', 'en_cours', 'termine',
    'annule', 'absent'
  )),
  motif TEXT,                              -- Raison de la consultation
  notes TEXT,                              -- Notes privées du médecin
  reminder_sent_24h BOOLEAN DEFAULT FALSE,
  reminder_sent_1h BOOLEAN DEFAULT FALSE,
  consultation_fee DECIMAL(10,0),          -- En FCFA
  is_paid BOOLEAN DEFAULT FALSE,
  teleconsult_room_url TEXT,               -- URL Daily.co si téléconsultation
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_tenant_id ON appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_reminders ON appointments(reminder_sent_24h, reminder_sent_1h, appointment_date);

-- ============================================================
-- 2. TABLE DOCTOR_AVAILABILITIES (disponibilités hebdomadaires)
-- ============================================================
CREATE TABLE IF NOT EXISTS doctor_availabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Dimanche, 6=Samedi
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_doctor_availabilities_doctor_id ON doctor_availabilities(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_availabilities_doctor_day ON doctor_availabilities(doctor_id, day_of_week);

-- ============================================================
-- 3. TABLE DOCTOR_UNAVAILABILITIES (congés et indisponibilités)
-- ============================================================
CREATE TABLE IF NOT EXISTS doctor_unavailabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doctor_unavailabilities_doctor_id ON doctor_unavailabilities(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_unavailabilities_dates ON doctor_unavailabilities(start_date, end_date);

-- ============================================================
-- 4. FONCTION : génère l'URL de salle téléconsultation
-- ============================================================
CREATE OR REPLACE FUNCTION generate_teleconsult_url()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Si téléconsultation et pas d'URL, on prépare le préfixe (l'URL réelle est créée par Daily.co via l'API)
  IF NEW.type = 'teleconsultation' AND NEW.teleconsult_room_url IS NULL THEN
    NEW.teleconsult_room_url := 'medisaas-' || NEW.id::TEXT;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_teleconsult_url ON appointments;
CREATE TRIGGER trigger_teleconsult_url
  BEFORE INSERT ON appointments
  FOR EACH ROW EXECUTE FUNCTION generate_teleconsult_url();

-- ============================================================
-- 5. ACTIVATION ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_unavailabilities ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. POLITIQUES RLS — APPOINTMENTS
-- ============================================================
-- SELECT : tous les rôles du cabinet voient les RDV ; patient ne voit que SES RDV
CREATE POLICY "appointments_select_own_tenant"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() = 'super_admin'
    OR (get_current_user_role() = 'patient' AND patient_id IN (
      SELECT id FROM patients WHERE id = get_current_user_id()
    ))
    OR (tenant_id = get_current_tenant_id()
        AND get_current_user_role() IN ('admin_cabinet', 'medecin', 'secretaire', 'comptable'))
  );

-- INSERT : secretaire, medecin, admin_cabinet (même tenant) ; patient peut créer ses propres RDV
CREATE POLICY "appointments_insert_staff_or_patient"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (
    get_current_user_role() = 'super_admin'
    OR (get_current_user_role() = 'patient' AND patient_id IN (
      SELECT id FROM patients WHERE id = get_current_user_id()
    ))
    OR (tenant_id = get_current_tenant_id()
        AND get_current_user_role() IN ('admin_cabinet', 'medecin', 'secretaire'))
  );

-- UPDATE : secretaire, medecin, admin_cabinet (même tenant) ; patient peut annuler SES RDV
CREATE POLICY "appointments_update_staff_or_patient"
  ON appointments FOR UPDATE
  TO authenticated
  USING (
    get_current_user_role() = 'super_admin'
    OR (get_current_user_role() = 'patient' AND patient_id IN (
      SELECT id FROM patients WHERE id = get_current_user_id()
    ))
    OR (tenant_id = get_current_tenant_id()
        AND get_current_user_role() IN ('admin_cabinet', 'medecin', 'secretaire'))
  )
  WITH CHECK (
    get_current_user_role() = 'super_admin'
    OR (tenant_id = get_current_tenant_id()
        AND get_current_user_role() IN ('admin_cabinet', 'medecin', 'secretaire'))
    OR (get_current_user_role() = 'patient' AND patient_id IN (
      SELECT id FROM patients WHERE id = get_current_user_id()
    ))
  );

-- DELETE : admin_cabinet uniquement (les RDV ne sont normalement qu'annulés, pas supprimés — Loi 2013-450)
CREATE POLICY "appointments_delete_admin"
  ON appointments FOR DELETE
  TO authenticated
  USING (
    get_current_user_role() IN ('super_admin', 'admin_cabinet')
    AND tenant_id = get_current_tenant_id()
  );

-- ============================================================
-- 7. POLITIQUES RLS — DOCTOR_AVAILABILITIES
-- ============================================================
CREATE POLICY "availabilities_select_own_tenant"
  ON doctor_availabilities FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() = 'super_admin'
    OR tenant_id = get_current_tenant_id()
  );

CREATE POLICY "availabilities_modify_admin_or_medecin"
  ON doctor_availabilities FOR ALL
  TO authenticated
  USING (
    get_current_user_role() = 'super_admin'
    OR (tenant_id = get_current_tenant_id()
        AND get_current_user_role() IN ('admin_cabinet', 'medecin'))
  )
  WITH CHECK (
    get_current_user_role() = 'super_admin'
    OR (tenant_id = get_current_tenant_id()
        AND get_current_user_role() IN ('admin_cabinet', 'medecin'))
  );

-- ============================================================
-- 8. POLITIQUES RLS — DOCTOR_UNAVAILABILITIES
-- ============================================================
CREATE POLICY "unavailabilities_select_own_tenant"
  ON doctor_unavailabilities FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() = 'super_admin'
    OR tenant_id = get_current_tenant_id()
  );

CREATE POLICY "unavailabilities_modify_admin_or_medecin"
  ON doctor_unavailabilities FOR ALL
  TO authenticated
  USING (
    get_current_user_role() = 'super_admin'
    OR (tenant_id = get_current_tenant_id()
        AND get_current_user_role() IN ('admin_cabinet', 'medecin'))
  )
  WITH CHECK (
    get_current_user_role() = 'super_admin'
    OR (tenant_id = get_current_tenant_id()
        AND get_current_user_role() IN ('admin_cabinet', 'medecin'))
  );

-- ============================================================
-- 9. TRIGGERS — updated_at + audit automatique
-- ============================================================
DROP TRIGGER IF EXISTS trigger_appointments_updated_at ON appointments;
CREATE TRIGGER trigger_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Audit : INSERT/UPDATE/DELETE sur appointments (conformité Loi 2013-450)
DROP TRIGGER IF EXISTS trigger_audit_appointments ON appointments;
CREATE TRIGGER trigger_audit_appointments
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW EXECUTE FUNCTION audit_log_change();

-- ============================================================
-- 10. FONCTION : récupère les créneaux disponibles pour un médecin un jour donné
-- ============================================================
CREATE OR REPLACE FUNCTION get_available_slots(
  p_doctor_id UUID,
  p_date DATE,
  p_duration_minutes INTEGER DEFAULT 30
)
RETURNS TABLE (
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_day_of_week INTEGER;
  v_is_unavailable BOOLEAN;
  v_tz TIMESTAMPTZ;
BEGIN
  v_day_of_week := EXTRACT(DOW FROM p_date)::INTEGER;

  -- Vérifie les congés
  SELECT EXISTS(
    SELECT 1 FROM doctor_unavailabilities
    WHERE doctor_id = p_doctor_id
      AND p_date BETWEEN start_date AND end_date
  ) INTO v_is_unavailable;

  -- Si en congé → aucun créneau
  IF v_is_unavailable THEN
    RETURN;
  END IF;

  -- Génère les créneaux à partir des disponibilités hebdomadaires
  RETURN QUERY
  WITH slots AS (
    SELECT
      da.start_time + (n || ' minutes')::INTERVAL AS slot_start,
      (da.start_time + (n || ' minutes')::INTERVAL + (p_duration_minutes || ' minutes')::INTERVAL)::TIME AS slot_end
    FROM doctor_availabilities da
    CROSS JOIN generate_series(0, 480, p_duration_minutes) AS n
    WHERE da.doctor_id = p_doctor_id
      AND da.day_of_week = v_day_of_week
      AND da.is_active = TRUE
      AND da.start_time + (n || ' minutes')::INTERVAL + (p_duration_minutes || ' minutes')::INTERVAL <= da.end_time
  )
  SELECT
    s.slot_start::TIME,
    s.slot_end,
    NOT EXISTS(
      SELECT 1 FROM appointments a
      WHERE a.doctor_id = p_doctor_id
        AND a.appointment_date = p_date
        AND a.status NOT IN ('annule', 'absent')
        AND a.start_time < s.slot_end
        AND a.end_time > s.slot_start
    ) AS is_available
  FROM slots s
  ORDER BY s.slot_start;
END;
$$;

-- ============================================================
-- FIN — Module Rendez-vous
-- ============================================================
