import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MediSaaS CI — Gestion médicale tout-en-un pour la Côte d'Ivoire",
  description:
    "Plateforme SaaS de gestion médicale pour cabinets et cliniques en Côte d'Ivoire : rendez-vous, dossiers patients, ordonnances, paiement Mobile Money, téléconsultation. Conforme à la Loi n°2013-450.",
  keywords: [
    "MediSaaS CI", "logiciel médical Côte d'Ivoire", "gestion cabinet médical Abidjan",
    "Mobile Money santé", "téléconsultation CI", "ordonnance électronique",
    "dossier patient numérique", "Orange Money", "Wave", "MTN Money", "FCFA",
  ],
  authors: [{ name: "MediSaaS CI" }],
  openGraph: {
    title: "MediSaaS CI — Gestion médicale tout-en-un",
    description: "La plateforme médicale pensée pour la Côte d'Ivoire.",
    type: "website",
    locale: "fr_FR",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d9488",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="top-right" richColors />
      </body>
    </html>
  );
}
