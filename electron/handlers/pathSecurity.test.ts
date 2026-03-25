import { homedir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mockeamos electron para que app.getPath() devuelva rutas controladas.
vi.mock("electron", () => ({
	app: {
		getPath: (name: string) => {
			const paths: Record<string, string> = {
				userData: join(homedir(), ".carrera-lti", "userData"),
				documents: join(homedir(), "Documents"),
				temp: join(homedir(), ".carrera-lti", "tmp"),
			};
			return paths[name] ?? join(homedir(), ".carrera-lti", "tmp");
		},
	},
}));

import { assertSafePath } from "./pathSecurity";

/**
 * Tests unitarios de assertSafePath.
 *
 * Verifican que la función rechaza correctamente rutas peligrosas y acepta
 * las rutas dentro de los directorios permitidos. (#146)
 */

describe("pathSecurity — assertSafePath", () => {
	describe("rutas válidas (dentro de allowlist)", () => {
		it("should_accept_path_inside_homedir", () => {
			expect(() =>
				assertSafePath(join(homedir(), "documento.pdf")),
			).not.toThrow();
		});

		it("should_accept_path_inside_documents", () => {
			expect(() =>
				assertSafePath(join(homedir(), "Documents", "tesis.pdf")),
			).not.toThrow();
		});

		it("should_accept_path_inside_userData", () => {
			expect(() =>
				assertSafePath(
					join(homedir(), ".carrera-lti", "userData", "config.json"),
				),
			).not.toThrow();
		});

		it("should_accept_path_inside_temp", () => {
			expect(() =>
				assertSafePath(
					join(homedir(), ".carrera-lti", "tmp", "recording.wav"),
				),
			).not.toThrow();
		});

		it("should_accept_nested_path_inside_homedir", () => {
			expect(() =>
				assertSafePath(join(homedir(), "a", "b", "c", "file.txt")),
			).not.toThrow();
		});
	});

	describe("rutas inválidas (path traversal)", () => {
		it("should_reject_relative_path", () => {
			expect(() => assertSafePath("relative/path/file.pdf")).toThrow(
				/ruta absoluta/,
			);
		});

		it("should_reject_bare_filename", () => {
			expect(() => assertSafePath("file.pdf")).toThrow(/ruta absoluta/);
		});

		it("should_reject_path_outside_allowlist", () => {
			expect(() => assertSafePath("/etc/passwd")).toThrow(
				/fuera de directorios permitidos/,
			);
		});

		it("should_reject_root_path", () => {
			expect(() => assertSafePath("/")).toThrow(
				/fuera de directorios permitidos/,
			);
		});

		it("should_reject_system_path", () => {
			expect(() => assertSafePath("/usr/bin/python")).toThrow(
				/fuera de directorios permitidos/,
			);
		});

		it("should_reject_tmp_outside_allowlist", () => {
			// /tmp es distinto de ~/.carrera-lti/tmp
			expect(() => assertSafePath("/tmp/malicioso.pdf")).toThrow(
				/fuera de directorios permitidos/,
			);
		});
	});

	describe("error messages", () => {
		it("should_include_resolved_path_in_error_message", () => {
			expect(() => assertSafePath("/etc/shadow")).toThrow(/\/etc\/shadow/);
		});

		it("should_include_input_path_in_relative_error_message", () => {
			expect(() => assertSafePath("./relative")).toThrow(/ruta absoluta/);
		});
	});
});
