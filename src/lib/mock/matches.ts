import {
  stitchFlagAssets,
  type StitchFlagAsset,
} from "@/lib/design/stitch-assets";

export type MockTeam = {
  code: string;
  detailFlag?: StitchFlagAsset;
  flag?: StitchFlagAsset;
  id: string;
  name: string;
};

export type MockMatchDetail = {
  directHistory: {
    away: number;
    draw: number;
    home: number;
  };
  metadata: {
    city: string;
    dateTime: string;
    groupPhase: string;
    stadium: string;
  };
  timerLabel: string;
};

export type MockMatch = {
  away: MockTeam;
  detail: MockMatchDetail;
  groupLabel: string;
  home: MockTeam;
  id: string;
  initialPrediction: {
    away: number;
    home: number;
  };
  initialState: "empty" | "saved";
  kickoffAt: string;
  lockLabel: string;
  tendency: {
    away: number;
    draw: number;
    home: number;
  };
  timeLabel: string;
};

const teams = {
  argentina: {
    code: "ARG",
    detailFlag: stitchFlagAssets["argentina-detalle"],
    flag: stitchFlagAssets.argentina,
    id: "argentina",
    name: "Argentina",
  },
  mexico: {
    code: "MEX",
    flag: stitchFlagAssets.mexico,
    id: "mexico",
    name: "México",
  },
  brasil: {
    code: "BRA",
    flag: stitchFlagAssets.brasil,
    id: "brasil",
    name: "Brasil",
  },
  alemania: {
    code: "ALE",
    id: "alemania",
    name: "Alemania",
  },
  espana: {
    code: "ESP",
    id: "espana",
    name: "España",
  },
  japon: {
    code: "JPN",
    id: "japon",
    name: "Japón",
  },
  uruguay: {
    code: "URU",
    id: "uruguay",
    name: "Uruguay",
  },
  francia: {
    code: "FRA",
    flag: stitchFlagAssets.francia,
    id: "francia",
    name: "Francia",
  },
} as const satisfies Record<string, MockTeam>;

// Datos mock aislados para UI. Se reemplazarán por Supabase y Football-Data.org
// cuando se implemente la sincronización real de fixtures y resultados.
export const mockDashboardMatches = [
  {
    away: teams.mexico,
    detail: {
      directHistory: {
        away: 1,
        draw: 1,
        home: 3,
      },
      metadata: {
        city: "Ciudad de México",
        dateTime: "Jueves 11 de junio - 16:00",
        groupPhase: "Grupo A - Fecha de muestra",
        stadium: "Estadio Azteca",
      },
      timerLabel: "Cierra en 00:14:32",
    },
    groupLabel: "Grupo A - Fecha de muestra",
    home: teams.argentina,
    id: "demo-001",
    initialPrediction: {
      away: 0,
      home: 0,
    },
    initialState: "empty",
    kickoffAt: "2026-06-11T16:00:00-03:00",
    lockLabel: "Cierra 10 min antes",
    tendency: {
      away: 24,
      draw: 18,
      home: 58,
    },
    timeLabel: "Hoy 16:00",
  },
  {
    away: teams.alemania,
    detail: {
      directHistory: {
        away: 2,
        draw: 1,
        home: 2,
      },
      metadata: {
        city: "Los Angeles",
        dateTime: "Viernes 12 de junio - 13:00",
        groupPhase: "Grupo B - Fecha de muestra",
        stadium: "SoFi Stadium",
      },
      timerLabel: "Cierra en 08:44:12",
    },
    groupLabel: "Grupo B - Fecha de muestra",
    home: teams.brasil,
    id: "brasil-alemania",
    initialPrediction: {
      away: 1,
      home: 2,
    },
    initialState: "saved",
    kickoffAt: "2026-06-12T13:00:00-03:00",
    lockLabel: "Cierra 10 min antes",
    tendency: {
      away: 32,
      draw: 21,
      home: 47,
    },
    timeLabel: "Mañana 13:00",
  },
  {
    away: teams.japon,
    detail: {
      directHistory: {
        away: 2,
        draw: 1,
        home: 2,
      },
      metadata: {
        city: "Toronto",
        dateTime: "Sábado 13 de junio - 10:00",
        groupPhase: "Grupo C - Fecha de muestra",
        stadium: "BMO Field",
      },
      timerLabel: "Cierra en 21:08:03",
    },
    groupLabel: "Grupo C - Fecha de muestra",
    home: teams.espana,
    id: "espana-japon",
    initialPrediction: {
      away: 0,
      home: 0,
    },
    initialState: "empty",
    kickoffAt: "2026-06-13T10:00:00-03:00",
    lockLabel: "Cierra 10 min antes",
    tendency: {
      away: 29,
      draw: 27,
      home: 44,
    },
    timeLabel: "Sábado 10:00",
  },
  {
    away: teams.francia,
    detail: {
      directHistory: {
        away: 3,
        draw: 1,
        home: 1,
      },
      metadata: {
        city: "Miami",
        dateTime: "Domingo 14 de junio - 18:00",
        groupPhase: "Grupo D - Fecha de muestra",
        stadium: "Hard Rock Stadium",
      },
      timerLabel: "Cierra en 35:27:44",
    },
    groupLabel: "Grupo D - Fecha de muestra",
    home: teams.uruguay,
    id: "uruguay-francia",
    initialPrediction: {
      away: 0,
      home: 0,
    },
    initialState: "empty",
    kickoffAt: "2026-06-14T18:00:00-03:00",
    lockLabel: "Cierra 10 min antes",
    tendency: {
      away: 41,
      draw: 25,
      home: 34,
    },
    timeLabel: "Domingo 18:00",
  },
] as const satisfies readonly MockMatch[];

export function getMockMatchById(matchId: string) {
  return mockDashboardMatches.find((match) => match.id === matchId);
}

export function getChronologicalMockMatches() {
  return [...mockDashboardMatches].sort(
    (first, second) =>
      new Date(first.kickoffAt).getTime() -
      new Date(second.kickoffAt).getTime(),
  );
}

export function getNextMockMatch(currentMatchId: string) {
  const matches = getChronologicalMockMatches();
  const currentIndex = matches.findIndex((match) => match.id === currentMatchId);

  if (currentIndex === -1) {
    return undefined;
  }

  return matches[currentIndex + 1];
}
