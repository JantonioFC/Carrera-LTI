import { describe, expect, it } from "vitest";
import {
	AetherNoteSchema,
	CalendarEventsSchema,
	ChatMessageSchema,
	NexusDocumentSchema,
	SubtaskSchema,
	TaskSchema,
} from "./schemas";

describe("AetherNoteSchema", () => {
	const valid = {
		id: "note_abc",
		title: "Mi nota",
		content: "contenido",
		createdAt: 1000,
		updatedAt: 2000,
		tags: ["a"],
	};

	it("acepta nota válida", () => {
		expect(AetherNoteSchema.safeParse(valid).success).toBe(true);
	});

	it("transforma id a AetherNoteId", () => {
		const result = AetherNoteSchema.safeParse(valid);
		expect(result.success && result.data.id).toBe("note_abc");
	});

	it("rechaza id sin prefijo note_", () => {
		expect(
			AetherNoteSchema.safeParse({ ...valid, id: "bad_abc" }).success,
		).toBe(false);
	});
});

describe("ChatMessageSchema", () => {
	const valid = {
		id: "msg_1",
		role: "user",
		text: "hola",
		timestamp: 1000,
	};

	it("acepta mensaje válido", () => {
		expect(ChatMessageSchema.safeParse(valid).success).toBe(true);
	});

	it("rechaza role inválido", () => {
		expect(
			ChatMessageSchema.safeParse({ ...valid, role: "admin" }).success,
		).toBe(false);
	});
});

describe("NexusDocumentSchema", () => {
	const valid = {
		id: "doc_xyz",
		title: "Doc",
		createdAt: 1000,
		updatedAt: 2000,
		tags: [],
	};

	it("acepta documento válido", () => {
		expect(NexusDocumentSchema.safeParse(valid).success).toBe(true);
	});

	it("rechaza id sin prefijo doc_", () => {
		expect(
			NexusDocumentSchema.safeParse({ ...valid, id: "note_xyz" }).success,
		).toBe(false);
	});
});

describe("SubtaskSchema", () => {
	const valid = { id: "st001", text: "hacer algo", completed: false };

	it("acepta subtask válido", () => {
		expect(SubtaskSchema.safeParse(valid).success).toBe(true);
	});

	it("rechaza id sin prefijo st", () => {
		expect(SubtaskSchema.safeParse({ ...valid, id: "xx001" }).success).toBe(
			false,
		);
	});
});

describe("TaskSchema", () => {
	const valid = {
		id: "t001",
		title: "Tarea",
		subjectId: "sub1",
		dueDate: "2026-01-01",
		priority: "alta",
		status: "todo",
		subtasks: [],
	};

	it("acepta tarea válida", () => {
		expect(TaskSchema.safeParse(valid).success).toBe(true);
	});

	it("rechaza priority inválida", () => {
		expect(
			TaskSchema.safeParse({ ...valid, priority: "urgente" }).success,
		).toBe(false);
	});
});

describe("CalendarEventsSchema", () => {
	it("acepta mapa vacío", () => {
		expect(CalendarEventsSchema.safeParse({}).success).toBe(true);
	});

	it("acepta mapa con entradas válidas", () => {
		const data = {
			"2026-01-01": [{ title: "Evento", time: "10:00" }],
		};
		expect(CalendarEventsSchema.safeParse(data).success).toBe(true);
	});

	it("rechaza entradas con campos faltantes", () => {
		const data = { "2026-01-01": [{ title: "Evento" }] };
		expect(CalendarEventsSchema.safeParse(data).success).toBe(false);
	});
});
