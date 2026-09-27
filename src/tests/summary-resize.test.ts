import { describe, expect, it } from "vitest";
import {
  SUMMARY_DEFAULT,
  SUMMARY_MAX,
  SUMMARY_MIN,
  clampSummaryWidth,
} from "@/components/builder/summary-resize";

describe("side panel width", () => {
  it("starts at the design width and stays inside the viewport", () => {
    expect(clampSummaryWidth(SUMMARY_DEFAULT, 1440)).toBe(356);
    expect(clampSummaryWidth(200, 1440)).toBe(SUMMARY_MIN);
    expect(clampSummaryWidth(900, 1440)).toBe(720);
    expect(clampSummaryWidth(SUMMARY_MAX, 1200)).toBeLessThanOrEqual(720);
  });
});
