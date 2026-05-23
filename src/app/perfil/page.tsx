import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";
import { AvatarPicker } from "@/components/onboarding/avatar-picker";
import { ProfileFormSection } from "@/components/onboarding/profile-form-section";
import { ProdeBadge } from "@/components/prode/prode-badge";
import { prodeButtonVariants } from "@/components/prode/prode-button";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
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
      <div className="grid gap-6 xl:grid-cols-[minmax(18rem,0.84fr)_minmax(32rem,1.2fr)]">
        <AvatarPicker
          badgeLabel="Avatar actual"
          description="Cambiá la cara que aparece en el ranking, el panel y tu perfil del Prode."
          title="Editá tu avatar"
        />
        <ProfileFormSection
          formLabel="Editar mi jugador"
          savedLabel="Cambios guardados"
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
      </div>
    </AuthenticatedAppShell>
  );
}
