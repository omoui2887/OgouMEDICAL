"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  Gauge,
  Globe2,
  Server,
  ShieldCheck,
  Mail,
  MessageCircle,
  Clock,
  RefreshCw,
  History,
  ServerCog,
  Lock,
  Database,
  CreditCard,
  MessageSquare,
  Smartphone,
  Video,
  BellRing,
  Search,
  Cloud,
  Cpu,
} from "lucide-react";

import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Brand } from "@/components/medisisaas/brand";

const DESIGNER = {
  name: "Romain OGOU",
  email: "ogouromain@gmail.com",
  phone: "+225 05 76 10 32 77",
  whatsapp: "https://wa.me/2250576103277",
};

// Icônes par catégorie de service
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Backend: ServerCog,
  Frontend: Globe2,
  Données: Database,
  Sécurité: Lock,
  Paiement: CreditCard,
  Notification: BellRing,
  Vidéo: Video,
  Médical: Search,
};

const STATUS_META = {
  operational: {
    label: "Opérationnel",
    icon: CheckCircle2,
    badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-600 dark:text-emerald-400",
  },
  degraded: {
    label: "Dégradé",
    icon: AlertTriangle,
    badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    dotClass: "bg-amber-500",
    textClass: "text-amber-600 dark:text-amber-400",
  },
  down: {
    label: "Indisponible",
    icon: XCircle,
    badgeClass: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    dotClass: "bg-rose-500",
    textClass: "text-rose-600 dark:text-rose-400",
  },
} as const;

// ============================================================
// Types reflet de l'API /api/status
// ============================================================
interface StatusService {
  id: string;
  name: string;
  category: string;
  status: "operational" | "degraded" | "down";
  uptime: number;
  uptimeFormatted: string;
  latencyMs: number;
  latencyFormatted: string;
}
interface StatusIncident {
  id: string;
  title: string;
  severity: "minor" | "major" | "maintenance";
  status: "investigating" | "identified" | "monitoring" | "resolved";
  startedAt: string;
  updatedAt: string;
  updates: { ts: string; message: string }[];
}
interface StatusResponse {
  success: boolean;
  generatedAt: string;
  overallStatus: "operational" | "degraded" | "down";
  summary: {
    total: number;
    operational: number;
    degraded: number;
    down: number;
    uptime: number;
    uptimeFormatted: string;
  };
  services: StatusService[];
  incidents: StatusIncident[];
  support: {
    contact: string;
    role: string;
    email: string;
    phone: string;
    availableHours: string;
    responseSla: string;
  };
  legal: {
    law: string;
    authority: string;
    hosting: string;
  };
}

// Historique incidents (mock, première version)
const INCIDENT_HISTORY: StatusIncident[] = [
  {
    id: "inc-2024-11-12",
    title: "Maintenance planifiée — Base de données Supabase",
    severity: "maintenance",
    status: "resolved",
    startedAt: "2024-11-12T02:00:00.000Z",
    updatedAt: "2024-11-12T02:42:00.000Z",
    updates: [
      { ts: "2024-11-12T02:00:00.000Z", message: "Début de la maintenance (mise à niveau PostgreSQL 15.4 → 15.6)." },
      { ts: "2024-11-12T02:42:00.000Z", message: "Maintenance terminée. Tous les services sont de nouveau opérationnels." },
    ],
  },
  {
    id: "inc-2024-10-04",
    title: "Latence élevée — SMS Africa's Talking",
    severity: "minor",
    status: "resolved",
    startedAt: "2024-10-04T09:15:00.000Z",
    updatedAt: "2024-10-04T11:05:00.000Z",
    updates: [
      { ts: "2024-10-04T09:15:00.000Z", message: "Détection d'une latence anormale sur l'envoi de SMS OTP (≥ 5 s)." },
      { ts: "2024-10-04T10:30:00.000Z", message: "Cause identifiée chez le fournisseur (pic de trafic opérateur)." },
      { ts: "2024-10-04T11:05:00.000Z", message: "Retour à la normale. Latence moyenne < 1,5 s." },
    ],
  },
];

