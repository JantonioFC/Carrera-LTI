/// <reference types="vitest" />

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import electron from "vite-plugin-electron/simple";
import { defineConfig } from "vitest/config";

// El plugin de Electron solo se activa cuando se invoca en modo desktop.
// En modo web (vite dev) y en tests (vitest) permanece desactivado.
const isElectron = process.env.VITE_ELECTRON === "true";

export default defineConfig({
	plugins: [
		tailwindcss(),
		react(),
		...(isElectron
			? [
					electron({
						main: { entry: "electron/main.ts" },
						preload: { input: "electron/preload.ts" },
					}),
				]
			: []),
		VitePWA({
			registerType: "autoUpdate",
			includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
			manifest: {
				name: "Carrera LTI",
				short_name: "Carrera LTI",
				description:
					"Herramienta para estudiantes de la Licenciatura en Tecnologías de la Información (URU)",
				theme_color: "#0A192F",
				background_color: "#0A192F",
				display: "standalone",
				icons: [
					{
						src: "pwa-192x192.png",
						sizes: "192x192",
						type: "image/png",
					},
					{
						src: "pwa-512x512.png",
						sizes: "512x512",
						type: "image/png",
					},
					{
						src: "pwa-512x512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "any maskable",
					},
				],
			},
			workbox: {
				maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB
			},
		}),
	],
	server: {
		port: 5173,
	},
	build: {
		cssMinify: false,
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes("@google/genai")) return "vendor-ai";
					if (
						[
							"framer-motion",
							"recharts",
							"lucide-react",
							"@radix-ui/react-dialog",
							"@uiw/react-md-editor",
						].some((pkg) => id.includes(pkg))
					)
						return "vendor-ui";
				},
			},
		},
	},
	test: {
		environment: "jsdom",
		globals: true,
		include: ["src/**/*.test.{ts,tsx}"],
		setupFiles: ["./src/test/setup.tsx"],
	},
});
