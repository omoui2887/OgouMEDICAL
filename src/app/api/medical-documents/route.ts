import { NextRequest, NextResponse } from "next/server";
import { TENANT } from "@/lib/mock-data";

const ALLOWED_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/dicom",
  "text/plain",
];
const MAX_SIZE_MB = 25;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

interface MedicalDocument {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  category: "ordonnance" | "resultat" | "imagerie" | "courrier" | "autre";
  patientId?: string;
  patientName?: string;
  uploadedBy: string;
  uploadedAt: string;
  status: "pending" | "indexed" | "error";
}

// Mock : liste partagée en mémoire pour la démo (vide au démarrage)
const DOCUMENTS: MedicalDocument[] = [];

// GET /api/medical-documents — Liste des documents médicaux
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");
  const category = searchParams.get("category");

  let results = [...DOCUMENTS];
  if (patientId) results = results.filter((d) => d.patientId === patientId);
  if (category) results = results.filter((d) => d.category === category);

  return NextResponse.json({
    success: true,
    documents: results,
    total: results.length,
    limits: {
      maxFileSizeMb: MAX_SIZE_MB,
      allowedMimeTypes: ALLOWED_MIME,
      allowedCategories: ["ordonnance", "resultat", "imagerie", "courrier", "autre"],
    },
    tenant: {
      id: TENANT.id,
      name: TENANT.name,
    },
  });
}

// POST /api/medical-documents — Upload + validation
// Body (multipart) ou JSON : { name, mimeType, size, category, patientId, patientName }
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    let payload: {
      name?: string;
      mimeType?: string;
      size?: number;
      category?: string;
      patientId?: string;
      patientName?: string;
    };

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") as File | null;
      if (!file) {
        return NextResponse.json(
          { success: false, error: "Fichier « file » manquant dans le formulaire" },
          { status: 400 }
        );
      }
      payload = {
        name: file.name,
        mimeType: file.type,
        size: file.size,
        category: (form.get("category") as string) ?? "autre",
        patientId: (form.get("patientId") as string) ?? undefined,
        patientName: (form.get("patientName") as string) ?? undefined,
      };
    } else {
      payload = await req.json();
    }

    const {
      name, mimeType, size, category, patientId, patientName,
    } = payload;

    // Validations
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Nom du fichier requis" },
        { status: 400 }
      );
    }
    if (!mimeType || !ALLOWED_MIME.includes(mimeType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Type MIME non autorisé. Autorisés : ${ALLOWED_MIME.join(", ")}`,
          allowedMimeTypes: ALLOWED_MIME,
        },
        { status: 415 }
      );
    }
    if (typeof size !== "number" || size <= 0) {
      return NextResponse.json(
        { success: false, error: "Taille de fichier invalide" },
        { status: 400 }
      );
    }
    if (size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `Fichier trop volumineux. Taille max : ${MAX_SIZE_MB} Mo`,
          maxSizeMb: MAX_SIZE_MB,
        },
        { status: 413 }
      );
    }
    const validCategories = ["ordonnance", "resultat", "imagerie", "courrier", "autre"];
    if (category && !validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: `Catégorie invalide. Valides : ${validCategories.join(", ")}` },
        { status: 400 }
      );
    }

    // Vérification antivirus (mock — en prod : ClamAV ou service EICAR)
    const doc: MedicalDocument = {
      id: `doc_${Date.now()}`,
      name: name.trim(),
      mimeType,
      size,
      category: (category as MedicalDocument["category"]) ?? "autre",
      patientId,
      patientName,
      uploadedBy: "system",
      uploadedAt: new Date().toISOString(),
      status: "indexed",
    };

    DOCUMENTS.unshift(doc);

    return NextResponse.json({
      success: true,
      message: "Document indexé avec succès",
      document: doc,
      storage: {
        provider: "Supabase Storage",
        bucket: `ogoumedical-documents/${TENANT.id}`,
        path: `${doc.category}/${doc.id}/${doc.name}`,
        // En prod : URL signée 1h
        signedUrlExpiresIn: 3600,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Erreur lors du traitement du document" },
      { status: 500 }
    );
  }
}
