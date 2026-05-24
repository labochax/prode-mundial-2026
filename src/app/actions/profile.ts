"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  defaultProfileFormValues,
  type ProfileActionState,
  profileAvatarKinds,
} from "@/lib/profiles/profile-form";
import { stitchAvatarAssets } from "@/lib/design/stitch-assets";
import { ensureCurrentProfile } from "@/lib/supabase/profile-bootstrap";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const optionalText = (maxLength = 120) =>
  z
    .string()
    .trim()
    .max(maxLength, `Máximo ${maxLength} caracteres.`)
    .transform((value) => (value.length > 0 ? value : null));

const profileFormSchema = z.object({
  age: z
    .union([
      z.literal(""),
      z.coerce
        .number({
          error: "La edad debe ser un número.",
        })
        .int("La edad debe ser un número entero.")
        .min(1, "La edad debe ser mayor a 0.")
        .max(120, "La edad debe ser 120 o menos."),
    ])
    .transform((value) => (value === "" ? null : value)),
  avatar_kind: z.enum(profileAvatarKinds, {
    error: "Elegí un tipo de avatar válido.",
  }),
  avatar_value: z.string().trim().max(500, "El avatar seleccionado no es válido."),
  city: optionalText(100),
  country: z
    .string()
    .trim()
    .min(2, "Indicá un país.")
    .max(80, "Máximo 80 caracteres."),
  display_name: z
    .string()
    .trim()
    .min(2, "Indicá un nombre visible.")
    .max(60, "Máximo 60 caracteres."),
  favorite_team: optionalText(100),
  first_name: optionalText(80),
  graduation_year_or_category: optionalText(80),
  last_name: optionalText(80),
  prode_subgroup: optionalText(240),
  province: optionalText(100),
  school_group: optionalText(120),
});

const stitchAvatarIds = new Set<string>(
  stitchAvatarAssets.map((avatar) => avatar.id),
);

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getProfilePayload(formData: FormData) {
  return {
    age: getString(formData, "age"),
    avatar_kind: getString(formData, "avatar_kind"),
    avatar_value: getString(formData, "avatar_value"),
    city: getString(formData, "city"),
    country: getString(formData, "country"),
    display_name: getString(formData, "display_name"),
    favorite_team: getString(formData, "favorite_team"),
    first_name: getString(formData, "first_name"),
    graduation_year_or_category: getString(formData, "graduation_year_or_category"),
    last_name: getString(formData, "last_name"),
    prode_subgroup: getString(formData, "prode_subgroup"),
    province: getString(formData, "province"),
    school_group: getString(formData, "school_group"),
  };
}

function getValidationErrorState(error: z.ZodError): ProfileActionState {
  const fieldErrors = error.flatten().fieldErrors;
  const firstError = Object.values(fieldErrors)
    .flat()
    .find((value): value is string => typeof value === "string");

  return {
    fieldErrors,
    message: firstError ?? "Revisá los datos del jugador.",
    status: "error",
  };
}

function getErrorState(message: string): ProfileActionState {
  return {
    message,
    status: "error",
  };
}

async function saveCurrentProfile(
  formData: FormData,
  options: {
    completeOnboarding: boolean;
  },
): Promise<ProfileActionState> {
  const parsed = profileFormSchema.safeParse(getProfilePayload(formData));

  if (!parsed.success) {
    return getValidationErrorState(parsed.error);
  }

  const supabase = await createSupabaseServerClient();
  const current = await ensureCurrentProfile(supabase);

  if (!current) {
    return getErrorState("No hay una sesión activa. Volvé a ingresar para guardar tu jugador.");
  }

  let avatarKind = parsed.data.avatar_kind;
  let avatarValue = parsed.data.avatar_value;

  if (avatarKind === "stitch") {
    if (!stitchAvatarIds.has(avatarValue)) {
      avatarValue = defaultProfileFormValues.avatarValue;
    }
  }

  if (avatarKind === "google") {
    if (!current.profile.google_avatar_url) {
      avatarKind = "stitch";
      avatarValue = defaultProfileFormValues.avatarValue;
    } else {
      avatarValue = current.profile.google_avatar_url;
    }
  }

  if (avatarKind === "upload") {
    return getErrorState("La subida de imagen todavía no está disponible.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      age: parsed.data.age,
      avatar_kind: avatarKind,
      avatar_value: avatarValue,
      city: parsed.data.city,
      country: parsed.data.country,
      display_name: parsed.data.display_name,
      favorite_team: parsed.data.favorite_team,
      first_name: parsed.data.first_name,
      graduation_year_or_category: parsed.data.graduation_year_or_category,
      last_name: parsed.data.last_name,
      onboarding_completed: options.completeOnboarding
        ? true
        : current.profile.onboarding_completed,
      prode_subgroup: parsed.data.prode_subgroup,
      province: parsed.data.province,
      school_group: parsed.data.school_group,
    })
    .eq("id", current.user.id);

  if (error) {
    return getErrorState("No pudimos guardar el perfil. Probá de nuevo.");
  }

  revalidatePath("/onboarding");
  revalidatePath("/perfil");
  revalidatePath("/dashboard");

  return {
    message: options.completeOnboarding ? "Jugador creado." : "Cambios guardados",
    status: "success",
  };
}

export async function completeOnboardingProfileAction(
  _previousState: ProfileActionState,
  formData: FormData,
) {
  const state = await saveCurrentProfile(formData, {
    completeOnboarding: true,
  });

  if (state.status === "success") {
    redirect("/dashboard");
  }

  return state;
}

export async function updateCurrentProfileAction(
  _previousState: ProfileActionState,
  formData: FormData,
) {
  return saveCurrentProfile(formData, {
    completeOnboarding: false,
  });
}
