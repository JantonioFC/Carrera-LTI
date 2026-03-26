// ─── vi.hoisted — debe ir primero para que dbMock esté disponible en vi.mock ──
import { vi } from "vitest";

const { dbMock } = vi.hoisted(() => {
	const makeTableMock = () => {
		const table: {
			_rows: Record<string, unknown>[];
			toArray: ReturnType<typeof vi.fn>;
			get: ReturnType<typeof vi.fn>;
			add: ReturnType<typeof vi.fn>;
			put: ReturnType<typeof vi.fn>;
			delete: ReturnType<typeof vi.fn>;
			where: ReturnType<typeof vi.fn>;
		} = {
			_rows: [],
			toArray: vi.fn(async () => [...table._rows]),
			get: vi.fn(async (id: string) =>
				table._rows.find((r) => (r as { id: string }).id === id),
			),
			add: vi.fn(async (row: Record<string, unknown>) => {
				table._rows.push(row);
				return (row as { id: string }).id;
			}),
			put: vi.fn(async (row: Record<string, unknown>) => {
				const idx = table._rows.findIndex(
					(r) => (r as { id: string }).id === (row as { id: string }).id,
				);
				if (idx !== -1) table._rows[idx] = row;
				else table._rows.push(row);
				return (row as { id: string }).id;
			}),
			delete: vi.fn(async (id: string) => {
				table._rows = table._rows.filter(
					(r) => (r as { id: string }).id !== id,
				);
			}),
			where: vi.fn((field: string) => ({
				equals: vi.fn((val: string) => ({
					toArray: vi.fn(async () =>
						table._rows.filter(
							(r) => (r as Record<string, string>)[field] === val,
						),
					),
					sortBy: vi.fn(async (sortField: string) =>
						table._rows
							.filter(
								(r) => (r as Record<string, string>)[field] === val,
							)
							.sort(
								(a, b) =>
									(a as Record<string, number>)[sortField] -
									(b as Record<string, number>)[sortField],
							),
					),
				})),
			})),
		};
		return table;
	};

	return {
		dbMock: {
			databases: makeTableMock(),
			fields: makeTableMock(),
			rows: makeTableMock(),
		},
	};
});

// ─── Mocks top-level ──────────────────────────────────────────────────────────

vi.mock("./useNexusDB", async (importOriginal) => {
	const original = await importOriginal<typeof import("./useNexusDB")>();
	return {
		...original,
		db: dbMock,
	};
});

vi.mock("dexie-react-hooks", () => ({
	useLiveQuery: vi.fn((querier: () => unknown) => {
		try {
			const result = querier();
			if (result instanceof Promise) return undefined;
			return result;
		} catch {
			return undefined;
		}
	}),
}));

vi.mock("dexie", () => {
	const DexieMock = vi.fn().mockImplementation(function (
		this: Record<string, unknown>,
	) {
		this.version = vi.fn().mockReturnValue({ stores: vi.fn() });
	});
	return { default: DexieMock };
});

// ─── Imports (después de los mocks) ──────────────────────────────────────────

import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useLiveQuery } from "dexie-react-hooks";
import {
	db,
	useNexusDB,
	type NexusField,
	type NexusRow,
	type NexusSchema,
} from "./useNexusDB";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resetTables() {
	dbMock.databases._rows = [];
	dbMock.fields._rows = [];
	dbMock.rows._rows = [];
	vi.clearAllMocks();
}

function restoreDefaultLiveQuery() {
	vi.mocked(useLiveQuery).mockImplementation((querier: () => unknown) => {
		try {
			const result = querier();
			if (result instanceof Promise) return undefined;
			return result;
		} catch {
			return undefined;
		}
	});
}

// ─── Tests: estructura retornada ──────────────────────────────────────────────

