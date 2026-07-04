"use client";
import { useAppStore } from "@/lib/store";
import { DashboardShell } from "@/components/medisisaas/dashboard-shell";
import { ModuleRouter } from "@/components/medisisaas/module-router";
import { LandingPage } from "@/components/medisisaas/landing-page";
import { AboutPage } from "@/components/medisisaas/about-page";
import { LegalPage } from "@/components/medisisaas/legal/legal-page";
import { StatusPage } from "@/components/medisisaas/status-page/status-page";
import { AuthRouter } from "@/components/medisisaas/auth/auth-router";

export default function Home() {
  const view = useAppStore((s) => s.view);

  if (view === "dashboard") {
    return (
      <DashboardShell>
        <ModuleRouter />
      </DashboardShell>
    );
  }

  if (view === "about") {
    return (
      <>
        <AboutPage />
        <AuthRouter />
      </>
    );
  }

  if (view === "legal") {
    return (
      <>
        <LegalPage />
        <AuthRouter />
      </>
    );
  }

  if (view === "status") {
    return (
      <>
        <StatusPage />
        <AuthRouter />
      </>
    );
  }

  return (
    <>
      <LandingPage />
      <AuthRouter />
    </>
  );
}
