import { describe, expect, it } from "vitest";
import {
  colorSchemeInitScript,
  resolveSchemePalette,
} from "@/lib/color-scheme-document";

const pair = {
  themeMode: "light-dark",
  singleTheme: "light",
  colorScheme: "synthetic-lime",
};

describe("resolveSchemePalette", () => {
  it("uses the platform tone for a light and dark pair", () => {
    expect(resolveSchemePalette(pair, "light")?.background).toBe("#F7F8F2");
    expect(resolveSchemePalette(pair, "dark")?.accent).toBe("#D8FF4D");
  });

  it("locks a single theme to the chosen mode", () => {
    expect(
      resolveSchemePalette(
        { ...pair, themeMode: "single", singleTheme: "dark" },
        "light",
      )?.background,
    ).toBe("#0C1410");
  });

  it("returns null when no pair is selected", () => {
    expect(resolveSchemePalette({ ...pair, colorScheme: "" }, "light")).toBe(
      null,
    );
    expect(
      resolveSchemePalette({ ...pair, colorScheme: "unknown" }, "dark"),
    ).toBe(null);
  });

  it("names the saved pair in the pre-paint script", () => {
    expect(colorSchemeInitScript).toContain("synthetic-lime");
    expect(colorSchemeInitScript).toContain("--scheme-accent");
    expect(colorSchemeInitScript).toContain("buildblueprint-project");
  });
});