describe("useNexusDB — estructura retornada", () => {
	beforeEach(() => {
		resetTables();
		restoreDefaultLiveQuery();
	});
	afterEach(resetTables);

	it("retorna dbEngine, allDatabases, currentDB, fields y rows", () => {
		const { result } = renderHook(() => useNexusDB());
		expect(result.current).toHaveProperty("dbEngine");
		expect(result.current).toHaveProperty("allDatabases");
		expect(result.current).toHaveProperty("currentDB");
		expect(result.current).toHaveProperty("fields");
		expect(result.current).toHaveProperty("rows");
	});

	it("dbEngine expone las tablas databases, fields y rows", () => {
		const { result } = renderHook(() => useNexusDB());
		expect(result.current.dbEngine).toHaveProperty("databases");
		expect(result.current.dbEngine).toHaveProperty("fields");
		expect(result.current.dbEngine).toHaveProperty("rows");
	});
});

// ─── Tests: allDatabases ──────────────────────────────────────────────────────

describe("useNexusDB — allDatabases", () => {
	beforeEach(() => {
		resetTables();
		restoreDefaultLiveQuery();
	});
	afterEach(resetTables);

	it("allDatabases es [] cuando useLiveQuery retorna undefined", () => {
		vi.mocked(useLiveQuery).mockReturnValue(undefined);
		const { result } = renderHook(() => useNexusDB());
		expect(result.current.allDatabases).toEqual([]);
	});

	it("allDatabases refleja las bases retornadas por useLiveQuery", () => {
		const fakeDBs: NexusSchema[] = [
			{ id: "db-1", name: "Mi BD", icon: "📚" },
			{ id: "db-2", name: "Otra BD", icon: "🗃️" },
		];
		vi.mocked(useLiveQuery)
			.mockReturnValueOnce(fakeDBs) // allDatabases
			.mockReturnValueOnce(undefined) // currentDB
			.mockReturnValueOnce(undefined) // fields
			.mockReturnValueOnce(undefined); // rows

		const { result } = renderHook(() => useNexusDB());
		expect(result.current.allDatabases).toEqual(fakeDBs);
		expect(result.current.allDatabases).toHaveLength(2);
	});

	it("allDatabases es [] cuando la tabla está vacía", () => {
		vi.mocked(useLiveQuery)
			.mockReturnValueOnce([]) // allDatabases
			.mockReturnValueOnce(undefined) // currentDB
			.mockReturnValueOnce([]) // fields
			.mockReturnValueOnce([]); // rows

		const { result } = renderHook(() => useNexusDB());
		expect(result.current.allDatabases).toEqual([]);
	});
});

// ─── Tests: currentDB ─────────────────────────────────────────────────────────

describe("useNexusDB — currentDB", () => {
	beforeEach(() => {
		resetTables();
		restoreDefaultLiveQuery();
	});
	afterEach(resetTables);

	it("currentDB es undefined cuando no se pasa databaseId", () => {
		vi.mocked(useLiveQuery)
			.mockReturnValueOnce([]) // allDatabases
			.mockReturnValueOnce(undefined) // currentDB
			.mockReturnValueOnce([]) // fields
			.mockReturnValueOnce([]); // rows

		const { result } = renderHook(() => useNexusDB());
		expect(result.current.currentDB).toBeUndefined();
	});

	it("currentDB retorna la base correspondiente al databaseId", () => {
		const schema: NexusSchema = { id: "db-1", name: "Mi BD", icon: "📚" };

		vi.mocked(useLiveQuery)
			.mockReturnValueOnce([schema]) // allDatabases
			.mockReturnValueOnce(schema) // currentDB
			.mockReturnValueOnce([]) // fields
			.mockReturnValueOnce([]); // rows

		const { result } = renderHook(() => useNexusDB("db-1"));
		expect(result.current.currentDB).toEqual(schema);
	});
});

// ─── Tests: fields ────────────────────────────────────────────────────────────

