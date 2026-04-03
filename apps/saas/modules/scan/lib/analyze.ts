/**
 * Business Analysis via LLM
 *
 * Single call to an LLM that takes crawled website text and returns
 * a structured operational risk analysis (ScanAnalysis).
 *
 * Provider priority: GLM (Z.AI) → Anthropic Claude → error
 */

import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { getGlmModel } from "@repo/ai/src/utils/model-router";
import type { LanguageModel } from "ai";
import type { ScanAnalysis } from "./types";

/** Resolve the best available model for scan analysis */
function getScanModel(): LanguageModel {
	// Prefer GLM if key is available
	if (process.env.GLM_API_KEY) {
		return getGlmModel();
	}
	// Fallback to Anthropic
	return anthropic("claude-sonnet-4-20250514");
}

const SYSTEM_PROMPT = `You are an operational risk analyst. Based on this company's public website content, identify their industry, critical business processes, and operational vulnerabilities.

Analyze the provided website text and return a JSON object with this exact structure:

{
  "companyName": "The company's name",
  "industry": "Primary industry/sector (e.g. 'Financial Services', 'Healthcare', 'Manufacturing', 'Technology', 'Retail', 'Logistics')",
  "processes": [
    {
      "name": "Process name",
      "description": "Brief description of the business process",
      "riskLevel": "low|medium|high|critical"
    }
  ],
  "highestRiskProcess": {
    "name": "Name of the highest-risk process",
    "risks": [
      {
        "title": "Specific risk title",
        "severity": 1-10,
        "description": "Description of the risk and its potential impact"
      }
    ]
  },
  "vulnerabilityScore": 0-100,
  "summary": "One paragraph executive summary of the company's operational risk posture"
}

RULES:
- Identify 4-8 critical business processes based on what the website reveals about their operations.
- For the highest-risk process, identify 3-5 specific operational risks.
- The vulnerabilityScore should reflect overall operational exposure (0=minimal, 100=severe).
- Base your analysis ONLY on what is evident from the website content. Do not fabricate details.
- If the company name is unclear, infer it from the domain or content.
- Risk levels should be realistic and justified by the content.
- The summary should be actionable and specific to this company.
- Respond ONLY with the JSON object, no markdown fences, no commentary.`;

export async function analyzeBusiness(
	text: string,
	url: string,
): Promise<ScanAnalysis> {
	const userPrompt = `Website URL: ${url}

Website content:
${text}

Analyze this company's operational risk profile and return the JSON analysis.`;

	const { text: responseText } = await generateText({
		model: getScanModel(),
		system: SYSTEM_PROMPT,
		prompt: userPrompt,
		temperature: 0.3,
		maxOutputTokens: 4096,
	});

	// Parse the JSON response — handle potential markdown fences
	let jsonStr = responseText.trim();
	if (jsonStr.startsWith("```")) {
		jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
	}

	const analysis: ScanAnalysis = JSON.parse(jsonStr);

	// Clamp vulnerability score to valid range
	analysis.vulnerabilityScore = Math.max(
		0,
		Math.min(100, Math.round(analysis.vulnerabilityScore)),
	);

	// Ensure risk levels are valid
	const validLevels = new Set(["low", "medium", "high", "critical"]);
	for (const process of analysis.processes) {
		if (!validLevels.has(process.riskLevel)) {
			process.riskLevel = "medium";
		}
	}

	// Clamp severity scores
	if (analysis.highestRiskProcess?.risks) {
		for (const risk of analysis.highestRiskProcess.risks) {
			risk.severity = Math.max(1, Math.min(10, Math.round(risk.severity)));
		}
	}

	return analysis;
}
