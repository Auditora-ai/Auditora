"use client";

import { useIsMobile } from "@shared/hooks/use-media-query";
import type { HomePageProps } from "../types";
import { HomeDesktop } from "./HomeDesktop";
import { HomeMobile } from "./HomeMobile";

export function HomePage(props: HomePageProps) {
	const isMobile = useIsMobile();

	if (isMobile) {
		return <HomeMobile {...props} />;
	}

	return <HomeDesktop {...props} />;
}
