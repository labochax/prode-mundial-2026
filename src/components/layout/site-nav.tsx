import Link from "next/link";

import { Button } from "@/components/ui/button";

const siteNavItems = [
  { href: "/login", label: "Ingreso" },
  { href: "/onboarding", label: "Bienvenida" },
  { href: "/predicciones", label: "Predicciones" },
  { href: "/posiciones", label: "Posiciones" },
  { href: "/perfil", label: "Perfil" },
] as const;

export function SiteNav() {
  return (
    <nav aria-label="Navegacion principal" className="flex flex-wrap gap-1">
      {siteNavItems.map((item) => (
        <Button asChild key={item.href} size="sm" variant="ghost">
          <Link href={item.href}>{item.label}</Link>
        </Button>
      ))}
    </nav>
  );
}
