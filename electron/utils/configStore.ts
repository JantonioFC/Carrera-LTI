// AR-09 (#218): módulo Node.js-only movido a electron/ — usa node:crypto
// (scrypt, AES-256-GCM) incompatible con sandbox:true del Renderer.
// NUNCA importar desde src/.
import {
	createCipheriv,
	createDecipheriv,
	randomBytes,
	scryptSync,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // GCM estándar
const AUTH_TAG_LENGTH = 16;
const SALT = "cortex-config-salt-v1"; // fijo para derivar clave desde masterSecret

interface ConfigStoreOptions {
	/** Secreto maestro para derivar la clave de cifrado (mínimo 16 chars) */
	masterSecret: string;
}

/**
 * Almacén cifrado de configuración sensible (API keys, tokens).
 *
 * - Cifrado: AES-256-GCM con IV aleatorio por operación
 * - La clave de cifrado se deriva del masterSecret via scrypt
 * - En producción, masterSecret vendrá de OS keychain o variable de entorno
 */
export class ConfigStore {
	private readonly key: Buffer;
	private readonly store = new Map<string, string>();

	constructor({ masterSecret }: ConfigStoreOptions) {
		// Derivar clave de 32 bytes desde masterSecret
		this.key = scryptSync(masterSecret, SALT, 32);
	}

	/** Cifra un valor en texto plano y retorna base64(iv + authTag + ciphertext). */
	encryptKey(raw: string): string {
		if (!raw) throw new Error("ConfigStore: empty key");

		const iv = randomBytes(IV_LENGTH);
		const cipher = createCipheriv(ALGORITHM, this.key, iv, {
			authTagLength: AUTH_TAG_LENGTH,
		});
		const encrypted = Buffer.concat([
			cipher.update(raw, "utf8"),
			cipher.final(),
		]);
		const authTag = cipher.getAuthTag();

		// Formato: iv (12) | authTag (16) | ciphertext (n)
		return Buffer.concat([iv, authTag, encrypted]).toString("base64");
	}

	/** Descifra un valor producido por encryptKey. */
	decryptKey(encrypted: string): string {
		if (!encrypted) throw new Error("ConfigStore: empty encrypted");

		const buf = Buffer.from(encrypted, "base64");
		const iv = buf.subarray(0, IV_LENGTH);
		const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
		const ciphertext = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

		const decipher = createDecipheriv(ALGORITHM, this.key, iv, {
			authTagLength: AUTH_TAG_LENGTH,
		});
		decipher.setAuthTag(authTag);
		return decipher.update(ciphertext) + decipher.final("utf8");
	}

	/** Guarda una API key de forma cifrada. */
	set(name: string, rawValue: string): void {
		this.store.set(name, this.encryptKey(rawValue));
	}

	/** Recupera y descifra una API key. Retorna null si no existe. */
	get(name: string): string | null {
		const encrypted = this.store.get(name);
		if (!encrypted) return null;
		return this.decryptKey(encrypted);
	}
}