describe("useNexusDB — fields", () => {
	beforeEach(() => {
		resetTables();
		restoreDefaultLiveQuery();
	});
	afterEach(resetTables);

	it("fields es [] cuando useLiveQuery retorna undefined", () => {
		vi.mocked(useLiveQuery).mockReturnValue(undefined);
		const { result } = renderHook(() => useNexusDB("db-1"));
		expect(result.current.fields).toEqual([]);
	});

	it("fields retorna los campos del databaseId indicado", () => {
		const fakeFields: NexusField[] = [
			{ id: "f-1", databaseId: "db-1", name: "Título", type: "text" },
			{ id: "f-2", databaseId: "db-1", name: "Cantidad", type: "number" },
		];

		vi.mocked(useLiveQuery)
			.mockReturnValueOnce([]) // allDatabases
			.mockReturnValueOnce(undefined) // currentDB
			.mockReturnValueOnce(fakeFields) // fields
			.mockReturnValueOnce([]); // rows

		const { result } = renderHook(() => useNexusDB("db-1"));
		expect(result.current.fields).toEqual(fakeFields);
	});
});

// ─── Tests: rows ──────────────────────────────────────────────────────────────

describe("useNexusDB — rows", () => {
	beforeEach(() => {
		resetTables();
		restoreDefaultLiveQuery();
	});
	afterEach(resetTables);

	it("rows es [] cuando useLiveQuery retorna undefined", () => {
		vi.mocked(useLiveQuery).mockReturnValue(undefined);
		const { result } = renderHook(() => useNexusDB("db-1"));
		expect(result.current.rows).toEqual([]);
	});

	it("rows retorna las filas del databaseId indicado", () => {
		const fakeRows: NexusRow[] = [
			{ id: "r-1", databaseId: "db-1", createdAt: 1000, data: { campo: "A" } },
			{ id: "r-2", databaseId: "db-1", createdAt: 2000, data: { campo: "B" } },
		];

		vi.mocked(useLiveQuery)
			.mockReturnValueOnce([]) // allDatabases
			.mockReturnValueOnce(undefined) // currentDB
			.mockReturnValueOnce([]) // fields
			.mockReturnValueOnce(fakeRows); // rows

		const { result } = renderHook(() => useNexusDB("db-1"));
		expect(result.current.rows).toEqual(fakeRows);
	});
});

// ─── Tests: operaciones sobre db.databases ───────────────────────────────────

describe("useNexusDB — db.databases", () => {
	beforeEach(() => {
		resetTables();
		restoreDefaultLiveQuery();
	});
	afterEach(resetTables);

	it("add agrega una base de datos", async () => {
		const newDB: NexusSchema = { id: "db-10", name: "Nueva", icon: "🗂️" };
		await db.databases.add(newDB as unknown as Parameters<typeof db.databases.add>[0]);
		expect(dbMock.databases._rows).toContainEqual(newDB);
	});

	it("delete elimina una base de datos por id", async () => {
		dbMock.databases._rows = [{ id: "db-10", name: "Nueva", icon: "🗂️" }];
		await db.databases.delete("db-10");
		expect(dbMock.databases._rows).toHaveLength(0);
	});

	it("toArray retorna todas las bases", async () => {
		const schemas = [{ id: "db-1", name: "A", icon: "1" }];
		dbMock.databases._rows = [...schemas];
		const result = await db.databases.toArray();
		expect(result).toEqual(schemas);
	});
});

// ─── Tests: tipos exportados ──────────────────────────────────────────────────

describe("useNexusDB — interfaces exportadas", () => {
	it("NexusSchema tiene las propiedades requeridas", () => {
		const schema: NexusSchema = { id: "x", name: "Test", icon: "T" };
		expect(schema.id).toBeDefined();
		expect(schema.name).toBeDefined();
	});

	it("NexusField soporta todos los tipos", () => {
		const types: NexusField["type"][] = [
			"text",
			"number",
			"date",
			"select",
			"relation",
		];
		for (const type of types) {
			const field: NexusField = {
				id: `f-${type}`,
				databaseId: "db-1",
				name: type,
				type,
			};
			expect(field.type).toBe(type);
		}
	});

	it("NexusRow acepta data con campos dinámicos", () => {
		const row: NexusRow = {
			id: "r-1",
			databaseId: "db-1",
			createdAt: Date.now(),
			data: { texto: "hola", numero: 42 },
		};
		expect(row.data.texto).toBe("hola");
	});
});
