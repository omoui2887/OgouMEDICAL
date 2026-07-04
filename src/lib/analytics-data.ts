// ============================================================
// OgouMEDICAL — Données analytiques (vides au démarrage)
// Conçu par Romain OGOU (ogouromain@gmail.com | +225 05 76 10 32 77)
// ============================================================

// ---------- HEATMAP : Heures de pointe (vide) ----------
export const CONSULTATION_HEATMAP = {
  hours: ["08h", "09h", "10h", "11h", "12h", "13h", "14h", "15h", "16h", "17h", "18h"],
  days: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
  data: Array.from({ length: 7 }, () => Array.from({ length: 11 }, () => 0)),
};

// ---------- NOUVEAUX vs RÉCURRENTS (vide) ----------
export const PATIENTS_NEW_VS_RECURRING = MONTHLY_REVENUE_EMPTY();

// ---------- CONSULTATIONS PAR TYPE (vide) ----------
export const CONSULTATIONS_BY_TYPE = MONTHLY_REVENUE_EMPTY().map((m) => ({
  month: m.month,
  presentiel: 0,
  teleconsult: 0,
}));

// ---------- TOP DIAGNOSTICS (vide) ----------
export const TOP_DIAGNOSES: { code: string; name: string; count: number; trend: number; color: string }[] = [];

// ---------- DASHBOARD MÉDECIN (vide) ----------
export const DOCTOR_DASHBOARD = {
  todayAgenda: [],
  waitingPatients: [],
  stats: {
    consultationsToday: 0,
    consultationsMonth: 0,
    avgDurationMin: 0,
    patientsTotal: 0,
    satisfactionRate: 0,
  },
  revenue: {
    month: 0,
    consultations: 0,
    avgPerConsult: 0,
    variableBonus: 0,
  },
  alerts: [],
};

// ---------- SUPER ADMIN DASHBOARD (vide) ----------
export const SUPER_ADMIN_STATS = {
  totalTenants: 0,
  activeTenants: 0,
  newTenantsThisMonth: 0,
  churnedTenants: 0,
  churnRate: 0,
  mrr: 0,
  arr: 0,
  totalPatients: 0,
  totalConsultations: 0,
  totalDoctors: 0,
  uptime: 100,
};

export const PLAN_DISTRIBUTION: { plan: string; count: number; color: string; revenue: number }[] = [];

export const MRR_TREND = Array.from({ length: 12 }).map((_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() - (11 - i));
  return { month: d.toLocaleDateString("fr-FR", { month: "short" }), mrr: 0, tenants: 0 };
});

export const CI_CABINS: { city: string; x: number; y: number; count: number; isMain: boolean }[] = [];

export const CABINET_ALERTS: { type: string; label: string; amount?: number; priority: string }[] = [];

export const RECENT_ACTIVITIES: { id: number; time: string; action: string; detail: string; icon: string }[] = [];

// ---------- Helper ----------
function MONTHLY_REVENUE_EMPTY() {
  const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
  return months.map((month) => ({ month, nouveaux: 0, recurrents: 0 }));
}
