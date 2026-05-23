import { ProdeBadge } from "@/components/prode/prode-badge";

export function DashboardHeader() {
  return (
    <section className="border-b-[3px] border-prode-black pb-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-5">
          <h1 className="font-display text-6xl uppercase leading-[0.9] tracking-normal text-prode-black sm:text-7xl lg:text-8xl">
            Próximos
            <br />
            <span className="inline-block bg-prode-yellow px-3 pb-1">
              Partidos
            </span>
          </h1>

          <div className="prode-frame inline-flex items-center gap-3 bg-prode-surface px-3 py-2 shadow-[4px_4px_0_var(--prode-black)]">
            <span
              aria-hidden="true"
              className="size-3 rounded-full border-[3px] border-prode-black bg-prode-yellow motion-safe:animate-pulse"
            />
            <span className="font-technical text-xs font-bold uppercase">
              Fase de grupos - Fecha de muestra
            </span>
          </div>
        </div>

        <ProdeBadge className="w-fit" variant="surface">
          Datos de prueba
        </ProdeBadge>
      </div>
    </section>
  );
}
