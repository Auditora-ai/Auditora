export interface RiskItem {
	title: string;
	description: string;
	riskType: string;
	severity: number;
	probability: number;
	affectedStep?: string;
	affectedRole?: string;
	suggestedMitigations: string[];
	suggestedControls: Array<{
		name: string;
		controlType: string;
		automated: boolean;
	}>;
	isOpportunity: boolean;
	opportunityValue?: string;
	source: string;
	relatedItemId: string | null;
	failureMode?: string;
	failureEffect?: string;
	detectionDifficulty?: number;
	rpn?: number;
}

export interface RiskSummary {
	totalRiskScore: number;
	criticalCount: number;
	highCount: number;
	topRiskArea: string;
}

export interface RiskData {
	newRisks: RiskItem[];
	updatedRisks: unknown[];
	riskSummary: RiskSummary;
}
