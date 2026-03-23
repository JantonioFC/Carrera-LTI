import { describe, expect, it } from "vitest";
import type { RuVectorChunk } from "../ruvector/RuVectorAdapter";
import { buildGroundedResponse, isGrounded } from "./GroundingValidator";

function chunk(
	content: string,
	docId = "doc-1",
	_title = "Apuntes",
): RuVectorChunk {
	return { chunkId: `c-${Math.random()}`, score: 0.9, content, docId };
}

// ─── isGrounded ────────────────────────────────────────────────────────────

describe("GroundingValidator.isGrounded — REQ-22", () => {
	it("should_return_true_when_response_uses_indexed_content", () => {
		const chunks = [
			chunk("El three-way handshake tiene 3 pasos: SYN, SYN-ACK, ACK."),
		];
		const response =
			"Según tus apuntes, el three-way handshake tiene 3 pasos: SYN, SYN-ACK y ACK.";
		expect(isGrounded(response, chunks)).toBe(true);
	});

	it("should_return_false_when_chunks_are_empty", () => {
		expect(isGrounded("cualquier respuesta", [])).toBe(false);
	});

	it("should_return_false_when_response_has_no_overlap_with_chunks", () => {
		const chunks = [chunk("El three-way handshake...")];
		const response =
			"La fotosíntesis es un proceso biológico que ocurre en los cloroplastos.";
		expect(isGrounded(response, chunks)).toBe(false);
	});

	it("should_be_case_insensitive_when_checking_overlap", () => {
		const chunks = [chunk("PROTOCOLO TCP requiere handshake")];
		const response = "según tus apuntes, el protocolo tcp requiere handshake";
		expect(isGrounded(response, chunks)).toBe(true);
	});

	it("should_handle_empty_response_string", () => {
		const chunks = [chunk("contenido")];
		expect(isGrounded("", chunks)).toBe(false);
	});

	it("should_handle_single_word_overlap", () => {
		// Una sola palabra en común no es suficiente grounding
		const chunks = [chunk("photosynthesis is a complex biological process")];
		const response = "process";
		expect(isGrounded(response, chunks)).toBe(false);
	});
});

// ─── buildGroundedResponse ─────────────────────────────────────────────────

describe("GroundingValidator.buildGroundedResponse — REQ-22", () => {
	it("should_return_no_results_message_when_chunks_empty", () => {
		const result = buildGroundedResponse([], "qué es TCP");
		expect(result.content).toBe(
			"No encontré información sobre esto en tu índice.",
		);
		expect(result.sources).toHaveLength(0);
		expect(result.grounded).toBe(false);
	});

	it("should_include_source_citation_for_every_chunk", () => {
		const chunks = [
			chunk("TCP es un protocolo orientado a conexión.", "doc-1"),
			chunk("UDP no garantiza entrega.", "doc-2"),
		];
		const result = buildGroundedResponse(chunks, "diferencia TCP y UDP");
		expect(result.sources).toHaveLength(2);
		expect(result.sources.map((s) => s.docId)).toContain("doc-1");
		expect(result.sources.map((s) => s.docId)).toContain("doc-2");
	});

	it("should_mark_response_as_grounded_when_chunks_present", () => {
		const chunks = [chunk("contenido relevante")];
		const result = buildGroundedResponse(chunks, "query");
		expect(result.grounded).toBe(true);
	});

	it("should_include_chunk_content_in_response", () => {
		const chunks = [chunk("El modelo OSI tiene 7 capas.")];
		const result = buildGroundedResponse(chunks, "capas OSI");
		expect(result.content).toContain("El modelo OSI tiene 7 capas.");
	});

	it("should_not_include_content_outside_provided_chunks", () => {
		const chunks = [chunk("Solo esto está indexado.")];
		const result = buildGroundedResponse(chunks, "query");
		// El contenido de la respuesta debe ser construido SOLO desde los chunks
		expect(result.content).not.toContain("conocimiento externo");
	});

	it("should_deduplicate_sources_by_docId", () => {
		const chunks = [
			chunk("Fragmento 1 del documento A", "doc-A"),
			chunk("Fragmento 2 del documento A", "doc-A"),
		];
		const result = buildGroundedResponse(chunks, "query");
		const docIds = result.sources.map((s) => s.docId);
		expect(new Set(docIds).size).toBe(docIds.length); // sin duplicados
	});
});
