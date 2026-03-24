import { Link, Text } from "@react-email/components";
import React from "react";
import PrimaryButton from "../components/PrimaryButton";
import Wrapper from "../components/Wrapper";

export function ToolNurture1({
	toolName,
}: {
	toolName: string;
}) {
	return (
		<Wrapper>
			<Text style={{ fontSize: "18px", fontWeight: "bold" }}>
				Now imagine this DURING your meeting
			</Text>

			<Text>
				A few days ago you used our free {toolName}. You typed a process
				description and got results in seconds.
			</Text>

			<Text>
				<strong>What if that happened automatically during your stakeholder
				interview?</strong>
			</Text>

			<Text>
				With Prozea, an AI bot joins your Zoom/Teams/Meet call and:
			</Text>

			<Text>
				1. Guides your questions with a BPM teleprompter (SIPOC + gap analysis){"\n"}
				2. Transcribes the conversation in real-time{"\n"}
				3. Extracts process steps, roles, and decisions automatically{"\n"}
				4. Builds the BPMN diagram live while you talk{"\n"}
				5. Generates a complete deliverable package when you're done
			</Text>

			<Text>
				<strong>Result:</strong> 1 hour meeting → complete BPMN + RACI + process
				sheet + executive summary. No post-session work.
			</Text>

			<PrimaryButton href="https://prozea.com">
				Try Prozea free &rarr;
			</PrimaryButton>

			<Text style={{ color: "#64748B", fontSize: "14px", marginTop: "24px" }}>
				You're receiving this because you used a free tool on Prozea.{" "}
				<Link href="https://prozea.com" style={{ color: "#2563EB" }}>
					Unsubscribe
				</Link>
			</Text>
		</Wrapper>
	);
}

ToolNurture1.PreviewProps = {
	toolName: "BPMN Generator",
};

export default ToolNurture1;
