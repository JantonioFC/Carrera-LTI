import { z } from 'zod';

// ─── Aether ───────────────────────────────────────────────────
export const AetherNoteSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  tags: z.array(z.string()),
});

export const AetherNotesSchema = z.array(AetherNoteSchema);

export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'model']),
  text: z.string(),
  timestamp: z.number(),
});

export const ChatHistorySchema = z.array(ChatMessageSchema);

// ─── Nexus ────────────────────────────────────────────────────
export const NexusDocumentSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  tags: z.array(z.string()),
});

export const NexusDocumentsSchema = z.array(NexusDocumentSchema);

export const NexusMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

export const NexusMessagesSchema = z.array(NexusMessageSchema);

// ─── Tareas ───────────────────────────────────────────────────
export const SubtaskSchema = z.object({
  id: z.string(),
  text: z.string(),
  completed: z.boolean(),
});

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  subjectId: z.string(),
  dueDate: z.string(),
  priority: z.enum(['alta', 'media', 'baja']),
  status: z.enum(['todo', 'inProgress', 'done']),
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
  title: z.string(),
  date: z.string(),
  subjectId: z.string(),
  type: z.enum(['parcial', 'final', 'entrega', 'presentacion']),
});

export const PresencialesSchema = z.array(PresencialEventSchema);

// ─── Subject Data ─────────────────────────────────────────────
export const SubjectResourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  type: z.enum(['link', 'drive', 'github', 'video', 'pdf']),
});

export const SubjectDataSchema = z.object({
  status: z.enum(['pendiente', 'cursando', 'aprobada', 'reprobada']),
  grade: z.number().optional(),
  resources: z.array(SubjectResourceSchema),
});

export const SubjectDataMapSchema = z.record(z.string(), SubjectDataSchema);
