"use client";
import { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { MODULES, ROLE_MODULES, ROLE_LIST } from "@/lib/nav";
import { Brand, BrandMark } from "@/components/medisisaas/brand";
import { Avatar, RoleBadge } from "@/components/medisisaas/shared";
import { TENANT } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuRadioGroup, DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  Sheet, SheetContent, SheetTrigger,
} from "@/components/ui/sheet";
import {
  ChevronLeft, Bell, Search, Menu, LogOut, UserCog,
  Settings, HelpCircle, Moon, Sun, Plus, ShieldCheck, Wifi,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

function ModuleNavItem({
  moduleKey,
  collapsed,
  onNavigate,
}: {
  moduleKey: (typeof MODULES)[number]["key"];
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const { module: active, setModule } = useAppStore();
  const item = MODULES.find((m) => m.key === moduleKey)!;
  const isActive = active === moduleKey;
  const Icon = item.icon;
  return (
    <button
      onClick={() => {
        setModule(moduleKey);
        onNavigate?.();
      }}
      className={cn(
        "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        collapsed && "justify-center px-0"
      )}
      title={collapsed ? item.label : undefined}
    >
      <Icon className={cn("h-5 w-5 shrink-0", isActive ? "" : "text-muted-foreground group-hover:text-foreground")} />
      {!collapsed && (
        <div className="flex flex-col items-start leading-tight">
          <span>{item.label}</span>
        </div>
      )}
    </button>
  );
}

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { role } = useAppStore();
  const allowed = ROLE_MODULES[role] ?? [];
  const grouped: Record<string, (typeof MODULES)[number]["key"][]> = {
    "Pilotage": ["dashboard", "analytics"],
    "Métier": ["appointments", "patients", "prescriptions", "teleconsultation"],
    "Finance": ["billing", "subscriptions"],
    "Espace patient & config": ["patient-portal", "settings"],
  };
  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 items-center border-b border-sidebar-border px-4", collapsed && "justify-center px-0")}>
        {collapsed ? <BrandMark size="md" /> : <Brand size="sm" />}
      </div>
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-5">
          {Object.entries(grouped).map(([group, keys]) => {
            const visible = keys.filter((k) => allowed.includes(k));
            if (visible.length === 0) return null;
            return (
              <div key={group}>
                {!collapsed && (
                  <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group}
                  </p>
                )}
                <div className="space-y-1">
                  {visible.map((k) => (
                    <ModuleNavItem key={k} moduleKey={k} collapsed={collapsed} onNavigate={onNavigate} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      {!collapsed && (
        <div className="border-t border-sidebar-border p-3">
          <div className="rounded-lg bg-gradient-to-br from-teal-500/10 to-emerald-500/10 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 dark:text-teal-300">
              <ShieldCheck className="h-4 w-4" />
              Conformité Loi 2013-450
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Données chiffrées AES-256 · Hébergées en af-south-1
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function RoleSwitcher() {
  const { role, setRole } = useAppStore();
  const current = ROLE_LIST.find((r) => r.value === role);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserCog className="h-4 w-4 text-teal-600" />
          <span className="hidden sm:inline">{current?.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Changer de rôle (démo)</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={role} onValueChange={(v) => setRole(v as typeof role)}>
          {ROLE_LIST.map((r) => (
            <DropdownMenuRadioItem key={r.value} value={r.value} className="flex flex-col items-start py-2">
              <span className="font-medium">{r.label}</span>
              <span className="text-xs text-muted-foreground">{r.description}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Basculer le thème</span>
    </Button>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, toggleSidebar, exitToLanding, role } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentModule = useAppStore((s) => s.module);
  const currentMeta = MODULES.find((m) => m.key === currentModule);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar desktop */}
      <aside
        className={cn(
          "hidden lg:flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
          sidebarCollapsed ? "w-[72px]" : "w-64"
        )}
      >
        <SidebarContent collapsed={sidebarCollapsed} />
      </aside>

      {/* Sidebar mobile */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          </Sheet>
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent text-muted-foreground"
            title="Réduire le menu"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", sidebarCollapsed && "rotate-180")} />
          </button>

          <div className="hidden md:block">
            <h1 className="text-base font-semibold leading-tight">{currentMeta?.label}</h1>
            <p className="text-xs text-muted-foreground">{currentMeta?.description}</p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <Wifi className="h-3 w-3" />
              {TENANT.name}
            </div>
            <Button variant="ghost" size="icon" className="relative" onClick={() => { toast.info("Notifications", { description: "5 RDV à confirmer, 2 paiements reçus, 3 résultats d'analyse disponibles" }); }}>
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-orange-500" />
            </Button>
            <ThemeToggle />
            <RoleSwitcher />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full hover:bg-accent p-1 pr-2">
                  <Avatar name={useAppStore.getState().userName} color="bg-teal-600" size="sm" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-1">
                  <span>{useAppStore.getState().userName}</span>
                  <RoleBadge role={role} />
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem><Settings className="mr-2 h-4 w-4" /> Mon profil</DropdownMenuItem>
                <DropdownMenuItem><HelpCircle className="mr-2 h-4 w-4" /> Aide & support</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={exitToLanding} className="text-rose-600 focus:text-rose-700">
                  <LogOut className="mr-2 h-4 w-4" /> Quitter le dashboard
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
