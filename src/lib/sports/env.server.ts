import "server-only";

export class SportsApiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SportsApiConfigError";
  }
}

export function getFootballDataEnv() {
  const token = process.env.FOOTBALL_DATA_API_TOKEN?.trim();

  if (!token) {
    throw new SportsApiConfigError(
      "Falta configurar FOOTBALL_DATA_API_TOKEN en .env.local para probar Football-Data.",
    );
  }

  return {
    token,
  };
}

export function getTheSportsDbEnv() {
  return {
    apiKey: process.env.THESPORTSDB_API_KEY?.trim() || "123",
  };
}
