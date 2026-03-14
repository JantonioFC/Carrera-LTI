import { intro, outro, text, password, select, spinner, note, isCancel, cancel, confirm } from '@clack/prompts';
import pc from 'picocolors';
import { existsSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const ENV_PATH = join(ROOT, '.env');
const ENV_EXAMPLE_PATH = join(ROOT, '.env.example');
const GITIGNORE_PATH = join(ROOT, '.gitignore');

// --- Helpers ---

function validateNodeVersion() {
  const version = process.versions.node;
  const major = parseInt(version.split('.')[0], 10);
  if (major < 18) {
    cancel(`Node.js version ${version} detected. Carrera LTI requiere Node.js >= 18.0.0.`);
    process.exit(1);
  }
}

async function handleEnvManagement() {
  if (existsSync(ENV_PATH)) {
    const choice = await select({
      message: 'Se detectó un archivo .env existente. ¿Qué deseas hacer?',
      options: [
        { value: 'backup', label: 'Copia de seguridad y nuevo (.env.bak)' },
        { value: 'update', label: 'Actualizar valores faltantes' },
        { value: 'cancel', label: 'Cancelar configuración' },
      ],
    });

    if (isCancel(choice) || choice === 'cancel') {
        cancel('Configuración cancelada.');
        process.exit(0);
    }

    if (choice === 'backup') {
      const bakPath = `${ENV_PATH}.bak`;
      copyFileSync(ENV_PATH, bakPath);
      note(`Copia de seguridad creada en ${pc.cyan(bakPath)}`);
      // Empezar de nuevo con el ejemplo
      return {};
    }

    if (choice === 'update') {
      const content = readFileSync(ENV_PATH, 'utf-8');
      const lines = content.split('\n');
      const env = {};
      lines.forEach(line => {
        const [key, ...val] = line.split('=');
        if (key && val) env[key.trim()] = val.join('=').trim().replace(/"/g, '');
      });
      return env;
    }
  }
  return {};
}

function saveEnv(env) {
  let content = '';
  // Usamos el .env.example como base para mantener el orden
  const exampleContent = readFileSync(ENV_EXAMPLE_PATH, 'utf-8');
  const lines = exampleContent.split('\n');
  
  lines.forEach(line => {
    const match = line.match(/^([A-Z0-9_]+)=/);
    if (match) {
      const key = match[1];
      const value = env[key] || '';
      content += `${key}="${value}"\n`;
    } else if (line.trim() === '' || line.startsWith('#')) {
      content += `${line}\n`;
    }
  });

  writeFileSync(ENV_PATH, content.trim() + '\n');
}

function checkGitignore() {
  if (existsSync(GITIGNORE_PATH)) {
    const content = readFileSync(GITIGNORE_PATH, 'utf-8');
    if (!content.includes('.env')) {
      return false;
    }
    return true;
  }
  return true; // Asumimos seguro si no hay gitignore
}

// --- Main Script ---

async function main() {
  validateNodeVersion();

  console.log('\n' + pc.cyan(`
   ______                                    __  _________
  / ____/___ _____________  _________ _     / / /_  __/  _/
 / /   / __ \`/ ___/ ___/ _ \\/ ___/ __ \`/    / /   / /  / /
/ /___/ /_/ / /  / /  /  __/ /  / /_/ /    / /___/ / _/ /
\\____/\\__,_/_/  /_/   \\___/_/   \\__,_/    /_____/_/ /___/
  `));

  intro(pc.bgCyan(pc.black(' Setup Wizard - Ecosistema Carrera LTI ')));

  // 1. Dependencias
  if (!existsSync(join(ROOT, 'node_modules'))) {
    const shouldInstall = await confirm({
      message: 'No se detectó la carpeta node_modules. ¿Deseas instalar las dependencias ahora?',
    });

    if (shouldInstall) {
      const s = spinner();
      s.start('Instalando dependencias (esto puede tardar unos minutos)...');
      try {
        execSync('npm install', { stdio: 'ignore' });
        s.stop('Dependencias instaladas con éxito.');
      } catch (e) {
        s.stop('Error al instalar dependencias.');
        cancel('Por favor, instala las dependencias manualmente con `npm install` antes de continuar.');
        process.exit(1);
      }
    }
  }

  const currentEnv = await handleEnvManagement();

  // 2. Módulo IA (Gemini)
  note('Módulo IA: Gemini será el motor de tu "Segundo Cerebro" (Nexus/Aether).');
  const geminiKey = await password({
    message: 'Ingresa tu Gemini API Key:',
    placeholder: 'AIza...',
    validate(value) {
      if (!value.startsWith('AIza')) return 'La clave debe comenzar con "AIza"';
      if (value.length < 30) return 'La clave parece demasiado corta.';
    },
  });

  if (isCancel(geminiKey)) {
    cancel('Operación cancelada.');
    process.exit(0);
  }
  currentEnv.VITE_GEMINI_API_KEY = geminiKey;

  // 3. Módulo Comunicación (Gmail)
  note(`Módulo Comunicación: Configura el acceso a Gmail.
${pc.yellow('Recuerda:')}
Javascript Origin: ${pc.cyan('http://localhost:5173')}
Redirect URI: ${pc.cyan('http://localhost:5173/')} (¡No olvides la barra final!)`);

  const gmailClientId = await text({
    message: 'Ingresa tu Gmail Client ID:',
    placeholder: 'xxxx.apps.googleusercontent.com',
    initialValue: currentEnv.VITE_GMAIL_CLIENT_ID,
  });

  if (isCancel(gmailClientId)) {
    cancel('Operación cancelada.');
    process.exit(0);
  }

  const gmailApiKey = await password({
    message: 'Ingresa tu Gmail API Key:',
    placeholder: 'AIza...',
    validate(value) {
      if (!value.startsWith('AIza')) return 'La clave debe comenzar con "AIza"';
    },
  });

  if (isCancel(gmailApiKey)) {
    cancel('Operación cancelada.');
    process.exit(0);
  }

  const confirmedTestUser = await confirm({
    message: '¿Has agregado tu correo a la lista de "Test users" en la Google Cloud Console?',
  });

  if (!confirmedTestUser) {
    note(pc.yellow('Ten en cuenta que la autenticación de Gmail no funcionará hasta que lo hagas.'));
  }

  currentEnv.VITE_GMAIL_CLIENT_ID = gmailClientId;
  currentEnv.VITE_GMAIL_API_KEY = gmailApiKey;

  // 4. Módulo Cloud (Firebase)
  const useFirebase = await confirm({
    message: '¿Deseas configurar Firebase para sincronización en la nube? (Opcional)',
    initialValue: !!currentEnv.VITE_FIREBASE_API_KEY,
  });

  if (useFirebase) {
    const fbKeys = [
      { key: 'VITE_FIREBASE_API_KEY', label: 'Firebase API Key' },
      { key: 'VITE_FIREBASE_AUTH_DOMAIN', label: 'Auth Domain' },
      { key: 'VITE_FIREBASE_PROJECT_ID', label: 'Project ID' },
      { key: 'VITE_FIREBASE_STORAGE_BUCKET', label: 'Storage Bucket' },
      { key: 'VITE_FIREBASE_MESSAGING_SENDER_ID', label: 'Messaging Sender ID' },
      { key: 'VITE_FIREBASE_APP_ID', label: 'App ID (formato 1:xxx:web:xxx)', validate: (v) => v.includes(':web:') ? undefined : 'Formato inválido' },
      { key: 'VITE_FIREBASE_MEASUREMENT_ID', label: 'Measurement ID' },
    ];

    for (const fb of fbKeys) {
      const val = await text({
        message: `Ingresa ${fb.label}:`,
        initialValue: currentEnv[fb.key],
        validate: fb.validate,
      });
      if (isCancel(val)) {
        cancel('Operación cancelada.');
        process.exit(0);
      }
      currentEnv[fb.key] = val;
    }
  } else {
    note('Modo Local-First activado. El ícono de "Sync Cloud" estará deshabilitado.');
    currentEnv.VITE_FIREBASE_API_KEY = '';
    currentEnv.VITE_FIREBASE_APP_ID = '';
    // Otros valores se quedan vacíos
  }

  // 5. Seguridad & Guardado
  const s = spinner();
  s.start('Generando archivo .env...');
  saveEnv(currentEnv);
  s.stop('Archivo .env generado con éxito.');

  if (!checkGitignore()) {
    const addIgnore = await confirm({
      message: 'El archivo .env no está en .gitignore. ¿Deseas añadirlo ahora?',
    });
    if (addIgnore) {
      writeFileSync(GITIGNORE_PATH, readFileSync(GITIGNORE_PATH, 'utf-8') + '\n.env\n');
      note('.env añadido a .gitignore.');
    }
  }

  outro(pc.green('Tu sistema está listo para operar en Estado de Flow.'));

  const runDev = await confirm({
    message: '¿Deseas iniciar la aplicación ahora? (npm run dev)',
  });

  if (runDev) {
    console.log(pc.cyan('\nIniciando servidor de desarrollo...\n'));
    execSync('npm run dev', { stdio: 'inherit' });
  }
}

main().catch(console.error);
