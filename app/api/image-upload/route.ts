import { prisma } from "@/lib/prisma";
import { assertWithinUploadLimit, incrementUploadCount } from "@/lib/usage";
import { ensureUser } from "@/lib/user";
import { uploadPayloadSchema } from "@/lib/validators/upload";
import { AssetType } from "@/prisma/generated/prisma";
import { cloudinaryService } from "@/services/cloudinary.service";
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

    const payload = uploadPayloadSchema
      .omit({ originalSize: true })
      .safeParse({
        title: formData.get("title") ?? "Uploaded image",
        description: formData.get("description") ?? undefined,
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

    const uploadResult = await cloudinaryService.uploadImage(
      Buffer.from(buffer)
    );

    const asset = await prisma.asset.create({
      data: {
        userId,
        type: AssetType.IMAGE,
        title: payload.data.title,
        description: payload.data.description,
        publicId: uploadResult.public_id,
        resourceType: "image",
        originalBytes: file.size,
        processedBytes: uploadResult.bytes,
        format: uploadResult.format,
      },
    });

    await incrementUploadCount(userId);

    return NextResponse.json({ publicId: asset.publicId, asset }, { status: 201 });
  } catch (error) {
    console.error("Upload image failed", error);
    const message =
      error instanceof Error ? error.message : "Upload image failed";
    const status = message.includes("limit") ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
