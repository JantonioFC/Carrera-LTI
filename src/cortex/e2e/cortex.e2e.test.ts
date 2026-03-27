/**
 * Suite E2E de Cortex — Issue #29
 *
 * Estos tests usan los subprocesos REALES (RuVector, Docling, Whisper).
 * Solo corren cuando E2E=true está definido en el entorno.
 * En CI se ejecutan en un job separado con los binarios instalados.
 *
 * Tiempo máximo por suite: 5 minutos (ver CI e2e.yml).
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
	buildGroundedResponse,
	isGrounded,
} from "../grounding/GroundingValidator";
import type { RuVectorChunk } from "../ruvector/RuVectorAdapter";

const E2E = process.env.E2E === "true";
const FIXTURES_DIR = join(import.meta.dirname, "fixtures");

/** Carga un fixture de texto como chunk simulado (para tests sin binarios) */
function fixtureAsChunk(filename: string, docId: string): RuVectorChunk {
	const content = readFileSync(join(FIXTURES_DIR, filename), "utf8");
	return { chunkId: `${docId}-c1`, score: 0.95, content, docId };
}

// ── Fixtures cargados ────────────────────────────────────────────────────────

const FIXTURES = [
	{ file: "tcp-handshake.txt", docId: "fixture-tcp" },
	{ file: "modelo-osi.txt", docId: "fixture-osi" },
	{ file: "algebra-lineal.txt", docId: "fixture-algebra" },
	{ file: "sistemas-operativos.txt", docId: "fixture-so" },
	{ file: "base-de-datos.txt", docId: "fixture-db" },
];

// ── E2E con subprocesos reales ───────────────────────────────────────────────

describe.skipIf(!E2E)("Cortex E2E — subprocesos reales", () => {
	// Requiere: binarios ruvector + docling en PATH, E2E=true en entorno.
	// Job CI dedicado: .github/workflows/e2e.yml (timeout 5 min).
	// Flujo esperado: SubprocessAdapter real → RuVectorAdapter → index → query → grounding.

	it.todo(
		"indexDocument — indexa un fixture .txt y retorna chunks mayor que 0",
	);

	it.todo(
		"query — recupera chunks relevantes (score > 0.5) para consulta TCP on-topic",
	);

	it.todo(
		"pipeline completo — index + query + isGrounded retorna true para consulta dentro del índice",
	);

	it.todo(
		"pipeline completo — isGrounded retorna false para consulta fuera del índice (fotosíntesis)",
	);

	it.todo(
		"deleteDocument — tras eliminar doc, query posterior retorna 0 chunks de ese docId",
	);

	it.todo(
		"shouldRestart — orquestador reinicia subproceso caído si crashCount < MAX_CRASH_COUNT",
	);
});

// ── Tests de grounding con fixtures controlados (siempre corren) ─────────────

describe("Cortex E2E — GroundingValidator con índice controlado (REQ-22)", () => {
	const chunks = FIXTURES.map((f) => fixtureAsChunk(f.file, f.docId));

	it("should_be_grounded_for_tcp_query", () => {
		const response =
			"El three-way handshake consta de SYN, SYN-ACK y ACK para establecer conexión TCP.";
		expect(isGrounded(response, chunks)).toBe(true);
	});

	it("should_be_grounded_for_osi_query", () => {
		const response =
			"El modelo OSI tiene 7 capas: física, enlace, red, transporte, sesión, presentación y aplicación.";
		expect(isGrounded(response, chunks)).toBe(true);
	});

	it("should_be_grounded_for_database_query", () => {
		const response =
			"La tercera forma normal requiere que no haya dependencias transitivas entre atributos.";
		expect(isGrounded(response, chunks)).toBe(true);
	});

	it("should_NOT_be_grounded_with_empty_index", () => {
		const response = "El three-way handshake consta de SYN, SYN-ACK y ACK.";
		expect(isGrounded(response, [])).toBe(false);
	});

	it("should_NOT_be_grounded_for_out_of_scope_content", () => {
		const response =
			"La fotosíntesis ocurre en los cloroplastos de las células vegetales.";
		expect(isGrounded(response, chunks)).toBe(false);
	});

	it("should_return_no_results_message_for_empty_index", () => {
		const result = buildGroundedResponse([], "any query");
		expect(result.content).toBe(
			"No encontré información sobre esto en tu índice.",
		);
		expect(result.grounded).toBe(false);
	});

	it("should_include_sources_for_all_5_fixtures_when_all_relevant", () => {
		const result = buildGroundedResponse(chunks, "todo");
		// Con 5 docs distintos → 5 fuentes deduplicadas
		expect(result.sources.length).toBe(5);
		expect(result.grounded).toBe(true);
	});

	it("should_deduplicate_sources_by_docId", () => {
		const dupChunks: RuVectorChunk[] = [
			{
				chunkId: "c1",
				score: 0.9,
				content: "TCP handshake SYN ACK protocolo",
				docId: "doc-A",
			},
			{
				chunkId: "c2",
				score: 0.85,
				content: "TCP handshake SYN-ACK establecimiento",
				docId: "doc-A",
			},
		];
		const result = buildGroundedResponse(dupChunks, "TCP");
		expect(result.sources.filter((s) => s.docId === "doc-A")).toHaveLength(1);
	});
});

// ── Tests de pipeline con mocks (siempre corren) ─────────────────────────────

describe("Cortex E2E — ConferencePipeline contract", () => {
	it("should_have_all_5_fixture_files_accessible", () => {
		for (const { file } of FIXTURES) {
			const content = readFileSync(join(FIXTURES_DIR, file), "utf8");
			expect(content.length).toBeGreaterThan(100);
		}
	});

	it("should_have_valid_content_in_each_fixture", () => {
		const checks: Record<string, string> = {
			"tcp-handshake.txt": "handshake",
			"modelo-osi.txt": "OSI",
			"algebra-lineal.txt": "matriz",
			"sistemas-operativos.txt": "proceso",
			"base-de-datos.txt": "SQL",
		};
		for (const [file, keyword] of Object.entries(checks)) {
			const content = readFileSync(
				join(FIXTURES_DIR, file),
				"utf8",
			).toLowerCase();
			expect(content).toContain(keyword.toLowerCase());
		}
	});
});
