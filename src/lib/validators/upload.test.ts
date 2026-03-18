import { describe, expect, it } from "vitest";
import { mediaTransformSchema } from "@/lib/validators/upload";

describe("mediaTransformSchema", () => {
  it("accepts safe transformation values", () => {
    const parsed = mediaTransformSchema.safeParse({
      publicId: "asset-123",
      resourceType: "image",
      width: 800,
      height: 400,
      crop: "fill",
      quality: "auto",
      format: "webp",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects oversized dimensions", () => {
    const parsed = mediaTransformSchema.safeParse({
      publicId: "asset-123",
      width: 9000,
    });
    expect(parsed.success).toBe(false);
  });
});

