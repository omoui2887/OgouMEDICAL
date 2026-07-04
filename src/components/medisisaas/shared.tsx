"use client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type {
  AppointmentStatus, InvoiceStatus, PaymentMethod, Role,
} from "@/lib/types";
import { PAYMENT_LABELS, PAYMENT_COLORS } from "@/lib/types";

const appointmentStatusConfig: Record<AppointmentStatus, { label: string; className: string }> = {
  planifie: { label: "Planifié", className: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200 dark:border-sky-800" },
  confirme: { label: "Confirmé", className: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-800" },
  en_cours: { label: "En cours", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800 animate-pulse" },
  termine: { label: "Terminé", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" },
  annule: { label: "Annulé", className: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800" },
  absent: { label: "Absent", className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700" },
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const cfg = appointmentStatusConfig[status];
  return <Badge variant="outline" className={cn("font-medium", cfg.className)}>{cfg.label}</Badge>;
}

const invoiceStatusConfig: Record<InvoiceStatus, { label: string; className: string }> = {
  impayee: { label: "Impayée", className: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800" },
  payee: { label: "Payée", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" },
  partielle: { label: "Partielle", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800" },
  annulee: { label: "Annulée", className: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700" },
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const cfg = invoiceStatusConfig[status];
  return <Badge variant="outline" className={cn("font-medium", cfg.className)}>{cfg.label}</Badge>;
}

export function PaymentBadge({ method }: { method: PaymentMethod }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold text-white", PAYMENT_COLORS[method])}>
      {PAYMENT_LABELS[method]}
    </span>
  );
}

export function Avatar({ name, color, size = "md" }: { name: string; color: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-lg",
  };
  return (
    <div className={cn("flex items-center justify-center rounded-full font-semibold text-white shrink-0", color, sizes[size])}>
      {initials}
    </div>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  const labels: Record<Role, string> = {
    super_admin: "Super Admin",
    admin_cabinet: "Admin Cabinet",
    medecin: "Médecin",
    secretaire: "Secrétaire",
    patient: "Patient",
    comptable: "Comptable",
  };
  const colors: Record<Role, string> = {
    super_admin: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    admin_cabinet: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
    medecin: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    secretaire: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    patient: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    comptable: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold", colors[role])}>{labels[role]}</span>;
}
