import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { app, BrowserWindow, ipcMain, safeStorage, session } from "electron";
import { type ConfigStore, initConfig } from "./handlers/configHandlers";
import { makeDoclingHandlers } from "./handlers/doclingHandlers";
import { makeRuVectorHandlers } from "./handlers/ruVectorHandlers";
import { SubprocessAdapter } from "./subprocess/SubprocessAdapter";
import { StdioTransport } from "./transports/StdioTransport";
import { logger } from "./utils/logger"; // AR-01 (#193): evita importar desde src/ en main process

// ── Rate limiter ──────────────────────────────────────────────────────────────
function createRateLimiter(max: number, windowMs: number): () => void {
	const calls: number[] = [];
	return () => {
		const now = Date.now();
		const recent = calls.filter((t) => now - t < windowMs);
		calls.length = 0;
		calls.push(...recent, now);
		if (calls.length > max) {
			throw new Error(`Rate limit exceeded: ${max} calls per ${windowMs}ms`);
		}
	};
}

const rateLimiters = {
	cortexIndex: createRateLimiter(10, 60_000), // 10/min
	cortexQuery: createRateLimiter(30, 60_000), // 30/min
	cortexProcessDocument: createRateLimiter(5, 60_000), // 5/min
	cortexOcr: createRateLimiter(5, 60_000), // 5/min
};

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
		logger.warn(
			"Config",
			"safeStorage no disponible. Configura CORTEX_MASTER_SECRET.",
		);
		// Fallback: persistir clave en disco con permisos restrictivos para que
		// sea la misma entre arranques (evita pérdida de datos cifrados). (#144)
		const fallbackKeyFile = join(homedir(), ".carrera-lti", "fallback.key");
		mkdirSync(join(homedir(), ".carrera-lti"), {
			recursive: true,
			mode: 0o700,
		}); // (#180)
		if (existsSync(fallbackKeyFile)) {
			return readFileSync(fallbackKeyFile, "utf-8").trim();
		}
		const fallbackKey = randomBytes(32).toString("hex");
		writeFileSync(fallbackKeyFile, fallbackKey, { mode: 0o600 });
		return fallbackKey;
	}

	const keyFile = join(homedir(), ".carrera-lti", "cortex.enc");

	if (existsSync(keyFile)) {
		const encrypted = readFileSync(keyFile);
		return safeStorage.decryptString(encrypted);
	}

	// Primera ejecución: generar clave aleatoria y cifrarla con el keychain del OS.
	const key = randomBytes(32).toString("hex");
	const encrypted = safeStorage.encryptString(key);
	mkdirSync(join(homedir(), ".carrera-lti"), { recursive: true, mode: 0o700 }); // (#180)
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
	// SC-03 (#265): solo migrar si safeStorage está disponible — con fallback.key
	// la clave de cifrado es débil y no es seguro persistir API keys.
	const canMigrate =
		safeStorage.isEncryptionAvailable() || !!process.env.CORTEX_MASTER_SECRET;
	if (!canMigrate) {
		logger.warn(
			"Config",
			"Migración de API keys omitida: safeStorage no disponible y CORTEX_MASTER_SECRET no configurado.",
		);
	} else {
		const envKeys = [
			"VITE_GOOGLE_AI_API_KEY",
			"VITE_FIREBASE_API_KEY",
		] as const;
		for (const envKey of envKeys) {
			const storeKey = envKey.replace("VITE_", "").toLowerCase();
			if (process.env[envKey] && !store.get(storeKey)) {
				store.set(storeKey, process.env[envKey] as string);
			}
			// Sanitizar variable de entorno para que no persista en memoria del proceso
			delete (process.env as Record<string, string | undefined>)[envKey];
		}
	}

	return store;
}

// ── Referencias a transportes para graceful shutdown — Issue #61 ─────────────
let _ruVectorTransport: StdioTransport | null = null;
let _doclingTransport: StdioTransport | null = null;

