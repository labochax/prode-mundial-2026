import Link from "next/link";

import { cn } from "@/lib/utils";

type PredictionSectionTabsProps = {
  active: "groups" | "matches";
};

const tabs = [
  {
    href: "/predicciones",
    key: "matches",
    label: "Partidos",
  },
  {
    href: "/predicciones/grupos",
    key: "groups",
    label: "Mis grupos",
  },
] as const;

export function PredictionSectionTabs({ active }: PredictionSectionTabsProps) {
  return (
    <nav
      aria-label="Secciones de predicciones"
      className="flex flex-wrap gap-3 border-b-[3px] border-prode-black pb-5"
    >
      {tabs.map((tab) => (
        <Link
          aria-current={active === tab.key ? "page" : undefined}
          className={cn(
            "prode-frame prode-pressable inline-flex min-h-12 items-center justify-center px-4 py-2 font-technical text-xs font-black uppercase outline-none focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper",
            active === tab.key
              ? "prode-hard-shadow bg-prode-yellow"
              : "bg-prode-surface hover:bg-[#fff7b5]",
          )}
          href={tab.href}
          key={tab.key}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
