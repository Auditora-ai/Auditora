import { MeetingView } from "@meeting/components/MeetingView";

export const metadata = {
  title: "Live Session — Prozea",
};

export default async function LiveSessionPage({
  params,
}: {
  params: Promise<{ organizationSlug: string; sessionId: string }>;
}) {
  const { sessionId } = await params;

  // TODO: Fetch session from DB to get type and process name
  // For now, render with defaults
  return (
    <MeetingView
      sessionId={sessionId}
      sessionType="DEEP_DIVE"
      processName="Order Fulfillment"
    />
  );
}
