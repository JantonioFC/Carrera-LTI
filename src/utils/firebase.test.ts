import { beforeEach, describe, expect, it, vi } from "vitest";

// Garantiza que hasFirebaseConfig sea true durante los tests (#174).
// En CI no existe .env, por lo que sin este stub firebase.ts no inicializa
// app/auth/db y los tests que dependen de ellos fallan.
(import.meta.env as Record<string, unknown>).VITE_FIREBASE_API_KEY =
	"test-api-key";
(import.meta.env as Record<string, unknown>).VITE_FIREBASE_PROJECT_ID =
	"test-project-id";

// --- Mocks ---

vi.mock("firebase/app", () => ({
	initializeApp: vi.fn(() => ({})),
}));

const mockOnAuthStateChanged = vi.fn();
const mockSignInAnonymously = vi.fn();
const mockGetAuth = vi.fn(() => ({}));

vi.mock("firebase/auth", () => ({
	getAuth: () => mockGetAuth(),
	onAuthStateChanged: (
		auth: unknown,
		cb: (user: { uid: string } | null) => void,
	) => mockOnAuthStateChanged(auth, cb),
	signInAnonymously: (auth: unknown) => mockSignInAnonymously(auth),
}));

const mockDoc = vi.fn((..._args: unknown[]) => ({}));
const mockSetDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockGetFirestore = vi.fn(() => ({}));

vi.mock("firebase/firestore", () => ({
	getFirestore: () => mockGetFirestore(),
	doc: (...args: unknown[]) => mockDoc(...args),
	setDoc: (...args: unknown[]) => mockSetDoc(...args),
	getDoc: (ref: unknown) => mockGetDoc(ref),
}));

vi.mock("./logger", () => ({
	logger: {
		warn: vi.fn(),
		error: vi.fn(),
	},
}));

// Stub all type-only imports from other modules so the module resolves cleanly
vi.mock("../data/lti", () => ({}));
vi.mock("../hooks/useSubjectData", () => ({}));
vi.mock("../pages/Horarios", () => ({}));
vi.mock("../pages/Tareas", () => ({}));
vi.mock("../services/types", () => ({}));
vi.mock("../store/aetherStore", () => ({}));
vi.mock("../store/nexusStore", () => ({}));

// --- Tests ---

describe("authService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("init — llama al callback con uid cuando hay usuario autenticado", async () => {
		mockOnAuthStateChanged.mockImplementation(
			(_auth: unknown, cb: (user: { uid: string } | null) => void) => {
				cb({ uid: "test-uid-123" });
			},
		);

		const { authService } = await import("./firebase");
		const callback = vi.fn();
		authService.init(callback);

		expect(callback).toHaveBeenCalledWith("test-uid-123");
	});

	it("init — llama al callback con null cuando no hay usuario", async () => {
		mockOnAuthStateChanged.mockImplementation(
			(_auth: unknown, cb: (user: null) => void) => {
				cb(null);
			},
		);

		const { authService } = await import("./firebase");
		const callback = vi.fn();
		authService.init(callback);

		expect(callback).toHaveBeenCalledWith(null);
	});

	it("signInAnonymously — retorna uid en éxito", async () => {
		mockSignInAnonymously.mockResolvedValue({ user: { uid: "anon-uid-456" } });

		const { authService } = await import("./firebase");
		const result = await authService.signInAnonymously();

		expect(result).toBe("anon-uid-456");
	});

	it("signInAnonymously — retorna null en fallo", async () => {
		mockSignInAnonymously.mockRejectedValue(new Error("auth error"));

		const { authService } = await import("./firebase");
		const result = await authService.signInAnonymously();

		expect(result).toBeNull();
	});
});

describe("syncService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// SC-02 (#256): AppData ya no contiene API keys — nunca se sincronizan a la nube.
	const baseData = {
		subjectData: {} as Record<string, unknown>,
		presenciales: [],
		lastUpdated: 1000,
	};

	it("syncToCloud — llama a setDoc con subjectData y lastUpdated", async () => {
		mockSetDoc.mockResolvedValue(undefined);
		mockDoc.mockReturnValue({ id: "users/user-1" });

		const { syncService } = await import("./firebase");
		const result = await syncService.syncToCloud("user-1", baseData as never);

		expect(result).toBe(true);
		expect(mockSetDoc).toHaveBeenCalledOnce();

		const [, dataArg] = mockSetDoc.mock.calls[0]!;
		expect(dataArg).toHaveProperty("subjectData");
		expect(dataArg).toHaveProperty("lastUpdated");
	});

	it("syncToCloud — retorna false si db es undefined", async () => {
		// Force db to be undefined by making getFirestore throw during module init
		mockGetFirestore.mockImplementation(() => {
			throw new Error("no db");
		});

		// Re-import to get a fresh module instance where db initialization fails
		vi.resetModules();
		const { syncService: freshSyncService } = await import("./firebase");
		const result = await freshSyncService.syncToCloud(
			"user-1",
			baseData as never,
		);

		expect(result).toBe(false);
	});

	it("getFromCloud — retorna datos si el snapshot existe", async () => {
		const cloudData = { subjectData: {}, presenciales: [], lastUpdated: 9999 };
		mockGetDoc.mockResolvedValue({
			exists: () => true,
			data: () => cloudData,
		});
		mockDoc.mockReturnValue({ id: "users/user-2" });

		// Reset modules to get a fresh instance with db available
		vi.resetModules();
		mockGetFirestore.mockReturnValue({});
		const { syncService: freshSyncService } = await import("./firebase");
		const result = await freshSyncService.getFromCloud("user-2");

		expect(result).toEqual(cloudData);
	});

	it("getFromCloud — retorna null si el snapshot no existe", async () => {
		mockGetDoc.mockResolvedValue({
			exists: () => false,
			data: () => null,
		});
		mockDoc.mockReturnValue({ id: "users/user-3" });

		vi.resetModules();
		mockGetFirestore.mockReturnValue({});
		const { syncService: freshSyncService } = await import("./firebase");
		const result = await freshSyncService.getFromCloud("user-3");

		expect(result).toBeNull();
	});
});
