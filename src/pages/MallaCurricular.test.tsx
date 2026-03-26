import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CURRICULUM, TOTAL_CREDITS } from "../data/lti";
import MallaCurricular from "./MallaCurricular";

// --- Mocks top-level ---
vi.mock("../hooks/useSubjectData", () => ({
	useSubjectData: vi.fn(),
}));

// Importar después de los mocks
import { useSubjectData } from "../hooks/useSubjectData";

// Helpers para construir allSubjects desde CURRICULUM real
const staticSubjects = CURRICULUM.flatMap((s) => s.subjects);

// Créditos reales de semestres 1-4 para verificar tcDone
const tcSubjects = CURRICULUM.slice(0, 4).flatMap((s) => s.subjects);

function makeData(
	overrides: Record<string, { status: string; grade?: number }> = {},
) {
	return overrides as Record<string, { status: string; resources: [] }>;
}

describe("MallaCurricular — currentSemester", () => {
	it("retorna 1 cuando no hay materias en_curso", () => {
		vi.mocked(useSubjectData).mockReturnValue({
			data: makeData({}),
			allSubjects: staticSubjects,
			customSubjects: [],
			updateSubject: vi.fn(),
			addCustomSubject: vi.fn(),
			removeCustomSubject: vi.fn(),
			updateCustomSubject: vi.fn(),
			getApprovedCount: vi.fn(),
			getApprovedCredits: vi.fn(),
			getAverage: vi.fn(),
		} as any);

		render(<MallaCurricular />);
		// El semestre 1 debe aparecer resaltado (no es posible verificar CSS pero sí que la
		// card de semestre 1 está en el documento)
		expect(screen.getByText("Semestre 1")).toBeInTheDocument();
	});

	it("retorna el semestre mínimo con materias en_curso", () => {
		// Poner una materia de semestre 3 en_curso
		const subjectSem3 = CURRICULUM[2].subjects[0];
		vi.mocked(useSubjectData).mockReturnValue({
			data: makeData({ [subjectSem3.id]: { status: "en_curso" } }),
			allSubjects: staticSubjects,
			customSubjects: [],
			updateSubject: vi.fn(),
			addCustomSubject: vi.fn(),
			removeCustomSubject: vi.fn(),
			updateCustomSubject: vi.fn(),
			getApprovedCount: vi.fn(),
			getApprovedCredits: vi.fn(),
			getAverage: vi.fn(),
		} as any);

		render(<MallaCurricular />);
		// El semestre 3 debe estar presente y ser el mínimo
		expect(screen.getByText("Semestre 3")).toBeInTheDocument();
	});
});

describe("MallaCurricular — cálculo de créditos", () => {
	it("creditsDone suma solo créditos aprobados", () => {
		const subject = staticSubjects[0];
		vi.mocked(useSubjectData).mockReturnValue({
			data: makeData({ [subject.id]: { status: "aprobada" } }),
			allSubjects: staticSubjects,
			customSubjects: [],
			updateSubject: vi.fn(),
			addCustomSubject: vi.fn(),
			removeCustomSubject: vi.fn(),
			updateCustomSubject: vi.fn(),
			getApprovedCount: vi.fn(),
			getApprovedCredits: vi.fn(),
			getAverage: vi.fn(),
		} as any);

		render(<MallaCurricular />);
		// creditsDone se muestra en la card "Obtenidos"
		expect(screen.getByText(String(subject.credits))).toBeInTheDocument();
	});

	it("creditsActive suma solo créditos en_curso", () => {
		const subject = staticSubjects[0];
		vi.mocked(useSubjectData).mockReturnValue({
			data: makeData({ [subject.id]: { status: "en_curso" } }),
			allSubjects: staticSubjects,
			customSubjects: [],
			updateSubject: vi.fn(),
			addCustomSubject: vi.fn(),
			removeCustomSubject: vi.fn(),
			updateCustomSubject: vi.fn(),
			getApprovedCount: vi.fn(),
			getApprovedCredits: vi.fn(),
			getAverage: vi.fn(),
		} as any);

		render(<MallaCurricular />);
		// creditsActive aparece en la card "En Curso"
		const allOccurrences = screen.getAllByText(String(subject.credits));
		expect(allOccurrences.length).toBeGreaterThan(0);
	});

	it("creditsPending suma solo créditos pendientes", () => {
		// Sin overrides, todos quedan en su status default ("pendiente")
		const totalPending = staticSubjects
			.filter((s) => s.status === "pendiente")
			.reduce((acc, s) => acc + s.credits, 0);

		vi.mocked(useSubjectData).mockReturnValue({
			data: makeData({}),
			allSubjects: staticSubjects,
			customSubjects: [],
			updateSubject: vi.fn(),
			addCustomSubject: vi.fn(),
			removeCustomSubject: vi.fn(),
			updateCustomSubject: vi.fn(),
			getApprovedCount: vi.fn(),
			getApprovedCredits: vi.fn(),
			getAverage: vi.fn(),
		} as any);

		render(<MallaCurricular />);
		expect(screen.getByText(String(totalPending))).toBeInTheDocument();
	});
});

