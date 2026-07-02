"use client";
import { useState } from "react";
import { toast } from "sonner";
import { APPOINTMENTS, PATIENTS, DOCTORS } from "@/lib/mock-data";
import { formatDate, type Appointment, type AppointmentStatus, type AppointmentType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Avatar, AppointmentStatusBadge } from "@/components/medisisaas/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogClose,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  CalendarPlus, CalendarDays, CalendarRange, CheckCircle2, Clock,
  Video, MapPin, Search, Stethoscope, Filter, X, ChevronRight,
} from "lucide-react";

const STATUS_OPTIONS: { value: AppointmentStatus | "tous"; label: string }[] = [
  { value: "tous", label: "Tous les statuts" },
  { value: "planifie", label: "Planifié" },
  { value: "confirme", label: "Confirmé" },
  { value: "en_cours", label: "En cours" },
  { value: "termine", label: "Terminé" },
  { value: "annule", label: "Annulé" },
  { value: "absent", label: "Absent" },
];

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Lundi = 0
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function isThisWeek(date: Date): boolean {
  const start = startOfWeek(new Date());
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return date >= start && date < end;
}

function calcAge(birth: string): number {
  const b = new Date(birth);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

function KpiCard({
  title, value, icon: Icon, accent, sub,
}: {
  title: string;
  value: string | number;
  icon: typeof CalendarDays;
  accent: string;
  sub?: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-center gap-4 p-4">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm", accent)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold leading-tight tracking-tight">{value}</p>
          {sub && <p className="truncate text-[11px] text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function TypeBadge({ type }: { type: AppointmentType }) {
  if (type === "teleconsultation") {
    return (
      <Badge variant="outline" className="gap-1 border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300">
        <Video className="h-3 w-3" /> Téléconsultation
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-300">
      <MapPin className="h-3 w-3" /> Présentiel
    </Badge>
  );
}

function AppointmentCard({ apt }: { apt: Appointment }) {
  const handleConfirm = () => {
    toast.success(`RDV confirmé`, { description: `${apt.patientName} · ${apt.time}` });
  };
  const handleCancel = () => {
    toast.error(`RDV annulé`, { description: `${apt.patientName} · ${apt.time}` });
  };
  const date = new Date(apt.date);
  const isPast = date.getTime() < Date.now() && apt.status !== "termine" && apt.status !== "annule" && apt.status !== "absent";

  return (
    <div className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-teal-300 hover:shadow-md sm:flex-row sm:items-center">
      {/* Heure */}
      <div className="flex items-center gap-3 sm:w-28 sm:shrink-0">
        <div className="flex h-14 w-16 flex-col items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-emerald-600 text-white shadow-sm">
          <span className="text-base font-bold leading-none">{apt.time}</span>
          <span className="mt-0.5 text-[10px] uppercase tracking-wide text-teal-100">{apt.duration}min</span>
        </div>
      </div>

      {/* Patient */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={apt.patientName} color={apt.patientAvatarColor} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold">{apt.patientName}</p>
            {isPast && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                En retard
              </span>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">{apt.reason}</p>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {apt.commune}
            </span>
          </div>
        </div>
      </div>

      {/* Médecin */}
      <div className="flex items-center gap-2 sm:w-52 sm:shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500/10 text-teal-600">
          <Stethoscope className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium">{apt.doctorName}</p>
          <p className="truncate text-[11px] text-muted-foreground">{apt.specialty}</p>
        </div>
      </div>

      {/* Type + statut */}
      <div className="flex flex-wrap items-center gap-2 sm:w-44 sm:shrink-0 sm:justify-end">
        <TypeBadge type={apt.type} />
        <AppointmentStatusBadge status={apt.status} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 sm:w-32 sm:shrink-0 sm:justify-end">
        {(apt.status === "planifie" || apt.status === "confirme") && (
          <>
            <Button size="sm" variant="outline" className="h-8 border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800" onClick={handleConfirm}>
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Confirmer
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
        {apt.status === "termine" && (
          <Button size="sm" variant="ghost" className="h-8 text-muted-foreground">
            <ChevronRight className="h-4 w-4" /> Détails
          </Button>
        )}
        {apt.status === "annule" && (
          <span className="text-xs text-muted-foreground">—</span>
        )}
        {apt.status === "absent" && (
          <Button size="sm" variant="ghost" className="h-8 text-amber-600 hover:bg-amber-50">
            Replanifier
          </Button>
        )}
        {apt.status === "en_cours" && (
          <Badge className="bg-amber-500 text-white">Consultation…</Badge>
        )}
      </div>
    </div>
  );
}

interface NewAppointmentForm {
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  reason: string;
  type: AppointmentType;
}

function NewAppointmentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<NewAppointmentForm>({
    patientId: "",
    doctorId: "",
    date: today,
    time: "09:00",
    reason: "",
    type: "presentiel",
  });

  const reset = () => {
    setForm({ patientId: "", doctorId: "", date: today, time: "09:00", reason: "", type: "presentiel" });
  };

  const handleSubmit = () => {
    if (!form.patientId || !form.doctorId || !form.reason) {
      toast.error("Champs manquants", { description: "Patient, médecin et motif sont obligatoires." });
      return;
    }
    const patient = PATIENTS.find((p) => p.id === form.patientId);
    const doctor = DOCTORS.find((d) => d.id === form.doctorId);
    toast.success("Rendez-vous créé", {
      description: `${patient?.firstName} ${patient?.lastName} · ${doctor?.name} · ${formatDate(form.date)} à ${form.time}`,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5 text-teal-600" /> Nouveau rendez-vous
          </DialogTitle>
          <DialogDescription>
            Planifier une consultation à la Clinique du Plateau.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Patient */}
          <div className="grid gap-2">
            <Label htmlFor="apt-patient">Patient *</Label>
            <Select value={form.patientId} onValueChange={(v) => setForm({ ...form, patientId: v })}>
              <SelectTrigger id="apt-patient" className="w-full">
                <SelectValue placeholder="Sélectionner un patient" />
              </SelectTrigger>
              <SelectContent>
                <div className="max-h-60 overflow-y-auto">
                  {PATIENTS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} <span className="text-muted-foreground">· {p.code}</span>
                    </SelectItem>
                  ))}
                </div>
              </SelectContent>
            </Select>
          </div>

          {/* Médecin */}
          <div className="grid gap-2">
            <Label htmlFor="apt-doctor">Médecin *</Label>
            <Select value={form.doctorId} onValueChange={(v) => setForm({ ...form, doctorId: v })}>
              <SelectTrigger id="apt-doctor" className="w-full">
                <SelectValue placeholder="Sélectionner un médecin" />
              </SelectTrigger>
              <SelectContent>
                {DOCTORS.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name} <span className="text-muted-foreground">· {d.specialty}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date + Heure */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="apt-date">Date *</Label>
              <Input id="apt-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="apt-time">Heure *</Label>
              <Input id="apt-time" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </div>
          </div>

          {/* Motif */}
          <div className="grid gap-2">
            <Label htmlFor="apt-reason">Motif de consultation *</Label>
            <Input id="apt-reason" placeholder="Ex. Consultation de routine, fièvre…" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>

          {/* Type */}
          <div className="grid gap-2">
            <Label>Type de consultation</Label>
            <RadioGroup
              value={form.type}
              onValueChange={(v) => setForm({ ...form, type: v as AppointmentType })}
              className="grid grid-cols-2 gap-3"
            >
              <Label
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                  form.type === "presentiel" ? "border-teal-500 bg-teal-50 dark:bg-teal-950/30" : "border-border hover:bg-accent"
                )}
              >
                <RadioGroupItem value="presentiel" />
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-teal-600" />
                  <span className="text-sm font-medium">Présentiel</span>
                </div>
              </Label>
              <Label
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                  form.type === "teleconsultation" ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30" : "border-border hover:bg-accent"
                )}
              >
                <RadioGroupItem value="teleconsultation" />
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Téléconsultation</span>
                </div>
              </Label>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Annuler</Button>
          </DialogClose>
          <Button onClick={handleSubmit} className="bg-teal-600 text-white hover:bg-teal-700">
            <CalendarPlus className="mr-2 h-4 w-4" /> Créer le rendez-vous
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AppointmentsView() {
  const [tab, setTab] = useState<"aujourdhui" | "semaine" | "tous">("aujourdhui");
  const [doctorFilter, setDoctorFilter] = useState<string>("tous");
  const [statusFilter, setStatusFilter] = useState<string>("tous");
  const [search, setSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);

  const today = new Date();

  const todayCount = APPOINTMENTS.filter((a) => isSameDay(new Date(a.date), today)).length;
  const weekCount = APPOINTMENTS.filter((a) => isThisWeek(new Date(a.date))).length;
  const confirmedCount = APPOINTMENTS.filter((a) => a.status === "confirme").length;
  const pendingCount = APPOINTMENTS.filter((a) => a.status === "planifie").length;

  const filtered = APPOINTMENTS.filter((a) => {
    // Tab filter
    if (tab === "aujourdhui" && !isSameDay(new Date(a.date), today)) return false;
    if (tab === "semaine" && !isThisWeek(new Date(a.date))) return false;
    // Doctor filter
    if (doctorFilter !== "tous" && a.doctorId !== doctorFilter) return false;
    // Status filter
    if (statusFilter !== "tous" && a.status !== statusFilter) return false;
    // Search
    if (search) {
      const q = search.toLowerCase();
      if (
        !a.patientName.toLowerCase().includes(q) &&
        !a.reason.toLowerCase().includes(q) &&
        !a.doctorName.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Group by day for "semaine" and "tous"
  const grouped: { label: string; items: Appointment[] }[] = [];
  if (tab === "aujourdhui") {
    grouped.push({ label: `Aujourd'hui · ${today.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}`, items: filtered });
  } else {
    const byDay = new Map<string, Appointment[]>();
    for (const apt of filtered) {
      const key = new Date(apt.date).toDateString();
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key)!.push(apt);
    }
    for (const [key, items] of byDay) {
      const d = new Date(key);
      const isToday = isSameDay(d, today);
      grouped.push({
        label: isToday
          ? `Aujourd'hui · ${d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}`
          : d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
        items,
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Rendez-vous</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {todayCount} aujourd'hui · {weekCount} cette semaine · Clinique du Plateau, Cocody
          </p>
        </div>
        <Button onClick={() => setNewOpen(true)} className="bg-teal-600 text-white hover:bg-teal-700">
          <CalendarPlus className="mr-2 h-4 w-4" /> Nouveau rendez-vous
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Aujourd'hui" value={todayCount} icon={CalendarDays} accent="bg-teal-600" sub={`${APPOINTMENTS.filter((a) => isSameDay(new Date(a.date), today) && a.status === "confirme").length} confirmés`} />
        <KpiCard title="Cette semaine" value={weekCount} icon={CalendarRange} accent="bg-emerald-600" sub="Lun → Dim" />
        <KpiCard title="Confirmés" value={confirmedCount} icon={CheckCircle2} accent="bg-orange-500" sub="Toutes dates" />
        <KpiCard title="En attente" value={pendingCount} icon={Clock} accent="bg-rose-500" sub="À confirmer" />
      </div>

      {/* Onglets + filtres */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList>
              <TabsTrigger value="aujourdhui">Aujourd'hui</TabsTrigger>
              <TabsTrigger value="semaine">Cette semaine</TabsTrigger>
              <TabsTrigger value="tous">Tous</TabsTrigger>
            </TabsList>

            {/* Barre de filtres */}
            <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher patient, motif ou médecin…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                  <SelectTrigger size="sm" className="w-[200px]">
                    <Filter className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Médecin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Tous les médecins</SelectItem>
                    {DOCTORS.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger size="sm" className="w-[160px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Liste */}
            <TabsContent value={tab} className="mt-4">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-500/10 text-teal-600">
                    <CalendarDays className="h-7 w-7" />
                  </div>
                  <p className="mt-3 text-sm font-medium">Aucun rendez-vous</p>
                  <p className="text-xs text-muted-foreground">Ajustez les filtres ou créez un nouveau rendez-vous.</p>
                </div>
              ) : (
                <div className="max-h-[60vh] space-y-6 overflow-y-auto pr-1">
                  {grouped.map((group, gi) => (
                    <div key={gi} className="space-y-3">
                      <div className="sticky top-0 z-10 -mx-1 flex items-center gap-2 bg-background/95 px-1 py-1 backdrop-blur">
                        <CalendarDays className="h-4 w-4 text-teal-600" />
                        <h3 className="text-sm font-semibold capitalize">{group.label}</h3>
                        <Badge variant="secondary" className="ml-1">{group.items.length}</Badge>
                      </div>
                      <div className="space-y-2.5">
                        {group.items.map((apt) => (
                          <AppointmentCard key={apt.id} apt={apt} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <NewAppointmentDialog open={newOpen} onOpenChange={setNewOpen} />
    </div>
  );
}
