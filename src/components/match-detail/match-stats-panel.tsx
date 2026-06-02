import { Building2, CalendarClock, Flag, MapPin, TrendingUp } from "lucide-react";

import { ProdeBadge } from "@/components/prode/prode-badge";
import type { PredictionMatch } from "@/lib/matches/prediction-match";

type MatchStatsPanelProps = {
  match: PredictionMatch;
};

type BarRowProps = {
  code: string;
  label: string;
  tone: "draw" | "home" | "away";
  value: number;
};

const toneClassName = {
  away: "bg-[#e5e3ce]",
  draw: "bg-[#f1efd9]",
  home: "bg-prode-yellow",
} as const;

function BarRow({ code, label, tone, value }: BarRowProps) {
  return (
    <div className="grid grid-cols-[3.25rem_1fr_2.5rem] items-center gap-2">
      <span className="font-technical text-sm font-black tabular-nums">
        {value}%
      </span>
      <div className="relative h-7 border-[3px] border-prode-black bg-prode-surface">
        <div
          className={`absolute inset-y-0 left-0 border-r-[3px] border-prode-black ${toneClassName[tone]}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-right font-technical text-[0.68rem] font-bold uppercase">
        {code}
      </span>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function MatchStatsPanel({ match }: MatchStatsPanelProps) {
  const directHistory = match.detail.directHistory;
  const tendency = match.tendency.distribution;
  const totalHistory = directHistory
    ? directHistory.home + directHistory.draw + directHistory.away
    : 0;
  const metadataItems = [
    {
      icon: Building2,
      label: "Estadio",
      value: match.detail.metadata.stadium,
    },
    {
      icon: MapPin,
      label: "Ciudad",
      value: match.detail.metadata.city,
    },
    {
      icon: CalendarClock,
      label: "Fecha / hora",
      value: match.detail.metadata.dateTime,
    },
    {
      icon: Flag,
      label: "Grupo / fase",
      value: match.detail.metadata.groupPhase,
    },
  ] as const;

  return (
    <aside className="prode-frame prode-hard-shadow bg-prode-surface p-5 sm:p-6">
      <div className="mb-6 flex items-center justify-between gap-3 border-b-[3px] border-prode-black pb-3">
        <h2 className="font-display text-4xl uppercase leading-none">Stats</h2>
        <TrendingUp aria-hidden="true" className="size-8 stroke-[2.5]" />
      </div>

      <div className="space-y-8">
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-technical text-xs font-bold uppercase">
              Historial directo
            </h3>
            <ProdeBadge variant="surface">
              {directHistory ? "Fuente real" : "Sin datos"}
            </ProdeBadge>
          </div>

          {directHistory && totalHistory > 0 ? (
            <>
              <div className="flex h-10 border-[3px] border-prode-black bg-prode-surface">
                <div
                  className="flex items-center justify-center border-r-[3px] border-prode-black bg-prode-yellow font-technical text-sm font-black"
                  style={{ width: `${(directHistory.home / totalHistory) * 100}%` }}
                >
                  {directHistory.home}
                </div>
                <div
                  className="flex items-center justify-center border-r-[3px] border-prode-black bg-[#e5e3ce] font-technical text-sm font-black"
                  style={{ width: `${(directHistory.draw / totalHistory) * 100}%` }}
                >
                  {directHistory.draw}
                </div>
                <div
                  className="flex items-center justify-center bg-prode-surface font-technical text-sm font-black"
                  style={{ width: `${(directHistory.away / totalHistory) * 100}%` }}
                >
                  {directHistory.away}
                </div>
              </div>

              <div className="mt-2 flex justify-between font-technical text-[0.68rem] font-bold uppercase">
                <span>{match.home.code}</span>
                <span>Emp</span>
                <span>{match.away.code}</span>
              </div>
            </>
          ) : (
            <p className="border-[3px] border-dashed border-prode-black p-3 font-technical text-xs font-bold uppercase text-muted-foreground">
              Historial directo no disponible.
            </p>
          )}
        </section>

        <section>
          <h3 className="mb-3 font-technical text-xs font-bold uppercase">
            Tendencia Prode
          </h3>
          {tendency ? (
            <div className="space-y-3">
              <BarRow
                code={match.home.code}
                label={`Tendencia para ${match.home.name}`}
                tone="home"
                value={tendency.home}
              />
              <BarRow
                code="EMP"
                label="Tendencia para empate"
                tone="draw"
                value={tendency.draw}
              />
              <BarRow
                code={match.away.code}
                label={`Tendencia para ${match.away.name}`}
                tone="away"
                value={tendency.away}
              />
            </div>
          ) : (
            <p className="border-[3px] border-dashed border-prode-black p-3 font-technical text-xs font-bold uppercase text-muted-foreground">
              {match.tendency.status === "hidden-until-lock"
                ? "La tendencia se habilita cuando cierre el partido."
                : "Todavía no hay suficientes pronósticos."}
            </p>
          )}
        </section>

        <section className="border-t-[3px] border-dashed border-prode-black pt-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-technical text-xs font-bold uppercase">
              Datos del partido
            </h3>
            <ProdeBadge
              variant={
                match.detail.metadata.venueStatus === "official-fixture"
                  ? "primary"
                  : "surface"
              }
            >
              {match.detail.metadata.venueStatus === "official-fixture"
                ? "Fixture oficial"
                : "Pendiente"}
            </ProdeBadge>
          </div>
          <ul className="space-y-4">
            {metadataItems.map(({ icon: Icon, label, value }) => (
              <li className="flex items-start gap-3" key={label}>
                <Icon aria-hidden="true" className="mt-1 size-5 shrink-0" />
                <div>
                  <p className="font-technical text-xs font-bold uppercase text-muted-foreground">
                    {label}
                  </p>
                  <p className="font-technical text-sm font-black uppercase leading-tight">
                    {value}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </aside>
  );
}
