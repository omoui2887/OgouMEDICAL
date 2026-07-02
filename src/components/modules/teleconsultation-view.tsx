"use client";
import { useState } from "react";
import { APPOINTMENTS, DOCTORS, PATIENTS } from "@/lib/mock-data";
import { formatDate, formatDateTime } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AppointmentStatusBadge } from "@/components/medisisaas/shared";
import { Badge } from "@/components/ui/badge";
import {
  Video, VideoOff, Mic, MicOff, ScreenShare, Phone, PhoneOff,
  MessageSquare, Users, Settings as SettingsIcon, Calendar,
  ShieldCheck, Lock, Volume2, Camera, Clock, Stethoscope,
} from "lucide-react";
import { toast } from "sonner";

export function TeleconsultationView() {
  const [activeCall, setActiveCall] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [inCall, setInCall] = useState(false);

  const teleApts = APPOINTMENTS.filter((a) => a.type === "teleconsultation");
  const upcoming = teleApts
    .filter((a) => new Date(a.date) >= new Date() && a.status !== "annule")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const past = teleApts
    .filter((a) => new Date(a.date) < new Date() || a.status === "termine")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const activeApt = upcoming.find((a) => a.id === activeCall);

  function joinCall(id: string) {
    setActiveCall(id);
    setInCall(true);
    setMicOn(true);
    setCamOn(true);
    toast.success("Connexion à la salle sécurisée Daily.co…");
  }

  function endCall() {
    setInCall(false);
    setActiveCall(null);
    toast.info("Téléconsultation terminée. Compte-rendu enregistré.");
  }

  if (inCall && activeApt) {
    const doctor = DOCTORS.find((d) => d.id === activeApt.doctorId);
    return (
      <div className="space-y-4">
        <Card className="overflow-hidden">
          <div className="relative aspect-video w-full bg-gradient-to-br from-zinc-900 to-zinc-800">
            {/* Zone vidéo principal (patient) */}
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-white/80">
                {camOn ? (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-teal-600/30 ring-4 ring-teal-500/40">
                    <Avatar name={activeApt.patientName} color={activeApt.patientAvatarColor} size="lg" />
                  </div>
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-zinc-700">
                    <VideoOff className="h-10 w-10 text-zinc-400" />
                  </div>
                )}
                <div className="text-center">
                  <p className="font-semibold text-white">{activeApt.patientName}</p>
                  <p className="text-sm text-white/60">{activeApt.reason}</p>
                </div>
              </div>
            </div>

            {/* Vignette médecin (PiP) */}
            <div className="absolute bottom-4 right-4 h-28 w-40 overflow-hidden rounded-xl border border-white/20 bg-gradient-to-br from-teal-700 to-emerald-800 shadow-xl">
              <div className="flex h-full items-center justify-center">
                {doctor && <Avatar name={doctor.name} color={doctor.avatarColor} size="md" />}
              </div>
              <div className="absolute bottom-1 left-2 text-[11px] font-medium text-white">
                {doctor?.name}
              </div>
            </div>

            {/* Badge chiffré */}
            <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-300 backdrop-blur">
              <Lock className="h-3 w-3" /> Connexion chiffrée E2E
            </div>
            <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
              <Clock className="h-3 w-3" /> 00:14:32
            </div>
          </div>

          {/* Barre de contrôle */}
          <div className="flex items-center justify-center gap-2 border-t bg-zinc-50 p-4 dark:bg-zinc-900">
            <Button
              variant={micOn ? "outline" : "destructive"}
              size="icon"
              onClick={() => setMicOn(!micOn)}
              title={micOn ? "Couper le micro" : "Activer le micro"}
            >
              {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>
            <Button
              variant={camOn ? "outline" : "destructive"}
              size="icon"
              onClick={() => setCamOn(!camOn)}
              title={camOn ? "Couper la caméra" : "Activer la caméra"}
            >
              {camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" title="Partager l'écran" onClick={() => toast.info("Partage d'écran démarré")}>
              <ScreenShare className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" title="Messages" onClick={() => toast.info("Messagerie sécurisée")}>
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" title="Volume">
              <Volume2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" title="Paramètres">
              <SettingsIcon className="h-4 w-4" />
            </Button>
            <div className="mx-2 h-6 w-px bg-border" />
            <Button variant="destructive" className="gap-2" onClick={endCall}>
              <PhoneOff className="h-4 w-4" /> Terminer
            </Button>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><Stethoscope className="h-4 w-4 text-teal-600" /> Notes de consultation</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                placeholder="Saisir les observations cliniques, symptômes, diagnostic…"
                className="min-h-[120px] w-full resize-none rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => toast.success("Compte-rendu enregistré")}>Enregistrer</Button>
                <Button size="sm" variant="outline" onClick={() => toast.success("Ordonnance créée")}>Émettre ordonnance</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Patient</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <Avatar name={activeApt.patientName} color={activeApt.patientAvatarColor} size="sm" />
                <div>
                  <p className="font-medium">{activeApt.patientName}</p>
                  <p className="text-xs text-muted-foreground">{doctor?.name}</p>
                </div>
              </div>
              <div className="rounded-lg bg-accent p-2 text-xs">
                <p className="font-medium">{activeApt.reason}</p>
                <p className="text-muted-foreground">{formatDateTime(activeApt.date)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 p-6 text-white shadow-lg">
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold">Téléconsultation vidéo</h2>
            <p className="mt-1 text-sm text-teal-100">
              Consultations sécurisées via Daily.co · {upcoming.length} à venir
            </p>
          </div>
          <Badge className="bg-white/20 text-white border-white/30">
            <ShieldCheck className="mr-1 h-3 w-3" /> Chiffré E2E
          </Badge>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-white"><Video className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold">{upcoming.length}</p><p className="text-xs text-muted-foreground">À venir</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white"><Phone className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold">{past.length}</p><p className="text-xs text-muted-foreground">Réalisées</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 text-white"><Clock className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold">28min</p><p className="text-xs text-muted-foreground">Durée moyenne</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* RDV à venir */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base"><Calendar className="h-4 w-4 text-teal-600" /> Prochaines téléconsultations</CardTitle>
            <CardDescription>Rejoignez la salle 5 min avant l'heure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
            {upcoming.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Aucune téléconsultation planifiée</p>
            )}
            {upcoming.map((apt) => {
              const doctor = DOCTORS.find((d) => d.id === apt.doctorId);
              return (
                <div key={apt.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center">
                  <div className="flex flex-1 items-center gap-3">
                    <Avatar name={apt.patientName} color={apt.patientAvatarColor} size="md" />
                    <div className="min-w-0">
                      <p className="font-medium">{apt.patientName}</p>
                      <p className="text-xs text-muted-foreground">{apt.reason} · {doctor?.name}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> {apt.time}</span>
                        <span className="text-muted-foreground">{formatDate(apt.date)}</span>
                        <AppointmentStatusBadge status={apt.status} />
                      </div>
                    </div>
                  </div>
                  <Button size="sm" className="gap-2" onClick={() => joinCall(apt.id)}>
                    <Video className="h-4 w-4" /> Rejoindre
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Lateral info */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><Lock className="h-4 w-4 text-emerald-600" /> Sécurité & conformité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              <div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span>Chiffrement bout-en-bout (E2EE)</span></div>
              <div className="flex items-start gap-2"><Lock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span>Aucun enregistrement sans consentement</span></div>
              <div className="flex items-start gap-2"><Users className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span>Salle privée par consultation</span></div>
              <div className="flex items-start gap-2"><Camera className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span>Conforme Loi 2013-450 (ARTCI)</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Téléconsultations passées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-64 overflow-y-auto">
              {past.slice(0, 6).map((apt) => (
                <div key={apt.id} className="flex items-center gap-2 rounded-lg p-2 hover:bg-accent">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600"><Phone className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{apt.patientName}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(apt.date)}</p>
                  </div>
                  <AppointmentStatusBadge status={apt.status} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
