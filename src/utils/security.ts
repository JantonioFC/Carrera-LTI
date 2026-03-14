/**
 * Simple obfuscation utility to prevent plain-text exposure of secrets in local storage.
 * Note: This is not "military-grade" encryption, but it prevents easy inspection
 * and automated scraping of keys from IndexedDB.
 */

const KEY = 0x55; // Simple XOR key

const PREFIX = "obv1:";

export function obfuscate(str: string): string {
	if (!str) return "";
	const obfuscated = btoa(
		str
			.split("")
			.map((char) => String.fromCharCode(char.charCodeAt(0) ^ KEY))
			.join(""),
	);
	return `${PREFIX}${obfuscated}`;
}

export function deobfuscate(str: string): string {
	if (!str || !str.startsWith(PREFIX)) return str;
	try {
		const raw = str.slice(PREFIX.length);
		const decoded = atob(raw);
		return decoded
			.split("")
			.map((char) => String.fromCharCode(char.charCodeAt(0) ^ KEY))
			.join("");
	} catch {
		return str; // Fallback to raw if not valid base64
	}
}
