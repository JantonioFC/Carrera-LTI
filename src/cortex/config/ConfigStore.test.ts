import { describe, expect, it } from "vitest";
import { ConfigStore } from "../../../electron/utils/configStore";

describe("ConfigStore — encryptKey / decryptKey", () => {
	const store = new ConfigStore({
		masterSecret: "test-secret-32-chars-padded!!!",
	});

	it("should_encrypt_and_decrypt_to_original_value", () => {
		const raw = "sk-ant-api-key-1234567890";
		const encrypted = store.encryptKey(raw);
		expect(store.decryptKey(encrypted)).toBe(raw);
	});

	it("should_produce_different_ciphertext_each_call_due_to_iv", () => {
		const raw = "same-key";
		const c1 = store.encryptKey(raw);
		const c2 = store.encryptKey(raw);
		// IV aleatorio → texto cifrado distinto cada vez
		expect(c1).not.toBe(c2);
		// Pero ambos deben descifrarse correctamente
		expect(store.decryptKey(c1)).toBe(raw);
		expect(store.decryptKey(c2)).toBe(raw);
	});

	it("should_not_expose_raw_key_in_encrypted_string", () => {
		const raw = "super-secret-key";
		const encrypted = store.encryptKey(raw);
		expect(encrypted).not.toContain(raw);
	});

	it("should_throw_on_tampered_ciphertext", () => {
		const encrypted = store.encryptKey("my-key");
		const tampered = `${encrypted.slice(0, -4)}XXXX`;
		expect(() => store.decryptKey(tampered)).toThrow();
	});

	it("should_throw_on_empty_raw_key", () => {
		expect(() => store.encryptKey("")).toThrow("ConfigStore: empty key");
	});

	it("should_throw_on_empty_encrypted_string", () => {
		expect(() => store.decryptKey("")).toThrow("ConfigStore: empty encrypted");
	});
});

describe("ConfigStore — get / set", () => {
	it("should_store_and_retrieve_encrypted_api_key", () => {
		const store = new ConfigStore({
			masterSecret: "test-secret-32-chars-padded!!!",
		});
		store.set("anthropic_key", "sk-ant-123");
		expect(store.get("anthropic_key")).toBe("sk-ant-123");
	});

	it("should_return_null_for_unknown_key", () => {
		const store = new ConfigStore({
			masterSecret: "test-secret-32-chars-padded!!!",
		});
		expect(store.get("nonexistent")).toBeNull();
	});

	it("should_overwrite_existing_key", () => {
		const store = new ConfigStore({
			masterSecret: "test-secret-32-chars-padded!!!",
		});
		store.set("my_key", "value-v1");
		store.set("my_key", "value-v2");
		expect(store.get("my_key")).toBe("value-v2");
	});
});
