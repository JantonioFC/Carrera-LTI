import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CalendarEvent } from "./useCalendarEvents";
import { useCalendarEvents } from "./useCalendarEvents";

const STORAGE_KEY = "cal2026_events";

const makeEvent = (title: string): CalendarEvent => ({
	title,
	time: "10:00",
	type: "class",
	topic: "Math",
});

describe("useCalendarEvents", () => {
	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
	});

	it("initial state is empty when localStorage is empty", () => {
		const { result } = renderHook(() => useCalendarEvents());
		expect(result.current.events).toEqual({});
	});

	it("loads initial state from localStorage", () => {
		const stored = {
			"2026-03-10": [makeEvent("Existing event")],
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

		const { result } = renderHook(() => useCalendarEvents());
		expect(result.current.events).toEqual(stored);
	});

	it("saveEvent adds event to the correct dateKey", () => {
		const { result } = renderHook(() => useCalendarEvents());
		const event = makeEvent("New event");

		act(() => {
			result.current.saveEvent("2026-03-15", event);
		});

		expect(result.current.events["2026-03-15"]).toHaveLength(1);
		expect(result.current.events["2026-03-15"][0]).toEqual(event);
	});

	it("saveEvent appends when dateKey already has events", () => {
		const first = makeEvent("First event");
		const second = makeEvent("Second event");
		const stored = { "2026-03-15": [first] };
		localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

		const { result } = renderHook(() => useCalendarEvents());

		act(() => {
			result.current.saveEvent("2026-03-15", second);
		});

		expect(result.current.events["2026-03-15"]).toHaveLength(2);
		expect(result.current.events["2026-03-15"][0]).toEqual(first);
		expect(result.current.events["2026-03-15"][1]).toEqual(second);
	});

	it("saveEvent persists to localStorage", () => {
		const { result } = renderHook(() => useCalendarEvents());
		const event = makeEvent("Persisted event");

		act(() => {
			result.current.saveEvent("2026-04-01", event);
		});

		const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
		expect(stored["2026-04-01"]).toHaveLength(1);
		expect(stored["2026-04-01"][0]).toEqual(event);
	});

	it("deleteEvent removes event at given index", () => {
		const first = makeEvent("First");
		const second = makeEvent("Second");
		const stored = { "2026-03-20": [first, second] };
		localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

		const { result } = renderHook(() => useCalendarEvents());

		act(() => {
			result.current.deleteEvent("2026-03-20", 0);
		});

		expect(result.current.events["2026-03-20"]).toHaveLength(1);
		expect(result.current.events["2026-03-20"][0]).toEqual(second);
	});

	it("deleteEvent removes dateKey when no events remain", () => {
		const event = makeEvent("Only event");
		const stored = { "2026-03-20": [event] };
		localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

		const { result } = renderHook(() => useCalendarEvents());

		act(() => {
			result.current.deleteEvent("2026-03-20", 0);
		});

		expect(result.current.events["2026-03-20"]).toBeUndefined();
		expect(Object.keys(result.current.events)).not.toContain("2026-03-20");
	});

	it("deleteEvent persists updated state to localStorage", () => {
		const first = makeEvent("First");
		const second = makeEvent("Second");
		const stored = { "2026-03-20": [first, second] };
		localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

		const { result } = renderHook(() => useCalendarEvents());

		act(() => {
			result.current.deleteEvent("2026-03-20", 1);
		});

		const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
		expect(persisted["2026-03-20"]).toHaveLength(1);
		expect(persisted["2026-03-20"][0]).toEqual(first);
	});
});
