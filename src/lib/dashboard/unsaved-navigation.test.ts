import { describe, expect, it } from "vitest";

import { shouldConfirmUnsavedNavigation } from "@/lib/dashboard/unsaved-navigation";

const currentHref = "https://prode.example/predicciones?grupo=A";

describe("shouldConfirmUnsavedNavigation", () => {
  it("confirms a normal in-app navigation when changes are dirty", () => {
    expect(
      shouldConfirmUnsavedNavigation({
        currentHref,
        dirty: true,
        href: "/mi-mundial",
      }),
    ).toBe(true);
  });

  it("does not confirm after changes were saved or discarded", () => {
    expect(
      shouldConfirmUnsavedNavigation({
        currentHref,
        dirty: false,
        href: "/mi-mundial",
      }),
    ).toBe(false);
  });

  it("ignores modifier clicks, target blank, download, and same-page hash links", () => {
    expect(
      shouldConfirmUnsavedNavigation({
        currentHref,
        dirty: true,
        href: "/mi-mundial",
        metaKey: true,
      }),
    ).toBe(false);
    expect(
      shouldConfirmUnsavedNavigation({
        currentHref,
        dirty: true,
        href: "/mi-mundial",
        target: "_blank",
      }),
    ).toBe(false);
    expect(
      shouldConfirmUnsavedNavigation({
        currentHref,
        dirty: true,
        download: true,
        href: "/mi-mundial",
      }),
    ).toBe(false);
    expect(
      shouldConfirmUnsavedNavigation({
        currentHref,
        dirty: true,
        href: "#grupo-a",
      }),
    ).toBe(false);
  });
});
