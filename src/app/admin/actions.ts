"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  MANAGER_ROLES,
  STAFF_ROLES,
  requireRoleApi,
  HttpError,
} from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { sendBookingCancellation } from "@/lib/email/messages";
import { setSetting } from "@/lib/settings";

export type AdminActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; message: string };

/**
 * Wraps an admin action with a role check and uniform error handling.
 *
 * Every mutation below goes through this, so a new action cannot be added
 * without a role gate — the check is part of the calling convention rather
 * than something to remember.
 */
async function guarded(
  roles: typeof STAFF_ROLES,
  run: () => Promise<AdminActionState>,
): Promise<AdminActionState> {
  try {
    await requireRoleApi(roles);
    return await run();
  } catch (error) {
    if (error instanceof HttpError) {
      return { status: "error", message: error.message };
    }
    console.error("Admin action failed:", error);
    return { status: "error", message: "Something went wrong. Please try again." };
  }
}

// --- Bookings -------------------------------------------------------------

const bookingStatusSchema = z.object({
  bookingId: z.string().min(1).max(60),
  action: z.enum(["attended", "no_show", "cancel", "confirm"]),
});

/** Staff can work the day's list: mark attended, no-show, confirm or cancel. */
export async function updateBookingStatus(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  return guarded(STAFF_ROLES, async () => {
    const parsed = bookingStatusSchema.safeParse({
      bookingId: formData.get("bookingId"),
      action: formData.get("action"),
    });

    if (!parsed.success) {
      return { status: "error", message: "Invalid request." };
    }

    const booking = await prisma.booking.findUnique({
      where: { id: parsed.data.bookingId },
      include: { service: true },
    });

    if (!booking) return { status: "error", message: "Booking not found." };

    const now = new Date();

    switch (parsed.data.action) {
      case "attended":
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: "COMPLETED", attendedAt: now },
        });
        break;

      case "no_show":
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: "NO_SHOW" },
        });
        break;

      case "confirm":
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: "CONFIRMED", holdExpiresAt: null },
        });
        break;

      case "cancel": {
        const cancelled = await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: "CANCELLED",
            cancelledAt: now,
            cancellationReason: "Cancelled by staff",
            holdExpiresAt: null,
          },
          include: { service: true },
        });

        await sendBookingCancellation(cancelled).catch((error) =>
          console.error("Cancellation email failed:", error),
        );
        break;
      }
    }

    revalidatePath("/admin");
    revalidatePath("/admin/bookings");

    return { status: "success", message: "Booking updated." };
  });
}

// --- Membership plans -----------------------------------------------------

const planSchema = z.object({
  planId: z.string().min(1).max(60),
  name: z.string().trim().min(1).max(80),
  priceEuros: z.coerce.number().min(0).max(10_000),
  joiningFeeEuros: z.coerce.number().min(0).max(10_000),
  active: z.boolean(),
});

/** Only managers change prices. Staff can view but not edit. */
export async function updatePlan(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  return guarded(MANAGER_ROLES, async () => {
    const parsed = planSchema.safeParse({
      planId: formData.get("planId"),
      name: formData.get("name"),
      priceEuros: formData.get("priceEuros"),
      joiningFeeEuros: formData.get("joiningFeeEuros") ?? 0,
      active: formData.get("active") === "on",
    });

    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message ?? "Check the values entered.",
      };
    }

    await prisma.membershipPlan.update({
      where: { id: parsed.data.planId },
      data: {
        name: parsed.data.name,
        // Stored as integer minor units; never a float.
        priceCents: Math.round(parsed.data.priceEuros * 100),
        joiningFeeCents: Math.round(parsed.data.joiningFeeEuros * 100),
        active: parsed.data.active,
      },
    });

    // Every route that renders a plan price is statically generated, so each
    // one has to be invalidated or it keeps serving the old figure.
    revalidatePath("/admin/plans");
    revalidatePath("/memberships");
    revalidatePath("/gym");
    revalidatePath("/signup");
    revalidatePath("/");

    return { status: "success", message: "Plan updated." };
  });
}

