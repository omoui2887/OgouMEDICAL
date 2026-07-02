"use client";
import { create } from "zustand";
import type { ModuleKey, Role } from "@/lib/types";

export type AppView = "landing" | "dashboard";

interface AppState {
  view: AppView;
  module: ModuleKey;
  role: Role;
  sidebarCollapsed: boolean;
  userName: string;
  selectedPatientId: string | null;
  // actions
  setView: (v: AppView) => void;
  setModule: (m: ModuleKey) => void;
  setRole: (r: Role) => void;
  toggleSidebar: () => void;
  setSelectedPatientId: (id: string | null) => void;
  enterDashboard: (role?: Role) => void;
  exitToLanding: () => void;
}

const ROLE_DEFAULTS: Record<Role, string> = {
  super_admin: "Admin Plateforme",
  admin_cabinet: "Dr. Aya Kouassi",
  medecin: "Dr. Konan Yao",
  secretaire: "Affoué Tanoh",
  patient: "Kouadio Brou",
  comptable: "Yves Adou",
};

export const useAppStore = create<AppState>((set) => ({
  view: "landing",
  module: "dashboard",
  role: "admin_cabinet",
  sidebarCollapsed: false,
  userName: ROLE_DEFAULTS["admin_cabinet"],
  selectedPatientId: null,
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
    }),
  exitToLanding: () => set({ view: "landing" }),
}));
