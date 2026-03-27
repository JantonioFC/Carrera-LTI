import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useCortexStore } from "./cortexStore";
import { NexusContextSurface } from "./NexusContextSurface";

beforeEach(() => useCortexStore.getState().reset());

describe("NexusContextSurface", () => {
	it("should_render_nothing_when_no_results_and_not_loading", () => {
		const { container } = render(
			<NexusContextSurface taskTitle="Estudiar TCP" />,
		);
		expect(container.firstChild).toBeNull();
	});

	it("should_show_loading_state", () => {
		useCortexStore
			.getState()
			.setActivity({ type: "querying", query: "Estudiar TCP" });
		render(<NexusContextSurface taskTitle="Estudiar TCP" />);
		expect(screen.getByTestId("nexus-context-loading")).toBeInTheDocument();
	});

	it("should_show_results_when_available", () => {
		useCortexStore.getState().setQueryResults([
			{
				chunkId: "c1",
				docId: "doc-1",
				content: "TCP usa three-way handshake",
				score: 0.9,
			},
		]);
		render(<NexusContextSurface taskTitle="Estudiar TCP" />);
		expect(screen.getByTestId("nexus-context-panel")).toBeInTheDocument();
		expect(
			screen.getByText(/TCP usa three-way handshake/i),
		).toBeInTheDocument();
	});

	it("should_show_task_title_in_panel_header", () => {
		useCortexStore
			.getState()
			.setQueryResults([
				{ chunkId: "c1", docId: "doc-1", content: "contenido", score: 0.8 },
			]);
		render(<NexusContextSurface taskTitle="Estudiar UDP" />);
		expect(screen.getByTestId("nexus-context-panel")).toHaveTextContent(
			/Estudiar UDP/i,
		);
	});

	it("should_show_error_state", () => {
		useCortexStore
			.getState()
			.setActivity({ type: "query_error", error: "índice no disponible" });
		render(<NexusContextSurface taskTitle="Cualquier tarea" />);
		expect(screen.getByTestId("nexus-context-error")).toHaveTextContent(
			/índice no disponible/i,
		);
	});

	it("should_limit_displayed_results_to_3", () => {
		useCortexStore.getState().setQueryResults([
			{ chunkId: "c1", docId: "d1", content: "Resultado 1", score: 0.9 },
			{ chunkId: "c2", docId: "d1", content: "Resultado 2", score: 0.85 },
			{ chunkId: "c3", docId: "d1", content: "Resultado 3", score: 0.8 },
			{ chunkId: "c4", docId: "d1", content: "Resultado 4", score: 0.75 },
		]);
		render(<NexusContextSurface taskTitle="tarea" />);
		expect(screen.getAllByTestId("nexus-context-result")).toHaveLength(3);
	});
});
