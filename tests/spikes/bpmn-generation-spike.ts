/**
 * Pre-flight Spike: BPMN Generation Quality
 *
 * Tests whether Claude API can produce valid BPMN node structures
 * from a process conversation transcript.
 *
 * Run: npx tsx tests/spikes/bpmn-generation-spike.ts
 *
 * Requirements: ANTHROPIC_API_KEY environment variable
 */

const SAMPLE_TRANSCRIPT = `
[00:01] Consultant: Let's walk through what happens when a customer places an order. Can you describe the process from start to finish?

[00:15] Maria (Client): Sure. So first the customer places an order through our website or by calling our sales team.

[00:28] Consultant: OK, so there are two entry points - web and phone. What happens after the order is received?

[00:35] Maria: The order goes into our system and the warehouse team gets notified. They check if we have the items in stock.

[00:48] Consultant: And what happens if the items are not in stock?

[00:52] Maria: If it's out of stock, we notify the customer and give them the option to wait or cancel. If they wait, we place a back-order with our supplier.

[01:05] Consultant: Got it. And if the items ARE in stock?

[01:08] Maria: Then the warehouse picks and packs the order. Once it's packed, shipping creates a label and schedules the pickup with our carrier.

[01:22] Consultant: Who approves the shipment?

[01:25] Maria: For orders under $500, it's automatic. Over $500 needs manager approval.

[01:35] Consultant: And after shipping?

[01:38] Maria: The customer gets a tracking number by email, and we mark the order as fulfilled in the system.
`;

const SYSTEM_PROMPT = `You are a BPMN process extraction engine. Given a conversation transcript from a process elicitation meeting, extract the business process as structured BPMN nodes.

Output ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "processName": "string",
  "nodes": [
    {
      "id": "string (unique)",
      "type": "startEvent" | "endEvent" | "task" | "exclusiveGateway" | "parallelGateway",
      "label": "string (concise action description)",
      "lane": "string (role/department responsible)",
      "connections": ["target_node_id"]
    }
  ]
}

Rules:
- Start with a startEvent and end with an endEvent
- Use exclusiveGateway for decision points (yes/no, if/else)
- Use task for activities/steps
- Keep labels concise (3-6 words)
- Include lane (swimlane) for the responsible party
- Ensure all connections form a valid directed graph
- Capture ALL process steps mentioned in the transcript`;

async function runSpike() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ERROR: Set ANTHROPIC_API_KEY environment variable");
    process.exit(1);
  }

  console.log("=== BPMN Generation Spike ===\n");
  console.log("Sending sample order fulfillment transcript to Claude API...\n");

  const startTime = Date.now();

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Extract the BPMN process from this transcript:\n\n${SAMPLE_TRANSCRIPT}`,
        },
      ],
    }),
  });

  const elapsed = Date.now() - startTime;

  if (!response.ok) {
    const error = await response.text();
    console.error(`API Error (${response.status}): ${error}`);
    process.exit(1);
  }

  const data = await response.json();
  const content = data.content[0].text;

  console.log(`Response time: ${elapsed}ms`);
  console.log(`Tokens used: input=${data.usage.input_tokens}, output=${data.usage.output_tokens}\n`);

  // Parse and validate
  let bpmn: any;
  try {
    bpmn = JSON.parse(content);
    console.log("✅ Valid JSON output\n");
  } catch (e) {
    console.error("❌ Invalid JSON output:");
    console.error(content);
    process.exit(1);
  }

  // Structural assertions
  const checks = [
    {
      name: "Has processName",
      pass: typeof bpmn.processName === "string" && bpmn.processName.length > 0,
    },
    {
      name: "Has nodes array",
      pass: Array.isArray(bpmn.nodes) && bpmn.nodes.length > 0,
    },
    {
      name: "Has startEvent",
      pass: bpmn.nodes?.some((n: any) => n.type === "startEvent"),
    },
    {
      name: "Has endEvent",
      pass: bpmn.nodes?.some((n: any) => n.type === "endEvent"),
    },
    {
      name: "Has at least one gateway (decision point)",
      pass: bpmn.nodes?.some((n: any) => n.type === "exclusiveGateway"),
    },
    {
      name: "Has 5+ task nodes",
      pass: bpmn.nodes?.filter((n: any) => n.type === "task").length >= 5,
    },
    {
      name: "All nodes have id, type, label",
      pass: bpmn.nodes?.every(
        (n: any) => n.id && n.type && n.label
      ),
    },
    {
      name: "All nodes have connections array",
      pass: bpmn.nodes?.every((n: any) => Array.isArray(n.connections)),
    },
    {
      name: "Has swimlane assignments",
      pass: bpmn.nodes?.some((n: any) => n.lane && n.lane.length > 0),
    },
    {
      name: "Captures stock check decision",
      pass: bpmn.nodes?.some(
        (n: any) =>
          n.type === "exclusiveGateway" &&
          n.label.toLowerCase().includes("stock")
      ),
    },
    {
      name: "Captures approval decision ($500 threshold)",
      pass: bpmn.nodes?.some(
        (n: any) =>
          (n.type === "exclusiveGateway" || n.type === "task") &&
          (n.label.toLowerCase().includes("approv") ||
            n.label.toLowerCase().includes("500"))
      ),
    },
  ];

  console.log("Structural Assertions:");
  let passed = 0;
  let failed = 0;
  for (const check of checks) {
    const icon = check.pass ? "✅" : "❌";
    console.log(`  ${icon} ${check.name}`);
    if (check.pass) passed++;
    else failed++;
  }

  console.log(`\nResult: ${passed}/${checks.length} passed`);

  // Print the BPMN structure
  console.log("\n--- Generated BPMN Structure ---");
  console.log(`Process: ${bpmn.processName}`);
  console.log(`Nodes: ${bpmn.nodes.length}`);
  for (const node of bpmn.nodes) {
    const lane = node.lane ? ` [${node.lane}]` : "";
    const conns = node.connections.length > 0 ? ` → ${node.connections.join(", ")}` : "";
    console.log(`  ${node.type.padEnd(18)} | ${node.label}${lane}${conns}`);
  }

  // Score
  const score = Math.round((passed / checks.length) * 10);
  console.log(`\n=== SPIKE RESULT: ${score}/10 ===`);
  if (score >= 7) {
    console.log("✅ BPMN generation quality is sufficient for MVP");
  } else {
    console.log("⚠️  BPMN generation needs prompt refinement before Phase 1");
  }

  // Cost estimate
  const costPerMeeting =
    (data.usage.input_tokens * 0.003 + data.usage.output_tokens * 0.015) /
    1000;
  // Assume ~6 extraction calls per meeting (every 10 min in a 1hr meeting)
  const estimatedCostPerMeeting = costPerMeeting * 6;
  console.log(
    `\nEstimated LLM cost per meeting (extraction only): $${estimatedCostPerMeeting.toFixed(4)}`
  );
}

runSpike().catch(console.error);
