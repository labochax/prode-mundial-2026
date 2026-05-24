import { redirect } from "next/navigation";

import { completeOnboardingProfileAction } from "@/app/actions/profile";
import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";
import { ProfileEditor } from "@/components/onboarding/profile-editor";
import { ProdeBadge } from "@/components/prode/prode-badge";
import { getProfileFormValues } from "@/lib/profiles/profile-form";
import { ensureCurrentProfile } from "@/lib/supabase/profile-bootstrap";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const profileState = await ensureCurrentProfile(supabase);

  if (!profileState) {
    redirect("/login");
  }

  if (profileState.profile.onboarding_completed) {
    redirect("/dashboard");
  }

  const initialValues = getProfileFormValues(profileState.profile);

  return (
    <AuthenticatedAppShell
      header={
        <section className="max-w-5xl space-y-4">
          <ProdeBadge variant="ink">Configuración inicial</ProdeBadge>
          <div className="space-y-3">
            <h1 className="font-display text-6xl uppercase leading-[0.92] text-prode-black sm:text-7xl lg:text-8xl">
              Crea tu <span className="bg-prode-yellow px-2">Jugador</span>
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Prepará tu identidad para entrar al Prode del Mundial con el
              grupo.
            </p>
          </div>
        </section>
      }
    >
      <ProfileEditor
        action={completeOnboardingProfileAction}
        initialValues={initialValues}
        submitLabel="Listo para jugar"
      />
    </AuthenticatedAppShell>
  );
}
