import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
	chmodSync,
	copyFileSync,
	existsSync,
	mkdirSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import {
	cancel,
	confirm,
	intro,
	isCancel,
	note,
	outro,
	password,
	select,
	spinner,
	text,
} from "@clack/prompts";
import pc from "picocolors";

const ROOT = process.cwd();
const ENV_PATH = join(ROOT, ".env");
const ENV_EXAMPLE_PATH = join(ROOT, ".env.example");
const GITIGNORE_PATH = join(ROOT, ".gitignore");

// --- Helpers ---

function validateNodeVersion() {
	const version = process.versions.node;
	const major = parseInt(version.split(".")[0], 10);
	if (major < 18) {
		cancel(
			`Node.js version ${version} detected. Carrera LTI requiere Node.js >= 18.0.0.`,
		);
		process.exit(1);
	}
}

async function handleEnvManagement() {
	if (existsSync(ENV_PATH)) {
		const choice = await select({
			message: "Se detectó un archivo .env existente. ¿Qué deseas hacer?",
			options: [
				{ value: "backup", label: "Copia de seguridad y nuevo (.env.bak)" },
				{ value: "update", label: "Actualizar valores faltantes" },
				{ value: "cancel", label: "Cancelar configuración" },
			],
		});

		if (isCancel(choice) || choice === "cancel") {
			cancel("Configuración cancelada.");
			process.exit(0);
		}

		if (choice === "backup") {
			const bakPath = `${ENV_PATH}.bak`;
			copyFileSync(ENV_PATH, bakPath);
			note(`Copia de seguridad creada en ${pc.cyan(bakPath)}`);
			// Empezar de nuevo con el ejemplo
			return {};
		}

		if (choice === "update") {
			const content = readFileSync(ENV_PATH, "utf-8");
			const lines = content.split("\n");
			const env = {};
			lines.forEach((line) => {
				const [key, ...val] = line.split("=");
				if (key && val)
					env[key.trim()] = val.join("=").trim().replace(/"/g, "");
			});
			return env;
		}
	}
	return {};
}

function saveEnv(env) {
	let content = "";
	// Usamos el .env.example como base para mantener el orden
	const exampleContent = readFileSync(ENV_EXAMPLE_PATH, "utf-8");
	const lines = exampleContent.split("\n");

	lines.forEach((line) => {
		const match = line.match(/^([A-Z0-9_]+)=/);
		if (match) {
			const key = match[1];
			const value = env[key] || "";
			content += `${key}="${value}"\n`;
		} else if (line.trim() === "" || line.startsWith("#")) {
			content += `${line}\n`;
		}
	});

	writeFileSync(ENV_PATH, `${content.trim()}\n`);
}

function checkGitignore() {
	if (existsSync(GITIGNORE_PATH)) {
		const content = readFileSync(GITIGNORE_PATH, "utf-8");
		if (!content.includes(".env")) {
			return false;
		}
		return true;
	}
	return true; // Asumimos seguro si no hay gitignore
}

// --- RuVector ---

const RUVECTOR_VERSION = "0.1.0";
const RUVECTOR_DIR = join(homedir(), ".carrera-lti", "bin");
const RUVECTOR_BIN = join(
	RUVECTOR_DIR,
	process.platform === "win32" ? "ruvector.exe" : "ruvector",
);

const PLATFORM_MAP = {
	linux: "linux-x64",
	darwin: "darwin-x64",
	win32: "win32-x64",
};

// SHA-256 de cada binario — se actualiza con cada release de RuVector.
// "0000..." es un placeholder hasta que exista el primer release real.
const SHA256 = {
	"linux-x64":
		"0000000000000000000000000000000000000000000000000000000000000000",
	"darwin-x64":
		"0000000000000000000000000000000000000000000000000000000000000000",
	"win32-x64":
		"0000000000000000000000000000000000000000000000000000000000000000",
};

async function installRuVector() {
	if (existsSync(RUVECTOR_BIN)) {
		note(`RuVector ya instalado en ${pc.cyan(RUVECTOR_BIN)}`);
		return;
	}

	const platform = PLATFORM_MAP[process.platform];
	if (!platform) {
		note(
			pc.yellow(
				`Plataforma ${process.platform} no soportada. Instala RuVector manualmente.`,
			),
		);
		return;
	}

	const shouldInstall = await confirm({
		message:
			"RuVector (motor de búsqueda semántica) no está instalado. ¿Descargarlo ahora?",
		initialValue: true,
	});

	if (isCancel(shouldInstall) || !shouldInstall) {
		note(
			pc.yellow(
				"RuVector no instalado. La búsqueda semántica no estará disponible.",
			),
		);
		return;
	}

	const s = spinner();
	s.start("Descargando RuVector...");

	try {
		mkdirSync(RUVECTOR_DIR, { recursive: true });

		const ext = process.platform === "win32" ? ".exe" : "";
		const url = `https://github.com/JantonioFC/Carrera-LTI/releases/download/ruvector-${RUVECTOR_VERSION}/ruvector-${platform}${ext}`;
		const res = await fetch(url);
		if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

		const buffer = await res.arrayBuffer();
		const bytes = new Uint8Array(buffer);

		// Verificar checksum SHA-256
		const hash = createHash("sha256").update(bytes).digest("hex");
		const expected = SHA256[platform];
		if (hash !== expected) {
			throw new Error(
				`Checksum inválido: esperado ${expected}, obtenido ${hash}`,
			);
		}

		await writeFile(RUVECTOR_BIN, bytes);

		if (process.platform !== "win32") {
			chmodSync(RUVECTOR_BIN, 0o755);
		}

		s.stop(`RuVector instalado en ${pc.cyan(RUVECTOR_BIN)}`);
	} catch (err) {
		s.stop(pc.red(`Error al descargar RuVector: ${err.message}`));
		note(
			pc.yellow(
				`Descarga manual desde:\nhttps://github.com/JantonioFC/Carrera-LTI/releases/tag/ruvector-${RUVECTOR_VERSION}`,
			),
		);
	}
}

// --- Python (Docling + Whisper) ---

const VENV_DIR = join(homedir(), ".carrera-lti", "venv");
const VENV_PYTHON = join(
	VENV_DIR,
	"bin",
	process.platform === "win32" ? "python.exe" : "python",
);
const VENV_PIP = join(
	VENV_DIR,
	"bin",
	process.platform === "win32" ? "pip.exe" : "pip",
);

async function installPythonDeps() {
	const shouldInstall = await confirm({
		message:
			"¿Instalar herramientas de IA local (Docling + Whisper)? Requiere Python 3.10+ y ~2 GB de espacio.",
		initialValue: !existsSync(VENV_PYTHON),
	});

	if (isCancel(shouldInstall) || !shouldInstall) {
		note(
			pc.yellow(
				"Docling y Whisper no instalados. El procesamiento de documentos y transcripción no estarán disponibles.",
			),
		);
		return;
	}

	const s = spinner();

	// Verificar Python disponible
	s.start("Verificando Python 3...");
	try {
		execSync("python3 --version", { stdio: "ignore" });
		s.stop("Python 3 detectado.");
	} catch {
		s.stop(pc.red("Python 3 no encontrado en el PATH."));
		note(
			pc.yellow(
				"Instala Python 3.10+ desde https://python.org y vuelve a ejecutar el setup.",
			),
		);
		return;
	}

	// Crear virtualenv si no existe
	if (!existsSync(VENV_DIR)) {
		s.start("Creando entorno virtual Python...");
		try {
			execSync(`python3 -m venv "${VENV_DIR}"`, { stdio: "ignore" });
			s.stop(`Entorno virtual creado en ${pc.cyan(VENV_DIR)}`);
		} catch (err) {
			s.stop(pc.red(`Error al crear el entorno virtual: ${err.message}`));
			return;
		}
	} else {
		note(`Entorno virtual ya existe en ${pc.cyan(VENV_DIR)}`);
	}

	// Instalar dependencias Python
	s.start("Instalando Docling y Whisper (esto puede tardar varios minutos)...");
	try {
		execSync(
			`"${VENV_PIP}" install --quiet docling openai-whisper sounddevice`,
			{
				stdio: "ignore",
			},
		);
		s.stop("Docling y Whisper instalados con éxito.");
	} catch (err) {
		s.stop(pc.red(`Error al instalar dependencias Python: ${err.message}`));
		note(
			pc.yellow(
				`Instala manualmente con:\n${pc.cyan(`"${VENV_PIP}" install docling openai-whisper sounddevice`)}`,
			),
		);
	}
}

// --- Main Script ---

async function main() {
	validateNodeVersion();

	console.log(
		"\n" +
			pc.cyan(`
   ______                                    __  _________
  / ____/___ _____________  _________ _     / / /_  __/  _/
 / /   / __ \`/ ___/ ___/ _ \\/ ___/ __ \`/    / /   / /  / /
/ /___/ /_/ / /  / /  /  __/ /  / /_/ /    / /___/ / _/ /
\\____/\\__,_/_/  /_/   \\___/_/   \\__,_/    /_____/_/ /___/
  `),
	);

	intro(pc.bgCyan(pc.black(" Setup Wizard - Ecosistema Carrera LTI ")));

	// 1. Dependencias
	if (!existsSync(join(ROOT, "node_modules"))) {
		const shouldInstall = await confirm({
			message:
				"No se detectó la carpeta node_modules. ¿Deseas instalar las dependencias ahora?",
		});

		if (shouldInstall) {
			const s = spinner();
			s.start("Instalando dependencias (esto puede tardar unos minutos)...");
			try {
				execSync("npm install", { stdio: "ignore" });
				s.stop("Dependencias instaladas con éxito.");
			} catch (_e) {
				s.stop("Error al instalar dependencias.");
				cancel(
					"Por favor, instala las dependencias manualmente con `npm install` antes de continuar.",
				);
				process.exit(1);
			}
		}
	}

	const currentEnv = await handleEnvManagement();

	// 2. Módulo IA (Gemini)
	note(
		'Módulo IA: Gemini será el motor de tu "Segundo Cerebro" (Nexus/Aether).',
	);
	const geminiKey = await password({
		message: "Ingresa tu Gemini API Key:",
		placeholder: "AIza...",
		validate(value) {
			if (!value.startsWith("AIza")) return 'La clave debe comenzar con "AIza"';
			if (value.length < 30) return "La clave parece demasiado corta.";
		},
	});

	if (isCancel(geminiKey)) {
		cancel("Operación cancelada.");
		process.exit(0);
	}
	currentEnv.VITE_GEMINI_API_KEY = geminiKey;

	// 3. Módulo Comunicación (Gmail)
	note(`Módulo Comunicación: Configura el acceso a Gmail.
${pc.yellow("Recuerda:")}
Javascript Origin: ${pc.cyan("http://localhost:5173")}
Redirect URI: ${pc.cyan("http://localhost:5173/")} (¡No olvides la barra final!)`);

	const gmailClientId = await text({
		message: "Ingresa tu Gmail Client ID:",
		placeholder: "xxxx.apps.googleusercontent.com",
		initialValue: currentEnv.VITE_GMAIL_CLIENT_ID,
	});

	if (isCancel(gmailClientId)) {
		cancel("Operación cancelada.");
		process.exit(0);
	}

	const gmailApiKey = await password({
		message: "Ingresa tu Gmail API Key:",
		placeholder: "AIza...",
		validate(value) {
			if (!value.startsWith("AIza")) return 'La clave debe comenzar con "AIza"';
		},
	});

	if (isCancel(gmailApiKey)) {
		cancel("Operación cancelada.");
		process.exit(0);
	}

	const confirmedTestUser = await confirm({
		message:
			'¿Has agregado tu correo a la lista de "Test users" en la Google Cloud Console?',
	});

	if (!confirmedTestUser) {
		note(
			pc.yellow(
				"Ten en cuenta que la autenticación de Gmail no funcionará hasta que lo hagas.",
			),
		);
	}

	currentEnv.VITE_GMAIL_CLIENT_ID = gmailClientId;
	currentEnv.VITE_GMAIL_API_KEY = gmailApiKey;

	// 4. Módulo Cloud (Firebase)
	const useFirebase = await confirm({
		message:
			"¿Deseas configurar Firebase para sincronización en la nube? (Opcional)",
		initialValue: !!currentEnv.VITE_FIREBASE_API_KEY,
	});

	if (useFirebase) {
		const fbKeys = [
			{ key: "VITE_FIREBASE_API_KEY", label: "Firebase API Key" },
			{ key: "VITE_FIREBASE_AUTH_DOMAIN", label: "Auth Domain" },
			{ key: "VITE_FIREBASE_PROJECT_ID", label: "Project ID" },
			{ key: "VITE_FIREBASE_STORAGE_BUCKET", label: "Storage Bucket" },
			{
				key: "VITE_FIREBASE_MESSAGING_SENDER_ID",
				label: "Messaging Sender ID",
			},
			{
				key: "VITE_FIREBASE_APP_ID",
				label: "App ID (formato 1:xxx:web:xxx)",
				validate: (v) => (v.includes(":web:") ? undefined : "Formato inválido"),
			},
			{ key: "VITE_FIREBASE_MEASUREMENT_ID", label: "Measurement ID" },
		];

		for (const fb of fbKeys) {
			const val = await text({
				message: `Ingresa ${fb.label}:`,
				initialValue: currentEnv[fb.key],
				validate: fb.validate,
			});
			if (isCancel(val)) {
				cancel("Operación cancelada.");
				process.exit(0);
			}
			currentEnv[fb.key] = val;
		}
	} else {
		note(
			'Modo Local-First activado. El ícono de "Sync Cloud" estará deshabilitado.',
		);
		currentEnv.VITE_FIREBASE_API_KEY = "";
		currentEnv.VITE_FIREBASE_APP_ID = "";
		// Otros valores se quedan vacíos
	}

	// 5. Seguridad & Guardado
	const s = spinner();
	s.start("Generando archivo .env...");
	saveEnv(currentEnv);
	s.stop("Archivo .env generado con éxito.");

	if (!checkGitignore()) {
		const addIgnore = await confirm({
			message: "El archivo .env no está en .gitignore. ¿Deseas añadirlo ahora?",
		});
		if (addIgnore) {
			writeFileSync(
				GITIGNORE_PATH,
				`${readFileSync(GITIGNORE_PATH, "utf-8")}\n.env\n`,
			);
			note(".env añadido a .gitignore.");
		}
	}

	// 6. RuVector
	await installRuVector();

	// 7. Python (Docling + Whisper)
	await installPythonDeps();

	outro(pc.green("Tu sistema está listo para operar en Estado de Flow."));

	const runDev = await confirm({
		message: "¿Deseas iniciar la aplicación ahora? (npm run dev)",
	});

	if (runDev) {
		console.log(pc.cyan("\nIniciando servidor de desarrollo...\n"));
		execSync("npm run dev", { stdio: "inherit" });
	}
}

main().catch(console.error);
