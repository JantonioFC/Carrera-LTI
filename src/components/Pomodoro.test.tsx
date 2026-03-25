import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Pomodoro from "./Pomodoro";

vi.mock("lucide-react", () => ({
	BrainCircuit: ({ size }: { size?: number }) => (
		<span data-testid="icon-BrainCircuit" data-size={size} />
	),
	Coffee: ({ size }: { size?: number }) => (
		<span data-testid="icon-Coffee" data-size={size} />
	),
	Pause: ({ size }: { size?: number }) => (
		<span data-testid="icon-Pause" data-size={size} />
	),
	Play: ({ size }: { size?: number }) => (
		<span data-testid="icon-Play" data-size={size} />
	),
	RotateCcw: ({ size }: { size?: number }) => (
		<span data-testid="icon-RotateCcw" data-size={size} />
	),
}));

describe("Pomodoro", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("estado cerrado", () => {
		it("should_show_toggle_button_when_closed", () => {
			render(<Pomodoro />);
			expect(screen.getByTestId("icon-BrainCircuit")).toBeInTheDocument();
		});

		it("should_not_show_timer_display_when_closed", () => {
			render(<Pomodoro />);
			expect(screen.queryByText("25:00")).not.toBeInTheDocument();
		});

		it("should_open_panel_on_button_click", () => {
			render(<Pomodoro />);
			const btn = screen.getByRole("button");
			fireEvent.click(btn);
			expect(screen.getByText("25:00")).toBeInTheDocument();
		});
	});

	describe("panel abierto", () => {
		function renderOpen() {
			render(<Pomodoro />);
			fireEvent.click(screen.getByRole("button"));
		}

		it("should_show_25_00_as_initial_focus_time", () => {
			renderOpen();
			expect(screen.getByText("25:00")).toBeInTheDocument();
		});

		it("should_show_focus_and_break_mode_buttons", () => {
			renderOpen();
			expect(
				screen.getByRole("button", { name: /Concentración/i }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: /Descanso/i }),
			).toBeInTheDocument();
		});

		it("should_switch_to_break_mode_and_show_5_00", () => {
			renderOpen();
			fireEvent.click(screen.getByRole("button", { name: /Descanso/i }));
			expect(screen.getByText("05:00")).toBeInTheDocument();
		});

		it("should_switch_back_to_focus_mode_and_show_25_00", () => {
			renderOpen();
			fireEvent.click(screen.getByRole("button", { name: /Descanso/i }));
			fireEvent.click(screen.getByRole("button", { name: /Concentración/i }));
			expect(screen.getByText("25:00")).toBeInTheDocument();
		});

		it("should_close_panel_on_x_button_click", () => {
			renderOpen();
			fireEvent.click(screen.getByRole("button", { name: "×" }));
			expect(screen.queryByText("25:00")).not.toBeInTheDocument();
		});

		it("should_start_countdown_when_play_is_clicked", () => {
			renderOpen();
			// Click play (the large round button — shows Play icon)
			const playBtn = screen.getByTestId("icon-Play").closest("button")!;
			fireEvent.click(playBtn);
			// Advance 3 seconds
			act(() => {
				vi.advanceTimersByTime(3000);
			});
			expect(screen.getByText("24:57")).toBeInTheDocument();
		});

		it("should_pause_timer_when_pause_is_clicked", () => {
			renderOpen();
			const playBtn = screen.getByTestId("icon-Play").closest("button")!;
			fireEvent.click(playBtn); // start
			act(() => {
				vi.advanceTimersByTime(2000);
			});
			// Should show Pause icon now
			const pauseBtn = screen.getByTestId("icon-Pause").closest("button")!;
			fireEvent.click(pauseBtn); // pause
			const timeBefore = screen.getByText(/\d{2}:\d{2}/).textContent;
			act(() => {
				vi.advanceTimersByTime(3000);
			});
			expect(screen.getByText(/\d{2}:\d{2}/).textContent).toBe(timeBefore);
		});

		it("should_reset_timer_to_25_00_on_reset_click", () => {
			renderOpen();
			const playBtn = screen.getByTestId("icon-Play").closest("button")!;
			fireEvent.click(playBtn);
			act(() => {
				vi.advanceTimersByTime(5000);
			});
			const resetBtn = screen.getByTitle("Reiniciar");
			fireEvent.click(resetBtn);
			expect(screen.getByText("25:00")).toBeInTheDocument();
		});
	});
});
