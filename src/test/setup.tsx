import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import type React from "react";
import { afterEach, vi } from "vitest";

afterEach(() => {
	cleanup();
});

// Simplified mock for lucide-react that supports props (specifically className)
vi.mock("lucide-react", () => {
	const mockIcon = (name: string) => {
		const component = ({ className, ...props }: { className?: string }) => (
			<span data-testid={`icon-${name}`} className={className} {...props} />
		);
		component.displayName = name;
		return component;
	};

	return {
		AlertCircle: mockIcon("AlertCircle"),
		ExternalLink: mockIcon("ExternalLink"),
		History: mockIcon("History"),
		Layers: mockIcon("Layers"),
		FolderRoot: mockIcon("FolderRoot"),
		Loader2: mockIcon("Loader2"),
	};
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
