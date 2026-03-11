import type React from "react";
import { useState } from "react";
import "./Calendar2026.css";
import type { EventsState } from "../../hooks/useCalendarEvents";
import { CalendarEventModal } from "./CalendarEventModal";
import { MonthlyView, WeeklyView, YearlyView } from "./CalendarViews.tsx";

type ViewType = "yearly" | "monthly" | "weekly";

interface Calendar2026Props {
	events: EventsState;
	onUpdateEvents: (events: EventsState) => void;
}

const Calendar2026: React.FC<Calendar2026Props> = ({
	events,
	onUpdateEvents,
}) => {
	const [view, setView] = useState<ViewType>("yearly");
	const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
	const [weekOffset, setWeekOffset] = useState(0);

	// Modal state
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

	const handleDayClick = (dateKey: string) => {
		setSelectedDateKey(dateKey);
		setIsModalOpen(true);
	};

	const handleSaveEvent = (title: string) => {
		if (selectedDateKey) {
			const updated = {
				...events,
				[selectedDateKey]: [
					...(events[selectedDateKey] || []),
					{ title, time: "12:00" }, // Default time for now
				],
			};
			onUpdateEvents(updated);
		}
	};

	const getSelectedDate = () => {
		if (!selectedDateKey) return new Date();
		const [y, m, d] = selectedDateKey.split("-").map(Number);
		return new Date(y, m - 1, d);
	};

	return (
		<div className="calendar-container">
			<header className="calendar-header">
				<div className="calendar-logo">2026 CALENDAR</div>
				<div className="view-controls">
					<button
						className={`view-btn ${view === "yearly" ? "active" : ""}`}
						onClick={() => setView("yearly")}
					>
						Anual
					</button>
					<button
						className={`view-btn ${view === "monthly" ? "active" : ""}`}
						onClick={() => setView("monthly")}
					>
						Mensual
					</button>
					<button
						className={`view-btn ${view === "weekly" ? "active" : ""}`}
						onClick={() => setView("weekly")}
					>
						Semanal
					</button>
				</div>
				<div className="current-year-info">
					<span>
						{view === "yearly"
							? "Calendario 2026"
							: view === "monthly"
								? "Vista Mensual"
								: "Vista Semanal"}
					</span>
				</div>
			</header>

			<section className="calendar-content">
				{view === "yearly" && (
					<YearlyView year={2026} events={events} onDayClick={handleDayClick} />
				)}
				{view === "monthly" && (
					<MonthlyView
						year={2026}
						month={currentMonth}
						events={events}
						onMonthChange={setCurrentMonth}
						onDayClick={handleDayClick}
					/>
				)}
				{view === "weekly" && (
					<WeeklyView
						year={2026}
						offset={weekOffset}
						events={events}
						onOffsetChange={setWeekOffset}
						onDayClick={handleDayClick}
					/>
				)}
			</section>

			<CalendarEventModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onSave={handleSaveEvent}
				date={getSelectedDate()}
			/>
		</div>
	);
};

export default Calendar2026;
