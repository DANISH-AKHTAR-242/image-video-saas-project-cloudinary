import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS } from "@/lib/plans";
import { Plan } from "@/prisma/generated/prisma";

export class UsageLimitError extends Error {
  statusCode = 429;

  constructor(message: string) {
    super(message);
    this.name = "UsageLimitError";
  }
}

function isNewUtcDay(lastResetAt: Date, now: Date) {
  return (
    lastResetAt.getUTCFullYear() !== now.getUTCFullYear() ||
    lastResetAt.getUTCMonth() !== now.getUTCMonth() ||
    lastResetAt.getUTCDate() !== now.getUTCDate()
  );
}

function isNewUtcMonth(lastResetAt: Date, now: Date) {
  return (
    lastResetAt.getUTCFullYear() !== now.getUTCFullYear() ||
    lastResetAt.getUTCMonth() !== now.getUTCMonth()
  );
}

export async function ensureUsageRecord(userId: string) {
  const usage = await prisma.usage.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      uploadsToday: 0,
      uploadsThisMonth: 0,
      transformationsThisMonth: 0,
      lastDailyResetAt: new Date(),
      lastMonthlyResetAt: new Date(),
    },
  });

  const now = new Date();
  const shouldResetDaily = isNewUtcDay(usage.lastDailyResetAt, now);
  const shouldResetMonthly = isNewUtcMonth(usage.lastMonthlyResetAt, now);

  if (!shouldResetDaily && !shouldResetMonthly) {
    return usage;
  }

  return prisma.usage.update({
    where: { userId },
    data: {
      uploadsToday: shouldResetDaily ? 0 : usage.uploadsToday,
      uploadsThisMonth: shouldResetMonthly ? 0 : usage.uploadsThisMonth,
      transformationsThisMonth: shouldResetMonthly
        ? 0
        : usage.transformationsThisMonth,
      lastDailyResetAt: shouldResetDaily ? now : usage.lastDailyResetAt,
      lastMonthlyResetAt: shouldResetMonthly ? now : usage.lastMonthlyResetAt,
    },
  });
}

function getResetHint(lastDailyResetAt: Date) {
  const resetTime = new Date(lastDailyResetAt);
  resetTime.setUTCDate(resetTime.getUTCDate() + 1);
  return resetTime.toUTCString();
}

export async function assertWithinUploadLimit(userId: string, plan: Plan) {
  const usage = await ensureUsageRecord(userId);
  const limit = PLAN_LIMITS[plan];

  if (usage.uploadsToday >= limit.dailyUploads) {
    throw new UsageLimitError(
      `Daily upload limit reached for ${plan} plan. Upgrade your plan or wait until ${getResetHint(usage.lastDailyResetAt)}.`
    );
  }

  if (usage.uploadsThisMonth >= limit.monthlyUploads) {
    throw new UsageLimitError(
      `Monthly upload limit reached for ${plan} plan. Upgrade your plan to continue uploading.`
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
      uploadsThisMonth: { increment: 1 },
      lastUploadAt: new Date(),
    },
  });
}

export async function incrementTransformationCount(userId: string) {
  await ensureUsageRecord(userId);
  return prisma.usage.update({
    where: { userId },
    data: {
      transformationsThisMonth: { increment: 1 },
    },
  });
}

export function getLimitForPlan(plan: Plan) {
  return PLAN_LIMITS[plan];
}

