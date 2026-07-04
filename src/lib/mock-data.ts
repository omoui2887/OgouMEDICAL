// ============================================================
// MediSaaS CI — Données de démonstration
// Contexte ivoirien : communes d'Abidjan, noms locaux, FCFA
// ============================================================
import type {
  Patient, Doctor, Appointment, Prescription, Invoice, Payment,
  Consultation, Subscription,
} from "./types";

export const TENANT = {
  id: "ten_clinique_plateau",
  name: "OgouMEDICAL",
  slug: "clinique-plateau",
  type: "clinique",
  city: "Abidjan",
  district: "Cocody - Plateau",
  phone: "+225 05 76 10 32 77",
  email: "ogouromain@gmail.com",
  address: "Côte d'Ivoire",
};

const AVATAR_COLORS = [
  "bg-teal-500", "bg-orange-500", "bg-emerald-500", "bg-rose-500",
  "bg-violet-500", "bg-amber-500", "bg-cyan-500", "bg-fuchsia-500",
  "bg-lime-500", "bg-sky-500",
];

export const DOCTORS: Doctor[] = [
  {
    id: "doc_1",
    name: "Dr. Aya Kouassi",
    specialty: "Médecine générale",
    phone: "+225 07 08 12 34 56",
    email: "a.kouassi@clinique-plateau.ci",
    avatarColor: "bg-teal-600",
    licenseNumber: "CI-MG-2018-0431",
    rating: 4.9,
    patientsCount: 1240,
  },
  {
    id: "doc_2",
    name: "Dr. Konan Yao",
    specialty: "Cardiologie",
    phone: "+225 07 09 22 11 88",
    email: "k.yao@clinique-plateau.ci",
    avatarColor: "bg-rose-600",
    licenseNumber: "CI-CARD-2015-0188",
    rating: 4.8,
    patientsCount: 856,
  },
  {
    id: "doc_3",
    name: "Dr. Fatou Traoré",
    specialty: "Pédiatrie",
    phone: "+225 05 64 78 90 12",
    email: "f.traore@clinique-plateau.ci",
    avatarColor: "bg-amber-500",
    licenseNumber: "CI-PED-2019-0512",
    rating: 5.0,
    patientsCount: 1530,
  },
  {
    id: "doc_4",
    name: "Dr. Ibrahim Cissé",
    specialty: "Gynécologie-Obstétrique",
    phone: "+225 01 22 33 44 55",
    email: "i.cisse@clinique-plateau.ci",
    avatarColor: "bg-violet-600",
    licenseNumber: "CI-GYN-2016-0277",
    rating: 4.7,
    patientsCount: 980,
  },
  {
    id: "doc_5",
    name: "Dr. Mariam Bamba",
    specialty: "Dermatologie",
    phone: "+225 07 77 88 99 00",
    email: "m.bamba@clinique-plateau.ci",
    avatarColor: "bg-cyan-600",
    licenseNumber: "CI-DERM-2020-0664",
    rating: 4.9,
    patientsCount: 670,
  },
];

const FIRST_NAMES_M = ["Kouadio", "Konan", "Yao", "Koffi", "Aboubacar", "Ibrahim", "Mamadou", "Adama", "Seydou", "Bakary"];
const FIRST_NAMES_F = ["Aya", "Fatou", "Mariam", "Adjoua", "Aminata", "Awa", "Kadiatou", "Rokia", "Salimata", "Nafi"];
const LAST_NAMES = ["Kouassi", "Yao", "Traoré", "Cissé", "Bamba", "Diallo", "Touré", "Koné", "Coulibaly", "Diabaté", "N'Guessan", "Brou", "Adou", "Tanoh", "Aka", "Gnagne", "Bédié", "Ouattara", "Gbogbo", "Asseu"];
const COMMUNES = ["Cocody", "Plateau", "Yopougon", "Marcory", "Treichville", "Adjamé", "Abobo", "Koumassi", "Port-Bouët", "Attécoubé"];
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const ALLERGIES = ["Pénicilline", "Arachide", "Sulfamides", "Aspirine", "Iode", "Pollen"];
const CHRONIC = ["Hypertension", "Diabète type 2", "Asthme", "Drépanocytose", "Paludisme chronique", "Migraine"];

function pick<T>(arr: T[], i: number): T { return arr[i % arr.length]; }
function name(i: number): { first: string; last: string; gender: "M" | "F" } {
  if (i % 2 === 0) return { first: pick(FIRST_NAMES_F, i), last: pick(LAST_NAMES, i), gender: "F" };
  return { first: pick(FIRST_NAMES_M, i), last: pick(LAST_NAMES, i), gender: "M" };
}

