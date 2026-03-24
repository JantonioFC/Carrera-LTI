import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GmailService } from "./gmail";

/**
 * Tests unitarios de GmailService.
 * Se mockean window.gapi y window.google para aislar la lógica
 * del servicio sin depender de las librerías de Google.
 * Ref: Issue #82 — v3.3.0 Testing Coverage
 */

// Helpers para construir mocks de gapi y google reutilizables
function makeGapiMock(overrides: Record<string, unknown> = {}) {
	return {
		load: vi.fn(
			(
				_lib: string,
				cbs: { callback: () => void; onerror: (e: unknown) => void },
			) => {
				cbs.callback();
			},
		),
		client: {
			init: vi.fn().mockResolvedValue(undefined),
			getToken: vi.fn().mockReturnValue(null),
			setToken: vi.fn(),
			gmail: {
				users: {
					messages: {
						list: vi.fn().mockResolvedValue({
							result: { messages: [] },
						}),
						get: vi.fn(),
					},
				},
			},
		},
		...overrides,
	};
}

function makeGoogleMock() {
	return {
		accounts: {
			oauth2: {
				initTokenClient: vi.fn().mockReturnValue({
					callback: "",
					requestAccessToken: vi.fn(),
				}),
				revoke: vi.fn(),
			},
		},
	};
}

function resetSingleton() {
	(GmailService as unknown as { instance: GmailService | undefined }).instance =
		undefined;
}

beforeEach(() => {
	resetSingleton();
	(window as unknown as { gapi: unknown }).gapi = makeGapiMock();
	(window as unknown as { google: unknown }).google = makeGoogleMock();
});

afterEach(() => {
	resetSingleton();
	vi.restoreAllMocks();
});

// ─── initialize ─────────────────────────────────────────────────────────────

describe("GmailService.initialize", () => {
	it("no hace nada si clientId está vacío", async () => {
		const svc = GmailService.getInstance();
		await svc.initialize("", "api-key");
		expect(window.gapi.load).not.toHaveBeenCalled();
	});

	it("no hace nada si apiKey está vacío", async () => {
		const svc = GmailService.getInstance();
		await svc.initialize("client-id", "");
		expect(window.gapi.load).not.toHaveBeenCalled();
	});

	it("llama a gapi.load con 'client'", async () => {
		const svc = GmailService.getInstance();
		await svc.initialize("client-id", "api-key");
		expect(window.gapi.load).toHaveBeenCalledWith(
			"client",
			expect.objectContaining({ callback: expect.any(Function) }),
		);
	});

	it("llama a gapi.client.init con apiKey y discoveryDocs", async () => {
		const svc = GmailService.getInstance();
		await svc.initialize("client-id", "mi-api-key");
		expect(window.gapi.client.init).toHaveBeenCalledWith(
			expect.objectContaining({ apiKey: "mi-api-key" }),
		);
	});

	it("inicializa el tokenClient con el clientId", async () => {
		const svc = GmailService.getInstance();
		await svc.initialize("my-client-id", "api-key");
		expect(window.google.accounts.oauth2.initTokenClient).toHaveBeenCalledWith(
			expect.objectContaining({ client_id: "my-client-id" }),
		);
	});

	it("no reinicializa GAPI si ya está inicializado", async () => {
		const svc = GmailService.getInstance();
		await svc.initialize("client-id", "api-key");
		await svc.initialize("client-id", "api-key");
		expect(window.gapi.client.init).toHaveBeenCalledTimes(1);
	});

	it("lanza si gapi.load llama a onerror", async () => {
		(window.gapi.load as ReturnType<typeof vi.fn>).mockImplementation(
			(
				_lib: string,
				cbs: { callback: () => void; onerror: (e: unknown) => void },
			) => {
				cbs.onerror(new Error("load failed"));
			},
		);
		const svc = GmailService.getInstance();
		await expect(svc.initialize("client-id", "api-key")).rejects.toThrow(
			"load failed",
		);
	});
});

