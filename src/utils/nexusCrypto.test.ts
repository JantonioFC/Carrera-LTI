import { describe, expect, it } from "vitest";
import { decryptData, encryptData } from "./nexusCrypto";

describe("nexusCrypto — AES-256-GCM", () => {
	it("cifra y descifra texto simple con la misma passphrase", async () => {
		const plaintext = "mensaje secreto";
		const passphrase = "clave-de-prueba-32";

		const encrypted = await encryptData(plaintext, passphrase);
		const decrypted = await decryptData(encrypted, passphrase);

		expect(decrypted).toBe(plaintext);
	});

	it("produce ciphertext distinto en cada llamada (IV aleatorio)", async () => {
		const plaintext = "mismo texto";
		const passphrase = "misma-clave";

		const enc1 = await encryptData(plaintext, passphrase);
		const enc2 = await encryptData(plaintext, passphrase);

		expect(enc1).not.toBe(enc2);
	});

	it("falla al descifrar con passphrase incorrecta", async () => {
		const plaintext = "datos privados";
		const encrypted = await encryptData(plaintext, "clave-correcta");

		await expect(decryptData(encrypted, "clave-incorrecta")).rejects.toThrow();
	});

	it("cifra string vacío correctamente", async () => {
		const encrypted = await encryptData("", "passphrase");
		const decrypted = await decryptData(encrypted, "passphrase");
		expect(decrypted).toBe("");
	});

	it("cifra texto con caracteres especiales y Unicode", async () => {
		const plaintext = "Notas académicas 📚 — LTI 2026: ñoño";
		const passphrase = "clave-unicode";

		const encrypted = await encryptData(plaintext, passphrase);
		const decrypted = await decryptData(encrypted, passphrase);

		expect(decrypted).toBe(plaintext);
	});

	it("el ciphertext base64 contiene salt (16B) + iv (12B) + datos", async () => {
		const encrypted = await encryptData("test", "pass");
		const packed = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));
		// Mínimo: 16 (salt) + 12 (iv) + 1 (al menos 1 byte de ciphertext + 16 de GCM tag)
		expect(packed.length).toBeGreaterThanOrEqual(45);
	});
});
