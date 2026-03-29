import { SessionProvider } from "@auth/components/SessionProvider";
import type { PropsWithChildren } from "react";

export default async function AuthLayout({ children }: PropsWithChildren) {
	return <SessionProvider>{children}</SessionProvider>;
}
