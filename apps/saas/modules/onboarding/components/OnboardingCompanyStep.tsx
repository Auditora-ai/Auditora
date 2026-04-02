"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { ArrowRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";

const INDUSTRIES = [
	{ value: "manufacturing", label: "Manufacturing" },
	{ value: "healthcare", label: "Healthcare" },
	{ value: "finance", label: "Finance & Banking" },
	{ value: "technology", label: "Technology" },
	{ value: "retail", label: "Retail & E-commerce" },
	{ value: "logistics", label: "Logistics & Supply Chain" },
	{ value: "construction", label: "Construction" },
	{ value: "education", label: "Education" },
	{ value: "government", label: "Government" },
	{ value: "food", label: "Food & Beverage" },
	{ value: "energy", label: "Energy & Utilities" },
	{ value: "other", label: "Other" },
] as const;

const COMPANY_SIZES = [
	{ value: "10-50", label: "10-50 employees" },
	{ value: "51-200", label: "51-200 employees" },
	{ value: "201-500", label: "201-500 employees" },
	{ value: "501-1000", label: "501-1000 employees" },
] as const;

const EVALUATION_TARGETS = [
	{ value: "5", label: "5 people" },
	{ value: "10-30", label: "10-30 people" },
	{ value: "31-100", label: "31-100 people" },
	{ value: "100+", label: "100+ people" },
] as const;

const formSchema = z.object({
	companyName: z.string().min(1, "Company name is required"),
	industry: z.string().min(1, "Industry is required"),
	companySize: z.string().min(1, "Company size is required"),
	evaluationTarget: z.string().min(1, "Evaluation target is required"),
	concernProcess: z.string().optional(),
});

interface OnboardingCompanyStepProps {
	onCompleted: () => void;
}

export function OnboardingCompanyStep({
	onCompleted,
}: OnboardingCompanyStepProps) {
	const t = useTranslations();

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			companyName: "",
			industry: "",
			companySize: "",
			evaluationTarget: "",
			concernProcess: "",
		},
	});

	const onSubmit = form.handleSubmit(async (data) => {
		form.clearErrors("root");

		try {
			const res = await fetch("/api/organization/profile", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					industry: data.industry,
					employeeCount: data.companySize,
					operationsProfile: data.evaluationTarget,
					notes: data.concernProcess || null,
				}),
			});

			if (!res.ok) {
				throw new Error("Failed to update organization profile");
			}

			onCompleted();
		} catch {
			form.setError("root", {
				type: "server",
				message: t("onboarding.notifications.companySetupFailed"),
			});
		}
	});

	return (
		<div>
			<Form {...form}>
				<form
					className="flex flex-col items-stretch gap-6"
					onSubmit={onSubmit}
				>
					<FormMessage className="text-center" />

					<FormField
						control={form.control}
						name="companyName"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("onboarding.company.companyName")}
								</FormLabel>
								<FormControl>
									<Input
										{...field}
										placeholder={t(
											"onboarding.company.companyNamePlaceholder",
										)}
										autoFocus
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="industry"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("onboarding.company.industry")}
								</FormLabel>
								<Select
									value={field.value}
									onValueChange={field.onChange}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue
												placeholder={t(
													"onboarding.company.industryPlaceholder",
												)}
											/>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{INDUSTRIES.map((ind) => (
											<SelectItem
												key={ind.value}
												value={ind.value}
											>
												{ind.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="companySize"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("onboarding.company.companySize")}
								</FormLabel>
								<Select
									value={field.value}
									onValueChange={field.onChange}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue
												placeholder={t(
													"onboarding.company.companySizePlaceholder",
												)}
											/>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{COMPANY_SIZES.map((size) => (
											<SelectItem
												key={size.value}
												value={size.value}
											>
												{size.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="evaluationTarget"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("onboarding.company.evaluationTarget")}
								</FormLabel>
								<Select
									value={field.value}
									onValueChange={field.onChange}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue
												placeholder={t(
													"onboarding.company.evaluationTargetPlaceholder",
												)}
											/>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{EVALUATION_TARGETS.map((target) => (
											<SelectItem
												key={target.value}
												value={target.value}
											>
												{target.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="concernProcess"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("onboarding.company.concernProcess")}
								</FormLabel>
								<FormControl>
									<Textarea
										{...field}
										placeholder={t(
											"onboarding.company.concernProcessPlaceholder",
										)}
										rows={3}
									/>
								</FormControl>
								<p className="text-xs text-muted-foreground">
									{t("onboarding.company.concernProcessOptional")}
								</p>
								<FormMessage />
							</FormItem>
						)}
					/>

					<Button
						type="submit"
						loading={form.formState.isSubmitting}
						className="mt-2"
					>
						{t("onboarding.continue")}
						<ArrowRightIcon className="ml-2 size-4" />
					</Button>
				</form>
			</Form>
		</div>
	);
}
