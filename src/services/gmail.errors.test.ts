import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GmailService } from "./gmail";

/**
 * Tests de error paths de GmailService: OAuth 401, 403, token expirado,
 * errores de fetch, GSI no cargado, y otros caminos de fallo.
 * Ref: Issue #82 — v3.3.0 Testing Coverage
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

/** Inicializa el servicio y devuelve el tokenClient del mock para manipularlo */
async function initializeService(svc: GmailService) {
	await svc.initialize("client-id", "api-key");
	return (
		window.google.accounts.oauth2.initTokenClient as ReturnType<typeof vi.fn>
	).mock.results[0].value;
}

// ─── Setup / Teardown ────────────────────────────────────────────────────────

beforeEach(() => {
	resetSingleton();
	(window as unknown as { gapi: unknown }).gapi = makeGapiMock();
	(window as unknown as { google: unknown }).google = makeGoogleMock();
});

afterEach(() => {
	resetSingleton();
	vi.restoreAllMocks();
});

// ─── initialize — error paths ────────────────────────────────────────────────

describe("GmailService.initialize — error paths", () => {
	it("lanza cuando gapi.client.init rechaza", async () => {
		window.gapi.client.init = vi
			.fn()
			.mockRejectedValue(new Error("init failed"));
		const svc = GmailService.getInstance();
		await expect(svc.initialize("client-id", "api-key")).rejects.toThrow(
			"init failed",
		);
	});

	it("lanza cuando GSI (window.google.accounts.oauth2) no está cargado", async () => {
		(
			window as unknown as { google: { accounts: Record<string, unknown> } }
		).google = {
			accounts: {},
		};
		const svc = GmailService.getInstance();
		await expect(svc.initialize("client-id", "api-key")).rejects.toThrow(
			"Google Identity Services (GSI) not loaded",
		);
	});

	it("lanza cuando window.google no existe", async () => {
		(window as unknown as { google: unknown }).google = undefined;
		const svc = GmailService.getInstance();
		await expect(svc.initialize("client-id", "api-key")).rejects.toThrow();
	});

	it("no reinicializa GSI si ya estaba inicializado", async () => {
		const svc = GmailService.getInstance();
		await svc.initialize("client-id", "api-key");
		await svc.initialize("client-id", "api-key");
		expect(window.google.accounts.oauth2.initTokenClient).toHaveBeenCalledTimes(
			1,
		);
	});
});

// ─── authenticate — error paths OAuth ────────────────────────────────────────

describe("GmailService.authenticate — error paths OAuth", () => {
	it("rechaza con error 'access_denied' (usuario cancela el consentimiento)", async () => {
		const svc = GmailService.getInstance();
		const tokenClient = await initializeService(svc);

		tokenClient.requestAccessToken = vi.fn(() => {
			(tokenClient.callback as (r: { error: string }) => void)({
				error: "access_denied",
			});
		});

		await expect(svc.authenticate()).rejects.toMatchObject({
			error: "access_denied",
		});
	});

	it("rechaza con error 'token_expired' (token expirado)", async () => {
		const svc = GmailService.getInstance();
		const tokenClient = await initializeService(svc);

		tokenClient.requestAccessToken = vi.fn(() => {
			(tokenClient.callback as (r: { error: string }) => void)({
				error: "token_expired",
			});
		});

		await expect(svc.authenticate()).rejects.toMatchObject({
			error: "token_expired",
		});
	});

	it("rechaza con error 'invalid_token' (token inválido / 401)", async () => {
		const svc = GmailService.getInstance();
		const tokenClient = await initializeService(svc);

		tokenClient.requestAccessToken = vi.fn(() => {
			(tokenClient.callback as (r: { error: string }) => void)({
				error: "invalid_token",
			});
		});

		await expect(svc.authenticate()).rejects.toMatchObject({
			error: "invalid_token",
		});
	});

	it("rechaza con error 'unauthorized_client' (403 — cliente no autorizado)", async () => {
		const svc = GmailService.getInstance();
		const tokenClient = await initializeService(svc);

		tokenClient.requestAccessToken = vi.fn(() => {
			(tokenClient.callback as (r: { error: string }) => void)({
				error: "unauthorized_client",
			});
		});

		await expect(svc.authenticate()).rejects.toMatchObject({
			error: "unauthorized_client",
		});
	});

	it("rechaza con error 'insufficient_scope' (403 — permisos insuficientes)", async () => {
		const svc = GmailService.getInstance();
		const tokenClient = await initializeService(svc);

		tokenClient.requestAccessToken = vi.fn(() => {
			(tokenClient.callback as (r: { error: string }) => void)({
				error: "insufficient_scope",
			});
		});

		await expect(svc.authenticate()).rejects.toMatchObject({
			error: "insufficient_scope",
		});
	});

	it("rechaza cuando requestAccessToken lanza una excepción síncrona", async () => {
		const svc = GmailService.getInstance();
		const tokenClient = await initializeService(svc);

		tokenClient.requestAccessToken = vi.fn(() => {
			throw new Error("requestAccessToken sync error");
		});

		await expect(svc.authenticate()).rejects.toThrow(
			"requestAccessToken sync error",
		);
	});

	it("rechaza con 'popup_closed_by_user' (usuario cierra el popup OAuth)", async () => {
		const svc = GmailService.getInstance();
		const tokenClient = await initializeService(svc);

		tokenClient.requestAccessToken = vi.fn(() => {
			(tokenClient.callback as (r: { error: string }) => void)({
				error: "popup_closed_by_user",
			});
		});

		await expect(svc.authenticate()).rejects.toMatchObject({
			error: "popup_closed_by_user",
		});
	});
});

