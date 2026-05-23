"use client";

import { Check } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { ProdeBadge } from "@/components/prode/prode-badge";
import { ProdeCard } from "@/components/prode/prode-card";
import {
  defaultStitchAvatar,
  stitchAvatarActions,
  stitchAvatarAssets,
  type StitchAvatarId,
} from "@/lib/design/stitch-assets";
import { cn } from "@/lib/utils";

type AvatarPickerProps = {
  badgeLabel?: string;
  description?: string;
  title?: string;
};

export function AvatarPicker({
  badgeLabel = "Avatar",
  description = "Marcá una cara para tu perfil del Prode.",
  title = "Elegí tu jugador",
}: AvatarPickerProps) {
  const [selectedAvatarId, setSelectedAvatarId] = useState<StitchAvatarId>(
    defaultStitchAvatar.id,
  );
  const selectedAvatar = stitchAvatarAssets.find(
    (avatar) => avatar.id === selectedAvatarId,
  );

  return (
    <ProdeCard className="space-y-5 p-5 sm:p-6">
      <header className="space-y-3">
        <ProdeBadge variant="ink">{badgeLabel}</ProdeBadge>
        <div className="space-y-2">
          <h2 className="font-display text-4xl uppercase leading-none">
            {title}
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-5 gap-3">
        {stitchAvatarAssets.map((avatar) => {
          const isSelected = avatar.id === selectedAvatarId;

          return (
            <button
              aria-label={`Elegir avatar ${avatar.label}`}
              aria-pressed={isSelected}
              className={cn(
                "relative aspect-square rounded-full border-[3px] border-prode-black outline-none focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper",
                isSelected
                  ? "translate-x-[2px] translate-y-[2px] bg-prode-yellow shadow-[2px_2px_0_var(--prode-black)]"
                  : "bg-prode-surface shadow-[5px_5px_0_var(--prode-black)] transition-transform hover:translate-x-px hover:translate-y-px hover:shadow-[4px_4px_0_var(--prode-black)]",
              )}
              key={avatar.id}
              onClick={() => setSelectedAvatarId(avatar.id)}
              type="button"
            >
              <Image
                alt={avatar.alt}
                className="size-full rounded-full object-cover"
                height={avatar.height}
                sizes="(max-width: 640px) 4rem, 5rem"
                src={avatar.src}
                width={avatar.width}
              />
              {isSelected && (
                <span className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full border-[3px] border-prode-black bg-prode-yellow">
                  <Check aria-hidden="true" className="size-3" />
                </span>
              )}
            </button>
          );
        })}

        {stitchAvatarActions.map((action) => (
          <button
            aria-label={action.label}
            className="relative aspect-square rounded-full border-[3px] border-prode-black bg-prode-surface shadow-[5px_5px_0_var(--prode-black)] outline-none transition-transform hover:translate-x-px hover:translate-y-px hover:shadow-[4px_4px_0_var(--prode-black)] focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper"
            key={action.id}
            title={action.label}
            type="button"
          >
            <Image
              alt={action.alt}
              className="size-full rounded-full object-cover"
              height={action.height}
              sizes="(max-width: 640px) 4rem, 5rem"
              src={action.src}
              width={action.width}
            />
            <span className="sr-only">{action.label}</span>
          </button>
        ))}
      </div>

      <div className="prode-frame flex items-center justify-between gap-3 bg-prode-yellow px-3 py-2">
        <p className="font-technical text-xs font-bold uppercase">
          Selección actual
        </p>
        <p className="font-editorial text-lg font-bold">
          {selectedAvatar?.label}
        </p>
      </div>
    </ProdeCard>
  );
}
