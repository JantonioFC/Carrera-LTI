import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// vi.hoisted permite definir mocks antes del hoisting de vi.mock
const { mockAuthService, mockSyncService } = vi.hoisted(() => {
	const mockAuthService = {
		init: vi.fn(),
		signInAnonymously: vi.fn(),
		getUserId: vi.fn(),
	};
	const mockSyncService = {
		syncToCloud: vi.fn(),
		getFromCloud: vi.fn(),
	};
	return { mockAuthService, mockSyncService };
});

vi.mock("../utils/firebase", () => ({
	authService: mockAuthService,
	syncService: mockSyncService,
}));

// Consolidados en un único bloque hoisted para reducir fragmentación
const {
	mockUpdateSubject,
	mockSetGeminiApiKey,
	mockSetGmailClientId,
	mockSetGmailApiKey,
	mockAetherSetState,
	mockNexusSetState,
} = vi.hoisted(() => ({
	mockUpdateSubject: vi.fn(),
	mockSetGeminiApiKey: vi.fn(),
	mockSetGmailClientId: vi.fn(),
	mockSetGmailApiKey: vi.fn(),
	mockAetherSetState: vi.fn(),
	mockNexusSetState: vi.fn(),
}));

vi.mock("./useSubjectData", () => ({
	useSubjectData: () => ({
		data: {},
		updateSubject: mockUpdateSubject,
	}),
}));

vi.mock("../store/aetherStore", () => ({
	useAetherStore: Object.assign(
		() => ({
			notes: [],
		}),
		{
			setState: mockAetherSetState,
		},
	),
}));

vi.mock("../store/userConfigStore", () => ({
	useUserConfigStore: () => ({
		geminiApiKey: "",
		gmailClientId: "",
		gmailApiKey: "",
		setGeminiApiKey: mockSetGeminiApiKey,
		setGmailClientId: mockSetGmailClientId,
		setGmailApiKey: mockSetGmailApiKey,
	}),
}));

vi.mock("../store/nexusStore", () => ({
	useNexusStore: Object.assign(
		() => ({
			documents: [],
		}),
		{
			setState: mockNexusSetState,
		},
	),
}));

import { useCloudSync } from "./useCloudSync";

const defaultArgs = (): Parameters<typeof useCloudSync> => [
	[],
	vi.fn(),
	{},
	vi.fn(),
	[],
	vi.fn(),
	[],
	vi.fn(),
];

