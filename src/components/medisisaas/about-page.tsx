"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  Lock,
  Lightbulb,
  HandHeart,
  Target,
  Eye,
  HeartPulse,
  Globe2,
  Server,
  Clock,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Brand } from "@/components/medisisaas/brand";

// ============================================================
// Constantes — Designer & contacts
// ============================================================
const DESIGNER = {
  name: "Romain OGOU",
  initials: "RO",
  email: "ogouromain@gmail.com",
  phone: "+225 05 76 10 32 77",
  whatsapp: "https://wa.me/2250576103277",
  role: "Fondateur · Concepteur & Lead Developer",
  bio: "Ingénieur logiciel ivoirien passionné par la transformation digitale du secteur santé en Afrique de l'Ouest. Romain conçoit OgouMEDICAL comme une infrastructure numérique souveraine, conforme aux exigences réglementaires ivoiriennes (Loi 2013-450 / ARTCI) et pensée pour les réalités du terrain : connectivité mobile, paiements Mobile Money, collaboration multi-cabinets.",
};

const WHATSAPP_LINK = "https://wa.me/2250576103277";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

// ============================================================
// Header sticky
// ============================================================
function AboutHeader() {
  const exitToLanding = useAppStore((s) => s.exitToLanding);
  const showLegal = useAppStore((s) => s.showLegal);
  const showStatus = useAppStore((s) => s.showStatus);
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          onClick={exitToLanding}
          className="inline-flex items-center gap-2 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Retour à l'accueil"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Accueil</span>
        </button>
        <Brand size="sm" />
        <nav className="hidden items-center gap-1 md:flex">
          <Button variant="ghost" size="sm" onClick={showStatus}>
            Statut
          </Button>
          <Button variant="ghost" size="sm" onClick={showLegal}>
            Légal
          </Button>
          <Button
            size="sm"
            className="bg-sky-600 text-white hover:bg-sky-700"
            onClick={() => useAppStore.getState().enterDashboard("admin_cabinet")}
          >
            Démarrer
          </Button>
        </nav>
        <Button
          size="sm"
          className="bg-sky-600 text-white hover:bg-sky-700 md:hidden"
          onClick={() => useAppStore.getState().enterDashboard("admin_cabinet")}
        >
          Démarrer
        </Button>
      </div>
    </header>
  );
}

// ============================================================
// Hero
// ============================================================
function AboutHero() {
  const enterDashboard = useAppStore((s) => s.enterDashboard);
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sky-50 via-white to-white dark:from-sky-950/30 dark:via-background dark:to-background">
      <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.12),transparent_45%),radial-gradient(circle_at_80%_15%,rgba(245,158,11,0.10),transparent_40%)]" />
      <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
        >
          <Sparkles className="h-3.5 w-3.5" />
          À propos d'OgouMEDICAL
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="mt-6 text-balance text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
        >
          OgouMEDICAL
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="mt-4 text-balance bg-gradient-to-r from-sky-600 via-sky-500 to-orange-500 bg-clip-text text-xl font-semibold text-transparent sm:text-2xl"
        >
          La santé numérique, au cœur de l'Afrique.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18 }}
          className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg"
        >
          Une plateforme SaaS de gestion médicale conçue en Côte d'Ivoire,
          hébergée en Afrique (AWS af-south-1), conforme à la Loi 2013-450 et
          pensée pour les cabinets et cliniques de l'UEMOA.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.24 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button
            size="lg"
            className="w-full bg-sky-600 text-white hover:bg-sky-700 sm:w-auto"
            onClick={() => enterDashboard("admin_cabinet")}
          >
            Démarrer gratuitement
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-700 sm:w-auto"
            asChild
          >
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" />
              Contacter Romain OGOU
            </a>
          </Button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.32 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-2"
        >
          <Badge variant="secondary" className="gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
            Loi 2013-450
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <Globe2 className="h-3.5 w-3.5 text-sky-600" />
            AWS af-south-1
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <Lock className="h-3.5 w-3.5 text-orange-500" />
            Chiffrement AES-256
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <Server className="h-3.5 w-3.5 text-sky-600" />
            ARTCI conforme
          </Badge>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================
