import { describe, expect, it } from "vitest";
import { isThemePreference } from "@/lib/theme";

describe("theme preference", () => {
  it("accepts bright, dark, and system", () => {
    expect(isThemePreference("bright")).toBe(true);
    expect(isThemePreference("dark")).toBe(true);
    expect(isThemePreference("system")).toBe(true);
  });
  it("rejects anything else", () => {
    expect(isThemePreference("light")).toBe(false);
    expect(isThemePreference(null)).toBe(false);
  });
});
