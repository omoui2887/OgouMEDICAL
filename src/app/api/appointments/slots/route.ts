import { NextRequest, NextResponse } from "next/server";

// GET /api/appointments/slots?doctorId=...&date=YYYY-MM-DD
// Retourne les créneaux disponibles pour un médecin un jour donné.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const doctorId = searchParams.get("doctorId");
  const date = searchParams.get("date");
  const duration = parseInt(searchParams.get("duration") ?? "30", 10);

  if (!doctorId || !date) {
    return NextResponse.json(
      { success: false, error: "doctorId et date requis" },
      { status: 400 }
    );
  }

  // En production : SELECT * FROM get_available_slots(doctorId, date, duration)
  // Ici : génération mock des créneaux 08:00 → 17:00 par pas de {duration} min
  const dayOfWeek = new Date(date + "T00:00:00").getDay();

  // Dimanche (0) : pas de créneaux. Samedi (6) : matinée seulement.
  const slots: Array<{ time: string; available: boolean }> = [];
  const startHour = dayOfWeek === 6 ? 8 : 8;
  const endHour = dayOfWeek === 6 ? 13 : 17;

  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += duration) {
      // Pause déjeuner 12h-14h en semaine
      if (dayOfWeek !== 6 && h >= 12 && h < 14) continue;
      const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      // Mock : 1 créneau sur 4 déjà pris
      const seed = (h * 60 + m + doctorId.length * 7) % 4;
      slots.push({ time, available: seed !== 0 });
    }
  }

  return NextResponse.json({ slots, date, doctorId, duration });
}
