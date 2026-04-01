'use client';

import {
	Banknote,
	Building2,
	Cpu,
	Factory,
	HeartPulse,
	Plane,
	ShieldCheck,
	ShoppingCart,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { LucideIcon } from 'lucide-react';

interface Category {
	icon: LucideIcon;
	labelKey: string;
}

const CATEGORIES: Category[] = [
	{ icon: Building2, labelKey: 'consulting' },
	{ icon: Banknote, labelKey: 'finance' },
	{ icon: Factory, labelKey: 'manufacturing' },
	{ icon: HeartPulse, labelKey: 'healthcare' },
	{ icon: ShieldCheck, labelKey: 'audit' },
	{ icon: Cpu, labelKey: 'technology' },
	{ icon: ShoppingCart, labelKey: 'retail' },
	{ icon: Plane, labelKey: 'logistics' },
];

export function LogoBar() {
	const t = useTranslations('home');

	const pills = CATEGORIES.map(({ icon: Icon, labelKey }) => (
		<span
			key={labelKey}
			className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white"
		>
			<Icon className="size-4 text-[#00E5C0]" />
			{t(`logos.categories.${labelKey}`)}
		</span>
	));

	return (
		<section className="relative overflow-hidden bg-[#0A1428] py-10">
			{/* Fade edges */}
			<div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#0A1428] to-transparent" />
			<div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#0A1428] to-transparent" />

			{/* Title */}
			<p className="mb-6 text-center text-xs font-medium uppercase tracking-widest text-[#00E5C0]">
				{t('logos.title')}
			</p>

			{/* Scrolling ticker */}
			<div className="relative">
				<div className="logo-ticker flex gap-4">
					{pills}
					{pills}
					{pills}
					{pills}
				</div>
			</div>

			<style jsx>{`
				@keyframes ticker {
					0% {
						transform: translateX(0);
					}
					100% {
						transform: translateX(-25%);
					}
				}
				.logo-ticker {
					animation: ticker 30s linear infinite;
					width: max-content;
				}
				.logo-ticker:hover {
					animation-play-state: paused;
				}
			`}</style>
		</section>
	);
}
