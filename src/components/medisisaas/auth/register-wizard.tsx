"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Building2,
  User,
  Crown,
  Check,
  Phone,
  Mail,
  Lock,
  Stethoscope,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

import { AuthShell } from "./auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAppStore } from "@/lib/store";
import { signUp, type RegisterData } from "@/lib/auth";
import {
  registerStep1Schema,
  registerStep2Schema,
  registerStep3Schema,
  type RegisterStep1Input,
  type RegisterStep2Input,
  type RegisterStep3Input,
} from "@/lib/validations/auth";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;

const STEPS: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: 1, label: "Cabinet", icon: Building2 },
  { id: 2, label: "Administrateur", icon: User },
  { id: 3, label: "Plan", icon: Crown },
];

interface PlanOption {
  id: "freemium" | "starter" | "pro";
  name: string;
  price: string;
  period: string;
  tagline: string;
  features: string[];
  popular?: boolean;
}

const PLANS: PlanOption[] = [
  {
    id: "freemium",
    name: "Freemium",
    price: "0 FCFA",
    period: "gratuit",
    tagline: "Pour démarrer",
    features: ["1 médecin", "50 patients", "RDV & dossiers", "Support email"],
  },
  {
    id: "starter",
    name: "Starter",
    price: "35 000 FCFA",
    period: "/mois",
    tagline: "Petits cabinets",
    features: [
      "3 médecins",
      "500 patients",
      "Facturation Mobile Money",
      "SMS de rappel",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "75 000 FCFA",
    period: "/mois",
    tagline: "Cabinets ambitieux",
    features: [
      "10 médecins",
      "Patients illimités",
      "Téléconsultation",
      "Mobile Money (Orange/Wave/MTN)",
      "WhatsApp Business",
    ],
    popular: true,
  },
];

function passwordStrength(
  pw: string
): { score: 0 | 1 | 2 | 3; label: string; bar: string; text: string } {
  if (!pw) return { score: 0, label: "—", bar: "bg-muted", text: "text-muted-foreground" };
  const hasLen = pw.length >= 8;
  const hasUpper = /[A-Z]/.test(pw);
  const hasDigit = /[0-9]/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);
  if (!hasLen || !hasUpper || !hasDigit) {
    return { score: 1, label: "Faible", bar: "bg-rose-500", text: "text-rose-600" };
  }
  if (pw.length >= 12 && hasSpecial) {
    return { score: 3, label: "Fort", bar: "bg-emerald-600", text: "text-emerald-700" };
  }
  return { score: 2, label: "Moyen", bar: "bg-amber-500", text: "text-amber-700" };
}

