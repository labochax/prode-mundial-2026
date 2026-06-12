import { LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { signOutAction } from "@/app/actions/auth";
import type { ShellPlayerIdentity } from "@/lib/profiles/player-identity";
import { cn } from "@/lib/utils";

type PlayerIdentityBlockProps = {
  className?: string;
  compact?: boolean;
  identity: ShellPlayerIdentity;
};

export function PlayerIdentityBlock({
  className,
  compact = false,
  identity,
}: PlayerIdentityBlockProps) {
  return (
    <div
      className={cn(
        "prode-frame bg-prode-surface text-prode-black",
        compact ? "flex items-center gap-2 p-2" : "space-y-2 p-2.5",
        className,
      )}
    >
      <Link
        aria-label="Editar mi jugador"
        className={cn(
          "prode-pressable flex min-w-0 items-center rounded-none outline-none hover:bg-[#fff7b5] focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper",
          compact ? "flex-1 gap-2" : "gap-2.5 p-1",
        )}
        href="/perfil"
      >
        <div
          className={cn(
            "relative shrink-0 overflow-hidden rounded-full border-[3px] border-prode-black bg-prode-yellow",
            compact ? "size-10" : "size-12",
          )}
        >
          {identity.avatar.kind === "google" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={identity.avatar.alt}
              className="size-full rounded-full object-cover"
              referrerPolicy="no-referrer"
              src={identity.avatar.src}
            />
          ) : (
            <Image
              alt={identity.avatar.alt}
              className="size-full rounded-full object-cover"
              height={identity.avatar.height}
              sizes={compact ? "2.5rem" : "3rem"}
              src={identity.avatar.src}
              width={identity.avatar.width}
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate font-editorial font-bold leading-tight",
              compact ? "text-sm" : "text-base",
            )}
          >
            {identity.displayName}
          </p>
          {compact ? (
            <div className="flex min-w-0 items-center gap-1.5">
              <p className="min-w-0 truncate font-technical text-[9px] font-bold uppercase leading-none text-muted-foreground">
                {identity.groupLabel}
              </p>
              <span
                className="shrink-0 whitespace-nowrap border-2 border-prode-black bg-prode-yellow px-1 py-0.5 font-technical text-[9px] font-bold uppercase leading-none"
                title={identity.scoreSummaryLabel}
              >
                {identity.compactScoreSummaryLabel}
              </span>
            </div>
          ) : (
            <p className="truncate font-technical text-xs font-bold uppercase text-muted-foreground">
              {identity.groupLabel}
            </p>
          )}
        </div>
      </Link>

      {!compact && (
        <div className="prode-frame bg-prode-yellow px-3 py-1.5 font-technical text-xs font-bold uppercase">
          {identity.scoreSummaryLabel}
        </div>
      )}

      <form action={signOutAction} className={compact ? "shrink-0" : undefined}>
        <button
          aria-label="Cerrar sesión"
          className={cn(
            "prode-frame prode-pressable inline-flex items-center justify-center gap-2 bg-prode-paper font-technical text-xs font-bold uppercase outline-none hover:bg-[#fff7b5] focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper",
            compact ? "size-10 p-0" : "min-h-10 w-full px-3 py-1.5",
          )}
          type="submit"
        >
          <LogOut aria-hidden="true" className="size-4" />
          {compact ? <span className="sr-only">Cerrar sesión</span> : "Cerrar sesión"}
        </button>
      </form>
    </div>
  );
}
