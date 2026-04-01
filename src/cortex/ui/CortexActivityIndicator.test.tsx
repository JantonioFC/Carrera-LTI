import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { CortexActivityIndicator } from "./CortexActivityIndicator";
import { useCortexStore } from "./cortexStore";

beforeEach(() => useCortexStore.getState().reset());

describe("CortexActivityIndicator", () => {
	it("should_show_idle_state_by_default", () => {
		render(<CortexActivityIndicator />);
		expect(screen.getByTestId("cortex-activity")).toHaveTextContent(
			/inactivo|idle/i,
		);
	});

	it("should_show_indexing_with_document_title", () => {
		useCortexStore
			.getState()
			.setActivity({ type: "indexing", docTitle: "Apuntes TCP" });
		render(<CortexActivityIndicator />);
		expect(screen.getByTestId("cortex-activity")).toHaveTextContent(
			/indexando/i,
		);
		expect(screen.getByTestId("cortex-activity")).toHaveTextContent(
			"Apuntes TCP",
		);
	});

	it("should_show_progress_when_indexing", () => {
		useCortexStore
			.getState()
			.setActivity({ type: "indexing", docTitle: "Redes", progress: 60 });
		render(<CortexActivityIndicator />);
		expect(screen.getByTestId("cortex-progress")).toHaveTextContent("60");
	});

	it("should_not_show_progress_bar_when_no_progress_value", () => {
		useCortexStore
			.getState()
			.setActivity({ type: "indexing", docTitle: "Redes" });
		render(<CortexActivityIndicator />);
		expect(screen.queryByTestId("cortex-progress")).not.toBeInTheDocument();
	});

	it("should_show_querying_state", () => {
		useCortexStore
			.getState()
			.setActivity({ type: "querying", query: "TCP handshake" });
		render(<CortexActivityIndicator />);
		expect(screen.getByTestId("cortex-activity")).toHaveTextContent(
			/consultando/i,
		);
	});

	it("should_show_ocr_state_with_filename", () => {
		useCortexStore
			.getState()
			.setActivity({ type: "ocr", filename: "parcial.pdf" });
		render(<CortexActivityIndicator />);
		expect(screen.getByTestId("cortex-activity")).toHaveTextContent(/ocr/i);
		expect(screen.getByTestId("cortex-activity")).toHaveTextContent(
			"parcial.pdf",
		);
	});
});
