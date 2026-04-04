"use client";

import { useIsMobile } from "@shared/hooks/use-media-query";
import type { PanoramaData } from "../types";
import { PanoramaDesktop } from "./PanoramaDesktop";
import { PanoramaMobile } from "./PanoramaMobile";

export function PanoramaPage({ data }: { data: PanoramaData }) {
	const isMobile = useIsMobile();

	if (isMobile) {
		return <PanoramaMobile data={data} />;
	}

	return <PanoramaDesktop data={data} />;
}
