import { BrowserWindow, app } from "electron";
import { join } from "node:path";

const DEV_URL = "http://localhost:5173";
const PROD_HTML = join(__dirname, "../dist/index.html");
const isDev = !app.isPackaged;

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

app.whenReady().then(() => {
	createWindow();

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
