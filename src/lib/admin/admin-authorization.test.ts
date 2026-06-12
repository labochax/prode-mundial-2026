import { describe, expect, it } from "vitest";

import {
  AdminAuthorizationError,
  assertAdminEmailAllowed,
  getAdminAuthorizationDecision,
} from "@/lib/admin/admin-authorization";

describe("admin email authorization", () => {
  it("allows configured admin emails case-insensitively", () => {
    expect(
      getAdminAuthorizationDecision(
        "LABOCHA@gmail.com",
        "otro@example.com, labocha@gmail.com ",
      ),
    ).toEqual({
      email: "labocha@gmail.com",
      isAuthorized: true,
    });
  });

  it("blocks non-admin and missing emails", () => {
    expect(
      getAdminAuthorizationDecision(
        "jugador@example.com",
        "labocha@gmail.com",
      ).isAuthorized,
    ).toBe(false);
    expect(
      getAdminAuthorizationDecision(null, "labocha@gmail.com").isAuthorized,
    ).toBe(false);
  });

  it("throws a safe authorization error for non-admin users", () => {
    expect(() =>
      assertAdminEmailAllowed("jugador@example.com", "labocha@gmail.com"),
    ).toThrow(AdminAuthorizationError);
  });
});
