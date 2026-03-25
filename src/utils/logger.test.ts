import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "./logger";

describe("logger", () => {
	let debugSpy: ReturnType<typeof vi.spyOn>;
	let infoSpy: ReturnType<typeof vi.spyOn>;
	let warnSpy: ReturnType<typeof vi.spyOn>;
	let errorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
		infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
		warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		logger.setLevel("debug");
	});

	afterEach(() => {
		logger.setLevel("debug");
		vi.restoreAllMocks();
	});

	it("debug llama console.debug con formato [HH:MM:SS] [DEBUG] [module] msg", () => {
		logger.debug("mod", "mensaje");
		expect(debugSpy).toHaveBeenCalledOnce();
		const arg = debugSpy.mock.calls[0][0] as string;
		expect(arg).toMatch(/\[\d{2}:\d{2}:\d{2}\] \[DEBUG\] \[mod\] mensaje/);
	});

	it("info llama console.info con formato correcto", () => {
		logger.info("mod", "info msg");
		expect(infoSpy).toHaveBeenCalledOnce();
		const arg = infoSpy.mock.calls[0][0] as string;
		expect(arg).toMatch(/\[\d{2}:\d{2}:\d{2}\] \[INFO\] \[mod\] info msg/);
	});

	it("warn llama console.warn con formato correcto", () => {
		logger.warn("mod", "warn msg");
		expect(warnSpy).toHaveBeenCalledOnce();
		const arg = warnSpy.mock.calls[0][0] as string;
		expect(arg).toMatch(/\[\d{2}:\d{2}:\d{2}\] \[WARN\] \[mod\] warn msg/);
	});

	it("error llama console.error con formato correcto", () => {
		logger.error("mod", "error msg");
		expect(errorSpy).toHaveBeenCalledOnce();
		const arg = errorSpy.mock.calls[0][0] as string;
		expect(arg).toMatch(/\[\d{2}:\d{2}:\d{2}\] \[ERROR\] \[mod\] error msg/);
	});

	it("los args extra se pasan a console", () => {
		const extra = { extra: true };
		logger.debug("mod", "msg", extra);
		expect(debugSpy.mock.calls[0][1]).toBe(extra);
	});

	it("setLevel('warn'): debug e info NO llaman console; warn y error SÍ", () => {
		logger.setLevel("warn");
		logger.debug("m", "d");
		logger.info("m", "i");
		logger.warn("m", "w");
		logger.error("m", "e");
		expect(debugSpy).not.toHaveBeenCalled();
		expect(infoSpy).not.toHaveBeenCalled();
		expect(warnSpy).toHaveBeenCalledOnce();
		expect(errorSpy).toHaveBeenCalledOnce();
	});

	it("setLevel('error'): solo error llama console", () => {
		logger.setLevel("error");
		logger.debug("m", "d");
		logger.info("m", "i");
		logger.warn("m", "w");
		logger.error("m", "e");
		expect(debugSpy).not.toHaveBeenCalled();
		expect(infoSpy).not.toHaveBeenCalled();
		expect(warnSpy).not.toHaveBeenCalled();
		expect(errorSpy).toHaveBeenCalledOnce();
	});

	it("setLevel('debug'): todos los niveles llaman console", () => {
		logger.setLevel("debug");
		logger.debug("m", "d");
		logger.info("m", "i");
		logger.warn("m", "w");
		logger.error("m", "e");
		expect(debugSpy).toHaveBeenCalledOnce();
		expect(infoSpy).toHaveBeenCalledOnce();
		expect(warnSpy).toHaveBeenCalledOnce();
		expect(errorSpy).toHaveBeenCalledOnce();
	});
});
