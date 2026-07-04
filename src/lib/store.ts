"use client";
import { create } from "zustand";
import type { ModuleKey, Role } from "@/lib/types";

export type AppView = "landing" | "dashboard" | "status" | "about" | "legal";
export type AuthScreen = "login" | "register" | "forgot" | "verify" | "booking";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  tenantId: string | null;
  tenantName: string | null;
}

interface AppState {
  view: AppView;
  module: ModuleKey;
  role: Role;
  sidebarCollapsed: boolean;
  userName: string;
  selectedPatientId: string | null;
  // Auth
  authScreen: AuthScreen | null;
  authUser: AuthUser | null;
  isAuthenticated: boolean;
  // actions
  setView: (v: AppView) => void;
  setModule: (m: ModuleKey) => void;
  setRole: (r: Role) => void;
  toggleSidebar: () => void;
  setSelectedPatientId: (id: string | null) => void;
  enterDashboard: (role?: Role) => void;
  exitToLanding: () => void;
  showStatus: () => void;
  showAbout: () => void;
  showLegal: () => void;
  // Auth actions
  showAuth: (screen: AuthScreen) => void;
  hideAuth: () => void;
  authenticate: (user: AuthUser) => void;
  signOut: () => void;
}

const ROLE_DEFAULTS: Record<Role, string> = {
  super_admin: "Super Admin",
  admin_cabinet: "Administrateur",
  medecin: "Médecin",
  secretaire: "Secrétaire",
  patient: "Patient",
  comptable: "Comptable",
};

export const useAppStore = create<AppState>((set) => ({
  view: "landing",
  module: "dashboard",
  role: "admin_cabinet",
  sidebarCollapsed: false,
  userName: ROLE_DEFAULTS["admin_cabinet"],
  selectedPatientId: null,
  authScreen: null,
  authUser: null,
  isAuthenticated: false,
  setView: (v) => set({ view: v }),
  setModule: (m) => set({ module: m, selectedPatientId: null }),
  setRole: (r) => set({ role: r, userName: ROLE_DEFAULTS[r] }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSelectedPatientId: (id) => set({ selectedPatientId: id }),
  enterDashboard: (role) =>
    set({
      view: "dashboard",
      module: "dashboard",
      role: role ?? "admin_cabinet",
      userName: ROLE_DEFAULTS[role ?? "admin_cabinet"],
      authScreen: null,
      isAuthenticated: true,
      authUser: {
        id: "user_demo",
        email: "admin@clinique-plateau.ci",
        name: ROLE_DEFAULTS[role ?? "admin_cabinet"],
        role: role ?? "admin_cabinet",
        tenantId: "ten_clinique_plateau",
        tenantName: "OgouMEDICAL",
      },
    }),
  exitToLanding: () =>
    set({ view: "landing", authScreen: null, isAuthenticated: false, authUser: null }),
  showStatus: () => set({ view: "status", authScreen: null }),
  showAbout: () => set({ view: "about", authScreen: null }),
  showLegal: () => set({ view: "legal", authScreen: null }),
  showAuth: (screen) => set({ authScreen: screen }),
  hideAuth: () => set({ authScreen: null }),
  authenticate: (user) =>
    set({
      authUser: user,
      isAuthenticated: true,
      authScreen: null,
      view: "dashboard",
      module: "dashboard",
      role: user.role,
      userName: user.name,
    }),
  signOut: () =>
    set({
      authUser: null,
      isAuthenticated: false,
      authScreen: null,
      view: "landing",
      module: "dashboard",
    }),
}));
