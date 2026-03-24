import { Link, Text } from "@react-email/components";
import React from "react";
import PrimaryButton from "../components/PrimaryButton";
import Wrapper from "../components/Wrapper";

export function ToolNurture2({
	toolName,
}: {
	toolName: string;
}) {
	return (
		<Wrapper>
			<Text style={{ fontSize: "18px", fontWeight: "bold" }}>
				How a BPM consultant saves 3+ hours per session
			</Text>

			<Text>
				Last week you used our {toolName}. Here's what a typical Prozea
				session looks like in practice:
			</Text>

			<Text style={{ backgroundColor: "#F8FAFC", padding: "16px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
				<strong>Before Prozea:</strong>{"\n"}
				1 hour meeting + 4-6 hours documenting (BPMN, RACI, process sheet, executive summary){"\n\n"}
				<strong>With Prozea:</strong>{"\n"}
				1 hour meeting + 15 minutes reviewing AI-generated deliverables
			</Text>

			<Text>
				The math: 4 sessions/month × 4 hours saved = <strong>16 hours/month</strong> you
				get back for analysis and client work instead of documentation.
			</Text>

			<PrimaryButton href="https://prozea.com">
				Start your free trial &rarr;
			</PrimaryButton>

			<Text style={{ color: "#94A3B8", fontSize: "12px", marginTop: "32px" }}>
				Prozea — AI-powered process elicitation for BPM consultants.{" "}
				<Link href="https://prozea.com" style={{ color: "#64748B" }}>
					Unsubscribe
				</Link>
			</Text>
		</Wrapper>
	);
}

ToolNurture2.PreviewProps = {
	toolName: "BPMN Generator",
};

export default ToolNurture2;
