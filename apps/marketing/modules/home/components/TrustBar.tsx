"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

const frameworks = [
	{ name: "SIPOC", standard: "Six Sigma" },
	{ name: "BPMN 2.0", standard: "OMG Standard" },
	{ name: "FMEA", standard: "ISO 17359" },
	{ name: "ISO 31000", standard: "Risk Management" },
] as const;

const fadeUp = {
	hidden: { opacity: 0, y: 16 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
	}),
};

export function TrustBar() {
	const t = useTranslations("home.trustBar");

	return (
		<section id="trust" className="py-12 px-6">
			<div className="mx-auto max-w-4xl text-center">
				<motion.div
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, margin: "-40px" }}
					className="flex flex-wrap items-center justify-center gap-3"
				>
					{frameworks.map((fw, i) => (
						<motion.div
							key={fw.name}
							variants={fadeUp}
							custom={i}
							whileHover={{ scale: 1.04, borderColor: "rgba(0,229,192,0.25)" }}
							transition={{ type: "spring", stiffness: 400, damping: 25 }}
							className="flex flex-col items-center rounded-full border border-white/10 bg-white/5 px-5 py-3 cursor-default"
						>
							<span className="text-sm font-semibold text-white/80">{fw.name}</span>
							<span className="mt-0.5 text-[11px] leading-tight text-white/40">{fw.standard}</span>
						</motion.div>
					))}
				</motion.div>
				<motion.p
					initial={{ opacity: 0 }}
					whileInView={{ opacity: 1 }}
					viewport={{ once: true }}
					transition={{ delay: 0.5, duration: 0.6 }}
					className="mt-6 text-sm text-white/40"
				>
					{t("subtitle")}
				</motion.p>
			</div>
		</section>
	);
}
