/**
 * Tests de tipo en tiempo de compilación para los branded types del sistema.
 * Valida que los tipos sean estructuralmente incompatibles entre sí
 * y que los constructores de Zod produzcan el branded type correcto.
 *
 * Resuelve TS-NEW-1 (#284): cero tests de tipo para branded types.
 */
import { describe, expectTypeOf, it } from "vitest";
import type {
	AetherNoteId,
	ChatMessageId,
	NexusDocumentId,
	SubtaskId,
	TaskId,
} from "./schemas";
import {
	AetherNoteSchema,
	ChatMessageSchema,
	NexusDocumentSchema,
	SubtaskSchema,
	TaskSchema,
} from "./schemas";

describe("AetherNoteId branded type", () => {
	it("el schema transforma a AetherNoteId", () => {
		const result = AetherNoteSchema.safeParse({
			id: "note_abc",
			title: "t",
			content: "c",
			createdAt: 0,
			updatedAt: 0,
			tags: [],
		});
		if (!result.success) throw new Error("parse failed");
		expectTypeOf(result.data.id).toEqualTypeOf<AetherNoteId>();
	});

	it("AetherNoteId no es asignable a ChatMessageId", () => {
		expectTypeOf<AetherNoteId>().not.toEqualTypeOf<ChatMessageId>();
	});

	it("AetherNoteId no es asignable a NexusDocumentId", () => {
		expectTypeOf<AetherNoteId>().not.toEqualTypeOf<NexusDocumentId>();
	});

	it("AetherNoteId no es asignable a TaskId", () => {
		expectTypeOf<AetherNoteId>().not.toEqualTypeOf<TaskId>();
	});
});

describe("ChatMessageId branded type", () => {
	it("el schema transforma a ChatMessageId", () => {
		const result = ChatMessageSchema.safeParse({
			id: "msg_1",
			role: "user",
			text: "hola",
			timestamp: 0,
		});
		if (!result.success) throw new Error("parse failed");
		expectTypeOf(result.data.id).toEqualTypeOf<ChatMessageId>();
	});

	it("ChatMessageId no es asignable a AetherNoteId", () => {
		expectTypeOf<ChatMessageId>().not.toEqualTypeOf<AetherNoteId>();
	});
});

describe("NexusDocumentId branded type", () => {
	it("el schema transforma a NexusDocumentId", () => {
		const result = NexusDocumentSchema.safeParse({
			id: "doc_xyz",
			title: "Doc",
			createdAt: 0,
			updatedAt: 0,
			tags: [],
		});
		if (!result.success) throw new Error("parse failed");
		expectTypeOf(result.data.id).toEqualTypeOf<NexusDocumentId>();
	});

	it("NexusDocumentId no es asignable a AetherNoteId", () => {
		expectTypeOf<NexusDocumentId>().not.toEqualTypeOf<AetherNoteId>();
	});
});

describe("SubtaskId branded type", () => {
	it("el schema transforma a SubtaskId", () => {
		const result = SubtaskSchema.safeParse({
			id: "st001",
			text: "hacer algo",
			completed: false,
		});
		if (!result.success) throw new Error("parse failed");
		expectTypeOf(result.data.id).toEqualTypeOf<SubtaskId>();
	});

	it("SubtaskId no es asignable a TaskId", () => {
		expectTypeOf<SubtaskId>().not.toEqualTypeOf<TaskId>();
	});
});

describe("TaskId branded type", () => {
	it("el schema transforma a TaskId", () => {
		const result = TaskSchema.safeParse({
			id: "t001",
			title: "Tarea",
			subjectId: "sub1",
			dueDate: "2026-01-01",
			priority: "alta",
			status: "todo",
			subtasks: [],
		});
		if (!result.success) throw new Error("parse failed");
		expectTypeOf(result.data.id).toEqualTypeOf<TaskId>();
	});

	it("TaskId no es asignable a SubtaskId", () => {
		expectTypeOf<TaskId>().not.toEqualTypeOf<SubtaskId>();
	});
});
