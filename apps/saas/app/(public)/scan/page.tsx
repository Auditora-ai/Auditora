import { ScanPage } from "@scan/components/ScanPage";

interface ScanPageProps {
  searchParams: Promise<{ url?: string; ref?: string }>;
}

export default async function Page({ searchParams }: ScanPageProps) {
  const params = await searchParams;
  const url = params.url ?? null;
  const ref = params.ref ?? null;

  return <ScanPage initialUrl={url} refSource={ref} />;
}
