import { redirect } from "next/navigation";

// Redirect zombie route → HOME
export default async function Page({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  redirect(`/${organizationSlug}`);
}
