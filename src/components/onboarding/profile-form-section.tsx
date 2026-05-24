"use client";

import type { ReactNode } from "react";
import { useActionState, useEffect, useMemo, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";

import { ProdeButton } from "@/components/prode/prode-button";
import { ProdeCard } from "@/components/prode/prode-card";
import {
  ProdeField,
  ProdeInput,
  ProdeSelect,
  ProdeTextarea,
} from "@/components/prode/prode-field";
import {
  defaultProfileFormValues,
  initialProfileActionState,
  type ProfileActionState,
  type ProfileAvatarSelection,
  type ProfileFormValues,
} from "@/lib/profiles/profile-form";

type ProfileServerAction = (
  previousState: ProfileActionState,
  formData: FormData,
) => Promise<ProfileActionState>;

type ProfileFormSectionProps = {
  action: ProfileServerAction;
  avatarSelection: ProfileAvatarSelection;
  formLabel?: string;
  initialValues?: ProfileFormValues;
  savedLabel?: string;
  secondaryAction?: ReactNode;
  showSavedState?: boolean;
  submitLabel?: string;
};

export function ProfileFormSection({
  action,
  avatarSelection,
  formLabel = "Perfil del jugador",
  initialValues = defaultProfileFormValues,
  savedLabel = "Cambios guardados",
  secondaryAction,
  showSavedState = false,
  submitLabel = "Listo para jugar",
}: ProfileFormSectionProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialProfileActionState,
  );
  const [hasEditedSinceSave, setHasEditedSinceSave] = useState(false);
  const avatarSelectionKey = `${avatarSelection.kind}:${avatarSelection.value}`;
  const [lastAvatarSelectionKey, setLastAvatarSelectionKey] =
    useState(avatarSelectionKey);
  const isSaved =
    showSavedState && state.status === "success" && !hasEditedSinceSave;
  const buttonLabel = showSavedState && isSaved ? savedLabel : submitLabel;
  const fieldErrors = useMemo(() => state.fieldErrors ?? {}, [state.fieldErrors]);

  useEffect(() => {
    if (state.status === "success") {
      setHasEditedSinceSave(false);
    }
  }, [state.status]);

  useEffect(() => {
    if (avatarSelectionKey !== lastAvatarSelectionKey) {
      setLastAvatarSelectionKey(avatarSelectionKey);
      setHasEditedSinceSave(true);
    }
  }, [avatarSelectionKey, lastAvatarSelectionKey]);

  return (
    <ProdeCard className="p-5 sm:p-6">
      <form
        action={formAction}
        aria-label={formLabel}
        className="grid gap-5"
        onChange={() => setHasEditedSinceSave(true)}
      >
        <input
          name="avatar_kind"
          readOnly
          type="hidden"
          value={avatarSelection.kind}
        />
        <input
          name="avatar_value"
          readOnly
          type="hidden"
          value={avatarSelection.value}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <ProdeField htmlFor="nombre-visible" label="Nombre visible">
            <ProdeInput
              autoComplete="nickname"
              aria-describedby={
                fieldErrors.display_name ? "nombre-visible-error" : undefined
              }
              aria-invalid={Boolean(fieldErrors.display_name)}
              defaultValue={initialValues.displayName}
              id="nombre-visible"
              name="display_name"
              placeholder="Ej. Pela del Prode"
            />
            {fieldErrors.display_name ? (
              <p
                className="font-technical text-xs font-bold uppercase"
                id="nombre-visible-error"
              >
                {fieldErrors.display_name[0]}
              </p>
            ) : null}
          </ProdeField>

          <ProdeField htmlFor="edad" label="Edad">
            <ProdeInput
              aria-describedby={fieldErrors.age ? "edad-error" : undefined}
              aria-invalid={Boolean(fieldErrors.age)}
              defaultValue={initialValues.age}
              id="edad"
              max={120}
              min={1}
              name="age"
              placeholder="29"
              type="number"
            />
            {fieldErrors.age ? (
              <p
                className="font-technical text-xs font-bold uppercase"
                id="edad-error"
              >
                {fieldErrors.age[0]}
              </p>
            ) : null}
          </ProdeField>

          <ProdeField htmlFor="nombre" label="Nombre">
            <ProdeInput
              autoComplete="given-name"
              defaultValue={initialValues.firstName}
              id="nombre"
              name="first_name"
              placeholder="Lucía"
            />
          </ProdeField>

          <ProdeField htmlFor="apellido" label="Apellido">
            <ProdeInput
              autoComplete="family-name"
              defaultValue={initialValues.lastName}
              id="apellido"
              name="last_name"
              placeholder="Fernández"
            />
          </ProdeField>

          <ProdeField
            className="md:col-span-2"
            htmlFor="club-favorito"
            label="Club / equipo favorito"
          >
            <ProdeInput
              defaultValue={initialValues.favoriteTeam}
              id="club-favorito"
              name="favorite_team"
              placeholder="Ej. Argentinos Juniors"
            />
          </ProdeField>

          <ProdeField htmlFor="colegio-grupo" label="Colegio / grupo">
            <ProdeInput
              defaultValue={initialValues.schoolGroup}
              id="colegio-grupo"
              name="school_group"
              placeholder="Ej. Promo del colegio"
            />
          </ProdeField>

          <ProdeField
            htmlFor="egreso-categoria"
            label="Año de egreso o categoría"
          >
            <ProdeInput
              defaultValue={initialValues.graduationYearOrCategory}
              id="egreso-categoria"
              name="graduation_year_or_category"
              placeholder="Ej. 2012"
            />
          </ProdeField>

          <ProdeField htmlFor="pais" label="País">
            <ProdeSelect
              defaultValue={initialValues.country}
              id="pais"
              name="country"
            >
              <option>Argentina</option>
              <option>Uruguay</option>
              <option>Chile</option>
              <option>Otro</option>
            </ProdeSelect>
          </ProdeField>

          <ProdeField htmlFor="provincia" label="Provincia">
            <ProdeInput
              defaultValue={initialValues.province}
              id="provincia"
              name="province"
              placeholder="Buenos Aires"
            />
          </ProdeField>

          <ProdeField className="md:col-span-2" htmlFor="ciudad" label="Ciudad">
            <ProdeInput
              defaultValue={initialValues.city}
              id="ciudad"
              name="city"
              placeholder="La Plata"
            />
          </ProdeField>
        </div>

        <ProdeField
          htmlFor="subgrupo"
          label="Subgrupo / equipo del Prode"
        >
          <ProdeTextarea
            defaultValue={initialValues.prodeSubgroup}
            id="subgrupo"
            name="prode_subgroup"
            placeholder="Ej. Los que miran todos los partidos juntos"
          />
        </ProdeField>

        {state.message ? (
          <p
            className="prode-frame bg-prode-surface px-3 py-2 font-technical text-sm font-bold uppercase"
            role={state.status === "error" ? "alert" : "status"}
          >
            {state.message}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <ProdeButton
            className="flex-1"
            disabled={isPending}
            size="large"
            type="submit"
            variant={showSavedState && isSaved ? "ink" : "primary"}
          >
            {isPending ? (
              <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
            ) : null}
            {!isPending && showSavedState && isSaved && (
              <Check aria-hidden="true" className="size-5" />
            )}
            {isPending ? "Guardando..." : buttonLabel}
          </ProdeButton>
          {secondaryAction}
        </div>
      </form>
    </ProdeCard>
  );
}
