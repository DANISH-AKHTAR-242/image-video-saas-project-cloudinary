import { describe, expect, it } from "vitest";
import { assertRateLimit } from "@/lib/rate-limit";

describe("assertRateLimit", () => {
  it("throws when request count exceeds threshold", () => {
    const key = `test-key-${Date.now()}`;
    assertRateLimit(key, { maxRequests: 1, windowMs: 1000 });

    expect(() =>
      assertRateLimit(key, { maxRequests: 1, windowMs: 1000 })
    ).toThrow(/Rate limit exceeded/);
  });
});

