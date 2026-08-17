import "server-only";

import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth/config";
import type { Role } from "@/generated/prisma/enums";

/** Roles that may reach /admin at all. */
export const STAFF_ROLES: Role[] = ["OWNER", "ADMIN", "STAFF"];

/** Roles that may change money, plans or other people's memberships. */
export const MANAGER_ROLES: Role[] = ["OWNER", "ADMIN"];

export type SessionUser = {
  id: string;
  role: Role;
  email: string;
  name: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return null;

  return {
    id: session.user.id,
    role: session.user.role ?? "MEMBER",
    email: session.user.email,
    name: session.user.name ?? null,
  };
}

/**
 * Requires any signed-in user. Sends visitors to sign-in with a callback so
 * they land back where they were trying to go.
 */
export async function requireUser(callbackPath: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }
  return user;
}

/**
 * Requires one of `roles`.
 *
 * The two failure modes are deliberately different. A signed-out visitor is
 * sent to sign in. A signed-in member who lacks the role gets a 404, not a
 * redirect: bouncing them to sign-in would be a loop they can never escape,
 * since signing in again cannot grant the role, and a 404 avoids confirming
 * that the admin area exists at that path.
 */
export async function requireRole(
  roles: Role[],
  callbackPath: string,
): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }

  if (!roles.includes(user.role)) {
    notFound();
  }

  return user;
}

/**
 * Guards for route handlers and server actions.
 *
 * These return a `Response` to throw rather than calling a navigation
 * interrupt, so they work identically in both contexts and do not depend on
 * experimental APIs.
 */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export async function requireUserApi(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new HttpError(401, "You need to be signed in.");
  return user;
}

export async function requireRoleApi(roles: Role[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new HttpError(401, "You need to be signed in.");
  if (!roles.includes(user.role)) {
    throw new HttpError(403, "You do not have access to this.");
  }
  return user;
}

/** Turns a thrown HttpError into a JSON response; rethrows anything else. */
export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  console.error(error);
  return Response.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 },
  );
}

export function isStaff(role: Role): boolean {
  return STAFF_ROLES.includes(role);
}

export function isManager(role: Role): boolean {
  return MANAGER_ROLES.includes(role);
}
