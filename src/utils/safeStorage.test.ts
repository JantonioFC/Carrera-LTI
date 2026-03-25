import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
	parseJSON,
	parseSessionJSON,
	parseValidatedJSON,
	removeKey,
	safeParseJSON,
	safeParseSessionJSON,
	safeParseValidatedJSON,
	setJSON,
} from "./safeStorage";

describe("safeParseJSON", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("retorna el fallback si la key no existe", () => {
		const result = safeParseJSON("nonexistent", []);
		expect(result).toEqual([]);
	});

	it("retorna el fallback si la key no existe (objeto)", () => {
		const fallback = { default: true };
		const result = safeParseJSON("nonexistent", fallback);
		expect(result).toEqual(fallback);
	});

	it("parsea correctamente JSON válido", () => {
		const data = [{ id: "1", name: "Test" }];
		localStorage.setItem("test_key", JSON.stringify(data));
		const result = safeParseJSON("test_key", []);
		expect(result).toEqual(data);
	});

	it("retorna el fallback si el JSON es inválido/corrupto", () => {
		localStorage.setItem("bad_json", "{invalid json!!!");
		const result = safeParseJSON("bad_json", "fallback");
		expect(result).toBe("fallback");
	});

	it("retorna el fallback si localStorage lanza excepción", () => {
		const spy = vi
			.spyOn(Storage.prototype, "getItem")
			.mockImplementation(() => {
				throw new Error("Storage disabled");
			});
		const result = safeParseJSON("key", 42);
		expect(result).toBe(42);
		spy.mockRestore();
	});
});

describe("safeParseSessionJSON", () => {
	beforeEach(() => {
		sessionStorage.clear();
	});

	it("retorna el fallback si la key no existe", () => {
		const result = safeParseSessionJSON("nonexistent", "default");
		expect(result).toBe("default");
	});

	it("parsea correctamente JSON válido desde sessionStorage", () => {
		sessionStorage.setItem("session_key", JSON.stringify({ test: true }));
		const result = safeParseSessionJSON("session_key", {});
		expect(result).toEqual({ test: true });
	});

	it("retorna el fallback si el JSON es inválido en sessionStorage", () => {
		sessionStorage.setItem("bad_session", "not-json");
		const result = safeParseSessionJSON("bad_session", []);
		expect(result).toEqual([]);
	});
});

describe("parseJSON", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("retorna ok(valor) si la clave existe y es JSON válido", () => {
		localStorage.setItem("k", JSON.stringify({ x: 1 }));
		const result = parseJSON<{ x: number }>("k");
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value).toEqual({ x: 1 });
	});

	it("retorna err si la clave no existe", () => {
		const result = parseJSON("no_existe");
		expect(result.ok).toBe(false);
	});

	it("retorna err si el JSON es corrupto", () => {
		localStorage.setItem("bad", "{corrupto");
		const result = parseJSON("bad");
		expect(result.ok).toBe(false);
	});

	it("retorna err si localStorage lanza", () => {
		const spy = vi
			.spyOn(Storage.prototype, "getItem")
			.mockImplementation(() => {
				throw new Error("denied");
			});
		const result = parseJSON("k");
		expect(result.ok).toBe(false);
		spy.mockRestore();
	});
});

describe("parseSessionJSON", () => {
	beforeEach(() => {
		sessionStorage.clear();
	});

	it("retorna ok(valor) si la clave existe en sessionStorage", () => {
		sessionStorage.setItem("s", JSON.stringify([1, 2]));
		const result = parseSessionJSON<number[]>("s");
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value).toEqual([1, 2]);
	});

	it("retorna err si la clave no existe", () => {
		const result = parseSessionJSON("no_existe");
		expect(result.ok).toBe(false);
	});

	it("retorna err si el JSON es corrupto", () => {
		sessionStorage.setItem("bad", "!!!");
		const result = parseSessionJSON("bad");
		expect(result.ok).toBe(false);
	});
});

describe("parseValidatedJSON", () => {
	const schema = z.object({ name: z.string() });

	beforeEach(() => {
		localStorage.clear();
	});

	it("retorna ok si JSON válido y pasa el schema", () => {
		localStorage.setItem("v", JSON.stringify({ name: "test" }));
		const result = parseValidatedJSON("v", schema);
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value.name).toBe("test");
	});

	it("retorna err si JSON válido pero falla validación", () => {
		localStorage.setItem("v", JSON.stringify({ name: 123 }));
		const result = parseValidatedJSON("v", schema);
		expect(result.ok).toBe(false);
	});

	it("retorna err si la clave no existe", () => {
		const result = parseValidatedJSON("no_existe", schema);
		expect(result.ok).toBe(false);
	});
});

describe("safeParseValidatedJSON", () => {
	const schema = z.object({ val: z.number() });

	beforeEach(() => {
		localStorage.clear();
	});

	it("retorna el valor si pasa la validación", () => {
		localStorage.setItem("v", JSON.stringify({ val: 42 }));
		const result = safeParseValidatedJSON("v", schema, { val: 0 });
		expect(result.val).toBe(42);
	});

	it("retorna el fallback si la validación falla", () => {
		localStorage.setItem("v", JSON.stringify({ val: "no-number" }));
		const result = safeParseValidatedJSON("v", schema, { val: 99 });
		expect(result.val).toBe(99);
	});
});

describe("setJSON", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("retorna ok(undefined) en éxito y persiste el valor", () => {
		const result = setJSON("k", { a: 1 });
		expect(result.ok).toBe(true);
		expect(localStorage.getItem("k")).toBe(JSON.stringify({ a: 1 }));
	});

	it("retorna err si localStorage.setItem lanza", () => {
		const spy = vi
			.spyOn(Storage.prototype, "setItem")
			.mockImplementation(() => {
				throw new Error("QuotaExceeded");
			});
		const result = setJSON("k", {});
		expect(result.ok).toBe(false);
		spy.mockRestore();
	});
});

describe("removeKey", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("elimina la clave correctamente", () => {
		localStorage.setItem("bye", "val");
		removeKey("bye");
		expect(localStorage.getItem("bye")).toBeNull();
	});

	it("no lanza si el storage no está disponible", () => {
		const spy = vi
			.spyOn(Storage.prototype, "removeItem")
			.mockImplementation(() => {
				throw new Error("denied");
			});
		expect(() => removeKey("k")).not.toThrow();
		spy.mockRestore();
	});
});
