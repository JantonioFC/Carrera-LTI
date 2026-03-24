import { beforeEach, describe, expect, it, vi } from "vitest";
import { CircuitBreaker } from "./CircuitBreaker";

/**
 * Tests unitarios del CircuitBreaker — Issue #91
 */

const THRESHOLD = 3;
const RECOVERY_MS = 500; // corto para tests

let cb: CircuitBreaker;

beforeEach(() => {
	cb = new CircuitBreaker({
		name: "test-proc",
		failureThreshold: THRESHOLD,
		recoveryTimeMs: RECOVERY_MS,
	});
});

// ─── Estado inicial ──────────────────────────────────────────────────────────

describe("CircuitBreaker — estado inicial", () => {
	it("inicia en CLOSED", () => {
		expect(cb.getState()).toBe("CLOSED");
	});

	it("failureCount inicial es 0", () => {
		expect(cb.getFailureCount()).toBe(0);
	});
});

// ─── Estado CLOSED ───────────────────────────────────────────────────────────

describe("CircuitBreaker — CLOSED", () => {
	it("ejecuta fn y retorna el resultado en éxito", async () => {
		const result = await cb.call(async () => 42);
		expect(result).toBe(42);
	});

	it("propaga el error de fn sin abrir el circuito si hay menos de threshold fallos", async () => {
		const err = new Error("fallo puntual");
		await expect(cb.call(() => Promise.reject(err))).rejects.toThrow(
			"fallo puntual",
		);
		expect(cb.getState()).toBe("CLOSED");
		expect(cb.getFailureCount()).toBe(1);
	});

	it("abre el circuito tras failureThreshold fallos consecutivos", async () => {
		const fail = () => Promise.reject(new Error("crash"));
		for (let i = 0; i < THRESHOLD; i++) {
			await cb.call(fail).catch(() => {});
		}
		expect(cb.getState()).toBe("OPEN");
	});

	it("resetea el contador tras un éxito", async () => {
		await cb.call(() => Promise.reject(new Error("x"))).catch(() => {});
		await cb.call(() => Promise.reject(new Error("x"))).catch(() => {});
		await cb.call(async () => "ok"); // éxito → reset
		expect(cb.getFailureCount()).toBe(0);
		expect(cb.getState()).toBe("CLOSED");
	});
});

// ─── Estado OPEN ─────────────────────────────────────────────────────────────

describe("CircuitBreaker — OPEN", () => {
	async function openCircuit() {
		const fail = () => Promise.reject(new Error("crash"));
		for (let i = 0; i < THRESHOLD; i++) {
			await cb.call(fail).catch(() => {});
		}
	}

	it("falla rápido sin llamar a fn cuando está OPEN", async () => {
		await openCircuit();
		const fn = vi.fn().mockResolvedValue("ok");
		await expect(cb.call(fn)).rejects.toThrow("circuito abierto");
		expect(fn).not.toHaveBeenCalled();
	});

	it("el error de fast-fail incluye el nombre del subproceso", async () => {
		await openCircuit();
		await expect(cb.call(async () => {})).rejects.toThrow("test-proc");
	});
});

// ─── Estado HALF_OPEN ────────────────────────────────────────────────────────

describe("CircuitBreaker — HALF_OPEN", () => {
	async function openAndWait() {
		const fail = () => Promise.reject(new Error("crash"));
		for (let i = 0; i < THRESHOLD; i++) {
			await cb.call(fail).catch(() => {});
		}
		// Avanzar el tiempo para pasar a HALF_OPEN
		vi.setSystemTime(Date.now() + RECOVERY_MS + 1);
	}

	it("pasa a HALF_OPEN tras recoveryTimeMs", async () => {
		vi.useFakeTimers();
		await openAndWait();
		// La llamada siguiente debería transicionar a HALF_OPEN
		await cb.call(async () => "probe").catch(() => {});
		vi.useRealTimers();
	});

	it("cierra el circuito si la llamada de prueba tiene éxito", async () => {
		vi.useFakeTimers();
		await openAndWait();
		await cb.call(async () => "recovered");
		expect(cb.getState()).toBe("CLOSED");
		expect(cb.getFailureCount()).toBe(0);
		vi.useRealTimers();
	});

	it("vuelve a OPEN si la llamada de prueba falla", async () => {
		vi.useFakeTimers();
		await openAndWait();
		await cb.call(() => Promise.reject(new Error("still broken"))).catch(
			() => {},
		);
		expect(cb.getState()).toBe("OPEN");
		vi.useRealTimers();
	});
});

// ─── reset() ────────────────────────────────────────────────────────────────

describe("CircuitBreaker — reset()", () => {
	it("cierra el circuito y resetea contadores", async () => {
		const fail = () => Promise.reject(new Error("crash"));
		for (let i = 0; i < THRESHOLD; i++) {
			await cb.call(fail).catch(() => {});
		}
		expect(cb.getState()).toBe("OPEN");

		cb.reset();
		expect(cb.getState()).toBe("CLOSED");
		expect(cb.getFailureCount()).toBe(0);
	});

	it("permite llamadas normales tras reset()", async () => {
		const fail = () => Promise.reject(new Error("crash"));
		for (let i = 0; i < THRESHOLD; i++) {
			await cb.call(fail).catch(() => {});
		}
		cb.reset();
		const result = await cb.call(async () => "ok");
		expect(result).toBe("ok");
	});
});
