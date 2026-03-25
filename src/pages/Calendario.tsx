import type React from "react";
import ResponsiveCalendar from "../components/calendar/ResponsiveCalendar";
import type { PresencialEvent } from "../data/lti";
import type { CalendarEventsMap } from "../utils/schemas";

interface CalendarioProps {
	presenciales: PresencialEvent[];
	onUpdatePresenciales: (p: PresencialEvent[]) => void;
	calendarEvents: CalendarEventsMap;
	onUpdateCalendarEvents: (e: CalendarEventsMap) => void;
}

const Calendario: React.FC<CalendarioProps> = ({
	calendarEvents,
	onUpdateCalendarEvents,
}) => {
	return (
		<div className="h-full p-4 md:p-6 overflow-hidden">
			<ResponsiveCalendar
				events={calendarEvents}
				onUpdateEvents={onUpdateCalendarEvents}
			/>
		</div>
	);
};

export default Calendario;
