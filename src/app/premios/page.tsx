import { Sparkles } from "lucide-react";

import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";
import { PrizeCard } from "@/components/prizes/prize-card";
import { ProdeBadge } from "@/components/prode/prode-badge";

type FantasyPrize = {
  rewardFor: string;
  seat?: string;
  title: string;
};

const fantasyPrizes: FantasyPrize[] = [
  {
    title: "Entrada Platea Fantasma — Argentina vs Inglaterra, México 1986",
    seat: "Fila 10, Asiento D10S",
    rewardFor: "Campeón global",
  },
  {
    title: "Pase VIP al Gol Imposible — Argentina vs Francia, Qatar 2022",
    seat: "Tribuna del infarto, minuto 108",
    rewardFor: "Mayor cantidad de resultados exactos",
  },
  {
    title: "Ticket Multiversal al Maracanazo — Uruguay vs Brasil, 1950",
    seat: "Sector silencio absoluto",
    rewardFor: "Mejor remontada en la tabla",
  },
  {
    title: "Abono al VAR del destino",
    rewardFor: "Predicción más absurda que terminó saliendo",
  },
  {
    title: "Medalla Anti-Mufa",
    rewardFor: "Último lugar con dignidad",
  },
] as const;

export default function PrizesPage() {
  return (
    <AuthenticatedAppShell
      className="max-w-[88rem]"
      eyebrow="Recompensas imposibles"
      title="Premios Fantasma"
      description="Recompensas imposibles para campeones del Prode. Todo sucede dentro del universo del juego."
    >
      <section className="prode-frame prode-hard-shadow relative overflow-hidden bg-prode-yellow p-5 sm:p-6">
        <div
          aria-hidden="true"
          className="absolute bottom-0 right-0 font-display text-[9rem] leading-none text-prode-black opacity-10"
        >
          90
        </div>
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <ProdeBadge variant="ink">Fantasía pura</ProdeBadge>
            <h2 className="mt-4 font-display text-4xl uppercase leading-none sm:text-5xl">
              No hay premios reales
            </h2>
          </div>
          <p className="max-w-xl font-technical text-base font-bold uppercase leading-7">
            Premios de fantasía. No válidos para abordar máquinas del tiempo.
          </p>
        </div>
      </section>

      <section
        aria-label="Listado de premios fantasma"
        className="grid grid-cols-1 gap-6 xl:grid-cols-2"
      >
        {fantasyPrizes.map((prize, index) => (
          <PrizeCard
            className={index === 0 ? "xl:col-span-2" : undefined}
            key={prize.title}
            rewardFor={prize.rewardFor}
            seat={prize.seat}
            title={prize.title}
          />
        ))}
      </section>

      <section className="prode-frame bg-prode-surface p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <Sparkles aria-hidden="true" className="size-7 stroke-[3]" />
          <h2 className="font-display text-3xl uppercase leading-none">
            Comité imaginario
          </h2>
        </div>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          Las categorías pueden cambiar cuando el grupo defina sus chistes
          internos. Por ahora son tarjetas locales sin valor legal ni
          persistencia.
        </p>
      </section>
    </AuthenticatedAppShell>
  );
}
