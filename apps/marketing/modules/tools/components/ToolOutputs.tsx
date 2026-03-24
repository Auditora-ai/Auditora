"use client";

/**
 * Output renderers for each tool type.
 * Dark chrome styling (consultant view).
 */

// ── BPMN Output ──────────────────────────────────────────────
import { BpmnViewerPanel } from "@home/components/BpmnViewerPanel";

export function BpmnOutput({ data }: { data: Record<string, unknown> }) {
  const processes = (data.processes || []) as Array<{
    name: string;
    description: string;
    category: string;
  }>;
  const bpmnXml = (data.bpmnXml as string) || null;

  return (
    <div className="space-y-3">
      {/* Interactive BPMN diagram */}
      {bpmnXml && (
        <div className="h-[250px] rounded-lg overflow-hidden">
          <BpmnViewerPanel bpmnXml={bpmnXml} />
        </div>
      )}

      <h3 className="text-sm font-medium text-[#F1F5F9]">
        Extracted Process Steps
      </h3>
      {processes.length === 0 && (
        <p className="text-sm text-[#64748B]">No processes extracted.</p>
      )}
      {processes.map((p, i) => (
        <div
          key={i}
          className="rounded-lg border border-[#334155] bg-[#0F172A] p-3"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
              {i + 1}
            </span>
            <span className="font-medium text-[#F1F5F9]">{p.name}</span>
          </div>
          {p.description && (
            <p className="mt-1 pl-8 text-xs text-[#94A3B8]">
              {p.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── SIPOC Output ──────────────────────────────────────────────
export function SipocOutput({ data }: { data: Record<string, unknown> }) {
  const columns = [
    {
      key: "suppliers",
      label: "Suppliers",
      color: "text-blue-400",
      items: data.suppliers as Array<{ name: string; description?: string }> || [],
    },
    {
      key: "inputs",
      label: "Inputs",
      color: "text-green-400",
      items: data.inputs as Array<{ name: string; description?: string }> || [],
    },
    {
      key: "processSteps",
      label: "Process",
      color: "text-yellow-400",
      items: (data.processSteps as Array<{ name: string }> || []).map((s) => ({
        name: s.name,
      })),
    },
    {
      key: "outputs",
      label: "Outputs",
      color: "text-orange-400",
      items: data.outputs as Array<{ name: string; description?: string }> || [],
    },
    {
      key: "customers",
      label: "Customers",
      color: "text-purple-400",
      items: data.customers as Array<{ name: string; description?: string }> || [],
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-[#F1F5F9]">
        SIPOC: {(data.processName as string) || ""}
      </h3>
      <div className="grid grid-cols-5 gap-1">
        {columns.map((col) => (
          <div key={col.key}>
            <div
              className={`mb-2 text-center text-xs font-bold uppercase ${col.color}`}
            >
              {col.label}
            </div>
            <div className="space-y-1">
              {col.items.map((item, i) => (
                <div
                  key={i}
                  className="rounded border border-[#334155] bg-[#0F172A] p-1.5 text-xs text-[#F1F5F9]"
                >
                  {item.name}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── RACI Output ──────────────────────────────────────────────
export function RaciOutput({ data }: { data: Record<string, unknown> }) {
  const assignments = (data.assignments || []) as Array<{
    activityName: string;
    role: string;
    assignment: string;
  }>;

  // Build matrix
  const activities = [...new Set(assignments.map((a) => a.activityName))];
  const roles = [...new Set(assignments.map((a) => a.role))];

  const getAssignment = (activity: string, role: string) => {
    const a = assignments.find(
      (x) => x.activityName === activity && x.role === role,
    );
    return a?.assignment || "";
  };

  const assignmentColor: Record<string, string> = {
    R: "bg-blue-600 text-white",
    A: "bg-red-600 text-white",
    C: "bg-yellow-600 text-white",
    I: "bg-green-600 text-white",
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-[#F1F5F9]">RACI Matrix</h3>
      <div className="overflow-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="border border-[#334155] bg-[#0F172A] p-2 text-left text-[#94A3B8]">
                Activity
              </th>
              {roles.map((role) => (
                <th
                  key={role}
                  className="border border-[#334155] bg-[#0F172A] p-2 text-center text-[#94A3B8]"
                >
                  {role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activities.map((activity) => (
              <tr key={activity}>
                <td className="border border-[#334155] p-2 text-[#F1F5F9]">
                  {activity}
                </td>
                {roles.map((role) => {
                  const val = getAssignment(activity, role);
                  return (
                    <td
                      key={role}
                      className="border border-[#334155] p-2 text-center"
                    >
                      {val && (
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs font-bold ${assignmentColor[val] || "bg-[#334155] text-[#94A3B8]"}`}
                        >
                          {val}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-4 text-xs text-[#94A3B8]">
        <span>
          <span className="mr-1 inline-block h-3 w-3 rounded bg-blue-600" /> R
          = Responsible
        </span>
        <span>
          <span className="mr-1 inline-block h-3 w-3 rounded bg-red-600" /> A =
          Accountable
        </span>
        <span>
          <span className="mr-1 inline-block h-3 w-3 rounded bg-yellow-600" />{" "}
          C = Consulted
        </span>
        <span>
          <span className="mr-1 inline-block h-3 w-3 rounded bg-green-600" /> I
          = Informed
        </span>
      </div>
    </div>
  );
}

// ── Complexity Output ────────────────────────────────────────
export function ComplexityOutput({
  data,
}: {
  data: Record<string, unknown>;
}) {
  const score = (data.score as number) || 0;
  const breakdown = (data.breakdown as Record<string, number>) || {};
  const explanation = (data.explanation as string) || "";
  const recommendation = (data.recommendation as string) || "";

  const scoreColor =
    score <= 3
      ? "text-green-400"
      : score <= 6
        ? "text-yellow-400"
        : score <= 8
          ? "text-orange-400"
          : "text-red-400";

  const dimensions = [
    { key: "roles", label: "Roles", icon: "👥" },
    { key: "decisions", label: "Decisions", icon: "🔀" },
    { key: "exceptions", label: "Exceptions", icon: "⚠️" },
    { key: "integrations", label: "Integrations", icon: "🔗" },
    { key: "steps", label: "Steps", icon: "📋" },
  ];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className={`text-6xl font-bold ${scoreColor}`}>{score}</div>
        <div className="text-sm text-[#94A3B8]">/ 10 complexity</div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {dimensions.map((d) => (
          <div
            key={d.key}
            className="rounded border border-[#334155] bg-[#0F172A] p-2 text-center"
          >
            <div className="text-lg">{d.icon}</div>
            <div className="text-lg font-bold text-[#F1F5F9]">
              {breakdown[d.key] || 0}
            </div>
            <div className="text-xs text-[#64748B]">{d.label}</div>
          </div>
        ))}
      </div>

      {explanation && (
        <div className="rounded border border-[#334155] bg-[#0F172A] p-3">
          <p className="text-sm text-[#F1F5F9]">{explanation}</p>
        </div>
      )}

      {recommendation && (
        <div className="rounded border border-blue-800 bg-blue-950 p-3">
          <p className="text-xs font-medium text-blue-400">Recommendation</p>
          <p className="mt-1 text-sm text-[#F1F5F9]">{recommendation}</p>
        </div>
      )}
    </div>
  );
}

// ── Audit Output ─────────────────────────────────────────────
export function AuditOutput({ data }: { data: Record<string, unknown> }) {
  const complexity = data.complexity as Record<string, unknown> | undefined;
  const processCount = (data.processCount as number) || 0;

  if (!complexity) {
    return <p className="text-sm text-[#64748B]">No audit data.</p>;
  }

  return (
    <div className="space-y-4">
      <ComplexityOutput data={complexity} />
      <div className="rounded border border-[#334155] bg-[#0F172A] p-3">
        <p className="text-xs font-medium text-[#94A3B8]">
          Processes identified
        </p>
        <p className="text-2xl font-bold text-[#F1F5F9]">{processCount}</p>
      </div>
    </div>
  );
}

// ── Narrative Output ─────────────────────────────────────────
export function NarrativeOutput({
  data,
}: {
  data: Record<string, unknown>;
}) {
  const processName = (data.processName as string) || "";
  const narrative = (data.narrative as string) || "";
  const actors = (data.actors as string[]) || [];
  const keyDecisions = (data.keyDecisions as Array<{
    question: string;
    outcomes: string[];
  }>) || [];
  const summary = (data.summary as string) || "";

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[#F1F5F9]">{processName}</h3>

      {summary && (
        <div className="rounded border border-blue-800 bg-blue-950 p-3">
          <p className="text-xs font-medium text-blue-400">Summary</p>
          <p className="mt-1 text-sm text-[#F1F5F9]">{summary}</p>
        </div>
      )}

      <div className="prose prose-invert prose-sm max-w-none">
        {narrative.split("\n").map((p, i) => (
          <p key={i} className="text-sm leading-relaxed text-[#F1F5F9]">
            {p}
          </p>
        ))}
      </div>

      {actors.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-[#94A3B8]">
            Actors / Roles
          </p>
          <div className="flex flex-wrap gap-2">
            {actors.map((actor) => (
              <span
                key={actor}
                className="rounded-full bg-[#334155] px-3 py-1 text-xs text-[#F1F5F9]"
              >
                {actor}
              </span>
            ))}
          </div>
        </div>
      )}

      {keyDecisions.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-[#94A3B8]">
            Key Decisions
          </p>
          <div className="space-y-2">
            {keyDecisions.map((d, i) => (
              <div
                key={i}
                className="rounded border border-[#334155] bg-[#0F172A] p-3"
              >
                <p className="text-sm font-medium text-[#F1F5F9]">
                  {d.question}
                </p>
                <ul className="mt-1 space-y-1">
                  {d.outcomes.map((o, j) => (
                    <li key={j} className="text-xs text-[#94A3B8]">
                      → {o}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
