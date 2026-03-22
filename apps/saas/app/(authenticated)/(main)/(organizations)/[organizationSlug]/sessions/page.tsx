import { getActiveOrganization } from "@auth/lib/server";
import { PageHeader } from "@shared/components/PageHeader";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Sessions — Prozea",
};

export default async function SessionsPage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;

  const activeOrganization = await getActiveOrganization(
    organizationSlug as string,
  );

  if (!activeOrganization) {
    return notFound();
  }

  // TODO: Fetch sessions from DB
  const sessions: any[] = [];

  return (
    <div>
      <PageHeader
        title="Sessions"
        subtitle="Your process elicitation meetings"
      />

      <div className="mt-6">
        {sessions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 p-12 text-center">
            <h3 className="font-serif text-xl text-slate-700">
              Complete your first session to see results here
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Create a new session to start mapping business processes during your next call.
            </p>
            <a
              href={`/${organizationSlug}/session/new`}
              className="mt-4 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              New Session
            </a>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-500">Client</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Process</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Type</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Nodes</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Date</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {/* Session rows will be rendered here */}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
