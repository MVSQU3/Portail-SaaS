export type NavItem =
  | { kind: "link"; href: string; label: string }
  | { kind: "sign-out"; label: string };

export const GESTIONNAIRE_NAV: readonly NavItem[] = [
  { kind: "link", href: "/tableau-de-bord", label: "Dashboard" },
  { kind: "link", href: "/vehicules", label: "Véhicules" },
  { kind: "link", href: "/carnet", label: "Carnet d’entretien" },
  { kind: "link", href: "/stocks", label: "Stocks" },
  { kind: "link", href: "/echeances", label: "Échéances" },
  { kind: "link", href: "/abonnement", label: "Abonnement" },
  { kind: "sign-out", label: "Déconnexion" },
];

export const ADMIN_NAV: readonly NavItem[] = [
  { kind: "link", href: "/admin/entreprises", label: "Entreprises" },
  { kind: "link", href: "/admin/abonnements", label: "Abonnements" },
  { kind: "sign-out", label: "Déconnexion" },
];

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
