"use client";

import * as React from "react";
import { Check, ShieldCheck, Server, MapPin } from "lucide-react";
import { Brand } from "@/components/medisisaas/brand";

interface AuthShellProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

/**
 * Layout partagé des écrans d'authentification MediSaaS CI.
 * - Desktop : split-screen (visuel médical à gauche, carte à droite)
 * - Mobile : carte centrée uniquement, mini-logo en haut
 */
export function AuthShell({ children, title, description }: AuthShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background lg:flex-row lg:overflow-hidden">
      {/* ---------- Panneau visuel — desktop uniquement ---------- */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-sky-600 via-cyan-600 to-teal-700 p-12 text-white lg:flex lg:w-1/2">
        <div className="absolute inset-0 medical-grid opacity-30" />
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-cyan-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-20 h-[28rem] w-[28rem] rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-white/10" />

        {/* Marque */}
        <div className="relative z-10">
          <Brand size="lg" textClassName="text-white" />
        </div>

        {/* Citation / pitch */}
        <div className="relative z-10 max-w-md">
          <p className="text-sm font-medium uppercase tracking-widest text-orange-300">
            Côte d&apos;Ivoire
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight">
            La santé numérique ivoirienne,{" "}
            <span className="text-orange-300">à portée de clic.</span>
          </h2>
          <p className="mt-4 text-white/85">
            RDV, dossiers patients numériques, ordonnances électroniques,
            paiements Mobile Money et téléconsultation chiffrée — réunis dans
            une plateforme conforme à la réglementation ivoirienne.
          </p>

          <ul className="mt-6 space-y-2.5 text-sm text-white/90">
            <li className="flex items-center gap-2.5">
              <Check className="h-4 w-4 shrink-0 text-emerald-300" />
              Multi-tenant — isolation totale des données par cabinet
            </li>
            <li className="flex items-center gap-2.5">
              <Check className="h-4 w-4 shrink-0 text-emerald-300" />
              Téléconsultation chiffrée de bout en bout (Daily.co)
            </li>
            <li className="flex items-center gap-2.5">
              <Check className="h-4 w-4 shrink-0 text-emerald-300" />
              Paiements Orange Money, Wave, MTN Money via CinetPay
            </li>
            <li className="flex items-center gap-2.5">
              <Check className="h-4 w-4 shrink-0 text-emerald-300" />
              SMS &amp; WhatsApp de rappel de rendez-vous automatiques
            </li>
          </ul>
        </div>

        {/* Badges conformité */}
        <div className="relative z-10 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
            <ShieldCheck className="h-3.5 w-3.5" />
            Conforme Loi 2013-450
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
            <Server className="h-3.5 w-3.5" />
            Hébergé en Afrique (af-south-1)
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
            <MapPin className="h-3.5 w-3.5" />
            Cocody, Abidjan
          </span>
        </div>
      </aside>

      {/* ---------- Carte blanche centrée ---------- */}
      <main className="flex flex-1 items-start justify-center overflow-y-auto px-4 py-10 sm:px-6 lg:items-center lg:py-12">
        <div className="w-full max-w-md">
          {/* Mini-logo — mobile uniquement */}
          <div className="mb-8 flex justify-center lg:hidden">
            <Brand size="md" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            {description ? (
              <p className="text-sm text-muted-foreground sm:text-base">
                {description}
              </p>
            ) : null}
          </div>

          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
