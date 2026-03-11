import type React from "react";
import type { EventsState } from "../../hooks/useCalendarEvents";

const MONTH_NAMES = [
	"Enero",
	"Febrero",
	"Marzo",
	"Abril",
	"Mayo",
	"Junio",
	"Julio",
	"Agosto",
	"Septiembre",
	"Octubre",
	"Noviembre",
	"Diciembre",
];

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

interface ViewProps {
	year: number;
	events: EventsState;
	onDayClick: (dateKey: string) => void;
}

export const YearlyView: React.FC<ViewProps> = ({
	year,
	events,
	onDayClick,
}) => {
	return (
		<div className="year-grid">
			{MONTH_NAMES.map((name, index) => (
				<MonthCard
					key={name}
					year={year}
					month={index}
					events={events}
					onDayClick={onDayClick}
				/>
			))}
		</div>
	);
};

const MonthCard: React.FC<{
	year: number;
	month: number;
	events: EventsState;
	onDayClick: (dateKey: string) => void;
}> = ({ year, month, events, onDayClick }) => {
	const days = getDaysInMonth(year, month);
	const offset = getMonthOffset(year, month);

	return (
		<div className="month-card">
			<div className="month-name">{MONTH_NAMES[month]}</div>
			<div className="days-grid">
				{DAY_LABELS.map((l, idx) => (
					<div key={`${l}-${idx}`} className="day-label">
						{l}
					</div>
				))}
				{Array.from({ length: offset }).map((_, i) => (
					<div key={`off-${i}`} />
				))}
				{Array.from({ length: days }).map((_, i) => {
					const d = i + 1;
					const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
					const isToday =
						new Date().toDateString() ===
						new Date(year, month, d).toDateString();
					return (
						<div
							key={d}
							className={`day-cell ${events[dateKey] ? "has-event" : ""} ${isToday ? "today" : ""}`}
							onClick={() => onDayClick(dateKey)}
						>
							{d}
						</div>
					);
				})}
			</div>
		</div>
	);
};

export const MonthlyView: React.FC<
	ViewProps & { month: number; onMonthChange: (m: number) => void }
> = ({ year, month, events, onMonthChange, onDayClick }) => {
	const days = getDaysInMonth(year, month);
	const offset = getMonthOffset(year, month);

	return (
		<div className="month-view-focus">
			<div className="month-view-header">
				<button
					className="nav-btn"
					onClick={() => onMonthChange((month - 1 + 12) % 12)}
				>
					‹
				</button>
				<div className="month-view-title">
					{MONTH_NAMES[month]} {year}
				</div>
				<button
					className="nav-btn"
					onClick={() => onMonthChange((month + 1) % 12)}
				>
					›
				</button>
			</div>
			<div className="large-grid">
				{DAY_LABELS.map((l, idx) => (
					<div key={`${l}-${idx}`} className="day-label">
						{l}
					</div>
				))}
				{Array.from({ length: offset }).map((_, i) => (
					<div key={`off-${i}`} className="large-day-cell other-month" />
				))}
				{Array.from({ length: days }).map((_, i) => {
					const d = i + 1;
					const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
					const isToday =
						new Date().toDateString() ===
						new Date(year, month, d).toDateString();
					return (
						<div
							key={d}
							className={`large-day-cell ${events[dateKey] ? "has-event" : ""} ${isToday ? "today" : ""}`}
							onClick={() => onDayClick(dateKey)}
						>
							<div className="day-number">{d}</div>
							{events[dateKey]?.map((ev, idx) => (
								<div key={idx} className="event-chip">
									<strong>{ev.title}</strong>
								</div>
							))}
						</div>
					);
				})}
			</div>
		</div>
	);
};

export const WeeklyView: React.FC<
	ViewProps & { offset: number; onOffsetChange: (o: number) => void }
> = ({ year, events, offset, onOffsetChange, onDayClick }) => {
	const today = new Date();
	today.setDate(today.getDate() + offset * 7);
	const day = today.getDay();
	const diff = today.getDate() - day + (day === 0 ? -6 : 1);
	const monday = new Date(today.getFullYear(), today.getMonth(), diff);

	const weekDays = Array.from({ length: 7 }).map((_, i) => {
		const d = new Date(monday);
		d.setDate(monday.getDate() + i);
		return d;
	});

	return (
		<div className="weekly-view-focus">
			<div className="month-view-header">
				<button className="nav-btn" onClick={() => onOffsetChange(offset - 1)}>
					‹
				</button>
				<div className="month-view-title">
					Semana del {monday.getDate()} de {MONTH_NAMES[monday.getMonth()]}{" "}
					{year}
				</div>
				<button className="nav-btn" onClick={() => onOffsetChange(offset + 1)}>
					›
				</button>
			</div>
			<div className="large-grid">
				{DAY_LABELS.map((l, idx) => (
					<div key={`${l}-${idx}`} className="day-label">
						{l}
					</div>
				))}
				{weekDays.map((d, i) => {
					const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
					const isToday = new Date().toDateString() === d.toDateString();
					return (
						<div
							key={i}
							className={`large-day-cell ${events[dateKey] ? "has-event" : ""} ${isToday ? "today" : ""}`}
							onClick={() => onDayClick(dateKey)}
						>
							<div className="day-number">{d.getDate()}</div>
							<div style={{ fontSize: "0.7rem", opacity: 0.6 }}>
								{MONTH_NAMES[d.getMonth()]}
							</div>
							{events[dateKey]?.map((ev, idx) => (
								<div key={idx} className="event-chip">
									<strong>{ev.title}</strong>
								</div>
							))}
						</div>
					);
				})}
			</div>
		</div>
	);
};

// Helpers
function getDaysInMonth(year: number, month: number) {
	return new Date(year, month + 1, 0).getDate();
}

function getMonthOffset(year: number, month: number) {
	const firstDay = new Date(year, month, 1).getDay();
	return firstDay === 0 ? 6 : firstDay - 1;
}
