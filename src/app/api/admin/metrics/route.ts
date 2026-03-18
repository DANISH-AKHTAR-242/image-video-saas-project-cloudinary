import { prisma } from "@/lib/prisma";
import { ensureUser } from "@/lib/user";
import { Plan, SubscriptionStatus } from "@/prisma/generated/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await currentUser();
  const user = await ensureUser(userId, profile?.primaryEmailAddress?.emailAddress);
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [totalUsers, activeSubscriptions, paidUsers, revenue, recentUploads] =
    await Promise.all([
      prisma.user.count(),
      prisma.subscription.count({
        where: { status: SubscriptionStatus.ACTIVE },
      }),
      prisma.user.count({ where: { plan: { in: [Plan.PRO, Plan.BUSINESS] } } }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: "paid" },
      }),
      prisma.asset.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { email: true } } },
      }),
    ]);

  return NextResponse.json({
    totalUsers,
    paidUsers,
    activeSubscriptions,
    revenueCents: revenue._sum.amount ?? 0,
    recentUploads,
  });
}