// ─── authenticate ────────────────────────────────────────────────────────────

describe("GmailService.authenticate", () => {
	it("lanza si el tokenClient no fue inicializado", async () => {
		const svc = GmailService.getInstance();
		// Sin llamar a initialize primero
		await expect(svc.authenticate()).rejects.toThrow(
			"Google GIS client not initialized",
		);
	});

	it("resuelve cuando el callback no contiene error", async () => {
		const svc = GmailService.getInstance();
		await svc.initialize("client-id", "api-key");

		// Simular que requestAccessToken dispara el callback con éxito
		const tokenClient = (
			window.google.accounts.oauth2.initTokenClient as ReturnType<typeof vi.fn>
		).mock.results[0].value;
		tokenClient.requestAccessToken = vi.fn(() => {
			(tokenClient.callback as (r: { error?: string }) => void)({});
		});

		await expect(svc.authenticate()).resolves.toBeUndefined();
	});

	it("rechaza cuando el callback contiene error", async () => {
		const svc = GmailService.getInstance();
		await svc.initialize("client-id", "api-key");

		const tokenClient = (
			window.google.accounts.oauth2.initTokenClient as ReturnType<typeof vi.fn>
		).mock.results[0].value;
		tokenClient.requestAccessToken = vi.fn(() => {
			(tokenClient.callback as (r: { error?: string }) => void)({
				error: "access_denied",
			});
		});

		await expect(svc.authenticate()).rejects.toBeDefined();
	});

	it("solicita con prompt='consent' cuando no hay token activo", async () => {
		window.gapi.client.getToken = vi.fn().mockReturnValue(null);
		const svc = GmailService.getInstance();
		await svc.initialize("client-id", "api-key");

		const tokenClient = (
			window.google.accounts.oauth2.initTokenClient as ReturnType<typeof vi.fn>
		).mock.results[0].value;
		tokenClient.requestAccessToken = vi.fn((opts: { prompt: string }) => {
			expect(opts.prompt).toBe("consent");
			(tokenClient.callback as (r: { error?: string }) => void)({});
		});

		await svc.authenticate();
	});

	it("solicita con prompt='' cuando ya hay token activo", async () => {
		window.gapi.client.getToken = vi
			.fn()
			.mockReturnValue({ access_token: "tok" });
		const svc = GmailService.getInstance();
		await svc.initialize("client-id", "api-key");

		const tokenClient = (
			window.google.accounts.oauth2.initTokenClient as ReturnType<typeof vi.fn>
		).mock.results[0].value;
		tokenClient.requestAccessToken = vi.fn((opts: { prompt: string }) => {
			expect(opts.prompt).toBe("");
			(tokenClient.callback as (r: { error?: string }) => void)({});
		});

		await svc.authenticate();
	});
});

// ─── fetchUnreadMessages ─────────────────────────────────────────────────────

