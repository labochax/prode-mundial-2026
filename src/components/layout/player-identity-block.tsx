import Image from "next/image";

import { defaultStitchAvatar } from "@/lib/design/stitch-assets";
import { cn } from "@/lib/utils";

type PlayerIdentityBlockProps = {
  className?: string;
  compact?: boolean;
};

export function PlayerIdentityBlock({
  className,
  compact = false,
}: PlayerIdentityBlockProps) {
  return (
    <section
      aria-label="Jugador actual"
      className={cn(
        "prode-frame bg-prode-surface text-prode-black",
        compact ? "flex items-center gap-2 p-2" : "space-y-3 p-3",
        className,
      )}
    >
      <div className={cn("flex items-center", compact ? "gap-2" : "gap-3")}>
        <div
          className={cn(
            "relative shrink-0 overflow-hidden rounded-full border-[3px] border-prode-black bg-prode-yellow",
            compact ? "size-10" : "size-14",
          )}
        >
          <Image
            alt={defaultStitchAvatar.alt}
            className="size-full rounded-full object-cover"
            height={defaultStitchAvatar.height}
            sizes={compact ? "2.5rem" : "3.5rem"}
            src={defaultStitchAvatar.src}
            width={defaultStitchAvatar.width}
          />
        </div>

        <div className="min-w-0">
          <p className="truncate font-editorial text-lg font-bold leading-tight">
            Jugador invitado
          </p>
          <p className="font-technical text-xs font-bold uppercase text-muted-foreground">
            Grupo privado
          </p>
        </div>
      </div>

      {!compact && (
        <div className="prode-frame bg-prode-yellow px-3 py-2 font-technical text-sm font-bold uppercase">
          0 puntos
        </div>
      )}
    </section>
  );
}
