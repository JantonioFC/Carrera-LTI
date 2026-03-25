import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CommandPalette } from "./CommandPalette";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
	useNavigate: () => mockNavigate,
}));

const mockUseNexusDB = vi.fn(() => ({
	allDatabases: [] as { id: string; name: string; icon: string }[],
}));
vi.mock("../hooks/useNexusDB", () => ({
	useNexusDB: () => mockUseNexusDB(),
}));

const mockUseNexusStore = vi.fn(() => ({
	documents: [] as { id: string; title: string }[],
}));
vi.mock("../store/nexusStore", () => ({
	useNexusStore: () => mockUseNexusStore(),
}));

vi.mock("lucide-react", () => ({
	BrainCircuit: ({ size }: { size?: number }) => (
		<span data-testid="icon-BrainCircuit" data-size={size} />
	),
	Database: ({ size }: { size?: number }) => (
		<span data-testid="icon-Database" data-size={size} />
	),
	FileText: ({ size }: { size?: number }) => (
		<span data-testid="icon-FileText" data-size={size} />
	),
	Search: ({ size }: { size?: number }) => (
		<span data-testid="icon-Search" data-size={size} />
	),
	Trash2: ({ size }: { size?: number }) => (
		<span data-testid="icon-Trash2" data-size={size} />
	),
}));

// ── Helper ────────────────────────────────────────────────────────────────────

function renderPalette(props: { isOpen?: boolean; onClose?: () => void } = {}) {
	const onClose = props.onClose ?? vi.fn();
	render(<CommandPalette isOpen={props.isOpen ?? true} onClose={onClose} />);
	return { onClose };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("CommandPalette", () => {
	describe("cuando está cerrada", () => {
		it("should_render_nothing_when_isOpen_is_false", () => {
			renderPalette({ isOpen: false });
			expect(screen.queryByPlaceholderText(/Buscar/i)).not.toBeInTheDocument();
		});
	});

	describe("cuando está abierta", () => {
		it("should_show_search_input_when_open", () => {
			renderPalette();
			expect(
				screen.getByPlaceholderText(/Buscar documentos/i),
			).toBeInTheDocument();
		});

		it("should_show_quick_actions_when_query_is_empty", () => {
			renderPalette();
			expect(screen.getByText("Acciones Rápidas")).toBeInTheDocument();
			expect(screen.getByText("Nuevo Documento (Blocks)")).toBeInTheDocument();
			expect(screen.getByText(/Consultar IA/i)).toBeInTheDocument();
			expect(screen.getByText(/Explorar Bases de Datos/i)).toBeInTheDocument();
		});

		it("should_show_sistema_section_always", () => {
			renderPalette();
			expect(screen.getByText("Sistema")).toBeInTheDocument();
			expect(screen.getByText(/Limpieza Total/i)).toBeInTheDocument();
		});

		it("should_call_onClose_when_backdrop_is_clicked", () => {
			const onClose = vi.fn();
			renderPalette({ onClose });
			const backdrop = document.querySelector(
				".absolute.inset-0",
			) as HTMLElement;
			fireEvent.click(backdrop);
			expect(onClose).toHaveBeenCalledTimes(1);
		});

		it("should_call_onClose_on_escape_keydown", () => {
			const onClose = vi.fn();
			renderPalette({ onClose });
			fireEvent.keyDown(window, { key: "Escape" });
			expect(onClose).toHaveBeenCalledTimes(1);
		});

		it("should_call_onClose_on_ctrl_k", () => {
			const onClose = vi.fn();
			renderPalette({ onClose });
			fireEvent.keyDown(window, { key: "k", ctrlKey: true });
			expect(onClose).toHaveBeenCalledTimes(1);
		});

		it("should_call_onClose_on_meta_k", () => {
			const onClose = vi.fn();
			renderPalette({ onClose });
			fireEvent.keyDown(window, { key: "k", metaKey: true });
			expect(onClose).toHaveBeenCalledTimes(1);
		});

		it("should_not_call_onClose_on_escape_when_closed", () => {
			const onClose = vi.fn();
			renderPalette({ isOpen: false, onClose });
			fireEvent.keyDown(window, { key: "Escape" });
			expect(onClose).not.toHaveBeenCalled();
		});

		it("should_update_input_value_when_typing", () => {
			renderPalette();
			const input = screen.getByPlaceholderText(
				/Buscar documentos/i,
			) as HTMLInputElement;
			fireEvent.change(input, { target: { value: "hola" } });
			expect(input.value).toBe("hola");
		});

		it("should_hide_quick_actions_after_debounce_when_typing", () => {
			vi.useFakeTimers();
			renderPalette();
			const input = screen.getByPlaceholderText(/Buscar documentos/i);
			fireEvent.change(input, { target: { value: "algo" } });
			act(() => {
				vi.advanceTimersByTime(200);
			});
			expect(screen.queryByText("Acciones Rápidas")).not.toBeInTheDocument();
			vi.useRealTimers();
		});

		it("should_show_no_results_message_for_docs_when_query_is_typed", () => {
			vi.useFakeTimers();
			renderPalette();
			const input = screen.getByPlaceholderText(/Buscar documentos/i);
			fireEvent.change(input, { target: { value: "xyz" } });
			act(() => {
				vi.advanceTimersByTime(200);
			});
			expect(
				screen.getByText("No hay resultados de texto"),
			).toBeInTheDocument();
			vi.useRealTimers();
		});
	});

	describe("con documentos", () => {
		it("should_show_document_title_when_documents_exist", () => {
			mockUseNexusStore.mockReturnValueOnce({
				documents: [{ id: "1", title: "Mi nota de prueba" }],
			});
			renderPalette();
			expect(screen.getByText("Documentos Blocks")).toBeInTheDocument();
			expect(screen.getByText("Mi nota de prueba")).toBeInTheDocument();
		});
	});

	describe("con bases de datos", () => {
		it("should_show_database_name_when_databases_exist", () => {
			mockUseNexusDB.mockReturnValueOnce({
				allDatabases: [{ id: "db1", name: "Asignaturas", icon: "📚" }],
			});
			renderPalette();
			expect(screen.getByText("Tablas / Bases de Datos")).toBeInTheDocument();
			expect(screen.getByText("Asignaturas")).toBeInTheDocument();
		});
	});

	describe("navegación", () => {
		it("should_navigate_to_nexus_on_nuevo_documento_click", () => {
			renderPalette();
			fireEvent.click(screen.getByText("Nuevo Documento (Blocks)"));
			expect(mockNavigate).toHaveBeenCalledWith("/nexus");
		});

		it("should_navigate_to_aether_on_consultar_ia_click", () => {
			renderPalette();
			fireEvent.click(screen.getByText(/Consultar IA/i));
			expect(mockNavigate).toHaveBeenCalledWith("/aether/chat");
		});

		it("should_navigate_to_nexus_db_on_explorar_click", () => {
			renderPalette();
			fireEvent.click(screen.getByText(/Explorar Bases de Datos/i));
			expect(mockNavigate).toHaveBeenCalledWith("/nexus/db");
		});
	});
});
