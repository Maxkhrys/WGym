import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="u-page flex min-h-[100svh] flex-col justify-center py-32">
      <div className="mx-auto w-full max-w-lg">
        <p className="u-eyebrow u-tnum text-accent-bright">404</p>
        <h1 className="mt-6 text-[length:var(--text-h2)] leading-[0.94]">
          That page isn&rsquo;t here
        </h1>
        <p className="mt-6 text-[length:var(--text-body-lg)] leading-relaxed text-mist">
          The link may be out of date, or the page may have moved. Everything
          else is where you left it.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/" size="lg">
            Back to home
          </ButtonLink>
          <ButtonLink href="/contact" variant="secondary" size="lg">
            Contact us
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