// --- Sauna services -------------------------------------------------------

const serviceSchema = z.object({
  serviceId: z.string().min(1).max(60),
  name: z.string().trim().min(1).max(80),
  priceEuros: z.coerce.number().min(0).max(10_000),
  durationMinutes: z.coerce.number().int().min(5).max(480),
  bufferMinutes: z.coerce.number().int().min(0).max(240),
  capacity: z.coerce.number().int().min(1).max(100),
  maxGuestsPerBooking: z.coerce.number().int().min(1).max(100),
  active: z.boolean(),
});

export async function updateService(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  return guarded(MANAGER_ROLES, async () => {
    const parsed = serviceSchema.safeParse({
      serviceId: formData.get("serviceId"),
      name: formData.get("name"),
      priceEuros: formData.get("priceEuros"),
      durationMinutes: formData.get("durationMinutes"),
      bufferMinutes: formData.get("bufferMinutes"),
      capacity: formData.get("capacity"),
      maxGuestsPerBooking: formData.get("maxGuestsPerBooking"),
      active: formData.get("active") === "on",
    });

    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message ?? "Check the values entered.",
      };
    }

    if (parsed.data.maxGuestsPerBooking > parsed.data.capacity) {
      return {
        status: "error",
        message: "A single booking cannot take more guests than the capacity.",
      };
    }

    await prisma.saunaService.update({
      where: { id: parsed.data.serviceId },
      data: {
        name: parsed.data.name,
        priceCents: Math.round(parsed.data.priceEuros * 100),
        durationMinutes: parsed.data.durationMinutes,
        bufferMinutes: parsed.data.bufferMinutes,
        capacity: parsed.data.capacity,
        maxGuestsPerBooking: parsed.data.maxGuestsPerBooking,
        active: parsed.data.active,
      },
    });

    revalidatePath("/admin/services");
    revalidatePath("/sauna");
    revalidatePath("/sauna/book");
    revalidatePath("/facilities");

    return { status: "success", message: "Session updated." };
  });
}

// --- Availability & closures ---------------------------------------------

const hoursSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  open: z.string().regex(/^\d{2}:\d{2}$/),
  close: z.string().regex(/^\d{2}:\d{2}$/),
  closed: z.boolean(),
});

function toMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

/** House opening hours, which drive the bookable slot grid. */
export async function updateOpeningHours(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  return guarded(MANAGER_ROLES, async () => {
    const parsed = hoursSchema.safeParse({
      dayOfWeek: formData.get("dayOfWeek"),
      open: formData.get("open"),
      close: formData.get("close"),
      closed: formData.get("closed") === "on",
    });

    if (!parsed.success) {
      return { status: "error", message: "Enter times as HH:MM." };
    }

    const { dayOfWeek, closed } = parsed.data;
    const startMinute = toMinutes(parsed.data.open);
    const endMinute = toMinutes(parsed.data.close);

    if (!closed && endMinute <= startMinute) {
      return { status: "error", message: "Closing time must be after opening time." };
    }

    // House hours are the rules with no service attached.
    await prisma.availabilityRule.deleteMany({
      where: { serviceId: null, dayOfWeek },
    });

    if (!closed) {
      await prisma.availabilityRule.create({
        data: { serviceId: null, dayOfWeek, startMinute, endMinute },
      });
    }

    // Opening hours drive both the displayed hours and the bookable grid.
    revalidatePath("/admin/availability");
    revalidatePath("/sauna/book");
    revalidatePath("/sauna");
    revalidatePath("/gym");
    revalidatePath("/facilities");
    revalidatePath("/contact");
    revalidatePath("/");

    return { status: "success", message: "Opening hours updated." };
  });
}

const blockSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().trim().max(160).optional(),
});

