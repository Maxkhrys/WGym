/** Renders a JSON-LD block. Kept in one place so escaping is handled once. */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // Angle brackets are the only injection vector inside a JSON-LD script
      // body; this data is ours, but escaping keeps it safe if it ever isn't.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
