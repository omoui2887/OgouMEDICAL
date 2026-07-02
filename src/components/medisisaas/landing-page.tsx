"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Stethoscope,
  CalendarDays,
  FileText,
  Pill,
  CreditCard,
  Video,
  UserSquare2,
  Repeat2,
  BarChart3,
  Rocket,
  Menu,
  ShieldCheck,
  Lock,
  Server,
  Building2,
  MessageSquare,
  Smartphone,
  Sparkles,
  Check,
  Star,
  ArrowRight,
  ArrowUpRight,
  Users,
  Activity,
  Wallet,
  Bell,
  Database,
  Globe2,
  CloudUpload,
  ClipboardList,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
} from "lucide-react";

import { useAppStore } from "@/lib/store";
import { Brand, BrandMark } from "@/components/medisisaas/brand";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { PLANS, TENANT } from "@/lib/mock-data";
import { formatFCFA } from "@/lib/types";

// ============================================================
// Helpers locaux
// ============================================================
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const NAV_LINKS = [
  { href: "#modules", label: "Modules" },
  { href: "#pourquoi", label: "Pourquoi nous" },
  { href: "#etapes", label: "Comment ça marche" },
  { href: "#tarifs", label: "Tarifs" },
  { href: "#conformite", label: "Conformité" },
  { href: "#contact", label: "Contact" },
];

// 10 modules principaux
const MODULES = [
  {
    icon: BarChart3,
    title: "Tableau de bord",
    desc: "Vue temps réel : RDV, revenus, charge médecins.",
    color: "from-teal-500 to-emerald-600",
  },
  {
    icon: CalendarDays,
    title: "Rendez-vous en ligne",
    desc: "Agenda interactif, rappels SMS & WhatsApp.",
    color: "from-orange-500 to-amber-600",
  },
  {
    icon: FileText,
    title: "Dossier Patient Numérique",
    desc: "Antécédents, allergies, constants, historique.",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: Pill,
    title: "Ordonnances électroniques",
    desc: "Prescription numérique, sécurité & traçabilité.",
    color: "from-rose-500 to-orange-500",
  },
  {
    icon: CreditCard,
    title: "Facturation & Mobile Money",
    desc: "Orange, Wave, MTN via CinetPay, en un clic.",
    color: "from-amber-500 to-orange-600",
  },
  {
    icon: Video,
    title: "Téléconsultation vidéo",
    desc: "Visio HD sécurisée, intégrée Daily.co.",
    color: "from-teal-600 to-cyan-600",
  },
  {
    icon: UserSquare2,
    title: "Portail patient",
    desc: "Espace patient : RDV, documents, paiements.",
    color: "from-emerald-600 to-green-600",
  },
  {
    icon: Repeat2,
    title: "Abonnements SaaS",
    desc: "Gestion plans, sièges, factures récurrentes.",
    color: "from-orange-600 to-rose-500",
  },
  {
    icon: Activity,
    title: "Analytique avancée",
    desc: "Revenus, file active, performance par spécialité.",
    color: "from-teal-500 to-cyan-500",
  },
  {
    icon: Rocket,
    title: "Onboarding cabinet",
    desc: "Mise en route guidée, import patients CSV.",
    color: "from-emerald-500 to-teal-500",
  },
];

// Pourquoi MediSaaS CI
const REASONS = [
  {
    icon: Building2,
    title: "Multi-tenant isolé",
    desc: "Chaque cabinet dispose de sa base dédiée. Données jamais mélangées, isolation complète par tenant.",
  },
  {
    icon: ShieldCheck,
    title: "Conformité Loi 2013-450 & ARTCI",
    desc: "Respect de la loi ivoirienne sur la protection des données personnelles et des exigences de l'ARTCI.",
  },
  {
    icon: Lock,
    title: "Chiffrement AES-256",
    desc: "Toutes les données patients sont chiffrées au repos et en transit. Accès journalisés et auditables.",
  },
  {
    icon: Smartphone,
    title: "Mobile Money natif",
    desc: "Orange Money, Wave, MTN Money via CinetPay. Encaissement immédiat des consultations et ordonnances.",
  },
  {
    icon: Video,
    title: "Téléconsultation Daily.co",
    desc: "Visio haute qualité intégrée au dossier patient. Aucune installation côté médecin ou patient.",
  },
  {
    icon: MessageSquare,
    title: "SMS & WhatsApp patients",
    desc: "Rappels automatiques de RDV via Africa's Talking et WhatsApp Business. Réduction des absences de 40%.",
  },
];

