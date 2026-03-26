import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Subject } from "../../data/lti";
import type { SubjectData } from "../../hooks/useSubjectData";
import { EditSubjectModal } from "./EditSubjectModal";

// --------------- fixtures ---------------

const baseSubject: Subject = {
	id: "mat-001",
	name: "Programación I",
	credits: 6,
	semester: 1,
	color: "#3b82f6",
	area: "Informática",
	status: "en_curso",
};

const baseData: SubjectData = {
	status: "en_curso",
	grade: undefined,
	resources: [],
};

const dataWithResource: SubjectData = {
	status: "aprobada",
	grade: 9,
	resources: [
		{
			id: "res-1",
			name: "Drive Clases",
			url: "https://drive.google.com/xyz",
			type: "link",
		},
	],
};

function renderModal(
	overrides: {
		subject?: Partial<Subject>;
		currentData?: Partial<SubjectData>;
		onSave?: ReturnType<typeof vi.fn>;
		onClose?: ReturnType<typeof vi.fn>;
	} = {},
) {
	const onSave = overrides.onSave ?? vi.fn();
	const onClose = overrides.onClose ?? vi.fn();
	const subject = { ...baseSubject, ...(overrides.subject ?? {}) };
	const currentData = { ...baseData, ...(overrides.currentData ?? {}) };

	render(
		<EditSubjectModal
			subject={subject}
			currentData={currentData}
			onSave={onSave as unknown as (p: Partial<SubjectData>) => void}
			onClose={onClose as unknown as () => void}
		/>,
	);

	return { onSave, onClose };
}

// --------------- tests ---------------

describe("EditSubjectModal", () => {
	it("renderiza con datos básicos de la materia", () => {
		renderModal();

		// Nombre en el encabezado
		expect(screen.getByText("Programación I")).toBeInTheDocument();

		// Los tres botones de estado están presentes
		expect(
			screen.getByRole("button", { name: /pendiente/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /en curso/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /aprobada/i }),
		).toBeInTheDocument();

		// Mensaje de sin recursos
		expect(screen.getByText(/no hay recursos agregados/i)).toBeInTheDocument();

		// Botón Guardar Cambios
		expect(
			screen.getByRole("button", { name: /guardar cambios/i }),
		).toBeInTheDocument();
	});

	it("handleAddResource: NO agrega recurso si falta name o url", () => {
		renderModal();

		const addButton = screen.getByRole("button", { name: /añadir/i });

		// Botón deshabilitado cuando ambos campos están vacíos
		expect(addButton).toBeDisabled();

		// Sólo name
		const nameInput = screen.getByPlaceholderText(/nombre \(ej/i);
		fireEvent.change(nameInput, { target: { value: "Mi recurso" } });
		expect(addButton).toBeDisabled();

		// Limpiar name, sólo url
		fireEvent.change(nameInput, { target: { value: "" } });
		const urlInput = screen.getByPlaceholderText(/https:\/\//i);
		fireEvent.change(urlInput, { target: { value: "https://example.com" } });
		expect(addButton).toBeDisabled();

		// Sigue mostrando el mensaje de sin recursos
		expect(screen.getByText(/no hay recursos agregados/i)).toBeInTheDocument();
	});

	it("handleAddResource: agrega recurso correctamente cuando name y url son válidos", () => {
		renderModal();

		const nameInput = screen.getByPlaceholderText(/nombre \(ej/i);
		const urlInput = screen.getByPlaceholderText(/https:\/\//i);
		const addButton = screen.getByRole("button", { name: /añadir/i });

		fireEvent.change(nameInput, { target: { value: "Drive Clases" } });
		fireEvent.change(urlInput, {
			target: { value: "https://drive.google.com/test" },
		});

		expect(addButton).not.toBeDisabled();
		fireEvent.click(addButton);

		// Recurso aparece en la lista
		expect(screen.getByText("Drive Clases")).toBeInTheDocument();

		// Campos se limpian después de agregar
		expect(nameInput).toHaveValue("");
		expect(urlInput).toHaveValue("");

		// Ya no muestra el mensaje de sin recursos
		expect(
			screen.queryByText(/no hay recursos agregados/i),
		).not.toBeInTheDocument();
	});

	it("handleRemoveResource: elimina un recurso existente", () => {
		renderModal({ currentData: dataWithResource });

		// El recurso está visible inicialmente
		expect(screen.getByText("Drive Clases")).toBeInTheDocument();

		// Encontrar el botón de eliminar (Trash2 — hay uno para el recurso)
		// El modal también puede tener el botón "Eliminar Materia" si se pasa onDelete,
		// pero aquí no se pasa, así que sólo hay un Trash2.
		// El único botón con ícono que está junto al recurso
		// Buscamos el que está dentro del div del recurso (no el de guardar/cancelar)
		const resourceRow = screen.getByText("Drive Clases").closest("div");
		const trashButton = resourceRow?.parentElement?.querySelector("button");
		expect(trashButton).toBeTruthy();
		fireEvent.click(trashButton!);

		// El recurso ya no aparece
		expect(screen.queryByText("Drive Clases")).not.toBeInTheDocument();

		// Vuelve a mostrar el mensaje de sin recursos
		expect(screen.getByText(/no hay recursos agregados/i)).toBeInTheDocument();
	});

	it("llama onSave con el status correcto al cambiar el estado", () => {
		const onSave = vi.fn();
		const onClose = vi.fn();
		renderModal({
			onSave,
			onClose,
			currentData: { ...baseData, status: "pendiente" },
		});

		// Cambiar a "aprobada"
		const aprobadaBtn = screen.getByRole("button", { name: /aprobada/i });
		fireEvent.click(aprobadaBtn);

		// Guardar
		const saveBtn = screen.getByRole("button", { name: /guardar cambios/i });
		fireEvent.click(saveBtn);

		expect(onSave).toHaveBeenCalledTimes(1);
		expect(onSave).toHaveBeenCalledWith(
			expect.objectContaining({ status: "aprobada" }),
		);
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
