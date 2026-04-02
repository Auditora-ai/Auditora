import { redirect } from "next/navigation";

export default function DeliverablesRisksRedirect({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	params.then(({ organizationSlug }) => {
		redirect(`/${organizationSlug}/processes`);
	});
	return null;
}
