export type DashboardStageDisplay = {
  heading: string;
  key: string;
  marker: string;
  order: number;
};

type StageSource = {
  group_code: string | null;
  stage: string | null;
};

export type DashboardStageItem<T> = {
  match: T;
  stage: DashboardStageDisplay;
};

export type DashboardStageSection<TItem extends DashboardStageItem<unknown>> = {
  heading: string;
  items: TItem[];
  key: string;
  order: number;
};

function normalizeStage(value: string | null) {
  return (value ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getGroupLetter(groupCode: string | null) {
  const normalized = normalizeStage(groupCode);
  const group = normalized
    .replace(/^GROUP_/, "")
    .replace(/^GRUPO_/, "")
    .replace(/^GR_/, "");
  const match = group.match(/[A-Z0-9]+$/);

  return match?.[0]?.slice(-2) ?? "G";
}

export function getMatchStageLabel(match: StageSource) {
  const stage = normalizeStage(match.stage);

  if (!stage || stage.includes("GROUP")) {
    return `Grupo ${getGroupLetter(match.group_code)}`;
  }

  const knockoutStage = getKnockoutStage(stage);

  if (!knockoutStage) {
    return stage.replaceAll("_", " ");
  }

  switch (knockoutStage.key) {
    case "final":
      return "Final";
    case "quarter-finals":
      return "Cuartos";
    case "round-16":
      return "Octavos";
    case "round-32":
    case "round-64":
      return "16avos";
    case "semi-finals":
      return "Semifinal";
    case "third-place":
      return "3.º Puesto";
    default:
      return knockoutStage.heading;
  }
}

function getKnockoutStage(stage: string): DashboardStageDisplay | null {
  if (
    stage.includes("ROUND_OF_64") ||
    stage.includes("LAST_64") ||
    stage.includes("32AVOS")
  ) {
    return {
      heading: "16AVOS DE FINAL",
      key: "round-64",
      marker: "16",
      order: 20,
    };
  }

  if (
    stage.includes("ROUND_OF_32") ||
    stage.includes("LAST_32") ||
    stage.includes("ROUND_32") ||
    stage.includes("16AVOS") ||
    stage.includes("DIECISEISAVOS")
  ) {
    return {
      heading: "16AVOS DE FINAL",
      key: "round-32",
      marker: "16",
      order: 30,
    };
  }

  if (
    stage.includes("ROUND_OF_16") ||
    stage.includes("LAST_16") ||
    stage.includes("OCTAVOS")
  ) {
    return {
      heading: "OCTAVOS DE FINAL",
      key: "round-16",
      marker: "8",
      order: 40,
    };
  }

  if (stage.includes("QUARTER") || stage.includes("CUARTOS")) {
    return {
      heading: "CUARTOS DE FINAL",
      key: "quarter-finals",
      marker: "4",
      order: 50,
    };
  }

  if (stage.includes("SEMI")) {
    return {
      heading: "SEMIFINALES",
      key: "semi-finals",
      marker: "SF",
      order: 60,
    };
  }

  if (stage.includes("THIRD") || stage.includes("TERCER")) {
    return {
      heading: "3.º PUESTO",
      key: "third-place",
      marker: "3P",
      order: 70,
    };
  }

  if (stage === "FINAL" || stage.endsWith("_FINAL")) {
    return {
      heading: "FINAL",
      key: "final",
      marker: "F",
      order: 80,
    };
  }

  return null;
}

export function getDashboardStageDisplay(
  match: StageSource,
): DashboardStageDisplay {
  const stage = normalizeStage(match.stage);

  if (!stage || stage.includes("GROUP")) {
    return {
      heading: "FASE DE GRUPOS",
      key: "group-stage",
      marker: getGroupLetter(match.group_code),
      order: 10,
    };
  }

  return (
    getKnockoutStage(stage) ?? {
      heading: stage.replaceAll("_", " "),
      key: `stage-${stage.toLowerCase()}`,
      marker: stage.slice(0, 3),
      order: 90,
    }
  );
}

export function groupDashboardStageItems<
  TItem extends DashboardStageItem<unknown>,
>(items: TItem[]): DashboardStageSection<TItem>[] {
  const sections = new Map<string, DashboardStageSection<TItem>>();

  for (const item of items) {
    const current = sections.get(item.stage.key);

    if (current) {
      current.items.push(item);
      continue;
    }

    sections.set(item.stage.key, {
      heading: item.stage.heading,
      items: [item],
      key: item.stage.key,
      order: item.stage.order,
    });
  }

  return [...sections.values()].sort((left, right) => left.order - right.order);
}
