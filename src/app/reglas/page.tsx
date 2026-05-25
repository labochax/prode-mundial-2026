import { Medal, ShieldCheck, Target, Trophy } from "lucide-react";

import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";
import { ProdeBadge } from "@/components/prode/prode-badge";
import { RulesCard } from "@/components/rules/rules-card";

const scoringRules = [
  {
    points: "3",
    title: "Resultado exacto",
    text: "Acertás los goles de ambos equipos.",
  },
  {
    points: "1",
    title: "Resultado general",
    text: "Acertás ganador o empate, aunque no el marcador.",
  },
  {
    points: "0",
    title: "Pronóstico errado",
    text: "No coincide ni el ganador ni el empate.",
  },
] as const;

const bonusRules = [
  "Equipo correcto en Octavos: +1",
  "Equipo correcto en Cuartos: +1",
  "Equipo correcto en Semifinales: +2",
  "Campeón exacto: +10",
  "Subcampeón exacto: +5",
  "3.º puesto exacto: +3",
  "4.º puesto exacto: +2",
] as const;

export default function RulesPage() {
  return (
    <AuthenticatedAppShell
      className="max-w-[88rem]"
      eyebrow="Manual del juego"
      title="Reglas del Prode"
      description="Reglas para cargar pronósticos, armar Mi Mundial y competir por puntos partido a partido y bonus pre-torneo."
    >
      <section
        aria-label="Sistema de puntaje"
        className="grid grid-cols-1 gap-5 lg:grid-cols-3"
      >
        {scoringRules.map((rule) => (
          <article
            className="prode-frame prode-hard-shadow bg-prode-surface p-5"
            key={rule.points}
          >
            <div className="flex items-start justify-between gap-4">
              <ProdeBadge variant={rule.points === "3" ? "primary" : "surface"}>
                {rule.points === "1" ? "1 punto" : `${rule.points} puntos`}
              </ProdeBadge>
              <Target aria-hidden="true" className="size-7 stroke-[3]" />
            </div>
            <h2 className="mt-5 font-display text-3xl uppercase leading-none">
              {rule.title}
            </h2>
            <p className="mt-3 leading-7 text-muted-foreground">{rule.text}</p>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <RulesCard eyebrow="Bloqueo" title="Cada partido cierra solo">
          <p>
            Las predicciones se bloquean por partido, no de manera global. El
            cierre actual es 10 minutos antes del inicio de cada partido.
          </p>
        </RulesCard>

        <RulesCard eyebrow="Edición" title="Cambios hasta el cierre">
          <p>
            Podés editar tu pronóstico todas las veces que quieras hasta que ese
            partido quede bloqueado.
          </p>
        </RulesCard>

        <RulesCard eyebrow="Visibilidad" title="Pronósticos visibles al cerrar">
          <p>
            Cuando un partido queda bloqueado, las predicciones de los demás
            jugadores para ese partido pasan a estar visibles.
          </p>
        </RulesCard>
      </section>

      <section className="prode-frame prode-hard-shadow bg-prode-yellow p-5 text-prode-black sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[auto_1fr] lg:items-start">
          <div className="flex size-16 items-center justify-center border-[3px] border-prode-black bg-prode-surface">
            <Trophy aria-hidden="true" className="size-9 stroke-[3]" />
          </div>
          <div>
            <ProdeBadge variant="surface">Mi Mundial</ProdeBadge>
            <h2 className="mt-4 font-display text-4xl uppercase leading-none sm:text-5xl">
              Armá tu Mundial antes de que empiece
            </h2>
            <p className="mt-3 max-w-5xl leading-7">
              En Mi Mundial proyectás tus grupos, mejores terceros y cruces de
              eliminación según tus propios pronósticos. Después completás la
              llave hasta definir campeón, subcampeón, tercer y cuarto puesto.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RulesCard
          eyebrow="Cierre pre-torneo"
          title="La llave completa se bloquea al inicio del Mundial"
        >
          <p>
            La predicción completa de Mi Mundial se puede editar hasta el inicio
            del primer partido del torneo. Después queda bloqueada y visible para
            competir por bonus.
          </p>
        </RulesCard>

        <RulesCard eyebrow="Equilibrio" title="El Prode se sigue jugando partido a partido">
          <p>
            El bonus premia una gran predicción inicial, pero no reemplaza el
            juego diario. Aunque falles la llave, todavía podés competir sumando
            puntos en cada partido.
          </p>
        </RulesCard>
      </section>

      <section className="prode-frame prode-hard-shadow bg-prode-surface p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <ProdeBadge variant="primary">Bonus</ProdeBadge>
            <h2 className="mt-4 font-display text-4xl uppercase leading-none sm:text-5xl">
              Puntos bonus por Mi Mundial
            </h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              Además de los puntos partido a partido, podés sumar bonus si tu
              llave pre-torneo acierta equipos en instancias decisivas.
            </p>
          </div>
          <div className="flex size-16 shrink-0 items-center justify-center border-[3px] border-prode-black bg-prode-yellow">
            <Medal aria-hidden="true" className="size-9 stroke-[3]" />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {bonusRules.map((rule) => (
            <div
              className="prode-frame bg-[#f7f4df] px-4 py-3 font-technical text-sm font-black uppercase"
              key={rule}
            >
              {rule}
            </div>
          ))}
        </div>

        <p className="mt-5 border-t-[3px] border-prode-black pt-4 font-technical text-sm font-black uppercase">
          No hay bonus por llegar a 16avos: esa ronda sirve como punto de partida
          de la llave.
        </p>
      </section>

      <RulesCard eyebrow="Penales" title="En eliminatorias importa quién avanza">
        <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
          <div className="flex size-14 items-center justify-center border-[3px] border-prode-black bg-prode-yellow">
            <ShieldCheck aria-hidden="true" className="size-7 stroke-[3]" />
          </div>
          <p>
            Para la llave de Mi Mundial no hace falta predecir penales ni
            marcador exacto: elegís qué equipo avanza. Los partidos reales de
            eliminación siguen pudiendo pronosticarse por resultado como
            cualquier otro partido.
          </p>
        </div>
      </RulesCard>
    </AuthenticatedAppShell>
  );
}
