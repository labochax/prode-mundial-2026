"use client";

import type { ReactNode } from "react";
import { useActionState, useEffect, useMemo, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";

import { ProdeButton } from "@/components/prode/prode-button";
import { ProdeCard } from "@/components/prode/prode-card";
import {
  ProdeField,
  ProdeInput,
} from "@/components/prode/prode-field";
import {
  defaultProfileFormValues,
  initialProfileActionState,
  type ProfileActionState,
  type ProfileAvatarSelection,
  type ProfileFormValues,
} from "@/lib/profiles/profile-form";
import { normalizeProfileSuggestionKey } from "@/lib/profiles/profile-normalization";
import {
  emptyProfileSuggestions,
  type ProfileSuggestions,
} from "@/lib/profiles/profile-suggestions";

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
  suggestions?: ProfileSuggestions;
};

const suggestionListIds = {
  city: "profile-ciudad-sugerencias",
  country: "profile-pais-sugerencias",
  favoriteTeam: "profile-club-sugerencias",
  graduationYearOrCategory: "profile-egreso-sugerencias",
  prodeSubgroups: "profile-subgrupos-sugerencias",
  province: "profile-provincia-sugerencias",
  schoolGroup: "profile-colegio-sugerencias",
} as const;

function SuggestionList({
  id,
  values,
}: {
  id: string;
  values: string[];
}) {
  if (values.length === 0) {
    return null;
  }

  return (
    <datalist id={id}>
      {values.map((value) => (
        <option key={value} value={value} />
      ))}
    </datalist>
  );
}

function mergeSuggestionValues(values: string[]) {
  const valueMap = new Map<string, string>();

  for (const value of values) {
    const normalizedValue = value.trim().replace(/\s+/g, " ");

    if (!normalizedValue) {
      continue;
    }

    valueMap.set(normalizeProfileSuggestionKey(normalizedValue), normalizedValue);
  }

  return [...valueMap.values()].sort((left, right) =>
    left.localeCompare(right, "es-AR"),
  );
}

function mergeCurrentProfileSuggestions(
  suggestions: ProfileSuggestions,
  initialValues: ProfileFormValues,
) {
  return {
    cities: mergeSuggestionValues([initialValues.city, ...suggestions.cities]),
    countries: mergeSuggestionValues([
      initialValues.country,
      ...suggestions.countries,
    ]),
    favoriteTeams: mergeSuggestionValues([
      initialValues.favoriteTeam,
      ...suggestions.favoriteTeams,
    ]),
    graduationYearsOrCategories: mergeSuggestionValues([
      initialValues.graduationYearOrCategory,
      ...suggestions.graduationYearsOrCategories,
    ]),
    prodeSubgroups: mergeSuggestionValues([
      ...initialValues.prodeSubgroups,
      initialValues.prodeSubgroup,
      ...suggestions.prodeSubgroups,
    ]),
    provinces: mergeSuggestionValues([
      initialValues.province,
      ...suggestions.provinces,
    ]),
    schoolGroups: mergeSuggestionValues([
      initialValues.schoolGroup,
      ...suggestions.schoolGroups,
    ]),
  } satisfies ProfileSuggestions;
}

function getCountryOptions(suggestions: ProfileSuggestions) {
  const baseOptions = [
    "Argentina",
    "Uruguay",
    "Chile",
    "Paraguay",
    "Brasil",
    "Bolivia",
    "Perú",
    "Colombia",
    "México",
    "Estados Unidos",
    "Canadá",
    "España",
    "Alemania",
    "Francia",
    "Italia",
    "Inglaterra",
    "Japón",
  ];
  const optionMap = new Map<string, string>();

  for (const option of [...baseOptions, ...suggestions.countries]) {
    optionMap.set(normalizeProfileSuggestionKey(option), option);
  }

  return [...optionMap.values()];
}