export const PATIENTS: Patient[] = Array.from({ length: 48 }).map((_, i) => {
  const n = name(i);
  const year = 1958 + (i * 7) % 55;
  const month = (i % 12) + 1;
  const day = ((i * 13) % 27) + 1;
  const daysAgo = (i * 3) % 90;
  const lastVisit = new Date(Date.now() - daysAgo * 86400000).toISOString();
  return {
    id: `pat_${i + 1}`,
    code: `CI-CP-${String(i + 1).padStart(4, "0")}`,
    firstName: n.first,
    lastName: n.last,
    gender: n.gender,
    birthDate: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    phone: `+225 0${(i % 7) + 1} ${String(10 + i).padStart(2, "0")} ${String(20 + i).padStart(2, "0")} ${String(30 + i).padStart(2, "0")} ${String(40 + i).padStart(2, "0")}`,
    email: i % 3 === 0 ? `${n.first.toLowerCase()}.${n.last.toLowerCase().replace(/[^a-z]/g, "")}@gmail.com` : undefined,
    address: `Rue ${i + 12}, ${pick(COMMUNES, i)}`,
    commune: pick(COMMUNES, i),
    bloodType: pick(BLOOD_TYPES, i),
    weight: 52 + (i * 3) % 45,
    height: 155 + (i * 2) % 35,
    allergies: i % 4 === 0 ? [pick(ALLERGIES, i)] : [],
    chronicConditions: i % 5 === 0 ? [pick(CHRONIC, i)] : [],
    insuranceProvider: i % 3 === 0 ? "CNPS" : i % 5 === 0 ? "Mutuelle ACI" : undefined,
    insuranceNumber: i % 3 === 0 ? `CNPS-${100000 + i * 137}` : undefined,
    lastVisit,
    status: i % 9 === 0 ? "inactif" : "actif",
    avatarColor: pick(AVATAR_COLORS, i),
  };
});

const REASONS = [
  "Consultation de routine", "Fièvre et maux de tête", "Contrôle tension",
  "Vaccination enfant", "Douleur abdominale", "Consultation prénatale",
  "Suivi diabète", "Migraine persistante", "Toux et rhume", "Bilan de santé",
  "Douleur thoracique", "Éruption cutanée", "Contrôle post-opératoire",
  "Paludisme suspecté", "Fatigue chronique",
];

