import { useState } from "react";
import { DEFAULT_ACADEMIC_DATES } from "../data/lti";
import { safeParseJSON } from "../utils/safeStorage";

export interface AcademicDates {
	semesterStart: string;
	semesterEnd: string;
	examStart: string;
	examEnd: string;
	currentYear: number;
}

export function useAcademicCalendar() {
	const [academicDates, setAcademicDates] = useState<AcademicDates>(() => {
		return safeParseJSON<AcademicDates>(
			"lti_academic_dates",
			DEFAULT_ACADEMIC_DATES,
		);
	});

	const updateAcademicDates = (newDates: Partial<AcademicDates>) => {
		const updated = { ...academicDates, ...newDates };
		setAcademicDates(updated);
		localStorage.setItem("lti_academic_dates", JSON.stringify(updated));
	};

	return {
		academicDates,
		updateAcademicDates,
	};
}
