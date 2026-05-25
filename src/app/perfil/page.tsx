import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";

import { updateCurrentProfileAction } from "@/app/actions/profile";
import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";
import { ProfileEditor } from "@/components/onboarding/profile-editor";
import { ProdeBadge } from "@/components/prode/prode-badge";
import { prodeButtonVariants } from "@/components/prode/prode-button";
import { getProfileFormValues } from "@/lib/profiles/profile-form";
import { ensureCurrentProfile } from "@/lib/supabase/profile-bootstrap";
import { getProfileSuggestions } from "@/lib/supabase/queries/profile-suggestions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const profileState = await ensureCurrentProfile(supabase);

  if (!profileState) {
    redirect("/login");
  }

  const initialValues = getProfileFormValues(profileState.profile);
  const profileSuggestions = await getProfileSuggestions(supabase);

  return (
    <AuthenticatedAppShell
      header={
        <section className="max-w-5xl space-y-4">
          <ProdeBadge variant="ink">Edición de perfil</ProdeBadge>
          <div className="space-y-3">
            <h1 className="font-display text-6xl uppercase leading-[0.92] text-prode-black sm:text-7xl lg:text-8xl">
              Mi <span className="bg-prode-yellow px-2">Jugador</span>
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Editá tu identidad para el Prode.
            </p>
          </div>
        </section>
      }
    >
      <ProfileEditor
        action={updateCurrentProfileAction}
        avatarBadgeLabel="Avatar actual"
        avatarDescription="Cambiá la cara que aparece en el ranking, el panel y tu perfil del Prode."
        avatarTitle="Editá tu avatar"
        formLabel="Editar mi jugador"
        initialValues={initialValues}
        savedLabel="Cambios guardados"
        suggestions={profileSuggestions}
        secondaryAction={
          <Link
            className={cn(
              prodeButtonVariants({
                className: "flex-1 bg-prode-surface hover:bg-[#fff7b5]",
                size: "large",
                variant: "surface",
              }),
            )}
            href="/dashboard"
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
            Volver al panel
          </Link>
        }
        showSavedState
        submitLabel="Guardar cambios"
      />
    </AuthenticatedAppShell>
  );
}
