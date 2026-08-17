import qrcode from "qrcode-generator";

import { cn } from "@/lib/cn";

/**
 * Member code panel with a scannable QR.
 *
 * Rendered on the server as inline SVG, so there is no client JavaScript, no
 * canvas, no image request, and the code never leaves the page. Encoding uses
 * `qrcode-generator` rather than a hand-rolled encoder — a QR that staff rely
 * on at the door has to be provably scannable, and that is not something worth
 * reimplementing.
 *
 * ── PLACEHOLDER BEHAVIOUR ────────────────────────────────────────────────
 * Nothing scans this yet. The payload is currently the bare member code. Once
 * door hardware or a staff scanner app is chosen it may need to become a
 * signed token instead — that change is confined to `payloadFor` below.
 * ─────────────────────────────────────────────────────────────────────────
 */

function payloadFor(code: string): string {
  return code;
}

export function MemberCode({
  code,
  className,
}: {
  code: string | null;
  className?: string;
}) {
  if (!code) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-dashed border-line-hi p-6 text-[var(--text-body-sm)] leading-relaxed text-mist-dim",
          className,
        )}
      >
        No member code has been issued for this account yet. It is created
        automatically when a membership is set up.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-5 rounded-2xl border border-line bg-bone p-6",
        className,
      )}
    >
      <QrCode value={payloadFor(code)} className="h-40 w-40" />
      <div className="text-center">
        <p className="u-tnum text-[length:var(--text-h4)] font-medium tracking-[0.08em] text-ink">
          {code}
        </p>
        <p className="mt-1.5 text-[var(--text-caption)] text-ink/60">
          Show this at the desk
        </p>
      </div>
    </div>
  );
}

function QrCode({ value, className }: { value: string; className?: string }) {
  // Type 0 = pick the smallest version that fits; "M" error correction copes
  // with a partly obscured or smudged phone screen.
  const qr = qrcode(0, "M");
  qr.addData(value);
  qr.make();

  const count = qr.getModuleCount();
  const quiet = 4;
  const total = count + quiet * 2;

  // One path for every dark module beats one <rect> each — far fewer nodes.
  let path = "";
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (qr.isDark(row, col)) {
        path += `M${col + quiet} ${row + quiet}h1v1h-1z`;
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      className={className}
      role="img"
      aria-label={`QR code for member code ${value}`}
      shapeRendering="crispEdges"
    >
      <rect width={total} height={total} fill="#ffffff" />
      <path d={path} fill="#07090a" />
    </svg>
  );
}
