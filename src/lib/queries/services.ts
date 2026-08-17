import "server-only";

import { prisma } from "@/lib/db/prisma";

export async function getActiveServices() {
  return prisma.saunaService.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getServiceBySlug(slug: string) {
  return prisma.saunaService.findFirst({ where: { slug, active: true } });
}

export async function getServiceById(id: string) {
  return prisma.saunaService.findFirst({ where: { id, active: true } });
}

export type SaunaServiceRecord = Awaited<
  ReturnType<typeof getActiveServices>
>[number];

export async function getActiveTrainers() {
  return prisma.trainer.findMany({
    where: { active: true },
    orderBy: [{ isFounder: "desc" }, { sortOrder: "asc" }],
  });
}

export type TrainerRecord = Awaited<ReturnType<typeof getActiveTrainers>>[number];