function todayAt(hour: number, min: number, dayOffset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

const STATUSES: Appointment["status"][] = ["planifie", "confirme", "en_cours", "termine", "annule", "absent"];

export const APPOINTMENTS: Appointment[] = Array.from({ length: 40 }).map((_, i) => {
  const patient = PATIENTS[i % PATIENTS.length];
  const doctor = DOCTORS[i % DOCTORS.length];
  const dayOffset = Math.floor(i / 8) - 2; // -2..+3
  const hour = 8 + Math.floor(i / 2) % 10;
  const min = (i % 2) * 30;
  const d = new Date(todayAt(hour, min, dayOffset));
  let status: Appointment["status"];
  if (dayOffset < 0) status = i % 7 === 0 ? "absent" : "termine";
  else if (dayOffset === 0) status = i % 5 === 0 ? "en_cours" : "confirme";
  else status = i % 3 === 0 ? "confirme" : "planifie";
  return {
    id: `apt_${i + 1}`,
    patientId: patient.id,
    patientName: `${patient.firstName} ${patient.lastName}`,
    patientAvatarColor: patient.avatarColor,
    doctorId: doctor.id,
    doctorName: doctor.name,
    specialty: doctor.specialty,
    date: d.toISOString(),
    time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
    duration: 30,
    reason: pick(REASONS, i),
    type: i % 7 === 0 ? "teleconsultation" : i % 5 === 0 ? "suivi" : i % 11 === 0 ? "urgence" : "consultation",
    status,
    commune: patient.commune,
  };
});

const MEDICATION_NAMES = [
  "Paracétamol 500mg", "Amoxicilline 500mg", "Coartem (Artéméther+Luméfantrine)",
  "Ibuprofène 400mg", "Métronidazole 250mg", "Cotrimoxazole",
  "Oméprazole 20mg", "Amlodipine 5mg", "Metformine 850mg",
  "Sirop antipaludéen", "Sérum de réhydratation orale", "Vitamine C",
];
const DOSAGES = ["1 comprimé", "2 comprimés", "1 cuillère à café", "1/2 comprimé"];
const FREQUENCIES = ["3 fois par jour", "2 fois par jour", "1 fois par jour", "Toutes les 8 heures", "Matin et soir"];
const DURATIONS = ["5 jours", "7 jours", "10 jours", "14 jours", "1 mois", "3 jours"];

export const PRESCRIPTIONS: Prescription[] = Array.from({ length: 24 }).map((_, i) => {
  const patient = PATIENTS[i % PATIENTS.length];
  const doctor = DOCTORS[i % DOCTORS.length];
  const medsCount = 1 + (i % 4);
  const medications = Array.from({ length: medsCount }).map((_, m) => ({
    name: pick(MEDICATION_NAMES, i + m),
    dosage: pick(DOSAGES, i + m),
    frequency: pick(FREQUENCIES, i + m),
    duration: pick(DURATIONS, i + m),
    instructions: m === 0 ? "À prendre après le repas" : undefined,
  }));
  const daysAgo = (i * 4) % 60;
  return {
    id: `rx_${i + 1}`,
    number: `ORD-2024-${String(i + 1).padStart(4, "0")}`,
    patientId: patient.id,
    patientName: `${patient.firstName} ${patient.lastName}`,
    doctorName: doctor.name,
    date: new Date(Date.now() - daysAgo * 86400000).toISOString(),
    medications,
    validityDays: 30,
    status: daysAgo > 30 ? "expiree" : "active",
    notes: i % 3 === 0 ? "Renouvelable une fois" : undefined,
  };
});

const CONSULTATION_SERVICES = [
  { description: "Consultation médecine générale", unitPrice: 10000 },
  { description: "Consultation spécialisée", unitPrice: 25000 },
  { description: "Consultation pédiatrique", unitPrice: 15000 },
  { description: "Électrocardiogramme (ECG)", unitPrice: 20000 },
  { description: "Bilan biologique complet", unitPrice: 35000 },
  { description: "Échographie abdominale", unitPrice: 30000 },
  { description: "Pansement simple", unitPrice: 5000 },
  { description: "Injection intramusculaire", unitPrice: 3000 },
  { description: "Téléconsultation", unitPrice: 12000 },
  { description: "Vaccin antitétanique", unitPrice: 8000 },
  { description: "Test de glycémie", unitPrice: 2000 },
  { description: "Radio thorax", unitPrice: 15000 },
];

export const INVOICES: Invoice[] = Array.from({ length: 30 }).map((_, i) => {
  const patient = PATIENTS[i % PATIENTS.length];
  const itemCount = 1 + (i % 3);
  const items = Array.from({ length: itemCount }).map((_, it) => {
    const svc = pick(CONSULTATION_SERVICES, i + it);
    return {
      description: svc.description,
      quantity: 1 + ((i + it) % 2),
      unitPrice: svc.unitPrice,
    };
  });
  const subtotal = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
  const tax = Math.round(subtotal * 0.18); // TVA 18% Côte d'Ivoire
  const total = subtotal + tax;
  const daysAgo = (i * 2) % 45;
  const methods: Payment["method"][] = ["orange_money", "wave", "mtn_money", "card", "cash"];
  const method = pick(methods, i);
  let status: Invoice["status"];
  let paidAmount: number | undefined;
  let paymentMethod: Payment["method"] | undefined;
  if (i % 5 === 0) { status = "impayee"; }
  else if (i % 7 === 0) { status = "partielle"; paidAmount = Math.round(total * 0.5); paymentMethod = method; }
  else if (i % 11 === 0) { status = "annulee"; }
  else { status = "payee"; paidAmount = total; paymentMethod = method; }
  return {
    id: `inv_${i + 1}`,
    number: `FAC-2024-${String(i + 1).padStart(4, "0")}`,
    patientId: patient.id,
    patientName: `${patient.firstName} ${patient.lastName}`,
    date: new Date(Date.now() - daysAgo * 86400000).toISOString(),
    dueDate: new Date(Date.now() + (30 - daysAgo) * 86400000).toISOString(),
    items,
    subtotal,
    tax,
    total,
    status,
    paidAmount,
    paymentMethod,
  };
});

export const PAYMENTS: Payment[] = INVOICES
  .filter((inv) => inv.status === "payee" || inv.status === "partielle")
  .map((inv, i) => ({
    id: `pay_${i + 1}`,
    invoiceId: inv.id,
    amount: inv.paidAmount ?? inv.total,
    method: inv.paymentMethod ?? "orange_money",
    reference: `CNP-${Date.now().toString().slice(-8)}${i}`,
    status: "reussi",
    payerName: inv.patientName,
    phone: `+225 0${(i % 7) + 1} ${String(10 + i).padStart(2, "0")} ${String(20 + i).padStart(2, "0")} ${String(30 + i).padStart(2, "0")} ${String(40 + i).padStart(2, "0")}`,
    date: inv.date,
  }));

export const CONSULTATIONS: Consultation[] = Array.from({ length: 18 }).map((_, i) => {
  const patient = PATIENTS[i % PATIENTS.length];
  const doctor = DOCTORS[i % DOCTORS.length];
  const daysAgo = (i * 3) % 30;
  return {
    id: `cons_${i + 1}`,
    patientName: `${patient.firstName} ${patient.lastName}`,
    doctorName: doctor.name,
    date: new Date(Date.now() - daysAgo * 86400000).toISOString(),
    symptoms: pick(REASONS, i),
    diagnosis: pick([
      "Paludisme simple", "Hypertension artérielle", "Infection respiratoire haute",
      "Gastroentérite aiguë", "Migraine", "Diabète déséquilibré",
      "Dermatite atopique", "Angine streptococcique", "Anémie ferriprive",
    ], i),
    treatment: "Traitement symptomatique + repos hydrique. Contrôle dans 7 jours.",
    vitals: {
      temp: 36.5 + (i % 30) / 10,
      tension: `${10 + (i % 4)}/${6 + (i % 3)}`,
      pulse: 68 + (i % 25),
      weight: patient.weight,
    },
  };
});

export const SUBSCRIPTION: Subscription = {
  tenantId: TENANT.id,
  plan: "pro",
  status: "actif",
  billingCycle: "mensuel",
  amount: 75000,
  seats: 10,
  usedSeats: 7,
  currentPeriodStart: new Date(Date.now() - 12 * 86400000).toISOString(),
  currentPeriodEnd: new Date(Date.now() + 18 * 86400000).toISOString(),
  paymentMethod: "orange_money",
};

export const PLANS = [
  {
    id: "essentiel" as const,
    name: "Essentiel",
    price: 35000,
    tagline: "Pour les petits cabinets qui démarrent",
    seats: 3,
    features: [
      "Gestion des rendez-vous",
      "Dossiers patients (jusqu'à 500)",
      "Ordonnances électroniques",
      "Facturation basique",
      "Support par email",
      "1 utilisateur médecin",
    ],
    popular: false,
    color: "bg-emerald-500",
  },
  {
    id: "pro" as const,
    name: "Professionnel",
    price: 75000,
    tagline: "Pour les cliniques en pleine croissance",
    seats: 10,
    features: [
      "Tout Essentiel, plus :",
      "Patients illimités",
      "Téléconsultation vidéo",
      "Paiements Mobile Money (CinetPay)",
      "SMS & notifications WhatsApp",
      "Tableau de bord analytique",
      "10 utilisateurs inclus",
      "Support prioritaire",
    ],
    popular: true,
    color: "bg-teal-600",
  },
  {
    id: "entreprise" as const,
    name: "Entreprise",
    price: 180000,
    tagline: "Pour les groupes médicaux multi-sites",
    seats: 50,
    features: [
      "Tout Professionnel, plus :",
      "Multi-sites & multi-tenant",
      "Utilisateurs illimités",
      "API & intégrations personnalisées",
      "Conformité Loi 2013-450 avancée",
      "SLA 99,9% & support dédié",
      "Formation sur site",
      "Gestionnaire de compte dédié",
    ],
    popular: false,
    color: "bg-orange-500",
  },
];

// Données analytiques (12 derniers mois)
export const MONTHLY_REVENUE = [
  { month: "Jan", revenue: 2850000, consultations: 285 },
  { month: "Fév", revenue: 3120000, consultations: 312 },
  { month: "Mar", revenue: 3480000, consultations: 348 },
  { month: "Avr", revenue: 3210000, consultations: 321 },
  { month: "Mai", revenue: 3950000, consultations: 395 },
  { month: "Juin", revenue: 4180000, consultations: 418 },
  { month: "Juil", revenue: 3760000, consultations: 376 },
  { month: "Août", revenue: 3520000, consultations: 352 },
  { month: "Sep", revenue: 4320000, consultations: 432 },
  { month: "Oct", revenue: 4650000, consultations: 465 },
  { month: "Nov", revenue: 4890000, consultations: 489 },
  { month: "Déc", revenue: 5120000, consultations: 512 },
];

export const PAYMENT_DISTRIBUTION = [
  { name: "Orange Money", value: 42, color: "var(--chart-2)" },
  { name: "Wave", value: 28, color: "var(--chart-4)" },
  { name: "MTN Money", value: 18, color: "var(--chart-5)" },
  { name: "Carte bancaire", value: 8, color: "var(--chart-3)" },
  { name: "Espèces", value: 4, color: "var(--chart-1)" },
];

export const SPECIALTY_DISTRIBUTION = [
  { name: "Médecine générale", value: 35 },
  { name: "Pédiatrie", value: 22 },
  { name: "Cardiologie", value: 15 },
  { name: "Gynécologie", value: 18 },
  { name: "Dermatologie", value: 10 },
];

export const APPOINTMENTS_TREND = Array.from({ length: 7 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (6 - i));
  return {
    day: d.toLocaleDateString("fr-FR", { weekday: "short" }),
    rdv: 18 + Math.round(Math.sin(i * 1.3) * 8) + i * 2,
    termines: 14 + Math.round(Math.sin(i * 1.3) * 6) + i,
  };
});
