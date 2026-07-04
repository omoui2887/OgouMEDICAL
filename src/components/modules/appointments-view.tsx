"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday as dfIsToday,
  parseISO,
  set,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CalendarDays,
  CalendarRange,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Filter,
  Home,
  List,
  Loader2,
  MapPin,
  MessageSquare,
  Play,
  Plus,
  RefreshCw,
  Save,
  Search,
  Stethoscope,
  Video,
  X,
  XCircle,
} from "lucide-react";

import { APPOINTMENTS, DOCTORS, PATIENTS } from "@/lib/mock-data";
import {
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_TYPE_LABELS,
  formatDate,
  type Appointment,
  type AppointmentStatus,
  type AppointmentType,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { AppointmentStatusBadge, Avatar } from "@/components/medisisaas/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// ============================================================
// Constantes & helpers
// ============================================================

const SLOT_HEIGHT = 36; // px par créneau de 30 min
const DAY_START_HOUR = 8;
const DAY_END_HOUR = 18;

const TIME_SLOTS: string[] = (() => {
  const out: string[] = [];
  for (let h = DAY_START_HOUR; h < DAY_END_HOUR; h++) {
    out.push(`${String(h).padStart(2, "0")}:00`);
    out.push(`${String(h).padStart(2, "0")}:30`);
  }
  return out;
})();

const STATUS_OPTIONS: { value: AppointmentStatus | "tous"; label: string }[] = [
  { value: "tous", label: "Tous les statuts" },
  { value: "planifie", label: "Planifié" },
  { value: "confirme", label: "Confirmé" },
  { value: "en_cours", label: "En cours" },
  { value: "termine", label: "Terminé" },
  { value: "annule", label: "Annulé" },
  { value: "absent", label: "Absent" },
];

const TYPE_OPTIONS: { value: AppointmentType; label: string; icon: typeof Video }[] = [
  { value: "consultation", label: "Consultation", icon: Stethoscope },
  { value: "suivi", label: "Suivi", icon: RefreshCw },
  { value: "teleconsultation", label: "Téléconsultation", icon: Video },
  { value: "urgence", label: "Urgence", icon: AlertCircle },
  { value: "visite_domicile", label: "Visite à domicile", icon: Home },
];

function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function getAppointmentTop(time: string): number {
  const minutes = timeToMinutes(time);
  const slots = (minutes - DAY_START_HOUR * 60) / 30;
  return slots * SLOT_HEIGHT;
}

function getAppointmentHeight(duration: number): number {
  return (duration / 30) * SLOT_HEIGHT - 2;
}

function hexWithAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255).toString(16).padStart(2, "0");
  return `${hex}${a}`;
}

// ============================================================
// Sous-composants UI
// ============================================================

