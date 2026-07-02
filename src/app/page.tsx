"use client";
import { useAppStore } from "@/lib/store";
import { DashboardShell } from "@/components/medisisaas/dashboard-shell";
import { ModuleRouter } from "@/components/medisisaas/module-router";
import { LandingPage } from "@/components/medisisaas/landing-page";

export default function Home() {
  const view = useAppStore((s) => s.view);

  if (view === "dashboard") {
    return (
      <DashboardShell>
        <ModuleRouter />
      </DashboardShell>
    );
  }

  return <LandingPage />;
}
