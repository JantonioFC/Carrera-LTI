import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PresencialEvent } from "../data/lti.types";
import { downloadICS } from "./icsExport";

let blobContent = "";
let linkElement: HTMLAnchorElement;
let originalBlob: typeof Blob;

beforeEach(() => {
	blobContent = "";
	originalBlob = globalThis.Blob;

	// Mock Blob como clase para poder capturar el contenido
	vi.stubGlobal(
		"Blob",
		class MockBlob {
			type: string;
			constructor(parts: (string | ArrayBuffer | Blob)[]) {
				blobContent = (parts as string[]).join("");
				this.type = "text/calendar;charset=utf-8";
			}
		},
	);

	vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake");

	linkElement = originalBlob
		? document.createElement("a")
		: document.createElement("a");
	const origCreate = document.createElement.bind(document);
	vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
		if (tag === "a") return linkElement;
		return origCreate(tag as Parameters<typeof document.createElement>[0]);
	});

	vi.spyOn(document.body, "appendChild").mockImplementation(() => linkElement);
	vi.spyOn(document.body, "removeChild").mockImplementation(() => linkElement);
	vi.spyOn(linkElement, "click").mockImplementation(() => {});
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

const makeEvent = (
	overrides: Partial<PresencialEvent> = {},
): PresencialEvent => ({
	id: "ev_001",
	date: "2026-03-15",
	activity: "Algebra",
	area: "Matematicas",
	includesEval: false,
	sede: "Montevideo",
	hours: "09:00-13:00",
	...overrides,
});

describe("downloadICS", () => {
	it("array vacío genera ICS con VCALENDAR y sin VEVENT", () => {
		downloadICS([]);
		expect(blobContent).toContain("BEGIN:VCALENDAR");
		expect(blobContent).toContain("END:VCALENDAR");
		expect(blobContent).not.toContain("BEGIN:VEVENT");
	});

	it("con un evento genera VEVENT con UID, DTSTART, SUMMARY, LOCATION", () => {
		downloadICS([makeEvent()]);
		expect(blobContent).toContain("BEGIN:VEVENT");
		expect(blobContent).toContain("UID:ev_001@carrera-lti");
		expect(blobContent).toContain("DTSTART;VALUE=DATE:20260315");
		expect(blobContent).toContain("SUMMARY:Instancia Presencial UTEC: Algebra");
		expect(blobContent).toContain("LOCATION:UTEC Sede Montevideo");
	});

	it("el filename por defecto es carrera-lti-presenciales.ics", () => {
		downloadICS([]);
		expect(linkElement.download).toBe("carrera-lti-presenciales.ics");
	});

	it("el filename custom se usa en link.download", () => {
		downloadICS([], "mi-calendario.ics");
		expect(linkElement.download).toBe("mi-calendario.ics");
	});

	it("DTEND debe ser un día después del DTSTART", () => {
		downloadICS([makeEvent({ date: "2026-03-15" })]);
		expect(blobContent).toContain("DTSTART;VALUE=DATE:20260315");
		expect(blobContent).toContain("DTEND;VALUE=DATE:20260316");
	});

	it("con múltiples eventos genera múltiples VEVENT", () => {
		const events = [
			makeEvent({ id: "ev_001", date: "2026-03-15" }),
			makeEvent({ id: "ev_002", date: "2026-04-10", activity: "Fisica" }),
		];
		downloadICS(events);
		const count = (blobContent.match(/BEGIN:VEVENT/g) || []).length;
		expect(count).toBe(2);
	});
});
