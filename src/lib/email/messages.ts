import "server-only";

import type { Booking, Membership, MembershipPlan, SaunaService, User } from "@/generated/prisma/client";
import { bookingPolicy, siteConfig } from "@/config/site";
import { renderEmail } from "@/lib/email/layout";
import { sendEmail } from "@/lib/email/send";
import { absoluteUrl } from "@/lib/env";
import { formatDateLong, formatDuration, formatPrice, formatTime } from "@/lib/format";

export async function sendBookingConfirmation(
  booking: Booking & { service: SaunaService },
) {
  const { html, text } = renderEmail({
    preheader: `Your ${booking.service.name} is confirmed for ${formatDateLong(booking.startsAt)}.`,
    heading: "Your session is booked",
    body: [
      `Thanks ${firstName(booking.customerName)} — your ${booking.service.name} is confirmed.`,
      "Arrive about five minutes early so you have time to change and shower before your slot starts.",
    ],
    details: [
      { label: "Reference", value: booking.reference },
      { label: "Session", value: booking.service.name },
      { label: "Date", value: formatDateLong(booking.startsAt) },
      {
        label: "Time",
        value: `${formatTime(booking.startsAt)} – ${formatTime(booking.endsAt)}`,
      },
      { label: "Duration", value: formatDuration(booking.service.durationMinutes) },
      { label: "Guests", value: String(booking.guestCount) },
      { label: "Paid", value: formatPrice(booking.amountCents, booking.currency) },
      {
        label: "Where",
        value: `${siteConfig.address.venue}, ${siteConfig.address.postalCode}`,
      },
    ],
    button: { label: "View your bookings", url: absoluteUrl("/account/bookings") },
    footerNote: `You can cancel free of charge up to ${bookingPolicy.freeCancellationHours} hours before your session. Bring a towel and swimwear.`,
  });

  return sendEmail({
    to: booking.customerEmail,
    subject: `Booking confirmed — ${booking.service.name}, ${formatDateLong(booking.startsAt)}`,
    html,
    text,
  });
}

export async function sendBookingCancellation(
  booking: Booking & { service: SaunaService },
) {
  const { html, text } = renderEmail({
    preheader: `Your ${booking.service.name} on ${formatDateLong(booking.startsAt)} has been cancelled.`,
    heading: "Your booking is cancelled",
    body: [
      `Your ${booking.service.name} on ${formatDateLong(booking.startsAt)} at ${formatTime(booking.startsAt)} has been cancelled.`,
      "If a refund is due it will be returned to the card you paid with, and usually appears within a few working days.",
    ],
    details: [
      { label: "Reference", value: booking.reference },
      { label: "Session", value: booking.service.name },
      { label: "Was booked for", value: formatDateLong(booking.startsAt) },
    ],
    button: { label: "Book another session", url: absoluteUrl("/sauna/book") },
  });

  return sendEmail({
    to: booking.customerEmail,
    subject: `Booking cancelled — ${booking.reference}`,
    html,
    text,
  });
}

export async function sendMembershipConfirmation(
  membership: Membership & { plan: MembershipPlan; user: User },
) {
  const isDayPass = membership.plan.isDayPass;

  const { html, text } = renderEmail({
    preheader: isDayPass
      ? "Your day pass is ready."
      : `Your ${membership.plan.name} membership is active.`,
    heading: isDayPass ? "Your day pass is ready" : "Welcome to The W",
    body: isDayPass
      ? [
          `Thanks ${firstName(membership.user.name ?? "")} — your day pass is paid for and ready to use.`,
          "Show your member code at the desk when you arrive.",
        ]
      : [
          `Thanks ${firstName(membership.user.name ?? "")} — your ${membership.plan.name} membership is now active.`,
          "Show your member code at the desk on your first visit and we will get you set up.",
        ],
    details: [
      { label: "Plan", value: membership.plan.name },
      {
        label: "Price",
        value: `${formatPrice(membership.plan.priceCents, membership.plan.currency)}${
          isDayPass ? "" : membership.plan.interval === "YEAR" ? " per year" : " per month"
        }`,
      },
      ...(membership.user.memberCode
        ? [{ label: "Member code", value: membership.user.memberCode }]
        : []),
      {
        label: "Where",
        value: `${siteConfig.address.venue}, ${siteConfig.address.postalCode}`,
      },
    ],
    button: { label: "Go to your account", url: absoluteUrl("/account") },
    footerNote: isDayPass
      ? "Day passes are valid for a single day and are non-refundable once redeemed."
      : "You can manage or cancel your membership at any time from your account.",
  });

  return sendEmail({
    to: membership.user.email,
    subject: isDayPass
      ? "Your day pass at The W"
      : `Your ${membership.plan.name} membership is active`,
    html,
    text,
  });
}

function firstName(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0];
  return first && first.length > 0 ? first : "there";
}
