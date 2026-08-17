type ClassValue = string | number | null | undefined | false | ClassValue[];

/**
 * Minimal class joiner. The project has no conflicting-utility problem that
 * would justify pulling in clsx + tailwind-merge, and keeping this local keeps
 * it out of every client bundle boundary.
 */
export function cn(...values: ClassValue[]): string {
  const out: string[] = [];

  for (const value of values) {
    if (!value) continue;
    if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) out.push(nested);
    } else {
      out.push(String(value));
    }
  }

  return out.join(" ");
}