// Étapes "Comment ça marche"
const STEPS = [
  {
    icon: Rocket,
    title: "Onboarding du cabinet",
    desc: "Créez votre espace, invitez vos médecins et secrétaires. Importez votre fichier patients en CSV.",
  },
  {
    icon: CloudUpload,
    title: "Import des patients",
    desc: "Vos dossiers existants sont intégrés en quelques minutes. Historique, allergies, antécédents.",
  },
  {
    icon: ClipboardList,
    title: "Consultations & ordonnances",
    desc: "Médecins consultent, prescrivent en numérique. Le dossier patient se met à jour automatiquement.",
  },
  {
    icon: Wallet,
    title: "Encaissements Mobile Money",
    desc: "Les patients règlent en Orange, Wave ou MTN. Factures et reçus envoyés par SMS et WhatsApp.",
  },
];

// Témoignages
const TESTIMONIALS = [
  {
    name: "Dr. Aya Kouassi",
    role: "Médecin généraliste — Clinique Cocody",
    initials: "AK",
    color: "bg-teal-600",
    quote:
      "Depuis MediSaaS CI, j'ai divisé mon temps administratif par deux. Les ordonnances électroniques et les rappels SMS ont transformé mon cabinet.",
    rating: 5,
  },
  {
    name: "Dr. Konan Yao",
    role: "Cardiologue — Plateau, Abidjan",
    initials: "KY",
    color: "bg-rose-600",
    quote:
      "La téléconsultation intégrée est un game-changer pour mes patients d'Yopougon. La facturation Wave et Orange Money arrive instantanément.",
    rating: 5,
  },
  {
    name: "Mme Affoué Tanoh",
    role: "Secrétaire médicale — Yopougon",
    initials: "AT",
    color: "bg-orange-500",
    quote:
      "Plus d'agenda papier, plus de files d'attente. Les patients réservent en ligne et paient par Mobile Money. C'est simple et rapide.",
    rating: 5,
  },
];

// Partenaires
const PARTNERS = [
  { name: "Paiement via CinetPay", color: "bg-teal-500" },
  { name: "Orange Money", color: "bg-orange-500" },
  { name: "Wave", color: "bg-sky-500" },
  { name: "MTN Money", color: "bg-yellow-400 text-yellow-950" },
  { name: "Africa's Talking SMS", color: "bg-emerald-500" },
  { name: "WhatsApp Business", color: "bg-green-500" },
  { name: "Daily.co téléconsultation", color: "bg-amber-500" },
];

// Badges de conformité
const COMPLIANCE = [
  { icon: Server, title: "Hébergé en af-south-1", desc: "Données stockées en Afrique (Cape Town). Aucune sortie du continent." },
  { icon: ShieldCheck, title: "Loi n°2013-450", desc: "Conformité totale à la loi ivoirienne sur la protection des données." },
  { icon: Lock, title: "Chiffrement AES-256", desc: "Données chiffrées au repos et en transit. Journal d'audit complet." },
  { icon: Database, title: "Backups quotidiens", desc: "Sauvegardes automatiques chiffrées, rétention 30 jours." },
];

// ============================================================
// Composant principal
// ============================================================
export function LandingPage() {
  const enterDashboard = useAppStore((s) => s.enterDashboard);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [annual, setAnnual] = useState(false);

  const handleEnter = () => enterDashboard("admin_cabinet");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onEnter={handleEnter}
      />
      <main className="flex-1">
        <Hero onEnter={handleEnter} />
        <Partners />
        <Modules />
        <WhyUs />
        <HowItWorks />
        <Testimonials />
        <Pricing annual={annual} setAnnual={setAnnual} onEnter={handleEnter} />
        <Compliance />
        <FinalCTA onEnter={handleEnter} />
      </main>
      <Footer />
    </div>
  );
}

