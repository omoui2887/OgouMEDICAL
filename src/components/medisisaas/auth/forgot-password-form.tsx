"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Mail,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  MailCheck,
  ShieldCheck,
} from "lucide-react";

import { AuthShell } from "./auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useAppStore } from "@/lib/store";
import { requestPasswordReset } from "@/lib/auth";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations/auth";

export function ForgotPasswordForm() {
  const showAuth = useAppStore((s) => s.showAuth);

  const [submitting, setSubmitting] = React.useState(false);
  const [sentEmail, setSentEmail] = React.useState<string | null>(null);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setSubmitting(true);
    try {
      await requestPasswordReset(values.email);
      setSentEmail(values.email);
      toast.success("Email envoyé", {
        description: "Vérifiez votre boîte de réception.",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Échec de l'envoi";
      toast.error("Échec de l'envoi", { description: msg });
    } finally {
      setSubmitting(false);
    }
  }

  // État succès
  if (sentEmail) {
    return (
      <AuthShell
        title="Email envoyé"
        description="Vérifiez votre boîte de réception"
      >
        <Alert className="border-emerald-500/40 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertTitle className="text-emerald-900 dark:text-emerald-100">
            Lien de réinitialisation envoyé
          </AlertTitle>
          <AlertDescription className="text-emerald-800 dark:text-emerald-200">
            Si un compte existe, un email a été envoyé à{" "}
            <span className="font-semibold">{sentEmail}</span>. Cliquez sur le
            lien reçu pour choisir un nouveau mot de passe.
          </AlertDescription>
        </Alert>

        <div className="mt-5 rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
          <p className="flex items-center gap-1.5">
            <MailCheck className="h-3.5 w-3.5 text-emerald-600" />
            Le lien est valable 1 heure.
          </p>
          <p className="mt-1.5 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Aucune donnée médicale n&apos;est transmise par email.
          </p>
        </div>

        <Button
          type="button"
          className="mt-5 w-full"
          onClick={() => showAuth("login")}
        >
          Retour à la connexion
        </Button>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Pas reçu d&apos;email ?{" "}
          <button
            type="button"
            onClick={() => setSentEmail(null)}
            className="font-semibold text-primary hover:underline"
          >
            Réessayer avec une autre adresse
          </button>
        </p>
      </AuthShell>
    );
  }

  // État formulaire initial
  return (
    <AuthShell
      title="Mot de passe oublié"
      description="Recevez un lien de réinitialisation par email"
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
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
                <FormDescription>
                  Nous vous enverrons un lien sécurisé pour réinitialiser votre
                  mot de passe.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Envoi en cours…
              </>
            ) : (
              "Envoyer le lien"
            )}
          </Button>
        </form>
      </Form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        <button
          type="button"
          onClick={() => showAuth("login")}
          className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour à la connexion
        </button>
      </p>
    </AuthShell>
  );
}
