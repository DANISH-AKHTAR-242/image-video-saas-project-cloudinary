import { prisma } from "@/lib/prisma";
import { AssetType } from "@/prisma/generated/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const videos = await prisma.asset.findMany({
      where: { userId, type: AssetType.VIDEO },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(videos);
  } catch (error) {
    console.error("Error fetching the videos:", error);
    return NextResponse.json(
      { error: "Error fetching the videos" },
      { status: 500 }
    );
  }
}
