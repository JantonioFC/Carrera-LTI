/**
 * Tests for security.ts — AES-256-GCM, PBKDF2, migration v1→v2 (Issue #110)
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { deobfuscate, obfuscate } from "./security";

// jsdom does not ship a full Web Crypto implementation. We provide a
// minimal mock that mirrors the real AES-GCM + PBKDF2 surface used by
// getCryptoKey(), obfuscate(), and deobfuscate().

// ─── deterministic fake AES-GCM ────────────────────────────────────────────
// We XOR every byte with a fixed key-byte so encrypt/decrypt are symmetric
// and produce output that differs from plaintext.
const FAKE_KEY_BYTE = 0xab;

function fakeEncrypt(data: BufferSource): Promise<ArrayBuffer> {
	const bytes = new Uint8Array(
		data instanceof ArrayBuffer ? data : (data as ArrayBufferView).buffer,
		data instanceof ArrayBuffer ? 0 : (data as ArrayBufferView).byteOffset,
		data instanceof ArrayBuffer
			? data.byteLength
			: (data as ArrayBufferView).byteLength,
	);
	const out = bytes.map((b) => b ^ FAKE_KEY_BYTE);
	return Promise.resolve(out.buffer);
}

function fakeDecrypt(data: BufferSource): Promise<ArrayBuffer> {
	// XOR is its own inverse
	return fakeEncrypt(data);
}

const fakeCryptoKey = {} as CryptoKey;

const subtleMock = {
	importKey: vi.fn().mockResolvedValue(fakeCryptoKey),
	deriveKey: vi.fn().mockResolvedValue(fakeCryptoKey),
	encrypt: vi.fn((_algo: unknown, _key: unknown, data: BufferSource) =>
		fakeEncrypt(data),
	),
	decrypt: vi.fn((_algo: unknown, _key: unknown, data: BufferSource) =>
		fakeDecrypt(data),
	),
};

// Deterministic getRandomValues — always fills with 0x01 so IV is predictable
const getRandomValuesMock = vi.fn((buf: Uint8Array) => {
	buf.fill(0x01);
	return buf;
});

// ─── localStorage mock ──────────────────────────────────────────────────────
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: vi.fn((key: string) => store[key] ?? null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value;
		}),
		clear: vi.fn(() => {
			store = {};
		}),
	};
})();

// ─── Install globals before the module is imported ─────────────────────────
vi.stubGlobal("crypto", {
	subtle: subtleMock,
	getRandomValues: getRandomValuesMock,
});
vi.stubGlobal("localStorage", localStorageMock);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build a legacy v1 token: "obv1:" + base64(XOR 0x55 of plaintext). */
function makeLegacyV1(plain: string): string {
	const xored = plain
		.split("")
		.map((c) => String.fromCharCode(c.charCodeAt(0) ^ 0x55))
		.join("");
	return `obv1:${btoa(xored)}`;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("security.ts", () => {
	beforeEach(() => {
		// Reset the module-level cached CryptoKey between tests by clearing
		// the mock call history and resetting localStorage.
		localStorageMock.clear();
		vi.clearAllMocks();

		// Re-apply mock implementations after clearAllMocks (which resets them)
		subtleMock.importKey.mockResolvedValue(fakeCryptoKey);
		subtleMock.deriveKey.mockResolvedValue(fakeCryptoKey);
		subtleMock.encrypt.mockImplementation(
			(_algo: unknown, _key: unknown, data: BufferSource) => fakeEncrypt(data),
		);
		subtleMock.decrypt.mockImplementation(
			(_algo: unknown, _key: unknown, data: BufferSource) => fakeDecrypt(data),
		);
		getRandomValuesMock.mockImplementation((buf: Uint8Array) => {
			buf.fill(0x01);
			return buf;
		});

		// Reset the cached _cryptoKey inside the module by reloading via dynamic import
		// (not possible without vi.resetModules — instead we rely on the key being
		// re-derived each test via fresh localStorage, which forces importKey/deriveKey
		// to be called again because the module-level variable persists but mocks
		// always return the same fakeCryptoKey, so it is functionally equivalent).
	});

	// 1. Roundtrip: obfuscate then deobfuscate returns original value
	it("roundtrip: obfuscate → deobfuscate devuelve el string original", async () => {
		const plain = "mi-contraseña-secreta-123";
		const encrypted = await obfuscate(plain);
		const decrypted = await deobfuscate(encrypted);
		expect(decrypted).toBe(plain);
	});

	// 1b. Roundtrip with unicode / special characters
	it("roundtrip: funciona con caracteres especiales y unicode", async () => {
		const plain = "clavé_con_ñ_y_emoji_🔑";
		const encrypted = await obfuscate(plain);
		const decrypted = await deobfuscate(encrypted);
		expect(decrypted).toBe(plain);
	});

	// 2. obfuscate of empty string returns empty string
	it("obfuscate('')  devuelve string vacío", async () => {
		const result = await obfuscate("");
		expect(result).toBe("");
	});

	// 3. deobfuscate of legacy v1 (XOR) token
	it("deobfuscate de token v1 legacy (XOR) devuelve el plaintext correcto", async () => {
		const plain = "dato-antiguo";
		const v1Token = makeLegacyV1(plain);
		expect(v1Token.startsWith("obv1:")).toBe(true);
		const result = await deobfuscate(v1Token);
		expect(result).toBe(plain);
	});

	// 4a. deobfuscate(undefined) — cast to simulate runtime undefined
	it("deobfuscate(undefined) devuelve el valor tal cual (falsy path)", async () => {
		// The function signature is string, but at runtime callers may pass undefined.
		// The implementation: `if (!str) return str;` — so undefined comes back as undefined.
		// We accept either undefined or "" as a safe result (no throw).
		const result = await deobfuscate(undefined as unknown as string);
		expect(result == null || result === "").toBeTruthy();
	});

	// 4b. deobfuscate(null)
	it("deobfuscate(null) no lanza excepción", async () => {
		await expect(
			deobfuscate(null as unknown as string),
		).resolves.not.toThrow();
	});

	// 4c. deobfuscate("") returns ""
	it("deobfuscate('') devuelve string vacío", async () => {
		const result = await deobfuscate("");
		expect(result).toBe("");
	});

	// 5. obfuscate output differs from plaintext (not stored in plain)
	it("el resultado de obfuscate es diferente del input (no plaintext)", async () => {
		const plain = "informacion-sensible";
		const encrypted = await obfuscate(plain);
		expect(encrypted).not.toBe(plain);
		expect(encrypted).not.toContain(plain);
	});

	// 5b. obfuscate output has the wcv1: prefix
	it("el resultado de obfuscate tiene el prefijo wcv1:", async () => {
		const encrypted = await obfuscate("cualquier-cosa");
		expect(encrypted.startsWith("wcv1:")).toBe(true);
	});

	// Extra: deobfuscate of raw string without prefix returns it unchanged
	it("deobfuscate de string sin prefijo conocido lo devuelve sin cambios", async () => {
		const raw = "texto-sin-prefijo";
		const result = await deobfuscate(raw);
		expect(result).toBe(raw);
	});

	// Extra: v1 token with malformed base64 fallbacks to returning the token
	it("deobfuscate de token v1 malformado devuelve el token original sin lanzar", async () => {
		const badToken = "obv1:!!!no-es-base64!!!";
		const result = await deobfuscate(badToken);
		expect(result).toBe(badToken);
	});
});
