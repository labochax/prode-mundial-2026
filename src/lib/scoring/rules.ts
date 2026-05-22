import { APP_CONFIG } from "@/lib/config/app";

export const SCORING_RULES = {
  correctOutcomePoints: 1,
  exactScorePoints: 3,
  incorrectPredictionPoints: 0,
} as const;

export const MATCH_LOCK_RULES = {
  defaultMinutesBeforeKickoff: APP_CONFIG.defaultLockMinutesBeforeKickoff,
  predictionsLockPerMatch: true,
  revealPredictionsAfterLock: true,
} as const;
