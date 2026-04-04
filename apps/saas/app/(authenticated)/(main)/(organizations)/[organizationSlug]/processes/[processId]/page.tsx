import { redirect } from "next/navigation";

// Redirect zombie route → process detail
export default async function Page({
  params,
}: {
  params: Promise<{ organizationSlug: string; [key: string]: string }>;
}) {
  const { organizationSlug, ...rest } = await params;
  const id = Object.values(rest)[0] || "";
  redirect(`/${organizationSlug}/process/[id]`.replace("[id]", id));
}
