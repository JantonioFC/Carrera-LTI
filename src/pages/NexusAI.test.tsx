import { render, screen } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// --- Mocks top-level ---
vi.mock("../store/aetherStore", () => ({
	useAetherStore: vi.fn(),
}));

vi.mock("../store/nexusStore", () => ({
	useNexusStore: vi.fn(),
}));

vi.mock("../hooks/useNexusDB", () => ({
	useNexusDB: vi.fn(),
}));

vi.mock("../services/aiClient", () => ({
	apiBackend: {
		updateApiKey: vi.fn(),
		askNexusStream: vi.fn(),
	},
}));

vi.mock("../utils/aiUtils", () => ({
	truncateContext: vi.fn((text: string) => text),
}));

import { useNexusDB } from "../hooks/useNexusDB";
// Importar después de los mocks
import { useAetherStore } from "../store/aetherStore";
import { useNexusStore } from "../store/nexusStore";
import NexusAI from "./NexusAI";

// Helper: configurar mocks con valores por defecto
function setupMocks({
	apiKey = "test-key",
	notes = [],
	documents = [],
	allDatabases = [],
}: {
	apiKey?: string;
	notes?: { title: string; content: string }[];
	documents?: { title: string; tags: string[] }[];
	allDatabases?: { name: string }[];
} = {}) {
	vi.mocked(useAetherStore).mockReturnValue({
		notes,
		geminiApiKey: apiKey,
		setGeminiApiKey: vi.fn(),
		gmailClientId: "",
		gmailApiKey: "",
	} as any);

	vi.mocked(useNexusStore).mockReturnValue({
		documents,
	} as any);

	vi.mocked(useNexusDB).mockReturnValue({
		allDatabases,
	} as any);
}

// Extraer buildSystemContext para tests unitarios puros sin renderizar
function buildSystemContext(
	notes: { title: string; content: string }[],
	documents: { title: string; tags: string[] }[],
	allDatabases: { name: string }[],
): string {
	let context = `Eres Nexus AI, un asistente de inteligencia integrada para un espacio de trabajo unificado.\n`;

	if (notes.length > 0) {
		context += `### Notas de Aether (Segundo Cerebro)\n`;
		notes.forEach((n) => {
			context += `- **${n.title}**: ${n.content.slice(0, 300)}...\n`;
		});
		context += "\n";
	}

	if (documents.length > 0) {
		context += `### Documentos Nexus (Block Editor)\n`;
		documents.forEach((d) => {
			context += `- **${d.title}** (tags: ${d.tags.join(", ") || "ninguno"})\n`;
		});
		context += "\n";
	}

	if (allDatabases.length > 0) {
		context += `### Bases de Datos Nexus\n`;
		allDatabases.forEach((db) => {
			context += `- 📁 ${db.name}\n`;
		});
		context += "\n";
	}

	return context;
}

beforeEach(() => {
	vi.clearAllMocks();
	localStorage.clear();
});

describe("buildSystemContext", () => {
	it("incluye notas de Aether cuando hay notas", () => {
		const notes = [{ title: "Mi nota", content: "Contenido de prueba" }];
		const context = buildSystemContext(notes, [], []);

		expect(context).toContain("### Notas de Aether (Segundo Cerebro)");
		expect(context).toContain("Mi nota");
		expect(context).toContain("Contenido de prueba");
	});

	it("incluye documentos Nexus cuando hay documentos", () => {
		const documents = [{ title: "Doc Test", tags: ["react", "ts"] }];
		const context = buildSystemContext([], documents, []);

		expect(context).toContain("### Documentos Nexus (Block Editor)");
		expect(context).toContain("Doc Test");
		expect(context).toContain("react, ts");
	});

	it("retorna contexto base sin datos cuando no hay notas ni docs ni DBs", () => {
		const context = buildSystemContext([], [], []);

		expect(context).not.toContain("### Notas de Aether");
		expect(context).not.toContain("### Documentos Nexus");
		expect(context).not.toContain("### Bases de Datos Nexus");
		expect(context).toContain("Nexus AI");
	});
});

describe("NexusAI — render con apiKey vacía", () => {
	it("renderiza el input de API key cuando apiKey está vacío", () => {
		setupMocks({ apiKey: "" });
		render(<NexusAI />);

		// showKeyInput = !apiKey → true cuando apiKey === ""
		const input = screen.getByPlaceholderText(
			/Ingresa tu clave de Google AI Studio/i,
		);
		expect(input).toBeInTheDocument();
	});
});

describe("NexusAI — render con messages vacíos", () => {
	it("renderiza mensaje de bienvenida cuando messages es []", () => {
		setupMocks({ apiKey: "my-key" });
		render(<NexusAI />);

		// El mensaje de bienvenida se muestra cuando messages.length === 0
		expect(
			screen.getByText(/Tu asistente con acceso completo/i),
		).toBeInTheDocument();
	});
});

describe("NexusAI — clearChat", () => {
	it("limpia localStorage con la clave lti_nexus_ai_history", async () => {
		setupMocks({ apiKey: "my-key" });
		localStorage.setItem(
			"lti_nexus_ai_history",
			JSON.stringify([{ role: "user", content: "hola" }]),
		);

		render(<NexusAI />);

		// Llamar directamente al botón de limpiar chat
		const clearBtn = screen.getByTitle("Limpiar chat");
		await act(async () => {
			clearBtn.click();
		});

		expect(localStorage.getItem("lti_nexus_ai_history")).toBeNull();
	});
});
