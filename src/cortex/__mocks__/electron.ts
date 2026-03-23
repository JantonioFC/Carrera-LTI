import { vi } from "vitest";

/**
 * Mock centralizado de las APIs de Electron para tests.
 *
 * Uso en tests del Main Process:
 *   vi.mock("electron", () => import("../__mocks__/electron"))
 *
 * Uso en tests del Renderer (contextBridge):
 *   El mock de window.cortexAPI se construye con buildMockCortexAPI()
 *   en cada suite — no se importa Electron directamente en el Renderer.
 */

export const ipcMain = {
	handle: vi.fn(),
	on: vi.fn(),
	removeHandler: vi.fn(),
	off: vi.fn(),
};

export const ipcRenderer = {
	invoke: vi.fn(),
	on: vi.fn(),
	send: vi.fn(),
	removeAllListeners: vi.fn(),
};

export const app = {
	getPath: vi.fn().mockReturnValue("/tmp/test-app-data"),
	isPackaged: false,
	on: vi.fn(),
	whenReady: vi.fn().mockResolvedValue(undefined),
	quit: vi.fn(),
};

export const BrowserWindow = vi.fn().mockImplementation(() => ({
	loadURL: vi.fn(),
	loadFile: vi.fn(),
	on: vi.fn(),
	getAllWindows: vi.fn().mockReturnValue([]),
}));

export const contextBridge = {
	exposeInMainWorld: vi.fn(),
};

export const dialog = {
	showMessageBox: vi.fn().mockResolvedValue({ response: 0 }),
	showOpenDialog: vi.fn().mockResolvedValue({ canceled: true, filePaths: [] }),
};

export const systemPreferences = {
	askForMediaAccess: vi.fn().mockResolvedValue(true),
	getMediaAccessStatus: vi.fn().mockReturnValue("granted"),
};
