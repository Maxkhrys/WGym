import { FacilitiesGallery } from "@/components/marketing/FacilitiesGallery";
import { GymFeature } from "@/components/marketing/GymFeature";
import { IntroStatement } from "@/components/marketing/IntroStatement";
import { LocationSection } from "@/components/marketing/LocationSection";
import { MembershipPreview } from "@/components/marketing/MembershipPreview";
import { RecoveryFeature } from "@/components/marketing/RecoveryFeature";
import { Testimonials } from "@/components/marketing/Testimonials";
import { TrainerSection } from "@/components/marketing/TrainerSection";
import { HomeHero } from "@/components/marketing/hero/HomeHero";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <IntroStatement />
      <GymFeature />
      <RecoveryFeature />
      <MembershipPreview />
      <FacilitiesGallery />
      <TrainerSection />
      <Testimonials />
      <LocationSection />
    </>
  );
}