export function RegisterWizard() {
  const showAuth = useAppStore((s) => s.showAuth);
  const hideAuth = useAppStore((s) => s.hideAuth);

  const [step, setStep] = React.useState<Step>(1);
  const [submitting, setSubmitting] = React.useState(false);

  // Données cumulées inter-étapes
  const [d1, setD1] = React.useState<Partial<RegisterStep1Input>>({});
  const [d2, setD2] = React.useState<Partial<RegisterStep2Input>>({});

  // Formulaires indépendants par étape (chacun avec son schéma Zod)
  const form1 = useForm<RegisterStep1Input>({
    resolver: zodResolver(registerStep1Schema),
    defaultValues: {
      cabinetName: d1.cabinetName ?? "",
      cabinetType: d1.cabinetType,
      city: d1.city ?? "Abidjan",
      phone: d1.phone ?? "",
    },
  });

  const form2 = useForm<RegisterStep2Input>({
    resolver: zodResolver(registerStep2Schema),
    defaultValues: {
      firstName: d2.firstName ?? "",
      lastName: d2.lastName ?? "",
      email: d2.email ?? "",
      password: d2.password ?? "",
      confirmPassword: d2.confirmPassword ?? "",
    },
  });

  const form3 = useForm<RegisterStep3Input>({
    resolver: zodResolver(registerStep3Schema),
    defaultValues: { plan: "pro", acceptTerms: false as unknown as true },
  });

  const watchedPassword = form2.watch("password");
  const strength = passwordStrength(watchedPassword ?? "");

  function onStep1Submit(values: RegisterStep1Input) {
    setD1(values);
    setStep(2);
  }
  function onStep2Submit(values: RegisterStep2Input) {
    setD2(values);
    setStep(3);
  }
  async function onStep3Submit(values: RegisterStep3Input) {
    setSubmitting(true);
    try {
      const payload: RegisterData = {
        cabinetName: d1.cabinetName ?? "",
        cabinetType: d1.cabinetType ?? "cabinet",
        city: d1.city ?? "Abidjan",
        phone: d1.phone ?? "",
        firstName: d2.firstName ?? "",
        lastName: d2.lastName ?? "",
        email: d2.email ?? "",
        password: d2.password ?? "",
        plan: values.plan,
      };
      await signUp(payload);
      toast.success("Cabinet créé !", {
        description: "Email de vérification envoyé.",
      });
      showAuth("verify");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Inscription échouée";
      toast.error("Inscription échouée", { description: msg });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Créer un compte cabinet"
      description="Quelques informations pour démarrer sur MediSaaS CI"
    >
      {/* ---------- Barre de progression ---------- */}
      <div className="mb-6">
        <Progress value={(step / 3) * 100} className="h-2" />
        <div className="mt-3 flex items-center justify-between">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isDone = step > s.id;
            const isActive = step === s.id;
            return (
              <div key={s.id} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                      isDone && "bg-emerald-600 text-white",
                      isActive && "bg-primary text-primary-foreground shadow-sm shadow-primary/30",
                      !isDone && !isActive && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span
                    className={cn(
                      "hidden text-[11px] font-medium sm:block",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 ? (
                  <div
                    className={cn(
                      "mx-1 h-px flex-1 sm:mx-2",
                      step > s.id ? "bg-emerald-500/60" : "bg-border"
                    )}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------- Étape 1 — Cabinet ---------- */}
      {step === 1 ? (
        <Form {...form1}>
          <form
            onSubmit={form1.handleSubmit(onStep1Submit)}
            className="space-y-4"
            noValidate
          >
            <FormField
              control={form1.control}
              name="cabinetName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du cabinet</FormLabel>
                  <FormControl>
                    <Input placeholder="OgouMEDICAL" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form1.control}
              name="cabinetType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type d&apos;établissement</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cabinet">Cabinet médical</SelectItem>
                      <SelectItem value="clinique">Clinique</SelectItem>
                      <SelectItem value="polyclinique">Polyclinique</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form1.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ville</FormLabel>
                    <FormControl>
                      <Input placeholder="Abidjan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form1.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="+225 07 08 12 34 56"
                          className="pl-9"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => hideAuth()}
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              <Button type="submit" className="flex-1">
                Continuer
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Form>
      ) : null}

      {/* ---------- Étape 2 — Administrateur ---------- */}
      {step === 2 ? (
        <Form {...form2}>
          <form
            onSubmit={form2.handleSubmit(onStep2Submit)}
            className="space-y-4"
            noValidate
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form2.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom</FormLabel>
                    <FormControl>
                      <Input placeholder="Aya" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form2.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input placeholder="Kouassi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form2.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="aya.kouassi@cabinet.ci"
                        className="pl-9"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form2.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="pl-9"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Min. 8 caractères, 1 majuscule, 1 chiffre.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Indicateur de force */}
            {watchedPassword ? (
              <div className="space-y-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1.5 flex-1 rounded-full transition-colors",
                        strength.score >= i ? strength.bar : "bg-muted"
                      )}
                    />
                  ))}
                </div>
                <p className={cn("text-xs font-medium", strength.text)}>
                  Robustesse : {strength.label}
                </p>
              </div>
            ) : null}

            <FormField
              control={form2.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmer le mot de passe</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="pl-9"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              <Button type="submit" className="flex-1">
                Continuer
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Form>
      ) : null}

      {/* ---------- Étape 3 — Choix du plan ---------- */}
      {step === 3 ? (
        <Form {...form3}>
          <form
            onSubmit={form3.handleSubmit(onStep3Submit)}
            className="space-y-4"
            noValidate
          >
            <FormField
              control={form3.control}
              name="plan"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Choisissez votre plan</FormLabel>
                  <FormControl>
                    <div className="grid gap-3">
                      {PLANS.map((p) => {
                        const selected = field.value === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => field.onChange(p.id)}
                            className={cn(
                              "relative rounded-lg border-2 p-3.5 text-left transition-all",
                              selected
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-border bg-card hover:border-primary/40",
                              p.popular && !selected && "border-primary/40"
                            )}
                          >
                            {p.popular ? (
                              <Badge
                                className="absolute -top-2.5 right-3 bg-orange-500 text-white hover:bg-orange-500"
                              >
                                Populaire
                              </Badge>
                            ) : null}
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-foreground">
                                    {p.name}
                                  </span>
                                  {selected ? (
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                      <Check className="h-3 w-3" />
                                    </span>
                                  ) : null}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {p.tagline}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-base font-bold text-foreground">
                                  {p.price}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                  {p.period}
                                </div>
                              </div>
                            </div>
                            <ul className="mt-3 grid grid-cols-1 gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                              {p.features.map((f) => (
                                <li key={f} className="flex items-center gap-1.5">
                                  <Check className="h-3 w-3 shrink-0 text-emerald-600" />
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form3.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem>
                  <div className="flex flex-row items-start gap-3 space-y-0 rounded-lg border bg-muted/30 p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value === true}
                        onCheckedChange={(v) => field.onChange(v === true)}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-snug">
                      <FormLabel className="text-sm font-medium">
                        J&apos;accepte les conditions d&apos;utilisation et la
                        politique de confidentialité{" "}
                        <span className="text-primary font-medium">
                          (Loi 2013-450)
                        </span>
                        .
                      </FormLabel>
                      <FormDescription className="text-xs">
                        Vos données sont chiffrées (AES-256) et hébergées en
                        Afrique (af-south-1).
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(2)}
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Création en cours…
                  </>
                ) : (
                  <>
                    <Stethoscope className="h-4 w-4" />
                    Créer mon compte
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      ) : null}

      {/* Note sécurité en bas */}
      <div className="mt-6 flex items-center gap-2 rounded-md bg-muted/40 p-2.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
        <span>
          Données chiffrées AES-256 · Hébergement af-south-1 · Conforme Loi
          2013-450
        </span>
        <Sparkles className="ml-auto h-3 w-3 text-orange-500" />
      </div>
    </AuthShell>
  );
}
