import { prisma } from "@/lib/prisma";
import { getLimitForPlan, ensureUsageRecord } from "@/lib/usage";
import { ensureUser } from "@/lib/user";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const usage = await ensureUsageRecord(userId);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const activeUser =
      user ?? (await ensureUser(userId, null));
    const limits = getLimitForPlan(activeUser.plan);

    return NextResponse.json({
      plan: activeUser.plan,
      uploadsToday: usage.uploadsToday,
      uploadsThisMonth: usage.uploadsThisMonth,
      transformationsThisMonth: usage.transformationsThisMonth,
      dailyUploadLimit: limits.dailyUploads,
      monthlyUploadLimit: limits.monthlyUploads,
      monthlyTransformationLimit: limits.monthlyTransformations,
      lastResetAt: usage.lastDailyResetAt,
      lastUploadAt: usage.lastUploadAt,
    });
  } catch (error) {
    console.error("Error fetching usage", error);
    return NextResponse.json(
      { error: "Unable to fetch usage" },
      { status: 500 }
    );
  }
}
