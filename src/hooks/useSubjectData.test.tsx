import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { SubjectDataProvider, useSubjectData } from "./useSubjectData";
import React from "react";

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value.toString();
		},
		clear: () => {
			store = {};
		},
	};
})();

Object.defineProperty(window, "localStorage", {
	value: localStorageMock,
});

describe("useSubjectData", () => {
	beforeEach(() => {
		localStorageMock.clear();
		vi.clearAllMocks();
	});

	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<SubjectDataProvider>{children}</SubjectDataProvider>
	);

	it("should provide initial data from curriculum", () => {
		const { result } = renderHook(() => useSubjectData(), { wrapper });
		expect(result.current.allSubjects.length).toBeGreaterThan(0);
		expect(result.current.data).toEqual({});
	});

	it("should update subject status", () => {
		const { result } = renderHook(() => useSubjectData(), { wrapper });
		const subjectId = "s1-1";

		act(() => {
			result.current.updateSubject(subjectId, { status: "aprobada", grade: 10 });
		});

		expect(result.current.data[subjectId].status).toBe("aprobada");
		expect(result.current.data[subjectId].grade).toBe(10);
	});

	it("should calculate average correctly", () => {
		const { result } = renderHook(() => useSubjectData(), { wrapper });

		act(() => {
			result.current.updateSubject("s1-1", { status: "aprobada", grade: 10 });
			result.current.updateSubject("s1-2", { status: "aprobada", grade: 8 });
		});

		expect(result.current.getAverage()).toBe(9);
	});

	it("should handle custom subjects", () => {
		const { result } = renderHook(() => useSubjectData(), { wrapper });
		const customSubject = {
			id: "custom-1",
			name: "Test Subject",
			credits: 5,
			semester: 1,
			color: "#000",
			area: "Test",
			status: "pendiente" as const,
		};

		act(() => {
			result.current.addCustomSubject(customSubject);
		});

		expect(result.current.customSubjects).toContainEqual(customSubject);
		expect(result.current.allSubjects).toContainEqual(customSubject);
	});
});
