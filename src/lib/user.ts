import { prisma } from "@/lib/prisma";
import { Plan, Role } from "@/prisma/generated/prisma";

export async function ensureUser(userId: string, email?: string | null) {
  const isAdmin =
    Boolean(process.env.ADMIN_EMAIL) &&
    Boolean(email) &&
    process.env.ADMIN_EMAIL === email;

  return prisma.user.upsert({
    where: { id: userId },
    create: {
      id: userId,
      email: email ?? undefined,
      plan: Plan.FREE,
      role: isAdmin ? Role.ADMIN : Role.USER,
    },
    update: {
      email: email ?? undefined,
      role: isAdmin ? Role.ADMIN : Role.USER,
    },
  });
}

export async function setUserPlan(userId: string, plan: Plan) {
  return prisma.user.update({
    where: { id: userId },
    data: { plan },
  });
}
