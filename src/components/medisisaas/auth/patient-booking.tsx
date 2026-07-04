"use client";

import * as React from "react";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Home,
  Loader2,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
  ShieldCheck,
  Star,
  Stethoscope,
  User,
  Video,
  Zap,
  X,
} from "lucide-react";

import { useAppStore } from "@/lib/store";
import { Brand } from "@/components/medisisaas/brand";
import { Avatar } from "@/components/medisisaas/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";

import { DOCTORS, PATIENTS, TENANT } from "@/lib/mock-data";
import {
  APPOINTMENT_TYPE_LABELS,
  formatDate,
  type AppointmentType,
  type Doctor,
} from "@/lib/types";
import { cn } from "@/lib/utils";

// ============================================================
// Types & helpers locaux
// ============================================================

type Step = 1 | 2 | 3 | 4;

interface Slot {
  time: string;
  available: boolean;
}

const STEPS: { id: Step; label: string; short: string }[] = [
  { id: 1, label: "Téléphone", short: "Tél." },
  { id: 2, label: "Vérification", short: "Code" },
  { id: 3, label: "Médecin & créneau", short: "RDV" },
  { id: 4, label: "Confirmation", short: "Fin" },
];

const APPOINTMENT_TYPES: {
  value: AppointmentType;
  icon: React.ElementType;
}[] = [
  { value: "consultation", icon: Stethoscope },
  { value: "suivi", icon: RefreshCw },
  { value: "teleconsultation", icon: Video },
  { value: "urgence", icon: Zap },
];

/** Valide un téléphone ivoirien +225 07/05/01/27 XX XX XX XX (espaces optionnels). */
function isValidIvorianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, "");
  return /^(\+225)?(07|05|01|27)\d{8}$/.test(cleaned);
}

