"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  FileText,
  Globe2,
  Server,
  Mail,
  MessageCircle,
  Scale,
  UserCheck,
  Database,
  KeyRound,
  Clock,
  FileSignature,
  Building2,
  Cpu,
  Handshake,
} from "lucide-react";

import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brand } from "@/components/medisisaas/brand";

const DESIGNER = {
  name: "Romain OGOU",
  email: "ogouromain@gmail.com",
  phone: "+225 05 76 10 32 77",
  whatsapp: "https://wa.me/2250576103277",
  role: "Éditeur · Fondateur & Lead Developer",
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

// ============================================================
// Header
// ============================================================
function LegalHeader() {
  const exitToLanding = useAppStore((s) => s.exitToLanding);
  const showAbout = useAppStore((s) => s.showAbout);
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
          <Button variant="ghost" size="sm" onClick={showAbout}>
            À propos
          </Button>
          <Button variant="ghost" size="sm" onClick={showStatus}>
            Statut
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
function LegalHero() {
  return (
    <section className="border-b border-border/60 bg-gradient-to-b from-sky-50 to-background dark:from-sky-950/30 dark:to-background">
      <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
          <Scale className="h-3.5 w-3.5" />
          Cadre légal & conformité
        </span>
        <h1 className="mt-5 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
          Mentions légales & politique de confidentialité
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
          OgouMEDICAL s'engage à protéger les données de santé de ses utilisateurs
          conformément à la Loi ivoirienne n°2013-450 et aux exigences de l'ARTCI.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
            Loi 2013-450
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <Globe2 className="h-3.5 w-3.5 text-sky-600" />
            ARTCI
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <Lock className="h-3.5 w-3.5 text-orange-500" />
            AES-256
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <Server className="h-3.5 w-3.5 text-sky-600" />
            AWS af-south-1
          </Badge>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>
    </section>
  );
}

// ============================================================
// Section générique réutilisable
// ============================================================
function LegalSection({
  index,
  icon: Icon,
  title,
  children,
}: {
  index: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      className="scroll-mt-24"
    >
      <div className="flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold tracking-tight">
          <span className="mr-2 text-sky-600">{index}</span>
          {title}
        </h3>
      </div>
      <div className="mt-3 space-y-3 pl-[52px] text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
        {children}
      </div>
    </motion.section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-pretty">{children}</p>;
}

function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-1.5 pl-5">{children}</ul>;
}

// ============================================================
// Onglet CGU (8 sections)
// ============================================================
function CguTab() {
  return (
    <div className="space-y-10">
      <LegalSection index="1" icon={FileText} title="Définitions">
        <P>
          <strong className="text-foreground">OgouMEDICAL</strong> (ci-après « la
          Plateforme ») désigne le logiciel SaaS de gestion médicale édité par
          Romain OGOU. <strong className="text-foreground">Utilisateur</strong>{" "}
          désigne toute personne (médecin, secrétaire, administrateur, comptable,
          patient) accédant à la Plateforme. <strong className="text-foreground">
          Cabinet client
          </strong> désigne la structure de santé (cabinet, clinique) ayant
          souscrit un abonnement.
        </P>
      </LegalSection>

      <LegalSection index="2" icon={FileSignature} title="Objet">
        <P>
          Les présentes Conditions Générales d'Utilisation (CGU) encadrent
          l'utilisation de la Plateforme OgouMEDICAL par ses Utilisateurs. Elles
          complètent les Conditions Générales d'Abonnement souscrites par le
          Cabinet client. L'inscription ou la connexion vaut acceptation pleine
          et entière des CGU.
        </P>
      </LegalSection>

      <LegalSection index="3" icon={UserCheck} title="Accès à la Plateforme">
        <P>
          L'accès à la Plateforme est réservé aux Utilisateurs ayant reçu des
          identifiants de la part du Cabinet client ou ayant complété une
          inscription individuelle (portail patient via OTP SMS).
        </P>
        <UL>
          <li>Accès sécurisé par identifiant / mot de passe ou OTP téléphone.</li>
          <li>Chaque Utilisateur est responsable de la confidentialité de ses identifiants.</li>
          <li>L'accès est disponible 24h/24 sous réserve de maintenance planifiée communiquée via la page Statut.</li>
          <li>Compatibilité : navigateurs modernes (Chrome, Edge, Firefox, Safari) et terminaux mobiles.</li>
        </UL>
      </LegalSection>

      <LegalSection index="4" icon={Server} title="Abonnements & facturation">
        <P>
          La Plateforme est commercialisée sous forme d'abonnements mensuels ou
          annuels (Essentiel, Professionnel, Établissement). Les paiements sont
          effectués via Mobile Money (Orange Money, Wave, MTN Money) ou carte
          bancaire, en Francs CFA (XOF).
        </P>
        <UL>
          <li>Essai gratuit de 14 jours, sans engagement de carte.</li>
          <li>Facturation automatique à la fin de la période d'essai.</li>
          <li>Résiliation possible à tout moment depuis l'espace abonnement.</li>
          <li>TVA non applicable (Côte d'Ivoire — franchise en base).</li>
        </UL>
      </LegalSection>

      <LegalSection index="5" icon={ShieldCheck} title="Responsabilités">
        <P>
          OgouMEDICAL met à disposition un outil de gestion. L'Éditeur ne fournit
          pas d'acte médical et ne se substitue pas au praticien dans ses
          décisions cliniques. Le Cabinet client reste responsable de la
          qualité des données saisies et du respect du secret médical.
        </P>
        <UL>
          <li>L'Éditeur s'engage à un taux de disponibilité ≥ 99,9 % (voir Statut).</li>
          <li>L'Éditeur n'est pas responsable des pannes de réseaux mobiles ou d'opérateurs tiers (Mobile Money, SMS, WhatsApp).</li>
          <li>Le Cabinet client garantit disposer des autorisations nécessaires pour traiter les données de ses patients.</li>
        </UL>
      </LegalSection>

      <LegalSection index="6" icon={Scale} title="Résiliation">
        <P>
          Chaque partie peut résilier l'abonnement à tout moment depuis
          l'interface de gestion. La résiliation prend effet à la fin de la
          période payante en cours. Les données du Cabinet client sont
          conservées 90 jours puis supprimées, sauf conservation légale
          (10 ans pour les dossiers médicaux — Loi 2013-450).
        </P>
      </LegalSection>

      <LegalSection index="7" icon={Lock} title="Propriété intellectuelle">
        <P>
          La Plateforme (code, design, marque « OgouMEDICAL », logo, contenus
          éditoriaux) est la propriété exclusive de Romain OGOU. Les données
          saisies par le Cabinet client (patients, RDV, ordonnances, factures)
          lui appartiennent en propre. Aucun transfert de propriété du logiciel
          n'est consenti par l'abonnement.
        </P>
      </LegalSection>

      <LegalSection index="8" icon={Mail} title="Contact">
        <P>
          Pour toute question relative aux CGU : Romain OGOU,{" "}
          <a
            className="font-medium text-sky-600 underline-offset-2 hover:underline"
            href={`mailto:${DESIGNER.email}`}
          >
            {DESIGNER.email}
          </a>{" "}
          · WhatsApp{" "}
          <a
            className="font-medium text-sky-600 underline-offset-2 hover:underline"
            href={DESIGNER.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
          >
            {DESIGNER.phone}
          </a>
          .
        </P>
      </LegalSection>
    </div>
  );
}

// ============================================================
// Onglet Confidentialité
// ============================================================
function PrivacyTab() {
  return (
    <div className="space-y-10">
      <LegalSection index="1" icon={ShieldCheck} title="Cadre légal — Loi n°2013-450">
        <P>
          OgouMEDICAL traite les données de santé dans le respect de la{" "}
          <strong className="text-foreground">
            Loi ivoirienne n°2013-450 du 14 août 2013
          </strong>{" "}
          relative à la protection des données personnelles, sous le contrôle de
          l'<strong className="text-foreground">ARTCI</strong> (Autorité de
          Régulation des Télécommunications de Côte d'Ivoire). Le responsable de
          traitement est Romain OGOU, éditeur de la Plateforme.
        </P>
      </LegalSection>

      <LegalSection index="2" icon={Database} title="Données collectées">
        <P>
          La Plateforme traite les catégories de données suivantes, strictement
          nécessaires à la gestion médicale :
        </P>
        <UL>
          <li><strong className="text-foreground">Identité patient</strong> : nom, prénom, date de naissance, sexe, adresse, téléphone, numéro d'assurance.</li>
          <li><strong className="text-foreground">Données de santé</strong> : antécédents, allergies, consultations, diagnostics (CIM-10), ordonnances, résultats d'examens.</li>
          <li><strong className="text-foreground">Données de paiement</strong> : factures, paiements Mobile Money (références transaction, montant, opérateur).</li>
          <li><strong className="text-foreground">Données d'usage</strong> : journaux d'audit (AuditLog), adresses IP, identifiants de session.</li>
        </UL>
      </LegalSection>

      <LegalSection index="3" icon={KeyRound} title="Sécurité — chiffrement AES-256">
        <P>
          Toutes les données sensibles sont chiffrées au repos (AES-256) et en
          transit (TLS 1.3). Les mots de passe sont hachés (bcrypt). L'accès aux
          données est strictement encadré par rôles (RBAC) :
          super_admin, admin_cabinet, medecin, secretaire, comptable, patient.
        </P>
        <UL>
          <li>Hébergement AWS af-south-1 (Le Cap, Afrique du Sud) — souveraineté africaine.</li>
          <li>Backups quotidiens chiffrés, rétention 30 jours.</li>
          <li>Journalisation complète des accès (AuditLog) consultable par l'administrateur du cabinet.</li>
          <li>Tests d'intrusion réguliers et revue de code systématique.</li>
        </UL>
      </LegalSection>

      <LegalSection index="4" icon={UserCheck} title="Droits des patients">
        <P>
          Conformément à la Loi 2013-450, chaque patient dispose des droits
          suivants sur ses données personnelles :
        </P>
        <UL>
          <li><strong className="text-foreground">Droit d'accès</strong> : consulter les données le concernant.</li>
          <li><strong className="text-foreground">Droit de rectification</strong> : corriger toute information inexacte.</li>
          <li><strong className="text-foreground">Droit d'opposition</strong> : s'opposer au traitement pour motif légitime.</li>
          <li><strong className="text-foreground">Droit à l'effacement</strong> : sous réserve des obligations de conservation légale.</li>
          <li><strong className="text-foreground">Droit à la portabilité</strong> : export des données au format structuré (JSON, CSV).</li>
        </UL>
        <P>
          Pour exercer ces droits, le patient contacte son Cabinet qui transmet
          à l'Éditeur, ou directement Romain OGOU via les coordonnées ci-dessous.
        </P>
      </LegalSection>

      <LegalSection index="5" icon={Clock} title="Conservation — 10 ans">
        <P>
          Conformément aux obligations légales applicables aux dossiers médicaux
          en Côte d'Ivoire, les données de santé sont conservées{" "}
          <strong className="text-foreground">10 ans</strong> après la dernière
          consultation. Les données de facturation sont conservées 10 ans
          (obligations comptables). Les journaux d'audit sont conservés 3 ans.
          Au-delà, les données sont supprimées définitivement (purge sécurisée).
        </P>
      </LegalSection>

      <LegalSection index="6" icon={Mail} title="Contact & réclamations">
        <P>
          Pour toute question relative à la protection des données : Romain
          OGOU, {" "}
          <a
            className="font-medium text-sky-600 underline-offset-2 hover:underline"
            href={`mailto:${DESIGNER.email}`}
          >
            {DESIGNER.email}
          </a>{" "}
          · WhatsApp{" "}
          <a
            className="font-medium text-sky-600 underline-offset-2 hover:underline"
            href={DESIGNER.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
          >
            {DESIGNER.phone}
          </a>
          . En l'absence de réponse satisfaisante sous 30 jours, une réclamation
          peut être adressée à l'ARTCI.
        </P>
      </LegalSection>
    </div>
  );
}

// ============================================================
// Onglet Mentions légales
// ============================================================
function LegalNoticesTab() {
  return (
    <div className="space-y-10">
      <LegalSection index="1" icon={Building2} title="Éditeur de la Plateforme">
        <P>
          OgouMEDICAL est édité par <strong className="text-foreground">Romain OGOU</strong>,
          entrepreneur individuel ivoirien, en qualité de fondateur et Lead
          Developer.
        </P>
        <UL>
          <li><strong className="text-foreground">Nom</strong> : Romain OGOU</li>
          <li><strong className="text-foreground">Rôle</strong> : {DESIGNER.role}</li>
          <li><strong className="text-foreground">Email</strong> : {DESIGNER.email}</li>
          <li><strong className="text-foreground">Téléphone / WhatsApp</strong> : {DESIGNER.phone}</li>
          <li><strong className="text-foreground">Pays</strong> : Côte d'Ivoire</li>
        </UL>
      </LegalSection>

      <LegalSection index="2" icon={Server} title="Hébergement — AWS af-south-1">
        <P>
          La Plateforme est hébergée sur l'infrastructure Amazon Web Services
          (AWS), région <strong className="text-foreground">af-south-1</strong>{" "}
          (Le Cap, Afrique du Sud), garantissant la souveraineté africaine des
          données de santé traitées.
        </P>
        <UL>
          <li>Compute : Next.js 16 (Node.js) sur infrastructure managée.</li>
          <li>Base de données : Supabase (PostgreSQL) avec réplication.</li>
          <li>Stockage fichiers : S3 avec chiffrement AES-256 au repos.</li>
          <li>CDN : CloudFront pour la distribution des assets statiques.</li>
        </UL>
      </LegalSection>

      <LegalSection index="3" icon={ShieldCheck} title="Conformité ARTCI">
        <P>
          OgouMEDICAL est conforme aux exigences de l'{" "}
          <strong className="text-foreground">ARTCI</strong> (Autorité de
          Régulation des Télécommunications de Côte d'Ivoire) en matière de
          protection des données personnelles, dans le cadre de la Loi
          n°2013-450. Les déclarations réglementaires nécessaires ont été
          effectuées auprès de l'autorité.
        </P>
      </LegalSection>

      <LegalSection index="4" icon={Handshake} title="Partenaires & sous-traitants">
        <P>
          OgouMEDICAL s'appuie sur des partenaires techniques de confiance,
          chacun dans le respect de la Loi 2013-450 :
        </P>
        <UL>
          <li><strong className="text-foreground">Mobile Money</strong> : Orange Money, Wave, MTN Money (paiements).</li>
          <li><strong className="text-foreground">SMS / OTP</strong> : Africa's Talking (notifications rendez-vous).</li>
          <li><strong className="text-foreground">WhatsApp Business API</strong> : Meta (rappels, support).</li>
          <li><strong className="text-foreground">Téléconsultation vidéo</strong> : Daily.co.</li>
          <li><strong className="text-foreground">Email transactionnel</strong> : service SMTP managé.</li>
        </UL>
        <P>
          Aucune donnée de santé identifiée n'est transférée à ces partenaires
          au-delà du strict nécessaire à la prestation (numéro de téléphone pour
          SMS, référence de paiement pour Mobile Money).
        </P>
      </LegalSection>

      <LegalSection index="5" icon={Cpu} title="Propriété intellectuelle">
        <P>
          La marque « OgouMEDICAL », le logo, le code source et les contenus
          éditoriaux de la Plateforme sont la propriété exclusive de Romain
          OGOU. Toute reproduction, représentation ou diffusion, totale ou
          partielle, sans autorisation écrite préalable, est interdite.
        </P>
      </LegalSection>

      <LegalSection index="6" icon={Mail} title="Contact">
        <P>
          Pour toute demande relative aux présentes mentions légales : Romain
          OGOU — {" "}
          <a
            className="font-medium text-sky-600 underline-offset-2 hover:underline"
            href={`mailto:${DESIGNER.email}`}
          >
            {DESIGNER.email}
          </a>{" "}
          · WhatsApp{" "}
          <a
            className="font-medium text-sky-600 underline-offset-2 hover:underline"
            href={DESIGNER.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
          >
            {DESIGNER.phone}
          </a>
          .
        </P>
      </LegalSection>
    </div>
  );
}

// ============================================================
// Footer
// ============================================================
function LegalFooter() {
  const year = new Date().getFullYear();
  const showAbout = useAppStore((s) => s.showAbout);
  const showStatus = useAppStore((s) => s.showStatus);
  const exitToLanding = useAppStore((s) => s.exitToLanding);
  return (
    <footer className="mt-auto border-t border-border/60 bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Brand size="sm" />
            <p className="mt-2 text-xs text-muted-foreground">
              © {year} OgouMEDICAL — Conçu par Romain OGOU. Conforme à la Loi
              ivoirienne n°2013-450.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <button onClick={exitToLanding} className="transition-colors hover:text-foreground">
              Accueil
            </button>
            <button onClick={showAbout} className="transition-colors hover:text-foreground">
              À propos
            </button>
            <button onClick={showStatus} className="transition-colors hover:text-foreground">
              Statut
            </button>
            <a
              href={DESIGNER.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============================================================
// Page Légale — assemblage
// ============================================================
export function LegalPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <LegalHeader />
      <main className="flex-1">
        <LegalHero />
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <Tabs defaultValue="cgu" className="gap-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="cgu">CGU</TabsTrigger>
              <TabsTrigger value="confidentialite">Confidentialité</TabsTrigger>
              <TabsTrigger value="mentions">Mentions légales</TabsTrigger>
            </TabsList>
            <TabsContent value="cgu" className="mt-8">
              <Card className="border-border/60">
                <CardContent className="p-6 sm:p-8">
                  <CguTab />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="confidentialite" className="mt-8">
              <Card className="border-border/60">
                <CardContent className="p-6 sm:p-8">
                  <PrivacyTab />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="mentions" className="mt-8">
              <Card className="border-border/60">
                <CardContent className="p-6 sm:p-8">
                  <LegalNoticesTab />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <LegalFooter />
    </div>
  );
}
