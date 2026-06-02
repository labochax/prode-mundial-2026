import { ProdeBadge } from "@/components/prode/prode-badge";
import type { ActiveMatchSource } from "@/lib/supabase/queries/matches";

type DashboardHeaderProps = {
  source: ActiveMatchSource;
};

export function DashboardHeader({ source }: DashboardHeaderProps) {
  const isOfficial = source === "official";

  return (
    <section className="border-b-[3px] border-prode-black pb-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-5">
          <h1 className="font-display text-6xl uppercase leading-[0.9] tracking-normal text-prode-black sm:text-7xl lg:text-8xl">
            Predicciones
            <br />
            <span className="inline-block bg-prode-yellow px-3 pb-1">
              por partido
            </span>
          </h1>

          <div className="max-w-3xl space-y-2 font-body text-sm leading-6 text-muted-foreground sm:text-base">
            <p>
              Cargá el marcador exacto de cada partido real. Resultado exacto
              suma 3 puntos; ganador o empate correcto suma 1 punto. Podés
              editar cada partido hasta su cierre.
            </p>
            <p>Cargá varios resultados y guardalos todos juntos con el botón inferior.</p>
            <p className="font-technical text-xs font-black uppercase text-prode-black">
              Tip: tocá un escudo para completar rápido un resultado.
            </p>
          </div>

          <div className="prode-frame inline-flex items-center gap-3 bg-prode-surface px-3 py-2 shadow-[4px_4px_0_var(--prode-black)]">
            <span
              aria-hidden="true"
              className="size-3 rounded-full border-[3px] border-prode-black bg-prode-yellow motion-safe:animate-pulse"
            />
            <span className="font-technical text-xs font-bold uppercase">
              {isOfficial
                ? "Calendario oficial - Football-Data"
                : "Fase de grupos - Fecha de muestra"}
            </span>
          </div>
        </div>

        <ProdeBadge className="w-fit" variant="surface">
          {isOfficial ? "Fixtures oficiales" : "Datos de prueba"}
        </ProdeBadge>
      </div>
    </section>
  );
}
