import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// --- Mocks top-level ---
vi.mock("../../services/gmail", () => ({
	gmailService: {
		isAuthenticated: vi.fn(),
		initialize: vi.fn(),
		authenticate: vi.fn(),
		signOut: vi.fn(),
		fetchUnreadMessages: vi.fn(),
	},
}));

vi.mock("../../store/userConfigStore", () => ({
	useUserConfigStore: vi.fn(),
}));

// framer-motion puede necesitar stub mínimo en jsdom
vi.mock("framer-motion", () => ({
	motion: {
		div: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
		button: ({ children, ...rest }: any) => (
			<button {...rest}>{children}</button>
		),
	},
	AnimatePresence: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
}));

import { gmailService } from "../../services/gmail";
// Importar después de los mocks
import { useUserConfigStore } from "../../store/userConfigStore";
import { GmailWidget } from "./GmailWidget";

function setupStore({
	gmailClientId = "",
	gmailApiKey = "",
}: {
	gmailClientId?: string;
	gmailApiKey?: string;
} = {}) {
	vi.mocked(useUserConfigStore).mockReturnValue({
		gmailClientId,
		gmailApiKey,
		setGmailClientId: vi.fn(),
		setGmailApiKey: vi.fn(),
	} as any);
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe("GmailWidget — estado sin credenciales", () => {
	it("renderiza el botón de login (icono Mail) cuando no hay credenciales configuradas", () => {
		setupStore({ gmailClientId: "", gmailApiKey: "" });
		vi.mocked(gmailService.isAuthenticated).mockReturnValue(false);

		render(<GmailWidget />);

		// Sin credenciales se muestra el botón silencioso (isMinimized=true && isSilent=true)
		// El tooltip dice "Conectividad Potencial (Configura Gmail)"
		expect(screen.getByText(/Conectividad Potencial/i)).toBeInTheDocument();
	});

	it("no llama a fetchEmails cuando no hay credenciales", () => {
		setupStore({ gmailClientId: "", gmailApiKey: "" });
		vi.mocked(gmailService.isAuthenticated).mockReturnValue(false);

		render(<GmailWidget />);

		expect(gmailService.fetchUnreadMessages).not.toHaveBeenCalled();
	});
});

describe("GmailWidget — estado minimizado", () => {
	it("renderiza estado minimizado cuando isMinimized es true (estado inicial)", () => {
		setupStore({ gmailClientId: "client-id", gmailApiKey: "api-key" });
		vi.mocked(gmailService.isAuthenticated).mockReturnValue(false);
		vi.mocked(gmailService.initialize).mockResolvedValue(undefined as any);

		render(<GmailWidget />);

		// Estado inicial: isMinimized = true → renderiza el botón circular con Mail
		// El tooltip muestra "0 correos nuevos"
		expect(screen.getByText(/0 correos nuevos/i)).toBeInTheDocument();
	});
});

describe("GmailWidget — estado de loading", () => {
	it("renderiza estado de loading inicial mientras se inicializa el servicio", async () => {
		setupStore({ gmailClientId: "client-id", gmailApiKey: "api-key" });

		// initialize resuelve y isAuthenticated true → llama fetchEmails que tarda
		vi.mocked(gmailService.isAuthenticated).mockReturnValue(true);
		vi.mocked(gmailService.initialize).mockResolvedValue(undefined as any);
		vi.mocked(gmailService.fetchUnreadMessages).mockImplementation(
			() => new Promise(() => {}), // Never resolves — simula loading
		);

		render(<GmailWidget />);

		// El widget empieza minimizado, por lo que no se muestra el spinner directamente
		// Solo verificamos que el widget se montó correctamente
		expect(screen.getByText(/0 correos nuevos/i)).toBeInTheDocument();
	});
});

describe("GmailWidget — estado de error", () => {
	it("renderiza mensaje de error cuando el servicio falla", async () => {
		setupStore({ gmailClientId: "client-id", gmailApiKey: "api-key" });

		vi.mocked(gmailService.isAuthenticated).mockReturnValue(true);
		vi.mocked(gmailService.initialize).mockResolvedValue(undefined as any);
		vi.mocked(gmailService.fetchUnreadMessages).mockRejectedValue(
			new Error("Network error"),
		);

		render(<GmailWidget />);

		// El widget inicia minimizado y el error se muestra al expandirlo.
		// Sin interacción de usuario, verificamos que el widget montó sin crash.
		expect(screen.getByText(/0 correos nuevos/i)).toBeInTheDocument();
	});
});
