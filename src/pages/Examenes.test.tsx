// --- Mocks top-level (antes de cualquier import) ---
import { vi } from "vitest";

vi.mock("../hooks/useAcademicCalendar", () => ({
	useAcademicCalendar: vi.fn(),
}));

vi.mock("../hooks/useSubjectData", () => ({
	useSubjectData: vi.fn(),
}));

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useAcademicCalendar } from "../hooks/useAcademicCalendar";
import type { EventsState } from "../hooks/useCalendarEvents";
import { useSubjectData } from "../hooks/useSubjectData";
import Examenes from "./Examenes";

// Datos de prueba reutilizables
const mockAcademicDates = {
	semesterStart: "2026-03-01",
	semesterEnd: "2026-07-31",
	examStart: "2026-07-01",
	examEnd: "2026-07-15",
	currentYear: 2026,
};

const mockSubjects = [
	{ id: "s1", name: "Matemáticas", credits: 6, semester: 1 },
	{ id: "s2", name: "Física", credits: 6, semester: 1 },
];

function setupHooks() {
	vi.mocked(useAcademicCalendar).mockReturnValue({
		academicDates: mockAcademicDates,
		updateAcademicDates: vi.fn(),
	} as any);

	vi.mocked(useSubjectData).mockReturnValue({
		allSubjects: mockSubjects,
		data: {},
		customSubjects: [],
		updateSubject: vi.fn(),
		addCustomSubject: vi.fn(),
		removeCustomSubject: vi.fn(),
		updateCustomSubject: vi.fn(),
		getApprovedCount: vi.fn(),
		getApprovedCredits: vi.fn(),
		getAverage: vi.fn(),
	} as any);
}

