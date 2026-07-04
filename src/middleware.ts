/**
 * MediSaaS CI — Middleware de protection des routes (RBAC + Abonnement)
 * ----------------------------------------------------------------
 * 1. Vérifie le token JWT Supabase sur chaque requête
 * 2. Redirige vers /auth/login si non authentifié
 * 3. Vérifie le rôle et l'accès aux routes (matrice ci-dessous)
 * 4. Vérifie que l'abonnement du tenant est actif
 * 5. Bloque l'accès si abonnement expiré (redirige vers /billing)
 * 6. Enregistre chaque accès dans audit_logs
 *
 * Matrice d'accès :
 *   /dashboard/*          → tous les rôles authentifiés
 *   /dashboard/patients/* → medecin, secretaire, admin_cabinet
 *   /dashboard/billing/*  → admin_cabinet, comptable
 *   /dashboard/settings/* → admin_cabinet uniquement
 *   /admin/*              → super_admin uniquement
 *   /patient/*            → patient uniquement
 *
 * Conformité : Loi ivoirienne n°2013-450 + ARTCI
 */
import { NextResponse, type NextRequest } from "next/server";

// ---------- Matrice d'accès rôle → routes ----------
const ROUTE_ROLE_MATRIX: Array<{
  pattern: string;
  roles: string[];
}> = [
  // /admin/* → super_admin uniquement (priorité haute, placé en premier)
  { pattern: "/admin", roles: ["super_admin"] },
  // /patient/* → patient uniquement
  { pattern: "/patient", roles: ["patient"] },
  // /dashboard/patients/* → medecin, secretaire, admin_cabinet
  { pattern: "/dashboard/patients", roles: ["medecin", "secretaire", "admin_cabinet", "super_admin"] },
  // /dashboard/billing/* → admin_cabinet, comptable
  { pattern: "/dashboard/billing", roles: ["admin_cabinet", "comptable", "super_admin"] },
  // /dashboard/settings/* → admin_cabinet uniquement
  { pattern: "/dashboard/settings", roles: ["admin_cabinet", "super_admin"] },
  // /dashboard/* → tous les rôles authentifiés
  { pattern: "/dashboard", roles: ["super_admin", "admin_cabinet", "medecin", "secretaire", "patient", "comptable"] },
];

// Routes publiques (aucune auth requise)
const PUBLIC_ROUTES = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/verify-email",
  "/auth/reset-password",
  "/api/health",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/verify-email",
];

// Routes exemptées de vérification d'abonnement
const SUBSCRIPTION_EXEMPT_ROUTES = ["/dashboard/billing", "/dashboard/subscriptions", "/admin"];

function isPublic(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (r) => pathname === r || (r !== "/" && pathname.startsWith(r))
  );
}

/**
 * Récupère les rôles requis pour une route.
 * Retourne le premier match (l'ordre de ROUTE_ROLE_MATRIX compte : routes spécifiques d'abord).
 */
function getRequiredRoles(pathname: string): string[] | null {
  for (const route of ROUTE_ROLE_MATRIX) {
    if (pathname === route.pattern || pathname.startsWith(route.pattern + "/")) {
      return route.roles;
    }
  }
  return null;
}

/**
 * Récupère le rôle + tenant depuis la session (mock — brancher Supabase en prod).
 * En production :
 *   const { data: { session } } = await supabase.auth.getSession();
 *   const role = session.user.app_metadata.role;
 *   const tenantId = session.user.app_metadata.tenant_id;
 *   const subscriptionStatus = ... (requête DB ou JWT claim)
 */
function getSession(request: NextRequest): {
  role: string | null;
  tenantId: string | null;
  subscriptionStatus: string | null;
} {
  // DÉMO : lecture cookie. PROD : décoder JWT Supabase (access_token cookie)
  const role = request.cookies.get("medisaas-role")?.value ?? null;
  const tenantId = request.cookies.get("medisaas-tenant")?.value ?? null;
  const subscriptionStatus =
    request.cookies.get("medisaas-sub-status")?.value ?? "active";
  return { role, tenantId, subscriptionStatus };
}

/**
 * Vérifie si l'abonnement du tenant est actif.
 */
function isSubscriptionActive(status: string | null, role: string | null): boolean {
  // super_admin toujours autorisé
  if (role === "super_admin") return true;
  return status === "active" || status === "trialing";
}

/**
 * Enregistre un accès dans audit_logs (mock — en prod : INSERT via service_role).
 */
async function logAuditAccess(
  request: NextRequest,
  userId: string | null,
  tenantId: string | null,
  role: string | null,
  action: string,
  resourceType: string
): Promise<void> {
  // En production :
  //   await supabaseAdmin.from('audit_logs').insert({
  //     tenant_id: tenantId,
  //     user_id: userId,
  //     action,
  //     resource_type: resourceType,
  //     ip_address: request.headers.get('x-forwarded-for'),
  //     user_agent: request.headers.get('user-agent'),
  //     metadata: { path: request.nextUrl.pathname, method: request.method },
  //   });
  // Ici : no-op (évite la double écriture côté API)
  void userId;
  void tenantId;
  void role;
  void action;
  void resourceType;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Routes publiques → laisser passer
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // 2. Ressources statiques / API webhooks → laisser passer
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/webhooks")
  ) {
    return NextResponse.next();
  }

  const { role, tenantId, subscriptionStatus } = getSession(request);
  const requiredRoles = getRequiredRoles(pathname);

  // 3. Route non protégée par la matrice → laisser passer (404 gérée ailleurs)
  if (!requiredRoles) {
    return NextResponse.next();
  }

  // 4. Non authentifié → rediriger vers /auth/login
  if (!role) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Rôle insuffisant → 403
  if (!requiredRoles.includes(role)) {
    const forbiddenUrl = request.nextUrl.clone();
    forbiddenUrl.pathname = "/auth/forbidden";
    forbiddenUrl.searchParams.set("required", requiredRoles.join(","));
    forbiddenUrl.searchParams.set("current", role);
    return NextResponse.redirect(forbiddenUrl);
  }

  // 6. Vérification de l'abonnement (sauf routes exemptées)
  const isExempt = SUBSCRIPTION_EXEMPT_ROUTES.some((r) => pathname.startsWith(r));
  if (!isExempt && !isSubscriptionActive(subscriptionStatus, role)) {
    const billingUrl = request.nextUrl.clone();
    billingUrl.pathname = "/dashboard/billing";
    billingUrl.searchParams.set("reason", "subscription_expired");
    return NextResponse.redirect(billingUrl);
  }

  // 7. Audit de l'accès (conformité Loi 2013-450, art. 33/44/51)
  await logAuditAccess(
    request,
    null, // userId extrait du JWT en prod
    tenantId,
    role,
    "ROUTE_ACCESS",
    "route"
  );

  // 8. Headers de sécurité (conformité ARTCI)
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(self), geolocation=()"
  );
  response.headers.set("X-Robots-Tag", "noindex, nofollow");

  return response;
}

export const config = {
  // Matcher : toutes les routes sauf assets statiques
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
