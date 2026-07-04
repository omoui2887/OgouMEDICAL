"use client";

import * as React from "react";
import { toast } from "sonner";
import { MailCheck, Loader2, ShieldCheck, Clock, RefreshCw } from "lucide-react";

import { AuthShell } from "./auth-shell";
import { Button } from "@/components/ui/button";

import { useAppStore } from "@/lib/store";

const COOLDOWN_SECONDS = 60;

export function VerifyEmail() {
  const showAuth = useAppStore((s) => s.showAuth);

  const [email, setEmail] = React.useState<string>("");
  const [cooldown, setCooldown] = React.useState(0);
  const [resending, setResending] = React.useState(false);

  // Récupère l'email depuis localStorage (posé par signUp)
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("medisaas-pending-registration");
      if (raw) {
        const parsed = JSON.parse(raw) as { email?: string; cabinetName?: string };
        if (parsed?.email) setEmail(parsed.email);
      }
    } catch {
      // Silencieux — fallback sur placeholder
    }
  }, []);

  // Timer de cooldown
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleResend() {
    if (cooldown > 0 || resending) return;
    setResending(true);
    // Simulation : en prod, déclenche un nouvel email via Resend/Supabase
    setTimeout(() => {
      setResending(false);
      setCooldown(COOLDOWN_SECONDS);
      toast.success("Email renvoyé", {
        description: email
          ? `Un nouveau lien a été envoyé à ${email}`
          : "Un nouveau lien a été envoyé",
      });
    }, 900);
  }

  return (
    <AuthShell
      title="Vérifiez votre email"
      description="Un dernier pas pour activer votre compte cabinet"
    >
      {/* Icône principale */}
      <div className="flex flex-col items-center text-center">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60">
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/30" />
          <MailCheck className="h-10 w-10 text-emerald-600" strokeWidth={2.2} />
        </div>

        <h2 className="mt-5 text-xl font-bold text-foreground">
          Confirmez votre adresse email
        </h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Nous avons envoyé un lien de confirmation à{" "}
          {email ? (
            <span className="font-semibold text-foreground">{email}</span>
          ) : (
            <span className="font-semibold text-foreground">votre adresse email</span>
          )}
          . Cliquez sur le lien reçu pour activer votre compte.
        </p>
      </div>

      {/* Bouton principal : j'ai vérifié */}
      <Button
        type="button"
        className="mt-6 w-full"
        onClick={() => showAuth("login")}
      >
        J&apos;ai vérifié, me connecter
      </Button>

      {/* Renvoyer avec cooldown */}
      <Button
        type="button"
        variant="outline"
        className="mt-2.5 w-full"
        onClick={handleResend}
        disabled={cooldown > 0 || resending}
      >
        {resending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Envoi en cours…
          </>
        ) : cooldown > 0 ? (
          <>
            <RefreshCw className="h-4 w-4 opacity-50" />
            Renvoyer dans {cooldown}s
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            Renvoyer l&apos;email
          </>
        )}
      </Button>

      {/* Note expiration */}
      <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        Le lien expire dans 24 heures.
      </div>

      {/* Encart sécurité Loi 2013-450 */}
      <div className="mt-6 rounded-lg border border-emerald-500/30 bg-emerald-50/60 p-3.5 dark:bg-emerald-950/30">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-foreground">
              Sécurité &amp; conformité — Loi 2013-450
            </p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Votre email n&apos;est utilisé que pour activer votre compte. Vos
              données médicales sont chiffrées (AES-256) et hébergées en Afrique
              (af-south-1). Aucune donnée de santé n&apos;est transmise par email.
            </p>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Besoin d&apos;aide ?{" "}
        <a
          href="mailto:support@medisaas.ci"
          className="font-medium text-primary hover:underline"
        >
          support@medisaas.ci
        </a>
      </p>
    </AuthShell>
  );
}
