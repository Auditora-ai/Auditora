import { RadiografiaWizard } from "@radiografia/components/v2/RadiografiaWizard";
import { Suspense } from "react";

export const metadata = {
	title: "Radiografía Operativa | Auditora.ai",
	description:
		"Descubre riesgos ocultos en tus procesos de negocio. Análisis gratuito con IA en menos de un minuto.",
};

export default function Page() {
	return (
		<Suspense>
			<RadiografiaWizard />
		</Suspense>
	);
}
