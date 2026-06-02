"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import type {
  SavePredictionActionState,
  SavePredictionsBatchActionState,
} from "@/app/actions/predictions";
import { DashboardBatchSaveBar } from "@/components/dashboard/dashboard-batch-save-bar";
import { MatchPredictionCard } from "@/components/dashboard/match-prediction-card";
import {
  buildBatchPredictionPayload,
  getDirtyPredictionIds,
  mergeBatchSaveResult,
  type DashboardPredictionMap,
  type DashboardPredictionValue,
} from "@/lib/dashboard/batch-predictions";
import {
  type DashboardStageDisplay,
  groupDashboardStageItems,
} from "@/lib/matches/dashboard-stage";
import type { PredictionMatch } from "@/lib/matches/prediction-match";
import { shouldConfirmUnsavedNavigation } from "@/lib/dashboard/unsaved-navigation";
import { cn } from "@/lib/utils";

export type DashboardFixtureListItem = {
  groupCode: string | null;
  match: PredictionMatch;
  stage: DashboardStageDisplay;
};

type DashboardFixtureListProps = {
  items: DashboardFixtureListItem[];
  saveBatchAction: (
    formData: FormData,
  ) => Promise<SavePredictionsBatchActionState>;
  saveAction: (
    previousState: SavePredictionActionState,
    formData: FormData,
  ) => Promise<SavePredictionActionState>;
};

type DashboardFixtureFilter = {
  count: number;
  key: string;
  kind: "all" | "group" | "stage";
  label: string;
  order: number;
  value: string;
};

const allFilter = {
  count: 0,
  key: "all",
  kind: "all",
  label: "Todos",
  order: 0,
  value: "all",
} as const satisfies DashboardFixtureFilter;

const stageFilterLabels: Record<string, { label: string; order: number }> = {
  final: {
    label: "Final",
    order: 80,
  },
  "quarter-finals": {
    label: "Cuartos",
    order: 50,
  },
  "round-16": {
    label: "Octavos",
    order: 40,
  },
  "round-32": {
    label: "16avos",
    order: 30,
  },
  "round-64": {
    label: "16avos",
    order: 20,
  },
  "semi-finals": {
    label: "Semifinales",
    order: 60,
  },
  "third-place": {
    label: "3.º Puesto",
    order: 70,
  },
};

