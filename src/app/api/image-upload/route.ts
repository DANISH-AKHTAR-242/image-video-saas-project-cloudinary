import { trackEvent } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";
import { assertRateLimit } from "@/lib/rate-limit";
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
    assertRateLimit(userId, { maxRequests: 40, windowMs: 60_000 });

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

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an image file." },
        { status: 400 }
      );
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image exceeds max size limit (20MB)." },
        { status: 400 }
      );
    }

    const [userProfile, buffer] = await Promise.all([
      currentUser(),
      file.arrayBuffer(),
    ]);

    const user = await ensureUser(
      userId,
      userProfile?.primaryEmailAddress?.emailAddress
    );
    await assertWithinUploadLimit(userId, user.plan);

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
    await trackEvent("image_uploaded", {
      userId,
      metadata: { publicId: uploadResult.public_id, bytes: uploadResult.bytes },
    });

    return NextResponse.json({ publicId: asset.publicId, asset }, { status: 201 });
  } catch (error) {
    console.error("Upload image failed", error);
    const message =
      error instanceof Error ? error.message : "Upload image failed";
    const status = message.includes("limit") ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
