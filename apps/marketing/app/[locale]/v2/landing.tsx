"use client";

import { Hero } from "@home-v2/components/Hero";
import { TrustBar } from "@home-v2/components/TrustBar";
import { ProblemSection } from "@home-v2/components/ProblemSection";
import { HowItWorks } from "@home-v2/components/HowItWorks";
import { StarFeature } from "@home-v2/components/StarFeature";
import { CapabilitiesGrid } from "@home-v2/components/CapabilitiesGrid";
import { SocialProof } from "@home-v2/components/SocialProof";
import { WhoItsFor } from "@home-v2/components/WhoItsFor";
import { Methodology } from "@home-v2/components/Methodology";
import { PricingTeaser } from "@home-v2/components/PricingTeaser";
import { Faq } from "@home-v2/components/Faq";
import { FinalCta } from "@home-v2/components/FinalCta";

export function V2Landing() {
	return (
		<div className="min-h-screen bg-[#030712] text-white antialiased">
			<Hero />
			<TrustBar />
			<ProblemSection />
			<HowItWorks />
			<StarFeature />
			<CapabilitiesGrid />
			<SocialProof />
			<WhoItsFor />
			<Methodology />
			<PricingTeaser />
			<Faq />
			<FinalCta />
		</div>
	);
}
