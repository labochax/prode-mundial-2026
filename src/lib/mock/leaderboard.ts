import {
  stitchAvatarAssets,
  type StitchAvatarAsset,
  type StitchAvatarId,
} from "@/lib/design/stitch-assets";

export type LeaderboardMode = "friends" | "global";
export type LeaderboardResultMarker = "exact" | "miss" | "outcome";
export type LeaderboardTrendDirection = "down" | "same" | "up";

export type MockLeaderboardPlayer = {
  avatar: StitchAvatarAsset;
  exactHits: number;
  friendGroup: "Amigos" | "Global";
  groupName: string;
  id: string;
  isCurrentPlayer?: boolean;
  lastFive: LeaderboardResultMarker[];
  name: string;
  outcomeHits: number;
  totalPoints: number;
  trend: {
    direction: LeaderboardTrendDirection;
    value: number;
  };
};

export type RankedMockLeaderboardPlayer = MockLeaderboardPlayer & {
  rank: number;
};

const avatarById = Object.fromEntries(
  stitchAvatarAssets.map((avatar) => [avatar.id, avatar]),
) as Record<StitchAvatarId, StitchAvatarAsset>;

// Datos mock locales. Más adelante se reemplazarán por consultas de Supabase
// sobre predicciones bloqueadas, resultados oficiales y reglas de puntaje.
export const mockLeaderboardPlayers: MockLeaderboardPlayer[] = [
  {
    avatar: avatarById.maradona,
    exactHits: 27,
    friendGroup: "Global",
    groupName: "La Scaloneta",
    id: "valeria-cortez",
    lastFive: ["exact", "exact", "miss", "outcome", "exact"],
    name: "Valeria Cortez",
    outcomeHits: 39,
    totalPoints: 1450,
    trend: { direction: "up", value: 2 },
  },
  {
    avatar: avatarById.riquelme,
    exactHits: 25,
    friendGroup: "Amigos",
    groupName: "Mesa del fondo",
    id: "ignacio-silva",
    lastFive: ["exact", "miss", "outcome", "exact", "miss"],
    name: "Ignacio Silva",
    outcomeHits: 37,
    totalPoints: 1380,
    trend: { direction: "down", value: 1 },
  },
  {
    avatar: avatarById.alvarez,
    exactHits: 23,
    friendGroup: "Amigos",
    groupName: "Mesa del fondo",
    id: "julian-alvarez",
    isCurrentPlayer: true,
    lastFive: ["exact", "outcome", "miss", "exact", "exact"],
    name: "Julián Álvarez",
    outcomeHits: 35,
    totalPoints: 1240,
    trend: { direction: "same", value: 0 },
  },
  {
    avatar: avatarById.batistuta,
    exactHits: 21,
    friendGroup: "Global",
    groupName: "Los del 98",
    id: "camila-rojas",
    lastFive: ["miss", "miss", "outcome", "miss", "exact"],
    name: "Camila Rojas",
    outcomeHits: 34,
    totalPoints: 1110,
    trend: { direction: "same", value: 0 },
  },
  {
    avatar: avatarById.messi,
    exactHits: 19,
    friendGroup: "Amigos",
    groupName: "Mesa del fondo",
    id: "marcos-paz",
    lastFive: ["exact", "miss", "miss", "outcome", "exact"],
    name: "Marcos Paz",
    outcomeHits: 32,
    totalPoints: 980,
    trend: { direction: "up", value: 1 },
  },
  {
    avatar: avatarById.dibu,
    exactHits: 18,
    friendGroup: "Amigos",
    groupName: "Los de siempre",
    id: "sofia-luna",
    lastFive: ["outcome", "exact", "miss", "miss", "outcome"],
    name: "Sofía Luna",
    outcomeHits: 31,
    totalPoints: 940,
    trend: { direction: "up", value: 3 },
  },
  {
    avatar: avatarById.ortega,
    exactHits: 17,
    friendGroup: "Global",
    groupName: "La previa",
    id: "tomas-benitez",
    lastFive: ["miss", "outcome", "outcome", "exact", "miss"],
    name: "Tomás Benítez",
    outcomeHits: 30,
    totalPoints: 910,
    trend: { direction: "down", value: 2 },
  },
  {
    avatar: avatarById.redondo,
    exactHits: 16,
    friendGroup: "Amigos",
    groupName: "Los de siempre",
    id: "martina-farias",
    lastFive: ["exact", "outcome", "outcome", "miss", "miss"],
    name: "Martina Farías",
    outcomeHits: 28,
    totalPoints: 860,
    trend: { direction: "same", value: 0 },
  },
  {
    avatar: avatarById.kempes,
    exactHits: 14,
    friendGroup: "Global",
    groupName: "Los del 78",
    id: "nicolas-peralta",
    lastFive: ["miss", "exact", "miss", "outcome", "miss"],
    name: "Nicolás Peralta",
    outcomeHits: 29,
    totalPoints: 820,
    trend: { direction: "up", value: 1 },
  },
  {
    avatar: avatarById.caniggia,
    exactHits: 13,
    friendGroup: "Amigos",
    groupName: "Los de siempre",
    id: "agustina-molina",
    lastFive: ["outcome", "miss", "miss", "exact", "outcome"],
    name: "Agustina Molina",
    outcomeHits: 26,
    totalPoints: 770,
    trend: { direction: "down", value: 1 },
  },
  {
    avatar: avatarById.palermo,
    exactHits: 12,
    friendGroup: "Global",
    groupName: "Tribuna alta",
    id: "facundo-rivas",
    lastFive: ["miss", "miss", "exact", "miss", "outcome"],
    name: "Facundo Rivas",
    outcomeHits: 25,
    totalPoints: 720,
    trend: { direction: "same", value: 0 },
  },
  {
    avatar: avatarById.aguero,
    exactHits: 11,
    friendGroup: "Amigos",
    groupName: "Mesa del fondo",
    id: "lucia-soria",
    lastFive: ["outcome", "exact", "miss", "miss", "miss"],
    name: "Lucía Soria",
    outcomeHits: 24,
    totalPoints: 690,
    trend: { direction: "up", value: 2 },
  },
  {
    avatar: avatarById.bochini,
    exactHits: 10,
    friendGroup: "Global",
    groupName: "Cábala total",
    id: "hernan-gomez",
    lastFive: ["miss", "outcome", "miss", "outcome", "miss"],
    name: "Hernán Gómez",
    outcomeHits: 22,
    totalPoints: 630,
    trend: { direction: "down", value: 3 },
  },
  {
    avatar: avatarById.chiqui,
    exactHits: 8,
    friendGroup: "Amigos",
    groupName: "Los de siempre",
    id: "pablo-nieto",
    lastFive: ["miss", "miss", "miss", "outcome", "miss"],
    name: "Pablo Nieto",
    outcomeHits: 20,
    totalPoints: 560,
    trend: { direction: "same", value: 0 },
  },
];

export function getRankedMockLeaderboard(
  mode: LeaderboardMode,
): RankedMockLeaderboardPlayer[] {
  const visiblePlayers =
    mode === "friends"
      ? mockLeaderboardPlayers.filter((player) => player.friendGroup === "Amigos")
      : mockLeaderboardPlayers;

  return [...visiblePlayers]
    .sort((first, second) => {
      if (second.totalPoints !== first.totalPoints) {
        return second.totalPoints - first.totalPoints;
      }

      if (second.exactHits !== first.exactHits) {
        return second.exactHits - first.exactHits;
      }

      if (second.outcomeHits !== first.outcomeHits) {
        return second.outcomeHits - first.outcomeHits;
      }

      return first.name.localeCompare(second.name, "es");
    })
    .map((player, index) => ({
      ...player,
      rank: index + 1,
    }));
}
