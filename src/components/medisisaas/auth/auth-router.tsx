"use client";

import { useAppStore } from "@/lib/store";
import { LoginForm } from "./login-form";
import { RegisterWizard } from "./register-wizard";
import { ForgotPasswordForm } from "./forgot-password-form";
import { VerifyEmail } from "./verify-email";
import { PatientBooking } from "./patient-booking";

/**
 * Orchestrateur des écrans d'authentification.
 * Rendu en overlay au-dessus de la landing page : renvoie `null`
 * quand `authScreen` est `null` (aucun écran d'auth affiché).
 */
export function AuthRouter() {
  const screen = useAppStore((s) => s.authScreen);
  if (!screen) return null;

  switch (screen) {
    case "login":
      return <LoginForm />;
    case "register":
      return <RegisterWizard />;
    case "forgot":
      return <ForgotPasswordForm />;
    case "verify":
      return <VerifyEmail />;
    case "booking":
      return <PatientBooking />;
    default:
      return null;
  }
}
