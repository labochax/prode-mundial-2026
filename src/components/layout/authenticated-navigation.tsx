"use client";

import Link from "next/link";
import { ClipboardPenLine, Gift, Globe2, ScrollText, Trophy } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const authenticatedNavItems = [
  {
    href: "/predicciones",
    icon: ClipboardPenLine,
    label: "Predicciones",
  },
  {
    href: "/mi-mundial",
    icon: Globe2,
    label: "Mi Mundial",
  },
  {
    href: "/posiciones",
    icon: Trophy,
    label: "Posiciones",
  },
  {
    href: "/reglas",
    icon: ScrollText,
    label: "Reglas",
  },
  {
    href: "/premios",
    icon: Gift,
    label: "Premios",
  },
] as const;

type AuthenticatedNavigationProps = {
  className?: string;
  variant: "mobile" | "sidebar";
};

export function AuthenticatedNavigation({
  className,
  variant,
}: AuthenticatedNavigationProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación del Prode"
      className={cn(
        variant === "sidebar" ? "grid gap-1.5" : "grid grid-cols-5 gap-1",
        className,
      )}
    >
      {authenticatedNavItems.map(({ href, icon: Icon, label }) => {
        const isActive =
          pathname === href ||
          (href === "/predicciones" &&
            (pathname.startsWith("/predicciones/") ||
              pathname.startsWith("/partidos/")));

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "prode-frame prode-pressable flex min-w-0 items-center font-technical font-bold uppercase text-prode-black outline-none focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper",
              variant === "sidebar"
                ? "min-h-12 justify-start gap-2.5 px-3 py-2 text-xs"
                : "min-h-14 flex-col justify-center gap-1 px-1 py-1.5 text-[0.62rem]",
              isActive
                ? "prode-hard-shadow bg-prode-yellow"
                : "bg-prode-surface hover:bg-[#fff7b5]",
            )}
            href={href}
            key={href}
          >
            <Icon aria-hidden="true" className="size-5 shrink-0" />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
