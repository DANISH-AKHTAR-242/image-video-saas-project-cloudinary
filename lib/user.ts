import { prisma } from "@/lib/prisma";
import { Plan } from "@/prisma/generated/prisma";

export async function ensureUser(userId: string, email?: string | null) {
  return prisma.user.upsert({
    where: { id: userId },
    create: {
      id: userId,
      email: email ?? undefined,
      plan: Plan.FREE,
    },
    update: {
      email: email ?? undefined,
    },
  });
}
