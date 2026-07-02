"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export function ModuleStub({ name }: { name: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600">
          <Construction className="h-7 w-7" />
        </div>
        <div>
          <p className="text-lg font-semibold">{name}</p>
          <p className="text-sm text-muted-foreground">Module en cours de chargement…</p>
        </div>
      </CardContent>
    </Card>
  );
}
