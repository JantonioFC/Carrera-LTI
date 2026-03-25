import { describe, expect, it } from "vitest";
import {
	err,
	failure,
	isFailure,
	isLoading,
	isNotAsked,
	isSuccess,
	loading,
	notAsked,
	ok,
	success,
} from "./result";

describe("ok / err", () => {
	it("ok(value) retorna { ok: true, value }", () => {
		const r = ok(42);
		expect(r).toEqual({ ok: true, value: 42 });
	});

	it("err(error) retorna { ok: false, error }", () => {
		const e = new Error("fallo");
		const r = err(e);
		expect(r).toEqual({ ok: false, error: e });
	});
});

describe("RemoteData constructores", () => {
	it("notAsked() retorna { type: 'not_asked' }", () => {
		expect(notAsked()).toEqual({ type: "not_asked" });
	});

	it("loading() retorna { type: 'loading' }", () => {
		expect(loading()).toEqual({ type: "loading" });
	});

	it("success(data) retorna { type: 'success', data }", () => {
		expect(success("abc")).toEqual({ type: "success", data: "abc" });
	});

	it("failure(error) retorna { type: 'failure', error }", () => {
		const e = new Error("err");
		expect(failure(e)).toEqual({ type: "failure", error: e });
	});
});

describe("isNotAsked", () => {
	it("true para not_asked", () => {
		expect(isNotAsked(notAsked())).toBe(true);
	});

	it("false para loading", () => {
		expect(isNotAsked(loading())).toBe(false);
	});

	it("false para success", () => {
		expect(isNotAsked(success(1))).toBe(false);
	});

	it("false para failure", () => {
		expect(isNotAsked(failure(new Error()))).toBe(false);
	});
});

describe("isLoading", () => {
	it("true para loading", () => {
		expect(isLoading(loading())).toBe(true);
	});

	it("false para not_asked", () => {
		expect(isLoading(notAsked())).toBe(false);
	});

	it("false para success", () => {
		expect(isLoading(success(1))).toBe(false);
	});

	it("false para failure", () => {
		expect(isLoading(failure(new Error()))).toBe(false);
	});
});

describe("isSuccess", () => {
	it("true para success", () => {
		expect(isSuccess(success(42))).toBe(true);
	});

	it("false para not_asked", () => {
		expect(isSuccess(notAsked())).toBe(false);
	});

	it("false para loading", () => {
		expect(isSuccess(loading())).toBe(false);
	});

	it("false para failure", () => {
		expect(isSuccess(failure(new Error()))).toBe(false);
	});

	it("type guard permite acceder a .data", () => {
		const rd = success({ name: "juan" });
		if (isSuccess(rd)) {
			expect(rd.data.name).toBe("juan");
		} else {
			throw new Error("debería ser success");
		}
	});
});

describe("isFailure", () => {
	it("true para failure", () => {
		expect(isFailure(failure("error"))).toBe(true);
	});

	it("false para not_asked", () => {
		expect(isFailure(notAsked())).toBe(false);
	});

	it("false para loading", () => {
		expect(isFailure(loading())).toBe(false);
	});

	it("false para success", () => {
		expect(isFailure(success(1))).toBe(false);
	});

	it("type guard permite acceder a .error", () => {
		const e = new Error("fallo");
		const rd = failure(e);
		if (isFailure(rd)) {
			expect(rd.error).toBe(e);
		} else {
			throw new Error("debería ser failure");
		}
	});
});
