import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import type React from "react";
import { afterEach, vi } from "vitest";

afterEach(() => {
	cleanup();
});

// Mock lucide-react globally using a Proxy
vi.mock("lucide-react", () => {
	return new Proxy(
		{},
		{
			get: (_target, prop) => {
				return ({ className }: { className?: string }) => (
					<span data-testid={`icon-${String(prop)}`} className={className} />
				);
			},
		},
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
