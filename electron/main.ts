import { BrowserWindow, app, ipcMain } from "electron";
import { join } from "node:path";
import {
	type ConfigStore,
	makeConfigHandlers,
} from "./handlers/configHandlers";

const DEV_URL = "http://localhost:5173";
const PROD_HTML = join(__dirname, "../dist/index.html");
const isDev = !app.isPackaged;

// ── Store de configuración ────────────────────────────────────────────────────
// electron-store se importa dinámicamente para compatibilidad con ESM.
// La clave de cifrado viene de variable de entorno en dev;
// en producción se deberá usar el OS keychain (Fase B+).
async function initStore() {
	const { default: Store } = await import("electron-store");
	// Cast a ConfigStore: conf usa ESM exports map que "moduleResolution: node" no resuelve,
	// por lo que get/set no son visibles en el tipo inferido. El cast es seguro porque
	// electron-store extiende conf que implementa exactamente esa interfaz.
	const store = new Store<Record<string, string>>({
		name: "cortex-config",
		encryptionKey: process.env.CORTEX_MASTER_SECRET ?? "dev-only-key",
	}) as unknown as ConfigStore;

	// Migración desde .env: si hay variables de entorno de API keys,
	// importarlas al store en el primer arranque y no volver a migrar.
	const envKeys = ["VITE_GOOGLE_AI_API_KEY", "VITE_FIREBASE_API_KEY"] as const;
	for (const envKey of envKeys) {
		const storeKey = envKey.replace("VITE_", "").toLowerCase();
		if (process.env[envKey] && !store.get(storeKey)) {
			store.set(storeKey, process.env[envKey] as string);
		}
	}

	return store;
}

// ── Ventana principal ─────────────────────────────────────────────────────────
function createWindow(): void {
	const win = new BrowserWindow({
		width: 1280,
		height: 800,
		minWidth: 900,
		minHeight: 600,
		webPreferences: {
			preload: join(__dirname, "preload.js"),
			nodeIntegration: false,
			contextIsolation: true,
			sandbox: true,
		},
	});

	if (isDev) {
		win.loadURL(DEV_URL);
	} else {
		win.loadFile(PROD_HTML);
	}
}

// ── Arranque ──────────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
	const store = await initStore();
	const config = makeConfigHandlers(store);

	ipcMain.handle("config:set", (_event, key: string, value: string) =>
		config.configSet(key, value),
	);
	ipcMain.handle("config:get", (_event, key: string) =>
		config.configGet(key),
	);

	createWindow();

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
