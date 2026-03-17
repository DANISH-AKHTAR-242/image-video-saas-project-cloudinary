import { prisma } from "@/lib/prisma";
import { ensureUsageRecord, getFreeTierLimit } from "@/lib/usage";
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

    return NextResponse.json({
      plan: user?.plan ?? "FREE",
      uploadsToday: usage.uploadsToday,
      freeTierLimit: getFreeTierLimit(),
      lastResetAt: usage.lastResetAt,
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
