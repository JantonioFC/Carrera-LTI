/// <reference types="vitest" />

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron/simple";
import { VitePWA } from "vite-plugin-pwa";
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
		cssMinify: true,
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes("@google/genai")) return "vendor-ai";
					if (id.includes("@blocknote")) return "vendor-blocknote";
					if (id.includes("@xyflow") || id.includes("react-flow"))
						return "vendor-xyflow";
					if (id.includes("react-force-graph") || id.includes("three"))
						return "vendor-3d";
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
		include: ["src/**/*.test.{ts,tsx}", "electron/**/*.test.ts"],
		setupFiles: ["./src/test/setup.tsx"],
		coverage: {
			provider: "v8",
			include: ["src/**/*.{ts,tsx}", "electron/**/*.ts"],
			exclude: [
				"src/**/*.test.{ts,tsx}",
				"electron/**/*.test.ts",
				"src/test/**",
				"src/main.tsx",
				"src/vite-env.d.ts",
			],
			thresholds: {
				lines: 60,
				functions: 60,
				branches: 55,
				statements: 60,
			},
		},
	},
});
