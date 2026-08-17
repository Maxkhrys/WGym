import { siteConfig } from "@/config/site";
import { env } from "@/lib/env";

/**
 * Hand-rolled email HTML.
 *
 * Table layout, inline styles and no web fonts — the constraints of real mail
 * clients, which strip <style> blocks and ignore most modern CSS. Kept as
 * plain template functions rather than a component library so there is no
 * render step and nothing extra in the server bundle.
 */

const BRAND = {
  ink: "#07090a",
  surface: "#12191a",
  line: "#232d2e",
  bone: "#eef2f0",
  mist: "#9aa8a5",
  teal: "#62a8a2",
} as const;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type EmailButton = { label: string; url: string };

export function renderEmail({
  preheader,
  heading,
  body,
  button,
  details,
  footerNote,
}: {
  /** Inbox preview text. Hidden in the body itself. */
  preheader: string;
  heading: string;
  /** Paragraphs, plain text — escaped before insertion. */
  body: string[];
  button?: EmailButton;
  /** Label/value rows, e.g. a booking summary. */
  details?: { label: string; value: string }[];
  footerNote?: string;
}): { html: string; text: string } {
  const paragraphs = body
    .map(
      (line) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${BRAND.mist};">${escapeHtml(line)}</p>`,
    )
    .join("");

  const detailRows = (details ?? [])
    .map(
      (row) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid ${BRAND.line};font-size:14px;color:${BRAND.mist};">${escapeHtml(row.label)}</td>
          <td style="padding:10px 0;border-bottom:1px solid ${BRAND.line};font-size:14px;color:${BRAND.bone};text-align:right;font-weight:600;">${escapeHtml(row.value)}</td>
        </tr>`,
    )
    .join("");

  const detailsBlock = detailRows
    ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 24px;">${detailRows}</table>`
    : "";

  const buttonBlock = button
    ? `
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 28px;">
        <tr>
          <td style="border-radius:999px;background:${BRAND.bone};">
            <a href="${button.url}" style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:600;color:${BRAND.ink};text-decoration:none;border-radius:999px;">${escapeHtml(button.label)}</a>
          </td>
        </tr>
      </table>`
    : "";

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.ink};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${BRAND.ink};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background:${BRAND.surface};border:1px solid ${BRAND.line};border-radius:16px;">
          <tr>
            <td style="padding:36px 32px 0;">
              <p style="margin:0;font-size:13px;letter-spacing:0.22em;text-transform:uppercase;color:${BRAND.teal};font-family:Helvetica,Arial,sans-serif;">The W</p>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 32px 36px;font-family:Helvetica,Arial,sans-serif;">
              <h1 style="margin:0 0 20px;font-size:26px;line-height:1.15;color:${BRAND.bone};font-weight:600;letter-spacing:-0.02em;">${escapeHtml(heading)}</h1>
              ${paragraphs}
              ${detailsBlock}
              ${buttonBlock}
              ${
                footerNote
                  ? `<p style="margin:20px 0 0;padding-top:20px;border-top:1px solid ${BRAND.line};font-size:13px;line-height:1.6;color:#6b7876;">${escapeHtml(footerNote)}</p>`
                  : ""
              }
            </td>
          </tr>
        </table>

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;">
          <tr>
            <td style="padding:22px 32px;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.7;color:#6b7876;">
              ${escapeHtml(siteConfig.name)}<br>
              ${escapeHtml(siteConfig.address.venue)}, ${escapeHtml(siteConfig.address.postalCode)}, ${escapeHtml(siteConfig.address.country)}<br>
              <a href="${env.siteUrl}" style="color:#6b7876;">${escapeHtml(env.siteUrl.replace(/^https?:\/\//, ""))}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    heading,
    "",
    ...body,
    "",
    ...(details ?? []).map((row) => `${row.label}: ${row.value}`),
    ...(details?.length ? [""] : []),
    ...(button ? [`${button.label}: ${button.url}`, ""] : []),
    ...(footerNote ? [footerNote, ""] : []),
    `${siteConfig.name}`,
    `${siteConfig.address.venue}, ${siteConfig.address.postalCode}, ${siteConfig.address.country}`,
    env.siteUrl,
  ].join("\n");

  return { html, text };
}