/** Convertit une Date en `YYYY-MM-DD` (local, sans décalage UTC). */
function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Ajoute 30 min à un créneau `HH:MM` et retourne `HH:MM`. */
function computeEndTime(start: string): string {
  const [h, m] = start.split(":").map(Number);
  const total = h * 60 + m + 30;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

/** Pour la démo : matche le téléphone saisi avec un patient mock, sinon `pat_1`. */
function resolvePatientId(phone: string): string {
  const normalized = phone.replace(/\s/g, "");
  const found = PATIENTS.find((p) => p.phone.replace(/\s/g, "") === normalized);
  return found?.id ?? "pat_1";
}

function formatRating(n: number): string {
  return n.toFixed(1).replace(".", ",");
}

// ============================================================
// Composant principal
// ============================================================

export function PatientBooking() {
  const hideAuth = useAppStore((s) => s.hideAuth);

  // --- State global du wizard ---
  const [step, setStep] = React.useState<Step>(1);
  const [phone, setPhone] = React.useState("");
  const [acceptSms, setAcceptSms] = React.useState(false);
  const [demoCode, setDemoCode] = React.useState<string | null>(null);
  const [otp, setOtp] = React.useState("");
  const [cooldown, setCooldown] = React.useState(0);

  // --- Step 3 : médecin + créneau ---
  const [doctorId, setDoctorId] = React.useState<string | null>(null);
  const [date, setDate] = React.useState<Date | null>(null);
  const [slots, setSlots] = React.useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = React.useState(false);
  const [slotTime, setSlotTime] = React.useState<string | null>(null);
  const [aptType, setAptType] = React.useState<AppointmentType | null>(null);
  const [motif, setMotif] = React.useState("");

  // --- Step 4 : création + succès ---
  const [creating, setCreating] = React.useState(false);
  const [confirmedApt, setConfirmedApt] = React.useState<{
    doctorName: string;
    specialty: string;
    dateLabel: string;
    time: string;
    typeLabel: string;
    motif: string;
    smsSent: boolean;
  } | null>(null);

  // --- Cooldown 60s (renvoi OTP) ---
  const cooldownRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  function startCooldown() {
    setCooldown(60);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }
  React.useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  // --- Fetch créneaux quand médecin + date choisis ---
  React.useEffect(() => {
    if (step !== 3) return;
    if (!doctorId || !date) {
      setSlots([]);
      setSlotTime(null);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    setSlotTime(null);
    const controller = new AbortController();
    fetch(
      `/api/appointments/slots?doctorId=${encodeURIComponent(
        doctorId
      )}&date=${toDateKey(date)}`,
      { signal: controller.signal }
    )
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.slots) setSlots(data.slots as Slot[]);
        else setSlots([]);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [doctorId, date, step]);

  // ============================================================
  // Actions
  // ============================================================

  // --- Étape 1 : envoi OTP ---
  const [sendingOtp, setSendingOtp] = React.useState(false);

  async function handleSendOtp() {
    if (!isValidIvorianPhone(phone)) {
      toast.error("Numéro ivoirien invalide", {
        description: "Format attendu : +225 07/05/01/27 XX XX XX XX",
      });
      return;
    }
    if (!acceptSms) {
      toast.error("Consentement SMS requis", {
        description: "Vous devez accepter de recevoir les SMS de rappel.",
      });
      return;
    }
    setSendingOtp(true);
    setDemoCode(null);
    try {
      const res = await fetch("/api/appointments/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error ?? "Échec de l'envoi du SMS");
      }
      toast.success("Code OTP envoyé", {
        description: `Un SMS a été envoyé au ${phone}`,
      });
      if (data.demoCode) setDemoCode(data.demoCode);
      startCooldown();
      setOtp("");
      setStep(2);
    } catch (e) {
      toast.error("Envoi impossible", {
        description: e instanceof Error ? e.message : "Erreur inconnue",
      });
    } finally {
      setSendingOtp(false);
    }
  }

  // --- Étape 2 : vérification OTP ---
  const [verifying, setVerifying] = React.useState(false);

  async function handleVerifyOtp() {
    if (otp.length !== 6) {
      toast.error("Code incomplet", {
        description: "Saisissez les 6 chiffres du code reçu.",
      });
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch("/api/appointments/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otp }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success || !data?.verified) {
        throw new Error(data?.error ?? "Code incorrect");
      }
      toast.success("Téléphone vérifié", {
        description: "Choisissez votre médecin et votre créneau.",
      });
      setStep(3);
    } catch (e) {
      toast.error("Code incorrect ou expiré", {
        description: e instanceof Error ? e.message : "Erreur inconnue",
      });
    } finally {
      setVerifying(false);
    }
  }

  async function handleResendOtp() {
    if (cooldown > 0) return;
    setDemoCode(null);
    try {
      const res = await fetch("/api/appointments/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error ?? "Échec du renvoi");
      }
      toast.success("Nouveau code envoyé", {
        description: `Un nouveau SMS a été envoyé au ${phone}`,
      });
      if (data.demoCode) setDemoCode(data.demoCode);
      startCooldown();
      setOtp("");
    } catch (e) {
      toast.error("Renvoi impossible", {
        description: e instanceof Error ? e.message : "Erreur inconnue",
      });
    }
  }

  // --- Étape 3 : validation créneau ---
  const canContinueStep3 = !!doctorId && !!date && !!slotTime && !!aptType;

  function handleContinueStep3() {
    if (!canContinueStep3) return;
    setStep(4);
  }

  // --- Étape 4 : confirmation finale ---
  async function handleConfirm() {
    if (!doctorId || !date || !slotTime || !aptType) return;
    setCreating(true);
    const doctor = DOCTORS.find((d) => d.id === doctorId) as Doctor;
    const patientId = resolvePatientId(phone);
    const dateKey = toDateKey(date);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          doctorId,
          appointmentDate: dateKey,
          startTime: slotTime,
          endTime: computeEndTime(slotTime),
          type: aptType,
          motif: motif.trim() || APPOINTMENT_TYPE_LABELS[aptType],
          sendSmsConfirmation: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error ?? "Échec de la création du RDV");
      }
      setConfirmedApt({
        doctorName: doctor.name,
        specialty: doctor.specialty,
        dateLabel: formatDate(new Date(`${dateKey}T${slotTime}`).toISOString()),
        time: slotTime,
        typeLabel: APPOINTMENT_TYPE_LABELS[aptType],
        motif: motif.trim() || APPOINTMENT_TYPE_LABELS[aptType],
        smsSent: !!data.smsSent,
      });
      toast.success("Rendez-vous confirmé !", {
        description: data.smsSent
          ? `SMS de confirmation envoyé au ${phone}`
          : "RDV enregistré",
      });
    } catch (e) {
      toast.error("Confirmation impossible", {
        description: e instanceof Error ? e.message : "Erreur inconnue",
      });
    } finally {
      setCreating(false);
    }
  }

  function handleTerminer() {
    hideAuth();
    toast.success("À bientôt sur MediSaaS CI", {
      description: "Votre rendez-vous est bien enregistré.",
    });
  }

  function handleRecapSms() {
    toast.success("Récapitulatif SMS envoyé", {
      description: `Rappel envoyé au ${phone}`,
    });
  }

  // ============================================================
  // Render
  // ============================================================

  const progressValue = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-gradient-to-br from-sky-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
      {/* Décor médical */}
      <div className="pointer-events-none absolute inset-0 medical-grid opacity-30" />
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-emerald-300/20 blur-3xl" />

      {/* ---------- Header ---------- */}
      <header className="relative z-10 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Brand size="md" />
          <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
            <MapPin className="h-4 w-4 text-teal-600" />
            <span className="font-medium text-foreground">
              {TENANT.name}
            </span>
            <span>—</span>
            <span>
              {TENANT.district}, {TENANT.city}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={hideAuth}
            aria-label="Fermer la prise de rendez-vous"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* ---------- Barre de progression ---------- */}
      <div className="relative z-10 border-b border-border/40 bg-background/50">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            {STEPS.map((s, i) => {
              const isDone = step > s.id;
              const isActive = step === s.id;
              return (
                <React.Fragment key={s.id}>
                  <button
                    type="button"
                    disabled={!isDone && !isActive}
                    onClick={() => {
                      // Navigation libre uniquement vers étapes déjà validées
                      if (isDone) setStep(s.id);
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-2 py-1 text-xs font-medium transition-colors sm:text-sm",
                      isActive &&
                        "bg-primary/10 text-primary",
                      isDone &&
                        "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40",
                      !isActive &&
                        !isDone &&
                        "text-muted-foreground/60"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ring-1 transition-colors sm:h-7 sm:w-7 sm:text-xs",
                        isDone &&
                          "bg-emerald-500 text-white ring-emerald-500",
                        isActive &&
                          "bg-primary text-primary-foreground ring-primary",
                        !isActive &&
                          !isDone &&
                          "bg-background text-muted-foreground ring-border"
                      )}
                    >
                      {isDone ? <Check className="h-3.5 w-3.5" /> : s.id}
                    </span>
                    <span className="hidden sm:inline">{s.label}</span>
                    <span className="sm:hidden">{s.short}</span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className="h-px flex-1 bg-border/60" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
          <Progress
            value={progressValue}
            className="mt-3 h-1.5 bg-primary/10"
          />
        </div>
      </div>

      {/* ---------- Contenu ---------- */}
      <main className="relative z-10 flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-3xl">
          {confirmedApt ? (
            <SuccessScreen
              confirmed={confirmedApt}
              phone={phone}
              onRecapSms={handleRecapSms}
              onTerminer={handleTerminer}
            />
          ) : (
            <Card className="overflow-hidden border-border/60 shadow-xl shadow-teal-500/5">
              <CardHeader className="border-b border-border/40 bg-card/50 pb-5">
                <CardTitle className="text-xl text-foreground sm:text-2xl">
                  {step === 1 && "Prendre rendez-vous"}
                  {step === 2 && "Vérification de votre numéro"}
                  {step === 3 && "Choisissez votre créneau"}
                  {step === 4 && "Confirmation du rendez-vous"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {step === 1 &&
                    `${TENANT.name} — ${TENANT.district}, ${TENANT.city}`}
                  {step === 2 &&
                    "Saisissez le code à 6 chiffres reçu par SMS"}
                  {step === 3 &&
                    "Sélectionnez un médecin, une date et un horaire"}
                  {step === 4 &&
                    "Vérifiez les informations avant de confirmer"}
                </p>
              </CardHeader>
              <CardContent className="p-5 sm:p-6">
                {step === 1 && (
                  <Step1
                    phone={phone}
                    setPhone={setPhone}
                    acceptSms={acceptSms}
                    setAcceptSms={setAcceptSms}
                    sending={sendingOtp}
                    onSubmit={handleSendOtp}
                    onCancel={hideAuth}
                  />
                )}

                {step === 2 && (
                  <Step2
                    phone={phone}
                    otp={otp}
                    setOtp={setOtp}
                    verifying={verifying}
                    demoCode={demoCode}
                    cooldown={cooldown}
                    onVerify={handleVerifyOtp}
                    onResend={handleResendOtp}
                    onChangeNumber={() => setStep(1)}
                  />
                )}

                {step === 3 && (
                  <Step3
                    doctorId={doctorId}
                    setDoctorId={(id) => {
                      setDoctorId(id);
                      setSlotTime(null);
                    }}
                    date={date}
                    setDate={(d) => {
                      setDate(d);
                      setSlotTime(null);
                    }}
                    slots={slots}
                    loadingSlots={loadingSlots}
                    slotTime={slotTime}
                    setSlotTime={setSlotTime}
                    aptType={aptType}
                    setAptType={setAptType}
                    motif={motif}
                    setMotif={setMotif}
                    canContinue={canContinueStep3}
                    onContinue={handleContinueStep3}
                    onBack={() => setStep(2)}
                  />
                )}

                {step === 4 && (
                  <Step4
                    doctor={
                      DOCTORS.find((d) => d.id === doctorId) as Doctor
                    }
                    date={date}
                    slotTime={slotTime}
                    aptType={aptType}
                    motif={motif}
                    creating={creating}
                    onConfirm={handleConfirm}
                    onBack={() => setStep(3)}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Footer conformité */}
          {!confirmedApt && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
                Conforme Loi 2013-450
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-orange-500" />
                SMS via Africa&apos;s Talking
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-emerald-600" />
                {TENANT.phone}
              </span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ============================================================
// Étape 1 — Identification
// ============================================================

function Step1({
  phone,
  setPhone,
  acceptSms,
  setAcceptSms,
  sending,
  onSubmit,
  onCancel,
}: {
  phone: string;
  setPhone: (v: string) => void;
  acceptSms: boolean;
  setAcceptSms: (v: boolean) => void;
  sending: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const valid = isValidIvorianPhone(phone);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Encart cabinet */}
      <div className="flex items-start gap-3 rounded-lg border border-teal-200/60 bg-teal-50/60 p-4 dark:border-teal-900/40 dark:bg-teal-950/20">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white">
          <Home className="h-5 w-5" />
        </div>
        <div className="text-sm">
          <p className="font-semibold text-foreground">{TENANT.name}</p>
          <p className="text-muted-foreground">
            {TENANT.address} — {TENANT.district}, {TENANT.city}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone className="h-3.5 w-3.5" />
            {TENANT.phone}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="booking-phone" className="text-sm font-medium">
          Numéro de téléphone mobile
        </Label>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="booking-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+225 07 08 12 34 56"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={cn(
              "h-11 pl-9 text-base",
              phone && !valid && "border-rose-300 focus-visible:ring-rose-300"
            )}
            aria-invalid={!!phone && !valid}
            aria-describedby="booking-phone-help"
          />
        </div>
        <p
          id="booking-phone-help"
          className={cn(
            "text-xs",
            phone && !valid ? "text-rose-600" : "text-muted-foreground"
          )}
        >
          Format ivoirien : +225 suivi de 10 chiffres (préfixes 07, 05, 01, 27).
        </p>
      </div>

      <label
        htmlFor="booking-consent"
        className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/60 bg-background p-3 text-sm transition-colors hover:bg-accent/40"
      >
        <Checkbox
          id="booking-consent"
          checked={acceptSms}
          onCheckedChange={(v) => setAcceptSms(v === true)}
          className="mt-0.5"
        />
        <span className="text-muted-foreground">
          J&apos;accepte de recevoir des SMS de rappel de rendez-vous de la part
          de{" "}
          <span className="font-medium text-foreground">{TENANT.name}</span> (loi
          ivoirienne n°2013-450 relative à la protection des données
          personnelles).
        </span>
      </label>

      <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-between">
        <Button type="button" variant="ghost" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={sending}
          className="bg-teal-600 text-base hover:bg-teal-700 sm:min-w-64"
          size="lg"
        >
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Envoi du code…
            </>
          ) : (
            <>
              <MessageSquare className="h-4 w-4" />
              Recevoir un code par SMS
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// ============================================================
// Étape 2 — Vérification OTP
// ============================================================

function Step2({
  phone,
  otp,
  setOtp,
  verifying,
  demoCode,
  cooldown,
  onVerify,
  onResend,
  onChangeNumber,
}: {
  phone: string;
  otp: string;
  setOtp: (v: string) => void;
  verifying: boolean;
  demoCode: string | null;
  cooldown: number;
  onVerify: () => void;
  onResend: () => void;
  onChangeNumber: () => void;
}) {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onVerify();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Entrez le code à 6 chiffres envoyé au
        </p>
        <p className="mt-1 inline-flex items-center gap-1.5 text-base font-semibold text-foreground">
          <Phone className="h-4 w-4 text-teal-600" />
          {phone}
        </p>
      </div>

      {/* Démo : affichage du code */}
      {demoCode && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle className="text-xs font-semibold uppercase tracking-wide">
            Mode démonstration
          </AlertTitle>
          <AlertDescription className="text-sm">
            Votre code OTP de test est :{" "}
            <span className="font-mono text-base font-bold tracking-widest">
              {demoCode}
            </span>
            <span className="mt-0.5 block text-xs text-amber-700 dark:text-amber-300/80">
              En production, ce code serait envoyé par SMS via Africa&apos;s
              Talking et ne s&apos;afficherait pas ici.
            </span>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-center">
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={(v) => setOtp(v)}
          autoFocus
          containerClassName="justify-center"
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} className="h-12 w-12 text-lg" />
            <InputOTPSlot index={1} className="h-12 w-12 text-lg" />
            <InputOTPSlot index={2} className="h-12 w-12 text-lg" />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} className="h-12 w-12 text-lg" />
            <InputOTPSlot index={4} className="h-12 w-12 text-lg" />
            <InputOTPSlot index={5} className="h-12 w-12 text-lg" />
          </InputOTPGroup>
        </InputOTP>
      </div>

      <Button
        type="submit"
        disabled={verifying || otp.length !== 6}
        className="w-full bg-teal-600 text-base hover:bg-teal-700"
        size="lg"
      >
        {verifying ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Vérification…
          </>
        ) : (
          <>
            <Check className="h-4 w-4" />
            Vérifier
          </>
        )}
      </Button>

      <div className="flex flex-col items-center gap-2 text-sm sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={onResend}
          disabled={cooldown > 0}
          className={cn(
            "inline-flex items-center gap-1.5 font-medium transition-colors",
            cooldown > 0
              ? "cursor-not-allowed text-muted-foreground/60"
              : "text-primary hover:underline"
          )}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {cooldown > 0 ? `Renvoyer le code (${cooldown}s)` : "Renvoyer le code"}
        </button>
        <button
          type="button"
          onClick={onChangeNumber}
          className="inline-flex items-center gap-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Changer de numéro
        </button>
      </div>
    </form>
  );
}

// ============================================================
// Étape 3 — Médecin + créneau
// ============================================================

function Step3({
  doctorId,
  setDoctorId,
  date,
  setDate,
  slots,
  loadingSlots,
  slotTime,
  setSlotTime,
  aptType,
  setAptType,
  motif,
  setMotif,
  canContinue,
  onContinue,
  onBack,
}: {
  doctorId: string | null;
  setDoctorId: (id: string) => void;
  date: Date | null;
  setDate: (d: Date | null) => void;
  slots: Slot[];
  loadingSlots: boolean;
  slotTime: string | null;
  setSlotTime: (t: string | null) => void;
  aptType: AppointmentType | null;
  setAptType: (t: AppointmentType) => void;
  motif: string;
  setMotif: (m: string) => void;
  canContinue: boolean;
  onContinue: () => void;
  onBack: () => void;
}) {
  const [calOpen, setCalOpen] = React.useState(false);
  // Désactive dimanches (0) et dates passées.
  // `before: X` désactive strictement avant X → on passe minuit du jour
  // courant pour que "aujourd'hui" reste sélectionnable.
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const disabledDays = [
    { dayOfWeek: [0] as number[] },
    { before: startOfToday },
  ];

  return (
    <div className="space-y-6">
      {/* --- Médecin --- */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-teal-600" />
          <h3 className="text-sm font-semibold text-foreground">
            Choisissez un médecin
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {DOCTORS.map((doc) => {
            const selected = doctorId === doc.id;
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => setDoctorId(doc.id)}
                className={cn(
                  "group flex items-center gap-3 rounded-lg border p-3 text-left transition-all",
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border/60 bg-background hover:border-teal-300 hover:bg-accent/30"
                )}
                aria-pressed={selected}
              >
                <Avatar
                  name={doc.name}
                  color={doc.avatarColor}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {doc.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {doc.specialty}
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-amber-600">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="font-medium">
                      {formatRating(doc.rating)}
                    </span>
                    <span className="text-muted-foreground">
                      · {doc.patientsCount} patients
                    </span>
                  </p>
                </div>
                {selected && (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <Separator />

      {/* --- Date + créneaux --- */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-teal-600" />
          <h3 className="text-sm font-semibold text-foreground">
            Choisissez une date et un horaire
          </h3>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="sm:w-56">
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full justify-start text-left font-normal"
                  disabled={!doctorId}
                >
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  {date ? (
                    formatDate(date.toISOString())
                  ) : doctorId ? (
                    <span className="text-muted-foreground">
                      Sélectionner une date
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      D&apos;abord un médecin
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date ?? undefined}
                  onSelect={(d) => {
                    setDate(d ?? null);
                    setCalOpen(false);
                  }}
                  locale={fr}
                  disabled={disabledDays}
                  initialFocus
                  weekStartsOn={1}
                />
              </PopoverContent>
            </Popover>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Dimanches et dates passées non disponibles.
            </p>
          </div>

          <div className="min-w-0 flex-1">
            {!doctorId ? (
              <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 text-sm text-muted-foreground">
                Sélectionnez d&apos;abord un médecin
              </div>
            ) : !date ? (
              <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 text-sm text-muted-foreground">
                Choisissez une date pour voir les créneaux
              </div>
            ) : loadingSlots ? (
              <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 bg-muted/20 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Chargement des créneaux…
              </div>
            ) : slots.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 text-sm text-muted-foreground">
                Aucun créneau disponible ce jour
              </div>
            ) : (
              <div className="grid max-h-48 grid-cols-3 gap-2 overflow-y-auto rounded-lg border border-border/60 bg-background p-2 sm:grid-cols-4">
                {slots.map((s) => {
                  const selected = slotTime === s.time;
                  return (
                    <button
                      key={s.time}
                      type="button"
                      disabled={!s.available}
                      onClick={() => setSlotTime(s.time)}
                      className={cn(
                        "rounded-md border px-2 py-2 text-sm font-medium transition-all",
                        !s.available &&
                          "cursor-not-allowed border-border/40 bg-muted/30 text-muted-foreground/40 line-through",
                        s.available && selected &&
                          "border-primary bg-primary text-primary-foreground shadow-sm",
                        s.available &&
                          !selected &&
                          "border-border/60 bg-background hover:border-teal-300 hover:bg-accent/30"
                      )}
                      aria-pressed={selected}
                      aria-disabled={!s.available}
                    >
                      {s.time}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <Separator />

      {/* --- Type de consultation --- */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-teal-600" />
          <h3 className="text-sm font-semibold text-foreground">
            Type de consultation
          </h3>
        </div>
        <RadioGroup
          value={aptType ?? ""}
          onValueChange={(v) => setAptType(v as AppointmentType)}
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          {APPOINTMENT_TYPES.map(({ value, icon: Icon }) => {
            const selected = aptType === value;
            return (
              <label
                key={value}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-all",
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border/60 bg-background hover:border-teal-300 hover:bg-accent/30"
                )}
              >
                <RadioGroupItem
                  value={value}
                  className="sr-only"
                />
                <Icon
                  className={cn(
                    "h-5 w-5",
                    selected ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span className="text-xs font-medium text-foreground">
                  {APPOINTMENT_TYPE_LABELS[value]}
                </span>
              </label>
            );
          })}
        </RadioGroup>
      </section>

      {/* --- Motif --- */}
      <div className="space-y-2">
        <Label htmlFor="booking-motif" className="text-sm font-medium">
          Motif du rendez-vous{" "}
          <span className="text-muted-foreground">(optionnel)</span>
        </Label>
        <Input
          id="booking-motif"
          placeholder="Ex : fièvre, contrôle annuel, douleur abdominale…"
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          maxLength={120}
          className="h-10"
        />
      </div>

      <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <Button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className="bg-teal-600 text-base hover:bg-teal-700 sm:min-w-48"
          size="lg"
        >
          Continuer
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// Étape 4 — Confirmation
// ============================================================

function Step4({
  doctor,
  date,
  slotTime,
  aptType,
  motif,
  creating,
  onConfirm,
  onBack,
}: {
  doctor: Doctor;
  date: Date | null;
  slotTime: string | null;
  aptType: AppointmentType | null;
  motif: string;
  creating: boolean;
  onConfirm: () => void;
  onBack: () => void;
}) {
  if (!date || !slotTime || !aptType) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Informations incomplètes. Veuillez revenir à l&apos;étape précédente.
        </AlertDescription>
      </Alert>
    );
  }

  const dateLabel = formatDate(
    new Date(`${toDateKey(date)}T${slotTime}`).toISOString()
  );

  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: "Médecin",
      value: (
        <span className="inline-flex items-center gap-2">
          <Avatar name={doctor.name} color={doctor.avatarColor} size="sm" />
          <span>
            <span className="font-medium text-foreground">{doctor.name}</span>
            <span className="block text-xs text-muted-foreground">
              {doctor.specialty}
            </span>
          </span>
        </span>
      ),
    },
    {
      label: "Date",
      value: (
        <span className="inline-flex items-center gap-1.5 text-foreground">
          <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
          {dateLabel}
        </span>
      ),
    },
    {
      label: "Heure",
      value: (
        <span className="inline-flex items-center gap-1.5 text-foreground">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          {slotTime} (30 min)
        </span>
      ),
    },
    {
      label: "Type",
      value: (
        <Badge variant="outline" className="border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900/50 dark:bg-teal-950/30 dark:text-teal-300">
          {APPOINTMENT_TYPE_LABELS[aptType]}
        </Badge>
      ),
    },
    {
      label: "Motif",
      value: motif.trim() ? (
        <span className="text-foreground">{motif.trim()}</span>
      ) : (
        <span className="text-muted-foreground italic">Non précisé</span>
      ),
    },
    {
      label: "Cabinet",
      value: (
        <span className="text-foreground">
          {TENANT.name}
          <span className="block text-xs text-muted-foreground">
            {TENANT.address}
          </span>
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-lg border border-border/60">
        <dl className="divide-y divide-border/40">
          {rows.map((r) => (
            <div
              key={r.label}
              className="grid grid-cols-3 gap-3 px-4 py-3 text-sm sm:grid-cols-4"
            >
              <dt className="col-span-1 text-muted-foreground">{r.label}</dt>
              <dd className="col-span-2 sm:col-span-3">{r.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <Alert className="border-teal-200 bg-teal-50 text-teal-900 dark:border-teal-900/40 dark:bg-teal-950/20 dark:text-teal-200">
        <MessageSquare className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Vous recevrez un <strong>SMS de confirmation</strong> immédiat, puis
          un <strong>rappel 24 h avant</strong> le rendez-vous. Coûts SMS
          standard ivoiriens (opérateur Orange, MTN, Moov).
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-between">
        <Button type="button" variant="ghost" onClick={onBack} disabled={creating}>
          <ArrowLeft className="h-4 w-4" />
          Modifier
        </Button>
        <Button
          type="button"
          onClick={onConfirm}
          disabled={creating}
          className="bg-teal-600 text-base hover:bg-teal-700 sm:min-w-56"
          size="lg"
        >
          {creating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Confirmation…
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Confirmer le rendez-vous
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// Écran de succès
// ============================================================

function SuccessScreen({
  confirmed,
  phone,
  onRecapSms,
  onTerminer,
}: {
  confirmed: {
    doctorName: string;
    specialty: string;
    dateLabel: string;
    time: string;
    typeLabel: string;
    motif: string;
    smsSent: boolean;
  };
  phone: string;
  onRecapSms: () => void;
  onTerminer: () => void;
}) {
  return (
    <Card className="overflow-hidden border-emerald-200 shadow-xl shadow-emerald-500/10">
      <CardContent className="p-0">
        {/* Bandeau succès */}
        <div className="relative flex flex-col items-center gap-3 bg-gradient-to-br from-emerald-500 to-teal-600 px-6 py-10 text-center text-white">
          <div className="pointer-events-none absolute inset-0 medical-grid opacity-20" />
          <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/30">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h2 className="relative z-10 text-2xl font-bold">
            Rendez-vous confirmé !
          </h2>
          <p className="relative z-10 max-w-md text-sm text-white/90">
            {confirmed.smsSent
              ? `Un SMS de confirmation vient d'être envoyé au ${phone}.`
              : "Votre rendez-vous a bien été enregistré."}
          </p>
        </div>

        {/* Récap */}
        <div className="space-y-4 p-6">
          <div className="overflow-hidden rounded-lg border border-border/60">
            <dl className="divide-y divide-border/40">
              <SuccessRow
                label="Médecin"
                value={`${confirmed.doctorName} — ${confirmed.specialty}`}
              />
              <SuccessRow
                label="Date"
                value={confirmed.dateLabel}
              />
              <SuccessRow
                label="Heure"
                value={`${confirmed.time} (30 min)`}
              />
              <SuccessRow label="Type" value={confirmed.typeLabel} />
              <SuccessRow
                label="Motif"
                value={confirmed.motif}
              />
              <SuccessRow
                label="Cabinet"
                value={`${TENANT.name} — ${TENANT.address}`}
              />
            </dl>
          </div>

          <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
            <Clock className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Un <strong>rappel SMS</strong> vous sera envoyé 24 h avant le
              rendez-vous. Pensez à arriver 10 min en avance.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={onRecapSms}
              className="flex-1"
            >
              <MessageSquare className="h-4 w-4" />
              Recevoir le récap par SMS
            </Button>
            <Button
              type="button"
              onClick={onTerminer}
              className="flex-1 bg-teal-600 hover:bg-teal-700"
            >
              <Check className="h-4 w-4" />
              Terminer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SuccessRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-3 px-4 py-3 text-sm sm:grid-cols-4">
      <dt className="col-span-1 text-muted-foreground">{label}</dt>
      <dd className="col-span-2 font-medium text-foreground sm:col-span-3">
        {value}
      </dd>
    </div>
  );
}
