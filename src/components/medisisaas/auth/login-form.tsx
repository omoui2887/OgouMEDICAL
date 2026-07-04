"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  Sparkles,
  AlertCircle,
} from "lucide-react";

import { AuthShell } from "./auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useAppStore } from "@/lib/store";
import { signIn, signInWithGoogle } from "@/lib/auth";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

const DEMO_ACCOUNTS = [
  { email: "admin@clinique-plateau.ci", role: "Admin cabinet" },
  { email: "medecin@clinique-plateau.ci", role: "Médecin" },
  { email: "secretaire@clinique-plateau.ci", role: "Secrétaire" },
  { email: "comptable@clinique-plateau.ci", role: "Comptable" },
  { email: "patient@gmail.com", role: "Patient" },
];

/** Logo Google officiel (SVG inline). */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

export function LoginForm() {
  const showAuth = useAppStore((s) => s.showAuth);
  const authenticate = useAppStore((s) => s.authenticate);
  const enterDashboard = useAppStore((s) => s.enterDashboard);

  const [showPassword, setShowPassword] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [rootError, setRootError] = React.useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setRootError(null);
    setSubmitting(true);
    try {
      const user = await signIn(values);
      authenticate(user);
      toast.success(`Bienvenue, ${user.name}`, {
        description: user.tenantName
          ? `Connecté à ${user.tenantName}`
          : "Connexion réussie",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connexion impossible";
      setRootError(msg);
      toast.error("Connexion échouée", { description: msg });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setRootError(null);
    setGoogleLoading(true);
    try {
      const user = await signInWithGoogle();
      authenticate(user);
      toast.success(`Bienvenue, ${user.name}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connexion Google échouée";
      setRootError(msg);
      toast.error("Connexion Google échouée", { description: msg });
    } finally {
      setGoogleLoading(false);
    }
  }

  function handleQuickDemo() {
    enterDashboard("admin_cabinet");
    toast.success("Connexion rapide démo", {
      description: "Vous êtes connecté en tant qu'admin cabinet.",
    });
  }

  return (
    <AuthShell
      title="Connexion"
      description="Accédez à votre espace MediSaaS CI"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adresse email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="vous@cabinet.ci"
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
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Mot de passe</FormLabel>
                  <button
                    type="button"
                    onClick={() => showAuth("forgot")}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <FormControl>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="pl-9 pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {rootError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{rootError}</AlertDescription>
            </Alert>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            disabled={submitting || googleLoading}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connexion en cours…
              </>
            ) : (
              "Se connecter"
            )}
          </Button>
        </form>
      </Form>

      {/* Séparateur OU */}
      <div className="my-5 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          OU
        </span>
        <Separator className="flex-1" />
      </div>

      {/* Connexion Google */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogle}
        disabled={submitting || googleLoading}
      >
        {googleLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Connexion avec Google
      </Button>

      {/* Lien création de compte */}
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Pas encore de compte cabinet ?{" "}
        <button
          type="button"
          onClick={() => showAuth("register")}
          className="font-semibold text-primary hover:underline"
        >
          Créer un compte cabinet
        </button>
      </p>
    </AuthShell>
  );
}
