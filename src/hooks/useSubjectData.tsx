import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { CURRICULUM, type Subject, type SubjectStatus } from "../data/lti";
import { safeParseJSON } from "../utils/safeStorage";

export interface SubjectResource {
	id: string;
	name: string;
	url: string;
	type: "link" | "drive" | "github" | "video" | "pdf";
}

export interface SubjectData {
	status: SubjectStatus;
	grade?: number;
	resources: SubjectResource[];
}

export type SubjectDataMap = Record<string, SubjectData>;

interface SubjectDataContextType {
	data: SubjectDataMap;
	customSubjects: Subject[];
	allSubjects: Subject[];
	updateSubject: (id: string, partialData: Partial<SubjectData>) => void;
	addCustomSubject: (s: Subject) => void;
	removeCustomSubject: (id: string) => void;
	updateCustomSubject: (id: string, updates: Partial<Subject>) => void;
	getApprovedCount: () => number;
	getApprovedCredits: () => number;
	getAverage: () => number;
}

const SubjectDataContext = createContext<SubjectDataContextType | undefined>(
	undefined,
);

export function SubjectDataProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [data, setData] = useState<SubjectDataMap>(() => {
		return safeParseJSON<SubjectDataMap>("lti_subject_data", {});
	});

	const [customSubjects, setCustomSubjects] = useState<Subject[]>(() => {
		return safeParseJSON<Subject[]>("lti_custom_subjects", []);
	});

	const allSubjects = useMemo(() => {
		const staticSubjects = CURRICULUM.flatMap((s) => s.subjects);
		return [...staticSubjects, ...customSubjects];
	}, [customSubjects]);

	useEffect(() => {
		localStorage.setItem("lti_subject_data", JSON.stringify(data));
	}, [data]);

	useEffect(() => {
		localStorage.setItem("lti_custom_subjects", JSON.stringify(customSubjects));
	}, [customSubjects]);

	const updateSubject = (id: string, partialData: Partial<SubjectData>) => {
		setData((prev) => {
			const existing = prev[id] || { status: "pendiente", resources: [] };
			return {
				...prev,
				[id]: { ...existing, ...partialData },
			};
		});
	};

	const addCustomSubject = (s: Subject) => {
		setCustomSubjects((prev) => [...prev, s]);
	};

	const removeCustomSubject = (id: string) => {
		setCustomSubjects((prev) => prev.filter((s) => s.id !== id));
		// Clean up data for this subject if any
		setData((prev) => {
			const { [id]: _, ...rest } = prev;
			return rest;
		});
	};

	const updateCustomSubject = (id: string, updates: Partial<Subject>) => {
		const newCustom = customSubjects.map((s) =>
			s.id === id ? { ...s, ...updates } : s,
		);
		setCustomSubjects(newCustom);
		localStorage.setItem("lti_custom_subjects", JSON.stringify(newCustom));
	};

	const getAverage = () => {
		const approved = Object.entries(data).filter(
			([_, d]) => d.status === "aprobada" && d.grade !== undefined,
		);
		if (approved.length === 0) return 0;
		const sum = approved.reduce((acc, [_, curr]) => acc + (curr.grade || 0), 0);
		return Math.round((sum / approved.length) * 10) / 10;
	};

	const getApprovedCredits = () => {
		return Object.entries(data).reduce((acc, [id, d]) => {
			if (d.status !== "aprobada") return acc;
			const subject = allSubjects.find((s) => s.id === id);
			return acc + (subject?.credits || 0);
		}, 0);
	};

	const getApprovedCount = () => {
		return Object.values(data).filter((d) => d.status === "aprobada").length;
	};

	return (
		<SubjectDataContext.Provider
			value={{
				data,
				customSubjects,
				allSubjects,
				updateSubject,
				addCustomSubject,
				removeCustomSubject,
				updateCustomSubject,
				getApprovedCount,
				getApprovedCredits,
				getAverage,
			}}
		>
			{children}
		</SubjectDataContext.Provider>
	);
}

export function useSubjectData() {
	const ctx = useContext(SubjectDataContext);
	if (!ctx)
		throw new Error("useSubjectData must be used within SubjectDataProvider");
	return ctx;
}
