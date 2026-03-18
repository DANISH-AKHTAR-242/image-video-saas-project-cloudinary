import { prisma } from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/prisma";

export async function trackEvent(
  name: string,
  options?: {
    userId?: string;
    metadata?: Record<string, unknown>;
  }
) {
  return prisma.analyticsEvent.create({
    data: {
      name,
      userId: options?.userId,
      metadata: options?.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}
