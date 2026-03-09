/**
 * Nexus Encryption Module - AES-256-GCM using Web Crypto API
 * Provides local-first encryption for vault data.
 */

// Derive a CryptoKey from a user-supplied passphrase
async function deriveKey(
	passphrase: string,
	salt: Uint8Array,
): Promise<CryptoKey> {
	const enc = new TextEncoder();
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		enc.encode(passphrase),
		"PBKDF2",
		false,
		["deriveKey"],
	);

	return crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			salt: salt as BufferSource,
			iterations: 100_000,
			hash: "SHA-256",
		},
		keyMaterial,
		{ name: "AES-GCM", length: 256 },
		false,
		["encrypt", "decrypt"],
	);
}

export async function encryptData(
	plaintext: string,
	passphrase: string,
): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const key = await deriveKey(passphrase, salt);

	const enc = new TextEncoder();
	const cipherBuffer = await crypto.subtle.encrypt(
		{ name: "AES-GCM", iv },
		key,
		enc.encode(plaintext),
	);

	// Pack salt + iv + ciphertext into a single base64 string
	const packed = new Uint8Array(
		salt.length + iv.length + new Uint8Array(cipherBuffer).length,
	);
	packed.set(salt, 0);
	packed.set(iv, salt.length);
	packed.set(new Uint8Array(cipherBuffer), salt.length + iv.length);

	return btoa(String.fromCharCode(...packed));
}

export async function decryptData(
	packedBase64: string,
	passphrase: string,
): Promise<string> {
	const packed = Uint8Array.from(atob(packedBase64), (c) => c.charCodeAt(0));

	const salt = packed.slice(0, 16);
	const iv = packed.slice(16, 28);
	const ciphertext = packed.slice(28);

	const key = await deriveKey(passphrase, salt);

	const decryptedBuffer = await crypto.subtle.decrypt(
		{ name: "AES-GCM", iv },
		key,
		ciphertext,
	);

	return new TextDecoder().decode(decryptedBuffer);
}
