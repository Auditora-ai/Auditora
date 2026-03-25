import { describe, it, expect } from "vitest";
import { NodePropertiesSchema } from "../node-properties-schema";

describe("NodePropertiesSchema", () => {
	it("accepts a valid full properties object", () => {
		const input = {
			description: "Validate purchase order against supplier data",
			responsable: "Compras",
			slaValue: 4,
			slaUnit: "hours" as const,
			frequency: "per_event" as const,
			frequencyCount: null,
			systems: ["SAP", "CRM"],
			inputs: ["Orden de compra"],
			outputs: ["Factura validada"],
			costPerExecution: 150,
			costCurrency: "USD",
			estimatedDuration: 30,
		};

		const result = NodePropertiesSchema.safeParse(input);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.description).toBe(input.description);
			expect(result.data.systems).toEqual(["SAP", "CRM"]);
		}
	});

	it("accepts an empty object (all fields optional)", () => {
		const result = NodePropertiesSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it("accepts partial properties", () => {
		const result = NodePropertiesSchema.safeParse({
			description: "Step 1: open SAP",
			responsable: "Analyst",
		});
		expect(result.success).toBe(true);
	});

	it("rejects invalid slaUnit", () => {
		const result = NodePropertiesSchema.safeParse({
			slaUnit: "years",
		});
		expect(result.success).toBe(false);
	});

	it("rejects invalid frequency", () => {
		const result = NodePropertiesSchema.safeParse({
			frequency: "annually",
		});
		expect(result.success).toBe(false);
	});

	it("accepts null for nullable number fields", () => {
		const result = NodePropertiesSchema.safeParse({
			slaValue: null,
			frequencyCount: null,
			costPerExecution: null,
			estimatedDuration: null,
		});
		expect(result.success).toBe(true);
	});

	it("rejects non-string items in systems array", () => {
		const result = NodePropertiesSchema.safeParse({
			systems: [123, "SAP"],
		});
		expect(result.success).toBe(false);
	});

	it("rejects non-number slaValue", () => {
		const result = NodePropertiesSchema.safeParse({
			slaValue: "four hours",
		});
		expect(result.success).toBe(false);
	});
});