/** Blocks a whole day for every service. */
export async function blockDay(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  return guarded(STAFF_ROLES, async () => {
    const parsed = blockSchema.safeParse({
      date: formData.get("date"),
      reason: formData.get("reason") ?? undefined,
    });

    if (!parsed.success) {
      return { status: "error", message: "Choose a date to block." };
    }

    const { startOfBusinessDay, endOfBusinessDay } = await import(
      "@/lib/booking/time"
    );

    await prisma.blockedTime.create({
      data: {
        serviceId: null,
        startsAt: startOfBusinessDay(parsed.data.date),
        endsAt: endOfBusinessDay(parsed.data.date),
        reason: parsed.data.reason?.trim() || "Closed",
      },
    });

    revalidatePath("/admin/availability");
    revalidatePath("/sauna/book");

    return { status: "success", message: "Day blocked." };
  });
}

export async function removeBlock(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  return guarded(STAFF_ROLES, async () => {
    const id = String(formData.get("blockId") ?? "");
    if (!id) return { status: "error", message: "Invalid request." };

    await prisma.blockedTime.delete({ where: { id } });

    revalidatePath("/admin/availability");
    revalidatePath("/sauna/book");

    return { status: "success", message: "Block removed." };
  });
}

// --- Site settings --------------------------------------------------------

const settingsSchema = z.object({
  contactEmail: z.string().trim().max(254),
  contactPhone: z.string().trim().max(32),
  instagram: z.string().trim().max(300),
});

export async function updateSiteSettings(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  return guarded(MANAGER_ROLES, async () => {
    const parsed = settingsSchema.safeParse({
      contactEmail: formData.get("contactEmail") ?? "",
      contactPhone: formData.get("contactPhone") ?? "",
      instagram: formData.get("instagram") ?? "",
    });

    if (!parsed.success) {
      return { status: "error", message: "Check the values entered." };
    }

    // Empty is meaningful — it means "not published yet" and the UI hides the
    // field rather than showing a blank link.
    if (parsed.data.contactEmail && !z.email().safeParse(parsed.data.contactEmail).success) {
      return { status: "error", message: "Enter a valid contact email." };
    }

    await setSetting("contact.email", parsed.data.contactEmail);
    await setSetting("contact.phone", parsed.data.contactPhone);
    await setSetting("social.instagram", parsed.data.instagram);

    revalidatePath("/", "layout");

    return { status: "success", message: "Settings saved." };
  });
}

// --- Members --------------------------------------------------------------

const membershipActionSchema = z.object({
  membershipId: z.string().min(1).max(60),
  action: z.enum(["cancel", "reactivate"]),
});

export async function updateMembershipStatus(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  return guarded(MANAGER_ROLES, async () => {
    const parsed = membershipActionSchema.safeParse({
      membershipId: formData.get("membershipId"),
      action: formData.get("action"),
    });

    if (!parsed.success) return { status: "error", message: "Invalid request." };

    const membership = await prisma.membership.findUnique({
      where: { id: parsed.data.membershipId },
    });

    if (!membership) return { status: "error", message: "Membership not found." };

    if (parsed.data.action === "cancel") {
      await prisma.membership.update({
        where: { id: membership.id },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });

      // NOTE: this cancels our record only. If the membership has a live
      // Stripe subscription it must also be cancelled in Stripe, otherwise
      // the customer keeps being charged. Surfaced in the UI rather than done
      // silently here, because the refund decision is a human one.
      return {
        status: "success",
        message: membership.stripeSubscriptionId
          ? "Membership cancelled here. Cancel the subscription in Stripe too so billing stops."
          : "Membership cancelled.",
      };
    }

    await prisma.membership.update({
      where: { id: membership.id },
      data: { status: "ACTIVE", cancelledAt: null },
    });

    revalidatePath("/admin/members");

    return { status: "success", message: "Membership reactivated." };
  });
}
