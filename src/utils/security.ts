/**
 * Encryption utility using Web Crypto API (AES-256-GCM).
 * Replaces the previous XOR obfuscation (Issue #62).
 *
 * Key derivation: PBKDF2 with a per-install seed stored in IDB.
 * Backward compatible: data with prefix "obv1:" is decoded with legacy XOR.
 */

import { logger } from "./logger";

const PREFIX_V2 = "wcv1:";
const PREFIX_V1 = "obv1:";
const LEGACY_XOR_KEY = 0x55;

/** Lazy-initialized AES-GCM key */
let _cryptoKey: CryptoKey | null = null;

async function getCryptoKey(): Promise<CryptoKey> {
	if (_cryptoKey) return _cryptoKey;

	// Per-install seed: stored as plain text in IDB under a reserved key.
	// If not present, generate and persist one. The seed isn't itself a secret —
	// it's used via PBKDF2 so the derived key can't be reconstructed without it.
	const SEED_KEY = "__carrera_lti_seed__";
	let seed = localStorage.getItem(SEED_KEY);
	if (!seed) {
		const buf = new Uint8Array(32);
		crypto.getRandomValues(buf);
		seed = Array.from(buf)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		localStorage.setItem(SEED_KEY, seed);
	}

	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(seed),
		"PBKDF2",
		false,
		["deriveKey"],
	);

	_cryptoKey = await crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			salt: new TextEncoder().encode("carrera-lti-idb-v1"),
			iterations: 100_000,
			hash: "SHA-256",
		},
		keyMaterial,
		{ name: "AES-GCM", length: 256 },
		false,
		["encrypt", "decrypt"],
	);

	return _cryptoKey;
}

/** Encrypt a string with AES-256-GCM. Returns a prefixed base64 string. */
export async function obfuscate(str: string): Promise<string> {
	if (!str) return "";
	const key = await getCryptoKey();
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const encoded = new TextEncoder().encode(str);
	const encrypted = await crypto.subtle.encrypt(
		{ name: "AES-GCM", iv },
		key,
		encoded,
	);
	const combined = new Uint8Array(iv.byteLength + encrypted.byteLength);
	combined.set(iv);
	combined.set(new Uint8Array(encrypted), iv.byteLength);
	return PREFIX_V2 + btoa(String.fromCharCode(...combined));
}

/** Decrypt a string. Handles both v2 (AES-GCM) and v1 (legacy XOR) formats.
 *  Returns null if decryption fails (auth tag mismatch, corrupted data).
 *  SC-01 (#255): never return raw ciphertext — caller must handle null. */
export async function deobfuscate(str: string): Promise<string | null> {
	if (!str) return str;

	// Legacy XOR format — backward compat for existing IDB data
	if (str.startsWith(PREFIX_V1)) {
		return _legacyDeobfuscate(str);
	}

	if (!str.startsWith(PREFIX_V2)) return str;

	try {
		const key = await getCryptoKey();
		const combined = Uint8Array.from(atob(str.slice(PREFIX_V2.length)), (c) =>
			c.charCodeAt(0),
		);
		const iv = combined.slice(0, 12);
		const encrypted = combined.slice(12);
		const decrypted = await crypto.subtle.decrypt(
			{ name: "AES-GCM", iv },
			key,
			encrypted,
		);
		return new TextDecoder().decode(decrypted);
	} catch (e) {
		// AES-GCM auth tag mismatch or corrupted data — do NOT return raw ciphertext
		logger.error("security", "AES-GCM decryption failed — data may be corrupted", e);
		return null;
	}
}

function _legacyDeobfuscate(str: string): string {
	try {
		const raw = str.slice(PREFIX_V1.length);
		const decoded = atob(raw);
		return decoded
			.split("")
			.map((char) => String.fromCharCode(char.charCodeAt(0) ^ LEGACY_XOR_KEY))
			.join("");
	} catch {
		return str;
	}
}
