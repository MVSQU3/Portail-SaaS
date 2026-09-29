const PUBLIC_EXACT = new Set(["/", "/connexion", "/inscription"]);

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return pathname === "/api/auth" || pathname.startsWith("/api/auth/");
}
