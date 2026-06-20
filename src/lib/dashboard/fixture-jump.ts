type FixtureJumpItem = {
  match: {
    id: string;
    status: {
      tone: string;
    };
  };
};

export function getNextUnfinishedMatchId(items: FixtureJumpItem[]) {
  return (
    items.find((item) => item.match.status.tone !== "finished")?.match.id ??
    null
  );
}

export function getMatchAnchorId(matchId: string) {
  return `prediction-match-${matchId}`;
}
