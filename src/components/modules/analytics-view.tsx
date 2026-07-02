"use client";
import {
  APPOINTMENTS, PATIENTS, INVOICES, PRESCRIPTIONS, DOCTORS,
  MONTHLY_REVENUE, PAYMENT_DISTRIBUTION, SPECIALTY_DISTRIBUTION, TENANT,
} from "@/lib/mock-data";
import { formatFCFA } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar } from "@/components/medisisaas/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, Download, Users, Wallet, Activity, Stethoscope,
  FileText, HeartPulse, Baby, Brain,
} from "lucide-react";
import { toast } from "sonner";

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "0.5rem",
  fontSize: "0.75rem",
  color: "var(--popover-foreground)",
};

const CONSULTATIONS_BY_AGE = [
  { range: "0-14", count: 342, pct: 22 },
  { range: "15-29", count: 286, pct: 18 },
  { range: "30-44", count: 412, pct: 26 },
  { range: "45-59", count: 318, pct: 20 },
  { range: "60+", count: 210, pct: 14 },
];

const TOP_DIAGNOSES = [
  { name: "Paludisme", count: 184, color: "var(--chart-2)" },
  { name: "Hypertension", count: 142, color: "var(--chart-1)" },
  { name: "Infections respiratoires", count: 128, color: "var(--chart-4)" },
  { name: "Gastroentérite", count: 96, color: "var(--chart-5)" },
  { name: "Diabète", count: 78, color: "var(--chart-3)" },
  { name: "Autres", count: 154, color: "var(--muted-foreground)" },
];

const RADAR_DATA = SPECIALTY_DISTRIBUTION.map((s) => ({ specialty: s.name.split(" ")[0], value: s.value }));

export function AnalyticsView() {
  const totalRevenue = MONTHLY_REVENUE.reduce((s, m) => s + m.revenue, 0);
  const totalConsultations = MONTHLY_REVENUE.reduce((s, m) => s + m.consultations, 0);
  const avgPerConsult = Math.round(totalRevenue / totalConsultations);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Analytique & Rapports</h2>
          <p className="text-sm text-muted-foreground">Indicateurs de performance · {TENANT.name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.success("Rapport PDF généré")}>
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.success("Export Excel prêt")}>
            <Download className="mr-2 h-4 w-4" /> Export Excel
          </Button>
        </div>
      </div>

      {/* KPIs synthèse */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Revenus (12 mois)</p>
              <Wallet className="h-4 w-4 text-teal-600" />
            </div>
            <p className="mt-2 text-2xl font-bold">{formatFCFA(totalRevenue)}</p>
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-600"><TrendingUp className="h-3 w-3" /> +24,6% YoY</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Consultations</p>
              <Activity className="h-4 w-4 text-orange-500" />
            </div>
            <p className="mt-2 text-2xl font-bold">{new Intl.NumberFormat("fr-FR").format(totalConsultations)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Panier moyen : {formatFCFA(avgPerConsult)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Patients uniques</p>
              <Users className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-bold">{new Intl.NumberFormat("fr-FR").format(PATIENTS.length * 32)}</p>
            <p className="mt-1 text-xs text-emerald-600 font-medium">+12% nouveaux</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Taux de recouvrement</p>
              <FileText className="h-4 w-4 text-rose-500" />
            </div>
            <p className="mt-2 text-2xl font-bold">87,3%</p>
            <p className="mt-1 text-xs text-amber-600 font-medium">+3,1 pts</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-4">
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="patients">Patients</TabsTrigger>
          <TabsTrigger value="medical">Médical</TabsTrigger>
          <TabsTrigger value="team">Équipe</TabsTrigger>
        </TabsList>

        {/* Onglet Revenus */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Évolution des revenus et consultations</CardTitle>
              <CardDescription>12 derniers mois</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={MONTHLY_REVENUE}>
                  <defs>
                    <linearGradient id="a1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="a2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000000}M`} />
                  <YAxis yAxisId="right" orientation="right" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n: string) => n === "revenue" ? [formatFCFA(v), "Revenus"] : [v, "Consultations"]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenus" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#a1)" />
                  <Area yAxisId="right" type="monotone" dataKey="consultations" name="Consultations" stroke="var(--chart-2)" strokeWidth={2.5} fill="url(#a2)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Répartition des moyens de paiement</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={PAYMENT_DISTRIBUTION} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={{ fontSize: 11 }}>
                      {PAYMENT_DISTRIBUTION.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Top diagnostics</CardTitle><CardDescription>Cas les plus fréquents</CardDescription></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={TOP_DIAGNOSES} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={11} width={110} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" name="Cas" radius={[0, 4, 4, 0]}>
                      {TOP_DIAGNOSES.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Patients */}
        <TabsContent value="patients" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Consultations par tranche d'âge</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={CONSULTATIONS_BY_AGE}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="range" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" name="Consultations" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Répartition par spécialité</CardTitle><CardDescription>Radial</CardDescription></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={RADAR_DATA}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="specialty" stroke="var(--muted-foreground)" fontSize={11} />
                    <PolarRadiusAxis stroke="var(--muted-foreground)" fontSize={10} />
                    <Radar name="Cas" dataKey="value" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.4} />
                    <Tooltip contentStyle={tooltipStyle} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Communes d'origine des patients</CardTitle><CardDescription>Abidjan</CardDescription></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={[
                  { commune: "Cocody", patients: 412 },
                  { commune: "Yopougon", patients: 318 },
                  { commune: "Plateau", patients: 287 },
                  { commune: "Marcory", patients: 224 },
                  { commune: "Abobo", patients: 198 },
                  { commune: "Treichville", patients: 176 },
                  { commune: "Adjamé", patients: 142 },
                  { commune: "Koumassi", patients: 128 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="commune" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="patients" name="Patients" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Médical */}
        <TabsContent value="medical" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card><CardContent className="flex items-center gap-3 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600"><HeartPulse className="h-5 w-5" /></div>
              <div><p className="text-2xl font-bold">142</p><p className="text-xs text-muted-foreground">Cas cardio</p></div>
            </CardContent></Card>
            <Card><CardContent className="flex items-center gap-3 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600"><Baby className="h-5 w-5" /></div>
              <div><p className="text-2xl font-bold">342</p><p className="text-xs text-muted-foreground">Pédiatrie</p></div>
            </CardContent></Card>
            <Card><CardContent className="flex items-center gap-3 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600"><Brain className="h-5 w-5" /></div>
              <div><p className="text-2xl font-bold">87</p><p className="text-xs text-muted-foreground">Neuro / migraine</p></div>
            </CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Tendances des consultations (6 mois)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={MONTHLY_REVENUE.slice(6)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="consultations" name="Consultations" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Équipe */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Performance de l'équipe médicale</CardTitle><CardDescription>Charge et satisfaction</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {DOCTORS.map((doc) => {
                const count = APPOINTMENTS.filter((a) => a.doctorId === doc.id).length;
                const max = Math.max(...DOCTORS.map((d) => APPOINTMENTS.filter((a) => a.doctorId === d.id).length));
                return (
                  <div key={doc.id} className="flex items-center gap-4 rounded-lg border p-3">
                    <Avatar name={doc.name} color={doc.avatarColor} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{doc.name}</p>
                        <Badge variant="outline" className="text-amber-600">★ {doc.rating}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{doc.specialty} · {doc.patientsCount} patients</p>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500" style={{ width: `${(count / max) * 100}%` }} />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{count}</p>
                      <p className="text-xs text-muted-foreground">RDV</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
