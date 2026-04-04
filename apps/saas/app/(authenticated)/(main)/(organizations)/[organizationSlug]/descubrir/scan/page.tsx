import { ScanPage } from "@scan/components/ScanPage";

export async function generateMetadata() {
	return { title: "Scan Automático" };
}

export default async function DescubrirScanPage({
	searchParams,
}: {
	searchParams: Promise<{ url?: string; ref?: string }>;
}) {
	const { url, ref } = await searchParams;

	return <ScanPage initialUrl={url ?? null} refSource={ref ?? null} />;
}