describe("useCloudSync", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		Object.defineProperty(navigator, "onLine", {
			value: true,
			writable: true,
			configurable: true,
		});
	});

	afterEach(() => {
		localStorage.clear();
	});

	// ─── 1. authService.init se llama al montar ──────────────────────────────
	it("llama a authService.init al montar el hook", () => {
		mockAuthService.init.mockImplementation(() => {});

		renderHook(() => useCloudSync(...defaultArgs()));

		expect(mockAuthService.init).toHaveBeenCalledOnce();
		expect(typeof mockAuthService.init.mock.calls[0]![0]).toBe("function");
	});

	// ─── 2. Login anónimo si uid es null en el callback ──────────────────────
	it("realiza login anónimo si uid es null en el callback de init", async () => {
		const anonUid = "anon-uid-123";
		mockAuthService.signInAnonymously.mockResolvedValue(anonUid);
		mockAuthService.init.mockImplementation(
			(cb: (uid: string | null) => void) => {
				cb(null);
			},
		);

		const { result } = renderHook(() => useCloudSync(...defaultArgs()));

		await waitFor(() => {
			expect(mockAuthService.signInAnonymously).toHaveBeenCalledOnce();
		});

		await waitFor(() => {
			expect(result.current.userId).toBe(anonUid);
		});
	});

	it("no hace login anónimo si uid ya está presente en el callback", async () => {
		const existingUid = "existing-uid-456";
		mockAuthService.init.mockImplementation(
			(cb: (uid: string | null) => void) => {
				cb(existingUid);
			},
		);

		const { result } = renderHook(() => useCloudSync(...defaultArgs()));

		await waitFor(() => {
			expect(result.current.userId).toBe(existingUid);
		});

		expect(mockAuthService.signInAnonymously).not.toHaveBeenCalled();
	});

	// ─── 3. syncNow llama a syncService.syncToCloud ──────────────────────────
	it("syncNow llama a syncService.syncToCloud con userId y datos válidos", async () => {
		const uid = "user-789";
		mockAuthService.init.mockImplementation(
			(cb: (uid: string | null) => void) => {
				cb(uid);
			},
		);
		mockSyncService.syncToCloud.mockResolvedValue(true);

		const { result } = renderHook(() => useCloudSync(...defaultArgs()));

		await waitFor(() => {
			expect(result.current.userId).toBe(uid);
		});

		await act(async () => {
			await result.current.syncNow();
		});

		expect(mockSyncService.syncToCloud).toHaveBeenCalledOnce();
		expect(mockSyncService.syncToCloud.mock.calls[0]![0]).toBe(uid);
		expect(result.current.syncStatus).toBe("success");
	});

	it("syncNow no llama a syncService si userId es null", async () => {
		mockAuthService.init.mockImplementation(() => {
			// No invoca callback — userId queda null
		});

		const { result } = renderHook(() => useCloudSync(...defaultArgs()));

		await act(async () => {
			await result.current.syncNow();
		});

		expect(mockSyncService.syncToCloud).not.toHaveBeenCalled();
	});

	// ─── 4. Manejo de errores sin lanzar al componente ───────────────────────
	it("maneja error de syncToCloud sin lanzar excepción, syncStatus queda en error", async () => {
		const uid = "user-err";
		mockAuthService.init.mockImplementation(
			(cb: (uid: string | null) => void) => {
				cb(uid);
			},
		);
		mockSyncService.syncToCloud.mockRejectedValue(new Error("Firebase down"));

		const { result } = renderHook(() => useCloudSync(...defaultArgs()));

		await waitFor(() => expect(result.current.userId).toBe(uid));

		await act(async () => {
			await expect(result.current.syncNow()).resolves.toBeUndefined();
		});

		expect(result.current.syncStatus).toBe("error");
	});

	it("cuando syncToCloud devuelve false, syncStatus queda en error", async () => {
		const uid = "user-false";
		mockAuthService.init.mockImplementation(
			(cb: (uid: string | null) => void) => {
				cb(uid);
			},
		);
		mockSyncService.syncToCloud.mockResolvedValue(false);

		const { result } = renderHook(() => useCloudSync(...defaultArgs()));

		await waitFor(() => expect(result.current.userId).toBe(uid));

		await act(async () => {
			await result.current.syncNow();
		});

		expect(result.current.syncStatus).toBe("error");
	});

	// ─── 5. restoreFromCloud recupera datos y los aplica al store ────────────
	it("restoreFromCloud llama a getFromCloud y aplica datos al store/state", async () => {
		const uid = "user-restore";
		mockAuthService.init.mockImplementation(
			(cb: (uid: string | null) => void) => {
				cb(uid);
			},
		);

		const setPresenciales = vi.fn();
		const setCalendarEvents = vi.fn();
		const setTasks = vi.fn();
		const setSchedule = vi.fn();

		const remoteData = {
			subjectData: {},
			presenciales: [
				{
					id: "p1",
					date: "2026-03-24",
					activity: "Clase",
					area: "Informática",
					includesEval: false,
					sede: "Central",
					hours: "2",
				},
			],
			calendarEvents: { "2026-03-24": [{ title: "Examen", time: "10:00" }] },
			tasks: [
				{
					id: "t1",
					title: "Tarea 1",
					subjectId: "s1",
					dueDate: "2026-03-30",
					priority: "alta" as const,
					status: "todo" as const,
					subtasks: [],
				},
			],
			schedule: [{ id: "sc1", subjectId: "s1", day: 1 }],
			lastUpdated: Date.now(),
		};

		mockSyncService.getFromCloud.mockResolvedValue(remoteData);

		const args: Parameters<typeof useCloudSync> = [
			[],
			setPresenciales,
			{},
			setCalendarEvents,
			[],
			setTasks,
			[],
			setSchedule,
		];

		const { result } = renderHook(() => useCloudSync(...args));

		await waitFor(() => expect(result.current.userId).toBe(uid));

		await act(async () => {
			await result.current.restoreFromCloud();
		});

		expect(mockSyncService.getFromCloud).toHaveBeenCalledWith(uid);
		expect(setPresenciales).toHaveBeenCalledWith(remoteData.presenciales);
		expect(setCalendarEvents).toHaveBeenCalledWith(remoteData.calendarEvents);
		expect(setTasks).toHaveBeenCalledWith(remoteData.tasks);
		expect(setSchedule).toHaveBeenCalledWith(remoteData.schedule);
		expect(result.current.syncStatus).toBe("success");
	});

	it("restoreFromCloud maneja error sin lanzar excepción, syncStatus queda en error", async () => {
		const uid = "user-restore-err";
		mockAuthService.init.mockImplementation(
			(cb: (uid: string | null) => void) => {
				cb(uid);
			},
		);
		mockSyncService.getFromCloud.mockRejectedValue(new Error("Network error"));

		const { result } = renderHook(() => useCloudSync(...defaultArgs()));

		await waitFor(() => expect(result.current.userId).toBe(uid));

		await act(async () => {
			await expect(result.current.restoreFromCloud()).resolves.toBeUndefined();
		});

		expect(result.current.syncStatus).toBe("error");
	});

	it("restoreFromCloud no hace nada si userId es null", async () => {
		mockAuthService.init.mockImplementation(() => {});

		const { result } = renderHook(() => useCloudSync(...defaultArgs()));

		await act(async () => {
			await result.current.restoreFromCloud();
		});

		expect(mockSyncService.getFromCloud).not.toHaveBeenCalled();
	});

	// ─── 6. isConfigured refleja si hay userId ───────────────────────────────
	it("isConfigured es false cuando userId es null", () => {
		mockAuthService.init.mockImplementation(() => {});
		const { result } = renderHook(() => useCloudSync(...defaultArgs()));
		expect(result.current.isConfigured).toBe(false);
	});

	it("isConfigured es true cuando hay userId", async () => {
		const uid = "user-cfg";
		mockAuthService.init.mockImplementation(
			(cb: (uid: string | null) => void) => {
				cb(uid);
			},
		);

		const { result } = renderHook(() => useCloudSync(...defaultArgs()));

		await waitFor(() => {
			expect(result.current.isConfigured).toBe(true);
		});
	});
	// ─── 7. Flujo offline→online (TS-04/#272) ────────────────────────────────
	describe("flujo offline → online", () => {
		it("syncNow encola en localStorage cuando navigator.onLine es false", async () => {
			const uid = "user-offline";
			mockAuthService.init.mockImplementation(
				(cb: (uid: string | null) => void) => {
					cb(uid);
				},
			);
			Object.defineProperty(navigator, "onLine", {
				value: false,
				writable: true,
				configurable: true,
			});

			const { result } = renderHook(() => useCloudSync(...defaultArgs()));
			await waitFor(() => expect(result.current.userId).toBe(uid));

			await act(async () => {
				await result.current.syncNow();
			});

			// No llamó a syncToCloud — estaba offline
			expect(mockSyncService.syncToCloud).not.toHaveBeenCalled();
			// Los datos quedaron encolados en localStorage
			expect(localStorage.getItem("lti_sync_queue")).not.toBeNull();
		});

		it("el evento online procesa la cola y llama a syncToCloud", async () => {
			const uid = "user-online-event";
			mockAuthService.init.mockImplementation(
				(cb: (uid: string | null) => void) => {
					cb(uid);
				},
			);
			mockSyncService.syncToCloud.mockResolvedValue(true);

			// Pre-cargar cola con datos válidos
			const queuedData = {
				subjectData: {},
				presenciales: [],
				calendarEvents: {},
				tasks: [],
				schedule: [],
				lastUpdated: Date.now(),
			};
			localStorage.setItem("lti_sync_queue", JSON.stringify(queuedData));

			renderHook(() => useCloudSync(...defaultArgs()));
			await waitFor(() => expect(mockAuthService.init).toHaveBeenCalled());
			// Esperar que userId se setee via callback
			await act(async () => {
				// simular que el callback de authService.init se ejecuta
			});

			// Simular evento online
			await act(async () => {
				window.dispatchEvent(new Event("online"));
				// Dar tiempo para que el handler async se ejecute
				await new Promise((r) => setTimeout(r, 0));
			});

			// syncToCloud fue llamado con los datos de la cola
			await waitFor(() => {
				expect(mockSyncService.syncToCloud).toHaveBeenCalled();
			});
		});

		it("el evento online con datos de schema inválido no llama a syncToCloud", async () => {
			const uid = "user-invalid-queue";
			mockAuthService.init.mockImplementation(
				(cb: (uid: string | null) => void) => {
					cb(uid);
				},
			);

			// Cola con datos inválidos (falta lastUpdated)
			localStorage.setItem(
				"lti_sync_queue",
				JSON.stringify({ invalid: "data", noLastUpdated: true }),
			);

			renderHook(() => useCloudSync(...defaultArgs()));

			await act(async () => {
				window.dispatchEvent(new Event("online"));
				await new Promise((r) => setTimeout(r, 0));
			});

			// Los datos inválidos no se envían a la nube
			expect(mockSyncService.syncToCloud).not.toHaveBeenCalled();
			// void uid — solo para que el lint no se queje
			void uid;
		});

		it("cuando syncToCloud online tiene éxito, limpia la cola de localStorage", async () => {
			const uid = "user-queue-clear";
			mockAuthService.init.mockImplementation(
				(cb: (uid: string | null) => void) => {
					cb(uid);
				},
			);
			mockSyncService.syncToCloud.mockResolvedValue(true);

			const queuedData = {
				subjectData: {},
				presenciales: [],
				lastUpdated: Date.now(),
			};
			localStorage.setItem("lti_sync_queue", JSON.stringify(queuedData));

			renderHook(() => useCloudSync(...defaultArgs()));

			await act(async () => {
				window.dispatchEvent(new Event("online"));
				await new Promise((r) => setTimeout(r, 10));
			});

			await waitFor(() => {
				expect(mockSyncService.syncToCloud).toHaveBeenCalled();
			});

			// La cola fue limpiada tras el sync exitoso
			expect(localStorage.getItem("lti_sync_queue")).toBeNull();
		});

		it("syncNow cancela un sync anterior en-flight (AbortController)", async () => {
			const uid = "user-abort";
			mockAuthService.init.mockImplementation(
				(cb: (uid: string | null) => void) => {
					cb(uid);
				},
			);

			// El primer sync tarda — el segundo lo cancela
			let resolveFirst!: (v: boolean) => void;
			const firstSyncPromise = new Promise<boolean>(
				(resolve) => (resolveFirst = resolve),
			);
			mockSyncService.syncToCloud
				.mockReturnValueOnce(firstSyncPromise)
				.mockResolvedValue(true);

			const { result } = renderHook(() => useCloudSync(...defaultArgs()));
			await waitFor(() => expect(result.current.userId).toBe(uid));

			// Lanzar primer sync (no esperamos — queda pendiente)
			act(() => {
				void result.current.syncNow();
			});

			// Lanzar segundo sync (debería abortar el primero)
			await act(async () => {
				await result.current.syncNow();
			});

			// Resolver el primer sync DESPUÉS de que ya fue abortado
			resolveFirst(true);

			// El estado final corresponde al segundo sync
			expect(result.current.syncStatus).toBe("success");
			// syncToCloud fue llamado dos veces
			expect(mockSyncService.syncToCloud).toHaveBeenCalledTimes(2);
		});
	});
});