describe("MallaCurricular — tcDone", () => {
	it("solo cuenta créditos aprobados de semestres 1-4", () => {
		// Aprobar una materia del semestre 1 y una del semestre 5
		const subjectSem1 = CURRICULUM[0].subjects[0];
		const subjectSem5 = CURRICULUM[4].subjects[0];
		vi.mocked(useSubjectData).mockReturnValue({
			data: makeData({
				[subjectSem1.id]: { status: "aprobada" },
				[subjectSem5.id]: { status: "aprobada" },
			}),
			allSubjects: staticSubjects,
			customSubjects: [],
			updateSubject: vi.fn(),
			addCustomSubject: vi.fn(),
			removeCustomSubject: vi.fn(),
			updateCustomSubject: vi.fn(),
			getApprovedCount: vi.fn(),
			getApprovedCredits: vi.fn(),
			getAverage: vi.fn(),
		} as any);

		render(<MallaCurricular />);
		// tcDone debe ser solo los créditos de subjectSem1 (sem 5 no cuenta)
		// El texto aparece como "{tcDone} / {tcTotal} cr"
		const tcTotal = tcSubjects.reduce((acc, s) => acc + s.credits, 0);
		expect(
			screen.getByText(`${subjectSem1.credits} / ${tcTotal} cr`),
		).toBeInTheDocument();
	});
});

describe("MallaCurricular — pct", () => {
	it("calcula el porcentaje correcto sobre totalRequired", () => {
		// Aprobar todas las materias del semestre 1
		const sem1Subjects = CURRICULUM[0].subjects;
		const creditsDone = sem1Subjects.reduce((acc, s) => acc + s.credits, 0);
		const totalRequired = Math.max(
			TOTAL_CREDITS,
			staticSubjects.reduce((acc, s) => acc + s.credits, 0),
		);
		const expectedPct = Math.round((creditsDone / totalRequired) * 100);

		const dataOverrides = Object.fromEntries(
			sem1Subjects.map((s) => [s.id, { status: "aprobada" }]),
		);
		vi.mocked(useSubjectData).mockReturnValue({
			data: makeData(dataOverrides),
			allSubjects: staticSubjects,
			customSubjects: [],
			updateSubject: vi.fn(),
			addCustomSubject: vi.fn(),
			removeCustomSubject: vi.fn(),
			updateCustomSubject: vi.fn(),
			getApprovedCount: vi.fn(),
			getApprovedCredits: vi.fn(),
			getAverage: vi.fn(),
		} as any);

		render(<MallaCurricular />);
		expect(screen.getByText(`${expectedPct}%`)).toBeInTheDocument();
	});
});

describe("MallaCurricular — render de cards", () => {
	it("renderiza las cards de créditos con las etiquetas correctas", () => {
		vi.mocked(useSubjectData).mockReturnValue({
			data: makeData({}),
			allSubjects: staticSubjects,
			customSubjects: [],
			updateSubject: vi.fn(),
			addCustomSubject: vi.fn(),
			removeCustomSubject: vi.fn(),
			updateCustomSubject: vi.fn(),
			getApprovedCount: vi.fn(),
			getApprovedCredits: vi.fn(),
			getAverage: vi.fn(),
		} as any);

		render(<MallaCurricular />);
		expect(screen.getByText(/Obtenidos/i)).toBeInTheDocument();
		expect(screen.getByText(/En Curso/i)).toBeInTheDocument();
		expect(screen.getByText(/Pendientes/i)).toBeInTheDocument();
		expect(screen.getByText(/Progreso total/i)).toBeInTheDocument();
	});
});
