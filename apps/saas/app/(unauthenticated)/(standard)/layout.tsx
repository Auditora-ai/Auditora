import { AuthWrapper } from "@shared/components/AuthWrapper";
import type { PropsWithChildren } from "react";

export default function StandardAuthLayout({ children }: PropsWithChildren) {
	return <AuthWrapper>{children}</AuthWrapper>;
}
