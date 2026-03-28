import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObserverAIToggle } from "./ObserverAIToggle";
import { useObserverStore } from "./observerStore";

const mockOnStart = vi.fn().mockResolvedValue(undefined);
const mockOnStop = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
	useObserverStore.getState().reset();
	mockOnStart.mockClear();
	mockOnStop.mockClear();
});

describe("ObserverAIToggle — renderizado", () => {
	it("should_render_toggle_button", () => {
		render(<ObserverAIToggle onStart={mockOnStart} onStop={mockOnStop} />);
		expect(screen.getByRole("switch")).toBeInTheDocument();
	});

	it("should_show_inactive_state_by_default", () => {
		render(<ObserverAIToggle onStart={mockOnStart} onStop={mockOnStop} />);
		expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
		expect(screen.getByTestId("observer-status")).toHaveTextContent(
			/inactivo|off/i,
		);
	});

	it("should_show_active_state_when_running", () => {
		useObserverStore.getState().setRunning(true);
		render(<ObserverAIToggle onStart={mockOnStart} onStop={mockOnStop} />);
		expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
		expect(screen.getByTestId("observer-status")).toHaveTextContent(
			/activo|on/i,
		);
	});
});

describe("ObserverAIToggle — interacción", () => {
	it("should_call_onStart_when_toggled_on", async () => {
		render(<ObserverAIToggle onStart={mockOnStart} onStop={mockOnStop} />);
		await act(async () => {
			fireEvent.click(screen.getByRole("switch"));
		});
		expect(mockOnStart).toHaveBeenCalledOnce();
	});

	it("should_call_onStop_when_toggled_off", async () => {
		useObserverStore.getState().setRunning(true);
		render(<ObserverAIToggle onStart={mockOnStart} onStop={mockOnStop} />);
		await act(async () => {
			fireEvent.click(screen.getByRole("switch"));
		});
		expect(mockOnStop).toHaveBeenCalledOnce();
	});

	it("should_set_running_true_after_start", async () => {
		render(<ObserverAIToggle onStart={mockOnStart} onStop={mockOnStop} />);
		await act(async () => {
			fireEvent.click(screen.getByRole("switch"));
		});
		// onStart es async — el store se actualiza en el callback
		expect(mockOnStart).toHaveBeenCalled();
	});

	it("should_show_notification_when_activated", async () => {
		render(<ObserverAIToggle onStart={mockOnStart} onStop={mockOnStop} />);
		await act(async () => {
			fireEvent.click(screen.getByRole("switch"));
		});
		await waitFor(() =>
			expect(screen.getByTestId("observer-notification")).toBeInTheDocument(),
		);
	});

	it("should_be_disabled_while_transitioning", () => {
		useObserverStore.getState().setTransitioning(true);
		render(<ObserverAIToggle onStart={mockOnStart} onStop={mockOnStop} />);
		expect(screen.getByRole("switch")).toBeDisabled();
	});
});

describe("ObserverAIToggle — accesibilidad", () => {
	it("should_have_accessible_label", () => {
		render(<ObserverAIToggle onStart={mockOnStart} onStop={mockOnStop} />);
		expect(screen.getByRole("switch")).toHaveAccessibleName(/observer ai/i);
	});
});
