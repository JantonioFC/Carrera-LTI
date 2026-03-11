import { useState } from "react";

export interface CalendarEvent {
	title: string;
	time: string;
}

export interface EventsState {
	[dateKey: string]: CalendarEvent[];
}

export const useCalendarEvents = () => {
	const [events, setEvents] = useState<EventsState>(() => {
		const saved = localStorage.getItem("cal2026_events");
		return saved ? JSON.parse(saved) : {};
	});

	const saveEvent = (dateKey: string, event: CalendarEvent) => {
		const updated = {
			...events,
			[dateKey]: [...(events[dateKey] || []), event],
		};
		setEvents(updated);
		localStorage.setItem("cal2026_events", JSON.stringify(updated));
	};

	const deleteEvent = (dateKey: string, index: number) => {
		const dayEvents = [...(events[dateKey] || [])];
		dayEvents.splice(index, 1);

		const updated = { ...events };
		if (dayEvents.length === 0) {
			delete updated[dateKey];
		} else {
			updated[dateKey] = dayEvents;
		}

		setEvents(updated);
		localStorage.setItem("cal2026_events", JSON.stringify(updated));
	};

	return { events, saveEvent, deleteEvent };
};
