import { prisma } from "@/lib/prisma";

const FREE_TIER_UPLOAD_LIMIT = 10;

export async function ensureUsageRecord(userId: string) {
  const usage = await prisma.usage.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      uploadsToday: 0,
      lastResetAt: new Date(),
    },
  });

  const now = new Date();
  const lastReset = usage.lastResetAt;
  const isNewDay =
    !lastReset ||
    lastReset.getUTCFullYear() !== now.getUTCFullYear() ||
    lastReset.getUTCMonth() !== now.getUTCMonth() ||
    lastReset.getUTCDate() !== now.getUTCDate();

  if (isNewDay) {
    return prisma.usage.update({
      where: { userId },
      data: { uploadsToday: 0, lastResetAt: now },
    });
  }

  return usage;
}

export async function assertWithinUploadLimit(userId: string) {
  const usage = await ensureUsageRecord(userId);
  if (usage.uploadsToday >= FREE_TIER_UPLOAD_LIMIT) {
    const resetTime = new Date(usage.lastResetAt);
    resetTime.setUTCDate(resetTime.getUTCDate() + 1);
    throw new Error(
      `Free tier limit reached (${FREE_TIER_UPLOAD_LIMIT} uploads/day). Resets at ${resetTime.toUTCString()}.`
    );
  }
  return usage;
}

export async function incrementUploadCount(userId: string) {
  await ensureUsageRecord(userId);
  return prisma.usage.update({
    where: { userId },
    data: {
      uploadsToday: { increment: 1 },
      lastUploadAt: new Date(),
    },
  });
}

export function getFreeTierLimit() {
  return FREE_TIER_UPLOAD_LIMIT;
}
