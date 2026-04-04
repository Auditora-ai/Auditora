import { HeroSection } from "@home/components/HeroSection";
import { LiveDemo } from "@home/components/LiveDemo";
import { BeforeAfter } from "@home/components/BeforeAfter";
import { ThreePillars } from "@home/components/ThreePillars";
import { WhoItsFor } from "@home/components/WhoItsFor";
import { PricingSection } from "@home/components/PricingSection";
import { FinalCta } from "@home/components/FinalCta";

export default async function Home({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;

	return (
		<div data-landing>
			<HeroSection />
			<LiveDemo />
			<BeforeAfter />
			<ThreePillars />
			<WhoItsFor />
			<PricingSection />
			<FinalCta />
		</div>
	);
}