describe("GmailService.fetchUnreadMessages", () => {
	it("lanza si GAPI no está inicializado", async () => {
		const svc = GmailService.getInstance();
		await expect(svc.fetchUnreadMessages()).rejects.toThrow(
			"GAPI not initialized",
		);
	});

	it("retorna array vacío si no hay mensajes no leídos", async () => {
		window.gapi.client.gmail.users.messages.list = vi
			.fn()
			.mockResolvedValue({ result: { messages: [] } });
		const svc = GmailService.getInstance();
		await svc.initialize("client-id", "api-key");

		const result = await svc.fetchUnreadMessages();
		expect(result).toEqual([]);
	});

	it("retorna mensajes con subject, from y snippet correctos", async () => {
		const headers = [
			{ name: "Subject", value: "Notas del examen" },
			{ name: "From", value: "prof@universidad.edu" },
			{ name: "Date", value: "Mon, 24 Mar 2025" },
		];
		window.gapi.client.gmail.users.messages.list = vi.fn().mockResolvedValue({
			result: { messages: [{ id: "m1", threadId: "t1" }] },
		});
		window.gapi.client.gmail.users.messages.get = vi.fn().mockResolvedValue({
			result: {
				snippet: "El examen será el viernes",
				payload: { headers },
			},
		});

		const svc = GmailService.getInstance();
		await svc.initialize("client-id", "api-key");

		const messages = await svc.fetchUnreadMessages();
		expect(messages).toHaveLength(1);
		expect(messages[0].subject).toBe("Notas del examen");
		expect(messages[0].from).toBe("prof@universidad.edu");
		expect(messages[0].snippet).toBe("El examen será el viernes");
	});

	it("usa '(Sin asunto)' cuando Subject no está en headers", async () => {
		window.gapi.client.gmail.users.messages.list = vi.fn().mockResolvedValue({
			result: { messages: [{ id: "m2", threadId: "t2" }] },
		});
		window.gapi.client.gmail.users.messages.get = vi.fn().mockResolvedValue({
			result: {
				snippet: "texto",
				payload: { headers: [{ name: "From", value: "alguien@mail.com" }] },
			},
		});

		const svc = GmailService.getInstance();
		await svc.initialize("client-id", "api-key");
		const messages = await svc.fetchUnreadMessages();
		expect(messages[0].subject).toBe("(Sin asunto)");
	});

	it("usa 'Desconocido' cuando From no está en headers", async () => {
		window.gapi.client.gmail.users.messages.list = vi.fn().mockResolvedValue({
			result: { messages: [{ id: "m3", threadId: "t3" }] },
		});
		window.gapi.client.gmail.users.messages.get = vi.fn().mockResolvedValue({
			result: {
				snippet: "texto",
				payload: {
					headers: [{ name: "Subject", value: "Hola" }],
				},
			},
		});

		const svc = GmailService.getInstance();
		await svc.initialize("client-id", "api-key");
		const messages = await svc.fetchUnreadMessages();
		expect(messages[0].from).toBe("Desconocido");
	});

	it("respeta el parámetro maxResults", async () => {
		window.gapi.client.gmail.users.messages.list = vi
			.fn()
			.mockResolvedValue({ result: { messages: [] } });
		const svc = GmailService.getInstance();
		await svc.initialize("client-id", "api-key");
		await svc.fetchUnreadMessages(20);
		expect(window.gapi.client.gmail.users.messages.list).toHaveBeenCalledWith(
			expect.objectContaining({ maxResults: 20 }),
		);
	});
});

// ─── isAuthenticated / signOut ───────────────────────────────────────────────

describe("GmailService.isAuthenticated", () => {
	it("retorna false cuando getToken devuelve null", () => {
		window.gapi.client.getToken = vi.fn().mockReturnValue(null);
		const svc = GmailService.getInstance();
		expect(svc.isAuthenticated()).toBe(false);
	});

	it("retorna true cuando getToken devuelve un token", () => {
		window.gapi.client.getToken = vi
			.fn()
			.mockReturnValue({ access_token: "tok123" });
		const svc = GmailService.getInstance();
		expect(svc.isAuthenticated()).toBe(true);
	});
});

describe("GmailService.signOut", () => {
	it("llama a revoke y setToken si hay token activo", () => {
		window.gapi.client.getToken = vi
			.fn()
			.mockReturnValue({ access_token: "tok123" });
		const svc = GmailService.getInstance();
		svc.signOut();
		expect(window.google.accounts.oauth2.revoke).toHaveBeenCalledWith("tok123");
		expect(window.gapi.client.setToken).toHaveBeenCalledWith("");
	});

	it("no llama a revoke si no hay token", () => {
		window.gapi.client.getToken = vi.fn().mockReturnValue(null);
		const svc = GmailService.getInstance();
		svc.signOut();
		expect(window.google.accounts.oauth2.revoke).not.toHaveBeenCalled();
	});
});