// Section concepteur
// ============================================================
function DesignerSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="mx-auto max-w-2xl text-center"
      >
        <span className="inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
          Le concepteur
        </span>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Conçu par un ingénieur ivoirien, pour l'Afrique
        </h2>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          Romain OGOU pilotera votre onboarding et reste joignable directement
          pour tout cabinet de santé qui souhaite digitaliser son activité.
        </p>
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="mx-auto mt-10 max-w-4xl"
      >
        <Card className="overflow-hidden border-sky-200/60 shadow-lg shadow-sky-500/5 dark:border-sky-900/40">
          <CardHeader className="gap-1 bg-gradient-to-br from-sky-50 to-white pb-6 dark:from-sky-950/30 dark:to-background">
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <Avatar className="h-20 w-20 border-4 border-white bg-gradient-to-br from-sky-500 to-sky-700 text-xl font-bold text-white shadow-lg shadow-sky-500/30">
                <AvatarFallback className="bg-gradient-to-br from-sky-500 to-sky-700 text-xl font-bold text-white">
                  {DESIGNER.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-2xl">{DESIGNER.name}</CardTitle>
                <CardDescription className="mt-1 text-sm font-medium text-sky-600 dark:text-sky-400">
                  {DESIGNER.role}
                </CardDescription>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1.5 border-sky-300/60 text-sky-700 dark:text-sky-300">
                    <Mail className="h-3 w-3" />
                    {DESIGNER.email}
                  </Badge>
                  <Badge variant="outline" className="gap-1.5 border-orange-300/60 text-orange-700 dark:text-orange-300">
                    <Phone className="h-3 w-3" />
                    {DESIGNER.phone}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
              {DESIGNER.bio}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button
                className="bg-[#25D366] text-white hover:bg-[#1ebe5b]"
                asChild
              >
                <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Discuter sur WhatsApp
                </a>
              </Button>
              <Button
                variant="outline"
                className="border-sky-300 text-sky-700 hover:bg-sky-50 hover:text-sky-800 dark:border-sky-800 dark:text-sky-300 dark:hover:bg-sky-950/40"
                asChild
              >
                <a href={`mailto:${DESIGNER.email}`}>
                  <Mail className="mr-2 h-4 w-4" />
                  Envoyer un email
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
}

