// ============================================================
// MediSaaS CI — Client d'authentification
// ============================================================
// En production : brancher @supabase/supabase-js (createClient)
// + supabase.auth.signInWithPassword / signUp / signInWithOAuth
// Ici : mock simulant l'API Supabase pour la démo.
// ============================================================

import type { Role } from "@/lib/types";
import type { AuthUser } from "@/lib/store";

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisterData {
  // Étape 1 — cabinet
  cabinetName: string;
  cabinetType: string;
  city: string;
  phone: string;
  // Étape 2 — administrateur
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  // Étape 3 — plan
  plan: "freemium" | "starter" | "pro";
}

// Utilisateurs de démonstration (en prod : Supabase Auth)
const DEMO_USERS: Array<{
  email: string;
  password: string;
  role: Role;
  name: string;
  tenantName: string;
}> = [
  { email: "admin@clinique-plateau.ci", password: "demo1234", role: "admin_cabinet", name: "Dr. Aya Kouassi", tenantName: "OgouMEDICAL" },
  { email: "medecin@clinique-plateau.ci", password: "demo1234", role: "medecin", name: "Dr. Konan Yao", tenantName: "OgouMEDICAL" },
  { email: "secretaire@clinique-plateau.ci", password: "demo1234", role: "secretaire", name: "Affoué Tanoh", tenantName: "OgouMEDICAL" },
  { email: "comptable@clinique-plateau.ci", password: "demo1234", role: "comptable", name: "Yves Adou", tenantName: "OgouMEDICAL" },
  { email: "patient@gmail.com", password: "demo1234", role: "patient", name: "Kouadio Brou", tenantName: "OgouMEDICAL" },
];

const AUTH_STORAGE_KEY = "medisaas-auth";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Connexion email/mot de passe (mock Supabase auth.signInWithPassword)
 */
export async function signIn({ email, password }: Credentials): Promise<AuthUser> {
  await delay(700); // simulation latence réseau
  const user = DEMO_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  if (!user) {
    throw new Error("Email ou mot de passe incorrect.");
  }
  const authUser: AuthUser = {
    id: "user_" + user.role,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.role === "patient" ? null : "ten_clinique_plateau",
    tenantName: user.tenantName,
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
  }
  return authUser;
}

/**
 * Connexion OAuth Google (mock — en prod : supabase.auth.signInWithOAuth({ provider: 'google' }))
 */
export async function signInWithGoogle(): Promise<AuthUser> {
  await delay(900);
  const user = DEMO_USERS[0];
  const authUser: AuthUser = {
    id: "user_google",
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: "ten_clinique_plateau",
    tenantName: user.tenantName,
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
  }
  return authUser;
}

/**
 * Inscription cabinet (mock — en prod : supabase.auth.signUp + création tenant via trigger)
 */
export async function signUp(data: RegisterData): Promise<{ success: true; email: string }> {
  await delay(1200);
  if (typeof window !== "undefined") {
    // En prod : Supabase enverra un email de confirmation
    localStorage.setItem(
      "medisaas-pending-registration",
      JSON.stringify({ email: data.email, cabinetName: data.cabinetName })
    );
  }
  return { success: true, email: data.email };
}

/**
 * Demande de réinitialisation mot de passe (mock — en prod : supabase.auth.resetPasswordForEmail)
 */
export async function requestPasswordReset(email: string): Promise<{ success: true }> {
  await delay(800);
  // En prod : Resend envoie l'email avec le lien de réinitialisation
  return { success: true };
}

/**
 * Récupère la session persistée (mock — en prod : supabase.auth.getSession())
 */
export function getStoredSession(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

/**
 * Déconnexion (mock — en prod : supabase.auth.signOut())
 */
export async function signOut(): Promise<void> {
  await delay(300);
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

/**
 * Vérifie l'abonnement du tenant (mock — en prod : requête /api/subscriptions/status)
 */
export async function checkSubscription(tenantId: string | null): Promise<{
  active: boolean;
  plan: string;
  endsAt: string | null;
}> {
  await delay(200);
  if (!tenantId) return { active: true, plan: "freemium", endsAt: null };
  // Mock : abonnement Pro actif jusqu'à dans 18 jours
  return {
    active: true,
    plan: "pro",
    endsAt: new Date(Date.now() + 18 * 86400000).toISOString(),
  };
}
