import { Resend } from "resend";
import { config } from "../config";
import type { SendEmailHandler } from "../types";

function createResendClient() {
	const key = process.env.RESEND_API_KEY;
	if (!key) {
		return null;
	}
	return new Resend(key);
}

export const send: SendEmailHandler = async ({
	to,
	from,
	subject,
	cc,
	bcc,
	replyTo,
	html,
	text,
}) => {
	const resend = createResendClient();
	if (!resend) {
		console.warn("RESEND_API_KEY is not set. Email sending is disabled.");
		return;
	}
	await resend.emails.send({
		from: from ?? config.mailFrom,
		to: [to],
		cc,
		bcc,
		replyTo,
		subject,
		html,
		text,
	});
};
