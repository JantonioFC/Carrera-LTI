import type React from "react";
import { useState } from "react";
import "./Calendar2026.css";
import type { EventsState } from "../../hooks/useCalendarEvents";
import { CalendarEventModal } from "./CalendarEventModal";
import { MonthlyView, WeeklyView, YearlyView } from "./CalendarViews.tsx";

type ViewType = "yearly" | "monthly" | "weekly";

interface ResponsiveCalendarProps {
	events: EventsState;
	onUpdateEvents: (events: EventsState) => void;
}

const ResponsiveCalendar: React.FC<ResponsiveCalendarProps> = ({
	events,
	onUpdateEvents,
}) => {
	const [view, setView] = useState<ViewType>("yearly");
	const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
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
				<div className="year-nav">
					<button className="nav-btn" onClick={() => setCurrentYear(currentYear - 1)}>
						‹
					</button>
					<div className="calendar-logo">CALENDAR</div>
					<button className="nav-btn" onClick={() => setCurrentYear(currentYear + 1)}>
						›
					</button>
				</div>
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
							? `Calendario ${currentYear}`
							: view === "monthly"
								? "Vista Mensual"
								: "Vista Semanal"}
					</span>
				</div>
			</header>

			<section className="calendar-content">
				{view === "yearly" && (
					<YearlyView year={currentYear} events={events} onDayClick={handleDayClick} />
				)}
				{view === "monthly" && (
					<MonthlyView
						year={currentYear}
						month={currentMonth}
						events={events}
						onMonthChange={setCurrentMonth}
						onDayClick={handleDayClick}
					/>
				)}
				{view === "weekly" && (
					<WeeklyView
						year={currentYear}
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

export default ResponsiveCalendar;
