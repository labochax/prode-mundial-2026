import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

function readSource(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("admin result control boundaries", () => {
  it("guards sync and manual finalization before privileged operations", () => {
    const actions = readSource("src/app/actions/admin-results.ts");

    expect(actions).toMatch(
      /syncResultsFromAdminAction[\s\S]*?await assertCurrentUserIsAdmin\(\);[\s\S]*?syncFootballDataResults/,
    );
    expect(actions).toMatch(
      /finalizeMatchAndScoreAction[\s\S]*?await assertCurrentUserIsAdmin\(\);[\s\S]*?createSupabaseAdminClient/,
    );
  });

  it("keeps the service-role client out of the client control component", () => {
    const clientComponent = readSource(
      "src/components/admin/admin-result-controls.tsx",
    );

    expect(clientComponent).not.toContain("@/lib/supabase/admin");
    expect(clientComponent).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(clientComponent).not.toContain("createSupabaseAdminClient");
  });
});