function KpiCard({
  title,
  value,
  icon: Icon,
  accent,
  sub,
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
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm",
            accent,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold leading-tight tracking-tight">
            {value}
          </p>
          {sub && <p className="truncate text-[11px] text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function TypeBadge({ type, size = "default" }: { type: AppointmentType; size?: "default" | "sm" }) {
  const cfg: Record<
    AppointmentType,
    { icon: typeof Video; className: string }
  > = {
    consultation: { icon: Stethoscope, className: "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-300" },
    suivi: { icon: RefreshCw, className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300" },
    teleconsultation: { icon: Video, className: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300" },
    urgence: { icon: AlertCircle, className: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300" },
    visite_domicile: { icon: Home, className: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300" },
  };
  const { icon: Icon, className } = cfg[type];
  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", className, size === "sm" && "px-1.5 py-0 text-[10px]")}>
      <Icon className={cn(size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3")} />
      {APPOINTMENT_TYPE_LABELS[type]}
    </Badge>
  );
}

// ============================================================
// Vue Semaine — Calendrier interactif avec drag & drop
// ============================================================

function AppointmentBlock({
  apt,
  onClick,
  isOverlay,
}: {
  apt: Appointment;
  onClick: () => void;
  isOverlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: apt.id });

  const colors = APPOINTMENT_STATUS_COLORS[apt.status];

  const style: React.CSSProperties = {
    backgroundColor: hexWithAlpha(colors.hex, 0.16),
    borderColor: colors.hex,
    top: getAppointmentTop(apt.time),
    height: getAppointmentHeight(apt.duration),
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    zIndex: isDragging || isOverlay ? 50 : 10,
    opacity: isDragging ? 0.5 : 1,
    boxShadow: isOverlay ? "0 8px 24px rgba(0,0,0,0.18)" : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="absolute left-1 right-1 cursor-grab touch-none overflow-hidden rounded-md border-l-4 px-2 py-1 transition-shadow active:cursor-grabbing hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] font-bold text-foreground">{apt.time}</span>
        {apt.type === "teleconsultation" ? (
          <Video className="h-3 w-3 text-orange-600" />
        ) : apt.type === "urgence" ? (
          <AlertCircle className="h-3 w-3 text-rose-600" />
        ) : null}
      </div>
      <p className="truncate text-xs font-semibold leading-tight">
        {apt.patientName}
      </p>
      {apt.duration >= 45 && (
        <p className="truncate text-[10px] leading-tight text-muted-foreground">
          {apt.doctorName.replace("Dr. ", "Dr ")}
        </p>
      )}
    </div>
  );
}

function EmptySlot({
  date,
  time,
  onClick,
}: {
  date: Date;
  time: string;
  onClick: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${format(date, "yyyy-MM-dd")}|${time}`,
  });
  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={cn(
        "border-b border-r border-border/60 transition-colors hover:bg-accent/40",
        isOver && "bg-primary/15 ring-1 ring-inset ring-primary/40",
      )}
      style={{ height: SLOT_HEIGHT }}
    />
  );
}

function WeekView({
  weekStart,
  appointments,
  onPrev,
  onNext,
  onToday,
  onSlotClick,
  onAptClick,
  onMoveApt,
}: {
  weekStart: Date;
  appointments: Appointment[];
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onSlotClick: (date: Date, time: string) => void;
  onAptClick: (apt: Appointment) => void;
  onMoveApt: (apt: Appointment, newDate: Date, newTime: string) => void;
}) {
  const days = getWeekDays(weekStart);
  const [draggedApt, setDraggedApt] = useState<Appointment | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const weekRangeLabel = `${format(days[0], "d MMM", { locale: fr })} — ${format(
    days[6],
    "d MMM yyyy",
    { locale: fr },
  )}`;

  const handleDragStart = (e: DragStartEvent) => {
    const apt = appointments.find((a) => a.id === e.active.id);
    setDraggedApt(apt ?? null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setDraggedApt(null);
    const { active, over } = e;
    if (!over) return;
    const apt = appointments.find((a) => a.id === active.id);
    if (!apt) return;
    const [dateStr, time] = String(over.id).split("|");
    if (!dateStr || !time) return;
    const newDate = parseISO(dateStr);
    if (isSameDay(parseISO(apt.date), newDate) && apt.time === time) return;
    onMoveApt(apt, newDate, time);
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {/* Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={onPrev} aria-label="Semaine précédente">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onToday}>
              Aujourd&apos;hui
            </Button>
            <Button variant="outline" size="icon" onClick={onNext} aria-label="Semaine suivante">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <p className="ml-2 text-sm font-semibold capitalize">{weekRangeLabel}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Glissez-déposez les RDV pour les replanifier · Cliquez un créneau vide pour créer
          </p>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setDraggedApt(null)}
        >
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <div className="min-w-[860px]">
              {/* En-tête des jours */}
              <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b bg-muted/30">
                <div className="border-r" />
                {days.map((day) => {
                  const isCurrent = dfIsToday(day);
                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "px-2 py-2 text-center border-r last:border-r-0",
                        isCurrent && "bg-primary/10",
                      )}
                    >
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {format(day, "EEE", { locale: fr })}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-sm font-bold",
                          isCurrent
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground",
                        )}
                      >
                        {format(day, "d", { locale: fr })}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Grille horaire */}
              <div className="max-h-[600px] overflow-y-auto">
                <div className="grid grid-cols-[56px_repeat(7,1fr)]">
                  {/* Colonne des heures */}
                  <div className="border-r bg-muted/20">
                    {TIME_SLOTS.map((slot) => (
                      <div
                        key={slot}
                        className="flex items-start justify-end pr-2 pt-0.5 text-right"
                        style={{ height: SLOT_HEIGHT }}
                      >
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {slot}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Colonnes des jours */}
                  {days.map((day) => {
                    const dayApts = appointments.filter((a) =>
                      isSameDay(parseISO(a.date), day),
                    );
                    return (
                      <div
                        key={day.toISOString()}
                        className="relative border-r last:border-r-0"
                      >
                        {TIME_SLOTS.map((slot) => (
                          <EmptySlot
                            key={slot}
                            date={day}
                            time={slot}
                            onClick={() => onSlotClick(day, slot)}
                          />
                        ))}
                        {dayApts.map((apt) => (
                          <AppointmentBlock
                            key={apt.id}
                            apt={apt}
                            onClick={() => onAptClick(apt)}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <DragOverlay dropAnimation={null}>
            {draggedApt ? (
              <div className="pointer-events-none">
                <AppointmentBlock apt={draggedApt} onClick={() => {}} isOverlay />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Vue Mois
// ============================================================

function MonthView({
  monthDate,
  appointments,
  onPrev,
  onNext,
  onToday,
  onDayClick,
  onAptClick,
}: {
  monthDate: Date;
  appointments: Appointment[];
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onDayClick: (date: Date) => void;
  onAptClick: (apt: Appointment) => void;
}) {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const weekdayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={onPrev} aria-label="Mois précédent">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onToday}>
              Aujourd&apos;hui
            </Button>
            <Button variant="outline" size="icon" onClick={onNext} aria-label="Mois suivant">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <p className="ml-2 text-sm font-semibold capitalize">
              {format(monthDate, "MMMM yyyy", { locale: fr })}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Cliquez une journée pour zoomer en vue semaine
          </p>
        </div>

        {/* En-têtes weekdays */}
        <div className="grid grid-cols-7 gap-1">
          {weekdayLabels.map((d) => (
            <div
              key={d}
              className="px-2 py-1 text-center text-[11px] font-semibold uppercase text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grille 6x7 */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dayApts = appointments.filter((a) =>
              isSameDay(parseISO(a.date), day),
            );
            const isCurrent = dfIsToday(day);
            const inMonth = isSameMonth(day, monthDate);
            return (
              <button
                key={day.toISOString()}
                onClick={() => onDayClick(day)}
                className={cn(
                  "flex min-h-[104px] flex-col rounded-lg border p-1.5 text-left transition-all hover:border-primary/40 hover:shadow-sm",
                  !inMonth && "opacity-40",
                  isCurrent && "border-primary/40 bg-primary/10",
                  !isCurrent && "border-border/60 bg-card",
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold",
                      isCurrent
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground",
                    )}
                  >
                    {format(day, "d", { locale: fr })}
                  </span>
                  {dayApts.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="h-4 px-1 text-[9px] font-bold"
                    >
                      {dayApts.length}
                    </Badge>
                  )}
                </div>
                <div className="mt-1 space-y-0.5 overflow-hidden">
                  {dayApts.slice(0, 3).map((apt) => {
                    const colors = APPOINTMENT_STATUS_COLORS[apt.status];
                    return (
                      <div
                        key={apt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAptClick(apt);
                        }}
                        className="flex items-center gap-1 rounded px-1 py-0.5 text-[10px] hover:bg-accent/60"
                        style={{ borderLeft: `2px solid ${colors.hex}` }}
                      >
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: colors.hex }}
                        />
                        <span className="truncate font-medium">{apt.time}</span>
                        <span className="truncate text-muted-foreground">
                          {apt.patientName.split(" ")[0]}
                        </span>
                      </div>
                    );
                  })}
                  {dayApts.length > 3 && (
                    <p className="px-1 text-[10px] font-medium text-primary">
                      +{dayApts.length - 3} autres
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Vue Liste — groupée par jour
// ============================================================

function AppointmentRow({
  apt,
  onClick,
  onConfirm,
  onCancel,
}: {
  apt: Appointment;
  onClick: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const colors = APPOINTMENT_STATUS_COLORS[apt.status];
  const date = parseISO(apt.date);
  const isPast =
    date.getTime() < Date.now() &&
    apt.status !== "termine" &&
    apt.status !== "annule" &&
    apt.status !== "absent";

  return (
    <div className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-3 transition-all hover:border-primary/30 hover:shadow-md sm:flex-row sm:items-center">
      {/* Bloc heure */}
      <button
        onClick={onClick}
        className="flex shrink-0 items-center justify-center sm:w-20"
        aria-label="Ouvrir le détail"
      >
        <div
          className="flex h-14 w-full flex-col items-center justify-center rounded-lg text-white shadow-sm sm:w-16"
          style={{ backgroundColor: colors.hex }}
        >
          <span className="text-base font-bold leading-none">{apt.time}</span>
          <span className="mt-0.5 text-[10px] uppercase tracking-wide opacity-90">
            {apt.duration}min
          </span>
        </div>
      </button>

      {/* Patient */}
      <button
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
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
      </button>

      {/* Médecin */}
      <div className="flex items-center gap-2 sm:w-52 sm:shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
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
            <Button
              size="sm"
              variant="outline"
              className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
              onClick={onConfirm}
            >
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Confirmer
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              onClick={onCancel}
              aria-label="Annuler le rendez-vous"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
        {apt.status === "termine" && (
          <Button size="sm" variant="ghost" className="h-8 text-muted-foreground" onClick={onClick}>
            <ChevronRight className="h-4 w-4" /> Détails
          </Button>
        )}
        {apt.status === "annule" && (
          <span className="text-xs text-muted-foreground">—</span>
        )}
        {apt.status === "absent" && (
          <Button size="sm" variant="ghost" className="h-8 text-amber-600 hover:bg-amber-50" onClick={onClick}>
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

function ListView({
  appointments,
  onAptClick,
  onConfirm,
  onCancel,
}: {
  appointments: Appointment[];
  onAptClick: (apt: Appointment) => void;
  onConfirm: (apt: Appointment) => void;
  onCancel: (apt: Appointment) => void;
}) {
  const sorted = [...appointments].sort(
    (a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime(),
  );

  // Group by day
  const grouped: { date: Date; items: Appointment[] }[] = [];
  const map = new Map<string, Appointment[]>();
  for (const apt of sorted) {
    const key = startOfDay(parseISO(apt.date)).toISOString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(apt);
  }
  for (const [key, items] of map) {
    grouped.push({ date: new Date(key), items });
  }

  if (grouped.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CalendarDays className="h-7 w-7" />
        </div>
        <p className="mt-3 text-sm font-medium">Aucun rendez-vous</p>
        <p className="text-xs text-muted-foreground">
          Ajustez les filtres ou créez un nouveau rendez-vous.
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-[60vh] space-y-6 overflow-y-auto pr-1">
      {grouped.map((group) => {
        const isToday = dfIsToday(group.date);
        return (
          <div key={group.date.toISOString()} className="space-y-3">
            <div className="sticky top-0 z-10 -mx-1 flex items-center gap-2 rounded-md bg-background/95 px-2 py-1.5 backdrop-blur">
              <CalendarDays className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold capitalize">
                {isToday
                  ? `Aujourd'hui · ${format(group.date, "EEEE d MMMM", { locale: fr })}`
                  : format(group.date, "EEEE d MMMM yyyy", { locale: fr })}
              </h3>
              <Badge variant="secondary" className="ml-1">{group.items.length} RDV</Badge>
            </div>
            <div className="space-y-2.5">
              {group.items.map((apt) => (
                <AppointmentRow
                  key={apt.id}
                  apt={apt}
                  onClick={() => onAptClick(apt)}
                  onConfirm={() => onConfirm(apt)}
                  onCancel={() => onCancel(apt)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Modal de création de RDV
// ============================================================

interface CreatePrefill {
  date?: Date;
  time?: string;
  doctorId?: string;
}

function NewAppointmentDialog({
  open,
  onOpenChange,
  prefill,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  prefill: CreatePrefill | null;
}) {
  const [patientQuery, setPatientQuery] = useState("");
  const [patientId, setPatientId] = useState<string>("");
  const [showPatientList, setShowPatientList] = useState(false);
  const [doctorId, setDoctorId] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>("");
  const [type, setType] = useState<AppointmentType>("consultation");
  const [reason, setReason] = useState("");
  const [sms, setSms] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Créneaux : état dérivé d'une "key" (doctorId|date) — pattern React
  // recommandé pour le fetch sur changement de prop (pas de setState
  // synchrone en effect). `loadingSlots` est dérivé du décalage de clé.
  const slotsKey = doctorId && date ? `${doctorId}|${format(date, "yyyy-MM-dd")}` : null;
  const [slotsData, setSlotsData] = useState<{
    key: string;
    slots: { time: string; available: boolean }[];
  } | null>(null);
  const slots = slotsData?.key === slotsKey ? slotsData.slots : [];
  const loadingSlots = slotsKey !== null && slotsData?.key !== slotsKey;

  // Prefill quand on ouvre depuis un créneau vide — pattern d'ajustement
  // d'état au changement de prop (recommandé par React plutôt qu'un effect).
  const [prevOpen, setPrevOpen] = useState(false);
  if (open && !prevOpen) {
    setPrevOpen(true);
    if (prefill?.date) setDate(prefill.date);
    if (prefill?.time) setTime(prefill.time);
    if (prefill?.doctorId) setDoctorId(prefill.doctorId);
  }
  if (!open && prevOpen) {
    setPrevOpen(false);
  }

  // Reset complet à la fermeture
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setPatientQuery("");
        setPatientId("");
        setShowPatientList(false);
        setDoctorId("");
        setDate(new Date());
        setTime("");
        setType("consultation");
        setReason("");
        setSms(true);
        setSlotsData(null);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Récupération des créneaux (API puis fallback local).
  // Les setState se font uniquement dans les callbacks async (then/catch),
  // ce qui est autorisé par la règle set-state-in-effect.
  useEffect(() => {
    if (!slotsKey) return;
    const [docId, dateStr] = slotsKey.split("|");
    let cancelled = false;
    fetch(`/api/appointments/slots?doctorId=${docId}&date=${dateStr}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const next = data?.slots?.length
          ? data.slots
          : localSlots(docId, parseISO(dateStr));
        setSlotsData({ key: slotsKey, slots: next });
      })
      .catch(() => {
        if (cancelled) return;
        setSlotsData({
          key: slotsKey,
          slots: localSlots(docId, parseISO(dateStr)),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [slotsKey]);

  const selectedPatient = PATIENTS.find((p) => p.id === patientId);
  const selectedDoctor = DOCTORS.find((d) => d.id === doctorId);

  const filteredPatients = patientQuery
    ? PATIENTS.filter((p) => {
        const q = patientQuery.toLowerCase();
        return (
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.phone.toLowerCase().includes(q)
        );
      }).slice(0, 12)
    : PATIENTS.slice(0, 8);

  const handleSubmit = async () => {
    if (!patientId || !doctorId || !date || !time || !reason.trim()) {
      toast.error("Champs manquants", {
        description: "Patient, médecin, date, créneau et motif sont obligatoires.",
      });
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    const dateLabel = format(date, "EEE dd MMM yyyy", { locale: fr });
    toast.success("RDV créé", {
      description: sms
        ? `${selectedPatient?.firstName} ${selectedPatient?.lastName} · ${selectedDoctor?.name} · ${dateLabel} à ${time}. SMS de confirmation envoyé à ${selectedPatient?.phone}.`
        : `${selectedPatient?.firstName} ${selectedPatient?.lastName} · ${selectedDoctor?.name} · ${dateLabel} à ${time}.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" /> Nouveau rendez-vous
          </DialogTitle>
          <DialogDescription>
            Planifiez une consultation à la OgouMEDICAL (Cocody, Abidjan).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Patient avec autocomplete */}
          <div className="grid gap-1.5">
            <Label htmlFor="apt-patient-q">Patient *</Label>
            <div className="relative">
              <Input
                id="apt-patient-q"
                value={patientQuery}
                onChange={(e) => {
                  setPatientQuery(e.target.value);
                  setShowPatientList(true);
                  setPatientId("");
                }}
                onFocus={() => setShowPatientList(true)}
                onBlur={() => setTimeout(() => setShowPatientList(false), 150)}
                placeholder="Rechercher par nom, code ou téléphone…"
                autoComplete="off"
              />
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              {showPatientList && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-popover shadow-md">
                  {filteredPatients.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground">
                      Aucun patient trouvé.
                    </div>
                  ) : (
                    filteredPatients.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setPatientId(p.id);
                          setPatientQuery(`${p.firstName} ${p.lastName}`);
                          setShowPatientList(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-accent"
                      >
                        <Avatar
                          name={`${p.firstName} ${p.lastName}`}
                          color={p.avatarColor}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {p.firstName} {p.lastName}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {p.code} · {p.phone} · {p.commune}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {selectedPatient && (
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                <Check className="h-3.5 w-3.5" />
                {selectedPatient.firstName} {selectedPatient.lastName} — {selectedPatient.code} — {selectedPatient.phone}
              </div>
            )}
          </div>

          {/* Médecin */}
          <div className="grid gap-1.5">
            <Label htmlFor="apt-doctor">Médecin *</Label>
            <Select value={doctorId} onValueChange={setDoctorId}>
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

          {/* Date */}
          <div className="grid gap-1.5">
            <Label>Date du rendez-vous *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  type="button"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "EEEE d MMMM yyyy", { locale: fr }) : "Sélectionner une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  locale={fr}
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Créneaux */}
          <div className="grid gap-1.5">
            <Label>Créneau horaire *</Label>
            {!doctorId || !date ? (
              <p className="rounded-md border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                Sélectionnez d&apos;abord un médecin et une date pour voir les créneaux disponibles.
              </p>
            ) : loadingSlots ? (
              <div className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border p-4 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Chargement des créneaux…
              </div>
            ) : (
              <div className="grid max-h-44 grid-cols-4 gap-1.5 overflow-y-auto rounded-md border border-border/60 p-2 sm:grid-cols-6">
                {slots.length === 0 ? (
                  <p className="col-span-full p-3 text-center text-xs text-muted-foreground">
                    Aucun créneau disponible pour ce médecin ce jour.
                  </p>
                ) : (
                  slots.map((slot) => (
                    <Button
                      key={slot.time}
                      type="button"
                      variant={time === slot.time ? "default" : "outline"}
                      size="sm"
                      disabled={!slot.available}
                      onClick={() => setTime(slot.time)}
                      className={cn(
                        "h-8 text-xs",
                        !slot.available && "cursor-not-allowed line-through opacity-50",
                      )}
                    >
                      {slot.time}
                    </Button>
                  ))
                )}
              </div>
            )}
            {time && (
              <p className="flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                <Check className="h-3.5 w-3.5" /> Créneau sélectionné : {time}
              </p>
            )}
          </div>

          {/* Type */}
          <div className="grid gap-1.5">
            <Label>Type de consultation</Label>
            <Select value={type} onValueChange={(v) => setType(v as AppointmentType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <span className="flex items-center gap-2">
                      <t.icon className="h-3.5 w-3.5" /> {t.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Motif */}
          <div className="grid gap-1.5">
            <Label htmlFor="apt-reason">Motif de consultation *</Label>
            <Textarea
              id="apt-reason"
              placeholder="Ex. Consultation de routine, fièvre, contrôle tension…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* SMS */}
          <label
            htmlFor="apt-sms"
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-muted/30 p-3"
          >
            <Checkbox
              id="apt-sms"
              checked={sms}
              onCheckedChange={(v) => setSms(v === true)}
            />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <MessageSquare className="h-4 w-4 text-primary" />
                Envoyer une confirmation SMS au patient
              </p>
              <p className="text-[11px] text-muted-foreground">
                Via Africa&apos;s Talking — rappel 24h avant le RDV inclus.
              </p>
            </div>
          </label>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">Annuler</Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Création…
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" /> Créer le rendez-vous
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function localSlots(doctorId: string, date: Date): { time: string; available: boolean }[] {
  return TIME_SLOTS.map((t) => ({
    time: t,
    available: !APPOINTMENTS.some(
      (a) =>
        a.doctorId === doctorId &&
        isSameDay(parseISO(a.date), date) &&
        a.time === t &&
        a.status !== "annule",
    ),
  }));
}

// ============================================================
// Modal de détail / édition
// ============================================================

function AppointmentDetailDialog({
  apt,
  open,
  onOpenChange,
}: {
  apt: Appointment | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [cancelReason, setCancelReason] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: new Date(),
    time: "09:00",
    type: "consultation" as AppointmentType,
    reason: "",
    notes: "",
  });

  // Ajustement du form quand `apt` change — pattern recommandé par React
  // (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
  // au lieu d'un useEffect qui déclencherait des rendus en cascade.
  const [prevAptId, setPrevAptId] = useState<string | null>(null);
  if (apt && apt.id !== prevAptId) {
    setPrevAptId(apt.id);
    setForm({
      date: parseISO(apt.date),
      time: apt.time,
      type: apt.type,
      reason: apt.reason,
      notes: "",
    });
  }

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setEditMode(false);
        setCancelReason(null);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!apt) return null;
  const colors = APPOINTMENT_STATUS_COLORS[apt.status];

  const handleAction = (action: string) => {
    switch (action) {
      case "confirm":
        toast.success("RDV confirmé", {
          description: `${apt.patientName} · ${format(parseISO(apt.date), "EEE d MMM", { locale: fr })} à ${apt.time}`,
        });
        break;
      case "start":
        toast.success("Consultation démarrée", {
          description: `${apt.patientName} — salle affectée`,
        });
        break;
      case "finish":
        toast.success("Consultation terminée", {
          description: `${apt.patientName} · compte-rendu à rédiger`,
        });
        break;
      case "teleconsult":
        toast.info("Téléconsultation", {
          description: "Connexion à la salle Daily.co chiffrée E2E…",
        });
        break;
    }
    onOpenChange(false);
  };

  const handleCancel = () => {
    if (!cancelReason || cancelReason.trim().length < 3) {
      toast.error("Raison requise", {
        description: "Indiquez la raison de l'annulation (Loi 2013-450 — audit).",
      });
      return;
    }
    toast.error("RDV annulé", {
      description: `${apt.patientName} · raison : ${cancelReason}`,
    });
    setCancelReason(null);
    onOpenChange(false);
  };

  const handleSaveEdit = () => {
    toast.success("RDV modifié", {
      description: `${apt.patientName} · ${format(form.date, "EEE d MMM", { locale: fr })} à ${form.time}`,
    });
    setEditMode(false);
    onOpenChange(false);
  };

  const patient = PATIENTS.find((p) => p.id === apt.patientId);
  const doctor = DOCTORS.find((d) => d.id === apt.doctorId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: colors.hex }}
            />
            Rendez-vous — {apt.patientName}
          </DialogTitle>
          <DialogDescription>
            {format(parseISO(apt.date), "EEEE d MMMM yyyy", { locale: fr })} à {apt.time} ·{" "}
            {apt.duration} min · {apt.commune}
          </DialogDescription>
        </DialogHeader>

        {!editMode ? (
          <div className="space-y-4">
            {/* Résumé */}
            <div className="flex flex-wrap items-center gap-2">
              <AppointmentStatusBadge status={apt.status} />
              <TypeBadge type={apt.type} />
              <span className="text-xs text-muted-foreground">#{apt.id}</span>
            </div>

            {/* Patient + médecin */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Patient
                </p>
                <div className="flex items-center gap-3">
                  <Avatar name={apt.patientName} color={apt.patientAvatarColor} size="md" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{apt.patientName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {patient?.code} · {patient?.phone}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Médecin
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: doctor?.avatarColor?.replace("bg-", "") || "#0EA5E9" }}
                  >
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{apt.doctorName}</p>
                    <p className="truncate text-xs text-muted-foreground">{apt.specialty}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Motif */}
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Motif
              </p>
              <p className="text-sm">{apt.reason}</p>
            </div>

            {/* Téléconsultation */}
            {apt.type === "teleconsultation" && (
              <div className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-900 dark:bg-orange-950/40">
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                      Téléconsultation
                    </p>
                    <p className="text-[11px] text-orange-700 dark:text-orange-300">
                      Salle Daily.co chiffrée E2E · lien envoyé par SMS
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="bg-orange-500 text-white hover:bg-orange-600"
                  onClick={() => handleAction("teleconsult")}
                >
                  <Video className="mr-1 h-4 w-4" /> Rejoindre
                </Button>
              </div>
            )}

            {/* Annulation raison (si demandée) */}
            {cancelReason !== null && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 dark:border-rose-900 dark:bg-rose-950/40">
                <Label htmlFor="cancel-reason" className="mb-1.5 block text-xs font-semibold text-rose-700 dark:text-rose-300">
                  Raison de l&apos;annulation *
                </Label>
                <Textarea
                  id="cancel-reason"
                  rows={2}
                  placeholder="Ex. Patient indisponible, conflit d agenda…"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
                <div className="mt-2 flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setCancelReason(null)}>
                    Retour
                  </Button>
                  <Button
                    size="sm"
                    className="bg-rose-500 text-white hover:bg-rose-600"
                    onClick={handleCancel}
                  >
                    Confirmer l&apos;annulation
                  </Button>
                </div>
              </div>
            )}

            {/* Actions */}
            {cancelReason === null && (
              <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                {(apt.status === "planifie" || apt.status === "confirme") && (
                  <Button
                    size="sm"
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => handleAction("confirm")}
                  >
                    <CheckCircle2 className="mr-1 h-4 w-4" /> Confirmer
                  </Button>
                )}
                {apt.status === "confirme" && (
                  <Button
                    size="sm"
                    className="bg-amber-500 text-white hover:bg-amber-600"
                    onClick={() => handleAction("start")}
                  >
                    <Play className="mr-1 h-4 w-4" /> Démarrer
                  </Button>
                )}
                {apt.status === "en_cours" && (
                  <Button
                    size="sm"
                    className="bg-zinc-600 text-white hover:bg-zinc-700"
                    onClick={() => handleAction("finish")}
                  >
                    <CheckCircle2 className="mr-1 h-4 w-4" /> Terminer
                  </Button>
                )}
                {(apt.status === "planifie" || apt.status === "confirme" || apt.status === "en_cours") && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-rose-300 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                    onClick={() => setCancelReason("")}
                  >
                    <XCircle className="mr-1 h-4 w-4" /> Annuler le RDV
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto"
                  onClick={() => setEditMode(true)}
                >
                  <Edit3 className="mr-1 h-4 w-4" /> Modifier
                </Button>
              </div>
            )}
          </div>
        ) : (
          // MODE ÉDITION
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal" type="button">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(form.date, "EEE d MMM yyyy", { locale: fr })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.date}
                      onSelect={(d) => d && setForm({ ...form, date: d })}
                      locale={fr}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="edit-time">Heure</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as AppointmentType })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center gap-2">
                        <t.icon className="h-3.5 w-3.5" /> {t.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="edit-reason">Motif</Label>
              <Textarea
                id="edit-reason"
                rows={3}
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="edit-notes">Notes (optionnel)</Label>
              <Textarea
                id="edit-notes"
                rows={2}
                placeholder="Notes internes…"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <Button variant="outline" onClick={() => setEditMode(false)}>
                Annuler
              </Button>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleSaveEdit}
              >
                <Save className="mr-2 h-4 w-4" /> Enregistrer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Composant principal
// ============================================================

export function AppointmentsView() {
  const [view, setView] = useState<"calendrier" | "liste">("calendrier");
  const [calView, setCalView] = useState<"semaine" | "mois">("semaine");
  const [weekStart, setWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [monthDate, setMonthDate] = useState<Date>(new Date());

  const [doctorFilter, setDoctorFilter] = useState<string>("tous");
  const [statusFilter, setStatusFilter] = useState<string>("tous");
  const [search, setSearch] = useState("");

  const [appointments, setAppointments] = useState<Appointment[]>(APPOINTMENTS);

  const [createOpen, setCreateOpen] = useState(false);
  const [createPrefill, setCreatePrefill] = useState<CreatePrefill | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);

  const today = new Date();
  const todayCount = appointments.filter((a) => isSameDay(parseISO(a.date), today)).length;
  const weekStartNow = startOfWeek(today, { weekStartsOn: 1 });
  const weekEndNow = endOfWeek(today, { weekStartsOn: 1 });
  const weekCount = appointments.filter((a) => {
    const d = parseISO(a.date);
    return d >= weekStartNow && d <= weekEndNow;
  }).length;
  const confirmedCount = appointments.filter((a) => a.status === "confirme").length;
  const pendingCount = appointments.filter((a) => a.status === "planifie").length;

  const filteredApts = appointments.filter((a) => {
    if (doctorFilter !== "tous" && a.doctorId !== doctorFilter) return false;
    if (statusFilter !== "tous" && a.status !== statusFilter) return false;
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
  });

  const handleMoveApt = (apt: Appointment, newDate: Date, newTime: string) => {
    const [h, m] = newTime.split(":").map(Number);
    const newDateTime = set(newDate, { hours: h, minutes: m, seconds: 0, milliseconds: 0 });
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === apt.id
          ? { ...a, date: newDateTime.toISOString(), time: newTime }
          : a,
      ),
    );
    toast.success("RDV déplacé", {
      description: `${apt.patientName} → ${format(newDate, "EEE dd MMM", { locale: fr })} à ${newTime}`,
    });
  };

  const handleSlotClick = (date: Date, time: string) => {
    setCreatePrefill({
      date,
      time,
      doctorId: doctorFilter !== "tous" ? doctorFilter : undefined,
    });
    setCreateOpen(true);
  };

  const handleAptClick = (apt: Appointment) => {
    setSelectedApt(apt);
    setDetailOpen(true);
  };

  const handleDayClick = (day: Date) => {
    setWeekStart(startOfWeek(day, { weekStartsOn: 1 }));
    setCalView("semaine");
  };

  const handleConfirm = (apt: Appointment) => {
    toast.success("RDV confirmé", {
      description: `${apt.patientName} · ${apt.time}`,
    });
  };

  const handleCancel = (apt: Appointment) => {
    toast.error("RDV annulé", {
      description: `${apt.patientName} · ${apt.time}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Rendez-vous</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {todayCount} aujourd&apos;hui · {weekCount} cette semaine · {confirmedCount} confirmés — OgouMEDICAL, Cocody
          </p>
        </div>
        <Button
          onClick={() => {
            setCreatePrefill(null);
            setCreateOpen(true);
          }}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" /> Nouveau rendez-vous
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          title="Aujourd'hui"
          value={todayCount}
          icon={CalendarDays}
          accent="bg-primary"
          sub={`${appointments.filter((a) => isSameDay(parseISO(a.date), today) && a.status === "confirme").length} confirmés`}
        />
        <KpiCard
          title="Cette semaine"
          value={weekCount}
          icon={CalendarRange}
          accent="bg-emerald-600"
          sub="Lun → Dim"
        />
        <KpiCard
          title="Confirmés"
          value={confirmedCount}
          icon={CheckCircle2}
          accent="bg-orange-500"
          sub="Toutes dates"
        />
        <KpiCard
          title="En attente"
          value={pendingCount}
          icon={Clock}
          accent="bg-rose-500"
          sub="À confirmer"
        />
      </div>

      {/* Barre de filtres + bascule de vue */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
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
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger size="sm" className="w-[160px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bascule Calendrier | Liste */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
            <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
              <button
                onClick={() => setView("calendrier")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  view === "calendrier"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <CalendarDays className="h-3.5 w-3.5" /> Calendrier
              </button>
              <button
                onClick={() => setView("liste")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  view === "liste"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <List className="h-3.5 w-3.5" /> Liste
              </button>
            </div>

            {view === "calendrier" && (
              <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
                <button
                  onClick={() => setCalView("semaine")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    calView === "semaine"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Semaine
                </button>
                <button
                  onClick={() => setCalView("mois")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    calView === "mois"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Mois
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vue active */}
      {view === "calendrier" && calView === "semaine" && (
        <WeekView
          weekStart={weekStart}
          appointments={filteredApts}
          onPrev={() => setWeekStart(subWeeks(weekStart, 1))}
          onNext={() => setWeekStart(addWeeks(weekStart, 1))}
          onToday={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
          onSlotClick={handleSlotClick}
          onAptClick={handleAptClick}
          onMoveApt={handleMoveApt}
        />
      )}

      {view === "calendrier" && calView === "mois" && (
        <MonthView
          monthDate={monthDate}
          appointments={filteredApts}
          onPrev={() => setMonthDate(subMonths(monthDate, 1))}
          onNext={() => setMonthDate(addMonths(monthDate, 1))}
          onToday={() => setMonthDate(new Date())}
          onDayClick={handleDayClick}
          onAptClick={handleAptClick}
        />
      )}

      {view === "liste" && (
        <Card>
          <CardContent className="p-4">
            <ListView
              appointments={filteredApts}
              onAptClick={handleAptClick}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <NewAppointmentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        prefill={createPrefill}
      />
      <AppointmentDetailDialog
        apt={selectedApt}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