// ============================================================
// Mission / Vision / Valeurs
// ============================================================
function PillarsSection() {
  const pillars = [
    {
      icon: Target,
      title: "Mission",
      color: "sky",
      description:
        "Numériser la santé privée ivoirienne en dotant cabinets et cliniques d'un outil unique pour gérer patients, rendez-vous, ordonnances, factures Mobile Money et téléconsultations — sans dépendre d'outils étrangers non conformes.",
    },
    {
      icon: Eye,
      title: "Vision",
      color: "orange",
      description:
        "Devenir l'infrastructure digitale de référence pour la santé privée de l'UEMOA, interopérable entre établissements, sécurisée et souveraine — posée sur des centres de données africains (AWS af-south-1).",
    },
    {
      icon: HeartPulse,
      title: "Valeurs",
      color: "sky",
      description:
        "Accessibilité (interface FR, compatible mobile), Confidentialité (AES-256, Loi 2013-450), Innovation (Mobile Money, téléconsultation, SMS/WhatsApp) et Proximité (support local par Romain OGOU).",
      tags: [
        { label: "Accessibilité", icon: HandHeart },
        { label: "Confidentialité", icon: Lock },
        { label: "Innovation", icon: Lightbulb },
        { label: "Proximité", icon: MessageCircle },
      ],
    },
  ];

  return (
    <section className="bg-muted/30 border-y border-border/60">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
            Notre raison d'être
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Mission, Vision & Valeurs
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Une boussole claire guidant chaque ligne de code et chaque décision
            produit.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            const isOrange = p.color === "orange";
            return (
              <motion.div
                key={p.title}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
              >
                <Card className="h-full border-border/60 transition-shadow hover:shadow-lg hover:shadow-sky-500/5">
                  <CardHeader>
                    <div
                      className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${
                        isOrange
                          ? "bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300"
                          : "bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="mt-4 text-xl">{p.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {p.description}
                    </p>
                    {"tags" in p && p.tags && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {p.tags.map((tag) => {
                          const TIcon = tag.icon;
                          return (
                            <Badge
                              key={tag.label}
                              variant="secondary"
                              className="gap-1.5 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
                            >
                              <TIcon className="h-3 w-3" />
                              {tag.label}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Section support
// ============================================================
function SupportSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <Card className="overflow-hidden border-sky-200/60 bg-gradient-to-br from-sky-50 via-white to-orange-50 shadow-lg shadow-sky-500/5 dark:border-sky-900/40 dark:from-sky-950/30 dark:via-background dark:to-orange-950/20">
          <CardContent className="grid gap-8 p-8 sm:p-10 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
                Support
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Besoin d'aide ?
              </h2>
              <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                Romain OGOU vous accompagne personnellement : choix du plan,
                onboarding du cabinet, formation des équipes, intégrations Mobile
                Money et téléconsultation. Réponse rapide, en français, sur le
                canal de votre choix.
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 text-sky-600" />
                Disponibilité : <span className="font-medium text-foreground">Lun–Ven · 8h–18h (GMT)</span>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                size="lg"
                className="bg-[#25D366] text-white hover:bg-[#1ebe5b]"
                asChild
              >
                <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp
                </a>
              </Button>
              <Button
                size="lg"
                className="bg-sky-600 text-white hover:bg-sky-700"
                asChild
              >
                <a href={`mailto:${DESIGNER.email}`}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </a>
              </Button>
              <div className="sm:col-span-2 mt-1 rounded-lg border border-border/60 bg-background/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Contact direct
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-medium">{DESIGNER.name}</span>
                  <span className="text-muted-foreground">{DESIGNER.phone}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">{DESIGNER.email}</span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-sky-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Réponse &lt; 2h ouvrées
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
}

// ============================================================
// Footer
// ============================================================
function AboutFooter() {
  const year = new Date().getFullYear();
  const showAbout = useAppStore((s) => s.showAbout);
  const showLegal = useAppStore((s) => s.showLegal);
  const showStatus = useAppStore((s) => s.showStatus);
  const exitToLanding = useAppStore((s) => s.exitToLanding);
  return (
    <footer className="mt-auto border-t border-border/60 bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <Brand size="md" />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              La santé numérique, au cœur de l'Afrique. Plateforme SaaS de
              gestion médicale conçue par Romain OGOU en Côte d'Ivoire.
            </p>
            <div className="mt-4 space-y-1.5 text-sm">
              <a
                href={`mailto:${DESIGNER.email}`}
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Mail className="h-4 w-4 text-sky-600" />
                {DESIGNER.email}
              </a>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <MessageCircle className="h-4 w-4 text-[#25D366]" />
                {DESIGNER.phone}
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold tracking-tight">Navigation</h4>
            <ul className="mt-4 space-y-2.5">
              <li>
                <button
                  onClick={exitToLanding}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Accueil
                </button>
              </li>
              <li>
                <button
                  onClick={showAbout}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  À propos
                </button>
              </li>
              <li>
                <button
                  onClick={showStatus}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Statut plateforme
                </button>
              </li>
              <li>
                <button
                  onClick={() => useAppStore.getState().enterDashboard("admin_cabinet")}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Plateforme
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold tracking-tight">Légal & support</h4>
            <ul className="mt-4 space-y-2.5">
              <li>
                <button
                  onClick={showLegal}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  CGU
                </button>
              </li>
              <li>
                <button
                  onClick={showLegal}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Politique de confidentialité
                </button>
              </li>
              <li>
                <button
                  onClick={showLegal}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Mentions légales
                </button>
              </li>
              <li>
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Support
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-border/60 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            © {year} OgouMEDICAL — Conçu par Romain OGOU. Conforme à la Loi
            ivoirienne n°2013-450. Tous droits réservés.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
              ARTCI conforme
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Globe2 className="h-3.5 w-3.5 text-sky-600" />
              AWS af-south-1
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-orange-500" />
              AES-256
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============================================================
// Page À propos — assemblage
// ============================================================
export function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AboutHeader />
      <main className="flex-1">
        <AboutHero />
        <DesignerSection />
        <PillarsSection />
        <SupportSection />
      </main>
      <AboutFooter />
    </div>
  );
}
