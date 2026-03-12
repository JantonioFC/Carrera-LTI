/// <reference types="vitest" />

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		tailwindcss(),
		react(),
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
		}),
	],
	server: {
		port: 5173,
	},
	build: {
		cssMinify: false,
		rollupOptions: {
			output: {
				manualChunks: {
					"vendor-ai": ["@google/genai"],
					"vendor-ui": [
						"framer-motion",
						"recharts",
						"lucide-react",
						"@radix-ui/react-dialog",
						"@uiw/react-md-editor",
					],
				},
			},
		},
	},
	test: {
		environment: "jsdom",
		globals: true,
		include: ["src/**/*.test.{ts,tsx}"],
	},
});
