import PremiumNav from "./PremiumNav";
import PremiumHero from "./PremiumHero";
import SocialProof from "./SocialProof";
import PremiumFeatures from "./PremiumFeatures";
import PremiumShowcase from "./PremiumShowcase";
import PremiumStats from "./PremiumStats";
import PremiumPricing from "./PremiumPricing";
import PremiumCTA from "./PremiumCTA";
import PremiumFooter from "./PremiumFooter";

export default function LandingPagePremium() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] font-body text-white antialiased">
      <PremiumNav />
      <main>
        <PremiumHero />
        <SocialProof />
        <PremiumFeatures />
        <PremiumShowcase />
        <PremiumStats />
        <PremiumPricing />
        <PremiumCTA />
      </main>
      <PremiumFooter />
    </div>
  );
}
