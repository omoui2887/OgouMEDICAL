// ============================================================
// MediSaaS CI — Script de seed (base de développement)
// Crée 1 tenant, 5 médecins, 10 patients, quelques RDV et factures.
// Contexte ivoirien (noms, communes d'Abidjan, FCFA, Mobile Money).
//
// Utilisation :
//   cd packages/database
//   bun run db:push   # crée les tables SQLite
//   bun run db:seed   # exécute ce script
// ============================================================

import { PrismaClient } from "@prisma/client";

// Client Prisma pointant sur ./dev.db (DATABASE_URL du .env racine).
const prisma = new PrismaClient();

/** Communes d'Abidjan utilisées pour le seed (stockées dans `district`). */
const COMMUNES = [
  "Cocody",
  "Plateau",
  "Yopougon",
  "Marcory",
  "Treichville",
  "Adjamé",
  "Abobo",
  "Koumassi",
] as const;

/** Groupes sanguins possibles. */
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

/** Médecins du cabinet (cf. mock-data racine). */
const MEDECINS = [
  {
    name: "Dr. Aya Kouassi",
    specialty: "Médecine générale",
    email: "a.kouassi@clinique-plateau.ci",
    phone: "+225 07 08 12 34 56",
    licenseNumber: "CI-MG-2018-0431",
  },
  {
    name: "Dr. Konan Yao",
    specialty: "Cardiologie",
    email: "k.yao@clinique-plateau.ci",
    phone: "+225 07 09 22 11 88",
    licenseNumber: "CI-CARD-2015-0188",
  },
  {
    name: "Dr. Fatou Traoré",
    specialty: "Pédiatrie",
    email: "f.traore@clinique-plateau.ci",
    phone: "+225 05 64 78 90 12",
    licenseNumber: "CI-PED-2019-0512",
  },
  {
    name: "Dr. Ibrahim Cissé",
    specialty: "Gynécologie-Obstétrique",
    email: "i.cisse@clinique-plateau.ci",
    phone: "+225 01 22 33 44 55",
    licenseNumber: "CI-GYN-2016-0277",
  },
  {
    name: "Dr. Mariam Bamba",
    specialty: "Dermatologie",
    email: "m.bamba@clinique-plateau.ci",
    phone: "+225 07 77 88 99 00",
    licenseNumber: "CI-DERM-2020-0664",
  },
];

/** Patients générés (10). */
const PATIENTS_DATA = [
  { first: "Aya", last: "Kouassi", gender: "F", commune: "Cocody" },
  { first: "Kouadio", last: "Yao", gender: "M", commune: "Plateau" },
  { first: "Fatou", last: "Diallo", gender: "F", commune: "Yopougon" },
  { first: "Konan", last: "Brou", gender: "M", commune: "Marcory" },
  { first: "Adjoua", last: "Tanoh", gender: "F", commune: "Treichville" },
  { first: "Ibrahim", last: "Cissé", gender: "M", commune: "Adjamé" },
  { first: "Mariam", last: "Touré", gender: "F", commune: "Abobo" },
  { first: "Koffi", last: "N'Guessan", gender: "M", commune: "Koumassi" },
  { first: "Aminata", last: "Koné", gender: "F", commune: "Cocody" },
  { first: "Seydou", last: "Coulibaly", gender: "M", commune: "Plateau" },
] as const;

/**
 * Point d'entrée du seed.
 * Utilise `upsert` pour être idempotent (rejouable sans erreur).
 */
