"use client";
import {
  APPOINTMENTS, PATIENTS, INVOICES, PRESCRIPTIONS, DOCTORS,
  MONTHLY_REVENUE, PAYMENT_DISTRIBUTION, APPOINTMENTS_TREND, TENANT,
} from "@/lib/mock-data";
import { formatFCFA, formatDate, type AppointmentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AppointmentStatusBadge } from "@/components/medisisaas/shared";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CalendarCheck, Users, Wallet, FileText, TrendingUp, TrendingDown,
  ArrowUpRight, Stethoscope, Clock, Activity, type LucideIcon,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

function KpiCard({
  title, value, icon: Icon, trend, trendUp, accent, sub,
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  accent: string;
  sub?: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm", accent)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            {trendUp ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
            )}
            <span className={cn("font-medium", trendUp ? "text-emerald-600" : "text-rose-600")}>{trend}</span>
            <span className="text-muted-foreground">vs mois dernier</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "0.5rem",
  fontSize: "0.75rem",
  color: "var(--popover-foreground)",
};

export function DashboardView() {
  const today = new Date();
  const todayAppointments = APPOINTMENTS.filter((a) => new Date(a.date).toDateString() === today.toDateString());
  const activePatients = PATIENTS.filter((p) => p.status === "actif").length;
  const monthlyRevenue = MONTHLY_REVENUE[MONTHLY_REVENUE.length - 1].revenue;
  const previousMonthRevenue = MONTHLY_REVENUE[MONTHLY_REVENUE.length - 2].revenue;
  const revenueGrowth = (((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100).toFixed(1);
  const totalRevenue = INVOICES.filter((i) => i.status === "payee").reduce((s, i) => s + (i.paidAmount ?? i.total), 0);
  const pendingInvoices = INVOICES.filter((i) => i.status === "impayee");

  const recentAppointments = [...APPOINTMENTS]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  const statusCounts = APPOINTMENTS.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {} as Record<AppointmentStatus, number>);

  return (
    <div className="space-y-6">
      {/* Bandeau de bienvenue */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 p-6 text-white shadow-xl shadow-teal-600/20">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 right-24 h-32 w-32 rounded-full bg-orange-400/20" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-100">
              {today.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            <h2 className="mt-1 text-2xl font-bold">Bienvenue à {TENANT.name} 👋</h2>
            <p className="mt-1 text-sm text-teal-100">
              {todayAppointments.length} rendez-vous aujourd'hui · {todayAppointments.filter((a) => a.status === "confirme").length} confirmés
            </p>
          </div>
          <div className="flex gap-2">
            <Button className="bg-white text-teal-700 hover:bg-teal-50" size="sm">
              <CalendarCheck className="mr-2 h-4 w-4" /> Nouveau RDV
            </Button>
            <Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20" size="sm">
              <FileText className="mr-2 h-4 w-4" /> Ordonnance
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="RDV aujourd'hui"
          value={String(todayAppointments.length)}
          icon={CalendarCheck}
          trend="+12%"
          trendUp
          accent="bg-teal-600"
          sub={`${statusCounts["termine"] ?? 0} terminés`}
        />
        <KpiCard
          title="Patients actifs"
          value={new Intl.NumberFormat("fr-FR").format(activePatients)}
          icon={Users}
          trend="+5,2%"
          trendUp
          accent="bg-orange-500"
          sub={`${PATIENTS.length} au total`}
        />
        <KpiCard
          title="Revenus du mois"
          value={formatFCFA(monthlyRevenue)}
          icon={Wallet}
          trend={`+${revenueGrowth}%`}
          trendUp
          accent="bg-emerald-600"
          sub={`${formatFCFA(totalRevenue)} cumulés`}
        />
        <KpiCard
          title="Factures impayées"
          value={String(pendingInvoices.length)}
          icon={FileText}
          trend="-8%"
          trendUp
          accent="bg-rose-500"
          sub={`${formatFCFA(pendingInvoices.reduce((s, i) => s + i.total, 0))}`}
        />
      </div>

      {/* Graphiques */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenus mensuels */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Évolution des revenus</CardTitle>
              <CardDescription>12 derniers mois · en FCFA</CardDescription>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <ArrowUpRight className="h-3 w-3" /> +24,6% annuel
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={MONTHLY_REVENUE}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `${v / 1000000}M`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => [formatFCFA(v), "Revenus"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Répartition paiements */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Moyens de paiement</CardTitle>
            <CardDescription>Mobile Money domine</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={PAYMENT_DISTRIBUTION}
                  dataKey="value"
                  nameKey="name"
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={75}
                  paddingAngle={3}
                >
                  {PAYMENT_DISTRIBUTION.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, ""]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-1.5">
              {PAYMENT_DISTRIBUTION.map((p) => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                    <span className="text-muted-foreground">{p.name}</span>
                  </div>
                  <span className="font-semibold">{p.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tendance RDV + RDV récents */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4 text-teal-600" /> Rendez-vous (7j)</CardTitle>
            <CardDescription>Planifiés vs terminés</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={APPOINTMENTS_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="rdv" name="Planifiés" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="termines" name="Terminés" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* RDV récents */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Derniers rendez-vous</CardTitle>
              <CardDescription>Activité récente du cabinet</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-teal-600">Voir tout</Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentAppointments.map((apt) => {
              const doc = DOCTORS.find((d) => d.id === apt.doctorId);
              return (
                <div
                  key={apt.id}
                  className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-accent"
                >
                  <Avatar name={apt.patientName} color={apt.patientAvatarColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{apt.patientName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {apt.reason} · {apt.doctorName}
                    </p>
                  </div>
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="flex items-center gap-1 text-xs font-medium">
                      <Clock className="h-3 w-3" /> {apt.time}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{formatDate(apt.date)}</span>
                  </div>
                  <AppointmentStatusBadge status={apt.status} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Médecins + ordonnances actives */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2"><Stethoscope className="h-4 w-4 text-teal-600" /> Équipe médicale</CardTitle>
            <CardDescription>Charge des praticiens</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {DOCTORS.map((doc) => {
              const count = APPOINTMENTS.filter((a) => a.doctorId === doc.id).length;
              const max = Math.max(...DOCTORS.map((d) => APPOINTMENTS.filter((a) => a.doctorId === d.id).length));
              return (
                <div key={doc.id} className="flex items-center gap-3">
                  <Avatar name={doc.name} color={doc.avatarColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-sm font-medium">{doc.name}</p>
                      <span className="text-xs text-muted-foreground">{count} RDV</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{doc.specialty}</p>
                    <Progress value={(count / max) * 100} className="mt-1.5 h-1.5" />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4 text-orange-500" /> Ordonnances récentes</CardTitle>
            <CardDescription>{PRESCRIPTIONS.filter((p) => p.status === "active").length} actives</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 max-h-72 overflow-y-auto">
            {PRESCRIPTIONS.slice(0, 6).map((rx) => (
              <div key={rx.id} className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-accent">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{rx.patientName}</p>
                  <p className="truncate text-xs text-muted-foreground">{rx.medications.length} médicament(s) · {rx.doctorName}</p>
                </div>
                <div className="text-right">
                  <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    rx.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500")}>
                    {rx.status === "active" ? "Active" : "Expirée"}
                  </span>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{rx.number}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
