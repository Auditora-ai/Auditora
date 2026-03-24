import { Link, Text } from "@react-email/components";
import React from "react";
import PrimaryButton from "../components/PrimaryButton";
import Wrapper from "../components/Wrapper";

export function ToolResult({
	toolName,
	resultUrl,
}: {
	toolName: string;
	resultUrl: string;
}) {
	return (
		<Wrapper>
			<Text style={{ fontSize: "18px", fontWeight: "bold" }}>
				Your {toolName} result is ready
			</Text>

			<Text>
				Thanks for using Prozea's free {toolName}. Your result has been generated
				and is ready to download.
			</Text>

			<PrimaryButton href={resultUrl}>
				View your result &rarr;
			</PrimaryButton>

			<Text style={{ color: "#64748B", fontSize: "14px", marginTop: "24px" }}>
				<strong>Did you know?</strong> Prozea can generate BPMN diagrams, SIPOC,
				RACI matrices, and process audits <em>live during your meetings</em>.
				The AI joins your video call and does everything automatically.
			</Text>

			<Link href="https://prozea.com" style={{ color: "#2563EB", fontSize: "14px" }}>
				Learn more about Prozea →
			</Link>
		</Wrapper>
	);
}

ToolResult.PreviewProps = {
	toolName: "BPMN Generator",
	resultUrl: "https://prozea.com/tools/bpmn-generator",
};

export default ToolResult;
