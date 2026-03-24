import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
	app,
	BrowserWindow,
	ipcMain,
	safeStorage,
	systemPreferences,
} from "electron";
import { SubprocessAdapter } from "../src/cortex/subprocess/SubprocessAdapter";
import {
	type ConfigStore,
	makeConfigHandlers,
} from "./handlers/configHandlers";
import { makeDoclingHandlers } from "./handlers/doclingHandlers";
import { makeObserverHandlers } from "./handlers/observerHandlers";
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
const OBSERVER_SCRIPT = join(SCRIPTS_DIR, "observer_runner.py");
const WHISPER_SCRIPT = join(SCRIPTS_DIR, "whisper_runner.py");
const OBSERVER_RECORDINGS_DIR = join(
	homedir(),
	".carrera-lti",
	"observer",
	"recordings",
);

// ── Encryption key via OS Keychain (safeStorage) — Issue #59 ─────────────────
// Genera una clave aleatoria en el primer arranque, la cifra con el keychain
// del OS (Keychain en macOS, DPAPI en Windows, libsecret en Linux) y la persiste
// en ~/.carrera-lti/cortex.enc. Fallback a CORTEX_MASTER_SECRET si safeStorage
// no está disponible (e.g. headless CI).
async function getEncryptionKey(): Promise<string> {
	if (process.env.CORTEX_MASTER_SECRET) {
		return process.env.CORTEX_MASTER_SECRET;
	}

	if (!safeStorage.isEncryptionAvailable()) {
		console.warn(
			"[Config] safeStorage no disponible. Configura CORTEX_MASTER_SECRET.",
		);
		// En CI o entornos sin keychain usamos una clave derivada del nombre del host
		// (no ideal, pero evita el fallback a literal "dev-only-key").
		return randomBytes(32).toString("hex");
	}

	const keyFile = join(homedir(), ".carrera-lti", "cortex.enc");

	if (existsSync(keyFile)) {
		const encrypted = readFileSync(keyFile);
		return safeStorage.decryptString(encrypted);
	}

	// Primera ejecución: generar clave aleatoria y cifrarla con el keychain del OS.
	const key = randomBytes(32).toString("hex");
	const encrypted = safeStorage.encryptString(key);
	mkdirSync(join(homedir(), ".carrera-lti"), { recursive: true });
	writeFileSync(keyFile, encrypted);
	return key;
}

// ── Store de configuración ────────────────────────────────────────────────────
async function initStore() {
	const { default: Store } = await import("electron-store");
	const encryptionKey = await getEncryptionKey();
	// Cast a ConfigStore: conf usa ESM exports map que "moduleResolution: node" no resuelve,
	// por lo que get/set no son visibles en el tipo inferido. El cast es seguro porque
	// electron-store extiende conf que implementa exactamente esa interfaz.
	const store = new Store<Record<string, string>>({
		name: "cortex-config",
		encryptionKey,
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

// ── Referencias a transportes para graceful shutdown — Issue #61 ─────────────
let _ruVectorTransport: StdioTransport | null = null;
let _doclingTransport: StdioTransport | null = null;
let _whisperTransport: StdioTransport | null = null;

// ── RuVector ─────────────────────────────────────────────────────────────────
function initRuVector(): void {
	if (!existsSync(RUVECTOR_BIN)) {
		console.warn(
			`[RuVector] binario no encontrado en ${RUVECTOR_BIN}. Ejecuta: npm run setup`,
		);
		return;
	}

	_ruVectorTransport = new StdioTransport(RUVECTOR_BIN);
	const adapter = new SubprocessAdapter({
		name: "ruvector",
		transport: _ruVectorTransport,
	});
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

	_doclingTransport = new StdioTransport(VENV_PYTHON, [DOCLING_SCRIPT]);
	const adapter = new SubprocessAdapter({
		name: "docling",
		transport: _doclingTransport,
	});
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

	_whisperTransport = new StdioTransport(VENV_PYTHON, [WHISPER_SCRIPT]);
	const adapter = new SubprocessAdapter({
		name: "whisper",
		transport: _whisperTransport,
	});
	const whisper = makeWhisperHandlers(adapter);

	ipcMain.handle(
		"cortex:transcribe",
		(_event, wavPath: string, model?: string) =>
			whisper.transcribe(wavPath, model),
	);

	console.log("[Whisper] handlers registrados");
}

// ── Observer AI ───────────────────────────────────────────────────────────────
function initObserver(): void {
	if (!existsSync(VENV_PYTHON) || !existsSync(OBSERVER_SCRIPT)) {
		console.warn(
			"[Observer] entorno Python no encontrado. Ejecuta: npm run setup",
		);
		return;
	}

	const observer = makeObserverHandlers(VENV_PYTHON, OBSERVER_SCRIPT, {
		recordingsDir: OBSERVER_RECORDINGS_DIR,
	});

	ipcMain.handle("observer:toggle", async (_event, active: boolean) => {
		// En macOS solicitar permiso de micrófono antes de capturar.
		if (active && process.platform === "darwin") {
			const granted = await systemPreferences.askForMediaAccess("microphone");
			if (!granted) {
				return { active: false, error: "Permiso de micrófono denegado" };
			}
		}
		return observer.toggle(active);
	});

	ipcMain.handle("observer:status", () => observer.status());

	console.log("[Observer] handlers registrados");
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
	initObserver();

	createWindow();

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

// ── Graceful shutdown — Issue #61 ────────────────────────────────────────────
// Envía SIGTERM a todos los subprocesos Python antes de cerrar la app,
// evitando procesos zombie y WAVs incompletos en disco.
app.on("before-quit", (event) => {
	const transports = [
		_ruVectorTransport,
		_doclingTransport,
		_whisperTransport,
	].filter(Boolean) as StdioTransport[];

	if (transports.length === 0) return;

	event.preventDefault();
	for (const t of transports) {
		try {
			t.kill("SIGTERM");
		} catch {
			// Ignorar si el proceso ya terminó
		}
	}
	// Dar 500ms para que los procesos terminen limpiamente antes de forzar el cierre
	setTimeout(() => app.quit(), 500);
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
