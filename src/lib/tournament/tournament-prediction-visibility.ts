export function isTournamentPredictionPublicByTime(
  lockAt: string | null,
  now = Date.now(),
) {
  if (!lockAt) {
    return false;
  }

  const lockTime = new Date(lockAt).getTime();

  return Number.isFinite(lockTime) && now >= lockTime;
}
