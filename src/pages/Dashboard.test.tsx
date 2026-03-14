import { describe, expect, it, vi } from "vitest";
import { render, screen } from "../test/test-utils";
import Dashboard from "./Dashboard";

// Mock sub-components for isolation
vi.mock("../components/dashboard/DashboardSummary", () => ({
	DashboardSummary: () => <div data-testid="dashboard-summary">Summary</div>,
}));
vi.mock("../components/dashboard/PresencialesList", () => ({
	PresencialesList: () => (
		<div data-testid="presenciales-list">Presenciales</div>
	),
}));
vi.mock("../components/dashboard/SemesterSubjects", () => ({
	SemesterSubjects: () => <div data-testid="semester-subjects">Subjects</div>,
}));
vi.mock("../components/dashboard/AnalyticsCharts", () => ({
	AnalyticsCharts: () => <div data-testid="analytics-charts">Analytics</div>,
}));
vi.mock("../components/dashboard/EditPresencialModal", () => ({
	EditPresencialModal: () => <div data-testid="edit-modal">Modal</div>,
}));

describe("Dashboard Page", () => {
	const mockPresenciales: any[] = [];
	const mockOnUpdate = vi.fn();

	it("renders main dashboard header", () => {
		render(
			<Dashboard
				presenciales={mockPresenciales}
				onUpdatePresenciales={mockOnUpdate}
			/>,
		);

		expect(screen.getByText("Dashboard")).toBeInTheDocument();
	});

	it("shows the 'Añadir Instancia' button", () => {
		render(
			<Dashboard
				presenciales={mockPresenciales}
				onUpdatePresenciales={mockOnUpdate}
			/>,
		);

		expect(screen.getByText("Añadir Instancia")).toBeInTheDocument();
	});

	it("renders Semester 1 subjects", () => {
		render(
			<Dashboard
				presenciales={mockPresenciales}
				onUpdatePresenciales={mockOnUpdate}
			/>,
		);

		expect(screen.getByTestId("semester-subjects")).toBeInTheDocument();
	});
});
