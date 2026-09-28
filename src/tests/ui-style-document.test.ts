import { describe, expect, it } from "vitest";
import { uiStyleIds } from "@/catalogue/ui-styles";
import { uiStyleInitScript, readStoredUiStyle } from "@/lib/ui-style-document";

describe("readStoredUiStyle", () => {
  it("reads a known style from the persisted project", () => {
    const raw = JSON.stringify({
      state: { project: { uiStyle: "glassmorphism" } },
      version: 1,
    });
    expect(readStoredUiStyle(raw)).toBe("glassmorphism");
  });

  it("ignores an empty selection, unknown ids, and broken JSON", () => {
    expect(readStoredUiStyle(null)).toBe("");
    expect(
      readStoredUiStyle(
        JSON.stringify({ state: { project: { uiStyle: "" } } }),
      ),
    ).toBe("");
    expect(
      readStoredUiStyle(
        JSON.stringify({ state: { project: { uiStyle: "skeuomorphism" } } }),
      ),
    ).toBe("");
    expect(readStoredUiStyle("{")).toBe("");
  });

  it("names every style in the pre-paint script", () => {
    for (const id of uiStyleIds) {
      if (id) expect(uiStyleInitScript).toContain(id);
    }
    expect(uiStyleInitScript).toContain("buildblueprint-project");
  });
});
