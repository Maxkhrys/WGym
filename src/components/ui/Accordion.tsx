"use client";

import { useId, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

export type AccordionItem = {
  question: string;
  answer: ReactNode;
};

/**
 * FAQ accordion built on buttons and `aria-expanded` rather than
 * `<details>`, so the open/close transition can be animated and the heading
 * level stays under the page's control.
 *
 * The panel uses `grid-template-rows: 0fr -> 1fr`, which animates to the
 * content's natural height without measuring it in JS.
 */
export function Accordion({
  items,
  className,
  headingLevel = 3,
}: {
  items: AccordionItem[];
  className?: string;
  headingLevel?: 2 | 3 | 4;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const baseId = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";

  return (
    <div className={cn("flex flex-col", className)}>
      {items.map((item, index) => {
        const expanded = open === index;
        const buttonId = `${baseId}-trigger-${index}`;
        const panelId = `${baseId}-panel-${index}`;

        return (
          <div key={item.question} className="border-b border-line first:border-t">
            <Heading className="m-0 text-[length:inherit] font-normal leading-normal tracking-normal">
              <button
                type="button"
                id={buttonId}
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpen(expanded ? null : index)}
                className="group flex w-full items-start justify-between gap-6 py-6 text-left"
              >
                <span className="font-[family-name:var(--font-display)] text-[length:var(--text-body-lg)] font-medium tracking-[-0.02em] text-bone transition-colors duration-300 group-hover:text-accent-bright">
                  {item.question}
                </span>
                <span
                  aria-hidden
                  className="relative mt-2 h-3 w-3 shrink-0 text-mist transition-colors duration-300 group-hover:text-accent-bright"
                >
                  <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-current" />
                  <span
                    className={cn(
                      "absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-current transition-transform duration-400 ease-[var(--ease-out-quint)]",
                      expanded ? "scale-y-0" : "scale-y-100",
                    )}
                  />
                </span>
              </button>
            </Heading>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              // `inert` rather than `hidden`: the panel keeps its collapse
              // transition while still being removed from the tab order and
              // the accessibility tree when closed.
              inert={!expanded}
              className={cn(
                "grid transition-[grid-template-rows] duration-400 ease-[var(--ease-out-quint)]",
                expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <div className="u-measure pb-7 text-[var(--text-body-sm)] leading-relaxed text-mist">
                  {item.answer}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
