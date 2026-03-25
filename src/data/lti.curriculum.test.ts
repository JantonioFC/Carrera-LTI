import { describe, expect, it } from "vitest";
import {
	AREA_COLORS,
	CURRICULUM,
	DEFAULT_PRESENCIALES,
} from "./lti.curriculum";

// -----------------------------------------------------------------------
// CURRICULUM — estructura general
// -----------------------------------------------------------------------
describe("CURRICULUM — estructura general", () => {
	it("tiene exactamente 8 semestres", () => {
		expect(CURRICULUM).toHaveLength(8);
	});

	it("cada semestre tiene number, label y subjects", () => {
		for (const sem of CURRICULUM) {
			expect(sem).toHaveProperty("number");
			expect(sem).toHaveProperty("label");
			expect(sem).toHaveProperty("subjects");
			expect(Array.isArray(sem.subjects)).toBe(true);
		}
	});

	it("los números de semestre van de 1 a 8 en orden", () => {
		const numbers = CURRICULUM.map((s) => s.number);
		expect(numbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
	});

	it("cada label coincide con su número ('Semestre N')", () => {
		for (const sem of CURRICULUM) {
			expect(sem.label).toBe(`Semestre ${sem.number}`);
		}
	});

	it("todos los semestres tienen al menos una materia", () => {
		for (const sem of CURRICULUM) {
			expect(sem.subjects.length).toBeGreaterThan(0);
		}
	});
});

// -----------------------------------------------------------------------
// CURRICULUM — créditos por semestre
// -----------------------------------------------------------------------
describe("CURRICULUM — créditos por semestre", () => {
	const creditsBySemester: Record<number, number> = {
		1: 45,
		2: 45,
		3: 42,
		4: 44,
		5: 44,
		6: 47,
		7: 44,
		8: 45,
	};

	for (const [semNumber, expectedCredits] of Object.entries(
		creditsBySemester,
	)) {
		it(`Semestre ${semNumber} suma ${expectedCredits} créditos`, () => {
			const sem = CURRICULUM.find((s) => s.number === Number(semNumber));
			expect(sem).toBeDefined();
			const total = sem!.subjects.reduce((acc, s) => acc + s.credits, 0);
			expect(total).toBe(expectedCredits);
		});
	}

	it("la suma total de todos los créditos es 356", () => {
		const total = CURRICULUM.reduce(
			(acc, sem) => acc + sem.subjects.reduce((a, s) => a + s.credits, 0),
			0,
		);
		expect(total).toBe(356);
	});
});

// -----------------------------------------------------------------------
// CURRICULUM — propiedades de Subject
// -----------------------------------------------------------------------
describe("CURRICULUM — propiedades de Subject", () => {
	const allSubjects = CURRICULUM.flatMap((s) => s.subjects);

	it("cada materia tiene id, name, credits, semester, color, area, status", () => {
		for (const subject of allSubjects) {
			expect(subject).toHaveProperty("id");
			expect(subject).toHaveProperty("name");
			expect(subject).toHaveProperty("credits");
			expect(subject).toHaveProperty("semester");
			expect(subject).toHaveProperty("color");
			expect(subject).toHaveProperty("area");
			expect(subject).toHaveProperty("status");
		}
	});

	it("todos los ids son únicos", () => {
		const ids = allSubjects.map((s) => s.id);
		const uniqueIds = new Set(ids);
		expect(uniqueIds.size).toBe(ids.length);
	});

	it("todos los créditos son números positivos", () => {
		for (const subject of allSubjects) {
			expect(subject.credits).toBeGreaterThan(0);
		}
	});

	it("el campo semester de cada materia coincide con el semestre que la contiene", () => {
		for (const sem of CURRICULUM) {
			for (const subject of sem.subjects) {
				expect(subject.semester).toBe(sem.number);
			}
		}
	});

	it("el status inicial de todas las materias es 'pendiente'", () => {
		for (const subject of allSubjects) {
			expect(subject.status).toBe("pendiente");
		}
	});

	it("el color de cada materia es un string no vacío", () => {
		for (const subject of allSubjects) {
			expect(typeof subject.color).toBe("string");
			expect(subject.color.length).toBeGreaterThan(0);
		}
	});
});

// -----------------------------------------------------------------------
// CURRICULUM — materias específicas conocidas
// -----------------------------------------------------------------------
describe("CURRICULUM — materias específicas", () => {
	it("s1-3 es 'Fundamentos e Introducción a la Programación' con 10 créditos", () => {
		const subject = CURRICULUM[0].subjects.find((s) => s.id === "s1-3");
		expect(subject).toBeDefined();
		expect(subject!.name).toBe("Fundamentos e Introducción a la Programación");
		expect(subject!.credits).toBe(10);
	});

	it("s8-3 es 'Proyecto Final de Licenciatura' con 25 créditos", () => {
		const subject = CURRICULUM[7].subjects.find((s) => s.id === "s8-3");
		expect(subject).toBeDefined();
		expect(subject!.name).toBe("Proyecto Final de Licenciatura");
		expect(subject!.credits).toBe(25);
	});

	it("s4-5 es 'Proyecto Final Tecnicatura' con 9 créditos", () => {
		const subject = CURRICULUM[3].subjects.find((s) => s.id === "s4-5");
		expect(subject).toBeDefined();
		expect(subject!.name).toBe("Proyecto Final Tecnicatura");
		expect(subject!.credits).toBe(9);
	});
});

// -----------------------------------------------------------------------
// CURRICULUM — filtros por área
// -----------------------------------------------------------------------
describe("CURRICULUM — filtros por área", () => {
	const allSubjects = CURRICULUM.flatMap((s) => s.subjects);

	it("existen materias del área 'Desarrollo'", () => {
		const desarrollo = allSubjects.filter((s) => s.area === "Desarrollo");
		expect(desarrollo.length).toBeGreaterThan(0);
	});

	it("existen materias del área 'Testing'", () => {
		const testing = allSubjects.filter((s) => s.area === "Testing");
		expect(testing.length).toBeGreaterThan(0);
	});

	it("existen materias del área 'Idiomas' en los semestres 1–8", () => {
		for (const sem of CURRICULUM) {
			const idiomas = sem.subjects.filter((s) => s.area === "Idiomas");
			expect(idiomas.length).toBeGreaterThan(0);
		}
	});

	it("existen materias del área 'Innovación' en los semestres 1–8", () => {
		for (const sem of CURRICULUM) {
			const innova = sem.subjects.filter((s) => s.area === "Innovación");
			expect(innova.length).toBeGreaterThan(0);
		}
	});

	it("existen materias del área 'Título' (proyecto final)", () => {
		const titulo = allSubjects.filter((s) => s.area === "Título");
		expect(titulo.length).toBeGreaterThan(0);
	});
});

// -----------------------------------------------------------------------
// AREA_COLORS
// -----------------------------------------------------------------------
describe("AREA_COLORS", () => {
	it("es un objeto con entradas", () => {
		expect(Object.keys(AREA_COLORS).length).toBeGreaterThan(0);
	});

	it("todos los valores son strings de color válidos (comienzan con #)", () => {
		for (const value of Object.values(AREA_COLORS)) {
			expect(value).toMatch(/^#[0-9a-fA-F]{6}$/);
		}
	});

	it("contiene las áreas principales: Desarrollo, Testing, Datos, Gestión, Idiomas", () => {
		const expectedAreas = [
			"Desarrollo",
			"Testing",
			"Datos",
			"Gestión",
			"Idiomas",
		];
		for (const area of expectedAreas) {
			expect(AREA_COLORS).toHaveProperty(area);
		}
	});

	it("el color de Desarrollo es '#0ea5e9'", () => {
		expect(AREA_COLORS.Desarrollo).toBe("#0ea5e9");
	});

	it("el color de Testing es '#a855f7'", () => {
		expect(AREA_COLORS.Testing).toBe("#a855f7");
	});
});

// -----------------------------------------------------------------------
// DEFAULT_PRESENCIALES
// -----------------------------------------------------------------------
describe("DEFAULT_PRESENCIALES", () => {
	it("es un array (puede estar vacío)", () => {
		expect(Array.isArray(DEFAULT_PRESENCIALES)).toBe(true);
	});
});
