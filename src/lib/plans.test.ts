import { describe, expect, it } from "vitest";
import { PLAN_LIMITS } from "@/lib/plans";

describe("PLAN_LIMITS", () => {
  it("keeps free tier capped to 10 daily uploads", () => {
    expect(PLAN_LIMITS.FREE.dailyUploads).toBe(10);
  });

  it("makes business tier effectively unlimited", () => {
    expect(PLAN_LIMITS.BUSINESS.dailyUploads).toBe(Number.MAX_SAFE_INTEGER);
    expect(PLAN_LIMITS.BUSINESS.monthlyUploads).toBe(Number.MAX_SAFE_INTEGER);
  });
});

