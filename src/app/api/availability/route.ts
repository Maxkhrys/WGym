import { headers } from "next/headers";

import { getAvailability } from "@/lib/booking/availability";
import { expireStaleHolds } from "@/lib/booking/holds";
import { isDateKey } from "@/lib/booking/time";
import { errorResponse } from "@/lib/auth/guards";
import { getServiceBySlug } from "@/lib/queries/services";
import { clientKey, rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { availabilityQuerySchema } from "@/lib/validation/booking";

/**
 * Slot lookup for the booking calendar.
 *
 * Read-only, but it hits the database on every date change, so it is rate
 * limited and never cached — availability that is even a minute stale would
 * show slots that are already gone.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const requestHeaders = await headers();

    const limit = rateLimit(
      clientKey(requestHeaders, "availability"),
      RATE_LIMITS.availability,
    );

    if (!limit.success) {
      return Response.json(
        { error: "Too many requests. Please slow down." },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSeconds) },
        },
      );
    }

    const url = new URL(request.url);
    const parsed = availabilityQuerySchema.safeParse({
      serviceSlug: url.searchParams.get("service"),
      from: url.searchParams.get("from"),
      days: url.searchParams.get("days") ?? undefined,
    });

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request." },
        { status: 400 },
      );
    }

    if (!isDateKey(parsed.data.from)) {
      return Response.json({ error: "Invalid date." }, { status: 400 });
    }

    const service = await getServiceBySlug(parsed.data.serviceSlug);
    if (!service) {
      return Response.json({ error: "Unknown session." }, { status: 404 });
    }

    // Opportunistic sweep so expired holds do not linger as PENDING rows.
    await expireStaleHolds();

    const days = await getAvailability({
      service,
      from: parsed.data.from,
      days: parsed.data.days,
    });

    return Response.json(
      {
        service: {
          slug: service.slug,
          name: service.name,
          durationMinutes: service.durationMinutes,
          priceCents: service.priceCents,
          currency: service.currency,
          maxGuestsPerBooking: service.maxGuestsPerBooking,
          isExclusive: service.isExclusive,
        },
        days,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
