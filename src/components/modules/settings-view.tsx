"use client";
import { useState } from "react";
import { TENANT, DOCTORS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar } from "@/components/medisisaas/shared";
import {
  Building2, ShieldCheck, Bell, Users, Lock, Database,
  Download, Save, Plus, Trash2, KeyRound, Server, Clock, FileCheck,
} from "lucide-react";
import { toast } from "sonner";

function ToggleRow({
  title, description, defaultOn,
}: { title: string; description: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(!!defaultOn);
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={on} onCheckedChange={setOn} />
    </div>
  );
}

export function SettingsView() {
  const [tab, setTab] = useState("cabinet");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Paramètres</h2>
          <p className="text-sm text-muted-foreground">Configuration du cabinet & de la plateforme</p>
        </div>
        <Button onClick={() => toast.success("Modifications enregistrées")}>
          <Save className="mr-2 h-4 w-4" /> Enregistrer
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-4">
          <TabsTrigger value="cabinet"><Building2 className="mr-1.5 h-4 w-4" /> Cabinet</TabsTrigger>
          <TabsTrigger value="users"><Users className="mr-1.5 h-4 w-4" /> Utilisateurs</TabsTrigger>
          <TabsTrigger value="security"><ShieldCheck className="mr-1.5 h-4 w-4" /> Sécurité</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="mr-1.5 h-4 w-4" /> Notifications</TabsTrigger>
        </TabsList>

        {/* Cabinet */}
        <TabsContent value="cabinet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4 text-teal-600" /> Informations du cabinet</CardTitle>
              <CardDescription>Identité et coordonnées de l'établissement</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nom du cabinet</Label>
                <Input defaultValue={TENANT.name} />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select defaultValue={TENANT.type}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cabinet">Cabinet médical</SelectItem>
                    <SelectItem value="clinique">Clinique</SelectItem>
                    <SelectItem value="polyclinique">Polyclinique</SelectItem>
                    <SelectItem value="centre">Centre de santé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Ville</Label>
                <Input defaultValue={TENANT.city} />
              </div>
              <div className="space-y-1.5">
                <Label>Commune / Quartier</Label>
                <Input defaultValue={TENANT.district} />
              </div>
              <div className="space-y-1.5">
                <Label>Téléphone</Label>
                <Input defaultValue={TENANT.phone} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" defaultValue={TENANT.email} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Adresse complète</Label>
                <Textarea rows={2} defaultValue={TENANT.address} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4 text-orange-500" /> Horaires d'ouverture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {["Lundi - Vendredi", "Samedi", "Dimanche"].map((d, i) => (
                <div key={d} className="flex items-center gap-3">
                  <span className="w-40 text-sm">{d}</span>
                  <Switch defaultChecked={i < 2} />
                  <Input className="w-32" defaultValue={i < 2 ? "08:00" : "09:00"} />
                  <span className="text-muted-foreground">à</span>
                  <Input className="w-32" defaultValue={i < 2 ? "18:00" : "13:00"} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Utilisateurs */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Équipe du cabinet</CardTitle>
                <CardDescription>Utilisateurs et rôles</CardDescription>
              </div>
              <Button size="sm" onClick={() => toast.info("Invitation envoyée")}>
                <Plus className="mr-2 h-4 w-4" /> Inviter
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {DOCTORS.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <Avatar name={doc.name} color={doc.avatarColor} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.specialty} · {doc.email}</p>
                  </div>
                  <Badge variant="outline" className="bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">Médecin</Badge>
                  <Badge variant="outline" className="text-emerald-600">Actif</Badge>
                  <Button variant="ghost" size="icon" onClick={() => toast.info("Modification rôle")}>
                    <KeyRound className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Avatar name="Affoué Tanoh" color="bg-amber-500" size="md" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">Affoué Tanoh</p>
                  <p className="text-xs text-muted-foreground">Secrétaire · a.tanoh@clinique-plateau.ci</p>
                </div>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Secrétaire</Badge>
                <Badge variant="outline" className="text-emerald-600">Actif</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sécurité */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Conformité & sécurité</CardTitle>
              <CardDescription>Loi ivoirienne n°2013-450 + réglementation ARTCI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border p-4">
                  <Lock className="h-5 w-5 text-emerald-600" />
                  <p className="mt-2 text-sm font-semibold">Chiffrement AES-256</p>
                  <p className="text-xs text-muted-foreground">Données au repos</p>
                  <Badge className="mt-2 bg-emerald-100 text-emerald-700">Actif</Badge>
                </div>
                <div className="rounded-xl border p-4">
                  <Server className="h-5 w-5 text-teal-600" />
                  <p className="mt-2 text-sm font-semibold">Hébergement af-south-1</p>
                  <p className="text-xs text-muted-foreground">Cape Town, Afrique</p>
                  <Badge className="mt-2 bg-emerald-100 text-emerald-700">Actif</Badge>
                </div>
                <div className="rounded-xl border p-4">
                  <FileCheck className="h-5 w-5 text-orange-500" />
                  <p className="mt-2 text-sm font-semibold">Audit logs</p>
                  <p className="text-xs text-muted-foreground">Traçabilité accès</p>
                  <Badge className="mt-2 bg-emerald-100 text-emerald-700">Actif</Badge>
                </div>
              </div>
              <Separator />
              <ToggleRow title="Authentification à deux facteurs (2FA)" description="Obligatoire pour les médecins et administrateurs" defaultOn />
              <ToggleRow title="Journal d'audit complet" description="Enregistrer chaque accès aux dossiers patients" defaultOn />
              <ToggleRow title="Anonymisation après 10 ans" description="Conformément à la Loi 2013-450" defaultOn />
              <ToggleRow title="Blocage après 5 tentatives" description="Sécurité anti-intrusion" defaultOn />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Database className="h-4 w-4 text-teal-600" /> Sauvegardes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Dernière sauvegarde</p>
                  <p className="text-xs text-muted-foreground">Aujourd'hui à 03:00 · Réussie</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700">OK</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Rétention</p>
                  <p className="text-xs text-muted-foreground">30 jours de sauvegardes quotidiennes</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => toast.success("Sauvegarde manuelle lancée")}>
                  <Download className="mr-2 h-4 w-4" /> Sauvegarder
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4 text-orange-500" /> Canaux de notification</CardTitle>
              <CardDescription>Comment vos patients reçoivent leurs rappels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ToggleRow title="SMS (Africa's Talking)" description="Rappel de RDV par SMS local ivoirien — 25 FCFA/SMS" defaultOn />
              <ToggleRow title="WhatsApp Business" description="Messages via WhatsApp Cloud API (Meta)" defaultOn />
              <ToggleRow title="Email (Resend)" description="Confirmations et ordonnances par email" defaultOn />
              <ToggleRow title="Notifications push (PWA)" description="Application mobile installable" defaultOn />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Modèles de rappel</CardTitle>
              <CardDescription>Personnalisez les messages envoyés</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>Rappel de RDV (J-1)</Label>
                <Textarea rows={2} defaultValue="Bonjour {patient}, rappel de votre RDV avec {medecin} le {date} à {heure} à {cabinet}. Merci de confirmer." />
              </div>
              <div className="space-y-1.5">
                <Label>Ordonnance prête</Label>
                <Textarea rows={2} defaultValue="Bonjour {patient}, votre ordonnance {numero} est disponible. Pensez à la retirer au cabinet." />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