// ─── fetchUnreadMessages — error paths HTTP ───────────────────────────────────

describe("GmailService.fetchUnreadMessages — error paths HTTP", () => {
	it("relanza un error 401 de la API (Unauthorized)", async () => {
		const unauthorizedError = Object.assign(new Error("Unauthorized"), {
			status: 401,
			result: {
				error: {
					code: 401,
					message: "Request had invalid authentication credentials.",
				},
			},
		});
		window.gapi.client.gmail.users.messages.list = vi
			.fn()
			.mockRejectedValue(unauthorizedError);

		const svc = GmailService.getInstance();
		await svc.initialize("client-id", "api-key");

		await expect(svc.fetchUnreadMessages()).rejects.toMatchObject({
			status: 401,
		});
	});

	it("relanza un error 403 de la API (Forbidden / permisos insuficientes)", async () => {
		const forbiddenError = Object.assign(new Error("Forbidden"), {
			status: 403,
			result: {
				error: {
					code: 403,
					message: "Request had insufficient authentication scopes.",
				},
			},
		});
		window.gapi.client.gmail.users.messages.list = vi
			.fn()
			.mockRejectedValue(forbiddenError);

		const svc = GmailService.getInstance();
		await svc.initialize("client-id", "api-key");

		await expect(svc.fetchUnreadMessages()).rejects.toMatchObject({
			status: 403,
		});
	});

	it("relanza un error de red (fetch failed)", async () => {
		window.gapi.client.gmail.users.messages.list = vi
			.fn()
			.mockRejectedValue(new TypeError("Failed to fetch"));

		const svc = GmailService.getInstance();
		await svc.initialize("client-id", "api-key");

		await expect(svc.fetchUnreadMessages()).rejects.toThrow("Failed to fetch");
	});

	it("relanza un error 401 cuando messages.get falla (token expirado durante el fetch)", async () => {
		window.gapi.client.gmail.users.messages.list = vi.fn().mockResolvedValue({
			result: { messages: [{ id: "m1", threadId: "t1" }] },
		});
		const expiredTokenError = Object.assign(new Error("Unauthorized"), {
			status: 401,
			result: { error: { code: 401, message: "Invalid Credentials" } },
		});
		window.gapi.client.gmail.users.messages.get = vi
			.fn()
			.mockRejectedValue(expiredTokenError);

		const svc = GmailService.getInstance();
		await svc.initialize("client-id", "api-key");

		await expect(svc.fetchUnreadMessages()).rejects.toMatchObject({
			status: 401,
		});
	});

	it("relanza un error 403 cuando messages.get falla por permisos", async () => {
		window.gapi.client.gmail.users.messages.list = vi.fn().mockResolvedValue({
			result: { messages: [{ id: "m2", threadId: "t2" }] },
		});
		const forbiddenError = Object.assign(new Error("Forbidden"), {
			status: 403,
			result: { error: { code: 403, message: "Insufficient Permission" } },
		});
		window.gapi.client.gmail.users.messages.get = vi
			.fn()
			.mockRejectedValue(forbiddenError);

		const svc = GmailService.getInstance();
		await svc.initialize("client-id", "api-key");

		await expect(svc.fetchUnreadMessages()).rejects.toMatchObject({
			status: 403,
		});
	});

	it("maneja lista de mensajes con resultado undefined (messages: undefined)", async () => {
		window.gapi.client.gmail.users.messages.list = vi.fn().mockResolvedValue({
			result: { messages: undefined },
		});

		const svc = GmailService.getInstance();
		await svc.initialize("client-id", "api-key");

		const result = await svc.fetchUnreadMessages();
		expect(result).toEqual([]);
	});

	it("relanza un error 429 de la API (Rate Limit Exceeded)", async () => {
		const rateLimitError = Object.assign(new Error("Too Many Requests"), {
			status: 429,
			result: { error: { code: 429, message: "Rate Limit Exceeded" } },
		});
		window.gapi.client.gmail.users.messages.list = vi
			.fn()
			.mockRejectedValue(rateLimitError);

		const svc = GmailService.getInstance();
		await svc.initialize("client-id", "api-key");

		await expect(svc.fetchUnreadMessages()).rejects.toMatchObject({
			status: 429,
		});
	});

	it("relanza error 500 del servidor de Gmail", async () => {
		const serverError = Object.assign(new Error("Internal Server Error"), {
			status: 500,
			result: { error: { code: 500, message: "Backend Error" } },
		});
		window.gapi.client.gmail.users.messages.list = vi
			.fn()
			.mockRejectedValue(serverError);

		const svc = GmailService.getInstance();
		await svc.initialize("client-id", "api-key");

		await expect(svc.fetchUnreadMessages()).rejects.toMatchObject({
			status: 500,
		});
	});
});