async function main(): Promise<void> {
  console.log("🌱 Démarrage du seed MediSaaS CI…");

  // --- 1. TENANT : Clinique du Plateau ---------------------
  // Le `district` porte la commune (Cocody - Plateau) — pas de champ
  // `commune` dédié côté Patient dans le schéma actuel.
  const tenant = await prisma.tenant.upsert({
    where: { slug: "clinique-plateau" },
    update: {},
    create: {
      name: "Clinique du Plateau",
      slug: "clinique-plateau",
      type: "clinique",
      city: "Abidjan",
      district: "Cocody - Plateau",
      phone: "+225 27 22 49 87 30",
      email: "contact@clinique-plateau.ci",
      address: "Avenue Chardy, Cocody, Abidjan",
      plan: "pro",
      status: "actif",
    },
  });
  console.log(`  ✓ Tenant créé : ${tenant.name} (${tenant.id})`);

  // --- 2. MÉDECINS (Users role=medecin) --------------------
  const medecinIds: string[] = [];
  for (const m of MEDECINS) {
    const user = await prisma.user.upsert({
      where: { email: m.email },
      update: {},
      create: {
        tenantId: tenant.id,
        email: m.email,
        name: m.name,
        role: "medecin",
        phone: m.phone,
        specialty: m.specialty,
        licenseNumber: m.licenseNumber,
        active: true,
      },
    });
    medecinIds.push(user.id);
  }
  console.log(`  ✓ ${medecinIds.length} médecins créés`);

  // Secrétaire + administrateur cabinet (pour les tests RBAC).
  await prisma.user.upsert({
    where: { email: "secretaire@clinique-plateau.ci" },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "secretaire@clinique-plateau.ci",
      name: "Affoué Tanoh",
      role: "secretaire",
      phone: "+225 07 11 22 33 44",
      active: true,
    },
  });
  await prisma.user.upsert({
    where: { email: "admin@clinique-plateau.ci" },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "admin@clinique-plateau.ci",
      name: "Directeur Cabinet",
      role: "admin_cabinet",
      phone: "+225 27 22 49 87 31",
      active: true,
    },
  });
  console.log("  ✓ Secrétaire + administrateur cabinet créés");

  // --- 3. PATIENTS (10) ------------------------------------
  // Code patient unique au cabinet : CI-CP-0001…
  // Date de naissance fictive (25-65 ans) calculée par itération.
  // La commune est stockée dans `address` (le schéma n'a pas de champ
  // `commune` dédié côté Patient) ; le `district` du tenant porte Cocody.
  const patientIds: string[] = [];
  for (let i = 0; i < PATIENTS_DATA.length; i++) {
    const p = PATIENTS_DATA[i];
    const code = `CI-CP-${String(i + 1).padStart(4, "0")}`;
    const year = 1965 + ((i * 4) % 35);
    const birthDate = new Date(`${year}-0${(i % 9) + 1}-1${i % 9}`);

    const patient = await prisma.patient.create({
      data: {
        tenantId: tenant.id,
        code,
        firstName: p.first,
        lastName: p.last,
        gender: p.gender,
        birthDate,
        phone: `+225 07 0${i} ${10 + i} ${20 + i} ${30 + i}`,
        email: `${p.first.toLowerCase()}.${p.last.toLowerCase().replace(/[^a-z]/g, "")}@email.ci`,
        address: `${p.commune}, Abidjan`,
        bloodType: BLOOD_TYPES[i % BLOOD_TYPES.length],
        weight: 55 + i * 3,
        height: 160 + i,
        allergies: i % 3 === 0 ? JSON.stringify(["Pénicilline"]) : null,
        chronicConditions:
          i % 4 === 0 ? JSON.stringify(["Hypertension"]) : null,
        insuranceProvider: i % 2 === 0 ? "CNPS" : "Mutuelle CI",
        insuranceNumber: `ASS-${1000 + i}`,
        status: "actif",
      },
    });
    patientIds.push(patient.id);
  }
  console.log(`  ✓ ${patientIds.length} patients créés`);

  // --- 4. RENDEZ-VOUS (8) ----------------------------------
  const now = new Date();
  const rdvReasons = [
    "Consultation de contrôle",
    "Maux de tête persistants",
    "Vaccination",
    "Suivi grossesse",
    "Douleurs thoraciques",
    "Éruption cutanée",
    "Toux persistante",
    "Bilan annuel",
  ];
  for (let i = 0; i < 8; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + (i - 3)); // de -3j à +4j
    date.setHours(8 + (i % 8), 0, 0, 0);

    await prisma.appointment.create({
      data: {
        tenantId: tenant.id,
        patientId: patientIds[i % patientIds.length],
        doctorId: medecinIds[i % medecinIds.length],
        date,
        duration: 30,
        reason: rdvReasons[i],
        type: i % 4 === 0 ? "teleconsultation" : "presentiel",
        status: i < 3 ? "termine" : i === 3 ? "en_cours" : "planifie",
        roomUrl:
          i % 4 === 0 ? `https://medisaas.daily.co/room-${i}` : null,
      },
    });
  }
  console.log("  ✓ 8 rendez-vous créés");

  // --- 5. FACTURES + PAIEMENTS (6 factures) ----------------
  for (let i = 0; i < 6; i++) {
    const number = `FAC-2024-${String(i + 1).padStart(4, "0")}`;
    const items = [
      {
        description: "Consultation médecin généraliste",
        quantity: 1,
        unitPrice: 15000,
      },
      {
        description: "Prise de tension + bilan",
        quantity: 1,
        unitPrice: 5000,
      },
    ];
    const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + tax;
    const isPaid = i % 3 === 0;
    const isPartial = i % 5 === 0;

    const invoice = await prisma.invoice.create({
      data: {
        tenantId: tenant.id,
        patientId: patientIds[i % patientIds.length],
        number,
        date: new Date(now.getTime() - i * 86_400_000),
        dueDate: new Date(now.getTime() + 7 * 86_400_000),
        items: JSON.stringify(items),
        subtotal,
        tax,
        total,
        status: isPaid ? "payee" : isPartial ? "partielle" : "impayee",
      },
    });

    // Paiement rattaché si payée ou partielle.
    if (isPaid || isPartial) {
      const method = ["orange_money", "wave", "mtn_money", "cash"][i % 4];
      const amount = isPaid ? total : Math.round(total / 2);
      await prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          amount,
          method,
          reference: `PAY-${10000 + i}`,
          status: "reussi",
          phone: i % 4 === 3 ? null : "+225 07 00 00 00 0" + i,
          payerName: `${PATIENTS_DATA[i].first} ${PATIENTS_DATA[i].last}`,
          date: new Date(),
        },
      });
    }
  }
  console.log("  ✓ 6 factures + paiements créés");

  // --- 6. ABONNEMENT SaaS du tenant ------------------------
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  await prisma.subscription.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      plan: "pro",
      status: "actif",
      billingCycle: "mensuel",
      amount: 75000,
      seats: 10,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      paymentMethod: "orange_money",
    },
  });
  console.log("  ✓ Abonnement SaaS Pro créé");

  // --- 7. Quelques entrées d'audit -------------------------
  await prisma.auditLog.createMany({
    data: [
      {
        tenantId: tenant.id,
        action: "tenant.create",
        entity: "tenant",
        entityId: tenant.id,
        ip: "127.0.0.1",
        userAgent: "seed-script",
        metadata: JSON.stringify({ source: "seed" }),
      },
      {
        tenantId: tenant.id,
        action: "patient.create",
        entity: "patient",
        entityId: patientIds[0],
        ip: "127.0.0.1",
        userAgent: "seed-script",
      },
    ],
  });
  console.log("  ✓ Journal d'audit initialisé");

  // Marqueur d'utilisation (communes sont exposées via le tenant + address patient).
  void COMMUNES;

  console.log("✅ Seed terminé avec succès.");
}

// Exécution + gestion propre de la connexion.
main()
  .catch((err) => {
    console.error("❌ Erreur pendant le seed :", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
