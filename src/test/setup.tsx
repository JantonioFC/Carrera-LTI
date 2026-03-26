import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import type React from "react";
import { afterEach, vi } from "vitest";

afterEach(() => {
	cleanup();
});

// Dynamic mock for lucide-react — imports all actual exports and replaces each
// with a lightweight span so tests don't break when new icons are used.
vi.mock("lucide-react", async (importOriginal) => {
	const actual = await importOriginal<Record<string, unknown>>();
	const mockIcon = (name: string) => {
		const component = ({ className, ...props }: { className?: string }) => (
			<span data-testid={`icon-${name}`} className={className} {...props} />
		);
		component.displayName = name;
		return component;
	};
	return Object.fromEntries(
		Object.keys(actual).map((key) => [key, mockIcon(key)]),
	);
});

// Mock Recharts globally
vi.mock("recharts", () => {
	const mockComponent = ({ children }: { children: React.ReactNode }) =>
		children;
	return {
		ResponsiveContainer: mockComponent,
		AreaChart: mockComponent,
		BarChart: mockComponent,
		PieChart: mockComponent,
		Area: mockComponent,
		Bar: mockComponent,
		Pie: mockComponent,
		XAxis: mockComponent,
		YAxis: mockComponent,
		CartesianGrid: mockComponent,
		Tooltip: mockComponent,
		Cell: mockComponent,
		Legend: mockComponent,
	};
});
