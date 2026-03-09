import type { PresencialEvent } from "../data/lti";

export function downloadICS(
	events: PresencialEvent[],
	filename: string = "carrera-lti-presenciales.ics",
) {
	let icsContent =
		[
			"BEGIN:VCALENDAR",
			"VERSION:2.0",
			"PRODID:-//URU/IA.LABS//Carrera LTI//ES",
			"CALSCALE:GREGORIAN",
			"METHOD:PUBLISH",
		].join("\n") + "\n";

	events.forEach((event) => {
		// Convert YYYY-MM-DD to YYYYMMDD
		const dateStr = event.date.replace(/-/g, "");

		// Asumimos eventos de todo el día para simplificar, o del día específico
		// pero con el horario en la descripción
		icsContent +=
			[
				"BEGIN:VEVENT",
				`UID:${event.id}@carrera-lti`,
				`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
				`DTSTART;VALUE=DATE:${dateStr}`,
				// DTEND for all-day is exclusive, so it should be the next day
				`DTEND;VALUE=DATE:${getTomorrowDateStr(event.date)}`,
				`SUMMARY:Instancia Presencial UTEC: ${event.activity}`,
				`DESCRIPTION:Sede: ${event.sede}\\nHorario: ${event.hours}${event.includesEval ? "\\n¡Incluye evaluación final!" : ""}`,
				`LOCATION:UTEC Sede ${event.sede}`,
				"END:VEVENT",
			].join("\n") + "\n";
	});

	icsContent += "END:VCALENDAR";

	// Trigger download
	const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

// Helper to get next day in YYYYMMDD for all-day event DTEND
function getTomorrowDateStr(dateString: string): string {
	const d = new Date(dateString + "T12:00:00");
	d.setDate(d.getDate() + 1);
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${year}${month}${day}`;
}