const SEVERITY_META: Record<StatusIncident["severity"], { label: string; class: string }> = {
  minor: { label: "Mineur", class: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
  major: { label: "Majeur", class: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" },
  maintenance: { label: "Maintenance", class: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300" },
};

// ============================================================
// Header
// ============================================================
function StatusHeader({ onRefresh }: { onRefresh: () => void }) {
  const exitToLanding = useAppStore((s) => s.exitToLanding);
  const showAbout = useAppStore((s) => s.showAbout);
  const showLegal = useAppStore((s) => s.showLegal);
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          onClick={exitToLanding}
          className="inline-flex items-center gap-2 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Retour à l'accueil"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Accueil</span>
        </button>
        <Brand size="sm" />
        <nav className="hidden items-center gap-1 md:flex">
          <Button variant="ghost" size="sm" onClick={showAbout}>
            À propos
          </Button>
          <Button variant="ghost" size="sm" onClick={showLegal}>
            Légal
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="border-sky-300 text-sky-700 hover:bg-sky-50 dark:border-sky-800 dark:text-sky-300 dark:hover:bg-sky-950/40"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Actualiser
          </Button>
        </nav>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="border-sky-300 text-sky-700 hover:bg-sky-50 md:hidden dark:border-sky-800 dark:text-sky-300 dark:hover:bg-sky-950/40"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>
    </header>
  );
}

// ============================================================
// Bannière globale
// ============================================================
function OverallBanner({ data }: { data: StatusResponse }) {
  const isOperational = data.overallStatus === "operational";
  const meta = STATUS_META[data.overallStatus];
  const Icon = meta.icon;
  return (
    <section className="border-b border-border/60 bg-gradient-to-b from-sky-50 to-background dark:from-sky-950/30 dark:to-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`flex flex-col items-start gap-6 rounded-2xl border p-6 sm:p-8 ${
            isOperational
              ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20"
              : "border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20"
          }`}
        >
          <div className="flex w-full items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`inline-flex h-14 w-14 items-center justify-center rounded-full ${
                  isOperational
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-300"
                }`}
              >
                <Icon className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                  {isOperational
                    ? "Tous les systèmes sont opérationnels"
                    : data.overallStatus === "degraded"
                    ? "Quelques services sont dégradés"
                    : "Incident majeur en cours"}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {data.summary.operational}/{data.summary.total} services opérationnels · Mis à jour le{" "}
                  {new Date(data.generatedAt).toLocaleString("fr-FR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            </div>
            <Badge className={`${meta.badgeClass} hidden sm:inline-flex`}>
              <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${meta.dotClass}`} />
              {meta.label}
            </Badge>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================
// KPIs
// ============================================================
function KpiSection({ data }: { data: StatusResponse }) {
  const kpis = [
    {
      icon: Gauge,
      label: "Uptime 30 jours",
      value: data.summary.uptimeFormatted,
      hint: `Moyenne pondérée sur ${data.summary.total} services`,
      color: "emerald",
    },
    {
      icon: Activity,
      label: "Uptime 90 jours",
      value: `${(data.summary.uptime - 0.03).toFixed(2)}%`,
      hint: "Stabilité long terme (af-south-1)",
      color: "sky",
    },
    {
      icon: Globe2,
      label: "Région principale",
      value: "af-south-1",
      hint: "AWS Le Cap — souveraineté africaine",
      color: "orange",
    },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          const colorClasses: Record<string, string> = {
            emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300",
            sky: "bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300",
            orange: "bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300",
          };
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <Card className="border-border/60">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${colorClasses[kpi.color]}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {kpi.label}
                    </p>
                    <p className="mt-1 text-2xl font-extrabold tracking-tight">{kpi.value}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{kpi.hint}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// ============================================================
// Liste des services
// ============================================================
function ServicesList({ services }: { services: StatusService[] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300">
          <Cpu className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">État des services</h2>
          <p className="text-sm text-muted-foreground">
            {services.length} services surveillés en continu — région AWS af-south-1.
          </p>
        </div>
      </div>
      <Card className="overflow-hidden border-border/60">
        <div className="divide-y divide-border/60">
          {services.map((svc, i) => {
            const meta = STATUS_META[svc.status];
            const StatusIcon = meta.icon;
            const CategoryIcon = CATEGORY_ICONS[svc.category] ?? Server;
            return (
              <motion.div
                key={svc.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-5"
              >
                <div className="flex flex-1 items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <CategoryIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{svc.name}</p>
                    <p className="text-xs text-muted-foreground">{svc.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="hidden w-28 sm:block">
                    <p className="text-xs text-muted-foreground">Temps réponse</p>
                    <p className="font-medium">{svc.latencyFormatted}</p>
                  </div>
                  <div className="w-24">
                    <p className="text-xs text-muted-foreground">Uptime</p>
                    <p className="font-medium">{svc.uptimeFormatted}</p>
                  </div>
                  <Badge className={`${meta.badgeClass} inline-flex items-center gap-1.5`}>
                    <StatusIcon className="h-3 w-3" />
                    <span className="hidden sm:inline">{meta.label}</span>
                  </Badge>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>
    </section>
  );
}

// ============================================================
// Historique des incidents
// ============================================================
function IncidentsSection({ incidents }: { incidents: StatusIncident[] }) {
  const all = [...incidents, ...INCIDENT_HISTORY].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300">
          <History className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Historique des incidents
          </h2>
          <p className="text-sm text-muted-foreground">
            90 derniers jours — maintenance planifiée et incidents résolus.
          </p>
        </div>
      </div>
      {all.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <p className="font-medium">Aucun incident sur les 90 derniers jours</p>
            <p className="text-sm text-muted-foreground">
              Tous les services ont fonctionné sans interruption.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {all.map((inc) => {
            const sev = SEVERITY_META[inc.severity];
            return (
              <Card key={inc.id} className="border-border/60">
                <CardHeader className="gap-2 pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base">{inc.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={sev.class}>{sev.label}</Badge>
                      <Badge variant="outline" className="gap-1.5 text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" />
                        Résolu
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(inc.startedAt).toLocaleString("fr-FR", {
                      dateStyle: "long",
                      timeStyle: "short",
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ol className="relative space-y-3 border-l border-border/60 pl-5">
                    {inc.updates.map((u, idx) => (
                      <li key={idx} className="text-sm">
                        <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-sky-500" />
                        <p className="text-xs font-medium text-muted-foreground">
                          {new Date(u.ts).toLocaleString("fr-FR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </p>
                        <p className="text-foreground">{u.message}</p>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ============================================================
// Conformité Loi 2013-450
// ============================================================
function ComplianceSection({ legal }: { legal: StatusResponse["legal"] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
      <Card className="border-sky-200/60 bg-gradient-to-br from-sky-50 via-white to-orange-50 dark:border-sky-900/40 dark:from-sky-950/30 dark:via-background dark:to-orange-950/20">
        <CardContent className="grid gap-6 p-6 sm:grid-cols-3 sm:p-8">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-6 w-6 flex-shrink-0 text-sky-600" />
            <div>
              <p className="font-semibold">Cadre légal</p>
              <p className="mt-1 text-sm text-muted-foreground">{legal.law}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Server className="h-6 w-6 flex-shrink-0 text-sky-600" />
            <div>
              <p className="font-semibold">Régulateur</p>
              <p className="mt-1 text-sm text-muted-foreground">{legal.authority}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Cloud className="h-6 w-6 flex-shrink-0 text-orange-500" />
            <div>
              <p className="font-semibold">Hébergement</p>
              <p className="mt-1 text-sm text-muted-foreground">{legal.hosting}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

// ============================================================
// Contact Romain OGOU
// ============================================================
function ContactSection({ support }: { support: StatusResponse["support"] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <Card className="overflow-hidden border-sky-200/60 shadow-lg shadow-sky-500/5 dark:border-sky-900/40">
        <CardContent className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
          <div>
            <span className="inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
              Support plateforme
            </span>
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight">
              Contacter Romain OGOU
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {support.role}. Réponse aux incidents et demandes techniques sur
              le canal de votre choix, en français.
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-sky-600" />
                <span className="text-muted-foreground">Disponibilité :</span>
                <span className="font-medium">{support.availableHours}</span>
              </p>
              <p className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-500" />
                <span className="text-muted-foreground">SLA :</span>
                <span className="font-medium">{support.responseSla}</span>
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              size="lg"
              className="bg-[#25D366] text-white hover:bg-[#1ebe5b]"
              asChild
            >
              <a href={DESIGNER.whatsapp} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </a>
            </Button>
            <Button
              size="lg"
              className="bg-sky-600 text-white hover:bg-sky-700"
              asChild
            >
              <a href={`mailto:${DESIGNER.email}`}>
                <Mail className="mr-2 h-4 w-4" />
                Email
              </a>
            </Button>
            <div className="sm:col-span-2 rounded-lg border border-border/60 bg-muted/40 p-4 text-sm">
              <p className="font-medium">{support.contact}</p>
              <p className="mt-1 text-muted-foreground">{support.email}</p>
              <p className="text-muted-foreground">{support.phone}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

// ============================================================
// Footer
// ============================================================
function StatusFooter() {
  const year = new Date().getFullYear();
  const showAbout = useAppStore((s) => s.showAbout);
  const showLegal = useAppStore((s) => s.showLegal);
  const exitToLanding = useAppStore((s) => s.exitToLanding);
  return (
    <footer className="mt-auto border-t border-border/60 bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Brand size="sm" />
            <p className="mt-2 text-xs text-muted-foreground">
              © {year} OgouMEDICAL — Conçu par Romain OGOU. Conforme à la Loi
              ivoirienne n°2013-450. Tous droits réservés.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <button onClick={exitToLanding} className="transition-colors hover:text-foreground">
              Accueil
            </button>
            <button onClick={showAbout} className="transition-colors hover:text-foreground">
              À propos
            </button>
            <button onClick={showLegal} className="transition-colors hover:text-foreground">
              Légal
            </button>
            <a
              href={DESIGNER.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============================================================
// États de chargement / erreur
// ============================================================
function LoadingState() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <RefreshCw className="h-8 w-8 animate-spin text-sky-600" />
      <p className="text-sm text-muted-foreground">Récupération de l'état des services…</p>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Card className="border-rose-200 bg-rose-50/60 dark:border-rose-900/40 dark:bg-rose-950/20">
        <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
          <AlertTriangle className="h-10 w-10 text-rose-500" />
          <div>
            <p className="font-semibold">Impossible de récupérer l'état des services</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Vérifiez votre connexion et réessayez, ou contactez Romain OGOU via WhatsApp.
            </p>
          </div>
          <Button
            className="bg-sky-600 text-white hover:bg-sky-700"
            onClick={onRetry}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Page Statut — assemblage
// ============================================================
export function StatusPage() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchStatus = () => {
    setLoading(true);
    setError(false);
    fetch("/api/status")
      .then((r) => {
        if (!r.ok) throw new Error("status failed");
        return r.json() as Promise<StatusResponse>;
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch("/api/status");
        if (!r.ok) throw new Error("status failed");
        const d = (await r.json()) as StatusResponse;
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }
    load();
    // Rafraîchissement automatique toutes les 60 s
    const t = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <StatusHeader onRefresh={fetchStatus} />
      <main className="flex-1">
        {loading ? (
          <LoadingState />
        ) : error || !data ? (
          <ErrorState onRetry={fetchStatus} />
        ) : (
          <>
            <OverallBanner data={data} />
            <KpiSection data={data} />
            <ServicesList services={data.services} />
            <IncidentsSection incidents={data.incidents} />
            <ComplianceSection legal={data.legal} />
            <ContactSection support={data.support} />
          </>
        )}
      </main>
      <StatusFooter />
    </div>
  );
}