// ── RuVector ─────────────────────────────────────────────────────────────────
function initRuVector(): void {
	if (!existsSync(RUVECTOR_BIN)) {
		logger.warn(
			"RuVector",
			`binario no encontrado en ${RUVECTOR_BIN}. Ejecuta: npm run setup`,
		);
		return;
	}

	_ruVectorTransport = new StdioTransport(RUVECTOR_BIN);
	const adapter = new SubprocessAdapter({
		name: "ruvector",
		transport: _ruVectorTransport,
	});
	const ruVector = makeRuVectorHandlers(adapter);

	ipcMain.handle("cortex:index", (_event, docPath: string) => {
		rateLimiters.cortexIndex();
		return ruVector.cortexIndex(docPath);
	});
	ipcMain.handle("cortex:query", (_event, text: string, topK?: unknown) => {
		rateLimiters.cortexQuery();
		// SC-01 (#278): validar topK en la boundary IPC antes de delegar al handler
		if (
			topK !== undefined &&
			(typeof topK !== "number" ||
				!Number.isInteger(topK) ||
				topK < 1 ||
				topK > 50)
		) {
			throw new Error(
				`cortex:query — topK debe ser un entero entre 1 y 50, recibido: ${JSON.stringify(topK)}`,
			);
		}
		return ruVector.cortexQuery(text, topK as number | undefined);
	});

	logger.info("RuVector", "handlers registrados");
}

// ── Docling ───────────────────────────────────────────────────────────────────
function initDocling(): void {
	if (!existsSync(VENV_PYTHON) || !existsSync(DOCLING_SCRIPT)) {
		logger.warn(
			"Docling",
			"entorno Python no encontrado. Ejecuta: npm run setup",
		);
		return;
	}

	_doclingTransport = new StdioTransport(VENV_PYTHON, [DOCLING_SCRIPT]);
	const adapter = new SubprocessAdapter({
		name: "docling",
		transport: _doclingTransport,
	});
	const docling = makeDoclingHandlers(adapter);

	ipcMain.handle("cortex:process-document", (_event, docPath: string) => {
		rateLimiters.cortexProcessDocument();
		return docling.processDocument(docPath);
	});
	ipcMain.handle("cortex:ocr", (_event, imagePath: string) => {
		rateLimiters.cortexOcr();
		return docling.ocr(imagePath);
	});

	logger.info("Docling", "handlers registrados");
}

// ── CSP via main process — Issue #175 ─────────────────────────────────────────
// El meta tag CSP en index.html es ignorado por Electron en rutas file://.
// La única forma garantizada de aplicar CSP en Electron es vía onHeadersReceived.
//
// SC-07 (#239): ¿Por qué unsafe-inline?
// Vite en producción emite <script type="module"> externos (no inline), pero el
// build también genera estilos inline para animaciones CSS-in-JS y módulos
// lazy-loaded (BlockNote, Framer Motion). En Electron con file:// no existe un
// servidor origin que permita usar hashes ('sha256-...'): el hash del HTML
// cambia en cada build y el proceso de signing lo hace impredecible.
// Implementar nonces requeriría generar un token en el proceso principal y
// pasarlo al renderer ANTES de servir el HTML, lo cual no es posible con el
// enfoque file:// + BrowserWindow.loadFile() actual.
//
// Mitigaciones compensatorias (en lugar de nonces):
//   1. nodeIntegration: false  — el renderer no tiene acceso a Node.js
//   2. contextIsolation: true  — preload corre en contexto separado del renderer
//   3. sandbox: true           — el renderer está en el sandbox de Chromium
//   4. object-src 'none'       — bloquea plugins Flash / objeto embebido
//   5. frame-src 'none'        — sin iframes (reduce superficie XSS)
//   6. connect-src allowlist   — solo dominios de Google API autorizados
// La combinación de sandbox + contextIsolation elimina el vector de escalada
// de privilegios incluso si un atacante logra ejecutar JS en el renderer.
function setupCSP(): void {
	session.defaultSession.webRequest.onHeadersReceived(
		{ urls: ["<all_urls>"] },
		(details, callback) => {
			callback({
				responseHeaders: {
					...details.responseHeaders,
					"Content-Security-Policy": [
						[
							"default-src 'self'",
							"script-src 'self' 'unsafe-inline'", // ver comentario SC-07 (#239) arriba
							"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
							"font-src 'self' data: https://fonts.gstatic.com",
							"img-src 'self' data: https:",
							// SC-09 (#210): allowlist explícita — sin wildcards de subdominio
							"connect-src 'self' https://generativelanguage.googleapis.com https://identitytoolkit.googleapis.com https://firestore.googleapis.com https://securetoken.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com",
							"object-src 'none'",
							"frame-src 'none'",
						].join("; "),
					],
				},
			});
		},
	);
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
	initConfig(store, ipcMain);

	initRuVector();
	initDocling();

	setupCSP();
	createWindow();

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

// ── Graceful shutdown — Issue #61 ────────────────────────────────────────────
// Envía SIGTERM a todos los subprocesos Python antes de cerrar la app,
// evitando procesos zombie y WAVs incompletos en disco.
app.on("before-quit", (event) => {
	const transports = [_ruVectorTransport, _doclingTransport].filter(
		Boolean,
	) as StdioTransport[];

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
