import { redirect } from "next/navigation";

// Redirect zombie route → HOME - mapa de procesos
export default async function Page({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  redirect(`/${organizationSlug}`);
}
