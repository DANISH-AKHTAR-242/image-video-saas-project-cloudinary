import { prisma } from "@/lib/prisma";
import { assertWithinUploadLimit, incrementUploadCount } from "@/lib/usage";
import { ensureUser } from "@/lib/user";
import { uploadPayloadSchema } from "@/lib/validators/upload";
import { cloudinaryService } from "@/services/cloudinary.service";
import { AssetType } from "@/prisma/generated/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    const payload = uploadPayloadSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description"),
      originalSize: formData.get("originalSize"),
    });

    if (!payload.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: payload.error.flatten() },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 400 });
    }

    await assertWithinUploadLimit(userId);

    const [userProfile, buffer] = await Promise.all([
      currentUser(),
      file.arrayBuffer(),
    ]);

    await ensureUser(userId, userProfile?.primaryEmailAddress?.emailAddress);

    const uploadResult = await cloudinaryService.uploadVideo(
      Buffer.from(buffer)
    );

    const asset = await prisma.asset.create({
      data: {
        userId,
        type: AssetType.VIDEO,
        title: payload.data.title,
        description: payload.data.description,
        publicId: uploadResult.public_id,
        resourceType: "video",
        originalBytes: Number(payload.data.originalSize ?? file.size),
        processedBytes: uploadResult.bytes,
        duration: uploadResult.duration ?? 0,
        format: uploadResult.format,
      },
    });

    await incrementUploadCount(userId);

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error("Upload video failed", error);
    const message =
      error instanceof Error ? error.message : "Upload video failed";
    const status = message.includes("limit") ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
