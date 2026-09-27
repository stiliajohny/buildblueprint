import { describe, expect, it } from "vitest";
import { authErrorMessage, authMode, safeNextPath } from "@/lib/auth/redirect";

describe("auth screens", () => {
  it("accepts the sign-in, sign-up, and reset screens", () => {
    expect(authMode("signin")).toBe("signin");
    expect(authMode("signup")).toBe("signup");
    expect(authMode("forgot")).toBe("forgot");
    expect(authMode(undefined)).toBe("signin");
    expect(authMode("https://evil.example")).toBe("signin");
  });

  it("turns an expired callback into a readable error", () => {
    expect(authErrorMessage("callback")).toMatch(/expired/);
    expect(authErrorMessage(undefined)).toBe("");
  });
});

describe("auth redirects", () => {
  it("allows in-app destinations", () => {
    expect(safeNextPath("/projects")).toBe("/projects");
    expect(safeNextPath("/projects/abc")).toBe("/projects/abc");
    expect(safeNextPath("/auth/update-password")).toBe("/auth/update-password");
    expect(safeNextPath(null)).toBe("/projects");
  });

  it("rejects off-site destinations", () => {
    expect(safeNextPath("https://evil.example")).toBe("/projects");
    expect(safeNextPath("//evil.example")).toBe("/projects");
    expect(safeNextPath("/\\evil.example")).toBe("/projects");
    expect(safeNextPath("/%2F%2Fevil.example")).toBe("/projects");
  });
});
