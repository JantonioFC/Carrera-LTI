import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { app, BrowserWindow, ipcMain } from "electron";
import { SubprocessAdapter } from "../src/cortex/subprocess/SubprocessAdapter";
import {
	type ConfigStore,
	makeConfigHandlers,
} from "./handlers/configHandlers";
import { makeRuVectorHandlers } from "./handlers/ruVectorHandlers";
import { StdioTransport } from "./transports/StdioTransport";

const DEV_URL = "http://localhost:5173";
const PROD_HTML = join(__dirname, "../dist/index.html");
const isDev = !app.isPackaged;

// Ruta del binario RuVector instalado por npm run setup
const RUVECTOR_BIN = join(
	homedir(),
	".carrera-lti",
	"bin",
	process.platform === "win32" ? "ruvector.exe" : "ruvector",
);

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

// ── RuVector ─────────────────────────────────────────────────────────────────
// Registra los handlers IPC solo si el binario está instalado.
// Si no está, los canales no se registran y el renderer recibe un error
// de Electron al invocarlos (comportamiento esperado hasta instalar).
function initRuVector(): void {
	if (!existsSync(RUVECTOR_BIN)) {
		console.warn(
			`[RuVector] binario no encontrado en ${RUVECTOR_BIN}. Ejecuta: npm run setup`,
		);
		return;
	}

	const transport = new StdioTransport(RUVECTOR_BIN);
	const adapter = new SubprocessAdapter({ name: "ruvector", transport });
	const ruVector = makeRuVectorHandlers(adapter);

	ipcMain.handle("cortex:index", (_event, docPath: string) =>
		ruVector.cortexIndex(docPath),
	);
	ipcMain.handle("cortex:query", (_event, text: string, topK?: number) =>
		ruVector.cortexQuery(text, topK),
	);

	console.log("[RuVector] handlers registrados");
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
	ipcMain.handle("config:get", (_event, key: string) => config.configGet(key));

	initRuVector();

	createWindow();

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
