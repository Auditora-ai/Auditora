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

import { AlertCircleIcon, ArrowRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";

const INDUSTRIES = [
	"manufacturing",
	"healthcare",
	"finance",
	"technology",
	"retail",
	"logistics",
	"construction",
	"education",
	"government",
	"food",
	"energy",
	"other",
] as const;

const COMPANY_SIZES = [
	"10-50",
	"51-200",
	"201-500",
	"501-1000",
] as const;

const EVALUATION_TARGETS = [
	"5",
	"10-30",
	"31-100",
	"100+",
] as const;

const formSchema = z.object({
	companyName: z.string().min(1),
	industry: z.string().min(1),
	companySize: z.string().min(1),
	evaluationTarget: z.string().min(1),
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
					companyName: data.companyName,
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
			<div className="mb-6 space-y-1">
				<h2 className="text-lg font-semibold">
					{t("onboarding.company.title")}
				</h2>
				<p className="text-sm text-muted-foreground">
					{t("onboarding.company.subtitle")}
				</p>
			</div>

			<Form {...form}>
				<form
					className="flex flex-col items-stretch gap-6"
					onSubmit={onSubmit}
				>
					{form.formState.errors.root && (
						<div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
							<AlertCircleIcon className="size-4 shrink-0" />
							{form.formState.errors.root.message}
						</div>
					)}

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
										{INDUSTRIES.map((value) => (
											<SelectItem
												key={value}
												value={value}
											>
												{t(`onboarding.company.industries.${value}`)}
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
										{COMPANY_SIZES.map((value) => (
											<SelectItem
												key={value}
												value={value}
											>
												{t(`onboarding.company.sizes.${value}`)}
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
										{EVALUATION_TARGETS.map((value) => (
											<SelectItem
												key={value}
												value={value}
											>
												{t(`onboarding.company.targets.${value}`)}
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
								<Input
									{...field}
									placeholder={t(
										"onboarding.company.concernProcessPlaceholder",
									)}
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
					className="mt-2 w-full sm:w-auto min-h-[48px] active:scale-95"
					size="lg"
				>
					{t("onboarding.continue")}
					<ArrowRightIcon className="ml-2 size-4" />
					</Button>
				</form>
			</Form>
		</div>
	);
}