// ─── isAuthenticated — edge cases ────────────────────────────────────────────

describe("GmailService.isAuthenticated — edge cases", () => {
	it("retorna true (falso positivo) cuando window.gapi no existe — bug conocido", () => {
		// window.gapi?.client?.getToken() devuelve undefined cuando gapi no existe.
		// undefined !== null es true, por lo que el método retorna true erróneamente.
		// Este test documenta el comportamiento actual del código.
		(window as unknown as { gapi: unknown }).gapi = undefined;
		const svc = GmailService.getInstance();
		expect(svc.isAuthenticated()).toBe(true);
	});

	it("retorna true (falso positivo) cuando window.gapi.client no existe — bug conocido", () => {
		// Mismo comportamiento: getToken() no existe, devuelve undefined,
		// y undefined !== null es true.
		(window as unknown as { gapi: unknown }).gapi = {};
		const svc = GmailService.getInstance();
		expect(svc.isAuthenticated()).toBe(true);
	});
});

// ─── signOut — edge cases ────────────────────────────────────────────────────

describe("GmailService.signOut — edge cases", () => {
	it("lanza TypeError cuando window.gapi no existe — bug conocido", () => {
		// window.gapi?.client?.getToken() devuelve undefined (no null),
		// entonces entra al bloque if (token !== null) e intenta acceder
		// a token.access_token en undefined, causando TypeError.
		(window as unknown as { gapi: unknown }).gapi = undefined;
		const svc = GmailService.getInstance();
		expect(() => svc.signOut()).toThrow(TypeError);
	});

	it("lanza TypeError cuando window.gapi.client no existe — bug conocido", () => {
		// Mismo comportamiento: getToken es undefined, se invoca como función
		// y lanza TypeError.
		(window as unknown as { gapi: unknown }).gapi = {};
		const svc = GmailService.getInstance();
		expect(() => svc.signOut()).toThrow(TypeError);
	});

	it("llama a revoke con el access_token correcto al hacer signOut", () => {
		window.gapi.client.getToken = vi
			.fn()
			.mockReturnValue({ access_token: "expired-token-abc" });
		const svc = GmailService.getInstance();
		svc.signOut();
		expect(window.google.accounts.oauth2.revoke).toHaveBeenCalledWith(
			"expired-token-abc",
		);
		expect(window.gapi.client.setToken).toHaveBeenCalledWith("");
	});
});
