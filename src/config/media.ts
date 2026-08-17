/**
 * Image manifest.
 *
 * Every photographic slot on the site is declared here once. While `src` is
 * `null` the `<Media>` component renders a designed placeholder frame that
 * names the shot required — so the layout is final, the alt text is written,
 * and handing over means dropping files into `/public/media/` and filling in
 * the paths. No component needs to change.
 */

export type MediaSlot = {
  /** Path under /public once supplied, e.g. "/media/gym-floor.jpg". */
  src: string | null;
  /** Written now so accessibility does not wait on the photographer. */
  alt: string;
  /** Art direction note shown on the placeholder and in handover. */
  brief: string;
  /** Intrinsic ratio the layout reserves. Prevents CLS either way. */
  ratio: `${number}/${number}`;
};

function slot(
  brief: string,
  alt: string,
  ratio: MediaSlot["ratio"],
  src: string | null = null,
): MediaSlot {
  return { src, alt, brief, ratio };
}

export const media = {
  heroFallback: slot(
    "Wide, low-light interior — steam or shafted light, no people",
    "The W Gym & Sauna interior in low light",
    "16/9",
  ),

  gymFeature: slot(
    "Gym floor, wide, natural light from one side",
    "The gym floor at The W, with free weights and rigs",
    "4/5",
  ),
  gymStrength: slot(
    "Rack and barbell detail, shallow depth of field",
    "Squat rack and loaded barbell",
    "1/1",
  ),
  gymFreeWeights: slot(
    "Dumbbell rack, raking side light",
    "Dumbbell rack along the gym wall",
    "1/1",
  ),
  gymCardio: slot(
    "Cardio row, shot down the line",
    "Cardio machines at The W",
    "3/2",
  ),
  gymFunctional: slot(
    "Turf lane or rig with sled, mid-action",
    "Functional training area with sled and turf",
    "3/2",
  ),
  gymCommunity: slot(
    "Two or three members mid-session, candid, not posed",
    "Members training together at The W",
    "3/2",
  ),

  recoveryFeature: slot(
    "Sauna interior, warm lamp, empty benches",
    "The sauna at The W, lit warmly",
    "4/5",
  ),
  sauna: slot(
    "Sauna bench detail, timber grain, warm glow",
    "Timber benches inside the sauna",
    "4/5",
  ),
  iceBath: slot(
    "Ice bath, water surface with cold light",
    "Ice bath at The W",
    "4/5",
  ),
  hotTub: slot(
    "Hot tub at dusk, steam rising",
    "Hot tub at The W",
    "4/5",
  ),
  changing: slot(
    "Changing area, clean and empty",
    "Changing facilities at The W",
    "3/2",
  ),

  saunaHero: slot(
    "Steam against dark timber, very close, abstract",
    "Steam rising inside the sauna",
    "16/9",
  ),
  gymHero: slot(
    "Gym floor wide angle, cool morning light",
    "The gym floor at The W",
    "16/9",
  ),

  founder: slot(
    "Josh Watson, half-length portrait, dark background",
    "Josh Watson, founder and personal trainer at The W",
    "4/5",
  ),

  location: slot(
    "Exterior of the building at Wicklow Rugby Club",
    "The W Gym & Sauna at Wicklow Rugby Club",
    "16/9",
  ),
} as const satisfies Record<string, MediaSlot>;

export type MediaKey = keyof typeof media;
