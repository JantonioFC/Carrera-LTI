import { z } from "zod";

// ─── ID types (source of truth — importar desde aquí, no redefinir) ──────────
export type AetherNoteId = `note_${string}`;
export type ChatMessageId = `msg_${string}`;
export type NexusDocumentId = `doc_${string}`;
export type SubtaskId = `st${string}`;
export type TaskId = `t${string}`;

// ─── Aether ───────────────────────────────────────────────────
export const AetherNoteSchema = z.object({
	id: z
		.string()
		.startsWith("note_")
		.transform((v) => v as AetherNoteId),
	title: z.string(),
	content: z.string(),
	createdAt: z.number(),
	updatedAt: z.number(),
	tags: z.array(z.string()),
	embedding: z.array(z.number()).optional(),
});

export const AetherNotesSchema = z.array(AetherNoteSchema);

export const ChatMessageSchema = z.object({
	id: z
		.string()
		.startsWith("msg_")
		.transform((v) => v as ChatMessageId),
	role: z.enum(["user", "model"]),
	text: z.string(),
	timestamp: z.number(),
});

export const ChatHistorySchema = z.array(ChatMessageSchema);

// ─── Nexus ────────────────────────────────────────────────────
export const NexusDocumentSchema = z.object({
	id: z
		.string()
		.startsWith("doc_")
		.transform((v) => v as NexusDocumentId),
	title: z.string(),
	createdAt: z.number(),
	updatedAt: z.number(),
	tags: z.array(z.string()),
});

export const NexusMessageSchema = z.object({
	role: z.enum(["user", "model"]),
	content: z.string(),
});

export const NexusMessagesSchema = z.array(NexusMessageSchema);

// ─── Tareas ───────────────────────────────────────────────────
export const SubtaskSchema = z.object({
	id: z
		.string()
		.startsWith("st")
		.transform((v) => v as SubtaskId),
	text: z.string(),
	completed: z.boolean(),
});

export const TaskSchema = z.object({
	id: z
		.string()
		.startsWith("t")
		.transform((v) => v as TaskId),
	title: z.string(),
	subjectId: z.string(),
	dueDate: z.string(),
	priority: z.enum(["alta", "media", "baja"]),
	status: z.enum(["todo", "inProgress", "done"]),
	subtasks: z.array(SubtaskSchema),
});

export const TasksSchema = z.array(TaskSchema);

// ─── Horarios ─────────────────────────────────────────────────
export const ScheduleItemSchema = z.object({
	id: z.string(),
	subjectId: z.string(),
	day: z.number().nullable(),
});

export const ScheduleItemsSchema = z.array(ScheduleItemSchema);

// ─── Presenciales ─────────────────────────────────────────────
export const PresencialEventSchema = z.object({
	id: z.string(),
	date: z.string(),
	activity: z.string(),
	area: z.string(),
	includesEval: z.boolean(),
	sede: z.string(),
	hours: z.string(),
});

export const PresencialesSchema = z.array(PresencialEventSchema);

// ─── Calendario 2026 ──────────────────────────────────────────
export const CalendarEventSchema = z.object({
	title: z.string(),
	time: z.string(),
});

export const CalendarEventsSchema = z.record(
	z.string(),
	z.array(CalendarEventSchema),
);

export type CalendarEvent = z.infer<typeof CalendarEventSchema>;
export type CalendarEventsMap = z.infer<typeof CalendarEventsSchema>;

// ─── Subject Data ─────────────────────────────────────────────
export const SubjectResourceSchema = z.object({
	id: z.string(),
	name: z.string(),
	url: z.string(),
	type: z.enum(["link", "drive", "github", "video", "pdf"]),
});

export const SubjectDataSchema = z.object({
	status: z.enum(["en_curso", "pendiente", "aprobada", "reprobada"]),
	grade: z.number().optional(),
	resources: z.array(SubjectResourceSchema),
});

export const SubjectDataMapSchema = z.record(z.string(), SubjectDataSchema);

// ─── Sync Data ────────────────────────────────────────────────
export const AppDataSchema = z.object({
	subjectData: SubjectDataMapSchema,
	presenciales: PresencialesSchema,
	calendarEvents: CalendarEventsSchema.optional(),
	tasks: TasksSchema.optional(),
	schedule: ScheduleItemsSchema.optional(),
	nexusDocs: z.array(NexusDocumentSchema).optional(),
	aetherNotes: AetherNotesSchema.optional(),
	geminiApiKey: z.string().optional(),
	gmailClientId: z.string().optional(),
	gmailApiKey: z.string().optional(),
	lastUpdated: z.number(),
});