function normalizeFilterValue(value: string | null) {
  return (value ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getGroupDisplayValue(groupCode: string | null) {
  const normalized = normalizeFilterValue(groupCode);

  if (!normalized) {
    return null;
  }

  return normalized
    .replace(/^GROUP_/, "")
    .replace(/^GRUPO_/, "")
    .replace(/^GR_/, "");
}

function getGroupOrder(groupValue: string) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const firstLetter = groupValue.match(/[A-Z]/)?.[0] ?? "Z";
  const index = letters.indexOf(firstLetter);

  return index >= 0 ? 10 + index : 99;
}

function getFilterOptions(items: DashboardFixtureListItem[]) {
  const groupCounts = new Map<string, { count: number; label: string; order: number }>();
  const stageCounts = new Map<string, { count: number; label: string; order: number }>();

  for (const item of items) {
    const groupValue = getGroupDisplayValue(item.groupCode);

    if (groupValue) {
      const key = normalizeFilterValue(groupValue);
      const current = groupCounts.get(key);

      groupCounts.set(key, {
        count: (current?.count ?? 0) + 1,
        label: current?.label ?? `Grupo ${groupValue}`,
        order: current?.order ?? getGroupOrder(groupValue),
      });
    }

    const stageLabel = stageFilterLabels[item.stage.key];

    if (stageLabel) {
      const current = stageCounts.get(item.stage.key);

      stageCounts.set(item.stage.key, {
        count: (current?.count ?? 0) + 1,
        label: stageLabel.label,
        order: stageLabel.order,
      });
    }
  }

  const groupFilters = [...groupCounts.entries()]
    .map(([value, option]) => ({
      count: option.count,
      key: `group:${value}`,
      kind: "group" as const,
      label: option.label,
      order: option.order,
      value,
    }))
    .sort((left, right) => left.order - right.order || left.label.localeCompare(right.label, "es-AR"));

  const stageFilters = [...stageCounts.entries()]
    .map(([value, option]) => ({
      count: option.count,
      key: `stage:${value}`,
      kind: "stage" as const,
      label: option.label,
      order: option.order,
      value,
    }))
    .sort((left, right) => left.order - right.order || left.label.localeCompare(right.label, "es-AR"));

  return [
    {
      ...allFilter,
      count: items.length,
    },
    ...groupFilters,
    ...stageFilters,
  ];
}

function itemMatchesFilter(
  item: DashboardFixtureListItem,
  filter: DashboardFixtureFilter,
) {
  if (filter.kind === "all") {
    return true;
  }

  if (filter.kind === "group") {
    const groupValue = getGroupDisplayValue(item.groupCode);

    return Boolean(groupValue) && normalizeFilterValue(groupValue) === filter.value;
  }

  return item.stage.key === filter.value;
}

function buildPredictionMap(items: DashboardFixtureListItem[]) {
  return Object.fromEntries(
    items.map((item) => [item.match.id, item.match.initialPrediction]),
  ) as DashboardPredictionMap;
}

export function DashboardFixtureList({
  items,
  saveBatchAction,
  saveAction,
}: DashboardFixtureListProps) {
  const filters = useMemo(() => getFilterOptions(items), [items]);
  const initialPredictionMap = useMemo(() => buildPredictionMap(items), [items]);
  const editableMatchIds = useMemo(
    () =>
      new Set(
        items
          .filter((item) => !item.match.locked && item.match.availability.canPredict)
          .map((item) => item.match.id),
      ),
    [items],
  );
  const [currentPredictions, setCurrentPredictions] =
    useState<DashboardPredictionMap>(initialPredictionMap);
  const [savedPredictions, setSavedPredictions] =
    useState<DashboardPredictionMap>(initialPredictionMap);
  const [isPending, startTransition] = useTransition();
  const [batchMessage, setBatchMessage] = useState<string | null>(null);
  const [batchStatus, setBatchStatus] =
    useState<SavePredictionsBatchActionState["status"]>("idle");
  const [activeFilterKey, setActiveFilterKey] = useState<string>(allFilter.key);
  const activeFilter =
    filters.find((filter) => filter.key === activeFilterKey) ?? filters[0] ?? allFilter;
  const filteredItems = items.filter((item) => itemMatchesFilter(item, activeFilter));
  const stageSections = groupDashboardStageItems(filteredItems);
  const dirtyIds = useMemo(
    () => getDirtyPredictionIds(currentPredictions, savedPredictions),
    [currentPredictions, savedPredictions],
  );
  const dirtyEditableIds = dirtyIds.filter((matchId) =>
    editableMatchIds.has(matchId),
  );
  const hasDirtyChanges = dirtyEditableIds.length > 0;

  useEffect(() => {
    if (!hasDirtyChanges) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = true;
    };
    const handleClick = (event: MouseEvent) => {
      const anchor =
        event.target instanceof Element ? event.target.closest("a") : null;

      if (
        !anchor ||
        !shouldConfirmUnsavedNavigation({
          altKey: event.altKey,
          button: event.button,
          ctrlKey: event.ctrlKey,
          currentHref: window.location.href,
          dirty: true,
          download: anchor.hasAttribute("download"),
          href: anchor.href,
          metaKey: event.metaKey,
          shiftKey: event.shiftKey,
          target: anchor.target,
        })
      ) {
        return;
      }

      if (!window.confirm("Tenés cambios sin guardar. ¿Querés salir sin guardar?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleClick, true);
    };
  }, [hasDirtyChanges]);
  const handlePredictionChange = (
    matchId: string,
    prediction: DashboardPredictionValue,
  ) => {
    setCurrentPredictions((current) => ({
      ...current,
      [matchId]: prediction,
    }));
    setBatchMessage(null);
    setBatchStatus("idle");
  };
  const discardChanges = () => {
    setCurrentPredictions(savedPredictions);
    setBatchMessage(null);
    setBatchStatus("idle");
  };
  const saveDirtyPredictions = () => {
    const payload = buildBatchPredictionPayload({
      currentPredictions,
      dirtyIds,
      editableMatchIds,
    });

    if (payload.length === 0) {
      setBatchMessage("No hay cambios editables para guardar.");
      setBatchStatus("error");
      return;
    }

    const formData = new FormData();
    formData.set("predictions_json", JSON.stringify(payload));

    startTransition(async () => {
      const result = await saveBatchAction(formData);

      setBatchMessage(result.message);
      setBatchStatus(result.status);

      if (result.status === "success" || result.status === "partial") {
        const merged = mergeBatchSaveResult({
          currentPredictions,
          dirtyIds,
          failedMatchIds: result.failures.map((failure) => failure.matchId),
          savedPredictions,
        });

        setSavedPredictions(merged.savedPredictions);

        if (result.status === "success") {
          setCurrentPredictions(merged.savedPredictions);
        }
      }
    });
  };

  return (
    <>
      <section
        aria-label="Filtros de partidos"
        className="space-y-3 border-b-[3px] border-prode-black pb-6"
      >
        <p className="max-w-3xl font-body text-sm leading-6 text-muted-foreground">
          Filtrá por grupo o fase para cargar pronósticos más rápido.
        </p>
        <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          <div className="flex w-max min-w-full gap-3">
            {filters.map((filter) => {
              const isActive = filter.key === activeFilter.key;

              return (
                <button
                  aria-pressed={isActive}
                  className={cn(
                    "prode-frame prode-pressable min-h-12 shrink-0 px-4 py-2 font-technical text-xs font-black uppercase outline-none transition focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper",
                    isActive
                      ? "prode-hard-shadow bg-prode-yellow"
                      : "bg-prode-surface hover:bg-[#fff7b5]",
                  )}
                  key={filter.key}
                  onClick={() => setActiveFilterKey(filter.key)}
                  type="button"
                >
                  {filter.label} · {filter.count}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {stageSections.length > 0 ? (
        <div
          aria-label="Partidos disponibles para cargar pronóstico"
          className="space-y-10"
        >
          {stageSections.map((section) => (
            <section
              aria-labelledby={`dashboard-section-${section.key}`}
              className="space-y-6"
              key={section.key}
            >
              <div className="border-y-[3px] border-prode-black bg-prode-yellow px-4 py-3 shadow-[6px_6px_0_var(--prode-black)] sm:px-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h2
                    className="font-display text-4xl uppercase leading-none text-prode-black sm:text-5xl"
                    id={`dashboard-section-${section.key}`}
                  >
                    {section.heading}
                  </h2>
                  <span className="font-technical text-xs font-black uppercase text-prode-black">
                    {section.items.length} partidos
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {section.items.map(({ match, stage }) => (
                  <MatchPredictionCard
                    hideIndividualSave
                    isDirty={dirtyIds.includes(match.id)}
                    key={match.id}
                    match={match}
                    onPredictionChange={handlePredictionChange}
                    prediction={currentPredictions[match.id]}
                    saveAction={saveAction}
                    stageHeading={stage.heading}
                    stageMarker={stage.marker}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <section className="prode-frame prode-hard-shadow bg-prode-surface p-6 text-prode-black">
          <h2 className="font-display text-4xl uppercase">
            No hay partidos para este filtro.
          </h2>
          <p className="mt-3 max-w-2xl font-body text-base">
            Probá con otro grupo o fase disponible en el calendario.
          </p>
        </section>
      )}

      <DashboardBatchSaveBar
        dirtyCount={dirtyEditableIds.length}
        disabled={dirtyEditableIds.length === 0}
        isPending={isPending}
        message={batchMessage}
        onDiscard={discardChanges}
        onSave={saveDirtyPredictions}
        status={batchStatus}
      />
    </>
  );
}
