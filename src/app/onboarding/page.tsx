import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";
import { AvatarPicker } from "@/components/onboarding/avatar-picker";
import { ProfileFormSection } from "@/components/onboarding/profile-form-section";
import { ProdeBadge } from "@/components/prode/prode-badge";

export default function OnboardingPage() {
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
      <div className="grid gap-6 xl:grid-cols-[minmax(18rem,0.84fr)_minmax(32rem,1.2fr)]">
        <AvatarPicker />
        <ProfileFormSection />
      </div>
    </AuthenticatedAppShell>
  );
}
