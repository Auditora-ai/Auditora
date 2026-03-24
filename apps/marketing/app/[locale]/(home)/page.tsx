import { CtaSection } from "@home/components/CtaSection";
import { FaqSection } from "@home/components/FaqSection";
import { HeroSection } from "@home/components/HeroSection";
import { PillarsSection } from "@home/components/PillarsSection";
import { PricingSection } from "@home/components/PricingSection";
import { ToolsShowcaseSection } from "@home/components/ToolsShowcaseSection";
import { TryItSection } from "@home/components/TryItSection";
import { setRequestLocale } from "next-intl/server";

export default async function Home({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	return (
		<>
			<HeroSection />
			<TryItSection />
			<ToolsShowcaseSection />
			<PillarsSection />
			<PricingSection />
			<FaqSection />
			<CtaSection />
		</>
	);
}
