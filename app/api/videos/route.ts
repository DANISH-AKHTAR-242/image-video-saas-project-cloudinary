import { PrismaClient } from "@/prisma/generated/prisma";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const videos = await prisma.video.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(videos);
  } catch (error) {
    console.error("Error fetching the videos:", error);
    return NextResponse.json(
      { error: "Error fetching the videos" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