// ============================================================
// Header
// ============================================================
function Header({
  mobileOpen,
  setMobileOpen,
  onEnter,
}: {
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  onEnter: () => void;
}) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center" aria-label="Accueil MediSaaS CI">
          <Brand size="md" />
        </a>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Button variant="ghost" size="sm" onClick={onEnter}>
            Connexion
          </Button>
          <Button size="sm" onClick={onEnter} className="bg-teal-600 hover:bg-teal-700">
            Démarrer l'essai
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetTitle className="px-4 pt-4">
              <span className="sr-only">Menu de navigation</span>
            </SheetTitle>
            <div className="flex items-center justify-between px-4">
              <Brand size="sm" />
            </div>
            <nav className="flex flex-col gap-1 px-4 pt-4">
              {NAV_LINKS.map((l) => (
                <SheetClose asChild key={l.href}>
                  <a
                    href={l.href}
                    className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    {l.label}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </a>
                </SheetClose>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-2 p-4">
              <Button variant="outline" onClick={onEnter} className="w-full">
                Connexion
              </Button>
              <Button
                onClick={onEnter}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                Démarrer l'essai
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

// ============================================================
// Hero
// ============================================================
function Hero({ onEnter }: { onEnter: () => void }) {
  return (
    <section
      id="top"
      className="relative overflow-hidden medical-grid"
    >
      {/* Halos */}
      <div className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full glow-teal blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full glow-teal blur-3xl opacity-60" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Colonne texte */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6"
          >
            <motion.div variants={fadeUp}>
              <Badge
                variant="outline"
                className="w-fit gap-1.5 border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-300"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Conçu en Côte d'Ivoire, pour la Côte d'Ivoire
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl"
            >
              La gestion médicale,{" "}
              <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                pensée pour la Côte d'Ivoire
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="max-w-xl text-lg text-muted-foreground text-pretty"
            >
              RDV en ligne, dossiers patients numériques, ordonnances
              électroniques, paiement Mobile Money et téléconsultation —
              réunis dans une seule plateforme, hébergée en Afrique et
              conforme à la loi ivoirienne.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <Button
                size="lg"
                onClick={onEnter}
                className="h-12 bg-teal-600 text-base hover:bg-teal-700"
              >
                <Stethoscope className="h-5 w-5" />
                Accéder à la plateforme
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 text-base"
              >
                <a href="#tarifs">Voir les tarifs</a>
              </Button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-xs font-medium text-muted-foreground"
            >
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-teal-600" />
                Conforme Loi n°2013-450
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Server className="h-4 w-4 text-emerald-600" />
                Hébergé en af-south-1
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Smartphone className="h-4 w-4 text-orange-500" />
                Mobile Money natif
              </span>
            </motion.div>
          </motion.div>

          {/* Colonne visuel */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <HeroDashboardPreview />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Mini aperçu dashboard (glassmorphism)
function HeroDashboardPreview() {
  return (
    <div className="relative">
      {/* Carte principale */}
      <div className="relative rounded-2xl border border-teal-100 bg-white/80 p-5 shadow-2xl shadow-teal-500/10 backdrop-blur-xl dark:border-teal-900/50 dark:bg-card/80">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <BrandMark size="sm" />
            <div>
              <p className="text-sm font-semibold">Clinique du Plateau</p>
              <p className="text-[11px] text-muted-foreground">
                Cocody — Abidjan
              </p>
            </div>
          </div>
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            En ligne
          </Badge>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3 py-4">
          <MiniStat
            icon={CalendarDays}
            label="RDV ce mois"
            value="512"
            trend="+12%"
            color="text-teal-600"
          />
          <MiniStat
            icon={Wallet}
            label="Revenus"
            value="4,8M"
            trend="FCFA"
            color="text-orange-500"
          />
          <MiniStat
            icon={Users}
            label="Patients actifs"
            value="1 240"
            trend="+8%"
            color="text-emerald-600"
          />
        </div>

        {/* Mini bar chart */}
        <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Activité 7 derniers jours
            </span>
            <Activity className="h-3.5 w-3.5 text-teal-600" />
          </div>
          <div className="flex h-16 items-end justify-between gap-1.5">
            {[55, 70, 45, 80, 65, 90, 75].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-gradient-to-t from-teal-500 to-emerald-400"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* Mini liste RDV */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 p-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
              AK
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-medium">
                Dr. Aya Kouassi · Médecine générale
              </p>
              <p className="text-[11px] text-muted-foreground">
                09:30 — Aya Kouassi
              </p>
            </div>
            <Badge
              variant="secondary"
              className="bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300"
            >
              Confirmé
            </Badge>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 p-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700 dark:bg-orange-950/50 dark:text-orange-300">
              OM
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-medium">
                Paiement Orange Money
              </p>
              <p className="text-[11px] text-muted-foreground">
                Reçu il y a 3 min
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-600">
              +25 000 F
            </span>
          </div>
        </div>
      </div>

      {/* Notification flottante */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="absolute -right-4 -top-4 hidden items-center gap-2 rounded-xl border border-orange-200 bg-white/95 p-3 shadow-xl backdrop-blur sm:flex dark:border-orange-900/50 dark:bg-card/95"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950/50">
          <Bell className="h-4 w-4 text-orange-600" />
        </div>
        <div>
          <p className="text-xs font-semibold">RDV rappel envoyé</p>
          <p className="text-[11px] text-muted-foreground">via WhatsApp</p>
        </div>
      </motion.div>

      {/* Pastille Mobile Money */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute -bottom-4 -left-4 hidden items-center gap-2 rounded-xl border border-emerald-200 bg-white/95 p-3 shadow-xl backdrop-blur sm:flex dark:border-emerald-900/50 dark:bg-card/95"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50">
          <Smartphone className="h-4 w-4 text-emerald-600" />
        </div>
        <div>
          <p className="text-xs font-semibold">Wave · MTN · Orange</p>
          <p className="text-[11px] text-muted-foreground">CinetPay actif</p>
        </div>
      </motion.div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  trend,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  trend: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5">
      <div className="flex items-center justify-between">
        <Icon className={cn("h-3.5 w-3.5", color)} />
        <span className="text-[10px] font-medium text-muted-foreground">
          {trend}
        </span>
      </div>
      <p className="mt-1 text-lg font-bold tracking-tight">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

// ============================================================
// Bandeau partenaires
// ============================================================
function Partners() {
  return (
    <section className="border-y border-border/60 bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="mb-5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Intégrations natives pour les praticiens ivoiriens
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          {PARTNERS.map((p) => (
            <span
              key={p.name}
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80"
            >
              <span className={cn("h-2 w-2 rounded-full", p.color)} />
              {p.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Modules (10 cartes)
// ============================================================
function Modules() {
  return (
    <section id="modules" className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Modules"
          title="Tout votre cabinet, dans une seule plateforme"
          description="10 modules intégrés qui couvrent l'intégralité du parcours de soins — de la prise de rendez-vous au paiement Mobile Money."
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        >
          {MODULES.map((m, i) => (
            <motion.div
              key={m.title}
              variants={fadeUp}
              custom={i}
              className="group relative rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-teal-300 hover:shadow-lg hover:shadow-teal-500/10 dark:hover:border-teal-800"
            >
              <div
                className={cn(
                  "mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md",
                  m.color
                )}
              >
                <m.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold tracking-tight">
                {m.title}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{m.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================
// Pourquoi MediSaaS CI
// ============================================================
function WhyUs() {
  return (
    <section id="pourquoi" className="bg-muted/40 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Pourquoi MediSaaS CI"
          title="Pensé pour les contraintes réelles des cliniques ivoiriennes"
          description="Hébergement africain, conformité légale, paiements locaux et communication patient adaptée au contexte d'Abidjan."
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {REASONS.map((r, i) => (
            <motion.div
              key={r.title}
              variants={fadeUp}
              custom={i}
              className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-colors hover:border-teal-300 dark:hover:border-teal-800"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-300">
                <r.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight">{r.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {r.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================
// Comment ça marche
// ============================================================
function HowItWorks() {
  return (
    <section id="etapes" className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Comment ça marche"
          title="Opérationnel en moins de 48 heures"
          description="Un parcours d'adoption simple, de l'onboarding du cabinet au premier paiement Mobile Money."
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              variants={fadeUp}
              custom={i}
              className="relative rounded-2xl border border-border/60 bg-card p-6"
            >
              <div className="absolute right-5 top-5 text-5xl font-extrabold text-teal-100 dark:text-teal-950/60">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/20">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {s.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================
// Témoignages
// ============================================================
function Testimonials() {
  return (
    <section className="bg-muted/40 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Témoignages"
          title="La parole aux praticiens ivoiriens"
          description="Médecins, cardiologues et secrétaires médicales d'Abidjan nous font confiance au quotidien."
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          {TESTIMONIALS.map((t, i) => (
            <motion.figure
              key={t.name}
              variants={fadeUp}
              custom={i}
              className="flex flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
            >
              <div className="mb-4 flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, idx) => (
                  <Star
                    key={idx}
                    className="h-4 w-4 fill-orange-400 text-orange-400"
                  />
                ))}
              </div>
              <blockquote className="flex-1 text-sm leading-relaxed text-foreground/90">
                « {t.quote} »
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white",
                    t.color
                  )}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================
// Tarifs
// ============================================================
function Pricing({
  annual,
  setAnnual,
  onEnter,
}: {
  annual: boolean;
  setAnnual: (v: boolean) => void;
  onEnter: () => void;
}) {
  return (
    <section id="tarifs" className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Tarifs"
          title="Des tarifs transparents, en FCFA"
          description="Choisissez le plan adapté à votre cabinet. Sans engagement, annulable à tout moment. Paiement Mobile Money accepté."
        />

        {/* Bascule mensuel / annuel */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <span
            className={cn(
              "text-sm font-medium transition-colors",
              !annual ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Mensuel
          </span>
          <button
            type="button"
            onClick={() => setAnnual(!annual)}
            className="relative h-7 w-12 rounded-full border border-border bg-muted transition-colors data-[on=true]:bg-teal-600"
            data-on={annual}
            aria-label="Basculer entre mensuel et annuel"
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
                annual ? "left-6" : "left-0.5"
              )}
            />
          </button>
          <span
            className={cn(
              "text-sm font-medium transition-colors",
              annual ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Annuel
          </span>
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            -20%
          </Badge>
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3"
        >
          {PLANS.map((plan, i) => {
            const monthlyPrice = annual
              ? Math.round(plan.price * 0.8)
              : plan.price;
            const isPopular = plan.popular;
            return (
              <motion.div
                key={plan.id}
                variants={fadeUp}
                custom={i}
                className={cn(
                  "relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all",
                  isPopular
                    ? "border-teal-500 shadow-xl shadow-teal-500/10 lg:-translate-y-3 lg:scale-[1.03]"
                    : "border-border/60 hover:border-teal-300 dark:hover:border-teal-800"
                )}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-teal-600 px-3 py-1 text-white shadow-md">
                      <Sparkles className="h-3 w-3" />
                      Le plus populaire
                    </Badge>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-xl font-bold tracking-tight">
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plan.tagline}
                  </p>
                </div>

                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tight">
                    {formatFCFA(monthlyPrice)}
                  </span>
                  <span className="text-sm text-muted-foreground">/mois</span>
                </div>

                <Button
                  onClick={onEnter}
                  variant={isPopular ? "default" : "outline"}
                  className={
                    isPopular
                      ? "w-full bg-teal-600 hover:bg-teal-700"
                      : "w-full"
                  }
                >
                  Choisir {plan.name}
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <ul className="mt-6 space-y-3 border-t border-border/60 pt-6">
                  {plan.features.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm">
                      <Check
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          isPopular ? "text-teal-600" : "text-emerald-600"
                        )}
                      />
                      <span className="text-foreground/90">{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </motion.div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Tous les plans incluent l'hébergement africain, la conformité Loi
          2013-450 et le support en français.
        </p>
      </div>
    </section>
  );
}

// ============================================================
// Conformité & sécurité
// ============================================================
function Compliance() {
  return (
    <section id="conformite" className="bg-muted/40 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Conformité & sécurité"
          title="Vos données restent en Afrique, protégées par la loi ivoirienne"
          description="MediSaaS CI applique les exigences de la Loi n°2013-450 et les standards internationaux de sécurité."
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {COMPLIANCE.map((c, i) => (
            <motion.div
              key={c.title}
              variants={fadeUp}
              custom={i}
              className="rounded-2xl border border-border/60 bg-card p-6 text-center"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/20">
                <c.icon className="h-7 w-7" />
              </div>
              <h3 className="text-base font-semibold tracking-tight">
                {c.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================
// CTA final
// ============================================================
function FinalCTA({ onEnter }: { onEnter: () => void }) {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-emerald-600 to-emerald-700 px-6 py-16 text-center shadow-2xl shadow-teal-500/30 sm:px-12 sm:py-20"
        >
          {/* Décor */}
          <div className="pointer-events-none absolute inset-0 medical-grid opacity-20" />
          <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-orange-400/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-teal-300/30 blur-3xl" />

          <div className="relative">
            <h2 className="mx-auto max-w-3xl text-3xl font-extrabold tracking-tight text-white text-balance sm:text-4xl lg:text-5xl">
              Prêt à digitaliser votre cabinet médical ?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-teal-50 sm:text-lg">
              Rejoignez les cliniques d'Abidjan, Cocody, Yopougon et de toute
              la Côte d'Ivoire qui ont choisi la gestion moderne. Essai
              gratuit, sans carte bancaire.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={onEnter}
                className="h-12 bg-white text-base text-teal-700 shadow-lg hover:bg-teal-50"
              >
                <Rocket className="h-5 w-5" />
                Démarrer gratuitement
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 border-white/40 bg-white/10 text-base text-white backdrop-blur hover:bg-white/20 hover:text-white"
              >
                <a href="#contact">
                  Contacter l'équipe
                  <ArrowUpRight className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================
// Footer sticky
// ============================================================
function Footer() {
  const year = new Date().getFullYear();
  const cols = [
    {
      title: "Produit",
      links: [
        { label: "Modules", href: "#modules" },
        { label: "Tarifs", href: "#tarifs" },
        { label: "Téléconsultation", href: "#modules" },
        { label: "Mobile Money", href: "#modules" },
        { label: "Portail patient", href: "#modules" },
      ],
    },
    {
      title: "Ressources",
      links: [
        { label: "Documentation", href: "#" },
        { label: "Guide d'onboarding", href: "#etapes" },
        { label: "API & intégrations", href: "#" },
        { label: "Statut plateforme", href: "#" },
        { label: "Blog médical", href: "#" },
      ],
    },
    {
      title: "Entreprise",
      links: [
        { label: "À propos", href: "#" },
        { label: "Nos clients", href: "#" },
        { label: "Carrières", href: "#" },
        { label: "Partenaires", href: "#" },
        { label: "Presse", href: "#" },
      ],
    },
    {
      title: "Légal",
      links: [
        { label: "Conformité Loi 2013-450", href: "#conformite" },
        { label: "Politique de confidentialité", href: "#" },
        { label: "Conditions générales", href: "#" },
        { label: "Mentions légales", href: "#" },
        { label: "RGPD & ARTCI", href: "#conformite" },
      ],
    },
  ];

  return (
    <footer
      id="contact"
      className="mt-auto border-t border-border/60 bg-muted/40"
    >
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
          {/* Brand + contact */}
          <div className="col-span-2">
            <Brand size="md" />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              La plateforme SaaS de gestion médicale conçue en Côte d'Ivoire,
              pour les cabinets et cliniques d'Abidjan et de toute l'Afrique
              de l'Ouest.
            </p>
            <div className="mt-5 space-y-2 text-sm">
              <a
                href={`tel:${TENANT.phone}`}
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Phone className="h-4 w-4 text-teal-600" />
                {TENANT.phone}
              </a>
              <a
                href={`mailto:${TENANT.email}`}
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Mail className="h-4 w-4 text-teal-600" />
                {TENANT.email}
              </a>
              <p className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-teal-600" />
                {TENANT.address}
              </p>
            </div>
          </div>

          {/* Colonnes de liens */}
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold tracking-tight">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border/60 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            © {year} MediSaaS CI — Conforme à la Loi ivoirienne n°2013-450.
            Tous droits réservés.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Globe2 className="h-3.5 w-3.5 text-teal-600" />
              Hébergé en af-south-1
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-emerald-600" />
              Backups quotidiens
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-orange-500" />
              Chiffrement AES-256
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============================================================
// Heading de section réutilisable
// ============================================================
function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="mx-auto max-w-3xl text-center"
    >
      <span className="inline-block rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
        {eyebrow}
      </span>
      <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base text-muted-foreground text-pretty sm:text-lg">
        {description}
      </p>
    </motion.div>
  );
}
