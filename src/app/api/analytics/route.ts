import { prisma } from "@/lib/prisma";
import { Plan } from "@/prisma/generated/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [totalUsers, paidUsers, uploadsToday, recentEvents] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { plan: { in: [Plan.PRO, Plan.BUSINESS] } } }),
    prisma.asset.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.analyticsEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);

  const dailyActiveUsers = await prisma.analyticsEvent.groupBy({
    by: ["userId"],
    where: {
      createdAt: { gte: dayStart },
      userId: { not: null },
    },
    _count: true,
  });

  return NextResponse.json({
    dailyActiveUsers: dailyActiveUsers.length,
    uploadCount24h: uploadsToday,
    conversionRate: totalUsers === 0 ? 0 : Number(((paidUsers / totalUsers) * 100).toFixed(2)),
    recentEvents,
  });
}

