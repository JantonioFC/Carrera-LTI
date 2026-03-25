import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "./ErrorBoundary";

vi.mock("lucide-react", () => ({
	AlertTriangle: ({ className }: { className?: string }) => (
		<span data-testid="icon-AlertTriangle" className={className} />
	),
	RefreshCw: ({ size }: { size?: number }) => (
		<span data-testid="icon-RefreshCw" data-size={size} />
	),
}));

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
	if (shouldThrow) throw new Error("Test error message");
	return <div data-testid="child">Contenido normal</div>;
}

describe("ErrorBoundary", () => {
	let consoleError: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		consoleError.mockRestore();
	});

	describe("estado normal", () => {
		it("should_render_children_when_no_error", () => {
			render(
				<ErrorBoundary>
					<ThrowingChild shouldThrow={false} />
				</ErrorBoundary>,
			);
			expect(screen.getByTestId("child")).toBeInTheDocument();
		});

		it("should_not_show_fallback_ui_when_no_error", () => {
			render(
				<ErrorBoundary>
					<ThrowingChild shouldThrow={false} />
				</ErrorBoundary>,
			);
			expect(screen.queryByText("Algo salió mal")).not.toBeInTheDocument();
		});
	});

	describe("cuando ocurre un error", () => {
		it("should_show_default_fallback_ui_on_error", () => {
			render(
				<ErrorBoundary>
					<ThrowingChild shouldThrow={true} />
				</ErrorBoundary>,
			);
			expect(screen.getByText("Algo salió mal")).toBeInTheDocument();
		});

		it("should_display_error_message_in_pre_element", () => {
			render(
				<ErrorBoundary>
					<ThrowingChild shouldThrow={true} />
				</ErrorBoundary>,
			);
			expect(screen.getByText("Test error message")).toBeInTheDocument();
		});

		it("should_show_section_name_in_heading_when_provided", () => {
			render(
				<ErrorBoundary section="Calendario">
					<ThrowingChild shouldThrow={true} />
				</ErrorBoundary>,
			);
			expect(
				screen.getByText("Algo salió mal en Calendario"),
			).toBeInTheDocument();
		});

		it("should_not_append_section_to_heading_when_not_provided", () => {
			render(
				<ErrorBoundary>
					<ThrowingChild shouldThrow={true} />
				</ErrorBoundary>,
			);
			const heading = screen.getByText("Algo salió mal");
			expect(heading.textContent).toBe("Algo salió mal");
		});

		it("should_render_custom_fallback_when_provided", () => {
			render(
				<ErrorBoundary
					fallback={<div data-testid="custom-fallback">Mi fallback</div>}
				>
					<ThrowingChild shouldThrow={true} />
				</ErrorBoundary>,
			);
			expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
			expect(screen.queryByText("Algo salió mal")).not.toBeInTheDocument();
		});

		it("should_call_console_error_with_section_name", () => {
			render(
				<ErrorBoundary section="Tareas">
					<ThrowingChild shouldThrow={true} />
				</ErrorBoundary>,
			);
			expect(consoleError).toHaveBeenCalledWith(
				expect.stringContaining("Tareas"),
				expect.any(Error),
				expect.anything(),
			);
		});

		it("should_call_console_error_without_section_when_not_provided", () => {
			render(
				<ErrorBoundary>
					<ThrowingChild shouldThrow={true} />
				</ErrorBoundary>,
			);
			expect(consoleError).toHaveBeenCalledWith(
				"[ErrorBoundary]",
				expect.any(Error),
				expect.anything(),
			);
		});
	});

	describe("handleReset", () => {
		it("should_clear_error_state_and_render_children_after_reset", () => {
			// Start with throwing child to trigger error state
			const { rerender } = render(
				<ErrorBoundary>
					<ThrowingChild shouldThrow={true} />
				</ErrorBoundary>,
			);
			expect(screen.getByText("Algo salió mal")).toBeInTheDocument();

			// Swap to non-throwing child BEFORE clicking reset, so when
			// ErrorBoundary clears hasError the new child renders cleanly
			rerender(
				<ErrorBoundary>
					<ThrowingChild shouldThrow={false} />
				</ErrorBoundary>,
			);

			// Reset clears the error state; the non-throwing child renders
			fireEvent.click(screen.getByRole("button", { name: /Reintentar/i }));

			expect(screen.getByTestId("child")).toBeInTheDocument();
			expect(screen.queryByText("Algo salió mal")).not.toBeInTheDocument();
		});
	});
});
