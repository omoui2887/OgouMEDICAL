"use client";
import { useAppStore } from "@/lib/store";
import { DashboardView } from "@/components/modules/dashboard-view";
import { AppointmentsView } from "@/components/modules/appointments-view";
import { PatientsView } from "@/components/modules/patients-view";
import { PrescriptionsView } from "@/components/modules/prescriptions-view";
import { BillingView } from "@/components/modules/billing-view";
import { PatientPortalView } from "@/components/modules/patient-portal-view";
import { SubscriptionsView } from "@/components/modules/subscriptions-view";
import { TeleconsultationView } from "@/components/modules/teleconsultation-view";
import { AnalyticsView } from "@/components/modules/analytics-view";
import { SettingsView } from "@/components/modules/settings-view";

export function ModuleRouter() {
  const activeModule = useAppStore((s) => s.module);

  switch (activeModule) {
    case "dashboard": return <DashboardView />;
    case "appointments": return <AppointmentsView />;
    case "patients": return <PatientsView />;
    case "prescriptions": return <PrescriptionsView />;
    case "billing": return <BillingView />;
    case "patient-portal": return <PatientPortalView />;
    case "subscriptions": return <SubscriptionsView />;
    case "teleconsultation": return <TeleconsultationView />;
    case "analytics": return <AnalyticsView />;
    case "settings": return <SettingsView />;
    default: return <DashboardView />;
  }
}