describe("Examenes", () => {
	let onUpdateCalendarEvents: ReturnType<typeof vi.fn> &
		((e: EventsState) => void);

	beforeEach(() => {
		setupHooks();
		onUpdateCalendarEvents = vi.fn() as unknown as ReturnType<typeof vi.fn> &
			((e: EventsState) => void);
	});

	// 1. Renderiza sin crash con calendarEvents vacío
	it("renderiza sin crash con calendarEvents vacío", () => {
		render(
			<Examenes
				calendarEvents={{}}
				onUpdateCalendarEvents={onUpdateCalendarEvents}
			/>,
		);
		expect(screen.getByText("Gestión de Exámenes")).toBeInTheDocument();
		expect(screen.getByText("No hay exámenes registrados")).toBeInTheDocument();
	});

	// 2. handleAddExam: no agrega si falta date o subject
	it("no agrega examen si falta la fecha", () => {
		render(
			<Examenes
				calendarEvents={{}}
				onUpdateCalendarEvents={onUpdateCalendarEvents}
			/>,
		);

		// Solo llenar subject, dejar date vacío
		const select = screen.getByRole("combobox");
		fireEvent.change(select, { target: { value: "Matemáticas" } });

		// El botón está deshabilitado cuando no hay date
		const btn = screen.getByRole("button", { name: /Registrar Examen/i });
		expect(btn).toBeDisabled();

		// Disparar submit del form directamente tampoco debe llamar onUpdate
		const form = btn.closest("form") as HTMLFormElement;
		fireEvent.submit(form);

		expect(onUpdateCalendarEvents).not.toHaveBeenCalled();
	});

	it("no agrega examen si falta la materia", () => {
		render(
			<Examenes
				calendarEvents={{}}
				onUpdateCalendarEvents={onUpdateCalendarEvents}
			/>,
		);

		const btn = screen.getByRole("button", { name: /Registrar Examen/i });
		const form = btn.closest("form") as HTMLFormElement;

		// Solo llenar date, dejar subject vacío
		const dateInput = form.querySelector(
			"input[type='date']",
		) as HTMLInputElement;
		fireEvent.change(dateInput, { target: { value: "2026-07-10" } });

		expect(btn).toBeDisabled();
		fireEvent.submit(form);

		expect(onUpdateCalendarEvents).not.toHaveBeenCalled();
	});

	// 3. handleAddExam: agrega examen correctamente
	it("agrega examen correctamente al llamar onUpdateCalendarEvents", () => {
		render(
			<Examenes
				calendarEvents={{}}
				onUpdateCalendarEvents={onUpdateCalendarEvents}
			/>,
		);

		// Usamos querySelector directo sobre el form
		const form = screen
			.getByRole("button", { name: /Registrar Examen/i })
			.closest("form") as HTMLFormElement;

		const dateInput = form.querySelector(
			"input[type='date']",
		) as HTMLInputElement;
		fireEvent.change(dateInput, { target: { value: "2026-07-10" } });

		// Seleccionar materia
		const select = form.querySelector("select") as HTMLSelectElement;
		fireEvent.change(select, { target: { value: "Matemáticas" } });

		// El botón debe habilitarse
		const btn = screen.getByRole("button", { name: /Registrar Examen/i });
		expect(btn).not.toBeDisabled();

		// Enviar formulario
		fireEvent.submit(form);

		expect(onUpdateCalendarEvents).toHaveBeenCalledOnce();
		const updated: EventsState = onUpdateCalendarEvents.mock.calls[0]![0]!;
		expect(updated["2026-07-10"]).toBeDefined();
		expect(updated["2026-07-10"]![0]!).toMatchObject({
			title: "Examen: Matemáticas",
			type: "examen",
			time: "09:00",
		});
	});

	// 4. handleRemoveExam: elimina el examen correcto
	it("elimina el examen correcto al hacer click en el botón de borrar", () => {
		const initialEvents: EventsState = {
			"2026-07-10": [
				{ title: "Examen: Matemáticas", type: "examen", time: "09:00" },
				{ title: "Examen: Física", type: "examen", time: "09:00" },
			],
		};

		render(
			<Examenes
				calendarEvents={initialEvents}
				onUpdateCalendarEvents={onUpdateCalendarEvents}
			/>,
		);

		// Deben renderizarse los dos exámenes (buscar en la sección de lista)
		const examList = document.querySelectorAll("section")[2] as HTMLElement;
		expect(examList.querySelector("p.text-white")).toBeInTheDocument();

		// Hacer click en el primer botón de borrar (Matemáticas, primer examen)
		const deleteButtons = examList.querySelectorAll("button");
		fireEvent.click(deleteButtons[0]!);

		expect(onUpdateCalendarEvents).toHaveBeenCalledOnce();
		const updated: EventsState = onUpdateCalendarEvents.mock.calls[0]![0]!;

		// Matemáticas debe haber sido eliminada
		const remaining = updated["2026-07-10"]!;
		expect(remaining).toHaveLength(1);
		expect(remaining[0]!.title).toBe("Examen: Física");
	});

	// 5. Lista exámenes ordenados por fecha
	it("muestra los exámenes ordenados por fecha", () => {
		const events: EventsState = {
			"2026-07-20": [
				{ title: "Examen: Física", type: "examen", time: "09:00" },
			],
			"2026-07-05": [
				{ title: "Examen: Matemáticas", type: "examen", time: "09:00" },
			],
			"2026-07-12": [
				{ title: "Examen: Programación", type: "examen", time: "09:00" },
			],
		};

		const { container } = render(
			<Examenes
				calendarEvents={events}
				onUpdateCalendarEvents={onUpdateCalendarEvents}
			/>,
		);

		// p.text-white.font-bold renderiza el título sin "Examen: "
		const items = container.querySelectorAll("p.text-white.font-bold");
		const titles = Array.from(items).map((el) => el.textContent?.trim());

		// Verificar que los 3 títulos están presentes ordenados por fecha
		expect(titles).toContain("Matemáticas"); // 2026-07-05
		expect(titles).toContain("Programación"); // 2026-07-12
		expect(titles).toContain("Física"); // 2026-07-20
		// El primero (fecha más temprana) debe ser Matemáticas
		expect(titles[0]).toBe("Matemáticas");
	});
});
