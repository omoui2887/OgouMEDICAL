/**
 * MediSaaS CI — Templates SMS en français pour la Côte d'Ivoire
 * Tous les SMS sont conformes Loi 2013-450 (pas de données médicales sensibles)
 * Coût : ~28 FCFA/SMS
 */

export interface SmsTemplate {
  message: string;
  maxLength: number;
}

// ---------- RAPPEL DE RDV — 24h avant ----------
export function reminder24hTemplate(params: {
  patientFirstName: string;
  date: string;       // "mardi 15 octobre"
  time: string;       // "09:30"
  doctorName: string; // "Dr. Kouassi"
  cabinetName: string;
}): SmsTemplate {
  const message = `Bonjour ${params.patientFirstName}, rappel de votre RDV le ${params.date} à ${params.time} avec ${params.doctorName} au cabinet ${params.cabinetName}. Pour annuler, répondez NON.`;
  return { message, maxLength: 160 };
}

// ---------- RAPPEL DE RDV — 1h avant (WhatsApp) ----------
export function reminder1hTemplate(params: {
  patientFirstName: string;
  time: string;
  doctorName: string;
  cabinetAddress: string;
}): SmsTemplate {
  const message = `Bonjour ${params.patientFirstName}, votre RDV avec ${params.doctorName} est à ${params.time}. Merci d'arriver 10 min avant. Adresse : ${params.cabinetAddress}. À bientôt !`;
  return { message, maxLength: 160 };
}

// ---------- CONFIRMATION DE RDV ----------
export function appointmentConfirmedTemplate(params: {
  patientFirstName: string;
  date: string;
  time: string;
  doctorName: string;
  cabinetName: string;
}): SmsTemplate {
  const message = `MediSaaS CI : RDV confirmé le ${params.date} à ${params.time} avec ${params.doctorName} (${params.cabinetName}). Pour annuler, répondez NON.`;
  return { message, maxLength: 160 };
}

// ---------- ANNULATION DE RDV ----------
export function appointmentCancelledTemplate(params: {
  patientFirstName: string;
  date: string;
  time: string;
  cabinetName: string;
  reschedulePhone: string;
}): SmsTemplate {
  const message = `MediSaaS CI : votre RDV du ${params.date} à ${params.time} est annulé. Pour reprendre RDV, appelez le ${params.reschedulePhone}. ${params.cabinetName}`;
  return { message, maxLength: 160 };
}

// ---------- TÉLÉCONSULTATION — Lien Daily.co ----------
export function teleconsultLinkTemplate(params: {
  patientFirstName: string;
  date: string;
  time: string;
  doctorName: string;
  roomUrl: string;
}): SmsTemplate {
  const message = `MediSaaS CI : votre téléconsultation avec ${params.doctorName} est le ${params.date} à ${params.time}. Lien : ${params.roomUrl}`;
  return { message, maxLength: 160 };
}

// ---------- OTP VÉRIFICATION TÉLÉPHONE ----------
export function otpTemplate(code: string): SmsTemplate {
  const message = `MediSaaS CI : votre code de vérification est ${code}. Ce code expire dans 5 minutes. Ne le partagez avec personne.`;
  return { message, maxLength: 160 };
}

// ---------- PAIEMENT REÇU (Mobile Money) ----------
export function paymentReceivedTemplate(params: {
  patientFirstName: string;
  amount: number;       // FCFA
  invoiceNumber: string;
  method: string;       // "Orange Money"
}): SmsTemplate {
  const message = `MediSaaS CI : paiement de ${params.amount.toLocaleString("fr-FR")} FCFA reçu via ${params.method} (facture ${params.invoiceNumber}). Merci !`;
  return { message, maxLength: 160 };
}

// ---------- RENDEZ-VOUS MANQUÉ ----------
export function missedAppointmentTemplate(params: {
  patientFirstName: string;
  date: string;
  time: string;
  cabinetName: string;
  reschedulePhone: string;
}): SmsTemplate {
  const message = `Bonjour ${params.patientFirstName}, vous avez manqué votre RDV du ${params.date} à ${params.time}. Pour reprendre RDV : ${params.reschedulePhone}. ${params.cabinetName}`;
  return { message, maxLength: 160 };
}

// ---------- ORDONNANCE PRÊTE ----------
export function prescriptionReadyTemplate(params: {
  patientFirstName: string;
  prescriptionNumber: string;
  cabinetName: string;
}): SmsTemplate {
  const message = `MediSaaS CI : votre ordonnance ${params.prescriptionNumber} est disponible au cabinet ${params.cabinetName}. Pensez à la retirer.`;
  return { message, maxLength: 160 };
}

// ---------- VALIDATION TEMPLATE ----------
export function validateTemplate(template: SmsTemplate): void {
  if (template.message.length > template.maxLength) {
    throw new Error(
      `Template SMS trop long (${template.message.length}/${template.maxLength} caractères)`
    );
  }
  // Conformité Loi 2013-450 : pas de données médicales sensibles
  const sensitive = ["VIH", "SIDA", "cancer", "psychiatrie", "avortement", "grossesse"];
  const lower = template.message.toLowerCase();
  for (const kw of sensitive) {
    if (lower.includes(kw.toLowerCase())) {
      throw new Error(
        `Donnée sensible « ${kw} » interdite dans un SMS (Loi 2013-450)`
      );
    }
  }
}
