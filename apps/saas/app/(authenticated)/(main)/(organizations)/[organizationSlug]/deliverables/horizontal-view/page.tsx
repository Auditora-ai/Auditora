import { redirect } from "next/navigation";

export default function DeliverablesHorizontalViewRedirect({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	params.then(({ organizationSlug }) => {
		redirect(`/${organizationSlug}/processes`);
	});
	return null;
}