export function ProfileFormSection({
  action,
  avatarSelection,
  formLabel = "Perfil del jugador",
  initialValues = defaultProfileFormValues,
  savedLabel = "Cambios guardados",
  secondaryAction,
  showSavedState = false,
  submitLabel = "Listo para jugar",
  suggestions = emptyProfileSuggestions,
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
  const formSuggestions = useMemo(
    () => mergeCurrentProfileSuggestions(suggestions, initialValues),
    [initialValues, suggestions],
  );
  const countryOptions = useMemo(
    () => getCountryOptions(formSuggestions),
    [formSuggestions],
  );

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
            label="Club"
          >
            <ProdeInput
              defaultValue={initialValues.favoriteTeam}
              id="club-favorito"
              list={suggestionListIds.favoriteTeam}
              name="favorite_team"
              autoComplete="off"
              placeholder="Ej. Argentinos Juniors"
            />
          </ProdeField>

          <ProdeField htmlFor="colegio-grupo" label="Colegio">
            <ProdeInput
              defaultValue={initialValues.schoolGroup}
              id="colegio-grupo"
              list={suggestionListIds.schoolGroup}
              name="school_group"
              autoComplete="off"
              placeholder="Ej. Promo del colegio"
            />
          </ProdeField>

          <ProdeField
            htmlFor="egreso-categoria"
            label="Año de egreso"
          >
            <ProdeInput
              defaultValue={initialValues.graduationYearOrCategory}
              id="egreso-categoria"
              list={suggestionListIds.graduationYearOrCategory}
              name="graduation_year_or_category"
              autoComplete="off"
              placeholder="Ej. 2012"
            />
          </ProdeField>

          <ProdeField htmlFor="pais" label="País">
            <ProdeInput
              defaultValue={initialValues.country}
              id="pais"
              list={suggestionListIds.country}
              name="country"
              autoComplete="off"
              placeholder="Argentina"
            />
          </ProdeField>

          <ProdeField htmlFor="provincia" label="Provincia">
            <ProdeInput
              defaultValue={initialValues.province}
              id="provincia"
              list={suggestionListIds.province}
              name="province"
              autoComplete="off"
              placeholder="Buenos Aires"
            />
          </ProdeField>

          <ProdeField className="md:col-span-2" htmlFor="ciudad" label="Ciudad">
            <ProdeInput
              defaultValue={initialValues.city}
              id="ciudad"
              list={suggestionListIds.city}
              name="city"
              autoComplete="off"
              placeholder="La Plata"
            />
          </ProdeField>
        </div>

        <section className="prode-frame grid gap-4 bg-[#f7f4df] p-4">
          <div>
            <h2 className="font-display text-3xl uppercase leading-none">
              Subgrupos
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Podés sumar hasta 3 grupos para competir con amigos, familia,
              trabajo o cualquier grupo propio.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <ProdeField htmlFor="subgrupo-principal" label="Subgrupo principal">
              <ProdeInput
                defaultValue={initialValues.prodeSubgroups[0]}
                id="subgrupo-principal"
                list={suggestionListIds.prodeSubgroups}
                name="prode_subgroup_1"
                autoComplete="off"
                placeholder="Ej. Amigos del colegio"
              />
            </ProdeField>

            <ProdeField htmlFor="subgrupo-2" label="Subgrupo 2">
              <ProdeInput
                defaultValue={initialValues.prodeSubgroups[1]}
                id="subgrupo-2"
                list={suggestionListIds.prodeSubgroups}
                name="prode_subgroup_2"
                autoComplete="off"
                placeholder="Ej. Familia"
              />
            </ProdeField>

            <ProdeField htmlFor="subgrupo-3" label="Subgrupo 3">
              <ProdeInput
                defaultValue={initialValues.prodeSubgroups[2]}
                id="subgrupo-3"
                list={suggestionListIds.prodeSubgroups}
                name="prode_subgroup_3"
                autoComplete="off"
                placeholder="Ej. Trabajo"
              />
            </ProdeField>
          </div>

        </section>

        <SuggestionList
          id={suggestionListIds.favoriteTeam}
          values={formSuggestions.favoriteTeams}
        />
        <SuggestionList
          id={suggestionListIds.schoolGroup}
          values={formSuggestions.schoolGroups}
        />
        <SuggestionList
          id={suggestionListIds.graduationYearOrCategory}
          values={formSuggestions.graduationYearsOrCategories}
        />
        <SuggestionList id={suggestionListIds.country} values={countryOptions} />
        <SuggestionList
          id={suggestionListIds.province}
          values={formSuggestions.provinces}
        />
        <SuggestionList id={suggestionListIds.city} values={formSuggestions.cities} />
        <SuggestionList
          id={suggestionListIds.prodeSubgroups}
          values={formSuggestions.prodeSubgroups}
        />

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
