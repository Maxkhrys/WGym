import "server-only";

import { prisma } from "@/lib/db/prisma";

/**
 * Membership plans, always read from the database so a price edited in /admin
 * takes effect everywhere at once. Nothing that renders a price should reach
 * for the seed config directly.
 */
export async function getActivePlans() {
  return prisma.membershipPlan.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getPlanBySlug(slug: string) {
  return prisma.membershipPlan.findFirst({
    where: { slug, active: true },
  });
}

export async function getPlanById(id: string) {
  return prisma.membershipPlan.findFirst({
    where: { id, active: true },
  });
}

export type MembershipPlanRecord = Awaited<
  ReturnType<typeof getActivePlans>
>[number];
