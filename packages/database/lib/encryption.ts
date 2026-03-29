import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
	const hex = process.env.ORG_KEY_ENCRYPTION_SECRET;
	if (!hex || hex.length !== 64) {
		throw new Error(
			"ORG_KEY_ENCRYPTION_SECRET must be a 64-char hex string (32 bytes)",
		);
	}
	return Buffer.from(hex, "hex");
}

export function encryptApiKey(plaintext: string): string {
	const key = getEncryptionKey();
	const iv = randomBytes(IV_LENGTH);
	const cipher = createCipheriv(ALGORITHM, key, iv);

	const encrypted = Buffer.concat([
		cipher.update(plaintext, "utf8"),
		cipher.final(),
	]);
	const authTag = cipher.getAuthTag();

	// Format: base64(iv + authTag + ciphertext)
	const combined = Buffer.concat([iv, authTag, encrypted]);
	return combined.toString("base64");
}

export function decryptApiKey(encoded: string): string {
	const key = getEncryptionKey();
	const combined = Buffer.from(encoded, "base64");

	const iv = combined.subarray(0, IV_LENGTH);
	const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
	const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

	const decipher = createDecipheriv(ALGORITHM, key, iv);
	decipher.setAuthTag(authTag);

	const decrypted = Buffer.concat([
		decipher.update(ciphertext),
		decipher.final(),
	]);
	return decrypted.toString("utf8");
}
