import { ContactForm } from "@/components/marketing/ContactForm";
import { LocationSection } from "@/components/marketing/LocationSection";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contact",
  description:
    "Get in touch with The W Gym & Sauna at Wicklow Rugby Club — opening hours, location, parking and enquiries.",
  path: "/contact",
});

export const dynamic = "force-dynamic";

const SUBJECTS: Record<string, string> = {
  "personal-training": "Personal training enquiry",
  membership: "Membership enquiry",
  sauna: "Sauna and recovery enquiry",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const params = await searchParams;
  const defaultSubject = params.subject ? SUBJECTS[params.subject] : undefined;

  return (
    <>
      <section className="u-grain relative isolate overflow-hidden border-b border-line bg-ink pb-20 pt-40 sm:pb-24 lg:pb-28 lg:pt-52">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 -z-10 h-[60%] opacity-70"
          style={{
            background:
              "radial-gradient(70% 100% at 30% 0%, color-mix(in oklab, var(--color-teal) 20%, transparent) 0%, transparent 70%)",
          }}
        />
        <div className="u-page">
          <div className="grid gap-x-16 gap-y-14 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="u-eyebrow c-fade-up">Contact</p>
              <h1
                className="c-fade-up mt-7 text-[length:var(--text-h1)] leading-[0.9]"
                style={{ ["--reveal-delay" as string]: "80ms" }}
              >
                Get in touch
              </h1>
              <p
                className="c-fade-up u-measure mt-8 text-[length:var(--text-lead)] leading-[1.45] text-mist"
                style={{ ["--reveal-delay" as string]: "180ms" }}
              >
                Questions about membership, personal training or the recovery
                space — send us a message and we will come back to you.
              </p>
            </div>

            <div
              className="c-fade-up lg:col-span-6 lg:col-start-7"
              style={{ ["--reveal-delay" as string]: "260ms" }}
            >
              <ContactForm defaultSubject={defaultSubject} />
            </div>
          </div>
        </div>
      </section>

      <LocationSection />
    </>
  );
}
