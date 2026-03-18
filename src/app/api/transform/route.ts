import { trackEvent } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";
import { assertRateLimit } from "@/lib/rate-limit";
import {
  ensureUsageRecord,
  getLimitForPlan,
  incrementTransformationCount,
  UsageLimitError,
} from "@/lib/usage";
import { ensureUser } from "@/lib/user";
import { mediaTransformSchema } from "@/lib/validators/upload";
import { cloudinaryService } from "@/services/cloudinary.service";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    assertRateLimit(userId, { maxRequests: 60, windowMs: 60_000 });

    const profile = await currentUser();
    const user = await ensureUser(userId, profile?.primaryEmailAddress?.emailAddress);
    const usage = await ensureUsageRecord(userId);
    const limits = getLimitForPlan(user.plan);

    if (usage.transformationsThisMonth >= limits.monthlyTransformations) {
      throw new UsageLimitError(
        `Monthly transformation limit reached for ${user.plan} plan. Please upgrade.`
      );
    }

    const parsed = mediaTransformSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid transform payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { publicId, ...options } = parsed.data;
    const optimizedUrl = cloudinaryService.transformMedia(publicId, options);
    await incrementTransformationCount(userId);
    await trackEvent("media_transformed", {
      userId,
      metadata: { publicId, options },
    });

    const asset = await prisma.asset.findUnique({ where: { publicId } });
    if (asset) {
      await prisma.asset.update({
        where: { id: asset.id },
        data: { transformationCount: { increment: 1 } },
      });
    }

    return NextResponse.json({ url: optimizedUrl });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Transformation failed";
    const status =
      error instanceof UsageLimitError || message.includes("limit") ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

