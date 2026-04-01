import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { CortexTab } from "./CortexTab";
import { useCortexStore } from "./cortexStore";

beforeEach(() => useCortexStore.getState().reset());

describe("CortexTab — estado del índice", () => {
	it("should_show_indexed_doc_count", () => {
		useCortexStore.getState().setIndexedDocCount(42);
		render(<CortexTab />);
		expect(screen.getByTestId("cortex-doc-count")).toHaveTextContent("42");
	});

	it("should_show_zero_docs_when_index_empty", () => {
		render(<CortexTab />);
		expect(screen.getByTestId("cortex-doc-count")).toHaveTextContent("0");
	});

	it("should_show_last_indexed_timestamp_when_set", () => {
		const ts = new Date("2026-03-22T10:00:00Z").getTime();
		useCortexStore.getState().setLastIndexedAt(ts);
		render(<CortexTab />);
		expect(screen.getByTestId("cortex-last-indexed")).toBeInTheDocument();
		// Debe mostrar algún formato de fecha/hora legible
		expect(screen.getByTestId("cortex-last-indexed").textContent).not.toBe("");
	});

	it("should_show_never_when_never_indexed", () => {
		render(<CortexTab />);
		expect(screen.getByTestId("cortex-last-indexed")).toHaveTextContent(
			/nunca|never/i,
		);
	});
});

describe("CortexTab — actividad", () => {
	it("should_show_current_activity", () => {
		useCortexStore
			.getState()
			.setActivity({ type: "indexing", docTitle: "Parcial 2" });
		render(<CortexTab />);
		expect(screen.getByTestId("cortex-activity")).toHaveTextContent(
			/indexando/i,
		);
		expect(screen.getByTestId("cortex-activity")).toHaveTextContent(
			"Parcial 2",
		);
	});

	it("should_show_idle_when_no_activity", () => {
		render(<CortexTab />);
		expect(screen.getByTestId("cortex-activity")).toHaveTextContent(
			/inactivo|idle/i,
		);
	});
});

describe("CortexTab — estructura", () => {
	it("should_render_section_headings", () => {
		render(<CortexTab />);
		expect(screen.getByText(/estado del índice/i)).toBeInTheDocument();
		expect(screen.getByText(/actividad/i)).toBeInTheDocument();
	});
});

describe("CortexTab — actividad (todos los tipos)", () => {
	it("should_show_querying_activity", () => {
		useCortexStore
			.getState()
			.setActivity({ type: "querying", query: "¿qué es TCP?" });
		render(<CortexTab />);
		expect(screen.getByTestId("cortex-activity")).toHaveTextContent(
			/consultando/i,
		);
		expect(screen.getByTestId("cortex-activity")).toHaveTextContent(
			"¿qué es TCP?",
		);
	});

	it("should_show_query_error_activity", () => {
		useCortexStore
			.getState()
			.setActivity({ type: "query_error", error: "índice vacío" });
		render(<CortexTab />);
		expect(screen.getByTestId("cortex-activity")).toHaveTextContent(/error/i);
		expect(screen.getByTestId("cortex-activity")).toHaveTextContent(
			"índice vacío",
		);
	});

	it("should_show_ocr_activity", () => {
		useCortexStore
			.getState()
			.setActivity({ type: "ocr", filename: "parcial2.png" });
		render(<CortexTab />);
		expect(screen.getByTestId("cortex-activity")).toHaveTextContent(/ocr/i);
		expect(screen.getByTestId("cortex-activity")).toHaveTextContent(
			"parcial2.png",
		);
	});

	it("should_show_indexing_with_progress", () => {
		useCortexStore
			.getState()
			.setActivity({ type: "indexing", docTitle: "Resumen UDP", progress: 42 });
		render(<CortexTab />);
		expect(screen.getByTestId("cortex-activity")).toHaveTextContent(
			/indexando/i,
		);
		expect(screen.getByTestId("cortex-activity")).toHaveTextContent(
			"Resumen UDP",
		);
	});
});
