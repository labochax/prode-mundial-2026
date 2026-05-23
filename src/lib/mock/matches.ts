import {
  stitchFlagAssets,
  type StitchFlagAsset,
} from "@/lib/design/stitch-assets";

export type MockTeam = {
  code: string;
  flag?: StitchFlagAsset;
  id: string;
  name: string;
};

export type MockMatch = {
  away: MockTeam;
  groupLabel: string;
  home: MockTeam;
  id: string;
  initialPrediction: {
    away: number;
    home: number;
  };
  initialState: "empty" | "saved";
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
    groupLabel: "Grupo A - Fecha de muestra",
    home: teams.argentina,
    id: "argentina-mexico",
    initialPrediction: {
      away: 0,
      home: 0,
    },
    initialState: "empty",
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
    groupLabel: "Grupo B - Fecha de muestra",
    home: teams.brasil,
    id: "brasil-alemania",
    initialPrediction: {
      away: 1,
      home: 2,
    },
    initialState: "saved",
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
    groupLabel: "Grupo C - Fecha de muestra",
    home: teams.espana,
    id: "espana-japon",
    initialPrediction: {
      away: 0,
      home: 0,
    },
    initialState: "empty",
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
    groupLabel: "Grupo D - Fecha de muestra",
    home: teams.uruguay,
    id: "uruguay-francia",
    initialPrediction: {
      away: 0,
      home: 0,
    },
    initialState: "empty",
    lockLabel: "Cierra 10 min antes",
    tendency: {
      away: 41,
      draw: 25,
      home: 34,
    },
    timeLabel: "Domingo 18:00",
  },
] as const satisfies readonly MockMatch[];
