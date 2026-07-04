import type { ModuleKey, Role } from "@/lib/types";
import {
  LayoutDashboard, CalendarDays, Users, FileText, Receipt,
  Video, UserRound, CreditCard, BarChart3, Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  key: ModuleKey;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const MODULES: NavItem[] = [
  { key: "dashboard", label: "Tableau de bord", icon: LayoutDashboard, description: "Vue d'ensemble & KPIs" },
  { key: "appointments", label: "Rendez-vous", icon: CalendarDays, description: "Agenda & prises de RDV" },
  { key: "patients", label: "Dossiers patients", icon: Users, description: "Dossier Patient Numérique" },
  { key: "prescriptions", label: "Ordonnances", icon: FileText, description: "Prescriptions électroniques" },
  { key: "billing", label: "Facturation", icon: Receipt, description: "Paiements Mobile Money" },
  { key: "teleconsultation", label: "Téléconsultation", icon: Video, description: "Consultation vidéo" },
  { key: "patient-portal", label: "Portail patient", icon: UserRound, description: "Espace patient" },
  { key: "subscriptions", label: "Abonnement", icon: CreditCard, description: "Plan SaaS & facturation" },
  { key: "analytics", label: "Analytique", icon: BarChart3, description: "Rapports & statistiques" },
  { key: "settings", label: "Paramètres", icon: Settings, description: "Configuration cabinet" },
];

// Rôles et leur accès aux modules
export const ROLE_MODULES: Record<Role, ModuleKey[]> = {
  super_admin: ["dashboard", "patients", "appointments", "prescriptions", "billing", "subscriptions", "analytics", "settings", "patient-portal", "teleconsultation"],
  admin_cabinet: ["dashboard", "patients", "appointments", "prescriptions", "billing", "subscriptions", "analytics", "settings", "teleconsultation"],
  medecin: ["dashboard", "patients", "appointments", "prescriptions", "teleconsultation", "analytics"],
  secretaire: ["dashboard", "appointments", "patients", "billing", "patient-portal"],
  patient: ["patient-portal", "appointments"],
  comptable: ["dashboard", "billing", "analytics", "subscriptions"],
};

export const ROLE_LIST: { value: Role; label: string; description: string }[] = [
  { value: "admin_cabinet", label: "Administrateur Cabinet", description: "Directeur / propriétaire" },
  { value: "medecin", label: "Médecin", description: "Dossiers & téléconsultation" },
  { value: "secretaire", label: "Secrétaire", description: "Agenda & facturation" },
  { value: "comptable", label: "Comptable", description: "Rapports financiers" },
  { value: "patient", label: "Patient", description: "Portail patient" },
];
