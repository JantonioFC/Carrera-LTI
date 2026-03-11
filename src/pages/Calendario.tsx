import type React from "react";
import Calendar2026 from "../components/calendar/Calendar2026";
import type { PresencialEvent } from "../data/lti";

interface CalendarioProps {
	presenciales: PresencialEvent[];
	onUpdatePresenciales: (p: PresencialEvent[]) => void;
	calendarEvents: Record<string, any[]>;
	onUpdateCalendarEvents: (e: Record<string, any[]>) => void;
}

const Calendario: React.FC<CalendarioProps> = ({
	calendarEvents,
	onUpdateCalendarEvents,
}) => {
	return (
		<div className="h-full p-4 md:p-6 overflow-hidden">
			<Calendar2026
				events={calendarEvents}
				onUpdateEvents={onUpdateCalendarEvents}
			/>
		</div>
	);
};

export default Calendario;
