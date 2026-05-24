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
import type { ProfileAvatarSelection } from "@/lib/profiles/profile-form";
import { cn } from "@/lib/utils";

type AvatarPickerProps = {
  badgeLabel?: string;
  description?: string;
  googleAvatarUrl?: string | null;
  onAvatarChange?: (selection: ProfileAvatarSelection) => void;
  selectedAvatar?: ProfileAvatarSelection;
  title?: string;
};

export function AvatarPicker({
  badgeLabel = "Avatar",
  description = "Marcá una cara para tu perfil del Prode.",
  googleAvatarUrl,
  onAvatarChange,
  selectedAvatar,
  title = "Elegí tu jugador",
}: AvatarPickerProps) {
  const [internalSelection, setInternalSelection] =
    useState<ProfileAvatarSelection>({
      kind: "stitch",
      value: defaultStitchAvatar.id,
    });
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const avatarSelection = selectedAvatar ?? internalSelection;
  const selectedAvatarId = stitchAvatarAssets.some(
    (avatar) => avatar.id === avatarSelection.value,
  )
    ? (avatarSelection.value as StitchAvatarId)
    : defaultStitchAvatar.id;
  const selectedStitchAvatar = stitchAvatarAssets.find(
    (avatar) => avatar.id === selectedAvatarId,
  );
  const currentLabel =
    avatarSelection.kind === "google"
      ? "Foto de Google"
      : selectedStitchAvatar?.label;

  function updateSelection(selection: ProfileAvatarSelection) {
    setActionNotice(null);

    if (onAvatarChange) {
      onAvatarChange(selection);
      return;
    }

    setInternalSelection(selection);
  }

  function handleGoogleSelection() {
    if (!googleAvatarUrl) {
      setActionNotice("Tu cuenta no trajo una foto de Google para usar.");
      return;
    }

    updateSelection({
      kind: "google",
      value: googleAvatarUrl,
    });
  }

  function handleUploadSelection() {
    setActionNotice("Subir imagen se habilitará cuando conectemos Storage.");
  }

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
          const isSelected =
            avatarSelection.kind === "stitch" && avatar.id === selectedAvatarId;

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
              onClick={() =>
                updateSelection({
                  kind: "stitch",
                  value: avatar.id,
                })
              }
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

        {stitchAvatarActions.map((action) => {
          const isGoogleAction = action.id === "google-photo";
          const isSelected = avatarSelection.kind === "google" && isGoogleAction;

          return (
            <button
              aria-label={
                action.id === "upload-image"
                  ? "Subir imagen próximamente"
                  : action.label
              }
              aria-pressed={isSelected}
              className={cn(
                "relative aspect-square rounded-full border-[3px] border-prode-black outline-none focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper",
                isSelected
                  ? "translate-x-[2px] translate-y-[2px] bg-prode-yellow shadow-[2px_2px_0_var(--prode-black)]"
                  : "bg-prode-surface shadow-[5px_5px_0_var(--prode-black)] transition-transform hover:translate-x-px hover:translate-y-px hover:shadow-[4px_4px_0_var(--prode-black)]",
              )}
              key={action.id}
              onClick={
                action.id === "google-photo"
                  ? handleGoogleSelection
                  : handleUploadSelection
              }
              title={
                action.id === "upload-image"
                  ? "Subir imagen próximamente"
                  : action.label
              }
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
              {isSelected && (
                <span className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full border-[3px] border-prode-black bg-prode-yellow">
                  <Check aria-hidden="true" className="size-3" />
                </span>
              )}
              <span className="sr-only">{action.label}</span>
            </button>
          );
        })}
      </div>

      {actionNotice ? (
        <p
          className="prode-frame bg-prode-surface px-3 py-2 font-technical text-xs font-bold uppercase"
          role="status"
        >
          {actionNotice}
        </p>
      ) : null}

      <div className="prode-frame flex items-center justify-between gap-3 bg-prode-yellow px-3 py-2">
        <p className="font-technical text-xs font-bold uppercase">
          Selección actual
        </p>
        <p className="font-editorial text-lg font-bold">
          {currentLabel}
        </p>
      </div>
    </ProdeCard>
  );
}
