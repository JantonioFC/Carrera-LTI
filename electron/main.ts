import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { app, BrowserWindow, ipcMain } from "electron";
import { SubprocessAdapter } from "../src/cortex/subprocess/SubprocessAdapter";
import {
	type ConfigStore,
	makeConfigHandlers,
} from "./handlers/configHandlers";
import { makeDoclingHandlers } from "./handlers/doclingHandlers";
import { makeRuVectorHandlers } from "./handlers/ruVectorHandlers";
import { makeWhisperHandlers } from "./handlers/whisperHandlers";
import { StdioTransport } from "./transports/StdioTransport";

const DEV_URL = "http://localhost:5173";
const PROD_HTML = join(__dirname, "../dist/index.html");
const isDev = !app.isPackaged;

// ── Rutas de binarios/scripts instalados por npm run setup ────────────────────
const CARRERA_BIN = join(homedir(), ".carrera-lti", "bin");
const RUVECTOR_BIN = join(
	CARRERA_BIN,
	process.platform === "win32" ? "ruvector.exe" : "ruvector",
);
const VENV_PYTHON = join(
	homedir(),
	".carrera-lti",
	"venv",
	"bin",
	process.platform === "win32" ? "python.exe" : "python",
);
// Scripts Python: en dev desde el proyecto, en prod desde resources
const SCRIPTS_DIR = isDev
	? join(process.cwd(), "scripts")
	: join(app.getAppPath(), "scripts");
const DOCLING_SCRIPT = join(SCRIPTS_DIR, "docling_runner.py");
const WHISPER_SCRIPT = join(SCRIPTS_DIR, "whisper_runner.py");

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

// ── Docling ───────────────────────────────────────────────────────────────────
function initDocling(): void {
	if (!existsSync(VENV_PYTHON) || !existsSync(DOCLING_SCRIPT)) {
		console.warn(
			"[Docling] entorno Python no encontrado. Ejecuta: npm run setup",
		);
		return;
	}

	const transport = new StdioTransport(VENV_PYTHON, [DOCLING_SCRIPT]);
	const adapter = new SubprocessAdapter({ name: "docling", transport });
	const docling = makeDoclingHandlers(adapter);

	ipcMain.handle("cortex:process-document", (_event, docPath: string) =>
		docling.processDocument(docPath),
	);
	ipcMain.handle("cortex:ocr", (_event, imagePath: string) =>
		docling.ocr(imagePath),
	);

	console.log("[Docling] handlers registrados");
}

// ── Whisper ───────────────────────────────────────────────────────────────────
function initWhisper(): void {
	if (!existsSync(VENV_PYTHON) || !existsSync(WHISPER_SCRIPT)) {
		console.warn(
			"[Whisper] entorno Python no encontrado. Ejecuta: npm run setup",
		);
		return;
	}

	const transport = new StdioTransport(VENV_PYTHON, [WHISPER_SCRIPT]);
	const adapter = new SubprocessAdapter({ name: "whisper", transport });
	const whisper = makeWhisperHandlers(adapter);

	ipcMain.handle(
		"cortex:transcribe",
		(_event, wavPath: string, model?: string) =>
			whisper.transcribe(wavPath, model),
	);

	console.log("[Whisper] handlers registrados");
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
	initDocling();
	initWhisper();

	createWindow();

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
